import type { GameStatus, TileFeedback } from '@wordle/shared';
import type { AppDatabase } from '../db/database.js';

export interface GameRow {
  id: number;
  playerCode: string;
  answer: string;
  status: GameStatus;
  attemptCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface GuessRow {
  id: number;
  gameId: number;
  attemptNumber: number;
  guess: string;
  feedback: TileFeedback[];
  createdAt: string;
}

interface RawGameRow {
  id: number;
  player_code: string;
  answer: string;
  status: GameStatus;
  attempt_count: number;
  created_at: string;
  completed_at: string | null;
}

interface RawGuessRow {
  id: number;
  game_id: number;
  attempt_number: number;
  guess: string;
  feedback_json: string;
  created_at: string;
}

function mapGame(row: RawGameRow): GameRow {
  return {
    id: row.id,
    playerCode: row.player_code,
    answer: row.answer,
    status: row.status,
    attemptCount: row.attempt_count,
    createdAt: row.created_at,
    completedAt: row.completed_at
  };
}

function mapGuess(row: RawGuessRow): GuessRow {
  return {
    id: row.id,
    gameId: row.game_id,
    attemptNumber: row.attempt_number,
    guess: row.guess,
    feedback: JSON.parse(row.feedback_json) as TileFeedback[],
    createdAt: row.created_at
  };
}

export function createGameRepository(db: AppDatabase) {
  return {
    create(playerCode: string, answer: string): GameRow {
      const result = db
        .prepare('INSERT INTO games (player_code, answer, status) VALUES (?, ?, ?)')
        .run(playerCode, answer, 'active');
      return this.findById(Number(result.lastInsertRowid))!;
    },
    findById(id: number): GameRow | null {
      const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as RawGameRow | undefined;
      return row ? mapGame(row) : null;
    },
    findActiveByPlayerCode(playerCode: string): GameRow | null {
      const row = db
        .prepare("SELECT * FROM games WHERE player_code = ? AND status = 'active'")
        .get(playerCode) as RawGameRow | undefined;
      return row ? mapGame(row) : null;
    },
    listRecentByPlayerCode(playerCode: string, limit = 10): GameRow[] {
      const rows = db
        .prepare("SELECT * FROM games WHERE player_code = ? AND status != 'active' ORDER BY id DESC LIMIT ?")
        .all(playerCode, limit) as unknown as RawGameRow[];
      return rows.map(mapGame);
    },
    addGuess(gameId: number, attemptNumber: number, guess: string, feedback: TileFeedback[]): GuessRow {
      const result = db
        .prepare('INSERT INTO guesses (game_id, attempt_number, guess, feedback_json) VALUES (?, ?, ?, ?)')
        .run(gameId, attemptNumber, guess, JSON.stringify(feedback));
      return this.listGuesses(gameId).find((row) => row.id === Number(result.lastInsertRowid))!;
    },
    listGuesses(gameId: number): GuessRow[] {
      const rows = db
        .prepare('SELECT * FROM guesses WHERE game_id = ? ORDER BY attempt_number ASC')
        .all(gameId) as unknown as RawGuessRow[];
      return rows.map(mapGuess);
    },
    updateAttemptCount(id: number, attemptCount: number): void {
      db.prepare('UPDATE games SET attempt_count = ? WHERE id = ?').run(attemptCount, id);
    },
    complete(id: number, status: Exclude<GameStatus, 'active'>, attemptCount: number): void {
      db.prepare('UPDATE games SET status = ?, attempt_count = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        status,
        attemptCount,
        id
      );
    }
  };
}

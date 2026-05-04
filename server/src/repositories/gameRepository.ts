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
  created_at: Date | string;
  completed_at: Date | string | null;
}

interface RawGuessRow {
  id: number;
  game_id: number;
  attempt_number: number;
  guess: string;
  feedback_json: TileFeedback[] | string;
  created_at: Date | string;
}

function serializeDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapGame(row: RawGameRow): GameRow {
  return {
    id: row.id,
    playerCode: row.player_code,
    answer: row.answer,
    status: row.status,
    attemptCount: row.attempt_count,
    createdAt: serializeDate(row.created_at),
    completedAt: row.completed_at ? serializeDate(row.completed_at) : null
  };
}

function mapGuess(row: RawGuessRow): GuessRow {
  const feedback = typeof row.feedback_json === 'string'
    ? JSON.parse(row.feedback_json) as TileFeedback[]
    : row.feedback_json;

  return {
    id: row.id,
    gameId: row.game_id,
    attemptNumber: row.attempt_number,
    guess: row.guess,
    feedback,
    createdAt: serializeDate(row.created_at)
  };
}

export function createGameRepository(db: AppDatabase) {
  return {
    async create(playerCode: string, answer: string): Promise<GameRow> {
      const result = await db.query<RawGameRow>(
        "INSERT INTO games (player_code, answer, status) VALUES ($1, $2, 'active') RETURNING *",
        [playerCode, answer]
      );
      return mapGame(result.rows[0]);
    },
    async findById(id: number): Promise<GameRow | null> {
      const result = await db.query<RawGameRow>('SELECT * FROM games WHERE id = $1', [id]);
      return result.rows[0] ? mapGame(result.rows[0]) : null;
    },
    async findActiveByPlayerCode(playerCode: string): Promise<GameRow | null> {
      const result = await db.query<RawGameRow>(
        "SELECT * FROM games WHERE player_code = $1 AND status = 'active'",
        [playerCode]
      );
      return result.rows[0] ? mapGame(result.rows[0]) : null;
    },
    async listRecentByPlayerCode(playerCode: string, limit = 10): Promise<GameRow[]> {
      const safeLimit = Math.max(1, Math.min(50, Math.trunc(limit)));
      const result = await db.query<RawGameRow>(
        `SELECT * FROM games ORDER BY id DESC LIMIT ${safeLimit * 3}`
      );
      return result.rows
        .map(mapGame)
        .filter((game) => game.playerCode === playerCode && game.status !== 'active')
        .slice(0, safeLimit);
    },
    async addGuess(gameId: number, attemptNumber: number, guess: string, feedback: TileFeedback[]): Promise<GuessRow> {
      const result = await db.query<RawGuessRow>(
        'INSERT INTO guesses (game_id, attempt_number, guess, feedback_json) VALUES ($1, $2, $3, $4) RETURNING *',
        [gameId, attemptNumber, guess, JSON.stringify(feedback)]
      );
      return mapGuess(result.rows[0]);
    },
    async listGuesses(gameId: number): Promise<GuessRow[]> {
      const result = await db.query<RawGuessRow>(
        'SELECT * FROM guesses WHERE game_id = $1 ORDER BY attempt_number ASC',
        [gameId]
      );
      return result.rows.map(mapGuess);
    },
    async updateAttemptCount(id: number, attemptCount: number): Promise<void> {
      await db.query('UPDATE games SET attempt_count = $1 WHERE id = $2', [attemptCount, id]);
    },
    async complete(id: number, status: Exclude<GameStatus, 'active'>, attemptCount: number): Promise<void> {
      await db.query('UPDATE games SET status = $1, attempt_count = $2, completed_at = NOW() WHERE id = $3', [
        status,
        attemptCount,
        id
      ]);
    }
  };
}

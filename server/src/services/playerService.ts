import type { GameState, PlayerState, PlayerStats } from '@wordle/shared';
import type { GameRow, GuessRow, createGameRepository } from '../repositories/gameRepository.js';
import type { createPlayerRepository } from '../repositories/playerRepository.js';
import { generatePlayerCode } from './codeGenerator.js';

type PlayerRepository = ReturnType<typeof createPlayerRepository>;
type GameRepository = ReturnType<typeof createGameRepository>;

function toGameState(game: GameRow, guesses: GuessRow[]): GameState {
  return {
    id: game.id,
    playerCode: game.playerCode,
    status: game.status,
    answer: game.status === 'active' ? null : game.answer,
    attemptCount: game.attemptCount,
    guesses: guesses.map((guess) => ({
      id: guess.id,
      gameId: guess.gameId,
      attemptNumber: guess.attemptNumber,
      guess: guess.guess,
      feedback: guess.feedback,
      createdAt: guess.createdAt
    })),
    createdAt: game.createdAt,
    completedAt: game.completedAt
  };
}

function statsFor(games: GameRow[]): PlayerStats {
  const won = games.filter((game) => game.status === 'won').length;
  const lost = games.filter((game) => game.status === 'lost').length;
  return {
    played: won + lost,
    won,
    lost,
    currentStreak: 0
  };
}

export function createPlayerService(
  players: PlayerRepository,
  games: GameRepository,
  generateCode = generatePlayerCode
) {
  async function stateFor(code: string): Promise<PlayerState> {
    const player = await players.findByCode(code);
    if (!player) {
      throw new Error('Player not found.');
    }

    await players.touch(code);
    const active = await games.findActiveByPlayerCode(code);
    const recent = await games.listRecentByPlayerCode(code);

    return {
      code,
      activeGame: active ? toGameState(active, await games.listGuesses(active.id)) : null,
      recentGames: await Promise.all(recent.map(async (game) => toGameState(game, await games.listGuesses(game.id)))),
      stats: statsFor(recent)
    };
  }

  return {
    async createPlayer(): Promise<PlayerState> {
      let code = generateCode();
      while (await players.findByCode(code)) {
        code = generateCode();
      }
      await players.create(code);
      return stateFor(code);
    },
    resumePlayer(code: string): Promise<PlayerState> {
      return stateFor(code);
    }
  };
}

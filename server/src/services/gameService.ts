import { scoreGuess, validateGuess, type GameState } from '@wordle/shared';
import type { GameRow, GuessRow, createGameRepository } from '../repositories/gameRepository.js';
import type { createPlayerRepository } from '../repositories/playerRepository.js';
import { chooseAnswer } from './wordList.js';

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

export function createGameService(
  players: PlayerRepository,
  games: GameRepository,
  selectAnswer = chooseAnswer
) {
  async function ownedGame(id: number, playerCode: string) {
    const game = await games.findById(id);
    if (!game || game.playerCode !== playerCode) {
      throw new Error('Game not found.');
    }
    return game;
  }

  return {
    async startOrResumeGame(playerCode: string): Promise<GameState> {
      if (!(await players.findByCode(playerCode))) {
        throw new Error('Player not found.');
      }

      const active = (await games.findActiveByPlayerCode(playerCode)) ?? await games.create(playerCode, selectAnswer());
      return toGameState(active, await games.listGuesses(active.id));
    },
    async submitGuess(id: number, playerCode: string, rawGuess: string): Promise<GameState> {
      const game = await ownedGame(id, playerCode);
      if (game.status !== 'active') {
        throw new Error('Game is already complete.');
      }

      const validation = validateGuess(rawGuess);
      if (!validation.ok) {
        throw new Error(validation.message);
      }

      const attemptNumber = game.attemptCount + 1;
      const feedback = scoreGuess(game.answer, validation.value);
      await games.addGuess(game.id, attemptNumber, validation.value, feedback);

      if (validation.value === game.answer) {
        await games.complete(game.id, 'won', attemptNumber);
      } else if (attemptNumber >= 5) {
        await games.complete(game.id, 'lost', attemptNumber);
      } else {
        await games.updateAttemptCount(game.id, attemptNumber);
      }

      const updated = (await games.findById(game.id))!;
      return toGameState(updated, await games.listGuesses(game.id));
    },
    async getAnswer(id: number, playerCode: string): Promise<{ answer: string }> {
      const game = await ownedGame(id, playerCode);
      return { answer: game.answer };
    }
  };
}

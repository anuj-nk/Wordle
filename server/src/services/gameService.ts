import { scoreGuess, validateGuess, type GameState } from '@wordle/shared';
import type { GameRow, GuessRow, createGameRepository } from '../repositories/gameRepository.js';
import type { createPlayerRepository } from '../repositories/playerRepository.js';

type PlayerRepository = ReturnType<typeof createPlayerRepository>;
type GameRepository = ReturnType<typeof createGameRepository>;

const ANSWERS = ['crane', 'slate', 'proud', 'flint', 'cider'];

function chooseAnswer() {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

function toGameState(game: GameRow, guesses: GuessRow[]): GameState {
  return {
    id: game.id,
    playerCode: game.playerCode,
    status: game.status,
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
  function ownedGame(id: number, playerCode: string) {
    const game = games.findById(id);
    if (!game || game.playerCode !== playerCode) {
      throw new Error('Game not found.');
    }
    return game;
  }

  return {
    startOrResumeGame(playerCode: string): GameState {
      if (!players.findByCode(playerCode)) {
        throw new Error('Player not found.');
      }

      const active = games.findActiveByPlayerCode(playerCode) ?? games.create(playerCode, selectAnswer());
      return toGameState(active, games.listGuesses(active.id));
    },
    submitGuess(id: number, playerCode: string, rawGuess: string): GameState {
      const game = ownedGame(id, playerCode);
      if (game.status !== 'active') {
        throw new Error('Game is already complete.');
      }

      const validation = validateGuess(rawGuess);
      if (!validation.ok) {
        throw new Error(validation.message);
      }

      const attemptNumber = game.attemptCount + 1;
      const feedback = scoreGuess(game.answer, validation.value);
      games.addGuess(game.id, attemptNumber, validation.value, feedback);

      if (validation.value === game.answer) {
        games.complete(game.id, 'won', attemptNumber);
      } else if (attemptNumber >= 5) {
        games.complete(game.id, 'lost', attemptNumber);
      } else {
        games.updateAttemptCount(game.id, attemptNumber);
      }

      const updated = games.findById(game.id)!;
      return toGameState(updated, games.listGuesses(game.id));
    },
    getAnswer(id: number, playerCode: string): { answer: string } {
      const game = ownedGame(id, playerCode);
      return { answer: game.answer };
    }
  };
}

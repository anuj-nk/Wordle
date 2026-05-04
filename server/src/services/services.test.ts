import { describe, expect, it } from 'vitest';
import { openInMemoryDatabase } from '../db/database.js';
import { createGameRepository } from '../repositories/gameRepository.js';
import { createPlayerRepository } from '../repositories/playerRepository.js';
import { createGameService } from './gameService.js';
import { createPlayerService } from './playerService.js';

function services() {
  const db = openInMemoryDatabase();
  const players = createPlayerRepository(db);
  const games = createGameRepository(db);
  const playerService = createPlayerService(players, games, () => 'LIME-8472');
  const gameService = createGameService(players, games, () => 'crane');
  return { playerService, gameService };
}

describe('services', () => {
  it('creates a generated player code', () => {
    const { playerService } = services();

    expect(playerService.createPlayer().code).toBe('LIME-8472');
  });

  it('starts one active game per player', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();

    const first = gameService.startOrResumeGame(player.code);
    const second = gameService.startOrResumeGame(player.code);

    expect(second.id).toBe(first.id);
    expect(second.status).toBe('active');
  });

  it('submits winning guesses and stores feedback', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();
    const game = gameService.startOrResumeGame(player.code);

    const updated = gameService.submitGuess(game.id, player.code, 'crane');

    expect(updated.status).toBe('won');
    expect(updated.guesses).toHaveLength(1);
    expect(updated.guesses[0].feedback.every((tile) => tile.status === 'correct')).toBe(true);
  });

  it('hides active answers but includes completed answers in recent games', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();
    const game = gameService.startOrResumeGame(player.code);

    expect(game.answer).toBeNull();

    gameService.submitGuess(game.id, player.code, 'crane');
    const resumed = playerService.resumePlayer(player.code);

    expect(resumed.activeGame).toBeNull();
    expect(resumed.recentGames[0].answer).toBe('crane');
  });

  it('marks a game lost after five incorrect guesses', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();
    const game = gameService.startOrResumeGame(player.code);

    gameService.submitGuess(game.id, player.code, 'zzzzz');
    gameService.submitGuess(game.id, player.code, 'yyyyy');
    gameService.submitGuess(game.id, player.code, 'xxxxx');
    gameService.submitGuess(game.id, player.code, 'wwwww');
    const updated = gameService.submitGuess(game.id, player.code, 'vvvvv');

    expect(updated.status).toBe('lost');
    expect(updated.attemptCount).toBe(5);
  });

  it('rejects guesses for a different player code', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();
    const game = gameService.startOrResumeGame(player.code);

    expect(() => gameService.submitGuess(game.id, 'MINT-0001', 'crane')).toThrow('Game not found.');
  });
});

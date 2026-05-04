import { describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';
import type { Pool } from 'pg';
import { migrate } from '../db/schema.js';
import { createGameRepository } from '../repositories/gameRepository.js';
import { createPlayerRepository } from '../repositories/playerRepository.js';
import { createGameService } from './gameService.js';
import { createPlayerService } from './playerService.js';

async function services() {
  const mem = newDb();
  const { Pool: MemPool } = mem.adapters.createPg();
  const db = new MemPool() as Pool;
  await migrate(db);
  const players = createPlayerRepository(db);
  const games = createGameRepository(db);
  const playerService = createPlayerService(players, games, () => 'LIME8472');
  const gameService = createGameService(players, games, () => 'crane');
  return { db, playerService, gameService };
}

describe('services', () => {
  it('creates a generated player code', async () => {
    const { db, playerService } = await services();

    expect((await playerService.createPlayer()).code).toBe('LIME8472');
    await db.end();
  });

  it('starts one active game per player', async () => {
    const { db, playerService, gameService } = await services();
    const player = await playerService.createPlayer();

    const first = await gameService.startOrResumeGame(player.code);
    const second = await gameService.startOrResumeGame(player.code);

    expect(second.id).toBe(first.id);
    expect(second.status).toBe('active');
    await db.end();
  });

  it('submits winning guesses and stores feedback', async () => {
    const { db, playerService, gameService } = await services();
    const player = await playerService.createPlayer();
    const game = await gameService.startOrResumeGame(player.code);

    const updated = await gameService.submitGuess(game.id, player.code, 'crane');

    expect(updated.status).toBe('won');
    expect(updated.guesses).toHaveLength(1);
    expect(updated.guesses[0].feedback.every((tile) => tile.status === 'correct')).toBe(true);
    await db.end();
  });

  it('hides active answers but includes completed answers in recent games', async () => {
    const { db, playerService, gameService } = await services();
    const player = await playerService.createPlayer();
    const game = await gameService.startOrResumeGame(player.code);

    expect(game.answer).toBeNull();

    await gameService.submitGuess(game.id, player.code, 'crane');
    const resumed = await playerService.resumePlayer(player.code);

    expect(resumed.activeGame).toBeNull();
    expect(resumed.recentGames[0].answer).toBe('crane');
    await db.end();
  });

  it('marks a game lost after five incorrect guesses', async () => {
    const { db, playerService, gameService } = await services();
    const player = await playerService.createPlayer();
    const game = await gameService.startOrResumeGame(player.code);

    await gameService.submitGuess(game.id, player.code, 'zzzzz');
    await gameService.submitGuess(game.id, player.code, 'yyyyy');
    await gameService.submitGuess(game.id, player.code, 'xxxxx');
    await gameService.submitGuess(game.id, player.code, 'wwwww');
    const updated = await gameService.submitGuess(game.id, player.code, 'vvvvv');

    expect(updated.status).toBe('lost');
    expect(updated.attemptCount).toBe(5);
    await db.end();
  });

  it('rejects guesses for a different player code', async () => {
    const { db, playerService, gameService } = await services();
    const player = await playerService.createPlayer();
    const game = await gameService.startOrResumeGame(player.code);

    await expect(gameService.submitGuess(game.id, 'MINT-0001', 'crane')).rejects.toThrow('Game not found.');
    await db.end();
  });
});

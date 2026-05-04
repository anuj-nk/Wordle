import { newDb } from 'pg-mem';
import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';
import { migrate } from '../db/schema.js';
import { createGameRepository } from './gameRepository.js';
import { createPlayerRepository } from './playerRepository.js';

async function testDb() {
  const mem = newDb();
  const { Pool: MemPool } = mem.adapters.createPg();
  const db = new MemPool() as Pool;
  await migrate(db);
  return db;
}

describe('repositories', () => {
  it('creates and finds a player by code', async () => {
    const db = await testDb();
    const players = createPlayerRepository(db);

    const player = await players.create('LIME8472');

    expect(player.code).toBe('LIME8472');
    expect((await players.findByCode('LIME8472'))?.code).toBe('LIME8472');
    await db.end();
  });

  it('stores one active game and its guesses', async () => {
    const db = await testDb();
    const players = createPlayerRepository(db);
    const games = createGameRepository(db);
    await players.create('LIME8472');

    const game = await games.create('LIME8472', 'crane');
    const active = await games.findActiveByPlayerCode('LIME8472');
    await games.addGuess(game.id, 1, 'abcde', [{ letter: 'a', status: 'absent' }]);
    const guesses = await games.listGuesses(game.id);

    expect(active?.id).toBe(game.id);
    expect(guesses).toHaveLength(1);
    expect(guesses[0].feedback[0]).toEqual({ letter: 'a', status: 'absent' });
    await db.end();
  });

  it('marks a game completed', async () => {
    const db = await testDb();
    const players = createPlayerRepository(db);
    const games = createGameRepository(db);
    await players.create('LIME8472');
    const game = await games.create('LIME8472', 'crane');

    await games.complete(game.id, 'won', 3);

    expect((await games.findById(game.id))?.status).toBe('won');
    expect(await games.findActiveByPlayerCode('LIME8472')).toBeNull();
    await db.end();
  });
});

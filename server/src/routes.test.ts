import { newDb } from 'pg-mem';
import type { Pool } from 'pg';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { migrate } from './db/schema.js';

async function app() {
  const mem = newDb();
  const { Pool: MemPool } = mem.adapters.createPg();
  const db = new MemPool() as Pool;
  await migrate(db);
  return createApp(db, {
    generateCode: () => 'LIME8472',
    selectAnswer: () => 'crane'
  });
}

describe('api routes', () => {
  it('returns health status', async () => {
    const response = await request(await app()).get('/api/health').expect(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('creates and resumes a player', async () => {
    const server = await app();
    const created = await request(server).post('/api/players').expect(201);

    expect(created.body.code).toBe('LIME8472');

    const resumed = await request(server).get('/api/players/LIME8472').expect(200);
    expect(resumed.body.code).toBe('LIME8472');
  });

  it('starts a game, accepts a guess, and reveals the answer', async () => {
    const server = await app();
    await request(server).post('/api/players').expect(201);
    const game = await request(server).post('/api/games').send({ playerCode: 'LIME8472' }).expect(201);

    const guessed = await request(server)
      .post(`/api/games/${game.body.id}/guesses`)
      .send({ playerCode: 'LIME8472', guess: 'crane' })
      .expect(200);
    const answer = await request(server).get(`/api/games/${game.body.id}/answer?playerCode=LIME8472`).expect(200);

    expect(guessed.body.status).toBe('won');
    expect(answer.body.answer).toBe('crane');
  });

  it('returns consistent errors', async () => {
    const response = await request(await app()).get('/api/players/NOPE-0000').expect(404);
    expect(response.body).toEqual({ error: { code: 'not_found', message: 'Player not found.' } });
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { openInMemoryDatabase } from './db/database.js';

function app() {
  return createApp(openInMemoryDatabase(), {
    generateCode: () => 'LIME-8472',
    selectAnswer: () => 'crane'
  });
}

describe('api routes', () => {
  it('returns health status', async () => {
    const response = await request(app()).get('/api/health').expect(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('creates and resumes a player', async () => {
    const server = app();
    const created = await request(server).post('/api/players').expect(201);

    expect(created.body.code).toBe('LIME-8472');

    const resumed = await request(server).get('/api/players/LIME-8472').expect(200);
    expect(resumed.body.code).toBe('LIME-8472');
  });

  it('starts a game, accepts a guess, and reveals the answer', async () => {
    const server = app();
    await request(server).post('/api/players').expect(201);
    const game = await request(server).post('/api/games').send({ playerCode: 'LIME-8472' }).expect(201);

    const guessed = await request(server)
      .post(`/api/games/${game.body.id}/guesses`)
      .send({ playerCode: 'LIME-8472', guess: 'crane' })
      .expect(200);
    const answer = await request(server).get(`/api/games/${game.body.id}/answer?playerCode=LIME-8472`).expect(200);

    expect(guessed.body.status).toBe('won');
    expect(answer.body.answer).toBe('crane');
  });

  it('returns consistent errors', async () => {
    const response = await request(app()).get('/api/players/NOPE-0000').expect(404);
    expect(response.body).toEqual({ error: { code: 'not_found', message: 'Player not found.' } });
  });
});

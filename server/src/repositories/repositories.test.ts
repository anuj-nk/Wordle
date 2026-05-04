import { describe, expect, it } from 'vitest';
import { openInMemoryDatabase } from '../db/database.js';
import { createGameRepository } from './gameRepository.js';
import { createPlayerRepository } from './playerRepository.js';

describe('repositories', () => {
  it('creates and finds a player by code', () => {
    const db = openInMemoryDatabase();
    const players = createPlayerRepository(db);

    const player = players.create('LIME-8472');

    expect(player.code).toBe('LIME-8472');
    expect(players.findByCode('LIME-8472')?.code).toBe('LIME-8472');
  });

  it('stores one active game and its guesses', () => {
    const db = openInMemoryDatabase();
    const players = createPlayerRepository(db);
    const games = createGameRepository(db);
    players.create('LIME-8472');

    const game = games.create('LIME-8472', 'crane');
    const active = games.findActiveByPlayerCode('LIME-8472');
    games.addGuess(game.id, 1, 'abcde', [{ letter: 'a', status: 'absent' }]);
    const guesses = games.listGuesses(game.id);

    expect(active?.id).toBe(game.id);
    expect(guesses).toHaveLength(1);
    expect(guesses[0].feedback[0]).toEqual({ letter: 'a', status: 'absent' });
  });

  it('marks a game completed', () => {
    const db = openInMemoryDatabase();
    const players = createPlayerRepository(db);
    const games = createGameRepository(db);
    players.create('LIME-8472');
    const game = games.create('LIME-8472', 'crane');

    games.complete(game.id, 'won', 3);

    expect(games.findById(game.id)?.status).toBe('won');
    expect(games.findActiveByPlayerCode('LIME-8472')).toBeNull();
  });
});

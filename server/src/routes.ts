import { Router, type ErrorRequestHandler } from 'express';
import type { AppDatabase } from './db/database.js';
import { createGameRepository } from './repositories/gameRepository.js';
import { createPlayerRepository } from './repositories/playerRepository.js';
import { createGameService } from './services/gameService.js';
import { createPlayerService } from './services/playerService.js';

interface RouteOptions {
  generateCode?: () => string;
  selectAnswer?: () => string;
}

function errorCode(message: string) {
  if (message.includes('not found')) return 'not_found';
  if (message.includes('complete')) return 'game_complete';
  return 'bad_request';
}

export function createApiRouter(db: AppDatabase, options: RouteOptions = {}) {
  const router = Router();
  const players = createPlayerRepository(db);
  const games = createGameRepository(db);
  const playerService = createPlayerService(players, games, options.generateCode);
  const gameService = createGameService(players, games, options.selectAnswer);

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.post('/players', (_req, res) => {
    res.status(201).json(playerService.createPlayer());
  });

  router.get('/players/:code', (req, res, next) => {
    try {
      res.json(playerService.resumePlayer(req.params.code));
    } catch (error) {
      next(error);
    }
  });

  router.post('/games', (req, res, next) => {
    try {
      res.status(201).json(gameService.startOrResumeGame(req.body.playerCode));
    } catch (error) {
      next(error);
    }
  });

  router.post('/games/:id/guesses', (req, res, next) => {
    try {
      res.json(gameService.submitGuess(Number(req.params.id), req.body.playerCode, req.body.guess));
    } catch (error) {
      next(error);
    }
  });

  router.get('/games/:id/answer', (req, res, next) => {
    try {
      res.json(gameService.getAnswer(Number(req.params.id), String(req.query.playerCode ?? '')));
    } catch (error) {
      next(error);
    }
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    const code = errorCode(message);
    const status = code === 'not_found' ? 404 : 400;
    res.status(status).json({ error: { code, message } });
  };

  router.use(errorHandler);

  return router;
}

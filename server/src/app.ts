import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { AppDatabase } from './db/database.js';
import { createApiRouter } from './routes.js';

interface AppOptions {
  generateCode?: () => string;
  selectAnswer?: () => string;
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(db: AppDatabase, options: AppOptions = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(db, options));

  const clientDist = path.resolve(dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}

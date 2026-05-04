import { Pool } from 'pg';
import { migrate } from './schema.js';

export type AppDatabase = Pool;

export async function openDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Set it to your Neon Postgres connection string.');
  }

  const db = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  await migrate(db);
  return db;
}

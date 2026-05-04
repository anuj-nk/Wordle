import { DatabaseSync } from 'node:sqlite';
import { migrate } from './schema.js';

export type AppDatabase = DatabaseSync;

export function openDatabase(filename = process.env.DATABASE_URL ?? './wordle.sqlite') {
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');
  migrate(db);
  return db;
}

export function openInMemoryDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  migrate(db);
  return db;
}

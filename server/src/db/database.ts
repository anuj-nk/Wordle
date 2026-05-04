import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { migrate } from './schema.js';

export type AppDatabase = DatabaseSync;

function openSqliteFile(filename: string) {
  if (filename !== ':memory:') {
    mkdirSync(dirname(filename), { recursive: true });
  }

  return new DatabaseSync(filename);
}

export function openDatabase(filename = process.env.DATABASE_URL ?? './wordle.sqlite') {
  let db: DatabaseSync;

  try {
    db = openSqliteFile(filename);
  } catch (error) {
    if (filename === ':memory:' || process.env.DATABASE_URL === undefined) {
      throw error;
    }

    console.warn(`Could not open SQLite database at ${filename}; falling back to /tmp/wordle.sqlite.`);
    db = openSqliteFile('/tmp/wordle.sqlite');
  }

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

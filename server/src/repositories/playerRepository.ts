import type { AppDatabase } from '../db/database.js';

export interface PlayerRow {
  code: string;
  createdAt: string;
  lastSeenAt: string;
}

interface RawPlayerRow {
  code: string;
  created_at: string;
  last_seen_at: string;
}

function mapPlayer(row: RawPlayerRow): PlayerRow {
  return {
    code: row.code,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at
  };
}

export function createPlayerRepository(db: AppDatabase) {
  return {
    create(code: string): PlayerRow {
      db.prepare('INSERT INTO players (code) VALUES (?)').run(code);
      return this.findByCode(code)!;
    },
    findByCode(code: string): PlayerRow | null {
      const row = db.prepare('SELECT * FROM players WHERE code = ?').get(code) as RawPlayerRow | undefined;
      return row ? mapPlayer(row) : null;
    },
    touch(code: string): void {
      db.prepare('UPDATE players SET last_seen_at = CURRENT_TIMESTAMP WHERE code = ?').run(code);
    }
  };
}

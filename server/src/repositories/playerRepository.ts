import type { AppDatabase } from '../db/database.js';

export interface PlayerRow {
  code: string;
  createdAt: string;
  lastSeenAt: string;
}

interface RawPlayerRow {
  code: string;
  created_at: Date | string;
  last_seen_at: Date | string;
}

function serializeDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapPlayer(row: RawPlayerRow): PlayerRow {
  return {
    code: row.code,
    createdAt: serializeDate(row.created_at),
    lastSeenAt: serializeDate(row.last_seen_at)
  };
}

export function createPlayerRepository(db: AppDatabase) {
  return {
    async create(code: string): Promise<PlayerRow> {
      await db.query('INSERT INTO players (code) VALUES ($1)', [code]);
      return (await this.findByCode(code))!;
    },
    async findByCode(code: string): Promise<PlayerRow | null> {
      const result = await db.query<RawPlayerRow>('SELECT * FROM players WHERE code = $1', [code]);
      return result.rows[0] ? mapPlayer(result.rows[0]) : null;
    },
    async touch(code: string): Promise<void> {
      await db.query('UPDATE players SET last_seen_at = NOW() WHERE code = $1', [code]);
    }
  };
}

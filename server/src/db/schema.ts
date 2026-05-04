import type { DatabaseSync } from 'node:sqlite';

export function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      code TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_code TEXT NOT NULL,
      answer TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'won', 'lost')),
      attempt_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (player_code) REFERENCES players(code) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_game_per_player
      ON games(player_code)
      WHERE status = 'active';

    CREATE TABLE IF NOT EXISTS guesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      attempt_number INTEGER NOT NULL,
      guess TEXT NOT NULL,
      feedback_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );
  `);
}

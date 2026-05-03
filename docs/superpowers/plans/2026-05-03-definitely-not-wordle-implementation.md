# Definitely Not Wordle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a lean fullstack Wordle-style game with React, Express, SQLite persistence, generated player codes, one active game per player, and a required get-answer endpoint.

**Architecture:** Use a TypeScript monorepo with `client`, `server`, and `shared` workspaces. The server owns persistence and API behavior, the shared package owns pure game scoring/types, and the client owns the browser experience. Express serves API routes in development and the built React app in production for a single Render web service.

**Tech Stack:** TypeScript, React, Vite, Express, SQLite via `better-sqlite3`, Vitest, Supertest, Render.

---

## File Structure

- `package.json`: root npm scripts and workspaces.
- `tsconfig.base.json`: shared TypeScript compiler settings.
- `vitest.config.ts`: root test config covering shared and server tests.
- `shared/src/game.ts`: pure Wordle scoring and validation logic.
- `shared/src/types.ts`: shared API and game-state types.
- `shared/src/game.test.ts`: scoring and validation unit tests.
- `server/src/db/schema.ts`: SQLite schema creation.
- `server/src/db/database.ts`: database connection factory.
- `server/src/repositories/playerRepository.ts`: player persistence.
- `server/src/repositories/gameRepository.ts`: game and guess persistence.
- `server/src/services/playerService.ts`: player-code creation and resume state.
- `server/src/services/gameService.ts`: game lifecycle and guess submission.
- `server/src/routes.ts`: Express API routes.
- `server/src/app.ts`: Express app factory.
- `server/src/index.ts`: production server entrypoint.
- `server/src/services/*.test.ts`: service/API tests.
- `client/src/App.tsx`: application state orchestration.
- `client/src/api.ts`: typed API client.
- `client/src/components/*.tsx`: board, keyboard, header, stats, dialogs.
- `client/src/styles.css`: responsive application styling.
- `README.md`: local setup, scripts, and Render deployment notes.
- `render.yaml`: Render blueprint for the single web service.

---

### Task 1: Scaffold The TypeScript Monorepo

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/src/index.ts`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/tsconfig.node.json`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/styles.css`

- [ ] **Step 1: Create root workspace files**

Create `package.json`:

```json
{
  "name": "definitely-not-wordle",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": ["client", "server", "shared"],
  "scripts": {
    "dev": "npm run dev --workspace server",
    "build": "npm run build --workspace shared && npm run build --workspace client && npm run build --workspace server",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "npm run typecheck --workspace shared && npm run typecheck --workspace server && npm run typecheck --workspace client",
    "start": "node server/dist/index.js"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.2.0"
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@wordle/shared": ["shared/src/index.ts"]
    }
  }
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['shared/src/**/*.test.ts', 'server/src/**/*.test.ts'],
    environment: 'node'
  },
  resolve: {
    alias: {
      '@wordle/shared': new URL('./shared/src/index.ts', import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 2: Create workspace package files**

Create `shared/package.json`:

```json
{
  "name": "@wordle/shared",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

Create `server/package.json`:

```json
{
  "name": "@wordle/server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@wordle/shared": "file:../shared",
    "better-sqlite3": "^11.10.0",
    "cors": "^2.8.5",
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/node": "^24.0.0",
    "@types/supertest": "^6.0.3",
    "supertest": "^7.1.1",
    "tsx": "^4.20.0"
  }
}
```

Create `client/package.json`:

```json
{
  "name": "@wordle/client",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "@wordle/shared": "file:../shared",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 3: Create minimal TypeScript app shell**

Create `shared/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "emitDeclarationOnly": false
  },
  "include": ["src"]
}
```

Create `shared/src/index.ts`:

```ts
export const sharedReady = true;
```

Create `server/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"]
  },
  "include": ["src"]
}
```

Create `server/src/index.ts`:

```ts
import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
```

Create `client/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "noEmit": true
  },
  "include": ["src"]
}
```

Create `client/tsconfig.node.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "include": ["vite.config.ts"]
}
```

Create `client/index.html`:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

Create `client/src/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);
```

Create `client/src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>Definitely Not Wordle</h1>
      <p>Fullstack game loading...</p>
    </main>
  );
}
```

Create `client/src/styles.css`:

```css
:root {
  color: #1f2937;
  background: #f8fafc;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 5: Verify scaffold builds**

Run: `npm run typecheck`

Expected: all workspaces typecheck without TypeScript errors.

Run: `npm run build`

Expected: shared, client, and server build outputs are created.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add package.json package-lock.json tsconfig.base.json vitest.config.ts shared server client
git commit -m "chore: scaffold fullstack TypeScript app"
```

Expected: commit succeeds.

---

### Task 2: Implement Pure Game Scoring With TDD

**Files:**
- Create: `shared/src/types.ts`
- Create: `shared/src/game.ts`
- Create: `shared/src/game.test.ts`
- Modify: `shared/src/index.ts`

- [ ] **Step 1: Write failing scoring and validation tests**

Create `shared/src/game.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { scoreGuess, validateGuess } from './game';

describe('validateGuess', () => {
  it('accepts exactly five alphabetic letters', () => {
    expect(validateGuess('abcde')).toEqual({ ok: true, value: 'abcde' });
    expect(validateGuess('ABCDE')).toEqual({ ok: true, value: 'abcde' });
  });

  it('rejects guesses that are not five alphabetic letters', () => {
    expect(validateGuess('abcd')).toEqual({ ok: false, message: 'Guess must be exactly five letters.' });
    expect(validateGuess('abcdef')).toEqual({ ok: false, message: 'Guess must be exactly five letters.' });
    expect(validateGuess('ab3de')).toEqual({ ok: false, message: 'Guess must use letters only.' });
  });
});

describe('scoreGuess', () => {
  it('marks exact matches as correct', () => {
    expect(scoreGuess('crane', 'crane').map((tile) => tile.status)).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct'
    ]);
  });

  it('marks present letters in the wrong position', () => {
    expect(scoreGuess('crane', 'react').map((tile) => tile.status)).toEqual([
      'present',
      'present',
      'present',
      'absent',
      'present'
    ]);
  });

  it('does not over-count repeated letters from the answer', () => {
    expect(scoreGuess('level', 'allee').map((tile) => tile.status)).toEqual([
      'present',
      'absent',
      'present',
      'present',
      'absent'
    ]);
  });

  it('handles repeated correct letters before present letters', () => {
    expect(scoreGuess('array', 'rarer').map((tile) => tile.status)).toEqual([
      'present',
      'correct',
      'absent',
      'absent',
      'present'
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- shared/src/game.test.ts`

Expected: FAIL because `./game` does not exist.

- [ ] **Step 3: Implement shared types and scoring**

Create `shared/src/types.ts`:

```ts
export type TileStatus = 'correct' | 'present' | 'absent';

export interface TileFeedback {
  letter: string;
  status: TileStatus;
}

export type GameStatus = 'active' | 'won' | 'lost';

export interface GuessRecord {
  id: number;
  gameId: number;
  attemptNumber: number;
  guess: string;
  feedback: TileFeedback[];
  createdAt: string;
}

export interface GameState {
  id: number;
  playerCode: string;
  status: GameStatus;
  attemptCount: number;
  guesses: GuessRecord[];
  createdAt: string;
  completedAt: string | null;
}

export interface PlayerStats {
  played: number;
  won: number;
  lost: number;
  currentStreak: number;
}

export interface PlayerState {
  code: string;
  activeGame: GameState | null;
  recentGames: GameState[];
  stats: PlayerStats;
}
```

Create `shared/src/game.ts`:

```ts
import type { TileFeedback, TileStatus } from './types';

export type GuessValidation =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function validateGuess(guess: string): GuessValidation {
  const normalized = guess.trim().toLowerCase();

  if (normalized.length !== 5) {
    return { ok: false, message: 'Guess must be exactly five letters.' };
  }

  if (!/^[a-z]+$/.test(normalized)) {
    return { ok: false, message: 'Guess must use letters only.' };
  }

  return { ok: true, value: normalized };
}

export function scoreGuess(answer: string, guess: string): TileFeedback[] {
  const normalizedAnswer = answer.toLowerCase();
  const normalizedGuess = guess.toLowerCase();
  const result: TileFeedback[] = normalizedGuess
    .split('')
    .map((letter) => ({ letter, status: 'absent' as TileStatus }));
  const remaining = new Map<string, number>();

  for (let index = 0; index < normalizedAnswer.length; index += 1) {
    if (normalizedGuess[index] === normalizedAnswer[index]) {
      result[index].status = 'correct';
    } else {
      const answerLetter = normalizedAnswer[index];
      remaining.set(answerLetter, (remaining.get(answerLetter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (result[index].status === 'correct') {
      continue;
    }

    const guessLetter = normalizedGuess[index];
    const available = remaining.get(guessLetter) ?? 0;

    if (available > 0) {
      result[index].status = 'present';
      remaining.set(guessLetter, available - 1);
    }
  }

  return result;
}
```

Modify `shared/src/index.ts`:

```ts
export * from './game';
export * from './types';
```

- [ ] **Step 4: Run tests to verify scoring passes**

Run: `npm test -- shared/src/game.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit scoring module**

Run:

```bash
git add shared/src
git commit -m "feat: add Wordle scoring logic"
```

Expected: commit succeeds.

---

### Task 3: Add SQLite Schema And Repositories With TDD

**Files:**
- Create: `server/src/db/database.ts`
- Create: `server/src/db/schema.ts`
- Create: `server/src/repositories/playerRepository.ts`
- Create: `server/src/repositories/gameRepository.ts`
- Create: `server/src/repositories/repositories.test.ts`

- [ ] **Step 1: Write failing repository tests**

Create `server/src/repositories/repositories.test.ts`:

```ts
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migrate } from '../db/schema';
import { createGameRepository } from './gameRepository';
import { createPlayerRepository } from './playerRepository';

function testDb() {
  const db = new Database(':memory:');
  migrate(db);
  return db;
}

describe('repositories', () => {
  it('creates and finds a player by code', () => {
    const db = testDb();
    const players = createPlayerRepository(db);

    const player = players.create('LIME-8472');

    expect(player.code).toBe('LIME-8472');
    expect(players.findByCode('LIME-8472')?.code).toBe('LIME-8472');
  });

  it('stores one active game and its guesses', () => {
    const db = testDb();
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
    const db = testDb();
    const players = createPlayerRepository(db);
    const games = createGameRepository(db);
    players.create('LIME-8472');
    const game = games.create('LIME-8472', 'crane');

    games.complete(game.id, 'won', 3);

    expect(games.findById(game.id)?.status).toBe('won');
    expect(games.findActiveByPlayerCode('LIME-8472')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/src/repositories/repositories.test.ts`

Expected: FAIL because database/repository modules do not exist.

- [ ] **Step 3: Implement database schema**

Create `server/src/db/database.ts`:

```ts
import Database from 'better-sqlite3';
import { migrate } from './schema';

export function openDatabase(filename = process.env.DATABASE_URL ?? './wordle.sqlite') {
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}
```

Create `server/src/db/schema.ts`:

```ts
import type Database from 'better-sqlite3';

export function migrate(db: Database.Database) {
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
```

- [ ] **Step 4: Implement repositories**

Create `server/src/repositories/playerRepository.ts`:

```ts
import type Database from 'better-sqlite3';

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

export function createPlayerRepository(db: Database.Database) {
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
```

Create `server/src/repositories/gameRepository.ts`:

```ts
import type Database from 'better-sqlite3';
import type { GameStatus, TileFeedback } from '@wordle/shared';

export interface GameRow {
  id: number;
  playerCode: string;
  answer: string;
  status: GameStatus;
  attemptCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface GuessRow {
  id: number;
  gameId: number;
  attemptNumber: number;
  guess: string;
  feedback: TileFeedback[];
  createdAt: string;
}

interface RawGameRow {
  id: number;
  player_code: string;
  answer: string;
  status: GameStatus;
  attempt_count: number;
  created_at: string;
  completed_at: string | null;
}

interface RawGuessRow {
  id: number;
  game_id: number;
  attempt_number: number;
  guess: string;
  feedback_json: string;
  created_at: string;
}

function mapGame(row: RawGameRow): GameRow {
  return {
    id: row.id,
    playerCode: row.player_code,
    answer: row.answer,
    status: row.status,
    attemptCount: row.attempt_count,
    createdAt: row.created_at,
    completedAt: row.completed_at
  };
}

function mapGuess(row: RawGuessRow): GuessRow {
  return {
    id: row.id,
    gameId: row.game_id,
    attemptNumber: row.attempt_number,
    guess: row.guess,
    feedback: JSON.parse(row.feedback_json) as TileFeedback[],
    createdAt: row.created_at
  };
}

export function createGameRepository(db: Database.Database) {
  return {
    create(playerCode: string, answer: string): GameRow {
      const result = db
        .prepare('INSERT INTO games (player_code, answer, status) VALUES (?, ?, ?)')
        .run(playerCode, answer, 'active');
      return this.findById(Number(result.lastInsertRowid))!;
    },
    findById(id: number): GameRow | null {
      const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as RawGameRow | undefined;
      return row ? mapGame(row) : null;
    },
    findActiveByPlayerCode(playerCode: string): GameRow | null {
      const row = db
        .prepare("SELECT * FROM games WHERE player_code = ? AND status = 'active'")
        .get(playerCode) as RawGameRow | undefined;
      return row ? mapGame(row) : null;
    },
    listRecentByPlayerCode(playerCode: string, limit = 10): GameRow[] {
      const rows = db
        .prepare("SELECT * FROM games WHERE player_code = ? AND status != 'active' ORDER BY id DESC LIMIT ?")
        .all(playerCode, limit) as RawGameRow[];
      return rows.map(mapGame);
    },
    addGuess(gameId: number, attemptNumber: number, guess: string, feedback: TileFeedback[]): GuessRow {
      const result = db
        .prepare('INSERT INTO guesses (game_id, attempt_number, guess, feedback_json) VALUES (?, ?, ?, ?)')
        .run(gameId, attemptNumber, guess, JSON.stringify(feedback));
      return this.listGuesses(gameId).find((row) => row.id === Number(result.lastInsertRowid))!;
    },
    listGuesses(gameId: number): GuessRow[] {
      const rows = db
        .prepare('SELECT * FROM guesses WHERE game_id = ? ORDER BY attempt_number ASC')
        .all(gameId) as RawGuessRow[];
      return rows.map(mapGuess);
    },
    updateAttemptCount(id: number, attemptCount: number): void {
      db.prepare('UPDATE games SET attempt_count = ? WHERE id = ?').run(attemptCount, id);
    },
    complete(id: number, status: Exclude<GameStatus, 'active'>, attemptCount: number): void {
      db.prepare('UPDATE games SET status = ?, attempt_count = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        status,
        attemptCount,
        id
      );
    }
  };
}
```

- [ ] **Step 5: Run repository tests**

Run: `npm test -- server/src/repositories/repositories.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit persistence layer**

Run:

```bash
git add server/src/db server/src/repositories
git commit -m "feat: add SQLite persistence layer"
```

Expected: commit succeeds.

---

### Task 4: Implement Player And Game Services With TDD

**Files:**
- Create: `server/src/services/codeGenerator.ts`
- Create: `server/src/services/playerService.ts`
- Create: `server/src/services/gameService.ts`
- Create: `server/src/services/services.test.ts`

- [ ] **Step 1: Write failing service tests**

Create `server/src/services/services.test.ts`:

```ts
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { migrate } from '../db/schema';
import { createGameRepository } from '../repositories/gameRepository';
import { createPlayerRepository } from '../repositories/playerRepository';
import { createGameService } from './gameService';
import { createPlayerService } from './playerService';

function services() {
  const db = new Database(':memory:');
  migrate(db);
  const players = createPlayerRepository(db);
  const games = createGameRepository(db);
  const playerService = createPlayerService(players, games, () => 'LIME-8472');
  const gameService = createGameService(players, games, () => 'crane');
  return { playerService, gameService };
}

describe('services', () => {
  it('creates a generated player code', () => {
    const { playerService } = services();

    expect(playerService.createPlayer().code).toBe('LIME-8472');
  });

  it('starts one active game per player', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();

    const first = gameService.startOrResumeGame(player.code);
    const second = gameService.startOrResumeGame(player.code);

    expect(second.id).toBe(first.id);
    expect(second.status).toBe('active');
  });

  it('submits winning guesses and stores feedback', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();
    const game = gameService.startOrResumeGame(player.code);

    const updated = gameService.submitGuess(game.id, player.code, 'crane');

    expect(updated.status).toBe('won');
    expect(updated.guesses).toHaveLength(1);
    expect(updated.guesses[0].feedback.every((tile) => tile.status === 'correct')).toBe(true);
  });

  it('marks a game lost after five incorrect guesses', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();
    const game = gameService.startOrResumeGame(player.code);

    gameService.submitGuess(game.id, player.code, 'aaaaa');
    gameService.submitGuess(game.id, player.code, 'bbbbb');
    gameService.submitGuess(game.id, player.code, 'ddddd');
    gameService.submitGuess(game.id, player.code, 'eeeee');
    const updated = gameService.submitGuess(game.id, player.code, 'fffff');

    expect(updated.status).toBe('lost');
    expect(updated.attemptCount).toBe(5);
  });

  it('rejects guesses for a different player code', () => {
    const { playerService, gameService } = services();
    const player = playerService.createPlayer();
    const game = gameService.startOrResumeGame(player.code);

    expect(() => gameService.submitGuess(game.id, 'MINT-0001', 'crane')).toThrow('Game not found.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/src/services/services.test.ts`

Expected: FAIL because service modules do not exist.

- [ ] **Step 3: Implement code generator**

Create `server/src/services/codeGenerator.ts`:

```ts
const WORDS = ['LIME', 'MINT', 'PLUM', 'PEAR', 'KIWI', 'SAGE', 'BOLT', 'NOVA'];

export function generatePlayerCode() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${number}`;
}
```

- [ ] **Step 4: Implement player service**

Create `server/src/services/playerService.ts`:

```ts
import type { GameState, PlayerState, PlayerStats } from '@wordle/shared';
import type { GameRow, GuessRow } from '../repositories/gameRepository';
import type { createGameRepository } from '../repositories/gameRepository';
import type { createPlayerRepository } from '../repositories/playerRepository';
import { generatePlayerCode } from './codeGenerator';

type PlayerRepository = ReturnType<typeof createPlayerRepository>;
type GameRepository = ReturnType<typeof createGameRepository>;

function toGameState(game: GameRow, guesses: GuessRow[]): GameState {
  return {
    id: game.id,
    playerCode: game.playerCode,
    status: game.status,
    attemptCount: game.attemptCount,
    guesses: guesses.map((guess) => ({
      id: guess.id,
      gameId: guess.gameId,
      attemptNumber: guess.attemptNumber,
      guess: guess.guess,
      feedback: guess.feedback,
      createdAt: guess.createdAt
    })),
    createdAt: game.createdAt,
    completedAt: game.completedAt
  };
}

function statsFor(games: GameRow[]): PlayerStats {
  const won = games.filter((game) => game.status === 'won').length;
  const lost = games.filter((game) => game.status === 'lost').length;
  return {
    played: won + lost,
    won,
    lost,
    currentStreak: 0
  };
}

export function createPlayerService(
  players: PlayerRepository,
  games: GameRepository,
  generateCode = generatePlayerCode
) {
  function stateFor(code: string): PlayerState {
    const player = players.findByCode(code);
    if (!player) {
      throw new Error('Player not found.');
    }

    players.touch(code);
    const active = games.findActiveByPlayerCode(code);
    const recent = games.listRecentByPlayerCode(code);

    return {
      code,
      activeGame: active ? toGameState(active, games.listGuesses(active.id)) : null,
      recentGames: recent.map((game) => toGameState(game, games.listGuesses(game.id))),
      stats: statsFor(recent)
    };
  }

  return {
    createPlayer(): PlayerState {
      let code = generateCode();
      while (players.findByCode(code)) {
        code = generateCode();
      }
      players.create(code);
      return stateFor(code);
    },
    resumePlayer(code: string): PlayerState {
      return stateFor(code);
    }
  };
}
```

- [ ] **Step 5: Implement game service**

Create `server/src/services/gameService.ts`:

```ts
import { scoreGuess, validateGuess, type GameState } from '@wordle/shared';
import type { GameRow, GuessRow } from '../repositories/gameRepository';
import type { createGameRepository } from '../repositories/gameRepository';
import type { createPlayerRepository } from '../repositories/playerRepository';

type PlayerRepository = ReturnType<typeof createPlayerRepository>;
type GameRepository = ReturnType<typeof createGameRepository>;

const ANSWERS = ['crane', 'slate', 'proud', 'flint', 'cider'];

function chooseAnswer() {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

function toGameState(game: GameRow, guesses: GuessRow[]): GameState {
  return {
    id: game.id,
    playerCode: game.playerCode,
    status: game.status,
    attemptCount: game.attemptCount,
    guesses: guesses.map((guess) => ({
      id: guess.id,
      gameId: guess.gameId,
      attemptNumber: guess.attemptNumber,
      guess: guess.guess,
      feedback: guess.feedback,
      createdAt: guess.createdAt
    })),
    createdAt: game.createdAt,
    completedAt: game.completedAt
  };
}

export function createGameService(
  players: PlayerRepository,
  games: GameRepository,
  selectAnswer = chooseAnswer
) {
  function ownedGame(id: number, playerCode: string) {
    const game = games.findById(id);
    if (!game || game.playerCode !== playerCode) {
      throw new Error('Game not found.');
    }
    return game;
  }

  return {
    startOrResumeGame(playerCode: string): GameState {
      if (!players.findByCode(playerCode)) {
        throw new Error('Player not found.');
      }

      const active = games.findActiveByPlayerCode(playerCode) ?? games.create(playerCode, selectAnswer());
      return toGameState(active, games.listGuesses(active.id));
    },
    submitGuess(id: number, playerCode: string, rawGuess: string): GameState {
      const game = ownedGame(id, playerCode);
      if (game.status !== 'active') {
        throw new Error('Game is already complete.');
      }

      const validation = validateGuess(rawGuess);
      if (!validation.ok) {
        throw new Error(validation.message);
      }

      const attemptNumber = game.attemptCount + 1;
      const feedback = scoreGuess(game.answer, validation.value);
      games.addGuess(game.id, attemptNumber, validation.value, feedback);

      if (validation.value === game.answer) {
        games.complete(game.id, 'won', attemptNumber);
      } else if (attemptNumber >= 5) {
        games.complete(game.id, 'lost', attemptNumber);
      } else {
        games.updateAttemptCount(game.id, attemptNumber);
      }

      const updated = games.findById(game.id)!;
      return toGameState(updated, games.listGuesses(game.id));
    },
    getAnswer(id: number, playerCode: string): { answer: string } {
      const game = ownedGame(id, playerCode);
      return { answer: game.answer };
    }
  };
}
```

- [ ] **Step 6: Run service tests**

Run: `npm test -- server/src/services/services.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit services**

Run:

```bash
git add server/src/services
git commit -m "feat: add player and game services"
```

Expected: commit succeeds.

---

### Task 5: Expose The Express API With TDD

**Files:**
- Create: `server/src/app.ts`
- Create: `server/src/routes.ts`
- Create: `server/src/routes.test.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Write failing API tests**

Create `server/src/routes.test.ts`:

```ts
import Database from 'better-sqlite3';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { migrate } from './db/schema';

function app() {
  const db = new Database(':memory:');
  migrate(db);
  return createApp(db, {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/src/routes.test.ts`

Expected: FAIL because `createApp` does not exist.

- [ ] **Step 3: Implement Express app and routes**

Create `server/src/routes.ts`:

```ts
import { Router } from 'express';
import type Database from 'better-sqlite3';
import { createGameRepository } from './repositories/gameRepository';
import { createPlayerRepository } from './repositories/playerRepository';
import { createGameService } from './services/gameService';
import { createPlayerService } from './services/playerService';

interface RouteOptions {
  generateCode?: () => string;
  selectAnswer?: () => string;
}

function errorCode(message: string) {
  if (message.includes('not found')) return 'not_found';
  if (message.includes('complete')) return 'game_complete';
  return 'bad_request';
}

export function createApiRouter(db: Database.Database, options: RouteOptions = {}) {
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

  router.use((error: unknown, _req, res, _next) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    const status = errorCode(message) === 'not_found' ? 404 : 400;
    res.status(status).json({ error: { code: errorCode(message), message } });
  });

  return router;
}
```

Create `server/src/app.ts`:

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type Database from 'better-sqlite3';
import { createApiRouter } from './routes';

interface AppOptions {
  generateCode?: () => string;
  selectAnswer?: () => string;
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(db: Database.Database, options: AppOptions = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(db, options));

  const clientDist = path.resolve(dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}
```

Modify `server/src/index.ts`:

```ts
import { createApp } from './app';
import { openDatabase } from './db/database';

const port = Number(process.env.PORT ?? 3000);
const db = openDatabase();
const app = createApp(db);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
```

- [ ] **Step 4: Run API tests**

Run: `npm test -- server/src/routes.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit API**

Run:

```bash
git add server/src/app.ts server/src/routes.ts server/src/routes.test.ts server/src/index.ts
git commit -m "feat: expose game API"
```

Expected: commit succeeds.

---

### Task 6: Build The React Game Experience

**Files:**
- Create: `client/src/api.ts`
- Create: `client/src/components/Board.tsx`
- Create: `client/src/components/Header.tsx`
- Create: `client/src/components/Keyboard.tsx`
- Create: `client/src/components/StatsPanel.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/styles.css`

- [ ] **Step 1: Write the typed API client**

Create `client/src/api.ts`:

```ts
import type { GameState, PlayerState } from '@wordle/shared';

const PLAYER_CODE_KEY = 'definitely-not-wordle:player-code';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error?.message ?? 'Request failed.');
  }

  return body as T;
}

export function savedPlayerCode() {
  return window.localStorage.getItem(PLAYER_CODE_KEY);
}

export function savePlayerCode(code: string) {
  window.localStorage.setItem(PLAYER_CODE_KEY, code);
}

export function createPlayer() {
  return request<PlayerState>('/api/players', { method: 'POST' });
}

export function resumePlayer(code: string) {
  return request<PlayerState>(`/api/players/${encodeURIComponent(code)}`);
}

export function startGame(playerCode: string) {
  return request<GameState>('/api/games', {
    method: 'POST',
    body: JSON.stringify({ playerCode })
  });
}

export function submitGuess(gameId: number, playerCode: string, guess: string) {
  return request<GameState>(`/api/games/${gameId}/guesses`, {
    method: 'POST',
    body: JSON.stringify({ playerCode, guess })
  });
}

export function revealAnswer(gameId: number, playerCode: string) {
  return request<{ answer: string }>(`/api/games/${gameId}/answer?playerCode=${encodeURIComponent(playerCode)}`);
}
```

- [ ] **Step 2: Build display components**

Create `client/src/components/Header.tsx`:

```tsx
import { Copy } from 'lucide-react';

interface HeaderProps {
  playerCode: string | null;
  resumeCode: string;
  onResumeCodeChange: (code: string) => void;
  onResume: () => void;
}

export function Header({ playerCode, resumeCode, onResumeCodeChange, onResume }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">GoLinks intern project</p>
        <h1>Definitely Not Wordle</h1>
      </div>
      <div className="code-panel">
        <span>Your code</span>
        <strong>{playerCode ?? 'Loading'}</strong>
        <button type="button" aria-label="Copy player code" onClick={() => playerCode && navigator.clipboard.writeText(playerCode)}>
          <Copy size={16} />
        </button>
        <div className="resume-row">
          <input value={resumeCode} onChange={(event) => onResumeCodeChange(event.target.value)} placeholder="Enter code" />
          <button type="button" onClick={onResume}>Resume</button>
        </div>
      </div>
    </header>
  );
}
```

Create `client/src/components/Board.tsx`:

```tsx
import type { GameState, TileFeedback } from '@wordle/shared';

interface BoardProps {
  game: GameState | null;
  currentGuess: string;
}

function emptyRows(count: number) {
  return Array.from({ length: count }, () => Array.from({ length: 5 }, () => ({ letter: '', status: 'empty' })));
}

export function Board({ game, currentGuess }: BoardProps) {
  const submitted = game?.guesses.map((guess) => guess.feedback) ?? [];
  const current = currentGuess.padEnd(5).split('').map((letter) => ({ letter, status: 'typing' }));
  const rows: Array<Array<TileFeedback | { letter: string; status: string }>> = [
    ...submitted,
    ...(game?.status === 'active' ? [current] : []),
    ...emptyRows(5 - submitted.length - (game?.status === 'active' ? 1 : 0))
  ].slice(0, 5);

  return (
    <section className="board" aria-label="Game board">
      {rows.map((row, rowIndex) => (
        <div className="board-row" key={rowIndex}>
          {row.map((tile, tileIndex) => (
            <div className={`tile tile-${tile.status}`} key={`${rowIndex}-${tileIndex}`}>
              {tile.letter}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
```

Create `client/src/components/Keyboard.tsx`:

```tsx
import type { GameState, TileStatus } from '@wordle/shared';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const rank: Record<TileStatus, number> = { absent: 1, present: 2, correct: 3 };

function keyStatuses(game: GameState | null) {
  const statuses = new Map<string, TileStatus>();
  for (const guess of game?.guesses ?? []) {
    for (const tile of guess.feedback) {
      const current = statuses.get(tile.letter);
      if (!current || rank[tile.status] > rank[current]) statuses.set(tile.letter, tile.status);
    }
  }
  return statuses;
}

interface KeyboardProps {
  game: GameState | null;
  onKey: (key: string) => void;
}

export function Keyboard({ game, onKey }: KeyboardProps) {
  const statuses = keyStatuses(game);
  return (
    <section className="keyboard" aria-label="Keyboard">
      {ROWS.map((row) => (
        <div className="keyboard-row" key={row}>
          {row === 'zxcvbnm' && <button onClick={() => onKey('Enter')}>Enter</button>}
          {row.split('').map((letter) => (
            <button className={statuses.get(letter) ? `key-${statuses.get(letter)}` : ''} key={letter} onClick={() => onKey(letter)}>
              {letter}
            </button>
          ))}
          {row === 'zxcvbnm' && <button onClick={() => onKey('Backspace')}>Delete</button>}
        </div>
      ))}
    </section>
  );
}
```

Create `client/src/components/StatsPanel.tsx`:

```tsx
import type { PlayerState } from '@wordle/shared';

export function StatsPanel({ player }: { player: PlayerState | null }) {
  return (
    <aside className="stats-panel">
      <h2>Stats</h2>
      <dl>
        <div><dt>Played</dt><dd>{player?.stats.played ?? 0}</dd></div>
        <div><dt>Won</dt><dd>{player?.stats.won ?? 0}</dd></div>
        <div><dt>Lost</dt><dd>{player?.stats.lost ?? 0}</dd></div>
      </dl>
      <h3>Recent games</h3>
      <ul>
        {(player?.recentGames ?? []).slice(0, 5).map((game) => (
          <li key={game.id}>{game.status} in {game.attemptCount}/5</li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 3: Wire app state**

Modify `client/src/App.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import type { GameState, PlayerState } from '@wordle/shared';
import { Board } from './components/Board';
import { Header } from './components/Header';
import { Keyboard } from './components/Keyboard';
import { StatsPanel } from './components/StatsPanel';
import { createPlayer, revealAnswer, resumePlayer, savedPlayerCode, savePlayerCode, startGame, submitGuess } from './api';

export function App() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [resumeCode, setResumeCode] = useState('');
  const [message, setMessage] = useState('Loading game...');

  const bootstrap = useCallback(async () => {
    try {
      const code = savedPlayerCode();
      const nextPlayer = code ? await resumePlayer(code) : await createPlayer();
      savePlayerCode(nextPlayer.code);
      const nextGame = nextPlayer.activeGame ?? await startGame(nextPlayer.code);
      setPlayer(nextPlayer);
      setGame(nextGame);
      setMessage('Guess any five letters.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load the game.');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  async function handleSubmit() {
    if (!player || !game || game.status !== 'active') return;
    try {
      const updated = await submitGuess(game.id, player.code, currentGuess);
      setGame(updated);
      setCurrentGuess('');
      if (updated.status === 'won') setMessage('Solved. Nicely done.');
      else if (updated.status === 'lost') setMessage('Game over. Reveal the answer or start again later.');
      else setMessage('Keep going.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Guess failed.');
    }
  }

  function handleKey(key: string) {
    if (key === 'Enter') void handleSubmit();
    else if (key === 'Backspace') setCurrentGuess((value) => value.slice(0, -1));
    else if (/^[a-z]$/i.test(key)) setCurrentGuess((value) => (value.length < 5 ? value + key.toLowerCase() : value));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      handleKey(event.key);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  async function handleResume() {
    try {
      const nextPlayer = await resumePlayer(resumeCode.trim().toUpperCase());
      savePlayerCode(nextPlayer.code);
      setPlayer(nextPlayer);
      setGame(nextPlayer.activeGame ?? await startGame(nextPlayer.code));
      setMessage('Player resumed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not resume player.');
    }
  }

  async function handleReveal() {
    if (!player || !game) return;
    const result = await revealAnswer(game.id, player.code);
    setMessage(`Answer: ${result.answer.toUpperCase()}`);
  }

  return (
    <main className="app-shell">
      <Header playerCode={player?.code ?? null} resumeCode={resumeCode} onResumeCodeChange={setResumeCode} onResume={handleResume} />
      <section className="game-layout">
        <div className="game-area">
          <Board game={game} currentGuess={currentGuess} />
          <p className="message">{message}</p>
          <Keyboard game={game} onKey={handleKey} />
          <button className="secondary-action" type="button" onClick={handleReveal}>Reveal answer</button>
        </div>
        <StatsPanel player={player} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Apply polished responsive styles**

Modify `client/src/styles.css`:

```css
:root {
  color: #1f2937;
  background: #f6f3ee;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.header {
  max-width: 1120px;
  margin: 0 auto 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #c2410c;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  color: #111827;
  font-size: clamp(2rem, 6vw, 4rem);
  line-height: 0.95;
}

.code-panel {
  width: min(100%, 340px);
  border: 1px solid #d6d3d1;
  border-radius: 8px;
  padding: 14px;
  background: #fffaf3;
}

.code-panel span {
  display: block;
  color: #57534e;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.code-panel strong {
  display: inline-block;
  margin: 4px 8px 10px 0;
  color: #166534;
  font-size: 1.35rem;
}

.code-panel button,
.resume-row button,
.secondary-action,
.keyboard button {
  border: 1px solid #a8a29e;
  border-radius: 6px;
  background: #ffffff;
  color: #292524;
  font-weight: 800;
}

.code-panel > button {
  width: 36px;
  height: 36px;
  vertical-align: top;
}

.resume-row {
  display: flex;
  gap: 8px;
}

.resume-row input {
  min-width: 0;
  flex: 1;
  border: 1px solid #d6d3d1;
  border-radius: 6px;
  padding: 9px 10px;
}

.resume-row button {
  padding: 9px 12px;
}

.game-layout {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 280px;
  gap: 32px;
  align-items: start;
}

.game-area {
  display: grid;
  justify-items: center;
  gap: 18px;
}

.board {
  display: grid;
  gap: 8px;
  width: min(100%, 360px);
}

.board-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.tile {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 2px solid #d6d3d1;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
  font-size: clamp(1.4rem, 7vw, 2.2rem);
  font-weight: 900;
  text-transform: uppercase;
}

.tile-correct {
  border-color: #15803d;
  background: #15803d;
  color: white;
}

.tile-present {
  border-color: #ca8a04;
  background: #ca8a04;
  color: white;
}

.tile-absent {
  border-color: #57534e;
  background: #57534e;
  color: white;
}

.tile-typing {
  border-color: #78716c;
}

.message {
  min-height: 1.5em;
  margin: 0;
  color: #44403c;
  font-weight: 700;
  text-align: center;
}

.keyboard {
  width: min(100%, 660px);
  display: grid;
  gap: 8px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.keyboard button {
  min-width: 0;
  min-height: 44px;
  padding: 0 10px;
  text-transform: uppercase;
}

.keyboard button:not(:first-child):not(:last-child) {
  width: 44px;
}

.keyboard .key-correct {
  border-color: #15803d;
  background: #15803d;
  color: white;
}

.keyboard .key-present {
  border-color: #ca8a04;
  background: #ca8a04;
  color: white;
}

.keyboard .key-absent {
  border-color: #57534e;
  background: #57534e;
  color: white;
}

.secondary-action {
  padding: 10px 14px;
}

.stats-panel {
  border-left: 1px solid #d6d3d1;
  padding-left: 24px;
}

.stats-panel h2 {
  margin-bottom: 12px;
}

.stats-panel dl {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 0 0 24px;
}

.stats-panel dl div {
  border: 1px solid #d6d3d1;
  border-radius: 8px;
  padding: 10px;
  background: #fffaf3;
}

.stats-panel dt {
  color: #57534e;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.stats-panel dd {
  margin: 2px 0 0;
  color: #111827;
  font-size: 1.4rem;
  font-weight: 900;
}

.stats-panel ul {
  margin: 0;
  padding-left: 18px;
  color: #44403c;
}

@media (max-width: 820px) {
  .app-shell {
    padding: 16px;
  }

  .header {
    display: grid;
  }

  .code-panel {
    width: 100%;
  }

  .game-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .stats-panel {
    border-left: 0;
    border-top: 1px solid #d6d3d1;
    padding-left: 0;
    padding-top: 20px;
  }

  .keyboard button {
    padding: 0 7px;
    min-height: 42px;
  }

  .keyboard button:not(:first-child):not(:last-child) {
    width: 9vw;
    max-width: 42px;
  }
}
```

- [ ] **Step 5: Verify client build**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS and client assets build.

- [ ] **Step 6: Commit frontend**

Run:

```bash
git add client/src
git commit -m "feat: build playable React interface"
```

Expected: commit succeeds.

---

### Task 7: Add Deployment And Documentation

**Files:**
- Create: `README.md`
- Create: `render.yaml`
- Modify: `.gitignore`

- [ ] **Step 1: Update ignore rules**

Modify `.gitignore`:

```gitignore
GoLinks-TaskDoc.pdf
.superpowers/
node_modules/
dist/
client/dist/
server/dist/
shared/dist/
*.sqlite
*.sqlite-shm
*.sqlite-wal
.env
```

- [ ] **Step 2: Add Render blueprint**

Create `render.yaml`:

```yaml
services:
  - type: web
    name: definitely-not-wordle
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    disk:
      name: wordle-sqlite
      mountPath: /var/data
      sizeGB: 1
    envVars:
      - key: DATABASE_URL
        value: /var/data/wordle.sqlite
```

- [ ] **Step 3: Add README**

Create `README.md`:

```md
# Definitely Not Wordle

A fullstack Wordle-style internship project built with React, Express, TypeScript, and SQLite.

## Features

- Five-letter guessing game with five attempts.
- Any five alphabetic letters are accepted.
- Wordle-style green, yellow, and gray feedback.
- Generated player codes for lightweight session continuity.
- One active game per player.
- SQLite persistence for players, games, guesses, and stats.
- Required get-answer endpoint at `GET /api/games/:id/answer?playerCode=CODE`.

## Local Development

```bash
npm install
npm run dev
```

The Express server runs at `http://localhost:3000`.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

## Deployment

This app is designed for a single Render web service. The backend serves the API and the compiled frontend.

Render settings:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`
- Persistent disk mount: `/var/data`
- Environment variable: `DATABASE_URL=/var/data/wordle.sqlite`
```

- [ ] **Step 4: Verify docs and deploy config**

Run: `npm run build`

Expected: PASS.

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit deployment docs**

Run:

```bash
git add .gitignore README.md render.yaml
git commit -m "docs: add deployment instructions"
```

Expected: commit succeeds.

---

### Task 8: Final Local QA And Browser Verification

**Files:**
- Modify only files needed to fix issues found during verification.

- [ ] **Step 1: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 2: Start local production server**

Run: `npm start`

Expected: server starts on `http://localhost:3000`.

- [ ] **Step 3: Browser QA**

Open `http://localhost:3000` and verify:

- New player code appears.
- Code is readable and copyable.
- Board accepts physical keyboard input.
- Board accepts on-screen keyboard input.
- Submitting fewer than five letters shows an error.
- Submitting any five alphabetic letters works.
- Correct guess wins.
- Five wrong guesses loses.
- Reveal answer endpoint displays the answer.
- Refresh resumes the same player.
- Mobile viewport has no overlapping UI.

- [ ] **Step 4: Fix issues with TDD where behavior changes are needed**

For each behavior bug:

1. Add or update the smallest failing test that reproduces it.
2. Run the targeted test and verify it fails.
3. Implement the smallest fix.
4. Run the targeted test and full verification.
5. Commit the fix with a specific message.

- [ ] **Step 5: Commit final QA fixes**

If changes were needed:

```bash
git add .
git commit -m "fix: resolve local QA issues"
```

If no changes were needed, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: tasks cover game rules, generated player codes, one active game per player, SQLite persistence, get-answer endpoint, Render hosting, tests, docs, and browser QA.
- Type consistency: shared `GameState`, `PlayerState`, `TileFeedback`, and `GameStatus` are used across server and client.
- Scope control: v1 excludes secure authentication, multiplayer, dictionary validation, multiple active games, and leaderboards.

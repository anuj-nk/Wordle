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
- Node version: `24` or newer, because the backend uses Node's built-in SQLite module.

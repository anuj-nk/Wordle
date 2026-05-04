# Definitely Not Wordle

A fullstack Wordle-style internship project built with React, Express, TypeScript, and Postgres.

## Features

- Five-letter guessing game with five attempts.
- Guesses must be valid five-letter words.
- Wordle-style green, yellow, and gray feedback.
- Generated player codes for lightweight session continuity.
- One active game per player.
- Postgres persistence for players, games, guesses, and stats.
- Required get-answer endpoint at `GET /api/games/:id/answer?playerCode=CODE`.

## Local Development

```bash
npm install
npm run dev
```

Set `DATABASE_URL` to a Postgres connection string before starting the server. For deployment, a Neon connection string works well.

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
- Environment variable: `DATABASE_URL=<your Neon pooled Postgres connection string>`
- Node version: `24`

# Definitely Not Wordle Design

## Goal

Build a lean fullstack "Definitely not Wordle" game for the GoLinks internship project. The app should satisfy the brief, feel polished enough for an interview submission, and use a traditional backend architecture that can grow without major rewrites.

The first version prioritizes correctness, deployability, and clean structure over extra game modes.

## Requirements From Brief

- Guess a secret five-letter word within five tries.
- Allow any five-letter letter combination as a guess.
- Return green, yellow, and gray tile feedback after each submitted guess.
- Win when the answer is guessed within five tries.
- Lose after five incorrect tries.
- Include a backend.
- Include a get-answer endpoint.
- Use git and commit progress regularly.
- Deploy the project publicly for submission.

## Product Scope

On first visit, the app generates a player code through the backend. The code is always visible in the UI and stored locally in the browser so the player can refresh or return later. The player code acts as lightweight identity without passwords, email, or OAuth.

Each player has one active game at a time. Completed games are persisted and contribute to history and stats. The player can resume their own active game by returning with the same locally stored code or manually entering the code on another browser.

Sharing another player's games, multiplayer, leaderboards, and social features are out of scope for v1.

## Architecture

Use a traditional TypeScript fullstack app:

- React + Vite frontend.
- Express + TypeScript backend.
- SQLite persistence.
- One Render web service for deployment.

Express serves both the API and the compiled frontend build. SQLite runs on a Render persistent disk. This gives the project one public URL, one deploy target, and a simple operational story while preserving a real backend boundary.

Game scoring lives in a pure TypeScript module with no HTTP or database dependencies. API routes call service functions, and service functions use repository-style database helpers. This keeps scoring easy to test and makes persistence replaceable later.

## Core Data Model

### players

- `code`: unique generated player code, primary identifier.
- `created_at`: creation timestamp.
- `last_seen_at`: updated when the player resumes or plays.

Codes should be short and readable, such as `LIME-8472`. They are not passwords. They only provide lightweight continuity for this project.

### games

- `id`: unique game id.
- `player_code`: owner code.
- `answer`: five-letter answer.
- `status`: `active`, `won`, or `lost`.
- `attempt_count`: number of submitted guesses.
- `created_at`: creation timestamp.
- `completed_at`: nullable completion timestamp.

Only one `active` game should exist per player. Starting a game returns the active game if one already exists.

### guesses

- `id`: unique guess id.
- `game_id`: parent game.
- `attempt_number`: one-based attempt number.
- `guess`: submitted five-letter guess.
- `feedback_json`: serialized tile feedback.
- `created_at`: creation timestamp.

Stats can be derived from completed games for v1 rather than stored separately.

## API Design

### `GET /api/health`

Returns a simple health payload for deployment checks.

### `POST /api/players`

Creates a new player with a generated code and returns the code plus current player state.

### `GET /api/players/:code`

Resumes an existing player. Returns the player, active game if present, recent completed games, and derived stats. Unknown codes return `404`.

### `POST /api/games`

Starts or resumes the requesting player's active game. The JSON request body includes `playerCode`. If the player has an active game, return it. Otherwise create a new game and persist the selected answer.

### `POST /api/games/:id/guesses`

Submits a guess for a game. The JSON request body includes `playerCode` and `guess`.

Validation:

- Game must exist.
- Game must belong to the player code.
- Game must be active.
- Guess must be exactly five alphabetic letters.

Behavior:

- Normalize guesses to lowercase.
- Allow any five-letter letter combination.
- Persist the guess and feedback.
- Mark the game `won` if the guess equals the answer.
- Mark the game `lost` after five incorrect guesses.
- Return the updated game state.

### `GET /api/games/:id/answer`

Returns the answer for a game owned by the requesting player code. The request uses `?playerCode=...` because `GET` requests should not rely on a JSON body. This endpoint exists because the brief requires a get-answer endpoint. It can be used by the UI as a reveal action or by reviewers to verify behavior.

## Scoring Rules

Each submitted five-letter guess receives five tile results:

- `correct`: letter is in the correct position.
- `present`: letter is in the answer but in the wrong position.
- `absent`: letter is not available in the answer.

Repeated letters must be handled with Wordle-style accounting:

1. Mark exact-position matches first.
2. Count remaining unmatched answer letters.
3. For remaining guess letters, mark `present` only while an unmatched answer count exists.
4. Otherwise mark `absent`.

## Frontend Design

The first screen is the game itself, not a marketing page.

Primary UI elements:

- Header with app name, generated player code, and copy/resume controls.
- Five-row game board.
- On-screen keyboard with accumulated letter states.
- Guess input path via physical keyboard and clickable keyboard.
- Status area for win, loss, validation errors, and answer reveal.
- Compact stats/history panel for completed games.

The app should feel focused and polished: clear tile states, responsive mobile layout, accessible color contrast, and smooth but restrained feedback animations.

## Error Handling

Frontend errors should be user-readable and specific enough to recover:

- Invalid code.
- Invalid guess length or characters.
- Game already complete.
- Network or server error.

Backend errors should return consistent JSON with an error code and message.

## Deployment

Deploy as a single Render web service.

Expected deployment shape:

- Build frontend with Vite.
- Build backend TypeScript.
- Express serves static frontend files from the frontend build output.
- SQLite database path is configured by environment variable.
- Render persistent disk stores the SQLite file.
- `/api/health` is used for health checks.

The repository should include setup instructions for local development and Render deployment.

## Testing

Minimum v1 test coverage:

- Unit tests for scoring, including repeated-letter cases.
- API tests for player creation and resume.
- API tests for active game creation and one-active-game behavior.
- API tests for valid guesses, win, loss, ownership checks, and answer endpoint.

Manual verification before submission:

- New player gets a visible code.
- Refresh resumes the same player.
- A different generated player code has separate state.
- Guesses accept any five alphabetic letters.
- Five failed guesses lose the game.
- Correct guess wins the game.
- Deployed URL works on desktop and mobile.

## Out Of Scope For V1

- Passwords, email login, OAuth, or secure authentication.
- Multiplayer.
- Leaderboards.
- Dictionary validation.
- Multiple active games per player.
- Hard-mode rules.
- Admin tools.
- Complex analytics.

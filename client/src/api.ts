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

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

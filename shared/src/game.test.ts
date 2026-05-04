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
      'correct',
      'present',
      'absent'
    ]);
  });

  it('does not over-count repeated letters from the answer', () => {
    expect(scoreGuess('level', 'allee').map((tile) => tile.status)).toEqual([
      'absent',
      'present',
      'present',
      'correct',
      'present'
    ]);
  });

  it('handles repeated correct letters before present letters', () => {
    expect(scoreGuess('array', 'rarer').map((tile) => tile.status)).toEqual([
      'present',
      'present',
      'correct',
      'absent',
      'absent'
    ]);
  });
});

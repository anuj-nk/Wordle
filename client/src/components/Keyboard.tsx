import type { GameState, TileStatus } from '@wordle/shared';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const rank: Record<TileStatus, number> = { absent: 1, present: 2, correct: 3 };

function keyStatuses(game: GameState | null) {
  const statuses = new Map<string, TileStatus>();
  for (const guess of game?.guesses ?? []) {
    for (const tile of guess.feedback) {
      const current = statuses.get(tile.letter);
      if (!current || rank[tile.status] > rank[current]) {
        statuses.set(tile.letter, tile.status);
      }
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
          {row.split('').map((letter) => {
            const status = statuses.get(letter);
            return (
              <button className={status ? `key-${status}` : ''} key={letter} onClick={() => onKey(letter)}>
                {letter}
              </button>
            );
          })}
          {row === 'zxcvbnm' && <button onClick={() => onKey('Backspace')}>Delete</button>}
        </div>
      ))}
    </section>
  );
}

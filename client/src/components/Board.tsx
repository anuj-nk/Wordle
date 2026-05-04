import type { GameState, TileFeedback } from '@wordle/shared';

interface BoardProps {
  game: GameState | null;
  currentGuess: string;
}

type BoardTile = TileFeedback | { letter: string; status: 'empty' | 'typing' };

function emptyRows(count: number) {
  return Array.from({ length: count }, () => Array.from({ length: 5 }, () => ({ letter: '', status: 'empty' as const })));
}

export function Board({ game, currentGuess }: BoardProps) {
  const submitted = game?.guesses.map((guess) => guess.feedback) ?? [];
  const current: BoardTile[] = currentGuess.padEnd(5).split('').map((letter) => ({ letter, status: 'typing' }));
  const rowCount = 5 - submitted.length - (game?.status === 'active' ? 1 : 0);
  const rows: BoardTile[][] = [
    ...submitted,
    ...(game?.status === 'active' ? [current] : []),
    ...emptyRows(Math.max(0, rowCount))
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

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
          <li key={game.id}>
            <span>{game.status} in {game.attemptCount}/5</span>
            {game.answer && <strong>{game.answer.toUpperCase()}</strong>}
          </li>
        ))}
      </ul>
    </aside>
  );
}

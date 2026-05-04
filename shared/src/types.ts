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

// Game State and Player State interfaces for Word Duel

export interface GameState {
  gameId: string;
  mode: 'single' | 'multi';
  status: 'waiting' | 'active' | 'finished';
  winner: null | 'player1' | 'player2' | 'draw';
  startTime: number;
  timeLimit: number;
  wordLength: 4 | 5;
  currentPlayer: string;
  player1: PlayerState;
  player2: PlayerState;
}

export interface PlayerState {
  id: string;
  username: string;
  secretWord: string;
  secretWordDefinition?: string; // Definition of the secret word (populated when game ends)
  guesses: GuessResult[];
  isAI: boolean;
  difficulty?: 'easy' | 'medium' | 'difficult';
}

export interface GuessResult {
  guess: string;
  feedback: ('green' | 'yellow' | 'red')[];
  timestamp: number;
}

export interface UserData {
  username: string;
  points: number;
  coins: number;
  gamesPlayed: number;
  gamesWon: number;
  averageGuesses: number;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  rank: number;
}

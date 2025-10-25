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
  statisticsUpdated?: boolean; // Flag to prevent double statistics updates
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
  profilePicture: string;
  points: number;
  coins: number;
  gamesPlayed: number;
  gamesWon: number;
  isRedditProfile?: boolean; // Flag to indicate if profile picture is from Reddit
}

export interface LeaderboardEntry {
  username: string;
  profilePicture: string;
  points: number;
  rank: number;
  userId: string;
}

export interface ScoreBreakdown {
  basePoints: number;
  guessBonus: number;
  speedBonus: number;
  letterBonus: number;
  difficultyMultiplier: number;
  multiplayerMultiplier: number;
  totalScore: number;
  correctLettersCount: number;
}

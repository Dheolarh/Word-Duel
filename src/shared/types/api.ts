import { GameState, LeaderboardEntry, ScoreBreakdown } from './game';

// Legacy API responses (keeping for compatibility)
export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

// Word Duel API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'GAME_ERROR' | 'SERVER_ERROR';
  retryable?: boolean;
}

export interface ValidationResponse {
  success: boolean;
  data?: {
    valid: boolean;
    word: string;
  };
  error?: string;
  code?: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'GAME_ERROR' | 'SERVER_ERROR';
  retryable?: boolean;
}

export interface GameCreationResponse {
  gameId: string;
  status: 'ready' | 'waiting';
}

export interface SubmitGuessRequest {
  gameId: string;
  playerId: string;
  guess: string;
}

export interface SubmitGuessResponse {
  success: boolean;
  data?: {
    gameState: GameState;
    guessResult: {
      guess: string;
      feedback: ('green' | 'yellow' | 'red')[];
      timestamp: number;
    };
    gameEnded: boolean;
    scoreBreakdown?: ScoreBreakdown;
  };
  error?: string;
  code?: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'GAME_ERROR' | 'SERVER_ERROR';
  retryable?: boolean;
}

export interface GetGameStateResponse {
  success: boolean;
  data?: {
    gameState: GameState;
    scoreBreakdown?: ScoreBreakdown;
  };
  error?: string;
  code?: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'GAME_ERROR' | 'SERVER_ERROR';
  retryable?: boolean;
}

export interface CreateGameRequest {
  mode: 'single' | 'multi';
  wordLength: 4 | 5;
  secretWord: string;
  difficulty?: 'easy' | 'medium' | 'difficult';
}

export interface GetLeaderboardResponse {
  success: boolean;
  leaderboard?: LeaderboardEntry[];
  currentPlayerData?: LeaderboardEntry;
  error?: string;
}

export interface UserProfileResponse {
  success: boolean;
  data?: {
    profile: {
      userId: string;
      username: string;
      profilePicture: string;
      isRedditProfile: boolean;
    };
  };
  error?: string;
  code?: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'GAME_ERROR' | 'SERVER_ERROR';
  retryable?: boolean;
}

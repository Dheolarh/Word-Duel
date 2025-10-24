import { GameState, PlayerState } from '../../shared/types/game';

/**
 * Generate a unique game ID
 */
export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new player state
 */
export function createPlayerState(
  id: string,
  username: string,
  secretWord: string,
  isAI = false,
  difficulty?: 'easy' | 'medium' | 'difficult'
): PlayerState {
  const playerState: PlayerState = {
    id,
    username,
    secretWord,
    guesses: [],
    isAI
  };
  
  if (difficulty !== undefined) {
    playerState.difficulty = difficulty;
  }
  
  return playerState;
}

/**
 * Create a new game state
 */
export function createGameState(
  gameId: string,
  mode: 'single' | 'multi',
  wordLength: 4 | 5,
  player1: PlayerState,
  player2: PlayerState,
  timeLimit: number
): GameState {
  return {
    gameId,
    mode,
    status: 'waiting',
    winner: null,
    startTime: Date.now(),
    timeLimit,
    wordLength,
    currentPlayer: player1.id,
    player1,
    player2
  };
}

/**
 * Check if a game has ended
 */
export function isGameEnded(gameState: GameState): boolean {
  if (gameState.status === 'finished') return true;
  
  // Check if time limit exceeded
  const timeElapsed = Date.now() - gameState.startTime;
  if (timeElapsed > gameState.timeLimit) return true;
  
  // Check if either player has won
  const player1Won = gameState.player1.guesses.some(guess => 
    guess.guess === gameState.player2.secretWord
  );
  const player2Won = gameState.player2.guesses.some(guess => 
    guess.guess === gameState.player1.secretWord
  );
  
  if (player1Won || player2Won) return true;
  
  // Check if players have exceeded their maximum attempts based on difficulty
  const getMaxAttempts = (difficulty?: 'easy' | 'medium' | 'difficult'): number => {
    switch (difficulty) {
      case 'easy': return Infinity; // Unlimited attempts
      case 'medium': return 15;
      case 'difficult': return 10;
      default: return Infinity; // Default to unlimited for multiplayer
    }
  };
  
  const player1MaxAttempts = getMaxAttempts(gameState.player1.difficulty);
  const player2MaxAttempts = getMaxAttempts(gameState.player2.difficulty);
  
  const player1ExceededAttempts = gameState.player1.guesses.length >= player1MaxAttempts;
  const player2ExceededAttempts = gameState.player2.guesses.length >= player2MaxAttempts;
  
  // For single player mode: game ends if human player (non-AI) reaches max attempts
  // In single player, player1 is human, player2 is AI
  if (gameState.mode === 'single') {
    const humanPlayer = gameState.player1.isAI ? gameState.player2 : gameState.player1;
    const humanMaxAttempts = getMaxAttempts(humanPlayer.difficulty);
    const humanExceededAttempts = humanPlayer.guesses.length >= humanMaxAttempts;
    
    if (humanExceededAttempts) return true;
  }
  
  // For multiplayer: game ends if both players have exceeded their attempts
  return player1ExceededAttempts && player2ExceededAttempts;
}

/**
 * Determine the winner of a game
 */
export function determineWinner(gameState: GameState): 'player1' | 'player2' | 'draw' | null {
  if (!isGameEnded(gameState)) return null;
  
  const player1Won = gameState.player1.guesses.some(guess => 
    guess.guess === gameState.player2.secretWord
  );
  const player2Won = gameState.player2.guesses.some(guess => 
    guess.guess === gameState.player1.secretWord
  );
  
  if (player1Won && player2Won) {
    // Both won, check who won first
    const player1WinTime = gameState.player1.guesses.find(guess => 
      guess.guess === gameState.player2.secretWord
    )?.timestamp || Infinity;
    
    const player2WinTime = gameState.player2.guesses.find(guess => 
      guess.guess === gameState.player1.secretWord
    )?.timestamp || Infinity;
    
    return player1WinTime < player2WinTime ? 'player1' : 'player2';
  }
  
  if (player1Won) return 'player1';
  if (player2Won) return 'player2';
  
  // Check if game ended due to max attempts (only for human player)
  if (gameState.mode === 'single') {
    const humanPlayer = gameState.player1.isAI ? gameState.player2 : gameState.player1;
    const aiPlayer = gameState.player1.isAI ? gameState.player1 : gameState.player2;
    
    const getMaxAttempts = (difficulty?: 'easy' | 'medium' | 'difficult'): number => {
      switch (difficulty) {
        case 'easy': return Infinity;
        case 'medium': return 15;
        case 'difficult': return 10;
        default: return Infinity;
      }
    };
    
    const humanMaxAttempts = getMaxAttempts(humanPlayer.difficulty);
    const humanExceededAttempts = humanPlayer.guesses.length >= humanMaxAttempts;
    
    // If human player exceeded attempts without winning, AI wins (player loses)
    if (humanExceededAttempts && !player1Won && !player2Won) {
      return aiPlayer.id === gameState.player1.id ? 'player1' : 'player2';
    }
  }
  
  // Time expired with no winner - draw
  return 'draw';
}

/**
 * Validate word format
 */
export function isValidWordFormat(word: string, expectedLength: number): boolean {
  if (!word || typeof word !== 'string') return false;
  
  const normalizedWord = word.toUpperCase().trim();
  
  if (normalizedWord.length !== expectedLength) return false;
  if (!/^[A-Z]+$/.test(normalizedWord)) return false;
  
  return true;
}

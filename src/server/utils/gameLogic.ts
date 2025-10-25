/**
 * Core game logic for Word Duel
 * Implements guess feedback algorithm and game state management
 */

import { GuessResult } from '../../shared/types/game';

/**
 * Generate feedback for a guess against a secret word
 * Returns array of 'green', 'yellow', or 'red' for each letter
 * 
 * Green: Correct letter in correct position
 * Yellow: Correct letter in wrong position
 * Red: Letter not in the secret word
 */
export function generateGuessFeedback(guess: string, secretWord: string): ('green' | 'yellow' | 'red')[] {
  const normalizedGuess = guess.toUpperCase().trim();
  const normalizedSecret = secretWord.toUpperCase().trim();
  
  if (normalizedGuess.length !== normalizedSecret.length) {
    throw new Error('Guess and secret word must be the same length');
  }
  
  const feedback: ('green' | 'yellow' | 'red')[] = new Array(normalizedGuess.length);
  const secretChars = normalizedSecret.split('');
  const guessChars = normalizedGuess.split('');
  
  // First pass: Mark exact matches (green) and remove them from consideration
  for (let i = 0; i < normalizedGuess.length; i++) {
    if (guessChars[i] === secretChars[i]) {
      feedback[i] = 'green';
      secretChars[i] = ''; // Mark as used
      guessChars[i] = ''; // Mark as used
    }
  }
  
  // Second pass: Mark partial matches (yellow) and misses (red)
  for (let i = 0; i < normalizedGuess.length; i++) {
    const currentChar = guessChars[i];
    if (currentChar && currentChar !== '') { // Not already marked as green
      const secretIndex = secretChars.indexOf(currentChar);
      if (secretIndex !== -1) {
        feedback[i] = 'yellow';
        secretChars[secretIndex] = ''; // Mark as used
      } else {
        feedback[i] = 'red';
      }
    }
  }
  
  return feedback;
}

/**
 * Create a guess result with feedback
 */
export function createGuessResult(guess: string, secretWord: string): GuessResult {
  const feedback = generateGuessFeedback(guess, secretWord);
  
  return {
    guess: guess.toUpperCase().trim(),
    feedback,
    timestamp: Date.now()
  };
}

/**
 * Check if a guess is correct (all green feedback)
 */
export function isCorrectGuess(guessResult: GuessResult): boolean {
  return guessResult.feedback.every(color => color === 'green');
}

/**
 * Check if a player has won by guessing the secret word
 */
export function hasPlayerWon(guesses: GuessResult[]): boolean {
  return guesses.some(guess => isCorrectGuess(guess));
}

/**
 * Get the winning guess from a player's guesses
 */
export function getWinningGuess(guesses: GuessResult[]): GuessResult | null {
  return guesses.find(guess => isCorrectGuess(guess)) || null;
}

/**
 * Count unique correctly guessed letters (green and yellow feedback) across all guesses
 * Only counts each letter once, even if it appears multiple times across different guesses
 */
export function countCorrectLetters(guesses: GuessResult[]): number {
  const uniqueCorrectLetters = new Set<string>();
  
  guesses.forEach(guess => {
    guess.guess.split('').forEach((letter, index) => {
      const feedback = guess.feedback[index];
      if (feedback === 'green' || feedback === 'yellow') {
        uniqueCorrectLetters.add(letter.toUpperCase());
      }
    });
  });
  
  return uniqueCorrectLetters.size;
}

/**
 * Calculate points awarded for a game result with comprehensive scoring system
 */
export function calculatePoints(
  won: boolean,
  guessCount: number,
  timeRemaining: number,
  difficulty?: 'easy' | 'medium' | 'difficult',
  isMultiplayer: boolean = false,
  guesses: GuessResult[] = []
): number {
  // Base points for participation
  const basePoints = 50;
  
  // Loss points (different for single vs multiplayer)
  if (!won) {
    if (isMultiplayer) {
      return 100; // Multiplayer loss points
    } else {
      // Single player loss points based on difficulty
      switch (difficulty) {
        case 'easy': return 20;
        case 'medium': return 30;
        case 'difficult': return 50;
        default: return 20;
      }
    }
  }
  
  // Difficulty multiplier
  const difficultyMultipliers = {
    easy: 1.0,
    medium: 1.3,
    difficult: 1.6
  };
  
  const difficultyMultiplier = difficulty ? difficultyMultipliers[difficulty] : 1.0;
  
  // Guess efficiency bonus (fewer guesses = higher bonus)
  const maxGuesses = 6;
  const guessBonus = Math.max(0, (maxGuesses - guessCount) * 15);
  
  // Speed bonus (time remaining bonus)
  const speedBonus = Math.min(60, Math.floor(timeRemaining / 1000 / 5)); // 1 point per 5 seconds remaining
  
  // Letter accuracy bonus (5 points per correctly guessed letter)
  const correctLettersCount = countCorrectLetters(guesses);
  const letterBonus = correctLettersCount * 5;
  
  // Multiplayer multiplier (2.5x for multiplayer)
  const multiplayerMultiplier = isMultiplayer ? 2.5 : 1.0;
  
  // Calculate final score
  const totalScore = Math.floor(
    (basePoints + guessBonus + speedBonus + letterBonus) * 
    difficultyMultiplier * 
    multiplayerMultiplier
  );
  
  return totalScore;
}

/**
 * Calculate detailed score breakdown for display
 */
export function calculateScoreBreakdown(
  won: boolean,
  guessCount: number,
  timeRemaining: number,
  difficulty?: 'easy' | 'medium' | 'difficult',
  isMultiplayer: boolean = false,
  guesses: GuessResult[] = []
): {
  basePoints: number;
  guessBonus: number;
  speedBonus: number;
  letterBonus: number;
  difficultyMultiplier: number;
  multiplayerMultiplier: number;
  totalScore: number;
  correctLettersCount: number;
} {
  const basePoints = 50;
  
  if (!won) {
    let lossPoints: number;
    if (isMultiplayer) {
      lossPoints = 100;
    } else {
      switch (difficulty) {
        case 'easy': lossPoints = 20; break;
        case 'medium': lossPoints = 30; break;
        case 'difficult': lossPoints = 50; break;
        default: lossPoints = 20;
      }
    }
    
    return {
      basePoints: lossPoints,
      guessBonus: 0,
      speedBonus: 0,
      letterBonus: 0,
      difficultyMultiplier: 1.0,
      multiplayerMultiplier: 1.0,
      totalScore: lossPoints,
      correctLettersCount: 0
    };
  }
  
  const difficultyMultipliers = {
    easy: 1.0,
    medium: 1.3,
    difficult: 1.6
  };
  
  const difficultyMultiplier = difficulty ? difficultyMultipliers[difficulty] : 1.0;
  const maxGuesses = 6;
  const guessBonus = Math.max(0, (maxGuesses - guessCount) * 15);
  const speedBonus = Math.min(60, Math.floor(timeRemaining / 1000 / 5));
  const correctLettersCount = countCorrectLetters(guesses);
  const letterBonus = correctLettersCount * 5;
  const multiplayerMultiplier = isMultiplayer ? 2.5 : 1.0;
  
  const totalScore = Math.floor(
    (basePoints + guessBonus + speedBonus + letterBonus) * 
    difficultyMultiplier * 
    multiplayerMultiplier
  );
  
  return {
    basePoints,
    guessBonus,
    speedBonus,
    letterBonus,
    difficultyMultiplier,
    multiplayerMultiplier,
    totalScore,
    correctLettersCount
  };
}

/**
 * Calculate coins awarded for a game result
 */
export function calculateCoins(points: number): number {
  // Award 1 coin per 10 points
  return Math.floor(points / 10);
}

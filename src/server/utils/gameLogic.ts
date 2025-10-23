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
 * Calculate points awarded for a game result
 */
export function calculatePoints(
  won: boolean,
  guessCount: number,
  timeRemaining: number,
  difficulty?: 'easy' | 'medium' | 'difficult'
): number {
  if (!won) return 0;
  
  let basePoints = 100;
  
  // Bonus for fewer guesses (max 6 guesses)
  const guessBonus = Math.max(0, (6 - guessCount) * 10);
  
  // Bonus for time remaining (up to 50 points)
  const timeBonus = Math.min(50, Math.floor(timeRemaining / 1000 / 6)); // 1 point per 6 seconds
  
  // Difficulty multiplier
  let difficultyMultiplier = 1;
  if (difficulty === 'medium') difficultyMultiplier = 1.2;
  if (difficulty === 'difficult') difficultyMultiplier = 1.5;
  
  return Math.floor((basePoints + guessBonus + timeBonus) * difficultyMultiplier);
}

/**
 * Calculate coins awarded for a game result
 */
export function calculateCoins(points: number): number {
  // Award 1 coin per 10 points
  return Math.floor(points / 10);
}
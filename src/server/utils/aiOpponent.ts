/**
 * AI Opponent System for Word Duel
 * Implements three difficulty levels with different strategies
 */

import { GuessResult } from '../../shared/types/game';
import { generateGuessFeedback } from './gameLogic';
import { fetchComprehensiveWordList } from '../services/dictionaryApi';

// Word list cache - loaded from JSON at server start
let CACHED_FOUR_LETTER_WORDS: string[] = [];
let CACHED_FIVE_LETTER_WORDS: string[] = [];
let isLoadingFourLetter = false;
let isLoadingFiveLetter = false;

/**
 * Initialize word lists from local JSON
 * This is called at startup and loads all words into memory
 */
export async function initializeWordLists(): Promise<void> {
  console.log('Initializing AI word lists from local JSON...');
  // Pre-load both word lists at startup for fast runtime access
  try {
    const words4 = await fetchComprehensiveWordList(4);
    CACHED_FOUR_LETTER_WORDS = words4.success ? words4.words : [];
    console.log(`Loaded ${CACHED_FOUR_LETTER_WORDS.length} 4-letter words from JSON`);

    const words5 = await fetchComprehensiveWordList(5);
    CACHED_FIVE_LETTER_WORDS = words5.success ? words5.words : [];
    console.log(`Loaded ${CACHED_FIVE_LETTER_WORDS.length} 5-letter words from JSON`);
  } catch (error) {
    console.error('Failed to initialize AI word lists:', error);
  }
}

/**
 * Get word list for AI from the local cache (no external API calls)
 */
async function getWordList(wordLength: 4 | 5): Promise<string[]> {
  const isFourLetter = wordLength === 4;
  const cached = isFourLetter ? CACHED_FOUR_LETTER_WORDS : CACHED_FIVE_LETTER_WORDS;

  // If already cached and not empty, return immediately
  if (cached.length > 0) {
    return cached;
  }

  // Prevent duplicate loading
  const isLoading = isFourLetter ? isLoadingFourLetter : isLoadingFiveLetter;
  if (isLoading) {
    // Wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 200));
    const checkCached = isFourLetter ? CACHED_FOUR_LETTER_WORDS : CACHED_FIVE_LETTER_WORDS;
    if (checkCached.length > 0) {
      return checkCached;
    }
    // If still not available, return empty array
    console.error(`CRITICAL: Failed to load ${wordLength}-letter words - concurrent loading issue`);
    return [];
  }

  // Set loading flag
  if (isFourLetter) {
    isLoadingFourLetter = true;
  } else {
    isLoadingFiveLetter = true;
  }

  try {
    console.log(`Loading ${wordLength}-letter words from JSON...`);
    const result = await fetchComprehensiveWordList(wordLength);

    if (result.success && result.words.length > 0) {
      if (isFourLetter) {
        CACHED_FOUR_LETTER_WORDS = result.words;
      } else {
        CACHED_FIVE_LETTER_WORDS = result.words;
      }
      console.log(`Successfully loaded ${result.words.length} ${wordLength}-letter words`);
      return result.words;
    } else {
      console.warn(`JSON load returned no words for ${wordLength}-letter words`);
    }
  } catch (error) {
    console.error(`Failed to load ${wordLength}-letter words:`, error);
  } finally {
    // Reset loading flag
    if (isFourLetter) {
      isLoadingFourLetter = false;
    } else {
      isLoadingFiveLetter = false;
    }
  }

  // Fallback to empty array - JSON loading failed
  console.error(`CRITICAL: Failed to load ${wordLength}-letter words from JSON!`);
  return [];
}

/**
 * Select a strategic first guess word from the JSON word list
 * Prioritizes words with common letters for better game strategy
 */
async function getStrategicFirstGuess(wordLength: 4 | 5): Promise<string> {
  const wordList = await getWordList(wordLength);
  
  if (wordList.length === 0) {
    // Fallback if JSON loading failed
    return wordLength === 4 ? 'TEAR' : 'CRANE';
  }

  // Common letters to prioritize
  // For 4-letter: E, A, R, T, O
  // For 5-letter: E, A, R, I, O, T, N, S
  const commonLetters = wordLength === 4 
    ? ['E', 'A', 'R', 'T', 'O']
    : ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S'];

  // Score words based on how many common letters they contain (unique letters only)
  const scoredWords = wordList.map(word => {
    const uniqueLetters = new Set(word.split(''));
    const score = Array.from(uniqueLetters).filter(letter => 
      commonLetters.includes(letter)
    ).length;
    return { word, score };
  });

  // Sort by score (descending) and get top candidates
  scoredWords.sort((a, b) => b.score - a.score);
  
  // Pick a random word from the top 10 scoring words for variety
  const topWords = scoredWords.slice(0, 10);
  const selectedWord = topWords[Math.floor(Math.random() * topWords.length)];
  
  return selectedWord?.word || wordList[0] || (wordLength === 4 ? 'TEAR' : 'CRANE');
}

/**
 * Generate a random word from the JSON-backed word list (no API calls)
 */
async function generateRandomWordFromJSONList(wordLength: 4 | 5): Promise<string> {
  const wordList = await getWordList(wordLength);

  if (wordList.length > 0) {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    return randomWord || (wordLength === 4 ? 'WORD' : 'WORDS');
  }

  // Ultimate fallback if JSON loading completely failed
  console.error(`CRITICAL: Empty word list for ${wordLength}-letter words, using hardcoded fallback`);
  return wordLength === 4 ? 'WORD' : 'WORDS';
}


export interface AIStrategy {
  selectWord(wordLength: 4 | 5): Promise<string>;
  makeGuess(
    wordLength: 4 | 5,
    previousGuesses: GuessResult[],
    opponentSecretWord?: string
  ): Promise<string>;
  getTimingInterval(): { min: number; max: number };
  getMaxAttempts(): number;
}

/**
 * Easy AI Strategy
 * - Random guessing with unlimited attempts
 * - Uses only green feedback for subsequent guesses
 * - 1-2 second intervals between guesses
 */
export class EasyAI implements AIStrategy {
  private usedWords: Set<string> = new Set();

  async selectWord(wordLength: 4 | 5): Promise<string> {
    return await generateRandomWordFromJSONList(wordLength);
  }

  async makeGuess(
    wordLength: 4 | 5,
    previousGuesses: GuessResult[],
    _opponentSecretWord?: string
  ): Promise<string> {
    const wordList = await getWordList(wordLength);

    if (previousGuesses.length === 0) {
      // First guess - use strategic word from JSON
      const firstGuess = await getStrategicFirstGuess(wordLength);
      this.usedWords.add(firstGuess);
      return firstGuess;
    }

    // Filter based on green feedback only
    let availableWords = wordList.filter((word) => {
      if (this.usedWords.has(word)) return false;

      // Check against all previous guesses
      for (const guess of previousGuesses) {
        // Skip if lengths don't match (safety check)
        if (guess.guess.length !== word.length) {
          continue;
        }

        for (let i = 0; i < guess.feedback.length; i++) {
          if (guess.feedback[i] === 'green' && word[i] !== guess.guess[i]) {
            return false;
          }
        }
      }
      return true;
    });

    if (availableWords.length === 0) {
      // Fallback to any unused word
      availableWords = wordList.filter((word) => !this.usedWords.has(word));
    }

    if (availableWords.length === 0) {
      // Ultimate fallback - reset and use any word
      this.usedWords.clear();
      availableWords = wordList;
    }

    // Shuffle available words for better randomization
    const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);

    const selectedWord =
      shuffledWords[Math.floor(Math.random() * shuffledWords.length)] ||
      (wordLength === 4 ? 'WORD' : 'WORDS');
    this.usedWords.add(selectedWord);
    return selectedWord;
  }

  getTimingInterval(): { min: number; max: number } {
    return { min: 1000, max: 2000 }; // 1-2 seconds
  }

  getMaxAttempts(): number {
    return Infinity; // Unlimited attempts
  }
}

/**
 * Medium AI Strategy
 * - Uses green and red feedback for filtering
 * - Ignores yellow (wrong position) feedback
 * - 0.8-1.5 second intervals between guesses
 * - Maximum 10 attempts
 */
export class MediumAI implements AIStrategy {
  private usedWords: Set<string> = new Set();

  async selectWord(wordLength: 4 | 5): Promise<string> {
    return await generateRandomWordFromJSONList(wordLength);
  }

  async makeGuess(
    wordLength: 4 | 5,
    previousGuesses: GuessResult[],
    _opponentSecretWord?: string
  ): Promise<string> {
    const wordList = await getWordList(wordLength);

    if (previousGuesses.length === 0) {
      // First guess - use strategic word from JSON
      const firstGuess = await getStrategicFirstGuess(wordLength);
      this.usedWords.add(firstGuess);
      return firstGuess;
    }

    // Filter based on green and red feedback
    let availableWords = wordList.filter((word) => {
      if (this.usedWords.has(word)) return false;

      // Check against all previous guesses
      for (const guess of previousGuesses) {
        // Skip if lengths don't match (safety check)
        if (guess.guess.length !== word.length) {
          continue;
        }

        for (let i = 0; i < guess.feedback.length; i++) {
          const letter = guess.guess[i];
          const feedback = guess.feedback[i];

          if (feedback === 'green' && word[i] !== letter) {
            return false;
          }
          if (feedback === 'red' && word.includes(letter || '')) {
            return false;
          }
          // Ignore yellow feedback (medium AI limitation)
        }
      }
      return true;
    });

    if (availableWords.length === 0) {
      // Fallback to any unused word
      availableWords = wordList.filter((word) => !this.usedWords.has(word));
    }

    if (availableWords.length === 0) {
      // Ultimate fallback - reset and use any word
      this.usedWords.clear();
      availableWords = wordList;
    }

    // Shuffle available words for better randomization
    const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);

    const selectedWord =
      shuffledWords[Math.floor(Math.random() * shuffledWords.length)] ||
      (wordLength === 4 ? 'WORD' : 'WORDS');
    this.usedWords.add(selectedWord);
    return selectedWord;
  }

  getTimingInterval(): { min: number; max: number } {
    return { min: 800, max: 1500 }; // 0.8-1.5 seconds
  }

  getMaxAttempts(): number {
    return Infinity; // Unlimited attempts for AI
  }
}

/**
 * Difficult AI Strategy
 * - Full deductive algorithm using all feedback types
 * - Handles duplicate letters correctly
 * - Strategic first guesses with common vowels and consonants
 * - 6-7 second intervals between guesses
 * - Maximum 6 attempts
 */
export class DifficultAI implements AIStrategy {
  private usedWords: Set<string> = new Set();

  async selectWord(wordLength: 4 | 5): Promise<string> {
    return await generateRandomWordFromJSONList(wordLength);
  }

  async makeGuess(
    wordLength: 4 | 5,
    previousGuesses: GuessResult[],
    _opponentSecretWord?: string
  ): Promise<string> {
    const wordList = await getWordList(wordLength);

    if (previousGuesses.length === 0) {
      // First guess - use strategic word with common letters from JSON
      const firstGuess = await getStrategicFirstGuess(wordLength);
      this.usedWords.add(firstGuess);
      return firstGuess;
    }

    // Advanced filtering using all feedback types
    let availableWords = wordList.filter((word) => {
      if (this.usedWords.has(word)) return false;

      return this.isWordCompatible(word, previousGuesses);
    });

    if (availableWords.length === 0) {
      // Fallback to any unused word
      availableWords = wordList.filter((word) => !this.usedWords.has(word));
    }

    if (availableWords.length === 0) {
      // Ultimate fallback - reset and use any word
      this.usedWords.clear();
      availableWords = wordList;
    }

    // Choose word with maximum information gain
    const bestWords = this.selectBestWords(availableWords, previousGuesses);

    // Add some randomness even for difficult AI to avoid predictability
    const randomIndex = Math.floor(Math.random() * Math.min(3, bestWords.length));
    const selectedWord = bestWords[randomIndex] || (wordLength === 4 ? 'WORD' : 'WORDS');
    this.usedWords.add(selectedWord);
    return selectedWord;
  }

  private isWordCompatible(word: string, previousGuesses: GuessResult[]): boolean {
    for (const guess of previousGuesses) {
      // Skip if lengths don't match (shouldn't happen, but safety check)
      if (guess.guess.length !== word.length) {
        continue;
      }

      // Simulate what the feedback would be if this word was the secret
      const simulatedFeedback = generateGuessFeedback(guess.guess, word);

      // Check if simulated feedback matches actual feedback
      for (let i = 0; i < simulatedFeedback.length; i++) {
        if (simulatedFeedback[i] !== guess.feedback[i]) {
          return false;
        }
      }
    }
    return true;
  }

  private selectBestWords(availableWords: string[], previousGuesses: GuessResult[]): string[] {
    if (availableWords.length <= 2) {
      // If few options left, just return them
      return availableWords;
    }

    // Score words based on letter frequency and position diversity
    const scoredWords = availableWords
      .slice(0, Math.min(20, availableWords.length))
      .map((word) => ({
        word,
        score: this.calculateWordScore(word, previousGuesses),
      }));

    // Sort by score (highest first)
    scoredWords.sort((a, b) => b.score - a.score);

    return scoredWords.map((item) => item.word);
  }

  private calculateWordScore(word: string, _previousGuesses: GuessResult[]): number {
    let score = 0;
    const letterCounts = new Map<string, number>();

    // Count unique letters (diversity bonus)
    for (const letter of word) {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    }

    score += letterCounts.size * 10; // Bonus for unique letters

    // Penalty for repeated letters (unless we know there are duplicates)
    for (const [, count] of letterCounts) {
      if (count > 1) {
        score -= 5 * (count - 1);
      }
    }

    // Bonus for common letters in English
    const commonLetters = 'ETAOINSHRDLU';
    for (const letter of word) {
      const commonIndex = commonLetters.indexOf(letter);
      if (commonIndex !== -1) {
        score += 12 - commonIndex;
      }
    }

    return score + Math.random() * 5; // Add small random factor
  }

  getTimingInterval(): { min: number; max: number } {
    return { min: 6000, max: 7000 }; // 6-7 seconds
  }

  getMaxAttempts(): number {
    return Infinity; // Unlimited attempts for AI
  }
}

/**
 * AI Opponent Manager
 * Handles AI opponent creation and guess generation
 */
export class AIOpponentManager {
  private static strategies = new Map<string, AIStrategy>();

  /**
   * Create an AI strategy instance for a game
   */
  static createAIStrategy(gameId: string, difficulty: 'easy' | 'medium' | 'difficult'): AIStrategy {
    let strategy: AIStrategy;

    switch (difficulty) {
      case 'easy':
        strategy = new EasyAI();
        break;
      case 'medium':
        strategy = new MediumAI();
        break;
      case 'difficult':
        strategy = new DifficultAI();
        break;
      default:
        strategy = new EasyAI();
    }

    this.strategies.set(gameId, strategy);
    return strategy;
  }

  /**
   * Get AI strategy for a game
   */
  static getAIStrategy(gameId: string): AIStrategy | null {
    return this.strategies.get(gameId) || null;
  }

  /**
   * Generate AI secret word using dictionary API
   */
  static async generateAISecretWord(
    wordLength: 4 | 5,
    difficulty: 'easy' | 'medium' | 'difficult'
  ): Promise<string> {
    const strategy = new (
      difficulty === 'easy' ? EasyAI : difficulty === 'medium' ? MediumAI : DifficultAI
    )();
    return await strategy.selectWord(wordLength);
  }

  /**
   * Generate AI guess using dictionary API validation
   */
  static async generateAIGuess(
    gameId: string,
    wordLength: 4 | 5,
    previousGuesses: GuessResult[],
    difficulty: 'easy' | 'medium' | 'difficult',
    opponentSecretWord?: string
  ): Promise<string> {
    let strategy = this.strategies.get(gameId);

    if (!strategy) {
      strategy = this.createAIStrategy(gameId, difficulty);
    }

    try {
      const guess = await strategy.makeGuess(wordLength, previousGuesses, opponentSecretWord);

      // Validate the guess length as a safety check
      if (guess.length !== wordLength) {
        console.warn(`AI generated guess with wrong length: ${guess} (expected ${wordLength})`);
        return wordLength === 4 ? 'WORD' : 'WORDS';
      }

      return guess;
    } catch (error) {
      console.error('AI guess generation failed:', error);
      // Fallback to a safe default word
      return wordLength === 4 ? 'WORD' : 'WORDS';
    }
  }

  /**
   * Get timing interval for AI guess
   */
  static getAITimingInterval(difficulty: 'easy' | 'medium' | 'difficult'): {
    min: number;
    max: number;
  } {
    const strategy = new (
      difficulty === 'easy' ? EasyAI : difficulty === 'medium' ? MediumAI : DifficultAI
    )();
    return strategy.getTimingInterval();
  }

  /**
   * Check if AI should make another guess
   */
  static shouldAIMakeGuess(
    previousGuesses: GuessResult[],
    difficulty: 'easy' | 'medium' | 'difficult'
  ): boolean {
    const strategy = new (
      difficulty === 'easy' ? EasyAI : difficulty === 'medium' ? MediumAI : DifficultAI
    )();
    const maxAttempts = strategy.getMaxAttempts();
    
    // For unlimited attempts (Infinity), always allow more guesses
    if (maxAttempts === Infinity) {
      return true;
    }
    
    return previousGuesses.length < maxAttempts;
  }

  /**
   * Clean up AI strategy when game ends
   */
  static cleanupAIStrategy(gameId: string): void {
    this.strategies.delete(gameId);
  }

  /**
   * Get random timing within AI's interval
   */
  static getRandomAITiming(difficulty: 'easy' | 'medium' | 'difficult'): number {
    const interval = this.getAITimingInterval(difficulty);
    return Math.floor(Math.random() * (interval.max - interval.min + 1)) + interval.min;
  }
}

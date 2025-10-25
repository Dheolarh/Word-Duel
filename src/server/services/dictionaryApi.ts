/**
 * Local JSON-backed word service
 * Uses the curated JSON files under src/server/services for all word lookups
 * This removes any external network dependency for validation and word lists.
 */

import l4Data from './l4_letters_definations.json';
import l5Data from './l5_letters_definations.json';
import { createValidationError, createServerError } from '../middleware/errorHandler';

export interface DictionaryValidationResult {
  isValid: boolean;
  word: string;
  error?: string;
}

export interface WordListResult {
  words: string[];
  success: boolean;
  error?: string;
}

// Normalize JSON maps to uppercase-key maps for fast lookup
const L4_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(l4Data).map(([k, v]) => [k.toUpperCase(), (v as string) || ''])
);

const L5_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(l5Data).map(([k, v]) => [k.toUpperCase(), (v as string) || ''])
);


/**
 * Return all words of the requested length from local JSON data
 */
export async function fetchComprehensiveWordList(length: 4 | 5): Promise<WordListResult> {
  try {
    const map = length === 4 ? L4_MAP : L5_MAP;
    
    if (!map) {
      throw createValidationError(`Unsupported word length: ${length}`);
    }
    
    const words = Object.keys(map || {});
    console.log(`Loaded ${words.length} ${length}-letter words from local JSON`);
    return { words, success: true };
  } catch (error) {
    console.error('Error loading word list:', error);
    
    if (error instanceof Error && error.message.includes('Unsupported')) {
      return { words: [], success: false, error: error.message };
    }
    
    return { 
      words: [], 
      success: false, 
      error: 'Failed to load word dictionary' 
    };
  }
}

/**
 * Validate a single word against the local JSON dictionary
 */
export async function validateWordWithDictionary(
  word: string
): Promise<DictionaryValidationResult> {
  try {
    const normalized = word.toUpperCase().trim();

    if (!normalized || !/^[A-Z]+$/.test(normalized)) {
      return { isValid: false, word: normalized, error: 'Invalid word format' };
    }

    const map = normalized.length === 4 ? L4_MAP : normalized.length === 5 ? L5_MAP : null;

    if (!map) {
      return { isValid: false, word: normalized, error: 'Unsupported word length' };
    }

    if (map[normalized]) {
      return { isValid: true, word: normalized };
    }

    return { isValid: false, word: normalized, error: 'Word not found in dictionary' };
  } catch (error) {
    console.error('Dictionary validation error:', error);
    
    // For any unexpected errors during validation, return a server error
    throw createServerError(
      'Dictionary service temporarily unavailable',
      503,
      'SERVER_ERROR',
      true
    );
  }
}

/**
 * Quick offline validation using the same JSON maps (keeps API compatibility)
 */
export function validateWordOffline(word: string): DictionaryValidationResult {
  const normalized = word.toUpperCase().trim();

  if (!normalized || !/^[A-Z]+$/.test(normalized)) {
    return { isValid: false, word: normalized, error: 'Invalid word format' };
  }

  const map = normalized.length === 4 ? L4_MAP : normalized.length === 5 ? L5_MAP : null;

  if (!map) {
    return { isValid: false, word: normalized, error: 'Unsupported word length' };
  }

  return map[normalized] ? { isValid: true, word: normalized } : { isValid: false, word: normalized, error: 'Word not found' };
}

/**
 * Get definition text for a given word (if present)
 */
export function getDefinition(word: string): string | undefined {
  const normalized = word.toUpperCase().trim();
  const map = normalized.length === 4 ? L4_MAP : normalized.length === 5 ? L5_MAP : null;
  return map ? map[normalized] : undefined;
}


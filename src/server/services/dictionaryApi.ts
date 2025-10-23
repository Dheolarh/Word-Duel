/**
 * Dictionary API service for word validation
 * Implements primary and fallback API services with retry logic
 */

export interface DictionaryValidationResult {
  isValid: boolean;
  word: string;
  error?: string;
}

/**
 * Primary dictionary API using dictionaryapi.dev
 */
async function validateWithPrimaryAPI(word: string): Promise<DictionaryValidationResult> {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
  );

  if (response.ok) {
    const data = await response.json();
    // Check if we got valid dictionary entries
    if (Array.isArray(data) && data.length > 0) {
      return {
        isValid: true,
        word: word.toUpperCase(),
      };
    }
  }

  // API returned error or no results
  return {
    isValid: false,
    word: word.toUpperCase(),
    error: 'Word not found in primary dictionary',
  };
}

/**
 * Fallback dictionary API using Free Dictionary API
 */
async function validateWithFallbackAPI(word: string): Promise<DictionaryValidationResult> {
  // Using freedictionaryapi.com as fallback service
  const response = await fetch(
    `https://freedictionaryapi.com/api/v1/entries/en/${word.toLowerCase()}`
  );

  if (response.ok) {
    const data = await response.json();
    // Check if we got valid dictionary entries
    if (Array.isArray(data) && data.length > 0) {
      return {
        isValid: true,
        word: word.toUpperCase(),
      };
    }
  }

  return {
    isValid: false,
    word: word.toUpperCase(),
    error: 'Word not found in fallback dictionary',
  };
}

/**
 * Validate word using dictionary APIs with retry logic
 * @param word - The word to validate
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns Promise<DictionaryValidationResult>
 */
export async function validateWordWithDictionary(
  word: string,
  maxRetries: number = 2
): Promise<DictionaryValidationResult> {
  const normalizedWord = word.toUpperCase().trim();

  // Basic format validation first
  if (!normalizedWord || !/^[A-Z]+$/.test(normalizedWord)) {
    return {
      isValid: false,
      word: normalizedWord,
      error: 'Invalid word format',
    };
  }

  let lastError: string = '';

  // Try primary API with retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await validateWithPrimaryAPI(normalizedWord);
      if (result.isValid) {
        return result;
      }
      lastError = result.error || 'Primary API validation failed';
    } catch (error) {
      lastError = `Primary API network error: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
      }
    }
  }

  // Try fallback API with retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await validateWithFallbackAPI(normalizedWord);
      if (result.isValid) {
        return result;
      }
      lastError = result.error || 'Fallback API validation failed';
    } catch (error) {
      lastError = `Fallback API network error: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
      }
    }
  }

  // Both APIs failed
  return {
    isValid: false,
    word: normalizedWord,
    error: lastError || 'Word validation failed',
  };
}

/**
 * Quick validation for testing - accepts common words without API calls
 * This can be used as a fallback when APIs are unavailable
 */
export function validateWordOffline(word: string): DictionaryValidationResult {
  const normalizedWord = word.toUpperCase().trim();

  // Basic format validation
  if (!normalizedWord || !/^[A-Z]+$/.test(normalizedWord)) {
    return {
      isValid: false,
      word: normalizedWord,
      error: 'Invalid word format',
    };
  }

  // Common 4 and 5 letter words for offline validation
  const commonWords = new Set([
    // 4-letter words
    'WORD',
    'GAME',
    'PLAY',
    'TIME',
    'LOVE',
    'LIFE',
    'WORK',
    'HOME',
    'GOOD',
    'BEST',
    'MAKE',
    'TAKE',
    'COME',
    'GIVE',
    'FIND',
    'KNOW',
    'WANT',
    'NEED',
    'HELP',
    'LOOK',
    'FEEL',
    'SEEM',
    'CALL',
    'TELL',
    'TURN',
    'MOVE',
    'LIVE',
    'SHOW',
    'HEAR',
    'KEEP',
    'HAND',
    'HEAD',
    'FACE',
    'BACK',
    'SIDE',
    'PART',
    'YEAR',
    'WEEK',
    'HOUR',
    'ROOM',
    'BOOK',
    'IDEA',
    'FACT',
    'CASE',
    'AREA',
    'TEAM',
    'FOOD',
    'DOOR',
    'TREE',
    'FIRE',

    // 5-letter words
    'WORLD',
    'HOUSE',
    'PLACE',
    'RIGHT',
    'GREAT',
    'SMALL',
    'LARGE',
    'LOCAL',
    'EARLY',
    'YOUNG',
    'HUMAN',
    'WOMAN',
    'CHILD',
    'MONEY',
    'STORY',
    'MUSIC',
    'WATER',
    'LIGHT',
    'NIGHT',
    'SOUND',
    'VOICE',
    'POWER',
    'POINT',
    'HEART',
    'PARTY',
    'LEVEL',
    'MONTH',
    'THING',
    'ISSUE',
    'SPACE',
    'PEACE',
    'DEATH',
    'BIRTH',
    'EARTH',
    'PLANT',
    'OCEAN',
    'RIVER',
    'FIELD',
    'STONE',
    'METAL',
    'GLASS',
    'PAPER',
    'CHAIR',
    'TABLE',
    'PHONE',
  ]);

  if (commonWords.has(normalizedWord)) {
    return {
      isValid: true,
      word: normalizedWord,
    };
  } else {
    return {
      isValid: false,
      word: normalizedWord,
      error: 'Word not found in offline dictionary',
    };
  }
}

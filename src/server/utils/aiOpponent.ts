/**
 * AI Opponent System for Word Duel
 * Implements three difficulty levels with different strategies
 */

import { GuessResult } from '../../shared/types/game';
import { generateGuessFeedback } from './gameLogic';
import { validateWordWithDictionary } from '../services/dictionaryApi';

// Common 4-letter and 5-letter words for AI to use (fallback)
const FOUR_LETTER_WORDS = [
  'ABLE',
  'ACID',
  'AGED',
  'ALSO',
  'AREA',
  'ARMY',
  'AWAY',
  'BABY',
  'BACK',
  'BALL',
  'BAND',
  'BANK',
  'BASE',
  'BATH',
  'BEAR',
  'BEAT',
  'BEEN',
  'BELL',
  'BELT',
  'BEST',
  'BILL',
  'BIRD',
  'BLOW',
  'BLUE',
  'BOAT',
  'BODY',
  'BONE',
  'BOOK',
  'BORN',
  'BOTH',
  'BOWL',
  'BULK',
  'BURN',
  'BUSH',
  'BUSY',
  'CALL',
  'CALM',
  'CAME',
  'CAMP',
  'CARD',
  'CARE',
  'CASE',
  'CASH',
  'CAST',
  'CELL',
  'CHAT',
  'CHIP',
  'CITY',
  'CLUB',
  'COAL',
  'COAT',
  'CODE',
  'COLD',
  'COME',
  'COOK',
  'COOL',
  'COPY',
  'CORN',
  'COST',
  'CREW',
  'CROP',
  'DARK',
  'DATA',
  'DATE',
  'DAWN',
  'DAYS',
  'DEAD',
  'DEAL',
  'DEAR',
  'DEBT',
  'DEEP',
  'DENY',
  'DESK',
  'DIAL',
  'DIED',
  'DIET',
  'DISK',
  'DONE',
  'DOOR',
  'DOSE',
  'DOWN',
  'DRAW',
  'DREW',
  'DROP',
  'DRUG',
  'DUAL',
  'DUCK',
  'DUKE',
  'DUST',
  'DUTY',
  'EACH',
  'EARN',
  'EASE',
  'EAST',
  'EASY',
  'EDGE',
  'ELSE',
  'EVEN',
  'EVER',
  'EVIL',
  'EXIT',
  'FACE',
  'FACT',
  'FAIL',
  'FAIR',
  'FALL',
  'FARM',
  'FAST',
  'FATE',
  'FEAR',
  'FEED',
  'FEEL',
  'FEET',
  'FELL',
  'FELT',
  'FILE',
  'FILL',
  'FILM',
  'FIND',
  'FINE',
  'FIRE',
  'FIRM',
  'FISH',
  'FIVE',
  'FLAG',
  'FLAT',
  'FLEW',
  'FLOW',
  'FOOD',
  'FOOT',
  'FORD',
  'FORM',
  'FORT',
  'FOUR',
  'FREE',
  'FROM',
  'FUEL',
  'FULL',
  'FUND',
  'GAIN',
  'GAME',
  'GATE',
  'GAVE',
  'GEAR',
  'GIFT',
  'GIRL',
  'GIVE',
  'GLAD',
  'GOAL',
  'GOES',
  'GOLD',
  'GOLF',
  'GONE',
  'GOOD',
  'GRAB',
  'GRAY',
  'GREW',
  'GRID',
  'GROW',
  'GULF',
  'HAIR',
  'HALF',
  'HALL',
  'HAND',
  'HANG',
  'HARD',
  'HARM',
  'HATE',
  'HAVE',
  'HEAD',
  'HEAR',
  'HEAT',
  'HELD',
  'HELL',
  'HELP',
  'HERE',
  'HERO',
  'HIDE',
  'HIGH',
  'HILL',
  'HIRE',
  'HOLD',
  'HOLE',
  'HOLY',
  'HOME',
  'HOPE',
  'HOST',
  'HOUR',
  'HUGE',
  'HUNG',
  'HUNT',
  'HURT',
  'IDEA',
  'INCH',
  'INTO',
  'IRON',
  'ITEM',
  'JACK',
  'JANE',
  'JULY',
  'JUMP',
  'JUNE',
  'JURY',
  'JUST',
  'KEEN',
  'KEEP',
  'KENT',
  'KEPT',
  'KICK',
  'KILL',
  'KIND',
  'KING',
  'KNEE',
  'KNEW',
  'KNOW',
  'LACK',
  'LADY',
  'LAID',
  'LAKE',
  'LAND',
  'LANE',
  'LAST',
  'LATE',
  'LEAD',
  'LEFT',
  'LESS',
  'LIFE',
  'LIFT',
  'LIKE',
  'LINE',
  'LINK',
  'LIST',
  'LIVE',
  'LOAN',
  'LOCK',
  'LONG',
  'LOOK',
  'LORD',
  'LOSE',
  'LOSS',
  'LOST',
  'LOTS',
  'LOUD',
  'LOVE',
  'LUCK',
  'MADE',
  'MAIL',
  'MAIN',
  'MAKE',
  'MALE',
  'MANY',
  'MARK',
  'MASS',
  'MATE',
  'MATH',
  'MEAL',
  'MEAN',
  'MEAT',
  'MEET',
  'MENU',
  'MERE',
  'MILD',
  'MILE',
  'MILK',
  'MIND',
  'MINE',
  'MISS',
  'MODE',
  'MOOD',
  'MOON',
  'MORE',
  'MOST',
  'MOVE',
  'MUCH',
  'MUST',
  'NAME',
  'NAVY',
  'NEAR',
  'NECK',
  'NEED',
  'NEWS',
  'NEXT',
  'NICE',
  'NINE',
  'NODE',
  'NONE',
  'NOON',
  'NOSE',
  'NOTE',
  'NOUN',
  'NUDE',
  'OBEY',
  'ODDS',
  'OKAY',
  'ONCE',
  'ONLY',
  'ONTO',
  'OPEN',
  'ORAL',
  'OVER',
];

const FIVE_LETTER_WORDS = [
  'ABOUT',
  'ABOVE',
  'ABUSE',
  'ACTOR',
  'ACUTE',
  'ADMIT',
  'ADOPT',
  'ADULT',
  'AFTER',
  'AGAIN',
  'AGENT',
  'AGREE',
  'AHEAD',
  'ALARM',
  'ALBUM',
  'ALERT',
  'ALIEN',
  'ALIGN',
  'ALIKE',
  'ALIVE',
  'ALLOW',
  'ALONE',
  'ALONG',
  'ALTER',
  'AMONG',
  'ANGER',
  'ANGLE',
  'ANGRY',
  'APART',
  'APPLE',
  'APPLY',
  'ARENA',
  'ARGUE',
  'ARISE',
  'ARRAY',
  'ASIDE',
  'ASSET',
  'AUDIO',
  'AUDIT',
  'AVOID',
  'AWAKE',
  'AWARD',
  'AWARE',
  'BADLY',
  'BAKER',
  'BASES',
  'BASIC',
  'BEACH',
  'BEGAN',
  'BEGIN',
  'BEING',
  'BELOW',
  'BENCH',
  'BILLY',
  'BIRTH',
  'BLACK',
  'BLAME',
  'BLANK',
  'BLAST',
  'BLIND',
  'BLOCK',
  'BLOOD',
  'BOARD',
  'BOAST',
  'BOBBY',
  'BOOST',
  'BOOTH',
  'BOUND',
  'BRAIN',
  'BRAND',
  'BRASS',
  'BRAVE',
  'BREAD',
  'BREAK',
  'BREED',
  'BRIEF',
  'BRING',
  'BROAD',
  'BROKE',
  'BROWN',
  'BUILD',
  'BUILT',
  'BUYER',
  'CABLE',
  'CALIF',
  'CARRY',
  'CATCH',
  'CAUSE',
  'CHAIN',
  'CHAIR',
  'CHAOS',
  'CHARM',
  'CHART',
  'CHASE',
  'CHEAP',
  'CHECK',
  'CHEST',
  'CHIEF',
  'CHILD',
  'CHINA',
  'CHOSE',
  'CIVIL',
  'CLAIM',
  'CLASS',
  'CLEAN',
  'CLEAR',
  'CLICK',
  'CLIMB',
  'CLOCK',
  'CLOSE',
  'CLOUD',
  'COACH',
  'COAST',
  'COULD',
  'COUNT',
  'COURT',
  'COVER',
  'CRAFT',
  'CRASH',
  'CRAZY',
  'CREAM',
  'CRIME',
  'CROSS',
  'CROWD',
  'CROWN',
  'CRUDE',
  'CURVE',
  'CYCLE',
  'DAILY',
  'DANCE',
  'DATED',
  'DEALT',
  'DEATH',
  'DEBUT',
  'DELAY',
  'DEPTH',
  'DOING',
  'DOUBT',
  'DOZEN',
  'DRAFT',
  'DRAMA',
  'DRANK',
  'DREAM',
  'DRESS',
  'DRILL',
  'DRINK',
  'DRIVE',
  'DROVE',
  'DYING',
  'EAGER',
  'EARLY',
  'EARTH',
  'EIGHT',
  'ELITE',
  'EMPTY',
  'ENEMY',
  'ENJOY',
  'ENTER',
  'ENTRY',
  'EQUAL',
  'ERROR',
  'EVENT',
  'EVERY',
  'EXACT',
  'EXIST',
  'EXTRA',
  'FAITH',
  'FALSE',
  'FAULT',
  'FIBER',
  'FIELD',
  'FIFTH',
  'FIFTY',
  'FIGHT',
  'FINAL',
  'FIRST',
  'FIXED',
  'FLASH',
  'FLEET',
  'FLOOR',
  'FLUID',
  'FOCUS',
  'FORCE',
  'FORTH',
  'FORTY',
  'FORUM',
  'FOUND',
  'FRAME',
  'FRANK',
  'FRAUD',
  'FRESH',
  'FRONT',
  'FRUIT',
  'FULLY',
  'FUNNY',
  'GIANT',
  'GIVEN',
  'GLASS',
  'GLOBE',
  'GOING',
  'GRACE',
  'GRADE',
  'GRAND',
  'GRANT',
  'GRASS',
  'GRAVE',
  'GREAT',
  'GREEN',
  'GROSS',
  'GROUP',
  'GROWN',
  'GUARD',
  'GUESS',
  'GUEST',
  'GUIDE',
  'HAPPY',
  'HARRY',
  'HEART',
  'HEAVY',
  'HENCE',
  'HENRY',
  'HORSE',
  'HOTEL',
  'HOUSE',
  'HUMAN',
  'HURRY',
  'IMAGE',
  'INDEX',
  'INNER',
  'INPUT',
  'ISSUE',
  'JAPAN',
  'JIMMY',
  'JOINT',
  'JONES',
  'JUDGE',
  'KNOWN',
  'LABEL',
  'LARGE',
  'LASER',
  'LATER',
  'LAUGH',
  'LAYER',
  'LEARN',
  'LEASE',
  'LEAST',
  'LEAVE',
  'LEGAL',
  'LEVEL',
  'LEWIS',
  'LIGHT',
  'LIMIT',
  'LINKS',
  'LIVES',
  'LOCAL',
  'LOOSE',
  'LOWER',
  'LUCKY',
  'LUNCH',
  'LYING',
  'MAGIC',
  'MAJOR',
  'MAKER',
  'MARCH',
  'MARIA',
  'MATCH',
  'MAYBE',
  'MAYOR',
  'MEANT',
  'MEDIA',
  'METAL',
  'MIGHT',
  'MINOR',
  'MINUS',
  'MIXED',
  'MODEL',
  'MONEY',
  'MONTH',
  'MORAL',
  'MOTOR',
  'MOUNT',
  'MOUSE',
  'MOUTH',
  'MOVED',
  'MOVIE',
  'MUSIC',
  'NEEDS',
  'NEVER',
  'NEWLY',
  'NIGHT',
  'NOISE',
  'NORTH',
  'NOTED',
  'NOVEL',
  'NURSE',
  'OCCUR',
  'OCEAN',
  'OFFER',
  'OFTEN',
  'ORDER',
  'OTHER',
  'OUGHT',
  'PAINT',
  'PANEL',
  'PAPER',
  'PARTY',
  'PEACE',
  'PETER',
  'PHASE',
  'PHONE',
  'PHOTO',
  'PIANO',
  'PIECE',
  'PILOT',
  'PITCH',
  'PLACE',
  'PLAIN',
  'PLANE',
  'PLANT',
  'PLATE',
  'POINT',
  'POUND',
  'POWER',
  'PRESS',
  'PRICE',
  'PRIDE',
  'PRIME',
  'PRINT',
  'PRIOR',
  'PRIZE',
  'PROOF',
  'PROUD',
  'PROVE',
  'QUEEN',
  'QUICK',
  'QUIET',
  'QUITE',
  'RADIO',
  'RAISE',
  'RANGE',
  'RAPID',
  'RATIO',
  'REACH',
  'READY',
  'REALM',
  'REBEL',
  'REFER',
  'RELAX',
  'REPAY',
  'REPLY',
  'RIGHT',
  'RIGID',
  'RIVAL',
  'RIVER',
  'ROBIN',
  'ROGER',
  'ROMAN',
  'ROUGH',
  'ROUND',
  'ROUTE',
  'ROYAL',
  'RURAL',
  'SCALE',
  'SCENE',
  'SCOPE',
  'SCORE',
  'SENSE',
  'SERVE',
  'SETUP',
  'SEVEN',
  'SHALL',
  'SHAPE',
  'SHARE',
  'SHARP',
  'SHEET',
  'SHELF',
  'SHELL',
  'SHIFT',
  'SHINE',
  'SHIRT',
  'SHOCK',
  'SHOOT',
  'SHORT',
  'SHOWN',
  'SIGHT',
  'SILLY',
  'SINCE',
  'SIXTH',
  'SIXTY',
  'SIZED',
  'SKILL',
  'SLEEP',
  'SLIDE',
  'SMALL',
  'SMART',
  'SMILE',
  'SMITH',
  'SMOKE',
  'SNAKE',
  'SNOW',
  'SOLID',
  'SOLVE',
  'SORRY',
  'SOUND',
  'SOUTH',
  'SPACE',
  'SPARE',
  'SPEAK',
  'SPEED',
  'SPEND',
  'SPENT',
  'SPLIT',
  'SPOKE',
  'SPORT',
  'STAFF',
  'STAGE',
  'STAKE',
  'STAND',
  'START',
  'STATE',
  'STEAM',
  'STEEL',
  'STEEP',
  'STEER',
  'STICK',
  'STILL',
  'STOCK',
  'STONE',
  'STOOD',
  'STORE',
  'STORM',
  'STORY',
  'STRIP',
  'STUCK',
  'STUDY',
  'STUFF',
  'STYLE',
  'SUGAR',
  'SUITE',
  'SUPER',
  'SWEET',
  'TABLE',
  'TAKEN',
  'TASTE',
  'TAXES',
  'TEACH',
  'TEAM',
  'TEETH',
  'TERRY',
  'TEXAS',
  'THANK',
  'THEFT',
  'THEIR',
  'THEME',
  'THERE',
  'THESE',
  'THICK',
  'THING',
  'THINK',
  'THIRD',
  'THOSE',
  'THREE',
  'THREW',
  'THROW',
  'THUMB',
  'TIGHT',
  'TIRED',
  'TITLE',
  'TODAY',
  'TOPIC',
  'TOTAL',
  'TOUCH',
  'TOUGH',
  'TOWER',
  'TRACK',
  'TRADE',
  'TRAIN',
  'TREAT',
  'TREND',
  'TRIAL',
  'TRIBE',
  'TRICK',
  'TRIED',
  'TRIES',
  'TRUCK',
  'TRULY',
  'TRUNK',
  'TRUST',
  'TRUTH',
  'TWICE',
  'TWIST',
  'TYLER',
  'UNCLE',
  'UNDER',
  'UNDUE',
  'UNION',
  'UNITY',
  'UNTIL',
  'UPPER',
  'UPSET',
  'URBAN',
  'USAGE',
  'USUAL',
  'VALID',
  'VALUE',
  'VIDEO',
  'VIRUS',
  'VISIT',
  'VITAL',
  'VOCAL',
  'VOICE',
  'WASTE',
  'WATCH',
  'WATER',
  'WHEEL',
  'WHERE',
  'WHICH',
  'WHILE',
  'WHITE',
  'WHOLE',
  'WHOSE',
  'WOMAN',
  'WOMEN',
  'WORLD',
  'WORRY',
  'WORSE',
  'WORST',
  'WORTH',
  'WOULD',
  'WRITE',
  'WRONG',
  'WROTE',
  'YOUNG',
  'YOUTH',
];

// Strategic first guesses for different word lengths
const STRATEGIC_FIRST_GUESSES = {
  4: ['TEAR', 'FATE', 'RUIN', 'CANE', 'LOUD'],
  5: ['DOZEN', 'CRANE', 'SLATE', 'ROAST', 'ADIEU'],
};

/**
 * Generate a random word using dictionary API with fallback to local lists
 */
async function generateRandomWordFromAPI(wordLength: 4 | 5): Promise<string> {
  const wordList = wordLength === 4 ? FOUR_LETTER_WORDS : FIVE_LETTER_WORDS;

  // Try to get a random word from our list and validate it with the API
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const randomWord =
        wordList[Math.floor(Math.random() * wordList.length)] ||
        (wordLength === 4 ? 'WORD' : 'WORDS');

      // Validate with dictionary API
      const validation = await validateWordWithDictionary(randomWord, 1); // Single retry for speed

      if (validation.isValid) {
        return validation.word;
      }
    } catch (error) {
      // Continue to next attempt or fallback
      console.warn(`Dictionary API attempt ${attempt + 1} failed:`, error);
    }
  }

  // Fallback to local word list if API fails
  console.warn('Dictionary API failed, using local word list fallback');
  const fallbackWord = wordList[Math.floor(Math.random() * wordList.length)];
  return fallbackWord || (wordLength === 4 ? 'WORD' : 'WORDS');
}

/**
 * Get validated words from dictionary API for AI guessing
 */
async function getValidatedWordsFromAPI(
  candidateWords: string[],
  maxWords: number = 10
): Promise<string[]> {
  const validatedWords: string[] = [];
  const maxAttempts = Math.min(candidateWords.length, maxWords * 2); // Try up to double the needed amount

  for (let i = 0; i < maxAttempts && validatedWords.length < maxWords; i++) {
    try {
      const word = candidateWords[i];
      if (!word) continue;
      const validation = await validateWordWithDictionary(word, 1); // Single retry for speed

      if (validation.isValid) {
        validatedWords.push(validation.word);
      }
    } catch (error) {
      // Skip this word and continue
      continue;
    }
  }

  // If we didn't get enough validated words, fill with remaining candidates
  if (validatedWords.length < maxWords) {
    const remainingCandidates = candidateWords.slice(maxAttempts);
    validatedWords.push(...remainingCandidates.slice(0, maxWords - validatedWords.length));
  }

  return validatedWords;
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
    return await generateRandomWordFromAPI(wordLength);
  }

  async makeGuess(
    wordLength: 4 | 5,
    previousGuesses: GuessResult[],
    _opponentSecretWord?: string
  ): Promise<string> {
    const wordList = wordLength === 4 ? FOUR_LETTER_WORDS : FIVE_LETTER_WORDS;

    if (previousGuesses.length === 0) {
      // First guess - use strategic word
      const strategicGuesses = STRATEGIC_FIRST_GUESSES[wordLength];
      const firstGuess =
        strategicGuesses[Math.floor(Math.random() * strategicGuesses.length)] ||
        (wordLength === 4 ? 'WORD' : 'WORDS');
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

    // Try to validate a few words with dictionary API
    try {
      const validatedWords = await getValidatedWordsFromAPI(availableWords.slice(0, 5), 3);
      if (validatedWords.length > 0) {
        const selectedWord =
          validatedWords[Math.floor(Math.random() * validatedWords.length)] ||
          (wordLength === 4 ? 'WORD' : 'WORDS');
        this.usedWords.add(selectedWord);
        return selectedWord;
      }
    } catch (error) {
      // Fall back to local selection
    }

    const selectedWord =
      availableWords[Math.floor(Math.random() * availableWords.length)] ||
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
    return await generateRandomWordFromAPI(wordLength);
  }

  async makeGuess(
    wordLength: 4 | 5,
    previousGuesses: GuessResult[],
    _opponentSecretWord?: string
  ): Promise<string> {
    const wordList = wordLength === 4 ? FOUR_LETTER_WORDS : FIVE_LETTER_WORDS;

    if (previousGuesses.length === 0) {
      // First guess - use strategic word
      const strategicGuesses = STRATEGIC_FIRST_GUESSES[wordLength];
      const firstGuess =
        strategicGuesses[Math.floor(Math.random() * strategicGuesses.length)] ||
        (wordLength === 4 ? 'WORD' : 'WORDS');
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

    // Try to validate a few words with dictionary API
    try {
      const validatedWords = await getValidatedWordsFromAPI(availableWords.slice(0, 8), 5);
      if (validatedWords.length > 0) {
        const selectedWord =
          validatedWords[Math.floor(Math.random() * validatedWords.length)] ||
          (wordLength === 4 ? 'WORD' : 'WORDS');
        this.usedWords.add(selectedWord);
        return selectedWord;
      }
    } catch (error) {
      // Fall back to local selection
    }

    const selectedWord =
      availableWords[Math.floor(Math.random() * availableWords.length)] ||
      (wordLength === 4 ? 'WORD' : 'WORDS');
    this.usedWords.add(selectedWord);
    return selectedWord;
  }

  getTimingInterval(): { min: number; max: number } {
    return { min: 800, max: 1500 }; // 0.8-1.5 seconds
  }

  getMaxAttempts(): number {
    return 10;
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
    return await generateRandomWordFromAPI(wordLength);
  }

  async makeGuess(
    wordLength: 4 | 5,
    previousGuesses: GuessResult[],
    _opponentSecretWord?: string
  ): Promise<string> {
    const wordList = wordLength === 4 ? FOUR_LETTER_WORDS : FIVE_LETTER_WORDS;

    if (previousGuesses.length === 0) {
      // First guess - use strategic word with common letters
      const strategicGuesses = STRATEGIC_FIRST_GUESSES[wordLength];
      const firstGuess =
        strategicGuesses[Math.floor(Math.random() * strategicGuesses.length)] ||
        (wordLength === 4 ? 'WORD' : 'WORDS');
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

    // Try to validate the best words with dictionary API
    try {
      const validatedWords = await getValidatedWordsFromAPI(bestWords, 3);
      if (validatedWords.length > 0) {
        const selectedWord = validatedWords[0] || (wordLength === 4 ? 'WORD' : 'WORDS'); // Use the first (best) validated word
        this.usedWords.add(selectedWord);
        return selectedWord;
      }
    } catch (error) {
      // Fall back to local selection
    }

    const selectedWord = bestWords[0] || (wordLength === 4 ? 'WORD' : 'WORDS');
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
    return 6;
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
    return previousGuesses.length < strategy.getMaxAttempts();
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

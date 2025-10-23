# Design Document

## Overview

Word Duel is a real-time multiplayer word-guessing game built on the Devvit platform for Reddit. The application follows a client-server architecture where the React frontend handles user interactions and game visualization, while the Node.js backend manages game logic, state persistence, and external API integrations. The design preserves the existing frontend UI structure while adapting it to work seamlessly within the Devvit environment.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Reddit Post   │    │   Devvit Client  │    │  Devvit Server  │
│   (Webview)     │◄──►│   (React App)    │◄──►│  (Node.js API)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        ▼
                                │               ┌─────────────────┐
                                │               │  Redis Storage  │
                                │               │  - Game State   │
                                │               │  - Leaderboard  │
                                │               │  - User Data    │
                                │               └─────────────────┘
                                │                        │
                                │                        ▼
                                │               ┌─────────────────┐
                                └──────────────►│ Dictionary APIs │
                                                │ - Primary API   │
                                                │ - Fallback API  │
                                                └─────────────────┘
```

### Client-Server Communication

- **Client to Server**: RESTful API calls using `fetch()` to `/api/*` endpoints
- **Real-time Updates**: Polling mechanism for game state synchronization
- **Asset Management**: All images and sounds preloaded during splash screen
- **State Management**: React state for UI, server-side Redis for persistence

## Components and Interfaces

### Frontend Components Structure

```
src/client/
├── main.tsx                 # Devvit entry point
├── App.tsx                  # Main routing component
├── assets/                  # Preserved UI assets
│   ├── images/             # Game images (preloaded)
│   ├── sounds/             # Audio assets
│   └── fonts/              # Game fonts
├── components/             # Reusable UI components
│   ├── Board.tsx           # Game grid display
│   ├── Keyboard.tsx        # Custom on-screen keyboard
│   ├── Timer.tsx           # Countdown timer
│   ├── Modal.tsx           # Reusable modal component
│   ├── GuessRow.tsx        # Player guess row
│   └── EnemyGuessRow.tsx   # Opponent guess display
└── pages/                  # Page components
    ├── Splash.tsx          # Asset preloading screen
    ├── Dashboard.tsx       # Main menu
    ├── PreGame.tsx         # Game setup
    ├── SelectDifficulty.tsx # AI difficulty selection
    ├── Searching.tsx       # Matchmaking screen
    └── Game.tsx            # Main game interface
```

### Backend API Structure

```
src/server/
├── main.ts                 # Express server setup
├── api.ts                  # Dictionary API integration
├── game.ts                 # Game logic and state management
├── ai.ts                   # AI opponent algorithms
└── leaderboard.ts          # Scoring and rankings
```

### Key Interfaces

```typescript
// Game State Interface
interface GameState {
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

// Player State Interface
interface PlayerState {
  id: string;
  username: string;
  secretWord: string;
  guesses: GuessResult[];
  isAI: boolean;
  difficulty?: 'easy' | 'medium' | 'difficult';
}

// Guess Result Interface
interface GuessResult {
  guess: string;
  feedback: ('green' | 'yellow' | 'red')[];
  timestamp: number;
}

// API Response Interfaces
interface ValidationResponse {
  success: boolean;
  error?: string;
}

interface GameCreationResponse {
  gameId: string;
  status: 'ready' | 'waiting';
}
```

## Data Models

### Redis Data Structure

#### Game Sessions (Hash: `game:{gameId}`)
```json
{
  "gameId": "uuid-1234",
  "mode": "multi",
  "status": "active",
  "winner": null,
  "startTime": 1640995200000,
  "timeLimit": 300000,
  "wordLength": 5,
  "currentPlayer": "reddit-user-1",
  "player1": {
    "id": "reddit-user-1",
    "username": "Player1",
    "secretWord": "CRANE",
    "guesses": [
      {
        "guess": "AUDIO",
        "feedback": ["red", "red", "red", "red", "red"],
        "timestamp": 1640995230000
      }
    ],
    "isAI": false
  },
  "player2": {
    "id": "reddit-user-2",
    "username": "Player2",
    "secretWord": "MOUSE",
    "guesses": [],
    "isAI": false
  }
}
```

#### Matchmaking Queues (Lists)
- `queue:4letter`: Players waiting for 4-letter word games
- `queue:5letter`: Players waiting for 5-letter word games

#### User Data (Hash: `user:{userId}`)
```json
{
  "username": "PlayerName",
  "points": 1250,
  "coins": 300,
  "gamesPlayed": 45,
  "gamesWon": 28,
  "averageGuesses": 4.2
}
```

#### Leaderboard (Sorted Set: `leaderboard`)
- Members: user IDs
- Scores: total points

## Core Algorithms

### Word Validation Algorithm

```typescript
async function validateWord(word: string): Promise<boolean> {
  try {
    // Primary API call
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (response.ok) return true;
    
    // Fallback API call
    const fallbackResponse = await fetch(`https://freedictionaryapi.com/api/v1/entries/en/${word}`);
    return fallbackResponse.ok;
  } catch (error) {
    throw new Error('Network error during word validation');
  }
}
```

### Guess Feedback Algorithm

```typescript
function generateFeedback(guess: string, secret: string): ('green' | 'yellow' | 'red')[] {
  const feedback: ('green' | 'yellow' | 'red')[] = new Array(guess.length);
  const secretChars = secret.split('');
  const guessChars = guess.split('');
  
  // First pass: Mark exact matches (green)
  for (let i = 0; i < guess.length; i++) {
    if (guessChars[i] === secretChars[i]) {
      feedback[i] = 'green';
      secretChars[i] = null; // Mark as used
      guessChars[i] = null; // Mark as used
    }
  }
  
  // Second pass: Mark partial matches (yellow) and misses (red)
  for (let i = 0; i < guess.length; i++) {
    if (guessChars[i] !== null) {
      const secretIndex = secretChars.indexOf(guessChars[i]);
      if (secretIndex !== -1) {
        feedback[i] = 'yellow';
        secretChars[secretIndex] = null; // Mark as used
      } else {
        feedback[i] = 'red';
      }
    }
  }
  
  return feedback;
}
```

### AI Opponent Strategies

#### Easy AI (Random Strategy)
- Makes random valid word guesses
- Uses only green feedback for subsequent guesses
- No word list filtering
- 6-10 second intervals between guesses

#### Medium AI (Partial Deduction)
- Uses green and red feedback only
- Filters word list based on confirmed letters and excluded letters
- Ignores yellow (wrong position) feedback
- 4-8 second intervals between guesses

#### Difficult AI (Full Deduction)
```typescript
class DifficultAI {
  private possibleWords: string[];
  
  filterWordList(guess: string, feedback: ('green' | 'yellow' | 'red')[]): void {
    this.possibleWords = this.possibleWords.filter(word => {
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const result = feedback[i];
        
        if (result === 'green' && word[i] !== letter) return false;
        if (result === 'red' && word.includes(letter)) return false;
        if (result === 'yellow') {
          if (word[i] === letter || !word.includes(letter)) return false;
        }
      }
      return true;
    });
  }
  
  selectNextGuess(): string {
    // Choose word with maximum information gain
    return this.possibleWords[0] || this.getStrategicGuess();
  }
}
```

### Matchmaking Algorithm

```typescript
async function findMatch(playerId: string, wordLength: 4 | 5): Promise<string | null> {
  const queueKey = `queue:${wordLength}letter`;
  
  // Try to find existing player in queue
  const waitingPlayer = await redis.lpop(queueKey);
  
  if (waitingPlayer) {
    // Create game with both players
    const gameId = generateGameId();
    await createMultiplayerGame(gameId, waitingPlayer, playerId, wordLength);
    return gameId;
  } else {
    // Add current player to queue
    await redis.rpush(queueKey, playerId);
    return null; // Still waiting
  }
}
```

## Error Handling

### Client-Side Error Handling

1. **Network Errors**: Display modal with retry option
2. **Validation Errors**: Show inline error messages with game styling
3. **Game State Errors**: Graceful fallback to previous state
4. **Asset Loading Errors**: Retry mechanism during splash screen

### Server-Side Error Handling

1. **Dictionary API Failures**: Automatic fallback to secondary API
2. **Redis Connection Issues**: Retry logic with exponential backoff
3. **Invalid Game States**: State validation and correction
4. **Concurrent Access**: Optimistic locking for game state updates

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'GAME_ERROR' | 'SERVER_ERROR';
  retryable: boolean;
}
```

## Testing Strategy

### Unit Testing
- Game logic functions (feedback generation, AI algorithms)
- Utility functions (word validation, state management)
- Component rendering and interaction

### Integration Testing
- API endpoint functionality
- Redis data operations
- Dictionary API integration

### End-to-End Testing
- Complete game flow testing
- Multiplayer synchronization
- Error scenario handling

### Performance Testing
- Asset loading optimization
- API response times
- Concurrent user handling

## Security Considerations

### Data Protection
- Secret words stored server-side only
- User authentication through Reddit/Devvit
- Input sanitization for all user data

### API Security
- Rate limiting for dictionary API calls
- Request validation and sanitization
- Error message sanitization to prevent information leakage

### Game Integrity
- Server-side validation of all moves
- Anti-cheat measures for timing
- Secure random word generation for AI

## Performance Optimizations

### Client-Side
- Asset preloading during splash screen
- Efficient React state management
- Debounced API calls for real-time updates

### Server-Side
- Redis connection pooling
- Cached word lists for AI opponents
- Optimized game state serialization

### Network
- Compressed API responses
- Minimal payload sizes
- Strategic polling intervals for real-time updates

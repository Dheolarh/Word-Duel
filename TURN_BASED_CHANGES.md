# Turn-Based Gameplay Implementation

## Overview
Converted Word Duel from **concurrent/simultaneous gameplay** to **turn-based gameplay** where players alternate making guesses.

## The Problem
The previous implementation had mixed concurrent and turn-based logic that caused:
1. ❌ Waiting modal appearing and disappearing quickly
2. ❌ AI playing concurrently after its turn
3. ❌ Player input being discarded/glitching after AI turn
4. ❌ No proper turn validation

## The Solution

### 1. **Server-Side Changes** (`src/server/utils/gameStateManager.ts`)

#### Turn Validation in `submitGuess()`
```typescript
// Check if it's this player's turn BEFORE accepting guess
if (gameState.currentPlayer !== playerId) {
  throw new Error('Not your turn');
}
```

#### Turn Switching After Guess
```typescript
// After successful guess, switch to opponent's turn
gameState.currentPlayer = opponentPlayer.id;
```

#### AI Turn Validation in `submitAIGuess()`
```typescript
// AI only guesses when it's actually AI's turn
if (gameState.currentPlayer !== aiPlayer.id) {
  console.log(`AI guess skipped - not AI's turn`);
  return null;
}

// After AI guess, switch back to human player
gameState.currentPlayer = humanPlayer.id;
```

### 2. **Client-Side Changes** (`src/client/pages/Game.tsx`)

#### Removed Concurrent Play Logic
- ❌ Removed `scheduleAIGuess()` - was continuously scheduling AI guesses
- ❌ Removed `aiTimerRef` - no longer needed for continuous scheduling
- ✅ Replaced with `triggerAIGuess()` - only called when it's AI's turn

#### Turn-Based Polling
```typescript
const pollGameState = async () => {
  // Poll for game state updates
  const newGameState = data.data.gameState;
  
  // Check if it's AI's turn and trigger ONE guess
  if (newGameState.currentPlayer === aiPlayer.id && !isWaitingForOpponent) {
    setIsWaitingForOpponent(true);
    triggerAIGuess(); // Triggers exactly ONE AI guess
  }
  
  // If it's player's turn, clear waiting state
  if (newGameState.currentPlayer === currentPlayer.id) {
    setIsWaitingForOpponent(false);
  }
};
```

#### Input Blocking When Not Player's Turn
```typescript
const handleKeyPress = (key: string) => {
  // Block all input when it's not player's turn
  if (gameState.currentPlayer !== currentPlayer.id) return;
  // ... rest of logic
};

const handleEnter = async () => {
  // Block guess submission when it's not player's turn
  if (gameState.currentPlayer !== currentPlayer.id) {
    console.log('Not your turn!');
    return;
  }
  // ... rest of logic
};
```

#### Proper Waiting Modal Display
```typescript
// Show waiting modal ONLY when it's opponent's turn
<WaitingModal 
  isVisible={gameStatus === 'playing' && gameState.currentPlayer !== currentPlayer.id}
  opponentName={opponentName}
/>
```

## Game Flow (Turn-Based)

### Initial State
```
Game starts → currentPlayer = player1.id (Human)
Player can input → AI is waiting
```

### Player's Turn
```
1. Player types word
2. Player presses Enter
3. Server validates: "Is currentPlayer === playerId?" ✅
4. Guess is processed
5. Server switches: currentPlayer = aiPlayer.id
6. Client receives updated state
7. Client shows "Waiting for opponent..." modal
```

### AI's Turn (Triggered by Polling)
```
1. Polling detects: currentPlayer === aiPlayer.id
2. Client calls triggerAIGuess() ONCE
3. Waits for AI "thinking" delay (realistic timing)
4. Server validates: "Is currentPlayer === aiPlayerId?" ✅
5. AI makes guess
6. Server switches: currentPlayer = humanPlayer.id
7. Client receives updated state
8. Modal disappears, player can input again
```

### Back to Player's Turn
```
Cycle repeats until game ends
```

## Key Differences: Concurrent vs Turn-Based

| Aspect | Concurrent (Old) | Turn-Based (New) |
|--------|------------------|------------------|
| **Guess Timing** | Both players guess anytime | Players alternate guesses |
| **AI Behavior** | Scheduled continuously, guessed on timer | Only guesses when it's AI's turn |
| **Input Blocking** | Only blocked during submission | Blocked when not player's turn |
| **Waiting Modal** | Showed briefly after each guess | Shows entire duration of opponent's turn |
| **Server Validation** | None for turn order | Validates currentPlayer === playerId |
| **Turn Switching** | No turn concept | currentPlayer switches after each guess |

## Testing the Fix

### Expected Behavior
1. ✅ Game starts, you can type immediately (your turn)
2. ✅ Submit guess → Modal shows "Waiting for opponent..."
3. ✅ Modal stays visible during AI's entire turn
4. ✅ AI makes ONE guess
5. ✅ Modal disappears, you can type again
6. ✅ No input glitching or guess discarding
7. ✅ Clear turn alternation throughout game

### What Was Fixed
1. ✅ No more quick appearing/disappearing modal
2. ✅ AI respects turns (no concurrent play after its turn)
3. ✅ Player input not discarded when AI finishes
4. ✅ Clean state transitions between turns
5. ✅ Proper waiting state management

## Files Modified

1. **`src/server/utils/gameStateManager.ts`**
   - Added turn validation in `submitGuess()`
   - Added turn switching after each guess
   - Added turn validation in `submitAIGuess()`

2. **`src/client/pages/Game.tsx`**
   - Removed continuous AI scheduling logic
   - Added turn-based polling with AI trigger
   - Added turn checks to all input handlers
   - Fixed waiting modal to show during opponent's turn
   - Cleaned up unused refs and effects

## Notes

- The `currentPlayer` field in `GameState` was already defined but not being used properly
- Game always starts with player1 (human) having the first turn
- Polling interval set to 1.5 seconds for responsive turn detection
- AI "thinking" delay still uses difficulty-based timing for realism

# Turn Timer Feature for Multiplayer Games

## Overview
Added a 30-second turn timer for multiplayer games to ensure smooth gameplay and prevent players from taking too long on their turns.

## Features

### 🕐 **30-Second Turn Timer**
- Appears only during multiplayer games
- Shows when it's the current player's turn
- Counts down from 30 seconds to 0
- Visual color changes:
  - **Blue**: 30-11 seconds remaining
  - **Orange**: 10-6 seconds remaining  
  - **Red**: 5-0 seconds remaining

### ⚡ **Automatic Turn Switching**
- When timer reaches 0, automatically switches to opponent's turn
- No guess is submitted - turn is simply skipped
- Player activity is updated to prevent disconnection detection

### 🎮 **Smart Display Logic**
- Only visible in multiplayer games (`isMultiplayer = true`)
- Only shows when it's the current player's turn
- Hidden when game is paused
- Hidden when game is finished
- Resets to 30 seconds when turn switches

## Technical Implementation

### Client-Side Components

#### `TurnTimer.tsx`
- New component for the 30-second countdown
- Handles visual styling and color changes
- Calls `onTimeUp` callback when timer expires
- Automatically resets when visibility changes

#### `Game.tsx` Updates
- Added `handleTurnTimeout()` function
- Integrated TurnTimer component below main game timer
- Calls `/api/skip-turn` endpoint when timeout occurs

### Server-Side Implementation

#### New API Endpoint: `/api/skip-turn/:gameId`
- Validates game access and turn ownership
- Switches current player to opponent
- Updates player activity timestamp
- Returns updated game state

#### `GameStateManager.skipTurnDueToTimeout()`
- New method to handle turn timeouts
- Only works for multiplayer games
- Validates game state and player turn
- Atomically updates game state

## Usage

The turn timer automatically appears in multiplayer games:

1. **Player's Turn**: Timer shows and counts down from 30 seconds
2. **Opponent's Turn**: Timer is hidden, waiting modal shows instead
3. **Timeout**: If player doesn't make a move in 30 seconds, turn automatically switches
4. **Game Continues**: Opponent gets their turn with a fresh 30-second timer

## Benefits

- **Prevents Stalling**: No more waiting indefinitely for slow players
- **Maintains Engagement**: Keeps games moving at a reasonable pace
- **Fair Play**: Equal time pressure for both players
- **User-Friendly**: Clear visual feedback with color-coded urgency

## Configuration

The timer duration can be adjusted by changing the `duration` prop in the TurnTimer component (currently set to 30 seconds).

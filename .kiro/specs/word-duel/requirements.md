# Requirements Document

## Introduction

Word Duel is a real-time, multiplayer 1v1 word-guessing game built on the Devvit platform for Reddit. Players compete to guess their opponent's secret word before the opponent guesses theirs. The game supports both Player-vs-Player (PvP) and Player-vs-AI modes with concurrent guessing mechanics rather than turn-based gameplay. The application integrates an existing frontend UI with minimal modifications to fit the Devvit environment.

## Glossary

- **Word_Duel_System**: The complete game application running on Reddit via Devvit
- **Game_Session**: An active match between two players or a player and AI
- **Secret_Word**: A 4 or 5-letter word chosen by each player that opponents must guess
- **Guess_Feedback**: Color-coded response system (Green=correct position, Yellow=correct letter wrong position, Red=not in word)
- **AI_Opponent**: Computer-controlled player with three difficulty levels
- **Matchmaking_Queue**: System for pairing players in multiplayer mode
- **Dictionary_API**: External service for word validation
- **Game_State**: Current status of an active game session stored in Redis
- **Leaderboard_System**: Ranking system tracking player points and performance
- **Frontend_UI**: Pre-built React interface with assets that must be preserved
- **Splash_Screen**: Initial loading screen that preloads all game assets

## Requirements

### Requirement 1

**User Story:** As a Reddit user, I want to access Word Duel through a Reddit post, so that I can play the game directly within the Reddit platform

#### Acceptance Criteria

1. THE Word_Duel_System SHALL render within a Reddit post using Devvit framework
2. WHEN a user clicks the splash screen, THE Word_Duel_System SHALL open the game in full screen mode
3. THE Word_Duel_System SHALL display an engaging splash screen that invites players to play
4. WHILE the splash screen is active, THE Word_Duel_System SHALL preload all game images and assets
5. THE Word_Duel_System SHALL maintain the existing frontend UI design without alterations

### Requirement 2

**User Story:** As a player, I want to set up a new game by choosing word length and entering my secret word, so that I can start playing against an opponent

#### Acceptance Criteria

1. THE Word_Duel_System SHALL provide word length selection options of 4 or 5 letters
2. THE Word_Duel_System SHALL accept user input for their secret word
3. WHEN a user enters a word, THE Word_Duel_System SHALL display "validating word" text using game font and color
4. THE Word_Duel_System SHALL validate the secret word against Dictionary_API services
5. IF the word is invalid, THEN THE Word_Duel_System SHALL display "{word name} doesn't appear in the dictionary" in red color using game font
6. IF validation succeeds, THEN THE Word_Duel_System SHALL navigate to difficulty selection for single player or matchmaking for multiplayer
7. IF a network error occurs, THEN THE Word_Duel_System SHALL display an error modal using end game modal style

### Requirement 3

**User Story:** As a player, I want to choose between single player and multiplayer modes, so that I can play against AI or human opponents

#### Acceptance Criteria

1. THE Word_Duel_System SHALL provide "Single Player" and "Multiplayer" mode selection buttons
2. WHEN single player is selected, THE Word_Duel_System SHALL navigate to AI difficulty selection
3. WHEN multiplayer is selected, THE Word_Duel_System SHALL initiate matchmaking process
4. THE Word_Duel_System SHALL provide three AI difficulty levels: Easy, Medium, and Difficult
5. THE Word_Duel_System SHALL display matchmaking status with "Searching for opponent..." animation

### Requirement 4

**User Story:** As a player, I want to make guesses using an on-screen keyboard, so that I can play the game on both mobile and desktop devices without system keyboard interference

#### Acceptance Criteria

1. THE Word_Duel_System SHALL provide a custom on-screen keyboard with letters A-Z, Enter, and Delete
2. THE Word_Duel_System SHALL prevent native mobile keyboard from appearing by avoiding focusable input elements
3. THE Word_Duel_System SHALL support physical keyboard input on desktop devices
4. THE Word_Duel_System SHALL manage current guess state through the custom keyboard interface
5. WHEN a physical key is pressed on desktop, THE Word_Duel_System SHALL map it to the on-screen keyboard functions

### Requirement 5

**User Story:** As a player, I want to see real-time feedback on my guesses, so that I can strategically plan my next moves

#### Acceptance Criteria

1. THE Word_Duel_System SHALL provide color-coded feedback for each guess (Green, Yellow, Red)
2. THE Word_Duel_System SHALL display player guesses in a 6-row grid format
3. THE Word_Duel_System SHALL show opponent's most recent guess without color feedback
4. THE Word_Duel_System SHALL update keyboard keys with color feedback based on previous guesses
5. THE Word_Duel_System SHALL validate each guess against Dictionary_API before processing

### Requirement 6

**User Story:** As a player, I want to compete within time limits, so that games have urgency and don't last indefinitely

#### Acceptance Criteria

1. WHERE Easy AI difficulty is selected, THE Word_Duel_System SHALL set a 10-minute time limit
2. WHERE Medium AI difficulty is selected, THE Word_Duel_System SHALL set a 7-minute time limit  
3. WHERE Difficult AI difficulty is selected, THE Word_Duel_System SHALL set a 5-minute time limit
4. THE Word_Duel_System SHALL display remaining time with a countdown timer
5. WHEN time expires, THE Word_Duel_System SHALL end the game and declare results

### Requirement 7

**User Story:** As a player, I want to face AI opponents with different skill levels, so that I can choose appropriate challenge levels

#### Acceptance Criteria

1. WHERE Easy difficulty is selected, THE Word_Duel_System SHALL make AI guesses every 6-10 seconds with unlimited attempts using only Green feedback
2. WHERE Medium difficulty is selected, THE Word_Duel_System SHALL make AI guesses every 4-8 seconds with 10 total attempts using Green and Red feedback
3. WHERE Difficult difficulty is selected, THE Word_Duel_System SHALL make AI guesses every 4-10 seconds with 6 attempts using full deductive algorithm
4. THE Word_Duel_System SHALL implement strategic first guesses for Difficult AI using common vowels and consonants
5. THE Word_Duel_System SHALL filter AI word lists based on feedback complexity including duplicate letter handling

### Requirement 8

**User Story:** As a player, I want to see game results and my performance, so that I can track my progress and compete with others

#### Acceptance Criteria

1. WHEN a game ends, THE Word_Duel_System SHALL display an end game modal showing win/lose/draw status
2. THE Word_Duel_System SHALL reveal the opponent's secret word in the end game modal
3. THE Word_Duel_System SHALL display points and coins awarded or lost
4. THE Word_Duel_System SHALL provide "Play Again" and "Return to Dashboard" options
5. THE Word_Duel_System SHALL maintain a leaderboard with player rankings and points

### Requirement 9

**User Story:** As a player, I want to play multiplayer games with real-time synchronization, so that I can compete fairly against human opponents

#### Acceptance Criteria

1. THE Word_Duel_System SHALL match players in multiplayer queue based on selected word length
2. WHEN a player selects 4-letter words, THE Word_Duel_System SHALL only match them with other players who selected 4-letter words
3. WHEN a player selects 5-letter words, THE Word_Duel_System SHALL only match them with other players who selected 5-letter words
4. THE Word_Duel_System SHALL synchronize game state between players in real-time
5. THE Word_Duel_System SHALL handle concurrent guessing without turn-based restrictions
6. THE Word_Duel_System SHALL determine winner based on first correct guess
7. THE Word_Duel_System SHALL handle player disconnections gracefully

### Requirement 10

**User Story:** As a player, I want smooth visual transitions between game screens, so that I have a polished gaming experience

#### Acceptance Criteria

1. THE Word_Duel_System SHALL apply transition effects when switching between pages
2. THE Word_Duel_System SHALL apply transitions to all UI elements except the game background
3. THE Word_Duel_System SHALL keep Background.webp constant throughout all screens
4. THE Word_Duel_System SHALL preserve all existing UI animations and effects
5. THE Word_Duel_System SHALL maintain the pre-built frontend structure and styling

### Requirement 11

**User Story:** As a player, I want reliable word validation and game data persistence, so that my game progress is secure and accurate

#### Acceptance Criteria

1. THE Word_Duel_System SHALL validate words using primary Dictionary_API with fallback service
2. THE Word_Duel_System SHALL store game sessions in Redis with complete state information
3. THE Word_Duel_System SHALL persist user data including points, coins, and statistics
4. THE Word_Duel_System SHALL handle API failures with appropriate error messages
5. THE Word_Duel_System SHALL maintain data consistency across all game operations

# Word Duel

**A real-time multiplayer word-guessing game built for Reddit**

Word Duel is an engaging 1v1 word battle game where players compete to guess their opponent's secret word before the opponent guesses theirs. Built on Reddit's Devvit platform, this game brings the excitement of word puzzles directly to Reddit posts with beautiful visuals, immersive sound effects, and competitive gameplay that runs seamlessly within the Reddit ecosystem.

## 🎮 What is Word Duel?

Word Duel is a fast-paced, competitive word-guessing game that combines the strategic thinking of Wordle with the excitement of real-time multiplayer competition. Players enter their own secret word, then race against an opponent (AI or human) to guess their opponent's word first using a sophisticated color-coded feedback system.

The game features professional game assets, an immersive audio experience with background music and sound effects, and runs entirely within Reddit posts using Devvit's webview technology. This provides a seamless gaming experience without requiring users to leave Reddit, making it the first truly native Reddit word game.

### Core Game Features
- **Real-time concurrent guessing** - both players guess simultaneously, creating intense competition
- **Dual word length support** - choose between 4-letter or 5-letter word challenges with intelligent grid switching
- **Professional mobile-first design** with custom on-screen keyboard that completely prevents mobile keyboard interference
- **Dual-board visualization** - player board (green theme) vs opponent board (blue theme) for competitive clarity
- **Immersive audio experience** with background music, optimized click sound pooling, and contextual result sounds
- **Native Reddit integration** - runs directly within Reddit posts using Devvit's webview technology
- **Multiple game modes** - single-player AI opponents and multiplayer matchmaking (planned)
- **Three AI difficulty levels** with unique strategies, timing intervals, and attempt limits
- **Comprehensive asset preloading** with progress tracking, retry mechanisms, and 37 images + 6 audio files
- **Real-time word validation** using multiple dictionary APIs with fallback mechanisms and error handling

## 🌟 What Makes Word Duel Innovative & Unique

### 🎯 Revolutionary Real-Time Competition
Unlike traditional turn-based word games like Wordle, **both players guess simultaneously in real-time**, creating intense competition where the first to guess correctly wins instantly. This concurrent gameplay mechanic transforms word guessing from a solo puzzle into an adrenaline-pumping race against time and opponent.

### 📱 Mobile-First Gaming Excellence
- **Custom On-Screen Keyboard**: Completely prevents native mobile keyboard interference while maintaining full desktop physical keyboard support with seamless key mapping and audio feedback
- **Zero-Compromise Mobile Experience**: Viewport optimization prevents zooming and ensures consistent gameplay across all devices with `user-scalable=no` configuration
- **Touch-Optimized Interface**: Professional button sizing and responsive layouts designed specifically for mobile gaming
- **Cross-Platform Compatibility**: Identical experience on both desktop and mobile with adaptive input handling

### 🎨 Premium Visual & Audio Experience
- **Dual-Board Visualization**: Player board (green theme) with complete feedback vs opponent board (blue theme) showing only recent guesses for competitive fairness
- **Intelligent Asset Preloading**: Comprehensive loading system with progress tracking, retry mechanisms, and dual theme support (Default green nature + Halloween orange spooky)
- **Professional Game Assets**: High-quality webp images with consistent styling, shadows, gradients, and Sour Gummy font throughout
- **Advanced Audio System**: Background music with auto-enable, optimized click sound pooling (10 pre-loaded instances for zero-latency response), and contextual win/lose/tie sound effects
- **Smooth Animations**: Framer Motion powers all page transitions while preserving the constant background image

### ⚡ Native Reddit Integration
Runs directly within Reddit posts using Devvit's webview technology, allowing users to play without leaving their Reddit feed. This seamless integration makes Word Duel the first truly native Reddit gaming experience with full Reddit user authentication and context.

### 🎮 Flexible Word Challenges & Validation
- **Dual Word Length Support**: Choose between 4-letter or 5-letter word games with visual grid switching and real-time validation
- **Intelligent Dictionary Integration**: Real-time word validation using multiple dictionary APIs with fallback mechanisms
- **Smart Error Handling**: Clear validation feedback with retry mechanisms and network error recovery
- **Strategic Depth**: Different word lengths offer varying strategic complexity and gameplay pacing

### 🤖 Intelligent AI Opponents
Features three sophisticated AI difficulty levels with unique strategies and behaviors:
- **Easy AI (10-minute limit)**: Random word selection with green-only feedback processing, unlimited attempts, 1-2 second intervals
- **Medium AI (7-minute limit)**: Strategic word filtering using confirmed and excluded letters, unlimited attempts, 0.8-1.5 second intervals  
- **Difficult AI (5-minute limit)**: Advanced deductive algorithms with optimal first guesses, duplicate letter handling, and maximum information gain strategy, unlimited attempts, 6-7 second intervals

### 🎵 Immersive Audio Experience
- **Audio Context Management**: Persistent audio settings with localStorage integration and automatic background music triggering
- **Sound Effect Pooling**: Pre-loaded click sound instances for instant response without audio latency
- **Contextual Audio**: Different sounds for wins, losses, ties, and all user interactions with proper volume balancing
- **Mobile Audio Compatibility**: Automatic audio enabling with multiple fallback strategies for mobile browser compatibility

## 🎯 How to Play Word Duel

Word Duel is a fast-paced, real-time word-guessing game where you race against an opponent to guess their secret word before they guess yours. The game combines strategic thinking with time pressure to create an exciting competitive experience. Here's your complete step-by-step guide:

### 🚀 Getting Started

1. **Launch the Game**: 
   - Find a Word Duel post on Reddit
   - Click the splash screen to open the game in full-screen mode
   - Watch the animated bouncing logo during comprehensive asset loading

2. **Asset Loading Experience**: 
   - Progress bar shows loading percentage for 37 images (both Default and Halloween themes) + 6 audio files
   - Real-time status messages display current loading activity ("Loading images and sounds...")
   - Failed asset counter appears if any resources fail to load with retry mechanisms
   - Audio system automatically enables for immersive experience upon completion

3. **Main Dashboard**: 
   - Access the main menu with large circular play button and "Play Game" text
   - View leaderboard by clicking the leaderboard icon (top right) - shows top 5 players with points
   - Access theme settings via settings icon (top left) - choose between Default green nature or Halloween orange spooky themes
   - Toggle background music and sound effects via music icon (top left) with independent controls
   - Professional Sour Gummy font styling throughout the interface

### 🎯 Game Setup Process

#### Step 1: Choose Your Word Length
- Click on either the **4-letter** or **5-letter** word grid to activate it
- Active grid highlights with full color while inactive grid dims and grays out
- You can switch between grids anytime (switching automatically clears the other grid)
- Each grid shows empty letter tiles with green borders and gradient backgrounds

#### Step 2: Enter Your Secret Word
- **Mobile**: Use the custom on-screen keyboard (native mobile keyboard is completely blocked)
- **Desktop**: Type with physical keyboard (A-Z, Delete, Backspace) - all keys play satisfying click sounds
- Enter your secret word that your opponent must guess to win
- Real-time word validation occurs automatically when word is complete:
  - Shows "validating word..." status in light green game font
  - Invalid words display "{word} doesn't appear in the dictionary" in red error text
  - Valid words show "✓ Word validated" in green confirmation text
  - Network errors display retry-enabled error messages with proper styling

#### Step 3: Select Game Mode
- **Single Player**: Battle against AI - proceeds to difficulty selection screen
- **Multiplayer**: Enter matchmaking queue with animated bouncing dots (3-second realistic simulation)
- Both buttons use professional game assets and hover animations

#### Step 4: Choose Difficulty (Single Player Only)
- **Easy**: 10-minute time limit with unlimited attempts, AI uses only green feedback
- **Medium**: 7-minute time limit with unlimited attempts, AI uses green and red feedback
- **Difficult**: 5-minute time limit with unlimited attempts, AI uses full deductive algorithm

### 🎮 Core Gameplay Mechanics

#### Making Your Guesses
- **Input Methods**: 
  - **Mobile**: Touch the custom on-screen keyboard letters, Delete, and Enter buttons with visual feedback
  - **Desktop**: Physical keyboard automatically maps to on-screen keyboard with instant audio feedback
- **Word Requirements**: Each guess must be exactly 4 or 5 letters (matching your chosen word length)
- **Attempt Limits**: 
  - **Player**: 6 attempts maximum to guess opponent's secret word (varies by difficulty: Easy=unlimited, Medium=15, Difficult=10)
  - **AI**: Unlimited attempts for all difficulty levels (varies by timing intervals and strategy complexity)
- **Real-time Display**: Current guess appears immediately in the active row as you type
- **Guess Clearing**: Invalid guesses are automatically cleared, allowing you to try again without getting stuck
- **Waiting State Management**: Clear visual feedback when waiting for opponent moves with automatic clearing after AI responses

#### Understanding the Color-Coded Feedback System
After each guess, every letter receives instant color-coded feedback:
- 🟢 **Green (Correct)**: Right letter in the correct position - appears with green background (#6aaa64)
- 🟡 **Yellow (Present)**: Right letter but in the wrong position - appears with yellow background (#c9b458)
- 🔴 **Red (Absent)**: Letter is not in the opponent's word at all - appears with gray background
- Letters animate with smooth transitions when feedback is applied

#### Smart Keyboard Visual Feedback
The on-screen keyboard keys dynamically change color based on your previous guesses:
- **Green keys**: Letters confirmed in correct positions
- **Yellow keys**: Letters confirmed in word but wrong positions  
- **Gray keys**: Letters confirmed not in the word
- **White keys**: Letters not yet guessed
- This visual system helps you make strategic subsequent guesses and avoid repeating eliminated letters

### 🏁 Win Conditions & Game Flow

#### How to Win
- **Primary Victory**: Guess your opponent's word correctly before they guess yours
- **Time Victory**: If opponent runs out of time while you're still playing
- **Attempt Victory**: If you exceed your attempt limit without success, you lose

#### Game Timer System
- **Dynamic countdown** based on difficulty level (5-10 minutes) displayed as MM:SS format
- Timer appears in center top with green background (#2d5016) and white text
- Timer can be paused by clicking the pause button (shows dark overlay with quit options)
- Game automatically ends when timer reaches 00:00
- Different time limits based on AI difficulty:
  - **Easy**: 10 minutes with unlimited AI attempts
  - **Medium**: 7 minutes with unlimited AI attempts
  - **Difficult**: 5 minutes with unlimited AI attempts

#### Loss Conditions
- Opponent guesses your secret word first
- You exceed your attempt limit without guessing correctly  
- Time expires before you guess correctly

#### Draw Scenario
- Both players guess correctly at exactly the same timestamp (rare but possible in multiplayer)

### 🎨 Game Interface Features

#### Dual Board Visualization System
- **Your Board (Green Theme)**: 
  - Shows all your guesses in a 6-row grid with complete visual feedback
  - Each row displays 4 or 5 letter tiles (36px × 36px) with rounded corners and shadows
  - Complete color feedback for every letter in every guess
  - Current guess appears in real-time as you type with gradient backgrounds
  - Green border (#4a9b3c) and gradient backgrounds from light green to darker green
- **Opponent Board (Blue Theme)**: 
  - Shows only opponent's most recent guess in blue-themed styling
  - No color feedback revealed to maintain competitive fairness
  - Updates in real-time as opponent makes guesses
  - Uses blue gradient backgrounds (#dbeafe to #bfdbfe) and blue borders (#3b82c6)

#### Player Interface Elements
- **Player Profiles**: Circular avatar images (32px × 32px) and usernames displayed at the top
- **Timer Display**: Central countdown with green background and white text
- **Pause System**: Click pause to access quit options with dark overlay and back button
- **Navigation**: Back buttons on every screen with smooth hover scale animations
- **Professional Styling**: Consistent shadows, gradients, and border styling throughout

### 🤖 AI Opponent System

The game features a sophisticated AI opponent system with three difficulty levels:

- **Easy AI (10-minute time limit)**:
  - Makes guesses every 1-2 seconds with unlimited attempts
  - Uses only green feedback for subsequent guesses (ignores yellow and red)
  - Strategic first guesses using common vowels and consonants (TEAR, FATE, RUIN, CANE, LOUD for 4-letter; DOZEN, CRANE, SLATE, ROAST, ADIEU for 5-letter)
  - Random word selection from validated dictionary with fallback to local word lists

- **Medium AI (7-minute time limit)**:
  - Makes guesses every 0.8-1.5 seconds with unlimited attempts
  - Uses green and red feedback for word filtering (ignores yellow)
  - More strategic word selection based on confirmed and excluded letters
  - Improved timing and decision-making algorithms with dictionary API validation

- **Difficult AI (5-minute time limit)**:
  - Makes guesses every 6-7 seconds with unlimited attempts
  - Full deductive algorithm using all feedback types (green, yellow, red)
  - Handles duplicate letters correctly with advanced filtering
  - Optimal first guesses and maximum information gain strategy
  - Most challenging and human-like behavior patterns with word compatibility checking
  - Advanced word scoring system that prioritizes high-information guesses

### 🎵 Audio & Visual Experience

#### Immersive Audio System
- **Background Music**: Looping soundtrack begins automatically when reaching dashboard with multiple trigger strategies
- **Click Sound Pooling**: 10 pre-loaded click sound instances for zero-latency response
- **Result Audio**: Distinct win, lose, and tie sound effects with balanced volume (0.8 vs 0.25 for background)
- **Audio Settings**: Toggle background music and sound effects independently via AudioContext
- **Mobile Compatibility**: Audio enables automatically on first user interaction with multiple fallback strategies
- **Audio Management**: Proper cleanup and memory management for optimal performance

#### Visual Polish & Animations
- **Smooth Transitions**: Framer Motion powers all page transitions with fade/scale effects (0.3s duration)
- **Consistent Background**: Background.webp image remains constant during screen changes
- **Professional Assets**: High-quality webp images with dual theme support
- **Responsive Design**: Optimized for both mobile touch and desktop mouse interactions
- **Hover Effects**: Scale animations (105%-110%) on interactive elements for enhanced user feedback

### 📊 Game Results & Progression

#### End Game Experience
- **Result Display**: Clear win/lose/draw status with themed result images (Win.webp, Lose.webp, Tie.webp)
- **Word Revelation**: Opponent's secret word revealed with built-in dictionary definitions
- **Scoring System**: Points awarded for victories (+100 points for wins)
- **Quick Return**: Single "Quit" button returns to dashboard for immediate replay
- **Sound Effects**: Contextual audio plays based on game result (playWinSound, playLoseSound, playTieSound)

#### Leaderboard & Statistics
- **Point Tracking**: Persistent scoring system across all games
- **Player Rankings**: View top 5 players with points and rank display in modal
- **Performance Metrics**: Framework ready for tracking games played, games won, and success rates

### 🎯 Pro Tips for Mastering Word Duel

1. **Strategic Opening Moves**: Start with words containing common vowels (A, E, I, O, U) and frequent consonants (R, S, T, L, N)
2. **Keyboard Awareness**: Pay close attention to keyboard color changes to avoid repeating eliminated letters
3. **Pattern Recognition**: Use yellow feedback systematically to determine correct letter positions
4. **Time Management**: Balance speed with accuracy - time limits vary by difficulty (5-10 minutes)
5. **Word Length Strategy**: 4-letter words allow faster games, 5-letter words provide more strategic depth
6. **Dictionary Knowledge**: Familiarize yourself with common 4 and 5-letter words for better guessing
7. **Opponent Observation**: Watch opponent's guess frequency to gauge their strategy and confidence level
8. **Difficulty Selection**: Choose AI difficulty based on your skill level - Easy for learning, Difficult for maximum challenge

### 🔧 Technical Features & Accessibility

#### Mobile-First Design
- **Viewport Optimization**: Prevents zooming with `user-scalable=no` and ensures consistent experience across devices
- **Zero Native Keyboard Interference**: Custom keyboard completely bypasses mobile keyboard issues
- **Touch-Optimized Interface**: Proper button sizing and responsive layouts
- **Performance Optimization**: Efficient React rendering with proper key props and minimal re-renders

#### Performance & Reliability
- **Asset Preloading**: All images and audio files loaded during splash screen with progress tracking and retry mechanisms
- **Error Handling**: Comprehensive retry mechanisms for network issues and automatic guess clearing
- **Cross-Platform Compatibility**: Seamless experience on both desktop and mobile browsers
- **Reddit Integration**: Runs natively within Reddit posts using Devvit's webview technology
- **Memory Management**: Proper cleanup of audio instances and event listeners

## Technology Stack

- **[Devvit](https://developers.reddit.com/)**: Reddit's developer platform for native Reddit app integration
- **[React 19](https://react.dev/)**: Latest React with TypeScript strict mode and modern hooks
- **[Vite](https://vite.dev/)**: Lightning-fast build tool with hot module replacement
- **[Express](https://expressjs.com/)**: Node.js backend API server with Redis integration
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first styling with custom design system and Sour Gummy font
- **[Framer Motion](https://www.framer.com/motion/)**: Smooth page transitions and UI animations
- **[Lucide React](https://lucide.dev/)**: Comprehensive icon library for UI elements

## Current Game Architecture

### Frontend Structure
```
src/client/
├── main.tsx                 # React app entry point
├── App.tsx                  # Main routing and state management
├── index.html              # HTML template with mobile viewport optimization
├── index.css               # Tailwind CSS with Sour Gummy font integration
├── assets/                 # Game assets organized by theme
│   ├── themes/Default/     # Green nature theme assets
│   ├── themes/Halloween/   # Orange spooky theme assets
│   └── sounds/            # Audio files (background, clicks, results)
├── components/            # Reusable UI components
│   ├── Board.tsx          # Main game grid with 6 rows
│   ├── GuessRow.tsx       # Individual guess row with color feedback
│   ├── EnemyGuessRow.tsx  # Opponent's guess display (blue theme)
│   ├── Keyboard.tsx       # Custom on-screen keyboard
│   ├── Timer.tsx          # Countdown timer component
│   ├── Modal.tsx          # Reusable modal system
│   ├── EndGameModal.tsx   # Game results modal
│   ├── SoundButton.tsx    # Audio-enabled button wrapper
│   └── fallback/          # Error handling components
├── pages/                 # Main game screens
│   ├── Splash.tsx         # Asset preloading screen
│   ├── Dashboard.tsx      # Main menu with modals
│   ├── PreGame.tsx        # Word setup and game mode selection
│   ├── SelectDifficulty.tsx # AI difficulty selection
│   ├── Searching.tsx      # Multiplayer matchmaking simulation
│   └── Game.tsx           # Main gameplay interface
├── contexts/              # React context providers
│   └── AudioContext.tsx   # Audio settings management
└── utils/
    └── sound.ts           # Audio management system
```

### Key Game Mechanics (Currently Implemented)
- **Word Length Selection**: Players choose between 4 or 5-letter words with visual grid switching
- **Real-time Word Validation**: Dictionary API integration with fallback mechanisms and error handling
- **Dual Board System**: Player board (green theme) vs opponent board (blue theme) for competitive clarity
- **Color-Coded Feedback**: Green (correct position), Yellow (wrong position), Red (not in word)
- **Smart Keyboard State Tracking**: On-screen keys change color based on previous guesses with visual feedback
- **Dynamic Timer System**: Variable countdown based on AI difficulty with pause functionality
- **Sophisticated AI Behavior**: Three difficulty levels with unique strategies, timing, and attempt limits
- **Advanced Audio System**: Background music, click sound pooling (10 pre-loaded instances), and contextual result sounds
- **Comprehensive Asset Preloading**: All 37 images and 6 audio files loaded during splash screen with progress tracking
- **Mobile Keyboard Prevention**: Custom keyboard completely prevents native mobile keyboard interference
- **Game State Management**: Real-time polling for AI moves and multiplayer synchronization with intelligent state cleanup
- **Waiting State Management**: Visual feedback system that shows "waiting for opponent" during AI turns and clears immediately after responses
- **End Game Experience**: Result modals with word revelation, scoring, and immediate replay options

## Technical Implementation

### Project Architecture
- **Monorepo Structure**: Organized into `src/client`, `src/server`, and `src/shared` directories
- **TypeScript**: Strict type checking across all components with project references
- **Component-Based Design**: Modular React components with clear separation of concerns
- **Asset Management**: Comprehensive preloading system with progress tracking and error handling

### Key Components
- **App.tsx**: Main routing and state management with smooth page transitions using Framer Motion
- **Game.tsx**: Core gameplay logic with dual board display, real-time interactions, AI scheduling, game state polling, and intelligent waiting state management
- **Board.tsx & GuessRow.tsx**: Game grid rendering with color-coded feedback and attempt limit handling
- **Keyboard.tsx**: Custom on-screen keyboard with physical keyboard integration and visual feedback
- **PreGame.tsx**: Word setup with real-time validation, grid switching, and game mode selection
- **SoundButton.tsx**: Unified button component with automatic audio management
- **AudioContext.tsx**: Persistent audio settings with localStorage integration

### Audio System
- **Audio Pooling**: Pre-loaded click sound instances (10 pool) for instant playback without latency
- **Background Music**: Looping audio with automatic playback management and multiple enable strategies
- **Sound Effects**: Win/lose/tie sounds with proper volume balancing and contextual triggering
- **Mobile Compatibility**: Audio enabling on first user interaction with multiple fallback strategies

### Mobile Optimization
- **Viewport Configuration**: Prevents zooming and ensures consistent mobile experience across devices
- **Touch-First Design**: Custom keyboard prevents native mobile keyboard interference completely
- **Responsive Layout**: Optimized for various screen sizes with proper touch targets and hover effects
- **Performance**: Asset preloading, optimized rendering, and efficient React state management

## Current Implementation Status

### ✅ Fully Implemented Features

#### 🎨 Complete Frontend Experience
- **React 19 Application**: Modern React with TypeScript strict mode, Vite build system, and hot module replacement
- **Comprehensive Asset Management**: 
  - Preloading system for 37 images (Default + Halloween themes) and 6 audio files
  - Progress tracking with percentage display and failed asset counter
  - Retry mechanisms with exponential backoff for failed loads
  - Detailed loading status messages and error handling
- **Complete Game Flow**: Seamless navigation through all 6 game screens with smooth Framer Motion transitions
- **Advanced Audio System**:
  - Audio Context management with persistent localStorage settings
  - Audio pooling with 10 pre-loaded click sound instances for zero-latency response
  - Looping background music with automatic playback management and multiple trigger methods
  - Contextual win/lose/tie sound effects with proper volume balancing
  - Mobile-compatible audio enabling with multiple fallback strategies

#### 🎮 Core Gameplay Systems
- **Dual Word Length Support**: Complete 4-letter and 5-letter word grid systems with intelligent switching and visual feedback
- **Interactive Gameplay**: 
  - Functional word input with real-time validation feedback via dictionary API
  - 6-attempt guess system with immediate color-coded feedback
  - Win/lose/draw condition detection with instant game ending
  - Real-time game state polling and synchronization with 2-second intervals
  - Waiting Modal System: Visual feedback during opponent turns with automatic state clearing
- **Smart Keyboard System**: 
  - Custom on-screen keyboard that completely prevents native mobile keyboard interference
  - Full desktop physical keyboard support (A-Z, Enter, Delete, Backspace) with audio feedback
  - Dynamic key coloring based on previous guess feedback (green/yellow/gray states)
  - SoundButton wrapper for consistent audio feedback across all interactions
- **Dual Board Visualization**: 
  - Player board (green theme) with complete color feedback for all guesses
  - Opponent board (blue theme) showing most recent guess without feedback
  - 6-row grid layout with smooth animations and professional styling

#### 🎯 User Interface Excellence
- **Mobile-First Design**: 
  - Viewport optimization prevents zooming and ensures consistent experience
  - Touch-optimized interface with proper button sizing and responsive layouts
  - Zero native keyboard interference through custom input handling
- **Professional Visual Design**:
  - Dual theme support (Default green nature + Halloween orange spooky) with theme switching UI
  - Consistent Sour Gummy font family throughout the application
  - Smooth Framer Motion page transitions with preserved background imagery
  - Professional game assets with shadow effects and gradient styling
- **Advanced Timer System**: 
  - Dynamic countdown with MM:SS display format based on difficulty
  - Pause functionality with dark overlay and quit options
  - Automatic game ending when time expires

#### 🎵 Immersive Experience Features
- **Modal System**: Reusable components for leaderboards, settings, and end game results with smooth animations
- **Settings Management**: 
  - Theme selection modal with visual theme previews
  - Audio settings with independent background music and sound effects toggles
  - Persistent settings storage in localStorage
- **End Game Experience**: 
  - Themed result images (You Win/You Lose/A Tie)
  - Opponent word revelation with built-in dictionary definitions
  - Point scoring system (+100 points for wins)
  - Single-action return to dashboard
- **Player Interface**: 
  - Circular avatar images and usernames for both players
  - Real-time opponent guess display without revealing feedback
  - Professional game styling with consistent color schemes

### ✅ Backend Infrastructure (Implemented)

#### 🔧 Server Infrastructure
- **Express Server Setup**: Complete API server with Devvit integration and Redis connectivity
- **Dictionary API Integration**: 
  - Primary and fallback word validation services with retry logic
  - Network error handling with comprehensive error responses
  - Real-time word validation with proper error messaging
- **Data Access Patterns**: Redis-based game state and user data management with comprehensive CRUD operations
- **Shared Type System**: Complete TypeScript interfaces for GameState, PlayerState, API responses, and all data structures

#### 🎯 Game Logic Systems
- **Word Validation**: Real-time dictionary API validation with error messaging and network fallback
- **Game State Management**: Complete game session creation, persistence, and retrieval with Redis storage
- **Feedback Algorithm**: Color-coded guess feedback generation with duplicate letter handling
- **Win Condition Detection**: First-correct-guess winner determination with timestamp comparison
- **AI Opponent System**: Complete implementation of three difficulty levels with sophisticated strategies

#### 🤖 Intelligent AI System (Fully Implemented)
- **Easy AI**: Random word selection with green-only feedback processing, unlimited attempts, 1-2 second intervals
- **Medium AI**: Strategic word filtering using confirmed and excluded letters, unlimited attempts, 0.8-1.5 second intervals
- **Difficult AI**: Advanced deductive algorithms with optimal first guesses, duplicate letter handling, unlimited attempts, 6-7 second intervals
- **AI Word Generation**: Dictionary API integration for AI secret word selection with fallback to curated word lists
- **AI Strategy Management**: Persistent AI strategies with cleanup and timing management
- **Smart Game State Handling**: AI respects game completion states and prevents unnecessary moves after game ends

### 🚧 In Development

#### 🌐 Multiplayer Infrastructure (Planned)
- **Real-Time Matchmaking**: Word-length-based player matching with queue management
- **Live Synchronization**: Real-time game state updates between players
- **Concurrent Guessing**: Support for simultaneous player actions without turn restrictions
- **Disconnection Handling**: Graceful player reconnection and timeout management

#### 🎨 Enhanced Experience (Planned)
- **Functional Theme Switching**: Backend theme persistence and application
- **Enhanced Audio**: Theme-specific background music and expanded sound library
- **Statistics Tracking**: Detailed performance analytics and game history
- **Tournament Mode**: Competitive brackets and seasonal events
- **Coins System**: Virtual currency for cosmetic upgrades and premium features

### 🎮 Current Playable State

The game is **fully playable** with a complete single-player experience featuring:
- **Complete UI Flow**: All screens functional from splash to end game with smooth transitions
- **Intelligent AI Opponents**: Three difficulty levels with sophisticated word-guessing strategies
- **Professional Polish**: High-quality assets, smooth animations, and immersive audio experience
- **Cross-Platform Ready**: Optimized for both desktop and mobile with zero compromise
- **Reddit Integration**: Built on Devvit platform for seamless Reddit post deployment
- **Real-time Gameplay**: Live game state updates, AI opponent behavior, and responsive feedback

**Current Features**: Players can experience the complete single-player game flow including word setup with dual-grid selection, real-time dictionary validation with comprehensive error handling, intelligent AI opponents with varying difficulty levels and sophisticated strategies, color-coded feedback system with keyboard state tracking, timer pressure with pause functionality, waiting state management during AI turns, and satisfying end game results with contextual sound effects, word definitions, and scoring system.

**Recent Improvements**: Enhanced AI opponent behavior with improved game state management, preventing AI from making guesses after game completion, optimized timing intervals for more realistic gameplay experience, and improved waiting state management that clears the "waiting for opponent" modal immediately after AI moves for smoother gameplay flow.

## Getting Started

> Make sure you have Node 22 downloaded on your machine before running!

1. Run `npm create devvit@latest --template=react`
2. Go through the installation wizard. You will need to create a Reddit account and connect it to Reddit developers
3. Copy the command on the success page into your terminal

## Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit.
- `npm run build`: Builds your client and server projects
- `npm run deploy`: Uploads a new version of your app
- `npm run launch`: Publishes your app for review
- `npm run login`: Logs your CLI into Reddit
- `npm run check`: Type checks, lints, and prettifies your app

## Cursor Integration

This template comes with a pre-configured cursor environment. To get started, [download cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` when prompted.

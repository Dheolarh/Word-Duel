# **Project Brief: Word Duel**

## **1\. Project Overview**

**Word Duel** is a real-time, multiplayer 1v1 word-guessing game built on the Devvit platform for Reddit.
The objective is for a player to guess their opponent's secret word before the opponent guesses theirs.
The game supports both Player-vs-Player and Player-vs-AI modes.
Both Players(either PVP or PVsAI) guess words concurrently to assume the first person to guess the opponent word wins (it is not a turn by turn guess system)

- **Platform:** Reddit (via Devvit)
- **Game Type:** Word Puzzle, Strategy
- **Modes:** Single Player (vs. AI), Multiplayer (vs. Human)
- **Core Mechanic:** Guess a 4 or 5-letter secret word within 6 attempts and a time limit.

## **2\. Technology Stack**

- **Framework:** Devvit
- **Frontend:** React, Typescript (@devvit/public-api, @devvit/kit)
- **Backend:** Devvit Server (Node.js environment)
- **Real-time Data & Storage:** Devvit's built-in Redis for game sessions and leaderboards.
- **External Services:** A public dictionary API https://api.dictionaryapi.dev/api/v2/entries/en/<word> fallback https://freedictionaryapi.com/api/v1/entries/en/<word> for word validation and word meaning.

## **3\. Project File Structure**

`/word-duel-app`  
`├── devvit.json          # App configuration, permissions, UI entrypoints`  
`├── package.json`  
`├── src`  
`│   ├── client`  
`│   │   ├── main.tsx     # Client entrypoint, renders the React app`  
`│   │   ├── App.tsx      # Main component, handles page routing`  
`│   │   ├── assets/      # UI assets (e.g., logo, icons)`  
`│   │   ├── components/  # Reusable UI components`  
`│   │   │   ├── Board.tsx`  
`│   │   │   ├── Keyboard.tsx`  
`│   │   │   ├── Timer.tsx`  
`│   │   │   ├── Modal.tsx`  
`│   │   │   ├── GuessRow.tsx`  
`│   │   │   └── EnemyGuessRow.tsx`  
`│   │   └── pages/       # Top-level page view components`  
`│   │       ├── Splash.tsx`  
`│   │       ├── Dashboard.tsx`  
`│   │       ├── PreGame.tsx`  
`│   │       ├── SelectDifficulty.tsx`  
`│   │       ├── Searching.tsx`  
`│   │       └── Game.tsx`  
`│   └── server`  
`│       ├── main.ts      # Server entrypoint, API endpoint definitions`  
`│       ├── api.ts       # External dictionary API logic`  
`│       ├── game.ts      # Core game state management`  
`│       ├── ai.ts        # AI opponent logic`  
`│       └── leaderboard.ts # Leaderboard data management (Redis)`  
`└── tsconfig.json`

## **4\. devvit.json Configuration**

The application's capabilities must be declared here.  
`{`  
 `"name": "word-duel",`  
 `"version": "1.0.0",`  
 `"post": {`  
 `"entry": "src/client/main.tsx",`  
 `"height": "tall"`  
 `},`  
 `"permissions": {`  
 `"redis": true,`  
 `"http": {`  
 `"domains": ["api.dictionaryapi.dev, freedictionaryapi.com"]`  
 `}`  
 `}`  
`}`

## **5\. Screen & Component Breakdown**

### **Page Components (/pages)**

- **Splash.tsx**: Initial loading screen with the game logo. Transitions automatically to the Dashboard.
- **Dashboard.tsx**: Main menu.
  - **UI:** "Play", "Leaderboard", "Settings" buttons.
  - **Functionality:** Navigates to PreGame on "Play" click. Renders Leaderboard or Settings modals.
- **PreGame.tsx**: Game setup screen.
  - **UI:** Word length selector (4/5), text input for secret word, "Single Player" button, "Multiplayer" button.
  - **State:** wordLength, secretWord.
  - **Functionality:** On button click, sends secretWord to the server for validation. On success, navigates to SelectDifficulty (Single Player) or Searching (Multiplayer). Displays errors from the server if validation fails.
- **SelectDifficulty.tsx**: AI difficulty selection.
  - **UI:** "Easy", "Medium", "Difficult" buttons.
  - **Functionality:** Navigates to the Game page, passing the chosen difficulty level.
- **Searching.tsx**: Multiplayer matchmaking screen.
  - **UI:** "Searching for opponent..." animation/text.
  - **Functionality:** Initiates a search for a multiplayer game. Transitions to Game page once the server confirms a match.
- **Game.tsx**: The main game screen.
  - **UI:** Contains a Timer, an EnemyGuessRow at the top to display the opponent's most recent guess, the player's 6x5 Board, and the custom Keyboard.
  - **State:** gameState (current guesses, feedback, time remaining, etc.), currentGuess.
  - **Functionality:** Handles all in-game user input. Submits guesses to the server. Fetches and renders updated game state. Displays an EndGameModal when the match is over.

### **UI Components (/components)**

- **Modal.tsx**: A reusable pop-up component.
  - **Props:** title, children, onClose.
- **Timer.tsx**: Displays the remaining time.
  - **Props:** initialTime (in seconds).
  - **Functionality:** Counts down every second.
- **Board.tsx**: The grid for player guesses.
  - **Props:** guesses (array of guess objects with feedback).
  - **Functionality:** Renders multiple GuessRow components.
- **GuessRow.tsx**: A single row of letter tiles for the player.
  - **Props:** guess (string), feedback (array of 'green', 'yellow', 'red').
  - **Functionality:** Renders 5 tiles, coloring them based on the feedback prop.
- **EnemyGuessRow.tsx**: A single row to display the opponent's last guess.
  - **Props:** guess (string).
  - **Functionality:** Renders 5 letter tiles showing the opponent's most recent raw guess, without any color feedback. This keeps the player informed of their opponent's progress.
- **Keyboard.tsx**: Custom on-screen keyboard.
  - **Props:** onKeyPress, onEnter, onDelete, keyFeedback (map of letters to their status).
  - **Functionality:** Renders keys A-Z, Enter, and Del as interactive UI elements. It manages the current guess state internally. Crucially, it avoids using standard \<input\> elements, which prevents the native mobile keyboard from appearing.

### **End-of-Match Pop-up**

- **Component:** EndGameModal.tsx (can extend Modal.tsx).
- **Trigger:** This modal appears when the gameState.status from the server changes to "finished".
- **UI:**
  - **Title:** Displays "You Win\!", "You Lose\!", or "It's a Draw\!".
  - **Content:** Shows the opponent's secret word. Displays the points and coins awarded (for a win) or lost.
  - **Actions:** Buttons for "Play Again" (restarts the game flow) and "Return to Dashboard".

## **6\. Server-Side Logic & API Endpoints**

The server manages all game logic, state, and external communication.

- **POST /api/validate-word**:
  - **Payload:** { word: string, length: number }
  - **Action:** Calls the dictionary API to check if the word is valid.
  - **Response:** { success: true } or { success: false, error: "Invalid word." }
- **POST /api/create-game**:
  - **Payload:** { mode: 'single' | 'multi', secretWord: string, difficulty?: 'easy'|'medium'|'difficult' }
  - **Action:**
    - **Single Player:** Creates a new game session in Redis, selects an AI secret word, and sets the difficulty.
    - **Multiplayer:** Adds the player to a matchmaking queue in Redis. If another player is waiting, creates a new game session for both.
  - **Response:** { gameId: string, status: 'ready' | 'waiting' }
- **POST /api/submit-guess**:
  - **Payload:** { gameId: string, guess: string }
  - **Action:**
    1. Validates the guess against the opponent's secret word.
    2. Generates color-coded feedback (\[G, Y, R, ...\]).
    3. Updates the player's guess list in the Redis session.
    4. Checks for a win/loss condition and updates points/leaderboard.
  - **Response:** The full, updated gameState object.
- **GET /api/get-game-state**:
  - **Query Params:** ?gameId=string
  - **Action:** Retrieves the current game session object from Redis.
  - **Response:** The full gameState object.
- **GET /api/get-leaderboard**:
  - **Action:** Retrieves the top players from the Redis sorted set.
  - **Response:** { leaderboard: \[{ username: string, points: number }\] }

## **7\. Data Models (Redis)**

- **Game Session Object (game:\<gameId\>)**:  
  `{`  
   `"gameId": "uuid-1234",`  
   `"mode": "multi",`  
   `"status": "active" | "finished",`  
   `"winner": "null" | "player1" | "player2" | "draw",`  
   `"startTime": "timestamp",`  
   `"wordLength": 5,`  
   `"player1": {`  
   `"id": "reddit-user-id-1",`  
   `"secretWord": "TRAIN", // Stored only on server`  
   `"guesses": [`  
   `{ "guess": "CRANE", "feedback": ["Y", "R", "G", "R", "Y"] }`  
   `]`  
   `},`  
   `"player2": {`  
   `"id": "reddit-user-id-2",`  
   `"secretWord": "MOUSE", // Stored only on server`  
   `"guesses": []`  
   `}`  
  `}`

- **Leaderboard (Sorted Set leaderboard)**:
  - **Member:** reddit-user-id
  - **Score:** total_points
- **User Data (Hash user:\<userId\>)**:  
  `{`  
   `"username": "PlayerName",`  
   `"points": 1250,`  
   `"coins": 300`  
  `}`

## **8\. Core Algorithms**

### **A. Match Feedback System**

For each guess, compare the guessed word to the secret word letter by letter.

1. Initialize feedback array of size wordLength.
2. **First Pass (Greens):** Iterate from i \= 0 to wordLength \- 1\. If guess\[i\] \=== secret\[i\], mark feedback\[i\] \= 'green'.
3. **Second Pass (Yellows & Reds):** Iterate again. For each non-green letter in the guess:
   - Check if this letter exists elsewhere in the secret word (and hasn't already been matched to a green).
   - If yes, mark feedback\[i\] \= 'yellow'.
   - If no, mark feedback\[i\] \= 'red'.

### **B. AI Opponent Logic (/server/ai.ts)**

- **Easy Mechanics:**
  - **Time Limit:** 10 minutes
  - **Guess Intervals:** 6-10 seconds
  - **Guesses:** Unlimited (until time runs out)
  - **Logic:** The AI makes random valid word guesses from the full dictionary. It uses feedback from **"Green only"** to guess new word but doesn't filter list of guessed words.
- **Medium Mechanics:**
  - **Time Limit:** 7 minutes
  - **Guess Intervals:** 4-8 seconds
  - **Guesses:** 10
  - **Logic:** The AI uses only the **"Green and Red"** feedback to filter its word list. It ignores "Yellow" feedback.
- **Difficult Mechanics:**
  - **Time Limit:** 5 minutes
  - **Guess Intervals:** 4-10 seconds
  - **Guesses:** 6 (same as the player)
  - **Detailed Logic:** This AI employs a full deductive algorithm.
    1. **Initialization:** Starts with a complete list of all possible words of the correct length.
    2. **First Guess:** Makes a strategic first guess using a word with common, unique vowels and consonants (e.g., "AUDIO", "CRANE", "SLATE").
    3. **Process Feedback:** Receives the color-coded feedback from its guess.
    4. **Filter Word List:** It iterates through its entire list of possible words and eliminates any word that does not meet the criteria from the feedback:
       - **Green (G) filter:** Removes all words that do not have the correct letter in the exact correct position.
       - **Yellow (Y) filter:** Removes all words that do not contain the correct letter. It also removes words that have that letter in the same (now known to be incorrect) position.
       - **Red (R) filter:** Removes all words that contain this letter.
    5. **Handle Duplicate Letters (Crucial Case):** The algorithm must be able to process complex feedback. For example, if the guess is "APPLE" and the secret word is "PAPER", the feedback is \['Y', 'G', 'R', 'R', 'R'\]. The AI deduces:
       - The word has an 'A', but not in position 0\.
       - The word has a 'P' in position 1\.
       - The word does NOT contain a second 'P'.
       - The word does NOT contain an 'L'.
       - The word does NOT contain an 'E'. The AI then filters its list to only include words that meet all these specific constraints simultaneously.
    6. **Select Next Guess:** The AI chooses a new word from the now much smaller, refined list. This process repeats, with the list of possibilities shrinking after every guess, until the correct word is found.

### **C. Keyboard Input and System Keyboard Management**

The game provides a seamless input experience across both mobile and desktop devices by managing the keyboard manually.

1. **Preventing Mobile System Keyboard:** As described in the Keyboard.tsx component, the game avoids using any focusable \<input\> fields for guessing. All text is rendered in non-input elements like divs, and the custom on-screen keyboard directly manipulates the game's state. This is the core mechanism for preventing the default mobile keyboard from appearing.
2. **Physical Keyboard Mapping (Desktop):** For desktop users, a global event listener in Game.tsx captures physical keystrokes and maps them to the on-screen keyboard's functions. This ensures a native desktop experience.  
   `useEffect(() => {`  
    `const handleKeyDown = (event) => {`  
    `// Prevent default browser actions if the key is a letter`  
    `if (event.key.match(/^[a-zA-Z]$/)) {`  
    `event.preventDefault();`  
    `}`  
    `const key = event.key.toUpperCase();`  
    `if (key === 'ENTER') {`  
    `// Logic to submit guess`  
    `} else if (key === 'BACKSPACE' || key === 'DELETE') {`  
    `// Logic to delete last letter`  
    `} else if (key.length === 1 && key >= 'A' && key <= 'Z') {`  
    `// Logic to add letter to current guess`  
    `}`  
    `};`  
    `window.addEventListener('keydown', handleKeyDown);`  
    `return () => window.removeEventListener('keydown', handleKeyDown);`  
   `}, [/* dependencies */]);`

## \*\*9\. Important Build Process

-- Single Player mode construction first
-- Test single player mode
-- multiplayer mode after confirmation of single player build success
-- Test
-- Error handlings

## \*\*10\. EXTREMELY IMPORTANT NOTES!!!!

-- The frontend (UI) of this project is already built as (found in ./frontend)
it uses mock data to simulate gameStatethe frontend uses image assets for ui rendering and music assests for sound
So just use the already designed Frontend **with it's included assets and structure** with minimal modification _if needed to fit into the devvit environment_
IN NO WAY SHOULD THE ALREADY DESIGNED AND LAYOUT UI BE ALTERED!. Do not add extra content, pages, animation, text or whatsoever to the pre-made Frontend
Validation checks process in the Frontend
-- In pre-game screen if user enters a word ( a text should appear using game font and color saying "validating word"
----- if invalid word ( a new text in red color but game font should replace the validating word with "{word name} doesn't appear in the dictionary"
----- else if valid word player should navigate to select difficulty screen
----- for other errors e.g network error. a modal should pop up in the page the error occured. ( modal should use the end game design modal style -- white pop up and text)
----- STRICT WARNING - No other AI designed interface, pages, icons, animations or modal even loading pages should be created
--- All images (every single image) in game should be preloaded in the splash screen

The already designed UI should just be structured into the devvit project.
Also funtioning sound system

Slight issue in the pre-made UI: each page as a transition effect when switching. this transition is applied to all UI elements. make a change that the transition will 
be applied to all ui element except game background (Background.webp) background will remain constant throught the whole screens
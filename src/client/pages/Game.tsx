import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { SoundButton } from '../components/SoundButton';
import { ErrorModal } from '../components/ErrorModal';
import { playClickSound } from '../utils/sound';
import { ImageWithFallback } from '../components/fallback/ImageWithFallback';
import { Timer } from '../components/Timer';
import { TurnTimer } from '../components/TurnTimer';
import { Board } from '../components/Board';
import { Keyboard } from '../components/Keyboard';
import { EnemyGuessRow } from '../components/EnemyGuessRow';
import { EndGameModal } from '../components/EndGameModal';
import { WaitingModal } from '../components/WaitingModal';
import { GameState, PlayerState, ScoreBreakdown } from '../../shared/types/game';
import { ApiResponse, SubmitGuessResponse, GetGameStateResponse } from '../../shared/types/api';
import { getCurrentUserProfile, getProfilePictureUrl, getAIProfilePicture, UserProfile } from '../utils/userProfile';
import { ErrorHandler, ErrorInfo } from '../utils/errorHandling';
import pauseBtn from '../assets/themes/Default/Pause.webp';
import quitBtn from '../assets/themes/Default/Quit.webp';
import backBtn from '../assets/themes/Default/Back.webp';

interface GameProps {
  gameId: string;
  initialGameState: GameState;
  wordLength: number;
  secretWord: string;
  difficulty?: 'easy' | 'medium' | 'difficult';
  isMultiplayer: boolean;
  onExit: () => void;
}

export function Game({
  gameId,
  initialGameState,
  wordLength,
  difficulty,
  isMultiplayer,
  onExit,
}: GameProps) {
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [gameStatus, setGameStatus] = useState<'playing' | 'win' | 'lose' | 'draw'>('playing');
  const [keyFeedback, setKeyFeedback] = useState(
    new Map<string, 'correct' | 'present' | 'absent'>()
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);
  const [invalidWord, setInvalidWord] = useState<string>('');
  const [showInvalidWord, setShowInvalidWord] = useState(false);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [errorModal, setErrorModal] = useState<ErrorInfo | null>(null);
  const gameStatePollingRef = useRef<NodeJS.Timeout | null>(null);
  const syncValidationRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Determine current player and opponent - for multiplayer, use actual user ID
  let currentPlayer: PlayerState;
  let opponentPlayer: PlayerState;
  
  if (isMultiplayer) {
    // For multiplayer, determine based on actual user ID from profile
    const currentUserId = userProfile?.userId || 'current-user';
    if (gameState?.player1.id === currentUserId) {
      currentPlayer = gameState.player1;
      opponentPlayer = gameState.player2;
    } else {
      currentPlayer = gameState?.player2 || gameState?.player1;
      opponentPlayer = gameState?.player1 || gameState?.player2;
    }
  } else {
    // For single player, determine based on who is AI
    currentPlayer = gameState?.player1.isAI ? gameState.player2 : gameState.player1;
    opponentPlayer = gameState?.player1.isAI ? gameState.player1 : gameState.player2;
  }

  // Player info - use actual usernames from game state
  const playerName = currentPlayer?.username || 'You';
  const opponentName = opponentPlayer?.username || (isMultiplayer ? 'Opponent' : 'AI Opponent');

  // Profile pictures with Reddit integration
  const playerProfilePicture = userProfile?.profilePicture || getProfilePictureUrl(playerName);
  const opponentProfilePicture = opponentPlayer?.isAI 
    ? getAIProfilePicture()
    : getProfilePictureUrl(opponentName); // For multiplayer human opponents, use Reddit profile

  // Convert server feedback format to client format
  const convertFeedback = (
    feedback: ('green' | 'yellow' | 'red')[]
  ): ('correct' | 'present' | 'absent')[] => {
    return feedback.map((color) => {
      switch (color) {
        case 'green':
          return 'correct';
        case 'yellow':
          return 'present';
        case 'red':
          return 'absent';
        default:
          return 'absent';
      }
    });
  };

  // Get current player's guesses in client format
  const guesses =
    currentPlayer?.guesses.map((guess: any) => ({
      word: guess.guess,
      feedback: convertFeedback(guess.feedback),
    })) || [];

  // Get opponent's most recent guess (without feedback)
  const enemyGuess =
    opponentPlayer?.guesses && opponentPlayer.guesses.length > 0
      ? opponentPlayer.guesses[opponentPlayer.guesses.length - 1]?.guess || ''
      : '';

  // Get opponent's secret word (only shown when game is finished)
  const opponentWord = gameState?.status === 'finished' ? opponentPlayer?.secretWord || '' : '';
  const opponentWordDefinition =
    gameState?.status === 'finished' ? opponentPlayer?.secretWordDefinition || 'a word' : 'a word';

  // Update keyboard feedback
  const updateKeyFeedback = (guess: string, feedback: ('correct' | 'present' | 'absent')[]) => {
    const newFeedback = new Map(keyFeedback);

    guess.split('').forEach((letter, index) => {
      const currentStatus = newFeedback.get(letter);
      const newStatus = feedback[index];

      // Priority: correct > present > absent
      if (
        newStatus === 'correct' ||
        (newStatus === 'present' && currentStatus !== 'correct') ||
        (newStatus === 'absent' && !currentStatus)
      ) {
        newFeedback.set(letter, newStatus);
      }
    });

    setKeyFeedback(newFeedback);
  };

  // Submit guess to API
  const submitGuess = async (guess: string): Promise<boolean> => {
    setIsSubmittingGuess(true);

    try {
      // Use actual user ID for multiplayer games
      const playerId = isMultiplayer ? (userProfile?.userId || 'current-user') : 'current-user';
      
      const response = await fetch('/api/submit-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          playerId,
          guess,
        }),
      });

      const data: SubmitGuessResponse = await response.json();

      if (data.success && data.data) {
        setGameState(data.data.gameState);

        // Update keyboard feedback with the new guess
        const feedback = convertFeedback(data.data.guessResult.feedback);
        updateKeyFeedback(guess, feedback);

        // Check if game ended
        if (data.data.gameEnded) {
          updateGameStatus(data.data.gameState);
          // Store score breakdown if provided
          if (data.data.scoreBreakdown) {
            setScoreBreakdown(data.data.scoreBreakdown);
          }
        }

        return true;
      } else {
        console.error('Failed to submit guess:', data.error);
        // Only show error modal for serious errors, not validation errors
        if (data.code === 'SERVER_ERROR' || data.code === 'NETWORK_ERROR') {
          const errorInfo = ErrorHandler.parseGameError(data);
          setErrorModal(errorInfo);
        }
        return false;
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      // Only show error modal for network errors
      const errorInfo = ErrorHandler.parseGameError(error);
      if (errorInfo.retryable) {
        setErrorModal(errorInfo);
      }
      return false;
    } finally {
      setIsSubmittingGuess(false);
    }
  };

  // Update game status based on game state - enhanced for multiplayer
  const updateGameStatus = (state: GameState) => {
    if (state.status === 'finished') {
      // Determine if current player won based on winner and player ID
      const currentPlayerId = isMultiplayer ? (userProfile?.userId || 'current-user') : currentPlayer.id;
      
      if (state.winner === 'draw') {
        setGameStatus('draw');
      } else if (
        (state.winner === 'player1' && currentPlayerId === state.player1.id) ||
        (state.winner === 'player2' && currentPlayerId === state.player2.id)
      ) {
        setGameStatus('win');
      } else {
        setGameStatus('lose');
      }
    }
  };

  // Poll for game state updates and trigger AI moves when it's AI's turn
  const pollGameState = async () => {
    try {
      // Use actual user ID for multiplayer games
      const playerId = isMultiplayer ? (userProfile?.userId || 'current-user') : 'current-user';
      
      // Use multiplayer-specific endpoint for multiplayer games
      const endpoint = isMultiplayer 
        ? `/api/get-multiplayer-game/${gameId}?playerId=${playerId}`
        : `/api/get-game-state/${gameId}?playerId=${playerId}`;
        
      const response = await fetch(endpoint);
      const data: GetGameStateResponse = await response.json();

      if (data.success && data.data) {
        const newGameState = data.data.gameState;
        setGameState(newGameState);

        // Check if game ended
        if (newGameState.status === 'finished') {
          updateGameStatus(newGameState);
          setIsWaitingForOpponent(false);

          // Get score breakdown if game is finished
          if (data.data.scoreBreakdown) {
            setScoreBreakdown(data.data.scoreBreakdown);
          }
          return;
        }

        // TURN-BASED: Handle both single player and multiplayer turn management
        if (newGameState.status === 'active') {
          if (!isMultiplayer) {
            // Single player: Check if it's AI's turn and trigger AI guess
            const aiPlayer = newGameState.player1.isAI ? newGameState.player1 : newGameState.player2;

            // If it's AI's turn and we're not already waiting for AI
            if (newGameState.currentPlayer === aiPlayer.id && !isWaitingForOpponent) {
              setIsWaitingForOpponent(true);
              triggerAIGuess();
            }

            // If it's player's turn, clear waiting state
            if (newGameState.currentPlayer === currentPlayer.id) {
              setIsWaitingForOpponent(false);
            }
          } else {
            // Multiplayer: Handle turn-based synchronization between human players
            if (newGameState.currentPlayer === currentPlayer.id) {
              setIsWaitingForOpponent(false);
            } else {
              setIsWaitingForOpponent(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error polling game state:', error);
      // Don't show error modal for polling failures to avoid spam
      // Just log the error and continue polling
    }
  };

  // Handle turn timeout for multiplayer games
  const handleTurnTimeout = async () => {
    if (!isMultiplayer || gameStatus !== 'playing') return;
    
    try {
      const playerId = userProfile?.userId || 'current-user';
      
      const response = await fetch(`/api/skip-turn/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setGameState(data.data.gameState);
        // Turn has been skipped, opponent's turn now
        setIsWaitingForOpponent(true);
      } else {
        console.error('Failed to skip turn:', data.error);
      }
    } catch (error) {
      console.error('Error skipping turn:', error);
    }
  };

  // Trigger AI guess immediately (only called when it's AI's turn)
  const triggerAIGuess = async () => {
    if (!difficulty || isMultiplayer) return;

    try {
      // Get AI timing for realistic delay
      const timingResponse = await fetch(`/api/ai-timing/${difficulty}`);
      const timingData: ApiResponse<{ timing: number }> = await timingResponse.json();

      const delay = timingData.success && timingData.data ? timingData.data.timing : 2000;

      // Wait for realistic AI "thinking" time
      setTimeout(async () => {
        try {
          // Trigger AI guess
          const aiResponse = await fetch(`/api/ai-guess/${gameId}`, { method: 'POST' });
          const aiData: SubmitGuessResponse = await aiResponse.json();

          if (aiData.success && aiData.data) {
            setGameState(aiData.data.gameState);
            setIsWaitingForOpponent(false);

            if (aiData.data.gameEnded) {
              updateGameStatus(aiData.data.gameState);
              // Store score breakdown if provided
              if (aiData.data.scoreBreakdown) {
                setScoreBreakdown(aiData.data.scoreBreakdown);
              }
            }
          } else {
            console.error('AI guess failed:', aiData.error);
            setIsWaitingForOpponent(false);
          }
        } catch (error) {
          console.error('Error in AI guess:', error);
          setIsWaitingForOpponent(false);
          // Don't show error modal for AI guess failures
          // Just log and continue the game
        }
      }, delay);
    } catch (error) {
      console.error('Error triggering AI guess:', error);
      setIsWaitingForOpponent(false);
      // Don't show error modal for timing failures
    }
  };

  const handleKeyPress = (key: string) => {
    // TURN-BASED: Don't allow input if it's not player's turn
    if (gameStatus !== 'playing' || isPaused || isSubmittingGuess || showInvalidWord) return;
    if (gameState.currentPlayer !== currentPlayer.id) return;
    if (currentGuess.length < wordLength) {
      setCurrentGuess(currentGuess + key);
    }
  };

  const handleDelete = () => {
    // TURN-BASED: Don't allow input if it's not player's turn
    if (gameStatus !== 'playing' || isPaused || isSubmittingGuess || showInvalidWord) return;
    if (gameState.currentPlayer !== currentPlayer.id) return;
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  const handleEnter = async () => {
    if (gameStatus !== 'playing' || isPaused || isSubmittingGuess || showInvalidWord) return;
    if (currentGuess.length !== wordLength) return;

    // TURN-BASED: Check if it's the player's turn
    if (gameState.currentPlayer !== currentPlayer.id) {
      console.log('Not your turn!');
      return;
    }

    // Check if player has reached their guess limit
    const getHumanGuessLimit = () => {
      if (!difficulty) return Infinity; // Unlimited for multiplayer
      switch (difficulty) {
        case 'easy':
          return Infinity; // Unlimited
        case 'medium':
          return 15;
        case 'difficult':
          return 10;
        default:
          return Infinity;
      }
    };

    const humanGuessLimit = getHumanGuessLimit();
    if (guesses.length >= humanGuessLimit) {
      console.log('Player has reached guess limit:', humanGuessLimit);
      return; // Don't allow more guesses
    }

    const success = await submitGuess(currentGuess);

    if (success) {
      // Clear the current guess
      setCurrentGuess('');
      // Note: gameState will be updated with new currentPlayer from server
      // The polling will detect it's now AI's turn and trigger AI guess
    } else {
      // Show invalid word in red briefly
      setInvalidWord(currentGuess);
      setShowInvalidWord(true);

      // Clear after 1 second
      setTimeout(() => {
        setShowInvalidWord(false);
        setInvalidWord('');
        setCurrentGuess('');
      }, 1000);
    }
  };

  // Initialize game state and start polling
  useEffect(() => {
    // Update initial game status
    updateGameStatus(gameState);

    // Initialize keyboard feedback from existing guesses
    if (currentPlayer?.guesses) {
      currentPlayer.guesses.forEach((guess: any) => {
        const feedback = convertFeedback(guess.feedback);
        updateKeyFeedback(guess.guess, feedback);
      });
    }

    // TURN-BASED: Check initial turn state for both single player and multiplayer
    if (gameState.status === 'active') {
      if (!isMultiplayer) {
        // Single player: Check if it's AI's turn at game start
        const aiPlayer = gameState.player1.isAI ? gameState.player1 : gameState.player2;
        if (gameState.currentPlayer === aiPlayer.id) {
          setIsWaitingForOpponent(true);
          triggerAIGuess();
        }
      } else {
        // Multiplayer: Set initial waiting state based on whose turn it is
        if (gameState.currentPlayer !== currentPlayer.id) {
          setIsWaitingForOpponent(true);
        }
      }
    }

    // Start polling for game state updates (checks turns and triggers AI)
    gameStatePollingRef.current = setInterval(pollGameState, 1500);

    // For multiplayer games, add periodic sync validation
    if (isMultiplayer && gameState.status === 'active') {
      syncValidationRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/validate-sync/${gameId}`);
          const data = await response.json();
          
          if (data.success && data.data && !data.data.isValid) {
            console.warn('Multiplayer sync issues detected:', data.data.issues);
            
            // Check for critical sync issues that require user attention
            const criticalIssues = data.data.issues.filter((issue: string) => 
              issue.includes('exceeded time limit') || issue.includes('Excessive')
            );
            
            if (criticalIssues.length > 0) {
              // Show error modal for critical sync issues
              const errorInfo = ErrorHandler.parseGameError({
                error: 'Game synchronization issues detected. The game may end automatically.',
                code: 'SYNC_ERROR',
                retryable: false
              });
              setErrorModal(errorInfo);
            }
          }
        } catch (error) {
          console.error('Sync validation error:', error);
        }
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (gameStatePollingRef.current) {
        clearInterval(gameStatePollingRef.current);
      }
      if (syncValidationRef.current) {
        clearInterval(syncValidationRef.current);
      }
    };
  }, []);

  // Update game status when game state changes
  useEffect(() => {
    updateGameStatus(gameState);
  }, [gameState]);

  // Add keyboard support for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing' || isPaused || isSubmittingGuess) return;

      // TURN-BASED: Check if it's player's turn before allowing keyboard input
      if (gameState.currentPlayer !== currentPlayer.id) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        playClickSound(); // Play click sound for Enter
        handleEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        playClickSound(); // Play click sound for Backspace
        handleDelete();
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        playClickSound(); // Play click sound for letter keys
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentGuess,
    gameStatus,
    isPaused,
    isSubmittingGuess,
    gameState.currentPlayer,
    currentPlayer.id,
    showInvalidWord,
  ]);

  return (
    <div className="w-full h-screen flex flex-col items-center relative overflow-hidden">
      {/* Players and timer row */}
      <div className="w-full max-w-md flex justify-between items-center px-2 pt-1.5 pb-1">
        {/* Left player */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full border-2 border-[#4a9b3c] overflow-hidden bg-white shadow-lg">
            <ImageWithFallback
              src={playerProfilePicture}
              alt={playerName}
              className="w-full h-full object-cover"
            />
          </div>
          <span
            className="text-white text-xs font-medium"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            {playerName}
          </span>
        </div>

        {/* Center timer */}
        <div className="flex flex-col items-center gap-1">
          <div className="bg-[#2d5016] text-white px-2 py-1 rounded-full shadow-lg">
            <Timer
              initialTime={Math.max(
                0,
                Math.floor((gameState.timeLimit - (Date.now() - gameState.startTime)) / 1000)
              )}
              onTimeUp={() => setGameStatus('lose')}
              isPaused={isPaused}
            />
          </div>
          
          {/* Turn timer for multiplayer games */}
          {isMultiplayer && (
            <TurnTimer
              isVisible={gameStatus === 'playing' && gameState.currentPlayer === currentPlayer.id && !isPaused}
              onTimeUp={handleTurnTimeout}
              isPaused={isPaused}
              duration={30}
            />
          )}
        </div>

        {/* Right player */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-white text-xs font-medium"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            {opponentName}
          </span>
          <div className={`w-8 h-8 rounded-full border-2 ${opponentPlayer?.isAI ? 'border-orange-500' : 'border-[#3b82c6]'} overflow-hidden bg-white shadow-lg`}>
            <ImageWithFallback
              src={opponentProfilePicture}
              alt={opponentName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for AI opponents if Reddit mascot fails to load
                if (opponentPlayer?.isAI) {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=AI-Robot`;
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Pause button row */}
      <div className="w-full max-w-md flex justify-start items-center px-2 pb-1">
        <SoundButton
          onClick={() => setIsPaused(!isPaused)}
          className="hover:scale-110 transition-transform"
        >
          <img src={pauseBtn} alt="Pause" className="w-8 h-8" />
        </SoundButton>
      </div>

      {/* Game boards container - flex-1 ensures it takes remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full px-2 min-h-0">
        {/* Opponent's board */}
        <div className={`bg-gradient-to-br rounded-lg shadow-xl p-1.5 border-2 w-fit mx-auto ${
          opponentPlayer?.isAI 
            ? 'from-orange-100/90 to-orange-50/70 border-orange-500/40' 
            : 'from-blue-100/90 to-blue-50/70 border-[#3b82c6]/40'
        }`}>
          <EnemyGuessRow 
            guess={enemyGuess} 
            wordLength={wordLength}
            isAI={opponentPlayer?.isAI || false}
          />
        </div>

        {/* Player's board */}
        <div className="bg-gradient-to-br from-white/90 to-white/70 rounded-lg shadow-xl p-1.5 border-2 border-[#4a9b3c]/40 w-fit mx-auto">
          <Board
            guesses={guesses}
            currentGuess={showInvalidWord ? invalidWord : currentGuess}
            wordLength={wordLength}
            maxGuesses={6}
            showInvalidWord={showInvalidWord}
            {...(difficulty && { difficulty })}
          />
        </div>
      </div>

      {/* Keyboard */}
      <div className="w-full px-2 pb-1.5 flex justify-center">
        <Keyboard
          onKeyPress={handleKeyPress}
          onEnter={handleEnter}
          onDelete={handleDelete}
          keyFeedback={keyFeedback}
        />
      </div>

      <AnimatePresence>
        {/* Quit button overlay when paused */}
        {isPaused && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            {/* Back button */}
            <SoundButton
              onClick={() => setIsPaused(false)}
              className="absolute top-2 right-2 hover:scale-110 transition-transform"
            >
              <img src={backBtn} alt="Back" className="w-8 h-8" />
            </SoundButton>

            {/* Quit button */}
            <SoundButton onClick={onExit} className="hover:scale-105 transition-transform">
              <img src={quitBtn} alt="Quit" className="w-40" />
            </SoundButton>
          </div>
        )}

        {/* Waiting for opponent modal - show when it's opponent's turn */}
        <WaitingModal
          isVisible={gameStatus === 'playing' && isWaitingForOpponent}
          opponentName={opponentName}
          isMultiplayer={isMultiplayer}
        />

        {/* End game modal */}
        {gameStatus !== 'playing' && (
          <EndGameModal
            result={gameStatus === 'win' ? 'win' : gameStatus === 'lose' ? 'lose' : 'draw'}
            opponentWord={opponentWord}
            opponentWordDefinition={opponentWordDefinition}
            scoreBreakdown={scoreBreakdown}
            onReturnToDashboard={onExit}
          />
        )}

        {/* Error Modal */}
        {errorModal && (
          <ErrorModal
            title={errorModal.title}
            message={errorModal.message}
            retryable={errorModal.retryable}
            {...(errorModal.retryable && {
              onRetry: () => {
                setErrorModal(null);
                // For retryable errors, we could implement specific retry logic here
                // For now, just dismiss and let the user try again
              }
            })}
            onDismiss={() => setErrorModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { SoundButton } from '../components/SoundButton';
import { playClickSound } from '../utils/sound';
import { ImageWithFallback } from '../components/fallback/ImageWithFallback';
import { Timer } from '../components/Timer';
import { Board } from '../components/Board';
import { Keyboard } from '../components/Keyboard';
import { EnemyGuessRow } from '../components/EnemyGuessRow';
import { EndGameModal } from '../components/EndGameModal';
import { WaitingModal } from '../components/WaitingModal';
import { GameState } from '../../shared/types/game';
import { ApiResponse, SubmitGuessResponse, GetGameStateResponse } from '../../shared/types/api';
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
  const gameStatePollingRef = useRef<NodeJS.Timeout | null>(null);

  // Player info
  const playerName = 'You';
  const opponentName = isMultiplayer ? 'Opponent' : 'AI';
  
  // Determine current player and opponent based on who is AI
  const currentPlayer = gameState?.player1.isAI ? gameState.player2 : gameState.player1;
  const opponentPlayer = gameState?.player1.isAI ? gameState.player1 : gameState.player2;

  // Convert server feedback format to client format
  const convertFeedback = (feedback: ('green' | 'yellow' | 'red')[]): ('correct' | 'present' | 'absent')[] => {
    return feedback.map(color => {
      switch (color) {
        case 'green': return 'correct';
        case 'yellow': return 'present';
        case 'red': return 'absent';
        default: return 'absent';
      }
    });
  };

  // Get current player's guesses in client format
  const guesses = currentPlayer?.guesses.map(guess => ({
    word: guess.guess,
    feedback: convertFeedback(guess.feedback)
  })) || [];

  // Get opponent's most recent guess (without feedback)
  const enemyGuess = opponentPlayer?.guesses && opponentPlayer.guesses.length > 0 
    ? opponentPlayer.guesses[opponentPlayer.guesses.length - 1]?.guess || ''
    : '';

  // Get opponent's secret word (only shown when game is finished)
  const opponentWord = gameState?.status === 'finished' ? opponentPlayer?.secretWord || '' : '';
  const opponentWordDefinition = gameState?.status === 'finished' ? opponentPlayer?.secretWordDefinition || 'a word' : 'a word';

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
      const response = await fetch('/api/submit-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          playerId: 'current-user', // TODO: Get actual user ID
          guess
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
        }

        return true;
      } else {
        console.error('Failed to submit guess:', data.error);
        // TODO: Show error modal
        return false;
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      // TODO: Show error modal
      return false;
    } finally {
      setIsSubmittingGuess(false);
    }
  };

  // Update game status based on game state
  const updateGameStatus = (state: GameState) => {
    if (state.status === 'finished') {
      if (state.winner === 'player1' && currentPlayer.id === state.player1.id) {
        setGameStatus('win');
      } else if (state.winner === 'player2' && currentPlayer.id === state.player2.id) {
        setGameStatus('win');
      } else if (state.winner === 'draw') {
        setGameStatus('draw');
      } else {
        setGameStatus('lose');
      }
    }
  };

  // Poll for game state updates and trigger AI moves when it's AI's turn
  const pollGameState = async () => {
    try {
      const response = await fetch(`/api/get-game-state/${gameId}?playerId=current-user`);
      const data: GetGameStateResponse = await response.json();

      if (data.success && data.data) {
        const newGameState = data.data.gameState;
        setGameState(newGameState);
        
        // Check if game ended
        if (newGameState.status === 'finished') {
          updateGameStatus(newGameState);
          setIsWaitingForOpponent(false);
          return;
        }
        
        // TURN-BASED: Check if it's AI's turn and trigger AI guess
        if (!isMultiplayer && newGameState.status === 'active') {
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
        }
      }
    } catch (error) {
      console.error('Error polling game state:', error);
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
            }
          } else {
            console.error('AI guess failed:', aiData.error);
            setIsWaitingForOpponent(false);
          }
        } catch (error) {
          console.error('Error in AI guess:', error);
          setIsWaitingForOpponent(false);
        }
      }, delay);
    } catch (error) {
      console.error('Error triggering AI guess:', error);
      setIsWaitingForOpponent(false);
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
        case 'easy': return Infinity; // Unlimited
        case 'medium': return 15;
        case 'difficult': return 10;
        default: return Infinity;
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
      currentPlayer.guesses.forEach(guess => {
        const feedback = convertFeedback(guess.feedback);
        updateKeyFeedback(guess.guess, feedback);
      });
    }

    // TURN-BASED: Check if it's AI's turn at game start
    if (!isMultiplayer && gameState.status === 'active') {
      const aiPlayer = gameState.player1.isAI ? gameState.player1 : gameState.player2;
      if (gameState.currentPlayer === aiPlayer.id) {
        setIsWaitingForOpponent(true);
        triggerAIGuess();
      }
    }

    // Start polling for game state updates (checks turns and triggers AI)
    gameStatePollingRef.current = setInterval(pollGameState, 1500);

    return () => {
      if (gameStatePollingRef.current) {
        clearInterval(gameStatePollingRef.current);
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
  }, [currentGuess, gameStatus, isPaused, isSubmittingGuess, gameState.currentPlayer, currentPlayer.id, showInvalidWord]);



  return (
    <div className="w-full h-screen flex flex-col items-center relative overflow-hidden">
      {/* Players and timer row */}
      <div className="w-full max-w-md flex justify-between items-center px-2 pt-1.5 pb-1">
        {/* Left player */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full border-2 border-[#4a9b3c] overflow-hidden bg-white shadow-lg">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1724435811349-32d27f4d5806?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBhdmF0YXIlMjBwcm9maWxlfGVufDF8fHx8MTc2MDg2ODcyNnww&ixlib=rb-4.1.0&q=80&w=1080"
              alt={playerName}
              className="w-full h-full object-cover"
            />
          </div>
          <span
            className="text-white text-xs"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            {playerName}
          </span>
        </div>

        {/* Center timer */}
        <div className="bg-[#2d5016] text-white px-2 py-1 rounded-full shadow-lg">
          <Timer 
            initialTime={Math.max(0, Math.floor((gameState.timeLimit - (Date.now() - gameState.startTime)) / 1000))} 
            onTimeUp={() => setGameStatus('lose')} 
            isPaused={isPaused} 
          />
        </div>

        {/* Right player */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-white text-xs"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            {opponentName}
          </span>
          <div className="w-8 h-8 rounded-full border-2 border-[#3b82c6] overflow-hidden bg-white shadow-lg">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1724435811349-32d27f4d5806?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBhdmF0YXIlMjBwcm9maWxlfGVufDF8fHx8MTc2MDg2ODcyNnww&ixlib=rb-4.1.0&q=80&w=1080"
              alt={opponentName}
              className="w-full h-full object-cover"
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
        <div className="bg-gradient-to-br from-blue-100/90 to-blue-50/70 rounded-lg shadow-xl p-1.5 border-2 border-[#3b82c6]/40 w-fit mx-auto">
          <EnemyGuessRow guess={enemyGuess} wordLength={wordLength} />
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
          isVisible={gameStatus === 'playing' && gameState.currentPlayer !== currentPlayer.id}
          opponentName={opponentName}
        />

        {/* End game modal */}
        {gameStatus !== 'playing' && (
          <EndGameModal
            result={gameStatus === 'win' ? 'win' : gameStatus === 'lose' ? 'lose' : 'draw'}
            opponentWord={opponentWord}
            opponentWordDefinition={opponentWordDefinition}
            pointsEarned={gameStatus === 'win' ? 100 : 0}
            coinsEarned={gameStatus === 'win' ? 50 : 0}
            onReturnToDashboard={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

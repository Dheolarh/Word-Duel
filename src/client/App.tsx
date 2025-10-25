import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playBackgroundMusic } from './utils/sound';
import { AudioProvider } from './contexts/AudioContext';
import { ErrorModal } from './components/ErrorModal';
import { Splash } from './pages/Splash';
import { Dashboard } from './pages/Dashboard';
import { PreGame } from './pages/PreGame';
import { SelectDifficulty } from './pages/SelectDifficulty';
import { Searching } from './pages/Searching';
import { Game } from './pages/Game';
import background from './assets/themes/Default/Background.webp';
import { ApiResponse } from '../shared/types/api';
import { GameState } from '../shared/types/game';
import { ErrorHandler, ErrorInfo } from './utils/errorHandling';

type Page = 'splash' | 'dashboard' | 'pregame' | 'difficulty' | 'searching' | 'game';

interface GameConfig {
  wordLength: number;
  secretWord: string;
  difficulty?: 'easy' | 'medium' | 'difficult';
  isMultiplayer: boolean;
  gameId?: string;
  gameState?: GameState;
}

export const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [errorModal, setErrorModal] = useState<ErrorInfo | null>(null);

  useEffect(() => {
    // Start background music when dashboard loads (audio is enabled in splash screen)
    if (currentPage === 'dashboard') {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        playBackgroundMusic();
      }, 100);
    }
  }, [currentPage]);

  const handleSinglePlayer = (wordLength: number, secretWord: string) => {
    setGameConfig({
      wordLength,
      secretWord,
      isMultiplayer: false,
    });
    setCurrentPage('difficulty');
  };

  const handleMultiplayer = async (wordLength: number, secretWord: string) => {
    try {
      // Create multiplayer game (join matchmaking queue)
      const response = await fetch('/api/create-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: 'current-user', // TODO: Get actual user ID from Reddit context
          playerUsername: 'Player', // TODO: Get actual username from Reddit context
          playerSecretWord: secretWord,
          wordLength: wordLength,
          mode: 'multi'
        }),
      });

      const data: ApiResponse<{ gameId: string; status: string; gameState?: GameState }> = await response.json();

      if (data.success && data.data) {
        if (data.data.status === 'ready' && data.data.gameState) {
          // Match found immediately
          setGameConfig({
            wordLength,
            secretWord,
            isMultiplayer: true,
            gameId: data.data.gameId,
            gameState: data.data.gameState
          });
          setCurrentPage('game');
        } else if (data.data.status === 'waiting') {
          // Added to queue, show searching screen
          setGameConfig({
            wordLength,
            secretWord,
            isMultiplayer: true,
          });
          setCurrentPage('searching');
        }
      } else {
        console.error('Failed to join matchmaking:', data.error);
        if (data.code === 'SERVER_ERROR' || data.code === 'NETWORK_ERROR') {
          const errorInfo = ErrorHandler.parseApiError(data, 'Failed to join matchmaking');
          setErrorModal(errorInfo);
        }
      }
    } catch (error) {
      console.error('Error joining matchmaking:', error);
      const errorInfo = ErrorHandler.parseApiError(error, 'Failed to join matchmaking');
      setErrorModal(errorInfo);
    }
  };

  const handleDifficultySelect = async (difficulty: 'easy' | 'medium' | 'difficult') => {
    if (!gameConfig) return;

    try {
      // Create single player game via API
      const response = await fetch('/api/create-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: 'current-user', // TODO: Get actual user ID from Reddit context
          playerUsername: 'Player', // TODO: Get actual username from Reddit context
          playerSecretWord: gameConfig.secretWord,
          wordLength: gameConfig.wordLength,
          difficulty,
          mode: 'single'
        }),
      });

      const data: ApiResponse<{ gameId: string; status: string; gameState: GameState }> = await response.json();

      if (data.success && data.data) {
        setGameConfig({ 
          ...gameConfig, 
          difficulty,
          gameId: data.data.gameId,
          gameState: data.data.gameState
        });
        setCurrentPage('game');
      } else {
        console.error('Failed to create game:', data.error);
        // Only show error modal for serious errors
        if (data.code === 'SERVER_ERROR' || data.code === 'NETWORK_ERROR') {
          const errorInfo = ErrorHandler.parseApiError(data, 'Failed to create game');
          setErrorModal(errorInfo);
        }
      }
    } catch (error) {
      console.error('Error creating game:', error);
      const errorInfo = ErrorHandler.parseApiError(error, 'Failed to create game');
      setErrorModal(errorInfo);
    }
  };

  const handleMatchFound = async (gameId: string) => {
    if (!gameConfig) return;
    
    try {
      // Fetch the game state for the matched game
      const response = await fetch(`/api/get-game-state/${gameId}?playerId=current-user`);
      const data: ApiResponse<{ gameState: GameState }> = await response.json();
      
      if (data.success && data.data) {
        // Update game config with the matched game ID and state
        setGameConfig({
          ...gameConfig,
          gameId,
          gameState: data.data.gameState
        });
        setCurrentPage('game');
      } else {
        console.error('Failed to get game state:', data.error);
        // Return to pregame on error
        setGameConfig(null);
        setCurrentPage('pregame');
      }
    } catch (error) {
      console.error('Error getting game state:', error);
      // Return to pregame on error
      setGameConfig(null);
      setCurrentPage('pregame');
    }
  };

  const handleMatchmakingTimeout = () => {
    // Return to pregame screen when matchmaking times out
    setGameConfig(null);
    setCurrentPage('pregame');
  };

  const handleExitGame = () => {
    setGameConfig(null);
    setCurrentPage('dashboard');
  };

  const pageTransition = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 },
  };

  return (
    <AudioProvider>
      <div className="w-full h-screen overflow-hidden">
        {/* Fixed background that doesn't participate in transitions */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${background})` }}
        />

        {/* Content that transitions */}
        <div className="relative z-10 w-full h-full">
          <AnimatePresence mode="wait">
            {currentPage === 'splash' && (
              <motion.div key="splash" {...pageTransition}>
                <Splash onComplete={() => setCurrentPage('dashboard')} />
              </motion.div>
            )}

            {currentPage === 'dashboard' && (
              <motion.div key="dashboard" {...pageTransition}>
                <Dashboard onPlay={() => setCurrentPage('pregame')} />
              </motion.div>
            )}

            {currentPage === 'pregame' && (
              <motion.div key="pregame" {...pageTransition}>
                <PreGame
                  onSinglePlayer={handleSinglePlayer}
                  onMultiplayer={handleMultiplayer}
                  onBack={() => setCurrentPage('dashboard')}
                />
              </motion.div>
            )}

            {currentPage === 'difficulty' && (
              <motion.div key="difficulty" {...pageTransition}>
                <SelectDifficulty
                  onSelect={handleDifficultySelect}
                  onBack={() => setCurrentPage('pregame')}
                />
              </motion.div>
            )}

            {currentPage === 'searching' && gameConfig && (
              <motion.div key="searching" {...pageTransition}>
                <Searching 
                  playerId="current-user" // TODO: Get actual user ID from Reddit context
                  wordLength={gameConfig.wordLength as 4 | 5}
                  onMatchFound={handleMatchFound}
                  onBack={() => setCurrentPage('pregame')}
                  onTimeout={handleMatchmakingTimeout}
                />
              </motion.div>
            )}

            {currentPage === 'game' && gameConfig && gameConfig.gameId && gameConfig.gameState && (
              <motion.div key="game" {...pageTransition}>
                <Game
                  gameId={gameConfig.gameId}
                  initialGameState={gameConfig.gameState}
                  wordLength={gameConfig.wordLength}
                  secretWord={gameConfig.secretWord}
                  difficulty={gameConfig.difficulty || 'easy'}
                  isMultiplayer={gameConfig.isMultiplayer}
                  onExit={handleExitGame}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Error Modal */}
        {errorModal && (
          <ErrorModal
            title={errorModal.title}
            message={errorModal.message}
            retryable={errorModal.retryable}
            {...(errorModal.retryable && {
              onRetry: () => {
                setErrorModal(null);
                // For game creation errors, go back to difficulty selection
                if (currentPage === 'difficulty') {
                  // User can try selecting difficulty again
                }
              }
            })}
            onDismiss={() => setErrorModal(null)}
          />
        )}
      </div>
    </AudioProvider>
  );
};

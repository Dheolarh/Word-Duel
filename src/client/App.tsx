import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playBackgroundMusic } from './utils/sound';
import { AudioProvider } from './contexts/AudioContext';
import { Splash } from './pages/Splash';
import { Dashboard } from './pages/Dashboard';
import { PreGame } from './pages/PreGame';
import { SelectDifficulty } from './pages/SelectDifficulty';
import { Searching } from './pages/Searching';
import { Game } from './pages/Game';
import background from './assets/themes/Default/Background.webp';
import { ApiResponse } from '../shared/types/api';
import { GameState } from '../shared/types/game';

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

  const handleMultiplayer = (wordLength: number, secretWord: string) => {
    setGameConfig({
      wordLength,
      secretWord,
      isMultiplayer: true,
    });
    setCurrentPage('searching');
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
        // TODO: Show error modal to user
      }
    } catch (error) {
      console.error('Error creating game:', error);
      // TODO: Show error modal to user
    }
  };

  const handleMatchFound = () => {
    setCurrentPage('game');
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

            {currentPage === 'searching' && (
              <motion.div key="searching" {...pageTransition}>
                <Searching onMatchFound={handleMatchFound} onBack={() => setCurrentPage('pregame')} />
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
      </div>
    </AudioProvider>
  );
};

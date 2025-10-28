import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { SoundButton } from '../components/SoundButton';
import { useTheme } from '../contexts/ThemeContext';

interface SearchingProps {
  playerId: string;
  wordLength: 4 | 5;
  onMatchFound: (gameId: string) => void;
  onBack: () => void;
  onTimeout: () => void;
}

interface MatchmakingStatus {
  inQueue: boolean;
  playersWaiting: number;
  averageWaitTime: number;
}

export function Searching({ playerId, wordLength, onMatchFound, onBack, onTimeout }: SearchingProps) {
  const { assets, theme } = useTheme();
  // Status kept only to track queue presence on the server when needed
  const [, setStatus] = useState<MatchmakingStatus>({ inQueue: true, playersWaiting: 0, averageWaitTime: 0 });
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Polling interval for checking matchmaking status
  const POLL_INTERVAL = 2000; // 2 seconds
  const TIMEOUT_DURATION = 60000; // 60 seconds timeout

  const checkForActiveGame = useCallback(async () => {
    try {
      // Check if a match was found by polling the check-match endpoint
      const response = await fetch(`/api/check-match/${playerId}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.matchFound && data.data.gameId) {
        // Match found!
        onMatchFound(data.data.gameId);
      }
    } catch (error) {
      console.error('Error checking for active game:', error);
    }
  }, [playerId, onMatchFound]);

  const checkMatchmakingStatus = useCallback(async () => {
    try {
      // First check if a match was found
      await checkForActiveGame();
      
      // Then check matchmaking status
      const response = await fetch(`/api/matchmaking-status/${wordLength}/${playerId}`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);

        // If player is no longer in queue, they might have been matched
        if (!data.data.inQueue) {
          // Double-check for active game
          setTimeout(() => {
            checkForActiveGame();
          }, 500);
        }
      } else {
        console.error('Failed to get matchmaking status:', data.error);
      }
    } catch (error) {
      console.error('Error checking matchmaking status:', error);
      // Don't show error modal for polling failures, just log them
    }
  }, [playerId, wordLength, checkForActiveGame]);

  const leaveQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/leave-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          wordLength
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        console.error('Failed to leave queue:', data.error);
      }
    } catch (error) {
      console.error('Error leaving queue:', error);
    }
  }, [playerId, wordLength]);

  const handleBack = useCallback(async () => {
    await leaveQueue();
    onBack();
  }, [leaveQueue, onBack]);

  const handleTimeout = useCallback(async () => {
    if (!hasTimedOut) {
      setHasTimedOut(true);
      await leaveQueue();
      onTimeout();
    }
  }, [hasTimedOut, leaveQueue, onTimeout]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    // Start polling for matchmaking status
    pollInterval = setInterval(checkMatchmakingStatus, POLL_INTERVAL);

    // Set up timeout
    timeoutTimer = setTimeout(handleTimeout, TIMEOUT_DURATION);

    // Initial status check
    checkMatchmakingStatus();

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutTimer);
    };
  }, [checkMatchmakingStatus, handleTimeout]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (!hasTimedOut) {
        leaveQueue();
      }
    };
  }, [leaveQueue, hasTimedOut]);

  // formatTime removed — no longer displaying timers in searching UI

  // Only render the minimal searching UI per request: back button + single searching header
  // Use app-wide text color for Festive (purple), default keep primary for emphasis
  const headerColor = theme === 'Festive' ? 'var(--app-text)' : 'var(--primary)';

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-2 relative gap-4 overflow-hidden">
      {/* Back button */}
      <SoundButton
        onClick={handleBack}
        className="absolute top-2 left-2 hover:scale-110 transition-transform z-10"
      >
        <img src={assets.back} alt="Back" className="w-8 h-8" />
      </SoundButton>

      {/* Searching Text - theme aware, no shadow */}
      <h1
        className="text-2xl px-2 text-center"
        style={{
          color: headerColor,
          textShadow: 'none'
        }}
      >
        Searching for Player
      </h1>
      {/* animated dots */}
      <div className="flex gap-3 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: headerColor }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

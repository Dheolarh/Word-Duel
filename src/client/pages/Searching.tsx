import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { SoundButton } from '../components/SoundButton';
import backBtn from '../assets/themes/Default/Back.webp';

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
  const [status, setStatus] = useState<MatchmakingStatus>({ inQueue: true, playersWaiting: 0, averageWaitTime: 0 });
  const [timeWaiting, setTimeWaiting] = useState(0);
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
    let waitingTimer: NodeJS.Timeout;

    // Start polling for matchmaking status
    pollInterval = setInterval(checkMatchmakingStatus, POLL_INTERVAL);
    
    // Set up timeout
    timeoutTimer = setTimeout(handleTimeout, TIMEOUT_DURATION);
    
    // Update waiting time counter
    const startTime = Date.now();
    waitingTimer = setInterval(() => {
      setTimeWaiting(Date.now() - startTime);
    }, 1000);

    // Initial status check
    checkMatchmakingStatus();

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutTimer);
      clearInterval(waitingTimer);
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

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-2 relative gap-4 overflow-hidden">
      {/* Back button */}
      <SoundButton
        onClick={handleBack}
        className="absolute top-2 left-2 hover:scale-110 transition-transform z-10"
      >
        <img src={backBtn} alt="Back" className="w-8 h-8" />
      </SoundButton>

      {/* Searching Text */}
      <h1
        className="text-2xl text-[#c8e6a0] px-2 text-center"
        style={{
          textShadow:
            '4px 4px 0 #2d5016, -2px -2px 0 #2d5016, 2px -2px 0 #2d5016, -2px 2px 0 #2d5016, 2px 2px 0 #2d5016',
        }}
      >
        Searching for Player
      </h1>

      {/* Game Mode Info */}
      <div className="text-center mb-4">
        <p className="text-[#c8e6a0] text-lg font-semibold">
          {wordLength}-Letter Words
        </p>
        <p className="text-[#8bc34a] text-sm">
          Multiplayer Mode
        </p>
      </div>

      {/* Matchmaking Status */}
      <div className="bg-[#2d5016] rounded-lg p-4 mb-6 border-2 border-[#4a9b3c] max-w-sm w-full">
        <div className="text-center space-y-2">
          <p className="text-[#c8e6a0] text-sm">
            Time Waiting: <span className="font-mono">{formatTime(timeWaiting)}</span>
          </p>
          <p className="text-[#8bc34a] text-sm">
            Players in Queue: {status.playersWaiting}
          </p>
          {status.averageWaitTime > 0 && (
            <p className="text-[#8bc34a] text-xs">
              Avg. Wait: {formatTime(status.averageWaitTime)}
            </p>
          )}
        </div>
      </div>

      {/* Animated Dots */}
      <div className="flex gap-3 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-6 h-6 rounded-full bg-[#4a9b3c] border-3 border-[#2d5016]"
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Timeout Warning */}
      {timeWaiting > 45000 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <p className="text-yellow-400 text-sm">
            Search will timeout in {Math.ceil((TIMEOUT_DURATION - timeWaiting) / 1000)}s
          </p>
        </motion.div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';

interface TurnTimerProps {
  isVisible: boolean;
  onTimeUp: () => void;
  isPaused?: boolean;
  duration?: number; // in seconds, default 30
}

export function TurnTimer({ isVisible, onTimeUp, isPaused = false, duration = 30 }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  // Reset timer when visibility changes
  useEffect(() => {
    if (isVisible) {
      setTimeLeft(duration);
    }
  }, [isVisible, duration]);

  useEffect(() => {
    if (!isVisible || isPaused) {
      return;
    }

    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          onTimeUp();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp, isPaused, isVisible]);

  if (!isVisible) {
    return null;
  }

  // Color changes based on time remaining
  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-red-600 bg-red-100 border-red-300';
    if (timeLeft <= 10) return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-blue-600 bg-blue-100 border-blue-300';
  };

  return (
    <div className={`px-3 py-1 rounded-full border-2 shadow-md ${getTimerColor()} transition-colors duration-300`}>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
        <span className="text-sm font-bold tabular-nums">
          {timeLeft}s
        </span>
      </div>
    </div>
  );
}

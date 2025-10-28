import { useEffect, useState } from 'react';

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  isPaused?: boolean;
}

export function Timer({ initialTime, onTimeUp, isPaused = false }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    if (isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp, isPaused]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs tabular-nums" style={{ color: 'var(--on-primary)' }}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

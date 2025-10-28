interface WaitingModalProps {
  isVisible: boolean;
  opponentName: string;
  isMultiplayer?: boolean;
}

import { useTheme } from '../contexts/ThemeContext';

export function WaitingModal({ isVisible, opponentName, isMultiplayer = false }: WaitingModalProps) {
  if (!isVisible) return null;

  const waitingMessage = isMultiplayer 
    ? "Your opponent is making their move..."
    : "AI is thinking...";

  const { theme } = useTheme();
  const textColor = theme === 'Festive' ? 'var(--app-text)' : 'var(--app-text)';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--border-color)' }}></div>
        </div>
        <h3 
          className="text-lg font-bold mb-2"
          style={{ color: textColor, textShadow: 'none' }}
        >
          Waiting for {opponentName}
        </h3>
        <p 
          className="text-sm"
          style={{ color: textColor, textShadow: 'none' }}
        >
          {waitingMessage}
        </p>
      </div>
    </div>
  );
}

interface WaitingModalProps {
  isVisible: boolean;
  opponentName: string;
  isMultiplayer?: boolean;
}

export function WaitingModal({ isVisible, opponentName, isMultiplayer = false }: WaitingModalProps) {
  if (!isVisible) return null;

  const waitingMessage = isMultiplayer 
    ? "Your opponent is making their move..."
    : "AI is thinking...";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        </div>
        <h3 
          className="text-lg font-bold text-black mb-2"
          style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.8)' }}
        >
          Waiting for {opponentName}
        </h3>
        <p 
          className="text-sm text-black"
          style={{ textShadow: '1px 1px 3px rgba(255,255,255,0.8)' }}
        >
          {waitingMessage}
        </p>
      </div>
    </div>
  );
}

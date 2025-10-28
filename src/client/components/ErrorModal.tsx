import { SoundButton } from './SoundButton';
import { useEffect } from 'react';
import { playLoseSound } from '../utils/sound';
import { useTheme } from '../contexts/ThemeContext';

interface ErrorModalProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
  retryable?: boolean;
}

export function ErrorModal({
  title,
  message,
  onRetry,
  onDismiss,
  retryable = false,
}: ErrorModalProps) {
  useEffect(() => {
    // Play error sound when modal appears
    playLoseSound();
  }, []);

  const { assets } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div className="flex flex-col items-center space-y-2 pb-2 w-full max-w-sm px-4">
        {/* Error Title */}
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--modal-text)', textShadow: '1px 1px 2px rgba(0,0,0,0.12)' }}>
            {title}
          </p>
        </div>

        {/* Error Image */}
        <div className="my-2 w-full px-2">
          <img src={assets.lose} alt="Error" className="w-full mx-auto" />
        </div>

        {/* Error Message */}
        <div className="text-center space-y-1 mt-1 px-2">
          <p className="text-sm font-medium" style={{ color: 'var(--modal-text)', textShadow: '1px 1px 2px rgba(0,0,0,0.12)' }}>
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 items-center pt-2 w-full">
          {retryable && onRetry && (
            <SoundButton 
              onClick={onRetry} 
              className="hover:scale-105 transition-transform mb-2"
            >
              <div style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)', padding: '0.5rem 1.5rem', borderRadius: 8, fontWeight: 600 }}>
                Try Again
              </div>
            </SoundButton>
          )}
          
          <SoundButton onClick={onDismiss} className="hover:scale-105 transition-transform">
            <img src={assets.quit} alt="Close" className="h-10" />
          </SoundButton>
        </div>
      </div>
    </div>
  );
}

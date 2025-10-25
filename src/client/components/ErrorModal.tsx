import { SoundButton } from './SoundButton';
import { useEffect } from 'react';
import { playLoseSound } from '../utils/sound';
import errorImage from '../assets/themes/Default/Lose.webp';
import quitBtn from '../assets/themes/Default/Quit.webp';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div className="flex flex-col items-center space-y-2 pb-2 w-full max-w-sm px-4">
        {/* Error Title */}
        <div className="text-center">
          <p className="text-lg text-black font-bold" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
            {title}
          </p>
        </div>

        {/* Error Image */}
        <div className="my-2 w-full px-2">
          <img src={errorImage} alt="Error" className="w-full mx-auto" />
        </div>

        {/* Error Message */}
        <div className="text-center space-y-1 mt-1 px-2">
          <p className="text-sm text-black font-medium" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
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
              <div className="bg-[#4a9b3c] hover:bg-[#3d8332] text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-lg">
                Try Again
              </div>
            </SoundButton>
          )}
          
          <SoundButton onClick={onDismiss} className="hover:scale-105 transition-transform">
            <img src={quitBtn} alt="Close" className="h-10" />
          </SoundButton>
        </div>
      </div>
    </div>
  );
}

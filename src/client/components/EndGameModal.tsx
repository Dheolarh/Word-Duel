import { SoundButton } from './SoundButton';
import { useEffect } from 'react';
import { playWinSound, playLoseSound, playTieSound } from '../utils/sound';
import youWinImage from '../assets/themes/Default/Win.webp';
import youLoseImage from '../assets/themes/Default/Lose.webp';
import aTieImage from '../assets/themes/Default/Tie.webp';
import quitBtn from '../assets/themes/Default/Quit.webp';

interface EndGameModalProps {
  result: 'win' | 'lose' | 'draw';
  opponentWord: string;
  opponentWordDefinition?: string;
  pointsEarned?: number;
  coinsEarned?: number;
  onReturnToDashboard: () => void;
}

export function EndGameModal({
  result,
  opponentWord,
  opponentWordDefinition,
  pointsEarned,
  onReturnToDashboard,
}: EndGameModalProps) {
  const wordMeaning = opponentWordDefinition || 'a word';

  useEffect(() => {
    if (result === 'win') {
      playWinSound();
    } else if (result === 'lose') {
      playLoseSound();
    } else {
      playTieSound();
    }
  }, [result]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div className="flex flex-col items-center space-y-2 pb-2 w-full max-w-sm px-4">
        {/* Match Points */}
        {result === 'win' && pointsEarned && (
          <div className="text-center">
            <p className="text-base text-black font-semibold" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
              Match Points: +{pointsEarned}
            </p>
          </div>
        )}

        {/* Result Images */}
        {result === 'win' && (
          <div className="my-2 w-full px-2">
            <img src={youWinImage} alt="You Win!" className="w-full mx-auto" />
          </div>
        )}

        {result === 'lose' && (
          <div className="my-2 w-full px-2">
            <img src={youLoseImage} alt="You Lose!" className="w-full mx-auto" />
          </div>
        )}

        {result === 'draw' && (
          <div className="my-2 w-full px-2">
            <img src={aTieImage} alt="A Tie!" className="w-full mx-auto" />
          </div>
        )}

        {/* Opponent's Word and Meaning */}
        <div className="text-center space-y-1 mt-1 px-2">
          <p className="text-xs text-black font-medium" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
            <span className="uppercase tracking-wider text-sm">{opponentWord}</span>
            {' - '}
            <span className="italic">{wordMeaning}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 items-center pt-2 w-full">
          <SoundButton onClick={onReturnToDashboard} className="hover:scale-105 transition-transform">
            <img src={quitBtn} alt="Quit" className="h-10" />
          </SoundButton>
        </div>
      </div>
    </div>
  );
}

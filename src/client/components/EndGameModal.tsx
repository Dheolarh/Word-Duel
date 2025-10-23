import { Modal } from './Modal';
import { SoundButton } from './SoundButton';
import { useEffect } from 'react';
import { playWinSound, playLoseSound, playTieSound } from '../utils/sound';
import youWinImage from '../assets/themes/Default/Win.webp';
import youWinImageHalloween from '../assets/themes/Halloween/Win.webp';
import youLoseImage from '../assets/themes/Default/Lose.webp';
import youLoseImageHalloween from '../assets/themes/Halloween/Lose.webp';
import aTieImage from '../assets/themes/Default/Tie.webp';
import aTieImageHalloween from '../assets/themes/Halloween/Tie.webp';
import quitBtn from '../assets/themes/Default/Quit.webp';
import quitBtnHalloween from '../assets/themes/Halloween/Quit.webp';

interface EndGameModalProps {
  result: 'win' | 'lose' | 'draw';
  opponentWord: string;
  pointsEarned?: number;
  coinsEarned?: number;
  onReturnToDashboard: () => void;
}

// Mock word meanings
const wordMeanings: Record<string, string> = {
  WORDS: 'units of language that carry meaning',
  GAMES: 'activities engaged in for enjoyment',
  PLAYS: 'engages in activity for enjoyment',
  DUELS: 'contests between two parties',
  LIONS: 'large tawny-colored cats',
  BRAIN: 'organ of soft nervous tissue',
  CLASH: 'violent conflict or disagreement',
  FIGHT: 'take part in a violent struggle',
  WORD: 'single unit of language',
  GAME: 'form of competitive activity',
  PLAY: 'engage in activity for enjoyment',
  DUAL: 'consisting of two parts',
  DUEL: 'contest between two people',
  WINS: 'successful results in a contest',
};

export function EndGameModal({
  result,
  opponentWord,
  pointsEarned,
  onReturnToDashboard,
}: EndGameModalProps) {
  const wordMeaning = wordMeanings[opponentWord] || 'a common word';

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
    <Modal title="" onClose={onReturnToDashboard}>
      <div className="flex flex-col items-center space-y-2 pb-2">
        {/* Match Points */}
        {result === 'win' && pointsEarned && (
          <div className="text-center">
            <p className="text-base text-[#c8e6a0]" style={{ textShadow: '2px 2px 0 #2d5016' }}>
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
          <p className="text-xs text-[#2d5016]">
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
    </Modal>
  );
}

import { SoundButton } from './SoundButton';
import { useEffect, useState } from 'react';
import { playWinSound, playLoseSound, playTieSound } from '../utils/sound';
import { ScoreBreakdown } from '../../shared/types/game';
import { useTheme } from '../contexts/ThemeContext';

interface EndGameModalProps {
  result: 'win' | 'lose' | 'draw';
  opponentWord: string;
  opponentWordDefinition?: string;
  scoreBreakdown?: ScoreBreakdown | undefined;
  onReturnToDashboard: () => void;
}

export function EndGameModal({
  result,
  opponentWord,
  opponentWordDefinition,
  scoreBreakdown,
  onReturnToDashboard,
}: EndGameModalProps) {
  const { assets, theme, allTokens, festivalColors } = useTheme();
  const wordMeaning = opponentWordDefinition || 'a word';
  const [showBreakdown, setShowBreakdown] = useState(false);

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
        {scoreBreakdown && (
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: theme === 'Festive' ? (allTokens.Festive?.primary ?? festivalColors.modalBg) : 'var(--modal-text)', textShadow: '1px 1px 2px rgba(0,0,0,0.25)' }}>
              Match Points: {scoreBreakdown.totalScore > 0 ? '+' : ''}{scoreBreakdown.totalScore}
            </p>
            {scoreBreakdown.totalScore > 0 && (
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="text-xs underline transition-colors"
                style={{ color: theme === 'Festive' ? (allTokens.Festive?.primary ?? festivalColors.modalBg) : 'var(--primary)', textShadow: '1px 1px 2px rgba(0,0,0,0.12)' }}
              >
                {showBreakdown ? 'Hide' : 'Show'} breakdown
              </button>
            )}
          </div>
        )}

        {/* Score Breakdown */}
        {showBreakdown && scoreBreakdown && scoreBreakdown.totalScore > 0 && (
          <div className="rounded-lg p-3 text-xs w-full" style={{ backgroundColor: 'var(--modal-bg)', color: 'var(--modal-text)', borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--border-color)' }}>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Base Points:</span>
                <span>+{scoreBreakdown.basePoints}</span>
              </div>
              {scoreBreakdown.guessBonus > 0 && (
                <div className="flex justify-between">
                  <span>Guess Efficiency:</span>
                  <span>+{scoreBreakdown.guessBonus}</span>
                </div>
              )}
              {scoreBreakdown.speedBonus > 0 && (
                <div className="flex justify-between">
                  <span>Speed Bonus:</span>
                  <span>+{scoreBreakdown.speedBonus}</span>
                </div>
              )}
              {scoreBreakdown.letterBonus > 0 && (
                <div className="flex justify-between">
                  <span>Letter Accuracy ({scoreBreakdown.correctLettersCount} letters):</span>
                  <span>+{scoreBreakdown.letterBonus}</span>
                </div>
              )}
              {scoreBreakdown.difficultyMultiplier !== 1.0 && (
                <div className="flex justify-between">
                  <span>Difficulty Multiplier:</span>
                  <span>×{scoreBreakdown.difficultyMultiplier}</span>
                </div>
              )}
              {scoreBreakdown.multiplayerMultiplier !== 1.0 && (
                <div className="flex justify-between">
                  <span>Multiplayer Bonus:</span>
                  <span>×{scoreBreakdown.multiplayerMultiplier}</span>
                </div>
              )}
              <hr className="border-gray-400" />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{scoreBreakdown.totalScore}</span>
              </div>
            </div>
          </div>
        )}

        {/* Result Images */}
        {result === 'win' && (
          <div className="my-2 w-full px-2">
            <img src={assets.win} alt="You Win!" className="w-full mx-auto" />
          </div>
        )}

        {result === 'lose' && (
          <div className="my-2 w-full px-2">
            <img src={assets.lose} alt="You Lose!" className="w-full mx-auto" />
          </div>
        )}

        {result === 'draw' && (
          <div className="my-2 w-full px-2">
            <img src={assets.tie} alt="A Tie!" className="w-full mx-auto" />
          </div>
        )}

        {/* Opponent's Word and Meaning */}
        <div className="text-center space-y-1 mt-1 px-2">
          <p className="text-xs font-medium" style={{ color: theme === 'Festive' ? (allTokens.Festive?.primary ?? festivalColors.modalBg) : 'var(--modal-text)', textShadow: '1px 1px 2px rgba(0,0,0,0.12)' }}>
            <span className="uppercase tracking-wider text-sm">{opponentWord}</span>
            {' - '}
            <span className="italic">{wordMeaning}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 items-center pt-2 w-full">
          <SoundButton onClick={onReturnToDashboard} className="hover:scale-105 transition-transform">
            <img src={assets.quit} alt="Quit" className="h-10" />
          </SoundButton>
        </div>
      </div>
    </div>
  );
}

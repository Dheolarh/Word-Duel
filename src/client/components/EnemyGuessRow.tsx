import { useTheme } from '../contexts/ThemeContext';

interface EnemyGuessRowProps {
  guess: string;
  wordLength: number;
  isAI?: boolean;
}

export function EnemyGuessRow({ guess, wordLength }: EnemyGuessRowProps) {
  const letters = guess.padEnd(wordLength, ' ').split('');

  const { theme, festivalColors, allTokens } = useTheme();

  // Unified enemy styling: in Festive (Halloween) mode use purple for enemy rows (both AI and human).
  // In default mode use blue for enemy rows. This keeps single- and multi-player consistent.
  const festivePurple = allTokens.Festive?.primary || festivalColors?.modalBg || '#4B0082';
  const defaultBlue = '#1e40af';

  const borderColor = theme === 'Festive' ? festivePurple : defaultBlue;

  // Tiles should remain white / neutral and only the border change color.
  const neutralBackground = 'linear-gradient(to bottom, var(--bg-from), var(--bg-to))';
  const neutralTextColor = 'var(--primary)';

  return (
    <div className="flex gap-0.5 justify-center">
      {letters.map((letter, index) => (
        <div
          key={index}
          className={`w-9 h-9 flex items-center justify-center rounded-md uppercase shadow-md`}
            style={{
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: borderColor,
              background: neutralBackground,
              color: neutralTextColor,
            }}
        >
          <span className="text-base">{letter.trim() && letter}</span>
        </div>
      ))}
    </div>
  );
}

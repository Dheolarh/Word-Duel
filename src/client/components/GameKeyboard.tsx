import { Delete, CornerDownLeft } from 'lucide-react';
import { SoundButton } from './SoundButton';

interface GameKeyboardProps {
  onKeyPress: (key: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  keyFeedback?: Map<string, 'correct' | 'present' | 'absent'>;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function GameKeyboard({ onKeyPress, onEnter, onDelete, keyFeedback }: GameKeyboardProps) {
  const getKeyStyle = (key: string) => {
    const status = keyFeedback?.get(key);
    if (status === 'correct') return { backgroundColor: '#6aaa64', color: '#ffffff', borderColor: '#6aaa64' };
    if (status === 'present') return { backgroundColor: '#c9b458', color: '#ffffff', borderColor: '#c9b458' };
    if (status === 'absent') return { backgroundColor: '#9ca3af', color: '#ffffff', borderColor: '#9ca3af' };
    return { backgroundColor: 'white', color: 'var(--primary)', borderColor: 'var(--border-color)' };
  };

  const handleKeyClick = (key: string) => {
    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'DEL') {
      onDelete();
    } else {
      onKeyPress(key);
    }
  };

  // Responsive sizing: mobile-first larger touch targets, scaled down on sm+ screens
  const keyClass = `w-9 h-12 sm:w-6 sm:h-8 rounded border-2 transition-all active:scale-95 flex items-center justify-center shadow-md`;
  const keyTextClass = `text-sm sm:text-xs`;
  const rowClass = `flex gap-1 sm:gap-0.5 justify-center`;
  const containerClass = `w-full mx-auto bg-white/95 rounded-lg shadow-2xl p-2 sm:p-1.5 border-2`;

  return (
    <div className={containerClass} style={{ borderColor: 'var(--border-color)', maxWidth: '28rem' }}>
      <div className="space-y-1">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className={rowClass}>
            {row.map((key) => (
              <SoundButton
                key={key}
                onClick={() => handleKeyClick(key)}
                className={keyClass}
                style={getKeyStyle(key)}
                aria-label={`Key ${key}`}
              >
                <span className={keyTextClass}>{key}</span>
              </SoundButton>
            ))}
          </div>
        ))}

        {/* Bottom row with Enter and Delete */}
        <div className={rowClass}>
          <SoundButton
            onClick={onDelete}
            className={`px-3 sm:px-1.5 h-12 sm:h-8 rounded border-2 bg-white transition-all active:scale-95 flex items-center gap-2 sm:gap-0.5 shadow-md`}
            style={{ borderColor: 'var(--border-color)', color: 'var(--primary)' }}
            aria-label="Delete"
          >
            <Delete className="w-4 h-4 sm:w-3 sm:h-3" />
            <span className="text-sm sm:text-xs">Delete</span>
          </SoundButton>
          <SoundButton
            onClick={onEnter}
            className={`px-3 sm:px-2 h-12 sm:h-8 rounded border-2 text-white hover:opacity-95 transition-all active:scale-95 flex items-center gap-2 sm:gap-0.5 shadow-md`}
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
            aria-label="Enter"
          >
            <CornerDownLeft className="w-4 h-4 sm:w-3 sm:h-3" />
            <span className="text-sm sm:text-xs">Enter</span>
          </SoundButton>
        </div>
      </div>
    </div>
  );
}

export default GameKeyboard;

import { Delete } from 'lucide-react';
import { SoundButton } from './SoundButton';

interface PreGameKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function PreGameKeyboard({ onKeyPress, onDelete }: PreGameKeyboardProps) {
  const handleKeyClick = (key: string) => {
    if (key === 'DEL') {
      onDelete();
    } else {
      onKeyPress(key);
    }
  };

  /*
    Responsive sizing strategy:
    - Default (mobile phones, ~360-414px): larger keys for touch comfort
    - On wider screens (sm >= 640px) reduce key size to maintain proportion
  */
  const keyClass = `w-9 h-12 sm:w-6 sm:h-8 rounded border-2 transition-all active:scale-95 flex items-center justify-center shadow-md`;
  const keyTextClass = `text-sm sm:text-xs`;
  const rowClass = `flex gap-1 sm:gap-0.5 justify-center`;
  const containerClass = `w-full pb-2 flex justify-center`;

  return (
    <div className={containerClass}>
      <div className="w-full max-w-md bg-white/95 rounded-lg shadow-2xl p-2 sm:p-1.5 border-2" style={{ borderColor: 'var(--border-color)' }}>
        <div className="space-y-1">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className={rowClass}>
              {row.map((key) => (
                <SoundButton
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className={keyClass}
                  style={{ color: 'var(--primary)', borderColor: 'var(--border-color)', backgroundColor: 'white' }}
                  aria-label={`Key ${key}`}
                >
                  <span className={keyTextClass}>{key}</span>
                </SoundButton>
              ))}
            </div>
          ))}

          {/* Bottom row with Delete */}
          <div className={rowClass}>
            <SoundButton
              onClick={() => handleKeyClick('DEL')}
              className={`px-3 sm:px-1.5 h-12 sm:h-8 rounded border-2 bg-white transition-all active:scale-95 flex items-center gap-2 sm:gap-0.5 shadow-md`}
              style={{ borderColor: 'var(--border-color)', color: 'var(--primary)' }}
              aria-label="Delete"
            >
              <Delete className="w-4 h-4 sm:w-3 sm:h-3" />
              <span className="text-sm sm:text-xs">Delete</span>
            </SoundButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreGameKeyboard;

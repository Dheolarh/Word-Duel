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

  return (
    <div className="w-full pb-2 flex justify-center">
      <div className="w-fit bg-white/95 rounded-lg shadow-2xl p-1.5 border-2" style={{ borderColor: 'var(--border-color)' }}>
        <div className="space-y-0.5">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-0.5 justify-center">
              {row.map((key) => (
                <SoundButton
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className={`w-6 h-8 rounded border-2 transition-all active:scale-95 flex items-center justify-center shadow-md`}
                  style={{ color: 'var(--primary)', borderColor: 'var(--border-color)', backgroundColor: 'white' }}
                >
                  <span className="text-xs">{key}</span>
                </SoundButton>
              ))}
            </div>
          ))}

          {/* Bottom row with Delete */}
          <div className="flex gap-0.5 justify-center mt-0.5">
            <SoundButton
              onClick={() => handleKeyClick('DEL')}
              className="px-1.5 h-8 rounded border-2 bg-white transition-all active:scale-95 flex items-center gap-0.5 shadow-md"
              style={{ borderColor: 'var(--border-color)', color: 'var(--primary)' }}
            >
              <Delete className="w-3 h-3" />
              <span className="text-xs">Delete</span>
            </SoundButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreGameKeyboard;

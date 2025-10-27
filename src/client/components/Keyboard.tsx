import { Delete, CornerDownLeft } from 'lucide-react';
import { SoundButton } from './SoundButton';

interface KeyboardProps {
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

export function Keyboard({ onKeyPress, onEnter, onDelete, keyFeedback }: KeyboardProps) {
  const getKeyColor = (key: string) => {
    const status = keyFeedback?.get(key);
    if (status === 'correct') return 'bg-[#6aaa64] text-white border-[#6aaa64]';
    if (status === 'present') return 'bg-[#c9b458] text-white border-[#c9b458]';
    if (status === 'absent') return 'bg-gray-400 text-white border-gray-400';
    return 'bg-white text-[#2d5016] border-[#4a9b3c] hover:bg-[#f0f7ee]';
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

  return (
    <div className="w-fit mx-auto bg-white/95 rounded-lg shadow-2xl p-1.5 border-2 border-[#4a9b3c]/30">
      <div className="space-y-0.5">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-0.5 justify-center">
            {row.map((key) => (
              <SoundButton
                key={key}
                onClick={() => handleKeyClick(key)}
                className={`w-6 h-8 rounded border-2 transition-all active:scale-95 flex items-center justify-center shadow-md ${getKeyColor(key)}`}
              >
                <span className="text-xs">{key}</span>
              </SoundButton>
            ))}
          </div>
        ))}

        {/* Bottom row with Enter and Delete */}
        <div className="flex gap-0.5 justify-center mt-0.5">
          <SoundButton
            onClick={onDelete}
            className="px-1.5 h-8 rounded border-2 border-[#4a9b3c] bg-white text-[#2d5016] hover:bg-[#f0f7ee] transition-all active:scale-95 flex items-center gap-0.5 shadow-md"
          >
            <Delete className="w-3 h-3" />
            <span className="text-xs">Delete</span>
          </SoundButton>
          <SoundButton
            onClick={onEnter}
            className="px-2 h-8 rounded border-2 border-[#4a9b3c] bg-[#4a9b3c] text-white hover:bg-[#3d8432] transition-all active:scale-95 flex items-center gap-0.5 shadow-md"
          >
            <CornerDownLeft className="w-3 h-3" />
            <span className="text-xs">Enter</span>
          </SoundButton>
        </div>
      </div>
    </div>
  );
}

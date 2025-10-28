import { SoundButton } from '../components/SoundButton';
import { useTheme } from '../contexts/ThemeContext';

interface SelectDifficultyProps {
  onSelect: (difficulty: 'easy' | 'medium' | 'difficult') => void;
  onBack: () => void;
}

export function SelectDifficulty({ onSelect, onBack }: SelectDifficultyProps) {
  const { assets } = useTheme();
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-2 relative overflow-hidden">
      {/* Back button */}
      <SoundButton
        onClick={onBack}
        className="absolute top-2 left-2 hover:scale-110 transition-transform"
      >
        <img src={assets.back} alt="Back" className="w-8 h-8" />
      </SoundButton>

      {/* Difficulty buttons */}
      <div className="flex flex-col gap-3 items-center">
        <SoundButton onClick={() => onSelect('easy')} className="hover:scale-105 transition-transform">
          <img src={assets.easy} alt="Easy" className="h-12" />
        </SoundButton>
        <SoundButton onClick={() => onSelect('medium')} className="hover:scale-105 transition-transform">
          <img src={assets.medium} alt="Medium" className="h-12" />
        </SoundButton>
        <SoundButton onClick={() => onSelect('difficult')} className="hover:scale-105 transition-transform">
          <img src={assets.hard} alt="Hard" className="h-12" />
        </SoundButton>
      </div>
    </div>
  );
}

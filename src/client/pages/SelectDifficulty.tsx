import { SoundButton } from '../components/SoundButton';
import background from '../assets/themes/Default/Background.webp';
import backgroundHalloween from '../assets/themes/Halloween/Background.webp';
import easyBtn from '../assets/themes/Default/Easy.webp';
import easyBtnHalloween from '../assets/themes/Halloween/Easy.webp';
import mediumBtn from '../assets/themes/Default/Medium.webp';
import mediumBtnHalloween from '../assets/themes/Halloween/Medium.webp';
import hardBtn from '../assets/themes/Default/Hard.webp';
import hardBtnHalloween from '../assets/themes/Halloween/Hard.webp';
import backBtn from '../assets/themes/Default/Back.webp';
import backBtnHalloween from '../assets/themes/Halloween/Back.webp';

interface SelectDifficultyProps {
  onSelect: (difficulty: 'easy' | 'medium' | 'difficult') => void;
  onBack: () => void;
}

export function SelectDifficulty({ onSelect, onBack }: SelectDifficultyProps) {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-2 relative overflow-hidden">
      {/* Back button */}
      <SoundButton
        onClick={onBack}
        className="absolute top-2 left-2 hover:scale-110 transition-transform"
      >
        <img src={backBtn} alt="Back" className="w-8 h-8" />
      </SoundButton>

      {/* Difficulty buttons */}
      <div className="flex flex-col gap-3 items-center">
        <SoundButton onClick={() => onSelect('easy')} className="hover:scale-105 transition-transform">
          <img src={easyBtn} alt="Easy" className="h-12" />
        </SoundButton>
        <SoundButton onClick={() => onSelect('medium')} className="hover:scale-105 transition-transform">
          <img src={mediumBtn} alt="Medium" className="h-12" />
        </SoundButton>
        <SoundButton onClick={() => onSelect('difficult')} className="hover:scale-105 transition-transform">
          <img src={hardBtn} alt="Hard" className="h-12" />
        </SoundButton>
      </div>
    </div>
  );
}

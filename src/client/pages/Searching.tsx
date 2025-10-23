import { useEffect } from 'react';
import { motion } from 'motion/react';
import { SoundButton } from '../components/SoundButton';
import background from '../assets/themes/Default/Background.webp';
import backgroundHalloween from '../assets/themes/Halloween/Background.webp';
import backBtn from '../assets/themes/Default/Back.webp';
import backBtnHalloween from '../assets/themes/Halloween/Back.webp';

interface SearchingProps {
  onMatchFound: () => void;
  onBack: () => void;
}

export function Searching({ onMatchFound, onBack }: SearchingProps) {
  useEffect(() => {
    // Simulate finding a match after 3 seconds
    const timer = setTimeout(() => {
      onMatchFound();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onMatchFound]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-2 relative gap-4 overflow-hidden">
      {/* Back button */}
      <SoundButton
        onClick={onBack}
        className="absolute top-2 left-2 hover:scale-110 transition-transform z-10"
      >
        <img src={backBtn} alt="Back" className="w-8 h-8" />
      </SoundButton>

      {/* Searching Text */}
      <h1
        className="text-2xl text-[#c8e6a0] px-2 text-center"
        style={{
          textShadow:
            '4px 4px 0 #2d5016, -2px -2px 0 #2d5016, 2px -2px 0 #2d5016, -2px 2px 0 #2d5016, 2px 2px 0 #2d5016',
        }}
      >
        Searching for Player
      </h1>

      {/* Animated Dots */}
      <div className="flex gap-3 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-6 h-6 rounded-full bg-[#4a9b3c] border-3 border-[#2d5016]"
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}

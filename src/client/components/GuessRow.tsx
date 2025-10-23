interface GuessRowProps {
  guess: string;
  feedback?: ('correct' | 'present' | 'absent')[];
  wordLength: number;
}

export function GuessRow({ guess, feedback, wordLength }: GuessRowProps) {
  const letters = guess.padEnd(wordLength, ' ').split('');

  return (
    <div className="flex gap-0.5 justify-center">
      {letters.map((letter, index) => {
        const status = feedback?.[index];
        let bgColor = 'bg-gradient-to-b from-[#e8f5e3] to-[#d4ead0]';
        let borderColor = 'border-[#4a9b3c]';
        let textColor = 'text-[#2d5016]';

        if (status === 'correct') {
          bgColor = 'bg-[#6aaa64]';
          borderColor = 'border-[#6aaa64]';
          textColor = 'text-white';
        } else if (status === 'present') {
          bgColor = 'bg-[#c9b458]';
          borderColor = 'border-[#c9b458]';
          textColor = 'text-white';
        } else if (status === 'absent') {
          bgColor = 'bg-gray-400';
          borderColor = 'border-gray-400';
          textColor = 'text-white';
        }

        return (
          <div
            key={index}
            className={`w-9 h-9 flex items-center justify-center border-2 ${borderColor} rounded-md ${bgColor} ${textColor} uppercase transition-all duration-300 shadow-md`}
          >
            <span className="text-base">{letter.trim() && letter}</span>
          </div>
        );
      })}
    </div>
  );
}

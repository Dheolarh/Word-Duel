interface EnemyGuessRowProps {
  guess: string;
  wordLength: number;
  isAI?: boolean;
}

export function EnemyGuessRow({ guess, wordLength, isAI = false }: EnemyGuessRowProps) {
  const letters = guess.padEnd(wordLength, ' ').split('');

  // Different styling for AI vs human opponents
  const borderColor = isAI ? 'border-orange-500' : 'border-[#3b82c6]';
  const bgGradient = isAI 
    ? 'bg-gradient-to-b from-[#fed7aa] to-[#fdba74]' 
    : 'bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe]';
  const textColor = isAI ? 'text-[#c2410c]' : 'text-[#1e40af]';

  return (
    <div className="flex gap-0.5 justify-center">
      {letters.map((letter, index) => (
        <div
          key={index}
          className={`w-9 h-9 flex items-center justify-center border-2 ${borderColor} rounded-md ${bgGradient} ${textColor} uppercase shadow-md`}
        >
          <span className="text-base">{letter.trim() && letter}</span>
        </div>
      ))}
    </div>
  );
}

interface EnemyGuessRowProps {
  guess: string;
  wordLength: number;
}

export function EnemyGuessRow({ guess, wordLength }: EnemyGuessRowProps) {
  const letters = guess.padEnd(wordLength, ' ').split('');

  return (
    <div className="flex gap-0.5 justify-center">
      {letters.map((letter, index) => (
        <div
          key={index}
          className="w-9 h-9 flex items-center justify-center border-2 border-[#3b82c6] rounded-md bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe] text-[#1e40af] uppercase shadow-md"
        >
          <span className="text-base">{letter.trim() && letter}</span>
        </div>
      ))}
    </div>
  );
}

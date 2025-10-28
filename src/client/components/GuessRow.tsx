interface GuessRowProps {
  guess: string;
  feedback?: ('correct' | 'present' | 'absent')[];
  wordLength: number;
  isInvalid?: boolean;
}

export function GuessRow({ guess, feedback, wordLength, isInvalid = false }: GuessRowProps) {
  const letters = guess.padEnd(wordLength, ' ').split('');

  return (
    <div className="flex gap-0.5 justify-center">
      {letters.map((letter, index) => {
        const status = feedback?.[index];
        let bgColor = '';
        let borderColor = '';
        let textColor = '';

        if (isInvalid) {
          bgColor = '';
          borderColor = '';
          textColor = '';
        } else if (status === 'correct') {
          bgColor = '#6aaa64';
          borderColor = '#6aaa64';
          textColor = '#ffffff';
        } else if (status === 'present') {
          bgColor = '#c9b458';
          borderColor = '#c9b458';
          textColor = '#ffffff';
        } else if (status === 'absent') {
          bgColor = '#9ca3af';
          borderColor = '#9ca3af';
          textColor = '#ffffff';
        } else {
          // default neutral tile uses theme tokens
          bgColor = 'neutral';
          borderColor = 'var(--border-color)';
          textColor = 'var(--primary)';
        }

        return (
          <div
            key={index}
            className={`w-9 h-9 flex items-center justify-center rounded-md uppercase transition-all duration-300 shadow-md`}
            style={{
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: borderColor,
              background: bgColor === 'neutral' ? 'linear-gradient(to bottom, var(--bg-from), var(--bg-to))' : bgColor,
              color: textColor,
            }}
          >
            <span className="text-base">{letter.trim() && letter}</span>
          </div>
        );
      })}
    </div>
  );
}

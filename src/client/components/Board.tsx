import { GuessRow } from './GuessRow';

interface Guess {
  word: string;
  feedback?: ('correct' | 'present' | 'absent')[];
}

interface BoardProps {
  guesses: Guess[];
  currentGuess: string;
  wordLength: number;
  maxGuesses?: number;
}

export function Board({ guesses, currentGuess, wordLength, maxGuesses = 6 }: BoardProps) {
  const rows = [...guesses];

  // Add current guess row if there's space
  if (rows.length < maxGuesses) {
    rows.push({ word: currentGuess, feedback: [] });
  }

  // Fill remaining rows with empty rows
  while (rows.length < maxGuesses) {
    rows.push({ word: '', feedback: [] });
  }

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((guess, index) => (
        <GuessRow
          key={index}
          guess={guess.word}
          feedback={guess.feedback.length > 0 ? guess.feedback : undefined}
          wordLength={wordLength}
        />
      ))}
    </div>
  );
}

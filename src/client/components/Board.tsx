import { useEffect, useRef } from 'react';
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
  difficulty?: 'easy' | 'medium' | 'difficult' | undefined;
  showInvalidWord?: boolean;
}

export function Board({ guesses, currentGuess, wordLength, maxGuesses = 6, difficulty, showInvalidWord = false }: BoardProps) {
  // Determine human player guess limit based on difficulty
  const getHumanGuessLimit = () => {
    if (!difficulty) return Infinity; // Unlimited for multiplayer
    switch (difficulty) {
      case 'easy': return Infinity; // Unlimited
      case 'medium': return 15;
      case 'difficult': return 10;
      default: return Infinity;
    }
  };
  
  const humanGuessLimit = getHumanGuessLimit();
  const isAtGuessLimit = guesses.length >= humanGuessLimit;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create all rows: completed guesses + current guess + empty rows
  const allRows: Guess[] = [];
  
  // Add completed guesses
  allRows.push(...guesses);
  
  // Add current guess row if player hasn't reached their guess limit
  if (!isAtGuessLimit) {
    allRows.push({ word: currentGuess, feedback: [] });
  }
  
  // Fill remaining rows with empty rows to always show maxGuesses rows
  while (allRows.length < maxGuesses) {
    allRows.push({ word: '', feedback: [] });
  }

  // If we have more than maxGuesses, show the most recent ones
  const visibleRows = allRows.length > maxGuesses ? allRows.slice(-maxGuesses) : allRows;

  // Auto-scroll to show the current guess when new guesses are added
  useEffect(() => {
    if (containerRef.current && guesses.length > maxGuesses - 1) {
      // Scroll to bottom to show the latest guess
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [guesses.length, maxGuesses]);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col gap-0.5 ${
        guesses.length >= maxGuesses ? 'max-h-[240px] overflow-y-auto' : ''
      }`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border-color) #e5e7eb'
      }}
    >
      {visibleRows.map((guess, index) => {
        const props: { 
          guess: string; 
          wordLength: number; 
          feedback?: ('correct' | 'present' | 'absent')[]; 
          isInvalid?: boolean;
        } = {
          guess: guess.word,
          wordLength
        };
        
        if (guess.feedback && guess.feedback.length > 0) {
          props.feedback = guess.feedback;
        }
        
        // Check if this is the current guess row and should show as invalid
        const isCurrentGuessRow = index === visibleRows.length - 1 && guess.word === currentGuess;
        if (isCurrentGuessRow && showInvalidWord) {
          props.isInvalid = true;
        }
        
        return (
          <GuessRow
            key={`${index}-${guess.word}-${guesses.length}`}
            {...props}
          />
        );
      })}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { SoundButton } from '../components/SoundButton';
import { playClickSound } from '../utils/sound';
import { useTheme } from '../contexts/ThemeContext';
import { Delete } from 'lucide-react';
import { ValidationResponse } from '../../shared/types/api';

interface PreGameProps {
  onSinglePlayer: (wordLength: number, secretWord: string) => void;
  onMultiplayer: (wordLength: number, secretWord: string) => void;
  onBack: () => void;
}

export function PreGame({ onSinglePlayer, onMultiplayer, onBack }: PreGameProps) {
  const [word4, setWord4] = useState('');
  const [word5, setWord5] = useState('');
  const [activeGrid, setActiveGrid] = useState<4 | 5 | null>(null);
  const [validationState, setValidationState] = useState<{
    isValidating: boolean;
    validatedWord: string | null;
    error: string | null;
    isValid: boolean;
  }>({
    isValidating: false,
    validatedWord: null,
    error: null,
    isValid: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle backspace first
      if (e.key === 'Backspace') {
        e.preventDefault();
        playClickSound(); // Play click sound for backspace
        
        // Clear validation state when user types
        setValidationState({
          isValidating: false,
          validatedWord: null,
          error: null,
          isValid: false
        });

        if (activeGrid === 4 && word4.length > 0) {
          setWord4((prev) => prev.slice(0, -1));
        } else if (activeGrid === 5 && word5.length > 0) {
          setWord5((prev) => prev.slice(0, -1));
        }
      } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        // Only process single letter keys
        e.preventDefault();
        playClickSound(); // Play click sound for letter keys
        const letter = e.key.toUpperCase();

        // Clear validation state when user types
        setValidationState({
          isValidating: false,
          validatedWord: null,
          error: null,
          isValid: false
        });

        if (activeGrid === null) {
          // No grid selected yet, start with 4-letter
          setWord4(letter);
          setActiveGrid(4);
        } else if (activeGrid === 4) {
          if (word4.length < 4) {
            setWord4((prev) => prev + letter);
          }
        } else if (activeGrid === 5) {
          if (word5.length < 5) {
            setWord5((prev) => prev + letter);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [word4, word5, activeGrid]);

  const validateWord = async (word: string): Promise<boolean> => {
    setValidationState({
      isValidating: true,
      validatedWord: null,
      error: null,
      isValid: false
    });

    try {
      const response = await fetch('/api/validate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
      });

      const data: ValidationResponse = await response.json();

      if (data.success && data.data?.valid) {
        setValidationState({
          isValidating: false,
          validatedWord: data.data.word,
          error: null,
          isValid: true
        });
        return true;
      } else {
        setValidationState({
          isValidating: false,
          validatedWord: null,
          error: data.error || `${word} doesn't appear in the dictionary`,
          isValid: false
        });
        return false;
      }
    } catch (error) {
      console.error('Word validation error:', error);
      // Always show inline error, never modal in PreGame
      setValidationState({
        isValidating: false,
        validatedWord: null,
        error: 'Network error during word validation. Please try again.',
        isValid: false
      });
      return false;
    }
  };

  const handleProceed = async (mode: 'single' | 'multi') => {
    const wordLength = activeGrid === 4 ? 4 : 5;
    const secretWord = activeGrid === 4 ? word4 : word5;

    if (secretWord.length === wordLength) {
      // Check if this word is already validated
      if (validationState.validatedWord === secretWord && validationState.isValid) {
        // Word is already validated, proceed
        if (mode === 'single') {
          onSinglePlayer(wordLength, secretWord);
        } else {
          onMultiplayer(wordLength, secretWord);
        }
        return;
      }

      // Validate the word first
      const isValid = await validateWord(secretWord);
      if (isValid) {
        if (mode === 'single') {
          onSinglePlayer(wordLength, secretWord);
        } else {
          onMultiplayer(wordLength, secretWord);
        }
      }
    }
  };

  const handleGridClick = (gridSize: 4 | 5) => {
    // Allow switching between grids - clear the other grid
    if (activeGrid !== gridSize) {
      if (gridSize === 4) {
        setWord5('');
      } else {
        setWord4('');
      }
      // Clear validation state when switching grids
      setValidationState({
        isValidating: false,
        validatedWord: null,
        error: null,
        isValid: false
      });
    }
    setActiveGrid(gridSize);
  };

  const handleKeyPress = (key: string) => {
    // Clear validation state when user types
    setValidationState({
      isValidating: false,
      validatedWord: null,
      error: null,
      isValid: false
    });

    if (activeGrid === null) {
      setWord4(key);
      setActiveGrid(4);
    } else if (activeGrid === 4) {
      if (word4.length < 4) {
        setWord4((prev) => prev + key);
      }
    } else if (activeGrid === 5) {
      if (word5.length < 5) {
        setWord5((prev) => prev + key);
      }
    }
  };

  const handleDelete = () => {
    // Clear validation state when user deletes
    setValidationState({
      isValidating: false,
      validatedWord: null,
      error: null,
      isValid: false
    });

    if (activeGrid === 4 && word4.length > 0) {
      setWord4((prev) => prev.slice(0, -1));
    } else if (activeGrid === 5 && word5.length > 0) {
      setWord5((prev) => prev.slice(0, -1));
    }
  };



  const renderTile = (index: number, gridSize: 4 | 5) => {
    const word = gridSize === 4 ? word4 : word5;
    const letter = word[index] || '';
    const isInactive = activeGrid !== null && activeGrid !== gridSize;

    return (
      <div
        key={index}
        onClick={() => handleGridClick(gridSize)}
        className={`w-10 h-10 rounded-md border-3 flex items-center justify-center shadow-md cursor-pointer transition-all`}
        style={{
          borderColor: 'var(--border-color)',
          backgroundImage: 'linear-gradient(to bottom, var(--bg-from), var(--bg-to))',
          opacity: isInactive ? 0.35 : 1,
          filter: isInactive ? 'grayscale(100%)' : undefined,
        }}
      >
        <span className="text-lg" style={{ color: 'var(--primary)' }}>{letter}</span>
      </div>
    );
  };

  const currentWord = activeGrid === 4 ? word4 : word5;
  const isWordComplete = (activeGrid === 4 && word4.length === 4) || (activeGrid === 5 && word5.length === 5);
  const canProceed = isWordComplete && !validationState.isValidating;

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  const { assets } = useTheme();

  return (
    <div className="w-full h-screen flex flex-col items-center justify-between p-2 relative overflow-hidden">
      {/* Back button */}
      <SoundButton
        onClick={onBack}
        className="absolute top-2 left-2 hover:scale-110 transition-transform z-10"
      >
        <img src={assets.back} alt="Back" className="w-8 h-8" />
      </SoundButton>

      {/* Top section with grids and buttons */}
      <div className="flex flex-col items-center justify-center gap-2 flex-1 w-full max-w-md pt-8">
        {/* Enter Words Text */}
        <h2 className="text-xl text-[var(--primary)] mb-1">
          Enter Words
        </h2>

        {/* 4-Letter Word Grid */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-[var(--muted)]">
            4 Letters
          </span>
          <div className="flex gap-1">{[...Array(4)].map((_, i) => renderTile(i, 4))}</div>
        </div>

        {/* 5-Letter Word Grid */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-[var(--muted)]">
            5 Letters
          </span>
          <div className="flex gap-1">{[...Array(5)].map((_, i) => renderTile(i, 5))}</div>
        </div>

        {/* Validation Status */}
        <div className="h-6 flex items-center justify-center mt-2">
          {isWordComplete && (
            <>
              {validationState.isValidating && (
                <span className="text-sm text-[var(--muted)]">
                  validating word...
                </span>
              )}
              {validationState.error && (
                <span className="text-sm text-red-500">
                  {validationState.error}
                </span>
              )}
              {validationState.isValid && validationState.validatedWord === currentWord && (
                <span className="text-sm text-green-500">
                  ✓ Word validated
                </span>
              )}
            </>
          )}
        </div>

        {/* Game Mode Buttons */}
        <div className="flex flex-col gap-2 items-center mt-2">
                  <SoundButton
            onClick={() => handleProceed('single')}
            disabled={!canProceed}
            className={`hover:scale-105 transition-transform ${
              !canProceed ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <img src={assets.singleplayer} alt="Single Player" className="h-14" />
          </SoundButton>
          <SoundButton
            onClick={() => handleProceed('multi')}
            disabled={!canProceed}
            className={`hover:scale-105 transition-transform ${
              !canProceed ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <img src={assets.multiplayer} alt="Multiplayer" className="h-14" />
          </SoundButton>
        </div>
      </div>

      {/* On-screen Keyboard */}
      <div className="w-full pb-2 flex justify-center">
        <div className="w-fit bg-white/95 rounded-lg shadow-2xl p-1.5 border-2" style={{ borderColor: 'var(--border-color)' }}>
          <div className="space-y-0.5">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-0.5 justify-center">
                {row.map((key) => (
                  <SoundButton
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className="w-6 h-8 rounded border-2 bg-white transition-all active:scale-95 flex items-center justify-center shadow-md"
                    style={{ color: 'var(--primary)', borderColor: 'var(--border-color)' }}
                  >
                    <span className="text-xs">{key}</span>
                  </SoundButton>
                ))}
              </div>
            ))}

            {/* Bottom row with Delete */}
            <div className="flex gap-0.5 justify-center mt-0.5">
              <SoundButton
                onClick={handleDelete}
                className="px-1.5 h-8 rounded border-2 bg-white transition-all active:scale-95 flex items-center gap-0.5 shadow-md"
                style={{ borderColor: 'var(--border-color)', color: 'var(--primary)' }}
              >
                <Delete className="w-3 h-3" />
                <span className="text-xs">Delete</span>
              </SoundButton>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

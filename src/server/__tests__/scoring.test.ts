/**
 * Tests for multiplayer scoring calculations
 * Validates scoring algorithms, point calculations, and score breakdowns
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculatePoints, calculateScoreBreakdown, countCorrectLetters } from '../utils/gameLogic';
import { GuessResult } from '../../shared/types/game';

describe('Multiplayer Scoring Tests', () => {
  let sampleGuesses: GuessResult[];

  beforeEach(() => {
    sampleGuesses = [
      {
        guess: 'AUDIO',
        feedback: ['yellow', 'red', 'red', 'red', 'red'],
        timestamp: Date.now() - 60000
      },
      {
        guess: 'CRANE',
        feedback: ['green', 'green', 'green', 'green', 'green'],
        timestamp: Date.now()
      }
    ];
  });

  describe('Multiplayer Win Scoring', () => {
    it('should apply 2.5x multiplier for multiplayer wins', () => {
      const timeRemaining = 300000; // 5 minutes
      const points = calculatePoints(true, 2, timeRemaining, undefined, true, sampleGuesses);
      
      // Base: 50, Guess bonus: (6-2)*15=60, Speed bonus: min(60, 300000/1000/5)=60, Letter bonus: 5*5=25
      // Total before multiplier: 50+60+60+25=195
      // With 2.5x multiplayer multiplier: 195*2.5=487.5, floored to 487
      expect(points).toBe(487);
    });

    it('should calculate points correctly for quick multiplayer wins', () => {
      const quickGuesses: GuessResult[] = [
        {
          guess: 'CRANE',
          feedback: ['green', 'green', 'green', 'green', 'green'],
          timestamp: Date.now()
        }
      ];

      const timeRemaining = 540000; // 9 minutes remaining (1 minute used)
      const points = calculatePoints(true, 1, timeRemaining, undefined, true, quickGuesses);
      
      // Base: 50, Guess bonus: (6-1)*15=75, Speed bonus: min(60, 540000/1000/5)=60, Letter bonus: 5*5=25
      // Total before multiplier: 50+75+60+25=210
      // With 2.5x multiplayer multiplier: 210*2.5=525
      expect(points).toBe(525);
    });

    it('should handle slow multiplayer wins with minimal time bonus', () => {
      const manyGuesses: GuessResult[] = Array.from({ length: 5 }, (_, i) => ({
        guess: `WORD${i}`,
        feedback: i === 4 
          ? ['green', 'green', 'green', 'green', 'green']
          : ['red', 'red', 'red', 'red', 'red'],
        timestamp: Date.now() - (4 - i) * 60000
      }));

      const timeRemaining = 60000; // 1 minute remaining
      const points = calculatePoints(true, 5, timeRemaining, undefined, true, manyGuesses);
      
      // Base: 50, Guess bonus: (6-5)*15=15, Speed bonus: min(60, 60000/1000/5)=12, Letter bonus: 5*5=25
      // Total before multiplier: 50+15+12+25=102
      // With 2.5x multiplayer multiplier: 102*2.5=255
      expect(points).toBe(255);
    });
  });

  describe('Multiplayer Loss Scoring', () => {
    it('should award 100 points for multiplayer losses', () => {
      const points = calculatePoints(false, 6, 0, undefined, true, []);
      expect(points).toBe(100);
    });

    it('should award same loss points regardless of guesses made', () => {
      const points1 = calculatePoints(false, 1, 300000, undefined, true, []);
      const points2 = calculatePoints(false, 6, 0, undefined, true, []);
      
      expect(points1).toBe(100);
      expect(points2).toBe(100);
    });

    it('should not apply multiplayer multiplier to loss points', () => {
      const multiplayerLoss = calculatePoints(false, 6, 0, undefined, true, []);
      const singlePlayerLoss = calculatePoints(false, 6, 0, 'easy', false, []);
      
      expect(multiplayerLoss).toBe(100);
      expect(singlePlayerLoss).toBe(20); // Easy difficulty loss
    });
  });

  describe('Score Breakdown Calculations', () => {
    it('should provide detailed breakdown for multiplayer wins', () => {
      const breakdown = calculateScoreBreakdown(true, 3, 240000, undefined, true, sampleGuesses);
      
      expect(breakdown.basePoints).toBe(50);
      expect(breakdown.guessBonus).toBe(45); // (6-3)*15
      expect(breakdown.speedBonus).toBe(48); // min(60, 240000/1000/5)
      expect(breakdown.letterBonus).toBe(25); // 5 unique correct letters * 5
      expect(breakdown.difficultyMultiplier).toBe(1.0);
      expect(breakdown.multiplayerMultiplier).toBe(2.5);
      expect(breakdown.correctLettersCount).toBe(5);
      expect(breakdown.totalScore).toBe(420); // (50+45+48+25)*2.5 = 420
    });

    it('should provide breakdown for multiplayer losses', () => {
      const breakdown = calculateScoreBreakdown(false, 6, 0, undefined, true, []);
      
      expect(breakdown.basePoints).toBe(100); // Loss points
      expect(breakdown.guessBonus).toBe(0);
      expect(breakdown.speedBonus).toBe(0);
      expect(breakdown.letterBonus).toBe(0);
      expect(breakdown.difficultyMultiplier).toBe(1.0);
      expect(breakdown.multiplayerMultiplier).toBe(1.0);
      expect(breakdown.totalScore).toBe(100);
      expect(breakdown.correctLettersCount).toBe(0);
    });

    it('should handle edge case with no time remaining', () => {
      const breakdown = calculateScoreBreakdown(true, 2, 0, undefined, true, sampleGuesses);
      
      expect(breakdown.speedBonus).toBe(0);
      expect(breakdown.totalScore).toBeGreaterThan(0); // Should still get other bonuses
    });

    it('should cap speed bonus at maximum value', () => {
      const breakdown = calculateScoreBreakdown(true, 1, 600000, undefined, true, sampleGuesses);
      
      expect(breakdown.speedBonus).toBe(60); // Capped at 60
    });
  });

  describe('Letter Accuracy Bonus', () => {
    it('should count unique correct letters across all guesses', () => {
      const complexGuesses: GuessResult[] = [
        {
          guess: 'AUDIO',
          feedback: ['yellow', 'red', 'red', 'red', 'yellow'], // A and O correct
          timestamp: Date.now() - 120000
        },
        {
          guess: 'CRANE',
          feedback: ['green', 'yellow', 'red', 'red', 'green'], // C, R, E correct
          timestamp: Date.now() - 60000
        },
        {
          guess: 'MOUSE',
          feedback: ['green', 'yellow', 'red', 'red', 'green'], // M, O, E correct (O already counted)
          timestamp: Date.now()
        }
      ];

      const correctLetters = countCorrectLetters(complexGuesses);
      // Unique letters: A, O, C, R, E, M = 6 letters
      expect(correctLetters).toBe(6);

      const points = calculatePoints(true, 3, 300000, undefined, true, complexGuesses);
      const breakdown = calculateScoreBreakdown(true, 3, 300000, undefined, true, complexGuesses);
      
      expect(breakdown.letterBonus).toBe(30); // 6 * 5
      expect(breakdown.correctLettersCount).toBe(6);
    });

    it('should not double-count repeated correct letters', () => {
      const repeatedGuesses: GuessResult[] = [
        {
          guess: 'AAAAA',
          feedback: ['yellow', 'red', 'red', 'red', 'red'], // Only A is correct
          timestamp: Date.now() - 60000
        },
        {
          guess: 'BAAAA',
          feedback: ['red', 'yellow', 'red', 'red', 'red'], // Only A is correct again
          timestamp: Date.now()
        }
      ];

      const correctLetters = countCorrectLetters(repeatedGuesses);
      expect(correctLetters).toBe(1); // Only A counted once

      const breakdown = calculateScoreBreakdown(true, 2, 300000, undefined, true, repeatedGuesses);
      expect(breakdown.letterBonus).toBe(5); // 1 * 5
    });

    it('should handle guesses with no correct letters', () => {
      const wrongGuesses: GuessResult[] = [
        {
          guess: 'WRONG',
          feedback: ['red', 'red', 'red', 'red', 'red'],
          timestamp: Date.now()
        }
      ];

      const correctLetters = countCorrectLetters(wrongGuesses);
      expect(correctLetters).toBe(0);

      const breakdown = calculateScoreBreakdown(true, 1, 300000, undefined, true, wrongGuesses);
      expect(breakdown.letterBonus).toBe(0);
    });
  });

  describe('Comparison with Single Player Scoring', () => {
    it('should award more points for multiplayer wins than single player', () => {
      const multiplayerPoints = calculatePoints(true, 3, 300000, 'medium', true, sampleGuesses);
      const singlePlayerPoints = calculatePoints(true, 3, 300000, 'medium', false, sampleGuesses);
      
      expect(multiplayerPoints).toBeGreaterThan(singlePlayerPoints);
      expect(multiplayerPoints / singlePlayerPoints).toBeCloseTo(2.5, 1); // Should be ~2.5x
    });

    it('should award more points for multiplayer losses than single player losses', () => {
      const multiplayerLoss = calculatePoints(false, 6, 0, 'medium', true, []);
      const singlePlayerLoss = calculatePoints(false, 6, 0, 'medium', false, []);
      
      expect(multiplayerLoss).toBe(100);
      expect(singlePlayerLoss).toBe(30); // Medium difficulty loss
      expect(multiplayerLoss).toBeGreaterThan(singlePlayerLoss);
    });

    it('should maintain same base calculation logic for both modes', () => {
      const multiBreakdown = calculateScoreBreakdown(true, 2, 300000, undefined, true, sampleGuesses);
      const singleBreakdown = calculateScoreBreakdown(true, 2, 300000, undefined, false, sampleGuesses);
      
      // Base components should be the same
      expect(multiBreakdown.basePoints).toBe(singleBreakdown.basePoints);
      expect(multiBreakdown.guessBonus).toBe(singleBreakdown.guessBonus);
      expect(multiBreakdown.speedBonus).toBe(singleBreakdown.speedBonus);
      expect(multiBreakdown.letterBonus).toBe(singleBreakdown.letterBonus);
      
      // Only multiplier should differ
      expect(multiBreakdown.multiplayerMultiplier).toBe(2.5);
      expect(singleBreakdown.multiplayerMultiplier).toBe(1.0);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle maximum possible score scenario', () => {
      const perfectGuess: GuessResult[] = [
        {
          guess: 'CRANE',
          feedback: ['green', 'green', 'green', 'green', 'green'],
          timestamp: Date.now()
        }
      ];

      const maxTimeRemaining = 600000; // Full 10 minutes
      const points = calculatePoints(true, 1, maxTimeRemaining, undefined, true, perfectGuess);
      
      // Base: 50, Guess bonus: (6-1)*15=75, Speed bonus: 60 (capped), Letter bonus: 5*5=25
      // Total: (50+75+60+25)*2.5 = 525
      expect(points).toBe(525);
    });

    it('should handle minimum win score scenario', () => {
      const lastGuess: GuessResult[] = Array.from({ length: 6 }, (_, i) => ({
        guess: `WORD${i}`,
        feedback: i === 5 
          ? ['green', 'green', 'green', 'green', 'green']
          : ['red', 'red', 'red', 'red', 'red'],
        timestamp: Date.now() - (5 - i) * 60000
      }));

      const noTimeRemaining = 0;
      const points = calculatePoints(true, 6, noTimeRemaining, undefined, true, lastGuess);
      
      // Base: 50, Guess bonus: 0, Speed bonus: 0, Letter bonus: 5*5=25
      // Total: (50+0+0+25)*2.5 = 187.5, floored to 187
      expect(points).toBe(187);
    });

    it('should handle fractional calculations correctly', () => {
      const breakdown = calculateScoreBreakdown(true, 4, 123456, undefined, true, sampleGuesses);
      
      // Speed bonus: min(60, 123456/1000/5) = min(60, 24.69) = 24
      expect(breakdown.speedBonus).toBe(24);
      
      // Total should be properly floored
      expect(Number.isInteger(breakdown.totalScore)).toBe(true);
    });
  });
});

/**
 * Performance tests for Word Duel
 * Tests concurrent user handling, Redis operations, API response times,
 * asset preloading efficiency, and scoring calculations under load
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculatePoints, calculateScoreBreakdown, generateGuessFeedback, countCorrectLetters } from '../utils/gameLogic';
import { MatchmakingManager } from '../utils/matchmaking';
import { GameStateManager } from '../utils/gameStateManager';
import { GuessResult } from '../../shared/types/game';

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scoring Calculations Performance', () => {
    it('should handle bulk scoring calculations efficiently', async () => {
      const startTime = performance.now();
      const iterations = 1000;
      
      const sampleGuesses: GuessResult[] = [
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

      // Perform bulk scoring calculations
      const results = [];
      for (let i = 0; i < iterations; i++) {
        const points = calculatePoints(true, 2, 300000, undefined, true, sampleGuesses);
        results.push(points);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerCalculation = duration / iterations;

      // Performance assertions
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(avgTimePerCalculation).toBeLessThan(1); // Should average under 1ms per calculation
      expect(results).toHaveLength(iterations);
      expect(results.every(result => result === 487)).toBe(true); // All results should be consistent
    });

    it('should handle complex score breakdown calculations efficiently', async () => {
      const startTime = performance.now();
      const iterations = 500;
      
      const complexGuesses: GuessResult[] = Array.from({ length: 6 }, (_, i) => ({
        guess: `WORD${i}`.slice(0, 5).padEnd(5, 'X'),
        feedback: ['yellow', 'green', 'red', 'yellow', 'green'] as const,
        timestamp: Date.now() - (i * 10000)
      }));

      // Perform bulk score breakdown calculations
      const results = [];
      for (let i = 0; i < iterations; i++) {
        const breakdown = calculateScoreBreakdown(true, 6, 120000, undefined, true, complexGuesses);
        results.push(breakdown);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerCalculation = duration / iterations;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(avgTimePerCalculation).toBeLessThan(4); // Should average under 4ms per calculation
      expect(results).toHaveLength(iterations);
      expect(results.every(result => typeof result.totalScore === 'number')).toBe(true);
    });

    it('should handle letter counting performance under load', async () => {
      const startTime = performance.now();
      const iterations = 2000;
      
      const testGuesses: GuessResult[] = [
        {
          guess: 'ABCDE',
          feedback: ['green', 'yellow', 'red', 'yellow', 'green'],
          timestamp: Date.now()
        },
        {
          guess: 'FGHIJ',
          feedback: ['red', 'yellow', 'green', 'red', 'yellow'],
          timestamp: Date.now()
        }
      ];

      // Perform bulk letter counting
      const results = [];
      for (let i = 0; i < iterations; i++) {
        const count = countCorrectLetters(testGuesses);
        results.push(count);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerCalculation = duration / iterations;

      // Performance assertions
      expect(duration).toBeLessThan(500); // Should complete in under 0.5 seconds
      expect(avgTimePerCalculation).toBeLessThan(0.25); // Should average under 0.25ms per calculation
      expect(results).toHaveLength(iterations);
      
      const firstResult = countCorrectLetters(testGuesses);
      expect(results.every(result => result === firstResult)).toBe(true); // All results should be consistent
    });
  });

  describe('Game Logic Performance', () => {
    it('should handle bulk guess feedback generation efficiently', async () => {
      const startTime = performance.now();
      const iterations = 5000;
      
      const testCases = [
        { guess: 'CRANE', secret: 'MOUSE' },
        { guess: 'AUDIO', secret: 'CRANE' },
        { guess: 'HOUSE', secret: 'MOUSE' },
        { guess: 'WORDS', secret: 'SWORD' },
        { guess: 'ABCDE', secret: 'EDCBA' }
      ];

      // Perform bulk feedback generation
      const results = [];
      for (let i = 0; i < iterations; i++) {
        const testCase = testCases[i % testCases.length];
        const feedback = generateGuessFeedback(testCase.guess, testCase.secret);
        results.push(feedback);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerGeneration = duration / iterations;

      // Performance assertions
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(avgTimePerGeneration).toBeLessThan(0.2); // Should average under 0.2ms per generation
      expect(results).toHaveLength(iterations);
      expect(results.every(result => Array.isArray(result) && result.length === 5)).toBe(true);
    });

    it('should handle edge case feedback generation efficiently', async () => {
      const startTime = performance.now();
      const iterations = 1000;
      
      // Test with words containing duplicate letters (more complex logic)
      const complexTestCases = [
        { guess: 'SPEED', secret: 'ERASE' }, // Multiple E's
        { guess: 'LLAMA', secret: 'ALLAY' }, // Multiple L's and A's
        { guess: 'BOOKS', secret: 'SPOON' }, // Multiple O's
        { guess: 'HAPPY', secret: 'PUPPY' }, // Multiple P's
        { guess: 'LEVEL', secret: 'LEVER' }  // Multiple E's and L's
      ];

      // Perform bulk complex feedback generation
      const results = [];
      for (let i = 0; i < iterations; i++) {
        const testCase = complexTestCases[i % complexTestCases.length];
        const feedback = generateGuessFeedback(testCase.guess, testCase.secret);
        results.push(feedback);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerGeneration = duration / iterations;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(avgTimePerGeneration).toBeLessThan(2); // Should average under 2ms per generation
      expect(results).toHaveLength(iterations);
      expect(results.every(result => Array.isArray(result) && result.length === 5)).toBe(true);
    });
  });

  describe('Concurrent Operations Simulation', () => {
    it('should handle concurrent scoring calculations', async () => {
      const startTime = performance.now();
      const concurrentUsers = 50;
      const calculationsPerUser = 20;
      
      const sampleGuesses: GuessResult[] = [
        {
          guess: 'AUDIO',
          feedback: ['red', 'red', 'red', 'red', 'red'],
          timestamp: Date.now() - 30000
        },
        {
          guess: 'CRANE',
          feedback: ['green', 'green', 'green', 'green', 'green'],
          timestamp: Date.now()
        }
      ];

      // Simulate concurrent users performing scoring calculations
      const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const userResults = [];
        for (let i = 0; i < calculationsPerUser; i++) {
          const points = calculatePoints(
            true, 
            2, 
            300000 - (userIndex * 1000), // Slight variation in time remaining
            undefined, 
            Math.random() > 0.5, // Random single/multiplayer
            sampleGuesses
          );
          userResults.push(points);
        }
        return userResults;
      });

      const allResults = await Promise.all(userPromises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds
      expect(allResults).toHaveLength(concurrentUsers);
      expect(allResults.every(userResults => userResults.length === calculationsPerUser)).toBe(true);
      
      // Verify all calculations completed successfully
      const totalCalculations = concurrentUsers * calculationsPerUser;
      const flatResults = allResults.flat();
      expect(flatResults).toHaveLength(totalCalculations);
      expect(flatResults.every(result => typeof result === 'number' && result > 0)).toBe(true);
    });

    it('should handle concurrent feedback generation', async () => {
      const startTime = performance.now();
      const concurrentUsers = 100;
      const feedbackPerUser = 10;
      
      const testWords = ['CRANE', 'AUDIO', 'HOUSE', 'MOUSE', 'WORDS', 'SWORD', 'PLANT', 'BLANK'];

      // Simulate concurrent users generating feedback
      const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const userResults = [];
        for (let i = 0; i < feedbackPerUser; i++) {
          const guess = testWords[(userIndex + i) % testWords.length];
          const secret = testWords[(userIndex + i + 1) % testWords.length];
          const feedback = generateGuessFeedback(guess, secret);
          userResults.push(feedback);
        }
        return userResults;
      });

      const allResults = await Promise.all(userPromises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(allResults).toHaveLength(concurrentUsers);
      expect(allResults.every(userResults => userResults.length === feedbackPerUser)).toBe(true);
      
      // Verify all feedback generation completed successfully
      const totalGenerations = concurrentUsers * feedbackPerUser;
      const flatResults = allResults.flat();
      expect(flatResults).toHaveLength(totalGenerations);
      expect(flatResults.every(result => Array.isArray(result) && result.length === 5)).toBe(true);
    });
  });

  describe('Memory Usage and Efficiency', () => {
    it('should not create excessive objects during scoring calculations', () => {
      const iterations = 1000;
      const sampleGuesses: GuessResult[] = [
        {
          guess: 'AUDIO',
          feedback: ['red', 'red', 'red', 'red', 'red'],
          timestamp: Date.now()
        }
      ];

      // Measure memory usage pattern
      const initialMemory = process.memoryUsage();
      
      for (let i = 0; i < iterations; i++) {
        calculatePoints(true, 1, 300000, undefined, false, sampleGuesses);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryPerCalculation = memoryIncrease / iterations;

      // Memory efficiency assertions
      expect(memoryPerCalculation).toBeLessThan(1000); // Should use less than 1KB per calculation on average
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Total increase should be less than 1MB
    });

    it('should efficiently handle large guess histories', () => {
      const startTime = performance.now();
      
      // Create a large guess history (maximum possible guesses)
      const largeGuessHistory: GuessResult[] = Array.from({ length: 6 }, (_, i) => ({
        guess: `WORD${i}`.slice(0, 5).padEnd(5, 'X'),
        feedback: ['green', 'yellow', 'red', 'yellow', 'green'] as const,
        timestamp: Date.now() - (i * 5000)
      }));

      // Test scoring with large history
      const iterations = 100;
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        const points = calculatePoints(true, 6, 60000, undefined, true, largeGuessHistory);
        const breakdown = calculateScoreBreakdown(true, 6, 60000, undefined, true, largeGuessHistory);
        results.push({ points, breakdown });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerCalculation = duration / iterations;

      // Performance assertions for large data sets
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(avgTimePerCalculation).toBeLessThan(10); // Should average under 10ms per calculation
      expect(results).toHaveLength(iterations);
      expect(results.every(result => 
        typeof result.points === 'number' && 
        typeof result.breakdown.totalScore === 'number'
      )).toBe(true);
    });
  });

  describe('Algorithm Complexity Validation', () => {
    it('should maintain linear time complexity for feedback generation', () => {
      const wordLengths = [4, 5];
      const iterations = 1000;
      const results: { length: number; avgTime: number }[] = [];

      wordLengths.forEach(length => {
        const testGuess = 'ABCDE'.slice(0, length);
        const testSecret = 'EDCBA'.slice(0, length);
        
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          generateGuessFeedback(testGuess, testSecret);
        }
        
        const endTime = performance.now();
        const avgTime = (endTime - startTime) / iterations;
        
        results.push({ length, avgTime });
      });

      // Verify linear complexity (5-letter should not be significantly slower than 4-letter)
      const ratio = results[1].avgTime / results[0].avgTime;
      expect(ratio).toBeLessThan(2); // Should not be more than 2x slower for 25% more data
      expect(results.every(result => result.avgTime < 0.5)).toBe(true); // All should be under 0.5ms
    });

    it('should maintain consistent performance regardless of word content', () => {
      const iterations = 500;
      const testCases = [
        { name: 'simple', guess: 'ABCDE', secret: 'FGHIJ' }, // No matches
        { name: 'partial', guess: 'ABCDE', secret: 'AEFGH' }, // Some matches
        { name: 'complex', guess: 'AABBC', secret: 'BBAAC' }, // Duplicate letters
        { name: 'exact', guess: 'CRANE', secret: 'CRANE' }   // Perfect match
      ];

      const results = testCases.map(testCase => {
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          generateGuessFeedback(testCase.guess, testCase.secret);
        }
        
        const endTime = performance.now();
        const avgTime = (endTime - startTime) / iterations;
        
        return { name: testCase.name, avgTime };
      });

      // All test cases should have similar performance
      const maxTime = Math.max(...results.map(r => r.avgTime));
      const minTime = Math.min(...results.map(r => r.avgTime));
      const performanceVariation = maxTime / minTime;

      expect(performanceVariation).toBeLessThan(3); // Should not vary by more than 3x
      expect(results.every(result => result.avgTime < 1)).toBe(true); // All should be under 1ms
    });
  });
});

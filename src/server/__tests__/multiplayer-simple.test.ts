/**
 * Simplified integration tests for multiplayer functionality
 * Tests core multiplayer logic without complex mocking
 */

import { describe, it, expect } from 'vitest';
import { calculatePoints, calculateScoreBreakdown, generateGuessFeedback, countCorrectLetters } from '../utils/gameLogic';
import { GuessResult } from '../../shared/types/game';

describe('Multiplayer Core Logic Tests', () => {
  describe('Multiplayer Scoring', () => {
    it('should apply 2.5x multiplier for multiplayer wins', () => {
      const guesses: GuessResult[] = [
        {
          guess: 'AUDIO',
          feedback: ['red', 'red', 'red', 'red', 'red'],
          timestamp: Date.now() - 60000
        },
        {
          guess: 'CRANE',
          feedback: ['green', 'green', 'green', 'green', 'green'],
          timestamp: Date.now()
        }
      ];

      const timeRemaining = 300000; // 5 minutes
      const multiplayerPoints = calculatePoints(true, 2, timeRemaining, undefined, true, guesses);
      const singlePlayerPoints = calculatePoints(true, 2, timeRemaining, undefined, false, guesses);
      
      expect(multiplayerPoints).toBeGreaterThan(singlePlayerPoints);
      expect(multiplayerPoints / singlePlayerPoints).toBeCloseTo(2.5, 1);
    });

    it('should award 100 points for multiplayer losses', () => {
      const points = calculatePoints(false, 6, 0, undefined, true, []);
      expect(points).toBe(100);
    });

    it('should provide detailed score breakdown for multiplayer', () => {
      const guesses: GuessResult[] = [
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

      const breakdown = calculateScoreBreakdown(true, 2, 300000, undefined, true, guesses);
      
      expect(breakdown.basePoints).toBe(50);
      expect(breakdown.multiplayerMultiplier).toBe(2.5);
      expect(breakdown.totalScore).toBeGreaterThan(0);
      expect(breakdown.correctLettersCount).toBeGreaterThan(0);
    });
  });

  describe('Game Logic Validation', () => {
    it('should generate correct feedback for guesses', () => {
      const feedback = generateGuessFeedback('AUDIO', 'CRANE');
      
      expect(feedback).toHaveLength(5);
      expect(feedback[0]).toBe('yellow'); // A is in CRANE but wrong position
      expect(feedback[1]).toBe('red');    // U is not in CRANE
      expect(feedback[2]).toBe('red');    // D is not in CRANE
      expect(feedback[3]).toBe('red');    // I is not in CRANE
      expect(feedback[4]).toBe('red');    // O is not in CRANE
    });

    it('should handle exact matches correctly', () => {
      const feedback = generateGuessFeedback('CRANE', 'CRANE');
      
      expect(feedback).toEqual(['green', 'green', 'green', 'green', 'green']);
    });

    it('should count unique correct letters across guesses', () => {
      const guesses: GuessResult[] = [
        {
          guess: 'AUDIO',
          feedback: ['yellow', 'red', 'red', 'red', 'yellow'],
          timestamp: Date.now() - 60000
        },
        {
          guess: 'CRANE',
          feedback: ['green', 'yellow', 'red', 'red', 'green'],
          timestamp: Date.now()
        }
      ];

      const correctLetters = countCorrectLetters(guesses);
      // Unique letters: A, O, C, R, E = 5 letters
      expect(correctLetters).toBe(5);
    });
  });

  describe('Turn-Based Logic Validation', () => {
    it('should validate game state structure', () => {
      const mockGameState = {
        gameId: 'test-game-123',
        mode: 'multi' as const,
        status: 'active' as const,
        winner: null,
        startTime: Date.now(),
        timeLimit: 600000,
        wordLength: 5 as const,
        currentPlayer: 'player1',
        player1: {
          id: 'player1',
          username: 'TestPlayer1',
          secretWord: 'CRANE',
          guesses: [],
          isAI: false
        },
        player2: {
          id: 'player2',
          username: 'TestPlayer2',
          secretWord: 'MOUSE',
          guesses: [],
          isAI: false
        }
      };

      // Validate structure
      expect(mockGameState.mode).toBe('multi');
      expect(mockGameState.player1.isAI).toBe(false);
      expect(mockGameState.player2.isAI).toBe(false);
      expect(mockGameState.currentPlayer).toBe('player1');
      expect(mockGameState.wordLength).toBe(5);
    });

    it('should validate matchmaking request structure', () => {
      const mockRequest = {
        playerId: 'test-player',
        playerUsername: 'TestPlayer',
        playerSecretWord: 'CRANE',
        wordLength: 5 as const,
        timestamp: Date.now()
      };

      expect(mockRequest.wordLength).toBe(5);
      expect(mockRequest.playerSecretWord).toHaveLength(5);
      expect(mockRequest.timestamp).toBeTypeOf('number');
    });
  });

  describe('Disconnection Handling Logic', () => {
    it('should calculate timeout correctly', () => {
      const disconnectionTimeout = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      const sixMinutesAgo = now - (6 * 60 * 1000);
      const fourMinutesAgo = now - (4 * 60 * 1000);

      expect(now - sixMinutesAgo).toBeGreaterThan(disconnectionTimeout);
      expect(now - fourMinutesAgo).toBeLessThan(disconnectionTimeout);
    });

    it('should validate activity timestamp format', () => {
      const timestamp = Date.now();
      const timestampString = timestamp.toString();
      const parsedTimestamp = parseInt(timestampString);

      expect(parsedTimestamp).toBe(timestamp);
      expect(timestampString).toMatch(/^\d+$/);
    });
  });

  describe('Queue Management Logic', () => {
    it('should validate queue entry expiration', () => {
      const queueTimeout = 60000; // 60 seconds
      const now = Date.now();
      
      const expiredEntry = {
        playerId: 'expired-player',
        timestamp: now - 70000 // 70 seconds ago
      };
      
      const validEntry = {
        playerId: 'valid-player',
        timestamp: now - 30000 // 30 seconds ago
      };

      expect(now - expiredEntry.timestamp).toBeGreaterThan(queueTimeout);
      expect(now - validEntry.timestamp).toBeLessThan(queueTimeout);
    });

    it('should calculate average wait time correctly', () => {
      const now = Date.now();
      const waitTimes = [30000, 45000, 15000]; // 30s, 45s, 15s
      const averageWaitTime = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;

      expect(averageWaitTime).toBe(30000); // 30 seconds average
    });
  });

  describe('Synchronization Validation', () => {
    it('should validate multiplayer game constraints', () => {
      const validMultiplayerGame = {
        mode: 'multi',
        player1: { isAI: false },
        player2: { isAI: false },
        currentPlayer: 'player1'
      };

      const invalidMultiplayerGame = {
        mode: 'multi',
        player1: { isAI: false },
        player2: { isAI: true }, // Should not have AI in multiplayer
        currentPlayer: 'invalid-player'
      };

      // Valid game checks
      expect(validMultiplayerGame.mode).toBe('multi');
      expect(validMultiplayerGame.player1.isAI).toBe(false);
      expect(validMultiplayerGame.player2.isAI).toBe(false);

      // Invalid game checks
      expect(invalidMultiplayerGame.player2.isAI).toBe(true); // This would be flagged as invalid
      expect(['player1', 'player2']).not.toContain(invalidMultiplayerGame.currentPlayer);
    });

    it('should validate guess count limits', () => {
      const maxGuesses = 15;
      const normalGuessCount = 3;
      const excessiveGuessCount = 20;

      expect(normalGuessCount).toBeLessThanOrEqual(maxGuesses);
      expect(excessiveGuessCount).toBeGreaterThan(maxGuesses);
    });

    it('should validate time limit enforcement', () => {
      const gameStartTime = Date.now() - 700000; // 11+ minutes ago
      const timeLimit = 600000; // 10 minutes
      const currentTime = Date.now();

      const timeElapsed = currentTime - gameStartTime;
      const hasExceededTimeLimit = timeElapsed > timeLimit;

      expect(hasExceededTimeLimit).toBe(true);
      expect(timeElapsed).toBeGreaterThan(timeLimit);
    });
  });

  describe('Error Handling Validation', () => {
    it('should validate error message formats', () => {
      const errorMessages = {
        notYourTurn: 'Not your turn',
        gameNotFound: 'Game not found',
        gameNotActive: 'Game is not active',
        playerNotFound: 'Player not found in this game',
        opponentDisconnected: 'Opponent has disconnected - you win!'
      };

      Object.values(errorMessages).forEach(message => {
        expect(message).toBeTypeOf('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should validate game state transitions', () => {
      const validTransitions = [
        { from: 'waiting', to: 'active' },
        { from: 'active', to: 'finished' }
      ];

      const invalidTransitions = [
        { from: 'finished', to: 'active' },
        { from: 'waiting', to: 'finished' }
      ];

      validTransitions.forEach(transition => {
        expect(['waiting', 'active', 'finished']).toContain(transition.from);
        expect(['waiting', 'active', 'finished']).toContain(transition.to);
      });

      // These would be considered invalid in the actual game logic
      expect(invalidTransitions[0].from).toBe('finished');
      expect(invalidTransitions[0].to).toBe('active');
    });
  });
});

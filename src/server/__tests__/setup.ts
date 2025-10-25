/**
 * Test setup file for Vitest
 * Configures global test environment and mocks
 */

import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Date.now for consistent timestamps in tests
const mockDateNow = vi.fn(() => 1640995200000); // Fixed timestamp: 2022-01-01T00:00:00.000Z
vi.stubGlobal('Date', {
  ...Date,
  now: mockDateNow,
});

// Reset Date.now mock before each test
beforeEach(() => {
  mockDateNow.mockReturnValue(1640995200000);
});

// Global test utilities
global.createMockGameState = (overrides = {}) => ({
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
    isAI: false,
  },
  player2: {
    id: 'player2',
    username: 'TestPlayer2',
    secretWord: 'MOUSE',
    guesses: [],
    isAI: false,
  },
  ...overrides,
});

global.createMockMatchmakingRequest = (overrides = {}) => ({
  playerId: 'test-player',
  playerUsername: 'TestPlayer',
  playerSecretWord: 'CRANE',
  wordLength: 5 as const,
  timestamp: Date.now(),
  ...overrides,
});

// Extend global types
declare global {
  function createMockGameState(overrides?: any): any;
  function createMockMatchmakingRequest(overrides?: any): any;
}

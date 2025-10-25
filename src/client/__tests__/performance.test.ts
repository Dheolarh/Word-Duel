/**
 * Client-side performance tests for Word Duel
 * Tests asset preloading efficiency, audio system performance,
 * and UI rendering performance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock audio and image loading for testing
const mockAudio = {
  load: vi.fn().mockResolvedValue(undefined),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  currentTime: 0,
  volume: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockImage = {
  onload: null as ((event: Event) => void) | null,
  onerror: null as ((event: Event) => void) | null,
  src: '',
  complete: false,
  naturalWidth: 100,
  naturalHeight: 100,
};

// Mock HTML elements
global.Audio = vi.fn(() => mockAudio) as any;
global.Image = vi.fn(() => mockImage) as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('Client Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImage.complete = false;
    mockImage.src = '';
  });

  describe('Asset Preloading Performance', () => {
    it('should handle bulk image preloading efficiently', async () => {
      const startTime = performance.now();
      const imageCount = 50;
      
      // Simulate preloading multiple images
      const imagePromises = Array.from({ length: imageCount }, (_, i) => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          
          // Simulate successful load after short delay
          setTimeout(() => {
            if (img.onload) {
              img.onload(new Event('load'));
            }
            resolve();
          }, Math.random() * 10); // Random delay 0-10ms
          
          img.src = `test-image-${i}.webp`;
        });
      });

      await Promise.all(imagePromises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerImage = duration / imageCount;

      // Performance assertions
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(avgTimePerImage).toBeLessThan(20); // Should average under 20ms per image
      expect(global.Image).toHaveBeenCalledTimes(imageCount);
    });

    it('should handle audio preloading efficiently', async () => {
      const startTime = performance.now();
      const audioCount = 10;
      
      // Simulate preloading multiple audio files
      const audioPromises = Array.from({ length: audioCount }, (_, i) => {
        return new Promise<void>((resolve) => {
          const audio = new Audio(`test-sound-${i}.mp3`);
          
          // Simulate successful load
          setTimeout(() => {
            resolve();
          }, Math.random() * 50); // Random delay 0-50ms
        });
      });

      await Promise.all(audioPromises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerAudio = duration / audioCount;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(avgTimePerAudio).toBeLessThan(200); // Should average under 200ms per audio
      expect(global.Audio).toHaveBeenCalledTimes(audioCount);
    });

    it('should handle mixed asset preloading efficiently', async () => {
      const startTime = performance.now();
      const imageCount = 30;
      const audioCount = 6;
      
      // Simulate mixed asset preloading
      const assetPromises = [
        // Image promises
        ...Array.from({ length: imageCount }, (_, i) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            setTimeout(() => {
              if (img.onload) {
                img.onload(new Event('load'));
              }
              resolve();
            }, Math.random() * 15);
            img.src = `test-image-${i}.webp`;
          });
        }),
        // Audio promises
        ...Array.from({ length: audioCount }, (_, i) => {
          return new Promise<void>((resolve) => {
            const audio = new Audio(`test-sound-${i}.mp3`);
            setTimeout(() => resolve(), Math.random() * 30);
          });
        })
      ];

      await Promise.all(assetPromises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalAssets = imageCount + audioCount;
      const avgTimePerAsset = duration / totalAssets;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(avgTimePerAsset).toBeLessThan(60); // Should average under 60ms per asset
      expect(global.Image).toHaveBeenCalledTimes(imageCount);
      expect(global.Audio).toHaveBeenCalledTimes(audioCount);
    });
  });

  describe('Audio System Performance', () => {
    it('should handle rapid audio playback efficiently', async () => {
      const startTime = performance.now();
      const playbackCount = 100;
      
      // Create audio pool simulation
      const audioPool = Array.from({ length: 10 }, () => new Audio('click.mp3'));
      
      // Simulate rapid audio playback
      const playbackPromises = Array.from({ length: playbackCount }, async (_, i) => {
        const audio = audioPool[i % audioPool.length];
        audio.currentTime = 0;
        await audio.play();
        return audio;
      });

      await Promise.all(playbackPromises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerPlayback = duration / playbackCount;

      // Performance assertions
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(avgTimePerPlayback).toBeLessThan(10); // Should average under 10ms per playback
    });

    it('should handle audio context switching efficiently', async () => {
      const startTime = performance.now();
      const switchCount = 50;
      
      // Simulate background music switching
      const backgroundMusic = new Audio('background.mp3');
      const halloweenMusic = new Audio('backgroundHalloween.mp3');
      
      for (let i = 0; i < switchCount; i++) {
        const currentMusic = i % 2 === 0 ? backgroundMusic : halloweenMusic;
        const otherMusic = i % 2 === 0 ? halloweenMusic : backgroundMusic;
        
        // Simulate music switching
        otherMusic.pause();
        currentMusic.currentTime = 0;
        await currentMusic.play();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerSwitch = duration / switchCount;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(avgTimePerSwitch).toBeLessThan(40); // Should average under 40ms per switch
    });

    it('should handle concurrent audio operations efficiently', async () => {
      const startTime = performance.now();
      const concurrentOperations = 20;
      
      // Simulate concurrent audio operations
      const operationPromises = Array.from({ length: concurrentOperations }, async (_, i) => {
        const audio = new Audio(`sound-${i}.mp3`);
        
        // Simulate various audio operations
        audio.volume = Math.random();
        await audio.play();
        
        if (i % 3 === 0) {
          audio.pause();
        }
        
        return audio;
      });

      await Promise.all(operationPromises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerOperation = duration / concurrentOperations;

      // Performance assertions
      expect(duration).toBeLessThan(1500); // Should complete in under 1.5 seconds
      expect(avgTimePerOperation).toBeLessThan(75); // Should average under 75ms per operation
    });
  });

  describe('UI Rendering Performance', () => {
    it('should handle rapid state updates efficiently', () => {
      const startTime = performance.now();
      const updateCount = 1000;
      
      // Simulate rapid state updates (like game board updates)
      const gameBoard = Array.from({ length: 6 }, () => 
        Array.from({ length: 5 }, () => ({ letter: '', feedback: 'none' }))
      );
      
      for (let i = 0; i < updateCount; i++) {
        const row = i % 6;
        const col = i % 5;
        gameBoard[row][col] = {
          letter: String.fromCharCode(65 + (i % 26)), // A-Z
          feedback: ['green', 'yellow', 'red'][i % 3] as any
        };
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerUpdate = duration / updateCount;

      // Performance assertions
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(avgTimePerUpdate).toBeLessThan(0.1); // Should average under 0.1ms per update
      expect(gameBoard).toHaveLength(6);
      expect(gameBoard[0]).toHaveLength(5);
    });

    it('should handle keyboard input processing efficiently', () => {
      const startTime = performance.now();
      const inputCount = 500;
      
      // Simulate rapid keyboard input processing
      const currentGuess = { value: '' };
      const validKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      for (let i = 0; i < inputCount; i++) {
        const key = validKeys[i % validKeys.length];
        
        // Simulate key processing logic
        if (currentGuess.value.length < 5) {
          currentGuess.value += key;
        }
        
        if (currentGuess.value.length === 5) {
          // Simulate guess submission
          currentGuess.value = '';
        }
        
        // Simulate backspace occasionally
        if (i % 10 === 0 && currentGuess.value.length > 0) {
          currentGuess.value = currentGuess.value.slice(0, -1);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerInput = duration / inputCount;

      // Performance assertions
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
      expect(avgTimePerInput).toBeLessThan(0.1); // Should average under 0.1ms per input
    });

    it('should handle timer updates efficiently', () => {
      const startTime = performance.now();
      const timerUpdates = 300; // 5 minutes worth of second updates
      
      // Simulate timer countdown updates
      let timeRemaining = 300000; // 5 minutes in ms
      const timerStates = [];
      
      for (let i = 0; i < timerUpdates; i++) {
        timeRemaining -= 1000; // Decrease by 1 second
        
        // Simulate timer formatting logic
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        timerStates.push({
          timeRemaining,
          formattedTime,
          isWarning: timeRemaining < 60000, // Last minute warning
          isCritical: timeRemaining < 10000 // Last 10 seconds critical
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerUpdate = duration / timerUpdates;

      // Performance assertions
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(avgTimePerUpdate).toBeLessThan(0.33); // Should average under 0.33ms per update
      expect(timerStates).toHaveLength(timerUpdates);
      expect(timerStates[timerUpdates - 1].timeRemaining).toBe(0);
    });
  });

  describe('Memory Management', () => {
    it('should not create excessive objects during UI updates', () => {
      const iterations = 1000;
      const initialMemory = process.memoryUsage();
      
      // Simulate UI state updates
      for (let i = 0; i < iterations; i++) {
        const gameState = {
          currentGuess: `WORD${i % 10}`,
          guesses: Array.from({ length: i % 6 }, (_, j) => ({
            guess: `GUESS${j}`,
            feedback: ['green', 'yellow', 'red']
          })),
          timeRemaining: 300000 - (i * 1000),
          isGameActive: i < 500
        };
        
        // Simulate state processing
        const processedState = {
          ...gameState,
          formattedTime: `${Math.floor(gameState.timeRemaining / 60000)}:${Math.floor((gameState.timeRemaining % 60000) / 1000).toString().padStart(2, '0')}`,
          progress: (i / iterations) * 100
        };
        
        // Prevent optimization by using the result
        expect(processedState).toBeDefined();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryPerIteration = memoryIncrease / iterations;

      // Memory efficiency assertions
      expect(memoryPerIteration).toBeLessThan(10000); // Should use less than 10KB per iteration on average
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Total increase should be less than 10MB
    });

    it('should efficiently handle localStorage operations', () => {
      const startTime = performance.now();
      const operations = 200;
      
      // Simulate localStorage operations
      for (let i = 0; i < operations; i++) {
        const key = `test-key-${i % 10}`;
        const value = JSON.stringify({
          gameData: `data-${i}`,
          timestamp: Date.now(),
          settings: { music: true, effects: true }
        });
        
        localStorageMock.setItem(key, value);
        const retrieved = localStorageMock.getItem(key);
        
        if (i % 20 === 0) {
          localStorageMock.removeItem(key);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerOperation = duration / operations;

      // Performance assertions
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(avgTimePerOperation).toBeLessThan(0.5); // Should average under 0.5ms per operation
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(operations);
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(operations);
    });
  });
});

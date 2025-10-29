/**
 * Multiplayer matchmaking system for Word Duel
 * Handles player queues, matching, and game creation
 */

import { redis } from '@devvit/web/server';
import { GameState } from '../../shared/types/game';
import { createGameState, createPlayerState, generateGameId } from './gameUtils';

export interface MatchmakingRequest {
  playerId: string;
  playerUsername: string;
  playerSecretWord: string;
  wordLength: 4 | 5;
  timestamp: number;
}

export interface MatchResult {
  gameId: string;
  gameState: GameState;
  matched: boolean;
}

/**
 * Matchmaking manager class
 */
export class MatchmakingManager {
  private static readonly QUEUE_TIMEOUT = 60000; // 60 seconds timeout

  /**
   * Add player to matchmaking queue
   */
  static async joinQueue(request: MatchmakingRequest): Promise<MatchResult> {
    const queueKey = `queue:${request.wordLength}letter`;
    
    // Clean up expired entries first
    await this.cleanupExpiredEntries(queueKey);
    
    // Validate that the current player is not already in a game
    const existingGameId = await this.getPlayerGame(request.playerId);
    if (existingGameId) {
      // Player is already in a game, remove the mapping and continue
      await this.removePlayerGame(request.playerId);
    }
    
    // Try to find an existing player in the queue
    const waitingPlayer = await this.findMatch(queueKey, request);
    
    if (waitingPlayer) {
      // Validate that the waiting player is still valid (not in another game)
      const waitingPlayerGameId = await this.getPlayerGame(waitingPlayer.playerId);
      if (waitingPlayerGameId) {
        // Waiting player is already in a game, remove them from queue and try again
        await this.removeFromQueue(queueKey, waitingPlayer.playerId);
        await this.removePlayerGame(waitingPlayer.playerId);
        
        // Try to find another match
        const anotherWaitingPlayer = await this.findMatch(queueKey, request);
        if (!anotherWaitingPlayer) {
          // No other valid players, add current player to queue
          await this.addToQueue(queueKey, request);
          return {
            gameId: '',
            gameState: {} as GameState,
            matched: false
          };
        }
        
        // Use the new waiting player
        const gameId = generateGameId();
        const gameState = await this.createMultiplayerGame(
          gameId,
          anotherWaitingPlayer,
          request
        );
        
        return {
          gameId,
          gameState,
          matched: true
        };
      }
      
      // Create multiplayer game with both players
      const gameId = generateGameId();
      const gameState = await this.createMultiplayerGame(
        gameId,
        waitingPlayer,
        request
      );
      
      return {
        gameId,
        gameState,
        matched: true
      };
    } else {
      // Add current player to queue
      await this.addToQueue(queueKey, request);
      
      return {
        gameId: '',
        gameState: {} as GameState,
        matched: false
      };
    }
  }

  /**
   * Remove player from matchmaking queue
   */
  static async leaveQueue(playerId: string, wordLength: 4 | 5): Promise<void> {
    const queueKey = `queue:${wordLength}letter`;
    await this.removeFromQueue(queueKey, playerId);
  }

  /**
   * Check if player is still in queue
   */
  static async isPlayerInQueue(playerId: string, wordLength: 4 | 5): Promise<boolean> {
    const queueKey = `queue:${wordLength}letter`;
    const queueData = await redis.get(queueKey);
    
    if (!queueData) return false;
    
    const queue: MatchmakingRequest[] = JSON.parse(queueData);
    return queue.some(request => request.playerId === playerId);
  }

  /**
   * Get queue status for a word length
   */
  static async getQueueStatus(wordLength: 4 | 5): Promise<{
    playersWaiting: number;
    averageWaitTime: number;
  }> {
    const queueKey = `queue:${wordLength}letter`;
    await this.cleanupExpiredEntries(queueKey);
    
    const queueData = await redis.get(queueKey);
    const queue: MatchmakingRequest[] = queueData ? JSON.parse(queueData) : [];
    
    // Calculate average wait time
    const now = Date.now();
    const waitTimes = queue.map(request => now - request.timestamp);
    const averageWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
      : 0;
    
    return {
      playersWaiting: queue.length,
      averageWaitTime
    };
  }

  /**
   * Add player to queue
   */
  private static async addToQueue(queueKey: string, request: MatchmakingRequest): Promise<void> {
    const queueData = await redis.get(queueKey);
    const queue: MatchmakingRequest[] = queueData ? JSON.parse(queueData) : [];
    
    // Remove any existing entry for this player (prevent duplicates)
    const filteredQueue = queue.filter(req => req.playerId !== request.playerId);
    
    // Add new request
    filteredQueue.push(request);
    
    await redis.set(queueKey, JSON.stringify(filteredQueue));
  }

  /**
   * Find a match for the current player
   */
  private static async findMatch(queueKey: string, currentRequest: MatchmakingRequest): Promise<MatchmakingRequest | null> {
    const queueData = await redis.get(queueKey);
    if (!queueData) return null;
    
    const queue: MatchmakingRequest[] = JSON.parse(queueData);
    
    // Find the first waiting player (FIFO) that is NOT expired
    const now = Date.now();
    const waitingPlayer = queue.find(request => 
      request.playerId !== currentRequest.playerId &&
      (now - request.timestamp) < this.QUEUE_TIMEOUT
    );
    
    if (waitingPlayer) {
      // Remove the matched player from queue
      const updatedQueue = queue.filter(request => request.playerId !== waitingPlayer.playerId);
      await redis.set(queueKey, JSON.stringify(updatedQueue));
      
      return waitingPlayer;
    }
    
    return null;
  }

  /**
   * Remove player from queue
   */
  private static async removeFromQueue(queueKey: string, playerId: string): Promise<void> {
    const queueData = await redis.get(queueKey);
    if (!queueData) return;
    
    const queue: MatchmakingRequest[] = JSON.parse(queueData);
    const filteredQueue = queue.filter(request => request.playerId !== playerId);
    
    await redis.set(queueKey, JSON.stringify(filteredQueue));
  }

  /**
   * Clean up expired entries from queue
   */
  private static async cleanupExpiredEntries(queueKey: string): Promise<void> {
    const queueData = await redis.get(queueKey);
    if (!queueData) return;
    
    const queue: MatchmakingRequest[] = JSON.parse(queueData);
    const now = Date.now();
    
    // Remove entries older than timeout
    const activeQueue = queue.filter(request => 
      (now - request.timestamp) < this.QUEUE_TIMEOUT
    );
    
    if (activeQueue.length !== queue.length) {
      await redis.set(queueKey, JSON.stringify(activeQueue));
    }
  }

  /**
   * Create a multiplayer game with two players
   */
  private static async createMultiplayerGame(
    gameId: string,
    player1Request: MatchmakingRequest,
    player2Request: MatchmakingRequest
  ): Promise<GameState> {
    // Create player states
    const player1 = createPlayerState(
      player1Request.playerId,
      player1Request.playerUsername,
      player1Request.playerSecretWord,
      false // Not AI
    );
    
    const player2 = createPlayerState(
      player2Request.playerId,
      player2Request.playerUsername,
      player2Request.playerSecretWord,
      false // Not AI
    );
    
    // Set time limit for multiplayer (10 minutes)
    const timeLimit = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Create game state
    const gameState = createGameState(
      gameId,
      'multi',
      player1Request.wordLength,
      player1,
      player2,
      timeLimit
    );
    
    // Set game to active status
    gameState.status = 'active';
    
    // Save game state to Redis using the RedisDataAccess utility
    await redis.hSet(`game:${gameId}`, { data: JSON.stringify(gameState) });
    
    // Store player-to-game mappings for match detection with atomic operations
    const pipeline = [
      redis.set(`player_game:${player1Request.playerId}`, gameId),
      redis.expire(`player_game:${player1Request.playerId}`, 3600),
      redis.set(`player_game:${player2Request.playerId}`, gameId),
      redis.expire(`player_game:${player2Request.playerId}`, 3600),
      // Initialize player activity tracking for disconnection detection
      redis.set(`player_activity:${gameId}:${player1Request.playerId}`, Date.now().toString()),
      redis.expire(`player_activity:${gameId}:${player1Request.playerId}`, 3600),
      redis.set(`player_activity:${gameId}:${player2Request.playerId}`, Date.now().toString()),
      redis.expire(`player_activity:${gameId}:${player2Request.playerId}`, 3600)
    ];
    
    // Execute all operations
    await Promise.all(pipeline);
    
    return gameState;
  }

  /**
   * Get the game ID for a player (if they're in a game)
   */
  static async getPlayerGame(playerId: string): Promise<string | null> {
    const result = await redis.get(`player_game:${playerId}`);
    return result || null;
  }

  /**
   * Remove player-game mapping
   */
  static async removePlayerGame(playerId: string): Promise<void> {
    await redis.del(`player_game:${playerId}`);
  }

  /**
   * Get all active queues status
   */
  static async getAllQueuesStatus(): Promise<{
    fourLetter: { playersWaiting: number; averageWaitTime: number };
    fiveLetter: { playersWaiting: number; averageWaitTime: number };
  }> {
    const [fourLetterStatus, fiveLetterStatus] = await Promise.all([
      this.getQueueStatus(4),
      this.getQueueStatus(5)
    ]);
    
    return {
      fourLetter: fourLetterStatus,
      fiveLetter: fiveLetterStatus
    };
  }

  /**
   * Periodic cleanup of all queues (should be called periodically)
   */
  static async cleanupAllQueues(): Promise<void> {
    await Promise.all([
      this.cleanupExpiredEntries('queue:4letter'),
      this.cleanupExpiredEntries('queue:5letter')
    ]);
  }
}

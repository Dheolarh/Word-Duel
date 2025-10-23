import { redis } from '@devvit/web/server';
import { ApiResponse } from '../shared/types/api';
import { GameState, UserData } from '../shared/types/game';

// This file contains shared utilities and data access patterns
// The main server setup is in index.ts

// Response formatting helper
const formatResponse = <T>(data?: T, error?: string, code?: string, retryable = false): ApiResponse<T> => {
  if (error) {
    return {
      success: false,
      error,
      code: code as any,
      retryable
    };
  }
  
  return {
    success: true,
    ...(data !== undefined && { data })
  };
};

// Redis data access patterns
class RedisDataAccess {
  // Game state operations
  static async saveGameState(gameId: string, gameState: GameState): Promise<void> {
    await redis.hSet(`game:${gameId}`, { data: JSON.stringify(gameState) });
  }
  
  static async getGameState(gameId: string): Promise<GameState | null> {
    const data = await redis.hGet(`game:${gameId}`, 'data');
    return data ? JSON.parse(data) : null;
  }
  
  static async deleteGameState(gameId: string): Promise<void> {
    await redis.del(`game:${gameId}`);
  }
  
  // User data operations
  static async saveUserData(userId: string, userData: UserData): Promise<void> {
    await redis.hSet(`user:${userId}`, {
      username: userData.username,
      points: userData.points.toString(),
      coins: userData.coins.toString(),
      gamesPlayed: userData.gamesPlayed.toString(),
      gamesWon: userData.gamesWon.toString(),
      averageGuesses: userData.averageGuesses.toString()
    });
  }
  
  static async getUserData(userId: string): Promise<UserData | null> {
    const data = await redis.hMGet(`user:${userId}`, [
      'username', 'points', 'coins', 'gamesPlayed', 'gamesWon', 'averageGuesses'
    ]);
    
    if (!data[0]) return null;
    
    return {
      username: data[0] || '',
      points: parseInt(data[1] || '0'),
      coins: parseInt(data[2] || '0'),
      gamesPlayed: parseInt(data[3] || '0'),
      gamesWon: parseInt(data[4] || '0'),
      averageGuesses: parseFloat(data[5] || '0')
    };
  }
  
  // Matchmaking queue operations (using simple string storage since lists aren't fully supported)
  static async addToQueue(wordLength: 4 | 5, playerId: string): Promise<void> {
    const queueKey = `queue:${wordLength}letter`;
    const existingQueue = await redis.get(queueKey);
    const queue = existingQueue ? JSON.parse(existingQueue) : [];
    queue.push(playerId);
    await redis.set(queueKey, JSON.stringify(queue));
  }
  
  static async getFromQueue(wordLength: 4 | 5): Promise<string | null> {
    const queueKey = `queue:${wordLength}letter`;
    const existingQueue = await redis.get(queueKey);
    if (!existingQueue) return null;
    
    const queue = JSON.parse(existingQueue);
    if (queue.length === 0) return null;
    
    const playerId = queue.shift();
    await redis.set(queueKey, JSON.stringify(queue));
    return playerId;
  }
  
  // Leaderboard operations
  static async updateLeaderboard(userId: string, points: number): Promise<void> {
    await redis.zAdd('leaderboard', { member: userId, score: points });
  }
  
  static async getLeaderboard(limit = 10): Promise<Array<{ userId: string; points: number }>> {
    const results = await redis.zRange('leaderboard', 0, limit - 1, { by: 'rank' });
    
    return results.map((result, index) => ({
      userId: result.member,
      points: result.score,
      rank: index + 1
    })).reverse(); // Reverse to get highest scores first
  }
}

// Export utilities for use in other modules
export { RedisDataAccess, formatResponse };

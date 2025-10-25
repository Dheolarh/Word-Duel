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
      profilePicture: userData.profilePicture,
      points: userData.points.toString(),
      coins: userData.coins.toString(),
      gamesPlayed: userData.gamesPlayed.toString(),
      gamesWon: userData.gamesWon.toString(),
      isRedditProfile: userData.isRedditProfile ? 'true' : 'false'
    });
  }
  
  static async getUserData(userId: string): Promise<UserData | null> {
    const data = await redis.hMGet(`user:${userId}`, [
      'username', 'profilePicture', 'points', 'coins', 'gamesPlayed', 'gamesWon', 'isRedditProfile'
    ]);
    
    if (!data[0]) return null;
    
    return {
      username: data[0] || '',
      profilePicture: data[1] || '',
      points: parseInt(data[2] || '0'),
      coins: parseInt(data[3] || '0'),
      gamesPlayed: parseInt(data[4] || '0'),
      gamesWon: parseInt(data[5] || '0'),
      isRedditProfile: data[6] === 'true'
    };
  }

  // Initialize user data if it doesn't exist
  static async initializeUserData(userId: string, username: string, profilePicture?: string): Promise<UserData> {
    const existingData = await this.getUserData(userId);
    
    if (existingData) {
      // Update profile picture if a new one is provided (for Reddit profile updates)
      if (profilePicture && profilePicture !== existingData.profilePicture) {
        existingData.profilePicture = profilePicture;
        await this.saveUserData(userId, existingData);
      }
      return existingData;
    }
    
    // Generate a default profile picture URL if none provided
    const defaultProfilePicture = profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0YTliM2MiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiA1MmMwLTguODM3IDcuMTYzLTE2IDE2LTE2czE2IDcuMTYzIDE2IDE2djEySDEyVjUyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
    
    const newUserData: UserData = {
      username,
      profilePicture: defaultProfilePicture,
      points: 0,
      coins: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      isRedditProfile: !!profilePicture && !profilePicture.includes('data:image/svg+xml')
    };
    
    await this.saveUserData(userId, newUserData);
    return newUserData;
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
  
  static async getLeaderboard(limit = 10): Promise<Array<{ userId: string; points: number; rank: number }>> {
    // Get top scores in descending order (highest first)
    const results = await redis.zRange('leaderboard', 0, limit - 1, { 
      by: 'rank',
      reverse: true // This gets highest scores first
    });
    
    return results.map((result, index) => ({
      userId: result.member,
      points: result.score,
      rank: index + 1
    }));
  }

  static async getPlayerRank(userId: string): Promise<{ rank: number; points: number } | null> {
    try {
      // Get player's score
      const score = await redis.zScore('leaderboard', userId);
      if (score === null || score === undefined) return null;

      // Get player's rank (0-based, so add 1) - using zRank with reverse logic
      const rank = await redis.zRank('leaderboard', userId);
      if (rank === null || rank === undefined) return null;

      // Since we want reverse rank (highest score = rank 1), we need to get total count and calculate
      const totalPlayers = await redis.zCard('leaderboard');
      const reverseRank = totalPlayers - rank;

      return {
        rank: reverseRank,
        points: score
      };
    } catch (error) {
      console.error('Error getting player rank:', error);
      return null;
    }
  }
}

// Export utilities for use in other modules
export { RedisDataAccess, formatResponse };

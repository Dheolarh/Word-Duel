/**
 * Enhanced game state management for Word Duel
 * Handles game creation, updates, and state transitions
 */

import { GameState, PlayerState, GuessResult, ScoreBreakdown } from '../../shared/types/game';
import { RedisDataAccess } from '../main';
import { generateGameId, createPlayerState, createGameState, isGameEnded, determineWinner } from './gameUtils';
import { createGuessResult, calculatePoints, calculateCoins, calculateScoreBreakdown } from './gameLogic';
import { AIOpponentManager } from './aiOpponent';
import { getDefinition } from '../services/dictionaryApi';
import { redis } from '@devvit/web/server';

export class GameStateManager {
  /**
   * Create a new single player game
   */
  static async createSinglePlayerGame(
    playerId: string,
    playerUsername: string,
    playerSecretWord: string,
    wordLength: 4 | 5,
    difficulty: 'easy' | 'medium' | 'difficult'
  ): Promise<GameState> {
    const gameId = generateGameId();
    
    // Generate AI secret word using AI system with dictionary API
    const aiSecretWord = await AIOpponentManager.generateAISecretWord(wordLength, difficulty);
    
    // Set time limits based on difficulty
    const timeLimits = {
      easy: 10 * 60 * 1000,    // 10 minutes
      medium: 7 * 60 * 1000,   // 7 minutes
      difficult: 5 * 60 * 1000 // 5 minutes
    };
    
    const player1 = createPlayerState(playerId, playerUsername, playerSecretWord, false);
    const player2 = createPlayerState(`ai_${gameId}`, 'AI Opponent', aiSecretWord, true, difficulty);
    
    const gameState = createGameState(
      gameId,
      'single',
      wordLength,
      player1,
      player2,
      timeLimits[difficulty]
    );
    
    // Set game to active immediately for single player
    gameState.status = 'active';
    
    // Initialize AI strategy
    AIOpponentManager.createAIStrategy(gameId, difficulty);
    
    await RedisDataAccess.saveGameState(gameId, gameState);
    
    return gameState;
  }
  
  /**
   * Create a new multiplayer game
   */
  static async createMultiplayerGame(
    player1Id: string,
    player1Username: string,
    player1SecretWord: string,
    player2Id: string,
    player2Username: string,
    player2SecretWord: string,
    wordLength: 4 | 5
  ): Promise<GameState> {
    const gameId = generateGameId();
    
    const player1 = createPlayerState(player1Id, player1Username, player1SecretWord, false);
    const player2 = createPlayerState(player2Id, player2Username, player2SecretWord, false);
    
    const gameState = createGameState(
      gameId,
      'multi',
      wordLength,
      player1,
      player2,
      10 * 60 * 1000 // 10 minutes for multiplayer
    );
    
    // Set game to active immediately for multiplayer
    gameState.status = 'active';
    
    await RedisDataAccess.saveGameState(gameId, gameState);
    
    return gameState;
  }
  
  /**
   * Submit a guess for a player with enhanced multiplayer synchronization
   */
  static async submitGuess(
    gameId: string,
    playerId: string,
    guess: string
  ): Promise<{ gameState: GameState; guessResult: GuessResult; gameEnded: boolean }> {
    const gameState = await RedisDataAccess.getGameState(gameId);
    
    if (!gameState) {
      throw new Error('Game not found');
    }
    
    if (gameState.status !== 'active') {
      throw new Error('Game is not active');
    }
    
    // Check if game has already ended due to time
    if (isGameEnded(gameState)) {
      gameState.status = 'finished';
      gameState.winner = determineWinner(gameState);
      
      // Add definitions for both players' secret words
      gameState.player1.secretWordDefinition = getDefinition(gameState.player1.secretWord) || 'a word';
      gameState.player2.secretWordDefinition = getDefinition(gameState.player2.secretWord) || 'a word';
      
      await RedisDataAccess.saveGameState(gameId, gameState);
      throw new Error('Game has already ended');
    }
    
    // TURN-BASED: Check if it's this player's turn
    if (gameState.currentPlayer !== playerId) {
      throw new Error('Not your turn');
    }
    
    // Check for player disconnection in multiplayer games
    if (gameState.mode === 'multi') {
      const disconnectedPlayer = await this.checkPlayerDisconnection(gameState, playerId);
      if (disconnectedPlayer) {
        // Handle disconnection - award win to remaining player
        gameState.status = 'finished';
        gameState.winner = gameState.player1.id === playerId ? 'player1' : 'player2';
        
        // Add definitions for both players' secret words
        gameState.player1.secretWordDefinition = getDefinition(gameState.player1.secretWord) || 'a word';
        gameState.player2.secretWordDefinition = getDefinition(gameState.player2.secretWord) || 'a word';
        
        // Update statistics for disconnection scenario
        if (!gameState.statisticsUpdated) {
          await this.updateDisconnectionStatistics(gameState, disconnectedPlayer.id);
          gameState.statisticsUpdated = true;
        }
        
        await RedisDataAccess.saveGameState(gameId, gameState);
        throw new Error('Opponent has disconnected - you win!');
      }
    }
    
    // Determine which player is making the guess and get opponent's secret word
    let currentPlayer: PlayerState;
    let opponentPlayer: PlayerState;
    let opponentSecretWord: string;
    
    if (gameState.player1.id === playerId) {
      currentPlayer = gameState.player1;
      opponentPlayer = gameState.player2;
      opponentSecretWord = gameState.player2.secretWord;
    } else if (gameState.player2.id === playerId) {
      currentPlayer = gameState.player2;
      opponentPlayer = gameState.player1;
      opponentSecretWord = gameState.player1.secretWord;
    } else {
      throw new Error('Player not found in this game');
    }
    
    // Create guess result with feedback
    const guessResult = createGuessResult(guess, opponentSecretWord);
    
    // Add guess to player's guess history
    currentPlayer.guesses.push(guessResult);
    
    // Update player's last activity timestamp for disconnection detection
    if (gameState.mode === 'multi') {
      await this.updatePlayerActivity(gameId, playerId);
    }
    
    // TURN-BASED: Switch to opponent's turn after successful guess
    gameState.currentPlayer = opponentPlayer.id;
    
    // Check if game has ended
    const gameEnded = isGameEnded(gameState);
    
    if (gameEnded) {
      gameState.status = 'finished';
      gameState.winner = determineWinner(gameState);
      
      // Add definitions for both players' secret words
      gameState.player1.secretWordDefinition = getDefinition(gameState.player1.secretWord) || 'a word';
      gameState.player2.secretWordDefinition = getDefinition(gameState.player2.secretWord) || 'a word';
      
      // Update user statistics and points (only if not already updated)
      if (!gameState.statisticsUpdated) {
        await this.updateGameEndStatistics(gameState);
        gameState.statisticsUpdated = true;
      }
    }
    
    // Save updated game state with atomic operation for multiplayer synchronization
    await this.saveGameStateAtomic(gameId, gameState);
    
    return { gameState, guessResult, gameEnded };
  }
  
  /**
   * Get current game state with sanitized data for client
   */
  static async getGameStateForClient(gameId: string, playerId: string): Promise<GameState | null> {
    const gameState = await RedisDataAccess.getGameState(gameId);
    
    if (!gameState) {
      return null;
    }
    
    // Create a copy to avoid modifying the original
    const clientGameState = JSON.parse(JSON.stringify(gameState)) as GameState;
    
    // Hide opponent's secret word unless game is finished
    if (clientGameState.status !== 'finished') {
      if (clientGameState.player1.id !== playerId) {
        clientGameState.player1.secretWord = '';
      }
      if (clientGameState.player2.id !== playerId) {
        clientGameState.player2.secretWord = '';
      }
    }
    
    return clientGameState;
  }
  
  /**
   * Update user statistics when game ends
   */
  private static async updateGameEndStatistics(gameState: GameState): Promise<void> {
    const winner = gameState.winner;
    
    if (!winner || winner === 'draw') {
      // Handle draw or no winner case
      await this.updatePlayerStats(gameState.player1, false, gameState);
      await this.updatePlayerStats(gameState.player2, false, gameState);
      return;
    }
    
    const winningPlayer = winner === 'player1' ? gameState.player1 : gameState.player2;
    const losingPlayer = winner === 'player1' ? gameState.player2 : gameState.player1;
    
    // Update winner stats
    await this.updatePlayerStats(winningPlayer, true, gameState);
    
    // Update loser stats (only if not AI)
    if (!losingPlayer.isAI) {
      await this.updatePlayerStats(losingPlayer, false, gameState);
    }
  }
  
  /**
   * Update individual player statistics
   */
  private static async updatePlayerStats(
    player: PlayerState,
    won: boolean,
    gameState: GameState
  ): Promise<void> {
    if (player.isAI) return; // Don't update stats for AI players
    
    const userData = await RedisDataAccess.getUserData(player.id) || {
      username: player.username,
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.username)}`,
      points: 0,
      coins: 0,
      gamesPlayed: 0,
      gamesWon: 0
    };
    
    // Calculate time remaining
    const timeElapsed = Date.now() - gameState.startTime;
    const timeRemaining = Math.max(0, gameState.timeLimit - timeElapsed);
    
    // Determine if this is a multiplayer game
    const isMultiplayer = gameState.mode === 'multi';
    
    // Calculate points and coins using new comprehensive scoring system
    const points = calculatePoints(
      won, 
      player.guesses.length, 
      timeRemaining, 
      player.difficulty,
      isMultiplayer,
      player.guesses
    );
    const coins = calculateCoins(points);
    
    // Update statistics
    userData.gamesPlayed += 1;
    if (won) {
      userData.gamesWon += 1;
    }
    
    // Always add points (including loss points)
    userData.points += points;
    userData.coins += coins;
    
    // Save updated user data
    await RedisDataAccess.saveUserData(player.id, userData);
    
    // Update leaderboard
    await RedisDataAccess.updateLeaderboard(player.id, userData.points);
  }
  
  /**
   * Check if a game exists and is accessible by a player
   */
  static async validateGameAccess(gameId: string, playerId: string): Promise<boolean> {
    const gameState = await RedisDataAccess.getGameState(gameId);
    
    if (!gameState) {
      return false;
    }
    
    return gameState.player1.id === playerId || gameState.player2.id === playerId;
  }
  
  /**
   * Generate and submit AI guess
   */
  static async submitAIGuess(gameId: string): Promise<{ gameState: GameState; guessResult: GuessResult; gameEnded: boolean } | null> {
    const gameState = await RedisDataAccess.getGameState(gameId);
    
    if (!gameState) {
      console.warn(`AI guess attempted for non-existent game: ${gameId}`);
      return null;
    }
    
    if (gameState.status !== 'active') {
      console.warn(`AI guess attempted for inactive game: ${gameId}, status: ${gameState.status}`);
      return null;
    }
    
    // Find AI player
    let aiPlayer: PlayerState;
    let humanPlayer: PlayerState;
    
    if (gameState.player1.isAI) {
      aiPlayer = gameState.player1;
      humanPlayer = gameState.player2;
    } else if (gameState.player2.isAI) {
      aiPlayer = gameState.player2;
      humanPlayer = gameState.player1;
    } else {
      return null; // No AI player found
    }
    
    // TURN-BASED: Check if it's AI's turn
    if (gameState.currentPlayer !== aiPlayer.id) {
      console.log(`AI guess skipped - not AI's turn. Current turn: ${gameState.currentPlayer}`);
      return null;
    }
    
    // Check if AI should make a guess
    if (!AIOpponentManager.shouldAIMakeGuess(aiPlayer.guesses, aiPlayer.difficulty!)) {
      return null;
    }
    
    // Check if game has already ended
    if (isGameEnded(gameState)) {
      return null;
    }
    
    // Generate AI guess using dictionary API validation
    const aiGuess = await AIOpponentManager.generateAIGuess(
      gameId,
      gameState.wordLength,
      aiPlayer.guesses,
      aiPlayer.difficulty!,
      humanPlayer.secretWord
    );
    
    // Create guess result
    const guessResult = createGuessResult(aiGuess, humanPlayer.secretWord);
    
    // Add guess to AI player's history
    aiPlayer.guesses.push(guessResult);
    
    // TURN-BASED: Switch turn back to human player
    gameState.currentPlayer = humanPlayer.id;
    
    // Check if game has ended
    const gameEnded = isGameEnded(gameState);
    
    if (gameEnded) {
      gameState.status = 'finished';
      gameState.winner = determineWinner(gameState);
      
      // Add definitions for both players' secret words
      gameState.player1.secretWordDefinition = getDefinition(gameState.player1.secretWord) || 'a word';
      gameState.player2.secretWordDefinition = getDefinition(gameState.player2.secretWord) || 'a word';
      
      // Clean up AI strategy
      AIOpponentManager.cleanupAIStrategy(gameId);
      
      // Update user statistics (only if not already updated)
      if (!gameState.statisticsUpdated) {
        await this.updateGameEndStatistics(gameState);
        gameState.statisticsUpdated = true;
      }
    }
    
    // Save updated game state
    await RedisDataAccess.saveGameState(gameId, gameState);
    
    return { gameState, guessResult, gameEnded };
  }

  /**
   * Get AI timing for next guess
   */
  static getAIGuessTiming(difficulty: 'easy' | 'medium' | 'difficult'): number {
    return AIOpponentManager.getRandomAITiming(difficulty);
  }

  /**
   * Get score breakdown for a player in a finished game
   */
  static getPlayerScoreBreakdown(
    player: PlayerState,
    gameState: GameState,
    won: boolean
  ): ScoreBreakdown {
    // Calculate time remaining
    const timeElapsed = Date.now() - gameState.startTime;
    const timeRemaining = Math.max(0, gameState.timeLimit - timeElapsed);
    
    // Determine if this is a multiplayer game
    const isMultiplayer = gameState.mode === 'multi';
    
    return calculateScoreBreakdown(
      won,
      player.guesses.length,
      timeRemaining,
      player.difficulty,
      isMultiplayer,
      player.guesses
    );
  }

  /**
   * Check for player disconnection in multiplayer games
   */
  private static async checkPlayerDisconnection(
    gameState: GameState,
    activePlayerId: string
  ): Promise<PlayerState | null> {
    if (gameState.mode !== 'multi') return null;
    
    const disconnectionTimeout = 5 * 60 * 1000; // 5 minutes
    const gracePeriod = 30 * 1000; // 30 seconds grace period for new games
    const now = Date.now();
    
    // Get the opponent player
    const opponentPlayer = gameState.player1.id === activePlayerId ? gameState.player2 : gameState.player1;
    
    // Don't check for disconnection on brand new games (grace period)
    const gameAge = now - gameState.startTime;
    if (gameAge < gracePeriod) {
      return null;
    }
    
    // Check opponent's last activity
    const lastActivity = await redis.get(`player_activity:${gameState.gameId}:${opponentPlayer.id}`);
    
    if (lastActivity) {
      const lastActivityTime = parseInt(lastActivity);
      if (now - lastActivityTime > disconnectionTimeout) {
        return opponentPlayer;
      }
    } else {
      // If no activity recorded, check if game has been active for more than timeout
      if (now - gameState.startTime > disconnectionTimeout) {
        return opponentPlayer;
      }
    }
    
    return null;
  }
  
  /**
   * Update player activity timestamp for disconnection detection
   */
  private static async updatePlayerActivity(gameId: string, playerId: string): Promise<void> {
    const activityKey = `player_activity:${gameId}:${playerId}`;
    await redis.set(activityKey, Date.now().toString());
    await redis.expire(activityKey, 3600); // Expire in 1 hour
  }
  
  /**
   * Handle disconnection statistics update
   */
  private static async updateDisconnectionStatistics(
    gameState: GameState,
    disconnectedPlayerId: string
  ): Promise<void> {
    const winningPlayer = gameState.player1.id === disconnectedPlayerId ? gameState.player2 : gameState.player1;
    const disconnectedPlayer = gameState.player1.id === disconnectedPlayerId ? gameState.player1 : gameState.player2;
    
    // Update winner stats (gets full win points)
    await this.updatePlayerStats(winningPlayer, true, gameState);
    
    // Update disconnected player stats (gets loss points)
    await this.updatePlayerStats(disconnectedPlayer, false, gameState);
  }
  
  /**
   * Atomic game state save for multiplayer synchronization
   */
  private static async saveGameStateAtomic(gameId: string, gameState: GameState): Promise<void> {
    // For Redis, we use a simple save since Redis operations are atomic
    // In a more complex system, we might use Redis transactions or optimistic locking
    await RedisDataAccess.saveGameState(gameId, gameState);
  }
  
  /**
   * Enhanced get game state for multiplayer with activity tracking
   */
  static async getGameStateForClientWithActivity(
    gameId: string,
    playerId: string
  ): Promise<GameState | null> {
    // Get UNSANITIZED game state first to check for disconnection
    const rawGameState = await RedisDataAccess.getGameState(gameId);
    
    if (!rawGameState) return null;
    
    // Update player activity for multiplayer games
    if (rawGameState.mode === 'multi' && rawGameState.status === 'active') {
      await this.updatePlayerActivity(gameId, playerId);
      
      // Check for opponent disconnection using RAW game state
      const disconnectedPlayer = await this.checkPlayerDisconnection(rawGameState, playerId);
      if (disconnectedPlayer) {
        // Update UNSANITIZED game state to reflect disconnection
        rawGameState.status = 'finished';
        rawGameState.winner = rawGameState.player1.id === playerId ? 'player1' : 'player2';
        
        // Add definitions for both players' secret words
        rawGameState.player1.secretWordDefinition = getDefinition(rawGameState.player1.secretWord) || 'a word';
        rawGameState.player2.secretWordDefinition = getDefinition(rawGameState.player2.secretWord) || 'a word';
        
        // Update statistics for disconnection scenario
        if (!rawGameState.statisticsUpdated) {
          await this.updateDisconnectionStatistics(rawGameState, disconnectedPlayer.id);
          rawGameState.statisticsUpdated = true;
        }
        
        await this.saveGameStateAtomic(gameId, rawGameState);
      }
    }
    
    // NOW get the sanitized version for the client
    const gameState = await this.getGameStateForClient(gameId, playerId);
    return gameState;
  }
  
  /**
   * Check if a multiplayer game is synchronized properly
   */
  static async validateMultiplayerSync(gameId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const gameState = await RedisDataAccess.getGameState(gameId);
    const issues: string[] = [];
    
    if (!gameState) {
      return { isValid: false, issues: ['Game not found'] };
    }
    
    if (gameState.mode !== 'multi') {
      return { isValid: true, issues: [] }; // Not a multiplayer game
    }
    
    // Check if both players exist and are not AI
    if (gameState.player1.isAI || gameState.player2.isAI) {
      issues.push('Multiplayer game should not have AI players');
    }
    
    // Check if current player is valid
    if (gameState.currentPlayer !== gameState.player1.id && gameState.currentPlayer !== gameState.player2.id) {
      issues.push('Invalid current player ID');
    }
    
    // Check for reasonable guess counts (prevent infinite games)
    const maxGuesses = 15; // Reasonable limit for multiplayer
    if (gameState.player1.guesses.length > maxGuesses || gameState.player2.guesses.length > maxGuesses) {
      issues.push('Excessive number of guesses detected');
    }
    
    // Check time limits
    const timeElapsed = Date.now() - gameState.startTime;
    if (timeElapsed > gameState.timeLimit && gameState.status === 'active') {
      issues.push('Game has exceeded time limit but is still active');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Force end a multiplayer game due to synchronization issues
   */
  static async forceEndMultiplayerGame(
    gameId: string,
    reason: 'timeout' | 'disconnection' | 'sync_error'
  ): Promise<GameState | null> {
    const gameState = await RedisDataAccess.getGameState(gameId);
    
    if (!gameState || gameState.mode !== 'multi') {
      return null;
    }
    
    gameState.status = 'finished';
    
    // Determine winner based on reason and current state
    switch (reason) {
      case 'timeout':
        gameState.winner = determineWinner(gameState);
        break;
      case 'disconnection':
        // Winner is the player who didn't disconnect (handled elsewhere)
        gameState.winner = 'draw';
        break;
      case 'sync_error':
        gameState.winner = 'draw';
        break;
    }
    
    // Add definitions for both players' secret words
    gameState.player1.secretWordDefinition = getDefinition(gameState.player1.secretWord) || 'a word';
    gameState.player2.secretWordDefinition = getDefinition(gameState.player2.secretWord) || 'a word';
    
    // Update statistics if not already done
    if (!gameState.statisticsUpdated) {
      await this.updateGameEndStatistics(gameState);
      gameState.statisticsUpdated = true;
    }
    
    await this.saveGameStateAtomic(gameId, gameState);
    
    return gameState;
  }
  
  /**
   * Clean up expired games and inactive multiplayer sessions
   */
  static async cleanupExpiredGames(): Promise<void> {
    try {
      // This is a simplified cleanup - in production, you'd want a more sophisticated approach
      // For now, we'll clean up games that have been inactive for more than 2 hours
      const cutoffTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      
      // Note: In a real implementation, you'd scan Redis keys or maintain a separate index
      // For this implementation, cleanup happens when games are accessed
      console.log('Cleanup would remove games older than:', new Date(cutoffTime));
    } catch (error) {
      console.error('Error during game cleanup:', error);
    }
  }
  
  /**
   * Enhanced multiplayer game state retrieval with automatic cleanup
   */
  static async getMultiplayerGameWithCleanup(gameId: string, playerId: string): Promise<GameState | null> {
    const gameState = await this.getGameStateForClientWithActivity(gameId, playerId);
    
    if (!gameState) return null;
    
    // If it's a multiplayer game, validate synchronization
    if (gameState.mode === 'multi' && gameState.status === 'active') {
      const validation = await this.validateMultiplayerSync(gameId);
      
      if (!validation.isValid) {
        console.warn(`Multiplayer sync issues in game ${gameId}:`, validation.issues);
        
        // If there are critical sync issues, consider force-ending the game
        const criticalIssues = validation.issues.filter(issue => 
          issue.includes('Excessive') || issue.includes('exceeded time limit')
        );
        
        if (criticalIssues.length > 0) {
          console.log(`Force-ending game ${gameId} due to critical sync issues`);
          await this.forceEndMultiplayerGame(gameId, 'sync_error');
          return await this.getGameStateForClient(gameId, playerId);
        }
      }
    }
    
    return gameState;
  }

  /**
   * Skip a player's turn due to timeout in multiplayer games
   */
  static async skipTurnDueToTimeout(
    gameId: string, 
    playerId: string,
    force: boolean = false
  ): Promise<{ gameState: GameState } | null> {
    const gameState = await RedisDataAccess.getGameState(gameId);
    
    if (!gameState) {
      throw new Error('Game not found');
    }
    
    if (gameState.status !== 'active') {
      throw new Error('Game is not active');
    }
    
    if (gameState.mode !== 'multi') {
      return null; // Only for multiplayer games
    }
    
    // Check if it's this player's turn
    if (gameState.currentPlayer !== playerId) {
      throw new Error('Not your turn');
    }
    
    // Validate that enough time has passed to justify skipping turn
    // This prevents rapid turn skipping and double turns. If 'force' is true
    // (client reports timer expired), bypass the minTurnTime check to ensure
    // the turn advances immediately.
    const lastActivity = await redis.get(`player_activity:${gameId}:${playerId}`);
    const now = Date.now();
    const minTurnTime = 5000; // Minimum 5 seconds before allowing turn skip

    // Debug logging: record lastActivity, current time, computed difference, and force flag
    try {
      const lastActivityTime = lastActivity ? parseInt(lastActivity) : null;
      const diff = lastActivityTime ? now - lastActivityTime : null;
      console.log(`[DEBUG] skipTurnDueToTimeout game=${gameId} player=${playerId} force=${force} now=${now} lastActivity=${lastActivityTime} diff=${diff}`);
    } catch (e) {
      console.warn('[DEBUG] Failed to log skipTurnDueToTimeout debug info', e);
    }

    if (!force) {
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity);
        if (now - lastActivityTime < minTurnTime) {
          console.warn(`Skip prevented: only ${now - lastActivityTime}ms since last activity (min ${minTurnTime}ms)`);
          throw new Error('Cannot skip turn so quickly');
        }
      }
    } else {
      // Log forced skip for debugging/audit
      console.log(`Forced skip requested for game ${gameId} by player ${playerId}`);
    }
    
    // Switch to opponent's turn
    const opponentPlayer = gameState.player1.id === playerId ? gameState.player2 : gameState.player1;
    gameState.currentPlayer = opponentPlayer.id;
    
    // Update player's last activity timestamp
    await this.updatePlayerActivity(gameId, playerId);
    
    // Save updated game state
    await this.saveGameStateAtomic(gameId, gameState);
    
    return { gameState };
  }

  /**
   * Handle player quitting a multiplayer game
   */
  static async quitGame(
    gameId: string, 
    playerId: string
  ): Promise<{ gameState: GameState } | null> {
    const gameState = await RedisDataAccess.getGameState(gameId);
    
    if (!gameState) {
      throw new Error('Game not found');
    }
    
    if (gameState.status !== 'active') {
      throw new Error('Game is not active');
    }
    
    if (gameState.mode !== 'multi') {
      return null; // Only for multiplayer games
    }
    
    // Determine winner (opponent wins when player quits)
    const opponentPlayer = gameState.player1.id === playerId ? gameState.player2 : gameState.player1;
    
    // End the game with opponent as winner
    gameState.status = 'finished';
    gameState.winner = gameState.player1.id === opponentPlayer.id ? 'player1' : 'player2';
    
    // Add definitions for both players' secret words
    gameState.player1.secretWordDefinition = getDefinition(gameState.player1.secretWord) || 'a word';
    gameState.player2.secretWordDefinition = getDefinition(gameState.player2.secretWord) || 'a word';
    
    // Update statistics for quit scenario
    if (!gameState.statisticsUpdated) {
      await this.updateQuitStatistics(gameState, playerId);
      gameState.statisticsUpdated = true;
    }
    
    // Save updated game state
    await this.saveGameStateAtomic(gameId, gameState);
    
    return { gameState };
  }

  /**
   * Handle quit statistics update
   */
  private static async updateQuitStatistics(
    gameState: GameState,
    quittingPlayerId: string
  ): Promise<void> {
    const winningPlayer = gameState.player1.id === quittingPlayerId ? gameState.player2 : gameState.player1;
    const quittingPlayer = gameState.player1.id === quittingPlayerId ? gameState.player1 : gameState.player2;
    
    // Update winner stats (gets full win points)
    await this.updatePlayerStats(winningPlayer, true, gameState);
    
    // Update quitting player stats (gets loss points)
    await this.updatePlayerStats(quittingPlayer, false, gameState);
  }
}

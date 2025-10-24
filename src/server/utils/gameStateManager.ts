/**
 * Enhanced game state management for Word Duel
 * Handles game creation, updates, and state transitions
 */

import { GameState, PlayerState, GuessResult } from '../../shared/types/game';
import { RedisDataAccess } from '../main';
import { generateGameId, createPlayerState, createGameState, isGameEnded, determineWinner } from './gameUtils';
import { createGuessResult, calculatePoints, calculateCoins } from './gameLogic';
import { AIOpponentManager } from './aiOpponent';
import { getDefinition } from '../services/dictionaryApi';

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
   * Submit a guess for a player
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
      
      // Update user statistics and points
      await this.updateGameEndStatistics(gameState);
    }
    
    // Save updated game state
    await RedisDataAccess.saveGameState(gameId, gameState);
    
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
      points: 0,
      coins: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      averageGuesses: 0
    };
    
    // Calculate time remaining
    const timeElapsed = Date.now() - gameState.startTime;
    const timeRemaining = Math.max(0, gameState.timeLimit - timeElapsed);
    
    // Calculate points and coins
    const points = calculatePoints(won, player.guesses.length, timeRemaining, player.difficulty);
    const coins = calculateCoins(points);
    
    // Update statistics
    userData.gamesPlayed += 1;
    if (won) {
      userData.gamesWon += 1;
      userData.points += points;
      userData.coins += coins;
    }
    
    // Update average guesses
    const totalGuesses = (userData.averageGuesses * (userData.gamesPlayed - 1)) + player.guesses.length;
    userData.averageGuesses = totalGuesses / userData.gamesPlayed;
    
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
      
      // Update user statistics
      await this.updateGameEndStatistics(gameState);
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
   * Clean up expired games
   */
  static async cleanupExpiredGames(): Promise<void> {
    // This would typically be called by a background job
    // For now, we'll handle cleanup when games are accessed
    // Implementation would involve scanning Redis for expired game keys
  }
}

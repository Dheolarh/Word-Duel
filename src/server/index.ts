import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { assignAnonName } from './utils/anonNames';
import { RedisDataAccess, formatResponse } from './main';
import { isValidWordFormat } from './utils/gameUtils';
import { validateWordWithDictionary } from './services/dictionaryApi';
import { GameStateManager } from './utils/gameStateManager';
import { initializeWordLists } from './utils/aiOpponent';
import { 
  errorHandler, 
  notFoundHandler
} from './middleware/errorHandler';
import { MatchmakingManager } from './utils/matchmaking';

const app = express();

// Initialize AI word lists asynchronously (don't block server startup)
initializeWordLists().catch(error => {
  console.error('Failed to initialize AI word lists:', error);
  console.log('AI will use fallback word lists');
});

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Debug middleware: print Devvit context for each incoming request to help diagnose
// whether the playtest runtime is attaching user/subreddit/post context correctly.
app.use(async (req, _res, next) => {
  try {
    // For debugging, resolve the display name from our persisted user data
    // rather than calling Reddit again. This ensures that playtest/runtime
    // logs show the anon username assigned to this userId.
    let resolvedUsername: string | undefined = undefined;
    try {
      const userId = context.userId;
      if (userId) {
        const userData = await RedisDataAccess.getUserData(userId);
        if (userData && userData.username) {
          resolvedUsername = userData.username;
        }
      }
    } catch (e) {
      // ignore errors resolving from Redis
      resolvedUsername = undefined;
    }

    console.log('[DEVVIT_CONTEXT]', {
      path: req.path,
      method: req.method,
      userId: context.userId,
      resolvedUsername,
      subredditName: context.subredditName,
      postId: context.postId,
    });
  } catch (e) {
    console.warn('Failed to read devvit context for request', req.path, e);
  }
  next();
});

const router = express.Router();

// Helper to normalize client-side placeholder IDs like 'current-user'
const resolvePlayerId = (rawId?: string) => {
  if (!rawId) return rawId;
  if (rawId === 'current-user' || rawId.includes('current-user')) {
    // Fall back to Devvit context userId when available
    return context.userId || rawId;
  }
  return rawId;
};

// Legacy endpoints (keeping for compatibility)
router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

// Word Duel API endpoints

// Health check endpoint
router.get('/api/health', async (_req, res) => {
  try {
    // Test Redis connection by doing a simple operation
    await redis.set('health_check', 'ok');
    await redis.del('health_check');
    res.json(formatResponse({ status: 'healthy', timestamp: Date.now() }));
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json(formatResponse(
      undefined, 
      'Service unavailable', 
      'SERVER_ERROR', 
      true
    ));
  }
});

// Word validation endpoint
router.post('/api/validate-word', async (req, res) => {
  try {
    const { word } = req.body;
    
    if (!word || typeof word !== 'string') {
      return res.status(400).json(formatResponse(
        undefined,
        'Word is required',
        'VALIDATION_ERROR'
      ));
    }
    
    const normalizedWord = word.toUpperCase().trim();
    
    // Validate word format (4 or 5 letters)
    if (!isValidWordFormat(normalizedWord, 4) && !isValidWordFormat(normalizedWord, 5)) {
      return res.status(400).json(formatResponse(
        undefined,
        'Word must be 4 or 5 letters containing only letters',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate word using local JSON dictionary
    const validationResult = await validateWordWithDictionary(normalizedWord);

    if (validationResult.isValid) {
      res.json(formatResponse({
        valid: true,
        word: validationResult.word
      }));
    } else {
      // Word not found in dictionary
      res.status(400).json(formatResponse(
        undefined,
        `${normalizedWord} doesn't appear in the dictionary`,
        'VALIDATION_ERROR'
      ));
    }
    
  } catch (error) {
    console.error('Word validation error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to validate word',
      'SERVER_ERROR',
      true
    ));
  }
});

// Submit guess endpoint
router.post('/api/submit-guess', async (req, res) => {
  try {
  const { gameId, playerId: rawPlayerId, guess } = req.body;
  const playerId = resolvePlayerId(rawPlayerId as string);
    
    // Validate required fields
    if (!gameId || !playerId || !guess) {
      return res.status(400).json(formatResponse(
        undefined,
        'Game ID, player ID, and guess are required',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate guess format
    const normalizedGuess = guess.toUpperCase().trim();
    if (!isValidWordFormat(normalizedGuess, 4) && !isValidWordFormat(normalizedGuess, 5)) {
      return res.status(400).json(formatResponse(
        undefined,
        'Guess must be 4 or 5 letters containing only letters',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate word using local JSON dictionary
    const validationResult = await validateWordWithDictionary(normalizedGuess);

    if (!validationResult.isValid) {
      return res.status(400).json(formatResponse(
        undefined,
        `${normalizedGuess} doesn't appear in the dictionary`,
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate game access
    const hasAccess = await GameStateManager.validateGameAccess(gameId, playerId);
    if (!hasAccess) {
      return res.status(403).json(formatResponse(
        undefined,
        'Access denied to this game',
        'GAME_ERROR'
      ));
    }
    
    // Submit the guess
    const result = await GameStateManager.submitGuess(gameId, playerId, normalizedGuess);
    
    // Get score breakdown if game ended
    let scoreBreakdown;
    if (result.gameEnded && result.gameState.status === 'finished') {
      const currentPlayer = result.gameState.player1.id === playerId ? result.gameState.player1 : result.gameState.player2;
      const won = result.gameState.winner === 'player1' && currentPlayer.id === result.gameState.player1.id ||
                  result.gameState.winner === 'player2' && currentPlayer.id === result.gameState.player2.id;
      
      scoreBreakdown = GameStateManager.getPlayerScoreBreakdown(currentPlayer, result.gameState, won);
    }
    
    res.json(formatResponse({
      gameState: result.gameState,
      guessResult: result.guessResult,
      gameEnded: result.gameEnded,
      ...(scoreBreakdown && { scoreBreakdown })
    }));
    
  } catch (error) {
    console.error('Submit guess error:', error);
    
    // Handle specific game errors
    if (error instanceof Error) {
      if (error.message === 'Game not found') {
        return res.status(404).json(formatResponse(
          undefined,
          'Game not found',
          'GAME_ERROR'
        ));
      }
      
      if (error.message === 'Game is not active' || error.message === 'Game has already ended') {
        return res.status(400).json(formatResponse(
          undefined,
          error.message,
          'GAME_ERROR'
        ));
      }
      
      if (error.message === 'Not your turn') {
        return res.status(400).json(formatResponse(
          undefined,
          'Not your turn - please wait for opponent',
          'GAME_ERROR'
        ));
      }
      
      if (error.message === 'Player not found in this game') {
        return res.status(403).json(formatResponse(
          undefined,
          'Player not found in this game',
          'GAME_ERROR'
        ));
      }
    }
    
    res.status(500).json(formatResponse(
      undefined,
      'Failed to submit guess',
      'SERVER_ERROR',
      true
    ));
  }
});

// Get game state endpoint
router.get('/api/get-game-state/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
  const { playerId: rawPlayerId } = req.query;
  const playerId = resolvePlayerId(rawPlayerId as string);
    
    if (!gameId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Game ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    if (!playerId || typeof playerId !== 'string') {
      return res.status(400).json(formatResponse(
        undefined,
        'Player ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate game access
    const hasAccess = await GameStateManager.validateGameAccess(gameId, playerId);
    if (!hasAccess) {
      return res.status(403).json(formatResponse(
        undefined,
        'Access denied to this game',
        'GAME_ERROR'
      ));
    }
    
    const gameState = await GameStateManager.getGameStateForClientWithActivity(gameId, playerId);
    
    if (!gameState) {
      return res.status(404).json(formatResponse(
        undefined,
        'Game not found',
        'GAME_ERROR'
      ));
    }
    
    // Get score breakdown if game is finished
    let scoreBreakdown;
    if (gameState.status === 'finished') {
      const currentPlayer = gameState.player1.id === playerId ? gameState.player1 : gameState.player2;
      const won = gameState.winner === 'player1' && currentPlayer.id === gameState.player1.id ||
                  gameState.winner === 'player2' && currentPlayer.id === gameState.player2.id;
      
      scoreBreakdown = GameStateManager.getPlayerScoreBreakdown(currentPlayer, gameState, won);
    }
    
    res.json(formatResponse({ 
      gameState,
      ...(scoreBreakdown && { scoreBreakdown })
    }));
    
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to retrieve game state',
      'SERVER_ERROR',
      true
    ));
  }
});

// Create single player game endpoint
router.post('/api/create-game', async (req, res) => {
  try {
  let { playerId: rawPlayerId, playerSecretWord, wordLength, difficulty, mode } = req.body;
  let playerId = resolvePlayerId(rawPlayerId as string);
    let { playerUsername } = req.body;
    
    // Validate required fields
    if (!playerId || !playerUsername || !playerSecretWord || !wordLength || !mode) {
      return res.status(400).json(formatResponse(
        undefined,
        'Player ID, username, secret word, word length, and mode are required',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate word length
    if (wordLength !== 4 && wordLength !== 5) {
      return res.status(400).json(formatResponse(
        undefined,
        'Word length must be 4 or 5',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate secret word format
    if (!isValidWordFormat(playerSecretWord, wordLength)) {
      return res.status(400).json(formatResponse(
        undefined,
        `Secret word must be ${wordLength} letters containing only letters`,
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate mode and difficulty
    if (mode === 'single') {
      if (!difficulty || !['easy', 'medium', 'difficult'].includes(difficulty)) {
        return res.status(400).json(formatResponse(
          undefined,
          'Difficulty must be easy, medium, or difficult for single player mode',
          'VALIDATION_ERROR'
        ));
      }
      
      // Prefer persisted username from Redis if available
      if (playerId && !playerId.includes('current-user')) {
        try {
          const stored = await RedisDataAccess.getUserData(playerId);
          if (stored && stored.username) {
            playerUsername = stored.username;
          }
        } catch (e) {
          console.warn('Error reading stored user data for', playerId, e);
        }
      }
      
      // If we still don't have a usable username, assign a persistent anon name
      if (playerId && !playerId.includes('current-user') && (!playerUsername || playerUsername === 'Player' || playerUsername === 'Anonymous' || playerUsername === 'unknown')) {
        try {
          playerUsername = await assignAnonName(playerId);
        } catch (e) {
          console.warn('Failed to assign anon name for', playerId, e);
          playerUsername = playerUsername || 'Player';
        }
      }

      // Initialize user data (profile pictures will use username-based avatars for now)
      await RedisDataAccess.initializeUserData(playerId, playerUsername);
      
      // Create single player game
      const gameState = await GameStateManager.createSinglePlayerGame(
        playerId,
        playerUsername,
        playerSecretWord.toUpperCase().trim(),
        wordLength,
        difficulty
      );
      
      res.json(formatResponse({
        gameId: gameState.gameId,
        status: 'ready',
        gameState
      }));
      
    } else if (mode === 'multi') {
      // Initialize user data for multiplayer
      if (playerId && !playerId.includes('current-user')) {
        try {
          const stored = await RedisDataAccess.getUserData(playerId);
          if (stored && stored.username) {
            playerUsername = stored.username;
          }
        } catch (e) {
          console.warn('Error reading stored user data for', playerId, e);
        }
      }
      
      // If username is still missing for multiplayer, assign an anon username
      if (playerId && !playerId.includes('current-user') && (!playerUsername || playerUsername === 'Player' || playerUsername === 'Anonymous' || playerUsername === 'unknown')) {
        try {
          playerUsername = await assignAnonName(playerId);
        } catch (e) {
          console.warn('Failed to assign anon name for', playerId, e);
          playerUsername = playerUsername || 'Player';
        }
      }

      await RedisDataAccess.initializeUserData(playerId, playerUsername);
      
      // Join matchmaking queue
      const matchResult = await MatchmakingManager.joinQueue({
        playerId,
        playerUsername,
        playerSecretWord: playerSecretWord.toUpperCase().trim(),
        wordLength,
        timestamp: Date.now()
      });
      
      if (matchResult.matched) {
        // Match found, return game state (sanitized for client)
        const sanitizedGameState = await GameStateManager.getGameStateForClient(matchResult.gameId, playerId);
        if (!sanitizedGameState) {
          return res.status(404).json(formatResponse(
            undefined,
            'Game state not found',
            'GAME_ERROR'
          ));
        }
        res.json(formatResponse({
          gameId: matchResult.gameId,
          status: 'ready',
          gameState: sanitizedGameState
        }));
      } else {
        // Added to queue, return waiting status
        res.json(formatResponse({
          gameId: '',
          status: 'waiting'
        }));
      }
    } else {
      return res.status(400).json(formatResponse(
        undefined,
        'Mode must be single or multi',
        'VALIDATION_ERROR'
      ));
    }
    
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to create game',
      'SERVER_ERROR',
      true
    ));
  }
});

// AI guess endpoint (for triggering AI moves)
router.post('/api/ai-guess/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Game ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    const result = await GameStateManager.submitAIGuess(gameId);
    
    if (!result) {
      return res.status(400).json(formatResponse(
        undefined,
        'AI cannot make a guess at this time',
        'GAME_ERROR'
      ));
    }
    
    // Get score breakdown if game ended (for human player)
    let scoreBreakdown;
    if (result.gameEnded && result.gameState.status === 'finished') {
      const humanPlayer = result.gameState.player1.isAI ? result.gameState.player2 : result.gameState.player1;
      const won = result.gameState.winner === 'player1' && humanPlayer.id === result.gameState.player1.id ||
                  result.gameState.winner === 'player2' && humanPlayer.id === result.gameState.player2.id;
      
      scoreBreakdown = GameStateManager.getPlayerScoreBreakdown(humanPlayer, result.gameState, won);
    }
    
    res.json(formatResponse({
      gameState: result.gameState,
      guessResult: result.guessResult,
      gameEnded: result.gameEnded,
      ...(scoreBreakdown && { scoreBreakdown })
    }));
    
  } catch (error) {
    console.error('AI guess error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to process AI guess',
      'SERVER_ERROR',
      true
    ));
  }
});

// Get AI timing endpoint
router.get('/api/ai-timing/:difficulty', async (req, res) => {
  try {
    const { difficulty } = req.params;
    
    if (!difficulty || !['easy', 'medium', 'difficult'].includes(difficulty)) {
      return res.status(400).json(formatResponse(
        undefined,
        'Difficulty must be easy, medium, or difficult',
        'VALIDATION_ERROR'
      ));
    }
    
    const timing = GameStateManager.getAIGuessTiming(difficulty as 'easy' | 'medium' | 'difficult');
    
    res.json(formatResponse({
      timing,
      difficulty
    }));
    
  } catch (error) {
    console.error('Get AI timing error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to get AI timing',
      'SERVER_ERROR',
      true
    ));
  }
});

// Get user profile endpoint
router.get('/api/get-user-profile', async (_req, res) => {
  try {
    const { userId } = context;
    
    if (!userId) {
      return res.status(401).json(formatResponse(
        undefined,
        'User not authenticated',
        'VALIDATION_ERROR'
      ));
    }
    // Prefer our persisted user data (may contain assigned anon name)
    const userData = await RedisDataAccess.getUserData(userId);
    if (userData && userData.username) {
      const profileData = {
        userId,
        username: userData.username,
        profilePicture: userData.profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0YTliM2MiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiA1MmMwLTguODM3IDcuMTYzLTE2IDE2LTE2czE2IDcuMTYzIDE2IDE2djEySDEyVjUyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
        isRedditProfile: userData.isRedditProfile || false
      };
      return res.json(formatResponse({ profile: profileData }));
    }

    // No persisted data — assign an anon name and initialize user data
    try {
      const anon = await assignAnonName(userId);
      await RedisDataAccess.initializeUserData(userId, anon);
      const profileData = {
        userId,
        username: anon,
        profilePicture: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0YTliM2MiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiA1MmMwLTguODM3IDcuMTYzLTE2IDE2LTE2czE2IDcuMTYzIDE2IDE2djEySDEyVjUyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
        isRedditProfile: false
      };
      return res.json(formatResponse({ profile: profileData }));
    } catch (e) {
      console.error('Failed to assign anon name:', e);
      return res.status(500).json(formatResponse(undefined, 'Failed to retrieve user profile', 'SERVER_ERROR', true));
    }
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to retrieve user profile',
      'SERVER_ERROR',
      true
    ));
  }
});

// Get assigned anonymous name for current user (assigns one if missing)
router.get('/api/get-anon-name', async (_req, res) => {
  try {
    const { userId } = context;
    if (!userId) {
      return res.status(401).json(formatResponse(undefined, 'User not authenticated', 'VALIDATION_ERROR'));
    }

    // Ensure canonical form (use as-is, developer may normalize elsewhere)
    const existing = await RedisDataAccess.getUserData(userId);
    if (existing && existing.username && existing.username !== 'Anonymous' && existing.username !== 'Player') {
      return res.json(formatResponse({ anonName: existing.username }));
    }

    // Try to get assigned anon name without overwriting existing mapping
    const { assignAnonName, getAssignedAnonName } = await Promise.resolve(require('./utils/anonNames')) as any;
    let anon = await getAssignedAnonName(userId);
    if (!anon) {
      anon = await assignAnonName(userId);
    }

    // Persist in Redis user data as well
    await RedisDataAccess.initializeUserData(userId, anon);

    res.json(formatResponse({ anonName: anon }));
  } catch (error) {
    console.error('Get anon name error:', error);
    res.status(500).json(formatResponse(undefined, 'Failed to get anon name', 'SERVER_ERROR', true));
  }
});

// Matchmaking endpoints

// Check matchmaking status
router.get('/api/matchmaking-status/:wordLength/:playerId', async (req, res) => {
  try {
  const { wordLength, playerId: rawPlayerId } = req.params;
  const playerId = resolvePlayerId(rawPlayerId as string);
    
    if (!wordLength || !playerId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Word length and player ID are required',
        'VALIDATION_ERROR'
      ));
    }
    
    const wordLengthNum = parseInt(wordLength);
    if (wordLengthNum !== 4 && wordLengthNum !== 5) {
      return res.status(400).json(formatResponse(
        undefined,
        'Word length must be 4 or 5',
        'VALIDATION_ERROR'
      ));
    }
    
    const isInQueue = await MatchmakingManager.isPlayerInQueue(playerId, wordLengthNum as 4 | 5);
    const queueStatus = await MatchmakingManager.getQueueStatus(wordLengthNum as 4 | 5);
    
    res.json(formatResponse({
      inQueue: isInQueue,
      playersWaiting: queueStatus.playersWaiting,
      averageWaitTime: queueStatus.averageWaitTime
    }));
    
  } catch (error) {
    console.error('Matchmaking status error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to get matchmaking status',
      'SERVER_ERROR',
      true
    ));
  }
});

// Leave matchmaking queue
router.post('/api/leave-queue', async (req, res) => {
  try {
  const { playerId: rawPlayerId, wordLength } = req.body;
  const playerId = resolvePlayerId(rawPlayerId as string);
    
    if (!playerId || !wordLength) {
      return res.status(400).json(formatResponse(
        undefined,
        'Player ID and word length are required',
        'VALIDATION_ERROR'
      ));
    }
    
    if (wordLength !== 4 && wordLength !== 5) {
      return res.status(400).json(formatResponse(
        undefined,
        'Word length must be 4 or 5',
        'VALIDATION_ERROR'
      ));
    }
    
    await MatchmakingManager.leaveQueue(playerId, wordLength);
    
    res.json(formatResponse({
      success: true,
      message: 'Left matchmaking queue'
    }));
    
  } catch (error) {
    console.error('Leave queue error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to leave queue',
      'SERVER_ERROR',
      true
    ));
  }
});

// Check for match (poll for game creation)
router.get('/api/check-match/:playerId', async (req, res) => {
  try {
  const { playerId: rawPlayerId } = req.params;
  const playerId = resolvePlayerId(rawPlayerId as string);
    
    if (!playerId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Player ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    // Check if player has been matched to a game
    const gameId = await MatchmakingManager.getPlayerGame(playerId);
    
    if (gameId) {
      // Verify the game exists and is valid
      const gameState = await RedisDataAccess.getGameState(gameId);
      if (gameState && gameState.status === 'active') {
        // Return sanitized game state for client
        const sanitizedGameState = await GameStateManager.getGameStateForClient(gameId, playerId);
        if (!sanitizedGameState) {
          // Game state not found, clean up the mapping
          await MatchmakingManager.removePlayerGame(playerId);
        } else {
          res.json(formatResponse({
            matchFound: true,
            gameId,
            gameState: sanitizedGameState
          }));
          return;
        }
      } else {
        // Game doesn't exist or is not active, clean up the mapping
        await MatchmakingManager.removePlayerGame(playerId);
      }
    }
    
    res.json(formatResponse({
      matchFound: false,
      gameId: null
    }));
    
  } catch (error) {
    console.error('Check match error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to check for match',
      'SERVER_ERROR',
      true
    ));
  }
});

// Get all queues status (for admin/debugging)
router.get('/api/queues-status', async (_req, res) => {
  try {
    const status = await MatchmakingManager.getAllQueuesStatus();
    res.json(formatResponse(status));
  } catch (error) {
    console.error('Get queues status error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to get queues status',
      'SERVER_ERROR',
      true
    ));
  }
});

// Validate multiplayer game synchronization
router.get('/api/validate-sync/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Game ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    const validation = await GameStateManager.validateMultiplayerSync(gameId);
    
    res.json(formatResponse({
      gameId,
      isValid: validation.isValid,
      issues: validation.issues
    }));
    
  } catch (error) {
    console.error('Validate sync error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to validate synchronization',
      'SERVER_ERROR',
      true
    ));
  }
});

// Force end multiplayer game due to sync issues
router.post('/api/force-end-game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { reason } = req.body;
    
    if (!gameId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Game ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    if (!reason || !['timeout', 'disconnection', 'sync_error'].includes(reason)) {
      return res.status(400).json(formatResponse(
        undefined,
        'Valid reason is required (timeout, disconnection, sync_error)',
        'VALIDATION_ERROR'
      ));
    }
    
    const gameState = await GameStateManager.forceEndMultiplayerGame(gameId, reason);
    
    if (!gameState) {
      return res.status(404).json(formatResponse(
        undefined,
        'Game not found or not a multiplayer game',
        'GAME_ERROR'
      ));
    }
    
    res.json(formatResponse({
      gameId,
      gameState,
      reason
    }));
    
  } catch (error) {
    console.error('Force end game error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to force end game',
      'SERVER_ERROR',
      true
    ));
  }
});

// Skip turn due to timeout in multiplayer games
router.post('/api/skip-turn/:gameId', async (req, res) => {
  try {
  const { gameId } = req.params;
  const { playerId: rawPlayerId } = req.body;
  const playerId = resolvePlayerId(rawPlayerId as string);
    
    if (!gameId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Game ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    if (!playerId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Player ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate game access
    const hasAccess = await GameStateManager.validateGameAccess(gameId, playerId);
    if (!hasAccess) {
      return res.status(403).json(formatResponse(
        undefined,
        'Access denied to this game',
        'GAME_ERROR'
      ));
    }
    
    const result = await GameStateManager.skipTurnDueToTimeout(gameId, playerId);
    
    if (!result) {
      return res.status(400).json(formatResponse(
        undefined,
        'Cannot skip turn at this time',
        'GAME_ERROR'
      ));
    }
    
    res.json(formatResponse({
      gameState: result.gameState,
      turnSkipped: true,
      reason: 'timeout'
    }));
    
  } catch (error) {
    console.error('Skip turn error:', error);
    
    // Handle specific game errors
    if (error instanceof Error) {
      if (error.message === 'Game not found') {
        return res.status(404).json(formatResponse(
          undefined,
          'Game not found',
          'GAME_ERROR'
        ));
      }
      
      if (error.message === 'Game is not active') {
        return res.status(400).json(formatResponse(
          undefined,
          'Game is not active',
          'GAME_ERROR'
        ));
      }
      
      if (error.message === 'Not your turn') {
        return res.status(400).json(formatResponse(
          undefined,
          'Not your turn',
          'GAME_ERROR'
        ));
      }
    }
    
    res.status(500).json(formatResponse(
      undefined,
      'Failed to skip turn',
      'SERVER_ERROR',
      true
    ));
  }
});

// Quit game endpoint for multiplayer games
router.post('/api/quit-game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId: rawPlayerId } = req.body;
    const playerId = resolvePlayerId(rawPlayerId as string);
    
    if (!gameId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Game ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    if (!playerId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Player ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate game access
    const hasAccess = await GameStateManager.validateGameAccess(gameId, playerId);
    if (!hasAccess) {
      return res.status(403).json(formatResponse(
        undefined,
        'Access denied to this game',
        'GAME_ERROR'
      ));
    }
    
    const result = await GameStateManager.quitGame(gameId, playerId);
    
    if (!result) {
      return res.status(400).json(formatResponse(
        undefined,
        'Cannot quit game at this time',
        'GAME_ERROR'
      ));
    }
    
    res.json(formatResponse({
      gameState: result.gameState,
      quit: true,
      reason: 'player_quit'
    }));
    
  } catch (error) {
    console.error('Quit game error:', error);
    
    // Handle specific game errors
    if (error instanceof Error) {
      if (error.message === 'Game not found') {
        return res.status(404).json(formatResponse(
          undefined,
          'Game not found',
          'GAME_ERROR'
        ));
      }
      
      if (error.message === 'Game is not active') {
        return res.status(400).json(formatResponse(
          undefined,
          'Game is not active',
          'GAME_ERROR'
        ));
      }
    }
    
    res.status(500).json(formatResponse(
      undefined,
      'Failed to quit game',
      'SERVER_ERROR',
      true
    ));
  }
});

// Enhanced multiplayer game state endpoint with automatic cleanup
router.get('/api/get-multiplayer-game/:gameId', async (req, res) => {
  try {
  const { gameId } = req.params;
  const { playerId: rawPlayerId } = req.query;
  const playerId = resolvePlayerId(rawPlayerId as string);
    
    if (!gameId) {
      return res.status(400).json(formatResponse(
        undefined,
        'Game ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    if (!playerId || typeof playerId !== 'string') {
      return res.status(400).json(formatResponse(
        undefined,
        'Player ID is required',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validate game access
    const hasAccess = await GameStateManager.validateGameAccess(gameId, playerId);
    if (!hasAccess) {
      return res.status(403).json(formatResponse(
        undefined,
        'Access denied to this game',
        'GAME_ERROR'
      ));
    }
    
    const gameState = await GameStateManager.getMultiplayerGameWithCleanup(gameId, playerId);
    
    if (!gameState) {
      return res.status(404).json(formatResponse(
        undefined,
        'Game not found',
        'GAME_ERROR'
      ));
    }
    
    // Get score breakdown if game is finished
    let scoreBreakdown;
    if (gameState.status === 'finished') {
      const currentPlayer = gameState.player1.id === playerId ? gameState.player1 : gameState.player2;
      const won = gameState.winner === 'player1' && currentPlayer.id === gameState.player1.id ||
                  gameState.winner === 'player2' && currentPlayer.id === gameState.player2.id;
      
      scoreBreakdown = GameStateManager.getPlayerScoreBreakdown(currentPlayer, gameState, won);
    }
    
    res.json(formatResponse({ 
      gameState,
      ...(scoreBreakdown && { scoreBreakdown })
    }));
    
  } catch (error) {
    console.error('Get multiplayer game error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to retrieve multiplayer game state',
      'SERVER_ERROR',
      true
    ));
  }
});

// Get leaderboard endpoint
router.get('/api/get-leaderboard', async (req, res) => {
  try {
  const limit = parseInt(req.query.limit as string) || 100; // Default to 100 players
  const currentUserId = resolvePlayerId(req.query.currentUserId as string);
    
    const leaderboardData = await RedisDataAccess.getLeaderboard(limit);
    
    // Get current player's rank if provided
    let currentPlayerRank = null;
    if (currentUserId) {
      currentPlayerRank = await RedisDataAccess.getPlayerRank(currentUserId);
    }
    
    // Get user data for each leaderboard entry with Reddit profile integration
    const leaderboard = await Promise.all(
      leaderboardData.map(async (entry) => {
        const userData = await RedisDataAccess.getUserData(entry.userId);
        let profilePicture = userData?.profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0YTliM2MiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiA1MmMwLTguODM3IDcuMTYzLTE2IDE2LTE2czE2IDcuMTYzIDE2IDE2djEySDEyVjUyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
        let username = userData?.username || 'Unknown';
        
        // Use stored user data only; do not call Reddit in playtest/runtime
        
        return {
          username,
          profilePicture,
          points: entry.points,
          rank: entry.rank,
          userId: entry.userId
        };
      })
    );
    
    // If current player is not in top 100 but has a rank, get their data
    let currentPlayerData = null;
    if (currentPlayerRank && currentUserId && !leaderboard.find(entry => entry.userId === currentUserId)) {
      const userData = await RedisDataAccess.getUserData(currentUserId);
      let profilePicture = userData?.profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0YTliM2MiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiA1MmMwLTguODM3IDcuMTYzLTE2IDE2LTE2czE2IDcuMTYzIDE2IDE2djEySDEyVjUyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
      let username = userData?.username || 'Unknown';
      
      // Do not call Reddit; use stored data only
      
      currentPlayerData = {
        username,
        profilePicture,
        points: currentPlayerRank.points,
        rank: currentPlayerRank.rank,
        userId: currentUserId
      };
    }
    
    res.json(formatResponse({ 
      leaderboard,
      currentPlayerData
    }));
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json(formatResponse(
      undefined,
      'Failed to retrieve leaderboard',
      'SERVER_ERROR',
      true
    ));
  }
});

// Internal endpoints for Devvit
router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Global error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);

import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse, ApiResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { RedisDataAccess, formatResponse } from './main';
import { isValidWordFormat } from './utils/gameUtils';
import { validateWordWithDictionary } from './services/dictionaryApi';
import { GameStateManager } from './utils/gameStateManager';
import { initializeWordLists } from './utils/aiOpponent';

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

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  
  const errorResponse: ApiResponse = {
    success: false,
    error: 'Internal server error',
    code: 'SERVER_ERROR',
    retryable: true
  };
  
  res.status(500).json(errorResponse);
});

const router = express.Router();

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
    const { gameId, playerId, guess } = req.body;
    
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
    
    res.json(formatResponse({
      gameState: result.gameState,
      guessResult: result.guessResult,
      gameEnded: result.gameEnded
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
    const { playerId } = req.query;
    
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
    
    const gameState = await GameStateManager.getGameStateForClient(gameId, playerId);
    
    if (!gameState) {
      return res.status(404).json(formatResponse(
        undefined,
        'Game not found',
        'GAME_ERROR'
      ));
    }
    
    res.json(formatResponse({ gameState }));
    
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
    const { playerId, playerUsername, playerSecretWord, wordLength, difficulty, mode } = req.body;
    
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
      // TODO: Implement multiplayer game creation
      return res.status(501).json(formatResponse(
        undefined,
        'Multiplayer mode not yet implemented',
        'VALIDATION_ERROR'
      ));
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
    
    res.json(formatResponse({
      gameState: result.gameState,
      guessResult: result.guessResult,
      gameEnded: result.gameEnded
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

// Get leaderboard endpoint
router.get('/api/get-leaderboard', async (_req, res) => {
  try {
    const leaderboardData = await RedisDataAccess.getLeaderboard(10);
    
    // Get user data for each leaderboard entry
    const leaderboard = await Promise.all(
      leaderboardData.map(async (entry, index) => {
        const userData = await RedisDataAccess.getUserData(entry.userId);
        return {
          username: userData?.username || 'Unknown',
          points: entry.points,
          rank: index + 1
        };
      })
    );
    
    res.json(formatResponse({ leaderboard }));
    
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

// Global error handler (must be last)
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json(formatResponse(
    undefined,
    'Endpoint not found',
    'VALIDATION_ERROR'
  ));
});

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);

import express from 'express';
import { ApiResponse } from '../../shared/types/api';

export interface ServerError extends Error {
  statusCode?: number;
  code?: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'GAME_ERROR' | 'SERVER_ERROR';
  retryable?: boolean;
}

/**
 * Create a standardized server error
 */
export function createServerError(
  message: string,
  statusCode: number = 500,
  code: ServerError['code'] = 'SERVER_ERROR',
  retryable: boolean = true
): ServerError {
  const error = new Error(message) as ServerError;
  error.statusCode = statusCode;
  error.code = code;
  error.retryable = retryable;
  return error;
}

/**
 * Validation error helper
 */
export function createValidationError(message: string): ServerError {
  return createServerError(message, 400, 'VALIDATION_ERROR', false);
}

/**
 * Game error helper
 */
export function createGameError(message: string, retryable: boolean = false): ServerError {
  return createServerError(message, 400, 'GAME_ERROR', retryable);
}

/**
 * Network error helper
 */
export function createNetworkError(message: string): ServerError {
  return createServerError(message, 503, 'NETWORK_ERROR', true);
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: ServerError,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
): void {
  console.error('Server error:', err);

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'SERVER_ERROR';
  let retryable = err.retryable !== undefined ? err.retryable : true;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    retryable = false;
  } else if (err.message?.includes('Redis') || err.message?.includes('connection')) {
    statusCode = 503;
    code = 'SERVER_ERROR';
    retryable = true;
    message = 'Database connection error';
  } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
    statusCode = 503;
    code = 'NETWORK_ERROR';
    retryable = true;
    message = 'Network connection failed';
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  const errorResponse: ApiResponse = {
    success: false,
    error: message,
    code,
    retryable
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler
 */
export function notFoundHandler(_req: express.Request, res: express.Response): void {
  const errorResponse: ApiResponse = {
    success: false,
    error: 'Endpoint not found',
    code: 'VALIDATION_ERROR',
    retryable: false
  };

  res.status(404).json(errorResponse);
}

/**
 * Graceful fallback for dictionary validation
 */
export async function withDictionaryFallback<T>(
  primaryCall: () => Promise<T>,
  fallbackCall?: () => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  try {
    return await primaryCall();
  } catch (primaryError) {
    console.warn('Primary dictionary call failed:', primaryError);
    
    if (fallbackCall) {
      try {
        console.log('Attempting fallback dictionary call...');
        return await fallbackCall();
      } catch (fallbackError) {
        console.warn('Fallback dictionary call failed:', fallbackError);
        
        if (fallbackValue !== undefined) {
          console.log('Using fallback value');
          return fallbackValue;
        }
        
        // If no fallback value, throw a network error
        throw createNetworkError('Dictionary validation service is temporarily unavailable');
      }
    }
    
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    // Re-throw the original error if no fallback options
    throw primaryError;
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  shouldRetry: (error: any) => boolean = () => true
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        break;
      }
      
      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

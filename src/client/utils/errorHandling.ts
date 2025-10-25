import { ApiResponse } from '../../shared/types/api';

export interface ErrorInfo {
  title: string;
  message: string;
  retryable: boolean;
  code?: string;
}

export class ErrorHandler {
  /**
   * Parse API error response and return user-friendly error information
   */
  static parseApiError(error: any, defaultMessage: string = 'An unexpected error occurred'): ErrorInfo {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        retryable: true,
        code: 'NETWORK_ERROR'
      };
    }

    // Handle API response errors
    if (error && typeof error === 'object') {
      const apiError = error as Partial<ApiResponse>;
      
      if (apiError.error && apiError.code) {
        switch (apiError.code) {
          case 'VALIDATION_ERROR':
            return {
              title: 'Invalid Input',
              message: apiError.error,
              retryable: false,
              code: apiError.code
            };
            
          case 'NETWORK_ERROR':
            return {
              title: 'Network Error',
              message: 'Connection failed. Please check your internet connection and try again.',
              retryable: true,
              code: apiError.code
            };
            
          case 'GAME_ERROR':
            return {
              title: 'Game Error',
              message: apiError.error,
              retryable: apiError.retryable || false,
              code: apiError.code
            };
            
          case 'SERVER_ERROR':
            return {
              title: 'Server Error',
              message: 'The server encountered an error. Please try again in a moment.',
              retryable: true,
              code: apiError.code
            };
            
          default:
            return {
              title: 'Error',
              message: apiError.error,
              retryable: apiError.retryable || false,
              code: apiError.code
            };
        }
      }
      
      // Handle error with message but no code
      if (apiError.error) {
        return {
          title: 'Error',
          message: apiError.error,
          retryable: apiError.retryable || false
        };
      }
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        title: 'Error',
        message: error,
        retryable: false
      };
    }

    // Default fallback
    return {
      title: 'Unexpected Error',
      message: defaultMessage,
      retryable: true
    };
  }

  /**
   * Handle dictionary validation errors with specific messaging
   */
  static parseDictionaryError(word: string, error: any): ErrorInfo {
    const baseError = this.parseApiError(error);
    
    // Network errors during validation
    if (baseError.code === 'NETWORK_ERROR') {
      return {
        title: 'Validation Failed',
        message: 'Unable to validate word due to connection issues. Please try again.',
        retryable: true,
        code: 'NETWORK_ERROR'
      };
    }
    
    // Word not found in dictionary
    if (baseError.code === 'VALIDATION_ERROR') {
      return {
        title: 'Invalid Word',
        message: `"${word.toUpperCase()}" doesn't appear in the dictionary`,
        retryable: false,
        code: 'VALIDATION_ERROR'
      };
    }
    
    // Server error during validation
    if (baseError.code === 'SERVER_ERROR') {
      return {
        title: 'Validation Error',
        message: 'Word validation service is temporarily unavailable. Please try again.',
        retryable: true,
        code: 'SERVER_ERROR'
      };
    }
    
    return baseError;
  }

  /**
   * Handle game-specific errors
   */
  static parseGameError(error: any): ErrorInfo {
    const baseError = this.parseApiError(error);
    
    // Game not found
    if (baseError.message?.includes('Game not found')) {
      return {
        title: 'Game Not Found',
        message: 'This game session no longer exists. Please start a new game.',
        retryable: false,
        code: 'GAME_ERROR'
      };
    }
    
    // Game already ended
    if (baseError.message?.includes('Game has already ended') || baseError.message?.includes('Game is not active')) {
      return {
        title: 'Game Ended',
        message: 'This game has already finished. Please start a new game.',
        retryable: false,
        code: 'GAME_ERROR'
      };
    }
    
    // Not player's turn
    if (baseError.message?.includes('Not your turn')) {
      return {
        title: 'Wait Your Turn',
        message: 'Please wait for your opponent to make their move.',
        retryable: false,
        code: 'GAME_ERROR'
      };
    }
    
    // Access denied
    if (baseError.message?.includes('Access denied')) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this game.',
        retryable: false,
        code: 'GAME_ERROR'
      };
    }
    
    return baseError;
  }

  /**
   * Create a retry function with exponential backoff
   */
  static createRetryFunction(
    originalFunction: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): () => Promise<any> {
    return async () => {
      let lastError: any;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await originalFunction();
        } catch (error) {
          lastError = error;
          
          // Don't retry on the last attempt
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Don't retry validation errors or non-retryable errors
          const errorInfo = this.parseApiError(error);
          if (!errorInfo.retryable) {
            throw error;
          }
          
          // Wait with exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    };
  }
}

/**
 * Utility function to safely make API calls with error handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<Response>,
  errorContext: string = 'API call'
): Promise<T> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        throw errorData;
      } catch (parseError) {
        // If we can't parse the error, create a generic one
        throw {
          success: false,
          error: `${errorContext} failed with status ${response.status}`,
          code: 'SERVER_ERROR',
          retryable: response.status >= 500
        };
      }
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw data;
    }
    
    return data.data || data;
  } catch (error) {
    // Re-throw API errors as-is
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        success: false,
        error: 'Network connection failed',
        code: 'NETWORK_ERROR',
        retryable: true
      };
    }
    
    // Handle other errors
    throw {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'SERVER_ERROR',
      retryable: true
    };
  }
}

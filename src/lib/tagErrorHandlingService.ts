/**
 * Tag error handling service with retry mechanisms and graceful degradation
 * Handles network errors, operation failures, and provides user-friendly feedback
 */

import { TagValidationError, TagOperationResult } from './tagValidationService';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ErrorContext {
  operation: string;
  timestamp: number;
  userId?: string;
  tradeId?: string;
  tags?: string[];
}

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  recoveryAction?: () => Promise<any>;
  fallbackData?: any;
  userMessage: string;
}

export class TagErrorHandlingService {
  private static instance: TagErrorHandlingService;
  private errorLog: Array<{ context: ErrorContext; error: Error; resolved: boolean }> = [];
  
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private constructor() {}

  public static getInstance(): TagErrorHandlingService {
    if (!TagErrorHandlingService.instance) {
      TagErrorHandlingService.instance = new TagErrorHandlingService();
    }
    return TagErrorHandlingService.instance;
  }

  /**
   * Executes an operation with retry logic and error handling
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<TagOperationResult<T>> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Mark any previous errors for this operation as resolved
        this.markErrorsResolved(context);
        
        return {
          success: true,
          data: result,
          errors: [],
          retryable: false
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log the error
        this.logError(context, lastError);
        
        // Check if we should retry
        if (attempt < config.maxAttempts && this.isRetryableError(lastError)) {
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
            config.maxDelay
          );
          
          await this.delay(delay);
          continue;
        }
        
        // Final attempt failed or error is not retryable
        break;
      }
    }

    // All attempts failed
    const tagError = this.convertToTagValidationError(lastError!, context);
    const recoveryStrategy = this.getErrorRecoveryStrategy(lastError!, context);
    
    return {
      success: false,
      data: recoveryStrategy.fallbackData,
      errors: [tagError],
      retryable: recoveryStrategy.canRecover
    };
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /temporary/i,
      /rate.?limit/i,
      /server.?error/i,
      /503/,
      /502/,
      /504/
    ];

    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Converts a generic error to a TagValidationError
   */
  private convertToTagValidationError(error: Error, context: ErrorContext): TagValidationError {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.',
        severity: 'error'
      };
    }
    
    if (errorMessage.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Operation timed out. Please try again.',
        severity: 'error'
      };
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return {
        code: 'PERMISSION_ERROR',
        message: 'You do not have permission to perform this action.',
        severity: 'error'
      };
    }
    
    if (errorMessage.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please wait a moment and try again.',
        severity: 'error'
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: `An unexpected error occurred during ${context.operation}: ${error.message}`,
      severity: 'error'
    };
  }

  /**
   * Gets recovery strategy for different types of errors
   */
  private getErrorRecoveryStrategy(error: Error, context: ErrorContext): ErrorRecoveryStrategy {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return {
        canRecover: true,
        userMessage: 'Connection issue detected. You can try again or continue working offline.',
        fallbackData: this.getOfflineFallbackData(context)
      };
    }
    
    if (errorMessage.includes('rate limit')) {
      return {
        canRecover: true,
        userMessage: 'Please wait a moment before trying again.',
        recoveryAction: () => this.delay(5000)
      };
    }
    
    if (errorMessage.includes('permission')) {
      return {
        canRecover: false,
        userMessage: 'You do not have permission to perform this action. Please contact support.'
      };
    }

    return {
      canRecover: true,
      userMessage: 'An error occurred. Please try again.',
      fallbackData: this.getOfflineFallbackData(context)
    };
  }

  /**
   * Provides fallback data for offline scenarios
   */
  private getOfflineFallbackData(context: ErrorContext): any {
    switch (context.operation) {
      case 'loadTags':
        return this.getCachedTags();
      case 'saveTags':
        return this.queueTagsForLaterSync(context.tags || []);
      case 'searchTags':
        return this.getOfflineTagSearch(context);
      default:
        return null;
    }
  }

  /**
   * Gets cached tags from localStorage
   */
  private getCachedTags(): string[] {
    try {
      const cached = localStorage.getItem('cachedTags');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /**
   * Queues tags for later synchronization
   */
  private queueTagsForLaterSync(tags: string[]): boolean {
    try {
      const queue = this.getSyncQueue();
      queue.push({
        operation: 'saveTags',
        tags,
        timestamp: Date.now()
      });
      localStorage.setItem('tagSyncQueue', JSON.stringify(queue));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the synchronization queue
   */
  private getSyncQueue(): Array<{ operation: string; tags: string[]; timestamp: number }> {
    try {
      const queue = localStorage.getItem('tagSyncQueue');
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }

  /**
   * Performs offline tag search using cached data
   */
  private getOfflineTagSearch(context: ErrorContext): string[] {
    const cachedTags = this.getCachedTags();
    // Simple offline search implementation
    return cachedTags.filter(tag => 
      tag.toLowerCase().includes((context as any).searchQuery?.toLowerCase() || '')
    );
  } 
 /**
   * Logs an error for debugging and monitoring
   */
  private logError(context: ErrorContext, error: Error): void {
    const errorEntry = {
      context: { ...context, timestamp: Date.now() },
      error,
      resolved: false
    };
    
    this.errorLog.push(errorEntry);
    
    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Tag operation error:', {
        operation: context.operation,
        error: error.message,
        context
      });
    }
  }

  /**
   * Marks errors as resolved for a given context
   */
  private markErrorsResolved(context: ErrorContext): void {
    this.errorLog.forEach(entry => {
      if (entry.context.operation === context.operation && 
          entry.context.tradeId === context.tradeId) {
        entry.resolved = true;
      }
    });
  }

  /**
   * Gets recent unresolved errors
   */
  public getRecentErrors(limit: number = 10): Array<{ context: ErrorContext; error: Error }> {
    return this.errorLog
      .filter(entry => !entry.resolved)
      .slice(-limit)
      .map(entry => ({ context: entry.context, error: entry.error }));
  }

  /**
   * Clears resolved errors from the log
   */
  public clearResolvedErrors(): void {
    this.errorLog = this.errorLog.filter(entry => !entry.resolved);
  }

  /**
   * Handles graceful degradation for tag operations
   */
  public async handleGracefulDegradation<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T> | T,
    context: ErrorContext
  ): Promise<TagOperationResult<T>> {
    try {
      // Try primary operation first
      const result = await this.executeWithRetry(primaryOperation, context);
      
      if (result.success) {
        return result;
      }
      
      // Primary failed, try fallback
      const fallbackResult = await fallbackOperation();
      
      return {
        success: true,
        data: fallbackResult,
        errors: [{
          code: 'FALLBACK_USED',
          message: 'Primary operation failed, using cached data',
          severity: 'warning'
        }],
        retryable: true
      };
      
    } catch (error) {
      const tagError = this.convertToTagValidationError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      
      return {
        success: false,
        errors: [tagError],
        retryable: this.isRetryableError(error instanceof Error ? error : new Error(String(error)))
      };
    }
  }

  /**
   * Processes queued operations when connection is restored
   */
  public async processSyncQueue(): Promise<TagOperationResult<number>> {
    const queue = this.getSyncQueue();
    
    if (queue.length === 0) {
      return {
        success: true,
        data: 0,
        errors: [],
        retryable: false
      };
    }

    let processedCount = 0;
    const errors: TagValidationError[] = [];

    for (const item of queue) {
      try {
        // Process each queued operation
        // This would integrate with the actual tag service
        await this.delay(100); // Prevent overwhelming the server
        processedCount++;
      } catch (error) {
        errors.push({
          code: 'SYNC_ERROR',
          message: `Failed to sync operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        });
      }
    }

    // Clear processed items from queue
    if (processedCount > 0) {
      const remainingQueue = queue.slice(processedCount);
      localStorage.setItem('tagSyncQueue', JSON.stringify(remainingQueue));
    }

    return {
      success: errors.length === 0,
      data: processedCount,
      errors,
      retryable: errors.length > 0
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets error statistics for monitoring
   */
  public getErrorStatistics(): {
    totalErrors: number;
    unresolvedErrors: number;
    errorsByType: Record<string, number>;
    recentErrorRate: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = this.errorLog.filter(entry => entry.context.timestamp > oneHourAgo);
    const unresolvedErrors = this.errorLog.filter(entry => !entry.resolved);
    
    const errorsByType: Record<string, number> = {};
    this.errorLog.forEach(entry => {
      const errorType = entry.error.constructor.name;
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      unresolvedErrors: unresolvedErrors.length,
      errorsByType,
      recentErrorRate: recentErrors.length
    };
  }
}

// Export singleton instance
export const tagErrorHandlingService = TagErrorHandlingService.getInstance();
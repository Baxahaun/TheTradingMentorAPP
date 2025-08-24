import { errorHandlingService, TradeReviewErrorType } from './errorHandlingService';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryOperation<T> {
  id: string;
  operation: () => Promise<T>;
  config: RetryConfig;
  attempts: number;
  lastError?: any;
  nextRetryAt?: number;
}

class RetryService {
  private static instance: RetryService;
  private activeOperations: Map<string, RetryOperation<any>> = new Map();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  private getDefaultConfig(): RetryConfig {
    return {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryCondition: (error) => this.isRetryableError(error)
    };
  }

  private isRetryableError(error: any): boolean {
    // Network errors
    if (error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError') {
      return true;
    }

    // HTTP status codes that are retryable
    if (error?.status) {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(error.status);
    }

    // Firebase errors that are retryable
    if (error?.code) {
      const retryableFirebaseCodes = [
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'internal',
        'unknown'
      ];
      return retryableFirebaseCodes.includes(error.code);
    }

    // Trade review specific errors
    if (error?.type) {
      const retryableTypes = [
        TradeReviewErrorType.SAVE_FAILED,
        TradeReviewErrorType.CHART_UPLOAD_FAILED,
        TradeReviewErrorType.NETWORK_ERROR,
        TradeReviewErrorType.PERFORMANCE_CALCULATION_ERROR
      ];
      return retryableTypes.includes(error.type);
    }

    return false;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  async executeWithRetry<T>(
    operationId: string,
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const finalConfig = { ...this.getDefaultConfig(), ...config };
    
    const retryOperation: RetryOperation<T> = {
      id: operationId,
      operation,
      config: finalConfig,
      attempts: 0
    };

    this.activeOperations.set(operationId, retryOperation);

    try {
      return await this.attemptOperation(retryOperation);
    } finally {
      this.cleanup(operationId);
    }
  }

  private async attemptOperation<T>(retryOperation: RetryOperation<T>): Promise<T> {
    retryOperation.attempts++;

    try {
      const result = await retryOperation.operation();
      return result;
    } catch (error) {
      retryOperation.lastError = error;

      // Check if we should retry
      const shouldRetry = 
        retryOperation.attempts < retryOperation.config.maxAttempts &&
        (retryOperation.config.retryCondition?.(error) ?? this.isRetryableError(error));

      if (!shouldRetry) {
        // Log final failure
        errorHandlingService.handleError(
          errorHandlingService.createError(
            this.getErrorTypeFromError(error),
            `Operation failed after ${retryOperation.attempts} attempts: ${error.message}`,
            { originalError: error, operationId: retryOperation.id }
          )
        );
        throw error;
      }

      // Calculate delay and schedule retry
      const delay = this.calculateDelay(retryOperation.attempts, retryOperation.config);
      retryOperation.nextRetryAt = Date.now() + delay;

      // Call retry callback if provided
      retryOperation.config.onRetry?.(retryOperation.attempts, error);

      // Log retry attempt
      console.log(`Retrying operation ${retryOperation.id} (attempt ${retryOperation.attempts + 1}/${retryOperation.config.maxAttempts}) in ${delay}ms`);

      // Wait and retry
      await this.delay(delay);
      return this.attemptOperation(retryOperation);
    }
  }

  private getErrorTypeFromError(error: any): TradeReviewErrorType {
    if (error?.type && Object.values(TradeReviewErrorType).includes(error.type)) {
      return error.type;
    }

    // Map common error patterns to trade review error types
    if (error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError') {
      return TradeReviewErrorType.NETWORK_ERROR;
    }

    if (error?.status === 403 || error?.code === 'permission-denied') {
      return TradeReviewErrorType.PERMISSION_DENIED;
    }

    return TradeReviewErrorType.NETWORK_ERROR; // Default fallback
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanup(operationId: string): void {
    this.activeOperations.delete(operationId);
    
    const timeout = this.retryTimeouts.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(operationId);
    }
  }

  // Utility methods for common operations
  async retrySaveOperation<T>(
    operationId: string,
    saveFunction: () => Promise<T>
  ): Promise<T> {
    return this.executeWithRetry(
      operationId,
      saveFunction,
      {
        maxAttempts: 5,
        baseDelay: 1000,
        backoffMultiplier: 1.5,
        onRetry: (attempt, error) => {
          console.log(`Save operation retry ${attempt}: ${error.message}`);
        }
      }
    );
  }

  async retryUploadOperation<T>(
    operationId: string,
    uploadFunction: () => Promise<T>
  ): Promise<T> {
    return this.executeWithRetry(
      operationId,
      uploadFunction,
      {
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        onRetry: (attempt, error) => {
          console.log(`Upload operation retry ${attempt}: ${error.message}`);
        }
      }
    );
  }

  async retryNetworkOperation<T>(
    operationId: string,
    networkFunction: () => Promise<T>
  ): Promise<T> {
    return this.executeWithRetry(
      operationId,
      networkFunction,
      {
        maxAttempts: 4,
        baseDelay: 500,
        maxDelay: 8000,
        backoffMultiplier: 2,
        retryCondition: (error) => {
          // Only retry on network-related errors
          return this.isNetworkError(error);
        },
        onRetry: (attempt, error) => {
          console.log(`Network operation retry ${attempt}: ${error.message}`);
        }
      }
    );
  }

  private isNetworkError(error: any): boolean {
    return (
      error?.code === 'NETWORK_ERROR' ||
      error?.name === 'NetworkError' ||
      error?.message?.includes('network') ||
      error?.message?.includes('fetch') ||
      !navigator.onLine
    );
  }

  // Status and monitoring
  getActiveOperations(): Array<{
    id: string;
    attempts: number;
    maxAttempts: number;
    nextRetryAt?: number;
    lastError?: string;
  }> {
    return Array.from(this.activeOperations.values()).map(op => ({
      id: op.id,
      attempts: op.attempts,
      maxAttempts: op.config.maxAttempts,
      nextRetryAt: op.nextRetryAt,
      lastError: op.lastError?.message
    }));
  }

  cancelOperation(operationId: string): void {
    this.cleanup(operationId);
  }

  cancelAllOperations(): void {
    const operationIds = Array.from(this.activeOperations.keys());
    operationIds.forEach(id => this.cleanup(id));
  }

  // Batch retry operations
  async retryBatch<T>(
    operations: Array<{
      id: string;
      operation: () => Promise<T>;
      config?: Partial<RetryConfig>;
    }>
  ): Promise<Array<{ id: string; result?: T; error?: any }>> {
    const results = await Promise.allSettled(
      operations.map(async ({ id, operation, config }) => {
        try {
          const result = await this.executeWithRetry(id, operation, config);
          return { id, result };
        } catch (error) {
          return { id, error };
        }
      })
    );

    return results.map((result, index) => {
      const operationId = operations[index].id;
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return { id: operationId, error: result.reason };
      }
    });
  }
}

export const retryService = RetryService.getInstance();
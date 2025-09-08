import { toast } from 'react-hot-toast';

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  entryId?: string;
  timestamp: string;
  userAgent: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private retryQueue: Map<string, () => Promise<void>> = new Map();
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle errors with user-friendly messages and appropriate actions
   */
  async handleError(error: Error, context: ErrorContext): Promise<void> {
    const errorInfo = this.categorizeError(error);
    
    // Log error for debugging
    console.error('Error occurred:', {
      error: error.message,
      context,
      stack: error.stack,
      category: errorInfo.category
    });

    // Show user-friendly message
    this.showUserFriendlyError(errorInfo, context);

    // Attempt auto-recovery if applicable
    if (errorInfo.isRecoverable) {
      await this.attemptAutoRecovery(error, context);
    }

    // Track error for analytics
    this.trackError(error, context, errorInfo);
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: ErrorContext
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryConfig.maxRetries || !this.isRetryableError(error as Error)) {
          throw error;
        }

        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );

        if (context) {
          this.showRetryNotification(attempt, retryConfig.maxRetries, delay);
        }

        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Queue operation for retry when conditions improve
   */
  async queueForRetry(
    operationId: string,
    operation: () => Promise<void>,
    context: ErrorContext
  ): Promise<void> {
    this.retryQueue.set(operationId, operation);
    
    toast.error(
      `Operation "${context.operation}" failed. It will be retried automatically when conditions improve.`,
      {
        duration: 5000,
        id: `queue-${operationId}`
      }
    );
  }

  /**
   * Process retry queue
   */
  async processRetryQueue(): Promise<void> {
    const operations = Array.from(this.retryQueue.entries());
    
    for (const [operationId, operation] of operations) {
      try {
        await operation();
        this.retryQueue.delete(operationId);
        toast.dismiss(`queue-${operationId}`);
        toast.success('Queued operation completed successfully');
      } catch (error) {
        // Keep in queue for next attempt
        console.warn(`Retry failed for operation ${operationId}:`, error);
      }
    }
  }

  /**
   * Show user-friendly error messages
   */
  private showUserFriendlyError(errorInfo: any, context: ErrorContext): void {
    const message = this.getUserFriendlyMessage(errorInfo, context);
    
    switch (errorInfo.severity) {
      case 'critical':
        toast.error(message, {
          duration: 8000,
          id: `error-${context.operation}`
        });
        break;
      case 'warning':
        toast.error(message, {
          duration: 5000,
          id: `warning-${context.operation}`
        });
        break;
      case 'info':
        toast(message, {
          duration: 3000,
          id: `info-${context.operation}`
        });
        break;
    }
  }

  /**
   * Categorize errors for appropriate handling
   */
  private categorizeError(error: Error): any {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        category: 'network',
        severity: 'warning',
        isRecoverable: true,
        userMessage: 'Connection issue detected. Your data is safe and will sync when connection is restored.'
      };
    }

    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return {
        category: 'auth',
        severity: 'critical',
        isRecoverable: false,
        userMessage: 'Authentication required. Please sign in again to continue.'
      };
    }

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return {
        category: 'validation',
        severity: 'warning',
        isRecoverable: true,
        userMessage: 'Please check your input and try again.'
      };
    }

    if (error.message.includes('quota') || error.message.includes('limit')) {
      return {
        category: 'quota',
        severity: 'warning',
        isRecoverable: false,
        userMessage: 'Storage limit reached. Please free up space or upgrade your plan.'
      };
    }

    return {
      category: 'unknown',
      severity: 'critical',
      isRecoverable: false,
      userMessage: 'An unexpected error occurred. Please try again or contact support if the issue persists.'
    };
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(errorInfo: any, context: ErrorContext): string {
    const operationContext = this.getOperationContext(context.operation);
    return `${operationContext}: ${errorInfo.userMessage}`;
  }

  /**
   * Get operation-specific context
   */
  private getOperationContext(operation: string): string {
    const contexts: Record<string, string> = {
      'save_journal': 'Saving journal entry',
      'load_journal': 'Loading journal entry',
      'upload_image': 'Uploading image',
      'delete_entry': 'Deleting entry',
      'sync_data': 'Syncing data',
      'export_data': 'Exporting data',
      'validate_input': 'Validating input'
    };

    return contexts[operation] || 'Processing request';
  }

  /**
   * Attempt auto-recovery for recoverable errors
   */
  private async attemptAutoRecovery(error: Error, context: ErrorContext): Promise<void> {
    if (error.message.includes('network')) {
      // Queue for retry when network is restored
      await this.queueForRetry(
        `recovery-${context.operation}-${Date.now()}`,
        async () => {
          // This would be the original operation
          console.log('Auto-recovery: Retrying network operation');
        },
        context
      );
    }

    if (error.message.includes('auth')) {
      // Attempt token refresh
      try {
        // This would integrate with your auth service
        console.log('Auto-recovery: Attempting token refresh');
      } catch (refreshError) {
        console.warn('Auto-recovery failed:', refreshError);
      }
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'rate limit',
      'server error'
    ];

    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Show retry notification
   */
  private showRetryNotification(attempt: number, maxRetries: number, delay: number): void {
    toast.loading(
      `Retrying operation (${attempt}/${maxRetries}) in ${Math.round(delay / 1000)}s...`,
      {
        duration: delay,
        id: 'retry-notification'
      }
    );
  }

  /**
   * Track error for analytics
   */
  private trackError(error: Error, context: ErrorContext, errorInfo: any): void {
    // This would integrate with your analytics service
    console.log('Error tracked:', {
      message: error.message,
      category: errorInfo.category,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear retry queue
   */
  clearRetryQueue(): void {
    this.retryQueue.clear();
  }

  /**
   * Get retry queue status
   */
  getRetryQueueStatus(): { count: number; operations: string[] } {
    return {
      count: this.retryQueue.size,
      operations: Array.from(this.retryQueue.keys())
    };
  }
}

export default ErrorHandlingService;
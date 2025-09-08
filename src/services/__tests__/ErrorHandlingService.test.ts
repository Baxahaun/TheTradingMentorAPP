import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorHandlingService, { ErrorContext, RetryConfig } from '../ErrorHandlingService';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }
}));

describe('ErrorHandlingService', () => {
  let errorService: ErrorHandlingService;
  let mockConsoleError: any;
  let mockConsoleWarn: any;

  beforeEach(() => {
    errorService = ErrorHandlingService.getInstance();
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorService.clearRetryQueue();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('handleError', () => {
    it('should handle network errors with appropriate messaging', async () => {
      const error = new Error('network connection failed');
      const context: ErrorContext = {
        operation: 'save_journal',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.handleError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          error: 'network connection failed',
          context,
          category: 'network'
        })
      );
    });

    it('should handle authentication errors', async () => {
      const error = new Error('unauthorized access');
      const context: ErrorContext = {
        operation: 'load_journal',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.handleError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          category: 'auth'
        })
      );
    });

    it('should handle validation errors', async () => {
      const error = new Error('validation failed for field');
      const context: ErrorContext = {
        operation: 'validate_input',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.handleError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          category: 'validation'
        })
      );
    });
  });

  describe('retryOperation', () => {
    it('should retry operation with exponential backoff', async () => {
      let attemptCount = 0;
      const mockOperation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('network timeout');
        }
        return 'success';
      });

      const config: RetryConfig = {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2
      };

      const result = await errorService.retryOperation(mockOperation, config);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('network timeout error'));
      
      const config: RetryConfig = {
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      };

      await expect(
        errorService.retryOperation(mockOperation, config)
      ).rejects.toThrow('network timeout error');

      // Should be called maxRetries times (2 in this case)
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('validation error'));
      
      await expect(
        errorService.retryOperation(mockOperation)
      ).rejects.toThrow('validation error');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('queueForRetry', () => {
    it('should queue operations for retry', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      const context: ErrorContext = {
        operation: 'sync_data',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.queueForRetry('test-op', mockOperation, context);

      const status = errorService.getRetryQueueStatus();
      expect(status.count).toBe(1);
      expect(status.operations).toContain('test-op');
    });

    it('should process retry queue successfully', async () => {
      const mockOperation1 = vi.fn().mockResolvedValue('success1');
      const mockOperation2 = vi.fn().mockResolvedValue('success2');
      const context: ErrorContext = {
        operation: 'test',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.queueForRetry('op1', mockOperation1, context);
      await errorService.queueForRetry('op2', mockOperation2, context);

      await errorService.processRetryQueue();

      expect(mockOperation1).toHaveBeenCalled();
      expect(mockOperation2).toHaveBeenCalled();
      
      const status = errorService.getRetryQueueStatus();
      expect(status.count).toBe(0);
    });

    it('should keep failed operations in queue', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('still failing'));
      const context: ErrorContext = {
        operation: 'test',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.queueForRetry('failing-op', mockOperation, context);
      await errorService.processRetryQueue();

      const status = errorService.getRetryQueueStatus();
      expect(status.count).toBe(1);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Retry failed for operation failing-op:',
        expect.any(Error)
      );
    });
  });

  describe('error categorization', () => {
    it('should categorize network errors correctly', async () => {
      const networkErrors = [
        'network connection failed',
        'fetch request timeout',
        'connection refused'
      ];

      for (const errorMessage of networkErrors) {
        const error = new Error(errorMessage);
        const context: ErrorContext = {
          operation: 'test',
          timestamp: new Date().toISOString(),
          userAgent: 'test-agent'
        };

        await errorService.handleError(error, context);

        expect(mockConsoleError).toHaveBeenCalledWith(
          'Error occurred:',
          expect.objectContaining({
            category: 'network'
          })
        );
      }
    });

    it('should categorize quota errors correctly', async () => {
      const error = new Error('storage quota exceeded');
      const context: ErrorContext = {
        operation: 'upload_image',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.handleError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          category: 'quota'
        })
      );
    });

    it('should categorize unknown errors correctly', async () => {
      const error = new Error('some unexpected error');
      const context: ErrorContext = {
        operation: 'unknown_operation',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.handleError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          category: 'unknown'
        })
      );
    });
  });

  describe('retry queue management', () => {
    it('should clear retry queue', () => {
      const mockOperation = vi.fn();
      const context: ErrorContext = {
        operation: 'test',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      errorService.queueForRetry('test-op', mockOperation, context);
      expect(errorService.getRetryQueueStatus().count).toBe(1);

      errorService.clearRetryQueue();
      expect(errorService.getRetryQueueStatus().count).toBe(0);
    });

    it('should provide accurate queue status', async () => {
      const mockOperation1 = vi.fn();
      const mockOperation2 = vi.fn();
      const context: ErrorContext = {
        operation: 'test',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      };

      await errorService.queueForRetry('op1', mockOperation1, context);
      await errorService.queueForRetry('op2', mockOperation2, context);

      const status = errorService.getRetryQueueStatus();
      expect(status.count).toBe(2);
      expect(status.operations).toEqual(['op1', 'op2']);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorHandlingService.getInstance();
      const instance2 = ErrorHandlingService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
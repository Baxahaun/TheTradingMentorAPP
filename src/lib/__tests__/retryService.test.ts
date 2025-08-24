import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { retryService } from '../retryService';
import { TradeReviewErrorType } from '../errorHandlingService';

describe('RetryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    retryService.cancelAllOperations();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Retry Logic', () => {
    it('should execute operation successfully on first attempt', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await retryService.executeWithRetry(
        'test-op-1',
        mockOperation
      );
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await retryService.executeWithRetry(
        'test-op-2',
        mockOperation,
        {
          maxAttempts: 3,
          baseDelay: 10,
          retryCondition: (error) => error.message.includes('Network')
        }
      );
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Validation error'));
      
      await expect(
        retryService.executeWithRetry(
          'test-op-3',
          mockOperation,
          {
            maxAttempts: 3,
            retryCondition: (error) => error.message.includes('Network')
          }
        )
      ).rejects.toThrow('Validation error');
      
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        retryService.executeWithRetry(
          'test-op-4',
          mockOperation,
          {
            maxAttempts: 2,
            baseDelay: 10,
            retryCondition: (error) => error.message.includes('Network')
          }
        )
      ).rejects.toThrow('Network error');
      
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Backoff Strategy', () => {
    it('should implement exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      }) as any;
      
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      await retryService.executeWithRetry(
        'test-backoff',
        mockOperation,
        {
          maxAttempts: 3,
          baseDelay: 100,
          backoffMultiplier: 2,
          retryCondition: () => true
        }
      );
      
      expect(delays).toEqual([100, 200]); // 100 * 2^0, 100 * 2^1
      
      global.setTimeout = originalSetTimeout;
    });

    it('should respect max delay', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;
      
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      await retryService.executeWithRetry(
        'test-max-delay',
        mockOperation,
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 1500,
          backoffMultiplier: 3,
          retryCondition: () => true
        }
      );
      
      expect(delays[0]).toBe(1000); // 1000 * 3^0
      expect(delays[1]).toBe(1500); // min(1000 * 3^1, 1500) = 1500
      
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Error Type Detection', () => {
    it('should detect retryable network errors', async () => {
      const networkErrors = [
        { code: 'NETWORK_ERROR' },
        { name: 'NetworkError' },
        { status: 500 },
        { status: 502 },
        { status: 503 },
        { status: 504 },
        { code: 'unavailable' }, // Firebase error
        { type: TradeReviewErrorType.NETWORK_ERROR }
      ];
      
      for (const error of networkErrors) {
        const mockOperation = vi.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');
        
        const result = await retryService.executeWithRetry(
          `test-error-${JSON.stringify(error)}`,
          mockOperation,
          { maxAttempts: 2, baseDelay: 10 }
        );
        
        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(2);
      }
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableErrors = [
        { status: 400 },
        { status: 401 },
        { status: 403 },
        { status: 404 },
        { code: 'permission-denied' },
        { type: TradeReviewErrorType.VALIDATION_ERROR }
      ];
      
      for (const error of nonRetryableErrors) {
        const mockOperation = vi.fn().mockRejectedValue(error);
        
        await expect(
          retryService.executeWithRetry(
            `test-non-retryable-${JSON.stringify(error)}`,
            mockOperation,
            { maxAttempts: 3, baseDelay: 10 }
          )
        ).rejects.toEqual(error);
        
        expect(mockOperation).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Specialized Retry Methods', () => {
    it('should handle save operations with appropriate config', async () => {
      const mockSave = vi.fn()
        .mockRejectedValueOnce({ code: 'NETWORK_ERROR' })
        .mockResolvedValue('saved');
      
      const result = await retryService.retrySaveOperation('save-test', mockSave);
      
      expect(result).toBe('saved');
      expect(mockSave).toHaveBeenCalledTimes(2);
    });

    it('should handle upload operations with appropriate config', async () => {
      const mockUpload = vi.fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValue('uploaded');
      
      const result = await retryService.retryUploadOperation('upload-test', mockUpload);
      
      expect(result).toBe('uploaded');
      expect(mockUpload).toHaveBeenCalledTimes(2);
    });

    it('should handle network operations with network-specific retry logic', async () => {
      const mockNetwork = vi.fn()
        .mockRejectedValueOnce({ name: 'NetworkError' })
        .mockResolvedValue('network-success');
      
      const result = await retryService.retryNetworkOperation('network-test', mockNetwork);
      
      expect(result).toBe('network-success');
      expect(mockNetwork).toHaveBeenCalledTimes(2);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch retry operations', async () => {
      const operations = [
        {
          id: 'op1',
          operation: vi.fn().mockResolvedValue('result1')
        },
        {
          id: 'op2',
          operation: vi.fn()
            .mockRejectedValueOnce({ code: 'NETWORK_ERROR' })
            .mockResolvedValue('result2')
        },
        {
          id: 'op3',
          operation: vi.fn().mockRejectedValue(new Error('Fatal error'))
        }
      ];
      
      const results = await retryService.retryBatch(operations.map(op => ({
        ...op,
        config: { maxAttempts: 2, baseDelay: 10 }
      })));
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ id: 'op1', result: 'result1' });
      expect(results[1]).toEqual({ id: 'op2', result: 'result2' });
      expect(results[2]).toEqual({ id: 'op3', error: expect.any(Error) });
    });
  });

  describe('Operation Management', () => {
    it('should track active operations', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 100));
      
      const promise = retryService.executeWithRetry('slow-op', slowOperation);
      
      const activeOps = retryService.getActiveOperations();
      expect(activeOps).toHaveLength(1);
      expect(activeOps[0].id).toBe('slow-op');
      
      await promise;
      
      const activeOpsAfter = retryService.getActiveOperations();
      expect(activeOpsAfter).toHaveLength(0);
    });

    it('should cancel operations', async () => {
      const neverResolve = () => new Promise(() => {}); // Never resolves
      
      const promise = retryService.executeWithRetry('cancel-test', neverResolve);
      
      expect(retryService.getActiveOperations()).toHaveLength(1);
      
      retryService.cancelOperation('cancel-test');
      
      expect(retryService.getActiveOperations()).toHaveLength(0);
    });

    it('should cancel all operations', async () => {
      const neverResolve = () => new Promise(() => {});
      
      retryService.executeWithRetry('op1', neverResolve);
      retryService.executeWithRetry('op2', neverResolve);
      
      expect(retryService.getActiveOperations()).toHaveLength(2);
      
      retryService.cancelAllOperations();
      
      expect(retryService.getActiveOperations()).toHaveLength(0);
    });
  });

  describe('Retry Callbacks', () => {
    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const mockOperation = vi.fn()
        .mockRejectedValueOnce({ code: 'NETWORK_ERROR' })
        .mockResolvedValue('success');
      
      await retryService.executeWithRetry(
        'callback-test',
        mockOperation,
        {
          maxAttempts: 2,
          baseDelay: 10,
          onRetry
        }
      );
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });
});
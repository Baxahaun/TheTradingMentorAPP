import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagErrorHandlingService, tagErrorHandlingService } from '../tagErrorHandlingService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('TagErrorHandlingService', () => {
  let service: TagErrorHandlingService;

  beforeEach(() => {
    service = TagErrorHandlingService.getInstance();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const context = { operation: 'test', timestamp: Date.now() };

      const result = await service.executeWithRetry(operation, context);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      const context = { operation: 'test', timestamp: Date.now() };

      const result = await service.executeWithRetry(operation, context, { maxAttempts: 2, baseDelay: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));
      const context = { operation: 'test', timestamp: Date.now() };

      const result = await service.executeWithRetry(operation, context, { maxAttempts: 2, baseDelay: 10 });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('NETWORK_ERROR');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Permission denied'));
      const context = { operation: 'test', timestamp: Date.now() };

      const result = await service.executeWithRetry(operation, context, { maxAttempts: 3, baseDelay: 10 });

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success');
      const context = { operation: 'test', timestamp: Date.now() };

      const startTime = Date.now();
      const result = await service.executeWithRetry(operation, context, { 
        maxAttempts: 3, 
        baseDelay: 100,
        backoffMultiplier: 2
      });

      const endTime = Date.now();
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(300); // Should have waited at least 100 + 200 ms
    });
  }); 
 describe('handleGracefulDegradation', () => {
    it('should use primary operation when successful', async () => {
      const primaryOperation = vi.fn().mockResolvedValue('primary result');
      const fallbackOperation = vi.fn().mockResolvedValue('fallback result');
      const context = { operation: 'test', timestamp: Date.now() };

      const result = await service.handleGracefulDegradation(primaryOperation, fallbackOperation, context);

      expect(result.success).toBe(true);
      expect(result.data).toBe('primary result');
      expect(fallbackOperation).not.toHaveBeenCalled();
    });

    it('should use fallback when primary fails', async () => {
      const primaryOperation = vi.fn().mockRejectedValue(new Error('Network error'));
      const fallbackOperation = vi.fn().mockResolvedValue('fallback result');
      const context = { operation: 'test', timestamp: Date.now() };

      const result = await service.handleGracefulDegradation(primaryOperation, fallbackOperation, context);

      expect(result.success).toBe(true);
      expect(result.data).toBe('fallback result');
      expect(result.errors[0].code).toBe('FALLBACK_USED');
      expect(fallbackOperation).toHaveBeenCalled();
    });

    it('should fail when both primary and fallback fail', async () => {
      const primaryOperation = vi.fn().mockRejectedValue(new Error('Network error'));
      const fallbackOperation = vi.fn().mockRejectedValue(new Error('Fallback error'));
      const context = { operation: 'test', timestamp: Date.now() };

      const result = await service.handleGracefulDegradation(primaryOperation, fallbackOperation, context);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('processSyncQueue', () => {
    it('should return success when queue is empty', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await service.processSyncQueue();

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should process queued operations', async () => {
      const queue = [
        { operation: 'saveTags', tags: ['#test1'], timestamp: Date.now() },
        { operation: 'saveTags', tags: ['#test2'], timestamp: Date.now() }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(queue));

      const result = await service.processSyncQueue();

      expect(result.success).toBe(true);
      expect(result.data).toBe(2);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tagSyncQueue', JSON.stringify([]));
    });
  });

  describe('error logging and statistics', () => {
    it('should log errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      const context = { operation: 'test', timestamp: Date.now() };

      service.executeWithRetry(operation, context, { maxAttempts: 1, baseDelay: 1 });

      // Wait for async operation
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalled();
        process.env.NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
      }, 50);
    });

    it('should provide error statistics', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      const context = { operation: 'test', timestamp: Date.now() };

      await service.executeWithRetry(operation, context, { maxAttempts: 1, baseDelay: 1 });

      const stats = service.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.unresolvedErrors).toBeGreaterThan(0);
      expect(typeof stats.errorsByType).toBe('object');
      expect(typeof stats.recentErrorRate).toBe('number');
    });

    it('should get recent errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      const context = { operation: 'test', timestamp: Date.now() };

      await service.executeWithRetry(operation, context, { maxAttempts: 1, baseDelay: 1 });

      const recentErrors = service.getRecentErrors(5);
      expect(Array.isArray(recentErrors)).toBe(true);
    });

    it('should clear resolved errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValue('success');
      const context = { operation: 'test', timestamp: Date.now() };

      // First call fails, second succeeds
      await service.executeWithRetry(operation, context, { maxAttempts: 1, baseDelay: 1 });
      await service.executeWithRetry(operation, context, { maxAttempts: 1, baseDelay: 1 });

      service.clearResolvedErrors();
      const stats = service.getErrorStatistics();
      expect(stats.unresolvedErrors).toBe(0);
    });
  });

  describe('offline functionality', () => {
    it('should cache tags for offline use', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['#cached1', '#cached2']));

      const primaryOperation = vi.fn().mockRejectedValue(new Error('Network error'));
      const fallbackOperation = vi.fn().mockImplementation(() => {
        // Simulate getting cached tags
        const cached = localStorage.getItem('cachedTags');
        return cached ? JSON.parse(cached) : [];
      });
      const context = { operation: 'loadTags', timestamp: Date.now() };

      const result = await service.handleGracefulDegradation(primaryOperation, fallbackOperation, context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['#cached1', '#cached2']);
    });

    it('should queue tags for later sync', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      const primaryOperation = vi.fn().mockRejectedValue(new Error('Network error'));
      const fallbackOperation = vi.fn().mockReturnValue(true);
      const context = { operation: 'saveTags', timestamp: Date.now(), tags: ['#test'] };

      await service.handleGracefulDegradation(primaryOperation, fallbackOperation, context);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tagSyncQueue',
        expect.stringContaining('#test')
      );
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TagErrorHandlingService.getInstance();
      const instance2 = TagErrorHandlingService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should work with exported singleton', () => {
      expect(tagErrorHandlingService).toBe(TagErrorHandlingService.getInstance());
    });
  });
});
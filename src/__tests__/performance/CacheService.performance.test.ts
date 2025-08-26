/**
 * Performance tests for CacheService
 */

import { CacheService } from '../../services/CacheService';
import { performanceMonitor } from '../../services/PerformanceMonitoringService';

describe('CacheService Performance Tests', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      defaultTTL: 300000,
      maxSize: 10000,
      cleanupInterval: 60000
    });
  });

  afterEach(() => {
    cacheService.destroy();
  });

  describe('Basic Operations Performance', () => {
    test('should handle 10,000 cache operations within performance threshold', () => {
      const startTime = performance.now();
      
      // Set 10,000 items
      for (let i = 0; i < 10000; i++) {
        cacheService.set(`key-${i}`, { data: `value-${i}`, index: i });
      }
      
      const setTime = performance.now();
      
      // Get 10,000 items
      for (let i = 0; i < 10000; i++) {
        cacheService.get(`key-${i}`);
      }
      
      const getTime = performance.now();
      
      const setDuration = setTime - startTime;
      const getDuration = getTime - setTime;
      
      // Performance thresholds
      expect(setDuration).toBeLessThan(1000); // 1 second for 10k sets
      expect(getDuration).toBeLessThan(500);  // 0.5 seconds for 10k gets
      
      console.log(`Cache Performance:
        - Set 10k items: ${setDuration.toFixed(2)}ms
        - Get 10k items: ${getDuration.toFixed(2)}ms
        - Avg set time: ${(setDuration / 10000).toFixed(4)}ms per item
        - Avg get time: ${(getDuration / 10000).toFixed(4)}ms per item`);
    });

    test('should maintain performance with cache eviction', () => {
      const cacheWithSmallSize = new CacheService({ maxSize: 1000 });
      
      const startTime = performance.now();
      
      // Add more items than cache size to trigger eviction
      for (let i = 0; i < 5000; i++) {
        cacheWithSmallSize.set(`key-${i}`, { data: `value-${i}` });
      }
      
      const duration = performance.now() - startTime;
      
      // Should still be reasonably fast even with eviction
      expect(duration).toBeLessThan(2000); // 2 seconds
      expect(cacheWithSmallSize.getStats().size).toBeLessThanOrEqual(1000);
      
      cacheWithSmallSize.destroy();
    });
  });

  describe('Pattern Invalidation Performance', () => {
    test('should efficiently invalidate patterns', () => {
      // Set up cache with various patterns
      for (let i = 0; i < 1000; i++) {
        cacheService.set(`strategy:${i % 10}:performance`, { data: i });
        cacheService.set(`user:${i % 50}:data`, { data: i });
        cacheService.set(`other:${i}`, { data: i });
      }
      
      const startTime = performance.now();
      
      // Invalidate strategy pattern
      cacheService.invalidatePattern('strategy:*');
      
      const duration = performance.now() - startTime;
      
      // Should be fast even with pattern matching
      expect(duration).toBeLessThan(100); // 100ms
      
      // Verify correct items were invalidated
      expect(cacheService.get('strategy:1:performance')).toBeNull();
      expect(cacheService.get('user:1:data')).not.toBeNull();
      expect(cacheService.get('other:1')).not.toBeNull();
    });
  });

  describe('Memory Usage', () => {
    test('should not cause memory leaks with continuous operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 1000; i++) {
          cacheService.set(`temp-${cycle}-${i}`, { 
            data: new Array(100).fill(i),
            timestamp: Date.now()
          });
        }
        
        // Clear cache periodically
        if (cycle % 3 === 0) {
          cacheService.clear();
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory usage:
        - Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
        - Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
        - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Concurrent Access Performance', () => {
    test('should handle concurrent operations efficiently', async () => {
      const operations = 1000;
      const concurrency = 10;
      
      const startTime = performance.now();
      
      // Create concurrent operations
      const promises = Array.from({ length: concurrency }, async (_, threadId) => {
        for (let i = 0; i < operations / concurrency; i++) {
          const key = `thread-${threadId}-item-${i}`;
          cacheService.set(key, { threadId, item: i, data: new Array(10).fill(i) });
          
          // Simulate some async work
          await new Promise(resolve => setTimeout(resolve, 0));
          
          const retrieved = cacheService.get(key);
          expect(retrieved).not.toBeNull();
        }
      });
      
      await Promise.all(promises);
      
      const duration = performance.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
      
      console.log(`Concurrent operations:
        - ${operations} operations across ${concurrency} threads
        - Completed in: ${duration.toFixed(2)}ms
        - Avg time per operation: ${(duration / operations).toFixed(4)}ms`);
    });
  });

  describe('Cache Hit Rate Performance', () => {
    test('should maintain high hit rates under realistic usage', () => {
      const totalOperations = 10000;
      const uniqueKeys = 1000; // 10:1 ratio for realistic cache behavior
      
      let hits = 0;
      let misses = 0;
      
      // Simulate realistic access patterns
      for (let i = 0; i < totalOperations; i++) {
        const keyId = Math.floor(Math.random() * uniqueKeys);
        const key = `realistic-key-${keyId}`;
        
        const cached = cacheService.get(key);
        if (cached) {
          hits++;
        } else {
          misses++;
          cacheService.set(key, { 
            id: keyId, 
            data: `data-${keyId}`,
            accessCount: 1
          });
        }
      }
      
      const hitRate = (hits / totalOperations) * 100;
      
      // Should achieve reasonable hit rate
      expect(hitRate).toBeGreaterThan(50); // At least 50% hit rate
      
      console.log(`Cache hit rate test:
        - Total operations: ${totalOperations}
        - Hits: ${hits}
        - Misses: ${misses}
        - Hit rate: ${hitRate.toFixed(2)}%`);
    });
  });
});

describe('Performance Monitoring Integration', () => {
  test('should track cache performance metrics', () => {
    const cacheService = new CacheService();
    
    // Perform operations while monitoring
    performanceMonitor.measureExecutionTime('cache-bulk-operations', () => {
      for (let i = 0; i < 1000; i++) {
        cacheService.set(`perf-key-${i}`, { data: i });
        cacheService.get(`perf-key-${i}`);
      }
    });
    
    const stats = performanceMonitor.getStatistics('calculation');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBeGreaterThan(0);
    
    cacheService.destroy();
  });
});
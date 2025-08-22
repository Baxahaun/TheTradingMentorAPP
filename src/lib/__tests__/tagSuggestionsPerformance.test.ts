import { TagSuggestionsService } from '../tagSuggestionsService';
import { tagService, TagWithCount } from '../tagService';
import { Trade } from '../../types/trade';

describe('Tag Suggestions Performance Tests', () => {
  let service: TagSuggestionsService;
  let largeTrades: Trade[];
  let largeTagIndex: Map<string, TagWithCount>;

  beforeAll(() => {
    service = TagSuggestionsService.getInstance();
    
    // Create a large dataset for performance testing
    largeTrades = [];
    const strategies = ['breakout', 'scalping', 'swing', 'reversal', 'momentum'];
    const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
    const sessions = ['asian', 'european', 'us', 'overlap'];
    
    for (let i = 0; i < 10000; i++) {
      const strategy = strategies[i % strategies.length];
      const currencyPair = currencyPairs[i % currencyPairs.length];
      const session = sessions[i % sessions.length];
      
      largeTrades.push({
        id: `trade-${i}`,
        accountId: 'acc1',
        currencyPair,
        date: new Date(2024, 0, 1 + (i % 365)).toISOString().split('T')[0],
        timeIn: '09:00',
        side: i % 2 === 0 ? 'long' : 'short',
        entryPrice: 1.0950 + (Math.random() - 0.5) * 0.1,
        exitPrice: 1.0950 + (Math.random() - 0.5) * 0.1,
        lotSize: Math.random() * 2,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: (Math.random() - 0.5) * 1000,
        session: session as any,
        strategy,
        tags: [
          `#${strategy}`,
          `#${currencyPair.replace('/', '-').toLowerCase()}`,
          `#${session}-session`,
          i % 3 === 0 ? '#profitable' : '#loss',
          i % 5 === 0 ? '#high-confidence' : '#low-confidence',
          `#week-${Math.floor(i / 7) % 52}`,
          `#month-${Math.floor(i / 30) % 12}`
        ]
      });
    }

    // Create large tag index
    largeTagIndex = new Map();
    const tagCounts = new Map<string, number>();
    
    largeTrades.forEach(trade => {
      trade.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    tagCounts.forEach((count, tag) => {
      largeTagIndex.set(tag, {
        tag,
        count,
        lastUsed: largeTrades[largeTrades.length - 1].date,
        trades: []
      });
    });
  });

  beforeEach(() => {
    service.clearCache();
  });

  describe('Large Dataset Performance', () => {
    it('should handle 10k trades efficiently for intelligent suggestions', () => {
      const startTime = performance.now();
      
      const suggestions = service.getIntelligentSuggestions(
        'break',
        largeTrades,
        {},
        10
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      console.log(`Intelligent suggestions with 10k trades: ${duration.toFixed(2)}ms`);
    });

    it('should handle large tag index efficiently for optimized suggestions', () => {
      const startTime = performance.now();
      
      const suggestions = service.getOptimizedSuggestions(
        'break',
        largeTagIndex,
        {},
        10
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be very fast with pre-built index
      
      console.log(`Optimized suggestions with large index: ${duration.toFixed(2)}ms`);
    });

    it('should handle frequency-based suggestions efficiently', () => {
      const startTime = performance.now();
      
      const suggestions = service.getFrequencyBasedSuggestions(
        'profitable',
        largeTrades,
        20
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
      
      console.log(`Frequency-based suggestions with 10k trades: ${duration.toFixed(2)}ms`);
    });

    it('should handle recently used tags efficiently', () => {
      const startTime = performance.now();
      
      const suggestions = service.getRecentlyUsedTags(largeTrades, 20);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(300); // Should complete within 300ms
      
      console.log(`Recently used tags with 10k trades: ${duration.toFixed(2)}ms`);
    });

    it('should handle contextual suggestions efficiently', () => {
      const currentTrade = {
        currencyPair: 'EUR/USD',
        session: 'european' as const,
        strategy: 'breakout',
        side: 'long' as const
      };

      const startTime = performance.now();
      
      const suggestions = service.getContextualSuggestions(
        currentTrade,
        largeTrades,
        15
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(duration).toBeLessThan(400); // Should complete within 400ms
      
      console.log(`Contextual suggestions with 10k trades: ${duration.toFixed(2)}ms`);
    });

    it('should handle performance-based suggestions efficiently', () => {
      const startTime = performance.now();
      
      const suggestions = service.getPerformanceBasedSuggestions(largeTrades, 15);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(duration).toBeLessThan(800); // Should complete within 800ms (more complex calculation)
      
      console.log(`Performance-based suggestions with 10k trades: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Caching Performance', () => {
    it('should significantly improve performance with caching', () => {
      const input = 'breakout-test';
      const context = {
        currentTrade: { currencyPair: 'EUR/USD', strategy: 'breakout' }
      };

      // First call (no cache)
      const startTime1 = performance.now();
      const suggestions1 = service.getIntelligentSuggestions(input, largeTrades, context);
      const endTime1 = performance.now();
      const duration1 = endTime1 - startTime1;

      // Second call (with cache)
      const startTime2 = performance.now();
      const suggestions2 = service.getIntelligentSuggestions(input, largeTrades, context);
      const endTime2 = performance.now();
      const duration2 = endTime2 - startTime2;

      expect(suggestions1).toEqual(suggestions2);
      expect(duration2).toBeLessThan(duration1 * 0.1); // Cached should be at least 10x faster
      
      console.log(`First call: ${duration1.toFixed(2)}ms, Cached call: ${duration2.toFixed(2)}ms`);
      console.log(`Cache speedup: ${(duration1 / duration2).toFixed(1)}x`);
    });

    it('should handle cache with different inputs efficiently', () => {
      const inputs = ['break', 'scal', 'swing', 'profit', 'loss'];
      const durations: number[] = [];

      inputs.forEach(input => {
        const startTime = performance.now();
        service.getIntelligentSuggestions(input, largeTrades);
        const endTime = performance.now();
        durations.push(endTime - startTime);
      });

      // All calls should complete reasonably quickly
      durations.forEach(duration => {
        expect(duration).toBeLessThan(1000);
      });

      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      console.log(`Average duration for ${inputs.length} different inputs: ${avgDuration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated calls', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make many calls to test for memory leaks
      for (let i = 0; i < 100; i++) {
        service.getIntelligentSuggestions(`test-${i}`, largeTrades.slice(0, 1000));
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory increase should be reasonable (less than 50MB for 100 calls)
      expect(memoryIncreaseMB).toBeLessThan(50);
      
      console.log(`Memory increase after 100 calls: ${memoryIncreaseMB.toFixed(2)}MB`);
    });

    it('should clear cache effectively', () => {
      // Populate cache
      for (let i = 0; i < 50; i++) {
        service.getIntelligentSuggestions(`cache-test-${i}`, largeTrades.slice(0, 100));
      }

      const statsBeforeClear = service.getCacheStats();
      expect(statsBeforeClear.size).toBeGreaterThan(0);

      // Clear cache
      service.clearCache();

      const statsAfterClear = service.getCacheStats();
      expect(statsAfterClear.size).toBe(0);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with dataset size', () => {
      const sizes = [1000, 2000, 5000, 10000];
      const durations: number[] = [];

      sizes.forEach(size => {
        const subset = largeTrades.slice(0, size);
        
        const startTime = performance.now();
        service.getIntelligentSuggestions('test', subset);
        const endTime = performance.now();
        
        durations.push(endTime - startTime);
      });

      // Performance should scale reasonably (not exponentially)
      for (let i = 1; i < durations.length; i++) {
        const ratio = durations[i] / durations[i - 1];
        const sizeRatio = sizes[i] / sizes[i - 1];
        
        // Duration ratio should not be much higher than size ratio
        expect(ratio).toBeLessThan(sizeRatio * 2);
      }

      console.log('Scalability test results:');
      sizes.forEach((size, i) => {
        console.log(`${size} trades: ${durations[i].toFixed(2)}ms`);
      });
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises: Promise<any>[] = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          Promise.resolve(service.getIntelligentSuggestions(
            `concurrent-${i}`,
            largeTrades.slice(0, 1000)
          ))
        );
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });

      // Concurrent requests should not take much longer than sequential
      expect(duration).toBeLessThan(2000);
      
      console.log(`${concurrentRequests} concurrent requests: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty input efficiently', () => {
      const startTime = performance.now();
      
      const suggestions = service.getIntelligentSuggestions('', largeTrades);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(duration).toBeLessThan(200); // Should be fast for empty input
      
      console.log(`Empty input with 10k trades: ${duration.toFixed(2)}ms`);
    });

    it('should handle very long input efficiently', () => {
      const longInput = 'a'.repeat(1000);
      
      const startTime = performance.now();
      
      const suggestions = service.getIntelligentSuggestions(longInput, largeTrades);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(duration).toBeLessThan(300); // Should handle gracefully
      
      console.log(`Very long input with 10k trades: ${duration.toFixed(2)}ms`);
    });

    it('should handle special characters efficiently', () => {
      const specialInput = '#@$%^&*()[]{}|\\:";\'<>?,./';
      
      const startTime = performance.now();
      
      const suggestions = service.getIntelligentSuggestions(specialInput, largeTrades);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(suggestions).toBeDefined();
      expect(duration).toBeLessThan(200); // Should handle gracefully
      
      console.log(`Special characters input with 10k trades: ${duration.toFixed(2)}ms`);
    });
  });
});
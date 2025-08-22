import { describe, it, expect, beforeEach } from 'vitest';
import { TagService } from '../../tagService';
import { Trade } from '../../../types/trade';

describe('Tag System Performance Tests', () => {
  let tagService: TagService;

  beforeEach(() => {
    tagService = TagService.getInstance();
    tagService.resetIndex();
  });

  const generateLargeDataset = (tradeCount: number, tagPoolSize: number = 50): Trade[] => {
    const tagPool = Array.from({ length: tagPoolSize }, (_, i) => `#tag${i}`);
    const trades: Trade[] = [];

    for (let i = 0; i < tradeCount; i++) {
      // Randomly select 1-5 tags per trade
      const tagCount = Math.floor(Math.random() * 5) + 1;
      const tradeTags = tagPool
        .sort(() => 0.5 - Math.random())
        .slice(0, tagCount);

      trades.push({
        id: `trade-${i}`,
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        timeIn: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        side: i % 2 === 0 ? 'long' : 'short',
        entryPrice: 1.1000 + (Math.random() - 0.5) * 0.1,
        lotSize: Math.random() * 2 + 0.1,
        lotType: 'standard',
        units: 100000,
        commission: Math.random() * 10 + 1,
        accountCurrency: 'USD',
        status: Math.random() > 0.1 ? 'closed' : 'open',
        pnl: Math.random() > 0.1 ? (Math.random() - 0.5) * 500 : undefined,
        tags: tradeTags
      });
    }

    return trades;
  };

  describe('Index Building Performance', () => {
    it('should build index for 1,000 trades in under 100ms', () => {
      const trades = generateLargeDataset(1000);
      
      const startTime = performance.now();
      tagService.buildTagIndex(trades);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
      
      // Verify index was built correctly
      const tags = tagService.getAllTagsWithCounts(trades);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.length).toBeLessThanOrEqual(50); // Max tag pool size
    });

    it('should build index for 10,000 trades in under 500ms', () => {
      const trades = generateLargeDataset(10000);
      
      const startTime = performance.now();
      tagService.buildTagIndex(trades);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(500);
      
      // Verify index integrity
      const tags = tagService.getAllTagsWithCounts(trades);
      const totalTagUsage = tags.reduce((sum, tag) => sum + tag.count, 0);
      const actualTagUsage = trades.reduce((sum, trade) => sum + (trade.tags?.length || 0), 0);
      expect(totalTagUsage).toBe(actualTagUsage);
    });

    it('should handle incremental index updates efficiently', () => {
      const initialTrades = generateLargeDataset(5000);
      const additionalTrades = generateLargeDataset(1000);
      
      // Build initial index
      tagService.buildTagIndex(initialTrades);
      
      // Measure incremental update
      const startTime = performance.now();
      tagService.buildTagIndex([...initialTrades, ...additionalTrades]);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(300); // Should be faster than full rebuild
    });
  });

  describe('Filtering Performance', () => {
    let largeTrades: Trade[];

    beforeEach(() => {
      largeTrades = generateLargeDataset(5000, 30);
      tagService.buildTagIndex(largeTrades);
    });

    it('should filter 5,000 trades by single tag in under 50ms', () => {
      const filter = {
        includeTags: ['#tag0'],
        excludeTags: [],
        mode: 'OR' as const
      };

      const startTime = performance.now();
      const results = tagService.filterTradesByTags(largeTrades, filter);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50);
      expect(results.length).toBeGreaterThan(0);
      
      // Verify all results contain the tag
      results.forEach(trade => {
        expect(trade.tags).toContain('#tag0');
      });
    });

    it('should filter by multiple tags with AND logic in under 100ms', () => {
      const filter = {
        includeTags: ['#tag0', '#tag1', '#tag2'],
        excludeTags: [],
        mode: 'AND' as const
      };

      const startTime = performance.now();
      const results = tagService.filterTradesByTags(largeTrades, filter);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
      
      // Verify all results contain all required tags
      results.forEach(trade => {
        expect(trade.tags).toContain('#tag0');
        expect(trade.tags).toContain('#tag1');
        expect(trade.tags).toContain('#tag2');
      });
    });

    it('should filter by multiple tags with OR logic in under 75ms', () => {
      const filter = {
        includeTags: ['#tag0', '#tag1', '#tag2'],
        excludeTags: [],
        mode: 'OR' as const
      };

      const startTime = performance.now();
      const results = tagService.filterTradesByTags(largeTrades, filter);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(75);
      
      // Verify all results contain at least one required tag
      results.forEach(trade => {
        const hasRequiredTag = trade.tags?.some(tag => 
          ['#tag0', '#tag1', '#tag2'].includes(tag)
        );
        expect(hasRequiredTag).toBe(true);
      });
    });

    it('should handle complex filtering with exclusions in under 150ms', () => {
      const filter = {
        includeTags: ['#tag0', '#tag1'],
        excludeTags: ['#tag5', '#tag6'],
        mode: 'OR' as const
      };

      const startTime = performance.now();
      const results = tagService.filterTradesByTags(largeTrades, filter);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(150);
      
      // Verify results meet criteria
      results.forEach(trade => {
        const hasIncludedTag = trade.tags?.some(tag => 
          ['#tag0', '#tag1'].includes(tag)
        );
        const hasExcludedTag = trade.tags?.some(tag => 
          ['#tag5', '#tag6'].includes(tag)
        );
        expect(hasIncludedTag).toBe(true);
        expect(hasExcludedTag).toBe(false);
      });
    });
  });

  describe('Analytics Performance', () => {
    let largeTrades: Trade[];

    beforeEach(() => {
      largeTrades = generateLargeDataset(3000, 25);
      tagService.buildTagIndex(largeTrades);
    });

    it('should calculate full analytics for 3,000 trades in under 200ms', () => {
      const startTime = performance.now();
      const analytics = tagService.getTagAnalytics(largeTrades);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(200);

      // Verify analytics completeness
      expect(analytics.totalTags).toBeGreaterThan(0);
      expect(analytics.mostUsedTags.length).toBeGreaterThan(0);
      expect(analytics.recentTags.length).toBeGreaterThan(0);
      expect(analytics.tagPerformance.length).toBeGreaterThan(0);
    });

    it('should calculate individual tag performance in under 20ms', () => {
      const startTime = performance.now();
      const performance1 = tagService.calculateTagPerformance('#tag0', largeTrades);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(20);

      expect(performance1.totalTrades).toBeGreaterThan(0);
      expect(typeof performance1.winRate).toBe('number');
      expect(typeof performance1.averagePnL).toBe('number');
      expect(typeof performance1.profitFactor).toBe('number');
    });

    it('should get most used tags efficiently', () => {
      const startTime = performance.now();
      const mostUsed = tagService.getMostUsedTags(largeTrades, 10);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(30);

      expect(mostUsed).toHaveLength(10);
      
      // Verify sorting (most used first)
      for (let i = 1; i < mostUsed.length; i++) {
        expect(mostUsed[i].count).toBeLessThanOrEqual(mostUsed[i - 1].count);
      }
    });

    it('should get recent tags efficiently', () => {
      const startTime = performance.now();
      const recent = tagService.getRecentTags(largeTrades, 10);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(30);

      expect(recent).toHaveLength(10);
      
      // Verify sorting (most recent first) - skip if no recent tags
      if (recent.length > 1) {
        for (let i = 1; i < recent.length; i++) {
          const currentDate = new Date(recent[i].lastUsed).getTime();
          const previousDate = new Date(recent[i - 1].lastUsed).getTime();
          if (!isNaN(currentDate) && !isNaN(previousDate)) {
            expect(currentDate).toBeLessThanOrEqual(previousDate);
          }
        }
      }
    });
  });

  describe('Search and Suggestions Performance', () => {
    let largeTrades: Trade[];

    beforeEach(() => {
      largeTrades = generateLargeDataset(2000, 100); // More tags for search testing
      tagService.buildTagIndex(largeTrades);
    });

    it('should search tags in under 25ms', () => {
      const startTime = performance.now();
      const results = tagService.searchTags(largeTrades, 'tag1');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(25);

      expect(results.length).toBeGreaterThan(0);
      results.forEach(tag => {
        expect(tag.tag.toLowerCase()).toContain('tag1');
      });
    });

    it('should generate suggestions in under 30ms', () => {
      const startTime = performance.now();
      const suggestions = tagService.getTagSuggestions(largeTrades, 'tag', 20);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(30);

      expect(suggestions.length).toBeLessThanOrEqual(20);
      suggestions.forEach(suggestion => {
        expect(suggestion.toLowerCase()).toContain('tag');
      });
    });

    it('should handle empty search queries efficiently', () => {
      const startTime = performance.now();
      const allTags = tagService.searchTags(largeTrades, '');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(20);

      expect(allTags.length).toBe(100); // Should return all tags
    });

    it('should handle suggestions for empty input efficiently', () => {
      const startTime = performance.now();
      const suggestions = tagService.getTagSuggestions(largeTrades, '', 10);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(25);

      expect(suggestions).toHaveLength(10);
      // Should return most used tags
    });
  });

  describe('Memory Usage Performance', () => {
    it('should maintain reasonable memory usage with large datasets', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and process large dataset
      const largeTrades = generateLargeDataset(10000, 100);
      tagService.buildTagIndex(largeTrades);
      
      // Perform various operations
      tagService.getTagAnalytics(largeTrades);
      tagService.filterTradesByTags(largeTrades, {
        includeTags: ['#tag0', '#tag1'],
        excludeTags: [],
        mode: 'OR'
      });
      tagService.searchTags(largeTrades, 'tag');
      tagService.getTagSuggestions(largeTrades, 'tag', 20);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB for 10k trades)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should not leak memory with repeated operations', () => {
      const trades = generateLargeDataset(1000);
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform operations multiple times
      for (let i = 0; i < 50; i++) {
        tagService.buildTagIndex(trades);
        tagService.getTagAnalytics(trades);
        tagService.filterTradesByTags(trades, {
          includeTags: [`#tag${i % 10}`],
          excludeTags: [],
          mode: 'OR'
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent read operations efficiently', async () => {
      const trades = generateLargeDataset(2000);
      tagService.buildTagIndex(trades);
      
      const operations = [
        () => tagService.getTagAnalytics(trades),
        () => tagService.filterTradesByTags(trades, { includeTags: ['#tag0'], excludeTags: [], mode: 'OR' }),
        () => tagService.searchTags(trades, 'tag'),
        () => tagService.getTagSuggestions(trades, 'tag', 10),
        () => tagService.getMostUsedTags(trades, 5),
        () => tagService.getRecentTags(trades, 5)
      ];
      
      const startTime = performance.now();
      const results = await Promise.all(operations.map(op => Promise.resolve(op())));
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(300); // All operations should complete quickly
      
      // Verify all operations completed successfully
      expect(results).toHaveLength(6);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle mixed read/write operations safely', async () => {
      const initialTrades = generateLargeDataset(1000);
      const additionalTrades = generateLargeDataset(500);
      
      tagService.buildTagIndex(initialTrades);
      
      const operations = [
        () => tagService.buildTagIndex([...initialTrades, ...additionalTrades]),
        () => tagService.getTagAnalytics(initialTrades),
        () => tagService.filterTradesByTags(initialTrades, { includeTags: ['#tag0'], excludeTags: [], mode: 'OR' }),
        () => tagService.searchTags(initialTrades, 'tag')
      ];
      
      const startTime = performance.now();
      const results = await Promise.all(operations.map(op => Promise.resolve(op())));
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(400);
      
      // Verify operations completed without errors
      expect(results).toHaveLength(4);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle trades with many tags efficiently', () => {
      // Create trades with many tags each
      const tradesWithManyTags: Trade[] = Array.from({ length: 100 }, (_, i) => ({
        id: `trade-${i}`,
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01',
        timeIn: '09:00',
        side: 'long',
        entryPrice: 1.1000,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 100,
        tags: Array.from({ length: 50 }, (_, j) => `#tag${j}`) // 50 tags per trade
      }));
      
      const startTime = performance.now();
      tagService.buildTagIndex(tradesWithManyTags);
      const analytics = tagService.getTagAnalytics(tradesWithManyTags);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(200);
      
      expect(analytics.totalTags).toBe(50);
      expect(analytics.averageTagsPerTrade).toBe(50);
    });

    it('should handle trades with no tags efficiently', () => {
      const tradesWithoutTags: Trade[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `trade-${i}`,
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01',
        timeIn: '09:00',
        side: 'long',
        entryPrice: 1.1000,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 100,
        tags: []
      }));
      
      const startTime = performance.now();
      tagService.buildTagIndex(tradesWithoutTags);
      const analytics = tagService.getTagAnalytics(tradesWithoutTags);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50);
      
      expect(analytics.totalTags).toBe(0);
      expect(analytics.averageTagsPerTrade).toBe(0);
    });
  });
});
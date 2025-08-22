import { describe, it, expect, beforeEach } from 'vitest';
import { TagService } from '../../tagService';
import { Trade } from '../../../types/trade';

describe('Tag Workflow Integration Tests', () => {
  let tagService: TagService;
  let mockTrades: Trade[];

  beforeEach(() => {
    tagService = TagService.getInstance();
    tagService.resetIndex();
    
    mockTrades = [
      {
        id: '1',
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
        tags: ['#scalping', '#morning']
      },
      {
        id: '2',
        accountId: 'acc1',
        currencyPair: 'GBP/USD',
        date: '2024-01-02',
        timeIn: '14:00',
        side: 'short',
        entryPrice: 1.2500,
        lotSize: 0.5,
        lotType: 'standard',
        units: 50000,
        commission: 3,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: -50,
        tags: ['#scalping', '#afternoon', '#breakout']
      },
      {
        id: '3',
        accountId: 'acc1',
        currencyPair: 'USD/JPY',
        date: '2024-01-03',
        timeIn: '11:00',
        side: 'long',
        entryPrice: 110.50,
        lotSize: 2,
        lotType: 'standard',
        units: 200000,
        commission: 7,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 200,
        tags: ['#swing', '#morning', '#trend']
      },
      {
        id: '4',
        accountId: 'acc1',
        currencyPair: 'AUD/USD',
        date: '2024-01-04',
        timeIn: '16:00',
        side: 'long',
        entryPrice: 0.7500,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 4,
        accountCurrency: 'USD',
        status: 'open',
        tags: ['#swing', '#afternoon']
      }
    ];
  });

  describe('Complete Tag Lifecycle', () => {
    it('should handle complete tag lifecycle from creation to deletion', () => {
      // 1. Build initial index
      tagService.buildTagIndex(mockTrades);
      
      // 2. Verify all tags are indexed
      const allTags = tagService.getAllTagsWithCounts(mockTrades);
      expect(allTags).toHaveLength(6); // scalping, morning, afternoon, breakout, swing, trend
      
      // 3. Add new trade with new tags
      const newTrade: Trade = {
        id: '5',
        accountId: 'acc1',
        currencyPair: 'NZD/USD',
        date: '2024-01-05',
        timeIn: '10:00',
        side: 'short',
        entryPrice: 0.6500,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 75,
        tags: ['#newstrategy', '#experimental']
      };
      
      const updatedTrades = [...mockTrades, newTrade];
      tagService.buildTagIndex(updatedTrades);
      
      // 4. Verify new tags are added
      const updatedTags = tagService.getAllTagsWithCounts(updatedTrades);
      expect(updatedTags).toHaveLength(8);
      expect(updatedTags.find(t => t.tag === '#newstrategy')).toBeDefined();
      expect(updatedTags.find(t => t.tag === '#experimental')).toBeDefined();
      
      // 5. Remove trade and cleanup orphaned tags
      const finalTrades = mockTrades; // Remove the new trade
      const orphanedTags = tagService.cleanupOrphanedTags(finalTrades);
      
      // 6. Verify orphaned tags are identified
      expect(orphanedTags).toContain('#newstrategy');
      expect(orphanedTags).toContain('#experimental');
    });

    it('should maintain data consistency during bulk operations', () => {
      tagService.buildTagIndex(mockTrades);
      
      // Simulate bulk tag addition
      const bulkUpdatedTrades = mockTrades.map(trade => ({
        ...trade,
        tags: [...(trade.tags || []), '#bulkadded']
      }));
      
      tagService.buildTagIndex(bulkUpdatedTrades);
      
      // Verify bulk tag was added to all trades
      const bulkTag = tagService.getAllTagsWithCounts(bulkUpdatedTrades)
        .find(t => t.tag === '#bulkadded');
      
      expect(bulkTag).toBeDefined();
      expect(bulkTag!.count).toBe(4); // All 4 trades
      
      // Simulate bulk tag removal
      const bulkRemovedTrades = bulkUpdatedTrades.map(trade => ({
        ...trade,
        tags: trade.tags?.filter(tag => tag !== '#bulkadded') || []
      }));
      
      const orphaned = tagService.cleanupOrphanedTags(bulkRemovedTrades);
      expect(orphaned).toContain('#bulkadded');
    });
  });

  describe('Tag Filtering Workflows', () => {
    beforeEach(() => {
      tagService.buildTagIndex(mockTrades);
    });

    it('should handle complex filtering scenarios', () => {
      // Test AND filtering
      const andFilter = {
        includeTags: ['#scalping', '#morning'],
        excludeTags: [],
        mode: 'AND' as const
      };
      
      const andResults = tagService.filterTradesByTags(mockTrades, andFilter);
      expect(andResults).toHaveLength(1);
      expect(andResults[0].id).toBe('1');
      
      // Test OR filtering
      const orFilter = {
        includeTags: ['#swing', '#breakout'],
        excludeTags: [],
        mode: 'OR' as const
      };
      
      const orResults = tagService.filterTradesByTags(mockTrades, orFilter);
      expect(orResults).toHaveLength(3); // trades 2, 3, 4
      
      // Test exclusion filtering
      const excludeFilter = {
        includeTags: [],
        excludeTags: ['#scalping'],
        mode: 'OR' as const
      };
      
      const excludeResults = tagService.filterTradesByTags(mockTrades, excludeFilter);
      expect(excludeResults).toHaveLength(2); // trades 3, 4 (no scalping tag)
      
      // Test complex combined filtering
      const complexFilter = {
        includeTags: ['#morning'],
        excludeTags: ['#scalping'],
        mode: 'AND' as const
      };
      
      const complexResults = tagService.filterTradesByTags(mockTrades, complexFilter);
      expect(complexResults).toHaveLength(1);
      expect(complexResults[0].id).toBe('3'); // has morning but not scalping
    });

    it('should handle edge cases in filtering', () => {
      // Empty filter should return all trades
      const emptyFilter = {
        includeTags: [],
        excludeTags: [],
        mode: 'OR' as const
      };
      
      const allResults = tagService.filterTradesByTags(mockTrades, emptyFilter);
      expect(allResults).toHaveLength(4);
      
      // Non-existent tags should return empty results
      const nonExistentFilter = {
        includeTags: ['#nonexistent'],
        excludeTags: [],
        mode: 'OR' as const
      };
      
      const noResults = tagService.filterTradesByTags(mockTrades, nonExistentFilter);
      expect(noResults).toHaveLength(0);
      
      // Excluding all trades
      const excludeAllFilter = {
        includeTags: [],
        excludeTags: ['#scalping', '#swing', '#morning', '#afternoon', '#breakout', '#trend'],
        mode: 'OR' as const
      };
      
      const excludeAllResults = tagService.filterTradesByTags(mockTrades, excludeAllFilter);
      expect(excludeAllResults).toHaveLength(0);
    });
  });

  describe('Tag Analytics Workflows', () => {
    beforeEach(() => {
      tagService.buildTagIndex(mockTrades);
    });

    it('should calculate comprehensive analytics', () => {
      const analytics = tagService.getTagAnalytics(mockTrades);
      
      // Verify basic metrics
      expect(analytics.totalTags).toBe(6);
      expect(analytics.averageTagsPerTrade).toBeCloseTo(2.5, 1); // 10 total tags / 4 trades
      
      // Verify most used tags
      expect(analytics.mostUsedTags).toHaveLength(6);
      const mostUsed = analytics.mostUsedTags[0];
      expect(['#scalping', '#morning', '#afternoon', '#swing'].includes(mostUsed.tag)).toBe(true);
      
      // Verify recent tags
      expect(analytics.recentTags).toHaveLength(6);
      const mostRecent = analytics.recentTags[0];
      expect(mostRecent.lastUsed).toBe('2024-01-04'); // Most recent date
      
      // Verify performance metrics
      expect(analytics.tagPerformance).toHaveLength(6);
      const scalpingPerformance = analytics.tagPerformance.find(p => p.tag === '#scalping');
      expect(scalpingPerformance).toBeDefined();
      expect(scalpingPerformance!.totalTrades).toBe(2);
      expect(scalpingPerformance!.winRate).toBe(50); // 1 win, 1 loss
    });

    it('should handle performance calculations correctly', () => {
      // Test specific tag performance
      const scalpingPerformance = tagService.calculateTagPerformance('#scalping', mockTrades);
      
      expect(scalpingPerformance.totalTrades).toBe(2);
      expect(scalpingPerformance.winRate).toBe(50); // 1 win out of 2
      expect(scalpingPerformance.averagePnL).toBe(25); // (100 - 50) / 2
      expect(scalpingPerformance.profitFactor).toBe(2); // 100 / 50
      
      // Test tag with only wins
      const swingPerformance = tagService.calculateTagPerformance('#swing', mockTrades);
      expect(swingPerformance.totalTrades).toBe(1); // Only closed trades count
      expect(swingPerformance.winRate).toBe(100);
      expect(swingPerformance.profitFactor).toBe(Infinity); // No losses
    });
  });

  describe('Tag Search and Suggestions', () => {
    beforeEach(() => {
      tagService.buildTagIndex(mockTrades);
    });

    it('should provide intelligent tag suggestions', () => {
      // Test empty input - should return most used tags
      const emptySuggestions = tagService.getTagSuggestions(mockTrades, '', 5);
      expect(emptySuggestions).toHaveLength(5);
      
      // Test partial match
      const partialSuggestions = tagService.getTagSuggestions(mockTrades, 'scal', 5);
      expect(partialSuggestions).toContain('#scalping');
      expect(partialSuggestions.length).toBeGreaterThan(0);
      
      // Test with # prefix
      const hashSuggestions = tagService.getTagSuggestions(mockTrades, '#morn', 5);
      expect(hashSuggestions).toContain('#morning');
      
      // Test case insensitive
      const caseSuggestions = tagService.getTagSuggestions(mockTrades, 'SCAL', 5);
      expect(caseSuggestions).toContain('#scalping');
    });

    it('should search tags effectively', () => {
      // Test basic search
      const searchResults = tagService.searchTags(mockTrades, 'ing');
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(t => t.tag.includes('ing'))).toBe(true);
      
      // Test empty search returns all
      const allTags = tagService.searchTags(mockTrades, '');
      expect(allTags).toHaveLength(6);
      
      // Test case insensitive search
      const caseResults = tagService.searchTags(mockTrades, 'MORNING');
      expect(caseResults.some(t => t.tag === '#morning')).toBe(true);
    });
  });

  describe('Tag Validation Workflows', () => {
    it('should validate tags in realistic scenarios', () => {
      // Test valid tags
      const validTags = ['#trading', '#scalp', '#swing_trade', '#123setup'];
      const validationResult = tagService.validateTags(validTags);
      expect(validationResult.isValid).toBe(true);
      
      // Test invalid tags
      const invalidTags = ['#trading', '#invalid-tag', '#', ''];
      const invalidResult = tagService.validateTags(invalidTags);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
      
      // Test duplicate tags
      const duplicateTags = ['#trading', '#scalp', '#trading'];
      const duplicateResult = tagService.validateTags(duplicateTags);
      expect(duplicateResult.isValid).toBe(false);
      expect(duplicateResult.errors.some(e => e.code === 'DUPLICATE_TAGS')).toBe(true);
    });

    it('should process and clean tags correctly', () => {
      const messyTags = ['TRADING', '#scalp!', 'swing-trade', '', '  trend  ', '#BREAKOUT'];
      const processedTags = tagService.processTags(messyTags);
      
      expect(processedTags).toContain('#trading');
      expect(processedTags).toContain('#scalp');
      expect(processedTags).toContain('#swingTrade'); // Invalid chars removed
      expect(processedTags).toContain('#trend');
      expect(processedTags).toContain('#breakout');
      expect(processedTags).not.toContain(''); // Empty tags removed
      
      // Should be deduplicated
      expect(new Set(processedTags).size).toBe(processedTags.length);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeTrades: Trade[] = [];
      const tagPool = ['#scalping', '#swing', '#day', '#position', '#breakout', '#trend', '#reversal', '#momentum'];
      
      for (let i = 0; i < 1000; i++) {
        const randomTags = tagPool
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 4) + 1);
        
        largeTrades.push({
          id: `trade-${i}`,
          accountId: 'acc1',
          currencyPair: 'EUR/USD',
          date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
          timeIn: '09:00',
          side: i % 2 === 0 ? 'long' : 'short',
          entryPrice: 1.1000 + (Math.random() - 0.5) * 0.1,
          lotSize: 1,
          lotType: 'standard',
          units: 100000,
          commission: 5,
          accountCurrency: 'USD',
          status: 'closed',
          pnl: (Math.random() - 0.5) * 200,
          tags: randomTags
        });
      }
      
      // Test performance of index building
      const startTime = performance.now();
      tagService.buildTagIndex(largeTrades);
      const indexTime = performance.now() - startTime;
      
      expect(indexTime).toBeLessThan(100); // Should complete in under 100ms
      
      // Test performance of filtering
      const filterStart = performance.now();
      const filterResult = tagService.filterTradesByTags(largeTrades, {
        includeTags: ['#scalping', '#breakout'],
        excludeTags: [],
        mode: 'OR'
      });
      const filterTime = performance.now() - filterStart;
      
      expect(filterTime).toBeLessThan(50); // Should complete in under 50ms
      expect(filterResult.length).toBeGreaterThan(0);
      
      // Test performance of analytics
      const analyticsStart = performance.now();
      const analytics = tagService.getTagAnalytics(largeTrades);
      const analyticsTime = performance.now() - analyticsStart;
      
      expect(analyticsTime).toBeLessThan(200); // Should complete in under 200ms
      expect(analytics.totalTags).toBe(tagPool.length);
    });

    it('should maintain memory efficiency', () => {
      // Test that the service doesn't leak memory with repeated operations
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        tagService.buildTagIndex(mockTrades);
        tagService.getTagAnalytics(mockTrades);
        tagService.filterTradesByTags(mockTrades, {
          includeTags: ['#scalping'],
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
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed trade data gracefully', () => {
      const malformedTrades = [
        { ...mockTrades[0], tags: null as any },
        { ...mockTrades[1], tags: undefined as any },
        { ...mockTrades[2], tags: 'not-an-array' as any },
        { ...mockTrades[3], tags: [null, undefined, '', '#valid'] as any }
      ];
      
      expect(() => {
        tagService.buildTagIndex(malformedTrades);
      }).not.toThrow();
      
      const tags = tagService.getAllTagsWithCounts(malformedTrades);
      expect(tags.some(t => t.tag === '#valid')).toBe(true);
    });

    it('should handle empty datasets', () => {
      expect(() => {
        tagService.buildTagIndex([]);
      }).not.toThrow();
      
      const analytics = tagService.getTagAnalytics([]);
      expect(analytics.totalTags).toBe(0);
      expect(analytics.averageTagsPerTrade).toBe(0);
      
      const suggestions = tagService.getTagSuggestions([], 'test', 5);
      expect(suggestions).toHaveLength(0);
    });

    it('should handle concurrent operations safely', async () => {
      // Simulate concurrent operations
      const operations = [
        () => tagService.buildTagIndex(mockTrades),
        () => tagService.getTagAnalytics(mockTrades),
        () => tagService.filterTradesByTags(mockTrades, { includeTags: ['#scalping'], excludeTags: [], mode: 'OR' }),
        () => tagService.searchTags(mockTrades, 'scal'),
        () => tagService.getTagSuggestions(mockTrades, 'trend', 5)
      ];
      
      // Run operations concurrently
      const promises = operations.map(op => Promise.resolve(op()));
      
      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });
  });
});
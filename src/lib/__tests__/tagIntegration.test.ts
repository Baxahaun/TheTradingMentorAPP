import { describe, it, expect, beforeEach } from 'vitest';
import { TagIntegration } from '../tagIntegration';
import { Trade } from '../../types/trade';
import { tagService } from '../tagService';

// Mock trade data for testing
const createMockTrade = (
  id: string, 
  tags: string[] = [], 
  pnl: number = 0, 
  status: 'open' | 'closed' = 'closed', 
  date: string = '2024-01-01'
): Trade => ({
  id,
  accountId: 'test-account',
  tags,
  currencyPair: 'EUR/USD',
  date,
  timeIn: '09:00',
  side: 'long',
  entryPrice: 1.1000,
  lotSize: 1,
  lotType: 'standard',
  units: 100000,
  commission: 0,
  accountCurrency: 'USD',
  status,
  pnl
});

describe('TagIntegration', () => {
  beforeEach(() => {
    tagService.resetIndex();
  });

  describe('processTradeForTagging', () => {
    it('should process tags when adding a trade', () => {
      const trade = createMockTrade('1', ['breakout', '#TREND', 'scalp!']);
      const processed = TagIntegration.processTradeForTagging(trade);
      
      expect(processed.tags).toEqual(['#breakout', '#trend', '#scalp']);
    });

    it('should handle trades without tags', () => {
      const trade = createMockTrade('1', []);
      const processed = TagIntegration.processTradeForTagging(trade);
      
      expect(processed.tags).toEqual([]);
    });

    it('should handle trades with undefined tags', () => {
      const trade = createMockTrade('1');
      delete (trade as any).tags;
      const processed = TagIntegration.processTradeForTagging(trade);
      
      expect(processed).toEqual(trade);
    });
  });

  describe('validateTradeForTagging', () => {
    it('should validate trade tags', () => {
      const trade = { tags: ['#breakout', '#trend'] };
      const result = TagIntegration.validateTradeForTagging(trade);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid tags', () => {
      const trade = { tags: ['#breakout', '#break-out'] };
      const result = TagIntegration.validateTradeForTagging(trade);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle trades without tags', () => {
      const trade = {};
      const result = TagIntegration.validateTradeForTagging(trade);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('getTagSuggestionsForTrade', () => {
    it('should return tag suggestions based on existing trades', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend']),
        createMockTrade('2', ['#breakout', '#scalp']),
        createMockTrade('3', ['#breakdown'])
      ];

      const suggestions = TagIntegration.getTagSuggestionsForTrade(trades, 'break', 5);
      
      expect(suggestions).toContain('#breakout');
      expect(suggestions).toContain('#breakdown');
    });

    it('should return most used tags for empty input', () => {
      const trades = [
        createMockTrade('1', ['#breakout']),
        createMockTrade('2', ['#breakout', '#trend']),
        createMockTrade('3', ['#scalp'])
      ];

      const suggestions = TagIntegration.getTagSuggestionsForTrade(trades, '', 3);
      
      expect(suggestions[0]).toBe('#breakout'); // Most used
    });
  });

  describe('filterTradesWithTags', () => {
    const trades = [
      createMockTrade('1', ['#breakout', '#trend']),
      createMockTrade('2', ['#breakout', '#scalp']),
      createMockTrade('3', ['#trend']),
      createMockTrade('4', [])
    ];

    it('should filter trades with AND logic', () => {
      const filter = {
        includeTags: ['#breakout', '#trend'],
        excludeTags: [],
        mode: 'AND' as const
      };

      const result = TagIntegration.filterTradesWithTags(trades, filter);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return all trades when no filter criteria', () => {
      const filter = {
        includeTags: [],
        excludeTags: [],
        mode: 'OR' as const
      };

      const result = TagIntegration.filterTradesWithTags(trades, filter);
      expect(result).toHaveLength(4);
    });
  });

  describe('getTagAnalyticsForDashboard', () => {
    it('should return enhanced analytics for dashboard', () => {
      const trades = [
        createMockTrade('1', ['#breakout'], 100, 'closed', '2024-01-01'),
        createMockTrade('2', ['#breakout'], 50, 'closed', '2024-01-02'),
        createMockTrade('3', ['#breakout'], 75, 'closed', '2024-01-03'),
        createMockTrade('4', ['#trend'], -25, 'closed', '2024-01-04'),
        createMockTrade('5', ['#scalp'], 10, 'closed', '2024-01-05')
      ];

      const analytics = TagIntegration.getTagAnalyticsForDashboard(trades);
      
      expect(analytics.totalTags).toBe(3);
      expect(analytics.topPerformingTags).toBeDefined();
      expect(analytics.recentlyUsedTags).toBeDefined();
      expect(analytics.tagUsageTrend).toBeDefined();
      expect(Array.isArray(analytics.tagUsageTrend)).toBe(true);
    });

    it('should handle empty trades array', () => {
      const analytics = TagIntegration.getTagAnalyticsForDashboard([]);
      
      expect(analytics.totalTags).toBe(0);
      expect(analytics.topPerformingTags).toHaveLength(0);
      expect(analytics.recentlyUsedTags).toHaveLength(0);
    });
  });

  describe('bulkUpdateTradeTags', () => {
    const trades = [
      createMockTrade('1', ['#breakout']),
      createMockTrade('2', ['#trend']),
      createMockTrade('3', ['#scalp'])
    ];

    it('should add tags to selected trades', () => {
      const result = TagIntegration.bulkUpdateTradeTags(
        trades,
        ['1', '2'],
        ['#new_tag'],
        []
      );

      expect(result[0].tags).toContain('#new_tag');
      expect(result[1].tags).toContain('#new_tag');
      expect(result[2].tags).not.toContain('#new_tag');
    });

    it('should remove tags from selected trades', () => {
      const result = TagIntegration.bulkUpdateTradeTags(
        trades,
        ['1'],
        [],
        ['#breakout']
      );

      expect(result[0].tags).not.toContain('#breakout');
      expect(result[1].tags).toContain('#trend'); // Unchanged
    });

    it('should handle both add and remove operations', () => {
      const tradesWithTags = [
        createMockTrade('1', ['#breakout', '#old']),
        createMockTrade('2', ['#trend', '#old'])
      ];

      const result = TagIntegration.bulkUpdateTradeTags(
        tradesWithTags,
        ['1', '2'],
        ['#new'],
        ['#old']
      );

      result.forEach(trade => {
        expect(trade.tags).toContain('#new');
        expect(trade.tags).not.toContain('#old');
      });
    });

    it('should avoid duplicate tags', () => {
      const tradesWithDuplicates = [
        createMockTrade('1', ['#breakout'])
      ];

      const result = TagIntegration.bulkUpdateTradeTags(
        tradesWithDuplicates,
        ['1'],
        ['#breakout'], // Already exists
        []
      );

      const breakoutCount = result[0].tags?.filter(tag => 
        tagService.normalizeTag(tag) === '#breakout'
      ).length;
      
      expect(breakoutCount).toBe(1);
    });
  });

  describe('getTagBasedRecommendations', () => {
    const trades = [
      createMockTrade('1', ['#breakout'], 100, 'closed'),
      createMockTrade('2', ['#breakout'], 50, 'closed'),
      createMockTrade('3', ['#breakout'], 75, 'closed'),
      createMockTrade('4', ['#breakout'], -25, 'closed'),
      createMockTrade('5', ['#breakout'], 25, 'closed'),
      createMockTrade('6', ['#trend'], -50, 'closed')
    ];

    it('should provide recommendations for tags with good performance', () => {
      const result = TagIntegration.getTagBasedRecommendations(trades, ['#breakout']);
      
      expect(result.performance.winRate).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.performance.confidence).toBeGreaterThan(0);
    });

    it('should warn about poor performing tags', () => {
      const poorTrades = [
        createMockTrade('1', ['#bad'], -100, 'closed'),
        createMockTrade('2', ['#bad'], -50, 'closed'),
        createMockTrade('3', ['#bad'], -75, 'closed'),
        createMockTrade('4', ['#bad'], -25, 'closed'),
        createMockTrade('5', ['#bad'], -10, 'closed')
      ];

      const result = TagIntegration.getTagBasedRecommendations(poorTrades, ['#bad']);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.performance.winRate).toBe(0);
    });

    it('should suggest tags for empty input', () => {
      const result = TagIntegration.getTagBasedRecommendations(trades, []);
      
      expect(result.recommendations).toContain('Consider adding tags to track trade patterns');
      expect(result.suggestedTags.length).toBeGreaterThan(0);
    });

    it('should suggest complementary tags', () => {
      const result = TagIntegration.getTagBasedRecommendations(trades, ['#breakout']);
      
      expect(Array.isArray(result.suggestedTags)).toBe(true);
    });
  });

  describe('maintainTagIndex', () => {
    it('should rebuild index and clean orphaned tags', () => {
      const trades = [
        createMockTrade('1', ['#breakout']),
        createMockTrade('2', ['#trend'])
      ];

      const result = TagIntegration.maintainTagIndex(trades);
      
      expect(result.indexRebuilt).toBe(true);
      expect(result.totalTags).toBe(2);
      expect(Array.isArray(result.orphanedTagsRemoved)).toBe(true);
    });
  });

  describe('exportTagData', () => {
    it('should export comprehensive tag data', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend']),
        createMockTrade('2', ['#scalp'])
      ];

      const exported = TagIntegration.exportTagData(trades);
      
      expect(exported.exportDate).toBeDefined();
      expect(exported.totalTrades).toBe(2);
      expect(exported.analytics).toBeDefined();
      expect(exported.allTags).toBeDefined();
      expect(exported.tagsByTrade).toHaveLength(2);
      expect(exported.tagsByTrade[0].tradeId).toBe('1');
      expect(exported.tagsByTrade[0].tags).toEqual(['#breakout', '#trend']);
    });
  });

  describe('importTagData', () => {
    it('should validate and import tag data', () => {
      const validTagData = {
        exportDate: '2024-01-01T00:00:00.000Z',
        totalTrades: 2,
        tagsByTrade: [
          { tradeId: '1', date: '2024-01-01', tags: ['#breakout', '#trend'] },
          { tradeId: '2', date: '2024-01-02', tags: ['#scalp'] }
        ]
      };

      const result = TagIntegration.importTagData(validTagData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.processedTags['1']).toEqual(['#breakout', '#trend']);
      expect(result.processedTags['2']).toEqual(['#scalp']);
    });

    it('should reject invalid tag data', () => {
      const invalidTagData = {
        tagsByTrade: [
          { tradeId: '1', tags: ['#break-out'] } // Invalid tag
        ]
      };

      const result = TagIntegration.importTagData(invalidTagData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed data', () => {
      const result = TagIntegration.importTagData(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid tag data format');
    });

    it('should handle missing trade IDs', () => {
      const invalidData = {
        tagsByTrade: [
          { tags: ['#breakout'] } // Missing tradeId
        ]
      };

      const result = TagIntegration.importTagData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Missing tradeId'))).toBe(true);
    });
  });
});
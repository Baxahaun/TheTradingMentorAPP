import { describe, it, expect, beforeEach } from 'vitest';
import { TagService, tagService } from '../tagService';
import { Trade } from '../../types/trade';

// Mock trade data for testing
const createMockTrade = (id: string, tags: string[] = [], pnl: number = 0, status: 'open' | 'closed' = 'closed', date: string = '2024-01-01'): Trade => ({
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

describe('TagService', () => {
  let service: TagService;

  beforeEach(() => {
    service = TagService.getInstance();
    service.resetIndex(); // Reset index before each test
  });

  describe('validateTag', () => {
    it('should validate a correct tag', () => {
      const result = service.validateTag('#breakout');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty tags', () => {
      const result = service.validateTag('');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'TAG_EMPTY')).toBe(true);
    });

    it('should reject whitespace-only tags', () => {
      const result = service.validateTag('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'TAG_EMPTY')).toBe(true);
    });

    it('should warn about tags without #', () => {
      const result = service.validateTag('breakout');
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TAG_NO_HASH')).toBe(true);
    });

    it('should reject tags with invalid characters', () => {
      const result = service.validateTag('#break-out');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'TAG_INVALID_CHARS')).toBe(true);
    });

    it('should reject tags that are too long', () => {
      const longTag = '#' + 'a'.repeat(51);
      const result = service.validateTag(longTag);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'TAG_TOO_LONG')).toBe(true);
    });

    it('should warn about tags starting with numbers', () => {
      const result = service.validateTag('#123breakout');
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TAG_STARTS_WITH_NUMBER')).toBe(true);
    });

    it('should reject tags with only # symbol', () => {
      const result = service.validateTag('#');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'TAG_TOO_SHORT')).toBe(true);
    });
  });

  describe('validateTags', () => {
    it('should validate an array of correct tags', () => {
      const result = service.validateTags(['#breakout', '#trend', '#scalp']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate tags', () => {
      const result = service.validateTags(['#breakout', '#trend', '#breakout']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'DUPLICATE_TAGS')).toBe(true);
    });

    it('should validate each tag individually', () => {
      const result = service.validateTags(['#breakout', 'invalid-tag', '#']);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('normalizeTag', () => {
    it('should normalize tags to lowercase with #', () => {
      expect(service.normalizeTag('BREAKOUT')).toBe('#breakout');
      expect(service.normalizeTag('#TREND')).toBe('#trend');
      expect(service.normalizeTag('  Scalp  ')).toBe('#scalp');
    });

    it('should handle empty strings', () => {
      expect(service.normalizeTag('')).toBe('');
      expect(service.normalizeTag('   ')).toBe('#');
    });

    it('should preserve # prefix', () => {
      expect(service.normalizeTag('#breakout')).toBe('#breakout');
    });
  });

  describe('sanitizeTag', () => {
    it('should remove invalid characters', () => {
      expect(service.sanitizeTag('#break-out!')).toBe('#breakout');
      expect(service.sanitizeTag('trend@123')).toBe('#trend123');
    });

    it('should handle tags without #', () => {
      expect(service.sanitizeTag('breakout')).toBe('#breakout');
    });

    it('should return empty string for invalid input', () => {
      expect(service.sanitizeTag('!@#$%')).toBe('');
      expect(service.sanitizeTag('')).toBe('');
    });

    it('should convert to lowercase', () => {
      expect(service.sanitizeTag('BREAKOUT')).toBe('#breakout');
    });
  });

  describe('processTags', () => {
    it('should process and deduplicate tags', () => {
      const input = ['#breakout', 'TREND', '#breakout', 'scalp!', ''];
      const result = service.processTags(input);
      expect(result).toEqual(['#breakout', '#trend', '#scalp']);
    });

    it('should handle empty arrays', () => {
      expect(service.processTags([])).toEqual([]);
    });

    it('should handle non-array input', () => {
      expect(service.processTags(null as any)).toEqual([]);
      expect(service.processTags(undefined as any)).toEqual([]);
    });
  });

  describe('buildTagIndex', () => {
    it('should build index from trades', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend'], 100),
        createMockTrade('2', ['#breakout', '#scalp'], -50),
        createMockTrade('3', ['#trend'], 75)
      ];

      service.buildTagIndex(trades);
      const allTags = service.getAllTagsWithCounts(trades);

      expect(allTags).toHaveLength(3);
      expect(allTags.find(t => t.tag === '#breakout')?.count).toBe(2);
      expect(allTags.find(t => t.tag === '#trend')?.count).toBe(2);
      expect(allTags.find(t => t.tag === '#scalp')?.count).toBe(1);
    });

    it('should handle trades without tags', () => {
      const trades = [
        createMockTrade('1', [], 100),
        createMockTrade('2', undefined as any, -50)
      ];

      service.buildTagIndex(trades);
      const allTags = service.getAllTagsWithCounts(trades);

      expect(allTags).toHaveLength(0);
    });

    it('should update last used dates correctly', () => {
      const trades = [
        createMockTrade('1', ['#breakout'], 100, 'closed', '2024-01-01'),
        createMockTrade('2', ['#breakout'], -50, 'closed', '2024-01-02')
      ];

      service.buildTagIndex(trades);
      const allTags = service.getAllTagsWithCounts(trades);
      const breakoutTag = allTags.find(t => t.tag === '#breakout');

      expect(breakoutTag?.lastUsed).toBe('2024-01-02');
    });
  });

  describe('getAllTagsWithCounts', () => {
    it('should return all tags with correct counts', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend']),
        createMockTrade('2', ['#breakout']),
        createMockTrade('3', ['#scalp'])
      ];

      const result = service.getAllTagsWithCounts(trades);

      expect(result).toHaveLength(3);
      expect(result.find(t => t.tag === '#breakout')?.count).toBe(2);
      expect(result.find(t => t.tag === '#trend')?.count).toBe(1);
      expect(result.find(t => t.tag === '#scalp')?.count).toBe(1);
    });
  });

  describe('getMostUsedTags', () => {
    it('should return tags sorted by usage count', () => {
      const trades = [
        createMockTrade('1', ['#breakout']),
        createMockTrade('2', ['#breakout', '#trend']),
        createMockTrade('3', ['#breakout', '#trend', '#scalp']),
        createMockTrade('4', ['#trend'])
      ];

      const result = service.getMostUsedTags(trades, 3);

      expect(result).toHaveLength(3);
      expect(result[0].tag).toBe('#breakout');
      expect(result[0].count).toBe(3);
      expect(result[1].tag).toBe('#trend');
      expect(result[1].count).toBe(3);
      expect(result[2].tag).toBe('#scalp');
      expect(result[2].count).toBe(1);
    });

    it('should respect the limit parameter', () => {
      const trades = [
        createMockTrade('1', ['#a', '#b', '#c', '#d', '#e'])
      ];

      const result = service.getMostUsedTags(trades, 3);
      expect(result).toHaveLength(3);
    });
  });

  describe('getRecentTags', () => {
    it('should return tags sorted by last used date', () => {
      const trades = [
        createMockTrade('1', ['#old'], 0, 'closed', '2024-01-01'),
        createMockTrade('2', ['#recent'], 0, 'closed', '2024-01-03'),
        createMockTrade('3', ['#middle'], 0, 'closed', '2024-01-02')
      ];

      const result = service.getRecentTags(trades, 3);

      expect(result).toHaveLength(3);
      expect(result[0].tag).toBe('#recent');
      expect(result[1].tag).toBe('#middle');
      expect(result[2].tag).toBe('#old');
    });
  });

  describe('calculateTagPerformance', () => {
    it('should calculate correct performance metrics', () => {
      const trades = [
        createMockTrade('1', ['#breakout'], 100, 'closed'),
        createMockTrade('2', ['#breakout'], -50, 'closed'),
        createMockTrade('3', ['#breakout'], 200, 'closed'),
        createMockTrade('4', ['#breakout'], 0, 'open') // Should be ignored
      ];

      const result = service.calculateTagPerformance('#breakout', trades);

      expect(result.totalTrades).toBe(3);
      expect(result.winRate).toBeCloseTo(66.67, 1); // 2 wins out of 3
      expect(result.averagePnL).toBeCloseTo(83.33, 1); // (100 - 50 + 200) / 3
      expect(result.profitFactor).toBe(6); // 300 / 50
    });

    it('should handle tags with no closed trades', () => {
      const trades = [
        createMockTrade('1', ['#breakout'], 100, 'open')
      ];

      const result = service.calculateTagPerformance('#breakout', trades);

      expect(result.totalTrades).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.averagePnL).toBe(0);
      expect(result.profitFactor).toBe(0);
    });

    it('should handle infinite profit factor (no losses)', () => {
      const trades = [
        createMockTrade('1', ['#breakout'], 100, 'closed'),
        createMockTrade('2', ['#breakout'], 50, 'closed')
      ];

      const result = service.calculateTagPerformance('#breakout', trades);

      expect(result.profitFactor).toBe(Infinity);
    });
  });

  describe('getTagAnalytics', () => {
    it('should return comprehensive analytics', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend'], 100),
        createMockTrade('2', ['#breakout'], -50),
        createMockTrade('3', ['#scalp'], 25),
        createMockTrade('4', []) // No tags
      ];

      const result = service.getTagAnalytics(trades);

      expect(result.totalTags).toBe(3);
      expect(result.averageTagsPerTrade).toBeCloseTo(1.33, 1); // 4 total tags / 3 trades with tags
      expect(result.mostUsedTags).toHaveLength(3);
      expect(result.recentTags).toHaveLength(3);
      expect(result.tagPerformance).toHaveLength(3);
    });

    it('should handle empty trade array', () => {
      const result = service.getTagAnalytics([]);

      expect(result.totalTags).toBe(0);
      expect(result.averageTagsPerTrade).toBe(0);
      expect(result.mostUsedTags).toHaveLength(0);
      expect(result.recentTags).toHaveLength(0);
      expect(result.tagPerformance).toHaveLength(0);
    });
  });

  describe('filterTradesByTags', () => {
    const trades = [
      createMockTrade('1', ['#breakout', '#trend']),
      createMockTrade('2', ['#breakout', '#scalp']),
      createMockTrade('3', ['#trend']),
      createMockTrade('4', ['#scalp']),
      createMockTrade('5', []) // No tags
    ];

    it('should filter with AND logic', () => {
      const filter = {
        includeTags: ['#breakout', '#trend'],
        excludeTags: [],
        mode: 'AND' as const
      };

      const result = service.filterTradesByTags(trades, filter);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter with OR logic', () => {
      const filter = {
        includeTags: ['#breakout', '#scalp'],
        excludeTags: [],
        mode: 'OR' as const
      };

      const result = service.filterTradesByTags(trades, filter);
      expect(result).toHaveLength(3); // trades 1, 2, 4
      expect(result.map(t => t.id).sort()).toEqual(['1', '2', '4']);
    });

    it('should exclude specified tags', () => {
      const filter = {
        includeTags: [],
        excludeTags: ['#scalp'],
        mode: 'OR' as const
      };

      const result = service.filterTradesByTags(trades, filter);
      expect(result).toHaveLength(3); // trades 1, 3, 5 (excluding 2 and 4 which have #scalp)
      expect(result.map(t => t.id).sort()).toEqual(['1', '3', '5']);
    });

    it('should return all trades when no filters specified', () => {
      const filter = {
        includeTags: [],
        excludeTags: [],
        mode: 'OR' as const
      };

      const result = service.filterTradesByTags(trades, filter);
      expect(result).toHaveLength(5);
    });
  });

  describe('searchTags', () => {
    const trades = [
      createMockTrade('1', ['#breakout', '#breakdown', '#trend']),
      createMockTrade('2', ['#scalp', '#swing'])
    ];

    it('should search tags by partial match', () => {
      const result = service.searchTags(trades, 'break');
      expect(result).toHaveLength(2);
      expect(result.map(t => t.tag).sort()).toEqual(['#breakdown', '#breakout']);
    });

    it('should return all tags for empty query', () => {
      const result = service.searchTags(trades, '');
      expect(result).toHaveLength(5);
    });

    it('should be case insensitive', () => {
      const result = service.searchTags(trades, 'BREAK');
      expect(result).toHaveLength(2);
    });
  });

  describe('getTagSuggestions', () => {
    const trades = [
      createMockTrade('1', ['#breakout', '#breakdown']),
      createMockTrade('2', ['#breakout', '#trend']),
      createMockTrade('3', ['#scalp'])
    ];

    it('should return most used tags for empty input', () => {
      const result = service.getTagSuggestions(trades, '', 5);
      expect(result[0]).toBe('#breakout'); // Most used
    });

    it('should prioritize tags that start with input', () => {
      const result = service.getTagSuggestions(trades, 'break', 5);
      expect(result).toContain('#breakout');
      expect(result).toContain('#breakdown');
    });

    it('should handle # prefix in input', () => {
      const result = service.getTagSuggestions(trades, '#break', 5);
      expect(result).toContain('#breakout');
      expect(result).toContain('#breakdown');
    });

    it('should respect limit parameter', () => {
      const result = service.getTagSuggestions(trades, '', 2);
      expect(result).toHaveLength(2);
    });
  });

  describe('cleanupOrphanedTags', () => {
    it('should remove tags not used by any trades', () => {
      const trades = [
        createMockTrade('1', ['#breakout'])
      ];

      // Build index with more tags
      service.buildTagIndex([
        createMockTrade('1', ['#breakout']),
        createMockTrade('2', ['#unused'])
      ]);

      const removed = service.cleanupOrphanedTags(trades);
      expect(removed).toContain('#unused');
      expect(removed).not.toContain('#breakout');
    });

    it('should return empty array when no orphaned tags', () => {
      const trades = [
        createMockTrade('1', ['#breakout'])
      ];

      service.buildTagIndex(trades);
      const removed = service.cleanupOrphanedTags(trades);
      expect(removed).toHaveLength(0);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TagService.getInstance();
      const instance2 = TagService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = TagService.getInstance();
      const trades = [createMockTrade('1', ['#test'])];
      instance1.buildTagIndex(trades);

      const instance2 = TagService.getInstance();
      const tags = instance2.getAllTagsWithCounts(trades);
      expect(tags).toHaveLength(1);
    });
  });
});
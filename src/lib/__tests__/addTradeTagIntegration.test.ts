import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tagService } from '../tagService';
import { Trade } from '../../types/trade';

// Mock data for testing
const mockTrades: Trade[] = [
  {
    id: '1',
    accountId: 'default',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '09:30',
    side: 'long',
    entryPrice: 1.0850,
    exitPrice: 1.0900,
    lotSize: 0.1,
    lotType: 'standard',
    units: 10000,
    commission: 0,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 50,
    tags: ['#breakout', '#morning', '#confident']
  },
  {
    id: '2',
    accountId: 'default',
    currencyPair: 'GBP/USD',
    date: '2024-01-16',
    timeIn: '14:00',
    side: 'short',
    entryPrice: 1.2700,
    exitPrice: 1.2650,
    lotSize: 0.2,
    lotType: 'standard',
    units: 20000,
    commission: 0,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 100,
    tags: ['#reversal', '#news', '#confident']
  }
];

describe('AddTrade Tag Integration', () => {
  beforeEach(() => {
    // Reset tag service state before each test
    tagService.resetIndex();
  });

  describe('Tag Processing and Validation', () => {
    it('should process tags correctly when adding a trade', () => {
      const inputTags = ['breakout', '#trend', 'CONFIDENT', '  news  '];
      const processedTags = tagService.processTags(inputTags);
      
      expect(processedTags).toEqual(['#breakout', '#trend', '#confident', '#news']);
    });

    it('should validate tags according to system rules', () => {
      const validTag = '#breakout';
      const invalidTag = '#invalid-tag!';
      const emptyTag = '';
      
      expect(tagService.validateTag(validTag).isValid).toBe(true);
      expect(tagService.validateTag(invalidTag).isValid).toBe(false);
      expect(tagService.validateTag(emptyTag).isValid).toBe(false);
    });

    it('should remove duplicates and invalid tags', () => {
      const inputTags = ['#breakout', 'breakout', '#BREAKOUT', '#invalid!', '', '#trend'];
      const processedTags = tagService.processTags(inputTags);
      
      expect(processedTags).toEqual(['#breakout', '#trend']);
    });
  });

  describe('Tag Suggestions', () => {
    it('should provide tag suggestions based on existing trades', () => {
      tagService.buildTagIndex(mockTrades);
      const suggestions = tagService.getTagSuggestions(mockTrades, '', 10);
      
      expect(suggestions).toContain('#breakout');
      expect(suggestions).toContain('#confident');
      expect(suggestions).toContain('#reversal');
    });

    it('should filter suggestions based on input', () => {
      tagService.buildTagIndex(mockTrades);
      const suggestions = tagService.getTagSuggestions(mockTrades, 'conf', 10);
      
      expect(suggestions).toContain('#confident');
      expect(suggestions).not.toContain('#breakout');
    });

    it('should return most used tags when no input provided', () => {
      tagService.buildTagIndex(mockTrades);
      const suggestions = tagService.getTagSuggestions(mockTrades, '', 5);
      
      // All tags appear once, so order should be consistent
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('#confident'); // appears in both trades
    });
  });

  describe('Tag Persistence', () => {
    it('should properly format tags for storage in trade object', () => {
      const inputTags = ['breakout', 'trend', 'confident'];
      const processedTags = tagService.processTags(inputTags);
      
      const trade: Partial<Trade> = {
        currencyPair: 'EUR/USD',
        tags: processedTags.length > 0 ? processedTags : undefined
      };
      
      expect(trade.tags).toEqual(['#breakout', '#trend', '#confident']);
    });

    it('should handle empty tags array correctly', () => {
      const inputTags: string[] = [];
      const processedTags = tagService.processTags(inputTags);
      
      const trade: Partial<Trade> = {
        currencyPair: 'EUR/USD',
        tags: processedTags.length > 0 ? processedTags : undefined
      };
      
      expect(trade.tags).toBeUndefined();
    });

    it('should handle tags with only invalid entries', () => {
      const inputTags = ['', '  ', '#invalid!', '@bad'];
      const processedTags = tagService.processTags(inputTags);
      
      const trade: Partial<Trade> = {
        currencyPair: 'EUR/USD',
        tags: processedTags.length > 0 ? processedTags : undefined
      };
      
      expect(trade.tags).toBeUndefined();
    });
  });

  describe('Tag Analytics Integration', () => {
    it('should build tag index from trades with tags', () => {
      tagService.buildTagIndex(mockTrades);
      const allTags = tagService.getAllTagsWithCounts(mockTrades);
      
      expect(allTags.length).toBeGreaterThan(0);
      
      const confidentTag = allTags.find(tag => tag.tag === '#confident');
      expect(confidentTag).toBeDefined();
      expect(confidentTag?.count).toBe(2); // appears in both trades
    });

    it('should calculate tag performance correctly', () => {
      const tagTrades = mockTrades.filter(trade => 
        trade.tags?.includes('#confident')
      );
      
      const performance = tagService.calculateTagPerformance('#confident', tagTrades);
      
      expect(performance.tag).toBe('#confident');
      expect(performance.totalTrades).toBe(2);
      expect(performance.winRate).toBe(100); // both trades are profitable
      expect(performance.averagePnL).toBe(75); // (50 + 100) / 2
    });
  });

  describe('Form Integration Scenarios', () => {
    it('should handle the complete add trade workflow with tags', () => {
      // Simulate form data with tags
      const formData = {
        currencyPair: 'EUR/USD',
        date: '2024-01-17',
        timeIn: '10:00',
        side: 'long' as const,
        entryPrice: '1.0800',
        lotSize: '0.1',
        lotType: 'standard' as const,
        accountCurrency: 'USD',
        tags: ['#scalping', '#morning', '#confident']
      };

      // Process tags as would happen in AddTrade component
      const processedTags = tagService.processTags(formData.tags);

      // Create trade object as would happen in onSubmit
      const trade: Trade = {
        id: Date.now().toString(),
        accountId: 'default',
        currencyPair: formData.currencyPair.toUpperCase(),
        date: formData.date,
        timeIn: formData.timeIn,
        side: formData.side,
        entryPrice: parseFloat(formData.entryPrice),
        lotSize: parseFloat(formData.lotSize),
        lotType: formData.lotType,
        units: 10000,
        commission: 0,
        accountCurrency: formData.accountCurrency,
        status: 'open',
        tags: processedTags.length > 0 ? processedTags : undefined
      };

      expect(trade.tags).toEqual(['#scalping', '#morning', '#confident']);
      expect(trade.currencyPair).toBe('EUR/USD');
      expect(trade.status).toBe('open');
    });

    it('should handle tag suggestions for autocomplete', () => {
      // Build index from existing trades
      tagService.buildTagIndex(mockTrades);
      
      // Simulate user typing in TagInput
      const userInput = 'conf';
      const suggestions = tagService.getTagSuggestions(mockTrades, userInput, 10);
      
      expect(suggestions).toContain('#confident');
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('should validate tags before submission', () => {
      const validTags = ['#breakout', '#trend', '#confident'];
      const invalidTags = ['#invalid!', '', '#too-long-tag-name-that-exceeds-limit-of-fifty-characters'];
      
      const validResult = tagService.validateTags(validTags);
      const invalidResult = tagService.validateTags(invalidTags);
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle trades without tags', () => {
      const tradesWithoutTags: Trade[] = [
        {
          ...mockTrades[0],
          tags: undefined
        }
      ];
      
      tagService.buildTagIndex(tradesWithoutTags);
      const suggestions = tagService.getTagSuggestions(tradesWithoutTags, '', 10);
      
      expect(suggestions).toEqual([]);
    });

    it('should handle mixed trades with and without tags', () => {
      const mixedTrades: Trade[] = [
        mockTrades[0], // has tags
        {
          ...mockTrades[1],
          tags: undefined // no tags
        }
      ];
      
      tagService.buildTagIndex(mixedTrades);
      const allTags = tagService.getAllTagsWithCounts(mixedTrades);
      
      // Should only include tags from the first trade
      expect(allTags.length).toBe(3); // #breakout, #morning, #confident
    });

    it('should handle empty trades array', () => {
      const emptyTrades: Trade[] = [];
      
      tagService.buildTagIndex(emptyTrades);
      const suggestions = tagService.getTagSuggestions(emptyTrades, '', 10);
      
      expect(suggestions).toEqual([]);
    });
  });
});
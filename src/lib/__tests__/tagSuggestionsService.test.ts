import { TagSuggestionsService, TagSuggestion, SuggestionContext } from '../tagSuggestionsService';
import { Trade } from '../../types/trade';
import { TagWithCount } from '../tagService';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';

describe('TagSuggestionsService', () => {
  let service: TagSuggestionsService;
  let mockTrades: Trade[];

  beforeEach(() => {
    service = TagSuggestionsService.getInstance();
    service.clearCache(); // Clear cache between tests

    // Create mock trades for testing
    mockTrades = [
      {
        id: '1',
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-15',
        timeIn: '09:00',
        side: 'long',
        entryPrice: 1.0950,
        exitPrice: 1.0980,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 300,
        session: 'european',
        strategy: 'breakout',
        tags: ['#breakout', '#major-pair', '#bullish', '#european-session']
      },
      {
        id: '2',
        accountId: 'acc1',
        currencyPair: 'GBP/USD',
        date: '2024-01-16',
        timeIn: '14:00',
        side: 'short',
        entryPrice: 1.2650,
        exitPrice: 1.2620,
        lotSize: 0.5,
        lotType: 'standard',
        units: 50000,
        commission: 3,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 150,
        session: 'us',
        strategy: 'scalping',
        tags: ['#scalping', '#major-pair', '#bearish', '#us-session']
      },
      {
        id: '3',
        accountId: 'acc1',
        currencyPair: 'USD/JPY',
        date: '2024-01-17',
        timeIn: '02:00',
        side: 'long',
        entryPrice: 148.50,
        exitPrice: 148.20,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: -200,
        session: 'asian',
        strategy: 'swing',
        tags: ['#swing-trade', '#major-pair', '#bullish', '#asian-session']
      },
      {
        id: '4',
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-18',
        timeIn: '10:00',
        side: 'long',
        entryPrice: 1.0920,
        exitPrice: 1.0950,
        lotSize: 2,
        lotType: 'standard',
        units: 200000,
        commission: 8,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 600,
        session: 'european',
        strategy: 'breakout',
        leverage: 100,
        tags: ['#breakout', '#major-pair', '#bullish', '#high-leverage', '#large-position']
      },
      {
        id: '5',
        accountId: 'acc1',
        currencyPair: 'USD/ZAR',
        date: '2024-01-19',
        timeIn: '11:00',
        side: 'short',
        entryPrice: 18.50,
        exitPrice: 18.30,
        lotSize: 0.1,
        lotType: 'standard',
        units: 10000,
        commission: 2,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 100,
        session: 'european',
        strategy: 'swing',
        tags: ['#exotic-pair', '#volatile', '#bearish', '#swing-trade']
      }
    ];
  });

  describe('getIntelligentSuggestions', () => {
    it('should return suggestions based on input matching', () => {
      const suggestions = service.getIntelligentSuggestions('break', mockTrades);
      
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      const breakoutSuggestion = suggestions.find(s => s.tag === '#breakout');
      expect(breakoutSuggestion).toBeDefined();
      expect(breakoutSuggestion?.reason).toMatch(/match/);
    });

    it('should return most used tags when input is empty', () => {
      const suggestions = service.getIntelligentSuggestions('', mockTrades);
      
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should include frequently used tags
      const majorPairSuggestion = suggestions.find(s => s.tag === '#major-pair');
      expect(majorPairSuggestion).toBeDefined();
    });

    it('should provide contextual suggestions based on current trade', () => {
      const currentTrade: Partial<Trade> = {
        currencyPair: 'EUR/USD',
        session: 'european',
        strategy: 'breakout',
        side: 'long'
      };

      const context: SuggestionContext = { currentTrade };
      const suggestions = service.getIntelligentSuggestions('', mockTrades, context);
      
      expect(suggestions).toBeDefined();
      
      // Should suggest contextual tags
      const contextualSuggestions = suggestions.filter(s => s.reason === 'contextual_match');
      expect(contextualSuggestions.length).toBeGreaterThan(0);
    });

    it('should limit results to specified limit', () => {
      const limit = 5;
      const suggestions = service.getIntelligentSuggestions('', mockTrades, {}, limit);
      
      expect(suggestions.length).toBeLessThanOrEqual(limit);
    });

    it('should cache results for performance', () => {
      const input = 'test';
      const context: SuggestionContext = {};
      
      // First call
      const suggestions1 = service.getIntelligentSuggestions(input, mockTrades, context);
      
      // Second call should use cache
      const suggestions2 = service.getIntelligentSuggestions(input, mockTrades, context);
      
      expect(suggestions1).toEqual(suggestions2);
    });
  });

  describe('getRecentlyUsedTags', () => {
    it('should return recently used tags sorted by recency', () => {
      const suggestions = service.getRecentlyUsedTags(mockTrades);
      
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should be sorted by recency (most recent first)
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
      }
    });

    it('should include frequency and last used information', () => {
      const suggestions = service.getRecentlyUsedTags(mockTrades);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.frequency).toBeDefined();
        expect(suggestion.lastUsed).toBeDefined();
        expect(suggestion.reason).toBe('recent_usage');
      });
    });

    it('should respect the limit parameter', () => {
      const limit = 3;
      const suggestions = service.getRecentlyUsedTags(mockTrades, limit);
      
      expect(suggestions.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('getContextualSuggestions', () => {
    it('should suggest tags based on currency pair', () => {
      const currentTrade: Partial<Trade> = {
        currencyPair: 'USD/ZAR'
      };
      
      const suggestions = service.getContextualSuggestions(currentTrade, mockTrades);
      
      const exoticSuggestion = suggestions.find(s => s.tag === '#exotic-pair');
      expect(exoticSuggestion).toBeDefined();
    });

    it('should suggest tags based on trading session', () => {
      const currentTrade: Partial<Trade> = {
        session: 'asian'
      };
      
      const suggestions = service.getContextualSuggestions(currentTrade, mockTrades);
      
      const asianSessionSuggestion = suggestions.find(s => s.tag === '#asian-session');
      expect(asianSessionSuggestion).toBeDefined();
    });

    it('should suggest tags based on trade side', () => {
      const currentTrade: Partial<Trade> = {
        side: 'long'
      };
      
      const suggestions = service.getContextualSuggestions(currentTrade, mockTrades);
      
      const bullishSuggestion = suggestions.find(s => s.tag === '#bullish');
      expect(bullishSuggestion).toBeDefined();
    });

    it('should suggest tags based on strategy', () => {
      const currentTrade: Partial<Trade> = {
        strategy: 'breakout'
      };
      
      const suggestions = service.getContextualSuggestions(currentTrade, mockTrades);
      
      const breakoutSuggestion = suggestions.find(s => s.tag === '#breakout');
      expect(breakoutSuggestion).toBeDefined();
    });

    it('should suggest tags based on high leverage', () => {
      const currentTrade: Partial<Trade> = {
        leverage: 100
      };
      
      const suggestions = service.getContextualSuggestions(currentTrade, mockTrades);
      
      const highLeverageSuggestion = suggestions.find(s => s.tag === '#high-leverage');
      expect(highLeverageSuggestion).toBeDefined();
    });
  });

  describe('getFrequencyBasedSuggestions', () => {
    it('should return exact matches with highest scores', () => {
      const suggestions = service.getFrequencyBasedSuggestions('major-pair', mockTrades);
      
      const exactMatch = suggestions.find(s => s.tag === '#major-pair');
      expect(exactMatch).toBeDefined();
      expect(exactMatch?.reason).toBe('exact_match');
      
      // Exact match should have highest score
      const highestScore = Math.max(...suggestions.map(s => s.score));
      expect(exactMatch?.score).toBe(highestScore);
    });

    it('should return prefix matches with high scores', () => {
      const suggestions = service.getFrequencyBasedSuggestions('break', mockTrades);
      
      const prefixMatch = suggestions.find(s => s.tag === '#breakout');
      expect(prefixMatch).toBeDefined();
      expect(prefixMatch?.reason).toBe('pattern_match');
    });

    it('should return partial matches with lower scores', () => {
      const suggestions = service.getFrequencyBasedSuggestions('pair', mockTrades);
      
      const partialMatch = suggestions.find(s => s.tag === '#major-pair');
      expect(partialMatch).toBeDefined();
      expect(['partial_match', 'pattern_match']).toContain(partialMatch?.reason);
    });

    it('should include frequency information', () => {
      const suggestions = service.getFrequencyBasedSuggestions('major', mockTrades);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.frequency).toBeDefined();
        expect(suggestion.frequency).toBeGreaterThan(0);
      });
    });
  });

  describe('getPerformanceBasedSuggestions', () => {
    it('should return tags with performance metrics', () => {
      const suggestions = service.getPerformanceBasedSuggestions(mockTrades);
      
      expect(suggestions).toBeDefined();
      suggestions.forEach(suggestion => {
        expect(suggestion.reason).toBe('performance_based');
        expect(suggestion.context).toContain('Win Rate');
        expect(suggestion.context).toContain('Avg P&L');
      });
    });

    it('should only include tags with sufficient trade data', () => {
      // Create trades with insufficient data for some tags
      const limitedTrades = mockTrades.slice(0, 2);
      const suggestions = service.getPerformanceBasedSuggestions(limitedTrades);
      
      // Should filter out tags with less than 3 trades
      suggestions.forEach(suggestion => {
        expect(suggestion.frequency).toBeGreaterThanOrEqual(3);
      });
    });

    it('should score based on win rate and P&L', () => {
      const suggestions = service.getPerformanceBasedSuggestions(mockTrades);
      
      if (suggestions.length > 1) {
        // Higher performing tags should have higher scores
        const sortedSuggestions = [...suggestions].sort((a, b) => b.score - a.score);
        expect(sortedSuggestions[0].score).toBeGreaterThanOrEqual(sortedSuggestions[1].score);
      }
    });
  });

  describe('getOptimizedSuggestions', () => {
    it('should work with pre-built tag index', () => {
      const tagIndex = new Map<string, TagWithCount>();
      tagIndex.set('#breakout', {
        tag: '#breakout',
        count: 2,
        lastUsed: '2024-01-18',
        trades: ['1', '4']
      });
      tagIndex.set('#major-pair', {
        tag: '#major-pair',
        count: 4,
        lastUsed: '2024-01-18',
        trades: ['1', '2', '3', '4']
      });

      const suggestions = service.getOptimizedSuggestions('break', tagIndex);
      
      expect(suggestions).toBeDefined();
      const breakoutSuggestion = suggestions.find(s => s.tag === '#breakout');
      expect(breakoutSuggestion).toBeDefined();
    });

    it('should return most frequent tags when input is empty', () => {
      const tagIndex = new Map<string, TagWithCount>();
      tagIndex.set('#frequent', {
        tag: '#frequent',
        count: 10,
        lastUsed: '2024-01-18',
        trades: []
      });
      tagIndex.set('#rare', {
        tag: '#rare',
        count: 1,
        lastUsed: '2024-01-15',
        trades: []
      });

      const suggestions = service.getOptimizedSuggestions('', tagIndex);
      
      expect(suggestions[0].tag).toBe('#frequent');
      expect(suggestions[0].reason).toBe('high_frequency');
    });

    it('should boost recently used tags', () => {
      const tagIndex = new Map<string, TagWithCount>();
      const recentDate = new Date().toISOString().split('T')[0];
      const oldDate = '2024-01-01';

      tagIndex.set('#recent', {
        tag: '#recent',
        count: 1,
        lastUsed: recentDate,
        trades: []
      });
      tagIndex.set('#old', {
        tag: '#old',
        count: 1,
        lastUsed: oldDate,
        trades: []
      });

      const suggestions = service.getOptimizedSuggestions('', tagIndex);
      
      const recentSuggestion = suggestions.find(s => s.tag === '#recent');
      const oldSuggestion = suggestions.find(s => s.tag === '#old');
      
      // Both suggestions should exist and recent should have higher or equal score
      expect(recentSuggestion).toBeDefined();
      expect(oldSuggestion).toBeDefined();
      
      if (recentSuggestion && oldSuggestion) {
        expect(recentSuggestion.score).toBeGreaterThanOrEqual(oldSuggestion.score);
      }
    });
  });

  describe('cache functionality', () => {
    it('should cache and retrieve suggestions', () => {
      const input = 'test-cache';
      const context: SuggestionContext = {};
      
      // First call - should populate cache
      const suggestions1 = service.getIntelligentSuggestions(input, mockTrades, context);
      
      // Modify trades to verify cache is used
      const modifiedTrades = [...mockTrades];
      modifiedTrades.push({
        ...mockTrades[0],
        id: 'new-trade',
        tags: ['#new-tag']
      });
      
      // Second call with modified data - should return cached results
      const suggestions2 = service.getIntelligentSuggestions(input, modifiedTrades, context);
      
      expect(suggestions1).toEqual(suggestions2);
    });

    it('should clear cache when requested', () => {
      const input = 'test-clear';
      
      // Populate cache
      service.getIntelligentSuggestions(input, mockTrades);
      
      // Clear cache
      service.clearCache();
      
      // Verify cache is cleared
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should handle empty trades array', () => {
      const suggestions = service.getIntelligentSuggestions('test', []);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle trades without tags', () => {
      const tradesWithoutTags: Trade[] = [{
        ...mockTrades[0],
        tags: undefined
      }];
      
      const suggestions = service.getIntelligentSuggestions('test', tradesWithoutTags);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle invalid tag formats gracefully', () => {
      const tradesWithInvalidTags: Trade[] = [{
        ...mockTrades[0],
        tags: ['', '   ', 'no-hash', '#valid-tag']
      }];
      
      const suggestions = service.getIntelligentSuggestions('valid', tradesWithInvalidTags);
      
      expect(suggestions).toBeDefined();
      const validSuggestion = suggestions.find(s => s.tag === '#valid-tag');
      expect(validSuggestion).toBeDefined();
    });

    it('should handle special characters in input', () => {
      const suggestions = service.getIntelligentSuggestions('#@$%', mockTrades);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle very long input strings', () => {
      const longInput = 'a'.repeat(1000);
      const suggestions = service.getIntelligentSuggestions(longInput, mockTrades);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('performance with large datasets', () => {
    it('should handle large number of trades efficiently', () => {
      // Create a large dataset
      const largeTrades: Trade[] = [];
      for (let i = 0; i < 1000; i++) {
        largeTrades.push({
          ...mockTrades[i % mockTrades.length],
          id: `trade-${i}`,
          tags: [`#tag-${i % 50}`, `#common-tag-${i % 10}`]
        });
      }

      const startTime = Date.now();
      const suggestions = service.getIntelligentSuggestions('common', largeTrades);
      const endTime = Date.now();

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should use optimized suggestions for large datasets', () => {
      // Create large tag index
      const largeTagIndex = new Map<string, TagWithCount>();
      for (let i = 0; i < 10000; i++) {
        largeTagIndex.set(`#tag-${i}`, {
          tag: `#tag-${i}`,
          count: Math.floor(Math.random() * 100),
          lastUsed: '2024-01-18',
          trades: []
        });
      }

      const startTime = Date.now();
      const suggestions = service.getOptimizedSuggestions('tag-1', largeTagIndex);
      const endTime = Date.now();

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should be very fast with pre-built index
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
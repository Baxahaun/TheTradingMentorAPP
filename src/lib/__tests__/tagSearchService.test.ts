import { tagSearchService, TagSearchService } from '../tagSearchService';
import { Trade } from '../../types/trade';

// Mock trades for testing
const mockTrades: Trade[] = [
  {
    id: '1',
    currencyPair: 'EURUSD',
    side: 'long',
    status: 'closed',
    date: '2024-01-01',
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    lotSize: 1,
    lotType: 'standard',
    pips: 50,
    pnl: 500,
    tags: ['#scalping', '#morning', '#trend']
  },
  {
    id: '2',
    currencyPair: 'GBPUSD',
    side: 'short',
    status: 'closed',
    date: '2024-01-02',
    entryPrice: 1.2500,
    exitPrice: 1.2450,
    lotSize: 1,
    lotType: 'standard',
    pips: 50,
    pnl: 500,
    tags: ['#scalping', '#afternoon', '#reversal']
  },
  {
    id: '3',
    currencyPair: 'USDJPY',
    side: 'long',
    status: 'closed',
    date: '2024-01-03',
    entryPrice: 150.00,
    exitPrice: 149.50,
    lotSize: 1,
    lotType: 'standard',
    pips: -50,
    pnl: -500,
    tags: ['#swing', '#morning', '#trend']
  },
  {
    id: '4',
    currencyPair: 'AUDUSD',
    side: 'long',
    status: 'open',
    date: '2024-01-04',
    entryPrice: 0.7500,
    lotSize: 1,
    lotType: 'standard',
    tags: ['#swing', '#afternoon']
  },
  {
    id: '5',
    currencyPair: 'USDCAD',
    side: 'short',
    status: 'closed',
    date: '2024-01-05',
    entryPrice: 1.3500,
    exitPrice: 1.3450,
    lotSize: 1,
    lotType: 'standard',
    pips: 50,
    pnl: 500,
    tags: ['#breakout', '#evening']
  }
];

describe('TagSearchService', () => {
  let service: TagSearchService;

  beforeEach(() => {
    service = TagSearchService.getInstance();
  });

  describe('parseSearchQuery', () => {
    it('should parse simple tag queries', () => {
      const query = service.parseSearchQuery('#scalping');
      expect(query).toEqual({
        type: 'TAG',
        value: '#scalping'
      });
    });

    it('should parse AND queries', () => {
      const query = service.parseSearchQuery('#scalping AND #morning');
      expect(query).toEqual({
        type: 'AND',
        children: [
          { type: 'TAG', value: '#scalping' },
          { type: 'TAG', value: '#morning' }
        ]
      });
    });

    it('should parse OR queries', () => {
      const query = service.parseSearchQuery('#scalping OR #swing');
      expect(query).toEqual({
        type: 'OR',
        children: [
          { type: 'TAG', value: '#scalping' },
          { type: 'TAG', value: '#swing' }
        ]
      });
    });

    it('should parse NOT queries', () => {
      const query = service.parseSearchQuery('NOT #scalping');
      expect(query).toEqual({
        type: 'NOT',
        children: [
          { type: 'TAG', value: '#scalping' }
        ]
      });
    });

    it('should parse complex queries with multiple operators', () => {
      const query = service.parseSearchQuery('#scalping AND #morning OR #swing');
      expect(query.type).toBe('OR');
      expect(query.children).toHaveLength(2);
      expect(query.children![0].type).toBe('AND');
      expect(query.children![1].type).toBe('TAG');
    });

    it('should handle queries without # prefix', () => {
      const query = service.parseSearchQuery('scalping AND morning');
      expect(query).toEqual({
        type: 'AND',
        children: [
          { type: 'TAG', value: '#scalping' },
          { type: 'TAG', value: '#morning' }
        ]
      });
    });

    it('should handle empty queries', () => {
      const query = service.parseSearchQuery('');
      expect(query).toEqual({
        type: 'AND',
        children: []
      });
    });

    it('should handle case insensitive operators', () => {
      const query = service.parseSearchQuery('#scalping and #morning');
      expect(query.type).toBe('AND');
      expect(query.children).toHaveLength(2);
    });
  });

  describe('validateSearchQuery', () => {
    it('should validate correct queries', () => {
      const result = service.validateSearchQuery('#scalping AND #morning');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unmatched parentheses', () => {
      const result = service.validateSearchQuery('(#scalping AND #morning');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unmatched opening parenthesis');
    });

    it('should detect consecutive operators', () => {
      const result = service.validateSearchQuery('#scalping AND OR #morning');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot have consecutive operators');
    });

    it('should detect queries ending with operators', () => {
      const result = service.validateSearchQuery('#scalping AND');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query cannot end with AND or OR');
    });

    it('should detect queries starting with AND/OR', () => {
      const result = service.validateSearchQuery('AND #scalping');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query cannot start with AND or OR');
    });

    it('should detect empty NOT', () => {
      const result = service.validateSearchQuery('#scalping AND NOT');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('NOT operator must be followed by a tag');
    });

    it('should allow NOT at the beginning', () => {
      const result = service.validateSearchQuery('NOT #scalping');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('executeSearch', () => {
    it('should find trades with single tag', () => {
      const result = service.executeSearch(mockTrades, '#scalping');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(2);
      expect(result.trades.map(t => t.id)).toEqual(['1', '2']);
      expect(result.matchingTags).toEqual(['#scalping']);
    });

    it('should find trades with AND operation', () => {
      const result = service.executeSearch(mockTrades, '#scalping AND #morning');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(1);
      expect(result.trades[0].id).toBe('1');
      expect(result.matchingTags).toEqual(['#scalping', '#morning']);
    });

    it('should find trades with OR operation', () => {
      const result = service.executeSearch(mockTrades, '#scalping OR #swing');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(4);
      expect(result.trades.map(t => t.id).sort()).toEqual(['1', '2', '3', '4']);
      expect(result.matchingTags).toEqual(['#scalping', '#swing']);
    });

    it('should find trades with NOT operation', () => {
      const result = service.executeSearch(mockTrades, 'NOT #scalping');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(3);
      expect(result.trades.map(t => t.id).sort()).toEqual(['3', '4', '5']);
      expect(result.matchingTags).toEqual(['#scalping']);
    });

    it('should handle complex queries', () => {
      const result = service.executeSearch(mockTrades, '#morning AND (#scalping OR #swing)');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(2);
      expect(result.trades.map(t => t.id).sort()).toEqual(['1', '3']);
    });

    it('should return empty results for non-matching queries', () => {
      const result = service.executeSearch(mockTrades, '#nonexistent');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(0);
      expect(result.matchingTags).toEqual(['#nonexistent']);
    });

    it('should handle invalid queries', () => {
      const result = service.executeSearch(mockTrades, '#scalping AND');
      expect(result.isValid).toBe(false);
      expect(result.trades).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle case insensitive tag matching', () => {
      const result = service.executeSearch(mockTrades, '#SCALPING');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(2);
    });

    it('should handle trades without tags', () => {
      const tradesWithoutTags: Trade[] = [
        {
          id: '6',
          currencyPair: 'EURJPY',
          side: 'long',
          status: 'closed',
          date: '2024-01-06',
          entryPrice: 160.00,
          exitPrice: 160.50,
          lotSize: 1,
          lotType: 'standard',
          pips: 50,
          pnl: 500
        }
      ];

      const result = service.executeSearch([...mockTrades, ...tradesWithoutTags], '#scalping');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(2);
      expect(result.trades.map(t => t.id)).toEqual(['1', '2']);
    });
  });

  describe('getSearchHighlights', () => {
    it('should return highlighting information', () => {
      const trades = mockTrades.slice(0, 2);
      const matchingTags = ['#scalping', '#morning'];
      const highlights = service.getSearchHighlights(trades, matchingTags);
      
      expect(highlights).toHaveLength(2);
      expect(highlights[0]).toEqual({
        tradeId: '1',
        matchingTags: ['#scalping', '#morning']
      });
      expect(highlights[1]).toEqual({
        tradeId: '2',
        matchingTags: ['#scalping']
      });
    });

    it('should handle trades with no matching tags', () => {
      const trades = [mockTrades[4]]; // Trade with #breakout, #evening
      const matchingTags = ['#scalping'];
      const highlights = service.getSearchHighlights(trades, matchingTags);
      
      expect(highlights).toHaveLength(1);
      expect(highlights[0]).toEqual({
        tradeId: '5',
        matchingTags: []
      });
    });
  });

  describe('getSuggestions', () => {
    it('should suggest most used tags for empty query', () => {
      const suggestions = service.getSuggestions(mockTrades, '', 3);
      expect(suggestions).toHaveLength(3);
      expect(suggestions).toContain('#scalping');
      expect(suggestions).toContain('#morning');
    });

    it('should suggest tag completions after operators', () => {
      const suggestions = service.getSuggestions(mockTrades, '#scalping AND ', 2);
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]).toContain('#scalping AND ');
      expect(suggestions[1]).toContain('#scalping AND ');
    });

    it('should suggest partial tag matches', () => {
      const suggestions = service.getSuggestions(mockTrades, '#sc', 5);
      expect(suggestions).toContain('#scalping');
    });
  });

  describe('isTagSearch', () => {
    it('should identify tag searches with # symbol', () => {
      expect(service.isTagSearch('#scalping')).toBe(true);
      expect(service.isTagSearch('#scalping AND #morning')).toBe(true);
    });

    it('should identify tag searches with logical operators', () => {
      expect(service.isTagSearch('scalping AND morning')).toBe(true);
      expect(service.isTagSearch('scalping OR morning')).toBe(true);
      expect(service.isTagSearch('NOT scalping')).toBe(true);
    });

    it('should not identify regular text as tag search', () => {
      expect(service.isTagSearch('EURUSD')).toBe(false);
      expect(service.isTagSearch('long position')).toBe(false);
      expect(service.isTagSearch('')).toBe(false);
    });
  });

  describe('filterToSearchQuery', () => {
    it('should convert simple include filter to query', () => {
      const query = service.filterToSearchQuery(['#scalping'], [], 'AND');
      expect(query).toBe('#scalping');
    });

    it('should convert multiple include filters with AND', () => {
      const query = service.filterToSearchQuery(['#scalping', '#morning'], [], 'AND');
      expect(query).toBe('(#scalping AND #morning)');
    });

    it('should convert multiple include filters with OR', () => {
      const query = service.filterToSearchQuery(['#scalping', '#swing'], [], 'OR');
      expect(query).toBe('(#scalping OR #swing)');
    });

    it('should convert exclude filters', () => {
      const query = service.filterToSearchQuery([], ['#scalping'], 'AND');
      expect(query).toBe('NOT #scalping');
    });

    it('should convert mixed include and exclude filters', () => {
      const query = service.filterToSearchQuery(['#morning'], ['#scalping'], 'AND');
      expect(query).toBe('#morning AND NOT #scalping');
    });

    it('should handle multiple exclude filters', () => {
      const query = service.filterToSearchQuery(['#morning'], ['#scalping', '#swing'], 'AND');
      expect(query).toBe('#morning AND NOT #scalping AND NOT #swing');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed queries gracefully', () => {
      const result = service.executeSearch(mockTrades, '### AND OR NOT');
      expect(result.isValid).toBe(false);
    });

    it('should handle queries with only operators', () => {
      const result = service.executeSearch(mockTrades, 'AND OR NOT');
      expect(result.isValid).toBe(false);
    });

    it('should handle very long queries', () => {
      const longQuery = Array(100).fill('#tag').join(' AND ');
      const result = service.executeSearch(mockTrades, longQuery);
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(0);
    });

    it('should handle special characters in tags', () => {
      const tradesWithSpecialTags: Trade[] = [{
        id: '7',
        currencyPair: 'EURUSD',
        side: 'long',
        status: 'closed',
        date: '2024-01-07',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lotSize: 1,
        lotType: 'standard',
        pips: 50,
        pnl: 500,
        tags: ['#test_tag', '#tag123']
      }];

      const result = service.executeSearch(tradesWithSpecialTags, '#test_tag');
      expect(result.isValid).toBe(true);
      expect(result.trades).toHaveLength(1);
    });
  });
});
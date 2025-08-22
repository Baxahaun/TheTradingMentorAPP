import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useTagSuggestions, 
  useStaticTagSuggestions, 
  usePerformanceTagSuggestions,
  useContextualTagSuggestions 
} from '../useTagSuggestions';
import { Trade } from '../../types/trade';

import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the tag suggestions service
vi.mock('../../lib/tagSuggestionsService', () => ({
  tagSuggestionsService: {
    getIntelligentSuggestions: vi.fn(),
    getRecentlyUsedTags: vi.fn(),
    getContextualSuggestions: vi.fn(),
    getPerformanceBasedSuggestions: vi.fn(),
    clearCache: vi.fn()
  }
}));

// Mock the tag service
vi.mock('../../lib/tagService', () => ({
  tagService: {
    getOptimizedTagSuggestions: vi.fn()
  }
}));

describe('useTagSuggestions', () => {
  let mockTrades: Trade[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockTrades = [
      {
        id: '1',
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-15',
        timeIn: '09:00',
        side: 'long',
        entryPrice: 1.0950,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        tags: ['#breakout', '#major-pair']
      },
      {
        id: '2',
        accountId: 'acc1',
        currencyPair: 'GBP/USD',
        date: '2024-01-16',
        timeIn: '14:00',
        side: 'short',
        entryPrice: 1.2650,
        lotSize: 0.5,
        lotType: 'standard',
        units: 50000,
        commission: 3,
        accountCurrency: 'USD',
        status: 'closed',
        tags: ['#scalping', '#major-pair']
      }
    ];
  });

  describe('useTagSuggestions hook', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useTagSuggestions(mockTrades));

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.fromCache).toBe(false);
    });

    it('should provide all expected methods', () => {
      const { result } = renderHook(() => useTagSuggestions(mockTrades));

      expect(typeof result.current.getSuggestions).toBe('function');
      expect(typeof result.current.clearSuggestions).toBe('function');
      expect(typeof result.current.refreshSuggestions).toBe('function');
      expect(typeof result.current.getRecentTags).toBe('function');
      expect(typeof result.current.getContextualTags).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');
    });

    it('should set loading state when getting suggestions', async () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      tagSuggestionsService.getIntelligentSuggestions.mockResolvedValue([
        { tag: '#test', score: 100, reason: 'exact_match' }
      ]);

      const { result } = renderHook(() => useTagSuggestions(mockTrades, { debounceMs: 0 }));

      act(() => {
        result.current.getSuggestions('test');
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should fetch suggestions with debouncing', async () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      tagSuggestionsService.getIntelligentSuggestions.mockResolvedValue([
        { tag: '#test', score: 100, reason: 'exact_match' }
      ]);

      const { result } = renderHook(() => useTagSuggestions(mockTrades, { debounceMs: 100 }));

      act(() => {
        result.current.getSuggestions('test');
      });

      // Should not call immediately due to debouncing
      expect(tagSuggestionsService.getIntelligentSuggestions).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(tagSuggestionsService.getIntelligentSuggestions).toHaveBeenCalledWith(
          'test',
          mockTrades,
          expect.any(Object),
          10
        );
      });
    });

    it('should use optimized suggestions for large datasets', async () => {
      const { tagService } = require('../../lib/tagService');
      tagService.getOptimizedTagSuggestions.mockReturnValue([
        { tag: '#test', score: 100, reason: 'exact_match' }
      ]);

      const largeTrades = Array(150).fill(mockTrades[0]).map((trade, i) => ({
        ...trade,
        id: `trade-${i}`
      }));

      const { result } = renderHook(() => 
        useTagSuggestions(largeTrades, { useOptimized: true, debounceMs: 0 })
      );

      act(() => {
        result.current.getSuggestions('test');
      });

      await waitFor(() => {
        expect(tagService.getOptimizedTagSuggestions).toHaveBeenCalledWith(
          'test',
          largeTrades,
          undefined,
          10
        );
      });
    });

    it('should respect minimum input length', async () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');

      const { result } = renderHook(() => 
        useTagSuggestions(mockTrades, { minInputLength: 3, debounceMs: 0 })
      );

      act(() => {
        result.current.getSuggestions('te'); // Less than minimum length
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([]);
        expect(tagSuggestionsService.getIntelligentSuggestions).not.toHaveBeenCalled();
      });
    });

    it('should clear suggestions', () => {
      const { result } = renderHook(() => useTagSuggestions(mockTrades));

      // Set some initial state
      act(() => {
        result.current.getSuggestions('test');
      });

      act(() => {
        result.current.clearSuggestions();
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle errors gracefully', async () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      tagSuggestionsService.getIntelligentSuggestions.mockRejectedValue(
        new Error('Test error')
      );

      const { result } = renderHook(() => useTagSuggestions(mockTrades, { debounceMs: 0 }));

      act(() => {
        result.current.getSuggestions('test');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
        expect(result.current.loading).toBe(false);
        expect(result.current.suggestions).toEqual([]);
      });
    });

    it('should get recent tags', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      const mockRecentTags = [
        { tag: '#recent1', score: 100, reason: 'recent_usage' },
        { tag: '#recent2', score: 90, reason: 'recent_usage' }
      ];
      tagSuggestionsService.getRecentlyUsedTags.mockReturnValue(mockRecentTags);

      const { result } = renderHook(() => useTagSuggestions(mockTrades));

      const recentTags = result.current.getRecentTags();

      expect(recentTags).toEqual(mockRecentTags);
      expect(tagSuggestionsService.getRecentlyUsedTags).toHaveBeenCalledWith(mockTrades, 10);
    });

    it('should get contextual tags', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      const mockContextualTags = [
        { tag: '#contextual1', score: 100, reason: 'contextual_match' }
      ];
      tagSuggestionsService.getContextualSuggestions.mockReturnValue(mockContextualTags);

      const { result } = renderHook(() => useTagSuggestions(mockTrades));

      const currentTrade = { currencyPair: 'EUR/USD', side: 'long' as const };
      const contextualTags = result.current.getContextualTags(currentTrade);

      expect(contextualTags).toEqual(mockContextualTags);
      expect(tagSuggestionsService.getContextualSuggestions).toHaveBeenCalledWith(
        currentTrade,
        mockTrades,
        10
      );
    });

    it('should clear cache', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');

      const { result } = renderHook(() => useTagSuggestions(mockTrades));

      result.current.clearCache();

      expect(tagSuggestionsService.clearCache).toHaveBeenCalled();
    });

    it('should refresh suggestions when trades change', async () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      tagSuggestionsService.getIntelligentSuggestions.mockResolvedValue([
        { tag: '#test', score: 100, reason: 'exact_match' }
      ]);

      const { result, rerender } = renderHook(
        ({ trades }) => useTagSuggestions(trades, { debounceMs: 0 }),
        { initialProps: { trades: mockTrades } }
      );

      // Set initial input
      act(() => {
        result.current.getSuggestions('test');
      });

      await waitFor(() => {
        expect(tagSuggestionsService.getIntelligentSuggestions).toHaveBeenCalledTimes(1);
      });

      // Add new trade and rerender
      const newTrades = [...mockTrades, { ...mockTrades[0], id: '3' }];
      rerender({ trades: newTrades });

      await waitFor(() => {
        expect(tagSuggestionsService.getIntelligentSuggestions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('useStaticTagSuggestions hook', () => {
    it('should return recent tags when input is empty', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      const mockRecentTags = [
        { tag: '#recent1', score: 100, reason: 'recent_usage' }
      ];
      tagSuggestionsService.getRecentlyUsedTags.mockReturnValue(mockRecentTags);

      const { result } = renderHook(() => 
        useStaticTagSuggestions(mockTrades, '')
      );

      expect(result.current).toEqual(mockRecentTags);
    });

    it('should return intelligent suggestions for input', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      const mockSuggestions = [
        { tag: '#test', score: 100, reason: 'exact_match' }
      ];
      tagSuggestionsService.getIntelligentSuggestions.mockReturnValue(mockSuggestions);

      const { result } = renderHook(() => 
        useStaticTagSuggestions(mockTrades, 'test')
      );

      expect(result.current).toEqual(mockSuggestions);
    });

    it('should use optimized suggestions for large datasets', () => {
      const { tagService } = require('../../lib/tagService');
      const mockOptimizedSuggestions = [
        { tag: '#test', score: 100, reason: 'exact_match' }
      ];
      tagService.getOptimizedTagSuggestions.mockReturnValue(mockOptimizedSuggestions);

      const largeTrades = Array(150).fill(mockTrades[0]);

      const { result } = renderHook(() => 
        useStaticTagSuggestions(largeTrades, 'test', undefined, { useOptimized: true })
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].tag).toBe('#test');
    });
  });

  describe('usePerformanceTagSuggestions hook', () => {
    it('should return performance-based suggestions', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      const mockPerformanceTags = [
        { tag: '#profitable', score: 100, reason: 'performance_based' }
      ];
      tagSuggestionsService.getPerformanceBasedSuggestions.mockReturnValue(mockPerformanceTags);

      const { result } = renderHook(() => 
        usePerformanceTagSuggestions(mockTrades)
      );

      expect(result.current).toEqual(mockPerformanceTags);
      expect(tagSuggestionsService.getPerformanceBasedSuggestions).toHaveBeenCalledWith(
        mockTrades,
        10
      );
    });

    it('should respect custom limit', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      tagSuggestionsService.getPerformanceBasedSuggestions.mockReturnValue([]);

      const customLimit = 5;
      renderHook(() => usePerformanceTagSuggestions(mockTrades, customLimit));

      expect(tagSuggestionsService.getPerformanceBasedSuggestions).toHaveBeenCalledWith(
        mockTrades,
        customLimit
      );
    });
  });

  describe('useContextualTagSuggestions hook', () => {
    it('should return contextual suggestions', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      const mockContextualTags = [
        { tag: '#contextual', score: 100, reason: 'contextual_match' }
      ];
      tagSuggestionsService.getContextualSuggestions.mockReturnValue(mockContextualTags);

      const currentTrade = { currencyPair: 'EUR/USD', side: 'long' as const };

      const { result } = renderHook(() => 
        useContextualTagSuggestions(mockTrades, currentTrade)
      );

      expect(result.current).toEqual(mockContextualTags);
      expect(tagSuggestionsService.getContextualSuggestions).toHaveBeenCalledWith(
        currentTrade,
        mockTrades,
        10
      );
    });

    it('should update when current trade changes', () => {
      const { tagSuggestionsService } = require('../../lib/tagSuggestionsService');
      tagSuggestionsService.getContextualSuggestions.mockReturnValue([]);

      const initialTrade = { currencyPair: 'EUR/USD', side: 'long' as const };
      const { rerender } = renderHook(
        ({ currentTrade }) => useContextualTagSuggestions(mockTrades, currentTrade),
        { initialProps: { currentTrade: initialTrade } }
      );

      expect(tagSuggestionsService.getContextualSuggestions).toHaveBeenCalledWith(
        initialTrade,
        mockTrades,
        10
      );

      const updatedTrade = { currencyPair: 'GBP/USD', side: 'short' as const };
      rerender({ currentTrade: updatedTrade });

      expect(tagSuggestionsService.getContextualSuggestions).toHaveBeenCalledWith(
        updatedTrade,
        mockTrades,
        10
      );
    });
  });
});
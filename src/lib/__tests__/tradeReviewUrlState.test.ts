import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TradeReviewUrlStateManager } from '../tradeReviewUrlState';
import { TradeReviewUrlState } from '../tradeReviewUrlState';

// Mock window.location and window.history
const mockLocation = {
  href: 'https://example.com/trade/123',
  origin: 'https://example.com',
  pathname: '/trade/123',
  search: ''
};

const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn()
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
});

describe('TradeReviewUrlStateManager', () => {
  beforeEach(() => {
    mockLocation.search = '';
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
  });

  describe('parseFromUrl', () => {
    it('should parse empty URL state', () => {
      mockLocation.search = '';
      const state = TradeReviewUrlStateManager.parseFromUrl();
      expect(state).toEqual({});
    });

    it('should parse mode from URL', () => {
      mockLocation.search = '?mode=edit';
      const state = TradeReviewUrlStateManager.parseFromUrl();
      expect(state.mode).toBe('edit');
    });

    it('should parse panel from URL', () => {
      mockLocation.search = '?panel=analysis';
      const state = TradeReviewUrlStateManager.parseFromUrl();
      expect(state.panel).toBe('analysis');
    });

    it('should parse expanded sections from URL', () => {
      mockLocation.search = '?expanded=notes,charts,performance';
      const state = TradeReviewUrlStateManager.parseFromUrl();
      expect(state.expandedSections).toEqual(['notes', 'charts', 'performance']);
    });

    it('should parse navigation source from URL', () => {
      mockLocation.search = '?from=calendar';
      const state = TradeReviewUrlStateManager.parseFromUrl();
      expect(state.navigationSource).toBe('calendar');
    });

    it('should parse complete URL state', () => {
      mockLocation.search = '?mode=review&panel=performance&expanded=notes,charts&from=trade-list';
      const state = TradeReviewUrlStateManager.parseFromUrl();
      
      expect(state).toEqual({
        mode: 'review',
        panel: 'performance',
        expandedSections: ['notes', 'charts'],
        navigationSource: 'trade-list'
      });
    });

    it('should ignore invalid values', () => {
      mockLocation.search = '?mode=invalid&panel=unknown&from=badSource';
      const state = TradeReviewUrlStateManager.parseFromUrl();
      expect(state).toEqual({});
    });
  });

  describe('updateUrl', () => {
    it('should update URL with mode', () => {
      TradeReviewUrlStateManager.updateUrl('123', { mode: 'edit' });
      expect(mockHistory.pushState).toHaveBeenCalledWith(null, '', '/trade/123?mode=edit');
    });

    it('should remove default mode from URL', () => {
      mockLocation.search = '?mode=edit';
      TradeReviewUrlStateManager.updateUrl('123', { mode: 'view' });
      expect(mockHistory.pushState).toHaveBeenCalledWith(null, '', '/trade/123');
    });

    it('should update URL with panel', () => {
      TradeReviewUrlStateManager.updateUrl('123', { panel: 'analysis' });
      expect(mockHistory.pushState).toHaveBeenCalledWith(null, '', '/trade/123?panel=analysis');
    });

    it('should remove default panel from URL', () => {
      mockLocation.search = '?panel=analysis';
      TradeReviewUrlStateManager.updateUrl('123', { panel: 'data' });
      expect(mockHistory.pushState).toHaveBeenCalledWith(null, '', '/trade/123');
    });

    it('should update URL with expanded sections', () => {
      TradeReviewUrlStateManager.updateUrl('123', { expandedSections: ['notes', 'charts'] });
      expect(mockHistory.pushState).toHaveBeenCalledWith(null, '', '/trade/123?expanded=notes%2Ccharts');
    });

    it('should remove empty expanded sections from URL', () => {
      mockLocation.search = '?expanded=notes,charts';
      TradeReviewUrlStateManager.updateUrl('123', { expandedSections: [] });
      expect(mockHistory.pushState).toHaveBeenCalledWith(null, '', '/trade/123');
    });

    it('should use replace option', () => {
      TradeReviewUrlStateManager.updateUrl('123', { mode: 'edit' }, { replace: true });
      expect(mockHistory.replaceState).toHaveBeenCalledWith(null, '', '/trade/123?mode=edit');
      expect(mockHistory.pushState).not.toHaveBeenCalled();
    });
  });

  describe('generateShareableUrl', () => {
    it('should generate basic shareable URL', () => {
      const state: TradeReviewUrlState = {
        mode: 'view',
        panel: 'data',
        expandedSections: [],
      };

      const url = TradeReviewUrlStateManager.generateShareableUrl('123', state);
      expect(url).toBe('https://example.com/trade/123');
    });

    it('should generate shareable URL with non-default values', () => {
      const state: TradeReviewUrlState = {
        mode: 'edit',
        panel: 'analysis',
        expandedSections: ['notes', 'charts'],
        navigationSource: 'calendar'
      };

      const url = TradeReviewUrlStateManager.generateShareableUrl('123', state);
      expect(url).toBe('https://example.com/trade/123?mode=edit&panel=analysis&expanded=notes%2Ccharts&from=calendar');
    });

    it('should use custom base URL', () => {
      const state: TradeReviewUrlState = {
        mode: 'review',
        panel: 'performance',
        expandedSections: []
      };

      const url = TradeReviewUrlStateManager.generateShareableUrl('123', state, 'https://custom.com');
      expect(url).toBe('https://custom.com/trade/123?mode=review&panel=performance');
    });
  });

  describe('createTradeNavigationUrl', () => {
    it('should create basic navigation URL', () => {
      const url = TradeReviewUrlStateManager.createTradeNavigationUrl('456', {}, false);
      expect(url).toBe('https://example.com/trade/456');
    });

    it('should preserve context when requested', () => {
      const currentState = {
        mode: 'edit' as const,
        panel: 'analysis' as const,
        navigationSource: 'calendar' as const
      };

      const url = TradeReviewUrlStateManager.createTradeNavigationUrl('456', currentState, true);
      expect(url).toBe('https://example.com/trade/456?mode=edit&panel=analysis&from=calendar');
    });

    it('should not preserve default values', () => {
      const currentState = {
        mode: 'view' as const,
        panel: 'data' as const
      };

      const url = TradeReviewUrlStateManager.createTradeNavigationUrl('456', currentState, true);
      expect(url).toBe('https://example.com/trade/456');
    });
  });

  describe('parseNavigationContext', () => {
    it('should return null for no navigation source', () => {
      mockLocation.search = '';
      const context = TradeReviewUrlStateManager.parseNavigationContext();
      expect(context).toBeNull();
    });

    it('should parse navigation context from URL', () => {
      mockLocation.search = '?from=calendar';
      const context = TradeReviewUrlStateManager.parseNavigationContext();
      
      expect(context).toEqual({
        source: 'calendar',
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: expect.any(Number)
      });
    });

    it('should return null for invalid navigation source', () => {
      mockLocation.search = '?from=invalid';
      const context = TradeReviewUrlStateManager.parseNavigationContext();
      expect(context).toBeNull();
    });
  });

  describe('cleanupUrl', () => {
    it('should remove trade review parameters', () => {
      mockLocation.search = '?mode=edit&panel=analysis&expanded=notes&from=calendar&other=keep';
      mockLocation.href = 'https://example.com/trade/123' + mockLocation.search;
      
      TradeReviewUrlStateManager.cleanupUrl();
      
      expect(mockHistory.replaceState).toHaveBeenCalledWith(null, '', '/trade/123?other=keep');
    });

    it('should handle empty parameters after cleanup', () => {
      mockLocation.search = '?mode=edit&panel=analysis';
      mockLocation.href = 'https://example.com/trade/123' + mockLocation.search;
      
      TradeReviewUrlStateManager.cleanupUrl();
      
      expect(mockHistory.replaceState).toHaveBeenCalledWith(null, '', '/trade/123');
    });
  });

  describe('validateUrlState', () => {
    it('should validate correct state', () => {
      const state: Partial<TradeReviewUrlState> = {
        mode: 'edit',
        panel: 'analysis',
        expandedSections: ['notes'],
        navigationSource: 'calendar'
      };

      const result = TradeReviewUrlStateManager.validateUrlState(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect invalid mode', () => {
      const state = { mode: 'invalid' as any };
      const result = TradeReviewUrlStateManager.validateUrlState(state);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid mode: invalid');
    });

    it('should detect invalid panel', () => {
      const state = { panel: 'invalid' as any };
      const result = TradeReviewUrlStateManager.validateUrlState(state);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid panel: invalid');
    });

    it('should detect invalid expanded sections', () => {
      const state = { expandedSections: 'not-array' as any };
      const result = TradeReviewUrlStateManager.validateUrlState(state);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Expanded sections must be an array');
    });

    it('should detect invalid navigation source', () => {
      const state = { navigationSource: 'invalid' as any };
      const result = TradeReviewUrlStateManager.validateUrlState(state);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid navigation source: invalid');
    });
  });
});
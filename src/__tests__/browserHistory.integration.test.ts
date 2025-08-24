/**
 * Browser History Integration Tests
 * 
 * Tests the integration between browser history service and routing system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { browserHistoryService, HistoryState } from '../lib/browserHistoryService';
import { NavigationContext } from '../types/navigation';

// Mock window.history
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  state: null
};

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
});

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/',
  pathname: '/',
  search: '',
  origin: 'http://localhost:3000'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock document
Object.defineProperty(document, 'title', {
  value: 'Test',
  writable: true
});

describe('Browser History Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistory.state = null;
    document.title = 'Test';
  });

  describe('History State Management', () => {
    it('should push trade state to browser history', () => {
      const navigationContext: NavigationContext = {
        source: 'calendar',
        sourceParams: { date: '2024-01-01' },
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      browserHistoryService.pushTradeState('trade-1', 'view', navigationContext);

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeId: 'trade-1',
          mode: 'view',
          navigationContext,
          source: 'trade-review'
        }),
        'Trade trade-1 | Trade Review System',
        '/trade/trade-1'
      );

      expect(document.title).toBe('Trade trade-1 | Trade Review System');
    });

    it('should replace current history state', () => {
      const initialState: HistoryState = {
        tradeId: 'trade-1',
        mode: 'view',
        timestamp: Date.now(),
        source: 'trade-review'
      };

      mockHistory.state = initialState;

      browserHistoryService.replaceCurrentState(
        { mode: 'edit' },
        { title: 'Trade trade-1 - Edit | Trade Review System' }
      );

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeId: 'trade-1',
          mode: 'edit',
          source: 'trade-review'
        }),
        'Trade trade-1 - Edit | Trade Review System',
        'http://localhost:3000/'
      );

      expect(document.title).toBe('Trade trade-1 - Edit | Trade Review System');
    });

    it('should handle replace with no current state', () => {
      mockHistory.state = null;

      browserHistoryService.replaceCurrentState({ mode: 'edit' });

      expect(mockHistory.replaceState).not.toHaveBeenCalled();
    });

    it('should get current history state', () => {
      const state: HistoryState = {
        tradeId: 'trade-1',
        mode: 'view',
        timestamp: Date.now(),
        source: 'trade-review'
      };

      mockHistory.state = state;

      const currentState = browserHistoryService.getCurrentState();

      expect(currentState).toEqual(state);
    });

    it('should return null for invalid history state', () => {
      mockHistory.state = { invalid: 'state' };

      const currentState = browserHistoryService.getCurrentState();

      expect(currentState).toBeNull();
    });
  });

  describe('Navigation Methods', () => {
    it('should call browser back method', () => {
      browserHistoryService.goBack();

      expect(mockHistory.back).toHaveBeenCalled();
    });

    it('should call browser forward method', () => {
      browserHistoryService.goForward();

      expect(mockHistory.forward).toHaveBeenCalled();
    });

    it('should detect back navigation capability', () => {
      const navigationContext: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      const state: HistoryState = {
        tradeId: 'trade-1',
        mode: 'view',
        navigationContext,
        timestamp: Date.now(),
        source: 'trade-review'
      };

      mockHistory.state = state;

      const canGoBack = browserHistoryService.canGoBack();

      expect(canGoBack).toBe(true);
    });

    it('should detect no back navigation when no context', () => {
      const state: HistoryState = {
        tradeId: 'trade-1',
        mode: 'view',
        timestamp: Date.now(),
        source: 'trade-review'
      };

      mockHistory.state = state;

      const canGoBack = browserHistoryService.canGoBack();

      expect(canGoBack).toBe(false);
    });
  });

  describe('URL Building', () => {
    it('should build correct URLs for different modes', () => {
      const testCases = [
        { tradeId: 'trade-1', mode: 'view' as const, expected: '/trade/trade-1' },
        { tradeId: 'trade-2', mode: 'edit' as const, expected: '/trade/trade-2/edit' },
        { tradeId: 'trade-3', mode: 'review' as const, expected: '/trade/trade-3/review' }
      ];

      testCases.forEach(({ tradeId, mode, expected }) => {
        browserHistoryService.pushTradeState(tradeId, mode);

        expect(mockHistory.pushState).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(String),
          expected
        );
      });
    });

    it('should build correct titles for different modes', () => {
      const testCases = [
        { tradeId: 'trade-1', mode: 'view' as const, expected: 'Trade trade-1 | Trade Review System' },
        { tradeId: 'trade-2', mode: 'edit' as const, expected: 'Trade trade-2 - Edit | Trade Review System' },
        { tradeId: 'trade-3', mode: 'review' as const, expected: 'Trade trade-3 - Review | Trade Review System' }
      ];

      testCases.forEach(({ tradeId, mode, expected }) => {
        browserHistoryService.pushTradeState(tradeId, mode);

        expect(mockHistory.pushState).toHaveBeenCalledWith(
          expect.any(Object),
          expected,
          expect.any(String)
        );
      });
    });
  });

  describe('Navigation Entry Creation', () => {
    it('should create navigation entries for external navigation', () => {
      const context: NavigationContext = {
        source: 'trade-list',
        sourceParams: { page: 2 },
        breadcrumb: ['dashboard', 'trade-list'],
        timestamp: Date.now()
      };

      browserHistoryService.createNavigationEntry(
        '/trades?page=2',
        context,
        { title: 'Trade List - Page 2' }
      );

      expect(mockHistory.pushState).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeId: '',
          mode: 'view',
          navigationContext: context,
          source: 'navigation'
        }),
        'Trade List - Page 2',
        '/trades?page=2'
      );
    });

    it('should replace navigation entry when specified', () => {
      const context: NavigationContext = {
        source: 'search',
        breadcrumb: ['dashboard', 'search'],
        timestamp: Date.now()
      };

      browserHistoryService.createNavigationEntry(
        '/search?q=EUR/USD',
        context,
        { title: 'Search Results', replace: true }
      );

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.objectContaining({
          navigationContext: context,
          source: 'navigation'
        }),
        'Search Results',
        '/search?q=EUR/USD'
      );
    });
  });

  describe('History Cleanup', () => {
    it('should clean up trade history state', () => {
      const tradeState: HistoryState = {
        tradeId: 'trade-1',
        mode: 'view',
        timestamp: Date.now(),
        source: 'trade-review'
      };

      mockHistory.state = tradeState;

      browserHistoryService.cleanupTradeHistory();

      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeId: '',
          mode: 'view',
          source: 'direct'
        }),
        'Trade Review System',
        '/'
      );
    });

    it('should not clean up non-trade history state', () => {
      const navigationState: HistoryState = {
        tradeId: '',
        mode: 'view',
        timestamp: Date.now(),
        source: 'navigation'
      };

      mockHistory.state = navigationState;

      browserHistoryService.cleanupTradeHistory();

      expect(mockHistory.replaceState).not.toHaveBeenCalled();
    });
  });

  describe('Event Listeners', () => {
    it('should add and notify event listeners', () => {
      const listener = vi.fn();
      browserHistoryService.addListener(listener);

      const navigationContext: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      browserHistoryService.pushTradeState('trade-1', 'view', navigationContext);

      expect(listener).toHaveBeenCalledWith({
        state: expect.objectContaining({
          tradeId: 'trade-1',
          mode: 'view',
          navigationContext
        }),
        url: '/trade/trade-1',
        title: 'Trade trade-1 | Trade Review System'
      });

      browserHistoryService.removeListener(listener);
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = vi.fn(() => {
        throw new Error('Listener error');
      });

      browserHistoryService.addListener(faultyListener);

      expect(() => {
        browserHistoryService.pushTradeState('trade-1', 'view');
      }).not.toThrow();

      browserHistoryService.removeListener(faultyListener);
    });

    it('should remove event listeners correctly', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      browserHistoryService.addListener(listener1);
      browserHistoryService.addListener(listener2);

      browserHistoryService.removeListener(listener1);

      browserHistoryService.pushTradeState('trade-1', 'view');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      browserHistoryService.removeListener(listener2);
    });
  });

  describe('PopState Handling', () => {
    it('should handle popstate events', () => {
      const listener = vi.fn();
      browserHistoryService.addListener(listener);

      const state: HistoryState = {
        tradeId: 'trade-1',
        mode: 'view',
        timestamp: Date.now(),
        source: 'trade-review'
      };

      // Simulate popstate event
      const popstateEvent = new PopStateEvent('popstate', { state });
      window.dispatchEvent(popstateEvent);

      expect(listener).toHaveBeenCalledWith({
        state,
        url: 'http://localhost:3000/',
        title: 'Test'
      });

      browserHistoryService.removeListener(listener);
    });

    it('should ignore popstate events with invalid state', () => {
      const listener = vi.fn();
      browserHistoryService.addListener(listener);

      // Simulate popstate event with invalid state
      const popstateEvent = new PopStateEvent('popstate', { 
        state: { invalid: 'state' } 
      });
      window.dispatchEvent(popstateEvent);

      expect(listener).not.toHaveBeenCalled();

      browserHistoryService.removeListener(listener);
    });
  });

  describe('State Validation', () => {
    it('should validate history state structure', () => {
      const validState: HistoryState = {
        tradeId: 'trade-1',
        mode: 'view',
        timestamp: Date.now(),
        source: 'trade-review'
      };

      mockHistory.state = validState;

      const currentState = browserHistoryService.getCurrentState();

      expect(currentState).toEqual(validState);
    });

    it('should reject invalid state structures', () => {
      const invalidStates = [
        null,
        undefined,
        'string',
        123,
        { tradeId: 123 }, // wrong type
        { mode: 'invalid' }, // invalid mode
        { source: 'invalid' }, // invalid source
        { timestamp: 'invalid' } // wrong type
      ];

      invalidStates.forEach(invalidState => {
        mockHistory.state = invalidState;

        const currentState = browserHistoryService.getCurrentState();

        expect(currentState).toBeNull();
      });
    });
  });
});
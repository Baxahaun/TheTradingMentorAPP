/**
 * Navigation Context Integration Tests
 * 
 * Tests the integration between navigation context service and routing system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import navigationContextService from '../lib/navigationContextService';
import TradeReviewUrlStateManager from '../lib/tradeReviewUrlState';
import { NavigationContext } from '../types/navigation';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/',
  search: '',
  pathname: '/',
  origin: 'http://localhost:3000'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock history API
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  state: null
};

Object.defineProperty(window, 'history', {
  value: mockHistory
});

describe('Navigation Context Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationContextService.clearContext();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    navigationContextService.clearContext();
  });

  describe('Context Persistence', () => {
    it('should persist navigation context to localStorage', () => {
      const context: NavigationContext = {
        source: 'calendar',
        sourceParams: { date: '2024-01-01' },
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      navigationContextService.setContext('trade-1', context);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'trade-review-navigation-context',
        expect.stringContaining('"source":"calendar"')
      );
    });

    it('should restore navigation context from localStorage', () => {
      const context: NavigationContext = {
        source: 'trade-list',
        sourceParams: { page: 2, sortBy: 'date' },
        breadcrumb: ['dashboard', 'trade-list'],
        timestamp: Date.now()
      };

      const storedState = {
        currentTradeId: 'trade-1',
        context,
        history: ['trade-1'],
        historyIndex: 0,
        canNavigateBack: true,
        canNavigateForward: false
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedState));

      // Create new service instance to trigger restoration
      const newService = navigationContextService;
      const restoredContext = newService.getContext();

      expect(restoredContext).toMatchObject({
        source: 'trade-list',
        sourceParams: { page: 2, sortBy: 'date' }
      });
    });

    it('should clear invalid stored context', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const context = navigationContextService.getContext();

      expect(context).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('trade-review-navigation-context');
    });

    it('should clear stale context', () => {
      const staleContext: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      const storedState = {
        currentTradeId: 'trade-1',
        context: staleContext,
        history: ['trade-1'],
        historyIndex: 0,
        canNavigateBack: true,
        canNavigateForward: false
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedState));

      const context = navigationContextService.getContext();

      expect(context).toBeNull();
    });
  });

  describe('URL State Integration', () => {
    it('should create context from URL parameters', () => {
      mockLocation.search = '?from=search&q=EUR/USD&page=2';

      const context = navigationContextService.createContextFromLocation('search');

      expect(context).toMatchObject({
        source: 'search',
        sourceParams: {
          searchQuery: 'EUR/USD',
          page: 2
        }
      });
    });

    it('should generate correct back URLs for different sources', () => {
      const calendarContext: NavigationContext = {
        source: 'calendar',
        sourceParams: { date: '2024-01-01', viewMode: 'calendar' },
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      const backUrl = navigationContextService.getBackUrl(calendarContext);

      expect(backUrl).toBe('/calendar?date=2024-01-01&view=calendar');
    });

    it('should generate back URLs with trade list filters', () => {
      const tradeListContext: NavigationContext = {
        source: 'trade-list',
        sourceParams: {
          page: 3,
          sortBy: 'pnl',
          sortOrder: 'desc',
          filters: {
            status: 'closed',
            profitability: 'profitable',
            currencyPairs: ['EUR/USD', 'GBP/USD'],
            dateRange: { start: '2024-01-01', end: '2024-01-31' }
          }
        },
        breadcrumb: ['dashboard', 'trade-list'],
        timestamp: Date.now()
      };

      const backUrl = navigationContextService.getBackUrl(tradeListContext);

      expect(backUrl).toContain('/trades');
      expect(backUrl).toContain('page=3');
      expect(backUrl).toContain('sort=pnl');
      expect(backUrl).toContain('order=desc');
      expect(backUrl).toContain('status=closed');
      expect(backUrl).toContain('profit=profitable');
      expect(backUrl).toContain('pairs=EUR%2FUSD%2CGBP%2FUSD');
    });

    it('should integrate with URL state manager', () => {
      mockLocation.search = '?from=analytics&range=1M&tab=performance';

      const urlContext = TradeReviewUrlStateManager.parseNavigationContext();
      
      expect(urlContext).toMatchObject({
        source: 'analytics'
      });

      if (urlContext) {
        const fullContext = navigationContextService.createContextFromLocation(
          urlContext.source,
          { timeRange: '1M', activeTab: 'performance' }
        );

        expect(fullContext.sourceParams).toMatchObject({
          timeRange: '1M',
          activeTab: 'performance'
        });
      }
    });
  });

  describe('Back Navigation Labels', () => {
    it('should generate appropriate labels for different sources', () => {
      const contexts = [
        {
          context: {
            source: 'calendar' as const,
            sourceParams: { date: '2024-01-01' },
            breadcrumb: ['dashboard', 'calendar'],
            timestamp: Date.now()
          },
          expectedLabel: 'Back to Calendar (1/1/2024)'
        },
        {
          context: {
            source: 'search' as const,
            sourceParams: { searchQuery: 'EUR/USD' },
            breadcrumb: ['dashboard', 'search'],
            timestamp: Date.now()
          },
          expectedLabel: 'Back to Search Results ("EUR/USD")'
        },
        {
          context: {
            source: 'trade-list' as const,
            sourceParams: {
              filters: {
                status: 'closed' as const,
                profitability: 'profitable' as const
              }
            },
            breadcrumb: ['dashboard', 'trade-list'],
            timestamp: Date.now()
          },
          expectedLabel: 'Back to Trade List (2 filters)'
        }
      ];

      contexts.forEach(({ context, expectedLabel }) => {
        const label = navigationContextService.generateBackLabel(context);
        expect(label).toBe(expectedLabel);
      });
    });

    it('should handle contexts without specific parameters', () => {
      const context: NavigationContext = {
        source: 'dashboard',
        breadcrumb: ['dashboard'],
        timestamp: Date.now()
      };

      const label = navigationContextService.generateBackLabel(context);
      expect(label).toBe('Back to Dashboard');
    });
  });

  describe('Context Validation', () => {
    it('should validate context structure', () => {
      const validContext: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      const validation = navigationContextService.validateContext(validContext);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid context structure', () => {
      const invalidContext = {
        source: '',
        breadcrumb: null,
        timestamp: 'invalid'
      } as any;

      const validation = navigationContextService.validateContext(invalidContext);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect stale contexts', () => {
      const staleContext: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      const validation = navigationContextService.validateContext(staleContext);

      expect(validation.isStale).toBe(true);
      expect(validation.warnings).toContain(expect.stringContaining('stale'));
    });
  });

  describe('History Management', () => {
    it('should track navigation history', () => {
      const context: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      navigationContextService.setContext('trade-1', context);
      navigationContextService.setContext('trade-2', context);

      const navState = navigationContextService.getNavigationState();

      expect(navState?.history).toEqual(['trade-1', 'trade-2']);
      expect(navState?.currentTradeId).toBe('trade-2');
      expect(navState?.canNavigateBack).toBe(true);
    });

    it('should handle history navigation', () => {
      const context: NavigationContext = {
        source: 'trade-list',
        breadcrumb: ['dashboard', 'trade-list'],
        timestamp: Date.now()
      };

      navigationContextService.setContext('trade-1', context);
      navigationContextService.setContext('trade-2', context);
      navigationContextService.setContext('trade-3', context);

      const previousTradeId = navigationContextService.navigateToPreviousTrade();
      expect(previousTradeId).toBe('trade-2');

      const navState = navigationContextService.getNavigationState();
      expect(navState?.currentTradeId).toBe('trade-2');
      expect(navState?.canNavigateForward).toBe(true);

      const nextTradeId = navigationContextService.navigateToNextTrade();
      expect(nextTradeId).toBe('trade-3');
    });

    it('should limit history length', () => {
      const context: NavigationContext = {
        source: 'dashboard',
        breadcrumb: ['dashboard'],
        timestamp: Date.now()
      };

      // Add more trades than the max history length (50)
      for (let i = 1; i <= 55; i++) {
        navigationContextService.setContext(`trade-${i}`, context);
      }

      const navState = navigationContextService.getNavigationState();
      expect(navState?.history.length).toBeLessThanOrEqual(50);
      expect(navState?.history).toContain('trade-55');
      expect(navState?.history).not.toContain('trade-1');
    });
  });

  describe('Event System', () => {
    it('should emit events for context changes', () => {
      const eventListener = vi.fn();
      navigationContextService.addEventListener(eventListener);

      const context: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      navigationContextService.setContext('trade-1', context);

      expect(eventListener).toHaveBeenCalledWith({
        type: 'CONTEXT_SET',
        payload: expect.objectContaining({ source: 'calendar' })
      });

      navigationContextService.clearContext();

      expect(eventListener).toHaveBeenCalledWith({
        type: 'CONTEXT_CLEARED',
        payload: null
      });

      navigationContextService.removeEventListener(eventListener);
    });

    it('should handle event listener errors gracefully', () => {
      const faultyListener = vi.fn(() => {
        throw new Error('Listener error');
      });

      navigationContextService.addEventListener(faultyListener);

      const context: NavigationContext = {
        source: 'dashboard',
        breadcrumb: ['dashboard'],
        timestamp: Date.now()
      };

      // Should not throw despite listener error
      expect(() => {
        navigationContextService.setContext('trade-1', context);
      }).not.toThrow();

      navigationContextService.removeEventListener(faultyListener);
    });
  });
});
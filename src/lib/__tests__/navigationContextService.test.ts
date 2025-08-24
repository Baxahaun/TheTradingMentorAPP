/**
 * Unit tests for NavigationContextService
 * 
 * Tests cover all core functionality including context management,
 * localStorage persistence, validation, and navigation logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { NavigationContextService, getNavigationContextService } from '../navigationContextService';
import { NavigationContext, NavigationEvent } from '../../types/navigation';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window properties
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/trades?page=1&sort=date',
  },
  writable: true,
});

Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
  },
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Browser)',
  writable: true,
});

Object.defineProperty(document, 'referrer', {
  value: 'http://localhost:3000/dashboard',
  writable: true,
});

describe('NavigationContextService', () => {
  let service: NavigationContextService;
  let eventListener: Mock;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create fresh service instance
    service = NavigationContextService.getInstance({
      enableDebugLogging: false,
      defaultMaxAge: 1000 * 60 * 60, // 1 hour for testing
    });
    
    // Clear any existing context
    service.clearContext();
    
    // Setup event listener
    eventListener = vi.fn();
    service.addEventListener(eventListener);
  });

  afterEach(() => {
    service.removeEventListener(eventListener);
    service.clearContext();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NavigationContextService.getInstance();
      const instance2 = NavigationContextService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should work with convenience function', () => {
      const instance1 = getNavigationContextService();
      const instance2 = NavigationContextService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Context Management', () => {
    const mockContext: NavigationContext = {
      source: 'calendar',
      sourceParams: {
        date: '2024-01-15',
        viewMode: 'calendar',
      },
      breadcrumb: ['calendar'],
      timestamp: Date.now(),
    };

    it('should set navigation context', () => {
      service.setContext('trade-123', mockContext);
      
      const retrievedContext = service.getContext();
      expect(retrievedContext).toEqual(expect.objectContaining({
        source: 'calendar',
        sourceParams: mockContext.sourceParams,
        breadcrumb: ['calendar'],
      }));
      
      expect(eventListener).toHaveBeenCalledWith({
        type: 'CONTEXT_SET',
        payload: expect.objectContaining(mockContext),
      });
    });

    it('should add metadata when setting context', () => {
      service.setContext('trade-123', mockContext, { includeMetadata: true });
      
      const retrievedContext = service.getContext();
      expect(retrievedContext?.metadata).toEqual({
        userAgent: 'Mozilla/5.0 (Test Browser)',
        screenSize: '1920x1080',
        referrer: 'http://localhost:3000/dashboard',
      });
    });

    it('should not add metadata when disabled', () => {
      service.setContext('trade-123', mockContext, { includeMetadata: false });
      
      const retrievedContext = service.getContext();
      expect(retrievedContext?.metadata).toBeUndefined();
    });

    it('should validate context with custom validator', () => {
      const validator = vi.fn().mockReturnValue(false);
      
      expect(() => {
        service.setContext('trade-123', mockContext, { validator });
      }).toThrow('Invalid navigation context provided');
      
      expect(validator).toHaveBeenCalledWith(mockContext);
    });

    it('should get current navigation state', () => {
      service.setContext('trade-123', mockContext);
      
      const state = service.getNavigationState();
      expect(state).toEqual(expect.objectContaining({
        currentTradeId: 'trade-123',
        context: expect.objectContaining({
          source: mockContext.source,
          sourceParams: mockContext.sourceParams,
          breadcrumb: mockContext.breadcrumb,
        }),
        history: ['trade-123'],
        historyIndex: 0,
        canNavigateBack: true,
        canNavigateForward: false,
      }));
    });

    it('should clear navigation context', () => {
      service.setContext('trade-123', mockContext);
      service.clearContext();
      
      expect(service.getContext()).toBeNull();
      expect(service.getNavigationState()).toBeNull();
      expect(eventListener).toHaveBeenCalledWith({
        type: 'CONTEXT_CLEARED',
        payload: null,
      });
    });
  });

  describe('localStorage Persistence', () => {
    const mockContext: NavigationContext = {
      source: 'trade-list',
      sourceParams: { page: 2 },
      breadcrumb: ['trade-list'],
      timestamp: Date.now(),
    };

    it('should persist context to localStorage by default', () => {
      service.setContext('trade-123', mockContext);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'trade-review-navigation-context',
        expect.stringContaining('"currentTradeId":"trade-123"')
      );
    });

    it('should not persist when disabled', () => {
      service.setContext('trade-123', mockContext, { persist: false });
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should restore context from localStorage on initialization', () => {
      const storedState = {
        currentTradeId: 'trade-456',
        context: mockContext,
        history: ['trade-456'],
        historyIndex: 0,
        canNavigateBack: true,
        canNavigateForward: false,
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedState));
      
      // Manually trigger initialization by calling the private method
      (service as any).initializeFromStorage();
      
      expect(service.getContext()).toEqual(expect.objectContaining(mockContext));
    });

    it('should clear localStorage when context is cleared', () => {
      service.setContext('trade-123', mockContext);
      service.clearContext();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('trade-review-navigation-context');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw
      expect(() => {
        service.setContext('trade-123', mockContext);
      }).not.toThrow();
    });
  });

  describe('Back Navigation Labels', () => {
    it('should generate calendar back label', () => {
      const context: NavigationContext = {
        source: 'calendar',
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['calendar'],
        timestamp: Date.now(),
      };
      
      const label = service.generateBackLabel(context);
      expect(label).toMatch(/Back to Calendar \(\d{1,2}\/\d{1,2}\/\d{4}\)/);
    });

    it('should generate trade list back label with filters', () => {
      const context: NavigationContext = {
        source: 'trade-list',
        sourceParams: {
          filters: {
            status: 'closed',
            currencyPairs: ['EUR/USD'],
            profitability: 'profitable',
          },
        },
        breadcrumb: ['trade-list'],
        timestamp: Date.now(),
      };
      
      const label = service.generateBackLabel(context);
      expect(label).toBe('Back to Trade List (3 filters)');
    });

    it('should generate search back label', () => {
      const context: NavigationContext = {
        source: 'search',
        sourceParams: { searchQuery: 'EUR/USD profitable' },
        breadcrumb: ['search'],
        timestamp: Date.now(),
      };
      
      const label = service.generateBackLabel(context);
      expect(label).toBe('Back to Search Results ("EUR/USD profitable")');
    });

    it('should generate default back label when no context', () => {
      const label = service.generateBackLabel();
      expect(label).toBe('Back');
    });
  });

  describe('Back Navigation URLs', () => {
    it('should generate calendar URL with parameters', () => {
      const context: NavigationContext = {
        source: 'calendar',
        sourceParams: {
          date: '2024-01-15',
          viewMode: 'calendar',
        },
        breadcrumb: ['calendar'],
        timestamp: Date.now(),
      };
      
      const url = service.getBackUrl(context);
      expect(url).toBe('/calendar?date=2024-01-15&view=calendar');
    });

    it('should generate trade list URL with filters and pagination', () => {
      const context: NavigationContext = {
        source: 'trade-list',
        sourceParams: {
          page: 2,
          sortBy: 'date',
          sortOrder: 'desc',
          filters: {
            status: 'closed',
            currencyPairs: ['EUR/USD', 'GBP/USD'],
          },
        },
        breadcrumb: ['trade-list'],
        timestamp: Date.now(),
      };
      
      const url = service.getBackUrl(context);
      expect(url).toContain('/trades?');
      expect(url).toContain('page=2');
      expect(url).toContain('sort=date');
      expect(url).toContain('order=desc');
      expect(url).toContain('status=closed');
      expect(url).toContain('pairs=EUR%2FUSD%2CGBP%2FUSD');
    });

    it('should generate search URL', () => {
      const context: NavigationContext = {
        source: 'search',
        sourceParams: {
          searchQuery: 'profitable trades',
          page: 1,
        },
        breadcrumb: ['search'],
        timestamp: Date.now(),
      };
      
      const url = service.getBackUrl(context);
      expect(url).toBe('/search?q=profitable+trades&page=1');
    });

    it('should return root URL when no context', () => {
      const url = service.getBackUrl();
      expect(url).toBe('/');
    });
  });

  describe('Trade History Navigation', () => {
    beforeEach(() => {
      const context: NavigationContext = {
        source: 'trade-list',
        breadcrumb: ['trade-list'],
        timestamp: Date.now(),
      };
      
      // Set up history with multiple trades
      service.setContext('trade-1', context);
      service.setContext('trade-2', context);
      service.setContext('trade-3', context);
    });

    it('should navigate to previous trade', () => {
      const previousTradeId = service.navigateToPreviousTrade();
      expect(previousTradeId).toBe('trade-2');
      
      const state = service.getNavigationState();
      expect(state?.currentTradeId).toBe('trade-2');
      expect(state?.canNavigateBack).toBe(true);
      expect(state?.canNavigateForward).toBe(true);
    });

    it('should navigate to next trade', () => {
      service.navigateToPreviousTrade(); // Go to trade-2
      const nextTradeId = service.navigateToNextTrade();
      expect(nextTradeId).toBe('trade-3');
      
      const state = service.getNavigationState();
      expect(state?.currentTradeId).toBe('trade-3');
      expect(state?.canNavigateBack).toBe(true);
      expect(state?.canNavigateForward).toBe(false);
    });

    it('should return null when no previous trade', () => {
      service.navigateToPreviousTrade(); // trade-2
      service.navigateToPreviousTrade(); // trade-1
      const result = service.navigateToPreviousTrade(); // Should be null
      
      expect(result).toBeNull();
    });

    it('should return null when no next trade', () => {
      const result = service.navigateToNextTrade();
      expect(result).toBeNull();
    });

    it('should emit navigation events', () => {
      service.navigateToPreviousTrade();
      
      expect(eventListener).toHaveBeenCalledWith({
        type: 'NAVIGATION_BACK',
        payload: expect.any(Object),
      });
    });
  });

  describe('Context Validation', () => {
    it('should validate valid context', () => {
      const context: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['calendar'],
        timestamp: Date.now(),
      };
      
      const validation = service.validateContext(context);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.isStale).toBe(false);
    });

    it('should detect missing required fields', () => {
      const invalidContext = {
        breadcrumb: ['calendar'],
        timestamp: Date.now(),
      } as NavigationContext;
      
      const validation = service.validateContext(invalidContext);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Navigation source is required');
    });

    it('should detect stale context', () => {
      const staleContext: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['calendar'],
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago (more than 24 hour default)
      };
      
      const validation = service.validateContext(staleContext);
      expect(validation.isStale).toBe(true);
      expect(validation.warnings[0]).toContain('Context is stale');
    });

    it('should clear invalid context on retrieval', () => {
      const invalidContext = {
        source: 'calendar',
        breadcrumb: ['calendar'],
        timestamp: 'invalid',
      } as any;
      
      service.setContext('trade-123', invalidContext, { persist: false });
      
      // Manually set invalid context to test validation on retrieval
      (service as any).currentState = {
        currentTradeId: 'trade-123',
        context: invalidContext,
        history: ['trade-123'],
        historyIndex: 0,
        canNavigateBack: true,
        canNavigateForward: false,
      };
      
      const result = service.getContext();
      expect(result).toBeNull();
    });
  });

  describe('Context Creation from Location', () => {
    it('should create calendar context from URL', () => {
      window.location.href = 'http://localhost:3000/calendar?date=2024-01-15&view=calendar';
      
      const context = service.createContextFromLocation('calendar');
      expect(context).toEqual({
        source: 'calendar',
        sourceParams: {
          date: '2024-01-15',
          viewMode: 'calendar',
        },
        breadcrumb: ['calendar'],
        timestamp: expect.any(Number),
      });
    });

    it('should create trade-list context from URL', () => {
      window.location.href = 'http://localhost:3000/trades?page=2&sort=date&order=desc';
      
      const context = service.createContextFromLocation('trade-list');
      expect(context).toEqual({
        source: 'trade-list',
        sourceParams: {
          page: 2,
          sortBy: 'date',
          sortOrder: 'desc',
        },
        breadcrumb: ['trade-list'],
        timestamp: expect.any(Number),
      });
    });

    it('should create search context from URL', () => {
      window.location.href = 'http://localhost:3000/search?q=profitable+trades&page=1';
      
      const context = service.createContextFromLocation('search');
      expect(context).toEqual({
        source: 'search',
        sourceParams: {
          searchQuery: 'profitable trades',
          page: 1,
        },
        breadcrumb: ['search'],
        timestamp: expect.any(Number),
      });
    });

    it('should merge additional parameters', () => {
      const context = service.createContextFromLocation('dashboard', {
        activeTab: 'performance',
      });
      
      expect(context.sourceParams?.activeTab).toBe('performance');
    });
  });

  describe('Event System', () => {
    it('should add and remove event listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      service.addEventListener(listener1);
      service.addEventListener(listener2);
      
      const context: NavigationContext = {
        source: 'calendar',
        breadcrumb: ['calendar'],
        timestamp: Date.now(),
      };
      
      service.setContext('trade-123', context);
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      service.removeEventListener(listener1);
      service.clearContext();
      
      expect(listener1).toHaveBeenCalledTimes(1); // Only the first call
      expect(listener2).toHaveBeenCalledTimes(2); // Both calls
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      service.addEventListener(errorListener);
      
      // Should not throw
      expect(() => {
        const context: NavigationContext = {
          source: 'calendar',
          breadcrumb: ['calendar'],
          timestamp: Date.now(),
        };
        service.setContext('trade-123', context);
      }).not.toThrow();
    });
  });

  describe('Analytics', () => {
    it('should return analytics data', () => {
      const analytics = service.getAnalytics();
      
      expect(analytics).toEqual({
        sourceDistribution: {
          'calendar': 0,
          'trade-list': 0,
          'search': 0,
          'dashboard': 0,
          'analytics': 0,
        },
        averageSessionDuration: 0,
        mostCommonPaths: [],
        backNavigationUsage: 0,
        contextRestorationSuccess: 0,
      });
    });
  });
});
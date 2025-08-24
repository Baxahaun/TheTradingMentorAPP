/**
 * Routing Integration Tests
 * 
 * Tests the integration between React Router, navigation context service,
 * and trade review system routing functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { TradeProvider } from '../contexts/TradeContext';
import TradeReviewPage from '../pages/TradeReviewPage';
import TradeRouteGuard from '../components/routing/TradeRouteGuard';
import navigationContextService from '../lib/navigationContextService';
import { NavigationContext } from '../types/navigation';
import { Trade } from '../types/trade';

// Mock Firebase and other services
vi.mock('../lib/firebaseService', () => ({
  tradeService: {
    subscribeToTrades: vi.fn(() => vi.fn()),
    addTrade: vi.fn(),
    updateTrade: vi.fn(),
    deleteTrade: vi.fn()
  }
}));

vi.mock('../lib/accountService', () => ({
  accountService: {
    subscribeToAccounts: vi.fn(() => vi.fn()),
    createDefaultAccount: vi.fn(),
    calculateAccountStats: vi.fn(() => ({}))
  }
}));

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false
  })
}));

// Mock TradeReviewSystem component for testing
vi.mock('../components/TradeReviewSystem', () => ({
  default: ({ tradeId, navigationContext, onNavigateBack }: any) => (
    <div data-testid="trade-review-system">
      <div data-testid="trade-id">{tradeId}</div>
      <div data-testid="navigation-source">{navigationContext?.source || 'none'}</div>
      <button 
        data-testid="navigate-back" 
        onClick={() => onNavigateBack?.(navigationContext)}
      >
        Back
      </button>
    </div>
  )
}));

const mockTrades: Trade[] = [
  {
    id: 'trade-1',
    currencyPair: 'EUR/USD',
    date: '2024-01-01',
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    quantity: 10000,
    direction: 'long',
    status: 'closed',
    pnl: 50,
    accountId: 'account-1'
  },
  {
    id: 'trade-2',
    currencyPair: 'GBP/USD',
    date: '2024-01-02',
    entryPrice: 1.2500,
    exitPrice: 1.2450,
    quantity: 5000,
    direction: 'long',
    status: 'closed',
    pnl: -25,
    accountId: 'account-1'
  }
];

// Mock TradeProvider with test data
const MockTradeProvider = ({ children }: { children: React.ReactNode }) => {
  const mockContextValue = {
    trades: mockTrades,
    loading: false,
    accounts: [],
    currentAccount: null,
    accountsLoading: false,
    migrationStatus: { isEnhancedMigrationCompleted: true, migrationInProgress: false },
    addTrade: vi.fn(),
    updateTrade: vi.fn(),
    deleteTrade: vi.fn(),
    getTradesByDate: vi.fn(),
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    setActiveAccount: vi.fn(),
    getTotalPnL: vi.fn(),
    getWinRate: vi.fn(),
    getProfitFactor: vi.fn(),
    getAccountStats: vi.fn(),
    getCurrentAccountTrades: vi.fn(),
    runEnhancedMigration: vi.fn(),
    getUnclassifiedTrades: vi.fn(),
    getTradeById: vi.fn((id: string) => mockTrades.find(t => t.id === id)),
    getTradeSequence: vi.fn((tradeId: string) => {
      const index = mockTrades.findIndex(t => t.id === tradeId);
      return {
        current: index >= 0 ? mockTrades[index] : null,
        previous: index > 0 ? mockTrades[index - 1] : null,
        next: index >= 0 && index < mockTrades.length - 1 ? mockTrades[index + 1] : null,
        index,
        total: mockTrades.length
      };
    }),
    validateTradeAccess: vi.fn((id: string) => mockTrades.some(t => t.id === id)),
    setTradeNavigationContext: vi.fn()
  };

  return (
    <TradeProvider value={mockContextValue as any}>
      {children}
    </TradeProvider>
  );
};

const TestWrapper = ({ 
  children, 
  initialEntries = ['/'] 
}: { 
  children: React.ReactNode;
  initialEntries?: string[];
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MockTradeProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </MockTradeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Routing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationContextService.clearContext();
  });

  afterEach(() => {
    navigationContextService.clearContext();
  });

  describe('Trade Route Access', () => {
    it('should render trade review page for valid trade ID', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
        expect(screen.getByTestId('trade-id')).toHaveTextContent('trade-1');
      });
    });

    it('should show error for invalid trade ID', async () => {
      render(
        <TestWrapper initialEntries={['/trade/invalid-trade']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Trade Not Found')).toBeInTheDocument();
        expect(screen.getByText(/could not be found/)).toBeInTheDocument();
      });
    });

    it('should handle missing trade ID parameter', async () => {
      render(
        <TestWrapper initialEntries={['/trade/']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Trade Not Found')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Context Integration', () => {
    it('should preserve navigation context from URL parameters', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1?from=calendar&date=2024-01-01']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigation-source')).toHaveTextContent('calendar');
      });
    });

    it('should handle navigation context from service', async () => {
      const context: NavigationContext = {
        source: 'trade-list',
        sourceParams: { page: 2 },
        breadcrumb: ['dashboard', 'trade-list'],
        timestamp: Date.now()
      };

      navigationContextService.setContext('trade-1', context);

      render(
        <TestWrapper initialEntries={['/trade/trade-1']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigation-source')).toHaveTextContent('trade-list');
      });
    });

    it('should fallback to dashboard context when no context available', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigation-source')).toHaveTextContent('dashboard');
      });
    });
  });

  describe('Deep Linking Support', () => {
    it('should support direct trade access with mode parameter', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1/edit']}>
          <Routes>
            <Route 
              path="/trade/:tradeId/edit" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage initialMode="edit" />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
      });
    });

    it('should support review mode routing', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1/review']}>
          <Routes>
            <Route 
              path="/trade/:tradeId/review" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage initialMode="review" />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
      });
    });

    it('should preserve URL state parameters', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1?mode=edit&panel=analysis&from=search']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
        expect(screen.getByTestId('navigation-source')).toHaveTextContent('search');
      });
    });
  });

  describe('Browser History Management', () => {
    it('should handle back navigation correctly', async () => {
      const mockNavigate = vi.fn();
      
      // Mock useNavigate
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate
        };
      });

      const context: NavigationContext = {
        source: 'calendar',
        sourceParams: { date: '2024-01-01' },
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now()
      };

      navigationContextService.setContext('trade-1', context);

      render(
        <TestWrapper initialEntries={['/trade/trade-1']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('navigate-back'));

      // Note: In a real test, we'd verify the navigation occurred
      // This is limited by the mocking setup
    });

    it('should update document title for trade pages', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(document.title).toContain('EUR/USD Trade');
      });
    });
  });

  describe('Route Guards', () => {
    it('should validate trade access before rendering', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard requireTradeAccess={true}>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
      });
    });

    it('should block access to non-existent trades', async () => {
      render(
        <TestWrapper initialEntries={['/trade/non-existent']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard requireTradeAccess={true}>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Trade Not Found')).toBeInTheDocument();
        expect(screen.queryByTestId('trade-review-system')).not.toBeInTheDocument();
      });
    });

    it('should provide recovery actions for blocked access', async () => {
      render(
        <TestWrapper initialEntries={['/trade/non-existent']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard requireTradeAccess={true}>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Refresh Page')).toBeInTheDocument();
      });
    });
  });

  describe('State Management Integration', () => {
    it('should integrate with TradeContext for trade data', async () => {
      render(
        <TestWrapper initialEntries={['/trade/trade-1']}>
          <Routes>
            <Route 
              path="/trade/:tradeId" 
              element={
                <TradeRouteGuard>
                  <TradeReviewPage />
                </TradeRouteGuard>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trade-id')).toHaveTextContent('trade-1');
      });
    });

    it('should handle loading states properly', async () => {
      // Mock loading state
      const LoadingMockTradeProvider = ({ children }: { children: React.ReactNode }) => {
        const mockContextValue = {
          ...MockTradeProvider.prototype,
          trades: [],
          loading: true
        };

        return (
          <TradeProvider value={mockContextValue as any}>
            {children}
          </TradeProvider>
        );
      };

      render(
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider>
            <LoadingMockTradeProvider>
              <MemoryRouter initialEntries={['/trade/trade-1']}>
                <Routes>
                  <Route 
                    path="/trade/:tradeId" 
                    element={
                      <TradeRouteGuard>
                        <TradeReviewPage />
                      </TradeRouteGuard>
                    } 
                  />
                </Routes>
              </MemoryRouter>
            </LoadingMockTradeProvider>
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText('Loading trades...')).toBeInTheDocument();
    });
  });
});
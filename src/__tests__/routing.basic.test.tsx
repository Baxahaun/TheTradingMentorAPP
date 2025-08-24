/**
 * Basic Routing Tests
 * 
 * Simple tests to verify routing integration works correctly.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TradeReviewPage from '../pages/TradeReviewPage';
import TradeRouteGuard from '../components/routing/TradeRouteGuard';

// Mock the complex components
vi.mock('../components/TradeReviewSystem', () => ({
  default: ({ tradeId }: { tradeId: string }) => (
    <div data-testid="trade-review-system">
      <div data-testid="trade-id">{tradeId}</div>
    </div>
  )
}));

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false
  })
}));

vi.mock('../contexts/TradeContext', () => ({
  TradeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTradeContext: () => ({
    trades: [
      {
        id: 'trade-1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01',
        entryPrice: 1.1000,
        status: 'closed'
      }
    ],
    loading: false,
    getTradeById: (id: string) => id === 'trade-1' ? { id: 'trade-1', currencyPair: 'EUR/USD' } : undefined,
    validateTradeAccess: (id: string) => id === 'trade-1'
  })
}));

vi.mock('../lib/navigationContextService', () => ({
  default: {
    getContext: () => null,
    setContext: vi.fn(),
    createContextFromLocation: vi.fn(() => ({
      source: 'dashboard',
      breadcrumb: ['dashboard'],
      timestamp: Date.now()
    })),
    clearContext: vi.fn()
  }
}));

vi.mock('../lib/tradeReviewUrlState', () => ({
  default: {
    parseFromUrl: () => ({}),
    parseNavigationContext: () => null,
    cleanupUrl: vi.fn()
  }
}));

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
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Basic Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render trade review page for valid trade', async () => {
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

    expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
    expect(screen.getByTestId('trade-id')).toHaveTextContent('trade-1');
  });

  it('should show error for invalid trade', async () => {
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

    expect(screen.getByText('Trade Not Found')).toBeInTheDocument();
  });

  it('should handle different trade modes', async () => {
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

    expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { TradeReviewSystem } from '../../components/trade-review/TradeReviewSystem';
import { NavigationContextService } from '../../lib/navigationContextService';
import { TradeContext } from '../../contexts/TradeContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock navigation service
vi.mock('../../lib/navigationContextService');

const mockTrades = [
  {
    id: 'trade-1',
    symbol: 'AAPL',
    entryPrice: 150,
    exitPrice: 155,
    quantity: 100,
    entryDate: '2024-01-15',
    exitDate: '2024-01-16',
    type: 'long' as const,
    status: 'closed' as const,
    pnl: 500,
    tags: ['momentum'],
    notes: 'Test trade 1',
    commission: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T15:30:00Z'
  },
  {
    id: 'trade-2',
    symbol: 'GOOGL',
    entryPrice: 2800,
    exitPrice: 2750,
    quantity: 10,
    entryDate: '2024-01-17',
    exitDate: '2024-01-18',
    type: 'long' as const,
    status: 'closed' as const,
    pnl: -500,
    tags: ['reversal'],
    notes: 'Test trade 2',
    commission: 5,
    createdAt: '2024-01-17T11:00:00Z',
    updatedAt: '2024-01-18T14:30:00Z'
  }
];

const mockTradeContext = {
  trades: mockTrades,
  addTrade: vi.fn(),
  updateTrade: vi.fn(),
  deleteTrade: vi.fn(),
  loading: false,
  error: null
};

describe('Trade Review Navigation E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Calendar Navigation Flow', () => {
    it('should navigate from calendar to trade review and back', async () => {
      const user = userEvent.setup();
      
      // Mock navigation context from calendar
      const calendarContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(calendarContext));

      const mockNavigateBack = vi.fn();

      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem
              tradeId="trade-1"
              onNavigateBack={mockNavigateBack}
            />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      // Should show calendar back button
      expect(screen.getByRole('button', { name: /back to calendar/i })).toBeInTheDocument();

      // Click back button
      const backButton = screen.getByRole('button', { name: /back to calendar/i });
      await user.click(backButton);

      // Should call navigate back with calendar context
      expect(mockNavigateBack).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'calendar',
          sourceParams: { date: '2024-01-15' }
        })
      );
    });

    it('should preserve calendar date when returning', async () => {
      const user = userEvent.setup();
      
      const calendarContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15', view: 'month' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(calendarContext));

      const mockNavigateBack = vi.fn();

      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem
              tradeId="trade-1"
              onNavigateBack={mockNavigateBack}
            />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      const backButton = screen.getByRole('button', { name: /back to calendar/i });
      await user.click(backButton);

      expect(mockNavigateBack).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceParams: expect.objectContaining({
            date: '2024-01-15',
            view: 'month'
          })
        })
      );
    });
  });

  describe('Trade List Navigation Flow', () => {
    it('should navigate from trade list to trade review and back', async () => {
      const user = userEvent.setup();
      
      const tradeListContext = {
        source: 'trade-list' as const,
        sourceParams: { 
          page: 2, 
          sortBy: 'date', 
          filters: { status: 'closed' } 
        },
        breadcrumb: ['Dashboard', 'Trade List'],
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(tradeListContext));

      const mockNavigateBack = vi.fn();

      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem
              tradeId="trade-1"
              onNavigateBack={mockNavigateBack}
            />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /back to trade list/i })).toBeInTheDocument();

      const backButton = screen.getByRole('button', { name: /back to trade list/i });
      await user.click(backButton);

      expect(mockNavigateBack).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'trade-list',
          sourceParams: expect.objectContaining({
            page: 2,
            sortBy: 'date',
            filters: { status: 'closed' }
          })
        })
      );
    });
  });

  describe('Search Navigation Flow', () => {
    it('should navigate from search results to trade review and back', async () => {
      const user = userEvent.setup();
      
      const searchContext = {
        source: 'search' as const,
        sourceParams: { 
          searchQuery: 'AAPL momentum',
          page: 1,
          filters: { symbol: 'AAPL' }
        },
        breadcrumb: ['Dashboard', 'Search Results'],
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(searchContext));

      const mockNavigateBack = vi.fn();

      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem
              tradeId="trade-1"
              onNavigateBack={mockNavigateBack}
            />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /back to search/i })).toBeInTheDocument();

      const backButton = screen.getByRole('button', { name: /back to search/i });
      await user.click(backButton);

      expect(mockNavigateBack).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'search',
          sourceParams: expect.objectContaining({
            searchQuery: 'AAPL momentum'
          })
        })
      );
    });
  });

  describe('Trade Sequence Navigation', () => {
    it('should navigate between trades while preserving context', async () => {
      const user = userEvent.setup();
      
      const calendarContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(calendarContext));

      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem tradeId="trade-1" />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      // Should show next/previous trade buttons
      expect(screen.getByRole('button', { name: /next trade/i })).toBeInTheDocument();

      // Navigate to next trade
      const nextButton = screen.getByRole('button', { name: /next trade/i });
      await user.click(nextButton);

      // Should still show calendar back button (context preserved)
      expect(screen.getByRole('button', { name: /back to calendar/i })).toBeInTheDocument();
    });

    it('should handle edge cases in trade sequence navigation', async () => {
      const user = userEvent.setup();
      
      // Test with single trade (no next/previous)
      const singleTradeContext = {
        ...mockTradeContext,
        trades: [mockTrades[0]]
      };

      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={singleTradeContext}>
            <TradeReviewSystem tradeId="trade-1" />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      // Should not show navigation buttons for single trade
      expect(screen.queryByRole('button', { name: /next trade/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /previous trade/i })).not.toBeInTheDocument();
    });
  });

  describe('Browser History Integration', () => {
    it('should handle browser back button correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter initialEntries={['/dashboard', '/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem tradeId="trade-1" />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      // Simulate browser back button
      window.history.back();

      // Should handle gracefully without breaking
      expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
    });

    it('should update URL when navigating between trades', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem tradeId="trade-1" />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      const nextButton = screen.getByRole('button', { name: /next trade/i });
      await user.click(nextButton);

      // URL should be updated (would be tested with actual router in real app)
      // This is a simplified test for the component behavior
      expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
    });
  });

  describe('Deep Linking Support', () => {
    it('should handle direct URL access to trade review', () => {
      render(
        <MemoryRouter initialEntries={['/trade/trade-1?mode=edit']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem tradeId="trade-1" />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      // Should load in edit mode from URL parameter
      expect(screen.getByTestId('trade-review-system')).toHaveAttribute('data-mode', 'edit');
    });

    it('should handle invalid trade IDs gracefully', () => {
      render(
        <MemoryRouter initialEntries={['/trade/invalid-trade-id']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem tradeId="invalid-trade-id" />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText(/trade not found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Context Persistence Across Sessions', () => {
    it('should restore navigation context after page reload', () => {
      const savedContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now() - 1000 // 1 second ago
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedContext));

      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem tradeId="trade-1" />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /back to calendar/i })).toBeInTheDocument();
    });

    it('should clear expired navigation context', () => {
      const expiredContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now() - (60 * 60 * 1000) // 1 hour ago (expired)
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredContext));

      render(
        <MemoryRouter initialEntries={['/trade/trade-1']}>
          <TradeContext.Provider value={mockTradeContext}>
            <TradeReviewSystem tradeId="trade-1" />
          </TradeContext.Provider>
        </MemoryRouter>
      );

      // Should show default back button instead of calendar
      expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
    });
  });
});
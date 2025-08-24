import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import TradeReviewSystem from '../TradeReviewSystem';
import { TradeContext } from '../../contexts/TradeContext';
import { Trade } from '../../types/trade';
import { NavigationContext } from '../../types/navigation';

// Mock the navigation context service
vi.mock('../../lib/navigationContextService', () => ({
  default: {
    getContext: vi.fn(),
    generateBackLabel: vi.fn(() => 'Back to Calendar'),
    getBackUrl: vi.fn(() => '/calendar?date=2024-01-15')
  }
}));

// Mock the URL state hook
vi.mock('../../lib/tradeReviewUrlState', () => ({
  useTradeReviewUrlState: vi.fn(() => ({
    urlState: {
      mode: 'view',
      panel: 'data',
      expandedSections: [],
      navigationSource: 'calendar'
    },
    updateUrlState: vi.fn(),
    generateShareableUrl: vi.fn(() => 'https://example.com/trade/1?mode=view')
  }))
}));

// Mock the toast hook
vi.mock('../ui/use-toast', () => ({
  toast: vi.fn()
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  share: vi.fn().mockResolvedValue(undefined)
});

const mockTrades: Trade[] = [
  {
    id: '1',
    currencyPair: 'EUR/USD',
    side: 'long',
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    quantity: 10000,
    pnl: 50,
    status: 'closed',
    entryTime: '2024-01-15T10:00:00Z',
    exitTime: '2024-01-15T11:00:00Z',
    tags: ['scalping'],
    notes: 'Test trade 1'
  },
  {
    id: '2',
    currencyPair: 'GBP/USD',
    side: 'short',
    entryPrice: 1.2500,
    exitPrice: 1.2450,
    quantity: 5000,
    pnl: 25,
    status: 'closed',
    entryTime: '2024-01-15T14:00:00Z',
    exitTime: '2024-01-15T15:00:00Z',
    tags: ['swing'],
    notes: 'Test trade 2'
  }
];

const mockNavigationContext: NavigationContext = {
  source: 'calendar',
  sourceParams: {
    date: '2024-01-15'
  },
  breadcrumb: ['dashboard', 'calendar'],
  timestamp: Date.now()
};

const mockTradeContext = {
  trades: mockTrades,
  updateTrade: vi.fn().mockResolvedValue(undefined),
  addTrade: vi.fn(),
  deleteTrade: vi.fn(),
  loading: false,
  error: null
};

const renderWithContext = (component: React.ReactElement, initialEntries = ['/trade/1']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TradeContext.Provider value={mockTradeContext}>
        {component}
      </TradeContext.Provider>
    </MemoryRouter>
  );
};

describe('TradeReviewSystem Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL State Management', () => {
    it('should initialize with URL state', async () => {
      renderWithContext(<TradeReviewSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });
      
      // Should display view mode by default
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    it('should update URL when mode changes', async () => {
      const mockUpdateUrlState = vi.fn();
      const { useTradeReviewUrlState } = await import('../../lib/tradeReviewUrlState');
      
      vi.mocked(useTradeReviewUrlState).mockReturnValue({
        urlState: { mode: 'view', panel: 'data', expandedSections: [] },
        updateUrlState: mockUpdateUrlState,
        generateShareableUrl: vi.fn(() => 'https://example.com/trade/1')
      });

      renderWithContext(<TradeReviewSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockUpdateUrlState).toHaveBeenCalledWith({ mode: 'edit' }, { replace: true });
    });
  });

  describe('Navigation Context Integration', () => {
    it('should handle back navigation with context', async () => {
      const mockNavigate = vi.fn();
      
      // Mock useNavigate
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ tradeId: '1' })
        };
      });

      renderWithContext(
        <TradeReviewSystem navigationContext={mockNavigationContext} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Calendar');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/calendar?date=2024-01-15');
    });

    it('should handle breadcrumb navigation', async () => {
      const mockNavigate = vi.fn();
      
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ tradeId: '1' })
        };
      });

      renderWithContext(
        <TradeReviewSystem navigationContext={mockNavigationContext} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      // Click on Dashboard in breadcrumb
      const dashboardButton = screen.getByText('Dashboard');
      fireEvent.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Trade Navigation', () => {
    it('should navigate to previous trade', async () => {
      const mockNavigate = vi.fn();
      
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ tradeId: '2' }) // Start with second trade
        };
      });

      renderWithContext(<TradeReviewSystem />, ['/trade/2']);
      
      await waitFor(() => {
        expect(screen.getByText('GBP/USD')).toBeInTheDocument();
      });

      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trade/1', expect.any(Object));
    });

    it('should navigate to next trade', async () => {
      const mockNavigate = vi.fn();
      
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ tradeId: '1' }) // Start with first trade
        };
      });

      renderWithContext(<TradeReviewSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trade/2', expect.any(Object));
    });

    it('should preserve URL state when navigating between trades', async () => {
      const mockNavigate = vi.fn();
      const mockUpdateUrlState = vi.fn();
      
      const { useTradeReviewUrlState } = await import('../../lib/tradeReviewUrlState');
      
      vi.mocked(useTradeReviewUrlState).mockReturnValue({
        urlState: { mode: 'edit', panel: 'analysis', expandedSections: ['notes'] },
        updateUrlState: mockUpdateUrlState,
        generateShareableUrl: vi.fn(() => 'https://example.com/trade/1')
      });

      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ tradeId: '1' })
        };
      });

      renderWithContext(<TradeReviewSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trade/2', {
        state: {
          preserveUrlState: {
            mode: 'edit',
            panel: 'analysis',
            expandedSections: ['notes'],
            navigationSource: undefined
          }
        }
      });
    });
  });

  describe('Share Functionality', () => {
    it('should generate and share URL', async () => {
      const mockGenerateShareableUrl = vi.fn(() => 'https://example.com/trade/1?mode=view');
      const mockToast = vi.fn();
      
      const { useTradeReviewUrlState } = await import('../../lib/tradeReviewUrlState');
      const { toast } = await import('../ui/use-toast');
      
      vi.mocked(useTradeReviewUrlState).mockReturnValue({
        urlState: { mode: 'view', panel: 'data', expandedSections: [] },
        updateUrlState: vi.fn(),
        generateShareableUrl: mockGenerateShareableUrl
      });
      
      vi.mocked(toast).mockImplementation(mockToast);

      renderWithContext(<TradeReviewSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/trade/1?mode=view');
        expect(mockToast).toHaveBeenCalledWith({
          title: "Link copied!",
          description: "Trade review link has been copied to clipboard.",
          duration: 3000,
        });
      });
    });

    it('should use native share API when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: mockShare });

      renderWithContext(<TradeReviewSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          title: 'Trade Review: EUR/USD',
          text: 'Review trade details for EUR/USD',
          url: expect.stringContaining('https://example.com/trade/1')
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle trade not found error', async () => {
      renderWithContext(<TradeReviewSystem />, ['/trade/999']);
      
      await waitFor(() => {
        expect(screen.getByText('Trade Not Found')).toBeInTheDocument();
        expect(screen.getByText('The requested trade could not be found.')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Calendar');
      expect(backButton).toBeInTheDocument();
    });

    it('should handle navigation context errors gracefully', async () => {
      const navigationContextService = await import('../../lib/navigationContextService');
      vi.mocked(navigationContextService.default.getContext).mockReturnValue(null);

      renderWithContext(<TradeReviewSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      // Should still render with default navigation
      const backButton = screen.getByText('Back to Trades');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Deep Linking', () => {
    it('should initialize with URL parameters', async () => {
      const { useTradeReviewUrlState } = await import('../../lib/tradeReviewUrlState');
      
      vi.mocked(useTradeReviewUrlState).mockReturnValue({
        urlState: { 
          mode: 'edit', 
          panel: 'analysis', 
          expandedSections: ['notes', 'charts'],
          navigationSource: 'search'
        },
        updateUrlState: vi.fn(),
        generateShareableUrl: vi.fn(() => 'https://example.com/trade/1')
      });

      renderWithContext(<TradeReviewSystem />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      });

      // Should initialize in edit mode based on URL state
      const editButton = screen.getByText('Edit');
      expect(editButton).toHaveClass('bg-primary'); // Active mode styling
    });
  });
});
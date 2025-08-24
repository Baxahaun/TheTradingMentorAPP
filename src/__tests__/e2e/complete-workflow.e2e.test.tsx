/**
 * End-to-End Complete Workflow Tests
 * 
 * Tests complete user workflows from start to finish across the entire system.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import App from '../../App';
import { mockTrades } from '../mocks/tradeData';
import { mockUser } from '../mocks/userData';

// Mock all external dependencies
vi.mock('../../lib/firebase', () => ({
  auth: {
    currentUser: mockUser,
    onAuthStateChanged: vi.fn((callback) => {
      callback(mockUser);
      return () => {};
    }),
  },
  db: {},
}));

const mockNavigationService = {
  setContext: vi.fn(),
  getContext: vi.fn(),
  generateBackLabel: vi.fn(),
  getBackUrl: vi.fn(),
  clearContext: vi.fn(),
  createContextFromLocation: vi.fn(),
};

vi.mock('../../lib/navigationContextService', () => ({
  default: mockNavigationService,
}));

const mockTradeContext = {
  trades: mockTrades,
  updateTrade: vi.fn().mockResolvedValue(undefined),
  deleteTrade: vi.fn().mockResolvedValue(undefined),
  addTrade: vi.fn().mockResolvedValue(undefined),
  loading: false,
  error: null,
};

vi.mock('../../contexts/TradeContext', async () => {
  const actual = await vi.importActual('../../contexts/TradeContext');
  return {
    ...actual,
    useTradeContext: () => mockTradeContext,
  };
});

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Complete Workflow E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Reset navigation service mocks
    mockNavigationService.getContext.mockReturnValue({
      source: 'dashboard',
      breadcrumb: ['dashboard'],
      timestamp: Date.now(),
    });
    mockNavigationService.generateBackLabel.mockReturnValue('Back to Dashboard');
    mockNavigationService.getBackUrl.mockReturnValue('/');

    // Mock browser APIs
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        assign: vi.fn(),
        replace: vi.fn(),
      },
      writable: true,
    });

    Object.defineProperty(window, 'history', {
      value: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        state: null,
      },
      writable: true,
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dashboard to Trade Review Workflow', () => {
    it('should complete full workflow: Dashboard → Trade Review → Edit → Save → Back', async () => {
      // Start at dashboard
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/trading journal/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Step 1: Navigate to trade from dashboard
      // Simulate clicking on a trade card or calendar entry
      window.history.pushState(
        { 
          navigationContext: {
            source: 'dashboard',
            breadcrumb: ['dashboard'],
            timestamp: Date.now(),
          }
        }, 
        '', 
        '/trade/trade-1'
      );

      // Re-render with new route
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Step 2: Verify trade review system loads
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByText(/EUR\/USD/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Step 3: Switch to edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      // Step 4: Make changes to trade data
      const currencyInput = screen.getByDisplayValue(/EUR\/USD/i);
      await user.clear(currencyInput);
      await user.type(currencyInput, 'GBP/USD');

      // Navigate to analysis panel and add notes
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /analysis/i })).toBeInTheDocument();
      });

      const notesSection = screen.getByRole('region', { name: /notes/i });
      const noteInput = within(notesSection).getByRole('textbox');
      await user.type(noteInput, 'Updated analysis notes for this trade');

      // Step 5: Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify save was called with correct data
      await waitFor(() => {
        expect(mockTradeContext.updateTrade).toHaveBeenCalledWith(
          'trade-1',
          expect.objectContaining({
            currencyPair: 'GBP/USD',
          })
        );
      });

      // Step 6: Navigate back to dashboard
      const backButton = screen.getByRole('button', { name: /back to dashboard/i });
      await user.click(backButton);

      // Verify navigation service was called
      expect(mockNavigationService.getBackUrl).toHaveBeenCalled();
    });

    it('should handle calendar to trade review workflow', async () => {
      // Set up calendar navigation context
      mockNavigationService.getContext.mockReturnValue({
        source: 'calendar',
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now(),
      });
      mockNavigationService.generateBackLabel.mockReturnValue('Back to Calendar');
      mockNavigationService.getBackUrl.mockReturnValue('/?view=calendar&date=2024-01-15');

      // Navigate directly to trade with calendar context
      window.history.pushState(
        { 
          navigationContext: {
            source: 'calendar',
            sourceParams: { date: '2024-01-15' },
            breadcrumb: ['dashboard', 'calendar'],
            timestamp: Date.now(),
          }
        }, 
        '', 
        '/trade/trade-1'
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify calendar-specific back button
      const backButton = screen.getByRole('button', { name: /back to calendar/i });
      expect(backButton).toBeInTheDocument();

      // Test navigation back to calendar
      await user.click(backButton);
      
      expect(mockNavigationService.getBackUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'calendar',
          sourceParams: { date: '2024-01-15' },
        })
      );
    });
  });

  describe('Trade List to Trade Review Workflow', () => {
    it('should handle trade list navigation with filters preserved', async () => {
      // Set up trade list navigation context
      mockNavigationService.getContext.mockReturnValue({
        source: 'trade-list',
        sourceParams: { 
          filters: { status: 'closed', profitability: 'profitable' },
          sortBy: 'date',
          page: 2 
        },
        breadcrumb: ['dashboard', 'trades'],
        timestamp: Date.now(),
      });
      mockNavigationService.generateBackLabel.mockReturnValue('Back to Trade List');
      mockNavigationService.getBackUrl.mockReturnValue('/?view=trades&status=closed&profitability=profitable&sort=date&page=2');

      window.history.pushState(
        { 
          navigationContext: {
            source: 'trade-list',
            sourceParams: { 
              filters: { status: 'closed', profitability: 'profitable' },
              sortBy: 'date',
              page: 2 
            },
            breadcrumb: ['dashboard', 'trades'],
            timestamp: Date.now(),
          }
        }, 
        '', 
        '/trade/trade-2'
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify trade list specific back button
      const backButton = screen.getByRole('button', { name: /back to trade list/i });
      expect(backButton).toBeInTheDocument();

      // Test back navigation preserves filters
      await user.click(backButton);
      
      expect(mockNavigationService.getBackUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'trade-list',
          sourceParams: expect.objectContaining({
            filters: { status: 'closed', profitability: 'profitable' },
            sortBy: 'date',
            page: 2,
          }),
        })
      );
    });
  });

  describe('Search to Trade Review Workflow', () => {
    it('should handle search results navigation', async () => {
      // Set up search navigation context
      mockNavigationService.getContext.mockReturnValue({
        source: 'search',
        sourceParams: { 
          searchQuery: 'EUR/USD profitable',
          filters: { dateRange: '2024-01' }
        },
        breadcrumb: ['dashboard', 'search'],
        timestamp: Date.now(),
      });
      mockNavigationService.generateBackLabel.mockReturnValue('Back to Search');
      mockNavigationService.getBackUrl.mockReturnValue('/?view=search&q=EUR/USD+profitable&dateRange=2024-01');

      window.history.pushState(
        { 
          navigationContext: {
            source: 'search',
            sourceParams: { 
              searchQuery: 'EUR/USD profitable',
              filters: { dateRange: '2024-01' }
            },
            breadcrumb: ['dashboard', 'search'],
            timestamp: Date.now(),
          }
        }, 
        '', 
        '/trade/trade-1'
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify search specific back button
      const backButton = screen.getByRole('button', { name: /back to search/i });
      expect(backButton).toBeInTheDocument();

      // Test back navigation preserves search
      await user.click(backButton);
      
      expect(mockNavigationService.getBackUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'search',
          sourceParams: expect.objectContaining({
            searchQuery: 'EUR/USD profitable',
          }),
        })
      );
    });
  });

  describe('Complete Review Workflow', () => {
    it('should complete full trade review process', async () => {
      window.history.pushState({}, '', '/trade/trade-1/review');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Step 1: Review trade data
      const dataTab = screen.getByRole('tab', { name: /data/i });
      await user.click(dataTab);

      // Verify all trade data is displayed
      expect(screen.getByText(/EUR\/USD/i)).toBeInTheDocument();
      expect(screen.getByText(/entry price/i)).toBeInTheDocument();
      expect(screen.getByText(/exit price/i)).toBeInTheDocument();

      // Step 2: Review and add analysis
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      // Add comprehensive notes
      const preTradeSection = screen.getByRole('region', { name: /pre.trade analysis/i });
      const preTradeInput = within(preTradeSection).getByRole('textbox');
      await user.type(preTradeInput, 'Strong bullish setup with clear support levels');

      const executionSection = screen.getByRole('region', { name: /execution notes/i });
      const executionInput = within(executionSection).getByRole('textbox');
      await user.type(executionInput, 'Entry executed at planned level with good timing');

      const reflectionSection = screen.getByRole('region', { name: /post.trade reflection/i });
      const reflectionInput = within(reflectionSection).getByRole('textbox');
      await user.type(reflectionInput, 'Trade went as expected, good risk management');

      // Step 3: Review performance
      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      // Verify performance metrics
      expect(screen.getByText(/r-multiple/i)).toBeInTheDocument();
      expect(screen.getByText(/return percentage/i)).toBeInTheDocument();

      // Step 4: Complete review workflow
      const workflowTab = screen.getByRole('tab', { name: /workflow/i });
      await user.click(workflowTab);

      // Mark review stages as complete
      const dataVerificationCheckbox = screen.getByRole('checkbox', { name: /data verification/i });
      await user.click(dataVerificationCheckbox);

      const analysisCheckbox = screen.getByRole('checkbox', { name: /analysis complete/i });
      await user.click(analysisCheckbox);

      const documentationCheckbox = screen.getByRole('checkbox', { name: /documentation/i });
      await user.click(documentationCheckbox);

      // Step 5: Mark review as complete
      const completeReviewButton = screen.getByRole('button', { name: /complete review/i });
      await user.click(completeReviewButton);

      // Verify review completion
      await waitFor(() => {
        expect(screen.getByText(/review completed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Multi-Trade Navigation Workflow', () => {
    it('should handle sequential trade navigation', async () => {
      window.history.pushState({}, '', '/trade/trade-1');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Navigate to next trade
      const nextButton = screen.getByRole('button', { name: /next trade/i });
      await user.click(nextButton);

      // Should navigate to trade-2
      expect(window.history.pushState).toHaveBeenCalledWith(
        expect.any(Object),
        '',
        '/trade/trade-2'
      );

      // Navigate to previous trade
      const prevButton = screen.getByRole('button', { name: /previous trade/i });
      await user.click(prevButton);

      // Should navigate back to trade-1
      expect(window.history.pushState).toHaveBeenCalledWith(
        expect.any(Object),
        '',
        '/trade/trade-1'
      );
    });

    it('should preserve context during trade navigation', async () => {
      const originalContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now(),
      };

      mockNavigationService.getContext.mockReturnValue(originalContext);

      window.history.pushState({ navigationContext: originalContext }, '', '/trade/trade-1');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Navigate to next trade
      const nextButton = screen.getByRole('button', { name: /next trade/i });
      await user.click(nextButton);

      // Context should be preserved
      expect(mockNavigationService.setContext).toHaveBeenCalledWith(
        'trade-2',
        originalContext
      );

      // Back button should still show original context
      const backButton = screen.getByRole('button', { name: /back to calendar/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle and recover from save errors', async () => {
      // Mock save failure
      mockTradeContext.updateTrade.mockRejectedValueOnce(new Error('Network error'));

      window.history.pushState({}, '', '/trade/trade-1');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Switch to edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Make changes
      const currencyInput = screen.getByDisplayValue(/EUR\/USD/i);
      await user.clear(currencyInput);
      await user.type(currencyInput, 'GBP/USD');

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      });

      // Should provide retry option
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      mockTradeContext.updateTrade.mockResolvedValueOnce(undefined);

      // Retry save
      await user.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(mockTradeContext.updateTrade).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle navigation context loss gracefully', async () => {
      // Start with no navigation context
      mockNavigationService.getContext.mockReturnValue(null);

      window.history.pushState({}, '', '/trade/trade-1');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Should provide default back navigation
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();

      // Should navigate to default location
      await user.click(backButton);
      
      // Should use fallback navigation
      expect(mockNavigationService.getBackUrl).toHaveBeenCalled();
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle rapid navigation without performance issues', async () => {
      window.history.pushState({}, '', '/trade/trade-1');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const startTime = performance.now();

      // Rapidly navigate between trades
      for (let i = 0; i < 5; i++) {
        const nextButton = screen.getByRole('button', { name: /next trade/i });
        await user.click(nextButton);
        
        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(2000); // 2 seconds for 5 navigations
    });
  });
});
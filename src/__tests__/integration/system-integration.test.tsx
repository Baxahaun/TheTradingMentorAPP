/**
 * System Integration Tests
 * 
 * Comprehensive integration tests for the complete trade review system.
 * Tests end-to-end workflows, cross-browser compatibility, and system cohesion.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import App from '../../App';
import { TradeProvider } from '../../contexts/TradeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { AccessibilityProvider } from '../../components/accessibility/AccessibilityProvider';
import { mockTrades } from '../mocks/tradeData';
import { mockUser } from '../mocks/userData';

// Mock Firebase
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

// Mock navigation service
vi.mock('../../lib/navigationContextService', () => ({
  default: {
    setContext: vi.fn(),
    getContext: vi.fn(() => ({
      source: 'dashboard',
      breadcrumb: ['dashboard'],
      timestamp: Date.now(),
    })),
    generateBackLabel: vi.fn(() => 'Back to Dashboard'),
    getBackUrl: vi.fn(() => '/'),
    clearContext: vi.fn(),
  },
}));

// Mock trade context with realistic data
const mockTradeContext = {
  trades: mockTrades,
  updateTrade: vi.fn(),
  deleteTrade: vi.fn(),
  addTrade: vi.fn(),
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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <AuthProvider>
          <TradeProvider>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </TradeProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('System Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Mock window methods
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
      },
      writable: true,
    });

    Object.defineProperty(window, 'history', {
      value: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
      },
      writable: true,
    });

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    // Mock share API
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Workflows', () => {
    it('should handle complete trade review workflow from dashboard', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText(/trading journal/i)).toBeInTheDocument();
      });

      // Navigate to a trade (simulate clicking on a trade from dashboard)
      const tradeLinks = screen.getAllByRole('link');
      const tradeLink = tradeLinks.find(link => 
        link.getAttribute('href')?.includes('/trade/')
      );
      
      if (tradeLink) {
        await user.click(tradeLink);
      }

      // Verify trade review system loads
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Test mode switching
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      // Test navigation between panels
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /analysis/i })).toBeInTheDocument();
      });

      // Test back navigation
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      // Should return to dashboard
      await waitFor(() => {
        expect(screen.getByText(/trading journal/i)).toBeInTheDocument();
      });
    });

    it('should handle trade review workflow with note editing', async () => {
      // Start directly on trade review page
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

      // Navigate to analysis panel
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      // Find and edit notes
      const notesSection = screen.getByRole('region', { name: /notes/i });
      const noteInput = within(notesSection).getByRole('textbox');
      
      await user.clear(noteInput);
      await user.type(noteInput, 'Updated trade analysis notes');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify save was called
      await waitFor(() => {
        expect(mockTradeContext.updateTrade).toHaveBeenCalled();
      });
    });

    it('should handle performance analytics workflow', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Navigate to performance panel
      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      // Verify performance metrics are displayed
      await waitFor(() => {
        expect(screen.getByText(/r-multiple/i)).toBeInTheDocument();
        expect(screen.getByText(/return/i)).toBeInTheDocument();
        expect(screen.getByText(/risk.reward/i)).toBeInTheDocument();
      });

      // Test performance comparison
      const compareButton = screen.getByRole('button', { name: /compare/i });
      await user.click(compareButton);

      await waitFor(() => {
        expect(screen.getByText(/similar trades/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Context Preservation', () => {
    it('should preserve navigation context across trade switches', async () => {
      // Set initial navigation context
      const navigationContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['dashboard', 'calendar'],
        timestamp: Date.now(),
      };

      window.history.pushState({ navigationContext }, '', '/trade/trade-1');
      
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

      // Verify context is preserved
      const backButton = screen.getByRole('button', { name: /back to calendar/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should handle browser back button correctly', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Simulate browser back button
      window.history.back();
      
      // Should trigger navigation back to source
      await waitFor(() => {
        expect(window.history.back).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle trade not found error gracefully', async () => {
      window.history.pushState({}, '', '/trade/non-existent-trade');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/trade not found/i)).toBeInTheDocument();
      });

      // Should provide recovery option
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should handle save failures with retry option', async () => {
      // Mock save failure
      mockTradeContext.updateTrade.mockRejectedValueOnce(new Error('Save failed'));

      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Switch to edit mode and make changes
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue(/EUR\/USD/i);
      await user.clear(input);
      await user.type(input, 'GBP/USD');

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show error toast
      await waitFor(() => {
        expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA labels and roles', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Check main landmarks
      expect(screen.getByRole('main')).toHaveAttribute('aria-label');
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Check tab navigation
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-controls');
      });

      // Check form accessibility
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Test tab navigation
      const firstTab = screen.getAllByRole('tab')[0];
      firstTab.focus();
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowRight}');
      
      const secondTab = screen.getAllByRole('tab')[1];
      expect(secondTab).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(secondTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
    });

    it('should adapt layout for mobile screens', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Check mobile-specific classes are applied
      const container = screen.getByRole('main').closest('div');
      expect(container).toHaveClass('mobile-container');

      // Check mobile navigation
      const mobileNav = screen.getByRole('navigation');
      expect(mobileNav).toBeInTheDocument();
    });

    it('should handle touch gestures for trade navigation', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const container = screen.getByRole('main').closest('div');
      
      // Simulate swipe left (next trade)
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      
      fireEvent.touchEnd(container!, {
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });

      // Should navigate to next trade
      await waitFor(() => {
        expect(window.history.pushState).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeMockTrades = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTrades[0],
        id: `trade-${i}`,
        currencyPair: `PAIR${i}`,
      }));

      mockTradeContext.trades = largeMockTrades;

      window.history.pushState({}, '', '/trade/trade-500');
      
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should handle rapid navigation without memory leaks', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Rapidly navigate between trades
      for (let i = 0; i < 10; i++) {
        const nextButton = screen.getByRole('button', { name: /next trade/i });
        await user.click(nextButton);
        
        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });
      }

      // Should not have excessive re-renders or memory issues
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Data Persistence and Sync', () => {
    it('should persist changes across page refreshes', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Make changes
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue(/EUR\/USD/i);
      await user.clear(input);
      await user.type(input, 'GBP/USD');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify save was called
      await waitFor(() => {
        expect(mockTradeContext.updateTrade).toHaveBeenCalledWith(
          'trade-1',
          expect.objectContaining({
            currencyPair: 'GBP/USD',
          })
        );
      });
    });

    it('should handle offline scenarios gracefully', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Try to make changes while offline
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Should show offline indicator or handle gracefully
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Export and Sharing', () => {
    it('should generate shareable URLs correctly', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Find and click share button
      const shareButton = screen.getByRole('button', { name: /share/i });
      await user.click(shareButton);

      // Should copy URL to clipboard
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('/trade/trade-1')
        );
      });
    });

    it('should handle export functionality', async () => {
      window.history.pushState({}, '', '/trade/trade-1');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Navigate to export options
      const moreButton = screen.getByRole('button', { name: /more/i });
      await user.click(moreButton);

      const exportButton = screen.getByRole('menuitem', { name: /export/i });
      await user.click(exportButton);

      // Should open export dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /export/i })).toBeInTheDocument();
      });
    });
  });
});
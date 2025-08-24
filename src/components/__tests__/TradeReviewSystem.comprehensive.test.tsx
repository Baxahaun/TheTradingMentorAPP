import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TradeReviewSystem from '../TradeReviewSystem';
import { NavigationContext } from '../../types/navigation';
import { Trade } from '../../types/trade';

// Mock dependencies
vi.mock('../../lib/navigationContextService');
vi.mock('../../lib/tradeReviewService');
vi.mock('../../lib/performanceAnalyticsService');
vi.mock('../../lib/noteManagementService');

const mockTrade: Trade = {
  id: 'test-trade-1',
  symbol: 'AAPL',
  entryPrice: 150.00,
  exitPrice: 155.00,
  quantity: 100,
  entryDate: '2024-01-15',
  exitDate: '2024-01-16',
  type: 'long',
  status: 'closed',
  pnl: 500,
  tags: ['momentum', 'earnings-play'],
  notes: 'Test trade notes',
  commission: 2.00,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-16T15:30:00Z'
};

const mockNavigationContext: NavigationContext = {
  source: 'calendar',
  sourceParams: { date: '2024-01-15' },
  breadcrumb: ['Dashboard', 'Calendar', 'Trade Review'],
  timestamp: Date.now()
};

describe('TradeReviewSystem - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render with all required props', () => {
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          navigationContext={mockNavigationContext}
          initialMode="view"
        />
      );

      expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
    });

    it('should initialize in correct mode', () => {
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          initialMode="edit"
        />
      );

      expect(screen.getByTestId('trade-review-system')).toHaveAttribute('data-mode', 'edit');
    });

    it('should handle missing navigation context gracefully', () => {
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
        />
      );

      expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch between view and edit modes', async () => {
      const user = userEvent.setup();
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          initialMode="view"
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('trade-review-system')).toHaveAttribute('data-mode', 'edit');
    });

    it('should handle unsaved changes when switching modes', async () => {
      const user = userEvent.setup();
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          initialMode="edit"
        />
      );

      // Make changes
      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.type(notesInput, 'Modified notes');

      // Try to switch to view mode
      const viewButton = screen.getByRole('button', { name: /view/i });
      await user.click(viewButton);

      // Should show confirmation dialog
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should auto-save changes after delay', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          initialMode="edit"
          onSave={mockSave}
        />
      );

      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.type(notesInput, 'Auto-save test');

      // Wait for auto-save delay
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should show save status indicator', async () => {
      const user = userEvent.setup();
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          initialMode="edit"
        />
      );

      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.type(notesInput, 'Status test');

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Context', () => {
    it('should display correct back button label', () => {
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          navigationContext={mockNavigationContext}
        />
      );

      expect(screen.getByRole('button', { name: /back to calendar/i })).toBeInTheDocument();
    });

    it('should call navigation callback on back button click', async () => {
      const user = userEvent.setup();
      const mockNavigateBack = vi.fn();
      
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          navigationContext={mockNavigationContext}
          onNavigateBack={mockNavigateBack}
        />
      );

      const backButton = screen.getByRole('button', { name: /back to calendar/i });
      await user.click(backButton);

      expect(mockNavigateBack).toHaveBeenCalledWith(mockNavigationContext);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when trade loading fails', () => {
      render(
        <TradeReviewSystem
          tradeId="non-existent-trade"
        />
      );

      expect(screen.getByText(/error loading trade/i)).toBeInTheDocument();
    });

    it('should show retry option on error', async () => {
      const user = userEvent.setup();
      render(
        <TradeReviewSystem
          tradeId="non-existent-trade"
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);
      // Should attempt to reload
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          initialMode="view"
        />
      );

      // Test edit mode shortcut (Ctrl+E)
      await user.keyboard('{Control>}e{/Control}');
      expect(screen.getByTestId('trade-review-system')).toHaveAttribute('data-mode', 'edit');

      // Test save shortcut (Ctrl+S)
      await user.keyboard('{Control>}s{/Control}');
      // Should trigger save
    });

    it('should have proper tab order', async () => {
      const user = userEvent.setup();
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          initialMode="edit"
        />
      );

      // Tab through elements and verify order
      await user.tab();
      expect(screen.getByRole('button', { name: /back/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /edit/i })).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
        />
      );

      expect(screen.getByTestId('trade-review-system')).toHaveClass('mobile-layout');
    });

    it('should show mobile navigation controls', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
        />
      );

      expect(screen.getByTestId('mobile-nav-controls')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should lazy load heavy components', () => {
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
        />
      );

      // Chart gallery should not be loaded initially
      expect(screen.queryByTestId('chart-gallery')).not.toBeInTheDocument();
    });

    it('should debounce auto-save operations', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      
      render(
        <TradeReviewSystem
          tradeId="test-trade-1"
          initialMode="edit"
          onSave={mockSave}
        />
      );

      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      
      // Type rapidly
      await user.type(notesInput, 'rapid typing test');
      
      // Should only save once after debounce delay
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });
    });
  });
});
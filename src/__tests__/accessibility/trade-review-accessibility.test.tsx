import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TradeReviewSystem } from '../../components/trade-review/TradeReviewSystem';
import { ChartGalleryManager } from '../../components/trade-review/ChartGalleryManager';
import { PerformanceAnalyticsPanel } from '../../components/trade-review/PerformanceAnalyticsPanel';
import { Trade } from '../../types/trade';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

const mockTrade: Trade = {
  id: 'accessibility-test-trade',
  symbol: 'AAPL',
  entryPrice: 150,
  exitPrice: 155,
  quantity: 100,
  entryDate: '2024-01-15',
  exitDate: '2024-01-16',
  type: 'long',
  status: 'closed',
  pnl: 500,
  tags: ['momentum', 'breakout'],
  notes: 'Accessibility test trade',
  commission: 2,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-16T15:30:00Z',
  charts: [
    {
      id: 'chart-1',
      url: 'https://example.com/chart1.png',
      type: 'entry',
      timeframe: '1h',
      uploadedAt: '2024-01-15T10:00:00Z',
      description: 'Entry chart showing breakout pattern'
    }
  ]
};

describe('Trade Review Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations in view mode', async () => {
      const { container } = render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="view"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in edit mode', async () => {
      const { container } = render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in review mode', async () => {
      const { container } = render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="review"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // Tab through all interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /back/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /view/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /edit/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /review/i })).toHaveFocus();

      // Continue tabbing through form elements
      await user.tab();
      expect(screen.getByRole('textbox', { name: /symbol/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('spinbutton', { name: /entry price/i })).toHaveFocus();
    });

    it('should support keyboard shortcuts', async () => {
      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="view"
        />
      );

      // Test edit mode shortcut
      await user.keyboard('{Control>}e{/Control}');
      expect(screen.getByTestId('trade-review-system')).toHaveAttribute('data-mode', 'edit');

      // Test save shortcut
      await user.keyboard('{Control>}s{/Control}');
      // Should trigger save action

      // Test escape to cancel
      await user.keyboard('{Escape}');
      // Should cancel current action or close dialogs
    });

    it('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // Open chart upload dialog
      const uploadButton = screen.getByRole('button', { name: /upload chart/i });
      await user.click(uploadButton);

      // Focus should be trapped in dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Tab should cycle within dialog
      await user.tab();
      const firstFocusable = screen.getByRole('button', { name: /choose file/i });
      expect(firstFocusable).toHaveFocus();

      // Shift+Tab should go to last focusable element
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      const lastFocusable = screen.getByRole('button', { name: /cancel/i });
      expect(lastFocusable).toHaveFocus();
    });

    it('should handle arrow key navigation in lists', async () => {
      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // Open tag dropdown
      const tagInput = screen.getByRole('combobox', { name: /tags/i });
      await user.click(tagInput);

      const tagOptions = screen.getAllByRole('option');
      expect(tagOptions[0]).toHaveFocus();

      // Arrow down should move to next option
      await user.keyboard('{ArrowDown}');
      expect(tagOptions[1]).toHaveFocus();

      // Arrow up should move to previous option
      await user.keyboard('{ArrowUp}');
      expect(tagOptions[0]).toHaveFocus();

      // Enter should select option
      await user.keyboard('{Enter}');
      expect(tagInput).toHaveValue(expect.stringContaining(tagOptions[0].textContent));
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // Check for proper ARIA labels
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Trade Review');
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Trade Review Sections');
      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Trade Details Form');
    });

    it('should announce dynamic content changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // Make a change that should be announced
      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.type(notesInput, 'Screen reader test');

      // Check for live region updates
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/saving/i);
    });

    it('should provide descriptive error messages', async () => {
      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // Trigger validation error
      const priceInput = screen.getByRole('spinbutton', { name: /entry price/i });
      await user.clear(priceInput);
      await user.type(priceInput, 'invalid');
      await user.tab(); // Trigger validation

      // Error should be associated with input
      expect(priceInput).toHaveAttribute('aria-describedby');
      const errorId = priceInput.getAttribute('aria-describedby');
      const errorMessage = document.getElementById(errorId!);
      expect(errorMessage).toHaveTextContent(/invalid price format/i);
    });

    it('should provide context for complex interactions', () => {
      render(
        <ChartGalleryManager
          trade={mockTrade}
          isEditing={true}
          onChartsChange={vi.fn()}
        />
      );

      // Chart gallery should have proper context
      const gallery = screen.getByRole('region', { name: /chart gallery/i });
      expect(gallery).toHaveAttribute('aria-describedby');
      
      const description = document.getElementById(gallery.getAttribute('aria-describedby')!);
      expect(description).toHaveTextContent(/upload and manage trade charts/i);
    });
  });

  describe('Color and Contrast', () => {
    it('should meet color contrast requirements', () => {
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="view"
        />
      );

      // Check for high contrast mode support
      const systemElement = screen.getByTestId('trade-review-system');
      expect(systemElement).toHaveClass('supports-high-contrast');
    });

    it('should not rely solely on color for information', () => {
      render(
        <PerformanceAnalyticsPanel
          trade={mockTrade}
          similarTrades={[]}
          showComparisons={false}
        />
      );

      // Performance indicators should have text labels, not just colors
      const profitIndicator = screen.getByText(/profit/i);
      expect(profitIndicator).toHaveAttribute('aria-label', expect.stringContaining('positive'));
      
      // Should also have visual indicators beyond color
      expect(profitIndicator).toHaveClass('profit-indicator');
      expect(profitIndicator.querySelector('.icon')).toBeInTheDocument();
    });

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="view"
        />
      );

      const systemElement = screen.getByTestId('trade-review-system');
      expect(systemElement).toHaveClass('high-contrast-mode');
    });
  });

  describe('Motion and Animation', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="view"
        />
      );

      const systemElement = screen.getByTestId('trade-review-system');
      expect(systemElement).toHaveClass('reduced-motion');
    });

    it('should provide alternative to auto-playing content', () => {
      render(
        <ChartGalleryManager
          trade={mockTrade}
          isEditing={false}
          onChartsChange={vi.fn()}
        />
      );

      // Auto-slideshow should be pausable
      const pauseButton = screen.getByRole('button', { name: /pause slideshow/i });
      expect(pauseButton).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels and structure', () => {
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // All form inputs should have labels
      const symbolInput = screen.getByRole('textbox', { name: /symbol/i });
      expect(symbolInput).toHaveAttribute('id');
      
      const symbolLabel = screen.getByLabelText(/symbol/i);
      expect(symbolLabel).toBe(symbolInput);

      // Required fields should be marked
      const requiredInputs = screen.getAllByRole('textbox', { required: true });
      requiredInputs.forEach(input => {
        expect(input).toHaveAttribute('aria-required', 'true');
      });
    });

    it('should group related form controls', () => {
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // Price fields should be grouped
      const priceFieldset = screen.getByRole('group', { name: /price information/i });
      expect(priceFieldset).toBeInTheDocument();
      
      const entryPrice = screen.getByRole('spinbutton', { name: /entry price/i });
      const exitPrice = screen.getByRole('spinbutton', { name: /exit price/i });
      
      expect(priceFieldset).toContainElement(entryPrice);
      expect(priceFieldset).toContainElement(exitPrice);
    });

    it('should provide helpful instructions', () => {
      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // Complex fields should have instructions
      const tagInput = screen.getByRole('combobox', { name: /tags/i });
      expect(tagInput).toHaveAttribute('aria-describedby');
      
      const instructionId = tagInput.getAttribute('aria-describedby');
      const instructions = document.getElementById(instructionId!);
      expect(instructions).toHaveTextContent(/type to search or add new tags/i);
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have appropriate touch targets', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="edit"
        />
      );

      // All interactive elements should meet minimum touch target size
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minSize = 44; // 44px minimum touch target
        
        expect(parseInt(styles.minHeight) || parseInt(styles.height)).toBeGreaterThanOrEqual(minSize);
        expect(parseInt(styles.minWidth) || parseInt(styles.width)).toBeGreaterThanOrEqual(minSize);
      });
    });

    it('should support zoom up to 200%', () => {
      // Mock zoom level
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      render(
        <TradeReviewSystem
          tradeId="accessibility-test-trade"
          initialMode="view"
        />
      );

      // Content should remain usable at 200% zoom
      const systemElement = screen.getByTestId('trade-review-system');
      expect(systemElement).toHaveClass('zoom-compatible');
    });
  });

  describe('Error Handling Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="non-existent-trade"
        />
      );

      // Error should be announced
      const errorRegion = screen.getByRole('alert');
      expect(errorRegion).toHaveTextContent(/error loading trade/i);
    });

    it('should provide recovery options', () => {
      render(
        <TradeReviewSystem
          tradeId="non-existent-trade"
        />
      );

      // Error state should provide actionable options
      const retryButton = screen.getByRole('button', { name: /retry loading trade/i });
      expect(retryButton).toBeInTheDocument();
      
      const backButton = screen.getByRole('button', { name: /back to dashboard/i });
      expect(backButton).toBeInTheDocument();
    });
  });
});
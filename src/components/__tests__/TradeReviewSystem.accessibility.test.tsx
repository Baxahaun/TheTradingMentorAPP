import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { TradeContext } from '../../contexts/TradeContext';
import { AccessibilityProvider } from '../accessibility/AccessibilityProvider';
import TradeReviewSystem from '../TradeReviewSystem';
import { mockTrade } from '../../test/mockData';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../hooks/useMobileResponsive', () => ({
  useMobileResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    width: 1024,
    height: 768
  }),
  useTouchGestures: () => ({
    handleTouchStart: jest.fn(),
    handleTouchEnd: jest.fn()
  }),
  useMobileOptimizations: () => ({
    isMobile: false
  })
}));

const mockTradeContext = {
  trades: [mockTrade],
  updateTrade: jest.fn(),
  addTrade: jest.fn(),
  deleteTrade: jest.fn(),
  loading: false,
  error: null
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AccessibilityProvider>
        <TradeContext.Provider value={mockTradeContext}>
          {component}
        </TradeContext.Provider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
};

describe('TradeReviewSystem Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should not have accessibility violations', async () => {
      const { container } = renderWithProviders(
        <TradeReviewSystem tradeId={mockTrade.id} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent(mockTrade.currencyPair);
    });

    it('should have proper landmark roles', () => {
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
    });

    it('should have skip links', () => {
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByText('Skip to main content')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/back to/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /view mode/i })).toHaveFocus();
    });

    it('should handle arrow key navigation in tab panels', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      const dataTab = screen.getByRole('tab', { name: /trade data/i });
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });

      // Focus on first tab
      dataTab.focus();
      expect(dataTab).toHaveFocus();

      // Arrow right should move to next tab
      await user.keyboard('{ArrowRight}');
      expect(analysisTab).toHaveFocus();
    });

    it('should support Enter and Space key activation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      const editButton = screen.getByRole('tab', { name: /edit mode/i });
      editButton.focus();

      // Enter key should activate
      await user.keyboard('{Enter}');
      expect(editButton).toHaveAttribute('aria-selected', 'true');

      const viewButton = screen.getByRole('tab', { name: /view mode/i });
      viewButton.focus();

      // Space key should activate
      await user.keyboard(' ');
      expect(viewButton).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      expect(screen.getByLabelText(/trade review for/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/trade review header/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/trade review sections/i)).toBeInTheDocument();
    });

    it('should have proper ARIA states', () => {
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      const viewTab = screen.getByRole('tab', { name: /view mode/i });
      expect(viewTab).toHaveAttribute('aria-selected', 'true');

      const editTab = screen.getByRole('tab', { name: /edit mode/i });
      expect(editTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should have proper live regions for dynamic content', async () => {
      renderWithProviders(<TradeReviewSystem tradeId="non-existent" />);

      await waitFor(() => {
        const errorRegion = screen.getByRole('alert');
        expect(errorRegion).toBeInTheDocument();
        expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('should have descriptive button labels', () => {
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      const backButton = screen.getByLabelText(/navigate back to previous page/i);
      expect(backButton).toBeInTheDocument();

      const viewButton = screen.getByLabelText(/view mode/i);
      expect(viewButton).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should manage focus when navigating between trades', async () => {
      const user = userEvent.setup();
      const mockTradeContext2 = {
        ...mockTradeContext,
        trades: [mockTrade, { ...mockTrade, id: 'trade-2', currencyPair: 'GBP/USD' }]
      };

      render(
        <BrowserRouter>
          <AccessibilityProvider>
            <TradeContext.Provider value={mockTradeContext2}>
              <TradeReviewSystem tradeId={mockTrade.id} />
            </TradeContext.Provider>
          </AccessibilityProvider>
        </BrowserRouter>
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Focus should be managed after navigation
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveFocus();
      });
    });

    it('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Open accessibility controls
      const accessibilityButton = screen.getByLabelText(/accessibility settings/i);
      await user.click(accessibilityButton);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Focus should be trapped within modal
      const firstFocusable = screen.getByLabelText(/high contrast mode/i);
      const lastFocusable = screen.getByLabelText(/close accessibility settings/i);

      firstFocusable.focus();
      await user.tab({ shift: true });
      expect(lastFocusable).toHaveFocus();

      lastFocusable.focus();
      await user.tab();
      expect(firstFocusable).toHaveFocus();
    });
  });

  describe('High Contrast Mode', () => {
    it('should apply high contrast styles when enabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Open accessibility controls
      const accessibilityButton = screen.getByLabelText(/accessibility settings/i);
      await user.click(accessibilityButton);

      // Enable high contrast
      const highContrastButton = screen.getByLabelText(/high contrast mode/i);
      await user.click(highContrastButton);

      // Check if high contrast class is applied
      expect(document.documentElement).toHaveClass('high-contrast');
    });
  });

  describe('Reduced Motion', () => {
    it('should respect reduced motion preference', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Open accessibility controls
      const accessibilityButton = screen.getByLabelText(/accessibility settings/i);
      await user.click(accessibilityButton);

      // Enable reduced motion
      const reducedMotionButton = screen.getByLabelText(/reduced motion/i);
      await user.click(reducedMotionButton);

      // Check if reduced motion class is applied
      expect(document.documentElement).toHaveClass('reduced-motion');
    });
  });

  describe('Font Size Adjustment', () => {
    it('should allow font size adjustment', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Open accessibility controls
      const accessibilityButton = screen.getByLabelText(/accessibility settings/i);
      await user.click(accessibilityButton);

      // Change font size to large
      const largeFontButton = screen.getByText('Large');
      await user.click(largeFontButton);

      // Check if font size class is applied
      expect(document.documentElement).toHaveClass('font-large');
    });
  });

  describe('Error Handling Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      renderWithProviders(<TradeReviewSystem tradeId="non-existent" />);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('should provide recovery actions for errors', async () => {
      renderWithProviders(<TradeReviewSystem tradeId="non-existent" />);

      await waitFor(() => {
        const backButton = screen.getByText(/back to trades/i);
        expect(backButton).toBeInTheDocument();
        expect(backButton).toHaveAttribute('aria-describedby');
      });
    });
  });
});
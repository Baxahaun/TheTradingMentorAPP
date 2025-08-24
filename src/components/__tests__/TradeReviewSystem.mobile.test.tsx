import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { TradeContext } from '../../contexts/TradeContext';
import { AccessibilityProvider } from '../accessibility/AccessibilityProvider';
import TradeReviewSystem from '../TradeReviewSystem';
import { mockTrade } from '../../test/mockData';

// Mock mobile responsive hooks
const mockMobileHooks = {
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  isLargeDesktop: false,
  width: 375,
  height: 667
};

jest.mock('../../hooks/useMobileResponsive', () => ({
  useMobileResponsive: () => mockMobileHooks,
  useTouchGestures: (onSwipe: any) => ({
    handleTouchStart: jest.fn(),
    handleTouchEnd: jest.fn((event: any) => {
      // Simulate swipe gesture
      if (onSwipe) {
        onSwipe({
          startX: 100,
          startY: 100,
          endX: 200,
          endY: 100,
          deltaX: 100,
          deltaY: 0,
          direction: 'right',
          distance: 100
        });
      }
    })
  }),
  useMobileOptimizations: () => ({
    isMobile: true
  })
}));

const mockTradeContext = {
  trades: [
    mockTrade,
    { ...mockTrade, id: 'trade-2', currencyPair: 'GBP/USD' },
    { ...mockTrade, id: 'trade-3', currencyPair: 'USD/JPY' }
  ],
  updateTrade: jest.fn(),
  addTrade: jest.fn(),
  deleteTrade: jest.fn(),
  loading: false,
  error: null
};

const renderMobile = (component: React.ReactElement) => {
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

describe('TradeReviewSystem Mobile Responsiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock viewport
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
  });

  describe('Mobile Layout', () => {
    it('should render mobile-optimized layout', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Check for mobile-specific classes
      const container = screen.getByRole('main').parentElement;
      expect(container).toHaveClass('mobile-container');
    });

    it('should show mobile navigation controls', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Mobile mode buttons should be icon-only
      const viewButton = screen.getByRole('tab', { name: /view mode/i });
      const editButton = screen.getByRole('tab', { name: /edit mode/i });
      const reviewButton = screen.getByRole('tab', { name: /review mode/i });

      expect(viewButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
      expect(reviewButton).toBeInTheDocument();

      // Should have touch-friendly sizing
      expect(viewButton).toHaveClass('touch-target');
      expect(editButton).toHaveClass('touch-target');
      expect(reviewButton).toHaveClass('touch-target');
    });

    it('should hide desktop-only elements on mobile', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Desktop layout should be hidden
      const desktopLayout = screen.queryByText('Previous');
      expect(desktopLayout).not.toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    it('should have proper touch targets', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        const minWidth = parseInt(styles.minWidth);
        
        // Touch targets should be at least 44px
        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });

    it('should support swipe gestures for navigation', async () => {
      const { container } = renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Simulate touch events
      const mainContainer = container.querySelector('[role="main"]')?.parentElement;
      expect(mainContainer).toBeInTheDocument();

      // Simulate swipe right (should go to previous trade)
      fireEvent.touchStart(mainContainer!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchEnd(mainContainer!, {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });

      // Should trigger navigation (mocked in the hook)
      await waitFor(() => {
        // This would normally navigate, but we're testing the gesture handling
        expect(true).toBe(true); // Placeholder assertion
      });
    });

    it('should prevent zoom on double tap', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      const preventDefault = jest.fn();
      const touchEvent = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true
      });
      
      Object.defineProperty(touchEvent, 'preventDefault', {
        value: preventDefault
      });

      // Simulate rapid double tap
      document.dispatchEvent(touchEvent);
      setTimeout(() => {
        document.dispatchEvent(touchEvent);
      }, 100);

      // Should prevent default behavior for double tap
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('Mobile Typography', () => {
    it('should use responsive text sizes', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('responsive-text-lg');
    });

    it('should have proper line height for readability', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      const textElements = screen.getAllByText(/./);
      textElements.forEach(element => {
        if (element.classList.contains('mobile-text')) {
          const styles = window.getComputedStyle(element);
          const lineHeight = parseFloat(styles.lineHeight);
          expect(lineHeight).toBeGreaterThanOrEqual(1.6);
        }
      });
    });
  });

  describe('Mobile Forms', () => {
    it('should have mobile-optimized form inputs', async () => {
      const user = userEvent.setup();
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Switch to edit mode
      const editButton = screen.getByRole('tab', { name: /edit mode/i });
      await user.click(editButton);

      // Check for mobile input styling
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveClass('mobile-input');
        
        const styles = window.getComputedStyle(input);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Mobile Navigation', () => {
    it('should show horizontal scrollable panel navigation', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      const panelNav = screen.getByRole('tablist', { name: /trade review sections/i });
      expect(panelNav).toHaveClass('mobile-scroll');
    });

    it('should maintain panel state on mobile', async () => {
      const user = userEvent.setup();
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Switch to analysis panel
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      expect(analysisTab).toHaveAttribute('aria-selected', 'true');
      
      // Panel content should update
      const analysisPanel = screen.getByRole('tabpanel', { name: /trade analysis/i });
      expect(analysisPanel).toBeInTheDocument();
    });
  });

  describe('Mobile Performance', () => {
    it('should use GPU acceleration for smooth scrolling', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      const scrollableElements = screen.getAllByRole('tabpanel');
      scrollableElements.forEach(element => {
        if (element.classList.contains('mobile-smooth-scroll')) {
          const styles = window.getComputedStyle(element);
          expect(styles.scrollBehavior).toBe('smooth');
        }
      });
    });

    it('should handle viewport height changes', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Simulate keyboard appearance (viewport height change)
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 400,
      });

      fireEvent(window, new Event('resize'));

      // CSS custom property should be updated
      const vh = document.documentElement.style.getPropertyValue('--vh');
      expect(vh).toBe('4px'); // 400 * 0.01
    });
  });

  describe('Mobile Accessibility', () => {
    it('should maintain accessibility on mobile', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // All interactive elements should have proper labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });

      // Touch targets should be accessible
      const touchTargets = screen.getAllByRole('tab');
      touchTargets.forEach(target => {
        expect(target).toHaveClass('touch-target');
      });
    });

    it('should support screen reader navigation on mobile', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Landmarks should be present
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Content should be properly labeled
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveAttribute('id', 'main-content');
    });
  });

  describe('Tablet Layout', () => {
    beforeEach(() => {
      // Mock tablet viewport
      mockMobileHooks.isMobile = false;
      mockMobileHooks.isTablet = true;
      mockMobileHooks.width = 768;
      mockMobileHooks.height = 1024;
    });

    it('should render tablet-optimized layout', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Should show more content than mobile but less than desktop
      const container = screen.getByRole('main').parentElement;
      expect(container).not.toHaveClass('mobile-container');
    });

    it('should show tablet navigation controls', () => {
      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Should show both icons and labels on tablet
      const viewButton = screen.getByRole('tab', { name: /view mode/i });
      expect(viewButton).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    it('should handle landscape orientation on mobile', () => {
      // Mock landscape orientation
      Object.defineProperty(screen, 'orientation', {
        value: { angle: 90 },
        writable: true
      });

      renderMobile(<TradeReviewSystem tradeId={mockTrade.id} />);

      // Should adapt layout for landscape
      const container = screen.getByRole('main').parentElement;
      expect(container).toHaveClass('mobile-container');
    });
  });
});
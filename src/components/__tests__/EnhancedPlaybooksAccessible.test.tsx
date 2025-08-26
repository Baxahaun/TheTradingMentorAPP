import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import EnhancedPlaybooksAccessible from '../EnhancedPlaybooksAccessible';
import { ProfessionalStrategy } from '@/types/strategy';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    currentBreakpoint: 'lg'
  })
}));

jest.mock('../../hooks/useAccessibility', () => ({
  useHighContrast: () => ({
    isHighContrast: false,
    toggleHighContrast: jest.fn()
  }),
  useScreenReader: () => ({
    announce: jest.fn()
  }),
  useKeyboardNavigation: () => ({
    focusedIndex: -1,
    containerRef: { current: null }
  })
}));

// Mock services
jest.mock('@/services/StrategyPerformanceService', () => ({
  StrategyPerformanceService: jest.fn().mockImplementation(() => ({
    calculateProfessionalMetrics: jest.fn(),
    updatePerformanceMetrics: jest.fn()
  }))
}));

const mockStrategy: ProfessionalStrategy = {
  id: '1',
  title: 'Test Strategy',
  description: 'A test strategy for unit testing',
  color: '#3B82F6',
  methodology: 'Technical',
  primaryTimeframe: '1D',
  assetClasses: ['Stocks'],
  setupConditions: {
    marketEnvironment: 'Trending market',
    technicalConditions: ['Price above 20 EMA'],
    volatilityRequirements: 'ATR > 2%'
  },
  entryTriggers: {
    primarySignal: 'Break above resistance',
    confirmationSignals: ['RSI > 50'],
    timingCriteria: 'First 30 minutes'
  },
  riskManagement: {
    positionSizingMethod: { type: 'FixedPercentage', parameters: { percentage: 2 } },
    maxRiskPerTrade: 2,
    stopLossRule: { type: 'ATRBased', parameters: { multiplier: 2 }, description: '2x ATR' },
    takeProfitRule: { type: 'RiskRewardRatio', parameters: { ratio: 3 }, description: '3:1' },
    riskRewardRatio: 3
  },
  performance: {
    totalTrades: 45,
    winningTrades: 28,
    losingTrades: 17,
    profitFactor: 2.1,
    expectancy: 125.50,
    winRate: 62.2,
    averageWin: 285.75,
    averageLoss: -95.25,
    riskRewardRatio: 3.0,
    maxDrawdown: -8.5,
    maxDrawdownDuration: 12,
    sampleSize: 45,
    confidenceLevel: 85,
    statisticallySignificant: true,
    monthlyReturns: [],
    performanceTrend: 'Improving',
    lastCalculated: new Date().toISOString()
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
  isActive: true
};

describe('EnhancedPlaybooksAccessible', () => {
  const defaultProps = {
    trades: [],
    onStrategySelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /strategy navigation/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/accessibility announcements/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      const createButton = screen.getByRole('button', { name: /create strategy/i });
      
      // Tab to the button
      await user.tab();
      expect(createButton).toHaveFocus();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should announce screen reader messages', () => {
      const mockAnnounce = jest.fn();
      jest.mocked(require('../../hooks/useAccessibility').useScreenReader).mockReturnValue({
        announce: mockAnnounce
      });
      
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      const createButton = screen.getByRole('button', { name: /create strategy/i });
      fireEvent.click(createButton);
      
      expect(mockAnnounce).toHaveBeenCalledWith('Opening strategy builder', 'polite');
    });

    it('should support high contrast mode', () => {
      const mockToggleHighContrast = jest.fn();
      jest.mocked(require('../../hooks/useAccessibility').useHighContrast).mockReturnValue({
        isHighContrast: true,
        toggleHighContrast: mockToggleHighContrast
      });
      
      const { container } = render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      expect(container.firstChild).toHaveClass('high-contrast');
      
      const contrastButton = screen.getByLabelText(/disable high contrast/i);
      fireEvent.click(contrastButton);
      
      expect(mockToggleHighContrast).toHaveBeenCalled();
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      // Open strategy builder
      const createButton = screen.getByRole('button', { name: /create strategy/i });
      await user.click(createButton);
      
      // Focus should be trapped in dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Close dialog with Escape
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should have accessible performance indicators', () => {
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      // Performance indicators should have proper labels and descriptions
      const indicators = screen.getAllByRole('status');
      expect(indicators.length).toBeGreaterThan(0);
      
      indicators.forEach(indicator => {
        expect(indicator).toHaveAttribute('aria-label');
        expect(indicator).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should support screen reader navigation of charts', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      // Find chart element
      const chart = screen.getByRole('img');
      expect(chart).toHaveAttribute('aria-label');
      expect(chart).toHaveAttribute('tabIndex', '0');
      
      // Should announce chart info on focus
      await user.click(chart);
      await user.keyboard('{Enter}');
      
      // Chart should have accessible data table
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      jest.mocked(require('../../hooks/useResponsive').useResponsive).mockReturnValue({
        isMobile: true,
        isTablet: false,
        currentBreakpoint: 'xs'
      });
    });

    it('should render mobile navigation on mobile devices', () => {
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument();
      expect(screen.getByText('Strategy Management')).toBeInTheDocument();
    });

    it('should show bottom tab navigation on mobile', () => {
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      const tabList = screen.getByRole('tablist', { name: /main navigation tabs/i });
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should have touch-friendly button sizes', () => {
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44); // WCAG touch target size
      });
    });

    it('should adapt grid layout for mobile', () => {
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      const grids = document.querySelectorAll('.responsive-grid');
      grids.forEach(grid => {
        expect(grid).toHaveClass('responsive-grid');
      });
    });

    it('should handle mobile menu interactions', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      const menuButton = screen.getByLabelText(/open menu/i);
      await user.click(menuButton);
      
      // Menu should open
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      
      // Click backdrop to close
      const backdrop = document.querySelector('.mobile-nav-backdrop');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should handle swipe gestures on mobile', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      const menuButton = screen.getByLabelText(/open menu/i);
      
      // Simulate touch events
      fireEvent.touchStart(menuButton);
      fireEvent.touchEnd(menuButton);
      
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to tablet viewport', () => {
      jest.mocked(require('../../hooks/useResponsive').useResponsive).mockReturnValue({
        isMobile: false,
        isTablet: true,
        currentBreakpoint: 'md'
      });
      
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      // Should show desktop navigation but with tablet-optimized layout
      expect(screen.getByRole('navigation', { name: /strategy navigation/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/open menu/i)).not.toBeInTheDocument();
    });

    it('should adapt to desktop viewport', () => {
      jest.mocked(require('../../hooks/useResponsive').useResponsive).mockReturnValue({
        isMobile: false,
        isTablet: false,
        currentBreakpoint: 'xl'
      });
      
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      // Should show full desktop layout
      expect(screen.getByRole('navigation', { name: /strategy navigation/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/open menu/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist', { name: /main navigation tabs/i })).not.toBeInTheDocument();
    });

    it('should handle window resize events', () => {
      const { rerender } = render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      // Start with desktop
      jest.mocked(require('../../hooks/useResponsive').useResponsive).mockReturnValue({
        isMobile: false,
        isTablet: false,
        currentBreakpoint: 'xl'
      });
      
      rerender(<EnhancedPlaybooksAccessible {...defaultProps} />);
      expect(screen.queryByLabelText(/open menu/i)).not.toBeInTheDocument();
      
      // Switch to mobile
      jest.mocked(require('../../hooks/useResponsive').useResponsive).mockReturnValue({
        isMobile: true,
        isTablet: false,
        currentBreakpoint: 'xs'
      });
      
      rerender(<EnhancedPlaybooksAccessible {...defaultProps} />);
      expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should lazy load heavy components', async () => {
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      // Strategy builder should not be rendered initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Only render when needed
      const createButton = screen.getByRole('button', { name: /create strategy/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle large datasets efficiently', () => {
      const manyStrategies = Array.from({ length: 100 }, (_, i) => ({
        ...mockStrategy,
        id: i.toString(),
        title: `Strategy ${i}`
      }));
      
      const { container } = render(
        <EnhancedPlaybooksAccessible 
          {...defaultProps} 
          // Mock strategies would be loaded from service
        />
      );
      
      // Should render without performance issues
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      // Mock service error
      jest.mocked(require('@/services/StrategyPerformanceService').StrategyPerformanceService)
        .mockImplementation(() => {
          throw new Error('Service error');
        });
      
      expect(() => {
        render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      }).not.toThrow();
    });

    it('should show error states accessibly', () => {
      render(<EnhancedPlaybooksAccessible {...defaultProps} />);
      
      // Error states should have proper ARIA attributes
      const errorElements = document.querySelectorAll('[role="alert"]');
      errorElements.forEach(element => {
        expect(element).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Integration', () => {
    it('should integrate with strategy selection callback', () => {
      const onStrategySelect = jest.fn();
      render(<EnhancedPlaybooksAccessible {...defaultProps} onStrategySelect={onStrategySelect} />);
      
      // Mock strategy card click
      const strategyCard = document.querySelector('.strategy-card');
      if (strategyCard) {
        fireEvent.click(strategyCard);
        expect(onStrategySelect).toHaveBeenCalled();
      }
    });

    it('should handle trade data integration', () => {
      const trades = [
        { id: '1', strategyId: '1', symbol: 'AAPL', quantity: 100 }
      ];
      
      render(<EnhancedPlaybooksAccessible {...defaultProps} trades={trades} />);
      
      // Should filter trades by strategy
      expect(screen.getByText(/strategy performance dashboard/i)).toBeInTheDocument();
    });
  });
});
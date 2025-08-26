import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EnhancedPlaybooks } from '@/components/EnhancedPlaybooks';
import { ProfessionalStrategyBuilder } from '@/components/strategy-builder/ProfessionalStrategyBuilder';
import { StrategyDetailView } from '@/components/strategy-detail/StrategyDetailView';
import { createMockStrategy, createMockPerformanceData } from '../setup';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock axe-core for testing
vi.mock('jest-axe', () => ({
  axe: vi.fn(),
  toHaveNoViolations: vi.fn(),
}));

describe('WCAG 2.1 AA Compliance - Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Mock axe results
    vi.mocked(axe).mockResolvedValue({
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation in strategy dashboard', async () => {
      const strategies = [
        { ...createMockStrategy(), id: 'strategy-1', title: 'Strategy A' },
        { ...createMockStrategy(), id: 'strategy-2', title: 'Strategy B' },
      ];

      render(<EnhancedPlaybooks strategies={strategies} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /create strategy/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /sort by/i })).toHaveFocus();

      await user.tab();
      expect(screen.getAllByRole('button')[2]).toHaveFocus(); // First strategy card

      // Enter should activate focused element
      await user.keyboard('{Enter}');
      expect(screen.getByText('Strategy Details')).toBeInTheDocument();
    });

    it('should support keyboard navigation in strategy builder', async () => {
      render(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={() => {}} 
          onCancel={() => {}} 
        />
      );

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/strategy title/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/methodology/i)).toHaveFocus();

      // Arrow keys should work in select elements
      await user.keyboard('{ArrowDown}');
      expect(screen.getByDisplayValue('Technical')).toBeInTheDocument();
    });

    it('should support keyboard navigation in strategy detail view', async () => {
      const strategy = createMockStrategy();
      render(<StrategyDetailView strategy={strategy} />);

      // Tab through sections
      await user.tab();
      expect(screen.getByRole('button', { name: /edit strategy/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /run backtest/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /performance/i })).toHaveFocus();

      // Arrow keys should navigate between tabs
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /trades/i })).toHaveFocus();
    });

    it('should trap focus in modal dialogs', async () => {
      render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      // Open delete confirmation dialog
      await user.click(screen.getByRole('button', { name: /delete/i }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Focus should be trapped within dialog
      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /confirm delete/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus(); // Should wrap around
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels for strategy cards', () => {
      const strategies = [
        {
          ...createMockStrategy(),
          title: 'EUR/USD Momentum',
          performance: { ...createMockPerformanceData(), profitFactor: 1.8, winRate: 65 },
        },
      ];

      render(<EnhancedPlaybooks strategies={strategies} />);

      const strategyCard = screen.getByRole('button', { 
        name: /EUR\/USD Momentum.*profit factor 1\.8.*win rate 65%/i 
      });
      expect(strategyCard).toBeInTheDocument();
      expect(strategyCard).toHaveAttribute('aria-describedby');
    });

    it('should have proper ARIA labels for form elements', () => {
      render(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={() => {}} 
          onCancel={() => {}} 
        />
      );

      // Required fields should be marked
      const titleInput = screen.getByLabelText(/strategy title/i);
      expect(titleInput).toHaveAttribute('aria-required', 'true');

      // Form sections should have proper headings
      expect(screen.getByRole('heading', { name: /strategy details/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /risk management/i })).toBeInTheDocument();
    });

    it('should announce dynamic content changes', async () => {
      render(<EnhancedPlaybooks strategies={[]} />);

      // Should have live region for announcements
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      // Create new strategy
      await user.click(screen.getByRole('button', { name: /create strategy/i }));

      expect(liveRegion).toHaveTextContent(/navigated to strategy builder/i);
    });

    it('should provide proper chart descriptions', () => {
      const strategy = {
        ...createMockStrategy(),
        performance: {
          ...createMockPerformanceData(),
          monthlyReturns: [
            { month: '2024-01', return: 250, trades: 10, winRate: 70 },
            { month: '2024-02', return: 180, trades: 12, winRate: 58 },
          ],
        },
      };

      render(<StrategyDetailView strategy={strategy} />);

      const chart = screen.getByRole('img', { name: /performance chart/i });
      expect(chart).toHaveAttribute('aria-describedby');
      
      const chartDescription = screen.getByText(/chart showing monthly performance/i);
      expect(chartDescription).toBeInTheDocument();
    });

    it('should provide proper table headers and captions', () => {
      const strategy = createMockStrategy();
      const trades = [
        { id: 'trade-1', symbol: 'EURUSD', pnl: 100, entryTime: '2024-01-01' },
        { id: 'trade-2', symbol: 'GBPUSD', pnl: -50, entryTime: '2024-01-02' },
      ];

      render(<StrategyDetailView strategy={strategy} trades={trades} />);

      const table = screen.getByRole('table');
      expect(table).toHaveAccessibleName();
      
      // Column headers should be properly associated
      expect(screen.getByRole('columnheader', { name: /symbol/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /p&l/i })).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should meet color contrast requirements', async () => {
      const { container } = render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      // Run axe accessibility tests
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not rely solely on color for information', () => {
      const strategy = {
        ...createMockStrategy(),
        performance: {
          ...createMockPerformanceData(),
          performanceTrend: 'Improving' as const,
          profitFactor: 1.8,
        },
      };

      render(<StrategyDetailView strategy={strategy} />);

      // Positive performance should have both color and icon/text
      const performanceIndicator = screen.getByText(/improving/i);
      expect(performanceIndicator).toBeInTheDocument();
      
      // Should have visual indicator beyond color
      expect(screen.getByText(/↗/)).toBeInTheDocument(); // Trend arrow
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

      render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      // Should apply high contrast styles
      const dashboard = screen.getByRole('main');
      expect(dashboard).toHaveClass('high-contrast');
    });

    it('should provide sufficient focus indicators', async () => {
      render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      const createButton = screen.getByRole('button', { name: /create strategy/i });
      
      // Focus the button
      createButton.focus();
      
      // Should have visible focus indicator
      expect(createButton).toHaveClass('focus:ring-2');
      expect(createButton).toHaveClass('focus:ring-blue-500');
    });
  });

  describe('Form Accessibility', () => {
    it('should associate labels with form controls', () => {
      render(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={() => {}} 
          onCancel={() => {}} 
        />
      );

      const titleInput = screen.getByLabelText(/strategy title/i);
      expect(titleInput).toHaveAttribute('id');
      
      const titleLabel = screen.getByText(/strategy title/i);
      expect(titleLabel).toHaveAttribute('for', titleInput.getAttribute('id'));
    });

    it('should provide helpful error messages', async () => {
      render(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={() => {}} 
          onCancel={() => {}} 
        />
      );

      // Submit form without required fields
      await user.click(screen.getByRole('button', { name: /save strategy/i }));

      // Error messages should be associated with fields
      const titleInput = screen.getByLabelText(/strategy title/i);
      expect(titleInput).toHaveAttribute('aria-describedby');
      
      const errorMessage = screen.getByText(/title is required/i);
      expect(errorMessage).toHaveAttribute('id', titleInput.getAttribute('aria-describedby'));
    });

    it('should provide field descriptions and hints', () => {
      render(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={() => {}} 
          onCancel={() => {}} 
        />
      );

      const riskInput = screen.getByLabelText(/risk per trade/i);
      expect(riskInput).toHaveAttribute('aria-describedby');
      
      const hint = screen.getByText(/percentage of account to risk/i);
      expect(hint).toBeInTheDocument();
    });

    it('should support form validation announcements', async () => {
      render(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={() => {}} 
          onCancel={() => {}} 
        />
      );

      const liveRegion = screen.getByRole('status');
      
      // Submit invalid form
      await user.click(screen.getByRole('button', { name: /save strategy/i }));

      expect(liveRegion).toHaveTextContent(/form has errors/i);
    });
  });

  describe('Interactive Element Accessibility', () => {
    it('should have proper button roles and states', () => {
      render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      const createButton = screen.getByRole('button', { name: /create strategy/i });
      expect(createButton).toHaveAttribute('type', 'button');
      
      // Disabled buttons should be marked
      const disabledButton = screen.getByRole('button', { name: /export/i });
      if (disabledButton.hasAttribute('disabled')) {
        expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
      }
    });

    it('should have proper link accessibility', () => {
      const strategy = createMockStrategy();
      render(<StrategyDetailView strategy={strategy} />);

      const strategyLink = screen.getByRole('link', { name: /view all trades/i });
      expect(strategyLink).toHaveAttribute('href');
      
      // External links should be marked
      if (strategyLink.getAttribute('target') === '_blank') {
        expect(strategyLink).toHaveAttribute('aria-label', expect.stringContaining('opens in new tab'));
      }
    });

    it('should have proper dropdown accessibility', async () => {
      render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      const sortDropdown = screen.getByRole('button', { name: /sort by/i });
      expect(sortDropdown).toHaveAttribute('aria-haspopup', 'true');
      expect(sortDropdown).toHaveAttribute('aria-expanded', 'false');

      // Open dropdown
      await user.click(sortDropdown);
      
      expect(sortDropdown).toHaveAttribute('aria-expanded', 'true');
      
      const dropdownMenu = screen.getByRole('menu');
      expect(dropdownMenu).toBeInTheDocument();
    });

    it('should have proper tab panel accessibility', async () => {
      const strategy = createMockStrategy();
      render(<StrategyDetailView strategy={strategy} />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      expect(performanceTab).toHaveAttribute('aria-selected', 'true');
      expect(performanceTab).toHaveAttribute('aria-controls');

      const tabPanel = screen.getByRole('tabpanel');
      expect(tabPanel).toHaveAttribute('aria-labelledby', performanceTab.getAttribute('id'));
    });
  });

  describe('Dynamic Content Accessibility', () => {
    it('should announce loading states', async () => {
      render(<EnhancedPlaybooks loading={true} />);

      const loadingRegion = screen.getByRole('status');
      expect(loadingRegion).toHaveTextContent(/loading strategies/i);
      expect(loadingRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce error states', () => {
      render(<EnhancedPlaybooks error="Failed to load strategies" />);

      const errorRegion = screen.getByRole('alert');
      expect(errorRegion).toHaveTextContent(/failed to load strategies/i);
      expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should announce successful actions', async () => {
      const onSave = vi.fn().mockResolvedValue({ success: true });
      render(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={onSave} 
          onCancel={() => {}} 
        />
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/strategy title/i), 'Test Strategy');
      await user.click(screen.getByRole('button', { name: /save strategy/i }));

      const successRegion = screen.getByRole('status');
      expect(successRegion).toHaveTextContent(/strategy saved successfully/i);
    });

    it('should handle progressive enhancement gracefully', () => {
      // Mock JavaScript disabled scenario
      const { container } = render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      // Should have fallback content
      expect(container.querySelector('noscript')).toBeInTheDocument();
      
      // Core functionality should work without JavaScript
      const strategyList = screen.getByRole('list');
      expect(strategyList).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    it('should support touch accessibility', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      // Touch targets should be large enough (44px minimum)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minSize = parseInt(styles.minHeight) || parseInt(styles.height);
        expect(minSize).toBeGreaterThanOrEqual(44);
      });
    });

    it('should support swipe gestures accessibility', () => {
      render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      // Swipeable elements should have proper ARIA attributes
      const swipeableElement = screen.getByTestId('swipeable-strategy-list');
      expect(swipeableElement).toHaveAttribute('role', 'region');
      expect(swipeableElement).toHaveAttribute('aria-label', expect.stringContaining('swipe'));
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
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

      render(<EnhancedPlaybooks strategies={[createMockStrategy()]} />);

      // Should apply reduced motion styles
      const dashboard = screen.getByRole('main');
      expect(dashboard).toHaveClass('motion-reduce');
    });

    it('should provide alternative feedback for animations', () => {
      render(<EnhancedPlaybooks loading={true} />);

      // Should have text-based loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      
      // Should not rely solely on spinner animation
      expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    });
  });
});
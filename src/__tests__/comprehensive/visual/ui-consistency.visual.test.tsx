import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnhancedPlaybooks } from '@/components/EnhancedPlaybooks';
import { ProfessionalStrategyBuilder } from '@/components/strategy-builder/ProfessionalStrategyBuilder';
import { StrategyDetailView } from '@/components/strategy-detail/StrategyDetailView';
import { createMockStrategy, createMockPerformanceData } from '../setup';

// Mock canvas for chart rendering
const mockCanvas = {
  getContext: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  width: 800,
  height: 600,
};

// Helper function to capture component snapshot
const captureSnapshot = (component: React.ReactElement, testName: string) => {
  const { container } = render(component);
  
  // Simulate taking a visual snapshot
  const snapshot = {
    testName,
    html: container.innerHTML,
    styles: Array.from(document.styleSheets).map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
      } catch {
        return '';
      }
    }).join('\n'),
    timestamp: new Date().toISOString(),
  };
  
  return snapshot;
};

describe('UI Consistency - Visual Regression Tests', () => {
  beforeEach(() => {
    // Mock HTMLCanvasElement
    HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
    HTMLCanvasElement.prototype.toDataURL = mockCanvas.toDataURL;
    
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  describe('Strategy Dashboard Visual Consistency', () => {
    it('should maintain consistent layout for strategy cards', () => {
      const strategies = [
        {
          ...createMockStrategy(),
          id: 'strategy-1',
          title: 'EUR/USD Momentum',
          performance: {
            ...createMockPerformanceData(),
            profitFactor: 1.8,
            winRate: 65,
            expectancy: 45,
          },
        },
        {
          ...createMockStrategy(),
          id: 'strategy-2',
          title: 'Gold Reversal Strategy',
          performance: {
            ...createMockPerformanceData(),
            profitFactor: 1.2,
            winRate: 55,
            expectancy: 25,
          },
        },
      ];

      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'strategy-dashboard-cards'
      );

      // Verify consistent card structure
      expect(snapshot.html).toContain('strategy-card');
      expect(snapshot.html).toContain('EUR/USD Momentum');
      expect(snapshot.html).toContain('Gold Reversal Strategy');
      
      // Check for KPI elements
      expect(snapshot.html).toContain('1.8'); // Profit Factor
      expect(snapshot.html).toContain('65%'); // Win Rate
      
      // Verify consistent styling classes
      expect(snapshot.html).toContain('profit-factor');
      expect(snapshot.html).toContain('win-rate');
      expect(snapshot.html).toContain('expectancy');
    });

    it('should maintain consistent empty state layout', () => {
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={[]} />,
        'strategy-dashboard-empty'
      );

      expect(snapshot.html).toContain('No strategies found');
      expect(snapshot.html).toContain('Create your first strategy');
      expect(snapshot.html).toContain('empty-state');
    });

    it('should maintain consistent loading state layout', () => {
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks loading={true} />,
        'strategy-dashboard-loading'
      );

      expect(snapshot.html).toContain('Loading strategies');
      expect(snapshot.html).toContain('loading-spinner');
    });

    it('should maintain consistent error state layout', () => {
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks error="Failed to load strategies" />,
        'strategy-dashboard-error'
      );

      expect(snapshot.html).toContain('Error loading strategies');
      expect(snapshot.html).toContain('Failed to load strategies');
      expect(snapshot.html).toContain('error-state');
    });
  });

  describe('Strategy Builder Visual Consistency', () => {
    it('should maintain consistent form layout', () => {
      const snapshot = captureSnapshot(
        <ProfessionalStrategyBuilder mode="create" onSave={() => {}} onCancel={() => {}} />,
        'strategy-builder-form'
      );

      // Check for form sections
      expect(snapshot.html).toContain('Strategy Details');
      expect(snapshot.html).toContain('Methodology');
      expect(snapshot.html).toContain('Setup Conditions');
      expect(snapshot.html).toContain('Entry Triggers');
      expect(snapshot.html).toContain('Risk Management');
      
      // Verify form structure
      expect(snapshot.html).toContain('form-section');
      expect(snapshot.html).toContain('input-group');
      expect(snapshot.html).toContain('form-buttons');
    });

    it('should maintain consistent validation error display', () => {
      const snapshot = captureSnapshot(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={() => {}} 
          onCancel={() => {}} 
          validationErrors={{
            title: 'Title is required',
            methodology: 'Please select a methodology',
          }}
        />,
        'strategy-builder-validation-errors'
      );

      expect(snapshot.html).toContain('Title is required');
      expect(snapshot.html).toContain('Please select a methodology');
      expect(snapshot.html).toContain('validation-error');
    });

    it('should maintain consistent step indicator layout', () => {
      const snapshot = captureSnapshot(
        <ProfessionalStrategyBuilder 
          mode="create" 
          onSave={() => {}} 
          onCancel={() => {}} 
          currentStep={2}
          totalSteps={5}
        />,
        'strategy-builder-steps'
      );

      expect(snapshot.html).toContain('step-indicator');
      expect(snapshot.html).toContain('Step 2 of 5');
    });
  });

  describe('Strategy Detail View Visual Consistency', () => {
    it('should maintain consistent performance metrics layout', () => {
      const strategy = {
        ...createMockStrategy(),
        performance: {
          ...createMockPerformanceData(),
          profitFactor: 1.8,
          winRate: 65,
          expectancy: 45,
          sharpeRatio: 1.2,
          maxDrawdown: 500,
        },
      };

      const snapshot = captureSnapshot(
        <StrategyDetailView strategy={strategy} />,
        'strategy-detail-performance'
      );

      // Check for performance sections
      expect(snapshot.html).toContain('Performance Overview');
      expect(snapshot.html).toContain('Key Metrics');
      expect(snapshot.html).toContain('Risk Analysis');
      
      // Verify metric displays
      expect(snapshot.html).toContain('1.8'); // Profit Factor
      expect(snapshot.html).toContain('65%'); // Win Rate
      expect(snapshot.html).toContain('1.2'); // Sharpe Ratio
      
      // Check for chart containers
      expect(snapshot.html).toContain('performance-chart');
      expect(snapshot.html).toContain('equity-curve');
    });

    it('should maintain consistent trade history layout', () => {
      const strategy = createMockStrategy();
      const trades = Array.from({ length: 5 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'EURUSD',
        pnl: (i % 2 === 0 ? 1 : -1) * (50 + i * 10),
        entryTime: new Date(2024, 0, i + 1).toISOString(),
      }));

      const snapshot = captureSnapshot(
        <StrategyDetailView strategy={strategy} trades={trades} />,
        'strategy-detail-trades'
      );

      expect(snapshot.html).toContain('Trade History');
      expect(snapshot.html).toContain('trade-list');
      expect(snapshot.html).toContain('EURUSD');
    });

    it('should maintain consistent AI insights layout', () => {
      const strategy = {
        ...createMockStrategy(),
        aiInsights: [
          {
            type: 'Performance' as const,
            message: 'This strategy performs 23% better on Tuesdays',
            confidence: 0.85,
            actionable: true,
            supportingData: {},
          },
          {
            type: 'Timing' as const,
            message: 'Avoid trading during high volatility periods',
            confidence: 0.72,
            actionable: true,
            supportingData: {},
          },
        ],
      };

      const snapshot = captureSnapshot(
        <StrategyDetailView strategy={strategy} />,
        'strategy-detail-insights'
      );

      expect(snapshot.html).toContain('AI Insights');
      expect(snapshot.html).toContain('This strategy performs 23% better on Tuesdays');
      expect(snapshot.html).toContain('85% confidence');
      expect(snapshot.html).toContain('insight-card');
    });
  });

  describe('Responsive Design Visual Consistency', () => {
    it('should maintain consistent mobile layout', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const strategies = [createMockStrategy()];
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'mobile-layout'
      );

      expect(snapshot.html).toContain('mobile-layout');
      expect(snapshot.html).toContain('mobile-nav');
      
      // Should have mobile-specific classes
      expect(snapshot.styles).toContain('mobile');
    });

    it('should maintain consistent tablet layout', () => {
      // Set tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const strategies = [createMockStrategy()];
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'tablet-layout'
      );

      expect(snapshot.html).toContain('tablet-layout');
      
      // Should adapt grid layout for tablet
      expect(snapshot.styles).toContain('tablet');
    });

    it('should maintain consistent desktop layout', () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      const strategies = [createMockStrategy()];
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'desktop-layout'
      );

      expect(snapshot.html).toContain('desktop-layout');
      expect(snapshot.html).toContain('sidebar');
      
      // Should have full desktop features
      expect(snapshot.styles).toContain('desktop');
    });
  });

  describe('Theme Consistency', () => {
    it('should maintain consistent light theme styling', () => {
      const strategies = [createMockStrategy()];
      
      // Mock light theme
      document.documentElement.setAttribute('data-theme', 'light');
      
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'light-theme'
      );

      expect(snapshot.styles).toContain('light');
      expect(snapshot.html).toContain('theme-light');
    });

    it('should maintain consistent dark theme styling', () => {
      const strategies = [createMockStrategy()];
      
      // Mock dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
      
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'dark-theme'
      );

      expect(snapshot.styles).toContain('dark');
      expect(snapshot.html).toContain('theme-dark');
    });
  });

  describe('Chart Visual Consistency', () => {
    it('should maintain consistent performance chart layout', () => {
      const strategy = {
        ...createMockStrategy(),
        performance: {
          ...createMockPerformanceData(),
          monthlyReturns: [
            { month: '2024-01', return: 250, trades: 10, winRate: 70 },
            { month: '2024-02', return: 180, trades: 12, winRate: 58 },
            { month: '2024-03', return: 320, trades: 15, winRate: 73 },
          ],
        },
      };

      const snapshot = captureSnapshot(
        <StrategyDetailView strategy={strategy} />,
        'performance-charts'
      );

      expect(snapshot.html).toContain('chart-container');
      expect(snapshot.html).toContain('performance-chart');
      expect(snapshot.html).toContain('equity-curve');
      
      // Should have chart canvas elements
      expect(snapshot.html).toContain('canvas');
    });

    it('should maintain consistent comparison chart layout', () => {
      const strategies = [
        { ...createMockStrategy(), id: 'strategy-1', title: 'Strategy A' },
        { ...createMockStrategy(), id: 'strategy-2', title: 'Strategy B' },
      ];

      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} showComparison={true} />,
        'comparison-charts'
      );

      expect(snapshot.html).toContain('comparison-chart');
      expect(snapshot.html).toContain('Strategy A');
      expect(snapshot.html).toContain('Strategy B');
    });
  });

  describe('Animation and Transition Consistency', () => {
    it('should maintain consistent loading animations', () => {
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks loading={true} />,
        'loading-animations'
      );

      expect(snapshot.html).toContain('loading-spinner');
      expect(snapshot.html).toContain('animate-spin');
      
      // Should have animation classes
      expect(snapshot.styles).toContain('animation');
    });

    it('should maintain consistent hover states', () => {
      const strategies = [createMockStrategy()];
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'hover-states'
      );

      // Should have hover effect classes
      expect(snapshot.styles).toContain('hover:');
      expect(snapshot.html).toContain('hover-effect');
    });

    it('should maintain consistent focus states', () => {
      const snapshot = captureSnapshot(
        <ProfessionalStrategyBuilder mode="create" onSave={() => {}} onCancel={() => {}} />,
        'focus-states'
      );

      // Should have focus styling
      expect(snapshot.styles).toContain('focus:');
      expect(snapshot.html).toContain('focus-visible');
    });
  });

  describe('Color and Typography Consistency', () => {
    it('should maintain consistent color scheme', () => {
      const strategies = [
        {
          ...createMockStrategy(),
          performance: {
            ...createMockPerformanceData(),
            profitFactor: 1.8, // Positive
            performanceTrend: 'Improving' as const,
          },
        },
      ];

      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'color-scheme'
      );

      // Should use consistent color classes
      expect(snapshot.html).toContain('text-green'); // Positive performance
      expect(snapshot.html).toContain('bg-blue'); // Primary elements
      expect(snapshot.styles).toContain('--color-primary');
    });

    it('should maintain consistent typography hierarchy', () => {
      const snapshot = captureSnapshot(
        <StrategyDetailView strategy={createMockStrategy()} />,
        'typography-hierarchy'
      );

      // Should have consistent heading classes
      expect(snapshot.html).toContain('text-2xl'); // Main heading
      expect(snapshot.html).toContain('text-lg'); // Section headings
      expect(snapshot.html).toContain('text-sm'); // Body text
      
      // Should have font weight classes
      expect(snapshot.html).toContain('font-bold');
      expect(snapshot.html).toContain('font-medium');
    });
  });

  describe('Icon and Visual Element Consistency', () => {
    it('should maintain consistent icon usage', () => {
      const strategies = [createMockStrategy()];
      const snapshot = captureSnapshot(
        <EnhancedPlaybooks strategies={strategies} />,
        'icon-consistency'
      );

      // Should have consistent icon classes
      expect(snapshot.html).toContain('lucide-icon');
      expect(snapshot.html).toContain('icon-size');
      
      // Common icons should be present
      expect(snapshot.html).toContain('TrendingUp');
      expect(snapshot.html).toContain('BarChart');
    });

    it('should maintain consistent badge and indicator styling', () => {
      const strategy = {
        ...createMockStrategy(),
        performance: {
          ...createMockPerformanceData(),
          statisticallySignificant: true,
          performanceTrend: 'Improving' as const,
        },
      };

      const snapshot = captureSnapshot(
        <StrategyDetailView strategy={strategy} />,
        'badges-indicators'
      );

      expect(snapshot.html).toContain('badge');
      expect(snapshot.html).toContain('indicator');
      expect(snapshot.html).toContain('Statistically Significant');
      expect(snapshot.html).toContain('Improving');
    });
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TradeReviewSystem } from '../../components/trade-review/TradeReviewSystem';
import { ChartGalleryManager } from '../../components/trade-review/ChartGalleryManager';
import { PerformanceAnalyticsPanel } from '../../components/trade-review/PerformanceAnalyticsPanel';
import { EnhancedNotesEditor } from '../../components/trade-review/EnhancedNotesEditor';
import { Trade } from '../../types/trade';

// Mock HTML canvas for chart rendering
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
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
}));

const mockTrade: Trade = {
  id: 'visual-test-trade',
  symbol: 'AAPL',
  entryPrice: 150.00,
  exitPrice: 155.00,
  quantity: 100,
  entryDate: '2024-01-15',
  exitDate: '2024-01-16',
  type: 'long',
  status: 'closed',
  pnl: 500,
  tags: ['momentum', 'breakout', 'earnings-play'],
  notes: 'Visual regression test trade with comprehensive data',
  commission: 2.00,
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
    },
    {
      id: 'chart-2',
      url: 'https://example.com/chart2.png',
      type: 'exit',
      timeframe: '1h',
      uploadedAt: '2024-01-16T15:30:00Z',
      description: 'Exit chart showing profit target hit'
    }
  ],
  reviewData: {
    notes: {
      preTradeAnalysis: 'Strong breakout pattern with volume confirmation',
      executionNotes: 'Clean entry at breakout level',
      postTradeReflection: 'Excellent execution, hit profit target',
      lessonsLearned: 'Volume confirmation is crucial for breakouts',
      generalNotes: 'Perfect textbook trade',
      lastModified: '2024-01-16T16:00:00Z',
      version: 1
    },
    performanceMetrics: {
      rMultiple: 2.5,
      returnPercentage: 3.33,
      riskRewardRatio: 2.5,
      holdDuration: 1,
      efficiency: 0.85,
      sharpeRatio: 1.2,
      maxDrawdown: 0.05
    }
  }
};

// Utility function to create snapshot with consistent styling
const createSnapshot = (component: React.ReactElement, testName: string) => {
  const { container } = render(component);
  
  // Ensure consistent styling for snapshots
  const style = document.createElement('style');
  style.textContent = `
    * { 
      font-family: 'Arial', sans-serif !important;
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
    .loading-spinner { display: none !important; }
    .fade-in, .slide-in { opacity: 1 !important; transform: none !important; }
  `;
  document.head.appendChild(style);
  
  return container;
};

describe('Trade Review Visual Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock current date for consistent snapshots
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('TradeReviewSystem Component Snapshots', () => {
    it('should match snapshot in view mode', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="view"
        />,
        'trade-review-view-mode'
      );

      expect(container).toMatchSnapshot('trade-review-view-mode.html');
    });

    it('should match snapshot in edit mode', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="edit"
        />,
        'trade-review-edit-mode'
      );

      expect(container).toMatchSnapshot('trade-review-edit-mode.html');
    });

    it('should match snapshot in review mode', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="review"
        />,
        'trade-review-review-mode'
      );

      expect(container).toMatchSnapshot('trade-review-review-mode.html');
    });

    it('should match snapshot with navigation context', () => {
      const navigationContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now()
      };

      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          navigationContext={navigationContext}
          initialMode="view"
        />,
        'trade-review-with-navigation'
      );

      expect(container).toMatchSnapshot('trade-review-with-navigation.html');
    });
  });

  describe('Chart Gallery Snapshots', () => {
    it('should match snapshot with multiple charts', () => {
      const container = createSnapshot(
        <ChartGalleryManager
          trade={mockTrade}
          isEditing={false}
          onChartsChange={vi.fn()}
        />,
        'chart-gallery-view'
      );

      expect(container).toMatchSnapshot('chart-gallery-view.html');
    });

    it('should match snapshot in edit mode', () => {
      const container = createSnapshot(
        <ChartGalleryManager
          trade={mockTrade}
          isEditing={true}
          onChartsChange={vi.fn()}
        />,
        'chart-gallery-edit'
      );

      expect(container).toMatchSnapshot('chart-gallery-edit.html');
    });

    it('should match snapshot with empty gallery', () => {
      const tradeWithoutCharts = { ...mockTrade, charts: [] };
      
      const container = createSnapshot(
        <ChartGalleryManager
          trade={tradeWithoutCharts}
          isEditing={true}
          onChartsChange={vi.fn()}
        />,
        'chart-gallery-empty'
      );

      expect(container).toMatchSnapshot('chart-gallery-empty.html');
    });
  });

  describe('Performance Analytics Snapshots', () => {
    it('should match snapshot with performance metrics', () => {
      const container = createSnapshot(
        <PerformanceAnalyticsPanel
          trade={mockTrade}
          similarTrades={[]}
          showComparisons={false}
        />,
        'performance-analytics-basic'
      );

      expect(container).toMatchSnapshot('performance-analytics-basic.html');
    });

    it('should match snapshot with comparisons', () => {
      const similarTrades = [
        { ...mockTrade, id: 'similar-1', pnl: 300 },
        { ...mockTrade, id: 'similar-2', pnl: 700 }
      ];

      const container = createSnapshot(
        <PerformanceAnalyticsPanel
          trade={mockTrade}
          similarTrades={similarTrades}
          showComparisons={true}
        />,
        'performance-analytics-with-comparisons'
      );

      expect(container).toMatchSnapshot('performance-analytics-with-comparisons.html');
    });

    it('should match snapshot with negative performance', () => {
      const losingTrade = { ...mockTrade, pnl: -500, exitPrice: 145 };
      
      const container = createSnapshot(
        <PerformanceAnalyticsPanel
          trade={losingTrade}
          similarTrades={[]}
          showComparisons={false}
        />,
        'performance-analytics-negative'
      );

      expect(container).toMatchSnapshot('performance-analytics-negative.html');
    });
  });

  describe('Notes Editor Snapshots', () => {
    it('should match snapshot in view mode', () => {
      const container = createSnapshot(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={vi.fn()}
        />,
        'notes-editor-view'
      );

      expect(container).toMatchSnapshot('notes-editor-view.html');
    });

    it('should match snapshot in edit mode', () => {
      const container = createSnapshot(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={true}
          onNotesChange={vi.fn()}
        />,
        'notes-editor-edit'
      );

      expect(container).toMatchSnapshot('notes-editor-edit.html');
    });

    it('should match snapshot with empty notes', () => {
      const tradeWithoutNotes = {
        ...mockTrade,
        reviewData: {
          ...mockTrade.reviewData,
          notes: {
            preTradeAnalysis: '',
            executionNotes: '',
            postTradeReflection: '',
            lessonsLearned: '',
            generalNotes: '',
            lastModified: '2024-01-16T16:00:00Z',
            version: 1
          }
        }
      };

      const container = createSnapshot(
        <EnhancedNotesEditor
          trade={tradeWithoutNotes}
          isEditing={true}
          onNotesChange={vi.fn()}
        />,
        'notes-editor-empty'
      );

      expect(container).toMatchSnapshot('notes-editor-empty.html');
    });
  });

  describe('Responsive Layout Snapshots', () => {
    it('should match mobile layout snapshot', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="view"
        />,
        'trade-review-mobile'
      );

      expect(container).toMatchSnapshot('trade-review-mobile.html');
    });

    it('should match tablet layout snapshot', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="view"
        />,
        'trade-review-tablet'
      );

      expect(container).toMatchSnapshot('trade-review-tablet.html');
    });

    it('should match desktop layout snapshot', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="view"
        />,
        'trade-review-desktop'
      );

      expect(container).toMatchSnapshot('trade-review-desktop.html');
    });
  });

  describe('Theme Compatibility Snapshots', () => {
    it('should match light theme snapshot', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="view"
        />,
        'trade-review-light-theme'
      );

      expect(container).toMatchSnapshot('trade-review-light-theme.html');
    });

    it('should match dark theme snapshot', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="view"
        />,
        'trade-review-dark-theme'
      );

      expect(container).toMatchSnapshot('trade-review-dark-theme.html');
    });

    it('should match high contrast theme snapshot', () => {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
      
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="view"
        />,
        'trade-review-high-contrast'
      );

      expect(container).toMatchSnapshot('trade-review-high-contrast.html');
    });
  });

  describe('Error State Snapshots', () => {
    it('should match error state snapshot', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="non-existent-trade"
        />,
        'trade-review-error-state'
      );

      expect(container).toMatchSnapshot('trade-review-error-state.html');
    });

    it('should match loading state snapshot', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="loading-trade"
        />,
        'trade-review-loading-state'
      );

      expect(container).toMatchSnapshot('trade-review-loading-state.html');
    });
  });

  describe('Interactive State Snapshots', () => {
    it('should match snapshot with unsaved changes indicator', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="edit"
        />,
        'trade-review-unsaved-changes'
      );

      // Simulate unsaved changes
      const systemElement = container.querySelector('[data-testid="trade-review-system"]');
      systemElement?.setAttribute('data-has-unsaved-changes', 'true');

      expect(container).toMatchSnapshot('trade-review-unsaved-changes.html');
    });

    it('should match snapshot with validation errors', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="edit"
        />,
        'trade-review-validation-errors'
      );

      // Simulate validation errors
      const form = container.querySelector('form');
      form?.setAttribute('data-has-errors', 'true');

      expect(container).toMatchSnapshot('trade-review-validation-errors.html');
    });
  });

  describe('Component Consistency Tests', () => {
    it('should maintain consistent button styling', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="edit"
        />,
        'button-consistency'
      );

      // Check that all buttons have consistent styling
      const buttons = container.querySelectorAll('button');
      const buttonStyles = Array.from(buttons).map(button => {
        const computedStyle = window.getComputedStyle(button);
        return {
          padding: computedStyle.padding,
          borderRadius: computedStyle.borderRadius,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight
        };
      });

      // Primary buttons should have consistent styling
      const primaryButtons = Array.from(buttons).filter(btn => 
        btn.classList.contains('btn-primary')
      );
      
      expect(primaryButtons.length).toBeGreaterThan(0);
      
      const primaryStyles = primaryButtons.map(btn => window.getComputedStyle(btn));
      const firstPrimaryStyle = primaryStyles[0];
      
      primaryStyles.forEach(style => {
        expect(style.padding).toBe(firstPrimaryStyle.padding);
        expect(style.borderRadius).toBe(firstPrimaryStyle.borderRadius);
      });
    });

    it('should maintain consistent form field styling', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="edit"
        />,
        'form-field-consistency'
      );

      // Check input field consistency
      const inputs = container.querySelectorAll('input[type="text"], input[type="number"], textarea');
      const inputStyles = Array.from(inputs).map(input => {
        const computedStyle = window.getComputedStyle(input);
        return {
          padding: computedStyle.padding,
          borderRadius: computedStyle.borderRadius,
          border: computedStyle.border,
          fontSize: computedStyle.fontSize
        };
      });

      // All inputs should have consistent base styling
      if (inputStyles.length > 1) {
        const firstStyle = inputStyles[0];
        inputStyles.forEach(style => {
          expect(style.padding).toBe(firstStyle.padding);
          expect(style.borderRadius).toBe(firstStyle.borderRadius);
          expect(style.fontSize).toBe(firstStyle.fontSize);
        });
      }
    });

    it('should maintain consistent spacing', () => {
      const container = createSnapshot(
        <TradeReviewSystem
          tradeId="visual-test-trade"
          initialMode="view"
        />,
        'spacing-consistency'
      );

      // Check for consistent spacing classes
      const spacedElements = container.querySelectorAll('[class*="space-"], [class*="gap-"], [class*="p-"], [class*="m-"]');
      
      // Should use consistent spacing scale
      const spacingClasses = Array.from(spacedElements).flatMap(el => 
        Array.from(el.classList).filter(cls => 
          cls.includes('space-') || cls.includes('gap-') || cls.includes('p-') || cls.includes('m-')
        )
      );

      // Common spacing values should be used consistently
      const spacingValues = spacingClasses.map(cls => cls.match(/\d+/)?.[0]).filter(Boolean);
      const uniqueValues = [...new Set(spacingValues)];
      
      // Should use a limited set of spacing values (design system)
      expect(uniqueValues.length).toBeLessThan(10);
    });
  });
});
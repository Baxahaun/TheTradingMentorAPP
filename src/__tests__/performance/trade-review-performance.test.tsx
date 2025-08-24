import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradeReviewSystem } from '../../components/trade-review/TradeReviewSystem';
import { ChartGalleryManager } from '../../components/trade-review/ChartGalleryManager';
import { PerformanceAnalyticsPanel } from '../../components/trade-review/PerformanceAnalyticsPanel';
import { Trade } from '../../types/trade';

// Performance monitoring utilities
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
};

const createLargeTrade = (id: string, chartCount: number = 100): Trade => ({
  id,
  symbol: 'AAPL',
  entryPrice: 150,
  exitPrice: 155,
  quantity: 100,
  entryDate: '2024-01-15',
  exitDate: '2024-01-16',
  type: 'long',
  status: 'closed',
  pnl: 500,
  tags: Array.from({ length: 20 }, (_, i) => `tag-${i}`),
  notes: 'Performance test trade with large dataset',
  commission: 2,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-16T15:30:00Z',
  charts: Array.from({ length: chartCount }, (_, i) => ({
    id: `chart-${i}`,
    url: `https://example.com/chart-${i}.png`,
    type: 'analysis' as const,
    timeframe: '1h',
    uploadedAt: new Date().toISOString(),
    description: `Chart ${i} description`
  })),
  reviewData: {
    notes: {
      preTradeAnalysis: 'Pre-trade analysis '.repeat(100),
      executionNotes: 'Execution notes '.repeat(100),
      postTradeReflection: 'Post-trade reflection '.repeat(100),
      lessonsLearned: 'Lessons learned '.repeat(100),
      generalNotes: 'General notes '.repeat(100),
      lastModified: new Date().toISOString(),
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
});

const createLargeDataset = (tradeCount: number = 1000) => 
  Array.from({ length: tradeCount }, (_, i) => createLargeTrade(`trade-${i}`, 50));

describe('Trade Review Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Performance', () => {
    it('should render TradeReviewSystem with large dataset efficiently', () => {
      const largeTrade = createLargeTrade('perf-test-1', 200);
      
      const renderTime = measurePerformance('TradeReviewSystem render', () => {
        render(<TradeReviewSystem tradeId="perf-test-1" />);
      });

      // Should render within reasonable time (< 100ms)
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
    });

    it('should handle large chart gallery efficiently', () => {
      const largeTrade = createLargeTrade('perf-test-2', 500);
      
      const renderTime = measurePerformance('ChartGallery render', () => {
        render(
          <ChartGalleryManager
            trade={largeTrade}
            isEditing={false}
            onChartsChange={vi.fn()}
          />
        );
      });

      // Should use virtualization for large datasets
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByTestId('virtualized-chart-gallery')).toBeInTheDocument();
    });

    it('should lazy load chart images', async () => {
      const largeTrade = createLargeTrade('perf-test-3', 100);
      
      render(
        <ChartGalleryManager
          trade={largeTrade}
          isEditing={false}
          onChartsChange={vi.fn()}
        />
      );

      // Only visible charts should be loaded initially
      const loadedImages = screen.getAllByRole('img');
      expect(loadedImages.length).toBeLessThan(20); // Should be much less than 100

      // Scroll to load more images
      const gallery = screen.getByTestId('chart-gallery-container');
      fireEvent.scroll(gallery, { target: { scrollTop: 1000 } });

      await waitFor(() => {
        const newLoadedImages = screen.getAllByRole('img');
        expect(newLoadedImages.length).toBeGreaterThan(loadedImages.length);
      });
    });
  });

  describe('Performance Analytics Calculations', () => {
    it('should calculate performance metrics efficiently for large datasets', () => {
      const largeDataset = createLargeDataset(1000);
      const testTrade = largeDataset[0];
      
      const calculationTime = measurePerformance('Performance calculations', () => {
        render(
          <PerformanceAnalyticsPanel
            trade={testTrade}
            similarTrades={largeDataset.slice(1, 100)}
            showComparisons={true}
          />
        );
      });

      // Should calculate metrics within reasonable time
      expect(calculationTime).toBeLessThan(500);
      expect(screen.getByText(/r-multiple/i)).toBeInTheDocument();
    });

    it('should use caching for repeated calculations', () => {
      const testTrade = createLargeTrade('cache-test-1');
      
      // First calculation
      const firstTime = measurePerformance('First calculation', () => {
        render(
          <PerformanceAnalyticsPanel
            trade={testTrade}
            similarTrades={[]}
            showComparisons={false}
          />
        );
      });

      // Second calculation (should be cached)
      const secondTime = measurePerformance('Cached calculation', () => {
        render(
          <PerformanceAnalyticsPanel
            trade={testTrade}
            similarTrades={[]}
            showComparisons={false}
          />
        );
      });

      // Cached calculation should be significantly faster
      expect(secondTime).toBeLessThan(firstTime * 0.5);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on unmount', () => {
      const largeTrade = createLargeTrade('memory-test-1', 200);
      
      const { unmount } = render(
        <TradeReviewSystem tradeId="memory-test-1" />
      );

      // Monitor memory usage (simplified test)
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Memory should not increase significantly after unmount
      expect(finalMemory - initialMemory).toBeLessThan(1000000); // 1MB threshold
    });

    it('should limit concurrent image loading', async () => {
      const largeTrade = createLargeTrade('concurrent-test-1', 100);
      
      render(
        <ChartGalleryManager
          trade={largeTrade}
          isEditing={false}
          onChartsChange={vi.fn()}
        />
      );

      // Should not load all images at once
      const loadingImages = screen.getAllByTestId('loading-chart-image');
      expect(loadingImages.length).toBeLessThan(10); // Concurrent limit
    });
  });

  describe('Auto-save Performance', () => {
    it('should debounce auto-save operations', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      
      render(
        <TradeReviewSystem
          tradeId="debounce-test-1"
          initialMode="edit"
          onSave={mockSave}
        />
      );

      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      
      // Type rapidly
      const startTime = performance.now();
      await user.type(notesInput, 'Rapid typing test for debounce performance');
      const endTime = performance.now();

      // Should complete typing quickly
      expect(endTime - startTime).toBeLessThan(1000);

      // Wait for debounce
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });
    });

    it('should batch multiple field updates', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      
      render(
        <TradeReviewSystem
          tradeId="batch-test-1"
          initialMode="edit"
          onSave={mockSave}
        />
      );

      // Update multiple fields quickly
      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      const tagInput = screen.getByRole('combobox', { name: /tags/i });

      await user.type(notesInput, 'Batch test notes');
      await user.click(tagInput);
      await user.type(tagInput, 'batch-test-tag');
      await user.keyboard('{Enter}');

      // Should batch updates into single save operation
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });
    });
  });

  describe('Search and Filter Performance', () => {
    it('should handle large tag lists efficiently', async () => {
      const user = userEvent.setup();
      const largeTrade = createLargeTrade('search-test-1');
      largeTrade.tags = Array.from({ length: 1000 }, (_, i) => `tag-${i}`);
      
      render(
        <TradeReviewSystem
          tradeId="search-test-1"
          initialMode="edit"
        />
      );

      const tagInput = screen.getByRole('combobox', { name: /tags/i });
      
      const searchTime = measurePerformance('Tag search', async () => {
        await user.click(tagInput);
        await user.type(tagInput, 'tag-5');
      });

      // Should search efficiently even with large tag list
      expect(searchTime).toBeLessThan(200);
    });

    it('should virtualize large dropdown lists', async () => {
      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="virtualize-test-1"
          initialMode="edit"
        />
      );

      const tagInput = screen.getByRole('combobox', { name: /tags/i });
      await user.click(tagInput);

      // Should show virtualized dropdown for large lists
      expect(screen.getByTestId('virtualized-tag-dropdown')).toBeInTheDocument();
    });
  });

  describe('Network Request Optimization', () => {
    it('should batch API requests', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => ({}) });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      
      render(
        <TradeReviewSystem
          tradeId="batch-api-test-1"
          initialMode="edit"
        />
      );

      // Make multiple changes quickly
      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.type(notesInput, 'API batch test');

      const tagInput = screen.getByRole('combobox', { name: /tags/i });
      await user.click(tagInput);
      await user.type(tagInput, 'api-test-tag');
      await user.keyboard('{Enter}');

      // Should batch requests
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });
    });

    it('should implement request deduplication', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => ({}) });
      global.fetch = mockFetch;

      // Render multiple instances with same trade ID
      render(
        <div>
          <TradeReviewSystem tradeId="dedup-test-1" />
          <TradeReviewSystem tradeId="dedup-test-1" />
        </div>
      );

      // Should only make one request for the same trade
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Rendering Optimization', () => {
    it('should use React.memo for expensive components', () => {
      const largeTrade = createLargeTrade('memo-test-1');
      
      const { rerender } = render(
        <PerformanceAnalyticsPanel
          trade={largeTrade}
          similarTrades={[]}
          showComparisons={false}
        />
      );

      // Re-render with same props
      const rerenderTime = measurePerformance('Memoized re-render', () => {
        rerender(
          <PerformanceAnalyticsPanel
            trade={largeTrade}
            similarTrades={[]}
            showComparisons={false}
          />
        );
      });

      // Memoized component should re-render quickly
      expect(rerenderTime).toBeLessThan(10);
    });

    it('should implement efficient list rendering', () => {
      const largeTrade = createLargeTrade('list-test-1', 1000);
      
      const renderTime = measurePerformance('Large list render', () => {
        render(
          <ChartGalleryManager
            trade={largeTrade}
            isEditing={false}
            onChartsChange={vi.fn()}
          />
        );
      });

      // Should render large lists efficiently using virtualization
      expect(renderTime).toBeLessThan(300);
      expect(screen.getByTestId('virtualized-chart-gallery')).toBeInTheDocument();
    });
  });
});
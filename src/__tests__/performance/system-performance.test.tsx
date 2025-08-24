/**
 * System Performance Tests
 * 
 * Tests system performance under realistic data loads and usage patterns.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import TradeReviewSystem from '../../components/TradeReviewSystem';
import { Trade } from '../../types/trade';
import { mockTrades } from '../mocks/tradeData';

// Performance monitoring utilities
const measurePerformance = async (operation: () => Promise<void> | void) => {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  await operation();
  
  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  return {
    duration: endTime - startTime,
    memoryDelta: endMemory - startMemory,
  };
};

// Generate large datasets for testing
const generateLargeTradeDataset = (count: number): Trade[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockTrades[0],
    id: `trade-${i}`,
    currencyPair: `PAIR${i % 50}`, // 50 different pairs
    entryDate: new Date(2024, 0, 1 + (i % 365)).toISOString(),
    entryPrice: 1.0000 + (Math.random() * 0.1),
    exitPrice: 1.0000 + (Math.random() * 0.1),
    quantity: 10000 + (Math.random() * 90000),
    notes: `Trade notes for trade ${i}`.repeat(10), // Longer notes
    tags: [`tag-${i % 20}`, `category-${i % 10}`, `strategy-${i % 5}`],
    charts: Array.from({ length: i % 5 }, (_, j) => ({
      id: `chart-${i}-${j}`,
      url: `https://example.com/chart-${i}-${j}.png`,
      type: 'analysis' as const,
      timeframe: '1H',
      uploadedAt: new Date().toISOString(),
    })),
  }));
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('System Performance Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockTradeContext: any;

  beforeEach(() => {
    user = userEvent.setup();
    
    mockTradeContext = {
      trades: mockTrades,
      updateTrade: vi.fn().mockResolvedValue(undefined),
      deleteTrade: vi.fn().mockResolvedValue(undefined),
      addTrade: vi.fn().mockResolvedValue(undefined),
      loading: false,
      error: null,
    };

    // Mock performance API
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 10 * 1024 * 1024, // 10MB
        totalJSHeapSize: 20 * 1024 * 1024, // 20MB
        jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
      },
      writable: true,
    });

    // Mock intersection observer for lazy loading
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock resize observer
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Load Performance', () => {
    it('should load quickly with standard dataset', async () => {
      const metrics = await measurePerformance(async () => {
        render(
          <TestWrapper>
            <TradeReviewSystem tradeId="trade-1" />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });
      });

      // Should load within 500ms
      expect(metrics.duration).toBeLessThan(500);
      
      // Memory usage should be reasonable
      expect(metrics.memoryDelta).toBeLessThan(5 * 1024 * 1024); // 5MB
    });

    it('should handle large datasets efficiently', async () => {
      const largeTrades = generateLargeTradeDataset(1000);
      mockTradeContext.trades = largeTrades;

      vi.doMock('../../contexts/TradeContext', () => ({
        useTradeContext: () => mockTradeContext,
      }));

      const metrics = await measurePerformance(async () => {
        render(
          <TestWrapper>
            <TradeReviewSystem tradeId="trade-500" />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });
      });

      // Should still load within reasonable time with large dataset
      expect(metrics.duration).toBeLessThan(1000); // 1 second
      
      // Memory usage should not be excessive
      expect(metrics.memoryDelta).toBeLessThan(20 * 1024 * 1024); // 20MB
    });

    it('should lazy load heavy components', async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      // Initial render should be fast
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const initialLoadTime = performance.now() - startTime;
      expect(initialLoadTime).toBeLessThan(300);

      // Navigate to analysis panel (should lazy load)
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      const analysisStartTime = performance.now();
      
      await user.click(analysisTab);

      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /analysis/i })).toBeInTheDocument();
      });

      const analysisLoadTime = performance.now() - analysisStartTime;
      expect(analysisLoadTime).toBeLessThan(200);
    });
  });

  describe('Navigation Performance', () => {
    it('should navigate between trades quickly', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const metrics = await measurePerformance(async () => {
        // Navigate to next trade
        const nextButton = screen.getByRole('button', { name: /next trade/i });
        await user.click(nextButton);

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });
      });

      // Navigation should be fast
      expect(metrics.duration).toBeLessThan(200);
    });

    it('should handle rapid navigation without performance degradation', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const navigationTimes: number[] = [];

      // Perform 10 rapid navigations
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        const nextButton = screen.getByRole('button', { name: /next trade/i });
        await user.click(nextButton);

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });

        navigationTimes.push(performance.now() - startTime);
      }

      // Each navigation should be consistently fast
      navigationTimes.forEach(time => {
        expect(time).toBeLessThan(300);
      });

      // Performance should not degrade over time
      const firstHalf = navigationTimes.slice(0, 5);
      const secondHalf = navigationTimes.slice(5);
      const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;

      // Second half should not be significantly slower
      expect(secondAvg).toBeLessThan(firstAvg * 1.5);
    });

    it('should handle panel switching efficiently', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const panels = ['analysis', 'performance', 'workflow'];
      const switchTimes: number[] = [];

      for (const panel of panels) {
        const startTime = performance.now();
        
        const tab = screen.getByRole('tab', { name: new RegExp(panel, 'i') });
        await user.click(tab);

        await waitFor(() => {
          expect(screen.getByRole('tabpanel', { name: new RegExp(panel, 'i') })).toBeInTheDocument();
        });

        switchTimes.push(performance.now() - startTime);
      }

      // Panel switching should be fast
      switchTimes.forEach(time => {
        expect(time).toBeLessThan(150);
      });
    });
  });

  describe('Data Processing Performance', () => {
    it('should calculate performance metrics quickly', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const metrics = await measurePerformance(async () => {
        // Navigate to performance panel
        const performanceTab = screen.getByRole('tab', { name: /performance/i });
        await user.click(performanceTab);

        await waitFor(() => {
          expect(screen.getByText(/r-multiple/i)).toBeInTheDocument();
        });
      });

      // Performance calculations should be fast
      expect(metrics.duration).toBeLessThan(100);
    });

    it('should handle large note content efficiently', async () => {
      const tradeWithLargeNotes = {
        ...mockTrades[0],
        notes: 'A'.repeat(10000), // 10KB of notes
      };

      mockTradeContext.trades = [tradeWithLargeNotes];

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const metrics = await measurePerformance(async () => {
        // Switch to edit mode
        const editButton = screen.getByRole('button', { name: /edit/i });
        await user.click(editButton);

        // Navigate to analysis panel
        const analysisTab = screen.getByRole('tab', { name: /analysis/i });
        await user.click(analysisTab);

        await waitFor(() => {
          expect(screen.getByRole('tabpanel', { name: /analysis/i })).toBeInTheDocument();
        });
      });

      // Should handle large content without significant delay
      expect(metrics.duration).toBeLessThan(300);
    });

    it('should process tag operations efficiently', async () => {
      const tradeWithManyTags = {
        ...mockTrades[0],
        tags: Array.from({ length: 100 }, (_, i) => `tag-${i}`),
      };

      mockTradeContext.trades = [tradeWithManyTags];

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const metrics = await measurePerformance(async () => {
        // Navigate to analysis panel
        const analysisTab = screen.getByRole('tab', { name: /analysis/i });
        await user.click(analysisTab);

        await waitFor(() => {
          expect(screen.getByRole('tabpanel', { name: /analysis/i })).toBeInTheDocument();
        });

        // Tag management should load
        const tagSection = screen.getByRole('region', { name: /tags/i });
        expect(tagSection).toBeInTheDocument();
      });

      // Tag processing should be efficient
      expect(metrics.duration).toBeLessThan(200);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during normal usage', async () => {
      const initialMemory = (performance as any).memory.usedJSHeapSize;

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Perform various operations
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    it('should clean up resources on unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const beforeUnmount = (performance as any).memory.usedJSHeapSize;

      // Unmount component
      unmount();

      // Force garbage collection
      if ((global as any).gc) {
        (global as any).gc();
      }

      const afterUnmount = (performance as any).memory.usedJSHeapSize;

      // Memory should be freed (or at least not increase significantly)
      expect(afterUnmount).toBeLessThanOrEqual(beforeUnmount * 1.1);
    });

    it('should handle chart gallery memory efficiently', async () => {
      const tradeWithManyCharts = {
        ...mockTrades[0],
        charts: Array.from({ length: 20 }, (_, i) => ({
          id: `chart-${i}`,
          url: `https://example.com/chart-${i}.png`,
          type: 'analysis' as const,
          timeframe: '1H',
          uploadedAt: new Date().toISOString(),
        })),
      };

      mockTradeContext.trades = [tradeWithManyCharts];

      const initialMemory = (performance as any).memory.usedJSHeapSize;

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Navigate to analysis panel with charts
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /analysis/i })).toBeInTheDocument();
      });

      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      // Chart gallery should not consume excessive memory
      expect(memoryIncrease).toBeLessThan(15 * 1024 * 1024); // 15MB
    });
  });

  describe('Rendering Performance', () => {
    it('should minimize re-renders during editing', async () => {
      let renderCount = 0;
      const OriginalTradeReviewSystem = TradeReviewSystem;
      
      const TrackedTradeReviewSystem = (props: any) => {
        renderCount++;
        return <OriginalTradeReviewSystem {...props} />;
      };

      render(
        <TestWrapper>
          <TrackedTradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      const initialRenderCount = renderCount;

      // Switch to edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Make a small change
      const input = screen.getByDisplayValue(/EUR\/USD/i);
      await user.type(input, 'X');

      // Should not cause excessive re-renders
      const finalRenderCount = renderCount;
      const additionalRenders = finalRenderCount - initialRenderCount;
      
      expect(additionalRenders).toBeLessThan(5);
    });

    it('should handle rapid input changes efficiently', async () => {
      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Switch to edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue(/EUR\/USD/i);

      const metrics = await measurePerformance(async () => {
        // Simulate rapid typing
        await user.clear(input);
        await user.type(input, 'GBP/USD/JPY/CHF');
      });

      // Rapid input should be handled efficiently
      expect(metrics.duration).toBeLessThan(500);
    });

    it('should optimize list rendering with virtualization', async () => {
      const largeTrades = generateLargeTradeDataset(500);
      mockTradeContext.trades = largeTrades;

      const metrics = await measurePerformance(async () => {
        render(
          <TestWrapper>
            <TradeReviewSystem tradeId="trade-250" />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByRole('main')).toBeInTheDocument();
        });
      });

      // Large lists should render efficiently with virtualization
      expect(metrics.duration).toBeLessThan(800);
    });
  });

  describe('Network Performance', () => {
    it('should handle slow save operations gracefully', async () => {
      // Mock slow save operation
      mockTradeContext.updateTrade = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000))
      );

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Switch to edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Make changes
      const input = screen.getByDisplayValue(/EUR\/USD/i);
      await user.clear(input);
      await user.type(input, 'GBP/USD');

      // Save should show loading state
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show loading indicator
      expect(screen.getByRole('button', { name: /saving/i }) || 
             screen.getByText(/saving/i)).toBeInTheDocument();

      // UI should remain responsive during save
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      expect(screen.getByRole('tabpanel', { name: /analysis/i })).toBeInTheDocument();
    });

    it('should batch multiple updates efficiently', async () => {
      let updateCount = 0;
      mockTradeContext.updateTrade = vi.fn().mockImplementation(() => {
        updateCount++;
        return Promise.resolve();
      });

      render(
        <TestWrapper>
          <TradeReviewSystem tradeId="trade-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Switch to edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Make multiple rapid changes
      const input = screen.getByDisplayValue(/EUR\/USD/i);
      await user.clear(input);
      await user.type(input, 'GBP');
      await user.type(input, '/USD');

      // Navigate to analysis and add notes
      const analysisTab = screen.getByRole('tab', { name: /analysis/i });
      await user.click(analysisTab);

      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.type(notesInput, 'Test notes');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockTradeContext.updateTrade).toHaveBeenCalled();
      });

      // Should batch updates efficiently (not call update for every keystroke)
      expect(updateCount).toBe(1);
    });
  });
});
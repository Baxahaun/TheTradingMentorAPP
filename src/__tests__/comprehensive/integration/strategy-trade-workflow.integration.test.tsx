import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrategyTradeWorkflow } from '@/components/StrategyTradeWorkflow';
import { StrategyPerformanceService } from '@/services/StrategyPerformanceService';
import { StrategyAttributionService } from '@/services/StrategyAttributionService';
import { createMockStrategy, createMockTrade } from '../setup';

// Mock the services
vi.mock('@/services/StrategyPerformanceService');
vi.mock('@/services/StrategyAttributionService');

describe('Strategy-Trade Workflow Integration Tests', () => {
  let performanceService: StrategyPerformanceService;
  let attributionService: StrategyAttributionService;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    performanceService = new StrategyPerformanceService();
    attributionService = new StrategyAttributionService();
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Complete Trade Review to Strategy Performance Workflow', () => {
    it('should complete full workflow from trade entry to performance update', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = createMockTrade();

      // Mock service responses
      vi.mocked(attributionService.suggestStrategy).mockResolvedValue([
        {
          strategyId: mockStrategy.id,
          confidence: 0.85,
          reasons: ['Symbol match', 'Signal alignment'],
        },
      ]);

      vi.mocked(attributionService.assignTradeToStrategy).mockResolvedValue({
        success: true,
        tradeId: mockTrade.id,
        strategyId: mockStrategy.id,
      });

      vi.mocked(performanceService.updatePerformanceMetrics).mockResolvedValue();

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      // Step 1: Trade review shows strategy suggestions
      expect(screen.getByText('Suggested Strategies')).toBeInTheDocument();
      expect(screen.getByText(mockStrategy.title)).toBeInTheDocument();
      expect(screen.getByText('85% confidence')).toBeInTheDocument();

      // Step 2: User selects suggested strategy
      await user.click(screen.getByText('Assign Strategy'));

      // Step 3: Verify assignment confirmation
      await waitFor(() => {
        expect(screen.getByText('Strategy assigned successfully')).toBeInTheDocument();
      });

      // Step 4: Performance metrics should update
      expect(performanceService.updatePerformanceMetrics).toHaveBeenCalledWith(
        mockStrategy.id,
        mockTrade
      );

      // Step 5: Navigate to updated strategy performance
      await user.click(screen.getByText('View Strategy Performance'));

      await waitFor(() => {
        expect(screen.getByText('Strategy Performance Updated')).toBeInTheDocument();
      });
    });

    it('should handle manual strategy assignment workflow', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = createMockTrade();

      // Mock no automatic suggestions
      vi.mocked(attributionService.suggestStrategy).mockResolvedValue([]);

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      // Should show manual assignment option
      expect(screen.getByText('No automatic suggestions')).toBeInTheDocument();
      expect(screen.getByText('Assign Manually')).toBeInTheDocument();

      // User selects manual assignment
      await user.click(screen.getByText('Assign Manually'));

      // Strategy selector should appear
      expect(screen.getByText('Select Strategy')).toBeInTheDocument();
      
      // Select strategy from dropdown
      await user.selectOptions(screen.getByRole('combobox'), mockStrategy.id);
      await user.click(screen.getByText('Assign'));

      // Verify assignment
      await waitFor(() => {
        expect(attributionService.assignTradeToStrategy).toHaveBeenCalledWith(
          mockTrade.id,
          mockStrategy.id
        );
      });
    });

    it('should handle strategy adherence scoring workflow', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = {
        ...createMockTrade(),
        notes: 'Perfect setup with all confirmation signals',
        strategyId: mockStrategy.id,
      };

      vi.mocked(attributionService.calculateAdherenceScore).mockReturnValue(0.92);
      vi.mocked(attributionService.identifyDeviations).mockReturnValue([]);

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      // Should show adherence analysis
      expect(screen.getByText('Strategy Adherence')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('Excellent adherence')).toBeInTheDocument();

      // Should show no deviations
      expect(screen.getByText('No rule violations detected')).toBeInTheDocument();
    });

    it('should handle poor adherence with deviations', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = {
        ...createMockTrade(),
        notes: 'Weak signal, entered late',
        strategyId: mockStrategy.id,
      };

      vi.mocked(attributionService.calculateAdherenceScore).mockReturnValue(0.35);
      vi.mocked(attributionService.identifyDeviations).mockReturnValue([
        {
          type: 'EntryTiming',
          planned: 'Market open',
          actual: 'Afternoon',
          impact: 'Negative',
          description: 'Entered 4 hours after optimal timing',
        },
        {
          type: 'Signal',
          planned: 'Strong bullish engulfing',
          actual: 'Weak bullish candle',
          impact: 'Negative',
          description: 'Signal strength below threshold',
        },
      ]);

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      // Should show poor adherence
      expect(screen.getByText('35%')).toBeInTheDocument();
      expect(screen.getByText('Poor adherence')).toBeInTheDocument();

      // Should show deviations
      expect(screen.getByText('2 rule violations detected')).toBeInTheDocument();
      expect(screen.getByText('Entered 4 hours after optimal timing')).toBeInTheDocument();
      expect(screen.getByText('Signal strength below threshold')).toBeInTheDocument();
    });
  });

  describe('Real-time Performance Updates', () => {
    it('should update performance metrics in real-time', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = createMockTrade();

      // Mock initial performance
      const initialPerformance = {
        totalTrades: 10,
        winningTrades: 6,
        profitFactor: 1.5,
        expectancy: 25,
      };

      // Mock updated performance after new trade
      const updatedPerformance = {
        totalTrades: 11,
        winningTrades: 7,
        profitFactor: 1.6,
        expectancy: 28,
      };

      vi.mocked(performanceService.calculateProfessionalMetrics)
        .mockReturnValueOnce(initialPerformance as any)
        .mockReturnValueOnce(updatedPerformance as any);

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      // Initial performance should be displayed
      expect(screen.getByText('10 trades')).toBeInTheDocument();
      expect(screen.getByText('1.5')).toBeInTheDocument(); // Profit factor

      // Assign trade to strategy
      await user.click(screen.getByText('Assign Strategy'));

      // Performance should update
      await waitFor(() => {
        expect(screen.getByText('11 trades')).toBeInTheDocument();
        expect(screen.getByText('1.6')).toBeInTheDocument(); // Updated profit factor
      });

      // Should show performance change indicator
      expect(screen.getByText('↗ +0.1')).toBeInTheDocument();
    });

    it('should handle performance degradation', async () => {
      const mockStrategy = createMockStrategy();
      const losingTrade = {
        ...createMockTrade(),
        pnl: -150, // Losing trade
      };

      const initialPerformance = {
        totalTrades: 10,
        winningTrades: 6,
        profitFactor: 1.5,
        expectancy: 25,
      };

      const degradedPerformance = {
        totalTrades: 11,
        winningTrades: 6, // Same winning trades
        profitFactor: 1.3, // Decreased
        expectancy: 18, // Decreased
      };

      vi.mocked(performanceService.calculateProfessionalMetrics)
        .mockReturnValueOnce(initialPerformance as any)
        .mockReturnValueOnce(degradedPerformance as any);

      render(
        <StrategyTradeWorkflow
          trade={losingTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      await user.click(screen.getByText('Assign Strategy'));

      await waitFor(() => {
        expect(screen.getByText('1.3')).toBeInTheDocument();
        expect(screen.getByText('↘ -0.2')).toBeInTheDocument(); // Decline indicator
      });

      // Should show warning for performance decline
      expect(screen.getByText('Performance decline detected')).toBeInTheDocument();
    });
  });

  describe('Bidirectional Navigation', () => {
    it('should navigate from strategy to related trades', async () => {
      const mockStrategy = createMockStrategy();
      const relatedTrades = [
        { ...createMockTrade(), id: 'trade-1', strategyId: mockStrategy.id },
        { ...createMockTrade(), id: 'trade-2', strategyId: mockStrategy.id },
      ];

      render(
        <StrategyTradeWorkflow
          strategy={mockStrategy}
          relatedTrades={relatedTrades}
          onComplete={() => {}}
        />
      );

      // Should show related trades
      expect(screen.getByText('Related Trades (2)')).toBeInTheDocument();
      
      // Click on a trade
      await user.click(screen.getByText('trade-1'));

      // Should navigate to trade detail
      await waitFor(() => {
        expect(screen.getByText('Trade Details')).toBeInTheDocument();
        expect(screen.getByText('Strategy: ' + mockStrategy.title)).toBeInTheDocument();
      });
    });

    it('should navigate from trade back to strategy', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = {
        ...createMockTrade(),
        strategyId: mockStrategy.id,
      };

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      // Should show strategy link
      expect(screen.getByText('View Strategy: ' + mockStrategy.title)).toBeInTheDocument();
      
      await user.click(screen.getByText('View Strategy: ' + mockStrategy.title));

      // Should navigate to strategy detail
      await waitFor(() => {
        expect(screen.getByText('Strategy Performance')).toBeInTheDocument();
        expect(screen.getByText(mockStrategy.title)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle strategy assignment failures', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = createMockTrade();

      vi.mocked(attributionService.assignTradeToStrategy).mockRejectedValue(
        new Error('Database connection failed')
      );

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      await user.click(screen.getByText('Assign Strategy'));

      await waitFor(() => {
        expect(screen.getByText('Assignment failed')).toBeInTheDocument();
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle performance calculation errors', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = createMockTrade();

      vi.mocked(performanceService.updatePerformanceMetrics).mockRejectedValue(
        new Error('Calculation error')
      );

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      await user.click(screen.getByText('Assign Strategy'));

      await waitFor(() => {
        expect(screen.getByText('Performance update failed')).toBeInTheDocument();
      });

      // Should still show successful assignment
      expect(screen.getByText('Strategy assigned successfully')).toBeInTheDocument();
    });

    it('should handle network connectivity issues', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrade = createMockTrade();

      // Simulate network error
      vi.mocked(attributionService.suggestStrategy).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={[mockStrategy]}
          onComplete={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Connection error')).toBeInTheDocument();
        expect(screen.getByText('Unable to load strategy suggestions')).toBeInTheDocument();
      });

      // Should offer offline mode
      expect(screen.getByText('Continue Offline')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large numbers of strategies efficiently', async () => {
      const manyStrategies = Array.from({ length: 1000 }, (_, i) => ({
        ...createMockStrategy(),
        id: `strategy-${i}`,
        title: `Strategy ${i}`,
      }));

      const mockTrade = createMockTrade();

      const startTime = performance.now();
      
      render(
        <StrategyTradeWorkflow
          trade={mockTrade}
          strategies={manyStrategies}
          onComplete={() => {}}
        />
      );

      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Should show virtualized strategy list
      expect(screen.getByTestId('virtualized-strategy-list')).toBeInTheDocument();
    });

    it('should debounce rapid performance updates', async () => {
      const mockStrategy = createMockStrategy();
      const mockTrades = Array.from({ length: 10 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
      }));

      render(
        <StrategyTradeWorkflow
          strategy={mockStrategy}
          onComplete={() => {}}
        />
      );

      // Simulate rapid trade assignments
      for (const trade of mockTrades) {
        fireEvent.click(screen.getByText('Assign Strategy'));
      }

      // Should debounce updates
      await waitFor(() => {
        expect(performanceService.updatePerformanceMetrics).toHaveBeenCalledTimes(1);
      });
    });
  });
});
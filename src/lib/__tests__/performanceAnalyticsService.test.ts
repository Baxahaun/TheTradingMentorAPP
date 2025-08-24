/**
 * Unit tests for PerformanceAnalyticsService
 */

import { PerformanceAnalyticsService } from '../performanceAnalyticsService';
import { Trade } from '../../types/trade';

describe('PerformanceAnalyticsService', () => {
  let service: PerformanceAnalyticsService;
  let mockTrade: Trade;

  beforeEach(() => {
    service = new PerformanceAnalyticsService();
    
    mockTrade = {
      id: 'test-trade-1',
      accountId: 'test-account',
      currencyPair: 'EUR/USD',
      date: '2024-01-15',
      timeIn: '09:00',
      timeOut: '15:00',
      side: 'long',
      entryPrice: 1.1000,
      exitPrice: 1.1100,
      lotSize: 1,
      lotType: 'standard',
      units: 100000,
      stopLoss: 1.0950,
      takeProfit: 1.1150,
      riskAmount: 500,
      pnl: 1000,
      commission: 10,
      accountCurrency: 'USD',
      status: 'closed',
      strategy: 'trend_following',
      timeframe: '1H',
      marketConditions: 'trending',
      confidence: 8
    };
  });

  describe('calculateMetrics', () => {
    it('should calculate R-multiple correctly', () => {
      const metrics = service.calculateMetrics(mockTrade);
      expect(metrics.rMultiple).toBe(2); // 1000 / 500 = 2
    });

    it('should calculate return percentage correctly', () => {
      const metrics = service.calculateMetrics(mockTrade);
      expect(metrics.returnPercentage).toBe(200); // (1000 / 500) * 100 = 200%
    });

    it('should calculate risk-reward ratio correctly for long trade', () => {
      const metrics = service.calculateMetrics(mockTrade);
      // Reward: 1.1150 - 1.1000 = 0.0150
      // Risk: 1.1000 - 1.0950 = 0.0050
      // Ratio: 0.0150 / 0.0050 = 3
      expect(metrics.riskRewardRatio).toBe(3);
    });

    it('should calculate risk-reward ratio correctly for short trade', () => {
      const shortTrade = {
        ...mockTrade,
        side: 'short' as const,
        entryPrice: 1.1000,
        exitPrice: 1.0900,
        stopLoss: 1.1050,
        takeProfit: 1.0850
      };

      const metrics = service.calculateMetrics(shortTrade);
      // Reward: 1.1000 - 1.0850 = 0.0150
      // Risk: 1.1050 - 1.1000 = 0.0050
      // Ratio: 0.0150 / 0.0050 = 3
      expect(metrics.riskRewardRatio).toBe(3);
    });

    it('should calculate hold duration correctly', () => {
      const metrics = service.calculateMetrics(mockTrade);
      expect(metrics.holdDuration).toBe(6); // 6 hours from 09:00 to 15:00
    });

    it('should calculate efficiency correctly for long trade', () => {
      const metrics = service.calculateMetrics(mockTrade);
      // Actual move: 1.1100 - 1.1000 = 0.0100
      // Potential move: 1.1150 - 1.1000 = 0.0150
      // Efficiency: 0.0100 / 0.0150 = 0.6667
      expect(metrics.efficiency).toBeCloseTo(0.6667, 4);
    });

    it('should handle missing data gracefully', () => {
      const incompleteTrade = {
        ...mockTrade,
        riskAmount: undefined,
        pnl: undefined,
        stopLoss: undefined,
        takeProfit: undefined
      };

      const metrics = service.calculateMetrics(incompleteTrade);
      expect(metrics.rMultiple).toBe(0);
      expect(metrics.returnPercentage).toBe(0);
      expect(metrics.riskRewardRatio).toBe(0);
      expect(metrics.efficiency).toBe(0);
    });
  });

  describe('findSimilarTrades', () => {
    let allTrades: Trade[];

    beforeEach(() => {
      allTrades = [
        mockTrade,
        {
          ...mockTrade,
          id: 'similar-1',
          currencyPair: 'EUR/USD', // Same pair
          strategy: 'trend_following', // Same strategy
          side: 'long', // Same side
          status: 'closed'
        },
        {
          ...mockTrade,
          id: 'similar-2',
          currencyPair: 'GBP/USD', // Different pair
          strategy: 'trend_following', // Same strategy
          side: 'long', // Same side
          status: 'closed'
        },
        {
          ...mockTrade,
          id: 'different-1',
          currencyPair: 'USD/JPY', // Different pair
          strategy: 'scalping', // Different strategy
          side: 'short', // Different side
          status: 'closed'
        },
        {
          ...mockTrade,
          id: 'open-trade',
          status: 'open' // Should be excluded
        }
      ];
    });

    it('should find similar trades based on multiple criteria', () => {
      const similarTrades = service.findSimilarTrades(mockTrade, allTrades);
      
      // Should exclude the trade itself and open trades
      expect(similarTrades).not.toContain(mockTrade);
      expect(similarTrades.find(t => t.status === 'open')).toBeUndefined();
      
      // Should include trades with high similarity
      expect(similarTrades.find(t => t.id === 'similar-1')).toBeDefined();
    });

    it('should limit results to top 10 similar trades', () => {
      // Create 15 similar trades
      const manyTrades = Array.from({ length: 15 }, (_, i) => ({
        ...mockTrade,
        id: `similar-${i}`,
        status: 'closed' as const
      }));

      const similarTrades = service.findSimilarTrades(mockTrade, manyTrades);
      expect(similarTrades.length).toBeLessThanOrEqual(10);
    });
  });

  describe('compareWithSimilar', () => {
    let similarTrades: Trade[];

    beforeEach(() => {
      similarTrades = [
        {
          ...mockTrade,
          id: 'similar-1',
          pnl: 500,
          riskAmount: 500 // R-multiple = 1
        },
        {
          ...mockTrade,
          id: 'similar-2',
          pnl: 750,
          riskAmount: 500 // R-multiple = 1.5
        }
      ];
    });

    it('should compare trade with similar trades', () => {
      const comparison = service.compareWithSimilar(mockTrade, similarTrades);
      
      expect(comparison.similarTrades).toEqual(similarTrades);
      expect(comparison.averagePerformance.rMultiple).toBe(1.25); // (1 + 1.5) / 2
      expect(comparison.percentileRank).toBeGreaterThan(50); // Better than average
    });

    it('should generate outperformance factors', () => {
      const comparison = service.compareWithSimilar(mockTrade, similarTrades);
      expect(comparison.outperformanceFactors.length).toBeGreaterThan(0);
    });

    it('should generate improvement suggestions for poor performance', () => {
      const poorTrade = {
        ...mockTrade,
        pnl: -200,
        riskAmount: 500 // R-multiple = -0.4
      };

      const comparison = service.compareWithSimilar(poorTrade, similarTrades);
      expect(comparison.improvementSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights for excellent performance', () => {
      const excellentTrade = {
        ...mockTrade,
        pnl: 1250,
        riskAmount: 500 // R-multiple = 2.5
      };

      const comparison = service.compareWithSimilar(excellentTrade, [mockTrade]);
      const insights = service.generateInsights(excellentTrade, comparison);
      
      expect(insights.some(insight => 
        insight.includes('Excellent risk-reward execution')
      )).toBe(true);
    });

    it('should generate insights for high efficiency trades', () => {
      const highEfficiencyTrade = {
        ...mockTrade,
        exitPrice: 1.1140 // Very close to take profit
      };

      const comparison = service.compareWithSimilar(highEfficiencyTrade, [mockTrade]);
      const insights = service.generateInsights(highEfficiencyTrade, comparison);
      
      expect(insights.some(insight => 
        insight.includes('High efficiency')
      )).toBe(true);
    });

    it('should generate strategy-specific insights', () => {
      const scalpingTrade = {
        ...mockTrade,
        strategy: 'scalping',
        timeOut: '09:30' // 30 minutes
      };

      const comparison = service.compareWithSimilar(scalpingTrade, [mockTrade]);
      const insights = service.generateInsights(scalpingTrade, comparison);
      
      expect(insights.some(insight => 
        insight.includes('scalping')
      )).toBe(true);
    });
  });

  describe('calculateBenchmarkPerformance', () => {
    it('should calculate benchmark metrics from multiple trades', () => {
      const trades = [
        mockTrade,
        {
          ...mockTrade,
          id: 'trade-2',
          pnl: 500,
          riskAmount: 500
        },
        {
          ...mockTrade,
          id: 'trade-3',
          pnl: 750,
          riskAmount: 500
        }
      ];

      const benchmark = service.calculateBenchmarkPerformance(trades);
      expect(benchmark.rMultiple).toBe(1.5); // (2 + 1 + 1.5) / 3
    });

    it('should handle empty trade array', () => {
      const benchmark = service.calculateBenchmarkPerformance([]);
      expect(benchmark.rMultiple).toBe(0);
      expect(benchmark.returnPercentage).toBe(0);
    });

    it('should only include closed trades', () => {
      const trades = [
        mockTrade,
        {
          ...mockTrade,
          id: 'open-trade',
          status: 'open' as const
        }
      ];

      const benchmark = service.calculateBenchmarkPerformance(trades);
      expect(benchmark.rMultiple).toBe(2); // Only mockTrade should be included
    });
  });
});
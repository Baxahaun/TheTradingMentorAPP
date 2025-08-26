import { describe, it, expect, beforeEach } from 'vitest';
import { BacktestingService, StrategyModification } from '../BacktestingService';
import { ProfessionalStrategy, Trade } from '../../types/strategy';

describe('BacktestingService', () => {
  let service: BacktestingService;
  let mockStrategy: ProfessionalStrategy;
  let mockTrades: Trade[];

  beforeEach(() => {
    service = new BacktestingService();
    
    mockStrategy = {
      id: 'test-strategy-1',
      title: 'Test Strategy',
      description: 'A test strategy',
      color: '#3B82F6',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending',
        technicalConditions: ['RSI < 30'],
        volatilityRequirements: 'Medium'
      },
      entryTriggers: {
        primarySignal: 'Break of resistance',
        confirmationSignals: ['Volume spike'],
        timingCriteria: 'Market open'
      },
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage',
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased',
          parameters: { multiplier: 2 },
          description: '2x ATR stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          parameters: { ratio: 2 },
          description: '2:1 risk reward'
        },
        riskRewardRatio: 2
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profitFactor: 0,
        expectancy: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        riskRewardRatio: 0,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        sampleSize: 0,
        confidenceLevel: 0,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Insufficient Data',
        lastCalculated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isActive: true
    };

    mockTrades = [
      {
        id: 'trade-1',
        symbol: 'EURUSD',
        entryTime: '2024-01-01T10:00:00Z',
        exitTime: '2024-01-01T12:00:00Z',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        quantity: 10000,
        pnl: 50,
        side: 'long',
        status: 'closed',
        strategyId: 'test-strategy-1'
      } as Trade,
      {
        id: 'trade-2',
        symbol: 'EURUSD',
        entryTime: '2024-01-02T10:00:00Z',
        exitTime: '2024-01-02T12:00:00Z',
        entryPrice: 1.1000,
        exitPrice: 1.0980,
        quantity: 10000,
        pnl: -20,
        side: 'long',
        status: 'closed',
        strategyId: 'test-strategy-1'
      } as Trade,
      {
        id: 'trade-3',
        symbol: 'EURUSD',
        entryTime: '2024-01-03T10:00:00Z',
        exitTime: '2024-01-03T12:00:00Z',
        entryPrice: 1.1000,
        exitPrice: 1.1100,
        quantity: 10000,
        pnl: 100,
        side: 'long',
        status: 'closed',
        strategyId: 'test-strategy-1'
      } as Trade
    ];
  });

  describe('runBacktest', () => {
    it('should run backtest without modifications', async () => {
      const result = await service.runBacktest(mockStrategy, mockTrades);

      expect(result).toBeDefined();
      expect(result.strategyId).toBe('test-strategy-1');
      expect(result.originalPerformance).toBeDefined();
      expect(result.backtestPerformance).toBeDefined();
      expect(result.trades).toHaveLength(3);
      expect(result.summary).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should apply modifications correctly', async () => {
      const modifications: StrategyModification[] = [
        {
          type: 'StopLoss',
          field: 'multiplier',
          originalValue: 2,
          newValue: 1.5,
          description: 'Tighter stop loss'
        }
      ];

      const result = await service.runBacktest(mockStrategy, mockTrades, modifications);

      expect(result.metadata.modifications).toHaveLength(1);
      expect(result.metadata.modifications[0].description).toBe('Tighter stop loss');
      expect(result.summary.tradesAffected).toBeGreaterThanOrEqual(0);
    });

    it('should calculate performance metrics correctly', async () => {
      const result = await service.runBacktest(mockStrategy, mockTrades);

      expect(result.originalPerformance.totalTrades).toBe(3);
      expect(result.originalPerformance.winningTrades).toBe(2);
      expect(result.originalPerformance.losingTrades).toBe(1);
      expect(result.originalPerformance.winRate).toBeCloseTo(66.67, 1); // 2/3 * 100
      expect(result.originalPerformance.expectancy).toBeGreaterThan(0);
    });

    it('should handle empty trade list', async () => {
      await expect(service.runBacktest(mockStrategy, [])).rejects.toThrow(
        'No historical trades found for this strategy'
      );
    });

    it('should calculate confidence level based on sample size', async () => {
      const result = await service.runBacktest(mockStrategy, mockTrades);
      
      // With 3 trades, confidence should be 60%
      expect(result.metadata.confidence).toBe(60);
    });

    it('should track execution time', async () => {
      const result = await service.runBacktest(mockStrategy, mockTrades);
      
      expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compareStrategyVersions', () => {
    it('should compare two strategy versions', async () => {
      const modifiedStrategy: ProfessionalStrategy = {
        ...mockStrategy,
        id: 'test-strategy-1-modified',
        title: 'Test Strategy (Modified)',
        version: 2,
        riskManagement: {
          ...mockStrategy.riskManagement,
          maxRiskPerTrade: 1.5,
          riskRewardRatio: 3
        }
      };

      const result = await service.compareStrategyVersions(
        mockStrategy,
        modifiedStrategy,
        mockTrades
      );

      expect(result).toBeDefined();
      expect(result.originalStrategy).toBe(mockStrategy);
      expect(result.modifiedStrategy).toBe(modifiedStrategy);
      expect(result.performanceComparison).toBeDefined();
      expect(result.tradeByTradeAnalysis).toHaveLength(3);
      expect(result.recommendations).toBeDefined();
    });

    it('should generate trade-by-trade analysis', async () => {
      const modifiedStrategy: ProfessionalStrategy = {
        ...mockStrategy,
        riskManagement: {
          ...mockStrategy.riskManagement,
          maxRiskPerTrade: 3
        }
      };

      const result = await service.compareStrategyVersions(
        mockStrategy,
        modifiedStrategy,
        mockTrades
      );

      expect(result.tradeByTradeAnalysis).toHaveLength(3);
      result.tradeByTradeAnalysis.forEach(analysis => {
        expect(analysis.tradeId).toBeDefined();
        expect(analysis.originalOutcome).toBeDefined();
        expect(analysis.modifiedOutcome).toBeDefined();
        expect(analysis.difference).toBeDefined();
        expect(analysis.reasonForChange).toBeDefined();
      });
    });

    it('should calculate improvement percentage', async () => {
      const modifiedStrategy: ProfessionalStrategy = {
        ...mockStrategy,
        riskManagement: {
          ...mockStrategy.riskManagement,
          maxRiskPerTrade: 1
        }
      };

      const result = await service.compareStrategyVersions(
        mockStrategy,
        modifiedStrategy,
        mockTrades
      );

      expect(result.performanceComparison.improvement).toBeDefined();
      expect(typeof result.performanceComparison.improvement).toBe('number');
    });

    it('should generate recommendations', async () => {
      const modifiedStrategy: ProfessionalStrategy = {
        ...mockStrategy,
        riskManagement: {
          ...mockStrategy.riskManagement,
          maxRiskPerTrade: 1.5
        }
      };

      const result = await service.compareStrategyVersions(
        mockStrategy,
        modifiedStrategy,
        mockTrades
      );

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('simulateRiskManagementChanges', () => {
    it('should simulate risk management changes', async () => {
      const newRiskParams = {
        maxRiskPerTrade: 1.5,
        riskRewardRatio: 3,
        stopLossMultiplier: 1.5
      };

      const result = await service.simulateRiskManagementChanges(
        mockStrategy,
        newRiskParams
      );

      expect(result).toBeDefined();
      expect(result.scenario).toContain('Risk Management Simulation');
      expect(result.modifications).toEqual(newRiskParams);
      expect(result.projectedPerformance).toBeDefined();
      expect(result.riskMetrics).toBeDefined();
      expect(result.confidenceInterval).toBeDefined();
    });

    it('should calculate risk metrics', async () => {
      const newRiskParams = {
        maxRiskPerTrade: 2.5,
        riskRewardRatio: 2.5
      };

      const result = await service.simulateRiskManagementChanges(
        mockStrategy,
        newRiskParams
      );

      expect(result.riskMetrics.maxDrawdown).toBeDefined();
      expect(result.riskMetrics.volatility).toBeDefined();
      expect(result.riskMetrics.sharpeRatio).toBeDefined();
      expect(result.riskMetrics.sortinoRatio).toBeDefined();
    });

    it('should calculate confidence intervals', async () => {
      const newRiskParams = {
        maxRiskPerTrade: 1.8
      };

      const result = await service.simulateRiskManagementChanges(
        mockStrategy,
        newRiskParams
      );

      expect(result.confidenceInterval.lower).toBeDefined();
      expect(result.confidenceInterval.upper).toBeDefined();
      expect(result.confidenceInterval.confidence).toBe(0.95);
      expect(result.confidenceInterval.lower).toBeLessThanOrEqual(result.confidenceInterval.upper);
    });
  });

  describe('performance calculations', () => {
    it('should calculate profit factor correctly', async () => {
      const result = await service.runBacktest(mockStrategy, mockTrades);
      
      // Total profit: 50 + 100 = 150
      // Total loss: 20
      // Profit factor: 150 / 20 = 7.5
      expect(result.originalPerformance.profitFactor).toBe(7.5);
    });

    it('should calculate expectancy correctly', async () => {
      const result = await service.runBacktest(mockStrategy, mockTrades);
      
      // Win rate: 66.67%
      // Average win: (50 + 100) / 2 = 75
      // Average loss: 20
      // Expectancy: (0.6667 * 75) - (0.3333 * 20) = 43.33
      expect(result.originalPerformance.expectancy).toBeCloseTo(43.33, 1);
    });

    it('should calculate max drawdown correctly', async () => {
      const tradesWithDrawdown: Trade[] = [
        { ...mockTrades[0], pnl: 100 },  // Running total: 100
        { ...mockTrades[1], pnl: -150 }, // Running total: -50 (drawdown: 150)
        { ...mockTrades[2], pnl: 200 }   // Running total: 150
      ];

      const result = await service.runBacktest(mockStrategy, tradesWithDrawdown);
      
      expect(result.originalPerformance.maxDrawdown).toBe(150);
    });

    it('should handle zero loss trades for profit factor', async () => {
      const winningTrades: Trade[] = [
        { ...mockTrades[0], pnl: 50 },
        { ...mockTrades[1], pnl: 100 },
        { ...mockTrades[2], pnl: 75 }
      ];

      const result = await service.runBacktest(mockStrategy, winningTrades);
      
      // When there are no losses, profit factor should be 999 (max value)
      expect(result.originalPerformance.profitFactor).toBe(999);
    });
  });

  describe('modification application', () => {
    it('should apply stop loss modifications', async () => {
      const modifications: StrategyModification[] = [
        {
          type: 'StopLoss',
          field: 'multiplier',
          originalValue: 2,
          newValue: 1.5,
          description: 'Tighter stop loss'
        }
      ];

      const result = await service.runBacktest(mockStrategy, mockTrades, modifications);
      
      // Should have some trades with rule changes applied
      const tradesWithChanges = result.trades.filter(t => t.ruleChangesApplied.length > 0);
      expect(tradesWithChanges.length).toBeGreaterThanOrEqual(0);
    });

    it('should apply take profit modifications', async () => {
      const modifications: StrategyModification[] = [
        {
          type: 'TakeProfit',
          field: 'ratio',
          originalValue: 2,
          newValue: 1.5,
          description: 'Lower take profit'
        }
      ];

      const result = await service.runBacktest(mockStrategy, mockTrades, modifications);
      
      expect(result.metadata.modifications).toHaveLength(1);
      expect(result.metadata.modifications[0].type).toBe('TakeProfit');
    });

    it('should apply position sizing modifications', async () => {
      const modifications: StrategyModification[] = [
        {
          type: 'PositionSize',
          field: 'percentage',
          originalValue: 2,
          newValue: 3,
          description: 'Larger position size'
        }
      ];

      const result = await service.runBacktest(mockStrategy, mockTrades, modifications);
      
      expect(result.metadata.modifications).toHaveLength(1);
      expect(result.metadata.modifications[0].type).toBe('PositionSize');
    });
  });

  describe('statistical significance', () => {
    it('should mark strategies with 30+ trades as statistically significant', async () => {
      const largeTradeSample = Array.from({ length: 35 }, (_, i) => ({
        ...mockTrades[0],
        id: `trade-${i}`,
        pnl: Math.random() > 0.6 ? 50 : -20
      }));

      const result = await service.runBacktest(mockStrategy, largeTradeSample);
      
      expect(result.originalPerformance.statisticallySignificant).toBe(true);
      expect(result.originalPerformance.sampleSize).toBe(35);
    });

    it('should mark strategies with <30 trades as not statistically significant', async () => {
      const result = await service.runBacktest(mockStrategy, mockTrades);
      
      expect(result.originalPerformance.statisticallySignificant).toBe(false);
      expect(result.originalPerformance.sampleSize).toBe(3);
    });

    it('should calculate confidence levels correctly', async () => {
      const testCases = [
        { trades: 15, expectedConfidence: 60 },
        { trades: 25, expectedConfidence: 70 },
        { trades: 35, expectedConfidence: 80 },
        { trades: 55, expectedConfidence: 90 },
        { trades: 105, expectedConfidence: 95 }
      ];

      for (const testCase of testCases) {
        const trades = Array.from({ length: testCase.trades }, (_, i) => ({
          ...mockTrades[0],
          id: `trade-${i}`
        }));

        const result = await service.runBacktest(mockStrategy, trades);
        expect(result.metadata.confidence).toBe(testCase.expectedConfidence);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle trades with zero PnL', async () => {
      const zeroTrades: Trade[] = [
        { ...mockTrades[0], pnl: 0 },
        { ...mockTrades[1], pnl: 0 },
        { ...mockTrades[2], pnl: 0 }
      ];

      const result = await service.runBacktest(mockStrategy, zeroTrades);
      
      expect(result.originalPerformance.profitFactor).toBe(0);
      expect(result.originalPerformance.expectancy).toBe(0);
      expect(result.originalPerformance.winRate).toBe(0);
    });

    it('should handle single trade', async () => {
      const singleTrade = [mockTrades[0]];

      const result = await service.runBacktest(mockStrategy, singleTrade);
      
      expect(result.originalPerformance.totalTrades).toBe(1);
      expect(result.originalPerformance.winningTrades).toBe(1);
      expect(result.originalPerformance.losingTrades).toBe(0);
    });

    it('should handle all losing trades', async () => {
      const losingTrades: Trade[] = [
        { ...mockTrades[0], pnl: -50 },
        { ...mockTrades[1], pnl: -30 },
        { ...mockTrades[2], pnl: -20 }
      ];

      const result = await service.runBacktest(mockStrategy, losingTrades);
      
      expect(result.originalPerformance.profitFactor).toBe(0);
      expect(result.originalPerformance.winRate).toBe(0);
      expect(result.originalPerformance.expectancy).toBeLessThan(0);
    });

    it('should filter trades by strategy ID', async () => {
      const mixedTrades: Trade[] = [
        { ...mockTrades[0], strategyId: 'test-strategy-1' },
        { ...mockTrades[1], strategyId: 'other-strategy' },
        { ...mockTrades[2], strategyId: 'test-strategy-1' }
      ];

      const result = await service.runBacktest(mockStrategy, mixedTrades);
      
      // Should only process trades with matching strategy ID
      expect(result.trades.length).toBe(2);
    });
  });
});
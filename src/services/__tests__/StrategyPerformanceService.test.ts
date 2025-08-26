/**
 * Comprehensive unit tests for StrategyPerformanceService
 * 
 * Tests cover all major functionality including:
 * - Professional metric calculations (Profit Factor, Expectancy, Sharpe Ratio)
 * - Real-time performance updates
 * - Statistical significance determination
 * - Performance trend analysis
 * - Strategy comparison and ranking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StrategyPerformanceService, createStrategyPerformanceService, validatePerformanceInputs } from '../StrategyPerformanceService';
import { Trade } from '../../types/trade';
import { StrategyPerformance, ProfessionalStrategy } from '../../types/strategy';

describe('StrategyPerformanceService', () => {
  let service: StrategyPerformanceService;
  let mockTrades: Trade[];
  let mockStrategy: ProfessionalStrategy;

  beforeEach(() => {
    service = new StrategyPerformanceService();
    
    // Create mock trades for testing
    mockTrades = [
      {
        id: 'trade-1',
        accountId: 'account-1',
        currencyPair: 'EUR/USD',
        date: '2024-01-15',
        timeIn: '09:00',
        timeOut: '10:30',
        side: 'long',
        entryPrice: 1.0950,
        exitPrice: 1.0980,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        pnl: 300,
        commission: 5,
        status: 'closed',
        accountCurrency: 'USD',
        strategy: 'test-strategy',
        rMultiple: 2.0,
        stopLoss: 1.0930,
        takeProfit: 1.0990,
        timestamp: Date.now()
      },
      {
        id: 'trade-2',
        accountId: 'account-1',
        currencyPair: 'GBP/USD',
        date: '2024-01-16',
        timeIn: '14:00',
        timeOut: '15:45',
        side: 'short',
        entryPrice: 1.2650,
        exitPrice: 1.2620,
        lotSize: 0.5,
        lotType: 'standard',
        units: 50000,
        pnl: 150,
        commission: 3,
        status: 'closed',
        accountCurrency: 'USD',
        strategy: 'test-strategy',
        rMultiple: 1.5,
        stopLoss: 1.2670,
        takeProfit: 1.2620,
        timestamp: Date.now()
      },
      {
        id: 'trade-3',
        accountId: 'account-1',
        currencyPair: 'USD/JPY',
        date: '2024-01-17',
        timeIn: '08:30',
        timeOut: '09:15',
        side: 'long',
        entryPrice: 148.50,
        exitPrice: 148.20,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        pnl: -200,
        commission: 4,
        status: 'closed',
        accountCurrency: 'USD',
        strategy: 'test-strategy',
        rMultiple: -1.0,
        stopLoss: 148.20,
        takeProfit: 149.00,
        timestamp: Date.now()
      },
      {
        id: 'trade-4',
        accountId: 'account-1',
        currencyPair: 'EUR/USD',
        date: '2024-02-01',
        timeIn: '11:00',
        timeOut: '12:30',
        side: 'short',
        entryPrice: 1.0850,
        exitPrice: 1.0800,
        lotSize: 2,
        lotType: 'standard',
        units: 200000,
        pnl: 500,
        commission: 8,
        status: 'closed',
        accountCurrency: 'USD',
        strategy: 'test-strategy',
        rMultiple: 2.5,
        stopLoss: 1.0870,
        takeProfit: 1.0800,
        timestamp: Date.now()
      },
      {
        id: 'trade-5',
        accountId: 'account-1',
        currencyPair: 'GBP/USD',
        date: '2024-02-05',
        timeIn: '13:15',
        timeOut: '14:00',
        side: 'long',
        entryPrice: 1.2580,
        exitPrice: 1.2560,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        pnl: -100,
        commission: 5,
        status: 'closed',
        accountCurrency: 'USD',
        strategy: 'test-strategy',
        rMultiple: -0.8,
        stopLoss: 1.2560,
        takeProfit: 1.2620,
        timestamp: Date.now()
      }
    ];

    // Create mock strategy
    mockStrategy = {
      id: 'test-strategy',
      title: 'Test Strategy',
      description: 'Test strategy for unit tests',
      color: '#3B82F6',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending market',
        technicalConditions: ['Price above 200 EMA'],
        volatilityRequirements: 'Normal volatility'
      },
      entryTriggers: {
        primarySignal: 'Breakout confirmation',
        confirmationSignals: ['Volume spike'],
        timingCriteria: 'London session'
      },
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage',
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased',
          parameters: { atrMultiplier: 2, atrPeriod: 14 },
          description: '2x ATR stop'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          parameters: { ratio: 2 },
          description: '2:1 RR ratio'
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
        confidenceLevel: 95,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Insufficient Data',
        lastCalculated: new Date().toISOString(),
        calculationVersion: 1
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      version: 1,
      isActive: true
    };
  });

  describe('calculateProfessionalMetrics', () => {
    it('should calculate basic metrics correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      expect(performance.totalTrades).toBe(5);
      expect(performance.winningTrades).toBe(3);
      expect(performance.losingTrades).toBe(2);
      expect(performance.winRate).toBe(60); // 3/5 * 100
    });

    it('should calculate profit factor correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      // Gross profit: 300 + 150 + 500 = 950
      // Gross loss: 200 + 100 = 300
      // Profit factor: 950 / 300 = 3.17 (approximately)
      expect(performance.profitFactor).toBeCloseTo(3.17, 1);
    });

    it('should calculate expectancy correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      // Total PnL: 300 + 150 - 200 + 500 - 100 = 650
      // Expectancy: 650 / 5 = 130
      expect(performance.expectancy).toBe(130);
    });

    it('should calculate average win and loss correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      // Average win: (300 + 150 + 500) / 3 = 316.67
      // Average loss: (200 + 100) / 2 = 150
      expect(performance.averageWin).toBeCloseTo(316.67, 1);
      expect(performance.averageLoss).toBe(150);
    });

    it('should calculate risk-reward ratio correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      // Average R-Multiple: (2.0 + 1.5 - 1.0 + 2.5 - 0.8) / 5 = 0.84
      expect(performance.riskRewardRatio).toBeCloseTo(0.84, 1);
    });

    it('should handle empty trades array', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', []);
      
      expect(performance.totalTrades).toBe(0);
      expect(performance.profitFactor).toBe(0);
      expect(performance.expectancy).toBe(0);
      expect(performance.winRate).toBe(0);
    });

    it('should filter trades by strategy ID', () => {
      const mixedTrades = [
        ...mockTrades,
        {
          ...mockTrades[0],
          id: 'other-trade',
          strategy: 'other-strategy',
          pnl: 1000
        }
      ];
      
      const performance = service.calculateProfessionalMetrics('test-strategy', mixedTrades);
      
      // Should only include the 5 original trades, not the other-strategy trade
      expect(performance.totalTrades).toBe(5);
      expect(performance.expectancy).toBe(130); // Same as before
    });
  });

  describe('updatePerformanceMetrics', () => {
    let basePerformance: StrategyPerformance;
    let newTrade: Trade;

    beforeEach(() => {
      basePerformance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      newTrade = {
        id: 'new-trade',
        accountId: 'account-1',
        currencyPair: 'EUR/USD',
        date: '2024-02-10',
        timeIn: '10:00',
        timeOut: '11:00',
        side: 'long',
        entryPrice: 1.0900,
        exitPrice: 1.0950,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        pnl: 250,
        commission: 5,
        status: 'closed',
        accountCurrency: 'USD',
        strategy: 'test-strategy',
        rMultiple: 1.8,
        stopLoss: 1.0870,
        takeProfit: 1.0950,
        timestamp: Date.now()
      };
    });

    it('should update basic metrics correctly', () => {
      const updatedPerformance = service.updatePerformanceMetrics(
        'test-strategy',
        basePerformance,
        newTrade
      );
      
      expect(updatedPerformance.totalTrades).toBe(6);
      expect(updatedPerformance.winningTrades).toBe(4);
      expect(updatedPerformance.losingTrades).toBe(2);
    });

    it('should update expectancy correctly', () => {
      const updatedPerformance = service.updatePerformanceMetrics(
        'test-strategy',
        basePerformance,
        newTrade
      );
      
      // New total PnL: 650 + 250 = 900
      // New expectancy: 900 / 6 = 150
      expect(updatedPerformance.expectancy).toBe(150);
    });

    it('should update win rate correctly', () => {
      const updatedPerformance = service.updatePerformanceMetrics(
        'test-strategy',
        basePerformance,
        newTrade
      );
      
      // New win rate: 4/6 * 100 = 66.67%
      expect(updatedPerformance.winRate).toBeCloseTo(66.67, 1);
    });

    it('should throw error for invalid trade', () => {
      const invalidTrade = { ...newTrade, pnl: undefined };
      
      expect(() => {
        service.updatePerformanceMetrics('test-strategy', basePerformance, invalidTrade as Trade);
      }).toThrow('Invalid trade data for performance update');
    });
  });

  describe('calculateStatisticalSignificance', () => {
    it('should determine significance correctly for sufficient sample size', () => {
      const result = service.calculateStatisticalSignificance(35, 95, 30);
      
      expect(result.isSignificant).toBe(true);
      expect(result.sampleSize).toBe(35);
      expect(result.confidenceLevel).toBe(95);
      expect(result.requiredSampleSize).toBe(30);
      expect(result.confidenceScore).toBe(100); // Capped at 100
    });

    it('should determine significance correctly for insufficient sample size', () => {
      const result = service.calculateStatisticalSignificance(15, 95, 30);
      
      expect(result.isSignificant).toBe(false);
      expect(result.sampleSize).toBe(15);
      expect(result.confidenceScore).toBe(50);
    });

    it('should use default values when not provided', () => {
      const result = service.calculateStatisticalSignificance(40);
      
      expect(result.confidenceLevel).toBe(95);
      expect(result.requiredSampleSize).toBe(30);
      expect(result.isSignificant).toBe(true);
    });
  });

  describe('generatePerformanceTrend', () => {
    it('should identify improving trend', () => {
      const monthlyReturns = [
        { month: '2024-01', return: 100, trades: 5, winRate: 60, profitFactor: 2.0 },
        { month: '2024-02', return: 150, trades: 6, winRate: 65, profitFactor: 2.2 },
        { month: '2024-03', return: 200, trades: 7, winRate: 70, profitFactor: 2.5 },
        { month: '2024-04', return: 250, trades: 8, winRate: 75, profitFactor: 2.8 }
      ];
      
      const trend = service.generatePerformanceTrend(monthlyReturns, 4);
      expect(trend).toBe('Improving');
    });

    it('should identify declining trend', () => {
      const monthlyReturns = [
        { month: '2024-01', return: 250, trades: 8, winRate: 75, profitFactor: 2.8 },
        { month: '2024-02', return: 200, trades: 7, winRate: 70, profitFactor: 2.5 },
        { month: '2024-03', return: 150, trades: 6, winRate: 65, profitFactor: 2.2 },
        { month: '2024-04', return: 100, trades: 5, winRate: 60, profitFactor: 2.0 }
      ];
      
      const trend = service.generatePerformanceTrend(monthlyReturns, 4);
      expect(trend).toBe('Declining');
    });

    it('should identify stable trend', () => {
      const monthlyReturns = [
        { month: '2024-01', return: 150, trades: 6, winRate: 65, profitFactor: 2.2 },
        { month: '2024-02', return: 151, trades: 6, winRate: 66, profitFactor: 2.1 },
        { month: '2024-03', return: 149, trades: 6, winRate: 64, profitFactor: 2.3 },
        { month: '2024-04', return: 150, trades: 6, winRate: 65, profitFactor: 2.2 }
      ];
      
      const trend = service.generatePerformanceTrend(monthlyReturns, 4);
      expect(trend).toBe('Stable');
    });

    it('should return insufficient data for small sample', () => {
      const monthlyReturns = [
        { month: '2024-01', return: 100, trades: 5, winRate: 60, profitFactor: 2.0 },
        { month: '2024-02', return: 150, trades: 6, winRate: 65, profitFactor: 2.2 }
      ];
      
      const trend = service.generatePerformanceTrend(monthlyReturns, 6);
      expect(trend).toBe('Insufficient Data');
    });
  });

  describe('compareStrategies', () => {
    let strategies: ProfessionalStrategy[];

    beforeEach(() => {
      strategies = [
        {
          ...mockStrategy,
          id: 'strategy-1',
          title: 'High Profit Strategy',
          performance: {
            ...mockStrategy.performance,
            totalTrades: 50,
            profitFactor: 3.5,
            expectancy: 200,
            winRate: 70,
            sharpeRatio: 1.8,
            maxDrawdown: 8,
            statisticallySignificant: true
          }
        },
        {
          ...mockStrategy,
          id: 'strategy-2',
          title: 'Moderate Strategy',
          performance: {
            ...mockStrategy.performance,
            totalTrades: 35,
            profitFactor: 2.2,
            expectancy: 120,
            winRate: 55,
            sharpeRatio: 1.2,
            maxDrawdown: 15,
            statisticallySignificant: true
          }
        },
        {
          ...mockStrategy,
          id: 'strategy-3',
          title: 'Poor Strategy',
          performance: {
            ...mockStrategy.performance,
            totalTrades: 20,
            profitFactor: 0.8,
            expectancy: -50,
            winRate: 35,
            sharpeRatio: -0.5,
            maxDrawdown: 25,
            statisticallySignificant: false
          }
        }
      ];
    });

    it('should rank strategies correctly by performance', () => {
      const comparisons = service.compareStrategies(strategies);
      
      expect(comparisons).toHaveLength(3);
      expect(comparisons[0].rank).toBe(1);
      expect(comparisons[0].strategyName).toBe('High Profit Strategy');
      expect(comparisons[1].rank).toBe(2);
      expect(comparisons[1].strategyName).toBe('Moderate Strategy');
      expect(comparisons[2].rank).toBe(3);
      expect(comparisons[2].strategyName).toBe('Poor Strategy');
    });

    it('should calculate composite scores correctly', () => {
      const comparisons = service.compareStrategies(strategies);
      
      // High profit strategy should have highest score
      expect(comparisons[0].score).toBeGreaterThan(comparisons[1].score);
      expect(comparisons[1].score).toBeGreaterThan(comparisons[2].score);
    });

    it('should identify strengths and weaknesses', () => {
      const comparisons = service.compareStrategies(strategies);
      
      // High profit strategy should have strengths
      expect(comparisons[0].strengths.length).toBeGreaterThan(0);
      expect(comparisons[0].strengths.some(s => s.includes('profit factor'))).toBe(true);
      
      // Poor strategy should have weaknesses
      expect(comparisons[2].weaknesses.length).toBeGreaterThan(0);
      expect(comparisons[2].weaknesses.some(w => w.includes('Poor profit factor'))).toBe(true);
    });
  });

  describe('Sharpe Ratio Calculation', () => {
    it('should calculate Sharpe ratio correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      // Should calculate Sharpe ratio for sufficient data
      expect(performance.sharpeRatio).toBeDefined();
      expect(typeof performance.sharpeRatio).toBe('number');
    });

    it('should return undefined for insufficient data', () => {
      const singleTrade = [mockTrades[0]];
      const performance = service.calculateProfessionalMetrics('test-strategy', singleTrade);
      
      expect(performance.sharpeRatio).toBeUndefined();
    });
  });

  describe('Drawdown Calculation', () => {
    it('should calculate maximum drawdown correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      expect(performance.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(performance.maxDrawdownDuration).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero drawdown for all winning trades', () => {
      const winningTrades = mockTrades.map(trade => ({
        ...trade,
        pnl: Math.abs(trade.pnl || 0)
      }));
      
      const performance = service.calculateProfessionalMetrics('test-strategy', winningTrades);
      
      expect(performance.maxDrawdown).toBe(0);
    });
  });

  describe('Monthly Returns Calculation', () => {
    it('should group trades by month correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      expect(performance.monthlyReturns).toHaveLength(2); // January and February
      expect(performance.monthlyReturns[0].month).toBe('2024-01');
      expect(performance.monthlyReturns[1].month).toBe('2024-02');
    });

    it('should calculate monthly metrics correctly', () => {
      const performance = service.calculateProfessionalMetrics('test-strategy', mockTrades);
      
      const januaryReturn = performance.monthlyReturns.find(mr => mr.month === '2024-01');
      expect(januaryReturn).toBeDefined();
      expect(januaryReturn!.trades).toBe(3); // 3 trades in January
      expect(januaryReturn!.return).toBe(250); // 300 + 150 - 200
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle trades with missing PnL', () => {
      const tradesWithMissingPnL = mockTrades.map(trade => ({
        ...trade,
        pnl: undefined
      }));
      
      const performance = service.calculateProfessionalMetrics('test-strategy', tradesWithMissingPnL as Trade[]);
      
      expect(performance.totalTrades).toBe(0); // Should filter out invalid trades
    });

    it('should handle trades with zero PnL', () => {
      const tradesWithZeroPnL = [
        {
          ...mockTrades[0],
          pnl: 0
        }
      ];
      
      const performance = service.calculateProfessionalMetrics('test-strategy', tradesWithZeroPnL);
      
      expect(performance.totalTrades).toBe(1);
      expect(performance.expectancy).toBe(0);
      expect(performance.profitFactor).toBe(0);
    });

    it('should handle very large profit factors', () => {
      const allWinningTrades = mockTrades.map(trade => ({
        ...trade,
        pnl: Math.abs(trade.pnl || 100)
      }));
      
      const performance = service.calculateProfessionalMetrics('test-strategy', allWinningTrades);
      
      expect(performance.profitFactor).toBe(999); // Capped at 999 for all wins
    });
  });
});

describe('Factory Functions and Utilities', () => {
  describe('createStrategyPerformanceService', () => {
    it('should create service with default config', () => {
      const service = createStrategyPerformanceService();
      expect(service).toBeInstanceOf(StrategyPerformanceService);
    });

    it('should create service with custom config', () => {
      const config = {
        riskFreeRate: 0.03,
        confidenceLevel: 99,
        minimumTrades: 50
      };
      
      const service = createStrategyPerformanceService(config);
      expect(service).toBeInstanceOf(StrategyPerformanceService);
    });
  });

  describe('validatePerformanceInputs', () => {
    it('should validate correct inputs', () => {
      const result = validatePerformanceInputs('test-strategy', [
        {
          id: 'trade-1',
          status: 'closed',
          pnl: 100,
          // ... other required fields
        } as Trade
      ]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing strategy ID', () => {
      const result = validatePerformanceInputs('', []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Strategy ID is required');
    });

    it('should detect invalid trades array', () => {
      const result = validatePerformanceInputs('test-strategy', null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trades must be an array');
    });

    it('should detect trades with missing required fields', () => {
      const invalidTrades = [
        { id: '', status: 'open', pnl: undefined } as Trade
      ];
      
      const result = validatePerformanceInputs('test-strategy', invalidTrades);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
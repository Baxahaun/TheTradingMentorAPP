/**
 * Unit tests for strategy data models and interfaces
 */

import { describe, it, expect } from 'vitest';
import {
  ProfessionalStrategy,
  PositionSizingMethod,
  StopLossRule,
  TakeProfitRule,
  StrategyPerformance,
  TradeWithStrategy,
  StrategyDeviation,
  MonthlyReturn,
  METHODOLOGY_TYPES,
  POSITION_SIZING_TYPES,
  STOP_LOSS_TYPES,
  TAKE_PROFIT_TYPES,
  PERFORMANCE_TRENDS,
  DEFAULT_VALIDATION_RULES,
  STATISTICAL_THRESHOLDS
} from '../strategy';

describe('Strategy Data Models', () => {
  describe('ProfessionalStrategy Interface', () => {
    it('should create a valid professional strategy', () => {
      const strategy: ProfessionalStrategy = {
        id: 'strategy-1',
        title: 'Trend Following Strategy',
        description: 'A comprehensive trend following approach',
        color: '#3B82F6',
        methodology: 'Technical',
        primaryTimeframe: '4H',
        assetClasses: ['Forex', 'Indices'],
        setupConditions: {
          marketEnvironment: 'Strong trending market with clear directional bias',
          technicalConditions: [
            'Price above 200 EMA',
            'RSI between 40-60',
            'MACD histogram positive'
          ],
          fundamentalConditions: ['USD strength', 'Risk-on sentiment'],
          volatilityRequirements: 'ATR above 20-period average'
        },
        entryTriggers: {
          primarySignal: 'Bullish engulfing candle at support',
          confirmationSignals: [
            'Volume spike above average',
            'MACD line cross above signal',
            'RSI bounce from oversold'
          ],
          timingCriteria: 'During London or New York session'
        },
        riskManagement: {
          positionSizingMethod: {
            type: 'FixedPercentage',
            parameters: {
              percentage: 2,
              maxPositionSize: 5,
              minPositionSize: 0.5
            }
          },
          maxRiskPerTrade: 2,
          stopLossRule: {
            type: 'ATRBased',
            parameters: {
              atrMultiplier: 2,
              atrPeriod: 14,
              maxStopDistance: 100,
              minStopDistance: 10
            },
            description: '2x ATR stop loss with 10-100 pip limits'
          },
          takeProfitRule: {
            type: 'PartialTargets',
            parameters: {
              targets: [
                { percentage: 50, ratio: 1.5 },
                { percentage: 50, ratio: 3 }
              ]
            },
            description: 'Partial targets at 1.5R and 3R'
          },
          riskRewardRatio: 2
        },
        performance: {
          totalTrades: 150,
          winningTrades: 90,
          losingTrades: 60,
          profitFactor: 1.8,
          expectancy: 75,
          winRate: 60,
          averageWin: 180,
          averageLoss: -100,
          riskRewardRatio: 1.8,
          sharpeRatio: 1.2,
          maxDrawdown: 8.5,
          maxDrawdownDuration: 12,
          sampleSize: 150,
          confidenceLevel: 95,
          statisticallySignificant: true,
          monthlyReturns: [
            { month: '2024-01', return: 5.2, trades: 15, winRate: 66.7, profitFactor: 2.1 },
            { month: '2024-02', return: 3.8, trades: 12, winRate: 58.3, profitFactor: 1.6 }
          ],
          performanceTrend: 'Improving',
          lastCalculated: '2024-03-01T10:00:00Z',
          calculationVersion: 1
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z',
        lastUsed: '2024-02-28T15:30:00Z',
        version: 2,
        isActive: true
      };

      expect(strategy.id).toBe('strategy-1');
      expect(strategy.methodology).toBe('Technical');
      expect(strategy.performance.totalTrades).toBe(150);
      expect(strategy.performance.statisticallySignificant).toBe(true);
      expect(strategy.riskManagement.positionSizingMethod.type).toBe('FixedPercentage');
    });

    it('should support legacy playbook fields for backward compatibility', () => {
      const strategy: ProfessionalStrategy = {
        id: 'legacy-strategy',
        title: 'Legacy Strategy',
        description: 'Migrated from old playbook',
        color: '#EF4444',
        
        // Legacy fields
        marketConditions: 'Trending market',
        entryParameters: 'RSI oversold + MA cross',
        exitParameters: '2:1 RR or support break',
        timesUsed: 25,
        tradesWon: 15,
        tradesLost: 10,
        
        // New required fields
        methodology: 'Technical',
        primaryTimeframe: '1H',
        assetClasses: ['Forex'],
        setupConditions: {
          marketEnvironment: 'Derived from legacy market conditions',
          technicalConditions: ['Derived from legacy entry parameters']
        },
        entryTriggers: {
          primarySignal: 'Derived from legacy entry parameters',
          confirmationSignals: [],
          timingCriteria: 'Any time'
        },
        riskManagement: {
          positionSizingMethod: {
            type: 'FixedPercentage',
            parameters: { percentage: 1 }
          },
          maxRiskPerTrade: 1,
          stopLossRule: {
            type: 'PercentageBased',
            parameters: { percentage: 2 },
            description: 'Default 2% stop'
          },
          takeProfitRule: {
            type: 'RiskRewardRatio',
            parameters: { ratio: 2 },
            description: 'Default 2:1 RR'
          },
          riskRewardRatio: 2
        },
        performance: {
          totalTrades: 25,
          winningTrades: 15,
          losingTrades: 10,
          profitFactor: 1.5,
          expectancy: 20,
          winRate: 60,
          averageWin: 100,
          averageLoss: -50,
          riskRewardRatio: 2,
          maxDrawdown: 5,
          maxDrawdownDuration: 3,
          sampleSize: 25,
          confidenceLevel: 90,
          statisticallySignificant: false,
          monthlyReturns: [],
          performanceTrend: 'Insufficient Data',
          lastCalculated: '2024-01-01T00:00:00Z',
          calculationVersion: 1
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1,
        isActive: true
      };

      expect(strategy.timesUsed).toBe(25);
      expect(strategy.tradesWon).toBe(15);
      expect(strategy.marketConditions).toBe('Trending market');
      expect(strategy.performance.totalTrades).toBe(25);
    });
  });

  describe('PositionSizingMethod Interface', () => {
    it('should create fixed percentage position sizing', () => {
      const method: PositionSizingMethod = {
        type: 'FixedPercentage',
        parameters: {
          percentage: 2.5,
          maxPositionSize: 10,
          minPositionSize: 0.1
        }
      };

      expect(method.type).toBe('FixedPercentage');
      expect(method.parameters.percentage).toBe(2.5);
    });

    it('should create Kelly formula position sizing', () => {
      const method: PositionSizingMethod = {
        type: 'KellyFormula',
        parameters: {
          winRate: 65,
          avgWin: 150,
          avgLoss: -80,
          maxPositionSize: 8,
          minPositionSize: 0.5
        }
      };

      expect(method.type).toBe('KellyFormula');
      expect(method.parameters.winRate).toBe(65);
      expect(method.parameters.avgWin).toBe(150);
      expect(method.parameters.avgLoss).toBe(-80);
    });

    it('should create volatility-based position sizing', () => {
      const method: PositionSizingMethod = {
        type: 'VolatilityBased',
        parameters: {
          atrMultiplier: 1.5,
          atrPeriod: 20,
          maxPositionSize: 5,
          minPositionSize: 0.2
        }
      };

      expect(method.type).toBe('VolatilityBased');
      expect(method.parameters.atrMultiplier).toBe(1.5);
      expect(method.parameters.atrPeriod).toBe(20);
    });
  });

  describe('StopLossRule Interface', () => {
    it('should create ATR-based stop loss', () => {
      const rule: StopLossRule = {
        type: 'ATRBased',
        parameters: {
          atrMultiplier: 2.5,
          atrPeriod: 14,
          maxStopDistance: 150,
          minStopDistance: 15
        },
        description: '2.5x ATR stop loss with 15-150 pip limits'
      };

      expect(rule.type).toBe('ATRBased');
      expect(rule.parameters.atrMultiplier).toBe(2.5);
      expect(rule.description).toContain('2.5x ATR');
    });

    it('should create structure-based stop loss', () => {
      const rule: StopLossRule = {
        type: 'StructureBased',
        parameters: {
          structureType: 'support_resistance',
          buffer: 5,
          maxStopDistance: 100,
          minStopDistance: 10
        },
        description: 'Stop below support with 5 pip buffer'
      };

      expect(rule.type).toBe('StructureBased');
      expect(rule.parameters.structureType).toBe('support_resistance');
      expect(rule.parameters.buffer).toBe(5);
    });
  });

  describe('TakeProfitRule Interface', () => {
    it('should create risk-reward ratio target', () => {
      const rule: TakeProfitRule = {
        type: 'RiskRewardRatio',
        parameters: {
          ratio: 2.5,
          maxTarget: 200,
          minTarget: 20
        },
        description: '2.5:1 risk-reward ratio target'
      };

      expect(rule.type).toBe('RiskRewardRatio');
      expect(rule.parameters.ratio).toBe(2.5);
    });

    it('should create partial targets', () => {
      const rule: TakeProfitRule = {
        type: 'PartialTargets',
        parameters: {
          targets: [
            { percentage: 30, ratio: 1 },
            { percentage: 40, ratio: 2 },
            { percentage: 30, ratio: 4 }
          ],
          maxTarget: 300,
          minTarget: 25
        },
        description: 'Partial targets at 1R, 2R, and 4R'
      };

      expect(rule.type).toBe('PartialTargets');
      expect(rule.parameters.targets).toHaveLength(3);
      expect(rule.parameters.targets![0].percentage).toBe(30);
      expect(rule.parameters.targets![2].ratio).toBe(4);
    });

    it('should create trailing stop', () => {
      const rule: TakeProfitRule = {
        type: 'TrailingStop',
        parameters: {
          trailDistance: 25,
          trailType: 'atr',
          maxTarget: 500,
          minTarget: 30
        },
        description: 'ATR-based trailing stop with 25 pip distance'
      };

      expect(rule.type).toBe('TrailingStop');
      expect(rule.parameters.trailDistance).toBe(25);
      expect(rule.parameters.trailType).toBe('atr');
    });
  });

  describe('StrategyPerformance Interface', () => {
    it('should create comprehensive performance metrics', () => {
      const performance: StrategyPerformance = {
        totalTrades: 200,
        winningTrades: 130,
        losingTrades: 70,
        profitFactor: 2.1,
        expectancy: 85,
        winRate: 65,
        averageWin: 165,
        averageLoss: -95,
        riskRewardRatio: 1.74,
        sharpeRatio: 1.45,
        maxDrawdown: 12.3,
        maxDrawdownDuration: 18,
        sampleSize: 200,
        confidenceLevel: 99,
        statisticallySignificant: true,
        monthlyReturns: [
          { month: '2024-01', return: 8.2, trades: 20, winRate: 70, profitFactor: 2.3 },
          { month: '2024-02', return: 6.1, trades: 18, winRate: 61.1, profitFactor: 1.9 },
          { month: '2024-03', return: 4.8, trades: 16, winRate: 62.5, profitFactor: 2.0 }
        ],
        performanceTrend: 'Stable',
        lastCalculated: '2024-03-31T23:59:59Z',
        calculationVersion: 2
      };

      expect(performance.totalTrades).toBe(200);
      expect(performance.winRate).toBe(65);
      expect(performance.profitFactor).toBe(2.1);
      expect(performance.statisticallySignificant).toBe(true);
      expect(performance.monthlyReturns).toHaveLength(3);
    });

    it('should handle monthly returns correctly', () => {
      const monthlyReturn: MonthlyReturn = {
        month: '2024-06',
        return: 7.5,
        trades: 22,
        winRate: 68.2,
        profitFactor: 2.4
      };

      expect(monthlyReturn.month).toMatch(/^\d{4}-\d{2}$/);
      expect(monthlyReturn.return).toBe(7.5);
      expect(monthlyReturn.trades).toBe(22);
    });
  });

  describe('TradeWithStrategy Interface', () => {
    it('should extend Trade with strategy integration', () => {
      const trade: TradeWithStrategy = {
        // Base Trade fields
        id: 'trade-123',
        accountId: 'account-1',
        currencyPair: 'EUR/USD',
        date: '2024-03-15',
        timeIn: '10:30',
        timeOut: '14:45',
        timestamp: Date.now(),
        side: 'long',
        entryPrice: 1.0850,
        exitPrice: 1.0920,
        lotSize: 1.5,
        lotType: 'standard',
        units: 150000,
        stopLoss: 1.0800,
        takeProfit: 1.0950,
        pips: 70,
        pnl: 1050,
        commission: 7,
        accountCurrency: 'USD',
        status: 'closed',
        
        // Strategy integration fields
        strategyId: 'strategy-trend-1',
        strategyName: 'EUR/USD Trend Following',
        adherenceScore: 92,
        strategyVersion: 3,
        deviations: [
          {
            type: 'EntryTiming',
            planned: '10:00',
            actual: '10:30',
            impact: 'Neutral',
            description: 'Entered 30 minutes later due to news event'
          },
          {
            type: 'PositionSize',
            planned: 1.0,
            actual: 1.5,
            impact: 'Positive',
            description: 'Increased position size due to strong confluence'
          }
        ]
      };

      expect(trade.strategyId).toBe('strategy-trend-1');
      expect(trade.adherenceScore).toBe(92);
      expect(trade.deviations).toHaveLength(2);
      expect(trade.deviations![0].type).toBe('EntryTiming');
      expect(trade.deviations![1].impact).toBe('Positive');
    });

    it('should handle strategy deviations correctly', () => {
      const deviation: StrategyDeviation = {
        type: 'RiskManagement',
        planned: { stopLoss: 1.0800, riskAmount: 200 },
        actual: { stopLoss: 1.0790, riskAmount: 225 },
        impact: 'Negative',
        description: 'Moved stop loss closer and increased risk beyond plan'
      };

      expect(deviation.type).toBe('RiskManagement');
      expect(deviation.impact).toBe('Negative');
      expect(deviation.planned).toHaveProperty('stopLoss');
      expect(deviation.actual).toHaveProperty('riskAmount');
    });
  });

  describe('Constants and Enums', () => {
    it('should have correct methodology types', () => {
      expect(METHODOLOGY_TYPES).toContain('Technical');
      expect(METHODOLOGY_TYPES).toContain('Fundamental');
      expect(METHODOLOGY_TYPES).toContain('Quantitative');
      expect(METHODOLOGY_TYPES).toContain('Hybrid');
      expect(METHODOLOGY_TYPES).toHaveLength(4);
    });

    it('should have correct position sizing types', () => {
      expect(POSITION_SIZING_TYPES).toContain('FixedPercentage');
      expect(POSITION_SIZING_TYPES).toContain('FixedDollar');
      expect(POSITION_SIZING_TYPES).toContain('VolatilityBased');
      expect(POSITION_SIZING_TYPES).toContain('KellyFormula');
      expect(POSITION_SIZING_TYPES).toHaveLength(4);
    });

    it('should have correct stop loss types', () => {
      expect(STOP_LOSS_TYPES).toContain('ATRBased');
      expect(STOP_LOSS_TYPES).toContain('PercentageBased');
      expect(STOP_LOSS_TYPES).toContain('StructureBased');
      expect(STOP_LOSS_TYPES).toContain('VolatilityBased');
      expect(STOP_LOSS_TYPES).toHaveLength(4);
    });

    it('should have correct take profit types', () => {
      expect(TAKE_PROFIT_TYPES).toContain('RiskRewardRatio');
      expect(TAKE_PROFIT_TYPES).toContain('StructureBased');
      expect(TAKE_PROFIT_TYPES).toContain('TrailingStop');
      expect(TAKE_PROFIT_TYPES).toContain('PartialTargets');
      expect(TAKE_PROFIT_TYPES).toHaveLength(4);
    });

    it('should have correct performance trends', () => {
      expect(PERFORMANCE_TRENDS).toContain('Improving');
      expect(PERFORMANCE_TRENDS).toContain('Declining');
      expect(PERFORMANCE_TRENDS).toContain('Stable');
      expect(PERFORMANCE_TRENDS).toContain('Insufficient Data');
      expect(PERFORMANCE_TRENDS).toHaveLength(4);
    });

    it('should have correct default validation rules', () => {
      expect(DEFAULT_VALIDATION_RULES.required.title.minLength).toBe(3);
      expect(DEFAULT_VALIDATION_RULES.businessRules.maxRiskPerTrade.max).toBe(10);
      expect(DEFAULT_VALIDATION_RULES.warnings.insufficientTrades.threshold).toBe(30);
    });

    it('should have correct statistical thresholds', () => {
      expect(STATISTICAL_THRESHOLDS.MINIMUM_TRADES).toBe(30);
      expect(STATISTICAL_THRESHOLDS.DEFAULT_CONFIDENCE).toBe(95);
      expect(STATISTICAL_THRESHOLDS.CONFIDENCE_LEVELS).toContain(90);
      expect(STATISTICAL_THRESHOLDS.CONFIDENCE_LEVELS).toContain(95);
      expect(STATISTICAL_THRESHOLDS.CONFIDENCE_LEVELS).toContain(99);
    });
  });

  describe('Type Safety', () => {
    it('should enforce type safety for methodology', () => {
      // This test ensures TypeScript compilation catches invalid values
      const validMethodology: ProfessionalStrategy['methodology'] = 'Technical';
      expect(validMethodology).toBe('Technical');
      
      // The following would cause TypeScript compilation error:
      // const invalidMethodology: ProfessionalStrategy['methodology'] = 'Invalid';
    });

    it('should enforce type safety for position sizing method', () => {
      const validType: PositionSizingMethod['type'] = 'FixedPercentage';
      expect(validType).toBe('FixedPercentage');
    });

    it('should enforce type safety for performance trend', () => {
      const validTrend: StrategyPerformance['performanceTrend'] = 'Improving';
      expect(validTrend).toBe('Improving');
    });

    it('should enforce type safety for deviation impact', () => {
      const validImpact: StrategyDeviation['impact'] = 'Positive';
      expect(validImpact).toBe('Positive');
    });
  });
});
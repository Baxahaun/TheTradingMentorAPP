/**
 * Unit tests for strategy validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateProfessionalStrategy,
  validatePositionSizingMethod,
  validateStopLossRule,
  validateTakeProfitRule,
  validateStrategyPerformance,
  validateTradeWithStrategy,
  formatValidationErrors,
  hasStatisticalSignificance,
  getValidationSummary
} from '../strategyValidation';
import {
  ProfessionalStrategy,
  PositionSizingMethod,
  StopLossRule,
  TakeProfitRule,
  StrategyPerformance,
  TradeWithStrategy
} from '../strategy';

describe('Strategy Validation', () => {
  describe('validateProfessionalStrategy', () => {
    const validStrategy: Partial<ProfessionalStrategy> = {
      title: 'Test Strategy',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending market with clear directional bias',
        technicalConditions: ['RSI oversold', 'Price above 200 MA'],
        fundamentalConditions: ['USD strength']
      },
      entryTriggers: {
        primarySignal: 'Bullish engulfing candle',
        confirmationSignals: ['Volume spike', 'MACD crossover'],
        timingCriteria: 'During London session'
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
          description: '2x ATR stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          parameters: { ratio: 2 },
          description: '2:1 risk reward ratio'
        },
        riskRewardRatio: 2
      }
    };

    it('should validate a complete valid strategy', () => {
      const result = validateProfessionalStrategy(validStrategy);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require title', () => {
      const strategy = { ...validStrategy, title: '' };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should validate title length', () => {
      const strategy = { ...validStrategy, title: 'AB' }; // Too short
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'title' && e.code === 'MIN_LENGTH')).toBe(true);
    });

    it('should require valid methodology', () => {
      const strategy = { ...validStrategy, methodology: 'Invalid' as any };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'methodology')).toBe(true);
    });

    it('should require setup conditions', () => {
      const strategy = { ...validStrategy, setupConditions: undefined };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'setupConditions')).toBe(true);
    });

    it('should require market environment in setup conditions', () => {
      const strategy = {
        ...validStrategy,
        setupConditions: {
          ...validStrategy.setupConditions!,
          marketEnvironment: 'Short' // Too short
        }
      };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'setupConditions.marketEnvironment')).toBe(true);
    });

    it('should require technical conditions', () => {
      const strategy = {
        ...validStrategy,
        setupConditions: {
          ...validStrategy.setupConditions!,
          technicalConditions: []
        }
      };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'setupConditions.technicalConditions')).toBe(true);
    });

    it('should require entry triggers', () => {
      const strategy = { ...validStrategy, entryTriggers: undefined };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'entryTriggers')).toBe(true);
    });

    it('should warn about missing confirmation signals', () => {
      const strategy = {
        ...validStrategy,
        entryTriggers: {
          ...validStrategy.entryTriggers!,
          confirmationSignals: []
        }
      };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.field === 'entryTriggers.confirmationSignals')).toBe(true);
    });

    it('should require risk management', () => {
      const strategy = { ...validStrategy, riskManagement: undefined };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'riskManagement')).toBe(true);
    });

    it('should validate max risk per trade range', () => {
      const strategy = {
        ...validStrategy,
        riskManagement: {
          ...validStrategy.riskManagement!,
          maxRiskPerTrade: 15 // Too high
        }
      };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'riskManagement.maxRiskPerTrade')).toBe(true);
    });

    it('should warn about high risk per trade', () => {
      const strategy = {
        ...validStrategy,
        riskManagement: {
          ...validStrategy.riskManagement!,
          maxRiskPerTrade: 6 // High but valid
        }
      };
      const result = validateProfessionalStrategy(strategy);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.field === 'riskManagement.maxRiskPerTrade')).toBe(true);
    });
  });

  describe('validatePositionSizingMethod', () => {
    it('should validate fixed percentage method', () => {
      const method: PositionSizingMethod = {
        type: 'FixedPercentage',
        parameters: { percentage: 2 }
      };
      const result = validatePositionSizingMethod(method);
      expect(result.isValid).toBe(true);
    });

    it('should require positive percentage', () => {
      const method: PositionSizingMethod = {
        type: 'FixedPercentage',
        parameters: { percentage: -1 }
      };
      const result = validatePositionSizingMethod(method);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'positionSizingMethod.parameters.percentage')).toBe(true);
    });

    it('should warn about high percentage', () => {
      const method: PositionSizingMethod = {
        type: 'FixedPercentage',
        parameters: { percentage: 15 }
      };
      const result = validatePositionSizingMethod(method);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.field === 'positionSizingMethod.parameters.percentage')).toBe(true);
    });

    it('should validate Kelly formula parameters', () => {
      const method: PositionSizingMethod = {
        type: 'KellyFormula',
        parameters: {
          winRate: 60,
          avgWin: 100,
          avgLoss: -50
        }
      };
      const result = validatePositionSizingMethod(method);
      expect(result.isValid).toBe(true);
    });

    it('should require valid win rate for Kelly formula', () => {
      const method: PositionSizingMethod = {
        type: 'KellyFormula',
        parameters: {
          winRate: 150, // Invalid
          avgWin: 100,
          avgLoss: -50
        }
      };
      const result = validatePositionSizingMethod(method);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'positionSizingMethod.parameters.winRate')).toBe(true);
    });
  });

  describe('validateStopLossRule', () => {
    it('should validate ATR-based stop loss', () => {
      const rule: StopLossRule = {
        type: 'ATRBased',
        parameters: {
          atrMultiplier: 2,
          atrPeriod: 14
        },
        description: '2x ATR stop loss'
      };
      const result = validateStopLossRule(rule);
      expect(result.isValid).toBe(true);
    });

    it('should require description', () => {
      const rule: StopLossRule = {
        type: 'ATRBased',
        parameters: {
          atrMultiplier: 2,
          atrPeriod: 14
        },
        description: ''
      };
      const result = validateStopLossRule(rule);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'stopLossRule.description')).toBe(true);
    });

    it('should require positive ATR parameters', () => {
      const rule: StopLossRule = {
        type: 'ATRBased',
        parameters: {
          atrMultiplier: -1, // Invalid
          atrPeriod: 14
        },
        description: 'ATR stop loss'
      };
      const result = validateStopLossRule(rule);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'stopLossRule.parameters.atrMultiplier')).toBe(true);
    });

    it('should warn about wide percentage stops', () => {
      const rule: StopLossRule = {
        type: 'PercentageBased',
        parameters: {
          percentage: 15 // Very wide
        },
        description: 'Percentage stop loss'
      };
      const result = validateStopLossRule(rule);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.field === 'stopLossRule.parameters.percentage')).toBe(true);
    });
  });

  describe('validateTakeProfitRule', () => {
    it('should validate risk-reward ratio target', () => {
      const rule: TakeProfitRule = {
        type: 'RiskRewardRatio',
        parameters: {
          ratio: 2
        },
        description: '2:1 risk reward'
      };
      const result = validateTakeProfitRule(rule);
      expect(result.isValid).toBe(true);
    });

    it('should warn about low risk-reward ratio', () => {
      const rule: TakeProfitRule = {
        type: 'RiskRewardRatio',
        parameters: {
          ratio: 0.5 // Less than 1:1
        },
        description: 'Low risk reward'
      };
      const result = validateTakeProfitRule(rule);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.field === 'takeProfitRule.parameters.ratio')).toBe(true);
    });

    it('should validate partial targets', () => {
      const rule: TakeProfitRule = {
        type: 'PartialTargets',
        parameters: {
          targets: [
            { percentage: 50, ratio: 1.5 },
            { percentage: 50, ratio: 3 }
          ]
        },
        description: 'Partial targets'
      };
      const result = validateTakeProfitRule(rule);
      expect(result.isValid).toBe(true);
    });

    it('should reject targets exceeding 100%', () => {
      const rule: TakeProfitRule = {
        type: 'PartialTargets',
        parameters: {
          targets: [
            { percentage: 60, ratio: 1.5 },
            { percentage: 60, ratio: 3 } // Total 120%
          ]
        },
        description: 'Invalid partial targets'
      };
      const result = validateTakeProfitRule(rule);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'takeProfitRule.parameters.targets')).toBe(true);
    });
  });

  describe('validateStrategyPerformance', () => {
    const validPerformance: StrategyPerformance = {
      totalTrades: 100,
      winningTrades: 60,
      losingTrades: 40,
      profitFactor: 1.5,
      expectancy: 50,
      winRate: 60,
      averageWin: 150,
      averageLoss: -100,
      riskRewardRatio: 1.5,
      maxDrawdown: 10,
      maxDrawdownDuration: 5,
      sampleSize: 100,
      confidenceLevel: 95,
      statisticallySignificant: true,
      monthlyReturns: [
        { month: '2024-01', return: 5, trades: 10, winRate: 60, profitFactor: 1.5 }
      ],
      performanceTrend: 'Improving',
      lastCalculated: '2024-01-01T00:00:00Z',
      calculationVersion: 1
    };

    it('should validate complete performance data', () => {
      const result = validateStrategyPerformance(validPerformance);
      expect(result.isValid).toBe(true);
    });

    it('should check trade count consistency', () => {
      const performance = {
        ...validPerformance,
        totalTrades: 90 // Inconsistent with winning + losing
      };
      const result = validateStrategyPerformance(performance);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'performance.totalTrades')).toBe(true);
    });

    it('should check win rate consistency', () => {
      const performance = {
        ...validPerformance,
        winRate: 70 // Inconsistent with 60/100
      };
      const result = validateStrategyPerformance(performance);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'performance.winRate')).toBe(true);
    });

    it('should warn about insufficient trades', () => {
      const performance = {
        ...validPerformance,
        totalTrades: 10,
        winningTrades: 6,
        losingTrades: 4,
        sampleSize: 10
      };
      const result = validateStrategyPerformance(performance);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.field === 'performance.totalTrades')).toBe(true);
    });

    it('should validate monthly return format', () => {
      const performance = {
        ...validPerformance,
        monthlyReturns: [
          { month: 'invalid-format', return: 5, trades: 10, winRate: 60, profitFactor: 1.5 }
        ]
      };
      const result = validateStrategyPerformance(performance);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('monthlyReturns'))).toBe(true);
    });
  });

  describe('validateTradeWithStrategy', () => {
    const validTrade: Partial<TradeWithStrategy> = {
      id: 'trade-1',
      strategyId: 'strategy-1',
      strategyName: 'Test Strategy',
      adherenceScore: 85,
      deviations: [
        {
          type: 'PositionSize',
          planned: 1000,
          actual: 1200,
          impact: 'Positive',
          description: 'Increased position size due to strong setup'
        }
      ]
    };

    it('should validate trade with strategy data', () => {
      const result = validateTradeWithStrategy(validTrade);
      expect(result.isValid).toBe(true);
    });

    it('should validate adherence score range', () => {
      const trade = { ...validTrade, adherenceScore: 150 };
      const result = validateTradeWithStrategy(trade);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'adherenceScore')).toBe(true);
    });

    it('should warn about missing strategy name', () => {
      const trade = { ...validTrade, strategyName: undefined };
      const result = validateTradeWithStrategy(trade);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.field === 'strategyName')).toBe(true);
    });

    it('should validate deviation impact values', () => {
      const trade = {
        ...validTrade,
        deviations: [
          {
            type: 'PositionSize',
            planned: 1000,
            actual: 1200,
            impact: 'Invalid' as any,
            description: 'Test deviation'
          }
        ]
      };
      const result = validateTradeWithStrategy(trade);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('deviations') && e.field.includes('impact'))).toBe(true);
    });
  });

  describe('Utility functions', () => {
    it('should format validation errors correctly', () => {
      const result = {
        isValid: false,
        errors: [
          { field: 'title', code: 'REQUIRED', message: 'Title is required', severity: 'error' as const }
        ],
        warnings: [
          { field: 'risk', code: 'HIGH', message: 'Risk is high', severity: 'warning' as const }
        ]
      };
      const formatted = formatValidationErrors(result);
      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toContain('Error in title');
      expect(formatted[1]).toContain('Warning in risk');
    });

    it('should check statistical significance correctly', () => {
      const significantPerformance: StrategyPerformance = {
        totalTrades: 50,
        statisticallySignificant: true,
        winningTrades: 30,
        losingTrades: 20,
        profitFactor: 1.5,
        expectancy: 50,
        winRate: 60,
        averageWin: 150,
        averageLoss: -100,
        riskRewardRatio: 1.5,
        maxDrawdown: 10,
        maxDrawdownDuration: 5,
        sampleSize: 50,
        confidenceLevel: 95,
        monthlyReturns: [],
        performanceTrend: 'Stable',
        lastCalculated: '2024-01-01T00:00:00Z',
        calculationVersion: 1
      };

      expect(hasStatisticalSignificance(significantPerformance)).toBe(true);

      const insufficientPerformance = {
        ...significantPerformance,
        totalTrades: 10,
        sampleSize: 10
      };
      expect(hasStatisticalSignificance(insufficientPerformance)).toBe(false);
    });

    it('should generate validation summary correctly', () => {
      const validResult = { isValid: true, errors: [], warnings: [] };
      expect(getValidationSummary(validResult)).toBe('All validations passed');

      const validWithWarnings = {
        isValid: true,
        errors: [],
        warnings: [{ field: 'test', code: 'TEST', message: 'Test', severity: 'warning' as const }]
      };
      expect(getValidationSummary(validWithWarnings)).toContain('Valid with 1 warning');

      const invalidResult = {
        isValid: false,
        errors: [{ field: 'test', code: 'TEST', message: 'Test', severity: 'error' as const }],
        warnings: []
      };
      expect(getValidationSummary(invalidResult)).toContain('Invalid: 1 error');
    });
  });
});
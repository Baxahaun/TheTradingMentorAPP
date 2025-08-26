/**
 * Unit tests for StrategyValidationService
 */

import { StrategyValidationService } from '../StrategyValidationService';
import {
  ProfessionalStrategy,
  TradeWithStrategy,
  StrategyValidationRules,
  DEFAULT_VALIDATION_RULES
} from '../../types/strategy';

describe('StrategyValidationService', () => {
  let validationService: StrategyValidationService;
  let mockStrategy: ProfessionalStrategy;
  let mockTrade: TradeWithStrategy;

  beforeEach(() => {
    validationService = new StrategyValidationService();
    
    mockStrategy = {
      id: 'test-strategy-1',
      title: 'Test Strategy',
      description: 'A comprehensive test strategy for validation',
      color: '#3B82F6',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending market with clear directional bias',
        technicalConditions: ['RSI oversold/overbought', 'Moving average alignment'],
        fundamentalConditions: [],
        volatilityRequirements: 'Medium to high volatility preferred'
      },
      entryTriggers: {
        primarySignal: 'RSI divergence with price action confirmation',
        confirmationSignals: ['Volume spike', 'Support/resistance break'],
        timingCriteria: 'London/New York session overlap'
      },
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage',
          description: 'Fixed 2% risk per trade',
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased',
          description: '2x ATR stop loss',
          parameters: { atrMultiplier: 2, atrPeriod: 14 }
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          description: '1:2 risk reward ratio',
          parameters: { ratio: 2 }
        },
        riskRewardRatio: 2
      },
      performance: {
        totalTrades: 50,
        winningTrades: 30,
        losingTrades: 20,
        profitFactor: 1.5,
        expectancy: 0.25,
        winRate: 60,
        averageWin: 100,
        averageLoss: -50,
        riskRewardRatio: 2,
        maxDrawdown: 15,
        maxDrawdownDuration: 7,
        sampleSize: 50,
        confidenceLevel: 95,
        statisticallySignificant: true,
        monthlyReturns: [
          { month: '2024-01', return: 5.2 },
          { month: '2024-02', return: -2.1 }
        ],
        performanceTrend: 'Improving',
        lastCalculated: '2024-02-15T10:00:00Z',
        calculationVersion: 1
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-02-15T10:00:00Z',
      lastUsed: '2024-02-14T15:30:00Z',
      version: 1,
      isActive: true
    };

    mockTrade = {
      id: 'trade-1',
      symbol: 'EURUSD',
      side: 'Long',
      entryPrice: 1.1000,
      exitPrice: 1.1100,
      quantity: 10000,
      entryTime: '2024-02-14T09:00:00Z',
      exitTime: '2024-02-14T15:00:00Z',
      pnl: 100,
      status: 'Closed',
      strategyId: 'test-strategy-1',
      strategyName: 'Test Strategy',
      adherenceScore: 85,
      deviations: []
    };
  });

  describe('validateStrategy', () => {
    it('should validate a complete valid strategy', () => {
      const result = validationService.validateStrategy(mockStrategy);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const incompleteStrategy = {
        id: 'test-strategy-1'
        // Missing required fields
      };
      
      const result = validationService.validateStrategy(incompleteStrategy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
      expect(result.errors.some(e => e.field === 'methodology')).toBe(true);
    });

    it('should validate risk management rules', () => {
      const strategyWithInvalidRisk = {
        ...mockStrategy,
        riskManagement: {
          ...mockStrategy.riskManagement,
          maxRiskPerTrade: 15, // Too high
          riskRewardRatio: 0.5 // Too low
        }
      };
      
      const result = validationService.validateStrategy(strategyWithInvalidRisk);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'riskManagement.maxRiskPerTrade')).toBe(true);
      expect(result.errors.some(e => e.field === 'riskManagement.riskRewardRatio')).toBe(true);
    });

    it('should generate warnings for recommended fields', () => {
      const strategyWithMissingOptional = {
        ...mockStrategy,
        assetClasses: [], // Empty array should generate warning
        entryTriggers: {
          ...mockStrategy.entryTriggers,
          confirmationSignals: [] // Empty array should generate warning
        }
      };
      
      const result = validationService.validateStrategy(strategyWithMissingOptional);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.field === 'assetClasses')).toBe(true);
    });
  });

  describe('validateForCreation', () => {
    it('should require ID and creation timestamp for new strategies', () => {
      const newStrategy = {
        ...mockStrategy,
        id: '', // Empty ID
        createdAt: undefined // Missing timestamp
      };
      
      const result = validationService.validateForCreation(newStrategy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'id')).toBe(true);
      expect(result.errors.some(e => e.field === 'createdAt')).toBe(true);
    });

    it('should require professional fields for creation', () => {
      const basicStrategy = {
        id: 'test-strategy-1',
        title: 'Test Strategy',
        description: 'Basic strategy',
        createdAt: '2024-01-01T00:00:00Z'
        // Missing methodology and riskManagement
      };
      
      const result = validationService.validateForCreation(basicStrategy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'methodology')).toBe(true);
      expect(result.errors.some(e => e.field === 'riskManagement')).toBe(true);
    });
  });

  describe('validateForUpdate', () => {
    it('should prevent ID changes', () => {
      const updatedStrategy = {
        ...mockStrategy,
        id: 'different-id' // Changed ID
      };
      
      const result = validationService.validateForUpdate(updatedStrategy, mockStrategy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'id' && e.code === 'IMMUTABLE')).toBe(true);
    });

    it('should warn about performance data regression', () => {
      const updatedStrategy = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance!,
          totalTrades: 30 // Decreased from 50
        }
      };
      
      const result = validationService.validateForUpdate(updatedStrategy, mockStrategy);
      
      expect(result.warnings.some(w => w.code === 'DATA_REGRESSION')).toBe(true);
    });
  });

  describe('validateBusinessRules', () => {
    it('should enforce maximum risk limits', () => {
      const highRiskStrategy = {
        ...mockStrategy,
        riskManagement: {
          ...mockStrategy.riskManagement,
          maxRiskPerTrade: 15 // Exceeds maximum
        }
      };
      
      const result = validationService.validateBusinessRules(highRiskStrategy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'BUSINESS_RULE_VIOLATION')).toBe(true);
    });

    it('should warn about declining performance', () => {
      const decliningStrategy = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance!,
          performanceTrend: 'Declining' as const
        }
      };
      
      const result = validationService.validateBusinessRules(decliningStrategy);
      
      expect(result.warnings.some(w => w.code === 'PERFORMANCE_CONCERN')).toBe(true);
    });

    it('should warn about high drawdown', () => {
      const highDrawdownStrategy = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance!,
          maxDrawdown: 25 // High drawdown
        }
      };
      
      const result = validationService.validateBusinessRules(highDrawdownStrategy);
      
      expect(result.warnings.some(w => w.code === 'HIGH_DRAWDOWN')).toBe(true);
    });
  });

  describe('validateDataIntegrity', () => {
    it('should detect strategy ID mismatches', () => {
      const mismatchedTrade = {
        ...mockTrade,
        strategyId: 'different-strategy-id'
      };
      
      const result = validationService.validateDataIntegrity(mockStrategy, [mismatchedTrade]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'DATA_INCONSISTENCY')).toBe(true);
    });

    it('should detect performance metric mismatches', () => {
      const trades = [
        { ...mockTrade, pnl: 100 }, // Winning trade
        { ...mockTrade, id: 'trade-2', pnl: -50 }, // Losing trade
        { ...mockTrade, id: 'trade-3', pnl: 75 } // Another winning trade
      ];
      
      // Strategy reports different numbers
      const strategyWithWrongMetrics = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance!,
          totalTrades: 5, // Should be 3
          winningTrades: 1, // Should be 2
          losingTrades: 2 // Should be 1
        }
      };
      
      const result = validationService.validateDataIntegrity(strategyWithWrongMetrics, trades);
      
      expect(result.warnings.some(w => w.code === 'METRIC_MISMATCH')).toBe(true);
    });
  });

  describe('validateTradeAssignment', () => {
    it('should validate trade-strategy compatibility', () => {
      const result = validationService.validateTradeAssignment(mockTrade, mockStrategy);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect strategy ID mismatch', () => {
      const mismatchedTrade = {
        ...mockTrade,
        strategyId: 'different-strategy'
      };
      
      const result = validationService.validateTradeAssignment(mismatchedTrade, mockStrategy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'STRATEGY_MISMATCH')).toBe(true);
    });

    it('should warn about low adherence scores', () => {
      const lowAdherenceTrade = {
        ...mockTrade,
        adherenceScore: 30 // Low adherence
      };
      
      const result = validationService.validateTradeAssignment(lowAdherenceTrade, mockStrategy);
      
      expect(result.warnings.some(w => w.code === 'LOW_ADHERENCE')).toBe(true);
    });

    it('should warn about asset class mismatches', () => {
      const stockTrade = {
        ...mockTrade,
        symbol: 'AAPL' // Stock symbol
      };
      
      const forexOnlyStrategy = {
        ...mockStrategy,
        assetClasses: ['Forex'] // Only Forex
      };
      
      const result = validationService.validateTradeAssignment(stockTrade, forexOnlyStrategy);
      
      expect(result.warnings.some(w => w.code === 'ASSET_CLASS_MISMATCH')).toBe(true);
    });
  });

  describe('validateMultipleStrategies', () => {
    it('should validate multiple strategies and provide summary', () => {
      const validStrategy = mockStrategy;
      const invalidStrategy = {
        ...mockStrategy,
        id: 'invalid-strategy',
        title: '', // Invalid title
        methodology: undefined // Missing methodology
      };
      
      const strategies = [validStrategy, invalidStrategy];
      const result = validationService.validateMultipleStrategies(strategies);
      
      expect(result.results).toHaveLength(2);
      expect(result.summary.totalStrategies).toBe(2);
      expect(result.summary.validStrategies).toBe(1);
      expect(result.summary.invalidStrategies).toBe(1);
    });
  });

  describe('validateForDeletion', () => {
    it('should prevent deletion with active trades', () => {
      const activeTrade = {
        ...mockTrade,
        status: 'Open' as const
      };
      
      const result = validationService.validateForDeletion(mockStrategy, [activeTrade]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ACTIVE_DEPENDENCIES')).toBe(true);
    });

    it('should warn about data loss', () => {
      const closedTrades = [
        { ...mockTrade, status: 'Closed' as const },
        { ...mockTrade, id: 'trade-2', status: 'Closed' as const }
      ];
      
      const result = validationService.validateForDeletion(mockStrategy, closedTrades);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'DATA_LOSS_WARNING')).toBe(true);
    });

    it('should warn about significant performance data loss', () => {
      const strategyWithManyTrades = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance!,
          totalTrades: 100 // Significant data
        }
      };
      
      const result = validationService.validateForDeletion(strategyWithManyTrades, []);
      
      expect(result.warnings.some(w => w.code === 'SIGNIFICANT_DATA_LOSS')).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should update validation rules', () => {
      const customRules: Partial<StrategyValidationRules> = {
        businessRules: {
          ...DEFAULT_VALIDATION_RULES.businessRules,
          maxRiskPerTrade: { min: 0.1, max: 5 } // More conservative
        }
      };
      
      validationService.updateValidationRules(customRules);
      const updatedRules = validationService.getValidationRules();
      
      expect(updatedRules.businessRules.maxRiskPerTrade.max).toBe(5);
    });

    it('should check statistical significance', () => {
      expect(validationService.hasStatisticalSignificance(mockStrategy)).toBe(true);
      
      const lowDataStrategy = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance!,
          totalTrades: 10,
          statisticallySignificant: false
        }
      };
      
      expect(validationService.hasStatisticalSignificance(lowDataStrategy)).toBe(false);
    });

    it('should format validation messages', () => {
      const invalidStrategy = {
        id: 'test',
        title: '' // Invalid
      };
      
      const result = validationService.validateStrategy(invalidStrategy);
      const messages = validationService.getValidationMessages(result);
      
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some(m => m.includes('title'))).toBe(true);
    });

    it('should provide validation summary', () => {
      const result = validationService.validateStrategy(mockStrategy);
      const summary = validationService.getValidationSummary(result);
      
      expect(summary).toBe('All validations passed');
    });
  });

  describe('custom validation rules', () => {
    it('should use custom validation rules', () => {
      const customRules: Partial<StrategyValidationRules> = {
        businessRules: {
          ...DEFAULT_VALIDATION_RULES.businessRules,
          maxRiskPerTrade: { min: 0.1, max: 1 } // Very conservative
        }
      };
      
      const customValidationService = new StrategyValidationService(customRules);
      
      const result = customValidationService.validateStrategy(mockStrategy);
      
      // Should fail because mockStrategy has 2% risk (exceeds 1% limit)
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'riskManagement.maxRiskPerTrade')).toBe(true);
    });
  });
});
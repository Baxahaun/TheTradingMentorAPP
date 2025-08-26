/**
 * AI Insights Service Tests
 * 
 * Tests for AI pattern recognition, insights generation, and optimization suggestions
 */

import { AIInsightsService, createAIInsightsService, validateInsightsInputs } from '../AIInsightsService';
import { ProfessionalStrategy, StrategyPerformance } from '../../types/strategy';
import { Trade } from '../../types/trade';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';

// Mock data for testing
const mockStrategy: ProfessionalStrategy = {
  id: 'test-strategy-1',
  title: 'Test Strategy',
  description: 'Test strategy for AI insights',
  color: '#3B82F6',
  methodology: 'Technical',
  primaryTimeframe: '1H',
  assetClasses: ['Forex'],
  setupConditions: {
    marketEnvironment: 'Trending market with clear direction',
    technicalConditions: ['RSI oversold', 'Price above 20 EMA'],
    volatilityRequirements: 'Medium volatility preferred'
  },
  entryTriggers: {
    primarySignal: 'Bullish engulfing candle',
    confirmationSignals: ['Volume spike', 'MACD crossover'],
    timingCriteria: 'Enter on next candle open'
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
  },
  performance: {
    totalTrades: 50,
    winningTrades: 32,
    losingTrades: 18,
    profitFactor: 1.8,
    expectancy: 25.5,
    winRate: 64,
    averageWin: 85.2,
    averageLoss: 42.1,
    riskRewardRatio: 2.02,
    sharpeRatio: 1.2,
    maxDrawdown: 8.5,
    maxDrawdownDuration: 5,
    sampleSize: 50,
    confidenceLevel: 95,
    statisticallySignificant: true,
    monthlyReturns: [],
    performanceTrend: 'Improving',
    lastCalculated: '2024-01-15T10:00:00Z',
    calculationVersion: 1
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  version: 1,
  isActive: true
};

const mockTrades: Trade[] = [
  {
    id: 'trade-1',
    symbol: 'EURUSD',
    type: 'buy',
    quantity: 10000,
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    stopLoss: 1.0980,
    takeProfit: 1.1040,
    date: '2024-01-15T09:00:00Z',
    status: 'closed',
    pnl: 50,
    rMultiple: 2.5,
    strategy: 'test-strategy-1'
  },
  {
    id: 'trade-2',
    symbol: 'GBPUSD',
    type: 'sell',
    quantity: 10000,
    entryPrice: 1.2500,
    exitPrice: 1.2480,
    stopLoss: 1.2520,
    takeProfit: 1.2460,
    date: '2024-01-15T14:00:00Z',
    status: 'closed',
    pnl: 20,
    rMultiple: 1.0,
    strategy: 'test-strategy-1'
  }
];

describe('AIInsightsService', () => {
  let service: AIInsightsService;

  beforeEach(() => {
    service = new AIInsightsService();
  });

  describe('generateStrategyInsights', () => {
    it('should generate insights for strategy with sufficient data', () => {
      const insights = service.generateStrategyInsights(mockStrategy, mockTrades);
      
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should return insufficient data warning for strategies with few trades', () => {
      const fewTrades = mockTrades.slice(0, 1);
      const insights = service.generateStrategyInsights(mockStrategy, fewTrades);
      
      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('Performance');
      expect(insights[0].message).toContain('needs');
      expect(insights[0].message).toContain('more trades');
    });

    it('should generate performance insights for high win rate strategies', () => {
      // Create more trades to meet minimum threshold
      const moreTrades = Array.from({ length: 25 }, (_, i) => ({
        ...mockTrades[0],
        id: `trade-${i + 1}`,
        pnl: i % 4 === 0 ? -20 : 50 // 75% win rate
      }));
      
      const highWinRateStrategy = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance,
          winRate: 75,
          totalTrades: 25
        }
      };
      
      const insights = service.generateStrategyInsights(highWinRateStrategy, moreTrades);
      const performanceInsights = insights.filter(i => i.type === 'Performance');
      
      expect(performanceInsights.length).toBeGreaterThan(0);
      const winRateInsight = performanceInsights.find(i => i.message.includes('win rate'));
      expect(winRateInsight).toBeDefined();
      expect(winRateInsight?.priority).toBe('High');
    });
  });

  describe('identifyPerformancePatterns', () => {
    it('should identify patterns across multiple strategies', () => {
      const strategies = [mockStrategy];
      const patterns = service.identifyPerformancePatterns(strategies);
      
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should return empty array for insufficient data', () => {
      const patterns = service.identifyPerformancePatterns([]);
      
      expect(patterns).toEqual([]);
    });

    it('should filter patterns by significance threshold', () => {
      const strategies = [mockStrategy];
      const patterns = service.identifyPerformancePatterns(strategies);
      
      // All returned patterns should meet significance threshold
      patterns.forEach(pattern => {
        expect(Math.abs(pattern.impact)).toBeGreaterThanOrEqual(30); // Default threshold * 100
      });
    });
  });

  describe('suggestOptimizations', () => {
    it('should generate optimization suggestions', () => {
      const suggestions = service.suggestOptimizations(mockStrategy);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should suggest risk management optimizations for high drawdown', () => {
      const highDrawdownStrategy = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance,
          maxDrawdown: 25
        }
      };
      
      const suggestions = service.suggestOptimizations(highDrawdownStrategy);
      const riskSuggestions = suggestions.filter(s => s.category === 'RiskManagement');
      
      expect(riskSuggestions.length).toBeGreaterThan(0);
      const drawdownSuggestion = riskSuggestions.find(s => s.suggestion.includes('drawdown'));
      expect(drawdownSuggestion).toBeDefined();
    });

    it('should suggest position sizing optimizations for high win rate strategies', () => {
      const highWinRateStrategy = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance,
          winRate: 70,
          maxDrawdown: 8
        }
      };
      
      const suggestions = service.suggestOptimizations(highWinRateStrategy);
      const positionSuggestions = suggestions.filter(s => s.category === 'PositionSizing');
      
      expect(positionSuggestions.length).toBeGreaterThan(0);
    });

    it('should sort suggestions by expected improvement', () => {
      const suggestions = service.suggestOptimizations(mockStrategy);
      
      if (suggestions.length > 1) {
        for (let i = 0; i < suggestions.length - 1; i++) {
          expect(suggestions[i].expectedImprovement).toBeGreaterThanOrEqual(
            suggestions[i + 1].expectedImprovement
          );
        }
      }
    });
  });

  describe('detectMarketConditionCorrelations', () => {
    it('should detect market condition correlations', () => {
      const correlations = service.detectMarketConditionCorrelations('test-strategy-1');
      
      expect(correlations).toBeDefined();
      expect(Array.isArray(correlations)).toBe(true);
    });

    it('should filter correlations by threshold', () => {
      const correlations = service.detectMarketConditionCorrelations('test-strategy-1');
      
      correlations.forEach(correlation => {
        expect(Math.abs(correlation.correlation)).toBeGreaterThanOrEqual(0.5); // Default threshold
      });
    });

    it('should include recommendations for each correlation', () => {
      const correlations = service.detectMarketConditionCorrelations('test-strategy-1');
      
      correlations.forEach(correlation => {
        expect(correlation.recommendations).toBeDefined();
        expect(Array.isArray(correlation.recommendations)).toBe(true);
        expect(correlation.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig = {
        minimumTradesForInsights: 10,
        confidenceThreshold: 80
      };
      
      const customService = new AIInsightsService(customConfig);
      expect(customService).toBeDefined();
    });

    it('should use default configuration when none provided', () => {
      const defaultService = new AIInsightsService();
      expect(defaultService).toBeDefined();
    });
  });

  describe('Factory Functions', () => {
    it('should create service instance via factory function', () => {
      const factoryService = createAIInsightsService();
      expect(factoryService).toBeInstanceOf(AIInsightsService);
    });

    it('should create service with custom config via factory', () => {
      const config = { minimumTradesForInsights: 15 };
      const factoryService = createAIInsightsService(config);
      expect(factoryService).toBeInstanceOf(AIInsightsService);
    });
  });

  describe('Input Validation', () => {
    it('should validate valid inputs', () => {
      const result = validateInsightsInputs(mockStrategy, mockTrades);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid strategy', () => {
      const result = validateInsightsInputs(null as any, mockTrades);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid strategy is required');
    });

    it('should reject invalid trades array', () => {
      const result = validateInsightsInputs(mockStrategy, null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trades must be an array');
    });

    it('should reject empty trades array', () => {
      const result = validateInsightsInputs(mockStrategy, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one trade is required for insights generation');
    });
  });

  describe('Edge Cases', () => {
    it('should handle strategy with no performance data gracefully', () => {
      const strategyWithoutPerformance = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0
        }
      };
      
      const insights = service.generateStrategyInsights(strategyWithoutPerformance, []);
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should handle trades with missing data', () => {
      const incompleteTradesData = [
        {
          ...mockTrades[0],
          pnl: undefined
        }
      ];
      
      const insights = service.generateStrategyInsights(mockStrategy, incompleteTradesData as Trade[]);
      expect(insights).toBeDefined();
    });

    it('should handle extreme performance values', () => {
      const extremeStrategy = {
        ...mockStrategy,
        performance: {
          ...mockStrategy.performance,
          winRate: 100,
          profitFactor: 999,
          maxDrawdown: 0
        }
      };
      
      const insights = service.generateStrategyInsights(extremeStrategy, mockTrades);
      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
    });
  });
});
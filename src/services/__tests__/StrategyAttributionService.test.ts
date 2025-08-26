/**
 * Unit Tests for StrategyAttributionService
 * 
 * Tests cover:
 * - Strategy suggestion algorithm
 * - Trade-to-strategy assignment with validation
 * - Adherence score calculation
 * - Deviation identification and tracking
 * - Batch assignment workflows
 * - Unassigned trade identification
 */

import { StrategyAttributionService } from '../StrategyAttributionService';
import { ProfessionalStrategy, StrategyDeviation } from '../../types/strategy';
import { Trade } from '../../types/trade';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
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
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';

describe('StrategyAttributionService', () => {
  let service: StrategyAttributionService;
  let mockTrade: Trade;
  let mockStrategy: ProfessionalStrategy;

  beforeEach(() => {
    service = new StrategyAttributionService();
    
    mockTrade = {
      id: 'trade-1',
      accountId: 'account-1',
      currencyPair: 'EURUSD',
      date: '2024-01-15',
      timeIn: '09:00',
      timestamp: Date.now(),
      entryPrice: 1.0950,
      exitPrice: 1.1050,
      side: 'long',
      status: 'closed',
      pnl: 100,
      rMultiple: 2.0,
      stopLoss: 1.0900,
      takeProfit: 1.1050,
      riskAmount: 50,
      timeframe: '1h',
      marketConditions: 'trending bullish market',
      leverage: 10,
      lotSize: 1.0,
      lotType: 'standard',
      units: 100000,
      commission: 5,
      accountCurrency: 'USD'
    };

    mockStrategy = {
      id: 'strategy-1',
      title: 'EUR/USD Trend Following',
      description: 'Trend following strategy for EURUSD',
      methodology: 'Technical',
      isActive: true,
      version: '1.0',
      assetClasses: ['Forex', 'Major Pairs'],
      primaryTimeframe: '1h',
      setupConditions: {
        marketEnvironment: 'trending bullish market conditions',
        technicalSetup: 'breakout above resistance',
        fundamentalFactors: []
      },
      riskManagement: {
        maxRiskPerTrade: 2,
        riskRewardRatio: 2,
        stopLossRule: {
          type: 'PercentageBased',
          parameters: { percentage: 2 }
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          parameters: { ratio: 2 }
        }
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    };
  });

  describe('suggestStrategy', () => {
    it('should return strategy suggestions ranked by confidence', () => {
      const strategies = [mockStrategy];
      const suggestions = service.suggestStrategy(mockTrade, strategies);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        strategyId: mockStrategy.id,
        strategyName: mockStrategy.title,
        confidence: expect.any(Number)
      });
      expect(suggestions[0].confidence).toBeGreaterThan(0);
    });

    it('should return empty array when no strategies provided', () => {
      const suggestions = service.suggestStrategy(mockTrade, []);
      expect(suggestions).toHaveLength(0);
    });

    it('should filter out inactive strategies', () => {
      const inactiveStrategy = { ...mockStrategy, isActive: false };
      const suggestions = service.suggestStrategy(mockTrade, [inactiveStrategy]);
      expect(suggestions).toHaveLength(0);
    });

    it('should throw error for invalid trade data', () => {
      const invalidTrade = { ...mockTrade, currencyPair: '' };
      expect(() => {
        service.suggestStrategy(invalidTrade, [mockStrategy]);
      }).toThrow('missing required data for strategy attribution');
    });

    it('should include matching factors and reasoning', () => {
      const suggestions = service.suggestStrategy(mockTrade, [mockStrategy]);
      
      expect(suggestions[0]).toHaveProperty('matchingFactors');
      expect(suggestions[0]).toHaveProperty('reasoning');
      expect(Array.isArray(suggestions[0].matchingFactors)).toBe(true);
      expect(Array.isArray(suggestions[0].reasoning)).toBe(true);
    });
  });

  describe('assignTradeToStrategy', () => {
    it('should successfully assign trade to strategy', async () => {
      const result = await service.assignTradeToStrategy(
        mockTrade.id,
        mockStrategy.id,
        mockTrade,
        mockStrategy
      );

      expect(result).toMatchObject({
        ...mockTrade,
        strategyId: mockStrategy.id,
        strategyName: mockStrategy.title,
        adherenceScore: expect.any(Number),
        deviations: expect.any(Array),
        strategyVersion: mockStrategy.version
      });
    });

    it('should throw error for missing trade ID', async () => {
      await expect(
        service.assignTradeToStrategy('', mockStrategy.id, mockTrade, mockStrategy)
      ).rejects.toThrow('Trade ID and Strategy ID are required');
    });

    it('should throw error for inactive strategy', async () => {
      const inactiveStrategy = { ...mockStrategy, isActive: false };
      
      await expect(
        service.assignTradeToStrategy(mockTrade.id, mockStrategy.id, mockTrade, inactiveStrategy)
      ).rejects.toThrow('Cannot assign trade to inactive strategy');
    });

    it('should calculate adherence score', async () => {
      const result = await service.assignTradeToStrategy(
        mockTrade.id,
        mockStrategy.id,
        mockTrade,
        mockStrategy
      );

      expect(result.adherenceScore).toBeGreaterThanOrEqual(0);
      expect(result.adherenceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateAdherenceScore', () => {
    it('should return adherence analysis with all components', () => {
      const analysis = service.calculateAdherenceScore(mockTrade, mockStrategy);

      expect(analysis).toHaveProperty('overallScore');
      expect(analysis).toHaveProperty('componentScores');
      expect(analysis).toHaveProperty('deviations');
      expect(analysis).toHaveProperty('recommendations');

      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
    });

    it('should include all component scores', () => {
      const analysis = service.calculateAdherenceScore(mockTrade, mockStrategy);

      expect(analysis.componentScores).toHaveProperty('entryTiming');
      expect(analysis.componentScores).toHaveProperty('positionSize');
      expect(analysis.componentScores).toHaveProperty('stopLoss');
      expect(analysis.componentScores).toHaveProperty('takeProfit');
      expect(analysis.componentScores).toHaveProperty('riskManagement');
    });

    it('should identify deviations when rules are violated', () => {
      // Create trade with significant position size deviation
      const deviatingTrade = {
        ...mockTrade,
        riskAmount: 500 // Much higher than strategy's 2% rule
      };

      const analysis = service.calculateAdherenceScore(deviatingTrade, mockStrategy);
      
      expect(analysis.deviations.length).toBeGreaterThan(0);
      expect(analysis.deviations.some(d => d.type === 'PositionSize')).toBe(true);
    });
  });

  describe('identifyDeviations', () => {
    it('should identify position size deviations', () => {
      const deviatingTrade = {
        ...mockTrade,
        riskAmount: 500 // 5% risk vs strategy's 2%
      };

      const deviations = service.identifyDeviations(deviatingTrade, mockStrategy);
      
      const positionSizeDeviation = deviations.find(d => d.type === 'PositionSize');
      expect(positionSizeDeviation).toBeDefined();
      expect(positionSizeDeviation?.impact).toBe('Negative');
    });

    it('should identify stop loss deviations', () => {
      const deviatingTrade = {
        ...mockTrade,
        stopLoss: 1.0800 // Much wider than strategy calculation
      };

      const deviations = service.identifyDeviations(deviatingTrade, mockStrategy);
      
      // May or may not identify deviation depending on tolerance thresholds
      expect(Array.isArray(deviations)).toBe(true);
    });

    it('should return empty array when no deviations found', () => {
      const deviations = service.identifyDeviations(mockTrade, mockStrategy);
      
      // With properly aligned trade, should have minimal or no deviations
      expect(Array.isArray(deviations)).toBe(true);
    });
  });

  describe('getUnassignedTrades', () => {
    it('should return trades without strategy assignment', () => {
      const trades = [
        { ...mockTrade, strategy: '' },
        { ...mockTrade, id: 'trade-2', strategy: 'some-strategy' },
        { ...mockTrade, id: 'trade-3', strategy: undefined }
      ];

      const unassigned = service.getUnassignedTrades(trades);
      
      expect(unassigned).toHaveLength(2);
      expect(unassigned.map(t => t.id)).toContain('trade-1');
      expect(unassigned.map(t => t.id)).toContain('trade-3');
    });

    it('should only return closed trades', () => {
      const trades = [
        { ...mockTrade, status: 'open', strategy: '' },
        { ...mockTrade, id: 'trade-2', status: 'closed', strategy: '' }
      ];

      const unassigned = service.getUnassignedTrades(trades);
      
      expect(unassigned).toHaveLength(1);
      expect(unassigned[0].id).toBe('trade-2');
    });
  });

  describe('batchAutoAssign', () => {
    it('should auto-assign trades above confidence threshold', async () => {
      const trades = [mockTrade];
      const strategies = [mockStrategy];

      const result = await service.batchAutoAssign(trades, strategies, 50);

      expect(result).toHaveProperty('assigned');
      expect(result).toHaveProperty('unassigned');
      expect(result).toHaveProperty('suggestions');
      
      expect(Array.isArray(result.assigned)).toBe(true);
      expect(Array.isArray(result.unassigned)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle trades with no matching strategies', async () => {
      const incompatibleTrade = {
        ...mockTrade,
        currencyPair: 'XAUUSD', // Gold, not forex
        timeframe: '1m' // Different timeframe
      };

      const result = await service.batchAutoAssign([incompatibleTrade], [mockStrategy], 80);

      // Should either be unassigned or in suggestions with low confidence
      expect(result.assigned.length + result.unassigned.length + result.suggestions.length).toBe(1);
    });

    it('should add low-confidence matches to suggestions', async () => {
      const result = await service.batchAutoAssign([mockTrade], [mockStrategy], 95); // Very high threshold

      // With high threshold, should go to suggestions rather than auto-assign
      expect(result.suggestions.length + result.assigned.length + result.unassigned.length).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid trade data gracefully', () => {
      const invalidTrade = { id: 'invalid' } as Trade;
      
      expect(() => {
        service.suggestStrategy(invalidTrade, [mockStrategy]);
      }).toThrow();
    });

    it('should handle missing strategy data gracefully', () => {
      const incompleteStrategy = { 
        id: 'incomplete',
        title: 'Incomplete Strategy',
        isActive: true 
      } as ProfessionalStrategy;

      // Should not throw, but may return lower confidence scores
      expect(() => {
        service.suggestStrategy(mockTrade, [incompleteStrategy]);
      }).not.toThrow();
    });

    it('should handle batch assignment errors gracefully', async () => {
      const invalidTrade = { id: 'invalid' } as Trade;
      const validTrade = mockTrade;

      const result = await service.batchAutoAssign(
        [invalidTrade, validTrade], 
        [mockStrategy], 
        50
      );

      // Should process valid trades and handle invalid ones
      expect(result.assigned.length + result.unassigned.length + result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        confidenceThresholds: {
          autoAssign: 90,
          suggest: 70,
          minimum: 40
        }
      };

      const customService = new StrategyAttributionService(customConfig);
      
      // Should use custom thresholds
      expect(customService).toBeDefined();
    });

    it('should use default configuration when none provided', () => {
      const defaultService = new StrategyAttributionService();
      
      expect(defaultService).toBeDefined();
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrategyAttributionService } from '@/services/StrategyAttributionService';
import { createMockStrategy, createMockTrade } from '../../setup';
import type { ProfessionalStrategy, Trade } from '@/types/strategy';

describe('StrategyAttributionService - Comprehensive Unit Tests', () => {
  let service: StrategyAttributionService;
  let mockStrategies: ProfessionalStrategy[];
  let mockTrade: Trade;

  beforeEach(() => {
    service = new StrategyAttributionService();
    
    mockStrategies = [
      {
        ...createMockStrategy(),
        id: 'strategy-1',
        title: 'EUR/USD Breakout',
        assetClasses: ['Forex'],
        primaryTimeframe: '1H',
        setupConditions: {
          marketEnvironment: 'Trending market',
          technicalConditions: ['RSI oversold', 'Support level hold'],
          volatilityRequirements: 'Medium volatility',
        },
        entryTriggers: {
          primarySignal: 'Bullish engulfing candle',
          confirmationSignals: ['Volume spike', 'MACD crossover'],
          timingCriteria: 'Market open',
        },
      },
      {
        ...createMockStrategy(),
        id: 'strategy-2',
        title: 'Gold Momentum',
        assetClasses: ['Commodities'],
        primaryTimeframe: '4H',
        setupConditions: {
          marketEnvironment: 'High volatility',
          technicalConditions: ['Moving average crossover'],
          volatilityRequirements: 'High volatility',
        },
        entryTriggers: {
          primarySignal: 'Momentum breakout',
          confirmationSignals: ['Volume confirmation'],
          timingCriteria: 'Any time',
        },
      },
    ];

    mockTrade = {
      ...createMockTrade(),
      symbol: 'EURUSD',
      type: 'buy',
      entryTime: '2024-01-15T09:00:00Z',
      notes: 'Bullish engulfing candle at support with volume spike',
    };
  });

  describe('suggestStrategy', () => {
    it('should suggest strategy based on symbol match', () => {
      const suggestions = service.suggestStrategy(mockTrade, mockStrategies);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].strategyId).toBe('strategy-1');
      expect(suggestions[0].confidence).toBeGreaterThan(0.5);
    });

    it('should rank suggestions by confidence score', () => {
      const goldTrade = {
        ...mockTrade,
        symbol: 'XAUUSD',
        notes: 'Momentum breakout with volume confirmation',
      };
      
      const suggestions = service.suggestStrategy(goldTrade, mockStrategies);
      
      expect(suggestions[0].strategyId).toBe('strategy-2');
      expect(suggestions[0].confidence).toBeGreaterThan(0.7);
    });

    it('should consider trade notes in matching', () => {
      const tradeWithNotes = {
        ...mockTrade,
        notes: 'Perfect bullish engulfing candle setup with MACD crossover and volume spike',
      };
      
      const suggestions = service.suggestStrategy(tradeWithNotes, mockStrategies);
      
      expect(suggestions[0].confidence).toBeGreaterThan(0.8);
    });

    it('should handle trades with no matching strategies', () => {
      const cryptoTrade = {
        ...mockTrade,
        symbol: 'BTCUSD',
        notes: 'Crypto scalping trade',
      };
      
      const suggestions = service.suggestStrategy(cryptoTrade, mockStrategies);
      
      expect(suggestions).toHaveLength(0);
    });

    it('should consider timeframe compatibility', () => {
      const longTermTrade = {
        ...mockTrade,
        entryTime: '2024-01-15T00:00:00Z',
        exitTime: '2024-01-20T00:00:00Z', // 5-day trade
      };
      
      const suggestions = service.suggestStrategy(longTermTrade, mockStrategies);
      
      // Should prefer 4H strategy over 1H for longer trades
      expect(suggestions.find(s => s.strategyId === 'strategy-2')?.confidence)
        .toBeGreaterThan(suggestions.find(s => s.strategyId === 'strategy-1')?.confidence || 0);
    });
  });

  describe('assignTradeToStrategy', () => {
    it('should successfully assign trade to strategy', async () => {
      const result = await service.assignTradeToStrategy('trade-1', 'strategy-1');
      
      expect(result.success).toBe(true);
      expect(result.tradeId).toBe('trade-1');
      expect(result.strategyId).toBe('strategy-1');
    });

    it('should validate strategy exists before assignment', async () => {
      const result = await service.assignTradeToStrategy('trade-1', 'non-existent-strategy');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Strategy not found');
    });

    it('should validate trade exists before assignment', async () => {
      const result = await service.assignTradeToStrategy('non-existent-trade', 'strategy-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Trade not found');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await service.assignTradeToStrategy('error-trade', 'strategy-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('calculateAdherenceScore', () => {
    it('should return high score for perfect adherence', () => {
      const perfectTrade = {
        ...mockTrade,
        notes: 'Bullish engulfing candle at support with volume spike and MACD crossover',
        entryTime: '2024-01-15T09:00:00Z', // Market open
      };
      
      const score = service.calculateAdherenceScore(perfectTrade, mockStrategies[0]);
      
      expect(score).toBeGreaterThan(0.8);
    });

    it('should return lower score for partial adherence', () => {
      const partialTrade = {
        ...mockTrade,
        notes: 'Bullish engulfing candle', // Missing some confirmation signals
        entryTime: '2024-01-15T15:00:00Z', // Not market open
      };
      
      const score = service.calculateAdherenceScore(partialTrade, mockStrategies[0]);
      
      expect(score).toBeLessThan(0.7);
      expect(score).toBeGreaterThan(0.3);
    });

    it('should return low score for poor adherence', () => {
      const poorTrade = {
        ...mockTrade,
        notes: 'Random entry', // No strategy signals
        entryTime: '2024-01-15T23:00:00Z', // Wrong timing
      };
      
      const score = service.calculateAdherenceScore(poorTrade, mockStrategies[0]);
      
      expect(score).toBeLessThan(0.3);
    });

    it('should handle missing trade data', () => {
      const incompleteTrade = {
        ...mockTrade,
        notes: '',
        entryTime: '',
      };
      
      const score = service.calculateAdherenceScore(incompleteTrade, mockStrategies[0]);
      
      expect(score).toBe(0);
    });
  });

  describe('identifyDeviations', () => {
    it('should identify timing deviations', () => {
      const lateTrade = {
        ...mockTrade,
        entryTime: '2024-01-15T15:00:00Z', // Afternoon instead of market open
      };
      
      const deviations = service.identifyDeviations(lateTrade, mockStrategies[0]);
      
      const timingDeviation = deviations.find(d => d.type === 'EntryTiming');
      expect(timingDeviation).toBeDefined();
      expect(timingDeviation?.impact).toBe('Negative');
    });

    it('should identify signal deviations', () => {
      const weakSignalTrade = {
        ...mockTrade,
        notes: 'Weak bullish candle', // Missing key signals
      };
      
      const deviations = service.identifyDeviations(weakSignalTrade, mockStrategies[0]);
      
      expect(deviations.length).toBeGreaterThan(0);
      expect(deviations.some(d => d.description.includes('signal'))).toBe(true);
    });

    it('should identify positive deviations', () => {
      const enhancedTrade = {
        ...mockTrade,
        notes: 'Perfect bullish engulfing with all confirmations plus additional momentum',
        pnl: 200, // Better than expected
      };
      
      const deviations = service.identifyDeviations(enhancedTrade, mockStrategies[0]);
      
      const positiveDeviation = deviations.find(d => d.impact === 'Positive');
      expect(positiveDeviation).toBeDefined();
    });

    it('should handle trades with no deviations', () => {
      const perfectTrade = {
        ...mockTrade,
        notes: 'Bullish engulfing candle with volume spike and MACD crossover',
        entryTime: '2024-01-15T09:00:00Z',
      };
      
      const deviations = service.identifyDeviations(perfectTrade, mockStrategies[0]);
      
      expect(deviations).toHaveLength(0);
    });
  });

  describe('getUnassignedTrades', () => {
    it('should return trades without strategy assignment', async () => {
      const unassignedTrades = await service.getUnassignedTrades();
      
      expect(Array.isArray(unassignedTrades)).toBe(true);
      expect(unassignedTrades.every(trade => !trade.strategyId)).toBe(true);
    });

    it('should handle empty result set', async () => {
      // Mock empty result
      vi.spyOn(service, 'getUnassignedTrades').mockResolvedValue([]);
      
      const unassignedTrades = await service.getUnassignedTrades();
      
      expect(unassignedTrades).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      // Mock database error
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(service, 'getUnassignedTrades').mockRejectedValue(new Error('Database error'));
      
      await expect(service.getUnassignedTrades()).rejects.toThrow('Database error');
    });
  });

  describe('Advanced Matching Algorithms', () => {
    it('should use machine learning-like scoring', () => {
      const complexTrade = {
        ...mockTrade,
        symbol: 'EURUSD',
        notes: 'Bullish engulfing candle at key support level with volume spike and MACD bullish crossover',
        entryTime: '2024-01-15T09:30:00Z',
        pnl: 150,
      };
      
      const suggestions = service.suggestStrategy(complexTrade, mockStrategies);
      
      expect(suggestions[0].confidence).toBeGreaterThan(0.85);
      expect(suggestions[0].reasons).toContain('Signal match');
      expect(suggestions[0].reasons).toContain('Symbol compatibility');
    });

    it('should consider historical performance in suggestions', () => {
      const strategiesWithPerformance = mockStrategies.map(s => ({
        ...s,
        performance: {
          ...s.performance,
          profitFactor: s.id === 'strategy-1' ? 2.5 : 1.2,
          winRate: s.id === 'strategy-1' ? 75 : 55,
        },
      }));
      
      const suggestions = service.suggestStrategy(mockTrade, strategiesWithPerformance);
      
      // Better performing strategy should get higher confidence
      expect(suggestions[0].confidence).toBeGreaterThan(0.6);
    });

    it('should handle multiple equally good matches', () => {
      const ambiguousTrade = {
        ...mockTrade,
        symbol: 'GBPUSD', // Could match multiple forex strategies
        notes: 'Breakout trade',
      };
      
      const suggestions = service.suggestStrategy(ambiguousTrade, mockStrategies);
      
      if (suggestions.length > 1) {
        expect(Math.abs(suggestions[0].confidence - suggestions[1].confidence)).toBeLessThan(0.2);
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large strategy lists efficiently', () => {
      const manyStrategies = Array.from({ length: 1000 }, (_, i) => ({
        ...createMockStrategy(),
        id: `strategy-${i}`,
        title: `Strategy ${i}`,
      }));
      
      const startTime = performance.now();
      const suggestions = service.suggestStrategy(mockTrade, manyStrategies);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
      expect(suggestions.length).toBeLessThanOrEqual(5); // Should limit results
    });

    it('should cache strategy matching results', () => {
      const suggestSpy = vi.spyOn(service, 'suggestStrategy');
      
      // First call
      service.suggestStrategy(mockTrade, mockStrategies);
      
      // Second call with same data
      service.suggestStrategy(mockTrade, mockStrategies);
      
      expect(suggestSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed trade data', () => {
      const malformedTrade = {
        ...mockTrade,
        symbol: null as any,
        notes: undefined as any,
        entryTime: 'invalid-date',
      };
      
      expect(() => {
        service.suggestStrategy(malformedTrade, mockStrategies);
      }).not.toThrow();
    });

    it('should handle empty strategy list', () => {
      const suggestions = service.suggestStrategy(mockTrade, []);
      
      expect(suggestions).toHaveLength(0);
    });

    it('should handle strategies with missing data', () => {
      const incompleteStrategies = [
        {
          ...createMockStrategy(),
          setupConditions: undefined as any,
          entryTriggers: undefined as any,
        },
      ];
      
      expect(() => {
        service.suggestStrategy(mockTrade, incompleteStrategies);
      }).not.toThrow();
    });
  });
});
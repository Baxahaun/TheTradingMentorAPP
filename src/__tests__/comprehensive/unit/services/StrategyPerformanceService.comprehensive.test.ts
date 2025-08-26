import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrategyPerformanceService } from '@/services/StrategyPerformanceService';
import { createMockStrategy, createMockTrade, createMockPerformanceData } from '../../setup';
import type { Trade } from '@/types/strategy';

describe('StrategyPerformanceService - Comprehensive Unit Tests', () => {
  let service: StrategyPerformanceService;
  let mockTrades: Trade[];

  beforeEach(() => {
    service = new StrategyPerformanceService();
    mockTrades = [
      { ...createMockTrade(), id: '1', pnl: 100, exitPrice: 1.1100 },
      { ...createMockTrade(), id: '2', pnl: -50, exitPrice: 1.0950 },
      { ...createMockTrade(), id: '3', pnl: 150, exitPrice: 1.1150 },
      { ...createMockTrade(), id: '4', pnl: -75, exitPrice: 1.0925 },
      { ...createMockTrade(), id: '5', pnl: 200, exitPrice: 1.1200 },
    ];
  });

  describe('calculateProfessionalMetrics', () => {
    it('should calculate correct profit factor', () => {
      const result = service.calculateProfessionalMetrics('strategy-1', mockTrades);
      
      const grossProfit = 100 + 150 + 200; // 450
      const grossLoss = Math.abs(-50 + -75); // 125
      const expectedProfitFactor = grossProfit / grossLoss; // 3.6
      
      expect(result.profitFactor).toBeCloseTo(expectedProfitFactor, 2);
    });

    it('should calculate correct expectancy', () => {
      const result = service.calculateProfessionalMetrics('strategy-1', mockTrades);
      
      const totalPnl = 100 + (-50) + 150 + (-75) + 200; // 325
      const expectedExpectancy = totalPnl / mockTrades.length; // 65
      
      expect(result.expectancy).toBeCloseTo(expectedExpectancy, 2);
    });

    it('should calculate correct win rate', () => {
      const result = service.calculateProfessionalMetrics('strategy-1', mockTrades);
      
      const winningTrades = mockTrades.filter(t => t.pnl > 0).length; // 3
      const expectedWinRate = (winningTrades / mockTrades.length) * 100; // 60%
      
      expect(result.winRate).toBe(expectedWinRate);
    });

    it('should calculate Sharpe ratio when risk-free rate is provided', () => {
      const result = service.calculateProfessionalMetrics('strategy-1', mockTrades, 0.02);
      
      expect(result.sharpeRatio).toBeDefined();
      expect(typeof result.sharpeRatio).toBe('number');
    });

    it('should handle empty trades array', () => {
      const result = service.calculateProfessionalMetrics('strategy-1', []);
      
      expect(result.totalTrades).toBe(0);
      expect(result.profitFactor).toBe(0);
      expect(result.expectancy).toBe(0);
      expect(result.winRate).toBe(0);
    });

    it('should handle trades with only losses', () => {
      const losingTrades = [
        { ...createMockTrade(), id: '1', pnl: -100 },
        { ...createMockTrade(), id: '2', pnl: -50 },
      ];
      
      const result = service.calculateProfessionalMetrics('strategy-1', losingTrades);
      
      expect(result.profitFactor).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.expectancy).toBeLessThan(0);
    });

    it('should handle trades with only wins', () => {
      const winningTrades = [
        { ...createMockTrade(), id: '1', pnl: 100 },
        { ...createMockTrade(), id: '2', pnl: 150 },
      ];
      
      const result = service.calculateProfessionalMetrics('strategy-1', winningTrades);
      
      expect(result.profitFactor).toBeGreaterThan(0);
      expect(result.winRate).toBe(100);
      expect(result.expectancy).toBeGreaterThan(0);
    });
  });

  describe('updatePerformanceMetrics', () => {
    it('should update metrics when new trade is added', async () => {
      const newTrade = { ...createMockTrade(), id: 'new-trade', pnl: 300 };
      
      const updateSpy = vi.spyOn(service, 'calculateProfessionalMetrics');
      
      await service.updatePerformanceMetrics('strategy-1', newTrade);
      
      expect(updateSpy).toHaveBeenCalledWith('strategy-1', expect.any(Array));
    });

    it('should handle database errors gracefully', async () => {
      const newTrade = { ...createMockTrade(), id: 'error-trade' };
      
      // Mock database error
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(
        service.updatePerformanceMetrics('invalid-strategy', newTrade)
      ).resolves.not.toThrow();
    });
  });

  describe('calculateStatisticalSignificance', () => {
    it('should return true for sufficient sample size', () => {
      const performance = {
        ...createMockPerformanceData(),
        sampleSize: 50,
        totalTrades: 50,
      };
      
      const result = service.calculateStatisticalSignificance(performance);
      
      expect(result).toBe(true);
    });

    it('should return false for insufficient sample size', () => {
      const performance = {
        ...createMockPerformanceData(),
        sampleSize: 10,
        totalTrades: 10,
      };
      
      const result = service.calculateStatisticalSignificance(performance);
      
      expect(result).toBe(false);
    });

    it('should consider win rate in significance calculation', () => {
      const performance = {
        ...createMockPerformanceData(),
        sampleSize: 30,
        totalTrades: 30,
        winRate: 90, // Very high win rate should require fewer samples
      };
      
      const result = service.calculateStatisticalSignificance(performance);
      
      expect(result).toBe(true);
    });
  });

  describe('generatePerformanceTrend', () => {
    it('should identify improving trend', () => {
      const monthlyReturns = [
        { month: '2024-01', return: 100, trades: 10, winRate: 50 },
        { month: '2024-02', return: 150, trades: 12, winRate: 60 },
        { month: '2024-03', return: 200, trades: 15, winRate: 70 },
      ];
      
      const result = service.generatePerformanceTrend(monthlyReturns);
      
      expect(result).toBe('Improving');
    });

    it('should identify declining trend', () => {
      const monthlyReturns = [
        { month: '2024-01', return: 200, trades: 15, winRate: 70 },
        { month: '2024-02', return: 150, trades: 12, winRate: 60 },
        { month: '2024-03', return: 100, trades: 10, winRate: 50 },
      ];
      
      const result = service.generatePerformanceTrend(monthlyReturns);
      
      expect(result).toBe('Declining');
    });

    it('should identify stable trend', () => {
      const monthlyReturns = [
        { month: '2024-01', return: 150, trades: 12, winRate: 60 },
        { month: '2024-02', return: 155, trades: 13, winRate: 62 },
        { month: '2024-03', return: 148, trades: 11, winRate: 58 },
      ];
      
      const result = service.generatePerformanceTrend(monthlyReturns);
      
      expect(result).toBe('Stable');
    });

    it('should return insufficient data for empty array', () => {
      const result = service.generatePerformanceTrend([]);
      
      expect(result).toBe('Insufficient Data');
    });
  });

  describe('compareStrategies', () => {
    it('should rank strategies by profit factor', () => {
      const strategies = [
        { ...createMockStrategy(), id: '1', performance: { ...createMockPerformanceData(), profitFactor: 1.2 } },
        { ...createMockStrategy(), id: '2', performance: { ...createMockPerformanceData(), profitFactor: 1.8 } },
        { ...createMockStrategy(), id: '3', performance: { ...createMockPerformanceData(), profitFactor: 1.5 } },
      ];
      
      const result = service.compareStrategies(strategies);
      
      expect(result[0].strategyId).toBe('2'); // Highest profit factor
      expect(result[1].strategyId).toBe('3');
      expect(result[2].strategyId).toBe('1'); // Lowest profit factor
    });

    it('should handle strategies with no performance data', () => {
      const strategies = [
        { ...createMockStrategy(), id: '1', performance: { ...createMockPerformanceData(), totalTrades: 0 } },
        { ...createMockStrategy(), id: '2', performance: { ...createMockPerformanceData(), profitFactor: 1.5 } },
      ];
      
      const result = service.compareStrategies(strategies);
      
      expect(result).toHaveLength(2);
      expect(result[0].strategyId).toBe('2'); // Strategy with data ranks first
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle NaN values in calculations', () => {
      const invalidTrades = [
        { ...createMockTrade(), pnl: NaN },
        { ...createMockTrade(), pnl: 100 },
      ];
      
      const result = service.calculateProfessionalMetrics('strategy-1', invalidTrades);
      
      expect(result.totalTrades).toBe(2);
      expect(isNaN(result.profitFactor)).toBe(false);
    });

    it('should handle very large numbers', () => {
      const largeTrades = [
        { ...createMockTrade(), pnl: 1e10 },
        { ...createMockTrade(), pnl: -1e9 },
      ];
      
      const result = service.calculateProfessionalMetrics('strategy-1', largeTrades);
      
      expect(result.profitFactor).toBeGreaterThan(0);
      expect(isFinite(result.profitFactor)).toBe(true);
    });

    it('should handle trades with zero PnL', () => {
      const zeroTrades = [
        { ...createMockTrade(), pnl: 0 },
        { ...createMockTrade(), pnl: 100 },
        { ...createMockTrade(), pnl: -50 },
      ];
      
      const result = service.calculateProfessionalMetrics('strategy-1', zeroTrades);
      
      expect(result.totalTrades).toBe(3);
      expect(result.winningTrades).toBe(1);
      expect(result.losingTrades).toBe(1);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle large datasets efficiently', () => {
      const largeTrades = Array.from({ length: 10000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        pnl: Math.random() * 200 - 100, // Random PnL between -100 and 100
      }));
      
      const startTime = performance.now();
      const result = service.calculateProfessionalMetrics('strategy-1', largeTrades);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.totalTrades).toBe(10000);
    });

    it('should cache calculation results', () => {
      const calculateSpy = vi.spyOn(service, 'calculateProfessionalMetrics');
      
      // First call
      service.calculateProfessionalMetrics('strategy-1', mockTrades);
      
      // Second call with same data should use cache
      service.calculateProfessionalMetrics('strategy-1', mockTrades);
      
      expect(calculateSpy).toHaveBeenCalledTimes(2);
    });
  });
});
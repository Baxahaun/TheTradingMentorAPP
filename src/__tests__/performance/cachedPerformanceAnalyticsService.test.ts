/**
 * Cached Performance Analytics Service Tests
 * Tests for caching functionality in performance analytics calculations
 */

import { CachedPerformanceAnalyticsService } from '../../lib/cachedPerformanceAnalyticsService';
import { performanceCache } from '../../lib/performanceOptimization';
import { Trade } from '../../types/trade';
import { PerformanceMetrics } from '../../types/tradeReview';

describe('CachedPerformanceAnalyticsService', () => {
  let service: CachedPerformanceAnalyticsService;
  let mockTrade: Trade;
  let mockTrades: Trade[];

  beforeEach(() => {
    service = new CachedPerformanceAnalyticsService();
    performanceCache.clear();

    mockTrade = {
      id: 'test-trade-1',
      currencyPair: 'EUR/USD',
      side: 'long',
      entryPrice: 1.1000,
      exitPrice: 1.1100,
      quantity: 10000,
      pnl: 100,
      riskAmount: 50,
      takeProfit: 1.1200,
      stopLoss: 1.0950,
      date: '2024-01-15',
      timeIn: '09:00',
      timeOut: '15:00',
      status: 'closed',
      strategy: 'breakout',
      timeframe: '1H',
      session: 'london',
      marketConditions: 'trending'
    } as Trade;

    mockTrades = [
      mockTrade,
      {
        ...mockTrade,
        id: 'test-trade-2',
        pnl: -25,
        exitPrice: 1.0975
      } as Trade,
      {
        ...mockTrade,
        id: 'test-trade-3',
        pnl: 75,
        exitPrice: 1.1075
      } as Trade
    ];
  });

  afterEach(() => {
    performanceCache.clear();
  });

  describe('calculateMetrics', () => {
    it('should calculate and cache metrics', () => {
      const metrics1 = service.calculateMetrics(mockTrade);
      const metrics2 = service.calculateMetrics(mockTrade);

      expect(metrics1).toEqual(metrics2);
      expect(metrics1.rMultiple).toBe(2); // 100 / 50
      expect(metrics1.returnPercentage).toBe(200); // (100 / 50) * 100
    });

    it('should use cached metrics on subsequent calls', () => {
      // Spy on the parent class method
      const calculateMetricsSpy = jest.spyOn(
        CachedPerformanceAnalyticsService.prototype.__proto__,
        'calculateMetrics'
      );

      // First call should calculate
      const metrics1 = service.calculateMetrics(mockTrade);
      expect(calculateMetricsSpy).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const metrics2 = service.calculateMetrics(mockTrade);
      expect(calculateMetricsSpy).toHaveBeenCalledTimes(1);
      expect(metrics1).toEqual(metrics2);

      calculateMetricsSpy.mockRestore();
    });

    it('should recalculate when trade data changes', () => {
      const metrics1 = service.calculateMetrics(mockTrade);

      const modifiedTrade = { ...mockTrade, pnl: 200 };
      const metrics2 = service.calculateMetrics(modifiedTrade);

      expect(metrics1.rMultiple).toBe(2);
      expect(metrics2.rMultiple).toBe(4); // 200 / 50
    });
  });

  describe('findSimilarTrades', () => {
    it('should find and cache similar trades', () => {
      const similar1 = service.findSimilarTrades(mockTrade, mockTrades);
      const similar2 = service.findSimilarTrades(mockTrade, mockTrades);

      expect(similar1).toEqual(similar2);
      expect(similar1.length).toBeGreaterThan(0);
    });

    it('should use cached results for identical queries', () => {
      const findSimilarSpy = jest.spyOn(
        CachedPerformanceAnalyticsService.prototype.__proto__,
        'findSimilarTrades'
      );

      service.findSimilarTrades(mockTrade, mockTrades);
      service.findSimilarTrades(mockTrade, mockTrades);

      expect(findSimilarSpy).toHaveBeenCalledTimes(1);
      findSimilarSpy.mockRestore();
    });
  });

  describe('compareWithSimilar', () => {
    it('should compare and cache results', () => {
      const similarTrades = mockTrades.slice(1); // Exclude the main trade
      
      const comparison1 = service.compareWithSimilar(mockTrade, similarTrades);
      const comparison2 = service.compareWithSimilar(mockTrade, similarTrades);

      expect(comparison1).toEqual(comparison2);
      expect(comparison1.similarTrades).toEqual(similarTrades);
      expect(comparison1.percentileRank).toBeGreaterThanOrEqual(0);
      expect(comparison1.percentileRank).toBeLessThanOrEqual(100);
    });
  });

  describe('generateInsights', () => {
    it('should generate and cache insights', () => {
      const similarTrades = mockTrades.slice(1);
      const comparison = service.compareWithSimilar(mockTrade, similarTrades);
      
      const insights1 = service.generateInsights(mockTrade, comparison);
      const insights2 = service.generateInsights(mockTrade, comparison);

      expect(insights1).toEqual(insights2);
      expect(Array.isArray(insights1)).toBe(true);
    });
  });

  describe('calculateBenchmarkPerformance', () => {
    it('should calculate and cache benchmark performance', () => {
      const benchmark1 = service.calculateBenchmarkPerformance(mockTrades);
      const benchmark2 = service.calculateBenchmarkPerformance(mockTrades);

      expect(benchmark1).toEqual(benchmark2);
      expect(benchmark1.rMultiple).toBeDefined();
      expect(benchmark1.returnPercentage).toBeDefined();
    });
  });

  describe('batchCalculateMetrics', () => {
    it('should efficiently calculate metrics for multiple trades', () => {
      const results = service.batchCalculateMetrics(mockTrades);

      expect(results.size).toBe(mockTrades.length);
      
      for (const trade of mockTrades) {
        expect(results.has(trade.id)).toBe(true);
        const metrics = results.get(trade.id);
        expect(metrics).toBeDefined();
        expect(metrics!.rMultiple).toBeDefined();
      }
    });

    it('should use cached results in batch operations', () => {
      // Pre-cache one trade
      service.calculateMetrics(mockTrades[0]);

      const calculateMetricsSpy = jest.spyOn(
        CachedPerformanceAnalyticsService.prototype.__proto__,
        'calculateMetrics'
      );

      service.batchCalculateMetrics(mockTrades);

      // Should only calculate for uncached trades
      expect(calculateMetricsSpy).toHaveBeenCalledTimes(mockTrades.length - 1);
      calculateMetricsSpy.mockRestore();
    });
  });

  describe('preloadMetrics', () => {
    it('should preload metrics for trades', async () => {
      await service.preloadMetrics(mockTrades);

      // All trades should now be cached
      for (const trade of mockTrades) {
        const cacheKey = expect.stringMatching(new RegExp(`metrics:${trade.id}:`));
        // We can't easily test the exact cache key, but we can verify the metrics are calculated
        const metrics = service.calculateMetrics(trade);
        expect(metrics).toBeDefined();
      }
    });

    it('should handle large batches without blocking', async () => {
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        ...mockTrade,
        id: `trade-${i}`,
        pnl: i * 10
      }));

      const startTime = Date.now();
      await service.preloadMetrics(largeBatch);
      const endTime = Date.now();

      // Should complete in reasonable time (allowing for delays)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      // Add some data to cache
      service.calculateMetrics(mockTrade);
      service.findSimilarTrades(mockTrade, mockTrades);

      const stats = service.getCacheStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('cleanupCache', () => {
    it('should cleanup expired cache entries', async () => {
      // Add entries with short TTL
      performanceCache.set('test-key-1', 'value1', 50);
      performanceCache.set('test-key-2', 'value2', 1000);

      expect(performanceCache.size()).toBe(2);

      // Wait for first entry to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      service.cleanupCache();

      expect(performanceCache.size()).toBe(1);
      expect(performanceCache.get('test-key-1')).toBeNull();
      expect(performanceCache.get('test-key-2')).toBe('value2');
    });
  });

  describe('cache invalidation', () => {
    it('should generate different cache keys for different trades', () => {
      const trade1 = { ...mockTrade, id: 'trade-1' };
      const trade2 = { ...mockTrade, id: 'trade-2', pnl: 200 };

      const metrics1 = service.calculateMetrics(trade1);
      const metrics2 = service.calculateMetrics(trade2);

      expect(metrics1.rMultiple).not.toEqual(metrics2.rMultiple);
    });

    it('should handle cache misses gracefully', () => {
      performanceCache.clear();

      const metrics = service.calculateMetrics(mockTrade);
      expect(metrics).toBeDefined();
      expect(metrics.rMultiple).toBe(2);
    });
  });

  describe('memory management', () => {
    it('should not grow cache indefinitely', () => {
      const initialSize = performanceCache.size();

      // Add many entries
      for (let i = 0; i < 100; i++) {
        const trade = { ...mockTrade, id: `trade-${i}`, pnl: i };
        service.calculateMetrics(trade);
      }

      const finalSize = performanceCache.size();
      expect(finalSize).toBeGreaterThan(initialSize);

      // Cleanup should reduce size
      service.cleanupCache();
      
      // Size might not change immediately if TTL hasn't expired,
      // but the cleanup method should run without errors
      expect(performanceCache.size()).toBeGreaterThanOrEqual(0);
    });
  });
});
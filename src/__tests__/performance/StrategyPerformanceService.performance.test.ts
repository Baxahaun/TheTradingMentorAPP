/**
 * Performance tests for StrategyPerformanceService with caching
 */

import { StrategyPerformanceService } from '../../services/StrategyPerformanceService';
import { cacheService } from '../../services/CacheService';
import { Trade } from '../../types/trade';
import { performanceMonitor } from '../../services/PerformanceMonitoringService';

// Mock trade data generator
function generateMockTrades(count: number, strategyId: string): Trade[] {
  const trades: Trade[] = [];
  const startDate = new Date('2023-01-01');
  
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const isWin = Math.random() > 0.4; // 60% win rate
    const pnl = isWin ? Math.random() * 1000 + 100 : -(Math.random() * 500 + 50);
    
    trades.push({
      id: `trade-${strategyId}-${i}`,
      strategy: strategyId,
      status: 'closed',
      pnl,
      entryPrice: 100 + Math.random() * 50,
      exitPrice: 100 + Math.random() * 50,
      date: date.toISOString(),
      symbol: 'EURUSD',
      quantity: 1000,
      side: Math.random() > 0.5 ? 'long' : 'short',
      stopLoss: 95,
      takeProfit: 110,
      rMultiple: pnl / 50 // Assuming $50 risk per trade
    });
  }
  
  return trades;
}

describe('StrategyPerformanceService Performance Tests', () => {
  let service: StrategyPerformanceService;
  
  beforeEach(() => {
    service = new StrategyPerformanceService();
    cacheService.clear();
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Calculation Performance', () => {
    test('should calculate metrics for 1000 trades within performance threshold', () => {
      const trades = generateMockTrades(1000, 'strategy-1');
      
      const startTime = performance.now();
      const result = service.calculateProfessionalMetrics('strategy-1', trades);
      const duration = performance.now() - startTime;
      
      // Should complete within 500ms for 1000 trades
      expect(duration).toBeLessThan(500);
      expect(result.totalTrades).toBe(1000);
      
      console.log(`Performance calculation for 1000 trades: ${duration.toFixed(2)}ms`);
    });

    test('should handle large datasets efficiently', () => {
      const trades = generateMockTrades(10000, 'strategy-large');
      
      const startTime = performance.now();
      const result = service.calculateProfessionalMetrics('strategy-large', trades);
      const duration = performance.now() - startTime;
      
      // Should complete within 2 seconds for 10k trades
      expect(duration).toBeLessThan(2000);
      expect(result.totalTrades).toBe(10000);
      
      console.log(`Performance calculation for 10k trades: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Caching Performance', () => {
    test('should demonstrate significant performance improvement with caching', () => {
      const trades = generateMockTrades(5000, 'strategy-cache-test');
      
      // First calculation (no cache)
      const startTime1 = performance.now();
      const result1 = service.calculateProfessionalMetrics('strategy-cache-test', trades);
      const duration1 = performance.now() - startTime1;
      
      // Second calculation (with cache)
      const startTime2 = performance.now();
      const result2 = service.calculateProfessionalMetrics('strategy-cache-test', trades);
      const duration2 = performance.now() - startTime2;
      
      // Cached result should be much faster
      expect(duration2).toBeLessThan(duration1 * 0.1); // At least 10x faster
      expect(result1).toEqual(result2);
      
      console.log(`Caching performance improvement:
        - First calculation: ${duration1.toFixed(2)}ms
        - Cached calculation: ${duration2.toFixed(2)}ms
        - Speedup: ${(duration1 / duration2).toFixed(1)}x`);
    });

    test('should handle cache invalidation efficiently', () => {
      const trades = generateMockTrades(1000, 'strategy-invalidation');
      
      // Initial calculation
      service.calculateProfessionalMetrics('strategy-invalidation', trades);
      
      // Add new trade and measure update performance
      const newTrade = generateMockTrades(1, 'strategy-invalidation')[0];
      newTrade.id = 'new-trade';
      
      const startTime = performance.now();
      const currentPerformance = service.calculateProfessionalMetrics('strategy-invalidation', trades);
      service.updatePerformanceMetrics('strategy-invalidation', currentPerformance, newTrade);
      const duration = performance.now() - startTime;
      
      // Update should be fast
      expect(duration).toBeLessThan(100);
      
      console.log(`Cache invalidation and update: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    test('should not cause memory leaks with repeated calculations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many calculations
      for (let i = 0; i < 100; i++) {
        const trades = generateMockTrades(100, `strategy-memory-${i}`);
        service.calculateProfessionalMetrics(`strategy-memory-${i}`, trades);
        
        // Clear cache periodically to test cleanup
        if (i % 10 === 0) {
          cacheService.clear();
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      
      console.log(`Memory usage after 100 calculations:
        - Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
        - Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
        - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Concurrent Performance', () => {
    test('should handle concurrent calculations efficiently', async () => {
      const strategies = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-strategy-${i}`,
        trades: generateMockTrades(500, `concurrent-strategy-${i}`)
      }));
      
      const startTime = performance.now();
      
      // Run calculations concurrently
      const promises = strategies.map(({ id, trades }) =>
        Promise.resolve(service.calculateProfessionalMetrics(id, trades))
      );
      
      const results = await Promise.all(promises);
      const duration = performance.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000); // 3 seconds for 10 concurrent calculations
      expect(results).toHaveLength(10);
      
      console.log(`Concurrent calculations:
        - 10 strategies with 500 trades each
        - Completed in: ${duration.toFixed(2)}ms
        - Avg per strategy: ${(duration / 10).toFixed(2)}ms`);
    });
  });

  describe('Memoization Performance', () => {
    test('should benefit from memoized calculations', () => {
      const trades = generateMockTrades(1000, 'memoization-test');
      
      // Multiple calculations with same data should be faster due to memoization
      const times: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        service.calculateProfessionalMetrics('memoization-test', trades);
        times.push(performance.now() - startTime);
      }
      
      // Later calculations should be faster due to memoization
      const firstTime = times[0];
      const avgLaterTimes = times.slice(1).reduce((sum, time) => sum + time, 0) / 4;
      
      expect(avgLaterTimes).toBeLessThan(firstTime * 0.5); // At least 2x faster
      
      console.log(`Memoization performance:
        - First calculation: ${firstTime.toFixed(2)}ms
        - Avg subsequent: ${avgLaterTimes.toFixed(2)}ms
        - Speedup: ${(firstTime / avgLaterTimes).toFixed(1)}x`);
    });
  });

  describe('Debouncing Performance', () => {
    test('should efficiently handle rapid updates with debouncing', async () => {
      const trades = generateMockTrades(100, 'debounce-test');
      const performance = service.calculateProfessionalMetrics('debounce-test', trades);
      
      const startTime = performance.now();
      
      // Simulate rapid updates
      const updatePromises = [];
      for (let i = 0; i < 50; i++) {
        const newTrade = generateMockTrades(1, 'debounce-test')[0];
        newTrade.id = `rapid-trade-${i}`;
        
        updatePromises.push(
          Promise.resolve(service.updatePerformanceMetrics('debounce-test', performance, newTrade))
        );
      }
      
      await Promise.all(updatePromises);
      
      // Wait for debounced operations to complete
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const duration = performance.now() - startTime;
      
      // Should handle rapid updates efficiently
      expect(duration).toBeLessThan(1000);
      
      console.log(`Debounced updates performance:
        - 50 rapid updates completed in: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Background Task Performance', () => {
    test('should schedule background tasks without blocking', () => {
      const trades = generateMockTrades(1000, 'background-test');
      
      const startTime = performance.now();
      
      // This should trigger background insights calculation
      service.calculateProfessionalMetrics('background-test', trades);
      
      const duration = performance.now() - startTime;
      
      // Main calculation should not be blocked by background tasks
      expect(duration).toBeLessThan(500);
      
      console.log(`Background task scheduling: ${duration.toFixed(2)}ms`);
    });
  });
});

describe('Performance Monitoring Integration', () => {
  test('should track performance metrics during calculations', () => {
    const service = new StrategyPerformanceService();
    const trades = generateMockTrades(500, 'monitoring-test');
    
    // Clear previous metrics
    performanceMonitor.getStatistics('calculation');
    
    // Perform calculation
    service.calculateProfessionalMetrics('monitoring-test', trades);
    
    // Check that metrics were recorded
    const stats = performanceMonitor.getStatistics('calculation', 10000); // Last 10 seconds
    
    expect(stats).not.toBeNull();
    if (stats) {
      expect(stats.count).toBeGreaterThan(0);
      console.log(`Performance monitoring stats:
        - Operations tracked: ${stats.count}
        - Average time: ${stats.avg.toFixed(2)}ms
        - Max time: ${stats.max.toFixed(2)}ms`);
    }
  });
});
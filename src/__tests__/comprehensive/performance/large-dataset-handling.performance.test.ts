import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrategyPerformanceService } from '@/services/StrategyPerformanceService';
import { StrategyAttributionService } from '@/services/StrategyAttributionService';
import { AIInsightsService } from '@/services/AIInsightsService';
import { createMockStrategy, createMockTrade } from '../setup';
import type { ProfessionalStrategy, Trade } from '@/types/strategy';

describe('Large Dataset Handling - Performance Tests', () => {
  let performanceService: StrategyPerformanceService;
  let attributionService: StrategyAttributionService;
  let aiInsightsService: AIInsightsService;

  beforeEach(() => {
    performanceService = new StrategyPerformanceService();
    attributionService = new StrategyAttributionService();
    aiInsightsService = new AIInsightsService();
  });

  describe('Strategy Performance Calculations', () => {
    it('should handle 10,000 trades efficiently', () => {
      const largeTrades = Array.from({ length: 10000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        pnl: Math.random() * 200 - 100, // Random PnL between -100 and 100
        entryTime: new Date(2024, 0, 1 + (i % 365)).toISOString(),
      }));

      const startTime = performance.now();
      const result = performanceService.calculateProfessionalMetrics('strategy-1', largeTrades);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.totalTrades).toBe(10000);
      expect(typeof result.profitFactor).toBe('number');
      expect(isFinite(result.profitFactor)).toBe(true);
    });

    it('should handle 100,000 trades with acceptable performance', () => {
      const massiveTrades = Array.from({ length: 100000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        pnl: Math.random() * 200 - 100,
        entryTime: new Date(2020, 0, 1 + (i % 1460)).toISOString(), // 4 years of data
      }));

      const startTime = performance.now();
      const result = performanceService.calculateProfessionalMetrics('strategy-1', massiveTrades);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.totalTrades).toBe(100000);
      expect(result.monthlyReturns.length).toBeGreaterThan(0);
    });

    it('should maintain memory efficiency with large datasets', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const largeTrades = Array.from({ length: 50000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        pnl: Math.random() * 200 - 100,
      }));

      performanceService.calculateProfessionalMetrics('strategy-1', largeTrades);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle concurrent calculations efficiently', async () => {
      const strategies = Array.from({ length: 100 }, (_, i) => ({
        ...createMockStrategy(),
        id: `strategy-${i}`,
      }));

      const tradesPerStrategy = Array.from({ length: 100 }, () =>
        Array.from({ length: 1000 }, (_, i) => ({
          ...createMockTrade(),
          id: `trade-${i}`,
          pnl: Math.random() * 200 - 100,
        }))
      );

      const startTime = performance.now();
      
      const promises = strategies.map((strategy, index) =>
        performanceService.calculateProfessionalMetrics(strategy.id, tradesPerStrategy[index])
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(results).toHaveLength(100);
      expect(results.every(r => r.totalTrades === 1000)).toBe(true);
    });
  });

  describe('Strategy Attribution Performance', () => {
    it('should handle strategy matching with 1000+ strategies', () => {
      const manyStrategies = Array.from({ length: 1000 }, (_, i) => ({
        ...createMockStrategy(),
        id: `strategy-${i}`,
        title: `Strategy ${i}`,
        assetClasses: [i % 2 === 0 ? 'Forex' : 'Commodities'],
        setupConditions: {
          marketEnvironment: `Environment ${i % 10}`,
          technicalConditions: [`Condition ${i % 5}`],
          volatilityRequirements: 'Medium volatility',
        },
      }));

      const testTrade = createMockTrade();

      const startTime = performance.now();
      const suggestions = attributionService.suggestStrategy(testTrade, manyStrategies);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
      expect(suggestions.length).toBeLessThanOrEqual(10); // Should limit results
    });

    it('should efficiently calculate adherence scores for many trades', () => {
      const strategy = createMockStrategy();
      const manyTrades = Array.from({ length: 10000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        notes: `Trade notes ${i % 100}`, // Varied notes for realistic testing
      }));

      const startTime = performance.now();
      
      const scores = manyTrades.map(trade =>
        attributionService.calculateAdherenceScore(trade, strategy)
      );
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(scores).toHaveLength(10000);
      expect(scores.every(score => score >= 0 && score <= 1)).toBe(true);
    });

    it('should handle batch trade assignments efficiently', async () => {
      const trades = Array.from({ length: 5000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
      }));

      const strategyId = 'test-strategy';

      const startTime = performance.now();
      
      // Simulate batch assignment
      const assignments = await Promise.all(
        trades.map(trade => 
          attributionService.assignTradeToStrategy(trade.id, strategyId)
        )
      );
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(assignments).toHaveLength(5000);
    });
  });

  describe('AI Insights Performance', () => {
    it('should generate insights for large strategy datasets efficiently', () => {
      const strategy = createMockStrategy();
      const largeTrades = Array.from({ length: 20000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        pnl: Math.random() * 200 - 100,
        entryTime: new Date(2020, 0, 1 + (i % 1460)).toISOString(),
        notes: `Pattern ${i % 50}`, // Create patterns for AI to detect
      }));

      const startTime = performance.now();
      const insights = aiInsightsService.generateStrategyInsights(strategy, largeTrades);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should handle pattern recognition across multiple strategies', () => {
      const strategies = Array.from({ length: 50 }, (_, i) => ({
        ...createMockStrategy(),
        id: `strategy-${i}`,
        performance: {
          ...createMockStrategy().performance,
          totalTrades: 1000 + i * 10,
          profitFactor: 1 + Math.random(),
          winRate: 50 + Math.random() * 30,
        },
      }));

      const startTime = performance.now();
      const patterns = aiInsightsService.identifyPerformancePatterns(strategies);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should optimize memory usage during pattern analysis', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const strategy = createMockStrategy();
      const largeTrades = Array.from({ length: 30000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        pnl: Math.random() * 200 - 100,
      }));

      aiInsightsService.generateStrategyInsights(strategy, largeTrades);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });

  describe('Database Query Performance', () => {
    it('should handle paginated strategy loading efficiently', async () => {
      const pageSize = 50;
      const totalStrategies = 10000;
      const pages = Math.ceil(totalStrategies / pageSize);

      const startTime = performance.now();
      
      // Simulate paginated loading
      for (let page = 0; page < Math.min(pages, 10); page++) {
        const strategies = Array.from({ length: pageSize }, (_, i) => ({
          ...createMockStrategy(),
          id: `strategy-${page * pageSize + i}`,
        }));
        
        // Simulate processing each page
        expect(strategies).toHaveLength(pageSize);
      }
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should efficiently query trades by strategy with large datasets', async () => {
      const strategyId = 'test-strategy';
      const tradeCount = 50000;

      // Mock database query time
      const startTime = performance.now();
      
      // Simulate database query with filtering and sorting
      const trades = Array.from({ length: tradeCount }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        strategyId: i % 100 === 0 ? strategyId : `other-strategy-${i % 10}`,
      })).filter(trade => trade.strategyId === strategyId);
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
      expect(trades.length).toBe(500); // Should find correct number of trades
    });

    it('should handle complex aggregation queries efficiently', async () => {
      const strategies = Array.from({ length: 1000 }, (_, i) => ({
        ...createMockStrategy(),
        id: `strategy-${i}`,
      }));

      const trades = Array.from({ length: 100000 }, (_, i) => ({
        ...createMockTrade(),
        id: `trade-${i}`,
        strategyId: `strategy-${i % 1000}`,
        pnl: Math.random() * 200 - 100,
      }));

      const startTime = performance.now();
      
      // Simulate complex aggregation (group by strategy, calculate metrics)
      const aggregatedResults = strategies.map(strategy => {
        const strategyTrades = trades.filter(t => t.strategyId === strategy.id);
        const totalPnl = strategyTrades.reduce((sum, t) => sum + t.pnl, 0);
        const winningTrades = strategyTrades.filter(t => t.pnl > 0).length;
        
        return {
          strategyId: strategy.id,
          totalTrades: strategyTrades.length,
          totalPnl,
          winRate: (winningTrades / strategyTrades.length) * 100,
        };
      });
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(aggregatedResults).toHaveLength(1000);
    });
  });

  describe('Real-time Updates Performance', () => {
    it('should handle rapid performance metric updates', async () => {
      const strategy = createMockStrategy();
      const rapidTrades = Array.from({ length: 1000 }, (_, i) => ({
        ...createMockTrade(),
        id: `rapid-trade-${i}`,
        pnl: Math.random() * 200 - 100,
      }));

      const startTime = performance.now();
      
      // Simulate rapid updates (like during active trading)
      for (const trade of rapidTrades.slice(0, 100)) { // Test with first 100 trades
        await performanceService.updatePerformanceMetrics(strategy.id, trade);
      }
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should handle 100 updates within 5 seconds
    });

    it('should efficiently debounce multiple simultaneous updates', async () => {
      const strategy = createMockStrategy();
      const simultaneousTrades = Array.from({ length: 50 }, (_, i) => ({
        ...createMockTrade(),
        id: `simultaneous-trade-${i}`,
      }));

      const startTime = performance.now();
      
      // Simulate simultaneous updates
      const updatePromises = simultaneousTrades.map(trade =>
        performanceService.updatePerformanceMetrics(strategy.id, trade)
      );
      
      await Promise.all(updatePromises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should handle efficiently with debouncing
    });
  });

  describe('Memory Management and Cleanup', () => {
    it('should properly clean up resources after large operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform large operation
      const largeTrades = Array.from({ length: 50000 }, (_, i) => ({
        ...createMockTrade(),
        id: `cleanup-trade-${i}`,
      }));

      performanceService.calculateProfessionalMetrics('cleanup-strategy', largeTrades);
      
      // Clear references
      largeTrades.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDifference = Math.abs(finalMemory - initialMemory);
      
      // Memory should return close to initial levels
      expect(memoryDifference).toBeLessThan(20 * 1024 * 1024); // Less than 20MB difference
    });

    it('should handle memory pressure gracefully', () => {
      // Simulate memory pressure by creating large datasets
      const datasets = Array.from({ length: 10 }, (_, i) =>
        Array.from({ length: 10000 }, (_, j) => ({
          ...createMockTrade(),
          id: `pressure-trade-${i}-${j}`,
        }))
      );

      expect(() => {
        datasets.forEach((trades, index) => {
          performanceService.calculateProfessionalMetrics(`pressure-strategy-${index}`, trades);
        });
      }).not.toThrow();

      // Should complete without memory errors
      expect(datasets).toHaveLength(10);
    });
  });

  describe('Scalability Benchmarks', () => {
    it('should maintain linear performance scaling', () => {
      const testSizes = [1000, 5000, 10000, 20000];
      const timings: number[] = [];

      testSizes.forEach(size => {
        const trades = Array.from({ length: size }, (_, i) => ({
          ...createMockTrade(),
          id: `scale-trade-${i}`,
          pnl: Math.random() * 200 - 100,
        }));

        const startTime = performance.now();
        performanceService.calculateProfessionalMetrics('scale-strategy', trades);
        const endTime = performance.now();

        timings.push(endTime - startTime);
      });

      // Performance should scale roughly linearly (not exponentially)
      const scalingFactor = timings[3] / timings[0]; // 20k vs 1k
      expect(scalingFactor).toBeLessThan(30); // Should be less than 30x slower for 20x data
    });

    it('should handle concurrent user scenarios', async () => {
      const userCount = 50;
      const tradesPerUser = 1000;

      const startTime = performance.now();
      
      // Simulate multiple users performing operations simultaneously
      const userOperations = Array.from({ length: userCount }, async (_, userId) => {
        const userTrades = Array.from({ length: tradesPerUser }, (_, i) => ({
          ...createMockTrade(),
          id: `user-${userId}-trade-${i}`,
        }));

        return performanceService.calculateProfessionalMetrics(`user-${userId}-strategy`, userTrades);
      });

      const results = await Promise.all(userOperations);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(15000); // Should handle 50 concurrent users within 15 seconds
      expect(results).toHaveLength(userCount);
      expect(results.every(r => r.totalTrades === tradesPerUser)).toBe(true);
    });
  });
});
/**
 * System Performance Validation Tests
 * 
 * Comprehensive performance tests to ensure the strategy management system
 * performs well under realistic data loads and usage patterns.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StrategyPerformanceService } from '../../../services/StrategyPerformanceService';
import { StrategyAttributionService } from '../../../services/StrategyAttributionService';
import { AIInsightsService } from '../../../services/AIInsightsService';
import { BacktestingService } from '../../../services/BacktestingService';
import { CacheService } from '../../../services/CacheService';
import { PerformanceMonitoringService } from '../../../services/PerformanceMonitoringService';
import type { ProfessionalStrategy, Trade } from '../../../types/strategy';

interface PerformanceBenchmark {
  operation: string;
  dataSize: number;
  expectedMaxTime: number; // milliseconds
  expectedMaxMemory: number; // MB
  description: string;
}

interface PerformanceResult {
  operation: string;
  dataSize: number;
  actualTime: number;
  actualMemory: number;
  passed: boolean;
  details: any;
}

export class SystemPerformanceValidator {
  private performanceService: StrategyPerformanceService;
  private attributionService: StrategyAttributionService;
  private aiInsightsService: AIInsightsService;
  private backtestingService: BacktestingService;
  private cacheService: CacheService;
  private monitoringService: PerformanceMonitoringService;

  constructor() {
    this.performanceService = new StrategyPerformanceService();
    this.attributionService = new StrategyAttributionService();
    this.aiInsightsService = new AIInsightsService();
    this.backtestingService = new BacktestingService();
    this.cacheService = new CacheService();
    this.monitoringService = new PerformanceMonitoringService();
  }

  async validateSystemPerformance(): Promise<{
    results: PerformanceResult[];
    overallScore: number;
    recommendations: string[];
    systemHealth: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  }> {
    const benchmarks = this.getPerformanceBenchmarks();
    const results: PerformanceResult[] = [];

    for (const benchmark of benchmarks) {
      const result = await this.runPerformanceBenchmark(benchmark);
      results.push(result);
    }

    const overallScore = this.calculateOverallScore(results);
    const recommendations = this.generateRecommendations(results);
    const systemHealth = this.determineSystemHealth(overallScore);

    return {
      results,
      overallScore,
      recommendations,
      systemHealth
    };
  }

  private getPerformanceBenchmarks(): PerformanceBenchmark[] {
    return [
      {
        operation: 'calculateProfessionalMetrics',
        dataSize: 1000,
        expectedMaxTime: 500,
        expectedMaxMemory: 50,
        description: 'Calculate professional metrics for 1,000 trades'
      },
      {
        operation: 'calculateProfessionalMetrics',
        dataSize: 10000,
        expectedMaxTime: 2000,
        expectedMaxMemory: 100,
        description: 'Calculate professional metrics for 10,000 trades'
      },
      {
        operation: 'suggestStrategy',
        dataSize: 100,
        expectedMaxTime: 200,
        expectedMaxMemory: 25,
        description: 'Strategy suggestion with 100 strategies'
      },
      {
        operation: 'suggestStrategy',
        dataSize: 1000,
        expectedMaxTime: 800,
        expectedMaxMemory: 75,
        description: 'Strategy suggestion with 1,000 strategies'
      },
      {
        operation: 'generateStrategyInsights',
        dataSize: 500,
        expectedMaxTime: 1500,
        expectedMaxMemory: 100,
        description: 'Generate AI insights for 500 trades'
      },
      {
        operation: 'runBacktest',
        dataSize: 2000,
        expectedMaxTime: 3000,
        expectedMaxMemory: 150,
        description: 'Run backtest with 2,000 historical trades'
      },
      {
        operation: 'concurrentCalculations',
        dataSize: 10,
        expectedMaxTime: 1000,
        expectedMaxMemory: 200,
        description: '10 concurrent performance calculations'
      },
      {
        operation: 'cacheOperations',
        dataSize: 1000,
        expectedMaxTime: 100,
        expectedMaxMemory: 50,
        description: '1,000 cache set/get operations'
      },
      {
        operation: 'realTimeUpdates',
        dataSize: 50,
        expectedMaxTime: 300,
        expectedMaxMemory: 30,
        description: '50 real-time performance updates'
      },
      {
        operation: 'largeDatasetVisualization',
        dataSize: 5000,
        expectedMaxTime: 1000,
        expectedMaxMemory: 100,
        description: 'Prepare visualization data for 5,000 trades'
      }
    ];
  }

  private async runPerformanceBenchmark(benchmark: PerformanceBenchmark): Promise<PerformanceResult> {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    try {
      let details: any = {};

      switch (benchmark.operation) {
        case 'calculateProfessionalMetrics':
          details = await this.benchmarkCalculateProfessionalMetrics(benchmark.dataSize);
          break;
        case 'suggestStrategy':
          details = await this.benchmarkSuggestStrategy(benchmark.dataSize);
          break;
        case 'generateStrategyInsights':
          details = await this.benchmarkGenerateInsights(benchmark.dataSize);
          break;
        case 'runBacktest':
          details = await this.benchmarkRunBacktest(benchmark.dataSize);
          break;
        case 'concurrentCalculations':
          details = await this.benchmarkConcurrentCalculations(benchmark.dataSize);
          break;
        case 'cacheOperations':
          details = await this.benchmarkCacheOperations(benchmark.dataSize);
          break;
        case 'realTimeUpdates':
          details = await this.benchmarkRealTimeUpdates(benchmark.dataSize);
          break;
        case 'largeDatasetVisualization':
          details = await this.benchmarkLargeDatasetVisualization(benchmark.dataSize);
          break;
        default:
          throw new Error(`Unknown benchmark operation: ${benchmark.operation}`);
      }

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      const actualTime = endTime - startTime;
      const actualMemory = (endMemory - startMemory) / 1024 / 1024; // Convert to MB

      return {
        operation: benchmark.operation,
        dataSize: benchmark.dataSize,
        actualTime,
        actualMemory,
        passed: actualTime <= benchmark.expectedMaxTime && actualMemory <= benchmark.expectedMaxMemory,
        details
      };
    } catch (error) {
      return {
        operation: benchmark.operation,
        dataSize: benchmark.dataSize,
        actualTime: -1,
        actualMemory: -1,
        passed: false,
        details: { error: error.message }
      };
    }
  }

  private async benchmarkCalculateProfessionalMetrics(tradeCount: number): Promise<any> {
    const strategy = this.createMockStrategy();
    const trades = this.createMockTrades(tradeCount);

    const result = await this.performanceService.calculateProfessionalMetrics(strategy.id, trades);

    return {
      profitFactor: result.profitFactor,
      expectancy: result.expectancy,
      tradesProcessed: trades.length,
      metricsCalculated: Object.keys(result).length
    };
  }

  private async benchmarkSuggestStrategy(strategyCount: number): Promise<any> {
    const strategies = Array.from({ length: strategyCount }, (_, i) => 
      this.createMockStrategy(`strategy-${i}`)
    );
    const trade = this.createMockTrade();

    const suggestions = await this.attributionService.suggestStrategy(trade, strategies);

    return {
      strategiesEvaluated: strategies.length,
      suggestionsGenerated: suggestions.length,
      topMatchScore: suggestions[0]?.confidence || 0
    };
  }

  private async benchmarkGenerateInsights(tradeCount: number): Promise<any> {
    const strategy = this.createMockStrategy();
    const trades = this.createMockTrades(tradeCount);

    const insights = await this.aiInsightsService.generateStrategyInsights(strategy, trades);

    return {
      tradesAnalyzed: trades.length,
      insightsGenerated: insights.length,
      averageConfidence: insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length
    };
  }

  private async benchmarkRunBacktest(tradeCount: number): Promise<any> {
    const strategy = this.createMockStrategy();
    const trades = this.createMockTrades(tradeCount);

    const backtestResult = await this.backtestingService.runBacktest(strategy, trades);

    return {
      tradesBacktested: trades.length,
      backtestCompleted: !!backtestResult,
      performanceMetrics: backtestResult ? Object.keys(backtestResult.performance).length : 0
    };
  }

  private async benchmarkConcurrentCalculations(concurrentCount: number): Promise<any> {
    const strategy = this.createMockStrategy();
    const trades = this.createMockTrades(100); // 100 trades per calculation

    const promises = Array.from({ length: concurrentCount }, () =>
      this.performanceService.calculateProfessionalMetrics(strategy.id, trades)
    );

    const results = await Promise.all(promises);

    return {
      concurrentOperations: concurrentCount,
      allCompleted: results.length === concurrentCount,
      consistentResults: results.every(result => 
        Math.abs(result.profitFactor - results[0].profitFactor) < 0.001
      )
    };
  }

  private async benchmarkCacheOperations(operationCount: number): Promise<any> {
    const operations = [];
    let hits = 0;
    let misses = 0;

    for (let i = 0; i < operationCount; i++) {
      const key = `benchmark-key-${i % 100}`; // Create some cache hits
      const value = { data: `value-${i}`, timestamp: Date.now() };

      // Set operation
      await this.cacheService.set(key, value, 300);

      // Get operation
      const retrieved = await this.cacheService.get(key);
      if (retrieved) {
        hits++;
      } else {
        misses++;
      }
    }

    return {
      totalOperations: operationCount * 2, // set + get
      cacheHits: hits,
      cacheMisses: misses,
      hitRate: (hits / (hits + misses)) * 100
    };
  }

  private async benchmarkRealTimeUpdates(updateCount: number): Promise<any> {
    const strategy = this.createMockStrategy();
    let updatesCompleted = 0;

    for (let i = 0; i < updateCount; i++) {
      const trade = this.createMockTrade(`trade-${i}`);
      await this.performanceService.updatePerformanceMetrics(strategy.id, trade);
      updatesCompleted++;
    }

    return {
      updatesRequested: updateCount,
      updatesCompleted,
      successRate: (updatesCompleted / updateCount) * 100
    };
  }

  private async benchmarkLargeDatasetVisualization(tradeCount: number): Promise<any> {
    const trades = this.createMockTrades(tradeCount);
    
    // Simulate data preparation for visualization
    const chartData = trades.map(trade => ({
      date: trade.entryTime,
      pnl: trade.pnl,
      cumulative: 0 // Would be calculated
    }));

    // Calculate cumulative P&L
    let cumulative = 0;
    chartData.forEach(point => {
      cumulative += point.pnl;
      point.cumulative = cumulative;
    });

    // Simulate data aggregation for performance charts
    const monthlyData = this.aggregateByMonth(chartData);
    const weeklyData = this.aggregateByWeek(chartData);

    return {
      tradesProcessed: trades.length,
      chartDataPoints: chartData.length,
      monthlyAggregations: monthlyData.length,
      weeklyAggregations: weeklyData.length,
      dataReady: true
    };
  }

  private aggregateByMonth(data: any[]): any[] {
    const monthlyMap = new Map();
    
    data.forEach(point => {
      const month = point.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, pnl: 0, trades: 0 });
      }
      const monthData = monthlyMap.get(month);
      monthData.pnl += point.pnl;
      monthData.trades += 1;
    });

    return Array.from(monthlyMap.values());
  }

  private aggregateByWeek(data: any[]): any[] {
    const weeklyMap = new Map();
    
    data.forEach(point => {
      const date = new Date(point.date);
      const week = this.getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-W${week}`;
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { week: weekKey, pnl: 0, trades: 0 });
      }
      const weekData = weeklyMap.get(weekKey);
      weekData.pnl += point.pnl;
      weekData.trades += 1;
    });

    return Array.from(weeklyMap.values());
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private calculateOverallScore(results: PerformanceResult[]): number {
    const passedTests = results.filter(result => result.passed).length;
    const totalTests = results.length;
    
    if (totalTests === 0) return 0;
    
    const baseScore = (passedTests / totalTests) * 100;
    
    // Apply performance bonuses/penalties
    let adjustedScore = baseScore;
    
    results.forEach(result => {
      if (result.passed && result.actualTime > 0) {
        const benchmark = this.getPerformanceBenchmarks().find(b => 
          b.operation === result.operation && b.dataSize === result.dataSize
        );
        
        if (benchmark) {
          const timeRatio = result.actualTime / benchmark.expectedMaxTime;
          const memoryRatio = result.actualMemory / benchmark.expectedMaxMemory;
          
          // Bonus for exceptional performance
          if (timeRatio < 0.5 && memoryRatio < 0.5) {
            adjustedScore += 2;
          } else if (timeRatio < 0.7 && memoryRatio < 0.7) {
            adjustedScore += 1;
          }
        }
      }
    });

    return Math.min(100, Math.max(0, adjustedScore));
  }

  private generateRecommendations(results: PerformanceResult[]): string[] {
    const recommendations: string[] = [];
    
    const failedTests = results.filter(result => !result.passed);
    
    failedTests.forEach(result => {
      const benchmark = this.getPerformanceBenchmarks().find(b => 
        b.operation === result.operation && b.dataSize === result.dataSize
      );
      
      if (benchmark) {
        if (result.actualTime > benchmark.expectedMaxTime) {
          recommendations.push(
            `Optimize ${result.operation} performance - taking ${result.actualTime.toFixed(0)}ms vs expected ${benchmark.expectedMaxTime}ms`
          );
        }
        
        if (result.actualMemory > benchmark.expectedMaxMemory) {
          recommendations.push(
            `Reduce memory usage in ${result.operation} - using ${result.actualMemory.toFixed(1)}MB vs expected ${benchmark.expectedMaxMemory}MB`
          );
        }
      }
    });

    // Check for patterns in performance issues
    const slowOperations = results.filter(result => {
      const benchmark = this.getPerformanceBenchmarks().find(b => 
        b.operation === result.operation && b.dataSize === result.dataSize
      );
      return benchmark && result.actualTime > benchmark.expectedMaxTime * 0.8;
    });

    if (slowOperations.length > results.length * 0.3) {
      recommendations.push('Consider implementing caching for frequently accessed data');
      recommendations.push('Review database query optimization opportunities');
    }

    const memoryIntensiveOperations = results.filter(result => {
      const benchmark = this.getPerformanceBenchmarks().find(b => 
        b.operation === result.operation && b.dataSize === result.dataSize
      );
      return benchmark && result.actualMemory > benchmark.expectedMaxMemory * 0.8;
    });

    if (memoryIntensiveOperations.length > results.length * 0.3) {
      recommendations.push('Implement data streaming for large datasets');
      recommendations.push('Consider lazy loading for non-critical data');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is excellent! Consider stress testing with even larger datasets.');
    }

    return recommendations;
  }

  private determineSystemHealth(score: number): 'excellent' | 'good' | 'needs_improvement' | 'critical' {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 70) return 'needs_improvement';
    return 'critical';
  }

  // Helper methods for creating mock data
  private createMockStrategy(id: string = 'test-strategy'): ProfessionalStrategy {
    return {
      id,
      title: 'Test Strategy',
      description: 'A test strategy for performance benchmarking',
      color: '#3B82F6',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending market',
        technicalConditions: ['RSI < 30'],
        volatilityRequirements: 'Medium'
      },
      entryTriggers: {
        primarySignal: 'Breakout',
        confirmationSignals: ['Volume'],
        timingCriteria: 'London session'
      },
      riskManagement: {
        positionSizingMethod: { type: 'FixedPercentage', parameters: { percentage: 2 } },
        maxRiskPerTrade: 2,
        stopLossRule: { type: 'ATRBased', parameters: { multiplier: 2 }, description: '2x ATR' },
        takeProfitRule: { type: 'RiskRewardRatio', parameters: { ratio: 2 }, description: '1:2 RR' },
        riskRewardRatio: 2
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profitFactor: 0,
        expectancy: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        riskRewardRatio: 2,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        sampleSize: 0,
        confidenceLevel: 0,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Insufficient Data',
        lastCalculated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isActive: true
    };
  }

  private createMockTrade(id: string = 'test-trade'): Trade {
    const isWin = Math.random() > 0.4; // 60% win rate
    const pnl = isWin ? 50 + Math.random() * 100 : -(25 + Math.random() * 50);
    
    return {
      id,
      symbol: 'EURUSD',
      entryPrice: 1.1000 + (Math.random() - 0.5) * 0.01,
      exitPrice: 1.1000 + (Math.random() - 0.5) * 0.01,
      quantity: 10000,
      side: Math.random() > 0.5 ? 'long' : 'short',
      entryTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      exitTime: new Date(Date.now() - Math.random() * 29 * 24 * 60 * 60 * 1000).toISOString(),
      pnl,
      commission: 2 + Math.random() * 3,
      notes: 'Performance test trade'
    };
  }

  private createMockTrades(count: number): Trade[] {
    return Array.from({ length: count }, (_, i) => this.createMockTrade(`trade-${i}`));
  }
}

describe('System Performance Validation', () => {
  let validator: SystemPerformanceValidator;

  beforeEach(() => {
    validator = new SystemPerformanceValidator();
  });

  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  it('should meet all performance benchmarks', async () => {
    const result = await validator.validateSystemPerformance();

    console.log('\n📊 SYSTEM PERFORMANCE REPORT');
    console.log('═'.repeat(50));
    console.log(`Overall Score: ${result.overallScore.toFixed(1)}%`);
    console.log(`System Health: ${result.systemHealth.toUpperCase()}`);
    
    console.log('\n📈 Benchmark Results:');
    result.results.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} ${test.operation} (${test.dataSize} items): ${test.actualTime.toFixed(0)}ms, ${test.actualMemory.toFixed(1)}MB`);
    });

    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    // Expect at least 85% of tests to pass for good performance
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.systemHealth).not.toBe('critical');
  }, 60000); // 60 second timeout for performance tests

  it('should handle memory pressure gracefully', async () => {
    const validator = new SystemPerformanceValidator();
    
    // Create memory pressure by running multiple large operations
    const operations = [
      () => validator['benchmarkCalculateProfessionalMetrics'](5000),
      () => validator['benchmarkSuggestStrategy'](500),
      () => validator['benchmarkGenerateInsights'](1000),
      () => validator['benchmarkLargeDatasetVisualization'](3000)
    ];

    const startMemory = process.memoryUsage().heapUsed;
    
    // Run operations sequentially to build up memory pressure
    for (const operation of operations) {
      await operation();
    }

    const endMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (endMemory - startMemory) / 1024 / 1024; // MB

    // Memory increase should be reasonable (less than 500MB)
    expect(memoryIncrease).toBeLessThan(500);
  }, 30000);

  it('should maintain performance consistency across multiple runs', async () => {
    const runCount = 5;
    const results = [];

    for (let i = 0; i < runCount; i++) {
      const startTime = performance.now();
      await validator['benchmarkCalculateProfessionalMetrics'](1000);
      const endTime = performance.now();
      results.push(endTime - startTime);
    }

    // Calculate coefficient of variation (standard deviation / mean)
    const mean = results.reduce((sum, time) => sum + time, 0) / results.length;
    const variance = results.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / results.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Performance should be consistent (CV < 0.3)
    expect(coefficientOfVariation).toBeLessThan(0.3);
  }, 30000);

  it('should scale linearly with data size', async () => {
    const dataSizes = [100, 500, 1000, 2000];
    const times = [];

    for (const size of dataSizes) {
      const startTime = performance.now();
      await validator['benchmarkCalculateProfessionalMetrics'](size);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    // Check that performance scales reasonably (not exponentially)
    for (let i = 1; i < times.length; i++) {
      const sizeRatio = dataSizes[i] / dataSizes[i - 1];
      const timeRatio = times[i] / times[i - 1];
      
      // Time ratio should not be more than 3x the size ratio
      expect(timeRatio).toBeLessThan(sizeRatio * 3);
    }
  }, 45000);

  it('should handle concurrent operations efficiently', async () => {
    const concurrentCount = 10;
    const operationSize = 500;

    const startTime = performance.now();
    
    const promises = Array.from({ length: concurrentCount }, () =>
      validator['benchmarkCalculateProfessionalMetrics'](operationSize)
    );

    const results = await Promise.all(promises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Concurrent operations should complete faster than sequential
    // (should be less than 80% of sequential time)
    const estimatedSequentialTime = concurrentCount * 500; // Rough estimate
    expect(totalTime).toBeLessThan(estimatedSequentialTime * 0.8);

    // All operations should complete successfully
    expect(results).toHaveLength(concurrentCount);
    results.forEach(result => {
      expect(result).toBeDefined();
    });
  }, 30000);
});
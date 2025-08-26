/**
 * Performance Benchmark Script
 * Runs comprehensive performance tests and generates reports
 */

import { CacheService } from '../services/CacheService';
import { StrategyPerformanceService } from '../services/StrategyPerformanceService';
import { performanceMonitor } from '../services/PerformanceMonitoringService';
import { backgroundTaskRunner } from '../utils/performanceUtils';
import { Trade } from '../types/trade';

interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  memoryUsed: number;
  success: boolean;
  details?: any;
}

interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  totalDuration: number;
  overallScore: number;
}

class PerformanceBenchmark {
  private results: BenchmarkSuite[] = [];

  /**
   * Run all performance benchmarks
   */
  async runAllBenchmarks(): Promise<void> {
    console.log('🚀 Starting Performance Benchmarks...\n');

    await this.runCacheBenchmarks();
    await this.runCalculationBenchmarks();
    await this.runVirtualizationBenchmarks();
    await this.runMemoryBenchmarks();
    await this.runConcurrencyBenchmarks();

    this.generateReport();
  }

  /**
   * Cache performance benchmarks
   */
  private async runCacheBenchmarks(): Promise<void> {
    console.log('📦 Running Cache Benchmarks...');
    
    const suite: BenchmarkSuite = {
      name: 'Cache Performance',
      results: [],
      totalDuration: 0,
      overallScore: 0
    };

    const cache = new CacheService({ maxSize: 10000 });

    // Benchmark 1: Basic Operations
    suite.results.push(await this.benchmark(
      'Cache Basic Operations',
      10000,
      () => {
        const key = `key-${Math.floor(Math.random() * 1000)}`;
        const value = { data: Math.random(), timestamp: Date.now() };
        cache.set(key, value);
        cache.get(key);
      }
    ));

    // Benchmark 2: Pattern Invalidation
    suite.results.push(await this.benchmark(
      'Cache Pattern Invalidation',
      100,
      () => {
        // Set up data
        for (let i = 0; i < 100; i++) {
          cache.set(`strategy:${i % 10}:performance`, { data: i });
        }
        // Invalidate pattern
        cache.invalidatePattern('strategy:*');
      }
    ));

    // Benchmark 3: Cache Eviction
    const smallCache = new CacheService({ maxSize: 100 });
    suite.results.push(await this.benchmark(
      'Cache Eviction Performance',
      1000,
      () => {
        const key = `evict-key-${Math.random()}`;
        smallCache.set(key, { data: new Array(100).fill(Math.random()) });
      }
    ));

    cache.destroy();
    smallCache.destroy();

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    suite.overallScore = this.calculateSuiteScore(suite.results);
    this.results.push(suite);
  }

  /**
   * Calculation performance benchmarks
   */
  private async runCalculationBenchmarks(): Promise<void> {
    console.log('🧮 Running Calculation Benchmarks...');
    
    const suite: BenchmarkSuite = {
      name: 'Calculation Performance',
      results: [],
      totalDuration: 0,
      overallScore: 0
    };

    const service = new StrategyPerformanceService();

    // Generate test data
    const smallDataset = this.generateMockTrades(100, 'bench-small');
    const mediumDataset = this.generateMockTrades(1000, 'bench-medium');
    const largeDataset = this.generateMockTrades(10000, 'bench-large');

    // Benchmark 1: Small Dataset
    suite.results.push(await this.benchmark(
      'Small Dataset (100 trades)',
      100,
      () => {
        service.calculateProfessionalMetrics('bench-small', smallDataset);
      }
    ));

    // Benchmark 2: Medium Dataset
    suite.results.push(await this.benchmark(
      'Medium Dataset (1000 trades)',
      10,
      () => {
        service.calculateProfessionalMetrics('bench-medium', mediumDataset);
      }
    ));

    // Benchmark 3: Large Dataset
    suite.results.push(await this.benchmark(
      'Large Dataset (10000 trades)',
      5,
      () => {
        service.calculateProfessionalMetrics('bench-large', largeDataset);
      }
    ));

    // Benchmark 4: Cached vs Uncached
    const cacheResult = await this.benchmarkCachedVsUncached(service, mediumDataset);
    suite.results.push(cacheResult);

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    suite.overallScore = this.calculateSuiteScore(suite.results);
    this.results.push(suite);
  }

  /**
   * Virtualization performance benchmarks
   */
  private async runVirtualizationBenchmarks(): Promise<void> {
    console.log('📋 Running Virtualization Benchmarks...');
    
    const suite: BenchmarkSuite = {
      name: 'Virtualization Performance',
      results: [],
      totalDuration: 0,
      overallScore: 0
    };

    // Benchmark virtual list calculations
    const { calculateVirtualListItems } = await import('../utils/performanceUtils');

    suite.results.push(await this.benchmark(
      'Virtual List Calculations',
      10000,
      () => {
        calculateVirtualListItems(
          Math.random() * 10000,
          50000,
          { itemHeight: 50, containerHeight: 400, overscan: 5 }
        );
      }
    ));

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    suite.overallScore = this.calculateSuiteScore(suite.results);
    this.results.push(suite);
  }

  /**
   * Memory usage benchmarks
   */
  private async runMemoryBenchmarks(): Promise<void> {
    console.log('💾 Running Memory Benchmarks...');
    
    const suite: BenchmarkSuite = {
      name: 'Memory Performance',
      results: [],
      totalDuration: 0,
      overallScore: 0
    };

    // Benchmark 1: Memory Leak Test
    const initialMemory = process.memoryUsage().heapUsed;
    
    const result = await this.benchmark(
      'Memory Leak Test',
      1000,
      () => {
        const cache = new CacheService();
        for (let i = 0; i < 100; i++) {
          cache.set(`temp-${i}`, new Array(1000).fill(Math.random()));
        }
        cache.destroy();
      }
    );

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    result.details = {
      initialMemory: (initialMemory / 1024 / 1024).toFixed(2) + 'MB',
      finalMemory: (finalMemory / 1024 / 1024).toFixed(2) + 'MB',
      memoryIncrease: (memoryIncrease / 1024 / 1024).toFixed(2) + 'MB'
    };

    suite.results.push(result);

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    suite.overallScore = this.calculateSuiteScore(suite.results);
    this.results.push(suite);
  }

  /**
   * Concurrency performance benchmarks
   */
  private async runConcurrencyBenchmarks(): Promise<void> {
    console.log('🔄 Running Concurrency Benchmarks...');
    
    const suite: BenchmarkSuite = {
      name: 'Concurrency Performance',
      results: [],
      totalDuration: 0,
      overallScore: 0
    };

    const service = new StrategyPerformanceService();

    // Benchmark 1: Concurrent Calculations
    const startTime = performance.now();
    const promises = Array.from({ length: 10 }, (_, i) => {
      const trades = this.generateMockTrades(500, `concurrent-${i}`);
      return Promise.resolve(service.calculateProfessionalMetrics(`concurrent-${i}`, trades));
    });

    await Promise.all(promises);
    const duration = performance.now() - startTime;

    suite.results.push({
      name: 'Concurrent Calculations',
      duration,
      operations: 10,
      opsPerSecond: 10 / (duration / 1000),
      memoryUsed: process.memoryUsage().heapUsed,
      success: true,
      details: {
        strategies: 10,
        tradesPerStrategy: 500,
        totalTrades: 5000
      }
    });

    // Benchmark 2: Background Task Performance
    const bgStartTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      backgroundTaskRunner.addTask(
        `bg-task-${i}`,
        async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return i;
        },
        Math.floor(Math.random() * 3)
      );
    }

    // Wait for tasks to complete
    while (backgroundTaskRunner.getStatus().queueSize > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const bgDuration = performance.now() - bgStartTime;

    suite.results.push({
      name: 'Background Task Processing',
      duration: bgDuration,
      operations: 100,
      opsPerSecond: 100 / (bgDuration / 1000),
      memoryUsed: process.memoryUsage().heapUsed,
      success: true
    });

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    suite.overallScore = this.calculateSuiteScore(suite.results);
    this.results.push(suite);
  }

  /**
   * Run a single benchmark
   */
  private async benchmark(
    name: string,
    iterations: number,
    operation: () => void | Promise<void>
  ): Promise<BenchmarkResult> {
    const initialMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    
    try {
      for (let i = 0; i < iterations; i++) {
        await operation();
      }
      
      const duration = performance.now() - startTime;
      const finalMemory = process.memoryUsage().heapUsed;
      
      return {
        name,
        duration,
        operations: iterations,
        opsPerSecond: iterations / (duration / 1000),
        memoryUsed: finalMemory - initialMemory,
        success: true
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        memoryUsed: 0,
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Benchmark cached vs uncached performance
   */
  private async benchmarkCachedVsUncached(
    service: StrategyPerformanceService,
    trades: Trade[]
  ): Promise<BenchmarkResult> {
    const iterations = 10;
    
    // Clear cache
    service.invalidateStrategiesCache(['cache-test']);
    
    // Uncached performance
    const uncachedStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      service.invalidateStrategiesCache(['cache-test']);
      service.calculateProfessionalMetrics('cache-test', trades);
    }
    const uncachedDuration = performance.now() - uncachedStart;
    
    // Cached performance
    const cachedStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      service.calculateProfessionalMetrics('cache-test', trades);
    }
    const cachedDuration = performance.now() - cachedStart;
    
    const speedup = uncachedDuration / cachedDuration;
    
    return {
      name: 'Cached vs Uncached',
      duration: cachedDuration,
      operations: iterations,
      opsPerSecond: iterations / (cachedDuration / 1000),
      memoryUsed: 0,
      success: true,
      details: {
        uncachedTime: uncachedDuration.toFixed(2) + 'ms',
        cachedTime: cachedDuration.toFixed(2) + 'ms',
        speedup: speedup.toFixed(1) + 'x'
      }
    };
  }

  /**
   * Generate mock trades for testing
   */
  private generateMockTrades(count: number, strategyId: string): Trade[] {
    const trades: Trade[] = [];
    const startDate = new Date('2023-01-01');
    
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const isWin = Math.random() > 0.4;
      const pnl = isWin ? Math.random() * 1000 + 100 : -(Math.random() * 500 + 50);
      
      trades.push({
        id: `${strategyId}-trade-${i}`,
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
        rMultiple: pnl / 50
      });
    }
    
    return trades;
  }

  /**
   * Calculate overall score for a benchmark suite
   */
  private calculateSuiteScore(results: BenchmarkResult[]): number {
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) return 0;
    
    // Score based on operations per second (normalized)
    const avgOpsPerSecond = successfulResults.reduce((sum, r) => sum + r.opsPerSecond, 0) / successfulResults.length;
    
    // Convert to 0-100 scale (arbitrary scaling for display)
    return Math.min(100, Math.log10(avgOpsPerSecond + 1) * 20);
  }

  /**
   * Generate performance report
   */
  private generateReport(): void {
    console.log('\n📊 Performance Benchmark Report');
    console.log('================================\n');

    let totalScore = 0;
    let totalSuites = 0;

    for (const suite of this.results) {
      console.log(`📋 ${suite.name}`);
      console.log(`   Overall Score: ${suite.overallScore.toFixed(1)}/100`);
      console.log(`   Total Duration: ${suite.totalDuration.toFixed(2)}ms`);
      console.log('   Results:');

      for (const result of suite.results) {
        const status = result.success ? '✅' : '❌';
        console.log(`     ${status} ${result.name}`);
        console.log(`        Duration: ${result.duration.toFixed(2)}ms`);
        console.log(`        Ops/sec: ${result.opsPerSecond.toFixed(0)}`);
        console.log(`        Memory: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`);
        
        if (result.details) {
          console.log(`        Details: ${JSON.stringify(result.details, null, 10)}`);
        }
        console.log('');
      }

      totalScore += suite.overallScore;
      totalSuites++;
      console.log('');
    }

    const overallScore = totalScore / totalSuites;
    console.log(`🏆 Overall Performance Score: ${overallScore.toFixed(1)}/100`);
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    if (overallScore >= 80) {
      console.log('   ✅ Excellent performance! System is well optimized.');
    } else if (overallScore >= 60) {
      console.log('   ⚠️  Good performance with room for improvement.');
      console.log('   - Consider optimizing slower operations');
      console.log('   - Monitor memory usage patterns');
    } else {
      console.log('   🚨 Performance needs attention!');
      console.log('   - Review caching strategies');
      console.log('   - Optimize calculation algorithms');
      console.log('   - Consider lazy loading for heavy components');
    }

    // System information
    console.log('\n🖥️  System Information:');
    const memUsage = process.memoryUsage();
    console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   External: ${(memUsage.external / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`);
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAllBenchmarks().catch(console.error);
}

export { PerformanceBenchmark };
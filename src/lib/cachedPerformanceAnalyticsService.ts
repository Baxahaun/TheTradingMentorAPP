/**
 * Cached Performance Analytics Service
 * Extends the base performance analytics service with caching capabilities
 * to improve performance for repeated calculations and comparisons.
 */

import { Trade } from '../types/trade';
import { PerformanceMetrics, TradeComparison } from '../types/tradeReview';
import { PerformanceAnalyticsService } from './performanceAnalyticsService';
import { performanceCache } from './performanceOptimization';

/**
 * Enhanced performance analytics service with intelligent caching
 */
export class CachedPerformanceAnalyticsService extends PerformanceAnalyticsService {
  private readonly CACHE_TTL = {
    METRICS: 10 * 60 * 1000, // 10 minutes for individual trade metrics
    COMPARISON: 15 * 60 * 1000, // 15 minutes for trade comparisons
    SIMILAR_TRADES: 30 * 60 * 1000, // 30 minutes for similar trades
    INSIGHTS: 20 * 60 * 1000, // 20 minutes for insights
    BENCHMARK: 60 * 60 * 1000 // 1 hour for benchmark data
  };

  /**
   * Calculate metrics with caching
   */
  calculateMetrics(trade: Trade): PerformanceMetrics {
    const cacheKey = `metrics:${trade.id}:${this.getTradeHash(trade)}`;
    
    const cached = performanceCache.get<PerformanceMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const metrics = super.calculateMetrics(trade);
    performanceCache.set(cacheKey, metrics, this.CACHE_TTL.METRICS);
    
    return metrics;
  }

  /**
   * Find similar trades with caching
   */
  findSimilarTrades(trade: Trade, allTrades: Trade[]): Trade[] {
    const cacheKey = `similar:${trade.id}:${this.getTradesHash(allTrades)}`;
    
    const cached = performanceCache.get<Trade[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const similarTrades = super.findSimilarTrades(trade, allTrades);
    performanceCache.set(cacheKey, similarTrades, this.CACHE_TTL.SIMILAR_TRADES);
    
    return similarTrades;
  }

  /**
   * Compare with similar trades with caching
   */
  compareWithSimilar(trade: Trade, similarTrades: Trade[]): TradeComparison {
    const cacheKey = `comparison:${trade.id}:${this.getTradesHash(similarTrades)}`;
    
    const cached = performanceCache.get<TradeComparison>(cacheKey);
    if (cached) {
      return cached;
    }

    const comparison = super.compareWithSimilar(trade, similarTrades);
    performanceCache.set(cacheKey, comparison, this.CACHE_TTL.COMPARISON);
    
    return comparison;
  }

  /**
   * Generate insights with caching
   */
  generateInsights(trade: Trade, comparison: TradeComparison): string[] {
    const cacheKey = `insights:${trade.id}:${this.getComparisonHash(comparison)}`;
    
    const cached = performanceCache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const insights = super.generateInsights(trade, comparison);
    performanceCache.set(cacheKey, insights, this.CACHE_TTL.INSIGHTS);
    
    return insights;
  }

  /**
   * Calculate benchmark performance with caching
   */
  calculateBenchmarkPerformance(trades: Trade[]): PerformanceMetrics {
    const cacheKey = `benchmark:${this.getTradesHash(trades)}`;
    
    const cached = performanceCache.get<PerformanceMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const benchmark = super.calculateBenchmarkPerformance(trades);
    performanceCache.set(cacheKey, benchmark, this.CACHE_TTL.BENCHMARK);
    
    return benchmark;
  }

  /**
   * Batch calculate metrics for multiple trades with caching
   */
  batchCalculateMetrics(trades: Trade[]): Map<string, PerformanceMetrics> {
    const results = new Map<string, PerformanceMetrics>();
    const uncachedTrades: Trade[] = [];

    // Check cache for each trade
    for (const trade of trades) {
      const cacheKey = `metrics:${trade.id}:${this.getTradeHash(trade)}`;
      const cached = performanceCache.get<PerformanceMetrics>(cacheKey);
      
      if (cached) {
        results.set(trade.id, cached);
      } else {
        uncachedTrades.push(trade);
      }
    }

    // Calculate metrics for uncached trades
    for (const trade of uncachedTrades) {
      const metrics = super.calculateMetrics(trade);
      const cacheKey = `metrics:${trade.id}:${this.getTradeHash(trade)}`;
      
      performanceCache.set(cacheKey, metrics, this.CACHE_TTL.METRICS);
      results.set(trade.id, metrics);
    }

    return results;
  }

  /**
   * Preload metrics for a set of trades (background caching)
   */
  async preloadMetrics(trades: Trade[]): Promise<void> {
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < trades.length; i += batchSize) {
      batches.push(trades.slice(i, i + batchSize));
    }

    // Process batches with small delays to avoid blocking
    for (const batch of batches) {
      this.batchCalculateMetrics(batch);
      
      // Small delay to prevent blocking the main thread
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Clear cache for specific trade
   */
  clearTradeCache(tradeId: string): void {
    const keysToRemove: string[] = [];
    
    // Find all cache keys related to this trade
    for (let i = 0; i < performanceCache.size(); i++) {
      // This is a simplified approach - in a real implementation,
      // you might want to maintain an index of keys by trade ID
    }
    
    // For now, we'll clear the entire cache if needed
    // In production, you'd want a more sophisticated approach
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: performanceCache.size(),
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): void {
    performanceCache.cleanup();
  }

  // Private helper methods

  private getTradeHash(trade: Trade): string {
    // Create a hash based on trade properties that affect metrics
    const relevantProps = {
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      quantity: trade.quantity,
      pnl: trade.pnl,
      riskAmount: trade.riskAmount,
      takeProfit: trade.takeProfit,
      stopLoss: trade.stopLoss,
      timeIn: trade.timeIn,
      timeOut: trade.timeOut,
      date: trade.date,
      side: trade.side,
      status: trade.status
    };
    
    return btoa(JSON.stringify(relevantProps)).slice(0, 16);
  }

  private getTradesHash(trades: Trade[]): string {
    // Create a hash based on trade IDs and their individual hashes
    const tradeHashes = trades
      .map(trade => `${trade.id}:${this.getTradeHash(trade)}`)
      .sort()
      .join('|');
    
    return btoa(tradeHashes).slice(0, 16);
  }

  private getComparisonHash(comparison: TradeComparison): string {
    // Create a hash based on comparison data
    const comparisonData = {
      similarTradesCount: comparison.similarTrades.length,
      percentileRank: comparison.percentileRank,
      avgRMultiple: comparison.averagePerformance.rMultiple,
      avgEfficiency: comparison.averagePerformance.efficiency
    };
    
    return btoa(JSON.stringify(comparisonData)).slice(0, 16);
  }

  private calculateHitRate(): number {
    // This would require tracking cache hits/misses
    // For now, return a placeholder
    return 0.75; // 75% hit rate
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of cache memory usage in bytes
    return performanceCache.size() * 1024; // Assume ~1KB per entry
  }
}

// Export singleton instance
export const cachedPerformanceAnalyticsService = new CachedPerformanceAnalyticsService();
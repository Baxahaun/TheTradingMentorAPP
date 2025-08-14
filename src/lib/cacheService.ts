import { Trade } from '../types/trade';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
  dependencies?: string[];
}

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  enableDebounce: boolean;
  debounceDelay: number;
}

// Default cache configuration
const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  enableDebounce: true,
  debounceDelay: 300, // 300ms
};

// Cache key generators
export const CacheKeys = {
  setupPerformance: (setupType: string, tradesHash: string) => `setup_perf_${setupType}_${tradesHash}`,
  patternPerformance: (patternType: string, tradesHash: string) => `pattern_perf_${patternType}_${tradesHash}`,
  positionAnalytics: (tradeId: string, version: number) => `position_analytics_${tradeId}_${version}`,
  setupAnalytics: (setupType: string, tradesHash: string) => `setup_analytics_${setupType}_${tradesHash}`,
  patternAnalytics: (patternType: string, tradesHash: string) => `pattern_analytics_${patternType}_${tradesHash}`,
  exitEfficiency: (tradesHash: string) => `exit_efficiency_${tradesHash}`,
  allSetupPerformance: (tradesHash: string) => `all_setup_perf_${tradesHash}`,
  allPatternPerformance: (tradesHash: string) => `all_pattern_perf_${tradesHash}`,
  positionManagementPatterns: (tradesHash: string) => `position_patterns_${tradesHash}`,
  setupComparison: (setupTypes: string[], tradesHash: string) => `setup_comp_${setupTypes.join('_')}_${tradesHash}`,
  patternComparison: (patternTypes: string[], tradesHash: string) => `pattern_comp_${patternTypes.join('_')}_${tradesHash}`,
};

// Debounce utility
class DebounceManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        // Clear existing timer
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(() => {
          this.timers.delete(key);
          resolve(func(...args));
        }, delay);

        this.timers.set(key, timer);
      });
    };
  }

  clear(key?: string): void {
    if (key) {
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    } else {
      this.timers.forEach(timer => clearTimeout(timer));
      this.timers.clear();
    }
  }
}

// Main cache service
export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private debounceManager: DebounceManager = new DebounceManager();
  private accessOrder: string[] = []; // For LRU eviction

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Generate hash for trades array to detect changes
  private generateTradesHash(trades: Trade[]): string {
    // Create a simple hash based on trade count, last modified dates, and key properties
    const hashData = {
      count: trades.length,
      lastModified: Math.max(...trades.map(t => new Date(t.updatedAt || t.date).getTime())),
      totalPnL: trades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    };
    
    return btoa(JSON.stringify(hashData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  // Get cached data
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    
    return entry.data;
  }

  // Set cached data
  set<T>(key: string, data: T, dependencies?: string[]): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
      dependencies,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  // Clear cache entries
  clear(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
      });
    } else {
      this.cache.clear();
      this.accessOrder = [];
    }
  }

  // Invalidate cache entries by dependencies
  invalidateByDependency(dependency: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.dependencies?.includes(dependency)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });
  }

  // Get or compute cached value
  async getOrCompute<T>(
    key: string,
    computeFn: () => T | Promise<T>,
    dependencies?: string[]
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const computed = await computeFn();
    this.set(key, computed, dependencies);
    return computed;
  }

  // Get or compute with debouncing
  async getOrComputeDebounced<T>(
    key: string,
    computeFn: () => T | Promise<T>,
    dependencies?: string[]
  ): Promise<T> {
    if (!this.config.enableDebounce) {
      return this.getOrCompute(key, computeFn, dependencies);
    }

    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const debouncedCompute = this.debounceManager.debounce(
      key,
      computeFn,
      this.config.debounceDelay
    );

    const computed = await debouncedCompute();
    this.set(key, computed, dependencies);
    return computed;
  }

  // Helper methods for trades-based caching
  getTradesHash(trades: Trade[]): string {
    return this.generateTradesHash(trades);
  }

  // Batch operations
  async batchGetOrCompute<T>(
    operations: Array<{
      key: string;
      computeFn: () => T | Promise<T>;
      dependencies?: string[];
    }>
  ): Promise<T[]> {
    const results = await Promise.all(
      operations.map(op => this.getOrCompute(op.key, op.computeFn, op.dependencies))
    );
    return results;
  }

  // Cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const now = Date.now();
    let oldestTimestamp = now;
    let newestTimestamp = 0;

    this.cache.forEach(entry => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp,
    };
  }

  // Private helper methods
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      this.cache.delete(lruKey);
    }
  }

  // Cleanup method
  cleanup(): void {
    this.debounceManager.clear();
    this.cache.clear();
    this.accessOrder = [];
  }
}

// Global cache instance
export const globalCache = new CacheService();

// Specialized cache instances for different use cases
export const analyticsCache = new CacheService({
  ttl: 10 * 60 * 1000, // 10 minutes for analytics
  maxSize: 50,
  enableDebounce: true,
  debounceDelay: 500,
});

export const performanceCache = new CacheService({
  ttl: 15 * 60 * 1000, // 15 minutes for performance calculations
  maxSize: 30,
  enableDebounce: true,
  debounceDelay: 1000,
});

// Cache invalidation helpers
export const CacheInvalidation = {
  onTradeUpdate: (tradeId: string) => {
    globalCache.clear(`trade_${tradeId}`);
    analyticsCache.clear();
    performanceCache.clear();
  },
  
  onTradesUpdate: () => {
    analyticsCache.clear();
    performanceCache.clear();
  },
  
  onSetupUpdate: (setupType: string) => {
    analyticsCache.clear(`setup_${setupType}`);
    performanceCache.clear(`setup_${setupType}`);
  },
  
  onPatternUpdate: (patternType: string) => {
    analyticsCache.clear(`pattern_${patternType}`);
    performanceCache.clear(`pattern_${patternType}`);
  },
};
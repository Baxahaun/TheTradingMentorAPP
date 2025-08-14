import { Trade } from '../types/trade';
import { globalCache } from './cacheService';

// Data loading configuration
interface LoadingConfig {
  batchSize: number;
  maxConcurrentBatches: number;
  enablePagination: boolean;
  enableFiltering: boolean;
  enableSorting: boolean;
}

// Default configuration
const DEFAULT_CONFIG: LoadingConfig = {
  batchSize: 100,
  maxConcurrentBatches: 3,
  enablePagination: true,
  enableFiltering: true,
  enableSorting: true,
};

// Data loading strategies
export enum LoadingStrategy {
  LAZY = 'lazy',
  EAGER = 'eager',
  PROGRESSIVE = 'progressive',
  ON_DEMAND = 'on_demand',
}

// Filter criteria interface
export interface FilterCriteria {
  dateRange?: { start: string; end: string };
  status?: ('open' | 'closed')[];
  symbols?: string[];
  setupTypes?: string[];
  patternTypes?: string[];
  minPnL?: number;
  maxPnL?: number;
  hasPartialCloses?: boolean;
  hasSetup?: boolean;
  hasPatterns?: boolean;
}

// Sort criteria interface
export interface SortCriteria {
  field: keyof Trade;
  direction: 'asc' | 'desc';
}

// Pagination interface
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Data loading result
export interface LoadingResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  nextPage?: number;
  loadTime: number;
}// Data
 Loading Service
export class DataLoadingService {
  private config: LoadingConfig;
  private loadingCache: Map<string, Promise<any>> = new Map();

  constructor(config: Partial<LoadingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Load trades with filtering, sorting, and pagination
  async loadTrades(
    allTrades: Trade[],
    options: {
      filter?: FilterCriteria;
      sort?: SortCriteria;
      pagination?: PaginationOptions;
      strategy?: LoadingStrategy;
    } = {}
  ): Promise<LoadingResult<Trade>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('trades', options);

    // Check cache first
    const cached = globalCache.get<LoadingResult<Trade>>(cacheKey);
    if (cached) {
      return cached;
    }

    let filteredTrades = allTrades;

    // Apply filters
    if (options.filter && this.config.enableFiltering) {
      filteredTrades = this.applyFilters(filteredTrades, options.filter);
    }

    // Apply sorting
    if (options.sort && this.config.enableSorting) {
      filteredTrades = this.applySorting(filteredTrades, options.sort);
    }

    const totalCount = filteredTrades.length;

    // Apply pagination
    let paginatedTrades = filteredTrades;
    let hasMore = false;
    let nextPage: number | undefined;

    if (options.pagination && this.config.enablePagination) {
      const { page, pageSize } = options.pagination;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      paginatedTrades = filteredTrades.slice(startIndex, endIndex);
      hasMore = endIndex < totalCount;
      nextPage = hasMore ? page + 1 : undefined;
    }

    const result: LoadingResult<Trade> = {
      data: paginatedTrades,
      totalCount,
      hasMore,
      nextPage,
      loadTime: Date.now() - startTime,
    };

    // Cache the result
    globalCache.set(cacheKey, result, ['trades']);

    return result;
  }

  // Load trades progressively for large datasets
  async loadTradesProgressively(
    allTrades: Trade[],
    onBatchLoaded: (batch: Trade[], progress: number) => void,
    options: {
      filter?: FilterCriteria;
      sort?: SortCriteria;
    } = {}
  ): Promise<Trade[]> {
    let filteredTrades = allTrades;

    // Apply filters
    if (options.filter) {
      filteredTrades = this.applyFilters(filteredTrades, options.filter);
    }

    // Apply sorting
    if (options.sort) {
      filteredTrades = this.applySorting(filteredTrades, options.sort);
    }

    const totalTrades = filteredTrades.length;
    const batchSize = this.config.batchSize;
    const result: Trade[] = [];

    // Process in batches
    for (let i = 0; i < totalTrades; i += batchSize) {
      const batch = filteredTrades.slice(i, i + batchSize);
      result.push(...batch);
      
      const progress = Math.min((i + batchSize) / totalTrades, 1);
      onBatchLoaded(batch, progress);

      // Allow UI to update between batches
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return result;
  }

  // Load specific trade data on demand
  async loadTradeOnDemand(
    tradeId: string,
    allTrades: Trade[]
  ): Promise<Trade | null> {
    const cacheKey = `trade_${tradeId}`;
    
    return globalCache.getOrCompute(
      cacheKey,
      () => {
        return allTrades.find(trade => trade.id === tradeId) || null;
      },
      ['trades']
    );
  }

  // Batch load multiple trades
  async batchLoadTrades(
    tradeIds: string[],
    allTrades: Trade[]
  ): Promise<Record<string, Trade | null>> {
    const operations = tradeIds.map(id => ({
      key: `trade_${id}`,
      computeFn: () => allTrades.find(trade => trade.id === id) || null,
      dependencies: ['trades'],
    }));

    const results = await globalCache.batchGetOrCompute(operations);
    
    return tradeIds.reduce((acc, id, index) => {
      acc[id] = results[index];
      return acc;
    }, {} as Record<string, Trade | null>);
  }

  // Apply filters to trades
  private applyFilters(trades: Trade[], filter: FilterCriteria): Trade[] {
    return trades.filter(trade => {
      // Date range filter
      if (filter.dateRange) {
        const tradeDate = new Date(trade.date);
        const startDate = new Date(filter.dateRange.start);
        const endDate = new Date(filter.dateRange.end);
        if (tradeDate < startDate || tradeDate > endDate) {
          return false;
        }
      }

      // Status filter
      if (filter.status && !filter.status.includes(trade.status)) {
        return false;
      }

      // Symbol filter
      if (filter.symbols && !filter.symbols.includes(trade.symbol)) {
        return false;
      }

      // Setup types filter
      if (filter.setupTypes && trade.setup) {
        if (!filter.setupTypes.includes(trade.setup.type)) {
          return false;
        }
      }

      // Pattern types filter
      if (filter.patternTypes && trade.patterns) {
        const hasMatchingPattern = trade.patterns.some(pattern => 
          filter.patternTypes!.includes(pattern.type)
        );
        if (!hasMatchingPattern) {
          return false;
        }
      }

      // P&L range filter
      if (filter.minPnL !== undefined && (trade.pnl || 0) < filter.minPnL) {
        return false;
      }
      if (filter.maxPnL !== undefined && (trade.pnl || 0) > filter.maxPnL) {
        return false;
      }

      // Has partial closes filter
      if (filter.hasPartialCloses !== undefined) {
        const hasPartials = trade.partialCloses && trade.partialCloses.length > 0;
        if (filter.hasPartialCloses !== hasPartials) {
          return false;
        }
      }

      // Has setup filter
      if (filter.hasSetup !== undefined) {
        const hasSetup = !!trade.setup;
        if (filter.hasSetup !== hasSetup) {
          return false;
        }
      }

      // Has patterns filter
      if (filter.hasPatterns !== undefined) {
        const hasPatterns = trade.patterns && trade.patterns.length > 0;
        if (filter.hasPatterns !== hasPatterns) {
          return false;
        }
      }

      return true;
    });
  }

  // Apply sorting to trades
  private applySorting(trades: Trade[], sort: SortCriteria): Trade[] {
    return [...trades].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sort.direction === 'asc' ? 1 : -1;
      if (bValue === undefined) return sort.direction === 'asc' ? -1 : 1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  // Generate cache key for loading options
  private generateCacheKey(prefix: string, options: any): string {
    const optionsHash = btoa(JSON.stringify(options))
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 16);
    return `${prefix}_${optionsHash}`;
  }

  // Clear loading caches
  clearCache(pattern?: string): void {
    if (pattern) {
      globalCache.clear(pattern);
    } else {
      this.loadingCache.clear();
      globalCache.clear('trades');
    }
  }

  // Get loading statistics
  getStats(): {
    cacheSize: number;
    pendingLoads: number;
    config: LoadingConfig;
  } {
    return {
      cacheSize: globalCache.getStats().size,
      pendingLoads: this.loadingCache.size,
      config: this.config,
    };
  }
}

// Global data loading service instance
export const dataLoadingService = new DataLoadingService();

// Specialized loading services for different use cases
export const analyticsDataLoader = new DataLoadingService({
  batchSize: 50,
  maxConcurrentBatches: 2,
  enablePagination: true,
  enableFiltering: true,
  enableSorting: true,
});

export const widgetDataLoader = new DataLoadingService({
  batchSize: 25,
  maxConcurrentBatches: 1,
  enablePagination: false,
  enableFiltering: true,
  enableSorting: false,
});
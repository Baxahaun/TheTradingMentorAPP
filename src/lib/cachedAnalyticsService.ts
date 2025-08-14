import { 
  Trade, 
  SetupType, 
  PatternType, 
  SetupMetrics, 
  SetupAnalytics, 
  PatternAnalytics,
  ExitAnalytics,
  PositionRecommendations
} from '../types/trade';
import { setupClassificationService } from './setupClassificationService';
import { patternRecognitionService } from './patternRecognitionService';
import { positionManagementService } from './positionManagementService';
import { analyticsCache, performanceCache, CacheKeys } from './cacheService';

// Cached Setup Classification Service
export const cachedSetupClassificationService = {
  ...setupClassificationService,

  // Cached setup performance calculation
  async calculateSetupPerformance(setupType: SetupType, trades: Trade[]): Promise<SetupMetrics> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.setupPerformance(setupType, tradesHash);
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => setupClassificationService.calculateSetupPerformance(setupType, trades),
      [`setup_${setupType}`, `trades_${tradesHash}`]
    );
  },

  // Cached setup analytics calculation
  async calculateSetupAnalytics(setupType: SetupType, trades: Trade[]): Promise<SetupAnalytics> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.setupAnalytics(setupType, tradesHash);
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => setupClassificationService.calculateSetupAnalytics(setupType, trades),
      [`setup_${setupType}`, `trades_${tradesHash}`]
    );
  },

  // Cached all setup performance calculation
  async calculateAllSetupPerformance(trades: Trade[]): Promise<Record<string, SetupMetrics>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.allSetupPerformance(tradesHash);
    
    return performanceCache.getOrComputeDebounced(
      cacheKey,
      () => setupClassificationService.calculateAllSetupPerformance(trades),
      [`trades_${tradesHash}`]
    );
  },

  // Cached setup comparison
  async compareSetupPerformance(trades: Trade[], setupTypes: SetupType[]): Promise<Record<SetupType, SetupMetrics>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.setupComparison(setupTypes, tradesHash);
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => setupClassificationService.compareSetupPerformance(trades, setupTypes),
      [`trades_${tradesHash}`, ...setupTypes.map(type => `setup_${type}`)]
    );
  },

  // Cached best performing setups
  async getBestPerformingSetups(trades: Trade[], limit: number = 5): Promise<Array<{ setupType: SetupType; metrics: SetupMetrics }>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `best_setups_${limit}_${tradesHash}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => setupClassificationService.getBestPerformingSetups(trades, limit),
      [`trades_${tradesHash}`]
    );
  },

  // Cached setup recommendations
  async getSetupRecommendations(
    trades: Trade[], 
    marketCondition: 'trending' | 'ranging' | 'breakout' | 'reversal'
  ): Promise<Array<{ setupType: SetupType; confidence: number; reason: string }>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `setup_recommendations_${marketCondition}_${tradesHash}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => setupClassificationService.getSetupRecommendations(trades, marketCondition),
      [`trades_${tradesHash}`, `market_${marketCondition}`]
    );
  },

  // Batch calculate multiple setup analytics
  async batchCalculateSetupAnalytics(
    setupTypes: SetupType[], 
    trades: Trade[]
  ): Promise<Record<SetupType, SetupAnalytics>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    
    const operations = setupTypes.map(setupType => ({
      key: CacheKeys.setupAnalytics(setupType, tradesHash),
      computeFn: () => setupClassificationService.calculateSetupAnalytics(setupType, trades),
      dependencies: [`setup_${setupType}`, `trades_${tradesHash}`],
    }));

    const results = await analyticsCache.batchGetOrCompute(operations);
    
    return setupTypes.reduce((acc, setupType, index) => {
      acc[setupType] = results[index];
      return acc;
    }, {} as Record<SetupType, SetupAnalytics>);
  },
};

// Cached Pattern Recognition Service
export const cachedPatternRecognitionService = {
  ...patternRecognitionService,

  // Cached pattern performance calculation
  async calculatePatternPerformance(patternType: PatternType, trades: Trade[]): Promise<PatternAnalytics> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.patternPerformance(patternType, tradesHash);
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.calculatePatternPerformance(patternType, trades),
      [`pattern_${patternType}`, `trades_${tradesHash}`]
    );
  },

  // Cached all pattern performance calculation
  async calculateAllPatternPerformance(trades: Trade[]): Promise<Record<string, PatternAnalytics>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.allPatternPerformance(tradesHash);
    
    return performanceCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.calculateAllPatternPerformance(trades),
      [`trades_${tradesHash}`]
    );
  },

  // Cached pattern comparison
  async comparePatternPerformance(trades: Trade[], patternTypes: PatternType[]): Promise<Record<PatternType, PatternAnalytics>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.patternComparison(patternTypes, tradesHash);
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.comparePatternPerformance(trades, patternTypes),
      [`trades_${tradesHash}`, ...patternTypes.map(type => `pattern_${type}`)]
    );
  },

  // Cached best performing patterns
  async getBestPerformingPatterns(trades: Trade[], limit: number = 5): Promise<Array<{ patternType: PatternType; analytics: PatternAnalytics }>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `best_patterns_${limit}_${tradesHash}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.getBestPerformingPatterns(trades, limit),
      [`trades_${tradesHash}`]
    );
  },

  // Cached pattern success rate calculation
  async calculatePatternSuccessRate(patternType: PatternType, trades: Trade[], timeframe?: string): Promise<number> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `pattern_success_${patternType}_${timeframe || 'all'}_${tradesHash}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.calculatePatternSuccessRate(patternType, trades, timeframe),
      [`pattern_${patternType}`, `trades_${tradesHash}`]
    );
  },

  // Cached market condition correlation analysis
  async analyzePatternMarketConditionCorrelation(trades: Trade[]): Promise<Record<string, Record<PatternType, number>>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `pattern_market_correlation_${tradesHash}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.analyzePatternMarketConditionCorrelation(trades),
      [`trades_${tradesHash}`]
    );
  },

  // Cached best patterns for market condition
  async getBestPatternsForMarketCondition(
    trades: Trade[], 
    marketCondition: string, 
    limit: number = 5
  ): Promise<Array<{ patternType: PatternType; successRate: number; totalTrades: number }>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `best_patterns_market_${marketCondition}_${limit}_${tradesHash}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.getBestPatternsForMarketCondition(trades, marketCondition, limit),
      [`trades_${tradesHash}`, `market_${marketCondition}`]
    );
  },

  // Cached pattern confluence analysis
  async analyzePatternConfluenceWithMarketConditions(trades: Trade[]): Promise<Record<string, { averageConfluence: number; successRate: number }>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `pattern_confluence_market_${tradesHash}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.analyzePatternConfluenceWithMarketConditions(trades),
      [`trades_${tradesHash}`]
    );
  },

  // Cached pattern recommendations
  async getPatternRecommendations(
    trades: Trade[], 
    marketCondition: string,
    timeframe?: string
  ): Promise<Array<{ patternType: PatternType; confidence: number; reason: string }>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `pattern_recommendations_${marketCondition}_${timeframe || 'all'}_${tradesHash}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => patternRecognitionService.getPatternRecommendations(trades, marketCondition, timeframe),
      [`trades_${tradesHash}`, `market_${marketCondition}`]
    );
  },

  // Batch calculate multiple pattern analytics
  async batchCalculatePatternAnalytics(
    patternTypes: PatternType[], 
    trades: Trade[]
  ): Promise<Record<PatternType, PatternAnalytics>> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    
    const operations = patternTypes.map(patternType => ({
      key: CacheKeys.patternAnalytics(patternType, tradesHash),
      computeFn: () => patternRecognitionService.calculatePatternPerformance(patternType, trades),
      dependencies: [`pattern_${patternType}`, `trades_${tradesHash}`],
    }));

    const results = await analyticsCache.batchGetOrCompute(operations);
    
    return patternTypes.reduce((acc, patternType, index) => {
      acc[patternType] = results[index];
      return acc;
    }, {} as Record<PatternType, PatternAnalytics>);
  },
};

// Cached Position Management Service
export const cachedPositionManagementService = {
  ...positionManagementService,

  // Cached position management score calculation
  async calculatePositionManagementScore(trade: Trade): Promise<number> {
    const tradeVersion = this.getTradeVersion(trade);
    const cacheKey = CacheKeys.positionAnalytics(trade.id, tradeVersion);
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => positionManagementService.calculatePositionManagementScore(trade),
      [`trade_${trade.id}`]
    );
  },

  // Cached exit efficiency analysis
  async calculateExitEfficiency(trades: Trade[]): Promise<ExitAnalytics> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.exitEfficiency(tradesHash);
    
    return performanceCache.getOrComputeDebounced(
      cacheKey,
      () => positionManagementService.calculateExitEfficiency(trades),
      [`trades_${tradesHash}`]
    );
  },

  // Cached exit optimization recommendations
  async generateExitOptimizationRecommendations(trades: Trade[]): Promise<PositionRecommendations> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = `exit_optimization_${tradesHash}`;
    
    return performanceCache.getOrComputeDebounced(
      cacheKey,
      () => positionManagementService.generateExitOptimizationRecommendations(trades),
      [`trades_${tradesHash}`]
    );
  },

  // Cached scaling entry metrics
  async calculateScalingEntryMetrics(trade: Trade): Promise<{
    totalEntries: number;
    weightedAveragePrice: number;
    averageEntrySize: number;
    entrySpread: number;
    scalingEfficiency: number;
  }> {
    const tradeVersion = this.getTradeVersion(trade);
    const cacheKey = `scaling_metrics_${trade.id}_${tradeVersion}`;
    
    return analyticsCache.getOrComputeDebounced(
      cacheKey,
      () => positionManagementService.calculateScalingEntryMetrics(trade),
      [`trade_${trade.id}`]
    );
  },

  // Cached position management patterns analysis
  async analyzePositionManagementPatterns(trades: Trade[]): Promise<{
    averagePartialsPerTrade: number;
    mostCommonPartialReason: string;
    optimalPartialTiming: number;
    partialSizeDistribution: { [range: string]: number };
    scalingVsPartialPerformance: {
      scalingTrades: { count: number; avgPnL: number; avgScore: number };
      partialTrades: { count: number; avgPnL: number; avgScore: number };
      bothTrades: { count: number; avgPnL: number; avgScore: number };
    };
  }> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    const cacheKey = CacheKeys.positionManagementPatterns(tradesHash);
    
    return performanceCache.getOrComputeDebounced(
      cacheKey,
      () => positionManagementService.analyzePositionManagementPatterns(trades),
      [`trades_${tradesHash}`]
    );
  },

  // Batch calculate position scores for multiple trades
  async batchCalculatePositionScores(trades: Trade[]): Promise<Record<string, number>> {
    const operations = trades.map(trade => {
      const tradeVersion = this.getTradeVersion(trade);
      return {
        key: CacheKeys.positionAnalytics(trade.id, tradeVersion),
        computeFn: () => positionManagementService.calculatePositionManagementScore(trade),
        dependencies: [`trade_${trade.id}`],
      };
    });

    const results = await analyticsCache.batchGetOrCompute(operations);
    
    return trades.reduce((acc, trade, index) => {
      acc[trade.id] = results[index];
      return acc;
    }, {} as Record<string, number>);
  },

  // Helper method to generate trade version for caching
  private getTradeVersion(trade: Trade): number {
    // Generate a version number based on trade properties that affect position management
    const versionData = {
      partialCloses: trade.partialCloses?.length || 0,
      positionHistory: trade.positionHistory?.length || 0,
      status: trade.status,
      pnl: trade.pnl,
      updatedAt: trade.updatedAt,
    };
    
    return Math.abs(JSON.stringify(versionData).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
  },
};

// Comprehensive analytics service that combines all cached services
export const cachedAnalyticsService = {
  setup: cachedSetupClassificationService,
  pattern: cachedPatternRecognitionService,
  position: cachedPositionManagementService,

  // Clear all analytics caches
  clearAllCaches(): void {
    analyticsCache.clear();
    performanceCache.clear();
  },

  // Get cache statistics
  getCacheStats(): {
    analytics: ReturnType<typeof analyticsCache.getStats>;
    performance: ReturnType<typeof performanceCache.getStats>;
  } {
    return {
      analytics: analyticsCache.getStats(),
      performance: performanceCache.getStats(),
    };
  },

  // Preload common analytics for a set of trades
  async preloadAnalytics(trades: Trade[]): Promise<void> {
    const tradesHash = analyticsCache.getTradesHash(trades);
    
    // Preload setup analytics
    const setupTypes = Object.values(SetupType);
    await this.setup.batchCalculateSetupAnalytics(setupTypes, trades);
    
    // Preload pattern analytics
    const patternTypes = Object.values(PatternType);
    await this.pattern.batchCalculatePatternAnalytics(patternTypes, trades);
    
    // Preload position analytics
    await Promise.all([
      this.position.calculateExitEfficiency(trades),
      this.position.analyzePositionManagementPatterns(trades),
      this.position.generateExitOptimizationRecommendations(trades),
    ]);
  },

  // Invalidate caches when trades are updated
  invalidateTradesCaches(trades?: Trade[]): void {
    if (trades) {
      const tradesHash = analyticsCache.getTradesHash(trades);
      analyticsCache.clear(tradesHash);
      performanceCache.clear(tradesHash);
    } else {
      this.clearAllCaches();
    }
  },

  // Invalidate specific trade cache
  invalidateTradeCaches(tradeId: string): void {
    analyticsCache.clear(`trade_${tradeId}`);
    performanceCache.clear(`trade_${tradeId}`);
  },
};
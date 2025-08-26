/**
 * Strategy Performance Calculation Service
 * 
 * This service handles all professional performance metric calculations for trading strategies,
 * including real-time updates, statistical significance analysis, and trend detection.
 * 
 * Key Features:
 * - Professional KPI calculations (Profit Factor, Expectancy, Sharpe Ratio)
 * - Real-time performance metric updates
 * - Statistical significance determination
 * - Performance trend analysis
 * - Strategy comparison and ranking
 */

import { 
  ProfessionalStrategy, 
  StrategyPerformance, 
  MonthlyReturn, 
  StrategyComparison,
  STATISTICAL_THRESHOLDS 
} from '../types/strategy';
import { Trade } from '../types/trade';
import { cacheService } from './CacheService';
import { debounce, memoize, backgroundTaskRunner } from '../utils/performanceUtils';

/**
 * Configuration interface for performance calculations
 */
export interface PerformanceCalculationConfig {
  riskFreeRate?: number; // For Sharpe ratio calculation (default: 0.02 = 2%)
  confidenceLevel?: number; // Statistical confidence level (default: 95)
  minimumTrades?: number; // Minimum trades for significance (default: 30)
  trendAnalysisPeriods?: number; // Number of months for trend analysis (default: 6)
}

/**
 * Default configuration for performance calculations
 */
const DEFAULT_CONFIG: Required<PerformanceCalculationConfig> = {
  riskFreeRate: 0.02, // 2% annual risk-free rate
  confidenceLevel: 95,
  minimumTrades: STATISTICAL_THRESHOLDS.MINIMUM_TRADES,
  trendAnalysisPeriods: 6
};

/**
 * Core strategy performance calculation service with caching and performance optimization
 */
export class StrategyPerformanceService {
  private config: Required<PerformanceCalculationConfig>;
  private debouncedUpdateMetrics: (strategyId: string, performance: StrategyPerformance, trade: Trade) => void;
  private memoizedCalculateBasicMetrics: (trades: Trade[]) => any;
  private memoizedCalculateProfessionalKPIs: (trades: Trade[]) => any;

  constructor(config?: PerformanceCalculationConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize debounced functions for performance optimization
    this.debouncedUpdateMetrics = debounce(this.performUpdateMetrics.bind(this), 500);
    
    // Initialize memoized functions for expensive calculations
    this.memoizedCalculateBasicMetrics = memoize(
      this.calculateBasicMetrics.bind(this),
      (trades: Trade[]) => `basic_${trades.length}_${trades.map(t => t.id).join(',')}`
    );
    
    this.memoizedCalculateProfessionalKPIs = memoize(
      this.calculateProfessionalKPIs.bind(this),
      (trades: Trade[]) => `kpis_${trades.length}_${trades.map(t => `${t.id}:${t.pnl}`).join(',')}`
    );
  }

  /**
   * Calculate comprehensive professional metrics for a strategy with caching
   * 
   * @param strategyId - Strategy identifier
   * @param trades - Array of trades executed under this strategy
   * @param config - Optional configuration overrides
   * @returns Complete StrategyPerformance object
   */
  calculateProfessionalMetrics(
    strategyId: string,
    trades: Trade[],
    config?: Partial<PerformanceCalculationConfig>
  ): StrategyPerformance {
    // Check cache first
    const cacheKey = `strategy:${strategyId}:performance:${trades.length}:${this.generateTradesHash(trades)}`;
    const cachedResult = cacheService.get<StrategyPerformance>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    const calcConfig = { ...this.config, ...config };
    
    // Filter trades for this strategy and ensure they have required data
    const strategyTrades = this.filterAndValidateTrades(trades, strategyId);
    
    // Basic metrics (memoized)
    const basicMetrics = this.memoizedCalculateBasicMetrics(strategyTrades);
    
    // Professional KPIs (memoized)
    const professionalKPIs = this.memoizedCalculateProfessionalKPIs(strategyTrades);
    
    // Risk-adjusted metrics
    const riskAdjustedMetrics = this.calculateRiskAdjustedMetrics(
      strategyTrades, 
      calcConfig.riskFreeRate
    );
    
    // Statistical significance
    const statisticalSignificance = this.calculateStatisticalSignificance(
      strategyTrades.length,
      calcConfig.confidenceLevel,
      calcConfig.minimumTrades
    );
    
    // Monthly performance breakdown
    const monthlyReturns = this.calculateMonthlyReturns(strategyTrades);
    
    // Performance trend analysis
    const performanceTrend = this.generatePerformanceTrend(
      monthlyReturns,
      calcConfig.trendAnalysisPeriods
    );

    const result: StrategyPerformance = {
      // Basic metrics
      totalTrades: basicMetrics.totalTrades,
      winningTrades: basicMetrics.winningTrades,
      losingTrades: basicMetrics.losingTrades,
      
      // Professional KPIs
      profitFactor: professionalKPIs.profitFactor,
      expectancy: professionalKPIs.expectancy,
      winRate: professionalKPIs.winRate,
      averageWin: professionalKPIs.averageWin,
      averageLoss: professionalKPIs.averageLoss,
      riskRewardRatio: professionalKPIs.riskRewardRatio,
      
      // Risk-adjusted metrics
      sharpeRatio: riskAdjustedMetrics.sharpeRatio,
      maxDrawdown: riskAdjustedMetrics.maxDrawdown,
      maxDrawdownDuration: riskAdjustedMetrics.maxDrawdownDuration,
      
      // Statistical significance
      sampleSize: statisticalSignificance.sampleSize,
      confidenceLevel: statisticalSignificance.confidenceLevel,
      statisticallySignificant: statisticalSignificance.isSignificant,
      
      // Performance tracking
      monthlyReturns,
      performanceTrend,
      
      // Metadata
      lastCalculated: new Date().toISOString(),
      calculationVersion: 1
    };

    // Cache the result (5 minute TTL)
    cacheService.set(cacheKey, result, 300000);
    
    return result;
  }

  /**
   * Update performance metrics when a new trade is added (debounced for performance)
   * 
   * @param strategyId - Strategy identifier
   * @param currentPerformance - Current performance metrics
   * @param newTrade - New trade to incorporate
   * @returns Updated StrategyPerformance object
   */
  updatePerformanceMetrics(
    strategyId: string,
    currentPerformance: StrategyPerformance,
    newTrade: Trade
  ): StrategyPerformance {
    // Invalidate cache for this strategy
    cacheService.invalidatePattern(`strategy:${strategyId}:*`);
    
    // Use debounced update for performance
    this.debouncedUpdateMetrics(strategyId, currentPerformance, newTrade);
    
    // Return immediate update for UI responsiveness
    return this.performUpdateMetrics(strategyId, currentPerformance, newTrade);
  }

  /**
   * Perform the actual metrics update (called by debounced function)
   */
  private performUpdateMetrics(
    strategyId: string,
    currentPerformance: StrategyPerformance,
    newTrade: Trade
  ): StrategyPerformance {
    // For incremental updates, we need to recalculate with the new trade
    // In a real implementation, this would be optimized to avoid full recalculation
    
    // Validate the new trade
    if (!this.isValidTrade(newTrade)) {
      throw new Error(`Invalid trade data for performance update: ${newTrade.id}`);
    }

    // Create updated basic metrics
    const updatedBasics = this.updateBasicMetrics(currentPerformance, newTrade);
    
    // Update professional KPIs incrementally
    const updatedKPIs = this.updateProfessionalKPIs(currentPerformance, newTrade, updatedBasics);
    
    // Update monthly returns
    const updatedMonthlyReturns = this.updateMonthlyReturns(
      currentPerformance.monthlyReturns,
      newTrade
    );
    
    // Recalculate trend with updated monthly data
    const updatedTrend = this.generatePerformanceTrend(
      updatedMonthlyReturns,
      this.config.trendAnalysisPeriods
    );
    
    // Update statistical significance
    const updatedSignificance = this.calculateStatisticalSignificance(
      updatedBasics.totalTrades,
      this.config.confidenceLevel,
      this.config.minimumTrades
    );

    return {
      ...currentPerformance,
      
      // Updated basic metrics
      totalTrades: updatedBasics.totalTrades,
      winningTrades: updatedBasics.winningTrades,
      losingTrades: updatedBasics.losingTrades,
      
      // Updated KPIs
      profitFactor: updatedKPIs.profitFactor,
      expectancy: updatedKPIs.expectancy,
      winRate: updatedKPIs.winRate,
      averageWin: updatedKPIs.averageWin,
      averageLoss: updatedKPIs.averageLoss,
      riskRewardRatio: updatedKPIs.riskRewardRatio,
      
      // Updated statistical significance
      sampleSize: updatedSignificance.sampleSize,
      confidenceLevel: updatedSignificance.confidenceLevel,
      statisticallySignificant: updatedSignificance.isSignificant,
      
      // Updated performance tracking
      monthlyReturns: updatedMonthlyReturns,
      performanceTrend: updatedTrend,
      
      // Updated metadata
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Determine statistical significance of performance data
   * 
   * @param sampleSize - Number of trades
   * @param confidenceLevel - Desired confidence level (90, 95, 99)
   * @param minimumTrades - Minimum trades required for significance
   * @returns Statistical significance analysis
   */
  calculateStatisticalSignificance(
    sampleSize: number,
    confidenceLevel: number = this.config.confidenceLevel,
    minimumTrades: number = this.config.minimumTrades
  ): {
    sampleSize: number;
    confidenceLevel: number;
    isSignificant: boolean;
    requiredSampleSize: number;
    confidenceScore: number;
  } {
    // Basic sample size check
    const meetsMinimumRequirement = sampleSize >= minimumTrades;
    
    // Calculate confidence score based on sample size
    const confidenceScore = Math.min(100, (sampleSize / minimumTrades) * 100);
    
    // Determine if statistically significant
    const isSignificant = meetsMinimumRequirement && 
                         STATISTICAL_THRESHOLDS.CONFIDENCE_LEVELS.includes(confidenceLevel);

    return {
      sampleSize,
      confidenceLevel,
      isSignificant,
      requiredSampleSize: minimumTrades,
      confidenceScore
    };
  }

  /**
   * Generate performance trend analysis
   * 
   * @param monthlyReturns - Array of monthly performance data
   * @param analysisPeriods - Number of recent months to analyze
   * @returns Performance trend classification
   */
  generatePerformanceTrend(
    monthlyReturns: MonthlyReturn[],
    analysisPeriods: number = this.config.trendAnalysisPeriods
  ): 'Improving' | 'Declining' | 'Stable' | 'Insufficient Data' {
    if (monthlyReturns.length < 3) {
      return 'Insufficient Data';
    }

    // Get recent months for analysis
    const recentMonths = monthlyReturns
      .slice(-analysisPeriods)
      .sort((a, b) => a.month.localeCompare(b.month));

    if (recentMonths.length < 3) {
      return 'Insufficient Data';
    }

    // Calculate trend using linear regression on returns
    const trendSlope = this.calculateTrendSlope(recentMonths);
    
    // Classify trend based on slope and significance
    const significanceThreshold = 0.5; // 0.5 threshold for trend significance
    
    if (Math.abs(trendSlope) < significanceThreshold) {
      return 'Stable';
    } else if (trendSlope > 0) {
      return 'Improving';
    } else {
      return 'Declining';
    }
  }

  /**
   * Compare multiple strategies and rank them by performance
   * 
   * @param strategies - Array of strategies to compare
   * @returns Array of strategy comparisons ranked by performance
   */
  compareStrategies(strategies: ProfessionalStrategy[]): StrategyComparison[] {
    const comparisons: StrategyComparison[] = strategies.map(strategy => {
      const performance = strategy.performance;
      
      // Calculate composite score (weighted average of key metrics)
      const score = this.calculateCompositeScore(performance);
      
      // Identify strengths and weaknesses
      const analysis = this.analyzeStrategyStrengthsWeaknesses(performance);
      
      return {
        strategyId: strategy.id,
        strategyName: strategy.title,
        rank: 0, // Will be set after sorting
        score,
        metrics: {
          profitFactor: performance.profitFactor,
          expectancy: performance.expectancy,
          sharpeRatio: performance.sharpeRatio || 0,
          winRate: performance.winRate,
          maxDrawdown: performance.maxDrawdown
        },
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses
      };
    });

    // Sort by score (descending) and assign ranks
    comparisons.sort((a, b) => b.score - a.score);
    comparisons.forEach((comparison, index) => {
      comparison.rank = index + 1;
    });

    return comparisons;
  }
 
 // ===== CACHING AND PERFORMANCE HELPER METHODS =====

  /**
   * Generate a hash for trades array to use in cache keys
   */
  private generateTradesHash(trades: Trade[]): string {
    if (trades.length === 0) return 'empty';
    
    // Create a simple hash based on trade IDs and PnL values
    const hashString = trades
      .map(trade => `${trade.id}:${trade.pnl}:${trade.date}`)
      .join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Schedule background calculation for AI insights
   */
  private scheduleBackgroundInsightsCalculation(strategyId: string, trades: Trade[]): void {
    backgroundTaskRunner.addTask(
      `insights:${strategyId}`,
      async () => {
        // This would integrate with AIInsightsService when available
        console.log(`Background insights calculation for strategy ${strategyId}`);
      },
      1 // Low priority
    );
  }

  /**
   * Batch invalidate cache for multiple strategies
   */
  public invalidateStrategiesCache(strategyIds: string[]): void {
    strategyIds.forEach(strategyId => {
      cacheService.invalidatePattern(`strategy:${strategyId}:*`);
    });
  }

  /**
   * Preload performance metrics for multiple strategies
   */
  public async preloadPerformanceMetrics(
    strategies: { id: string; trades: Trade[] }[]
  ): Promise<void> {
    const loadPromises = strategies.map(({ id, trades }) => {
      return backgroundTaskRunner.addTask(
        `preload:${id}`,
        async () => {
          this.calculateProfessionalMetrics(id, trades);
        },
        2 // Medium priority
      );
    });
    
    // Don't await - let them run in background
  }

 // ===== PRIVATE HELPER METHODS =====

  /**
   * Filter and validate trades for strategy performance calculation
   */
  private filterAndValidateTrades(trades: Trade[], strategyId?: string): Trade[] {
    return trades.filter(trade => {
      // If strategyId is provided, filter by strategy
      if (strategyId && trade.strategy !== strategyId) {
        return false;
      }
      
      // Validate required fields for performance calculation
      return this.isValidTrade(trade);
    });
  }

  /**
   * Validate if a trade has required data for performance calculations
   */
  private isValidTrade(trade: Trade): boolean {
    return !!(
      trade.id &&
      trade.status === 'closed' &&
      typeof trade.pnl === 'number' &&
      trade.entryPrice &&
      trade.exitPrice &&
      trade.date
    );
  }

  /**
   * Calculate basic performance metrics
   */
  private calculateBasicMetrics(trades: Trade[]): {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
  } {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0).length;
    const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0).length;

    return {
      totalTrades,
      winningTrades,
      losingTrades
    };
  }

  /**
   * Calculate professional KPIs
   */
  private calculateProfessionalKPIs(trades: Trade[]): {
    profitFactor: number;
    expectancy: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    riskRewardRatio: number;
  } {
    if (trades.length === 0) {
      return {
        profitFactor: 0,
        expectancy: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        riskRewardRatio: 0
      };
    }

    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
    
    // Calculate gross profit and loss
    const grossProfit = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    // Calculate averages
    const averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    
    // Calculate KPIs
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    const expectancy = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / trades.length;
    const winRate = (winningTrades.length / trades.length) * 100;
    
    // Calculate average risk-reward ratio
    const riskRewardRatio = this.calculateAverageRiskReward(trades);

    return {
      profitFactor,
      expectancy,
      winRate,
      averageWin,
      averageLoss,
      riskRewardRatio
    };
  }

  /**
   * Calculate risk-adjusted metrics including Sharpe ratio and drawdown
   */
  private calculateRiskAdjustedMetrics(trades: Trade[], riskFreeRate: number): {
    sharpeRatio?: number;
    maxDrawdown: number;
    maxDrawdownDuration: number;
  } {
    if (trades.length === 0) {
      return {
        sharpeRatio: undefined,
        maxDrawdown: 0,
        maxDrawdownDuration: 0
      };
    }

    // Calculate Sharpe ratio
    const sharpeRatio = this.calculateSharpeRatio(trades, riskFreeRate);
    
    // Calculate maximum drawdown
    const drawdownAnalysis = this.calculateMaxDrawdown(trades);

    return {
      sharpeRatio,
      maxDrawdown: drawdownAnalysis.maxDrawdown,
      maxDrawdownDuration: drawdownAnalysis.maxDrawdownDuration
    };
  }

  /**
   * Calculate Sharpe ratio for the strategy
   */
  private calculateSharpeRatio(trades: Trade[], riskFreeRate: number): number | undefined {
    if (trades.length < 2) {
      return undefined;
    }

    // Calculate daily returns
    const returns = trades.map(trade => trade.pnl || 0);
    
    // Calculate average return and standard deviation
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) {
      return undefined;
    }

    // Annualize the metrics (assuming daily trading)
    const annualizedReturn = avgReturn * 252; // 252 trading days per year
    const annualizedStdDev = stdDev * Math.sqrt(252);
    
    // Calculate Sharpe ratio
    return (annualizedReturn - riskFreeRate) / annualizedStdDev;
  }

  /**
   * Calculate maximum drawdown and duration
   */
  private calculateMaxDrawdown(trades: Trade[]): {
    maxDrawdown: number;
    maxDrawdownDuration: number;
  } {
    if (trades.length === 0) {
      return { maxDrawdown: 0, maxDrawdownDuration: 0 };
    }

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let maxDrawdownDuration = 0;
    let drawdownStart: Date | null = null;

    for (const trade of sortedTrades) {
      runningBalance += trade.pnl || 0;
      
      if (runningBalance > peak) {
        peak = runningBalance;
        // End of drawdown period
        if (drawdownStart) {
          const drawdownDuration = Math.ceil(
            (new Date(trade.date).getTime() - drawdownStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          maxDrawdownDuration = Math.max(maxDrawdownDuration, drawdownDuration);
          drawdownStart = null;
        }
      } else {
        // In drawdown
        if (!drawdownStart) {
          drawdownStart = new Date(trade.date);
        }
        
        const currentDrawdown = ((peak - runningBalance) / Math.max(peak, 1)) * 100;
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      }
    }

    return { maxDrawdown, maxDrawdownDuration };
  }

  /**
   * Calculate average risk-reward ratio from trades
   */
  private calculateAverageRiskReward(trades: Trade[]): number {
    const tradesWithRR = trades.filter(trade => trade.rMultiple && trade.rMultiple !== 0);
    
    if (tradesWithRR.length === 0) {
      // Fallback calculation using stop loss and take profit
      const calculatedRR = trades
        .filter(trade => trade.stopLoss && trade.takeProfit && trade.entryPrice)
        .map(trade => {
          const risk = Math.abs(trade.entryPrice! - trade.stopLoss!);
          const reward = Math.abs(trade.takeProfit! - trade.entryPrice!);
          return risk > 0 ? reward / risk : 0;
        })
        .filter(rr => rr > 0);
      
      return calculatedRR.length > 0 
        ? calculatedRR.reduce((sum, rr) => sum + rr, 0) / calculatedRR.length 
        : 0;
    }

    return tradesWithRR.reduce((sum, trade) => sum + (trade.rMultiple || 0), 0) / tradesWithRR.length;
  }

  /**
   * Calculate monthly returns breakdown
   */
  private calculateMonthlyReturns(trades: Trade[]): MonthlyReturn[] {
    if (trades.length === 0) {
      return [];
    }

    // Group trades by month
    const monthlyGroups = new Map<string, Trade[]>();
    
    trades.forEach(trade => {
      const month = trade.date.substring(0, 7); // YYYY-MM format
      if (!monthlyGroups.has(month)) {
        monthlyGroups.set(month, []);
      }
      monthlyGroups.get(month)!.push(trade);
    });

    // Calculate metrics for each month
    const monthlyReturns: MonthlyReturn[] = [];
    
    for (const [month, monthTrades] of monthlyGroups) {
      const totalReturn = monthTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = monthTrades.filter(trade => (trade.pnl || 0) > 0).length;
      const winRate = (winningTrades / monthTrades.length) * 100;
      
      // Calculate monthly profit factor
      const grossProfit = monthTrades
        .filter(trade => (trade.pnl || 0) > 0)
        .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const grossLoss = Math.abs(monthTrades
        .filter(trade => (trade.pnl || 0) < 0)
        .reduce((sum, trade) => sum + (trade.pnl || 0), 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

      monthlyReturns.push({
        month,
        return: totalReturn,
        trades: monthTrades.length,
        winRate,
        profitFactor
      });
    }

    return monthlyReturns.sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Update basic metrics incrementally
   */
  private updateBasicMetrics(
    currentPerformance: StrategyPerformance,
    newTrade: Trade
  ): { totalTrades: number; winningTrades: number; losingTrades: number } {
    const isWinningTrade = (newTrade.pnl || 0) > 0;
    const isLosingTrade = (newTrade.pnl || 0) < 0;

    return {
      totalTrades: currentPerformance.totalTrades + 1,
      winningTrades: currentPerformance.winningTrades + (isWinningTrade ? 1 : 0),
      losingTrades: currentPerformance.losingTrades + (isLosingTrade ? 1 : 0)
    };
  }

  /**
   * Update professional KPIs incrementally
   */
  private updateProfessionalKPIs(
    currentPerformance: StrategyPerformance,
    newTrade: Trade,
    updatedBasics: { totalTrades: number; winningTrades: number; losingTrades: number }
  ): {
    profitFactor: number;
    expectancy: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    riskRewardRatio: number;
  } {
    const tradePnL = newTrade.pnl || 0;
    const isWinningTrade = tradePnL > 0;
    
    // Update expectancy (running average)
    const totalPnL = (currentPerformance.expectancy * currentPerformance.totalTrades) + tradePnL;
    const expectancy = totalPnL / updatedBasics.totalTrades;
    
    // Update win rate
    const winRate = (updatedBasics.winningTrades / updatedBasics.totalTrades) * 100;
    
    // Update average win/loss (running averages)
    let averageWin = currentPerformance.averageWin;
    let averageLoss = currentPerformance.averageLoss;
    
    if (isWinningTrade) {
      const previousWinTotal = currentPerformance.averageWin * currentPerformance.winningTrades;
      averageWin = (previousWinTotal + tradePnL) / updatedBasics.winningTrades;
    } else if (tradePnL < 0) {
      const previousLossTotal = currentPerformance.averageLoss * currentPerformance.losingTrades;
      averageLoss = (previousLossTotal + Math.abs(tradePnL)) / updatedBasics.losingTrades;
    }
    
    // Update profit factor
    const grossProfit = averageWin * updatedBasics.winningTrades;
    const grossLoss = averageLoss * updatedBasics.losingTrades;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    // Risk-reward ratio remains the same for incremental update
    // (would need full recalculation for accuracy)
    const riskRewardRatio = currentPerformance.riskRewardRatio;

    return {
      profitFactor,
      expectancy,
      winRate,
      averageWin,
      averageLoss,
      riskRewardRatio
    };
  }

  /**
   * Update monthly returns with new trade
   */
  private updateMonthlyReturns(
    currentMonthlyReturns: MonthlyReturn[],
    newTrade: Trade
  ): MonthlyReturn[] {
    const tradeMonth = newTrade.date.substring(0, 7); // YYYY-MM format
    const tradePnL = newTrade.pnl || 0;
    const isWinningTrade = tradePnL > 0;
    
    // Find existing month or create new one
    const monthlyReturns = [...currentMonthlyReturns];
    const existingMonthIndex = monthlyReturns.findIndex(mr => mr.month === tradeMonth);
    
    if (existingMonthIndex >= 0) {
      // Update existing month
      const existingMonth = monthlyReturns[existingMonthIndex];
      const newWinningTrades = existingMonth.winRate * existingMonth.trades / 100 + (isWinningTrade ? 1 : 0);
      const newTotalTrades = existingMonth.trades + 1;
      
      monthlyReturns[existingMonthIndex] = {
        ...existingMonth,
        return: existingMonth.return + tradePnL,
        trades: newTotalTrades,
        winRate: (newWinningTrades / newTotalTrades) * 100,
        // Profit factor would need recalculation - simplified here
        profitFactor: existingMonth.profitFactor // Keep existing for incremental update
      };
    } else {
      // Create new month
      monthlyReturns.push({
        month: tradeMonth,
        return: tradePnL,
        trades: 1,
        winRate: isWinningTrade ? 100 : 0,
        profitFactor: isWinningTrade ? 999 : 0
      });
    }
    
    return monthlyReturns.sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate trend slope using linear regression
   */
  private calculateTrendSlope(monthlyReturns: MonthlyReturn[]): number {
    const n = monthlyReturns.length;
    if (n < 2) return 0;
    
    // Use month index as x, return as y
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    monthlyReturns.forEach((monthData, index) => {
      const x = index;
      const y = monthData.return;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });
    
    // Calculate slope using least squares method
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  }

  /**
   * Calculate composite performance score for strategy ranking
   */
  private calculateCompositeScore(performance: StrategyPerformance): number {
    // Weighted scoring system for strategy comparison
    const weights = {
      profitFactor: 0.25,
      expectancy: 0.20,
      winRate: 0.15,
      sharpeRatio: 0.20,
      maxDrawdown: 0.10, // Negative impact
      statisticalSignificance: 0.10
    };
    
    // Normalize metrics to 0-100 scale
    const normalizedProfitFactor = Math.min(100, performance.profitFactor * 50); // PF of 2 = 100 points
    const normalizedExpectancy = Math.max(0, Math.min(100, performance.expectancy * 10 + 50)); // Expectancy of 5 = 100 points
    const normalizedWinRate = performance.winRate; // Already 0-100
    const normalizedSharpeRatio = Math.max(0, Math.min(100, (performance.sharpeRatio || 0) * 50 + 50)); // Sharpe of 1 = 100 points
    const normalizedDrawdown = Math.max(0, 100 - performance.maxDrawdown * 2); // 50% DD = 0 points
    const significanceBonus = performance.statisticallySignificant ? 100 : 50;
    
    // Calculate weighted score
    const score = 
      normalizedProfitFactor * weights.profitFactor +
      normalizedExpectancy * weights.expectancy +
      normalizedWinRate * weights.winRate +
      normalizedSharpeRatio * weights.sharpeRatio +
      normalizedDrawdown * weights.maxDrawdown +
      significanceBonus * weights.statisticalSignificance;
    
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Analyze strategy strengths and weaknesses
   */
  private analyzeStrategyStrengthsWeaknesses(performance: StrategyPerformance): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Analyze profit factor
    if (performance.profitFactor >= 2.0) {
      strengths.push(`Excellent profit factor (${performance.profitFactor.toFixed(2)})`);
    } else if (performance.profitFactor >= 1.5) {
      strengths.push(`Good profit factor (${performance.profitFactor.toFixed(2)})`);
    } else if (performance.profitFactor < 1.0) {
      weaknesses.push(`Poor profit factor (${performance.profitFactor.toFixed(2)})`);
    }
    
    // Analyze win rate
    if (performance.winRate >= 60) {
      strengths.push(`High win rate (${performance.winRate.toFixed(1)}%)`);
    } else if (performance.winRate < 40) {
      weaknesses.push(`Low win rate (${performance.winRate.toFixed(1)}%)`);
    }
    
    // Analyze expectancy
    if (performance.expectancy > 0) {
      strengths.push(`Positive expectancy (${performance.expectancy.toFixed(2)})`);
    } else {
      weaknesses.push(`Negative expectancy (${performance.expectancy.toFixed(2)})`);
    }
    
    // Analyze Sharpe ratio
    if (performance.sharpeRatio && performance.sharpeRatio >= 1.0) {
      strengths.push(`Good risk-adjusted returns (Sharpe: ${performance.sharpeRatio.toFixed(2)})`);
    } else if (performance.sharpeRatio && performance.sharpeRatio < 0.5) {
      weaknesses.push(`Poor risk-adjusted returns (Sharpe: ${performance.sharpeRatio.toFixed(2)})`);
    }
    
    // Analyze drawdown
    if (performance.maxDrawdown <= 10) {
      strengths.push(`Low maximum drawdown (${performance.maxDrawdown.toFixed(1)}%)`);
    } else if (performance.maxDrawdown >= 25) {
      weaknesses.push(`High maximum drawdown (${performance.maxDrawdown.toFixed(1)}%)`);
    }
    
    // Analyze statistical significance
    if (performance.statisticallySignificant) {
      strengths.push(`Statistically significant results (${performance.totalTrades} trades)`);
    } else {
      weaknesses.push(`Insufficient data for statistical significance (${performance.totalTrades} trades)`);
    }
    
    // Analyze trend
    if (performance.performanceTrend === 'Improving') {
      strengths.push('Improving performance trend');
    } else if (performance.performanceTrend === 'Declining') {
      weaknesses.push('Declining performance trend');
    }
    
    return { strengths, weaknesses };
  }
}

/**
 * Factory function to create a StrategyPerformanceService instance
 */
export function createStrategyPerformanceService(
  config?: PerformanceCalculationConfig
): StrategyPerformanceService {
  return new StrategyPerformanceService(config);
}

/**
 * Utility function to validate performance calculation inputs
 */
export function validatePerformanceInputs(
  strategyId: string,
  trades: Trade[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!strategyId || strategyId.trim().length === 0) {
    errors.push('Strategy ID is required');
  }
  
  if (!Array.isArray(trades)) {
    errors.push('Trades must be an array');
  } else {
    const invalidTrades = trades.filter((trade, index) => {
      if (!trade.id) {
        errors.push(`Trade at index ${index} missing ID`);
        return true;
      }
      if (trade.status !== 'closed') {
        errors.push(`Trade ${trade.id} is not closed`);
        return true;
      }
      if (typeof trade.pnl !== 'number') {
        errors.push(`Trade ${trade.id} missing or invalid PnL`);
        return true;
      }
      return false;
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
/**
 * Trading Performance Service
 *
 * Service for calculating comprehensive trading performance metrics, currency pair analysis,
 * and risk metrics for trading performance visualization widgets.
 *
 * Key Features:
 * - Trading performance calculations with caching
 * - Currency pair breakdown analysis
 * - Risk metrics calculation
 * - Time range filtering
 * - Real-time data transformation
 */

import { Trade } from '../types/trade';
import { cacheService } from './CacheService';
import {
  PerformanceMetrics,
  CurrencyPairMetrics,
  RiskMetrics,
  ChartDataPoint,
  RiskWarning,
  TimeRange,
  PerformanceCalculationParams
} from '../types/tradingPerformance';
import { debounce } from '../utils/debounce';
import { memoize } from '../utils/performanceUtils';

/**
 * Configuration interface for trading performance calculations
 */
export interface TradingPerformanceConfig {
  riskFreeRate?: number; // For Sharpe ratio calculation (default: 0.02)
  confidenceLevel?: number; // Statistical confidence level (default: 95)
  minimumRiskDataPoints?: number; // Minimum data points for risk calculations (default: 30)
  maxConcurrentCalculations?: number; // Maximum concurrent calculations (default: 10)
  cacheExpiration?: number; // Cache expiration in milliseconds (default: 5 minutes)
}

/**
 * Default configuration for trading performance calculations
 */
const DEFAULT_CONFIG: Required<TradingPerformanceConfig> = {
  riskFreeRate: 0.02, // 2% annual risk-free rate
  confidenceLevel: 95,
  minimumRiskDataPoints: 30,
  maxConcurrentCalculations: 10,
  cacheExpiration: 5 * 60 * 1000 // 5 minutes
};

/**
 * Core trading performance calculation service with caching and performance optimization
 */
export class TradingPerformanceService {
  private config: Required<TradingPerformanceConfig>;
  private debouncedCalculatePerformance: (params: PerformanceCalculationParams) => void;
  private memoizedCalculatePerformanceMetrics: (trades: Trade[]) => PerformanceMetrics;
  private memoizedCalculateCurrencyPairMetrics: (trades: Trade[]) => CurrencyPairMetrics[];
  private memoizedCalculateRiskMetrics: (trades: Trade[]) => RiskMetrics;

  constructor(config?: TradingPerformanceConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize debounced functions for performance optimization
    this.debouncedCalculatePerformance = debounce(
      this.performCalculation.bind(this),
      300
    );

    // Initialize memoized functions for expensive calculations
    this.memoizedCalculatePerformanceMetrics = memoize(
      this.calculatePerformanceMetrics.bind(this),
      (trades: Trade[]) => this.generateTradesHash(trades, 'performance')
    );

    this.memoizedCalculateCurrencyPairMetrics = memoize(
      this.calculateCurrencyPairMetrics.bind(this),
      (trades: Trade[]) => this.generateTradesHash(trades, 'currency-pair')
    );

    this.memoizedCalculateRiskMetrics = memoize(
      this.calculateRiskMetrics.bind(this),
      (trades: Trade[]) => this.generateTradesHash(trades, 'risk')
    );
  }

  /**
   * Calculate comprehensive trading performance metrics for a set of trades
   *
   * @param params - Calculation parameters including trades, time range, and currency filters
   * @returns Performance metrics object
   */
  calculatePerformance(
    params: PerformanceCalculationParams
  ): PerformanceMetrics {
    // Check cache first
    const cacheKey = this.generateCacheKey('performance', params);
    const cachedResult = cacheService.get<PerformanceMetrics>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Filter and validate trades
    const filteredTrades = this.filterAndValidateTrades(params);

    // Calculate performance metrics
    const metrics = this.memoizedCalculatePerformanceMetrics(filteredTrades);

    // Cache the result
    cacheService.set(cacheKey, metrics, this.config.cacheExpiration);

    return metrics;
  }

  /**
   * Calculate currency pair breakdown performance
   *
   * @param params - Calculation parameters
   * @returns Array of currency pair performance metrics
   */
  calculateCurrencyPairPerformance(
    params: PerformanceCalculationParams
  ): CurrencyPairMetrics[] {
    const cacheKey = this.generateCacheKey('currency-pair', params);
    const cachedResult = cacheService.get<CurrencyPairMetrics[]>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const filteredTrades = this.filterAndValidateTrades(params);
    const metrics = this.memoizedCalculateCurrencyPairMetrics(filteredTrades);

    cacheService.set(cacheKey, metrics, this.config.cacheExpiration);
    return metrics;
  }

  /**
   * Calculate comprehensive risk metrics
   *
   * @param params - Calculation parameters
   * @returns Risk metrics object
   */
  calculateRiskPerformance(
    params: PerformanceCalculationParams
  ): RiskMetrics {
    const cacheKey = this.generateCacheKey('risk', params);
    const cachedResult = cacheService.get<RiskMetrics>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const filteredTrades = this.filterAndValidateTrades(params);
    const metrics = this.memoizedCalculateRiskMetrics(filteredTrades);

    cacheService.set(cacheKey, metrics, this.config.cacheExpiration);
    return metrics;
  }

  /**
   * Transform trading data into chart-ready format
   *
   * @param trades - Array of trades
   * @param period - Chart period (daily, weekly, monthly)
   * @param timeRange - Time range filter
   * @returns Array of chart data points
   */
  transformToChartData(
    trades: Trade[],
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    timeRange?: TimeRange
  ): ChartDataPoint[] {
    const cacheKey = this.generateTradesHash(trades, `chart-${period}-${timeRange || 'all'}`);
    const cachedResult = cacheService.get<ChartDataPoint[]>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Filter trades by time range
    const filteredTrades = this.filterTradesByTimeRange(trades, timeRange);
    const result = this.generateChartData(filteredTrades, period);

    cacheService.set(cacheKey, result, this.config.cacheExpiration);
    return result;
  }

  /**
   * Calculate performance metrics directly from trades
   */
  private calculatePerformanceMetrics(trades: Trade[]): PerformanceMetrics {
    if (trades.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    // Filter closed trades with valid PnL
    const validTrades = trades.filter(trade =>
      trade.status === 'closed' && typeof trade.pnl === 'number'
    );

    if (validTrades.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    // Basic metrics
    const totalTrades = validTrades.length;
    const winningTrades = validTrades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = validTrades.filter(t => (t.pnl || 0) < 0).length;
    const winRate = (winningTrades / totalTrades) * 100;

    // P&L metrics
    const totalPnL = validTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningPnl = validTrades
      .filter(t => (t.pnl || 0) > 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0);
    const losingPnl = Math.abs(validTrades
      .filter(t => (t.pnl || 0) < 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0));

    // Profit factor and expectancy
    const profitFactor = losingPnl > 0 ? winningPnl / losingPnl : winningPnl > 0 ? 999 : 0;
    const tradeExpectancy = totalPnL / totalTrades;

    // Winning and losing averages
    const avgWin = winningTrades > 0 ? winningPnl / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? losingPnl / losingTrades : 0;

    // Zella score (simplified composite metric)
    const zellaScore = this.calculateZellaScore(profitFactor, winRate, tradeExpectancy);

    // Advanced metrics
    const avgRMultiple = this.calculateAverageMultiple(validTrades);
    const totalPips = validTrades.reduce((sum, t) => sum + (t.pips || 0), 0);
    const totalCommission = validTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
    const totalCommissionPercentage = totalCommission !== 0 && totalPnL !== 0 ?
      (totalCommission / Math.abs(totalPnL)) * 100 : 0;

    // Risk metrics
    const recoveries = this.calculateRecoveryFactor(totalPnL, validTrades);
    const { maxDrawdown, maxDrawdownPercentage } = this.calculateDrawdown(validTrades);

    // Sharpe and other ratios
    const returns = validTrades.map(t => t.pnl || 0);
    const sharpeRatio = this.calculateSharpeRatio(returns, validTrades.length);
    const sortinoRatio = this.calculateSortinoRatio(returns);
    const calmarRatio = this.calculateCalmarRatio(totalPnL, maxDrawdownPercentage);

    // Statistical measures
    const standardDeviation = this.calculateStandardDeviation(returns);

    // Win streak analysis
    const { currentWinStreak, longestWinStreak, currentLossStreak, longestLossStreak } =
      this.calculateWinStreakAnalysis(validTrades);

    // Best/worst trades
    const sortedTrades = [...validTrades].sort((a, b) => (a.pnl || 0) - (b.pnl || 0));
    const worstTrade = sortedTrades[0]?.pnl || 0;
    const bestTrade = sortedTrades[sortedTrades.length - 1]?.pnl || 0;

    // Duration analysis
    const averageTradeDuration = this.calculateAverageDuration(validTrades);

    return {
      // Basic metrics
      netPnL: totalPnL,
      totalTrades,
      tradeExpectancy,
      profitFactor,
      winRate,
      avgWin,
      avgLoss,
      zellaScore,

      // Trading statistics
      winningTrades,
      losingTrades,

      // Extended metrics
      totalPips,
      totalCommission,
      totalCommissionPercentage,
      averageRMultiple,

      // Risk-adjusted performance
      recoveryFactor: recoveries,
      maxDrawdown: maxDrawdownPercentage,
      maxDrawdownPercentage,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      standardDeviation,

      // Additional statistics
      averageTradeDuration,
      bestTrade,
      worstTrade,

      // Win streak analysis
      currentWinStreak,
      longestWinStreak,
      currentLossStreak,
      longestLossStreak,

      // Placeholder for time-based analysis (would need more data)
      monthlyReturn: undefined,
      yearlyReturn: undefined,
      confidenceLevel95: undefined,
      averageDrawdown: undefined,
      volatility: standardDeviation,
      expectedValue: tradeExpectancy
    };
  }

  /**
   * Calculate currency pair breakdown
   */
  private calculateCurrencyPairMetrics(trades: Trade[]): CurrencyPairMetrics[] {
    const currencyPairGroups: { [currencyPair: string]: Trade[] } = {};

    // Group trades by currency pair
    trades.forEach(trade => {
      const pair = trade.currencyPair;
      if (!currencyPairGroups[pair]) {
        currencyPairGroups[pair] = [];
      }
      currencyPairGroups[pair].push(trade);
    });

    const result: CurrencyPairMetrics[] = [];

    for (const [currencyPair, pairTrades] of Object.entries(currencyPairGroups)) {
      result.push(this.calculateCurrencyPairMetric(currencyPair, pairTrades));
    }

    // Sort by total P&L descending
    return result.sort((a, b) => b.totalPnL - a.totalPnL);
  }

  /**
   * Calculate risk metrics including warnings
   */
  private calculateRiskMetrics(trades: Trade[]): RiskMetrics {
    if (trades.length === 0) {
      return this.getEmptyRiskMetrics();
    }

    const returns = trades.map(t => t.pnl || 0);
    const { maxDrawdown, maxDrawdownPercentage } = this.calculateDrawdown(trades);

    const volatility = this.calculateStandardDeviation(returns);
    const averageRiskPerTrade = this.calculateAverageRiskPerTrade(trades);
    const riskRewardRatio = this.calculateAverageRiskRewardRatio(trades);

    const sharpeRatio = this.calculateSharpeRatio(returns, trades.length);
    const sortinoRatio = this.calculateSortinoRatio(returns);
    const riskScore = this.calculateRiskScore(maxDrawdown, volatility, averageRiskPerTrade);
    const riskWarnings = this.generateRiskWarnings(maxDrawdown, volatility, trades.length, riskScore);

    return {
      maxDrawdown,
      maxDrawdownPercentage,
      currentDrawdown: maxDrawdown, // Simplified for now
      currentDrawdownPercentage: maxDrawdownPercentage,

      averageRiskPerTrade,
      averageRiskReward: riskRewardRatio,
      bestRiskReward: Math.max(...trades.map(t => Math.abs((t.pnl || 0) / (t.riskAmount || 1)))),
      worstRiskReward: Math.min(...trades.map(t => Math.abs((t.pnl || 0) / (t.riskAmount || 1)))),

      sharpeRatio,
      sortinoRatio,
      volatility,
      valueAtRisk: volatility * 1.96, // Simplified VaR at 95% confidence

      riskWarnings,
      riskScore
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Filter and validate trades based on parameters
   */
  private filterAndValidateTrades(params: PerformanceCalculationParams): Trade[] {
    let filteredTrades = params.trades.filter(trade => this.isValidTrade(trade));

    // Filter by start/end dates
    if (params.startDate || params.endDate) {
      filteredTrades = this.filterTradesByDateRange(filteredTrades, params.startDate, params.endDate);
    }

    // Filter by time range
    if (params.timeRange && params.timeRange !== 'ALL') {
      filteredTrades = this.filterTradesByTimeRange(filteredTrades, params.timeRange);
    }

    // Filter by currency pairs
    if (params.currencyPairs && params.currencyPairs.length > 0) {
      filteredTrades = filteredTrades.filter(trade =>
        params.currencyPairs!.includes(trade.currencyPair)
      );
    }

    return filteredTrades;
  }

  /**
   * Generate hash for trades array for caching
   */
  private generateTradesHash(trades: Trade[], prefix: string): string {
    if (trades.length === 0) return `${prefix}_empty`;

    // Create hash based on selected trade properties that affect calculations
    const hashData = trades.map(t =>
      `${t.id}:${t.pnl}:${t.currencyPair}:${t.date}:${t.status}`
    ).join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashData.length; i++) {
      hash = ((hash << 5) - hash) + hashData.charCodeAt(i);
      hash &= hash;
    }

    return `${prefix}_${Math.abs(hash).toString(36)}_${trades.length}`;
  }

  /**
   * Generate cache key for performance calculations
   */
  private generateCacheKey(type: string, params: PerformanceCalculationParams): string {
    const paramHash = [
      params.startDate || '',
      params.endDate || '',
      params.timeRange || '',
      JSON.stringify(params.currencyPairs || []),
      String(params.includeRiskMetrics || false)
    ].join('|');

    return `trading_performance:${type}:${this.generateTradesHash(params.trades, 'calc')}_${paramHash}`;
  }

  /**
   * Perform the actual calculation (called by debounced function)
   */
  private performCalculation(params: PerformanceCalculationParams): void {
    // This is where complex calculations would be handled
    // Currently delegated to individual methods
  }

  // ===== CALCULATION HELPERS =====

  private calculateZellaScore(profitFactor: number, winRate: number, expectancy: number): number {
    const pfScore = Math.min(100, profitFactor * 50);
    const wrScore = winRate / 100 * 100;
    const expScore = Math.max(0, Math.min(100, expectancy * 10 + 50));

    return (pfScore * 0.4) + (wrScore * 0.3) + (expScore * 0.3);
  }

  private calculateAverageMultiple(trades: Trade[]): number {
    const validMultiples = trades
      .filter(t => t.rMultiple && t.rMultiple !== 0)
      .map(t => t.rMultiple!);

    return validMultiples.length > 0 ?
      validMultiples.reduce((sum, mult) => sum + mult, 0) / validMultiples.length : 0;
  }

  private calculateRecoveryFactor(totalPnL: number, trades: Trade[]): number {
    const { maxDrawdown } = this.calculateDrawdown(trades);
    return maxDrawdown > 0 ? totalPnL / maxDrawdown : totalPnL > 0 ? 999 : 0;
  }

  private calculateDrawdown(trades: Trade[]): { maxDrawdown: number; maxDrawdownPercentage: number } {
    if (trades.length === 0) return { maxDrawdown: 0, maxDrawdownPercentage: 0 };

    let peak = 0;
    let maxDrawdown = 0;
    let runningBalance = 0;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const trade of sortedTrades) {
      runningBalance += trade.pnl || 0;

      if (runningBalance > peak) {
        peak = runningBalance;
      }

      if (peak > 0) {
        const currentDrawdown = peak - runningBalance;
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      }
    }

    const maxDrawdownPercentage = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

    return { maxDrawdown, maxDrawdownPercentage };
  }

  private calculateSharpeRatio(returns: number[], sampleSize: number): number | undefined {
    if (returns.length < 2) return undefined;

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = this.calculateStandardDeviation(returns);

    if (volatility === 0) return undefined;

    // Annualize metrics (assuming daily trading)
    const annualizedReturn = avgReturn * 252;
    const annualizedVolatility = volatility * Math.sqrt(252);

    return (annualizedReturn - this.config.riskFreeRate) / annualizedVolatility;
  }

  private calculateSortinoRatio(returns: number[]): number | undefined {
    if (returns.length < 2) return undefined;

    // Sortino ratio uses downside deviation (only negative returns)
    const negativeReturns = returns.filter(ret => ret < 0);
    if (negativeReturns.length === 0) return undefined;

    const downsideDeviation = Math.sqrt(
      negativeReturns.reduce((sum, ret) => sum + ret * ret, 0) / negativeReturns.length
    );

    if (downsideDeviation === 0) return undefined;

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const annualizedReturn = avgReturn * 252;
    const annualizedDownsideVolatility = downsideDeviation * Math.sqrt(252);

    return (annualizedReturn - this.config.riskFreeRate) / annualizedDownsideVolatility;
  }

  private calculateCalmarRatio(totalPnL: number, maxDrawdownPercentage: number): number | undefined {
    if (maxDrawdownPercentage === 0) return totalPnL > 0 ? 999 : undefined;
    return (totalPnL * 12) / maxDrawdownPercentage; // Annualized
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (values.length - 1);

    return Math.sqrt(avgSquaredDiff);
  }

  private calculateWinStreakAnalysis(trades: Trade[]): {
    currentWinStreak: number;
    longestWinStreak: number;
    currentLossStreak: number;
    longestLossStreak: number;
  } {
    let currentWinStreak = 0;
    let longestWinStreak = 0;
    let currentLossStreak = 0;
    let longestLossStreak = 0;
    let winStreak = 0;
    let lossStreak = 0;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const trade of sortedTrades) {
      if ((trade.pnl || 0) > 0) {
        winStreak++;
        lossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, winStreak);
      } else if ((trade.pnl || 0) < 0) {
        lossStreak++;
        winStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, lossStreak);
      } else {
        winStreak++;
        lossStreak++;
      }

      currentWinStreak = winStreak;
      currentLossStreak = lossStreak;
    }

    return {
      currentWinStreak,
      longestWinStreak,
      currentLossStreak,
      longestLossStreak
    };
  }

  private calculateAverageRiskPerTrade(trades: Trade[]): number {
    const tradesWithRisk = trades.filter(t => t.riskAmount && t.riskAmount > 0);
    return tradesWithRisk.length > 0 ?
      tradesWithRisk.reduce((sum, t) => sum + t.riskAmount!, 0) / tradesWithRisk.length : 0;
  }

  private calculateAverageRiskRewardRatio(trades: Trade[]): number {
    return this.calculateAverageMultiple(trades);
  }

  private calculateRiskScore(maxDrawdown: number, volatility: number, averageRisk: number): number {
    // Lower risk scores are better (0-100, where 100 is lowest risk)
    const drawdownScore = Math.max(0, 100 - maxDrawdown * 2);
    const volatilityScore = Math.max(0, 100 - volatility * 10);
    const riskScore = averageRisk > 0 ? Math.min(100, 10000 / averageRisk) : 0;

    return (drawdownScore * 0.4) + (volatilityScore * 0.4) + (riskScore * 0.2);
  }

  private calculateAverageDuration(trades: Trade[]): number | undefined {
    const tradesWithDuration = trades.filter(t => t.timeIn && t.timeOut);

    if (tradesWithDuration.length === 0) return undefined;

    return tradesWithDuration.reduce((sum, t) => {
      const duration = new Date(t.timeOut!).getTime() - new Date(t.timeIn!).getTime();
      return sum + duration;
    }, 0) / tradesWithDuration.length;
  }

  private calculateCurrencyPairMetric(currencyPair: string, trades: Trade[]): CurrencyPairMetrics {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalPips = closedTrades.reduce((sum, t) => sum + (t.pips || 0), 0);

    const winningPnl = closedTrades
      .filter(t => (t.pnl || 0) > 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0);
    const losingPnl = Math.abs(closedTrades
      .filter(t => (t.pnl || 0) < 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0));

    const profitFactor = losingPnl > 0 ? winningPnl / losingPnl : winningPnl > 0 ? 999 : 0;
    const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
    const averagePip = totalTrades > 0 ? totalPips / totalTrades : 0;

    const sortedTrades = [...closedTrades].sort((a, b) => (a.pnl || 0) - (b.pnl || 0));
    const largestWin = sortedTrades.length > 0 ? sortedTrades[sortedTrades.length - 1]?.pnl || 0 : 0;
    const largestLoss = sortedTrades.length > 0 ? sortedTrades[0]?.pnl || 0 : 0;
    const averageRMultiple = this.calculateAverageMultiple(closedTrades);

    // Long/short analysis
    const longTrades = closedTrades.filter(t => t.side === 'long').length;
    const shortTrades = closedTrades.filter(t => t.side === 'short').length;

    const longWinTrades = closedTrades.filter(t => t.side === 'long' && (t.pnl || 0) > 0).length;
    const shortWinTrades = closedTrades.filter(t => t.side === 'short' && (t.pnl || 0) > 0).length;
    const longWinRate = longTrades > 0 ? (longWinTrades / longTrades) * 100 : 0;
    const shortWinRate = shortTrades > 0 ? (shortWinTrades / shortTrades) * 100 : 0;

    const averageHoldTime = this.calculateAverageDuration(closedTrades);
    const sessionPerformance = this.calculateSessionPerformance(closedTrades);
    const strategyPerformance = this.calculateStrategyPerformance(closedTrades);

    return {
      currencyPair,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnL,
      totalPips,
      averagePnL,
      averagePip,
      largestWin,
      largestLoss,
      profitFactor,
      averageRMultiple,
      longTrades,
      shortTrades,
      longWinRate,
      shortWinRate,
      averageHoldTime,
      sessionPerformance,
      strategyPerformance
    };
  }

  private calculateSessionPerformance(trades: Trade[]): CurrencyPairMetrics['sessionPerformance'] {
    // Simplified session performance calculation
    const sessions = {
      asian: { trades: 0, winRate: 0, pnl: 0 },
      european: { trades: 0, winRate: 0, pnl: 0 },
      us: { trades: 0, winRate: 0, pnl: 0 },
      overlap: { trades: 0, winRate: 0, pnl: 0 }
    };

    // This would need actual session timing logic based on trade times
    // For now, return simplified structure
    return sessions as CurrencyPairMetrics['sessionPerformance'];
  }

  private calculateStrategyPerformance(trades: Trade[]): { [strategy: string]: { trades: number; winRate: number; pnl: number } } {
    const strategyGroups: { [strategy: string]: Trade[] } = {};

    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      if (!strategyGroups[strategy]) {
        strategyGroups[strategy] = [];
      }
      strategyGroups[strategy].push(trade);
    });

    const result: { [strategy: string]: { trades: number; winRate: number; pnl: number } } = {};

    for (const [strategy, strategyTrades] of Object.entries(strategyGroups)) {
      const strategyWinningTrades = strategyTrades.filter(t => (t.pnl || 0) > 0).length;
      const strategyTotalTrades = strategyTrades.length;
      const strategyWinRate = strategyTotalTrades > 0 ? (strategyWinningTrades / strategyTotalTrades) * 100 : 0;
      const strategyPnL = strategyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

      result[strategy] = {
        trades: strategyTotalTrades,
        winRate: strategyWinRate,
        pnl: strategyPnL
      };
    }

    return result;
  }

  private generateChartData(trades: Trade[], period: 'daily' | 'weekly' | 'monthly'): ChartDataPoint[] {
    // Group trades by period and aggregate
    const periodGroups: { [key: string]: { trades: Trade[]; totalPnL: number } } = {};

    trades.forEach(trade => {
      const periodKey = this.getPeriodKey(trade.date, period);

      if (!periodGroups[periodKey]) {
        periodGroups[periodKey] = { trades: [], totalPnL: 0 };
      }

      periodGroups[periodKey].trades.push(trade);
      periodGroups[periodKey].totalPnL += trade.pnl || 0;
    });

    let cumulativePnL = 0;
    const chartData: ChartDataPoint[] = [];

    // Sort period keys chronologically
    const sortedKeys = Object.keys(periodGroups).sort();

    sortedKeys.forEach(key => {
      const group = periodGroups[key];
      if (!group) return;

      cumulativePnL += group.totalPnL;
      const winningTrades = group.trades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = group.trades.length > 0 ? (winningTrades / group.trades.length) * 100 : 0;
      const pipMovement = group.trades.reduce((sum, t) => sum + (t.pips || 0), 0);

      chartData.push({
        date: key,
        value: group.totalPnL,
        pnl: group.totalPnL,
        trades: group.trades.length,
        winRate,
        pipMovement,
        cumulativePnL,
        placement: group.trades.length === 0 ? 'start' : group.trades.length > 10 ? 'end' : 'middle'
      });
    });

    return chartData;
  }

  private getPeriodKey(date: string, period: 'daily' | 'weekly' | 'monthly'): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');

    if (period === 'daily') {
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else if (period === 'weekly') {
      const week = Math.ceil(d.getDate() / 7);
      return `${year}-W${String(week).padStart(2, '0')}`;
    } else { // monthly
      return `${year}-${month}`;
    }
  }

  private generateRiskWarnings(
    maxDrawdown: number,
    volatility: number,
    tradeCount: number,
    riskScore: number
  ): RiskWarning[] {
    const warnings: RiskWarning[] = [];

    // Drawdown warnings
    if (maxDrawdown >= 10) {
      warnings.push({
        id: 'high_drawdown',
        level: maxDrawdown >= 20 ? 'critical' : 'high',
        message: `Maximum drawdown of ${maxDrawdown.toFixed(1)}% is ${maxDrawdown >= 20 ? 'critically high' : 'elevated'}`,
        value: maxDrawdown,
        threshold: maxDrawdown >= 20 ? 20 : 10,
        timestamp: new Date().toISOString()
      });
    }

    // Volatility warnings
    if (volatility >= 10) {
      warnings.push({
        id: 'high_volatility',
        level: volatility >= 20 ? 'critical' : 'medium',
        message: `Account volatility of ${volatility.toFixed(2)} is ${volatility >= 20 ? 'critically high' : 'elevated'}`,
        value: volatility,
        threshold: volatility >= 20 ? 20 : 10,
        timestamp: new Date().toISOString()
      });
    }

    // Sample size warnings
    if (tradeCount < this.config.minimumRiskDataPoints) {
      warnings.push({
        id: 'insufficient_data',
        level: 'medium',
        message: `Only ${tradeCount} trades available. Risk metrics may be unreliable (${this.config.minimumRiskDataPoints} minimum recommended)`,
        value: tradeCount,
        threshold: this.config.minimumRiskDataPoints,
        timestamp: new Date().toISOString()
      });
    }

    // Risk score warnings
    if (riskScore < 50) {
      warnings.push({
        id: 'high_risk_profile',
        level: riskScore < 30 ? 'critical' : 'high',
        message: `High overall risk profile detected (Score: ${riskScore.toFixed(1)}/100)`,
        value: riskScore,
        threshold: 50,
        timestamp: new Date().toISOString()
      });
    }

    return warnings;
  }

  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      // Basic metrics
      netPnL: 0,
      totalTrades: 0,
      tradeExpectancy: 0,
      profitFactor: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      zellaScore: 0,

      // Trading statistics
      winningTrades: 0,
      losingTrades: 0,

      // Extended metrics (optional)
      totalPips: 0,
      totalCommission: 0,
      totalCommissionPercentage: 0,
      averageRMultiple: 0,

      // Risk-adjusted performance
      recoveryFactor: 0,
      maxDrawdown: 0,
      maxDrawdownPercentage: 0,
      sharpeRatio: undefined,
      sortinoRatio: undefined,
      calmarRatio: undefined,
      standardDeviation: 0,

      // Additional statistics
      averageTradeDuration: undefined,
      bestTrade: 0,
      worstTrade: 0,

      // Win streak analysis
      currentWinStreak: 0,
      longestWinStreak: 0,
      currentLossStreak: 0,
      longestLossStreak: 0,

      // Placeholder for time-based analysis
      monthlyReturn: undefined,
      yearlyReturn: undefined,
      confidenceLevel95: undefined,
      averageDrawdown: 0,
      volatility: 0,
      expectedValue: 0
    };
  }

  private getEmptyRiskMetrics(): RiskMetrics {
    return {
      maxDrawdown: 0,
      maxDrawdownPercentage: 0,
      averageRiskPerTrade: 0,
      averageRiskReward: 0,
      bestRiskReward: 0,
      worstRiskReward: 0,
      sharpeRatio: undefined,
      sortinoRatio: undefined,
      volatility: 0,
      valueAtRisk: 0,
      riskWarnings: [],
      riskScore: 0
    };
  }

  // ===== FILTERING HELPER METHODS =====

  private filterTradesByTimeRange(trades: Trade[], timeRange?: TimeRange): Trade[] {
    if (!timeRange || timeRange === 'ALL') return trades;

    const daysBack = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '2Y': 730
    }[timeRange];

    if (!daysBack) return trades;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return trades.filter(trade => new Date(trade.date) >= cutoffDate);
  }

  private filterTradesByDateRange(
    trades: Trade[],
    startDate?: string,
    endDate?: string
  ): Trade[] {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);

      if (startDate && tradeDate < new Date(startDate)) return false;
      if (endDate && tradeDate > new Date(endDate)) return false;

      return true;
    });
  }

  private isValidTrade(trade: Trade): boolean {
    return !!(
      trade.id &&
      trade.status === 'closed' &&
      typeof trade.pnl === 'number' &&
      trade.currencyPair &&
      trade.date
    );
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    // Invalidate all trading performance related cache entries
    cacheService.invalidatePattern('trading_performance:*');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    hitRate: number;
    totalOperations: number;
    cacheEntries: number
  } {
    // This would need to be implemented in the cache service
    return {
      hitRate: 0,
      totalOperations: 0,
      cacheEntries: 0
    };
  }
}

/**
 * Factory function to create a TradingPerformanceService instance
 */
export function createTradingPerformanceService(
  config?: TradingPerformanceConfig
): TradingPerformanceService {
  return new TradingPerformanceService(config);
}

/**
 * Utility function to validate performance calculation inputs
 */
export function validateTradingPerformanceInputs(
  trades: Trade[],
  params?: PerformanceCalculationParams
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(trades)) {
    errors.push('Trades must be an array');
    return { isValid: false, errors };
  }

  if (trades.length === 0) {
    errors.push('At least one trade is required for performance calculations');
  }

  // Validate parameters
  if (params) {
    if (params.startDate && params.endDate && new Date(params.startDate) > new Date(params.endDate)) {
      errors.push('Start date cannot be after end date');
    }

    if (params.currencyPairs && !Array.isArray(params.currencyPairs)) {
      errors.push('Currency pairs filter must be an array');
    }
  }

  // Validate trade data
  trades.forEach((trade, index) => {
    if (!trade.currencyPair) {
      errors.push(`Trade at index ${index} missing currency pair`);
    }
    if (trade.status !== 'closed') {
      errors.push(`Trade ${trade.id || index} is not closed`);
    }
    if (typeof trade.pnl !== 'number') {
      errors.push(`Trade ${trade.id || index} missing or invalid PnL`);
    }
    if (!trade.date) {
      errors.push(`Trade ${trade.id || index} missing date`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
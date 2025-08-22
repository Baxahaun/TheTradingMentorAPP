import { Trade } from '../types/trade';
import { TagWithCount, TagPerformance, TagAnalytics, tagService } from './tagService';

export interface TagAnalyticsData {
  totalTags: number;
  averageTagsPerTrade: number;
  mostUsedTags: TagWithCount[];
  leastUsedTags: TagWithCount[];
  recentTags: TagWithCount[];
  tagPerformance: TagPerformanceMetrics[];
  topPerformingTags: TagPerformanceMetrics[];
  worstPerformingTags: TagPerformanceMetrics[];
  tagUsageOverTime: TagUsageTimeData[];
  tagCorrelations: TagCorrelation[];
}

export interface TagPerformanceMetrics {
  tag: string;
  totalTrades: number;
  winRate: number;
  averagePnL: number;
  totalPnL: number;
  profitFactor: number;
  averageHoldTime: number;
  bestTrade: number;
  worstTrade: number;
  winStreak: number;
  lossStreak: number;
  sharpeRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  consistency: number; // Percentage of profitable months/periods
}

export interface TagUsageTimeData {
  period: string; // YYYY-MM format
  tagCounts: { [tag: string]: number };
  totalTrades: number;
}

export interface TagCorrelation {
  tag1: string;
  tag2: string;
  correlation: number;
  coOccurrenceCount: number;
  tag1OnlyCount: number;
  tag2OnlyCount: number;
  bothTagsCount: number;
}

export interface TagComparisonData {
  tags: string[];
  metrics: {
    winRate: number[];
    averagePnL: number[];
    totalPnL: number[];
    profitFactor: number[];
    totalTrades: number[];
    sharpeRatio: number[];
  };
}

/**
 * Service for advanced tag analytics and performance tracking
 */
export class TagAnalyticsService {
  private static instance: TagAnalyticsService;

  private constructor() {}

  public static getInstance(): TagAnalyticsService {
    if (!TagAnalyticsService.instance) {
      TagAnalyticsService.instance = new TagAnalyticsService();
    }
    return TagAnalyticsService.instance;
  }

  /**
   * Calculate comprehensive tag analytics
   */
  public calculateTagAnalytics(trades: Trade[]): TagAnalyticsData {
    const allTags = tagService.getAllTagsWithCounts(trades);
    const tradesWithTags = trades.filter(trade => trade.tags && trade.tags.length > 0);
    
    const totalTags = allTags.length;
    const averageTagsPerTrade = tradesWithTags.length > 0 
      ? tradesWithTags.reduce((sum, trade) => sum + (trade.tags?.length || 0), 0) / tradesWithTags.length
      : 0;

    // Get most and least used tags
    const sortedByUsage = [...allTags].sort((a, b) => b.count - a.count);
    const mostUsedTags = sortedByUsage.slice(0, 10);
    const leastUsedTags = sortedByUsage.slice(-10).reverse();

    // Get recent tags
    const recentTags = tagService.getRecentTags(trades, 10);

    // Calculate detailed performance metrics for each tag
    const tagPerformance = allTags.map(tagData => 
      this.calculateDetailedTagPerformance(tagData.tag, trades)
    );

    // Get top and worst performing tags
    const sortedByWinRate = [...tagPerformance].sort((a, b) => b.winRate - a.winRate);
    const topPerformingTags = sortedByWinRate.slice(0, 10);
    const worstPerformingTags = sortedByWinRate.slice(-10).reverse();

    // Calculate tag usage over time
    const tagUsageOverTime = this.calculateTagUsageOverTime(trades);

    // Calculate tag correlations
    const tagCorrelations = this.calculateTagCorrelations(trades, allTags.map(t => t.tag));

    return {
      totalTags,
      averageTagsPerTrade,
      mostUsedTags,
      leastUsedTags,
      recentTags,
      tagPerformance,
      topPerformingTags,
      worstPerformingTags,
      tagUsageOverTime,
      tagCorrelations
    };
  }

  /**
   * Calculate detailed performance metrics for a specific tag
   */
  public calculateDetailedTagPerformance(tag: string, trades: Trade[]): TagPerformanceMetrics {
    const tagTrades = trades.filter(trade => 
      trade.tags?.some(t => tagService.normalizeTag(t) === tagService.normalizeTag(tag))
    );

    const closedTrades = tagTrades.filter(trade => trade.status === 'closed');
    const totalTrades = closedTrades.length;

    if (totalTrades === 0) {
      return {
        tag: tagService.normalizeTag(tag),
        totalTrades: 0,
        winRate: 0,
        averagePnL: 0,
        totalPnL: 0,
        profitFactor: 0,
        averageHoldTime: 0,
        bestTrade: 0,
        worstTrade: 0,
        winStreak: 0,
        lossStreak: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        recoveryFactor: 0,
        consistency: 0
      };
    }

    // Basic metrics
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
    const winRate = (winningTrades.length / totalTrades) * 100;

    const pnlValues = closedTrades.map(trade => trade.pnl || 0);
    const totalPnL = pnlValues.reduce((sum, pnl) => sum + pnl, 0);
    const averagePnL = totalPnL / totalTrades;

    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    const profitFactor = totalLosses === 0 ? (totalWins > 0 ? Infinity : 0) : totalWins / totalLosses;

    // Best and worst trades
    const bestTrade = Math.max(...pnlValues);
    const worstTrade = Math.min(...pnlValues);

    // Calculate streaks
    const { winStreak, lossStreak } = this.calculateStreaks(closedTrades);

    // Calculate average hold time
    const averageHoldTime = this.calculateAverageHoldTime(closedTrades);

    // Calculate Sharpe ratio (simplified)
    const sharpeRatio = this.calculateSharpeRatio(pnlValues);

    // Calculate max drawdown
    const maxDrawdown = this.calculateMaxDrawdown(pnlValues);

    // Calculate recovery factor
    const recoveryFactor = maxDrawdown === 0 ? 0 : totalPnL / Math.abs(maxDrawdown);

    // Calculate consistency (percentage of profitable periods)
    const consistency = this.calculateConsistency(closedTrades);

    return {
      tag: tagService.normalizeTag(tag),
      totalTrades,
      winRate,
      averagePnL,
      totalPnL,
      profitFactor,
      averageHoldTime,
      bestTrade,
      worstTrade,
      winStreak,
      lossStreak,
      sharpeRatio,
      maxDrawdown,
      recoveryFactor,
      consistency
    };
  }

  /**
   * Calculate tag usage over time
   */
  public calculateTagUsageOverTime(trades: Trade[]): TagUsageTimeData[] {
    const monthlyData: { [period: string]: { [tag: string]: number } } = {};
    const monthlyTradeCounts: { [period: string]: number } = {};

    trades.forEach(trade => {
      if (!trade.tags || trade.tags.length === 0) return;

      const period = trade.date.substring(0, 7); // YYYY-MM
      
      if (!monthlyData[period]) {
        monthlyData[period] = {};
        monthlyTradeCounts[period] = 0;
      }

      monthlyTradeCounts[period]++;

      trade.tags.forEach(tag => {
        const normalizedTag = tagService.normalizeTag(tag);
        monthlyData[period][normalizedTag] = (monthlyData[period][normalizedTag] || 0) + 1;
      });
    });

    return Object.entries(monthlyData)
      .map(([period, tagCounts]) => ({
        period,
        tagCounts,
        totalTrades: monthlyTradeCounts[period]
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Calculate correlations between tags
   */
  public calculateTagCorrelations(trades: Trade[], tags: string[]): TagCorrelation[] {
    const correlations: TagCorrelation[] = [];
    const tradesWithTags = trades.filter(trade => trade.tags && trade.tags.length > 0);

    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const tag1 = tagService.normalizeTag(tags[i]);
        const tag2 = tagService.normalizeTag(tags[j]);

        const tag1Trades = tradesWithTags.filter(trade => 
          trade.tags?.some(t => tagService.normalizeTag(t) === tag1)
        );
        const tag2Trades = tradesWithTags.filter(trade => 
          trade.tags?.some(t => tagService.normalizeTag(t) === tag2)
        );
        const bothTagsTrades = tradesWithTags.filter(trade => 
          trade.tags?.some(t => tagService.normalizeTag(t) === tag1) &&
          trade.tags?.some(t => tagService.normalizeTag(t) === tag2)
        );

        const tag1OnlyCount = tag1Trades.length - bothTagsTrades.length;
        const tag2OnlyCount = tag2Trades.length - bothTagsTrades.length;
        const bothTagsCount = bothTagsTrades.length;
        const neitherTagsCount = tradesWithTags.length - tag1OnlyCount - tag2OnlyCount - bothTagsCount;

        // Calculate correlation coefficient
        const correlation = this.calculateCorrelationCoefficient(
          tag1OnlyCount,
          tag2OnlyCount,
          bothTagsCount,
          neitherTagsCount
        );

        correlations.push({
          tag1,
          tag2,
          correlation,
          coOccurrenceCount: bothTagsCount,
          tag1OnlyCount,
          tag2OnlyCount,
          bothTagsCount
        });
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Compare performance between multiple tags
   */
  public compareTagPerformance(tags: string[], trades: Trade[]): TagComparisonData {
    const metrics = {
      winRate: [] as number[],
      averagePnL: [] as number[],
      totalPnL: [] as number[],
      profitFactor: [] as number[],
      totalTrades: [] as number[],
      sharpeRatio: [] as number[]
    };

    tags.forEach(tag => {
      const performance = this.calculateDetailedTagPerformance(tag, trades);
      metrics.winRate.push(performance.winRate);
      metrics.averagePnL.push(performance.averagePnL);
      metrics.totalPnL.push(performance.totalPnL);
      metrics.profitFactor.push(performance.profitFactor);
      metrics.totalTrades.push(performance.totalTrades);
      metrics.sharpeRatio.push(performance.sharpeRatio);
    });

    return {
      tags: tags.map(tag => tagService.normalizeTag(tag)),
      metrics
    };
  }

  /**
   * Get tag performance insights and recommendations
   */
  public getTagInsights(trades: Trade[]): {
    insights: string[];
    recommendations: string[];
    warnings: string[];
  } {
    const analytics = this.calculateTagAnalytics(trades);
    const insights: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Analyze tag usage patterns
    if (analytics.averageTagsPerTrade < 1) {
      recommendations.push("Consider adding more tags to your trades for better categorization and analysis.");
    } else if (analytics.averageTagsPerTrade > 5) {
      warnings.push("You're using many tags per trade. Consider consolidating similar tags for cleaner analysis.");
    }

    // Analyze performance patterns
    const highPerformanceTags = analytics.topPerformingTags.filter(tag => 
      tag.winRate > 60 && tag.totalTrades >= 5
    );
    
    if (highPerformanceTags.length > 0) {
      insights.push(`Your best performing tags are: ${highPerformanceTags.slice(0, 3).map(t => t.tag).join(', ')}`);
      recommendations.push("Focus on setups and conditions represented by your high-performing tags.");
    }

    const lowPerformanceTags = analytics.worstPerformingTags.filter(tag => 
      tag.winRate < 40 && tag.totalTrades >= 5
    );
    
    if (lowPerformanceTags.length > 0) {
      warnings.push(`These tags show poor performance: ${lowPerformanceTags.slice(0, 3).map(t => t.tag).join(', ')}`);
      recommendations.push("Review and potentially avoid conditions represented by poor-performing tags.");
    }

    // Analyze tag correlations
    const strongCorrelations = analytics.tagCorrelations.filter(corr => 
      Math.abs(corr.correlation) > 0.7 && corr.bothTagsCount >= 3
    );
    
    if (strongCorrelations.length > 0) {
      insights.push(`Strong correlations found between: ${strongCorrelations.slice(0, 2).map(c => `${c.tag1} & ${c.tag2}`).join(', ')}`);
    }

    return { insights, recommendations, warnings };
  }

  // Helper methods

  private calculateStreaks(trades: Trade[]): { winStreak: number; lossStreak: number } {
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));

    sortedTrades.forEach(trade => {
      const pnl = trade.pnl || 0;
      
      if (pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (pnl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    return { winStreak: maxWinStreak, lossStreak: maxLossStreak };
  }

  private calculateAverageHoldTime(trades: Trade[]): number {
    const tradesWithExitTime = trades.filter(trade => trade.timeOut);
    
    if (tradesWithExitTime.length === 0) return 0;

    const totalHoldTime = tradesWithExitTime.reduce((sum, trade) => {
      const entryTime = new Date(`${trade.date} ${trade.timeIn}`).getTime();
      const exitTime = new Date(`${trade.date} ${trade.timeOut}`).getTime();
      return sum + (exitTime - entryTime);
    }, 0);

    return totalHoldTime / tradesWithExitTime.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateSharpeRatio(pnlValues: number[]): number {
    if (pnlValues.length < 2) return 0;

    const mean = pnlValues.reduce((sum, val) => sum + val, 0) / pnlValues.length;
    const variance = pnlValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pnlValues.length;
    const stdDev = Math.sqrt(variance);

    return stdDev === 0 ? 0 : mean / stdDev;
  }

  private calculateMaxDrawdown(pnlValues: number[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;

    pnlValues.forEach(pnl => {
      runningTotal += pnl;
      peak = Math.max(peak, runningTotal);
      const drawdown = peak - runningTotal;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return maxDrawdown;
  }

  private calculateConsistency(trades: Trade[]): number {
    const monthlyPnL: { [month: string]: number } = {};

    trades.forEach(trade => {
      const month = trade.date.substring(0, 7); // YYYY-MM
      monthlyPnL[month] = (monthlyPnL[month] || 0) + (trade.pnl || 0);
    });

    const months = Object.keys(monthlyPnL);
    if (months.length === 0) return 0;

    const profitableMonths = months.filter(month => monthlyPnL[month] > 0).length;
    return (profitableMonths / months.length) * 100;
  }

  private calculateCorrelationCoefficient(
    a: number, // tag1 only
    b: number, // tag2 only  
    c: number, // both tags
    d: number  // neither tag
  ): number {
    const n = a + b + c + d;
    if (n === 0) return 0;

    const numerator = (n * c) - ((a + c) * (b + c));
    const denominator = Math.sqrt(
      (a + c) * (b + d) * (a + b) * (c + d)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

// Export singleton instance
export const tagAnalyticsService = TagAnalyticsService.getInstance();
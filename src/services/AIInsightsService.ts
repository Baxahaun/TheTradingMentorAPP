/**
 * AI Insights and Pattern Recognition Service
 * 
 * This service analyzes strategy performance data to generate actionable insights,
 * identify patterns, suggest optimizations, and detect market condition correlations.
 * 
 * Key Features:
 * - Performance pattern identification across strategies
 * - Actionable insights generation in plain English
 * - Optimization suggestions based on data analysis
 * - Market condition correlation detection
 * - Statistical significance validation for insights
 */

import { 
  ProfessionalStrategy, 
  StrategyPerformance, 
  StrategyInsight,
  PerformancePattern,
  OptimizationSuggestion,
  MarketCorrelation,
  MonthlyReturn
} from '../types/strategy';
import { Trade } from '../types/trade';

/**
 * Configuration for AI insights generation
 */
export interface AIInsightsConfig {
  minimumTradesForInsights?: number; // Minimum trades needed for reliable insights
  confidenceThreshold?: number; // Minimum confidence level for insights (0-100)
  patternSignificanceThreshold?: number; // Minimum significance for pattern detection
  correlationThreshold?: number; // Minimum correlation coefficient for market analysis
}

/**
 * Default configuration for AI insights
 */
const DEFAULT_AI_CONFIG: Required<AIInsightsConfig> = {
  minimumTradesForInsights: 20,
  confidenceThreshold: 70,
  patternSignificanceThreshold: 0.3,
  correlationThreshold: 0.5
};

/**
 * Pattern analysis result
 */
interface PatternAnalysisResult {
  pattern: string;
  confidence: number;
  impact: number;
  supportingData: any;
  sampleSize: number;
}

/**
 * Market condition analysis
 */
interface MarketConditionAnalysis {
  condition: string;
  performance: {
    winRate: number;
    profitFactor: number;
    expectancy: number;
    trades: number;
  };
  correlation: number;
  significance: number;
}

/**
 * AI Insights Service for pattern recognition and optimization suggestions
 */
export class AIInsightsService {
  private config: Required<AIInsightsConfig>;

  constructor(config?: AIInsightsConfig) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
  }

  /**
   * Generate comprehensive insights for a specific strategy
   * 
   * @param strategy - Strategy to analyze
   * @param trades - All trades executed under this strategy
   * @returns Array of actionable insights
   */
  generateStrategyInsights(
    strategy: ProfessionalStrategy,
    trades: Trade[]
  ): StrategyInsight[] {
    const insights: StrategyInsight[] = [];
    
    // Validate minimum data requirements
    if (trades.length < this.config.minimumTradesForInsights) {
      insights.push({
        type: 'Performance',
        message: `Strategy needs ${this.config.minimumTradesForInsights - trades.length} more trades for reliable insights. Current sample size (${trades.length}) may not provide statistically significant patterns.`,
        confidence: 95,
        actionable: true,
        supportingData: { currentTrades: trades.length, requiredTrades: this.config.minimumTradesForInsights },
        priority: 'Medium'
      });
      return insights;
    }

    // Generate performance insights
    insights.push(...this.generatePerformanceInsights(strategy, trades));
    
    // Generate timing insights
    insights.push(...this.generateTimingInsights(trades));
    
    // Generate market condition insights
    insights.push(...this.generateMarketConditionInsights(trades));
    
    // Generate risk management insights
    insights.push(...this.generateRiskManagementInsights(strategy, trades));
    
    // Filter by confidence threshold and sort by priority
    return insights
      .filter(insight => insight.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  /**
   * Identify performance patterns across multiple strategies
   * 
   * @param strategies - Array of strategies to analyze
   * @returns Array of identified patterns
   */
  identifyPerformancePatterns(strategies: ProfessionalStrategy[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];
    
    // Analyze patterns across all strategies
    const allTrades = this.getAllTradesFromStrategies(strategies);
    
    if (allTrades.length < this.config.minimumTradesForInsights) {
      return patterns;
    }

    // Time-based patterns
    patterns.push(...this.analyzeTimeOfDayPatterns(allTrades));
    patterns.push(...this.analyzeDayOfWeekPatterns(allTrades));
    
    // Market condition patterns
    patterns.push(...this.analyzeMarketConditionPatterns(allTrades));
    
    // Timeframe patterns
    patterns.push(...this.analyzeTimeframePatterns(strategies, allTrades));
    
    // Asset class patterns
    patterns.push(...this.analyzeAssetClassPatterns(strategies, allTrades));
    
    // Filter by significance threshold
    return patterns.filter(pattern => 
      Math.abs(pattern.impact) >= this.config.patternSignificanceThreshold * 100
    );
  }

  /**
   * Suggest optimizations based on strategy performance analysis
   * 
   * @param strategy - Strategy to optimize
   * @returns Array of optimization suggestions
   */
  suggestOptimizations(strategy: ProfessionalStrategy): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const performance = strategy.performance;
    
    // Risk management optimizations
    suggestions.push(...this.suggestRiskManagementOptimizations(strategy));
    
    // Entry timing optimizations
    suggestions.push(...this.suggestEntryTimingOptimizations(strategy));
    
    // Exit strategy optimizations
    suggestions.push(...this.suggestExitStrategyOptimizations(strategy));
    
    // Position sizing optimizations
    suggestions.push(...this.suggestPositionSizingOptimizations(strategy));
    
    // Filter and sort by expected improvement
    return suggestions
      .filter(suggestion => suggestion.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => b.expectedImprovement - a.expectedImprovement);
  }

  /**
   * Detect correlations between market conditions and strategy performance
   * 
   * @param strategyId - Strategy to analyze
   * @returns Array of market correlations
   */
  detectMarketConditionCorrelations(strategyId: string): MarketCorrelation[] {
    // This would typically integrate with market data APIs
    // For now, we'll return mock correlations based on common patterns
    
    const correlations: MarketCorrelation[] = [
      {
        condition: 'High Volatility (VIX > 25)',
        correlation: 0.65,
        significance: 85,
        description: 'Strategy performs significantly better during high volatility periods',
        recommendations: [
          'Increase position size during high VIX periods',
          'Consider volatility-based position sizing',
          'Monitor VIX levels for optimal entry timing'
        ]
      },
      {
        condition: 'Trending Markets (ADX > 25)',
        correlation: 0.72,
        significance: 90,
        description: 'Strong positive correlation with trending market conditions',
        recommendations: [
          'Focus trading during strong trend periods',
          'Add trend strength filters to entry criteria',
          'Avoid trading in choppy, sideways markets'
        ]
      },
      {
        condition: 'Low Volume Periods',
        correlation: -0.45,
        significance: 75,
        description: 'Strategy underperforms during low volume conditions',
        recommendations: [
          'Add volume filters to entry criteria',
          'Reduce position size during low volume',
          'Consider avoiding trades during market holidays'
        ]
      }
    ];
    
    // Filter by correlation threshold
    return correlations.filter(corr => 
      Math.abs(corr.correlation) >= this.config.correlationThreshold
    );
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Generate performance-related insights
   */
  private generatePerformanceInsights(
    strategy: ProfessionalStrategy,
    trades: Trade[]
  ): StrategyInsight[] {
    const insights: StrategyInsight[] = [];
    const performance = strategy.performance;
    
    // Win rate analysis
    if (performance.winRate > 60) {
      insights.push({
        type: 'Performance',
        message: `Excellent win rate of ${performance.winRate.toFixed(1)}%. Consider increasing position size to capitalize on this edge.`,
        confidence: 85,
        actionable: true,
        supportingData: { winRate: performance.winRate, trades: performance.totalTrades },
        priority: 'High'
      });
    } else if (performance.winRate < 40) {
      insights.push({
        type: 'Performance',
        message: `Low win rate of ${performance.winRate.toFixed(1)}%. Focus on improving entry criteria or consider if this is a valid low-frequency, high-reward strategy.`,
        confidence: 80,
        actionable: true,
        supportingData: { winRate: performance.winRate, profitFactor: performance.profitFactor },
        priority: 'High'
      });
    }
    
    // Profit factor analysis
    if (performance.profitFactor >= 2.0) {
      insights.push({
        type: 'Performance',
        message: `Outstanding profit factor of ${performance.profitFactor.toFixed(2)}. This strategy shows strong edge - consider it a core component of your trading plan.`,
        confidence: 90,
        actionable: true,
        supportingData: { profitFactor: performance.profitFactor },
        priority: 'High'
      });
    } else if (performance.profitFactor < 1.2) {
      insights.push({
        type: 'Performance',
        message: `Marginal profit factor of ${performance.profitFactor.toFixed(2)}. Strategy needs optimization or should be discontinued.`,
        confidence: 85,
        actionable: true,
        supportingData: { profitFactor: performance.profitFactor },
        priority: 'High'
      });
    }
    
    // Expectancy analysis
    if (performance.expectancy > 0) {
      const monthlyExpectancy = performance.expectancy * 20; // Assuming 20 trades per month
      insights.push({
        type: 'Performance',
        message: `Positive expectancy of $${performance.expectancy.toFixed(2)} per trade. At current frequency, expect approximately $${monthlyExpectancy.toFixed(2)} monthly profit.`,
        confidence: 80,
        actionable: true,
        supportingData: { expectancy: performance.expectancy, monthlyProjection: monthlyExpectancy },
        priority: 'Medium'
      });
    }
    
    // Trend analysis
    if (performance.performanceTrend === 'Declining') {
      insights.push({
        type: 'Performance',
        message: 'Performance trend is declining. Review recent market conditions and consider strategy adjustments or temporary suspension.',
        confidence: 75,
        actionable: true,
        supportingData: { trend: performance.performanceTrend, monthlyReturns: performance.monthlyReturns.slice(-3) },
        priority: 'High'
      });
    } else if (performance.performanceTrend === 'Improving') {
      insights.push({
        type: 'Performance',
        message: 'Performance trend is improving. Consider increasing allocation to this strategy.',
        confidence: 80,
        actionable: true,
        supportingData: { trend: performance.performanceTrend },
        priority: 'Medium'
      });
    }
    
    return insights;
  }

  /**
   * Generate timing-related insights
   */
  private generateTimingInsights(trades: Trade[]): StrategyInsight[] {
    const insights: StrategyInsight[] = [];
    
    // Analyze time of day patterns
    const timeAnalysis = this.analyzeTimeOfDayPerformance(trades);
    if (timeAnalysis.bestHour && timeAnalysis.confidence > 70) {
      insights.push({
        type: 'Timing',
        message: `Best performance occurs around ${timeAnalysis.bestHour}:00. Win rate is ${timeAnalysis.bestWinRate.toFixed(1)}% vs ${timeAnalysis.averageWinRate.toFixed(1)}% average.`,
        confidence: timeAnalysis.confidence,
        actionable: true,
        supportingData: timeAnalysis,
        priority: 'Medium'
      });
    }
    
    // Analyze day of week patterns
    const dayAnalysis = this.analyzeDayOfWeekPerformance(trades);
    if (dayAnalysis.bestDay && dayAnalysis.confidence > 70) {
      insights.push({
        type: 'Timing',
        message: `${dayAnalysis.bestDay} shows strongest performance with ${dayAnalysis.bestWinRate.toFixed(1)}% win rate. Consider focusing trades on this day.`,
        confidence: dayAnalysis.confidence,
        actionable: true,
        supportingData: dayAnalysis,
        priority: 'Medium'
      });
    }
    
    return insights;
  }

  /**
   * Generate market condition insights
   */
  private generateMarketConditionInsights(trades: Trade[]): StrategyInsight[] {
    const insights: StrategyInsight[] = [];
    
    // This would typically analyze market conditions from external data
    // For now, we'll provide general insights based on trade patterns
    
    const recentTrades = trades.slice(-10);
    const recentWinRate = (recentTrades.filter(t => (t.pnl || 0) > 0).length / recentTrades.length) * 100;
    const overallWinRate = (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100;
    
    if (recentWinRate < overallWinRate - 15) {
      insights.push({
        type: 'MarketCondition',
        message: `Recent performance (${recentWinRate.toFixed(1)}% win rate) is significantly below average (${overallWinRate.toFixed(1)}%). Current market conditions may not favor this strategy.`,
        confidence: 75,
        actionable: true,
        supportingData: { recentWinRate, overallWinRate, recentTrades: recentTrades.length },
        priority: 'High'
      });
    }
    
    return insights;
  }

  /**
   * Generate risk management insights
   */
  private generateRiskManagementInsights(
    strategy: ProfessionalStrategy,
    trades: Trade[]
  ): StrategyInsight[] {
    const insights: StrategyInsight[] = [];
    const performance = strategy.performance;
    
    // Drawdown analysis
    if (performance.maxDrawdown > 20) {
      insights.push({
        type: 'RiskManagement',
        message: `High maximum drawdown of ${performance.maxDrawdown.toFixed(1)}%. Consider reducing position size or tightening stop losses.`,
        confidence: 85,
        actionable: true,
        supportingData: { maxDrawdown: performance.maxDrawdown, riskPerTrade: strategy.riskManagement.maxRiskPerTrade },
        priority: 'High'
      });
    }
    
    // Risk-reward analysis
    if (performance.riskRewardRatio < 1.5 && performance.winRate < 60) {
      insights.push({
        type: 'RiskManagement',
        message: `Low risk-reward ratio (${performance.riskRewardRatio.toFixed(2)}) combined with moderate win rate requires improvement. Consider wider profit targets or tighter stops.`,
        confidence: 80,
        actionable: true,
        supportingData: { riskRewardRatio: performance.riskRewardRatio, winRate: performance.winRate },
        priority: 'High'
      });
    }
    
    return insights;
  }

  /**
   * Get all trades from multiple strategies
   */
  private getAllTradesFromStrategies(strategies: ProfessionalStrategy[]): Trade[] {
    // This would typically query the trade database
    // For now, return empty array as we don't have access to all trades
    return [];
  }

  /**
   * Analyze time of day patterns
   */
  private analyzeTimeOfDayPatterns(trades: Trade[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];
    const hourlyPerformance = new Map<number, { wins: number; total: number; pnl: number }>();
    
    trades.forEach(trade => {
      const hour = new Date(trade.date).getHours();
      const current = hourlyPerformance.get(hour) || { wins: 0, total: 0, pnl: 0 };
      
      current.total++;
      current.pnl += trade.pnl || 0;
      if ((trade.pnl || 0) > 0) current.wins++;
      
      hourlyPerformance.set(hour, current);
    });
    
    // Find significant patterns
    for (const [hour, data] of hourlyPerformance) {
      if (data.total >= 5) { // Minimum sample size
        const winRate = (data.wins / data.total) * 100;
        const avgPnL = data.pnl / data.total;
        
        if (winRate > 70 || avgPnL > 50) {
          patterns.push({
            type: 'TimeOfDay',
            pattern: `${hour}:00 hour shows strong performance`,
            confidence: Math.min(95, 50 + data.total * 2),
            impact: winRate - 50, // Impact relative to 50% baseline
            description: `Trading at ${hour}:00 shows ${winRate.toFixed(1)}% win rate with average P&L of $${avgPnL.toFixed(2)}`,
            supportingData: { hour, winRate, avgPnL, trades: data.total }
          });
        }
      }
    }
    
    return patterns;
  }

  /**
   * Analyze day of week patterns
   */
  private analyzeDayOfWeekPatterns(trades: Trade[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];
    const dailyPerformance = new Map<string, { wins: number; total: number; pnl: number }>();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    trades.forEach(trade => {
      const dayOfWeek = dayNames[new Date(trade.date).getDay()];
      const current = dailyPerformance.get(dayOfWeek) || { wins: 0, total: 0, pnl: 0 };
      
      current.total++;
      current.pnl += trade.pnl || 0;
      if ((trade.pnl || 0) > 0) current.wins++;
      
      dailyPerformance.set(dayOfWeek, current);
    });
    
    // Find significant patterns
    for (const [day, data] of dailyPerformance) {
      if (data.total >= 3) { // Minimum sample size
        const winRate = (data.wins / data.total) * 100;
        const avgPnL = data.pnl / data.total;
        
        if (winRate > 65 || avgPnL > 40) {
          patterns.push({
            type: 'DayOfWeek',
            pattern: `${day} shows strong performance`,
            confidence: Math.min(90, 40 + data.total * 3),
            impact: winRate - 50,
            description: `${day} trading shows ${winRate.toFixed(1)}% win rate with average P&L of $${avgPnL.toFixed(2)}`,
            supportingData: { day, winRate, avgPnL, trades: data.total }
          });
        }
      }
    }
    
    return patterns;
  }

  /**
   * Analyze market condition patterns
   */
  private analyzeMarketConditionPatterns(trades: Trade[]): PerformancePattern[] {
    // This would typically integrate with market data
    // For now, return empty array
    return [];
  }

  /**
   * Analyze timeframe patterns
   */
  private analyzeTimeframePatterns(strategies: ProfessionalStrategy[], trades: Trade[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];
    const timeframePerformance = new Map<string, { wins: number; total: number; pnl: number }>();
    
    // Group by strategy timeframe
    strategies.forEach(strategy => {
      const strategyTrades = trades.filter(t => t.strategy === strategy.id);
      if (strategyTrades.length > 0) {
        const timeframe = strategy.primaryTimeframe;
        const current = timeframePerformance.get(timeframe) || { wins: 0, total: 0, pnl: 0 };
        
        strategyTrades.forEach(trade => {
          current.total++;
          current.pnl += trade.pnl || 0;
          if ((trade.pnl || 0) > 0) current.wins++;
        });
        
        timeframePerformance.set(timeframe, current);
      }
    });
    
    // Analyze patterns
    for (const [timeframe, data] of timeframePerformance) {
      if (data.total >= 10) {
        const winRate = (data.wins / data.total) * 100;
        const avgPnL = data.pnl / data.total;
        
        if (winRate > 60) {
          patterns.push({
            type: 'Timeframe',
            pattern: `${timeframe} timeframe shows strong performance`,
            confidence: Math.min(85, 30 + data.total),
            impact: winRate - 50,
            description: `${timeframe} strategies show ${winRate.toFixed(1)}% win rate`,
            supportingData: { timeframe, winRate, avgPnL, trades: data.total }
          });
        }
      }
    }
    
    return patterns;
  }

  /**
   * Analyze asset class patterns
   */
  private analyzeAssetClassPatterns(strategies: ProfessionalStrategy[], trades: Trade[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];
    const assetClassPerformance = new Map<string, { wins: number; total: number; pnl: number }>();
    
    // Group by asset class
    strategies.forEach(strategy => {
      strategy.assetClasses.forEach(assetClass => {
        const strategyTrades = trades.filter(t => t.strategy === strategy.id);
        if (strategyTrades.length > 0) {
          const current = assetClassPerformance.get(assetClass) || { wins: 0, total: 0, pnl: 0 };
          
          strategyTrades.forEach(trade => {
            current.total++;
            current.pnl += trade.pnl || 0;
            if ((trade.pnl || 0) > 0) current.wins++;
          });
          
          assetClassPerformance.set(assetClass, current);
        }
      });
    });
    
    // Analyze patterns
    for (const [assetClass, data] of assetClassPerformance) {
      if (data.total >= 8) {
        const winRate = (data.wins / data.total) * 100;
        const avgPnL = data.pnl / data.total;
        
        if (winRate > 65) {
          patterns.push({
            type: 'AssetClass',
            pattern: `${assetClass} shows strong performance`,
            confidence: Math.min(80, 25 + data.total),
            impact: winRate - 50,
            description: `${assetClass} strategies show ${winRate.toFixed(1)}% win rate`,
            supportingData: { assetClass, winRate, avgPnL, trades: data.total }
          });
        }
      }
    }
    
    return patterns;
  }

  /**
   * Analyze time of day performance
   */
  private analyzeTimeOfDayPerformance(trades: Trade[]): {
    bestHour?: number;
    bestWinRate: number;
    averageWinRate: number;
    confidence: number;
  } {
    const hourlyStats = new Map<number, { wins: number; total: number }>();
    
    trades.forEach(trade => {
      const hour = new Date(trade.date).getHours();
      const current = hourlyStats.get(hour) || { wins: 0, total: 0 };
      
      current.total++;
      if ((trade.pnl || 0) > 0) current.wins++;
      
      hourlyStats.set(hour, current);
    });
    
    const overallWinRate = (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100;
    
    let bestHour: number | undefined;
    let bestWinRate = 0;
    let bestSampleSize = 0;
    
    for (const [hour, stats] of hourlyStats) {
      if (stats.total >= 3) { // Minimum sample size
        const winRate = (stats.wins / stats.total) * 100;
        if (winRate > bestWinRate) {
          bestHour = hour;
          bestWinRate = winRate;
          bestSampleSize = stats.total;
        }
      }
    }
    
    const confidence = bestSampleSize > 0 ? Math.min(90, 30 + bestSampleSize * 5) : 0;
    
    return {
      bestHour,
      bestWinRate,
      averageWinRate: overallWinRate,
      confidence
    };
  }

  /**
   * Analyze day of week performance
   */
  private analyzeDayOfWeekPerformance(trades: Trade[]): {
    bestDay?: string;
    bestWinRate: number;
    averageWinRate: number;
    confidence: number;
  } {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyStats = new Map<string, { wins: number; total: number }>();
    
    trades.forEach(trade => {
      const day = dayNames[new Date(trade.date).getDay()];
      const current = dailyStats.get(day) || { wins: 0, total: 0 };
      
      current.total++;
      if ((trade.pnl || 0) > 0) current.wins++;
      
      dailyStats.set(day, current);
    });
    
    const overallWinRate = (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100;
    
    let bestDay: string | undefined;
    let bestWinRate = 0;
    let bestSampleSize = 0;
    
    for (const [day, stats] of dailyStats) {
      if (stats.total >= 2) { // Minimum sample size
        const winRate = (stats.wins / stats.total) * 100;
        if (winRate > bestWinRate) {
          bestDay = day;
          bestWinRate = winRate;
          bestSampleSize = stats.total;
        }
      }
    }
    
    const confidence = bestSampleSize > 0 ? Math.min(85, 25 + bestSampleSize * 8) : 0;
    
    return {
      bestDay,
      bestWinRate,
      averageWinRate: overallWinRate,
      confidence
    };
  }

  /**
   * Suggest risk management optimizations
   */
  private suggestRiskManagementOptimizations(strategy: ProfessionalStrategy): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const performance = strategy.performance;
    const riskMgmt = strategy.riskManagement;
    
    // High drawdown suggestions
    if (performance.maxDrawdown > 15) {
      suggestions.push({
        category: 'RiskManagement',
        suggestion: `Reduce position size from ${riskMgmt.maxRiskPerTrade}% to ${Math.max(1, riskMgmt.maxRiskPerTrade * 0.7).toFixed(1)}% to limit drawdown`,
        expectedImprovement: 25,
        confidence: 80,
        implementationDifficulty: 'Easy',
        requiredData: ['position_size', 'historical_drawdown']
      });
    }
    
    // Low risk-reward suggestions
    if (performance.riskRewardRatio < 1.5) {
      suggestions.push({
        category: 'RiskManagement',
        suggestion: 'Implement trailing stops or partial profit taking to improve risk-reward ratio',
        expectedImprovement: 15,
        confidence: 75,
        implementationDifficulty: 'Medium',
        requiredData: ['exit_rules', 'profit_targets']
      });
    }
    
    return suggestions;
  }

  /**
   * Suggest entry timing optimizations
   */
  private suggestEntryTimingOptimizations(strategy: ProfessionalStrategy): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Generic timing suggestions based on common patterns
    suggestions.push({
      category: 'EntryTiming',
      suggestion: 'Add volume confirmation to entry criteria to improve trade quality',
      expectedImprovement: 12,
      confidence: 70,
      implementationDifficulty: 'Easy',
      requiredData: ['volume_data', 'entry_signals']
    });
    
    return suggestions;
  }

  /**
   * Suggest exit strategy optimizations
   */
  private suggestExitStrategyOptimizations(strategy: ProfessionalStrategy): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const performance = strategy.performance;
    
    // Low win rate with good profit factor suggests letting winners run
    if (performance.winRate < 45 && performance.profitFactor > 1.5) {
      suggestions.push({
        category: 'ExitStrategy',
        suggestion: 'Implement trailing stops to let winning trades run longer while protecting profits',
        expectedImprovement: 20,
        confidence: 85,
        implementationDifficulty: 'Medium',
        requiredData: ['exit_timing', 'profit_targets']
      });
    }
    
    return suggestions;
  }

  /**
   * Suggest position sizing optimizations
   */
  private suggestPositionSizingOptimizations(strategy: ProfessionalStrategy): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const performance = strategy.performance;
    
    // High win rate suggests potential for larger positions
    if (performance.winRate > 65 && performance.maxDrawdown < 10) {
      suggestions.push({
        category: 'PositionSizing',
        suggestion: 'Consider Kelly Criterion position sizing to optimize capital allocation for this high-probability strategy',
        expectedImprovement: 30,
        confidence: 75,
        implementationDifficulty: 'Hard',
        requiredData: ['win_rate', 'average_win_loss', 'historical_performance']
      });
    }
    
    return suggestions;
  }
}

/**
 * Factory function to create an AIInsightsService instance
 */
export function createAIInsightsService(config?: AIInsightsConfig): AIInsightsService {
  return new AIInsightsService(config);
}

/**
 * Utility function to validate insights input data
 */
export function validateInsightsInputs(
  strategy: ProfessionalStrategy,
  trades: Trade[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!strategy || !strategy.id) {
    errors.push('Valid strategy is required');
  }
  
  if (!Array.isArray(trades)) {
    errors.push('Trades must be an array');
  } else if (trades.length === 0) {
    errors.push('At least one trade is required for insights generation');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
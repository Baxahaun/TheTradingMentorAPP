/**
 * Performance Analytics Service
 * Provides advanced performance calculations, trade comparison, and analytics insights
 * for the comprehensive trade review system.
 */

import { Trade } from '../types/trade';
import { PerformanceMetrics, TradeComparison } from '../types/tradeReview';

/**
 * Service class for calculating advanced performance metrics and trade comparisons
 */
export class PerformanceAnalyticsService {
  
  /**
   * Calculate comprehensive performance metrics for a single trade
   */
  calculateMetrics(trade: Trade): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      rMultiple: this.calculateRMultiple(trade),
      returnPercentage: this.calculateReturnPercentage(trade),
      riskRewardRatio: this.calculateRiskRewardRatio(trade),
      holdDuration: this.calculateHoldDuration(trade),
      efficiency: this.calculateEfficiency(trade)
    };

    // Add optional advanced metrics if data is available
    if (this.canCalculateSharpeRatio(trade)) {
      metrics.sharpeRatio = this.calculateSharpeRatio(trade);
    }

    if (this.canCalculateMaxDrawdown(trade)) {
      metrics.maxDrawdown = this.calculateMaxDrawdown(trade);
    }

    return metrics;
  }

  /**
   * Find trades similar to the given trade based on multiple criteria
   */
  findSimilarTrades(trade: Trade, allTrades: Trade[]): Trade[] {
    return allTrades
      .filter(t => t.id !== trade.id && t.status === 'closed')
      .map(t => ({
        trade: t,
        similarity: this.calculateSimilarityScore(trade, t)
      }))
      .filter(item => item.similarity > 0.6) // 60% similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10) // Top 10 similar trades
      .map(item => item.trade);
  }

  /**
   * Compare trade performance with similar trades
   */
  compareWithSimilar(trade: Trade, similarTrades: Trade[]): TradeComparison {
    const tradeMetrics = this.calculateMetrics(trade);
    const similarMetrics = similarTrades.map(t => this.calculateMetrics(t));
    
    const averagePerformance = this.calculateAverageMetrics(similarMetrics);
    const percentileRank = this.calculatePercentileRank(tradeMetrics, similarMetrics);
    
    return {
      similarTrades,
      averagePerformance,
      percentileRank,
      outperformanceFactors: this.identifyOutperformanceFactors(trade, tradeMetrics, averagePerformance),
      improvementSuggestions: this.generateImprovementSuggestions(trade, tradeMetrics, averagePerformance)
    };
  }

  /**
   * Generate actionable insights based on trade performance and comparison
   */
  generateInsights(trade: Trade, comparison: TradeComparison): string[] {
    const insights: string[] = [];
    const metrics = this.calculateMetrics(trade);
    
    // Performance insights
    if (metrics.rMultiple > 2) {
      insights.push("Excellent risk-reward execution with R-multiple above 2.0");
    } else if (metrics.rMultiple < 1 && trade.pnl && trade.pnl > 0) {
      insights.push("Profitable trade but risk-reward could be improved");
    }

    // Efficiency insights
    if (metrics.efficiency > 0.8) {
      insights.push("High efficiency trade - captured most of the available move");
    } else if (metrics.efficiency < 0.4) {
      insights.push("Low efficiency - consider improving entry/exit timing");
    }

    // Hold duration insights
    if (metrics.holdDuration > 24 * 7) { // More than a week
      insights.push("Long-term hold - consider if this aligns with your strategy");
    } else if (metrics.holdDuration < 1) { // Less than an hour
      insights.push("Very short hold time - scalping strategy detected");
    }

    // Comparison insights
    if (comparison.percentileRank > 75) {
      insights.push(`Top quartile performance compared to similar trades (${comparison.percentileRank.toFixed(0)}th percentile)`);
    } else if (comparison.percentileRank < 25) {
      insights.push(`Below average performance compared to similar trades (${comparison.percentileRank.toFixed(0)}th percentile)`);
    }

    // Strategy-specific insights
    if (trade.strategy) {
      insights.push(...this.generateStrategyInsights(trade, metrics));
    }

    return insights;
  }

  /**
   * Calculate benchmark performance metrics for a collection of trades
   */
  calculateBenchmarkPerformance(trades: Trade[]): PerformanceMetrics {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const allMetrics = closedTrades.map(t => this.calculateMetrics(t));
    
    return this.calculateAverageMetrics(allMetrics);
  }

  // Private helper methods

  private calculateRMultiple(trade: Trade): number {
    if (!trade.riskAmount || !trade.pnl || trade.riskAmount === 0) {
      return 0;
    }
    return trade.pnl / Math.abs(trade.riskAmount);
  }

  private calculateReturnPercentage(trade: Trade): number {
    if (!trade.pnl || !trade.riskAmount || trade.riskAmount === 0) {
      return 0;
    }
    return (trade.pnl / Math.abs(trade.riskAmount)) * 100;
  }

  private calculateRiskRewardRatio(trade: Trade): number {
    if (!trade.entryPrice || !trade.takeProfit || !trade.stopLoss) {
      return 0;
    }

    const entryPrice = trade.entryPrice;
    const takeProfit = trade.takeProfit;
    const stopLoss = trade.stopLoss;

    let reward: number;
    let risk: number;

    if (trade.side === 'long') {
      reward = Math.abs(takeProfit - entryPrice);
      risk = Math.abs(entryPrice - stopLoss);
    } else {
      reward = Math.abs(entryPrice - takeProfit);
      risk = Math.abs(stopLoss - entryPrice);
    }

    return risk > 0 ? reward / risk : 0;
  }

  private calculateHoldDuration(trade: Trade): number {
    if (!trade.timeOut || !trade.timeIn) {
      return 0;
    }

    const entryTime = new Date(`${trade.date} ${trade.timeIn}`).getTime();
    const exitTime = new Date(`${trade.date} ${trade.timeOut}`).getTime();
    
    // Return duration in hours
    return (exitTime - entryTime) / (1000 * 60 * 60);
  }

  private calculateEfficiency(trade: Trade): number {
    if (!trade.entryPrice || !trade.exitPrice || !trade.takeProfit || !trade.stopLoss) {
      return 0;
    }

    const entryPrice = trade.entryPrice;
    const exitPrice = trade.exitPrice;
    const takeProfit = trade.takeProfit;
    const stopLoss = trade.stopLoss;

    let actualMove: number;
    let potentialMove: number;

    if (trade.side === 'long') {
      actualMove = exitPrice - entryPrice;
      potentialMove = takeProfit - entryPrice;
    } else {
      actualMove = entryPrice - exitPrice;
      potentialMove = entryPrice - takeProfit;
    }

    if (potentialMove <= 0) return 0;
    
    // Efficiency is how much of the potential move was captured
    return Math.max(0, Math.min(1, actualMove / potentialMove));
  }

  private canCalculateSharpeRatio(trade: Trade): boolean {
    // For now, return false as we need historical return data
    // This could be implemented with a series of trades
    return false;
  }

  private calculateSharpeRatio(trade: Trade): number {
    // Placeholder implementation
    // Would need historical returns and risk-free rate
    return 0;
  }

  private canCalculateMaxDrawdown(trade: Trade): boolean {
    // Would need intraday price data or partial close information
    return trade.partialCloses && trade.partialCloses.length > 0;
  }

  private calculateMaxDrawdown(trade: Trade): number {
    if (!trade.partialCloses || trade.partialCloses.length === 0) {
      return 0;
    }

    let maxDrawdown = 0;
    let peak = 0;

    for (const partialClose of trade.partialCloses) {
      const currentPnL = partialClose.pnlRealized;
      peak = Math.max(peak, currentPnL);
      const drawdown = (peak - currentPnL) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  private calculateSimilarityScore(trade1: Trade, trade2: Trade): number {
    let score = 0;
    let factors = 0;

    // Currency pair similarity (high weight)
    if (trade1.currencyPair === trade2.currencyPair) {
      score += 0.3;
    }
    factors += 0.3;

    // Strategy similarity (high weight)
    if (trade1.strategy && trade2.strategy && trade1.strategy === trade2.strategy) {
      score += 0.25;
    }
    factors += 0.25;

    // Side similarity (medium weight)
    if (trade1.side === trade2.side) {
      score += 0.15;
    }
    factors += 0.15;

    // Timeframe similarity (medium weight)
    if (trade1.timeframe && trade2.timeframe && trade1.timeframe === trade2.timeframe) {
      score += 0.15;
    }
    factors += 0.15;

    // Market conditions similarity (medium weight)
    if (trade1.marketConditions && trade2.marketConditions && 
        trade1.marketConditions === trade2.marketConditions) {
      score += 0.1;
    }
    factors += 0.1;

    // Session similarity (low weight)
    if (trade1.session && trade2.session && trade1.session === trade2.session) {
      score += 0.05;
    }
    factors += 0.05;

    return factors > 0 ? score / factors : 0;
  }

  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    if (metrics.length === 0) {
      return {
        rMultiple: 0,
        returnPercentage: 0,
        riskRewardRatio: 0,
        holdDuration: 0,
        efficiency: 0
      };
    }

    const sum = metrics.reduce((acc, m) => ({
      rMultiple: acc.rMultiple + m.rMultiple,
      returnPercentage: acc.returnPercentage + m.returnPercentage,
      riskRewardRatio: acc.riskRewardRatio + m.riskRewardRatio,
      holdDuration: acc.holdDuration + m.holdDuration,
      efficiency: acc.efficiency + m.efficiency
    }), {
      rMultiple: 0,
      returnPercentage: 0,
      riskRewardRatio: 0,
      holdDuration: 0,
      efficiency: 0
    });

    const count = metrics.length;
    return {
      rMultiple: sum.rMultiple / count,
      returnPercentage: sum.returnPercentage / count,
      riskRewardRatio: sum.riskRewardRatio / count,
      holdDuration: sum.holdDuration / count,
      efficiency: sum.efficiency / count
    };
  }

  private calculatePercentileRank(tradeMetrics: PerformanceMetrics, similarMetrics: PerformanceMetrics[]): number {
    if (similarMetrics.length === 0) return 50;

    // Use R-multiple as the primary comparison metric
    const tradeRMultiple = tradeMetrics.rMultiple;
    const betterTrades = similarMetrics.filter(m => m.rMultiple < tradeRMultiple).length;
    
    return (betterTrades / similarMetrics.length) * 100;
  }

  private identifyOutperformanceFactors(
    trade: Trade, 
    tradeMetrics: PerformanceMetrics, 
    averageMetrics: PerformanceMetrics
  ): string[] {
    const factors: string[] = [];

    if (tradeMetrics.rMultiple > averageMetrics.rMultiple * 1.2) {
      factors.push("Superior risk-reward execution");
    }

    if (tradeMetrics.efficiency > averageMetrics.efficiency * 1.2) {
      factors.push("Excellent entry and exit timing");
    }

    if (tradeMetrics.holdDuration < averageMetrics.holdDuration * 0.8 && tradeMetrics.rMultiple > 1) {
      factors.push("Quick profitable execution");
    }

    if (trade.confidence && trade.confidence > 8) {
      factors.push("High confidence setup");
    }

    return factors;
  }

  private generateImprovementSuggestions(
    trade: Trade, 
    tradeMetrics: PerformanceMetrics, 
    averageMetrics: PerformanceMetrics
  ): string[] {
    const suggestions: string[] = [];

    if (tradeMetrics.rMultiple < averageMetrics.rMultiple * 0.8) {
      suggestions.push("Consider improving risk-reward ratio by adjusting stop loss and take profit levels");
    }

    if (tradeMetrics.efficiency < averageMetrics.efficiency * 0.8) {
      suggestions.push("Work on entry timing - consider waiting for better confirmation signals");
    }

    if (tradeMetrics.holdDuration > averageMetrics.holdDuration * 1.5 && tradeMetrics.rMultiple < 1) {
      suggestions.push("Consider cutting losses sooner to preserve capital");
    }

    if (!trade.stopLoss) {
      suggestions.push("Always use stop losses to manage risk effectively");
    }

    if (!trade.takeProfit) {
      suggestions.push("Set clear profit targets to improve trade planning");
    }

    return suggestions;
  }

  private generateStrategyInsights(trade: Trade, metrics: PerformanceMetrics): string[] {
    const insights: string[] = [];
    const strategy = trade.strategy?.toLowerCase() || '';

    if (strategy.includes('scalp')) {
      if (metrics.holdDuration > 4) {
        insights.push("Hold time longer than typical for scalping strategy");
      }
      if (metrics.rMultiple > 1.5) {
        insights.push("Excellent scalping execution with strong R-multiple");
      }
    }

    if (strategy.includes('swing')) {
      if (metrics.holdDuration < 24) {
        insights.push("Short hold time for swing trading strategy");
      }
      if (metrics.efficiency > 0.7) {
        insights.push("Good swing trade execution - captured significant move");
      }
    }

    if (strategy.includes('breakout')) {
      if (metrics.efficiency < 0.5) {
        insights.push("Breakout may have been false - consider tighter entry criteria");
      }
    }

    return insights;
  }
}
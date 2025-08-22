import { tagService, TagAnalytics, TagFilter } from './tagService';
import { Trade } from '../types/trade';

/**
 * Integration layer between TagService and the existing TradeContext
 * Provides high-level functions for tag operations in the context of the trading journal
 */

/**
 * Enhanced trade operations with tag support
 */
export class TagIntegration {
  /**
   * Processes tags when adding a new trade
   * @param trade - The trade being added
   * @returns Trade with processed tags
   */
  static processTradeForTagging(trade: Omit<Trade, 'id'>): Omit<Trade, 'id'> {
    if (!trade.tags || !Array.isArray(trade.tags)) {
      return trade;
    }

    const processedTags = tagService.processTags(trade.tags);
    
    return {
      ...trade,
      tags: processedTags
    };
  }

  /**
   * Validates trade tags before saving
   * @param trade - The trade to validate
   * @returns Validation result
   */
  static validateTradeForTagging(trade: Partial<Trade>) {
    if (!trade.tags || !Array.isArray(trade.tags)) {
      return { isValid: true, errors: [], warnings: [] };
    }

    return tagService.validateTags(trade.tags);
  }

  /**
   * Gets tag suggestions for autocomplete based on existing trades
   * @param trades - Array of existing trades
   * @param currentInput - Current tag input
   * @param limit - Maximum suggestions to return
   * @returns Array of suggested tags
   */
  static getTagSuggestionsForTrade(
    trades: Trade[], 
    currentInput: string, 
    limit: number = 10
  ): string[] {
    return tagService.getTagSuggestions(trades, currentInput, limit);
  }

  /**
   * Filters trades by tag criteria with performance optimization
   * @param trades - Array of trades to filter
   * @param filter - Tag filter criteria
   * @returns Filtered trades
   */
  static filterTradesWithTags(trades: Trade[], filter: TagFilter): Trade[] {
    // If no filter criteria, return all trades
    if (filter.includeTags.length === 0 && filter.excludeTags.length === 0) {
      return trades;
    }

    return tagService.filterTradesByTags(trades, filter);
  }

  /**
   * Gets comprehensive tag analytics for the dashboard
   * @param trades - Array of trades to analyze
   * @returns Tag analytics with additional UI-friendly data
   */
  static getTagAnalyticsForDashboard(trades: Trade[]): TagAnalytics & {
    topPerformingTags: Array<{ tag: string; winRate: number; profitFactor: number }>;
    recentlyUsedTags: Array<{ tag: string; lastUsed: string; count: number }>;
    tagUsageTrend: Array<{ date: string; tagCount: number }>;
  } {
    const baseAnalytics = tagService.getTagAnalytics(trades);
    
    // Get top performing tags (by profit factor and win rate)
    const topPerformingTags = baseAnalytics.tagPerformance
      .filter(tp => tp.totalTrades >= 3) // Only tags with sufficient data
      .sort((a, b) => {
        // Sort by profit factor first, then win rate
        if (Math.abs(b.profitFactor - a.profitFactor) > 0.1) {
          return b.profitFactor - a.profitFactor;
        }
        return b.winRate - a.winRate;
      })
      .slice(0, 5)
      .map(tp => ({
        tag: tp.tag,
        winRate: tp.winRate,
        profitFactor: tp.profitFactor
      }));

    // Get recently used tags with more details
    const recentlyUsedTags = baseAnalytics.recentTags.slice(0, 10).map(tag => ({
      tag: tag.tag,
      lastUsed: tag.lastUsed,
      count: tag.count
    }));

    // Calculate tag usage trend over time (last 30 days)
    const tagUsageTrend = this.calculateTagUsageTrend(trades, 30);

    return {
      ...baseAnalytics,
      topPerformingTags,
      recentlyUsedTags,
      tagUsageTrend
    };
  }

  /**
   * Calculates tag usage trend over time
   * @param trades - Array of trades
   * @param days - Number of days to analyze
   * @returns Daily tag usage data
   */
  private static calculateTagUsageTrend(
    trades: Trade[], 
    days: number
  ): Array<{ date: string; tagCount: number }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const dailyTagCounts: { [date: string]: Set<string> } = {};

    // Initialize all dates with empty sets
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyTagCounts[dateStr] = new Set();
    }

    // Count unique tags used each day
    trades.forEach(trade => {
      if (trade.tags && trade.tags.length > 0 && trade.date >= startDate.toISOString().split('T')[0]) {
        const dateStr = trade.date;
        if (dailyTagCounts[dateStr]) {
          trade.tags.forEach(tag => {
            dailyTagCounts[dateStr].add(tagService.normalizeTag(tag));
          });
        }
      }
    });

    // Convert to array format
    return Object.entries(dailyTagCounts)
      .map(([date, tagSet]) => ({
        date,
        tagCount: tagSet.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Bulk updates tags across multiple trades
   * @param trades - Array of trades to update
   * @param tradeIds - IDs of trades to update
   * @param tagsToAdd - Tags to add to selected trades
   * @param tagsToRemove - Tags to remove from selected trades
   * @returns Updated trades with processed tags
   */
  static bulkUpdateTradeTags(
    trades: Trade[],
    tradeIds: string[],
    tagsToAdd: string[] = [],
    tagsToRemove: string[] = []
  ): Trade[] {
    const processedTagsToAdd = tagService.processTags(tagsToAdd);
    const processedTagsToRemove = tagService.processTags(tagsToRemove);

    return trades.map(trade => {
      if (!tradeIds.includes(trade.id)) {
        return trade;
      }

      let updatedTags = [...(trade.tags || [])];

      // Remove specified tags
      processedTagsToRemove.forEach(tagToRemove => {
        updatedTags = updatedTags.filter(tag => 
          tagService.normalizeTag(tag) !== tagToRemove
        );
      });

      // Add new tags (avoiding duplicates)
      processedTagsToAdd.forEach(tagToAdd => {
        const normalizedNewTag = tagService.normalizeTag(tagToAdd);
        const hasTag = updatedTags.some(existingTag => 
          tagService.normalizeTag(existingTag) === normalizedNewTag
        );
        
        if (!hasTag) {
          updatedTags.push(tagToAdd);
        }
      });

      return {
        ...trade,
        tags: tagService.processTags(updatedTags)
      };
    });
  }

  /**
   * Gets tag-based trade recommendations
   * @param trades - Array of historical trades
   * @param currentTags - Tags being considered for a new trade
   * @returns Recommendations based on tag performance
   */
  static getTagBasedRecommendations(
    trades: Trade[],
    currentTags: string[]
  ): {
    recommendations: string[];
    warnings: string[];
    suggestedTags: string[];
    performance: { winRate: number; avgPnL: number; confidence: number };
  } {
    const processedTags = tagService.processTags(currentTags);
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const suggestedTags: string[] = [];

    if (processedTags.length === 0) {
      return {
        recommendations: ['Consider adding tags to track trade patterns'],
        warnings: [],
        suggestedTags: tagService.getMostUsedTags(trades, 5).map(t => t.tag),
        performance: { winRate: 0, avgPnL: 0, confidence: 0 }
      };
    }

    // Analyze performance of current tag combination
    const tagFilter: TagFilter = {
      includeTags: processedTags,
      excludeTags: [],
      mode: 'AND'
    };

    const similarTrades = tagService.filterTradesByTags(trades, tagFilter);
    const closedSimilarTrades = similarTrades.filter(t => t.status === 'closed');

    let winRate = 0;
    let avgPnL = 0;
    let confidence = 0;

    if (closedSimilarTrades.length > 0) {
      const winningTrades = closedSimilarTrades.filter(t => (t.pnl || 0) > 0);
      winRate = (winningTrades.length / closedSimilarTrades.length) * 100;
      avgPnL = closedSimilarTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / closedSimilarTrades.length;
      confidence = Math.min(closedSimilarTrades.length / 10, 1); // Max confidence at 10+ trades
    }

    // Generate recommendations based on performance
    if (closedSimilarTrades.length >= 5) {
      if (winRate >= 60) {
        recommendations.push(`Strong performance with these tags (${winRate.toFixed(1)}% win rate)`);
      } else if (winRate <= 40) {
        warnings.push(`Low win rate with this tag combination (${winRate.toFixed(1)}%)`);
      }

      if (avgPnL > 0) {
        recommendations.push(`Positive average P&L: ${avgPnL.toFixed(2)}`);
      } else {
        warnings.push(`Negative average P&L: ${avgPnL.toFixed(2)}`);
      }
    } else {
      recommendations.push('Limited historical data for this tag combination');
    }

    // Suggest complementary tags
    const tagAnalytics = tagService.getTagAnalytics(trades);
    const highPerformingTags = tagAnalytics.tagPerformance
      .filter(tp => tp.winRate > 60 && tp.totalTrades >= 3)
      .filter(tp => !processedTags.includes(tp.tag))
      .sort((a, b) => b.profitFactor - a.profitFactor)
      .slice(0, 3)
      .map(tp => tp.tag);

    suggestedTags.push(...highPerformingTags);

    return {
      recommendations,
      warnings,
      suggestedTags,
      performance: { winRate, avgPnL, confidence }
    };
  }

  /**
   * Maintains tag index and performs cleanup operations
   * @param trades - Current array of trades
   * @returns Cleanup results
   */
  static maintainTagIndex(trades: Trade[]): {
    indexRebuilt: boolean;
    orphanedTagsRemoved: string[];
    totalTags: number;
  } {
    // Rebuild the tag index
    tagService.buildTagIndex(trades);
    
    // Clean up orphaned tags
    const orphanedTags = tagService.cleanupOrphanedTags(trades);
    
    // Get current tag count
    const allTags = tagService.getAllTagsWithCounts(trades);
    
    return {
      indexRebuilt: true,
      orphanedTagsRemoved: orphanedTags,
      totalTags: allTags.length
    };
  }

  /**
   * Exports tag data for backup or analysis
   * @param trades - Array of trades
   * @returns Exportable tag data
   */
  static exportTagData(trades: Trade[]) {
    const analytics = tagService.getTagAnalytics(trades);
    const allTags = tagService.getAllTagsWithCounts(trades);
    
    return {
      exportDate: new Date().toISOString(),
      totalTrades: trades.length,
      analytics,
      allTags,
      tagsByTrade: trades.map(trade => ({
        tradeId: trade.id,
        date: trade.date,
        tags: trade.tags || []
      }))
    };
  }

  /**
   * Imports and validates tag data
   * @param tagData - Imported tag data
   * @returns Validation results and processed data
   */
  static importTagData(tagData: any): {
    isValid: boolean;
    errors: string[];
    processedTags: { [tradeId: string]: string[] };
  } {
    const errors: string[] = [];
    const processedTags: { [tradeId: string]: string[] } = {};

    if (!tagData || typeof tagData !== 'object') {
      errors.push('Invalid tag data format');
      return { isValid: false, errors, processedTags };
    }

    if (!Array.isArray(tagData.tagsByTrade)) {
      errors.push('Missing or invalid tagsByTrade array');
      return { isValid: false, errors, processedTags };
    }

    // Process and validate each trade's tags
    tagData.tagsByTrade.forEach((tradeTagData: any, index: number) => {
      if (!tradeTagData.tradeId) {
        errors.push(`Missing tradeId at index ${index}`);
        return;
      }

      if (!Array.isArray(tradeTagData.tags)) {
        errors.push(`Invalid tags for trade ${tradeTagData.tradeId}`);
        return;
      }

      // Validate and process tags
      const validation = tagService.validateTags(tradeTagData.tags);
      if (!validation.isValid) {
        errors.push(`Invalid tags for trade ${tradeTagData.tradeId}: ${validation.errors.join(', ')}`);
        return;
      }

      processedTags[tradeTagData.tradeId] = tagService.processTags(tradeTagData.tags);
    });

    return {
      isValid: errors.length === 0,
      errors,
      processedTags
    };
  }
}

// Export singleton instance for convenience
export const tagIntegration = TagIntegration;
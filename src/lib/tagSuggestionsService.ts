import { Trade } from '../types/trade';
import { TagWithCount } from './tagService';

export interface TagSuggestion {
  tag: string;
  score: number;
  reason: SuggestionReason;
  context?: string;
  frequency?: number;
  lastUsed?: string;
}

export type SuggestionReason = 
  | 'recent_usage'
  | 'high_frequency'
  | 'contextual_match'
  | 'pattern_match'
  | 'session_match'
  | 'currency_pair_match'
  | 'strategy_match'
  | 'performance_based'
  | 'exact_match'
  | 'partial_match';

export interface SuggestionContext {
  currentTrade?: Partial<Trade>;
  recentTrades?: Trade[];
  userPreferences?: UserTagPreferences;
}

export interface UserTagPreferences {
  favoriteStrategies: string[];
  commonCurrencyPairs: string[];
  preferredSessions: string[];
  recentlyUsedTags: string[];
  tagUsageHistory: { [tag: string]: number };
}

export interface ContextualSuggestionRule {
  id: string;
  name: string;
  condition: (trade: Partial<Trade>, allTrades: Trade[]) => boolean;
  suggestedTags: string[];
  priority: number;
}

/**
 * Enhanced tag suggestions service that provides intelligent autocomplete
 * based on context, usage patterns, and trade characteristics
 */
export class TagSuggestionsService {
  private static instance: TagSuggestionsService;
  private contextualRules: ContextualSuggestionRule[] = [];
  private suggestionCache = new Map<string, TagSuggestion[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.initializeContextualRules();
  }

  public static getInstance(): TagSuggestionsService {
    if (!TagSuggestionsService.instance) {
      TagSuggestionsService.instance = new TagSuggestionsService();
    }
    return TagSuggestionsService.instance;
  }

  /**
   * Gets intelligent tag suggestions based on input and context
   * @param input - Current user input
   * @param allTrades - All available trades for context
   * @param context - Additional context for suggestions
   * @param limit - Maximum number of suggestions to return
   * @returns Array of ranked tag suggestions
   */
  public getIntelligentSuggestions(
    input: string,
    allTrades: Trade[],
    context: SuggestionContext = {},
    limit: number = 10
  ): TagSuggestion[] {
    const cacheKey = this.generateCacheKey(input, context);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.suggestionCache.get(cacheKey);
      if (cached) {
        return cached.slice(0, limit);
      }
    }

    const suggestions = this.generateSuggestions(input, allTrades, context);
    const rankedSuggestions = this.rankSuggestions(suggestions, input, context);
    
    // Cache the results
    this.cacheResults(cacheKey, rankedSuggestions);
    
    return rankedSuggestions.slice(0, limit);
  }

  /**
   * Gets recently used tags with priority scoring
   * @param allTrades - All available trades
   * @param limit - Maximum number of tags to return
   * @returns Array of recently used tags with scores
   */
  public getRecentlyUsedTags(allTrades: Trade[], limit: number = 10): TagSuggestion[] {
    const tagUsage = new Map<string, { lastUsed: string; count: number }>();

    // Collect tag usage data
    allTrades.forEach(trade => {
      if (trade.tags && Array.isArray(trade.tags)) {
        trade.tags.forEach(tag => {
          const normalizedTag = this.normalizeTag(tag);
          const existing = tagUsage.get(normalizedTag);
          
          if (!existing || trade.date > existing.lastUsed) {
            tagUsage.set(normalizedTag, {
              lastUsed: trade.date,
              count: (existing?.count || 0) + 1
            });
          }
        });
      }
    });

    // Convert to suggestions and score by recency
    const suggestions: TagSuggestion[] = Array.from(tagUsage.entries()).map(([tag, data]) => {
      const daysSinceUsed = this.getDaysSince(data.lastUsed);
      const recencyScore = Math.max(0, 100 - daysSinceUsed * 5); // Decay over time
      
      return {
        tag,
        score: recencyScore,
        reason: 'recent_usage',
        frequency: data.count,
        lastUsed: data.lastUsed
      };
    });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Gets contextual suggestions based on current trade data
   * @param currentTrade - Current trade being tagged
   * @param allTrades - All available trades for context
   * @param limit - Maximum number of suggestions
   * @returns Array of contextual suggestions
   */
  public getContextualSuggestions(
    currentTrade: Partial<Trade>,
    allTrades: Trade[],
    limit: number = 10
  ): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];

    // Apply contextual rules
    this.contextualRules.forEach(rule => {
      if (rule.condition(currentTrade, allTrades)) {
        rule.suggestedTags.forEach(tag => {
          suggestions.push({
            tag: this.normalizeTag(tag),
            score: rule.priority,
            reason: 'contextual_match',
            context: rule.name
          });
        });
      }
    });

    // Add suggestions based on similar trades
    const similarTradeSuggestions = this.getSimilarTradesSuggestions(currentTrade, allTrades);
    suggestions.push(...similarTradeSuggestions);

    // Remove duplicates and sort by score
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    
    return uniqueSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Gets frequency-based autocomplete suggestions
   * @param input - Current input string
   * @param allTrades - All available trades
   * @param limit - Maximum number of suggestions
   * @returns Array of frequency-ranked suggestions
   */
  public getFrequencyBasedSuggestions(
    input: string,
    allTrades: Trade[],
    limit: number = 10
  ): TagSuggestion[] {
    const tagFrequency = new Map<string, number>();
    
    // Count tag frequencies
    allTrades.forEach(trade => {
      if (trade.tags && Array.isArray(trade.tags)) {
        trade.tags.forEach(tag => {
          const normalizedTag = this.normalizeTag(tag);
          tagFrequency.set(normalizedTag, (tagFrequency.get(normalizedTag) || 0) + 1);
        });
      }
    });

    const normalizedInput = input.toLowerCase().trim();
    const searchTerm = normalizedInput.startsWith('#') ? normalizedInput.slice(1) : normalizedInput;

    const suggestions: TagSuggestion[] = [];

    tagFrequency.forEach((frequency, tag) => {
      const tagWithoutHash = tag.slice(1).toLowerCase();
      let score = 0;
      let reason: SuggestionReason = 'partial_match';

      if (tagWithoutHash === searchTerm) {
        score = 100 + frequency * 2; // Exact match gets highest score
        reason = 'exact_match';
      } else if (tagWithoutHash.startsWith(searchTerm)) {
        score = 80 + frequency; // Prefix match
        reason = 'pattern_match';
      } else if (tagWithoutHash.includes(searchTerm)) {
        score = 60 + frequency * 0.5; // Contains match
        reason = 'partial_match';
      }

      if (score > 0) {
        suggestions.push({
          tag,
          score,
          reason,
          frequency
        });
      }
    });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Gets performance-based tag suggestions
   * @param allTrades - All available trades
   * @param limit - Maximum number of suggestions
   * @returns Array of performance-ranked suggestions
   */
  public getPerformanceBasedSuggestions(allTrades: Trade[], limit: number = 10): TagSuggestion[] {
    const tagPerformance = new Map<string, { winRate: number; avgPnL: number; count: number }>();

    // Calculate performance for each tag
    allTrades.forEach(trade => {
      if (trade.tags && Array.isArray(trade.tags) && trade.status === 'closed' && trade.pnl !== undefined) {
        trade.tags.forEach(tag => {
          const normalizedTag = this.normalizeTag(tag);
          const existing = tagPerformance.get(normalizedTag) || { winRate: 0, avgPnL: 0, count: 0 };
          
          const isWin = trade.pnl > 0;
          const newCount = existing.count + 1;
          const newWinRate = ((existing.winRate * existing.count) + (isWin ? 1 : 0)) / newCount;
          const newAvgPnL = ((existing.avgPnL * existing.count) + trade.pnl) / newCount;

          tagPerformance.set(normalizedTag, {
            winRate: newWinRate,
            avgPnL: newAvgPnL,
            count: newCount
          });
        });
      }
    });

    const suggestions: TagSuggestion[] = Array.from(tagPerformance.entries())
      .filter(([_, perf]) => perf.count >= 3) // Only include tags with sufficient data
      .map(([tag, perf]) => {
        // Score based on win rate and average P&L, weighted by sample size
        const winRateScore = perf.winRate * 50;
        const pnlScore = Math.max(0, Math.min(50, perf.avgPnL / 10)); // Normalize P&L score
        const sampleSizeWeight = Math.min(1, perf.count / 10); // Weight by sample size
        const score = (winRateScore + pnlScore) * sampleSizeWeight;

        return {
          tag,
          score,
          reason: 'performance_based' as SuggestionReason,
          context: `Win Rate: ${(perf.winRate * 100).toFixed(1)}%, Avg P&L: ${perf.avgPnL.toFixed(2)}`,
          frequency: perf.count
        };
      });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Optimized suggestions for large datasets using indexing and caching
   * @param input - Current input string
   * @param tagIndex - Pre-built tag index for performance
   * @param context - Additional context
   * @param limit - Maximum number of suggestions
   * @returns Array of optimized suggestions
   */
  public getOptimizedSuggestions(
    input: string,
    tagIndex: Map<string, TagWithCount>,
    context: SuggestionContext = {},
    limit: number = 10
  ): TagSuggestion[] {
    const normalizedInput = input.toLowerCase().trim();
    const searchTerm = normalizedInput.startsWith('#') ? normalizedInput.slice(1) : normalizedInput;

    if (!searchTerm) {
      // Return most frequent tags when no input
      return Array.from(tagIndex.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(tagData => ({
          tag: tagData.tag,
          score: tagData.count,
          reason: 'high_frequency' as SuggestionReason,
          frequency: tagData.count,
          lastUsed: tagData.lastUsed
        }));
    }

    const suggestions: TagSuggestion[] = [];

    // Use index for fast lookups
    tagIndex.forEach((tagData, tag) => {
      const tagWithoutHash = tag.slice(1).toLowerCase();
      let score = 0;
      let reason: SuggestionReason = 'partial_match';

      if (tagWithoutHash === searchTerm) {
        score = 100 + tagData.count * 2;
        reason = 'exact_match';
      } else if (tagWithoutHash.startsWith(searchTerm)) {
        score = 80 + tagData.count;
        reason = 'pattern_match';
      } else if (tagWithoutHash.includes(searchTerm)) {
        score = 60 + tagData.count * 0.5;
        reason = 'partial_match';
      }

      if (score > 0) {
        // Boost score for recently used tags
        const daysSinceUsed = this.getDaysSince(tagData.lastUsed);
        const recencyBoost = Math.max(0, 20 - daysSinceUsed);
        
        suggestions.push({
          tag,
          score: score + recencyBoost,
          reason,
          frequency: tagData.count,
          lastUsed: tagData.lastUsed
        });
      }
    });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Initializes contextual suggestion rules
   */
  private initializeContextualRules(): void {
    this.contextualRules = [
      // Session-based suggestions
      {
        id: 'asian_session',
        name: 'Asian Trading Session',
        condition: (trade) => trade.session === 'asian',
        suggestedTags: ['#asian-session', '#low-volatility', '#range-trading'],
        priority: 70
      },
      {
        id: 'us_session',
        name: 'US Trading Session',
        condition: (trade) => trade.session === 'us',
        suggestedTags: ['#us-session', '#high-volatility', '#news-driven'],
        priority: 70
      },
      {
        id: 'european_session',
        name: 'European Trading Session',
        condition: (trade) => trade.session === 'european',
        suggestedTags: ['#european-session', '#trend-following'],
        priority: 70
      },

      // Currency pair suggestions
      {
        id: 'major_pairs',
        name: 'Major Currency Pairs',
        condition: (trade) => {
          const majors = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
          return majors.includes(trade.currencyPair || '');
        },
        suggestedTags: ['#major-pair', '#tight-spreads', '#high-liquidity'],
        priority: 60
      },
      {
        id: 'exotic_pairs',
        name: 'Exotic Currency Pairs',
        condition: (trade) => {
          const exotics = ['USD/ZAR', 'USD/TRY', 'USD/MXN', 'EUR/TRY', 'GBP/ZAR'];
          return exotics.includes(trade.currencyPair || '');
        },
        suggestedTags: ['#exotic-pair', '#wide-spreads', '#volatile'],
        priority: 60
      },

      // Trade direction suggestions
      {
        id: 'long_position',
        name: 'Long Position',
        condition: (trade) => trade.side === 'long',
        suggestedTags: ['#bullish', '#long-bias'],
        priority: 50
      },
      {
        id: 'short_position',
        name: 'Short Position',
        condition: (trade) => trade.side === 'short',
        suggestedTags: ['#bearish', '#short-bias'],
        priority: 50
      },

      // Risk management suggestions
      {
        id: 'high_leverage',
        name: 'High Leverage Trade',
        condition: (trade) => (trade.leverage || 0) > 50,
        suggestedTags: ['#high-leverage', '#high-risk', '#scalping'],
        priority: 80
      },
      {
        id: 'large_position',
        name: 'Large Position Size',
        condition: (trade) => (trade.lotSize || 0) > 1,
        suggestedTags: ['#large-position', '#swing-trade', '#high-conviction'],
        priority: 75
      },

      // Strategy-based suggestions
      {
        id: 'breakout_strategy',
        name: 'Breakout Strategy',
        condition: (trade) => (trade.strategy || '').toLowerCase().includes('breakout'),
        suggestedTags: ['#breakout', '#momentum', '#volatility-expansion'],
        priority: 85
      },
      {
        id: 'scalping_strategy',
        name: 'Scalping Strategy',
        condition: (trade) => (trade.strategy || '').toLowerCase().includes('scalp'),
        suggestedTags: ['#scalping', '#quick-profit', '#tight-stops'],
        priority: 85
      },
      {
        id: 'swing_strategy',
        name: 'Swing Trading Strategy',
        condition: (trade) => (trade.strategy || '').toLowerCase().includes('swing'),
        suggestedTags: ['#swing-trade', '#multi-day', '#trend-following'],
        priority: 85
      }
    ];
  }

  /**
   * Gets suggestions based on similar trades
   */
  private getSimilarTradesSuggestions(currentTrade: Partial<Trade>, allTrades: Trade[]): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    const similarTrades = this.findSimilarTrades(currentTrade, allTrades);

    // Collect tags from similar trades
    const tagFrequency = new Map<string, number>();
    similarTrades.forEach(trade => {
      if (trade.tags && Array.isArray(trade.tags)) {
        trade.tags.forEach(tag => {
          const normalizedTag = this.normalizeTag(tag);
          tagFrequency.set(normalizedTag, (tagFrequency.get(normalizedTag) || 0) + 1);
        });
      }
    });

    // Convert to suggestions
    tagFrequency.forEach((frequency, tag) => {
      const score = frequency * 10; // Score based on frequency in similar trades
      suggestions.push({
        tag,
        score,
        reason: 'contextual_match',
        context: 'Similar trades',
        frequency
      });
    });

    return suggestions;
  }

  /**
   * Finds trades similar to the current trade
   */
  private findSimilarTrades(currentTrade: Partial<Trade>, allTrades: Trade[]): Trade[] {
    return allTrades.filter(trade => {
      let similarity = 0;

      // Same currency pair
      if (trade.currencyPair === currentTrade.currencyPair) similarity += 3;
      
      // Same session
      if (trade.session === currentTrade.session) similarity += 2;
      
      // Same side
      if (trade.side === currentTrade.side) similarity += 2;
      
      // Same strategy
      if (trade.strategy === currentTrade.strategy) similarity += 3;
      
      // Similar timeframe
      if (trade.timeframe === currentTrade.timeframe) similarity += 2;

      return similarity >= 4; // Require minimum similarity
    });
  }

  /**
   * Generates all types of suggestions
   */
  private generateSuggestions(
    input: string,
    allTrades: Trade[],
    context: SuggestionContext
  ): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];

    // Frequency-based suggestions
    suggestions.push(...this.getFrequencyBasedSuggestions(input, allTrades, 20));

    // Recently used suggestions
    suggestions.push(...this.getRecentlyUsedTags(allTrades, 10));

    // Contextual suggestions if current trade provided
    if (context.currentTrade) {
      suggestions.push(...this.getContextualSuggestions(context.currentTrade, allTrades, 10));
    }

    // Performance-based suggestions
    suggestions.push(...this.getPerformanceBasedSuggestions(allTrades, 5));

    return suggestions;
  }

  /**
   * Ranks and scores suggestions based on multiple factors
   */
  private rankSuggestions(
    suggestions: TagSuggestion[],
    input: string,
    context: SuggestionContext
  ): TagSuggestion[] {
    const normalizedInput = input.toLowerCase().trim();
    
    // Apply additional scoring factors
    suggestions.forEach(suggestion => {
      // Boost exact matches
      if (suggestion.reason === 'exact_match') {
        suggestion.score *= 1.5;
      }

      // Boost recent usage
      if (suggestion.reason === 'recent_usage' && suggestion.lastUsed) {
        const daysSince = this.getDaysSince(suggestion.lastUsed);
        if (daysSince <= 7) {
          suggestion.score *= 1.3;
        }
      }

      // Boost contextual matches
      if (suggestion.reason === 'contextual_match') {
        suggestion.score *= 1.2;
      }

      // Boost performance-based suggestions
      if (suggestion.reason === 'performance_based') {
        suggestion.score *= 1.1;
      }
    });

    // Remove duplicates and sort
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    
    return uniqueSuggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Removes duplicate suggestions, keeping the highest scored one
   */
  private deduplicateSuggestions(suggestions: TagSuggestion[]): TagSuggestion[] {
    const seen = new Map<string, TagSuggestion>();

    suggestions.forEach(suggestion => {
      const existing = seen.get(suggestion.tag);
      if (!existing || suggestion.score > existing.score) {
        seen.set(suggestion.tag, suggestion);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Normalizes a tag to ensure consistent formatting
   */
  private normalizeTag(tag: string): string {
    if (!tag) return '';
    const trimmed = tag.trim().toLowerCase();
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  }

  /**
   * Calculates days since a given date
   */
  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Generates cache key for suggestions
   */
  private generateCacheKey(input: string, context: SuggestionContext): string {
    const contextKey = JSON.stringify({
      input: input.toLowerCase().trim(),
      currencyPair: context.currentTrade?.currencyPair,
      session: context.currentTrade?.session,
      strategy: context.currentTrade?.strategy
    });
    return btoa(contextKey); // Base64 encode for safe key
  }

  /**
   * Checks if cached results are still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Caches suggestion results
   */
  private cacheResults(cacheKey: string, suggestions: TagSuggestion[]): void {
    this.suggestionCache.set(cacheKey, suggestions);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clears the suggestion cache
   */
  public clearCache(): void {
    this.suggestionCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Gets cache statistics for debugging
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.suggestionCache.size,
      hitRate: 0 // Would need to track hits/misses for actual calculation
    };
  }
}

// Export singleton instance
export const tagSuggestionsService = TagSuggestionsService.getInstance();
import { Trade } from '../types/trade';

// Define interfaces locally to avoid circular dependencies
export interface TagValidationResult {
  isValid: boolean;
  errors: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  warnings: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  sanitizedValue?: string;
}

// Tag-related interfaces
export interface TagWithCount {
  tag: string;
  count: number;
  lastUsed: string;
  trades: string[]; // Trade IDs for quick filtering
}

export interface TagAnalytics {
  totalTags: number;
  averageTagsPerTrade: number;
  mostUsedTags: TagWithCount[];
  recentTags: TagWithCount[];
  tagPerformance: TagPerformance[];
}

export interface TagPerformance {
  tag: string;
  totalTrades: number;
  winRate: number;
  averagePnL: number;
  profitFactor: number;
}

export interface TagFilter {
  includeTags: string[];
  excludeTags: string[];
  mode: 'AND' | 'OR';
  searchQuery?: string;
}

export interface TagIndex {
  [tag: string]: {
    count: number;
    tradeIds: string[];
    lastUsed: string;
    performance: TagPerformance;
  };
}

// Local interfaces defined above for compatibility

/**
 * Core service for managing tags in the trading journal system
 * Provides CRUD operations, validation, indexing, and analytics for trade tags
 * Updated: 2024-01-22 - Fixed import issues
 */
export class TagService {
  private static instance: TagService;
  private tagIndex: TagIndex = {};
  private lastIndexUpdate: number = 0;

  private constructor() {}

  public static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  /**
   * Validates a single tag according to the system rules
   * @param tag - The tag to validate
   * @returns Validation result with errors and warnings
   */
  public validateTag(tag: string): TagValidationResult {
    const errors: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
    const warnings: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
    
    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      errors.push({ code: 'TAG_EMPTY', message: 'Tag cannot be empty', severity: 'error' });
      return { isValid: false, errors, warnings };
    }
    
    const trimmed = tag.trim();
    const content = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    
    if (content.length === 0) {
      errors.push({ code: 'TAG_EMPTY', message: 'Tag cannot be empty', severity: 'error' });
    }
    
    if (content.length > 50) {
      errors.push({ code: 'TAG_TOO_LONG', message: 'Tag cannot be longer than 50 characters', severity: 'error' });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(content)) {
      errors.push({ code: 'TAG_INVALID_CHARS', message: 'Tag can only contain letters, numbers, and underscores', severity: 'error' });
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates an array of tags
   * @param tags - Array of tags to validate
   * @returns Validation result for all tags
   */
  public validateTags(tags: string[]): TagValidationResult {
    const allErrors: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
    const allWarnings: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
    
    if (!Array.isArray(tags)) {
      allErrors.push({ code: 'TAGS_NOT_ARRAY', message: 'Tags must be an array', severity: 'error' });
      return { isValid: false, errors: allErrors, warnings: allWarnings };
    }
    
    if (tags.length > 20) {
      allErrors.push({ code: 'TOO_MANY_TAGS', message: 'Cannot have more than 20 tags', severity: 'error' });
    }
    
    tags.forEach((tag, index) => {
      const result = this.validateTag(tag);
      result.errors.forEach(error => {
        allErrors.push({ ...error, message: `Tag ${index + 1}: ${error.message}` });
      });
      result.warnings.forEach(warning => {
        allWarnings.push({ ...warning, message: `Tag ${index + 1}: ${warning.message}` });
      });
    });
    
    return { isValid: allErrors.length === 0, errors: allErrors, warnings: allWarnings };
  }

  /**
   * Normalizes a tag to ensure consistent formatting
   * @param tag - The tag to normalize
   * @returns Normalized tag
   */
  public normalizeTag(tag: string): string {
    if (!tag) return '';
    
    const trimmed = tag.trim().toLowerCase();
    
    // Ensure tag starts with #
    if (!trimmed.startsWith('#')) {
      return `#${trimmed}`;
    }
    
    return trimmed;
  }

  /**
   * Sanitizes a tag by removing invalid characters and normalizing
   * @param tag - The tag to sanitize
   * @returns Sanitized tag or empty string if sanitization fails
   */
  public sanitizeTag(tag: string): string {
    if (!tag || typeof tag !== 'string') return '';
    
    let sanitized = tag.trim();
    
    // Add # prefix if missing
    if (!sanitized.startsWith('#')) {
      sanitized = `#${sanitized}`;
    }
    
    // Extract content after #
    const content = sanitized.slice(1);
    
    // Remove invalid characters
    const cleanContent = content.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Convert to lowercase
    const normalized = cleanContent.toLowerCase();
    
    return normalized ? `#${normalized}` : '';
  }



  /**
   * Processes an array of tag strings, normalizing and deduplicating them
   * @param tags - Array of tag strings
   * @returns Processed array of unique, normalized tags
   */
  public processTags(tags: string[]): string[] {
    if (!Array.isArray(tags)) return [];

    return tags
      .map(tag => this.sanitizeTag(tag))
      .filter(tag => tag.length > 1) // Remove empty tags (just #)
      .filter(tag => this.validateTag(tag).isValid) // Remove invalid tags
      .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
  }

  /**
   * Builds or updates the tag index from an array of trades
   * @param trades - Array of trades to index
   */
  public buildTagIndex(trades: Trade[]): void {
    const newIndex: TagIndex = {};

    trades.forEach(trade => {
      if (!trade.tags || !Array.isArray(trade.tags)) return;

      trade.tags.forEach(tag => {
        const normalizedTag = this.normalizeTag(tag);
        if (!normalizedTag) return;

        if (!newIndex[normalizedTag]) {
          newIndex[normalizedTag] = {
            count: 0,
            tradeIds: [],
            lastUsed: trade.date,
            performance: {
              tag: normalizedTag,
              totalTrades: 0,
              winRate: 0,
              averagePnL: 0,
              profitFactor: 0
            }
          };
        }

        newIndex[normalizedTag].count++;
        newIndex[normalizedTag].tradeIds.push(trade.id);
        
        // Update last used date if this trade is more recent
        if (trade.date > newIndex[normalizedTag].lastUsed) {
          newIndex[normalizedTag].lastUsed = trade.date;
        }
      });
    });

    // Calculate performance metrics for each tag
    Object.keys(newIndex).forEach(tag => {
      const tagData = newIndex[tag];
      const tagTrades = trades.filter(trade => 
        trade.tags?.some(t => this.normalizeTag(t) === tag)
      );

      tagData.performance = this.calculateTagPerformance(tag, tagTrades);
    });

    this.tagIndex = newIndex;
    this.lastIndexUpdate = Date.now();
  }

  /**
   * Gets all tags with their usage counts
   * @param trades - Array of trades to analyze
   * @returns Array of tags with counts
   */
  public getAllTagsWithCounts(trades: Trade[]): TagWithCount[] {
    // Rebuild index if it's stale or empty
    if (Object.keys(this.tagIndex).length === 0 || this.isIndexStale()) {
      this.buildTagIndex(trades);
    }

    return Object.entries(this.tagIndex).map(([tag, data]) => ({
      tag,
      count: data.count,
      lastUsed: data.lastUsed,
      trades: data.tradeIds
    }));
  }

  /**
   * Gets the most frequently used tags
   * @param trades - Array of trades to analyze
   * @param limit - Maximum number of tags to return
   * @returns Array of most used tags
   */
  public getMostUsedTags(trades: Trade[], limit: number = 10): TagWithCount[] {
    const allTags = this.getAllTagsWithCounts(trades);
    return allTags
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Gets recently used tags
   * @param trades - Array of trades to analyze
   * @param limit - Maximum number of tags to return
   * @returns Array of recently used tags
   */
  public getRecentTags(trades: Trade[], limit: number = 10): TagWithCount[] {
    const allTags = this.getAllTagsWithCounts(trades);
    return allTags
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, limit);
  }

  /**
   * Calculates performance metrics for a specific tag
   * @param tag - The tag to analyze
   * @param trades - Array of trades with this tag
   * @returns Performance metrics for the tag
   */
  public calculateTagPerformance(tag: string, trades: Trade[]): TagPerformance {
    const closedTrades = trades.filter(trade => trade.status === 'closed');
    const totalTrades = closedTrades.length;

    if (totalTrades === 0) {
      return {
        tag,
        totalTrades: 0,
        winRate: 0,
        averagePnL: 0,
        profitFactor: 0
      };
    }

    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);

    const winRate = (winningTrades.length / totalTrades) * 100;
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const averagePnL = totalPnL / totalTrades;

    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    const profitFactor = totalLosses === 0 ? (totalWins > 0 ? Infinity : 0) : totalWins / totalLosses;

    return {
      tag,
      totalTrades,
      winRate,
      averagePnL,
      profitFactor
    };
  }

  /**
   * Gets comprehensive analytics for all tags
   * @param trades - Array of trades to analyze
   * @returns Complete tag analytics
   */
  public getTagAnalytics(trades: Trade[]): TagAnalytics {
    const allTags = this.getAllTagsWithCounts(trades);
    const tradesWithTags = trades.filter(trade => trade.tags && trade.tags.length > 0);
    
    const totalTags = allTags.length;
    const averageTagsPerTrade = tradesWithTags.length > 0 
      ? tradesWithTags.reduce((sum, trade) => sum + (trade.tags?.length || 0), 0) / tradesWithTags.length
      : 0;

    const mostUsedTags = this.getMostUsedTags(trades, 10);
    const recentTags = this.getRecentTags(trades, 10);

    const tagPerformance = allTags.map(tagData => {
      const tagTrades = trades.filter(trade => 
        trade.tags?.some(t => this.normalizeTag(t) === tagData.tag)
      );
      return this.calculateTagPerformance(tagData.tag, tagTrades);
    });

    return {
      totalTags,
      averageTagsPerTrade,
      mostUsedTags,
      recentTags,
      tagPerformance
    };
  }

  /**
   * Filters trades based on tag criteria
   * @param trades - Array of trades to filter
   * @param filter - Tag filter criteria
   * @returns Filtered array of trades
   */
  public filterTradesByTags(trades: Trade[], filter: TagFilter): Trade[] {
    const { includeTags, excludeTags, mode } = filter;

    return trades.filter(trade => {
      if (!trade.tags || trade.tags.length === 0) {
        return includeTags.length === 0;
      }

      const normalizedTradeTags = trade.tags.map(tag => this.normalizeTag(tag));
      const normalizedIncludeTags = includeTags.map(tag => this.normalizeTag(tag));
      const normalizedExcludeTags = excludeTags.map(tag => this.normalizeTag(tag));

      // Check exclude tags first
      if (normalizedExcludeTags.some(tag => normalizedTradeTags.includes(tag))) {
        return false;
      }

      // If no include tags specified, include all (except excluded)
      if (normalizedIncludeTags.length === 0) {
        return true;
      }

      // Apply include logic based on mode
      if (mode === 'AND') {
        return normalizedIncludeTags.every(tag => normalizedTradeTags.includes(tag));
      } else {
        return normalizedIncludeTags.some(tag => normalizedTradeTags.includes(tag));
      }
    });
  }

  /**
   * Searches for tags matching a query string
   * @param trades - Array of trades to search
   * @param query - Search query
   * @returns Array of matching tags
   */
  public searchTags(trades: Trade[], query: string): TagWithCount[] {
    if (!query || query.trim().length === 0) {
      return this.getAllTagsWithCounts(trades);
    }

    const normalizedQuery = query.toLowerCase().trim();
    const allTags = this.getAllTagsWithCounts(trades);

    return allTags.filter(tagData => 
      tagData.tag.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Gets autocomplete suggestions for tag input (legacy method)
   * @param trades - Array of trades for context
   * @param currentInput - Current input string
   * @param limit - Maximum number of suggestions
   * @returns Array of suggested tags
   * @deprecated Use getIntelligentTagSuggestions for enhanced functionality
   */
  public getTagSuggestions(trades: Trade[], currentInput: string, limit: number = 10): string[] {
    const normalizedInput = currentInput.toLowerCase().trim();
    
    // If input is empty, return most used tags
    if (!normalizedInput) {
      return this.getMostUsedTags(trades, limit).map(tag => tag.tag);
    }

    // Remove # if present for matching
    const searchTerm = normalizedInput.startsWith('#') ? normalizedInput.slice(1) : normalizedInput;
    
    const allTags = this.getAllTagsWithCounts(trades);
    
    // Find tags that start with the search term (prioritized)
    const startsWith = allTags.filter(tag => 
      tag.tag.slice(1).toLowerCase().startsWith(searchTerm)
    );
    
    // Find tags that contain the search term
    const contains = allTags.filter(tag => 
      tag.tag.slice(1).toLowerCase().includes(searchTerm) && 
      !tag.tag.slice(1).toLowerCase().startsWith(searchTerm)
    );

    // Combine and sort by usage count
    const suggestions = [...startsWith, ...contains]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(tag => tag.tag);

    return suggestions;
  }

  /**
   * Gets intelligent tag suggestions using the enhanced suggestions service
   * @param trades - Array of trades for context
   * @param currentInput - Current input string
   * @param currentTrade - Current trade being tagged (for contextual suggestions)
   * @param limit - Maximum number of suggestions
   * @returns Array of intelligent tag suggestions with scoring
   */
  public getIntelligentTagSuggestions(
    trades: Trade[], 
    currentInput: string, 
    currentTrade?: Partial<Trade>,
    limit: number = 10
  ): Array<{ tag: string; score: number; reason: string; context?: string }> {
    // Import here to avoid circular dependencies
    const { tagSuggestionsService } = require('./tagSuggestionsService');
    
    const context = {
      currentTrade,
      recentTrades: trades.slice(-10) // Last 10 trades for context
    };

    const suggestions = tagSuggestionsService.getIntelligentSuggestions(
      currentInput,
      trades,
      context,
      limit
    );

    return suggestions.map(suggestion => ({
      tag: suggestion.tag,
      score: suggestion.score,
      reason: suggestion.reason,
      context: suggestion.context
    }));
  }

  /**
   * Gets optimized suggestions for large datasets using pre-built index
   * @param currentInput - Current input string
   * @param trades - Array of trades (used to build index if needed)
   * @param currentTrade - Current trade being tagged
   * @param limit - Maximum number of suggestions
   * @returns Array of optimized suggestions
   */
  public getOptimizedTagSuggestions(
    currentInput: string,
    trades: Trade[],
    currentTrade?: Partial<Trade>,
    limit: number = 10
  ): Array<{ tag: string; score: number; reason: string }> {
    // Import here to avoid circular dependencies
    const { tagSuggestionsService } = require('./tagSuggestionsService');
    
    // Build tag index if needed
    if (Object.keys(this.tagIndex).length === 0 || this.isIndexStale()) {
      this.buildTagIndex(trades);
    }

    // Convert internal index to Map format expected by suggestions service
    const tagIndexMap = new Map<string, TagWithCount>();
    Object.entries(this.tagIndex).forEach(([tag, data]) => {
      tagIndexMap.set(tag, {
        tag,
        count: data.count,
        lastUsed: data.lastUsed,
        trades: data.tradeIds
      });
    });

    const context = { currentTrade };
    const suggestions = tagSuggestionsService.getOptimizedSuggestions(
      currentInput,
      tagIndexMap,
      context,
      limit
    );

    return suggestions.map(suggestion => ({
      tag: suggestion.tag,
      score: suggestion.score,
      reason: suggestion.reason
    }));
  }

  /**
   * Removes orphaned tags that are no longer used by any trades
   * @param trades - Array of current trades
   * @returns Array of removed tag names
   */
  public cleanupOrphanedTags(trades: Trade[]): string[] {
    const currentTags = new Set<string>();
    
    trades.forEach(trade => {
      if (trade.tags && Array.isArray(trade.tags)) {
        trade.tags.forEach(tag => {
          currentTags.add(this.normalizeTag(tag));
        });
      }
    });

    const orphanedTags = Object.keys(this.tagIndex).filter(tag => !currentTags.has(tag));
    
    // Remove orphaned tags from index
    orphanedTags.forEach(tag => {
      delete this.tagIndex[tag];
    });

    return orphanedTags;
  }

  /**
   * Checks if the tag index is stale and needs rebuilding
   * @returns True if index is stale
   */
  private isIndexStale(): boolean {
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    return Date.now() - this.lastIndexUpdate > STALE_THRESHOLD;
  }

  /**
   * Resets the tag index (useful for testing or manual refresh)
   */
  public resetIndex(): void {
    this.tagIndex = {};
    this.lastIndexUpdate = 0;
  }

  /**
   * Gets cached tag suggestions from localStorage
   */
  private getCachedTagSuggestions(): string[] {
    try {
      const cached = localStorage.getItem('cachedTagSuggestions');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /**
   * Caches tag suggestions for offline use
   */
  public cacheTagSuggestions(suggestions: string[]): void {
    try {
      localStorage.setItem('cachedTagSuggestions', JSON.stringify(suggestions));
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}

// Export singleton instance
export const tagService = TagService.getInstance();
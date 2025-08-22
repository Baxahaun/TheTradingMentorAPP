import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trade } from '../types/trade';
import { tagSuggestionsService, TagSuggestion, SuggestionContext } from '../lib/tagSuggestionsService';
import { tagService } from '../lib/tagService';

export interface UseTagSuggestionsOptions {
  /** Maximum number of suggestions to return */
  limit?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether to include contextual suggestions */
  includeContextual?: boolean;
  /** Whether to include performance-based suggestions */
  includePerformance?: boolean;
  /** Whether to use optimized suggestions for large datasets */
  useOptimized?: boolean;
  /** Minimum input length before showing suggestions */
  minInputLength?: number;
}

export interface TagSuggestionsState {
  /** Current suggestions */
  suggestions: TagSuggestion[];
  /** Whether suggestions are currently loading */
  loading: boolean;
  /** Any error that occurred while fetching suggestions */
  error: string | null;
  /** Whether the suggestions are from cache */
  fromCache: boolean;
}

export interface UseTagSuggestionsReturn extends TagSuggestionsState {
  /** Get suggestions for the given input */
  getSuggestions: (input: string, currentTrade?: Partial<Trade>) => void;
  /** Clear current suggestions */
  clearSuggestions: () => void;
  /** Refresh suggestions with current input */
  refreshSuggestions: () => void;
  /** Get recently used tags */
  getRecentTags: () => TagSuggestion[];
  /** Get contextual suggestions for current trade */
  getContextualTags: (currentTrade: Partial<Trade>) => TagSuggestion[];
  /** Clear the suggestions cache */
  clearCache: () => void;
}

/**
 * Hook for managing tag suggestions with intelligent autocomplete
 * @param trades - Array of all trades for context
 * @param options - Configuration options
 * @returns Tag suggestions state and methods
 */
export function useTagSuggestions(
  trades: Trade[],
  options: UseTagSuggestionsOptions = {}
): UseTagSuggestionsReturn {
  const {
    limit = 10,
    debounceMs = 300,
    includeContextual = true,
    includePerformance = true,
    useOptimized = false,
    minInputLength = 0
  } = options;

  const [state, setState] = useState<TagSuggestionsState>({
    suggestions: [],
    loading: false,
    error: null,
    fromCache: false
  });

  const [currentInput, setCurrentInput] = useState<string>('');
  const [currentTrade, setCurrentTrade] = useState<Partial<Trade> | undefined>();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Memoize the suggestion context to avoid unnecessary recalculations
  const suggestionContext = useMemo((): SuggestionContext => ({
    currentTrade,
    recentTrades: trades.slice(-10), // Last 10 trades for context
    userPreferences: {
      favoriteStrategies: [], // Could be populated from user settings
      commonCurrencyPairs: [], // Could be populated from trade history
      preferredSessions: [], // Could be populated from user settings
      recentlyUsedTags: [], // Could be populated from recent trades
      tagUsageHistory: {} // Could be populated from trade history
    }
  }), [currentTrade, trades]);

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(async (
    input: string, 
    trade?: Partial<Trade>
  ) => {
    if (input.length < minInputLength) {
      setState(prev => ({ ...prev, suggestions: [], loading: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let suggestions: TagSuggestion[];

      if (useOptimized && trades.length > 100) {
        // Use optimized suggestions for large datasets
        const optimizedSuggestions = tagService.getOptimizedTagSuggestions(
          input,
          trades,
          trade,
          limit
        );
        
        suggestions = optimizedSuggestions.map(s => ({
          tag: s.tag,
          score: s.score,
          reason: s.reason as any,
          context: undefined,
          frequency: undefined,
          lastUsed: undefined
        }));
      } else {
        // Use intelligent suggestions
        const context = { ...suggestionContext, currentTrade: trade };
        suggestions = tagSuggestionsService.getIntelligentSuggestions(
          input,
          trades,
          context,
          limit
        );
      }

      setState(prev => ({
        ...prev,
        suggestions,
        loading: false,
        fromCache: false // Would need to track this in the service
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch suggestions'
      }));
    }
  }, [trades, suggestionContext, limit, minInputLength, useOptimized]);

  // Debounced version of fetchSuggestions
  const debouncedFetchSuggestions = useCallback((
    input: string, 
    trade?: Partial<Trade>
  ) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      fetchSuggestions(input, trade);
    }, debounceMs);

    setDebounceTimer(timer);
  }, [fetchSuggestions, debounceMs, debounceTimer]);

  // Public method to get suggestions
  const getSuggestions = useCallback((
    input: string, 
    trade?: Partial<Trade>
  ) => {
    setCurrentInput(input);
    setCurrentTrade(trade);
    debouncedFetchSuggestions(input, trade);
  }, [debouncedFetchSuggestions]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setState({
      suggestions: [],
      loading: false,
      error: null,
      fromCache: false
    });
    setCurrentInput('');
    setCurrentTrade(undefined);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  // Refresh suggestions with current input
  const refreshSuggestions = useCallback(() => {
    if (currentInput) {
      fetchSuggestions(currentInput, currentTrade);
    }
  }, [currentInput, currentTrade, fetchSuggestions]);

  // Get recently used tags
  const getRecentTags = useCallback((): TagSuggestion[] => {
    return tagSuggestionsService.getRecentlyUsedTags(trades, limit);
  }, [trades, limit]);

  // Get contextual suggestions for current trade
  const getContextualTags = useCallback((trade: Partial<Trade>): TagSuggestion[] => {
    return tagSuggestionsService.getContextualSuggestions(trade, trades, limit);
  }, [trades, limit]);

  // Clear the suggestions cache
  const clearCache = useCallback(() => {
    tagSuggestionsService.clearCache();
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Auto-refresh suggestions when trades change (with debouncing)
  useEffect(() => {
    if (currentInput && currentInput.length >= minInputLength) {
      const timer = setTimeout(() => {
        fetchSuggestions(currentInput, currentTrade);
      }, 100); // Short delay to avoid excessive updates

      return () => clearTimeout(timer);
    }
  }, [trades.length, currentInput, currentTrade, fetchSuggestions, minInputLength]);

  return {
    ...state,
    getSuggestions,
    clearSuggestions,
    refreshSuggestions,
    getRecentTags,
    getContextualTags,
    clearCache
  };
}

/**
 * Hook for getting static tag suggestions (no real-time updates)
 * Useful for components that need suggestions but don't need live updates
 */
export function useStaticTagSuggestions(
  trades: Trade[],
  input: string,
  currentTrade?: Partial<Trade>,
  options: UseTagSuggestionsOptions = {}
): TagSuggestion[] {
  const { limit = 10, useOptimized = false } = options;

  return useMemo(() => {
    if (!input || input.length === 0) {
      return tagSuggestionsService.getRecentlyUsedTags(trades, limit);
    }

    if (useOptimized && trades.length > 100) {
      const optimizedSuggestions = tagService.getOptimizedTagSuggestions(
        input,
        trades,
        currentTrade,
        limit
      );
      
      return optimizedSuggestions.map(s => ({
        tag: s.tag,
        score: s.score,
        reason: s.reason as any,
        context: undefined,
        frequency: undefined,
        lastUsed: undefined
      }));
    }

    const context: SuggestionContext = {
      currentTrade,
      recentTrades: trades.slice(-10)
    };

    return tagSuggestionsService.getIntelligentSuggestions(
      input,
      trades,
      context,
      limit
    );
  }, [trades, input, currentTrade, limit, useOptimized]);
}

/**
 * Hook for performance-based tag suggestions
 * Returns tags sorted by their trading performance
 */
export function usePerformanceTagSuggestions(
  trades: Trade[],
  limit: number = 10
): TagSuggestion[] {
  return useMemo(() => {
    return tagSuggestionsService.getPerformanceBasedSuggestions(trades, limit);
  }, [trades, limit]);
}

/**
 * Hook for contextual tag suggestions based on current trade
 * Returns suggestions that match the current trade context
 */
export function useContextualTagSuggestions(
  trades: Trade[],
  currentTrade: Partial<Trade>,
  limit: number = 10
): TagSuggestion[] {
  return useMemo(() => {
    return tagSuggestionsService.getContextualSuggestions(currentTrade, trades, limit);
  }, [trades, currentTrade, limit]);
}
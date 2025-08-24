/**
 * Navigation Context Service
 * 
 * Manages contextual back navigation for the comprehensive trade review system.
 * Provides localStorage-based persistence and intelligent back navigation logic.
 */

import {
  NavigationContext,
  NavigationState,
  NavigationContextOptions,
  NavigationContextServiceConfig,
  NavigationEvent,
  NavigationContextValidation,
  BackNavigationConfig,
  NavigationAnalytics,
  TradeListFilters
} from '../types/navigation';

export class NavigationContextService {
  private static instance: NavigationContextService;
  private config: NavigationContextServiceConfig;
  private currentState: NavigationState | null = null;
  private eventListeners: ((event: NavigationEvent) => void)[] = [];

  private constructor(config?: Partial<NavigationContextServiceConfig>) {
    this.config = {
      storageKey: 'trade-review-navigation-context',
      defaultMaxAge: 24 * 60 * 60 * 1000, // 24 hours
      enableDebugLogging: false,
      maxBreadcrumbLength: 10,
      maxHistoryLength: 50,
      ...config
    };

    // Initialize from localStorage on creation
    this.initializeFromStorage();
  }

  /**
   * Get singleton instance of NavigationContextService
   */
  public static getInstance(config?: Partial<NavigationContextServiceConfig>): NavigationContextService {
    if (!NavigationContextService.instance) {
      NavigationContextService.instance = new NavigationContextService(config);
    }
    return NavigationContextService.instance;
  }

  /**
   * Set navigation context for current trade review session
   */
  public setContext(
    tradeId: string,
    context: NavigationContext,
    options: NavigationContextOptions = {}
  ): void {
    const {
      persist = true,
      maxAge = this.config.defaultMaxAge,
      includeMetadata = true,
      validator
    } = options;

    // Validate context if validator provided
    if (validator && !validator(context)) {
      this.log('Context validation failed', context);
      throw new Error('Invalid navigation context provided');
    }

    // Create context copy and add metadata if requested
    const contextCopy = { ...context };
    if (includeMetadata) {
      contextCopy.metadata = {
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        referrer: document.referrer || 'direct',
        ...context.metadata
      };
    }

    // Update current state
    this.currentState = {
      currentTradeId: tradeId,
      context: { ...contextCopy, timestamp: Date.now() },
      history: this.currentState?.history || [],
      historyIndex: this.currentState?.historyIndex || -1,
      canNavigateBack: true,
      canNavigateForward: false
    };

    // Add to history if it's a new trade
    if (!this.currentState.history.includes(tradeId)) {
      this.currentState.history.push(tradeId);
      this.currentState.historyIndex = this.currentState.history.length - 1;
      
      // Limit history length
      if (this.currentState.history.length > this.config.maxHistoryLength) {
        this.currentState.history = this.currentState.history.slice(-this.config.maxHistoryLength);
        this.currentState.historyIndex = this.currentState.history.length - 1;
      }
    }

    // Persist to localStorage if requested
    if (persist) {
      this.persistToStorage();
    }

    // Emit event
    this.emitEvent({ type: 'CONTEXT_SET', payload: context });

    this.log('Navigation context set', { tradeId, context });
  }

  /**
   * Get current navigation context
   */
  public getContext(): NavigationContext | null {
    if (!this.currentState) {
      return null;
    }

    const validation = this.validateContext(this.currentState.context);
    if (!validation.isValid) {
      this.log('Context validation failed on retrieval', validation);
      this.clearContext();
      return null;
    }

    return this.currentState.context;
  }

  /**
   * Get current navigation state
   */
  public getNavigationState(): NavigationState | null {
    return this.currentState;
  }

  /**
   * Generate human-readable back navigation label
   */
  public generateBackLabel(context?: NavigationContext): string {
    const ctx = context || this.getContext();
    if (!ctx) {
      return 'Back';
    }

    const sourceLabels: { [key in NavigationContext['source']]: string } = {
      'calendar': 'Back to Calendar',
      'trade-list': 'Back to Trade List',
      'search': 'Back to Search Results',
      'dashboard': 'Back to Dashboard',
      'analytics': 'Back to Analytics'
    };

    let label = sourceLabels[ctx.source];

    // Add specific context if available
    if (ctx.sourceParams) {
      switch (ctx.source) {
        case 'calendar':
          if (ctx.sourceParams.date) {
            const date = new Date(ctx.sourceParams.date);
            label += ` (${date.toLocaleDateString()})`;
          }
          break;
        case 'search':
          if (ctx.sourceParams.searchQuery) {
            label += ` ("${ctx.sourceParams.searchQuery}")`;
          }
          break;
        case 'trade-list':
          if (ctx.sourceParams.filters) {
            const filterCount = this.countActiveFilters(ctx.sourceParams.filters);
            if (filterCount > 0) {
              label += ` (${filterCount} filter${filterCount > 1 ? 's' : ''})`;
            }
          }
          break;
      }
    }

    return label;
  }

  /**
   * Generate back navigation URL
   */
  public getBackUrl(context?: NavigationContext): string {
    const ctx = context || this.getContext();
    if (!ctx) {
      return '/';
    }

    const baseUrls: { [key in NavigationContext['source']]: string } = {
      'calendar': '/calendar',
      'trade-list': '/trades',
      'search': '/search',
      'dashboard': '/',
      'analytics': '/analytics'
    };

    let url = baseUrls[ctx.source];

    // Add query parameters based on source params
    if (ctx.sourceParams) {
      const params = new URLSearchParams();

      switch (ctx.source) {
        case 'calendar':
          if (ctx.sourceParams.date) {
            params.set('date', ctx.sourceParams.date);
          }
          if (ctx.sourceParams.viewMode) {
            params.set('view', ctx.sourceParams.viewMode);
          }
          break;

        case 'trade-list':
          if (ctx.sourceParams.page) {
            params.set('page', ctx.sourceParams.page.toString());
          }
          if (ctx.sourceParams.sortBy) {
            params.set('sort', ctx.sourceParams.sortBy);
            if (ctx.sourceParams.sortOrder) {
              params.set('order', ctx.sourceParams.sortOrder);
            }
          }
          if (ctx.sourceParams.filters) {
            this.addFiltersToParams(params, ctx.sourceParams.filters);
          }
          break;

        case 'search':
          if (ctx.sourceParams.searchQuery) {
            params.set('q', ctx.sourceParams.searchQuery);
          }
          if (ctx.sourceParams.page) {
            params.set('page', ctx.sourceParams.page.toString());
          }
          break;

        case 'analytics':
          if (ctx.sourceParams.timeRange) {
            params.set('range', ctx.sourceParams.timeRange);
          }
          if (ctx.sourceParams.activeTab) {
            params.set('tab', ctx.sourceParams.activeTab);
          }
          break;
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /**
   * Navigate to previous trade in history
   */
  public navigateToPreviousTrade(): string | null {
    if (!this.currentState || this.currentState.historyIndex <= 0) {
      return null;
    }

    this.currentState.historyIndex--;
    const previousTradeId = this.currentState.history[this.currentState.historyIndex];
    this.currentState.currentTradeId = previousTradeId;
    this.currentState.canNavigateBack = this.currentState.historyIndex > 0;
    this.currentState.canNavigateForward = true;

    this.persistToStorage();
    this.emitEvent({ type: 'NAVIGATION_BACK', payload: this.currentState.context });

    return previousTradeId;
  }

  /**
   * Navigate to next trade in history
   */
  public navigateToNextTrade(): string | null {
    if (!this.currentState || this.currentState.historyIndex >= this.currentState.history.length - 1) {
      return null;
    }

    this.currentState.historyIndex++;
    const nextTradeId = this.currentState.history[this.currentState.historyIndex];
    this.currentState.currentTradeId = nextTradeId;
    this.currentState.canNavigateBack = true;
    this.currentState.canNavigateForward = this.currentState.historyIndex < this.currentState.history.length - 1;

    this.persistToStorage();
    this.emitEvent({ type: 'NAVIGATION_FORWARD', payload: this.currentState.context });

    return nextTradeId;
  }

  /**
   * Clear current navigation context
   */
  public clearContext(): void {
    this.currentState = null;
    this.removeFromStorage();
    this.emitEvent({ type: 'CONTEXT_CLEARED', payload: null });
    this.log('Navigation context cleared');
  }

  /**
   * Validate navigation context
   */
  public validateContext(context: NavigationContext): NavigationContextValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const age = Date.now() - context.timestamp;
    const isStale = age > this.config.defaultMaxAge;

    // Required fields validation
    if (!context.source) {
      errors.push('Navigation source is required');
    }

    if (!context.breadcrumb || !Array.isArray(context.breadcrumb)) {
      errors.push('Breadcrumb must be an array');
    }

    if (!context.timestamp || typeof context.timestamp !== 'number') {
      errors.push('Timestamp is required and must be a number');
    }

    // Warnings for stale context
    if (isStale) {
      warnings.push(`Context is stale (${Math.round(age / (1000 * 60 * 60))} hours old)`);
    }

    // Source-specific validation
    if (context.source === 'search' && context.sourceParams?.searchQuery === '') {
      warnings.push('Search context has empty query');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      isStale,
      age
    };
  }

  /**
   * Get navigation analytics
   */
  public getAnalytics(): NavigationAnalytics {
    // This would typically pull from a more comprehensive analytics store
    // For now, return basic analytics based on current session
    return {
      sourceDistribution: {
        'calendar': 0,
        'trade-list': 0,
        'search': 0,
        'dashboard': 0,
        'analytics': 0
      },
      averageSessionDuration: 0,
      mostCommonPaths: [],
      backNavigationUsage: 0,
      contextRestorationSuccess: 0
    };
  }

  /**
   * Add event listener for navigation events
   */
  public addEventListener(listener: (event: NavigationEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: (event: NavigationEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Create navigation context from current location
   */
  public createContextFromLocation(
    source: NavigationContext['source'],
    additionalParams?: NavigationContext['sourceParams']
  ): NavigationContext {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    const sourceParams: NavigationContext['sourceParams'] = {
      ...additionalParams
    };

    // Extract common parameters
    if (params.has('page')) {
      sourceParams.page = parseInt(params.get('page')!, 10);
    }

    if (params.has('sort')) {
      sourceParams.sortBy = params.get('sort')!;
    }

    if (params.has('order')) {
      sourceParams.sortOrder = params.get('order') as 'asc' | 'desc';
    }

    // Source-specific parameter extraction
    switch (source) {
      case 'calendar':
        if (params.has('date')) {
          sourceParams.date = params.get('date')!;
        }
        if (params.has('view')) {
          sourceParams.viewMode = params.get('view') as 'list' | 'grid' | 'calendar';
        }
        break;

      case 'search':
        if (params.has('q')) {
          sourceParams.searchQuery = params.get('q')!;
        }
        break;

      case 'analytics':
        if (params.has('range')) {
          sourceParams.timeRange = params.get('range')!;
        }
        if (params.has('tab')) {
          sourceParams.activeTab = params.get('tab')!;
        }
        break;
    }

    return {
      source,
      sourceParams,
      breadcrumb: [source],
      timestamp: Date.now()
    };
  }

  // Private methods

  private initializeFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const parsedState = JSON.parse(stored) as NavigationState;
        const validation = this.validateContext(parsedState.context);
        
        if (validation.isValid && !validation.isStale) {
          this.currentState = parsedState;
          this.emitEvent({ type: 'CONTEXT_RESTORED', payload: parsedState.context });
          this.log('Navigation context restored from storage', parsedState);
        } else {
          this.log('Stored context is invalid or stale, clearing', validation);
          this.removeFromStorage();
        }
      }
    } catch (error) {
      this.log('Failed to restore navigation context from storage', error);
      this.removeFromStorage();
    }
  }

  private persistToStorage(): void {
    if (!this.currentState) {
      return;
    }

    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.currentState));
      this.log('Navigation context persisted to storage');
    } catch (error) {
      this.log('Failed to persist navigation context to storage', error);
    }
  }

  private removeFromStorage(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
      this.log('Navigation context removed from storage');
    } catch (error) {
      this.log('Failed to remove navigation context from storage', error);
    }
  }

  private emitEvent(event: NavigationEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.log('Error in navigation event listener', error);
      }
    });
  }

  private countActiveFilters(filters: TradeListFilters): number {
    let count = 0;
    
    // Only count filters that are explicitly set and not default values
    if (filters.status && filters.status !== 'all' && filters.status !== '') count++;
    if (filters.currencyPairs && Array.isArray(filters.currencyPairs) && filters.currencyPairs.length > 0) count++;
    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) count++;
    if (filters.profitability && filters.profitability !== 'all' && filters.profitability !== '') count++;
    if (filters.strategies && Array.isArray(filters.strategies) && filters.strategies.length > 0) count++;
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) count++;
    if (filters.accountId && filters.accountId.trim() !== '') count++;
    if (filters.searchText && filters.searchText.trim() !== '') count++;

    return count;
  }

  private addFiltersToParams(params: URLSearchParams, filters: TradeListFilters): void {
    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    
    if (filters.currencyPairs && filters.currencyPairs.length > 0) {
      params.set('pairs', filters.currencyPairs.join(','));
    }
    
    if (filters.dateRange) {
      params.set('from', filters.dateRange.start);
      params.set('to', filters.dateRange.end);
    }
    
    if (filters.profitability && filters.profitability !== 'all') {
      params.set('profit', filters.profitability);
    }
    
    if (filters.strategies && filters.strategies.length > 0) {
      params.set('strategies', filters.strategies.join(','));
    }
    
    if (filters.tags && filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }
    
    if (filters.accountId) {
      params.set('account', filters.accountId);
    }
    
    if (filters.searchText) {
      params.set('search', filters.searchText);
    }
  }

  private log(message: string, data?: any): void {
    if (this.config.enableDebugLogging) {
      console.log(`[NavigationContextService] ${message}`, data);
    }
  }
}

// Export singleton instance getter for convenience
export const getNavigationContextService = (config?: Partial<NavigationContextServiceConfig>) => 
  NavigationContextService.getInstance(config);

// Export default instance
export default NavigationContextService.getInstance();
/**
 * Browser History Service
 * 
 * Manages browser history integration for the trade review system.
 * Handles proper back/forward navigation and state preservation.
 */

import { NavigationContext } from '../types/navigation';
import { TradeReviewMode } from '../types/tradeReview';

export interface HistoryState {
  tradeId: string;
  mode: TradeReviewMode;
  navigationContext?: NavigationContext;
  timestamp: number;
  source: 'trade-review' | 'navigation' | 'direct';
}

export interface HistoryEntry {
  state: HistoryState;
  url: string;
  title: string;
}

export class BrowserHistoryService {
  private static instance: BrowserHistoryService;
  private listeners: ((entry: HistoryEntry) => void)[] = [];
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): BrowserHistoryService {
    if (!BrowserHistoryService.instance) {
      BrowserHistoryService.instance = new BrowserHistoryService();
    }
    return BrowserHistoryService.instance;
  }

  /**
   * Initialize browser history management
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Listen for browser navigation events
    window.addEventListener('popstate', this.handlePopState.bind(this));
    
    // Listen for page unload to clean up
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    this.isInitialized = true;
  }

  /**
   * Push a new trade review state to browser history
   */
  public pushTradeState(
    tradeId: string,
    mode: TradeReviewMode,
    navigationContext?: NavigationContext,
    options: {
      replace?: boolean;
      title?: string;
      url?: string;
    } = {}
  ): void {
    const { replace = false, title, url } = options;

    const state: HistoryState = {
      tradeId,
      mode,
      navigationContext,
      timestamp: Date.now(),
      source: 'trade-review'
    };

    const finalUrl = url || this.buildTradeUrl(tradeId, mode);
    const finalTitle = title || this.buildTradeTitle(tradeId, mode);

    if (replace) {
      window.history.replaceState(state, finalTitle, finalUrl);
    } else {
      window.history.pushState(state, finalTitle, finalUrl);
    }

    // Update document title
    document.title = finalTitle;

    // Notify listeners
    this.notifyListeners({
      state,
      url: finalUrl,
      title: finalTitle
    });
  }

  /**
   * Replace current history state
   */
  public replaceCurrentState(
    updates: Partial<HistoryState>,
    options: {
      title?: string;
      url?: string;
    } = {}
  ): void {
    const currentState = this.getCurrentState();
    if (!currentState) return;

    const newState: HistoryState = {
      ...currentState,
      ...updates,
      timestamp: Date.now()
    };

    const finalUrl = options.url || window.location.href;
    const finalTitle = options.title || document.title;

    window.history.replaceState(newState, finalTitle, finalUrl);
    
    if (options.title) {
      document.title = finalTitle;
    }

    this.notifyListeners({
      state: newState,
      url: finalUrl,
      title: finalTitle
    });
  }

  /**
   * Get current history state
   */
  public getCurrentState(): HistoryState | null {
    const state = window.history.state;
    
    if (state && this.isValidHistoryState(state)) {
      return state as HistoryState;
    }
    
    return null;
  }

  /**
   * Navigate back in history
   */
  public goBack(): void {
    window.history.back();
  }

  /**
   * Navigate forward in history
   */
  public goForward(): void {
    window.history.forward();
  }

  /**
   * Check if we can navigate back
   */
  public canGoBack(): boolean {
    // This is a limitation of the History API - we can't reliably detect
    // if there's a previous entry. We'll use our navigation context instead.
    const state = this.getCurrentState();
    return Boolean(state?.navigationContext);
  }

  /**
   * Check if we can navigate forward
   */
  public canGoForward(): boolean {
    // Similar limitation - we'll rely on our internal state management
    return false; // For now, we don't track forward navigation
  }

  /**
   * Create a navigation entry for external navigation
   */
  public createNavigationEntry(
    targetUrl: string,
    context: NavigationContext,
    options: {
      title?: string;
      replace?: boolean;
    } = {}
  ): void {
    const { title = 'Navigation', replace = false } = options;

    const state: HistoryState = {
      tradeId: '',
      mode: 'view',
      navigationContext: context,
      timestamp: Date.now(),
      source: 'navigation'
    };

    if (replace) {
      window.history.replaceState(state, title, targetUrl);
    } else {
      window.history.pushState(state, title, targetUrl);
    }

    document.title = title;
  }

  /**
   * Clean up history state when leaving trade review
   */
  public cleanupTradeHistory(): void {
    const state = this.getCurrentState();
    
    if (state && state.source === 'trade-review') {
      // Replace with a clean state
      const cleanState: HistoryState = {
        tradeId: '',
        mode: 'view',
        timestamp: Date.now(),
        source: 'direct'
      };
      
      window.history.replaceState(cleanState, 'Trade Review System', '/');
    }
  }

  /**
   * Add listener for history changes
   */
  public addListener(listener: (entry: HistoryEntry) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   */
  public removeListener(listener: (entry: HistoryEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get history analytics
   */
  public getHistoryAnalytics(): {
    totalEntries: number;
    tradeReviewEntries: number;
    averageSessionDuration: number;
  } {
    // This would typically integrate with a more comprehensive analytics system
    return {
      totalEntries: 0,
      tradeReviewEntries: 0,
      averageSessionDuration: 0
    };
  }

  // Private methods

  private handlePopState(event: PopStateEvent): void {
    const state = event.state;
    
    if (state && this.isValidHistoryState(state)) {
      const historyState = state as HistoryState;
      
      this.notifyListeners({
        state: historyState,
        url: window.location.href,
        title: document.title
      });
    }
  }

  private handleBeforeUnload(): void {
    // Clean up any pending operations
    this.cleanupTradeHistory();
  }

  private buildTradeUrl(tradeId: string, mode: TradeReviewMode): string {
    let url = `/trade/${tradeId}`;
    if (mode !== 'view') {
      url += `/${mode}`;
    }
    return url;
  }

  private buildTradeTitle(tradeId: string, mode: TradeReviewMode): string {
    const modeText = mode === 'edit' ? ' - Edit' : mode === 'review' ? ' - Review' : '';
    return `Trade ${tradeId}${modeText} | Trade Review System`;
  }

  private isValidHistoryState(state: any): boolean {
    return (
      state &&
      typeof state === 'object' &&
      typeof state.tradeId === 'string' &&
      typeof state.mode === 'string' &&
      typeof state.timestamp === 'number' &&
      typeof state.source === 'string' &&
      ['trade-review', 'navigation', 'direct'].includes(state.source)
    );
  }

  private notifyListeners(entry: HistoryEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Error in history listener:', error);
      }
    });
  }
}

// Export singleton instance
export const browserHistoryService = BrowserHistoryService.getInstance();
export default browserHistoryService;
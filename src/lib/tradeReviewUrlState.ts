/**
 * Trade Review URL State Management
 * 
 * Handles URL state management for deep linking into trade review system.
 * Supports preserving view mode, active panel, and navigation context.
 */

import React from 'react';
import { TradeReviewMode } from '../types/tradeReview';
import { NavigationContext } from '../types/navigation';

export interface TradeReviewUrlState {
  mode: TradeReviewMode;
  panel: 'data' | 'analysis' | 'performance' | 'workflow';
  expandedSections: string[];
  navigationSource?: NavigationContext['source'];
}

export class TradeReviewUrlStateManager {
  private static readonly URL_PARAMS = {
    MODE: 'mode',
    PANEL: 'panel',
    EXPANDED: 'expanded',
    NAV_SOURCE: 'from'
  } as const;

  /**
   * Parse trade review state from current URL
   */
  static parseFromUrl(): Partial<TradeReviewUrlState> {
    const params = new URLSearchParams(window.location.search);
    const state: Partial<TradeReviewUrlState> = {};

    // Parse mode
    const mode = params.get(this.URL_PARAMS.MODE);
    if (mode && ['view', 'edit', 'review'].includes(mode)) {
      state.mode = mode as TradeReviewMode;
    }

    // Parse active panel
    const panel = params.get(this.URL_PARAMS.PANEL);
    if (panel && ['data', 'analysis', 'performance', 'workflow'].includes(panel)) {
      state.panel = panel as TradeReviewUrlState['panel'];
    }

    // Parse expanded sections
    const expanded = params.get(this.URL_PARAMS.EXPANDED);
    if (expanded) {
      state.expandedSections = expanded.split(',').filter(Boolean);
    }

    // Parse navigation source
    const navSource = params.get(this.URL_PARAMS.NAV_SOURCE);
    if (navSource && ['calendar', 'trade-list', 'search', 'dashboard', 'analytics'].includes(navSource)) {
      state.navigationSource = navSource as NavigationContext['source'];
    }

    return state;
  }

  /**
   * Update URL with trade review state
   */
  static updateUrl(
    tradeId: string,
    state: Partial<TradeReviewUrlState>,
    options: { replace?: boolean } = {}
  ): void {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Update mode
    if (state.mode) {
      if (state.mode === 'view') {
        params.delete(this.URL_PARAMS.MODE); // Default mode, don't clutter URL
      } else {
        params.set(this.URL_PARAMS.MODE, state.mode);
      }
    }

    // Update panel
    if (state.panel) {
      if (state.panel === 'data') {
        params.delete(this.URL_PARAMS.PANEL); // Default panel, don't clutter URL
      } else {
        params.set(this.URL_PARAMS.PANEL, state.panel);
      }
    }

    // Update expanded sections
    if (state.expandedSections) {
      if (state.expandedSections.length === 0) {
        params.delete(this.URL_PARAMS.EXPANDED);
      } else {
        params.set(this.URL_PARAMS.EXPANDED, state.expandedSections.join(','));
      }
    }

    // Update navigation source
    if (state.navigationSource) {
      params.set(this.URL_PARAMS.NAV_SOURCE, state.navigationSource);
    }

    // Update browser history
    const newUrl = `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    
    if (options.replace) {
      window.history.replaceState(null, '', newUrl);
    } else {
      window.history.pushState(null, '', newUrl);
    }
  }

  /**
   * Generate shareable URL for trade review
   */
  static generateShareableUrl(
    tradeId: string,
    state: TradeReviewUrlState,
    baseUrl?: string
  ): string {
    const base = baseUrl || window.location.origin;
    const url = new URL(`${base}/trade/${tradeId}`);
    const params = url.searchParams;

    // Add non-default parameters
    if (state.mode !== 'view') {
      params.set(this.URL_PARAMS.MODE, state.mode);
    }

    if (state.panel !== 'data') {
      params.set(this.URL_PARAMS.PANEL, state.panel);
    }

    if (state.expandedSections.length > 0) {
      params.set(this.URL_PARAMS.EXPANDED, state.expandedSections.join(','));
    }

    if (state.navigationSource) {
      params.set(this.URL_PARAMS.NAV_SOURCE, state.navigationSource);
    }

    return url.toString();
  }

  /**
   * Create URL for trade navigation with context preservation
   */
  static createTradeNavigationUrl(
    tradeId: string,
    currentState: Partial<TradeReviewUrlState>,
    preserveContext: boolean = true
  ): string {
    const url = new URL(`${window.location.origin}/trade/${tradeId}`);
    
    if (!preserveContext) {
      return url.toString();
    }

    const params = url.searchParams;

    // Preserve current state
    if (currentState.mode && currentState.mode !== 'view') {
      params.set(this.URL_PARAMS.MODE, currentState.mode);
    }

    if (currentState.panel && currentState.panel !== 'data') {
      params.set(this.URL_PARAMS.PANEL, currentState.panel);
    }

    if (currentState.navigationSource) {
      params.set(this.URL_PARAMS.NAV_SOURCE, currentState.navigationSource);
    }

    return url.toString();
  }

  /**
   * Parse navigation context from URL parameters
   */
  static parseNavigationContext(): Partial<NavigationContext> | null {
    const params = new URLSearchParams(window.location.search);
    const source = params.get(this.URL_PARAMS.NAV_SOURCE);

    if (!source || !['calendar', 'trade-list', 'search', 'dashboard', 'analytics'].includes(source)) {
      return null;
    }

    return {
      source: source as NavigationContext['source'],
      breadcrumb: ['dashboard', source],
      timestamp: Date.now()
    };
  }

  /**
   * Clean up URL parameters when leaving trade review
   */
  static cleanupUrl(): void {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Remove trade review specific parameters
    params.delete(this.URL_PARAMS.MODE);
    params.delete(this.URL_PARAMS.PANEL);
    params.delete(this.URL_PARAMS.EXPANDED);
    params.delete(this.URL_PARAMS.NAV_SOURCE);

    const newUrl = `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }

  /**
   * Validate URL state parameters
   */
  static validateUrlState(state: Partial<TradeReviewUrlState>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (state.mode && !['view', 'edit', 'review'].includes(state.mode)) {
      errors.push(`Invalid mode: ${state.mode}`);
    }

    if (state.panel && !['data', 'analysis', 'performance', 'workflow'].includes(state.panel)) {
      errors.push(`Invalid panel: ${state.panel}`);
    }

    if (state.expandedSections && !Array.isArray(state.expandedSections)) {
      errors.push('Expanded sections must be an array');
    }

    if (state.navigationSource && !['calendar', 'trade-list', 'search', 'dashboard', 'analytics'].includes(state.navigationSource)) {
      errors.push(`Invalid navigation source: ${state.navigationSource}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * React hook for managing trade review URL state
 */
export function useTradeReviewUrlState(tradeId: string) {
  const [urlState, setUrlState] = React.useState<Partial<TradeReviewUrlState>>(() => 
    TradeReviewUrlStateManager.parseFromUrl()
  );

  // Update URL when state changes
  const updateUrlState = React.useCallback((
    newState: Partial<TradeReviewUrlState>,
    options: { replace?: boolean } = {}
  ) => {
    const validation = TradeReviewUrlStateManager.validateUrlState(newState);
    if (!validation.isValid) {
      console.warn('Invalid URL state:', validation.errors);
      return;
    }

    setUrlState(prev => ({ ...prev, ...newState }));
    TradeReviewUrlStateManager.updateUrl(tradeId, newState, options);
  }, [tradeId]);

  // Listen for browser navigation
  React.useEffect(() => {
    const handlePopState = () => {
      const newState = TradeReviewUrlStateManager.parseFromUrl();
      setUrlState(newState);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Generate shareable URL
  const generateShareableUrl = React.useCallback((baseUrl?: string) => {
    const fullState: TradeReviewUrlState = {
      mode: urlState.mode || 'view',
      panel: urlState.panel || 'data',
      expandedSections: urlState.expandedSections || [],
      navigationSource: urlState.navigationSource
    };
    return TradeReviewUrlStateManager.generateShareableUrl(tradeId, fullState, baseUrl);
  }, [tradeId, urlState]);

  return {
    urlState,
    updateUrlState,
    generateShareableUrl
  };
}

export default TradeReviewUrlStateManager;
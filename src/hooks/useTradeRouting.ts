/**
 * Trade Routing Hook
 * 
 * Provides routing utilities and state management for trade navigation.
 * Handles deep linking, navigation context, and browser history integration.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTradeContext } from '../contexts/TradeContext';
import navigationContextService from '../lib/navigationContextService';
import TradeReviewUrlStateManager from '../lib/tradeReviewUrlState';
import { NavigationContext } from '../types/navigation';
import { TradeReviewMode } from '../types/tradeReview';
import { Trade } from '../types/trade';

export interface TradeRoutingState {
  currentTrade: Trade | null;
  navigationContext: NavigationContext | null;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  isValidRoute: boolean;
}

export interface TradeNavigationOptions {
  preserveContext?: boolean;
  mode?: TradeReviewMode;
  panel?: 'data' | 'analysis' | 'performance' | 'workflow';
  replace?: boolean;
}

export function useTradeRouting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tradeId } = useParams<{ tradeId: string }>();
  const { trades } = useTradeContext();
  
  const [routingState, setRoutingState] = useState<TradeRoutingState>({
    currentTrade: null,
    navigationContext: null,
    canNavigateBack: false,
    canNavigateForward: false,
    isValidRoute: false
  });

  // Update routing state when dependencies change
  useEffect(() => {
    const currentTrade = tradeId ? trades.find(t => t.id === tradeId) : null;
    const navigationContext = navigationContextService.getContext();
    const navState = navigationContextService.getNavigationState();
    
    setRoutingState({
      currentTrade,
      navigationContext,
      canNavigateBack: Boolean(navigationContext || navState?.canNavigateBack),
      canNavigateForward: Boolean(navState?.canNavigateForward),
      isValidRoute: Boolean(tradeId && currentTrade)
    });
  }, [tradeId, trades]);

  /**
   * Navigate to a specific trade with context preservation
   */
  const navigateToTrade = useCallback((
    targetTradeId: string,
    options: TradeNavigationOptions = {}
  ) => {
    const {
      preserveContext = true,
      mode = 'view',
      panel,
      replace = false
    } = options;

    // Build the target URL
    let targetPath = `/trade/${targetTradeId}`;
    if (mode !== 'view') {
      targetPath += `/${mode}`;
    }

    // Preserve current URL state if requested
    if (preserveContext) {
      const currentUrlState = TradeReviewUrlStateManager.parseFromUrl();
      const urlParams = new URLSearchParams();
      
      if (currentUrlState.navigationSource) {
        urlParams.set('from', currentUrlState.navigationSource);
      }
      
      if (panel && panel !== 'data') {
        urlParams.set('panel', panel);
      }
      
      if (urlParams.toString()) {
        targetPath += `?${urlParams.toString()}`;
      }
    }

    // Navigate with state preservation
    navigate(targetPath, {
      replace,
      state: {
        preserveContext,
        sourceTradeId: tradeId,
        navigationContext: routingState.navigationContext
      }
    });
  }, [navigate, tradeId, routingState.navigationContext]);

  /**
   * Navigate back to the source location
   */
  const navigateBack = useCallback(() => {
    const context = routingState.navigationContext;
    
    if (context) {
      // Clean up URL parameters
      TradeReviewUrlStateManager.cleanupUrl();
      
      // Navigate to source
      const backUrl = navigationContextService.getBackUrl(context);
      navigate(backUrl);
    } else {
      // Fallback to dashboard
      navigate('/');
    }
  }, [navigate, routingState.navigationContext]);

  /**
   * Navigate to previous trade in sequence
   */
  const navigateToPreviousTrade = useCallback(() => {
    if (!tradeId) return null;
    
    const currentIndex = trades.findIndex(t => t.id === tradeId);
    if (currentIndex > 0) {
      const previousTrade = trades[currentIndex - 1];
      navigateToTrade(previousTrade.id, { preserveContext: true });
      return previousTrade.id;
    }
    
    return null;
  }, [tradeId, trades, navigateToTrade]);

  /**
   * Navigate to next trade in sequence
   */
  const navigateToNextTrade = useCallback(() => {
    if (!tradeId) return null;
    
    const currentIndex = trades.findIndex(t => t.id === tradeId);
    if (currentIndex >= 0 && currentIndex < trades.length - 1) {
      const nextTrade = trades[currentIndex + 1];
      navigateToTrade(nextTrade.id, { preserveContext: true });
      return nextTrade.id;
    }
    
    return null;
  }, [tradeId, trades, navigateToTrade]);

  /**
   * Set navigation context for current route
   */
  const setNavigationContext = useCallback((
    source: NavigationContext['source'],
    sourceParams?: NavigationContext['sourceParams']
  ) => {
    if (!tradeId) return;
    
    const context: NavigationContext = {
      source,
      sourceParams,
      breadcrumb: ['dashboard', source],
      timestamp: Date.now()
    };
    
    navigationContextService.setContext(tradeId, context);
    
    // Update local state
    setRoutingState(prev => ({
      ...prev,
      navigationContext: context,
      canNavigateBack: true
    }));
  }, [tradeId]);

  /**
   * Generate shareable URL for current trade
   */
  const generateShareableUrl = useCallback((baseUrl?: string) => {
    if (!tradeId) return '';
    
    const urlState = TradeReviewUrlStateManager.parseFromUrl();
    const fullState = {
      mode: urlState.mode || 'view' as TradeReviewMode,
      panel: urlState.panel || 'data' as const,
      expandedSections: urlState.expandedSections || [],
      navigationSource: urlState.navigationSource
    };
    
    return TradeReviewUrlStateManager.generateShareableUrl(tradeId, fullState, baseUrl);
  }, [tradeId]);

  /**
   * Create navigation URL with context
   */
  const createNavigationUrl = useCallback((
    targetTradeId: string,
    context?: NavigationContext,
    mode: TradeReviewMode = 'view'
  ) => {
    let url = `/trade/${targetTradeId}`;
    if (mode !== 'view') {
      url += `/${mode}`;
    }
    
    if (context) {
      const params = new URLSearchParams();
      params.set('from', context.source);
      url += `?${params.toString()}`;
    }
    
    return url;
  }, []);

  /**
   * Validate current route and redirect if necessary
   */
  const validateAndRedirect = useCallback(() => {
    if (!tradeId) {
      navigate('/', { replace: true });
      return false;
    }
    
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) {
      // Trade not found, redirect with error context
      const context = routingState.navigationContext;
      if (context) {
        const backUrl = navigationContextService.getBackUrl(context);
        navigate(backUrl, { 
          replace: true,
          state: { error: 'Trade not found' }
        });
      } else {
        navigate('/', { 
          replace: true,
          state: { error: 'Trade not found' }
        });
      }
      return false;
    }
    
    return true;
  }, [tradeId, trades, navigate, routingState.navigationContext]);

  /**
   * Get navigation breadcrumb for current context
   */
  const getBreadcrumb = useCallback(() => {
    const context = routingState.navigationContext;
    if (!context) return [];
    
    const breadcrumb = [...context.breadcrumb];
    
    // Add current trade to breadcrumb
    if (routingState.currentTrade) {
      breadcrumb.push(`Trade: ${routingState.currentTrade.currencyPair}`);
    }
    
    return breadcrumb;
  }, [routingState.navigationContext, routingState.currentTrade]);

  /**
   * Get back navigation label
   */
  const getBackLabel = useCallback(() => {
    const context = routingState.navigationContext;
    return context 
      ? navigationContextService.generateBackLabel(context)
      : 'Back to Dashboard';
  }, [routingState.navigationContext]);

  return {
    // State
    routingState,
    
    // Navigation functions
    navigateToTrade,
    navigateBack,
    navigateToPreviousTrade,
    navigateToNextTrade,
    
    // Context management
    setNavigationContext,
    
    // URL utilities
    generateShareableUrl,
    createNavigationUrl,
    
    // Validation
    validateAndRedirect,
    
    // UI helpers
    getBreadcrumb,
    getBackLabel
  };
}

export default useTradeRouting;
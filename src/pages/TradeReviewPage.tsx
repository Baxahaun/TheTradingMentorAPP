/**
 * Trade Review Page
 * 
 * Dedicated page component for the comprehensive trade review system.
 * Handles routing integration, navigation context, and deep linking support.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTradeContext } from '../contexts/TradeContext';
import navigationContextService from '../lib/navigationContextService';
import TradeReviewUrlStateManager from '../lib/tradeReviewUrlState';
import TradeReviewSystem from '../components/TradeReviewSystem';
import { NavigationContext } from '../types/navigation';
import { TradeReviewMode } from '../types/tradeReview';

interface TradeReviewPageProps {
  initialMode?: TradeReviewMode;
}

const TradeReviewPage: React.FC<TradeReviewPageProps> = ({
  initialMode = 'view'
}) => {
  const { tradeId } = useParams<{ tradeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { trades } = useTradeContext();
  
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null);
  const [isContextInitialized, setIsContextInitialized] = useState(false);

  // Find the current trade
  const trade = trades.find(t => t.id === tradeId);

  // Initialize navigation context and URL state
  useEffect(() => {
    if (!tradeId) return;

    const initializeContext = () => {
      // Check if context was passed via location state (from navigation)
      const stateContext = location.state?.navigationContext as NavigationContext | undefined;
      
      // Try to get existing context from service
      let context = navigationContextService.getContext();
      
      // Use state context if available and valid
      if (stateContext && !context) {
        context = stateContext;
        navigationContextService.setContext(tradeId, context);
      }
      
      // If still no context, try to infer from URL parameters
      if (!context) {
        const urlContext = TradeReviewUrlStateManager.parseNavigationContext();
        if (urlContext) {
          context = {
            ...urlContext,
            breadcrumb: ['dashboard', urlContext.source!],
            timestamp: Date.now()
          } as NavigationContext;
          navigationContextService.setContext(tradeId, context);
        }
      }
      
      // Fallback to dashboard context if no context found
      if (!context) {
        context = {
          source: 'dashboard',
          breadcrumb: ['dashboard'],
          timestamp: Date.now()
        };
        navigationContextService.setContext(tradeId, context);
      }
      
      setNavigationContext(context);
      setIsContextInitialized(true);
    };

    initializeContext();
  }, [tradeId, location.state]);

  // Handle navigation back from trade review
  const handleNavigateBack = (context: NavigationContext) => {
    // Clean up URL parameters when leaving
    TradeReviewUrlStateManager.cleanupUrl();
    
    // Navigate to the source location
    const backUrl = navigationContextService.getBackUrl(context);
    navigate(backUrl);
  };

  // Handle browser history management
  useEffect(() => {
    if (!tradeId || !trade) return;

    // Set up browser history state for proper back button handling
    const currentState = {
      tradeId,
      navigationContext,
      timestamp: Date.now()
    };

    // Replace current history state to include our context
    window.history.replaceState(currentState, '', window.location.href);

    // Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      if (state?.navigationContext) {
        // User navigated back/forward within trade review
        setNavigationContext(state.navigationContext);
      } else if (navigationContext) {
        // User pressed back button, navigate to source
        handleNavigateBack(navigationContext);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [tradeId, trade, navigationContext]);

  // Update document title for better UX
  useEffect(() => {
    if (trade) {
      const modeText = initialMode === 'edit' ? ' - Edit' : initialMode === 'review' ? ' - Review' : '';
      document.title = `${trade.currencyPair} Trade${modeText} | Trade Review`;
    }
    
    return () => {
      document.title = 'Trade Review System';
    };
  }, [trade, initialMode]);

  // Handle deep linking support
  useEffect(() => {
    if (!tradeId) return;

    // Parse URL state for deep linking
    const urlState = TradeReviewUrlStateManager.parseFromUrl();
    
    // If URL contains navigation source, ensure context is set
    if (urlState.navigationSource && !navigationContext) {
      const context = navigationContextService.createContextFromLocation(urlState.navigationSource);
      navigationContextService.setContext(tradeId, context);
      setNavigationContext(context);
    }
  }, [tradeId, navigationContext]);

  // Don't render until context is initialized
  if (!isContextInitialized || !tradeId) {
    return null;
  }

  return (
    <TradeReviewSystem
      tradeId={tradeId}
      navigationContext={navigationContext}
      initialMode={initialMode}
      onNavigateBack={handleNavigateBack}
    />
  );
};

export default TradeReviewPage;
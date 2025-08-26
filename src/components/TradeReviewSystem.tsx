import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trade, TradeWithStrategy } from '../types/trade';
import { ProfessionalStrategy } from '../types/strategy';
import { NavigationContext } from '../types/navigation';
import { TradeReviewMode, ViewState, TradeReviewError, TradeReviewErrorType } from '../types/tradeReview';
import { useTradeContext } from '../contexts/TradeContext';
import navigationContextService from '../lib/navigationContextService';
import { useTradeReviewUrlState } from '../lib/tradeReviewUrlState';
import { useMobileResponsive, useTouchGestures, useMobileOptimizations } from '../hooks/useMobileResponsive';
import { useFocusManagement } from '../hooks/useAccessibility';
import TradeReviewHeader from './trade-review/TradeReviewHeader';
import TradeReviewContent from './trade-review/TradeReviewContent';
import { AccessibilityButton } from './accessibility/AccessibilityControls';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { StrategyPerformanceService } from '../services/StrategyPerformanceService';

interface TradeReviewSystemProps {
  tradeId?: string;
  navigationContext?: NavigationContext;
  initialMode?: TradeReviewMode;
  onNavigateBack?: (context: NavigationContext) => void;
  embedded?: boolean;
  availableStrategies?: ProfessionalStrategy[];
  onNavigateToStrategy?: (strategyId: string) => void;
}

const TradeReviewSystem: React.FC<TradeReviewSystemProps> = ({
  tradeId: propTradeId,
  navigationContext: propNavigationContext,
  initialMode = 'view',
  onNavigateBack,
  embedded = false,
  availableStrategies = [],
  onNavigateToStrategy
}) => {
  const { tradeId: paramTradeId } = useParams<{ tradeId: string }>();
  const navigate = useNavigate();
  const { trades, updateTrade } = useTradeContext();
  
  // Use prop tradeId if provided, otherwise use URL param
  const currentTradeId = propTradeId || paramTradeId;
  
  // Mobile and accessibility hooks
  const { isMobile, isTablet } = useMobileResponsive();
  const { focusElement } = useFocusManagement();
  useMobileOptimizations();
  
  // URL state management for deep linking
  const { urlState, updateUrlState, generateShareableUrl } = useTradeReviewUrlState(currentTradeId || '');
  
  // State management
  const [trade, setTrade] = useState<Trade | null>(null);
  const [editedTrade, setEditedTrade] = useState<TradeWithStrategy | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    mode: urlState.mode || initialMode,
    activePanel: urlState.panel || 'data',
    expandedSections: urlState.expandedSections || [],
    unsavedChanges: false
  });
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null);
  const [error, setError] = useState<TradeReviewError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareableUrl, setShareableUrl] = useState<string>('');

  // Services
  const performanceService = new StrategyPerformanceService();

  // Find current trade and navigation info
  const currentTradeIndex = trades.findIndex(t => t.id === currentTradeId);
  const currentTrade = currentTradeIndex >= 0 ? trades[currentTradeIndex] : null;
  const prevTrade = currentTradeIndex > 0 ? trades[currentTradeIndex - 1] : null;
  const nextTrade = currentTradeIndex >= 0 && currentTradeIndex < trades.length - 1 ? trades[currentTradeIndex + 1] : null;

  // Initialize trade and navigation context
  useEffect(() => {
    if (currentTrade) {
      setTrade(currentTrade);
      setEditedTrade({ ...currentTrade });
      setError(null);
    } else if (currentTradeId) {
      setError({
        type: TradeReviewErrorType.TRADE_NOT_FOUND,
        message: 'The requested trade could not be found.',
        recoverable: true,
        suggestedAction: 'Return to trade list'
      });
    }
    setIsLoading(false);
  }, [currentTrade, currentTradeId]);

  // Load navigation context and generate shareable URL
  useEffect(() => {
    const context = propNavigationContext || navigationContextService.getContext();
    setNavigationContext(context);
    
    // Generate shareable URL
    if (currentTradeId) {
      const url = generateShareableUrl();
      setShareableUrl(url);
    }
  }, [propNavigationContext, currentTradeId, generateShareableUrl]);

  // Sync URL state with view state
  useEffect(() => {
    if (urlState.mode && urlState.mode !== viewState.mode) {
      setViewState(prev => ({ ...prev, mode: urlState.mode! }));
    }
    if (urlState.panel && urlState.panel !== viewState.activePanel) {
      setViewState(prev => ({ ...prev, activePanel: urlState.panel! }));
    }
    if (urlState.expandedSections && urlState.expandedSections !== viewState.expandedSections) {
      setViewState(prev => ({ ...prev, expandedSections: urlState.expandedSections! }));
    }
  }, [urlState]);

  // Handle mode changes
  const handleModeChange = useCallback((mode: TradeReviewMode) => {
    setViewState(prev => ({ ...prev, mode }));
    updateUrlState({ mode }, { replace: true });
  }, [updateUrlState]);

  // Handle trade field changes
  const handleTradeChange = useCallback((field: keyof TradeWithStrategy, value: any) => {
    if (!editedTrade) return;
    
    setEditedTrade(prev => prev ? { ...prev, [field]: value } : null);
    setViewState(prev => ({ ...prev, unsavedChanges: true }));
  }, [editedTrade]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!editedTrade || !trade) return;

    try {
      await updateTrade(editedTrade.id, editedTrade);
      setTrade({ ...editedTrade });
      setViewState(prev => ({ 
        ...prev, 
        mode: 'view',
        unsavedChanges: false 
      }));
    } catch (error) {
      console.error('Error updating trade:', error);
      setError({
        type: TradeReviewErrorType.SAVE_FAILED,
        message: 'Failed to save trade changes.',
        recoverable: true,
        suggestedAction: 'Try saving again'
      });
    }
  }, [editedTrade, trade, updateTrade]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (!trade) return;
    
    setEditedTrade({ ...trade });
    setViewState(prev => ({ 
      ...prev, 
      mode: 'view',
      unsavedChanges: false 
    }));
  }, [trade]);

  // Handle navigation back
  const handleNavigateBack = useCallback(() => {
    if (onNavigateBack && navigationContext) {
      onNavigateBack(navigationContext);
      return;
    }

    if (navigationContext) {
      const backUrl = navigationContextService.getBackUrl(navigationContext);
      navigate(backUrl);
    } else {
      // Default fallback
      navigate('/', { state: { page: 'trades' } });
    }
  }, [navigate, navigationContext, onNavigateBack]);

  // Handle trade navigation
  const handleNavigateToTrade = useCallback((tradeId: string) => {
    if (propTradeId) {
      // If using as embedded component, don't navigate
      return;
    }
    
    // Preserve current URL state when navigating to another trade
    const currentState = {
      mode: viewState.mode,
      panel: viewState.activePanel,
      expandedSections: viewState.expandedSections,
      navigationSource: urlState.navigationSource
    };
    
    navigate(`/trade/${tradeId}`, {
      state: { preserveUrlState: currentState }
    });
    
    // Focus management for accessibility
    setTimeout(() => {
      focusElement('h1', 100);
    }, 100);
  }, [navigate, propTradeId, viewState, urlState, focusElement]);

  // Touch gesture handling for mobile navigation
  const { handleTouchStart, handleTouchEnd } = useTouchGestures(
    (gesture) => {
      if (!isMobile) return;
      
      // Swipe left for next trade
      if (gesture.direction === 'left' && nextTrade) {
        handleNavigateToTrade(nextTrade.id);
      }
      // Swipe right for previous trade
      else if (gesture.direction === 'right' && prevTrade) {
        handleNavigateToTrade(prevTrade.id);
      }
    },
    100 // threshold
  );

  // Handle panel changes
  const handlePanelChange = useCallback((panel: ViewState['activePanel']) => {
    setViewState(prev => ({ ...prev, activePanel: panel }));
    updateUrlState({ panel }, { replace: true });
  }, [updateUrlState]);

  // Handle navigation to source
  const handleNavigateToSource = useCallback((context: NavigationContext) => {
    switch (context.source) {
      case 'trade-list':
      case 'trades':
        // Navigate to trades list via main page with state
        navigate('/', { state: { page: 'trades' } });
        break;
      case 'search':
        // Search results are shown in trades page
        navigate('/', { state: { page: 'trades' } });
        break;
      case 'dashboard':
        // Navigate to dashboard
        navigate('/', { state: { page: 'dashboard' } });
        break;
      case 'calendar':
        // Navigate to calendar
        navigate('/', { state: { page: 'calendar' } });
        break;
      case 'analytics':
        // Navigate to analytics
        navigate('/', { state: { page: 'analytics' } });
        break;
      default:
        // Fallback to URL-based navigation
        const backUrl = navigationContextService.getBackUrl(context);
        navigate(backUrl);
        break;
    }
  }, [navigate]);

  // Handle navigation to home
  const handleNavigateHome = useCallback(() => {
    navigate('/', { state: { page: 'dashboard' } });
  }, [navigate]);

  // Handle share functionality
  const handleShare = useCallback(async () => {
    const url = generateShareableUrl();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Trade Review: ${editedTrade?.currencyPair}`,
          text: `Review trade details for ${editedTrade?.currencyPair}`,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Trade review link has been copied to clipboard.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share failed",
        description: "Unable to share or copy link. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [generateShareableUrl, editedTrade]);

  // Handle performance update
  const handlePerformanceUpdate = useCallback(async (strategyId: string) => {
    if (!editedTrade || editedTrade.status !== 'closed') return;
    
    try {
      await performanceService.updatePerformanceMetrics(strategyId, editedTrade);
      toast({
        title: "Performance Updated",
        description: "Strategy performance metrics have been updated.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating performance:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update strategy performance metrics.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [editedTrade, performanceService]);

  // Auto-save functionality
  useEffect(() => {
    if (!viewState.unsavedChanges || viewState.mode !== 'edit') return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [viewState.unsavedChanges, viewState.mode, handleSave]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center h-screen"
        role="status"
        aria-live="polite"
        aria-label="Loading trade data"
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-gray-600">Loading trade...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="flex items-center justify-center h-screen"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center max-w-md mobile-container">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-2 responsive-text-xl"
            id="error-title"
          >
            {error.type === TradeReviewErrorType.TRADE_NOT_FOUND ? 'Trade Not Found' : 'Error'}
          </h2>
          <p 
            className="text-gray-600 mb-4 responsive-text-base"
            id="error-description"
          >
            {error.message}
          </p>
          <Button 
            onClick={handleNavigateBack}
            className="mobile-button"
            aria-describedby="error-title error-description"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            {navigationContext ? navigationContextService.generateBackLabel(navigationContext) : 'Back to Trades'}
          </Button>
        </div>
      </div>
    );
  }

  // Main render
  if (!trade || !editedTrade) {
    return null;
  }

  return (
    <>
      {/* Skip Links for Accessibility */}
      <a 
        href="#main-content" 
        className="skip-link"
        onFocus={() => focusElement('#main-content')}
      >
        Skip to main content
      </a>
      
      <div 
        className={`${embedded ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col ${isMobile ? 'mobile-container' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="main"
        aria-label={`Trade review for ${editedTrade.currencyPair}`}
      >
        <TradeReviewHeader
          trade={trade}
          editedTrade={editedTrade}
          navigationContext={navigationContext}
          isEditing={viewState.mode === 'edit'}
          currentMode={viewState.mode}
          hasUnsavedChanges={viewState.unsavedChanges}
          prevTrade={prevTrade}
          nextTrade={nextTrade}
          currentTradeIndex={currentTradeIndex}
          totalTrades={trades.length}
          shareableUrl={shareableUrl}
          isMobile={isMobile}
          isTablet={isTablet}
          onModeChange={handleModeChange}
          onNavigateBack={handleNavigateBack}
          onNavigateToTrade={handleNavigateToTrade}
          onNavigateToSource={handleNavigateToSource}
          onNavigateHome={handleNavigateHome}
          onShare={handleShare}
          onSave={handleSave}
          onCancel={handleCancel}
        />
        
        <main id="main-content" className="flex-1 min-h-0">
          <TradeReviewContent
            trade={trade}
            editedTrade={editedTrade}
            isEditing={viewState.mode === 'edit'}
            currentMode={viewState.mode}
            activePanel={viewState.activePanel}
            isMobile={isMobile}
            isTablet={isTablet}
            availableStrategies={availableStrategies}
            onTradeChange={handleTradeChange}
            onPanelChange={handlePanelChange}
            onNavigateToStrategy={onNavigateToStrategy}
            onPerformanceUpdate={handlePerformanceUpdate}
          />
        </main>
        
        {/* Accessibility Controls */}
        <AccessibilityButton />
      </div>
    </>
  );
};

export default TradeReviewSystem;
/**
 * Trade Route Guard
 * 
 * Validates trade access and provides route-level protection for trade review system.
 * Ensures trades exist and user has access before rendering trade review components.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTradeContext } from '../../contexts/TradeContext';
import { useAuth } from '../../contexts/AuthContext';
import navigationContextService from '../../lib/navigationContextService';
import { NavigationContext } from '../../types/navigation';
import { TradeReviewMode } from '../../types/tradeReview';
import LoadingSpinner from '../LoadingSpinner';
import { Button } from '../ui/button';
import { ArrowLeft, Home, AlertTriangle } from 'lucide-react';

interface TradeRouteGuardProps {
  children: React.ReactNode;
  requiredMode?: TradeReviewMode;
  requireTradeAccess?: boolean;
}

interface RouteGuardError {
  type: 'TRADE_NOT_FOUND' | 'ACCESS_DENIED' | 'INVALID_MODE' | 'LOADING_ERROR';
  message: string;
  canRetry: boolean;
  suggestedActions: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

const TradeRouteGuard: React.FC<TradeRouteGuardProps> = ({
  children,
  requiredMode,
  requireTradeAccess = true
}) => {
  const { tradeId } = useParams<{ tradeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { trades, loading: tradesLoading } = useTradeContext();
  
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<RouteGuardError | null>(null);
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null);

  // Find the requested trade
  const trade = trades.find(t => t.id === tradeId);

  // Initialize navigation context from URL or service
  useEffect(() => {
    // Try to get context from navigation service first
    let context = navigationContextService.getContext();
    
    // If no context, try to infer from URL parameters
    if (!context) {
      const urlParams = new URLSearchParams(location.search);
      const fromParam = urlParams.get('from');
      
      if (fromParam && ['calendar', 'trade-list', 'search', 'dashboard', 'analytics'].includes(fromParam)) {
        context = navigationContextService.createContextFromLocation(
          fromParam as NavigationContext['source']
        );
        
        // Set the context for future use
        if (tradeId) {
          navigationContextService.setContext(tradeId, context);
        }
      }
    }
    
    setNavigationContext(context);
  }, [location.search, tradeId]);

  // Validate route access
  useEffect(() => {
    const validateAccess = async () => {
      setIsValidating(true);
      setError(null);

      try {
        // Wait for trades to load if still loading
        if (tradesLoading) {
          return;
        }

        // Check if user is authenticated
        if (!user) {
          setError({
            type: 'ACCESS_DENIED',
            message: 'You must be logged in to view trades.',
            canRetry: false,
            suggestedActions: [
              {
                label: 'Go to Login',
                action: () => navigate('/login'),
                primary: true
              }
            ]
          });
          return;
        }

        // Check if tradeId is provided
        if (!tradeId) {
          setError({
            type: 'TRADE_NOT_FOUND',
            message: 'No trade ID provided in the URL.',
            canRetry: false,
            suggestedActions: [
              {
                label: 'Go to Dashboard',
                action: () => navigate('/'),
                primary: true
              }
            ]
          });
          return;
        }

        // Check if trade exists and user has access
        if (requireTradeAccess && !trade) {
          const backAction = navigationContext 
            ? () => {
                const backUrl = navigationContextService.getBackUrl(navigationContext);
                navigate(backUrl);
              }
            : () => navigate('/');

          setError({
            type: 'TRADE_NOT_FOUND',
            message: 'The requested trade could not be found or you do not have access to it.',
            canRetry: true,
            suggestedActions: [
              {
                label: navigationContext 
                  ? navigationContextService.generateBackLabel(navigationContext)
                  : 'Back to Dashboard',
                action: backAction,
                primary: true
              },
              {
                label: 'Refresh Page',
                action: () => window.location.reload()
              }
            ]
          });
          return;
        }

        // Validate mode if required
        if (requiredMode && trade) {
          const currentPath = location.pathname;
          const expectedPath = `/trade/${tradeId}${requiredMode === 'view' ? '' : `/${requiredMode}`}`;
          
          if (currentPath !== expectedPath) {
            // Redirect to correct path for mode
            navigate(expectedPath, { replace: true });
            return;
          }
        }

        // All validations passed
        setIsValidating(false);

      } catch (err) {
        console.error('Route validation error:', err);
        setError({
          type: 'LOADING_ERROR',
          message: 'An error occurred while validating access to this trade.',
          canRetry: true,
          suggestedActions: [
            {
              label: 'Try Again',
              action: () => {
                setError(null);
                setIsValidating(true);
              },
              primary: true
            },
            {
              label: 'Go to Dashboard',
              action: () => navigate('/')
            }
          ]
        });
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [
    user,
    tradeId,
    trade,
    tradesLoading,
    requiredMode,
    requireTradeAccess,
    location.pathname,
    navigate,
    navigationContext
  ]);

  // Show loading state
  if (isValidating || tradesLoading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-gray-50"
        role="status"
        aria-live="polite"
        aria-label="Validating trade access"
      >
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {tradesLoading ? 'Loading trades...' : 'Validating access...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-gray-50"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <AlertTriangle 
              className="w-16 h-16 text-red-500 mx-auto mb-4" 
              aria-hidden="true"
            />
            <h1 
              className="text-2xl font-bold text-gray-900 mb-2"
              id="error-title"
            >
              {error.type === 'TRADE_NOT_FOUND' && 'Trade Not Found'}
              {error.type === 'ACCESS_DENIED' && 'Access Denied'}
              {error.type === 'INVALID_MODE' && 'Invalid Mode'}
              {error.type === 'LOADING_ERROR' && 'Loading Error'}
            </h1>
            <p 
              className="text-gray-600 mb-6"
              id="error-description"
            >
              {error.message}
            </p>
          </div>
          
          <div className="space-y-3">
            {error.suggestedActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                variant={action.primary ? "default" : "outline"}
                className="w-full"
                aria-describedby="error-title error-description"
              >
                {action.label}
              </Button>
            ))}
          </div>
          
          {error.canRetry && (
            <p className="mt-4 text-sm text-gray-500">
              If the problem persists, please try refreshing the page or contact support.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render children if all validations pass
  return <>{children}</>;
};

export default TradeRouteGuard;
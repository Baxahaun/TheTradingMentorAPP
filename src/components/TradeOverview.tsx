import React from 'react';
import { useParams } from 'react-router-dom';
import TradeReviewSystem from './TradeReviewSystem';
import { NavigationContext } from '../types/navigation';
import { TradeReviewMode } from '../types/tradeReview';
import navigationContextService from '../lib/navigationContextService';

interface TradeOverviewProps {
  tradeId?: string;
  navigationContext?: NavigationContext;
  initialMode?: TradeReviewMode;
  isEmbedded?: boolean;
  onNavigateBack?: (context: NavigationContext) => void;
}

const TradeOverview: React.FC<TradeOverviewProps> = ({ 
  tradeId: propTradeId,
  navigationContext: propNavigationContext,
  initialMode = 'view',
  isEmbedded = false,
  onNavigateBack
}) => {
  const { tradeId: paramTradeId } = useParams<{ tradeId: string }>();
  
  // Use prop tradeId if provided, otherwise use URL param
  const currentTradeId = propTradeId || paramTradeId;
  
  // Get navigation context for proper back navigation
  const navigationContext = propNavigationContext || navigationContextService.getContext();

  // If no trade ID is available, show error state
  if (!currentTradeId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Trade Selected</h2>
          <p className="text-gray-600">Please select a trade to view its details.</p>
        </div>
      </div>
    );
  }

  return (
    <TradeReviewSystem
      tradeId={currentTradeId}
      navigationContext={navigationContext}
      initialMode={initialMode}
      onNavigateBack={onNavigateBack}
    />
  );
};

export default TradeOverview;
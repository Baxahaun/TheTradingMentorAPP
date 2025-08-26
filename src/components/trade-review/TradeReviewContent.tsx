import React from 'react';
import { Trade, TradeWithStrategy } from '../../types/trade';
import { ProfessionalStrategy } from '../../types/strategy';
import { TradeReviewMode } from '../../types/tradeReview';
import CondensedTradeReview from './CondensedTradeReview';

interface TradeReviewContentProps {
  trade: Trade;
  editedTrade: TradeWithStrategy;
  isEditing: boolean;
  currentMode: TradeReviewMode;
  activePanel: 'data' | 'analysis' | 'performance' | 'workflow';
  isMobile?: boolean;
  isTablet?: boolean;
  availableStrategies?: ProfessionalStrategy[];
  onTradeChange: (field: keyof TradeWithStrategy, value: any) => void;
  onPanelChange: (panel: 'data' | 'analysis' | 'performance' | 'workflow') => void;
  onNavigateToStrategy?: (strategyId: string) => void;
  onPerformanceUpdate?: (strategyId: string) => void;
}

const TradeReviewContent: React.FC<TradeReviewContentProps> = ({
  trade,
  editedTrade,
  isEditing,
  currentMode,
  activePanel,
  isMobile = false,
  isTablet = false,
  availableStrategies = [],
  onTradeChange,
  onPanelChange,
  onNavigateToStrategy,
  onPerformanceUpdate
}) => {
  return (
    <div className="flex-1 min-h-0" id="trade-content">
      <CondensedTradeReview
        trade={trade}
        editedTrade={editedTrade}
        isEditing={isEditing}
        currentMode={currentMode}
        isMobile={isMobile}
        isTablet={isTablet}
        availableStrategies={availableStrategies}
        onTradeChange={onTradeChange}
        onNavigateToStrategy={onNavigateToStrategy}
        onPerformanceUpdate={onPerformanceUpdate}
      />
    </div>
  );
};

export default TradeReviewContent;
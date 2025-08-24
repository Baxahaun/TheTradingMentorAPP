import React from 'react';
import { Trade } from '../../types/trade';
import { TradeReviewMode } from '../../types/tradeReview';
import CondensedTradeReview from './CondensedTradeReview';

interface TradeReviewContentProps {
  trade: Trade;
  editedTrade: Trade;
  isEditing: boolean;
  currentMode: TradeReviewMode;
  activePanel: 'data' | 'analysis' | 'performance' | 'workflow';
  isMobile?: boolean;
  isTablet?: boolean;
  onTradeChange: (field: keyof Trade, value: any) => void;
  onPanelChange: (panel: 'data' | 'analysis' | 'performance' | 'workflow') => void;
}

const TradeReviewContent: React.FC<TradeReviewContentProps> = ({
  trade,
  editedTrade,
  isEditing,
  currentMode,
  activePanel,
  isMobile = false,
  isTablet = false,
  onTradeChange,
  onPanelChange
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
        onTradeChange={onTradeChange}
      />
    </div>
  );
};

export default TradeReviewContent;
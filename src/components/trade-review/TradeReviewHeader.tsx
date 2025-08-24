import React from 'react';
import { Trade } from '../../types/trade';
import { NavigationContext } from '../../types/navigation';
import { TradeReviewMode } from '../../types/tradeReview';
import navigationContextService from '../../lib/navigationContextService';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  Edit3,
  Save,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  ClipboardList,
  Share2,
  ExternalLink
} from 'lucide-react';

interface TradeReviewHeaderProps {
  trade: Trade;
  editedTrade: Trade;
  navigationContext?: NavigationContext | null;
  isEditing: boolean;
  currentMode: TradeReviewMode;
  hasUnsavedChanges: boolean;
  prevTrade?: Trade | null;
  nextTrade?: Trade | null;
  currentTradeIndex: number;
  totalTrades: number;
  showBreadcrumbs?: boolean;
  shareableUrl?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  onModeChange: (mode: TradeReviewMode) => void;
  onNavigateBack: () => void;
  onNavigateToTrade: (tradeId: string) => void;
  onNavigateToSource?: (context: NavigationContext) => void;
  onNavigateHome?: () => void;
  onShare?: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const TradeReviewHeader: React.FC<TradeReviewHeaderProps> = ({
  trade,
  editedTrade,
  navigationContext,
  isEditing,
  currentMode,
  hasUnsavedChanges,
  prevTrade,
  nextTrade,
  currentTradeIndex,
  totalTrades,
  showBreadcrumbs = true,
  shareableUrl,
  isMobile = false,
  isTablet = false,
  onModeChange,
  onNavigateBack,
  onNavigateToTrade,
  onNavigateToSource,
  onNavigateHome,
  onShare,
  onSave,
  onCancel
}) => {
  const isProfitable = (editedTrade.pnl || 0) >= 0;
  
  // Calculate return percentage
  const getReturnPercentage = () => {
    if (!editedTrade.exitPrice || !editedTrade.entryPrice) return null;
    return ((editedTrade.exitPrice - editedTrade.entryPrice) / editedTrade.entryPrice) * 100;
  };

  const returnPercentage = getReturnPercentage();

  // Generate back button label
  const backLabel = navigationContext 
    ? navigationContextService.generateBackLabel(navigationContext)
    : 'Back to Trades';

  return (
    <header 
      className="bg-white border-b border-gray-200 mobile-sticky-header"
      role="banner"
      aria-label="Trade review header"
    >
      <div className={`px-4 sm:px-6 py-3 sm:py-4 ${isMobile ? 'mobile-safe-area' : ''}`}>
        {/* Breadcrumb Navigation */}
        {showBreadcrumbs && (
          <div className="hidden lg:block mb-4">
            <BreadcrumbNavigation
              navigationContext={navigationContext}
              currentTradePair={editedTrade.currencyPair}
              onNavigateToSource={onNavigateToSource || (() => {})}
              onNavigateHome={onNavigateHome || (() => {})}
            />
          </div>
        )}
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          {/* Top Row - Back Button and Trade Info */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mobile-button-small touch-target"
              aria-label={`${backLabel} - Navigate back to previous page`}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <h1 
                className="text-lg sm:text-xl font-bold text-gray-900 responsive-text-lg"
                id="trade-title"
              >
                {editedTrade.currencyPair}
              </h1>
              {editedTrade.side === 'long' ? (
                <ArrowUpCircle 
                  className="w-4 h-4 text-green-600" 
                  aria-label="Long position"
                />
              ) : (
                <ArrowDownCircle 
                  className="w-4 h-4 text-red-600" 
                  aria-label="Short position"
                />
              )}
            </div>
          </div>
          
          {/* Bottom Row - Status, P&L, and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={editedTrade.status === 'closed' ? 'secondary' : 'default'} className="text-xs">
                {editedTrade.status.toUpperCase()}
              </Badge>
              {editedTrade.pnl !== undefined && (
                <Badge 
                  variant={isProfitable ? 'default' : 'destructive'} 
                  className="text-sm px-2 py-1 font-bold"
                >
                  {isProfitable ? '+' : ''}${editedTrade.pnl.toFixed(2)}
                </Badge>
              )}
            </div>
            
            {/* Mobile Mode Switching */}
            <div 
              className="flex items-center gap-1"
              role="tablist"
              aria-label="Trade review modes"
            >
              <Button
                variant={currentMode === 'view' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('view')}
                className="px-2 mobile-button-small touch-target"
                role="tab"
                aria-selected={currentMode === 'view'}
                aria-controls="trade-content"
                aria-label="View mode"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">View</span>
              </Button>
              <Button
                variant={currentMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('edit')}
                className="px-2 mobile-button-small touch-target"
                role="tab"
                aria-selected={currentMode === 'edit'}
                aria-controls="trade-content"
                aria-label="Edit mode"
              >
                <Edit3 className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant={currentMode === 'review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('review')}
                className="px-2 mobile-button-small touch-target"
                role="tab"
                aria-selected={currentMode === 'review'}
                aria-controls="trade-content"
                aria-label="Review mode"
              >
                <ClipboardList className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Review</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile Save/Cancel Controls */}
          {isEditing && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
              <Button
                onClick={onSave}
                className="flex-1 flex items-center justify-center gap-2 mobile-button touch-target"
                disabled={!hasUnsavedChanges}
                aria-label={hasUnsavedChanges ? "Save changes to trade" : "No changes to save"}
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-2 mobile-button touch-target"
                aria-label="Cancel editing and discard changes"
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Left Section - Navigation and Trade Info */}
          <div className="flex items-center gap-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </Button>
            
            <div className="h-8 w-px bg-gray-300" />
            
            {/* Trade Information */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{editedTrade.currencyPair}</h1>
                <div className="flex items-center gap-2">
                  {editedTrade.side === 'long' ? (
                    <ArrowUpCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-red-600" />
                  )}
                  <Badge variant={editedTrade.side === 'long' ? 'default' : 'destructive'} className="font-medium">
                    {editedTrade.side.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {/* Trade Status */}
              <div className="flex items-center gap-2">
                {editedTrade.status === 'closed' ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <Activity className="w-5 h-5 text-orange-500" />
                )}
                <Badge variant={editedTrade.status === 'closed' ? 'secondary' : 'default'} className="font-medium">
                  {editedTrade.status.toUpperCase()}
                </Badge>
              </div>
              
              {/* P&L Display */}
              {editedTrade.pnl !== undefined && (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isProfitable ? 'default' : 'destructive'} 
                    className="text-lg px-4 py-2 font-bold"
                  >
                    {isProfitable ? '+' : ''}${editedTrade.pnl.toFixed(2)}
                  </Badge>
                  {returnPercentage && (
                    <Badge variant="outline" className="text-sm">
                      {returnPercentage > 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Section - Controls */}
          <div className="flex items-center gap-4">
            {/* Trade Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => prevTrade && onNavigateToTrade(prevTrade.id)}
                disabled={!prevTrade}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-500 px-3">
                {currentTradeIndex + 1} of {totalTrades}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nextTrade && onNavigateToTrade(nextTrade.id)}
                disabled={!nextTrade}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="h-8 w-px bg-gray-300" />
            
            {/* Mode Switching */}
            <div className="flex items-center gap-2">
              <Button
                variant={currentMode === 'view' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('view')}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
              <Button
                variant={currentMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('edit')}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant={currentMode === 'review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('review')}
                className="flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                Review
              </Button>
            </div>
            
            <div className="h-8 w-px bg-gray-300" />
            
            {/* Share Button */}
            {onShare && shareableUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <div className="h-8 w-px bg-gray-300" />
              </>
            )}
            
            {/* Save/Cancel Controls */}
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  onClick={onSave}
                  className="flex items-center gap-2"
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
            
            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && !isEditing && (
              <div className="flex items-center gap-2 text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TradeReviewHeader;
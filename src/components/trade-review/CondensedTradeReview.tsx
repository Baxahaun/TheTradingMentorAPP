import React, { useState } from 'react';
import { Trade } from '../../types/trade';
import { TradeWithStrategy } from '../../types/trade';
import { ProfessionalStrategy } from '../../types/strategy';
import { TradeReviewMode } from '../../types/tradeReview';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import TradingViewChart from './TradingViewChart';
import StrategySelector from '../trade-strategy/StrategySelector';
import PerformanceUpdateIndicator from '../trade-strategy/PerformanceUpdateIndicator';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Clock,
  Target,
  BarChart3,
  Edit3,
  Hash,
  Plus,
  X,
  FileText
} from 'lucide-react';

interface CondensedTradeReviewProps {
  trade: Trade;
  editedTrade: TradeWithStrategy;
  isEditing: boolean;
  currentMode: TradeReviewMode;
  isMobile?: boolean;
  isTablet?: boolean;
  availableStrategies?: ProfessionalStrategy[];
  onTradeChange: (field: keyof TradeWithStrategy, value: any) => void;
  onNavigateToStrategy?: (strategyId: string) => void;
  onPerformanceUpdate?: (strategyId: string) => void;
}

const CondensedTradeReview: React.FC<CondensedTradeReviewProps> = ({
  trade,
  editedTrade,
  isEditing,
  currentMode,
  isMobile = false,
  isTablet = false,
  availableStrategies = [],
  onTradeChange,
  onNavigateToStrategy,
  onPerformanceUpdate
}) => {
  // Calculate key metrics
  const profitLoss = editedTrade.exitPrice && editedTrade.entryPrice 
    ? (editedTrade.exitPrice - editedTrade.entryPrice) * (editedTrade.lotSize || 1)
    : 0;
  
  const profitLossPercentage = editedTrade.exitPrice && editedTrade.entryPrice
    ? ((editedTrade.exitPrice - editedTrade.entryPrice) / editedTrade.entryPrice) * 100
    : 0;

  const isProfit = profitLoss > 0;
  const duration = editedTrade.exitDate && editedTrade.entryDate
    ? Math.abs(new Date(editedTrade.exitDate).getTime() - new Date(editedTrade.entryDate).getTime()) / (1000 * 60 * 60)
    : 0;

  return (
    <div className={`flex-1 min-h-0 ${isMobile ? 'flex flex-col' : 'flex'}`}>
      {/* Left Sidebar - Key Trade Info */}
      <div className={`${isMobile ? 'w-full mb-4' : 'w-80 flex-shrink-0'} bg-white border-r border-gray-200 overflow-y-auto`}>
        <div className="p-6 space-y-4">
          {/* All Trade Details - Compact Layout */}
          <div className="space-y-3">
            {/* Entry */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center text-gray-600">
                <Target className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Entry</span>
              </div>
              <span className="font-semibold text-base">{editedTrade.entryPrice}</span>
            </div>

            {/* Exit */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center text-gray-600">
                <Target className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Exit</span>
              </div>
              <span className="font-semibold text-base">{editedTrade.exitPrice || 'Open'}</span>
            </div>

            {/* Lot Size */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Lot Size</span>
              </div>
              <span className="font-semibold text-base">{editedTrade.lotSize}</span>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <span className="font-semibold text-base">
                {duration > 0 ? `${duration.toFixed(1)}h` : 'Active'}
              </span>
            </div>

            {/* Entry Date */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Entry Date</span>
              </div>
              <span className="font-semibold text-sm">
                {new Date(editedTrade.timestamp).toLocaleDateString()}
              </span>
            </div>

            {/* Entry Time */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">Entry Time</span>
              </div>
              <span className="font-semibold text-sm">
                {new Date(editedTrade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* P&L */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center text-gray-600">
                {isProfit ? (
                  <TrendingUp className="w-4 h-4 mr-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-3 text-red-600" />
                )}
                <span className="text-sm font-medium">P&L</span>
              </div>
              <div className="text-right">
                <div className={`font-semibold text-base ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                  {profitLoss > 0 ? '+' : ''}{profitLoss.toFixed(2)}
                </div>
                <div className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                  {profitLossPercentage > 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Risk/Reward Ratio */}
            {editedTrade.stopLoss && editedTrade.takeProfit && (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center text-gray-600">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  <span className="text-sm font-medium">R:R</span>
                </div>
                <span className="font-semibold text-base">
                  {(() => {
                    const risk = Math.abs(editedTrade.entryPrice - editedTrade.stopLoss);
                    const reward = Math.abs(editedTrade.takeProfit - editedTrade.entryPrice);
                    const ratio = risk > 0 ? (reward / risk).toFixed(1) : 'N/A';
                    return `1:${ratio}`;
                  })()}
                </span>
              </div>
            )}

            {/* Strategy */}
            {(editedTrade.strategyName || editedTrade.strategy) && (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center text-gray-600">
                  <Target className="w-4 h-4 mr-3" />
                  <span className="text-sm font-medium">Strategy</span>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {editedTrade.strategyName || editedTrade.strategy}
                </Badge>
              </div>
            )}

            {/* Strategy Adherence Score */}
            {editedTrade.adherenceScore !== undefined && (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center text-gray-600">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  <span className="text-sm font-medium">Adherence</span>
                </div>
                <Badge 
                  variant={editedTrade.adherenceScore >= 90 ? 'default' : editedTrade.adherenceScore >= 70 ? 'secondary' : 'destructive'}
                  className="text-xs px-2 py-1"
                >
                  {editedTrade.adherenceScore.toFixed(0)}%
                </Badge>
              </div>
            )}
          </div>

          {/* Chart Controls */}
          <div className="pt-3 border-t border-gray-200">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Chart Settings
            </label>
            <ChartControlsPanel
              trade={editedTrade}
            />
          </div>

          {/* Tags */}
          <div className="pt-3 border-t border-gray-200">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Tags
            </label>
            <CompactTagManager
              tags={editedTrade.tags || []}
              isEditing={isEditing}
              onTagsChange={(tags) => onTradeChange('tags', tags)}
            />
          </div>

          {/* Notes */}
          <div className="pt-3 border-t border-gray-200">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Notes
            </label>
            <CompactNotesEditor
              notes={editedTrade.notes || ''}
              isEditing={isEditing}
              onNotesChange={(notes) => onTradeChange('notes', notes)}
            />
          </div>

          {/* Strategy Integration */}
          {availableStrategies.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Strategy Assignment
              </label>
              <StrategySelector
                trade={editedTrade}
                availableStrategies={availableStrategies}
                selectedStrategyId={editedTrade.strategyId}
                showSuggestions={isEditing}
                compact={true}
                onStrategySelect={(strategyId) => {
                  onTradeChange('strategyId', strategyId);
                  if (strategyId) {
                    const strategy = availableStrategies.find(s => s.id === strategyId);
                    if (strategy) {
                      onTradeChange('strategyName', strategy.title);
                      onTradeChange('strategyVersion', strategy.version);
                    }
                  } else {
                    onTradeChange('strategyName', undefined);
                    onTradeChange('strategyVersion', undefined);
                    onTradeChange('adherenceScore', undefined);
                    onTradeChange('deviations', undefined);
                  }
                }}
                onNavigateToStrategy={onNavigateToStrategy}
              />
            </div>
          )}

          {/* Performance Update Indicator */}
          {editedTrade.strategyId && editedTrade.status === 'closed' && (
            <div className="pt-3 border-t border-gray-200">
              <PerformanceUpdateIndicator
                trade={editedTrade}
                strategy={availableStrategies.find(s => s.id === editedTrade.strategyId)!}
                isTradeComplete={editedTrade.status === 'closed' && !!editedTrade.exitPrice}
                onNavigateToStrategy={onNavigateToStrategy}
                onRefreshPerformance={onPerformanceUpdate}
              />
            </div>
          )}

          {/* Quick Actions */}
          {isEditing && (
            <div className="pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full py-3"
                onClick={() => {/* Handle quick edit */}}
              >
                <Edit3 className="w-5 h-5 mr-3" />
                Quick Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Charts */}
      <div className="flex-1 min-h-0 bg-white">
        {/* Charts - Full height for maximum chart viewing */}
        <div className="h-full" style={{ minHeight: '90vh' }}>
          <TradingViewChart
            trade={editedTrade}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

// Compact Tag Manager Component
const CompactTagManager: React.FC<{
  tags: string[];
  isEditing: boolean;
  onTagsChange: (tags: string[]) => void;
}> = ({ tags, isEditing, onTagsChange }) => {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">
            <Hash className="w-4 h-4 mr-2" />
            {tag}
            {isEditing && (
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </Badge>
        ))}
        {tags.length === 0 && !isEditing && (
          <span className="text-gray-400 text-sm">No tags added</span>
        )}
      </div>
      
      {isEditing && (
        <div className="flex gap-2">
          <Input
            placeholder="Add tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="text-sm h-10"
          />
          <Button size="sm" onClick={addTag} className="h-10 px-4">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};



// Chart Controls Panel Component
const ChartControlsPanel: React.FC<{
  trade: Trade;
}> = ({ trade }) => {
  const [currentSymbol, setCurrentSymbol] = React.useState(trade.currencyPair || 'EUR/USD');
  const [timeframe, setTimeframe] = React.useState('1H');

  const forexPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF',
    'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY',
    'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD'
  ];

  const timeframes = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '1H', label: '1H' },
    { value: '4H', label: '4H' },
    { value: '1D', label: '1D' },
    { value: '1W', label: '1W' }
  ];

  return (
    <div className="space-y-3">
      {/* Symbol Selection */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Symbol</label>
        <Select value={currentSymbol} onValueChange={setCurrentSymbol}>
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {forexPairs.map(pair => (
              <SelectItem key={pair} value={pair}>
                {pair}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeframe Selection */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Timeframe</label>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeframes.map(tf => (
              <SelectItem key={tf.value} value={tf.value}>
                {tf.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Compact Notes Editor Component
const CompactNotesEditor: React.FC<{
  notes: string;
  isEditing: boolean;
  onNotesChange: (notes: string) => void;
}> = ({ notes, isEditing, onNotesChange }) => {
  return (
    <div className="space-y-3">
      {isEditing ? (
        <Textarea
          placeholder="Add your trade notes here..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-[80px] text-sm p-3 resize-none"
        />
      ) : (
        <div className="min-h-[80px] p-3 bg-white rounded-lg border">
          {notes ? (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {notes}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FileText className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs">No notes added yet</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CondensedTradeReview;
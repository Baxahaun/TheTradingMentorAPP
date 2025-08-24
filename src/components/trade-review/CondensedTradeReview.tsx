import React, { useState } from 'react';
import { Trade } from '../../types/trade';
import { TradeReviewMode } from '../../types/tradeReview';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ChartGalleryManager } from './ChartGalleryManager';
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
  editedTrade: Trade;
  isEditing: boolean;
  currentMode: TradeReviewMode;
  isMobile?: boolean;
  isTablet?: boolean;
  onTradeChange: (field: keyof Trade, value: any) => void;
}

const CondensedTradeReview: React.FC<CondensedTradeReviewProps> = ({
  trade,
  editedTrade,
  isEditing,
  currentMode,
  isMobile = false,
  isTablet = false,
  onTradeChange
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
      <div className={`${isMobile ? 'w-full mb-4' : 'w-96 flex-shrink-0'} bg-white border-r border-gray-200 overflow-y-auto`}>
        <div className="p-8 space-y-6">
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
            {editedTrade.strategy && (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center text-gray-600">
                  <Target className="w-4 h-4 mr-3" />
                  <span className="text-sm font-medium">Strategy</span>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {editedTrade.strategy}
                </Badge>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="pt-4 border-t border-gray-200">
            <label className="text-sm font-semibold text-gray-700 block mb-3">
              Tags
            </label>
            <CompactTagManager
              tags={editedTrade.tags || []}
              isEditing={isEditing}
              onTagsChange={(tags) => onTradeChange('tags', tags)}
            />
          </div>

          {/* Quick Actions */}
          {isEditing && (
            <div className="pt-6 border-t border-gray-200">
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

      {/* Main Content Area - Charts and Notes */}
      <div className="flex-1 min-h-0 flex flex-col bg-white">
        {/* Charts - Extended vertically with proper sizing */}
        <div className="flex-1 min-h-0" style={{ minHeight: '60vh' }}>
          <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Chart Analysis
              </h3>
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1 min-h-0">
              <ChartGalleryManagerWrapper
                tradeId={editedTrade.id}
                charts={editedTrade.charts || []}
                isEditing={isEditing}
                onChartsChange={(charts) => onTradeChange('charts', charts)}
              />
            </div>
          </div>
        </div>

        {/* Notes - Moved under charts with better spacing */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Trade Notes
            </h3>
            <CompactNotesEditor
              notes={editedTrade.notes || ''}
              isEditing={isEditing}
              onNotesChange={(notes) => onTradeChange('notes', notes)}
            />
          </div>
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

// Chart Gallery Manager Wrapper with proper sizing
const ChartGalleryManagerWrapper: React.FC<{
  tradeId: string;
  charts: any[];
  isEditing: boolean;
  onChartsChange: (charts: any[]) => void;
}> = ({ tradeId, charts, isEditing, onChartsChange }) => {
  if (!charts || charts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No charts found</h3>
          <p className="text-gray-500 text-base mb-6 max-w-md mx-auto">
            Upload some chart images to get started with your trade analysis
          </p>
          {isEditing && (
            <Button className="px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Upload Chart
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ChartGalleryManager
        tradeId={tradeId}
        charts={charts}
        isEditing={isEditing}
        onChartsChange={onChartsChange}
      />
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
    <div className="space-y-4">
      {isEditing ? (
        <Textarea
          placeholder="Add your trade notes here..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-[150px] text-base p-4 resize-none"
        />
      ) : (
        <div className="min-h-[150px] p-4 bg-white rounded-lg border">
          {notes ? (
            <div className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
              {notes}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3" />
                <p className="text-base">No notes added yet</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CondensedTradeReview;
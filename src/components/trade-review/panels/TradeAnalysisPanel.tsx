import React, { useState } from 'react';
import { Trade } from '../../../types/trade';
import { TradeReviewMode, TradeNotes } from '../../../types/tradeReview';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import EnhancedNotesEditor from '../EnhancedNotesEditor';
import { 
  BarChart3, 
  Brain, 
  ImageIcon, 
  Upload, 
  Tag,
  Plus,
  X
} from 'lucide-react';

interface TradeAnalysisPanelProps {
  trade: Trade;
  editedTrade: Trade;
  isEditing: boolean;
  currentMode: TradeReviewMode;
  onTradeChange: (field: keyof Trade, value: any) => void;
}

const TradeAnalysisPanel: React.FC<TradeAnalysisPanelProps> = ({
  trade,
  editedTrade,
  isEditing,
  currentMode,
  onTradeChange
}) => {
  const [chartType, setChartType] = useState<'HTF' | 'LTF'>('HTF');
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: keyof Trade, value: string | number | Date | undefined) => {
    onTradeChange(field, value);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const currentTags = editedTrade.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      onTradeChange('tags', [...currentTags, newTag.trim()]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = editedTrade.tags || [];
    onTradeChange('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleNotesChange = (notes: TradeNotes) => {
    // Update the trade's review data with the new notes
    const updatedReviewData = {
      ...editedTrade.reviewData,
      notes
    };
    onTradeChange('reviewData' as keyof Trade, updatedReviewData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Left Column - Chart Analysis */}
      <div className="space-y-6">
        
        {/* Chart Section */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <span className="hidden sm:inline">Chart Analysis - {editedTrade.currencyPair}</span>
                <span className="sm:hidden">Chart - {editedTrade.currencyPair}</span>
              </CardTitle>
              <div className="flex gap-1 sm:gap-2">
                <Button
                  variant={chartType === 'LTF' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('LTF')}
                  className="px-2 sm:px-4 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Lower TF</span>
                  <span className="sm:hidden">LTF</span>
                </Button>
                <Button
                  variant={chartType === 'HTF' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('HTF')}
                  className="px-2 sm:px-4 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Higher TF</span>
                  <span className="sm:hidden">HTF</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-2 border-dashed border-gray-200 bg-gray-50 p-8 sm:p-16 text-center min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center">
              <div className="bg-white rounded-full p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
                <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                {chartType} Chart Analysis
              </h3>
              <p className="text-gray-600 mb-4 sm:mb-6 max-w-md leading-relaxed text-sm sm:text-base">
                {chartType === 'HTF' 
                  ? 'Higher timeframe analysis for market structure, trend confirmation, and key support/resistance levels'
                  : 'Lower timeframe precision for entry timing, exit points, and intraday price action patterns'
                }
              </p>
              {isEditing && (
                <Button variant="outline" size="lg" className="bg-white">
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Upload {chartType} Chart</span>
                  <span className="sm:hidden">Upload Chart</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tags Management */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Tag className="w-5 h-5 text-purple-600" />
              Trade Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Current Tags */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Current Tags
                </Label>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-md border">
                  {editedTrade.tags && editedTrade.tags.length > 0 ? (
                    editedTrade.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                        {tag}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tags assigned</span>
                  )}
                </div>
              </div>

              {/* Add New Tag */}
              {isEditing && (
                <div>
                  <Label htmlFor="newTag" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Add New Tag
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="newTag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter tag name..."
                      className="flex-1"
                    />
                    <Button onClick={handleAddTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Enhanced Notes and Analysis */}
      <div className="space-y-6">
        
        {/* Strategy and Setup */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Brain className="w-5 h-5 text-purple-600" />
              Strategy & Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="strategy" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Trading Strategy
                </Label>
                {isEditing ? (
                  <Input
                    id="strategy"
                    value={editedTrade.strategy || ''}
                    onChange={(e) => handleInputChange('strategy', e.target.value)}
                    placeholder="e.g., Breakout, Support/Resistance, MA Crossover"
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">
                      {editedTrade.strategy || 'Strategy not specified'}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="marketConditions" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Market Conditions
                </Label>
                {isEditing ? (
                  <Input
                    id="marketConditions"
                    value={editedTrade.marketConditions || ''}
                    onChange={(e) => handleInputChange('marketConditions', e.target.value)}
                    placeholder="e.g., Trending Up, Range-bound, High Volatility"
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">
                      {editedTrade.marketConditions || 'Conditions not specified'}
                    </span>
                  </div>
                )}
              </div>

              {/* Psychology and Emotions */}
              <div>
                <Label htmlFor="emotions" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Psychology & Emotional State
                </Label>
                {isEditing ? (
                  <Input
                    id="emotions"
                    value={editedTrade.emotions || ''}
                    onChange={(e) => handleInputChange('emotions', e.target.value)}
                    placeholder="e.g., Confident, Anxious, FOMO, Patient, Disciplined"
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">
                      {editedTrade.emotions || 'Emotional state not recorded'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confidence Level */}
              <div>
                <Label htmlFor="confidence" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Confidence Level (1-5)
                </Label>
                {isEditing ? (
                  <Input
                    id="confidence"
                    type="number"
                    min="1"
                    max="5"
                    value={editedTrade.confidence || ''}
                    onChange={(e) => handleInputChange('confidence', parseInt(e.target.value) || undefined)}
                    placeholder="Rate your confidence 1-5"
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium">
                        {editedTrade.confidence ? `${editedTrade.confidence}/5` : 'Not rated'}
                      </span>
                      {editedTrade.confidence && (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-4 h-4 rounded-full ${
                                star <= editedTrade.confidence! 
                                  ? 'bg-yellow-400' 
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Notes Editor */}
        <EnhancedNotesEditor
          trade={editedTrade}
          isEditing={isEditing}
          onNotesChange={handleNotesChange}
        />
      </div>
    </div>
  );
};

export default TradeAnalysisPanel;
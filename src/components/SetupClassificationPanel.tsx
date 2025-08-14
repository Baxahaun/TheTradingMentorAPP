import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  TradeSetup,
  SetupType,
  ConfluenceFactor,
  PREDEFINED_CONFLUENCE_FACTORS,
  SETUP_TYPE_DESCRIPTIONS,
} from '../types/trade';
import { setupClassificationService } from '../lib/setupClassificationService';

interface SetupClassificationPanelProps {
  setup?: TradeSetup;
  onChange: (setup: TradeSetup) => void;
  className?: string;
}

const MARKET_CONDITIONS = [
  { value: 'trending', label: 'Trending', description: 'Clear directional movement' },
  { value: 'ranging', label: 'Ranging', description: 'Sideways consolidation' },
  { value: 'breakout', label: 'Breakout', description: 'Breaking key levels' },
  { value: 'reversal', label: 'Reversal', description: 'Changing direction' },
] as const;

const TIMEFRAMES = [
  { value: 'M1', label: '1 Minute' },
  { value: 'M5', label: '5 Minutes' },
  { value: 'M15', label: '15 Minutes' },
  { value: 'M30', label: '30 Minutes' },
  { value: 'H1', label: '1 Hour' },
  { value: 'H4', label: '4 Hours' },
  { value: 'D1', label: 'Daily' },
  { value: 'W1', label: 'Weekly' },
  { value: 'MN1', label: 'Monthly' },
];

const QUALITY_RATINGS = [
  { value: 1, label: 'Poor', color: 'bg-red-100 text-red-800' },
  { value: 2, label: 'Fair', color: 'bg-orange-100 text-orange-800' },
  { value: 3, label: 'Good', color: 'bg-yellow-100 text-yellow-800' },
  { value: 4, label: 'Very Good', color: 'bg-blue-100 text-blue-800' },
  { value: 5, label: 'Excellent', color: 'bg-green-100 text-green-800' },
];

export const SetupClassificationPanel: React.FC<SetupClassificationPanelProps> = ({
  setup,
  onChange,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConfluenceFactors, setSelectedConfluenceFactors] = useState<ConfluenceFactor[]>(
    setup?.confluence || []
  );
  const [showConfluenceSelector, setShowConfluenceSelector] = useState(false);
  const [confluenceSearch, setConfluenceSearch] = useState('');

  // Initialize setup with default values if not provided
  const currentSetup: TradeSetup = setup || {
    id: `setup_${Date.now()}`,
    type: SetupType.TREND_CONTINUATION,
    confluence: [],
    timeframe: 'H1',
    marketCondition: 'trending',
    quality: 3,
  };

  // Update parent when setup changes
  const updateSetup = (updates: Partial<TradeSetup>) => {
    const updatedSetup = { ...currentSetup, ...updates };
    onChange(updatedSetup);
  };

  // Handle confluence factor selection
  const handleConfluenceFactorToggle = (factor: ConfluenceFactor) => {
    const isSelected = selectedConfluenceFactors.some(f => f.id === factor.id);
    let newFactors: ConfluenceFactor[];
    
    if (isSelected) {
      newFactors = selectedConfluenceFactors.filter(f => f.id !== factor.id);
    } else {
      newFactors = [...selectedConfluenceFactors, factor];
    }
    
    setSelectedConfluenceFactors(newFactors);
    updateSetup({ confluence: newFactors });
  };

  // Filter confluence factors by search term
  const filteredConfluenceFactors = PREDEFINED_CONFLUENCE_FACTORS.filter(factor =>
    factor.name.toLowerCase().includes(confluenceSearch.toLowerCase()) ||
    factor.category.toLowerCase().includes(confluenceSearch.toLowerCase()) ||
    factor.description.toLowerCase().includes(confluenceSearch.toLowerCase())
  );

  // Group confluence factors by category
  const confluenceByCategory = filteredConfluenceFactors.reduce((acc, factor) => {
    if (!acc[factor.category]) {
      acc[factor.category] = [];
    }
    acc[factor.category].push(factor);
    return acc;
  }, {} as Record<string, ConfluenceFactor[]>);

  // Calculate confluence score
  const confluenceScore = setupClassificationService.calculateConfluenceScore(selectedConfluenceFactors);

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="font-medium text-gray-900">Setup Classification</h3>
          {selectedConfluenceFactors.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedConfluenceFactors.length} factors
            </Badge>
          )}
          {confluenceScore > 0 && (
            <Badge 
              variant={confluenceScore >= 70 ? 'default' : confluenceScore >= 40 ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {confluenceScore.toFixed(0)}% confluence
            </Badge>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Setup Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="setupType">Setup Type *</Label>
              <select
                id="setupType"
                value={currentSetup.type}
                onChange={(e) => updateSetup({ type: e.target.value as SetupType })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <optgroup label="Trend Following">
                  <option value={SetupType.TREND_CONTINUATION}>Trend Continuation</option>
                  <option value={SetupType.PULLBACK_ENTRY}>Pullback Entry</option>
                  <option value={SetupType.BREAKOUT_CONTINUATION}>Breakout Continuation</option>
                </optgroup>
                <optgroup label="Reversal">
                  <option value={SetupType.SUPPORT_RESISTANCE_BOUNCE}>Support/Resistance Bounce</option>
                  <option value={SetupType.DOUBLE_TOP_BOTTOM}>Double Top/Bottom</option>
                  <option value={SetupType.HEAD_SHOULDERS}>Head & Shoulders</option>
                </optgroup>
                <optgroup label="Breakout">
                  <option value={SetupType.RANGE_BREAKOUT}>Range Breakout</option>
                  <option value={SetupType.TRIANGLE_BREAKOUT}>Triangle Breakout</option>
                  <option value={SetupType.FLAG_PENNANT_BREAKOUT}>Flag/Pennant Breakout</option>
                </optgroup>
                <optgroup label="News/Event">
                  <option value={SetupType.NEWS_REACTION}>News Reaction</option>
                  <option value={SetupType.ECONOMIC_DATA}>Economic Data</option>
                  <option value={SetupType.CENTRAL_BANK}>Central Bank</option>
                </optgroup>
                <optgroup label="Custom">
                  <option value={SetupType.CUSTOM}>Custom Setup</option>
                </optgroup>
              </select>
              {currentSetup.type && (
                <p className="text-xs text-gray-500 mt-1">
                  {SETUP_TYPE_DESCRIPTIONS[currentSetup.type]}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="timeframe">Timeframe *</Label>
              <select
                id="timeframe"
                value={currentSetup.timeframe}
                onChange={(e) => updateSetup({ timeframe: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {TIMEFRAMES.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Market Condition and Quality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marketCondition">Market Condition *</Label>
              <select
                id="marketCondition"
                value={currentSetup.marketCondition}
                onChange={(e) => updateSetup({ marketCondition: e.target.value as any })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {MARKET_CONDITIONS.map(condition => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
              {currentSetup.marketCondition && (
                <p className="text-xs text-gray-500 mt-1">
                  {MARKET_CONDITIONS.find(c => c.value === currentSetup.marketCondition)?.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="quality">Setup Quality *</Label>
              <div className="mt-1 flex space-x-1">
                {QUALITY_RATINGS.map(rating => (
                  <TooltipProvider key={rating.value}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => updateSetup({ quality: rating.value as any })}
                          className={`flex-1 px-2 py-2 rounded text-xs font-medium transition-colors ${
                            currentSetup.quality === rating.value
                              ? rating.color
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {rating.value}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{rating.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {QUALITY_RATINGS.find(r => r.value === currentSetup.quality)?.label || 'Select quality'}
              </p>
            </div>
          </div>

          {/* Confluence Factors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Confluence Factors</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfluenceSelector(!showConfluenceSelector)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Factor
              </Button>
            </div>

            {/* Selected Confluence Factors */}
            {selectedConfluenceFactors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedConfluenceFactors.map(factor => (
                  <Badge
                    key={factor.id}
                    variant="secondary"
                    className="text-xs flex items-center space-x-1"
                  >
                    <span>{factor.name}</span>
                    <span className="text-blue-600 font-medium">({factor.weight})</span>
                    <button
                      type="button"
                      onClick={() => handleConfluenceFactorToggle(factor)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Confluence Factor Selector */}
            {showConfluenceSelector && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="mb-3">
                  <Input
                    placeholder="Search confluence factors..."
                    value={confluenceSearch}
                    onChange={(e) => setConfluenceSearch(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-3">
                  {Object.entries(confluenceByCategory).map(([category, factors]) => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {factors.map(factor => {
                          const isSelected = selectedConfluenceFactors.some(f => f.id === factor.id);
                          return (
                            <div
                              key={factor.id}
                              className={`p-2 rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-blue-100 border border-blue-300'
                                  : 'bg-white border border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => handleConfluenceFactorToggle(factor)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium">{factor.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      Weight: {factor.weight}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">{factor.description}</p>
                                </div>
                                {isSelected && (
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfluenceSelector(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Setup Notes */}
          <div>
            <Label htmlFor="setupNotes">Setup Notes</Label>
            <Textarea
              id="setupNotes"
              placeholder="Additional notes about this setup..."
              value={currentSetup.notes || ''}
              onChange={(e) => updateSetup({ notes: e.target.value })}
              className="mt-1 text-sm"
              rows={2}
            />
          </div>

          {/* Confluence Score Display */}
          {selectedConfluenceFactors.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Confluence Score: {confluenceScore.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {confluenceScore >= 70 
                  ? 'Strong confluence - high probability setup'
                  : confluenceScore >= 40
                  ? 'Moderate confluence - decent setup'
                  : 'Weak confluence - consider additional factors'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
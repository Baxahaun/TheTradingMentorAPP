import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Edit, Trash2, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  TradePattern,
  PatternType,
  PatternCategory,
  CustomPattern,
  PATTERN_TYPE_DESCRIPTIONS,
} from '../types/trade';
import { patternRecognitionService } from '../lib/patternRecognitionService';

interface PatternRecognitionPanelProps {
  patterns: TradePattern[];
  onChange: (patterns: TradePattern[]) => void;
  className?: string;
}

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

const PATTERN_CATEGORIES = [
  { value: PatternCategory.CANDLESTICK, label: 'Candlestick', icon: '🕯️' },
  { value: PatternCategory.CHART_PATTERN, label: 'Chart Pattern', icon: '📈' },
  { value: PatternCategory.SUPPORT_RESISTANCE, label: 'Support/Resistance', icon: '📊' },
  { value: PatternCategory.TREND_LINE, label: 'Trend Line', icon: '📉' },
  { value: PatternCategory.FIBONACCI, label: 'Fibonacci', icon: '🌀' },
  { value: PatternCategory.CUSTOM, label: 'Custom', icon: '⚙️' },
];

export const PatternRecognitionPanel: React.FC<PatternRecognitionPanelProps> = ({
  patterns,
  onChange,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPatternSelector, setShowPatternSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PatternCategory | 'all'>('all');
  const [patternSearch, setPatternSearch] = useState('');
  const [showCustomPatternModal, setShowCustomPatternModal] = useState(false);
  const [editingPattern, setEditingPattern] = useState<TradePattern | null>(null);

  // Custom pattern form state
  const [customPatternForm, setCustomPatternForm] = useState({
    name: '',
    description: '',
    category: PatternCategory.CUSTOM,
    reliability: 50,
    timeframes: ['H1'],
    marketConditions: ['trending'],
  });

  // Add a new pattern
  const addPattern = (patternType: PatternType, timeframe: string = 'H1') => {
    const newPattern: TradePattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: patternType,
      timeframe,
      quality: 3,
      confluence: false,
    };

    onChange([...patterns, newPattern]);
  };

  // Update an existing pattern
  const updatePattern = (patternId: string, updates: Partial<TradePattern>) => {
    const updatedPatterns = patterns.map(pattern =>
      pattern.id === patternId ? { ...pattern, ...updates } : pattern
    );
    onChange(updatedPatterns);
  };

  // Remove a pattern
  const removePattern = (patternId: string) => {
    const updatedPatterns = patterns.filter(pattern => pattern.id !== patternId);
    onChange(updatedPatterns);
  };

  // Get patterns by category
  const getPatternsByCategory = (category: PatternCategory): PatternType[] => {
    return patternRecognitionService.getPatternTypesByCategory(category);
  };

  // Filter patterns for selector
  const getFilteredPatterns = () => {
    let availablePatterns: PatternType[] = [];
    
    if (selectedCategory === 'all') {
      availablePatterns = patternRecognitionService.getPredefinedPatternTypes();
    } else {
      availablePatterns = getPatternsByCategory(selectedCategory);
    }

    if (patternSearch) {
      availablePatterns = availablePatterns.filter(patternType => {
        const description = PATTERN_TYPE_DESCRIPTIONS[patternType] || '';
        return patternType.toLowerCase().includes(patternSearch.toLowerCase()) ||
               description.toLowerCase().includes(patternSearch.toLowerCase());
      });
    }

    return availablePatterns;
  };

  // Calculate pattern confluence score
  const confluenceScore = patternRecognitionService.calculatePatternConfluence(patterns);

  // Handle custom pattern creation
  const handleCreateCustomPattern = () => {
    // In a real implementation, this would save to the backend
    const customPattern: CustomPattern = {
      id: `custom_${Date.now()}`,
      name: customPatternForm.name,
      description: customPatternForm.description,
      category: customPatternForm.category,
      reliability: customPatternForm.reliability,
      timeframes: customPatternForm.timeframes,
      marketConditions: customPatternForm.marketConditions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newPattern: TradePattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: PatternType.CUSTOM,
      timeframe: customPatternForm.timeframes[0],
      quality: 3,
      confluence: false,
      customPattern,
    };

    onChange([...patterns, newPattern]);
    setShowCustomPatternModal(false);
    setCustomPatternForm({
      name: '',
      description: '',
      category: PatternCategory.CUSTOM,
      reliability: 50,
      timeframes: ['H1'],
      marketConditions: ['trending'],
    });
  };

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <h3 className="font-medium text-gray-900">Pattern Recognition</h3>
          {patterns.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {patterns.length} pattern{patterns.length !== 1 ? 's' : ''}
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
          {/* Add Pattern Button */}
          <div className="flex items-center justify-between">
            <Label>Identified Patterns</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPatternSelector(!showPatternSelector)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Pattern
              </Button>
              <Dialog open={showCustomPatternModal} onOpenChange={setShowCustomPatternModal}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Custom
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Custom Pattern</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customName">Pattern Name *</Label>
                      <Input
                        id="customName"
                        value={customPatternForm.name}
                        onChange={(e) => setCustomPatternForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., My Special Pattern"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customDescription">Description</Label>
                      <Textarea
                        id="customDescription"
                        value={customPatternForm.description}
                        onChange={(e) => setCustomPatternForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the pattern characteristics..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customCategory">Category</Label>
                      <select
                        id="customCategory"
                        value={customPatternForm.category}
                        onChange={(e) => setCustomPatternForm(prev => ({ ...prev, category: e.target.value as PatternCategory }))}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {PATTERN_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCustomPatternModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateCustomPattern}
                        disabled={!customPatternForm.name.trim()}
                      >
                        Create Pattern
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Current Patterns */}
          {patterns.length > 0 && (
            <div className="space-y-2">
              {patterns.map(pattern => (
                <div
                  key={pattern.id}
                  className="border border-gray-200 rounded-lg p-3 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-sm">
                          {pattern.type === PatternType.CUSTOM && pattern.customPattern
                            ? pattern.customPattern.name
                            : pattern.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          }
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {pattern.timeframe}
                        </Badge>
                        {pattern.confluence && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Confluence pattern</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-xs text-gray-600">Quality</Label>
                          <div className="flex space-x-1 mt-1">
                            {QUALITY_RATINGS.map(rating => (
                              <button
                                key={rating.value}
                                type="button"
                                onClick={() => updatePattern(pattern.id, { quality: rating.value as any })}
                                className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                                  pattern.quality === rating.value
                                    ? rating.color
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                {rating.value}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-600">Timeframe</Label>
                          <select
                            value={pattern.timeframe}
                            onChange={(e) => updatePattern(pattern.id, { timeframe: e.target.value })}
                            className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            {TIMEFRAMES.map(tf => (
                              <option key={tf.value} value={tf.value}>{tf.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center space-x-3">
                        <label className="flex items-center space-x-1 text-xs">
                          <input
                            type="checkbox"
                            checked={pattern.confluence}
                            onChange={(e) => updatePattern(pattern.id, { confluence: e.target.checked })}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>Confluence pattern</span>
                        </label>
                      </div>

                      {pattern.description && (
                        <p className="text-xs text-gray-600 mt-2">{pattern.description}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removePattern(pattern.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pattern Selector */}
          {showPatternSelector && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="space-y-3">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    All Categories
                  </button>
                  {PATTERN_CATEGORIES.map(category => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === category.value
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {category.icon} {category.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <Input
                  placeholder="Search patterns..."
                  value={patternSearch}
                  onChange={(e) => setPatternSearch(e.target.value)}
                  className="text-sm"
                />

                {/* Pattern List */}
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {getFilteredPatterns().map(patternType => {
                    const isAlreadyAdded = patterns.some(p => p.type === patternType);
                    return (
                      <div
                        key={patternType}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          isAlreadyAdded
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                        }`}
                        onClick={() => !isAlreadyAdded && addPattern(patternType)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">
                              {patternType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                              {PATTERN_TYPE_DESCRIPTIONS[patternType]}
                            </p>
                          </div>
                          {isAlreadyAdded && (
                            <Badge variant="secondary" className="text-xs">
                              Added
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPatternSelector(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pattern Confluence Score */}
          {patterns.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  Pattern Confluence: {confluenceScore.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-purple-700 mt-1">
                {confluenceScore >= 70 
                  ? 'Strong pattern confluence - high probability setup'
                  : confluenceScore >= 40
                  ? 'Moderate pattern confluence - decent confirmation'
                  : 'Weak pattern confluence - consider additional patterns'
                }
              </p>
              <div className="mt-2 text-xs text-purple-600">
                Quality patterns: {patterns.filter(p => p.quality >= 4).length} | 
                Confluence patterns: {patterns.filter(p => p.confluence).length} |
                Categories: {new Set(patterns.map(p => patternRecognitionService.getPatternCategory(p.type))).size}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
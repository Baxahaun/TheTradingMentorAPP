import React, { useState, useEffect } from 'react';
import { ProfessionalStrategy, StrategySuggestion } from '../../types/strategy';
import { TradeWithStrategy } from '../../types/trade';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  Target, 
  Lightbulb, 
  ExternalLink,
  Clock,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { StrategyAttributionService } from '../../services/StrategyAttributionService';

interface StrategySelectorProps {
  trade: TradeWithStrategy;
  availableStrategies: ProfessionalStrategy[];
  selectedStrategyId?: string;
  showSuggestions?: boolean;
  compact?: boolean;
  onStrategySelect: (strategyId: string | undefined) => void;
  onNavigateToStrategy?: (strategyId: string) => void;
}

const StrategySelector: React.FC<StrategySelectorProps> = ({
  trade,
  availableStrategies,
  selectedStrategyId,
  showSuggestions = true,
  compact = false,
  onStrategySelect,
  onNavigateToStrategy
}) => {
  const [suggestions, setSuggestions] = useState<StrategySuggestion[]>([]);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);

  const attributionService = new StrategyAttributionService();

  // Generate suggestions when trade data changes
  useEffect(() => {
    if (!selectedStrategyId && availableStrategies.length > 0 && showSuggestions) {
      const tradeSuggestions = attributionService.suggestStrategy(trade, availableStrategies);
      setSuggestions(tradeSuggestions);
      setShowSuggestionsPanel(tradeSuggestions.length > 0);
    } else {
      setShowSuggestionsPanel(false);
    }
  }, [trade.currencyPair, trade.timeframe, trade.session, selectedStrategyId, availableStrategies, showSuggestions]);

  const selectedStrategy = selectedStrategyId 
    ? availableStrategies.find(s => s.id === selectedStrategyId)
    : null;

  const handleStrategyChange = (value: string) => {
    if (value === 'none') {
      onStrategySelect(undefined);
    } else {
      onStrategySelect(value);
    }
    setShowSuggestionsPanel(false);
  };

  const handleSuggestionAccept = (suggestion: StrategySuggestion) => {
    onStrategySelect(suggestion.strategyId);
    setShowSuggestionsPanel(false);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <Select
          value={selectedStrategyId || 'none'}
          onValueChange={handleStrategyChange}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select strategy..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Strategy</SelectItem>
            <Separator />
            {availableStrategies.map(strategy => (
              <SelectItem key={strategy.id} value={strategy.id}>
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{strategy.title}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {strategy.methodology}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedStrategy && onNavigateToStrategy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToStrategy(selectedStrategy.id)}
            className="h-6 text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Strategy Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Trading Strategy
          </label>
          {suggestions.length > 0 && !selectedStrategyId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestionsPanel(!showSuggestionsPanel)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>

        <Select
          value={selectedStrategyId || 'none'}
          onValueChange={handleStrategyChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a trading strategy..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center">
                <span>No Strategy</span>
                <span className="ml-2 text-xs text-gray-500">(Discretionary trade)</span>
              </div>
            </SelectItem>
            <Separator />
            {availableStrategies.map(strategy => (
              <SelectItem key={strategy.id} value={strategy.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{strategy.title}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {strategy.methodology}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {strategy.primaryTimeframe}
                      </Badge>
                      {strategy.performance.totalTrades > 0 && (
                        <span className="text-xs text-gray-500">
                          {strategy.performance.winRate.toFixed(0)}% WR
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selected Strategy Info */}
        {selectedStrategy && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-blue-900">{selectedStrategy.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {selectedStrategy.methodology}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-blue-800 mb-3">
                    {selectedStrategy.description}
                  </p>

                  {selectedStrategy.performance.totalTrades > 0 && (
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center">
                        <div className="text-blue-600 font-medium">
                          {selectedStrategy.performance.totalTrades}
                        </div>
                        <div className="text-blue-500">Trades</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-600 font-medium">
                          {selectedStrategy.performance.winRate.toFixed(1)}%
                        </div>
                        <div className="text-blue-500">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-600 font-medium">
                          {selectedStrategy.performance.profitFactor.toFixed(2)}
                        </div>
                        <div className="text-blue-500">Profit Factor</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-1 ml-3">
                  {onNavigateToStrategy && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToStrategy(selectedStrategy.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStrategySelect(undefined)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Strategy Suggestions Panel */}
      {showSuggestionsPanel && suggestions.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">Suggested Strategies</h4>
            </div>
            
            <div className="space-y-3">
              {suggestions.slice(0, 3).map(suggestion => (
                <div
                  key={suggestion.strategyId}
                  className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {suggestion.strategyName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.confidence}% match
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {suggestion.reasoning}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {suggestion.matchingFactors.slice(0, 3).map(factor => (
                        <Badge key={factor} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                      {suggestion.matchingFactors.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{suggestion.matchingFactors.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleSuggestionAccept(suggestion)}
                    className="ml-3"
                  >
                    Use This
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-yellow-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestionsPanel(false)}
                className="text-yellow-700 hover:text-yellow-800"
              >
                Hide Suggestions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StrategySelector;
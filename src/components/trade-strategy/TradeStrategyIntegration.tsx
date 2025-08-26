import React, { useState, useEffect, useCallback } from 'react';
import { Trade, TradeWithStrategy } from '../../types/trade';
import { ProfessionalStrategy, StrategySuggestion, StrategyDeviation } from '../../types/strategy';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  BarChart3,
  Clock,
  DollarSign
} from 'lucide-react';
import { StrategyAttributionService } from '../../services/StrategyAttributionService';
import { StrategyPerformanceService } from '../../services/StrategyPerformanceService';

interface TradeStrategyIntegrationProps {
  trade: Trade;
  editedTrade: TradeWithStrategy;
  availableStrategies: ProfessionalStrategy[];
  isEditing: boolean;
  onTradeChange: (field: keyof TradeWithStrategy, value: any) => void;
  onNavigateToStrategy?: (strategyId: string) => void;
  onPerformanceUpdate?: (strategyId: string) => void;
}

const TradeStrategyIntegration: React.FC<TradeStrategyIntegrationProps> = ({
  trade,
  editedTrade,
  availableStrategies,
  isEditing,
  onTradeChange,
  onNavigateToStrategy,
  onPerformanceUpdate
}) => {
  const [suggestions, setSuggestions] = useState<StrategySuggestion[]>([]);
  const [adherenceScore, setAdherenceScore] = useState<number | null>(null);
  const [deviations, setDeviations] = useState<StrategyDeviation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const attributionService = new StrategyAttributionService();
  const performanceService = new StrategyPerformanceService();

  // Get strategy suggestions when trade data changes
  useEffect(() => {
    if (!editedTrade.strategyId && availableStrategies.length > 0) {
      const tradeSuggestions = attributionService.suggestStrategy(editedTrade, availableStrategies);
      setSuggestions(tradeSuggestions);
      setShowSuggestions(tradeSuggestions.length > 0);
    }
  }, [editedTrade.currencyPair, editedTrade.timeframe, availableStrategies]);

  // Calculate adherence score when strategy is assigned
  useEffect(() => {
    if (editedTrade.strategyId && !isCalculating) {
      calculateAdherenceScore();
    }
  }, [editedTrade.strategyId, editedTrade.entryPrice, editedTrade.exitPrice, editedTrade.lotSize]);

  const calculateAdherenceScore = useCallback(async () => {
    if (!editedTrade.strategyId) return;

    const strategy = availableStrategies.find(s => s.id === editedTrade.strategyId);
    if (!strategy) return;

    setIsCalculating(true);
    try {
      const score = attributionService.calculateAdherenceScore(editedTrade, strategy);
      const tradeDeviations = attributionService.identifyDeviations(editedTrade, strategy);
      
      setAdherenceScore(score);
      setDeviations(tradeDeviations);
      
      // Update trade with adherence data
      onTradeChange('adherenceScore', score);
      onTradeChange('deviations', tradeDeviations);
    } catch (error) {
      console.error('Error calculating adherence score:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [editedTrade, availableStrategies, onTradeChange]);

  const handleStrategyAssignment = useCallback(async (strategyId: string) => {
    try {
      if (strategyId === 'none') {
        // Remove strategy assignment
        onTradeChange('strategyId', undefined);
        onTradeChange('strategyName', undefined);
        onTradeChange('strategyVersion', undefined);
        onTradeChange('adherenceScore', undefined);
        onTradeChange('deviations', undefined);
        setAdherenceScore(null);
        setDeviations([]);
        setShowSuggestions(true);
        return;
      }

      const strategy = availableStrategies.find(s => s.id === strategyId);
      if (!strategy) return;

      // Update trade with strategy information
      onTradeChange('strategyId', strategyId);
      onTradeChange('strategyName', strategy.title);
      onTradeChange('strategyVersion', strategy.version);

      // If trade is closed, update strategy performance
      if (editedTrade.status === 'closed' && editedTrade.exitPrice) {
        await performanceService.updatePerformanceMetrics(strategyId, editedTrade);
        onPerformanceUpdate?.(strategyId);
      }

      setShowSuggestions(false);
    } catch (error) {
      console.error('Error assigning strategy:', error);
    }
  }, [availableStrategies, editedTrade, onTradeChange, onPerformanceUpdate]);

  const handleSuggestionAccept = useCallback((suggestion: StrategySuggestion) => {
    handleStrategyAssignment(suggestion.strategyId);
  }, [handleStrategyAssignment]);

  const handleStrategyRemoval = useCallback(() => {
    onTradeChange('strategyId', undefined);
    onTradeChange('strategyName', undefined);
    onTradeChange('strategyVersion', undefined);
    onTradeChange('adherenceScore', undefined);
    onTradeChange('deviations', undefined);
    
    setAdherenceScore(null);
    setDeviations([]);
    setShowSuggestions(true);
  }, [onTradeChange]);

  const getAdherenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const currentStrategy = editedTrade.strategyId 
    ? availableStrategies.find(s => s.id === editedTrade.strategyId)
    : null;

  return (
    <div className="space-y-4">
      {/* Strategy Assignment Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Strategy Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              <Select
                value={editedTrade.strategyId || 'none'}
                onValueChange={handleStrategyAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a strategy..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Strategy</SelectItem>
                  {availableStrategies.map(strategy => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{strategy.title}</span>
                        <Badge variant="outline" className="ml-2">
                          {strategy.methodology}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentStrategy && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStrategyRemoval}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove Strategy
                </Button>
              )}
            </div>
          ) : (
            <div>
              {currentStrategy ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="px-3 py-1">
                      {currentStrategy.title}
                    </Badge>
                    <Badge variant="outline">
                      {currentStrategy.methodology}
                    </Badge>
                  </div>
                  {onNavigateToStrategy && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToStrategy(currentStrategy.id)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Strategy
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  No strategy assigned
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategy Suggestions */}
      {showSuggestions && suggestions.length > 0 && isEditing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Suggested Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.slice(0, 3).map(suggestion => (
                <div
                  key={suggestion.strategyId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{suggestion.strategyName}</span>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.confidence}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestion.matchingFactors.map(factor => (
                        <Badge key={factor} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
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
          </CardContent>
        </Card>
      )}

      {/* Strategy Adherence Analysis */}
      {currentStrategy && adherenceScore !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Strategy Adherence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Adherence Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Adherence Score</span>
                <span className={`font-bold ${getAdherenceColor(adherenceScore)}`}>
                  {adherenceScore.toFixed(0)}% ({getAdherenceLabel(adherenceScore)})
                </span>
              </div>
              <Progress value={adherenceScore} className="h-2" />
            </div>

            {/* Deviations */}
            {deviations.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Strategy Deviations
                  </h4>
                  <div className="space-y-2">
                    {deviations.map((deviation, index) => (
                      <Alert key={index} className="py-2">
                        <AlertDescription className="text-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="font-medium">{deviation.type}:</span>
                              <span className="ml-1">{deviation.description}</span>
                            </div>
                            <Badge
                              variant={
                                deviation.impact === 'Positive' ? 'default' :
                                deviation.impact === 'Negative' ? 'destructive' : 'secondary'
                              }
                              className="text-xs ml-2"
                            >
                              {deviation.impact}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Perfect Adherence */}
            {deviations.length === 0 && adherenceScore >= 95 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Excellent! This trade followed the strategy rules perfectly.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strategy Performance Impact */}
      {currentStrategy && editedTrade.status === 'closed' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Performance Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-gray-600">Strategy Trades</div>
                <div className="font-semibold">
                  {currentStrategy.performance.totalTrades + 1}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-600">Win Rate</div>
                <div className="font-semibold">
                  {currentStrategy.performance.winRate.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-600">Profit Factor</div>
                <div className="font-semibold">
                  {currentStrategy.performance.profitFactor.toFixed(2)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-600">Expectancy</div>
                <div className="font-semibold">
                  ${currentStrategy.performance.expectancy.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TradeStrategyIntegration;
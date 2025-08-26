import React from 'react';
import { ProfessionalStrategy } from '../../types/strategy';
import { TradeWithStrategy } from '../../types/trade';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react';

interface StrategyTradeNavigationProps {
  currentTrade: TradeWithStrategy;
  strategy: ProfessionalStrategy;
  relatedTrades: TradeWithStrategy[];
  onNavigateToTrade: (tradeId: string) => void;
  onNavigateToStrategy: (strategyId: string) => void;
  showRelatedTrades?: boolean;
  compact?: boolean;
}

const StrategyTradeNavigation: React.FC<StrategyTradeNavigationProps> = ({
  currentTrade,
  strategy,
  relatedTrades,
  onNavigateToTrade,
  onNavigateToStrategy,
  showRelatedTrades = true,
  compact = false
}) => {
  // Find current trade index in related trades
  const currentTradeIndex = relatedTrades.findIndex(t => t.id === currentTrade.id);
  const prevTrade = currentTradeIndex > 0 ? relatedTrades[currentTradeIndex - 1] : null;
  const nextTrade = currentTradeIndex >= 0 && currentTradeIndex < relatedTrades.length - 1 
    ? relatedTrades[currentTradeIndex + 1] 
    : null;

  // Get recent trades (excluding current)
  const recentTrades = relatedTrades
    .filter(t => t.id !== currentTrade.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, compact ? 3 : 5);

  const formatTradeDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
  };

  const formatPnL = (pnl?: number) => {
    if (pnl === undefined) return 'Open';
    const sign = pnl > 0 ? '+' : '';
    return `${sign}$${pnl.toFixed(2)}`;
  };

  const getPnLColor = (pnl?: number) => {
    if (pnl === undefined) return 'text-gray-500';
    return pnl > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Strategy Link */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToStrategy(strategy.id)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Target className="w-4 h-4 mr-1" />
            {strategy.title}
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          
          <div className="text-xs text-gray-500">
            {currentTradeIndex + 1} of {relatedTrades.length}
          </div>
        </div>

        {/* Navigation Buttons */}
        {(prevTrade || nextTrade) && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => prevTrade && onNavigateToTrade(prevTrade.id)}
              disabled={!prevTrade}
              className="text-xs"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Prev
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => nextTrade && onNavigateToTrade(nextTrade.id)}
              disabled={!nextTrade}
              className="text-xs"
            >
              Next
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Strategy Overview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              <span className="text-blue-900">{strategy.title}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToStrategy(strategy.id)}
              className="text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Strategy
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-4">
            <Badge variant="outline">{strategy.methodology}</Badge>
            <Badge variant="secondary">{strategy.primaryTimeframe}</Badge>
          </div>
          
          <p className="text-sm text-blue-800">{strategy.description}</p>
          
          {strategy.performance.totalTrades > 0 && (
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-900">
                  {strategy.performance.totalTrades}
                </div>
                <div className="text-blue-600">Trades</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-900">
                  {strategy.performance.winRate.toFixed(1)}%
                </div>
                <div className="text-blue-600">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-900">
                  {strategy.performance.profitFactor.toFixed(2)}
                </div>
                <div className="text-blue-600">Profit Factor</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-900">
                  ${strategy.performance.expectancy.toFixed(2)}
                </div>
                <div className="text-blue-600">Expectancy</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Strategy Trades</span>
            <div className="text-sm font-normal text-gray-500">
              {currentTradeIndex + 1} of {relatedTrades.length}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Previous/Next Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => prevTrade && onNavigateToTrade(prevTrade.id)}
              disabled={!prevTrade}
              className="flex-1 mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {prevTrade ? (
                <div className="text-left">
                  <div className="font-medium">Previous Trade</div>
                  <div className="text-xs text-gray-500">
                    {formatTradeDate(prevTrade.timestamp)}
                  </div>
                </div>
              ) : (
                'No Previous Trade'
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => nextTrade && onNavigateToTrade(nextTrade.id)}
              disabled={!nextTrade}
              className="flex-1 ml-2"
            >
              {nextTrade ? (
                <div className="text-right">
                  <div className="font-medium">Next Trade</div>
                  <div className="text-xs text-gray-500">
                    {formatTradeDate(nextTrade.timestamp)}
                  </div>
                </div>
              ) : (
                'No Next Trade'
              )}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Recent Trades List */}
          {showRelatedTrades && recentTrades.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Strategy Trades</h4>
                <div className="space-y-2">
                  {recentTrades.map(trade => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onNavigateToTrade(trade.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {trade.currencyPair}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {trade.side}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatTradeDate(trade.timestamp)}</span>
                            {trade.adherenceScore && (
                              <>
                                <span>•</span>
                                <span>{trade.adherenceScore.toFixed(0)}% adherence</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-medium ${getPnLColor(trade.pnl)}`}>
                          {formatPnL(trade.pnl)}
                        </div>
                        {trade.pnl !== undefined && (
                          trade.pnl > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {relatedTrades.length > recentTrades.length + 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToStrategy(strategy.id)}
                    className="w-full mt-3 text-blue-600 hover:text-blue-700"
                  >
                    View All {relatedTrades.length} Trades
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategyTradeNavigation;
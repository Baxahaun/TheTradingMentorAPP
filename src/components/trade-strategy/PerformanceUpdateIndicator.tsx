import React, { useState, useEffect } from 'react';
import { ProfessionalStrategy } from '../../types/strategy';
import { TradeWithStrategy } from '../../types/trade';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  Clock,
  DollarSign,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PerformanceUpdateIndicatorProps {
  trade: TradeWithStrategy;
  strategy: ProfessionalStrategy;
  isTradeComplete: boolean;
  onNavigateToStrategy?: (strategyId: string) => void;
  onRefreshPerformance?: (strategyId: string) => void;
}

interface PerformanceChange {
  metric: string;
  oldValue: number;
  newValue: number;
  change: number;
  changePercent: number;
  isImprovement: boolean;
}

const PerformanceUpdateIndicator: React.FC<PerformanceUpdateIndicatorProps> = ({
  trade,
  strategy,
  isTradeComplete,
  onNavigateToStrategy,
  onRefreshPerformance
}) => {
  const [performanceChanges, setPerformanceChanges] = useState<PerformanceChange[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Calculate the impact this trade would have on strategy performance
  useEffect(() => {
    if (isTradeComplete && trade.pnl !== undefined) {
      calculatePerformanceImpact();
    }
  }, [trade.pnl, trade.exitPrice, isTradeComplete]);

  const calculatePerformanceImpact = () => {
    if (!trade.pnl || !isTradeComplete) return;

    const isWinningTrade = trade.pnl > 0;
    const currentPerformance = strategy.performance;
    
    // Calculate new metrics after this trade
    const newTotalTrades = currentPerformance.totalTrades + 1;
    const newWinningTrades = currentPerformance.winningTrades + (isWinningTrade ? 1 : 0);
    const newLosingTrades = currentPerformance.losingTrades + (isWinningTrade ? 0 : 1);
    
    // Calculate new win rate
    const oldWinRate = currentPerformance.winRate;
    const newWinRate = (newWinningTrades / newTotalTrades) * 100;
    
    // Calculate new profit factor (simplified)
    const totalProfit = (currentPerformance.averageWin * currentPerformance.winningTrades) + (isWinningTrade ? trade.pnl : 0);
    const totalLoss = Math.abs(currentPerformance.averageLoss * currentPerformance.losingTrades) + (isWinningTrade ? 0 : Math.abs(trade.pnl));
    const newProfitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit;
    
    // Calculate new expectancy
    const newAverageWin = newWinningTrades > 0 ? totalProfit / newWinningTrades : 0;
    const newAverageLoss = newLosingTrades > 0 ? totalLoss / newLosingTrades : 0;
    const newExpectancy = (newWinRate / 100) * newAverageWin - ((100 - newWinRate) / 100) * newAverageLoss;

    const changes: PerformanceChange[] = [
      {
        metric: 'Win Rate',
        oldValue: oldWinRate,
        newValue: newWinRate,
        change: newWinRate - oldWinRate,
        changePercent: oldWinRate > 0 ? ((newWinRate - oldWinRate) / oldWinRate) * 100 : 0,
        isImprovement: newWinRate > oldWinRate
      },
      {
        metric: 'Profit Factor',
        oldValue: currentPerformance.profitFactor,
        newValue: newProfitFactor,
        change: newProfitFactor - currentPerformance.profitFactor,
        changePercent: currentPerformance.profitFactor > 0 ? ((newProfitFactor - currentPerformance.profitFactor) / currentPerformance.profitFactor) * 100 : 0,
        isImprovement: newProfitFactor > currentPerformance.profitFactor
      },
      {
        metric: 'Expectancy',
        oldValue: currentPerformance.expectancy,
        newValue: newExpectancy,
        change: newExpectancy - currentPerformance.expectancy,
        changePercent: currentPerformance.expectancy !== 0 ? ((newExpectancy - currentPerformance.expectancy) / Math.abs(currentPerformance.expectancy)) * 100 : 0,
        isImprovement: newExpectancy > currentPerformance.expectancy
      }
    ];

    setPerformanceChanges(changes);
  };

  const handleRefreshPerformance = async () => {
    if (!onRefreshPerformance) return;
    
    setIsUpdating(true);
    try {
      await onRefreshPerformance(strategy.id);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error refreshing performance:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatValue = (metric: string, value: number) => {
    switch (metric) {
      case 'Win Rate':
        return `${value.toFixed(1)}%`;
      case 'Profit Factor':
        return value.toFixed(2);
      case 'Expectancy':
        return `$${value.toFixed(2)}`;
      default:
        return value.toFixed(2);
    }
  };

  const formatChange = (change: PerformanceChange) => {
    const sign = change.change > 0 ? '+' : '';
    const value = formatValue(change.metric, Math.abs(change.change));
    return `${sign}${value}`;
  };

  if (!isTradeComplete) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">Performance Update Pending</h4>
              <p className="text-sm text-blue-700">
                Strategy performance will be updated when this trade is closed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Performance Impact Summary */}
      <Card className={`${trade.pnl && trade.pnl > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {trade.pnl && trade.pnl > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <h4 className={`font-medium ${trade.pnl && trade.pnl > 0 ? 'text-green-900' : 'text-red-900'}`}>
                  Strategy Performance Impact
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className={`text-sm ${trade.pnl && trade.pnl > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Trade P&L
                  </div>
                  <div className={`font-semibold ${trade.pnl && trade.pnl > 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {trade.pnl && trade.pnl > 0 ? '+' : ''}${trade.pnl?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div>
                  <div className={`text-sm ${trade.pnl && trade.pnl > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    New Total Trades
                  </div>
                  <div className={`font-semibold ${trade.pnl && trade.pnl > 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {strategy.performance.totalTrades + 1}
                  </div>
                </div>
              </div>

              {lastUpdateTime && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <CheckCircle className="w-3 h-3" />
                  <span>Updated {lastUpdateTime.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPerformance}
                disabled={isUpdating}
                className="text-xs"
              >
                {isUpdating ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Update
              </Button>
              
              {onNavigateToStrategy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateToStrategy(strategy.id)}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Performance Changes */}
      {performanceChanges.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Projected Performance Changes</h4>
            </div>
            
            <div className="space-y-3">
              {performanceChanges.map((change, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">
                      {change.metric}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatValue(change.metric, change.oldValue)}</span>
                      <span>→</span>
                      <span>{formatValue(change.metric, change.newValue)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={change.isImprovement ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {formatChange(change)}
                    </Badge>
                    {change.isImprovement ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Statistical Significance Warning */}
            {strategy.performance.totalTrades < 30 && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Strategy has {strategy.performance.totalTrades} trades. 
                  Need 30+ trades for statistical significance.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceUpdateIndicator;
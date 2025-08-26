import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { BacktestResult } from '../../services/BacktestingService';
import { TrendingUp, TrendingDown, BarChart3, Target, AlertCircle } from 'lucide-react';

interface BacktestResultsChartProps {
  result: BacktestResult;
}

export const BacktestResultsChart: React.FC<BacktestResultsChartProps> = ({ result }) => {
  const { originalPerformance, backtestPerformance, summary, metadata } = result;

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toFixed(2);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold">
                  {summary.performanceImprovement > 0 ? '+' : ''}
                  {formatPercentage(summary.performanceImprovement)}
                </p>
              </div>
              {getChangeIcon(summary.performanceImprovement)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trades Affected</p>
                <p className="text-2xl font-bold">{summary.tradesAffected}</p>
                <p className="text-xs text-muted-foreground">
                  of {summary.totalTrades} total
                </p>
              </div>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold">{metadata.confidence}%</p>
              </div>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Execution Time</p>
                <p className="text-2xl font-bold">{metadata.executionTime}ms</p>
              </div>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Profit Factor */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Profit Factor</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Original: {formatNumber(originalPerformance.profitFactor)}
                  </span>
                  <span className="text-sm font-medium">
                    Backtest: {formatNumber(backtestPerformance.profitFactor)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getChangeColor(summary.profitFactorChange)}`}>
                  {summary.profitFactorChange > 0 ? '+' : ''}
                  {formatNumber(summary.profitFactorChange)}
                </span>
                {getChangeIcon(summary.profitFactorChange)}
              </div>
            </div>

            {/* Win Rate */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Win Rate</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Original: {formatPercentage(originalPerformance.winRate)}
                  </span>
                  <span className="text-sm font-medium">
                    Backtest: {formatPercentage(backtestPerformance.winRate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getChangeColor(summary.winRateChange)}`}>
                  {summary.winRateChange > 0 ? '+' : ''}
                  {formatPercentage(summary.winRateChange)}
                </span>
                {getChangeIcon(summary.winRateChange)}
              </div>
            </div>

            {/* Expectancy */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Expectancy</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Original: {formatCurrency(originalPerformance.expectancy)}
                  </span>
                  <span className="text-sm font-medium">
                    Backtest: {formatCurrency(backtestPerformance.expectancy)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getChangeColor(summary.expectancyChange)}`}>
                  {summary.expectancyChange > 0 ? '+' : ''}
                  {formatCurrency(summary.expectancyChange)}
                </span>
                {getChangeIcon(summary.expectancyChange)}
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Max Drawdown</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Original: {formatCurrency(originalPerformance.maxDrawdown)}
                  </span>
                  <span className="text-sm font-medium">
                    Backtest: {formatCurrency(backtestPerformance.maxDrawdown)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getChangeColor(-summary.maxDrawdownChange)}`}>
                  {summary.maxDrawdownChange > 0 ? '+' : ''}
                  {formatCurrency(summary.maxDrawdownChange)}
                </span>
                {getChangeIcon(-summary.maxDrawdownChange)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modifications Applied */}
      {metadata.modifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Modifications Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metadata.modifications.map((mod, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <Badge variant="outline" className="mr-2">{mod.type}</Badge>
                    <span className="text-sm">{mod.description}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {mod.field}: {String(mod.originalValue)} → {String(mod.newValue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{result.trades.length}</p>
              <p className="text-sm text-muted-foreground">Total Trades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {result.trades.filter(t => t.backtestOutcome === 'win').length}
              </p>
              <p className="text-sm text-muted-foreground">Winning Trades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {result.trades.filter(t => t.backtestOutcome === 'loss').length}
              </p>
              <p className="text-sm text-muted-foreground">Losing Trades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{summary.tradesAffected}</p>
              <p className="text-sm text-muted-foreground">Modified Trades</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {summary.performanceImprovement > 5 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              The backtest shows a significant improvement of {formatPercentage(summary.performanceImprovement)}. 
              Consider implementing these modifications to your live strategy.
            </p>
          </CardContent>
        </Card>
      )}

      {summary.performanceImprovement < -5 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Warning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              The backtest shows a performance decline of {formatPercentage(Math.abs(summary.performanceImprovement))}. 
              These modifications may not be beneficial for your strategy.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
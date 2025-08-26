import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { SimulationResult } from '../../services/BacktestingService';
import { TrendingUp, Shield, BarChart3, Target, AlertTriangle } from 'lucide-react';

interface SimulationResultsChartProps {
  result: SimulationResult;
}

export const SimulationResultsChart: React.FC<SimulationResultsChartProps> = ({ result }) => {
  const { projectedPerformance, riskMetrics, confidenceInterval, scenario, modifications } = result;

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toFixed(2);

  const getRiskLevel = (sharpe: number) => {
    if (sharpe > 2) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-50' };
    if (sharpe > 1) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const riskLevel = getRiskLevel(riskMetrics.sharpeRatio);

  return (
    <div className="space-y-6">
      {/* Scenario Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {scenario}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Modifications Applied</h4>
              <div className="space-y-1">
                {Object.entries(modifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${riskLevel.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Risk Assessment</span>
              </div>
              <p className={`text-lg font-bold ${riskLevel.color}`}>{riskLevel.level} Risk</p>
              <p className="text-sm text-muted-foreground">
                Sharpe Ratio: {formatNumber(riskMetrics.sharpeRatio)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projected Expectancy</p>
                <p className="text-2xl font-bold">{formatCurrency(projectedPerformance.expectancy)}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(projectedPerformance.winRate)}</p>
              </div>
              <Target className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profit Factor</p>
                <p className="text-2xl font-bold">{formatNumber(projectedPerformance.profitFactor)}</p>
              </div>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                <p className="text-2xl font-bold">{formatCurrency(riskMetrics.maxDrawdown)}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Sharpe Ratio</p>
                  <p className="text-sm text-muted-foreground">Risk-adjusted return</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatNumber(riskMetrics.sharpeRatio)}</p>
                  <Badge variant={riskMetrics.sharpeRatio > 1 ? 'default' : 'destructive'}>
                    {riskMetrics.sharpeRatio > 1 ? 'Good' : 'Poor'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Sortino Ratio</p>
                  <p className="text-sm text-muted-foreground">Downside risk adjusted</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatNumber(riskMetrics.sortinoRatio)}</p>
                  <Badge variant={riskMetrics.sortinoRatio > 1 ? 'default' : 'destructive'}>
                    {riskMetrics.sortinoRatio > 1 ? 'Good' : 'Poor'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Volatility</p>
                  <p className="text-sm text-muted-foreground">Return variability</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatNumber(riskMetrics.volatility)}</p>
                  <Badge variant={riskMetrics.volatility < 0.2 ? 'default' : 'destructive'}>
                    {riskMetrics.volatility < 0.2 ? 'Low' : 'High'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Maximum Drawdown</p>
                  <p className="text-sm text-muted-foreground">Worst peak-to-trough</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(riskMetrics.maxDrawdown)}</p>
                  <Badge variant={riskMetrics.maxDrawdown < 1000 ? 'default' : 'destructive'}>
                    {riskMetrics.maxDrawdown < 1000 ? 'Acceptable' : 'High'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Interval */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Interval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {formatPercentage(confidenceInterval.confidence * 100)} Confidence Interval for Expected Return
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{formatCurrency(confidenceInterval.lower)}</p>
                  <p className="text-xs text-muted-foreground">Lower Bound</p>
                </div>
                <div className="flex-1 px-4">
                  <div className="relative">
                    <Progress value={50} className="h-3" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(projectedPerformance.expectancy)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(confidenceInterval.upper)}</p>
                  <p className="text-xs text-muted-foreground">Upper Bound</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-700">Worst Case</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(confidenceInterval.lower)}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700">Expected</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(projectedPerformance.expectancy)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-700">Best Case</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(confidenceInterval.upper)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3">Projected Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Trades:</span>
                  <span className="font-medium">{projectedPerformance.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Winning Trades:</span>
                  <span className="font-medium">{projectedPerformance.winningTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Losing Trades:</span>
                  <span className="font-medium">{projectedPerformance.losingTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Win:</span>
                  <span className="font-medium">{formatCurrency(projectedPerformance.averageWin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Loss:</span>
                  <span className="font-medium">{formatCurrency(projectedPerformance.averageLoss)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Risk Assessment</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk Level:</span>
                  <Badge variant={riskLevel.level === 'Low' ? 'default' : riskLevel.level === 'Medium' ? 'secondary' : 'destructive'}>
                    {riskLevel.level}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <span className="font-medium">{formatPercentage(confidenceInterval.confidence * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Statistical Significance:</span>
                  <Badge variant={projectedPerformance.statisticallySignificant ? 'default' : 'destructive'}>
                    {projectedPerformance.statisticallySignificant ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskMetrics.sharpeRatio > 1.5 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Excellent Risk-Adjusted Returns:</strong> The Sharpe ratio of {formatNumber(riskMetrics.sharpeRatio)} indicates strong risk-adjusted performance.
                </p>
              </div>
            )}

            {riskMetrics.maxDrawdown > 2000 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>High Drawdown Risk:</strong> Maximum drawdown of {formatCurrency(riskMetrics.maxDrawdown)} may be too high for conservative risk management.
                </p>
              </div>
            )}

            {projectedPerformance.expectancy > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Positive Expectancy:</strong> The strategy shows positive expected value of {formatCurrency(projectedPerformance.expectancy)} per trade.
                </p>
              </div>
            )}

            {riskMetrics.volatility > 0.3 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>High Volatility:</strong> Return volatility of {formatNumber(riskMetrics.volatility)} suggests inconsistent performance.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
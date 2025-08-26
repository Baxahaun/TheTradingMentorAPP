import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { VersionComparison } from '../../services/BacktestingService';
import { TrendingUp, TrendingDown, BarChart3, CheckCircle, XCircle } from 'lucide-react';

interface VersionComparisonChartProps {
  result: VersionComparison;
}

export const VersionComparisonChart: React.FC<VersionComparisonChartProps> = ({ result }) => {
  const { performanceComparison, tradeByTradeAnalysis, recommendations } = result;
  const { original, modified, improvement } = performanceComparison;

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toFixed(2);

  const getImprovementColor = (value: number) => {
    if (value > 5) return 'text-green-600';
    if (value < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getImprovementIcon = (value: number) => {
    if (value > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-yellow-500" />;
  };

  const improvingTrades = tradeByTradeAnalysis.filter(t => t.difference > 0).length;
  const decliningTrades = tradeByTradeAnalysis.filter(t => t.difference < 0).length;
  const unchangedTrades = tradeByTradeAnalysis.filter(t => t.difference === 0).length;

  return (
    <div className="space-y-6">
      {/* Overall Improvement Summary */}
      <Card className={improvement > 0 ? 'border-green-200 bg-green-50' : improvement < 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getImprovementIcon(improvement)}
            Overall Performance Change
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className={`text-4xl font-bold ${getImprovementColor(improvement)}`}>
              {improvement > 0 ? '+' : ''}{formatPercentage(improvement)}
            </p>
            <p className="text-muted-foreground mt-2">
              {improvement > 0 ? 'Performance Improvement' : improvement < 0 ? 'Performance Decline' : 'No Significant Change'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Original Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Profit Factor:</span>
                <span className="font-medium">{formatNumber(original.profitFactor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Win Rate:</span>
                <span className="font-medium">{formatPercentage(original.winRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expectancy:</span>
                <span className="font-medium">{formatCurrency(original.expectancy)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max Drawdown:</span>
                <span className="font-medium">{formatCurrency(original.maxDrawdown)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Trades:</span>
                <span className="font-medium">{original.totalTrades}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Modified Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Profit Factor:</span>
                <span className="font-medium">{formatNumber(modified.profitFactor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Win Rate:</span>
                <span className="font-medium">{formatPercentage(modified.winRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expectancy:</span>
                <span className="font-medium">{formatCurrency(modified.expectancy)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max Drawdown:</span>
                <span className="font-medium">{formatCurrency(modified.maxDrawdown)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Trades:</span>
                <span className="font-medium">{modified.totalTrades}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">Improved</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{improvingTrades}</p>
              <p className="text-sm text-green-600">
                {formatPercentage((improvingTrades / tradeByTradeAnalysis.length) * 100)}
              </p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700">Declined</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{decliningTrades}</p>
              <p className="text-sm text-red-600">
                {formatPercentage((decliningTrades / tradeByTradeAnalysis.length) * 100)}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-700">Unchanged</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">{unchangedTrades}</p>
              <p className="text-sm text-gray-600">
                {formatPercentage((unchangedTrades / tradeByTradeAnalysis.length) * 100)}
              </p>
            </div>
          </div>

          {/* Progress bars for visual representation */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Improvement Rate</span>
                <span>{formatPercentage((improvingTrades / tradeByTradeAnalysis.length) * 100)}</span>
              </div>
              <Progress 
                value={(improvingTrades / tradeByTradeAnalysis.length) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Trade Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Top Trade Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tradeByTradeAnalysis
              .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
              .slice(0, 10)
              .map((trade, index) => (
                <div key={trade.tradeId} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Trade {index + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {trade.reasonForChange || 'No changes'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {formatCurrency(trade.originalOutcome)} → {formatCurrency(trade.modifiedOutcome)}
                    </span>
                    <span className={`text-sm font-medium ${
                      trade.difference > 0 ? 'text-green-600' : trade.difference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trade.difference > 0 ? '+' : ''}{formatCurrency(trade.difference)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Comparison Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">{result.originalStrategy.title}</h4>
              <p className="text-sm text-muted-foreground mb-2">Version {result.originalStrategy.version}</p>
              <div className="space-y-1 text-xs">
                <p>Risk per trade: {result.originalStrategy.riskManagement.maxRiskPerTrade}%</p>
                <p>R:R Ratio: {result.originalStrategy.riskManagement.riskRewardRatio}</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-blue-50">
              <h4 className="font-medium mb-2">{result.modifiedStrategy.title}</h4>
              <p className="text-sm text-muted-foreground mb-2">Version {result.modifiedStrategy.version}</p>
              <div className="space-y-1 text-xs">
                <p>Risk per trade: {result.modifiedStrategy.riskManagement.maxRiskPerTrade}%</p>
                <p>R:R Ratio: {result.modifiedStrategy.riskManagement.riskRewardRatio}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
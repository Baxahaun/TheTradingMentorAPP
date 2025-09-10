import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Activity, Target, DollarSign, BarChart3 } from 'lucide-react';
import { PerformanceMetrics, PerformanceMetricsPanelProps } from '../../types/tradingPerformance';
import { formatChartValue } from '../../utils/performanceChartUtils';

/**
 * Performance Metrics Panel Component
 *
 * Displays key trading performance indicators in compact, color-coded cards
 * with trend arrows and visual indicators for quick assessment.
 */
const PerformanceMetricsPanel: React.FC<PerformanceMetricsPanelProps> = ({
  metrics,
  size
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  const formatPercent = (value: number) =>
    `${value.toFixed(1)}%`;

  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', direction: 'up' as const };
    }
    if (value < 0) {
      return { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-50', direction: 'down' as const };
    }
    return { icon: Activity, color: 'text-gray-600', bgColor: 'bg-gray-50', direction: null };
  };

  const getMetricColor = (metricType: string, value: number) => {
    switch (metricType) {
      case 'netPnL':
      case 'totalPips':
        return value >= 0 ? 'text-green-600' : 'text-red-600';

      case 'winRate':
        if (value >= 70) return 'text-green-600';
        if (value >= 50) return 'text-yellow-600';
        return 'text-red-600';

      case 'sharpeRatio':
        if (value && value >= 1.5) return 'text-green-600';
        if (value && value >= 0.5) return 'text-yellow-600';
        return 'text-red-600';

      case 'profitFactor':
        if (value >= 2.0) return 'text-green-600';
        if (value >= 1.5) return 'text-yellow-600';
        return 'text-red-600';

      default:
        return 'text-gray-600';
    }
  };

  const metricCards = [
    {
      title: 'Net P&L',
      value: formatCurrency(metrics.netPnL),
      subtitle: `${metrics.totalTrades} trades`,
      color: getMetricColor('netPnL', metrics.netPnL),
      trend: getTrendIndicator(metrics.netPnL),
      icon: DollarSign,
      key: 'netPnl'
    },
    {
      title: 'Win Rate',
      value: formatPercent(metrics.winRate),
      subtitle: `${metrics.winningTrades} wins, ${metrics.losingTrades} losses`,
      color: getMetricColor('winRate', metrics.winRate),
      trend: null,
      icon: Target,
      key: 'winRate'
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor.toFixed(2),
      subtitle: `${metrics.avgWin > 0 ? formatCurrency(metrics.avgWin) : '$0.00'} avg win`,
      color: getMetricColor('profitFactor', metrics.profitFactor),
      trend: null,
      icon: BarChart3,
      key: 'profitFactor'
    },
    {
      title: 'Sharpe Ratio',
      value: metrics.sharpeRatio ? metrics.sharpeRatio.toFixed(2) : 'N/A',
      subtitle: `${metrics.avgLoss < 0 ? formatCurrency(metrics.avgLoss) : '$0.00'} avg loss`,
      color: getMetricColor('sharpeRatio', metrics.sharpeRatio || 0),
      trend: null,
      icon: Activity,
      key: 'sharpeRatio'
    },
    {
      title: 'Total Pips',
      value: metrics.totalPips ? metrics.totalPips.toFixed(1) : '0.0',
      subtitle: `R:R ${metrics.averageRMultiple ? metrics.averageRMultiple.toFixed(2) : 'N/A'}`,
      color: getMetricColor('totalPips', metrics.totalPips || 0),
      trend: getTrendIndicator(metrics.totalPips || 0),
      icon: Target,
      key: 'totalPips'
    },
    {
      title: 'Avg Trade',
      value: formatCurrency(metrics.tradeExpectancy),
      subtitle: `Commission: ${metrics.totalCommissionPercentage?.toFixed(2) || '0.00'}%`,
      color: getMetricColor('netPnL', metrics.tradeExpectancy),
      trend: getTrendIndicator(metrics.tradeExpectancy),
      icon: BarChart3,
      key: 'avgTrade'
    }
  ];

  // Responsive grid classes based on size
  const getGridClasses = () => {
    const totalWidth = size?.w || 4;
    const totalHeight = size?.h || 4;

    if (totalWidth >= 4) {
      return 'grid grid-cols-2 lg:grid-cols-3 gap-3';
    } else if (totalWidth >= 2) {
      return 'grid grid-cols-2 gap-3';
    } else {
      return 'grid grid-cols-1 gap-2';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
          <Badge variant="outline" className="text-xs">
            Zella Score: {metrics.zellaScore.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={getGridClasses()}>
          {metricCards.map((card) => (
            <div
              key={card.key}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gray-50">
                    <card.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{card.title}</span>
                </div>
                {card.trend && (
                  <div className={`p-1 rounded-full ${card.trend.bgColor}`}>
                    <card.trend.icon className={`w-3 h-3 ${card.trend.color}`} />
                  </div>
                )}
              </div>

              <div className="mb-1">
                <div className={`text-xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {card.subtitle}
                </div>
              </div>

              {/* Visual indicator for key metrics */}
              {card.key === 'winRate' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${metrics.winRate}%` }}
                    />
                  </div>
                </div>
              )}

              {card.key === 'profitFactor' && metrics.profitFactor < 2 && (
                <div className="mt-2">
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className={`rounded-full h-2 transition-all duration-300 ${
                        metrics.profitFactor >= 1.5 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((metrics.profitFactor / 2) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary section */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Max Drawdown: </span>
              <span className={metrics.maxDrawdown < 20 ? 'text-green-600' : 'text-red-600'}>
                {formatPercent(metrics.maxDrawdown)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Recovery Factor: </span>
              <span className={(metrics.recoveryFactor || 0) > 1 ? 'text-green-600' : 'text-yellow-600'}>
                {metrics.recoveryFactor?.toFixed(2) || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetricsPanel;
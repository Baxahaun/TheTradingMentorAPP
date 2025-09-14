import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip } from '../ui/chart';
import { ChartDataPoint } from '../../types/tradingPerformance';
import {
  optimizeChartData,
  formatChartValue,
  chartColorSchemes
} from '../../utils/performanceChartUtils';
import { CURRENT_TERMINOLOGY } from '../../lib/terminologyConfig';

/**
 * Performance Chart Panel Component
 *
 * Interactive chart component displaying cumulative P&L trends with detailed
 * hover information and responsive design for the trading performance widget.
 */
interface ExtendedPerformanceChartPanelProps {
  data: ChartDataPoint[];
  period?: 'daily' | 'weekly' | 'monthly';
  size?: { w: number; h: number };
  onDataPointClick?: (point: ChartDataPoint) => void;
}

const PerformanceChartPanel: React.FC<ExtendedPerformanceChartPanelProps> = ({
  data,
  period = 'daily',
  size = { w: 12, h: 6 },
  onDataPointClick
}) => {

  // Optimize data for performance
  const optimizedChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Optimize for large datasets (limit to 100 points max)
    const optimized = optimizeChartData(data, 100);

    // Sort by date
    return optimized.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  // Calculate summary statistics
  const performanceStats = useMemo(() => {
    if (optimizedChartData.length === 0) {
      return {
        totalPnL: 0,
        totalTrades: 0,
        averagePnL: 0,
        bestDay: 0,
        worstDay: 0,
        winningDays: 0,
        totalDays: 0
      };
    }

    let totalPnL = 0;
    let totalTrades = 0;
    let totalDays = 0;
    let winningDays = 0;
    let bestDay = -Infinity;
    let worstDay = Infinity;

    // Use the last data point for current cumulative P&L
    const lastPoint = optimizedChartData[optimizedChartData.length - 1];

    if (lastPoint && typeof lastPoint.cumulativePnL === 'number') {
      totalPnL = lastPoint.cumulativePnL;
    }

    optimizedChartData.forEach((point: ChartDataPoint) => {
      totalTrades += point.trades || 0;
      totalDays++;

      if (point.value !== undefined && typeof point.value === 'number') {
        if (point.value > 0) winningDays++;
        if (point.value > bestDay) bestDay = point.value;
        if (point.value < worstDay) worstDay = point.value;
      }
    });

    const averagePnL = optimizedChartData.length > 0
      ? optimizedChartData.reduce((sum, point) => sum + (point.value || 0), 0) / optimizedChartData.length
      : 0;

    return {
      totalPnL,
      totalTrades,
      averagePnL,
      bestDay: bestDay === -Infinity ? 0 : bestDay,
      worstDay: worstDay === Infinity ? 0 : worstDay,
      winningDays,
      totalDays
    };
  }, [optimizedChartData]);

  // Get trend indicator
  const getTrendIndicator = () => {
    if (performanceStats.totalPnL > 0) {
      return { icon: TrendingUp, color: 'text-green-600', variant: 'default' as const };
    } else if (performanceStats.totalPnL < 0) {
      return { icon: TrendingDown, color: 'text-red-600', variant: 'destructive' as const };
    }
    return { icon: TrendingUp, color: 'text-gray-500', variant: 'secondary' as const };
  };

  const trend = getTrendIndicator();

  if (optimizedChartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Chart
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No Trade Data Available</p>
            <p className="text-sm">Start trading to see your performance chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Performance Chart
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Cumulative {CURRENT_TERMINOLOGY.profitLossLabel} over time ({period})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={trend.variant} className="gap-1">
            <trend.icon className={`h-3 w-3 ${trend.color}`} />
            {formatChartValue(performanceStats.totalPnL, 'currency')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chart */}
        <div style={{ height: `${size.h * 20}px` }} className="w-full">
          <ChartContainer
            config={{
              pnl: {
                label: CURRENT_TERMINOLOGY.profitLossLabel,
                color: "hsl(var(--chart-1))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={optimizedChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  {/* Profit gradient */}
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColorSchemes.performance.profit.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartColorSchemes.performance.profit.primary}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  {/* Loss gradient */}
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColorSchemes.performance.loss.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartColorSchemes.performance.loss.primary}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  interval="preserveStartEnd"
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => formatChartValue(value, 'currency')}
                />

                {performanceStats.totalPnL !== 0 && <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />}

                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && payload[0]) {
                      const data = payload[0].payload as ChartDataPoint;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
                          <p className="font-medium">{label}</p>

                          <div className="space-y-2 mt-2">
                            <div className="flex justify-between gap-4">
                              <span className="text-sm text-muted-foreground">Daily {CURRENT_TERMINOLOGY.profitLossLabel}:</span>
                              <span className={`text-sm font-medium ${data.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatChartValue(data.value || 0, 'currency')}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-sm text-muted-foreground">Cumulative {CURRENT_TERMINOLOGY.profitLossLabel}:</span>
                              <span className={`text-sm font-medium ${data.cumulativePnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatChartValue(data.cumulativePnL || 0, 'currency')}
                              </span>
                            </div>

                            {(data.trades || 0) > 0 && (
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-muted-foreground">Trades:</span>
                                <span className="text-sm font-medium">{data.trades}</span>
                              </div>
                            )}

                            {data.winRate !== undefined && (
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-muted-foreground">Win Rate:</span>
                                <span className="text-sm font-medium">
                                  {data.winRate.toFixed(1)}%
                                </span>
                              </div>
                            )}

                            {data.pipMovement !== undefined && data.pipMovement !== 0 && (
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-muted-foreground">{CURRENT_TERMINOLOGY.priceMovementLabel} Movement:</span>
                                <span className="text-sm font-medium">
                                  {formatChartValue(data.pipMovement, 'pips')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="cumulativePnL"
                  stroke={performanceStats.totalPnL >= 0
                    ? chartColorSchemes.performance.profit.primary
                    : chartColorSchemes.performance.loss.primary}
                  strokeWidth={2.5}
                  fill={`url(#${performanceStats.totalPnL >= 0 ? 'profitGradient' : 'lossGradient'})`}
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Summary Stats */}
        {optimizedChartData.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Best Day</div>
              <div className={`text-sm font-semibold ${performanceStats.bestDay >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatChartValue(performanceStats.bestDay, 'currency')}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Worst Day</div>
              <div className={`text-sm font-semibold ${performanceStats.worstDay >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performanceStats.worstDay === 0 ? formatChartValue(0, 'currency') : formatChartValue(performanceStats.worstDay, 'currency')}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Total Trades</div>
              <div className="text-sm font-semibold text-blue-600">
                {performanceStats.totalTrades}
              </div>
            </div>
          </div>
        )}

        {/* Empty state for time period */}
        {optimizedChartData.length === 0 && (
          <div className="flex items-center justify-center h-32 text-center">
            <div className="text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data available for selected time period</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceChartPanel;
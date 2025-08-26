/**
 * Trade Distribution Analysis Component
 * 
 * Provides detailed analysis of trade distribution patterns including
 * time-based analysis, currency pair performance, and adherence metrics.
 */

import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Percent,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TradeWithStrategy } from '@/types/strategy';

interface TradeDistributionAnalysisProps {
  trades: TradeWithStrategy[];
  className?: string;
}

interface DistributionMetrics {
  hourlyDistribution: Array<{ hour: number; count: number; winRate: number; avgPnL: number }>;
  dailyDistribution: Array<{ day: number; dayName: string; count: number; winRate: number; avgPnL: number }>;
  pairPerformance: Array<{ pair: string; count: number; winRate: number; avgPnL: number; totalPnL: number }>;
  adherenceAnalysis: {
    avgScore: number;
    distribution: Array<{ range: string; count: number; winRate: number }>;
    correlation: number; // Correlation between adherence and performance
  };
  sizeDistribution: Array<{ sizeRange: string; count: number; winRate: number; avgPnL: number }>;
  durationAnalysis: Array<{ durationRange: string; count: number; winRate: number; avgPnL: number }>;
}

const TradeDistributionAnalysis: React.FC<TradeDistributionAnalysisProps> = ({
  trades,
  className = ''
}) => {
  const metrics = useMemo((): DistributionMetrics => {
    if (trades.length === 0) {
      return {
        hourlyDistribution: [],
        dailyDistribution: [],
        pairPerformance: [],
        adherenceAnalysis: { avgScore: 0, distribution: [], correlation: 0 },
        sizeDistribution: [],
        durationAnalysis: []
      };
    }

    // Hourly distribution analysis
    const hourlyData: Record<number, { trades: TradeWithStrategy[]; wins: number; totalPnL: number }> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { trades: [], wins: 0, totalPnL: 0 };
    }

    trades.forEach(trade => {
      const hour = new Date(trade.timestamp).getHours();
      hourlyData[hour].trades.push(trade);
      if (trade.pnl && trade.pnl > 0) {
        hourlyData[hour].wins++;
      }
      hourlyData[hour].totalPnL += trade.pnl || 0;
    });

    const hourlyDistribution = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      count: data.trades.length,
      winRate: data.trades.length > 0 ? (data.wins / data.trades.length) * 100 : 0,
      avgPnL: data.trades.length > 0 ? data.totalPnL / data.trades.length : 0
    }));

    // Daily distribution analysis
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData: Record<number, { trades: TradeWithStrategy[]; wins: number; totalPnL: number }> = {};
    for (let i = 0; i < 7; i++) {
      dailyData[i] = { trades: [], wins: 0, totalPnL: 0 };
    }

    trades.forEach(trade => {
      const day = new Date(trade.timestamp).getDay();
      dailyData[day].trades.push(trade);
      if (trade.pnl && trade.pnl > 0) {
        dailyData[day].wins++;
      }
      dailyData[day].totalPnL += trade.pnl || 0;
    });

    const dailyDistribution = Object.entries(dailyData).map(([day, data]) => ({
      day: parseInt(day),
      dayName: dayNames[parseInt(day)],
      count: data.trades.length,
      winRate: data.trades.length > 0 ? (data.wins / data.trades.length) * 100 : 0,
      avgPnL: data.trades.length > 0 ? data.totalPnL / data.trades.length : 0
    }));

    // Currency pair performance analysis
    const pairData: Record<string, { trades: TradeWithStrategy[]; wins: number; totalPnL: number }> = {};
    trades.forEach(trade => {
      if (!pairData[trade.currencyPair]) {
        pairData[trade.currencyPair] = { trades: [], wins: 0, totalPnL: 0 };
      }
      pairData[trade.currencyPair].trades.push(trade);
      if (trade.pnl && trade.pnl > 0) {
        pairData[trade.currencyPair].wins++;
      }
      pairData[trade.currencyPair].totalPnL += trade.pnl || 0;
    });

    const pairPerformance = Object.entries(pairData)
      .map(([pair, data]) => ({
        pair,
        count: data.trades.length,
        winRate: data.trades.length > 0 ? (data.wins / data.trades.length) * 100 : 0,
        avgPnL: data.trades.length > 0 ? data.totalPnL / data.trades.length : 0,
        totalPnL: data.totalPnL
      }))
      .sort((a, b) => b.count - a.count);

    // Adherence analysis
    const tradesWithAdherence = trades.filter(t => t.adherenceScore !== undefined);
    const avgScore = tradesWithAdherence.length > 0 
      ? tradesWithAdherence.reduce((sum, t) => sum + t.adherenceScore!, 0) / tradesWithAdherence.length 
      : 0;

    const adherenceRanges = [
      { range: '90-100%', min: 90, max: 100 },
      { range: '80-89%', min: 80, max: 89 },
      { range: '70-79%', min: 70, max: 79 },
      { range: '60-69%', min: 60, max: 69 },
      { range: '<60%', min: 0, max: 59 }
    ];

    const adherenceDistribution = adherenceRanges.map(range => {
      const rangeTradesWithAdherence = tradesWithAdherence.filter(t => 
        t.adherenceScore! >= range.min && t.adherenceScore! <= range.max
      );
      const wins = rangeTradesWithAdherence.filter(t => t.pnl && t.pnl > 0).length;
      
      return {
        range: range.range,
        count: rangeTradesWithAdherence.length,
        winRate: rangeTradesWithAdherence.length > 0 ? (wins / rangeTradesWithAdherence.length) * 100 : 0
      };
    });

    // Calculate correlation between adherence and performance
    let correlation = 0;
    if (tradesWithAdherence.length > 1) {
      const adherenceScores = tradesWithAdherence.map(t => t.adherenceScore!);
      const pnlValues = tradesWithAdherence.map(t => t.pnl || 0);
      
      const avgAdherence = adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length;
      const avgPnL = pnlValues.reduce((sum, pnl) => sum + pnl, 0) / pnlValues.length;
      
      let numerator = 0;
      let denomAdherence = 0;
      let denomPnL = 0;
      
      for (let i = 0; i < tradesWithAdherence.length; i++) {
        const adherenceDiff = adherenceScores[i] - avgAdherence;
        const pnlDiff = pnlValues[i] - avgPnL;
        
        numerator += adherenceDiff * pnlDiff;
        denomAdherence += adherenceDiff * adherenceDiff;
        denomPnL += pnlDiff * pnlDiff;
      }
      
      const denominator = Math.sqrt(denomAdherence * denomPnL);
      correlation = denominator !== 0 ? numerator / denominator : 0;
    }

    // Position size distribution (mock implementation - would need actual position size data)
    const sizeDistribution = [
      { sizeRange: 'Small (0-1%)', count: 0, winRate: 0, avgPnL: 0 },
      { sizeRange: 'Medium (1-2%)', count: 0, winRate: 0, avgPnL: 0 },
      { sizeRange: 'Large (2%+)', count: 0, winRate: 0, avgPnL: 0 }
    ];

    // Duration analysis (mock implementation - would need actual duration data)
    const durationAnalysis = [
      { durationRange: 'Scalp (<1h)', count: 0, winRate: 0, avgPnL: 0 },
      { durationRange: 'Intraday (1-24h)', count: 0, winRate: 0, avgPnL: 0 },
      { durationRange: 'Swing (1-7d)', count: 0, winRate: 0, avgPnL: 0 },
      { durationRange: 'Position (>7d)', count: 0, winRate: 0, avgPnL: 0 }
    ];

    return {
      hourlyDistribution,
      dailyDistribution,
      pairPerformance,
      adherenceAnalysis: {
        avgScore,
        distribution: adherenceDistribution,
        correlation
      },
      sizeDistribution,
      durationAnalysis
    };
  }, [trades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number) => {
    return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return 'text-green-600';
    if (winRate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (trades.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            No trades available for distribution analysis.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time-based Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Hourly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.hourlyDistribution
                .filter(hour => hour.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map(hour => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-12">
                        {hour.hour.toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{hour.count} trades</span>
                          <span className={`text-sm font-medium ${getWinRateColor(hour.winRate)}`}>
                            {formatPercentage(hour.winRate)}
                          </span>
                        </div>
                        <Progress value={hour.winRate} className="h-1 mt-1" />
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${getPerformanceColor(hour.avgPnL)}`}>
                      {formatCurrency(hour.avgPnL)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Daily Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.dailyDistribution
                .filter(day => day.count > 0)
                .sort((a, b) => b.count - a.count)
                .map(day => (
                  <div key={day.day} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-20">
                        {day.dayName}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{day.count} trades</span>
                          <span className={`text-sm font-medium ${getWinRateColor(day.winRate)}`}>
                            {formatPercentage(day.winRate)}
                          </span>
                        </div>
                        <Progress value={day.winRate} className="h-1 mt-1" />
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${getPerformanceColor(day.avgPnL)}`}>
                      {formatCurrency(day.avgPnL)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Pair Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Currency Pair Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.pairPerformance.slice(0, 9).map(pair => (
              <div key={pair.pair} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{pair.pair}</span>
                  <Badge variant="outline" className="text-xs">
                    {pair.count} trades
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className={`font-medium ${getWinRateColor(pair.winRate)}`}>
                      {formatPercentage(pair.winRate)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg P&L:</span>
                    <span className={`font-medium ${getPerformanceColor(pair.avgPnL)}`}>
                      {formatCurrency(pair.avgPnL)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total P&L:</span>
                    <span className={`font-medium ${getPerformanceColor(pair.totalPnL)}`}>
                      {formatCurrency(pair.totalPnL)}
                    </span>
                  </div>
                  
                  <Progress value={pair.winRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Adherence Analysis */}
      {metrics.adherenceAnalysis.avgScore > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Strategy Adherence Analysis
              </div>
              <div className="text-sm font-normal">
                Avg: {formatPercentage(metrics.adherenceAnalysis.avgScore)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Adherence Distribution</h4>
                <div className="space-y-2">
                  {metrics.adherenceAnalysis.distribution
                    .filter(range => range.count > 0)
                    .map(range => (
                      <div key={range.range} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium w-16">
                            {range.range}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">{range.count} trades</span>
                              <span className={`text-sm font-medium ${getWinRateColor(range.winRate)}`}>
                                {formatPercentage(range.winRate)}
                              </span>
                            </div>
                            <Progress value={range.winRate} className="h-1 mt-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Adherence Impact</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Adherence-Performance Correlation:</span>
                    <span className={`font-medium ${
                      metrics.adherenceAnalysis.correlation > 0.3 ? 'text-green-600' :
                      metrics.adherenceAnalysis.correlation > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(metrics.adherenceAnalysis.correlation * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {metrics.adherenceAnalysis.correlation > 0.3 ? (
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Strong positive correlation - following strategy rules improves performance
                      </div>
                    ) : metrics.adherenceAnalysis.correlation > 0 ? (
                      <div className="flex items-center text-yellow-600">
                        <Activity className="w-4 h-4 mr-1" />
                        Weak positive correlation - strategy adherence shows some benefit
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        No clear correlation - strategy may need refinement
                      </div>
                    )}
                  </div>
                  
                  <Progress 
                    value={Math.abs(metrics.adherenceAnalysis.correlation) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TradeDistributionAnalysis;
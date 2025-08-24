/**
 * Performance Analytics Panel Component
 * Displays comprehensive performance metrics and visual indicators for trade review
 */

import React, { useMemo, useEffect, useState } from 'react';
import { Trade } from '../../types/trade';
import { PerformanceMetrics, TradeComparison } from '../../types/tradeReview';
import { cachedPerformanceAnalyticsService } from '../../lib/cachedPerformanceAnalyticsService';
import { usePerformanceMonitor } from '../../lib/performanceOptimization';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TrendingUp, TrendingDown, Clock, Target, Zap, BarChart3 } from 'lucide-react';
import { PerformanceIndicator } from './PerformanceIndicator';

interface PerformanceAnalyticsPanelProps {
  trade: Trade;
  similarTrades: Trade[];
  benchmarkData?: PerformanceMetrics;
  showComparisons?: boolean;
}

export const PerformanceAnalyticsPanel: React.FC<PerformanceAnalyticsPanelProps> = ({
  trade,
  similarTrades,
  benchmarkData,
  showComparisons = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { renderTime } = usePerformanceMonitor('PerformanceAnalyticsPanel');

  const metrics = useMemo(() => {
    setIsLoading(true);
    const result = cachedPerformanceAnalyticsService.calculateMetrics(trade);
    setIsLoading(false);
    return result;
  }, [trade]);
  
  const comparison = useMemo(() => {
    if (similarTrades.length === 0) return null;
    setIsLoading(true);
    const result = cachedPerformanceAnalyticsService.compareWithSimilar(trade, similarTrades);
    setIsLoading(false);
    return result;
  }, [trade, similarTrades]);

  const insights = useMemo(() => {
    if (!comparison) return [];
    return cachedPerformanceAnalyticsService.generateInsights(trade, comparison);
  }, [trade, comparison]);

  // Preload similar trades metrics in the background
  useEffect(() => {
    if (similarTrades.length > 0) {
      cachedPerformanceAnalyticsService.preloadMetrics(similarTrades);
    }
  }, [similarTrades]);

  const formatDuration = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Calculating metrics...</span>
        </div>
      )}

      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && renderTime > 16 && (
        <div className="text-xs text-orange-600 mb-2">
          Slow render detected: {renderTime.toFixed(2)}ms
        </div>
      )}

      {/* Core Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* R-Multiple */}
            <PerformanceIndicator
              label="R-Multiple"
              value={metrics.rMultiple}
              format="number"
              thresholds={{ good: 1, excellent: 2 }}
              showProgress
            />

            {/* Return Percentage */}
            <PerformanceIndicator
              label="Return"
              value={metrics.returnPercentage}
              format="percentage"
              showTrend
            />

            {/* Risk-Reward Ratio */}
            <PerformanceIndicator
              label="Risk:Reward"
              value={metrics.riskRewardRatio}
              format="ratio"
              thresholds={{ good: 1.5, excellent: 2 }}
            />

            {/* Hold Duration */}
            <PerformanceIndicator
              label="Hold Time"
              value={metrics.holdDuration}
              format="duration"
            />

            {/* Efficiency */}
            <PerformanceIndicator
              label="Efficiency"
              value={metrics.efficiency * 100}
              format="percentage"
              thresholds={{ good: 60, excellent: 80 }}
              showProgress
            />

            {/* Additional Metrics */}
            {metrics.sharpeRatio && (
              <PerformanceIndicator
                label="Sharpe Ratio"
                value={metrics.sharpeRatio}
                format="number"
                thresholds={{ good: 1, excellent: 1.5 }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Comparison */}
      {showComparisons && comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Percentile Rank */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Percentile Rank</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {comparison.percentileRank.toFixed(0)}th
                  </span>
                  <span className="text-sm text-gray-600">percentile</span>
                </div>
              </div>

              {/* Comparison Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Your Trade</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>R-Multiple:</span>
                      <span className="font-medium">{metrics.rMultiple.toFixed(2)}R</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span className="font-medium">{(metrics.efficiency * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hold Time:</span>
                      <span className="font-medium">{formatDuration(metrics.holdDuration)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Similar Trades Average</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>R-Multiple:</span>
                      <span className="font-medium">{comparison.averagePerformance.rMultiple.toFixed(2)}R</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span className="font-medium">{(comparison.averagePerformance.efficiency * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hold Time:</span>
                      <span className="font-medium">{formatDuration(comparison.averagePerformance.holdDuration)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outperformance Factors */}
              {comparison.outperformanceFactors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800">Outperformance Factors</h4>
                  <div className="flex flex-wrap gap-2">
                    {comparison.outperformanceFactors.map((factor, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {comparison.improvementSuggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-800">Improvement Suggestions</h4>
                  <ul className="space-y-1 text-sm">
                    {comparison.improvementSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Trades Summary */}
      {similarTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Similar Trades ({similarTrades.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Found {similarTrades.length} similar trades based on currency pair, strategy, 
                timeframe, and market conditions.
              </p>
              {comparison && (
                <p>
                  Your trade performed better than {comparison.percentileRank.toFixed(0)}% of similar trades.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
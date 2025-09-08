/**
 * EmotionalTrendChart Component
 * 
 * Visualizes emotional trends and patterns over time.
 * Shows correlations between emotional states and trading performance.
 */

import React, { useMemo } from 'react';
import { EmotionalState, JournalEntry } from '../../types/journal';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmotionalTrendData {
  date: string;
  confidence: number;
  anxiety: number;
  satisfaction: number;
  discipline: number;
  dailyPnL: number;
  processScore: number;
  overallMood: string;
}

interface EmotionalTrendChartProps {
  journalEntries: JournalEntry[];
  timeframe?: 'week' | 'month' | 'quarter';
  showCorrelations?: boolean;
  className?: string;
}

export const EmotionalTrendChart: React.FC<EmotionalTrendChartProps> = ({
  journalEntries,
  timeframe = 'month',
  showCorrelations = true,
  className = ''
}) => {
  // Process journal entries into trend data
  const trendData = useMemo(() => {
    const now = new Date();
    const daysBack = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    return journalEntries
      .filter(entry => new Date(entry.date) >= startDate)
      .map(entry => ({
        date: entry.date,
        confidence: entry.emotionalState.preMarket.confidence,
        anxiety: entry.emotionalState.preMarket.anxiety,
        satisfaction: entry.emotionalState.postMarket.satisfaction,
        discipline: entry.emotionalState.duringTrading.discipline,
        dailyPnL: entry.dailyPnL,
        processScore: entry.processMetrics.processScore,
        overallMood: entry.emotionalState.overallMood
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [journalEntries, timeframe]);

  // Calculate emotional averages and trends
  const emotionalStats = useMemo(() => {
    if (trendData.length === 0) return null;

    const recent = trendData.slice(-7); // Last 7 entries
    const previous = trendData.slice(-14, -7); // Previous 7 entries

    const calculateAverage = (data: EmotionalTrendData[], field: keyof EmotionalTrendData) => {
      const values = data.map(d => d[field] as number).filter(v => v > 0);
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    };

    const recentAvg = {
      confidence: calculateAverage(recent, 'confidence'),
      anxiety: calculateAverage(recent, 'anxiety'),
      satisfaction: calculateAverage(recent, 'satisfaction'),
      discipline: calculateAverage(recent, 'discipline')
    };

    const previousAvg = {
      confidence: calculateAverage(previous, 'confidence'),
      anxiety: calculateAverage(previous, 'anxiety'),
      satisfaction: calculateAverage(previous, 'satisfaction'),
      discipline: calculateAverage(previous, 'discipline')
    };

    const getTrend = (current: number, prev: number) => {
      if (prev === 0) return 'stable';
      const change = ((current - prev) / prev) * 100;
      if (change > 5) return 'improving';
      if (change < -5) return 'declining';
      return 'stable';
    };

    return {
      current: recentAvg,
      trends: {
        confidence: getTrend(recentAvg.confidence, previousAvg.confidence),
        anxiety: getTrend(recentAvg.anxiety, previousAvg.anxiety),
        satisfaction: getTrend(recentAvg.satisfaction, previousAvg.satisfaction),
        discipline: getTrend(recentAvg.discipline, previousAvg.discipline)
      }
    };
  }, [trendData]);

  // Calculate correlations between emotions and performance
  const correlations = useMemo(() => {
    if (!showCorrelations || trendData.length < 5) return null;

    const calculateCorrelation = (x: number[], y: number[]) => {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

      return denominator === 0 ? 0 : numerator / denominator;
    };

    const validEntries = trendData.filter(d => d.processScore > 0);
    if (validEntries.length < 3) return null;

    const confidence = validEntries.map(d => d.confidence);
    const discipline = validEntries.map(d => d.discipline);
    const satisfaction = validEntries.map(d => d.satisfaction);
    const processScores = validEntries.map(d => d.processScore);

    return {
      confidenceToPerformance: calculateCorrelation(confidence, processScores),
      disciplineToPerformance: calculateCorrelation(discipline, processScores),
      satisfactionToPerformance: calculateCorrelation(satisfaction, processScores)
    };
  }, [trendData, showCorrelations]);

  // Render trend indicator
  const renderTrendIndicator = (trend: string, value: number) => {
    const trendConfig = {
      improving: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-100' },
      declining: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-100' },
      stable: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-100' }
    };

    const config = trendConfig[trend as keyof typeof trendConfig];
    const Icon = config.icon;

    return (
      <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full', config.bg)}>
        <Icon className={cn('w-3 h-3', config.color)} />
        <span className={cn('text-xs font-medium', config.color)}>
          {value.toFixed(1)}
        </span>
      </div>
    );
  };

  // Render correlation badge
  const renderCorrelationBadge = (correlation: number, label: string) => {
    const getCorrelationStrength = (corr: number) => {
      const abs = Math.abs(corr);
      if (abs >= 0.7) return { strength: 'Strong', color: 'bg-green-100 text-green-800' };
      if (abs >= 0.4) return { strength: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
      if (abs >= 0.2) return { strength: 'Weak', color: 'bg-orange-100 text-orange-800' };
      return { strength: 'None', color: 'bg-gray-100 text-gray-800' };
    };

    const { strength, color } = getCorrelationStrength(correlation);
    const direction = correlation > 0 ? 'Positive' : correlation < 0 ? 'Negative' : 'No';

    return (
      <Badge variant="outline" className={cn('text-xs', color)}>
        {label}: {direction} {strength} ({correlation.toFixed(2)})
      </Badge>
    );
  };

  // Render mini chart bars
  const renderMiniChart = (data: number[], color: string) => {
    if (data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-0.5 h-8">
        {data.slice(-14).map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className={cn('w-1 rounded-t-sm', color)}
              style={{ height: `${Math.max(height, 10)}%` }}
              title={`${value.toFixed(1)}`}
            />
          );
        })}
      </div>
    );
  };

  if (trendData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No emotional data available for trend analysis</p>
            <p className="text-sm mt-1">Complete more journal entries to see trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Emotional Trends & Insights
          <Badge variant="outline" className="ml-auto">
            {timeframe === 'week' ? '7 days' : timeframe === 'month' ? '30 days' : '90 days'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Emotional Metrics Overview */}
        {emotionalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Confidence</span>
                {renderTrendIndicator(emotionalStats.trends.confidence, emotionalStats.current.confidence)}
              </div>
              {renderMiniChart(trendData.map(d => d.confidence), 'bg-blue-500')}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Discipline</span>
                {renderTrendIndicator(emotionalStats.trends.discipline, emotionalStats.current.discipline)}
              </div>
              {renderMiniChart(trendData.map(d => d.discipline), 'bg-green-500')}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Satisfaction</span>
                {renderTrendIndicator(emotionalStats.trends.satisfaction, emotionalStats.current.satisfaction)}
              </div>
              {renderMiniChart(trendData.map(d => d.satisfaction), 'bg-purple-500')}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Anxiety</span>
                {renderTrendIndicator(emotionalStats.trends.anxiety, emotionalStats.current.anxiety)}
              </div>
              {renderMiniChart(trendData.map(d => 6 - d.anxiety), 'bg-orange-500')}
            </div>
          </div>
        )}

        {/* Performance Correlations */}
        {correlations && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Emotion-Performance Correlations
            </h4>
            <div className="flex flex-wrap gap-2">
              {renderCorrelationBadge(correlations.confidenceToPerformance, 'Confidence')}
              {renderCorrelationBadge(correlations.disciplineToPerformance, 'Discipline')}
              {renderCorrelationBadge(correlations.satisfactionToPerformance, 'Satisfaction')}
            </div>
            <p className="text-xs text-gray-600">
              Correlations show how emotional states relate to your process scores. 
              Strong positive correlations indicate emotions that support good trading.
            </p>
          </div>
        )}

        {/* Recent Mood Pattern */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Recent Mood Pattern
          </h4>
          <div className="flex flex-wrap gap-1">
            {trendData.slice(-14).map((entry, index) => {
              const moodEmojis = {
                excited: '🚀',
                confident: '💪',
                calm: '😌',
                optimistic: '☀️',
                neutral: '😐',
                nervous: '😰',
                frustrated: '😤',
                disappointed: '😞',
                anxious: '😟',
                satisfied: '😊'
              };

              return (
                <div
                  key={index}
                  className="flex flex-col items-center p-1 rounded text-xs"
                  title={`${entry.date}: ${entry.overallMood}`}
                >
                  <span className="text-lg">
                    {moodEmojis[entry.overallMood as keyof typeof moodEmojis] || '😐'}
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    {new Date(entry.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Emotional Insights</h4>
          <div className="space-y-1 text-sm text-blue-800">
            {emotionalStats && (
              <>
                {emotionalStats.trends.confidence === 'improving' && (
                  <p>• Your confidence is trending upward - great progress!</p>
                )}
                {emotionalStats.trends.discipline === 'declining' && (
                  <p>• Consider focusing on discipline - it's been declining recently.</p>
                )}
                {emotionalStats.current.anxiety > 3.5 && (
                  <p>• Your anxiety levels are elevated - consider stress management techniques.</p>
                )}
              </>
            )}
            {correlations && (
              <>
                {correlations.disciplineToPerformance > 0.5 && (
                  <p>• Strong link between discipline and performance - keep focusing on process!</p>
                )}
                {correlations.confidenceToPerformance < -0.3 && (
                  <p>• Overconfidence may be hurting performance - stay humble and process-focused.</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionalTrendChart;
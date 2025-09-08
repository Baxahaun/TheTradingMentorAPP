import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Lightbulb,
  Minus
} from 'lucide-react';
import { ProcessTrend } from '../../services/JournalAnalyticsService';

interface ProcessScoreTrendingProps {
  processTrends: ProcessTrend[];
  dateRange: { start: string; end: string };
}

export const ProcessScoreTrending: React.FC<ProcessScoreTrendingProps> = ({
  processTrends,
  dateRange
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const getMetricDisplayName = (metric: string) => {
    const displayNames: Record<string, string> = {
      'planAdherence': 'Plan Adherence',
      'riskManagement': 'Risk Management',
      'entryTiming': 'Entry Timing',
      'exitTiming': 'Exit Timing',
      'overallDiscipline': 'Overall Discipline',
      'processScore': 'Process Score'
    };
    return displayNames[metric] || metric;
  };

  const getMetricIcon = (metric: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'planAdherence': <Target className="h-4 w-4" />,
      'riskManagement': <AlertTriangle className="h-4 w-4" />,
      'entryTiming': <TrendingUp className="h-4 w-4" />,
      'exitTiming': <TrendingDown className="h-4 w-4" />,
      'overallDiscipline': <Award className="h-4 w-4" />,
      'processScore': <BarChart3 className="h-4 w-4" />
    };
    return iconMap[metric] || <Target className="h-4 w-4" />;
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendations = (trend: ProcessTrend) => {
    const recommendations: Record<string, string[]> = {
      'planAdherence': {
        'improving': [
          'Excellent progress following your trading plan!',
          'Continue documenting what strategies work best for you',
          'Consider refining your plan based on successful patterns'
        ],
        'declining': [
          'Review your trading plan - is it realistic and actionable?',
          'Set smaller, more achievable daily goals',
          'Use pre-market checklists to reinforce plan adherence'
        ],
        'stable': [
          'Maintain consistency in following your plan',
          'Look for opportunities to optimize your strategy',
          'Document any deviations and their outcomes'
        ]
      },
      'riskManagement': {
        'improving': [
          'Great job managing risk effectively!',
          'Your position sizing discipline is paying off',
          'Continue using stop losses and risk limits'
        ],
        'declining': [
          'Review your risk management rules immediately',
          'Consider reducing position sizes until discipline improves',
          'Set hard limits and use alerts to enforce them'
        ],
        'stable': [
          'Maintain your current risk management approach',
          'Consider if your risk limits are appropriate for current market conditions',
          'Review and update your risk rules quarterly'
        ]
      },
      'entryTiming': {
        'improving': [
          'Your entry timing is getting better!',
          'Continue waiting for high-probability setups',
          'Document what makes a good entry for future reference'
        ],
        'declining': [
          'Slow down and wait for better entry signals',
          'Review your entry criteria - are they too loose?',
          'Practice patience and avoid FOMO trades'
        ],
        'stable': [
          'Maintain your current entry discipline',
          'Look for patterns in your best vs worst entries',
          'Consider refining your entry criteria'
        ]
      },
      'exitTiming': {
        'improving': [
          'Excellent improvement in exit timing!',
          'Your profit-taking discipline is developing well',
          'Continue following your exit rules consistently'
        ],
        'declining': [
          'Review your exit strategy - are you being too greedy or fearful?',
          'Set clear profit targets and stop losses before entering',
          'Practice taking profits at predetermined levels'
        ],
        'stable': [
          'Your exit timing is consistent',
          'Look for opportunities to optimize profit-taking',
          'Consider trailing stops for trending trades'
        ]
      },
      'overallDiscipline': {
        'improving': [
          'Outstanding improvement in trading discipline!',
          'Your consistent approach is building good habits',
          'Continue focusing on process over outcomes'
        ],
        'declining': [
          'Discipline is the foundation of successful trading',
          'Take a step back and reassess your trading approach',
          'Consider reducing trade frequency until discipline improves'
        ],
        'stable': [
          'Maintain your disciplined approach',
          'Look for areas where you can further improve consistency',
          'Regular self-assessment helps maintain discipline'
        ]
      },
      'processScore': {
        'improving': [
          'Your overall process is improving significantly!',
          'Focus on process quality over P&L outcomes',
          'Document what changes are driving improvement'
        ],
        'declining': [
          'Your process needs attention across multiple areas',
          'Consider taking a break to reassess your approach',
          'Focus on one process improvement at a time'
        ],
        'stable': [
          'Your process consistency is good',
          'Look for incremental improvements in weak areas',
          'Maintain focus on process over profits'
        ]
      }
    };

    return recommendations[trend.metric]?.[trend.trend] || ['Continue monitoring this metric closely'];
  };

  const selectedTrend = selectedMetric ? 
    processTrends.find(t => t.metric === selectedMetric) : null;

  if (processTrends.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Process Data</h3>
            <p className="text-gray-600">
              Start tracking your process metrics in your daily journal entries to see trends and improvements.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const improvingTrends = processTrends.filter(t => t.trend === 'improving');
  const decliningTrends = processTrends.filter(t => t.trend === 'declining');
  const stableTrends = processTrends.filter(t => t.trend === 'stable');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Process Score Trending</h2>
          <p className="text-gray-600">Track your trading discipline and process improvements</p>
        </div>
        <Badge variant="outline">
          {processTrends.length} metrics tracked
        </Badge>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Improving</p>
                <p className="text-2xl font-bold text-green-600">
                  {improvingTrends.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Declining</p>
                <p className="text-2xl font-bold text-red-600">
                  {decliningTrends.length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stable</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stableTrends.length}
                </p>
              </div>
              <Minus className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Process Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processTrends.map((trend) => (
                <div
                  key={trend.metric}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedMetric === trend.metric 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMetric(
                    selectedMetric === trend.metric ? null : trend.metric
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-600">
                        {getMetricIcon(trend.metric)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getMetricDisplayName(trend.metric)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Current: {trend.currentValue.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(trend.trend)}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTrendColor(trend.trend)}`}
                      >
                        {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Weekly Avg</p>
                      <p className={`font-medium ${getScoreColor(trend.weeklyAverage)}`}>
                        {trend.weeklyAverage.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Monthly Avg</p>
                      <p className={`font-medium ${getScoreColor(trend.monthlyAverage)}`}>
                        {trend.monthlyAverage.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Score Progress</span>
                      <span>{trend.currentValue.toFixed(1)}/5.0</span>
                    </div>
                    <Progress value={(trend.currentValue / 5) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Metric Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              {selectedTrend ? `${getMetricDisplayName(selectedTrend.metric)} Analysis` : 'Metric Analysis'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrend ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600">
                    {getMetricIcon(selectedTrend.metric)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {getMetricDisplayName(selectedTrend.metric)}
                    </h3>
                    <p className="text-gray-600">
                      {selectedTrend.trend} trend • {selectedTrend.changePercentage > 0 ? '+' : ''}{selectedTrend.changePercentage.toFixed(1)}% change
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Current</p>
                    <p className={`text-lg font-bold ${getScoreColor(selectedTrend.currentValue)}`}>
                      {selectedTrend.currentValue.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Weekly</p>
                    <p className={`text-lg font-bold ${getScoreColor(selectedTrend.weeklyAverage)}`}>
                      {selectedTrend.weeklyAverage.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Monthly</p>
                    <p className={`text-lg font-bold ${getScoreColor(selectedTrend.monthlyAverage)}`}>
                      {selectedTrend.monthlyAverage.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {getRecommendations(selectedTrend).map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${getTrendColor(selectedTrend.trend)}`}>
                  <h4 className="font-medium mb-1">Trend Analysis</h4>
                  <p className="text-sm">
                    {selectedTrend.trend === 'improving' ? (
                      `Excellent progress! Your ${getMetricDisplayName(selectedTrend.metric).toLowerCase()} has improved by ${selectedTrend.changePercentage.toFixed(1)}% recently.`
                    ) : selectedTrend.trend === 'declining' ? (
                      `This metric needs attention. Consider focusing on improving your ${getMetricDisplayName(selectedTrend.metric).toLowerCase()}.`
                    ) : (
                      `Your ${getMetricDisplayName(selectedTrend.metric).toLowerCase()} is stable. Look for opportunities to make incremental improvements.`
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Click on a process metric to see detailed analysis and improvement recommendations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Process Improvement Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Process Improvement Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Daily Habits</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Review your trading plan before market open</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Set clear risk limits for each trade</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Rate your process adherence after each trade</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Complete daily journal reflection</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Weekly Review</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Analyze process score trends and patterns</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Identify your strongest and weakest metrics</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Set specific improvement goals for the next week</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Celebrate process improvements, not just profits</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessScoreTrending;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Lightbulb,
  BarChart3,
  Filter,
  Minus
} from 'lucide-react';
import { EmotionalPattern } from '../../services/JournalAnalyticsService';

interface EmotionalPatternAnalysisProps {
  emotionalPatterns: EmotionalPattern[];
  dateRange: { start: string; end: string };
}

export const EmotionalPatternAnalysis: React.FC<EmotionalPatternAnalysisProps> = ({
  emotionalPatterns,
  dateRange
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'correlation' | 'frequency' | 'performance'>('correlation');

  const getEmotionColor = (emotion: string) => {
    const colorMap: Record<string, string> = {
      'confident': 'bg-blue-500',
      'calm': 'bg-green-500',
      'excited': 'bg-yellow-500',
      'nervous': 'bg-orange-500',
      'frustrated': 'bg-red-500',
      'satisfied': 'bg-purple-500',
      'disappointed': 'bg-gray-500',
      'neutral': 'bg-gray-400'
    };
    return colorMap[emotion] || 'bg-gray-500';
  };

  const getEmotionIcon = (emotion: string) => {
    const iconMap: Record<string, string> = {
      'confident': '😎',
      'calm': '😌',
      'excited': '🤩',
      'nervous': '😰',
      'frustrated': '😤',
      'satisfied': '😊',
      'disappointed': '😞',
      'neutral': '😐'
    };
    return iconMap[emotion] || '🤔';
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

  const getCorrelationStrength = (strength: number) => {
    if (strength >= 0.7) return { label: 'Very Strong', color: 'text-red-600' };
    if (strength >= 0.5) return { label: 'Strong', color: 'text-orange-600' };
    if (strength >= 0.3) return { label: 'Moderate', color: 'text-yellow-600' };
    if (strength >= 0.1) return { label: 'Weak', color: 'text-blue-600' };
    return { label: 'Very Weak', color: 'text-gray-600' };
  };

  const sortedPatterns = [...emotionalPatterns].sort((a, b) => {
    switch (sortBy) {
      case 'correlation':
        return b.correlationStrength - a.correlationStrength;
      case 'frequency':
        return b.frequency - a.frequency;
      case 'performance':
        return b.averageProcessScore - a.averageProcessScore;
      default:
        return 0;
    }
  });

  const selectedPattern = selectedEmotion ? 
    emotionalPatterns.find(p => p.emotion === selectedEmotion) : null;

  if (emotionalPatterns.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Emotional Data</h3>
            <p className="text-gray-600">
              Start tracking your emotions in your daily journal entries to see patterns and correlations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Emotional Pattern Analysis</h2>
          <p className="text-gray-600">Understand how your emotions correlate with trading performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="correlation">Sort by Correlation</option>
            <option value="frequency">Sort by Frequency</option>
            <option value="performance">Sort by Performance</option>
          </select>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Strongest Correlation</p>
                <p className="text-lg font-bold text-blue-600">
                  {sortedPatterns[0]?.emotion || 'None'}
                </p>
                <p className="text-xs text-gray-500">
                  {sortedPatterns[0] ? `${(sortedPatterns[0].correlationStrength * 100).toFixed(0)}%` : '0%'}
                </p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Frequent</p>
                <p className="text-lg font-bold text-green-600">
                  {[...emotionalPatterns].sort((a, b) => b.frequency - a.frequency)[0]?.emotion || 'None'}
                </p>
                <p className="text-xs text-gray-500">
                  {[...emotionalPatterns].sort((a, b) => b.frequency - a.frequency)[0]?.frequency || 0} times
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Performance</p>
                <p className="text-lg font-bold text-purple-600">
                  {[...emotionalPatterns].sort((a, b) => b.averageProcessScore - a.averageProcessScore)[0]?.emotion || 'None'}
                </p>
                <p className="text-xs text-gray-500">
                  {[...emotionalPatterns].sort((a, b) => b.averageProcessScore - a.averageProcessScore)[0]?.averageProcessScore.toFixed(1) || '0'} avg score
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emotional Patterns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Emotional Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedPatterns.map((pattern) => {
                const correlation = getCorrelationStrength(pattern.correlationStrength);
                return (
                  <div
                    key={pattern.emotion}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedEmotion === pattern.emotion 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEmotion(
                      selectedEmotion === pattern.emotion ? null : pattern.emotion
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full ${getEmotionColor(pattern.emotion)} flex items-center justify-center text-white text-sm`}>
                          {getEmotionIcon(pattern.emotion)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {pattern.emotion}
                          </p>
                          <p className="text-sm text-gray-600">
                            {pattern.frequency} occurrences
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${correlation.color}`}
                        >
                          {correlation.label}
                        </Badge>
                        {getTrendIcon(pattern.trend)}
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Avg Process Score</p>
                        <p className="font-medium">{pattern.averageProcessScore.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg P&L</p>
                        <p className={`font-medium ${pattern.averagePnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${pattern.averagePnL.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Correlation Strength</span>
                        <span>{(pattern.correlationStrength * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={pattern.correlationStrength * 100} className="h-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Pattern Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              {selectedPattern ? `${selectedPattern.emotion} Analysis` : 'Pattern Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPattern ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full ${getEmotionColor(selectedPattern.emotion)} flex items-center justify-center text-white text-lg`}>
                    {getEmotionIcon(selectedPattern.emotion)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold capitalize">{selectedPattern.emotion}</h3>
                    <p className="text-gray-600">
                      {selectedPattern.frequency} occurrences • {selectedPattern.trend} trend
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Process Score</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedPattern.averageProcessScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average P&L</p>
                    <p className={`text-xl font-bold ${selectedPattern.averagePnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${selectedPattern.averagePnL.toFixed(0)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {selectedPattern.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Correlation Insight</h4>
                  <p className="text-sm text-blue-800">
                    {selectedPattern.correlationStrength > 0.3 ? (
                      `Strong correlation detected. Your ${selectedPattern.emotion} state significantly impacts your trading performance.`
                    ) : selectedPattern.correlationStrength > 0.1 ? (
                      `Moderate correlation. Your ${selectedPattern.emotion} state may influence your trading.`
                    ) : (
                      `Weak correlation. Your ${selectedPattern.emotion} state doesn't strongly impact performance.`
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Click on an emotional pattern to see detailed analysis and recommendations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emotional Management Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Emotional Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pre-Trading Preparation</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Practice mindfulness or meditation before trading sessions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Review your trading plan to build confidence</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Set realistic expectations for the trading day</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Use breathing exercises to manage anxiety</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">During Trading</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Take breaks between trades to reset emotionally</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Stick to your predetermined risk limits</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Use quick journal notes to track emotional shifts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Step away if emotions become overwhelming</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionalPatternAnalysis;
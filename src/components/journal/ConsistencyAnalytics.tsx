import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  Award, 
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ConsistencyMetrics } from '../../services/JournalAnalyticsService';

interface ConsistencyAnalyticsProps {
  consistencyMetrics: ConsistencyMetrics;
  dateRange: { start: string; end: string };
}

export const ConsistencyAnalytics: React.FC<ConsistencyAnalyticsProps> = ({
  consistencyMetrics,
  dateRange
}) => {
  const getStreakBadgeColor = (streak: number) => {
    if (streak >= 30) return 'bg-purple-500';
    if (streak >= 14) return 'bg-blue-500';
    if (streak >= 7) return 'bg-green-500';
    if (streak >= 3) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Journaling Consistency</h2>
          <p className="text-gray-600">Track your journaling habits and streaks</p>
        </div>
        <Badge variant="outline">
          {formatDateRange(dateRange.start, dateRange.end)}
        </Badge>
      </div>

      {/* Current Streak Highlight */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${getStreakBadgeColor(consistencyMetrics.currentStreak)} text-white`}>
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {consistencyMetrics.currentStreak} Days
                </h3>
                <p className="text-gray-600">Current Journaling Streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Personal Best</p>
              <p className="text-lg font-semibold text-gray-900">
                {consistencyMetrics.longestStreak} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {consistencyMetrics.totalEntries}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className={`text-2xl font-bold ${getCompletionRateColor(consistencyMetrics.completionRate)}`}>
                  {consistencyMetrics.completionRate}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Consistency</p>
                <p className="text-2xl font-bold text-purple-600">
                  {consistencyMetrics.weeklyConsistency}%
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Consistency</p>
                <p className="text-2xl font-bold text-orange-600">
                  {consistencyMetrics.monthlyConsistency}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>This Week</span>
                  <span>{consistencyMetrics.weeklyConsistency}%</span>
                </div>
                <Progress value={consistencyMetrics.weeklyConsistency} className="h-2" />
              </div>
              <div className="text-xs text-gray-600">
                {consistencyMetrics.weeklyConsistency >= 80 ? (
                  <span className="text-green-600">Excellent weekly consistency!</span>
                ) : consistencyMetrics.weeklyConsistency >= 60 ? (
                  <span className="text-yellow-600">Good progress, aim for daily entries</span>
                ) : (
                  <span className="text-red-600">Try to journal more consistently this week</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>This Month</span>
                  <span>{consistencyMetrics.monthlyConsistency}%</span>
                </div>
                <Progress value={consistencyMetrics.monthlyConsistency} className="h-2" />
              </div>
              <div className="text-xs text-gray-600">
                {consistencyMetrics.monthlyConsistency >= 80 ? (
                  <span className="text-green-600">Outstanding monthly consistency!</span>
                ) : consistencyMetrics.monthlyConsistency >= 60 ? (
                  <span className="text-yellow-600">Solid monthly progress</span>
                ) : (
                  <span className="text-red-600">Focus on building a daily habit</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak History */}
      {consistencyMetrics.streakHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Streak History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consistencyMetrics.streakHistory
                .sort((a, b) => b.length - a.length)
                .slice(0, 5)
                .map((streak, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStreakBadgeColor(streak.length)}`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {streak.length} day{streak.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(streak.startDate).toLocaleDateString()} - {new Date(streak.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {index === 0 && streak.length === consistencyMetrics.longestStreak && (
                      <Badge variant="secondary" className="text-xs">
                        Personal Best
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
            {consistencyMetrics.streakHistory.length > 5 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                Showing top 5 streaks of {consistencyMetrics.streakHistory.length} total
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Consistency Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consistency Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Building Habits</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Set a specific time each day for journaling</li>
                <li>• Start with just 5 minutes if you're busy</li>
                <li>• Use templates to make journaling faster</li>
                <li>• Link journaling to an existing habit</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Maintaining Streaks</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Don't break the chain - even short entries count</li>
                <li>• Use mobile quick-add for busy days</li>
                <li>• Review your progress weekly</li>
                <li>• Celebrate milestone streaks</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsistencyAnalytics;
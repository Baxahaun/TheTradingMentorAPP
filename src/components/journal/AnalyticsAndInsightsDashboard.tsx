import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Brain, 
  Target, 
  Lightbulb,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { JournalAnalyticsService, AnalyticsData } from '../../services/JournalAnalyticsService';
import { ConsistencyAnalytics } from './ConsistencyAnalytics';
import { EmotionalPatternAnalysis } from './EmotionalPatternAnalysis';
import { ProcessScoreTrending } from './ProcessScoreTrending';
import { PersonalizedInsights } from './PersonalizedInsights';
import { useAuth } from '../../contexts/AuthContext';

interface AnalyticsAndInsightsDashboardProps {
  className?: string;
}

export const AnalyticsAndInsightsDashboard: React.FC<AnalyticsAndInsightsDashboardProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');

  const analyticsService = new JournalAnalyticsService();

  useEffect(() => {
    if (user?.uid) {
      loadAnalyticsData();
    }
  }, [user?.uid, dateRange]);

  const loadAnalyticsData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAnalyticsData(user.uid, dateRange);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleDateRangeChange = (range: { start: string; end: string }) => {
    setDateRange(range);
  };

  const handleExportData = async () => {
    if (!analyticsData) return;

    try {
      const dataToExport = {
        ...analyticsData,
        exportedAt: new Date().toISOString(),
        dateRange
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-analytics-${dateRange.start}-to-${dateRange.end}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting analytics data:', err);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${className}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`p-8 ${className}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">No analytics data available.</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { consistencyMetrics, emotionalPatterns, processTrends, personalizedInsights } = analyticsData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600">
            Comprehensive analysis of your journaling patterns and trading performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange({ ...dateRange, start: e.target.value })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange({ ...dateRange, end: e.target.value })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            <Badge variant="secondary">
              {analyticsData.lastUpdated ? 
                `Updated ${new Date(analyticsData.lastUpdated).toLocaleDateString()}` : 
                'Never updated'
              }
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-blue-600">
                  {consistencyMetrics.currentStreak} days
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">
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
                <p className="text-sm font-medium text-gray-600">Emotional Patterns</p>
                <p className="text-2xl font-bold text-purple-600">
                  {emotionalPatterns.length}
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Insights</p>
                <p className="text-2xl font-bold text-orange-600">
                  {personalizedInsights.length}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Insights - Always Visible */}
      {personalizedInsights.length > 0 && (
        <PersonalizedInsights insights={personalizedInsights} />
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consistency">Consistency</TabsTrigger>
          <TabsTrigger value="emotions">Emotions</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Process Trends Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processTrends.slice(0, 3).map((trend) => (
                    <div key={trend.metric} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {trend.metric.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {trend.currentValue.toFixed(2)}
                        </span>
                        {trend.trend === 'improving' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : trend.trend === 'declining' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <div className="h-4 w-4 bg-gray-300 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Top Emotional Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emotionalPatterns.slice(0, 3).map((pattern) => (
                    <div key={pattern.emotion} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {pattern.emotion}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={pattern.correlationStrength > 0.3 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {(pattern.correlationStrength * 100).toFixed(0)}% correlation
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consistency">
          <ConsistencyAnalytics 
            consistencyMetrics={consistencyMetrics}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="emotions">
          <EmotionalPatternAnalysis 
            emotionalPatterns={emotionalPatterns}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="process">
          <ProcessScoreTrending 
            processTrends={processTrends}
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsAndInsightsDashboard;
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Hash, 
  Target,
  Award,
  AlertTriangle,
  Calendar,
  Zap,
  Activity,
  PieChart,
  LineChart,
  Users
} from 'lucide-react';
import { Trade } from '../../types/trade';
import { tagAnalyticsService, TagAnalyticsData, TagPerformanceMetrics } from '../../lib/tagAnalyticsService';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TagAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  onTagClick?: (tag: string) => void;
}

export const TagAnalyticsDashboard: React.FC<TagAnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  trades,
  onTagClick
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Calculate analytics data
  const analyticsData = useMemo((): TagAnalyticsData => {
    try {
      return tagAnalyticsService.calculateTagAnalytics(trades);
    } catch (error) {
      console.error('Error calculating tag analytics:', error);
      return {
        totalTags: 0,
        averageTagsPerTrade: 0,
        mostUsedTags: [],
        leastUsedTags: [],
        recentTags: [],
        tagPerformance: [],
        topPerformingTags: [],
        worstPerformingTags: [],
        tagUsageOverTime: [],
        tagCorrelations: []
      };
    }
  }, [trades]);

  // Get insights and recommendations
  const insights = useMemo(() => {
    try {
      return tagAnalyticsService.getTagInsights(trades);
    } catch (error) {
      console.error('Error getting tag insights:', error);
      return { insights: [], recommendations: [], warnings: [] };
    }
  }, [trades]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage values
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get performance color
  const getPerformanceColor = (value: number, isPercentage: boolean = false) => {
    if (isPercentage) {
      if (value >= 60) return 'text-green-600';
      if (value >= 50) return 'text-blue-600';
      if (value >= 40) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value > 0) return 'text-green-600';
      if (value === 0) return 'text-gray-600';
      return 'text-red-600';
    }
  };

  // Handle tag click
  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
      onClose();
    }
  };

  // Render tag performance card
  const renderTagPerformanceCard = (tagMetrics: TagPerformanceMetrics, rank?: number) => (
    <Card key={tagMetrics.tag} className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleTagClick(tagMetrics.tag)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {rank && (
              <Badge variant={rank <= 3 ? 'default' : 'secondary'} className="text-xs">
                #{rank}
              </Badge>
            )}
            <Badge variant="outline" className="font-mono">
              {tagMetrics.tag}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {tagMetrics.totalTrades} trades
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Win Rate</div>
            <div className={cn("font-semibold", getPerformanceColor(tagMetrics.winRate, true))}>
              {formatPercentage(tagMetrics.winRate)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg P&L</div>
            <div className={cn("font-semibold", getPerformanceColor(tagMetrics.averagePnL))}>
              {formatCurrency(tagMetrics.averagePnL)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Total P&L</div>
            <div className={cn("font-semibold", getPerformanceColor(tagMetrics.totalPnL))}>
              {formatCurrency(tagMetrics.totalPnL)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Profit Factor</div>
            <div className={cn("font-semibold", getPerformanceColor(tagMetrics.profitFactor - 1))}>
              {tagMetrics.profitFactor === Infinity ? '∞' : tagMetrics.profitFactor.toFixed(2)}
            </div>
          </div>
        </div>

        {tagMetrics.totalTrades >= 5 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sharpe: {tagMetrics.sharpeRatio.toFixed(2)}</span>
              <span>Consistency: {formatPercentage(tagMetrics.consistency)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tag Analytics Dashboard
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="overview" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-1">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">Total Tags</div>
                        </div>
                        <div className="text-2xl font-bold">{analyticsData.totalTags}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">Avg Tags/Trade</div>
                        </div>
                        <div className="text-2xl font-bold">
                          {analyticsData.averageTagsPerTrade.toFixed(1)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <div className="text-sm text-muted-foreground">Best Win Rate</div>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {analyticsData.topPerformingTags[0] 
                            ? formatPercentage(analyticsData.topPerformingTags[0].winRate)
                            : 'N/A'
                          }
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-blue-600" />
                          <div className="text-sm text-muted-foreground">Best Total P&L</div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {analyticsData.topPerformingTags[0] 
                            ? formatCurrency(analyticsData.topPerformingTags[0].totalPnL)
                            : 'N/A'
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Most Used Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Most Used Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyticsData.mostUsedTags.slice(0, 5).map((tag, index) => (
                          <div key={tag.tag} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="cursor-pointer hover:bg-secondary/80"
                                     onClick={() => handleTagClick(tag.tag)}>
                                {tag.tag}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {tag.count} trades
                              </span>
                            </div>
                            <Progress 
                              value={(tag.count / analyticsData.mostUsedTags[0].count) * 100} 
                              className="w-24"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Recently Used Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analyticsData.recentTags.slice(0, 10).map((tag) => (
                          <Badge 
                            key={tag.tag} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => handleTagClick(tag.tag)}
                          >
                            {tag.tag}
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({tag.count})
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="performance" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-1">
                  {/* Top Performing Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Top Performing Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analyticsData.topPerformingTags.slice(0, 6).map((tag, index) => 
                          renderTagPerformanceCard(tag, index + 1)
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Worst Performing Tags */}
                  {analyticsData.worstPerformingTags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          Needs Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {analyticsData.worstPerformingTags.slice(0, 4).map((tag) => 
                            renderTagPerformanceCard(tag)
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="usage" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-1">
                  {/* Tag Usage Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-4 w-4" />
                        Tag Usage Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.tagUsageOverTime.length > 0 ? (
                        <div className="space-y-4">
                          {analyticsData.tagUsageOverTime.slice(-6).map((period) => (
                            <div key={period.period}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{period.period}</span>
                                <span className="text-sm text-muted-foreground">
                                  {period.totalTrades} trades
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(period.tagCounts)
                                  .sort(([,a], [,b]) => b - a)
                                  .slice(0, 8)
                                  .map(([tag, count]) => (
                                    <Badge 
                                      key={tag} 
                                      variant="outline" 
                                      className="text-xs cursor-pointer hover:bg-secondary/80"
                                      onClick={() => handleTagClick(tag)}
                                    >
                                      {tag} ({count})
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No usage data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tag Correlations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Tag Correlations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.tagCorrelations.length > 0 ? (
                        <div className="space-y-3">
                          {analyticsData.tagCorrelations
                            .filter(corr => Math.abs(corr.correlation) > 0.3)
                            .slice(0, 8)
                            .map((corr) => (
                              <div key={`${corr.tag1}-${corr.tag2}`} 
                                   className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="cursor-pointer hover:bg-secondary/80"
                                         onClick={() => handleTagClick(corr.tag1)}>
                                    {corr.tag1}
                                  </Badge>
                                  <span className="text-muted-foreground">+</span>
                                  <Badge variant="outline" className="cursor-pointer hover:bg-secondary/80"
                                         onClick={() => handleTagClick(corr.tag2)}>
                                    {corr.tag2}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {corr.bothTagsCount} co-occurrences
                                  </span>
                                  <Badge variant={corr.correlation > 0 ? 'default' : 'destructive'}>
                                    {(corr.correlation * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No significant correlations found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-1">
                  {/* Insights */}
                  {insights.insights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-600" />
                          Key Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {insights.insights.map((insight, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                              <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {insights.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {insights.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Warnings */}
                  {insights.warnings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {insights.warnings.map((warning, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{warning}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* No insights available */}
                  {insights.insights.length === 0 && insights.recommendations.length === 0 && insights.warnings.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          Not enough data for insights
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Add more tagged trades to get personalized insights and recommendations.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
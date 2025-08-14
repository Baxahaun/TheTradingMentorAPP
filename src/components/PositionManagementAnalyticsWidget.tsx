import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TrendingUp, BarChart3, Filter, Target, Clock, TrendingDown, Activity } from 'lucide-react';
import { ChartContainer, ChartTooltip } from './ui/chart';
import { Trade } from '../types/trade';
import { positionManagementService } from '../lib/positionManagementService';

interface PositionManagementAnalyticsWidgetProps {
  trades: Trade[];
  size?: { w: number; h: number };
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

const PositionManagementAnalyticsWidget: React.FC<PositionManagementAnalyticsWidgetProps> = ({ trades, size }) => {
  const [selectedView, setSelectedView] = useState<'timeline' | 'efficiency' | 'optimization'>('timeline');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');

  // Filter trades based on selections
  const filteredTrades = useMemo(() => {
    let filtered = trades.filter(trade => 
      trade.status === 'closed' && 
      trade.partialCloses && 
      trade.partialCloses.length > 0
    );

    // Filter by timeframe
    if (selectedTimeframe !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (selectedTimeframe) {
        case '1m':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3m':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(trade => new Date(trade.date) >= cutoffDate);
    }

    return filtered;
  }, [trades, selectedTimeframe]);

  // Get individual trade for timeline view
  const selectedTradeData = useMemo(() => {
    if (selectedTrade === 'all') return null;
    return trades.find(trade => trade.id === selectedTrade);
  }, [trades, selectedTrade]);

  // Calculate position timeline data for selected trade
  const positionTimelineData = useMemo(() => {
    if (!selectedTradeData) return [];
    
    const timeline = positionManagementService.generatePositionTimeline(selectedTradeData);
    let runningPnL = 0;
    
    return timeline.map((event, index) => {
      const eventTime = new Date(event.timestamp);
      const timeLabel = eventTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      // Calculate cumulative P&L for visualization
      if (event.type === 'partial_close') {
        const partialClose = selectedTradeData.partialCloses?.find(pc => 
          new Date(pc.timestamp).getTime() === eventTime.getTime()
        );
        if (partialClose) {
          runningPnL += partialClose.pnlRealized;
        }
      }
      
      return {
        time: timeLabel,
        timestamp: event.timestamp,
        type: event.type,
        position: event.totalPosition,
        price: event.price,
        lotSize: Math.abs(event.lotSize),
        cumulativePnL: runningPnL,
        eventDescription: this.getEventDescription(event),
      };
    });
  }, [selectedTradeData]);

  // Calculate exit efficiency data
  const exitEfficiencyData = useMemo(() => {
    return filteredTrades.map(trade => {
      const score = positionManagementService.calculatePositionManagementScore(trade);
      const realizedPnL = trade.partialCloses?.reduce((sum, pc) => sum + pc.pnlRealized, 0) || 0;
      const totalPnL = trade.pnl || 0;
      const partialContribution = totalPnL !== 0 ? (realizedPnL / totalPnL) * 100 : 0;
      
      return {
        tradeId: trade.id,
        symbol: trade.symbol,
        date: trade.date,
        score,
        partialContribution,
        totalPnL,
        partialCount: trade.partialCloses?.length || 0,
      };
    }).sort((a, b) => b.score - a.score);
  }, [filteredTrades]);

  // Calculate exit efficiency analytics
  const exitAnalytics = useMemo(() => {
    return positionManagementService.calculateExitEfficiency(filteredTrades);
  }, [filteredTrades]);

  // Calculate optimization recommendations
  const optimizationData = useMemo(() => {
    const recommendations = positionManagementService.generateExitOptimizationRecommendations(filteredTrades);
    const patterns = positionManagementService.analyzePositionManagementPatterns(filteredTrades);
    
    return {
      recommendations,
      patterns,
    };
  }, [filteredTrades]);

  // Get available trades for timeline selection
  const availableTrades = useMemo(() => {
    return trades
      .filter(trade => trade.partialCloses && trade.partialCloses.length > 0)
      .slice(0, 20) // Limit to recent 20 trades for performance
      .map(trade => ({
        id: trade.id,
        label: `${trade.symbol} - ${trade.date} (${trade.partialCloses?.length || 0} partials)`,
      }));
  }, [trades]);

  // Helper function to get event description
  const getEventDescription = (event: any) => {
    switch (event.type) {
      case 'entry':
        return `Entry: ${event.lotSize} lots at ${event.price}`;
      case 'partial_close':
        return `Partial Close: ${Math.abs(event.lotSize)} lots at ${event.price}`;
      case 'full_close':
        return `Full Close: ${Math.abs(event.lotSize)} lots at ${event.price}`;
      default:
        return `${event.type}: ${event.lotSize} lots at ${event.price}`;
    }
  };

  const isCompact = size && (size.w <= 6 || size.h <= 3);

  const renderTimelineView = () => {
    if (selectedTrade === 'all') {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a specific trade to view position timeline</p>
          </div>
        </div>
      );
    }

    if (!selectedTradeData || !positionTimelineData.length) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No position management data available for selected trade</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Position Size Timeline */}
        <div className="h-[200px]">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Position Size Over Time
          </div>
          <ChartContainer
            config={{
              position: {
                label: "Position Size",
                color: "hsl(var(--chart-1))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={positionTimelineData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">{data.eventDescription}</p>
                          <p className="text-sm text-blue-600">
                            Remaining Position: {data.position} lots
                          </p>
                          {data.cumulativePnL !== 0 && (
                            <p className="text-sm text-green-600">
                              Cumulative P&L: ${data.cumulativePnL.toFixed(2)}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  dataKey="position" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Cumulative P&L Timeline */}
        <div className="h-[200px]">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cumulative P&L from Partial Closes
          </div>
          <ChartContainer
            config={{
              cumulativePnL: {
                label: "Cumulative P&L",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={positionTimelineData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">{data.eventDescription}</p>
                          <p className="text-sm text-green-600">
                            Cumulative P&L: ${data.cumulativePnL.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativePnL" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Trade Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-sm font-medium">Position Management Score</div>
            <div className="text-2xl font-bold text-blue-600">
              {positionManagementService.calculatePositionManagementScore(selectedTradeData)}/100
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-sm font-medium">Partial Closes</div>
            <div className="text-2xl font-bold text-green-600">
              {selectedTradeData.partialCloses?.length || 0}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEfficiencyView = () => (
    <div className="space-y-4">
      {/* Exit Efficiency Scores */}
      <div className="h-[250px]">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Position Management Efficiency Scores
        </div>
        <ChartContainer
          config={{
            score: {
              label: "Efficiency Score",
              color: "hsl(var(--chart-1))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={exitEfficiencyData.slice(0, 10)} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="symbol" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 100]}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.symbol} - {data.date}</p>
                        <p className="text-sm text-blue-600">
                          Efficiency Score: {data.score}/100
                        </p>
                        <p className="text-sm text-green-600">
                          Partial Contribution: {data.partialContribution.toFixed(1)}%
                        </p>
                        <p className="text-sm text-purple-600">
                          Total P&L: ${data.totalPnL.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.partialCount} partial closes
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Exit Reasons Distribution */}
      <div className="h-[200px]">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Exit Reasons Distribution
        </div>
        <ChartContainer
          config={{
            count: {
              label: "Count",
              color: "hsl(var(--chart-2))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={Object.entries(exitAnalytics.exitReasons).map(([reason, count], index) => ({
                  reason: reason.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                  count,
                  color: COLORS[index % COLORS.length],
                }))}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="count"
                label={({ reason, percent }) => `${reason} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {Object.entries(exitAnalytics.exitReasons).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.reason}</p>
                        <p className="text-sm">Count: {data.count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted/50 rounded">
          <div className="text-sm font-medium">Average Exit Efficiency</div>
          <div className="text-2xl font-bold text-blue-600">
            {exitAnalytics.averageExitEfficiency.toFixed(1)}/100
          </div>
        </div>
        <div className="p-3 bg-muted/50 rounded">
          <div className="text-sm font-medium">Partial Close Success</div>
          <div className="text-2xl font-bold text-green-600">
            {exitAnalytics.partialCloseSuccess.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );

  const renderOptimizationView = () => (
    <div className="space-y-4">
      {/* Optimization Recommendations */}
      <div className="space-y-3">
        <div className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Exit Optimization Recommendations
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Optimal Partial Close Level
            </div>
            <div className="text-lg font-bold text-blue-600">
              {(optimizationData.recommendations.optimalPartialCloseLevel * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-blue-600">
              of total position size
            </div>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
            <div className="text-sm font-medium text-green-800 dark:text-green-200">
              Recommended Hold Time
            </div>
            <div className="text-lg font-bold text-green-600">
              {optimizationData.recommendations.recommendedHoldTime.toFixed(1)}h
            </div>
            <div className="text-xs text-green-600">
              average for optimal exits
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200 dark:border-purple-800">
            <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Suggested Exit Strategy
            </div>
            <div className="text-sm font-bold text-purple-600">
              {optimizationData.recommendations.suggestedExitStrategy}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Optimization Tips */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Risk Optimization Tips</div>
        <div className="space-y-1 max-h-[150px] overflow-y-auto">
          {optimizationData.recommendations.riskOptimizationTips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Position Management Patterns */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Position Management Patterns</div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-sm font-medium">Avg Partials per Trade</div>
            <div className="text-xl font-bold text-blue-600">
              {optimizationData.patterns.averagePartialsPerTrade.toFixed(1)}
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-sm font-medium">Most Common Reason</div>
            <div className="text-sm font-bold text-green-600 capitalize">
              {optimizationData.patterns.mostCommonPartialReason.replace('_', ' ')}
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-sm font-medium">Optimal Timing</div>
            <div className="text-xl font-bold text-purple-600">
              {(optimizationData.patterns.optimalPartialTiming * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">of trade duration</div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-sm font-medium">Hold Time Efficiency</div>
            <div className="text-sm">
              <div className="text-green-600">
                Winners: {exitAnalytics.positionHoldTime.byProfitability.winning.toFixed(1)}h
              </div>
              <div className="text-red-600">
                Losers: {exitAnalytics.positionHoldTime.byProfitability.losing.toFixed(1)}h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partial Size Distribution */}
      <div className="h-[150px]">
        <div className="text-sm font-medium mb-2">Partial Close Size Distribution</div>
        <ChartContainer
          config={{
            count: {
              label: "Count",
              color: "hsl(var(--chart-3))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={Object.entries(optimizationData.patterns.partialSizeDistribution).map(([range, count]) => ({
                range,
                count,
              }))} 
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="range" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 h-full">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Position Management</h3>
        </div>
        {!isCompact && (
          <div className="flex items-center gap-2">
            <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="efficiency">Efficiency</SelectItem>
                <SelectItem value="optimization">Optimization</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {selectedView === 'timeline' && availableTrades.length > 0 && (
          <Select value={selectedTrade} onValueChange={setSelectedTrade}>
            <SelectTrigger className="w-[200px] h-8">
              <SelectValue placeholder="Select Trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select a trade...</SelectItem>
              {availableTrades.map(trade => (
                <SelectItem key={trade.id} value={trade.id}>
                  {trade.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="1m">1 Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline" className="text-xs">
          <Filter className="h-3 w-3 mr-1" />
          {filteredTrades.length} trades with partials
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedView === 'timeline' && renderTimelineView()}
        {selectedView === 'efficiency' && renderEfficiencyView()}
        {selectedView === 'optimization' && renderOptimizationView()}
      </div>
    </div>
  );
};

export default PositionManagementAnalyticsWidget;
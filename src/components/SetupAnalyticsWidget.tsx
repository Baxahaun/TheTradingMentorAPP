import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TrendingUp, BarChart3, Filter, Target } from 'lucide-react';
import { ChartContainer, ChartTooltip } from './ui/chart';
import { Trade, SetupType } from '../types/trade';
import { setupClassificationService } from '../lib/setupClassificationService';

interface SetupAnalyticsWidgetProps {
  trades: Trade[];
  size?: { w: number; h: number };
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const SetupAnalyticsWidget: React.FC<SetupAnalyticsWidgetProps> = ({ trades, size }) => {
  const [selectedView, setSelectedView] = useState<'performance' | 'comparison' | 'trends'>('performance');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [selectedSetup, setSelectedSetup] = useState<SetupType | 'all'>('all');

  // Filter trades based on selections
  const filteredTrades = useMemo(() => {
    let filtered = trades.filter(trade => 
      trade.status === 'closed' && 
      trade.setup?.type
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

    // Filter by setup type
    if (selectedSetup !== 'all') {
      filtered = filtered.filter(trade => trade.setup?.type === selectedSetup);
    }

    return filtered;
  }, [trades, selectedTimeframe, selectedSetup]);

  // Calculate setup performance data
  const setupPerformanceData = useMemo(() => {
    const setupTypes = setupClassificationService.getPredefinedSetupTypes();
    
    return setupTypes.map(setupType => {
      const metrics = setupClassificationService.calculateSetupPerformance(setupType, filteredTrades);
      return {
        setupType,
        name: setupClassificationService.getSetupTypeDescription(setupType).split(' ').slice(0, 2).join(' '),
        fullName: setupClassificationService.getSetupTypeDescription(setupType),
        winRate: metrics.winRate,
        rMultiple: metrics.averageRMultiple,
        profitFactor: metrics.profitFactor,
        totalTrades: metrics.totalTrades,
        avgHoldTime: metrics.averageHoldTime,
      };
    }).filter(data => data.totalTrades > 0);
  }, [filteredTrades]);

  // Calculate setup comparison data
  const setupComparisonData = useMemo(() => {
    return setupPerformanceData.map((data, index) => ({
      ...data,
      color: COLORS[index % COLORS.length],
    }));
  }, [setupPerformanceData]);

  // Calculate trend data over time
  const trendData = useMemo(() => {
    if (selectedSetup === 'all') return [];

    const setupTrades = filteredTrades.filter(trade => trade.setup?.type === selectedSetup);
    const monthlyData: { [key: string]: { trades: Trade[]; month: string } } = {};

    setupTrades.forEach(trade => {
      const month = new Date(trade.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { trades: [], month };
      }
      monthlyData[month].trades.push(trade);
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(data => {
        const wins = data.trades.filter(trade => (trade.pnl || 0) > 0);
        const winRate = data.trades.length > 0 ? (wins.length / data.trades.length) * 100 : 0;
        const avgRMultiple = data.trades
          .filter(trade => trade.rMultiple !== undefined)
          .reduce((sum, trade) => sum + (trade.rMultiple || 0), 0) / data.trades.length || 0;

        return {
          month: new Date(data.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          winRate,
          rMultiple: avgRMultiple,
          trades: data.trades.length,
        };
      });
  }, [filteredTrades, selectedSetup]);

  // Get available setup types for filter
  const availableSetups = useMemo(() => {
    const setupsInTrades = new Set(
      trades
        .filter(trade => trade.setup?.type)
        .map(trade => trade.setup!.type)
    );
    return Array.from(setupsInTrades);
  }, [trades]);

  const isCompact = size && (size.w <= 6 || size.h <= 3);

  const renderPerformanceView = () => (
    <div className="space-y-4">
      {/* Win Rate Chart */}
      <div className="h-[200px]">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Win Rate by Setup Type
        </div>
        <ChartContainer
          config={{
            winRate: {
              label: "Win Rate %",
              color: "hsl(var(--chart-1))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={setupPerformanceData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
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
                        <p className="font-medium">{data.fullName}</p>
                        <p className="text-sm text-blue-600">
                          Win Rate: {data.winRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-green-600">
                          R-Multiple: {data.rMultiple.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.totalTrades} trades
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="winRate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* R-Multiple Chart */}
      <div className="h-[200px]">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Average R-Multiple by Setup
        </div>
        <ChartContainer
          config={{
            rMultiple: {
              label: "R-Multiple",
              color: "hsl(var(--chart-2))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={setupPerformanceData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
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
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.fullName}</p>
                        <p className="text-sm text-green-600">
                          R-Multiple: {data.rMultiple.toFixed(2)}
                        </p>
                        <p className="text-sm text-blue-600">
                          Win Rate: {data.winRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.totalTrades} trades
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="rMultiple" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );

  const renderComparisonView = () => (
    <div className="space-y-4">
      {/* Setup Distribution Pie Chart */}
      <div className="h-[250px]">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Setup Distribution
        </div>
        <ChartContainer
          config={{
            trades: {
              label: "Trades",
              color: "hsl(var(--chart-1))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={setupComparisonData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="totalTrades"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {setupComparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.fullName}</p>
                        <p className="text-sm">Trades: {data.totalTrades}</p>
                        <p className="text-sm text-blue-600">Win Rate: {data.winRate.toFixed(1)}%</p>
                        <p className="text-sm text-green-600">R-Multiple: {data.rMultiple.toFixed(2)}</p>
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

      {/* Performance Comparison Table */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Performance Comparison</div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {setupComparisonData
            .sort((a, b) => b.profitFactor - a.profitFactor)
            .map((setup, index) => (
              <div key={setup.setupType} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: setup.color }}
                  />
                  <span className="text-sm font-medium">{setup.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {setup.totalTrades}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-600">{setup.winRate.toFixed(1)}%</span>
                  <span className="text-green-600">{setup.rMultiple.toFixed(2)}R</span>
                  <span className="text-purple-600">{setup.profitFactor.toFixed(2)}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderTrendsView = () => {
    if (selectedSetup === 'all') {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a specific setup type to view trends</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="h-[300px]">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {setupClassificationService.getSetupTypeDescription(selectedSetup as SetupType)} Performance Over Time
          </div>
          <ChartContainer
            config={{
              winRate: {
                label: "Win Rate %",
                color: "hsl(var(--chart-1))",
              },
              rMultiple: {
                label: "R-Multiple",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  domain={[0, 100]}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-blue-600">
                            Win Rate: {data.winRate.toFixed(1)}%
                          </p>
                          <p className="text-sm text-green-600">
                            R-Multiple: {data.rMultiple.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {data.trades} trades
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="rMultiple" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 h-full">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Setup Analytics</h3>
        </div>
        {!isCompact && (
          <div className="flex items-center gap-2">
            <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="comparison">Comparison</SelectItem>
                <SelectItem value="trends">Trends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
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

        {(selectedView === 'trends' || !isCompact) && (
          <Select value={selectedSetup} onValueChange={(value: any) => setSelectedSetup(value)}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue placeholder="All Setups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Setups</SelectItem>
              {availableSetups.map(setupType => (
                <SelectItem key={setupType} value={setupType}>
                  {setupClassificationService.getSetupTypeDescription(setupType).split(' ').slice(0, 2).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Badge variant="outline" className="text-xs">
          <Filter className="h-3 w-3 mr-1" />
          {filteredTrades.length} trades
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedView === 'performance' && renderPerformanceView()}
        {selectedView === 'comparison' && renderComparisonView()}
        {selectedView === 'trends' && renderTrendsView()}
      </div>
    </div>
  );
};

export default SetupAnalyticsWidget;
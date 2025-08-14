import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TrendingUp, BarChart3, Filter, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChartContainer, ChartTooltip } from '../ui/chart';
import { Trade, SetupType } from '../../types/trade';
import { setupClassificationService } from '../../lib/setupClassificationService';

interface MobileSetupAnalyticsWidgetProps {
  trades: Trade[];
  size?: { w: number; h: number };
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const MobileSetupAnalyticsWidget: React.FC<MobileSetupAnalyticsWidgetProps> = ({ trades, size }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'details'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [selectedSetup, setSelectedSetup] = useState<SetupType | 'all'>('all');
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);

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

  // Get available setup types for filter
  const availableSetups = useMemo(() => {
    const setupsInTrades = new Set(
      trades
        .filter(trade => trade.setup?.type)
        .map(trade => trade.setup!.type)
    );
    return Array.from(setupsInTrades);
  }, [trades]);

  // Mobile-specific metrics for swipeable cards
  const mobileMetrics = useMemo(() => [
    {
      title: 'Best Win Rate',
      data: setupPerformanceData.sort((a, b) => b.winRate - a.winRate)[0],
      metric: 'winRate',
      suffix: '%',
      color: '#8b5cf6',
      icon: <Target className="h-5 w-5" />
    },
    {
      title: 'Best R-Multiple',
      data: setupPerformanceData.sort((a, b) => b.rMultiple - a.rMultiple)[0],
      metric: 'rMultiple',
      suffix: 'R',
      color: '#10b981',
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      title: 'Most Traded',
      data: setupPerformanceData.sort((a, b) => b.totalTrades - a.totalTrades)[0],
      metric: 'totalTrades',
      suffix: ' trades',
      color: '#06b6d4',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      title: 'Best Profit Factor',
      data: setupPerformanceData.sort((a, b) => b.profitFactor - a.profitFactor)[0],
      metric: 'profitFactor',
      suffix: '',
      color: '#f59e0b',
      icon: <TrendingUp className="h-5 w-5" />
    }
  ].filter(metric => metric.data), [setupPerformanceData]);

  const nextMetric = () => {
    setCurrentMetricIndex((prev) => (prev + 1) % mobileMetrics.length);
  };

  const prevMetric = () => {
    setCurrentMetricIndex((prev) => (prev - 1 + mobileMetrics.length) % mobileMetrics.length);
  };

  const renderOverviewView = () => (
    <div className="space-y-4">
      {/* Swipeable Metric Cards */}
      {mobileMetrics.length > 0 && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Top Performers</div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevMetric}
                className="h-8 w-8 p-0"
                disabled={mobileMetrics.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {currentMetricIndex + 1} / {mobileMetrics.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMetric}
                className="h-8 w-8 p-0"
                disabled={mobileMetrics.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border">
            {mobileMetrics[currentMetricIndex] && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-full"
                    style={{ backgroundColor: `${mobileMetrics[currentMetricIndex].color}20` }}
                  >
                    <div style={{ color: mobileMetrics[currentMetricIndex].color }}>
                      {mobileMetrics[currentMetricIndex].icon}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {mobileMetrics[currentMetricIndex].title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {mobileMetrics[currentMetricIndex].data.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: mobileMetrics[currentMetricIndex].color }}
                  >
                    {mobileMetrics[currentMetricIndex].data[mobileMetrics[currentMetricIndex].metric as keyof typeof mobileMetrics[0]['data']].toFixed(
                      mobileMetrics[currentMetricIndex].metric === 'rMultiple' ? 2 : 
                      mobileMetrics[currentMetricIndex].metric === 'winRate' ? 1 : 0
                    )}
                    {mobileMetrics[currentMetricIndex].suffix}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mobileMetrics[currentMetricIndex].data.totalTrades} trades
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simplified Setup Distribution */}
      <div className="h-[200px]">
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
                data={setupPerformanceData.slice(0, 5)} // Limit to top 5 for mobile
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="totalTrades"
                label={({ name, percent }) => percent > 0.1 ? `${name}` : ''}
                labelLine={false}
              >
                {setupPerformanceData.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium text-sm">{data.fullName}</p>
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

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xs font-medium text-muted-foreground">Total Setups</div>
          <div className="text-xl font-bold text-blue-600">
            {setupPerformanceData.length}
          </div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xs font-medium text-muted-foreground">Total Trades</div>
          <div className="text-xl font-bold text-green-600">
            {filteredTrades.length}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailsView = () => (
    <div className="space-y-4">
      {/* Mobile-Optimized Performance List */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Setup Performance</div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {setupPerformanceData
            .sort((a, b) => b.profitFactor - a.profitFactor)
            .map((setup, index) => (
              <div key={setup.setupType} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{setup.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {setup.totalTrades}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-blue-600 font-medium">{setup.winRate.toFixed(1)}%</div>
                    <div className="text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-600 font-medium">{setup.rMultiple.toFixed(2)}R</div>
                    <div className="text-muted-foreground">R-Multiple</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-600 font-medium">{setup.profitFactor.toFixed(2)}</div>
                    <div className="text-muted-foreground">Profit Factor</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Mobile Win Rate Chart */}
      <div className="h-[200px]">
        <div className="text-sm font-medium mb-2">Win Rate Comparison</div>
        <ChartContainer
          config={{
            winRate: {
              label: "Win Rate %",
              color: "hsl(var(--chart-1))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={setupPerformanceData.slice(0, 6)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 100]}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-2">
                        <p className="font-medium text-sm">{data.fullName}</p>
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
              <Bar dataKey="winRate" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 h-full">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base">Setup Analytics</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={selectedView === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('overview')}
            className="h-8 px-3 text-xs"
          >
            Overview
          </Button>
          <Button
            variant={selectedView === 'details' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('details')}
            className="h-8 px-3 text-xs"
          >
            Details
          </Button>
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="flex items-center gap-2">
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-[90px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1m">1M</SelectItem>
            <SelectItem value="3m">3M</SelectItem>
            <SelectItem value="6m">6M</SelectItem>
            <SelectItem value="1y">1Y</SelectItem>
          </SelectContent>
        </Select>

        {selectedView === 'details' && (
          <Select value={selectedSetup} onValueChange={(value: any) => setSelectedSetup(value)}>
            <SelectTrigger className="flex-1 h-8 text-xs">
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

        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {filteredTrades.length}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedView === 'overview' && renderOverviewView()}
        {selectedView === 'details' && renderDetailsView()}
      </div>
    </div>
  );
};

export default MobileSetupAnalyticsWidget;
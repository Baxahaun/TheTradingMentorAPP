import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TrendingUp, BarChart3, Filter, Target, Clock, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChartContainer, ChartTooltip } from '../ui/chart';
import { Trade } from '../../types/trade';
import { positionManagementService } from '../../lib/positionManagementService';

interface MobilePositionManagementAnalyticsWidgetProps {
  trades: Trade[];
  size?: { w: number; h: number };
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

const MobilePositionManagementAnalyticsWidget: React.FC<MobilePositionManagementAnalyticsWidgetProps> = ({ trades, size }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'trades' | 'insights'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [currentTradeIndex, setCurrentTradeIndex] = useState(0);

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

  // Top performing trades for mobile swipe
  const topTrades = useMemo(() => {
    return filteredTrades
      .map(trade => ({
        ...trade,
        score: positionManagementService.calculatePositionManagementScore(trade),
        realizedPnL: trade.partialCloses?.reduce((sum, pc) => sum + pc.pnlRealized, 0) || 0,
        partialCount: trade.partialCloses?.length || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [filteredTrades]);

  const nextTrade = () => {
    setCurrentTradeIndex((prev) => (prev + 1) % topTrades.length);
  };

  const prevTrade = () => {
    setCurrentTradeIndex((prev) => (prev - 1 + topTrades.length) % topTrades.length);
  };

  const renderOverviewView = () => (
    <div className="space-y-4">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-blue-600" />
            <div className="text-xs font-medium text-blue-800 dark:text-blue-200">Exit Efficiency</div>
          </div>
          <div className="text-xl font-bold text-blue-600">
            {exitAnalytics.averageExitEfficiency.toFixed(1)}
          </div>
          <div className="text-xs text-blue-600/70">out of 100</div>
        </div>

        <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div className="text-xs font-medium text-green-800 dark:text-green-200">Success Rate</div>
          </div>
          <div className="text-xl font-bold text-green-600">
            {exitAnalytics.partialCloseSuccess.toFixed(1)}%
          </div>
          <div className="text-xs text-green-600/70">partial closes</div>
        </div>

        <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-purple-600" />
            <div className="text-xs font-medium text-purple-800 dark:text-purple-200">Avg Hold Time</div>
          </div>
          <div className="text-xl font-bold text-purple-600">
            {exitAnalytics.positionHoldTime.average.toFixed(1)}h
          </div>
          <div className="text-xs text-purple-600/70">average</div>
        </div>

        <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-orange-600" />
            <div className="text-xs font-medium text-orange-800 dark:text-orange-200">Avg Partials</div>
          </div>
          <div className="text-xl font-bold text-orange-600">
            {optimizationData.patterns.averagePartialsPerTrade.toFixed(1)}
          </div>
          <div className="text-xs text-orange-600/70">per trade</div>
        </div>
      </div>

      {/* Exit Reasons Distribution */}
      <div className="h-[180px]">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Exit Reasons
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
                outerRadius={60}
                dataKey="count"
                label={({ reason, percent }) => percent > 0.1 ? reason.split(' ')[0] : ''}
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
                      <div className="bg-background border rounded-lg shadow-lg p-2">
                        <p className="font-medium text-sm">{data.reason}</p>
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

      {/* Quick Optimization Tip */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="text-sm font-medium mb-1">💡 Quick Tip</div>
        <div className="text-xs text-muted-foreground">
          {optimizationData.recommendations.riskOptimizationTips[0] || 
           'Your position management is performing well. Keep tracking partial closes for better insights.'}
        </div>
      </div>
    </div>
  );

  const renderTradesView = () => {
    if (topTrades.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trades with partial closes found</p>
          </div>
        </div>
      );
    }

    const currentTrade = topTrades[currentTradeIndex];

    return (
      <div className="space-y-4">
        {/* Trade Navigation */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Top Performing Trades</div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevTrade}
              className="h-8 w-8 p-0"
              disabled={topTrades.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {currentTradeIndex + 1} / {topTrades.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextTrade}
              className="h-8 w-8 p-0"
              disabled={topTrades.length <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Trade Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-lg">{currentTrade.symbol}</div>
              <div className="text-sm text-muted-foreground">{currentTrade.date}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {currentTrade.score}/100
              </div>
              <div className="text-xs text-muted-foreground">efficiency score</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="text-sm font-medium text-green-600">
                ${currentTrade.realizedPnL.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Realized P&L</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-purple-600">
                ${(currentTrade.pnl || 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Total P&L</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-orange-600">
                {currentTrade.partialCount}
              </div>
              <div className="text-xs text-muted-foreground">Partials</div>
            </div>
          </div>

          {/* Partial Closes List */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Partial Closes:</div>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {currentTrade.partialCloses?.map((pc, index) => (
                <div key={pc.id} className="flex items-center justify-between p-2 bg-background/50 rounded text-xs">
                  <div>
                    <span className="font-medium">{pc.lotSize} lots</span>
                    <span className="text-muted-foreground ml-1">@ {pc.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${pc.pnlRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${pc.pnlRealized.toFixed(2)}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {pc.reason.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart for Current Trade */}
        {currentTrade.partialCloses && currentTrade.partialCloses.length > 1 && (
          <div className="h-[150px]">
            <div className="text-sm font-medium mb-2">Partial Close Timeline</div>
            <ChartContainer
              config={{
                cumulativePnL: {
                  label: "Cumulative P&L",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={currentTrade.partialCloses.map((pc, index) => ({
                    index: index + 1,
                    cumulativePnL: currentTrade.partialCloses!.slice(0, index + 1).reduce((sum, p) => sum + p.pnlRealized, 0),
                    time: new Date(pc.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  }))}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <XAxis 
                    dataKey="index" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-2">
                            <p className="text-sm font-medium">Partial #{label}</p>
                            <p className="text-sm text-green-600">
                              Cumulative: ${data.cumulativePnL.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Time: {data.time}
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
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </div>
    );
  };

  const renderInsightsView = () => (
    <div className="space-y-4">
      {/* Optimization Recommendations */}
      <div className="space-y-3">
        <div className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Optimization Insights
        </div>
        
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Optimal Partial Size
              </div>
              <div className="text-lg font-bold text-blue-600">
                {(optimizationData.recommendations.optimalPartialCloseLevel * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-blue-600">
              of total position size
            </div>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                Optimal Hold Time
              </div>
              <div className="text-lg font-bold text-green-600">
                {optimizationData.recommendations.recommendedHoldTime.toFixed(1)}h
              </div>
            </div>
            <div className="text-xs text-green-600">
              for best exits
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Recommendation */}
      <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
          Suggested Strategy
        </div>
        <div className="text-sm font-bold text-purple-600">
          {optimizationData.recommendations.suggestedExitStrategy}
        </div>
      </div>

      {/* Hold Time Analysis */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Hold Time Analysis</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-xs font-medium text-green-800 dark:text-green-200">Winners</div>
            <div className="text-lg font-bold text-green-600">
              {exitAnalytics.positionHoldTime.byProfitability.winning.toFixed(1)}h
            </div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-xs font-medium text-red-800 dark:text-red-200">Losers</div>
            <div className="text-lg font-bold text-red-600">
              {exitAnalytics.positionHoldTime.byProfitability.losing.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>

      {/* Partial Size Distribution */}
      <div className="h-[150px]">
        <div className="text-sm font-medium mb-2">Partial Size Distribution</div>
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
              <XAxis 
                dataKey="range" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && payload[0]) {
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-2">
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-sm">Count: {payload[0].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Tips List */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Improvement Tips</div>
        <div className="space-y-1 max-h-[120px] overflow-y-auto">
          {optimizationData.recommendations.riskOptimizationTips.slice(0, 3).map((tip, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 h-full">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base">Position Mgmt</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={selectedView === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('overview')}
            className="h-8 px-2 text-xs"
          >
            Overview
          </Button>
          <Button
            variant={selectedView === 'trades' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('trades')}
            className="h-8 px-2 text-xs"
          >
            Trades
          </Button>
          <Button
            variant={selectedView === 'insights' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('insights')}
            className="h-8 px-2 text-xs"
          >
            Insights
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

        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {filteredTrades.length} with partials
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedView === 'overview' && renderOverviewView()}
        {selectedView === 'trades' && renderTradesView()}
        {selectedView === 'insights' && renderInsightsView()}
      </div>
    </div>
  );
};

export default MobilePositionManagementAnalyticsWidget;
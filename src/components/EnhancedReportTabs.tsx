import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Activity, 
  Zap,
  Settings,
  Eye,
  Layers
} from 'lucide-react';
import { Trade } from '../types/trade';
import { EnhancedReportsService, SetupPerformanceReport, PatternPerformanceReport, PositionManagementReport } from '../lib/enhancedReportsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface EnhancedReportTabsProps {
  trades: Trade[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const EnhancedReportTabs: React.FC<EnhancedReportTabsProps> = ({ trades }) => {
  const enhancedReport = useMemo(() => {
    return EnhancedReportsService.generateEnhancedReportSummary(trades);
  }, [trades]);

  const { setupAnalysis, patternAnalysis, positionManagementAnalysis, combinedInsights } = enhancedReport;

  // Check if we have enhanced data
  const hasSetupData = setupAnalysis.length > 0;
  const hasPatternData = patternAnalysis.length > 0;
  const hasPositionData = positionManagementAnalysis.totalTradesWithPartialCloses > 0;

  if (!hasSetupData && !hasPatternData && !hasPositionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Enhanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Start using setup classification, pattern recognition, and position management features 
            to unlock advanced analytics and insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="setup" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="setup" className="flex items-center gap-2" disabled={!hasSetupData}>
          <Settings className="w-4 h-4" />
          Setup Analysis
        </TabsTrigger>
        <TabsTrigger value="patterns" className="flex items-center gap-2" disabled={!hasPatternData}>
          <Eye className="w-4 h-4" />
          Pattern Analysis
        </TabsTrigger>
        <TabsTrigger value="position" className="flex items-center gap-2" disabled={!hasPositionData}>
          <Layers className="w-4 h-4" />
          Position Management
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Combined Insights
        </TabsTrigger>
      </TabsList>

      {/* Setup Analysis Tab */}
      <TabsContent value="setup" className="space-y-6">
        <SetupAnalysisSection setupAnalysis={setupAnalysis} />
      </TabsContent>

      {/* Pattern Analysis Tab */}
      <TabsContent value="patterns" className="space-y-6">
        <PatternAnalysisSection patternAnalysis={patternAnalysis} />
      </TabsContent>

      {/* Position Management Tab */}
      <TabsContent value="position" className="space-y-6">
        <PositionManagementSection positionAnalysis={positionManagementAnalysis} />
      </TabsContent>

      {/* Combined Insights Tab */}
      <TabsContent value="insights" className="space-y-6">
        <CombinedInsightsSection insights={combinedInsights} />
      </TabsContent>
    </Tabs>
  );
};

// Setup Analysis Section Component
const SetupAnalysisSection: React.FC<{ setupAnalysis: SetupPerformanceReport[] }> = ({ setupAnalysis }) => {
  const chartData = setupAnalysis.slice(0, 8).map(setup => ({
    name: setup.setupName,
    winRate: setup.winRate,
    profitFactor: setup.profitFactor,
    totalTrades: setup.totalTrades,
    totalPnL: setup.totalPnL
  }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Performing Setup</CardTitle>
          </CardHeader>
          <CardContent>
            {setupAnalysis.length > 0 ? (
              <div>
                <div className="text-2xl font-bold">{setupAnalysis[0].setupName}</div>
                <div className="text-sm text-gray-600">
                  {setupAnalysis[0].winRate.toFixed(1)}% win rate • {setupAnalysis[0].totalTrades} trades
                </div>
                <div className="text-sm font-medium text-green-600">
                  ${setupAnalysis[0].totalPnL.toFixed(2)} total P&L
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Traded Setup</CardTitle>
          </CardHeader>
          <CardContent>
            {setupAnalysis.length > 0 ? (
              (() => {
                const mostTraded = setupAnalysis.sort((a, b) => b.totalTrades - a.totalTrades)[0];
                return (
                  <div>
                    <div className="text-2xl font-bold">{mostTraded.setupName}</div>
                    <div className="text-sm text-gray-600">
                      {mostTraded.totalTrades} trades • {mostTraded.winRate.toFixed(1)}% win rate
                    </div>
                    <div className="text-sm font-medium">
                      Profit Factor: {mostTraded.profitFactor.toFixed(2)}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Setup Diversity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{setupAnalysis.length}</div>
            <div className="text-sm text-gray-600">Different setups used</div>
            <div className="text-sm font-medium">
              Avg R-Multiple: {setupAnalysis.length > 0 
                ? (setupAnalysis.reduce((sum, s) => sum + s.avgRMultiple, 0) / setupAnalysis.length).toFixed(2)
                : '0.00'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Setup Performance Comparison</CardTitle>
            <CardDescription>Win rate vs Profit Factor by setup type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="winRate" fill="#0088FE" name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Distribution</CardTitle>
            <CardDescription>Trade count by setup type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalTrades"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Setup Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {setupAnalysis.map((setup, index) => (
              <div key={setup.setupType} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{setup.setupName}</h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{setup.totalTrades} trades</span>
                      <span>{setup.winRate.toFixed(1)}% win rate</span>
                      <span>PF: {setup.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                  <Badge variant={setup.totalPnL > 0 ? "default" : "destructive"}>
                    ${setup.totalPnL.toFixed(2)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Avg Win</div>
                    <div className="font-medium text-green-600">${setup.avgWin.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Loss</div>
                    <div className="font-medium text-red-600">${setup.avgLoss.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">R-Multiple</div>
                    <div className="font-medium">{setup.avgRMultiple.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Hold Time</div>
                    <div className="font-medium">{setup.avgHoldingTime.toFixed(1)}h</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-2">Market Condition Performance</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {Object.entries(setup.marketConditionPerformance).map(([condition, perf]) => (
                      <div key={condition} className="text-center">
                        <div className="capitalize font-medium">{condition}</div>
                        <div>{perf.winRate.toFixed(0)}% ({perf.trades})</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Pattern Analysis Section Component
const PatternAnalysisSection: React.FC<{ patternAnalysis: PatternPerformanceReport[] }> = ({ patternAnalysis }) => {
  const chartData = patternAnalysis.slice(0, 8).map(pattern => ({
    name: pattern.patternName,
    successRate: pattern.successRate,
    profitFactor: pattern.profitFactor,
    totalTrades: pattern.totalTrades,
    totalPnL: pattern.totalPnL
  }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            {patternAnalysis.length > 0 ? (
              <div>
                <div className="text-2xl font-bold">{patternAnalysis[0].patternName}</div>
                <div className="text-sm text-gray-600">
                  {patternAnalysis[0].successRate.toFixed(1)}% success rate • {patternAnalysis[0].totalTrades} trades
                </div>
                <div className="text-sm font-medium text-green-600">
                  PF: {patternAnalysis[0].profitFactor.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pattern Confluence Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {patternAnalysis.length > 0 ? (
              (() => {
                const avgWithConfluence = patternAnalysis.reduce((sum, p) => sum + p.confluenceImpact.withConfluence.winRate, 0) / patternAnalysis.length;
                const avgWithoutConfluence = patternAnalysis.reduce((sum, p) => sum + p.confluenceImpact.withoutConfluence.winRate, 0) / patternAnalysis.length;
                const improvement = avgWithConfluence - avgWithoutConfluence;
                
                return (
                  <div>
                    <div className="text-2xl font-bold text-green-600">+{improvement.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Win rate improvement</div>
                    <div className="text-sm font-medium">
                      With: {avgWithConfluence.toFixed(1)}% • Without: {avgWithoutConfluence.toFixed(1)}%
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quality Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {patternAnalysis.length > 0 ? (
              (() => {
                const qualityStats = patternAnalysis.reduce((acc, pattern) => {
                  Object.entries(pattern.qualityAnalysis).forEach(([quality, stats]) => {
                    if (!acc[quality]) acc[quality] = { totalTrades: 0, totalWins: 0 };
                    acc[quality].totalTrades += stats.trades;
                    acc[quality].totalWins += (stats.winRate / 100) * stats.trades;
                  });
                  return acc;
                }, {} as { [key: string]: { totalTrades: number; totalWins: number } });

                const quality5WinRate = qualityStats.quality5 
                  ? (qualityStats.quality5.totalWins / qualityStats.quality5.totalTrades) * 100 
                  : 0;
                const quality1WinRate = qualityStats.quality1 
                  ? (qualityStats.quality1.totalWins / qualityStats.quality1.totalTrades) * 100 
                  : 0;

                return (
                  <div>
                    <div className="text-2xl font-bold">Quality 5</div>
                    <div className="text-sm text-gray-600">
                      {quality5WinRate.toFixed(1)}% win rate
                    </div>
                    <div className="text-sm font-medium">
                      vs Quality 1: {quality1WinRate.toFixed(1)}%
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pattern Success Rates</CardTitle>
            <CardDescription>Success rate by pattern type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successRate" fill="#00C49F" name="Success Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pattern Usage Distribution</CardTitle>
            <CardDescription>Trade count by pattern type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalTrades"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Position Management Section Component
const PositionManagementSection: React.FC<{ positionAnalysis: PositionManagementReport }> = ({ positionAnalysis }) => {
  const exitReasonData = Object.entries(positionAnalysis.exitReasonAnalysis).map(([reason, data]) => ({
    name: reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: data.count,
    avgPnL: data.avgPnL
  }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trades with Partials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positionAnalysis.totalTradesWithPartialCloses}</div>
            <div className="text-sm text-gray-600">
              {positionAnalysis.avgPartialClosesPerTrade.toFixed(1)} avg per trade
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {positionAnalysis.partialCloseSuccessRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Profitable partial trades</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Realized from Partials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${positionAnalysis.totalRealizedFromPartials.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total realized P&L</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Management Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {positionAnalysis.avgPositionManagementScore.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Average score</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exit Reasons Analysis</CardTitle>
            <CardDescription>Frequency and performance by exit reason</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={exitReasonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#FFBB28" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partial vs Full Position Comparison</CardTitle>
            <CardDescription>Performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold">Partially Managed</div>
                  <div className="text-sm text-gray-600">
                    {positionAnalysis.comparisonWithFullPositions.partiallyManagedTrades.count} trades
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    ${positionAnalysis.comparisonWithFullPositions.partiallyManagedTrades.avgPnL.toFixed(2)}
                  </div>
                  <div className="text-sm">
                    {positionAnalysis.comparisonWithFullPositions.partiallyManagedTrades.winRate.toFixed(1)}% win rate
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">Full Position</div>
                  <div className="text-sm text-gray-600">
                    {positionAnalysis.comparisonWithFullPositions.fullPositionTrades.count} trades
                  </div>
                  <div className="text-lg font-semibold">
                    ${positionAnalysis.comparisonWithFullPositions.fullPositionTrades.avgPnL.toFixed(2)}
                  </div>
                  <div className="text-sm">
                    {positionAnalysis.comparisonWithFullPositions.fullPositionTrades.winRate.toFixed(1)}% win rate
                  </div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold">Improvement from Management</div>
                <div className="text-2xl font-bold text-green-600">
                  {positionAnalysis.comparisonWithFullPositions.improvementFromManagement > 0 ? '+' : ''}
                  {positionAnalysis.comparisonWithFullPositions.improvementFromManagement.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Combined Insights Section Component
const CombinedInsightsSection: React.FC<{ insights: any }> = ({ insights }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Best Setup-Pattern Combination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-semibold">
                {insights.bestSetupPatternCombination.setup.replace('_', ' ')} + {insights.bestSetupPatternCombination.pattern.replace('_', ' ')}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Trades</div>
                  <div className="font-medium">{insights.bestSetupPatternCombination.trades}</div>
                </div>
                <div>
                  <div className="text-gray-600">Win Rate</div>
                  <div className="font-medium">{insights.bestSetupPatternCombination.winRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Avg P&L</div>
                  <div className="font-medium text-green-600">
                    ${insights.bestSetupPatternCombination.avgPnL.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Worst Setup-Pattern Combination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-semibold">
                {insights.worstSetupPatternCombination.setup.replace('_', ' ')} + {insights.worstSetupPatternCombination.pattern.replace('_', ' ')}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Trades</div>
                  <div className="font-medium">{insights.worstSetupPatternCombination.trades}</div>
                </div>
                <div>
                  <div className="text-gray-600">Win Rate</div>
                  <div className="font-medium">{insights.worstSetupPatternCombination.winRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Avg P&L</div>
                  <div className="font-medium text-red-600">
                    ${insights.worstSetupPatternCombination.avgPnL.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup with Best Position Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <div className="text-xl font-bold">
              {insights.setupWithBestPositionManagement.setup.replace('_', ' ')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600">Management Score</div>
                <div className="text-lg font-semibold">
                  {insights.setupWithBestPositionManagement.avgManagementScore.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Improvement from Management</div>
                <div className="text-lg font-semibold text-green-600">
                  +{insights.setupWithBestPositionManagement.improvementFromManagement.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedReportTabs;
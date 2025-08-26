import React, { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { ProfessionalStrategy, StrategyPerformance, StrategyComparison } from '@/types/strategy';
import { StrategyPerformanceService } from '@/services/StrategyPerformanceService';
import { ProfessionalStrategyBuilder } from './strategy-builder/ProfessionalStrategyBuilder';
import { Trade } from '@/types/trade';

// Legacy Playbook interface for backward compatibility
interface LegacyPlaybook {
  id: string;
  title: string;
  description: string;
  marketConditions: string;
  entryParameters: string;
  exitParameters: string;
  color: string;
  timesUsed?: number;
  tradesWon?: number;
  tradesLost?: number;
}

interface EnhancedPlaybooksProps {
  // Optional props for integration with existing systems
  trades?: Trade[];
  onStrategySelect?: (strategy: ProfessionalStrategy) => void;
}

const EnhancedPlaybooks: React.FC<EnhancedPlaybooksProps> = ({ 
  trades = [], 
  onStrategySelect 
}) => {
  // State management
  const [strategies, setStrategies] = useState<ProfessionalStrategy[]>([]);
  const [showAddStrategy, setShowAddStrategy] = useState(false);
  const [showStrategyBuilder, setShowStrategyBuilder] = useState(false);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit' | 'migrate'>('create');
  const [editingStrategy, setEditingStrategy] = useState<ProfessionalStrategy | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<ProfessionalStrategy | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'list'>('dashboard');
  const [sortBy, setSortBy] = useState<'profitFactor' | 'expectancy' | 'winRate' | 'sharpeRatio'>('profitFactor');
  
  // Form data for creating new strategies
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    marketConditions: '',
    entryParameters: '',
    exitParameters: '',
    color: '#3B82F6'
  });

  // Services
  const performanceService = useMemo(() => new StrategyPerformanceService(), []);

  // Color options for strategies
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // Load strategies on component mount
  useEffect(() => {
    loadStrategies();
  }, []);

  // Update performance metrics when trades change
  useEffect(() => {
    if (trades.length > 0) {
      updateAllPerformanceMetrics();
    }
  }, [trades]);

  // Load strategies from storage (mock implementation)
  const loadStrategies = () => {
    // In a real implementation, this would load from a database or API
    const mockStrategies: ProfessionalStrategy[] = [
      createMockStrategy('1', 'Trend Following', 'Long-term trend following strategy', '#3B82F6'),
      createMockStrategy('2', 'Breakout Trading', 'Range breakout strategy', '#10B981'),
      createMockStrategy('3', 'Mean Reversion', 'Counter-trend mean reversion', '#EF4444')
    ];
    setStrategies(mockStrategies);
  };

  // Create a mock strategy for demonstration
  const createMockStrategy = (id: string, title: string, description: string, color: string): ProfessionalStrategy => {
    const mockPerformance: StrategyPerformance = {
      totalTrades: Math.floor(Math.random() * 50) + 10,
      winningTrades: 0,
      losingTrades: 0,
      profitFactor: 1.2 + Math.random() * 1.5,
      expectancy: (Math.random() - 0.3) * 100,
      winRate: 40 + Math.random() * 30,
      averageWin: 50 + Math.random() * 100,
      averageLoss: 30 + Math.random() * 50,
      riskRewardRatio: 1 + Math.random() * 2,
      sharpeRatio: Math.random() * 2,
      maxDrawdown: Math.random() * 25,
      maxDrawdownDuration: Math.floor(Math.random() * 30),
      sampleSize: 0,
      confidenceLevel: 95,
      statisticallySignificant: false,
      monthlyReturns: [],
      performanceTrend: 'Stable' as const,
      lastCalculated: new Date().toISOString(),
      calculationVersion: 1
    };

    mockPerformance.winningTrades = Math.floor(mockPerformance.totalTrades * mockPerformance.winRate / 100);
    mockPerformance.losingTrades = mockPerformance.totalTrades - mockPerformance.winningTrades;
    mockPerformance.sampleSize = mockPerformance.totalTrades;
    mockPerformance.statisticallySignificant = mockPerformance.totalTrades >= 30;

    return {
      id,
      title,
      description,
      color,
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending market with clear directional bias',
        technicalConditions: ['Price above/below key moving averages', 'Volume confirmation'],
        volatilityRequirements: 'Medium to high volatility preferred'
      },
      entryTriggers: {
        primarySignal: 'Breakout above resistance or below support',
        confirmationSignals: ['Volume spike', 'Momentum confirmation'],
        timingCriteria: 'Enter on retest or immediate breakout'
      },
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage',
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased',
          parameters: { atrMultiplier: 2, atrPeriod: 14 },
          description: '2x ATR stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      },
      performance: mockPerformance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isActive: true
    };
  };

  // Update performance metrics for all strategies
  const updateAllPerformanceMetrics = () => {
    const updatedStrategies = strategies.map(strategy => {
      const strategyTrades = trades.filter(trade => trade.strategy === strategy.id);
      if (strategyTrades.length > 0) {
        const updatedPerformance = performanceService.calculateProfessionalMetrics(
          strategy.id,
          strategyTrades
        );
        return { ...strategy, performance: updatedPerformance };
      }
      return strategy;
    });
    setStrategies(updatedStrategies);
  };

  // Handle form submission for new strategy
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newStrategy: ProfessionalStrategy = {
      id: Date.now().toString(),
      ...formData,
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: formData.marketConditions,
        technicalConditions: [formData.entryParameters],
        volatilityRequirements: 'Medium volatility preferred'
      },
      entryTriggers: {
        primarySignal: formData.entryParameters,
        confirmationSignals: [],
        timingCriteria: 'Market open or session overlap'
      },
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage',
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'PercentageBased',
          parameters: { percentage: 2 },
          description: '2% stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          parameters: { ratio: 2 },
          description: '2:1 risk-reward ratio'
        },
        riskRewardRatio: 2
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profitFactor: 0,
        expectancy: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        riskRewardRatio: 0,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        sampleSize: 0,
        confidenceLevel: 95,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Insufficient Data',
        lastCalculated: new Date().toISOString(),
        calculationVersion: 1
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isActive: true
    };
    
    setStrategies([...strategies, newStrategy]);
    setFormData({
      title: '',
      description: '',
      marketConditions: '',
      entryParameters: '',
      exitParameters: '',
      color: '#3B82F6'
    });
    setShowAddStrategy(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStrategyClick = (strategy: ProfessionalStrategy) => {
    setSelectedStrategy(strategy);
    onStrategySelect?.(strategy);
  };

  // Handle strategy builder save
  const handleStrategyBuilderSave = (strategy: ProfessionalStrategy) => {
    if (builderMode === 'edit' && editingStrategy) {
      // Update existing strategy
      setStrategies(prev => prev.map(s => s.id === strategy.id ? strategy : s));
    } else {
      // Add new strategy
      setStrategies(prev => [...prev, strategy]);
    }
    setShowStrategyBuilder(false);
    setEditingStrategy(null);
  };

  // Handle strategy builder cancel
  const handleStrategyBuilderCancel = () => {
    setShowStrategyBuilder(false);
    setEditingStrategy(null);
  };

  // Calculate strategy comparisons for ranking
  const strategyComparisons = useMemo(() => {
    return performanceService.compareStrategies(strategies);
  }, [strategies, performanceService]);

  // Sort strategies based on selected criteria
  const sortedStrategies = useMemo(() => {
    return [...strategies].sort((a, b) => {
      switch (sortBy) {
        case 'profitFactor':
          return b.performance.profitFactor - a.performance.profitFactor;
        case 'expectancy':
          return b.performance.expectancy - a.performance.expectancy;
        case 'winRate':
          return b.performance.winRate - a.performance.winRate;
        case 'sharpeRatio':
          return (b.performance.sharpeRatio || 0) - (a.performance.sharpeRatio || 0);
        default:
          return 0;
      }
    });
  }, [strategies, sortBy]);

  // Render professional KPI card
  const renderKPICard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    format: 'number' | 'percentage' | 'currency' | 'ratio' = 'number',
    trend?: 'up' | 'down' | 'stable',
    significance?: boolean
  ) => (
    <Card className="relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
          </span>
          {significance !== undefined && (
            <Badge variant={significance ? "default" : "secondary"} className="text-xs">
              {significance ? "Significant" : "More data needed"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {format === 'percentage' && typeof value === 'number' ? `${value.toFixed(1)}%` :
             format === 'currency' && typeof value === 'number' ? `$${value.toFixed(2)}` :
             format === 'ratio' && typeof value === 'number' ? `${value.toFixed(2)}:1` :
             typeof value === 'number' ? value.toFixed(2) : value}
          </div>
          {trend && (
            <div className={`flex items-center ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
               trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
               <div className="w-4 h-4 bg-gray-400 rounded-full" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Professional Strategy Management</h1>
          <p className="text-gray-600 mt-1">
            Track and analyze your trading strategies with professional-grade metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveView('dashboard')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant={activeView === 'list' ? 'default' : 'outline'}
            onClick={() => setActiveView('list')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Strategies
          </Button>
          <Button 
            onClick={() => {
              setBuilderMode('create');
              setEditingStrategy(null);
              setShowStrategyBuilder(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Strategy
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'dashboard' | 'list')}>
        {/* Dashboard View */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Performance Overview */}
          {strategies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderKPICard(
                "Total Strategies",
                strategies.length,
                <Target className="w-4 h-4" />,
                'number'
              )}
              {renderKPICard(
                "Active Strategies",
                strategies.filter(s => s.isActive).length,
                <CheckCircle className="w-4 h-4" />,
                'number'
              )}
              {renderKPICard(
                "Avg Profit Factor",
                strategies.reduce((sum, s) => sum + s.performance.profitFactor, 0) / strategies.length,
                <TrendingUp className="w-4 h-4" />,
                'ratio'
              )}
              {renderKPICard(
                "Statistically Significant",
                strategies.filter(s => s.performance.statisticallySignificant).length,
                <BarChart3 className="w-4 h-4" />,
                'number'
              )}
            </div>
          )}

          {/* Strategy Ranking */}
          {strategyComparisons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Strategy Performance Ranking</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="profitFactor">Profit Factor</option>
                    <option value="expectancy">Expectancy</option>
                    <option value="winRate">Win Rate</option>
                    <option value="sharpeRatio">Sharpe Ratio</option>
                  </select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategyComparisons.slice(0, 5).map((comparison, index) => (
                    <div key={comparison.strategyId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                        }`}>
                          {comparison.rank}
                        </div>
                        <div>
                          <h4 className="font-medium">{comparison.strategyName}</h4>
                          <p className="text-sm text-gray-600">Score: {comparison.score.toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          PF: {comparison.metrics.profitFactor.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">
                          WR: {comparison.metrics.winRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategy Comparison Panel */}
          {strategies.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Strategy Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {strategies.slice(0, 3).map(strategy => (
                    <div key={strategy.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: strategy.color }}
                        />
                        <h4 className="font-medium">{strategy.title}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Profit Factor:</span>
                          <span className="font-medium">{strategy.performance.profitFactor.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Win Rate:</span>
                          <span className="font-medium">{strategy.performance.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expectancy:</span>
                          <span className="font-medium">${strategy.performance.expectancy.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max DD:</span>
                          <span className="font-medium">{strategy.performance.maxDrawdown.toFixed(1)}%</span>
                        </div>
                      </div>
                      {!strategy.performance.statisticallySignificant && (
                        <Alert className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Need {30 - strategy.performance.totalTrades} more trades for significance
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Strategy List View */}
        <TabsContent value="list">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleStrategyClick(strategy)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: strategy.color }}
                  >
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{strategy.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {strategy.methodology}
                      </Badge>
                      {strategy.performance.statisticallySignificant && (
                        <Badge variant="default" className="text-xs">
                          Significant
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{strategy.description}</p>
                
                {/* Professional KPIs */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">PF:</span>
                    <span className="font-medium">{strategy.performance.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">WR:</span>
                    <span className="font-medium">{strategy.performance.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Exp:</span>
                    <span className="font-medium">${strategy.performance.expectancy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trades:</span>
                    <span className="font-medium">{strategy.performance.totalTrades}</span>
                  </div>
                </div>

                {/* Performance Trend Indicator */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {strategy.performance.performanceTrend === 'Improving' && (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    )}
                    {strategy.performance.performanceTrend === 'Declining' && (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    {strategy.performance.performanceTrend === 'Stable' && (
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    )}
                    <span className="text-xs text-gray-500">
                      {strategy.performance.performanceTrend}
                    </span>
                  </div>
                  
                  {!strategy.performance.statisticallySignificant && (
                    <Info className="w-3 h-3 text-amber-500" title="Needs more data" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {strategies.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No strategies yet</h3>
              <p className="text-gray-600">Create your first professional trading strategy to get started.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>     
 {/* Add Strategy Dialog */}
      <Dialog open={showAddStrategy} onOpenChange={setShowAddStrategy}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Strategy</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Strategy Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter strategy title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your trading strategy"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="marketConditions">Market Conditions</Label>
              <Textarea
                id="marketConditions"
                value={formData.marketConditions}
                onChange={(e) => handleInputChange('marketConditions', e.target.value)}
                placeholder="When to use this strategy (market conditions, timeframe, etc.)"
                rows={2}
                required
              />
            </div>

            <div>
              <Label htmlFor="entryParameters">Entry Parameters</Label>
              <Textarea
                id="entryParameters"
                value={formData.entryParameters}
                onChange={(e) => handleInputChange('entryParameters', e.target.value)}
                placeholder="Entry criteria, signals, and conditions"
                rows={2}
                required
              />
            </div>

            <div>
              <Label htmlFor="exitParameters">Exit Parameters</Label>
              <Textarea
                id="exitParameters"
                value={formData.exitParameters}
                onChange={(e) => handleInputChange('exitParameters', e.target.value)}
                placeholder="Exit criteria, profit targets, stop losses"
                rows={2}
                required
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex space-x-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleInputChange('color', color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddStrategy(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Create Strategy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Strategy Details Dialog */}
      <Dialog open={!!selectedStrategy} onOpenChange={() => setSelectedStrategy(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedStrategy && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: selectedStrategy.color }}
                  >
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedStrategy.title}</DialogTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{selectedStrategy.methodology}</Badge>
                      <Badge variant="outline">{selectedStrategy.primaryTimeframe}</Badge>
                      {selectedStrategy.performance.statisticallySignificant && (
                        <Badge variant="default">Statistically Significant</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Professional KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {renderKPICard(
                    "Profit Factor",
                    selectedStrategy.performance.profitFactor,
                    <BarChart3 className="w-4 h-4" />,
                    'ratio',
                    selectedStrategy.performance.profitFactor > 1.5 ? 'up' : 
                    selectedStrategy.performance.profitFactor < 1.0 ? 'down' : 'stable',
                    selectedStrategy.performance.statisticallySignificant
                  )}
                  
                  {renderKPICard(
                    "Expectancy",
                    selectedStrategy.performance.expectancy,
                    <Target className="w-4 h-4" />,
                    'currency',
                    selectedStrategy.performance.expectancy > 0 ? 'up' : 'down',
                    selectedStrategy.performance.statisticallySignificant
                  )}
                  
                  {renderKPICard(
                    "Win Rate",
                    selectedStrategy.performance.winRate,
                    <TrendingUp className="w-4 h-4" />,
                    'percentage',
                    selectedStrategy.performance.winRate > 50 ? 'up' : 'down',
                    selectedStrategy.performance.statisticallySignificant
                  )}
                  
                  {renderKPICard(
                    "Sharpe Ratio",
                    selectedStrategy.performance.sharpeRatio || 0,
                    <BarChart3 className="w-4 h-4" />,
                    'ratio',
                    (selectedStrategy.performance.sharpeRatio || 0) > 1 ? 'up' : 'stable',
                    selectedStrategy.performance.statisticallySignificant
                  )}
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold">{selectedStrategy.performance.totalTrades}</div>
                      <div className="text-xs text-gray-600">
                        {selectedStrategy.performance.winningTrades}W / {selectedStrategy.performance.losingTrades}L
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedStrategy.performance.maxDrawdown.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        {selectedStrategy.performance.maxDrawdownDuration} days
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Win/Loss</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-lg font-bold">
                        <span className="text-green-600">${selectedStrategy.performance.averageWin.toFixed(2)}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600">${selectedStrategy.performance.averageLoss.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Risk-Reward</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold">
                        {selectedStrategy.performance.riskRewardRatio.toFixed(2)}:1
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Statistical Significance Indicator */}
                {!selectedStrategy.performance.statisticallySignificant && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Statistical Significance:</strong> This strategy needs{' '}
                      {30 - selectedStrategy.performance.totalTrades} more trades to reach statistical significance.
                      Current metrics may not be reliable for decision making.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Performance Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                      Performance Trend
                      {selectedStrategy.performance.performanceTrend === 'Improving' && (
                        <TrendingUp className="w-4 h-4 ml-2 text-green-600" />
                      )}
                      {selectedStrategy.performance.performanceTrend === 'Declining' && (
                        <TrendingDown className="w-4 h-4 ml-2 text-red-600" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">
                        {selectedStrategy.performance.performanceTrend}
                      </span>
                      <Badge variant={
                        selectedStrategy.performance.performanceTrend === 'Improving' ? 'default' :
                        selectedStrategy.performance.performanceTrend === 'Declining' ? 'destructive' :
                        'secondary'
                      }>
                        {selectedStrategy.performance.performanceTrend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Strategy Details */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Description</Label>
                    <p className="mt-1 text-gray-600">{selectedStrategy.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Setup Conditions</Label>
                      <p className="mt-1 text-gray-600">{selectedStrategy.setupConditions.marketEnvironment}</p>
                      {selectedStrategy.setupConditions.technicalConditions.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                          {selectedStrategy.setupConditions.technicalConditions.map((condition, index) => (
                            <li key={index}>{condition}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Entry Triggers</Label>
                      <p className="mt-1 text-gray-600">{selectedStrategy.entryTriggers.primarySignal}</p>
                      {selectedStrategy.entryTriggers.confirmationSignals.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                          {selectedStrategy.entryTriggers.confirmationSignals.map((signal, index) => (
                            <li key={index}>{signal}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Risk Management</Label>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>Position Size: {selectedStrategy.riskManagement.positionSizingMethod.type}</p>
                        <p>Max Risk: {selectedStrategy.riskManagement.maxRiskPerTrade}% per trade</p>
                        <p>Stop Loss: {selectedStrategy.riskManagement.stopLossRule.description}</p>
                        <p>Take Profit: {selectedStrategy.riskManagement.takeProfitRule.description}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Asset Classes & Timeframe</Label>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>Primary Timeframe: {selectedStrategy.primaryTimeframe}</p>
                        <p>Asset Classes: {selectedStrategy.assetClasses.join(', ')}</p>
                        <p>Methodology: {selectedStrategy.methodology}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legacy Fields (if present) */}
                {(selectedStrategy.marketConditions || selectedStrategy.entryParameters || selectedStrategy.exitParameters) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Legacy Strategy Details</h4>
                    <div className="space-y-3">
                      {selectedStrategy.marketConditions && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Market Conditions</Label>
                          <p className="mt-1 text-gray-600">{selectedStrategy.marketConditions}</p>
                        </div>
                      )}
                      
                      {selectedStrategy.entryParameters && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Entry Parameters</Label>
                          <p className="mt-1 text-gray-600">{selectedStrategy.entryParameters}</p>
                        </div>
                      )}
                      
                      {selectedStrategy.exitParameters && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Exit Parameters</Label>
                          <p className="mt-1 text-gray-600">{selectedStrategy.exitParameters}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Professional Strategy Builder */}
      <ProfessionalStrategyBuilder
        strategy={editingStrategy}
        mode={builderMode}
        isOpen={showStrategyBuilder}
        onSave={handleStrategyBuilderSave}
        onCancel={handleStrategyBuilderCancel}
      />
    </div>
  );
};

export default EnhancedPlaybooks;
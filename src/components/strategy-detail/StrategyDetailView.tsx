/**
 * Strategy Detail View Component
 * 
 * Comprehensive strategy analytics dashboard with performance metrics,
 * charts, trade distribution analysis, linked trades navigation,
 * and AI-powered pattern recognition insights.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  DollarSign,
  Percent,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  Filter,
  Download,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { ProfessionalStrategy, StrategyPerformance, TradeWithStrategy } from '@/types/strategy';
import { Trade } from '@/types/trade';
import { PerformanceAnalytics } from '../strategy-dashboard/PerformanceAnalytics';
import { PerformanceChart } from '../strategy-dashboard/PerformanceChart';
import { AIInsightsPanel } from '../ai-insights/AIInsightsPanel';
import { StrategyTradeNavigation } from '../trade-strategy/StrategyTradeNavigation';
import TradeDistributionAnalysis from './TradeDistributionAnalysis';
import LinkedTradesView from './LinkedTradesView';

interface StrategyDetailViewProps {
  strategy: ProfessionalStrategy;
  trades: TradeWithStrategy[];
  allStrategies?: ProfessionalStrategy[];
  onBack: () => void;
  onEditStrategy?: (strategy: ProfessionalStrategy) => void;
  onNavigateToTrade?: (tradeId: string) => void;
  onExportData?: (strategy: ProfessionalStrategy) => void;
  className?: string;
}

type DetailTab = 'overview' | 'performance' | 'trades' | 'insights' | 'settings';

const StrategyDetailView: React.FC<StrategyDetailViewProps> = ({
  strategy,
  trades,
  allStrategies = [],
  onBack,
  onEditStrategy,
  onNavigateToTrade,
  onExportData,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [tradeFilter, setTradeFilter] = useState<'all' | 'winning' | 'losing'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '1M' | '3M' | '6M' | '1Y'>('all');

  // Filter trades for this strategy
  const strategyTrades = useMemo(() => {
    return trades.filter(trade => trade.strategyId === strategy.id);
  }, [trades, strategy.id]);

  // Apply filters to trades
  const filteredTrades = useMemo(() => {
    let filtered = [...strategyTrades];

    // Apply outcome filter
    if (tradeFilter === 'winning') {
      filtered = filtered.filter(trade => trade.pnl && trade.pnl > 0);
    } else if (tradeFilter === 'losing') {
      filtered = filtered.filter(trade => trade.pnl && trade.pnl <= 0);
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = Date.now();
      const timeRanges = {
        '1M': 30 * 24 * 60 * 60 * 1000,
        '3M': 90 * 24 * 60 * 60 * 1000,
        '6M': 180 * 24 * 60 * 60 * 1000,
        '1Y': 365 * 24 * 60 * 60 * 1000
      };
      const cutoff = now - timeRanges[timeFilter];
      filtered = filtered.filter(trade => trade.timestamp >= cutoff);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [strategyTrades, tradeFilter, timeFilter]);

  // Calculate trade distribution metrics
  const tradeDistribution = useMemo(() => {
    if (filteredTrades.length === 0) return null;

    const winningTrades = filteredTrades.filter(t => t.pnl && t.pnl > 0);
    const losingTrades = filteredTrades.filter(t => t.pnl && t.pnl <= 0);
    
    // Time of day distribution
    const hourDistribution = Array(24).fill(0);
    filteredTrades.forEach(trade => {
      const hour = new Date(trade.timestamp).getHours();
      hourDistribution[hour]++;
    });

    // Day of week distribution
    const dayDistribution = Array(7).fill(0);
    filteredTrades.forEach(trade => {
      const day = new Date(trade.timestamp).getDay();
      dayDistribution[day]++;
    });

    // Currency pair distribution
    const pairDistribution: Record<string, number> = {};
    filteredTrades.forEach(trade => {
      pairDistribution[trade.currencyPair] = (pairDistribution[trade.currencyPair] || 0) + 1;
    });

    // Adherence score distribution
    const adherenceScores = filteredTrades
      .filter(t => t.adherenceScore !== undefined)
      .map(t => t.adherenceScore!);
    
    const avgAdherence = adherenceScores.length > 0 
      ? adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length 
      : 0;

    return {
      total: filteredTrades.length,
      winning: winningTrades.length,
      losing: losingTrades.length,
      winRate: filteredTrades.length > 0 ? (winningTrades.length / filteredTrades.length) * 100 : 0,
      hourDistribution,
      dayDistribution,
      pairDistribution,
      avgAdherence,
      adherenceScores
    };
  }, [filteredTrades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPnLColor = (pnl?: number) => {
    if (pnl === undefined) return 'text-gray-500';
    return pnl > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPerformanceTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'Declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'Stable':
        return <Activity className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Strategy Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strategy.performance.totalTrades}</div>
            <div className="text-xs text-gray-500 mt-1">
              {strategy.performance.statisticallySignificant ? 'Statistically significant' : 'Need more data'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Percent className="w-4 h-4 mr-2" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(strategy.performance.winRate)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {strategy.performance.winningTrades}W / {strategy.performance.losingTrades}L
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strategy.performance.profitFactor.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {strategy.performance.profitFactor > 1 ? 'Profitable' : 'Unprofitable'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Expectancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(strategy.performance.expectancy)}</div>
            <div className="text-xs text-gray-500 mt-1">
              Per trade average
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Methodology:</span>
                  <Badge variant="outline">{strategy.methodology}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Timeframe:</span>
                  <span className="font-medium">{strategy.primaryTimeframe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Asset Classes:</span>
                  <span className="font-medium">{strategy.assetClasses.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={strategy.isActive ? "default" : "secondary"}>
                    {strategy.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Risk Management</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Risk per Trade:</span>
                  <span className="font-medium">{formatPercentage(strategy.riskManagement.maxRiskPerTrade)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk-Reward Ratio:</span>
                  <span className="font-medium">{strategy.riskManagement.riskRewardRatio}:1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position Sizing:</span>
                  <span className="font-medium">{strategy.riskManagement.positionSizingMethod.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stop Loss Type:</span>
                  <span className="font-medium">{strategy.riskManagement.stopLossRule.type}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Setup Conditions</h4>
            <p className="text-sm text-gray-700 mb-2">{strategy.setupConditions.marketEnvironment}</p>
            <div className="flex flex-wrap gap-2">
              {strategy.setupConditions.technicalConditions.map((condition, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Entry Triggers</h4>
            <p className="text-sm text-gray-700 mb-2">{strategy.entryTriggers.primarySignal}</p>
            <div className="flex flex-wrap gap-2">
              {strategy.entryTriggers.confirmationSignals.map((signal, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {signal}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Performance Trend
            {getPerformanceTrendIcon(strategy.performance.performanceTrend)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Current Trend:</span>
            <Badge variant={
              strategy.performance.performanceTrend === 'Improving' ? 'default' :
              strategy.performance.performanceTrend === 'Declining' ? 'destructive' :
              'secondary'
            }>
              {strategy.performance.performanceTrend}
            </Badge>
          </div>
          
          {strategy.performance.monthlyReturns.length > 0 && (
            <PerformanceChart 
              monthlyReturns={strategy.performance.monthlyReturns}
              strategyId={strategy.id}
              height={200}
            />
          )}
        </CardContent>
      </Card>

      {/* Statistical Significance Alert */}
      {!strategy.performance.statisticallySignificant && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This strategy needs {30 - strategy.performance.totalTrades} more trades to reach statistical significance. 
            Current results should be interpreted with caution.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <PerformanceAnalytics strategy={strategy} />
      
      {strategy.performance.monthlyReturns.length > 0 && (
        <PerformanceChart 
          monthlyReturns={strategy.performance.monthlyReturns}
          strategyId={strategy.id}
          height={400}
        />
      )}
    </div>
  );

  const renderTradesTab = () => (
    <div className="space-y-6">
      {/* Trade Distribution Analysis */}
      <TradeDistributionAnalysis trades={filteredTrades} />
      
      {/* Linked Trades View */}
      <LinkedTradesView
        trades={filteredTrades}
        strategyName={strategy.title}
        onNavigateToTrade={(tradeId) => onNavigateToTrade?.(tradeId)}
      />
    </div>
  );

  const renderInsightsTab = () => (
    <AIInsightsPanel
      strategy={strategy}
      strategies={allStrategies}
      trades={strategyTrades}
      className="bg-transparent"
    />
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Strategy Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {onEditStrategy && (
              <Button onClick={() => onEditStrategy(strategy)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit Strategy
              </Button>
            )}
            
            {onExportData && (
              <Button variant="outline" onClick={() => onExportData(strategy)}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => setActiveTab('performance')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDate(new Date(strategy.createdAt).getTime())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{formatDate(new Date(strategy.updatedAt).getTime())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">v{strategy.version}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Last Used:</span>
                <span className="font-medium">
                  {strategy.lastUsed ? formatDate(new Date(strategy.lastUsed).getTime()) : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Performance Calculated:</span>
                <span className="font-medium">
                  {formatDate(new Date(strategy.performance.lastCalculated).getTime())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Calculation Version:</span>
                <span className="font-medium">v{strategy.performance.calculationVersion}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={`strategy-detail-view ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: strategy.color }}
            >
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{strategy.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline">{strategy.methodology}</Badge>
                <Badge variant="outline">{strategy.primaryTimeframe}</Badge>
                {strategy.performance.statisticallySignificant && (
                  <Badge variant="default">Statistically Significant</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onExportData && (
            <Button variant="outline" onClick={() => onExportData(strategy)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {onEditStrategy && (
            <Button onClick={() => onEditStrategy(strategy)}>
              <Settings className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {strategy.description && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-gray-700">{strategy.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DetailTab)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trades">Trades ({strategyTrades.length})</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          {renderPerformanceTab()}
        </TabsContent>

        <TabsContent value="trades" className="mt-6">
          {renderTradesTab()}
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          {renderInsightsTab()}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {renderSettingsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyDetailView;
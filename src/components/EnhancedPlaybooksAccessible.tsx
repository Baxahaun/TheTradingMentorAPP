import React, { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { ProfessionalStrategy, StrategyPerformance, StrategyComparison } from '@/types/strategy';
import { StrategyPerformanceService } from '@/services/StrategyPerformanceService';
import { ProfessionalStrategyBuilder } from './strategy-builder/ProfessionalStrategyBuilder';
import StrategyDetailView from './strategy-detail/StrategyDetailView';
import { Trade } from '@/types/trade';

// Accessibility and responsive imports
import { useResponsive } from '../hooks/useResponsive';
import { useHighContrast, useScreenReader, useKeyboardNavigation } from '../hooks/useAccessibility';
import { ResponsiveGrid, ResponsiveStack, ResponsiveContainer } from './responsive/ResponsiveGrid';
import { MobileNavigation, BottomTabNavigation } from './responsive/MobileNavigation';
import { AccessibleButton, AccessibleIconButton } from './accessibility/AccessibleButton';
import { AccessiblePerformanceIndicator, AccessibleChart } from './accessibility/AccessibleChart';
import { AccessibleInput, AccessibleSelect } from './accessibility/AccessibleForm';

interface EnhancedPlaybooksProps {
  trades?: Trade[];
  onStrategySelect?: (strategy: ProfessionalStrategy) => void;
}

const EnhancedPlaybooksAccessible: React.FC<EnhancedPlaybooksProps> = ({ 
  trades = [], 
  onStrategySelect 
}) => {
  // Responsive and accessibility hooks
  const { isMobile, isTablet, currentBreakpoint } = useResponsive();
  const { isHighContrast, toggleHighContrast } = useHighContrast();
  const { announce } = useScreenReader();

  // State management
  const [strategies, setStrategies] = useState<ProfessionalStrategy[]>([]);
  const [showStrategyBuilder, setShowStrategyBuilder] = useState(false);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit' | 'migrate'>('create');
  const [editingStrategy, setEditingStrategy] = useState<ProfessionalStrategy | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<ProfessionalStrategy | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'list' | 'detail'>('dashboard');
  const [sortBy, setSortBy] = useState<'profitFactor' | 'expectancy' | 'winRate' | 'sharpeRatio'>('profitFactor');

  // Services
  const performanceService = useMemo(() => new StrategyPerformanceService(), []);

  // Handle strategy selection
  const handleStrategySelect = (strategy: ProfessionalStrategy) => {
    setSelectedStrategy(strategy);
    setActiveView('detail');
    onStrategySelect?.(strategy);
    announce(`Selected strategy: ${strategy.title}`, 'polite');
  };

  // Keyboard navigation for strategy list
  const { focusedIndex, containerRef } = useKeyboardNavigation(
    strategies, 
    handleStrategySelect
  );

  // Load strategies on mount
  useEffect(() => {
    // Mock data for demonstration - in real app, load from service
    const mockStrategies: ProfessionalStrategy[] = [
      {
        id: '1',
        title: 'Momentum Breakout',
        description: 'High-probability momentum trades on daily breakouts',
        color: '#3B82F6',
        methodology: 'Technical',
        primaryTimeframe: '1D',
        assetClasses: ['Stocks', 'ETFs'],
        setupConditions: {
          marketEnvironment: 'Trending market with volume confirmation',
          technicalConditions: ['Price above 20 EMA', 'Volume > 1.5x average'],
          volatilityRequirements: 'ATR > 2%'
        },
        entryTriggers: {
          primarySignal: 'Break above resistance with volume',
          confirmationSignals: ['RSI > 50', 'MACD bullish crossover'],
          timingCriteria: 'First 30 minutes of session'
        },
        riskManagement: {
          positionSizingMethod: { type: 'FixedPercentage', parameters: { percentage: 2 } },
          maxRiskPerTrade: 2,
          stopLossRule: { type: 'ATRBased', parameters: { multiplier: 2 }, description: '2x ATR below entry' },
          takeProfitRule: { type: 'RiskRewardRatio', parameters: { ratio: 3 }, description: '3:1 risk-reward' },
          riskRewardRatio: 3
        },
        performance: {
          totalTrades: 45,
          winningTrades: 28,
          losingTrades: 17,
          profitFactor: 2.1,
          expectancy: 125.50,
          winRate: 62.2,
          averageWin: 285.75,
          averageLoss: -95.25,
          riskRewardRatio: 3.0,
          maxDrawdown: -8.5,
          maxDrawdownDuration: 12,
          sampleSize: 45,
          confidenceLevel: 85,
          statisticallySignificant: true,
          monthlyReturns: [],
          performanceTrend: 'Improving',
          lastCalculated: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isActive: true
      }
    ];
    setStrategies(mockStrategies);
  }, []);

  // Navigation items for mobile
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="w-5 h-5" />  
  },
    {
      id: 'strategies',
      label: 'Strategies',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'builder',
      label: 'Create',
      icon: <Plus className="w-5 h-5" />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  // Handle navigation
  const handleNavigation = (item: any) => {
    switch (item.id) {
      case 'dashboard':
        setActiveView('dashboard');
        setSelectedStrategy(null);
        break;
      case 'strategies':
        setActiveView('list');
        setSelectedStrategy(null);
        break;
      case 'builder':
        setBuilderMode('create');
        setEditingStrategy(null);
        setShowStrategyBuilder(true);
        break;
      case 'settings':
        // Handle settings
        break;
    }
    announce(`Navigated to ${item.label}`, 'polite');
  };

  // Handle strategy creation/editing
  const handleStrategyCreate = () => {
    setBuilderMode('create');
    setEditingStrategy(null);
    setShowStrategyBuilder(true);
    announce('Opening strategy builder', 'polite');
  };

  const handleStrategyEdit = (strategy: ProfessionalStrategy) => {
    setBuilderMode('edit');
    setEditingStrategy(strategy);
    setShowStrategyBuilder(true);
    announce(`Editing strategy: ${strategy.title}`, 'polite');
  };

  const handleStrategySave = (strategy: ProfessionalStrategy) => {
    if (builderMode === 'create') {
      setStrategies(prev => [...prev, { ...strategy, id: Date.now().toString() }]);
      announce('Strategy created successfully', 'assertive');
    } else {
      setStrategies(prev => prev.map(s => s.id === strategy.id ? strategy : s));
      announce('Strategy updated successfully', 'assertive');
    }
    setShowStrategyBuilder(false);
    setEditingStrategy(null);
  };

  // Render performance dashboard
  const renderDashboard = () => (
    <ResponsiveContainer className="dashboard-container">
      <div className="dashboard-header">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Strategy Performance Dashboard</h1>
          <div className="flex items-center gap-2">
            <AccessibleIconButton
              icon={isHighContrast ? <CheckCircle /> : <Target />}
              label={isHighContrast ? "Disable high contrast" : "Enable high contrast"}
              onClick={toggleHighContrast}
              variant="ghost"
            />
            <AccessibleButton
              onClick={handleStrategyCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {isMobile ? 'New' : 'Create Strategy'}
            </AccessibleButton>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <ResponsiveGrid 
        columns={{ xs: 1, sm: 2, lg: 4 }}
        gap={4}
        className="mb-8"
      >
        {strategies.map((strategy) => (
          <Card 
            key={strategy.id}
            className={`strategy-card ${focusedIndex === strategies.indexOf(strategy) ? 'focused' : ''}`}
            tabIndex={0}
            role="button"
            onClick={() => handleStrategySelect(strategy)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleStrategySelect(strategy);
              }
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium truncate">
                  {strategy.title}
                </CardTitle>
                <Badge 
                  variant={strategy.performance.statisticallySignificant ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {strategy.performance.statisticallySignificant ? 'Significant' : 'Developing'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveStack direction={{ xs: 'column' }} spacing={3}>
                <AccessiblePerformanceIndicator
                  label="Profit Factor"
                  value={strategy.performance.profitFactor}
                  format="number"
                  trend={strategy.performance.profitFactor > 1.5 ? 'up' : 
                         strategy.performance.profitFactor < 1.2 ? 'down' : 'neutral'}
                />
                <AccessiblePerformanceIndicator
                  label="Win Rate"
                  value={strategy.performance.winRate}
                  format="percentage"
                  trend={strategy.performance.winRate > 60 ? 'up' : 
                         strategy.performance.winRate < 45 ? 'down' : 'neutral'}
                />
                <AccessiblePerformanceIndicator
                  label="Expectancy"
                  value={strategy.performance.expectancy}
                  format="currency"
                  trend={strategy.performance.expectancy > 100 ? 'up' : 
                         strategy.performance.expectancy < 0 ? 'down' : 'neutral'}
                />
              </ResponsiveStack>
            </CardContent>
          </Card>
        ))}
      </ResponsiveGrid>

      {/* Strategy Comparison Chart */}
      {strategies.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Strategy Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <AccessibleChart
              data={strategies.map(s => ({
                label: s.title,
                value: s.performance.profitFactor,
                description: `${s.performance.totalTrades} trades, ${s.performance.winRate.toFixed(1)}% win rate`
              }))}
              title="Profit Factor Comparison"
              type="bar"
            >
              {/* Placeholder for actual chart component */}
              <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </AccessibleChart>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 3 }} gap={4}>
            <AccessibleButton
              variant="secondary"
              onClick={() => setActiveView('list')}
              leftIcon={<BookOpen className="w-4 h-4" />}
            >
              View All Strategies
            </AccessibleButton>
            <AccessibleButton
              variant="secondary"
              onClick={handleStrategyCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create New Strategy
            </AccessibleButton>
            <AccessibleButton
              variant="secondary"
              onClick={() => announce('Performance analysis feature coming soon', 'polite')}
              leftIcon={<BarChart3 className="w-4 h-4" />}
            >
              Analyze Performance
            </AccessibleButton>
          </ResponsiveGrid>
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );

  // Render strategy list
  const renderStrategyList = () => (
    <ResponsiveContainer className="strategy-list-container">
      <div className="list-header">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">All Strategies</h1>
          <div className="flex items-center gap-4">
            <AccessibleSelect
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'profitFactor', label: 'Profit Factor' },
                { value: 'expectancy', label: 'Expectancy' },
                { value: 'winRate', label: 'Win Rate' },
                { value: 'sharpeRatio', label: 'Sharpe Ratio' }
              ]}
              className="w-48"
            />
            <AccessibleButton
              onClick={handleStrategyCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Strategy
            </AccessibleButton>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="strategy-grid">
        <ResponsiveGrid columns={{ xs: 1, md: 2, xl: 3 }} gap={6}>
          {strategies
            .sort((a, b) => {
              switch (sortBy) {
                case 'profitFactor':
                  return b.performance.profitFactor - a.performance.profitFactor;
                case 'expectancy':
                  return b.performance.expectancy - a.performance.expectancy;
                case 'winRate':
                  return b.performance.winRate - a.performance.winRate;
                default:
                  return 0;
              }
            })
            .map((strategy, index) => (
              <Card 
                key={strategy.id}
                className={`strategy-list-card ${focusedIndex === index ? 'focused' : ''}`}
                tabIndex={0}
                role="button"
                onClick={() => handleStrategySelect(strategy)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStrategySelect(strategy);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{strategy.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant={strategy.performance.statisticallySignificant ? 'default' : 'secondary'}
                      >
                        {strategy.performance.statisticallySignificant ? 'Significant' : 'Developing'}
                      </Badge>
                      <AccessibleIconButton
                        icon={<Settings className="w-4 h-4" />}
                        label={`Edit ${strategy.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStrategyEdit(strategy);
                        }}
                        variant="ghost"
                        size="sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveGrid columns={{ xs: 2, sm: 4 }} gap={4}>
                    <AccessiblePerformanceIndicator
                      label="Profit Factor"
                      value={strategy.performance.profitFactor}
                      format="number"
                    />
                    <AccessiblePerformanceIndicator
                      label="Win Rate"
                      value={strategy.performance.winRate}
                      format="percentage"
                    />
                    <AccessiblePerformanceIndicator
                      label="Expectancy"
                      value={strategy.performance.expectancy}
                      format="currency"
                    />
                    <AccessiblePerformanceIndicator
                      label="Trades"
                      value={strategy.performance.totalTrades}
                      format="number"
                    />
                  </ResponsiveGrid>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Methodology:</span>
                      <Badge variant="outline">{strategy.methodology}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Timeframe:</span>
                      <span>{strategy.primaryTimeframe}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </ResponsiveGrid>
      </div>
    </ResponsiveContainer>
  );

  // Main render
  return (
    <div className={`enhanced-playbooks ${isHighContrast ? 'high-contrast' : ''}`}>
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          items={navigationItems}
          activeItem={activeView}
          onItemSelect={handleNavigation}
        />
      )}

      {/* Desktop Navigation */}
      {!isMobile && (
        <nav className="desktop-nav mb-6" role="navigation" aria-label="Strategy navigation">
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="list">
                <BookOpen className="w-4 h-4 mr-2" />
                Strategies
              </TabsTrigger>
              <TabsTrigger value="detail" disabled={!selectedStrategy}>
                <Target className="w-4 h-4 mr-2" />
                Details
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </nav>
      )}

      {/* Main Content */}
      <main role="main" aria-live="polite">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'list' && renderStrategyList()}
        {activeView === 'detail' && selectedStrategy && (
          <StrategyDetailView 
            strategy={selectedStrategy}
            trades={trades.filter(t => t.strategyId === selectedStrategy.id)}
            onEdit={() => handleStrategyEdit(selectedStrategy)}
            onBack={() => setActiveView('dashboard')}
          />
        )}
      </main>

      {/* Strategy Builder Dialog */}
      <Dialog open={showStrategyBuilder} onOpenChange={setShowStrategyBuilder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {builderMode === 'create' ? 'Create New Strategy' : 
               builderMode === 'edit' ? 'Edit Strategy' : 'Migrate Strategy'}
            </DialogTitle>
          </DialogHeader>
          <ProfessionalStrategyBuilder
            strategy={editingStrategy}
            mode={builderMode}
            onSave={handleStrategySave}
            onCancel={() => {
              setShowStrategyBuilder(false);
              setEditingStrategy(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bottom Tab Navigation for Mobile */}
      {isMobile && (
        <BottomTabNavigation
          items={navigationItems}
          activeItem={activeView}
          onItemSelect={handleNavigation}
        />
      )}

      {/* Accessibility announcements region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="accessibility-announcements"
      />
    </div>
  );
};

export default EnhancedPlaybooksAccessible;
/**
 * Lazy Strategy Dashboard - Performance-optimized dashboard with lazy loading
 * and virtualization for large strategy lists
 */

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { ProfessionalStrategy } from '../../types/strategy';
import { useLazyComponent, useLazyData } from '../../hooks/useLazyComponent';
import VirtualList from '../ui/VirtualList';
import { performanceMonitor } from '../../services/PerformanceMonitoringService';
import { cacheService } from '../../services/CacheService';

// Lazy-loaded components
const LazyPerformanceChart = React.lazy(() => import('./PerformanceChart'));
const LazyAIInsightsPanel = React.lazy(() => import('../ai-insights/AIInsightsPanel'));
const LazyBacktestingPanel = React.lazy(() => import('../backtesting/BacktestingPanel'));

interface LazyStrategyDashboardProps {
  strategies: ProfessionalStrategy[];
  onStrategySelect: (strategy: ProfessionalStrategy) => void;
  selectedStrategyId?: string;
}

interface StrategyListItemProps {
  strategy: ProfessionalStrategy;
  isSelected: boolean;
  onClick: () => void;
}

// Memoized strategy list item to prevent unnecessary re-renders
const StrategyListItem = React.memo(function StrategyListItem({
  strategy,
  isSelected,
  onClick
}: StrategyListItemProps) {
  const renderMonitor = performanceMonitor.monitorComponentRender('StrategyListItem');
  
  React.useEffect(() => {
    renderMonitor.onRenderStart();
    return renderMonitor.onRenderEnd;
  });

  return (
    <div
      className={`strategy-item p-4 border-b cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{strategy.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
          
          {/* Key metrics preview */}
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-green-600">
              PF: {strategy.performance.profitFactor.toFixed(2)}
            </span>
            <span className="text-blue-600">
              WR: {strategy.performance.winRate.toFixed(1)}%
            </span>
            <span className="text-purple-600">
              Exp: {strategy.performance.expectancy.toFixed(2)}
            </span>
            <span className={`${
              strategy.performance.statisticallySignificant ? 'text-green-600' : 'text-orange-600'
            }`}>
              {strategy.performance.totalTrades} trades
            </span>
          </div>
        </div>
        
        {/* Performance indicator */}
        <div className="ml-4">
          <div className={`w-3 h-3 rounded-full ${
            strategy.performance.profitFactor >= 1.5 ? 'bg-green-500' :
            strategy.performance.profitFactor >= 1.0 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
      </div>
    </div>
  );
});

export function LazyStrategyDashboard({
  strategies,
  onStrategySelect,
  selectedStrategyId
}: LazyStrategyDashboardProps) {
  const [sortBy, setSortBy] = useState<'profitFactor' | 'winRate' | 'expectancy' | 'totalTrades'>('profitFactor');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Lazy load performance analytics
  const {
    ref: analyticsRef,
    component: AnalyticsComponent,
    isLoaded: analyticsLoaded,
    isLoading: analyticsLoading
  } = useLazyComponent(
    () => import('./PerformanceAnalytics').then(m => m.PerformanceAnalytics),
    { rootMargin: '100px' }
  );

  // Lazy load AI insights
  const {
    data: aiInsights,
    isLoading: insightsLoading
  } = useLazyData(
    `ai-insights-${selectedStrategyId}`,
    async () => {
      if (!selectedStrategyId) return null;
      // This would call the AI insights service
      return { insights: [], patterns: [] };
    },
    { staleTime: 300000 } // 5 minutes
  );

  // Memoized sorted and filtered strategies
  const processedStrategies = useMemo(() => {
    let filtered = strategies;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(strategy =>
        strategy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortBy) {
        case 'profitFactor':
          aValue = a.performance.profitFactor;
          bValue = b.performance.profitFactor;
          break;
        case 'winRate':
          aValue = a.performance.winRate;
          bValue = b.performance.winRate;
          break;
        case 'expectancy':
          aValue = a.performance.expectancy;
          bValue = b.performance.expectancy;
          break;
        case 'totalTrades':
          aValue = a.performance.totalTrades;
          bValue = b.performance.totalTrades;
          break;
        default:
          return 0;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [strategies, searchTerm, sortBy, sortOrder]);

  // Handle strategy selection
  const handleStrategySelect = useCallback((strategy: ProfessionalStrategy) => {
    // Cache the selected strategy for quick access
    cacheService.set(`selected-strategy:${strategy.id}`, strategy, 600000); // 10 minutes
    onStrategySelect(strategy);
  }, [onStrategySelect]);

  // Render strategy item for virtual list
  const renderStrategyItem = useCallback((strategy: ProfessionalStrategy, index: number) => {
    return (
      <StrategyListItem
        key={strategy.id}
        strategy={strategy}
        isSelected={strategy.id === selectedStrategyId}
        onClick={() => handleStrategySelect(strategy)}
      />
    );
  }, [selectedStrategyId, handleStrategySelect]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  }, [sortBy]);

  const selectedStrategy = useMemo(() => 
    strategies.find(s => s.id === selectedStrategyId),
    [strategies, selectedStrategyId]
  );

  return (
    <div className="lazy-strategy-dashboard h-full flex">
      {/* Strategy List Panel */}
      <div className="w-1/3 border-r bg-white">
        {/* Search and Sort Controls */}
        <div className="p-4 border-b bg-gray-50">
          <input
            type="text"
            placeholder="Search strategies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          
          <div className="flex gap-2 mt-2">
            {(['profitFactor', 'winRate', 'expectancy', 'totalTrades'] as const).map((field) => (
              <button
                key={field}
                onClick={() => handleSortChange(field)}
                className={`px-2 py-1 text-xs rounded ${
                  sortBy === field 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {field === 'profitFactor' ? 'PF' :
                 field === 'winRate' ? 'WR' :
                 field === 'expectancy' ? 'Exp' : 'Trades'}
                {sortBy === field && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
              </button>
            ))}
          </div>
        </div>

        {/* Virtualized Strategy List */}
        <VirtualList
          items={processedStrategies}
          itemHeight={100}
          containerHeight={600}
          renderItem={renderStrategyItem}
          getItemKey={(strategy) => strategy.id}
          className="strategy-list"
        />
      </div>

      {/* Strategy Details Panel */}
      <div className="flex-1 overflow-auto">
        {selectedStrategy ? (
          <div className="p-6">
            {/* Strategy Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedStrategy.title}</h2>
              <p className="text-gray-600 mt-1">{selectedStrategy.description}</p>
              
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-500">Profit Factor</div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedStrategy.performance.profitFactor.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-500">Win Rate</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedStrategy.performance.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-500">Expectancy</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedStrategy.performance.expectancy.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-500">Total Trades</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {selectedStrategy.performance.totalTrades}
                  </div>
                </div>
              </div>
            </div>

            {/* Lazy-loaded Performance Analytics */}
            <div ref={analyticsRef} className="mb-6">
              {analyticsLoading && (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">Loading performance analytics...</div>
                </div>
              )}
              {analyticsLoaded && AnalyticsComponent && (
                <Suspense fallback={<div>Loading analytics...</div>}>
                  <AnalyticsComponent strategy={selectedStrategy} />
                </Suspense>
              )}
            </div>

            {/* Lazy-loaded Performance Chart */}
            <div className="mb-6">
              <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg" />}>
                <LazyPerformanceChart 
                  monthlyReturns={selectedStrategy.performance.monthlyReturns}
                  strategyId={selectedStrategy.id}
                />
              </Suspense>
            </div>

            {/* Lazy-loaded AI Insights */}
            <div className="mb-6">
              <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg" />}>
                <LazyAIInsightsPanel 
                  strategyId={selectedStrategy.id}
                  insights={aiInsights}
                  isLoading={insightsLoading}
                />
              </Suspense>
            </div>

            {/* Lazy-loaded Backtesting Panel */}
            <div>
              <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg" />}>
                <LazyBacktestingPanel strategy={selectedStrategy} />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a strategy to view details
          </div>
        )}
      </div>
    </div>
  );
}

export default LazyStrategyDashboard;
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart3, Zap, AlertTriangle, Settings, Eye, EyeOff, BarChart4 } from 'lucide-react';

// Import sub-components
import PerformanceMetricsPanel from './trading-performance/PerformanceMetricsPanel';
import PerformanceChartPanel from './trading-performance/PerformanceChartPanel';
import CurrencyPairBreakdown from './trading-performance/CurrencyPairBreakdown';
import RiskMetricsDisplay from './trading-performance/RiskMetricsDisplay';
import InteractiveControls from './trading-performance/InteractiveControls';

// Import services and types
import { TradingPerformanceService, createTradingPerformanceService } from '../services/TradingPerformanceService';
import {
  TradingPerformanceWidgetProps,
  TradingPerformanceControls,
  TimeRange,
  ChartPeriod,
  CurrencyPairFilter
} from '../types/tradingPerformance';

/**
 * Main Trading Performance Widget Component
 *
 * Comprehensive trading performance dashboard integrating all sub-components
 * with responsive design, interactive controls, and data management.
 */
const TradingPerformanceWidget: React.FC<TradingPerformanceWidgetProps> = ({
  performanceMetrics,
  currencyPairMetrics,
  riskMetrics,
  chartData,
  timeRange = '1M',
  chartPeriod = 'daily',
  loading = false,
  error,
  onTimeRangeChange,
  onChartPeriodChange,
  onCurrencyPairFilter,
  onExportData,
  size = { w: 12, h: 8 }
}) => {
  // Component state
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  const [showControls, setShowControls] = useState(true);
  const [controls, setControls] = useState<TradingPerformanceControls>({
    timeRange: timeRange as TimeRange,
    chartPeriod: chartPeriod as ChartPeriod,
    currencyPairFilter: {
      selectedPairs: [],
      minTrades: 5,
      performanceOrder: 'pnl'
    },
    showRiskMetrics: true,
    showDebugInfo: false
  });

  // Service instance
  const performanceService = useMemo(() => createTradingPerformanceService(), []);

  // Determine responsive layout based on size
  const isCompact = useMemo(() => {
    return size.w < 4 || size.h < 4;
  }, [size]);

  const isMedium = useMemo(() => {
    return size.w >= 4 && size.w < 8;
  }, [size]);

  const isLarge = useMemo(() => {
    return size.w >= 8;
  }, [size]);

  // Filtered data based on controls
  const filteredCurrencyPairData = useMemo(() => {
    if (!currencyPairMetrics || currencyPairMetrics.length === 0) return [];

    let filtered = [...currencyPairMetrics];

    // Filter by minimum trades
    if (controls.currencyPairFilter.minTrades && controls.currencyPairFilter.minTrades > 0) {
      filtered = filtered.filter(pair => pair.totalTrades >= controls.currencyPairFilter.minTrades!);
    }

    // Filter by selected pairs
    if (controls.currencyPairFilter.selectedPairs && controls.currencyPairFilter.selectedPairs.length > 0) {
      filtered = filtered.filter(pair => controls.currencyPairFilter.selectedPairs!.includes(pair.currencyPair));
    }

    // Sort by performance order
    filtered.sort((a, b) => {
      switch (controls.currencyPairFilter.performanceOrder) {
        case 'pnl':
          return b.totalPnL - a.totalPnL;
        case 'winRate':
          return b.winRate - a.winRate;
        case 'trades':
          return b.totalTrades - a.totalTrades;
        default:
          return b.totalPnL - a.totalPnL;
      }
    });

    return filtered;
  }, [currencyPairMetrics, controls.currencyPairFilter]);

  // Handle control changes
  const handleControlsChange = (newControls: TradingPerformanceControls) => {
    setControls(newControls);

    // Propagate changes to parent if callbacks provided
    if (onTimeRangeChange && newControls.timeRange !== controls.timeRange) {
      onTimeRangeChange(newControls.timeRange);
    }
    if (onChartPeriodChange && newControls.chartPeriod !== controls.chartPeriod) {
      onChartPeriodChange(newControls.chartPeriod);
    }
  };

  // Handle currency pair selection
  const handleCurrencyPairSelect = (pair: string) => {
    const newSelectedPairs = controls.currencyPairFilter.selectedPairs.includes(pair)
      ? controls.currencyPairFilter.selectedPairs.filter(p => p !== pair)
      : [...controls.currencyPairFilter.selectedPairs, pair];

    const newFilter: CurrencyPairFilter = {
      ...controls.currencyPairFilter,
      selectedPairs: newSelectedPairs
    };

    setControls(prev => ({
      ...prev,
      currencyPairFilter: newFilter
    }));

    if (onCurrencyPairFilter) {
      onCurrencyPairFilter(newSelectedPairs.length > 0 ? pair : null);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-600 mb-2">Error Loading Data</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get layout configuration based on size
  const getLayoutConfig = () => {
    if (isCompact) {
      return {
        showTabs: false,
        showControls: false,
        compactMode: true,
        columns: 1
      };
    } else if (isMedium) {
      return {
        showTabs: true,
        showControls: showControls,
        compactMode: false,
        columns: 1
      };
    } else {
      return {
        showTabs: true,
        showControls: showControls,
        compactMode: false,
        columns: 2
      };
    }
  };

  const layoutConfig = getLayoutConfig();

  // Guard against undefined/null data props
  if (!performanceMetrics || !currencyPairMetrics || !riskMetrics || !chartData) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Initializing widget...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render Overview tab
  const renderOverviewTab = () => (
    <div className={`space-y-4 ${isCompact ? 'space-y-3' : 'space-y-4'}`}>
      {/* Performance Metrics */}
      {performanceMetrics && (
        <PerformanceMetricsPanel
          metrics={performanceMetrics}
          size={{ w: size.w, h: 2 }}
        />
      )}

      {/* Chart and Pair Breakdown Row */}
      <div className={`grid gap-4 ${layoutConfig.columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Performance Chart */}
        <div className={isCompact ? '' : 'col-span-1'}>
          {chartData && chartData.length > 0 ? (
            <PerformanceChartPanel
              data={chartData}
              period={controls.chartPeriod}
              size={{ w: layoutConfig.columns === 2 ? Math.floor(size.w / 2) : size.w, h: 4 }}
              onDataPointClick={() => {}} // TODO: Handle chart interactions
            />
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">No chart data available</p>
            </div>
          )}
        </div>

        {/* Currency Pair Breakdown */}
        <div className={isCompact ? '' : 'col-span-1'}>
          {filteredCurrencyPairData && filteredCurrencyPairData.length > 0 ? (
            <CurrencyPairBreakdown
              data={filteredCurrencyPairData}
              size={{ w: layoutConfig.columns === 2 ? Math.floor(size.w / 2) : size.w, h: 4 }}
              onPairClick={handleCurrencyPairSelect}
            />
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">No currency pair data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Metrics (only show if not disabled) */}
      {controls.showRiskMetrics && riskMetrics && (
        <RiskMetricsDisplay
          riskMetrics={riskMetrics}
          size={{ w: size.w, h: 3 }}
          showDetails={!isCompact}
        />
      )}
    </div>
  );

  // Render Details tab
  const renderDetailsTab = () => (
    <div className={`space-y-4 ${isCompact ? 'space-y-3' : 'space-y-4'}`}>
      {/* Dedicated Risk Analysis */}
      {riskMetrics ? (
        <RiskMetricsDisplay
          riskMetrics={riskMetrics}
          size={{ w: size.w, h: 4 }}
          showDetails={true}
        />
      ) : (
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">No risk data available</p>
        </div>
      )}

      {/* Detailed Currency Breakdown */}
      {filteredCurrencyPairData && filteredCurrencyPairData.length > 0 ? (
        <CurrencyPairBreakdown
          data={filteredCurrencyPairData}
          size={{ w: size.w, h: 5 }}
          onPairClick={handleCurrencyPairSelect}
        />
      ) : (
        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">No currency pair data available</p>
        </div>
      )}

      {/* Controls Section */}
      {layoutConfig.showControls && !isCompact && (
        <InteractiveControls
          controls={controls}
          size={{ w: size.w, h: 3 }}
          onControlsChange={handleControlsChange}
        />
      )}
    </div>
  );

  // Main component render
  return (
    <Card className="w-full h-full">
      {/* Header with controls */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart4 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">
              Trading Performance
            </CardTitle>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {performanceMetrics && performanceMetrics.winRate > 70 && (
              <Badge className="bg-green-600 hover:bg-green-700">High Win Rate</Badge>
            )}
            {riskMetrics && riskMetrics.riskScore < 60 && (
              <Badge variant="destructive">High Risk</Badge>
            )}
            {chartData && chartData.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {chartData.length} data points
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!isCompact && (
            <>
              {onExportData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportData}
                  className="h-8 px-3"
                >
                  Export
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowControls(!showControls)}
                className="h-8 px-3"
              >
                {showControls ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </>
          )}

          {/* Debug indicator */}
          {controls.showDebugInfo && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 px-3 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Debug
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="h-full">
        {layoutConfig.showTabs && !isCompact ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'details')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">
                Details
                {controls.showDebugInfo && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    <Zap className="h-2 w-2 mr-1" />
                    Adv
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-0">
              {renderOverviewTab()}
            </TabsContent>

            <TabsContent value="details" className="space-y-0">
              {renderDetailsTab()}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-0">
            {renderOverviewTab()}
          </div>
        )}

        {/* Mobile/Compact Controls */}
        {isCompact && layoutConfig.showControls && (
          <div className="mt-4">
            <InteractiveControls
              controls={controls}
              size={{ w: size.w, h: 3 }}
              onControlsChange={handleControlsChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingPerformanceWidget;
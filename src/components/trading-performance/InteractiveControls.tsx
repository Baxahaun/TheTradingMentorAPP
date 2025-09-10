import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Settings, Clock, Eye, EyeOff, Filter, ChevronDown } from 'lucide-react';
import {
  TradingPerformanceControls,
  TimeRange,
  ChartPeriod,
  CurrencyPairFilter
} from '../../types/tradingPerformance';

/**
 * Interactive Controls Component
 *
 * Provides time period selectors and metric toggle controls for the trading performance widget
 * with state management and user preferences persistence.
 */
interface ExtendedInteractiveControlsProps {
  controls: TradingPerformanceControls;
  size?: { w: number; h: number };
  onControlsChange: (controls: TradingPerformanceControls) => void;
}

const InteractiveControls: React.FC<ExtendedInteractiveControlsProps> = ({
  controls,
  size = { w: 6, h: 2 },
  onControlsChange
}) => {
  const [expanded, setExpanded] = useState(false);

  // Time range options (extended to include shorter periods as per requirement)
  const timeRangeOptions: { value: TimeRange; label: string; tooltip: string }[] = [
    { value: '1D', label: '1D', tooltip: 'Last 24 hours' },
    { value: '1W', label: '1W', tooltip: 'Last 7 days' },
    { value: '1M', label: '1M', tooltip: 'Last 30 days' },
    { value: '3M', label: '3M', tooltip: 'Last 3 months' },
    { value: '6M', label: '6M', tooltip: 'Last 6 months' },
    { value: '1Y', label: '1Y', tooltip: 'Last year' },
    { value: 'ALL', label: 'ALL', tooltip: 'All time' }
  ];

  // Chart period options
  const chartPeriodOptions: { value: ChartPeriod; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  // Performance ordering options
  const orderOptions = [
    { value: 'pnl', label: 'P&L' },
    { value: 'winRate', label: 'Win Rate' },
    { value: 'trades', label: 'Trade Count' }
  ];

  // Update time range
  const handleTimeRangeChange = (timeRange: TimeRange) => {
    onControlsChange({
      ...controls,
      timeRange
    });
  };

  // Update chart period
  const handleChartPeriodChange = (chartPeriod: ChartPeriod) => {
    onControlsChange({
      ...controls,
      chartPeriod
    });
  };

  // Toggle metric visibility
  const handleMetricToggle = (metric: keyof TradingPerformanceControls) => {
    if (typeof controls[metric] === 'boolean') {
      onControlsChange({
        ...controls,
        [metric]: !controls[metric]
      });
    }
  };

  // Update currency pair filter
  const handleCurrencyFilterChange = (updates: Partial<CurrencyPairFilter>) => {
    onControlsChange({
      ...controls,
      currencyPairFilter: {
        ...controls.currencyPairFilter,
        ...updates
      }
    });
  };

  // Reset all controls to defaults
  const handleReset = () => {
    onControlsChange({
      timeRange: '1M' as TimeRange,
      chartPeriod: 'daily' as ChartPeriod,
      currencyPairFilter: {
        selectedPairs: [],
        minTrades: 5,
        performanceOrder: 'pnl'
      },
      showRiskMetrics: true,
      showDebugInfo: false
    });
  };

  const isCompact = size?.w && size.w < 6;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Display Controls
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Customize your performance view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 px-2"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary Controls - Always Visible */}
        <div className="flex items-center justify-between gap-4">
          {/* Time Period Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Label htmlFor="timeRange" className="text-sm font-medium whitespace-nowrap">
              <Clock className="h-4 w-4 inline mr-1" />
              Period:
            </Label>
            <Select value={controls.timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{option.tooltip}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart Period Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Label htmlFor="chartPeriod" className="text-sm font-medium whitespace-nowrap">
              View:
            </Label>
            <Select value={controls.chartPeriod} onValueChange={handleChartPeriodChange}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartPeriodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expanded Controls */}
        {expanded && (
          <div className="space-y-4 border-t pt-4">
            {/* Metric Toggles */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Metrics Visibility</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="riskMetrics" className="text-sm">
                      Risk Metrics
                    </Label>
                  </div>
                  <Switch
                    id="riskMetrics"
                    checked={controls.showRiskMetrics}
                    onCheckedChange={() => handleMetricToggle('showRiskMetrics')}
                  />
                </div>

                {!isCompact && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="debugInfo" className="text-sm">
                        Debug Info
                      </Label>
                    </div>
                    <Switch
                      id="debugInfo"
                      checked={controls.showDebugInfo}
                      onCheckedChange={() => handleMetricToggle('showDebugInfo')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Currency Pair Filters */}
            {!isCompact && (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Currency Pair Filters</Label>
                </div>

                <div className="space-y-3">
                  {/* Minimum Trades Filter */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="minTrades" className="text-sm">
                      Min Trades: {controls.currencyPairFilter.minTrades}
                    </Label>
                    <div className="flex items-center gap-2 w-32">
                      <Slider
                        id="minTrades"
                        value={[controls.currencyPairFilter.minTrades || 5]}
                        onValueChange={([value]) => handleCurrencyFilterChange({ minTrades: value })}
                        max={50}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Performance Order */}
                  <div className="flex items-center gap-3">
                    <Label htmlFor="performanceOrder" className="text-sm whitespace-nowrap">
                      Sort by:
                    </Label>
                    <Select
                      value={controls.currencyPairFilter.performanceOrder}
                      onValueChange={(value: any) => handleCurrencyFilterChange({ performanceOrder: value })}
                    >
                      <SelectTrigger className="h-8 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Active filters: {[
                    controls.timeRange !== 'ALL',
                    !controls.showRiskMetrics,
                    controls.showDebugInfo
                  ].filter(Boolean).length}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-3 text-xs"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Toggle Button for Compact Mode */}
        {isCompact && !expanded && (
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>Advanced settings hidden</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
              className="h-6 px-2 text-xs"
            >
              Show all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveControls;
/**
 * Performance Chart Utilities
 *
 * Reusable chart utilities for trading performance visualization
 * Includes data transformation, color schemes, and responsive configurations
 */

import { ChartDataPoint } from '../types/tradingPerformance';
import { Trade } from '../types/trade';
import moment from 'moment';

/**
 * Chart color schemes for different visualization types
 */
export const chartColorSchemes = {
  // Performance chart colors
  performance: {
    profit: {
      primary: '#22c55e',     // Green
      gradient: {
        start: '#22c55e',
        end: '#dcfce7'
      }
    },
    loss: {
      primary: '#ef4444',     // Red
      gradient: {
        start: '#ef4444',
        end: '#fef2f2'
      }
    },
    neutral: {
      primary: '#6b7280',     // Gray
      gradient: {
        start: '#6b7280',
        end: '#f3f4f6'
      }
    }
  },

  // Risk chart colors
  risk: {
    low: '#16a34a',          // Dark green
    medium: '#eab308',       // Yellow
    high: '#dc2626',         // Red
    critical: '#7f1d1d'      // Dark red
  },

  // Currency pair chart colors
  currency: {
    positive: '#059669',     // Emerald
    negative: '#dc2626',     // Red
    neutral: '#64748b'       // Slate
  }
} as const;

/**
 * Format value for display based on type
 */
export const formatChartValue = (
  value: number,
  type: 'currency' | 'percentage' | 'pips' = 'currency'
): string => {
  switch (type) {
    case 'currency':
      const sign = value >= 0 ? '+' : '';
      return `${sign}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

    case 'percentage':
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

    case 'pips':
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)} pips`;

    default:
      return value.toString();
  }
};

/**
 * Format date for chart display
 */
export const formatChartDate = (date: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): string => {
  const momentDate = moment(date);

  switch (period) {
    case 'daily':
      return momentDate.format('MMM DD');
    case 'weekly':
      return `W${momentDate.format('WW')}`;
    case 'monthly':
      return momentDate.format('MMM YYYY');
    default:
      return date;
  }
};

/**
 * Get color scheme for different chart types
 */
export const getColorScheme = (type: 'pnl' | 'winRate' | 'drawdown', value?: number): string => {
  switch (type) {
    case 'pnl':
      return value !== undefined && value >= 0
        ? chartColorSchemes.performance.profit.primary
        : chartColorSchemes.performance.loss.primary;

    case 'winRate':
      if (value === undefined) return chartColorSchemes.risk.medium;
      if (value >= 70) return chartColorSchemes.risk.low;
      if (value >= 50) return chartColorSchemes.risk.medium;
      if (value >= 30) return chartColorSchemes.risk.high;
      return chartColorSchemes.risk.critical;

    case 'drawdown':
      if (value === undefined) return chartColorSchemes.risk.medium;
      if (value <= 10) return chartColorSchemes.risk.low;
      if (value <= 20) return chartColorSchemes.risk.medium;
      if (value <= 30) return chartColorSchemes.risk.high;
      return chartColorSchemes.risk.critical;

    default:
      return chartColorSchemes.risk.medium;
  }
};

/**
 * Generate gradient definition for area charts
 */
export const generateGradientDefinition = (
  id: string,
  startColor: string,
  endColor: string,
  opacity: { start: number; end: number } = { start: 0.3, end: 0.05 }
) => ({
  id,
  x1: '0',
  y1: '0',
  x2: '0',
  y2: '1',
  stops: [
    {
      offset: '5%',
      stopColor: startColor,
      stopOpacity: opacity.start
    },
    {
      offset: '95%',
      stopColor: endColor,
      stopOpacity: opacity.end
    }
  ]
});

/**
 * Responsive chart configuration based on container size
 */
export const getResponsiveChartConfig = (
  width: number,
  height: number
) => {
  // Determine breakpoints
  const isSmall = width < 400;
  const isMedium = width < 600;
  const isLarge = width >= 800;

  return {
    margin: {
      top: isSmall ? 5 : 10,
      right: isSmall ? 5 : 10,
      bottom: isSmall ? 5 : 10,
      left: isSmall ? 5 : 10
    },
    fontSize: {
      axis: isSmall ? 10 : isMedium ? 12 : 14,
      tooltip: isSmall ? 11 : 12
    },
    animationDuration: 300,
    showGrid: !isSmall,
    showLegend: !isSmall,
    showTooltip: true,
    tooltipPosition: isSmall ? 'left' : 'center'
  };
};

/**
 * Custom chart tooltip formatter
 */
export const createChartTooltip = (
  data: any,
  label: string,
  type: 'performance' | 'risk' | 'currency' = 'performance'
) => {
  const getTooltipContent = () => {
    switch (type) {
      case 'performance':
        return `
          <div class="chart-tooltip-performance">
            <p class="font-medium">${label}</p>
            <p class="${data.value >= 0 ? 'text-green-600' : 'text-red-600'}">
              P&L: ${formatChartValue(data.value, 'currency')}
            </p>
            <p class="text-xs text-muted-foreground">
              Trades: ${data.trades || 0} | Win Rate: ${data.winRate?.toFixed(1) || 0}%
            </p>
            ${data.pipMovement ? `<p class="text-xs">Pip Movement: ${data.pipMovement}</p>` : ''}
          </div>
        `;

      case 'risk':
        return `
          <div class="chart-tooltip-risk">
            <p class="font-medium">${label}</p>
            <p class="text-red-600">
              Drawdown: ${formatChartValue(data.maxDrawdown || 0, 'percentage')}
            </p>
            <p class="text-xs text-muted-foreground">
              Risk: ${data.riskScore ? data.riskScore.toFixed(1) : 'N/A'}
            </p>
          </div>
        `;

      case 'currency':
        return `
          <div class="chart-tooltip-currency">
            <p class="font-medium">${label}</p>
            <p class="${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}">
              P&L: ${formatChartValue(data.pnl, 'currency')}
            </p>
            <p class="text-xs text-muted-foreground">
              Trades: ${data.trades} | Win Rate: ${data.winRate?.toFixed(1)}%
            </p>
          </div>
        `;

      default:
        return `<div class="chart-tooltip-default"><p>${label}: ${data.value}</p></div>`;
    }
  };

  return {
    label,
    value: getTooltipContent(),
    data,
    className: `chart-tooltip-${type}`
  };
};

/**
 * Calculate y-axis domain for chart
 */
export const calculateYAxisDomain = (
  data: ChartDataPoint[] | any[],
  accessor: string = 'value',
  padding: number = 0.1
) => {
  const values = data.map(item => {
    if (accessor in item) {
      return item[accessor];
    }
    return item.value || 0;
  }).filter(val => typeof val === 'number' && !isNaN(val));

  if (values.length === 0) return [0, 100];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const pad = range * padding;

  return [Math.floor(min - pad), Math.ceil(max + pad)];
};

/**
 * Generate responsive container props
 */
export const getResponsiveProps = (size?: { w: number; h: number }) => {
  if (!size) {
    return {
      width: '100%',
      height: '100%'
    };
  }

  // Convert grid units to pixels (assuming 20px per unit)
  const width = `${size.w * 20}px`;
  const height = `${size.h * 20}px`;

  return {
    width: width,
    height: height,
    style: {
      width: width,
      height: height
    }
  };
};

/**
 * Time-based data filtering utilities
 */
export const filterDataByTimeRange = (
  data: any[],
  timeRange: string,
  dateKey: string = 'date'
) => {
  const now = moment();

  return data.filter(item => {
    const itemDate = moment(item[dateKey]);

    switch (timeRange) {
      case '1D':
      case 'week':
        return itemDate.isAfter(now.clone().subtract(7, 'days'));

      case '1M':
      case 'month':
        return itemDate.isAfter(now.clone().subtract(1, 'month'));

      case '3M':
      case 'quarter':
        return itemDate.isAfter(now.clone().subtract(3, 'months'));

      case '6M':
        return itemDate.isAfter(now.clone().subtract(6, 'months'));

      case '1Y':
      case 'year':
        return itemDate.isAfter(now.clone().subtract(1, 'year'));

      case '2Y':
        return itemDate.isAfter(now.clone().subtract(2, 'years'));

      case 'ALL':
      case 'all':
      default:
        return true;
    }
  });
};

/**
 * Data aggregation utilities
 */
export const aggregateChartData = (
  data: any[],
  aggregator: string,
  valueKey: string = 'value'
): any[] => {
  switch (aggregator) {
    case 'sum':
      return [{
        [valueKey]: data.reduce((sum, item) => sum + (item[valueKey] || 0), 0),
        count: data.length
      }];

    case 'average':
      const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
      return [{
        [valueKey]: data.length > 0 ? total / data.length : 0,
        count: data.length
      }];

    case 'max':
      const maxItem = data.reduce((max, item) =>
        (item[valueKey] || 0) > (max[valueKey] || 0) ? item : max
      );
      return [maxItem];

    case 'min':
      const minItem = data.reduce((min, item) =>
        (item[valueKey] || 0) < (min[valueKey] || 0) ? item : min
      );
      return [minItem];

    default:
      return data;
  }
};

/**
 * Chart animation configuration
 */
export const chartAnimationConfig = {
  duration: 300,
  easing: 'ease-in-out',
  delay: 0,
  staggerDelay: 50
};

/**
 * Custom chart themes
 */
export const chartThemes = {
  light: {
    axis: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 12
    },
    grid: {
      color: 'hsl(var(--border))',
      strokeDasharray: '2 2'
    },
    tooltip: {
      background: 'hsl(var(--background))',
      border: 'hsl(var(--border))',
      textColor: 'hsl(var(--foreground))'
    }
  },
  dark: {
    axis: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: 12
    },
    grid: {
      color: 'hsl(210, 40%, 98%)',
      strokeDasharray: '2 2'
    },
    tooltip: {
      background: 'hsl(var(--popover))',
      border: 'hsl(var(--border))',
      textColor: 'hsl(var(--popover-foreground))'
    }
  }
};

/**
 * Accessibility helpers for charts
 */
export const accessibilityHelpers = {
  getAriaLabel: (chartType: string, data: any[]) => {
    return `${chartType} chart showing performance data for ${data.length} data points`;
  },

  getLegendAriaDescription: (legendItems: string[]) => {
    return `Legend showing: ${legendItems.join(', ')}`;
  },

  getTooltipAriaDescription: (data: any, type: string) => {
    return `${type} tooltip: ${Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')}`;
  }
};

/**
 * Performance optimization for large datasets
 */
export const optimizeChartData = (
  data: ChartDataPoint[],
  maxPoints: number = 100
): ChartDataPoint[] => {
  if (data.length <= maxPoints) {
    return data;
  }

  // Simple downsampling: take every nth point
  const step = Math.floor(data.length / maxPoints);
  const optimized: ChartDataPoint[] = [];

  for (let i = 0; i < data.length; i += step) {
    const point = data[i];
    if (point) {
      optimized.push(point);
    }
  }

  // Ensure we always include the last point
  const lastPoint = data[data.length - 1];
  if (lastPoint && optimized.length > 0 && optimized[optimized.length - 1] !== lastPoint) {
    optimized.push(lastPoint);
  }

  return optimized;
};

/**
 * Export all utilities as a single object for easy access
 */
export const performanceChartUtils = {
  formatChartValue,
  formatChartDate,
  getColorScheme,
  generateGradientDefinition,
  getResponsiveChartConfig,
  createChartTooltip,
  calculateYAxisDomain,
  getResponsiveProps,
  filterDataByTimeRange,
  aggregateChartData,
  optimizeChartData,
  accessibilityHelpers
};
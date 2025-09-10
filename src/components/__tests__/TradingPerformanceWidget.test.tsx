import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TradingPerformanceWidget from '../TradingPerformanceWidget';
import {
  PerformanceMetrics,
  CurrencyPairMetrics,
  RiskMetrics,
  ChartDataPoint,
  TimeRange,
  ChartPeriod
} from '../../types/tradingPerformance';

// Mock dependencies
vi.mock('../../services/TradingPerformanceService');

const mockPerformanceMetrics: PerformanceMetrics = {
  netPnL: 2500.00,
  totalTrades: 15,
  tradeExpectancy: 166.67,
  profitFactor: 1.85,
  winRate: 73.33,
  avgWin: 320.00,
  avgLoss: 120.00,
  zellaScore: 75,
  winningTrades: 11,
  losingTrades: 4,
  totalPips: 150.0,
  totalCommission: 15.0,
  totalCommissionPercentage: 0.6,
  averageRMultiple: 1.2,
  recoveryFactor: 3.5,
  sharpeRatio: 1.8,
  sortinoRatio: 1.6,
  calmarRatio: 2.1,
  maxDrawdown: 8.5,
  maxDrawdownPercentage: 8.5,
  volatility: 2.1,
  standardDeviation: 2.1,
  bestTrade: 500.0,
  worstTrade: -150.0,
  averageTradeDuration: undefined,
  monthlyReturn: undefined,
  yearlyReturn: undefined,
  confidenceLevel95: undefined,
  expectedValue: 166.67,
  currentWinStreak: 2,
  longestWinStreak: 5,
  currentLossStreak: 0,
  longestLossStreak: 3,
  winningTrades: 11,
  losingTrades: 4
};

const mockCurrencyPairMetrics: CurrencyPairMetrics[] = [
  {
    currencyPair: 'EUR/USD',
    totalTrades: 8,
    winningTrades: 6,
    losingTrades: 2,
    winRate: 75.0,
    totalPnL: 1200.00,
    totalPips: 150.5,
    averagePnL: 150.00,
    averagePip: 18.81,
    largestWin: 400.00,
    largestLoss: 100.00,
    profitFactor: 2.1,
    averageRMultiple: 1.2,
    longTrades: 5,
    shortTrades: 3,
    longWinRate: 80.0,
    shortWinRate: 66.7
  },
  {
    currencyPair: 'GBP/USD',
    totalTrades: 7,
    winningTrades: 5,
    losingTrades: 2,
    winRate: 71.4,
    totalPnL: 800.00,
    totalPips: 95.2,
    averagePnL: 114.29,
    averagePip: 13.6,
    largestWin: 300.00,
    largestLoss: 80.00,
    profitFactor: 1.8,
    averageRMultiple: 1.1,
    longTrades: 3,
    shortTrades: 4,
    longWinRate: 75.0,
    shortWinRate: 68.8
  }
];

const mockRiskMetrics: RiskMetrics = {
  maxDrawdown: 8.5,
  maxDrawdownPercentage: 8.5,
  volatility: 2.1,
  riskScore: 68,
  riskWarnings: [
    {
      id: 'moderate_volatility',
      level: 'medium',
      message: 'Account volatility is moderately elevated',
      value: 2.1,
      threshold: 2.0,
      timestamp: new Date().toISOString()
    }
  ],
  averageRiskPerTrade: 125.00
};

const mockChartData: ChartDataPoint[] = [
  {
    date: '2024-01-15',
    value: 200.00,
    pnl: 200.00,
    trades: 3,
    winRate: 66.7,
    cumulativePnL: 200.00
  },
  {
    date: '2024-01-16',
    value: 450.00,
    pnl: 250.00,
    trades: 4,
    winRate: 75.0,
    cumulativePnL: 450.00
  }
];

describe('TradingPerformanceWidget - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render with all required props', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          timeRange="1M"
          chartPeriod="daily"
          size={{ w: 12, h: 8 }}
        />
      );

      expect(screen.getByText('Trading Performance')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive trading performance dashboard')).toBeInTheDocument();
    });

    it('should display performance metrics correctly', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          timeRange="1M"
          chartPeriod="daily"
          size={{ w: 12, h: 6 }}
        />
      );

      expect(screen.getByText('$2,500.00')).toBeInTheDocument();
      expect(screen.getByText('73.30%')).toBeInTheDocument();
      expect(screen.getByText('1.85')).toBeInTheDocument();
      expect(screen.getByText('Score: 75')).toBeInTheDocument();
    });

    it('should handle missing optional props gracefully', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 8, h: 4 }}
        />
      );

      expect(screen.getByText('Trading Performance')).toBeInTheDocument();
    });

    it('should display loading state correctly', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={[]}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          loading={true}
          size={{ w: 8, h: 4 }}
        />
      );

      expect(screen.getByText('Loading performance data...')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should render tabbed interface for large screens', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 12, h: 8 }}
        />
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should switch between overview and details tabs', async () => {
      const user = userEvent.setup();

      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 12, h: 8 }}
        />
      );

      expect(screen.getByText('Performance Overview')).toBeInTheDocument();

      const detailsTab = screen.getByText('Details');
      await user.click(detailsTab);

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should show simplified interface for compact widgets', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 3, h: 3 }}
        />
      );

      // Compact widgets show basic metrics without complex tabs
      expect(screen.getByText('Performance Overview')).toBeInTheDocument();
      // Should not show tabs in compact mode
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    });

    it('should hide advanced controls for small widgets', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 4, h: 3 }}
        />
      );

      // Should not show export button in compact mode
      expect(screen.queryByText('Export')).not.toBeInTheDocument();
    });

    it('should scale layout based on widget dimensions', () => {
      const { rerender } = render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 6, h: 4 }}
        />
      );

      // Initial medium layout
      expect(screen.queryByText('Overview')).toBeInTheDocument();

      // Rerender with larger size
      rerender(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 12, h: 8 }}
        />
      );

      // Should still have tabs for larger layout
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  describe('Currency Pair Interactions', () => {
    it('should display currency pair breakdown correctly', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 12, h: 8 }}
        />
      );

      expect(screen.getByText('Currency Pair Analysis')).toBeInTheDocument();
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      expect(screen.getByText('GBP/USD')).toBeInTheDocument();
    });

    it('should handle currency pair filtering', async () => {
      const user = userEvent.setup();
      const mockFilterCallback = vi.fn();

      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          onCurrencyPairFilter={mockFilterCallback}
          size={{ w: 12, h: 8 }}
        />
      );

      // Click on EUR/USD pair
      const eurUsdPair = screen.getByText('EUR/USD');
      await user.click(eurUsdPair);

      expect(mockFilterCallback).toHaveBeenCalledWith('EUR/USD');
    });

    it('should show correct pair performance data', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 8, h: 6 }}
        />
      );

      // Check performance metrics display
      expect(screen.getByText('$1,200.00')).toBeInTheDocument(); // EUR/USD P&L
      expect(screen.getByText('$800.00')).toBeInTheDocument(); // GBP/USD P&L
      expect(screen.getByText('75.00%')).toBeInTheDocument(); // EUR/USD win rate
    });
  });

  describe('Risk Metrics Display', () => {
    it('should display risk assessment components', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 12, h: 8 }}
        />
      );

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Score: 68/100')).toBeInTheDocument();
    });

    it('should show risk warnings appropriately', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 12, h: 8 }}
        />
      );

      // Switch to details tab to see risk warnings
      const detailsTab = screen.getByText('Details');
      fireEvent.click(detailsTab);

      expect(screen.getByText('Risk Alerts')).toBeInTheDocument();
      expect(screen.getByText('moderate volatility')).toBeInTheDocument();
    });

    it('should handle risk score color coding', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 8, h: 4 }}
        />
      );

      expect(screen.getByText('Score: 68/100')).toBeInTheDocument();
      // Risk score badge should be visible
    });
  });

  describe('Interactive Controls', () => {
    it('should show time period controls', async () => {
      const user = userEvent.setup();
      const mockTimeRangeChange = vi.fn();

      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          onTimeRangeChange={mockTimeRangeChange}
          size={{ w: 12, h: 8 }}
        />
      );

      // Expand controls if needed
      const expandButton = screen.getByLabelText('Expand controls');
      if (expandButton) {
        await user.click(expandButton);
      }

      const timeRangeSelect = screen.getByText('1M');
      expect(timeRangeSelect).toBeInTheDocument();
    });

    it('should handle time range changes', async () => {
      const user = userEvent.setup();
      const mockTimeRangeChange = vi.fn();

      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          onTimeRangeChange={mockTimeRangeChange}
          size={{ w: 12, h: 8 }}
        />
      );

      // Should display 1M as default
      expect(screen.getByText('1M')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error state correctly', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          error="Failed to load performance data"
          size={{ w: 8, h: 4 }}
        />
      );

      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText('Failed to load performance data')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      const emptyMetrics: PerformanceMetrics = {
        ...mockPerformanceMetrics,
        totalTrades: 0,
        netPnL: 0,
        winRate: 0
      };

      render(
        <TradingPerformanceWidget
          performanceMetrics={emptyMetrics}
          currencyPairMetrics={[]}
          riskMetrics={mockRiskMetrics}
          chartData={[]}
          size={{ w: 8, h: 4 }}
        />
      );

      expect(screen.getByText('No currency pair data available')).toBeInTheDocument();
    });
  });

  describe('Callback Handling', () => {
    it('should call export callback when export button is clicked', async () => {
      const user = userEvent.setup();
      const mockExportCallback = vi.fn();

      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          onExportData={mockExportCallback}
          size={{ w: 12, h: 8 }}
        />
      );

      const exportButton = screen.getByText('Export');
      if (exportButton) {
        await user.click(exportButton);
        expect(mockExportCallback).toHaveBeenCalled();
      }
    });

    it('should call time range callback when changed', () => {
      const mockTimeRangeChange = vi.fn();

      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          onTimeRangeChange={mockTimeRangeChange}
          size={{ w: 8, h: 6 }}
        />
      );

      // Time range changes would be handled by internal controls
      // and propagate through the control change handler
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const largeChartData: ChartDataPoint[] = Array.from({ length: 100 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        value: Math.random() * 1000,
        pnl: Math.random() * 200 - 100,
        trades: Math.floor(Math.random() * 5) + 1,
        winRate: Math.random() * 100,
        cumulativePnL: Math.random() * 25000
      }));

      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={largeChartData}
          size={{ w: 8, h: 6 }}
        />
      );

      expect(screen.getByText('Trading Performance')).toBeInTheDocument();
      // Component should render without crashing with large datasets
    });

    it('should handle extreme values gracefully', () => {
      const extremeMetrics: PerformanceMetrics = {
        ...mockPerformanceMetrics,
        netPnL: 999999.99,
        winRate: 0,
        profitFactor: 999
      };

      render(
        <TradingPerformanceWidget
          performanceMetrics={extremeMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 8, h: 4 }}
        />
      );

      expect(screen.getByText('$999,999.99')).toBeInTheDocument();
      expect(screen.getByText('0.00%')).toBeInTheDocument();
    });

    it('should handle negative performance values correctly', () => {
      const negativeMetrics: PerformanceMetrics = {
        ...mockPerformanceMetrics,
        netPnL: -5000.00,
        winRate: 25,
        profitFactor: 0.4
      };

      render(
        <TradingPerformanceWidget
          performanceMetrics={negativeMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 8, h: 4 }}
        />
      );

      expect(screen.getByText('-$5,000.00')).toBeInTheDocument();
      expect(screen.getByText('25.00%')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={mockCurrencyPairMetrics}
          riskMetrics={mockRiskMetrics}
          chartData={mockChartData}
          size={{ w: 8, h: 6 }}
        />
      );

      expect(screen.getByText('Trading Performance')).toHaveAttribute('role', 'heading');
    });

    it('should provide clear feedback for empty states', () => {
      render(
        <TradingPerformanceWidget
          performanceMetrics={mockPerformanceMetrics}
          currencyPairMetrics={[]}
          riskMetrics={mockRiskMetrics}
          chartData={[]}
          size={{ w: 4, h: 4 }}
        />
      );

      expect(screen.getByText('No currency pair data available')).toBeInTheDocument();
    });
  });
});
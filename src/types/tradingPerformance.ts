import { Trade } from './trade';

// Extended performance metrics extending base Metrics
export interface PerformanceMetrics {
  // Basic metrics (from existing Metrics interface)
  netPnL: number;
  totalTrades: number;
  tradeExpectancy: number;
  profitFactor: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  zellaScore: number;

  // Trading statistics
  winningTrades: number;
  losingTrades: number;

  // Extended metrics for trading performance
  totalPips?: number;
  totalCommission: number;
  totalCommissionPercentage: number;
  averageRMultiple?: number;
  recoveryFactor?: number;

  // Sharpe ratio and risk-adjusted returns
  sharpeRatio?: number;
  sortinoRatio?: number;
  calmarRatio?: number;

  // Drawdown metrics
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  averageDrawdown?: number;

  // Additional statistics
  averageTradeDuration?: number;
  bestTrade?: number;
  worstTrade?: number;
  expectedValue?: number;

  // Risk metrics
  volatility?: number;
  valueAtRisk?: number;

  // Win streak analysis
  currentWinStreak: number;
  longestWinStreak: number;
  currentLossStreak: number;
  longestLossStreak: number;

  // Monthly/yearly performance
  monthlyReturn?: number;
  yearlyReturn?: number;

  // Confidence intervals
  confidenceLevel95?: number;
  standardDeviation?: number;
}

// Chart data point for performance visualization
export interface ChartDataPoint {
  date: string;
  value: number;
  pnl: number;
  trades: number;
  winRate: number;
  pipMovement?: number;
  cumulativePnL: number;
  placement?: 'start' | 'middle' | 'end';
}

// Futures instrument specific performance metrics
export interface InstrumentMetrics {
  instrument: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPips: number;
  averagePnL: number;
  averagePip: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  averageRMultiple?: number;
  longTrades: number;
  shortTrades: number;
  longWinRate: number;
  shortWinRate: number;
  averageHoldTime?: number;
  sessionPerformance: {
    asian: { trades: number; winRate: number; pnl: number } | null;
    european: { trades: number; winRate: number; pnl: number } | null;
    us: { trades: number; winRate: number; pnl: number } | null;
    overlap: { trades: number; winRate: number; pnl: number } | null;
  };
  strategyPerformance: { [strategy: string]: {
    trades: number;
    winRate: number;
    pnl: number;
  }};
}

// Risk metrics for comprehensive risk assessment
export interface RiskMetrics {
  // Maximum drawdown
  maxDrawdown: number;
  maxDrawdownPercentage: number;

  // Current drawdown
  currentDrawdown?: number;
  currentDrawdownPercentage?: number;

  // Risk per trade
  averageRiskPerTrade?: number;
  riskPerTradePercentage?: number;

  // Risk/Reward ratios
  averageRiskReward: number;
  bestRiskReward: number;
  worstRiskReward: number;

  // Risk-adjusted performance
  sharpeRatio?: number;
  sortinoRatio?: number;

  // Volatility metrics
  volatility?: number; // Standard deviation of returns
  valueAtRisk?: number; // VaR at 95% confidence

  // Stress testing
  stressTestResults?: {
    source: string;
    simulatedDrawdown: number;
    recoveryTime: number;
  }[];

  // Risk warnings
  riskWarnings: RiskWarning[];
  riskScore: number; // 0-100, higher is better (lower risk)
}

// Individual risk warning
export interface RiskWarning {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value?: number;
  threshold?: number;
  timestamp: string;
}

// Time range for performance filtering
export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

// Chart period for visualization
export type ChartPeriod = 'daily' | 'weekly' | 'monthly';

// Widget props extending base WidgetProps
export interface TradingPerformanceWidgetProps {
  performanceMetrics: PerformanceMetrics;
  instrumentMetrics: InstrumentMetrics[];
  riskMetrics: RiskMetrics;
  chartData: ChartDataPoint[];
  timeRange: TimeRange;
  chartPeriod: ChartPeriod;
  loading?: boolean;
  error?: string;
  onTimeRangeChange?: (range: TimeRange) => void;
  onChartPeriodChange?: (period: ChartPeriod) => void;
  onInstrumentFilter?: (instrument: string | null) => void;
  onExportData?: () => void;
  size: { w: number; h: number };
}

// Filter options for futures instruments
export interface InstrumentFilter {
  selectedInstruments: string[];
  minTrades?: number;
  performanceOrder: 'pnl' | 'winRate' | 'trades';
}

// Interactive controls state
export interface TradingPerformanceControls {
  timeRange: TimeRange;
  chartPeriod: ChartPeriod;
  instrumentFilter: InstrumentFilter;
  showRiskMetrics: boolean;
  showDebugInfo: boolean;
}

// Component sub-props for modular architecture
export interface PerformanceMetricsPanelProps {
  metrics: PerformanceMetrics;
  size: { w: number; h: number };
}

export interface PerformanceChartPanelProps {
  data: ChartDataPoint[];
  period: ChartPeriod;
  size: { w: number; h: number };
  onDataPointClick?: (point: ChartDataPoint) => void;
}

export interface InstrumentBreakdownProps {
  metrics: InstrumentMetrics[];
  filter: InstrumentFilter;
  size: { w: number; h: number };
  onInstrumentSelect?: (instrument: string) => void;
  onFilterChange?: (filter: InstrumentFilter) => void;
}

export interface RiskMetricsDisplayProps {
  riskMetrics: RiskMetrics;
  size: { w: number; h: number };
  showDetails?: boolean;
}

export interface InteractiveControlsProps {
  controls: TradingPerformanceControls;
  size: { w: number; h: number };
  onControlsChange: (controls: TradingPerformanceControls) => void;
}

// Service method parameters
export interface PerformanceCalculationParams {
  trades: Trade[];
  startDate?: string;
  endDate?: string;
  instruments?: string[];
  timeRange?: TimeRange;
  includeRiskMetrics?: boolean;
}

// Utility function types
export interface ChartFormatter {
  formatValue: (value: number, type: 'currency' | 'percentage' | 'pips') => string;
  formatDate: (date: string, period: ChartPeriod) => string;
  getColorScheme: (type: 'pnl' | 'winRate' | 'drawdown') => string[];
}

// Configuration constants
export const TIME_RANGES: Record<TimeRange, string> = {
  '1D': '1 Day',
  '1W': '1 Week',
  '1M': '1 Month',
  '3M': '3 Months',
  '6M': '6 Months',
  '1Y': '1 Year',
  '2Y': '2 Years',
  'ALL': 'All Time'
};

export const CHART_PERIODS: Record<ChartPeriod, string> = {
  'daily': 'Daily',
  'weekly': 'Weekly',
  'monthly': 'Monthly'
};

export const RISK_WARNING_THRESHOLDS = {
  maxDrawdown: {
    low: 5,
    medium: 10,
    high: 20,
    critical: 30
  },
  volatility: {
    low: 5,
    medium: 10,
    high: 20,
    critical: 30
  },
  concentration: {
    low: 20,
    medium: 40,
    high: 60,
    critical: 80
  }
} as const;
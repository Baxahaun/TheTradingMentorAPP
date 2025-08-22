
export interface Trade {
  id: string;
  
  // Account Information (NEW)
  accountId: string; // References the trading account this trade belongs to
  
  // Tagging System (NEW)
  tags?: string[]; // User-defined tags for flexible categorization
  
  // Currency Pair Information
  currencyPair: string; // e.g., "EUR/USD", "GBP/JPY"
  
  // Timing Information
  date: string;
  timeIn: string;
  timeOut?: string;
  session?: 'asian' | 'european' | 'us' | 'overlap'; // Trading session
  
  // Trade Direction
  side: 'long' | 'short';
  
  // Pricing Information
  entryPrice: number;
  exitPrice?: number;
  spread?: number; // Entry spread in pips
  
  // Position Sizing (Forex-specific)
  lotSize: number; // e.g., 1.5 for 1.5 lots
  lotType: 'standard' | 'mini' | 'micro'; // 100k, 10k, 1k units
  units: number; // Actual units traded (calculated from lotSize * lotType)
  
  // Risk Management
  stopLoss?: number;
  takeProfit?: number;
  riskAmount?: number; // Risk amount in account currency
  rMultiple?: number; // Risk-reward multiple
  leverage?: number; // e.g., 50 for 50:1 leverage
  marginUsed?: number; // Margin used in account currency
  
  // P&L Information (Forex-specific)
  pips?: number; // Pips gained/lost
  pipValue?: number; // Value per pip in account currency
  pnl?: number; // P&L in account currency
  commission: number; // Commission/fees
  swap?: number; // Overnight financing costs
  
  // Account Information (DEPRECATED - replaced by Account interface)
  accountCurrency: string; // USD, EUR, GBP, etc.
  
  // Strategy & Analysis
  strategy?: string;
  marketConditions?: string;
  timeframe?: string;
  confidence?: number;
  emotions?: string;
  notes?: string;
  screenshots?: string[];
  
  // Trade Status
  status: 'open' | 'closed';
  
  // ENHANCED FEATURES - Optional for backward compatibility
  
  // Setup Classification (NEW)
  setup?: TradeSetup;
  
  // Pattern Recognition (NEW)
  patterns?: TradePattern[];
  
  // Partial Close Tracking (NEW)
  partialCloses?: PartialClose[];
  positionHistory?: PositionEvent[];
  
  // Calculated fields (NEW)
  setupPerformance?: SetupMetrics;
  patternConfluence?: number;
  positionManagementScore?: number;
}

// Trading Account Interface (NEW)
export interface TradingAccount {
  id: string;
  name: string; // User-friendly name like "Live Account", "Demo MT4", etc.
  type: 'live' | 'demo'; // Account type
  broker: string; // Broker name
  currency: string; // Account base currency (USD, EUR, etc.)
  balance: number; // Current account balance
  initialBalance: number; // Starting balance for calculations
  platform: 'mt4' | 'mt5' | 'manual' | 'other'; // Trading platform
  description?: string; // Optional description
  isActive: boolean; // Whether this account is currently active
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Account Form Data Interface (NEW)
export interface AccountFormData {
  name: string;
  type: 'live' | 'demo';
  broker: string;
  currency: string;
  balance: string;
  initialBalance: string;
  platform: 'mt4' | 'mt5' | 'manual' | 'other';
  description: string;
}

// Account Statistics Interface (NEW)
export interface AccountStats {
  accountId: string;
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  currentBalance: number;
  roi: number; // Return on Investment
  sharpeRatio?: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  winStreak: number;
  lossStreak: number;
}


export interface TradeFormData {
  // Tagging System
  tags: string;
  
  // Currency Pair Information
  currencyPair: string;
  
  // Timing Information
  date: string;
  timeIn: string;
  timeOut: string;
  session: string;
  
  // Trade Direction
  side: 'long' | 'short';
  
  // Pricing Information
  entryPrice: string;
  exitPrice: string;
  spread: string;
  
  // Position Sizing (Forex-specific)
  lotSize: string;
  lotType: 'standard' | 'mini' | 'micro';
  
  // Risk Management
  stopLoss: string;
  takeProfit: string;
  riskAmount: string;
  leverage: string;
  
  // P&L Information
  commission: string;
  swap: string;
  
  // Account Information
  accountCurrency: string;
  
  // Strategy & Analysis
  strategy: string;
  marketConditions: string;
  timeframe: string;
  confidence: string;
  emotions: string;
  notes: string;
}

// Forex-specific constants and utilities
export const CURRENCY_PAIRS = {
  MAJOR: [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
    'AUD/USD', 'USD/CAD', 'NZD/USD'
  ],
  MINOR: [
    'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/AUD', 
    'EUR/CAD', 'GBP/JPY', 'GBP/CHF', 'AUD/JPY'
  ],
  EXOTIC: [
    'USD/ZAR', 'USD/TRY', 'USD/MXN', 'EUR/TRY',
    'GBP/ZAR', 'AUD/ZAR'
  ]
} as const;

export const LOT_SIZES = {
  standard: 100000,
  mini: 10000,
  micro: 1000
} as const;

export const TRADING_SESSIONS = {
  asian: { name: 'Asian', hours: '21:00-06:00 GMT' },
  european: { name: 'European', hours: '07:00-16:00 GMT' },
  us: { name: 'US', hours: '13:00-22:00 GMT' },
  overlap: { name: 'Overlap', hours: 'Multiple sessions' }
} as const;

// Utility function to determine pip decimal places
export const getPipDecimalPlaces = (currencyPair: string): number => {
  const jpyPairs = ['JPY', 'HUF', 'KRW', 'CLP', 'ISK', 'PYG'];
  const baseCurrency = currencyPair.split('/')[1];
  return jpyPairs.includes(baseCurrency || '') ? 2 : 4;
};

// Utility function to calculate pip value
export const calculatePipValue = (
  currencyPair: string, 
  lotSize: number, 
  lotType: keyof typeof LOT_SIZES,
  accountCurrency: string = 'USD'
): number => {
  const units = lotSize * LOT_SIZES[lotType];
  const pipDecimals = getPipDecimalPlaces(currencyPair);
  const pipSize = Math.pow(10, -pipDecimals);
  
  // Simplified calculation - in real implementation, would need current exchange rates
  // This assumes USD account currency and provides base calculation
  return (pipSize * units);
};

// Utility function to calculate pips from price difference
export const calculatePips = (
  entryPrice: number, 
  exitPrice: number, 
  currencyPair: string, 
  side: 'long' | 'short'
): number => {
  const pipDecimals = getPipDecimalPlaces(currencyPair);
  const pipSize = Math.pow(10, -pipDecimals);
  
  let priceDifference = exitPrice - entryPrice;
  if (side === 'short') {
    priceDifference = entryPrice - exitPrice;
  }
  
  return priceDifference / pipSize;
};

// ===== ENHANCED TRADE FEATURES =====

// Setup Classification Types
export enum SetupType {
  // Trend Following
  TREND_CONTINUATION = 'trend_continuation',
  PULLBACK_ENTRY = 'pullback_entry',
  BREAKOUT_CONTINUATION = 'breakout_continuation',
  
  // Reversal
  SUPPORT_RESISTANCE_BOUNCE = 'support_resistance_bounce',
  DOUBLE_TOP_BOTTOM = 'double_top_bottom',
  HEAD_SHOULDERS = 'head_shoulders',
  
  // Breakout
  RANGE_BREAKOUT = 'range_breakout',
  TRIANGLE_BREAKOUT = 'triangle_breakout',
  FLAG_PENNANT_BREAKOUT = 'flag_pennant_breakout',
  
  // News/Event
  NEWS_REACTION = 'news_reaction',
  ECONOMIC_DATA = 'economic_data',
  CENTRAL_BANK = 'central_bank',
  
  // Custom
  CUSTOM = 'custom'
}

export interface ConfluenceFactor {
  id: string;
  name: string;
  category: 'technical' | 'fundamental' | 'sentiment' | 'timing';
  weight: number; // 1-5 importance
  description: string;
}

export interface CustomSetup {
  id: string;
  name: string;
  description: string;
  category: string;
  confluenceFactors: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TradeSetup {
  id: string;
  type: SetupType;
  subType?: string;
  confluence: ConfluenceFactor[];
  timeframe: string;
  marketCondition: 'trending' | 'ranging' | 'breakout' | 'reversal';
  quality: 1 | 2 | 3 | 4 | 5; // Setup quality rating
  notes?: string;
  customSetup?: CustomSetup;
}

export interface SetupMetrics {
  winRate: number;
  averageRMultiple: number;
  profitFactor: number;
  totalTrades: number;
  averageHoldTime: number;
  bestPerformingTimeframe: string;
  worstPerformingTimeframe: string;
}

// Pattern Recognition Types
export enum PatternCategory {
  CANDLESTICK = 'candlestick',
  CHART_PATTERN = 'chart_pattern',
  SUPPORT_RESISTANCE = 'support_resistance',
  TREND_LINE = 'trend_line',
  FIBONACCI = 'fibonacci',
  CUSTOM = 'custom'
}

export enum PatternType {
  // Candlestick Patterns
  DOJI = 'doji',
  HAMMER = 'hammer',
  ENGULFING = 'engulfing',
  PIN_BAR = 'pin_bar',
  INSIDE_BAR = 'inside_bar',
  
  // Chart Patterns
  TRIANGLE = 'triangle',
  FLAG = 'flag',
  PENNANT = 'pennant',
  WEDGE = 'wedge',
  RECTANGLE = 'rectangle',
  
  // Support/Resistance
  HORIZONTAL_LEVEL = 'horizontal_level',
  DYNAMIC_LEVEL = 'dynamic_level',
  PSYCHOLOGICAL_LEVEL = 'psychological_level',
  
  // Trend Lines
  ASCENDING_TREND = 'ascending_trend',
  DESCENDING_TREND = 'descending_trend',
  CHANNEL_LINES = 'channel_lines',
  
  // Fibonacci
  RETRACEMENT = 'retracement',
  EXTENSION = 'extension',
  CLUSTER = 'cluster',
  
  // Custom
  CUSTOM = 'custom'
}

export interface CustomPattern {
  id: string;
  name: string;
  description: string;
  category: PatternCategory;
  reliability: number;
  timeframes: string[];
  marketConditions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TradePattern {
  id: string;
  type: PatternType;
  timeframe: string;
  quality: 1 | 2 | 3 | 4 | 5;
  confluence: boolean;
  description?: string;
  customPattern?: CustomPattern;
}

// Partial Close Tracking Types
export interface PartialClose {
  id: string;
  timestamp: string;
  lotSize: number;
  price: number;
  reason: 'profit_taking' | 'risk_reduction' | 'trailing_stop' | 'manual' | 'other';
  remainingLots: number;
  pnlRealized: number;
  notes?: string;
}

export interface PositionEvent {
  id: string;
  timestamp: string;
  type: 'entry' | 'partial_close' | 'full_close' | 'stop_adjustment' | 'target_adjustment';
  lotSize: number;
  price: number;
  totalPosition: number;
  averagePrice: number;
}

export interface PositionSummary {
  totalLots: number;
  averageEntryPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  riskAmount: number;
  currentRMultiple: number;
}

// Analytics Types
export interface SetupAnalytics {
  setupType: SetupType;
  totalTrades: number;
  winRate: number;
  averageRMultiple: number;
  profitFactor: number;
  averageHoldTime: number;
  bestTimeframe: string;
  worstTimeframe: string;
  marketConditionPerformance: {
    trending: SetupMetrics;
    ranging: SetupMetrics;
    breakout: SetupMetrics;
    reversal: SetupMetrics;
  };
}

export interface PatternAnalytics {
  patternType: PatternType;
  totalTrades: number;
  successRate: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  timeframePerformance: { [timeframe: string]: number };
  marketConditionCorrelation: { [condition: string]: number };
}

export interface ExitAnalytics {
  averageExitEfficiency: number; // How close to optimal exit
  partialCloseSuccess: number; // Success rate of partial closes
  totalTrades: number; // Total number of trades analyzed
  positionHoldTime: {
    average: number;
    byProfitability: { winning: number; losing: number; };
  };
  exitReasons: { [key: string]: number }; // Frequency of exit reasons
}

export interface PositionRecommendations {
  optimalPartialCloseLevel: number;
  recommendedHoldTime: number;
  suggestedExitStrategy: string;
  riskOptimizationTips: string[];
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Constants for Enhanced Features
export const PREDEFINED_CONFLUENCE_FACTORS: ConfluenceFactor[] = [
  // Technical
  {
    id: 'multi_timeframe_alignment',
    name: 'Multiple Timeframe Alignment',
    category: 'technical',
    weight: 5,
    description: 'Higher and lower timeframes show same directional bias'
  },
  {
    id: 'fibonacci_levels',
    name: 'Fibonacci Levels',
    category: 'technical',
    weight: 4,
    description: 'Price at significant Fibonacci retracement or extension'
  },
  {
    id: 'moving_average_confluence',
    name: 'Moving Average Confluence',
    category: 'technical',
    weight: 4,
    description: 'Multiple moving averages converging at entry level'
  },
  {
    id: 'volume_confirmation',
    name: 'Volume Confirmation',
    category: 'technical',
    weight: 3,
    description: 'Above average volume supporting the move'
  },
  
  // Fundamental
  {
    id: 'economic_calendar',
    name: 'Economic Calendar Events',
    category: 'fundamental',
    weight: 4,
    description: 'High impact economic events supporting trade direction'
  },
  {
    id: 'interest_rate_differential',
    name: 'Interest Rate Differentials',
    category: 'fundamental',
    weight: 3,
    description: 'Interest rate differentials favor trade direction'
  },
  {
    id: 'central_bank_policy',
    name: 'Central Bank Policy',
    category: 'fundamental',
    weight: 5,
    description: 'Central bank policy stance supports trade direction'
  },
  
  // Sentiment
  {
    id: 'risk_sentiment',
    name: 'Risk-On/Risk-Off Environment',
    category: 'sentiment',
    weight: 3,
    description: 'Market risk sentiment aligns with trade direction'
  },
  {
    id: 'market_positioning',
    name: 'Market Positioning',
    category: 'sentiment',
    weight: 3,
    description: 'COT data or positioning reports support trade'
  },
  {
    id: 'news_sentiment',
    name: 'News Sentiment',
    category: 'sentiment',
    weight: 2,
    description: 'Recent news flow supports trade direction'
  },
  
  // Timing
  {
    id: 'session_overlaps',
    name: 'Session Overlaps',
    category: 'timing',
    weight: 2,
    description: 'Trade taken during high-volume session overlaps'
  },
  {
    id: 'market_open_close',
    name: 'Market Open/Close',
    category: 'timing',
    weight: 2,
    description: 'Trade timing aligns with market open/close dynamics'
  },
  {
    id: 'weekly_monthly_levels',
    name: 'Weekly/Monthly Levels',
    category: 'timing',
    weight: 3,
    description: 'Entry near significant weekly or monthly levels'
  }
];

export const SETUP_TYPE_DESCRIPTIONS: { [key in SetupType]: string } = {
  [SetupType.TREND_CONTINUATION]: 'Trading in the direction of the established trend',
  [SetupType.PULLBACK_ENTRY]: 'Entering on a pullback within a trending market',
  [SetupType.BREAKOUT_CONTINUATION]: 'Trading breakouts that continue the trend',
  [SetupType.SUPPORT_RESISTANCE_BOUNCE]: 'Trading bounces off key support/resistance levels',
  [SetupType.DOUBLE_TOP_BOTTOM]: 'Trading double top or double bottom reversal patterns',
  [SetupType.HEAD_SHOULDERS]: 'Trading head and shoulders reversal patterns',
  [SetupType.RANGE_BREAKOUT]: 'Trading breakouts from consolidation ranges',
  [SetupType.TRIANGLE_BREAKOUT]: 'Trading triangle pattern breakouts',
  [SetupType.FLAG_PENNANT_BREAKOUT]: 'Trading flag or pennant continuation patterns',
  [SetupType.NEWS_REACTION]: 'Trading immediate reactions to news events',
  [SetupType.ECONOMIC_DATA]: 'Trading based on economic data releases',
  [SetupType.CENTRAL_BANK]: 'Trading central bank announcements and policy changes',
  [SetupType.CUSTOM]: 'Custom user-defined setup type'
};

export const PATTERN_TYPE_DESCRIPTIONS: { [key in PatternType]: string } = {
  [PatternType.DOJI]: 'Indecision candlestick pattern',
  [PatternType.HAMMER]: 'Bullish reversal candlestick pattern',
  [PatternType.ENGULFING]: 'Reversal pattern where one candle engulfs the previous',
  [PatternType.PIN_BAR]: 'Rejection candlestick with long wick',
  [PatternType.INSIDE_BAR]: 'Consolidation pattern within previous candle range',
  [PatternType.TRIANGLE]: 'Converging trend lines forming triangle',
  [PatternType.FLAG]: 'Brief consolidation after strong move',
  [PatternType.PENNANT]: 'Small symmetrical triangle after strong move',
  [PatternType.WEDGE]: 'Converging trend lines with slope',
  [PatternType.RECTANGLE]: 'Horizontal support and resistance levels',
  [PatternType.HORIZONTAL_LEVEL]: 'Key horizontal support or resistance',
  [PatternType.DYNAMIC_LEVEL]: 'Moving average or trend line level',
  [PatternType.PSYCHOLOGICAL_LEVEL]: 'Round number or psychological level',
  [PatternType.ASCENDING_TREND]: 'Upward sloping trend line',
  [PatternType.DESCENDING_TREND]: 'Downward sloping trend line',
  [PatternType.CHANNEL_LINES]: 'Parallel trend lines forming channel',
  [PatternType.RETRACEMENT]: 'Fibonacci retracement level',
  [PatternType.EXTENSION]: 'Fibonacci extension level',
  [PatternType.CLUSTER]: 'Multiple Fibonacci levels converging',
  [PatternType.CUSTOM]: 'Custom user-defined pattern'
};
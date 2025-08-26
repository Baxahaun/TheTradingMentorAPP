/**
 * Professional Strategy Management System Types
 * Enhanced data models extending the current Playbook system
 */

import { Trade } from './trade';

// ===== CORE STRATEGY INTERFACES =====

/**
 * Position sizing method configuration
 */
export interface PositionSizingMethod {
  type: 'FixedPercentage' | 'FixedDollar' | 'VolatilityBased' | 'KellyFormula';
  parameters: {
    // For FixedPercentage
    percentage?: number;
    // For FixedDollar
    dollarAmount?: number;
    // For VolatilityBased
    atrMultiplier?: number;
    atrPeriod?: number;
    // For KellyFormula
    winRate?: number;
    avgWin?: number;
    avgLoss?: number;
    // Common parameters
    maxPositionSize?: number;
    minPositionSize?: number;
  };
}

/**
 * Stop loss rule configuration
 */
export interface StopLossRule {
  type: 'ATRBased' | 'PercentageBased' | 'StructureBased' | 'VolatilityBased';
  parameters: {
    // For ATRBased
    atrMultiplier?: number;
    atrPeriod?: number;
    // For PercentageBased
    percentage?: number;
    // For StructureBased
    structureType?: 'support_resistance' | 'swing_high_low' | 'trend_line';
    buffer?: number; // pips or percentage buffer
    // For VolatilityBased
    volatilityMultiplier?: number;
    volatilityPeriod?: number;
    // Common parameters
    maxStopDistance?: number;
    minStopDistance?: number;
  };
  description: string;
}

/**
 * Take profit rule configuration
 */
export interface TakeProfitRule {
  type: 'RiskRewardRatio' | 'StructureBased' | 'TrailingStop' | 'PartialTargets';
  parameters: {
    // For RiskRewardRatio
    ratio?: number;
    // For StructureBased
    structureType?: 'resistance_support' | 'fibonacci' | 'round_numbers';
    // For TrailingStop
    trailDistance?: number;
    trailType?: 'fixed' | 'atr' | 'percentage';
    // For PartialTargets
    targets?: Array<{
      percentage: number; // percentage of position to close
      ratio: number; // risk-reward ratio for this target
    }>;
    // Common parameters
    maxTarget?: number;
    minTarget?: number;
  };
  description: string;
}

/**
 * Monthly performance data
 */
export interface MonthlyReturn {
  month: string; // YYYY-MM format
  return: number; // percentage return
  trades: number; // number of trades
  winRate: number; // win rate for the month
  profitFactor: number; // profit factor for the month
}

/**
 * Professional strategy performance metrics
 */
export interface StrategyPerformance {
  // Basic metrics (enhanced from current timesUsed, tradesWon, tradesLost)
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  
  // Professional KPIs
  profitFactor: number; // Gross Profit / Gross Loss
  expectancy: number; // Average $ expected per trade
  winRate: number; // Percentage of winning trades
  averageWin: number; // Average winning trade amount
  averageLoss: number; // Average losing trade amount
  riskRewardRatio: number; // Average risk-reward ratio
  
  // Risk-adjusted metrics
  sharpeRatio?: number; // Risk-adjusted return
  maxDrawdown: number; // Maximum drawdown percentage
  maxDrawdownDuration: number; // Maximum drawdown duration in days
  
  // Statistical significance
  sampleSize: number; // Number of trades
  confidenceLevel: number; // Statistical confidence level (0-100)
  statisticallySignificant: boolean; // Whether sample size is sufficient
  
  // Performance over time
  monthlyReturns: MonthlyReturn[];
  performanceTrend: 'Improving' | 'Declining' | 'Stable' | 'Insufficient Data';
  
  // Metadata
  lastCalculated: string; // ISO date string
  calculationVersion: number; // Version of calculation algorithm
}

/**
 * Professional strategy interface extending current Playbook
 */
export interface ProfessionalStrategy {
  // Preserve existing basic fields for backward compatibility
  id: string;
  title: string;
  description: string;
  color: string;
  
  // Legacy fields (preserved for migration from existing playbooks)
  marketConditions?: string;
  entryParameters?: string;
  exitParameters?: string;
  timesUsed?: number; // Deprecated, use performance.totalTrades
  tradesWon?: number; // Deprecated, use performance.winningTrades
  tradesLost?: number; // Deprecated, use performance.losingTrades
  
  // New professional structure
  methodology: 'Technical' | 'Fundamental' | 'Quantitative' | 'Hybrid';
  primaryTimeframe: string; // e.g., "1H", "4H", "1D"
  assetClasses: string[]; // e.g., ["Forex", "Indices", "Commodities"]
  
  // Professional entry criteria (replaces entryParameters)
  setupConditions: {
    marketEnvironment: string; // Overall market condition description
    technicalConditions: string[]; // List of technical conditions
    fundamentalConditions?: string[]; // List of fundamental conditions
    volatilityRequirements?: string; // Volatility requirements
  };
  
  entryTriggers: {
    primarySignal: string; // Main entry signal
    confirmationSignals: string[]; // Additional confirmation signals
    timingCriteria: string; // Timing requirements
  };
  
  // Professional exit criteria (replaces exitParameters)
  riskManagement: {
    positionSizingMethod: PositionSizingMethod;
    maxRiskPerTrade: number; // percentage (e.g., 2 for 2%)
    stopLossRule: StopLossRule;
    takeProfitRule: TakeProfitRule;
    riskRewardRatio: number; // minimum acceptable risk-reward ratio
  };
  
  // Performance tracking
  performance: StrategyPerformance;
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  lastUsed?: string; // ISO date string
  version: number; // Strategy version for tracking changes
  isActive: boolean; // Whether strategy is currently active
}

// ===== TRADE-STRATEGY INTEGRATION =====

/**
 * Strategy deviation tracking
 */
export interface StrategyDeviation {
  type: 'EntryTiming' | 'PositionSize' | 'StopLoss' | 'TakeProfit' | 'RiskManagement';
  planned: any; // Planned value according to strategy
  actual: any; // Actual value executed
  impact: 'Positive' | 'Negative' | 'Neutral'; // Impact on trade outcome
  description: string; // Human-readable description of deviation
}

/**
 * Trade interface extended with strategy integration
 */
export interface TradeWithStrategy extends Trade {
  strategyId?: string; // ID of associated strategy
  strategyName?: string; // Name of associated strategy (for display)
  adherenceScore?: number; // How well trade followed strategy rules (0-100)
  deviations?: StrategyDeviation[]; // List of deviations from strategy
  strategyVersion?: number; // Version of strategy used for this trade
}

// ===== VALIDATION SCHEMAS =====

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Strategy validation rules
 */
export interface StrategyValidationRules {
  required: {
    title: { minLength: number; maxLength: number };
    methodology: { allowedValues: string[] };
    setupConditions: { marketEnvironment: { minLength: number } };
    entryTriggers: { primarySignal: { minLength: number } };
    riskManagement: {
      maxRiskPerTrade: { min: number; max: number };
      riskRewardRatio: { min: number; max: number };
    };
  };
  
  businessRules: {
    maxRiskPerTrade: { min: number; max: number }; // 0.1% to 10%
    riskRewardRatio: { min: number; max: number }; // 1:1 to 10:1
    positionSizingMethod: string; // 'must be defined'
  };
  
  warnings: {
    insufficientTrades: { threshold: number; message: string };
    highRisk: { threshold: number; message: string };
    lowSampleSize: { threshold: number; message: string };
  };
}

// ===== ANALYTICS AND INSIGHTS =====

/**
 * Strategy comparison result
 */
export interface StrategyComparison {
  strategyId: string;
  strategyName: string;
  rank: number;
  score: number;
  metrics: {
    profitFactor: number;
    expectancy: number;
    sharpeRatio?: number;
    winRate: number;
    maxDrawdown: number;
  };
  strengths: string[];
  weaknesses: string[];
}

/**
 * Strategy suggestion for trade attribution
 */
export interface StrategySuggestion {
  strategyId: string;
  strategyName: string;
  confidence: number; // 0-100
  matchingFactors: string[];
  reasoning: string;
}

/**
 * Performance pattern identification
 */
export interface PerformancePattern {
  type: 'TimeOfDay' | 'DayOfWeek' | 'MarketCondition' | 'Timeframe' | 'AssetClass';
  pattern: string;
  confidence: number;
  impact: number; // Impact on performance (-100 to +100)
  description: string;
  supportingData: any;
}

/**
 * Strategy insight
 */
export interface StrategyInsight {
  type: 'Performance' | 'Timing' | 'MarketCondition' | 'RiskManagement';
  message: string;
  confidence: number; // 0-100
  actionable: boolean;
  supportingData: any;
  priority: 'Low' | 'Medium' | 'High';
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
  category: 'RiskManagement' | 'EntryTiming' | 'ExitStrategy' | 'PositionSizing';
  suggestion: string;
  expectedImprovement: number; // Expected improvement percentage
  confidence: number; // 0-100
  implementationDifficulty: 'Easy' | 'Medium' | 'Hard';
  requiredData: string[];
}

/**
 * Market correlation data
 */
export interface MarketCorrelation {
  condition: string;
  correlation: number; // -1 to 1
  significance: number; // 0-100
  description: string;
  recommendations: string[];
}

// ===== BACKTESTING =====

/**
 * Strategy modification for backtesting
 */
export interface StrategyModification {
  field: string;
  originalValue: any;
  newValue: any;
  description: string;
}

/**
 * Backtest result
 */
export interface BacktestResult {
  strategyId: string;
  modifications: StrategyModification[];
  performance: StrategyPerformance;
  tradeResults: Array<{
    tradeId: string;
    originalOutcome: number;
    modifiedOutcome: number;
    difference: number;
  }>;
  summary: {
    totalImprovement: number;
    winRateChange: number;
    profitFactorChange: number;
    expectancyChange: number;
  };
  confidence: number;
  runDate: string;
}

/**
 * Strategy version comparison
 */
export interface VersionComparison {
  originalStrategy: ProfessionalStrategy;
  modifiedStrategy: ProfessionalStrategy;
  performanceComparison: {
    original: StrategyPerformance;
    modified: StrategyPerformance;
    improvement: number;
  };
  significantChanges: string[];
  recommendation: 'Adopt' | 'Reject' | 'Test Further';
}

/**
 * Risk management simulation result
 */
export interface SimulationResult {
  scenario: string;
  originalRisk: any;
  modifiedRisk: any;
  performanceImpact: {
    profitFactorChange: number;
    maxDrawdownChange: number;
    expectancyChange: number;
  };
  tradeImpacts: Array<{
    tradeId: string;
    originalPnL: number;
    simulatedPnL: number;
    difference: number;
  }>;
}

// ===== CONSTANTS AND ENUMS =====

/**
 * Methodology types
 */
export const METHODOLOGY_TYPES = [
  'Technical',
  'Fundamental', 
  'Quantitative',
  'Hybrid'
] as const;

/**
 * Position sizing method types
 */
export const POSITION_SIZING_TYPES = [
  'FixedPercentage',
  'FixedDollar',
  'VolatilityBased',
  'KellyFormula'
] as const;

/**
 * Stop loss rule types
 */
export const STOP_LOSS_TYPES = [
  'ATRBased',
  'PercentageBased',
  'StructureBased',
  'VolatilityBased'
] as const;

/**
 * Take profit rule types
 */
export const TAKE_PROFIT_TYPES = [
  'RiskRewardRatio',
  'StructureBased',
  'TrailingStop',
  'PartialTargets'
] as const;

/**
 * Performance trend types
 */
export const PERFORMANCE_TRENDS = [
  'Improving',
  'Declining',
  'Stable',
  'Insufficient Data'
] as const;

/**
 * Default validation rules
 */
export const DEFAULT_VALIDATION_RULES: StrategyValidationRules = {
  required: {
    title: { minLength: 3, maxLength: 100 },
    methodology: { allowedValues: [...METHODOLOGY_TYPES] },
    setupConditions: { marketEnvironment: { minLength: 10 } },
    entryTriggers: { primarySignal: { minLength: 10 } },
    riskManagement: {
      maxRiskPerTrade: { min: 0.1, max: 10 },
      riskRewardRatio: { min: 1, max: 10 }
    }
  },
  businessRules: {
    maxRiskPerTrade: { min: 0.1, max: 10 },
    riskRewardRatio: { min: 1, max: 10 },
    positionSizingMethod: 'must be defined'
  },
  warnings: {
    insufficientTrades: { 
      threshold: 30, 
      message: 'Need minimum 30 trades for statistical significance' 
    },
    highRisk: { 
      threshold: 5, 
      message: 'Risk per trade exceeds 5% - consider reducing' 
    },
    lowSampleSize: { 
      threshold: 10, 
      message: 'Performance metrics may not be reliable with less than 10 trades' 
    }
  }
};

/**
 * Statistical significance thresholds
 */
export const STATISTICAL_THRESHOLDS = {
  MINIMUM_TRADES: 30,
  CONFIDENCE_LEVELS: [90, 95, 99],
  DEFAULT_CONFIDENCE: 95
} as const;
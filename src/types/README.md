# Strategy Management System - Data Models Documentation

This document provides comprehensive documentation for the enhanced data models and TypeScript interfaces created for the Professional Strategy Management System.

## Overview

The strategy management system extends the existing basic playbooks with professional-grade interfaces that support:

- Professional strategy structure (Setup + Trigger + Risk Management)
- Advanced performance metrics and analytics
- Trade-strategy integration and attribution
- Comprehensive validation and error handling
- Statistical significance tracking
- Backward compatibility with existing playbooks

## Core Interfaces

### ProfessionalStrategy

The main interface that extends the current Playbook system with professional trading structure.

```typescript
interface ProfessionalStrategy {
  // Basic fields (preserved for compatibility)
  id: string;
  title: string;
  description: string;
  color: string;
  
  // Legacy fields (for migration)
  marketConditions?: string;
  entryParameters?: string;
  exitParameters?: string;
  timesUsed?: number;
  tradesWon?: number;
  tradesLost?: number;
  
  // Professional structure
  methodology: 'Technical' | 'Fundamental' | 'Quantitative' | 'Hybrid';
  primaryTimeframe: string;
  assetClasses: string[];
  setupConditions: SetupConditions;
  entryTriggers: EntryTriggers;
  riskManagement: RiskManagement;
  performance: StrategyPerformance;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  version: number;
  isActive: boolean;
}
```

**Key Features:**
- Maintains backward compatibility with existing playbook fields
- Separates setup conditions from entry triggers (professional structure)
- Comprehensive risk management configuration
- Built-in performance tracking
- Version control for strategy evolution

### StrategyPerformance

Professional performance metrics interface with statistical significance tracking.

```typescript
interface StrategyPerformance {
  // Basic metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  
  // Professional KPIs
  profitFactor: number;        // Gross Profit / Gross Loss
  expectancy: number;          // Average $ expected per trade
  winRate: number;             // Percentage of winning trades
  averageWin: number;          // Average winning trade amount
  averageLoss: number;         // Average losing trade amount
  riskRewardRatio: number;     // Average risk-reward ratio
  
  // Risk-adjusted metrics
  sharpeRatio?: number;        // Risk-adjusted return
  maxDrawdown: number;         // Maximum drawdown percentage
  maxDrawdownDuration: number; // Maximum drawdown duration in days
  
  // Statistical significance
  sampleSize: number;
  confidenceLevel: number;
  statisticallySignificant: boolean;
  
  // Performance tracking
  monthlyReturns: MonthlyReturn[];
  performanceTrend: 'Improving' | 'Declining' | 'Stable' | 'Insufficient Data';
  
  // Metadata
  lastCalculated: string;
  calculationVersion: number;
}
```

**Key Features:**
- Professional trading KPIs (Profit Factor, Expectancy, Sharpe Ratio)
- Statistical significance indicators
- Monthly performance tracking
- Performance trend analysis
- Calculation versioning for algorithm updates

### TradeWithStrategy

Extended trade interface for strategy integration and attribution.

```typescript
interface TradeWithStrategy extends Trade {
  strategyId?: string;
  strategyName?: string;
  adherenceScore?: number;     // 0-100 score of rule compliance
  deviations?: StrategyDeviation[];
  strategyVersion?: number;
}
```

**Key Features:**
- Seamless integration with existing Trade interface
- Strategy attribution and tracking
- Rule adherence scoring
- Deviation tracking for analysis
- Strategy version tracking

## Risk Management Interfaces

### PositionSizingMethod

Configurable position sizing with multiple methodologies.

```typescript
interface PositionSizingMethod {
  type: 'FixedPercentage' | 'FixedDollar' | 'VolatilityBased' | 'KellyFormula';
  parameters: {
    // Type-specific parameters
    percentage?: number;         // For FixedPercentage
    dollarAmount?: number;       // For FixedDollar
    atrMultiplier?: number;      // For VolatilityBased
    atrPeriod?: number;          // For VolatilityBased
    winRate?: number;            // For KellyFormula
    avgWin?: number;             // For KellyFormula
    avgLoss?: number;            // For KellyFormula
    
    // Common parameters
    maxPositionSize?: number;
    minPositionSize?: number;
  };
}
```

### StopLossRule

Flexible stop loss configuration with multiple calculation methods.

```typescript
interface StopLossRule {
  type: 'ATRBased' | 'PercentageBased' | 'StructureBased' | 'VolatilityBased';
  parameters: {
    // Type-specific parameters
    atrMultiplier?: number;      // For ATRBased
    atrPeriod?: number;          // For ATRBased
    percentage?: number;         // For PercentageBased
    structureType?: string;      // For StructureBased
    buffer?: number;             // For StructureBased
    volatilityMultiplier?: number; // For VolatilityBased
    volatilityPeriod?: number;   // For VolatilityBased
    
    // Common parameters
    maxStopDistance?: number;
    minStopDistance?: number;
  };
  description: string;
}
```

### TakeProfitRule

Advanced take profit configuration including partial targets.

```typescript
interface TakeProfitRule {
  type: 'RiskRewardRatio' | 'StructureBased' | 'TrailingStop' | 'PartialTargets';
  parameters: {
    // Type-specific parameters
    ratio?: number;              // For RiskRewardRatio
    structureType?: string;      // For StructureBased
    trailDistance?: number;      // For TrailingStop
    trailType?: string;          // For TrailingStop
    targets?: Array<{            // For PartialTargets
      percentage: number;
      ratio: number;
    }>;
    
    // Common parameters
    maxTarget?: number;
    minTarget?: number;
  };
  description: string;
}
```

## Validation System

### Comprehensive Validation

The system includes comprehensive validation for all interfaces:

```typescript
// Main validation function
function validateProfessionalStrategy(
  strategy: Partial<ProfessionalStrategy>,
  rules?: StrategyValidationRules
): ValidationResult;

// Specialized validation functions
function validatePositionSizingMethod(method: Partial<PositionSizingMethod>): ValidationResult;
function validateStopLossRule(rule: Partial<StopLossRule>): ValidationResult;
function validateTakeProfitRule(rule: Partial<TakeProfitRule>): ValidationResult;
function validateStrategyPerformance(performance: Partial<StrategyPerformance>): ValidationResult;
function validateTradeWithStrategy(trade: Partial<TradeWithStrategy>): ValidationResult;
```

### ValidationResult Interface

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
```

### Validation Rules

Configurable validation rules with business logic:

```typescript
interface StrategyValidationRules {
  required: {
    title: { minLength: number; maxLength: number };
    methodology: { allowedValues: string[] };
    // ... other required field rules
  };
  
  businessRules: {
    maxRiskPerTrade: { min: number; max: number };
    riskRewardRatio: { min: number; max: number };
    // ... other business rules
  };
  
  warnings: {
    insufficientTrades: { threshold: number; message: string };
    highRisk: { threshold: number; message: string };
    // ... other warning conditions
  };
}
```

## Constants and Enums

### Type Constants

```typescript
const METHODOLOGY_TYPES = ['Technical', 'Fundamental', 'Quantitative', 'Hybrid'] as const;
const POSITION_SIZING_TYPES = ['FixedPercentage', 'FixedDollar', 'VolatilityBased', 'KellyFormula'] as const;
const STOP_LOSS_TYPES = ['ATRBased', 'PercentageBased', 'StructureBased', 'VolatilityBased'] as const;
const TAKE_PROFIT_TYPES = ['RiskRewardRatio', 'StructureBased', 'TrailingStop', 'PartialTargets'] as const;
const PERFORMANCE_TRENDS = ['Improving', 'Declining', 'Stable', 'Insufficient Data'] as const;
```

### Statistical Thresholds

```typescript
const STATISTICAL_THRESHOLDS = {
  MINIMUM_TRADES: 30,
  CONFIDENCE_LEVELS: [90, 95, 99],
  DEFAULT_CONFIDENCE: 95
} as const;
```

## Usage Examples

### Creating a Professional Strategy

```typescript
const strategy: ProfessionalStrategy = {
  id: 'trend-following-1',
  title: 'EUR/USD Trend Following',
  description: 'Comprehensive trend following strategy for EUR/USD',
  color: '#3B82F6',
  methodology: 'Technical',
  primaryTimeframe: '4H',
  assetClasses: ['Forex'],
  
  setupConditions: {
    marketEnvironment: 'Strong trending market with clear directional bias',
    technicalConditions: [
      'Price above 200 EMA',
      'RSI between 40-60',
      'MACD histogram positive'
    ],
    fundamentalConditions: ['USD strength'],
    volatilityRequirements: 'ATR above 20-period average'
  },
  
  entryTriggers: {
    primarySignal: 'Bullish engulfing candle at support',
    confirmationSignals: [
      'Volume spike above average',
      'MACD line cross above signal'
    ],
    timingCriteria: 'During London or New York session'
  },
  
  riskManagement: {
    positionSizingMethod: {
      type: 'FixedPercentage',
      parameters: { percentage: 2 }
    },
    maxRiskPerTrade: 2,
    stopLossRule: {
      type: 'ATRBased',
      parameters: { atrMultiplier: 2, atrPeriod: 14 },
      description: '2x ATR stop loss'
    },
    takeProfitRule: {
      type: 'PartialTargets',
      parameters: {
        targets: [
          { percentage: 50, ratio: 1.5 },
          { percentage: 50, ratio: 3 }
        ]
      },
      description: 'Partial targets at 1.5R and 3R'
    },
    riskRewardRatio: 2
  },
  
  performance: {
    // ... performance metrics
  },
  
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  version: 1,
  isActive: true
};
```

### Validating a Strategy

```typescript
const validationResult = validateProfessionalStrategy(strategy);

if (!validationResult.isValid) {
  console.log('Validation errors:', validationResult.errors);
  console.log('Validation warnings:', validationResult.warnings);
} else {
  console.log('Strategy is valid!');
  if (validationResult.warnings.length > 0) {
    console.log('Warnings:', validationResult.warnings);
  }
}
```

### Integrating Trade with Strategy

```typescript
const tradeWithStrategy: TradeWithStrategy = {
  // ... existing trade fields
  strategyId: 'trend-following-1',
  strategyName: 'EUR/USD Trend Following',
  adherenceScore: 92,
  deviations: [
    {
      type: 'PositionSize',
      planned: 1.0,
      actual: 1.5,
      impact: 'Positive',
      description: 'Increased position size due to strong confluence'
    }
  ]
};
```

## Migration Support

The system provides full backward compatibility with existing playbooks:

### Legacy Field Mapping

```typescript
// Existing playbook fields are preserved
interface ProfessionalStrategy {
  // Legacy fields (preserved during migration)
  marketConditions?: string;    // Maps to setupConditions.marketEnvironment
  entryParameters?: string;     // Maps to entryTriggers.primarySignal
  exitParameters?: string;      // Maps to riskManagement rules
  timesUsed?: number;          // Maps to performance.totalTrades
  tradesWon?: number;          // Maps to performance.winningTrades
  tradesLost?: number;         // Maps to performance.losingTrades
}
```

### Migration Process

1. **Data Preservation**: All existing playbook data is preserved
2. **Gradual Enhancement**: Users can continue using basic playbooks while adding professional fields
3. **Guided Completion**: Migration wizard helps complete professional structure
4. **Validation**: System validates professional fields and provides guidance

## Testing

Comprehensive unit tests are provided for all interfaces and validation functions:

- **Data Model Tests**: `src/types/__tests__/strategy.test.ts`
- **Validation Tests**: `src/types/__tests__/strategyValidation.test.ts`

### Running Tests

```bash
# Run all strategy-related tests
npm test -- src/types/__tests__ --run

# Run specific test file
npm test -- src/types/__tests__/strategy.test.ts --run
npm test -- src/types/__tests__/strategyValidation.test.ts --run
```

## Type Safety

All interfaces are designed with strict TypeScript typing to ensure:

- **Compile-time validation** of data structures
- **IntelliSense support** in IDEs
- **Refactoring safety** when updating interfaces
- **Documentation through types** for better developer experience

## Performance Considerations

The data models are designed for optimal performance:

- **Lazy loading** support for large datasets
- **Caching-friendly** structure for performance metrics
- **Minimal memory footprint** with optional fields
- **Efficient serialization** for API communication

## Future Extensibility

The architecture supports future enhancements:

- **Modular design** allows easy addition of new features
- **Version tracking** enables safe schema evolution
- **Plugin architecture** for custom validation rules
- **API compatibility** for external integrations
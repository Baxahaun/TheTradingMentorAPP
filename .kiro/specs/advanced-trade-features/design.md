# Design Document

## Overview

This design document outlines the implementation of three advanced trading features for Zella Trade Scribe: **Trade Setup Classification**, **Pattern Recognition**, and **Partial Close Tracking**. These features will be integrated into the existing hybrid dashboard architecture and will extend the current Trade interface to support sophisticated trading analysis.

The design leverages the existing service layer pattern, React Context architecture, and widget system to provide seamless integration with current functionality while adding powerful new analytical capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Existing Dashboard                       │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  Static Metrics │  │     Customizable Grid           │   │
│  │      Bar        │  │  ┌─────────┐  ┌─────────────┐   │   │
│  └─────────────────┘  │  │ Setup   │  │ Pattern     │   │   │
│                       │  │Analytics│  │ Analytics   │   │   │
│                       │  └─────────┘  └─────────────┘   │   │
│                       │  ┌─────────┐  ┌─────────────┐   │   │
│                       │  │Position │  │ Existing    │   │   │
│                       │  │Timeline │  │ Widgets     │   │   │
│                       │  └─────────┘  └─────────────┘   │   │
│                       └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Enhanced Trade Interface                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Setup           │  │ Pattern         │  │ Partial     │ │
│  │ Classification  │  │ Recognition     │  │ Close       │ │
│  │ Panel           │  │ Panel           │  │ Management  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Input → Enhanced Trade Form → Service Layer → Context Update → Widget Refresh
     ↓              ↓                    ↓              ↓              ↓
Setup/Pattern → Validation → Classification → TradeContext → Analytics
Classification   & Storage    Service         Update        Widgets
```

## Components and Interfaces

### 1. Enhanced Trade Data Model

**Extended Trade Interface:**
```typescript
interface EnhancedTrade extends Trade {
  // Setup Classification
  setup?: TradeSetup;
  
  // Pattern Recognition
  patterns?: TradePattern[];
  
  // Partial Close Tracking
  partialCloses?: PartialClose[];
  positionHistory?: PositionEvent[];
  
  // Calculated fields
  setupPerformance?: SetupMetrics;
  patternConfluence?: number;
  positionManagementScore?: number;
}

interface TradeSetup {
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

interface TradePattern {
  id: string;
  type: PatternType;
  timeframe: string;
  quality: 1 | 2 | 3 | 4 | 5;
  confluence: boolean;
  description?: string;
  customPattern?: CustomPattern;
}

interface PartialClose {
  id: string;
  timestamp: string;
  lotSize: number;
  price: number;
  reason: 'profit_taking' | 'risk_reduction' | 'trailing_stop' | 'manual' | 'other';
  remainingLots: number;
  pnlRealized: number;
  notes?: string;
}

interface PositionEvent {
  id: string;
  timestamp: string;
  type: 'entry' | 'partial_close' | 'full_close' | 'stop_adjustment' | 'target_adjustment';
  lotSize: number;
  price: number;
  totalPosition: number;
  averagePrice: number;
}
```

### 2. Service Layer Components

**Setup Classification Service:**
```typescript
class SetupClassificationService {
  // Predefined setup types with forex-specific categories
  private setupTypes: SetupType[];
  private confluenceFactors: ConfluenceFactor[];
  
  // Methods
  getSetupTypes(): SetupType[];
  getConfluenceFactors(): ConfluenceFactor[];
  calculateSetupPerformance(trades: Trade[]): SetupAnalytics;
  createCustomSetup(setup: CustomSetup): void;
  validateSetupData(setup: TradeSetup): ValidationResult;
}
```

**Pattern Recognition Service:**
```typescript
class PatternRecognitionService {
  private patternTypes: PatternType[];
  private patternCategories: PatternCategory[];
  
  // Methods
  getPatternTypes(): PatternType[];
  calculatePatternPerformance(trades: Trade[]): PatternAnalytics;
  analyzePatternConfluence(patterns: TradePattern[]): number;
  createCustomPattern(pattern: CustomPattern): void;
  suggestPatterns(marketData: MarketCondition): PatternType[];
}
```

**Position Management Service:**
```typescript
class PositionManagementService {
  // Methods
  addPartialClose(tradeId: string, partialClose: PartialClose): void;
  calculateRemainingPosition(trade: Trade): PositionSummary;
  generatePositionTimeline(trade: Trade): PositionEvent[];
  calculatePositionManagementScore(trade: Trade): number;
  analyzeExitEfficiency(trades: Trade[]): ExitAnalytics;
  optimizePositionSizing(historicalData: Trade[]): PositionRecommendations;
}
```

### 3. UI Components

**Enhanced Trade Form Components:**
```typescript
// Setup Classification Panel
const SetupClassificationPanel: React.FC<{
  setup?: TradeSetup;
  onChange: (setup: TradeSetup) => void;
}>;

// Pattern Recognition Panel
const PatternRecognitionPanel: React.FC<{
  patterns: TradePattern[];
  onChange: (patterns: TradePattern[]) => void;
}>;

// Partial Close Management Panel
const PartialClosePanel: React.FC<{
  trade: Trade;
  onPartialClose: (partialClose: PartialClose) => void;
}>;

// Position Timeline Visualization
const PositionTimelineWidget: React.FC<{
  trade: Trade;
  events: PositionEvent[];
}>;
```

**New Dashboard Widgets:**
```typescript
// Setup Analytics Widget
const SetupAnalyticsWidget: React.FC<{
  trades: Trade[];
  timeframe: string;
}>;

// Pattern Performance Widget
const PatternPerformanceWidget: React.FC<{
  trades: Trade[];
  selectedPatterns: PatternType[];
}>;

// Position Management Analytics Widget
const PositionManagementWidget: React.FC<{
  trades: Trade[];
  analysisType: 'efficiency' | 'optimization' | 'timeline';
}>;
```

## Data Models

### Setup Classification Data

**Predefined Setup Types:**
```typescript
enum SetupType {
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

interface ConfluenceFactor {
  id: string;
  name: string;
  category: 'technical' | 'fundamental' | 'sentiment' | 'timing';
  weight: number; // 1-5 importance
  description: string;
}
```

**Predefined Confluence Factors:**
- **Technical:** Multiple timeframe alignment, Fibonacci levels, Moving average confluence, Volume confirmation
- **Fundamental:** Economic calendar events, Interest rate differentials, Central bank policy
- **Sentiment:** Risk-on/risk-off environment, Market positioning, News sentiment
- **Timing:** Session overlaps, Market open/close, Weekly/monthly levels

### Pattern Recognition Data

**Pattern Categories:**
```typescript
enum PatternCategory {
  CANDLESTICK = 'candlestick',
  CHART_PATTERN = 'chart_pattern',
  SUPPORT_RESISTANCE = 'support_resistance',
  TREND_LINE = 'trend_line',
  FIBONACCI = 'fibonacci',
  CUSTOM = 'custom'
}

interface PatternType {
  id: string;
  name: string;
  category: PatternCategory;
  description: string;
  reliability: number; // Historical success rate
  timeframes: string[]; // Applicable timeframes
  marketConditions: string[]; // Best market conditions
}
```

**Predefined Patterns:**
- **Candlestick:** Doji, Hammer, Engulfing, Pin Bar, Inside Bar
- **Chart Patterns:** Triangle, Flag, Pennant, Wedge, Rectangle
- **Support/Resistance:** Horizontal levels, Dynamic levels, Psychological levels
- **Trend Lines:** Ascending, Descending, Channel lines
- **Fibonacci:** Retracements, Extensions, Clusters

### Position Management Data

**Position Event Types:**
```typescript
interface PositionSummary {
  totalLots: number;
  averageEntryPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  riskAmount: number;
  currentRMultiple: number;
}

interface ExitAnalytics {
  averageExitEfficiency: number; // How close to optimal exit
  partialCloseSuccess: number; // Success rate of partial closes
  positionHoldTime: {
    average: number;
    byProfitability: { winning: number; losing: number; };
  };
  exitReasons: { [key: string]: number }; // Frequency of exit reasons
}
```

## Error Handling

### Validation Strategy

**Data Validation:**
```typescript
// Setup validation
const validateSetup = (setup: TradeSetup): ValidationResult => {
  // Validate setup type exists
  // Validate confluence factors are valid
  // Validate quality rating is 1-5
  // Validate timeframe format
};

// Pattern validation
const validatePattern = (pattern: TradePattern): ValidationResult => {
  // Validate pattern type exists
  // Validate timeframe compatibility
  // Validate quality rating
};

// Partial close validation
const validatePartialClose = (partialClose: PartialClose, trade: Trade): ValidationResult => {
  // Validate lot size doesn't exceed remaining position
  // Validate price is reasonable
  // Validate timestamp is after trade entry
};
```

**Error Recovery:**
- **Invalid Setup Data:** Fallback to basic trade logging without setup classification
- **Pattern Recognition Errors:** Continue with available patterns, log missing data
- **Partial Close Conflicts:** Prevent invalid partial closes, show clear error messages
- **Data Migration:** Graceful handling of existing trades without new data fields

## Testing Strategy

### Unit Testing

**Service Layer Tests:**
```typescript
describe('SetupClassificationService', () => {
  test('should calculate setup performance correctly');
  test('should validate setup data properly');
  test('should handle custom setups');
});

describe('PatternRecognitionService', () => {
  test('should analyze pattern confluence');
  test('should suggest relevant patterns');
  test('should calculate pattern performance metrics');
});

describe('PositionManagementService', () => {
  test('should track partial closes accurately');
  test('should calculate position timeline');
  test('should compute management scores');
});
```

### Integration Testing

**Component Integration:**
- Test enhanced trade form with all three feature panels
- Test dashboard widget integration with new data
- Test data persistence and retrieval
- Test mobile responsiveness of new components

### User Acceptance Testing

**Feature Validation:**
- Setup classification workflow with real trading scenarios
- Pattern recognition accuracy with historical data
- Partial close tracking with complex position management
- Analytics accuracy and usefulness

## Performance Considerations

### Optimization Strategies

**Data Processing:**
- **Lazy Loading:** Load setup/pattern data only when needed
- **Caching:** Cache calculated analytics for performance
- **Debounced Updates:** Prevent excessive recalculations during form input
- **Virtualization:** Use virtual scrolling for large pattern/setup lists

**Memory Management:**
- **Selective Loading:** Load only relevant historical data for analytics
- **Data Cleanup:** Remove unused custom setups/patterns
- **Efficient Calculations:** Optimize performance metric calculations

### Scalability Considerations

**Data Growth:**
- **Pagination:** Implement pagination for large trade lists with classifications
- **Filtering:** Efficient filtering by setup type, pattern, and date ranges
- **Aggregation:** Pre-calculate common analytics to reduce computation time
- **Storage Optimization:** Compress historical position event data

This design provides a comprehensive foundation for implementing advanced trade features while maintaining compatibility with the existing Zella Trade Scribe architecture and ensuring optimal performance and user experience.
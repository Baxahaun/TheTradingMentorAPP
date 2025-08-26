# Strategy Management Services

This directory contains the core business logic services for the Professional Strategy Management System.

## StrategyPerformanceService

The `StrategyPerformanceService` is the core service responsible for calculating and maintaining professional performance metrics for trading strategies.

### Key Features

- **Professional KPI Calculations**: Profit Factor, Expectancy, Sharpe Ratio, Win Rate, Risk-Reward Ratio
- **Real-time Updates**: Incremental performance metric updates when new trades are added
- **Statistical Significance**: Determines data reliability based on sample size and confidence levels
- **Trend Analysis**: Identifies improving, declining, or stable performance trends
- **Strategy Comparison**: Ranks strategies by composite performance scores
- **Risk-Adjusted Metrics**: Maximum drawdown, drawdown duration, and Sharpe ratio calculations

### Usage Examples

#### Basic Performance Calculation

```typescript
import { StrategyPerformanceService } from '../services';

const service = new StrategyPerformanceService();
const performance = service.calculateProfessionalMetrics('strategy-id', trades);

console.log(`Profit Factor: ${performance.profitFactor}`);
console.log(`Expectancy: ${performance.expectancy}`);
console.log(`Win Rate: ${performance.winRate}%`);
console.log(`Sharpe Ratio: ${performance.sharpeRatio}`);
```

#### Real-time Performance Updates

```typescript
// When a new trade is completed
const updatedPerformance = service.updatePerformanceMetrics(
  'strategy-id',
  currentPerformance,
  newTrade
);
```

#### Statistical Significance Analysis

```typescript
const significance = service.calculateStatisticalSignificance(
  tradeCount,
  95, // 95% confidence level
  30  // minimum trades required
);

if (significance.isSignificant) {
  console.log('Results are statistically significant');
} else {
  console.log(`Need ${significance.requiredSampleSize - significance.sampleSize} more trades`);
}
```

#### Performance Trend Analysis

```typescript
const trend = service.generatePerformanceTrend(monthlyReturns, 6);

switch (trend) {
  case 'Improving':
    console.log('Strategy performance is improving over time');
    break;
  case 'Declining':
    console.log('Strategy performance is declining - review needed');
    break;
  case 'Stable':
    console.log('Strategy performance is consistent');
    break;
  case 'Insufficient Data':
    console.log('Need more data for trend analysis');
    break;
}
```

#### Strategy Comparison and Ranking

```typescript
const comparisons = service.compareStrategies(strategies);

comparisons.forEach(comparison => {
  console.log(`${comparison.rank}. ${comparison.strategyName}`);
  console.log(`   Score: ${comparison.score}`);
  console.log(`   Strengths: ${comparison.strengths.join(', ')}`);
  console.log(`   Weaknesses: ${comparison.weaknesses.join(', ')}`);
});
```

### Configuration Options

The service accepts configuration options for customizing calculations:

```typescript
const config = {
  riskFreeRate: 0.03,        // 3% annual risk-free rate for Sharpe ratio
  confidenceLevel: 99,       // 99% confidence level for significance
  minimumTrades: 50,         // Require 50 trades for significance
  trendAnalysisPeriods: 12   // Analyze 12 months for trend detection
};

const service = new StrategyPerformanceService(config);
```

### Professional KPIs Explained

#### Profit Factor
- **Formula**: Gross Profit ÷ Gross Loss
- **Interpretation**: 
  - > 2.0: Excellent
  - 1.5-2.0: Good
  - 1.0-1.5: Acceptable
  - < 1.0: Losing strategy

#### Expectancy
- **Formula**: Average $ per trade
- **Interpretation**: Expected profit/loss per trade in account currency

#### Sharpe Ratio
- **Formula**: (Return - Risk-free Rate) ÷ Standard Deviation
- **Interpretation**:
  - > 1.0: Good risk-adjusted returns
  - 0.5-1.0: Acceptable
  - < 0.5: Poor risk-adjusted returns

#### Maximum Drawdown
- **Definition**: Largest peak-to-trough decline in account value
- **Interpretation**: Risk measure - lower is better

### Statistical Significance

The service determines statistical significance based on:
- **Sample Size**: Minimum number of trades (default: 30)
- **Confidence Level**: Statistical confidence (90%, 95%, 99%)
- **Confidence Score**: Percentage indicating data reliability

### Performance Trend Analysis

Trend analysis uses linear regression on monthly returns to classify performance:
- **Improving**: Positive slope above significance threshold
- **Declining**: Negative slope below significance threshold  
- **Stable**: Slope within significance threshold
- **Insufficient Data**: Less than 3 months of data

### Error Handling

The service includes comprehensive error handling:
- **Input Validation**: Validates trade data completeness
- **Graceful Degradation**: Handles missing optional fields
- **Error Recovery**: Provides meaningful error messages

### Testing

Comprehensive unit tests cover:
- All calculation methods
- Edge cases and error conditions
- Real-time update scenarios
- Statistical significance determination
- Trend analysis accuracy
- Strategy comparison logic

Run tests with:
```bash
npm test -- src/services/__tests__/StrategyPerformanceService.test.ts --run
```

### Performance Considerations

- **Incremental Updates**: Optimized for real-time performance updates
- **Caching Support**: Designed to work with caching layers
- **Memory Efficient**: Minimal memory footprint for large datasets
- **Calculation Versioning**: Tracks algorithm versions for consistency

### Future Enhancements

Planned improvements include:
- **Monte Carlo Simulations**: Advanced risk analysis
- **Walk-Forward Analysis**: Out-of-sample testing
- **Machine Learning Integration**: Predictive performance analytics
- **Portfolio-Level Metrics**: Cross-strategy correlation analysis
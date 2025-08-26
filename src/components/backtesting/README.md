# Backtesting Components

This directory contains components for the backtesting and simulation engine, which allows traders to test strategy modifications against historical data and run Monte Carlo simulations for risk analysis.

## Components

### BacktestingPanel
The main component that provides a comprehensive interface for backtesting, version comparison, and risk simulation.

**Features:**
- **Backtest Tab**: Run backtests with custom modifications to strategy rules
- **Version Compare Tab**: Compare two versions of a strategy side-by-side
- **Risk Simulation Tab**: Run Monte Carlo simulations with modified risk parameters

**Props:**
- `strategy: ProfessionalStrategy` - The strategy to backtest
- `historicalTrades: Trade[]` - Historical trade data for backtesting
- `onStrategyUpdate?: (strategy: ProfessionalStrategy) => void` - Callback for strategy updates

**Usage:**
```tsx
import { BacktestingPanel } from './components/backtesting/BacktestingPanel';

<BacktestingPanel
  strategy={currentStrategy}
  historicalTrades={tradeHistory}
  onStrategyUpdate={handleStrategyUpdate}
/>
```

### BacktestResultsChart
Displays the results of a backtest with detailed performance comparisons and recommendations.

**Features:**
- Performance improvement summary with key metrics
- Side-by-side comparison of original vs backtest performance
- Modifications applied breakdown
- Trade impact analysis
- Automated recommendations based on results

**Props:**
- `result: BacktestResult` - The backtest result data

### VersionComparisonChart
Shows detailed comparison between two strategy versions with trade-by-trade analysis.

**Features:**
- Overall performance change summary
- Side-by-side metrics comparison
- Trade impact analysis with improvement/decline breakdown
- Detailed trade changes list
- Strategy-specific recommendations

**Props:**
- `result: VersionComparison` - The version comparison result data

### SimulationResultsChart
Displays Monte Carlo simulation results with risk analysis and confidence intervals.

**Features:**
- Projected performance metrics
- Risk assessment with Sharpe and Sortino ratios
- Confidence intervals for expected returns
- Risk level indicators
- Simulation insights and warnings

**Props:**
- `result: SimulationResult` - The simulation result data

## Integration with BacktestingService

All components integrate with the `BacktestingService` class which provides:

### Core Methods
- `runBacktest()` - Execute backtest with optional modifications
- `compareStrategyVersions()` - Compare two strategy versions
- `simulateRiskManagementChanges()` - Run Monte Carlo simulation

### Key Features
- **Historical Analysis**: Apply modified rules to historical trade data
- **Performance Metrics**: Calculate professional KPIs (Profit Factor, Expectancy, Sharpe Ratio)
- **Statistical Significance**: Determine confidence levels based on sample size
- **Risk Assessment**: Comprehensive risk metrics and drawdown analysis
- **What-If Analysis**: Test different risk management parameters

## Data Flow

```
User Input → BacktestingPanel → BacktestingService → Results → Chart Components
```

1. User configures modifications or parameters in BacktestingPanel
2. BacktestingService processes historical data with modifications
3. Results are calculated and returned
4. Appropriate chart component displays the results

## Testing

Each component has comprehensive unit tests covering:
- Rendering and user interactions
- Data processing and calculations
- Error handling and edge cases
- Performance metrics accuracy
- Statistical significance calculations

Run tests with:
```bash
npm test src/components/backtesting/
npm test src/services/BacktestingService.test.ts
```

## Performance Considerations

- **Lazy Loading**: Chart components only render when results are available
- **Debounced Updates**: Parameter changes are debounced to prevent excessive calculations
- **Progress Indicators**: Long-running backtests show progress feedback
- **Memory Management**: Large datasets are processed in chunks

## Accessibility

All components follow WCAG 2.1 AA guidelines:
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management
- Semantic HTML structure

## Future Enhancements

Planned improvements include:
- **Advanced Backtesting**: Walk-forward analysis and out-of-sample testing
- **Optimization Engine**: Automated parameter optimization
- **Scenario Analysis**: Multiple market condition scenarios
- **Export Capabilities**: PDF reports and CSV data export
- **Real-time Updates**: Live performance tracking integration
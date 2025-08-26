# Strategy Detail Components

This directory contains components for the comprehensive strategy detail view and analytics dashboard, providing in-depth analysis of individual trading strategies.

## Components

### StrategyDetailView

The main strategy detail dashboard component that provides a comprehensive view of a single strategy's performance, configuration, and associated trades.

**Features:**
- Multi-tab interface (Overview, Performance, Trades, AI Insights, Settings)
- Professional KPI display (Profit Factor, Expectancy, Sharpe Ratio, etc.)
- Strategy configuration visualization
- Performance trend analysis
- Statistical significance indicators
- Integration with AI insights and pattern recognition
- Trade filtering and navigation
- Export and edit capabilities

**Props:**
```typescript
interface StrategyDetailViewProps {
  strategy: ProfessionalStrategy;
  trades: TradeWithStrategy[];
  allStrategies?: ProfessionalStrategy[];
  onBack: () => void;
  onEditStrategy?: (strategy: ProfessionalStrategy) => void;
  onNavigateToTrade?: (tradeId: string) => void;
  onExportData?: (strategy: ProfessionalStrategy) => void;
  className?: string;
}
```

**Usage:**
```tsx
import { StrategyDetailView } from '@/components/strategy-detail';

<StrategyDetailView
  strategy={selectedStrategy}
  trades={strategyTrades}
  allStrategies={allStrategies}
  onBack={() => setSelectedStrategy(null)}
  onEditStrategy={handleEditStrategy}
  onNavigateToTrade={handleNavigateToTrade}
  onExportData={handleExportData}
/>
```

### TradeDistributionAnalysis

Provides detailed analysis of trade distribution patterns including time-based analysis, currency pair performance, and adherence metrics.

**Features:**
- Hourly and daily performance distribution
- Currency pair performance breakdown
- Strategy adherence analysis and correlation
- Win rate analysis by various dimensions
- Visual progress indicators and color-coded metrics
- Statistical correlation calculations

**Props:**
```typescript
interface TradeDistributionAnalysisProps {
  trades: TradeWithStrategy[];
  className?: string;
}
```

**Usage:**
```tsx
import { TradeDistributionAnalysis } from '@/components/strategy-detail';

<TradeDistributionAnalysis
  trades={filteredTrades}
  className="mt-6"
/>
```

### LinkedTradesView

Displays trades associated with a strategy with comprehensive filtering, sorting, and navigation capabilities.

**Features:**
- Advanced filtering (outcome, adherence, time range, search)
- Multi-column sorting with direction toggle
- Pagination for large trade sets
- Trade summary statistics
- Quick view and detailed navigation
- Adherence scoring and deviation tracking
- Responsive table layout

**Props:**
```typescript
interface LinkedTradesViewProps {
  trades: TradeWithStrategy[];
  strategyName: string;
  onNavigateToTrade: (tradeId: string) => void;
  onViewTradeDetails?: (trade: TradeWithStrategy) => void;
  className?: string;
}
```

**Usage:**
```tsx
import { LinkedTradesView } from '@/components/strategy-detail';

<LinkedTradesView
  trades={strategyTrades}
  strategyName={strategy.title}
  onNavigateToTrade={handleNavigateToTrade}
  onViewTradeDetails={handleQuickView}
/>
```

## Integration Points

### Performance Analytics Integration
- Integrates with `PerformanceAnalytics` component for advanced metrics
- Uses `PerformanceChart` for trend visualization
- Connects to `StrategyPerformanceService` for calculations

### AI Insights Integration
- Embeds `AIInsightsPanel` for pattern recognition
- Displays optimization suggestions and market correlations
- Provides actionable insights based on trade data

### Trade Review System Integration
- Links to comprehensive trade review system
- Provides navigation to detailed trade analysis
- Supports bidirectional strategy-trade relationships

## Data Flow

```
Strategy Selection
       ↓
StrategyDetailView
       ├── Performance Tab → PerformanceAnalytics + PerformanceChart
       ├── Trades Tab → TradeDistributionAnalysis + LinkedTradesView
       ├── Insights Tab → AIInsightsPanel
       └── Settings Tab → Configuration & Actions
```

## Key Features

### Professional Metrics Display
- Profit Factor, Expectancy, Sharpe Ratio
- Win Rate, Average Win/Loss, Risk-Reward Ratio
- Maximum Drawdown and Duration
- Statistical significance indicators

### Advanced Analytics
- Time-based performance patterns
- Currency pair performance breakdown
- Strategy adherence correlation analysis
- Risk-adjusted return calculations

### Interactive Navigation
- Seamless trade-to-strategy navigation
- Quick view capabilities for trades
- Export functionality for data analysis
- Edit capabilities for strategy modification

### Performance Optimization
- Lazy loading for heavy analytics
- Memoized calculations for large datasets
- Efficient filtering and sorting algorithms
- Virtualization for large trade lists

## Testing

All components include comprehensive unit tests covering:
- Rendering with various data states
- User interaction handling
- Filtering and sorting functionality
- Edge cases and error conditions
- Performance with large datasets

Run tests:
```bash
npm test -- --testPathPattern=strategy-detail
```

## Accessibility

Components follow WCAG 2.1 AA guidelines:
- Proper ARIA labeling for complex charts
- Keyboard navigation support
- High contrast mode compatibility
- Screen reader friendly table structures
- Focus management for modal interactions

## Performance Considerations

### Optimization Strategies
- Memoized calculations for expensive operations
- Lazy loading of heavy analytics components
- Debounced search and filter operations
- Efficient data structures for large datasets

### Memory Management
- Proper cleanup of event listeners
- Optimized re-rendering with React.memo
- Efficient state management patterns
- Garbage collection friendly implementations

## Future Enhancements

### Planned Features
- Advanced charting with zoom and pan
- Real-time performance updates
- Collaborative strategy sharing
- Mobile-optimized layouts
- Offline capability for cached data

### Integration Opportunities
- External trading platform connections
- Advanced backtesting capabilities
- Machine learning pattern recognition
- Portfolio-level analytics
- Risk management automation

## Dependencies

### Required Packages
- React 18+
- Lucide React (icons)
- Custom UI components (@/components/ui)
- Strategy types (@/types/strategy)

### Optional Integrations
- Chart.js or D3.js for advanced visualizations
- Date-fns for date manipulation
- Lodash for utility functions
- React Query for data fetching

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When contributing to strategy detail components:

1. Follow the established component patterns
2. Include comprehensive unit tests
3. Update documentation for new features
4. Consider performance implications
5. Ensure accessibility compliance
6. Test with various data scenarios
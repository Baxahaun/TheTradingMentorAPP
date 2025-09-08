# Trading Chart Components

This directory contains chart components for displaying trading data with entry and exit markers.

## Components

### 1. TradeChart (Recommended)
The main chart component that provides a unified interface for displaying trades with markers.

```tsx
import TradeChart from './components/charts/TradeChart';

<TradeChart
  trade={tradeData}
  height={500}
  preferredChart="lightweight"
/>
```

**Features:**
- Automatic chart type selection with fallback
- Entry/exit markers with visual indicators
- Stop loss and take profit lines
- Interactive controls
- Responsive design

### 2. TradingViewChartWithMarkers
High-performance chart using lightweight-charts library with full marker support.

```tsx
import TradingViewChartWithMarkers from './components/charts/TradingViewChartWithMarkers';

<TradingViewChartWithMarkers
  trade={tradeData}
  height={400}
  showControls={true}
/>
```

**Features:**
- Lightweight and fast rendering
- Full marker customization
- Price lines for SL/TP
- Mock data generation for visualization
- Multiple timeframe support

### 3. TradingViewChart (Legacy)
Original TradingView widget integration with enhanced marker support.

```tsx
import TradingViewChart from './components/trade-review/TradingViewChart';

<TradingViewChart
  trade={tradeData}
  className="rounded-lg"
/>
```

**Features:**
- Full TradingView widget functionality
- Real market data (when available)
- Advanced charting tools
- Professional appearance

## Marker Types

The charts support various marker types to visualize trade information:

### Entry Markers
- **Long positions**: Green upward arrow below the bar
- **Short positions**: Red downward arrow above the bar
- **Text**: Shows entry price

### Exit Markers
- **Profitable exits**: Green circle
- **Loss exits**: Red circle
- **Text**: Shows exit price

### Risk Management Markers
- **Stop Loss**: Red square marker with dashed price line
- **Take Profit**: Green square marker with dashed price line
- **Entry Price**: Blue solid price line

## Usage Examples

### Basic Usage
```tsx
import { Trade } from '../types/trade';
import TradeChart from './components/charts/TradeChart';

const MyTradeView = ({ trade }: { trade: Trade }) => {
  return (
    <div className="w-full h-96">
      <TradeChart
        trade={trade}
        height={400}
        preferredChart="lightweight"
      />
    </div>
  );
};
```

### With Custom Configuration
```tsx
import { useTradeChart } from '../hooks/useTradeChart';
import TradeChart from './components/charts/TradeChart';

const AdvancedTradeView = ({ trade }: { trade: Trade }) => {
  const {
    config,
    updateConfig,
    toggleMarkers,
    tradeMetrics
  } = useTradeChart(trade, {
    height: 600,
    chartType: 'lightweight',
    timeframe: '4H'
  });

  return (
    <div>
      <div className="mb-4">
        <button onClick={toggleMarkers}>
          {config.showMarkers ? 'Hide' : 'Show'} Markers
        </button>
      </div>
      
      <TradeChart trade={trade} />
      
      <div className="mt-4">
        <p>P&L: ${tradeMetrics.pnl}</p>
        <p>Pips: {tradeMetrics.pips}</p>
        <p>R:R Ratio: {tradeMetrics.riskReward}</p>
      </div>
    </div>
  );
};
```

### Multiple Trades Comparison
```tsx
const TradeComparison = ({ trades }: { trades: Trade[] }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {trades.map(trade => (
        <div key={trade.id} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">
            {trade.currencyPair} - {trade.side.toUpperCase()}
          </h3>
          <TradeChart
            trade={trade}
            height={300}
            preferredChart="lightweight"
          />
        </div>
      ))}
    </div>
  );
};
```

## Chart Types

### Lightweight Charts
- **Pros**: Fast rendering, full marker control, works offline
- **Cons**: Limited to basic chart types, no real-time data
- **Best for**: Trade review, backtesting, performance analysis

### TradingView Widget
- **Pros**: Professional features, real-time data, advanced tools
- **Cons**: Requires internet, limited marker customization
- **Best for**: Live trading, market analysis, professional presentation

## Marker Customization

You can customize markers by modifying the trade data or using the chart configuration:

```tsx
// Custom marker colors based on trade outcome
const getMarkerColor = (trade: Trade) => {
  if (!trade.exitPrice) return '#3b82f6'; // Blue for open trades
  
  const isProfit = (trade.side === 'long' && trade.exitPrice > trade.entryPrice) ||
                   (trade.side === 'short' && trade.exitPrice < trade.entryPrice);
  
  return isProfit ? '#10b981' : '#ef4444'; // Green for profit, red for loss
};
```

## Performance Considerations

### For Large Datasets
- Use `TradingViewChartWithMarkers` for better performance
- Implement virtualization for multiple charts
- Consider lazy loading for off-screen charts

### For Real-time Updates
- Use TradingView widget for live data
- Implement debounced updates for rapid changes
- Cache chart instances to avoid re-initialization

## Troubleshooting

### TradingView Not Loading
1. Check if TradingView script is included in `index.html`
2. Verify internet connection for widget functionality
3. Component automatically falls back to lightweight charts

### Markers Not Appearing
1. Ensure trade has valid `timestamp` and `entryPrice`
2. Check that chart is fully initialized before adding markers
3. Verify marker data format matches expected structure

### Performance Issues
1. Use lightweight charts for multiple simultaneous charts
2. Implement proper cleanup in `useEffect`
3. Consider memoization for expensive calculations

## Dependencies

- `lightweight-charts`: For high-performance charting
- `react`: Core React functionality
- `lucide-react`: Icons for UI elements

## Browser Support

- Modern browsers with ES6+ support
- Mobile browsers (responsive design)
- TradingView widget requires internet connection

## Future Enhancements

- [ ] Real-time price updates
- [ ] Multiple timeframe sync
- [ ] Drawing tools integration
- [ ] Export chart as image
- [ ] Custom indicator support
- [ ] WebSocket integration for live data
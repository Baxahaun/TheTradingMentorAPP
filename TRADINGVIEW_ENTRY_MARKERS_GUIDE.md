# TradingView Charts with Entry/Exit Markers - Implementation Guide

This guide explains how to display TradingView charts with trade entry and exit markers in your trading application.

## Overview

We've implemented a comprehensive charting solution that displays:
- **Entry points** with directional arrows (green for long, red for short)
- **Exit points** with profit/loss indication
- **Stop Loss levels** with red dashed lines
- **Take Profit levels** with green dashed lines
- **Entry price line** as reference

## Quick Start

### 1. Basic Usage

```tsx
import TradeChart from './components/charts/TradeChart';
import { Trade } from './types/trade';

const MyComponent = () => {
  const trade: Trade = {
    id: 'trade-1',
    currencyPair: 'EUR/USD',
    side: 'long',
    entryPrice: 1.0850,
    exitPrice: 1.0920,
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    timestamp: Date.now(),
    // ... other trade properties
  };

  return (
    <TradeChart
      trade={trade}
      height={500}
      preferredChart="lightweight"
    />
  );
};
```

### 2. Advanced Usage with Hooks

```tsx
import { useTradeChart } from './hooks/useTradeChart';
import TradeChart from './components/charts/TradeChart';

const AdvancedTradeView = ({ trade }) => {
  const {
    config,
    toggleMarkers,
    setTimeframe,
    tradeMetrics
  } = useTradeChart(trade);

  return (
    <div>
      <div className="controls mb-4">
        <button onClick={toggleMarkers}>
          Toggle Markers
        </button>
        <select onChange={(e) => setTimeframe(e.target.value)}>
          <option value="1H">1 Hour</option>
          <option value="4H">4 Hours</option>
          <option value="1D">1 Day</option>
        </select>
      </div>
      
      <TradeChart trade={trade} />
      
      <div className="metrics mt-4">
        <p>P&L: ${tradeMetrics.pnl}</p>
        <p>Pips: {tradeMetrics.pips}</p>
        <p>Risk/Reward: {tradeMetrics.riskReward}</p>
      </div>
    </div>
  );
};
```

## Chart Types Available

### 1. TradeChart (Recommended)
- **File**: `src/components/charts/TradeChart.tsx`
- **Features**: Unified interface, automatic fallback, full marker support
- **Best for**: General use, production applications

### 2. TradingViewChartWithMarkers
- **File**: `src/components/charts/TradingViewChartWithMarkers.tsx`
- **Features**: Lightweight-charts based, high performance, full control
- **Best for**: Performance-critical applications, custom implementations

### 3. Enhanced TradingViewChart
- **File**: `src/components/trade-review/TradingViewChart.tsx`
- **Features**: TradingView widget with marker integration
- **Best for**: Professional trading platforms, real-time data

## Marker Types and Visualization

### Entry Markers
```tsx
// Long position entry
{
  position: 'belowBar',
  color: '#10b981', // Green
  shape: 'arrowUp',
  text: 'Entry: 1.0850'
}

// Short position entry
{
  position: 'aboveBar',
  color: '#ef4444', // Red
  shape: 'arrowDown',
  text: 'Entry: 1.2650'
}
```

### Exit Markers
```tsx
// Profitable exit
{
  position: 'aboveBar',
  color: '#10b981', // Green
  shape: 'circle',
  text: 'Exit: 1.0920'
}

// Loss exit
{
  position: 'belowBar',
  color: '#ef4444', // Red
  shape: 'circle',
  text: 'Exit: 1.0800'
}
```

### Risk Management Lines
```tsx
// Stop Loss
{
  price: 1.0800,
  color: '#ef4444',
  lineStyle: 'dashed',
  title: 'Stop Loss'
}

// Take Profit
{
  price: 1.0950,
  color: '#10b981',
  lineStyle: 'dashed',
  title: 'Take Profit'
}
```

## Implementation Details

### 1. Trade Data Requirements

Your trade object must include these minimum fields:

```tsx
interface Trade {
  id: string;
  currencyPair: string;    // e.g., 'EUR/USD'
  side: 'long' | 'short';
  entryPrice: number;
  timestamp: number;       // Unix timestamp
  
  // Optional but recommended
  exitPrice?: number;
  timeOut?: string;        // Exit time
  stopLoss?: number;
  takeProfit?: number;
  pips?: number;
  pnl?: number;
}
```

### 2. Chart Configuration

```tsx
interface TradeChartConfig {
  height: number;          // Chart height in pixels
  showMarkers: boolean;    // Show/hide markers
  showControls: boolean;   // Show/hide controls
  chartType: 'tradingview' | 'lightweight';
  timeframe: string;       // '1H', '4H', '1D', etc.
  theme: 'light' | 'dark';
}
```

### 3. Marker Generation

Markers are automatically generated from trade data:

```tsx
const generateMarkers = (trade: Trade) => {
  const markers = [];
  
  // Entry marker
  markers.push({
    time: Math.floor(trade.timestamp / 1000),
    price: trade.entryPrice,
    type: 'entry',
    color: trade.side === 'long' ? '#10b981' : '#ef4444',
    shape: trade.side === 'long' ? 'arrowUp' : 'arrowDown',
    text: `Entry: ${trade.entryPrice}`
  });
  
  // Exit marker (if available)
  if (trade.exitPrice) {
    const isProfit = (trade.side === 'long' && trade.exitPrice > trade.entryPrice) ||
                     (trade.side === 'short' && trade.exitPrice < trade.entryPrice);
    
    markers.push({
      time: Math.floor(new Date(trade.timeOut).getTime() / 1000),
      price: trade.exitPrice,
      type: 'exit',
      color: isProfit ? '#10b981' : '#ef4444',
      shape: 'circle',
      text: `Exit: ${trade.exitPrice}`
    });
  }
  
  return markers;
};
```

## Integration Examples

### 1. Trade Review Page

```tsx
// src/pages/TradeReview.tsx
import TradeChart from '../components/charts/TradeChart';

const TradeReviewPage = ({ tradeId }) => {
  const trade = useTradeData(tradeId);
  
  return (
    <div className="trade-review">
      <div className="trade-info">
        <h2>{trade.currencyPair} - {trade.side.toUpperCase()}</h2>
        <p>Entry: {trade.entryPrice}</p>
        <p>P&L: ${trade.pnl}</p>
      </div>
      
      <div className="chart-container">
        <TradeChart
          trade={trade}
          height={600}
          preferredChart="lightweight"
        />
      </div>
    </div>
  );
};
```

### 2. Trade Dashboard

```tsx
// Multiple trades overview
const TradeDashboard = ({ trades }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {trades.map(trade => (
        <div key={trade.id} className="trade-card">
          <h3>{trade.currencyPair}</h3>
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

### 3. Real-time Trading Interface

```tsx
// Live trading with real-time updates
const LiveTradingInterface = ({ activeTrades }) => {
  return (
    <div className="trading-interface">
      {activeTrades.map(trade => (
        <div key={trade.id} className="active-trade">
          <TradeChart
            trade={trade}
            height={400}
            preferredChart="tradingview" // For real-time data
          />
          <div className="trade-controls">
            <button onClick={() => closeTrade(trade.id)}>
              Close Position
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Customization Options

### 1. Custom Marker Colors

```tsx
const customColors = {
  longEntry: '#00ff00',
  shortEntry: '#ff0000',
  profit: '#32cd32',
  loss: '#dc143c',
  stopLoss: '#ff6347',
  takeProfit: '#90ee90'
};

<TradeChart
  trade={trade}
  markerColors={customColors}
/>
```

### 2. Custom Timeframes

```tsx
const customTimeframes = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1H', label: '1 Hour' },
  { value: '4H', label: '4 Hours' }
];

<TradeChart
  trade={trade}
  availableTimeframes={customTimeframes}
/>
```

### 3. Theme Customization

```tsx
const darkTheme = {
  background: '#1a1a1a',
  textColor: '#ffffff',
  gridColor: '#333333',
  upColor: '#00ff88',
  downColor: '#ff4444'
};

<TradeChart
  trade={trade}
  theme={darkTheme}
/>
```

## Performance Optimization

### 1. For Multiple Charts

```tsx
// Use React.memo to prevent unnecessary re-renders
const OptimizedTradeChart = React.memo(TradeChart);

// Virtualize large lists of charts
import { FixedSizeList as List } from 'react-window';

const TradeChartList = ({ trades }) => (
  <List
    height={600}
    itemCount={trades.length}
    itemSize={400}
  >
    {({ index, style }) => (
      <div style={style}>
        <OptimizedTradeChart trade={trades[index]} />
      </div>
    )}
  </List>
);
```

### 2. Lazy Loading

```tsx
// Lazy load charts for better performance
const LazyTradeChart = React.lazy(() => import('./TradeChart'));

const TradeView = ({ trade }) => (
  <Suspense fallback={<div>Loading chart...</div>}>
    <LazyTradeChart trade={trade} />
  </Suspense>
);
```

## Troubleshooting

### Common Issues

1. **Markers not appearing**
   - Check that trade has valid `timestamp` and `entryPrice`
   - Ensure chart is fully loaded before adding markers
   - Verify marker data format

2. **TradingView not loading**
   - Check internet connection
   - Verify TradingView script is included
   - Component automatically falls back to lightweight charts

3. **Performance issues**
   - Use lightweight charts for multiple simultaneous charts
   - Implement proper cleanup in useEffect
   - Consider virtualization for large datasets

### Debug Mode

```tsx
<TradeChart
  trade={trade}
  debug={true} // Enables console logging
/>
```

## Browser Support

- Modern browsers with ES6+ support
- Mobile browsers (responsive design)
- TradingView widget requires internet connection
- Lightweight charts work offline

## Dependencies

```json
{
  "lightweight-charts": "^5.0.7",
  "react": "^18.3.1",
  "lucide-react": "^0.462.0"
}
```

## Next Steps

1. **View the example**: Check `src/components/examples/TradeChartExample.tsx`
2. **Read the documentation**: See `src/components/charts/README.md`
3. **Customize**: Modify colors, themes, and behavior to match your needs
4. **Integrate**: Add the chart component to your trade review pages

The chart components are now ready to use and will automatically display entry and exit markers based on your trade data!
# TradingView Integration

This document describes the TradingView chart integration implementation and future roadmap.

## Current Implementation

The current implementation provides a professional chart placeholder that:

- Shows trade entry/exit marker previews
- Displays symbol and timeframe controls
- Provides a clean, TradeZella-style layout
- Maintains all trade data and functionality
- Prepares for future TradingView integration

## Future TradingView Integration

The full TradingView integration will include:

- Real-time forex price data
- Native entry/exit markers positioned directly on the chart
- Professional charting tools and indicators
- Interactive chart functionality
- Live market data feeds

## Components

### 1. TradingViewChart Component
**Location:** `src/components/trade-review/TradingViewChart.tsx`

Main React component that renders the TradingView widget with trade markers.

**Features:**
- Full TradingView widget integration
- Symbol and timeframe controls
- Entry/exit marker display
- Error handling and loading states
- Responsive design

### 2. TradingView Service
**Location:** `src/lib/tradingViewService.ts`

Service class that manages TradingView widget lifecycle and marker creation.

**Key Methods:**
- `createWidget()` - Initialize TradingView widget
- `addTradeMarkers()` - Add entry/exit markers to chart
- `setSymbol()` - Change chart symbol
- `destroy()` - Cleanup widget and markers

### 3. Custom Hook
**Location:** `src/hooks/useTradingView.ts`

React hook that simplifies TradingView integration with automatic cleanup.

## Entry/Exit Markers

### Marker Types
- **Entry Marker**: Green circle with up arrow (↗)
- **Exit Marker**: Red circle with down arrow (↙)

### Marker Positioning
Markers are positioned using:
- **Time**: Trade timestamp converted to TradingView format
- **Price**: Exact entry/exit price levels
- **Native Integration**: Markers are part of the chart, not React overlays

### Marker Styling
```javascript
{
  shape: 'circle',
  backgroundColor: '#10b981', // Green for entry, #ef4444 for red
  borderColor: '#059669',     // Darker border
  borderWidth: 2,
  textColor: 'white',
  fontSize: 14,
  fontWeight: 'bold'
}
```

## Usage

### Basic Implementation
```tsx
import TradingViewChart from './components/trade-review/TradingViewChart';

<TradingViewChart
  trade={tradeData}
  className="h-full"
/>
```

### With Custom Hook
```tsx
import { useTradingView } from './hooks/useTradingView';

const { isLoading, error, initializeChart } = useTradingView({
  trade: tradeData,
  theme: 'light',
  interval: '1H'
});
```

## Configuration

### Supported Symbols
The integration automatically formats currency pairs:
- `EUR/USD` → `EURUSD`
- `GBP/JPY` → `GBPJPY`
- etc.

### Supported Timeframes
- 1m, 5m, 15m, 30m
- 1H, 4H
- 1D, 1W

### Theme Options
- `light` (default)
- `dark`

## Trade Data Requirements

The Trade interface must include:

```typescript
interface Trade {
  currencyPair: string;    // e.g., 'EUR/USD'
  timestamp: number;       // Unix timestamp for entry marker
  entryPrice: number;      // Entry price level
  exitPrice?: number;      // Exit price level (optional)
  direction?: 'long' | 'short'; // Trade direction
  // ... other fields
}
```

## Integration Points

### CondensedTradeReview
The TradingView chart replaces the previous ChartGalleryManager:

```tsx
// Before
<ChartGalleryManagerWrapper ... />

// After
<TradingViewChart trade={editedTrade} className="h-full" />
```

### HTML Setup
TradingView script is loaded in `index.html`:

```html
<script src="https://s3.tradingview.com/tv.js"></script>
```

## Error Handling

The integration includes comprehensive error handling:

- **Library Loading**: Checks if TradingView library is available
- **Widget Creation**: Handles widget initialization failures
- **Marker Creation**: Graceful fallback if markers fail to create
- **Network Issues**: Displays error states with retry options

## Performance Considerations

- **Lazy Loading**: TradingView library loads asynchronously
- **Cleanup**: Proper widget destruction prevents memory leaks
- **Marker Management**: Efficient marker creation/removal
- **Debounced Updates**: Prevents excessive API calls

## Browser Compatibility

TradingView charts work in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Limitations

1. **Internet Required**: Charts require internet connection for real-time data
2. **TradingView Terms**: Subject to TradingView's terms of service
3. **Symbol Availability**: Limited to symbols available on TradingView
4. **Rate Limits**: TradingView may have API rate limits

## Future Enhancements

Potential improvements:
- Custom indicator overlays
- Drawing tool integration
- Chart template saving
- Multiple timeframe analysis
- Advanced marker customization
- Offline chart support

## Troubleshooting

### Common Issues

**Chart not loading:**
- Check internet connection
- Verify TradingView script is loaded
- Check browser console for errors

**Markers not appearing:**
- Verify trade has valid timestamp and prices
- Check if symbol is available on TradingView
- Ensure chart is fully loaded before adding markers

**Performance issues:**
- Limit number of simultaneous charts
- Use appropriate timeframes
- Clean up widgets when components unmount

### Debug Mode

Enable debug logging:
```javascript
// In tradingViewService.ts
console.log('TradingView Debug:', { trade, markers, widget });
```

## Support

For TradingView-specific issues:
- [TradingView Charting Library Documentation](https://www.tradingview.com/charting-library-docs/)
- [TradingView Community](https://www.tradingview.com/support/)

For integration issues:
- Check browser console for errors
- Verify trade data format
- Test with different symbols/timeframes
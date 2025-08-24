import React from 'react';
import { Trade } from '../../types/trade';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface TradingViewChartPlaceholderProps {
  trade: Trade;
  className?: string;
}

const TradingViewChartPlaceholder: React.FC<TradingViewChartPlaceholderProps> = ({ 
  trade, 
  className = '' 
}) => {
  const [currentSymbol, setCurrentSymbol] = React.useState(trade.currencyPair || 'EUR/USD');
  const [timeframe, setTimeframe] = React.useState('1H');

  // Common forex pairs for quick selection
  const forexPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF',
    'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY',
    'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD'
  ];

  const timeframes = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '1H', label: '1H' },
    { value: '4H', label: '4H' },
    { value: '1D', label: '1D' },
    { value: '1W', label: '1W' }
  ];

  // Calculate some basic metrics for display
  const profitLoss = trade.exitPrice && trade.entryPrice 
    ? (trade.exitPrice - trade.entryPrice) * (trade.lotSize || 1)
    : 0;
  const isProfit = profitLoss > 0;

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Symbol:</label>
            <Select value={currentSymbol} onValueChange={setCurrentSymbol}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {forexPairs.map(pair => (
                  <SelectItem key={pair} value={pair}>
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Timeframe:</label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map(tf => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Chart Placeholder */}
      <div className="flex-1 relative bg-white rounded-lg border">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Professional Chart Coming Soon</h3>
            <p className="text-gray-500 text-base mb-6">
              TradingView integration requires the full Charting Library license. 
              This placeholder shows your trade data and will be replaced with live charts.
            </p>
            
            {/* Trade Markers Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Trade Markers Preview</h4>
              <div className="flex items-center justify-center space-x-8">
                {/* Entry Marker */}
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Entry</div>
                    <div className="text-sm font-semibold">{trade.entryPrice}</div>
                  </div>
                </div>

                {/* Exit Marker */}
                {trade.exitPrice && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 ${isProfit ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                      <TrendingDown className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500">Exit</div>
                      <div className="text-sm font-semibold">{trade.exitPrice}</div>
                    </div>
                  </div>
                )}

                {/* Open Position */}
                {!trade.exitPrice && (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-500">Open</div>
                      <div className="text-sm font-semibold">Active</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-400">
              <p>Chart will display: {currentSymbol} • {timeframe} timeframe</p>
              <p>Entry and exit markers will be positioned at exact price levels</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Info Footer */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Entry: <strong className="text-gray-900">{trade.entryPrice}</strong></span>
            {trade.exitPrice && (
              <span>Exit: <strong className="text-gray-900">{trade.exitPrice}</strong></span>
            )}
            {profitLoss !== 0 && (
              <span className={isProfit ? 'text-green-600' : 'text-red-600'}>
                P&L: <strong>{profitLoss > 0 ? '+' : ''}{profitLoss.toFixed(2)}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Entry</span>
            {trade.exitPrice && (
              <>
                <div className={`w-3 h-3 ${isProfit ? 'bg-green-500' : 'bg-red-500'} rounded-full ml-4`}></div>
                <span>Exit</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewChartPlaceholder;
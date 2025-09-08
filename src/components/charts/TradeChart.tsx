/**
 * Trade Chart Component - Displays trading charts with entry/exit markers
 * Supports both TradingView widget and lightweight-charts as fallback
 */

import React, { useState, useEffect } from 'react';
import { Trade } from '../../types/trade';
import TradingViewChartWithMarkers from './TradingViewChartWithMarkers';
import TradingViewChart from '../trade-review/TradingViewChart';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart3, Settings, Eye, EyeOff } from 'lucide-react';

interface TradeChartProps {
  trade: Trade;
  className?: string;
  height?: number;
  preferredChart?: 'tradingview' | 'lightweight';
}

type ChartType = 'tradingview' | 'lightweight';

const TradeChart: React.FC<TradeChartProps> = ({
  trade,
  className = '',
  height = 500,
  preferredChart = 'lightweight'
}) => {
  const [currentChart, setCurrentChart] = useState<ChartType>(preferredChart);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Check if TradingView is available
  const isTradingViewAvailable = () => {
    return typeof window !== 'undefined' && window.TradingView;
  };

  // Handle chart type change
  const handleChartTypeChange = (chartType: ChartType) => {
    if (chartType === 'tradingview' && !isTradingViewAvailable()) {
      setChartError('TradingView library not available. Using lightweight charts instead.');
      setCurrentChart('lightweight');
      return;
    }
    
    setCurrentChart(chartType);
    setChartError(null);
  };

  // Auto-fallback to lightweight charts if TradingView fails
  useEffect(() => {
    if (currentChart === 'tradingview' && !isTradingViewAvailable()) {
      console.warn('TradingView not available, falling back to lightweight charts');
      setCurrentChart('lightweight');
    }
  }, [currentChart]);

  const chartTypes = [
    { value: 'lightweight' as ChartType, label: 'Lightweight Charts', available: true },
    { value: 'tradingview' as ChartType, label: 'TradingView', available: isTradingViewAvailable() }
  ];

  return (
    <div className={`trade-chart ${className}`}>
      {/* Chart Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Chart Type:</span>
              <Select value={currentChart} onValueChange={handleChartTypeChange}>
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      disabled={!type.available}
                    >
                      {type.label}
                      {!type.available && ' (Not Available)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMarkers(!showMarkers)}
                className="h-8"
              >
                {showMarkers ? (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Hide Markers
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Show Markers
                  </>
                )}
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowControls(false)}
            className="h-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Error Message */}
      {chartError && (
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 text-sm">
          {chartError}
        </div>
      )}

      {/* Chart Container */}
      <div className="relative">
        {currentChart === 'lightweight' ? (
          <TradingViewChartWithMarkers
            trade={trade}
            height={height}
            showControls={!showControls}
            className="rounded-lg"
          />
        ) : (
          <TradingViewChart
            trade={trade}
            className="rounded-lg"
          />
        )}

        {/* Show Controls Button (when hidden) */}
        {!showControls && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowControls(true)}
            className="absolute top-4 right-4 z-10 bg-white shadow-md"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Trade Summary */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Symbol:</span>
            <div className="font-semibold">{trade.currencyPair}</div>
          </div>
          
          <div>
            <span className="text-gray-500">Direction:</span>
            <div className={`font-semibold ${
              trade.side === 'long' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trade.side.toUpperCase()}
            </div>
          </div>
          
          <div>
            <span className="text-gray-500">Entry:</span>
            <div className="font-semibold">{trade.entryPrice}</div>
          </div>
          
          {trade.exitPrice && (
            <div>
              <span className="text-gray-500">Exit:</span>
              <div className="font-semibold">{trade.exitPrice}</div>
            </div>
          )}
          
          {trade.pips && (
            <div>
              <span className="text-gray-500">Pips:</span>
              <div className={`font-semibold ${
                trade.pips > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trade.pips > 0 ? '+' : ''}{trade.pips.toFixed(1)}
              </div>
            </div>
          )}
          
          {trade.pnl && (
            <div>
              <span className="text-gray-500">P&L:</span>
              <div className={`font-semibold ${
                trade.pnl > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
              </div>
            </div>
          )}
          
          {trade.stopLoss && (
            <div>
              <span className="text-gray-500">Stop Loss:</span>
              <div className="font-semibold text-red-600">{trade.stopLoss}</div>
            </div>
          )}
          
          {trade.takeProfit && (
            <div>
              <span className="text-gray-500">Take Profit:</span>
              <div className="font-semibold text-green-600">{trade.takeProfit}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeChart;
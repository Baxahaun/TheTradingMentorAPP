import React, { useEffect, useRef, useState } from 'react';
import { Trade } from '../../types/trade';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart3, RefreshCw } from 'lucide-react';

interface TradingViewChartProps {
  trade: Trade;
  className?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  trade, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('1H');

  // Get symbol from trade data
  const getSymbol = () => {
    if (trade.currencyPair) {
      // Convert EUR/USD to EURUSD format
      return trade.currencyPair.replace('/', '').toUpperCase();
    }
    return 'EURUSD'; // Default fallback
  };

  // Initialize TradingView widget
  const initializeChart = async () => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if TradingView is available
      if (!window.TradingView) {
        throw new Error('TradingView library not loaded');
      }

      const symbol = getSymbol();
      setCurrentSymbol(symbol);

      // Create TradingView widget
      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: `FX:${symbol}`,
        interval: timeframe,
        timezone: "Etc/UTC",
        theme: "light",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerRef.current.id,
        hide_side_toolbar: false,
        studies: [],
        overrides: {
          "paneProperties.background": "#ffffff",
          "paneProperties.vertGridProperties.color": "#f0f0f0",
          "paneProperties.horzGridProperties.color": "#f0f0f0",
          "symbolWatermarkProperties.transparency": 90,
          "scalesProperties.textColor": "#666666"
        }
      });

      // Wait for chart to be ready
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);

    } catch (err) {
      console.error('Failed to initialize TradingView chart:', err);
      setError('Failed to load chart. Please check your internet connection.');
      setIsLoading(false);
    }
  };

  // Handle symbol change
  const handleSymbolChange = (newSymbol: string) => {
    setCurrentSymbol(newSymbol);
    if (widgetRef.current && widgetRef.current.setSymbol) {
      widgetRef.current.setSymbol(`FX:${newSymbol}`, timeframe);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    // Reinitialize with new timeframe
    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
      setTimeout(initializeChart, 100);
    }
  };

  // Refresh chart
  const handleRefresh = () => {
    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }
    setTimeout(initializeChart, 100);
  };

  // Initialize chart on mount
  useEffect(() => {
    const containerId = `tradingview_${Date.now()}`;
    if (containerRef.current) {
      containerRef.current.id = containerId;
    }

    // Wait for TradingView to be available
    const checkTradingView = () => {
      if (window.TradingView) {
        initializeChart();
      } else {
        setTimeout(checkTradingView, 100);
      }
    };

    checkTradingView();

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error removing TradingView widget:', e);
        }
      }
    };
  }, []);

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

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Chart Loading Error</h3>
          <p className="text-gray-500 text-base mb-4 max-w-md mx-auto">
            {error}
          </p>
          <Button onClick={handleRefresh} className="px-6 py-3">
            <RefreshCw className="w-5 h-5 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Chart Container - Full Height */}
      <div className="flex-1 relative bg-white rounded-lg border" style={{ minHeight: '85vh' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
              <p className="text-gray-600">Loading TradingView chart...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={containerRef}
          className="w-full h-full rounded-lg"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Trade Info Footer */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Entry: <strong className="text-gray-900">{trade.entryPrice}</strong></span>
            {trade.exitPrice && (
              <span>Exit: <strong className="text-gray-900">{trade.exitPrice}</strong></span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Entry</span>
            {trade.exitPrice && (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full ml-4"></div>
                <span>Exit</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;
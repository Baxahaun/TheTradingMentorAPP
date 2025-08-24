import { useEffect, useRef, useState } from 'react';
import { Trade } from '../types/trade';
import { tradingViewService, TradingViewService, TradingViewConfig } from '../lib/tradingViewService';

interface UseTradingViewOptions {
  trade: Trade;
  containerId?: string;
  theme?: 'light' | 'dark';
  interval?: string;
}

export const useTradingView = ({
  trade,
  containerId,
  theme = 'light',
  interval = '1H'
}: UseTradingViewOptions) => {
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<string>('');

  // Get symbol from trade data
  const getSymbol = () => {
    if (trade.currencyPair) {
      return TradingViewService.formatSymbol(trade.currencyPair);
    }
    return 'EURUSD'; // Default fallback
  };

  // Initialize chart
  const initializeChart = async (containerElementId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const symbol = getSymbol();
      setCurrentSymbol(symbol);

      const config: TradingViewConfig = {
        containerId: containerElementId,
        symbol: symbol,
        interval: interval,
        theme: theme,
        width: '100%',
        height: '100%',
        timezone: 'Etc/UTC',
        locale: 'en'
      };

      const widget = await tradingViewService.createWidget(config);
      widgetRef.current = widget;

      // Add trade markers after chart is ready
      setTimeout(() => {
        tradingViewService.addTradeMarkers(trade);
        setIsLoading(false);
      }, 1000);

    } catch (err) {
      console.error('Failed to initialize TradingView chart:', err);
      setError('Failed to load chart. Please try again.');
      setIsLoading(false);
    }
  };

  // Change symbol
  const changeSymbol = (newSymbol: string) => {
    setCurrentSymbol(newSymbol);
    tradingViewService.setSymbol(newSymbol);
    // Re-add markers after symbol change
    setTimeout(() => {
      tradingViewService.addTradeMarkers(trade);
    }, 1000);
  };

  // Refresh chart
  const refresh = () => {
    if (widgetRef.current && containerId) {
      tradingViewService.destroy();
      setTimeout(() => initializeChart(containerId), 100);
    }
  };

  // Update markers when trade changes
  useEffect(() => {
    if (widgetRef.current && !isLoading) {
      tradingViewService.addTradeMarkers(trade);
    }
  }, [trade, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tradingViewService.destroy();
    };
  }, []);

  return {
    isLoading,
    error,
    currentSymbol,
    initializeChart,
    changeSymbol,
    refresh,
    widget: widgetRef.current
  };
};
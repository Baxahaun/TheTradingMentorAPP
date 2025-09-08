/**
 * Hook for managing trade chart state and interactions
 */

import { useState, useCallback, useEffect } from 'react';
import { Trade } from '../types/trade';

export interface TradeChartConfig {
  height: number;
  showMarkers: boolean;
  showControls: boolean;
  chartType: 'tradingview' | 'lightweight';
  timeframe: string;
  theme: 'light' | 'dark';
}

export interface TradeChartState {
  config: TradeChartConfig;
  isLoading: boolean;
  error: string | null;
  markers: any[];
}

const DEFAULT_CONFIG: TradeChartConfig = {
  height: 500,
  showMarkers: true,
  showControls: true,
  chartType: 'lightweight',
  timeframe: '1H',
  theme: 'light'
};

export function useTradeChart(trade: Trade, initialConfig?: Partial<TradeChartConfig>) {
  const [config, setConfig] = useState<TradeChartConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });
  
  const [state, setState] = useState<Omit<TradeChartState, 'config'>>({
    isLoading: false,
    error: null,
    markers: []
  });

  // Update configuration
  const updateConfig = useCallback((updates: Partial<TradeChartConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle markers visibility
  const toggleMarkers = useCallback(() => {
    updateConfig({ showMarkers: !config.showMarkers });
  }, [config.showMarkers, updateConfig]);

  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    updateConfig({ showControls: !config.showControls });
  }, [config.showControls, updateConfig]);

  // Change chart type
  const setChartType = useCallback((chartType: 'tradingview' | 'lightweight') => {
    updateConfig({ chartType });
  }, [updateConfig]);

  // Change timeframe
  const setTimeframe = useCallback((timeframe: string) => {
    updateConfig({ timeframe });
  }, [updateConfig]);

  // Set loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Calculate trade metrics for display
  const tradeMetrics = useCallback(() => {
    const metrics = {
      duration: 0,
      pips: trade.pips || 0,
      pnl: trade.pnl || 0,
      riskReward: 0,
      isProfit: false
    };

    // Calculate duration if exit time is available
    if (trade.timeOut) {
      const entryTime = new Date(trade.timestamp);
      const exitTime = new Date(trade.timeOut);
      metrics.duration = exitTime.getTime() - entryTime.getTime();
    }

    // Calculate risk-reward ratio
    if (trade.stopLoss && trade.takeProfit) {
      const risk = Math.abs(trade.entryPrice - trade.stopLoss);
      const reward = Math.abs(trade.takeProfit - trade.entryPrice);
      metrics.riskReward = reward / risk;
    }

    // Determine if trade is profitable
    if (trade.exitPrice) {
      metrics.isProfit = (trade.side === 'long' && trade.exitPrice > trade.entryPrice) ||
                        (trade.side === 'short' && trade.exitPrice < trade.entryPrice);
    }

    return metrics;
  }, [trade]);

  // Generate chart markers based on trade data
  const generateMarkers = useCallback(() => {
    const markers = [];

    // Entry marker
    markers.push({
      id: `entry-${trade.id}`,
      time: Math.floor(trade.timestamp / 1000),
      price: trade.entryPrice,
      type: 'entry',
      direction: trade.side,
      color: trade.side === 'long' ? '#10b981' : '#ef4444',
      text: `Entry: ${trade.entryPrice}`,
      shape: trade.side === 'long' ? 'arrowUp' : 'arrowDown'
    });

    // Exit marker (if available)
    if (trade.exitPrice && trade.timeOut) {
      const isProfit = tradeMetrics().isProfit;
      markers.push({
        id: `exit-${trade.id}`,
        time: Math.floor(new Date(trade.timeOut).getTime() / 1000),
        price: trade.exitPrice,
        type: 'exit',
        direction: trade.side,
        color: isProfit ? '#10b981' : '#ef4444',
        text: `Exit: ${trade.exitPrice}`,
        shape: 'circle'
      });
    }

    // Stop Loss marker
    if (trade.stopLoss) {
      markers.push({
        id: `sl-${trade.id}`,
        time: Math.floor(trade.timestamp / 1000),
        price: trade.stopLoss,
        type: 'stopLoss',
        direction: trade.side,
        color: '#ef4444',
        text: `SL: ${trade.stopLoss}`,
        shape: 'square'
      });
    }

    // Take Profit marker
    if (trade.takeProfit) {
      markers.push({
        id: `tp-${trade.id}`,
        time: Math.floor(trade.timestamp / 1000),
        price: trade.takeProfit,
        type: 'takeProfit',
        direction: trade.side,
        color: '#10b981',
        text: `TP: ${trade.takeProfit}`,
        shape: 'square'
      });
    }

    setState(prev => ({ ...prev, markers }));
    return markers;
  }, [trade, tradeMetrics]);

  // Auto-generate markers when trade changes
  useEffect(() => {
    generateMarkers();
  }, [generateMarkers]);

  // Check if TradingView is available
  const isTradingViewAvailable = useCallback(() => {
    return typeof window !== 'undefined' && window.TradingView;
  }, []);

  // Auto-fallback to lightweight charts if TradingView is not available
  useEffect(() => {
    if (config.chartType === 'tradingview' && !isTradingViewAvailable()) {
      console.warn('TradingView not available, falling back to lightweight charts');
      setChartType('lightweight');
      setError('TradingView library not available. Using lightweight charts instead.');
    }
  }, [config.chartType, isTradingViewAvailable, setChartType, setError]);

  // Format symbol for different chart types
  const formatSymbol = useCallback((symbol: string, chartType: 'tradingview' | 'lightweight') => {
    if (chartType === 'tradingview') {
      // TradingView format: FX:EURUSD
      return `FX:${symbol.replace('/', '').toUpperCase()}`;
    } else {
      // Lightweight charts format: EUR/USD
      return symbol.toUpperCase();
    }
  }, []);

  // Get available timeframes for current chart type
  const getAvailableTimeframes = useCallback(() => {
    if (config.chartType === 'tradingview') {
      return [
        { value: '1', label: '1m' },
        { value: '5', label: '5m' },
        { value: '15', label: '15m' },
        { value: '30', label: '30m' },
        { value: '1H', label: '1H' },
        { value: '4H', label: '4H' },
        { value: '1D', label: '1D' },
        { value: '1W', label: '1W' }
      ];
    } else {
      return [
        { value: '1H', label: '1H' },
        { value: '4H', label: '4H' },
        { value: '1D', label: '1D' }
      ];
    }
  }, [config.chartType]);

  return {
    // Configuration
    config,
    updateConfig,
    
    // State
    ...state,
    
    // Actions
    toggleMarkers,
    toggleControls,
    setChartType,
    setTimeframe,
    setLoading,
    setError,
    
    // Data
    tradeMetrics: tradeMetrics(),
    markers: state.markers,
    
    // Utilities
    isTradingViewAvailable,
    formatSymbol,
    getAvailableTimeframes,
    generateMarkers
  };
}

export default useTradeChart;
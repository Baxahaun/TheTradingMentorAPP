import { Trade } from '../types/trade';

// TradingView types (basic definitions)
declare global {
  interface Window {
    TradingView: any;
  }
}

export interface TradeMarker {
  time: number;
  price: number;
  type: 'entry' | 'exit';
  direction: 'long' | 'short';
  color: string;
  text: string;
}

export interface TradingViewConfig {
  containerId: string;
  symbol: string;
  interval: string;
  theme: 'light' | 'dark';
  width: string | number;
  height: string | number;
  timezone: string;
  locale: string;
}

export class TradingViewService {
  private widget: any = null;
  private chart: any = null;
  private markers: any[] = [];

  /**
   * Initialize TradingView widget
   */
  createWidget(config: TradingViewConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!window.TradingView) {
        reject(new Error('TradingView library not loaded'));
        return;
      }

      try {
        this.widget = new window.TradingView.widget({
          width: config.width,
          height: config.height,
          symbol: config.symbol,
          interval: config.interval,
          timezone: config.timezone,
          theme: config.theme,
          style: '1', // Candlestick chart
          locale: config.locale,
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: config.containerId,
          // Professional styling
          overrides: {
            'paneProperties.background': '#ffffff',
            'paneProperties.vertGridProperties.color': '#f0f0f0',
            'paneProperties.horzGridProperties.color': '#f0f0f0',
            'symbolWatermarkProperties.transparency': 90,
            'scalesProperties.textColor': '#666666',
          },
          studies_overrides: {},
          loading_screen: {
            backgroundColor: '#ffffff',
            foregroundColor: '#666666'
          },
          disabled_features: [
            'use_localstorage_for_settings',
            'volume_force_overlay',
            'create_volume_indicator_by_default'
          ],
          enabled_features: [
            'study_templates',
            'side_toolbar_in_fullscreen_mode'
          ]
        });

        this.widget.onChartReady(() => {
          this.chart = this.widget.chart();
          resolve(this.widget);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add trade markers to the chart
   */
  addTradeMarkers(trade: Trade): void {
    if (!this.chart) {
      console.warn('Chart not ready for markers');
      return;
    }

    try {
      // Clear existing markers
      this.clearMarkers();

      // Create entry marker
      if (trade.timestamp && trade.entryPrice) {
        const entryMarker = this.createTradeMarker({
          time: new Date(trade.timestamp).getTime() / 1000, // TradingView uses seconds
          price: trade.entryPrice,
          type: 'entry',
          direction: trade.direction || 'long',
          color: '#10b981',
          text: '↗'
        });

        this.markers.push(entryMarker);
      }

      // Create exit marker (if trade is closed)
      if (trade.exitPrice && trade.timestamp) {
        // For demo purposes, assume exit is 1 hour after entry
        // In real implementation, you'd have actual exit timestamp
        const exitTime = new Date(trade.timestamp).getTime() / 1000 + 3600;
        
        const exitMarker = this.createTradeMarker({
          time: exitTime,
          price: trade.exitPrice,
          type: 'exit',
          direction: trade.direction || 'long',
          color: '#ef4444',
          text: '↙'
        });

        this.markers.push(exitMarker);
      }

    } catch (error) {
      console.error('Error adding trade markers:', error);
    }
  }

  /**
   * Create individual trade marker
   */
  private createTradeMarker(marker: TradeMarker): any {
    try {
      return this.chart.createShape(
        { time: marker.time, price: marker.price },
        {
          shape: 'circle',
          lock: true,
          disableSelection: true,
          disableUndo: true,
          text: marker.text,
          overrides: {
            backgroundColor: marker.color,
            borderColor: this.darkenColor(marker.color),
            borderWidth: 2,
            textColor: 'white',
            fontSize: 14,
            fontWeight: 'bold',
            transparency: 0
          }
        }
      );
    } catch (error) {
      console.error('Error creating marker:', error);
      return null;
    }
  }

  /**
   * Clear all markers from chart
   */
  clearMarkers(): void {
    this.markers.forEach(marker => {
      try {
        if (marker && this.chart) {
          this.chart.removeEntity(marker);
        }
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });
    this.markers = [];
  }

  /**
   * Change chart symbol
   */
  setSymbol(symbol: string): void {
    if (this.widget) {
      this.widget.setSymbol(symbol, '1H');
    }
  }

  /**
   * Get currency pair symbol for TradingView
   */
  static formatSymbol(currencyPair: string): string {
    // Convert pairs like 'EUR/USD' to 'EURUSD' for TradingView
    return currencyPair.replace('/', '').toUpperCase();
  }

  /**
   * Destroy widget and cleanup
   */
  destroy(): void {
    this.clearMarkers();
    if (this.widget) {
      try {
        this.widget.remove();
      } catch (error) {
        console.warn('Error destroying widget:', error);
      }
      this.widget = null;
      this.chart = null;
    }
  }

  /**
   * Utility to darken color for borders
   */
  private darkenColor(color: string): string {
    const colorMap: { [key: string]: string } = {
      '#10b981': '#059669', // Green
      '#ef4444': '#dc2626', // Red
    };
    return colorMap[color] || color;
  }

  /**
   * Get appropriate timeframe based on trade duration
   */
  static getTimeframe(trade: Trade): string {
    // Default to 1H for forex trades
    // Could be enhanced based on trade duration
    return '1H';
  }
}

export const tradingViewService = new TradingViewService();
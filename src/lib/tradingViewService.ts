import { Trade } from '../types/trade';

// TradingView types (basic definitions)
declare global {
  interface Window {
    TradingView: {
      widget: new (config: any) => any;
    };
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
      // Check if TradingView is available
      if (typeof window === 'undefined' || !window.TradingView) {
        reject(new Error('TradingView library not loaded. Please ensure the TradingView script is included.'));
        return;
      }

      // Wait a bit for TradingView to fully initialize
      setTimeout(() => {
        try {
          // Use the correct TradingView widget configuration based on latest docs
          this.widget = new window.TradingView.widget({
            container: config.containerId,
            width: config.width,
            height: config.height,
            symbol: config.symbol,
            interval: config.interval,
            timezone: config.timezone,
            theme: config.theme,
            locale: config.locale,
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            // Use demo datafeed for now - this provides basic functionality
            datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed("https://demo-feed-data.tradingview.com"),
            library_path: "https://s3.tradingview.com/tv.js",
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
              'study_templates'
            ]
          });

          this.widget.onChartReady(() => {
            this.chart = this.widget.chart();
            resolve(this.widget);
          });

        } catch (error) {
          reject(error);
        }
      }, 500); // Increased delay to ensure TradingView is ready
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

      // For now, let's use a simpler approach - just log the trade data
      // The advanced marker functionality requires the full TradingView Charting Library
      // which needs proper licensing and setup
      console.log('Trade markers would be placed at:', {
        entry: {
          time: new Date(trade.timestamp).toISOString(),
          price: trade.entryPrice,
          type: 'entry'
        },
        exit: trade.exitPrice ? {
          time: new Date(trade.timestamp + 3600000).toISOString(), // 1 hour later
          price: trade.exitPrice,
          type: 'exit'
        } : null
      });

      // TODO: Implement actual marker creation when full TradingView library is available
      // This would require:
      // 1. Proper TradingView Charting Library license
      // 2. Full library files (not just the widget script)
      // 3. Custom datafeed implementation

    } catch (error) {
      console.error('Error adding trade markers:', error);
    }
  }

  /**
   * Create individual trade marker
   */
  private createTradeMarker(marker: TradeMarker): any {
    try {
      // Use TradingView's createMultipointShape for markers
      return this.chart.createMultipointShape([
        { time: marker.time, price: marker.price }
      ], {
        shape: 'arrow_up' + (marker.type === 'exit' ? '_down' : ''),
        lock: true,
        disableSelection: true,
        disableUndo: true,
        overrides: {
          backgroundColor: marker.color,
          borderColor: this.darkenColor(marker.color),
          borderWidth: 2,
          textColor: 'white',
          transparency: 0
        }
      });
    } catch (error) {
      console.error('Error creating marker:', error);
      // Fallback to simple shape if createMultipointShape fails
      try {
        return this.chart.createShape(
          { time: marker.time, price: marker.price },
          {
            shape: 'arrow_up',
            lock: true,
            disableSelection: true,
            disableUndo: true,
            overrides: {
              backgroundColor: marker.color,
              borderColor: this.darkenColor(marker.color),
              borderWidth: 2,
              transparency: 0
            }
          }
        );
      } catch (fallbackError) {
        console.error('Fallback marker creation failed:', fallbackError);
        return null;
      }
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
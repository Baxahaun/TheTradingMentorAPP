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

      const entryTime = Math.floor(trade.timestamp / 1000);
      
      // Create entry marker
      const entryMarker: TradeMarker = {
        time: entryTime,
        price: trade.entryPrice,
        type: 'entry',
        direction: trade.side,
        color: trade.side === 'long' ? '#10b981' : '#ef4444',
        text: `Entry: ${trade.entryPrice}`
      };

      const entryShape = this.createTradeMarker(entryMarker);
      if (entryShape) {
        this.markers.push(entryShape);
      }

      // Create exit marker if trade is closed
      if (trade.exitPrice && trade.timeOut) {
        const exitTime = Math.floor(new Date(trade.timeOut).getTime() / 1000);
        const isProfit = (trade.side === 'long' && trade.exitPrice > trade.entryPrice) ||
                        (trade.side === 'short' && trade.exitPrice < trade.entryPrice);

        const exitMarker: TradeMarker = {
          time: exitTime,
          price: trade.exitPrice,
          type: 'exit',
          direction: trade.side,
          color: isProfit ? '#10b981' : '#ef4444',
          text: `Exit: ${trade.exitPrice}`
        };

        const exitShape = this.createTradeMarker(exitMarker);
        if (exitShape) {
          this.markers.push(exitShape);
        }
      }

      // Add price lines for SL/TP
      this.addPriceLines(trade);

      console.log(`Added ${this.markers.length} markers for trade ${trade.id}`);

    } catch (error) {
      console.error('Error adding trade markers:', error);
    }
  }

  /**
   * Add price lines for stop loss and take profit
   */
  private addPriceLines(trade: Trade): void {
    if (!this.chart) return;

    try {
      // Entry price line
      const entryLine = this.chart.createHorizontalLine()
        .setPrice(trade.entryPrice)
        .setColor('#3b82f6')
        .setWidth(2)
        .setText(`Entry: ${trade.entryPrice}`);
      
      if (entryLine) {
        this.markers.push(entryLine);
      }

      // Stop loss line
      if (trade.stopLoss) {
        const slLine = this.chart.createHorizontalLine()
          .setPrice(trade.stopLoss)
          .setColor('#ef4444')
          .setWidth(2)
          .setLineStyle(1) // Dashed
          .setText(`SL: ${trade.stopLoss}`);
        
        if (slLine) {
          this.markers.push(slLine);
        }
      }

      // Take profit line
      if (trade.takeProfit) {
        const tpLine = this.chart.createHorizontalLine()
          .setPrice(trade.takeProfit)
          .setColor('#10b981')
          .setWidth(2)
          .setLineStyle(1) // Dashed
          .setText(`TP: ${trade.takeProfit}`);
        
        if (tpLine) {
          this.markers.push(tpLine);
        }
      }

    } catch (error) {
      console.warn('Price lines not supported in this TradingView version:', error);
    }
  }

  /**
   * Create individual trade marker
   */
  private createTradeMarker(marker: TradeMarker): any {
    if (!this.chart) return null;

    try {
      // Try different approaches based on available TradingView API
      
      // Method 1: Try createShape (most common)
      if (this.chart.createShape) {
        const shapeType = marker.type === 'entry' 
          ? (marker.direction === 'long' ? 'arrow_up' : 'arrow_down')
          : 'circle';

        return this.chart.createShape(
          { time: marker.time, price: marker.price },
          {
            shape: shapeType,
            text: marker.text,
            lock: true,
            disableSelection: true,
            disableUndo: true,
            overrides: {
              backgroundColor: marker.color,
              borderColor: this.darkenColor(marker.color),
              borderWidth: 2,
              textColor: 'white',
              transparency: 0,
              fontSize: 12
            }
          }
        );
      }

      // Method 2: Try createMultipointShape
      if (this.chart.createMultipointShape) {
        return this.chart.createMultipointShape([
          { time: marker.time, price: marker.price }
        ], {
          shape: marker.type === 'entry' ? 'arrow_up' : 'circle',
          text: marker.text,
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
      }

      // Method 3: Try study/indicator approach
      if (this.chart.createStudy) {
        return this.chart.createStudy('Arrow', false, false, [marker.time], {
          'Arrow.color': marker.color,
          'Arrow.price': marker.price,
          'Arrow.text': marker.text
        });
      }

      console.warn('No supported marker creation method found');
      return null;

    } catch (error) {
      console.error('Error creating marker:', error);
      
      // Final fallback: Just log the marker info
      console.log(`Marker would be placed: ${marker.text} at ${new Date(marker.time * 1000).toISOString()}`);
      return { 
        id: `marker_${marker.time}_${marker.price}`,
        marker,
        fallback: true 
      };
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
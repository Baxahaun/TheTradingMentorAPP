/**
 * Widget Data Service
 * Manages data refresh and synchronization for analytics widgets
 */

export interface WidgetDataRefreshOptions {
  widgetId?: string;
  immediate?: boolean;
  reason?: 'trade_update' | 'manual' | 'periodic' | 'filter_change';
}

class WidgetDataService {
  private refreshCallbacks: Map<string, Set<() => void>> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register a callback for widget data refresh
   */
  registerRefreshCallback(widgetId: string, callback: () => void): () => void {
    if (!this.refreshCallbacks.has(widgetId)) {
      this.refreshCallbacks.set(widgetId, new Set());
    }
    
    this.refreshCallbacks.get(widgetId)!.add(callback);
    
    // Return unregister function
    return () => {
      this.refreshCallbacks.get(widgetId)?.delete(callback);
      if (this.refreshCallbacks.get(widgetId)?.size === 0) {
        this.refreshCallbacks.delete(widgetId);
      }
    };
  }

  /**
   * Trigger data refresh for specific widget or all widgets
   */
  refreshWidget(options: WidgetDataRefreshOptions = {}): void {
    const { widgetId, immediate = false, reason = 'manual' } = options;

    if (widgetId) {
      this.executeRefresh(widgetId, immediate, reason);
    } else {
      // Refresh all analytics widgets
      const analyticsWidgets = ['setupAnalytics', 'patternPerformance', 'positionManagement'];
      analyticsWidgets.forEach(id => this.executeRefresh(id, immediate, reason));
    }
  }

  /**
   * Execute refresh for a specific widget
   */
  private executeRefresh(widgetId: string, immediate: boolean, reason: string): void {
    const callbacks = this.refreshCallbacks.get(widgetId);
    if (!callbacks || callbacks.size === 0) return;

    if (immediate) {
      // Execute immediately
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error executing refresh callback for widget ${widgetId}:`, error);
        }
      });
    } else {
      // Debounce the refresh
      this.debounceRefresh(widgetId, () => {
        callbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error(`Error executing refresh callback for widget ${widgetId}:`, error);
          }
        });
      });
    }

    // Emit custom event for additional listeners
    const refreshEvent = new CustomEvent('widgetDataRefresh', {
      detail: { widgetId, reason }
    });
    window.dispatchEvent(refreshEvent);
  }

  /**
   * Debounce refresh calls to prevent excessive updates
   */
  private debounceRefresh(widgetId: string, callback: () => void, delay: number = 300): void {
    // Clear existing timer
    if (this.refreshTimers.has(widgetId)) {
      clearTimeout(this.refreshTimers.get(widgetId)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback();
      this.refreshTimers.delete(widgetId);
    }, delay);

    this.refreshTimers.set(widgetId, timer);
  }

  /**
   * Refresh widgets when trade data changes
   */
  onTradeDataChange(): void {
    this.refreshWidget({
      immediate: false,
      reason: 'trade_update'
    });
  }

  /**
   * Refresh widgets periodically (for real-time updates)
   */
  startPeriodicRefresh(intervalMs: number = 60000): () => void {
    const interval = setInterval(() => {
      this.refreshWidget({
        immediate: false,
        reason: 'periodic'
      });
    }, intervalMs);

    // Return stop function
    return () => clearInterval(interval);
  }

  /**
   * Clear all timers and callbacks
   */
  cleanup(): void {
    // Clear all timers
    this.refreshTimers.forEach(timer => clearTimeout(timer));
    this.refreshTimers.clear();
    
    // Clear all callbacks
    this.refreshCallbacks.clear();
  }
}

// Export singleton instance
export const widgetDataService = new WidgetDataService();

// Export hook for easy integration with React components
export const useWidgetDataService = () => {
  return {
    refreshWidget: (options?: WidgetDataRefreshOptions) => widgetDataService.refreshWidget(options),
    onTradeDataChange: () => widgetDataService.onTradeDataChange(),
    registerRefreshCallback: (widgetId: string, callback: () => void) => 
      widgetDataService.registerRefreshCallback(widgetId, callback),
  };
};
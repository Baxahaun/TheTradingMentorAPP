import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, WidgetConfig } from '../lib/dashboardService';

/**
 * Custom hook for managing widget configuration state
 * Provides automatic persistence and real-time updates for analytics widgets
 */
export const useWidgetConfig = <T extends keyof WidgetConfig>(
  widgetId: string,
  configKey: T,
  defaultConfig: WidgetConfig[T]
) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<WidgetConfig[T]>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  // Load widget configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const savedConfig = await dashboardService.getWidgetConfig(user.uid, widgetId);
        if (savedConfig && savedConfig[configKey]) {
          setConfig(savedConfig[configKey] as WidgetConfig[T]);
        }
      } catch (error) {
        console.error('Error loading widget configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [user?.uid, widgetId, configKey]);

  // Update configuration with automatic persistence
  const updateConfig = useCallback(
    (newConfig: Partial<WidgetConfig[T]>) => {
      const updatedConfig = { ...config, ...newConfig } as WidgetConfig[T];
      setConfig(updatedConfig);

      // Save to backend with debouncing
      if (user?.uid) {
        const fullWidgetConfig: WidgetConfig = {
          [configKey]: updatedConfig,
        } as WidgetConfig;

        dashboardService.saveWidgetConfigDebounced(user.uid, widgetId, fullWidgetConfig);
      }
    },
    [config, user?.uid, widgetId, configKey]
  );

  // Reset configuration to default
  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
    
    if (user?.uid) {
      const fullWidgetConfig: WidgetConfig = {
        [configKey]: defaultConfig,
      } as WidgetConfig;

      dashboardService.saveWidgetConfig(user.uid, widgetId, fullWidgetConfig);
    }
  }, [defaultConfig, user?.uid, widgetId, configKey]);

  return {
    config,
    updateConfig,
    resetConfig,
    isLoading,
  };
};

/**
 * Hook for managing data refresh for analytics widgets
 */
export const useWidgetDataRefresh = (widgetId: string, onRefresh?: () => void) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Listen for widget data refresh events
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      if (event.detail.widgetId === widgetId || event.detail.widgetId === 'all') {
        setIsRefreshing(true);
        setLastRefresh(new Date());
        
        if (onRefresh) {
          onRefresh();
        }
        
        // Reset refreshing state after a short delay
        setTimeout(() => setIsRefreshing(false), 500);
      }
    };

    window.addEventListener('widgetDataRefresh', handleRefresh as EventListener);
    
    return () => {
      window.removeEventListener('widgetDataRefresh', handleRefresh as EventListener);
    };
  }, [widgetId, onRefresh]);

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    dashboardService.refreshWidgetData(widgetId);
  }, [widgetId]);

  return {
    isRefreshing,
    lastRefresh,
    triggerRefresh,
  };
};

/**
 * Specific hooks for each analytics widget
 */

// Setup Analytics Widget Hook
export const useSetupAnalyticsConfig = (widgetId: string = 'setupAnalytics') => {
  return useWidgetConfig(widgetId, 'setupAnalytics', {
    selectedView: 'performance' as const,
    selectedTimeframe: 'all',
    selectedSetup: 'all',
  });
};

// Pattern Performance Widget Hook
export const usePatternPerformanceConfig = (widgetId: string = 'patternPerformance') => {
  return useWidgetConfig(widgetId, 'patternPerformance', {
    selectedView: 'success-rate' as const,
    selectedCategory: 'all',
    selectedTimeframe: 'all',
    searchTerm: '',
    selectedMarketCondition: 'all',
  });
};

// Position Management Widget Hook
export const usePositionManagementConfig = (widgetId: string = 'positionManagement') => {
  return useWidgetConfig(widgetId, 'positionManagement', {
    selectedView: 'timeline' as const,
    selectedTrade: 'all',
    selectedTimeframe: 'all',
  });
};
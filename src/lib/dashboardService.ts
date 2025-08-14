import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Layout } from 'react-grid-layout';

// User dashboard document path
const getUserDashboardDoc = (userId: string) => 
  doc(db, 'users', userId, 'dashboard', 'layout');

// Widget configuration interface for analytics widgets
export interface WidgetConfig {
  // Setup Analytics Widget Configuration
  setupAnalytics?: {
    selectedView?: 'performance' | 'comparison' | 'trends';
    selectedTimeframe?: string;
    selectedSetup?: string;
  };
  
  // Pattern Performance Widget Configuration
  patternPerformance?: {
    selectedView?: 'success-rate' | 'confluence' | 'market-correlation';
    selectedCategory?: string;
    selectedTimeframe?: string;
    searchTerm?: string;
    selectedMarketCondition?: string;
  };
  
  // Position Management Widget Configuration
  positionManagement?: {
    selectedView?: 'timeline' | 'efficiency' | 'optimization';
    selectedTrade?: string;
    selectedTimeframe?: string;
  };
}

// Dashboard layout interface
export interface DashboardLayout {
  layouts: Layout[];
  mainWidgets: string[];
  widgetConfigs?: { [widgetId: string]: WidgetConfig };
  lastUpdated: string;
}

interface FirestoreData {
  layouts?: Layout[];
  mainWidgets?: string[];
  widgetConfigs?: { [widgetId: string]: WidgetConfig };
  lastUpdated?: Timestamp | string;
}

// Convert Firestore document to DashboardLayout object
const convertFirestoreToDashboard = (data: FirestoreData): DashboardLayout => ({
  layouts: data.layouts || [],
  mainWidgets: data.mainWidgets || [],
  widgetConfigs: data.widgetConfigs || {},
  lastUpdated: data.lastUpdated instanceof Timestamp 
    ? data.lastUpdated.toDate().toISOString() 
    : (data.lastUpdated || new Date().toISOString()),
});

// Convert DashboardLayout object to Firestore document
const convertDashboardToFirestore = (layout: DashboardLayout) => ({
  layouts: layout.layouts,
  mainWidgets: layout.mainWidgets,
  widgetConfigs: layout.widgetConfigs || {},
  lastUpdated: Timestamp.now(),
});

// Dashboard Service
export const dashboardService = {
  // Save user's dashboard layout
  async saveUserLayout(userId: string, layouts: Layout[], mainWidgets: string[], widgetConfigs?: { [widgetId: string]: WidgetConfig }): Promise<void> {
    try {
      console.log('Saving dashboard layout for user:', userId);
      const dashboardDoc = getUserDashboardDoc(userId);
      
      const dashboardData: DashboardLayout = {
        layouts,
        mainWidgets,
        widgetConfigs: widgetConfigs || {},
        lastUpdated: new Date().toISOString(),
      };
      
      const firestoreData = convertDashboardToFirestore(dashboardData);
      await setDoc(dashboardDoc, firestoreData);
      
      console.log('Dashboard layout saved successfully');
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      throw error;
    }
  },

  // Get user's dashboard layout
  async getUserLayout(userId: string): Promise<DashboardLayout | null> {
    try {
      console.log('Loading dashboard layout for user:', userId);
      const dashboardDoc = getUserDashboardDoc(userId);
      const docSnap = await getDoc(dashboardDoc);
      
      if (docSnap.exists()) {
        const layout = convertFirestoreToDashboard(docSnap.data());
        console.log('Dashboard layout loaded successfully');
        return layout;
      } else {
        console.log('No saved dashboard layout found');
        return null;
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      throw error;
    }
  },

  // Delete user's dashboard layout (reset to default)
  async resetUserLayout(userId: string): Promise<void> {
    try {
      console.log('Resetting dashboard layout for user:', userId);
      const dashboardDoc = getUserDashboardDoc(userId);
      
      // Save empty layout to reset to defaults
      await setDoc(dashboardDoc, {
        layouts: [],
        mainWidgets: [],
        widgetConfigs: {},
        lastUpdated: Timestamp.now(),
      });
      
      console.log('Dashboard layout reset successfully');
    } catch (error) {
      console.error('Error resetting dashboard layout:', error);
      throw error;
    }
  },

  // Save widget configuration for a specific widget
  async saveWidgetConfig(userId: string, widgetId: string, config: WidgetConfig): Promise<void> {
    try {
      console.log('Saving widget configuration for user:', userId, 'widget:', widgetId);
      
      // Get current layout first
      const currentLayout = await this.getUserLayout(userId);
      const widgetConfigs = currentLayout?.widgetConfigs || {};
      
      // Update the specific widget config
      widgetConfigs[widgetId] = config;
      
      // Save the updated layout with new widget config
      await this.saveUserLayout(
        userId, 
        currentLayout?.layouts || [], 
        currentLayout?.mainWidgets || [], 
        widgetConfigs
      );
      
      console.log('Widget configuration saved successfully');
    } catch (error) {
      console.error('Error saving widget configuration:', error);
      throw error;
    }
  },

  // Get widget configuration for a specific widget
  async getWidgetConfig(userId: string, widgetId: string): Promise<WidgetConfig | null> {
    try {
      const layout = await this.getUserLayout(userId);
      return layout?.widgetConfigs?.[widgetId] || null;
    } catch (error) {
      console.error('Error getting widget configuration:', error);
      return null;
    }
  },

  // Update widget state with debouncing for real-time updates
  debounceTimers: new Map<string, NodeJS.Timeout>(),
  
  async saveWidgetConfigDebounced(userId: string, widgetId: string, config: WidgetConfig, delay: number = 1000): Promise<void> {
    const key = `${userId}-${widgetId}`;
    
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }
    
    // Set new timer
    const timer = setTimeout(async () => {
      try {
        await this.saveWidgetConfig(userId, widgetId, config);
        this.debounceTimers.delete(key);
      } catch (error) {
        console.error('Error in debounced widget config save:', error);
        this.debounceTimers.delete(key);
      }
    }, delay);
    
    this.debounceTimers.set(key, timer);
  },

  // Refresh widget data - trigger data reload for analytics widgets
  async refreshWidgetData(widgetId: string): Promise<void> {
    try {
      console.log('Refreshing data for widget:', widgetId);
      
      // Emit custom event for widget data refresh
      const refreshEvent = new CustomEvent('widgetDataRefresh', {
        detail: { widgetId }
      });
      
      window.dispatchEvent(refreshEvent);
      
      console.log('Widget data refresh triggered');
    } catch (error) {
      console.error('Error refreshing widget data:', error);
    }
  },

  // Bulk refresh all analytics widgets
  async refreshAllAnalyticsWidgets(): Promise<void> {
    const analyticsWidgets = ['setupAnalytics', 'patternPerformance', 'positionManagement'];
    
    for (const widgetId of analyticsWidgets) {
      await this.refreshWidgetData(widgetId);
    }
  },
};

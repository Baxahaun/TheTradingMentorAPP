import { DataVersioningService } from './dataVersioning';

/**
 * Enhanced Local Storage Service for Configuration and Settings
 * Handles localStorage persistence for enhanced features configuration
 */
export class EnhancedLocalStorageService {
  private static readonly KEYS = {
    ENHANCED_FEATURES_CONFIG: 'enhancedFeaturesConfig',
    SETUP_LIBRARY: 'customSetupLibrary',
    PATTERN_LIBRARY: 'customPatternLibrary',
    CLASSIFICATION_PREFERENCES: 'classificationPreferences',
    WIDGET_PREFERENCES: 'enhancedWidgetPreferences',
    MIGRATION_PREFERENCES: 'migrationPreferences'
  };

  /**
   * Enhanced Features Configuration
   */
  static getEnhancedFeaturesConfig(): {
    setupClassificationEnabled: boolean;
    patternRecognitionEnabled: boolean;
    partialCloseTrackingEnabled: boolean;
    autoClassificationEnabled: boolean;
    retroactiveClassificationShown: boolean;
  } {
    try {
      const config = localStorage.getItem(this.KEYS.ENHANCED_FEATURES_CONFIG);
      return config ? JSON.parse(config) : {
        setupClassificationEnabled: true,
        patternRecognitionEnabled: true,
        partialCloseTrackingEnabled: true,
        autoClassificationEnabled: false,
        retroactiveClassificationShown: false
      };
    } catch (error) {
      console.error('Error loading enhanced features config:', error);
      return {
        setupClassificationEnabled: true,
        patternRecognitionEnabled: true,
        partialCloseTrackingEnabled: true,
        autoClassificationEnabled: false,
        retroactiveClassificationShown: false
      };
    }
  }

  static setEnhancedFeaturesConfig(config: any): void {
    try {
      localStorage.setItem(this.KEYS.ENHANCED_FEATURES_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving enhanced features config:', error);
    }
  }

  /**
   * Custom Setup Library Management
   */
  static getCustomSetupLibrary(): any[] {
    try {
      const library = localStorage.getItem(this.KEYS.SETUP_LIBRARY);
      return library ? JSON.parse(library) : [];
    } catch (error) {
      console.error('Error loading custom setup library:', error);
      return [];
    }
  }

  static setCustomSetupLibrary(library: any[]): void {
    try {
      localStorage.setItem(this.KEYS.SETUP_LIBRARY, JSON.stringify(library));
    } catch (error) {
      console.error('Error saving custom setup library:', error);
    }
  }

  static addCustomSetup(setup: any): void {
    const library = this.getCustomSetupLibrary();
    library.push({
      ...setup,
      id: setup.id || `custom_setup_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    this.setCustomSetupLibrary(library);
  }

  static updateCustomSetup(setupId: string, updates: any): void {
    const library = this.getCustomSetupLibrary();
    const index = library.findIndex(setup => setup.id === setupId);
    if (index !== -1) {
      library[index] = {
        ...library[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.setCustomSetupLibrary(library);
    }
  }

  static removeCustomSetup(setupId: string): void {
    const library = this.getCustomSetupLibrary();
    const filtered = library.filter(setup => setup.id !== setupId);
    this.setCustomSetupLibrary(filtered);
  }

  /**
   * Custom Pattern Library Management
   */
  static getCustomPatternLibrary(): any[] {
    try {
      const library = localStorage.getItem(this.KEYS.PATTERN_LIBRARY);
      return library ? JSON.parse(library) : [];
    } catch (error) {
      console.error('Error loading custom pattern library:', error);
      return [];
    }
  }

  static setCustomPatternLibrary(library: any[]): void {
    try {
      localStorage.setItem(this.KEYS.PATTERN_LIBRARY, JSON.stringify(library));
    } catch (error) {
      console.error('Error saving custom pattern library:', error);
    }
  }

  static addCustomPattern(pattern: any): void {
    const library = this.getCustomPatternLibrary();
    library.push({
      ...pattern,
      id: pattern.id || `custom_pattern_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    this.setCustomPatternLibrary(library);
  }

  static updateCustomPattern(patternId: string, updates: any): void {
    const library = this.getCustomPatternLibrary();
    const index = library.findIndex(pattern => pattern.id === patternId);
    if (index !== -1) {
      library[index] = {
        ...library[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.setCustomPatternLibrary(library);
    }
  }

  static removeCustomPattern(patternId: string): void {
    const library = this.getCustomPatternLibrary();
    const filtered = library.filter(pattern => pattern.id !== patternId);
    this.setCustomPatternLibrary(filtered);
  }

  /**
   * Classification Preferences
   */
  static getClassificationPreferences(): {
    defaultSetupQuality: number;
    defaultPatternQuality: number;
    autoSuggestSetups: boolean;
    autoSuggestPatterns: boolean;
    showConfidenceScores: boolean;
    requireConfluenceFactors: boolean;
    defaultTimeframe: string;
    defaultMarketCondition: string;
  } {
    try {
      const prefs = localStorage.getItem(this.KEYS.CLASSIFICATION_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        defaultSetupQuality: 3,
        defaultPatternQuality: 3,
        autoSuggestSetups: true,
        autoSuggestPatterns: true,
        showConfidenceScores: true,
        requireConfluenceFactors: false,
        defaultTimeframe: '1H',
        defaultMarketCondition: 'trending'
      };
    } catch (error) {
      console.error('Error loading classification preferences:', error);
      return {
        defaultSetupQuality: 3,
        defaultPatternQuality: 3,
        autoSuggestSetups: true,
        autoSuggestPatterns: true,
        showConfidenceScores: true,
        requireConfluenceFactors: false,
        defaultTimeframe: '1H',
        defaultMarketCondition: 'trending'
      };
    }
  }

  static setClassificationPreferences(preferences: any): void {
    try {
      localStorage.setItem(this.KEYS.CLASSIFICATION_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving classification preferences:', error);
    }
  }

  /**
   * Enhanced Widget Preferences
   */
  static getEnhancedWidgetPreferences(): {
    setupAnalyticsConfig: any;
    patternPerformanceConfig: any;
    positionManagementConfig: any;
    defaultTimeRange: string;
    defaultGrouping: string;
  } {
    try {
      const prefs = localStorage.getItem(this.KEYS.WIDGET_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        setupAnalyticsConfig: {
          showWinRate: true,
          showRMultiple: true,
          showProfitFactor: true,
          showHoldTime: true,
          chartType: 'bar'
        },
        patternPerformanceConfig: {
          showSuccessRate: true,
          showAverageProfit: true,
          showMarketCorrelation: true,
          groupByCategory: true,
          chartType: 'pie'
        },
        positionManagementConfig: {
          showTimeline: true,
          showEfficiency: true,
          showOptimization: true,
          showScoring: true,
          chartType: 'line'
        },
        defaultTimeRange: '3M',
        defaultGrouping: 'monthly'
      };
    } catch (error) {
      console.error('Error loading enhanced widget preferences:', error);
      return {
        setupAnalyticsConfig: { showWinRate: true, showRMultiple: true, showProfitFactor: true, showHoldTime: true, chartType: 'bar' },
        patternPerformanceConfig: { showSuccessRate: true, showAverageProfit: true, showMarketCorrelation: true, groupByCategory: true, chartType: 'pie' },
        positionManagementConfig: { showTimeline: true, showEfficiency: true, showOptimization: true, showScoring: true, chartType: 'line' },
        defaultTimeRange: '3M',
        defaultGrouping: 'monthly'
      };
    }
  }

  static setEnhancedWidgetPreferences(preferences: any): void {
    try {
      localStorage.setItem(this.KEYS.WIDGET_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving enhanced widget preferences:', error);
    }
  }

  /**
   * Migration Preferences
   */
  static getMigrationPreferences(): {
    autoRunMigration: boolean;
    showMigrationPrompts: boolean;
    backupBeforeMigration: boolean;
    cleanupAfterMigration: boolean;
    migrationNotificationsEnabled: boolean;
  } {
    try {
      const prefs = localStorage.getItem(this.KEYS.MIGRATION_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        autoRunMigration: false,
        showMigrationPrompts: true,
        backupBeforeMigration: true,
        cleanupAfterMigration: true,
        migrationNotificationsEnabled: true
      };
    } catch (error) {
      console.error('Error loading migration preferences:', error);
      return {
        autoRunMigration: false,
        showMigrationPrompts: true,
        backupBeforeMigration: true,
        cleanupAfterMigration: true,
        migrationNotificationsEnabled: true
      };
    }
  }

  static setMigrationPreferences(preferences: any): void {
    try {
      localStorage.setItem(this.KEYS.MIGRATION_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving migration preferences:', error);
    }
  }

  /**
   * Data Export/Import for Enhanced Features
   */
  static exportEnhancedFeaturesData(): string {
    const data = {
      version: DataVersioningService.getCurrentVersion(),
      timestamp: new Date().toISOString(),
      config: this.getEnhancedFeaturesConfig(),
      setupLibrary: this.getCustomSetupLibrary(),
      patternLibrary: this.getCustomPatternLibrary(),
      classificationPreferences: this.getClassificationPreferences(),
      widgetPreferences: this.getEnhancedWidgetPreferences(),
      migrationPreferences: this.getMigrationPreferences()
    };

    return JSON.stringify(data, null, 2);
  }

  static importEnhancedFeaturesData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data.version || !data.timestamp) {
        throw new Error('Invalid data format');
      }

      // Import each section
      if (data.config) this.setEnhancedFeaturesConfig(data.config);
      if (data.setupLibrary) this.setCustomSetupLibrary(data.setupLibrary);
      if (data.patternLibrary) this.setCustomPatternLibrary(data.patternLibrary);
      if (data.classificationPreferences) this.setClassificationPreferences(data.classificationPreferences);
      if (data.widgetPreferences) this.setEnhancedWidgetPreferences(data.widgetPreferences);
      if (data.migrationPreferences) this.setMigrationPreferences(data.migrationPreferences);

      console.log('Enhanced features data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing enhanced features data:', error);
      return false;
    }
  }

  /**
   * Clear all enhanced features data
   */
  static clearAllEnhancedFeaturesData(): void {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('All enhanced features data cleared');
    } catch (error) {
      console.error('Error clearing enhanced features data:', error);
    }
  }

  /**
   * Get storage usage for enhanced features
   */
  static getEnhancedFeaturesStorageUsage(): {
    totalSize: number;
    breakdown: { [key: string]: number };
  } {
    const breakdown: { [key: string]: number } = {};
    let totalSize = 0;

    try {
      Object.entries(this.KEYS).forEach(([name, key]) => {
        const value = localStorage.getItem(key) || '';
        const size = key.length + value.length;
        breakdown[name] = size;
        totalSize += size;
      });

      return { totalSize, breakdown };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { totalSize: 0, breakdown: {} };
    }
  }

  /**
   * Validate localStorage data integrity
   */
  static validateDataIntegrity(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate enhanced features config
      const config = this.getEnhancedFeaturesConfig();
      if (typeof config.setupClassificationEnabled !== 'boolean') {
        errors.push('Invalid setupClassificationEnabled value');
      }

      // Validate custom libraries
      const setupLibrary = this.getCustomSetupLibrary();
      if (!Array.isArray(setupLibrary)) {
        errors.push('Custom setup library is not an array');
      } else {
        setupLibrary.forEach((setup, index) => {
          if (!setup.id) warnings.push(`Setup ${index} missing ID`);
          if (!setup.name) warnings.push(`Setup ${index} missing name`);
        });
      }

      const patternLibrary = this.getCustomPatternLibrary();
      if (!Array.isArray(patternLibrary)) {
        errors.push('Custom pattern library is not an array');
      } else {
        patternLibrary.forEach((pattern, index) => {
          if (!pattern.id) warnings.push(`Pattern ${index} missing ID`);
          if (!pattern.name) warnings.push(`Pattern ${index} missing name`);
        });
      }

      // Validate preferences
      const classificationPrefs = this.getClassificationPreferences();
      if (classificationPrefs.defaultSetupQuality < 1 || classificationPrefs.defaultSetupQuality > 5) {
        errors.push('Invalid default setup quality value');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Data integrity check failed: ${error}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }
}
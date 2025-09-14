/**
 * Application constants for the Zella Trade Scribe
 * All constants should use futures terminology where applicable
 */

import { CURRENT_TERMINOLOGY } from './terminologyConfig';

// Application metadata
export const APP_NAME = 'Zella Trade Scribe';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = `${CURRENT_TERMINOLOGY.instrumentLabel} Trading Journal & Analytics`;

// Default values with futures terminology
export const DEFAULTS = {
  // Trade defaults
  DEFAULT_LOT_SIZE: 1,
  DEFAULT_LOT_TYPE: 'standard' as const,
  DEFAULT_LEVERAGE: 1,

  // Analysis defaults
  DEFAULT_TIMEFRAME: '1h',
  DEFAULT_CONFIDENCE_LEVEL: 5,

  // UI defaults
  DEFAULT_CHART_HEIGHT: 400,
  DEFAULT_TABLE_ROWS_PER_PAGE: 25,

  // Export defaults
  DEFAULT_EXPORT_FORMAT: 'csv' as const,
  DEFAULT_DATE_RANGE: 'last30' as const,

  // Performance calculation defaults
  DEFAULT_RISK_PERCENTAGE: 2.0,
  DEFAULT_TARGET_RR_RATIO: 2.0,
};

// Validation constants with futures terminology
export const VALIDATION = {
  MIN_LOT_SIZE: 0.01,
  MAX_LOT_SIZE: 1000,
  MIN_LEVERAGE: 1,
  MAX_LEVERAGE: 500,
  MIN_CONFIDENCE: 1,
  MAX_CONFIDENCE: 10,
  MAX_NOTES_LENGTH: 1000,
  MAX_STRATEGY_NAME_LENGTH: 100,
};

// Display constants with futures terminology
export const DISPLAY = {
  // Table display
  DECIMAL_PLACES_PRICE: 5,
  DECIMAL_PLACES_PNL: 2,
  DECIMAL_PLACES_PIPS: 1,

  // Chart display
  MAX_CHART_POINTS: 1000,
  CHART_UPDATE_INTERVAL: 5000, // 5 seconds

  // Pagination
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
};

// API and Firebase constants
export const FIREBASE = {
  COLLECTION_TRADES: 'trades',
  COLLECTION_USERS: 'users',
  COLLECTION_SETTINGS: 'settings',
  MAX_BATCH_SIZE: 500,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// Export constants with futures terminology
export const EXPORT = {
  FORMATS: ['csv', 'json', 'html', 'pdf'] as const,
  DATE_RANGES: {
    all: 'All Trades',
    last30: 'Last 30 Days',
    last90: 'Last 90 Days',
    thisYear: 'This Year'
  },
  MAX_FILENAME_LENGTH: 100,
  DEFAULT_FILENAME_PATTERN: `${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase().replace(' ', '-')}-journal-{date}`,
};

// Chart and analytics constants with futures terminology
export const ANALYTICS = {
  // Performance metrics
  PERFORMANCE_PERIODS: ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'],
  RISK_METRICS: ['sharpe', 'sortino', 'maxDrawdown', 'calmar'],
  VOLATILITY_WINDOWS: [10, 20, 50, 100], // days

  // Chart constants
  CHART_COLORS: {
    profit: '#16a34a',
    loss: '#dc2626',
    neutral: '#6b7280',
    accent: '#2563eb'
  },

  // Statistical constants
  CONFIDENCE_LEVELS: [95, 99, 99.9], // confidence intervals
  MIN_TRADES_FOR_STATS: 10,
};

// User interface constants with futures terminology
export const UI = {
  // Layout
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 40,

  // Animation durations
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,

  // Breakpoints
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },

  // Z-index layers
  Z_INDEX: {
    dropdown: 1000,
    modal: 1050,
    tooltip: 1100,
    overlay: 1200
  }
};

// Error handling constants with futures terminology
export const ERRORS = {
  // Network errors
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second

  // Validation error messages with terminology
  MESSAGES: {
    REQUIRED_FIELD: (fieldName: string) => `${fieldName} is required`,
    INVALID_FORMAT: (fieldName: string) => `Invalid ${fieldName} format`,
    OUT_OF_RANGE: (fieldName: string, min: number, max: number) =>
      `${fieldName} must be between ${min} and ${max}`,
    DUPLICATE_ENTRY: (fieldName: string) => `${fieldName} already exists`,
    INVALID_INSTRUMENT: `${CURRENT_TERMINOLOGY.instrumentLabel} format is invalid`,
    INVALID_POSITION_SIZE: `${CURRENT_TERMINOLOGY.positionSizeLabel} must be greater than 0`,
    INVALID_PRICE: 'Price must be a positive number',
    TRADE_NOT_FOUND: `${CURRENT_TERMINOLOGY.instrumentLabel} trade not found`,
    EXPORT_FAILED: `Failed to export ${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} data`,
    IMPORT_FAILED: `Failed to import ${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} data`
  }
};

// Performance optimization constants
export const PERFORMANCE = {
  // Caching
  CACHE_TTL: 10 * 60 * 1000, // 10 minutes
  MAX_CACHE_SIZE: 50, // MB

  // Virtualization
  VIRTUAL_SCROLL_THRESHOLD: 50,
  VIRTUAL_SCROLL_BUFFER: 10,

  // Debouncing
  SEARCH_DEBOUNCE_MS: 300,
  RESIZE_DEBOUNCE_MS: 150,
  SCROLL_DEBOUNCE_MS: 100,

  // Loading states
  SKELETON_DURATION: 800,
  MIN_LOADING_TIME: 200,
};

// Feature flags (for future feature toggles)
export const FEATURES = {
  ADVANCED_ANALYTICS: true,
  EXPORT_FUNCTIONALITY: true,
  CHART_ANNOTATIONS: true,
  BULK_OPERATIONS: true,
  DARK_MODE: false, // Future feature
  MULTI_ACCOUNT: false, // Future feature
  SOCIAL_FEATURES: false, // Future feature
};

// Local storage keys with futures terminology
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'zella_user_preferences',
  TRADING_SETTINGS: `${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase().replace(' ', '_')}_settings`,
  DASHBOARD_LAYOUT: 'zella_dashboard_layout',
  THEME_PREFERENCE: 'zella_theme',
  RECENT_TRADES: 'zella_recent_trades',
  EXPORT_HISTORY: 'zella_export_history',
};

// Notification constants with futures terminology
export const NOTIFICATIONS = {
  TYPES: ['success', 'error', 'warning', 'info'] as const,
  DURATIONS: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 8000,
    STICKY: 0
  },
  MESSAGES: {
    TRADE_SAVED: `${CURRENT_TERMINOLOGY.instrumentLabel} trade saved successfully`,
    TRADE_UPDATED: `${CURRENT_TERMINOLOGY.instrumentLabel} trade updated successfully`,
    TRADE_DELETED: `${CURRENT_TERMINOLOGY.instrumentLabel} trade deleted`,
    EXPORT_COMPLETED: `${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} data exported successfully`,
    IMPORT_COMPLETED: `${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} data imported successfully`,
    SETTINGS_SAVED: 'Settings saved successfully',
    CONNECTION_ERROR: 'Connection error. Please check your internet connection.',
    VALIDATION_ERROR: 'Please correct the errors and try again.',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.'
  }
};

// Development and testing constants
export const DEVELOPMENT = {
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  ENABLE_ERROR_BOUNDARIES: true,
  MOCK_DATA_ENABLED: process.env.NODE_ENV === 'development',
  API_MOCK_DELAY: 500, // milliseconds
};

// Third-party service configurations
export const EXTERNAL_SERVICES = {
  FIREBASE: {
    ENABLE_PERSISTENCE: true,
    ENABLE_OFFLINE: true,
    CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  },
  ANALYTICS: {
    ENABLE_TRACKING: true,
    TRACKING_ID: 'zella-analytics',
    EVENTS: {
      TRADE_ADDED: 'trade_added',
      TRADE_UPDATED: 'trade_updated',
      EXPORT_USED: 'export_used',
      REPORT_GENERATED: 'report_generated'
    }
  }
};

// Constants export for easy importing
export default {
  APP_NAME,
  APP_VERSION,
  DEFAULTS,
  VALIDATION,
  DISPLAY,
  FIREBASE,
  EXPORT,
  ANALYTICS,
  UI,
  ERRORS,
  PERFORMANCE,
  FEATURES,
  STORAGE_KEYS,
  NOTIFICATIONS,
  DEVELOPMENT,
  EXTERNAL_SERVICES
};
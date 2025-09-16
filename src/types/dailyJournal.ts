/**
 * Daily Journal Redesign Type Definitions
 * 
 * This file contains TypeScript interfaces and types for the redesigned Daily Journal
 * system with calendar-based navigation, dynamic content areas, and enhanced trade integration.
 * These types extend the existing journal and trade systems while providing specialized
 * interfaces for the new week-view interface and trade note functionality.
 */

import { JournalEntry, JournalSection } from './journal';
import { Trade } from './trade';

// ===== CORE DAILY JOURNAL INTERFACES =====

/**
 * Week range interface for calendar navigation
 * Represents a Monday-Friday trading week
 */
export interface WeekRange {
  startDate: Date;          // Monday of the week
  endDate: Date;            // Friday of the week
  weekNumber: number;       // ISO week number
  year: number;             // Year for the week
  displayName: string;      // Human-readable week name (e.g., "Week of Jan 15, 2024")
}

/**
 * Daily metrics for calendar display and journal context
 * Aggregated trading performance data for a specific date
 */
export interface DayMetrics {
  date: string;             // YYYY-MM-DD format
  pnl: number;              // Daily P&L
  tradeCount: number;       // Number of trades executed
  winRate: number;          // Win rate percentage (0-100)
  hasJournalEntry: boolean; // Journal entry exists for this date
  hasTradeNotes: boolean;   // Trade notes exist for this date
  completionPercentage: number; // Journal completion % (0-100)
  
  // Additional performance metrics
  totalVolume: number;      // Total volume traded
  averageWin: number;       // Average winning trade P&L
  averageLoss: number;      // Average losing trade P&L
  maxDrawdown: number;      // Maximum drawdown for the day
  sharpeRatio?: number;     // Daily Sharpe ratio if calculable
  
  // Visual indicators for calendar
  hasScreenshots: boolean;  // Screenshots attached to trade notes
  emotionalState?: 'positive' | 'neutral' | 'negative'; // Overall emotional state
  riskLevel?: 'low' | 'medium' | 'high'; // Risk level for the day
}

/**
 * Trade note entry extending JournalEntry with trade-specific functionality
 * Specialized journal entry linked to a specific trade for reflective analysis
 */
export interface TradeNoteEntry extends JournalEntry {
  // Trade linking
  linkedTradeId: string;    // Reference to Trade.id
  tradeSnapshot: TradeSnapshot; // Cached trade data for performance
  
  // Trade-specific content
  analysisNotes: string;    // Reflective analysis text
  screenshots: ScreenshotAttachment[];
  strategyNotes?: string;   // Strategy-specific observations
  lessonsLearned?: string;  // Key takeaways from this trade
  
  // Trade note metadata
  noteType: 'entry' | 'exit' | 'review' | 'analysis'; // Type of trade note
  timeframe?: string;       // Chart timeframe for analysis
  marketCondition?: string; // Market condition during trade
  confidenceLevel?: number; // Confidence in trade decision (1-10)
}

/**
 * Cached trade data snapshot for performance optimization
 * Contains essential trade information without full trade object overhead
 */
export interface TradeSnapshot {
  id: string;               // Trade ID
  symbol: string;           // Trading symbol (e.g., "EUR/USD", "ES")
  side: 'long' | 'short';   // Trade direction
  entryPrice: number;       // Entry price
  exitPrice?: number;       // Exit price (if closed)
  pnl: number;              // Profit/Loss
  entryTime: string;        // Entry time (HH:MM format)
  exitTime?: string;        // Exit time (HH:MM format)
  strategy: string;         // Trading strategy used
  lotSize: number;          // Position size
  stopLoss?: number;        // Stop loss level
  takeProfit?: number;      // Take profit level
  riskAmount?: number;      // Risk amount
  rMultiple?: number;       // Risk-reward multiple
  tags?: string[];          // Trade tags
}

/**
 * Screenshot attachment for trade notes
 * Manages image uploads and metadata for trade analysis
 */
export interface ScreenshotAttachment {
  id: string;               // Unique attachment ID
  fileName: string;         // Original file name
  fileSize: number;         // File size in bytes
  uploadedAt: Date;         // Upload timestamp
  firebaseUrl: string;      // Firebase Storage URL
  thumbnailUrl?: string;    // Optional thumbnail URL for performance
  description?: string;     // User description of the screenshot
  timeframe?: string;       // Chart timeframe if applicable
  chartType?: 'entry' | 'exit' | 'analysis' | 'setup' | 'other'; // Type of chart screenshot
  
  // Image metadata
  width?: number;           // Image width in pixels
  height?: number;          // Image height in pixels
  format: 'png' | 'jpg' | 'jpeg' | 'webp'; // Image format
  
  // Organization
  tags?: string[];          // User-defined tags
  isPublic: boolean;        // Whether screenshot is publicly accessible
}

// ===== CALENDAR AND NAVIGATION INTERFACES =====

/**
 * Calendar day data for week view display
 * Contains all information needed to render a calendar day
 */
export interface CalendarDay {
  date: Date;               // The actual date
  isCurrentWeek: boolean;   // Whether this day is in the current week
  isToday: boolean;         // Whether this is today
  isSelected: boolean;      // Whether this day is currently selected
  metrics: DayMetrics;      // Daily performance metrics
  hasContent: boolean;      // Whether there's any journal content
  entryType?: 'journal' | 'trade-note' | 'both'; // Type of content available
}

/**
 * Week view data structure
 * Contains all days and metadata for a trading week
 */
export interface WeekViewData {
  weekRange: WeekRange;     // Week boundaries and metadata
  days: CalendarDay[];      // Array of 5 days (Monday-Friday)
  totalPnL: number;         // Total P&L for the week
  totalTrades: number;      // Total trades for the week
  completionRate: number;   // Average journal completion rate
  hasAnyContent: boolean;   // Whether any day has journal content
}

// ===== CONTENT AREA INTERFACES =====

/**
 * Dynamic content area configuration
 * Defines how the content area should render based on entry type
 */
export interface ContentAreaConfig {
  entryType: 'trade-note' | 'daily-journal' | 'empty';
  layout: 'split' | 'full' | 'compact'; // Layout type
  showTradeData: boolean;   // Whether to show trade information
  showScreenshots: boolean; // Whether to show screenshot gallery
  showTemplates: boolean;   // Whether to show template selector
  showMetrics: boolean;     // Whether to show daily metrics
  maxHeight?: number;       // Maximum height for content area
}

/**
 * Trade note panel configuration
 * Specific settings for trade note display
 */
export interface TradeNoteConfig {
  showTradeSnapshot: boolean; // Display trade data panel
  showScreenshotGallery: boolean; // Display screenshot gallery
  showAnalysisEditor: boolean; // Display analysis text editor
  showStrategyNotes: boolean; // Display strategy notes section
  allowScreenshotUpload: boolean; // Allow new screenshot uploads
  maxScreenshots: number;    // Maximum number of screenshots
  screenshotMaxSize: number; // Maximum file size in bytes (5MB = 5242880)
}

/**
 * Daily journal panel configuration
 * Specific settings for daily journal display
 */
export interface DailyJournalConfig {
  useFullHeight: boolean;   // Use full available height
  showTemplateSelector: boolean; // Display template selection
  showDailyMetrics: boolean; // Display daily performance metrics
  showNewsEvents: boolean;  // Display news events panel
  autoSave: boolean;        // Enable auto-save functionality
  autoSaveInterval: number; // Auto-save interval in milliseconds
}

// ===== TEMPLATE INTEGRATION INTERFACES =====

/**
 * Template application context
 * Defines how templates should be applied to different entry types
 */
export interface TemplateApplicationContext {
  entryType: 'daily-journal' | 'trade-note';
  selectedDate: Date;
  linkedTradeId?: string;   // For trade note templates
  templateId: string;
  customSections?: JournalSection[]; // Custom sections to include
  preserveExisting: boolean; // Whether to preserve existing content
}

/**
 * Template compatibility information
 * Defines which templates work with which entry types
 */
export interface TemplateCompatibility {
  templateId: string;
  supportedEntryTypes: ('daily-journal' | 'trade-note')[];
  requiredSections: string[]; // Required section types
  optionalSections: string[]; // Optional section types
  tradeSpecific: boolean;     // Whether template requires trade context
}

// ===== NAVIGATION AND INTEGRATION INTERFACES =====

/**
 * Navigation state for Daily Journal
 * Tracks current navigation context and selected items
 */
export interface DailyJournalNavigationState {
  selectedDate: Date;        // Currently selected date
  selectedWeek: WeekRange;   // Currently selected week
  selectedTradeId?: string;  // Currently selected trade (if any)
  entryType: 'daily-journal' | 'trade-note' | 'empty';
  viewMode: 'calendar' | 'content' | 'templates'; // Current view mode
  isNavigating: boolean;     // Whether navigation is in progress
}

/**
 * TradeLog integration data
 * Information needed for bidirectional navigation with TradeLog
 */
export interface TradeLogIntegrationData {
  tradeId: string;
  hasJournalNotes: boolean;
  journalEntryId?: string;
  lastNoteDate?: Date;
  noteCount: number;
  screenshotCount: number;
  canNavigateToNotes: boolean;
}

// ===== ERROR HANDLING AND VALIDATION =====

/**
 * Daily Journal operation result
 * Standardized result type for Daily Journal operations
 */
export interface DailyJournalOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  timestamp: Date;
  operation: string; // Name of the operation performed
}

/**
 * Validation error for Daily Journal data
 * Specific validation errors for journal entries and trade notes
 */
export interface DailyJournalValidationError {
  field: string;
  message: string;
  code: 'required' | 'invalid_format' | 'size_limit' | 'type_mismatch' | 'business_rule';
  value?: any;
  suggestion?: string;
}

// ===== UTILITY TYPES =====

/**
 * Day of week for trading (Monday-Friday)
 */
export type TradingDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

/**
 * Content area transition animation type
 */
export type ContentTransitionType = 'slide' | 'fade' | 'scale' | 'none';

/**
 * Screenshot upload status
 */
export type ScreenshotUploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

/**
 * Week navigation direction
 */
export type WeekNavigationDirection = 'previous' | 'next' | 'current' | 'specific';

// ===== CONSTANTS =====

/**
 * Maximum file size for screenshot uploads (5MB)
 */
export const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Supported image formats for screenshots
 */
export const SUPPORTED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'webp'] as const;

/**
 * Default content area configurations
 */
export const DEFAULT_CONTENT_CONFIGS = {
  tradeNote: {
    entryType: 'trade-note' as const,
    layout: 'split' as const,
    showTradeData: true,
    showScreenshots: true,
    showTemplates: true,
    showMetrics: true,
  },
  dailyJournal: {
    entryType: 'daily-journal' as const,
    layout: 'full' as const,
    showTradeData: false,
    showScreenshots: false,
    showTemplates: true,
    showMetrics: true,
  },
  empty: {
    entryType: 'empty' as const,
    layout: 'compact' as const,
    showTradeData: false,
    showScreenshots: false,
    showTemplates: true,
    showMetrics: false,
  }
} as const;

/**
 * Default trade note configuration
 */
export const DEFAULT_TRADE_NOTE_CONFIG: TradeNoteConfig = {
  showTradeSnapshot: true,
  showScreenshotGallery: true,
  showAnalysisEditor: true,
  showStrategyNotes: true,
  allowScreenshotUpload: true,
  maxScreenshots: 10,
  screenshotMaxSize: MAX_SCREENSHOT_SIZE,
};

/**
 * Default daily journal configuration
 */
export const DEFAULT_DAILY_JOURNAL_CONFIG: DailyJournalConfig = {
  useFullHeight: true,
  showTemplateSelector: true,
  showDailyMetrics: true,
  showNewsEvents: true,
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
};



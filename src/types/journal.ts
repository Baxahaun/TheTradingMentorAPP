/**
 * Daily Trading Journal Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Daily Trading Journal system.
 * These types are designed to integrate seamlessly with the existing trade system while
 * providing comprehensive support for journaling, emotional tracking, and process assessment.
 */

import { Trade } from './trade';

// ===== CORE JOURNAL INTERFACES =====

/**
 * Main journal entry interface representing a single day's trading journal
 */
export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  
  // Content sections - flexible structure based on templates
  sections: JournalSection[];
  
  // Template and structure
  templateId?: string;
  templateName?: string; // Cached for display purposes
  
  // Trade references and integration
  tradeReferences: TradeReference[];
  dailyTradeIds: string[]; // All trades executed on this day
  
  // Emotional and psychological tracking
  emotionalState: EmotionalState;
  
  // Performance and process tracking
  processMetrics: ProcessMetrics;
  dailyPnL: number;
  tradeCount: number;
  
  // Media attachments
  images: JournalImage[];
  
  // Metadata and organization
  tags: string[];
  isComplete: boolean;
  completionPercentage: number; // 0-100 based on required sections
  wordCount: number;
  
  // Privacy and sharing
  isPrivate: boolean;
  sharedWith: string[]; // User IDs of people this entry is shared with
}

/**
 * Flexible section structure for journal entries
 */
export interface JournalSection {
  id: string;
  type: JournalSectionType;
  title: string;
  content: any; // Type varies based on section type
  order: number;
  isRequired: boolean;
  isCompleted: boolean;
  templateSectionId?: string; // Reference to template section if applicable
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  wordCount?: number; // For text sections
}

/**
 * Types of journal sections supported
 */
export type JournalSectionType = 
  | 'text' 
  | 'checklist' 
  | 'rating' 
  | 'emotion_tracker' 
  | 'trade_reference' 
  | 'image_gallery'
  | 'market_analysis'
  | 'lesson_learned'
  | 'goal_setting'
  | 'custom';

/**
 * Reference to a trade within a journal entry
 */
export interface TradeReference {
  id: string;
  tradeId: string;
  insertedAt: string; // ISO timestamp
  context: string; // Brief description of why this trade is referenced
  displayType: 'inline' | 'card' | 'preview';
  sectionId: string; // Which journal section contains this reference
  
  // Cached trade data for performance
  cachedTradeData?: {
    symbol: string;
    direction: 'long' | 'short';
    pnl: number;
    status: 'open' | 'closed';
    timeIn: string;
    timeOut?: string;
  };
}

// ===== EMOTIONAL TRACKING INTERFACES =====

/**
 * Comprehensive emotional state tracking throughout the trading day
 */
export interface EmotionalState {
  preMarket: PreMarketEmotions;
  duringTrading: TradingEmotions;
  postMarket: PostMarketEmotions;
  
  // Overall emotional summary
  overallMood: EmotionalMood;
  stressLevel: number; // 1-5 scale
  confidenceLevel: number; // 1-5 scale
  
  // Emotional notes and observations
  emotionalNotes?: string;
  triggers?: EmotionalTrigger[];
}

export interface PreMarketEmotions {
  confidence: number; // 1-5 scale
  anxiety: number; // 1-5 scale
  focus: number; // 1-5 scale
  energy: number; // 1-5 scale
  mood: EmotionalMood;
  preparedness: number; // 1-5 scale - how prepared do you feel?
  notes?: string;
  timestamp: string;
}

export interface TradingEmotions {
  discipline: number; // 1-5 scale
  patience: number; // 1-5 scale
  emotionalControl: number; // 1-5 scale
  decisionClarity: number; // 1-5 scale
  stressManagement: number; // 1-5 scale
  notes?: string;
  
  // Specific emotional events during trading
  emotionalEvents?: EmotionalEvent[];
}

export interface PostMarketEmotions {
  satisfaction: number; // 1-5 scale
  learningValue: number; // 1-5 scale
  frustrationLevel: number; // 1-5 scale
  accomplishment: number; // 1-5 scale
  overallMood: EmotionalMood;
  notes?: string;
  timestamp: string;
}

export type EmotionalMood = 
  | 'excited' 
  | 'calm' 
  | 'nervous' 
  | 'frustrated' 
  | 'confident'
  | 'satisfied'
  | 'disappointed'
  | 'neutral'
  | 'anxious'
  | 'optimistic';

export interface EmotionalTrigger {
  id: string;
  trigger: string; // What caused the emotional response
  emotion: EmotionalMood;
  intensity: number; // 1-5 scale
  response: string; // How you responded
  timestamp: string;
  tradeId?: string; // If related to a specific trade
}

export interface EmotionalEvent {
  id: string;
  timestamp: string;
  event: string; // Description of what happened
  emotionBefore: EmotionalMood;
  emotionAfter: EmotionalMood;
  impact: 'positive' | 'negative' | 'neutral';
  tradeId?: string; // If related to a specific trade
}

// ===== PROCESS METRICS INTERFACES =====

/**
 * Process-focused performance metrics emphasizing discipline over outcomes
 */
export interface ProcessMetrics {
  // Core discipline metrics (1-5 scale)
  planAdherence: number;
  riskManagement: number;
  entryTiming: number;
  exitTiming: number;
  emotionalDiscipline: number;
  
  // Calculated scores
  overallDiscipline: number; // Weighted average of above metrics
  processScore: number; // 0-100 score emphasizing process over P&L
  
  // Specific process observations
  processNotes?: string;
  mistakesMade?: ProcessMistake[];
  successfulExecutions?: ProcessSuccess[];
  
  // Improvement tracking
  improvementAreas?: string[];
  strengthsIdentified?: string[];
}

export interface ProcessMistake {
  id: string;
  category: ProcessMistakeCategory;
  description: string;
  impact: 'low' | 'medium' | 'high';
  lesson: string; // What was learned
  preventionStrategy?: string; // How to avoid in future
  tradeId?: string; // If related to specific trade
}

export interface ProcessSuccess {
  id: string;
  category: ProcessSuccessCategory;
  description: string;
  impact: 'low' | 'medium' | 'high';
  replicationStrategy?: string; // How to repeat this success
  tradeId?: string; // If related to specific trade
}

export type ProcessMistakeCategory = 
  | 'plan_deviation'
  | 'risk_management'
  | 'emotional_decision'
  | 'timing_error'
  | 'position_sizing'
  | 'exit_strategy'
  | 'market_analysis'
  | 'other';

export type ProcessSuccessCategory = 
  | 'plan_execution'
  | 'risk_control'
  | 'emotional_control'
  | 'timing_precision'
  | 'market_reading'
  | 'exit_execution'
  | 'discipline'
  | 'other';

// ===== TEMPLATE SYSTEM INTERFACES =====

/**
 * Journal template for creating structured journal entries
 */
export interface JournalTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: TemplateCategory;
  
  // Template structure
  sections: TemplateSection[];
  
  // Template metadata
  isDefault: boolean;
  isPublic: boolean;
  isSystemTemplate: boolean; // Built-in templates
  
  // Usage and sharing
  usageCount: number;
  sharedWith: string[]; // User IDs
  tags: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory = 
  | 'pre-market' 
  | 'post-market' 
  | 'full-day' 
  | 'trade-review'
  | 'emotional-check'
  | 'weekly-review'
  | 'custom';

/**
 * Individual section within a journal template
 */
export interface TemplateSection {
  id: string;
  type: JournalSectionType;
  title: string;
  prompt: string; // Question or instruction for the user
  placeholder?: string;
  isRequired: boolean;
  order: number;
  
  // Type-specific configuration
  config: TemplateSectionConfig;
  
  // Validation rules
  validation?: SectionValidation;
}

/**
 * Configuration object for different section types
 */
export interface TemplateSectionConfig {
  // For text sections
  minWords?: number;
  maxWords?: number;
  allowRichText?: boolean;
  
  // For checklist sections
  items?: ChecklistItem[];
  allowCustomItems?: boolean;
  
  // For rating sections
  metrics?: RatingMetric[];
  scale?: number; // Default 5
  
  // For emotion tracker sections
  emotionPhase?: 'preMarket' | 'duringTrading' | 'postMarket';
  trackingMetrics?: string[];
  
  // For trade reference sections
  maxTrades?: number;
  filterCriteria?: TradeFilterCriteria;
  
  // For image sections
  maxImages?: number;
  allowAnnotations?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isRequired?: boolean;
  category?: string;
}

export interface RatingMetric {
  id: string;
  name: string;
  description?: string;
  weight?: number; // For weighted averages
}

export interface TradeFilterCriteria {
  status?: 'open' | 'closed' | 'both';
  profitability?: 'winning' | 'losing' | 'both';
  timeframe?: string;
  strategy?: string;
}

export interface SectionValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  customValidator?: string; // Function name for custom validation
}

// ===== IMAGE AND MEDIA INTERFACES =====

/**
 * Image attachment within a journal entry
 */
export interface JournalImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  fileSize: number; // In bytes
  mimeType: string;
  
  // Image metadata
  width?: number;
  height?: number;
  uploadedAt: string;
  
  // Annotations and notes
  annotations: ImageAnnotation[];
  caption?: string;
  description?: string;
  
  // Trade association
  tradeId?: string; // If image is related to a specific trade
  sectionId?: string; // Which journal section contains this image
  
  // Organization
  tags: string[];
  category?: ImageCategory;
}

export type ImageCategory = 
  | 'chart_analysis'
  | 'trade_setup'
  | 'market_overview'
  | 'news_screenshot'
  | 'platform_screenshot'
  | 'other';

/**
 * Annotation on a journal image
 */
export interface ImageAnnotation {
  id: string;
  type: AnnotationType;
  position: AnnotationPosition;
  content: string;
  color: string;
  
  // Style properties
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  strokeWidth?: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export type AnnotationType = 
  | 'text' 
  | 'arrow' 
  | 'highlight' 
  | 'circle'
  | 'rectangle'
  | 'line'
  | 'freehand';

export interface AnnotationPosition {
  x: number; // X coordinate (percentage of image width)
  y: number; // Y coordinate (percentage of image height)
  width?: number; // For rectangles and highlights
  height?: number; // For rectangles and highlights
  endX?: number; // For arrows and lines
  endY?: number; // For arrows and lines
  points?: number[]; // For freehand drawings [x1, y1, x2, y2, ...]
}

// ===== ANALYTICS AND INSIGHTS INTERFACES =====

/**
 * Journal completion and consistency statistics
 */
export interface JournalCompletionStats {
  userId: string;
  
  // Completion metrics
  totalEntries: number;
  completedEntries: number;
  partialEntries: number;
  emptyEntries: number;
  completionRate: number; // Percentage
  
  // Streak tracking
  currentStreak: number; // Days
  longestStreak: number; // Days
  streakStartDate?: string;
  
  // Time-based statistics
  averageWordsPerEntry: number;
  averageTimeSpent: number; // Minutes
  mostActiveDay: string; // Day of week
  mostActiveTime: string; // Hour of day
  
  // Content analysis
  mostUsedTags: TagUsage[];
  mostUsedTemplates: TemplateUsage[];
  emotionalTrends: EmotionalTrend[];
  
  // Date range for statistics
  startDate: string;
  endDate: string;
  lastUpdated: string;
}

export interface TagUsage {
  tag: string;
  count: number;
  percentage: number;
}

export interface TemplateUsage {
  templateId: string;
  templateName: string;
  count: number;
  percentage: number;
}

export interface EmotionalTrend {
  emotion: EmotionalMood;
  averageIntensity: number;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Calendar data for journal entries
 */
export interface JournalCalendarData {
  date: string; // YYYY-MM-DD
  hasEntry: boolean;
  isComplete: boolean;
  completionPercentage: number;
  wordCount: number;
  tradeCount: number;
  dailyPnL: number;
  overallMood?: EmotionalMood;
  processScore?: number;
  tags: string[];
}

// ===== SEARCH AND FILTERING INTERFACES =====

/**
 * Search criteria for journal entries
 */
export interface JournalSearchCriteria {
  // Text search
  query?: string;
  searchFields?: ('content' | 'tags' | 'notes' | 'tradeReferences')[];
  
  // Date filtering
  startDate?: string;
  endDate?: string;
  
  // Content filtering
  tags?: string[];
  templateIds?: string[];
  hasImages?: boolean;
  hasTrades?: boolean;
  
  // Completion filtering
  completionStatus?: ('complete' | 'partial' | 'empty')[];
  minWordCount?: number;
  maxWordCount?: number;
  
  // Emotional filtering
  moods?: EmotionalMood[];
  minProcessScore?: number;
  maxProcessScore?: number;
  
  // Sorting
  sortBy?: 'date' | 'wordCount' | 'processScore' | 'completionPercentage';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  offset?: number;
}

export interface JournalSearchResult {
  entries: JournalEntry[];
  totalCount: number;
  hasMore: boolean;
  searchTime: number; // Milliseconds
}

// ===== VALIDATION AND ERROR INTERFACES =====

/**
 * Validation result for journal operations
 */
export interface JournalValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// ===== SETTINGS AND PREFERENCES INTERFACES =====

/**
 * User preferences for journal functionality
 */
export interface JournalPreferences {
  userId: string;
  
  // Default settings
  defaultTemplateId?: string;
  autoSaveInterval: number; // Seconds
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM format
  
  // Privacy settings
  defaultPrivacy: 'private' | 'shared';
  allowMentorAccess: boolean;
  
  // Display preferences
  dateFormat: string;
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto';
  
  // Notification preferences
  completionReminders: boolean;
  streakNotifications: boolean;
  insightNotifications: boolean;
  
  // Export preferences
  defaultExportFormat: 'pdf' | 'json' | 'csv';
  includeImages: boolean;
  includeEmotionalData: boolean;
  
  updatedAt: string;
}

/**
 * Reminder settings for journal entries
 */
export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM format
  days: number[]; // 0-6, Sunday = 0
  timezone: string;
  
  // Reminder types
  preMarketReminder: boolean;
  postMarketReminder: boolean;
  incompleteEntryReminder: boolean;
  
  // Reminder delivery
  method: 'notification' | 'email' | 'both';
  snoozeEnabled: boolean;
  snoozeDuration: number; // Minutes
}

// ===== DEFAULT TEMPLATE DEFINITIONS =====

/**
 * Pre-built template configurations
 */
export const DEFAULT_JOURNAL_TEMPLATES: Omit<JournalTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Pre-Market Checklist',
    description: 'Comprehensive preparation checklist for the trading day',
    category: 'pre-market',
    isDefault: true,
    isPublic: false,
    isSystemTemplate: true,
    usageCount: 0,
    sharedWith: [],
    tags: ['preparation', 'checklist', 'pre-market'],
    sections: [
      {
        id: 'market-bias',
        type: 'text',
        title: 'Market Bias & Analysis',
        prompt: 'What is your overall market bias for today? What key factors are driving your analysis?',
        placeholder: 'Bullish on EUR/USD due to ECB dovish stance and USD weakness...',
        isRequired: true,
        order: 1,
        config: {
          minWords: 10,
          allowRichText: true
        }
      },
      {
        id: 'preparation-checklist',
        type: 'checklist',
        title: 'Pre-Market Preparation',
        prompt: 'Complete your pre-market preparation checklist',
        isRequired: true,
        order: 2,
        config: {
          items: [
            { id: 'economic-calendar', text: 'Reviewed economic calendar for high-impact events' },
            { id: 'key-levels', text: 'Identified key support/resistance levels' },
            { id: 'risk-limits', text: 'Set daily risk limits and position sizing rules' },
            { id: 'trading-plan', text: 'Prepared specific trading plan with entry/exit criteria' },
            { id: 'news-sentiment', text: 'Checked latest news and market sentiment' },
            { id: 'technical-analysis', text: 'Completed multi-timeframe technical analysis' }
          ],
          allowCustomItems: true
        }
      },
      {
        id: 'emotional-state',
        type: 'emotion_tracker',
        title: 'Pre-Market Emotional State',
        prompt: 'How are you feeling before the market opens?',
        isRequired: false,
        order: 3,
        config: {
          emotionPhase: 'preMarket',
          trackingMetrics: ['confidence', 'anxiety', 'focus', 'energy', 'preparedness']
        }
      }
    ]
  },
  {
    name: 'Trade Review & Analysis',
    description: 'Detailed analysis of individual trades and overall performance',
    category: 'trade-review',
    isDefault: true,
    isPublic: false,
    isSystemTemplate: true,
    usageCount: 0,
    sharedWith: [],
    tags: ['analysis', 'review', 'performance'],
    sections: [
      {
        id: 'trade-selection',
        type: 'trade_reference',
        title: 'Trades to Analyze',
        prompt: 'Select the trades you want to analyze and reflect on today',
        isRequired: true,
        order: 1,
        config: {
          maxTrades: 10,
          filterCriteria: { status: 'both' }
        }
      },
      {
        id: 'execution-analysis',
        type: 'text',
        title: 'Execution Analysis',
        prompt: 'How well did you execute your trading plan today? What went according to plan?',
        isRequired: true,
        order: 2,
        config: {
          minWords: 20,
          allowRichText: true
        }
      },
      {
        id: 'mistakes-lessons',
        type: 'text',
        title: 'Mistakes & Lessons Learned',
        prompt: 'What mistakes did you make today? What specific lessons can you take away?',
        isRequired: true,
        order: 3,
        config: {
          minWords: 15,
          allowRichText: true
        }
      },
      {
        id: 'process-rating',
        type: 'rating',
        title: 'Process Execution Rating',
        prompt: 'Rate your execution of key trading processes today',
        isRequired: true,
        order: 4,
        config: {
          metrics: [
            { id: 'plan-adherence', name: 'Plan Adherence', description: 'How well did you stick to your trading plan?' },
            { id: 'risk-management', name: 'Risk Management', description: 'How disciplined were you with position sizing and stops?' },
            { id: 'entry-timing', name: 'Entry Timing', description: 'How well-timed were your trade entries?' },
            { id: 'exit-timing', name: 'Exit Timing', description: 'How well did you manage your trade exits?' },
            { id: 'emotional-control', name: 'Emotional Control', description: 'How well did you manage your emotions?' }
          ],
          scale: 5
        }
      }
    ]
  },
  {
    name: 'End of Day Reflection',
    description: 'Comprehensive end-of-day reflection and planning for tomorrow',
    category: 'post-market',
    isDefault: true,
    isPublic: false,
    isSystemTemplate: true,
    usageCount: 0,
    sharedWith: [],
    tags: ['reflection', 'post-market', 'planning'],
    sections: [
      {
        id: 'session-summary',
        type: 'text',
        title: 'Trading Session Summary',
        prompt: 'Summarize your trading session. What were the key events and decisions?',
        isRequired: true,
        order: 1,
        config: {
          minWords: 25,
          allowRichText: true
        }
      },
      {
        id: 'emotional-reflection',
        type: 'emotion_tracker',
        title: 'Post-Market Emotional State',
        prompt: 'How are you feeling after the trading session?',
        isRequired: false,
        order: 2,
        config: {
          emotionPhase: 'postMarket',
          trackingMetrics: ['satisfaction', 'learningValue', 'frustrationLevel', 'accomplishment']
        }
      },
      {
        id: 'lessons-learned',
        type: 'text',
        title: 'Key Lessons Learned',
        prompt: 'What are the most important lessons you learned today that will help you improve?',
        isRequired: true,
        order: 3,
        config: {
          minWords: 15,
          allowRichText: true
        }
      },
      {
        id: 'tomorrow-preparation',
        type: 'text',
        title: "Tomorrow's Preparation",
        prompt: 'What do you need to prepare or focus on for tomorrow\'s trading session?',
        isRequired: false,
        order: 4,
        config: {
          minWords: 10,
          allowRichText: true
        }
      }
    ]
  }
];

// ===== UTILITY TYPES =====

/**
 * Utility type for creating new journal entries
 */
export type CreateJournalEntryData = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'completionPercentage' | 'wordCount'>;

/**
 * Utility type for updating journal entries
 */
export type UpdateJournalEntryData = Partial<Omit<JournalEntry, 'id' | 'userId' | 'date' | 'createdAt'>>;

/**
 * Utility type for journal entry summaries (for lists and calendars)
 */
export type JournalEntrySummary = Pick<JournalEntry, 
  'id' | 'date' | 'isComplete' | 'completionPercentage' | 'wordCount' | 
  'tradeCount' | 'dailyPnL' | 'tags' | 'templateName'> & {
  overallMood?: EmotionalMood;
  processScore?: number;
};

// ===== CONSTANTS =====

/**
 * Default values for journal system
 */
export const JOURNAL_CONSTANTS = {
  // Auto-save settings
  DEFAULT_AUTOSAVE_INTERVAL: 30, // seconds
  MIN_AUTOSAVE_INTERVAL: 10, // seconds
  MAX_AUTOSAVE_INTERVAL: 300, // seconds
  
  // Content limits
  MAX_WORD_COUNT_PER_SECTION: 5000,
  MAX_IMAGES_PER_ENTRY: 20,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ANNOTATIONS_PER_IMAGE: 50,
  
  // Validation
  MIN_COMPLETION_PERCENTAGE: 50, // To be considered "complete"
  
  // Search and pagination
  DEFAULT_SEARCH_LIMIT: 20,
  MAX_SEARCH_LIMIT: 100,
  
  // Emotional tracking
  EMOTION_SCALE_MIN: 1,
  EMOTION_SCALE_MAX: 5,
  
  // Process scoring
  PROCESS_SCORE_WEIGHTS: {
    planAdherence: 0.25,
    riskManagement: 0.25,
    entryTiming: 0.15,
    exitTiming: 0.15,
    emotionalDiscipline: 0.20
  }
} as const;

/**
 * Error codes for journal operations
 */
export const JOURNAL_ERROR_CODES = {
  // General errors
  ENTRY_NOT_FOUND: 'ENTRY_NOT_FOUND',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  
  // Validation errors
  REQUIRED_SECTION_EMPTY: 'REQUIRED_SECTION_EMPTY',
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  INVALID_EMOTION_VALUE: 'INVALID_EMOTION_VALUE',
  INVALID_PROCESS_SCORE: 'INVALID_PROCESS_SCORE',
  
  // Image errors
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  INVALID_IMAGE_FORMAT: 'INVALID_IMAGE_FORMAT',
  TOO_MANY_IMAGES: 'TOO_MANY_IMAGES',
  
  // Template errors
  INVALID_TEMPLATE_STRUCTURE: 'INVALID_TEMPLATE_STRUCTURE',
  TEMPLATE_SECTION_MISSING: 'TEMPLATE_SECTION_MISSING',
  
  // Trade reference errors
  TRADE_NOT_FOUND: 'TRADE_NOT_FOUND',
  INVALID_TRADE_REFERENCE: 'INVALID_TRADE_REFERENCE'
} as const;
/**
 * Journal Utility Functions
 * 
 * This file contains utility functions for journal data processing, calculations,
 * and transformations used throughout the journal system.
 */

import { 
  JournalEntry, 
  JournalSection, 
  JournalTemplate,
  TemplateSection,
  EmotionalState,
  ProcessMetrics,
  JournalCalendarData,
  JournalCompletionStats,
  EmotionalTrend,
  TagUsage,
  TemplateUsage,
  JournalEntrySummary,
  CreateJournalEntryData,
  JOURNAL_CONSTANTS
} from '../types/journal';
import { Trade } from '../types/trade';

// ===== JOURNAL ENTRY UTILITIES =====

/**
 * Creates a new journal entry from a template
 */
export function createJournalEntryFromTemplate(
  userId: string,
  date: string,
  template?: JournalTemplate
): CreateJournalEntryData {
  const now = new Date().toISOString();
  
  const sections: JournalSection[] = template?.sections.map(templateSection => ({
    id: generateSectionId(),
    type: templateSection.type,
    title: templateSection.title,
    content: getDefaultContentForSectionType(templateSection.type, templateSection.config),
    order: templateSection.order,
    isRequired: templateSection.isRequired,
    isCompleted: false,
    templateSectionId: templateSection.id,
    createdAt: now,
    updatedAt: now
  })) || [];

  const entryData: CreateJournalEntryData = {
    userId,
    date,
    sections,
    tradeReferences: [],
    dailyTradeIds: [],
    emotionalState: createDefaultEmotionalState(),
    processMetrics: createDefaultProcessMetrics(),
    dailyPnL: 0,
    tradeCount: 0,
    images: [],
    tags: [],
    isComplete: false,
    isPrivate: true,
    sharedWith: []
  };

  // Only include templateId and templateName if template is provided
  if (template?.id) {
    entryData.templateId = template.id;
  }
  if (template?.name) {
    entryData.templateName = template.name;
  }

  return entryData;
}

/**
 * Updates journal entry with trade data for the day
 */
export function updateJournalEntryWithTrades(
  entry: JournalEntry,
  trades: Trade[]
): Partial<JournalEntry> {
  const dayTrades = trades.filter(trade => trade.date === entry.date);
  
  const dailyPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const tradeCount = dayTrades.length;
  const dailyTradeIds = dayTrades.map(trade => trade.id);

  return {
    dailyPnL,
    tradeCount,
    dailyTradeIds,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Calculates journal entry summary for calendar and list views
 */
export function createJournalEntrySummary(entry: JournalEntry): JournalEntrySummary {
  return {
    id: entry.id,
    date: entry.date,
    isComplete: entry.isComplete,
    completionPercentage: entry.completionPercentage,
    wordCount: entry.wordCount,
    tradeCount: entry.tradeCount,
    dailyPnL: entry.dailyPnL,
    tags: entry.tags,
    templateName: entry.templateName,
    overallMood: entry.emotionalState.overallMood,
    processScore: entry.processMetrics.processScore
  };
}

/**
 * Generates calendar data from journal entries
 */
export function generateJournalCalendarData(entries: JournalEntry[]): JournalCalendarData[] {
  return entries.map(entry => ({
    date: entry.date,
    hasEntry: true,
    isComplete: entry.isComplete,
    completionPercentage: entry.completionPercentage,
    wordCount: entry.wordCount,
    tradeCount: entry.tradeCount,
    dailyPnL: entry.dailyPnL,
    overallMood: entry.emotionalState.overallMood,
    processScore: entry.processMetrics.processScore,
    tags: entry.tags
  }));
}

// ===== SECTION UTILITIES =====

/**
 * Generates a unique section ID
 */
export function generateSectionId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets default content for a section type
 */
export function getDefaultContentForSectionType(type: string, config?: any): any {
  switch (type) {
    case 'text':
      return '';
    case 'checklist':
      return config?.items?.map((item: any) => ({
        ...item,
        checked: false
      })) || [];
    case 'rating':
      return config?.metrics?.reduce((acc: any, metric: any) => {
        acc[metric.id] = 3; // Default to middle rating
        return acc;
      }, {}) || {};
    case 'emotion_tracker':
      return {};
    case 'trade_reference':
      return [];
    case 'image_gallery':
      return [];
    default:
      return null;
  }
}

/**
 * Updates section completion status
 */
export function updateSectionCompletion(section: JournalSection): JournalSection {
  let isCompleted = false;

  switch (section.type) {
    case 'text':
      isCompleted = section.content && section.content.trim().length > 0;
      break;
    case 'checklist':
      isCompleted = Array.isArray(section.content) && section.content.length > 0;
      break;
    case 'rating':
      isCompleted = section.content && Object.keys(section.content).length > 0;
      break;
    case 'emotion_tracker':
      isCompleted = section.content && Object.keys(section.content).length > 0;
      break;
    case 'trade_reference':
      isCompleted = Array.isArray(section.content) && section.content.length > 0;
      break;
    case 'image_gallery':
      isCompleted = Array.isArray(section.content) && section.content.length > 0;
      break;
    default:
      isCompleted = section.content !== null && section.content !== undefined;
  }

  return {
    ...section,
    isCompleted,
    updatedAt: new Date().toISOString()
  };
}

// ===== EMOTIONAL STATE UTILITIES =====

/**
 * Creates default emotional state structure
 */
export function createDefaultEmotionalState(): EmotionalState {
  const now = new Date().toISOString();
  
  return {
    preMarket: {
      confidence: 3,
      anxiety: 3,
      focus: 3,
      energy: 3,
      mood: 'neutral',
      preparedness: 3,
      timestamp: now
    },
    duringTrading: {
      discipline: 3,
      patience: 3,
      emotionalControl: 3,
      decisionClarity: 3,
      stressManagement: 3,
      emotionalEvents: []
    },
    postMarket: {
      satisfaction: 3,
      learningValue: 3,
      frustrationLevel: 3,
      accomplishment: 3,
      overallMood: 'neutral',
      timestamp: now
    },
    overallMood: 'neutral',
    stressLevel: 3,
    confidenceLevel: 3,
    triggers: []
  };
}

/**
 * Calculates average emotional scores
 */
export function calculateEmotionalAverages(emotionalState: EmotionalState): {
  preMarketAverage: number;
  tradingAverage: number;
  postMarketAverage: number;
  overallAverage: number;
} {
  const preMarketAverage = (
    emotionalState.preMarket.confidence +
    emotionalState.preMarket.focus +
    emotionalState.preMarket.energy +
    emotionalState.preMarket.preparedness +
    (6 - emotionalState.preMarket.anxiety) // Invert anxiety (lower is better)
  ) / 5;

  const tradingAverage = (
    emotionalState.duringTrading.discipline +
    emotionalState.duringTrading.patience +
    emotionalState.duringTrading.emotionalControl +
    emotionalState.duringTrading.decisionClarity +
    emotionalState.duringTrading.stressManagement
  ) / 5;

  const postMarketAverage = (
    emotionalState.postMarket.satisfaction +
    emotionalState.postMarket.learningValue +
    emotionalState.postMarket.accomplishment +
    (6 - emotionalState.postMarket.frustrationLevel) // Invert frustration (lower is better)
  ) / 4;

  const overallAverage = (preMarketAverage + tradingAverage + postMarketAverage) / 3;

  return {
    preMarketAverage: Math.round(overallAverage * 10) / 10,
    tradingAverage: Math.round(tradingAverage * 10) / 10,
    postMarketAverage: Math.round(postMarketAverage * 10) / 10,
    overallAverage: Math.round(overallAverage * 10) / 10
  };
}

// ===== PROCESS METRICS UTILITIES =====

/**
 * Creates default process metrics structure
 */
export function createDefaultProcessMetrics(): ProcessMetrics {
  return {
    planAdherence: 3,
    riskManagement: 3,
    entryTiming: 3,
    exitTiming: 3,
    emotionalDiscipline: 3,
    overallDiscipline: 3,
    processScore: 60, // 3/5 * 100 = 60%
    mistakesMade: [],
    successfulExecutions: [],
    improvementAreas: [],
    strengthsIdentified: []
  };
}

/**
 * Calculates process metrics from individual scores
 */
export function calculateProcessMetrics(metrics: Partial<ProcessMetrics>): ProcessMetrics {
  const weights = JOURNAL_CONSTANTS.PROCESS_SCORE_WEIGHTS;
  
  const planAdherence = metrics.planAdherence || 3;
  const riskManagement = metrics.riskManagement || 3;
  const entryTiming = metrics.entryTiming || 3;
  const exitTiming = metrics.exitTiming || 3;
  const emotionalDiscipline = metrics.emotionalDiscipline || 3;

  const overallDiscipline = (
    planAdherence * weights.planAdherence +
    riskManagement * weights.riskManagement +
    entryTiming * weights.entryTiming +
    exitTiming * weights.exitTiming +
    emotionalDiscipline * weights.emotionalDiscipline
  );

  const processScore = Math.round((overallDiscipline / 5) * 100);

  return {
    planAdherence,
    riskManagement,
    entryTiming,
    exitTiming,
    emotionalDiscipline,
    overallDiscipline: Math.round(overallDiscipline * 10) / 10,
    processScore,
    mistakesMade: metrics.mistakesMade || [],
    successfulExecutions: metrics.successfulExecutions || [],
    improvementAreas: metrics.improvementAreas || [],
    strengthsIdentified: metrics.strengthsIdentified || []
  };
}

// ===== ANALYTICS UTILITIES =====

/**
 * Calculates journal completion statistics
 */
export function calculateJournalCompletionStats(
  entries: JournalEntry[],
  startDate: string,
  endDate: string
): JournalCompletionStats {
  const completedEntries = entries.filter(entry => entry.isComplete);
  const partialEntries = entries.filter(entry => 
    !entry.isComplete && entry.completionPercentage > 0
  );
  const emptyEntries = entries.filter(entry => entry.completionPercentage === 0);

  // Calculate streaks
  const sortedEntries = entries.sort((a, b) => a.date.localeCompare(b.date));
  const { currentStreak, longestStreak, streakStartDate } = calculateJournalingStreaks(sortedEntries);

  // Calculate averages
  const totalWords = entries.reduce((sum, entry) => sum + entry.wordCount, 0);
  const averageWordsPerEntry = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

  // Tag analysis
  const tagCounts = new Map<string, number>();
  entries.forEach(entry => {
    entry.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const mostUsedTags: TagUsage[] = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / entries.length) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Template analysis
  const templateCounts = new Map<string, { name: string; count: number }>();
  entries.forEach(entry => {
    if (entry.templateId && entry.templateName) {
      const existing = templateCounts.get(entry.templateId);
      templateCounts.set(entry.templateId, {
        name: entry.templateName,
        count: (existing?.count || 0) + 1
      });
    }
  });

  const mostUsedTemplates: TemplateUsage[] = Array.from(templateCounts.entries())
    .map(([templateId, { name, count }]) => ({
      templateId,
      templateName: name,
      count,
      percentage: Math.round((count / entries.length) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Emotional trends (simplified)
  const emotionalTrends: EmotionalTrend[] = []; // TODO: Implement detailed emotional analysis

  return {
    userId: entries[0]?.userId || '',
    totalEntries: entries.length,
    completedEntries: completedEntries.length,
    partialEntries: partialEntries.length,
    emptyEntries: emptyEntries.length,
    completionRate: entries.length > 0 ? Math.round((completedEntries.length / entries.length) * 100) : 0,
    currentStreak,
    longestStreak,
    streakStartDate,
    averageWordsPerEntry,
    averageTimeSpent: 0, // TODO: Implement time tracking
    mostActiveDay: 'Monday', // TODO: Calculate from actual data
    mostActiveTime: '09:00', // TODO: Calculate from actual data
    mostUsedTags,
    mostUsedTemplates,
    emotionalTrends,
    startDate,
    endDate,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Calculates journaling streaks
 */
export function calculateJournalingStreaks(sortedEntries: JournalEntry[]): {
  currentStreak: number;
  longestStreak: number;
  streakStartDate?: string;
} {
  if (sortedEntries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const completedEntries = sortedEntries.filter(entry => entry.isComplete);
  
  if (completedEntries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let streakStartDate: string | undefined;

  // Calculate streaks by checking consecutive days
  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date(today);
  
  // Check current streak (working backwards from today)
  for (let i = 0; i < 365; i++) { // Check up to a year back
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasEntry = completedEntries.some(entry => entry.date === dateStr);
    
    if (hasEntry) {
      currentStreak++;
      if (!streakStartDate) {
        streakStartDate = dateStr;
      }
    } else if (currentStreak > 0) {
      break; // Streak is broken
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate longest streak from all entries
  const entryDates = completedEntries.map(entry => entry.date).sort();
  tempStreak = 1;
  
  for (let i = 1; i < entryDates.length; i++) {
    const prevDate = new Date(entryDates[i - 1]);
    const currDate = new Date(entryDates[i]);
    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    streakStartDate
  };
}

// ===== DATE UTILITIES =====

/**
 * Formats date for display
 */
export function formatDateForDisplay(date: string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    case 'relative':
      const today = new Date();
      const diffTime = today.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays === -1) return 'Tomorrow';
      if (diffDays > 0 && diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays < 0 && diffDays >= -7) return `In ${Math.abs(diffDays)} days`;
      
      return formatDateForDisplay(date, 'short');
    default:
      return date;
  }
}

/**
 * Gets date range for a given period
 */
export function getDateRange(period: 'week' | 'month' | 'quarter' | 'year', referenceDate?: string): {
  startDate: string;
  endDate: string;
} {
  const date = referenceDate ? new Date(referenceDate) : new Date();
  
  switch (period) {
    case 'week':
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      };
      
    case 'month':
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      };
      
    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3);
      const startOfQuarter = new Date(date.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(date.getFullYear(), quarter * 3 + 3, 0);
      
      return {
        startDate: startOfQuarter.toISOString().split('T')[0],
        endDate: endOfQuarter.toISOString().split('T')[0]
      };
      
    case 'year':
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const endOfYear = new Date(date.getFullYear(), 11, 31);
      
      return {
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: endOfYear.toISOString().split('T')[0]
      };
      
    default:
      return {
        startDate: date.toISOString().split('T')[0],
        endDate: date.toISOString().split('T')[0]
      };
  }
}

// ===== EXPORT UTILITIES =====

/**
 * Prepares journal entry for export
 */
export function prepareJournalEntryForExport(entry: JournalEntry, includePrivateData: boolean = false): any {
  const exportData = {
    date: entry.date,
    templateName: entry.templateName,
    sections: entry.sections.map(section => ({
      title: section.title,
      type: section.type,
      content: section.content,
      isCompleted: section.isCompleted
    })),
    dailyPnL: entry.dailyPnL,
    tradeCount: entry.tradeCount,
    processScore: entry.processMetrics.processScore,
    completionPercentage: entry.completionPercentage,
    wordCount: entry.wordCount,
    tags: entry.tags
  };

  if (includePrivateData) {
    return {
      ...exportData,
      emotionalState: entry.emotionalState,
      processMetrics: entry.processMetrics,
      images: entry.images.map(img => ({
        filename: img.filename,
        caption: img.caption,
        description: img.description
      }))
    };
  }

  return exportData;
}
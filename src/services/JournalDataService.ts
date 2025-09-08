/**
 * Journal Data Service
 * 
 * This service handles all CRUD operations and real-time subscriptions for journal entries.
 * It provides a comprehensive interface for managing daily trading journal data with Firebase Firestore.
 * 
 * Key Features:
 * - CRUD operations for journal entries
 * - Real-time subscriptions and updates
 * - Date-based querying and filtering
 * - Offline support with local caching
 * - Batch operations for performance
 * - Data validation and error handling
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import {
  JournalEntry,
  JournalTemplate,
  JournalCalendarData,
  JournalCompletionStats,
  JournalSearchCriteria,
  JournalSearchResult,
  CreateJournalEntryData,
  UpdateJournalEntryData,
  JournalEntrySummary,
  JournalValidationResult,
  JOURNAL_CONSTANTS,
  JOURNAL_ERROR_CODES
} from '../types/journal';

import {
  JOURNAL_COLLECTIONS,
  JournalEntryDocument,
  journalEntryToFirestore,
  firestoreToJournalEntry,
  JournalEntryQueryBuilder,
  mapFirestoreError
} from '../lib/journalSchema';

import {
  validateJournalEntry,
  calculateCompletionPercentage,
  calculateWordCount,
  isJournalEntryComplete
} from '../utils/journalValidation';

import {
  createJournalEntryFromTemplate,
  updateJournalEntryWithTrades,
  createJournalEntrySummary,
  generateJournalCalendarData,
  calculateJournalCompletionStats,
  updateSectionCompletion
} from '../utils/journalUtils';

import OfflineService from './OfflineService';

/**
 * Configuration interface for journal data service
 */
export interface JournalDataServiceConfig {
  enableOfflineSupport?: boolean;
  autoSaveInterval?: number; // seconds
  maxRetryAttempts?: number;
  batchSize?: number;
}

/**
 * Default configuration for journal data service
 */
const DEFAULT_CONFIG: Required<JournalDataServiceConfig> = {
  enableOfflineSupport: true,
  autoSaveInterval: JOURNAL_CONSTANTS.DEFAULT_AUTOSAVE_INTERVAL,
  maxRetryAttempts: 3,
  batchSize: 50
};

/**
 * Journal Data Service class for managing journal entries
 */
export class JournalDataService {
  private config: Required<JournalDataServiceConfig>;
  private offlineQueue: Map<string, () => Promise<void>> = new Map();
  private activeSubscriptions: Map<string, Unsubscribe> = new Map();
  private offlineService: OfflineService;

  constructor(config: JournalDataServiceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.offlineService = OfflineService.getInstance();
  }

  // ===== CRUD OPERATIONS =====

  /**
   * Creates a new journal entry
   */
  async createJournalEntry(
    userId: string,
    date: string,
    templateId?: string
  ): Promise<JournalEntry> {
    try {
      // Check if entry already exists for this date
      const existingEntry = await this.getJournalEntry(userId, date);
      if (existingEntry) {
        throw new Error(`Journal entry already exists for ${date}`);
      }

      // Get template if specified
      let template: JournalTemplate | undefined;
      if (templateId) {
        // TODO: Implement template retrieval when TemplateService is available
        // template = await templateService.getTemplate(userId, templateId);
      }

      // Create entry data
      const entryData = createJournalEntryFromTemplate(userId, date, template);
      const now = new Date().toISOString();
      
      const newEntry: JournalEntry = {
        id: `${userId}_${date}`, // Use consistent ID format
        ...entryData,
        createdAt: now,
        updatedAt: now,
        completionPercentage: calculateCompletionPercentage(entryData.sections),
        wordCount: calculateWordCount(entryData.sections)
      };

      // Validate entry
      const validation = validateJournalEntry(newEntry);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Save to Firestore with offline support
      const docRef = doc(db, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId), newEntry.id);
      const firestoreDoc = journalEntryToFirestore(newEntry);
      
      try {
        await setDoc(docRef, firestoreDoc);
      } catch (error) {
        if (this.config.enableOfflineSupport && this.isNetworkError(error)) {
          // Store locally and queue for sync
          await this.offlineService.storeOfflineData(`entry_${newEntry.id}`, newEntry);
          await this.offlineService.queueOperation({
            type: 'create',
            entityType: 'journalEntry',
            entityId: newEntry.id,
            data: newEntry,
            userId
          });
          return newEntry; // Return the entry even if offline
        }
        throw error;
      }

      return newEntry;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  /**
   * Retrieves a journal entry by date
   */
  async getJournalEntry(userId: string, date: string): Promise<JournalEntry | null> {
    try {
      const entryId = `${userId}_${date}`;
      
      // Try to get from Firestore first
      try {
        const docRef = doc(db, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId), entryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return firestoreToJournalEntry(docSnap.id, docSnap.data() as JournalEntryDocument);
        }
      } catch (error) {
        if (this.config.enableOfflineSupport && this.isNetworkError(error)) {
          // Fall back to offline data
          const offlineData = await this.offlineService.getOfflineData(`entry_${entryId}`);
          if (offlineData?.data) {
            return offlineData.data;
          }
        }
        throw error;
      }

      // Check offline data if not found in Firestore
      if (this.config.enableOfflineSupport) {
        const offlineData = await this.offlineService.getOfflineData(`entry_${entryId}`);
        if (offlineData?.data) {
          return offlineData.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting journal entry:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  /**
   * Updates an existing journal entry
   */
  async updateJournalEntry(
    userId: string,
    entryId: string,
    updates: UpdateJournalEntryData
  ): Promise<void> {
    try {
      // Get current entry for validation
      const currentEntry = await this.getJournalEntryById(userId, entryId);
      if (!currentEntry) {
        throw new Error('Journal entry not found');
      }

      // Merge updates with current entry
      const updatedEntry: JournalEntry = {
        ...currentEntry,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Update calculated fields
      if (updates.sections) {
        updatedEntry.sections = updates.sections.map(updateSectionCompletion);
        updatedEntry.completionPercentage = calculateCompletionPercentage(updatedEntry.sections);
        updatedEntry.wordCount = calculateWordCount(updatedEntry.sections);
        updatedEntry.isComplete = isJournalEntryComplete(updatedEntry);
      }

      // Validate updated entry
      const validation = validateJournalEntry(updatedEntry);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Update in Firestore with offline support
      const docRef = doc(db, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId), entryId);
      const firestoreDoc = journalEntryToFirestore(updatedEntry);
      
      try {
        await updateDoc(docRef, firestoreDoc);
      } catch (error) {
        if (this.config.enableOfflineSupport && this.isNetworkError(error)) {
          // Store locally and queue for sync
          await this.offlineService.storeOfflineData(`entry_${entryId}`, updatedEntry);
          await this.offlineService.queueOperation({
            type: 'update',
            entityType: 'journalEntry',
            entityId: entryId,
            data: updatedEntry,
            userId
          });
          return; // Return success even if offline
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  /**
   * Deletes a journal entry
   */
  async deleteJournalEntry(userId: string, entryId: string): Promise<void> {
    try {
      const docRef = doc(db, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId), entryId);
      
      try {
        await deleteDoc(docRef);
      } catch (error) {
        if (this.config.enableOfflineSupport && this.isNetworkError(error)) {
          // Queue for sync and remove from local storage
          await this.offlineService.queueOperation({
            type: 'delete',
            entityType: 'journalEntry',
            entityId: entryId,
            data: null,
            userId
          });
          await this.offlineService.removeOfflineData(`entry_${entryId}`);
          return; // Return success even if offline
        }
        throw error;
      }
      
      // Remove from offline storage if successful
      if (this.config.enableOfflineSupport) {
        await this.offlineService.removeOfflineData(`entry_${entryId}`);
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  /**
   * Gets a journal entry by ID (internal helper)
   */
  private async getJournalEntryById(userId: string, entryId: string): Promise<JournalEntry | null> {
    try {
      const docRef = doc(db, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId), entryId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return firestoreToJournalEntry(docSnap.id, docSnap.data() as JournalEntryDocument);
    } catch (error) {
      console.error('Error getting journal entry by ID:', error);
      return null;
    }
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Retrieves journal entries for a specific month
   */
  async getJournalEntriesForMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<JournalEntry[]> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      return await this.getJournalEntriesForDateRange(userId, startDate, endDate);
    } catch (error) {
      console.error('Error getting journal entries for month:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  /**
   * Retrieves journal entries for a date range
   */
  async getJournalEntriesForDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<JournalEntry[]> {
    try {
      const queryBuilder = new JournalEntryQueryBuilder(db, userId);
      const q = queryBuilder
        .dateRange(startDate, endDate)
        .orderByDate('desc')
        .build();

      const querySnapshot = await getDocs(q);
      const entries: JournalEntry[] = [];

      querySnapshot.forEach((doc) => {
        entries.push(firestoreToJournalEntry(doc.id, doc.data() as JournalEntryDocument));
      });

      return entries;
    } catch (error) {
      console.error('Error getting journal entries for date range:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  /**
   * Gets journal entry summaries for calendar display
   */
  async getJournalCalendarData(
    userId: string,
    year: number,
    month: number
  ): Promise<JournalCalendarData[]> {
    try {
      const entries = await this.getJournalEntriesForMonth(userId, year, month);
      return generateJournalCalendarData(entries);
    } catch (error) {
      console.error('Error getting journal calendar data:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  // ===== ANALYTICS AND INSIGHTS =====

  /**
   * Calculates journaling streak for a user
   */
  async getJournalingStreak(userId: string): Promise<number> {
    try {
      // Get recent entries (last 365 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const entries = await this.getJournalEntriesForDateRange(userId, startDate, endDate);
      const completedEntries = entries.filter(entry => entry.isComplete);
      
      // Calculate current streak
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const hasCompletedEntry = completedEntries.some(entry => entry.date === dateStr);
        
        if (hasCompletedEntry) {
          streak++;
        } else if (streak > 0) {
          break; // Streak is broken
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating journaling streak:', error);
      return 0;
    }
  }

  /**
   * Gets completion statistics for a user
   */
  async getCompletionStats(userId: string): Promise<JournalCompletionStats> {
    try {
      // Get entries for the last 90 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const entries = await this.getJournalEntriesForDateRange(userId, startDate, endDate);
      
      return calculateJournalCompletionStats(entries, startDate, endDate);
    } catch (error) {
      console.error('Error getting completion stats:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  /**
   * Searches journal entries based on criteria
   */
  async searchJournalEntries(
    userId: string,
    criteria: JournalSearchCriteria
  ): Promise<JournalSearchResult> {
    try {
      const startTime = Date.now();
      
      let queryBuilder = new JournalEntryQueryBuilder(db, userId);
      
      // Apply date range filter
      if (criteria.startDate && criteria.endDate) {
        queryBuilder = queryBuilder.dateRange(criteria.startDate, criteria.endDate);
      }
      
      // Apply completion status filter
      if (criteria.completionStatus && criteria.completionStatus.length === 1) {
        const isComplete = criteria.completionStatus[0] === 'complete';
        queryBuilder = queryBuilder.completionStatus(isComplete);
      }
      
      // Apply template filter
      if (criteria.templateIds && criteria.templateIds.length === 1) {
        queryBuilder = queryBuilder.templateId(criteria.templateIds[0]);
      }
      
      // Apply sorting and pagination
      queryBuilder = queryBuilder.orderByDate(criteria.sortOrder || 'desc');
      
      if (criteria.limit) {
        queryBuilder = queryBuilder.limit(Math.min(criteria.limit, JOURNAL_CONSTANTS.MAX_SEARCH_LIMIT));
      }
      
      const q = queryBuilder.build();
      const querySnapshot = await getDocs(q);
      
      let entries: JournalEntry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push(firestoreToJournalEntry(doc.id, doc.data() as JournalEntryDocument));
      });
      
      // Apply client-side filters for complex criteria
      if (criteria.query) {
        const searchQuery = criteria.query.toLowerCase();
        entries = entries.filter(entry => {
          const searchableContent = entry.sections
            .filter(section => section.type === 'text')
            .map(section => section.content)
            .join(' ')
            .toLowerCase();
          
          return searchableContent.includes(searchQuery) ||
                 entry.tags.some(tag => tag.toLowerCase().includes(searchQuery));
        });
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        entries = entries.filter(entry => 
          criteria.tags!.some(tag => entry.tags.includes(tag))
        );
      }
      
      if (criteria.minWordCount) {
        entries = entries.filter(entry => entry.wordCount >= criteria.minWordCount!);
      }
      
      if (criteria.maxWordCount) {
        entries = entries.filter(entry => entry.wordCount <= criteria.maxWordCount!);
      }
      
      const searchTime = Date.now() - startTime;
      
      return {
        entries,
        totalCount: entries.length,
        hasMore: false, // TODO: Implement proper pagination
        searchTime
      };
    } catch (error) {
      console.error('Error searching journal entries:', error);
      throw new Error(mapFirestoreError(error));
    }
  }

  // ===== REAL-TIME SUBSCRIPTIONS =====

  /**
   * Subscribes to real-time updates for a specific journal entry
   */
  subscribeToJournalEntry(
    userId: string,
    date: string,
    callback: (entry: JournalEntry | null) => void
  ): () => void {
    const entryId = `${userId}_${date}`;
    const docRef = doc(db, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId), entryId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const entry = firestoreToJournalEntry(doc.id, doc.data() as JournalEntryDocument);
          callback(entry);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in journal entry subscription:', error);
        callback(null);
      }
    );
    
    // Store subscription for cleanup
    const subscriptionKey = `entry_${entryId}`;
    this.activeSubscriptions.set(subscriptionKey, unsubscribe);
    
    // Return cleanup function
    return () => {
      unsubscribe();
      this.activeSubscriptions.delete(subscriptionKey);
    };
  }

  /**
   * Subscribes to real-time updates for journal calendar data
   */
  subscribeToJournalCalendar(
    userId: string,
    callback: (entries: JournalCalendarData[]) => void
  ): () => void {
    const collectionRef = collection(db, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId));
    const q = query(
      collectionRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(100) // Limit to recent entries for performance
    );
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const entries: JournalEntry[] = [];
        querySnapshot.forEach((doc) => {
          entries.push(firestoreToJournalEntry(doc.id, doc.data() as JournalEntryDocument));
        });
        
        const calendarData = generateJournalCalendarData(entries);
        callback(calendarData);
      },
      (error) => {
        console.error('Error in journal calendar subscription:', error);
        callback([]);
      }
    );
    
    // Store subscription for cleanup
    const subscriptionKey = `calendar_${userId}`;
    this.activeSubscriptions.set(subscriptionKey, unsubscribe);
    
    // Return cleanup function
    return () => {
      unsubscribe();
      this.activeSubscriptions.delete(subscriptionKey);
    };
  }

  // ===== OFFLINE SUPPORT =====

  /**
   * Queues an operation for offline retry
   */
  private async queueOfflineOperation(key: string, operation: () => Promise<void>): Promise<void> {
    if (!this.config.enableOfflineSupport) return;
    
    this.offlineQueue.set(key, operation);
    
    // Store in localStorage for persistence
    const queueData = Array.from(this.offlineQueue.keys());
    localStorage.setItem('journal_offline_queue', JSON.stringify(queueData));
  }

  /**
   * Processes offline queue when connection is restored
   */
  async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.size === 0) return;
    
    const operations = Array.from(this.offlineQueue.entries());
    
    for (const [key, operation] of operations) {
      try {
        await operation();
        this.offlineQueue.delete(key);
      } catch (error) {
        console.error(`Failed to process offline operation ${key}:`, error);
        // Keep in queue for next retry
      }
    }
    
    // Update localStorage
    const queueData = Array.from(this.offlineQueue.keys());
    localStorage.setItem('journal_offline_queue', JSON.stringify(queueData));
  }

  /**
   * Checks if an error is network-related
   */
  private isNetworkError(error: any): boolean {
    return error.code === 'unavailable' || 
           error.code === 'deadline-exceeded' ||
           error.message?.includes('network') ||
           error.message?.includes('offline');
  }

  // ===== CLEANUP =====

  /**
   * Cleans up all active subscriptions
   */
  cleanup(): void {
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();
  }
}

/**
 * Creates a new instance of JournalDataService with default configuration
 */
export function createJournalDataService(config?: JournalDataServiceConfig): JournalDataService {
  return new JournalDataService(config);
}

/**
 * Default journal data service instance
 */
export const journalDataService = createJournalDataService();

/**
 * Validates journal data service inputs
 */
export function validateJournalServiceInputs(
  userId: string,
  date?: string
): JournalValidationResult {
  const errors: any[] = [];
  
  if (!userId || typeof userId !== 'string') {
    errors.push({
      field: 'userId',
      message: 'Valid user ID is required',
      code: JOURNAL_ERROR_CODES.UNAUTHORIZED_ACCESS,
      severity: 'error'
    });
  }
  
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push({
      field: 'date',
      message: 'Date must be in YYYY-MM-DD format',
      code: JOURNAL_ERROR_CODES.INVALID_DATE_FORMAT,
      severity: 'error'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}
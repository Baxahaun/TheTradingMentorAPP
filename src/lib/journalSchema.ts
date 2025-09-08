/**
 * Journal Database Schema Definitions
 * 
 * This file defines the Firestore database schema and collection structures
 * for the journal system, including validation rules and indexes.
 */

import { 
  JournalEntry, 
  JournalTemplate, 
  JournalPreferences,
  JournalCompletionStats
} from '../types/journal';

import { 
  Firestore, 
  Timestamp, 
  Query, 
  WriteBatch, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  writeBatch,
  serverTimestamp,
  setDoc,
  deleteDoc
} from 'firebase/firestore';

// ===== FIRESTORE COLLECTION PATHS =====

/**
 * Firestore collection paths for journal data
 */
export const JOURNAL_COLLECTIONS = {
  // User-specific collections (original design)
  JOURNAL_ENTRIES: (userId: string) => `users/${userId}/journalEntries`,
  JOURNAL_TEMPLATES: (userId: string) => `users/${userId}/journalTemplates`,
  JOURNAL_PREFERENCES: (userId: string) => `users/${userId}/journalSettings/preferences`,
  JOURNAL_STATS: (userId: string) => `users/${userId}/journalSettings/stats`,
  
  // Root-level collections (fallback for existing data)
  JOURNAL_ENTRIES_ROOT: 'journalEntries',
  
  // Global collections
  SYSTEM_TEMPLATES: 'systemJournalTemplates',
  PUBLIC_TEMPLATES: 'publicJournalTemplates'
} as const;

// ===== FIRESTORE DOCUMENT INTERFACES =====

/**
 * Journal entry document structure in Firestore
 */
export interface JournalEntryDocument extends Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> {
  // Firestore-specific fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Indexed fields for efficient querying
  userId: string;
  date: string; // YYYY-MM-DD format for easy sorting
  isComplete: boolean;
  completionPercentage: number;
  
  // Searchable fields
  searchableContent?: string; // Concatenated text content for full-text search
  searchableTags?: string; // Lowercase, space-separated tags
}

/**
 * Journal template document structure in Firestore
 */
export interface JournalTemplateDocument extends Omit<JournalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'category'> {
  // Firestore-specific fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Indexed fields
  userId: string;
  category: string;
  isDefault: boolean;
  isPublic: boolean;
  isSystemTemplate: boolean;
}

/**
 * Journal preferences document structure in Firestore
 */
export interface JournalPreferencesDocument extends Omit<JournalPreferences, 'updatedAt'> {
  updatedAt: Timestamp;
}

/**
 * Journal statistics document structure in Firestore
 */
export interface JournalStatsDocument extends Omit<JournalCompletionStats, 'lastUpdated'> {
  lastUpdated: Timestamp;
}

// ===== FIRESTORE INDEXES =====

/**
 * Required Firestore indexes for efficient querying
 */
export const REQUIRED_INDEXES = [
  // Journal entries indexes
  {
    collection: 'users/{userId}/journalEntries',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'date', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'users/{userId}/journalEntries',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'isComplete', order: 'ASCENDING' },
      { field: 'date', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'users/{userId}/journalEntries',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'templateId', order: 'ASCENDING' },
      { field: 'date', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'users/{userId}/journalEntries',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'searchableTags', order: 'ASCENDING' },
      { field: 'date', order: 'DESCENDING' }
    ]
  },
  
  // Journal templates indexes
  {
    collection: 'users/{userId}/journalTemplates',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'category', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'users/{userId}/journalTemplates',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'isDefault', order: 'ASCENDING' }
    ]
  },
  
  // Public templates indexes
  {
    collection: 'publicJournalTemplates',
    fields: [
      { field: 'isPublic', order: 'ASCENDING' },
      { field: 'category', order: 'ASCENDING' },
      { field: 'usageCount', order: 'DESCENDING' }
    ]
  }
];

// ===== FIRESTORE SECURITY RULES =====

/**
 * Firestore security rules for journal collections
 */
export const JOURNAL_SECURITY_RULES = `
// Journal Entries - Private to user
match /users/{userId}/journalEntries/{entryId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
  // Validation rules
  allow create: if request.auth != null 
    && request.auth.uid == userId
    && validateJournalEntry(resource.data);
    
  allow update: if request.auth != null 
    && request.auth.uid == userId
    && validateJournalEntry(resource.data)
    && resource.data.userId == userId; // Prevent userId changes
}

// Journal Templates - Private to user with sharing capability
match /users/{userId}/journalTemplates/{templateId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
  // Allow read access for shared templates
  allow read: if request.auth != null 
    && request.auth.uid in resource.data.sharedWith;
    
  allow create: if request.auth != null 
    && request.auth.uid == userId
    && validateJournalTemplate(resource.data);
}

// Journal Preferences - Private to user
match /users/{userId}/journalSettings/preferences {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Journal Statistics - Private to user
match /users/{userId}/journalSettings/stats {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Public Templates - Read-only for authenticated users
match /publicJournalTemplates/{templateId} {
  allow read: if request.auth != null;
  allow write: if false; // Only admin can write
}

// System Templates - Read-only for authenticated users
match /systemJournalTemplates/{templateId} {
  allow read: if request.auth != null;
  allow write: if false; // Only admin can write
}

// Validation functions
function validateJournalEntry(data) {
  return data.keys().hasAll(['userId', 'date', 'sections', 'emotionalState', 'processMetrics'])
    && data.userId is string
    && data.date is string
    && data.sections is list
    && data.emotionalState is map
    && data.processMetrics is map
    && data.dailyPnL is number
    && data.tradeCount is number
    && data.isComplete is bool
    && data.completionPercentage >= 0
    && data.completionPercentage <= 100;
}

function validateJournalTemplate(data) {
  return data.keys().hasAll(['userId', 'name', 'category', 'sections'])
    && data.userId is string
    && data.name is string
    && data.category is string
    && data.sections is list
    && data.sections.size() > 0
    && data.isDefault is bool
    && data.isPublic is bool;
}
`;

// ===== DATA TRANSFORMATION UTILITIES =====

/**
 * Converts JournalEntry to Firestore document
 */
export function journalEntryToFirestore(entry: JournalEntry): JournalEntryDocument {
  const { id, createdAt, updatedAt, ...entryData } = entry;
  
  // Create searchable content for full-text search
  const searchableContent = entry.sections
    .filter(section => section.type === 'text')
    .map(section => section.content)
    .join(' ')
    .toLowerCase();
    
  const searchableTags = entry.tags.join(' ').toLowerCase();
  
  return {
    ...entryData,
    createdAt: Timestamp.fromDate(new Date(createdAt)),
    updatedAt: Timestamp.fromDate(new Date(updatedAt)),
    searchableContent,
    searchableTags
  };
}

/**
 * Converts Firestore document to JournalEntry
 */
export function firestoreToJournalEntry(
  id: string, 
  doc: JournalEntryDocument
): JournalEntry {
  const { createdAt, updatedAt, searchableContent, searchableTags, ...entryData } = doc;
  
  return {
    id,
    ...entryData,
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString()
  };
}

/**
 * Converts JournalTemplate to Firestore document
 */
export function journalTemplateToFirestore(template: JournalTemplate): JournalTemplateDocument {
  const { id, createdAt, updatedAt, category, ...templateData } = template;
  
  return {
    ...templateData,
    createdAt: Timestamp.fromDate(new Date(createdAt)),
    updatedAt: Timestamp.fromDate(new Date(updatedAt)),
    category: category as string
  };
}

/**
 * Converts Firestore document to JournalTemplate
 */
export function firestoreToJournalTemplate(
  id: string, 
  doc: JournalTemplateDocument
): JournalTemplate {
  const { createdAt, updatedAt, category, ...templateData } = doc;
  
  return {
    id,
    ...templateData,
    category: category as any, // Cast back to TemplateCategory enum
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString()
  };
}

/**
 * Converts JournalPreferences to Firestore document
 */
export function journalPreferencesToFirestore(preferences: JournalPreferences): JournalPreferencesDocument {
  const { updatedAt, ...preferencesData } = preferences;
  
  return {
    ...preferencesData,
    updatedAt: Timestamp.fromDate(new Date(updatedAt))
  };
}

/**
 * Converts Firestore document to JournalPreferences
 */
export function firestoreToJournalPreferences(doc: JournalPreferencesDocument): JournalPreferences {
  const { updatedAt, ...preferencesData } = doc;
  
  return {
    ...preferencesData,
    updatedAt: updatedAt.toDate().toISOString()
  };
}

// ===== BATCH OPERATION UTILITIES =====

/**
 * Batch write configuration for journal operations
 */
export const BATCH_WRITE_CONFIG = {
  MAX_BATCH_SIZE: 500, // Firestore limit
  MAX_CONCURRENT_BATCHES: 10,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // milliseconds
};

/**
 * Creates batch write operations for multiple journal entries
 */
export function createJournalEntryBatch(
  firestore: Firestore,
  userId: string,
  entries: JournalEntry[]
): WriteBatch[] {
  const batches: WriteBatch[] = [];
  const collectionRef = collection(firestore, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId));
  
  for (let i = 0; i < entries.length; i += BATCH_WRITE_CONFIG.MAX_BATCH_SIZE) {
    const batch = writeBatch(firestore);
    const batchEntries = entries.slice(i, i + BATCH_WRITE_CONFIG.MAX_BATCH_SIZE);
    
    batchEntries.forEach(entry => {
      const docRef = entry.id ? doc(collectionRef, entry.id) : doc(collectionRef);
      const firestoreDoc = journalEntryToFirestore(entry);
      batch.set(docRef, firestoreDoc);
    });
    
    batches.push(batch);
  }
  
  return batches;
}

// ===== QUERY BUILDERS =====

/**
 * Query builder for journal entries
 */
export class JournalEntryQueryBuilder {
  private query: Query;
  
  constructor(
    firestore: Firestore,
    userId: string
  ) {
    // Use original user-specific collection path that was working
    const collectionRef = collection(firestore, JOURNAL_COLLECTIONS.JOURNAL_ENTRIES(userId));
    // No userId filter needed since collection is already user-specific
    this.query = query(collectionRef);
  }
  
  dateRange(startDate: string, endDate: string): this {
    this.query = query(this.query, where('date', '>=', startDate), where('date', '<=', endDate));
    return this;
  }
  
  completionStatus(isComplete: boolean): this {
    this.query = query(this.query, where('isComplete', '==', isComplete));
    return this;
  }
  
  templateId(templateId: string): this {
    this.query = query(this.query, where('templateId', '==', templateId));
    return this;
  }
  
  orderByDate(direction: 'asc' | 'desc' = 'desc'): this {
    // Skip orderBy when we have range queries to avoid composite index requirement
    // We'll sort client-side instead
    return this;
  }
  
  limit(count: number): this {
    this.query = query(this.query, limit(count));
    return this;
  }
  
  build(): Query {
    return this.query;
  }
}

/**
 * Query builder for journal templates
 */
export class JournalTemplateQueryBuilder {
  private query: Query;
  
  constructor(
    firestore: Firestore,
    userId: string
  ) {
    const collectionRef = collection(firestore, JOURNAL_COLLECTIONS.JOURNAL_TEMPLATES(userId));
    this.query = query(collectionRef, where('userId', '==', userId));
  }
  
  category(category: string): this {
    this.query = query(this.query, where('category', '==', category));
    return this;
  }
  
  isDefault(isDefault: boolean): this {
    this.query = query(this.query, where('isDefault', '==', isDefault));
    return this;
  }
  
  isPublic(isPublic: boolean): this {
    this.query = query(this.query, where('isPublic', '==', isPublic));
    return this;
  }
  
  orderByUsage(): this {
    this.query = query(this.query, orderBy('usageCount', 'desc'));
    return this;
  }
  
  orderByCreated(direction: 'asc' | 'desc' = 'desc'): this {
    this.query = query(this.query, orderBy('createdAt', direction));
    return this;
  }
  
  build(): Query {
    return this.query;
  }
}

// ===== MIGRATION UTILITIES =====

/**
 * Migration script for existing data
 */
export interface JournalMigrationScript {
  version: string;
  description: string;
  up: (firestore: Firestore, userId: string) => Promise<void>;
  down: (firestore: Firestore, userId: string) => Promise<void>;
}

/**
 * Example migration for adding new fields
 */
export const JOURNAL_MIGRATIONS: JournalMigrationScript[] = [
  {
    version: '1.0.0',
    description: 'Initial journal schema setup',
    up: async (firestore, userId) => {
      // Create default preferences document
      const preferencesRef = doc(
        collection(firestore, `users/${userId}/journalSettings`),
        'preferences'
      );
        
      await setDoc(preferencesRef, {
        defaultTemplateId: null,
        autoSaveInterval: 30,
        reminderEnabled: false,
        defaultPrivacy: 'private',
        allowMentorAccess: false,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        theme: 'auto',
        completionReminders: true,
        streakNotifications: true,
        insightNotifications: false,
        defaultExportFormat: 'pdf',
        includeImages: true,
        includeEmotionalData: false,
        updatedAt: Timestamp.now()
      });
    },
    down: async (firestore, userId) => {
      // Remove preferences document
      const preferencesRef = doc(
        collection(firestore, `users/${userId}/journalSettings`),
        'preferences'
      );
        
      await deleteDoc(preferencesRef);
    }
  }
];

// ===== ERROR HANDLING =====

/**
 * Firestore error codes specific to journal operations
 */
export const FIRESTORE_ERROR_CODES = {
  PERMISSION_DENIED: 'permission-denied',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  FAILED_PRECONDITION: 'failed-precondition',
  ABORTED: 'aborted',
  OUT_OF_RANGE: 'out-of-range',
  UNIMPLEMENTED: 'unimplemented',
  INTERNAL: 'internal',
  UNAVAILABLE: 'unavailable',
  DATA_LOSS: 'data-loss',
  UNAUTHENTICATED: 'unauthenticated'
} as const;

/**
 * Maps Firestore errors to user-friendly messages
 */
export function mapFirestoreError(error: any): string {
  switch (error.code) {
    case FIRESTORE_ERROR_CODES.PERMISSION_DENIED:
      return 'You do not have permission to access this journal entry.';
    case FIRESTORE_ERROR_CODES.NOT_FOUND:
      return 'The requested journal entry was not found.';
    case FIRESTORE_ERROR_CODES.ALREADY_EXISTS:
      return 'A journal entry for this date already exists.';
    case FIRESTORE_ERROR_CODES.RESOURCE_EXHAUSTED:
      return 'Too many requests. Please try again later.';
    case FIRESTORE_ERROR_CODES.UNAVAILABLE:
      return 'Journal service is temporarily unavailable. Please try again.';
    case FIRESTORE_ERROR_CODES.UNAUTHENTICATED:
      return 'Please sign in to access your journal.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
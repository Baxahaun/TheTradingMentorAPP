/**
 * Journal Data Service Tests
 * 
 * Comprehensive test suite for the JournalDataService class
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  JournalDataService, 
  createJournalDataService,
  validateJournalServiceInputs 
} from '../JournalDataService';
import { 
  JournalEntry, 
  CreateJournalEntryData,
  JournalSearchCriteria 
} from '../../types/journal';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date }))
  }
}));

// Mock utility functions
vi.mock('../../utils/journalValidation', () => ({
  validateJournalEntry: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
  calculateCompletionPercentage: vi.fn(() => 75),
  calculateWordCount: vi.fn(() => 150),
  isJournalEntryComplete: vi.fn(() => true)
}));

vi.mock('../../utils/journalUtils', () => ({
  createJournalEntryFromTemplate: vi.fn(() => ({
    userId: 'test-user',
    date: '2024-01-01',
    sections: [],
    tradeReferences: [],
    dailyTradeIds: [],
    emotionalState: {},
    processMetrics: {},
    dailyPnL: 0,
    tradeCount: 0,
    images: [],
    tags: [],
    isComplete: false,
    wordCount: 0,
    isPrivate: true,
    sharedWith: []
  })),
  updateJournalEntryWithTrades: vi.fn(),
  createJournalEntrySummary: vi.fn(),
  generateJournalCalendarData: vi.fn(() => []),
  calculateJournalCompletionStats: vi.fn(() => ({
    userId: 'test-user',
    totalEntries: 10,
    completedEntries: 8,
    partialEntries: 2,
    emptyEntries: 0,
    completionRate: 80,
    currentStreak: 5,
    longestStreak: 10,
    averageWordsPerEntry: 150,
    averageTimeSpent: 15,
    mostActiveDay: 'Monday',
    mostActiveTime: '09:00',
    mostUsedTags: [],
    mostUsedTemplates: [],
    emotionalTrends: [],
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    lastUpdated: new Date().toISOString()
  })),
  updateSectionCompletion: vi.fn((section) => section)
}));

vi.mock('../../lib/journalSchema', () => ({
  JOURNAL_COLLECTIONS: {
    JOURNAL_ENTRIES: (userId: string) => `users/${userId}/journalEntries`
  },
  journalEntryToFirestore: vi.fn((entry) => entry),
  firestoreToJournalEntry: vi.fn((id, doc) => ({ id, ...doc })),
  JournalEntryQueryBuilder: vi.fn().mockImplementation(() => ({
    dateRange: vi.fn().mockReturnThis(),
    completionStatus: vi.fn().mockReturnThis(),
    templateId: vi.fn().mockReturnThis(),
    orderByDate: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    build: vi.fn(() => ({}))
  })),
  mapFirestoreError: vi.fn((error) => error.message || 'Unknown error')
}));

describe('JournalDataService', () => {
  let service: JournalDataService;
  const mockUserId = 'test-user-123';
  const mockDate = '2024-01-01';

  beforeEach(() => {
    service = new JournalDataService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Constructor and Factory', () => {
    it('should create service with default config', () => {
      const defaultService = new JournalDataService();
      expect(defaultService).toBeInstanceOf(JournalDataService);
    });

    it('should create service with custom config', () => {
      const customService = new JournalDataService({
        enableOfflineSupport: false,
        autoSaveInterval: 60
      });
      expect(customService).toBeInstanceOf(JournalDataService);
    });

    it('should create service using factory function', () => {
      const factoryService = createJournalDataService();
      expect(factoryService).toBeInstanceOf(JournalDataService);
    });
  });

  describe('createJournalEntry', () => {
    it('should create a new journal entry successfully', async () => {
      // Mock Firestore operations
      const { getDoc, setDoc } = await import('firebase/firestore');
      (getDoc as Mock).mockResolvedValue({ exists: () => false });
      (setDoc as Mock).mockResolvedValue(undefined);

      const result = await service.createJournalEntry(mockUserId, mockDate);

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.date).toBe(mockDate);
      expect(result.id).toBe(`${mockUserId}_${mockDate}`);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should throw error if entry already exists', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as Mock).mockResolvedValue({ 
        exists: () => true,
        data: () => ({ userId: mockUserId, date: mockDate })
      });

      await expect(service.createJournalEntry(mockUserId, mockDate))
        .rejects.toThrow('Journal entry already exists');
    });

    it('should handle validation errors', async () => {
      const { getDoc } = await import('firebase/firestore');
      const { validateJournalEntry } = await import('../../utils/journalValidation');
      
      (getDoc as Mock).mockResolvedValue({ exists: () => false });
      (validateJournalEntry as Mock).mockReturnValue({
        isValid: false,
        errors: [{ message: 'Invalid data' }],
        warnings: []
      });

      await expect(service.createJournalEntry(mockUserId, mockDate))
        .rejects.toThrow('Validation failed: Invalid data');
    });
  });

  describe('getJournalEntry', () => {
    it('should retrieve existing journal entry', async () => {
      const mockEntry = {
        userId: mockUserId,
        date: mockDate,
        sections: []
      };

      const { getDoc } = await import('firebase/firestore');
      (getDoc as Mock).mockResolvedValue({
        exists: () => true,
        id: `${mockUserId}_${mockDate}`,
        data: () => mockEntry
      });

      const result = await service.getJournalEntry(mockUserId, mockDate);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(mockUserId);
      expect(result?.date).toBe(mockDate);
    });

    it('should return null for non-existent entry', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as Mock).mockResolvedValue({ exists: () => false });

      const result = await service.getJournalEntry(mockUserId, mockDate);

      expect(result).toBeNull();
    });

    it('should handle Firestore errors', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(service.getJournalEntry(mockUserId, mockDate))
        .rejects.toThrow();
    });
  });

  describe('updateJournalEntry', () => {
    it('should update journal entry successfully', async () => {
      const mockEntry = {
        id: `${mockUserId}_${mockDate}`,
        userId: mockUserId,
        date: mockDate,
        sections: [],
        completionPercentage: 50,
        wordCount: 100,
        isComplete: false
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      (getDoc as Mock).mockResolvedValue({
        exists: () => true,
        id: mockEntry.id,
        data: () => mockEntry
      });
      (updateDoc as Mock).mockResolvedValue(undefined);

      const updates = { tags: ['updated'] };
      await service.updateJournalEntry(mockUserId, mockEntry.id, updates);

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error for non-existent entry', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as Mock).mockResolvedValue({ exists: () => false });

      await expect(service.updateJournalEntry(mockUserId, 'non-existent', {}))
        .rejects.toThrow('Journal entry not found');
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete journal entry successfully', async () => {
      const { deleteDoc } = await import('firebase/firestore');
      (deleteDoc as Mock).mockResolvedValue(undefined);

      await service.deleteJournalEntry(mockUserId, `${mockUserId}_${mockDate}`);

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should get journal entries for month', async () => {
      const { getDocs } = await import('firebase/firestore');
      (getDocs as Mock).mockResolvedValue({
        forEach: vi.fn((callback) => {
          callback({
            id: `${mockUserId}_${mockDate}`,
            data: () => ({ userId: mockUserId, date: mockDate })
          });
        })
      });

      const result = await service.getJournalEntriesForMonth(mockUserId, 2024, 1);

      expect(result).toBeInstanceOf(Array);
      expect(getDocs).toHaveBeenCalled();
    });

    it('should get journal entries for date range', async () => {
      const { getDocs } = await import('firebase/firestore');
      (getDocs as Mock).mockResolvedValue({
        forEach: vi.fn((callback) => {
          callback({
            id: `${mockUserId}_${mockDate}`,
            data: () => ({ userId: mockUserId, date: mockDate })
          });
        })
      });

      const result = await service.getJournalEntriesForDateRange(
        mockUserId, 
        '2024-01-01', 
        '2024-01-31'
      );

      expect(result).toBeInstanceOf(Array);
    });

    it('should get journal calendar data', async () => {
      const { getDocs } = await import('firebase/firestore');
      (getDocs as Mock).mockResolvedValue({
        forEach: vi.fn()
      });

      const result = await service.getJournalCalendarData(mockUserId, 2024, 1);

      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('Analytics', () => {
    it('should calculate journaling streak', async () => {
      const { getDocs } = await import('firebase/firestore');
      (getDocs as Mock).mockResolvedValue({
        forEach: vi.fn((callback) => {
          // Mock some completed entries
          const today = new Date().toISOString().split('T')[0];
          callback({
            id: `${mockUserId}_${today}`,
            data: () => ({ 
              userId: mockUserId, 
              date: today, 
              isComplete: true 
            })
          });
        })
      });

      const streak = await service.getJournalingStreak(mockUserId);

      expect(typeof streak).toBe('number');
      expect(streak).toBeGreaterThanOrEqual(0);
    });

    it('should get completion stats', async () => {
      const { getDocs } = await import('firebase/firestore');
      (getDocs as Mock).mockResolvedValue({
        forEach: vi.fn()
      });

      const stats = await service.getCompletionStats(mockUserId);

      expect(stats).toBeDefined();
      expect(stats.userId).toBe(mockUserId);
      expect(typeof stats.completionRate).toBe('number');
    });
  });

  describe('Search', () => {
    it('should search journal entries with criteria', async () => {
      const { getDocs } = await import('firebase/firestore');
      (getDocs as Mock).mockResolvedValue({
        forEach: vi.fn((callback) => {
          callback({
            id: `${mockUserId}_${mockDate}`,
            data: () => ({ 
              userId: mockUserId, 
              date: mockDate,
              sections: [{ type: 'text', content: 'test content' }],
              tags: ['test']
            })
          });
        })
      });

      const criteria: JournalSearchCriteria = {
        query: 'test',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const result = await service.searchJournalEntries(mockUserId, criteria);

      expect(result.entries).toBeInstanceOf(Array);
      expect(typeof result.totalCount).toBe('number');
      expect(typeof result.searchTime).toBe('number');
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to journal entry updates', () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockUnsubscribe = vi.fn();
      (onSnapshot as Mock).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = service.subscribeToJournalEntry(mockUserId, mockDate, callback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should subscribe to journal calendar updates', () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockUnsubscribe = vi.fn();
      (onSnapshot as Mock).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = service.subscribeToJournalCalendar(mockUserId, callback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Offline Support', () => {
    it('should handle offline operations', async () => {
      const offlineService = new JournalDataService({ enableOfflineSupport: true });
      
      // Mock network error
      const { updateDoc } = await import('firebase/firestore');
      (updateDoc as Mock).mockRejectedValue({ code: 'unavailable' });

      // This should not throw but queue the operation
      await offlineService.updateJournalEntry(mockUserId, 'test-id', { tags: ['test'] });

      // Process offline queue
      await offlineService.processOfflineQueue();
    });
  });

  describe('Validation', () => {
    it('should validate service inputs correctly', () => {
      const validResult = validateJournalServiceInputs('valid-user', '2024-01-01');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateJournalServiceInputs('', 'invalid-date');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup subscriptions', () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockUnsubscribe = vi.fn();
      (onSnapshot as Mock).mockReturnValue(mockUnsubscribe);

      // Create some subscriptions
      service.subscribeToJournalEntry(mockUserId, mockDate, vi.fn());
      service.subscribeToJournalCalendar(mockUserId, vi.fn());

      // Cleanup
      service.cleanup();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    });
  });
});
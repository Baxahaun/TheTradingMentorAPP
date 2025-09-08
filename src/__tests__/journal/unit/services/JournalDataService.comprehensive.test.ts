/**
 * Comprehensive Journal Data Service Tests
 * 
 * Complete test suite covering all JournalDataService functionality
 * including CRUD operations, real-time subscriptions, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { JournalDataService } from '../../../../services/JournalDataService';
import { 
  mockUserId, 
  mockDate, 
  mockJournalEntry, 
  mockIncompleteJournalEntry,
  mockLargeJournalEntry,
  mockFirebaseResponses,
  mockErrorResponses,
  createMockJournalEntry
} from '../../mocks/journalTestData';

// Mock Firebase
vi.mock('../../../../lib/firebase', () => ({
  db: {}
}));

// Mock Firestore functions
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date }))
  }
}));

describe('JournalDataService - Comprehensive Tests', () => {
  let service: JournalDataService;

  beforeEach(() => {
    service = new JournalDataService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('CRUD Operations', () => {
    describe('createJournalEntry', () => {
      it('should create a new journal entry with template', async () => {
        mockSetDoc.mockResolvedValue(undefined);
        
        const result = await service.createJournalEntry(mockUserId, mockDate, 'template-id');
        
        expect(mockSetDoc).toHaveBeenCalled();
        expect(result.userId).toBe(mockUserId);
        expect(result.date).toBe(mockDate);
        expect(result.templateId).toBe('template-id');
        expect(result.isComplete).toBe(false);
      });

      it('should create entry without template', async () => {
        mockSetDoc.mockResolvedValue(undefined);
        
        const result = await service.createJournalEntry(mockUserId, mockDate);
        
        expect(result.templateId).toBeUndefined();
        expect(result.sections).toEqual([]);
      });

      it('should handle creation errors gracefully', async () => {
        mockSetDoc.mockRejectedValue(mockErrorResponses.networkError);
        
        await expect(service.createJournalEntry(mockUserId, mockDate))
          .rejects.toThrow('Network request failed');
      });

      it('should validate input parameters', async () => {
        await expect(service.createJournalEntry('', mockDate))
          .rejects.toThrow('User ID is required');
        
        await expect(service.createJournalEntry(mockUserId, ''))
          .rejects.toThrow('Date is required');
        
        await expect(service.createJournalEntry(mockUserId, 'invalid-date'))
          .rejects.toThrow('Invalid date format');
      });
    });

    describe('getJournalEntry', () => {
      it('should retrieve existing journal entry', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => mockJournalEntry
        });
        
        const result = await service.getJournalEntry(mockUserId, mockDate);
        
        expect(result).toEqual(mockJournalEntry);
        expect(mockGetDoc).toHaveBeenCalled();
      });

      it('should return null for non-existent entry', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => false
        });
        
        const result = await service.getJournalEntry(mockUserId, 'non-existent-date');
        
        expect(result).toBeNull();
      });

      it('should handle retrieval errors', async () => {
        mockGetDoc.mockRejectedValue(mockErrorResponses.authError);
        
        await expect(service.getJournalEntry(mockUserId, mockDate))
          .rejects.toThrow('Authentication required');
      });
    });

    describe('updateJournalEntry', () => {
      it('should update journal entry successfully', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);
        
        const updates = { 
          preMarketNotes: 'Updated notes',
          updatedAt: new Date().toISOString()
        };
        
        await service.updateJournalEntry(mockUserId, 'entry-id', updates);
        
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining(updates)
        );
      });

      it('should validate update data', async () => {
        const invalidUpdates = { invalidField: 'value' };
        
        await expect(service.updateJournalEntry(mockUserId, 'entry-id', invalidUpdates))
          .rejects.toThrow('Invalid update fields');
      });

      it('should handle concurrent updates', async () => {
        mockUpdateDoc.mockRejectedValue(new Error('Document was modified'));
        
        await expect(service.updateJournalEntry(mockUserId, 'entry-id', {}))
          .rejects.toThrow('Document was modified');
      });
    });

    describe('deleteJournalEntry', () => {
      it('should delete journal entry successfully', async () => {
        mockDeleteDoc.mockResolvedValue(undefined);
        
        await service.deleteJournalEntry(mockUserId, 'entry-id');
        
        expect(mockDeleteDoc).toHaveBeenCalled();
      });

      it('should handle deletion of non-existent entry', async () => {
        mockDeleteDoc.mockRejectedValue(new Error('Document not found'));
        
        await expect(service.deleteJournalEntry(mockUserId, 'non-existent'))
          .rejects.toThrow('Document not found');
      });
    });
  });

  describe('Batch Operations', () => {
    describe('getJournalEntriesForMonth', () => {
      it('should retrieve all entries for a month', async () => {
        const mockEntries = [
          createMockJournalEntry({ date: '2024-01-01' }),
          createMockJournalEntry({ date: '2024-01-15' }),
          createMockJournalEntry({ date: '2024-01-31' })
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockEntries.map(entry => ({
            data: () => entry
          }))
        });
        
        const result = await service.getJournalEntriesForMonth(mockUserId, 2024, 1);
        
        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2024-01-01');
        expect(result[2].date).toBe('2024-01-31');
      });

      it('should handle empty month', async () => {
        mockGetDocs.mockResolvedValue({ docs: [] });
        
        const result = await service.getJournalEntriesForMonth(mockUserId, 2024, 2);
        
        expect(result).toEqual([]);
      });

      it('should validate month parameters', async () => {
        await expect(service.getJournalEntriesForMonth(mockUserId, 2024, 0))
          .rejects.toThrow('Invalid month');
        
        await expect(service.getJournalEntriesForMonth(mockUserId, 2024, 13))
          .rejects.toThrow('Invalid month');
      });
    });

    describe('getJournalEntriesForDateRange', () => {
      it('should retrieve entries within date range', async () => {
        const mockEntries = [
          createMockJournalEntry({ date: '2024-01-10' }),
          createMockJournalEntry({ date: '2024-01-15' }),
          createMockJournalEntry({ date: '2024-01-20' })
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockEntries.map(entry => ({
            data: () => entry
          }))
        });
        
        const result = await service.getJournalEntriesForDateRange(
          mockUserId, 
          '2024-01-10', 
          '2024-01-20'
        );
        
        expect(result).toHaveLength(3);
        expect(mockQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything()
        );
      });

      it('should validate date range', async () => {
        await expect(service.getJournalEntriesForDateRange(
          mockUserId, 
          '2024-01-20', 
          '2024-01-10'
        )).rejects.toThrow('Start date must be before end date');
      });
    });
  });

  describe('Analytics and Insights', () => {
    describe('getJournalingStreak', () => {
      it('should calculate current journaling streak', async () => {
        const mockEntries = Array.from({ length: 7 }, (_, i) => 
          createMockJournalEntry({ 
            date: `2024-01-${String(15 + i).padStart(2, '0')}`,
            isComplete: true
          })
        );
        
        mockGetDocs.mockResolvedValue({
          docs: mockEntries.map(entry => ({
            data: () => entry
          }))
        });
        
        const streak = await service.getJournalingStreak(mockUserId);
        
        expect(streak).toBe(7);
      });

      it('should handle broken streak', async () => {
        const mockEntries = [
          createMockJournalEntry({ date: '2024-01-15', isComplete: true }),
          createMockJournalEntry({ date: '2024-01-17', isComplete: true }) // Gap on 16th
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockEntries.map(entry => ({
            data: () => entry
          }))
        });
        
        const streak = await service.getJournalingStreak(mockUserId);
        
        expect(streak).toBe(1); // Only current day counts
      });
    });

    describe('getCompletionStats', () => {
      it('should calculate completion statistics', async () => {
        const mockEntries = [
          createMockJournalEntry({ isComplete: true }),
          createMockJournalEntry({ isComplete: true }),
          createMockJournalEntry({ isComplete: false })
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockEntries.map(entry => ({
            data: () => entry
          }))
        });
        
        const stats = await service.getCompletionStats(mockUserId);
        
        expect(stats.totalEntries).toBe(3);
        expect(stats.completedEntries).toBe(2);
        expect(stats.completionRate).toBe(66.67);
      });
    });

    describe('searchJournalEntries', () => {
      it('should search entries by text content', async () => {
        const mockEntries = [
          createMockJournalEntry({ 
            preMarketNotes: 'EUR/USD bullish setup',
            tags: ['EUR/USD', 'bullish']
          })
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockEntries.map(entry => ({
            data: () => entry
          }))
        });
        
        const results = await service.searchJournalEntries(mockUserId, 'EUR/USD');
        
        expect(results).toHaveLength(1);
        expect(results[0].preMarketNotes).toContain('EUR/USD');
      });

      it('should search by tags', async () => {
        const mockEntries = [
          createMockJournalEntry({ tags: ['trend-following', 'profitable'] })
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockEntries.map(entry => ({
            data: () => entry
          }))
        });
        
        const results = await service.searchJournalEntries(mockUserId, 'trend-following');
        
        expect(results).toHaveLength(1);
        expect(results[0].tags).toContain('trend-following');
      });
    });
  });

  describe('Real-time Subscriptions', () => {
    describe('subscribeToJournalEntry', () => {
      it('should set up real-time subscription', () => {
        const callback = vi.fn();
        const unsubscribe = vi.fn();
        
        mockOnSnapshot.mockReturnValue(unsubscribe);
        
        const unsubscribeFunc = service.subscribeToJournalEntry(mockUserId, mockDate, callback);
        
        expect(mockOnSnapshot).toHaveBeenCalled();
        expect(typeof unsubscribeFunc).toBe('function');
      });

      it('should handle subscription updates', () => {
        const callback = vi.fn();
        let snapshotCallback: Function;
        
        mockOnSnapshot.mockImplementation((ref, cb) => {
          snapshotCallback = cb;
          return vi.fn();
        });
        
        service.subscribeToJournalEntry(mockUserId, mockDate, callback);
        
        // Simulate snapshot update
        snapshotCallback({
          exists: () => true,
          data: () => mockJournalEntry
        });
        
        expect(callback).toHaveBeenCalledWith(mockJournalEntry);
      });

      it('should handle subscription errors', () => {
        const callback = vi.fn();
        const errorCallback = vi.fn();
        
        mockOnSnapshot.mockImplementation((ref, cb, errorCb) => {
          errorCb(mockErrorResponses.networkError);
          return vi.fn();
        });
        
        service.subscribeToJournalEntry(mockUserId, mockDate, callback, errorCallback);
        
        expect(errorCallback).toHaveBeenCalledWith(mockErrorResponses.networkError);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large journal entries efficiently', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      
      const startTime = performance.now();
      await service.createJournalEntry(mockUserId, mockDate);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it('should handle concurrent operations', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        service.updateJournalEntry(mockUserId, 'entry-id', { 
          preMarketNotes: `Update ${i}` 
        })
      );
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should validate data integrity', async () => {
      const invalidEntry = {
        ...mockJournalEntry,
        date: 'invalid-date',
        userId: null
      };
      
      mockSetDoc.mockResolvedValue(undefined);
      
      await expect(service.createJournalEntry('', 'invalid-date'))
        .rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      mockGetDoc.mockRejectedValue(timeoutError);
      
      await expect(service.getJournalEntry(mockUserId, mockDate))
        .rejects.toThrow('Request timeout');
    });
  });

  describe('Data Validation', () => {
    it('should validate journal entry structure', async () => {
      const invalidEntry = {
        invalidField: 'value',
        missingRequiredField: undefined
      };
      
      await expect(service.updateJournalEntry(mockUserId, 'entry-id', invalidEntry))
        .rejects.toThrow('Invalid update fields');
    });

    it('should sanitize input data', async () => {
      const maliciousInput = {
        preMarketNotes: '<script>alert("xss")</script>Normal content'
      };
      
      mockUpdateDoc.mockResolvedValue(undefined);
      
      await service.updateJournalEntry(mockUserId, 'entry-id', maliciousInput);
      
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          preMarketNotes: expect.not.stringContaining('<script>')
        })
      );
    });
  });
});
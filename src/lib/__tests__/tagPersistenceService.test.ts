import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TagPersistenceService, tagPersistenceService } from '../tagPersistenceService';
import { tagService } from '../tagService';
import { Trade } from '../../types/trade';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}
}));

// Create mock functions
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockOnSnapshot = vi.fn();
const mockWriteBatch = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
  writeBatch: mockWriteBatch,
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
  }
}));

// Mock trade service
vi.mock('../firebaseService', () => ({
  tradeService: {
    getTrades: vi.fn(),
    updateTrade: vi.fn()
  }
}));

// Mock trade data for testing
const createMockTrade = (
  id: string, 
  tags: string[] = [], 
  pnl: number = 0, 
  status: 'open' | 'closed' = 'closed', 
  date: string = '2024-01-01'
): Trade => ({
  id,
  accountId: 'test-account',
  tags,
  currencyPair: 'EUR/USD',
  date,
  timeIn: '09:00',
  side: 'long',
  entryPrice: 1.1000,
  lotSize: 1,
  lotType: 'standard',
  units: 100000,
  commission: 0,
  accountCurrency: 'USD',
  status,
  pnl
});

describe('TagPersistenceService', () => {
  let service: TagPersistenceService;
  const userId = 'test-user-123';

  beforeEach(() => {
    service = TagPersistenceService.getInstance();
    vi.clearAllMocks();
    
    // Reset tag service
    tagService.resetIndex();
    
    // Setup default mock returns
    mockDoc.mockReturnValue({ id: 'mock-doc' });
    mockCollection.mockReturnValue({ id: 'mock-collection' });
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null
    });
    mockWriteBatch.mockReturnValue({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined)
    });
  });

  afterEach(() => {
    service.clearCachedTagIndex(userId);
  });

  describe('buildAndPersistTagIndex', () => {
    it('should build and persist tag index from trades', async () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend'], 100),
        createMockTrade('2', ['#breakout', '#scalp'], -50),
        createMockTrade('3', ['#trend'], 75)
      ];

      await service.buildAndPersistTagIndex(userId, trades);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          index: expect.any(Object),
          lastUpdated: expect.any(Object),
          totalTrades: 3,
          totalTags: 3,
          version: '1.0'
        }),
        { merge: false }
      );
    });

    it('should handle empty trades array', async () => {
      await service.buildAndPersistTagIndex(userId, []);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalTrades: 0,
          totalTags: 0
        }),
        { merge: false }
      );
    });

    it('should force rebuild when specified', async () => {
      const trades = [createMockTrade('1', ['#test'])];

      await service.buildAndPersistTagIndex(userId, trades, true);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { merge: false }
      );
    });

    it('should handle Firebase errors gracefully', async () => {
      const trades = [createMockTrade('1', ['#test'])];
      mockSetDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(service.buildAndPersistTagIndex(userId, trades))
        .rejects.toThrow('Firebase error');
    });
  });

  describe('loadTagIndex', () => {
    it('should load existing tag index', async () => {
      const mockIndex = {
        '#breakout': {
          count: 2,
          tradeIds: ['1', '2'],
          lastUsed: '2024-01-01',
          performance: {
            tag: '#breakout',
            totalTrades: 2,
            winRate: 50,
            averagePnL: 25,
            profitFactor: 2
          }
        }
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ index: mockIndex })
      });

      const result = await service.loadTagIndex(userId);

      expect(result).toEqual(mockIndex);
      expect(service.getCachedTagIndex(userId)).toEqual(mockIndex);
    });

    it('should return null when no index exists', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      const result = await service.loadTagIndex(userId);

      expect(result).toBeNull();
    });

    it('should handle Firebase errors', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(service.loadTagIndex(userId))
        .rejects.toThrow('Firebase error');
    });
  });

  describe('incrementalTagIndexUpdate', () => {
    it('should perform incremental update for modified trades', async () => {
      const allTrades = [
        createMockTrade('1', ['#breakout'], 100),
        createMockTrade('2', ['#trend'], -50),
        createMockTrade('3', ['#scalp'], 75)
      ];

      // Mock existing index
      const existingIndex = {
        '#breakout': {
          count: 1,
          tradeIds: ['1'],
          lastUsed: '2024-01-01',
          performance: {
            tag: '#breakout',
            totalTrades: 1,
            winRate: 100,
            averagePnL: 100,
            profitFactor: Infinity
          }
        }
      };

      service['tagIndexCache'][userId] = existingIndex;

      await service.incrementalTagIndexUpdate(userId, allTrades, ['2', '3']);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          index: expect.objectContaining({
            '#breakout': expect.any(Object),
            '#trend': expect.any(Object),
            '#scalp': expect.any(Object)
          }),
          totalTrades: 3,
          totalTags: 3
        }),
        { merge: true }
      );
    });

    it('should build from scratch if no existing index', async () => {
      const trades = [createMockTrade('1', ['#test'])];
      
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      await service.incrementalTagIndexUpdate(userId, trades, ['1']);

      // Should call setDoc twice: once for full build, once for incremental
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
    });

    it('should handle errors and fallback to full rebuild', async () => {
      const trades = [createMockTrade('1', ['#test'])];
      
      // Mock an error in incremental update
      service['tagIndexCache'][userId] = null as any;
      mockGetDoc.mockRejectedValue(new Error('Load error'));

      await service.incrementalTagIndexUpdate(userId, trades, ['1']);

      // Should fallback to full rebuild
      expect(mockSetDoc).toHaveBeenCalled();
    });
  });

  describe('cleanupOrphanedTags', () => {
    it('should remove orphaned tags from index', async () => {
      const currentTrades = [
        createMockTrade('1', ['#breakout'])
      ];

      // Mock index with orphaned tag
      const indexWithOrphans = {
        '#breakout': {
          count: 1,
          tradeIds: ['1'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        },
        '#orphaned': {
          count: 1,
          tradeIds: ['deleted-trade'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        }
      };

      service['tagIndexCache'][userId] = indexWithOrphans;

      const removedTags = await service.cleanupOrphanedTags(userId, currentTrades);

      expect(removedTags).toEqual(['#orphaned']);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          index: expect.not.objectContaining({
            '#orphaned': expect.anything()
          }),
          totalTags: 1
        }),
        { merge: true }
      );
    });

    it('should return empty array when no orphaned tags', async () => {
      const trades = [createMockTrade('1', ['#breakout'])];
      
      const validIndex = {
        '#breakout': {
          count: 1,
          tradeIds: ['1'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        }
      };

      service['tagIndexCache'][userId] = validIndex;

      const removedTags = await service.cleanupOrphanedTags(userId, trades);

      expect(removedTags).toEqual([]);
    });

    it('should load index if not cached', async () => {
      const trades = [createMockTrade('1', ['#test'])];
      
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          index: {
            '#test': {
              count: 1,
              tradeIds: ['1'],
              lastUsed: '2024-01-01',
              performance: expect.any(Object)
            }
          }
        })
      });

      await service.cleanupOrphanedTags(userId, trades);

      expect(mockGetDoc).toHaveBeenCalled();
    });
  });

  describe('validateTagIndexIntegrity', () => {
    it('should validate index integrity against trades', async () => {
      const trades = [
        createMockTrade('1', ['#breakout'], 100),
        createMockTrade('2', ['#trend'], -50)
      ];

      // Mock a valid index
      const validIndex = {
        '#breakout': {
          count: 1,
          tradeIds: ['1'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        },
        '#trend': {
          count: 1,
          tradeIds: ['2'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        }
      };

      service['tagIndexCache'][userId] = validIndex;

      const result = await service.validateTagIndexIntegrity(userId, trades);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.recommendations).toContain('Tag index is healthy and up to date');
    });

    it('should detect missing tags in index', async () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend'])
      ];

      // Mock incomplete index
      const incompleteIndex = {
        '#breakout': {
          count: 1,
          tradeIds: ['1'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        }
        // Missing #trend
      };

      service['tagIndexCache'][userId] = incompleteIndex;

      const result = await service.validateTagIndexIntegrity(userId, trades);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Tag missing from index: #trend'))).toBe(true);
      expect(result.recommendations).toContain('Rebuild tag index to fix integrity issues');
    });

    it('should detect orphaned tags in index', async () => {
      const trades = [
        createMockTrade('1', ['#breakout'])
      ];

      // Mock index with orphaned tag
      const indexWithOrphans = {
        '#breakout': {
          count: 1,
          tradeIds: ['1'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        },
        '#orphaned': {
          count: 1,
          tradeIds: ['deleted-trade'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        }
      };

      service['tagIndexCache'][userId] = indexWithOrphans;

      const result = await service.validateTagIndexIntegrity(userId, trades);

      expect(result.isValid).toBe(true); // Orphaned tags are warnings, not errors
      expect(result.warnings.some(warning => warning.includes('Orphaned tag in index: #orphaned'))).toBe(true);
      expect(result.recommendations).toContain('Run tag cleanup to remove orphaned entries');
    });

    it('should detect count mismatches', async () => {
      const trades = [
        createMockTrade('1', ['#breakout']),
        createMockTrade('2', ['#breakout'])
      ];

      // Mock index with wrong count
      const incorrectIndex = {
        '#breakout': {
          count: 1, // Should be 2
          tradeIds: ['1', '2'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        }
      };

      service['tagIndexCache'][userId] = incorrectIndex;

      const result = await service.validateTagIndexIntegrity(userId, trades);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Tag count mismatch for #breakout'))).toBe(true);
    });

    it('should handle missing index', async () => {
      const trades = [createMockTrade('1', ['#test'])];
      
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      const result = await service.validateTagIndexIntegrity(userId, trades);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No tag index found');
    });
  });

  describe('subscribeToTagIndex', () => {
    it('should set up real-time subscription', () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();
      
      mockOnSnapshot.mockReturnValue(unsubscribe);

      const result = service.subscribeToTagIndex(userId, callback);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });

    it('should handle subscription updates', () => {
      const callback = vi.fn();
      const mockIndex = { '#test': expect.any(Object) };
      
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        // Simulate a document update
        onNext({
          exists: () => true,
          data: () => ({ index: mockIndex })
        });
        return vi.fn();
      });

      service.subscribeToTagIndex(userId, callback);

      expect(callback).toHaveBeenCalledWith(mockIndex);
    });

    it('should handle subscription errors', () => {
      const callback = vi.fn();
      
      mockOnSnapshot.mockImplementation((ref, onNext, onError) => {
        // Simulate an error
        onError(new Error('Subscription error'));
        return vi.fn();
      });

      service.subscribeToTagIndex(userId, callback);

      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('exportTagPersistenceData', () => {
    it('should export tag persistence data', async () => {
      const mockIndex = {
        '#test': {
          count: 1,
          tradeIds: ['1'],
          lastUsed: '2024-01-01',
          performance: expect.any(Object)
        }
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ index: mockIndex })
      });

      const result = await service.exportTagPersistenceData(userId);

      expect(result).toEqual({
        tagIndex: mockIndex,
        exportDate: expect.any(String),
        version: '1.0'
      });
    });

    it('should handle export when no index exists', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      const result = await service.exportTagPersistenceData(userId);

      expect(result.tagIndex).toBeNull();
    });
  });

  describe('importTagPersistenceData', () => {
    it('should import valid tag persistence data', async () => {
      const importData = {
        tagIndex: {
          '#imported': {
            count: 1,
            tradeIds: ['1'],
            lastUsed: '2024-01-01',
            performance: expect.any(Object)
          }
        },
        version: '1.0'
      };

      const result = await service.importTagPersistenceData(userId, importData);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should reject invalid import data', async () => {
      const result = await service.importTagPersistenceData(userId, null);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(false);
      expect(result.errors).toContain('Invalid import data format');
    });

    it('should validate tag index structure', async () => {
      const invalidData = {
        tagIndex: {
          '#invalid': {
            // Missing required fields
          }
        }
      };

      const result = await service.importTagPersistenceData(userId, invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid tag data structure'))).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache loaded tag index', async () => {
      const mockIndex = { '#test': expect.any(Object) };
      
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ index: mockIndex })
      });

      await service.loadTagIndex(userId);
      const cached = service.getCachedTagIndex(userId);

      expect(cached).toEqual(mockIndex);
    });

    it('should clear cached index', () => {
      service['tagIndexCache'][userId] = { '#test': expect.any(Object) };
      
      service.clearCachedTagIndex(userId);
      
      expect(service.getCachedTagIndex(userId)).toBeNull();
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TagPersistenceService.getInstance();
      const instance2 = TagPersistenceService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
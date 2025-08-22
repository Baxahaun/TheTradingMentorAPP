import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { tagService } from '../tagService';
import { tagPersistenceService } from '../tagPersistenceService';
import { tagMigrationService } from '../tagMigrationService';
import { Trade } from '../../types/trade';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}
}));

// Mock Firestore functions
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockOnSnapshot = vi.fn();
const mockWriteBatch = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockTimestamp = {
  now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
};

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
  writeBatch: mockWriteBatch,
  Timestamp: mockTimestamp
}));

// Mock trade service
const mockTradeService = {
  getTrades: vi.fn(),
  updateTrade: vi.fn()
};

vi.mock('../firebaseService', () => ({
  tradeService: mockTradeService
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

describe('Tag Persistence Integration Tests', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    tagService.resetIndex();
    tagPersistenceService.clearCachedTagIndex(userId);
    
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
    mockTradeService.getTrades.mockResolvedValue([]);
    mockTradeService.updateTrade.mockResolvedValue(undefined);
  });

  afterEach(() => {
    tagPersistenceService.clearCachedTagIndex(userId);
  });

  describe('End-to-End Tag System Workflow', () => {
    it('should handle complete tag lifecycle from migration to indexing', async () => {
      // Step 1: Start with untagged trades
      const originalTrades = [
        createMockTrade('1', undefined, 100),
        createMockTrade('2', [], -50),
        createMockTrade('3', ['invalid-tag', '#valid'], 75)
      ];

      // Step 2: Analyze migration needs
      const analysis = tagMigrationService.analyzeMigrationNeeds(originalTrades);
      expect(analysis.tradesNeedingMigration).toBe(3);
      expect(analysis.tradesWithInvalidTags).toBe(1);

      // Step 3: Create backup before migration
      const backup = await tagMigrationService.createMigrationBackup(userId, originalTrades);
      expect(backup.totalTrades).toBe(3);

      // Step 4: Perform migration
      const migrationResult = await tagMigrationService.migrateTradesForTagging(
        userId, 
        originalTrades,
        { defaultTags: ['#migrated'] }
      );
      expect(migrationResult.migratedTrades).toBe(3);
      expect(migrationResult.errors).toHaveLength(0);

      // Step 5: Mock the updated trades after migration
      const migratedTrades = [
        createMockTrade('1', ['#migrated'], 100),
        createMockTrade('2', ['#migrated'], -50),
        createMockTrade('3', ['#valid'], 75) // Invalid tag removed
      ];
      mockTradeService.getTrades.mockResolvedValue(migratedTrades);

      // Step 6: Build and persist tag index
      await tagPersistenceService.buildAndPersistTagIndex(userId, migratedTrades);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalTrades: 3,
          totalTags: 2 // #migrated and #valid
        }),
        expect.anything()
      );

      // Step 7: Validate index integrity
      const validation = await tagPersistenceService.validateTagIndexIntegrity(userId, migratedTrades);
      expect(validation.isValid).toBe(true);

      // Step 8: Test incremental updates
      const updatedTrades = [
        ...migratedTrades,
        createMockTrade('4', ['#new', '#breakout'], 200)
      ];
      mockTradeService.getTrades.mockResolvedValue(updatedTrades);

      await tagPersistenceService.incrementalTagIndexUpdate(userId, updatedTrades, ['4']);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalTrades: 4,
          totalTags: 4 // #migrated, #valid, #new, #breakout
        }),
        { merge: true }
      );
    });

    it('should handle tag cleanup and orphan removal', async () => {
      // Setup initial trades with tags
      const initialTrades = [
        createMockTrade('1', ['#keep', '#remove']),
        createMockTrade('2', ['#keep', '#orphan']),
        createMockTrade('3', ['#remove'])
      ];

      // Build initial index
      await tagPersistenceService.buildAndPersistTagIndex(userId, initialTrades);

      // Simulate trades being updated (some tags removed)
      const updatedTrades = [
        createMockTrade('1', ['#keep']),
        createMockTrade('2', ['#keep']),
        createMockTrade('3', ['#new'])
      ];

      // Clean up orphaned tags
      const removedTags = await tagPersistenceService.cleanupOrphanedTags(userId, updatedTrades);
      expect(removedTags).toContain('#remove');
      expect(removedTags).toContain('#orphan');
      expect(removedTags).not.toContain('#keep');
      expect(removedTags).not.toContain('#new');
    });

    it('should maintain data consistency across service boundaries', async () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend'], 100),
        createMockTrade('2', ['#breakout', '#scalp'], -50),
        createMockTrade('3', ['#trend', '#swing'], 75)
      ];

      // Build index using tag service
      tagService.buildTagIndex(trades);
      const serviceAnalytics = tagService.getTagAnalytics(trades);

      // Build index using persistence service
      await tagPersistenceService.buildAndPersistTagIndex(userId, trades);

      // Validate that both services produce consistent results
      expect(serviceAnalytics.totalTags).toBe(4); // #breakout, #trend, #scalp, #swing
      expect(serviceAnalytics.mostUsedTags[0].count).toBe(2); // #breakout and #trend both used twice

      // Verify tag performance calculations are consistent
      const breakoutPerformance = tagService.calculateTagPerformance('#breakout', trades);
      expect(breakoutPerformance.totalTrades).toBe(2);
      expect(breakoutPerformance.winRate).toBe(50); // 1 win, 1 loss
      expect(breakoutPerformance.averagePnL).toBe(25); // (100 - 50) / 2
    });

    it('should handle concurrent tag operations safely', async () => {
      const trades = [
        createMockTrade('1', ['#concurrent']),
        createMockTrade('2', ['#test'])
      ];

      // Simulate concurrent operations
      const operations = [
        tagPersistenceService.buildAndPersistTagIndex(userId, trades),
        tagPersistenceService.incrementalTagIndexUpdate(userId, trades, ['1']),
        tagPersistenceService.cleanupOrphanedTags(userId, trades)
      ];

      // All operations should complete without errors
      await Promise.all(operations);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should recover from partial failures gracefully', async () => {
      const trades = [
        createMockTrade('1', ['#test']),
        createMockTrade('2', ['#recovery'])
      ];

      // Simulate Firebase failure on first attempt
      mockSetDoc.mockRejectedValueOnce(new Error('Firebase error'));
      mockSetDoc.mockResolvedValue(undefined);

      // First attempt should fail
      await expect(
        tagPersistenceService.buildAndPersistTagIndex(userId, trades)
      ).rejects.toThrow('Firebase error');

      // Second attempt should succeed
      await expect(
        tagPersistenceService.buildAndPersistTagIndex(userId, trades)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      // Create a large dataset
      const largeTrades = Array.from({ length: 1000 }, (_, i) => 
        createMockTrade(`trade-${i}`, [`#tag${i % 10}`, `#category${i % 5}`], Math.random() * 200 - 100)
      );

      const startTime = Date.now();

      // Build index for large dataset
      await tagPersistenceService.buildAndPersistTagIndex(userId, largeTrades);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should batch migration operations efficiently', async () => {
      const manyTrades = Array.from({ length: 200 }, (_, i) => 
        createMockTrade(`${i}`)
      );

      const result = await tagMigrationService.migrateTradesForTagging(
        userId, 
        manyTrades,
        { batchSize: 50 }
      );

      expect(result.totalTrades).toBe(200);
      expect(result.migratedTrades).toBe(200);
      expect(result.errors).toHaveLength(0);
    });

    it('should optimize incremental updates for minimal changes', async () => {
      const baseTrades = Array.from({ length: 100 }, (_, i) => 
        createMockTrade(`${i}`, [`#base${i % 5}`])
      );

      // Build initial index
      await tagPersistenceService.buildAndPersistTagIndex(userId, baseTrades);
      const initialCalls = mockSetDoc.mock.calls.length;

      // Make small incremental change
      const updatedTrades = [
        ...baseTrades,
        createMockTrade('new', ['#incremental'])
      ];

      await tagPersistenceService.incrementalTagIndexUpdate(userId, updatedTrades, ['new']);
      const incrementalCalls = mockSetDoc.mock.calls.length - initialCalls;

      // Should only make one additional call for incremental update
      expect(incrementalCalls).toBe(1);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain referential integrity between trades and tags', async () => {
      const trades = [
        createMockTrade('1', ['#ref1', '#ref2']),
        createMockTrade('2', ['#ref1', '#ref3']),
        createMockTrade('3', ['#ref2', '#ref3'])
      ];

      await tagPersistenceService.buildAndPersistTagIndex(userId, trades);

      // Validate that all tag references are correct
      const validation = await tagPersistenceService.validateTagIndexIntegrity(userId, trades);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Verify tag counts match actual usage
      const analytics = tagService.getTagAnalytics(trades);
      expect(analytics.totalTags).toBe(3);
      
      const ref1Tag = analytics.mostUsedTags.find(t => t.tag === '#ref1');
      expect(ref1Tag?.count).toBe(2);
    });

    it('should detect and report data inconsistencies', async () => {
      const trades = [
        createMockTrade('1', ['#test'])
      ];

      // Build index
      await tagPersistenceService.buildAndPersistTagIndex(userId, trades);

      // Simulate corrupted index by manually setting wrong data
      const corruptedIndex = {
        '#test': {
          count: 5, // Wrong count
          tradeIds: ['1', 'nonexistent'], // Wrong trade IDs
          lastUsed: '2024-01-01',
          performance: {
            tag: '#test',
            totalTrades: 0,
            winRate: 0,
            averagePnL: 0,
            profitFactor: 0
          }
        },
        '#orphaned': { // Orphaned tag
          count: 1,
          tradeIds: ['deleted'],
          lastUsed: '2024-01-01',
          performance: {
            tag: '#orphaned',
            totalTrades: 0,
            winRate: 0,
            averagePnL: 0,
            profitFactor: 0
          }
        }
      };

      tagPersistenceService['tagIndexCache'][userId] = corruptedIndex;

      const validation = await tagPersistenceService.validateTagIndexIntegrity(userId, trades);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Tag count mismatch'))).toBe(true);
      expect(validation.errors.some(e => e.includes('Extra trade ID'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('Orphaned tag'))).toBe(true);
    });

    it('should validate tag structure during migration', async () => {
      const tradesWithIssues = [
        createMockTrade('1', ['#valid']),
        { ...createMockTrade('2'), tags: undefined },
        { ...createMockTrade('3'), tags: 'not-array' as any },
        createMockTrade('4', ['#invalid-chars!', '#'])
      ];

      const validation = tagMigrationService.validateTradeTagStructure(tradesWithIssues);
      expect(validation.isValid).toBe(false);
      expect(validation.invalidTrades).toBe(3);
      expect(validation.issues).toHaveLength(3);
    });
  });

  describe('Backup and Recovery', () => {
    it('should create and restore complete backups', async () => {
      const originalTrades = [
        createMockTrade('1', ['#backup', '#test'], 100),
        createMockTrade('2', ['#restore'], -50)
      ];

      // Create backup
      const backup = await tagMigrationService.createMigrationBackup(userId, originalTrades);
      expect(backup.totalTrades).toBe(2);

      // Simulate data corruption/loss
      const corruptedTrades = [
        createMockTrade('1', ['#corrupted'])
      ];

      // Restore from backup
      const restoreResult = await tagMigrationService.restoreFromBackup(userId, backup);
      expect(restoreResult.restoredTrades).toBe(2);
      expect(restoreResult.errors).toHaveLength(0);

      // Verify restoration
      expect(mockTradeService.updateTrade).toHaveBeenCalledWith(
        userId,
        '1',
        expect.objectContaining({
          tags: ['#backup', '#test']
        })
      );
    });

    it('should export and import tag persistence data', async () => {
      const trades = [
        createMockTrade('1', ['#export']),
        createMockTrade('2', ['#import'])
      ];

      // Build index
      await tagPersistenceService.buildAndPersistTagIndex(userId, trades);

      // Mock successful load for export
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          index: {
            '#export': {
              count: 1,
              tradeIds: ['1'],
              lastUsed: '2024-01-01',
              performance: expect.any(Object)
            },
            '#import': {
              count: 1,
              tradeIds: ['2'],
              lastUsed: '2024-01-01',
              performance: expect.any(Object)
            }
          }
        })
      });

      // Export data
      const exportData = await tagPersistenceService.exportTagPersistenceData(userId);
      expect(exportData.tagIndex).toBeTruthy();

      // Clear cache and import
      tagPersistenceService.clearCachedTagIndex(userId);
      const importResult = await tagPersistenceService.importTagPersistenceData(userId, exportData);
      
      expect(importResult.success).toBe(true);
      expect(importResult.imported).toBe(true);
    });
  });

  describe('Real-time Updates and Subscriptions', () => {
    it('should handle real-time tag index updates', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();

      // Mock subscription setup
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        // Simulate initial data
        onNext({
          exists: () => true,
          data: () => ({
            index: {
              '#realtime': {
                count: 1,
                tradeIds: ['1'],
                lastUsed: '2024-01-01',
                performance: expect.any(Object)
              }
            }
          })
        });

        // Simulate update
        setTimeout(() => {
          onNext({
            exists: () => true,
            data: () => ({
              index: {
                '#realtime': {
                  count: 2,
                  tradeIds: ['1', '2'],
                  lastUsed: '2024-01-02',
                  performance: expect.any(Object)
                }
              }
            })
          });
        }, 100);

        return mockUnsubscribe;
      });

      const unsubscribe = tagPersistenceService.subscribeToTagIndex(userId, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          '#realtime': expect.any(Object)
        })
      );

      // Cleanup
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
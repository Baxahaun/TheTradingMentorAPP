import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TagMigrationService, tagMigrationService } from '../tagMigrationService';
import { tagService } from '../tagService';
import { Trade } from '../../types/trade';

// Mock dependencies
vi.mock('../tagPersistenceService', () => ({
  tagPersistenceService: {
    buildAndPersistTagIndex: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../firebaseService', () => ({
  tradeService: {
    updateTrade: vi.fn().mockResolvedValue(undefined),
    getTrades: vi.fn().mockResolvedValue([])
  }
}));

// Mock trade data for testing
const createMockTrade = (
  id: string, 
  tags?: string[], 
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

describe('TagMigrationService', () => {
  let service: TagMigrationService;
  const userId = 'test-user-123';

  beforeEach(() => {
    service = TagMigrationService.getInstance();
    vi.clearAllMocks();
    tagService.resetIndex();
  });

  describe('analyzeMigrationNeeds', () => {
    it('should analyze trades with no tags', () => {
      const trades = [
        createMockTrade('1'), // No tags property
        createMockTrade('2', []), // Empty tags array
        createMockTrade('3', undefined) // Undefined tags
      ];

      const result = service.analyzeMigrationNeeds(trades);

      expect(result.totalTrades).toBe(3);
      expect(result.tradesNeedingMigration).toBe(3);
      expect(result.tradesWithInvalidTags).toBe(0);
      expect(result.tradesWithValidTags).toBe(0);
      expect(result.migrationRecommendations).toContain('3 trades need tag migration');
      expect(result.estimatedTime).toMatch(/seconds|minutes/);
    });

    it('should analyze trades with valid tags', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend']),
        createMockTrade('2', ['#scalp']),
        createMockTrade('3', ['#swing'])
      ];

      const result = service.analyzeMigrationNeeds(trades);

      expect(result.totalTrades).toBe(3);
      expect(result.tradesNeedingMigration).toBe(0);
      expect(result.tradesWithInvalidTags).toBe(0);
      expect(result.tradesWithValidTags).toBe(3);
      expect(result.migrationRecommendations).toContain('All trades are already properly tagged');
    });

    it('should analyze trades with invalid tags', () => {
      const trades = [
        createMockTrade('1', ['#valid-tag']), // Invalid character
        createMockTrade('2', ['breakout']), // Missing #
        createMockTrade('3', ['#']) // Empty tag content
      ];

      const result = service.analyzeMigrationNeeds(trades);

      expect(result.totalTrades).toBe(3);
      expect(result.tradesNeedingMigration).toBe(3);
      expect(result.tradesWithInvalidTags).toBe(3);
      expect(result.tradesWithValidTags).toBe(0);
      expect(result.migrationRecommendations).toContain('3 trades have invalid tags that will be cleaned');
    });

    it('should analyze mixed trade scenarios', () => {
      const trades = [
        createMockTrade('1', ['#breakout']), // Valid
        createMockTrade('2'), // No tags
        createMockTrade('3', ['invalid-tag']), // Invalid
        createMockTrade('4', ['#TREND']), // Needs normalization
      ];

      const result = service.analyzeMigrationNeeds(trades);

      expect(result.totalTrades).toBe(4);
      expect(result.tradesNeedingMigration).toBe(3); // 2, 3, 4 need migration
      expect(result.tradesWithInvalidTags).toBe(1); // Trade 3
      expect(result.tradesWithValidTags).toBe(1); // Trade 1
    });

    it('should provide time estimates', () => {
      const manyTrades = Array.from({ length: 1000 }, (_, i) => 
        createMockTrade(`${i}`)
      );

      const result = service.analyzeMigrationNeeds(manyTrades);

      expect(result.estimatedTime).toMatch(/minutes/);
    });
  });

  describe('migrateTradesForTagging', () => {
    it('should migrate trades without tags', async () => {
      const trades = [
        createMockTrade('1'),
        createMockTrade('2', []),
        createMockTrade('3', undefined)
      ];

      const result = await service.migrateTradesForTagging(userId, trades, {
        defaultTags: ['#migrated']
      });

      expect(result.totalTrades).toBe(3);
      expect(result.migratedTrades).toBe(3);
      expect(result.skippedTrades).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip trades that already have valid tags', async () => {
      const trades = [
        createMockTrade('1', ['#breakout']),
        createMockTrade('2', ['#trend']),
        createMockTrade('3') // Needs migration
      ];

      const result = await service.migrateTradesForTagging(userId, trades);

      expect(result.totalTrades).toBe(3);
      expect(result.migratedTrades).toBe(1);
      expect(result.skippedTrades).toBe(2);
    });

    it('should clean invalid tags during migration', async () => {
      const trades = [
        createMockTrade('1', ['#valid', 'invalid-tag', '#another'])
      ];

      const result = await service.migrateTradesForTagging(userId, trades);

      expect(result.migratedTrades).toBe(1);
      expect(result.warnings.some(w => w.includes('invalid tags were removed'))).toBe(true);
    });

    it('should support dry run mode', async () => {
      const trades = [
        createMockTrade('1'),
        createMockTrade('2')
      ];

      const result = await service.migrateTradesForTagging(userId, trades, {
        dryRun: true
      });

      expect(result.migratedTrades).toBe(2);
      // Should not call updateTrade in dry run
      const { tradeService } = await import('../firebaseService');
      expect(tradeService.updateTrade).not.toHaveBeenCalled();
    });

    it('should report progress during migration', async () => {
      const trades = Array.from({ length: 5 }, (_, i) => 
        createMockTrade(`${i}`)
      );

      const progressUpdates: any[] = [];
      
      await service.migrateTradesForTagging(userId, trades, {
        onProgress: (progress) => progressUpdates.push(progress)
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toHaveProperty('completed');
      expect(progressUpdates[0]).toHaveProperty('total');
      expect(progressUpdates[0]).toHaveProperty('currentTrade');
    });

    it('should handle migration errors gracefully', async () => {
      const trades = [
        createMockTrade('1'),
        createMockTrade('2')
      ];

      // Mock an error for one trade
      const { tradeService } = await import('../firebaseService');
      (tradeService.updateTrade as any).mockImplementation((userId: string, tradeId: string) => {
        if (tradeId === '1') {
          throw new Error('Update failed');
        }
        return Promise.resolve();
      });

      const result = await service.migrateTradesForTagging(userId, trades);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Error migrating trade 1');
      expect(result.migratedTrades).toBe(1); // Trade 2 should still succeed
    });

    it('should process trades in batches', async () => {
      const trades = Array.from({ length: 150 }, (_, i) => 
        createMockTrade(`${i}`)
      );

      await service.migrateTradesForTagging(userId, trades, {
        batchSize: 50
      });

      // Should process all trades despite batching
      expect(trades.length).toBe(150);
    });

    it('should add default tags to empty trades', async () => {
      const trades = [createMockTrade('1', [])];
      const defaultTags = ['#default', '#migrated'];

      await service.migrateTradesForTagging(userId, trades, {
        defaultTags
      });

      const { tradeService } = await import('../firebaseService');
      expect(tradeService.updateTrade).toHaveBeenCalledWith(
        userId,
        '1',
        { tags: ['#default', '#migrated'] }
      );
    });
  });

  describe('validateTradeTagStructure', () => {
    it('should validate trades with proper tag structure', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend']),
        createMockTrade('2', ['#scalp'])
      ];

      const result = service.validateTradeTagStructure(trades);

      expect(result.isValid).toBe(true);
      expect(result.totalTrades).toBe(2);
      expect(result.validTrades).toBe(2);
      expect(result.invalidTrades).toBe(0);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing tags field', () => {
      const trades = [
        { ...createMockTrade('1'), tags: undefined }
      ];

      const result = service.validateTradeTagStructure(trades);

      expect(result.isValid).toBe(false);
      expect(result.invalidTrades).toBe(1);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toBe('Missing tags field');
      expect(result.issues[0].severity).toBe('warning');
    });

    it('should detect non-array tags field', () => {
      const trades = [
        { ...createMockTrade('1'), tags: 'not-an-array' as any }
      ];

      const result = service.validateTradeTagStructure(trades);

      expect(result.isValid).toBe(false);
      expect(result.issues[0].issue).toBe('Tags field is not an array');
      expect(result.issues[0].severity).toBe('error');
    });

    it('should detect invalid tag formats', () => {
      const trades = [
        createMockTrade('1', ['#valid', 'invalid-tag', '#'])
      ];

      const result = service.validateTradeTagStructure(trades);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.issue.includes('Invalid tags'))).toBe(true);
    });

    it('should detect normalization needs', () => {
      const trades = [
        createMockTrade('1', ['#UPPERCASE', 'lowercase'])
      ];

      const result = service.validateTradeTagStructure(trades);

      expect(result.issues.some(issue => issue.issue.includes('Tags need normalization'))).toBe(true);
    });
  });

  describe('createMigrationBackup', () => {
    it('should create a backup of trade data', async () => {
      const trades = [
        createMockTrade('1', ['#test']),
        createMockTrade('2', ['#backup'])
      ];

      const backup = await service.createMigrationBackup(userId, trades);

      expect(backup.userId).toBe(userId);
      expect(backup.totalTrades).toBe(2);
      expect(backup.trades).toHaveLength(2);
      expect(backup.backupDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(backup.version).toBe('1.0');
      
      // Ensure it's a deep copy
      expect(backup.trades).not.toBe(trades);
      expect(backup.trades[0]).not.toBe(trades[0]);
    });

    it('should handle empty trades array', async () => {
      const backup = await service.createMigrationBackup(userId, []);

      expect(backup.totalTrades).toBe(0);
      expect(backup.trades).toHaveLength(0);
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore trades from valid backup', async () => {
      const backup = {
        userId,
        backupDate: '2024-01-01T00:00:00.000Z',
        totalTrades: 2,
        trades: [
          createMockTrade('1', ['#restored']),
          createMockTrade('2', ['#backup'])
        ],
        version: '1.0'
      };

      const result = await service.restoreFromBackup(userId, backup);

      expect(result.totalTrades).toBe(2);
      expect(result.restoredTrades).toBe(2);
      expect(result.errors).toHaveLength(0);

      const { tradeService } = await import('../firebaseService');
      expect(tradeService.updateTrade).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid backup data', async () => {
      const result = await service.restoreFromBackup(userId, null);

      expect(result.totalTrades).toBe(0);
      expect(result.restoredTrades).toBe(0);
      expect(result.errors).toContain('Invalid backup data format');
    });

    it('should support dry run mode', async () => {
      const backup = {
        trades: [createMockTrade('1')]
      };

      const result = await service.restoreFromBackup(userId, backup, {
        dryRun: true
      });

      expect(result.restoredTrades).toBe(1);
      
      const { tradeService } = await import('../firebaseService');
      expect(tradeService.updateTrade).not.toHaveBeenCalled();
    });

    it('should report progress during restore', async () => {
      const backup = {
        trades: Array.from({ length: 5 }, (_, i) => createMockTrade(`${i}`))
      };

      const progressUpdates: any[] = [];
      
      await service.restoreFromBackup(userId, backup, {
        onProgress: (progress) => progressUpdates.push(progress)
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toHaveProperty('completed');
      expect(progressUpdates[0]).toHaveProperty('total');
    });

    it('should handle restore errors gracefully', async () => {
      const backup = {
        trades: [
          createMockTrade('1'),
          createMockTrade('2')
        ]
      };

      // Mock an error for one trade
      const { tradeService } = await import('../firebaseService');
      (tradeService.updateTrade as any).mockImplementation((userId: string, tradeId: string) => {
        if (tradeId === '1') {
          throw new Error('Restore failed');
        }
        return Promise.resolve();
      });

      const result = await service.restoreFromBackup(userId, backup);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Error restoring trade 1');
      expect(result.restoredTrades).toBe(1); // Trade 2 should still succeed
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TagMigrationService.getInstance();
      const instance2 = TagMigrationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
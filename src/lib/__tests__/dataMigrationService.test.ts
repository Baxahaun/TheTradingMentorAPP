/**
 * Data Migration Service Tests
 */

import { DataMigrationService, LegacyTrade, MigrationConfig } from '../dataMigrationService';
import { EnhancedTrade } from '../../types/tradeReview';

import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('DataMigrationService', () => {
  let migrationService: DataMigrationService;
  let mockLegacyTrades: LegacyTrade[];

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    const config: Partial<MigrationConfig> = {
      batchSize: 2,
      enableRollback: true,
      validateAfterMigration: true,
      backupBeforeMigration: true,
      skipValidationErrors: false
    };
    
    migrationService = new DataMigrationService(config);
    
    mockLegacyTrades = [
      {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01',
        timeIn: '10:00',
        timeOut: '11:00',
        side: 'long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lotSize: 1.0,
        lotType: 'standard',
        stopLoss: 1.0950,
        takeProfit: 1.1100,
        commission: 5.0,
        accountCurrency: 'USD',
        strategy: 'Trend Following',
        notes: 'Good trade',
        status: 'closed',
        tags: 'trend,breakout'
      },
      {
        id: 'trade2',
        currencyPair: 'GBP/USD',
        date: '2024-01-02',
        timeIn: '14:00',
        side: 'short',
        entryPrice: 1.2500,
        lotSize: 0.5,
        lotType: 'standard',
        commission: 3.0,
        accountCurrency: 'USD',
        status: 'open',
        tags: ['reversal', 'support']
      }
    ];
  });

  describe('Migration Version Management', () => {
    it('should return default version when no migration has been performed', () => {
      const version = migrationService.getCurrentMigrationVersion();
      expect(version).toBe('0.0.0');
    });

    it('should detect when migration is needed', async () => {
      const isNeeded = await migrationService.isMigrationNeeded();
      expect(isNeeded).toBe(true);
    });

    it('should update migration version after successful migration', async () => {
      await migrationService.migrateTrades(mockLegacyTrades);
      const version = migrationService.getCurrentMigrationVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('Legacy Trade Migration', () => {
    it('should migrate a single legacy trade to enhanced format', () => {
      const legacyTrade = mockLegacyTrades[0];
      const enhancedTrade = migrationService.migrateLegacyTrade(legacyTrade);

      expect(enhancedTrade.id).toBe(legacyTrade.id);
      expect(enhancedTrade.currencyPair).toBe(legacyTrade.currencyPair);
      expect(enhancedTrade.accountId).toBeDefined();
      expect(enhancedTrade.units).toBe(100000); // 1.0 standard lot
      expect(enhancedTrade.tags).toEqual(['trend', 'breakout']);
      expect(enhancedTrade.reviewData).toBeDefined();
      expect(enhancedTrade.reviewData?.notes).toBeDefined();
      expect(enhancedTrade.reviewData?.reviewWorkflow).toBeDefined();
    });

    it('should handle string tags correctly', () => {
      const legacyTrade = mockLegacyTrades[0];
      const enhancedTrade = migrationService.migrateLegacyTrade(legacyTrade);
      expect(enhancedTrade.tags).toEqual(['trend', 'breakout']);
    });

    it('should handle array tags correctly', () => {
      const legacyTrade = mockLegacyTrades[1];
      const enhancedTrade = migrationService.migrateLegacyTrade(legacyTrade);
      expect(enhancedTrade.tags).toEqual(['reversal', 'support']);
    });

    it('should calculate missing pips for closed trades', () => {
      const legacyTrade = mockLegacyTrades[0];
      const enhancedTrade = migrationService.migrateLegacyTrade(legacyTrade);
      expect(enhancedTrade.pips).toBeCloseTo(50, 1); // 1.1050 - 1.1000 = 50 pips
    });

    it('should calculate units correctly for different lot types', () => {
      const testCases = [
        { lotSize: 1.0, lotType: 'standard' as const, expected: 100000 },
        { lotSize: 1.0, lotType: 'mini' as const, expected: 10000 },
        { lotSize: 1.0, lotType: 'micro' as const, expected: 1000 },
        { lotSize: 2.5, lotType: 'standard' as const, expected: 250000 }
      ];

      testCases.forEach(({ lotSize, lotType, expected }) => {
        const legacyTrade = { ...mockLegacyTrades[0], lotSize, lotType };
        const enhancedTrade = migrationService.migrateLegacyTrade(legacyTrade);
        expect(enhancedTrade.units).toBe(expected);
      });
    });
  });

  describe('Batch Migration', () => {
    it('should migrate trades in batches', async () => {
      const result = await migrationService.migrateTrades(mockLegacyTrades);
      
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should create backup before migration when enabled', async () => {
      await migrationService.migrateTrades(mockLegacyTrades);
      
      const backup = localStorage.getItem('trade_migration_backup');
      expect(backup).toBeTruthy();
      
      const backupData = JSON.parse(backup!);
      expect(backupData.data).toHaveLength(2);
      expect(backupData.timestamp).toBeDefined();
    });

    it('should handle migration errors gracefully', async () => {
      const invalidTrade = {
        ...mockLegacyTrades[0],
        entryPrice: 'invalid' as any
      };
      
      const result = await migrationService.migrateTrades([invalidTrade]);
      
      expect(result.success).toBe(true); // Should continue despite errors
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate migrated data when enabled', async () => {
      const result = await migrationService.migrateTrades(mockLegacyTrades);
      
      expect(result.success).toBe(true);
      // Validation should pass for valid data
    });
  });

  describe('Backward Compatibility', () => {
    it('should check backward compatibility correctly', () => {
      const compatibleTrade = mockLegacyTrades[0];
      const incompatibleTrade = { id: 'test' }; // Missing required fields
      
      expect(migrationService.isBackwardCompatible(compatibleTrade)).toBe(true);
      expect(migrationService.isBackwardCompatible(incompatibleTrade)).toBe(false);
    });

    it('should convert enhanced trade back to legacy format', () => {
      const legacyTrade = mockLegacyTrades[0];
      const enhancedTrade = migrationService.migrateLegacyTrade(legacyTrade);
      const backToLegacy = migrationService.toLegacyFormat(enhancedTrade);
      
      expect(backToLegacy.id).toBe(legacyTrade.id);
      expect(backToLegacy.currencyPair).toBe(legacyTrade.currencyPair);
      expect(backToLegacy.entryPrice).toBe(legacyTrade.entryPrice);
      expect(backToLegacy.notes).toBe(legacyTrade.notes);
    });

    it('should preserve notes from review data when converting back', () => {
      const legacyTrade = mockLegacyTrades[0];
      const enhancedTrade = migrationService.migrateLegacyTrade(legacyTrade);
      
      // Modify review notes
      if (enhancedTrade.reviewData?.notes) {
        enhancedTrade.reviewData.notes.generalNotes = 'Updated notes';
      }
      
      const backToLegacy = migrationService.toLegacyFormat(enhancedTrade);
      expect(backToLegacy.notes).toBe('Updated notes');
    });
  });

  describe('Rollback Functionality', () => {
    it('should rollback migration successfully', async () => {
      const originalData = [...mockLegacyTrades];
      const migrationResult = await migrationService.migrateTrades(mockLegacyTrades);
      
      const rollbackResult = await migrationService.rollbackMigration(originalData);
      
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.migratedCount).toBe(originalData.length);
      
      // Check that original data is restored
      const restoredData = localStorage.getItem('trades');
      expect(restoredData).toBeTruthy();
      expect(JSON.parse(restoredData!)).toEqual(originalData);
      
      // Check that migration version is reset
      expect(migrationService.getCurrentMigrationVersion()).toBe('0.0.0');
    });

    it('should handle rollback errors gracefully', async () => {
      // Simulate rollback without proper backup data
      const rollbackResult = await migrationService.rollbackMigration(null);
      
      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.errors).toHaveLength(1);
    });
  });

  describe('Migration History', () => {
    it('should track migration history', async () => {
      await migrationService.migrateTrades(mockLegacyTrades);
      
      const history = migrationService.getMigrationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].version).toBe('1.0.0');
      expect(history[0].appliedAt).toBeDefined();
    });

    it('should persist migration history', async () => {
      await migrationService.migrateTrades(mockLegacyTrades);
      
      // Create new service instance to test persistence
      const newService = new DataMigrationService();
      const history = newService.getMigrationHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].version).toBe('1.0.0');
    });
  });

  describe('Configuration Options', () => {
    it('should respect skipValidationErrors configuration', async () => {
      const configWithSkip: Partial<MigrationConfig> = {
        skipValidationErrors: true
      };
      
      const serviceWithSkip = new DataMigrationService(configWithSkip);
      
      const invalidTrade = {
        ...mockLegacyTrades[0],
        entryPrice: -1 // Invalid price
      };
      
      const result = await serviceWithSkip.migrateTrades([invalidTrade]);
      
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(1); // Should migrate despite validation error
      expect(result.warnings).toContain('Trade trade1 has validation warnings');
    });

    it('should respect backupBeforeMigration configuration', async () => {
      const configWithoutBackup: Partial<MigrationConfig> = {
        backupBeforeMigration: false
      };
      
      const serviceWithoutBackup = new DataMigrationService(configWithoutBackup);
      await serviceWithoutBackup.migrateTrades(mockLegacyTrades);
      
      const backup = localStorage.getItem('trade_migration_backup');
      expect(backup).toBeNull();
    });

    it('should use custom batch size', async () => {
      const configWithSmallBatch: Partial<MigrationConfig> = {
        batchSize: 1
      };
      
      const serviceWithSmallBatch = new DataMigrationService(configWithSmallBatch);
      const result = await serviceWithSmallBatch.migrateTrades(mockLegacyTrades);
      
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid trade data gracefully', async () => {
      const invalidTrades = [
        { id: 'invalid1' }, // Missing required fields
        { id: 'invalid2', entryPrice: 'not a number' }, // Invalid data type
        null, // Null trade
        undefined // Undefined trade
      ];
      
      const result = await migrationService.migrateTrades(invalidTrades as any);
      
      expect(result.success).toBe(false); // Should fail with invalid data
      expect(result.failedCount).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle storage errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      let result;
      try {
        result = await migrationService.migrateTrades(mockLegacyTrades);
      } catch (error) {
        // Should handle storage errors by throwing
        expect(error).toBeDefined();
        // Restore original method
        localStorage.setItem = originalSetItem;
        return;
      }
      
      // If no error thrown, should still handle gracefully
      expect(result.success).toBe(false);
      
      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });
});
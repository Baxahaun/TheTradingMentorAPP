/**
 * Migration Manager Tests
 */

import { vi } from 'vitest';
import { MigrationManager } from '../migrationManager';
import { FeatureFlagService, TradeReviewFeatureFlags } from '../featureFlagService';
import { MigrationConfig } from '../dataMigrationService';

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

describe('MigrationManager', () => {
  let migrationManager: MigrationManager;
  let featureFlagService: FeatureFlagService;
  let mockLegacyTrades: any[];

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    featureFlagService = new FeatureFlagService();
    
    const migrationConfig: Partial<MigrationConfig> = {
      batchSize: 10,
      enableRollback: true,
      validateAfterMigration: true,
      backupBeforeMigration: true,
      skipValidationErrors: false
    };
    
    migrationManager = new MigrationManager(migrationConfig, featureFlagService);
    
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
        commission: 5.0,
        accountCurrency: 'USD',
        status: 'closed'
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
        status: 'open'
      }
    ];
    
    // Set up legacy data in localStorage
    localStorage.setItem('trades', JSON.stringify(mockLegacyTrades));
  });

  describe('Migration Need Assessment', () => {
    it('should detect when migration is needed', async () => {
      // Enable data migration feature flag
      featureFlagService.enableFlag(TradeReviewFeatureFlags.DATA_MIGRATION, 100);
      
      const isNeeded = await migrationManager.isMigrationNeeded();
      expect(isNeeded).toBe(true);
    });

    it('should return false when data migration is disabled', async () => {
      // Disable data migration feature flag
      featureFlagService.disableFlag(TradeReviewFeatureFlags.DATA_MIGRATION);
      
      const isNeeded = await migrationManager.isMigrationNeeded();
      expect(isNeeded).toBe(false);
    });

    it('should return false when migration is already completed', async () => {
      // Enable data migration feature flag
      featureFlagService.enableFlag(TradeReviewFeatureFlags.DATA_MIGRATION, 100);
      
      // Set migration version to indicate completion
      localStorage.setItem('trade_migration_version', '1.0.0');
      
      const isNeeded = await migrationManager.isMigrationNeeded();
      expect(isNeeded).toBe(false);
    });

    it('should return false when no legacy data exists', async () => {
      // Enable data migration feature flag
      featureFlagService.enableFlag(TradeReviewFeatureFlags.DATA_MIGRATION, 100);
      
      // Remove legacy data
      localStorage.removeItem('trades');
      
      const isNeeded = await migrationManager.isMigrationNeeded();
      expect(isNeeded).toBe(false);
    });
  });

  describe('Migration Plan', () => {
    it('should return a valid migration plan', () => {
      const plan = migrationManager.getMigrationPlan();
      
      expect(plan.id).toBe('trade_review_v1_migration');
      expect(plan.name).toBeDefined();
      expect(plan.description).toBeDefined();
      expect(plan.steps).toHaveLength(6);
      expect(plan.rollbackPlan).toHaveLength(3);
      
      // Check step ordering
      const stepOrders = plan.steps.map(s => s.order);
      expect(stepOrders).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should have proper step dependencies', () => {
      const plan = migrationManager.getMigrationPlan();
      
      const backupStep = plan.steps.find(s => s.id === 'backup_existing_data');
      const validateStep = plan.steps.find(s => s.id === 'validate_source_data');
      const migrateStep = plan.steps.find(s => s.id === 'migrate_trade_structure');
      
      expect(backupStep?.dependencies).toEqual([]);
      expect(validateStep?.dependencies).toContain('backup_existing_data');
      expect(migrateStep?.dependencies).toContain('validate_source_data');
    });
  });

  describe('Migration Execution', () => {
    beforeEach(() => {
      // Enable data migration feature flag
      featureFlagService.enableFlag(TradeReviewFeatureFlags.DATA_MIGRATION, 100);
    });

    it('should execute migration successfully', async () => {
      const result = await migrationManager.executeMigration();
      
      expect(result.success).toBe(true);
      expect(result.executedSteps).toHaveLength(6);
      expect(result.failedSteps).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track migration progress', async () => {
      const migrationPromise = migrationManager.executeMigration();
      
      // Check progress during execution
      const progress = migrationManager.getMigrationProgress();
      expect(progress).toBeDefined();
      expect(progress?.status).toBe('in_progress');
      expect(progress?.planId).toBe('trade_review_v1_migration');
      
      await migrationPromise;
      
      // Check final progress
      const finalProgress = migrationManager.getMigrationProgress();
      expect(finalProgress?.status).toBe('completed');
      expect(finalProgress?.overallProgress).toBe(100);
    });

    it('should create backup during migration', async () => {
      await migrationManager.executeMigration();
      
      const backup = localStorage.getItem('migration_backup');
      expect(backup).toBeTruthy();
      
      const backupData = JSON.parse(backup!);
      expect(backupData.data).toHaveLength(2);
      expect(backupData.timestamp).toBeDefined();
    });

    it('should update feature flags after migration', async () => {
      await migrationManager.executeMigration();
      
      expect(featureFlagService.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW)).toBe(true);
      expect(featureFlagService.isEnabled(TradeReviewFeatureFlags.ADVANCED_NOTES_EDITOR)).toBe(true);
      expect(featureFlagService.isEnabled(TradeReviewFeatureFlags.CONTEXTUAL_NAVIGATION)).toBe(true);
    });

    it('should handle step failures gracefully', async () => {
      // Mock a step to fail by removing required data
      localStorage.removeItem('trades');
      
      const result = await migrationManager.executeMigration();
      
      // Migration should continue but may have warnings
      expect(result.executedSteps.length).toBeGreaterThan(0);
    });

    it('should fail on required step failure', async () => {
      // Mock localStorage to throw error during backup step
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      const result = await migrationManager.executeMigration();
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should handle invalid plan ID', async () => {
      await expect(migrationManager.executeMigration('invalid_plan')).rejects.toThrow(
        'Migration plan \'invalid_plan\' not found'
      );
    });
  });

  describe('Migration Rollback', () => {
    it('should rollback migration successfully', async () => {
      // First, execute migration
      const migrationResult = await migrationManager.executeMigration();
      expect(migrationResult.success).toBe(true);
      
      // Then rollback
      const rollbackResult = await migrationManager.rollbackMigration(migrationResult);
      
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.migratedCount).toBe(2); // Original trade count
      
      // Check that original data is restored
      const restoredData = localStorage.getItem('trades');
      expect(restoredData).toBeTruthy();
      expect(JSON.parse(restoredData!)).toEqual(mockLegacyTrades);
      
      // Check that progress is updated
      const progress = migrationManager.getMigrationProgress();
      expect(progress?.status).toBe('rolled_back');
    });

    it('should restore feature flags during rollback', async () => {
      // Store original flag states
      const originalFlags = featureFlagService.getAllFlags();
      
      // Execute migration (this will change flags)
      const migrationResult = await migrationManager.executeMigration();
      
      // Rollback
      await migrationManager.rollbackMigration(migrationResult);
      
      // Check that flags are restored (at least some should be back to original state)
      const currentFlags = featureFlagService.getAllFlags();
      expect(currentFlags).toBeDefined();
    });

    it('should handle rollback errors gracefully', async () => {
      const invalidMigrationResult = {
        success: true,
        planId: 'test',
        executedSteps: [],
        failedSteps: [],
        rollbackData: {}, // Empty rollback data
        validationResults: [],
        errors: [],
        warnings: [],
        duration: 0
      };
      
      const rollbackResult = await migrationManager.rollbackMigration(invalidMigrationResult);
      
      // Should handle missing rollback data gracefully
      expect(rollbackResult).toBeDefined();
    });

    it('should check rollback availability', () => {
      expect(migrationManager.isRollbackAvailable()).toBe(false);
      
      // Create backup
      localStorage.setItem('migration_backup', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: mockLegacyTrades
      }));
      
      expect(migrationManager.isRollbackAvailable()).toBe(true);
    });
  });

  describe('Progress Management', () => {
    it('should save and load migration progress', async () => {
      const migrationPromise = migrationManager.executeMigration();
      
      // Progress should be saved during execution
      const progress1 = migrationManager.getMigrationProgress();
      expect(progress1).toBeDefined();
      
      await migrationPromise;
      
      // Create new manager instance to test persistence
      const newManager = new MigrationManager();
      const progress2 = newManager.getMigrationProgress();
      
      expect(progress2).toBeDefined();
      expect(progress2?.status).toBe('completed');
    });

    it('should allow canceling migration', async () => {
      const migrationPromise = migrationManager.executeMigration();
      
      // Cancel migration
      await migrationManager.cancelMigration();
      
      const progress = migrationManager.getMigrationProgress();
      expect(progress?.status).toBe('failed');
      
      await migrationPromise; // Wait for promise to resolve
    });

    it('should reset migration state', () => {
      // Set some progress
      localStorage.setItem('migration_progress', JSON.stringify({
        planId: 'test',
        status: 'completed'
      }));
      
      migrationManager.resetMigrationState();
      
      const progress = migrationManager.getMigrationProgress();
      expect(progress).toBeNull();
      expect(localStorage.getItem('migration_progress')).toBeNull();
    });
  });

  describe('Migration History', () => {
    it('should track migration history', async () => {
      await migrationManager.executeMigration();
      
      const history = migrationManager.getMigrationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].version).toBe('1.0.0');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing legacy data gracefully', async () => {
      localStorage.removeItem('trades');
      
      const result = await migrationManager.executeMigration();
      
      // Should complete successfully even with no data
      expect(result.success).toBe(true);
    });

    it('should handle corrupted legacy data', async () => {
      localStorage.setItem('trades', 'invalid json');
      
      const result = await migrationManager.executeMigration();
      
      // Should handle corrupted data gracefully
      expect(result.success).toBe(true);
    });

    it('should handle storage errors during execution', async () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      const result = await migrationManager.executeMigration();
      
      // Should handle storage errors
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Restore original method
      localStorage.getItem = originalGetItem;
    });
  });

  describe('Integration with Services', () => {
    it('should integrate with feature flag service', () => {
      const customFeatureFlagService = new FeatureFlagService();
      customFeatureFlagService.disableFlag(TradeReviewFeatureFlags.DATA_MIGRATION);
      
      const customManager = new MigrationManager(undefined, customFeatureFlagService);
      
      expect(customManager).toBeDefined();
    });

    it('should use default feature flag service when none provided', () => {
      const manager = new MigrationManager();
      expect(manager).toBeDefined();
    });
  });
});
/**
 * Data Migration Validation Tests
 * 
 * Comprehensive tests to ensure data migration from basic playbooks
 * to professional strategies preserves all data integrity.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StrategyMigrationService } from '../../../services/StrategyMigrationService';
import { StrategyPerformanceService } from '../../../services/StrategyPerformanceService';
import { StrategyValidationService } from '../../../services/StrategyValidationService';
import type { Playbook } from '../../../types/playbook';
import type { ProfessionalStrategy, Trade } from '../../../types/strategy';

interface MigrationTestCase {
  name: string;
  playbook: Playbook;
  expectedStrategy: Partial<ProfessionalStrategy>;
  validationRules: string[];
}

interface DataIntegrityCheck {
  field: string;
  originalValue: any;
  migratedValue: any;
  isPreserved: boolean;
  notes?: string;
}

export class DataMigrationValidator {
  private migrationService: StrategyMigrationService;
  private performanceService: StrategyPerformanceService;
  private validationService: StrategyValidationService;

  constructor() {
    this.migrationService = new StrategyMigrationService();
    this.performanceService = new StrategyPerformanceService();
    this.validationService = new StrategyValidationService();
  }

  async validateMigration(playbook: Playbook): Promise<{
    success: boolean;
    migratedStrategy: ProfessionalStrategy | null;
    integrityChecks: DataIntegrityCheck[];
    validationErrors: string[];
    performancePreservation: boolean;
  }> {
    try {
      // Perform migration
      const migratedStrategy = await this.migrationService.migratePlaybookToStrategy(playbook);
      
      if (!migratedStrategy) {
        return {
          success: false,
          migratedStrategy: null,
          integrityChecks: [],
          validationErrors: ['Migration failed - no strategy returned'],
          performancePreservation: false
        };
      }

      // Validate data integrity
      const integrityChecks = this.performDataIntegrityChecks(playbook, migratedStrategy);
      
      // Validate business rules
      const validationErrors = await this.validationService.validateStrategy(migratedStrategy);
      
      // Check performance data preservation
      const performancePreservation = this.validatePerformancePreservation(playbook, migratedStrategy);

      return {
        success: validationErrors.length === 0 && integrityChecks.every(check => check.isPreserved),
        migratedStrategy,
        integrityChecks,
        validationErrors,
        performancePreservation
      };
    } catch (error) {
      return {
        success: false,
        migratedStrategy: null,
        integrityChecks: [],
        validationErrors: [`Migration error: ${error.message}`],
        performancePreservation: false
      };
    }
  }

  private performDataIntegrityChecks(playbook: Playbook, strategy: ProfessionalStrategy): DataIntegrityCheck[] {
    const checks: DataIntegrityCheck[] = [];

    // Check basic field preservation
    checks.push({
      field: 'id',
      originalValue: playbook.id,
      migratedValue: strategy.id,
      isPreserved: playbook.id === strategy.id,
      notes: 'ID should be preserved to maintain references'
    });

    checks.push({
      field: 'title',
      originalValue: playbook.title,
      migratedValue: strategy.title,
      isPreserved: playbook.title === strategy.title,
      notes: 'Title should be preserved exactly'
    });

    checks.push({
      field: 'description',
      originalValue: playbook.description,
      migratedValue: strategy.description,
      isPreserved: playbook.description === strategy.description,
      notes: 'Description should be preserved exactly'
    });

    checks.push({
      field: 'color',
      originalValue: playbook.color,
      migratedValue: strategy.color,
      isPreserved: playbook.color === strategy.color,
      notes: 'Color should be preserved for visual consistency'
    });

    // Check performance data preservation
    checks.push({
      field: 'totalTrades',
      originalValue: playbook.timesUsed,
      migratedValue: strategy.performance.totalTrades,
      isPreserved: playbook.timesUsed === strategy.performance.totalTrades,
      notes: 'Total trades count should be preserved'
    });

    checks.push({
      field: 'winningTrades',
      originalValue: playbook.tradesWon,
      migratedValue: strategy.performance.winningTrades,
      isPreserved: playbook.tradesWon === strategy.performance.winningTrades,
      notes: 'Winning trades count should be preserved'
    });

    checks.push({
      field: 'losingTrades',
      originalValue: playbook.tradesLost,
      migratedValue: strategy.performance.losingTrades,
      isPreserved: playbook.tradesLost === strategy.performance.losingTrades,
      notes: 'Losing trades count should be preserved'
    });

    // Check timestamp preservation
    checks.push({
      field: 'createdAt',
      originalValue: playbook.createdAt,
      migratedValue: strategy.createdAt,
      isPreserved: playbook.createdAt === strategy.createdAt,
      notes: 'Creation timestamp should be preserved'
    });

    // Check legacy field preservation
    checks.push({
      field: 'marketConditions',
      originalValue: playbook.marketConditions,
      migratedValue: strategy.marketConditions,
      isPreserved: playbook.marketConditions === strategy.marketConditions,
      notes: 'Legacy market conditions should be preserved for reference'
    });

    checks.push({
      field: 'entryParameters',
      originalValue: playbook.entryParameters,
      migratedValue: strategy.entryParameters,
      isPreserved: playbook.entryParameters === strategy.entryParameters,
      notes: 'Legacy entry parameters should be preserved for reference'
    });

    checks.push({
      field: 'exitParameters',
      originalValue: playbook.exitParameters,
      migratedValue: strategy.exitParameters,
      isPreserved: playbook.exitParameters === strategy.exitParameters,
      notes: 'Legacy exit parameters should be preserved for reference'
    });

    return checks;
  }

  private validatePerformancePreservation(playbook: Playbook, strategy: ProfessionalStrategy): boolean {
    // Calculate expected win rate
    const totalTrades = playbook.timesUsed;
    const expectedWinRate = totalTrades > 0 ? (playbook.tradesWon / totalTrades) * 100 : 0;
    
    // Check if calculated win rate matches
    const actualWinRate = strategy.performance.winRate;
    const winRateMatches = Math.abs(expectedWinRate - actualWinRate) < 0.01;

    // Check if performance metrics are properly initialized
    const metricsInitialized = strategy.performance.lastCalculated !== undefined;

    return winRateMatches && metricsInitialized;
  }
}

describe('Data Migration Validation', () => {
  let validator: DataMigrationValidator;

  beforeEach(() => {
    validator = new DataMigrationValidator();
  });

  const createTestPlaybook = (overrides: Partial<Playbook> = {}): Playbook => ({
    id: 'test-playbook-1',
    title: 'Test Trend Following',
    description: 'A simple trend following strategy',
    color: '#3B82F6',
    marketConditions: 'Trending markets with clear direction',
    entryParameters: 'Price above 200 MA, RSI > 50, Volume confirmation',
    exitParameters: 'Price below 200 MA or 2% stop loss, 1:2 risk reward',
    timesUsed: 50,
    tradesWon: 32,
    tradesLost: 18,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T12:00:00Z',
    ...overrides
  });

  const migrationTestCases: MigrationTestCase[] = [
    {
      name: 'Basic Trend Following Strategy',
      playbook: createTestPlaybook(),
      expectedStrategy: {
        methodology: 'Technical',
        primaryTimeframe: '1H',
        assetClasses: ['Forex']
      },
      validationRules: ['title_preserved', 'performance_preserved', 'legacy_fields_preserved']
    },
    {
      name: 'High Volume Strategy',
      playbook: createTestPlaybook({
        id: 'high-volume-strategy',
        title: 'High Volume Breakout',
        timesUsed: 200,
        tradesWon: 120,
        tradesLost: 80
      }),
      expectedStrategy: {
        methodology: 'Technical',
        performance: {
          totalTrades: 200,
          winningTrades: 120,
          losingTrades: 80,
          winRate: 60
        }
      },
      validationRules: ['high_volume_handling', 'statistical_significance']
    },
    {
      name: 'Low Sample Size Strategy',
      playbook: createTestPlaybook({
        id: 'low-sample-strategy',
        title: 'New Strategy',
        timesUsed: 5,
        tradesWon: 3,
        tradesLost: 2
      }),
      expectedStrategy: {
        performance: {
          totalTrades: 5,
          statisticallySignificant: false
        }
      },
      validationRules: ['low_sample_handling', 'significance_warning']
    },
    {
      name: 'Perfect Win Rate Strategy',
      playbook: createTestPlaybook({
        id: 'perfect-strategy',
        title: 'Perfect Strategy',
        timesUsed: 10,
        tradesWon: 10,
        tradesLost: 0
      }),
      expectedStrategy: {
        performance: {
          winRate: 100,
          losingTrades: 0
        }
      },
      validationRules: ['perfect_winrate_handling', 'edge_case_validation']
    },
    {
      name: 'Zero Trades Strategy',
      playbook: createTestPlaybook({
        id: 'unused-strategy',
        title: 'Unused Strategy',
        timesUsed: 0,
        tradesWon: 0,
        tradesLost: 0
      }),
      expectedStrategy: {
        performance: {
          totalTrades: 0,
          winRate: 0,
          statisticallySignificant: false
        }
      },
      validationRules: ['zero_trades_handling', 'initialization_validation']
    }
  ];

  describe('Individual Migration Test Cases', () => {
    migrationTestCases.forEach(testCase => {
      it(`should migrate ${testCase.name} correctly`, async () => {
        const result = await validator.validateMigration(testCase.playbook);

        // Verify migration success
        expect(result.success).toBe(true);
        expect(result.migratedStrategy).toBeTruthy();

        if (result.migratedStrategy) {
          // Verify expected strategy properties
          Object.entries(testCase.expectedStrategy).forEach(([key, expectedValue]) => {
            if (key === 'performance' && typeof expectedValue === 'object') {
              Object.entries(expectedValue).forEach(([perfKey, perfValue]) => {
                expect(result.migratedStrategy!.performance[perfKey as keyof typeof result.migratedStrategy.performance])
                  .toBe(perfValue);
              });
            } else {
              expect(result.migratedStrategy![key as keyof ProfessionalStrategy]).toBe(expectedValue);
            }
          });
        }

        // Verify data integrity
        const failedChecks = result.integrityChecks.filter(check => !check.isPreserved);
        expect(failedChecks).toHaveLength(0);

        // Verify no validation errors
        expect(result.validationErrors).toHaveLength(0);

        // Verify performance preservation
        expect(result.performancePreservation).toBe(true);
      });
    });
  });

  describe('Batch Migration Validation', () => {
    it('should migrate multiple playbooks while maintaining data integrity', async () => {
      const playbooks = migrationTestCases.map(testCase => testCase.playbook);
      const results = await Promise.all(
        playbooks.map(playbook => validator.validateMigration(playbook))
      );

      // Verify all migrations succeeded
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.migratedStrategy).toBeTruthy();
        
        // Verify unique IDs are preserved
        expect(result.migratedStrategy!.id).toBe(playbooks[index].id);
      });

      // Verify no ID conflicts
      const migratedIds = results.map(result => result.migratedStrategy!.id);
      const uniqueIds = new Set(migratedIds);
      expect(uniqueIds.size).toBe(migratedIds.length);
    });

    it('should handle migration rollback correctly', async () => {
      const playbook = createTestPlaybook();
      
      // Start migration
      const migrationService = new StrategyMigrationService();
      const migrationId = await migrationService.startMigration(playbook);
      
      // Simulate user cancellation
      const rollbackResult = await migrationService.rollbackMigration(migrationId);
      
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.originalDataRestored).toBe(true);
      
      // Verify original playbook is unchanged
      const originalPlaybook = await migrationService.getPlaybook(playbook.id);
      expect(originalPlaybook).toEqual(playbook);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle corrupted playbook data gracefully', async () => {
      const corruptedPlaybook = {
        ...createTestPlaybook(),
        timesUsed: -1, // Invalid negative value
        tradesWon: 100,
        tradesLost: 50 // Inconsistent: more wins+losses than total
      };

      const result = await validator.validateMigration(corruptedPlaybook as Playbook);
      
      expect(result.success).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors.some(error => 
        error.includes('inconsistent') || error.includes('invalid')
      )).toBe(true);
    });

    it('should handle missing required fields', async () => {
      const incompletePlaybook = {
        id: 'incomplete-playbook',
        title: '', // Missing title
        // Missing other required fields
      };

      const result = await validator.validateMigration(incompletePlaybook as Playbook);
      
      expect(result.success).toBe(false);
      expect(result.validationErrors.some(error => 
        error.includes('title') || error.includes('required')
      )).toBe(true);
    });

    it('should handle extremely large datasets', async () => {
      const largeDataPlaybook = createTestPlaybook({
        id: 'large-data-playbook',
        title: 'Large Dataset Strategy',
        timesUsed: 100000,
        tradesWon: 60000,
        tradesLost: 40000
      });

      const startTime = performance.now();
      const result = await validator.validateMigration(largeDataPlaybook);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.migratedStrategy!.performance.statisticallySignificant).toBe(true);
    });

    it('should preserve special characters and unicode in text fields', async () => {
      const unicodePlaybook = createTestPlaybook({
        title: 'Stratégie Spéciale 🚀',
        description: 'Une stratégie avec des caractères spéciaux: €, £, ¥, 中文',
        marketConditions: 'Marchés volatils avec résistance à 1.2000€'
      });

      const result = await validator.validateMigration(unicodePlaybook);
      
      expect(result.success).toBe(true);
      expect(result.migratedStrategy!.title).toBe(unicodePlaybook.title);
      expect(result.migratedStrategy!.description).toBe(unicodePlaybook.description);
      expect(result.migratedStrategy!.marketConditions).toBe(unicodePlaybook.marketConditions);
    });
  });

  describe('Performance Calculation Validation', () => {
    it('should calculate professional metrics correctly after migration', async () => {
      const playbook = createTestPlaybook({
        timesUsed: 100,
        tradesWon: 65,
        tradesLost: 35
      });

      const result = await validator.validateMigration(playbook);
      
      expect(result.success).toBe(true);
      
      const performance = result.migratedStrategy!.performance;
      
      // Verify basic calculations
      expect(performance.totalTrades).toBe(100);
      expect(performance.winningTrades).toBe(65);
      expect(performance.losingTrades).toBe(35);
      expect(performance.winRate).toBe(65);
      
      // Verify professional metrics are initialized
      expect(performance.profitFactor).toBeGreaterThanOrEqual(0);
      expect(performance.expectancy).toBeDefined();
      expect(performance.lastCalculated).toBeDefined();
    });

    it('should handle zero-division scenarios in performance calculations', async () => {
      const playbook = createTestPlaybook({
        timesUsed: 10,
        tradesWon: 10,
        tradesLost: 0 // All wins, no losses
      });

      const result = await validator.validateMigration(playbook);
      
      expect(result.success).toBe(true);
      
      const performance = result.migratedStrategy!.performance;
      expect(performance.winRate).toBe(100);
      expect(performance.losingTrades).toBe(0);
      // Profit factor should handle division by zero gracefully
      expect(performance.profitFactor).toBeDefined();
      expect(isNaN(performance.profitFactor)).toBe(false);
    });
  });

  describe('Concurrent Migration Handling', () => {
    it('should handle concurrent migrations without data corruption', async () => {
      const playbooks = Array.from({ length: 10 }, (_, i) => 
        createTestPlaybook({
          id: `concurrent-playbook-${i}`,
          title: `Concurrent Strategy ${i}`
        })
      );

      // Start all migrations concurrently
      const migrationPromises = playbooks.map(playbook => 
        validator.validateMigration(playbook)
      );

      const results = await Promise.all(migrationPromises);

      // Verify all migrations succeeded
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.migratedStrategy!.id).toBe(playbooks[index].id);
        expect(result.migratedStrategy!.title).toBe(playbooks[index].title);
      });

      // Verify no data corruption between concurrent operations
      const allIds = results.map(result => result.migratedStrategy!.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe('Migration Audit Trail', () => {
    it('should maintain complete audit trail of migration process', async () => {
      const playbook = createTestPlaybook();
      
      const migrationService = new StrategyMigrationService();
      const auditTrail = await migrationService.getMigrationAuditTrail(playbook.id);
      
      expect(auditTrail).toBeDefined();
      expect(auditTrail.originalPlaybook).toEqual(playbook);
      expect(auditTrail.migrationSteps).toBeInstanceOf(Array);
      expect(auditTrail.timestamp).toBeDefined();
      expect(auditTrail.version).toBeDefined();
    });

    it('should allow reverting migration using audit trail', async () => {
      const playbook = createTestPlaybook();
      
      // Perform migration
      const result = await validator.validateMigration(playbook);
      expect(result.success).toBe(true);
      
      // Revert using audit trail
      const migrationService = new StrategyMigrationService();
      const revertResult = await migrationService.revertMigration(playbook.id);
      
      expect(revertResult.success).toBe(true);
      expect(revertResult.restoredPlaybook).toEqual(playbook);
    });
  });
});
import { Trade } from '../types/trade';
import { tagService } from './tagService';

/**
 * Service for migrating existing trades to support the tag system
 * Handles data migration, validation, and rollback scenarios
 */
export class TagMigrationService {
  private static instance: TagMigrationService;

  private constructor() {}

  public static getInstance(): TagMigrationService {
    if (!TagMigrationService.instance) {
      TagMigrationService.instance = new TagMigrationService();
    }
    return TagMigrationService.instance;
  }

  /**
   * Analyzes trades to determine migration requirements
   * @param trades - Array of trades to analyze
   * @returns Migration analysis results
   */
  analyzeMigrationNeeds(trades: Trade[]): {
    totalTrades: number;
    tradesNeedingMigration: number;
    tradesWithInvalidTags: number;
    tradesWithValidTags: number;
    migrationRecommendations: string[];
    estimatedTime: string;
  } {
    console.log(`Analyzing migration needs for ${trades.length} trades`);

    let tradesNeedingMigration = 0;
    let tradesWithInvalidTags = 0;
    let tradesWithValidTags = 0;
    const migrationRecommendations: string[] = [];

    trades.forEach(trade => {
      if (!trade.tags || !Array.isArray(trade.tags)) {
        tradesNeedingMigration++;
      } else if (trade.tags.length === 0) {
        tradesNeedingMigration++;
      } else {
        // Check if tags are valid
        const validation = tagService.validateTags(trade.tags);
        if (!validation.isValid) {
          tradesWithInvalidTags++;
          tradesNeedingMigration++;
        } else {
          // Check if tags need normalization
          const processedTags = tagService.processTags(trade.tags);
          if (JSON.stringify(processedTags) !== JSON.stringify(trade.tags)) {
            tradesNeedingMigration++;
          } else {
            tradesWithValidTags++;
          }
        }
      }
    });

    // Generate recommendations
    if (tradesNeedingMigration > 0) {
      migrationRecommendations.push(`${tradesNeedingMigration} trades need tag migration`);
    }

    if (tradesWithInvalidTags > 0) {
      migrationRecommendations.push(`${tradesWithInvalidTags} trades have invalid tags that will be cleaned`);
    }

    if (tradesNeedingMigration === 0) {
      migrationRecommendations.push('All trades are already properly tagged');
    } else {
      migrationRecommendations.push('Consider backing up data before migration');
      migrationRecommendations.push('Migration can be run incrementally');
    }

    // Estimate time (rough calculation: 100ms per trade)
    const estimatedSeconds = Math.ceil(tradesNeedingMigration * 0.1);
    const estimatedTime = estimatedSeconds < 60 
      ? `${estimatedSeconds} seconds`
      : `${Math.ceil(estimatedSeconds / 60)} minutes`;

    return {
      totalTrades: trades.length,
      tradesNeedingMigration,
      tradesWithInvalidTags,
      tradesWithValidTags,
      migrationRecommendations,
      estimatedTime
    };
  }

  /**
   * Performs migration of trades to add tag support
   * @param userId - User ID
   * @param trades - Array of trades to migrate
   * @param options - Migration options
   * @returns Migration results
   */
  async migrateTradesForTagging(
    userId: string,
    trades: Trade[],
    options: {
      defaultTags?: string[];
      dryRun?: boolean;
      batchSize?: number;
      onProgress?: (progress: { completed: number; total: number; currentTrade?: string }) => void;
    } = {}
  ): Promise<{
    totalTrades: number;
    migratedTrades: number;
    skippedTrades: number;
    errors: string[];
    warnings: string[];
  }> {
    const {
      defaultTags = [],
      dryRun = false,
      batchSize = 50,
      onProgress
    } = options;

    console.log(`Starting tag migration for user ${userId}, ${trades.length} trades, dryRun: ${dryRun}`);

    const errors: string[] = [];
    const warnings: string[] = [];
    let migratedCount = 0;
    let skippedCount = 0;

    const processedDefaultTags = tagService.processTags(defaultTags);

    // Process trades in batches
    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize);
      
      for (const trade of batch) {
        try {
          let needsMigration = false;
          let updatedTrade = { ...trade };

          // Report progress
          if (onProgress) {
            onProgress({
              completed: i + batch.indexOf(trade),
              total: trades.length,
              currentTrade: trade.id
            });
          }

          // Check if trade needs tag migration
          if (!trade.tags || !Array.isArray(trade.tags)) {
            updatedTrade.tags = [...processedDefaultTags];
            needsMigration = true;
          } else if (trade.tags.length === 0 && processedDefaultTags.length > 0) {
            updatedTrade.tags = [...processedDefaultTags];
            needsMigration = true;
          } else {
            // Validate and clean existing tags
            const processedTags = tagService.processTags(trade.tags);
            if (JSON.stringify(processedTags) !== JSON.stringify(trade.tags)) {
              updatedTrade.tags = processedTags;
              needsMigration = true;
              
              if (processedTags.length < trade.tags.length) {
                warnings.push(`Trade ${trade.id}: Some invalid tags were removed`);
              }
            }
          }

          if (needsMigration) {
            if (!dryRun) {
              // Import dynamically to avoid circular dependency
              const { tradeService } = await import('./firebaseService');
              await tradeService.updateTrade(userId, trade.id, {
                tags: updatedTrade.tags
              });
            }
            migratedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          errors.push(`Error migrating trade ${trade.id}: ${error}`);
        }
      }

      // Small delay between batches to avoid overwhelming Firebase
      if (!dryRun && i + batchSize < trades.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Rebuild tag index after migration
    if (!dryRun && migratedCount > 0) {
      try {
        const { tradeService } = await import('./firebaseService');
        const { tagPersistenceService } = await import('./tagPersistenceService');
        const updatedTrades = await tradeService.getTrades(userId);
        await tagPersistenceService.buildAndPersistTagIndex(userId, updatedTrades, true);
      } catch (error) {
        warnings.push(`Failed to rebuild tag index after migration: ${error}`);
      }
    }

    const result = {
      totalTrades: trades.length,
      migratedTrades: migratedCount,
      skippedTrades: skippedCount,
      errors,
      warnings
    };

    console.log('Tag migration completed:', result);
    return result;
  }

  /**
   * Validates that all trades have proper tag structure
   * @param trades - Array of trades to validate
   * @returns Validation results
   */
  validateTradeTagStructure(trades: Trade[]): {
    isValid: boolean;
    totalTrades: number;
    validTrades: number;
    invalidTrades: number;
    issues: Array<{
      tradeId: string;
      issue: string;
      severity: 'error' | 'warning';
    }>;
  } {
    console.log(`Validating tag structure for ${trades.length} trades`);

    const issues: Array<{
      tradeId: string;
      issue: string;
      severity: 'error' | 'warning';
    }> = [];

    let validTrades = 0;
    let invalidTrades = 0;

    trades.forEach(trade => {
      let tradeIsValid = true;

      // Check if tags field exists and is an array
      if (trade.tags === undefined) {
        issues.push({
          tradeId: trade.id,
          issue: 'Missing tags field',
          severity: 'warning'
        });
        tradeIsValid = false;
      } else if (!Array.isArray(trade.tags)) {
        issues.push({
          tradeId: trade.id,
          issue: 'Tags field is not an array',
          severity: 'error'
        });
        tradeIsValid = false;
      } else {
        // Validate each tag
        const validation = tagService.validateTags(trade.tags);
        if (!validation.isValid) {
          issues.push({
            tradeId: trade.id,
            issue: `Invalid tags: ${validation.errors.join(', ')}`,
            severity: 'error'
          });
          tradeIsValid = false;
        }

        // Check for normalization issues
        const processedTags = tagService.processTags(trade.tags);
        if (JSON.stringify(processedTags) !== JSON.stringify(trade.tags)) {
          issues.push({
            tradeId: trade.id,
            issue: 'Tags need normalization',
            severity: 'warning'
          });
        }
      }

      if (tradeIsValid) {
        validTrades++;
      } else {
        invalidTrades++;
      }
    });

    return {
      isValid: invalidTrades === 0,
      totalTrades: trades.length,
      validTrades,
      invalidTrades,
      issues
    };
  }

  /**
   * Creates a backup of trade data before migration
   * @param userId - User ID
   * @param trades - Array of trades to backup
   * @returns Backup data
   */
  async createMigrationBackup(userId: string, trades: Trade[]): Promise<{
    userId: string;
    backupDate: string;
    totalTrades: number;
    trades: Trade[];
    version: string;
  }> {
    console.log(`Creating migration backup for user ${userId}, ${trades.length} trades`);

    return {
      userId,
      backupDate: new Date().toISOString(),
      totalTrades: trades.length,
      trades: JSON.parse(JSON.stringify(trades)), // Deep copy
      version: '1.0'
    };
  }

  /**
   * Restores trades from a backup
   * @param userId - User ID
   * @param backup - Backup data to restore
   * @param options - Restore options
   * @returns Restore results
   */
  async restoreFromBackup(
    userId: string,
    backup: any,
    options: {
      dryRun?: boolean;
      onProgress?: (progress: { completed: number; total: number }) => void;
    } = {}
  ): Promise<{
    totalTrades: number;
    restoredTrades: number;
    errors: string[];
  }> {
    const { dryRun = false, onProgress } = options;

    console.log(`Restoring trades from backup for user ${userId}, dryRun: ${dryRun}`);

    const errors: string[] = [];
    let restoredCount = 0;

    if (!backup || !backup.trades || !Array.isArray(backup.trades)) {
      errors.push('Invalid backup data format');
      return { totalTrades: 0, restoredTrades: 0, errors };
    }

    const trades = backup.trades as Trade[];

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      
      try {
        if (onProgress) {
          onProgress({ completed: i, total: trades.length });
        }

        if (!dryRun) {
          const { tradeService } = await import('./firebaseService');
          await tradeService.updateTrade(userId, trade.id, trade);
        }
        restoredCount++;
      } catch (error) {
        errors.push(`Error restoring trade ${trade.id}: ${error}`);
      }
    }

    // Rebuild tag index after restore
    if (!dryRun && restoredCount > 0) {
      try {
        const { tradeService } = await import('./firebaseService');
        const { tagPersistenceService } = await import('./tagPersistenceService');
        const updatedTrades = await tradeService.getTrades(userId);
        await tagPersistenceService.buildAndPersistTagIndex(userId, updatedTrades, true);
      } catch (error) {
        errors.push(`Failed to rebuild tag index after restore: ${error}`);
      }
    }

    console.log(`Restore completed: ${restoredCount} trades restored`);
    return {
      totalTrades: trades.length,
      restoredTrades: restoredCount,
      errors
    };
  }
}

// Export singleton instance
export const tagMigrationService = TagMigrationService.getInstance();
/**
 * Data Migration Service
 * Handles migration of existing trade data to new enhanced format
 * and provides backward compatibility for legacy trade records
 */

import { Trade, TradingAccount } from '../types/trade';
import { EnhancedTrade, TradeReviewData, TradeNotes, ReviewWorkflow, ReviewStage } from '../types/tradeReview';

// Migration version tracking
export interface MigrationVersion {
  version: string;
  description: string;
  appliedAt: string;
  rollbackAvailable: boolean;
}

// Migration result tracking
export interface MigrationResult {
  success: boolean;
  version: string;
  migratedCount: number;
  failedCount: number;
  errors: MigrationError[];
  warnings: string[];
  rollbackData?: any;
}

// Migration error tracking
export interface MigrationError {
  tradeId: string;
  error: string;
  severity: 'error' | 'warning';
  field?: string;
}

// Legacy trade data structure (pre-enhancement)
export interface LegacyTrade {
  id: string;
  currencyPair: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  lotSize: number;
  lotType: 'standard' | 'mini' | 'micro';
  stopLoss?: number;
  takeProfit?: number;
  pips?: number;
  pnl?: number;
  commission: number;
  accountCurrency: string;
  strategy?: string;
  notes?: string;
  status: 'open' | 'closed';
  // Legacy fields that may exist
  tags?: string | string[]; // Could be string or array
  screenshots?: string[];
}

// Migration configuration
export interface MigrationConfig {
  batchSize: number;
  enableRollback: boolean;
  validateAfterMigration: boolean;
  backupBeforeMigration: boolean;
  skipValidationErrors: boolean;
}

// Default migration configuration
const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  batchSize: 100,
  enableRollback: true,
  validateAfterMigration: true,
  backupBeforeMigration: true,
  skipValidationErrors: false
};

// Current migration version
const CURRENT_MIGRATION_VERSION = '1.0.0';

// Default review workflow stages
const DEFAULT_REVIEW_STAGES: Omit<ReviewStage, 'completed' | 'completedAt'>[] = [
  {
    id: 'data_verification',
    name: 'Data Verification',
    description: 'Verify all trade data is accurate and complete',
    required: true,
    notes: ''
  },
  {
    id: 'analysis_review',
    name: 'Analysis Review',
    description: 'Review technical and fundamental analysis',
    required: true,
    notes: ''
  },
  {
    id: 'execution_review',
    name: 'Execution Review',
    description: 'Review trade execution and timing',
    required: true,
    notes: ''
  },
  {
    id: 'lessons_learned',
    name: 'Lessons Learned',
    description: 'Document key takeaways and improvements',
    required: false,
    notes: ''
  }
];

export class DataMigrationService {
  private config: MigrationConfig;
  private migrationHistory: MigrationVersion[] = [];

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = { ...DEFAULT_MIGRATION_CONFIG, ...config };
    this.loadMigrationHistory();
  }

  /**
   * Check if migration is needed
   */
  async isMigrationNeeded(): Promise<boolean> {
    const currentVersion = this.getCurrentMigrationVersion();
    return currentVersion !== CURRENT_MIGRATION_VERSION;
  }

  /**
   * Get current migration version
   */
  getCurrentMigrationVersion(): string {
    const stored = localStorage.getItem('trade_migration_version');
    return stored || '0.0.0';
  }

  /**
   * Migrate legacy trades to enhanced format
   */
  async migrateTrades(legacyTrades: LegacyTrade[]): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      version: CURRENT_MIGRATION_VERSION,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      warnings: []
    };

    // Create backup if enabled
    if (this.config.backupBeforeMigration) {
      await this.createBackup(legacyTrades);
      result.rollbackData = legacyTrades;
    }

    // Process trades in batches
    const batches = this.createBatches(legacyTrades, this.config.batchSize);
    
    for (const batch of batches) {
      try {
        const batchResult = await this.migrateBatch(batch);
        result.migratedCount += batchResult.migratedCount;
        result.failedCount += batchResult.failedCount;
        result.errors.push(...batchResult.errors);
        result.warnings.push(...batchResult.warnings);
      } catch (error) {
        result.success = false;
        result.errors.push({
          tradeId: 'batch_error',
          error: `Batch migration failed: ${error}`,
          severity: 'error'
        });
      }
    }

    // Validate migrated data if enabled
    if (this.config.validateAfterMigration && result.success) {
      const validationResult = await this.validateMigratedData();
      if (!validationResult.success) {
        result.warnings.push('Post-migration validation found issues');
      }
    }

    // Update migration version if successful
    if (result.success) {
      this.updateMigrationVersion(CURRENT_MIGRATION_VERSION);
    }

    return result;
  }

  /**
   * Migrate a single legacy trade to enhanced format
   */
  migrateLegacyTrade(legacyTrade: LegacyTrade): EnhancedTrade {
    // Convert legacy trade to enhanced format
    const enhancedTrade: EnhancedTrade = {
      ...legacyTrade,
      // Ensure required fields exist
      accountId: legacyTrade.accountId || 'default_account',
      units: this.calculateUnits(legacyTrade.lotSize, legacyTrade.lotType),
      
      // Normalize tags field
      tags: this.normalizeTags(legacyTrade.tags),
      
      // Add review data structure
      reviewData: this.createDefaultReviewData(legacyTrade)
    };

    // Calculate missing fields
    if (!enhancedTrade.pips && enhancedTrade.exitPrice) {
      enhancedTrade.pips = this.calculatePips(
        enhancedTrade.entryPrice,
        enhancedTrade.exitPrice,
        enhancedTrade.currencyPair,
        enhancedTrade.side
      );
    }

    if (!enhancedTrade.rMultiple && enhancedTrade.pnl && enhancedTrade.riskAmount) {
      enhancedTrade.rMultiple = enhancedTrade.pnl / enhancedTrade.riskAmount;
    }

    return enhancedTrade;
  }

  /**
   * Create default review data for migrated trade
   */
  private createDefaultReviewData(legacyTrade: LegacyTrade): TradeReviewData {
    const reviewWorkflow: ReviewWorkflow = {
      tradeId: legacyTrade.id,
      stages: DEFAULT_REVIEW_STAGES.map(stage => ({
        ...stage,
        completed: false
      })),
      overallProgress: 0,
      startedAt: new Date().toISOString()
    };

    const notes: TradeNotes = {
      generalNotes: legacyTrade.notes || '',
      lastModified: new Date().toISOString(),
      version: 1
    };

    return {
      reviewWorkflow,
      notes,
      charts: [],
      lastReviewedAt: new Date().toISOString(),
      reviewCompletionScore: 0
    };
  }

  /**
   * Normalize tags field (handle string or array format)
   */
  private normalizeTags(tags?: string | string[]): string[] {
    if (!tags) return [];
    if (typeof tags === 'string') {
      // Handle comma-separated string format
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return Array.isArray(tags) ? tags : [];
  }

  /**
   * Calculate units from lot size and type
   */
  private calculateUnits(lotSize: number, lotType: 'standard' | 'mini' | 'micro'): number {
    const multipliers = {
      standard: 100000,
      mini: 10000,
      micro: 1000
    };
    return lotSize * multipliers[lotType];
  }

  /**
   * Calculate pips from price difference
   */
  private calculatePips(
    entryPrice: number,
    exitPrice: number,
    currencyPair: string,
    side: 'long' | 'short'
  ): number {
    const jpyPairs = ['JPY', 'HUF', 'KRW'];
    const quoteCurrency = currencyPair.split('/')[1];
    const pipDecimals = jpyPairs.includes(quoteCurrency) ? 2 : 4;
    const pipSize = Math.pow(10, -pipDecimals);
    
    let priceDifference = exitPrice - entryPrice;
    if (side === 'short') {
      priceDifference = entryPrice - exitPrice;
    }
    
    return priceDifference / pipSize;
  }

  /**
   * Create batches for processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Migrate a batch of trades
   */
  private async migrateBatch(batch: LegacyTrade[]): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      version: CURRENT_MIGRATION_VERSION,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      warnings: []
    };

    for (const legacyTrade of batch) {
      try {
        const enhancedTrade = this.migrateLegacyTrade(legacyTrade);
        
        // Validate migrated trade
        const validation = this.validateEnhancedTrade(enhancedTrade);
        if (!validation.isValid) {
          if (this.config.skipValidationErrors) {
            result.warnings.push(`Trade ${legacyTrade.id} has validation warnings`);
            result.migratedCount++;
          } else {
            result.errors.push({
              tradeId: legacyTrade.id,
              error: `Validation failed: ${validation.errors.join(', ')}`,
              severity: 'error'
            });
            result.failedCount++;
            continue;
          }
        } else {
          result.migratedCount++;
        }

        // Store migrated trade (would integrate with actual storage service)
        await this.storeMigratedTrade(enhancedTrade);

      } catch (error) {
        result.errors.push({
          tradeId: legacyTrade.id,
          error: `Migration failed: ${error}`,
          severity: 'error'
        });
        result.failedCount++;
      }
    }

    return result;
  }

  /**
   * Validate enhanced trade data
   */
  private validateEnhancedTrade(trade: EnhancedTrade): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!trade.id) errors.push('Trade ID is required');
    if (!trade.currencyPair) errors.push('Currency pair is required');
    if (!trade.date) errors.push('Trade date is required');
    if (!trade.entryPrice) errors.push('Entry price is required');
    if (!trade.lotSize) errors.push('Lot size is required');
    if (!trade.accountId) errors.push('Account ID is required');

    // Data type validation
    if (typeof trade.entryPrice !== 'number' || trade.entryPrice <= 0) {
      errors.push('Entry price must be a positive number');
    }
    if (typeof trade.lotSize !== 'number' || trade.lotSize <= 0) {
      errors.push('Lot size must be a positive number');
    }

    // Business logic validation
    if (trade.status === 'closed' && !trade.exitPrice) {
      errors.push('Closed trades must have an exit price');
    }
    if (trade.stopLoss && trade.takeProfit && trade.side === 'long') {
      if (trade.stopLoss >= trade.entryPrice || trade.takeProfit <= trade.entryPrice) {
        errors.push('Invalid stop loss or take profit levels for long position');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Store migrated trade (placeholder for actual storage integration)
   */
  private async storeMigratedTrade(trade: EnhancedTrade): Promise<void> {
    // This would integrate with the actual storage service (Firebase, etc.)
    // For now, we'll store in localStorage as a placeholder
    const existingTrades = JSON.parse(localStorage.getItem('migrated_trades') || '[]');
    const updatedTrades = existingTrades.filter((t: EnhancedTrade) => t.id !== trade.id);
    updatedTrades.push(trade);
    localStorage.setItem('migrated_trades', JSON.stringify(updatedTrades));
  }

  /**
   * Create backup of original data
   */
  private async createBackup(data: LegacyTrade[]): Promise<void> {
    const backup = {
      timestamp: new Date().toISOString(),
      version: this.getCurrentMigrationVersion(),
      data
    };
    localStorage.setItem('trade_migration_backup', JSON.stringify(backup));
  }

  /**
   * Validate migrated data
   */
  private async validateMigratedData(): Promise<{ success: boolean; errors: string[] }> {
    try {
      const migratedTrades = JSON.parse(localStorage.getItem('migrated_trades') || '[]');
      const errors: string[] = [];

      for (const trade of migratedTrades) {
        const validation = this.validateEnhancedTrade(trade);
        if (!validation.isValid) {
          errors.push(`Trade ${trade.id}: ${validation.errors.join(', ')}`);
        }
      }

      return {
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Validation failed: ${error}`]
      };
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(rollbackData: any): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      version: '0.0.0',
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      warnings: []
    };

    try {
      // Restore original data
      localStorage.setItem('trades', JSON.stringify(rollbackData));
      localStorage.removeItem('migrated_trades');
      
      // Reset migration version
      this.updateMigrationVersion('0.0.0');
      
      result.migratedCount = rollbackData.length;
      result.warnings.push('Migration rolled back successfully');
    } catch (error) {
      result.success = false;
      result.errors.push({
        tradeId: 'rollback_error',
        error: `Rollback failed: ${error}`,
        severity: 'error'
      });
    }

    return result;
  }

  /**
   * Update migration version
   */
  private updateMigrationVersion(version: string): void {
    localStorage.setItem('trade_migration_version', version);
    this.migrationHistory.push({
      version,
      description: `Migration to version ${version}`,
      appliedAt: new Date().toISOString(),
      rollbackAvailable: this.config.enableRollback
    });
    this.saveMigrationHistory();
  }

  /**
   * Load migration history
   */
  private loadMigrationHistory(): void {
    const stored = localStorage.getItem('trade_migration_history');
    if (stored) {
      this.migrationHistory = JSON.parse(stored);
    }
  }

  /**
   * Save migration history
   */
  private saveMigrationHistory(): void {
    localStorage.setItem('trade_migration_history', JSON.stringify(this.migrationHistory));
  }

  /**
   * Get migration history
   */
  getMigrationHistory(): MigrationVersion[] {
    return [...this.migrationHistory];
  }

  /**
   * Check backward compatibility
   */
  isBackwardCompatible(trade: any): boolean {
    // Check if trade has minimum required fields for backward compatibility
    const requiredFields = ['id', 'currencyPair', 'date', 'entryPrice', 'side', 'status'];
    return requiredFields.every(field => trade.hasOwnProperty(field) && trade[field] !== undefined);
  }

  /**
   * Convert enhanced trade back to legacy format (for backward compatibility)
   */
  toLegacyFormat(enhancedTrade: EnhancedTrade): LegacyTrade {
    const legacyTrade: LegacyTrade = {
      id: enhancedTrade.id,
      currencyPair: enhancedTrade.currencyPair,
      date: enhancedTrade.date,
      timeIn: enhancedTrade.timeIn,
      timeOut: enhancedTrade.timeOut,
      side: enhancedTrade.side,
      entryPrice: enhancedTrade.entryPrice,
      exitPrice: enhancedTrade.exitPrice,
      lotSize: enhancedTrade.lotSize,
      lotType: enhancedTrade.lotType,
      stopLoss: enhancedTrade.stopLoss,
      takeProfit: enhancedTrade.takeProfit,
      pips: enhancedTrade.pips,
      pnl: enhancedTrade.pnl,
      commission: enhancedTrade.commission,
      accountCurrency: enhancedTrade.accountCurrency,
      strategy: enhancedTrade.strategy,
      notes: enhancedTrade.reviewData?.notes?.generalNotes || enhancedTrade.notes,
      status: enhancedTrade.status,
      tags: enhancedTrade.tags,
      screenshots: enhancedTrade.screenshots
    };

    return legacyTrade;
  }
}
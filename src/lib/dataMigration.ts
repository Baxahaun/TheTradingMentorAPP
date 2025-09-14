/**
 * Futures Data Migration Utility
 * Converts existing trade data to use futures terminology and structure
 * Provides backward compatibility and terminology conversion for historical data
 */

import { Trade } from '../types/trade';
import { CURRENT_TERMINOLOGY } from './terminologyConfig';
import { FUTURES_CONTRACT_SPECS, getContractSpec } from './futuresContracts';
import { DataValidationService } from './dataValidationService';

// Migration configuration interface
export interface FuturesMigrationConfig {
  batchSize: number;
  enableRollback: boolean;
  validateAfterMigration: boolean;
  backupBeforeMigration: boolean;
  skipValidationErrors: boolean;
  terminologyMode: 'forex' | 'futures' | 'auto';
  convertTerminology: boolean;
}

// Default migration configuration
const DEFAULT_FUTURES_MIGRATION_CONFIG: FuturesMigrationConfig = {
  batchSize: 100,
  enableRollback: true,
  validateAfterMigration: true,
  backupBeforeMigration: true,
  skipValidationErrors: false,
  terminologyMode: 'auto',
  convertTerminology: true
};

// Migration result interface
export interface FuturesMigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  convertedCount: number;
  errors: Array<{
    tradeId: string;
    error: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
  terminologyChanges: Array<{
    tradeId: string;
    originalField: string;
    newField: string;
    originalValue: any;
    newValue: any;
  }>;
  rollbackData?: any;
}

// Terminology conversion mapping
const TERMINOLOGY_CONVERSIONS = {
  // Field name conversions
  fieldMappings: {
    'currencyPair': 'currencyPair', // Keep as is for backward compatibility
    'lotSize': 'contractSize', // Convert to futures terminology
    'lotType': 'lotType', // Keep for compatibility
    'pips': 'points', // Convert to futures terminology
    'pipValue': 'tickValue', // Convert to futures terminology
    'units': 'contractUnits', // Convert to futures terminology
  },

  // Value conversions
  valueMappings: {
    // Lot types to contract types
    lotTypeConversions: {
      'standard': 'standard',
      'mini': 'mini',
      'micro': 'micro'
    },

    // Currency pair to futures instrument (sample mappings)
    instrumentMappings: {
      'EUR/USD': '6E', // Euro FX futures
      'GBP/USD': '6B', // British Pound futures
      'USD/JPY': '6J', // Japanese Yen futures
      'CL': 'CL', // WTI Crude Oil futures
      'ES': 'ES', // E-mini S&P 500 futures
      'NQ': 'NQ', // E-mini Nasdaq futures
      'GC': 'GC', // Gold futures
      'SI': 'SI'  // Silver futures
    } as Record<string, string>
  }
};

// Safe accessor for instrument mappings
const getInstrumentMapping = (currencyPair: string): string | undefined => {
  return TERMINOLOGY_CONVERSIONS.valueMappings.instrumentMappings[currencyPair];
};

export class FuturesDataMigrationService {
  private config: FuturesMigrationConfig;

  constructor(config: Partial<FuturesMigrationConfig> = {}) {
    this.config = { ...DEFAULT_FUTURES_MIGRATION_CONFIG, ...config };
  }

  /**
   * Migrate existing trades to futures-compatible format
   */
  async migrateTradesToFutures(trades: Trade[]): Promise<FuturesMigrationResult> {
    const result: FuturesMigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      convertedCount: 0,
      errors: [],
      warnings: [],
      terminologyChanges: []
    };

    // Create backup if enabled
    if (this.config.backupBeforeMigration) {
      await this.createBackup(trades);
      result.rollbackData = trades;
    }

    // Process trades in batches
    const batches = this.createBatches(trades, this.config.batchSize);

    for (const batch of batches) {
      try {
        const batchResult = await this.migrateBatch(batch);
        result.migratedCount += batchResult.migratedCount;
        result.failedCount += batchResult.failedCount;
        result.convertedCount += batchResult.convertedCount;
        result.errors.push(...batchResult.errors);
        result.warnings.push(...batchResult.warnings);
        result.terminologyChanges.push(...batchResult.terminologyChanges);
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
      const validationResult = await this.validateMigratedData(trades);
      if (!validationResult.success) {
        result.warnings.push('Post-migration validation found issues');
        result.errors.push(...validationResult.errors.map(err => ({
          tradeId: 'validation',
          error: err,
          severity: 'warning' as const
        })));
      }
    }

    return result;
  }

  /**
   * Convert a single trade to futures format
   */
  convertTradeToFutures(trade: Trade): {
    convertedTrade: Trade;
    terminologyChanges: FuturesMigrationResult['terminologyChanges'];
    hasChanges: boolean;
  } {
    const convertedTrade = { ...trade };
    const terminologyChanges: FuturesMigrationResult['terminologyChanges'] = [];
    let hasChanges = false;

    // Convert terminology if enabled
    if (this.config.convertTerminology) {
      // Update currency pair to futures instrument if mapping exists
      const newInstrument = getInstrumentMapping(trade.currencyPair);
      if (newInstrument) {
        terminologyChanges.push({
          tradeId: trade.id,
          originalField: 'currencyPair',
          newField: 'currencyPair',
          originalValue: trade.currencyPair,
          newValue: newInstrument
        });
        convertedTrade.currencyPair = newInstrument;
        hasChanges = true;

        // Add futures-specific fields based on instrument
        const contractSpec = getContractSpec(newInstrument);
        if (contractSpec) {
          if (convertedTrade.contractSize === undefined) {
            convertedTrade.contractSize = trade.lotSize;
            terminologyChanges.push({
              tradeId: trade.id,
              originalField: 'lotSize',
              newField: 'contractSize',
              originalValue: trade.lotSize,
              newValue: trade.lotSize
            });
            hasChanges = true;
          }

          if (convertedTrade.tickValue === undefined) {
            convertedTrade.tickValue = contractSpec.tickValue;
            terminologyChanges.push({
              tradeId: trade.id,
              originalField: 'pipValue',
              newField: 'tickValue',
              originalValue: trade.pipValue || 'undefined',
              newValue: contractSpec.tickValue
            });
            hasChanges = true;
          }

          if (convertedTrade.tickSize === undefined) {
            convertedTrade.tickSize = contractSpec.tickSize;
            terminologyChanges.push({
              tradeId: trade.id,
              originalField: 'pipSize',
              newField: 'tickSize',
              originalValue: 'calculated',
              newValue: contractSpec.tickSize
            });
            hasChanges = true;
          }

          if (convertedTrade.marginRequirement === undefined) {
            convertedTrade.marginRequirement = contractSpec.initialMargin;
            terminologyChanges.push({
              tradeId: trade.id,
              originalField: 'margin',
              newField: 'marginRequirement',
              originalValue: 'undefined',
              newValue: contractSpec.initialMargin
            });
            hasChanges = true;
          }

          if (convertedTrade.exchange === undefined) {
            convertedTrade.exchange = contractSpec.exchange;
            terminologyChanges.push({
              tradeId: trade.id,
              originalField: 'exchange',
              newField: 'exchange',
              originalValue: 'undefined',
              newValue: contractSpec.exchange
            });
            hasChanges = true;
          }
        }
      }

      // Convert pips to points terminology (this is more of a display change)
      if (trade.pips !== undefined) {
        terminologyChanges.push({
          tradeId: trade.id,
          originalField: 'pips',
          newField: 'points',
          originalValue: trade.pips,
          newValue: trade.pips // Value stays the same, terminology changes
        });
        hasChanges = true;
      }

      // Convert lot terminology to contract terminology
      if (trade.lotSize !== undefined && !convertedTrade.contractSize) {
        terminologyChanges.push({
          tradeId: trade.id,
          originalField: 'lotSize',
          newField: 'contractSize',
          originalValue: trade.lotSize,
          newValue: trade.lotSize
        });
        hasChanges = true;
      }
    }

    return {
      convertedTrade,
      terminologyChanges,
      hasChanges
    };
  }

  /**
   * Check if a trade is already in futures format
   */
  isFuturesTrade(trade: Trade): boolean {
    return !!(
      trade.contractSize ||
      trade.tickValue ||
      trade.tickSize ||
      trade.marginRequirement ||
      trade.exchange ||
      TERMINOLOGY_CONVERSIONS.valueMappings.instrumentMappings[trade.currencyPair]
    );
  }

  /**
   * Get terminology conversion suggestions for a trade
   */
  getTerminologySuggestions(trade: Trade): Array<{
    field: string;
    currentValue: any;
    suggestedValue: any;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    const suggestions = [];

    // Check if currency pair has futures equivalent
    const instrumentMapping = getInstrumentMapping(trade.currencyPair);
    if (instrumentMapping) {
      suggestions.push({
        field: 'currencyPair',
        currentValue: trade.currencyPair,
        suggestedValue: instrumentMapping,
        reason: 'Currency pair has direct futures equivalent',
        confidence: 'high' as const
      });
    }

    // Suggest adding futures-specific fields
    if (!trade.contractSize && trade.lotSize) {
      suggestions.push({
        field: 'contractSize',
        currentValue: trade.lotSize,
        suggestedValue: trade.lotSize,
        reason: 'Convert lot size to contract size for futures compatibility',
        confidence: 'high' as const
      });
    }

    if (!trade.tickValue && trade.pipValue) {
      suggestions.push({
        field: 'tickValue',
        currentValue: trade.pipValue,
        suggestedValue: trade.pipValue,
        reason: 'Convert pip value to tick value for futures compatibility',
        confidence: 'medium' as const
      });
    }

    return suggestions;
  }

  /**
   * Validate futures migration compatibility
   */
  validateFuturesMigration(trade: Trade): {
    isCompatible: boolean;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      field?: string;
    }>;
  } {
    const issues = [];

    // Check if trade has required fields for futures conversion
    if (!trade.currencyPair) {
      issues.push({
        type: 'error' as const,
        message: 'Trade must have a currency pair for futures conversion',
        field: 'currencyPair'
      });
    }

    // Check if currency pair has futures equivalent
    const instrumentMapping = getInstrumentMapping(trade.currencyPair);
    if (trade.currencyPair && !instrumentMapping) {
      issues.push({
        type: 'warning' as const,
        message: 'Currency pair does not have a direct futures equivalent. Manual mapping may be required.',
        field: 'currencyPair'
      });
    }

    // Check if trade already has futures fields
    if (this.isFuturesTrade(trade)) {
      issues.push({
        type: 'info' as const,
        message: 'Trade already contains futures-specific fields'
      });
    }

    return {
      isCompatible: !issues.some(issue => issue.type === 'error'),
      issues
    };
  }

  /**
   * Generate futures migration report
   */
  generateMigrationReport(trades: Trade[]): {
    totalTrades: number;
    futuresCompatible: number;
    needsConversion: number;
    incompatible: number;
    suggestions: Array<{
      tradeId: string;
      suggestions: Array<{
        field: string;
        currentValue: any;
        suggestedValue: any;
        reason: string;
      }>;
    }>;
  } {
    const report = {
      totalTrades: trades.length,
      futuresCompatible: 0,
      needsConversion: 0,
      incompatible: 0,
      suggestions: [] as Array<{
        tradeId: string;
        suggestions: Array<{
          field: string;
          currentValue: any;
          suggestedValue: any;
          reason: string;
        }>;
      }>
    };

    trades.forEach(trade => {
      const validation = this.validateFuturesMigration(trade);
      const suggestions = this.getTerminologySuggestions(trade);

      if (validation.isCompatible) {
        if (this.isFuturesTrade(trade)) {
          report.futuresCompatible++;
        } else if (suggestions.length > 0) {
          report.needsConversion++;
          report.suggestions.push({
            tradeId: trade.id,
            suggestions: suggestions.map(s => ({
              field: s.field,
              currentValue: s.currentValue,
              suggestedValue: s.suggestedValue,
              reason: s.reason
            }))
          });
        } else {
          report.futuresCompatible++; // Can remain as-is
        }
      } else {
        report.incompatible++;
      }
    });

    return report;
  }

  /**
   * Private helper methods
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async migrateBatch(batch: Trade[]): Promise<{
    migratedCount: number;
    failedCount: number;
    convertedCount: number;
    errors: FuturesMigrationResult['errors'];
    warnings: string[];
    terminologyChanges: FuturesMigrationResult['terminologyChanges'];
  }> {
    const result = {
      migratedCount: 0,
      failedCount: 0,
      convertedCount: 0,
      errors: [] as FuturesMigrationResult['errors'],
      warnings: [] as string[],
      terminologyChanges: [] as FuturesMigrationResult['terminologyChanges']
    };

    for (const trade of batch) {
      try {
        const conversion = this.convertTradeToFutures(trade);

        if (conversion.hasChanges) {
          result.convertedCount++;
        }

        result.terminologyChanges.push(...conversion.terminologyChanges);
        result.migratedCount++;

        // Store migrated trade (would integrate with actual storage)
        await this.storeMigratedTrade(conversion.convertedTrade);

      } catch (error) {
        result.errors.push({
          tradeId: trade.id,
          error: `Migration failed: ${error}`,
          severity: 'error'
        });
        result.failedCount++;
      }
    }

    return result;
  }

  private async createBackup(data: Trade[]): Promise<void> {
    const backup = {
      timestamp: new Date().toISOString(),
      type: 'futures_migration_backup',
      data
    };
    localStorage.setItem('futures_migration_backup', JSON.stringify(backup));
  }

  private async storeMigratedTrade(trade: Trade): Promise<void> {
    // This would integrate with the actual storage service
    // For now, store in localStorage as placeholder
    const existingTrades = JSON.parse(localStorage.getItem('futures_migrated_trades') || '[]');
    const updatedTrades = existingTrades.filter((t: Trade) => t.id !== trade.id);
    updatedTrades.push(trade);
    localStorage.setItem('futures_migrated_trades', JSON.stringify(updatedTrades));
  }

  private async validateMigratedData(originalTrades: Trade[]): Promise<{ success: boolean; errors: string[] }> {
    try {
      const migratedTrades = JSON.parse(localStorage.getItem('futures_migrated_trades') || '[]');
      const errors: string[] = [];

      // Basic validation - ensure trade count matches
      if (migratedTrades.length !== originalTrades.length) {
        errors.push(`Trade count mismatch: expected ${originalTrades.length}, got ${migratedTrades.length}`);
      }

      // Validate each migrated trade has required fields
      migratedTrades.forEach((trade: Trade, index: number) => {
        if (!trade.id) {
          errors.push(`Trade at index ${index} missing ID`);
        }
        if (!trade.currencyPair) {
          errors.push(`Trade ${trade.id || index} missing currency pair`);
        }
      });

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
}

/**
 * Factory function to create a futures migration service instance
 */
export function createFuturesMigrationService(
  config?: Partial<FuturesMigrationConfig>
): FuturesDataMigrationService {
  return new FuturesDataMigrationService(config);
}

/**
 * Utility function to check if a trade needs futures migration
 */
export function tradeNeedsFuturesMigration(trade: Trade): boolean {
  const service = new FuturesDataMigrationService();
  return !service.isFuturesTrade(trade) &&
         !!getInstrumentMapping(trade.currencyPair);
}

/**
 * Quick utility to convert single trade (synchronous)
 */
export function convertTradeToFuturesSync(trade: Trade): Trade {
  const service = new FuturesDataMigrationService();
  return service.convertTradeToFutures(trade).convertedTrade;
}

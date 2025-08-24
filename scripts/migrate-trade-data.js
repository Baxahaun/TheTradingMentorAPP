#!/usr/bin/env node

/**
 * Trade Data Migration Script
 * 
 * This script performs data migration for the enhanced trade review system.
 * It can be run from the command line to migrate existing trade data.
 * 
 * Usage:
 *   node scripts/migrate-trade-data.js [options]
 * 
 * Options:
 *   --dry-run          Perform a dry run without making changes
 *   --batch-size=N     Set batch size for migration (default: 100)
 *   --skip-validation  Skip validation errors and continue migration
 *   --no-backup        Skip creating backup before migration
 *   --rollback         Rollback the last migration
 *   --status           Show migration status
 *   --help             Show this help message
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  dryRun: false,
  batchSize: 100,
  skipValidation: false,
  noBackup: false,
  rollback: false,
  showStatus: false,
  showHelp: false
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (const arg of args) {
    if (arg === '--dry-run') {
      CONFIG.dryRun = true;
    } else if (arg.startsWith('--batch-size=')) {
      CONFIG.batchSize = parseInt(arg.split('=')[1]) || 100;
    } else if (arg === '--skip-validation') {
      CONFIG.skipValidation = true;
    } else if (arg === '--no-backup') {
      CONFIG.noBackup = true;
    } else if (arg === '--rollback') {
      CONFIG.rollback = true;
    } else if (arg === '--status') {
      CONFIG.showStatus = true;
    } else if (arg === '--help') {
      CONFIG.showHelp = true;
    }
  }
}

// Show help message
function showHelp() {
  console.log(`
Trade Data Migration Script

This script performs data migration for the enhanced trade review system.

Usage:
  node scripts/migrate-trade-data.js [options]

Options:
  --dry-run          Perform a dry run without making changes
  --batch-size=N     Set batch size for migration (default: 100)
  --skip-validation  Skip validation errors and continue migration
  --no-backup        Skip creating backup before migration
  --rollback         Rollback the last migration
  --status           Show migration status
  --help             Show this help message

Examples:
  node scripts/migrate-trade-data.js --dry-run
  node scripts/migrate-trade-data.js --batch-size=50 --skip-validation
  node scripts/migrate-trade-data.js --rollback
  node scripts/migrate-trade-data.js --status
`);
}

// Mock localStorage for Node.js environment
class MockLocalStorage {
  constructor() {
    this.store = {};
    this.loadFromFile();
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
    this.saveToFile();
  }

  removeItem(key) {
    delete this.store[key];
    this.saveToFile();
  }

  clear() {
    this.store = {};
    this.saveToFile();
  }

  loadFromFile() {
    const filePath = path.join(__dirname, '..', 'data', 'localStorage.json');
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.store = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load localStorage data:', error.message);
      this.store = {};
    }
  }

  saveToFile() {
    const dataDir = path.join(__dirname, '..', 'data');
    const filePath = path.join(dataDir, 'localStorage.json');
    
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(this.store, null, 2));
    } catch (error) {
      console.warn('Failed to save localStorage data:', error.message);
    }
  }
}

// Set up global localStorage for Node.js
global.localStorage = new MockLocalStorage();

// Import migration services (these would need to be compiled from TypeScript)
// For this script, we'll implement simplified versions

class SimpleMigrationService {
  constructor(config = {}) {
    this.config = {
      batchSize: 100,
      enableRollback: true,
      validateAfterMigration: true,
      backupBeforeMigration: true,
      skipValidationErrors: false,
      ...config
    };
  }

  async isMigrationNeeded() {
    const version = localStorage.getItem('trade_migration_version') || '0.0.0';
    const trades = this.loadTrades();
    return version === '0.0.0' && trades.length > 0;
  }

  loadTrades() {
    try {
      const data = localStorage.getItem('trades');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load trades:', error.message);
      return [];
    }
  }

  async migrateTrades(trades) {
    console.log(`Starting migration of ${trades.length} trades...`);
    
    const result = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      warnings: []
    };

    // Create backup if enabled
    if (this.config.backupBeforeMigration) {
      console.log('Creating backup...');
      const backup = {
        timestamp: new Date().toISOString(),
        data: trades,
        version: localStorage.getItem('trade_migration_version') || '0.0.0'
      };
      localStorage.setItem('trade_migration_backup', JSON.stringify(backup));
      console.log('Backup created successfully');
    }

    // Process trades in batches
    const batches = this.createBatches(trades, this.config.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} trades)...`);
      
      for (const trade of batch) {
        try {
          const enhancedTrade = this.migrateTrade(trade);
          result.migratedCount++;
          
          if (result.migratedCount % 10 === 0) {
            console.log(`Migrated ${result.migratedCount} trades...`);
          }
        } catch (error) {
          result.failedCount++;
          result.errors.push({
            tradeId: trade.id,
            error: error.message
          });
          
          if (!this.config.skipValidationErrors) {
            console.error(`Failed to migrate trade ${trade.id}:`, error.message);
          }
        }
      }
    }

    // Store migrated trades
    if (!CONFIG.dryRun) {
      const migratedTrades = trades.map(trade => this.migrateTrade(trade));
      localStorage.setItem('migrated_trades', JSON.stringify(migratedTrades));
      localStorage.setItem('trade_migration_version', '1.0.0');
      
      // Update migration history
      const history = JSON.parse(localStorage.getItem('trade_migration_history') || '[]');
      history.push({
        version: '1.0.0',
        description: 'Migration to enhanced trade review format',
        appliedAt: new Date().toISOString(),
        rollbackAvailable: this.config.enableRollback
      });
      localStorage.setItem('trade_migration_history', JSON.stringify(history));
    }

    return result;
  }

  migrateTrade(legacyTrade) {
    // Simple migration logic
    const enhancedTrade = {
      ...legacyTrade,
      accountId: legacyTrade.accountId || 'default_account',
      units: this.calculateUnits(legacyTrade.lotSize, legacyTrade.lotType || 'standard'),
      tags: this.normalizeTags(legacyTrade.tags),
      reviewData: {
        reviewWorkflow: {
          tradeId: legacyTrade.id,
          stages: [
            {
              id: 'data_verification',
              name: 'Data Verification',
              description: 'Verify all trade data is accurate and complete',
              required: true,
              completed: false
            },
            {
              id: 'analysis_review',
              name: 'Analysis Review',
              description: 'Review technical and fundamental analysis',
              required: true,
              completed: false
            }
          ],
          overallProgress: 0,
          startedAt: new Date().toISOString()
        },
        notes: {
          generalNotes: legacyTrade.notes || '',
          lastModified: new Date().toISOString(),
          version: 1
        },
        charts: [],
        lastReviewedAt: new Date().toISOString(),
        reviewCompletionScore: 0
      }
    };

    return enhancedTrade;
  }

  calculateUnits(lotSize, lotType) {
    const multipliers = {
      standard: 100000,
      mini: 10000,
      micro: 1000
    };
    return lotSize * (multipliers[lotType] || 100000);
  }

  normalizeTags(tags) {
    if (!tags) return [];
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return Array.isArray(tags) ? tags : [];
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async rollback() {
    console.log('Starting rollback...');
    
    const backup = localStorage.getItem('trade_migration_backup');
    if (!backup) {
      throw new Error('No backup found for rollback');
    }

    const backupData = JSON.parse(backup);
    
    if (!CONFIG.dryRun) {
      localStorage.setItem('trades', JSON.stringify(backupData.data));
      localStorage.removeItem('migrated_trades');
      localStorage.setItem('trade_migration_version', backupData.version);
    }

    console.log(`Rollback completed. Restored ${backupData.data.length} trades.`);
    
    return {
      success: true,
      restoredCount: backupData.data.length
    };
  }

  getStatus() {
    const version = localStorage.getItem('trade_migration_version') || '0.0.0';
    const trades = this.loadTrades();
    const migratedTrades = JSON.parse(localStorage.getItem('migrated_trades') || '[]');
    const backup = localStorage.getItem('trade_migration_backup');
    const history = JSON.parse(localStorage.getItem('trade_migration_history') || '[]');

    return {
      currentVersion: version,
      legacyTradeCount: trades.length,
      migratedTradeCount: migratedTrades.length,
      hasBackup: !!backup,
      migrationHistory: history,
      isMigrationNeeded: version === '0.0.0' && trades.length > 0
    };
  }
}

// Main execution function
async function main() {
  parseArgs();

  if (CONFIG.showHelp) {
    showHelp();
    return;
  }

  const migrationService = new SimpleMigrationService({
    batchSize: CONFIG.batchSize,
    skipValidationErrors: CONFIG.skipValidation,
    backupBeforeMigration: !CONFIG.noBackup,
    enableRollback: true
  });

  try {
    if (CONFIG.showStatus) {
      const status = migrationService.getStatus();
      console.log('\n=== Migration Status ===');
      console.log(`Current Version: ${status.currentVersion}`);
      console.log(`Legacy Trades: ${status.legacyTradeCount}`);
      console.log(`Migrated Trades: ${status.migratedTradeCount}`);
      console.log(`Has Backup: ${status.hasBackup ? 'Yes' : 'No'}`);
      console.log(`Migration Needed: ${status.isMigrationNeeded ? 'Yes' : 'No'}`);
      
      if (status.migrationHistory.length > 0) {
        console.log('\nMigration History:');
        status.migrationHistory.forEach(entry => {
          console.log(`  - ${entry.version}: ${entry.description} (${entry.appliedAt})`);
        });
      }
      return;
    }

    if (CONFIG.rollback) {
      if (CONFIG.dryRun) {
        console.log('DRY RUN: Would perform rollback');
        return;
      }
      
      const result = await migrationService.rollback();
      console.log(`Rollback completed successfully. Restored ${result.restoredCount} trades.`);
      return;
    }

    // Check if migration is needed
    const isNeeded = await migrationService.isMigrationNeeded();
    if (!isNeeded) {
      console.log('No migration needed. Data is already up to date.');
      return;
    }

    // Load trades
    const trades = migrationService.loadTrades();
    if (trades.length === 0) {
      console.log('No trades found to migrate.');
      return;
    }

    console.log(`Found ${trades.length} trades to migrate.`);
    
    if (CONFIG.dryRun) {
      console.log('DRY RUN: Would migrate the following trades:');
      trades.forEach(trade => {
        console.log(`  - ${trade.id}: ${trade.currencyPair} ${trade.side} (${trade.status})`);
      });
      return;
    }

    // Perform migration
    const startTime = Date.now();
    const result = await migrationService.migrateTrades(trades);
    const duration = Date.now() - startTime;

    console.log('\n=== Migration Results ===');
    console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Migrated: ${result.migratedCount} trades`);
    console.log(`Failed: ${result.failedCount} trades`);
    
    if (result.warnings.length > 0) {
      console.log(`Warnings: ${result.warnings.length}`);
      result.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    if (result.errors.length > 0) {
      console.log(`Errors: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`  - Trade ${error.tradeId}: ${error.error}`);
      });
    }

    if (result.success) {
      console.log('\nMigration completed successfully!');
      console.log('Enhanced trade review features are now available.');
    } else {
      console.log('\nMigration completed with errors.');
      console.log('Please review the errors above and consider running with --skip-validation if appropriate.');
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { SimpleMigrationService };
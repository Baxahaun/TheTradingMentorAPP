#!/usr/bin/env node

/**
 * Migration Test Script
 * 
 * This script runs comprehensive tests for the data migration system.
 * It validates the migration process with various test scenarios.
 */

const { SimpleMigrationService } = require('./migrate-trade-data');

// Test data sets
const TEST_TRADES = {
  valid: [
    {
      id: 'test_trade_1',
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
      notes: 'Good breakout trade',
      status: 'closed',
      tags: 'trend,breakout,momentum'
    },
    {
      id: 'test_trade_2',
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
      tags: ['reversal', 'resistance']
    }
  ],
  
  invalid: [
    {
      id: 'invalid_trade_1',
      // Missing required fields
      side: 'long',
      status: 'open'
    },
    {
      id: 'invalid_trade_2',
      currencyPair: 'INVALID',
      date: 'not a date',
      entryPrice: 'not a number',
      side: 'invalid_side',
      lotSize: -1,
      status: 'invalid_status'
    }
  ],
  
  mixed: [
    {
      id: 'mixed_trade_1',
      currencyPair: '  eur/usd  ', // Needs cleanup
      date: '2024-01-03',
      entryPrice: '1.0950', // String number
      side: 'long',
      lotSize: '2.0', // String number
      status: 'closed',
      commission: '7.5', // String number
      tags: 'scalping, quick, profit' // String tags with spaces
    }
  ]
};

// Mock localStorage for testing
class TestLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  // Test helper methods
  setTestData(key, data) {
    this.store[key] = JSON.stringify(data);
  }

  getTestData(key) {
    const data = this.store[key];
    return data ? JSON.parse(data) : null;
  }
}

// Test runner class
class MigrationTestRunner {
  constructor() {
    this.testResults = [];
    this.localStorage = new TestLocalStorage();
    global.localStorage = this.localStorage;
  }

  async runAllTests() {
    console.log('🧪 Starting Migration System Tests\n');

    await this.testBasicMigration();
    await this.testMigrationWithInvalidData();
    await this.testMigrationWithCleanup();
    await this.testRollbackFunctionality();
    await this.testMigrationStatus();
    await this.testBatchProcessing();
    await this.testBackupCreation();
    await this.testErrorHandling();

    this.printResults();
  }

  async testBasicMigration() {
    console.log('📋 Test: Basic Migration');
    
    try {
      // Setup
      this.localStorage.clear();
      this.localStorage.setTestData('trades', TEST_TRADES.valid);
      
      const migrationService = new SimpleMigrationService();
      
      // Test migration needed check
      const isNeeded = await migrationService.isMigrationNeeded();
      this.assert(isNeeded === true, 'Should detect migration is needed');
      
      // Perform migration
      const result = await migrationService.migrateTrades(TEST_TRADES.valid);
      
      this.assert(result.success === true, 'Migration should succeed');
      this.assert(result.migratedCount === 2, 'Should migrate 2 trades');
      this.assert(result.failedCount === 0, 'Should have no failures');
      
      // Check migrated data
      const migratedTrades = this.localStorage.getTestData('migrated_trades');
      this.assert(migratedTrades.length === 2, 'Should store 2 migrated trades');
      
      // Check enhanced structure
      const firstTrade = migratedTrades[0];
      this.assert(firstTrade.reviewData !== undefined, 'Should have review data');
      this.assert(firstTrade.reviewData.notes !== undefined, 'Should have notes structure');
      this.assert(firstTrade.reviewData.reviewWorkflow !== undefined, 'Should have workflow');
      this.assert(firstTrade.units === 100000, 'Should calculate units correctly');
      this.assert(Array.isArray(firstTrade.tags), 'Tags should be array');
      
      this.pass('Basic Migration');
      
    } catch (error) {
      this.fail('Basic Migration', error.message);
    }
  }

  async testMigrationWithInvalidData() {
    console.log('📋 Test: Migration with Invalid Data');
    
    try {
      // Setup
      this.localStorage.clear();
      this.localStorage.setTestData('trades', TEST_TRADES.invalid);
      
      const migrationService = new SimpleMigrationService({
        skipValidationErrors: true
      });
      
      // Perform migration
      const result = await migrationService.migrateTrades(TEST_TRADES.invalid);
      
      this.assert(result.success === true, 'Migration should succeed with skip validation');
      this.assert(result.migratedCount >= 0, 'Should handle invalid data gracefully');
      
      this.pass('Migration with Invalid Data');
      
    } catch (error) {
      this.fail('Migration with Invalid Data', error.message);
    }
  }

  async testMigrationWithCleanup() {
    console.log('📋 Test: Migration with Data Cleanup');
    
    try {
      // Setup
      this.localStorage.clear();
      this.localStorage.setTestData('trades', TEST_TRADES.mixed);
      
      const migrationService = new SimpleMigrationService();
      
      // Perform migration
      const result = await migrationService.migrateTrades(TEST_TRADES.mixed);
      
      this.assert(result.success === true, 'Migration should succeed');
      
      // Check cleaned data
      const migratedTrades = this.localStorage.getTestData('migrated_trades');
      const cleanedTrade = migratedTrades[0];
      
      this.assert(cleanedTrade.currencyPair === 'EUR/USD', 'Should normalize currency pair');
      this.assert(typeof cleanedTrade.entryPrice === 'number', 'Should convert string numbers');
      this.assert(Array.isArray(cleanedTrade.tags), 'Should normalize tags to array');
      
      this.pass('Migration with Data Cleanup');
      
    } catch (error) {
      this.fail('Migration with Data Cleanup', error.message);
    }
  }

  async testRollbackFunctionality() {
    console.log('📋 Test: Rollback Functionality');
    
    try {
      // Setup
      this.localStorage.clear();
      this.localStorage.setTestData('trades', TEST_TRADES.valid);
      
      const migrationService = new SimpleMigrationService();
      
      // Perform migration
      await migrationService.migrateTrades(TEST_TRADES.valid);
      
      // Check migration completed
      const version = this.localStorage.getItem('trade_migration_version');
      this.assert(version === '1.0.0', 'Migration version should be updated');
      
      // Perform rollback
      const rollbackResult = await migrationService.rollback();
      
      this.assert(rollbackResult.success === true, 'Rollback should succeed');
      this.assert(rollbackResult.restoredCount === 2, 'Should restore 2 trades');
      
      // Check rollback completed
      const restoredTrades = this.localStorage.getTestData('trades');
      this.assert(restoredTrades.length === 2, 'Should restore original trades');
      
      this.pass('Rollback Functionality');
      
    } catch (error) {
      this.fail('Rollback Functionality', error.message);
    }
  }

  async testMigrationStatus() {
    console.log('📋 Test: Migration Status');
    
    try {
      // Setup
      this.localStorage.clear();
      this.localStorage.setTestData('trades', TEST_TRADES.valid);
      
      const migrationService = new SimpleMigrationService();
      
      // Check initial status
      let status = migrationService.getStatus();
      this.assert(status.currentVersion === '0.0.0', 'Initial version should be 0.0.0');
      this.assert(status.isMigrationNeeded === true, 'Should need migration');
      this.assert(status.legacyTradeCount === 2, 'Should count legacy trades');
      
      // Perform migration
      await migrationService.migrateTrades(TEST_TRADES.valid);
      
      // Check post-migration status
      status = migrationService.getStatus();
      this.assert(status.currentVersion === '1.0.0', 'Version should be updated');
      this.assert(status.migratedTradeCount === 2, 'Should count migrated trades');
      this.assert(status.hasBackup === true, 'Should have backup');
      
      this.pass('Migration Status');
      
    } catch (error) {
      this.fail('Migration Status', error.message);
    }
  }

  async testBatchProcessing() {
    console.log('📋 Test: Batch Processing');
    
    try {
      // Setup with small batch size
      this.localStorage.clear();
      const largeTrades = [];
      for (let i = 0; i < 5; i++) {
        largeTrades.push({
          ...TEST_TRADES.valid[0],
          id: `batch_trade_${i}`
        });
      }
      this.localStorage.setTestData('trades', largeTrades);
      
      const migrationService = new SimpleMigrationService({
        batchSize: 2
      });
      
      // Perform migration
      const result = await migrationService.migrateTrades(largeTrades);
      
      this.assert(result.success === true, 'Batch migration should succeed');
      this.assert(result.migratedCount === 5, 'Should migrate all trades in batches');
      
      this.pass('Batch Processing');
      
    } catch (error) {
      this.fail('Batch Processing', error.message);
    }
  }

  async testBackupCreation() {
    console.log('📋 Test: Backup Creation');
    
    try {
      // Setup
      this.localStorage.clear();
      this.localStorage.setTestData('trades', TEST_TRADES.valid);
      
      const migrationService = new SimpleMigrationService({
        backupBeforeMigration: true
      });
      
      // Perform migration
      await migrationService.migrateTrades(TEST_TRADES.valid);
      
      // Check backup was created
      const backup = this.localStorage.getTestData('trade_migration_backup');
      this.assert(backup !== null, 'Backup should be created');
      this.assert(backup.data.length === 2, 'Backup should contain original data');
      this.assert(backup.timestamp !== undefined, 'Backup should have timestamp');
      
      this.pass('Backup Creation');
      
    } catch (error) {
      this.fail('Backup Creation', error.message);
    }
  }

  async testErrorHandling() {
    console.log('📋 Test: Error Handling');
    
    try {
      // Test rollback without backup
      this.localStorage.clear();
      const migrationService = new SimpleMigrationService();
      
      try {
        await migrationService.rollback();
        this.fail('Error Handling', 'Should throw error when no backup exists');
      } catch (error) {
        this.assert(error.message.includes('No backup found'), 'Should throw appropriate error');
      }
      
      // Test migration with no data
      const result = await migrationService.migrateTrades([]);
      this.assert(result.success === true, 'Should handle empty data gracefully');
      this.assert(result.migratedCount === 0, 'Should migrate 0 trades');
      
      this.pass('Error Handling');
      
    } catch (error) {
      this.fail('Error Handling', error.message);
    }
  }

  // Test utilities
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  pass(testName) {
    this.testResults.push({ name: testName, status: 'PASS' });
    console.log(`✅ ${testName} - PASSED\n`);
  }

  fail(testName, error) {
    this.testResults.push({ name: testName, status: 'FAIL', error });
    console.log(`❌ ${testName} - FAILED: ${error}\n`);
  }

  printResults() {
    console.log('📊 Test Results Summary');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  ❌ ${r.name}: ${r.error}`);
        });
    }
    
    console.log(`\n${failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed.'}`);
  }
}

// Performance test
async function runPerformanceTest() {
  console.log('🚀 Performance Test: Large Dataset Migration\n');
  
  const testStorage = new TestLocalStorage();
  global.localStorage = testStorage;
  
  // Generate large dataset
  const largeDataset = [];
  for (let i = 0; i < 1000; i++) {
    largeDataset.push({
      ...TEST_TRADES.valid[0],
      id: `perf_trade_${i}`,
      entryPrice: 1.1000 + (Math.random() * 0.01),
      lotSize: Math.random() * 2
    });
  }
  
  testStorage.setTestData('trades', largeDataset);
  
  const migrationService = new SimpleMigrationService({
    batchSize: 100
  });
  
  const startTime = Date.now();
  const result = await migrationService.migrateTrades(largeDataset);
  const duration = Date.now() - startTime;
  
  console.log(`Performance Results:`);
  console.log(`  Dataset Size: ${largeDataset.length} trades`);
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Rate: ${Math.round(largeDataset.length / (duration / 1000))} trades/second`);
  console.log(`  Success: ${result.success}`);
  console.log(`  Migrated: ${result.migratedCount}`);
  console.log(`  Failed: ${result.failedCount}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--performance')) {
    await runPerformanceTest();
  } else {
    const testRunner = new MigrationTestRunner();
    await testRunner.runAllTests();
  }
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { MigrationTestRunner };
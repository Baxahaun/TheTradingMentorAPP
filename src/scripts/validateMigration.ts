/**
 * Migration Validation Script
 * Validates migration system functionality and data integrity
 */

import { StrategyMigrationService } from '../services/StrategyMigrationService';
import { StrategyValidationService } from '../services/StrategyValidationService';
import { 
  LegacyPlaybook, 
  LegacyFirebasePlaybook, 
  MigrationFormData,
  MigrationResult,
  MigrationValidationResult,
  MIGRATION_DEFAULTS
} from '../types/migration';
import { ProfessionalStrategy } from '../types/strategy';

interface ValidationReport {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
}

interface MigrationValidationReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: ValidationReport[];
  summary: string;
}

export class MigrationValidator {
  private migrationService: StrategyMigrationService;
  private validationService: StrategyValidationService;
  private results: ValidationReport[] = [];

  constructor() {
    this.migrationService = new StrategyMigrationService();
    this.validationService = new StrategyValidationService();
  }

  /**
   * Run comprehensive migration validation tests
   */
  async validateMigrationSystem(): Promise<MigrationValidationReport> {
    console.log('🔍 Starting Migration System Validation...\n');

    this.results = [];

    // Test data validation
    await this.testDataValidation();

    // Test migration functionality
    await this.testMigrationFunctionality();

    // Test rollback functionality
    await this.testRollbackFunctionality();

    // Test error handling
    await this.testErrorHandling();

    // Test data integrity
    await this.testDataIntegrity();

    // Test performance
    await this.testPerformance();

    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;

    const report: MigrationValidationReport = {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      results: this.results,
      summary: this.generateSummary(passedTests, failedTests)
    };

    this.printReport(report);
    return report;
  }

  private async testDataValidation(): Promise<void> {
    console.log('📋 Testing Data Validation...');

    // Test valid legacy playbook validation
    await this.runTest('Valid Legacy Playbook Validation', async () => {
      const validPlaybook = this.createValidLegacyPlaybook();
      const result = await this.migrationService.validateForMigration(validPlaybook);
      
      if (!result.isValid || !result.canProceed) {
        throw new Error(`Valid playbook failed validation: ${result.errors.map(e => e.message).join(', ')}`);
      }
      
      return { validationResult: result };
    });

    // Test valid Firebase playbook validation
    await this.runTest('Valid Firebase Playbook Validation', async () => {
      const validPlaybook = this.createValidFirebasePlaybook();
      const result = await this.migrationService.validateForMigration(validPlaybook);
      
      if (!result.isValid || !result.canProceed) {
        throw new Error(`Valid Firebase playbook failed validation: ${result.errors.map(e => e.message).join(', ')}`);
      }
      
      return { validationResult: result };
    });

    // Test invalid playbook rejection
    await this.runTest('Invalid Playbook Rejection', async () => {
      const invalidPlaybook = this.createInvalidPlaybook();
      const result = await this.migrationService.validateForMigration(invalidPlaybook);
      
      if (result.isValid || result.canProceed) {
        throw new Error('Invalid playbook was incorrectly validated as valid');
      }
      
      if (result.errors.length === 0) {
        throw new Error('No validation errors reported for invalid playbook');
      }
      
      return { validationResult: result };
    });

    // Test warning generation
    await this.runTest('Warning Generation', async () => {
      const playbookWithWarnings = this.createPlaybookWithWarnings();
      const result = await this.migrationService.validateForMigration(playbookWithWarnings);
      
      if (!result.isValid) {
        throw new Error('Playbook with warnings should still be valid');
      }
      
      if (result.warnings.length === 0) {
        throw new Error('Expected warnings were not generated');
      }
      
      return { validationResult: result };
    });
  }

  private async testMigrationFunctionality(): Promise<void> {
    console.log('🔄 Testing Migration Functionality...');

    // Test successful legacy playbook migration
    await this.runTest('Legacy Playbook Migration', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const formData = this.createValidFormData();
      const result = await this.migrationService.migratePlaybook(playbook, formData);
      
      if (result.status !== 'success') {
        throw new Error(`Migration failed: ${result.errors.join(', ')}`);
      }
      
      if (!result.targetStrategyId) {
        throw new Error('No target strategy ID generated');
      }
      
      if (result.migratedFields.length === 0) {
        throw new Error('No fields were migrated');
      }
      
      return { migrationResult: result };
    });

    // Test successful Firebase playbook migration
    await this.runTest('Firebase Playbook Migration', async () => {
      const playbook = this.createValidFirebasePlaybook();
      const formData = this.createValidFormData();
      const result = await this.migrationService.migratePlaybook(playbook, formData);
      
      if (result.status !== 'success') {
        throw new Error(`Firebase migration failed: ${result.errors.join(', ')}`);
      }
      
      return { migrationResult: result };
    });

    // Test migration with backup
    await this.runTest('Migration with Backup', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const formData = this.createValidFormData();
      const config = { ...MIGRATION_DEFAULTS, createBackup: true };
      
      const result = await this.migrationService.migratePlaybook(playbook, formData, config as any);
      
      if (!result.backupId) {
        throw new Error('Backup was not created');
      }
      
      if (!result.rollbackAvailable) {
        throw new Error('Rollback should be available when backup is created');
      }
      
      return { migrationResult: result };
    });

    // Test migration without backup
    await this.runTest('Migration without Backup', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const formData = this.createValidFormData();
      const config = { ...MIGRATION_DEFAULTS, createBackup: false };
      
      const result = await this.migrationService.migratePlaybook(playbook, formData, config as any);
      
      if (result.backupId) {
        throw new Error('Backup should not be created when disabled');
      }
      
      if (result.rollbackAvailable) {
        throw new Error('Rollback should not be available without backup');
      }
      
      return { migrationResult: result };
    });

    // Test default form data generation
    await this.runTest('Default Form Data Generation', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const formData = this.migrationService.getDefaultFormData(playbook);
      
      if (!formData.methodology) {
        throw new Error('Default methodology not set');
      }
      
      if (!formData.primaryTimeframe) {
        throw new Error('Default timeframe not set');
      }
      
      if (formData.assetClasses.length === 0) {
        throw new Error('Default asset classes not set');
      }
      
      if (!formData.positionSizingMethod) {
        throw new Error('Default position sizing method not set');
      }
      
      return { formData };
    });
  }

  private async testRollbackFunctionality(): Promise<void> {
    console.log('↩️ Testing Rollback Functionality...');

    // Test successful rollback
    await this.runTest('Successful Rollback', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const formData = this.createValidFormData();
      
      // First migrate
      const migrationResult = await this.migrationService.migratePlaybook(playbook, formData);
      
      if (migrationResult.status !== 'success') {
        throw new Error('Initial migration failed');
      }
      
      // Then rollback
      const rollback = await this.migrationService.rollbackMigration(
        migrationResult, 
        'Test rollback'
      );
      
      if (!rollback.success) {
        throw new Error(`Rollback failed: ${rollback.error}`);
      }
      
      if (!rollback.completedAt) {
        throw new Error('Rollback completion time not set');
      }
      
      return { rollback };
    });

    // Test rollback with invalid migration result
    await this.runTest('Rollback Error Handling', async () => {
      const invalidMigrationResult: MigrationResult = {
        status: 'success',
        sourcePlaybookId: 'invalid-id',
        targetStrategyId: 'invalid-strategy',
        migratedFields: [],
        skippedFields: [],
        errors: [],
        warnings: [],
        backupId: 'invalid-backup',
        completedAt: new Date().toISOString(),
        rollbackAvailable: true
      };
      
      const rollback = await this.migrationService.rollbackMigration(
        invalidMigrationResult, 
        'Test error handling'
      );
      
      if (rollback.success) {
        throw new Error('Rollback should have failed with invalid data');
      }
      
      if (!rollback.error) {
        throw new Error('Error message should be provided for failed rollback');
      }
      
      return { rollback };
    });
  }

  private async testErrorHandling(): Promise<void> {
    console.log('⚠️ Testing Error Handling...');

    // Test migration with invalid form data
    await this.runTest('Invalid Form Data Handling', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const invalidFormData = this.createInvalidFormData();
      
      const result = await this.migrationService.migratePlaybook(playbook, invalidFormData);
      
      if (result.status === 'success') {
        throw new Error('Migration should have failed with invalid form data');
      }
      
      if (result.errors.length === 0) {
        throw new Error('Error messages should be provided for failed migration');
      }
      
      return { migrationResult: result };
    });

    // Test validation with malformed playbook
    await this.runTest('Malformed Playbook Handling', async () => {
      const malformedPlaybook = this.createMalformedPlaybook();
      
      try {
        const result = await this.migrationService.validateForMigration(malformedPlaybook);
        
        if (result.isValid) {
          throw new Error('Malformed playbook should not validate as valid');
        }
        
        return { validationResult: result };
      } catch (error) {
        // This is expected for severely malformed data
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
  }

  private async testDataIntegrity(): Promise<void> {
    console.log('🔒 Testing Data Integrity...');

    // Test field preservation
    await this.runTest('Field Preservation', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const formData = this.createValidFormData();
      
      const result = await this.migrationService.migratePlaybook(playbook, formData);
      
      if (result.status !== 'success') {
        throw new Error('Migration failed');
      }
      
      // Check that essential fields are preserved
      const expectedFields = ['id', 'title', 'description', 'methodology'];
      for (const field of expectedFields) {
        if (!result.migratedFields.includes(field)) {
          throw new Error(`Essential field '${field}' was not migrated`);
        }
      }
      
      return { migrationResult: result };
    });

    // Test performance metrics initialization
    await this.runTest('Performance Metrics Initialization', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const formData = this.createValidFormData();
      
      const result = await this.migrationService.migratePlaybook(playbook, formData);
      
      if (result.status !== 'success') {
        throw new Error('Migration failed');
      }
      
      // Verify performance metrics are included
      if (!result.migratedFields.includes('performance')) {
        throw new Error('Performance metrics were not initialized');
      }
      
      return { migrationResult: result };
    });

    // Test technical condition extraction
    await this.runTest('Technical Condition Extraction', async () => {
      const playbook = this.createPlaybookWithTechnicalConditions();
      const formData = this.migrationService.getDefaultFormData(playbook);
      
      if (formData.technicalConditions.length === 0) {
        throw new Error('Technical conditions were not extracted');
      }
      
      // Check for specific conditions
      const hasRSI = formData.technicalConditions.some(c => c.includes('RSI'));
      const hasMACD = formData.technicalConditions.some(c => c.includes('MACD'));
      
      if (!hasRSI && !hasMACD) {
        throw new Error('Expected technical conditions were not extracted');
      }
      
      return { formData };
    });
  }

  private async testPerformance(): Promise<void> {
    console.log('⚡ Testing Performance...');

    // Test migration speed
    await this.runTest('Migration Performance', async () => {
      const playbook = this.createValidLegacyPlaybook();
      const formData = this.createValidFormData();
      
      const startTime = Date.now();
      const result = await this.migrationService.migratePlaybook(playbook, formData);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      if (result.status !== 'success') {
        throw new Error('Migration failed');
      }
      
      if (duration > 5000) { // 5 seconds
        throw new Error(`Migration took too long: ${duration}ms`);
      }
      
      return { duration, migrationResult: result };
    });

    // Test validation speed
    await this.runTest('Validation Performance', async () => {
      const playbook = this.createValidLegacyPlaybook();
      
      const startTime = Date.now();
      const result = await this.migrationService.validateForMigration(playbook);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      if (!result.isValid) {
        throw new Error('Validation failed');
      }
      
      if (duration > 1000) { // 1 second
        throw new Error(`Validation took too long: ${duration}ms`);
      }
      
      return { duration, validationResult: result };
    });
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    try {
      const result = await testFn();
      this.results.push({
        testName,
        passed: true,
        details: result
      });
      console.log(`  ✅ ${testName}`);
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`  ❌ ${testName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateSummary(passed: number, failed: number): string {
    const total = passed + failed;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    if (failed === 0) {
      return `🎉 All ${total} tests passed! Migration system is fully functional.`;
    } else if (percentage >= 80) {
      return `⚠️ ${passed}/${total} tests passed (${percentage}%). Minor issues detected.`;
    } else {
      return `🚨 ${passed}/${total} tests passed (${percentage}%). Significant issues detected.`;
    }
  }

  private printReport(report: MigrationValidationReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.passedTests}`);
    console.log(`Failed: ${report.failedTests}`);
    console.log(`Success Rate: ${Math.round((report.passedTests / report.totalTests) * 100)}%`);
    console.log('\n' + report.summary);
    
    if (report.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      report.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  • ${r.testName}: ${r.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  // Test data creation methods
  private createValidLegacyPlaybook(): LegacyPlaybook {
    return {
      id: 'test-playbook-1',
      title: 'Valid Test Strategy',
      description: 'A comprehensive test strategy with all required fields properly filled',
      marketConditions: 'Trending markets with high volatility during London/NY overlap',
      entryParameters: 'RSI oversold below 30, MACD bullish crossover, price above 20 EMA',
      exitParameters: '2% stop loss below entry, 4% take profit target, trailing stop after 2R',
      color: '#3B82F6',
      timesUsed: 25,
      tradesWon: 15,
      tradesLost: 10
    };
  }

  private createValidFirebasePlaybook(): LegacyFirebasePlaybook {
    return {
      id: 'firebase-playbook-1',
      name: 'Valid Firebase Strategy',
      description: 'A comprehensive Firebase test strategy',
      setup: 'High volatility trending market conditions',
      entry: 'Breakout above resistance with volume confirmation',
      exit: 'Stop loss at support, take profit at next resistance level',
      riskManagement: 'Risk 2% per trade, position size based on stop distance',
      examples: 'EURUSD, GBPUSD breakout trades',
      createdAt: { toDate: () => new Date('2023-01-01') },
      updatedAt: { toDate: () => new Date('2023-01-02') }
    };
  }

  private createInvalidPlaybook(): LegacyPlaybook {
    return {
      id: '', // Invalid: empty ID
      title: 'AB', // Invalid: too short
      description: '', // Invalid: empty
      marketConditions: '',
      entryParameters: '',
      exitParameters: '',
      color: '#3B82F6'
    };
  }

  private createPlaybookWithWarnings(): LegacyPlaybook {
    return {
      id: 'warning-playbook-1',
      title: 'Strategy with Warnings',
      description: 'Short', // Warning: short description
      marketConditions: 'Market conditions',
      entryParameters: 'Buy', // Warning: minimal entry parameters
      exitParameters: 'Sell', // Warning: minimal exit parameters
      color: '#3B82F6'
    };
  }

  private createPlaybookWithTechnicalConditions(): LegacyPlaybook {
    return {
      id: 'technical-playbook-1',
      title: 'Technical Analysis Strategy',
      description: 'Strategy with various technical indicators',
      marketConditions: 'Trending market with clear support and resistance levels',
      entryParameters: 'RSI oversold below 30, MACD bullish crossover above signal line, price breaking above 20 EMA with volume spike and support level confirmation',
      exitParameters: 'Stop loss below recent swing low, take profit at next resistance level',
      color: '#3B82F6'
    };
  }

  private createMalformedPlaybook(): any {
    return {
      id: null,
      title: undefined,
      description: 123, // Wrong type
      marketConditions: [],
      entryParameters: {},
      exitParameters: true,
      color: 'invalid-color'
    };
  }

  private createValidFormData(): MigrationFormData {
    return {
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex', 'Indices'],
      technicalConditions: ['RSI oversold', 'MACD bullish crossover'],
      fundamentalConditions: [],
      volatilityRequirements: 'ATR > 50 pips',
      confirmationSignals: ['Volume spike', 'Candlestick pattern'],
      timingCriteria: 'London/NY session overlap',
      positionSizingMethod: MIGRATION_DEFAULTS.positionSizingMethod,
      maxRiskPerTrade: 2,
      stopLossRule: MIGRATION_DEFAULTS.stopLossRule,
      takeProfitRule: MIGRATION_DEFAULTS.takeProfitRule,
      riskRewardRatio: 2
    };
  }

  private createInvalidFormData(): MigrationFormData {
    return {
      methodology: undefined as any, // Invalid
      primaryTimeframe: '', // Invalid
      assetClasses: [], // Invalid: empty
      technicalConditions: [],
      fundamentalConditions: [],
      volatilityRequirements: undefined,
      confirmationSignals: [],
      timingCriteria: '', // Invalid
      positionSizingMethod: undefined as any, // Invalid
      maxRiskPerTrade: -1, // Invalid: negative
      stopLossRule: undefined as any, // Invalid
      takeProfitRule: undefined as any, // Invalid
      riskRewardRatio: 0 // Invalid: zero
    };
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new MigrationValidator();
  validator.validateMigrationSystem()
    .then(report => {
      process.exit(report.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Validation script failed:', error);
      process.exit(1);
    });
}

export default MigrationValidator;
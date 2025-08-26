/**
 * Simple Migration Validation Runner
 */

import { MigrationValidator } from './validateMigration.js';

async function runValidation() {
  console.log('🔍 Starting Migration System Validation...\n');
  
  const validator = new MigrationValidator();
  
  try {
    const report = await validator.validateMigrationSystem();
    
    if (report.failedTests > 0) {
      console.log('\n❌ Some tests failed. Please check the implementation.');
      process.exit(1);
    } else {
      console.log('\n✅ All validation tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

runValidation();
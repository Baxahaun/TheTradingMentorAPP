#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * Runs comprehensive integration tests for the trade review system.
 * Includes system integration, E2E workflows, cross-browser compatibility,
 * and performance testing.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  timeout: 60000, // 60 seconds
  retries: 2,
  parallel: false, // Run sequentially for integration tests
  coverage: true,
  verbose: true,
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'System Integration Tests',
    pattern: 'src/__tests__/integration/system-integration.test.tsx',
    description: 'Tests complete system integration and component cohesion',
    critical: true,
  },
  {
    name: 'End-to-End Workflow Tests',
    pattern: 'src/__tests__/e2e/complete-workflow.e2e.test.tsx',
    description: 'Tests complete user workflows from start to finish',
    critical: true,
  },
  {
    name: 'Cross-Browser Compatibility Tests',
    pattern: 'src/__tests__/cross-browser/compatibility.test.tsx',
    description: 'Tests functionality across different browser environments',
    critical: false,
  },
  {
    name: 'System Performance Tests',
    pattern: 'src/__tests__/performance/system-performance.test.tsx',
    description: 'Tests system performance under realistic loads',
    critical: false,
  },
  {
    name: 'Navigation Integration Tests',
    pattern: 'src/__tests__/e2e/trade-review-navigation.e2e.test.tsx',
    description: 'Tests navigation context and routing integration',
    critical: true,
  },
  {
    name: 'Accessibility Integration Tests',
    pattern: 'src/__tests__/accessibility/trade-review-accessibility.test.tsx',
    description: 'Tests accessibility compliance across all features',
    critical: true,
  },
  {
    name: 'Component Integration Tests',
    pattern: 'src/__tests__/integration/component-integration.test.tsx',
    description: 'Tests integration between all major components',
    critical: true,
  },
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logHeader = (message) => {
  const border = '='.repeat(message.length + 4);
  log(border, colors.cyan);
  log(`  ${message}  `, colors.cyan);
  log(border, colors.cyan);
};

const logSection = (message) => {
  log(`\n${colors.bright}${message}${colors.reset}`);
  log('-'.repeat(message.length), colors.blue);
};

const logSuccess = (message) => log(`✓ ${message}`, colors.green);
const logError = (message) => log(`✗ ${message}`, colors.red);
const logWarning = (message) => log(`⚠ ${message}`, colors.yellow);
const logInfo = (message) => log(`ℹ ${message}`, colors.blue);

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
};

// Run a single test suite
const runTestSuite = async (suite) => {
  logSection(`Running ${suite.name}`);
  logInfo(suite.description);

  // Check if test file exists
  if (!fileExists(suite.pattern)) {
    logWarning(`Test file not found: ${suite.pattern}`);
    return { success: false, skipped: true, reason: 'File not found' };
  }

  try {
    const command = [
      'npx vitest run',
      `"${suite.pattern}"`,
      `--timeout=${TEST_CONFIG.timeout}`,
      `--retry=${TEST_CONFIG.retries}`,
      TEST_CONFIG.coverage ? '--coverage' : '',
      TEST_CONFIG.verbose ? '--reporter=verbose' : '',
      '--run', // Don't watch
    ].filter(Boolean).join(' ');

    logInfo(`Executing: ${command}`);

    const startTime = Date.now();
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        VITEST_INTEGRATION_TEST: 'true',
      }
    });
    const duration = Date.now() - startTime;

    logSuccess(`${suite.name} completed in ${duration}ms`);
    return { success: true, duration };

  } catch (error) {
    logError(`${suite.name} failed`);
    if (error.stdout) {
      console.log(error.stdout.toString());
    }
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    return { success: false, error: error.message };
  }
};

// Generate test report
const generateReport = (results) => {
  logSection('Test Results Summary');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success && !r.skipped).length;
  const skippedTests = results.filter(r => r.skipped).length;
  const criticalFailed = results.filter(r => !r.success && r.critical).length;

  log(`\nTotal Test Suites: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);
  if (failedTests > 0) logError(`Failed: ${failedTests}`);
  if (skippedTests > 0) logWarning(`Skipped: ${skippedTests}`);
  if (criticalFailed > 0) logError(`Critical Failures: ${criticalFailed}`);

  // Detailed results
  log('\nDetailed Results:');
  results.forEach((result, index) => {
    const suite = TEST_SUITES[index];
    const status = result.success ? '✓' : result.skipped ? '⚠' : '✗';
    const color = result.success ? colors.green : result.skipped ? colors.yellow : colors.red;
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    const critical = suite.critical ? ' [CRITICAL]' : '';
    
    log(`  ${status} ${suite.name}${duration}${critical}`, color);
    
    if (result.reason) {
      log(`    Reason: ${result.reason}`, colors.yellow);
    }
    if (result.error) {
      log(`    Error: ${result.error}`, colors.red);
    }
  });

  // Overall status
  log('\n' + '='.repeat(50));
  if (criticalFailed > 0) {
    logError('INTEGRATION TESTS FAILED - Critical test failures detected');
    return false;
  } else if (failedTests > 0) {
    logWarning('INTEGRATION TESTS COMPLETED WITH WARNINGS - Some non-critical tests failed');
    return true;
  } else {
    logSuccess('ALL INTEGRATION TESTS PASSED');
    return true;
  }
};

// Pre-flight checks
const runPreflightChecks = () => {
  logSection('Pre-flight Checks');

  // Check if vitest is available
  try {
    execSync('npx vitest --version', { stdio: 'pipe' });
    logSuccess('Vitest is available');
  } catch {
    logError('Vitest is not available. Please install it first.');
    process.exit(1);
  }

  // Check if test setup files exist
  const setupFiles = [
    'src/test/comprehensive-setup.ts',
    'src/__tests__/test-runner.ts',
  ];

  setupFiles.forEach(file => {
    if (fileExists(file)) {
      logSuccess(`Setup file found: ${file}`);
    } else {
      logWarning(`Setup file not found: ${file}`);
    }
  });

  // Check if mock files exist
  const mockFiles = [
    'src/__tests__/mocks/tradeData.ts',
    'src/__tests__/mocks/userData.ts',
  ];

  mockFiles.forEach(file => {
    if (fileExists(file)) {
      logSuccess(`Mock file found: ${file}`);
    } else {
      logWarning(`Mock file not found: ${file}`);
    }
  });

  logInfo('Pre-flight checks completed');
};

// Main execution
const main = async () => {
  logHeader('Trade Review System - Integration Test Suite');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    skipPreflightChecks: args.includes('--skip-preflight'),
    onlyCritical: args.includes('--critical-only'),
    pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1],
    verbose: args.includes('--verbose') || TEST_CONFIG.verbose,
  };

  if (options.verbose) {
    logInfo('Running in verbose mode');
  }

  // Run pre-flight checks
  if (!options.skipPreflightChecks) {
    runPreflightChecks();
  }

  // Filter test suites based on options
  let suitesToRun = TEST_SUITES;
  
  if (options.onlyCritical) {
    suitesToRun = TEST_SUITES.filter(suite => suite.critical);
    logInfo(`Running only critical tests (${suitesToRun.length} suites)`);
  }

  if (options.pattern) {
    suitesToRun = suitesToRun.filter(suite => 
      suite.pattern.includes(options.pattern) || 
      suite.name.toLowerCase().includes(options.pattern.toLowerCase())
    );
    logInfo(`Running tests matching pattern: ${options.pattern} (${suitesToRun.length} suites)`);
  }

  if (suitesToRun.length === 0) {
    logWarning('No test suites to run');
    process.exit(0);
  }

  // Run test suites
  logSection(`Executing ${suitesToRun.length} Test Suites`);
  const results = [];

  for (let i = 0; i < suitesToRun.length; i++) {
    const suite = suitesToRun[i];
    logInfo(`\n[${i + 1}/${suitesToRun.length}] Starting ${suite.name}`);
    
    const result = await runTestSuite(suite);
    result.critical = suite.critical;
    results.push(result);

    // Stop on critical failure if requested
    if (!result.success && suite.critical && !options.skipPreflightChecks) {
      logError('Critical test failed. Stopping execution.');
      break;
    }
  }

  // Generate and display report
  const success = generateReport(results);

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

export {
  runTestSuite,
  generateReport,
  TEST_SUITES,
  TEST_CONFIG,
};
#!/usr/bin/env node

/**
 * Final System Validation Script
 * 
 * Comprehensive validation of the complete trade review system.
 * This script performs final integration testing and system validation
 * to ensure the system is ready for production use.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validation configuration
const VALIDATION_CONFIG = {
  timeout: 120000, // 2 minutes
  retries: 1,
  coverage: true,
  verbose: true,
  failFast: false,
};

// Validation phases
const VALIDATION_PHASES = [
  {
    name: 'Pre-Validation Checks',
    description: 'Verify system prerequisites and dependencies',
    critical: true,
    tests: [],
    customRunner: 'runPreValidationChecks',
  },
  {
    name: 'Component Integration Tests',
    description: 'Validate all components work together correctly',
    critical: true,
    tests: [
      'src/__tests__/integration/component-integration.test.tsx',
      'src/components/__tests__/TradeReviewSystem.comprehensive.test.tsx',
    ],
  },
  {
    name: 'System Integration Tests',
    description: 'Test complete system integration and workflows',
    critical: true,
    tests: [
      'src/__tests__/integration/system-integration.test.tsx',
      'src/__tests__/integration/trade-review-workflow.integration.test.tsx',
    ],
  },
  {
    name: 'End-to-End Workflow Tests',
    description: 'Validate complete user workflows from start to finish',
    critical: true,
    tests: [
      'src/__tests__/e2e/complete-workflow.e2e.test.tsx',
      'src/__tests__/e2e/trade-review-navigation.e2e.test.tsx',
    ],
  },
  {
    name: 'Cross-Browser Compatibility',
    description: 'Ensure functionality across different browsers',
    critical: false,
    tests: [
      'src/__tests__/cross-browser/compatibility.test.tsx',
    ],
  },
  {
    name: 'Performance Validation',
    description: 'Validate system performance under realistic loads',
    critical: false,
    tests: [
      'src/__tests__/performance/system-performance.test.tsx',
      'src/__tests__/performance/trade-review-performance.test.tsx',
    ],
  },
  {
    name: 'Accessibility Compliance',
    description: 'Ensure WCAG 2.1 AA compliance across all features',
    critical: true,
    tests: [
      'src/__tests__/accessibility/trade-review-accessibility.test.tsx',
    ],
  },
  {
    name: 'Mobile Responsiveness',
    description: 'Validate mobile functionality and responsiveness',
    critical: false,
    tests: [
      'src/components/__tests__/TradeReviewSystem.mobile.test.tsx',
    ],
  },
  {
    name: 'System Validation',
    description: 'Final comprehensive system validation',
    critical: true,
    tests: [
      'src/__tests__/validation/system-validation.test.tsx',
    ],
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
  white: '\x1b[37m',
};

// Utility functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logHeader = (message) => {
  const border = '='.repeat(Math.max(message.length + 4, 60));
  log(border, colors.cyan);
  log(`  ${message.toUpperCase()}  `, colors.cyan);
  log(border, colors.cyan);
};

const logPhase = (message) => {
  log(`\n${colors.bright}${colors.blue}▶ ${message}${colors.reset}`);
  log('-'.repeat(message.length + 2), colors.blue);
};

const logSuccess = (message) => log(`${colors.green}✓${colors.reset} ${message}`);
const logError = (message) => log(`${colors.red}✗${colors.reset} ${message}`);
const logWarning = (message) => log(`${colors.yellow}⚠${colors.reset} ${message}`);
const logInfo = (message) => log(`${colors.blue}ℹ${colors.reset} ${message}`);

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
};

// Run pre-validation checks
const runPreValidationChecks = async () => {
  logPhase('Running Pre-Validation Checks');

  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const majorVersion = parseInt(version.slice(1).split('.')[0]);
        return majorVersion >= 16;
      },
    },
    {
      name: 'Package dependencies',
      check: () => {
        return fileExists('package.json') && fileExists('node_modules');
      },
    },
    {
      name: 'TypeScript configuration',
      check: () => {
        return fileExists('tsconfig.json');
      },
    },
    {
      name: 'Vitest configuration',
      check: () => {
        return fileExists('vitest.config.ts') || fileExists('vite.config.ts');
      },
    },
    {
      name: 'Source files present',
      check: () => {
        return fileExists('src/App.tsx') && 
               fileExists('src/components/TradeReviewSystem.tsx') &&
               fileExists('src/pages/TradeReviewPage.tsx');
      },
    },
    {
      name: 'Test setup files',
      check: () => {
        return fileExists('src/test/comprehensive-setup.ts') ||
               fileExists('src/__tests__/test-runner.ts');
      },
    },
    {
      name: 'Mock data files',
      check: () => {
        return fileExists('src/__tests__/mocks/tradeData.ts') &&
               fileExists('src/__tests__/mocks/userData.ts');
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      if (check.check()) {
        logSuccess(check.name);
        passed++;
      } else {
        logError(check.name);
        failed++;
      }
    } catch (error) {
      logError(`${check.name}: ${error.message}`);
      failed++;
    }
  }

  const success = failed === 0;
  log(`\nPre-validation: ${passed} passed, ${failed} failed`);
  
  if (!success) {
    logError('Pre-validation checks failed. Please fix the issues before continuing.');
    return false;
  }

  logSuccess('All pre-validation checks passed');
  return true;
};

// Run a test phase
const runTestPhase = async (phase) => {
  logPhase(`${phase.name}`);
  logInfo(phase.description);

  if (phase.customRunner) {
    // Run custom validation function
    if (phase.customRunner === 'runPreValidationChecks') {
      return await runPreValidationChecks();
    }
    return true;
  }

  if (!phase.tests || phase.tests.length === 0) {
    logWarning('No tests defined for this phase');
    return true;
  }

  let allPassed = true;
  const results = [];

  for (const testFile of phase.tests) {
    logInfo(`Running: ${path.basename(testFile)}`);

    if (!fileExists(testFile)) {
      logWarning(`Test file not found: ${testFile}`);
      results.push({ file: testFile, success: false, skipped: true });
      continue;
    }

    try {
      const command = [
        'npx vitest run',
        `"${testFile}"`,
        `--timeout=${VALIDATION_CONFIG.timeout}`,
        `--retry=${VALIDATION_CONFIG.retries}`,
        VALIDATION_CONFIG.coverage ? '--coverage' : '',
        '--run',
        '--reporter=verbose',
      ].filter(Boolean).join(' ');

      const startTime = Date.now();
      execSync(command, { 
        stdio: VALIDATION_CONFIG.verbose ? 'inherit' : 'pipe',
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'test',
          VITEST_FINAL_VALIDATION: 'true',
        }
      });
      const duration = Date.now() - startTime;

      logSuccess(`${path.basename(testFile)} (${duration}ms)`);
      results.push({ file: testFile, success: true, duration });

    } catch (error) {
      logError(`${path.basename(testFile)} failed`);
      results.push({ file: testFile, success: false, error: error.message });
      allPassed = false;

      if (phase.critical && VALIDATION_CONFIG.failFast) {
        logError('Critical test failed. Stopping validation.');
        break;
      }
    }
  }

  // Phase summary
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;

  log(`\nPhase Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  if (phase.critical && !allPassed) {
    logError(`Critical phase "${phase.name}" failed`);
  }

  return allPassed;
};

// Generate final validation report
const generateFinalReport = (phaseResults) => {
  logHeader('Final Validation Report');

  const totalPhases = phaseResults.length;
  const passedPhases = phaseResults.filter(r => r.success).length;
  const failedPhases = phaseResults.filter(r => !r.success).length;
  const criticalFailed = phaseResults.filter(r => !r.success && r.critical).length;

  log(`\nValidation Summary:`);
  log(`Total Phases: ${totalPhases}`);
  logSuccess(`Passed: ${passedPhases}`);
  if (failedPhases > 0) logError(`Failed: ${failedPhases}`);
  if (criticalFailed > 0) logError(`Critical Failures: ${criticalFailed}`);

  // Detailed phase results
  log(`\nDetailed Results:`);
  phaseResults.forEach((result, index) => {
    const phase = VALIDATION_PHASES[index];
    const status = result.success ? '✓' : '✗';
    const color = result.success ? colors.green : colors.red;
    const critical = phase.critical ? ' [CRITICAL]' : '';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    
    log(`  ${status} ${phase.name}${duration}${critical}`, color);
    
    if (result.error) {
      log(`    Error: ${result.error}`, colors.red);
    }
  });

  // System health assessment
  log(`\n${'='.repeat(60)}`);
  
  const systemHealth = calculateSystemHealth(phaseResults);
  
  log(`System Health Score: ${systemHealth.score}%`, 
      systemHealth.score >= 90 ? colors.green : 
      systemHealth.score >= 70 ? colors.yellow : colors.red);
  
  log(`Critical Systems: ${systemHealth.criticalHealthy ? 'HEALTHY' : 'ISSUES DETECTED'}`,
      systemHealth.criticalHealthy ? colors.green : colors.red);
  
  log(`Production Ready: ${systemHealth.productionReady ? 'YES' : 'NO'}`,
      systemHealth.productionReady ? colors.green : colors.red);

  // Recommendations
  if (!systemHealth.productionReady) {
    log(`\nRecommendations:`, colors.yellow);
    systemHealth.recommendations.forEach(rec => {
      log(`  • ${rec}`, colors.yellow);
    });
  }

  log(`${'='.repeat(60)}`);

  return systemHealth;
};

// Calculate system health
const calculateSystemHealth = (phaseResults) => {
  const totalPhases = phaseResults.length;
  const passedPhases = phaseResults.filter(r => r.success).length;
  const criticalPhases = phaseResults.filter((r, i) => VALIDATION_PHASES[i].critical);
  const criticalPassed = criticalPhases.filter(r => r.success).length;
  
  const score = Math.round((passedPhases / totalPhases) * 100);
  const criticalHealthy = criticalPassed === criticalPhases.length;
  const productionReady = score >= 95 && criticalHealthy;

  const recommendations = [];
  
  if (!criticalHealthy) {
    recommendations.push('Fix all critical system failures before deployment');
  }
  
  if (score < 90) {
    recommendations.push('Address failing test suites to improve system reliability');
  }
  
  phaseResults.forEach((result, index) => {
    const phase = VALIDATION_PHASES[index];
    if (!result.success && phase.critical) {
      recommendations.push(`Fix critical issues in: ${phase.name}`);
    }
  });

  return {
    score,
    criticalHealthy,
    productionReady,
    recommendations,
  };
};

// Main validation function
const main = async () => {
  logHeader('Trade Review System - Final Validation');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    skipPreValidation: args.includes('--skip-pre-validation'),
    criticalOnly: args.includes('--critical-only'),
    phase: args.find(arg => arg.startsWith('--phase='))?.split('=')[1],
    verbose: args.includes('--verbose'),
    failFast: args.includes('--fail-fast'),
  };

  // Update config based on options
  if (options.verbose) VALIDATION_CONFIG.verbose = true;
  if (options.failFast) VALIDATION_CONFIG.failFast = true;

  logInfo(`Starting comprehensive system validation...`);
  logInfo(`Configuration: ${JSON.stringify(VALIDATION_CONFIG, null, 2)}`);

  // Filter phases based on options
  let phasesToRun = VALIDATION_PHASES;
  
  if (options.criticalOnly) {
    phasesToRun = VALIDATION_PHASES.filter(phase => phase.critical);
    logInfo(`Running only critical phases (${phasesToRun.length} phases)`);
  }

  if (options.phase) {
    phasesToRun = VALIDATION_PHASES.filter(phase => 
      phase.name.toLowerCase().includes(options.phase.toLowerCase())
    );
    logInfo(`Running phases matching: ${options.phase} (${phasesToRun.length} phases)`);
  }

  if (phasesToRun.length === 0) {
    logWarning('No validation phases to run');
    process.exit(0);
  }

  // Run validation phases
  const phaseResults = [];
  let shouldContinue = true;

  for (let i = 0; i < phasesToRun.length && shouldContinue; i++) {
    const phase = phasesToRun[i];
    logInfo(`\n[${i + 1}/${phasesToRun.length}] Starting ${phase.name}`);
    
    const startTime = Date.now();
    const success = await runTestPhase(phase);
    const duration = Date.now() - startTime;
    
    phaseResults.push({
      success,
      duration,
      critical: phase.critical,
      error: success ? null : 'Phase failed',
    });

    if (!success && phase.critical && VALIDATION_CONFIG.failFast) {
      logError('Critical phase failed. Stopping validation.');
      shouldContinue = false;
    }
  }

  // Generate final report
  const systemHealth = generateFinalReport(phaseResults);

  // Exit with appropriate code
  const exitCode = systemHealth.productionReady ? 0 : 1;
  
  if (exitCode === 0) {
    logSuccess('\nSYSTEM VALIDATION COMPLETED SUCCESSFULLY');
    logSuccess('The Trade Review System is ready for production deployment.');
  } else {
    logError('\nSYSTEM VALIDATION FAILED');
    logError('Please address the identified issues before deployment.');
  }

  process.exit(exitCode);
};

// Error handling
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

export {
  runTestPhase,
  generateFinalReport,
  calculateSystemHealth,
  VALIDATION_PHASES,
  VALIDATION_CONFIG,
};
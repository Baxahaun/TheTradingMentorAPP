/**
 * Final Integration Test Runner
 * 
 * Orchestrates all comprehensive validation tests to ensure the complete
 * strategy management system works cohesively and meets all requirements.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SystemIntegrationValidator, validateSystemIntegration } from './system-integration-validator';
import { SystemPerformanceValidator } from './performance/system-performance-validation.test';
import { DataMigrationValidator } from './migration/data-migration-validation.test';
import { runComprehensiveTests } from './test-runner';

interface FinalValidationReport {
  timestamp: string;
  systemIntegration: {
    status: 'pass' | 'fail' | 'warning';
    workflows: number;
    issues: string[];
  };
  performance: {
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    score: number;
    benchmarksPassed: number;
    totalBenchmarks: number;
  };
  migration: {
    status: 'pass' | 'fail';
    testCases: number;
    dataIntegrityScore: number;
  };
  comprehensiveTests: {
    status: 'pass' | 'fail';
    totalTests: number;
    coverage: number;
    complianceScore: number;
  };
  overallStatus: 'pass' | 'fail' | 'warning';
  readinessScore: number;
  recommendations: string[];
  blockers: string[];
}

export class FinalIntegrationTestRunner {
  private systemValidator: SystemIntegrationValidator;
  private performanceValidator: SystemPerformanceValidator;
  private migrationValidator: DataMigrationValidator;

  constructor() {
    this.systemValidator = new SystemIntegrationValidator();
    this.performanceValidator = new SystemPerformanceValidator();
    this.migrationValidator = new DataMigrationValidator();
  }

  async runFinalValidation(): Promise<FinalValidationReport> {
    console.log('🚀 Starting Final Integration Validation for Strategy Management System');
    console.log('═'.repeat(80));

    const timestamp = new Date().toISOString();
    const report: FinalValidationReport = {
      timestamp,
      systemIntegration: { status: 'fail', workflows: 0, issues: [] },
      performance: { status: 'critical', score: 0, benchmarksPassed: 0, totalBenchmarks: 0 },
      migration: { status: 'fail', testCases: 0, dataIntegrityScore: 0 },
      comprehensiveTests: { status: 'fail', totalTests: 0, coverage: 0, complianceScore: 0 },
      overallStatus: 'fail',
      readinessScore: 0,
      recommendations: [],
      blockers: []
    };

    try {
      // 1. Run System Integration Validation
      console.log('\n🔍 Phase 1: System Integration Validation');
      const integrationResult = await this.validateSystemIntegration();
      report.systemIntegration = integrationResult;

      // 2. Run Performance Validation
      console.log('\n⚡ Phase 2: Performance Validation');
      const performanceResult = await this.validatePerformance();
      report.performance = performanceResult;

      // 3. Run Migration Validation
      console.log('\n🔄 Phase 3: Migration Validation');
      const migrationResult = await this.validateMigration();
      report.migration = migrationResult;

      // 4. Run Comprehensive Test Suite
      console.log('\n📋 Phase 4: Comprehensive Test Suite');
      const comprehensiveResult = await this.runComprehensiveTestSuite();
      report.comprehensiveTests = comprehensiveResult;

      // 5. Calculate Overall Status and Readiness Score
      this.calculateOverallStatus(report);

      // 6. Generate Final Report
      this.generateFinalReport(report);

      return report;
    } catch (error) {
      console.error('❌ Final validation failed:', error);
      report.blockers.push(`Critical error during validation: ${error.message}`);
      return report;
    }
  }

  private async validateSystemIntegration(): Promise<FinalValidationReport['systemIntegration']> {
    try {
      const result = await this.systemValidator.validateCompleteSystem();
      
      const passedWorkflows = result.integrationTests.filter(test => test.overallStatus === 'pass').length;
      const totalWorkflows = result.integrationTests.length;
      
      const issues: string[] = [];
      result.integrationTests.forEach(test => {
        if (test.overallStatus === 'fail') {
          issues.push(`${test.workflow} workflow failed`);
        }
        test.steps.forEach(step => {
          if (step.status === 'fail') {
            issues.push(`${test.workflow}: ${step.message}`);
          }
        });
      });

      result.systemHealth.forEach(health => {
        if (health.status === 'fail') {
          issues.push(`System health issue: ${health.message}`);
        }
      });

      const status = result.overallStatus;
      
      console.log(`   ✅ Integration Tests: ${passedWorkflows}/${totalWorkflows} workflows passed`);
      console.log(`   📊 Overall Status: ${status.toUpperCase()}`);
      
      return {
        status,
        workflows: totalWorkflows,
        issues
      };
    } catch (error) {
      console.error('   ❌ System integration validation failed:', error);
      return {
        status: 'fail',
        workflows: 0,
        issues: [`System integration validation error: ${error.message}`]
      };
    }
  }

  private async validatePerformance(): Promise<FinalValidationReport['performance']> {
    try {
      const result = await this.performanceValidator.validateSystemPerformance();
      
      const passedBenchmarks = result.results.filter(r => r.passed).length;
      const totalBenchmarks = result.results.length;
      
      console.log(`   ⚡ Performance Score: ${result.overallScore.toFixed(1)}%`);
      console.log(`   📈 Benchmarks: ${passedBenchmarks}/${totalBenchmarks} passed`);
      console.log(`   🏥 System Health: ${result.systemHealth.toUpperCase()}`);
      
      return {
        status: result.systemHealth,
        score: result.overallScore,
        benchmarksPassed: passedBenchmarks,
        totalBenchmarks
      };
    } catch (error) {
      console.error('   ❌ Performance validation failed:', error);
      return {
        status: 'critical',
        score: 0,
        benchmarksPassed: 0,
        totalBenchmarks: 0
      };
    }
  }

  private async validateMigration(): Promise<FinalValidationReport['migration']> {
    try {
      // Test multiple migration scenarios
      const testPlaybooks = [
        this.createTestPlaybook('basic-strategy', 25, 15, 10),
        this.createTestPlaybook('high-volume-strategy', 200, 120, 80),
        this.createTestPlaybook('new-strategy', 5, 3, 2),
        this.createTestPlaybook('perfect-strategy', 10, 10, 0),
        this.createTestPlaybook('unused-strategy', 0, 0, 0)
      ];

      const results = await Promise.all(
        testPlaybooks.map(playbook => this.migrationValidator.validateMigration(playbook))
      );

      const successfulMigrations = results.filter(r => r.success).length;
      const totalMigrations = results.length;
      
      // Calculate data integrity score
      const integrityScores = results.map(r => {
        const preservedChecks = r.integrityChecks.filter(check => check.isPreserved).length;
        const totalChecks = r.integrityChecks.length;
        return totalChecks > 0 ? (preservedChecks / totalChecks) * 100 : 0;
      });
      
      const avgIntegrityScore = integrityScores.reduce((sum, score) => sum + score, 0) / integrityScores.length;
      
      console.log(`   🔄 Migration Tests: ${successfulMigrations}/${totalMigrations} passed`);
      console.log(`   🛡️  Data Integrity: ${avgIntegrityScore.toFixed(1)}%`);
      
      return {
        status: successfulMigrations === totalMigrations ? 'pass' : 'fail',
        testCases: totalMigrations,
        dataIntegrityScore: avgIntegrityScore
      };
    } catch (error) {
      console.error('   ❌ Migration validation failed:', error);
      return {
        status: 'fail',
        testCases: 0,
        dataIntegrityScore: 0
      };
    }
  }

  private async runComprehensiveTestSuite(): Promise<FinalValidationReport['comprehensiveTests']> {
    try {
      const result = await runComprehensiveTests();
      
      console.log(`   📋 Total Tests: ${result.totalTests}`);
      console.log(`   📊 Coverage: ${result.overallCoverage.toFixed(1)}%`);
      console.log(`   🎯 Compliance: ${result.complianceScore.toFixed(1)}%`);
      
      return {
        status: result.complianceScore >= 85 ? 'pass' : 'fail',
        totalTests: result.totalTests,
        coverage: result.overallCoverage,
        complianceScore: result.complianceScore
      };
    } catch (error) {
      console.error('   ❌ Comprehensive test suite failed:', error);
      return {
        status: 'fail',
        totalTests: 0,
        coverage: 0,
        complianceScore: 0
      };
    }
  }

  private calculateOverallStatus(report: FinalValidationReport): void {
    // Calculate readiness score based on all validation results
    let readinessScore = 0;
    const weights = {
      systemIntegration: 0.3,
      performance: 0.25,
      migration: 0.2,
      comprehensiveTests: 0.25
    };

    // System Integration Score
    const integrationScore = report.systemIntegration.status === 'pass' ? 100 :
                            report.systemIntegration.status === 'warning' ? 75 : 0;
    readinessScore += integrationScore * weights.systemIntegration;

    // Performance Score
    readinessScore += report.performance.score * weights.performance;

    // Migration Score
    const migrationScore = report.migration.status === 'pass' ? 
                          report.migration.dataIntegrityScore : 0;
    readinessScore += migrationScore * weights.migration;

    // Comprehensive Tests Score
    readinessScore += report.comprehensiveTests.complianceScore * weights.comprehensiveTests;

    report.readinessScore = Math.round(readinessScore);

    // Determine overall status
    if (readinessScore >= 95) {
      report.overallStatus = 'pass';
    } else if (readinessScore >= 80) {
      report.overallStatus = 'warning';
    } else {
      report.overallStatus = 'fail';
    }

    // Generate recommendations and blockers
    this.generateRecommendationsAndBlockers(report);
  }

  private generateRecommendationsAndBlockers(report: FinalValidationReport): void {
    const recommendations: string[] = [];
    const blockers: string[] = [];

    // System Integration Issues
    if (report.systemIntegration.status === 'fail') {
      blockers.push('System integration validation failed - critical workflows not working');
      report.systemIntegration.issues.forEach(issue => {
        blockers.push(`Integration issue: ${issue}`);
      });
    } else if (report.systemIntegration.status === 'warning') {
      recommendations.push('Address system integration warnings before production deployment');
    }

    // Performance Issues
    if (report.performance.status === 'critical') {
      blockers.push('Performance is critical - system not ready for production load');
    } else if (report.performance.status === 'needs_improvement') {
      recommendations.push('Optimize performance before handling large datasets');
    }

    // Migration Issues
    if (report.migration.status === 'fail') {
      blockers.push('Data migration validation failed - risk of data loss');
    } else if (report.migration.dataIntegrityScore < 95) {
      recommendations.push('Improve data migration integrity before production deployment');
    }

    // Test Coverage Issues
    if (report.comprehensiveTests.coverage < 90) {
      recommendations.push('Increase test coverage to at least 90% before production');
    }

    if (report.comprehensiveTests.complianceScore < 85) {
      blockers.push('Test compliance score too low - critical functionality may be broken');
    }

    // Overall readiness recommendations
    if (report.readinessScore >= 95) {
      recommendations.push('System is production-ready! Consider additional stress testing.');
    } else if (report.readinessScore >= 80) {
      recommendations.push('System is nearly ready - address warnings and recommendations');
    } else {
      blockers.push('System readiness score too low for production deployment');
    }

    report.recommendations = recommendations;
    report.blockers = blockers;
  }

  private generateFinalReport(report: FinalValidationReport): void {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 FINAL INTEGRATION VALIDATION REPORT');
    console.log('═'.repeat(80));
    
    console.log(`\n🕐 Validation Completed: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(`🎯 Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`📈 Readiness Score: ${report.readinessScore}%`);

    console.log('\n📋 Validation Results Summary:');
    console.log(`   🔍 System Integration: ${report.systemIntegration.status.toUpperCase()} (${report.systemIntegration.workflows} workflows)`);
    console.log(`   ⚡ Performance: ${report.performance.status.toUpperCase()} (${report.performance.score.toFixed(1)}%)`);
    console.log(`   🔄 Migration: ${report.migration.status.toUpperCase()} (${report.migration.dataIntegrityScore.toFixed(1)}% integrity)`);
    console.log(`   📋 Comprehensive Tests: ${report.comprehensiveTests.status.toUpperCase()} (${report.comprehensiveTests.coverage.toFixed(1)}% coverage)`);

    if (report.blockers.length > 0) {
      console.log('\n🚫 BLOCKERS (Must be resolved before production):');
      report.blockers.forEach((blocker, index) => {
        console.log(`   ${index + 1}. ${blocker}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n' + '═'.repeat(80));
    
    if (report.overallStatus === 'pass') {
      console.log('🎉 CONGRATULATIONS! Strategy Management System is ready for production deployment.');
      console.log('   All critical validations passed and the system meets quality standards.');
    } else if (report.overallStatus === 'warning') {
      console.log('⚠️  CAUTION: System has warnings that should be addressed.');
      console.log('   Consider resolving recommendations before production deployment.');
    } else {
      console.log('❌ SYSTEM NOT READY: Critical issues must be resolved.');
      console.log('   Address all blockers before attempting production deployment.');
    }
    
    console.log('═'.repeat(80));
  }

  // Helper method to create test playbooks
  private createTestPlaybook(id: string, timesUsed: number, tradesWon: number, tradesLost: number) {
    return {
      id,
      title: `Test ${id.replace('-', ' ')}`,
      description: `Test playbook for ${id}`,
      color: '#3B82F6',
      marketConditions: 'Test market conditions',
      entryParameters: 'Test entry parameters',
      exitParameters: 'Test exit parameters',
      timesUsed,
      tradesWon,
      tradesLost,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-15T12:00:00Z'
    };
  }
}

describe('Final Integration Validation', () => {
  let runner: FinalIntegrationTestRunner;

  beforeAll(() => {
    runner = new FinalIntegrationTestRunner();
    console.log('🚀 Initializing Final Integration Test Runner...');
  });

  afterAll(() => {
    console.log('✅ Final Integration Test Runner completed.');
  });

  it('should validate complete strategy management system integration', async () => {
    const report = await runner.runFinalValidation();

    // Assert that the validation completed
    expect(report).toBeDefined();
    expect(report.timestamp).toBeDefined();
    expect(report.readinessScore).toBeGreaterThanOrEqual(0);

    // For production readiness, we expect:
    // 1. No critical blockers
    // 2. Readiness score of at least 80%
    // 3. All major components validated
    
    if (report.blockers.length > 0) {
      console.warn('⚠️  Blockers found:', report.blockers);
    }

    // The system should be at least in warning state (not fail)
    expect(report.overallStatus).not.toBe('fail');
    
    // Readiness score should be reasonable for a complete system
    expect(report.readinessScore).toBeGreaterThanOrEqual(70);

    // All validation phases should have run
    expect(report.systemIntegration.workflows).toBeGreaterThan(0);
    expect(report.performance.totalBenchmarks).toBeGreaterThan(0);
    expect(report.migration.testCases).toBeGreaterThan(0);
    expect(report.comprehensiveTests.totalTests).toBeGreaterThan(0);

    // Log final status for visibility
    console.log(`\n🎯 Final Validation Result: ${report.overallStatus.toUpperCase()}`);
    console.log(`📊 Readiness Score: ${report.readinessScore}%`);
    
    return report;
  }, 300000); // 5 minute timeout for complete validation

  it('should identify and report all critical issues', async () => {
    const report = await runner.runFinalValidation();

    // If there are blockers, they should be clearly identified
    if (report.blockers.length > 0) {
      console.log('\n🚫 Critical Issues Identified:');
      report.blockers.forEach((blocker, index) => {
        console.log(`   ${index + 1}. ${blocker}`);
      });
    }

    // If there are recommendations, they should be actionable
    if (report.recommendations.length > 0) {
      console.log('\n💡 Improvement Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Blockers should be specific and actionable
    report.blockers.forEach(blocker => {
      expect(blocker).toBeTruthy();
      expect(typeof blocker).toBe('string');
      expect(blocker.length).toBeGreaterThan(10); // Should be descriptive
    });

    // Recommendations should be helpful
    report.recommendations.forEach(rec => {
      expect(rec).toBeTruthy();
      expect(typeof rec).toBe('string');
      expect(rec.length).toBeGreaterThan(10); // Should be descriptive
    });
  }, 300000);
});

// Export for CLI usage
export const runFinalIntegrationValidation = async (): Promise<FinalValidationReport> => {
  const runner = new FinalIntegrationTestRunner();
  return await runner.runFinalValidation();
};

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runFinalIntegrationValidation()
    .then(report => {
      const exitCode = report.overallStatus === 'fail' ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Final validation failed:', error);
      process.exit(1);
    });
}
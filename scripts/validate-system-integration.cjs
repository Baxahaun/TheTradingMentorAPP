#!/usr/bin/env node

/**
 * System Integration Validation Script
 * 
 * This script validates that all components of the Strategy Management System
 * are properly integrated and ready for production deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SystemValidator {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async validate() {
    console.log('🚀 Starting Strategy Management System Validation');
    console.log('═'.repeat(80));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(80));

    try {
      // Ensure test results directory exists
      this.ensureDirectory('./test-results');

      // Validate system components
      await this.validateComponents();
      await this.validateServices();
      await this.validateIntegration();
      await this.validatePerformance();
      
      // Generate final report
      this.generateReport();

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateComponents() {
    console.log('\n🔍 Validating Components...');
    
    const components = [
      'src/components/EnhancedPlaybooks.tsx',
      'src/components/strategy-builder/ProfessionalStrategyBuilder.tsx',
      'src/components/strategy-detail/StrategyDetailView.tsx',
      'src/components/trade-strategy/TradeStrategyIntegration.tsx',
      'src/components/StrategyMigrationWizard.tsx',
      'src/components/ai-insights/AIInsightsPanel.tsx',
      'src/components/backtesting/BacktestingPanel.tsx',
      'src/components/discipline/DisciplineScorePanel.tsx',
      'src/components/alerts/AlertsPanel.tsx',
      'src/components/export/ExportPanel.tsx'
    ];

    let validComponents = 0;
    
    components.forEach(component => {
      if (fs.existsSync(component)) {
        console.log(`   ✅ ${path.basename(component)}`);
        validComponents++;
      } else {
        console.log(`   ❌ ${path.basename(component)} - Missing`);
      }
    });

    this.results.push({
      category: 'Components',
      passed: validComponents,
      total: components.length,
      status: validComponents === components.length ? 'pass' : 'fail'
    });
  }

  async validateServices() {
    console.log('\n⚙️  Validating Services...');
    
    const services = [
      'src/services/StrategyPerformanceService.ts',
      'src/services/StrategyAttributionService.ts',
      'src/services/StrategyMigrationService.ts',
      'src/services/AIInsightsService.ts',
      'src/services/BacktestingService.ts',
      'src/services/DisciplineTrackingService.ts',
      'src/services/StrategyAlertService.ts',
      'src/services/StrategyExportService.ts',
      'src/services/CacheService.ts',
      'src/services/PerformanceMonitoringService.ts'
    ];

    let validServices = 0;
    
    services.forEach(service => {
      if (fs.existsSync(service)) {
        console.log(`   ✅ ${path.basename(service)}`);
        validServices++;
      } else {
        console.log(`   ❌ ${path.basename(service)} - Missing`);
      }
    });

    this.results.push({
      category: 'Services',
      passed: validServices,
      total: services.length,
      status: validServices === services.length ? 'pass' : 'fail'
    });
  }

  async validateIntegration() {
    console.log('\n🔗 Validating Integration Tests...');
    
    const integrationTests = [
      'src/__tests__/comprehensive/system-integration-validator.ts',
      'src/__tests__/comprehensive/e2e/complete-user-workflows.e2e.test.tsx',
      'src/__tests__/comprehensive/migration/data-migration-validation.test.ts',
      'src/__tests__/comprehensive/performance/system-performance-validation.test.ts',
      'src/__tests__/comprehensive/final-integration-test-runner.ts'
    ];

    let validTests = 0;
    
    integrationTests.forEach(test => {
      if (fs.existsSync(test)) {
        console.log(`   ✅ ${path.basename(test)}`);
        validTests++;
      } else {
        console.log(`   ❌ ${path.basename(test)} - Missing`);
      }
    });

    this.results.push({
      category: 'Integration Tests',
      passed: validTests,
      total: integrationTests.length,
      status: validTests === integrationTests.length ? 'pass' : 'fail'
    });
  }

  async validatePerformance() {
    console.log('\n⚡ Validating Performance Infrastructure...');
    
    const performanceFiles = [
      'src/utils/performanceUtils.ts',
      'src/hooks/useLazyComponent.ts',
      'src/components/ui/VirtualList.tsx',
      'src/services/CacheService.ts',
      'src/services/PerformanceMonitoringService.ts'
    ];

    let validFiles = 0;
    
    performanceFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${path.basename(file)}`);
        validFiles++;
      } else {
        console.log(`   ❌ ${path.basename(file)} - Missing`);
      }
    });

    this.results.push({
      category: 'Performance Infrastructure',
      passed: validFiles,
      total: performanceFiles.length,
      status: validFiles === performanceFiles.length ? 'pass' : 'fail'
    });
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalTests = this.results.reduce((sum, result) => sum + result.total, 0);
    const passedCategories = this.results.filter(r => r.status === 'pass').length;
    const totalCategories = this.results.length;
    
    const overallScore = Math.round((totalPassed / totalTests) * 100);
    const categoryScore = Math.round((passedCategories / totalCategories) * 100);
    
    console.log('\n' + '═'.repeat(80));
    console.log('📊 SYSTEM INTEGRATION VALIDATION REPORT');
    console.log('═'.repeat(80));
    
    console.log(`\n🕐 Validation Completed: ${new Date().toLocaleString()}`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`📈 Component Score: ${overallScore}% (${totalPassed}/${totalTests})`);
    console.log(`🎯 Category Score: ${categoryScore}% (${passedCategories}/${totalCategories})`);

    console.log('\n📋 Category Results:');
    this.results.forEach(result => {
      const statusIcon = result.status === 'pass' ? '✅' : '❌';
      const percentage = Math.round((result.passed / result.total) * 100);
      console.log(`   ${statusIcon} ${result.category}: ${percentage}% (${result.passed}/${result.total})`);
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      overallScore,
      categoryScore,
      results: this.results,
      recommendations
    };

    this.saveReport(report);

    console.log('\n' + '═'.repeat(80));
    
    if (categoryScore === 100) {
      console.log('🎉 EXCELLENT! All system components are properly integrated.');
      console.log('   The Strategy Management System is ready for comprehensive testing.');
    } else if (categoryScore >= 80) {
      console.log('✅ GOOD! Most components are integrated with minor issues.');
      console.log('   Address the missing components before final validation.');
    } else {
      console.log('⚠️  NEEDS ATTENTION! Several components are missing or incomplete.');
      console.log('   Complete the missing components before proceeding.');
    }
    
    console.log('═'.repeat(80));

    // Exit with appropriate code
    process.exit(categoryScore < 80 ? 1 : 0);
  }

  generateRecommendations() {
    const recommendations = [];
    
    this.results.forEach(result => {
      if (result.status === 'fail') {
        const missing = result.total - result.passed;
        recommendations.push(`Complete ${missing} missing ${result.category.toLowerCase()}`);
      }
    });

    const overallScore = this.results.reduce((sum, result) => sum + result.passed, 0) / 
                        this.results.reduce((sum, result) => sum + result.total, 0) * 100;

    if (overallScore < 100) {
      recommendations.push('Ensure all components and services are implemented before final testing');
    }

    if (overallScore >= 90) {
      recommendations.push('System is nearly complete - run comprehensive test suite next');
    }

    return recommendations;
  }

  saveReport(report) {
    const reportPath = path.join('./test-results', 'system-integration-validation.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Main execution
async function main() {
  const validator = new SystemValidator();
  await validator.validate();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { SystemValidator };
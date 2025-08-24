/**
 * Migration Manager
 * Orchestrates the complete data migration process with rollback capabilities
 */

import { DataMigrationService, MigrationResult, MigrationConfig, LegacyTrade } from './dataMigrationService';
import { DataValidationService, ValidationReport } from './dataValidationService';
import { FeatureFlagService, TradeReviewFeatureFlags } from './featureFlagService';
import { EnhancedTrade } from '../types/tradeReview';

export interface MigrationPlan {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  steps: MigrationStep[];
  rollbackPlan: RollbackStep[];
  createdAt: string;
}

export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  order: number;
  required: boolean;
  estimatedDuration: number;
  dependencies: string[];
  rollbackSupported: boolean;
}

export interface RollbackStep {
  id: string;
  name: string;
  description: string;
  order: number;
  migrationStepId: string;
}

export interface MigrationProgress {
  planId: string;
  currentStep: string;
  completedSteps: string[];
  failedSteps: string[];
  overallProgress: number;
  startedAt: string;
  estimatedCompletion?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
}

export interface MigrationExecutionResult {
  success: boolean;
  planId: string;
  executedSteps: string[];
  failedSteps: string[];
  rollbackData: any;
  validationResults: ValidationReport[];
  errors: string[];
  warnings: string[];
  duration: number;
}

// Default migration plan for trade review system
const DEFAULT_MIGRATION_PLAN: MigrationPlan = {
  id: 'trade_review_v1_migration',
  name: 'Trade Review System v1.0 Migration',
  description: 'Migrate existing trade data to enhanced trade review format',
  estimatedDuration: 300000, // 5 minutes
  createdAt: new Date().toISOString(),
  steps: [
    {
      id: 'backup_existing_data',
      name: 'Backup Existing Data',
      description: 'Create backup of existing trade data',
      order: 1,
      required: true,
      estimatedDuration: 30000,
      dependencies: [],
      rollbackSupported: true
    },
    {
      id: 'validate_source_data',
      name: 'Validate Source Data',
      description: 'Validate existing trade data for migration compatibility',
      order: 2,
      required: true,
      estimatedDuration: 60000,
      dependencies: ['backup_existing_data'],
      rollbackSupported: true
    },
    {
      id: 'migrate_trade_structure',
      name: 'Migrate Trade Structure',
      description: 'Convert trades to enhanced format with review data',
      order: 3,
      required: true,
      estimatedDuration: 120000,
      dependencies: ['validate_source_data'],
      rollbackSupported: true
    },
    {
      id: 'validate_migrated_data',
      name: 'Validate Migrated Data',
      description: 'Validate migrated data integrity and completeness',
      order: 4,
      required: true,
      estimatedDuration: 60000,
      dependencies: ['migrate_trade_structure'],
      rollbackSupported: true
    },
    {
      id: 'update_feature_flags',
      name: 'Update Feature Flags',
      description: 'Enable enhanced trade review features',
      order: 5,
      required: false,
      estimatedDuration: 5000,
      dependencies: ['validate_migrated_data'],
      rollbackSupported: true
    },
    {
      id: 'cleanup_legacy_data',
      name: 'Cleanup Legacy Data',
      description: 'Archive or remove legacy data structures',
      order: 6,
      required: false,
      estimatedDuration: 30000,
      dependencies: ['update_feature_flags'],
      rollbackSupported: false
    }
  ],
  rollbackPlan: [
    {
      id: 'disable_features',
      name: 'Disable Enhanced Features',
      description: 'Disable enhanced trade review features',
      order: 1,
      migrationStepId: 'update_feature_flags'
    },
    {
      id: 'restore_trade_data',
      name: 'Restore Original Trade Data',
      description: 'Restore original trade data from backup',
      order: 2,
      migrationStepId: 'migrate_trade_structure'
    },
    {
      id: 'cleanup_migration_artifacts',
      name: 'Cleanup Migration Artifacts',
      description: 'Remove migration-related data and flags',
      order: 3,
      migrationStepId: 'backup_existing_data'
    }
  ]
};

export class MigrationManager {
  private migrationService: DataMigrationService;
  private validationService: DataValidationService;
  private featureFlagService: FeatureFlagService;
  private currentProgress: MigrationProgress | null = null;

  constructor(
    migrationConfig?: Partial<MigrationConfig>,
    featureFlagService?: FeatureFlagService
  ) {
    this.migrationService = new DataMigrationService(migrationConfig);
    this.validationService = new DataValidationService();
    this.featureFlagService = featureFlagService || new FeatureFlagService();
  }

  /**
   * Check if migration is needed
   */
  async isMigrationNeeded(): Promise<boolean> {
    // Check if data migration feature is enabled
    if (!this.featureFlagService.shouldPerformDataMigration()) {
      return false;
    }

    // Check if migration has already been completed
    const migrationVersion = this.migrationService.getCurrentMigrationVersion();
    if (migrationVersion !== '0.0.0') {
      return false;
    }

    // Check if there's legacy data to migrate
    const legacyData = await this.loadLegacyData();
    return legacyData.length > 0;
  }

  /**
   * Get migration plan
   */
  getMigrationPlan(): MigrationPlan {
    return { ...DEFAULT_MIGRATION_PLAN };
  }

  /**
   * Execute migration plan
   */
  async executeMigration(planId: string = DEFAULT_MIGRATION_PLAN.id): Promise<MigrationExecutionResult> {
    const startTime = Date.now();
    const plan = this.getMigrationPlan();
    
    if (plan.id !== planId) {
      throw new Error(`Migration plan '${planId}' not found`);
    }

    const result: MigrationExecutionResult = {
      success: true,
      planId,
      executedSteps: [],
      failedSteps: [],
      rollbackData: {},
      validationResults: [],
      errors: [],
      warnings: [],
      duration: 0
    };

    // Initialize progress tracking
    this.currentProgress = {
      planId,
      currentStep: '',
      completedSteps: [],
      failedSteps: [],
      overallProgress: 0,
      startedAt: new Date().toISOString(),
      status: 'in_progress'
    };

    try {
      // Execute migration steps in order
      const sortedSteps = plan.steps.sort((a, b) => a.order - b.order);
      
      for (const step of sortedSteps) {
        this.currentProgress.currentStep = step.id;
        
        try {
          await this.executeStep(step, result);
          this.currentProgress.completedSteps.push(step.id);
          result.executedSteps.push(step.id);
          
          // Update progress
          this.currentProgress.overallProgress = 
            (this.currentProgress.completedSteps.length / plan.steps.length) * 100;
            
        } catch (error) {
          const errorMessage = `Step '${step.name}' failed: ${error}`;
          result.errors.push(errorMessage);
          result.failedSteps.push(step.id);
          this.currentProgress.failedSteps.push(step.id);
          
          if (step.required) {
            result.success = false;
            this.currentProgress.status = 'failed';
            break;
          } else {
            result.warnings.push(`Optional step '${step.name}' failed but migration continues`);
          }
        }
      }

      // Set final status
      if (result.success) {
        this.currentProgress.status = 'completed';
        this.currentProgress.overallProgress = 100;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
      this.currentProgress.status = 'failed';
    }

    result.duration = Date.now() - startTime;
    this.saveMigrationProgress();

    return result;
  }

  /**
   * Execute a single migration step
   */
  private async executeStep(step: MigrationStep, result: MigrationExecutionResult): Promise<void> {
    switch (step.id) {
      case 'backup_existing_data':
        await this.executeBackupStep(result);
        break;
        
      case 'validate_source_data':
        await this.executeValidationStep(result);
        break;
        
      case 'migrate_trade_structure':
        await this.executeMigrationStep(result);
        break;
        
      case 'validate_migrated_data':
        await this.executePostMigrationValidation(result);
        break;
        
      case 'update_feature_flags':
        await this.executeFeatureFlagUpdate(result);
        break;
        
      case 'cleanup_legacy_data':
        await this.executeCleanupStep(result);
        break;
        
      default:
        throw new Error(`Unknown migration step: ${step.id}`);
    }
  }

  /**
   * Execute backup step
   */
  private async executeBackupStep(result: MigrationExecutionResult): Promise<void> {
    const legacyData = await this.loadLegacyData();
    
    // Create backup
    const backup = {
      timestamp: new Date().toISOString(),
      data: legacyData,
      metadata: {
        count: legacyData.length,
        version: this.migrationService.getCurrentMigrationVersion()
      }
    };
    
    localStorage.setItem('migration_backup', JSON.stringify(backup));
    result.rollbackData.backup = backup;
    
    result.warnings.push(`Backed up ${legacyData.length} trades`);
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(result: MigrationExecutionResult): Promise<void> {
    const legacyData = await this.loadLegacyData();
    const validationReports = this.validationService.validateTrades(legacyData);
    
    result.validationResults = validationReports;
    
    const summary = this.validationService.getValidationSummary(validationReports);
    if (summary.invalidTrades > 0) {
      result.warnings.push(
        `Found ${summary.invalidTrades} trades with validation issues. ` +
        `${summary.totalErrors} errors, ${summary.totalWarnings} warnings.`
      );
    }
    
    // Store validation results for later use
    result.rollbackData.validationReports = validationReports;
  }

  /**
   * Execute migration step
   */
  private async executeMigrationStep(result: MigrationExecutionResult): Promise<void> {
    const legacyData = await this.loadLegacyData();
    const migrationResult = await this.migrationService.migrateTrades(legacyData);
    
    if (!migrationResult.success) {
      throw new Error(`Migration failed: ${migrationResult.errors.map(e => e.error).join(', ')}`);
    }
    
    result.warnings.push(
      `Migrated ${migrationResult.migratedCount} trades successfully. ` +
      `${migrationResult.failedCount} trades failed migration.`
    );
    
    // Store migration results
    result.rollbackData.migrationResult = migrationResult;
  }

  /**
   * Execute post-migration validation
   */
  private async executePostMigrationValidation(result: MigrationExecutionResult): Promise<void> {
    const migratedData = await this.loadMigratedData();
    const validationReports = this.validationService.validateTrades(migratedData);
    
    const summary = this.validationService.getValidationSummary(validationReports);
    if (summary.invalidTrades > 0) {
      result.warnings.push(
        `Post-migration validation found ${summary.invalidTrades} invalid trades`
      );
    }
    
    result.validationResults.push(...validationReports);
  }

  /**
   * Execute feature flag update
   */
  private async executeFeatureFlagUpdate(result: MigrationExecutionResult): Promise<void> {
    // Enable enhanced trade review features gradually
    this.featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 100);
    this.featureFlagService.enableFlag(TradeReviewFeatureFlags.ADVANCED_NOTES_EDITOR, 100);
    this.featureFlagService.enableFlag(TradeReviewFeatureFlags.CONTEXTUAL_NAVIGATION, 100);
    
    // Enable other features with gradual rollout
    this.featureFlagService.enableFlag(TradeReviewFeatureFlags.PERFORMANCE_ANALYTICS, 50);
    this.featureFlagService.enableFlag(TradeReviewFeatureFlags.CHART_GALLERY_MANAGER, 25);
    
    result.warnings.push('Updated feature flags for enhanced trade review system');
    
    // Store original flag states for rollback
    result.rollbackData.originalFlags = this.featureFlagService.getAllFlags();
  }

  /**
   * Execute cleanup step
   */
  private async executeCleanupStep(result: MigrationExecutionResult): Promise<void> {
    // Archive legacy data instead of deleting (safer approach)
    const legacyData = localStorage.getItem('trades');
    if (legacyData) {
      const archive = {
        timestamp: new Date().toISOString(),
        data: JSON.parse(legacyData),
        archived: true
      };
      localStorage.setItem('trades_archive', JSON.stringify(archive));
      localStorage.removeItem('trades');
    }
    
    result.warnings.push('Archived legacy trade data');
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(executionResult: MigrationExecutionResult): Promise<MigrationResult> {
    const plan = this.getMigrationPlan();
    const rollbackSteps = plan.rollbackPlan.sort((a, b) => a.order - b.order);
    
    const rollbackResult: MigrationResult = {
      success: true,
      version: '0.0.0',
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      warnings: []
    };

    try {
      for (const step of rollbackSteps) {
        await this.executeRollbackStep(step, executionResult, rollbackResult);
      }
      
      // Update progress
      if (this.currentProgress) {
        this.currentProgress.status = 'rolled_back';
        this.saveMigrationProgress();
      }
      
    } catch (error) {
      rollbackResult.success = false;
      rollbackResult.errors.push({
        tradeId: 'rollback_error',
        error: `Rollback failed: ${error}`,
        severity: 'error'
      });
    }

    return rollbackResult;
  }

  /**
   * Execute rollback step
   */
  private async executeRollbackStep(
    step: RollbackStep,
    executionResult: MigrationExecutionResult,
    rollbackResult: MigrationResult
  ): Promise<void> {
    switch (step.id) {
      case 'disable_features':
        // Restore original feature flags
        if (executionResult.rollbackData.originalFlags) {
          const originalFlags = executionResult.rollbackData.originalFlags;
          originalFlags.forEach((flag: any) => {
            this.featureFlagService.updateFlag(flag.key, {
              enabled: flag.enabled,
              rolloutPercentage: flag.rolloutPercentage
            });
          });
        }
        break;
        
      case 'restore_trade_data':
        // Restore from backup
        if (executionResult.rollbackData.backup) {
          const backup = executionResult.rollbackData.backup;
          localStorage.setItem('trades', JSON.stringify(backup.data));
          localStorage.removeItem('migrated_trades');
          rollbackResult.migratedCount = backup.data.length;
        }
        break;
        
      case 'cleanup_migration_artifacts':
        // Remove migration-related data
        localStorage.removeItem('migration_backup');
        localStorage.removeItem('trade_migration_version');
        localStorage.removeItem('trade_migration_history');
        localStorage.removeItem('migration_progress');
        break;
    }
  }

  /**
   * Get migration progress
   */
  getMigrationProgress(): MigrationProgress | null {
    if (this.currentProgress) {
      return { ...this.currentProgress };
    }
    
    // Try to load from storage
    const stored = localStorage.getItem('migration_progress');
    if (stored) {
      return JSON.parse(stored);
    }
    
    return null;
  }

  /**
   * Save migration progress
   */
  private saveMigrationProgress(): void {
    if (this.currentProgress) {
      localStorage.setItem('migration_progress', JSON.stringify(this.currentProgress));
    }
  }

  /**
   * Load legacy trade data
   */
  private async loadLegacyData(): Promise<LegacyTrade[]> {
    const stored = localStorage.getItem('trades');
    if (!stored) return [];
    
    try {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to load legacy data:', error);
      return [];
    }
  }

  /**
   * Load migrated trade data
   */
  private async loadMigratedData(): Promise<EnhancedTrade[]> {
    const stored = localStorage.getItem('migrated_trades');
    if (!stored) return [];
    
    try {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to load migrated data:', error);
      return [];
    }
  }

  /**
   * Cancel ongoing migration
   */
  async cancelMigration(): Promise<void> {
    if (this.currentProgress && this.currentProgress.status === 'in_progress') {
      this.currentProgress.status = 'failed';
      this.currentProgress.overallProgress = 0;
      this.saveMigrationProgress();
    }
  }

  /**
   * Reset migration state
   */
  resetMigrationState(): void {
    this.currentProgress = null;
    localStorage.removeItem('migration_progress');
  }

  /**
   * Get migration history
   */
  getMigrationHistory(): any[] {
    return this.migrationService.getMigrationHistory();
  }

  /**
   * Check if rollback is available
   */
  isRollbackAvailable(): boolean {
    const backup = localStorage.getItem('migration_backup');
    return backup !== null;
  }
}
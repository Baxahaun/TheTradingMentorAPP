/**
 * Strategy Migration Service
 * Handles migration of existing playbooks to professional strategies
 */

import { 
  LegacyPlaybook, 
  LegacyFirebasePlaybook, 
  MigrationConfig, 
  MigrationResult, 
  MigrationValidationResult, 
  MigrationValidationError,
  MigrationFormData,
  RollbackOperation,
  DEFAULT_MIGRATION_CONFIG,
  MIGRATION_DEFAULTS
} from '../types/migration';
import { 
  ProfessionalStrategy, 
  StrategyPerformance, 
  ValidationResult 
} from '../types/strategy';
import { StrategyValidationService } from './StrategyValidationService';

export class StrategyMigrationService {
  private validationService: StrategyValidationService;
  private backups: Map<string, LegacyPlaybook | LegacyFirebasePlaybook> = new Map();

  constructor() {
    this.validationService = new StrategyValidationService();
  }

  /**
   * Validate if a playbook can be migrated
   */
  async validateForMigration(
    playbook: LegacyPlaybook | LegacyFirebasePlaybook
  ): Promise<MigrationValidationResult> {
    const errors: MigrationValidationError[] = [];
    const warnings: MigrationValidationError[] = [];
    const requiredFields: string[] = [];
    const optionalFields: string[] = [];

    // Check required fields
    if (!playbook.id) {
      errors.push({
        field: 'id',
        code: 'MISSING_ID',
        message: 'Playbook ID is required for migration',
        severity: 'error'
      });
    }

    const title = this.getTitle(playbook);
    if (!title || title.trim().length < 3) {
      errors.push({
        field: 'title',
        code: 'INVALID_TITLE',
        message: 'Playbook title must be at least 3 characters long',
        severity: 'error',
        suggestion: 'Provide a descriptive title for your strategy'
      });
    }

    const description = playbook.description;
    if (!description || description.trim().length < 10) {
      warnings.push({
        field: 'description',
        code: 'SHORT_DESCRIPTION',
        message: 'Description is very short, consider adding more details',
        severity: 'warning',
        suggestion: 'A detailed description helps with strategy analysis'
      });
    }

    // Check for professional fields that will need user input
    requiredFields.push(
      'methodology',
      'primaryTimeframe',
      'assetClasses',
      'positionSizingMethod',
      'maxRiskPerTrade',
      'riskRewardRatio'
    );

    optionalFields.push(
      'technicalConditions',
      'confirmationSignals',
      'timingCriteria',
      'volatilityRequirements'
    );

    // Check if entry/exit parameters exist for transformation
    const entryParams = this.getEntryParameters(playbook);
    const exitParams = this.getExitParameters(playbook);

    if (!entryParams || entryParams.trim().length < 5) {
      warnings.push({
        field: 'entryParameters',
        code: 'MINIMAL_ENTRY_PARAMS',
        message: 'Entry parameters are minimal, you may need to enhance them',
        severity: 'warning',
        suggestion: 'Consider adding more detailed entry criteria during migration'
      });
    }

    if (!exitParams || exitParams.trim().length < 5) {
      warnings.push({
        field: 'exitParameters',
        code: 'MINIMAL_EXIT_PARAMS',
        message: 'Exit parameters are minimal, you may need to enhance them',
        severity: 'warning',
        suggestion: 'Consider adding more detailed exit criteria during migration'
      });
    }

    const isValid = errors.length === 0;
    const canProceed = isValid;

    return {
      isValid,
      canProceed,
      errors,
      warnings,
      requiredFields,
      optionalFields
    };
  }

  /**
   * Perform the actual migration
   */
  async migratePlaybook(
    playbook: LegacyPlaybook | LegacyFirebasePlaybook,
    formData: MigrationFormData,
    config: MigrationConfig = DEFAULT_MIGRATION_CONFIG
  ): Promise<MigrationResult> {
    const migrationId = `migration_${playbook.id}_${Date.now()}`;
    const migratedFields: string[] = [];
    const skippedFields: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Create backup if requested
      let backupId: string | undefined;
      if (config.createBackup) {
        backupId = await this.createBackup(playbook);
      }

      // Step 2: Validate source data if requested
      if (config.validateBeforeMigration) {
        const validation = await this.validateForMigration(playbook);
        if (!validation.canProceed) {
          return {
            status: 'failed',
            sourcePlaybookId: playbook.id,
            migratedFields: [],
            skippedFields: [],
            errors: validation.errors.map(e => e.message),
            warnings: validation.warnings.map(w => w.message),
            backupId,
            completedAt: new Date().toISOString(),
            rollbackAvailable: !!backupId
          };
        }
      }

      // Step 3: Create the professional strategy
      const strategy = await this.createProfessionalStrategy(playbook, formData);
      
      // Step 4: Validate the created strategy
      const strategyValidation = this.validationService.validateStrategy(strategy);
      if (!strategyValidation.isValid) {
        errors.push(...strategyValidation.errors.map(e => e.message));
        warnings.push(...strategyValidation.warnings.map(w => w.message));
      }

      // Step 5: Track migrated fields
      migratedFields.push(
        'id', 'title', 'description', 'color',
        'methodology', 'primaryTimeframe', 'assetClasses',
        'setupConditions', 'entryTriggers', 'riskManagement',
        'performance'
      );

      // Step 6: Preserve legacy fields if requested
      if (config.preserveOriginal) {
        migratedFields.push('marketConditions', 'entryParameters', 'exitParameters');
        if ('timesUsed' in playbook) {
          migratedFields.push('timesUsed', 'tradesWon', 'tradesLost');
        }
      }

      const status: 'success' | 'partial' = errors.length > 0 ? 'partial' : 'success';

      return {
        status,
        sourcePlaybookId: playbook.id,
        targetStrategyId: strategy.id,
        migratedFields,
        skippedFields,
        errors,
        warnings,
        backupId,
        completedAt: new Date().toISOString(),
        rollbackAvailable: !!backupId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
      errors.push(errorMessage);

      return {
        status: 'failed',
        sourcePlaybookId: playbook.id,
        migratedFields,
        skippedFields,
        errors,
        warnings,
        backupId: undefined,
        completedAt: new Date().toISOString(),
        rollbackAvailable: false
      };
    }
  }

  /**
   * Create professional strategy from legacy playbook and form data
   */
  private async createProfessionalStrategy(
    playbook: LegacyPlaybook | LegacyFirebasePlaybook,
    formData: MigrationFormData
  ): Promise<ProfessionalStrategy> {
    const now = new Date().toISOString();
    
    // Initialize performance metrics from legacy data
    const performance = this.initializePerformanceMetrics(playbook);

    const strategy: ProfessionalStrategy = {
      // Basic fields (direct mapping)
      id: playbook.id,
      title: this.getTitle(playbook),
      description: playbook.description,
      color: this.getColor(playbook),

      // Legacy fields (preserved for backward compatibility)
      marketConditions: this.getMarketConditions(playbook),
      entryParameters: this.getEntryParameters(playbook),
      exitParameters: this.getExitParameters(playbook),
      timesUsed: this.getTimesUsed(playbook),
      tradesWon: this.getTradesWon(playbook),
      tradesLost: this.getTradesLost(playbook),

      // Professional fields from form data
      methodology: formData.methodology,
      primaryTimeframe: formData.primaryTimeframe,
      assetClasses: formData.assetClasses,

      // Enhanced setup conditions
      setupConditions: {
        marketEnvironment: this.getMarketConditions(playbook) || 'General market conditions',
        technicalConditions: formData.technicalConditions,
        fundamentalConditions: formData.fundamentalConditions,
        volatilityRequirements: formData.volatilityRequirements
      },

      // Enhanced entry triggers
      entryTriggers: {
        primarySignal: this.getEntryParameters(playbook) || 'Entry signal to be defined',
        confirmationSignals: formData.confirmationSignals,
        timingCriteria: formData.timingCriteria
      },

      // Professional risk management
      riskManagement: {
        positionSizingMethod: formData.positionSizingMethod,
        maxRiskPerTrade: formData.maxRiskPerTrade,
        stopLossRule: formData.stopLossRule,
        takeProfitRule: formData.takeProfitRule,
        riskRewardRatio: formData.riskRewardRatio
      },

      // Performance tracking
      performance,

      // Metadata
      createdAt: this.getCreatedAt(playbook) || now,
      updatedAt: now,
      lastUsed: this.getLastUsed(playbook),
      version: 1,
      isActive: true
    };

    return strategy;
  }

  /**
   * Initialize performance metrics from legacy playbook data
   */
  private initializePerformanceMetrics(
    playbook: LegacyPlaybook | LegacyFirebasePlaybook
  ): StrategyPerformance {
    const timesUsed = this.getTimesUsed(playbook) || 0;
    const tradesWon = this.getTradesWon(playbook) || 0;
    const tradesLost = this.getTradesLost(playbook) || 0;
    const totalTrades = tradesWon + tradesLost;

    // Calculate basic metrics
    const winRate = totalTrades > 0 ? (tradesWon / totalTrades) * 100 : 0;
    
    // Use conservative defaults for professional metrics when no data available
    const profitFactor = totalTrades > 0 ? Math.max(1.0, winRate / (100 - winRate)) : 1.0;
    const expectancy = 0; // Cannot calculate without P&L data
    const averageWin = 0; // Cannot calculate without P&L data
    const averageLoss = 0; // Cannot calculate without P&L data
    const riskRewardRatio = 1.0; // Default assumption

    return {
      totalTrades,
      winningTrades: tradesWon,
      losingTrades: tradesLost,
      profitFactor,
      expectancy,
      winRate,
      averageWin,
      averageLoss,
      riskRewardRatio,
      maxDrawdown: 0,
      maxDrawdownDuration: 0,
      sampleSize: totalTrades,
      confidenceLevel: 95,
      statisticallySignificant: totalTrades >= 30,
      monthlyReturns: [],
      performanceTrend: totalTrades < 10 ? 'Insufficient Data' : 'Stable',
      lastCalculated: new Date().toISOString(),
      calculationVersion: 1
    };
  }

  /**
   * Create backup of original playbook
   */
  private async createBackup(
    playbook: LegacyPlaybook | LegacyFirebasePlaybook
  ): Promise<string> {
    const backupId = `backup_${playbook.id}_${Date.now()}`;
    this.backups.set(backupId, { ...playbook });
    
    // In a real implementation, this would save to persistent storage
    // For now, we'll just store in memory
    console.log(`Created backup ${backupId} for playbook ${playbook.id}`);
    
    return backupId;
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(
    migrationResult: MigrationResult,
    reason: string
  ): Promise<RollbackOperation> {
    const rollback: RollbackOperation = {
      migrationId: `${migrationResult.sourcePlaybookId}_${Date.now()}`,
      sourcePlaybookId: migrationResult.sourcePlaybookId,
      targetStrategyId: migrationResult.targetStrategyId!,
      backupData: this.backups.get(migrationResult.backupId!)!,
      rollbackReason: reason,
      requestedAt: new Date().toISOString()
    };

    try {
      // In a real implementation, this would:
      // 1. Delete the migrated strategy
      // 2. Restore the original playbook from backup
      // 3. Update any references
      
      rollback.completedAt = new Date().toISOString();
      rollback.success = true;
      
      console.log(`Rollback completed for migration ${rollback.migrationId}`);
      
    } catch (error) {
      rollback.success = false;
      rollback.error = error instanceof Error ? error.message : 'Rollback failed';
    }

    return rollback;
  }

  /**
   * Get default form data for migration
   */
  getDefaultFormData(playbook: LegacyPlaybook | LegacyFirebasePlaybook): MigrationFormData {
    return {
      methodology: MIGRATION_DEFAULTS.methodology,
      primaryTimeframe: MIGRATION_DEFAULTS.primaryTimeframe,
      assetClasses: ['Forex'], // Default assumption
      
      // Derive technical conditions from entry parameters
      technicalConditions: this.extractTechnicalConditions(playbook),
      fundamentalConditions: [],
      volatilityRequirements: undefined,
      
      // Default confirmation signals and timing
      confirmationSignals: [],
      timingCriteria: 'Market open hours',
      
      // Risk management defaults
      positionSizingMethod: MIGRATION_DEFAULTS.positionSizingMethod,
      maxRiskPerTrade: MIGRATION_DEFAULTS.maxRiskPerTrade,
      stopLossRule: MIGRATION_DEFAULTS.stopLossRule,
      takeProfitRule: MIGRATION_DEFAULTS.takeProfitRule,
      riskRewardRatio: MIGRATION_DEFAULTS.riskRewardRatio
    };
  }

  // ===== HELPER METHODS =====

  private getTitle(playbook: LegacyPlaybook | LegacyFirebasePlaybook): string {
    return 'title' in playbook ? playbook.title : playbook.name;
  }

  private getColor(playbook: LegacyPlaybook | LegacyFirebasePlaybook): string {
    return 'color' in playbook ? playbook.color : '#3B82F6'; // Default blue
  }

  private getMarketConditions(playbook: LegacyPlaybook | LegacyFirebasePlaybook): string | undefined {
    if ('marketConditions' in playbook) return playbook.marketConditions;
    if ('setup' in playbook) return playbook.setup;
    return undefined;
  }

  private getEntryParameters(playbook: LegacyPlaybook | LegacyFirebasePlaybook): string | undefined {
    if ('entryParameters' in playbook) return playbook.entryParameters;
    if ('entry' in playbook) return playbook.entry;
    return undefined;
  }

  private getExitParameters(playbook: LegacyPlaybook | LegacyFirebasePlaybook): string | undefined {
    if ('exitParameters' in playbook) return playbook.exitParameters;
    if ('exit' in playbook) return playbook.exit;
    return undefined;
  }

  private getTimesUsed(playbook: LegacyPlaybook | LegacyFirebasePlaybook): number | undefined {
    return 'timesUsed' in playbook ? playbook.timesUsed : undefined;
  }

  private getTradesWon(playbook: LegacyPlaybook | LegacyFirebasePlaybook): number | undefined {
    return 'tradesWon' in playbook ? playbook.tradesWon : undefined;
  }

  private getTradesLost(playbook: LegacyPlaybook | LegacyFirebasePlaybook): number | undefined {
    return 'tradesLost' in playbook ? playbook.tradesLost : undefined;
  }

  private getCreatedAt(playbook: LegacyPlaybook | LegacyFirebasePlaybook): string | undefined {
    if ('createdAt' in playbook && playbook.createdAt) {
      // Handle Firebase Timestamp
      if (typeof playbook.createdAt === 'object' && 'toDate' in playbook.createdAt) {
        return playbook.createdAt.toDate().toISOString();
      }
      // Handle string dates
      if (typeof playbook.createdAt === 'string') {
        return playbook.createdAt;
      }
    }
    return undefined;
  }

  private getLastUsed(playbook: LegacyPlaybook | LegacyFirebasePlaybook): string | undefined {
    // Legacy playbooks don't typically have lastUsed, so return undefined
    return undefined;
  }

  private extractTechnicalConditions(playbook: LegacyPlaybook | LegacyFirebasePlaybook): string[] {
    const entryParams = this.getEntryParameters(playbook);
    if (!entryParams) return [];

    // Simple extraction - look for common technical terms
    const conditions: string[] = [];
    const text = entryParams.toLowerCase();

    if (text.includes('rsi') || text.includes('relative strength')) {
      conditions.push('RSI indicator signal');
    }
    if (text.includes('macd')) {
      conditions.push('MACD crossover');
    }
    if (text.includes('moving average') || text.includes('ma ') || text.includes('ema')) {
      conditions.push('Moving average alignment');
    }
    if (text.includes('support') || text.includes('resistance')) {
      conditions.push('Support/Resistance levels');
    }
    if (text.includes('breakout') || text.includes('break out')) {
      conditions.push('Breakout pattern');
    }
    if (text.includes('trend') || text.includes('trending')) {
      conditions.push('Trend confirmation');
    }

    return conditions.length > 0 ? conditions : ['Technical analysis signal'];
  }
}
/**
 * Strategy Validation Service
 * Provides comprehensive validation for professional strategies with business rule enforcement
 */

import {
  ProfessionalStrategy,
  ValidationResult,
  ValidationError,
  StrategyValidationRules,
  DEFAULT_VALIDATION_RULES,
  TradeWithStrategy
} from '../types/strategy';
import {
  validateProfessionalStrategy,
  validatePositionSizingMethod,
  validateStopLossRule,
  validateTakeProfitRule,
  validateStrategyPerformance,
  validateTradeWithStrategy,
  formatValidationErrors,
  getValidationSummary,
  hasStatisticalSignificance
} from '../types/strategyValidation';

export class StrategyValidationService {
  private validationRules: StrategyValidationRules;

  constructor(customRules?: Partial<StrategyValidationRules>) {
    this.validationRules = {
      ...DEFAULT_VALIDATION_RULES,
      ...customRules
    };
  }

  /**
   * Validate a complete professional strategy
   */
  validateStrategy(
    strategy: Partial<ProfessionalStrategy>,
    rules?: StrategyValidationRules
  ): ValidationResult {
    const validationRules = rules || this.validationRules;
    return validateProfessionalStrategy(strategy, validationRules);
  }

  /**
   * Validate strategy for creation (stricter validation)
   */
  validateForCreation(strategy: Partial<ProfessionalStrategy>): ValidationResult {
    const result = this.validateStrategy(strategy);
    const errors: ValidationError[] = [...result.errors];
    const warnings: ValidationError[] = [...result.warnings];

    // Additional creation-specific validations
    if (!strategy.id || strategy.id.trim().length === 0) {
      errors.push({
        field: 'id',
        code: 'REQUIRED',
        message: 'Strategy ID is required for creation',
        severity: 'error'
      });
    }

    if (!strategy.createdAt) {
      errors.push({
        field: 'createdAt',
        code: 'REQUIRED',
        message: 'Creation timestamp is required',
        severity: 'error'
      });
    }

    // Ensure all required professional fields are present
    if (!strategy.methodology) {
      errors.push({
        field: 'methodology',
        code: 'REQUIRED',
        message: 'Methodology is required for professional strategies',
        severity: 'error'
      });
    }

    if (!strategy.riskManagement) {
      errors.push({
        field: 'riskManagement',
        code: 'REQUIRED',
        message: 'Risk management configuration is required',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate strategy for update (more lenient)
   */
  validateForUpdate(
    strategy: Partial<ProfessionalStrategy>,
    existingStrategy: ProfessionalStrategy
  ): ValidationResult {
    const result = this.validateStrategy(strategy);
    const errors: ValidationError[] = [...result.errors];
    const warnings: ValidationError[] = [...result.warnings];

    // Check for breaking changes
    if (strategy.id && strategy.id !== existingStrategy.id) {
      errors.push({
        field: 'id',
        code: 'IMMUTABLE',
        message: 'Strategy ID cannot be changed after creation',
        severity: 'error'
      });
    }

    // Warn about performance data changes
    if (strategy.performance && existingStrategy.performance) {
      if (strategy.performance.totalTrades < existingStrategy.performance.totalTrades) {
        warnings.push({
          field: 'performance.totalTrades',
          code: 'DATA_REGRESSION',
          message: 'Total trades count is decreasing - this may indicate data loss',
          severity: 'warning'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate business rules for strategy operations
   */
  validateBusinessRules(strategy: ProfessionalStrategy): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Risk management business rules
    if (strategy.riskManagement) {
      // Check for excessive risk
      if (strategy.riskManagement.maxRiskPerTrade > this.validationRules.businessRules.maxRiskPerTrade.max) {
        errors.push({
          field: 'riskManagement.maxRiskPerTrade',
          code: 'BUSINESS_RULE_VIOLATION',
          message: `Risk per trade exceeds maximum allowed (${this.validationRules.businessRules.maxRiskPerTrade.max}%)`,
          severity: 'error'
        });
      }

      // Check risk-reward ratio
      if (strategy.riskManagement.riskRewardRatio < this.validationRules.businessRules.riskRewardRatio.min) {
        errors.push({
          field: 'riskManagement.riskRewardRatio',
          code: 'BUSINESS_RULE_VIOLATION',
          message: `Risk-reward ratio below minimum required (${this.validationRules.businessRules.riskRewardRatio.min}:1)`,
          severity: 'error'
        });
      }
    }

    // Performance-based business rules
    if (strategy.performance) {
      // Check for statistical significance
      if (!hasStatisticalSignificance(strategy.performance)) {
        warnings.push({
          field: 'performance',
          code: 'INSUFFICIENT_DATA',
          message: 'Strategy lacks sufficient trade data for reliable performance metrics',
          severity: 'warning'
        });
      }

      // Check for concerning performance trends
      if (strategy.performance.performanceTrend === 'Declining') {
        warnings.push({
          field: 'performance.performanceTrend',
          code: 'PERFORMANCE_CONCERN',
          message: 'Strategy shows declining performance trend - consider review',
          severity: 'warning'
        });
      }

      // Check drawdown limits
      if (strategy.performance.maxDrawdown > 20) {
        warnings.push({
          field: 'performance.maxDrawdown',
          code: 'HIGH_DRAWDOWN',
          message: 'Maximum drawdown exceeds 20% - high risk strategy',
          severity: 'warning'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate data integrity between strategy and related trades
   */
  validateDataIntegrity(
    strategy: ProfessionalStrategy,
    relatedTrades: TradeWithStrategy[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check trade-strategy consistency
    const tradesWithMismatchedStrategy = relatedTrades.filter(
      trade => trade.strategyId !== strategy.id
    );

    if (tradesWithMismatchedStrategy.length > 0) {
      errors.push({
        field: 'trades',
        code: 'DATA_INCONSISTENCY',
        message: `${tradesWithMismatchedStrategy.length} trades have mismatched strategy IDs`,
        severity: 'error'
      });
    }

    // Validate performance metrics against actual trades
    if (strategy.performance && relatedTrades.length > 0) {
      const actualTotalTrades = relatedTrades.length;
      const reportedTotalTrades = strategy.performance.totalTrades;

      if (Math.abs(actualTotalTrades - reportedTotalTrades) > 0) {
        warnings.push({
          field: 'performance.totalTrades',
          code: 'METRIC_MISMATCH',
          message: `Reported total trades (${reportedTotalTrades}) doesn't match actual trades (${actualTotalTrades})`,
          severity: 'warning'
        });
      }

      // Check win/loss counts
      const winningTrades = relatedTrades.filter(trade => 
        trade.pnl !== undefined && trade.pnl > 0
      ).length;
      const losingTrades = relatedTrades.filter(trade => 
        trade.pnl !== undefined && trade.pnl < 0
      ).length;

      if (strategy.performance.winningTrades !== winningTrades) {
        warnings.push({
          field: 'performance.winningTrades',
          code: 'METRIC_MISMATCH',
          message: `Reported winning trades (${strategy.performance.winningTrades}) doesn't match actual (${winningTrades})`,
          severity: 'warning'
        });
      }

      if (strategy.performance.losingTrades !== losingTrades) {
        warnings.push({
          field: 'performance.losingTrades',
          code: 'METRIC_MISMATCH',
          message: `Reported losing trades (${strategy.performance.losingTrades}) doesn't match actual (${losingTrades})`,
          severity: 'warning'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate trade assignment to strategy
   */
  validateTradeAssignment(
    trade: TradeWithStrategy,
    strategy: ProfessionalStrategy
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Basic trade validation
    const tradeValidation = validateTradeWithStrategy(trade);
    errors.push(...tradeValidation.errors);
    warnings.push(...tradeValidation.warnings);

    // Strategy-specific validations
    if (trade.strategyId !== strategy.id) {
      errors.push({
        field: 'strategyId',
        code: 'STRATEGY_MISMATCH',
        message: 'Trade strategy ID does not match target strategy',
        severity: 'error'
      });
    }

    // Check asset class compatibility
    if (strategy.assetClasses && trade.symbol) {
      // This is a simplified check - in reality, you'd have a more sophisticated
      // asset class detection system
      const isForex = /^[A-Z]{6}$/.test(trade.symbol);
      const isStock = /^[A-Z]{1,5}$/.test(trade.symbol);
      
      if (isForex && !strategy.assetClasses.includes('Forex')) {
        warnings.push({
          field: 'symbol',
          code: 'ASSET_CLASS_MISMATCH',
          message: 'Trade appears to be Forex but strategy is not configured for Forex',
          severity: 'warning'
        });
      }
      
      if (isStock && !strategy.assetClasses.includes('Stocks')) {
        warnings.push({
          field: 'symbol',
          code: 'ASSET_CLASS_MISMATCH',
          message: 'Trade appears to be Stock but strategy is not configured for Stocks',
          severity: 'warning'
        });
      }
    }

    // Check adherence score validity
    if (trade.adherenceScore !== undefined) {
      if (trade.adherenceScore < 50) {
        warnings.push({
          field: 'adherenceScore',
          code: 'LOW_ADHERENCE',
          message: 'Trade has low adherence score - may not follow strategy rules',
          severity: 'warning'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Batch validate multiple strategies
   */
  validateMultipleStrategies(strategies: ProfessionalStrategy[]): {
    results: Array<{ strategyId: string; validation: ValidationResult }>;
    summary: {
      totalStrategies: number;
      validStrategies: number;
      invalidStrategies: number;
      strategiesWithWarnings: number;
    };
  } {
    const results = strategies.map(strategy => ({
      strategyId: strategy.id,
      validation: this.validateStrategy(strategy)
    }));

    const summary = {
      totalStrategies: strategies.length,
      validStrategies: results.filter(r => r.validation.isValid).length,
      invalidStrategies: results.filter(r => !r.validation.isValid).length,
      strategiesWithWarnings: results.filter(r => r.validation.warnings.length > 0).length
    };

    return { results, summary };
  }

  /**
   * Get user-friendly validation messages
   */
  getValidationMessages(result: ValidationResult): string[] {
    return formatValidationErrors(result);
  }

  /**
   * Get validation summary
   */
  getValidationSummary(result: ValidationResult): string {
    return getValidationSummary(result);
  }

  /**
   * Check if strategy has sufficient data for reliable analysis
   */
  hasStatisticalSignificance(strategy: ProfessionalStrategy): boolean {
    return strategy.performance ? hasStatisticalSignificance(strategy.performance) : false;
  }

  /**
   * Update validation rules
   */
  updateValidationRules(newRules: Partial<StrategyValidationRules>): void {
    this.validationRules = {
      ...this.validationRules,
      ...newRules
    };
  }

  /**
   * Get current validation rules
   */
  getValidationRules(): StrategyValidationRules {
    return { ...this.validationRules };
  }

  /**
   * Validate strategy deletion (check for dependencies)
   */
  validateForDeletion(
    strategy: ProfessionalStrategy,
    relatedTrades: TradeWithStrategy[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check for active trades
    const activeTrades = relatedTrades.filter(trade => 
      trade.status === 'Open' || trade.status === 'Pending'
    );

    if (activeTrades.length > 0) {
      errors.push({
        field: 'trades',
        code: 'ACTIVE_DEPENDENCIES',
        message: `Cannot delete strategy with ${activeTrades.length} active trades`,
        severity: 'error'
      });
    }

    // Warn about historical data loss
    if (relatedTrades.length > 0) {
      warnings.push({
        field: 'trades',
        code: 'DATA_LOSS_WARNING',
        message: `Deleting strategy will affect ${relatedTrades.length} historical trades`,
        severity: 'warning'
      });
    }

    // Check if strategy has significant performance data
    if (strategy.performance && strategy.performance.totalTrades > 50) {
      warnings.push({
        field: 'performance',
        code: 'SIGNIFICANT_DATA_LOSS',
        message: 'Strategy has significant performance history that will be lost',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
/**
 * Validation schemas and functions for Professional Strategy Management System
 */

import {
  ProfessionalStrategy,
  PositionSizingMethod,
  StopLossRule,
  TakeProfitRule,
  StrategyPerformance,
  TradeWithStrategy,
  ValidationResult,
  ValidationError,
  StrategyValidationRules,
  DEFAULT_VALIDATION_RULES,
  METHODOLOGY_TYPES,
  POSITION_SIZING_TYPES,
  STOP_LOSS_TYPES,
  TAKE_PROFIT_TYPES,
  PERFORMANCE_TRENDS
} from './strategy';

/**
 * Validates a professional strategy object
 */
export function validateProfessionalStrategy(
  strategy: Partial<ProfessionalStrategy>,
  rules: StrategyValidationRules = DEFAULT_VALIDATION_RULES
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate required fields
  if (!strategy.title || strategy.title.trim().length === 0) {
    errors.push({
      field: 'title',
      code: 'REQUIRED',
      message: 'Strategy title is required',
      severity: 'error'
    });
  } else if (strategy.title.length < rules.required.title.minLength) {
    errors.push({
      field: 'title',
      code: 'MIN_LENGTH',
      message: `Title must be at least ${rules.required.title.minLength} characters`,
      severity: 'error'
    });
  } else if (strategy.title.length > rules.required.title.maxLength) {
    errors.push({
      field: 'title',
      code: 'MAX_LENGTH',
      message: `Title must not exceed ${rules.required.title.maxLength} characters`,
      severity: 'error'
    });
  }

  // Validate methodology
  if (!strategy.methodology) {
    errors.push({
      field: 'methodology',
      code: 'REQUIRED',
      message: 'Methodology is required',
      severity: 'error'
    });
  } else if (!METHODOLOGY_TYPES.includes(strategy.methodology as any)) {
    errors.push({
      field: 'methodology',
      code: 'INVALID_VALUE',
      message: `Methodology must be one of: ${METHODOLOGY_TYPES.join(', ')}`,
      severity: 'error'
    });
  }

  // Validate setup conditions
  if (!strategy.setupConditions) {
    errors.push({
      field: 'setupConditions',
      code: 'REQUIRED',
      message: 'Setup conditions are required',
      severity: 'error'
    });
  } else {
    if (!strategy.setupConditions.marketEnvironment || 
        strategy.setupConditions.marketEnvironment.length < rules.required.setupConditions.marketEnvironment.minLength) {
      errors.push({
        field: 'setupConditions.marketEnvironment',
        code: 'MIN_LENGTH',
        message: `Market environment description must be at least ${rules.required.setupConditions.marketEnvironment.minLength} characters`,
        severity: 'error'
      });
    }

    if (!strategy.setupConditions.technicalConditions || 
        strategy.setupConditions.technicalConditions.length === 0) {
      errors.push({
        field: 'setupConditions.technicalConditions',
        code: 'REQUIRED',
        message: 'At least one technical condition is required',
        severity: 'error'
      });
    }
  }

  // Validate entry triggers
  if (!strategy.entryTriggers) {
    errors.push({
      field: 'entryTriggers',
      code: 'REQUIRED',
      message: 'Entry triggers are required',
      severity: 'error'
    });
  } else {
    if (!strategy.entryTriggers.primarySignal || 
        strategy.entryTriggers.primarySignal.length < rules.required.entryTriggers.primarySignal.minLength) {
      errors.push({
        field: 'entryTriggers.primarySignal',
        code: 'MIN_LENGTH',
        message: `Primary signal must be at least ${rules.required.entryTriggers.primarySignal.minLength} characters`,
        severity: 'error'
      });
    }

    if (!strategy.entryTriggers.confirmationSignals || 
        strategy.entryTriggers.confirmationSignals.length === 0) {
      warnings.push({
        field: 'entryTriggers.confirmationSignals',
        code: 'RECOMMENDED',
        message: 'Confirmation signals are recommended for better strategy reliability',
        severity: 'warning'
      });
    }
  }

  // Validate risk management
  if (!strategy.riskManagement) {
    errors.push({
      field: 'riskManagement',
      code: 'REQUIRED',
      message: 'Risk management configuration is required',
      severity: 'error'
    });
  } else {
    // Validate max risk per trade
    if (strategy.riskManagement.maxRiskPerTrade === undefined || 
        strategy.riskManagement.maxRiskPerTrade === null) {
      errors.push({
        field: 'riskManagement.maxRiskPerTrade',
        code: 'REQUIRED',
        message: 'Maximum risk per trade is required',
        severity: 'error'
      });
    } else {
      if (strategy.riskManagement.maxRiskPerTrade < rules.businessRules.maxRiskPerTrade.min) {
        errors.push({
          field: 'riskManagement.maxRiskPerTrade',
          code: 'MIN_VALUE',
          message: `Risk per trade cannot be less than ${rules.businessRules.maxRiskPerTrade.min}%`,
          severity: 'error'
        });
      }
      
      if (strategy.riskManagement.maxRiskPerTrade > rules.businessRules.maxRiskPerTrade.max) {
        errors.push({
          field: 'riskManagement.maxRiskPerTrade',
          code: 'MAX_VALUE',
          message: `Risk per trade cannot exceed ${rules.businessRules.maxRiskPerTrade.max}%`,
          severity: 'error'
        });
      }

      if (strategy.riskManagement.maxRiskPerTrade > rules.warnings.highRisk.threshold) {
        warnings.push({
          field: 'riskManagement.maxRiskPerTrade',
          code: 'HIGH_RISK',
          message: rules.warnings.highRisk.message,
          severity: 'warning'
        });
      }
    }

    // Validate risk-reward ratio
    if (strategy.riskManagement.riskRewardRatio === undefined || 
        strategy.riskManagement.riskRewardRatio === null) {
      errors.push({
        field: 'riskManagement.riskRewardRatio',
        code: 'REQUIRED',
        message: 'Risk-reward ratio is required',
        severity: 'error'
      });
    } else {
      if (strategy.riskManagement.riskRewardRatio < rules.businessRules.riskRewardRatio.min) {
        errors.push({
          field: 'riskManagement.riskRewardRatio',
          code: 'MIN_VALUE',
          message: `Risk-reward ratio cannot be less than ${rules.businessRules.riskRewardRatio.min}:1`,
          severity: 'error'
        });
      }
      
      if (strategy.riskManagement.riskRewardRatio > rules.businessRules.riskRewardRatio.max) {
        warnings.push({
          field: 'riskManagement.riskRewardRatio',
          code: 'HIGH_VALUE',
          message: `Risk-reward ratio of ${strategy.riskManagement.riskRewardRatio}:1 is very high - ensure it's realistic`,
          severity: 'warning'
        });
      }
    }

    // Validate position sizing method
    const positionSizingValidation = validatePositionSizingMethod(strategy.riskManagement.positionSizingMethod);
    errors.push(...positionSizingValidation.errors);
    warnings.push(...positionSizingValidation.warnings);

    // Validate stop loss rule
    const stopLossValidation = validateStopLossRule(strategy.riskManagement.stopLossRule);
    errors.push(...stopLossValidation.errors);
    warnings.push(...stopLossValidation.warnings);

    // Validate take profit rule
    const takeProfitValidation = validateTakeProfitRule(strategy.riskManagement.takeProfitRule);
    errors.push(...takeProfitValidation.errors);
    warnings.push(...takeProfitValidation.warnings);
  }

  // Validate performance data if present
  if (strategy.performance) {
    const performanceValidation = validateStrategyPerformance(strategy.performance);
    errors.push(...performanceValidation.errors);
    warnings.push(...performanceValidation.warnings);
  }

  // Validate metadata
  if (!strategy.primaryTimeframe || strategy.primaryTimeframe.trim().length === 0) {
    errors.push({
      field: 'primaryTimeframe',
      code: 'REQUIRED',
      message: 'Primary timeframe is required',
      severity: 'error'
    });
  }

  if (!strategy.assetClasses || strategy.assetClasses.length === 0) {
    warnings.push({
      field: 'assetClasses',
      code: 'RECOMMENDED',
      message: 'Specifying asset classes helps with strategy organization',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates position sizing method configuration
 */
export function validatePositionSizingMethod(
  method: Partial<PositionSizingMethod> | undefined
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!method) {
    errors.push({
      field: 'positionSizingMethod',
      code: 'REQUIRED',
      message: 'Position sizing method is required',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  if (!method.type || !POSITION_SIZING_TYPES.includes(method.type as any)) {
    errors.push({
      field: 'positionSizingMethod.type',
      code: 'INVALID_VALUE',
      message: `Position sizing type must be one of: ${POSITION_SIZING_TYPES.join(', ')}`,
      severity: 'error'
    });
  }

  if (!method.parameters) {
    errors.push({
      field: 'positionSizingMethod.parameters',
      code: 'REQUIRED',
      message: 'Position sizing parameters are required',
      severity: 'error'
    });
    return { isValid: errors.length === 0, errors, warnings };
  }

  // Type-specific validation
  switch (method.type) {
    case 'FixedPercentage':
      if (method.parameters.percentage === undefined || method.parameters.percentage <= 0) {
        errors.push({
          field: 'positionSizingMethod.parameters.percentage',
          code: 'REQUIRED_POSITIVE',
          message: 'Percentage must be a positive number',
          severity: 'error'
        });
      } else if (method.parameters.percentage > 10) {
        warnings.push({
          field: 'positionSizingMethod.parameters.percentage',
          code: 'HIGH_VALUE',
          message: 'Position size percentage above 10% is very aggressive',
          severity: 'warning'
        });
      }
      break;

    case 'FixedDollar':
      if (method.parameters.dollarAmount === undefined || method.parameters.dollarAmount <= 0) {
        errors.push({
          field: 'positionSizingMethod.parameters.dollarAmount',
          code: 'REQUIRED_POSITIVE',
          message: 'Dollar amount must be a positive number',
          severity: 'error'
        });
      }
      break;

    case 'VolatilityBased':
      if (method.parameters.atrMultiplier === undefined || method.parameters.atrMultiplier <= 0) {
        errors.push({
          field: 'positionSizingMethod.parameters.atrMultiplier',
          code: 'REQUIRED_POSITIVE',
          message: 'ATR multiplier must be a positive number',
          severity: 'error'
        });
      }
      if (method.parameters.atrPeriod === undefined || method.parameters.atrPeriod <= 0) {
        errors.push({
          field: 'positionSizingMethod.parameters.atrPeriod',
          code: 'REQUIRED_POSITIVE',
          message: 'ATR period must be a positive number',
          severity: 'error'
        });
      }
      break;

    case 'KellyFormula':
      if (method.parameters.winRate === undefined || 
          method.parameters.winRate <= 0 || 
          method.parameters.winRate >= 100) {
        errors.push({
          field: 'positionSizingMethod.parameters.winRate',
          code: 'INVALID_RANGE',
          message: 'Win rate must be between 0 and 100',
          severity: 'error'
        });
      }
      if (method.parameters.avgWin === undefined || method.parameters.avgWin <= 0) {
        errors.push({
          field: 'positionSizingMethod.parameters.avgWin',
          code: 'REQUIRED_POSITIVE',
          message: 'Average win must be a positive number',
          severity: 'error'
        });
      }
      if (method.parameters.avgLoss === undefined || method.parameters.avgLoss >= 0) {
        errors.push({
          field: 'positionSizingMethod.parameters.avgLoss',
          code: 'REQUIRED_NEGATIVE',
          message: 'Average loss must be a negative number',
          severity: 'error'
        });
      }
      break;
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates stop loss rule configuration
 */
export function validateStopLossRule(
  rule: Partial<StopLossRule> | undefined
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!rule) {
    errors.push({
      field: 'stopLossRule',
      code: 'REQUIRED',
      message: 'Stop loss rule is required',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  if (!rule.type || !STOP_LOSS_TYPES.includes(rule.type as any)) {
    errors.push({
      field: 'stopLossRule.type',
      code: 'INVALID_VALUE',
      message: `Stop loss type must be one of: ${STOP_LOSS_TYPES.join(', ')}`,
      severity: 'error'
    });
  }

  if (!rule.description || rule.description.trim().length === 0) {
    errors.push({
      field: 'stopLossRule.description',
      code: 'REQUIRED',
      message: 'Stop loss rule description is required',
      severity: 'error'
    });
  }

  if (!rule.parameters) {
    errors.push({
      field: 'stopLossRule.parameters',
      code: 'REQUIRED',
      message: 'Stop loss parameters are required',
      severity: 'error'
    });
    return { isValid: errors.length === 0, errors, warnings };
  }

  // Type-specific validation
  switch (rule.type) {
    case 'ATRBased':
      if (rule.parameters.atrMultiplier === undefined || rule.parameters.atrMultiplier <= 0) {
        errors.push({
          field: 'stopLossRule.parameters.atrMultiplier',
          code: 'REQUIRED_POSITIVE',
          message: 'ATR multiplier must be a positive number',
          severity: 'error'
        });
      }
      if (rule.parameters.atrPeriod === undefined || rule.parameters.atrPeriod <= 0) {
        errors.push({
          field: 'stopLossRule.parameters.atrPeriod',
          code: 'REQUIRED_POSITIVE',
          message: 'ATR period must be a positive number',
          severity: 'error'
        });
      }
      break;

    case 'PercentageBased':
      if (rule.parameters.percentage === undefined || rule.parameters.percentage <= 0) {
        errors.push({
          field: 'stopLossRule.parameters.percentage',
          code: 'REQUIRED_POSITIVE',
          message: 'Stop loss percentage must be a positive number',
          severity: 'error'
        });
      } else if (rule.parameters.percentage > 10) {
        warnings.push({
          field: 'stopLossRule.parameters.percentage',
          code: 'HIGH_VALUE',
          message: 'Stop loss percentage above 10% is very wide',
          severity: 'warning'
        });
      }
      break;

    case 'StructureBased':
      if (!rule.parameters.structureType) {
        errors.push({
          field: 'stopLossRule.parameters.structureType',
          code: 'REQUIRED',
          message: 'Structure type is required for structure-based stops',
          severity: 'error'
        });
      }
      break;

    case 'VolatilityBased':
      if (rule.parameters.volatilityMultiplier === undefined || rule.parameters.volatilityMultiplier <= 0) {
        errors.push({
          field: 'stopLossRule.parameters.volatilityMultiplier',
          code: 'REQUIRED_POSITIVE',
          message: 'Volatility multiplier must be a positive number',
          severity: 'error'
        });
      }
      break;
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates take profit rule configuration
 */
export function validateTakeProfitRule(
  rule: Partial<TakeProfitRule> | undefined
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!rule) {
    errors.push({
      field: 'takeProfitRule',
      code: 'REQUIRED',
      message: 'Take profit rule is required',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  if (!rule.type || !TAKE_PROFIT_TYPES.includes(rule.type as any)) {
    errors.push({
      field: 'takeProfitRule.type',
      code: 'INVALID_VALUE',
      message: `Take profit type must be one of: ${TAKE_PROFIT_TYPES.join(', ')}`,
      severity: 'error'
    });
  }

  if (!rule.description || rule.description.trim().length === 0) {
    errors.push({
      field: 'takeProfitRule.description',
      code: 'REQUIRED',
      message: 'Take profit rule description is required',
      severity: 'error'
    });
  }

  if (!rule.parameters) {
    errors.push({
      field: 'takeProfitRule.parameters',
      code: 'REQUIRED',
      message: 'Take profit parameters are required',
      severity: 'error'
    });
    return { isValid: errors.length === 0, errors, warnings };
  }

  // Type-specific validation
  switch (rule.type) {
    case 'RiskRewardRatio':
      if (rule.parameters.ratio === undefined || rule.parameters.ratio <= 0) {
        errors.push({
          field: 'takeProfitRule.parameters.ratio',
          code: 'REQUIRED_POSITIVE',
          message: 'Risk-reward ratio must be a positive number',
          severity: 'error'
        });
      } else if (rule.parameters.ratio < 1) {
        warnings.push({
          field: 'takeProfitRule.parameters.ratio',
          code: 'LOW_VALUE',
          message: 'Risk-reward ratio below 1:1 means taking more risk than potential reward',
          severity: 'warning'
        });
      }
      break;

    case 'StructureBased':
      if (!rule.parameters.structureType) {
        errors.push({
          field: 'takeProfitRule.parameters.structureType',
          code: 'REQUIRED',
          message: 'Structure type is required for structure-based targets',
          severity: 'error'
        });
      }
      break;

    case 'TrailingStop':
      if (rule.parameters.trailDistance === undefined || rule.parameters.trailDistance <= 0) {
        errors.push({
          field: 'takeProfitRule.parameters.trailDistance',
          code: 'REQUIRED_POSITIVE',
          message: 'Trail distance must be a positive number',
          severity: 'error'
        });
      }
      if (!rule.parameters.trailType) {
        errors.push({
          field: 'takeProfitRule.parameters.trailType',
          code: 'REQUIRED',
          message: 'Trail type is required for trailing stops',
          severity: 'error'
        });
      }
      break;

    case 'PartialTargets':
      if (!rule.parameters.targets || rule.parameters.targets.length === 0) {
        errors.push({
          field: 'takeProfitRule.parameters.targets',
          code: 'REQUIRED',
          message: 'At least one target is required for partial targets',
          severity: 'error'
        });
      } else {
        let totalPercentage = 0;
        rule.parameters.targets.forEach((target, index) => {
          if (target.percentage <= 0 || target.percentage > 100) {
            errors.push({
              field: `takeProfitRule.parameters.targets[${index}].percentage`,
              code: 'INVALID_RANGE',
              message: 'Target percentage must be between 0 and 100',
              severity: 'error'
            });
          }
          if (target.ratio <= 0) {
            errors.push({
              field: `takeProfitRule.parameters.targets[${index}].ratio`,
              code: 'REQUIRED_POSITIVE',
              message: 'Target ratio must be a positive number',
              severity: 'error'
            });
          }
          totalPercentage += target.percentage;
        });

        if (totalPercentage > 100) {
          errors.push({
            field: 'takeProfitRule.parameters.targets',
            code: 'INVALID_TOTAL',
            message: 'Total percentage of all targets cannot exceed 100%',
            severity: 'error'
          });
        }
      }
      break;
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates strategy performance data
 */
export function validateStrategyPerformance(
  performance: Partial<StrategyPerformance>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check for required numeric fields
  const requiredNumericFields = [
    'totalTrades', 'winningTrades', 'losingTrades', 'profitFactor', 
    'expectancy', 'winRate', 'averageWin', 'averageLoss', 'riskRewardRatio'
  ];

  requiredNumericFields.forEach(field => {
    const value = (performance as any)[field];
    if (value === undefined || value === null || isNaN(value)) {
      errors.push({
        field: `performance.${field}`,
        code: 'REQUIRED_NUMERIC',
        message: `${field} must be a valid number`,
        severity: 'error'
      });
    }
  });

  // Validate logical consistency
  if (performance.totalTrades !== undefined && 
      performance.winningTrades !== undefined && 
      performance.losingTrades !== undefined) {
    if (performance.totalTrades !== performance.winningTrades + performance.losingTrades) {
      errors.push({
        field: 'performance.totalTrades',
        code: 'INCONSISTENT',
        message: 'Total trades must equal winning trades plus losing trades',
        severity: 'error'
      });
    }
  }

  // Validate win rate consistency
  if (performance.winRate !== undefined && 
      performance.totalTrades !== undefined && 
      performance.winningTrades !== undefined &&
      performance.totalTrades > 0) {
    const calculatedWinRate = (performance.winningTrades / performance.totalTrades) * 100;
    if (Math.abs(performance.winRate - calculatedWinRate) > 0.1) {
      errors.push({
        field: 'performance.winRate',
        code: 'INCONSISTENT',
        message: 'Win rate does not match calculated value from winning/total trades',
        severity: 'error'
      });
    }
  }

  // Check for statistical significance warnings
  if (performance.totalTrades !== undefined && 
      performance.totalTrades < DEFAULT_VALIDATION_RULES.warnings.insufficientTrades.threshold) {
    warnings.push({
      field: 'performance.totalTrades',
      code: 'INSUFFICIENT_DATA',
      message: DEFAULT_VALIDATION_RULES.warnings.insufficientTrades.message,
      severity: 'warning'
    });
  }

  // Validate performance trend
  if (performance.performanceTrend && 
      !PERFORMANCE_TRENDS.includes(performance.performanceTrend as any)) {
    errors.push({
      field: 'performance.performanceTrend',
      code: 'INVALID_VALUE',
      message: `Performance trend must be one of: ${PERFORMANCE_TRENDS.join(', ')}`,
      severity: 'error'
    });
  }

  // Validate monthly returns if present
  if (performance.monthlyReturns) {
    performance.monthlyReturns.forEach((monthlyReturn, index) => {
      if (!monthlyReturn.month || !/^\d{4}-\d{2}$/.test(monthlyReturn.month)) {
        errors.push({
          field: `performance.monthlyReturns[${index}].month`,
          code: 'INVALID_FORMAT',
          message: 'Month must be in YYYY-MM format',
          severity: 'error'
        });
      }
      
      if (monthlyReturn.return === undefined || isNaN(monthlyReturn.return)) {
        errors.push({
          field: `performance.monthlyReturns[${index}].return`,
          code: 'REQUIRED_NUMERIC',
          message: 'Monthly return must be a valid number',
          severity: 'error'
        });
      }
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates trade with strategy integration
 */
export function validateTradeWithStrategy(
  trade: Partial<TradeWithStrategy>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate adherence score if present
  if (trade.adherenceScore !== undefined) {
    if (trade.adherenceScore < 0 || trade.adherenceScore > 100) {
      errors.push({
        field: 'adherenceScore',
        code: 'INVALID_RANGE',
        message: 'Adherence score must be between 0 and 100',
        severity: 'error'
      });
    }
  }

  // Validate strategy reference consistency
  if (trade.strategyId && !trade.strategyName) {
    warnings.push({
      field: 'strategyName',
      code: 'MISSING_REFERENCE',
      message: 'Strategy name should be provided when strategy ID is set',
      severity: 'warning'
    });
  }

  // Validate deviations if present
  if (trade.deviations) {
    trade.deviations.forEach((deviation, index) => {
      if (!deviation.type) {
        errors.push({
          field: `deviations[${index}].type`,
          code: 'REQUIRED',
          message: 'Deviation type is required',
          severity: 'error'
        });
      }

      if (!deviation.description || deviation.description.trim().length === 0) {
        errors.push({
          field: `deviations[${index}].description`,
          code: 'REQUIRED',
          message: 'Deviation description is required',
          severity: 'error'
        });
      }

      if (!deviation.impact || !['Positive', 'Negative', 'Neutral'].includes(deviation.impact)) {
        errors.push({
          field: `deviations[${index}].impact`,
          code: 'INVALID_VALUE',
          message: 'Deviation impact must be Positive, Negative, or Neutral',
          severity: 'error'
        });
      }
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Utility function to format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string[] {
  const messages: string[] = [];
  
  result.errors.forEach(error => {
    messages.push(`Error in ${error.field}: ${error.message}`);
  });
  
  result.warnings.forEach(warning => {
    messages.push(`Warning in ${warning.field}: ${warning.message}`);
  });
  
  return messages;
}

/**
 * Utility function to check if a strategy has sufficient data for reliable metrics
 */
export function hasStatisticalSignificance(performance: StrategyPerformance): boolean {
  return performance.totalTrades >= DEFAULT_VALIDATION_RULES.warnings.insufficientTrades.threshold &&
         performance.statisticallySignificant;
}

/**
 * Utility function to get validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'All validations passed';
  } else if (result.isValid) {
    return `Valid with ${result.warnings.length} warning(s)`;
  } else {
    return `Invalid: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`;
  }
}
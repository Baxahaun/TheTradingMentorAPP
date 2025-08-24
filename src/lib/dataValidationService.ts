/**
 * Data Validation Service
 * Provides comprehensive validation and cleanup for trade data migration
 */

import { Trade } from '../types/trade';
import { EnhancedTrade, TradeReviewData, TradeNotes, ValidationError, ValidationResult } from '../types/tradeReview';

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'format' | 'custom';
  message: string;
  severity: 'error' | 'warning';
  validator?: (value: any, trade?: any) => boolean;
  params?: any;
}

export interface CleanupRule {
  field: string;
  action: 'trim' | 'normalize' | 'convert' | 'default' | 'remove' | 'custom';
  params?: any;
  cleaner?: (value: any, trade?: any) => any;
}

export interface ValidationReport {
  tradeId: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  cleanupApplied: string[];
  originalData?: any;
  cleanedData?: any;
}

// Validation rules for trade data
const TRADE_VALIDATION_RULES: ValidationRule[] = [
  // Required fields
  {
    field: 'id',
    type: 'required',
    message: 'Trade ID is required',
    severity: 'error'
  },
  {
    field: 'currencyPair',
    type: 'required',
    message: 'Currency pair is required',
    severity: 'error'
  },
  {
    field: 'date',
    type: 'required',
    message: 'Trade date is required',
    severity: 'error'
  },
  {
    field: 'entryPrice',
    type: 'required',
    message: 'Entry price is required',
    severity: 'error'
  },
  {
    field: 'side',
    type: 'required',
    message: 'Trade side (long/short) is required',
    severity: 'error'
  },
  {
    field: 'lotSize',
    type: 'required',
    message: 'Lot size is required',
    severity: 'error'
  },
  {
    field: 'status',
    type: 'required',
    message: 'Trade status is required',
    severity: 'error'
  },

  // Type validations
  {
    field: 'entryPrice',
    type: 'type',
    message: 'Entry price must be a positive number',
    severity: 'error',
    validator: (value) => typeof value === 'number' && value > 0
  },
  {
    field: 'exitPrice',
    type: 'type',
    message: 'Exit price must be a positive number',
    severity: 'error',
    validator: (value) => value === undefined || value === null || (typeof value === 'number' && value > 0)
  },
  {
    field: 'lotSize',
    type: 'type',
    message: 'Lot size must be a positive number',
    severity: 'error',
    validator: (value) => typeof value === 'number' && value > 0
  },
  {
    field: 'commission',
    type: 'type',
    message: 'Commission must be a number',
    severity: 'error',
    validator: (value) => typeof value === 'number'
  },

  // Format validations
  {
    field: 'currencyPair',
    type: 'format',
    message: 'Currency pair must be in format XXX/YYY',
    severity: 'error',
    validator: (value) => typeof value === 'string' && /^[A-Z]{3}\/[A-Z]{3}$/.test(value)
  },
  {
    field: 'date',
    type: 'format',
    message: 'Date must be a valid ISO date string',
    severity: 'error',
    validator: (value) => {
      if (typeof value !== 'string') return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
  },
  {
    field: 'side',
    type: 'format',
    message: 'Side must be either "long" or "short"',
    severity: 'error',
    validator: (value) => value === 'long' || value === 'short'
  },
  {
    field: 'status',
    type: 'format',
    message: 'Status must be either "open" or "closed"',
    severity: 'error',
    validator: (value) => value === 'open' || value === 'closed'
  },
  {
    field: 'lotType',
    type: 'format',
    message: 'Lot type must be "standard", "mini", or "micro"',
    severity: 'error',
    validator: (value) => ['standard', 'mini', 'micro'].includes(value)
  },

  // Business logic validations
  {
    field: 'exitPrice',
    type: 'custom',
    message: 'Closed trades must have an exit price',
    severity: 'error',
    validator: (value, trade) => {
      if (trade?.status === 'closed') {
        return value !== undefined && value !== null && value > 0;
      }
      return true;
    }
  },
  {
    field: 'stopLoss',
    type: 'custom',
    message: 'Stop loss level is invalid for trade direction',
    severity: 'warning',
    validator: (value, trade) => {
      if (!value || !trade?.entryPrice || !trade?.side) return true;
      if (trade.side === 'long') {
        return value < trade.entryPrice;
      } else {
        return value > trade.entryPrice;
      }
    }
  },
  {
    field: 'takeProfit',
    type: 'custom',
    message: 'Take profit level is invalid for trade direction',
    severity: 'warning',
    validator: (value, trade) => {
      if (!value || !trade?.entryPrice || !trade?.side) return true;
      if (trade.side === 'long') {
        return value > trade.entryPrice;
      } else {
        return value < trade.entryPrice;
      }
    }
  },
  {
    field: 'timeOut',
    type: 'custom',
    message: 'Exit time must be after entry time',
    severity: 'warning',
    validator: (value, trade) => {
      if (!value || !trade?.timeIn) return true;
      const entryTime = new Date(`${trade.date}T${trade.timeIn}`);
      const exitTime = new Date(`${trade.date}T${value}`);
      return exitTime >= entryTime;
    }
  }
];

// Cleanup rules for trade data
const TRADE_CLEANUP_RULES: CleanupRule[] = [
  // Trim string fields
  {
    field: 'currencyPair',
    action: 'trim'
  },
  {
    field: 'strategy',
    action: 'trim'
  },
  {
    field: 'notes',
    action: 'trim'
  },
  {
    field: 'emotions',
    action: 'trim'
  },

  // Normalize currency pair format
  {
    field: 'currencyPair',
    action: 'normalize',
    cleaner: (value) => {
      if (typeof value !== 'string') return value;
      return value.toUpperCase().replace(/[^A-Z]/g, '').replace(/(.{3})(.{3})/, '$1/$2');
    }
  },

  // Convert string numbers to numbers
  {
    field: 'entryPrice',
    action: 'convert',
    cleaner: (value) => {
      if (typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value);
      }
      return value;
    }
  },
  {
    field: 'exitPrice',
    action: 'convert',
    cleaner: (value) => {
      if (typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value);
      }
      return value;
    }
  },
  {
    field: 'lotSize',
    action: 'convert',
    cleaner: (value) => {
      if (typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value);
      }
      return value;
    }
  },
  {
    field: 'commission',
    action: 'convert',
    cleaner: (value) => {
      if (typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value);
      }
      return value;
    }
  },

  // Set default values
  {
    field: 'commission',
    action: 'default',
    params: { defaultValue: 0 },
    cleaner: (value) => value === undefined || value === null ? 0 : value
  },
  {
    field: 'tags',
    action: 'default',
    params: { defaultValue: [] },
    cleaner: (value) => {
      if (value === undefined || value === null) return [];
      if (typeof value === 'string') {
        return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
      if (Array.isArray(value)) return value;
      return [];
    }
  },
  {
    field: 'lotType',
    action: 'default',
    params: { defaultValue: 'standard' },
    cleaner: (value) => {
      if (!value || !['standard', 'mini', 'micro'].includes(value)) {
        return 'standard';
      }
      return value;
    }
  },

  // Remove invalid fields
  {
    field: 'invalidField',
    action: 'remove'
  }
];

export class DataValidationService {
  private validationRules: ValidationRule[];
  private cleanupRules: CleanupRule[];

  constructor(
    customValidationRules: ValidationRule[] = [],
    customCleanupRules: CleanupRule[] = []
  ) {
    this.validationRules = [...TRADE_VALIDATION_RULES, ...customValidationRules];
    this.cleanupRules = [...TRADE_CLEANUP_RULES, ...customCleanupRules];
  }

  /**
   * Validate a single trade
   */
  validateTrade(trade: any): ValidationReport {
    const report: ValidationReport = {
      tradeId: trade.id || 'unknown',
      isValid: true,
      errors: [],
      warnings: [],
      cleanupApplied: [],
      originalData: { ...trade }
    };

    // Apply cleanup rules first
    const cleanedTrade = this.applyCleanupRules(trade, report);
    report.cleanedData = cleanedTrade;

    // Apply validation rules
    for (const rule of this.validationRules) {
      const validation = this.validateField(cleanedTrade, rule);
      if (!validation.isValid) {
        const error: ValidationError = {
          field: rule.field,
          code: `${rule.type}_${rule.field}`,
          message: rule.message,
          severity: rule.severity
        };

        if (rule.severity === 'error') {
          report.errors.push(error);
          report.isValid = false;
        } else {
          report.warnings.push(error);
        }
      }
    }

    return report;
  }

  /**
   * Validate multiple trades
   */
  validateTrades(trades: any[]): ValidationReport[] {
    return trades.map(trade => this.validateTrade(trade));
  }

  /**
   * Apply cleanup rules to trade data
   */
  private applyCleanupRules(trade: any, report: ValidationReport): any {
    const cleanedTrade = { ...trade };

    for (const rule of this.cleanupRules) {
      try {
        const originalValue = cleanedTrade[rule.field];
        let cleanedValue = originalValue;

        switch (rule.action) {
          case 'trim':
            if (typeof originalValue === 'string') {
              cleanedValue = originalValue.trim();
            }
            break;

          case 'normalize':
          case 'convert':
          case 'default':
          case 'custom':
            if (rule.cleaner) {
              cleanedValue = rule.cleaner(originalValue, cleanedTrade);
            }
            break;

          case 'remove':
            delete cleanedTrade[rule.field];
            if (originalValue !== undefined) {
              report.cleanupApplied.push(`Removed field: ${rule.field}`);
            }
            continue;
        }

        if (cleanedValue !== originalValue) {
          cleanedTrade[rule.field] = cleanedValue;
          report.cleanupApplied.push(`Cleaned field: ${rule.field}`);
        }
      } catch (error) {
        console.warn(`Cleanup rule failed for field ${rule.field}:`, error);
      }
    }

    return cleanedTrade;
  }

  /**
   * Validate a single field against a rule
   */
  private validateField(trade: any, rule: ValidationRule): { isValid: boolean } {
    const value = trade[rule.field];

    switch (rule.type) {
      case 'required':
        return { isValid: value !== undefined && value !== null && value !== '' };

      case 'type':
      case 'format':
      case 'custom':
        if (rule.validator) {
          try {
            return { isValid: rule.validator(value, trade) };
          } catch (error) {
            console.warn(`Validation rule failed for field ${rule.field}:`, error);
            return { isValid: false };
          }
        }
        return { isValid: true };

      case 'range':
        if (typeof value === 'number' && rule.params) {
          const { min, max } = rule.params;
          return {
            isValid: (min === undefined || value >= min) && (max === undefined || value <= max)
          };
        }
        return { isValid: true };

      default:
        return { isValid: true };
    }
  }

  /**
   * Get validation summary for multiple trades
   */
  getValidationSummary(reports: ValidationReport[]): {
    totalTrades: number;
    validTrades: number;
    invalidTrades: number;
    totalErrors: number;
    totalWarnings: number;
    commonErrors: { [key: string]: number };
    commonWarnings: { [key: string]: number };
  } {
    const summary = {
      totalTrades: reports.length,
      validTrades: reports.filter(r => r.isValid).length,
      invalidTrades: reports.filter(r => !r.isValid).length,
      totalErrors: reports.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: reports.reduce((sum, r) => sum + r.warnings.length, 0),
      commonErrors: {} as { [key: string]: number },
      commonWarnings: {} as { [key: string]: number }
    };

    // Count common errors and warnings
    reports.forEach(report => {
      report.errors.forEach(error => {
        summary.commonErrors[error.code] = (summary.commonErrors[error.code] || 0) + 1;
      });
      report.warnings.forEach(warning => {
        summary.commonWarnings[warning.code] = (summary.commonWarnings[warning.code] || 0) + 1;
      });
    });

    return summary;
  }

  /**
   * Validate enhanced trade review data
   */
  validateTradeReviewData(reviewData: TradeReviewData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate notes structure
    if (reviewData.notes) {
      const notesValidation = this.validateTradeNotes(reviewData.notes);
      errors.push(...notesValidation.errors);
      warnings.push(...notesValidation.warnings);
    }

    // Validate review workflow
    if (reviewData.reviewWorkflow) {
      const workflowValidation = this.validateReviewWorkflow(reviewData.reviewWorkflow);
      errors.push(...workflowValidation.errors);
      warnings.push(...workflowValidation.warnings);
    }

    // Validate charts
    if (reviewData.charts) {
      const chartsValidation = this.validateTradeCharts(reviewData.charts);
      errors.push(...chartsValidation.errors);
      warnings.push(...chartsValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate trade notes structure
   */
  private validateTradeNotes(notes: TradeNotes): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!notes.lastModified) {
      errors.push({
        field: 'lastModified',
        code: 'required_lastModified',
        message: 'Notes must have lastModified timestamp',
        severity: 'error'
      });
    }

    if (typeof notes.version !== 'number' || notes.version < 1) {
      errors.push({
        field: 'version',
        code: 'invalid_version',
        message: 'Notes version must be a positive number',
        severity: 'error'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate review workflow
   */
  private validateReviewWorkflow(workflow: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!workflow.tradeId) {
      errors.push({
        field: 'tradeId',
        code: 'required_tradeId',
        message: 'Review workflow must have tradeId',
        severity: 'error'
      });
    }

    if (!Array.isArray(workflow.stages)) {
      errors.push({
        field: 'stages',
        code: 'invalid_stages',
        message: 'Review workflow stages must be an array',
        severity: 'error'
      });
    }

    if (!workflow.startedAt) {
      errors.push({
        field: 'startedAt',
        code: 'required_startedAt',
        message: 'Review workflow must have startedAt timestamp',
        severity: 'error'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate trade charts
   */
  private validateTradeCharts(charts: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    charts.forEach((chart, index) => {
      if (!chart.id) {
        errors.push({
          field: `charts[${index}].id`,
          code: 'required_chart_id',
          message: `Chart ${index} must have an ID`,
          severity: 'error'
        });
      }

      if (!chart.url) {
        errors.push({
          field: `charts[${index}].url`,
          code: 'required_chart_url',
          message: `Chart ${index} must have a URL`,
          severity: 'error'
        });
      }

      if (!['entry', 'exit', 'analysis', 'post_mortem'].includes(chart.type)) {
        errors.push({
          field: `charts[${index}].type`,
          code: 'invalid_chart_type',
          message: `Chart ${index} has invalid type`,
          severity: 'error'
        });
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Add custom cleanup rule
   */
  addCleanupRule(rule: CleanupRule): void {
    this.cleanupRules.push(rule);
  }

  /**
   * Remove validation rule
   */
  removeValidationRule(field: string, type: string): void {
    this.validationRules = this.validationRules.filter(
      rule => !(rule.field === field && rule.type === type)
    );
  }

  /**
   * Remove cleanup rule
   */
  removeCleanupRule(field: string, action: string): void {
    this.cleanupRules = this.cleanupRules.filter(
      rule => !(rule.field === field && rule.action === action)
    );
  }

  /**
   * Get all validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [...this.validationRules];
  }

  /**
   * Get all cleanup rules
   */
  getCleanupRules(): CleanupRule[] {
    return [...this.cleanupRules];
  }
}
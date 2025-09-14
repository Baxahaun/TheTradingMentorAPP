/**
 * Trade Form Validation Utilities
 * Provides comprehensive validation for trade form fields
 */

import { TradeReviewService } from './tradeReviewService';
import { ValidationResult, ValidationError } from '../types/tradeReview';
import { EnhancedTrade } from '../types/tradeReview';
import { CURRENT_TERMINOLOGY } from './terminologyConfig';

export class TradeFormValidation {
  private static reviewService = TradeReviewService.getInstance();

  /**
   * Validate a single field
   */
  static validateField(
    fieldName: string, 
    value: any, 
    trade?: Partial<EnhancedTrade>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    switch (fieldName) {
      case 'currencyPair':
        if (!value || value.trim() === '') {
          errors.push({
            field: fieldName,
            code: 'REQUIRED_FIELD_MISSING',
            message: `${CURRENT_TERMINOLOGY.instrumentLabel} is required`,
            severity: 'error'
          });
        } else if (!/^[A-Z]{3}\/[A-Z]{3}$/.test(value) && !/^[A-Z]+$/.test(value)) {
          errors.push({
            field: fieldName,
            code: 'INVALID_FORMAT',
            message: `${CURRENT_TERMINOLOGY.instrumentLabel} must be in format XXX/YYY (e.g., EUR/USD) or a valid futures symbol`,
            severity: 'error'
          });
        }
        break;

      case 'entryPrice':
      case 'exitPrice':
      case 'stopLoss':
      case 'takeProfit':
        if (value !== undefined && value !== null && value !== '') {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (isNaN(numValue) || numValue <= 0) {
            errors.push({
              field: fieldName,
              code: 'INVALID_PRICE',
              message: `${fieldName} must be a positive number`,
              severity: 'error'
            });
          }
        }
        break;

      case 'lotSize':
        if (!value || value === '') {
          errors.push({
            field: fieldName,
            code: 'REQUIRED_FIELD_MISSING',
            message: `${CURRENT_TERMINOLOGY.positionSizeLabel} is required`,
            severity: 'error'
          });
        } else {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (isNaN(numValue) || numValue <= 0) {
            errors.push({
              field: fieldName,
              code: 'INVALID_LOT_SIZE',
              message: `${CURRENT_TERMINOLOGY.positionSizeLabel} must be a positive number`,
              severity: 'error'
            });
          }
        }
        break;

      case 'date':
        if (!value || value === '') {
          errors.push({
            field: fieldName,
            code: 'REQUIRED_FIELD_MISSING',
            message: 'Date is required',
            severity: 'error'
          });
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          errors.push({
            field: fieldName,
            code: 'INVALID_DATE_FORMAT',
            message: 'Date must be in YYYY-MM-DD format',
            severity: 'error'
          });
        }
        break;

      case 'timeIn':
        if (!value || value === '') {
          errors.push({
            field: fieldName,
            code: 'REQUIRED_FIELD_MISSING',
            message: 'Entry time is required',
            severity: 'error'
          });
        } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          errors.push({
            field: fieldName,
            code: 'INVALID_TIME_FORMAT',
            message: 'Time must be in HH:MM format',
            severity: 'error'
          });
        }
        break;

      case 'timeOut':
        if (value && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          errors.push({
            field: fieldName,
            code: 'INVALID_TIME_FORMAT',
            message: 'Time must be in HH:MM format',
            severity: 'error'
          });
        }
        break;

      case 'side':
        if (!value || (value !== 'long' && value !== 'short')) {
          errors.push({
            field: fieldName,
            code: 'INVALID_SIDE',
            message: 'Trade side must be either "long" or "short"',
            severity: 'error'
          });
        }
        break;

      case 'lotType':
        if (!value || !['standard', 'mini', 'micro'].includes(value)) {
          errors.push({
            field: fieldName,
            code: 'INVALID_LOT_TYPE',
            message: `${CURRENT_TERMINOLOGY.positionSizeTypeLabel} must be standard, mini, or micro`,
            severity: 'error'
          });
        }
        break;

      case 'accountId':
        if (!value || value.trim() === '') {
          errors.push({
            field: fieldName,
            code: 'REQUIRED_FIELD_MISSING',
            message: 'Account ID is required',
            severity: 'error'
          });
        }
        break;

      case 'accountCurrency':
        if (!value || value.trim() === '') {
          errors.push({
            field: fieldName,
            code: 'REQUIRED_FIELD_MISSING',
            message: 'Account currency is required',
            severity: 'error'
          });
        } else if (!/^[A-Z]{3}$/.test(value)) {
          errors.push({
            field: fieldName,
            code: 'INVALID_CURRENCY_FORMAT',
            message: 'Currency must be a 3-letter code (e.g., USD, EUR)',
            severity: 'error'
          });
        }
        break;

      case 'commission':
        if (value !== undefined && value !== null && value !== '') {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (isNaN(numValue) || numValue < 0) {
            errors.push({
              field: fieldName,
              code: 'INVALID_COMMISSION',
              message: 'Commission must be a non-negative number',
              severity: 'error'
            });
          }
        }
        break;
    }

    return errors;
  }

  /**
   * Validate entire trade form
   */
  static validateTradeForm(formData: Partial<EnhancedTrade>): ValidationResult {
    const baseResult = this.reviewService.validateTrade(formData);
    const crossFieldErrors = this.validateCrossFields(formData);
    
    // Combine base validation with cross-field validation
    const allErrors = [...baseResult.errors, ...crossFieldErrors.filter(e => e.severity === 'error')];
    const allWarnings = [...baseResult.warnings, ...crossFieldErrors.filter(e => e.severity === 'warning')];
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Get field validation status
   */
  static getFieldStatus(
    fieldName: string, 
    value: any, 
    trade?: Partial<EnhancedTrade>
  ): 'valid' | 'error' | 'warning' {
    const errors = this.validateField(fieldName, value, trade);
    
    if (errors.some(e => e.severity === 'error')) {
      return 'error';
    }
    
    if (errors.some(e => e.severity === 'warning')) {
      return 'warning';
    }
    
    return 'valid';
  }

  /**
   * Format validation errors for display
   */
  static formatErrorsForDisplay(errors: ValidationError[]): string[] {
    return errors.map(error => error.message);
  }

  /**
   * Check if form is valid for submission
   */
  static isFormValid(formData: Partial<EnhancedTrade>): boolean {
    const result = this.validateTradeForm(formData);
    return result.isValid;
  }

  /**
   * Validate cross-field relationships
   */
  static validateCrossFields(formData: Partial<EnhancedTrade>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Risk-reward validation
    if (formData.entryPrice && formData.stopLoss && formData.takeProfit) {
      const entry = typeof formData.entryPrice === 'string' ? parseFloat(formData.entryPrice) : formData.entryPrice;
      const stop = typeof formData.stopLoss === 'string' ? parseFloat(formData.stopLoss) : formData.stopLoss;
      const target = typeof formData.takeProfit === 'string' ? parseFloat(formData.takeProfit) : formData.takeProfit;
      
      if (!isNaN(entry) && !isNaN(stop) && !isNaN(target)) {
        const risk = Math.abs(entry - stop);
        const reward = Math.abs(target - entry);
        
        if (risk > 0) {
          const riskRewardRatio = reward / risk;
          
          if (riskRewardRatio < 0.5) {
            errors.push({
              field: 'takeProfit',
              code: 'VERY_POOR_RISK_REWARD',
              message: `Risk-reward ratio is ${riskRewardRatio.toFixed(2)}:1. This is very poor risk management.`,
              severity: 'error'
            });
          } else if (riskRewardRatio < 1) {
            errors.push({
              field: 'takeProfit',
              code: 'POOR_RISK_REWARD',
              message: `Risk-reward ratio is ${riskRewardRatio.toFixed(2)}:1. Consider improving to at least 1:1`,
              severity: 'warning'
            });
          }
        }
      }
    }

    // Time sequence validation
    if (formData.timeIn && formData.timeOut && formData.date) {
      try {
        const entryDateTime = new Date(`${formData.date}T${formData.timeIn}`);
        const exitDateTime = new Date(`${formData.date}T${formData.timeOut}`);
        
        if (exitDateTime <= entryDateTime) {
          errors.push({
            field: 'timeOut',
            code: 'EXIT_BEFORE_ENTRY',
            message: 'Exit time should be after entry time',
            severity: 'warning'
          });
        }
      } catch (e) {
        // Invalid date/time format - will be caught by individual field validation
      }
    }

    // Position size validation
    if (formData.lotSize && formData.riskAmount && formData.entryPrice && formData.stopLoss) {
      const lotSize = typeof formData.lotSize === 'string' ? parseFloat(formData.lotSize) : formData.lotSize;
      const riskAmount = typeof formData.riskAmount === 'string' ? parseFloat(formData.riskAmount) : formData.riskAmount;
      const entry = typeof formData.entryPrice === 'string' ? parseFloat(formData.entryPrice) : formData.entryPrice;
      const stop = typeof formData.stopLoss === 'string' ? parseFloat(formData.stopLoss) : formData.stopLoss;
      
      if (!isNaN(lotSize) && !isNaN(riskAmount) && !isNaN(entry) && !isNaN(stop)) {
        const pipRisk = Math.abs(entry - stop);
        // Simplified pip value calculation - in reality this would depend on currency pair
        const estimatedRisk = pipRisk * lotSize * 10; // Rough estimate
        
        if (estimatedRisk > riskAmount * 2) {
          errors.push({
            field: 'lotSize',
            code: 'POSITION_SIZE_TOO_LARGE',
            message: 'Position size appears too large for the specified risk amount',
            severity: 'warning'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Get validation summary
   */
  static getValidationSummary(formData: Partial<EnhancedTrade>): {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    errors: string[];
    warnings: string[];
  } {
    const result = this.validateTradeForm(formData);
    const crossFieldErrors = this.validateCrossFields(formData);
    
    const allErrors = [...result.errors, ...crossFieldErrors.filter(e => e.severity === 'error')];
    const allWarnings = [...result.warnings, ...crossFieldErrors.filter(e => e.severity === 'warning')];
    
    return {
      isValid: allErrors.length === 0,
      errorCount: allErrors.length,
      warningCount: allWarnings.length,
      errors: allErrors.map(e => e.message),
      warnings: allWarnings.map(w => w.message)
    };
  }

  /**
   * Validate required fields for trade completion
   */
  static validateTradeCompletion(formData: Partial<EnhancedTrade>): ValidationError[] {
    const errors: ValidationError[] = [];
    
    const requiredForCompletion = [
      'currencyPair', 'date', 'timeIn', 'side', 'entryPrice', 
      'lotSize', 'lotType', 'accountId', 'accountCurrency'
    ];

    requiredForCompletion.forEach(field => {
      const value = (formData as any)[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          field,
          code: 'REQUIRED_FOR_COMPLETION',
          message: `${field} is required to complete the trade`,
          severity: 'error'
        });
      }
    });

    // For closed trades, require exit data
    if (formData.status === 'closed') {
      const requiredForClosed = ['exitPrice', 'timeOut'];
      
      requiredForClosed.forEach(field => {
        const value = (formData as any)[field];
        if (value === undefined || value === null || value === '') {
          errors.push({
            field,
            code: 'REQUIRED_FOR_CLOSED_TRADE',
            message: `${field} is required for closed trades`,
            severity: 'error'
          });
        }
      });
    }

    return errors;
  }
}
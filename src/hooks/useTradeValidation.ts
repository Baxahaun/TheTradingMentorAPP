/**
 * Trade validation hook
 * Provides real-time validation for trade forms
 */

import { useState, useEffect, useMemo } from 'react';
import { TradeFormValidation } from '../lib/tradeFormValidation';
import { ValidationResult, ValidationError, EnhancedTrade } from '../types/tradeReview';

interface UseTradeValidationOptions {
  validateOnChange?: boolean;
  debounceMs?: number;
}

interface UseTradeValidationReturn {
  validationResult: ValidationResult;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  fieldErrors: Record<string, ValidationError[]>;
  fieldStatus: Record<string, 'valid' | 'error' | 'warning'>;
  validateField: (fieldName: string, value: any) => ValidationError[];
  validateForm: () => ValidationResult;
  getFieldStatus: (fieldName: string) => 'valid' | 'error' | 'warning';
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
}

export function useTradeValidation(
  tradeData: Partial<EnhancedTrade>,
  options: UseTradeValidationOptions = {}
): UseTradeValidationReturn {
  const {
    validateOnChange = true,
    debounceMs = 300
  } = options;

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout>();

  // Validate form
  const validateForm = useMemo(() => {
    return () => TradeFormValidation.validateTradeForm(tradeData);
  }, [tradeData]);

  // Validate single field
  const validateField = useMemo(() => {
    return (fieldName: string, value: any) => 
      TradeFormValidation.validateField(fieldName, value, tradeData);
  }, [tradeData]);

  // Get field status
  const getFieldStatus = useMemo(() => {
    return (fieldName: string) => {
      const fieldValue = (tradeData as any)[fieldName];
      return TradeFormValidation.getFieldStatus(fieldName, fieldValue, tradeData);
    };
  }, [tradeData]);

  // Debounced validation
  useEffect(() => {
    if (!validateOnChange) return;

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      const result = validateForm();
      setValidationResult(result);
    }, debounceMs);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [tradeData, validateOnChange, debounceMs, validateForm]);

  // Calculate field-specific errors and status
  const fieldErrors = useMemo(() => {
    const errors: Record<string, ValidationError[]> = {};
    
    validationResult.errors.forEach(error => {
      if (!errors[error.field]) {
        errors[error.field] = [];
      }
      errors[error.field].push(error);
    });

    validationResult.warnings.forEach(warning => {
      if (!errors[warning.field]) {
        errors[warning.field] = [];
      }
      errors[warning.field].push(warning);
    });

    return errors;
  }, [validationResult]);

  const fieldStatus = useMemo(() => {
    const status: Record<string, 'valid' | 'error' | 'warning'> = {};
    
    Object.keys(fieldErrors).forEach(field => {
      const fieldErrs = fieldErrors[field];
      if (fieldErrs.some(e => e.severity === 'error')) {
        status[field] = 'error';
      } else if (fieldErrs.some(e => e.severity === 'warning')) {
        status[field] = 'warning';
      } else {
        status[field] = 'valid';
      }
    });

    return status;
  }, [fieldErrors]);

  return {
    validationResult,
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    fieldErrors,
    fieldStatus,
    validateField,
    validateForm,
    getFieldStatus,
    hasErrors: validationResult.errors.length > 0,
    hasWarnings: validationResult.warnings.length > 0,
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length
  };
}
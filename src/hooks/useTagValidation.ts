import { useState, useCallback, useMemo } from 'react';
import { tagService } from '../lib/tagService';
import { tagValidationService, TagValidationError } from '../lib/tagValidationService';
import { TagOperationResult } from '../lib/tagErrorHandlingService';

export interface UseTagValidationOptions {
  validateOnChange?: boolean;
  showWarnings?: boolean;
  maxTags?: number;
}

export interface TagValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isValidating: boolean;
}

export interface UseTagValidationReturn {
  validationState: TagValidationState;
  validateTag: (tag: string) => TagValidationState;
  validateTags: (tags: string[]) => TagValidationState;
  sanitizeTag: (tag: string) => { success: boolean; value: string; errors: string[] };
  clearValidation: () => void;
  formatErrorsForUser: (errors: TagValidationError[]) => string[];
  formatWarningsForUser: (warnings: TagValidationError[]) => string[];
  getValidationConstants: () => ReturnType<typeof tagValidationService.getValidationConstants>;
}

/**
 * React hook for tag validation with comprehensive error handling
 * Provides real-time validation, sanitization, and user-friendly error messages
 */
export function useTagValidation(options: UseTagValidationOptions = {}): UseTagValidationReturn {
  const {
    validateOnChange = true,
    showWarnings = true,
    maxTags
  } = options;

  const [validationState, setValidationState] = useState<TagValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
    isValidating: false
  });

  const validateTag = useCallback((tag: string): TagValidationState => {
    if (!validateOnChange && !tag) {
      return { isValid: true, errors: [], warnings: [], isValidating: false };
    }

    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = tagService.validateTag(tag);
      
      const errors = tagValidationService.formatErrorsForUser(result.errors);
      const warnings = showWarnings ? tagValidationService.formatWarningsForUser(result.warnings) : [];

      const newState = {
        isValid: result.isValid,
        errors,
        warnings,
        isValidating: false
      };

      setValidationState(newState);
      return newState;
    } catch (error) {
      const errorState = {
        isValid: false,
        errors: ['An unexpected error occurred during validation'],
        warnings: [],
        isValidating: false
      };

      setValidationState(errorState);
      return errorState;
    }
  }, [validateOnChange, showWarnings]);

  const validateTags = useCallback((tags: string[]): TagValidationState => {
    if (!validateOnChange && tags.length === 0) {
      return { isValid: true, errors: [], warnings: [], isValidating: false };
    }

    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      // Check max tags limit if specified
      const constants = tagValidationService.getValidationConstants();
      const effectiveMaxTags = maxTags || constants.MAX_TAGS_PER_TRADE;
      
      if (tags.length > effectiveMaxTags) {
        const errorState = {
          isValid: false,
          errors: [`Cannot have more than ${effectiveMaxTags} tags`],
          warnings: [],
          isValidating: false
        };
        setValidationState(errorState);
        return errorState;
      }

      const result = tagService.validateTags(tags);
      
      const errors = tagValidationService.formatErrorsForUser(result.errors);
      const warnings = showWarnings ? tagValidationService.formatWarningsForUser(result.warnings) : [];

      const newState = {
        isValid: result.isValid,
        errors,
        warnings,
        isValidating: false
      };

      setValidationState(newState);
      return newState;
    } catch (error) {
      const errorState = {
        isValid: false,
        errors: ['An unexpected error occurred during validation'],
        warnings: [],
        isValidating: false
      };

      setValidationState(errorState);
      return errorState;
    }
  }, [validateOnChange, showWarnings, maxTags]);

  const sanitizeTag = useCallback((tag: string): { success: boolean; value: string; errors: string[] } => {
    try {
      const result = tagService.sanitizeTagWithErrorHandling(tag);
      
      return {
        success: result.success,
        value: result.data || '',
        errors: result.success ? [] : tagValidationService.formatErrorsForUser(result.errors)
      };
    } catch (error) {
      return {
        success: false,
        value: '',
        errors: ['Failed to sanitize tag']
      };
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: [],
      warnings: [],
      isValidating: false
    });
  }, []);

  const formatErrorsForUser = useCallback((errors: TagValidationError[]): string[] => {
    return tagValidationService.formatErrorsForUser(errors);
  }, []);

  const formatWarningsForUser = useCallback((warnings: TagValidationError[]): string[] => {
    return tagValidationService.formatWarningsForUser(warnings);
  }, []);

  const getValidationConstants = useCallback(() => {
    return tagValidationService.getValidationConstants();
  }, []);

  return {
    validationState,
    validateTag,
    validateTags,
    sanitizeTag,
    clearValidation,
    formatErrorsForUser,
    formatWarningsForUser,
    getValidationConstants
  };
}

/**
 * Hook for handling tag operations with retry and error recovery
 */
export function useTagOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const executeTagOperation = useCallback(async <T>(
    operation: () => Promise<TagOperationResult<T>>,
    onSuccess?: (result: T) => void,
    onError?: (error: string) => void
  ): Promise<TagOperationResult<T>> => {
    setIsLoading(true);
    setLastError(null);

    try {
      const result = await operation();
      
      if (result.success) {
        onSuccess?.(result.data!);
      } else {
        const errorMessage = tagValidationService.formatErrorsForUser(result.errors).join(', ');
        setLastError(errorMessage);
        onError?.(errorMessage);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setLastError(errorMessage);
      onError?.(errorMessage);
      
      return {
        success: false,
        errors: [{
          code: 'OPERATION_ERROR',
          message: errorMessage,
          severity: 'error'
        }],
        retryable: true
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    isLoading,
    lastError,
    executeTagOperation,
    clearError
  };
}
import { useCallback, useEffect, useState } from 'react';
import ErrorHandlingService, { ErrorContext, RetryConfig } from '../services/ErrorHandlingService';
import NotificationService, { SaveStatus, SyncStatus } from '../services/NotificationService';
import ValidationService, { ValidationResult } from '../services/ValidationService';

export interface UseErrorHandlingOptions {
  component?: string;
  userId?: string;
  autoRetry?: boolean;
  retryConfig?: Partial<RetryConfig>;
}

export interface ErrorHandlingState {
  isLoading: boolean;
  error: Error | null;
  saveStatus: SaveStatus;
  syncStatus: SyncStatus;
  retryCount: number;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const [state, setState] = useState<ErrorHandlingState>({
    isLoading: false,
    error: null,
    saveStatus: { status: 'saved', pendingChanges: false },
    syncStatus: { status: 'synced', pendingOperations: 0 },
    retryCount: 0
  });

  const errorService = ErrorHandlingService.getInstance();
  const notificationService = NotificationService.getInstance();
  const validationService = ValidationService.getInstance();

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = notificationService.onStatusChange((saveStatus, syncStatus) => {
      setState(prev => ({ ...prev, saveStatus, syncStatus }));
    });

    return unsubscribe;
  }, [notificationService]);

  /**
   * Handle errors with automatic retry and user feedback
   */
  const handleError = useCallback(async (
    error: Error,
    operation: string,
    context?: Partial<ErrorContext>
  ) => {
    const errorContext: ErrorContext = {
      operation,
      component: options.component,
      userId: options.userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...context
    };

    setState(prev => ({ ...prev, error, isLoading: false }));
    await errorService.handleError(error, errorContext);
  }, [errorService, options.component, options.userId]);

  /**
   * Execute operation with error handling and retry logic
   */
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Partial<ErrorContext>
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let result: T;

      if (options.autoRetry) {
        result = await errorService.retryOperation(
          operation,
          options.retryConfig,
          {
            operation: operationName,
            component: options.component,
            userId: options.userId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...context
          }
        );
      } else {
        result = await operation();
      }

      setState(prev => ({ ...prev, isLoading: false, error: null, retryCount: 0 }));
      return result;
    } catch (error) {
      await handleError(error as Error, operationName, context);
      setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
      return null;
    }
  }, [errorService, handleError, options.autoRetry, options.retryConfig, options.component, options.userId]);

  /**
   * Validate data with user-friendly error messages
   */
  const validateWithFeedback = useCallback((
    data: any,
    validationType: 'journalEntry' | 'field',
    fieldName?: string
  ): ValidationResult | null => {
    try {
      let result: ValidationResult;

      if (validationType === 'journalEntry') {
        result = validationService.validateJournalEntry(data);
      } else if (validationType === 'field' && fieldName) {
        const fieldError = validationService.validateField(fieldName, data);
        result = {
          isValid: !fieldError,
          errors: fieldError && fieldError.severity === 'error' ? [fieldError] : [],
          warnings: fieldError && fieldError.severity === 'warning' ? [fieldError] : [],
          suggestions: fieldError && fieldError.severity === 'info' ? [fieldError] : []
        };
      } else {
        throw new Error('Invalid validation type or missing field name');
      }

      // Show validation feedback
      if (result.errors.length > 0) {
        notificationService.showValidationErrors(
          result.errors.map(e => ({ field: e.field, message: e.message }))
        );
      }

      return result;
    } catch (error) {
      handleError(error as Error, 'validate_data');
      return null;
    }
  }, [validationService, notificationService, handleError]);

  /**
   * Update save status with notifications
   */
  const updateSaveStatus = useCallback((status: Partial<SaveStatus>) => {
    notificationService.updateSaveStatus(status);
  }, [notificationService]);

  /**
   * Update sync status with notifications
   */
  const updateSyncStatus = useCallback((status: Partial<SyncStatus>) => {
    notificationService.updateSyncStatus(status);
  }, [notificationService]);

  /**
   * Show auto-save notification
   */
  const showAutoSaveNotification = useCallback((success: boolean, error?: string) => {
    notificationService.showAutoSaveNotification(success, error);
  }, [notificationService]);

  /**
   * Show progress notification
   */
  const showProgress = useCallback((operation: string, progress: number) => {
    notificationService.showProgress(operation, progress);
  }, [notificationService]);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(() => {
    notificationService.clearAll();
  }, [notificationService]);

  /**
   * Retry failed operations
   */
  const retryFailedOperations = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await errorService.processRetryQueue();
      setState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      await handleError(error as Error, 'retry_operations');
    }
  }, [errorService, handleError]);

  /**
   * Get retry queue status
   */
  const getRetryQueueStatus = useCallback(() => {
    return errorService.getRetryQueueStatus();
  }, [errorService]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Check if operation is safe to retry
   */
  const canRetry = useCallback((error: Error): boolean => {
    const retryablePatterns = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'rate limit'
    ];

    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }, []);

  return {
    // State
    ...state,
    
    // Error handling
    handleError,
    executeWithErrorHandling,
    clearError,
    canRetry,
    
    // Validation
    validateWithFeedback,
    
    // Status management
    updateSaveStatus,
    updateSyncStatus,
    showAutoSaveNotification,
    showProgress,
    
    // Notifications
    clearNotifications,
    
    // Retry management
    retryFailedOperations,
    getRetryQueueStatus
  };
}

export default useErrorHandling;
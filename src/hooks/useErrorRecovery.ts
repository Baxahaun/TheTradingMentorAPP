import { useState, useCallback, useEffect } from 'react';
import { errorHandlingService, TradeReviewError, TradeReviewErrorType } from '../lib/errorHandlingService';
import { retryService } from '../lib/retryService';
import { offlineDataService } from '../lib/offlineDataService';

export interface ErrorRecoveryState {
  isRecovering: boolean;
  lastError: TradeReviewError | null;
  recoveryAttempts: number;
  canRetry: boolean;
  isOffline: boolean;
}

export interface ErrorRecoveryActions {
  handleError: (error: Error, context?: any) => void;
  retry: () => Promise<void>;
  clearError: () => void;
  reportError: () => void;
  saveForLater: (data: any) => void;
}

export function useErrorRecovery(
  operationId?: string,
  onRecovery?: () => void
): [ErrorRecoveryState, ErrorRecoveryActions] {
  const [state, setState] = useState<ErrorRecoveryState>({
    isRecovering: false,
    lastError: null,
    recoveryAttempts: 0,
    canRetry: false,
    isOffline: !navigator.onLine
  });

  // Monitor network status
  useEffect(() => {
    const cleanup = errorHandlingService.onNetworkChange((online) => {
      setState(prev => ({ ...prev, isOffline: !online }));
      
      if (online && state.lastError?.recoverable) {
        // Auto-retry when coming back online
        retry();
      }
    });

    return cleanup;
  }, [state.lastError]);

  const handleError = useCallback((error: Error, context?: any) => {
    const tradeReviewError = errorHandlingService.createError(
      getErrorType(error),
      error.message,
      { originalError: error, context, operationId }
    );

    setState(prev => ({
      ...prev,
      lastError: tradeReviewError,
      canRetry: tradeReviewError.recoverable,
      recoveryAttempts: 0
    }));

    errorHandlingService.handleError(tradeReviewError);
  }, [operationId]);

  const retry = useCallback(async () => {
    if (!state.lastError || !state.canRetry) return;

    setState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1
    }));

    try {
      if (operationId && onRecovery) {
        await retryService.executeWithRetry(
          `recovery_${operationId}_${Date.now()}`,
          onRecovery,
          {
            maxAttempts: 3,
            baseDelay: 1000,
            backoffMultiplier: 2
          }
        );
      }

      setState(prev => ({
        ...prev,
        isRecovering: false,
        lastError: null,
        canRetry: false
      }));
    } catch (retryError) {
      setState(prev => ({
        ...prev,
        isRecovering: false,
        canRetry: prev.recoveryAttempts < 3
      }));
      
      if (retryError instanceof Error) {
        handleError(retryError, 'retry_failed');
      }
    }
  }, [state.lastError, state.canRetry, operationId, onRecovery, handleError]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastError: null,
      canRetry: false,
      recoveryAttempts: 0
    }));
  }, []);

  const reportError = useCallback(() => {
    if (!state.lastError) return;

    const errorReport = {
      id: `${state.lastError.type}_${state.lastError.timestamp}`,
      type: state.lastError.type,
      message: state.lastError.message,
      details: state.lastError.details,
      context: state.lastError.context,
      timestamp: new Date(state.lastError.timestamp).toISOString(),
      recoveryAttempts: state.recoveryAttempts,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        console.log('Error report copied to clipboard');
      })
      .catch(() => {
        console.error('Failed to copy error report');
      });
  }, [state.lastError, state.recoveryAttempts]);

  const saveForLater = useCallback((data: any) => {
    if (!operationId) return;

    try {
      // Save data for offline recovery
      if (state.lastError?.context?.tradeId) {
        offlineDataService.saveLocalBackup(state.lastError.context.tradeId, data);
      } else {
        // Generic backup
        localStorage.setItem(`error_recovery_${operationId}`, JSON.stringify({
          data,
          timestamp: Date.now(),
          error: state.lastError
        }));
      }
    } catch (error) {
      console.warn('Failed to save data for later recovery:', error);
    }
  }, [operationId, state.lastError]);

  return [
    state,
    {
      handleError,
      retry,
      clearError,
      reportError,
      saveForLater
    }
  ];
}

function getErrorType(error: Error): TradeReviewErrorType {
  // Map common error types
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return TradeReviewErrorType.NETWORK_ERROR;
  }
  
  if (error.message.includes('permission') || error.message.includes('unauthorized')) {
    return TradeReviewErrorType.PERMISSION_DENIED;
  }
  
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return TradeReviewErrorType.VALIDATION_ERROR;
  }
  
  if (error.message.includes('save') || error.message.includes('persist')) {
    return TradeReviewErrorType.SAVE_FAILED;
  }
  
  if (error.message.includes('upload') || error.message.includes('file')) {
    return TradeReviewErrorType.CHART_UPLOAD_FAILED;
  }

  return TradeReviewErrorType.REVIEW_WORKFLOW_ERROR;
}

// Hook for handling async operations with automatic error recovery
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, errorActions] = useErrorRecovery();

  const execute = useCallback(async () => {
    setLoading(true);
    errorActions.clearError();

    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        errorActions.handleError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [operation, errorActions, ...dependencies]);

  const executeWithRetry = useCallback(async () => {
    return retryService.executeWithRetry(
      `async_op_${Date.now()}`,
      operation,
      {
        maxAttempts: 3,
        baseDelay: 1000,
        onRetry: (attempt, error) => {
          console.log(`Retrying operation (attempt ${attempt}):`, error.message);
        }
      }
    );
  }, [operation]);

  return {
    data,
    loading,
    error: errorState.lastError,
    isRecovering: errorState.isRecovering,
    canRetry: errorState.canRetry,
    execute,
    executeWithRetry,
    retry: errorActions.retry,
    clearError: errorActions.clearError
  };
}
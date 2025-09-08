import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useErrorHandling from '../useErrorHandling';
import ErrorHandlingService from '../../services/ErrorHandlingService';
import NotificationService from '../../services/NotificationService';
import ValidationService from '../../services/ValidationService';

// Mock the services
vi.mock('../../services/ErrorHandlingService');
vi.mock('../../services/NotificationService');
vi.mock('../../services/ValidationService');

describe('useErrorHandling', () => {
  let mockErrorService: any;
  let mockNotificationService: any;
  let mockValidationService: any;

  beforeEach(() => {
    mockErrorService = {
      handleError: vi.fn(),
      retryOperation: vi.fn(),
      processRetryQueue: vi.fn(),
      getRetryQueueStatus: vi.fn().mockReturnValue({ count: 0, operations: [] })
    };

    mockNotificationService = {
      onStatusChange: vi.fn().mockImplementation((callback) => {
        // Immediately call with initial status
        callback(
          { status: 'saved', pendingChanges: false },
          { status: 'synced', pendingOperations: 0 }
        );
        return vi.fn(); // Return unsubscribe function
      }),
      updateSaveStatus: vi.fn(),
      updateSyncStatus: vi.fn(),
      showAutoSaveNotification: vi.fn(),
      showProgress: vi.fn(),
      showValidationErrors: vi.fn(),
      clearAll: vi.fn()
    };

    mockValidationService = {
      validateJournalEntry: vi.fn(),
      validateField: vi.fn()
    };

    (ErrorHandlingService.getInstance as any).mockReturnValue(mockErrorService);
    (NotificationService.getInstance as any).mockReturnValue(mockNotificationService);
    (ValidationService.getInstance as any).mockReturnValue(mockValidationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useErrorHandling());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
      expect(result.current.saveStatus).toEqual({
        status: 'saved',
        pendingChanges: false
      });
      expect(result.current.syncStatus).toEqual({
        status: 'synced',
        pendingOperations: 0
      });
    });

    it('should subscribe to status changes on mount', () => {
      renderHook(() => useErrorHandling());

      expect(mockNotificationService.onStatusChange).toHaveBeenCalled();
    });
  });

  describe('handleError', () => {
    it('should handle errors and update state', async () => {
      const { result } = renderHook(() => useErrorHandling({
        component: 'TestComponent',
        userId: 'user123'
      }));

      const error = new Error('Test error');
      
      await act(async () => {
        await result.current.handleError(error, 'test_operation');
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'test_operation',
          component: 'TestComponent',
          userId: 'user123'
        })
      );

      expect(result.current.error).toBe(error);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('executeWithErrorHandling', () => {
    it('should execute operation successfully', async () => {
      const { result } = renderHook(() => useErrorHandling());

      const mockOperation = vi.fn().mockResolvedValue('success');

      let operationResult: any;
      await act(async () => {
        operationResult = await result.current.executeWithErrorHandling(
          mockOperation,
          'test_operation'
        );
      });

      expect(operationResult).toBe('success');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
    });

    it('should handle operation failure', async () => {
      const { result } = renderHook(() => useErrorHandling());

      const error = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(error);

      let operationResult: any;
      await act(async () => {
        operationResult = await result.current.executeWithErrorHandling(
          mockOperation,
          'test_operation'
        );
      });

      expect(operationResult).toBeNull();
      expect(result.current.error).toBe(error);
      expect(result.current.retryCount).toBe(1);
      expect(mockErrorService.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'test_operation'
        })
      );
    });

    it('should use retry logic when autoRetry is enabled', async () => {
      const { result } = renderHook(() => useErrorHandling({
        autoRetry: true,
        retryConfig: { maxRetries: 2, baseDelay: 100 }
      }));

      const mockOperation = vi.fn().mockResolvedValue('success');
      mockErrorService.retryOperation.mockResolvedValue('success');

      let operationResult: any;
      await act(async () => {
        operationResult = await result.current.executeWithErrorHandling(
          mockOperation,
          'test_operation'
        );
      });

      expect(mockErrorService.retryOperation).toHaveBeenCalledWith(
        mockOperation,
        { maxRetries: 2, baseDelay: 100 },
        expect.objectContaining({
          operation: 'test_operation'
        })
      );
      expect(operationResult).toBe('success');
    });
  });

  describe('validateWithFeedback', () => {
    it('should validate journal entry successfully', () => {
      const { result } = renderHook(() => useErrorHandling());

      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };

      mockValidationService.validateJournalEntry.mockReturnValue(mockValidationResult);

      const journalEntry = { date: '2024-01-15', userId: 'user123' };
      
      act(() => {
        const validationResult = result.current.validateWithFeedback(
          journalEntry,
          'journalEntry'
        );
        expect(validationResult).toEqual(mockValidationResult);
      });

      expect(mockValidationService.validateJournalEntry).toHaveBeenCalledWith(journalEntry);
    });

    it('should validate field successfully', () => {
      const { result } = renderHook(() => useErrorHandling());

      const mockFieldError = {
        field: 'date',
        message: 'Invalid date format',
        code: 'INVALID_FORMAT',
        severity: 'error' as const
      };

      mockValidationService.validateField.mockReturnValue(mockFieldError);

      act(() => {
        const validationResult = result.current.validateWithFeedback(
          'invalid-date',
          'field',
          'date'
        );
        
        expect(validationResult?.errors).toContain(mockFieldError);
      });

      expect(mockValidationService.validateField).toHaveBeenCalledWith(
        'date',
        'invalid-date'
      );
    });

    it('should show validation errors', () => {
      const { result } = renderHook(() => useErrorHandling());

      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'date',
            message: 'Date is required',
            code: 'REQUIRED_FIELD',
            severity: 'error' as const
          }
        ],
        warnings: [],
        suggestions: []
      };

      mockValidationService.validateJournalEntry.mockReturnValue(mockValidationResult);

      act(() => {
        result.current.validateWithFeedback({}, 'journalEntry');
      });

      expect(mockNotificationService.showValidationErrors).toHaveBeenCalledWith([
        { field: 'date', message: 'Date is required' }
      ]);
    });

    it('should handle validation errors gracefully', () => {
      const { result } = renderHook(() => useErrorHandling());

      const validationError = new Error('Validation service error');
      mockValidationService.validateJournalEntry.mockImplementation(() => {
        throw validationError;
      });

      act(() => {
        const validationResult = result.current.validateWithFeedback(
          {},
          'journalEntry'
        );
        expect(validationResult).toBeNull();
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(
        validationError,
        expect.objectContaining({
          operation: 'validate_data'
        })
      );
    });
  });

  describe('status management', () => {
    it('should update save status', () => {
      const { result } = renderHook(() => useErrorHandling());

      const saveStatus = { status: 'saving' as const };

      act(() => {
        result.current.updateSaveStatus(saveStatus);
      });

      expect(mockNotificationService.updateSaveStatus).toHaveBeenCalledWith(saveStatus);
    });

    it('should update sync status', () => {
      const { result } = renderHook(() => useErrorHandling());

      const syncStatus = { status: 'syncing' as const, pendingOperations: 3 };

      act(() => {
        result.current.updateSyncStatus(syncStatus);
      });

      expect(mockNotificationService.updateSyncStatus).toHaveBeenCalledWith(syncStatus);
    });

    it('should show auto-save notification', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.showAutoSaveNotification(true);
      });

      expect(mockNotificationService.showAutoSaveNotification).toHaveBeenCalledWith(true, undefined);

      act(() => {
        result.current.showAutoSaveNotification(false, 'Network error');
      });

      expect(mockNotificationService.showAutoSaveNotification).toHaveBeenCalledWith(
        false,
        'Network error'
      );
    });

    it('should show progress notification', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.showProgress('Uploading', 0.5);
      });

      expect(mockNotificationService.showProgress).toHaveBeenCalledWith('Uploading', 0.5);
    });
  });

  describe('retry management', () => {
    it('should retry failed operations', async () => {
      const { result } = renderHook(() => useErrorHandling());

      await act(async () => {
        await result.current.retryFailedOperations();
      });

      expect(mockErrorService.processRetryQueue).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle retry failures', async () => {
      const { result } = renderHook(() => useErrorHandling());

      const retryError = new Error('Retry failed');
      mockErrorService.processRetryQueue.mockRejectedValue(retryError);

      await act(async () => {
        await result.current.retryFailedOperations();
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(
        retryError,
        expect.objectContaining({
          operation: 'retry_operations'
        })
      );
    });

    it('should get retry queue status', () => {
      const { result } = renderHook(() => useErrorHandling());

      const mockStatus = { count: 2, operations: ['op1', 'op2'] };
      mockErrorService.getRetryQueueStatus.mockReturnValue(mockStatus);

      act(() => {
        const status = result.current.getRetryQueueStatus();
        expect(status).toEqual(mockStatus);
      });
    });
  });

  describe('utility functions', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useErrorHandling());

      // Set an error first
      act(() => {
        result.current.handleError(new Error('Test error'), 'test');
      });

      expect(result.current.error).not.toBeNull();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should check if error can be retried', () => {
      const { result } = renderHook(() => useErrorHandling());

      const retryableError = new Error('network timeout');
      const nonRetryableError = new Error('validation failed');

      expect(result.current.canRetry(retryableError)).toBe(true);
      expect(result.current.canRetry(nonRetryableError)).toBe(false);
    });

    it('should clear notifications', () => {
      const { result } = renderHook(() => useErrorHandling());

      act(() => {
        result.current.clearNotifications();
      });

      expect(mockNotificationService.clearAll).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from status changes on unmount', () => {
      const mockUnsubscribe = vi.fn();
      mockNotificationService.onStatusChange.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useErrorHandling());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
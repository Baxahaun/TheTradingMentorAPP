import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorRecovery, useAsyncOperation } from '../useErrorRecovery';

// Mock dependencies
vi.mock('../../lib/errorHandlingService', () => ({
  errorHandlingService: {
    createError: vi.fn((type, message, details) => ({
      type,
      message,
      details,
      timestamp: Date.now(),
      recoverable: type === 'SAVE_FAILED'
    })),
    handleError: vi.fn(),
    onNetworkChange: vi.fn((callback) => {
      const cleanup = () => {};
      return cleanup;
    })
  },
  TradeReviewErrorType: {
    SAVE_FAILED: 'SAVE_FAILED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  }
}));

vi.mock('../../lib/retryService', () => ({
  retryService: {
    executeWithRetry: vi.fn()
  }
}));

vi.mock('../../lib/offlineDataService', () => ({
  offlineDataService: {
    saveLocalBackup: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  writable: true
});

Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

describe('useErrorRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useErrorRecovery());
      const [state] = result.current;

      expect(state).toEqual({
        isRecovering: false,
        lastError: null,
        recoveryAttempts: 0,
        canRetry: false,
        isOffline: false
      });
    });

    it('should detect offline state correctly', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const { result } = renderHook(() => useErrorRecovery());
      const [state] = result.current;

      expect(state.isOffline).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors and update state', () => {
      const { result } = renderHook(() => useErrorRecovery('test-op'));
      const [, actions] = result.current;

      act(() => {
        actions.handleError(new Error('Test error'), { context: 'test' });
      });

      const [state] = result.current;
      expect(state.lastError).toBeTruthy();
      expect(state.lastError?.message).toBe('Test error');
      expect(state.canRetry).toBe(false); // Non-recoverable by default
    });

    it('should set canRetry for recoverable errors', () => {
      const { errorHandlingService } = require('../../lib/errorHandlingService');
      errorHandlingService.createError.mockReturnValue({
        type: 'SAVE_FAILED',
        message: 'Save failed',
        recoverable: true,
        timestamp: Date.now()
      });

      const { result } = renderHook(() => useErrorRecovery('test-op'));
      const [, actions] = result.current;

      act(() => {
        actions.handleError(new Error('Save failed'));
      });

      const [state] = result.current;
      expect(state.canRetry).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should execute recovery operation', async () => {
      const { retryService } = require('../../lib/retryService');
      const onRecovery = vi.fn().mockResolvedValue(undefined);
      retryService.executeWithRetry.mockResolvedValue(undefined);

      const { result } = renderHook(() => useErrorRecovery('test-op', onRecovery));
      const [, actions] = result.current;

      // First set an error
      act(() => {
        actions.handleError(new Error('Recoverable error'));
      });

      // Mock the error as recoverable
      result.current[0].lastError = {
        ...result.current[0].lastError!,
        recoverable: true
      };
      result.current[0].canRetry = true;

      await act(async () => {
        await actions.retry();
      });

      expect(retryService.executeWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('recovery_test-op'),
        onRecovery,
        expect.objectContaining({
          maxAttempts: 3,
          baseDelay: 1000,
          backoffMultiplier: 2
        })
      );
    });

    it('should handle recovery failure', async () => {
      const { retryService } = require('../../lib/retryService');
      const onRecovery = vi.fn();
      retryService.executeWithRetry.mockRejectedValue(new Error('Recovery failed'));

      const { result } = renderHook(() => useErrorRecovery('test-op', onRecovery));
      const [, actions] = result.current;

      // Set recoverable error
      act(() => {
        actions.handleError(new Error('Recoverable error'));
      });

      result.current[0].lastError = {
        ...result.current[0].lastError!,
        recoverable: true
      };
      result.current[0].canRetry = true;

      await act(async () => {
        await actions.retry();
      });

      const [state] = result.current;
      expect(state.isRecovering).toBe(false);
      expect(state.recoveryAttempts).toBe(1);
    });

    it('should not retry when no error or not recoverable', async () => {
      const { retryService } = require('../../lib/retryService');
      
      const { result } = renderHook(() => useErrorRecovery('test-op'));
      const [, actions] = result.current;

      await act(async () => {
        await actions.retry();
      });

      expect(retryService.executeWithRetry).not.toHaveBeenCalled();
    });
  });

  describe('Error Clearing', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useErrorRecovery());
      const [, actions] = result.current;

      // Set an error first
      act(() => {
        actions.handleError(new Error('Test error'));
      });

      expect(result.current[0].lastError).toBeTruthy();

      // Clear the error
      act(() => {
        actions.clearError();
      });

      const [state] = result.current;
      expect(state.lastError).toBeNull();
      expect(state.canRetry).toBe(false);
      expect(state.recoveryAttempts).toBe(0);
    });
  });

  describe('Error Reporting', () => {
    it('should copy error report to clipboard', async () => {
      const { result } = renderHook(() => useErrorRecovery('test-op'));
      const [, actions] = result.current;

      // Set an error first
      act(() => {
        actions.handleError(new Error('Test error'), { context: 'test' });
      });

      await act(async () => {
        actions.reportError();
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error"')
      );
    });

    it('should handle clipboard failure gracefully', async () => {
      (navigator.clipboard.writeText as any).mockRejectedValue(new Error('Clipboard failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useErrorRecovery());
      const [, actions] = result.current;

      act(() => {
        actions.handleError(new Error('Test error'));
      });

      await act(async () => {
        actions.reportError();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy error report');
      consoleSpy.mockRestore();
    });
  });

  describe('Save for Later', () => {
    it('should save data for later recovery with trade ID', () => {
      const { offlineDataService } = require('../../lib/offlineDataService');
      
      const { result } = renderHook(() => useErrorRecovery('test-op'));
      const [, actions] = result.current;

      // Set error with trade context
      act(() => {
        actions.handleError(new Error('Test error'));
      });

      result.current[0].lastError = {
        ...result.current[0].lastError!,
        context: { tradeId: '123' }
      };

      const testData = { notes: 'test' };
      
      act(() => {
        actions.saveForLater(testData);
      });

      expect(offlineDataService.saveLocalBackup).toHaveBeenCalledWith('123', testData);
    });

    it('should save data to localStorage when no trade ID', () => {
      const { result } = renderHook(() => useErrorRecovery('test-op'));
      const [, actions] = result.current;

      act(() => {
        actions.handleError(new Error('Test error'));
      });

      const testData = { notes: 'test' };
      
      act(() => {
        actions.saveForLater(testData);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'error_recovery_test-op',
        expect.stringContaining('"notes":"test"')
      );
    });

    it('should handle save failure gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage failed');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useErrorRecovery('test-op'));
      const [, actions] = result.current;

      act(() => {
        actions.handleError(new Error('Test error'));
        actions.saveForLater({ test: 'data' });
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save data for later recovery:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});

describe('useAsyncOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Operation', () => {
    it('should execute operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const { result } = renderHook(() => useAsyncOperation(operation));

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();

      await act(async () => {
        const result_value = await result.current.execute();
        expect(result_value).toBe('success');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe('success');
      expect(result.current.error).toBeNull();
    });

    it('should handle operation failure', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      const { result } = renderHook(() => useAsyncOperation(operation));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Operation failed');
    });

    it('should set loading state during execution', async () => {
      let resolveOperation: (value: string) => void;
      const operation = vi.fn(() => new Promise<string>(resolve => {
        resolveOperation = resolve;
      }));
      
      const { result } = renderHook(() => useAsyncOperation(operation));

      act(() => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveOperation!('success');
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Retry with Service', () => {
    it('should execute with retry service', async () => {
      const { retryService } = require('../../lib/retryService');
      const operation = vi.fn().mockResolvedValue('retry-success');
      retryService.executeWithRetry.mockResolvedValue('retry-success');
      
      const { result } = renderHook(() => useAsyncOperation(operation));

      await act(async () => {
        const result_value = await result.current.executeWithRetry();
        expect(result_value).toBe('retry-success');
      });

      expect(retryService.executeWithRetry).toHaveBeenCalledWith(
        expect.stringMatching(/async_op_\d+/),
        operation,
        expect.objectContaining({
          maxAttempts: 3,
          baseDelay: 1000
        })
      );
    });
  });

  describe('Error Recovery Integration', () => {
    it('should provide retry functionality', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      
      const { result } = renderHook(() => useAsyncOperation(operation));

      // First execution fails
      await act(async () => {
        try {
          await result.current.execute();
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.canRetry).toBe(false); // Non-recoverable by default

      // Clear error and retry
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
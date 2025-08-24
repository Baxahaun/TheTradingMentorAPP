import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { errorHandlingService, TradeReviewErrorType, TradeReviewError } from '../errorHandlingService';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('ErrorHandlingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorHandlingService.clearErrorLog();
    errorHandlingService.configure({
      enableLogging: true,
      enableToasts: true,
      enableRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 100, // Faster for tests
      enableOfflineMode: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Creation', () => {
    it('should create error with correct properties', () => {
      const error = errorHandlingService.createError(
        TradeReviewErrorType.SAVE_FAILED,
        'Test error message',
        { detail: 'test' },
        { tradeId: '123', userId: 'user1' }
      );

      expect(error).toMatchObject({
        type: TradeReviewErrorType.SAVE_FAILED,
        message: 'Test error message',
        details: { detail: 'test' },
        recoverable: true,
        context: { tradeId: '123', userId: 'user1' }
      });
      expect(error.timestamp).toBeTypeOf('number');
      expect(error.suggestedAction).toBe('Check your connection and try saving again');
    });

    it('should determine recoverability correctly', () => {
      const recoverableError = errorHandlingService.createError(
        TradeReviewErrorType.SAVE_FAILED,
        'Save failed'
      );
      expect(recoverableError.recoverable).toBe(true);

      const nonRecoverableError = errorHandlingService.createError(
        TradeReviewErrorType.TRADE_NOT_FOUND,
        'Trade not found'
      );
      expect(nonRecoverableError.recoverable).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should log errors when logging is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = errorHandlingService.createError(
        TradeReviewErrorType.SAVE_FAILED,
        'Test error'
      );
      
      errorHandlingService.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TradeReview Error]',
        expect.objectContaining({
          type: TradeReviewErrorType.SAVE_FAILED,
          message: 'Test error'
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should store errors in error log', () => {
      const error = errorHandlingService.createError(
        TradeReviewErrorType.SAVE_FAILED,
        'Test error'
      );
      
      errorHandlingService.handleError(error);
      
      const errorLog = errorHandlingService.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0]).toMatchObject({
        type: TradeReviewErrorType.SAVE_FAILED,
        message: 'Test error'
      });
    });

    it('should limit error log size to 100 entries', () => {
      // Add 150 errors
      for (let i = 0; i < 150; i++) {
        const error = errorHandlingService.createError(
          TradeReviewErrorType.SAVE_FAILED,
          `Error ${i}`
        );
        errorHandlingService.handleError(error);
      }
      
      const errorLog = errorHandlingService.getErrorLog();
      expect(errorLog).toHaveLength(100);
      expect(errorLog[0].message).toBe('Error 50'); // Should keep last 100
    });
  });

  describe('Recovery Actions', () => {
    it('should provide appropriate recovery actions for different error types', () => {
      const saveError = errorHandlingService.createError(
        TradeReviewErrorType.SAVE_FAILED,
        'Save failed'
      );
      const saveActions = errorHandlingService.getRecoveryActions(saveError);
      expect(saveActions).toHaveLength(1);
      expect(saveActions[0].label).toBe('Retry Save');

      const tradeNotFoundError = errorHandlingService.createError(
        TradeReviewErrorType.TRADE_NOT_FOUND,
        'Trade not found'
      );
      const tradeActions = errorHandlingService.getRecoveryActions(tradeNotFoundError);
      expect(tradeActions).toHaveLength(1);
      expect(tradeActions[0].label).toBe('Go to Trade List');
    });

    it('should return empty actions for non-recoverable errors without specific actions', () => {
      const error = errorHandlingService.createError(
        TradeReviewErrorType.PERMISSION_DENIED,
        'Permission denied'
      );
      const actions = errorHandlingService.getRecoveryActions(error);
      expect(actions).toHaveLength(0);
    });
  });

  describe('Local Backup', () => {
    it('should save and retrieve local backup', () => {
      const testData = { notes: 'test notes', tags: ['tag1'] };
      const tradeId = '123';
      
      errorHandlingService.saveLocalBackup(tradeId, testData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `trade_backup_${tradeId}`,
        expect.stringContaining('"notes":"test notes"')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      errorHandlingService.saveLocalBackup('123', { test: 'data' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save local backup:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should clear local backup', () => {
      errorHandlingService.clearLocalBackup('123');
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('trade_backup_123');
    });
  });

  describe('Network Status', () => {
    it('should return correct online status', () => {
      expect(errorHandlingService.isOnline()).toBe(true);
      
      Object.defineProperty(navigator, 'onLine', { value: false });
      expect(errorHandlingService.isOnline()).toBe(false);
    });

    it('should register network change listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const callback = vi.fn();
      const cleanup = errorHandlingService.onNetworkChange(callback);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
      
      cleanup();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      errorHandlingService.configure({
        enableLogging: false,
        maxRetryAttempts: 5
      });
      
      // Test that logging is disabled
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = errorHandlingService.createError(
        TradeReviewErrorType.SAVE_FAILED,
        'Test error'
      );
      errorHandlingService.handleError(error);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Log Management', () => {
    it('should clear error log', () => {
      const error = errorHandlingService.createError(
        TradeReviewErrorType.SAVE_FAILED,
        'Test error'
      );
      errorHandlingService.handleError(error);
      
      expect(errorHandlingService.getErrorLog()).toHaveLength(1);
      
      errorHandlingService.clearErrorLog();
      
      expect(errorHandlingService.getErrorLog()).toHaveLength(0);
    });
  });

  describe('Suggested Actions', () => {
    it('should provide appropriate suggestions for each error type', () => {
      const errorTypes = Object.values(TradeReviewErrorType);
      
      errorTypes.forEach(type => {
        const error = errorHandlingService.createError(type, 'Test message');
        expect(error.suggestedAction).toBeTruthy();
        expect(typeof error.suggestedAction).toBe('string');
      });
    });
  });
});
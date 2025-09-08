import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotificationService, { NotificationConfig, SaveStatus, SyncStatus } from '../NotificationService';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    __call: vi.fn()
  };
  
  return {
    toast: Object.assign(mockToast.__call, mockToast)
  };
});

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockToast: any;

  beforeEach(async () => {
    // Get the mocked toast
    const { toast } = await import('react-hot-toast');
    mockToast = toast as any;
    
    notificationService = NotificationService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('show', () => {
    it('should show success notification', () => {
      const config: NotificationConfig = {
        type: 'success',
        message: 'Operation completed successfully',
        duration: 3000
      };

      const toastId = notificationService.show(config);

      expect(mockToast.success).toHaveBeenCalledWith(
        'Operation completed successfully',
        {
          duration: 3000,
          id: toastId
        }
      );
    });

    it('should show error notification', () => {
      const config: NotificationConfig = {
        type: 'error',
        message: 'Operation failed',
        id: 'custom-error-id'
      };

      notificationService.show(config);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Operation failed',
        {
          duration: 5000,
          id: 'custom-error-id'
        }
      );
    });

    it('should show loading notification', () => {
      const config: NotificationConfig = {
        type: 'loading',
        message: 'Processing...',
        duration: Infinity
      };

      notificationService.show(config);

      expect(mockToast.loading).toHaveBeenCalledWith(
        'Processing...',
        {
          duration: Infinity,
          id: expect.any(String)
        }
      );
    });

    it('should show warning notification', () => {
      const config: NotificationConfig = {
        type: 'warning',
        message: 'Warning message'
      };

      notificationService.show(config);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Warning message',
        {
          duration: 4000,
          id: expect.any(String),
          icon: '⚠️'
        }
      );
    });

    it('should show info notification', () => {
      const config: NotificationConfig = {
        type: 'info',
        message: 'Information message'
      };

      notificationService.show(config);

      expect(mockToast.__call).toHaveBeenCalledWith(
        'Information message',
        {
          duration: 3000,
          id: expect.any(String),
          icon: 'ℹ️'
        }
      );
    });
  });

  describe('updateSaveStatus', () => {
    it('should update save status to saving', () => {
      const status: Partial<SaveStatus> = {
        status: 'saving'
      };

      notificationService.updateSaveStatus(status);

      expect(mockToast.loading).toHaveBeenCalledWith(
        'Saving changes...',
        {
          id: 'save-status',
          duration: 2000
        }
      );
    });

    it('should update save status to saved', () => {
      const lastSaved = new Date();
      const status: Partial<SaveStatus> = {
        status: 'saved',
        lastSaved
      };

      notificationService.updateSaveStatus(status);

      expect(mockToast.dismiss).toHaveBeenCalledWith('save-status');
      expect(mockToast.success).toHaveBeenCalledWith(
        `Saved at ${lastSaved.toLocaleTimeString()}`,
        {
          id: 'save-success',
          duration: 2000
        }
      );
    });

    it('should update save status to error', () => {
      const status: Partial<SaveStatus> = {
        status: 'error',
        error: 'Network connection failed'
      };

      notificationService.updateSaveStatus(status);

      expect(mockToast.dismiss).toHaveBeenCalledWith('save-status');
      expect(mockToast.error).toHaveBeenCalledWith(
        'Save failed: Network connection failed',
        {
          id: 'save-error',
          action: {
            label: 'Retry',
            onClick: expect.any(Function)
          }
        }
      );
    });

    it('should update save status to offline', () => {
      const status: Partial<SaveStatus> = {
        status: 'offline'
      };

      notificationService.updateSaveStatus(status);

      expect(mockToast.dismiss).toHaveBeenCalledWith('save-status');
      expect(mockToast.error).toHaveBeenCalledWith(
        'Changes saved locally. Will sync when online.',
        {
          id: 'save-offline',
          duration: 4000,
          icon: '⚠️'
        }
      );
    });
  });

  describe('updateSyncStatus', () => {
    it('should update sync status to syncing', () => {
      const status: Partial<SyncStatus> = {
        status: 'syncing',
        pendingOperations: 3
      };

      notificationService.updateSyncStatus(status);

      expect(mockToast.loading).toHaveBeenCalledWith(
        'Syncing 3 changes...',
        {
          id: 'sync-status'
        }
      );
    });

    it('should update sync status to synced', () => {
      const lastSync = new Date();
      const status: Partial<SyncStatus> = {
        status: 'synced',
        lastSync
      };

      notificationService.updateSyncStatus(status);

      expect(mockToast.dismiss).toHaveBeenCalledWith('sync-status');
      expect(mockToast.__call).toHaveBeenCalledWith(
        'All changes synced',
        {
          id: 'sync-success',
          duration: 2000,
          icon: 'ℹ️'
        }
      );
    });

    it('should update sync status to error', () => {
      const status: Partial<SyncStatus> = {
        status: 'error',
        error: 'Sync server unavailable'
      };

      notificationService.updateSyncStatus(status);

      expect(mockToast.dismiss).toHaveBeenCalledWith('sync-status');
      expect(mockToast.error).toHaveBeenCalledWith(
        'Sync failed: Sync server unavailable',
        {
          id: 'sync-error',
          action: {
            label: 'Retry Sync',
            onClick: expect.any(Function)
          }
        }
      );
    });
  });

  describe('showAutoSaveNotification', () => {
    it('should show success auto-save notification', () => {
      notificationService.showAutoSaveNotification(true);

      expect(mockToast.__call).toHaveBeenCalledWith(
        'Auto-saved',
        {
          duration: 1500,
          id: 'auto-save',
          icon: 'ℹ️'
        }
      );
    });

    it('should show failed auto-save notification', () => {
      notificationService.showAutoSaveNotification(false, 'Connection timeout');

      expect(mockToast.error).toHaveBeenCalledWith(
        'Auto-save failed: Connection timeout',
        {
          duration: 3000,
          id: 'auto-save-error',
          icon: '⚠️'
        }
      );
    });
  });

  describe('showValidationErrors', () => {
    it('should show single validation error', () => {
      const errors = [
        { field: 'date', message: 'Date is required' }
      ];

      notificationService.showValidationErrors(errors);

      expect(mockToast.error).toHaveBeenCalledWith(
        'date: Date is required',
        {
          duration: 4000,
          icon: '⚠️'
        }
      );
    });

    it('should show multiple validation errors summary', () => {
      const errors = [
        { field: 'date', message: 'Date is required' },
        { field: 'content', message: 'Content is too short' }
      ];

      notificationService.showValidationErrors(errors);

      expect(mockToast.error).toHaveBeenCalledWith(
        '2 validation errors found. Please check your input.',
        {
          duration: 4000,
          icon: '⚠️'
        }
      );
    });
  });

  describe('showNetworkStatusChange', () => {
    it('should show online notification', () => {
      notificationService.showNetworkStatusChange(true);

      expect(mockToast.success).toHaveBeenCalledWith(
        'Connection restored. Syncing changes...',
        {
          duration: 3000,
          id: 'network-online'
        }
      );
    });

    it('should show offline notification', () => {
      notificationService.showNetworkStatusChange(false);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Connection lost. Working offline.',
        {
          duration: 4000,
          id: 'network-offline',
          icon: '⚠️'
        }
      );
    });
  });

  describe('showProgress', () => {
    it('should show progress notification', () => {
      notificationService.showProgress('Uploading images', 0.5);

      expect(mockToast.loading).toHaveBeenCalledWith(
        'Uploading images: 50%',
        {
          id: 'progress-Uploading images',
          duration: Infinity
        }
      );
    });

    it('should show completion notification when progress reaches 100%', (done) => {
      notificationService.showProgress('Uploading images', 1.0);

      // Check that completion notification is shown after delay
      setTimeout(() => {
        expect(mockToast.dismiss).toHaveBeenCalledWith('progress-Uploading images');
        expect(mockToast.success).toHaveBeenCalledWith(
          'Uploading images completed',
          {
            duration: 2000
          }
        );
        done();
      }, 600);
    });
  });

  describe('status subscription', () => {
    it('should notify subscribers of status changes', () => {
      const mockCallback = vi.fn();
      
      const unsubscribe = notificationService.onStatusChange(mockCallback);

      // Should be called immediately with current status
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'saved' }),
        expect.objectContaining({ status: 'synced' })
      );

      // Should be called when status changes
      notificationService.updateSaveStatus({ status: 'saving' });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'saving' }),
        expect.objectContaining({ status: 'synced' })
      );

      unsubscribe();
    });

    it('should handle callback errors gracefully', () => {
      const mockCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      notificationService.onStatusChange(mockCallback);
      notificationService.updateSaveStatus({ status: 'saving' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error in status change callback:',
        expect.any(Error)
      );

      mockConsoleError.mockRestore();
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
import { toast } from 'react-hot-toast';

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  duration?: number;
  id?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

export interface SaveStatus {
  status: 'saving' | 'saved' | 'error' | 'offline';
  lastSaved?: Date;
  error?: string;
  pendingChanges: boolean;
}

export interface SyncStatus {
  status: 'syncing' | 'synced' | 'error' | 'offline';
  lastSync?: Date;
  pendingOperations: number;
  error?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private saveStatus: SaveStatus = { status: 'saved', pendingChanges: false };
  private syncStatus: SyncStatus = { status: 'synced', pendingOperations: 0 };
  private statusCallbacks: Set<(saveStatus: SaveStatus, syncStatus: SyncStatus) => void> = new Set();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Show notification with appropriate styling and behavior
   */
  show(config: NotificationConfig): string {
    const toastId = config.id || `notification-${Date.now()}`;

    switch (config.type) {
      case 'success':
        toast.success(config.message, {
          duration: config.duration || 3000,
          id: toastId
        });
        break;

      case 'error':
        toast.error(config.message, {
          duration: config.duration || 5000,
          id: toastId
        });
        break;

      case 'warning':
        toast.error(config.message, {
          duration: config.duration || 4000,
          id: toastId,
          icon: '⚠️'
        });
        break;

      case 'info':
        toast(config.message, {
          duration: config.duration || 3000,
          id: toastId,
          icon: 'ℹ️'
        });
        break;

      case 'loading':
        toast.loading(config.message, {
          duration: config.duration || Infinity,
          id: toastId
        });
        break;
    }

    return toastId;
  }

  /**
   * Update save status and notify subscribers
   */
  updateSaveStatus(status: Partial<SaveStatus>): void {
    this.saveStatus = { ...this.saveStatus, ...status };
    this.notifyStatusChange();

    // Show appropriate notifications
    switch (this.saveStatus.status) {
      case 'saving':
        this.show({
          type: 'loading',
          message: 'Saving changes...',
          id: 'save-status',
          duration: 2000
        });
        break;

      case 'saved':
        toast.dismiss('save-status');
        if (this.saveStatus.lastSaved) {
          this.show({
            type: 'success',
            message: `Saved at ${this.saveStatus.lastSaved.toLocaleTimeString()}`,
            id: 'save-success',
            duration: 2000
          });
        }
        break;

      case 'error':
        toast.dismiss('save-status');
        this.show({
          type: 'error',
          message: `Save failed: ${this.saveStatus.error || 'Unknown error'}`,
          id: 'save-error',
          action: {
            label: 'Retry',
            onClick: () => this.retrySave()
          }
        });
        break;

      case 'offline':
        toast.dismiss('save-status');
        this.show({
          type: 'warning',
          message: 'Changes saved locally. Will sync when online.',
          id: 'save-offline',
          duration: 4000
        });
        break;
    }
  }

  /**
   * Update sync status and notify subscribers
   */
  updateSyncStatus(status: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...status };
    this.notifyStatusChange();

    // Show appropriate notifications
    switch (this.syncStatus.status) {
      case 'syncing':
        if (this.syncStatus.pendingOperations > 0) {
          this.show({
            type: 'loading',
            message: `Syncing ${this.syncStatus.pendingOperations} changes...`,
            id: 'sync-status'
          });
        }
        break;

      case 'synced':
        toast.dismiss('sync-status');
        if (this.syncStatus.lastSync) {
          this.show({
            type: 'info',
            message: 'All changes synced',
            id: 'sync-success',
            duration: 2000
          });
        }
        break;

      case 'error':
        toast.dismiss('sync-status');
        this.show({
          type: 'error',
          message: `Sync failed: ${this.syncStatus.error || 'Unknown error'}`,
          id: 'sync-error',
          action: {
            label: 'Retry Sync',
            onClick: () => this.retrySync()
          }
        });
        break;

      case 'offline':
        toast.dismiss('sync-status');
        this.show({
          type: 'warning',
          message: 'Offline mode. Changes will sync when connection is restored.',
          id: 'sync-offline',
          persistent: true
        });
        break;
    }
  }

  /**
   * Show auto-save notification
   */
  showAutoSaveNotification(success: boolean, error?: string): void {
    if (success) {
      this.show({
        type: 'info',
        message: 'Auto-saved',
        duration: 1500,
        id: 'auto-save'
      });
    } else {
      this.show({
        type: 'warning',
        message: `Auto-save failed: ${error || 'Unknown error'}`,
        duration: 3000,
        id: 'auto-save-error'
      });
    }
  }

  /**
   * Show validation errors
   */
  showValidationErrors(errors: Array<{ field: string; message: string }>): void {
    if (errors.length === 1) {
      this.show({
        type: 'warning',
        message: `${errors[0].field}: ${errors[0].message}`,
        duration: 4000
      });
    } else {
      this.show({
        type: 'warning',
        message: `${errors.length} validation errors found. Please check your input.`,
        duration: 4000
      });
    }
  }

  /**
   * Show network status change
   */
  showNetworkStatusChange(isOnline: boolean): void {
    if (isOnline) {
      this.show({
        type: 'success',
        message: 'Connection restored. Syncing changes...',
        duration: 3000,
        id: 'network-online'
      });
    } else {
      this.show({
        type: 'warning',
        message: 'Connection lost. Working offline.',
        duration: 4000,
        id: 'network-offline'
      });
    }
  }

  /**
   * Show operation progress
   */
  showProgress(operation: string, progress: number): void {
    const percentage = Math.round(progress * 100);
    this.show({
      type: 'loading',
      message: `${operation}: ${percentage}%`,
      id: `progress-${operation}`,
      duration: Infinity
    });

    if (progress >= 1) {
      setTimeout(() => {
        toast.dismiss(`progress-${operation}`);
        this.show({
          type: 'success',
          message: `${operation} completed`,
          duration: 2000
        });
      }, 500);
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (saveStatus: SaveStatus, syncStatus: SyncStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    
    // Immediately call with current status
    callback(this.saveStatus, this.syncStatus);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Get current save status
   */
  getSaveStatus(): SaveStatus {
    return { ...this.saveStatus };
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    toast.dismiss();
  }

  /**
   * Clear specific notification
   */
  clear(id: string): void {
    toast.dismiss(id);
  }

  /**
   * Notify status change subscribers
   */
  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.saveStatus, this.syncStatus);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  /**
   * Retry save operation
   */
  private retrySave(): void {
    // This would be implemented to retry the last save operation
    console.log('Retrying save operation...');
    this.updateSaveStatus({ status: 'saving' });
  }

  /**
   * Retry sync operation
   */
  private retrySync(): void {
    // This would be implemented to retry sync operations
    console.log('Retrying sync operation...');
    this.updateSyncStatus({ status: 'syncing' });
  }
}

export default NotificationService;
import { JournalEntry } from '../types/journal';

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'journalEntry' | 'template' | 'image';
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  userId: string;
}

export interface NetworkStatus {
  isOnline: boolean;
  lastOnlineTime: number;
  connectionType?: string;
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  localVersion: any;
  remoteVersion: any;
  resolvedVersion?: any;
}

class OfflineService {
  private static instance: OfflineService;
  private syncQueue: OfflineOperation[] = [];
  private networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    lastOnlineTime: Date.now()
  };
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private syncInProgress = false;
  private readonly STORAGE_KEYS = {
    SYNC_QUEUE: 'journal_sync_queue',
    OFFLINE_DATA: 'journal_offline_data',
    NETWORK_STATUS: 'journal_network_status'
  };

  private constructor() {
    this.initializeNetworkListeners();
    this.loadPersistedData();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.updateNetworkStatus(true);
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.updateNetworkStatus(false);
    });

    // Check connection quality periodically
    setInterval(() => {
      this.checkConnectionQuality();
    }, 30000);
  }

  private updateNetworkStatus(isOnline: boolean): void {
    this.networkStatus = {
      isOnline,
      lastOnlineTime: isOnline ? Date.now() : this.networkStatus.lastOnlineTime,
      connectionType: this.getConnectionType()
    };

    this.persistNetworkStatus();
    this.notifyListeners();
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private async checkConnectionQuality(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const start = Date.now();
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const latency = Date.now() - start;
      
      if (response.ok && latency < 5000) {
        this.updateNetworkStatus(true);
      }
    } catch (error) {
      this.updateNetworkStatus(false);
    }
  }

  // Local Storage Management
  async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      const offlineData = this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: Date.now(),
        version: this.generateVersion()
      };
      localStorage.setItem(this.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to store offline data:', error);
      throw new Error('Local storage failed');
    }
  }

  async getOfflineData(key?: string): Promise<any> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.OFFLINE_DATA);
      const offlineData = stored ? JSON.parse(stored) : {};
      return key ? (offlineData[key] || null) : offlineData;
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      return key ? null : {};
    }
  }

  async removeOfflineData(key: string): Promise<void> {
    try {
      const offlineData = this.getOfflineData();
      delete offlineData[key];
      localStorage.setItem(this.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to remove offline data:', error);
    }
  }

  // Sync Queue Management
  async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedOperation: OfflineOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncQueue.push(queuedOperation);
    await this.persistSyncQueue();

    // Try immediate sync if online
    if (this.networkStatus.isOnline) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.networkStatus.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const operations = [...this.syncQueue];
      const results = await Promise.allSettled(
        operations.map(op => this.executeOperation(op))
      );

      // Remove successful operations from queue
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.syncQueue = this.syncQueue.filter(op => op.id !== operations[index].id);
        } else {
          // Increment retry count for failed operations
          const failedOp = this.syncQueue.find(op => op.id === operations[index].id);
          if (failedOp) {
            failedOp.retryCount++;
            // Remove operations that have exceeded max retries
            if (failedOp.retryCount > 5) {
              this.syncQueue = this.syncQueue.filter(op => op.id !== failedOp.id);
              console.error('Operation exceeded max retries:', failedOp);
            }
          }
        }
      });

      await this.persistSyncQueue();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, operation.retryCount), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));

    switch (operation.type) {
      case 'create':
        return this.executeCreateOperation(operation);
      case 'update':
        return this.executeUpdateOperation(operation);
      case 'delete':
        return this.executeDeleteOperation(operation);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async executeCreateOperation(operation: OfflineOperation): Promise<void> {
    const response = await fetch(`/api/${operation.entityType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation.data)
    });

    if (!response.ok) {
      throw new Error(`Create operation failed: ${response.statusText}`);
    }
  }

  private async executeUpdateOperation(operation: OfflineOperation): Promise<void> {
    // Check for conflicts before updating
    const conflict = await this.detectConflict(operation);
    if (conflict) {
      const resolution = await this.resolveConflict(conflict);
      operation.data = resolution.resolvedVersion;
    }

    const response = await fetch(`/api/${operation.entityType}/${operation.entityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation.data)
    });

    if (!response.ok) {
      throw new Error(`Update operation failed: ${response.statusText}`);
    }
  }

  private async executeDeleteOperation(operation: OfflineOperation): Promise<void> {
    const response = await fetch(`/api/${operation.entityType}/${operation.entityId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Delete operation failed: ${response.statusText}`);
    }
  }

  // Conflict Resolution
  private async detectConflict(operation: OfflineOperation): Promise<ConflictResolution | null> {
    try {
      const response = await fetch(`/api/${operation.entityType}/${operation.entityId}`);
      if (!response.ok) return null;

      const remoteData = await response.json();
      const localData = operation.data;

      // Simple version-based conflict detection
      if (remoteData.updatedAt > localData.updatedAt) {
        return {
          strategy: 'merge', // Default strategy
          localVersion: localData,
          remoteVersion: remoteData
        };
      }

      return null;
    } catch (error) {
      console.error('Conflict detection failed:', error);
      return null;
    }
  }

  private async resolveConflict(conflict: ConflictResolution): Promise<ConflictResolution> {
    switch (conflict.strategy) {
      case 'local':
        conflict.resolvedVersion = conflict.localVersion;
        break;
      case 'remote':
        conflict.resolvedVersion = conflict.remoteVersion;
        break;
      case 'merge':
        conflict.resolvedVersion = this.mergeVersions(conflict.localVersion, conflict.remoteVersion);
        break;
      case 'manual':
        // This would trigger a UI for manual resolution
        conflict.resolvedVersion = await this.requestManualResolution(conflict);
        break;
    }

    return conflict;
  }

  private mergeVersions(local: any, remote: any): any {
    // Simple merge strategy - prefer local changes for content, remote for metadata
    return {
      ...remote,
      ...local,
      updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0),
      version: this.generateVersion()
    };
  }

  private async requestManualResolution(conflict: ConflictResolution): Promise<any> {
    // This would be implemented with a UI component
    // For now, default to merge strategy
    return this.mergeVersions(conflict.localVersion, conflict.remoteVersion);
  }

  // Network Status
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  onNetworkStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.networkStatus));
  }

  // Persistence
  private async persistSyncQueue(): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  private async persistNetworkStatus(): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEYS.NETWORK_STATUS, JSON.stringify(this.networkStatus));
    } catch (error) {
      console.error('Failed to persist network status:', error);
    }
  }

  private loadPersistedData(): void {
    try {
      // Load sync queue
      const queueData = localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }

      // Load network status
      const statusData = localStorage.getItem(this.STORAGE_KEYS.NETWORK_STATUS);
      if (statusData) {
        const persistedStatus = JSON.parse(statusData);
        this.networkStatus = {
          ...persistedStatus,
          isOnline: navigator.onLine // Always use current online status
        };
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }
  }

  // Utility methods
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersion(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  // Public API for getting sync status
  getSyncQueueLength(): number {
    return this.syncQueue.length;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  async forcSync(): Promise<void> {
    if (this.networkStatus.isOnline) {
      await this.processSyncQueue();
    }
  }

  // Clear all offline data (for testing or reset)
  async clearOfflineData(): Promise<void> {
    this.syncQueue = [];
    localStorage.removeItem(this.STORAGE_KEYS.SYNC_QUEUE);
    localStorage.removeItem(this.STORAGE_KEYS.OFFLINE_DATA);
    localStorage.removeItem(this.STORAGE_KEYS.NETWORK_STATUS);
  }
}

export default OfflineService;
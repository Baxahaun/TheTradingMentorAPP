import { useState, useEffect, useCallback } from 'react';
import OfflineService, { NetworkStatus, OfflineOperation } from '../services/OfflineService';

export interface OfflineState {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnlineTime: number;
  syncQueueLength: number;
  isSyncInProgress: boolean;
  connectionType?: string;
}

export interface OfflineActions {
  forceSync: () => Promise<void>;
  storeOfflineData: (key: string, data: any) => Promise<void>;
  getOfflineData: (key?: string) => Promise<any>;
  queueOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

export function useOffline(): [OfflineState, OfflineActions] {
  const offlineService = OfflineService.getInstance();
  
  const [state, setState] = useState<OfflineState>(() => {
    const networkStatus = offlineService.getNetworkStatus();
    return {
      isOnline: networkStatus.isOnline,
      isConnecting: false,
      lastOnlineTime: networkStatus.lastOnlineTime,
      syncQueueLength: offlineService.getSyncQueueLength(),
      isSyncInProgress: offlineService.isSyncInProgress(),
      connectionType: networkStatus.connectionType
    };
  });

  useEffect(() => {
    const unsubscribe = offlineService.onNetworkStatusChange((networkStatus: NetworkStatus) => {
      setState(prevState => ({
        ...prevState,
        isOnline: networkStatus.isOnline,
        lastOnlineTime: networkStatus.lastOnlineTime,
        connectionType: networkStatus.connectionType,
        isConnecting: false
      }));
    });

    // Update sync queue length periodically
    const syncInterval = setInterval(() => {
      setState(prevState => ({
        ...prevState,
        syncQueueLength: offlineService.getSyncQueueLength(),
        isSyncInProgress: offlineService.isSyncInProgress()
      }));
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, [offlineService]);

  const actions: OfflineActions = {
    forceSync: useCallback(async () => {
      setState(prev => ({ ...prev, isConnecting: true }));
      try {
        await offlineService.forcSync();
      } finally {
        setState(prev => ({ ...prev, isConnecting: false }));
      }
    }, [offlineService]),

    storeOfflineData: useCallback(async (key: string, data: any) => {
      await offlineService.storeOfflineData(key, data);
    }, [offlineService]),

    getOfflineData: useCallback(async (key?: string) => {
      return await offlineService.getOfflineData(key);
    }, [offlineService]),

    queueOperation: useCallback(async (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => {
      await offlineService.queueOperation(operation);
      setState(prev => ({
        ...prev,
        syncQueueLength: offlineService.getSyncQueueLength()
      }));
    }, [offlineService]),

    clearOfflineData: useCallback(async () => {
      await offlineService.clearOfflineData();
      setState(prev => ({
        ...prev,
        syncQueueLength: 0,
        isSyncInProgress: false
      }));
    }, [offlineService])
  };

  return [state, actions];
}

export default useOffline;
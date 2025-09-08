import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  className = ''
}) => {
  const [offlineState, offlineActions] = useOffline();

  const getStatusIcon = () => {
    if (offlineState.isConnecting) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    if (!offlineState.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    if (offlineState.syncQueueLength > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }

    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (offlineState.isConnecting) {
      return 'Connecting...';
    }
    
    if (!offlineState.isOnline) {
      return 'Offline';
    }

    if (offlineState.isSyncInProgress) {
      return 'Syncing...';
    }

    if (offlineState.syncQueueLength > 0) {
      return `${offlineState.syncQueueLength} pending`;
    }

    return 'Online';
  };

  const getStatusColor = () => {
    if (offlineState.isConnecting) return 'text-blue-600';
    if (!offlineState.isOnline) return 'text-red-600';
    if (offlineState.syncQueueLength > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatLastOnlineTime = () => {
    if (offlineState.isOnline) return 'Now';
    
    const timeDiff = Date.now() - offlineState.lastOnlineTime;
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleRetrySync = async () => {
    if (offlineState.isOnline && !offlineState.isSyncInProgress) {
      await offlineActions.forceSync();
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {offlineState.syncQueueLength > 0 && offlineState.isOnline && (
          <button
            onClick={handleRetrySync}
            disabled={offlineState.isSyncInProgress}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {offlineState.isSyncInProgress ? 'Syncing...' : 'Retry Sync'}
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Connection:</span>
          <span className={offlineState.isOnline ? 'text-green-600' : 'text-red-600'}>
            {offlineState.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {offlineState.connectionType && (
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="capitalize">{offlineState.connectionType}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Last Online:</span>
          <span>{formatLastOnlineTime()}</span>
        </div>

        {offlineState.syncQueueLength > 0 && (
          <div className="flex justify-between">
            <span>Pending Sync:</span>
            <span className="text-yellow-600">
              {offlineState.syncQueueLength} operations
            </span>
          </div>
        )}

        {offlineState.isSyncInProgress && (
          <div className="flex items-center space-x-2 text-blue-600">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Synchronizing data...</span>
          </div>
        )}
      </div>

      {!offlineState.isOnline && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Working Offline</p>
              <p>Your changes are being saved locally and will sync when you're back online.</p>
            </div>
          </div>
        </div>
      )}

      {offlineState.isOnline && offlineState.syncQueueLength === 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              All data synchronized
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
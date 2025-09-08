import React from 'react';
import { CheckCircle, AlertCircle, Loader2, WifiOff, Clock } from 'lucide-react';
import { SaveStatus, SyncStatus } from '../../services/NotificationService';

interface StatusIndicatorProps {
  saveStatus: SaveStatus;
  syncStatus: SyncStatus;
  className?: string;
  showDetails?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  saveStatus,
  syncStatus,
  className = '',
  showDetails = false
}) => {
  const getSaveStatusIcon = () => {
    switch (saveStatus.status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus.status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return saveStatus.lastSaved 
          ? `Saved ${saveStatus.lastSaved.toLocaleTimeString()}`
          : 'Saved';
      case 'error':
        return 'Save failed';
      case 'offline':
        return 'Saved offline';
      default:
        return 'Not saved';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return syncStatus.pendingOperations > 0 
          ? `Syncing ${syncStatus.pendingOperations} changes...`
          : 'Syncing...';
      case 'synced':
        return syncStatus.lastSync 
          ? `Synced ${syncStatus.lastSync.toLocaleTimeString()}`
          : 'Synced';
      case 'error':
        return 'Sync failed';
      case 'offline':
        return 'Offline mode';
      default:
        return 'Not synced';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saving':
      case 'syncing':
        return 'text-blue-600';
      case 'saved':
      case 'synced':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'offline':
        return 'text-yellow-600';
      default:
        return 'text-gray-500';
    }
  };

  if (!showDetails) {
    // Compact view - show only the most relevant status
    const primaryStatus = saveStatus.status !== 'saved' ? saveStatus : syncStatus;
    const primaryIcon = saveStatus.status !== 'saved' ? getSaveStatusIcon() : getSyncStatusIcon();
    
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {primaryIcon}
        <span className={`text-sm ${getStatusColor(primaryStatus.status)}`}>
          {saveStatus.status !== 'saved' ? getSaveStatusText() : getSyncStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Save Status */}
      <div className="flex items-center space-x-2">
        {getSaveStatusIcon()}
        <span className={`text-sm ${getStatusColor(saveStatus.status)}`}>
          {getSaveStatusText()}
        </span>
        {saveStatus.pendingChanges && (
          <span className="text-xs text-gray-500">(unsaved changes)</span>
        )}
      </div>

      {/* Sync Status */}
      <div className="flex items-center space-x-2">
        {getSyncStatusIcon()}
        <span className={`text-sm ${getStatusColor(syncStatus.status)}`}>
          {getSyncStatusText()}
        </span>
        {syncStatus.pendingOperations > 0 && (
          <span className="text-xs text-gray-500">
            ({syncStatus.pendingOperations} pending)
          </span>
        )}
      </div>

      {/* Error Details */}
      {(saveStatus.status === 'error' || syncStatus.status === 'error') && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {saveStatus.error || syncStatus.error}
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;
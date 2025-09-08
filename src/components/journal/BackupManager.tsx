/**
 * Backup Manager Component
 * 
 * Provides interface for managing journal backups, including:
 * - Creating manual backups
 * - Viewing backup history
 * - Restoring from backups
 * - Configuring automated backup settings
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Clock, 
  Shield, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Trash2,
  Eye,
  Calendar
} from 'lucide-react';
import { JournalExportService, BackupResult, BackupVersion, BackupOptions } from '../../services/JournalExportService';
import { JournalEntry, JournalTemplate, JournalPreferences } from '../../types/journal';

interface BackupManagerProps {
  userId: string;
  entries: JournalEntry[];
  templates: JournalTemplate[];
  preferences: JournalPreferences;
  onBackupCreated?: (backup: BackupResult) => void;
  onBackupRestored?: (restoredCount: number) => void;
}

interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeImages: boolean;
  compression: boolean;
  encryption: boolean;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  userId,
  entries,
  templates,
  preferences,
  onBackupCreated,
  onBackupRestored
}) => {
  const [exportService] = useState(() => new JournalExportService());
  const [backupHistory, setBackupHistory] = useState<BackupVersion[]>([]);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackupEnabled: true,
    backupFrequency: 'weekly',
    retentionDays: 90,
    includeImages: true,
    compression: true,
    encryption: true
  });
  
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupVersion | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadBackupHistory();
  }, [userId]);

  const loadBackupHistory = async () => {
    try {
      // In a real implementation, this would fetch from the backend
      const mockHistory: BackupVersion[] = [
        {
          id: 'backup_1',
          version: 3,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          size: 2048576,
          checksum: 'abc123',
          description: 'Weekly automated backup',
          isAutomatic: true
        },
        {
          id: 'backup_2',
          version: 2,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          size: 1945600,
          checksum: 'def456',
          description: 'Manual backup before data migration',
          isAutomatic: false
        }
      ];
      setBackupHistory(mockHistory);
    } catch (error) {
      showNotification('error', 'Failed to load backup history');
    }
  };

  const createBackup = async (options?: Partial<BackupOptions>) => {
    setIsCreatingBackup(true);
    try {
      const backupOptions: BackupOptions = {
        includeImages: backupSettings.includeImages,
        compression: backupSettings.compression,
        encryption: backupSettings.encryption,
        retentionDays: backupSettings.retentionDays,
        ...options
      };

      const result = await exportService.createBackup(
        userId,
        entries,
        templates,
        preferences,
        backupOptions
      );

      if (result.success) {
        showNotification('success', `Backup created successfully (${formatFileSize(result.size)})`);
        onBackupCreated?.(result);
        await loadBackupHistory();
      } else {
        showNotification('error', result.error || 'Failed to create backup');
      }
    } catch (error) {
      showNotification('error', 'An error occurred while creating backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (backup: BackupVersion) => {
    if (!confirm(`Are you sure you want to restore from backup version ${backup.version}? This will overwrite existing data.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const result = await exportService.restoreFromBackup(userId, {
        backupId: backup.id,
        version: backup.version,
        overwriteExisting: true
      });

      if (result.success) {
        showNotification('success', `Successfully restored ${result.restoredEntries} journal entries`);
        onBackupRestored?.(result.restoredEntries);
      } else {
        showNotification('error', result.error || 'Failed to restore backup');
      }
    } catch (error) {
      showNotification('error', 'An error occurred while restoring backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = async (backup: BackupVersion) => {
    if (!confirm(`Are you sure you want to delete backup version ${backup.version}? This action cannot be undone.`)) {
      return;
    }

    try {
      // In a real implementation, this would call the backend
      showNotification('success', 'Backup deleted successfully');
      await loadBackupHistory();
    } catch (error) {
      showNotification('error', 'Failed to delete backup');
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Backup Manager</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Backup Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={() => createBackup()}
            disabled={isCreatingBackup}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>{isCreatingBackup ? 'Creating...' : 'Create Backup'}</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Backup Settings */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={backupSettings.autoBackupEnabled}
                  onChange={(e) => setBackupSettings(prev => ({
                    ...prev,
                    autoBackupEnabled: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Automatic Backups</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backup Frequency
              </label>
              <select
                value={backupSettings.backupFrequency}
                onChange={(e) => setBackupSettings(prev => ({
                  ...prev,
                  backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retention Period (days)
              </label>
              <input
                type="number"
                value={backupSettings.retentionDays}
                onChange={(e) => setBackupSettings(prev => ({
                  ...prev,
                  retentionDays: parseInt(e.target.value) || 90
                }))}
                min="7"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={backupSettings.includeImages}
                  onChange={(e) => setBackupSettings(prev => ({
                    ...prev,
                    includeImages: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include Images</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={backupSettings.compression}
                  onChange={(e) => setBackupSettings(prev => ({
                    ...prev,
                    compression: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable Compression</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={backupSettings.encryption}
                  onChange={(e) => setBackupSettings(prev => ({
                    ...prev,
                    encryption: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable Encryption</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Backup Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Last Backup</span>
          </div>
          <p className="text-lg font-semibold text-blue-900 mt-1">
            {backupHistory.length > 0 ? formatDate(backupHistory[0]!.createdAt) : 'Never'}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Total Backups</span>
          </div>
          <p className="text-lg font-semibold text-green-900 mt-1">
            {backupHistory.length}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Total Size</span>
          </div>
          <p className="text-lg font-semibold text-purple-900 mt-1">
            {formatFileSize(backupHistory.reduce((sum, backup) => sum + backup.size, 0))}
          </p>
        </div>
      </div>

      {/* Backup History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backup History</h3>
        
        {backupHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No backups found</p>
            <p className="text-sm">Create your first backup to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backupHistory.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    backup.isAutomatic ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        Version {backup.version}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        backup.isAutomatic 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.isAutomatic ? 'Automatic' : 'Manual'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{backup.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>{formatDate(backup.createdAt)}</span>
                      <span>{formatFileSize(backup.size)}</span>
                      <span>Checksum: {backup.checksum.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedBackup(backup)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => restoreBackup(backup)}
                    disabled={isRestoring}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Restore</span>
                  </button>
                  
                  <button
                    onClick={() => deleteBackup(backup)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Backup"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup Details Modal */}
      {selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Backup Details - Version {selectedBackup.version}
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Created:</span>
                <p className="text-sm text-gray-600">{formatDate(selectedBackup.createdAt)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Size:</span>
                <p className="text-sm text-gray-600">{formatFileSize(selectedBackup.size)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <p className="text-sm text-gray-600">
                  {selectedBackup.isAutomatic ? 'Automatic' : 'Manual'}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Checksum:</span>
                <p className="text-sm text-gray-600 font-mono">{selectedBackup.checksum}</p>
              </div>
              
              {selectedBackup.description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-sm text-gray-600">{selectedBackup.description}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedBackup(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  restoreBackup(selectedBackup);
                  setSelectedBackup(null);
                }}
                disabled={isRestoring}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Restore This Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;
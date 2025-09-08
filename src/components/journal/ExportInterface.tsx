/**
 * Export Interface Component
 * 
 * Provides a comprehensive interface for exporting journal entries in multiple formats
 * with customizable options for privacy, content selection, and sharing.
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Database, 
  Table, 
  Share2, 
  Settings, 
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  JournalExportService, 
  JournalExportOptions, 
  ExportResult, 
  SharingOptions,
  ExportTemplate 
} from '../../services/JournalExportService';
import { JournalEntry } from '../../types/journal';
import { Trade } from '../../types/trade';

interface ExportInterfaceProps {
  userId: string;
  entries: JournalEntry[];
  trades: Trade[];
  onExportComplete?: (result: ExportResult) => void;
  onSharingComplete?: (shareUrl: string) => void;
}

interface ExportFormData {
  format: 'pdf' | 'json' | 'csv';
  dateRange: {
    start: string;
    end: string;
  } | null;
  includeImages: boolean;
  includeEmotionalData: boolean;
  includeProcessMetrics: boolean;
  includeTrades: boolean;
  anonymize: boolean;
  password: string;
  compression: boolean;
}

interface SharingFormData {
  recipientEmail: string;
  recipientName: string;
  accessLevel: 'read' | 'comment';
  expirationDate: string;
  includeEmotionalData: boolean;
  includeProcessMetrics: boolean;
  customMessage: string;
}

export const ExportInterface: React.FC<ExportInterfaceProps> = ({
  userId,
  entries,
  trades,
  onExportComplete,
  onSharingComplete
}) => {
  const [exportService] = useState(() => new JournalExportService());
  const [activeTab, setActiveTab] = useState<'export' | 'share'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const [exportForm, setExportForm] = useState<ExportFormData>({
    format: 'pdf',
    dateRange: null,
    includeImages: true,
    includeEmotionalData: true,
    includeProcessMetrics: true,
    includeTrades: true,
    anonymize: false,
    password: '',
    compression: false
  });

  const [sharingForm, setSharingForm] = useState<SharingFormData>({
    recipientEmail: '',
    recipientName: '',
    accessLevel: 'read',
    expirationDate: '',
    includeEmotionalData: false,
    includeProcessMetrics: true,
    customMessage: ''
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    // Set default date range to last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setExportForm(prev => ({
      ...prev,
      dateRange: { start: startDate, end: endDate }
    }));

    // Set default expiration to 30 days from now
    const defaultExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setSharingForm(prev => ({
      ...prev,
      expirationDate: defaultExpiration
    }));
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: JournalExportOptions = {
        format: exportForm.format,
        dateRange: exportForm.dateRange || undefined,
        includeImages: exportForm.includeImages,
        includeEmotionalData: exportForm.includeEmotionalData,
        includeProcessMetrics: exportForm.includeProcessMetrics,
        includeTrades: exportForm.includeTrades,
        anonymize: exportForm.anonymize,
        password: exportForm.password || undefined,
        compression: exportForm.compression
      };

      let result: ExportResult;

      switch (exportForm.format) {
        case 'pdf':
          result = await exportService.exportToPDF(userId, entries, trades, options);
          break;
        case 'json':
          result = await exportService.exportToJSON(userId, entries, options);
          break;
        case 'csv':
          result = await exportService.exportToCSV(userId, entries, options);
          break;
        default:
          throw new Error('Invalid export format');
      }

      if (result.success && result.data) {
        // Download the file
        const blob = result.data instanceof Blob ? result.data : new Blob([result.data]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('success', `Export completed successfully (${formatFileSize(result.size || 0)})`);
        onExportComplete?.(result);
      } else {
        showNotification('error', result.error || 'Export failed');
      }
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!sharingForm.recipientEmail) {
      showNotification('error', 'Recipient email is required');
      return;
    }

    setIsSharing(true);
    try {
      const options: SharingOptions = {
        recipientEmail: sharingForm.recipientEmail,
        recipientName: sharingForm.recipientName || undefined,
        accessLevel: sharingForm.accessLevel,
        expirationDate: sharingForm.expirationDate || undefined,
        includeEmotionalData: sharingForm.includeEmotionalData,
        includeProcessMetrics: sharingForm.includeProcessMetrics,
        customMessage: sharingForm.customMessage || undefined
      };

      const result = await exportService.createShareableExport(userId, entries, options);

      if (result.success && result.shareUrl) {
        showNotification('success', 'Shareable link created successfully');
        onSharingComplete?.(result.shareUrl);
        
        // Copy to clipboard
        await navigator.clipboard.writeText(result.shareUrl);
        showNotification('info', 'Share URL copied to clipboard');
      } else {
        showNotification('error', result.error || 'Sharing failed');
      }
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Sharing failed');
    } finally {
      setIsSharing(false);
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

  const getFilteredEntries = () => {
    if (!exportForm.dateRange) return entries;
    
    return entries.filter(entry => {
      return entry.date >= exportForm.dateRange!.start && entry.date <= exportForm.dateRange!.end;
    });
  };

  const filteredEntries = getFilteredEntries();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Download className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Export & Share</h2>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'share'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Share
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-current hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'pdf', label: 'PDF Document', icon: FileText, description: 'Formatted document with charts' },
                { value: 'json', label: 'JSON Data', icon: Database, description: 'Complete data structure' },
                { value: 'csv', label: 'CSV Spreadsheet', icon: Table, description: 'Tabular data for analysis' }
              ].map((format) => (
                <button
                  key={format.value}
                  onClick={() => setExportForm(prev => ({ ...prev, format: format.value as any }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    exportForm.format === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <format.icon className={`h-5 w-5 ${
                      exportForm.format === format.value ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <span className={`font-medium ${
                      exportForm.format === format.value ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {format.label}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    exportForm.format === format.value ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {format.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Range
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportForm.dateRange !== null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const endDate = new Date().toISOString().split('T')[0];
                      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setExportForm(prev => ({ ...prev, dateRange: { start: startDate, end: endDate } }));
                    } else {
                      setExportForm(prev => ({ ...prev, dateRange: null }));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Limit to date range</span>
              </div>
              
              {exportForm.dateRange && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={exportForm.dateRange.start}
                    onChange={(e) => setExportForm(prev => ({
                      ...prev,
                      dateRange: prev.dateRange ? { ...prev.dateRange, start: e.target.value } : null
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={exportForm.dateRange.end}
                    onChange={(e) => setExportForm(prev => ({
                      ...prev,
                      dateRange: prev.dateRange ? { ...prev.dateRange, end: e.target.value } : null
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {exportForm.dateRange 
                ? `${filteredEntries.length} entries in selected range`
                : `${entries.length} total entries`
              }
            </div>
          </div>

          {/* Content Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Content to Include
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'includeImages', label: 'Images & Screenshots', description: 'Chart screenshots and annotations' },
                { key: 'includeEmotionalData', label: 'Emotional Tracking', description: 'Mood and confidence data' },
                { key: 'includeProcessMetrics', label: 'Process Metrics', description: 'Discipline and performance scores' },
                { key: 'includeTrades', label: 'Trade References', description: 'Linked trade data and analysis' }
              ].map((option) => (
                <label key={option.key} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={exportForm[option.key as keyof ExportFormData] as boolean}
                    onChange={(e) => setExportForm(prev => ({
                      ...prev,
                      [option.key]: e.target.checked
                    }))}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Settings className="h-4 w-4" />
              <span>Advanced Options</span>
            </button>
            
            {showAdvancedOptions && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportForm.anonymize}
                    onChange={(e) => setExportForm(prev => ({ ...prev, anonymize: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Anonymize Data</div>
                    <div className="text-sm text-gray-600">Remove personal identifiers and sensitive information</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportForm.compression}
                    onChange={(e) => setExportForm(prev => ({ ...prev, compression: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Enable Compression</div>
                    <div className="text-sm text-gray-600">Reduce file size (JSON format only)</div>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Protection (Optional)
                  </label>
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      value={exportForm.password}
                      onChange={(e) => setExportForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password to encrypt export"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting || filteredEntries.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : `Export ${exportForm.format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Share Tab */}
      {activeTab === 'share' && (
        <div className="space-y-6">
          {/* Recipient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email *
              </label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={sharingForm.recipientEmail}
                  onChange={(e) => setSharingForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="mentor@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name (Optional)
              </label>
              <input
                type="text"
                value={sharingForm.recipientName}
                onChange={(e) => setSharingForm(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Access Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'read', label: 'Read Only', description: 'Can view but not comment', icon: Eye },
                { value: 'comment', label: 'Read & Comment', description: 'Can view and add feedback', icon: Share2 }
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSharingForm(prev => ({ ...prev, accessLevel: level.value as any }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    sharingForm.accessLevel === level.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <level.icon className={`h-5 w-5 ${
                      sharingForm.accessLevel === level.value ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <span className={`font-medium ${
                      sharingForm.accessLevel === level.value ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {level.label}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    sharingForm.accessLevel === level.value ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {level.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Expiration
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={sharingForm.expirationDate}
                onChange={(e) => setSharingForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-600">Leave empty for no expiration</span>
            </div>
          </div>

          {/* Privacy Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Privacy Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={sharingForm.includeEmotionalData}
                  onChange={(e) => setSharingForm(prev => ({ ...prev, includeEmotionalData: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Include Emotional Data</div>
                  <div className="text-sm text-gray-600">Share mood tracking and emotional insights</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={sharingForm.includeProcessMetrics}
                  onChange={(e) => setSharingForm(prev => ({ ...prev, includeProcessMetrics: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Include Process Metrics</div>
                  <div className="text-sm text-gray-600">Share discipline scores and performance metrics</div>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={sharingForm.customMessage}
              onChange={(e) => setSharingForm(prev => ({ ...prev, customMessage: e.target.value }))}
              placeholder="Add a personal message to include with the shared journal..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Share Button */}
          <div className="flex justify-end">
            <button
              onClick={handleShare}
              disabled={isSharing || !sharingForm.recipientEmail || filteredEntries.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>{isSharing ? 'Creating Share Link...' : 'Create Share Link'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportInterface; 
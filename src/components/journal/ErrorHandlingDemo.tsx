import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Save, Upload, Wifi, WifiOff } from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';
import StatusIndicator from '../common/StatusIndicator';
import ValidationFeedback, { ValidationSummary } from '../common/ValidationFeedback';
import useErrorHandling from '../../hooks/useErrorHandling';
import { JournalEntry } from '../../types/journal';

interface ErrorHandlingDemoProps {
  className?: string;
}

const ErrorHandlingDemo: React.FC<ErrorHandlingDemoProps> = ({ className = '' }) => {
  const [journalEntry, setJournalEntry] = useState<Partial<JournalEntry>>({
    date: '',
    preMarketNotes: '',
    tradingNotes: '',
    postMarketReflection: ''
  });

  const [validationResult, setValidationResult] = useState<any>(null);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  const {
    executeWithErrorHandling,
    validateWithFeedback,
    saveStatus,
    syncStatus,
    isLoading,
    error,
    updateSaveStatus,
    updateSyncStatus,
    showAutoSaveNotification,
    showProgress,
    clearError,
    retryFailedOperations,
    getRetryQueueStatus
  } = useErrorHandling({
    component: 'ErrorHandlingDemo',
    userId: 'demo-user',
    autoRetry: true,
    retryConfig: { maxRetries: 3, baseDelay: 1000 }
  });

  // Simulate save operation
  const handleSave = async () => {
    const result = await executeWithErrorHandling(
      async () => {
        updateSaveStatus({ status: 'saving' });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (simulateError) {
          throw new Error('Simulated save error - network timeout');
        }
        
        if (simulateOffline) {
          updateSaveStatus({ status: 'offline' });
          return 'saved_offline';
        }
        
        return 'saved_successfully';
      },
      'save_journal'
    );

    if (result === 'saved_successfully') {
      updateSaveStatus({ 
        status: 'saved', 
        lastSaved: new Date(),
        pendingChanges: false 
      });
      showAutoSaveNotification(true);
    } else if (result === 'saved_offline') {
      showAutoSaveNotification(false, 'Saved offline - will sync when online');
    }
  };

  // Simulate sync operation
  const handleSync = async () => {
    const result = await executeWithErrorHandling(
      async () => {
        updateSyncStatus({ status: 'syncing', pendingOperations: 3 });
        
        // Simulate progress
        for (let i = 1; i <= 3; i++) {
          showProgress('Syncing changes', i / 3);
          await new Promise(resolve => setTimeout(resolve, 800));
          
          if (simulateError && i === 2) {
            throw new Error('Sync failed - server unavailable');
          }
        }
        
        return 'synced';
      },
      'sync_data'
    );

    if (result === 'synced') {
      updateSyncStatus({ 
        status: 'synced', 
        lastSync: new Date(),
        pendingOperations: 0 
      });
    }
  };

  // Simulate upload operation
  const handleUpload = async () => {
    await executeWithErrorHandling(
      async () => {
        for (let i = 0; i <= 100; i += 10) {
          showProgress('Uploading images', i / 100);
          await new Promise(resolve => setTimeout(resolve, 200));
          
          if (simulateError && i === 50) {
            throw new Error('Upload failed - file too large');
          }
        }
        
        return 'uploaded';
      },
      'upload_image'
    );
  };

  // Validate journal entry
  const handleValidate = () => {
    const result = validateWithFeedback(journalEntry, 'journalEntry');
    setValidationResult(result);
  };

  // Simulate network status change
  const toggleNetworkStatus = () => {
    setSimulateOffline(!simulateOffline);
    if (!simulateOffline) {
      updateSyncStatus({ status: 'offline' });
    } else {
      updateSyncStatus({ status: 'synced' });
      // Retry any queued operations
      retryFailedOperations();
    }
  };

  // Component that throws an error for ErrorBoundary testing
  const ErrorThrowingComponent = () => {
    if (simulateError) {
      throw new Error('Simulated component error for ErrorBoundary testing');
    }
    return <div className="text-green-600">Component loaded successfully</div>;
  };

  const retryQueueStatus = getRetryQueueStatus();

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Error Handling & User Feedback Demo
        </h2>

        {/* Status Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">System Status</h3>
          <StatusIndicator 
            saveStatus={saveStatus}
            syncStatus={syncStatus}
            showDetails={true}
            className="mb-4"
          />
          
          {retryQueueStatus.count > 0 && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">
                {retryQueueStatus.count} operations queued for retry
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Demo Controls</h3>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={simulateOffline}
                onChange={toggleNetworkStatus}
                className="rounded"
              />
              <span className="text-sm">Simulate Offline Mode</span>
              {simulateOffline ? (
                <WifiOff className="w-4 h-4 text-red-500" />
              ) : (
                <Wifi className="w-4 h-4 text-green-500" />
              )}
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={simulateError}
                onChange={(e) => setSimulateError(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Simulate Errors</span>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </label>
          </div>
        </div>

        {/* Journal Entry Form */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Journal Entry</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={journalEntry.date || ''}
                onChange={(e) => setJournalEntry(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pre-Market Notes
              </label>
              <textarea
                value={journalEntry.preMarketNotes || ''}
                onChange={(e) => setJournalEntry(prev => ({ ...prev, preMarketNotes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter your pre-market analysis..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trading Notes
              </label>
              <textarea
                value={journalEntry.tradingNotes || ''}
                onChange={(e) => setJournalEntry(prev => ({ ...prev, tradingNotes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Document your trades and decisions..."
              />
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Validation Results</h3>
            <ValidationSummary
              errorCount={validationResult.errors?.length || 0}
              warningCount={validationResult.warnings?.length || 0}
              suggestionCount={validationResult.suggestions?.length || 0}
              className="mb-3"
            />
            <ValidationFeedback
              errors={validationResult.errors}
              warnings={validationResult.warnings}
              suggestions={validationResult.suggestions}
              showSuggestions={true}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Journal</span>
          </button>
          
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Data</span>
          </button>
          
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Images</span>
          </button>
          
          <button
            onClick={handleValidate}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Validate Entry</span>
          </button>
          
          {retryQueueStatus.count > 0 && (
            <button
              onClick={retryFailedOperations}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Failed Operations</span>
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">Error Occurred</h4>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
                <button
                  onClick={clearError}
                  className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ErrorBoundary Test */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Error Boundary Test</h3>
          <p className="text-sm text-gray-600 mb-3">
            Enable "Simulate Errors" above and this component will throw an error to test the ErrorBoundary.
          </p>
          <ErrorBoundary>
            <ErrorThrowingComponent />
          </ErrorBoundary>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

export default ErrorHandlingDemo;
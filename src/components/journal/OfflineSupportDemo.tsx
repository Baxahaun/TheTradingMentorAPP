import React, { useState } from 'react';
import { NetworkStatusIndicator } from '../common/NetworkStatusIndicator';
import { useOffline } from '../../hooks/useOffline';
import { JournalDataService } from '../../services/JournalDataService';

/**
 * Demo component showcasing offline support functionality
 * This component demonstrates how the offline system works in practice
 */
export const OfflineSupportDemo: React.FC = () => {
  const [offlineState, offlineActions] = useOffline();
  const [demoData, setDemoData] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  
  const journalService = React.useMemo(() => new JournalDataService(), []);

  const handleCreateOfflineEntry = async () => {
    try {
      setStatus('Creating journal entry...');
      
      // This will work both online and offline
      const entry = await journalService.createJournalEntry('demo-user', '2024-01-01');
      setDemoData(entry);
      setStatus('Journal entry created successfully!');
      
      if (!offlineState.isOnline) {
        setStatus('Journal entry created offline - will sync when online');
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateOfflineEntry = async () => {
    if (!demoData) {
      setStatus('Please create an entry first');
      return;
    }

    try {
      setStatus('Updating journal entry...');
      
      await journalService.updateJournalEntry('demo-user', demoData.id, {
        sections: [
          {
            id: 'demo-section',
            type: 'text',
            title: 'Demo Notes',
            content: `Updated at ${new Date().toLocaleTimeString()} - ${offlineState.isOnline ? 'Online' : 'Offline'}`,
            order: 1,
            isRequired: false,
            isComplete: true
          }
        ]
      });
      
      setStatus('Journal entry updated successfully!');
      
      if (!offlineState.isOnline) {
        setStatus('Journal entry updated offline - will sync when online');
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStoreOfflineData = async () => {
    try {
      setStatus('Storing data offline...');
      
      const testData = {
        timestamp: Date.now(),
        message: 'This is test offline data',
        connectionStatus: offlineState.isOnline ? 'online' : 'offline'
      };
      
      await offlineActions.storeOfflineData('demo-data', testData);
      setStatus('Data stored offline successfully!');
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRetrieveOfflineData = async () => {
    try {
      setStatus('Retrieving offline data...');
      
      const data = await offlineActions.getOfflineData('demo-data');
      
      if (data) {
        setStatus(`Retrieved: ${JSON.stringify(data.data, null, 2)}`);
      } else {
        setStatus('No offline data found');
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleForceSync = async () => {
    try {
      setStatus('Forcing synchronization...');
      await offlineActions.forceSync();
      setStatus('Synchronization completed!');
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClearOfflineData = async () => {
    try {
      setStatus('Clearing offline data...');
      await offlineActions.clearOfflineData();
      setDemoData(null);
      setStatus('Offline data cleared!');
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const simulateOffline = () => {
    // This is just for demo - in real app, network status is detected automatically
    setStatus('Network status is automatically detected. Try disconnecting your internet to test offline mode.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">Offline Support Demo</h2>
        <p className="text-gray-600 mb-6">
          This demo shows how the journal system works seamlessly both online and offline.
          Try the actions below to see how data is handled in different connection states.
        </p>

        {/* Network Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Network Status</h3>
          <NetworkStatusIndicator showDetails={true} />
        </div>

        {/* Connection Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700">Connection</h4>
            <p className={`text-lg font-semibold ${offlineState.isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {offlineState.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700">Sync Queue</h4>
            <p className="text-lg font-semibold text-blue-600">
              {offlineState.syncQueueLength} operations
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700">Sync Status</h4>
            <p className={`text-lg font-semibold ${offlineState.isSyncInProgress ? 'text-blue-600' : 'text-gray-600'}`}>
              {offlineState.isSyncInProgress ? 'Syncing...' : 'Idle'}
            </p>
          </div>
        </div>

        {/* Demo Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Demo Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Journal Operations</h4>
              
              <button
                onClick={handleCreateOfflineEntry}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Create Journal Entry
              </button>
              
              <button
                onClick={handleUpdateOfflineEntry}
                disabled={!demoData}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Update Journal Entry
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Offline Data</h4>
              
              <button
                onClick={handleStoreOfflineData}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                Store Offline Data
              </button>
              
              <button
                onClick={handleRetrieveOfflineData}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
              >
                Retrieve Offline Data
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <button
              onClick={handleForceSync}
              disabled={!offlineState.isOnline || offlineState.isSyncInProgress}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Force Sync
            </button>
            
            <button
              onClick={simulateOffline}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Test Offline Mode
            </button>
            
            <button
              onClick={handleClearOfflineData}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Clear Offline Data
            </button>
          </div>
        </div>

        {/* Status Display */}
        {status && (
          <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Status</h4>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">{status}</pre>
          </div>
        )}

        {/* Demo Data Display */}
        {demoData && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">Created Journal Entry</h4>
            <pre className="text-sm text-blue-600 whitespace-pre-wrap">
              {JSON.stringify(demoData, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-700 mb-2">How to Test Offline Mode</h4>
          <ol className="text-sm text-yellow-600 space-y-1 list-decimal list-inside">
            <li>Try the actions above while online to see normal operation</li>
            <li>Disconnect your internet connection</li>
            <li>Notice the network status indicator changes to "Offline"</li>
            <li>Try creating/updating journal entries - they'll be stored locally</li>
            <li>Check the sync queue to see pending operations</li>
            <li>Reconnect to the internet</li>
            <li>Watch as the sync queue processes and data synchronizes</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default OfflineSupportDemo;
/**
 * Migration Dialog Component
 * UI component for managing data migration process
 */

import React, { useState, useEffect } from 'react';
import { useMigration, useMigrationFeatureFlags } from '../../hooks/useMigration';

interface MigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete?: () => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  isOpen,
  onClose,
  onMigrationComplete
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [migrationState, migrationActions] = useMigration({
    onMigrationComplete: (result) => {
      console.log('Migration completed:', result);
      onMigrationComplete?.();
    },
    onMigrationError: (error) => {
      console.error('Migration error:', error);
    },
    onRollbackComplete: () => {
      console.log('Rollback completed');
    }
  });

  const featureFlags = useMigrationFeatureFlags();

  useEffect(() => {
    if (isOpen) {
      migrationActions.checkMigrationNeeded();
    }
  }, [isOpen, migrationActions]);

  if (!isOpen) return null;

  const handleStartMigration = () => {
    migrationActions.startMigration();
  };

  const handleRollback = () => {
    if (window.confirm('Are you sure you want to rollback the migration? This will restore your data to the previous format.')) {
      migrationActions.rollbackMigration();
    }
  };

  const handleClose = () => {
    if (migrationState.isInProgress) {
      if (window.confirm('Migration is in progress. Are you sure you want to close this dialog?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getProgressPercentage = () => {
    return migrationState.progress?.overallProgress || 0;
  };

  const getCurrentStep = () => {
    return migrationState.progress?.currentStep || '';
  };

  const getStepDescription = (stepId: string) => {
    const stepDescriptions: Record<string, string> = {
      backup_existing_data: 'Creating backup of existing trade data...',
      validate_source_data: 'Validating existing trade data...',
      migrate_trade_structure: 'Converting trades to enhanced format...',
      validate_migrated_data: 'Validating migrated data...',
      update_feature_flags: 'Enabling enhanced features...',
      cleanup_legacy_data: 'Cleaning up legacy data...'
    };
    return stepDescriptions[stepId] || stepId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Trade Data Migration
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={migrationState.isInProgress}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Migration Status */}
          {migrationState.isNeeded && !migrationState.isInProgress && !migrationState.isCompleted && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Migration Required
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Your trade data needs to be migrated to the new enhanced format to access advanced features like comprehensive notes, chart management, and performance analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Migration Progress */}
          {migrationState.isInProgress && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-3">
                  Migration in Progress
                </h3>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-blue-700 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>

                {/* Current Step */}
                <p className="text-sm text-blue-700">
                  {getStepDescription(getCurrentStep())}
                </p>
              </div>
            </div>
          )}

          {/* Migration Success */}
          {migrationState.isCompleted && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Migration Completed Successfully
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Your trade data has been successfully migrated to the enhanced format. You can now access all the new features.
                    </p>
                    {migrationState.result && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>Migrated {migrationState.result.migratedCount} trades in {Math.round(migrationState.result.duration / 1000)}s</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Migration Error */}
          {migrationState.isFailed && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Migration Failed
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {migrationState.error || 'An error occurred during migration.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feature Status */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Enhanced Features</h3>
            <div className="space-y-2">
              {Object.entries(featureFlags.flags).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Advanced Options</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Migration Status</h4>
                    <p className="text-sm text-gray-600">
                      Current version: {migrationActions.getMigrationStatus().progress?.planId || 'Not migrated'}
                    </p>
                  </div>
                  
                  {migrationState.canRollback && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Rollback Available</h4>
                      <p className="text-sm text-gray-600">
                        You can rollback to the previous data format if needed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          <div className="flex space-x-3">
            {migrationState.canRollback && migrationState.isCompleted && (
              <button
                onClick={handleRollback}
                disabled={migrationState.isInProgress}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Rollback
              </button>
            )}

            {migrationState.isNeeded && !migrationState.isInProgress && !migrationState.isCompleted && (
              <button
                onClick={handleStartMigration}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Start Migration
              </button>
            )}

            <button
              onClick={handleClose}
              disabled={migrationState.isInProgress}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {migrationState.isCompleted ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
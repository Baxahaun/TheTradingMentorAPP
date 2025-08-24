/**
 * Migration Hook
 * React hook for managing data migration in the UI
 */

import { useState, useEffect, useCallback } from 'react';
import { MigrationManager, MigrationProgress, MigrationExecutionResult } from '../lib/migrationManager';
import { FeatureFlagService } from '../lib/featureFlagService';

export interface MigrationState {
  isNeeded: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  progress: MigrationProgress | null;
  result: MigrationExecutionResult | null;
  error: string | null;
  canRollback: boolean;
}

export interface MigrationActions {
  checkMigrationNeeded: () => Promise<void>;
  startMigration: () => Promise<void>;
  rollbackMigration: () => Promise<void>;
  resetMigration: () => void;
  getMigrationStatus: () => any;
}

export interface UseMigrationOptions {
  autoCheck?: boolean;
  onMigrationComplete?: (result: MigrationExecutionResult) => void;
  onMigrationError?: (error: string) => void;
  onRollbackComplete?: () => void;
}

export function useMigration(options: UseMigrationOptions = {}): [MigrationState, MigrationActions] {
  const {
    autoCheck = true,
    onMigrationComplete,
    onMigrationError,
    onRollbackComplete
  } = options;

  const [state, setState] = useState<MigrationState>({
    isNeeded: false,
    isInProgress: false,
    isCompleted: false,
    isFailed: false,
    progress: null,
    result: null,
    error: null,
    canRollback: false
  });

  const [migrationManager] = useState(() => {
    const featureFlagService = new FeatureFlagService();
    return new MigrationManager(undefined, featureFlagService);
  });

  // Check if migration is needed
  const checkMigrationNeeded = useCallback(async () => {
    try {
      const isNeeded = await migrationManager.isMigrationNeeded();
      const canRollback = migrationManager.isRollbackAvailable();
      
      setState(prev => ({
        ...prev,
        isNeeded,
        canRollback,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check migration status',
        isNeeded: false
      }));
    }
  }, [migrationManager]);

  // Start migration process
  const startMigration = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isInProgress: true,
      isCompleted: false,
      isFailed: false,
      error: null,
      result: null
    }));

    try {
      const result = await migrationManager.executeMigration();
      
      setState(prev => ({
        ...prev,
        isInProgress: false,
        isCompleted: result.success,
        isFailed: !result.success,
        result,
        isNeeded: false,
        canRollback: migrationManager.isRollbackAvailable()
      }));

      if (result.success) {
        onMigrationComplete?.(result);
      } else {
        const errorMessage = result.errors.join(', ') || 'Migration failed';
        setState(prev => ({ ...prev, error: errorMessage }));
        onMigrationError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Migration failed unexpectedly';
      
      setState(prev => ({
        ...prev,
        isInProgress: false,
        isFailed: true,
        error: errorMessage
      }));

      onMigrationError?.(errorMessage);
    }
  }, [migrationManager, onMigrationComplete, onMigrationError]);

  // Rollback migration
  const rollbackMigration = useCallback(async () => {
    if (!state.result || !state.canRollback) {
      setState(prev => ({
        ...prev,
        error: 'Cannot rollback: No migration result or rollback not available'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isInProgress: true,
      error: null
    }));

    try {
      const rollbackResult = await migrationManager.rollbackMigration(state.result);
      
      if (rollbackResult.success) {
        setState(prev => ({
          ...prev,
          isInProgress: false,
          isCompleted: false,
          isFailed: false,
          result: null,
          isNeeded: true,
          canRollback: false
        }));

        onRollbackComplete?.();
      } else {
        const errorMessage = rollbackResult.errors.map(e => e.error).join(', ') || 'Rollback failed';
        setState(prev => ({
          ...prev,
          isInProgress: false,
          error: errorMessage
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Rollback failed unexpectedly';
      
      setState(prev => ({
        ...prev,
        isInProgress: false,
        error: errorMessage
      }));
    }
  }, [migrationManager, state.result, state.canRollback, onRollbackComplete]);

  // Reset migration state
  const resetMigration = useCallback(() => {
    migrationManager.resetMigrationState();
    setState({
      isNeeded: false,
      isInProgress: false,
      isCompleted: false,
      isFailed: false,
      progress: null,
      result: null,
      error: null,
      canRollback: false
    });
  }, [migrationManager]);

  // Get migration status
  const getMigrationStatus = useCallback(() => {
    return {
      progress: migrationManager.getMigrationProgress(),
      history: migrationManager.getMigrationHistory(),
      plan: migrationManager.getMigrationPlan()
    };
  }, [migrationManager]);

  // Update progress periodically during migration
  useEffect(() => {
    if (!state.isInProgress) return;

    const interval = setInterval(() => {
      const progress = migrationManager.getMigrationProgress();
      setState(prev => ({ ...prev, progress }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isInProgress, migrationManager]);

  // Auto-check migration status on mount
  useEffect(() => {
    if (autoCheck) {
      checkMigrationNeeded();
    }
  }, [autoCheck, checkMigrationNeeded]);

  const actions: MigrationActions = {
    checkMigrationNeeded,
    startMigration,
    rollbackMigration,
    resetMigration,
    getMigrationStatus
  };

  return [state, actions];
}

// Hook for migration progress monitoring
export function useMigrationProgress() {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [migrationManager] = useState(() => new MigrationManager());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentProgress = migrationManager.getMigrationProgress();
      setProgress(currentProgress);
    }, 500);

    return () => clearInterval(interval);
  }, [migrationManager]);

  return progress;
}

// Hook for feature flag integration
export function useMigrationFeatureFlags() {
  const [featureFlagService] = useState(() => new FeatureFlagService());
  const [flags, setFlags] = useState(() => featureFlagService.getFeatureAvailability());

  const updateFlags = useCallback(() => {
    setFlags(featureFlagService.getFeatureAvailability());
  }, [featureFlagService]);

  const enableFeature = useCallback((flagKey: string, rolloutPercentage: number = 100) => {
    featureFlagService.enableFlag(flagKey, rolloutPercentage);
    updateFlags();
  }, [featureFlagService, updateFlags]);

  const disableFeature = useCallback((flagKey: string) => {
    featureFlagService.disableFlag(flagKey);
    updateFlags();
  }, [featureFlagService, updateFlags]);

  const gradualRollout = useCallback((flagKey: string, targetPercentage: number, incrementPercentage: number = 10) => {
    featureFlagService.gradualRollout(flagKey, targetPercentage, incrementPercentage);
    updateFlags();
  }, [featureFlagService, updateFlags]);

  return {
    flags,
    enableFeature,
    disableFeature,
    gradualRollout,
    updateFlags,
    shouldUseEnhancedTradeReview: featureFlagService.shouldUseEnhancedTradeReview(),
    shouldPerformDataMigration: featureFlagService.shouldPerformDataMigration(),
    shouldMaintainBackwardCompatibility: featureFlagService.shouldMaintainBackwardCompatibility()
  };
}
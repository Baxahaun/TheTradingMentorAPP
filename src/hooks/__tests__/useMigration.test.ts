/**
 * Migration Hook Tests
 */

import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMigration, useMigrationFeatureFlags } from '../useMigration';
import { MigrationManager } from '../../lib/migrationManager';
import { FeatureFlagService } from '../../lib/featureFlagService';

// Mock the migration manager
vi.mock('../../lib/migrationManager');
vi.mock('../../lib/featureFlagService');

const MockedMigrationManager = MigrationManager as any;
const MockedFeatureFlagService = FeatureFlagService as any;

describe('useMigration', () => {
  let mockMigrationManager: any;
  let mockFeatureFlagService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockMigrationManager = {
      isMigrationNeeded: vi.fn(),
      executeMigration: vi.fn(),
      rollbackMigration: vi.fn(),
      resetMigrationState: vi.fn(),
      getMigrationProgress: vi.fn(),
      getMigrationHistory: vi.fn(),
      getMigrationPlan: vi.fn(),
      isRollbackAvailable: vi.fn()
    } as any;

    mockFeatureFlagService = {
      getFeatureAvailability: vi.fn(),
      enableFlag: vi.fn(),
      disableFlag: vi.fn(),
      gradualRollout: vi.fn(),
      shouldUseEnhancedTradeReview: vi.fn(),
      shouldPerformDataMigration: vi.fn(),
      shouldMaintainBackwardCompatibility: vi.fn()
    } as any;

    MockedMigrationManager.mockImplementation(() => mockMigrationManager);
    MockedFeatureFlagService.mockImplementation(() => mockFeatureFlagService);
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useMigration({ autoCheck: false }));
      const [state] = result.current;

      expect(state.isNeeded).toBe(false);
      expect(state.isInProgress).toBe(false);
      expect(state.isCompleted).toBe(false);
      expect(state.isFailed).toBe(false);
      expect(state.progress).toBeNull();
      expect(state.result).toBeNull();
      expect(state.error).toBeNull();
      expect(state.canRollback).toBe(false);
    });

    it('should auto-check migration status when autoCheck is true', async () => {
      mockMigrationManager.isMigrationNeeded.mockResolvedValue(true);
      mockMigrationManager.isRollbackAvailable.mockReturnValue(false);

      const { result } = renderHook(() => useMigration({ autoCheck: true }));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockMigrationManager.isMigrationNeeded).toHaveBeenCalled();
    });
  });

  describe('Migration Check', () => {
    it('should check if migration is needed', async () => {
      mockMigrationManager.isMigrationNeeded.mockResolvedValue(true);
      mockMigrationManager.isRollbackAvailable.mockReturnValue(false);

      const { result } = renderHook(() => useMigration({ autoCheck: false }));
      const [, actions] = result.current;

      await act(async () => {
        await actions.checkMigrationNeeded();
      });

      const [state] = result.current;
      expect(state.isNeeded).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle migration check errors', async () => {
      const error = new Error('Check failed');
      mockMigrationManager.isMigrationNeeded.mockRejectedValue(error);

      const { result } = renderHook(() => useMigration({ autoCheck: false }));
      const [, actions] = result.current;

      await act(async () => {
        await actions.checkMigrationNeeded();
      });

      const [state] = result.current;
      expect(state.isNeeded).toBe(false);
      expect(state.error).toBe('Check failed');
    });
  });

  describe('Migration Execution', () => {
    it('should execute migration successfully', async () => {
      const mockResult = {
        success: true,
        planId: 'test-plan',
        executedSteps: ['step1', 'step2'],
        failedSteps: [],
        rollbackData: {},
        validationResults: [],
        errors: [],
        warnings: [],
        duration: 1000
      };

      mockMigrationManager.executeMigration.mockResolvedValue(mockResult);
      mockMigrationManager.isRollbackAvailable.mockReturnValue(true);

      const onComplete = vi.fn();
      const { result } = renderHook(() => useMigration({ 
        autoCheck: false,
        onMigrationComplete: onComplete
      }));
      const [, actions] = result.current;

      await act(async () => {
        await actions.startMigration();
      });

      const [state] = result.current;
      expect(state.isInProgress).toBe(false);
      expect(state.isCompleted).toBe(true);
      expect(state.isFailed).toBe(false);
      expect(state.result).toBe(mockResult);
      expect(state.canRollback).toBe(true);
      expect(onComplete).toHaveBeenCalledWith(mockResult);
    });

    it('should handle migration failure', async () => {
      const mockResult = {
        success: false,
        planId: 'test-plan',
        executedSteps: ['step1'],
        failedSteps: ['step2'],
        rollbackData: {},
        validationResults: [],
        errors: ['Migration error'],
        warnings: [],
        duration: 500
      };

      mockMigrationManager.executeMigration.mockResolvedValue(mockResult);

      const onError = vi.fn();
      const { result } = renderHook(() => useMigration({ 
        autoCheck: false,
        onMigrationError: onError
      }));
      const [, actions] = result.current;

      await act(async () => {
        await actions.startMigration();
      });

      const [state] = result.current;
      expect(state.isInProgress).toBe(false);
      expect(state.isCompleted).toBe(false);
      expect(state.isFailed).toBe(true);
      expect(state.error).toBe('Migration error');
      expect(onError).toHaveBeenCalledWith('Migration error');
    });

    it('should handle migration exceptions', async () => {
      const error = new Error('Migration crashed');
      mockMigrationManager.executeMigration.mockRejectedValue(error);

      const onError = vi.fn();
      const { result } = renderHook(() => useMigration({ 
        autoCheck: false,
        onMigrationError: onError
      }));
      const [, actions] = result.current;

      await act(async () => {
        await actions.startMigration();
      });

      const [state] = result.current;
      expect(state.isInProgress).toBe(false);
      expect(state.isFailed).toBe(true);
      expect(state.error).toBe('Migration crashed');
      expect(onError).toHaveBeenCalledWith('Migration crashed');
    });
  });

  describe('Migration Rollback', () => {
    it('should rollback migration successfully', async () => {
      const mockResult = {
        success: true,
        planId: 'test-plan',
        executedSteps: ['step1', 'step2'],
        failedSteps: [],
        rollbackData: {},
        validationResults: [],
        errors: [],
        warnings: [],
        duration: 1000
      };

      const mockRollbackResult = {
        success: true,
        version: '0.0.0',
        migratedCount: 0,
        failedCount: 0,
        errors: [],
        warnings: []
      };

      mockMigrationManager.rollbackMigration.mockResolvedValue(mockRollbackResult);

      const onRollbackComplete = vi.fn();
      const { result } = renderHook(() => useMigration({ 
        autoCheck: false,
        onRollbackComplete
      }));

      // Set up state as if migration was completed
      act(() => {
        const [, actions] = result.current;
        (result.current[0] as any).result = mockResult;
        (result.current[0] as any).canRollback = true;
        (result.current[0] as any).isCompleted = true;
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.rollbackMigration();
      });

      const [state] = result.current;
      expect(state.isCompleted).toBe(false);
      expect(state.result).toBeNull();
      expect(state.isNeeded).toBe(true);
      expect(state.canRollback).toBe(false);
      expect(onRollbackComplete).toHaveBeenCalled();
    });

    it('should handle rollback when not available', async () => {
      const { result } = renderHook(() => useMigration({ autoCheck: false }));
      const [, actions] = result.current;

      await act(async () => {
        await actions.rollbackMigration();
      });

      const [state] = result.current;
      expect(state.error).toContain('Cannot rollback');
    });

    it('should handle rollback failure', async () => {
      const mockResult = {
        success: true,
        planId: 'test-plan',
        executedSteps: ['step1', 'step2'],
        failedSteps: [],
        rollbackData: {},
        validationResults: [],
        errors: [],
        warnings: [],
        duration: 1000
      };

      const mockRollbackResult = {
        success: false,
        version: '0.0.0',
        migratedCount: 0,
        failedCount: 0,
        errors: [{ tradeId: 'test', error: 'Rollback failed', severity: 'error' as const }],
        warnings: []
      };

      mockMigrationManager.rollbackMigration.mockResolvedValue(mockRollbackResult);

      const { result } = renderHook(() => useMigration({ autoCheck: false }));

      // Set up state as if migration was completed
      act(() => {
        (result.current[0] as any).result = mockResult;
        (result.current[0] as any).canRollback = true;
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.rollbackMigration();
      });

      const [state] = result.current;
      expect(state.error).toBe('Rollback failed');
    });
  });

  describe('State Reset', () => {
    it('should reset migration state', () => {
      const { result } = renderHook(() => useMigration({ autoCheck: false }));
      const [, actions] = result.current;

      act(() => {
        actions.resetMigration();
      });

      expect(mockMigrationManager.resetMigrationState).toHaveBeenCalled();
      
      const [state] = result.current;
      expect(state.isNeeded).toBe(false);
      expect(state.isInProgress).toBe(false);
      expect(state.isCompleted).toBe(false);
      expect(state.isFailed).toBe(false);
      expect(state.progress).toBeNull();
      expect(state.result).toBeNull();
      expect(state.error).toBeNull();
      expect(state.canRollback).toBe(false);
    });
  });

  describe('Status Retrieval', () => {
    it('should get migration status', () => {
      const mockStatus = {
        progress: { planId: 'test', status: 'completed' as const },
        history: [],
        plan: { id: 'test-plan', name: 'Test Plan' }
      };

      mockMigrationManager.getMigrationProgress.mockReturnValue(mockStatus.progress);
      mockMigrationManager.getMigrationHistory.mockReturnValue(mockStatus.history);
      mockMigrationManager.getMigrationPlan.mockReturnValue(mockStatus.plan as any);

      const { result } = renderHook(() => useMigration({ autoCheck: false }));
      const [, actions] = result.current;

      const status = actions.getMigrationStatus();

      expect(status.progress).toBe(mockStatus.progress);
      expect(status.history).toBe(mockStatus.history);
      expect(status.plan).toBe(mockStatus.plan);
    });
  });
});

describe('useMigrationFeatureFlags', () => {
  let mockFeatureFlagService: jest.Mocked<FeatureFlagService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFeatureFlagService = {
      getFeatureAvailability: vi.fn(),
      enableFlag: vi.fn(),
      disableFlag: vi.fn(),
      gradualRollout: vi.fn(),
      shouldUseEnhancedTradeReview: vi.fn(),
      shouldPerformDataMigration: vi.fn(),
      shouldMaintainBackwardCompatibility: vi.fn()
    } as any;

    MockedFeatureFlagService.mockImplementation(() => mockFeatureFlagService);
  });

  it('should initialize with feature flags', () => {
    const mockFlags = {
      enhanced_trade_review: true,
      advanced_notes_editor: false
    };

    mockFeatureFlagService.getFeatureAvailability.mockReturnValue(mockFlags);
    mockFeatureFlagService.shouldUseEnhancedTradeReview.mockReturnValue(true);
    mockFeatureFlagService.shouldPerformDataMigration.mockReturnValue(true);
    mockFeatureFlagService.shouldMaintainBackwardCompatibility.mockReturnValue(true);

    const { result } = renderHook(() => useMigrationFeatureFlags());

    expect(result.current.flags).toBe(mockFlags);
    expect(result.current.shouldUseEnhancedTradeReview).toBe(true);
    expect(result.current.shouldPerformDataMigration).toBe(true);
    expect(result.current.shouldMaintainBackwardCompatibility).toBe(true);
  });

  it('should enable feature flags', () => {
    mockFeatureFlagService.getFeatureAvailability.mockReturnValue({});

    const { result } = renderHook(() => useMigrationFeatureFlags());

    act(() => {
      result.current.enableFeature('test_flag', 75);
    });

    expect(mockFeatureFlagService.enableFlag).toHaveBeenCalledWith('test_flag', 75);
    expect(mockFeatureFlagService.getFeatureAvailability).toHaveBeenCalledTimes(2); // Initial + after update
  });

  it('should disable feature flags', () => {
    mockFeatureFlagService.getFeatureAvailability.mockReturnValue({});

    const { result } = renderHook(() => useMigrationFeatureFlags());

    act(() => {
      result.current.disableFeature('test_flag');
    });

    expect(mockFeatureFlagService.disableFlag).toHaveBeenCalledWith('test_flag');
    expect(mockFeatureFlagService.getFeatureAvailability).toHaveBeenCalledTimes(2); // Initial + after update
  });

  it('should perform gradual rollout', () => {
    mockFeatureFlagService.getFeatureAvailability.mockReturnValue({});

    const { result } = renderHook(() => useMigrationFeatureFlags());

    act(() => {
      result.current.gradualRollout('test_flag', 50, 25);
    });

    expect(mockFeatureFlagService.gradualRollout).toHaveBeenCalledWith('test_flag', 50, 25);
    expect(mockFeatureFlagService.getFeatureAvailability).toHaveBeenCalledTimes(2); // Initial + after update
  });
});
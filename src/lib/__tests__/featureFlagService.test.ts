/**
 * Feature Flag Service Tests
 */

import { vi } from 'vitest';
import { FeatureFlagService, TradeReviewFeatureFlags, FeatureFlag, FeatureFlagCondition } from '../featureFlagService';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('FeatureFlagService', () => {
  let featureFlagService: FeatureFlagService;

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    featureFlagService = new FeatureFlagService();
  });

  describe('Initialization', () => {
    it('should initialize with default feature flags', () => {
      const flags = featureFlagService.getAllFlags();
      expect(flags.length).toBeGreaterThan(0);
      
      // Check that essential flags exist
      const enhancedReviewFlag = flags.find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      expect(enhancedReviewFlag).toBeDefined();
      expect(enhancedReviewFlag?.enabled).toBe(false);
      expect(enhancedReviewFlag?.rolloutPercentage).toBe(0);
    });

    it('should load flags from localStorage if available', () => {
      const customFlags: FeatureFlag[] = [{
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test flag for testing',
        enabled: true,
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      
      localStorage.setItem('feature_flags', JSON.stringify(customFlags));
      
      const service = new FeatureFlagService();
      const flags = service.getAllFlags();
      
      expect(flags).toHaveLength(1);
      expect(flags[0].key).toBe('test_flag');
    });
  });

  describe('Feature Flag Evaluation', () => {
    it('should return false for disabled flags', () => {
      const isEnabled = featureFlagService.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      expect(isEnabled).toBe(false);
    });

    it('should return true for enabled flags with 100% rollout', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 100);
      const isEnabled = featureFlagService.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      expect(isEnabled).toBe(true);
    });

    it('should return false for non-existent flags', () => {
      const isEnabled = featureFlagService.isEnabled('non_existent_flag');
      expect(isEnabled).toBe(false);
    });

    it('should handle rollout percentage correctly', () => {
      featureFlagService.setContext({ userId: 'test_user_1' });
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 50);
      
      // The result should be consistent for the same user
      const result1 = featureFlagService.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      const result2 = featureFlagService.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      expect(result1).toBe(result2);
    });

    it('should evaluate conditions correctly', () => {
      const conditions: FeatureFlagCondition[] = [
        {
          type: 'user_id',
          operator: 'equals',
          value: 'test_user'
        }
      ];
      
      featureFlagService.updateFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, {
        enabled: true,
        rolloutPercentage: 100,
        conditions
      });
      
      // Should be false without matching context
      expect(featureFlagService.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW)).toBe(false);
      
      // Should be true with matching context
      featureFlagService.setContext({ userId: 'test_user' });
      expect(featureFlagService.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW)).toBe(true);
    });
  });

  describe('Context Management', () => {
    it('should set and use context for evaluation', () => {
      featureFlagService.setContext({
        userId: 'user123',
        accountType: 'live',
        tradeCount: 50
      });
      
      const conditions: FeatureFlagCondition[] = [
        {
          type: 'account_type',
          operator: 'equals',
          value: 'live'
        },
        {
          type: 'trade_count',
          operator: 'greater_than',
          value: 10
        }
      ];
      
      featureFlagService.updateFlag(TradeReviewFeatureFlags.PERFORMANCE_ANALYTICS, {
        enabled: true,
        rolloutPercentage: 100,
        conditions
      });
      
      expect(featureFlagService.isEnabled(TradeReviewFeatureFlags.PERFORMANCE_ANALYTICS)).toBe(true);
    });

    it('should handle different condition operators', () => {
      featureFlagService.setContext({
        userId: 'user123',
        tradeCount: 25,
        customAttributes: { region: 'US' }
      });
      
      const testCases = [
        { operator: 'equals' as const, value: 25, expected: true },
        { operator: 'not_equals' as const, value: 30, expected: true },
        { operator: 'greater_than' as const, value: 20, expected: true },
        { operator: 'less_than' as const, value: 30, expected: true },
        { operator: 'in' as const, value: [20, 25, 30], expected: true },
        { operator: 'not_in' as const, value: [10, 15, 20], expected: true }
      ];
      
      testCases.forEach(({ operator, value, expected }, index) => {
        const flagKey = `test_flag_${index}`;
        featureFlagService.createFlag({
          key: flagKey,
          name: `Test Flag ${index}`,
          description: 'Test flag',
          enabled: true,
          rolloutPercentage: 100,
          conditions: [{
            type: 'trade_count',
            operator,
            value
          }]
        });
        
        expect(featureFlagService.isEnabled(flagKey)).toBe(expected);
      });
    });
  });

  describe('Flag Management', () => {
    it('should enable a flag', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 75);
      
      const flags = featureFlagService.getAllFlags();
      const flag = flags.find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      expect(flag?.enabled).toBe(true);
      expect(flag?.rolloutPercentage).toBe(75);
    });

    it('should disable a flag', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 100);
      featureFlagService.disableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      const flags = featureFlagService.getAllFlags();
      const flag = flags.find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      expect(flag?.enabled).toBe(false);
      expect(flag?.rolloutPercentage).toBe(0);
    });

    it('should update flag properties', () => {
      const originalFlag = featureFlagService.getAllFlags()
        .find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      featureFlagService.updateFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, {
        enabled: true,
        rolloutPercentage: 50,
        metadata: { test: 'value' }
      });
      
      const updatedFlag = featureFlagService.getAllFlags()
        .find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      expect(updatedFlag?.enabled).toBe(true);
      expect(updatedFlag?.rolloutPercentage).toBe(50);
      expect(updatedFlag?.metadata).toEqual({ test: 'value' });
      expect(updatedFlag?.updatedAt).not.toBe(originalFlag?.updatedAt);
    });

    it('should handle gradual rollout', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 10);
      featureFlagService.gradualRollout(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 50, 20);
      
      const flag = featureFlagService.getAllFlags()
        .find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      expect(flag?.rolloutPercentage).toBe(30); // 10 + 20
      
      // Another rollout
      featureFlagService.gradualRollout(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 50, 20);
      const updatedFlag = featureFlagService.getAllFlags()
        .find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      expect(updatedFlag?.rolloutPercentage).toBe(50); // Capped at target
    });

    it('should create new flags', () => {
      const newFlag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'> = {
        key: 'new_test_flag',
        name: 'New Test Flag',
        description: 'A new test flag',
        enabled: true,
        rolloutPercentage: 100
      };
      
      featureFlagService.createFlag(newFlag);
      
      const flags = featureFlagService.getAllFlags();
      const createdFlag = flags.find(f => f.key === 'new_test_flag');
      
      expect(createdFlag).toBeDefined();
      expect(createdFlag?.name).toBe('New Test Flag');
      expect(createdFlag?.createdAt).toBeDefined();
      expect(createdFlag?.updatedAt).toBeDefined();
    });

    it('should delete flags', () => {
      featureFlagService.createFlag({
        key: 'temp_flag',
        name: 'Temporary Flag',
        description: 'Temporary flag for testing',
        enabled: true,
        rolloutPercentage: 100
      });
      
      expect(featureFlagService.isEnabled('temp_flag')).toBe(true);
      
      featureFlagService.deleteFlag('temp_flag');
      
      expect(featureFlagService.isEnabled('temp_flag')).toBe(false);
    });
  });

  describe('Convenience Methods', () => {
    it('should check if enhanced trade review should be used', () => {
      expect(featureFlagService.shouldUseEnhancedTradeReview()).toBe(false);
      
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 100);
      expect(featureFlagService.shouldUseEnhancedTradeReview()).toBe(true);
    });

    it('should check if data migration should be performed', () => {
      // Data migration should be enabled by default
      expect(featureFlagService.shouldPerformDataMigration()).toBe(true);
    });

    it('should check if backward compatibility should be maintained', () => {
      // Backward compatibility should be enabled by default
      expect(featureFlagService.shouldMaintainBackwardCompatibility()).toBe(true);
    });

    it('should get feature availability', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 100);
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ADVANCED_NOTES_EDITOR, 50);
      
      const availability = featureFlagService.getFeatureAvailability();
      
      expect(availability[TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW]).toBe(true);
      expect(availability[TradeReviewFeatureFlags.CHART_GALLERY_MANAGER]).toBe(false);
      expect(availability[TradeReviewFeatureFlags.DATA_MIGRATION]).toBe(true);
    });

    it('should get enabled flags', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 100);
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ADVANCED_NOTES_EDITOR, 100);
      
      const enabledFlags = featureFlagService.getEnabledFlags();
      
      expect(enabledFlags).toContain(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      expect(enabledFlags).toContain(TradeReviewFeatureFlags.ADVANCED_NOTES_EDITOR);
      expect(enabledFlags).toContain(TradeReviewFeatureFlags.DATA_MIGRATION);
      expect(enabledFlags).toContain(TradeReviewFeatureFlags.BACKWARD_COMPATIBILITY);
    });
  });

  describe('Persistence', () => {
    it('should save flags to localStorage', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 100);
      
      const storedFlags = localStorage.getItem('feature_flags');
      expect(storedFlags).toBeTruthy();
      
      const flags = JSON.parse(storedFlags!);
      const enhancedFlag = flags.find((f: FeatureFlag) => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      expect(enhancedFlag.enabled).toBe(true);
    });

    it('should reset to defaults', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 100);
      featureFlagService.resetToDefaults();
      
      expect(featureFlagService.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid flag keys gracefully', () => {
      expect(() => {
        featureFlagService.updateFlag('non_existent_flag', { enabled: true });
      }).toThrow('Feature flag \'non_existent_flag\' not found');
    });

    it('should handle invalid rollout percentages', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, 150);
      
      const flag = featureFlagService.getAllFlags()
        .find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      expect(flag?.rolloutPercentage).toBe(100); // Should be capped at 100
    });

    it('should handle negative rollout percentages', () => {
      featureFlagService.enableFlag(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW, -10);
      
      const flag = featureFlagService.getAllFlags()
        .find(f => f.key === TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
      
      expect(flag?.rolloutPercentage).toBe(0); // Should be floored at 0
    });
  });

  describe('Condition Creation Helper', () => {
    it('should create conditions correctly', () => {
      const condition = FeatureFlagService.createCondition('user_id', 'equals', 'test_user');
      
      expect(condition.type).toBe('user_id');
      expect(condition.operator).toBe('equals');
      expect(condition.value).toBe('test_user');
    });
  });
});
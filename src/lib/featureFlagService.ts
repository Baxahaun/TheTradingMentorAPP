/**
 * Feature Flag Service
 * Manages gradual feature rollout and A/B testing for the enhanced trade review system
 */

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'account_type' | 'trade_count' | 'date_range' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains';
  value: any;
}

export interface FeatureFlagContext {
  userId?: string;
  accountType?: 'live' | 'demo';
  tradeCount?: number;
  accountAge?: number;
  customAttributes?: Record<string, any>;
}

// Available feature flags for the trade review system
export enum TradeReviewFeatureFlags {
  ENHANCED_TRADE_REVIEW = 'enhanced_trade_review',
  ADVANCED_NOTES_EDITOR = 'advanced_notes_editor',
  CHART_GALLERY_MANAGER = 'chart_gallery_manager',
  PERFORMANCE_ANALYTICS = 'performance_analytics',
  REVIEW_WORKFLOW = 'review_workflow',
  EXPORT_FUNCTIONALITY = 'export_functionality',
  CONTEXTUAL_NAVIGATION = 'contextual_navigation',
  TAG_MANAGEMENT = 'tag_management',
  DATA_MIGRATION = 'data_migration',
  BACKWARD_COMPATIBILITY = 'backward_compatibility'
}

// Default feature flag configurations
const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW,
    name: 'Enhanced Trade Review System',
    description: 'Enable the comprehensive trade review system',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.ADVANCED_NOTES_EDITOR,
    name: 'Advanced Notes Editor',
    description: 'Enable advanced note-taking with categories and templates',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.CHART_GALLERY_MANAGER,
    name: 'Chart Gallery Manager',
    description: 'Enable chart upload and annotation features',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.PERFORMANCE_ANALYTICS,
    name: 'Performance Analytics',
    description: 'Enable advanced performance metrics and comparisons',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.REVIEW_WORKFLOW,
    name: 'Review Workflow Management',
    description: 'Enable structured review workflow with stages',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.EXPORT_FUNCTIONALITY,
    name: 'Export and Reporting',
    description: 'Enable trade export and report generation',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.CONTEXTUAL_NAVIGATION,
    name: 'Contextual Navigation',
    description: 'Enable smart back navigation and context preservation',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.TAG_MANAGEMENT,
    name: 'Advanced Tag Management',
    description: 'Enable enhanced tag management with performance tracking',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.DATA_MIGRATION,
    name: 'Data Migration',
    description: 'Enable automatic data migration to enhanced format',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    key: TradeReviewFeatureFlags.BACKWARD_COMPATIBILITY,
    name: 'Backward Compatibility',
    description: 'Maintain compatibility with legacy trade data',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private context: FeatureFlagContext = {};

  constructor() {
    this.initializeFlags();
  }

  /**
   * Initialize feature flags with defaults
   */
  private initializeFlags(): void {
    // Load flags from localStorage or use defaults
    const storedFlags = localStorage.getItem('feature_flags');
    const flags = storedFlags ? JSON.parse(storedFlags) : DEFAULT_FEATURE_FLAGS;

    flags.forEach((flag: FeatureFlag) => {
      this.flags.set(flag.key, flag);
    });
  }

  /**
   * Set user context for feature flag evaluation
   */
  setContext(context: FeatureFlagContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found`);
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (!this.isInRollout(flag)) {
      return false;
    }

    // Check conditions
    if (flag.conditions && !this.evaluateConditions(flag.conditions)) {
      return false;
    }

    return true;
  }

  /**
   * Check if user is in rollout percentage
   */
  private isInRollout(flag: FeatureFlag): boolean {
    if (flag.rolloutPercentage >= 100) {
      return true;
    }

    if (flag.rolloutPercentage <= 0) {
      return false;
    }

    // Use user ID for consistent rollout (same user always gets same result)
    const userId = this.context.userId || 'anonymous';
    const hash = this.hashString(userId + flag.key);
    const percentage = (hash % 100) + 1;

    return percentage <= flag.rolloutPercentage;
  }

  /**
   * Evaluate feature flag conditions
   */
  private evaluateConditions(conditions: FeatureFlagCondition[]): boolean {
    return conditions.every(condition => this.evaluateCondition(condition));
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: FeatureFlagCondition): boolean {
    let contextValue: any;

    switch (condition.type) {
      case 'user_id':
        contextValue = this.context.userId;
        break;
      case 'account_type':
        contextValue = this.context.accountType;
        break;
      case 'trade_count':
        contextValue = this.context.tradeCount;
        break;
      case 'custom':
        contextValue = this.context.customAttributes?.[condition.value.key];
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'greater_than':
        return contextValue > condition.value;
      case 'less_than':
        return contextValue < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'contains':
        return typeof contextValue === 'string' && contextValue.includes(condition.value);
      default:
        return false;
    }
  }

  /**
   * Simple hash function for consistent rollout
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update a feature flag
   */
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      throw new Error(`Feature flag '${flagKey}' not found`);
    }

    const updatedFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.flags.set(flagKey, updatedFlag);
    this.saveFlags();
  }

  /**
   * Enable a feature flag
   */
  enableFlag(flagKey: string, rolloutPercentage: number = 100): void {
    this.updateFlag(flagKey, {
      enabled: true,
      rolloutPercentage: Math.max(0, Math.min(100, rolloutPercentage))
    });
  }

  /**
   * Disable a feature flag
   */
  disableFlag(flagKey: string): void {
    this.updateFlag(flagKey, {
      enabled: false,
      rolloutPercentage: 0
    });
  }

  /**
   * Gradually roll out a feature
   */
  gradualRollout(flagKey: string, targetPercentage: number, incrementPercentage: number = 10): void {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      throw new Error(`Feature flag '${flagKey}' not found`);
    }

    const newPercentage = Math.min(targetPercentage, flag.rolloutPercentage + incrementPercentage);
    this.updateFlag(flagKey, {
      enabled: true,
      rolloutPercentage: newPercentage
    });
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get enabled flags for current context
   */
  getEnabledFlags(): string[] {
    return Array.from(this.flags.keys()).filter(key => this.isEnabled(key));
  }

  /**
   * Save flags to localStorage
   */
  private saveFlags(): void {
    const flagsArray = Array.from(this.flags.values());
    localStorage.setItem('feature_flags', JSON.stringify(flagsArray));
  }

  /**
   * Reset flags to defaults
   */
  resetToDefaults(): void {
    this.flags.clear();
    DEFAULT_FEATURE_FLAGS.forEach(flag => {
      this.flags.set(flag.key, { ...flag });
    });
    this.saveFlags();
  }

  /**
   * Check if enhanced trade review system should be used
   */
  shouldUseEnhancedTradeReview(): boolean {
    return this.isEnabled(TradeReviewFeatureFlags.ENHANCED_TRADE_REVIEW);
  }

  /**
   * Check if data migration should be performed
   */
  shouldPerformDataMigration(): boolean {
    return this.isEnabled(TradeReviewFeatureFlags.DATA_MIGRATION);
  }

  /**
   * Check if backward compatibility should be maintained
   */
  shouldMaintainBackwardCompatibility(): boolean {
    return this.isEnabled(TradeReviewFeatureFlags.BACKWARD_COMPATIBILITY);
  }

  /**
   * Get feature availability for UI components
   */
  getFeatureAvailability(): Record<string, boolean> {
    const availability: Record<string, boolean> = {};
    
    Object.values(TradeReviewFeatureFlags).forEach(flag => {
      availability[flag] = this.isEnabled(flag);
    });

    return availability;
  }

  /**
   * Create a feature flag condition
   */
  static createCondition(
    type: FeatureFlagCondition['type'],
    operator: FeatureFlagCondition['operator'],
    value: any
  ): FeatureFlagCondition {
    return { type, operator, value };
  }

  /**
   * Create a new feature flag
   */
  createFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): void {
    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.flags.set(flag.key, newFlag);
    this.saveFlags();
  }

  /**
   * Delete a feature flag
   */
  deleteFlag(flagKey: string): void {
    this.flags.delete(flagKey);
    this.saveFlags();
  }
}
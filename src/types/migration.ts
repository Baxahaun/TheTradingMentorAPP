/**
 * Migration System Types
 * Types and interfaces for migrating existing playbooks to professional strategies
 */

import { ProfessionalStrategy, PositionSizingMethod, StopLossRule, TakeProfitRule } from './strategy';

// ===== LEGACY PLAYBOOK INTERFACES =====

/**
 * Legacy playbook interface from components (UI state)
 */
export interface LegacyPlaybook {
  id: string;
  title: string;
  description: string;
  marketConditions: string;
  entryParameters: string;
  exitParameters: string;
  color: string;
  timesUsed?: number;
  tradesWon?: number;
  tradesLost?: number;
}

/**
 * Legacy playbook interface from Firebase service
 */
export interface LegacyFirebasePlaybook {
  id: string;
  name: string;
  description: string;
  setup: string;
  entry: string;
  exit: string;
  riskManagement: string;
  examples?: string;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

// ===== MIGRATION CONFIGURATION =====

/**
 * Migration configuration options
 */
export interface MigrationConfig {
  preserveOriginal: boolean; // Keep original playbook alongside migrated strategy
  validateBeforeMigration: boolean; // Validate data before migration
  requireUserInput: boolean; // Require user input for missing fields
  autoFillDefaults: boolean; // Auto-fill default values where possible
  createBackup: boolean; // Create backup before migration
}

/**
 * Default migration configuration
 */
export const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  preserveOriginal: true,
  validateBeforeMigration: true,
  requireUserInput: true,
  autoFillDefaults: true,
  createBackup: true
};

// ===== MIGRATION MAPPING =====

/**
 * Field mapping from legacy playbook to professional strategy
 */
export interface FieldMapping {
  // Direct mappings (no transformation needed)
  direct: {
    id: 'id';
    title: 'title' | 'name';
    description: 'description';
    color: 'color';
  };
  
  // Legacy fields to preserve
  legacy: {
    marketConditions?: 'marketConditions' | 'setup';
    entryParameters?: 'entryParameters' | 'entry';
    exitParameters?: 'exitParameters' | 'exit';
    timesUsed?: 'timesUsed';
    tradesWon?: 'tradesWon';
    tradesLost?: 'tradesLost';
  };
  
  // Fields requiring transformation or user input
  transform: {
    methodology: 'Technical'; // Default value
    primaryTimeframe: string; // Requires user input
    assetClasses: string[]; // Requires user input
    setupConditions: {
      marketEnvironment: 'marketConditions' | 'setup';
      technicalConditions: string[]; // Derived from entryParameters
    };
    entryTriggers: {
      primarySignal: 'entryParameters' | 'entry';
      confirmationSignals: string[]; // Requires user input
      timingCriteria: string; // Requires user input
    };
    riskManagement: {
      positionSizingMethod: PositionSizingMethod; // Requires user input
      maxRiskPerTrade: number; // Default 2%
      stopLossRule: StopLossRule; // Derived from exitParameters
      takeProfitRule: TakeProfitRule; // Derived from exitParameters
      riskRewardRatio: number; // Default 2:1
    };
  };
}

// ===== MIGRATION STEPS =====

/**
 * Migration step status
 */
export type MigrationStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Individual migration step
 */
export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: MigrationStepStatus;
  required: boolean;
  requiresUserInput: boolean;
  validationRules?: string[];
  error?: string;
  completedAt?: string;
}

/**
 * Migration wizard state
 */
export interface MigrationWizardState {
  currentStep: number;
  totalSteps: number;
  steps: MigrationStep[];
  sourcePlaybook: LegacyPlaybook | LegacyFirebasePlaybook;
  targetStrategy: Partial<ProfessionalStrategy>;
  userInputs: Record<string, any>;
  validationErrors: Record<string, string[]>;
  canProceed: boolean;
  canGoBack: boolean;
  isCompleted: boolean;
}

// ===== MIGRATION RESULT =====

/**
 * Migration result status
 */
export type MigrationResultStatus = 'success' | 'partial' | 'failed' | 'cancelled';

/**
 * Migration result
 */
export interface MigrationResult {
  status: MigrationResultStatus;
  sourcePlaybookId: string;
  targetStrategyId?: string;
  migratedFields: string[];
  skippedFields: string[];
  errors: string[];
  warnings: string[];
  backupId?: string;
  completedAt: string;
  rollbackAvailable: boolean;
}

// ===== VALIDATION =====

/**
 * Migration validation error
 */
export interface MigrationValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

/**
 * Migration validation result
 */
export interface MigrationValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: MigrationValidationError[];
  warnings: MigrationValidationError[];
  requiredFields: string[];
  optionalFields: string[];
}

// ===== ROLLBACK =====

/**
 * Rollback operation
 */
export interface RollbackOperation {
  migrationId: string;
  sourcePlaybookId: string;
  targetStrategyId: string;
  backupData: LegacyPlaybook | LegacyFirebasePlaybook;
  rollbackReason: string;
  requestedAt: string;
  completedAt?: string;
  success?: boolean;
  error?: string;
}

// ===== USER INPUT REQUIREMENTS =====

/**
 * Required user input for migration
 */
export interface RequiredUserInput {
  field: string;
  label: string;
  description: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'textarea';
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: (value: any) => boolean;
  };
  helpText?: string;
  placeholder?: string;
}

/**
 * Migration form data
 */
export interface MigrationFormData {
  // Professional fields requiring user input
  methodology: 'Technical' | 'Fundamental' | 'Quantitative' | 'Hybrid';
  primaryTimeframe: string;
  assetClasses: string[];
  
  // Setup conditions enhancement
  technicalConditions: string[];
  fundamentalConditions?: string[];
  volatilityRequirements?: string;
  
  // Entry triggers enhancement
  confirmationSignals: string[];
  timingCriteria: string;
  
  // Risk management configuration
  positionSizingMethod: PositionSizingMethod;
  maxRiskPerTrade: number;
  stopLossRule: StopLossRule;
  takeProfitRule: TakeProfitRule;
  riskRewardRatio: number;
}

// ===== MIGRATION CONSTANTS =====

/**
 * Migration step definitions
 */
export const MIGRATION_STEPS: Omit<MigrationStep, 'status' | 'completedAt' | 'error'>[] = [
  {
    id: 'validate_source',
    name: 'Validate Source Data',
    description: 'Validate existing playbook data for migration compatibility',
    required: true,
    requiresUserInput: false,
    validationRules: ['required_fields', 'data_integrity']
  },
  {
    id: 'preserve_legacy',
    name: 'Preserve Legacy Data',
    description: 'Preserve existing playbook fields for backward compatibility',
    required: true,
    requiresUserInput: false
  },
  {
    id: 'map_basic_fields',
    name: 'Map Basic Fields',
    description: 'Map basic fields (title, description, color) to new structure',
    required: true,
    requiresUserInput: false
  },
  {
    id: 'configure_methodology',
    name: 'Configure Methodology',
    description: 'Select trading methodology and primary timeframe',
    required: true,
    requiresUserInput: true,
    validationRules: ['methodology_required', 'timeframe_required']
  },
  {
    id: 'enhance_setup_conditions',
    name: 'Enhance Setup Conditions',
    description: 'Transform market conditions into professional setup structure',
    required: true,
    requiresUserInput: true,
    validationRules: ['market_environment_required']
  },
  {
    id: 'configure_entry_triggers',
    name: 'Configure Entry Triggers',
    description: 'Transform entry parameters into professional trigger structure',
    required: true,
    requiresUserInput: true,
    validationRules: ['primary_signal_required']
  },
  {
    id: 'setup_risk_management',
    name: 'Setup Risk Management',
    description: 'Configure professional risk management rules',
    required: true,
    requiresUserInput: true,
    validationRules: ['position_sizing_required', 'stop_loss_required', 'take_profit_required']
  },
  {
    id: 'initialize_performance',
    name: 'Initialize Performance Tracking',
    description: 'Initialize performance metrics from existing trade data',
    required: true,
    requiresUserInput: false
  },
  {
    id: 'validate_strategy',
    name: 'Validate Strategy',
    description: 'Validate the complete professional strategy configuration',
    required: true,
    requiresUserInput: false,
    validationRules: ['complete_strategy_validation']
  },
  {
    id: 'finalize_migration',
    name: 'Finalize Migration',
    description: 'Save the migrated strategy and create backup',
    required: true,
    requiresUserInput: false
  }
];

/**
 * Default values for migration
 */
export const MIGRATION_DEFAULTS = {
  methodology: 'Technical' as const,
  primaryTimeframe: '1H',
  maxRiskPerTrade: 2, // 2%
  riskRewardRatio: 2, // 2:1
  positionSizingMethod: {
    type: 'FixedPercentage' as const,
    parameters: { percentage: 2 }
  },
  stopLossRule: {
    type: 'PercentageBased' as const,
    parameters: { percentage: 2 },
    description: 'Fixed 2% stop loss'
  },
  takeProfitRule: {
    type: 'RiskRewardRatio' as const,
    parameters: { ratio: 2 },
    description: '2:1 risk-reward ratio target'
  }
} as const;
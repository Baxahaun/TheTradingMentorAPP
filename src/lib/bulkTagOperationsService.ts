import { Trade } from '../types/trade';
import { tagService } from './tagService';

export interface BulkTagOperation {
  type: 'delete' | 'merge' | 'categorize' | 'star' | 'hide' | 'rename' | 'replace';
  selectedTags: string[];
  targetValue?: string;
  targetCategory?: string;
  mergeTarget?: string;
  replacementTag?: string;
  options?: BulkOperationOptions;
}

export interface BulkOperationOptions {
  preserveHistory?: boolean;
  createBackup?: boolean;
  validateBeforeApply?: boolean;
  dryRun?: boolean;
}

export interface BulkOperationResult {
  success: boolean;
  affectedTrades: number;
  affectedTags: number;
  errors: string[];
  warnings: string[];
  changes: BulkOperationChange[];
  rollbackData?: any;
}

export interface BulkOperationChange {
  tradeId: string;
  oldTags: string[];
  newTags: string[];
  changeType: string;
  timestamp: string;
}

export interface TagMergeRule {
  sourceTags: string[];
  targetTag: string;
  strategy: 'replace' | 'combine' | 'conditional';
  conditions?: TagMergeCondition[];
}

export interface TagMergeCondition {
  field: keyof Trade;
  operator: 'equals' | 'contains' | 'greater' | 'less';
  value: any;
}

export interface TagValidationRule {
  id: string;
  name: string;
  description: string;
  validator: (tag: string, trades: Trade[]) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  suggestedAction?: string;
}

/**
 * Service for handling bulk tag operations with validation and rollback capabilities
 */
export class BulkTagOperationsService {
  private static instance: BulkTagOperationsService;
  private operationHistory: BulkOperationResult[] = [];
  private validationRules: TagValidationRule[] = [];

  private constructor() {
    this.initializeValidationRules();
  }

  public static getInstance(): BulkTagOperationsService {
    if (!BulkTagOperationsService.instance) {
      BulkTagOperationsService.instance = new BulkTagOperationsService();
    }
    return BulkTagOperationsService.instance;
  }

  /**
   * Execute a bulk tag operation
   */
  public async executeBulkOperation(
    operation: BulkTagOperation,
    trades: Trade[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: false,
      affectedTrades: 0,
      affectedTags: 0,
      errors: [],
      warnings: [],
      changes: []
    };

    try {
      // Validate operation
      const validation = this.validateOperation(operation, trades);
      if (!validation.isValid) {
        result.errors = validation.errors;
        result.warnings = validation.warnings;
        return result;
      }

      // Create backup if requested
      if (operation.options?.createBackup) {
        result.rollbackData = this.createBackup(trades);
      }

      // Execute operation based on type
      switch (operation.type) {
        case 'delete':
          return await this.executeBulkDelete(operation, trades);
        case 'merge':
          return await this.executeBulkMerge(operation, trades);
        case 'rename':
          return await this.executeBulkRename(operation, trades);
        case 'replace':
          return await this.executeBulkReplace(operation, trades);
        case 'categorize':
          return await this.executeBulkCategorize(operation, trades);
        default:
          result.errors.push(`Unsupported operation type: ${operation.type}`);
          return result;
      }
    } catch (error) {
      result.errors.push(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Execute bulk delete operation
   */
  private async executeBulkDelete(
    operation: BulkTagOperation,
    trades: Trade[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      affectedTrades: 0,
      affectedTags: operation.selectedTags.length,
      errors: [],
      warnings: [],
      changes: []
    };

    const normalizedTagsToDelete = operation.selectedTags.map(tag => tagService.normalizeTag(tag));

    trades.forEach(trade => {
      if (!trade.tags || trade.tags.length === 0) return;

      const oldTags = [...trade.tags];
      const newTags = trade.tags.filter(tag => 
        !normalizedTagsToDelete.includes(tagService.normalizeTag(tag))
      );

      if (newTags.length !== oldTags.length) {
        trade.tags = newTags;
        result.affectedTrades++;
        
        result.changes.push({
          tradeId: trade.id,
          oldTags,
          newTags,
          changeType: 'delete',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Add to operation history
    this.operationHistory.push(result);

    return result;
  }

  /**
   * Execute bulk merge operation
   */
  private async executeBulkMerge(
    operation: BulkTagOperation,
    trades: Trade[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      affectedTrades: 0,
      affectedTags: operation.selectedTags.length,
      errors: [],
      warnings: [],
      changes: []
    };

    if (!operation.mergeTarget) {
      result.success = false;
      result.errors.push('Merge target is required for merge operation');
      return result;
    }

    const normalizedSourceTags = operation.selectedTags.map(tag => tagService.normalizeTag(tag));
    const normalizedTargetTag = tagService.normalizeTag(operation.mergeTarget);

    trades.forEach(trade => {
      if (!trade.tags || trade.tags.length === 0) return;

      const oldTags = [...trade.tags];
      let hasSourceTag = false;
      
      // Check if trade has any of the source tags
      trade.tags.forEach(tag => {
        if (normalizedSourceTags.includes(tagService.normalizeTag(tag))) {
          hasSourceTag = true;
        }
      });

      if (hasSourceTag) {
        // Remove source tags and add target tag
        const newTags = trade.tags
          .filter(tag => !normalizedSourceTags.includes(tagService.normalizeTag(tag)))
          .concat(normalizedTargetTag);

        // Remove duplicates
        trade.tags = [...new Set(newTags)];
        result.affectedTrades++;

        result.changes.push({
          tradeId: trade.id,
          oldTags,
          newTags: trade.tags,
          changeType: 'merge',
          timestamp: new Date().toISOString()
        });
      }
    });

    this.operationHistory.push(result);
    return result;
  }

  /**
   * Execute bulk rename operation
   */
  private async executeBulkRename(
    operation: BulkTagOperation,
    trades: Trade[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      affectedTrades: 0,
      affectedTags: operation.selectedTags.length,
      errors: [],
      warnings: [],
      changes: []
    };

    if (!operation.targetValue) {
      result.success = false;
      result.errors.push('Target value is required for rename operation');
      return result;
    }

    if (operation.selectedTags.length !== 1) {
      result.success = false;
      result.errors.push('Rename operation can only be applied to a single tag');
      return result;
    }

    const oldTag = tagService.normalizeTag(operation.selectedTags[0]);
    const newTag = tagService.normalizeTag(operation.targetValue);

    // Validate new tag
    const validation = tagService.validateTag(newTag);
    if (!validation.isValid) {
      result.success = false;
      result.errors = validation.errors.map(e => e.message);
      return result;
    }

    trades.forEach(trade => {
      if (!trade.tags || trade.tags.length === 0) return;

      const oldTags = [...trade.tags];
      const tagIndex = trade.tags.findIndex(tag => tagService.normalizeTag(tag) === oldTag);

      if (tagIndex !== -1) {
        trade.tags[tagIndex] = newTag;
        result.affectedTrades++;

        result.changes.push({
          tradeId: trade.id,
          oldTags,
          newTags: [...trade.tags],
          changeType: 'rename',
          timestamp: new Date().toISOString()
        });
      }
    });

    this.operationHistory.push(result);
    return result;
  }

  /**
   * Execute bulk replace operation
   */
  private async executeBulkReplace(
    operation: BulkTagOperation,
    trades: Trade[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      affectedTrades: 0,
      affectedTags: operation.selectedTags.length,
      errors: [],
      warnings: [],
      changes: []
    };

    if (!operation.replacementTag) {
      result.success = false;
      result.errors.push('Replacement tag is required for replace operation');
      return result;
    }

    const normalizedTagsToReplace = operation.selectedTags.map(tag => tagService.normalizeTag(tag));
    const normalizedReplacementTag = tagService.normalizeTag(operation.replacementTag);

    // Validate replacement tag
    const validation = tagService.validateTag(normalizedReplacementTag);
    if (!validation.isValid) {
      result.success = false;
      result.errors = validation.errors.map(e => e.message);
      return result;
    }

    trades.forEach(trade => {
      if (!trade.tags || trade.tags.length === 0) return;

      const oldTags = [...trade.tags];
      let hasChanges = false;

      const newTags = trade.tags.map(tag => {
        if (normalizedTagsToReplace.includes(tagService.normalizeTag(tag))) {
          hasChanges = true;
          return normalizedReplacementTag;
        }
        return tag;
      });

      if (hasChanges) {
        // Remove duplicates
        trade.tags = [...new Set(newTags)];
        result.affectedTrades++;

        result.changes.push({
          tradeId: trade.id,
          oldTags,
          newTags: trade.tags,
          changeType: 'replace',
          timestamp: new Date().toISOString()
        });
      }
    });

    this.operationHistory.push(result);
    return result;
  }

  /**
   * Execute bulk categorize operation (for UI state management)
   */
  private async executeBulkCategorize(
    operation: BulkTagOperation,
    trades: Trade[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      affectedTrades: 0,
      affectedTags: operation.selectedTags.length,
      errors: [],
      warnings: [],
      changes: []
    };

    // This operation doesn't modify trade data, just UI categorization
    // The actual categorization is handled by the AdvancedTagManager component
    result.warnings.push('Categorization is a UI-only operation and does not modify trade data');

    return result;
  }

  /**
   * Validate a bulk operation before execution
   */
  public validateOperation(
    operation: BulkTagOperation,
    trades: Trade[]
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!operation.selectedTags || operation.selectedTags.length === 0) {
      errors.push('No tags selected for operation');
    }

    if (!trades || trades.length === 0) {
      warnings.push('No trades available to process');
    }

    // Operation-specific validation
    switch (operation.type) {
      case 'merge':
        if (!operation.mergeTarget) {
          errors.push('Merge target is required for merge operation');
        }
        break;

      case 'rename':
        if (operation.selectedTags.length !== 1) {
          errors.push('Rename operation can only be applied to a single tag');
        }
        if (!operation.targetValue) {
          errors.push('Target value is required for rename operation');
        }
        break;

      case 'replace':
        if (!operation.replacementTag) {
          errors.push('Replacement tag is required for replace operation');
        }
        break;
    }

    // Apply custom validation rules
    operation.selectedTags.forEach(tag => {
      this.validationRules.forEach(rule => {
        const result = rule.validator(tag, trades);
        if (!result.isValid) {
          if (rule.severity === 'error') {
            errors.push(`${rule.name}: ${result.message}`);
          } else {
            warnings.push(`${rule.name}: ${result.message}`);
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Preview the effects of a bulk operation without executing it
   */
  public previewOperation(
    operation: BulkTagOperation,
    trades: Trade[]
  ): {
    affectedTrades: number;
    changes: BulkOperationChange[];
    warnings: string[];
  } {
    const dryRunOperation = { ...operation, options: { ...operation.options, dryRun: true } };
    
    // Create a deep copy of trades for dry run
    const tradesCopy = JSON.parse(JSON.stringify(trades));
    
    // Execute dry run
    const result = this.executeBulkOperation(dryRunOperation, tradesCopy);
    
    return {
      affectedTrades: result.then ? 0 : (result as BulkOperationResult).affectedTrades,
      changes: result.then ? [] : (result as BulkOperationResult).changes,
      warnings: result.then ? [] : (result as BulkOperationResult).warnings
    };
  }

  /**
   * Rollback the last bulk operation
   */
  public rollbackLastOperation(trades: Trade[]): BulkOperationResult {
    const lastOperation = this.operationHistory[this.operationHistory.length - 1];
    
    if (!lastOperation || !lastOperation.rollbackData) {
      return {
        success: false,
        affectedTrades: 0,
        affectedTags: 0,
        errors: ['No operation to rollback or no backup data available'],
        warnings: [],
        changes: []
      };
    }

    try {
      // Restore from backup
      const backup = lastOperation.rollbackData;
      backup.forEach((backupTrade: Trade) => {
        const trade = trades.find(t => t.id === backupTrade.id);
        if (trade) {
          trade.tags = [...backupTrade.tags];
        }
      });

      // Remove from history
      this.operationHistory.pop();

      return {
        success: true,
        affectedTrades: lastOperation.affectedTrades,
        affectedTags: lastOperation.affectedTags,
        errors: [],
        warnings: ['Operation rolled back successfully'],
        changes: []
      };
    } catch (error) {
      return {
        success: false,
        affectedTrades: 0,
        affectedTags: 0,
        errors: [`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        changes: []
      };
    }
  }

  /**
   * Get operation history
   */
  public getOperationHistory(): BulkOperationResult[] {
    return [...this.operationHistory];
  }

  /**
   * Clear operation history
   */
  public clearHistory(): void {
    this.operationHistory = [];
  }

  /**
   * Create backup of current trade tags
   */
  private createBackup(trades: Trade[]): Trade[] {
    return trades.map(trade => ({
      ...trade,
      tags: trade.tags ? [...trade.tags] : []
    }));
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    this.validationRules = [
      {
        id: 'high_usage_warning',
        name: 'High Usage Tag',
        description: 'Warns when operating on frequently used tags',
        validator: (tag: string, trades: Trade[]) => {
          const tagTrades = trades.filter(trade => 
            trade.tags?.some(t => tagService.normalizeTag(t) === tagService.normalizeTag(tag))
          );
          
          if (tagTrades.length > 20) {
            return {
              isValid: false,
              message: `Tag "${tag}" is used in ${tagTrades.length} trades. Consider the impact carefully.`,
              suggestedAction: 'Review affected trades before proceeding'
            };
          }
          
          return { isValid: true, message: 'OK' };
        },
        severity: 'warning'
      },
      {
        id: 'performance_impact_warning',
        name: 'Performance Impact',
        description: 'Warns when operating on high-performing tags',
        validator: (tag: string, trades: Trade[]) => {
          const tagTrades = trades.filter(trade => 
            trade.tags?.some(t => tagService.normalizeTag(t) === tagService.normalizeTag(tag)) &&
            trade.status === 'closed'
          );
          
          if (tagTrades.length >= 5) {
            const winningTrades = tagTrades.filter(trade => (trade.pnl || 0) > 0);
            const winRate = (winningTrades.length / tagTrades.length) * 100;
            
            if (winRate > 70) {
              return {
                isValid: false,
                message: `Tag "${tag}" has a high win rate of ${winRate.toFixed(1)}%. Consider preserving it.`,
                suggestedAction: 'Consider renaming instead of deleting'
              };
            }
          }
          
          return { isValid: true, message: 'OK' };
        },
        severity: 'warning'
      },
      {
        id: 'duplicate_prevention',
        name: 'Duplicate Prevention',
        description: 'Prevents creation of duplicate tags',
        validator: (tag: string, trades: Trade[]) => {
          const normalizedTag = tagService.normalizeTag(tag);
          const existingTags = new Set<string>();
          
          trades.forEach(trade => {
            if (trade.tags) {
              trade.tags.forEach(t => existingTags.add(tagService.normalizeTag(t)));
            }
          });
          
          if (existingTags.has(normalizedTag)) {
            return {
              isValid: false,
              message: `Tag "${normalizedTag}" already exists`,
              suggestedAction: 'Use existing tag or choose a different name'
            };
          }
          
          return { isValid: true, message: 'OK' };
        },
        severity: 'error'
      }
    ];
  }

  /**
   * Add custom validation rule
   */
  public addValidationRule(rule: TagValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Remove validation rule
   */
  public removeValidationRule(ruleId: string): void {
    this.validationRules = this.validationRules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all validation rules
   */
  public getValidationRules(): TagValidationRule[] {
    return [...this.validationRules];
  }
}

// Export singleton instance
export const bulkTagOperationsService = BulkTagOperationsService.getInstance();
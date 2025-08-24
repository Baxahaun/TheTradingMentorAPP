/**
 * Trade Review Service
 * Manages review workflows, validation, and auto-save functionality
 */

import { 
  ReviewWorkflow, 
  ReviewStage, 
  TradeReviewData, 
  EnhancedTrade,
  ValidationResult,
  ValidationError,
  ConflictResolution,
  AutoSaveState,
  TradeNotes,
  NoteTemplate
} from '../types/tradeReview';
import { Trade } from '../types/trade';
import { tradeService } from './firebaseService';

export class TradeReviewService {
  private static instance: TradeReviewService;
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private autoSaveStates: Map<string, AutoSaveState> = new Map();
  
  // Default review stages
  private static readonly DEFAULT_REVIEW_STAGES: Omit<ReviewStage, 'completed' | 'completedAt'>[] = [
    {
      id: 'data_verification',
      name: 'Data Verification',
      description: 'Verify all trade data is accurate and complete',
      required: true,
      notes: ''
    },
    {
      id: 'technical_analysis',
      name: 'Technical Analysis Review',
      description: 'Review charts, patterns, and technical setup',
      required: true,
      notes: ''
    },
    {
      id: 'execution_analysis',
      name: 'Execution Analysis',
      description: 'Analyze trade execution and timing',
      required: true,
      notes: ''
    },
    {
      id: 'risk_management',
      name: 'Risk Management Review',
      description: 'Review risk management and position sizing',
      required: true,
      notes: ''
    },
    {
      id: 'lessons_learned',
      name: 'Lessons Learned',
      description: 'Document key takeaways and improvements',
      required: false,
      notes: ''
    }
  ];

  private constructor() {}

  public static getInstance(): TradeReviewService {
    if (!TradeReviewService.instance) {
      TradeReviewService.instance = new TradeReviewService();
    }
    return TradeReviewService.instance;
  }

  /**
   * Initialize a review workflow for a trade
   */
  public initializeReview(tradeId: string, customStages?: ReviewStage[]): ReviewWorkflow {
    const stages = customStages || TradeReviewService.DEFAULT_REVIEW_STAGES.map(stage => ({
      ...stage,
      completed: false,
      completedAt: undefined
    }));

    return {
      tradeId,
      stages,
      overallProgress: 0,
      startedAt: new Date().toISOString()
    };
  }  
/**
   * Update a review stage
   */
  public updateStage(
    workflow: ReviewWorkflow, 
    stageId: string, 
    completed: boolean, 
    notes?: string
  ): ReviewWorkflow {
    const updatedStages = workflow.stages.map(stage => {
      if (stage.id === stageId) {
        return {
          ...stage,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
          notes: notes || stage.notes
        };
      }
      return stage;
    });

    const completedStages = updatedStages.filter(stage => stage.completed);
    const overallProgress = (completedStages.length / updatedStages.length) * 100;
    
    const isComplete = updatedStages.every(stage => stage.completed || !stage.required);

    return {
      ...workflow,
      stages: updatedStages,
      overallProgress,
      completedAt: isComplete ? new Date().toISOString() : undefined
    };
  }

  /**
   * Get review progress for a trade
   */
  public getReviewProgress(trade: EnhancedTrade): ReviewWorkflow | null {
    return trade.reviewData?.reviewWorkflow || null;
  }

  /**
   * Mark review as complete
   */
  public markReviewComplete(workflow: ReviewWorkflow): ReviewWorkflow {
    const allRequiredCompleted = workflow.stages
      .filter(stage => stage.required)
      .every(stage => stage.completed);

    if (!allRequiredCompleted) {
      throw new Error('Cannot complete review: required stages are not completed');
    }

    return {
      ...workflow,
      overallProgress: 100,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Get incomplete reviews
   */
  public getIncompleteReviews(trades: EnhancedTrade[]): ReviewWorkflow[] {
    return trades
      .filter(trade => trade.reviewData?.reviewWorkflow && !trade.reviewData.reviewWorkflow.completedAt)
      .map(trade => trade.reviewData!.reviewWorkflow!)
      .filter(Boolean);
  }

  /**
   * Comprehensive trade validation
   */
  public validateTrade(trade: Partial<EnhancedTrade>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required field validation
    this.validateRequiredFields(trade, errors);
    
    // Numeric field validation
    this.validateNumericFields(trade, errors, warnings);
    
    // Date and time validation
    this.validateDateTimeFields(trade, errors, warnings);
    
    // Business logic validation
    this.validateBusinessLogic(trade, errors, warnings);
    
    // Review data validation
    this.validateReviewData(trade, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }  /**

   * Validate required fields
   */
  private validateRequiredFields(trade: Partial<EnhancedTrade>, errors: ValidationError[]): void {
    const requiredFields = [
      'currencyPair',
      'date',
      'timeIn',
      'side',
      'entryPrice',
      'lotSize',
      'lotType',
      'accountId',
      'accountCurrency'
    ];

    requiredFields.forEach(field => {
      const value = (trade as any)[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          field,
          code: 'REQUIRED_FIELD_MISSING',
          message: `${field} is required`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Validate numeric fields
   */
  private validateNumericFields(
    trade: Partial<EnhancedTrade>, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    const numericFields = [
      { field: 'entryPrice', min: 0, required: true },
      { field: 'exitPrice', min: 0, required: false },
      { field: 'stopLoss', min: 0, required: false },
      { field: 'takeProfit', min: 0, required: false },
      { field: 'lotSize', min: 0.01, required: true },
      { field: 'commission', min: 0, required: false },
      { field: 'swap', required: false },
      { field: 'riskAmount', min: 0, required: false },
      { field: 'leverage', min: 1, required: false },
      { field: 'confidence', min: 1, max: 10, required: false }
    ];

    numericFields.forEach(({ field, min, max, required }) => {
      const value = (trade as any)[field];
      
      if (value !== undefined && value !== null && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(numValue)) {
          errors.push({
            field,
            code: 'INVALID_NUMBER',
            message: `${field} must be a valid number`,
            severity: 'error'
          });
        } else {
          if (min !== undefined && numValue < min) {
            errors.push({
              field,
              code: 'VALUE_TOO_LOW',
              message: `${field} must be at least ${min}`,
              severity: 'error'
            });
          }
          
          if (max !== undefined && numValue > max) {
            errors.push({
              field,
              code: 'VALUE_TOO_HIGH',
              message: `${field} cannot exceed ${max}`,
              severity: 'error'
            });
          }
        }
      } else if (required) {
        errors.push({
          field,
          code: 'REQUIRED_FIELD_MISSING',
          message: `${field} is required`,
          severity: 'error'
        });
      }
    });
  }  /**
 
  * Validate date and time fields
   */
  private validateDateTimeFields(
    trade: Partial<EnhancedTrade>, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    // Date validation
    if (trade.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trade.date)) {
        errors.push({
          field: 'date',
          code: 'INVALID_DATE_FORMAT',
          message: 'Date must be in YYYY-MM-DD format',
          severity: 'error'
        });
      } else {
        const tradeDate = new Date(trade.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (tradeDate > today) {
          warnings.push({
            field: 'date',
            code: 'FUTURE_DATE',
            message: 'Trade date is in the future',
            severity: 'warning'
          });
        }
      }
    }

    // Time validation
    if (trade.timeIn) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(trade.timeIn)) {
        errors.push({
          field: 'timeIn',
          code: 'INVALID_TIME_FORMAT',
          message: 'Time must be in HH:MM format',
          severity: 'error'
        });
      }
    }

    if (trade.timeOut) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(trade.timeOut)) {
        errors.push({
          field: 'timeOut',
          code: 'INVALID_TIME_FORMAT',
          message: 'Exit time must be in HH:MM format',
          severity: 'error'
        });
      }
    }

    // Time sequence validation
    if (trade.timeIn && trade.timeOut && trade.date) {
      const entryDateTime = new Date(`${trade.date}T${trade.timeIn}`);
      const exitDateTime = new Date(`${trade.date}T${trade.timeOut}`);
      
      if (exitDateTime <= entryDateTime) {
        warnings.push({
          field: 'timeOut',
          code: 'EXIT_BEFORE_ENTRY',
          message: 'Exit time should be after entry time',
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Validate business logic
   */
  private validateBusinessLogic(
    trade: Partial<EnhancedTrade>, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    // Stop loss validation
    if (trade.entryPrice && trade.stopLoss) {
      const entry = typeof trade.entryPrice === 'string' ? parseFloat(trade.entryPrice) : trade.entryPrice;
      const stop = typeof trade.stopLoss === 'string' ? parseFloat(trade.stopLoss) : trade.stopLoss;
      
      if (trade.side === 'long' && stop >= entry) {
        warnings.push({
          field: 'stopLoss',
          code: 'INVALID_STOP_LOSS',
          message: 'Stop loss should be below entry price for long trades',
          severity: 'warning'
        });
      } else if (trade.side === 'short' && stop <= entry) {
        warnings.push({
          field: 'stopLoss',
          code: 'INVALID_STOP_LOSS',
          message: 'Stop loss should be above entry price for short trades',
          severity: 'warning'
        });
      }
    }

    // Take profit validation
    if (trade.entryPrice && trade.takeProfit) {
      const entry = typeof trade.entryPrice === 'string' ? parseFloat(trade.entryPrice) : trade.entryPrice;
      const target = typeof trade.takeProfit === 'string' ? parseFloat(trade.takeProfit) : trade.takeProfit;
      
      if (trade.side === 'long' && target <= entry) {
        warnings.push({
          field: 'takeProfit',
          code: 'INVALID_TAKE_PROFIT',
          message: 'Take profit should be above entry price for long trades',
          severity: 'warning'
        });
      } else if (trade.side === 'short' && target >= entry) {
        warnings.push({
          field: 'takeProfit',
          code: 'INVALID_TAKE_PROFIT',
          message: 'Take profit should be below entry price for short trades',
          severity: 'warning'
        });
      }
    }

    // Risk-reward validation
    if (trade.entryPrice && trade.stopLoss && trade.takeProfit) {
      const entry = typeof trade.entryPrice === 'string' ? parseFloat(trade.entryPrice) : trade.entryPrice;
      const stop = typeof trade.stopLoss === 'string' ? parseFloat(trade.stopLoss) : trade.stopLoss;
      const target = typeof trade.takeProfit === 'string' ? parseFloat(trade.takeProfit) : trade.takeProfit;
      
      const risk = Math.abs(entry - stop);
      const reward = Math.abs(target - entry);
      const riskRewardRatio = reward / risk;
      
      if (riskRewardRatio < 1) {
        warnings.push({
          field: 'takeProfit',
          code: 'POOR_RISK_REWARD',
          message: `Risk-reward ratio is ${riskRewardRatio.toFixed(2)}:1. Consider improving to at least 1:1`,
          severity: 'warning'
        });
      }
    }
  }  /**
 
  * Validate review data
   */
  private validateReviewData(
    trade: Partial<EnhancedTrade>, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    if (trade.reviewData) {
      // Validate notes
      if (trade.reviewData.notes) {
        const notes = trade.reviewData.notes;
        
        // Check note length limits
        Object.entries(notes).forEach(([key, value]) => {
          if (typeof value === 'string' && value.length > 5000) {
            warnings.push({
              field: `reviewData.notes.${key}`,
              code: 'NOTE_TOO_LONG',
              message: `${key} note is very long (${value.length} characters). Consider breaking it down.`,
              severity: 'warning'
            });
          }
        });
      }

      // Validate charts
      if (trade.reviewData.charts) {
        trade.reviewData.charts.forEach((chart, index) => {
          if (!chart.url || !chart.type || !chart.timeframe) {
            errors.push({
              field: `reviewData.charts[${index}]`,
              code: 'INCOMPLETE_CHART_DATA',
              message: `Chart ${index + 1} is missing required information`,
              severity: 'error'
            });
          }
        });
      }

      // Validate review workflow
      if (trade.reviewData.reviewWorkflow) {
        const workflow = trade.reviewData.reviewWorkflow;
        
        if (!workflow.tradeId || !workflow.stages || workflow.stages.length === 0) {
          errors.push({
            field: 'reviewData.reviewWorkflow',
            code: 'INVALID_WORKFLOW',
            message: 'Review workflow is incomplete',
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * Auto-save functionality
   */
  public enableAutoSave(
    tradeId: string, 
    userId: string, 
    interval: number = 30000, // 30 seconds
    onSave?: (success: boolean, error?: Error) => void,
    getTradeData?: () => Partial<EnhancedTrade>
  ): void {
    // Clear existing timer if any
    this.disableAutoSave(tradeId);

    // Initialize auto-save state
    this.autoSaveStates.set(tradeId, {
      isEnabled: true,
      interval,
      hasUnsavedChanges: false
    });

    // Set up auto-save timer
    const timer = setInterval(async () => {
      const state = this.autoSaveStates.get(tradeId);
      if (state?.hasUnsavedChanges && getTradeData) {
        try {
          const tradeData = getTradeData();
          const result = await this.saveTradeWithConflictResolution(
            userId,
            tradeId,
            tradeData,
            'merge'
          );
          
          if (result.success) {
            state.hasUnsavedChanges = false;
            state.lastSaved = new Date().toISOString();
            onSave?.(true);
          } else {
            onSave?.(false, result.error);
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
          onSave?.(false, error as Error);
        }
      }
    }, interval);

    this.autoSaveTimers.set(tradeId, timer);
  }

  /**
   * Disable auto-save for a trade
   */
  public disableAutoSave(tradeId: string): void {
    const timer = this.autoSaveTimers.get(tradeId);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(tradeId);
    }
    
    const state = this.autoSaveStates.get(tradeId);
    if (state) {
      state.isEnabled = false;
    }
  }

  /**
   * Mark trade as having unsaved changes
   */
  public markUnsavedChanges(tradeId: string): void {
    const state = this.autoSaveStates.get(tradeId);
    if (state) {
      state.hasUnsavedChanges = true;
    }
  }

  /**
   * Get auto-save state
   */
  public getAutoSaveState(tradeId: string): AutoSaveState | undefined {
    return this.autoSaveStates.get(tradeId);
  }  /**

   * Handle conflict resolution for concurrent edits
   */
  public resolveConflict(
    tradeId: string,
    localVersion: Partial<EnhancedTrade>,
    remoteVersion: Partial<EnhancedTrade>,
    strategy: 'merge' | 'overwrite' | 'manual' = 'merge'
  ): ConflictResolution {
    const conflictedFields: string[] = [];
    
    // Find conflicted fields
    Object.keys(localVersion).forEach(key => {
      const localValue = (localVersion as any)[key];
      const remoteValue = (remoteVersion as any)[key];
      
      if (localValue !== remoteValue && 
          localValue !== undefined && 
          remoteValue !== undefined) {
        conflictedFields.push(key);
      }
    });

    let resolvedVersion: Partial<EnhancedTrade> = {};

    switch (strategy) {
      case 'merge':
        // Merge strategy: prefer local changes for most fields,
        // but use remote for system-generated fields
        resolvedVersion = { ...remoteVersion, ...localVersion };
        
        // Always use remote version for system fields
        const systemFields = ['id', 'lastModified', 'version'];
        systemFields.forEach(field => {
          if ((remoteVersion as any)[field] !== undefined) {
            (resolvedVersion as any)[field] = (remoteVersion as any)[field];
          }
        });
        break;
        
      case 'overwrite':
        // Overwrite strategy: use local version completely
        resolvedVersion = localVersion;
        break;
        
      case 'manual':
        // Manual strategy: don't resolve automatically
        resolvedVersion = undefined;
        break;
    }

    return {
      strategy,
      conflictedFields,
      localVersion,
      remoteVersion,
      resolvedVersion
    };
  }

  /**
   * Save trade with conflict resolution
   */
  public async saveTradeWithConflictResolution(
    userId: string,
    tradeId: string,
    tradeData: Partial<EnhancedTrade>,
    strategy: 'merge' | 'overwrite' | 'manual' = 'merge'
  ): Promise<{ success: boolean; conflict?: ConflictResolution; error?: Error }> {
    try {
      // Get current remote version
      const currentTrade = await tradeService.getTrade(userId, tradeId);
      
      if (!currentTrade) {
        // Trade doesn't exist, create new
        const newTradeId = await tradeService.addTrade(userId, tradeData as any);
        
        // Update auto-save state
        const state = this.autoSaveStates.get(tradeId);
        if (state) {
          state.hasUnsavedChanges = false;
          state.lastSaved = new Date().toISOString();
        }
        
        return { success: true };
      }

      // Check for conflicts
      const hasConflicts = this.hasConflicts(tradeData, currentTrade);
      
      if (!hasConflicts) {
        // No conflicts, save directly
        await tradeService.updateTrade(userId, tradeId, tradeData);
        
        // Update auto-save state
        const state = this.autoSaveStates.get(tradeId);
        if (state) {
          state.hasUnsavedChanges = false;
          state.lastSaved = new Date().toISOString();
        }
        
        return { success: true };
      }

      // Handle conflicts
      const conflictResolution = this.resolveConflict(
        tradeId,
        tradeData,
        currentTrade,
        strategy
      );

      if (strategy === 'manual' || !conflictResolution.resolvedVersion) {
        // Return conflict for manual resolution
        return { success: false, conflict: conflictResolution };
      }

      // Save resolved version
      await tradeService.updateTrade(userId, tradeId, conflictResolution.resolvedVersion);
      
      // Update auto-save state
      const state = this.autoSaveStates.get(tradeId);
      if (state) {
        state.hasUnsavedChanges = false;
        state.lastSaved = new Date().toISOString();
      }
      
      return { success: true, conflict: conflictResolution };

    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Check if there are conflicts between local and remote versions
   */
  private hasConflicts(
    localVersion: Partial<EnhancedTrade>,
    remoteVersion: EnhancedTrade
  ): boolean {
    // Simple conflict detection based on lastModified timestamp
    // In a real implementation, you might want more sophisticated conflict detection
    const localModified = (localVersion as any).lastModified;
    const remoteModified = remoteVersion.reviewData?.lastReviewedAt;
    
    if (!localModified || !remoteModified) {
      return false;
    }

    return new Date(localModified) < new Date(remoteModified);
  }

  /**
   * Get default note templates
   */
  public getDefaultNoteTemplates(): NoteTemplate[] {
    return [
      {
        id: 'swing_trade_template',
        name: 'Swing Trade Analysis',
        category: 'strategy',
        description: 'Template for swing trading analysis',
        template: {
          preTradeAnalysis: 'Market Structure:\n- Higher timeframe trend:\n- Key levels:\n- Confluence factors:\n\nSetup:\n- Entry reason:\n- Risk management plan:',
          executionNotes: 'Entry execution:\n- Fill quality:\n- Slippage:\n- Market conditions at entry:',
          postTradeReflection: 'Trade outcome:\n- What went well:\n- What could be improved:\n- Market behavior vs expectations:',
          lessonsLearned: 'Key takeaways:\n- Technical lessons:\n- Psychological insights:\n- Process improvements:'
        }
      },
      {
        id: 'scalping_template',
        name: 'Scalping Trade Review',
        category: 'strategy',
        description: 'Template for scalping trade analysis',
        template: {
          preTradeAnalysis: 'Market conditions:\n- Volatility:\n- Volume:\n- News events:\n\nSetup:\n- Entry signal:\n- Target and stop:',
          executionNotes: 'Execution quality:\n- Entry timing:\n- Exit timing:\n- Platform performance:',
          postTradeReflection: 'Result analysis:\n- Profit/loss:\n- Execution efficiency:\n- Market reaction:',
          lessonsLearned: 'Improvements:\n- Timing:\n- Risk management:\n- Platform optimization:'
        }
      }
    ];
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Clear all auto-save timers
    this.autoSaveTimers.forEach(timer => clearInterval(timer));
    this.autoSaveTimers.clear();
    this.autoSaveStates.clear();
  }
}
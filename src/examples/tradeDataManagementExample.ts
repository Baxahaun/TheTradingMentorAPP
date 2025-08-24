/**
 * Example usage of the enhanced trade data management system
 * This demonstrates how to use the TradeReviewService, validation, and auto-save functionality
 */

import { TradeReviewService } from '../lib/tradeReviewService';
import { TradeFormValidation } from '../lib/tradeFormValidation';
import { useTradeValidation } from '../hooks/useTradeValidation';
import { useAutoSave } from '../hooks/useAutoSave';
import { EnhancedTrade } from '../types/tradeReview';

// Example: Complete trade data management workflow
export class TradeDataManagementExample {
  private reviewService: TradeReviewService;

  constructor() {
    this.reviewService = TradeReviewService.getInstance();
  }

  /**
   * Example 1: Initialize and manage a review workflow
   */
  async initializeTradeReview(tradeId: string): Promise<void> {
    // Initialize review workflow
    const workflow = this.reviewService.initializeReview(tradeId);
    console.log('Initialized review workflow:', workflow);

    // Update a review stage
    const updatedWorkflow = this.reviewService.updateStage(
      workflow,
      'data_verification',
      true,
      'All trade data has been verified and is accurate'
    );
    console.log('Updated workflow progress:', updatedWorkflow.overallProgress);

    // Check if review is complete
    const allRequiredCompleted = updatedWorkflow.stages
      .filter(stage => stage.required)
      .every(stage => stage.completed);

    if (allRequiredCompleted) {
      const completedWorkflow = this.reviewService.markReviewComplete(updatedWorkflow);
      console.log('Review completed at:', completedWorkflow.completedAt);
    }
  }

  /**
   * Example 2: Comprehensive trade validation
   */
  validateTradeData(tradeData: Partial<EnhancedTrade>): void {
    // Basic validation
    const validationResult = this.reviewService.validateTrade(tradeData);
    console.log('Validation result:', validationResult);

    // Field-specific validation
    const currencyPairErrors = TradeFormValidation.validateField('currencyPair', tradeData.currencyPair);
    console.log('Currency pair validation:', currencyPairErrors);

    // Cross-field validation
    const crossFieldErrors = TradeFormValidation.validateCrossFields(tradeData);
    console.log('Cross-field validation:', crossFieldErrors);

    // Get validation summary
    const summary = TradeFormValidation.getValidationSummary(tradeData);
    console.log('Validation summary:', summary);

    // Check if ready for completion
    const completionErrors = TradeFormValidation.validateTradeCompletion(tradeData);
    console.log('Completion validation:', completionErrors);
  }

  /**
   * Example 3: Auto-save with conflict resolution
   */
  async demonstrateAutoSave(userId: string, tradeId: string, tradeData: Partial<EnhancedTrade>): Promise<void> {
    // Enable auto-save
    this.reviewService.enableAutoSave(
      tradeId,
      userId,
      10000, // 10 seconds
      (success, error) => {
        if (success) {
          console.log('Auto-save successful');
        } else {
          console.error('Auto-save failed:', error);
        }
      },
      () => tradeData // Function to get current trade data
    );

    // Mark changes
    this.reviewService.markUnsavedChanges(tradeId);

    // Manual save with conflict resolution
    const saveResult = await this.reviewService.saveTradeWithConflictResolution(
      userId,
      tradeId,
      tradeData,
      'merge'
    );

    if (saveResult.success) {
      console.log('Trade saved successfully');
    } else if (saveResult.conflict) {
      console.log('Conflict detected:', saveResult.conflict);
      // Handle conflict resolution UI here
    } else {
      console.error('Save failed:', saveResult.error);
    }
  }

  /**
   * Example 4: Working with note templates
   */
  demonstrateNoteTemplates(): void {
    // Get default templates
    const templates = this.reviewService.getDefaultNoteTemplates();
    console.log('Available templates:', templates.map(t => t.name));

    // Use a template
    const swingTemplate = templates.find(t => t.id === 'swing_trade_template');
    if (swingTemplate) {
      console.log('Swing trade template:', swingTemplate.template);
    }
  }

  /**
   * Example 5: Complete trade review process
   */
  async completeTradeReviewProcess(
    userId: string,
    tradeId: string,
    tradeData: Partial<EnhancedTrade>
  ): Promise<void> {
    try {
      // Step 1: Validate trade data
      const validation = this.reviewService.validateTrade(tradeData);
      if (!validation.isValid) {
        console.error('Trade validation failed:', validation.errors);
        return;
      }

      // Step 2: Initialize review workflow
      let workflow = this.reviewService.initializeReview(tradeId);

      // Step 3: Complete review stages
      const stages = [
        { id: 'data_verification', notes: 'All data verified' },
        { id: 'technical_analysis', notes: 'Chart analysis completed' },
        { id: 'execution_analysis', notes: 'Execution timing reviewed' },
        { id: 'risk_management', notes: 'Risk management assessed' },
        { id: 'lessons_learned', notes: 'Key lessons documented' }
      ];

      for (const stage of stages) {
        workflow = this.reviewService.updateStage(workflow, stage.id, true, stage.notes);
        console.log(`Completed stage: ${stage.id}`);
      }

      // Step 4: Mark review as complete
      const completedWorkflow = this.reviewService.markReviewComplete(workflow);

      // Step 5: Save the trade with review data
      const enhancedTrade: Partial<EnhancedTrade> = {
        ...tradeData,
        reviewData: {
          reviewWorkflow: completedWorkflow,
          lastReviewedAt: new Date().toISOString(),
          reviewCompletionScore: 100
        }
      };

      const saveResult = await this.reviewService.saveTradeWithConflictResolution(
        userId,
        tradeId,
        enhancedTrade
      );

      if (saveResult.success) {
        console.log('Trade review process completed successfully');
      } else {
        console.error('Failed to save completed review:', saveResult.error);
      }

    } catch (error) {
      console.error('Error in trade review process:', error);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.reviewService.cleanup();
  }
}

// Example usage in a React component context
export const useTradeDataManagement = (tradeId: string, initialTradeData: Partial<EnhancedTrade>) => {
  // Use validation hook
  const validation = useTradeValidation(initialTradeData, {
    validateOnChange: true,
    debounceMs: 500
  });

  // Use auto-save hook
  const autoSave = useAutoSave(tradeId, initialTradeData, {
    interval: 30000,
    enabled: true,
    onSave: (success, error) => {
      if (success) {
        console.log('Auto-save successful');
      } else {
        console.error('Auto-save failed:', error);
      }
    },
    onConflict: (conflict) => {
      console.log('Conflict detected:', conflict);
      // Handle conflict resolution in UI
    }
  });

  return {
    validation,
    autoSave,
    isValid: validation.isValid,
    hasErrors: validation.hasErrors,
    hasWarnings: validation.hasWarnings,
    hasUnsavedChanges: autoSave.hasUnsavedChanges
  };
};

// Example trade data for testing
export const exampleTradeData: Partial<EnhancedTrade> = {
  currencyPair: 'EUR/USD',
  date: '2024-01-15',
  timeIn: '14:30',
  timeOut: '16:45',
  side: 'long',
  entryPrice: 1.1000,
  exitPrice: 1.1050,
  stopLoss: 1.0950,
  takeProfit: 1.1100,
  lotSize: 1.0,
  lotType: 'standard',
  commission: 7.50,
  accountId: 'account-123',
  accountCurrency: 'USD',
  strategy: 'Trend Following',
  notes: 'Strong bullish momentum on EUR/USD',
  status: 'closed',
  reviewData: {
    notes: {
      preTradeAnalysis: 'Market showing strong uptrend with good momentum',
      executionNotes: 'Entry executed at planned level with minimal slippage',
      postTradeReflection: 'Trade went as expected, good risk management',
      lessonsLearned: 'Patience with entry timing paid off',
      generalNotes: 'Overall successful trade execution',
      lastModified: new Date().toISOString(),
      version: 1
    }
  }
};
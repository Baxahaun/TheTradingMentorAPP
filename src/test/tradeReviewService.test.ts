import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TradeReviewService } from '../lib/tradeReviewService';
import { TradeFormValidation } from '../lib/tradeFormValidation';
import { EnhancedTrade } from '../types/tradeReview';

vi.mock('../lib/firebaseService', () => ({
  tradeService: {
    getTrades: vi.fn(),
    getTrade: vi.fn(),
    addTrade: vi.fn(),
    updateTrade: vi.fn(),
    deleteTrade: vi.fn()
  }
}));

describe('TradeReviewService', () => {
  let service: TradeReviewService;

  beforeEach(() => {
    service = TradeReviewService.getInstance();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Review Workflow Management', () => {
    it('should initialize a review workflow', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      expect(workflow.tradeId).toBe('test-trade-1');
      expect(workflow.stages).toHaveLength(5);
      expect(workflow.overallProgress).toBe(0);
      expect(workflow.startedAt).toBeDefined();
    });

    it('should update review stage', () => {
      const workflow = service.initializeReview('test-trade-1');
      const updated = service.updateStage(workflow, 'data_verification', true, 'All data verified');
      
      const stage = updated.stages.find(s => s.id === 'data_verification');
      expect(stage?.completed).toBe(true);
      expect(stage?.notes).toBe('All data verified');
      expect(stage?.completedAt).toBeDefined();
      expect(updated.overallProgress).toBe(20);
    });

    it('should mark review as complete when all required stages are done', () => {
      let workflow = service.initializeReview('test-trade-1');
      
      // Complete all required stages
      const requiredStages = workflow.stages.filter(s => s.required);
      requiredStages.forEach(stage => {
        workflow = service.updateStage(workflow, stage.id, true);
      });

      const completed = service.markReviewComplete(workflow);
      expect(completed.overallProgress).toBe(100);
      expect(completed.completedAt).toBeDefined();
    });

    it('should throw error when trying to complete review with incomplete required stages', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      expect(() => service.markReviewComplete(workflow)).toThrow(
        'Cannot complete review: required stages are not completed'
      );
    });
  });

  describe('Trade Validation', () => {
    it('should validate required fields', () => {
      const incompleteTrade = {
        currencyPair: 'EUR/USD'
      };
      
      const result = service.validateTrade(incompleteTrade);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'date')).toBe(true);
      expect(result.errors.some(e => e.field === 'timeIn')).toBe(true);
    });

    it('should validate numeric fields', () => {
      const tradeWithInvalidNumbers = {
        currencyPair: 'EUR/USD',
        entryPrice: 'invalid',
        lotSize: -1
      };
      
      const result = service.validateTrade(tradeWithInvalidNumbers);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_NUMBER')).toBe(true);
      expect(result.errors.some(e => e.code === 'VALUE_TOO_LOW')).toBe(true);
    });

    it('should validate business logic', () => {
      const tradeWithPoorRiskReward: Partial<EnhancedTrade> = {
        currencyPair: 'EUR/USD',
        side: 'long',
        entryPrice: 1.1000,
        stopLoss: 1.0950,
        takeProfit: 1.1010 // Very poor risk-reward ratio
      };
      
      const result = service.validateTrade(tradeWithPoorRiskReward);
      
      expect(result.warnings.some(w => w.code === 'POOR_RISK_REWARD')).toBe(true);
    });

    it('should validate date and time fields', () => {
      const tradeWithInvalidDateTime = {
        date: 'invalid-date', // Invalid date format
        timeIn: '25:70' // Invalid time
      };
      
      const result = service.validateTrade(tradeWithInvalidDateTime);
      
      expect(result.errors.some(e => e.code === 'INVALID_DATE_FORMAT')).toBe(true);
      expect(result.errors.some(e => e.code === 'INVALID_TIME_FORMAT')).toBe(true);
    });
  });

  describe('Auto-save Functionality', () => {
    it('should enable auto-save', () => {
      const mockOnSave = vi.fn();
      const mockGetTradeData = vi.fn(() => ({ currencyPair: 'EUR/USD' }));
      
      service.enableAutoSave('test-trade', 'user-123', 1000, mockOnSave, mockGetTradeData);
      
      const state = service.getAutoSaveState('test-trade');
      expect(state?.isEnabled).toBe(true);
      expect(state?.interval).toBe(1000);
    });

    it('should mark unsaved changes', () => {
      service.enableAutoSave('test-trade', 'user-123');
      service.markUnsavedChanges('test-trade');
      
      const state = service.getAutoSaveState('test-trade');
      expect(state?.hasUnsavedChanges).toBe(true);
    });

    it('should disable auto-save', () => {
      service.enableAutoSave('test-trade', 'user-123');
      service.disableAutoSave('test-trade');
      
      const state = service.getAutoSaveState('test-trade');
      expect(state?.isEnabled).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts with merge strategy', () => {
      const localVersion = { currencyPair: 'EUR/USD', notes: 'Local notes' };
      const remoteVersion = { currencyPair: 'GBP/USD', commission: 5 };
      
      const resolution = service.resolveConflict(
        'test-trade',
        localVersion,
        remoteVersion,
        'merge'
      );
      
      expect(resolution.strategy).toBe('merge');
      expect(resolution.conflictedFields).toContain('currencyPair');
      expect(resolution.resolvedVersion?.currencyPair).toBe('EUR/USD'); // Local wins
      expect(resolution.resolvedVersion?.commission).toBe(5); // Remote preserved
    });

    it('should resolve conflicts with overwrite strategy', () => {
      const localVersion = { currencyPair: 'EUR/USD', notes: 'Local notes' };
      const remoteVersion = { currencyPair: 'GBP/USD', commission: 5 };
      
      const resolution = service.resolveConflict(
        'test-trade',
        localVersion,
        remoteVersion,
        'overwrite'
      );
      
      expect(resolution.strategy).toBe('overwrite');
      expect(resolution.resolvedVersion).toEqual(localVersion);
    });

    it('should handle manual conflict resolution', () => {
      const localVersion = { currencyPair: 'EUR/USD' };
      const remoteVersion = { currencyPair: 'GBP/USD' };
      
      const resolution = service.resolveConflict(
        'test-trade',
        localVersion,
        remoteVersion,
        'manual'
      );
      
      expect(resolution.strategy).toBe('manual');
      expect(resolution.resolvedVersion).toBeUndefined();
    });
  });

  describe('Note Templates', () => {
    it('should provide default note templates', () => {
      const templates = service.getDefaultNoteTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('template');
      expect(templates[0]).toHaveProperty('category');
    });

    it('should have swing trade template', () => {
      const templates = service.getDefaultNoteTemplates();
      const swingTemplate = templates.find(t => t.id === 'swing_trade_template');
      
      expect(swingTemplate).toBeDefined();
      expect(swingTemplate?.template.preTradeAnalysis).toContain('Market Structure');
    });
  });
});

describe('TradeFormValidation', () => {
  describe('Field Validation', () => {
    it('should validate currency pair format', () => {
      const errors = TradeFormValidation.validateField('currencyPair', 'INVALID');
      expect(errors.some(e => e.code === 'INVALID_FORMAT')).toBe(true);
      
      const validErrors = TradeFormValidation.validateField('currencyPair', 'EUR/USD');
      expect(validErrors.length).toBe(0);
    });

    it('should validate required fields', () => {
      const errors = TradeFormValidation.validateField('currencyPair', '');
      expect(errors.some(e => e.code === 'REQUIRED_FIELD_MISSING')).toBe(true);
    });

    it('should validate numeric fields', () => {
      const errors = TradeFormValidation.validateField('entryPrice', 'invalid');
      expect(errors.some(e => e.code === 'INVALID_PRICE')).toBe(true);
      
      const negativeErrors = TradeFormValidation.validateField('entryPrice', -1);
      expect(negativeErrors.some(e => e.code === 'INVALID_PRICE')).toBe(true);
    });

    it('should validate time format', () => {
      const errors = TradeFormValidation.validateField('timeIn', '25:70');
      expect(errors.some(e => e.code === 'INVALID_TIME_FORMAT')).toBe(true);
      
      const validErrors = TradeFormValidation.validateField('timeIn', '14:30');
      expect(validErrors.length).toBe(0);
    });
  });

  describe('Cross-field Validation', () => {
    it('should validate risk-reward ratio', () => {
      const tradeData = {
        entryPrice: 1.1000,
        stopLoss: 1.0950,
        takeProfit: 1.1010,
        side: 'long' as const
      };
      
      // Risk = 1.1000 - 1.0950 = 0.0050
      // Reward = 1.1010 - 1.1000 = 0.0010
      // Risk-reward ratio = 0.0010 / 0.0050 = 0.2 (very poor)
      
      const errors = TradeFormValidation.validateCrossFields(tradeData);
      expect(errors.some(e => e.code === 'VERY_POOR_RISK_REWARD')).toBe(true);
    });

    it('should validate time sequence', () => {
      const tradeData = {
        date: '2024-01-01',
        timeIn: '14:00',
        timeOut: '13:00' // Exit before entry
      };
      
      const errors = TradeFormValidation.validateCrossFields(tradeData);
      expect(errors.some(e => e.code === 'EXIT_BEFORE_ENTRY')).toBe(true);
    });
  });

  describe('Trade Completion Validation', () => {
    it('should validate required fields for completion', () => {
      const incompleteTrade = { currencyPair: 'EUR/USD' };
      
      const errors = TradeFormValidation.validateTradeCompletion(incompleteTrade);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'REQUIRED_FOR_COMPLETION')).toBe(true);
    });

    it('should validate closed trade requirements', () => {
      const closedTrade = {
        status: 'closed' as const,
        currencyPair: 'EUR/USD',
        entryPrice: 1.1000
        // Missing exitPrice and timeOut
      };
      
      const errors = TradeFormValidation.validateTradeCompletion(closedTrade);
      expect(errors.some(e => e.code === 'REQUIRED_FOR_CLOSED_TRADE')).toBe(true);
    });
  });

  describe('Validation Summary', () => {
    it('should provide comprehensive validation summary', () => {
      const tradeData = {
        currencyPair: 'INVALID',
        entryPrice: -1,
        stopLoss: 1.0950,
        takeProfit: 1.1010
      };
      
      const summary = TradeFormValidation.getValidationSummary(tradeData);
      
      expect(summary.isValid).toBe(false);
      expect(summary.errorCount).toBeGreaterThan(0);
      expect(summary.errors.length).toBeGreaterThan(0);
    });
  });
});
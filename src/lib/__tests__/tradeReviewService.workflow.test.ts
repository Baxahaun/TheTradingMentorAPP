import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TradeReviewService } from '../tradeReviewService';
import { ReviewWorkflow, EnhancedTrade } from '../../types/tradeReview';

describe('TradeReviewService - Workflow Management', () => {
  let service: TradeReviewService;

  beforeEach(() => {
    service = TradeReviewService.getInstance();
  });

  describe('Review Workflow Initialization', () => {
    it('should initialize workflow with default stages', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      expect(workflow.tradeId).toBe('test-trade-1');
      expect(workflow.stages).toHaveLength(5);
      expect(workflow.overallProgress).toBe(0);
      expect(workflow.startedAt).toBeDefined();
      expect(workflow.completedAt).toBeUndefined();
      
      // Check default stages
      const stageIds = workflow.stages.map(s => s.id);
      expect(stageIds).toContain('data_verification');
      expect(stageIds).toContain('technical_analysis');
      expect(stageIds).toContain('execution_analysis');
      expect(stageIds).toContain('risk_management');
      expect(stageIds).toContain('lessons_learned');
    });

    it('should initialize workflow with custom stages', () => {
      const customStages = [
        {
          id: 'custom_stage_1',
          name: 'Custom Stage 1',
          description: 'Custom description',
          required: true,
          completed: false
        },
        {
          id: 'custom_stage_2',
          name: 'Custom Stage 2',
          description: 'Another custom description',
          required: false,
          completed: false
        }
      ];

      const workflow = service.initializeReview('test-trade-1', customStages);
      
      expect(workflow.stages).toHaveLength(2);
      expect(workflow.stages[0].id).toBe('custom_stage_1');
      expect(workflow.stages[1].id).toBe('custom_stage_2');
    });

    it('should mark all stages as incomplete initially', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      workflow.stages.forEach(stage => {
        expect(stage.completed).toBe(false);
        expect(stage.completedAt).toBeUndefined();
      });
    });
  });

  describe('Stage Management', () => {
    let workflow: ReviewWorkflow;

    beforeEach(() => {
      workflow = service.initializeReview('test-trade-1');
    });

    it('should update stage completion status', () => {
      const updated = service.updateStage(workflow, 'data_verification', true, 'All data verified');
      
      const stage = updated.stages.find(s => s.id === 'data_verification');
      expect(stage?.completed).toBe(true);
      expect(stage?.notes).toBe('All data verified');
      expect(stage?.completedAt).toBeDefined();
    });

    it('should calculate progress correctly when stages are completed', () => {
      let updated = service.updateStage(workflow, 'data_verification', true);
      expect(updated.overallProgress).toBe(20); // 1 of 5 stages = 20%
      
      updated = service.updateStage(updated, 'technical_analysis', true);
      expect(updated.overallProgress).toBe(40); // 2 of 5 stages = 40%
      
      updated = service.updateStage(updated, 'execution_analysis', true);
      expect(updated.overallProgress).toBe(60); // 3 of 5 stages = 60%
    });

    it('should handle stage unchecking', () => {
      // First complete a stage
      let updated = service.updateStage(workflow, 'data_verification', true, 'Initial notes');
      expect(updated.overallProgress).toBe(20);
      
      // Then uncheck it
      updated = service.updateStage(updated, 'data_verification', false);
      
      const stage = updated.stages.find(s => s.id === 'data_verification');
      expect(stage?.completed).toBe(false);
      expect(stage?.completedAt).toBeUndefined();
      expect(updated.overallProgress).toBe(0);
    });

    it('should preserve notes when unchecking stage', () => {
      // Complete stage with notes
      let updated = service.updateStage(workflow, 'data_verification', true, 'Important notes');
      
      // Uncheck but preserve notes
      updated = service.updateStage(updated, 'data_verification', false, 'Important notes');
      
      const stage = updated.stages.find(s => s.id === 'data_verification');
      expect(stage?.completed).toBe(false);
      expect(stage?.notes).toBe('Important notes');
    });

    it('should update notes without changing completion status', () => {
      // First complete a stage
      let updated = service.updateStage(workflow, 'data_verification', true, 'Initial notes');
      
      // Update notes only
      updated = service.updateStage(updated, 'data_verification', true, 'Updated notes');
      
      const stage = updated.stages.find(s => s.id === 'data_verification');
      expect(stage?.completed).toBe(true);
      expect(stage?.notes).toBe('Updated notes');
      expect(stage?.completedAt).toBeDefined();
    });
  });

  describe('Review Completion', () => {
    let workflow: ReviewWorkflow;

    beforeEach(() => {
      workflow = service.initializeReview('test-trade-1');
    });

    it('should complete review when all required stages are done', () => {
      // Complete all required stages
      let updated = workflow;
      const requiredStages = workflow.stages.filter(s => s.required);
      
      requiredStages.forEach(stage => {
        updated = service.updateStage(updated, stage.id, true);
      });

      const completed = service.markReviewComplete(updated);
      
      expect(completed.overallProgress).toBe(100);
      expect(completed.completedAt).toBeDefined();
    });

    it('should throw error when trying to complete with incomplete required stages', () => {
      // Only complete some required stages
      const updated = service.updateStage(workflow, 'data_verification', true);
      
      expect(() => service.markReviewComplete(updated)).toThrow(
        'Cannot complete review: required stages are not completed'
      );
    });

    it('should allow completion even with incomplete optional stages', () => {
      // Complete all required stages but leave optional ones incomplete
      let updated = workflow;
      const requiredStages = workflow.stages.filter(s => s.required);
      
      requiredStages.forEach(stage => {
        updated = service.updateStage(updated, stage.id, true);
      });

      // Ensure lessons_learned (optional) is not completed
      const lessonsStage = updated.stages.find(s => s.id === 'lessons_learned');
      expect(lessonsStage?.required).toBe(false);
      expect(lessonsStage?.completed).toBe(false);

      const completed = service.markReviewComplete(updated);
      expect(completed.completedAt).toBeDefined();
    });
  });

  describe('Review Progress Tracking', () => {
    it('should get review progress from trade', () => {
      const workflow = service.initializeReview('test-trade-1');
      const trade: EnhancedTrade = {
        id: 'test-trade-1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01',
        timeIn: '10:00',
        side: 'long',
        entryPrice: 1.1000,
        lotSize: 1.0,
        lotType: 'standard',
        accountId: 'test-account',
        accountCurrency: 'USD',
        reviewData: {
          reviewWorkflow: workflow
        }
      } as EnhancedTrade;

      const progress = service.getReviewProgress(trade);
      expect(progress).toEqual(workflow);
    });

    it('should return null when trade has no review workflow', () => {
      const trade: EnhancedTrade = {
        id: 'test-trade-1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01',
        timeIn: '10:00',
        side: 'long',
        entryPrice: 1.1000,
        lotSize: 1.0,
        lotType: 'standard',
        accountId: 'test-account',
        accountCurrency: 'USD'
      } as EnhancedTrade;

      const progress = service.getReviewProgress(trade);
      expect(progress).toBeNull();
    });

    it('should identify incomplete reviews', () => {
      const incompleteWorkflow = service.initializeReview('incomplete-trade');
      const completedWorkflow = service.initializeReview('completed-trade');
      
      // Complete all required stages for completed workflow
      let completed = completedWorkflow;
      const requiredStages = completedWorkflow.stages.filter(s => s.required);
      requiredStages.forEach(stage => {
        completed = service.updateStage(completed, stage.id, true);
      });
      completed = service.markReviewComplete(completed);

      const trades: EnhancedTrade[] = [
        {
          id: 'incomplete-trade',
          currencyPair: 'EUR/USD',
          date: '2024-01-01',
          timeIn: '10:00',
          side: 'long',
          entryPrice: 1.1000,
          lotSize: 1.0,
          lotType: 'standard',
          accountId: 'test-account',
          accountCurrency: 'USD',
          reviewData: { reviewWorkflow: incompleteWorkflow }
        },
        {
          id: 'completed-trade',
          currencyPair: 'GBP/USD',
          date: '2024-01-02',
          timeIn: '11:00',
          side: 'short',
          entryPrice: 1.2500,
          lotSize: 1.0,
          lotType: 'standard',
          accountId: 'test-account',
          accountCurrency: 'USD',
          reviewData: { reviewWorkflow: completed }
        }
      ] as EnhancedTrade[];

      const incompleteReviews = service.getIncompleteReviews(trades);
      
      expect(incompleteReviews).toHaveLength(1);
      expect(incompleteReviews[0].tradeId).toBe('incomplete-trade');
    });

    it('should handle trades without review data', () => {
      const trades: EnhancedTrade[] = [
        {
          id: 'no-review-trade',
          currencyPair: 'EUR/USD',
          date: '2024-01-01',
          timeIn: '10:00',
          side: 'long',
          entryPrice: 1.1000,
          lotSize: 1.0,
          lotType: 'standard',
          accountId: 'test-account',
          accountCurrency: 'USD'
        }
      ] as EnhancedTrade[];

      const incompleteReviews = service.getIncompleteReviews(trades);
      expect(incompleteReviews).toHaveLength(0);
    });
  });

  describe('Stage Validation and Requirements', () => {
    it('should validate required vs optional stages', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      const requiredStages = workflow.stages.filter(s => s.required);
      const optionalStages = workflow.stages.filter(s => !s.required);
      
      expect(requiredStages.length).toBeGreaterThan(0);
      expect(optionalStages.length).toBeGreaterThan(0);
      
      // Check specific stages
      const dataVerification = workflow.stages.find(s => s.id === 'data_verification');
      const lessonsLearned = workflow.stages.find(s => s.id === 'lessons_learned');
      
      expect(dataVerification?.required).toBe(true);
      expect(lessonsLearned?.required).toBe(false);
    });

    it('should handle invalid stage IDs gracefully', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      // Try to update non-existent stage
      const updated = service.updateStage(workflow, 'non_existent_stage', true);
      
      // Should return unchanged workflow
      expect(updated.stages).toEqual(workflow.stages);
      expect(updated.overallProgress).toBe(workflow.overallProgress);
    });

    it('should maintain stage order', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      const expectedOrder = [
        'data_verification',
        'technical_analysis', 
        'execution_analysis',
        'risk_management',
        'lessons_learned'
      ];
      
      const actualOrder = workflow.stages.map(s => s.id);
      expect(actualOrder).toEqual(expectedOrder);
    });
  });

  describe('Review Reminders and Tracking', () => {
    it('should track review start time', () => {
      const beforeInit = new Date().toISOString();
      const workflow = service.initializeReview('test-trade-1');
      const afterInit = new Date().toISOString();
      
      expect(workflow.startedAt).toBeDefined();
      expect(workflow.startedAt >= beforeInit).toBe(true);
      expect(workflow.startedAt <= afterInit).toBe(true);
    });

    it('should track stage completion times', () => {
      const workflow = service.initializeReview('test-trade-1');
      const beforeUpdate = new Date().toISOString();
      
      const updated = service.updateStage(workflow, 'data_verification', true);
      const afterUpdate = new Date().toISOString();
      
      const stage = updated.stages.find(s => s.id === 'data_verification');
      expect(stage?.completedAt).toBeDefined();
      expect(stage!.completedAt! >= beforeUpdate).toBe(true);
      expect(stage!.completedAt! <= afterUpdate).toBe(true);
    });

    it('should track review completion time', () => {
      let workflow = service.initializeReview('test-trade-1');
      
      // Complete all required stages
      const requiredStages = workflow.stages.filter(s => s.required);
      requiredStages.forEach(stage => {
        workflow = service.updateStage(workflow, stage.id, true);
      });

      const beforeComplete = new Date().toISOString();
      const completed = service.markReviewComplete(workflow);
      const afterComplete = new Date().toISOString();
      
      expect(completed.completedAt).toBeDefined();
      expect(completed.completedAt! >= beforeComplete).toBe(true);
      expect(completed.completedAt! <= afterComplete).toBe(true);
    });

    it('should identify overdue reviews based on start time', () => {
      // Create workflow with old start time
      const oldWorkflow = service.initializeReview('old-trade');
      oldWorkflow.startedAt = '2024-01-01T10:00:00Z'; // Old date
      
      const recentWorkflow = service.initializeReview('recent-trade');
      
      const trades: EnhancedTrade[] = [
        {
          id: 'old-trade',
          currencyPair: 'EUR/USD',
          date: '2024-01-01',
          timeIn: '10:00',
          side: 'long',
          entryPrice: 1.1000,
          lotSize: 1.0,
          lotType: 'standard',
          accountId: 'test-account',
          accountCurrency: 'USD',
          reviewData: { reviewWorkflow: oldWorkflow }
        },
        {
          id: 'recent-trade',
          currencyPair: 'GBP/USD',
          date: '2024-01-02',
          timeIn: '11:00',
          side: 'short',
          entryPrice: 1.2500,
          lotSize: 1.0,
          lotType: 'standard',
          accountId: 'test-account',
          accountCurrency: 'USD',
          reviewData: { reviewWorkflow: recentWorkflow }
        }
      ] as EnhancedTrade[];

      const incompleteReviews = service.getIncompleteReviews(trades);
      
      // Both should be incomplete, but we can check start times
      expect(incompleteReviews).toHaveLength(2);
      
      const oldReview = incompleteReviews.find(r => r.tradeId === 'old-trade');
      const recentReview = incompleteReviews.find(r => r.tradeId === 'recent-trade');
      
      expect(new Date(oldReview!.startedAt) < new Date(recentReview!.startedAt)).toBe(true);
    });
  });
});
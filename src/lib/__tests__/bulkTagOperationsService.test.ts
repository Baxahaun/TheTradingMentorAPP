import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bulkTagOperationsService, BulkTagOperation } from '../bulkTagOperationsService';
import { Trade } from '../../types/trade';
import { tagService } from '../tagService';

// Mock tagService
vi.mock('../tagService', () => ({
  tagService: {
    normalizeTag: vi.fn((tag: string) => tag.toLowerCase().startsWith('#') ? tag : `#${tag}`),
    validateTag: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
  }
}));

describe('BulkTagOperationsService', () => {
  let mockTrades: Trade[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockTrades = [
      {
        id: '1',
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-15',
        timeIn: '09:00',
        side: 'long',
        entryPrice: 1.0950,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 300,
        tags: ['#breakout', '#trend-following', '#major-pair']
      },
      {
        id: '2',
        accountId: 'acc1',
        currencyPair: 'GBP/USD',
        date: '2024-01-16',
        timeIn: '14:00',
        side: 'short',
        entryPrice: 1.2650,
        lotSize: 0.5,
        lotType: 'standard',
        units: 50000,
        commission: 3,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 150,
        tags: ['#reversal', '#scalping', '#major-pair']
      },
      {
        id: '3',
        accountId: 'acc1',
        currencyPair: 'USD/JPY',
        date: '2024-01-17',
        timeIn: '08:00',
        side: 'long',
        entryPrice: 148.50,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 4,
        accountCurrency: 'USD',
        status: 'open',
        tags: ['#trend-following', '#asian-session']
      }
    ];
  });

  describe('Bulk Delete Operations', () => {
    it('should delete specified tags from all trades', async () => {
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#major-pair'],
        options: { validateBeforeApply: true }
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(true);
      expect(result.affectedTrades).toBe(2); // Two trades had #major-pair
      expect(result.affectedTags).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Check that the tag was removed from affected trades
      expect(mockTrades[0].tags).not.toContain('#major-pair');
      expect(mockTrades[1].tags).not.toContain('#major-pair');
      expect(mockTrades[2].tags).not.toContain('#major-pair'); // Didn't have it anyway
    });

    it('should delete multiple tags at once', async () => {
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#breakout', '#reversal'],
        options: { validateBeforeApply: true }
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(true);
      expect(result.affectedTrades).toBe(2); // One trade had #breakout, one had #reversal
      expect(result.affectedTags).toBe(2);

      expect(mockTrades[0].tags).not.toContain('#breakout');
      expect(mockTrades[1].tags).not.toContain('#reversal');
    });

    it('should handle trades without tags gracefully', async () => {
      const tradesWithoutTags = [
        ...mockTrades,
        {
          id: '4',
          accountId: 'acc1',
          currencyPair: 'AUD/USD',
          date: '2024-01-18',
          timeIn: '10:00',
          side: 'long',
          entryPrice: 0.6750,
          lotSize: 1,
          lotType: 'standard',
          units: 100000,
          commission: 4,
          accountCurrency: 'USD',
          status: 'open',
          tags: undefined // No tags
        } as Trade
      ];

      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#major-pair']
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, tradesWithoutTags);

      expect(result.success).toBe(true);
      expect(result.affectedTrades).toBe(2); // Only trades with tags are affected
    });
  });

  describe('Bulk Merge Operations', () => {
    it('should merge multiple tags into a single target tag', async () => {
      const operation: BulkTagOperation = {
        type: 'merge',
        selectedTags: ['#breakout', '#reversal'],
        mergeTarget: '#setup-based'
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(true);
      expect(result.affectedTrades).toBe(2);
      expect(result.affectedTags).toBe(2);

      // Check that source tags were replaced with target tag
      expect(mockTrades[0].tags).toContain('#setup-based');
      expect(mockTrades[0].tags).not.toContain('#breakout');
      expect(mockTrades[1].tags).toContain('#setup-based');
      expect(mockTrades[1].tags).not.toContain('#reversal');
    });

    it('should fail when merge target is not provided', async () => {
      const operation: BulkTagOperation = {
        type: 'merge',
        selectedTags: ['#breakout', '#reversal']
        // mergeTarget is missing
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Merge target is required for merge operation');
    });

    it('should avoid duplicate tags when merging', async () => {
      // Add a trade that already has the target tag
      mockTrades[0].tags!.push('#setup-based');

      const operation: BulkTagOperation = {
        type: 'merge',
        selectedTags: ['#breakout'],
        mergeTarget: '#setup-based'
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(true);
      
      // Should not have duplicate tags
      const setupBasedCount = mockTrades[0].tags!.filter(tag => tag === '#setup-based').length;
      expect(setupBasedCount).toBe(1);
    });
  });

  describe('Bulk Rename Operations', () => {
    it('should rename a single tag across all trades', async () => {
      const operation: BulkTagOperation = {
        type: 'rename',
        selectedTags: ['#trend-following'],
        targetValue: '#trend-continuation'
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(true);
      expect(result.affectedTrades).toBe(2); // Two trades had #trend-following
      expect(result.affectedTags).toBe(1);

      expect(mockTrades[0].tags).toContain('#trend-continuation');
      expect(mockTrades[0].tags).not.toContain('#trend-following');
      expect(mockTrades[2].tags).toContain('#trend-continuation');
      expect(mockTrades[2].tags).not.toContain('#trend-following');
    });

    it('should fail when trying to rename multiple tags', async () => {
      const operation: BulkTagOperation = {
        type: 'rename',
        selectedTags: ['#breakout', '#reversal'],
        targetValue: '#new-tag'
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Rename operation can only be applied to a single tag');
    });

    it('should fail when target value is not provided', async () => {
      const operation: BulkTagOperation = {
        type: 'rename',
        selectedTags: ['#breakout']
        // targetValue is missing
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Target value is required for rename operation');
    });
  });

  describe('Bulk Replace Operations', () => {
    it('should replace multiple tags with a single replacement tag', async () => {
      const operation: BulkTagOperation = {
        type: 'replace',
        selectedTags: ['#breakout', '#reversal'],
        replacementTag: '#pattern-based'
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(true);
      expect(result.affectedTrades).toBe(2);
      expect(result.affectedTags).toBe(2);

      expect(mockTrades[0].tags).toContain('#pattern-based');
      expect(mockTrades[0].tags).not.toContain('#breakout');
      expect(mockTrades[1].tags).toContain('#pattern-based');
      expect(mockTrades[1].tags).not.toContain('#reversal');
    });

    it('should fail when replacement tag is not provided', async () => {
      const operation: BulkTagOperation = {
        type: 'replace',
        selectedTags: ['#breakout']
        // replacementTag is missing
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Replacement tag is required for replace operation');
    });

    it('should handle invalid replacement tags', async () => {
      // Mock tagService to return invalid for a specific tag
      (tagService.validateTag as any).mockReturnValueOnce({
        isValid: false,
        errors: [{ message: 'Invalid tag format' }],
        warnings: []
      });

      const operation: BulkTagOperation = {
        type: 'replace',
        selectedTags: ['#breakout'],
        replacementTag: 'invalid-tag-format'
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid tag format');
    });
  });

  describe('Operation Validation', () => {
    it('should validate operations before execution', () => {
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: [] // Empty selection
      };

      const validation = bulkTagOperationsService.validateOperation(operation, mockTrades);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No tags selected for operation');
    });

    it('should warn about operations on empty trade arrays', () => {
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#test']
      };

      const validation = bulkTagOperationsService.validateOperation(operation, []);

      expect(validation.isValid).toBe(true); // Not an error, just a warning
      expect(validation.warnings).toContain('No trades available to process');
    });

    it('should validate merge operations specifically', () => {
      const operation: BulkTagOperation = {
        type: 'merge',
        selectedTags: ['#test']
        // mergeTarget is missing
      };

      const validation = bulkTagOperationsService.validateOperation(operation, mockTrades);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Merge target is required for merge operation');
    });

    it('should validate rename operations specifically', () => {
      const operation: BulkTagOperation = {
        type: 'rename',
        selectedTags: ['#test1', '#test2'] // Multiple tags
      };

      const validation = bulkTagOperationsService.validateOperation(operation, mockTrades);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Rename operation can only be applied to a single tag');
    });
  });

  describe('Operation Preview', () => {
    it('should preview operation effects without modifying data', () => {
      const originalTrades = JSON.parse(JSON.stringify(mockTrades));
      
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#major-pair']
      };

      const preview = bulkTagOperationsService.previewOperation(operation, mockTrades);

      expect(preview.affectedTrades).toBe(2);
      expect(preview.changes).toHaveLength(2);
      
      // Original data should be unchanged
      expect(mockTrades).toEqual(originalTrades);
    });
  });

  describe('Operation History and Rollback', () => {
    it('should track operation history', async () => {
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#major-pair'],
        options: { createBackup: true }
      };

      await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      const history = bulkTagOperationsService.getOperationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].affectedTrades).toBe(2);
    });

    it('should rollback the last operation when backup is available', async () => {
      const originalTrades = JSON.parse(JSON.stringify(mockTrades));
      
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#major-pair'],
        options: { createBackup: true }
      };

      await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);
      
      // Verify tags were deleted
      expect(mockTrades[0].tags).not.toContain('#major-pair');
      
      // Rollback
      const rollbackResult = bulkTagOperationsService.rollbackLastOperation(mockTrades);
      
      expect(rollbackResult.success).toBe(true);
      expect(mockTrades[0].tags).toContain('#major-pair');
      expect(mockTrades[1].tags).toContain('#major-pair');
    });

    it('should fail rollback when no backup is available', () => {
      const rollbackResult = bulkTagOperationsService.rollbackLastOperation(mockTrades);
      
      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.errors).toContain('No operation to rollback or no backup data available');
    });

    it('should clear operation history', async () => {
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#test']
      };

      await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);
      
      expect(bulkTagOperationsService.getOperationHistory()).toHaveLength(1);
      
      bulkTagOperationsService.clearHistory();
      
      expect(bulkTagOperationsService.getOperationHistory()).toHaveLength(0);
    });
  });

  describe('Validation Rules', () => {
    it('should apply built-in validation rules', () => {
      // Create a trade with many instances of a tag to trigger high usage warning
      const highUsageTrades = Array.from({ length: 25 }, (_, i) => ({
        ...mockTrades[0],
        id: `trade-${i}`,
        tags: ['#high-usage-tag']
      }));

      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#high-usage-tag']
      };

      const validation = bulkTagOperationsService.validateOperation(operation, highUsageTrades);
      
      expect(validation.warnings.some(w => w.includes('used in 25 trades'))).toBe(true);
    });

    it('should allow adding custom validation rules', () => {
      const customRule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'A test validation rule',
        validator: (tag: string) => ({
          isValid: tag !== '#forbidden',
          message: 'This tag is forbidden'
        }),
        severity: 'error' as const
      };

      bulkTagOperationsService.addValidationRule(customRule);

      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#forbidden']
      };

      const validation = bulkTagOperationsService.validateOperation(operation, mockTrades);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('This tag is forbidden'))).toBe(true);

      // Cleanup
      bulkTagOperationsService.removeValidationRule('test-rule');
    });

    it('should allow removing validation rules', () => {
      const rules = bulkTagOperationsService.getValidationRules();
      const initialCount = rules.length;

      if (initialCount > 0) {
        const ruleToRemove = rules[0];
        bulkTagOperationsService.removeValidationRule(ruleToRemove.id);
        
        const updatedRules = bulkTagOperationsService.getValidationRules();
        expect(updatedRules).toHaveLength(initialCount - 1);
        expect(updatedRules.find(r => r.id === ruleToRemove.id)).toBeUndefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported operation types', async () => {
      const operation = {
        type: 'unsupported',
        selectedTags: ['#test']
      } as BulkTagOperation;

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Unsupported operation type: unsupported');
    });

    it('should handle exceptions during operation execution', async () => {
      // Mock tagService to throw an error
      (tagService.normalizeTag as any).mockImplementationOnce(() => {
        throw new Error('Service error');
      });

      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#test']
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Operation failed'))).toBe(true);
    });
  });

  describe('Change Tracking', () => {
    it('should track detailed changes for each operation', async () => {
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: ['#major-pair']
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      expect(result.changes).toHaveLength(2);
      
      result.changes.forEach(change => {
        expect(change).toHaveProperty('tradeId');
        expect(change).toHaveProperty('oldTags');
        expect(change).toHaveProperty('newTags');
        expect(change).toHaveProperty('changeType', 'delete');
        expect(change).toHaveProperty('timestamp');
        expect(new Date(change.timestamp)).toBeInstanceOf(Date);
      });
    });

    it('should record correct before and after states', async () => {
      const operation: BulkTagOperation = {
        type: 'rename',
        selectedTags: ['#trend-following'],
        targetValue: '#trend-continuation'
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, mockTrades);

      const change = result.changes.find(c => c.tradeId === '1');
      expect(change).toBeDefined();
      expect(change!.oldTags).toContain('#trend-following');
      expect(change!.newTags).toContain('#trend-continuation');
      expect(change!.newTags).not.toContain('#trend-following');
    });
  });
});
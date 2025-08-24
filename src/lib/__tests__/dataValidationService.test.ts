/**
 * Data Validation Service Tests
 */

import { DataValidationService, ValidationRule, CleanupRule } from '../dataValidationService';
import { TradeReviewData, TradeNotes } from '../../types/tradeReview';

describe('DataValidationService', () => {
  let validationService: DataValidationService;

  beforeEach(() => {
    validationService = new DataValidationService();
  });

  describe('Trade Validation', () => {
    it('should validate a valid trade successfully', () => {
      const validTrade = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed',
        commission: 5.0,
        exitPrice: 1.1050,
        lotType: 'standard'
      };

      const report = validationService.validateTrade(validTrade);

      expect(report.isValid).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.tradeId).toBe('trade1');
    });

    it('should detect missing required fields', () => {
      const invalidTrade = {
        id: 'trade1',
        // Missing required fields
        side: 'long',
        status: 'open'
      };

      const report = validationService.validateTrade(invalidTrade);

      expect(report.isValid).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
      
      const errorFields = report.errors.map(e => e.field);
      expect(errorFields).toContain('currencyPair');
      expect(errorFields).toContain('date');
      expect(errorFields).toContain('entryPrice');
      expect(errorFields).toContain('lotSize');
    });

    it('should validate data types correctly', () => {
      const invalidTrade = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 'not a number',
        exitPrice: -100,
        side: 'long',
        lotSize: 'invalid',
        status: 'closed',
        commission: 'free'
      };

      const report = validationService.validateTrade(invalidTrade);

      expect(report.isValid).toBe(false);
      
      const errorCodes = report.errors.map(e => e.code);
      expect(errorCodes).toContain('type_entryPrice');
      expect(errorCodes).toContain('type_exitPrice');
      expect(errorCodes).toContain('type_lotSize');
      expect(errorCodes).toContain('type_commission');
    });

    it('should validate format constraints', () => {
      const invalidTrade = {
        id: 'trade1',
        currencyPair: 'INVALID',
        date: 'not a date',
        entryPrice: 1.1000,
        side: 'invalid_side',
        lotSize: 1.0,
        status: 'invalid_status',
        commission: 5.0,
        lotType: 'invalid_type'
      };

      const report = validationService.validateTrade(invalidTrade);

      expect(report.isValid).toBe(false);
      
      const errorCodes = report.errors.map(e => e.code);
      expect(errorCodes).toContain('format_currencyPair');
      expect(errorCodes).toContain('format_date');
      expect(errorCodes).toContain('format_side');
      expect(errorCodes).toContain('format_status');
      expect(errorCodes).toContain('format_lotType');
    });

    it('should validate business logic rules', () => {
      const invalidTrade = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        timeIn: '14:00',
        timeOut: '10:00', // Exit before entry
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed',
        commission: 5.0,
        stopLoss: 1.1050, // Invalid stop loss for long position
        takeProfit: 1.0950, // Invalid take profit for long position
        // Missing exit price for closed trade
      };

      const report = validationService.validateTrade(invalidTrade);

      expect(report.isValid).toBe(false);
      
      const errorCodes = report.errors.map(e => e.code);
      expect(errorCodes).toContain('custom_exitPrice');
      
      const warningCodes = report.warnings.map(w => w.code);
      expect(warningCodes).toContain('custom_stopLoss');
      expect(warningCodes).toContain('custom_takeProfit');
      expect(warningCodes).toContain('custom_timeOut');
    });
  });

  describe('Data Cleanup', () => {
    it('should trim string fields', () => {
      const tradeWithSpaces = {
        id: 'trade1',
        currencyPair: '  EUR/USD  ',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed',
        commission: 5.0,
        strategy: '  Trend Following  ',
        notes: '  Good trade  ',
        emotions: '  Confident  '
      };

      const report = validationService.validateTrade(tradeWithSpaces);

      expect(report.cleanedData.currencyPair).toBe('EUR/USD');
      expect(report.cleanedData.strategy).toBe('Trend Following');
      expect(report.cleanedData.notes).toBe('Good trade');
      expect(report.cleanedData.emotions).toBe('Confident');
      expect(report.cleanupApplied).toContain('Cleaned field: currencyPair');
    });

    it('should normalize currency pair format', () => {
      const tradeWithBadFormat = {
        id: 'trade1',
        currencyPair: 'eurusd',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed',
        commission: 5.0
      };

      const report = validationService.validateTrade(tradeWithBadFormat);

      expect(report.cleanedData.currencyPair).toBe('EUR/USD');
      expect(report.cleanupApplied).toContain('Cleaned field: currencyPair');
    });

    it('should convert string numbers to numbers', () => {
      const tradeWithStringNumbers = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        entryPrice: '1.1000',
        exitPrice: '1.1050',
        side: 'long',
        lotSize: '1.0',
        status: 'closed',
        commission: '5.0'
      };

      const report = validationService.validateTrade(tradeWithStringNumbers);

      expect(typeof report.cleanedData.entryPrice).toBe('number');
      expect(typeof report.cleanedData.exitPrice).toBe('number');
      expect(typeof report.cleanedData.lotSize).toBe('number');
      expect(typeof report.cleanedData.commission).toBe('number');
      expect(report.cleanedData.entryPrice).toBe(1.1000);
    });

    it('should set default values for missing fields', () => {
      const tradeWithMissingDefaults = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed'
        // Missing commission, tags, lotType
      };

      const report = validationService.validateTrade(tradeWithMissingDefaults);

      expect(report.cleanedData.commission).toBe(0);
      expect(report.cleanedData.tags).toEqual([]);
      expect(report.cleanedData.lotType).toBe('standard');
    });

    it('should handle tag normalization', () => {
      const testCases = [
        {
          input: 'trend,breakout,momentum',
          expected: ['trend', 'breakout', 'momentum']
        },
        {
          input: ['reversal', 'support'],
          expected: ['reversal', 'support']
        },
        {
          input: 'single',
          expected: ['single']
        },
        {
          input: '',
          expected: []
        },
        {
          input: null,
          expected: []
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const trade = {
          id: 'trade1',
          currencyPair: 'EUR/USD',
          date: '2024-01-01T10:00:00Z',
          entryPrice: 1.1000,
          side: 'long',
          lotSize: 1.0,
          status: 'closed',
          commission: 5.0,
          tags: input
        };

        const report = validationService.validateTrade(trade);
        expect(report.cleanedData.tags).toEqual(expected);
      });
    });
  });

  describe('Multiple Trade Validation', () => {
    it('should validate multiple trades', () => {
      const trades = [
        {
          id: 'trade1',
          currencyPair: 'EUR/USD',
          date: '2024-01-01T10:00:00Z',
          entryPrice: 1.1000,
          side: 'long',
          lotSize: 1.0,
          status: 'closed',
          commission: 5.0
        },
        {
          id: 'trade2',
          // Missing required fields
          side: 'short',
          status: 'open'
        }
      ];

      const reports = validationService.validateTrades(trades);

      expect(reports).toHaveLength(2);
      expect(reports[0].isValid).toBe(true);
      expect(reports[1].isValid).toBe(false);
    });

    it('should generate validation summary', () => {
      const trades = [
        {
          id: 'trade1',
          currencyPair: 'EUR/USD',
          date: '2024-01-01T10:00:00Z',
          entryPrice: 1.1000,
          side: 'long',
          lotSize: 1.0,
          status: 'closed',
          commission: 5.0
        },
        {
          id: 'trade2',
          currencyPair: 'GBP/USD',
          date: '2024-01-02T10:00:00Z',
          entryPrice: 1.2500,
          side: 'short',
          lotSize: 0.5,
          status: 'open',
          commission: 3.0
        },
        {
          id: 'trade3',
          // Invalid trade
          side: 'invalid',
          status: 'invalid'
        }
      ];

      const reports = validationService.validateTrades(trades);
      const summary = validationService.getValidationSummary(reports);

      expect(summary.totalTrades).toBe(3);
      expect(summary.validTrades).toBe(2);
      expect(summary.invalidTrades).toBe(1);
      expect(summary.totalErrors).toBeGreaterThan(0);
      expect(summary.commonErrors).toBeDefined();
    });
  });

  describe('Trade Review Data Validation', () => {
    it('should validate trade review data structure', () => {
      const validReviewData: TradeReviewData = {
        notes: {
          generalNotes: 'Test notes',
          lastModified: new Date().toISOString(),
          version: 1
        },
        reviewWorkflow: {
          tradeId: 'trade1',
          stages: [],
          overallProgress: 0,
          startedAt: new Date().toISOString()
        },
        charts: [
          {
            id: 'chart1',
            url: 'https://example.com/chart.png',
            type: 'entry',
            timeframe: '1H',
            uploadedAt: new Date().toISOString()
          }
        ]
      };

      const result = validationService.validateTradeReviewData(validReviewData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate trade notes structure', () => {
      const invalidNotes = {
        generalNotes: 'Test notes',
        // Missing lastModified and version
      } as TradeNotes;

      const reviewData: TradeReviewData = {
        notes: invalidNotes
      };

      const result = validationService.validateTradeReviewData(reviewData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'lastModified')).toBe(true);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
    });

    it('should validate chart data', () => {
      const invalidCharts = [
        {
          // Missing id and url
          type: 'entry',
          timeframe: '1H',
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'chart2',
          url: 'https://example.com/chart2.png',
          type: 'invalid_type', // Invalid type
          timeframe: '1H',
          uploadedAt: new Date().toISOString()
        }
      ];

      const reviewData: TradeReviewData = {
        charts: invalidCharts as any
      };

      const result = validationService.validateTradeReviewData(reviewData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'charts[0].id')).toBe(true);
      expect(result.errors.some(e => e.field === 'charts[0].url')).toBe(true);
      expect(result.errors.some(e => e.field === 'charts[1].type')).toBe(true);
    });
  });

  describe('Custom Rules', () => {
    it('should allow adding custom validation rules', () => {
      const customRule: ValidationRule = {
        field: 'customField',
        type: 'custom',
        message: 'Custom field must be positive',
        severity: 'error',
        validator: (value) => typeof value === 'number' && value > 0
      };

      validationService.addValidationRule(customRule);

      const trade = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed',
        commission: 5.0,
        customField: -5
      };

      const report = validationService.validateTrade(trade);

      expect(report.isValid).toBe(false);
      expect(report.errors.some(e => e.field === 'customField')).toBe(true);
    });

    it('should allow adding custom cleanup rules', () => {
      const customCleanupRule: CleanupRule = {
        field: 'customField',
        action: 'custom',
        cleaner: (value) => typeof value === 'string' ? value.toUpperCase() : value
      };

      validationService.addCleanupRule(customCleanupRule);

      const trade = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed',
        commission: 5.0,
        customField: 'lowercase'
      };

      const report = validationService.validateTrade(trade);

      expect(report.cleanedData.customField).toBe('LOWERCASE');
    });

    it('should allow removing validation rules', () => {
      const initialRules = validationService.getValidationRules();
      const initialCount = initialRules.length;

      validationService.removeValidationRule('entryPrice', 'required');

      const updatedRules = validationService.getValidationRules();
      expect(updatedRules.length).toBe(initialCount - 1);
      expect(updatedRules.some(r => r.field === 'entryPrice' && r.type === 'required')).toBe(false);
    });

    it('should allow removing cleanup rules', () => {
      const initialRules = validationService.getCleanupRules();
      const initialCount = initialRules.length;

      validationService.removeCleanupRule('currencyPair', 'trim');

      const updatedRules = validationService.getCleanupRules();
      expect(updatedRules.length).toBe(initialCount - 1);
      expect(updatedRules.some(r => r.field === 'currencyPair' && r.action === 'trim')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation rule errors gracefully', () => {
      const faultyRule: ValidationRule = {
        field: 'testField',
        type: 'custom',
        message: 'Test rule',
        severity: 'error',
        validator: () => {
          throw new Error('Validator error');
        }
      };

      validationService.addValidationRule(faultyRule);

      const trade = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed',
        commission: 5.0,
        testField: 'test'
      };

      const report = validationService.validateTrade(trade);

      // Should handle the error gracefully and mark as invalid
      expect(report.errors.some(e => e.field === 'testField')).toBe(true);
    });

    it('should handle cleanup rule errors gracefully', () => {
      const faultyCleanupRule: CleanupRule = {
        field: 'testField',
        action: 'custom',
        cleaner: () => {
          throw new Error('Cleanup error');
        }
      };

      validationService.addCleanupRule(faultyCleanupRule);

      const trade = {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        date: '2024-01-01T10:00:00Z',
        entryPrice: 1.1000,
        side: 'long',
        lotSize: 1.0,
        status: 'closed',
        commission: 5.0,
        testField: 'test'
      };

      const report = validationService.validateTrade(trade);

      // Should handle the error gracefully and continue
      expect(report.cleanedData.testField).toBe('test'); // Original value preserved
    });
  });
});
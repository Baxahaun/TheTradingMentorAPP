import { describe, it, expect, beforeEach } from 'vitest';
import ValidationService, { ValidationError } from '../ValidationService';
import { JournalEntry, EmotionalState, ProcessMetrics } from '../../types/journal';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = ValidationService.getInstance();
  });

  describe('validateJournalEntry', () => {
    it('should validate a complete journal entry successfully', () => {
      const today = new Date().toISOString().split('T')[0];
      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: today,
        preMarketNotes: 'Market looks bullish today',
        tradingNotes: 'Executed trades according to plan',
        postMarketReflection: 'Good discipline maintained throughout the session',
        lessonsLearned: 'Patience paid off in waiting for the right setups',
        emotionalState: {
          preMarket: {
            confidence: 4,
            anxiety: 2,
            focus: 4,
            mood: 'confident'
          },
          duringTrading: {
            discipline: 4,
            patience: 4,
            emotionalControl: 3
          },
          postMarket: {
            satisfaction: 4,
            learningValue: 4,
            overallMood: 'satisfied'
          }
        },
        processMetrics: {
          planAdherence: 4,
          riskManagement: 5,
          entryTiming: 3,
          exitTiming: 4,
          overallDiscipline: 4,
          processScore: 4.2
        },
        sections: [
          {
            id: '1',
            type: 'text',
            title: 'Market Analysis',
            content: 'Detailed market analysis content',
            order: 1,
            isRequired: true
          }
        ],
        tradeReferences: [],
        images: [],
        tags: ['bullish', 'disciplined'],
        isComplete: true,
        wordCount: 150
      };

      const result = validationService.validateJournalEntry(entry);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const entry: Partial<JournalEntry> = {
        // Missing userId and date
        preMarketNotes: 'Some notes'
      };

      const result = validationService.validateJournalEntry(entry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'userId',
            code: 'REQUIRED_FIELD',
            severity: 'error'
          }),
          expect.objectContaining({
            field: 'date',
            code: 'REQUIRED_FIELD',
            severity: 'error'
          })
        ])
      );
    });

    it('should detect empty journal entry', () => {
      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15'
        // No content fields
      };

      const result = validationService.validateJournalEntry(entry);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            code: 'EMPTY_ENTRY',
            severity: 'warning'
          })
        ])
      );
    });

    it('should suggest improvements for brief entries', () => {
      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        preMarketNotes: 'Short note' // Very brief content
      };

      const result = validationService.validateJournalEntry(entry);

      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            code: 'SHORT_ENTRY',
            severity: 'info'
          })
        ])
      );
    });
  });

  describe('validateDate', () => {
    it('should validate correct date format', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = validationService.validateDate(today);
      expect(result).toBeNull();
    });

    it('should reject empty date', () => {
      const result = validationService.validateDate('');
      
      expect(result).toEqual(
        expect.objectContaining({
          field: 'date',
          code: 'REQUIRED_FIELD',
          severity: 'error'
        })
      );
    });

    it('should reject invalid date format', () => {
      const result = validationService.validateDate('01/15/2024');
      
      expect(result).toEqual(
        expect.objectContaining({
          field: 'date',
          code: 'INVALID_FORMAT',
          severity: 'error'
        })
      );
    });

    it('should warn about very old dates', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      const dateString = oldDate.toISOString().split('T')[0];
      
      const result = validationService.validateDate(dateString);
      
      expect(result).toEqual(
        expect.objectContaining({
          field: 'date',
          code: 'DATE_TOO_OLD',
          severity: 'warning'
        })
      );
    });

    it('should reject future dates beyond one month', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 2);
      const dateString = futureDate.toISOString().split('T')[0];
      
      const result = validationService.validateDate(dateString);
      
      expect(result).toEqual(
        expect.objectContaining({
          field: 'date',
          code: 'DATE_TOO_FUTURE',
          severity: 'error'
        })
      );
    });
  });

  describe('validateTextContent', () => {
    it('should validate normal text content', () => {
      const result = validationService.validateTextContent(
        'This is a normal journal entry with sufficient content.',
        'Trading Notes'
      );
      
      expect(result).toBeNull();
    });

    it('should warn about content below minimum length', () => {
      const result = validationService.validateTextContent(
        'Short',
        'Trading Notes',
        50
      );
      
      expect(result).toEqual(
        expect.objectContaining({
          field: 'Trading Notes',
          code: 'MIN_LENGTH',
          severity: 'warning'
        })
      );
    });

    it('should reject content exceeding maximum length', () => {
      const longContent = 'x'.repeat(11000);
      const result = validationService.validateTextContent(
        longContent,
        'Trading Notes',
        0,
        10000
      );
      
      expect(result).toEqual(
        expect.objectContaining({
          field: 'Trading Notes',
          code: 'MAX_LENGTH',
          severity: 'error'
        })
      );
    });

    it('should detect repeated character content', () => {
      const repeatedContent = 'aaaaaaaaaaaaaaaaaaaaaa';
      const result = validationService.validateTextContent(
        repeatedContent,
        'Trading Notes'
      );
      
      expect(result).toEqual(
        expect.objectContaining({
          field: 'Trading Notes',
          code: 'INVALID_CONTENT',
          severity: 'warning'
        })
      );
    });
  });

  describe('validateField', () => {
    it('should validate individual fields', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = validationService.validateField('date', today);
      expect(result).toBeNull();
    });

    it('should return null for unknown fields', () => {
      const result = validationService.validateField('unknownField', 'value');
      expect(result).toBeNull();
    });
  });

  describe('emotional state validation', () => {
    it('should validate correct emotional state ratings', () => {
      const emotionalState: EmotionalState = {
        preMarket: {
          confidence: 4,
          anxiety: 2,
          focus: 5,
          mood: 'confident'
        },
        duringTrading: {
          discipline: 3,
          patience: 4,
          emotionalControl: 3
        },
        postMarket: {
          satisfaction: 4,
          learningValue: 5,
          overallMood: 'satisfied'
        }
      };

      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        emotionalState
      };

      const result = validationService.validateJournalEntry(entry);
      
      const emotionalErrors = result.errors.filter(e => 
        e.field.startsWith('emotionalState')
      );
      expect(emotionalErrors).toHaveLength(0);
    });

    it('should detect invalid emotional state ratings', () => {
      const emotionalState: EmotionalState = {
        preMarket: {
          confidence: 6, // Invalid: > 5
          anxiety: 0,    // Invalid: < 1
          focus: 3,
          mood: 'confident'
        },
        duringTrading: {
          discipline: 3,
          patience: 4,
          emotionalControl: 3
        },
        postMarket: {
          satisfaction: 4,
          learningValue: 5,
          overallMood: 'satisfied'
        }
      };

      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        emotionalState
      };

      const result = validationService.validateJournalEntry(entry);
      
      const emotionalErrors = result.warnings.filter(e => 
        e.field.includes('emotionalState') && e.code === 'INVALID_RANGE'
      );
      expect(emotionalErrors.length).toBeGreaterThan(0);
    });

    it('should detect emotional inconsistencies', () => {
      const emotionalState: EmotionalState = {
        preMarket: {
          confidence: 5, // High confidence
          anxiety: 1,
          focus: 5,
          mood: 'confident'
        },
        duringTrading: {
          discipline: 3,
          patience: 4,
          emotionalControl: 3
        },
        postMarket: {
          satisfaction: 1, // Low satisfaction despite high confidence
          learningValue: 2,
          overallMood: 'disappointed'
        }
      };

      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        emotionalState
      };

      const result = validationService.validateJournalEntry(entry);
      
      const inconsistencyWarning = result.warnings.find(w => 
        w.code === 'EMOTIONAL_INCONSISTENCY'
      );
      expect(inconsistencyWarning).toBeDefined();
    });
  });

  describe('process metrics validation', () => {
    it('should validate correct process metrics', () => {
      const processMetrics: ProcessMetrics = {
        planAdherence: 4,
        riskManagement: 5,
        entryTiming: 3,
        exitTiming: 4,
        overallDiscipline: 4,
        processScore: 4.0
      };

      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        processMetrics
      };

      const result = validationService.validateJournalEntry(entry);
      
      const metricsErrors = result.warnings.filter(e => 
        e.field.startsWith('processMetrics') && e.code === 'INVALID_RANGE'
      );
      expect(metricsErrors).toHaveLength(0);
    });

    it('should detect invalid process metrics ratings', () => {
      const processMetrics: ProcessMetrics = {
        planAdherence: 6, // Invalid: > 5
        riskManagement: 0, // Invalid: < 1
        entryTiming: 3,
        exitTiming: 4,
        overallDiscipline: 4,
        processScore: 4.0
      };

      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        processMetrics
      };

      const result = validationService.validateJournalEntry(entry);
      
      const metricsErrors = result.warnings.filter(e => 
        e.field.startsWith('processMetrics') && e.code === 'INVALID_RANGE'
      );
      expect(metricsErrors.length).toBeGreaterThan(0);
    });

    it('should warn about perfect scores', () => {
      const processMetrics: ProcessMetrics = {
        planAdherence: 5,
        riskManagement: 5,
        entryTiming: 5,
        exitTiming: 5,
        overallDiscipline: 5,
        processScore: 5.0
      };

      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        processMetrics
      };

      const result = validationService.validateJournalEntry(entry);
      
      const perfectScoreWarning = result.warnings.find(w => 
        w.code === 'PERFECT_SCORES'
      );
      expect(perfectScoreWarning).toBeDefined();
    });
  });

  describe('getJournalQualitySuggestions', () => {
    it('should suggest improvements for incomplete entries', () => {
      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        preMarketNotes: 'Basic notes'
        // Missing emotional state, process metrics, images, lessons learned
      };

      const suggestions = validationService.getJournalQualitySuggestions(entry);

      expect(suggestions).toEqual(
        expect.arrayContaining([
          'Add emotional tracking to better understand your trading psychology',
          'Rate your process adherence to focus on discipline over outcomes',
          'Consider adding screenshots of your trades or market analysis',
          'Document what you learned today to accelerate your growth'
        ])
      );
    });

    it('should return fewer suggestions for complete entries', () => {
      const entry: Partial<JournalEntry> = {
        userId: 'user123',
        date: '2024-01-15',
        preMarketNotes: 'Market analysis',
        emotionalState: {} as EmotionalState,
        processMetrics: {} as ProcessMetrics,
        images: [{ id: '1' } as any],
        lessonsLearned: 'Key lessons from today'
      };

      const suggestions = validationService.getJournalQualitySuggestions(entry);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ValidationService.getInstance();
      const instance2 = ValidationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
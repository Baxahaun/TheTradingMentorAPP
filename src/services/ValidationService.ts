import { JournalEntry, JournalSection, EmotionalState, ProcessMetrics } from '../types/journal';

export interface ValidationRule {
  field: string;
  validator: (value: any, entry?: Partial<JournalEntry>) => ValidationError | null;
  required?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
}

export class ValidationService {
  private static instance: ValidationService;
  private validationRules: ValidationRule[] = [];

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
      ValidationService.instance.initializeRules();
    }
    return ValidationService.instance;
  }

  /**
   * Validate journal entry with comprehensive checks
   */
  validateJournalEntry(entry: Partial<JournalEntry>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];

    // Basic field validation
    this.validateBasicFields(entry, errors);
    
    // Content validation
    this.validateContent(entry, warnings, suggestions);
    
    // Emotional state validation
    if (entry.emotionalState) {
      this.validateEmotionalState(entry.emotionalState, warnings);
    }
    
    // Process metrics validation
    if (entry.processMetrics) {
      this.validateProcessMetrics(entry.processMetrics, warnings);
    }
    
    // Section validation
    if (entry.sections) {
      this.validateSections(entry.sections, errors, warnings);
    }

    // Cross-field validation
    this.validateCrossFields(entry, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate specific field with real-time feedback
   */
  validateField(field: string, value: any, entry?: Partial<JournalEntry>): ValidationError | null {
    const rule = this.validationRules.find(r => r.field === field);
    if (!rule) return null;

    return rule.validator(value, entry);
  }

  /**
   * Validate date format and constraints
   */
  validateDate(date: string): ValidationError | null {
    if (!date) {
      return {
        field: 'date',
        message: 'Date is required for journal entries',
        code: 'REQUIRED_FIELD',
        severity: 'error',
        suggestion: 'Please select a valid date'
      };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return {
        field: 'date',
        message: 'Date must be in YYYY-MM-DD format',
        code: 'INVALID_FORMAT',
        severity: 'error',
        suggestion: 'Use format: 2024-01-15'
      };
    }

    const parsedDate = new Date(date);
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const oneMonthFuture = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    if (parsedDate < oneYearAgo) {
      return {
        field: 'date',
        message: 'Journal entries older than one year are not recommended',
        code: 'DATE_TOO_OLD',
        severity: 'warning',
        suggestion: 'Consider creating entries for more recent dates'
      };
    }

    if (parsedDate > oneMonthFuture) {
      return {
        field: 'date',
        message: 'Future journal entries beyond one month are not allowed',
        code: 'DATE_TOO_FUTURE',
        severity: 'error',
        suggestion: 'Please select a date within the next month'
      };
    }

    return null;
  }

  /**
   * Validate text content with helpful suggestions
   */
  validateTextContent(content: string, field: string, minLength = 0, maxLength = 10000): ValidationError | null {
    if (minLength > 0 && (!content || content.trim().length < minLength)) {
      return {
        field,
        message: `${field} should be at least ${minLength} characters`,
        code: 'MIN_LENGTH',
        severity: 'warning',
        suggestion: `Add more detail to your ${field.toLowerCase()}`
      };
    }

    if (content && content.length > maxLength) {
      return {
        field,
        message: `${field} exceeds maximum length of ${maxLength} characters`,
        code: 'MAX_LENGTH',
        severity: 'error',
        suggestion: `Please shorten your ${field.toLowerCase()} or split into multiple sections`
      };
    }

    // Check for potentially problematic content
    if (content && this.containsOnlyRepeatedChars(content)) {
      return {
        field,
        message: 'Content appears to contain only repeated characters',
        code: 'INVALID_CONTENT',
        severity: 'warning',
        suggestion: 'Please provide meaningful content for your journal entry'
      };
    }

    return null;
  }

  /**
   * Validate emotional state ratings
   */
  private validateEmotionalState(emotionalState: EmotionalState, warnings: ValidationError[]): void {
    const phases = ['preMarket', 'duringTrading', 'postMarket'] as const;
    
    phases.forEach(phase => {
      const phaseData = emotionalState[phase];
      if (!phaseData) return;

      Object.entries(phaseData).forEach(([key, value]) => {
        if (typeof value === 'number' && (value < 1 || value > 5)) {
          warnings.push({
            field: `emotionalState.${phase}.${key}`,
            message: `${key} rating must be between 1 and 5`,
            code: 'INVALID_RANGE',
            severity: 'error',
            suggestion: 'Please select a rating from 1 (low) to 5 (high)'
          });
        }
      });
    });

    // Check for consistency
    if (emotionalState.preMarket && emotionalState.postMarket) {
      const preConfidence = emotionalState.preMarket.confidence;
      const postSatisfaction = emotionalState.postMarket.satisfaction;
      
      if (preConfidence >= 4 && postSatisfaction <= 2) {
        warnings.push({
          field: 'emotionalState',
          message: 'High pre-market confidence with low post-market satisfaction detected',
          code: 'EMOTIONAL_INCONSISTENCY',
          severity: 'info',
          suggestion: 'Consider reflecting on what changed during the trading session'
        });
      }
    }
  }

  /**
   * Validate process metrics
   */
  private validateProcessMetrics(processMetrics: ProcessMetrics, warnings: ValidationError[]): void {
    const metrics = ['planAdherence', 'riskManagement', 'entryTiming', 'exitTiming'];
    
    metrics.forEach(metric => {
      const value = processMetrics[metric as keyof ProcessMetrics];
      if (typeof value === 'number' && (value < 1 || value > 5)) {
        warnings.push({
          field: `processMetrics.${metric}`,
          message: `${metric} score must be between 1 and 5`,
          code: 'INVALID_RANGE',
          severity: 'error',
          suggestion: 'Rate your performance from 1 (poor) to 5 (excellent)'
        });
      }
    });

    // Check for unrealistic perfect scores
    const allScores = metrics.map(m => processMetrics[m as keyof ProcessMetrics]).filter(s => typeof s === 'number');
    if (allScores.length > 0 && allScores.every(score => score === 5)) {
      warnings.push({
        field: 'processMetrics',
        message: 'Perfect scores across all metrics are uncommon',
        code: 'PERFECT_SCORES',
        severity: 'info',
        suggestion: 'Consider if there are any areas for improvement, even small ones'
      });
    }
  }

  /**
   * Validate journal sections
   */
  private validateSections(sections: JournalSection[], errors: ValidationError[], warnings: ValidationError[]): void {
    sections.forEach((section, index) => {
      if (!section.title || section.title.trim().length === 0) {
        errors.push({
          field: `sections[${index}].title`,
          message: `Section ${index + 1} is missing a title`,
          code: 'MISSING_TITLE',
          severity: 'error',
          suggestion: 'Please provide a descriptive title for this section'
        });
      }

      if (section.isRequired && (!section.content || section.content.toString().trim().length === 0)) {
        warnings.push({
          field: `sections[${index}].content`,
          message: `Required section "${section.title}" is empty`,
          code: 'REQUIRED_SECTION_EMPTY',
          severity: 'warning',
          suggestion: 'This section is marked as required. Please add some content.'
        });
      }
    });
  }

  /**
   * Validate basic required fields
   */
  private validateBasicFields(entry: Partial<JournalEntry>, errors: ValidationError[]): void {
    if (!entry.userId) {
      errors.push({
        field: 'userId',
        message: 'User ID is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    const dateError = this.validateDate(entry.date || '');
    if (dateError) {
      errors.push(dateError);
    }
  }

  /**
   * Validate content completeness and quality
   */
  private validateContent(entry: Partial<JournalEntry>, warnings: ValidationError[], suggestions: ValidationError[]): void {
    const contentFields = ['preMarketNotes', 'tradingNotes', 'postMarketReflection', 'lessonsLearned'];
    const hasAnyContent = contentFields.some(field => entry[field as keyof JournalEntry] && 
      (entry[field as keyof JournalEntry] as string).trim().length > 0);

    if (!hasAnyContent) {
      warnings.push({
        field: 'content',
        message: 'Journal entry appears to be empty',
        code: 'EMPTY_ENTRY',
        severity: 'warning',
        suggestion: 'Add some notes about your trading day, market observations, or reflections'
      });
    }

    // Check for very short entries
    const totalContentLength = contentFields.reduce((total, field) => {
      const content = entry[field as keyof JournalEntry] as string;
      return total + (content ? content.length : 0);
    }, 0);

    if (totalContentLength > 0 && totalContentLength < 50) {
      suggestions.push({
        field: 'content',
        message: 'Journal entry is quite brief',
        code: 'SHORT_ENTRY',
        severity: 'info',
        suggestion: 'Consider adding more detail to get the most value from your journaling'
      });
    }
  }

  /**
   * Cross-field validation for logical consistency
   */
  private validateCrossFields(entry: Partial<JournalEntry>, warnings: ValidationError[], suggestions: ValidationError[]): void {
    // Check if there are trade references but no trading notes
    if (entry.tradeReferences && entry.tradeReferences.length > 0 && 
        (!entry.tradingNotes || entry.tradingNotes.trim().length === 0)) {
      suggestions.push({
        field: 'tradingNotes',
        message: 'You have trade references but no trading notes',
        code: 'MISSING_TRADE_NOTES',
        severity: 'info',
        suggestion: 'Consider adding notes about your trading decisions and observations'
      });
    }

    // Check if daily P&L is significant but no reflection
    if (entry.dailyPnL && Math.abs(entry.dailyPnL) > 1000 && 
        (!entry.postMarketReflection || entry.postMarketReflection.trim().length === 0)) {
      suggestions.push({
        field: 'postMarketReflection',
        message: 'Significant P&L day without post-market reflection',
        code: 'MISSING_REFLECTION',
        severity: 'info',
        suggestion: 'Consider reflecting on what led to this significant P&L result'
      });
    }
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): void {
    this.validationRules = [
      {
        field: 'date',
        validator: (value) => this.validateDate(value),
        required: true
      },
      {
        field: 'preMarketNotes',
        validator: (value) => this.validateTextContent(value, 'Pre-market notes', 0, 5000)
      },
      {
        field: 'tradingNotes',
        validator: (value) => this.validateTextContent(value, 'Trading notes', 0, 10000)
      },
      {
        field: 'postMarketReflection',
        validator: (value) => this.validateTextContent(value, 'Post-market reflection', 0, 5000)
      },
      {
        field: 'lessonsLearned',
        validator: (value) => this.validateTextContent(value, 'Lessons learned', 0, 3000)
      }
    ];
  }

  /**
   * Check if content contains only repeated characters
   */
  private containsOnlyRepeatedChars(content: string): boolean {
    const trimmed = content.trim();
    if (trimmed.length < 10) return false;
    
    const firstChar = trimmed[0];
    return trimmed.split('').every(char => char === firstChar || char === ' ');
  }

  /**
   * Get validation suggestions for improving journal quality
   */
  getJournalQualitySuggestions(entry: Partial<JournalEntry>): string[] {
    const suggestions: string[] = [];

    if (!entry.emotionalState) {
      suggestions.push('Add emotional tracking to better understand your trading psychology');
    }

    if (!entry.processMetrics) {
      suggestions.push('Rate your process adherence to focus on discipline over outcomes');
    }

    if (!entry.images || entry.images.length === 0) {
      suggestions.push('Consider adding screenshots of your trades or market analysis');
    }

    if (!entry.lessonsLearned || entry.lessonsLearned.trim().length === 0) {
      suggestions.push('Document what you learned today to accelerate your growth');
    }

    return suggestions;
  }
}

export default ValidationService;
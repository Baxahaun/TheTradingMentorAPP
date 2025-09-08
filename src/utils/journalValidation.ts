/**
 * Journal Validation Utilities
 * 
 * This file contains validation functions and schemas for the journal system.
 * It provides comprehensive validation for journal entries, templates, and related data.
 */

import { 
  JournalEntry, 
  JournalTemplate, 
  JournalSection, 
  TemplateSection,
  EmotionalState,
  ProcessMetrics,
  JournalValidationResult,
  ValidationError,
  ValidationWarning,
  JOURNAL_CONSTANTS,
  JOURNAL_ERROR_CODES
} from '../types/journal';

/**
 * Validates a complete journal entry
 */
export function validateJournalEntry(entry: Partial<JournalEntry>): JournalValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required field validation
  if (!entry.userId) {
    errors.push({
      field: 'userId',
      message: 'User ID is required',
      code: JOURNAL_ERROR_CODES.UNAUTHORIZED_ACCESS,
      severity: 'error'
    });
  }

  if (!entry.date) {
    errors.push({
      field: 'date',
      message: 'Date is required',
      code: JOURNAL_ERROR_CODES.INVALID_DATE_FORMAT,
      severity: 'error'
    });
  } else if (!isValidDateFormat(entry.date)) {
    errors.push({
      field: 'date',
      message: 'Date must be in YYYY-MM-DD format',
      code: JOURNAL_ERROR_CODES.INVALID_DATE_FORMAT,
      severity: 'error'
    });
  }

  // Validate sections
  if (entry.sections) {
    entry.sections.forEach((section, index) => {
      const sectionValidation = validateJournalSection(section);
      sectionValidation.errors.forEach(error => {
        errors.push({
          ...error,
          field: `sections[${index}].${error.field}`
        });
      });
      sectionValidation.warnings.forEach(warning => {
        warnings.push({
          ...warning,
          field: `sections[${index}].${warning.field}`
        });
      });
    });
  }

  // Validate emotional state
  if (entry.emotionalState) {
    const emotionalValidation = validateEmotionalState(entry.emotionalState);
    emotionalValidation.errors.forEach(error => {
      errors.push({
        ...error,
        field: `emotionalState.${error.field}`
      });
    });
  }

  // Validate process metrics
  if (entry.processMetrics) {
    const processValidation = validateProcessMetrics(entry.processMetrics);
    processValidation.errors.forEach(error => {
      errors.push({
        ...error,
        field: `processMetrics.${error.field}`
      });
    });
  }

  // Content length warnings
  if (entry.sections) {
    const totalWordCount = calculateWordCount(entry.sections);
    if (totalWordCount === 0) {
      warnings.push({
        field: 'sections',
        message: 'Journal entry appears to be empty',
        suggestion: 'Add some content to make this entry meaningful'
      });
    } else if (totalWordCount < 50) {
      warnings.push({
        field: 'sections',
        message: 'Journal entry is quite short',
        suggestion: 'Consider adding more detail to capture valuable insights'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a journal section
 */
export function validateJournalSection(section: Partial<JournalSection>): JournalValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!section.title) {
    errors.push({
      field: 'title',
      message: 'Section title is required',
      code: JOURNAL_ERROR_CODES.TEMPLATE_SECTION_MISSING,
      severity: 'error'
    });
  }

  if (!section.type) {
    errors.push({
      field: 'type',
      message: 'Section type is required',
      code: JOURNAL_ERROR_CODES.INVALID_TEMPLATE_STRUCTURE,
      severity: 'error'
    });
  }

  // Content validation based on type
  if (section.type === 'text' && section.isRequired && (!section.content || section.content.trim().length === 0)) {
    errors.push({
      field: 'content',
      message: `Required section "${section.title}" cannot be empty`,
      code: JOURNAL_ERROR_CODES.REQUIRED_SECTION_EMPTY,
      severity: 'error'
    });
  }

  // Word count validation for text sections
  if (section.type === 'text' && section.content) {
    const wordCount = countWords(section.content);
    if (wordCount > JOURNAL_CONSTANTS.MAX_WORD_COUNT_PER_SECTION) {
      errors.push({
        field: 'content',
        message: `Section content exceeds maximum word limit of ${JOURNAL_CONSTANTS.MAX_WORD_COUNT_PER_SECTION}`,
        code: JOURNAL_ERROR_CODES.CONTENT_TOO_LONG,
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates emotional state data
 */
export function validateEmotionalState(emotionalState: Partial<EmotionalState>): JournalValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate emotion scale values
  const validateEmotionValue = (value: number | undefined, fieldName: string) => {
    if (value !== undefined) {
      if (value < JOURNAL_CONSTANTS.EMOTION_SCALE_MIN || value > JOURNAL_CONSTANTS.EMOTION_SCALE_MAX) {
        errors.push({
          field: fieldName,
          message: `Emotion value must be between ${JOURNAL_CONSTANTS.EMOTION_SCALE_MIN} and ${JOURNAL_CONSTANTS.EMOTION_SCALE_MAX}`,
          code: JOURNAL_ERROR_CODES.INVALID_EMOTION_VALUE,
          severity: 'error'
        });
      }
    }
  };

  // Validate pre-market emotions
  if (emotionalState.preMarket) {
    validateEmotionValue(emotionalState.preMarket.confidence, 'preMarket.confidence');
    validateEmotionValue(emotionalState.preMarket.anxiety, 'preMarket.anxiety');
    validateEmotionValue(emotionalState.preMarket.focus, 'preMarket.focus');
    validateEmotionValue(emotionalState.preMarket.energy, 'preMarket.energy');
    validateEmotionValue(emotionalState.preMarket.preparedness, 'preMarket.preparedness');
  }

  // Validate during-trading emotions
  if (emotionalState.duringTrading) {
    validateEmotionValue(emotionalState.duringTrading.discipline, 'duringTrading.discipline');
    validateEmotionValue(emotionalState.duringTrading.patience, 'duringTrading.patience');
    validateEmotionValue(emotionalState.duringTrading.emotionalControl, 'duringTrading.emotionalControl');
    validateEmotionValue(emotionalState.duringTrading.decisionClarity, 'duringTrading.decisionClarity');
    validateEmotionValue(emotionalState.duringTrading.stressManagement, 'duringTrading.stressManagement');
  }

  // Validate post-market emotions
  if (emotionalState.postMarket) {
    validateEmotionValue(emotionalState.postMarket.satisfaction, 'postMarket.satisfaction');
    validateEmotionValue(emotionalState.postMarket.learningValue, 'postMarket.learningValue');
    validateEmotionValue(emotionalState.postMarket.frustrationLevel, 'postMarket.frustrationLevel');
    validateEmotionValue(emotionalState.postMarket.accomplishment, 'postMarket.accomplishment');
  }

  // Validate overall emotional metrics
  validateEmotionValue(emotionalState.stressLevel, 'stressLevel');
  validateEmotionValue(emotionalState.confidenceLevel, 'confidenceLevel');

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates process metrics data
 */
export function validateProcessMetrics(processMetrics: Partial<ProcessMetrics>): JournalValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate process score values (1-5 scale)
  const validateProcessValue = (value: number | undefined, fieldName: string) => {
    if (value !== undefined) {
      if (value < 1 || value > 5) {
        errors.push({
          field: fieldName,
          message: 'Process metric values must be between 1 and 5',
          code: JOURNAL_ERROR_CODES.INVALID_PROCESS_SCORE,
          severity: 'error'
        });
      }
    }
  };

  validateProcessValue(processMetrics.planAdherence, 'planAdherence');
  validateProcessValue(processMetrics.riskManagement, 'riskManagement');
  validateProcessValue(processMetrics.entryTiming, 'entryTiming');
  validateProcessValue(processMetrics.exitTiming, 'exitTiming');
  validateProcessValue(processMetrics.emotionalDiscipline, 'emotionalDiscipline');
  validateProcessValue(processMetrics.overallDiscipline, 'overallDiscipline');

  // Validate process score (0-100 scale)
  if (processMetrics.processScore !== undefined) {
    if (processMetrics.processScore < 0 || processMetrics.processScore > 100) {
      errors.push({
        field: 'processScore',
        message: 'Process score must be between 0 and 100',
        code: JOURNAL_ERROR_CODES.INVALID_PROCESS_SCORE,
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a journal template
 */
export function validateJournalTemplate(template: Partial<JournalTemplate>): JournalValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!template.name || template.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Template name is required',
      code: JOURNAL_ERROR_CODES.INVALID_TEMPLATE_STRUCTURE,
      severity: 'error'
    });
  }

  if (!template.category) {
    errors.push({
      field: 'category',
      message: 'Template category is required',
      code: JOURNAL_ERROR_CODES.INVALID_TEMPLATE_STRUCTURE,
      severity: 'error'
    });
  }

  // Validate sections
  if (!template.sections || template.sections.length === 0) {
    errors.push({
      field: 'sections',
      message: 'Template must have at least one section',
      code: JOURNAL_ERROR_CODES.INVALID_TEMPLATE_STRUCTURE,
      severity: 'error'
    });
  } else {
    template.sections.forEach((section, index) => {
      const sectionValidation = validateTemplateSection(section);
      sectionValidation.errors.forEach(error => {
        errors.push({
          ...error,
          field: `sections[${index}].${error.field}`
        });
      });
    });

    // Check for duplicate section orders
    const orders = template.sections.map(s => s.order);
    const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);
    if (duplicateOrders.length > 0) {
      warnings.push({
        field: 'sections',
        message: 'Duplicate section orders detected',
        suggestion: 'Ensure each section has a unique order value'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a template section
 */
export function validateTemplateSection(section: Partial<TemplateSection>): JournalValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!section.title) {
    errors.push({
      field: 'title',
      message: 'Section title is required',
      code: JOURNAL_ERROR_CODES.TEMPLATE_SECTION_MISSING,
      severity: 'error'
    });
  }

  if (!section.type) {
    errors.push({
      field: 'type',
      message: 'Section type is required',
      code: JOURNAL_ERROR_CODES.INVALID_TEMPLATE_STRUCTURE,
      severity: 'error'
    });
  }

  if (!section.prompt) {
    errors.push({
      field: 'prompt',
      message: 'Section prompt is required',
      code: JOURNAL_ERROR_CODES.TEMPLATE_SECTION_MISSING,
      severity: 'error'
    });
  }

  if (section.order === undefined || section.order < 0) {
    errors.push({
      field: 'order',
      message: 'Section order must be a non-negative number',
      code: JOURNAL_ERROR_CODES.INVALID_TEMPLATE_STRUCTURE,
      severity: 'error'
    });
  }

  // Type-specific validation
  if (section.type === 'checklist' && section.config) {
    if (!section.config.items || section.config.items.length === 0) {
      warnings.push({
        field: 'config.items',
        message: 'Checklist section should have at least one item',
        suggestion: 'Add checklist items to make this section useful'
      });
    }
  }

  if (section.type === 'rating' && section.config) {
    if (!section.config.metrics || section.config.metrics.length === 0) {
      warnings.push({
        field: 'config.metrics',
        message: 'Rating section should have at least one metric',
        suggestion: 'Add rating metrics to make this section functional'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Validates date format (YYYY-MM-DD)
 */
export function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

/**
 * Counts words in a text string
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculates total word count for all text sections
 */
export function calculateWordCount(sections: JournalSection[]): number {
  return sections.reduce((total, section) => {
    if (section.type === 'text' && section.content) {
      return total + countWords(section.content);
    }
    return total;
  }, 0);
}

/**
 * Calculates completion percentage for a journal entry
 */
export function calculateCompletionPercentage(sections: JournalSection[]): number {
  if (sections.length === 0) return 0;
  
  const requiredSections = sections.filter(s => s.isRequired);
  if (requiredSections.length === 0) return 100;
  
  const completedRequiredSections = requiredSections.filter(s => s.isCompleted);
  return Math.round((completedRequiredSections.length / requiredSections.length) * 100);
}

/**
 * Calculates process score based on individual metrics
 */
export function calculateProcessScore(processMetrics: ProcessMetrics): number {
  const weights = JOURNAL_CONSTANTS.PROCESS_SCORE_WEIGHTS;
  
  const weightedSum = 
    (processMetrics.planAdherence || 0) * weights.planAdherence +
    (processMetrics.riskManagement || 0) * weights.riskManagement +
    (processMetrics.entryTiming || 0) * weights.entryTiming +
    (processMetrics.exitTiming || 0) * weights.exitTiming +
    (processMetrics.emotionalDiscipline || 0) * weights.emotionalDiscipline;
  
  // Convert from 1-5 scale to 0-100 scale
  return Math.round((weightedSum / 5) * 100);
}

/**
 * Validates image file constraints
 */
export function validateImageFile(file: File): JournalValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // File size validation
  if (file.size > JOURNAL_CONSTANTS.MAX_IMAGE_SIZE) {
    errors.push({
      field: 'file',
      message: `Image file size exceeds maximum limit of ${JOURNAL_CONSTANTS.MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
      code: JOURNAL_ERROR_CODES.IMAGE_TOO_LARGE,
      severity: 'error'
    });
  }

  // File type validation
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push({
      field: 'file',
      message: 'Invalid image format. Supported formats: JPEG, PNG, GIF, WebP',
      code: JOURNAL_ERROR_CODES.INVALID_IMAGE_FORMAT,
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sanitizes text content for safe storage and display
 */
export function sanitizeTextContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validates trade reference
 */
export function validateTradeReference(tradeId: string, availableTradeIds: string[]): boolean {
  return availableTradeIds.includes(tradeId);
}

/**
 * Checks if a journal entry meets completion criteria
 */
export function isJournalEntryComplete(entry: JournalEntry): boolean {
  const completionPercentage = calculateCompletionPercentage(entry.sections);
  return completionPercentage >= JOURNAL_CONSTANTS.MIN_COMPLETION_PERCENTAGE;
}
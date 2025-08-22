/**
 * Enhanced tag validation service with comprehensive error handling
 * Provides detailed validation, sanitization, and user-friendly error messages
 */

export interface TagValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface TagValidationResult {
  isValid: boolean;
  errors: TagValidationError[];
  warnings: TagValidationError[];
  sanitizedValue?: string;
}

export interface TagOperationResult<T = any> {
  success: boolean;
  data?: T;
  errors: TagValidationError[];
  retryable: boolean;
}

export class TagValidationService {
  private static instance: TagValidationService;
  
  // Validation constants
  private static readonly MIN_TAG_LENGTH = 1;
  private static readonly MAX_TAG_LENGTH = 50;
  private static readonly MAX_TAGS_PER_TRADE = 20;
  private static readonly VALID_TAG_PATTERN = /^[a-zA-Z0-9_]+$/;
  private static readonly RESERVED_WORDS = ['null', 'undefined', 'true', 'false'];

  private constructor() {}

  public static getInstance(): TagValidationService {
    if (!TagValidationService.instance) {
      TagValidationService.instance = new TagValidationService();
    }
    return TagValidationService.instance;
  }  /**
 
  * Validates a single tag with comprehensive error checking
   */
  public validateTag(tag: string): TagValidationResult {
    const errors: TagValidationError[] = [];
    const warnings: TagValidationError[] = [];
    let sanitizedValue: string | undefined;

    try {
      // Handle null/undefined input
      if (tag === null || tag === undefined) {
        errors.push({
          code: 'TAG_NULL',
          message: 'Tag cannot be null or undefined',
          severity: 'error'
        });
        return { isValid: false, errors, warnings };
      }

      // Convert to string if not already
      const tagStr = String(tag);

      // Check for empty or whitespace-only tags
      if (!tagStr || tagStr.trim().length === 0) {
        errors.push({
          code: 'TAG_EMPTY',
          message: 'Tag cannot be empty or contain only whitespace',
          severity: 'error'
        });
        return { isValid: false, errors, warnings };
      }

      const trimmedTag = tagStr.trim();

      // Check for hashtag prefix
      let tagContent: string;
      if (!trimmedTag.startsWith('#')) {
        warnings.push({
          code: 'TAG_NO_HASH',
          message: 'Tag should start with # symbol',
          severity: 'warning'
        });
        tagContent = trimmedTag;
        sanitizedValue = `#${trimmedTag.toLowerCase()}`;
      } else {
        tagContent = trimmedTag.slice(1);
        sanitizedValue = trimmedTag.toLowerCase();
      }

      // Check minimum length after removing #
      if (tagContent.length < TagValidationService.MIN_TAG_LENGTH) {
        errors.push({
          code: 'TAG_TOO_SHORT',
          message: `Tag must be at least ${TagValidationService.MIN_TAG_LENGTH} character long`,
          severity: 'error'
        });
      }

      // Check maximum length
      if (tagContent.length > TagValidationService.MAX_TAG_LENGTH) {
        errors.push({
          code: 'TAG_TOO_LONG',
          message: `Tag cannot be longer than ${TagValidationService.MAX_TAG_LENGTH} characters`,
          severity: 'error'
        });
      }

      // Check for invalid characters
      if (!TagValidationService.VALID_TAG_PATTERN.test(tagContent)) {
        const invalidChars = tagContent.match(/[^a-zA-Z0-9_]/g);
        errors.push({
          code: 'TAG_INVALID_CHARS',
          message: `Tag contains invalid characters: ${invalidChars?.join(', ')}. Only letters, numbers, and underscores are allowed`,
          severity: 'error'
        });
      }

      // Check for reserved words
      if (TagValidationService.RESERVED_WORDS.includes(tagContent.toLowerCase())) {
        errors.push({
          code: 'TAG_RESERVED_WORD',
          message: `"${tagContent}" is a reserved word and cannot be used as a tag`,
          severity: 'error'
        });
      }

      // Warnings for potential issues
      if (/^\d/.test(tagContent)) {
        warnings.push({
          code: 'TAG_STARTS_WITH_NUMBER',
          message: 'Tags starting with numbers may be harder to search and organize',
          severity: 'warning'
        });
      }

      if (tagContent.length > 20) {
        warnings.push({
          code: 'TAG_VERY_LONG',
          message: 'Very long tags may be difficult to display in the interface',
          severity: 'warning'
        });
      }

      if (tagContent.includes('_'.repeat(3))) {
        warnings.push({
          code: 'TAG_MULTIPLE_UNDERSCORES',
          message: 'Multiple consecutive underscores may make tags harder to read',
          severity: 'warning'
        });
      }

    } catch (error) {
      errors.push({
        code: 'TAG_VALIDATION_ERROR',
        message: `Unexpected error during tag validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: errors.length === 0 ? sanitizedValue : undefined
    };
  } 
 /**
   * Validates an array of tags with duplicate detection and batch validation
   */
  public validateTags(tags: string[]): TagValidationResult {
    const allErrors: TagValidationError[] = [];
    const allWarnings: TagValidationError[] = [];
    const sanitizedTags: string[] = [];

    try {
      // Handle null/undefined input
      if (!Array.isArray(tags)) {
        allErrors.push({
          code: 'TAGS_NOT_ARRAY',
          message: 'Tags must be provided as an array',
          severity: 'error'
        });
        return { isValid: false, errors: allErrors, warnings: allWarnings };
      }

      // Check maximum number of tags
      if (tags.length > TagValidationService.MAX_TAGS_PER_TRADE) {
        allErrors.push({
          code: 'TOO_MANY_TAGS',
          message: `Cannot have more than ${TagValidationService.MAX_TAGS_PER_TRADE} tags per trade`,
          severity: 'error'
        });
      }

      // Validate each tag individually
      const validationResults = tags.map((tag, index) => {
        const result = this.validateTag(tag);
        
        // Add field information to errors and warnings
        result.errors.forEach(error => {
          allErrors.push({
            ...error,
            field: `tag[${index}]`,
            message: `Tag ${index + 1}: ${error.message}`
          });
        });

        result.warnings.forEach(warning => {
          allWarnings.push({
            ...warning,
            field: `tag[${index}]`,
            message: `Tag ${index + 1}: ${warning.message}`
          });
        });

        if (result.sanitizedValue) {
          sanitizedTags.push(result.sanitizedValue);
        }

        return result;
      });

      // Check for duplicates in sanitized tags
      const duplicateMap = new Map<string, number[]>();
      sanitizedTags.forEach((tag, index) => {
        if (!duplicateMap.has(tag)) {
          duplicateMap.set(tag, []);
        }
        duplicateMap.get(tag)!.push(index);
      });

      duplicateMap.forEach((indices, tag) => {
        if (indices.length > 1) {
          allErrors.push({
            code: 'DUPLICATE_TAGS',
            message: `Duplicate tag "${tag}" found at positions: ${indices.map(i => i + 1).join(', ')}`,
            severity: 'error'
          });
        }
      });

      // Check for similar tags that might be typos
      this.checkForSimilarTags(sanitizedTags).forEach(warning => {
        allWarnings.push(warning);
      });

    } catch (error) {
      allErrors.push({
        code: 'TAGS_VALIDATION_ERROR',
        message: `Unexpected error during tags validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      sanitizedValue: allErrors.length === 0 ? sanitizedTags : undefined
    };
  }

  /**
   * Checks for similar tags that might be typos
   */
  private checkForSimilarTags(tags: string[]): TagValidationError[] {
    const warnings: TagValidationError[] = [];
    
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const similarity = this.calculateSimilarity(tags[i], tags[j]);
        if (similarity > 0.8 && similarity < 1.0) {
          warnings.push({
            code: 'SIMILAR_TAGS',
            message: `Tags "${tags[i]}" and "${tags[j]}" are very similar. Did you mean to use the same tag?`,
            severity: 'warning'
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Calculates similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }  
/**
   * Sanitizes a tag by removing invalid characters and normalizing format
   */
  public sanitizeTag(tag: string): TagOperationResult<string> {
    try {
      if (!tag || typeof tag !== 'string') {
        return {
          success: false,
          errors: [{
            code: 'SANITIZE_INVALID_INPUT',
            message: 'Invalid input for tag sanitization',
            severity: 'error'
          }],
          retryable: false
        };
      }

      let sanitized = tag.trim();

      // Add # prefix if missing
      if (!sanitized.startsWith('#')) {
        sanitized = `#${sanitized}`;
      }

      // Extract content after #
      const content = sanitized.slice(1);

      // Remove invalid characters
      const cleanContent = content.replace(/[^a-zA-Z0-9_]/g, '');

      // Convert to lowercase
      const normalized = cleanContent.toLowerCase();

      if (!normalized) {
        return {
          success: false,
          errors: [{
            code: 'SANITIZE_NO_VALID_CHARS',
            message: 'No valid characters remaining after sanitization',
            severity: 'error'
          }],
          retryable: false
        };
      }

      return {
        success: true,
        data: `#${normalized}`,
        errors: [],
        retryable: false
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'SANITIZE_ERROR',
          message: `Error during tag sanitization: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        retryable: true
      };
    }
  }

  /**
   * Formats validation errors for user display
   */
  public formatErrorsForUser(errors: TagValidationError[]): string[] {
    return errors.map(error => {
      switch (error.code) {
        case 'TAG_EMPTY':
          return 'Please enter a tag name';
        case 'TAG_TOO_LONG':
          return `Tag is too long (maximum ${TagValidationService.MAX_TAG_LENGTH} characters)`;
        case 'TAG_INVALID_CHARS':
          return 'Tag can only contain letters, numbers, and underscores';
        case 'DUPLICATE_TAGS':
          return 'Duplicate tags are not allowed';
        case 'TOO_MANY_TAGS':
          return `You can only add up to ${TagValidationService.MAX_TAGS_PER_TRADE} tags`;
        case 'TAG_RESERVED_WORD':
          return 'This word is reserved and cannot be used as a tag';
        default:
          return error.message;
      }
    });
  }

  /**
   * Formats validation warnings for user display
   */
  public formatWarningsForUser(warnings: TagValidationError[]): string[] {
    return warnings.map(warning => {
      switch (warning.code) {
        case 'TAG_NO_HASH':
          return 'Tags should start with # (we\'ll add it for you)';
        case 'TAG_STARTS_WITH_NUMBER':
          return 'Consider starting tags with letters for better organization';
        case 'TAG_VERY_LONG':
          return 'Long tags may be truncated in some views';
        case 'SIMILAR_TAGS':
          return warning.message;
        default:
          return warning.message;
      }
    });
  }

  /**
   * Checks if an error is retryable (network/temporary issues)
   */
  public isRetryableError(error: TagValidationError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
      'SANITIZE_ERROR'
    ];
    return retryableCodes.includes(error.code);
  }

  /**
   * Gets validation constants for use in UI components
   */
  public getValidationConstants() {
    return {
      MIN_TAG_LENGTH: TagValidationService.MIN_TAG_LENGTH,
      MAX_TAG_LENGTH: TagValidationService.MAX_TAG_LENGTH,
      MAX_TAGS_PER_TRADE: TagValidationService.MAX_TAGS_PER_TRADE,
      VALID_TAG_PATTERN: TagValidationService.VALID_TAG_PATTERN,
      RESERVED_WORDS: [...TagValidationService.RESERVED_WORDS]
    };
  }
}

// Export singleton instance
export const tagValidationService = TagValidationService.getInstance();
import { describe, it, expect, beforeEach } from 'vitest';
import { TagValidationService, tagValidationService } from '../tagValidationService';

describe('TagValidationService', () => {
  let service: TagValidationService;

  beforeEach(() => {
    service = TagValidationService.getInstance();
  });

  describe('validateTag', () => {
    it('should validate a correct tag', () => {
      const result = service.validateTag('#breakout');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedValue).toBe('#breakout');
    });

    it('should handle null and undefined input', () => {
      const nullResult = service.validateTag(null as any);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors[0].code).toBe('TAG_NULL');

      const undefinedResult = service.validateTag(undefined as any);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.errors[0].code).toBe('TAG_NULL');
    });

    it('should reject empty and whitespace-only tags', () => {
      const emptyResult = service.validateTag('');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors[0].code).toBe('TAG_EMPTY');

      const whitespaceResult = service.validateTag('   ');
      expect(whitespaceResult.isValid).toBe(false);
      expect(whitespaceResult.errors[0].code).toBe('TAG_EMPTY');
    });

    it('should warn about missing hashtag prefix', () => {
      const result = service.validateTag('breakout');
      expect(result.isValid).toBe(true);
      expect(result.warnings[0].code).toBe('TAG_NO_HASH');
      expect(result.sanitizedValue).toBe('#breakout');
    });

    it('should reject tags that are too long', () => {
      const longTag = '#' + 'a'.repeat(51);
      const result = service.validateTag(longTag);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('TAG_TOO_LONG');
    });

    it('should reject tags with invalid characters', () => {
      const result = service.validateTag('#break-out!');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('TAG_INVALID_CHARS');
      expect(result.errors[0].message).toContain('-, !');
    });

    it('should reject reserved words', () => {
      const result = service.validateTag('#null');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('TAG_RESERVED_WORD');
    });

    it('should warn about tags starting with numbers', () => {
      const result = service.validateTag('#123breakout');
      expect(result.isValid).toBe(true);
      expect(result.warnings[0].code).toBe('TAG_STARTS_WITH_NUMBER');
    });

    it('should warn about very long tags', () => {
      const longTag = '#' + 'a'.repeat(25);
      const result = service.validateTag(longTag);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TAG_VERY_LONG')).toBe(true);
    });

    it('should warn about multiple consecutive underscores', () => {
      const result = service.validateTag('#break___out');
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TAG_MULTIPLE_UNDERSCORES')).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      // Mock a scenario that would cause an error
      const originalTest = RegExp.prototype.test;
      RegExp.prototype.test = () => { throw new Error('Test error'); };
      
      const result = service.validateTag('#test');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('TAG_VALIDATION_ERROR');
      
      // Restore original method
      RegExp.prototype.test = originalTest;
    });
  }); 
 describe('validateTags', () => {
    it('should validate an array of correct tags', () => {
      const result = service.validateTags(['#breakout', '#trend', '#scalp']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedValue).toEqual(['#breakout', '#trend', '#scalp']);
    });

    it('should handle non-array input', () => {
      const result = service.validateTags(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('TAGS_NOT_ARRAY');
    });

    it('should reject too many tags', () => {
      const manyTags = Array(25).fill('#tag');
      const result = service.validateTags(manyTags);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('TOO_MANY_TAGS');
    });

    it('should detect duplicate tags', () => {
      const result = service.validateTags(['#breakout', '#trend', '#breakout']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_TAGS')).toBe(true);
    });

    it('should detect similar tags', () => {
      const result = service.validateTags(['#breakout', '#breakot']);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'SIMILAR_TAGS')).toBe(true);
    });

    it('should add field information to individual tag errors', () => {
      const result = service.validateTags(['#valid', '', '#invalid-chars']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'tag[1]')).toBe(true);
      expect(result.errors.some(e => e.field === 'tag[2]')).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      // Mock validateTag to throw an error
      const originalValidateTag = service.validateTag;
      service.validateTag = () => { throw new Error('Test error'); };
      
      const result = service.validateTags(['#test']);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('TAGS_VALIDATION_ERROR');
      
      // Restore original method
      service.validateTag = originalValidateTag;
    });
  });

  describe('sanitizeTag', () => {
    it('should sanitize a valid tag', () => {
      const result = service.sanitizeTag('BREAKOUT');
      expect(result.success).toBe(true);
      expect(result.data).toBe('#breakout');
    });

    it('should handle invalid input', () => {
      const result = service.sanitizeTag(null as any);
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('SANITIZE_INVALID_INPUT');
    });

    it('should remove invalid characters', () => {
      const result = service.sanitizeTag('break-out!@#');
      expect(result.success).toBe(true);
      expect(result.data).toBe('#breakout');
    });

    it('should handle tags with no valid characters', () => {
      const result = service.sanitizeTag('!@#$%');
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('SANITIZE_NO_VALID_CHARS');
    });

    it('should handle sanitization errors gracefully', () => {
      // Mock String.prototype.replace to throw an error
      const originalReplace = String.prototype.replace;
      String.prototype.replace = () => { throw new Error('Test error'); };
      
      const result = service.sanitizeTag('#test');
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('SANITIZE_ERROR');
      expect(result.retryable).toBe(true);
      
      // Restore original method
      String.prototype.replace = originalReplace;
    });
  });

  describe('formatErrorsForUser', () => {
    it('should format known error codes', () => {
      const errors = [
        { code: 'TAG_EMPTY', message: 'Original message', severity: 'error' as const },
        { code: 'TAG_TOO_LONG', message: 'Original message', severity: 'error' as const },
        { code: 'UNKNOWN_CODE', message: 'Keep original', severity: 'error' as const }
      ];

      const formatted = service.formatErrorsForUser(errors);
      expect(formatted[0]).toBe('Please enter a tag name');
      expect(formatted[1]).toContain('Tag is too long');
      expect(formatted[2]).toBe('Keep original');
    });
  });

  describe('formatWarningsForUser', () => {
    it('should format known warning codes', () => {
      const warnings = [
        { code: 'TAG_NO_HASH', message: 'Original message', severity: 'warning' as const },
        { code: 'TAG_STARTS_WITH_NUMBER', message: 'Original message', severity: 'warning' as const },
        { code: 'UNKNOWN_CODE', message: 'Keep original', severity: 'warning' as const }
      ];

      const formatted = service.formatWarningsForUser(warnings);
      expect(formatted[0]).toContain('should start with #');
      expect(formatted[1]).toContain('Consider starting tags with letters');
      expect(formatted[2]).toBe('Keep original');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const retryableError = { code: 'NETWORK_ERROR', message: 'Network failed', severity: 'error' as const };
      const nonRetryableError = { code: 'TAG_EMPTY', message: 'Tag empty', severity: 'error' as const };

      expect(service.isRetryableError(retryableError)).toBe(true);
      expect(service.isRetryableError(nonRetryableError)).toBe(false);
    });
  });

  describe('getValidationConstants', () => {
    it('should return validation constants', () => {
      const constants = service.getValidationConstants();
      expect(constants.MIN_TAG_LENGTH).toBe(1);
      expect(constants.MAX_TAG_LENGTH).toBe(50);
      expect(constants.MAX_TAGS_PER_TRADE).toBe(20);
      expect(constants.VALID_TAG_PATTERN).toBeInstanceOf(RegExp);
      expect(Array.isArray(constants.RESERVED_WORDS)).toBe(true);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TagValidationService.getInstance();
      const instance2 = TagValidationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should work with exported singleton', () => {
      expect(tagValidationService).toBe(TagValidationService.getInstance());
    });
  });
});
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTagValidation, useTagOperations } from '../useTagValidation';

// Mock the tag services
vi.mock('../../lib/tagService', () => ({
  tagService: {
    validateTag: vi.fn(),
    validateTags: vi.fn(),
    sanitizeTagWithErrorHandling: vi.fn()
  }
}));

vi.mock('../../lib/tagValidationService', () => ({
  tagValidationService: {
    formatErrorsForUser: vi.fn(),
    formatWarningsForUser: vi.fn(),
    getValidationConstants: vi.fn()
  }
}));

import { tagService } from '../../lib/tagService';
import { tagValidationService } from '../../lib/tagValidationService';

describe('useTagValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (tagService.validateTag as any).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    (tagService.validateTags as any).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    (tagValidationService.formatErrorsForUser as any).mockReturnValue([]);
    (tagValidationService.formatWarningsForUser as any).mockReturnValue([]);
    (tagValidationService.getValidationConstants as any).mockReturnValue({
      MAX_TAGS_PER_TRADE: 20
    });
  });

  describe('validateTag', () => {
    it('should validate a single tag successfully', () => {
      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const validationResult = result.current.validateTag('#breakout');
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
      });

      expect(tagService.validateTag).toHaveBeenCalledWith('#breakout');
    });

    it('should handle validation errors', () => {
      (tagService.validateTag as any).mockReturnValue({
        isValid: false,
        errors: [{ code: 'TAG_EMPTY', message: 'Tag cannot be empty', severity: 'error' }],
        warnings: []
      });
      
      (tagValidationService.formatErrorsForUser as any).mockReturnValue(['Please enter a tag name']);

      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const validationResult = result.current.validateTag('');
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toEqual(['Please enter a tag name']);
      });
    });

    it('should handle validation warnings when enabled', () => {
      (tagService.validateTag as any).mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [{ code: 'TAG_NO_HASH', message: 'Tag should start with #', severity: 'warning' }]
      });
      
      (tagValidationService.formatWarningsForUser as any).mockReturnValue(['Tags should start with # (we\'ll add it for you)']);

      const { result } = renderHook(() => useTagValidation({ showWarnings: true }));

      act(() => {
        const validationResult = result.current.validateTag('breakout');
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.warnings).toEqual(['Tags should start with # (we\'ll add it for you)']);
      });
    });

    it('should not show warnings when disabled', () => {
      (tagService.validateTag as any).mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [{ code: 'TAG_NO_HASH', message: 'Tag should start with #', severity: 'warning' }]
      });

      const { result } = renderHook(() => useTagValidation({ showWarnings: false }));

      act(() => {
        const validationResult = result.current.validateTag('breakout');
        expect(validationResult.warnings).toHaveLength(0);
      });
    });

    it('should handle validation exceptions', () => {
      (tagService.validateTag as any).mockImplementation(() => {
        throw new Error('Validation error');
      });

      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const validationResult = result.current.validateTag('#test');
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toEqual(['An unexpected error occurred during validation']);
      });
    });
  });  
describe('validateTags', () => {
    it('should validate multiple tags successfully', () => {
      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const validationResult = result.current.validateTags(['#breakout', '#trend']);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
      });

      expect(tagService.validateTags).toHaveBeenCalledWith(['#breakout', '#trend']);
    });

    it('should enforce max tags limit', () => {
      const { result } = renderHook(() => useTagValidation({ maxTags: 2 }));

      act(() => {
        const validationResult = result.current.validateTags(['#tag1', '#tag2', '#tag3']);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toEqual(['Cannot have more than 2 tags']);
      });
    });

    it('should use default max tags from constants', () => {
      (tagValidationService.getValidationConstants as any).mockReturnValue({
        MAX_TAGS_PER_TRADE: 3
      });

      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const tags = Array(4).fill('#tag');
        const validationResult = result.current.validateTags(tags);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toEqual(['Cannot have more than 3 tags']);
      });
    });

    it('should handle validation exceptions', () => {
      (tagService.validateTags as any).mockImplementation(() => {
        throw new Error('Validation error');
      });

      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const validationResult = result.current.validateTags(['#test']);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toEqual(['An unexpected error occurred during validation']);
      });
    });
  });

  describe('sanitizeTag', () => {
    it('should sanitize tag successfully', () => {
      (tagService.sanitizeTagWithErrorHandling as any).mockReturnValue({
        success: true,
        data: '#breakout',
        errors: []
      });

      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const sanitizeResult = result.current.sanitizeTag('BREAKOUT');
        expect(sanitizeResult.success).toBe(true);
        expect(sanitizeResult.value).toBe('#breakout');
        expect(sanitizeResult.errors).toHaveLength(0);
      });
    });

    it('should handle sanitization errors', () => {
      (tagService.sanitizeTagWithErrorHandling as any).mockReturnValue({
        success: false,
        data: null,
        errors: [{ code: 'SANITIZE_ERROR', message: 'Sanitization failed', severity: 'error' }]
      });
      
      (tagValidationService.formatErrorsForUser as any).mockReturnValue(['Sanitization failed']);

      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const sanitizeResult = result.current.sanitizeTag('!@#');
        expect(sanitizeResult.success).toBe(false);
        expect(sanitizeResult.value).toBe('');
        expect(sanitizeResult.errors).toEqual(['Sanitization failed']);
      });
    });

    it('should handle sanitization exceptions', () => {
      (tagService.sanitizeTagWithErrorHandling as any).mockImplementation(() => {
        throw new Error('Sanitization error');
      });

      const { result } = renderHook(() => useTagValidation());

      act(() => {
        const sanitizeResult = result.current.sanitizeTag('#test');
        expect(sanitizeResult.success).toBe(false);
        expect(sanitizeResult.errors).toEqual(['Failed to sanitize tag']);
      });
    });
  });

  describe('clearValidation', () => {
    it('should clear validation state', () => {
      const { result } = renderHook(() => useTagValidation());

      // First set some validation errors
      act(() => {
        result.current.validateTag('');
      });

      // Then clear validation
      act(() => {
        result.current.clearValidation();
      });

      expect(result.current.validationState.isValid).toBe(true);
      expect(result.current.validationState.errors).toHaveLength(0);
      expect(result.current.validationState.warnings).toHaveLength(0);
    });
  });

  describe('utility functions', () => {
    it('should format errors for user', () => {
      const { result } = renderHook(() => useTagValidation());
      const errors = [{ code: 'TAG_EMPTY', message: 'Tag cannot be empty', severity: 'error' as const }];

      result.current.formatErrorsForUser(errors);
      expect(tagValidationService.formatErrorsForUser).toHaveBeenCalledWith(errors);
    });

    it('should format warnings for user', () => {
      const { result } = renderHook(() => useTagValidation());
      const warnings = [{ code: 'TAG_NO_HASH', message: 'Tag should start with #', severity: 'warning' as const }];

      result.current.formatWarningsForUser(warnings);
      expect(tagValidationService.formatWarningsForUser).toHaveBeenCalledWith(warnings);
    });

    it('should get validation constants', () => {
      const { result } = renderHook(() => useTagValidation());

      result.current.getValidationConstants();
      expect(tagValidationService.getValidationConstants).toHaveBeenCalled();
    });
  });
});

describe('useTagOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tagValidationService.formatErrorsForUser as any).mockReturnValue([]);
  });

  it('should execute successful operations', async () => {
    const { result } = renderHook(() => useTagOperations());
    const mockOperation = vi.fn().mockResolvedValue({
      success: true,
      data: 'result',
      errors: []
    });
    const onSuccess = vi.fn();

    await act(async () => {
      await result.current.executeTagOperation(mockOperation, onSuccess);
    });

    expect(mockOperation).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('result');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('should handle operation failures', async () => {
    const { result } = renderHook(() => useTagOperations());
    const mockOperation = vi.fn().mockResolvedValue({
      success: false,
      errors: [{ code: 'TAG_ERROR', message: 'Operation failed', severity: 'error' }]
    });
    const onError = vi.fn();
    
    (tagValidationService.formatErrorsForUser as any).mockReturnValue(['Operation failed']);

    await act(async () => {
      await result.current.executeTagOperation(mockOperation, undefined, onError);
    });

    expect(onError).toHaveBeenCalledWith('Operation failed');
    expect(result.current.lastError).toBe('Operation failed');
  });

  it('should handle operation exceptions', async () => {
    const { result } = renderHook(() => useTagOperations());
    const mockOperation = vi.fn().mockRejectedValue(new Error('Network error'));
    const onError = vi.fn();

    await act(async () => {
      await result.current.executeTagOperation(mockOperation, undefined, onError);
    });

    expect(onError).toHaveBeenCalledWith('Network error');
    expect(result.current.lastError).toBe('Network error');
  });

  it('should clear errors', async () => {
    const { result } = renderHook(() => useTagOperations());
    const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'));

    // First create an error
    await act(async () => {
      await result.current.executeTagOperation(mockOperation);
    });

    expect(result.current.lastError).toBeTruthy();

    // Then clear it
    act(() => {
      result.current.clearError();
    });

    expect(result.current.lastError).toBeNull();
  });

  it('should manage loading state', async () => {
    const { result } = renderHook(() => useTagOperations());
    const mockOperation = vi.fn().mockResolvedValue({
      success: true,
      data: 'result',
      errors: []
    });

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.executeTagOperation(mockOperation);
    });

    expect(result.current.isLoading).toBe(false);
  });
});
import { describe, it, expect } from 'vitest';
import { tagService } from '../../lib/tagService';

describe('EditTradeModal Tag Editing - Feature Verification', () => {
  it('should have tag service with required methods', () => {
    expect(tagService.processTags).toBeDefined();
    expect(tagService.validateTags).toBeDefined();
    expect(tagService.getTagSuggestions).toBeDefined();
    expect(tagService.normalizeTag).toBeDefined();
  });

  it('should process tags correctly', () => {
    const testTags = ['breakout', '#morning', 'TRENDING'];
    const processed = tagService.processTags(testTags);
    
    // Should normalize all tags to lowercase with # prefix
    expect(processed).toEqual(['#breakout', '#morning', '#trending']);
  });

  it('should validate tags correctly', () => {
    const validTags = ['#breakout', '#morning', '#trending'];
    const validation = tagService.validateTags(validTags);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should handle empty tags array', () => {
    const processed = tagService.processTags([]);
    expect(processed).toEqual([]);
    
    const validation = tagService.validateTags([]);
    expect(validation.isValid).toBe(true);
  });
});
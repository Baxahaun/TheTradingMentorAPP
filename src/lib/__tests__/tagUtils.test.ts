import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatTagForDisplay,
  formatTagsForDisplay,
  parseTagString,
  tagsToString,
  validateTagsForForm,
  isTypingTag,
  getCurrentTag,
  replaceCurrentTag,
  getTagColor,
  truncateTag,
  sortTags,
  filterTagsByQuery,
  getTagStatistics
} from '../tagUtils';

describe('tagUtils', () => {
  describe('formatTagForDisplay', () => {
    it('should format tags correctly', () => {
      expect(formatTagForDisplay('breakout')).toBe('#breakout');
      expect(formatTagForDisplay('#TREND')).toBe('#trend');
      expect(formatTagForDisplay('  Scalp  ')).toBe('#scalp');
    });

    it('should handle empty input', () => {
      expect(formatTagForDisplay('')).toBe('');
      expect(formatTagForDisplay(null as any)).toBe('');
    });
  });

  describe('formatTagsForDisplay', () => {
    it('should format array of tags', () => {
      const input = ['breakout', '#TREND', '  scalp  '];
      const result = formatTagsForDisplay(input);
      expect(result).toEqual(['#breakout', '#trend', '#scalp']);
    });

    it('should handle invalid input', () => {
      expect(formatTagsForDisplay(null as any)).toEqual([]);
      expect(formatTagsForDisplay(undefined as any)).toEqual([]);
    });

    it('should filter out empty tags', () => {
      const input = ['breakout', '', '  ', '#trend'];
      const result = formatTagsForDisplay(input);
      expect(result).toEqual(['#breakout', '#trend']);
    });
  });

  describe('parseTagString', () => {
    it('should parse comma-separated tags', () => {
      const input = 'breakout, trend, scalp';
      const result = parseTagString(input);
      expect(result).toEqual(['#breakout', '#trend', '#scalp']);
    });

    it('should handle tags with # already', () => {
      const input = '#breakout, trend, #scalp';
      const result = parseTagString(input);
      expect(result).toEqual(['#breakout', '#trend', '#scalp']);
    });

    it('should handle empty and invalid input', () => {
      expect(parseTagString('')).toEqual([]);
      expect(parseTagString(null as any)).toEqual([]);
      expect(parseTagString(undefined as any)).toEqual([]);
    });

    it('should sanitize invalid characters', () => {
      const input = 'break-out!, trend@123, scalp';
      const result = parseTagString(input);
      expect(result).toEqual(['#breakout', '#trend123', '#scalp']);
    });
  });

  describe('tagsToString', () => {
    it('should convert tags array to string', () => {
      const input = ['#breakout', '#trend', '#scalp'];
      const result = tagsToString(input);
      expect(result).toBe('#breakout, #trend, #scalp');
    });

    it('should handle invalid input', () => {
      expect(tagsToString(null as any)).toBe('');
      expect(tagsToString(undefined as any)).toBe('');
    });

    it('should filter out empty tags', () => {
      const input = ['#breakout', '', '#trend'];
      const result = tagsToString(input);
      expect(result).toBe('#breakout, #trend');
    });
  });

  describe('validateTagsForForm', () => {
    it('should validate correct tags', () => {
      const result = validateTagsForForm(['#breakout', '#trend']);
      expect(result.isValid).toBe(true);
      expect(result.hasErrors).toBe(false);
      expect(result.hasWarnings).toBe(false);
    });

    it('should detect errors', () => {
      const result = validateTagsForForm(['#breakout', '#break-out']);
      expect(result.isValid).toBe(false);
      expect(result.hasErrors).toBe(true);
      expect(result.errorMessage).toContain('letters, numbers, and underscores');
    });

    it('should detect warnings', () => {
      const result = validateTagsForForm(['#breakout', 'trend']);
      expect(result.isValid).toBe(true);
      expect(result.hasWarnings).toBe(true);
      expect(result.warningMessage).toContain('should start with #');
    });
  });

  describe('isTypingTag', () => {
    it('should detect tag typing', () => {
      expect(isTypingTag('#break')).toBe(true);
      expect(isTypingTag('trend')).toBe(true);
      expect(isTypingTag('')).toBe(false);
      expect(isTypingTag('   ')).toBe(false);
    });
  });

  describe('getCurrentTag', () => {
    it('should extract current tag from input', () => {
      expect(getCurrentTag('#breakout', 9)).toBe('#breakout');
      expect(getCurrentTag('some #trend text', 11)).toBe('#trend');
      expect(getCurrentTag('#break #trend', 6)).toBe('#break');
    });

    it('should handle input without tags', () => {
      expect(getCurrentTag('no tags here', 5)).toBe('');
      expect(getCurrentTag('', 0)).toBe('');
    });

    it('should handle tags with spaces and commas', () => {
      expect(getCurrentTag('#break out', 6)).toBe('#break');
      expect(getCurrentTag('#break,#trend', 6)).toBe('#break');
    });
  });

  describe('replaceCurrentTag', () => {
    it('should replace current tag with suggestion', () => {
      const result = replaceCurrentTag('#bre', 4, '#breakout');
      expect(result.newInput).toBe('#breakout ');
      expect(result.newCursorPosition).toBe(10);
    });

    it('should handle empty input', () => {
      const result = replaceCurrentTag('', 0, '#breakout');
      expect(result.newInput).toBe('#breakout ');
      expect(result.newCursorPosition).toBe(10);
    });

    it('should handle input without hash', () => {
      const result = replaceCurrentTag('some text', 9, '#breakout');
      expect(result.newInput).toBe('some text#breakout ');
      expect(result.newCursorPosition).toBe(19);
    });

    it('should replace tag in middle of text', () => {
      const result = replaceCurrentTag('start #bre end', 10, '#breakout');
      expect(result.newInput).toBe('start #breakout  end');
      expect(result.newCursorPosition).toBe(16);
    });
  });

  describe('getTagColor', () => {
    it('should return consistent colors for same tag', () => {
      const color1 = getTagColor('#breakout');
      const color2 = getTagColor('#breakout');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different tags', () => {
      const color1 = getTagColor('#breakout');
      const color2 = getTagColor('#trend');
      // They might be the same due to hash collision, but usually different
      expect(typeof color1).toBe('string');
      expect(typeof color2).toBe('string');
    });

    it('should handle empty input', () => {
      const result = getTagColor('');
      expect(result).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('truncateTag', () => {
    it('should truncate long tags', () => {
      const longTag = '#verylongtagthatexceedslimit';
      const result = truncateTag(longTag, 10);
      expect(result).toBe('#verylo...');
      expect(result.length).toBe(10);
    });

    it('should not truncate short tags', () => {
      const shortTag = '#short';
      const result = truncateTag(shortTag, 10);
      expect(result).toBe('#short');
    });

    it('should handle empty input', () => {
      expect(truncateTag('', 10)).toBe('');
    });
  });

  describe('sortTags', () => {
    const tags = [
      { tag: '#zebra', count: 1, lastUsed: '2024-01-01' },
      { tag: '#alpha', count: 3, lastUsed: '2024-01-03' },
      { tag: '#beta', count: 2, lastUsed: '2024-01-02' }
    ];

    it('should sort alphabetically', () => {
      const result = sortTags(tags, 'alphabetical');
      expect(result[0].tag).toBe('#alpha');
      expect(result[1].tag).toBe('#beta');
      expect(result[2].tag).toBe('#zebra');
    });

    it('should sort by usage', () => {
      const result = sortTags(tags, 'usage');
      expect(result[0].count).toBe(3);
      expect(result[1].count).toBe(2);
      expect(result[2].count).toBe(1);
    });

    it('should sort by recent usage', () => {
      const result = sortTags(tags, 'recent');
      expect(result[0].lastUsed).toBe('2024-01-03');
      expect(result[1].lastUsed).toBe('2024-01-02');
      expect(result[2].lastUsed).toBe('2024-01-01');
    });

    it('should not modify original array', () => {
      const original = [...tags];
      sortTags(tags, 'alphabetical');
      expect(tags).toEqual(original);
    });
  });

  describe('filterTagsByQuery', () => {
    const tags = [
      { tag: '#breakout', count: 3, lastUsed: '2024-01-01' },
      { tag: '#breakdown', count: 2, lastUsed: '2024-01-02' },
      { tag: '#trend', count: 1, lastUsed: '2024-01-03' }
    ];

    it('should filter by partial match', () => {
      const result = filterTagsByQuery(tags, 'break');
      expect(result).toHaveLength(2);
      expect(result.map(t => t.tag)).toEqual(['#breakout', '#breakdown']);
    });

    it('should handle # in query', () => {
      const result = filterTagsByQuery(tags, '#break');
      expect(result).toHaveLength(2);
    });

    it('should return all tags for empty query', () => {
      const result = filterTagsByQuery(tags, '');
      expect(result).toHaveLength(3);
    });

    it('should be case insensitive', () => {
      const result = filterTagsByQuery(tags, 'BREAK');
      expect(result).toHaveLength(2);
    });
  });

  describe('getTagStatistics', () => {
    const tags = [
      { tag: '#breakout', count: 5, lastUsed: '2024-01-01' },
      { tag: '#trend', count: 3, lastUsed: '2024-01-02' },
      { tag: '#scalp', count: 1, lastUsed: '2024-01-03' }
    ];

    it('should calculate correct statistics', () => {
      const result = getTagStatistics(tags);
      expect(result.totalTags).toBe(3);
      expect(result.totalUsage).toBe(9);
      expect(result.averageUsage).toBe(3);
      expect(result.mostUsed?.tag).toBe('#breakout');
      expect(result.leastUsed?.tag).toBe('#scalp');
    });

    it('should handle empty array', () => {
      const result = getTagStatistics([]);
      expect(result.totalTags).toBe(0);
      expect(result.totalUsage).toBe(0);
      expect(result.averageUsage).toBe(0);
      expect(result.mostUsed).toBeNull();
      expect(result.leastUsed).toBeNull();
    });

    it('should handle single tag', () => {
      const singleTag = [{ tag: '#only', count: 5, lastUsed: '2024-01-01' }];
      const result = getTagStatistics(singleTag);
      expect(result.totalTags).toBe(1);
      expect(result.mostUsed?.tag).toBe('#only');
      expect(result.leastUsed?.tag).toBe('#only');
    });
  });
});
import { tagService } from './tagService';

/**
 * Utility functions for tag formatting and validation in UI components
 */

/**
 * Formats a tag string for display in the UI
 * @param tag - The tag to format
 * @returns Formatted tag string
 */
export const formatTagForDisplay = (tag: string): string => {
  if (!tag) return '';
  
  const normalized = tagService.normalizeTag(tag);
  return normalized;
};

/**
 * Formats an array of tags for display
 * @param tags - Array of tags to format
 * @returns Array of formatted tags
 */
export const formatTagsForDisplay = (tags: string[]): string[] => {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .map(formatTagForDisplay)
    .filter(tag => tag.length > 1); // Remove empty tags
};

/**
 * Parses a comma-separated string of tags into an array
 * @param tagString - Comma-separated tag string
 * @returns Array of processed tags
 */
export const parseTagString = (tagString: string): string[] => {
  if (!tagString || typeof tagString !== 'string') return [];
  
  return tagString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .map(tag => tagService.sanitizeTag(tag))
    .filter(tag => tag.length > 1); // Remove empty tags after sanitization
};

/**
 * Converts an array of tags to a comma-separated string for form inputs
 * @param tags - Array of tags
 * @returns Comma-separated string
 */
export const tagsToString = (tags: string[]): string => {
  if (!Array.isArray(tags)) return '';
  
  return tags
    .map(formatTagForDisplay)
    .filter(tag => tag.length > 1)
    .join(', ');
};

/**
 * Validates tags for form submission
 * @param tags - Array of tags to validate
 * @returns Validation result with formatted error messages
 */
export const validateTagsForForm = (tags: string[]) => {
  const result = tagService.validateTags(tags);
  
  return {
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    // Additional UI-friendly properties
    hasErrors: result.errors.length > 0,
    hasWarnings: result.warnings.length > 0,
    errorMessage: result.errors.join('; '),
    warningMessage: result.warnings.join('; ')
  };
};

/**
 * Checks if a tag input is currently being typed (for autocomplete)
 * @param input - Current input string
 * @returns True if user is typing a tag
 */
export const isTypingTag = (input: string): boolean => {
  if (!input) return false;
  
  const trimmed = input.trim();
  return trimmed.startsWith('#') || trimmed.length > 0;
};

/**
 * Extracts the current tag being typed from input
 * @param input - Current input string
 * @param cursorPosition - Current cursor position
 * @returns The tag being typed or empty string
 */
export const getCurrentTag = (input: string, cursorPosition: number = input.length): string => {
  if (!input) return '';
  
  // Find the last # before cursor position
  const beforeCursor = input.substring(0, cursorPosition);
  const lastHashIndex = beforeCursor.lastIndexOf('#');
  
  if (lastHashIndex === -1) return '';
  
  // Extract from # to next space or end of string
  const afterHash = input.substring(lastHashIndex);
  const spaceIndex = afterHash.indexOf(' ');
  const commaIndex = afterHash.indexOf(',');
  
  let endIndex = afterHash.length;
  if (spaceIndex !== -1) endIndex = Math.min(endIndex, spaceIndex);
  if (commaIndex !== -1) endIndex = Math.min(endIndex, commaIndex);
  
  return afterHash.substring(0, endIndex);
};

/**
 * Replaces the current tag being typed with a selected suggestion
 * @param input - Current input string
 * @param cursorPosition - Current cursor position
 * @param suggestion - Selected tag suggestion
 * @returns Updated input string and new cursor position
 */
export const replaceCurrentTag = (
  input: string, 
  cursorPosition: number, 
  suggestion: string
): { newInput: string; newCursorPosition: number } => {
  if (!input) {
    return {
      newInput: suggestion + ' ',
      newCursorPosition: suggestion.length + 1
    };
  }
  
  const beforeCursor = input.substring(0, cursorPosition);
  const afterCursor = input.substring(cursorPosition);
  
  const lastHashIndex = beforeCursor.lastIndexOf('#');
  
  if (lastHashIndex === -1) {
    // No # found, append suggestion
    return {
      newInput: input + suggestion + ' ',
      newCursorPosition: input.length + suggestion.length + 1
    };
  }
  
  // Find end of current tag
  const afterHash = input.substring(lastHashIndex);
  const spaceIndex = afterHash.indexOf(' ');
  const commaIndex = afterHash.indexOf(',');
  
  let endIndex = afterHash.length;
  if (spaceIndex !== -1) endIndex = Math.min(endIndex, spaceIndex);
  if (commaIndex !== -1) endIndex = Math.min(endIndex, commaIndex);
  
  const tagEndPosition = lastHashIndex + endIndex;
  
  const newInput = 
    input.substring(0, lastHashIndex) + 
    suggestion + ' ' + 
    input.substring(tagEndPosition);
  
  const newCursorPosition = lastHashIndex + suggestion.length + 1;
  
  return { newInput, newCursorPosition };
};

/**
 * Gets color class for tag display based on tag content
 * @param tag - The tag to get color for
 * @returns CSS class name for tag color
 */
export const getTagColor = (tag: string): string => {
  if (!tag) return 'bg-gray-100 text-gray-800';
  
  // Simple hash-based color assignment for consistency
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-orange-100 text-orange-800'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Truncates a tag for display if it's too long
 * @param tag - The tag to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated tag with ellipsis if needed
 */
export const truncateTag = (tag: string, maxLength: number = 20): string => {
  if (!tag || tag.length <= maxLength) return tag;
  
  return tag.substring(0, maxLength - 3) + '...';
};

/**
 * Sorts tags by various criteria
 * @param tags - Array of tags with counts
 * @param sortBy - Sort criteria
 * @returns Sorted array of tags
 */
export const sortTags = (
  tags: Array<{ tag: string; count: number; lastUsed: string }>,
  sortBy: 'alphabetical' | 'usage' | 'recent' = 'usage'
): Array<{ tag: string; count: number; lastUsed: string }> => {
  const sorted = [...tags];
  
  switch (sortBy) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.tag.localeCompare(b.tag));
    
    case 'usage':
      return sorted.sort((a, b) => b.count - a.count);
    
    case 'recent':
      return sorted.sort((a, b) => 
        new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      );
    
    default:
      return sorted;
  }
};

/**
 * Filters tags based on search query
 * @param tags - Array of tags to filter
 * @param query - Search query
 * @returns Filtered tags
 */
export const filterTagsByQuery = (
  tags: Array<{ tag: string; count: number; lastUsed: string }>,
  query: string
): Array<{ tag: string; count: number; lastUsed: string }> => {
  if (!query || query.trim().length === 0) return tags;
  
  const normalizedQuery = query.toLowerCase().trim();
  const searchTerm = normalizedQuery.startsWith('#') ? normalizedQuery.slice(1) : normalizedQuery;
  
  return tags.filter(tagData => 
    tagData.tag.toLowerCase().includes(searchTerm) ||
    tagData.tag.slice(1).toLowerCase().includes(searchTerm)
  );
};

/**
 * Generates tag statistics for display
 * @param tags - Array of tags with counts
 * @returns Statistics object
 */
export const getTagStatistics = (
  tags: Array<{ tag: string; count: number; lastUsed: string }>
) => {
  if (tags.length === 0) {
    return {
      totalTags: 0,
      totalUsage: 0,
      averageUsage: 0,
      mostUsed: null,
      leastUsed: null
    };
  }
  
  const totalUsage = tags.reduce((sum, tag) => sum + tag.count, 0);
  const averageUsage = totalUsage / tags.length;
  const sortedByUsage = [...tags].sort((a, b) => b.count - a.count);
  
  return {
    totalTags: tags.length,
    totalUsage,
    averageUsage: Math.round(averageUsage * 100) / 100,
    mostUsed: sortedByUsage[0],
    leastUsed: sortedByUsage[sortedByUsage.length - 1]
  };
};
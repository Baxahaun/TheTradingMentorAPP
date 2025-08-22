import { Trade } from '../types/trade';
import { tagService } from './tagService';

// Search query interfaces
export interface TagSearchQuery {
  type: 'AND' | 'OR' | 'NOT' | 'TAG';
  value?: string;
  children?: TagSearchQuery[];
}

export interface TagSearchResult {
  trades: Trade[];
  matchingTags: string[];
  query: TagSearchQuery;
  isValid: boolean;
  errors: string[];
}

export interface TagSearchHighlight {
  tradeId: string;
  matchingTags: string[];
}

/**
 * Advanced tag search service that supports complex search syntax
 * Supports AND, OR, NOT operations with tags
 */
export class TagSearchService {
  private static instance: TagSearchService;

  private constructor() {}

  public static getInstance(): TagSearchService {
    if (!TagSearchService.instance) {
      TagSearchService.instance = new TagSearchService();
    }
    return TagSearchService.instance;
  }

  /**
   * Parses a search query string into a structured query object
   * Supports syntax like: "#tag1 AND #tag2", "#tag1 OR #tag2", "NOT #tag1"
   * @param queryString - The search query string
   * @returns Parsed query object
   */
  public parseSearchQuery(queryString: string): TagSearchQuery {
    if (!queryString || queryString.trim().length === 0) {
      return { type: 'AND', children: [] };
    }

    const normalizedQuery = queryString.trim();
    
    try {
      return this.parseExpression(normalizedQuery);
    } catch (error) {
      console.error('Error parsing search query:', error);
      // Return a simple tag search as fallback
      if (normalizedQuery.startsWith('#')) {
        return {
          type: 'TAG',
          value: tagService.normalizeTag(normalizedQuery)
        };
      }
      return { type: 'AND', children: [] };
    }
  }

  /**
   * Parses a search expression recursively
   * @param expression - The expression to parse
   * @returns Parsed query object
   */
  private parseExpression(expression: string): TagSearchQuery {
    // Remove extra whitespace and normalize
    const normalized = expression.replace(/\s+/g, ' ').trim();
    
    // Handle parentheses (for future expansion)
    if (normalized.startsWith('(') && normalized.endsWith(')')) {
      return this.parseExpression(normalized.slice(1, -1));
    }

    // Handle NOT operation
    if (normalized.toUpperCase().startsWith('NOT ')) {
      const notExpression = normalized.slice(4).trim();
      const childQuery = this.parseExpression(notExpression);
      return {
        type: 'NOT',
        children: [childQuery]
      };
    }

    // Split by OR first (lower precedence)
    const orParts = this.splitByOperator(normalized, 'OR');
    if (orParts.length > 1) {
      return {
        type: 'OR',
        children: orParts.map(part => this.parseExpression(part))
      };
    }

    // Split by AND (higher precedence)
    const andParts = this.splitByOperator(normalized, 'AND');
    if (andParts.length > 1) {
      return {
        type: 'AND',
        children: andParts.map(part => this.parseExpression(part))
      };
    }

    // If no operators found, treat as a single tag
    const trimmed = normalized.trim();
    if (trimmed.startsWith('#')) {
      return {
        type: 'TAG',
        value: tagService.normalizeTag(trimmed)
      };
    }

    // If it doesn't start with #, try to make it a tag
    return {
      type: 'TAG',
      value: tagService.normalizeTag(`#${trimmed}`)
    };
  }

  /**
   * Splits an expression by a logical operator while respecting precedence
   * @param expression - The expression to split
   * @param operator - The operator to split by ('AND' or 'OR')
   * @returns Array of expression parts
   */
  private splitByOperator(expression: string, operator: 'AND' | 'OR'): string[] {
    const parts: string[] = [];
    let currentPart = '';
    let parenthesesLevel = 0;
    
    const tokens = expression.split(/\s+/);
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Track parentheses level
      parenthesesLevel += (token.match(/\(/g) || []).length;
      parenthesesLevel -= (token.match(/\)/g) || []).length;
      
      // Check if this token is our target operator at the top level
      if (token.toUpperCase() === operator && parenthesesLevel === 0) {
        if (currentPart.trim()) {
          parts.push(currentPart.trim());
          currentPart = '';
        }
      } else {
        if (currentPart) {
          currentPart += ' ';
        }
        currentPart += token;
      }
    }
    
    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }
    
    return parts.length > 1 ? parts : [expression];
  }

  /**
   * Validates a search query for syntax errors
   * @param queryString - The search query string
   * @returns Validation result
   */
  public validateSearchQuery(queryString: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!queryString || queryString.trim().length === 0) {
      return { isValid: true, errors: [] };
    }

    const normalized = queryString.trim();
    
    // Check for balanced parentheses
    let parenthesesLevel = 0;
    for (const char of normalized) {
      if (char === '(') parenthesesLevel++;
      if (char === ')') parenthesesLevel--;
      if (parenthesesLevel < 0) {
        errors.push('Unmatched closing parenthesis');
        break;
      }
    }
    if (parenthesesLevel > 0) {
      errors.push('Unmatched opening parenthesis');
    }

    // Check for empty operators
    if (/\b(AND|OR|NOT)\s+(AND|OR|NOT)\b/i.test(normalized)) {
      errors.push('Cannot have consecutive operators');
    }

    // Check for operators at the end
    if (/\b(AND|OR)\s*$/i.test(normalized)) {
      errors.push('Query cannot end with AND or OR');
    }

    // Check for operators at the beginning (except NOT)
    if (/^\s*(AND|OR)\b/i.test(normalized)) {
      errors.push('Query cannot start with AND or OR');
    }

    // Check for empty NOT
    if (/\bNOT\s*$/i.test(normalized)) {
      errors.push('NOT operator must be followed by a tag');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Executes a search query against an array of trades
   * @param trades - Array of trades to search
   * @param queryString - The search query string
   * @returns Search results with matching trades and highlights
   */
  public executeSearch(trades: Trade[], queryString: string): TagSearchResult {
    const validation = this.validateSearchQuery(queryString);
    if (!validation.isValid) {
      return {
        trades: [],
        matchingTags: [],
        query: { type: 'AND', children: [] },
        isValid: false,
        errors: validation.errors
      };
    }

    const query = this.parseSearchQuery(queryString);
    const matchingTrades = this.evaluateQuery(trades, query);
    const matchingTags = this.extractMatchingTags(matchingTrades, query);

    return {
      trades: matchingTrades,
      matchingTags,
      query,
      isValid: true,
      errors: []
    };
  }

  /**
   * Evaluates a parsed query against an array of trades
   * @param trades - Array of trades to evaluate
   * @param query - Parsed query object
   * @returns Array of matching trades
   */
  private evaluateQuery(trades: Trade[], query: TagSearchQuery): Trade[] {
    switch (query.type) {
      case 'TAG':
        if (!query.value) return [];
        return trades.filter(trade => 
          trade.tags?.some(tag => tagService.normalizeTag(tag) === query.value) || false
        );

      case 'AND':
        if (!query.children || query.children.length === 0) return trades;
        return query.children.reduce((result, childQuery) => {
          const childResults = this.evaluateQuery(result, childQuery);
          return childResults;
        }, trades);

      case 'OR':
        if (!query.children || query.children.length === 0) return [];
        const orResults = new Set<Trade>();
        query.children.forEach(childQuery => {
          const childResults = this.evaluateQuery(trades, childQuery);
          childResults.forEach(trade => orResults.add(trade));
        });
        return Array.from(orResults);

      case 'NOT':
        if (!query.children || query.children.length === 0) return trades;
        const notResults = this.evaluateQuery(trades, query.children[0]);
        const notTradeIds = new Set(notResults.map(trade => trade.id));
        return trades.filter(trade => !notTradeIds.has(trade.id));

      default:
        return [];
    }
  }

  /**
   * Extracts all tags that match the search query
   * @param trades - Array of matching trades
   * @param query - The search query
   * @returns Array of matching tag names
   */
  private extractMatchingTags(trades: Trade[], query: TagSearchQuery): string[] {
    const matchingTags = new Set<string>();
    
    const extractFromQuery = (q: TagSearchQuery) => {
      if (q.type === 'TAG' && q.value) {
        matchingTags.add(q.value);
      } else if (q.children) {
        q.children.forEach(child => extractFromQuery(child));
      }
    };

    extractFromQuery(query);
    return Array.from(matchingTags);
  }

  /**
   * Gets highlighting information for search results
   * @param trades - Array of trades to highlight
   * @param matchingTags - Array of tags that matched the search
   * @returns Array of highlight information
   */
  public getSearchHighlights(trades: Trade[], matchingTags: string[]): TagSearchHighlight[] {
    return trades.map(trade => ({
      tradeId: trade.id,
      matchingTags: (trade.tags || [])
        .map(tag => tagService.normalizeTag(tag))
        .filter(tag => matchingTags.includes(tag))
    }));
  }

  /**
   * Suggests search query completions based on available tags
   * @param trades - Array of trades for context
   * @param partialQuery - Partial search query
   * @param limit - Maximum number of suggestions
   * @returns Array of suggested completions
   */
  public getSuggestions(trades: Trade[], partialQuery: string, limit: number = 5): string[] {
    const suggestions: string[] = [];
    
    // If query is empty, suggest most used tags
    if (!partialQuery.trim()) {
      const mostUsed = tagService.getMostUsedTags(trades, limit);
      return mostUsed.map(tag => tag.tag);
    }

    const normalized = partialQuery.trim().toLowerCase();
    
    // If query ends with an operator, suggest tags
    if (/\b(and|or|not)\s*$/i.test(normalized)) {
      const mostUsed = tagService.getMostUsedTags(trades, limit);
      return mostUsed.map(tag => `${partialQuery} ${tag.tag}`);
    }

    // If query contains operators, suggest completing the last part
    const lastPart = normalized.split(/\b(and|or|not)\b/i).pop()?.trim() || '';
    if (lastPart) {
      const tagSuggestions = tagService.getTagSuggestions(trades, lastPart, limit);
      const prefix = partialQuery.substring(0, partialQuery.toLowerCase().lastIndexOf(lastPart.toLowerCase()));
      return tagSuggestions.map(tag => `${prefix}${tag}`);
    }

    // Default to tag suggestions
    return tagService.getTagSuggestions(trades, partialQuery, limit);
  }

  /**
   * Checks if a search query is a tag-based search
   * @param queryString - The search query string
   * @returns True if the query contains tag search syntax
   */
  public isTagSearch(queryString: string): boolean {
    if (!queryString) return false;
    
    const normalized = queryString.trim().toLowerCase();
    
    // Check for tag syntax or logical operators
    return normalized.includes('#') || 
           /\b(and|or|not)\b/i.test(normalized);
  }

  /**
   * Converts a simple tag filter to a search query string
   * @param includeTags - Tags to include
   * @param excludeTags - Tags to exclude
   * @param mode - Filter mode ('AND' or 'OR')
   * @returns Search query string
   */
  public filterToSearchQuery(includeTags: string[], excludeTags: string[], mode: 'AND' | 'OR'): string {
    const parts: string[] = [];
    
    // Add include tags
    if (includeTags.length > 0) {
      if (includeTags.length === 1) {
        parts.push(includeTags[0]);
      } else {
        const joinedIncludes = includeTags.join(` ${mode} `);
        parts.push(includeTags.length > 1 ? `(${joinedIncludes})` : joinedIncludes);
      }
    }
    
    // Add exclude tags
    if (excludeTags.length > 0) {
      const excludeParts = excludeTags.map(tag => `NOT ${tag}`);
      parts.push(...excludeParts);
    }
    
    return parts.join(' AND ');
  }
}

// Export singleton instance
export const tagSearchService = TagSearchService.getInstance();
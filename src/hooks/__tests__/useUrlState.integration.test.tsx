import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useTagFilterUrlState, createShareableUrl, parseTagFiltersFromUrl } from '../useUrlState';

// Mock react-router-dom with more realistic behavior
const mockNavigate = vi.fn();
let mockLocation = {
  pathname: '/trades',
  search: '',
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Wrapper component for React Router
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('URL State Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = '';
  });

  describe('URL State Persistence', () => {
    it('should persist tag filters across page refreshes', () => {
      // Simulate initial URL with tag filters
      mockLocation.search = '?tags=%23scalping,%23swing&tagMode=OR';
      
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      // Verify filters are loaded from URL
      expect(result.current.selectedTags).toEqual(['#scalping', '#swing']);
      expect(result.current.filterMode).toBe('OR');
    });

    it('should handle URL encoding/decoding correctly', () => {
      // Test with special characters that need URL encoding
      mockLocation.search = '?tags=%23pre-market,%23high%20volume&tagMode=AND';
      
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      // Verify special characters are decoded correctly
      expect(result.current.selectedTags).toEqual(['#pre-market', '#high volume']);
      expect(result.current.filterMode).toBe('AND');
    });

    it('should update URL when filters change', () => {
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      act(() => {
        result.current.setSelectedTags(['#scalping', '#breakout']);
      });

      // Verify navigate was called with encoded URL
      expect(mockNavigate).toHaveBeenCalledWith(
        '/trades?tags=%23scalping%2C%23breakout',
        { replace: true }
      );
    });

    it('should update URL when filter mode changes', () => {
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      act(() => {
        result.current.setSelectedTags(['#scalping']);
        result.current.setFilterMode('OR');
      });

      // Verify both parameters are in URL
      expect(mockNavigate).toHaveBeenCalledWith(
        '/trades?tags=%23scalping&tagMode=OR',
        { replace: true }
      );
    });

    it('should remove URL parameters when filters are cleared', () => {
      // Start with filters in URL
      mockLocation.search = '?tags=%23scalping&tagMode=OR';
      
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      act(() => {
        result.current.setSelectedTags([]);
      });

      // Verify URL is cleaned up
      expect(mockNavigate).toHaveBeenCalledWith('/trades', { replace: true });
    });

    it('should handle browser back/forward navigation', () => {
      const { result, rerender } = renderHook(() => useTagFilterUrlState(), { wrapper });

      // Simulate browser navigation changing URL
      mockLocation.search = '?tags=%23swing&tagMode=OR';
      
      // Trigger re-render to simulate URL change
      rerender();

      // Verify state updates to match new URL
      expect(result.current.selectedTags).toEqual(['#swing']);
      expect(result.current.filterMode).toBe('OR');
    });
  });

  describe('Shareable URLs', () => {
    it('should create shareable URLs with current filter state', () => {
      const baseUrl = 'https://example.com/trades';
      const selectedTags = ['#scalping', '#morning'];
      const filterMode = 'OR' as const;

      const shareableUrl = createShareableUrl(baseUrl, selectedTags, filterMode);

      expect(shareableUrl).toBe(
        'https://example.com/trades?tags=%23scalping%2C%23morning&tagMode=OR'
      );
    });

    it('should create shareable URLs without tagMode for AND filter', () => {
      const baseUrl = 'https://example.com/trades';
      const selectedTags = ['#scalping'];
      const filterMode = 'AND' as const;

      const shareableUrl = createShareableUrl(baseUrl, selectedTags, filterMode);

      expect(shareableUrl).toBe('https://example.com/trades?tags=%23scalping');
    });

    it('should preserve existing query parameters in shareable URLs', () => {
      const baseUrl = 'https://example.com/trades?existing=param&other=value';
      const selectedTags = ['#scalping'];
      const filterMode = 'AND' as const;

      const shareableUrl = createShareableUrl(baseUrl, selectedTags, filterMode);

      expect(shareableUrl).toBe(
        'https://example.com/trades?existing=param&other=value&tags=%23scalping'
      );
    });

    it('should parse tag filters from shared URLs correctly', () => {
      const sharedUrl = 'https://example.com/trades?tags=%23scalping,%23swing&tagMode=OR';
      
      const parsed = parseTagFiltersFromUrl(sharedUrl);

      expect(parsed).toEqual({
        selectedTags: ['#scalping', '#swing'],
        filterMode: 'OR'
      });
    });

    it('should handle malformed shared URLs gracefully', () => {
      const malformedUrl = 'not-a-valid-url';
      
      const parsed = parseTagFiltersFromUrl(malformedUrl);

      expect(parsed).toEqual({
        selectedTags: [],
        filterMode: 'AND'
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty tag parameters', () => {
      mockLocation.search = '?tags=&tagMode=OR';
      
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.filterMode).toBe('OR');
    });

    it('should filter out empty tag strings', () => {
      mockLocation.search = '?tags=tag1,,tag2,&tagMode=AND';
      
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      expect(result.current.selectedTags).toEqual(['tag1', 'tag2']);
    });

    it('should default to AND mode for invalid tagMode values', () => {
      mockLocation.search = '?tags=%23scalping&tagMode=INVALID';
      
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      expect(result.current.filterMode).toBe('AND');
    });

    it('should handle URL parameter corruption gracefully', () => {
      mockLocation.search = '?tags=%invalid%encoding&tagMode=OR';
      
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      // Should not crash and provide sensible defaults
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.filterMode).toBe('OR');
    });

    it('should maintain state consistency during rapid updates', () => {
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      // Simulate rapid filter changes
      act(() => {
        result.current.setSelectedTags(['#tag1']);
        result.current.setSelectedTags(['#tag1', '#tag2']);
        result.current.setFilterMode('OR');
        result.current.setSelectedTags(['#tag2']);
      });

      // Final state should be consistent
      expect(result.current.selectedTags).toEqual(['#tag2']);
      expect(result.current.filterMode).toBe('OR');
    });
  });

  describe('Performance and Optimization', () => {
    it('should not trigger unnecessary navigation calls', () => {
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      // Set the same value multiple times
      act(() => {
        result.current.setSelectedTags(['#scalping']);
        result.current.setSelectedTags(['#scalping']); // Same value
      });

      // Should only navigate once for the actual change
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should handle large numbers of tags efficiently', () => {
      const largeTags = Array.from({ length: 100 }, (_, i) => `#tag${i}`);
      
      const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

      act(() => {
        result.current.setSelectedTags(largeTags);
      });

      // Should handle large tag arrays without issues
      expect(result.current.selectedTags).toEqual(largeTags);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
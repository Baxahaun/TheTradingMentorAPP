import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useUrlState, useTagFilterUrlState, createShareableUrl, parseTagFiltersFromUrl } from '../useUrlState';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = {
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
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useUrlState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = '';
  });

  it('should initialize with default value when no URL parameter exists', () => {
    const { result } = renderHook(
      () => useUrlState('test', 'default', String, String),
      { wrapper }
    );

    expect(result.current[0]).toBe('default');
  });

  it('should initialize with URL parameter value when it exists', () => {
    mockLocation.search = '?test=urlValue';
    
    const { result } = renderHook(
      () => useUrlState('test', 'default', String, String),
      { wrapper }
    );

    expect(result.current[0]).toBe('urlValue');
  });

  it('should update URL when state changes', () => {
    const { result } = renderHook(
      () => useUrlState('test', 'default', String, String),
      { wrapper }
    );

    act(() => {
      result.current[1]('newValue');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/trades?test=newValue', { replace: true });
  });

  it('should remove URL parameter when value equals default', () => {
    mockLocation.search = '?test=someValue';
    
    const { result } = renderHook(
      () => useUrlState('test', 'default', String, String),
      { wrapper }
    );

    act(() => {
      result.current[1]('default');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/trades', { replace: true });
  });

  it('should handle serialization and deserialization', () => {
    const serialize = (arr: string[]) => arr.join(',');
    const deserialize = (str: string) => str.split(',');
    
    mockLocation.search = '?tags=tag1,tag2,tag3';
    
    const { result } = renderHook(
      () => useUrlState('tags', [] as string[], serialize, deserialize),
      { wrapper }
    );

    expect(result.current[0]).toEqual(['tag1', 'tag2', 'tag3']);
  });
});

describe('useTagFilterUrlState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = '';
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

    expect(result.current.selectedTags).toEqual([]);
    expect(result.current.filterMode).toBe('AND');
  });

  it('should parse tags from URL', () => {
    mockLocation.search = '?tags=tag1,tag2&tagMode=OR';
    
    const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

    expect(result.current.selectedTags).toEqual(['tag1', 'tag2']);
    expect(result.current.filterMode).toBe('OR');
  });

  it('should update tags in URL', () => {
    const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

    act(() => {
      result.current.setSelectedTags(['#scalping', '#swing']);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/trades?tags=%23scalping%2C%23swing', { replace: true });
  });

  it('should update filter mode in URL', () => {
    const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

    act(() => {
      result.current.setFilterMode('OR');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/trades?tagMode=OR', { replace: true });
  });

  it('should handle empty tags correctly', () => {
    mockLocation.search = '?tags=';
    
    const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

    expect(result.current.selectedTags).toEqual([]);
  });

  it('should filter out empty tag strings', () => {
    mockLocation.search = '?tags=tag1,,tag2,';
    
    const { result } = renderHook(() => useTagFilterUrlState(), { wrapper });

    expect(result.current.selectedTags).toEqual(['tag1', 'tag2']);
  });
});

describe('createShareableUrl', () => {
  it('should create URL with tag parameters', () => {
    const baseUrl = 'https://example.com/trades';
    const selectedTags = ['#scalping', '#swing'];
    const filterMode = 'OR' as const;

    const result = createShareableUrl(baseUrl, selectedTags, filterMode);

    expect(result).toBe('https://example.com/trades?tags=%23scalping%2C%23swing&tagMode=OR');
  });

  it('should not include tagMode parameter for AND mode', () => {
    const baseUrl = 'https://example.com/trades';
    const selectedTags = ['#scalping'];
    const filterMode = 'AND' as const;

    const result = createShareableUrl(baseUrl, selectedTags, filterMode);

    expect(result).toBe('https://example.com/trades?tags=%23scalping');
  });

  it('should not include tags parameter when empty', () => {
    const baseUrl = 'https://example.com/trades';
    const selectedTags: string[] = [];
    const filterMode = 'OR' as const;

    const result = createShareableUrl(baseUrl, selectedTags, filterMode);

    expect(result).toBe('https://example.com/trades');
  });

  it('should preserve existing query parameters', () => {
    const baseUrl = 'https://example.com/trades?existing=param';
    const selectedTags = ['#scalping'];
    const filterMode = 'AND' as const;

    const result = createShareableUrl(baseUrl, selectedTags, filterMode);

    expect(result).toBe('https://example.com/trades?existing=param&tags=%23scalping');
  });
});

describe('parseTagFiltersFromUrl', () => {
  it('should parse tags and mode from URL', () => {
    const url = 'https://example.com/trades?tags=%23scalping,%23swing&tagMode=OR';
    
    const result = parseTagFiltersFromUrl(url);

    expect(result).toEqual({
      selectedTags: ['#scalping', '#swing'],
      filterMode: 'OR'
    });
  });

  it('should return defaults for URL without parameters', () => {
    const url = 'https://example.com/trades';
    
    const result = parseTagFiltersFromUrl(url);

    expect(result).toEqual({
      selectedTags: [],
      filterMode: 'AND'
    });
  });

  it('should handle invalid URLs gracefully', () => {
    const url = 'invalid-url';
    
    const result = parseTagFiltersFromUrl(url);

    expect(result).toEqual({
      selectedTags: [],
      filterMode: 'AND'
    });
  });

  it('should filter out empty tags', () => {
    const url = 'https://example.com/trades?tags=tag1,,tag2,';
    
    const result = parseTagFiltersFromUrl(url);

    expect(result).toEqual({
      selectedTags: ['tag1', 'tag2'],
      filterMode: 'AND'
    });
  });

  it('should default to AND mode for invalid tagMode', () => {
    const url = 'https://example.com/trades?tags=tag1&tagMode=INVALID';
    
    const result = parseTagFiltersFromUrl(url);

    expect(result).toEqual({
      selectedTags: ['tag1'],
      filterMode: 'AND'
    });
  });
});
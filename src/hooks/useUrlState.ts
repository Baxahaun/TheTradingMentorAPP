import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook for managing state in URL search parameters
 * Provides synchronization between component state and URL parameters
 */
export function useUrlState<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string,
  deserialize: (value: string) => T
) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse initial value from URL
  const getInitialValue = useCallback((): T => {
    const searchParams = new URLSearchParams(location.search);
    const urlValue = searchParams.get(key);
    
    if (urlValue !== null) {
      try {
        return deserialize(urlValue);
      } catch (error) {
        console.warn(`Failed to deserialize URL parameter "${key}":`, error);
      }
    }
    
    return defaultValue;
  }, [key, defaultValue, deserialize, location.search]);

  const [state, setState] = useState<T>(getInitialValue);

  // Update URL when state changes
  const updateUrl = useCallback((newValue: T) => {
    const searchParams = new URLSearchParams(location.search);
    
    if (JSON.stringify(newValue) === JSON.stringify(defaultValue)) {
      // Remove parameter if it's the default value
      searchParams.delete(key);
    } else {
      // Set parameter to serialized value
      searchParams.set(key, serialize(newValue));
    }
    
    const newSearch = searchParams.toString();
    const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    
    // Only navigate if URL actually changed
    if (newUrl !== `${location.pathname}${location.search}`) {
      navigate(newUrl, { replace: true });
    }
  }, [key, defaultValue, serialize, location.pathname, location.search, navigate]);

  // Update state and URL
  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setState(prevState => {
      const actualNewValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prevState)
        : newValue;
      
      updateUrl(actualNewValue);
      return actualNewValue;
    });
  }, [updateUrl]);

  // Sync state with URL changes (browser back/forward)
  useEffect(() => {
    const newValue = getInitialValue();
    if (JSON.stringify(newValue) !== JSON.stringify(state)) {
      setState(newValue);
    }
  }, [location.search, getInitialValue, state]);

  return [state, setValue] as const;
}

/**
 * Specialized hook for managing tag filter state in URL
 */
export function useTagFilterUrlState() {
  const serializeTags = useCallback((tags: string[]) => {
    return tags.join(',');
  }, []);

  const deserializeTags = useCallback((value: string): string[] => {
    return value ? value.split(',').filter(tag => tag.trim()) : [];
  }, []);

  const serializeMode = useCallback((mode: 'AND' | 'OR') => {
    return mode;
  }, []);

  const deserializeMode = useCallback((value: string): 'AND' | 'OR' => {
    return value === 'OR' ? 'OR' : 'AND';
  }, []);

  const [selectedTags, setSelectedTags] = useUrlState(
    'tags',
    [] as string[],
    serializeTags,
    deserializeTags
  );

  const [filterMode, setFilterMode] = useUrlState(
    'tagMode',
    'AND' as 'AND' | 'OR',
    serializeMode,
    deserializeMode
  );

  return {
    selectedTags,
    setSelectedTags,
    filterMode,
    setFilterMode
  };
}

/**
 * Utility function to create shareable URLs with current filter state
 */
export function createShareableUrl(
  baseUrl: string,
  selectedTags: string[],
  filterMode: 'AND' | 'OR'
): string {
  const url = new URL(baseUrl);
  
  if (selectedTags.length > 0) {
    url.searchParams.set('tags', selectedTags.join(','));
    
    // Only add tagMode if there are tags and it's not the default
    if (filterMode !== 'AND') {
      url.searchParams.set('tagMode', filterMode);
    }
  }
  
  return url.toString();
}

/**
 * Utility function to parse tag filters from URL
 */
export function parseTagFiltersFromUrl(url: string): {
  selectedTags: string[];
  filterMode: 'AND' | 'OR';
} {
  try {
    const urlObj = new URL(url);
    const tagsParam = urlObj.searchParams.get('tags');
    const modeParam = urlObj.searchParams.get('tagMode');
    
    return {
      selectedTags: tagsParam ? tagsParam.split(',').filter(tag => tag.trim()) : [],
      filterMode: modeParam === 'OR' ? 'OR' : 'AND'
    };
  } catch (error) {
    console.warn('Failed to parse URL:', error);
    return {
      selectedTags: [],
      filterMode: 'AND'
    };
  }
}
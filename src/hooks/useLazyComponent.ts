/**
 * Lazy loading hooks for heavy analytics components
 * Provides intersection observer-based loading and component splitting
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createLazyLoader } from '../utils/performanceUtils';

/**
 * Hook for lazy loading components when they come into view
 */
export function useLazyComponent<T>(
  loader: () => Promise<T>,
  options: {
    rootMargin?: string;
    threshold?: number;
    fallback?: T;
  } = {}
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [component, setComponent] = useState<T | undefined>(options.fallback);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  const {
    rootMargin = '50px',
    threshold = 0.1
  } = options;

  const lazyLoader = useRef(createLazyLoader(loader, options.fallback));

  const loadComponent = useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const loadedComponent = await lazyLoader.current.load();
      setComponent(loadedComponent);
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  // Set up intersection observer
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadComponent();
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [loadComponent, rootMargin, threshold]);

  return {
    ref: elementRef,
    component,
    isLoaded,
    isLoading,
    error,
    loadComponent
  };
}

/**
 * Hook for lazy loading data with caching
 */
export function useLazyData<T>(
  key: string,
  loader: () => Promise<T>,
  options: {
    cacheTime?: number;
    staleTime?: number;
    retryCount?: number;
  } = {}
) {
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const {
    cacheTime = 300000, // 5 minutes
    staleTime = 60000,  // 1 minute
    retryCount = 3
  } = options;

  const loadData = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Check if data is still fresh
    if (!force && data && (now - lastFetch) < staleTime) {
      return data;
    }

    setIsLoading(true);
    setError(null);

    let attempts = 0;
    while (attempts < retryCount) {
      try {
        const result = await loader();
        setData(result);
        setLastFetch(now);
        setIsLoading(false);
        return result;
      } catch (err) {
        attempts++;
        if (attempts >= retryCount) {
          setError(err instanceof Error ? err : new Error('Failed to load data'));
          setIsLoading(false);
          throw err;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }, [data, lastFetch, staleTime, loader, retryCount]);

  // Auto-load on mount if no data
  useEffect(() => {
    if (!data && !isLoading) {
      loadData();
    }
  }, [data, isLoading, loadData]);

  // Check if data is stale
  const isStale = data && (Date.now() - lastFetch) > staleTime;

  return {
    data,
    isLoading,
    error,
    isStale,
    refetch: () => loadData(true),
    loadData
  };
}

/**
 * Hook for managing heavy component visibility and loading
 */
export function useHeavyComponent(
  componentName: string,
  options: {
    preload?: boolean;
    unloadOnHide?: boolean;
    memoryThreshold?: number;
  } = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(options.preload || false);
  const [memoryUsage, setMemoryUsage] = useState(0);

  const {
    unloadOnHide = false,
    memoryThreshold = 100 * 1024 * 1024 // 100MB
  } = options;

  // Monitor memory usage (if available)
  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory;
        setMemoryUsage(memory.usedJSHeapSize);
      };

      const interval = setInterval(updateMemoryUsage, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  // Auto-unload if memory usage is high
  useEffect(() => {
    if (memoryUsage > memoryThreshold && !isVisible && unloadOnHide) {
      setShouldLoad(false);
    }
  }, [memoryUsage, memoryThreshold, isVisible, unloadOnHide]);

  const show = useCallback(() => {
    setIsVisible(true);
    setShouldLoad(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    if (unloadOnHide) {
      // Delay unloading to allow for quick re-shows
      setTimeout(() => {
        if (!isVisible) {
          setShouldLoad(false);
        }
      }, 5000);
    }
  }, [isVisible, unloadOnHide]);

  return {
    isVisible,
    shouldLoad,
    memoryUsage,
    show,
    hide,
    preload: () => setShouldLoad(true),
    unload: () => setShouldLoad(false)
  };
}

/**
 * Hook for progressive loading of large datasets
 */
export function useProgressiveLoading<T>(
  loader: (offset: number, limit: number) => Promise<T[]>,
  options: {
    pageSize?: number;
    preloadPages?: number;
    maxPages?: number;
  } = {}
) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const {
    pageSize = 50,
    preloadPages = 1,
    maxPages = 100
  } = options;

  const loadPage = useCallback(async (page: number) => {
    if (isLoading || page >= maxPages) return;

    setIsLoading(true);
    setError(null);

    try {
      const offset = page * pageSize;
      const newItems = await loader(offset, pageSize);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      setItems(prev => {
        const updated = [...prev];
        newItems.forEach((item, index) => {
          updated[offset + index] = item;
        });
        return updated;
      });

      setCurrentPage(Math.max(currentPage, page));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load page'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, maxPages, pageSize, loader, currentPage]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadPage(currentPage + 1);
    }
  }, [hasMore, isLoading, currentPage, loadPage]);

  const preloadNext = useCallback(() => {
    for (let i = 1; i <= preloadPages; i++) {
      const nextPage = currentPage + i;
      if (nextPage < maxPages && hasMore) {
        setTimeout(() => loadPage(nextPage), i * 100);
      }
    }
  }, [currentPage, preloadPages, maxPages, hasMore, loadPage]);

  // Auto-load first page
  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      loadPage(0);
    }
  }, [items.length, isLoading, loadPage]);

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    preloadNext,
    reset: () => {
      setItems([]);
      setCurrentPage(0);
      setHasMore(true);
      setError(null);
    }
  };
}
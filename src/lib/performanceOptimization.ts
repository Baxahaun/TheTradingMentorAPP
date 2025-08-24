/**
 * Performance Optimization Utilities
 * Provides lazy loading, caching, debouncing, and memory management utilities
 * for the comprehensive trade review system.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Cache interface for performance metrics and data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Generic cache service with TTL support
 */
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const performanceCache = new CacheService();

/**
 * Debounce hook for auto-save and search operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Lazy loading hook for images and heavy components
 */
export function useLazyLoading(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if IntersectionObserver is available (not in test environment)
    if (typeof IntersectionObserver === 'undefined') {
      // In test environment or unsupported browsers, make everything visible immediately
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold]);

  const markAsLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return {
    elementRef,
    isVisible,
    isLoaded,
    markAsLoaded
  };
}

/**
 * Memory management hook for chart gallery and large datasets
 */
export function useMemoryManagement() {
  const imageRefs = useRef<Set<HTMLImageElement>>(new Set());
  const objectUrls = useRef<Set<string>>(new Set());

  const registerImage = useCallback((img: HTMLImageElement) => {
    imageRefs.current.add(img);
  }, []);

  const unregisterImage = useCallback((img: HTMLImageElement) => {
    imageRefs.current.delete(img);
  }, []);

  const registerObjectUrl = useCallback((url: string) => {
    objectUrls.current.add(url);
  }, []);

  const cleanup = useCallback(() => {
    // Clear image references
    imageRefs.current.forEach(img => {
      img.src = '';
      img.onload = null;
      img.onerror = null;
    });
    imageRefs.current.clear();

    // Revoke object URLs
    objectUrls.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    objectUrls.current.clear();

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    registerImage,
    unregisterImage,
    registerObjectUrl,
    cleanup
  };
}

/**
 * Virtualization hook for large data sets
 */
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
    top: (startIndex + index) * itemHeight
  }));

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex
  };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>();
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const endTime = performance.now();
      const duration = endTime - renderStartTime.current;
      setRenderTime(duration);

      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    }
  });

  return { renderTime };
}

/**
 * Throttle hook for scroll and resize events
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Batch updates hook for multiple state changes
 */
export function useBatchUpdates<T>(initialValue: T, batchDelay = 100) {
  const [value, setValue] = useState<T>(initialValue);
  const pendingUpdates = useRef<((prev: T) => T)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((updater: (prev: T) => T) => {
    pendingUpdates.current.push(updater);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setValue(prev => {
        let result = prev;
        pendingUpdates.current.forEach(update => {
          result = update(result);
        });
        pendingUpdates.current = [];
        return result;
      });
    }, batchDelay);
  }, [batchDelay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, batchUpdate] as const;
}
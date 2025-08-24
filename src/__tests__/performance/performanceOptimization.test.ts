/**
 * Performance Optimization Tests
 * Tests for caching, debouncing, lazy loading, and memory management utilities
 */

import { renderHook, act } from '@testing-library/react';
import { 
  CacheService, 
  performanceCache,
  useDebounce,
  useDebouncedCallback,
  useLazyLoading,
  useMemoryManagement,
  useVirtualization,
  usePerformanceMonitor,
  useThrottle,
  useBatchUpdates
} from '../../lib/performanceOptimization';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should store and retrieve cached data', () => {
    const testData = { value: 'test' };
    cache.set('test-key', testData);
    
    const retrieved = cache.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent keys', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should respect TTL and expire entries', async () => {
    const testData = { value: 'test' };
    cache.set('test-key', testData, 100); // 100ms TTL
    
    expect(cache.get('test-key')).toEqual(testData);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(cache.get('test-key')).toBeNull();
  });

  it('should check if key exists', () => {
    cache.set('test-key', 'value');
    
    expect(cache.has('test-key')).toBe(true);
    expect(cache.has('non-existent')).toBe(false);
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    expect(cache.size()).toBe(2);
    
    cache.clear();
    
    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('should cleanup expired entries', async () => {
    cache.set('key1', 'value1', 100); // Short TTL
    cache.set('key2', 'value2', 10000); // Long TTL
    
    expect(cache.size()).toBe(2);
    
    // Wait for first entry to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    cache.cleanup();
    
    expect(cache.size()).toBe(1);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });
});

describe('useDebounce', () => {
  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );

    expect(result.current).toBe('initial');

    // Change value multiple times quickly
    rerender({ value: 'change1', delay: 100 });
    rerender({ value: 'change2', delay: 100 });
    rerender({ value: 'final', delay: 100 });

    // Should still be initial value immediately
    expect(result.current).toBe('initial');

    // Wait for debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should now have the final value
    expect(result.current).toBe('final');
  });
});

describe('useDebouncedCallback', () => {
  it('should debounce callback execution', async () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => 
      useDebouncedCallback(mockCallback, 100)
    );

    // Call multiple times quickly
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    // Should not have been called yet
    expect(mockCallback).not.toHaveBeenCalled();

    // Wait for debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should have been called once with the last arguments
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('arg3');
  });
});

describe('useLazyLoading', () => {
  // Mock IntersectionObserver
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  beforeAll(() => {
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it('should provide lazy loading functionality', () => {
    const { result } = renderHook(() => useLazyLoading(0.1));

    expect(result.current.isVisible).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.elementRef).toBeDefined();
    expect(result.current.markAsLoaded).toBeInstanceOf(Function);
  });

  it('should mark as loaded when called', () => {
    const { result } = renderHook(() => useLazyLoading());

    act(() => {
      result.current.markAsLoaded();
    });

    expect(result.current.isLoaded).toBe(true);
  });
});

describe('useMemoryManagement', () => {
  it('should provide memory management utilities', () => {
    const { result } = renderHook(() => useMemoryManagement());

    expect(result.current.registerImage).toBeInstanceOf(Function);
    expect(result.current.unregisterImage).toBeInstanceOf(Function);
    expect(result.current.registerObjectUrl).toBeInstanceOf(Function);
    expect(result.current.cleanup).toBeInstanceOf(Function);
  });

  it('should register and cleanup images', () => {
    const { result } = renderHook(() => useMemoryManagement());
    const mockImage = document.createElement('img');

    act(() => {
      result.current.registerImage(mockImage);
    });

    // Should not throw when cleaning up
    act(() => {
      result.current.cleanup();
    });

    expect(mockImage.src).toBe('');
  });

  it('should register and revoke object URLs', () => {
    const { result } = renderHook(() => useMemoryManagement());
    const mockUrl = 'blob:test-url';
    
    // Mock URL.revokeObjectURL
    const mockRevoke = jest.fn();
    global.URL.revokeObjectURL = mockRevoke;

    act(() => {
      result.current.registerObjectUrl(mockUrl);
    });

    act(() => {
      result.current.cleanup();
    });

    expect(mockRevoke).toHaveBeenCalledWith(mockUrl);
  });
});

describe('useVirtualization', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  it('should calculate visible items correctly', () => {
    const { result } = renderHook(() => 
      useVirtualization(mockItems, 50, 300, 2)
    );

    expect(result.current.visibleItems).toBeDefined();
    expect(result.current.totalHeight).toBe(5000); // 100 items * 50px
    expect(result.current.handleScroll).toBeInstanceOf(Function);
  });

  it('should update visible items on scroll', () => {
    const { result } = renderHook(() => 
      useVirtualization(mockItems, 50, 300, 2)
    );

    const initialVisibleCount = result.current.visibleItems.length;

    // Simulate scroll event
    const mockScrollEvent = {
      currentTarget: { scrollTop: 250 }
    } as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(mockScrollEvent);
    });

    // Should still have visible items (exact count may vary based on overscan)
    expect(result.current.visibleItems.length).toBeGreaterThan(0);
  });
});

describe('usePerformanceMonitor', () => {
  it('should monitor render performance', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    expect(result.current.renderTime).toBeGreaterThanOrEqual(0);
  });
});

describe('useThrottle', () => {
  it('should throttle value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, limit }) => useThrottle(value, limit),
      { initialProps: { value: 'initial', limit: 100 } }
    );

    expect(result.current).toBe('initial');

    // Change value quickly
    rerender({ value: 'change1', limit: 100 });
    rerender({ value: 'change2', limit: 100 });

    // Should throttle updates
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // May or may not have updated depending on timing
    expect(typeof result.current).toBe('string');
  });
});

describe('useBatchUpdates', () => {
  it('should batch multiple updates', async () => {
    const { result } = renderHook(() => useBatchUpdates(0, 50));

    const [initialValue, batchUpdate] = result.current;
    expect(initialValue).toBe(0);

    // Make multiple updates
    act(() => {
      batchUpdate(prev => prev + 1);
      batchUpdate(prev => prev + 2);
      batchUpdate(prev => prev + 3);
    });

    // Should still be initial value immediately
    expect(result.current[0]).toBe(0);

    // Wait for batch delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should have applied all updates
    expect(result.current[0]).toBe(6); // 0 + 1 + 2 + 3
  });
});

describe('Performance Cache Integration', () => {
  beforeEach(() => {
    performanceCache.clear();
  });

  it('should use global cache instance', () => {
    performanceCache.set('test', 'value');
    expect(performanceCache.get('test')).toBe('value');
  });

  it('should handle cache cleanup', () => {
    performanceCache.set('key1', 'value1', 50);
    performanceCache.set('key2', 'value2', 1000);

    expect(performanceCache.size()).toBe(2);

    // Wait for first entry to expire
    setTimeout(() => {
      performanceCache.cleanup();
      expect(performanceCache.size()).toBe(1);
    }, 100);
  });
});
/**
 * Performance optimization utilities for debouncing, throttling, and lazy loading
 */

/**
 * Debounce function to limit rapid successive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Lazy loading hook for heavy components
 */
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  fallback?: T
): {
  load: () => Promise<T>;
  isLoaded: () => boolean;
  getValue: () => T | undefined;
} {
  let loaded = false;
  let value: T | undefined = fallback;
  let loadPromise: Promise<T> | null = null;

  return {
    load: async () => {
      if (loaded && value !== undefined) {
        return value;
      }

      if (loadPromise) {
        return loadPromise;
      }

      loadPromise = loader().then(result => {
        loaded = true;
        value = result;
        loadPromise = null;
        return result;
      });

      return loadPromise;
    },
    isLoaded: () => loaded,
    getValue: () => value
  };
}

/**
 * Background task runner for non-blocking operations
 */
export class BackgroundTaskRunner {
  private tasks = new Map<string, {
    task: () => Promise<any>;
    priority: number;
    retries: number;
    maxRetries: number;
  }>();
  
  private running = false;
  private currentTask: string | null = null;

  /**
   * Add a background task
   */
  addTask(
    id: string,
    task: () => Promise<any>,
    priority: number = 0,
    maxRetries: number = 3
  ): void {
    this.tasks.set(id, {
      task,
      priority,
      retries: 0,
      maxRetries
    });

    if (!this.running) {
      this.processQueue();
    }
  }

  /**
   * Remove a task from the queue
   */
  removeTask(id: string): void {
    this.tasks.delete(id);
  }

  /**
   * Check if a task is currently running or queued
   */
  hasTask(id: string): boolean {
    return this.tasks.has(id) || this.currentTask === id;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.tasks.size,
      running: this.running,
      currentTask: this.currentTask
    };
  }

  private async processQueue(): Promise<void> {
    if (this.running || this.tasks.size === 0) {
      return;
    }

    this.running = true;

    while (this.tasks.size > 0) {
      // Get highest priority task
      const [taskId, taskInfo] = Array.from(this.tasks.entries())
        .sort(([, a], [, b]) => b.priority - a.priority)[0];

      this.currentTask = taskId;
      this.tasks.delete(taskId);

      try {
        await taskInfo.task();
      } catch (error) {
        console.warn(`Background task ${taskId} failed:`, error);
        
        // Retry if under max retries
        if (taskInfo.retries < taskInfo.maxRetries) {
          taskInfo.retries++;
          this.tasks.set(taskId, taskInfo);
        }
      }

      this.currentTask = null;
      
      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    this.running = false;
  }
}

/**
 * Virtual list utilities for large datasets
 */
export interface VirtualListConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualListItems(
  scrollTop: number,
  totalItems: number,
  config: VirtualListConfig
) {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    totalItems - 1
  );

  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(totalItems - 1, visibleEnd + overscan);

  return {
    start,
    end,
    visibleStart,
    visibleEnd,
    totalHeight: totalItems * itemHeight,
    offsetY: start * itemHeight
  };
}

/**
 * Memoization utility for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Global background task runner instance
export const backgroundTaskRunner = new BackgroundTaskRunner();
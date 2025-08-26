/**
 * Performance Monitoring Service
 * Tracks application performance metrics and provides optimization insights
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'calculation' | 'network' | 'memory';
}

interface PerformanceThresholds {
  renderTime: number;
  calculationTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

export class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds;
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      renderTime: 16, // 60fps = 16ms per frame
      calculationTime: 100, // 100ms for heavy calculations
      memoryUsage: 100 * 1024 * 1024, // 100MB
      cacheHitRate: 80, // 80% cache hit rate
      ...thresholds
    };

    this.initializeObservers();
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, category: PerformanceMetric['category']): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check thresholds and warn if exceeded
    this.checkThresholds(metric);
  }

  /**
   * Measure execution time of a function
   */
  measureExecutionTime<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'calculation'
  ): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    this.recordMetric(name, endTime - startTime, category);
    
    return result;
  }

  /**
   * Measure async execution time
   */
  async measureAsyncExecutionTime<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'calculation'
  ): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    this.recordMetric(name, endTime - startTime, category);
    
    return result;
  }

  /**
   * Get performance statistics
   */
  getStatistics(category?: PerformanceMetric['category'], timeWindow?: number) {
    let filteredMetrics = this.metrics;

    // Filter by category
    if (category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === category);
    }

    // Filter by time window (in milliseconds)
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filteredMetrics = filteredMetrics.filter(m => m.timestamp > cutoff);
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const values = filteredMetrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return {
      count: filteredMetrics.length,
      avg,
      min,
      max,
      p50,
      p90,
      p95,
      sum
    };
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    return {
      timestamp: now,
      render: this.getStatistics('render', oneHour),
      calculation: this.getStatistics('calculation', oneHour),
      network: this.getStatistics('network', oneHour),
      memory: this.getStatistics('memory', oneHour),
      overall: this.getStatistics(undefined, oneHour),
      thresholds: this.thresholds,
      warnings: this.getWarnings()
    };
  }

  /**
   * Monitor component render performance
   */
  monitorComponentRender(componentName: string) {
    return {
      onRenderStart: () => {
        performance.mark(`${componentName}-render-start`);
      },
      onRenderEnd: () => {
        performance.mark(`${componentName}-render-end`);
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );

        const measure = performance.getEntriesByName(`${componentName}-render`)[0];
        if (measure) {
          this.recordMetric(`${componentName}-render`, measure.duration, 'render');
        }
      }
    };
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('heap-used', memory.usedJSHeapSize, 'memory');
      this.recordMetric('heap-total', memory.totalJSHeapSize, 'memory');
      this.recordMetric('heap-limit', memory.jsHeapSizeLimit, 'memory');
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(interval: number = 5000): void {
    setInterval(() => {
      this.monitorMemoryUsage();
    }, interval);
  }

  /**
   * Get current warnings
   */
  private getWarnings(): string[] {
    const warnings: string[] = [];
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.timestamp < 60000 // Last minute
    );

    // Check render performance
    const renderMetrics = recentMetrics.filter(m => m.category === 'render');
    if (renderMetrics.length > 0) {
      const avgRenderTime = renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length;
      if (avgRenderTime > this.thresholds.renderTime) {
        warnings.push(`Slow rendering detected: ${avgRenderTime.toFixed(2)}ms average`);
      }
    }

    // Check calculation performance
    const calcMetrics = recentMetrics.filter(m => m.category === 'calculation');
    if (calcMetrics.length > 0) {
      const slowCalculations = calcMetrics.filter(m => m.value > this.thresholds.calculationTime);
      if (slowCalculations.length > 0) {
        warnings.push(`${slowCalculations.length} slow calculations detected`);
      }
    }

    // Check memory usage
    const memoryMetrics = recentMetrics.filter(m => m.name === 'heap-used');
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      if (latestMemory.value > this.thresholds.memoryUsage) {
        warnings.push(`High memory usage: ${(latestMemory.value / 1024 / 1024).toFixed(2)}MB`);
      }
    }

    return warnings;
  }

  /**
   * Check if metric exceeds thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    let exceeded = false;

    switch (metric.category) {
      case 'render':
        exceeded = metric.value > this.thresholds.renderTime;
        break;
      case 'calculation':
        exceeded = metric.value > this.thresholds.calculationTime;
        break;
      case 'memory':
        if (metric.name === 'heap-used') {
          exceeded = metric.value > this.thresholds.memoryUsage;
        }
        break;
    }

    if (exceeded) {
      console.warn(`Performance threshold exceeded: ${metric.name} = ${metric.value}`);
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long-task', entry.duration, 'render');
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        // Long task observer not supported
      }

      // Observe navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page-load', navEntry.loadEventEnd - navEntry.navigationStart, 'network');
              this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.navigationStart, 'render');
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (e) {
        // Navigation observer not supported
      }
    }
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitoringService();

// Decorator for measuring method performance
export function measurePerformance(
  name?: string,
  category: PerformanceMetric['category'] = 'calculation'
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureExecutionTime(
        methodName,
        () => originalMethod.apply(this, args),
        category
      );
    };

    return descriptor;
  };
}

// Decorator for measuring async method performance
export function measureAsyncPerformance(
  name?: string,
  category: PerformanceMetric['category'] = 'calculation'
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsyncExecutionTime(
        methodName,
        () => originalMethod.apply(this, args),
        category
      );
    };

    return descriptor;
  };
}
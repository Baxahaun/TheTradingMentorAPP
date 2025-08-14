// Performance metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'cache' | 'render' | 'data' | 'network' | 'user';
  metadata?: Record<string, any>;
}

// Performance thresholds
interface PerformanceThresholds {
  cacheHitRate: number; // Minimum cache hit rate (%)
  renderTime: number; // Maximum render time (ms)
  dataLoadTime: number; // Maximum data load time (ms)
  memoryUsage: number; // Maximum memory usage (MB)
  componentMountTime: number; // Maximum component mount time (ms)
}

// Default thresholds
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  cacheHitRate: 80,
  renderTime: 100,
  dataLoadTime: 500,
  memoryUsage: 100,
  componentMountTime: 50,
};

// Performance monitoring service
export class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds;
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.setupPerformanceObservers();
  }

  // Setup performance observers
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'page_load_time',
              value: navEntry.loadEventEnd - navEntry.navigationStart,
              timestamp: Date.now(),
              category: 'network',
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
                firstPaint: navEntry.responseEnd - navEntry.navigationStart,
              },
            });
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
    } catch (error) {
      console.warn('Navigation timing observer not supported:', error);
    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric({
              name: 'resource_load_time',
              value: resourceEntry.responseEnd - resourceEntry.startTime,
              timestamp: Date.now(),
              category: 'network',
              metadata: {
                name: resourceEntry.name,
                size: resourceEntry.transferSize,
                type: resourceEntry.initiatorType,
              },
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      console.warn('Resource timing observer not supported:', error);
    }

    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: 'long_task',
            value: entry.duration,
            timestamp: Date.now(),
            category: 'render',
            metadata: {
              startTime: entry.startTime,
              name: entry.name,
            },
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (error) {
      console.warn('Long task observer not supported:', error);
    }
  }

  // Record a performance metric
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check thresholds and log warnings
    this.checkThresholds(metric);
  }

  // Check performance thresholds
  private checkThresholds(metric: PerformanceMetric): void {
    const { name, value, category } = metric;

    switch (name) {
      case 'cache_hit_rate':
        if (value < this.thresholds.cacheHitRate) {
          console.warn(`Low cache hit rate: ${value}% (threshold: ${this.thresholds.cacheHitRate}%)`);
        }
        break;
      case 'component_render_time':
        if (value > this.thresholds.renderTime) {
          console.warn(`Slow component render: ${value}ms (threshold: ${this.thresholds.renderTime}ms)`, metric.metadata);
        }
        break;
      case 'data_load_time':
        if (value > this.thresholds.dataLoadTime) {
          console.warn(`Slow data load: ${value}ms (threshold: ${this.thresholds.dataLoadTime}ms)`, metric.metadata);
        }
        break;
      case 'memory_usage':
        if (value > this.thresholds.memoryUsage) {
          console.warn(`High memory usage: ${value}MB (threshold: ${this.thresholds.memoryUsage}MB)`);
        }
        break;
      case 'component_mount_time':
        if (value > this.thresholds.componentMountTime) {
          console.warn(`Slow component mount: ${value}ms (threshold: ${this.thresholds.componentMountTime}ms)`, metric.metadata);
        }
        break;
    }
  }

  // Measure function execution time
  measureFunction<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'data',
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    this.recordMetric({
      name,
      value: endTime - startTime,
      timestamp: Date.now(),
      category,
      metadata,
    });

    return result;
  }

  // Measure async function execution time
  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'data',
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();

    this.recordMetric({
      name,
      value: endTime - startTime,
      timestamp: Date.now(),
      category,
      metadata,
    });

    return result;
  }

  // Record cache performance
  recordCacheMetrics(hitCount: number, totalCount: number): void {
    const hitRate = totalCount > 0 ? (hitCount / totalCount) * 100 : 0;
    
    this.recordMetric({
      name: 'cache_hit_rate',
      value: hitRate,
      timestamp: Date.now(),
      category: 'cache',
      metadata: {
        hitCount,
        totalCount,
        missCount: totalCount - hitCount,
      },
    });
  }

  // Record memory usage
  recordMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      
      this.recordMetric({
        name: 'memory_usage',
        value: usedMB,
        timestamp: Date.now(),
        category: 'data',
        metadata: {
          totalHeapSize: memory.totalJSHeapSize / (1024 * 1024),
          heapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024),
        },
      });
    }
  }

  // Get performance summary
  getPerformanceSummary(timeWindow: number = 5 * 60 * 1000): {
    averageRenderTime: number;
    averageDataLoadTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    longTaskCount: number;
    totalMetrics: number;
  } {
    const cutoffTime = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    const renderMetrics = recentMetrics.filter(m => m.name === 'component_render_time');
    const dataLoadMetrics = recentMetrics.filter(m => m.name === 'data_load_time');
    const cacheMetrics = recentMetrics.filter(m => m.name === 'cache_hit_rate');
    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory_usage');
    const longTaskMetrics = recentMetrics.filter(m => m.name === 'long_task');

    return {
      averageRenderTime: this.calculateAverage(renderMetrics),
      averageDataLoadTime: this.calculateAverage(dataLoadMetrics),
      cacheHitRate: this.calculateAverage(cacheMetrics),
      memoryUsage: this.calculateAverage(memoryMetrics),
      longTaskCount: longTaskMetrics.length,
      totalMetrics: recentMetrics.length,
    };
  }

  // Calculate average value from metrics
  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  // Get metrics by category
  getMetricsByCategory(
    category: PerformanceMetric['category'],
    timeWindow: number = 5 * 60 * 1000
  ): PerformanceMetric[] {
    const cutoffTime = Date.now() - timeWindow;
    return this.metrics.filter(m => 
      m.category === category && m.timestamp > cutoffTime
    );
  }

  // Get metrics by name
  getMetricsByName(
    name: string,
    timeWindow: number = 5 * 60 * 1000
  ): PerformanceMetric[] {
    const cutoffTime = Date.now() - timeWindow;
    return this.metrics.filter(m => 
      m.name === name && m.timestamp > cutoffTime
    );
  }

  // Clear old metrics
  clearOldMetrics(maxAge: number = 10 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Export metrics as JSON
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      thresholds: this.thresholds,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now(),
    }, null, 2);
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics = [];
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = React.useMemo(() => new PerformanceMonitorService(), []);

  React.useEffect(() => {
    return () => monitor.cleanup();
  }, [monitor]);

  return monitor;
};

// HOC for component performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const monitor = usePerformanceMonitor();
    const mountTimeRef = React.useRef<number>();

    React.useEffect(() => {
      mountTimeRef.current = performance.now();
      
      return () => {
        if (mountTimeRef.current) {
          const mountTime = performance.now() - mountTimeRef.current;
          monitor.recordMetric({
            name: 'component_mount_time',
            value: mountTime,
            timestamp: Date.now(),
            category: 'render',
            metadata: { componentName },
          });
        }
      };
    }, [monitor]);

    const startRender = React.useRef<number>();
    
    React.useLayoutEffect(() => {
      if (startRender.current) {
        const renderTime = performance.now() - startRender.current;
        monitor.recordMetric({
          name: 'component_render_time',
          value: renderTime,
          timestamp: Date.now(),
          category: 'render',
          metadata: { componentName },
        });
      }
    });

    startRender.current = performance.now();

    return <Component {...props} ref={ref} />;
  });
};

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitorService();

// Performance monitoring utilities
export const PerformanceUtils = {
  // Measure component render time
  measureRender: (componentName: string, renderFn: () => React.ReactElement) => {
    return globalPerformanceMonitor.measureFunction(
      'component_render_time',
      renderFn,
      'render',
      { componentName }
    );
  },

  // Measure data loading time
  measureDataLoad: async <T>(
    operation: string,
    loadFn: () => Promise<T>
  ): Promise<T> => {
    return globalPerformanceMonitor.measureAsyncFunction(
      'data_load_time',
      loadFn,
      'data',
      { operation }
    );
  },

  // Record user interaction
  recordUserInteraction: (action: string, metadata?: Record<string, any>) => {
    globalPerformanceMonitor.recordMetric({
      name: 'user_interaction',
      value: Date.now(),
      timestamp: Date.now(),
      category: 'user',
      metadata: { action, ...metadata },
    });
  },
};
import React, { Suspense, lazy } from 'react';
import { LazyLoader, withLazyLoading } from '../common/LazyLoader';

// Lazy load analytics widgets
const SetupAnalyticsWidget = lazy(() => 
  import('../widgets/SetupAnalyticsWidget').then(module => ({
    default: module.SetupAnalyticsWidget
  }))
);

const PatternPerformanceWidget = lazy(() => 
  import('../widgets/PatternPerformanceWidget').then(module => ({
    default: module.PatternPerformanceWidget
  }))
);

const PositionManagementAnalyticsWidget = lazy(() => 
  import('../widgets/PositionManagementAnalyticsWidget').then(module => ({
    default: module.PositionManagementAnalyticsWidget
  }))
);

// Loading fallback component
const WidgetLoadingFallback: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div 
    className="animate-pulse bg-gray-200 rounded-lg p-4"
    style={{ height }}
  >
    <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-300 rounded w-full"></div>
      <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      <div className="h-4 bg-gray-300 rounded w-4/6"></div>
    </div>
    <div className="mt-4 h-32 bg-gray-300 rounded"></div>
  </div>
);

// Error boundary for lazy widgets
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Widget Loading Error</h3>
          <p className="text-red-600 text-sm mt-1">
            Failed to load analytics widget. Please refresh the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy Setup Analytics Widget
export const LazySetupAnalyticsWidget: React.FC<any> = (props) => (
  <LazyLoader
    fallback={<WidgetLoadingFallback />}
    threshold={0.1}
    rootMargin="100px"
  >
    <WidgetErrorBoundary>
      <Suspense fallback={<WidgetLoadingFallback />}>
        <SetupAnalyticsWidget {...props} />
      </Suspense>
    </WidgetErrorBoundary>
  </LazyLoader>
);

// Lazy Pattern Performance Widget
export const LazyPatternPerformanceWidget: React.FC<any> = (props) => (
  <LazyLoader
    fallback={<WidgetLoadingFallback />}
    threshold={0.1}
    rootMargin="100px"
  >
    <WidgetErrorBoundary>
      <Suspense fallback={<WidgetLoadingFallback />}>
        <PatternPerformanceWidget {...props} />
      </Suspense>
    </WidgetErrorBoundary>
  </LazyLoader>
);

// Lazy Position Management Analytics Widget
export const LazyPositionManagementAnalyticsWidget: React.FC<any> = (props) => (
  <LazyLoader
    fallback={<WidgetLoadingFallback />}
    threshold={0.1}
    rootMargin="100px"
  >
    <WidgetErrorBoundary>
      <Suspense fallback={<WidgetLoadingFallback />}>
        <PositionManagementAnalyticsWidget {...props} />
      </Suspense>
    </WidgetErrorBoundary>
  </LazyLoader>
);

// Lazy widget factory
export const createLazyWidget = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallbackHeight: number = 300
) => {
  const LazyComponent = lazy(importFn);
  
  return React.forwardRef<any, P>((props, ref) => (
    <LazyLoader
      fallback={<WidgetLoadingFallback height={fallbackHeight} />}
      threshold={0.1}
      rootMargin="100px"
    >
      <WidgetErrorBoundary>
        <Suspense fallback={<WidgetLoadingFallback height={fallbackHeight} />}>
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </WidgetErrorBoundary>
    </LazyLoader>
  ));
};

// Preload widgets for better performance
export const preloadAnalyticsWidgets = () => {
  // Preload widgets when user is likely to need them
  const preloadPromises = [
    import('../widgets/SetupAnalyticsWidget'),
    import('../widgets/PatternPerformanceWidget'),
    import('../widgets/PositionManagementAnalyticsWidget'),
  ];

  return Promise.allSettled(preloadPromises);
};

// Widget registry with lazy loading
export const LazyWidgetRegistry = {
  'setup-analytics': LazySetupAnalyticsWidget,
  'pattern-performance': LazyPatternPerformanceWidget,
  'position-management': LazyPositionManagementAnalyticsWidget,
};

// Lazy widget container with performance monitoring
export const LazyWidgetContainer: React.FC<{
  widgetType: keyof typeof LazyWidgetRegistry;
  props: any;
  onLoadStart?: () => void;
  onLoadComplete?: (loadTime: number) => void;
}> = ({ widgetType, props, onLoadStart, onLoadComplete }) => {
  const [loadStartTime] = React.useState(() => Date.now());
  
  React.useEffect(() => {
    onLoadStart?.();
    
    return () => {
      const loadTime = Date.now() - loadStartTime;
      onLoadComplete?.(loadTime);
    };
  }, [onLoadStart, onLoadComplete, loadStartTime]);

  const WidgetComponent = LazyWidgetRegistry[widgetType];
  
  if (!WidgetComponent) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Unknown widget type: {widgetType}</p>
      </div>
    );
  }

  return <WidgetComponent {...props} />;
};
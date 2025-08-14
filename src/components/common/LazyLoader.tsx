import React, { useState, useEffect, useRef, ReactNode } from 'react';

// Lazy loading configuration
interface LazyLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
  onLoad?: () => void;
  delay?: number;
}

// Intersection Observer hook
const useIntersectionObserver = (
  threshold: number = 0.1,
  rootMargin: string = '50px',
  triggerOnce: boolean = true
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        
        if (isVisible && (!triggerOnce || !hasTriggered)) {
          setIsIntersecting(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(isVisible);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { elementRef, isIntersecting };
};

// Lazy Loader Component
export const LazyLoader: React.FC<LazyLoaderProps> = ({
  children,
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  className = '',
  onLoad,
  delay = 0,
}) => {
  const { elementRef, isIntersecting } = useIntersectionObserver(
    threshold,
    rootMargin,
    triggerOnce
  );
  const [shouldRender, setShouldRender] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isIntersecting && !shouldRender) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setShouldRender(true);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setShouldRender(true);
      }
    }
  }, [isIntersecting, shouldRender, delay]);

  useEffect(() => {
    if (shouldRender && !isLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [shouldRender, isLoaded, onLoad]);

  return (
    <div ref={elementRef} className={className}>
      {shouldRender ? children : fallback}
    </div>
  );
};

// Lazy loading hook for data
export const useLazyData = <T,>(
  loadData: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);

  const load = async () => {
    if (hasLoadedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadData();
      setData(result);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hasLoadedRef.current = false;
    setData(null);
    setError(null);
  }, dependencies);

  return { data, loading, error, load };
};

// Lazy component wrapper
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  options?: Partial<LazyLoaderProps>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <LazyLoader fallback={fallback} {...options}>
      <Component {...props} ref={ref} />
    </LazyLoader>
  ));
};
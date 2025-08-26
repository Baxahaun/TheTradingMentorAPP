import { useEffect, useState } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook for responsive design utilities
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCurrentBreakpoint = (): Breakpoint => {
    const width = windowSize.width;
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  };

  const isBreakpoint = (breakpoint: Breakpoint): boolean => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;

  return {
    windowSize,
    currentBreakpoint: getCurrentBreakpoint(),
    isBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Hook for touch device detection
 */
export function useTouch() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });
    
    return () => {
      window.removeEventListener('touchstart', checkTouch);
    };
  }, []);

  return isTouch;
}

/**
 * Hook for managing mobile-specific interactions
 */
export function useMobileInteractions() {
  const isTouch = useTouch();
  const { isMobile } = useResponsive();

  const getTouchProps = (onTap?: () => void) => {
    if (!isTouch || !onTap) return {};

    return {
      onTouchStart: (e: React.TouchEvent) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.currentTarget.style.transform = 'scale(1)';
        onTap();
      },
      onTouchCancel: (e: React.TouchEvent) => {
        e.currentTarget.style.transform = 'scale(1)';
      },
    };
  };

  return {
    isTouch,
    isMobile,
    getTouchProps,
  };
}
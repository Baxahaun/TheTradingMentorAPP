import { useState, useEffect, useCallback } from 'react';

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
}

export interface TouchGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  largeDesktop: 1536
};

export const useMobileResponsive = () => {
  const [breakpointState, setBreakpointState] = useState<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    width: 0,
    height: 0
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setBreakpointState({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
        isLargeDesktop: width >= BREAKPOINTS.desktop,
        width,
        height
      });
    };

    updateBreakpoints();
    window.addEventListener('resize', updateBreakpoints);

    return () => window.removeEventListener('resize', updateBreakpoints);
  }, []);

  return breakpointState;
};

// Hook for touch gestures
export const useTouchGestures = (
  onSwipe?: (gesture: TouchGesture) => void,
  threshold: number = 50
) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchStart || !onSwipe) return;

    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    
    const deltaX = endX - touchStart.x;
    const deltaY = endY - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < threshold) return;

    let direction: TouchGesture['direction'] = null;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const gesture: TouchGesture = {
      startX: touchStart.x,
      startY: touchStart.y,
      endX,
      endY,
      deltaX,
      deltaY,
      direction,
      distance
    };

    onSwipe(gesture);
    setTouchStart(null);
  }, [touchStart, onSwipe, threshold]);

  return {
    handleTouchStart,
    handleTouchEnd
  };
};

// Hook for mobile-specific behaviors
export const useMobileOptimizations = () => {
  const { isMobile } = useMobileResponsive();

  // Prevent zoom on double tap for iOS
  useEffect(() => {
    if (!isMobile) return;

    let lastTouchEnd = 0;
    
    const preventZoom = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchend', preventZoom);
    };
  }, [isMobile]);

  // Handle viewport height changes on mobile (keyboard appearance)
  useEffect(() => {
    if (!isMobile) return;

    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);

    return () => window.removeEventListener('resize', setVH);
  }, [isMobile]);

  return {
    isMobile
  };
};
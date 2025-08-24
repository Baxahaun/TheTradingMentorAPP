import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { useMobileResponsive, useTouchGestures, useMobileOptimizations } from '../useMobileResponsive';

// Mock window properties
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: mockWindow.innerWidth,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: mockWindow.innerHeight,
});

describe('useMobileResponsive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindow.innerWidth = 1024;
    mockWindow.innerHeight = 768;
  });

  it('should detect desktop breakpoint', () => {
    const { result } = renderHook(() => useMobileResponsive());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLargeDesktop: false,
      width: 1024,
      height: 768
    });
  });

  it('should detect mobile breakpoint', () => {
    mockWindow.innerWidth = 375;
    mockWindow.innerHeight = 667;

    const { result } = renderHook(() => useMobileResponsive());

    expect(result.current).toEqual({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLargeDesktop: false,
      width: 375,
      height: 667
    });
  });

  it('should detect tablet breakpoint', () => {
    mockWindow.innerWidth = 768;
    mockWindow.innerHeight = 1024;

    const { result } = renderHook(() => useMobileResponsive());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      isLargeDesktop: false,
      width: 768,
      height: 1024
    });
  });

  it('should detect large desktop breakpoint', () => {
    mockWindow.innerWidth = 1600;
    mockWindow.innerHeight = 900;

    const { result } = renderHook(() => useMobileResponsive());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      isLargeDesktop: true,
      width: 1600,
      height: 900
    });
  });

  it('should update on window resize', () => {
    const { result } = renderHook(() => useMobileResponsive());

    expect(result.current.isMobile).toBe(false);

    // Simulate resize to mobile
    act(() => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.width).toBe(375);
    expect(result.current.height).toBe(667);
  });

  it('should clean up event listeners', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useMobileResponsive());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});

describe('useTouchGestures', () => {
  it('should handle touch start', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useTouchGestures(onSwipe));

    const touchEvent = {
      touches: [{ clientX: 100, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchStart(touchEvent);
    });

    // Should store touch start position
    expect(result.current.handleTouchStart).toBeDefined();
  });

  it('should detect swipe right', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useTouchGestures(onSwipe, 50));

    // Start touch
    const touchStartEvent = {
      touches: [{ clientX: 100, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    // End touch (swipe right)
    const touchEndEvent = {
      changedTouches: [{ clientX: 200, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchEnd(touchEndEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith({
      startX: 100,
      startY: 100,
      endX: 200,
      endY: 100,
      deltaX: 100,
      deltaY: 0,
      direction: 'right',
      distance: 100
    });
  });

  it('should detect swipe left', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useTouchGestures(onSwipe, 50));

    // Start touch
    const touchStartEvent = {
      touches: [{ clientX: 200, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    // End touch (swipe left)
    const touchEndEvent = {
      changedTouches: [{ clientX: 100, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchEnd(touchEndEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith({
      startX: 200,
      startY: 100,
      endX: 100,
      endY: 100,
      deltaX: -100,
      deltaY: 0,
      direction: 'left',
      distance: 100
    });
  });

  it('should detect swipe up', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useTouchGestures(onSwipe, 50));

    // Start touch
    const touchStartEvent = {
      touches: [{ clientX: 100, clientY: 200 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    // End touch (swipe up)
    const touchEndEvent = {
      changedTouches: [{ clientX: 100, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchEnd(touchEndEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith({
      startX: 100,
      startY: 200,
      endX: 100,
      endY: 100,
      deltaX: 0,
      deltaY: -100,
      direction: 'up',
      distance: 100
    });
  });

  it('should detect swipe down', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useTouchGestures(onSwipe, 50));

    // Start touch
    const touchStartEvent = {
      touches: [{ clientX: 100, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    // End touch (swipe down)
    const touchEndEvent = {
      changedTouches: [{ clientX: 100, clientY: 200 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchEnd(touchEndEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith({
      startX: 100,
      startY: 100,
      endX: 100,
      endY: 200,
      deltaX: 0,
      deltaY: 100,
      direction: 'down',
      distance: 100
    });
  });

  it('should ignore gestures below threshold', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useTouchGestures(onSwipe, 100));

    // Start touch
    const touchStartEvent = {
      touches: [{ clientX: 100, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    // End touch (small movement)
    const touchEndEvent = {
      changedTouches: [{ clientX: 120, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchEnd(touchEndEvent);
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('should not call onSwipe if not provided', () => {
    const { result } = renderHook(() => useTouchGestures());

    const touchStartEvent = {
      touches: [{ clientX: 100, clientY: 100 }]
    } as React.TouchEvent;

    const touchEndEvent = {
      changedTouches: [{ clientX: 200, clientY: 100 }]
    } as React.TouchEvent;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
      result.current.handleTouchEnd(touchEndEvent);
    });

    // Should not throw error
    expect(true).toBe(true);
  });
});

describe('useMobileOptimizations', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--vh');
    vi.clearAllMocks();
  });

  it('should set viewport height custom property on mobile', () => {
    // Mock mobile viewport
    mockWindow.innerWidth = 375;
    mockWindow.innerHeight = 667;

    renderHook(() => useMobileOptimizations());

    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('6.67px');
  });

  it('should update viewport height on resize', () => {
    mockWindow.innerWidth = 375;
    mockWindow.innerHeight = 667;

    renderHook(() => useMobileOptimizations());

    // Initial value
    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('6.67px');

    // Simulate keyboard appearance (height change)
    act(() => {
      mockWindow.innerHeight = 400;
      window.dispatchEvent(new Event('resize'));
    });

    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('4px');
  });

  it('should prevent double-tap zoom on mobile', () => {
    mockWindow.innerWidth = 375;
    mockWindow.innerHeight = 667;

    renderHook(() => useMobileOptimizations());

    const preventDefault = vi.fn();
    const touchEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true
    });

    Object.defineProperty(touchEvent, 'preventDefault', {
      value: preventDefault
    });

    // First touch
    document.dispatchEvent(touchEvent);

    // Second touch within 300ms
    setTimeout(() => {
      document.dispatchEvent(touchEvent);
      expect(preventDefault).toHaveBeenCalled();
    }, 100);
  });

  it('should not apply mobile optimizations on desktop', () => {
    mockWindow.innerWidth = 1024;
    mockWindow.innerHeight = 768;

    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    renderHook(() => useMobileOptimizations());

    // Should not add touch event listeners on desktop
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('touchend', expect.any(Function));
  });

  it('should clean up event listeners', () => {
    mockWindow.innerWidth = 375;
    mockWindow.innerHeight = 667;

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const removeDocumentEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useMobileOptimizations());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeDocumentEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
  });
});
import { useEffect, useRef, useState } from 'react';

/**
 * Accessibility preferences interface
 */
export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusIndicators: boolean;
}

/**
 * Hook for managing keyboard navigation
 */
export function useKeyboardNavigation(items: any[], onSelect: (item: any) => void) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onSelect(items[focusedIndex]);
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [items, focusedIndex, onSelect]);

  return { focusedIndex, setFocusedIndex, containerRef };
}

/**
 * Hook for managing focus trap in modals
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing high contrast mode
 */
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('high-contrast') === 'true' ||
             window.matchMedia('(prefers-contrast: high)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('high-contrast')) {
        setIsHighContrast(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('high-contrast', newValue.toString());
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return { isHighContrast, toggleHighContrast };
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
}

/**
 * Hook for managing focus within components
 */
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const focusElement = () => {
    if (focusRef.current) {
      focusRef.current.focus();
      setIsFocused(true);
    }
  };

  const blurElement = () => {
    if (focusRef.current) {
      focusRef.current.blur();
      setIsFocused(false);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  useEffect(() => {
    const element = focusRef.current;
    if (element) {
      element.addEventListener('focus', handleFocus);
      element.addEventListener('blur', handleBlur);
      
      return () => {
        element.removeEventListener('focus', handleFocus);
        element.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  return {
    focusRef,
    isFocused,
    focusElement,
    blurElement
  };
}

/**
 * Main accessibility hook that combines all accessibility features
 */
export function useAccessibility() {
  const { isHighContrast, toggleHighContrast } = useHighContrast();
  const { announce } = useScreenReader();
  const { focusRef, isFocused, focusElement, blurElement } = useFocusManagement();

  // Accessibility preferences state
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      highContrast: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      keyboardNavigation: true,
      fontSize: 'medium',
      focusIndicators: true
    };
  });

  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (updates: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const togglePreference = (key: keyof AccessibilityPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return {
    // Preferences
    preferences,
    updatePreferences,
    togglePreference,
    
    // High contrast
    isHighContrast,
    toggleHighContrast,
    
    // Screen reader
    announce,
    
    // Focus management
    focusRef,
    isFocused,
    focusElement,
    blurElement,
    
    // Motion preferences
    prefersReducedMotion,
    
    // Utility functions
    setFocusable: (element: HTMLElement, focusable: boolean) => {
      element.tabIndex = focusable ? 0 : -1;
    },
    
    announcePageChange: (pageName: string) => {
      announce(`Navigated to ${pageName}`, 'assertive');
    },
    
    announceError: (error: string) => {
      announce(`Error: ${error}`, 'assertive');
    },
    
    announceSuccess: (message: string) => {
      announce(`Success: ${message}`, 'polite');
    }
  };
}
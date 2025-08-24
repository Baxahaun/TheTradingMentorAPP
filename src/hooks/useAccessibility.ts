import { useEffect, useState, useCallback } from 'react';

export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  keyboardNavigation: boolean;
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  keyboardNavigation: true
};

export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage and system preferences
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem('accessibility-preferences');
        const storedPrefs = stored ? JSON.parse(stored) : {};
        
        // Check system preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        
        const newPreferences: AccessibilityPreferences = {
          ...DEFAULT_PREFERENCES,
          ...storedPrefs,
          reducedMotion: storedPrefs.reducedMotion ?? prefersReducedMotion,
          highContrast: storedPrefs.highContrast ?? prefersHighContrast
        };
        
        setPreferences(newPreferences);
        applyPreferences(newPreferences);
      } catch (error) {
        console.error('Error loading accessibility preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Apply preferences to document
  const applyPreferences = useCallback((prefs: AccessibilityPreferences) => {
    const root = document.documentElement;
    
    // High contrast mode
    if (prefs.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (prefs.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${prefs.fontSize}`);
    
    // Keyboard navigation
    if (prefs.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    applyPreferences(newPreferences);
    
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving accessibility preferences:', error);
    }
  }, [preferences, applyPreferences]);

  // Toggle specific preference
  const togglePreference = useCallback((key: keyof AccessibilityPreferences) => {
    if (typeof preferences[key] === 'boolean') {
      updatePreferences({ [key]: !preferences[key] });
    }
  }, [preferences, updatePreferences]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    togglePreference
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Add keyboard navigation indicators
      document.body.classList.add('keyboard-navigation-active');
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation-active');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enabled]);
};

// Hook for focus management
export const useFocusManagement = () => {
  const focusElement = useCallback((selector: string, delay: number = 0) => {
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, delay);
  }, []);

  const trapFocus = useCallback((containerSelector: string) => {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) return () => {};

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    focusElement,
    trapFocus
  };
};
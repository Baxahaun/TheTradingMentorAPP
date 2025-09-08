import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindFriendly: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    focusIndicators: true,
    colorBlindFriendly: false,
  });

  // Load accessibility settings from localStorage
  useEffect(() => {
    if (user) {
      const savedSettings = localStorage.getItem(`accessibility_${user.uid}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('Error loading accessibility settings:', error);
        }
      }
    }
  }, [user]);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // Large text mode
    if (settings.largeText) {
      root.classList.add('accessibility-large-text');
    } else {
      root.classList.remove('accessibility-large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('accessibility-reduced-motion');
    } else {
      root.classList.remove('accessibility-reduced-motion');
    }

    // Color blind friendly
    if (settings.colorBlindFriendly) {
      root.classList.add('accessibility-color-blind-friendly');
    } else {
      root.classList.remove('accessibility-color-blind-friendly');
    }

    // Enhanced focus indicators
    if (settings.focusIndicators) {
      root.classList.add('accessibility-enhanced-focus');
    } else {
      root.classList.remove('accessibility-enhanced-focus');
    }
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage
    if (user) {
      localStorage.setItem(`accessibility_${user.uid}`, JSON.stringify(newSettings));
    }
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, announceToScreenReader }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Accessibility Settings Panel Component
export function AccessibilitySettingsPanel() {
  const { settings, updateSetting } = useAccessibility();

  const settingsConfig = [
    {
      key: 'highContrast' as const,
      label: 'High Contrast Mode',
      description: 'Increases contrast for better visibility'
    },
    {
      key: 'largeText' as const,
      label: 'Large Text',
      description: 'Increases font size throughout the application'
    },
    {
      key: 'reducedMotion' as const,
      label: 'Reduced Motion',
      description: 'Reduces animations and transitions'
    },
    {
      key: 'screenReaderOptimized' as const,
      label: 'Screen Reader Optimization',
      description: 'Optimizes interface for screen readers'
    },
    {
      key: 'keyboardNavigation' as const,
      label: 'Enhanced Keyboard Navigation',
      description: 'Improves keyboard navigation support'
    },
    {
      key: 'focusIndicators' as const,
      label: 'Enhanced Focus Indicators',
      description: 'Makes focus indicators more visible'
    },
    {
      key: 'colorBlindFriendly' as const,
      label: 'Color Blind Friendly',
      description: 'Uses patterns and shapes in addition to colors'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Accessibility Settings
      </h3>
      
      <div className="space-y-4">
        {settingsConfig.map((config) => (
          <div key={config.key} className="flex items-start space-x-3">
            <input
              type="checkbox"
              id={config.key}
              checked={settings[config.key]}
              onChange={(e) => updateSetting(config.key, e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label 
                htmlFor={config.key}
                className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
              >
                {config.label}
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {config.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Keyboard Navigation Hook
export function useKeyboardNavigation() {
  const { settings } = useAccessibility();

  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close modals
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]');
        const lastModal = modals[modals.length - 1];
        if (lastModal) {
          const closeButton = lastModal.querySelector('[data-close-modal]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      }

      // Tab navigation enhancement
      if (event.key === 'Tab') {
        // Add visual indication for tab navigation
        document.body.classList.add('keyboard-navigation-active');
      }
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
  }, [settings.keyboardNavigation]);
}

// Screen Reader Announcements Hook
export function useScreenReaderAnnouncements() {
  const { announceToScreenReader, settings } = useAccessibility();

  const announceJournalSave = () => {
    if (settings.screenReaderOptimized) {
      announceToScreenReader('Journal entry saved successfully');
    }
  };

  const announceJournalLoad = () => {
    if (settings.screenReaderOptimized) {
      announceToScreenReader('Journal entry loaded');
    }
  };

  const announceTemplateApplied = (templateName: string) => {
    if (settings.screenReaderOptimized) {
      announceToScreenReader(`Template "${templateName}" applied to journal entry`);
    }
  };

  const announceTradeAdded = () => {
    if (settings.screenReaderOptimized) {
      announceToScreenReader('Trade reference added to journal');
    }
  };

  const announceError = (error: string) => {
    if (settings.screenReaderOptimized) {
      announceToScreenReader(`Error: ${error}`);
    }
  };

  return {
    announceJournalSave,
    announceJournalLoad,
    announceTemplateApplied,
    announceTradeAdded,
    announceError
  };
}

// Focus Management Hook
export function useFocusManagement() {
  const { settings } = useAccessibility();

  const focusElement = (selector: string) => {
    if (!settings.keyboardNavigation) return;
    
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 100);
  };

  const trapFocus = (containerSelector: string) => {
    if (!settings.keyboardNavigation) return () => {};

    const container = document.querySelector(containerSelector);
    if (!container) return () => {};

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  return { focusElement, trapFocus };
}
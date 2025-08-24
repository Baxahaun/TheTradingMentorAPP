import React, { createContext, useContext, ReactNode } from 'react';
import { useAccessibility, useKeyboardNavigation, AccessibilityPreferences } from '../../hooks/useAccessibility';

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  isLoading: boolean;
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => void;
  togglePreference: (key: keyof AccessibilityPreferences) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const accessibility = useAccessibility();
  
  // Enable keyboard navigation
  useKeyboardNavigation(accessibility.preferences.keyboardNavigation);

  return (
    <AccessibilityContext.Provider value={accessibility}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibilityContext = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
};
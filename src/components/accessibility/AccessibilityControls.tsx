import React, { useState } from 'react';
import { useAccessibilityContext } from './AccessibilityProvider';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Settings,
  Eye,
  Zap,
  Type,
  Keyboard,
  X,
  Check
} from 'lucide-react';

interface AccessibilityControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
  isOpen,
  onClose
}) => {
  const { preferences, updatePreferences, togglePreference } = useAccessibilityContext();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-labelledby="accessibility-title"
      aria-describedby="accessibility-description"
    >
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle id="accessibility-title" className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Accessibility Settings
            </CardTitle>
            <p id="accessibility-description" className="text-sm text-gray-600 mt-1">
              Customize your experience for better accessibility
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close accessibility settings"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* High Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-600" />
                <label htmlFor="high-contrast" className="font-medium">
                  High Contrast Mode
                </label>
              </div>
              <Button
                id="high-contrast"
                variant={preferences.highContrast ? "default" : "outline"}
                size="sm"
                onClick={() => togglePreference('highContrast')}
                aria-pressed={preferences.highContrast}
                className="flex items-center gap-2"
              >
                {preferences.highContrast ? (
                  <>
                    <Check className="w-3 h-3" />
                    On
                  </>
                ) : (
                  'Off'
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Increases contrast for better visibility
            </p>
          </div>

          {/* Reduced Motion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-600" />
                <label htmlFor="reduced-motion" className="font-medium">
                  Reduced Motion
                </label>
              </div>
              <Button
                id="reduced-motion"
                variant={preferences.reducedMotion ? "default" : "outline"}
                size="sm"
                onClick={() => togglePreference('reducedMotion')}
                aria-pressed={preferences.reducedMotion}
                className="flex items-center gap-2"
              >
                {preferences.reducedMotion ? (
                  <>
                    <Check className="w-3 h-3" />
                    On
                  </>
                ) : (
                  'Off'
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Reduces animations and transitions
            </p>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-gray-600" />
              <label className="font-medium">Font Size</label>
            </div>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <Button
                  key={size}
                  variant={preferences.fontSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreferences({ fontSize: size })}
                  className="flex-1 capitalize"
                  aria-pressed={preferences.fontSize === size}
                >
                  {size}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Adjust text size for better readability
            </p>
          </div>

          {/* Keyboard Navigation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-gray-600" />
                <label htmlFor="keyboard-nav" className="font-medium">
                  Keyboard Navigation
                </label>
              </div>
              <Button
                id="keyboard-nav"
                variant={preferences.keyboardNavigation ? "default" : "outline"}
                size="sm"
                onClick={() => togglePreference('keyboardNavigation')}
                aria-pressed={preferences.keyboardNavigation}
                className="flex items-center gap-2"
              >
                {preferences.keyboardNavigation ? (
                  <>
                    <Check className="w-3 h-3" />
                    On
                  </>
                ) : (
                  'Off'
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Enhanced keyboard navigation support
            </p>
          </div>

          {/* Current Settings Summary */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium mb-2">Active Settings</h4>
            <div className="flex flex-wrap gap-2">
              {preferences.highContrast && (
                <Badge variant="secondary">High Contrast</Badge>
              )}
              {preferences.reducedMotion && (
                <Badge variant="secondary">Reduced Motion</Badge>
              )}
              <Badge variant="outline">Font: {preferences.fontSize}</Badge>
              {preferences.keyboardNavigation && (
                <Badge variant="secondary">Keyboard Nav</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Floating accessibility button
export const AccessibilityButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 shadow-lg"
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <Settings className="w-5 h-5" />
      </Button>
      
      <AccessibilityControls
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
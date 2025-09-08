/**
 * EmotionScale Component
 * 
 * A rating scale component for tracking emotional metrics on a 1-5 scale.
 * Supports different colors, inverted scales, and visual feedback.
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Star, Circle, Heart, Brain, Zap } from 'lucide-react';

interface EmotionScaleProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  description?: string;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'indigo';
  inverted?: boolean; // For metrics where lower is better (e.g., anxiety)
  icon?: 'star' | 'circle' | 'heart' | 'brain' | 'zap';
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  className?: string;
}

export const EmotionScale: React.FC<EmotionScaleProps> = ({
  label,
  value,
  onChange,
  readOnly = false,
  description,
  color = 'blue',
  inverted = false,
  icon = 'circle',
  size = 'medium',
  showLabels = true,
  className = ''
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // Color configurations
  const colorConfig = {
    blue: {
      filled: 'text-blue-500 bg-blue-100',
      empty: 'text-gray-300 hover:text-blue-300',
      border: 'border-blue-200',
      bg: 'bg-blue-50'
    },
    green: {
      filled: 'text-green-500 bg-green-100',
      empty: 'text-gray-300 hover:text-green-300',
      border: 'border-green-200',
      bg: 'bg-green-50'
    },
    red: {
      filled: 'text-red-500 bg-red-100',
      empty: 'text-gray-300 hover:text-red-300',
      border: 'border-red-200',
      bg: 'bg-red-50'
    },
    orange: {
      filled: 'text-orange-500 bg-orange-100',
      empty: 'text-gray-300 hover:text-orange-300',
      border: 'border-orange-200',
      bg: 'bg-orange-50'
    },
    purple: {
      filled: 'text-purple-500 bg-purple-100',
      empty: 'text-gray-300 hover:text-purple-300',
      border: 'border-purple-200',
      bg: 'bg-purple-50'
    },
    indigo: {
      filled: 'text-indigo-500 bg-indigo-100',
      empty: 'text-gray-300 hover:text-indigo-300',
      border: 'border-indigo-200',
      bg: 'bg-indigo-50'
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      icon: 'w-4 h-4',
      container: 'p-1',
      text: 'text-xs',
      gap: 'gap-1'
    },
    medium: {
      icon: 'w-5 h-5',
      container: 'p-1.5',
      text: 'text-sm',
      gap: 'gap-2'
    },
    large: {
      icon: 'w-6 h-6',
      container: 'p-2',
      text: 'text-base',
      gap: 'gap-3'
    }
  };

  // Icon components
  const iconComponents = {
    star: Star,
    circle: Circle,
    heart: Heart,
    brain: Brain,
    zap: Zap
  };

  const IconComponent = iconComponents[icon];
  const colors = colorConfig[color];
  const sizes = sizeConfig[size];

  // Scale labels
  const getScaleLabels = () => {
    if (inverted) {
      return ['Very High', 'High', 'Moderate', 'Low', 'Very Low'];
    }
    return ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
  };

  const scaleLabels = getScaleLabels();

  // Handle click on scale item
  const handleClick = (scaleValue: number) => {
    if (!readOnly) {
      onChange(scaleValue);
    }
  };

  // Get display value (for inverted scales)
  const getDisplayValue = (scaleValue: number) => {
    return inverted ? 6 - scaleValue : scaleValue;
  };

  // Get current effective value for display
  const currentValue = hoverValue !== null ? hoverValue : value;

  // Render scale description
  const renderDescription = () => {
    if (!description) return null;
    
    return (
      <p className={cn('text-gray-600 mt-1', sizes.text)}>
        {description}
      </p>
    );
  };

  // Render scale labels
  const renderLabels = () => {
    if (!showLabels) return null;

    return (
      <div className="flex justify-between mt-2">
        <span className={cn('text-gray-500', sizes.text)}>
          {scaleLabels[0]}
        </span>
        <span className={cn('text-gray-500', sizes.text)}>
          {scaleLabels[4]}
        </span>
      </div>
    );
  };

  // Render current value indicator
  const renderValueIndicator = () => {
    if (value === 0) return null;

    const displayValue = getDisplayValue(value);
    const labelIndex = Math.max(0, Math.min(4, displayValue - 1));
    
    return (
      <div className="flex items-center justify-between mt-2">
        <span className={cn('font-medium', colors.filled.split(' ')[0], sizes.text)}>
          Current: {scaleLabels[labelIndex]}
        </span>
        <span className={cn('text-gray-500', sizes.text)}>
          {displayValue}/5
        </span>
      </div>
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className={cn('font-medium text-gray-900', sizes.text)}>
          {label}
        </label>
        {value > 0 && (
          <span className={cn('text-gray-500', sizes.text)}>
            {getDisplayValue(value)}/5
          </span>
        )}
      </div>

      {/* Description */}
      {renderDescription()}

      {/* Scale */}
      <div 
        className={cn(
          'flex items-center justify-center rounded-lg border p-3',
          colors.border,
          colors.bg,
          sizes.gap
        )}
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((scaleValue) => {
          const isActive = currentValue >= scaleValue;
          const displayValue = getDisplayValue(scaleValue);
          
          return (
            <button
              key={scaleValue}
              type="button"
              onClick={() => handleClick(scaleValue)}
              onMouseEnter={() => !readOnly && setHoverValue(scaleValue)}
              disabled={readOnly}
              className={cn(
                'rounded-full transition-all duration-200 flex items-center justify-center',
                sizes.container,
                isActive ? colors.filled : colors.empty,
                !readOnly && 'hover:scale-110 cursor-pointer',
                readOnly && 'cursor-default'
              )}
              title={`${label}: ${scaleLabels[displayValue - 1]} (${displayValue}/5)`}
            >
              <IconComponent 
                className={cn(
                  sizes.icon,
                  isActive && icon === 'star' ? 'fill-current' : ''
                )} 
              />
            </button>
          );
        })}
      </div>

      {/* Labels */}
      {renderLabels()}

      {/* Current value indicator */}
      {renderValueIndicator()}
    </div>
  );
};

export default EmotionScale;
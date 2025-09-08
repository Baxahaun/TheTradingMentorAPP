/**
 * MoodSelector Component
 * 
 * A visual mood selector component for choosing emotional states.
 * Displays mood options with emojis and colors for intuitive selection.
 */

import React from 'react';
import { EmotionalMood } from '../../types/journal';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

interface MoodOption {
  mood: EmotionalMood;
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

interface MoodSelectorProps {
  selectedMood: EmotionalMood;
  onMoodChange: (mood: EmotionalMood) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'grid' | 'horizontal' | 'vertical';
  showLabels?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onMoodChange,
  readOnly = false,
  size = 'medium',
  layout = 'grid',
  showLabels = true,
  showDescriptions = false,
  className = ''
}) => {
  // Mood options with visual representations
  const moodOptions: MoodOption[] = [
    {
      mood: 'excited',
      emoji: '🚀',
      label: 'Excited',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 border-yellow-300',
      description: 'Energetic and enthusiastic about trading'
    },
    {
      mood: 'confident',
      emoji: '💪',
      label: 'Confident',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 border-blue-300',
      description: 'Self-assured and ready to execute'
    },
    {
      mood: 'calm',
      emoji: '😌',
      label: 'Calm',
      color: 'text-green-600',
      bgColor: 'bg-green-100 border-green-300',
      description: 'Peaceful and composed'
    },
    {
      mood: 'optimistic',
      emoji: '☀️',
      label: 'Optimistic',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 border-orange-300',
      description: 'Positive outlook on market opportunities'
    },
    {
      mood: 'neutral',
      emoji: '😐',
      label: 'Neutral',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 border-gray-300',
      description: 'Balanced emotional state'
    },
    {
      mood: 'nervous',
      emoji: '😰',
      label: 'Nervous',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-400',
      description: 'Anxious about market conditions'
    },
    {
      mood: 'frustrated',
      emoji: '😤',
      label: 'Frustrated',
      color: 'text-red-600',
      bgColor: 'bg-red-100 border-red-300',
      description: 'Annoyed with trading outcomes'
    },
    {
      mood: 'disappointed',
      emoji: '😞',
      label: 'Disappointed',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 border-purple-300',
      description: 'Let down by results or performance'
    },
    {
      mood: 'anxious',
      emoji: '😟',
      label: 'Anxious',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border-orange-400',
      description: 'Worried about potential losses'
    },
    {
      mood: 'satisfied',
      emoji: '😊',
      label: 'Satisfied',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-400',
      description: 'Content with trading performance'
    }
  ];

  // Size configurations
  const sizeConfig = {
    small: {
      emoji: 'text-lg',
      container: 'p-2 min-w-[60px]',
      label: 'text-xs',
      grid: 'grid-cols-5 gap-2'
    },
    medium: {
      emoji: 'text-2xl',
      container: 'p-3 min-w-[80px]',
      label: 'text-sm',
      grid: 'grid-cols-4 gap-3'
    },
    large: {
      emoji: 'text-3xl',
      container: 'p-4 min-w-[100px]',
      label: 'text-base',
      grid: 'grid-cols-3 gap-4'
    }
  };

  // Layout configurations
  const layoutConfig = {
    grid: sizeConfig[size].grid,
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2'
  };

  const sizes = sizeConfig[size];
  const layoutClass = layoutConfig[layout];

  // Handle mood selection
  const handleMoodSelect = (mood: EmotionalMood) => {
    if (!readOnly) {
      onMoodChange(mood);
    }
  };

  // Render mood option
  const renderMoodOption = (option: MoodOption) => {
    const isSelected = selectedMood === option.mood;
    
    return (
      <button
        key={option.mood}
        type="button"
        onClick={() => handleMoodSelect(option.mood)}
        disabled={readOnly}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200',
          sizes.container,
          isSelected 
            ? cn(option.bgColor, 'ring-2 ring-offset-2', option.color.replace('text-', 'ring-'))
            : 'bg-white border-gray-200 hover:border-gray-300',
          !readOnly && 'hover:scale-105 cursor-pointer',
          readOnly && 'cursor-default opacity-75'
        )}
        title={showDescriptions ? option.description : option.label}
      >
        <span className={cn('mb-1', sizes.emoji)}>
          {option.emoji}
        </span>
        {showLabels && (
          <span className={cn(
            'font-medium text-center leading-tight',
            sizes.label,
            isSelected ? option.color : 'text-gray-600'
          )}>
            {option.label}
          </span>
        )}
      </button>
    );
  };

  // Render selected mood badge
  const renderSelectedMoodBadge = () => {
    if (!selectedMood) return null;
    
    const selectedOption = moodOptions.find(option => option.mood === selectedMood);
    if (!selectedOption) return null;

    return (
      <div className="flex items-center justify-center mt-3">
        <Badge 
          variant="outline" 
          className={cn(
            'px-3 py-1 text-sm font-medium',
            selectedOption.bgColor,
            selectedOption.color
          )}
        >
          <span className="mr-2">{selectedOption.emoji}</span>
          Current mood: {selectedOption.label}
        </Badge>
      </div>
    );
  };

  // Render mood descriptions
  const renderMoodDescriptions = () => {
    if (!showDescriptions) return null;

    const selectedOption = moodOptions.find(option => option.mood === selectedMood);
    if (!selectedOption) return null;

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{selectedOption.label}:</span> {selectedOption.description}
        </p>
      </div>
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Mood options */}
      <div className={cn(layoutClass)}>
        {moodOptions.map(renderMoodOption)}
      </div>

      {/* Selected mood badge */}
      {renderSelectedMoodBadge()}

      {/* Mood descriptions */}
      {renderMoodDescriptions()}
    </div>
  );
};

export default MoodSelector;
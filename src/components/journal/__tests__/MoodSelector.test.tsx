/**
 * MoodSelector Component Tests
 * 
 * Tests for the mood selection component functionality.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoodSelector } from '../MoodSelector';
import { EmotionalMood } from '../../../types/journal';

import { vi } from 'vitest';

// Mock the utils and UI components
vi.mock('../../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

vi.mock('../../ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span className={className} data-testid="badge">{children}</span>
  )
}));

describe('MoodSelector', () => {
  const mockOnMoodChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all mood options', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      // Should render all 10 mood options
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);

      // Check for specific mood labels
      expect(screen.getByText('Excited')).toBeInTheDocument();
      expect(screen.getByText('Confident')).toBeInTheDocument();
      expect(screen.getByText('Calm')).toBeInTheDocument();
      expect(screen.getByText('Neutral')).toBeInTheDocument();
      expect(screen.getByText('Frustrated')).toBeInTheDocument();
    });

    it('displays mood emojis correctly', () => {
      render(
        <MoodSelector
          selectedMood="excited"
          onMoodChange={mockOnMoodChange}
        />
      );

      // Check for emoji presence (we can't easily test specific emojis, 
      // but we can verify the structure)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const emoji = button.querySelector('span');
        expect(emoji).toBeInTheDocument();
      });
    });

    it('highlights selected mood correctly', () => {
      render(
        <MoodSelector
          selectedMood="confident"
          onMoodChange={mockOnMoodChange}
        />
      );

      const confidentButton = screen.getByRole('button', { name: /confident/i });
      expect(confidentButton).toHaveClass('bg-blue-100');
      expect(confidentButton).toHaveClass('ring-2');
    });
  });

  describe('Mood Selection', () => {
    it('calls onMoodChange when mood is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      await user.click(excitedButton);

      expect(mockOnMoodChange).toHaveBeenCalledWith('excited');
    });

    it('updates selection visually when different mood is clicked', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      const calmButton = screen.getByRole('button', { name: /calm/i });
      await user.click(calmButton);

      expect(mockOnMoodChange).toHaveBeenCalledWith('calm');

      // Simulate parent component updating the selectedMood prop
      rerender(
        <MoodSelector
          selectedMood="calm"
          onMoodChange={mockOnMoodChange}
        />
      );

      expect(calmButton).toHaveClass('bg-green-100');
      expect(calmButton).toHaveClass('ring-2');
    });
  });

  describe('Size Variants', () => {
    it('applies correct classes for small size', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          size="small"
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('p-2');
      expect(buttons[0]).toHaveClass('min-w-[60px]');
    });

    it('applies correct classes for large size', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          size="large"
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('p-4');
      expect(buttons[0]).toHaveClass('min-w-[100px]');
    });
  });

  describe('Layout Variants', () => {
    it('applies grid layout by default', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      const container = screen.getAllByRole('button')[0].parentElement;
      expect(container).toHaveClass('grid-cols-4');
    });

    it('applies horizontal layout when specified', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          layout="horizontal"
        />
      );

      const container = screen.getAllByRole('button')[0].parentElement;
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('flex-wrap');
    });

    it('applies vertical layout when specified', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          layout="vertical"
        />
      );

      const container = screen.getAllByRole('button')[0].parentElement;
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('flex-col');
    });
  });

  describe('Labels and Descriptions', () => {
    it('shows labels by default', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      expect(screen.getByText('Excited')).toBeInTheDocument();
      expect(screen.getByText('Confident')).toBeInTheDocument();
    });

    it('hides labels when showLabels is false', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          showLabels={false}
        />
      );

      expect(screen.queryByText('Excited')).not.toBeInTheDocument();
      expect(screen.queryByText('Confident')).not.toBeInTheDocument();
    });

    it('shows selected mood badge', () => {
      render(
        <MoodSelector
          selectedMood="confident"
          onMoodChange={mockOnMoodChange}
        />
      );

      expect(screen.getByText(/Current mood: Confident/)).toBeInTheDocument();
    });

    it('does not show badge when no mood is selected', () => {
      render(
        <MoodSelector
          selectedMood={'' as EmotionalMood}
          onMoodChange={mockOnMoodChange}
        />
      );

      expect(screen.queryByText(/Current mood:/)).not.toBeInTheDocument();
    });

    it('shows mood descriptions when enabled', () => {
      render(
        <MoodSelector
          selectedMood="confident"
          onMoodChange={mockOnMoodChange}
          showDescriptions={true}
        />
      );

      expect(screen.getByText(/Self-assured and ready to execute/)).toBeInTheDocument();
    });
  });

  describe('Read-Only Mode', () => {
    it('disables all buttons when readOnly is true', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          readOnly={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('does not call onMoodChange when readOnly and button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          readOnly={true}
        />
      );

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      await user.click(excitedButton);

      expect(mockOnMoodChange).not.toHaveBeenCalled();
    });

    it('applies read-only styling', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          readOnly={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('cursor-default');
        expect(button).toHaveClass('opacity-75');
      });
    });
  });

  describe('Tooltips and Accessibility', () => {
    it('provides tooltips with mood descriptions by default', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      expect(excitedButton).toHaveAttribute('title', 'Energetic and enthusiastic about trading');

      const calmButton = screen.getByRole('button', { name: /calm/i });
      expect(calmButton).toHaveAttribute('title', 'Peaceful and composed');
    });

    it('shows mood labels in tooltips when descriptions are enabled', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
          showDescriptions={true}
        />
      );

      const confidentButton = screen.getByRole('button', { name: /confident/i });
      expect(confidentButton).toHaveAttribute('title', 'Self-assured and ready to execute');
    });

    it('has proper button type attributes', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Mood Options Coverage', () => {
    it('includes all expected mood options', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      const expectedMoods = [
        'Excited', 'Confident', 'Calm', 'Optimistic', 'Neutral',
        'Nervous', 'Frustrated', 'Disappointed', 'Anxious', 'Satisfied'
      ];

      expectedMoods.forEach(mood => {
        expect(screen.getByText(mood)).toBeInTheDocument();
      });
    });

    it('handles all mood types correctly', async () => {
      const user = userEvent.setup();
      const moods: EmotionalMood[] = [
        'excited', 'confident', 'calm', 'optimistic', 'neutral',
        'nervous', 'frustrated', 'disappointed', 'anxious', 'satisfied'
      ];

      for (const mood of moods) {
        const { rerender } = render(
          <MoodSelector
            selectedMood="neutral"
            onMoodChange={mockOnMoodChange}
          />
        );

        const moodButton = screen.getByRole('button', { 
          name: new RegExp(mood, 'i') 
        });
        await user.click(moodButton);

        expect(mockOnMoodChange).toHaveBeenCalledWith(mood);

        // Test visual selection
        rerender(
          <MoodSelector
            selectedMood={mood}
            onMoodChange={mockOnMoodChange}
          />
        );

        expect(moodButton).toHaveClass('ring-2');
        
        mockOnMoodChange.mockClear();
      }
    });
  });

  describe('Visual Styling', () => {
    it('applies correct color classes for different moods', () => {
      render(
        <MoodSelector
          selectedMood="excited"
          onMoodChange={mockOnMoodChange}
        />
      );

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      expect(excitedButton).toHaveClass('bg-yellow-100');
      expect(excitedButton).toHaveClass('border-yellow-300');
    });

    it('shows hover effects on non-selected buttons', () => {
      render(
        <MoodSelector
          selectedMood="calm"
          onMoodChange={mockOnMoodChange}
        />
      );

      const excitedButton = screen.getByRole('button', { name: /excited/i });
      expect(excitedButton).toHaveClass('hover:border-gray-300');
      expect(excitedButton).toHaveClass('hover:scale-105');
    });

    it('applies scale animation classes', () => {
      render(
        <MoodSelector
          selectedMood="neutral"
          onMoodChange={mockOnMoodChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-all');
        expect(button).toHaveClass('duration-200');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined selectedMood gracefully', () => {
      render(
        <MoodSelector
          selectedMood={undefined as any}
          onMoodChange={mockOnMoodChange}
        />
      );

      // Should render without crashing
      expect(screen.getAllByRole('button')).toHaveLength(10);
    });

    it('handles empty string selectedMood', () => {
      render(
        <MoodSelector
          selectedMood={'' as EmotionalMood}
          onMoodChange={mockOnMoodChange}
        />
      );

      // No button should be selected
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('ring-2');
      });
    });

    it('handles invalid selectedMood gracefully', () => {
      render(
        <MoodSelector
          selectedMood={'invalid-mood' as EmotionalMood}
          onMoodChange={mockOnMoodChange}
        />
      );

      // Should render without crashing
      expect(screen.getAllByRole('button')).toHaveLength(10);
    });
  });
});
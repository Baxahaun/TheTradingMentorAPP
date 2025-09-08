/**
 * EmotionScale Component Tests
 * 
 * Tests for the emotion rating scale component functionality.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmotionScale } from '../EmotionScale';

import { vi } from 'vitest';

// Mock the utils
vi.mock('../../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('EmotionScale', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with label and description', () => {
      render(
        <EmotionScale
          label="Confidence Level"
          value={3}
          onChange={mockOnChange}
          description="How confident do you feel?"
        />
      );

      expect(screen.getByText('Confidence Level')).toBeInTheDocument();
      expect(screen.getByText('How confident do you feel?')).toBeInTheDocument();
    });

    it('displays current value correctly', () => {
      render(
        <EmotionScale
          label="Confidence Level"
          value={4}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('4/5')).toBeInTheDocument();
    });

    it('renders all 5 scale buttons', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={0}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });
  });

  describe('Value Selection', () => {
    it('calls onChange when scale button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionScale
          label="Test Scale"
          value={0}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[2]); // Click third button (value 3)

      expect(mockOnChange).toHaveBeenCalledWith(3);
    });

    it('highlights selected value correctly', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          color="blue"
        />
      );

      const buttons = screen.getAllByRole('button');
      
      // First 3 buttons should be active (filled)
      expect(buttons[0]).toHaveClass('text-blue-500');
      expect(buttons[1]).toHaveClass('text-blue-500');
      expect(buttons[2]).toHaveClass('text-blue-500');
      
      // Last 2 buttons should be inactive (empty)
      expect(buttons[3]).toHaveClass('text-gray-300');
      expect(buttons[4]).toHaveClass('text-gray-300');
    });

    it('shows hover effect on mouse enter', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionScale
          label="Test Scale"
          value={2}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      await user.hover(buttons[3]); // Hover over 4th button

      // Should show hover state up to hovered button
      expect(buttons[0]).toHaveClass('text-blue-500');
      expect(buttons[1]).toHaveClass('text-blue-500');
      expect(buttons[2]).toHaveClass('text-blue-500');
      expect(buttons[3]).toHaveClass('text-blue-500');
    });
  });

  describe('Color Variants', () => {
    it('applies correct color classes for different colors', () => {
      const { rerender } = render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          color="green"
        />
      );

      let buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('text-green-500');

      rerender(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          color="red"
        />
      );

      buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('text-red-500');
    });
  });

  describe('Inverted Scale', () => {
    it('shows inverted labels when inverted prop is true', () => {
      render(
        <EmotionScale
          label="Anxiety Level"
          value={3}
          onChange={mockOnChange}
          inverted={true}
          showLabels={true}
        />
      );

      expect(screen.getByText('Very High')).toBeInTheDocument();
      expect(screen.getByText('Very Low')).toBeInTheDocument();
    });

    it('displays inverted value correctly', () => {
      render(
        <EmotionScale
          label="Anxiety Level"
          value={2}
          onChange={mockOnChange}
          inverted={true}
        />
      );

      // For inverted scale, value 2 should display as 4 (6-2)
      expect(screen.getByText('4/5')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies correct size classes for small size', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          size="small"
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('p-1');
    });

    it('applies correct size classes for large size', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          size="large"
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('p-2');
    });
  });

  describe('Icon Variants', () => {
    it('renders star icons when icon prop is star', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          icon="star"
        />
      );

      // Star icons should have fill-current class when active
      const buttons = screen.getAllByRole('button');
      const starIcon = buttons[0].querySelector('svg');
      expect(starIcon).toHaveClass('fill-current');
    });

    it('renders different icons based on icon prop', () => {
      const { rerender } = render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          icon="heart"
        />
      );

      // Should render heart icon (we can't easily test the specific icon, 
      // but we can verify the component renders without error)
      expect(screen.getAllByRole('button')).toHaveLength(5);

      rerender(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          icon="brain"
        />
      );

      expect(screen.getAllByRole('button')).toHaveLength(5);
    });
  });

  describe('Read-Only Mode', () => {
    it('disables buttons when readOnly is true', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          readOnly={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('does not call onChange when readOnly and button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionScale
          label="Test Scale"
          value={2}
          onChange={mockOnChange}
          readOnly={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[3]);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not show hover effects when readOnly', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={2}
          onChange={mockOnChange}
          readOnly={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('cursor-default');
      expect(buttons[0]).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Labels and Descriptions', () => {
    it('shows scale labels when showLabels is true', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          showLabels={true}
        />
      );

      expect(screen.getByText('Very Low')).toBeInTheDocument();
      expect(screen.getByText('Very High')).toBeInTheDocument();
    });

    it('hides scale labels when showLabels is false', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
          showLabels={false}
        />
      );

      expect(screen.queryByText('Very Low')).not.toBeInTheDocument();
      expect(screen.queryByText('Very High')).not.toBeInTheDocument();
    });

    it('shows current value indicator with correct label', () => {
      render(
        <EmotionScale
          label="Confidence"
          value={4}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/Current: High/)).toBeInTheDocument();
    });

    it('does not show current value indicator when value is 0', () => {
      render(
        <EmotionScale
          label="Confidence"
          value={0}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText(/Current:/)).not.toBeInTheDocument();
    });
  });

  describe('Tooltips and Accessibility', () => {
    it('provides tooltips with scale information', () => {
      render(
        <EmotionScale
          label="Confidence Level"
          value={3}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('title', 'Confidence Level: Very Low (1/5)');
      expect(buttons[4]).toHaveAttribute('title', 'Confidence Level: Very High (5/5)');
    });

    it('has proper button type attributes', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={3}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Mouse Interactions', () => {
    it('resets hover state on mouse leave', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionScale
          label="Test Scale"
          value={2}
          onChange={mockOnChange}
        />
      );

      const container = screen.getByRole('button').closest('div');
      const buttons = screen.getAllByRole('button');

      // Hover over a button
      await user.hover(buttons[3]);
      
      // Mouse leave the container
      if (container) {
        fireEvent.mouseLeave(container);
      }

      // Should return to original state (value 2)
      expect(buttons[0]).toHaveClass('text-blue-500');
      expect(buttons[1]).toHaveClass('text-blue-500');
      expect(buttons[2]).toHaveClass('text-gray-300');
    });
  });

  describe('Edge Cases', () => {
    it('handles value of 0 correctly', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={0}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('text-gray-300');
      });
    });

    it('handles maximum value correctly', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={5}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('text-blue-500');
      });
    });

    it('handles values outside range gracefully', () => {
      render(
        <EmotionScale
          label="Test Scale"
          value={10} // Out of range
          onChange={mockOnChange}
        />
      );

      // Should still render without crashing
      expect(screen.getByText('Test Scale')).toBeInTheDocument();
    });
  });
});
/**
 * EmotionalTracker Component Tests
 * 
 * Tests for the emotional state tracking functionality including
 * rating scales, mood selectors, and trend visualization.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmotionalTracker } from '../EmotionalTracker';
import { EmotionalState } from '../../../types/journal';

import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the UI components
vi.mock('../../ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>
}));

vi.mock('../../ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button onClick={() => onClick?.(value)} data-testid={`tab-${value}`}>
      {children}
    </button>
  )
}));

vi.mock('../../ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, readOnly, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      data-testid="textarea"
      {...props}
    />
  )
}));

vi.mock('../../ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span className={className} data-testid="badge">{children}</span>
  )
}));

// Mock sub-components
vi.mock('../EmotionScale', () => ({
  EmotionScale: ({ label, value, onChange, readOnly }: any) => (
    <div data-testid={`emotion-scale-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <label>{label}</label>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange?.(parseInt(e.target.value))}
        disabled={readOnly}
        data-testid={`scale-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
      <span>{value}</span>
    </div>
  )
}));

vi.mock('../MoodSelector', () => ({
  MoodSelector: ({ selectedMood, onMoodChange, readOnly }: any) => (
    <div data-testid="mood-selector">
      <select
        value={selectedMood}
        onChange={(e) => onMoodChange?.(e.target.value)}
        disabled={readOnly}
        data-testid="mood-select"
      >
        <option value="">Select mood</option>
        <option value="excited">Excited</option>
        <option value="confident">Confident</option>
        <option value="calm">Calm</option>
        <option value="nervous">Nervous</option>
        <option value="frustrated">Frustrated</option>
      </select>
    </div>
  )
}));

describe('EmotionalTracker', () => {
  const mockEmotionalState: EmotionalState = {
    preMarket: {
      confidence: 3,
      anxiety: 2,
      focus: 4,
      energy: 3,
      mood: 'calm',
      preparedness: 4,
      notes: 'Feeling prepared for the day',
      timestamp: '2024-01-01T08:00:00Z'
    },
    duringTrading: {
      discipline: 4,
      patience: 3,
      emotionalControl: 4,
      decisionClarity: 3,
      stressManagement: 4,
      notes: 'Staying disciplined',
      emotionalEvents: []
    },
    postMarket: {
      satisfaction: 4,
      learningValue: 5,
      frustrationLevel: 2,
      accomplishment: 4,
      overallMood: 'satisfied',
      notes: 'Good trading day overall',
      timestamp: '2024-01-01T16:00:00Z'
    },
    overallMood: 'confident',
    stressLevel: 2,
    confidenceLevel: 4,
    emotionalNotes: 'Maintained good emotional control throughout the day',
    triggers: []
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all phases when phase is "all"', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="all"
        />
      );

      expect(screen.getByText('Emotional State Tracking')).toBeInTheDocument();
      expect(screen.getByTestId('tab-preMarket')).toBeInTheDocument();
      expect(screen.getByTestId('tab-duringTrading')).toBeInTheDocument();
      expect(screen.getByTestId('tab-postMarket')).toBeInTheDocument();
    });

    it('renders only pre-market phase when specified', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
        />
      );

      expect(screen.getByText('Pre-Market Emotional State')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-scale-confidence-level')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-scale-anxiety-level')).toBeInTheDocument();
    });

    it('renders only during-trading phase when specified', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="duringTrading"
        />
      );

      expect(screen.getByText('During Trading Emotions')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-scale-discipline')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-scale-patience')).toBeInTheDocument();
    });

    it('renders only post-market phase when specified', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="postMarket"
        />
      );

      expect(screen.getByText('Post-Market Reflection')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-scale-satisfaction')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-scale-learning-value')).toBeInTheDocument();
    });
  });

  describe('Pre-Market Emotional Tracking', () => {
    it('displays pre-market emotional scales with correct values', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
        />
      );

      const confidenceScale = screen.getByTestId('scale-confidence-level');
      expect(confidenceScale).toHaveValue('3');

      const anxietyScale = screen.getByTestId('scale-anxiety-level');
      expect(anxietyScale).toHaveValue('2');

      const focusScale = screen.getByTestId('scale-focus-level');
      expect(focusScale).toHaveValue('4');
    });

    it('updates pre-market confidence when scale changes', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
        />
      );

      const confidenceScale = screen.getByTestId('scale-confidence-level');
      await user.clear(confidenceScale);
      await user.type(confidenceScale, '5');

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockEmotionalState,
        preMarket: {
          ...mockEmotionalState.preMarket,
          confidence: 5,
          timestamp: expect.any(String)
        }
      });
    });

    it('updates pre-market mood when mood selector changes', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
        />
      );

      const moodSelect = screen.getByTestId('mood-select');
      await user.selectOptions(moodSelect, 'excited');

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockEmotionalState,
        preMarket: {
          ...mockEmotionalState.preMarket,
          mood: 'excited',
          timestamp: expect.any(String)
        }
      });
    });

    it('updates pre-market notes when textarea changes', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
        />
      );

      const textarea = screen.getByTestId('textarea');
      await user.clear(textarea);
      await user.type(textarea, 'New pre-market notes');

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockEmotionalState,
        preMarket: {
          ...mockEmotionalState.preMarket,
          notes: 'New pre-market notes',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('During Trading Emotional Tracking', () => {
    it('displays during-trading emotional scales with correct values', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="duringTrading"
        />
      );

      const disciplineScale = screen.getByTestId('scale-discipline');
      expect(disciplineScale).toHaveValue('4');

      const patienceScale = screen.getByTestId('scale-patience');
      expect(patienceScale).toHaveValue('3');

      const controlScale = screen.getByTestId('scale-emotional-control');
      expect(controlScale).toHaveValue('4');
    });

    it('updates during-trading discipline when scale changes', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="duringTrading"
        />
      );

      const disciplineScale = screen.getByTestId('scale-discipline');
      await user.clear(disciplineScale);
      await user.type(disciplineScale, '5');

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockEmotionalState,
        duringTrading: {
          ...mockEmotionalState.duringTrading,
          discipline: 5
        }
      });
    });
  });

  describe('Post-Market Emotional Tracking', () => {
    it('displays post-market emotional scales with correct values', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="postMarket"
        />
      );

      const satisfactionScale = screen.getByTestId('scale-satisfaction');
      expect(satisfactionScale).toHaveValue('4');

      const learningScale = screen.getByTestId('scale-learning-value');
      expect(learningScale).toHaveValue('5');
    });

    it('updates post-market satisfaction when scale changes', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="postMarket"
        />
      );

      const satisfactionScale = screen.getByTestId('scale-satisfaction');
      await user.clear(satisfactionScale);
      await user.type(satisfactionScale, '3');

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockEmotionalState,
        postMarket: {
          ...mockEmotionalState.postMarket,
          satisfaction: 3,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('Overall Emotional Summary', () => {
    it('displays overall emotional summary in full mode', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="all"
        />
      );

      expect(screen.getByText('Overall Emotional Summary')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-scale-overall-stress-level')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-scale-overall-confidence')).toBeInTheDocument();
    });

    it('updates overall stress level when scale changes', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="all"
        />
      );

      const stressScale = screen.getByTestId('scale-overall-stress-level');
      await user.clear(stressScale);
      await user.type(stressScale, '1');

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockEmotionalState,
        stressLevel: 1
      });
    });
  });

  describe('Read-Only Mode', () => {
    it('disables all inputs when readOnly is true', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
          readOnly={true}
        />
      );

      const confidenceScale = screen.getByTestId('scale-confidence-level');
      expect(confidenceScale).toBeDisabled();

      const moodSelect = screen.getByTestId('mood-select');
      expect(moodSelect).toBeDisabled();

      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('readOnly');
    });

    it('does not call onChange when readOnly is true', async () => {
      const user = userEvent.setup();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
          readOnly={true}
        />
      );

      const confidenceScale = screen.getByTestId('scale-confidence-level');
      
      // Try to interact with disabled input
      await user.click(confidenceScale);
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Timestamps', () => {
    it('displays timestamps for pre-market and post-market phases', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="all"
        />
      );

      // Check for timestamp badges
      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('updates timestamp when pre-market data changes', async () => {
      const user = userEvent.setup();
      const beforeTime = Date.now();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
        />
      );

      const confidenceScale = screen.getByTestId('scale-confidence-level');
      await user.clear(confidenceScale);
      await user.type(confidenceScale, '5');

      const afterTime = Date.now();
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          preMarket: expect.objectContaining({
            timestamp: expect.any(String)
          })
        })
      );

      // Verify timestamp is recent
      const call = mockOnChange.mock.calls[0][0];
      const timestamp = new Date(call.preMarket.timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form elements', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="preMarket"
        />
      );

      expect(screen.getByText('Confidence Level')).toBeInTheDocument();
      expect(screen.getByText('Anxiety Level')).toBeInTheDocument();
      expect(screen.getByText('Focus Level')).toBeInTheDocument();
      expect(screen.getByText('Overall Mood')).toBeInTheDocument();
    });

    it('provides proper headings structure', () => {
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={mockOnChange}
          phase="all"
        />
      );

      expect(screen.getByRole('heading', { name: /emotional state tracking/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing emotional state gracefully', () => {
      const incompleteState = {
        ...mockEmotionalState,
        preMarket: {
          ...mockEmotionalState.preMarket,
          confidence: 0, // Invalid value
          mood: '' as any // Invalid mood
        }
      };

      expect(() => {
        render(
          <EmotionalTracker
            emotionalState={incompleteState}
            onChange={mockOnChange}
            phase="preMarket"
          />
        );
      }).not.toThrow();
    });

    it('handles onChange callback errors gracefully', async () => {
      const errorOnChange = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const user = userEvent.setup();
      
      render(
        <EmotionalTracker
          emotionalState={mockEmotionalState}
          onChange={errorOnChange}
          phase="preMarket"
        />
      );

      const confidenceScale = screen.getByTestId('scale-confidence-level');
      
      // This should not crash the component
      await user.clear(confidenceScale);
      await user.type(confidenceScale, '5');

      expect(errorOnChange).toHaveBeenCalled();
    });
  });
});
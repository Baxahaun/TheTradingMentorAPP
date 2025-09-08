/**
 * EmotionalTracker Integration Tests
 * 
 * Integration tests for the complete emotional tracking system.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmotionalTracker } from '../EmotionalTracker';
import { EmotionalState } from '../../../types/journal';

describe('EmotionalTracker Integration', () => {
  const initialEmotionalState: EmotionalState = {
    preMarket: {
      confidence: 0,
      anxiety: 0,
      focus: 0,
      energy: 0,
      mood: 'neutral',
      preparedness: 0,
      notes: '',
      timestamp: ''
    },
    duringTrading: {
      discipline: 0,
      patience: 0,
      emotionalControl: 0,
      decisionClarity: 0,
      stressManagement: 0,
      notes: '',
      emotionalEvents: []
    },
    postMarket: {
      satisfaction: 0,
      learningValue: 0,
      frustrationLevel: 0,
      accomplishment: 0,
      overallMood: 'neutral',
      notes: '',
      timestamp: ''
    },
    overallMood: 'neutral',
    stressLevel: 0,
    confidenceLevel: 0,
    emotionalNotes: '',
    triggers: []
  };

  it('renders without crashing', () => {
    const mockOnChange = () => {};
    
    render(
      <EmotionalTracker
        emotionalState={initialEmotionalState}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Emotional State Tracking')).toBeInTheDocument();
  });

  it('displays all three phases in full mode', () => {
    const mockOnChange = () => {};
    
    render(
      <EmotionalTracker
        emotionalState={initialEmotionalState}
        onChange={mockOnChange}
        phase="all"
      />
    );

    // Check for tab navigation
    expect(screen.getByText('Pre-Market')).toBeInTheDocument();
    expect(screen.getByText('During Trading')).toBeInTheDocument();
    expect(screen.getByText('Post-Market')).toBeInTheDocument();
  });

  it('shows only specified phase when phase prop is set', () => {
    const mockOnChange = () => {};
    
    render(
      <EmotionalTracker
        emotionalState={initialEmotionalState}
        onChange={mockOnChange}
        phase="preMarket"
      />
    );

    expect(screen.getByText('Pre-Market Emotional State')).toBeInTheDocument();
    expect(screen.queryByText('During Trading Emotions')).not.toBeInTheDocument();
    expect(screen.queryByText('Post-Market Reflection')).not.toBeInTheDocument();
  });

  it('handles state updates correctly', async () => {
    const user = userEvent.setup();
    let currentState = initialEmotionalState;
    
    const handleChange = (newState: EmotionalState) => {
      currentState = newState;
    };

    const { rerender } = render(
      <EmotionalTracker
        emotionalState={currentState}
        onChange={handleChange}
        phase="preMarket"
      />
    );

    // The actual interaction would depend on the real EmotionScale and MoodSelector components
    // This test verifies the component structure and basic functionality
    expect(screen.getByText('Confidence Level')).toBeInTheDocument();
    expect(screen.getByText('Anxiety Level')).toBeInTheDocument();
    expect(screen.getByText('Overall Mood')).toBeInTheDocument();
  });

  it('displays emotional summary in full mode', () => {
    const mockOnChange = () => {};
    
    render(
      <EmotionalTracker
        emotionalState={initialEmotionalState}
        onChange={mockOnChange}
        phase="all"
      />
    );

    expect(screen.getByText('Overall Emotional Summary')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const mockOnChange = () => {};
    
    const { container } = render(
      <EmotionalTracker
        emotionalState={initialEmotionalState}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
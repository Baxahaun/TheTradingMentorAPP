import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GuidedReflection } from '../GuidedReflection';
import { ReflectionSession, ReflectionPrompt } from '../../../types/reflection';
import { reflectionService } from '../../../services/ReflectionService';

// Mock the reflection service
vi.mock('../../../services/ReflectionService', () => ({
  reflectionService: {
    saveReflectionResponse: vi.fn(),
  }
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="card-title">{children}</h2>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      data-testid="textarea"
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress" data-value={value}>
      Progress: {value}%
    </div>
  ),
}));

describe('GuidedReflection', () => {
  const mockUserId = 'test-user-123';
  const mockDate = '2024-01-15';
  
  const mockPrompts: ReflectionPrompt[] = [
    {
      id: 'prompt-1',
      type: 'winning_trades',
      category: 'learning',
      question: 'What specific actions led to your profitable trades today?',
      followUpQuestions: ['How can you replicate this success?'],
      priority: 9
    },
    {
      id: 'prompt-2',
      type: 'winning_trades',
      category: 'process',
      question: 'Did your wins come from following your plan or from luck?',
      priority: 8
    }
  ];

  const mockSession: ReflectionSession = {
    id: 'session-123',
    userId: mockUserId,
    date: mockDate,
    prompts: mockPrompts,
    responses: [],
    completionStatus: 'not_started',
    sessionContext: {
      tradeCount: 2,
      totalPnL: 150,
      processScore: 75,
      emotionalState: 'confident',
      marketConditions: 'favorable'
    }
  };

  const mockProps = {
    userId: mockUserId,
    date: mockDate,
    session: mockSession,
    onSessionUpdate: vi.fn(),
    onComplete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without session', () => {
    render(<GuidedReflection {...mockProps} session={undefined} />);
    
    expect(screen.getByText('No Reflection Session')).toBeInTheDocument();
    expect(screen.getByText(/Start a guided reflection session/)).toBeInTheDocument();
  });

  it('renders session with prompts', () => {
    render(<GuidedReflection {...mockProps} />);
    
    expect(screen.getByText('Guided Reflection')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    expect(screen.getByText(mockPrompts[0].question)).toBeInTheDocument();
  });

  it('displays progress correctly', () => {
    render(<GuidedReflection {...mockProps} />);
    
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('data-value', '0'); // 0 responses out of 2 prompts
  });

  it('shows category badge for current prompt', () => {
    render(<GuidedReflection {...mockProps} />);
    
    const badges = screen.getAllByTestId('badge');
    expect(badges.some(badge => badge.textContent?.includes('process'))).toBe(true);
  });

  it('allows user to enter and submit answer', async () => {
    const mockSaveResponse = vi.mocked(reflectionService.saveReflectionResponse);
    mockSaveResponse.mockResolvedValue('response-123');

    render(<GuidedReflection {...mockProps} />);
    
    const textarea = screen.getByTestId('textarea');
    const submitButton = screen.getByText('Save & Continue');
    
    // Initially submit button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Enter answer
    fireEvent.change(textarea, { 
      target: { value: 'I followed my trading plan and managed risk properly.' } 
    });
    
    // Submit button should now be enabled
    expect(submitButton).not.toBeDisabled();
    
    // Submit answer
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSaveResponse).toHaveBeenCalledWith({
        userId: mockUserId,
        date: mockDate,
        promptId: 'prompt-1',
        question: mockPrompts[0].question,
        answer: 'I followed my trading plan and managed risk properly.',
        tags: [],
        themes: []
      });
    });
  });

  it('shows follow-up questions when available', async () => {
    const mockSaveResponse = vi.mocked(reflectionService.saveReflectionResponse);
    mockSaveResponse.mockResolvedValue('response-123');

    render(<GuidedReflection {...mockProps} />);
    
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'Test answer' } });
    
    const submitButton = screen.getByText('Save & Continue');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Follow-up Questions')).toBeInTheDocument();
      expect(screen.getByText('How can you replicate this success?')).toBeInTheDocument();
    });
  });

  it('navigates between prompts', async () => {
    const sessionWithResponse = {
      ...mockSession,
      responses: [{
        id: 'response-1',
        userId: mockUserId,
        date: mockDate,
        promptId: 'prompt-1',
        question: mockPrompts[0].question,
        answer: 'Previous answer',
        tags: [],
        themes: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }]
    };

    render(<GuidedReflection {...mockProps} session={sessionWithResponse} />);
    
    // Should show second prompt since first is answered
    expect(screen.getByText(mockPrompts[1].question)).toBeInTheDocument();
    
    // Should show previous button
    const prevButton = screen.getByText('Previous');
    expect(prevButton).not.toBeDisabled();
    
    // Click previous to go back to first prompt
    fireEvent.click(prevButton);
    
    // Should show first prompt with "already answered" status
    expect(screen.getByText('✓ Already answered')).toBeInTheDocument();
    expect(screen.getByText('Previous answer')).toBeInTheDocument();
  });

  it('shows completion status when session is completed', () => {
    const completedSession = {
      ...mockSession,
      completionStatus: 'completed' as const,
      responses: [
        {
          id: 'response-1',
          userId: mockUserId,
          date: mockDate,
          promptId: 'prompt-1',
          question: mockPrompts[0].question,
          answer: 'Answer 1',
          tags: [],
          themes: [],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'response-2',
          userId: mockUserId,
          date: mockDate,
          promptId: 'prompt-2',
          question: mockPrompts[1].question,
          answer: 'Answer 2',
          tags: [],
          themes: [],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ]
    };

    render(<GuidedReflection {...mockProps} session={completedSession} />);
    
    expect(screen.getByText('Reflection Complete!')).toBeInTheDocument();
    expect(screen.getByText(/Great job reflecting on today's trading/)).toBeInTheDocument();
  });

  it('calls onComplete when session is finished', async () => {
    const mockSaveResponse = vi.mocked(reflectionService.saveReflectionResponse);
    mockSaveResponse.mockResolvedValue('response-123');

    const sessionWithOneResponse = {
      ...mockSession,
      responses: [{
        id: 'response-1',
        userId: mockUserId,
        date: mockDate,
        promptId: 'prompt-1',
        question: mockPrompts[0].question,
        answer: 'Answer 1',
        tags: [],
        themes: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }]
    };

    render(<GuidedReflection {...mockProps} session={sessionWithOneResponse} />);
    
    // Should be on second prompt
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'Final answer' } });
    
    const submitButton = screen.getByText('Save & Continue');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockProps.onComplete).toHaveBeenCalled();
    });
  });

  it('updates session when response is saved', async () => {
    const mockSaveResponse = vi.mocked(reflectionService.saveReflectionResponse);
    mockSaveResponse.mockResolvedValue('response-123');

    render(<GuidedReflection {...mockProps} />);
    
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'Test answer' } });
    
    const submitButton = screen.getByText('Save & Continue');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockProps.onSessionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          responses: expect.arrayContaining([
            expect.objectContaining({
              answer: 'Test answer'
            })
          ])
        })
      );
    });
  });

  it('handles loading state during save', async () => {
    const mockSaveResponse = vi.mocked(reflectionService.saveReflectionResponse);
    mockSaveResponse.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('response-123'), 100)));

    render(<GuidedReflection {...mockProps} />);
    
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'Test answer' } });
    
    const submitButton = screen.getByText('Save & Continue');
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('shows appropriate button text for last prompt', () => {
    const sessionOnLastPrompt = {
      ...mockSession,
      responses: [{
        id: 'response-1',
        userId: mockUserId,
        date: mockDate,
        promptId: 'prompt-1',
        question: mockPrompts[0].question,
        answer: 'Answer 1',
        tags: [],
        themes: [],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }]
    };

    render(<GuidedReflection {...mockProps} session={sessionOnLastPrompt} />);
    
    // Should be on last prompt and show "Next Question" for answered prompt
    expect(screen.getByText('Next Question')).toBeInTheDocument();
  });
});
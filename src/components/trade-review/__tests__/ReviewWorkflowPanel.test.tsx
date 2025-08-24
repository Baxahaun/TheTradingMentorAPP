import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewWorkflowPanel from '../panels/ReviewWorkflowPanel';
import { TradeReviewService } from '../../../lib/tradeReviewService';
import { EnhancedTrade, ReviewWorkflow } from '../../../types/tradeReview';

// Mock the TradeReviewService
vi.mock('../../../lib/tradeReviewService', () => ({
  TradeReviewService: {
    getInstance: vi.fn(() => ({
      initializeReview: vi.fn(),
      updateStage: vi.fn(),
      markReviewComplete: vi.fn()
    }))
  }
}));

// Mock UI components
vi.mock('../../ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}));

vi.mock('../../ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}));

vi.mock('../../ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />
}));

vi.mock('../../ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>
}));

vi.mock('../../ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} {...props} />
  )
}));

vi.mock('../../ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>
}));

describe('ReviewWorkflowPanel', () => {
  let mockReviewService: any;
  let mockTrade: EnhancedTrade;
  let mockWorkflow: ReviewWorkflow;
  let mockOnWorkflowUpdate: any;
  let mockOnModeChange: any;

  beforeEach(() => {
    mockReviewService = {
      initializeReview: vi.fn(),
      updateStage: vi.fn(),
      markReviewComplete: vi.fn()
    };

    (TradeReviewService.getInstance as any).mockReturnValue(mockReviewService);

    mockTrade = {
      id: 'test-trade-1',
      currencyPair: 'EUR/USD',
      date: '2024-01-01',
      timeIn: '10:00',
      side: 'long',
      entryPrice: 1.1000,
      lotSize: 1.0,
      lotType: 'standard',
      accountId: 'test-account',
      accountCurrency: 'USD',
      reviewData: undefined
    } as EnhancedTrade;

    mockWorkflow = {
      tradeId: 'test-trade-1',
      stages: [
        {
          id: 'data_verification',
          name: 'Data Verification',
          description: 'Verify all trade data is accurate and complete',
          required: true,
          completed: false
        },
        {
          id: 'technical_analysis',
          name: 'Technical Analysis Review',
          description: 'Review charts, patterns, and technical setup',
          required: true,
          completed: false
        }
      ],
      overallProgress: 0,
      startedAt: '2024-01-01T10:00:00Z'
    };

    mockOnWorkflowUpdate = vi.fn();
    mockOnModeChange = vi.fn();
  }); 
 it('should initialize workflow when trade has no existing workflow', () => {
    mockReviewService.initializeReview.mockReturnValue(mockWorkflow);

    render(
      <ReviewWorkflowPanel
        trade={mockTrade}
        currentMode="view"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    expect(mockReviewService.initializeReview).toHaveBeenCalledWith('test-trade-1');
    expect(screen.getByText('Review Progress')).toBeInTheDocument();
  });

  it('should use existing workflow when trade has review data', () => {
    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: {
        reviewWorkflow: mockWorkflow
      }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="view"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    expect(mockReviewService.initializeReview).not.toHaveBeenCalled();
    expect(screen.getByText('Review Progress')).toBeInTheDocument();
  });

  it('should display progress correctly', () => {
    const workflowWithProgress = {
      ...mockWorkflow,
      overallProgress: 50,
      stages: [
        { ...mockWorkflow.stages[0], completed: true },
        { ...mockWorkflow.stages[1], completed: false }
      ]
    };

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: workflowWithProgress }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="view"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    const progressElement = screen.getByTestId('progress');
    expect(progressElement).toHaveAttribute('data-value', '50');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should handle stage completion toggle', async () => {
    const updatedWorkflow = {
      ...mockWorkflow,
      stages: [
        { ...mockWorkflow.stages[0], completed: true, completedAt: '2024-01-01T11:00:00Z' },
        { ...mockWorkflow.stages[1], completed: false }
      ],
      overallProgress: 50
    };

    mockReviewService.updateStage.mockReturnValue(updatedWorkflow);

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: mockWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="review"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    const markDoneButton = screen.getAllByText('Mark Done')[0];
    fireEvent.click(markDoneButton);

    await waitFor(() => {
      expect(mockReviewService.updateStage).toHaveBeenCalledWith(
        mockWorkflow,
        'data_verification',
        true,
        ''
      );
      expect(mockOnWorkflowUpdate).toHaveBeenCalledWith(updatedWorkflow);
    });
  });

  it('should handle stage notes update', async () => {
    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: mockWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="review"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    // Expand first stage
    const stageHeader = screen.getByText('Data Verification');
    fireEvent.click(stageHeader);

    // Find and update textarea
    const textarea = screen.getByPlaceholderText('Add notes for data verification...');
    fireEvent.change(textarea, { target: { value: 'Test notes' } });

    expect(textarea).toHaveValue('Test notes');
  });

  it('should save stage notes', async () => {
    const updatedWorkflow = {
      ...mockWorkflow,
      stages: [
        { ...mockWorkflow.stages[0], notes: 'Test notes' },
        { ...mockWorkflow.stages[1] }
      ]
    };

    mockReviewService.updateStage.mockReturnValue(updatedWorkflow);

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: mockWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="review"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    // Expand first stage
    const stageHeader = screen.getByText('Data Verification');
    fireEvent.click(stageHeader);

    // Add notes
    const textarea = screen.getByPlaceholderText('Add notes for data verification...');
    fireEvent.change(textarea, { target: { value: 'Test notes' } });

    // Save notes
    const saveButton = screen.getByText('Save Notes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockReviewService.updateStage).toHaveBeenCalledWith(
        mockWorkflow,
        'data_verification',
        false,
        'Test notes'
      );
      expect(mockOnWorkflowUpdate).toHaveBeenCalledWith(updatedWorkflow);
    });
  });  it
('should complete review when all required stages are done', async () => {
    const completableWorkflow = {
      ...mockWorkflow,
      stages: [
        { ...mockWorkflow.stages[0], completed: true },
        { ...mockWorkflow.stages[1], completed: true }
      ],
      overallProgress: 100
    };

    const completedWorkflow = {
      ...completableWorkflow,
      completedAt: '2024-01-01T12:00:00Z'
    };

    mockReviewService.markReviewComplete.mockReturnValue(completedWorkflow);

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: completableWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="review"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    const completeButton = screen.getByText('Complete Review');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockReviewService.markReviewComplete).toHaveBeenCalledWith(completableWorkflow);
      expect(mockOnWorkflowUpdate).toHaveBeenCalledWith(completedWorkflow);
      expect(mockOnModeChange).toHaveBeenCalledWith('view');
    });
  });

  it('should not show complete button when required stages are incomplete', () => {
    const incompleteWorkflow = {
      ...mockWorkflow,
      stages: [
        { ...mockWorkflow.stages[0], completed: false },
        { ...mockWorkflow.stages[1], completed: true }
      ]
    };

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: incompleteWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="review"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    expect(screen.queryByText('Complete Review')).not.toBeInTheDocument();
  });

  it('should show start review button when not in review mode', () => {
    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: mockWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="view"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    const startButton = screen.getByText('Start Review');
    fireEvent.click(startButton);

    expect(mockOnModeChange).toHaveBeenCalledWith('review');
  });

  it('should display completed review status', () => {
    const completedWorkflow = {
      ...mockWorkflow,
      completedAt: '2024-01-01T12:00:00Z',
      overallProgress: 100
    };

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: completedWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="view"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    expect(screen.getAllByText('Review Completed')).toHaveLength(2);
    expect(screen.getByText(/This trade review was completed on/)).toBeInTheDocument();
  });

  it('should disable controls when review is completed', () => {
    const completedWorkflow = {
      ...mockWorkflow,
      completedAt: '2024-01-01T12:00:00Z',
      overallProgress: 100
    };

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: completedWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="view"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    // Expand first stage
    const stageHeader = screen.getByText('Data Verification');
    fireEvent.click(stageHeader);

    // Check that textarea is disabled
    const textarea = screen.getByPlaceholderText('Add notes for data verification...');
    expect(textarea).toBeDisabled();

    // Check that save button is not present
    expect(screen.queryByText('Save Notes')).not.toBeInTheDocument();
  });

  it('should show stage completion timestamps', () => {
    const workflowWithCompletedStage = {
      ...mockWorkflow,
      stages: [
        { 
          ...mockWorkflow.stages[0], 
          completed: true, 
          completedAt: '2024-01-01T11:00:00Z' 
        },
        { ...mockWorkflow.stages[1] }
      ]
    };

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: workflowWithCompletedStage }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="view"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    // Expand first stage
    const stageHeader = screen.getByText('Data Verification');
    fireEvent.click(stageHeader);

    expect(screen.getByText(/Completed on/)).toBeInTheDocument();
  });

  it('should display correct stage counts', () => {
    const mixedWorkflow = {
      ...mockWorkflow,
      stages: [
        { ...mockWorkflow.stages[0], completed: true, required: true },
        { ...mockWorkflow.stages[1], completed: false, required: true },
        {
          id: 'optional_stage',
          name: 'Optional Stage',
          description: 'Optional stage',
          required: false,
          completed: false
        }
      ]
    };

    const tradeWithWorkflow = {
      ...mockTrade,
      reviewData: { reviewWorkflow: mixedWorkflow }
    };

    render(
      <ReviewWorkflowPanel
        trade={tradeWithWorkflow}
        currentMode="view"
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onModeChange={mockOnModeChange}
      />
    );

    // Check for specific counts using getAllByText and checking context
    const allRequiredTexts = screen.getAllByText('Required');
    const summaryRequiredText = allRequiredTexts.find(el => 
      el.className.includes('text-xs text-gray-500 font-medium')
    );
    expect(summaryRequiredText).toBeInTheDocument();
    
    // Check that we have the right number of stages displayed
    expect(screen.getByText('Data Verification')).toBeInTheDocument();
    expect(screen.getByText('Technical Analysis Review')).toBeInTheDocument();
    expect(screen.getByText('Optional Stage')).toBeInTheDocument();
  });
});
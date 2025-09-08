import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProcessScore from '../ProcessScore';
import { ProcessMetrics } from '../../../types/journal';

const mockProcessMetrics: ProcessMetrics = {
  planAdherence: 4,
  riskManagement: 5,
  entryTiming: 3,
  exitTiming: 4,
  emotionalDiscipline: 3,
  overallDiscipline: 3.8,
  processScore: 78,
  processNotes: 'Good execution overall with room for improvement in timing',
  mistakesMade: [],
  successfulExecutions: [],
  improvementAreas: ['Entry timing needs work', 'Emotional control during losses'],
  strengthsIdentified: ['Excellent risk management', 'Strong plan adherence']
};

describe('ProcessScore Component', () => {
  it('renders process score correctly', () => {
    render(<ProcessScore processMetrics={mockProcessMetrics} />);
    
    expect(screen.getByText('Process Score')).toBeInTheDocument();
    expect(screen.getByText('78/100')).toBeInTheDocument();
    expect(screen.getByText(/Good Process/)).toBeInTheDocument();
  });

  it('displays correct score color for different ranges', () => {
    const excellentMetrics = { ...mockProcessMetrics, processScore: 85 };
    const { rerender } = render(<ProcessScore processMetrics={excellentMetrics} />);
    
    expect(screen.getByText('85/100')).toHaveClass('text-green-600');
    expect(screen.getByText(/Excellent Process/)).toBeInTheDocument();

    const poorMetrics = { ...mockProcessMetrics, processScore: 35 };
    rerender(<ProcessScore processMetrics={poorMetrics} />);
    
    expect(screen.getByText('35/100')).toHaveClass('text-red-600');
    expect(screen.getByText(/Needs Improvement/)).toBeInTheDocument();
  });

  it('shows detailed metrics when showDetails is true', () => {
    render(<ProcessScore processMetrics={mockProcessMetrics} showDetails={true} />);
    
    expect(screen.getByText('Process Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Plan Adherence')).toBeInTheDocument();
    expect(screen.getByText('Risk Management')).toBeInTheDocument();
    expect(screen.getByText('Entry Timing')).toBeInTheDocument();
    expect(screen.getByText('Exit Timing')).toBeInTheDocument();
    expect(screen.getByText('Emotional Discipline')).toBeInTheDocument();
  });

  it('hides detailed metrics when showDetails is false', () => {
    render(<ProcessScore processMetrics={mockProcessMetrics} showDetails={false} />);
    
    expect(screen.queryByText('Process Breakdown')).not.toBeInTheDocument();
  });

  it('displays process notes when provided', () => {
    render(<ProcessScore processMetrics={mockProcessMetrics} />);
    
    expect(screen.getByText('Process Notes')).toBeInTheDocument();
    expect(screen.getByText(mockProcessMetrics.processNotes!)).toBeInTheDocument();
  });

  it('displays improvement areas when provided', () => {
    render(<ProcessScore processMetrics={mockProcessMetrics} />);
    
    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
    expect(screen.getByText('Entry timing needs work')).toBeInTheDocument();
    expect(screen.getByText('Emotional control during losses')).toBeInTheDocument();
  });

  it('displays strengths when provided', () => {
    render(<ProcessScore processMetrics={mockProcessMetrics} />);
    
    expect(screen.getByText('Strengths Identified')).toBeInTheDocument();
    expect(screen.getByText('Excellent risk management')).toBeInTheDocument();
    expect(screen.getByText('Strong plan adherence')).toBeInTheDocument();
  });

  it('displays overall discipline score', () => {
    render(<ProcessScore processMetrics={mockProcessMetrics} showDetails={true} />);
    
    expect(screen.getByText('Overall Discipline')).toBeInTheDocument();
    expect(screen.getByText('3.8/5')).toBeInTheDocument();
  });

  it('applies correct metric colors based on values', () => {
    render(<ProcessScore processMetrics={mockProcessMetrics} showDetails={true} />);
    
    // Risk Management (5/5) should be green
    const riskManagementScore = screen.getByText('5/5');
    expect(riskManagementScore).toHaveClass('text-green-600');
    
    // Entry Timing (3/5) should be yellow - use getAllByText since there are multiple 3/5 scores
    const allThreeScores = screen.getAllByText('3/5');
    expect(allThreeScores[0]).toHaveClass('text-yellow-600'); // First 3/5 should be Entry Timing
  });

  it('handles missing optional fields gracefully', () => {
    const minimalMetrics: ProcessMetrics = {
      planAdherence: 3,
      riskManagement: 3,
      entryTiming: 3,
      exitTiming: 3,
      emotionalDiscipline: 3,
      overallDiscipline: 3,
      processScore: 60,
      mistakesMade: [],
      successfulExecutions: [],
      improvementAreas: [],
      strengthsIdentified: []
    };

    render(<ProcessScore processMetrics={minimalMetrics} />);
    
    expect(screen.getByText('60/100')).toBeInTheDocument();
    expect(screen.queryByText('Process Notes')).not.toBeInTheDocument();
    expect(screen.queryByText('Areas for Improvement')).not.toBeInTheDocument();
    expect(screen.queryByText('Strengths Identified')).not.toBeInTheDocument();
  });
});
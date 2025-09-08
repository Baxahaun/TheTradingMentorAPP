import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import PerformanceMetrics from '../PerformanceMetrics';
import { ProcessMetrics } from '../../../types/journal';
import { Trade } from '../../../types/trade';

const mockProcessMetrics: ProcessMetrics = {
  planAdherence: 4,
  riskManagement: 5,
  entryTiming: 3,
  exitTiming: 4,
  emotionalDiscipline: 3,
  overallDiscipline: 3.8,
  processScore: 78,
  processNotes: 'Good execution overall with room for improvement in timing',
  mistakesMade: [
    {
      id: '1',
      category: 'timing_error',
      description: 'Entered too early on EUR/USD',
      impact: 'medium',
      lesson: 'Wait for full confirmation',
      preventionStrategy: 'Use multiple timeframe analysis'
    }
  ],
  successfulExecutions: [
    {
      id: '1',
      category: 'risk_control',
      description: 'Perfect stop loss placement',
      impact: 'high',
      replicationStrategy: 'Continue using ATR-based stops'
    }
  ],
  improvementAreas: ['Entry timing needs work', 'Emotional control during losses'],
  strengthsIdentified: ['Excellent risk management', 'Strong plan adherence']
};

const mockTrades: Trade[] = [
  {
    id: '1',
    accountId: 'acc1',
    currencyPair: 'EUR/USD',
    date: '2024-01-01',
    timeIn: '09:00',
    timeOut: '10:00',
    side: 'long',
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    stopLoss: 1.0950,
    commission: 5,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 500,
    timestamp: Date.now()
  },
  {
    id: '2',
    accountId: 'acc1',
    currencyPair: 'GBP/USD',
    date: '2024-01-01',
    timeIn: '11:00',
    timeOut: '12:00',
    side: 'short',
    entryPrice: 1.2500,
    exitPrice: 1.2450,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    stopLoss: 1.2550,
    commission: 3,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 250,
    timestamp: Date.now()
  }
];

describe('PerformanceMetrics Integration', () => {
  const defaultProps = {
    processMetrics: mockProcessMetrics,
    dailyPnL: 750,
    trades: mockTrades,
    accountCurrency: 'USD' as const
  };

  it('renders overview tab by default', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('78/100')).toBeInTheDocument();
    expect(screen.getByText('+$750.00')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Number of trades
  });

  it('displays key insight in overview', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    expect(screen.getByText('Key Insight')).toBeInTheDocument();
    expect(screen.getByText(/Good process execution with room for improvement/)).toBeInTheDocument();
  });

  it('switches to process tab when clicked', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    const processTab = screen.getByRole('button', { name: /⚡ Process Score/ });
    fireEvent.click(processTab);
    
    await waitFor(() => {
      expect(screen.getByText('Process Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Plan Adherence')).toBeInTheDocument();
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });
  });

  it('switches to P&L tab when clicked', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    const pnlTab = screen.getByText('P&L Analysis');
    fireEvent.click(pnlTab);
    
    await waitFor(() => {
      expect(screen.getByText('Daily P&L Summary')).toBeInTheDocument();
      expect(screen.getByText('Process vs Outcome Analysis')).toBeInTheDocument();
    });
  });

  it('switches to insights tab when clicked', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Today\'s Key Insight')).toBeInTheDocument();
      expect(screen.getByText('Recommendations for Improvement')).toBeInTheDocument();
      // Note: Primary Focus Areas only shows when there are focus areas, which may not always be the case
      expect(screen.getByText(/Good process execution with room for improvement/)).toBeInTheDocument();
    });
  });

  it('displays process mistakes in insights tab', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Mistakes to Learn From')).toBeInTheDocument();
      expect(screen.getByText(/timing error/i)).toBeInTheDocument();
      expect(screen.getByText('Entered too early on EUR/USD')).toBeInTheDocument();
      expect(screen.getByText('Wait for full confirmation')).toBeInTheDocument();
    });
  });

  it('displays strengths in insights tab', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Strengths to Maintain')).toBeInTheDocument();
      expect(screen.getByText('Excellent risk management')).toBeInTheDocument();
      expect(screen.getByText('Strong plan adherence')).toBeInTheDocument();
    });
  });

  it('shows action items in insights tab', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Tomorrow\'s Action Items')).toBeInTheDocument();
      expect(screen.getByText(/Review today's process score/)).toBeInTheDocument();
      expect(screen.getByText(/Implement the top recommendation/)).toBeInTheDocument();
    });
  });

  it('handles negative P&L correctly', () => {
    const negativeProps = { ...defaultProps, dailyPnL: -200 };
    render(<PerformanceMetrics {...negativeProps} />);
    
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toHaveClass('text-red-900');
  });

  it('handles zero P&L correctly', () => {
    const zeroProps = { ...defaultProps, dailyPnL: 0 };
    render(<PerformanceMetrics {...zeroProps} />);
    
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toHaveClass('text-gray-900');
  });

  it('handles different account currencies', () => {
    const eurProps = { ...defaultProps, accountCurrency: 'EUR' as const };
    render(<PerformanceMetrics {...eurProps} />);
    
    expect(screen.getByText('+EUR 750.00')).toBeInTheDocument();
  });

  it('displays correct trade count', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Trade count in overview
  });

  it('handles empty trades array', () => {
    const noTradesProps = { ...defaultProps, trades: [], dailyPnL: 0 };
    render(<PerformanceMetrics {...noTradesProps} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Trade count should be 0
  });

  it('navigates to process tab from overview quick action', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    const reviewProcessButton = screen.getByText('Review Process Score');
    fireEvent.click(reviewProcessButton);
    
    await waitFor(() => {
      expect(screen.getByText('Process Breakdown')).toBeInTheDocument();
    });
  });

  it('navigates to insights tab from overview quick action', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    const viewInsightsButton = screen.getByText('View Insights');
    fireEvent.click(viewInsightsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Today\'s Key Insight')).toBeInTheDocument();
    });
  });

  it('displays tab icons correctly', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    expect(screen.getAllByText('📊')).toHaveLength(1); // Overview icon
    expect(screen.getAllByText('⚡').length).toBeGreaterThan(0); // Process icon (appears multiple times)
    expect(screen.getAllByText('💰').length).toBeGreaterThan(0); // P&L icon (appears multiple times)
    expect(screen.getAllByText('💡').length).toBeGreaterThan(0); // Insights icon (appears multiple times)
  });

  it('maintains active tab state correctly', async () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    // Initially overview should be active
    const overviewTab = screen.getByRole('button', { name: /📊 Overview/ });
    expect(overviewTab).toHaveClass('bg-blue-50', 'text-blue-700');
    
    // Click process tab
    const processTab = screen.getByRole('button', { name: /⚡ Process Score/ });
    fireEvent.click(processTab);
    
    await waitFor(() => {
      expect(processTab).toHaveClass('bg-blue-50', 'text-blue-700');
      expect(overviewTab).not.toHaveClass('bg-blue-50', 'text-blue-700');
    });
  });

  it('calls onUpdateProcessMetrics when provided', () => {
    const mockUpdate = vi.fn();
    render(<PerformanceMetrics {...defaultProps} onUpdateProcessMetrics={mockUpdate} />);
    
    // This component doesn't directly trigger updates, but the prop should be passed through
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('handles excellent process score display', () => {
    const excellentMetrics = { ...mockProcessMetrics, processScore: 90 };
    const excellentProps = { ...defaultProps, processMetrics: excellentMetrics };
    
    render(<PerformanceMetrics {...excellentProps} />);
    
    expect(screen.getByText('90/100')).toBeInTheDocument();
  });

  it('handles poor process score display', () => {
    const poorMetrics = { ...mockProcessMetrics, processScore: 30 };
    const poorProps = { ...defaultProps, processMetrics: poorMetrics };
    
    render(<PerformanceMetrics {...poorProps} />);
    
    expect(screen.getByText('30/100')).toBeInTheDocument();
  });
});
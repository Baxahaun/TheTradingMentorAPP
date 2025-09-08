import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PnLSummary from '../PnLSummary';
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
  mistakesMade: [],
  successfulExecutions: [],
  improvementAreas: [],
  strengthsIdentified: []
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
    commission: 3,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 250,
    timestamp: Date.now()
  },
  {
    id: '3',
    accountId: 'acc1',
    currencyPair: 'USD/JPY',
    date: '2024-01-01',
    timeIn: '14:00',
    timeOut: '15:00',
    side: 'long',
    entryPrice: 110.00,
    exitPrice: 109.50,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    commission: 5,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: -500,
    timestamp: Date.now()
  }
];

describe('PnLSummary Component', () => {
  it('renders daily P&L correctly for positive results', () => {
    render(
      <PnLSummary
        dailyPnL={750}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('Daily P&L Summary')).toBeInTheDocument();
    expect(screen.getByText('+$750.00')).toBeInTheDocument();
    expect(screen.getByText('3 trades executed')).toBeInTheDocument();
  });

  it('renders daily P&L correctly for negative results', () => {
    render(
      <PnLSummary
        dailyPnL={-250}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('$250.00')).toBeInTheDocument();
    expect(screen.getByText('3 trades executed')).toBeInTheDocument();
  });

  it('renders daily P&L correctly for breakeven results', () => {
    render(
      <PnLSummary
        dailyPnL={0}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('displays correct trade breakdown', () => {
    render(
      <PnLSummary
        dailyPnL={250}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Winners
    expect(screen.getByText('1')).toBeInTheDocument(); // Losers
    expect(screen.getByText('0')).toBeInTheDocument(); // Breakeven
    expect(screen.getByText('Winners')).toBeInTheDocument();
    expect(screen.getByText('Losers')).toBeInTheDocument();
    expect(screen.getByText('Breakeven')).toBeInTheDocument();
  });

  it('calculates and displays win rate correctly', () => {
    render(
      <PnLSummary
        dailyPnL={250}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('66.7%')).toBeInTheDocument(); // 2 winners out of 3 trades
  });

  it('displays appropriate process message for excellent process with profit', () => {
    const excellentMetrics = { ...mockProcessMetrics, processScore: 85, overallDiscipline: 4.2 };
    
    render(
      <PnLSummary
        dailyPnL={500}
        processMetrics={excellentMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText(/Excellent! You followed your process perfectly/)).toBeInTheDocument();
  });

  it('displays appropriate process message for excellent process with loss', () => {
    const excellentMetrics = { ...mockProcessMetrics, processScore: 85, overallDiscipline: 4.2 };
    
    render(
      <PnLSummary
        dailyPnL={-200}
        processMetrics={excellentMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText(/Great process execution! Even with a loss/)).toBeInTheDocument();
  });

  it('displays warning message for profit with poor process', () => {
    const poorMetrics = { ...mockProcessMetrics, processScore: 30, overallDiscipline: 1.5 };
    
    render(
      <PnLSummary
        dailyPnL={500}
        processMetrics={poorMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText(/WARNING: You made money despite poor process execution/)).toBeInTheDocument();
  });

  it('handles different account currencies', () => {
    render(
      <PnLSummary
        dailyPnL={750}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="EUR"
      />
    );
    
    expect(screen.getByText('+EUR 750.00')).toBeInTheDocument();
  });

  it('displays process vs outcome comparison', () => {
    render(
      <PnLSummary
        dailyPnL={250}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('Process Score')).toBeInTheDocument();
    expect(screen.getByText('78/100')).toBeInTheDocument();
    expect(screen.getByText('P&L Impact')).toBeInTheDocument();
    expect(screen.getByText('Positive')).toBeInTheDocument();
  });

  it('handles empty trades array', () => {
    render(
      <PnLSummary
        dailyPnL={0}
        processMetrics={mockProcessMetrics}
        trades={[]}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('0 trades executed')).toBeInTheDocument();
    expect(screen.queryByText('Win Rate')).not.toBeInTheDocument();
  });

  it('applies correct color classes for P&L display', () => {
    const { rerender } = render(
      <PnLSummary
        dailyPnL={500}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('+$500.00')).toHaveClass('text-green-600');

    rerender(
      <PnLSummary
        dailyPnL={-200}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('$200.00')).toHaveClass('text-red-600');

    rerender(
      <PnLSummary
        dailyPnL={0}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('$0.00')).toHaveClass('text-gray-600');
  });

  it('displays reminder about process importance', () => {
    render(
      <PnLSummary
        dailyPnL={250}
        processMetrics={mockProcessMetrics}
        trades={mockTrades}
        accountCurrency="USD"
      />
    );
    
    expect(screen.getByText('Remember: Consistent process execution leads to long-term profitability')).toBeInTheDocument();
  });
});
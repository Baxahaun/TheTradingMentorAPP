/**
 * Integration tests for PerformanceAnalyticsPanel
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PerformanceAnalyticsPanel } from '../PerformanceAnalyticsPanel';
import { Trade } from '../../../types/trade';

// Mock the UI components
jest.mock('../../ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3 data-testid="card-title">{children}</h3>
}));

jest.mock('../../ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <span data-testid="badge" className={className}>{children}</span>
}));

jest.mock('../../ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => 
    <div data-testid="progress" data-value={value} className={className} />
}));

describe('PerformanceAnalyticsPanel', () => {
  const mockTrade: Trade = {
    id: 'test-trade-1',
    accountId: 'test-account',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '09:00',
    timeOut: '15:00',
    side: 'long',
    entryPrice: 1.1000,
    exitPrice: 1.1100,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    stopLoss: 1.0950,
    takeProfit: 1.1150,
    riskAmount: 500,
    pnl: 1000,
    commission: 10,
    accountCurrency: 'USD',
    status: 'closed',
    strategy: 'trend_following',
    timeframe: '1H',
    marketConditions: 'trending',
    confidence: 8
  };

  const mockSimilarTrades: Trade[] = [
    {
      ...mockTrade,
      id: 'similar-1',
      pnl: 500,
      riskAmount: 500
    },
    {
      ...mockTrade,
      id: 'similar-2',
      pnl: 750,
      riskAmount: 500
    }
  ];

  it('should render performance metrics', () => {
    render(
      <PerformanceAnalyticsPanel 
        trade={mockTrade} 
        similarTrades={[]} 
        showComparisons={false}
      />
    );

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('R-Multiple')).toBeInTheDocument();
    expect(screen.getByText('Return')).toBeInTheDocument();
    expect(screen.getByText('Risk:Reward')).toBeInTheDocument();
    expect(screen.getByText('Hold Time')).toBeInTheDocument();
    expect(screen.getByText('Efficiency')).toBeInTheDocument();
  });

  it('should display correct R-multiple value', () => {
    render(
      <PerformanceAnalyticsPanel 
        trade={mockTrade} 
        similarTrades={[]} 
        showComparisons={false}
      />
    );

    // R-multiple should be 2.00 (1000 / 500)
    expect(screen.getByText('2.00')).toBeInTheDocument();
  });

  it('should show performance comparison when similar trades provided', () => {
    render(
      <PerformanceAnalyticsPanel 
        trade={mockTrade} 
        similarTrades={mockSimilarTrades} 
        showComparisons={true}
      />
    );

    expect(screen.getByText('Performance Comparison')).toBeInTheDocument();
    expect(screen.getByText('Percentile Rank')).toBeInTheDocument();
  });

  it('should display insights when available', () => {
    render(
      <PerformanceAnalyticsPanel 
        trade={mockTrade} 
        similarTrades={mockSimilarTrades} 
        showComparisons={true}
      />
    );

    expect(screen.getByText('Performance Insights')).toBeInTheDocument();
  });

  it('should show similar trades summary', () => {
    render(
      <PerformanceAnalyticsPanel 
        trade={mockTrade} 
        similarTrades={mockSimilarTrades} 
        showComparisons={true}
      />
    );

    expect(screen.getByText(`Similar Trades (${mockSimilarTrades.length})`)).toBeInTheDocument();
  });

  it('should handle trade with missing data gracefully', () => {
    const incompleteTrade = {
      ...mockTrade,
      riskAmount: undefined,
      pnl: undefined,
      stopLoss: undefined,
      takeProfit: undefined
    };

    render(
      <PerformanceAnalyticsPanel 
        trade={incompleteTrade} 
        similarTrades={[]} 
        showComparisons={false}
      />
    );

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    // Should still render without crashing
  });

  it('should not show comparison section when showComparisons is false', () => {
    render(
      <PerformanceAnalyticsPanel 
        trade={mockTrade} 
        similarTrades={mockSimilarTrades} 
        showComparisons={false}
      />
    );

    expect(screen.queryByText('Performance Comparison')).not.toBeInTheDocument();
  });
});
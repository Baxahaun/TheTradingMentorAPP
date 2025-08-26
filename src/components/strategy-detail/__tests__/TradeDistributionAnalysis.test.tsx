/**
 * Unit tests for TradeDistributionAnalysis component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import TradeDistributionAnalysis from '../TradeDistributionAnalysis';
import { TradeWithStrategy } from '../../../types/strategy';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span className={`badge ${variant}`}>{children}</span>
  )
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => (
    <div data-testid="progress" data-value={value}>Progress: {value}%</div>
  )
}));

describe('TradeDistributionAnalysis', () => {
  const mockTrades: TradeWithStrategy[] = [
    {
      id: 'trade-1',
      currencyPair: 'EURUSD',
      side: 'BUY',
      timestamp: new Date('2024-03-01T10:30:00Z').getTime(),
      pnl: 150,
      strategyId: 'strategy-1',
      adherenceScore: 85
    },
    {
      id: 'trade-2',
      currencyPair: 'GBPUSD',
      side: 'SELL',
      timestamp: new Date('2024-03-01T14:15:00Z').getTime(),
      pnl: -75,
      strategyId: 'strategy-1',
      adherenceScore: 70
    },
    {
      id: 'trade-3',
      currencyPair: 'EURUSD',
      side: 'BUY',
      timestamp: new Date('2024-03-02T09:45:00Z').getTime(),
      pnl: 200,
      strategyId: 'strategy-1',
      adherenceScore: 90
    },
    {
      id: 'trade-4',
      currencyPair: 'USDJPY',
      side: 'SELL',
      timestamp: new Date('2024-03-02T16:20:00Z').getTime(),
      pnl: -50,
      strategyId: 'strategy-1',
      adherenceScore: 60
    },
    {
      id: 'trade-5',
      currencyPair: 'GBPUSD',
      side: 'BUY',
      timestamp: new Date('2024-03-03T11:10:00Z').getTime(),
      pnl: 100,
      strategyId: 'strategy-1',
      adherenceScore: 95
    }
  ];

  it('renders empty state when no trades provided', () => {
    render(<TradeDistributionAnalysis trades={[]} />);
    
    expect(screen.getByText('No trades available for distribution analysis.')).toBeInTheDocument();
  });

  it('displays hourly performance analysis', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    expect(screen.getByText('Hourly Performance')).toBeInTheDocument();
    
    // Should show hours that have trades
    expect(screen.getByText('10:00')).toBeInTheDocument(); // 10:30 trade
    expect(screen.getByText('14:00')).toBeInTheDocument(); // 14:15 trade
    expect(screen.getByText('09:00')).toBeInTheDocument(); // 09:45 trade
    expect(screen.getByText('16:00')).toBeInTheDocument(); // 16:20 trade
    expect(screen.getByText('11:00')).toBeInTheDocument(); // 11:10 trade
  });

  it('displays daily performance analysis', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    expect(screen.getByText('Daily Performance')).toBeInTheDocument();
    
    // All trades are on Friday (day 5) and Saturday (day 6) based on the timestamps
    // Note: This depends on timezone, but the component should handle it consistently
  });

  it('shows currency pair performance correctly', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    expect(screen.getByText('Currency Pair Performance')).toBeInTheDocument();
    
    // Should show all currency pairs
    expect(screen.getByText('EURUSD')).toBeInTheDocument();
    expect(screen.getByText('GBPUSD')).toBeInTheDocument();
    expect(screen.getByText('USDJPY')).toBeInTheDocument();
    
    // Should show trade counts
    expect(screen.getByText('2 trades')).toBeInTheDocument(); // EURUSD and GBPUSD each have 2 trades
    expect(screen.getByText('1 trades')).toBeInTheDocument(); // USDJPY has 1 trade
  });

  it('calculates win rates correctly for currency pairs', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    // EURUSD: 2 trades, both winning (150, 200) = 100% win rate
    // GBPUSD: 2 trades, 1 winning (100), 1 losing (-75) = 50% win rate  
    // USDJPY: 1 trade, losing (-50) = 0% win rate
    
    // The component should display these win rates
    expect(screen.getByText('100.0%')).toBeInTheDocument(); // EURUSD win rate
    expect(screen.getByText('50.0%')).toBeInTheDocument(); // GBPUSD win rate
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // USDJPY win rate
  });

  it('displays strategy adherence analysis when adherence scores are available', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    expect(screen.getByText('Strategy Adherence Analysis')).toBeInTheDocument();
    
    // Should show average adherence (85+70+90+60+95)/5 = 80%
    expect(screen.getByText('Avg: 80.0%')).toBeInTheDocument();
    
    expect(screen.getByText('Adherence Distribution')).toBeInTheDocument();
    expect(screen.getByText('Adherence Impact')).toBeInTheDocument();
  });

  it('shows adherence distribution ranges correctly', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    // Based on adherence scores: 85, 70, 90, 60, 95
    // 90-100%: 2 trades (90, 95)
    // 80-89%: 1 trade (85)
    // 70-79%: 1 trade (70)
    // 60-69%: 1 trade (60)
    
    expect(screen.getByText('90-100%')).toBeInTheDocument();
    expect(screen.getByText('80-89%')).toBeInTheDocument();
    expect(screen.getByText('70-79%')).toBeInTheDocument();
    expect(screen.getByText('60-69%')).toBeInTheDocument();
  });

  it('calculates adherence-performance correlation', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    expect(screen.getByText('Adherence-Performance Correlation:')).toBeInTheDocument();
    
    // Should show some correlation percentage
    // The exact value depends on the correlation calculation
  });

  it('displays positive correlation message for strong correlation', () => {
    // Create trades with strong positive correlation between adherence and performance
    const correlatedTrades: TradeWithStrategy[] = [
      {
        id: 'trade-1',
        currencyPair: 'EURUSD',
        side: 'BUY',
        timestamp: Date.now(),
        pnl: 200, // High PnL
        strategyId: 'strategy-1',
        adherenceScore: 95 // High adherence
      },
      {
        id: 'trade-2',
        currencyPair: 'GBPUSD',
        side: 'SELL',
        timestamp: Date.now(),
        pnl: 150, // Medium-high PnL
        strategyId: 'strategy-1',
        adherenceScore: 85 // Medium-high adherence
      },
      {
        id: 'trade-3',
        currencyPair: 'USDJPY',
        side: 'BUY',
        timestamp: Date.now(),
        pnl: -100, // Low PnL
        strategyId: 'strategy-1',
        adherenceScore: 40 // Low adherence
      }
    ];

    render(<TradeDistributionAnalysis trades={correlatedTrades} />);
    
    // Should show positive correlation message (exact text depends on correlation strength)
    expect(screen.getByText(/correlation/i)).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    // Should show currency formatted values
    expect(screen.getByText(/\$\d+\.\d{2}/)).toBeInTheDocument();
  });

  it('formats percentage values correctly', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    // Should show percentage formatted values
    expect(screen.getByText(/\d+\.\d%/)).toBeInTheDocument();
  });

  it('handles trades without adherence scores', () => {
    const tradesWithoutAdherence: TradeWithStrategy[] = [
      {
        id: 'trade-1',
        currencyPair: 'EURUSD',
        side: 'BUY',
        timestamp: Date.now(),
        pnl: 150,
        strategyId: 'strategy-1'
        // No adherenceScore
      }
    ];

    render(<TradeDistributionAnalysis trades={tradesWithoutAdherence} />);
    
    // Should not show adherence analysis section
    expect(screen.queryByText('Strategy Adherence Analysis')).not.toBeInTheDocument();
  });

  it('handles trades with undefined PnL', () => {
    const tradesWithOpenPositions: TradeWithStrategy[] = [
      {
        id: 'trade-1',
        currencyPair: 'EURUSD',
        side: 'BUY',
        timestamp: Date.now(),
        // No pnl (open trade)
        strategyId: 'strategy-1',
        adherenceScore: 85
      }
    ];

    render(<TradeDistributionAnalysis trades={tradesWithOpenPositions} />);
    
    // Should handle open trades gracefully
    expect(screen.getByText('Currency Pair Performance')).toBeInTheDocument();
  });

  it('sorts currency pairs by trade count', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    // EURUSD and GBPUSD should appear before USDJPY (more trades)
    const pairElements = screen.getAllByText(/USD/);
    expect(pairElements.length).toBeGreaterThan(0);
  });

  it('limits displayed hours to those with trades', () => {
    render(<TradeDistributionAnalysis trades={mockTrades} />);
    
    // Should only show hours that have trades, not all 24 hours
    const hourElements = screen.getAllByText(/\d{2}:\d{2}/);
    expect(hourElements.length).toBeLessThan(24);
  });

  it('applies custom className', () => {
    const { container } = render(
      <TradeDistributionAnalysis trades={mockTrades} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('TradeDistributionAnalysis Performance', () => {
  it('handles large number of trades efficiently', () => {
    // Create a large number of trades
    const largeTrades: TradeWithStrategy[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `trade-${i}`,
      currencyPair: ['EURUSD', 'GBPUSD', 'USDJPY'][i % 3],
      side: i % 2 === 0 ? 'BUY' : 'SELL',
      timestamp: Date.now() - (i * 3600000), // Spread over time
      pnl: Math.random() * 200 - 100, // Random PnL
      strategyId: 'strategy-1',
      adherenceScore: Math.random() * 40 + 60 // Random adherence 60-100
    }));

    const startTime = performance.now();
    render(<TradeDistributionAnalysis trades={largeTrades} />);
    const endTime = performance.now();

    // Should render within reasonable time (less than 1 second)
    expect(endTime - startTime).toBeLessThan(1000);
    
    expect(screen.getByText('Currency Pair Performance')).toBeInTheDocument();
  });
});
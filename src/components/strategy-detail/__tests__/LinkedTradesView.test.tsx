/**
 * Unit tests for LinkedTradesView component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import LinkedTradesView from '../LinkedTradesView';
import { TradeWithStrategy } from '../../../types/strategy';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  )
}));

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

vi.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, ...props }: any) => (
    <input 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange} 
      {...props}
    />
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { onValueChange })
      )}
    </div>
  ),
  SelectContent: ({ children, onValueChange }: any) => (
    <div data-testid="select-content">
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { onValueChange })
      )}
    </div>
  ),
  SelectItem: ({ children, value, onValueChange }: any) => (
    <button 
      onClick={() => onValueChange(value)}
      data-testid={`select-item-${value}`}
    >
      {children}
    </button>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}));

describe('LinkedTradesView', () => {
  const mockTrades: TradeWithStrategy[] = [
    {
      id: 'trade-1',
      currencyPair: 'EURUSD',
      side: 'BUY',
      timestamp: new Date('2024-03-01T10:30:00Z').getTime(),
      pnl: 150,
      strategyId: 'strategy-1',
      adherenceScore: 85,
      notes: 'Good entry timing'
    },
    {
      id: 'trade-2',
      currencyPair: 'GBPUSD',
      side: 'SELL',
      timestamp: new Date('2024-03-01T14:15:00Z').getTime(),
      pnl: -75,
      strategyId: 'strategy-1',
      adherenceScore: 70,
      deviations: [
        {
          type: 'StopLoss',
          planned: 50,
          actual: 75,
          impact: 'Negative',
          description: 'Stop loss moved too far'
        }
      ]
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

  const defaultProps = {
    trades: mockTrades,
    strategyName: 'Test Strategy',
    onNavigateToTrade: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trade summary correctly', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    expect(screen.getByText('Trades for "Test Strategy"')).toBeInTheDocument();
    expect(screen.getByText('5 trades')).toBeInTheDocument();
    
    // Summary statistics
    expect(screen.getByText('5')).toBeInTheDocument(); // Total
    expect(screen.getByText('3')).toBeInTheDocument(); // Winning (150, 200, 100)
    expect(screen.getByText('2')).toBeInTheDocument(); // Losing (-75, -50)
    expect(screen.getByText('60.0%')).toBeInTheDocument(); // Win rate
  });

  it('calculates total P&L correctly', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    // Total P&L: 150 + (-75) + 200 + (-50) + 100 = 325
    expect(screen.getByText('$325.00')).toBeInTheDocument();
  });

  it('calculates average adherence correctly', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    // Average adherence: (85 + 70 + 90 + 60 + 95) / 5 = 80%
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('filters trades by search term', async () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/Search trades/);
    fireEvent.change(searchInput, { target: { value: 'EURUSD' } });
    
    await waitFor(() => {
      // Should show only EURUSD trades
      expect(screen.getByText('Showing 2 of 2 trades')).toBeInTheDocument();
    });
  });

  it('filters trades by outcome', async () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    // Click winning trades filter
    fireEvent.click(screen.getByTestId('select-item-winning'));
    
    await waitFor(() => {
      // Should show only winning trades (3 trades)
      expect(screen.getByText('Showing 3 of 3 trades')).toBeInTheDocument();
    });
  });

  it('filters trades by adherence level', async () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    // Click high adherence filter
    fireEvent.click(screen.getByTestId('select-item-high-adherence'));
    
    await waitFor(() => {
      // Should show only trades with adherence >= 80% (3 trades: 85, 90, 95)
      expect(screen.getByText('Showing 3 of 3 trades')).toBeInTheDocument();
    });
  });

  it('sorts trades by timestamp descending by default', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    const tradeRows = screen.getAllByText(/Mar \d+, 2024/);
    // Most recent trade should be first (trade-5 from March 3)
    expect(tradeRows[0]).toHaveTextContent('Mar 3, 2024');
  });

  it('sorts trades by P&L when column header is clicked', async () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    const pnlHeader = screen.getByText('P&L');
    fireEvent.click(pnlHeader);
    
    await waitFor(() => {
      // Should sort by P&L descending (highest first)
      const pnlValues = screen.getAllByText(/\$\d+\.\d{2}/);
      expect(pnlValues[0]).toHaveTextContent('$200.00'); // Highest P&L first
    });
  });

  it('calls onNavigateToTrade when trade row is clicked', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    const reviewButton = screen.getAllByText('Review')[0];
    fireEvent.click(reviewButton);
    
    expect(defaultProps.onNavigateToTrade).toHaveBeenCalledWith('trade-5'); // Most recent trade
  });

  it('calls onViewTradeDetails when quick view is clicked', () => {
    const onViewTradeDetails = vi.fn();
    render(
      <LinkedTradesView 
        {...defaultProps} 
        onViewTradeDetails={onViewTradeDetails}
      />
    );
    
    const quickViewButton = screen.getAllByText('Quick View')[0];
    fireEvent.click(quickViewButton);
    
    expect(onViewTradeDetails).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'trade-5' })
    );
  });

  it('displays adherence scores and deviations correctly', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    expect(screen.getByText('70.0%')).toBeInTheDocument();
    expect(screen.getByText('90.0%')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('95.0%')).toBeInTheDocument();
    
    // Should show deviation count for trade-2
    expect(screen.getByText('1 deviations')).toBeInTheDocument();
  });

  it('handles pagination correctly', async () => {
    // Create more trades to test pagination
    const manyTrades = Array.from({ length: 25 }, (_, i) => ({
      id: `trade-${i}`,
      currencyPair: 'EURUSD',
      side: 'BUY' as const,
      timestamp: Date.now() - (i * 3600000),
      pnl: 100,
      strategyId: 'strategy-1',
      adherenceScore: 80
    }));

    render(
      <LinkedTradesView 
        {...defaultProps} 
        trades={manyTrades}
      />
    );
    
    // Should show pagination controls
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    
    // Click next page
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });
  });

  it('disables pagination buttons appropriately', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    // With only 5 trades, no pagination should be shown
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('shows empty state when no trades match filters', async () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/Search trades/);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });
    
    await waitFor(() => {
      expect(screen.getByText('No trades found matching the current filters.')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    // Should show formatted dates
    expect(screen.getByText(/Mar \d+, 2024 at \d+:\d+ [AP]M/)).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('shows correct colors for P&L values', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    // Positive P&L should have green color class
    const positivePnL = screen.getByText('$150.00');
    expect(positivePnL).toHaveClass('text-green-600');
    
    // Negative P&L should have red color class  
    const negativePnL = screen.getByText('-$75.00');
    expect(negativePnL).toHaveClass('text-red-600');
  });

  it('shows correct colors for adherence scores', () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    // High adherence (95%) should be green
    const highAdherence = screen.getByText('95.0%');
    expect(highAdherence).toHaveClass('text-green-600');
    
    // Low adherence (60%) should be red
    const lowAdherence = screen.getByText('60.0%');
    expect(lowAdherence).toHaveClass('text-red-600');
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

    render(
      <LinkedTradesView 
        {...defaultProps} 
        trades={tradesWithoutAdherence}
      />
    );
    
    expect(screen.getByText('Not scored')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Average adherence should be 0
  });

  it('handles open trades (undefined P&L)', () => {
    const tradesWithOpen: TradeWithStrategy[] = [
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

    render(
      <LinkedTradesView 
        {...defaultProps} 
        trades={tradesWithOpen}
      />
    );
    
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LinkedTradesView {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('searches in trade notes', async () => {
    render(<LinkedTradesView {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/Search trades/);
    fireEvent.change(searchInput, { target: { value: 'Good entry' } });
    
    await waitFor(() => {
      // Should find trade-1 which has "Good entry timing" in notes
      expect(screen.getByText('Showing 1 of 1 trades')).toBeInTheDocument();
    });
  });

  it('shows View All button when more than 10 trades', () => {
    const manyTrades = Array.from({ length: 15 }, (_, i) => ({
      id: `trade-${i}`,
      currencyPair: 'EURUSD',
      side: 'BUY' as const,
      timestamp: Date.now() - (i * 3600000),
      pnl: 100,
      strategyId: 'strategy-1',
      adherenceScore: 80
    }));

    render(
      <LinkedTradesView 
        {...defaultProps} 
        trades={manyTrades}
      />
    );
    
    // Should show first 10 trades and "View All" button
    expect(screen.getByText('Showing 10 of 15 trades')).toBeInTheDocument();
  });
});

describe('LinkedTradesView Sorting', () => {
  const mockTrades: TradeWithStrategy[] = [
    {
      id: 'trade-1',
      currencyPair: 'EURUSD',
      side: 'BUY',
      timestamp: 1000,
      pnl: 100,
      strategyId: 'strategy-1',
      adherenceScore: 80
    },
    {
      id: 'trade-2',
      currencyPair: 'GBPUSD',
      side: 'SELL',
      timestamp: 2000,
      pnl: 200,
      strategyId: 'strategy-1',
      adherenceScore: 90
    }
  ];

  it('toggles sort direction when clicking same column', async () => {
    render(
      <LinkedTradesView 
        trades={mockTrades}
        strategyName="Test"
        onNavigateToTrade={vi.fn()}
      />
    );
    
    const pnlHeader = screen.getByText('P&L');
    
    // First click - descending (200 first)
    fireEvent.click(pnlHeader);
    await waitFor(() => {
      const pnlValues = screen.getAllByText(/\$\d+\.\d{2}/);
      expect(pnlValues[0]).toHaveTextContent('$200.00');
    });
    
    // Second click - ascending (100 first)
    fireEvent.click(pnlHeader);
    await waitFor(() => {
      const pnlValues = screen.getAllByText(/\$\d+\.\d{2}/);
      expect(pnlValues[0]).toHaveTextContent('$100.00');
    });
  });

  it('sorts by currency pair alphabetically', async () => {
    render(
      <LinkedTradesView 
        trades={mockTrades}
        strategyName="Test"
        onNavigateToTrade={vi.fn()}
      />
    );
    
    const pairHeader = screen.getByText('Pair');
    fireEvent.click(pairHeader);
    
    await waitFor(() => {
      const pairs = screen.getAllByText(/USD/);
      // EURUSD should come before GBPUSD alphabetically
      expect(pairs[0]).toHaveTextContent('EURUSD');
    });
  });
});

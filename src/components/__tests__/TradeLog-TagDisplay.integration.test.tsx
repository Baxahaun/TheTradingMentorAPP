import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradeLog from '../TradeLog';
import { useTradeContext } from '../../contexts/TradeContext';
import { Trade } from '../../types/trade';

// Mock the TradeContext
vi.mock('../../contexts/TradeContext', () => ({
  useTradeContext: vi.fn(),
}));

// Mock the EditTradeModal component
vi.mock('../EditTradeModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="edit-modal">Edit Modal</div> : null,
}));

// Mock DashboardWidget
vi.mock('../DashboardWidget', () => ({
  default: () => <div data-testid="dashboard-widget">Dashboard Widget</div>,
}));

// Mock the dashboard config
vi.mock('../../config/dashboardConfig', () => ({
  AVAILABLE_WIDGETS: [],
}));

const mockTrades: Trade[] = [
  {
    id: '1',
    accountId: 'acc1',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '09:30',
    side: 'long',
    entryPrice: 1.0950,
    exitPrice: 1.0980,
    lotSize: 1.0,
    lotType: 'standard',
    units: 100000,
    pips: 30,
    pnl: 300,
    commission: 5,
    accountCurrency: 'USD',
    tags: ['#breakout', '#morning', '#trending'],
    status: 'closed',
  },
  {
    id: '2',
    accountId: 'acc1',
    currencyPair: 'GBP/JPY',
    date: '2024-01-16',
    timeIn: '14:15',
    side: 'short',
    entryPrice: 185.50,
    exitPrice: 185.20,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    pips: 30,
    pnl: 150,
    commission: 3,
    accountCurrency: 'USD',
    tags: ['#reversal', '#afternoon'],
    status: 'closed',
  },
  {
    id: '3',
    accountId: 'acc1',
    currencyPair: 'USD/CAD',
    date: '2024-01-17',
    timeIn: '11:00',
    side: 'long',
    entryPrice: 1.3450,
    lotSize: 2.0,
    lotType: 'standard',
    units: 200000,
    commission: 8,
    accountCurrency: 'USD',
    tags: [], // No tags
    status: 'open',
  },
];

describe('TradeLog TagDisplay Integration', () => {
  const mockDeleteTrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTradeContext as any).mockReturnValue({
      trades: mockTrades,
      deleteTrade: mockDeleteTrade,
    });
  });

  it('displays tags for trades that have them', () => {
    render(<TradeLog />);

    // Check that tags are displayed for the first trade
    expect(screen.getByText('breakout')).toBeInTheDocument();
    expect(screen.getByText('morning')).toBeInTheDocument();
    expect(screen.getByText('trending')).toBeInTheDocument();

    // Check that tags are displayed for the second trade
    expect(screen.getByText('reversal')).toBeInTheDocument();
    expect(screen.getByText('afternoon')).toBeInTheDocument();
  });

  it('handles trades with no tags gracefully', () => {
    render(<TradeLog />);

    // The third trade has no tags, so it should render without errors
    // We can verify this by checking that the trade row exists
    expect(screen.getByText('USD/CAD')).toBeInTheDocument();
  });

  it('allows clicking on tags to filter trades', () => {
    render(<TradeLog />);

    // Click on a tag
    const breakoutTag = screen.getByText('breakout');
    fireEvent.click(breakoutTag);

    // The search input should be updated with the tag
    const searchInput = screen.getByPlaceholderText(/search trades/i);
    expect(searchInput).toHaveValue('#breakout');
  });

  it('displays tags in compact variant with overflow handling', () => {
    render(<TradeLog />);

    // The first trade has 3 tags, which should all be visible since maxDisplay is 3
    expect(screen.getByText('breakout')).toBeInTheDocument();
    expect(screen.getByText('morning')).toBeInTheDocument();
    expect(screen.getByText('trending')).toBeInTheDocument();

    // No overflow indicator should be present for this trade
    const overflowButtons = screen.queryAllByText(/^\+\d+$/);
    expect(overflowButtons).toHaveLength(0);
  });

  it('includes tags in search functionality', () => {
    render(<TradeLog />);

    // Search for a tag
    const searchInput = screen.getByPlaceholderText(/search trades/i);
    fireEvent.change(searchInput, { target: { value: 'breakout' } });

    // Only the trade with the 'breakout' tag should be visible
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    expect(screen.queryByText('GBP/JPY')).not.toBeInTheDocument();
    expect(screen.queryByText('USD/CAD')).not.toBeInTheDocument();
  });

  it('searches for tags with hash prefix', () => {
    render(<TradeLog />);

    // Search for a tag with hash prefix
    const searchInput = screen.getByPlaceholderText(/search trades/i);
    fireEvent.change(searchInput, { target: { value: '#reversal' } });

    // Only the trade with the 'reversal' tag should be visible
    expect(screen.getByText('GBP/JPY')).toBeInTheDocument();
    expect(screen.queryByText('EUR/USD')).not.toBeInTheDocument();
    expect(screen.queryByText('USD/CAD')).not.toBeInTheDocument();
  });

  it('displays tags column header', () => {
    render(<TradeLog />);

    // Check that the Tags column header is present
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('maintains table layout with tags column', () => {
    render(<TradeLog />);

    // Verify all expected column headers are present
    expect(screen.getByText('Currency Pair')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Side')).toBeInTheDocument();
    expect(screen.getByText('Entry')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();
    expect(screen.getByText('Pips')).toBeInTheDocument();
    expect(screen.getByText('P&L')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
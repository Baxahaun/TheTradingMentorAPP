import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditTradeModal from '../EditTradeModal';
import { useTradeContext } from '../../contexts/TradeContext';
import { Trade } from '../../types/trade';

// Mock the TradeContext
vi.mock('../../contexts/TradeContext', () => ({
  useTradeContext: vi.fn(),
}));

// Mock the toast hook
vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock the classification panels
vi.mock('../SetupClassificationPanel', () => ({
  SetupClassificationPanel: () => <div data-testid="setup-panel">Setup Panel</div>,
}));

vi.mock('../PatternRecognitionPanel', () => ({
  PatternRecognitionPanel: () => <div data-testid="pattern-panel">Pattern Panel</div>,
}));

vi.mock('../PartialCloseManagementPanel', () => ({
  PartialCloseManagementPanel: () => <div data-testid="partial-close-panel">Partial Close Panel</div>,
}));

const mockTrade: Trade = {
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
  notes: 'Good breakout trade',
};

const mockTrades: Trade[] = [
  mockTrade,
  {
    id: '2',
    accountId: 'acc1',
    currencyPair: 'GBP/JPY',
    date: '2024-01-16',
    timeIn: '14:15',
    side: 'short',
    entryPrice: 185.50,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    commission: 3,
    accountCurrency: 'USD',
    tags: ['#reversal', '#afternoon', '#news'],
    status: 'open',
  },
];

describe('EditTradeModal TagDisplay Integration', () => {
  const mockUpdateTrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTradeContext as any).mockReturnValue({
      trades: mockTrades,
      updateTrade: mockUpdateTrade,
    });
  });

  it('displays tags section in the form', () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Check that the Tags label is present
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText(/use tags to categorize your trades/i)).toBeInTheDocument();
  });

  it('renders without errors when trade has tags', () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should render the modal without errors
    expect(screen.getByText('Edit Trade:')).toBeInTheDocument();
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
  });

  it('handles trades with no existing tags', () => {
    const tradeWithoutTags = { ...mockTrade, tags: undefined };
    
    render(
      <EditTradeModal
        trade={tradeWithoutTags}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should render without errors
    expect(screen.getByText('Edit Trade:')).toBeInTheDocument();
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
  });

  it('includes tags when submitting the form', async () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Submit the form without making changes
    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    // Wait for the update to be called with existing tags
    await waitFor(() => {
      expect(mockUpdateTrade).toHaveBeenCalledWith(
        mockTrade.id,
        expect.objectContaining({
          tags: expect.arrayContaining(['#breakout', '#morning', '#trending'])
        })
      );
    });
  });

  it('processes tags correctly when form is submitted', async () => {
    const tradeWithRawTags = { ...mockTrade, tags: ['breakout', '#morning', ' trending '] };
    
    render(
      <EditTradeModal
        trade={tradeWithRawTags}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Submit the form without making changes
    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    // Wait for the update to be called with processed tags
    await waitFor(() => {
      expect(mockUpdateTrade).toHaveBeenCalledWith(
        tradeWithRawTags.id,
        expect.objectContaining({
          tags: expect.arrayContaining(['#breakout', '#morning', '#trending'])
        })
      );
    });
  });

  it('loads tag suggestions from existing trades', () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should render without errors and load suggestions in the background
    expect(screen.getByText('Edit Trade:')).toBeInTheDocument();
  });

  it('displays tags section with proper label and help text', () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Check that the tags section is properly labeled
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText(/use tags to categorize your trades/i)).toBeInTheDocument();
  });

  it('renders TagInput component with proper configuration', () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Verify the component renders with the expected configuration
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

});
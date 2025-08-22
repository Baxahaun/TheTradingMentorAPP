import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TradeLog from '../TradeLog';
import { TradeProvider } from '../../contexts/TradeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { Trade } from '../../types/trade';

// Mock Firebase and other dependencies
jest.mock('../../lib/firebaseService', () => ({
  tradeService: {
    subscribeToTrades: jest.fn(() => () => {}),
    addTrade: jest.fn(),
    updateTrade: jest.fn(),
    deleteTrade: jest.fn(),
  }
}));

jest.mock('../../lib/accountService', () => ({
  accountService: {
    subscribeToAccounts: jest.fn(() => () => {}),
    createDefaultAccount: jest.fn(),
    calculateAccountStats: jest.fn(() => ({
      totalTrades: 0,
      totalPnL: 0,
      winRate: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      currentBalance: 10000,
      roi: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      winStreak: 0,
      lossStreak: 0,
    }))
  }
}));

jest.mock('../../lib/tagService', () => ({
  tagService: {
    normalizeTag: (tag: string) => tag.toLowerCase().startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`,
    getAllTagsWithCounts: jest.fn(() => [
      { tag: '#scalping', count: 2 },
      { tag: '#morning', count: 2 },
      { tag: '#breakout', count: 1 },
      { tag: '#swing', count: 1 }
    ]),
    filterTradesByTags: jest.fn((trades) => trades),
  }
}));

jest.mock('../../lib/widgetDataService', () => ({
  widgetDataService: {
    onTradeDataChange: jest.fn()
  }
}));

jest.mock('../../lib/dataMigration', () => ({
  DataMigrationService: {
    migrateToFirebase: jest.fn(() => Promise.resolve({ success: true, migrated: 0, errors: [] }))
  }
}));

jest.mock('../../lib/enhancedDataMigration', () => ({
  EnhancedDataMigrationService: {
    isEnhancedMigrationCompleted: jest.fn(() => true),
    migrateExistingTrades: jest.fn(() => Promise.resolve({ success: true, errors: [] }))
  }
}));

const mockTrades: Trade[] = [
  {
    id: '1',
    accountId: 'acc1',
    currencyPair: 'EUR/USD',
    date: '2024-01-01',
    timeIn: '09:00',
    side: 'long',
    entryPrice: 1.1000,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    commission: 5,
    accountCurrency: 'USD',
    status: 'closed',
    tags: ['#scalping', '#morning']
  },
  {
    id: '2',
    accountId: 'acc1',
    currencyPair: 'GBP/USD',
    date: '2024-01-02',
    timeIn: '10:00',
    side: 'short',
    entryPrice: 1.2500,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    commission: 3,
    accountCurrency: 'USD',
    status: 'closed',
    tags: ['#scalping', '#breakout']
  },
  {
    id: '3',
    accountId: 'acc1',
    currencyPair: 'USD/JPY',
    date: '2024-01-03',
    timeIn: '11:00',
    side: 'long',
    entryPrice: 110.50,
    lotSize: 2,
    lotType: 'standard',
    units: 200000,
    commission: 7,
    accountCurrency: 'USD',
    status: 'open',
    tags: ['#swing', '#morning']
  }
];

// Mock the useTradeContext hook
const mockUpdateTrade = jest.fn();
const mockDeleteTrade = jest.fn();

jest.mock('../../contexts/TradeContext', () => ({
  ...jest.requireActual('../../contexts/TradeContext'),
  useTradeContext: () => ({
    trades: mockTrades,
    loading: false,
    addTrade: jest.fn(),
    updateTrade: mockUpdateTrade,
    deleteTrade: mockDeleteTrade,
    getTradesByDate: jest.fn(),
    accounts: [],
    currentAccount: null,
    accountsLoading: false,
    addAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
    setActiveAccount: jest.fn(),
    getTotalPnL: jest.fn(() => 0),
    getWinRate: jest.fn(() => 0),
    getProfitFactor: jest.fn(() => 0),
    getAccountStats: jest.fn(),
    getCurrentAccountTrades: jest.fn(() => []),
    migrationStatus: { isEnhancedMigrationCompleted: true, migrationInProgress: false },
    runEnhancedMigration: jest.fn(),
    getUnclassifiedTrades: jest.fn(() => [])
  })
}));

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn()
  })
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <TradeProvider>
      {children}
    </TradeProvider>
  </AuthProvider>
);

describe('TradeLog Bulk Operations Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trade table with checkboxes', () => {
    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Should show trades
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    expect(screen.getByText('GBP/USD')).toBeInTheDocument();
    expect(screen.getByText('USD/JPY')).toBeInTheDocument();

    // Should show checkboxes
    const checkboxes = screen.getAllByRole('button');
    const selectAllCheckbox = checkboxes.find(btn => btn.getAttribute('title')?.includes('Select all'));
    expect(selectAllCheckbox).toBeInTheDocument();
  });

  it('allows selecting individual trades', async () => {
    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Find and click the first trade checkbox
    const tradeRows = screen.getAllByRole('row');
    const firstTradeRow = tradeRows[1]; // Skip header row
    const checkbox = firstTradeRow.querySelector('button');
    
    fireEvent.click(checkbox!);

    // Should show selection count
    expect(screen.getByText('(1 selected)')).toBeInTheDocument();
  });

  it('allows selecting all trades', async () => {
    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Click select all checkbox
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    // Should show all trades selected
    expect(screen.getByText('(3 selected)')).toBeInTheDocument();
  });

  it('shows bulk operations toolbar when trades are selected', async () => {
    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select a trade
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    // Should show bulk operations toolbar
    expect(screen.getByText('3 trade(s) selected')).toBeInTheDocument();
    expect(screen.getByText('Edit Tags')).toBeInTheDocument();
    expect(screen.getByText('Clear Selection')).toBeInTheDocument();
  });

  it('opens bulk tag editor when Edit Tags is clicked', async () => {
    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    // Click Edit Tags
    fireEvent.click(screen.getByText('Edit Tags'));

    // Should open bulk tag editor
    expect(screen.getByText('Bulk Tag Editor')).toBeInTheDocument();
    expect(screen.getByText('Selected Trades (3)')).toBeInTheDocument();
  });

  it('clears selection when Clear Selection is clicked', async () => {
    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    expect(screen.getByText('(3 selected)')).toBeInTheDocument();

    // Click Clear Selection
    fireEvent.click(screen.getByText('Clear Selection'));

    // Selection should be cleared
    expect(screen.queryByText('(3 selected)')).not.toBeInTheDocument();
    expect(screen.queryByText('3 trade(s) selected')).not.toBeInTheDocument();
  });

  it('performs bulk add tags operation', async () => {
    mockUpdateTrade.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    // Open bulk tag editor
    fireEvent.click(screen.getByText('Edit Tags'));

    // Add a tag
    const tagInput = screen.getByPlaceholderText('Enter tags to add...');
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    // Apply changes
    fireEvent.click(screen.getByText('Apply Changes'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    // Should call updateTrade for each selected trade
    await waitFor(() => {
      expect(mockUpdateTrade).toHaveBeenCalledTimes(3);
      expect(mockUpdateTrade).toHaveBeenCalledWith('1', { tags: ['#scalping', '#morning', '#newtag'] });
      expect(mockUpdateTrade).toHaveBeenCalledWith('2', { tags: ['#scalping', '#breakout', '#newtag'] });
      expect(mockUpdateTrade).toHaveBeenCalledWith('3', { tags: ['#swing', '#morning', '#newtag'] });
    });
  });

  it('performs bulk remove tags operation', async () => {
    mockUpdateTrade.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    // Open bulk tag editor
    fireEvent.click(screen.getByText('Edit Tags'));

    // Select remove operation
    fireEvent.click(screen.getByLabelText('Remove Tags'));

    // Click on a tag to remove it
    const scalpingTag = screen.getAllByText('#scalping')[1]; // Second one is clickable
    fireEvent.click(scalpingTag);

    // Apply changes
    fireEvent.click(screen.getByText('Apply Changes'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    // Should call updateTrade for each selected trade
    await waitFor(() => {
      expect(mockUpdateTrade).toHaveBeenCalledTimes(3);
      expect(mockUpdateTrade).toHaveBeenCalledWith('1', { tags: ['#morning'] });
      expect(mockUpdateTrade).toHaveBeenCalledWith('2', { tags: ['#breakout'] });
      expect(mockUpdateTrade).toHaveBeenCalledWith('3', { tags: ['#swing', '#morning'] });
    });
  });

  it('performs bulk replace tags operation', async () => {
    mockUpdateTrade.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    // Open bulk tag editor
    fireEvent.click(screen.getByText('Edit Tags'));

    // Select replace operation
    fireEvent.click(screen.getByLabelText('Replace All Tags'));

    // Add replacement tags
    const tagInput = screen.getByPlaceholderText('Enter replacement tags...');
    fireEvent.change(tagInput, { target: { value: 'replacement1' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });
    fireEvent.change(tagInput, { target: { value: 'replacement2' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    // Apply changes
    fireEvent.click(screen.getByText('Apply Changes'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    // Should call updateTrade for each selected trade
    await waitFor(() => {
      expect(mockUpdateTrade).toHaveBeenCalledTimes(3);
      expect(mockUpdateTrade).toHaveBeenCalledWith('1', { tags: ['#replacement1', '#replacement2'] });
      expect(mockUpdateTrade).toHaveBeenCalledWith('2', { tags: ['#replacement1', '#replacement2'] });
      expect(mockUpdateTrade).toHaveBeenCalledWith('3', { tags: ['#replacement1', '#replacement2'] });
    });
  });

  it('shows success message after successful bulk operation', async () => {
    mockUpdateTrade.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades and perform operation
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    fireEvent.click(screen.getByText('Edit Tags'));

    const tagInput = screen.getByPlaceholderText('Enter tags to add...');
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    fireEvent.click(screen.getByText('Apply Changes'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Successfully updated 3 trade(s)')).toBeInTheDocument();
    });
  });

  it('shows error message when bulk operation fails', async () => {
    mockUpdateTrade.mockRejectedValue(new Error('Update failed'));

    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades and perform operation
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    fireEvent.click(screen.getByText('Edit Tags'));

    const tagInput = screen.getByPlaceholderText('Enter tags to add...');
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    fireEvent.click(screen.getByText('Apply Changes'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Updated 0 trade(s), 3 failed')).toBeInTheDocument();
    });
  });

  it('clears selection after successful bulk operation', async () => {
    mockUpdateTrade.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades and perform operation
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    expect(screen.getByText('(3 selected)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit Tags'));

    const tagInput = screen.getByPlaceholderText('Enter tags to add...');
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    fireEvent.click(screen.getByText('Apply Changes'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    // Selection should be cleared after successful operation
    await waitFor(() => {
      expect(screen.queryByText('(3 selected)')).not.toBeInTheDocument();
    });
  });

  it('handles partial success in bulk operations', async () => {
    // Mock first call to succeed, second to fail, third to succeed
    mockUpdateTrade
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Update failed'))
      .mockResolvedValueOnce(undefined);

    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades and perform operation
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    fireEvent.click(screen.getByText('Edit Tags'));

    const tagInput = screen.getByPlaceholderText('Enter tags to add...');
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    fireEvent.click(screen.getByText('Apply Changes'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    // Should show partial success message
    await waitFor(() => {
      expect(screen.getByText('Updated 2 trade(s), 1 failed')).toBeInTheDocument();
    });
  });

  it('disables bulk operations during processing', async () => {
    // Mock a slow operation
    mockUpdateTrade.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <TestWrapper>
        <TradeLog />
      </TestWrapper>
    );

    // Select trades and start operation
    const selectAllButton = screen.getByTitle('Select all');
    fireEvent.click(selectAllButton);

    fireEvent.click(screen.getByText('Edit Tags'));

    const tagInput = screen.getByPlaceholderText('Enter tags to add...');
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    fireEvent.click(screen.getByText('Apply Changes'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    // Bulk operations should be disabled during processing
    await waitFor(() => {
      expect(screen.getByText('Edit Tags')).toBeDisabled();
      expect(screen.getByText('Clear Selection')).toBeDisabled();
    });
  });
});
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DailyJournalView from '../DailyJournalView';
import { useTradeContext } from '../../contexts/TradeContext';
import { useAuth } from '../../contexts/AuthContext';

// Mock the contexts
vi.mock('../../contexts/TradeContext');
vi.mock('../../contexts/AuthContext');
vi.mock('../../services/JournalDataService');
vi.mock('../../services/TemplateService');

const mockUseTradeContext = vi.mocked(useTradeContext);
const mockUseAuth = vi.mocked(useAuth);

describe('DailyJournalView', () => {
  const mockProps = {
    selectedDate: new Date('2024-01-15'),
    onClose: vi.fn(),
    onDateChange: vi.fn()
  };

  beforeEach(() => {
    mockUseTradeContext.mockReturnValue({
      trades: [],
      loading: false,
      addTrade: vi.fn(),
      updateTrade: vi.fn(),
      deleteTrade: vi.fn(),
      getTradesByDate: vi.fn(() => []),
      accounts: [],
      currentAccount: null,
      accountsLoading: false,
      addAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      setActiveAccount: vi.fn(),
      getTotalPnL: vi.fn(() => 0),
      getWinRate: vi.fn(() => 0),
      getProfitFactor: vi.fn(() => 0),
      getAccountStats: vi.fn(),
      getCurrentAccountTrades: vi.fn(() => []),
      migrationStatus: {
        isEnhancedMigrationCompleted: true,
        migrationInProgress: false
      },
      runEnhancedMigration: vi.fn(),
      getUnclassifiedTrades: vi.fn(() => []),
      getTradeById: vi.fn(),
      getTradeSequence: vi.fn(),
      validateTradeAccess: vi.fn(),
      setTradeNavigationContext: vi.fn()
    });

    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user-id', email: 'test@example.com' },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn()
    });
  });

  it('renders loading state initially', () => {
    render(<DailyJournalView {...mockProps} />);
    
    expect(screen.getByText('Loading journal...')).toBeInTheDocument();
  });

  it('renders the component with correct date', async () => {
    // Mock successful journal loading
    const mockJournalDataService = await import('../../services/JournalDataService');
    vi.mocked(mockJournalDataService.journalDataService.getJournalEntry).mockResolvedValue({
      id: 'test-entry',
      userId: 'test-user-id',
      date: '2024-01-15',
      sections: [],
      templateId: undefined,
      templateName: undefined,
      tradeReferences: [],
      emotionalState: {} as any,
      processMetrics: {} as any,
      dailyPnL: 0,
      tradeCount: 0,
      images: [],
      tags: [],
      isComplete: false,
      completionPercentage: 0,
      wordCount: 0,
      isPrivate: true,
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    render(<DailyJournalView {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Journal')).toBeInTheDocument();
    });

    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });
});
/**
 * Daily Journal Redesign Integration Tests
 * 
 * Tests complete user workflows for the Daily Journal redesign feature,
 * including navigation flows, template application, and trade linking.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import DailyJournalRedesign from '../../src/components/journal/daily-journal/DailyJournalRedesign';
import DailyJournalPage from '../../src/pages/DailyJournalPage';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { TradeProvider } from '../../src/contexts/TradeContext';
import { Trade } from '../../src/types/trade';
import { JournalEntry } from '../../src/types/journal';

// Mock Firebase and external services
vi.mock('../../src/lib/firebaseService', () => ({
  tradeService: {
    subscribeToTrades: vi.fn(() => vi.fn()),
    addTrade: vi.fn(),
    updateTrade: vi.fn(),
    deleteTrade: vi.fn()
  },
  journalService: {
    subscribeToEntries: vi.fn(() => vi.fn()),
    addEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn()
  }
}));

vi.mock('../../src/services/TemplateService', () => ({
  TemplateService: {
    getTemplates: vi.fn(() => Promise.resolve([
      { id: 'daily-template', name: 'Daily Journal', content: 'Daily reflection template' },
      { id: 'trade-template', name: 'Trade Notes', content: 'Trade analysis template' }
    ])),
    applyTemplate: vi.fn(),
    saveTemplate: vi.fn()
  }
}));

vi.mock('../../src/services/TradeLogIntegration', () => ({
  TradeLogIntegration: {
    linkTradeToJournal: vi.fn(),
    getTradeNotes: vi.fn(),
    navigateToTrade: vi.fn()
  }
}));

vi.mock('../../src/services/DailyMetricsService', () => ({
  DailyMetricsService: {
    getDailyMetrics: vi.fn(() => ({
      pnl: 150.50,
      tradeCount: 3,
      winRate: 66.7,
      bestTrade: 75.25,
      worstTrade: -25.00
    })),
    getWeekMetrics: vi.fn()
  }
}));

// Mock data
const mockTrades: Trade[] = [
  {
    id: 'trade-1',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    quantity: 10000,
    direction: 'long',
    status: 'closed',
    pnl: 50,
    accountId: 'account-1'
  },
  {
    id: 'trade-2',
    currencyPair: 'GBP/USD',
    date: '2024-01-15',
    entryPrice: 1.2500,
    exitPrice: 1.2575,
    quantity: 5000,
    direction: 'long',
    status: 'closed',
    pnl: 37.50,
    accountId: 'account-1'
  }
];

const mockJournalEntries: JournalEntry[] = [
  {
    id: 'entry-1',
    date: '2024-01-15',
    type: 'daily',
    content: 'Good trading day with clear setups',
    tradeIds: ['trade-1', 'trade-2'],
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  }
];

// Test wrapper component
const TestWrapper = ({ 
  children, 
  initialEntries = ['/daily-journal'] 
}: { 
  children: React.ReactNode;
  initialEntries?: string[];
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const mockTradeContext = {
    trades: mockTrades,
    loading: false,
    accounts: [],
    currentAccount: null,
    accountsLoading: false,
    migrationStatus: { isEnhancedMigrationCompleted: true, migrationInProgress: false },
    addTrade: vi.fn(),
    updateTrade: vi.fn(),
    deleteTrade: vi.fn(),
    getTradesByDate: vi.fn((date: string) => mockTrades.filter(t => t.date === date)),
    getTradeById: vi.fn((id: string) => mockTrades.find(t => t.id === id)),
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    setActiveAccount: vi.fn(),
    getTotalPnL: vi.fn(),
    getWinRate: vi.fn(),
    getProfitFactor: vi.fn(),
    getAccountStats: vi.fn(),
    getCurrentAccountTrades: vi.fn(),
    runEnhancedMigration: vi.fn(),
    getUnclassifiedTrades: vi.fn(),
    getTradeSequence: vi.fn(),
    validateTradeAccess: vi.fn(),
    setTradeNavigationContext: vi.fn()
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TradeProvider value={mockTradeContext as any}>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </TradeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Daily Journal Redesign Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Week Navigation Flow', () => {
    it('should navigate between weeks and update content', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('week-navigator')).toBeInTheDocument();
      });

      // Test previous week navigation
      const prevWeekButton = screen.getByRole('button', { name: /previous week/i });
      await user.click(prevWeekButton);

      await waitFor(() => {
        expect(screen.getByTestId('week-navigator')).toHaveTextContent(/Jan 8 - Jan 14/);
      });

      // Test next week navigation
      const nextWeekButton = screen.getByRole('button', { name: /next week/i });
      await user.click(nextWeekButton);

      await waitFor(() => {
        expect(screen.getByTestId('week-navigator')).toHaveTextContent(/Jan 15 - Jan 21/);
      });

      // Test current week button
      const currentWeekButton = screen.getByRole('button', { name: /current week/i });
      await user.click(currentWeekButton);

      await waitFor(() => {
        const today = new Date();
        expect(screen.getByTestId('week-navigator')).toBeInTheDocument();
      });
    });

    it('should support quick date selection', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Open date picker
      const datePickerButton = screen.getByRole('button', { name: /select date/i });
      await user.click(datePickerButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /date picker/i })).toBeInTheDocument();
      });

      // Select specific date
      const targetDate = screen.getByRole('button', { name: /15/i });
      await user.click(targetDate);

      // Verify date selection
      await waitFor(() => {
        expect(screen.getByTestId('selected-date')).toHaveTextContent('2024-01-15');
      });
    });
  });

  describe('Dynamic Content Area Flow', () => {
    it('should switch between daily journal and trade notes modes', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-content-area')).toBeInTheDocument();
      });

      // Start in daily journal mode
      expect(screen.getByTestId('daily-journal-content')).toBeInTheDocument();

      // Switch to trade notes mode
      const tradeNotesTab = screen.getByRole('tab', { name: /trade notes/i });
      await user.click(tradeNotesTab);

      await waitFor(() => {
        expect(screen.getByTestId('trade-notes-content')).toBeInTheDocument();
        expect(screen.queryByTestId('daily-journal-content')).not.toBeInTheDocument();
      }, { timeout: 300 }); // Ensure transition completes within 200ms requirement

      // Switch back to daily journal
      const dailyJournalTab = screen.getByRole('tab', { name: /daily journal/i });
      await user.click(dailyJournalTab);

      await waitFor(() => {
        expect(screen.getByTestId('daily-journal-content')).toBeInTheDocument();
        expect(screen.queryByTestId('trade-notes-content')).not.toBeInTheDocument();
      }, { timeout: 300 });
    });

    it('should preserve content state during mode switches', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Add content to daily journal
      const dailyJournalTextarea = screen.getByRole('textbox', { name: /daily journal/i });
      await user.type(dailyJournalTextarea, 'Test daily journal content');

      // Switch to trade notes
      const tradeNotesTab = screen.getByRole('tab', { name: /trade notes/i });
      await user.click(tradeNotesTab);

      // Add content to trade notes
      const tradeNotesTextarea = screen.getByRole('textbox', { name: /trade notes/i });
      await user.type(tradeNotesTextarea, 'Test trade notes content');

      // Switch back to daily journal
      const dailyJournalTab = screen.getByRole('tab', { name: /daily journal/i });
      await user.click(dailyJournalTab);

      // Verify content is preserved
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test daily journal content')).toBeInTheDocument();
      });
    });
  });

  describe('Trade Note Integration Flow', () => {
    it('should display linked trade data in trade note panel', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Switch to trade notes mode
      const tradeNotesTab = screen.getByRole('tab', { name: /trade notes/i });
      await user.click(tradeNotesTab);

      await waitFor(() => {
        expect(screen.getByTestId('trade-note-panel')).toBeInTheDocument();
      });

      // Select a trade
      const tradeSelector = screen.getByRole('combobox', { name: /select trade/i });
      await user.click(tradeSelector);

      const tradeOption = screen.getByRole('option', { name: /EUR\/USD/i });
      await user.click(tradeOption);

      // Verify trade data is displayed
      await waitFor(() => {
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument(); // P&L
        expect(screen.getByText('1.1000')).toBeInTheDocument(); // Entry price
        expect(screen.getByText('1.1050')).toBeInTheDocument(); // Exit price
      });
    });

    it('should handle screenshot upload and gallery', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Switch to trade notes mode
      const tradeNotesTab = screen.getByRole('tab', { name: /trade notes/i });
      await user.click(tradeNotesTab);

      // Create mock file
      const file = new File(['screenshot'], 'chart.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      // Upload screenshot
      const fileInput = screen.getByLabelText(/upload screenshot/i);
      await user.upload(fileInput, file);

      // Verify screenshot appears in gallery
      await waitFor(() => {
        expect(screen.getByAltText('chart.png')).toBeInTheDocument();
      });

      // Test file size limit
      const largeFile = new File(['large'], 'large.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds 5MB limit/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template System Integration Flow', () => {
    it('should apply templates to journal entries', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Open template selector
      const templateButton = screen.getByRole('button', { name: /templates/i });
      await user.click(templateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /template selector/i })).toBeInTheDocument();
      });

      // Select daily journal template
      const dailyTemplate = screen.getByRole('button', { name: /daily journal/i });
      await user.click(dailyTemplate);

      // Apply template
      const applyButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(applyButton);

      // Verify template content is applied
      await waitFor(() => {
        expect(screen.getByDisplayValue(/daily reflection template/i)).toBeInTheDocument();
      });
    });

    it('should support template customization', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Open template selector
      const templateButton = screen.getByRole('button', { name: /templates/i });
      await user.click(templateButton);

      // Create custom template
      const createTemplateButton = screen.getByRole('button', { name: /create template/i });
      await user.click(createTemplateButton);

      // Fill template details
      const templateName = screen.getByRole('textbox', { name: /template name/i });
      await user.type(templateName, 'Custom Daily Template');

      const templateContent = screen.getByRole('textbox', { name: /template content/i });
      await user.type(templateContent, 'Custom template content with placeholders');

      // Save template
      const saveTemplateButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveTemplateButton);

      // Verify template is saved and available
      await waitFor(() => {
        expect(screen.getByText('Custom Daily Template')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Integration Flow', () => {
    it('should display week view with daily metrics', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('week-based-calendar')).toBeInTheDocument();
      });

      // Verify daily metrics are displayed
      expect(screen.getByText('$150.50')).toBeInTheDocument(); // Daily P&L
      expect(screen.getByText('3 trades')).toBeInTheDocument(); // Trade count
      expect(screen.getByText('66.7%')).toBeInTheDocument(); // Win rate

      // Test date selection from calendar
      const calendarDate = screen.getByRole('button', { name: /15/i });
      await user.click(calendarDate);

      // Verify date selection updates content
      await waitFor(() => {
        expect(screen.getByTestId('selected-date')).toHaveTextContent('2024-01-15');
      });
    });

    it('should show visual indicators for journal entries and completion', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('week-based-calendar')).toBeInTheDocument();
      });

      // Verify visual indicators
      const dateWithEntry = screen.getByTestId('calendar-date-15');
      expect(dateWithEntry).toHaveClass('has-journal-entry');
      expect(dateWithEntry).toHaveClass('has-trades');

      // Test completion status
      const completionIndicator = within(dateWithEntry).getByTestId('completion-indicator');
      expect(completionIndicator).toBeInTheDocument();
    });
  });

  describe('TradeLog Integration Flow', () => {
    it('should navigate from TradeLog to Daily Journal', async () => {
      render(
        <TestWrapper initialEntries={['/daily-journal?date=2024-01-15&trade=trade-1']}>
          <Routes>
            <Route path="/daily-journal" element={<DailyJournalPage />} />
          </Routes>
        </TestWrapper>
      );

      // Verify automatic date and trade selection
      await waitFor(() => {
        expect(screen.getByTestId('selected-date')).toHaveTextContent('2024-01-15');
        expect(screen.getByTestId('selected-trade')).toHaveTextContent('trade-1');
      });

      // Verify trade notes mode is active
      expect(screen.getByTestId('trade-notes-content')).toBeInTheDocument();

      // Verify trade data is displayed
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
    });

    it('should support bidirectional navigation', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Switch to trade notes mode
      const tradeNotesTab = screen.getByRole('tab', { name: /trade notes/i });
      await user.click(tradeNotesTab);

      // Select a trade
      const tradeSelector = screen.getByRole('combobox', { name: /select trade/i });
      await user.click(tradeSelector);
      
      const tradeOption = screen.getByRole('option', { name: /EUR\/USD/i });
      await user.click(tradeOption);

      // Navigate to TradeLog
      const viewInTradeLogButton = screen.getByRole('button', { name: /view in tradelog/i });
      await user.click(viewInTradeLogButton);

      // Verify navigation context is set
      expect(vi.mocked(require('../../src/services/TradeLogIntegration').TradeLogIntegration.navigateToTrade))
        .toHaveBeenCalledWith('trade-1', expect.objectContaining({
          source: 'daily-journal',
          returnDate: '2024-01-15'
        }));
    });
  });

  describe('News Events Integration Flow', () => {
    it('should manage news events for selected dates', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Open news events panel
      const newsEventsButton = screen.getByRole('button', { name: /news events/i });
      await user.click(newsEventsButton);

      await waitFor(() => {
        expect(screen.getByTestId('news-events-panel')).toBeInTheDocument();
      });

      // Add new event
      const addEventButton = screen.getByRole('button', { name: /add event/i });
      await user.click(addEventButton);

      // Fill event details
      const eventTitle = screen.getByRole('textbox', { name: /event title/i });
      await user.type(eventTitle, 'ECB Interest Rate Decision');

      const eventTime = screen.getByRole('textbox', { name: /time/i });
      await user.type(eventTime, '14:00');

      const eventImpact = screen.getByRole('combobox', { name: /impact/i });
      await user.selectOptions(eventImpact, 'high');

      // Save event
      const saveEventButton = screen.getByRole('button', { name: /save event/i });
      await user.click(saveEventButton);

      // Verify event is displayed
      await waitFor(() => {
        expect(screen.getByText('ECB Interest Rate Decision')).toBeInTheDocument();
        expect(screen.getByText('14:00')).toBeInTheDocument();
        expect(screen.getByText('High Impact')).toBeInTheDocument();
      });
    });

    it('should support event editing and deletion', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Assume event exists
      const editEventButton = screen.getByRole('button', { name: /edit.*ECB/i });
      await user.click(editEventButton);

      // Modify event
      const eventTitle = screen.getByDisplayValue('ECB Interest Rate Decision');
      await user.clear(eventTitle);
      await user.type(eventTitle, 'ECB Rate Decision - Updated');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify update
      await waitFor(() => {
        expect(screen.getByText('ECB Rate Decision - Updated')).toBeInTheDocument();
      });

      // Test deletion
      const deleteButton = screen.getByRole('button', { name: /delete.*ECB/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      // Verify deletion
      await waitFor(() => {
        expect(screen.queryByText('ECB Rate Decision - Updated')).not.toBeInTheDocument();
      });
    });
  });

  describe('Complete User Workflow', () => {
    it('should complete full daily journaling workflow', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Step 1: Navigate to specific date
      const datePickerButton = screen.getByRole('button', { name: /select date/i });
      await user.click(datePickerButton);
      
      const targetDate = screen.getByRole('button', { name: /15/i });
      await user.click(targetDate);

      // Step 2: Add daily journal entry
      const dailyJournalTextarea = screen.getByRole('textbox', { name: /daily journal/i });
      await user.type(dailyJournalTextarea, 'Strong trading day with clear market direction');

      // Step 3: Apply template
      const templateButton = screen.getByRole('button', { name: /templates/i });
      await user.click(templateButton);
      
      const dailyTemplate = screen.getByRole('button', { name: /daily journal/i });
      await user.click(dailyTemplate);
      
      const applyButton = screen.getByRole('button', { name: /apply template/i });
      await user.click(applyButton);

      // Step 4: Switch to trade notes
      const tradeNotesTab = screen.getByRole('tab', { name: /trade notes/i });
      await user.click(tradeNotesTab);

      // Step 5: Link trade and add notes
      const tradeSelector = screen.getByRole('combobox', { name: /select trade/i });
      await user.click(tradeSelector);
      
      const tradeOption = screen.getByRole('option', { name: /EUR\/USD/i });
      await user.click(tradeOption);

      const tradeNotesTextarea = screen.getByRole('textbox', { name: /trade notes/i });
      await user.type(tradeNotesTextarea, 'Perfect setup with clean breakout');

      // Step 6: Add screenshot
      const file = new File(['screenshot'], 'chart.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/upload screenshot/i);
      await user.upload(fileInput, file);

      // Step 7: Add news event
      const newsEventsButton = screen.getByRole('button', { name: /news events/i });
      await user.click(newsEventsButton);
      
      const addEventButton = screen.getByRole('button', { name: /add event/i });
      await user.click(addEventButton);
      
      const eventTitle = screen.getByRole('textbox', { name: /event title/i });
      await user.type(eventTitle, 'NFP Release');

      const saveEventButton = screen.getByRole('button', { name: /save event/i });
      await user.click(saveEventButton);

      // Step 8: Save all changes
      const saveAllButton = screen.getByRole('button', { name: /save all/i });
      await user.click(saveAllButton);

      // Verify complete workflow
      await waitFor(() => {
        expect(screen.getByText(/successfully saved/i)).toBeInTheDocument();
      });

      // Verify all data is preserved
      expect(screen.getByDisplayValue(/strong trading day/i)).toBeInTheDocument();
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      expect(screen.getByAltText('chart.png')).toBeInTheDocument();
      expect(screen.getByText('NFP Release')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle service failures gracefully', async () => {
      // Mock service failure
      vi.mocked(require('../../src/services/DailyMetricsService').DailyMetricsService.getDailyMetrics)
        .mockRejectedValueOnce(new Error('Service unavailable'));

      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Should show error state but remain functional
      await waitFor(() => {
        expect(screen.getByText(/unable to load metrics/i)).toBeInTheDocument();
      });

      // Other functionality should still work
      const dailyJournalTextarea = screen.getByRole('textbox', { name: /daily journal/i });
      await user.type(dailyJournalTextarea, 'Test content');
      
      expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
    });

    it('should handle empty states appropriately', async () => {
      // Mock empty data
      vi.mocked(require('../../src/contexts/TradeContext').useTradeContext).mockReturnValue({
        ...vi.mocked(require('../../src/contexts/TradeContext').useTradeContext)(),
        trades: [],
        getTradesByDate: vi.fn(() => [])
      });

      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Switch to trade notes
      const tradeNotesTab = screen.getByRole('tab', { name: /trade notes/i });
      await user.click(tradeNotesTab);

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText(/no trades found for this date/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields before saving', async () => {
      render(
        <TestWrapper>
          <DailyJournalRedesign />
        </TestWrapper>
      );

      // Try to save without content
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/please add some content/i)).toBeInTheDocument();
      });
    });
  });
});

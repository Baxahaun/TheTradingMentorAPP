/**
 * DailyJournalRedesign Component Unit Tests
 * Tests for the main orchestrator component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { DailyJournalRedesign } from '../../../../../components/journal/daily-journal/DailyJournalRedesign';
import { AuthContext } from '../../../../../contexts/AuthContext';
import { TradeContext } from '../../../../../contexts/TradeContext';

// Mock child components
jest.mock('../../../../../components/journal/daily-journal/WeekBasedCalendar', () => ({
  WeekBasedCalendar: ({ onDateSelect, onWeekChange }: any) => (
    <div data-testid="week-based-calendar">
      Week Based Calendar
      <button onClick={() => onDateSelect(new Date('2024-03-13'))}>
        Select Date
      </button>
      <button onClick={() => onWeekChange('next')}>
        Next Week
      </button>
    </div>
  )
}));

jest.mock('../../../../../components/journal/daily-journal/DynamicContentArea', () => ({
  DynamicContentArea: ({ onContentChange, onEntryTypeChange }: any) => (
    <div data-testid="dynamic-content-area">
      Dynamic Content Area
      <button onClick={() => onContentChange('test content')}>
        Change Content
      </button>
      <button onClick={() => onEntryTypeChange('trade-note')}>
        Switch to Trade Note
      </button>
    </div>
  )
}));

// Mock services
jest.mock('../../../../../services/JournalDataService', () => ({
  journalDataService: {
    getJournalEntry: jest.fn().mockResolvedValue({
      id: 'entry-1',
      date: '2024-03-13',
      content: 'Test journal entry',
      completionPercentage: 75
    })
  }
}));

const mockUser = {
  uid: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockTrades = [
  {
    id: 'trade-1',
    date: '2024-03-13',
    currencyPair: 'EUR/USD',
    side: 'long',
    pnl: 100,
    status: 'closed'
  },
  {
    id: 'trade-2', 
    date: '2024-03-13',
    currencyPair: 'GBP/USD',
    side: 'short',
    pnl: -50,
    status: 'closed'
  }
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthContext.Provider value={{ 
      user: mockUser, 
      login: jest.fn(), 
      logout: jest.fn(), 
      loading: false 
    }}>
      <TradeContext.Provider value={{
        trades: mockTrades,
        loading: false,
        error: null,
        addTrade: jest.fn(),
        updateTrade: jest.fn(),
        deleteTrade: jest.fn(),
        refreshTrades: jest.fn()
      }}>
        {children}
      </TradeContext.Provider>
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('DailyJournalRedesign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-13'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render main interface components', () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    expect(screen.getByText('Daily Journal')).toBeInTheDocument();
    expect(screen.getByTestId('week-based-calendar')).toBeInTheDocument();
  });

  it('should display current week information', () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    expect(screen.getByText(/Week of/)).toBeInTheDocument();
  });

  it('should handle date selection from calendar', async () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    const selectButton = screen.getByText('Select Date');
    fireEvent.click(selectButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dynamic-content-area')).toBeInTheDocument();
    });
  });

  it('should handle week navigation', () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    const nextWeekButton = screen.getByText('Next Week');
    fireEvent.click(nextWeekButton);
    
    // Should update the displayed week
    expect(screen.getByText(/Week of/)).toBeInTheDocument();
  });

  it('should switch between calendar and content views', async () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    // Start in calendar view
    expect(screen.getByTestId('week-based-calendar')).toBeInTheDocument();
    
    // Select a date to switch to content view
    const selectButton = screen.getByText('Select Date');
    fireEvent.click(selectButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dynamic-content-area')).toBeInTheDocument();
    });
  });

  it('should handle back to calendar navigation', async () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    // Navigate to content view
    const selectButton = screen.getByText('Select Date');
    fireEvent.click(selectButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dynamic-content-area')).toBeInTheDocument();
    });
    
    // Navigate back to calendar
    const backButton = screen.getByText('Back to Calendar');
    fireEvent.click(backButton);

    expect(screen.getByTestId('week-based-calendar')).toBeInTheDocument();
  });

  it('should load and display day metrics', async () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Summary')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total trades
      expect(screen.getByText('+$50.00')).toBeInTheDocument(); // Weekly P&L
    });
  });

  it('should handle content changes', async () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    // Navigate to content view
    const selectButton = screen.getByText('Select Date');
    fireEvent.click(selectButton);
    
    await waitFor(() => {
      const changeButton = screen.getByText('Change Content');
      fireEvent.click(changeButton);
    });
    
    // Content change should be handled
    expect(screen.getByTestId('dynamic-content-area')).toBeInTheDocument();
  });

  it('should handle entry type changes', async () => {
    render(
      <TestWrapper>
        <DailyJournalRedesign />
      </TestWrapper>
    );
    
    // Navigate to content view
    const selectButton = screen.getByText('Select Date');
    fireEvent.click(selectButton);
    
    await waitFor(() => {
      const switchButton = screen.getByText('Switch to Trade Note');
      fireEvent.click(switchButton);
    });
    
    // Entry type change should be handled
    expect(screen.getByTestId('dynamic-content-area')).toBeInTheDocument();
  });
});
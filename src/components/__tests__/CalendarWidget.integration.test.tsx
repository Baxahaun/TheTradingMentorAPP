/**
 * Calendar Widget Integration Tests
 * 
 * Tests the enhanced calendar integration with journal entries,
 * including visual indicators, navigation, and streak tracking.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CalendarWidget from '../CalendarWidget';
import { AuthProvider } from '../../contexts/AuthContext';
import { JournalCalendarData } from '../../types/journal';

// Mock the journal data service
vi.mock('../../services/JournalDataService', () => ({
  journalDataService: {
    getJournalCalendarData: vi.fn(),
    getJournalingStreak: vi.fn()
  }
}));

// Mock the auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' }
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const mockTrades = [
  {
    id: 'trade-1',
    date: '2024-01-15',
    symbol: 'EUR/USD',
    pnl: 150,
    direction: 'LONG' as const,
    status: 'closed' as const
  },
  {
    id: 'trade-2', 
    date: '2024-01-16',
    symbol: 'GBP/USD',
    pnl: -75,
    direction: 'SHORT' as const,
    status: 'closed' as const
  }
];

const mockJournalData: JournalCalendarData[] = [
  {
    date: '2024-01-15',
    hasEntry: true,
    isComplete: true,
    completionPercentage: 100,
    wordCount: 250,
    tradeCount: 1,
    dailyPnL: 150,
    tags: ['analysis', 'win']
  },
  {
    date: '2024-01-16',
    hasEntry: true,
    isComplete: false,
    completionPercentage: 60,
    wordCount: 120,
    tradeCount: 1,
    dailyPnL: -75,
    tags: ['review']
  }
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('CalendarWidget Integration', () => {
  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock returns
    const { journalDataService } = await import('../../services/JournalDataService');
    vi.mocked(journalDataService.getJournalCalendarData).mockResolvedValue(mockJournalData);
    vi.mocked(journalDataService.getJournalingStreak).mockResolvedValue(5);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render calendar with journal indicators', async () => {
    render(
      <TestWrapper>
        <CalendarWidget trades={mockTrades} />
      </TestWrapper>
    );

    // Wait for journal data to load
    await waitFor(() => {
      expect(screen.getByText('Journal Streak')).toBeInTheDocument();
    });

    // Check that streak is displayed
    expect(screen.getByText('5 days')).toBeInTheDocument();
  });

  it('should show journal completion indicators on calendar days', async () => {
    render(
      <TestWrapper>
        <CalendarWidget trades={mockTrades} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Journal Streak')).toBeInTheDocument();
    });

    // Check for journal indicators in legend
    expect(screen.getByText('Journal Complete')).toBeInTheDocument();
    expect(screen.getByText('Journal In Progress')).toBeInTheDocument();
    expect(screen.getByText('No Journal')).toBeInTheDocument();
  });

  it('should call journal click handler when clicking on day with journal entry', async () => {
    const mockJournalClick = vi.fn();
    
    render(
      <TestWrapper>
        <CalendarWidget 
          trades={mockTrades} 
          onJournalClick={mockJournalClick}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Journal Streak')).toBeInTheDocument();
    });

    // Find and click on a day (15th) that has a journal entry
    const dayElement = screen.getByText('15');
    fireEvent.click(dayElement);

    // Should call journal click handler
    expect(mockJournalClick).toHaveBeenCalledWith('2024-01-15');
  });

  it('should prioritize journal navigation over trade navigation', async () => {
    const mockJournalClick = vi.fn();
    const mockTradeClick = vi.fn();
    
    render(
      <TestWrapper>
        <CalendarWidget 
          trades={mockTrades}
          onJournalClick={mockJournalClick}
          onTradeClick={mockTradeClick}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Journal Streak')).toBeInTheDocument();
    });

    // Click on day 15 which has both trade and journal
    const dayElement = screen.getByText('15');
    fireEvent.click(dayElement);

    // Should prioritize journal navigation
    expect(mockJournalClick).toHaveBeenCalledWith('2024-01-15');
    expect(mockTradeClick).not.toHaveBeenCalled();
  });

  it('should handle loading states gracefully', async () => {
    const { journalDataService } = await import('../../services/JournalDataService');
    
    // Mock loading state
    vi.mocked(journalDataService.getJournalCalendarData).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );
    vi.mocked(journalDataService.getJournalingStreak).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(0), 100))
    );

    render(
      <TestWrapper>
        <CalendarWidget trades={mockTrades} />
      </TestWrapper>
    );

    // Should render without crashing during loading
    expect(screen.getByText('January')).toBeInTheDocument();
  });

  it('should handle journal service errors gracefully', async () => {
    const { journalDataService } = await import('../../services/JournalDataService');
    
    // Mock service errors
    vi.mocked(journalDataService.getJournalCalendarData).mockRejectedValue(new Error('Service error'));
    vi.mocked(journalDataService.getJournalingStreak).mockRejectedValue(new Error('Service error'));

    render(
      <TestWrapper>
        <CalendarWidget trades={mockTrades} />
      </TestWrapper>
    );

    // Should render without crashing on error
    expect(screen.getByText('January')).toBeInTheDocument();
    
    // Should not show streak when there's an error
    await waitFor(() => {
      expect(screen.queryByText('Journal Streak')).not.toBeInTheDocument();
    });
  });

  it('should update journal data when month changes', async () => {
    const { journalDataService } = await import('../../services/JournalDataService');
    
    render(
      <TestWrapper>
        <CalendarWidget trades={mockTrades} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(vi.mocked(journalDataService.getJournalCalendarData)).toHaveBeenCalledWith(
        'test-user', 
        2024, 
        1 // January (0-indexed month + 1)
      );
    });

    // Navigate to next month
    const nextButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-chevron-right')
    );
    
    if (nextButton) {
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(vi.mocked(journalDataService.getJournalCalendarData)).toHaveBeenCalledWith(
          'test-user',
          2024,
          2 // February
        );
      });
    }
  });
});
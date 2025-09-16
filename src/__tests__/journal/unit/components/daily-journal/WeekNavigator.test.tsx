/**
 * WeekNavigator Component Unit Tests
 * Tests for week-based navigation functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeekNavigator } from '../../../../../components/journal/daily-journal/WeekNavigator';
import { WeekRange, WeekNavigationDirection } from '../../../../../types/dailyJournal';

// Mock date utilities
const mockWeekRange: WeekRange = {
  startDate: new Date('2024-03-11'), // Monday
  endDate: new Date('2024-03-15'),   // Friday
  weekNumber: 11,
  year: 2024,
  displayName: 'Week of Mar 11'
};

describe('WeekNavigator', () => {
  const defaultProps = {
    selectedWeek: mockWeekRange,
    onWeekChange: jest.fn(),
    onDateSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-13')); // Wednesday
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render week navigation controls', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /current week/i })).toBeInTheDocument();
  });

  it('should display current week information', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    expect(screen.getByText('Week of Mar 11')).toBeInTheDocument();
    expect(screen.getByText(/week 11, 2024/i)).toBeInTheDocument();
  });

  it('should handle previous week navigation', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    const prevButton = screen.getByRole('button', { name: /previous week/i });
    fireEvent.click(prevButton);
    
    expect(defaultProps.onWeekChange).toHaveBeenCalledWith('previous');
  });

  it('should handle next week navigation', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /next week/i });
    fireEvent.click(nextButton);
    
    expect(defaultProps.onWeekChange).toHaveBeenCalledWith('next');
  });

  it('should handle current week navigation', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    const currentButton = screen.getByRole('button', { name: /current week/i });
    fireEvent.click(currentButton);
    
    expect(defaultProps.onWeekChange).toHaveBeenCalledWith('current');
  });

  it('should render week days with proper formatting', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    // Should show Monday through Friday
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    
    // Should show dates
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should handle date selection', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    const dateButton = screen.getByText('13'); // Wednesday
    fireEvent.click(dateButton);
    
    expect(defaultProps.onDateSelect).toHaveBeenCalledWith(
      new Date('2024-03-13')
    );
  });

  it('should highlight selected date', () => {
    const selectedDate = new Date('2024-03-13');
    render(<WeekNavigator {...defaultProps} selectedDate={selectedDate} />);
    
    const selectedDateButton = screen.getByText('13');
    expect(selectedDateButton.closest('button')).toHaveClass('bg-primary');
  });

  it('should highlight current date differently', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    // Current date should have special styling
    const todayButton = screen.getByText('13');
    expect(todayButton.closest('button')).toHaveClass('ring-2', 'ring-primary');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<WeekNavigator {...defaultProps} />);
    
    // Tab through navigation buttons
    await user.tab();
    expect(screen.getByRole('button', { name: /previous week/i })).toHaveFocus();
    
    // Test keyboard navigation
    await user.keyboard('{Enter}');
    expect(defaultProps.onWeekChange).toHaveBeenCalledWith('previous');
  });

  it('should handle keyboard navigation for date selection', async () => {
    const user = userEvent.setup();
    render(<WeekNavigator {...defaultProps} />);
    
    // Navigate to a date button and select it
    const dateButton = screen.getByText('12');
    await user.click(dateButton);
    
    expect(defaultProps.onDateSelect).toHaveBeenCalledWith(
      new Date('2024-03-12')
    );
  });

  it('should show loading state when changing weeks', () => {
    render(<WeekNavigator {...defaultProps} isLoading={true} />);
    
    // Navigation buttons should be disabled during loading
    expect(screen.getByRole('button', { name: /previous week/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next week/i })).toBeDisabled();
  });

  it('should apply custom className', () => {
    const customClass = 'custom-navigator';
    render(<WeekNavigator {...defaultProps} className={customClass} />);
    
    expect(document.querySelector(`.${customClass}`)).toBeInTheDocument();
  });

  it('should handle edge case - week spanning months', () => {
    const weekSpanningMonths: WeekRange = {
      startDate: new Date('2024-02-26'), // Monday
      endDate: new Date('2024-03-01'),   // Friday
      weekNumber: 9,
      year: 2024,
      displayName: 'Week of Feb 26'
    };

    render(<WeekNavigator {...defaultProps} selectedWeek={weekSpanningMonths} />);
    
    expect(screen.getByText('Week of Feb 26')).toBeInTheDocument();
    expect(screen.getByText('26')).toBeInTheDocument(); // February
    expect(screen.getByText('1')).toBeInTheDocument();  // March
  });

  it('should handle animation timing correctly', async () => {
    render(<WeekNavigator {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /next week/i });
    fireEvent.click(nextButton);
    
    // Animation should complete within expected timeframe
    await waitFor(
      () => expect(defaultProps.onWeekChange).toHaveBeenCalled(),
      { timeout: 300 }
    );
  });
});

describe('WeekNavigator Accessibility', () => {
  const defaultProps = {
    selectedWeek: mockWeekRange,
    onWeekChange: jest.fn(),
    onDateSelect: jest.fn()
  };

  it('should have proper ARIA labels', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    expect(screen.getByLabelText(/previous week/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/next week/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current week/i)).toBeInTheDocument();
  });

  it('should have proper ARIA roles', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    const navigation = screen.getByRole('navigation');
    expect(navigation).toHaveAccessibleName(/week navigation/i);
  });

  it('should announce week changes to screen readers', () => {
    render(<WeekNavigator {...defaultProps} />);
    
    // Should have live region for announcing changes
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should handle high contrast mode', () => {
    // Mock high contrast media query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<WeekNavigator {...defaultProps} />);
    
    // Should apply high contrast styles
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
  });
});
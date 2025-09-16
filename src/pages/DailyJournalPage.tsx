import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DailyJournalRedesign } from '../components/journal/daily-journal/DailyJournalRedesign';

interface DailyJournalPageProps {}

/**
 * DailyJournalPage Component
 *
 * Page wrapper for the Daily Journal redesign with URL parameter support.
 * Supports navigation to specific dates and trades via URL parameters and query strings.
 *
 * URL Patterns:
 * - /daily-journal -> Default view (current date)
 * - /daily-journal/:date -> Navigate to specific date
 * - /daily-journal/:date/:tradeId -> Navigate to specific date with trade selected
 *
 * Query Parameters:
 * - ?trade=:tradeId -> Select specific trade
 * - ?type=daily-journal|trade-note|empty -> Set entry type
 */
const DailyJournalPage: React.FC<DailyJournalPageProps> = () => {
  const { date, tradeId } = useParams<{ date?: string; tradeId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State for parsed parameters
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTradeId, setSelectedTradeId] = useState<string | undefined>();
  const [entryType, setEntryType] = useState<'daily-journal' | 'trade-note' | 'empty'>('empty');

  // Parse URL parameters and update state
  useEffect(() => {
    // Extract state from navigation (for programmatic navigation)
    const urlState = location.state as {
      selectedDate?: Date | string;
      selectedTradeId?: string;
      entryType?: 'daily-journal' | 'trade-note' | 'empty';
    } | null;

    // Parse date parameter
    let parsedDate: Date | undefined;
    
    if (urlState?.selectedDate) {
      // Handle date from navigation state
      parsedDate = typeof urlState.selectedDate === 'string'
        ? new Date(urlState.selectedDate)
        : urlState.selectedDate;
    } else if (date) {
      // Parse date from URL parameter
      parsedDate = parseDate(date);
    }

    // Parse trade ID from URL parameter or query string
    const parsedTradeId = tradeId || searchParams.get('trade') || urlState?.selectedTradeId;
    
    // Parse entry type from query string or navigation state
    const typeParam = searchParams.get('type') as 'daily-journal' | 'trade-note' | 'empty' | null;
    const parsedEntryType = typeParam || urlState?.entryType || (parsedTradeId ? 'trade-note' : 'empty');

    // Update state
    setSelectedDate(parsedDate);
    setSelectedTradeId(parsedTradeId || undefined);
    setEntryType(parsedEntryType);

    // Update document title for better navigation
    if (parsedDate) {
      const dateStr = parsedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      document.title = `Daily Journal - ${dateStr}`;
    } else {
      document.title = 'Daily Journal';
    }

  }, [date, tradeId, location.state, searchParams]);

  // Utility function to parse date from string
  const parseDate = (dateString: string): Date | undefined => {
    try {
      // Support multiple date formats
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // ISO format: YYYY-MM-DD
        return new Date(dateString + 'T00:00:00.000Z');
      } else if (dateString.match(/^\d{8}$/)) {
        // Compact format: YYYYMMDD
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      } else {
        // Try parsing as-is
        const parsed = new Date(dateString);
        return isNaN(parsed.getTime()) ? undefined : parsed;
      }
    } catch (error) {
      console.warn('Failed to parse date:', dateString, error);
      return undefined;
    }
  };

  return (
    <DailyJournalRedesign
      selectedDate={selectedDate}
      selectedTradeId={selectedTradeId}
      entryType={entryType}
    />
  );
};

export default DailyJournalPage;
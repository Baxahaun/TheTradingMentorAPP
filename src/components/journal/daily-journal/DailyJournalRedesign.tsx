import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTradeContext } from '../../../contexts/TradeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { FileText, Calendar, BarChart3, TrendingUp, Target, Clock, Settings } from 'lucide-react';
import JournalEntryEditor from './JournalEntryEditor';
import { cn } from '../../../lib/utils';

// Import redesigned components
import { WeekNavigator } from './WeekNavigator';
import { WeekBasedCalendar } from './WeekBasedCalendar';
import { DynamicContentArea } from './DynamicContentArea';

// Import types and services
import {
  WeekRange,
  DayMetrics,
  ContentAreaConfig,
  DailyJournalNavigationState,
  WeekNavigationDirection,
  DEFAULT_CONTENT_CONFIGS,
  DEFAULT_TRADE_NOTE_CONFIG,
  DEFAULT_DAILY_JOURNAL_CONFIG
} from '../../../types/dailyJournal';
import { journalDataService } from '../../../services/JournalDataService';
import { tradeLogIntegrationService } from '../../../services/TradeLogIntegration';

interface DailyJournalRedesignProps {
  selectedDate?: Date;
  selectedTradeId?: string;
  entryType?: 'daily-journal' | 'trade-note' | 'empty';
  className?: string;
}

/**
 * DailyJournalRedesign Component
 *
 * Main orchestrator component for the redesigned Daily Journal system.
 * Coordinates navigation, calendar display, content areas, and state management
 * to provide a comprehensive weekly journal view with trade integration.
 */
export const DailyJournalRedesign: React.FC<DailyJournalRedesignProps> = ({
  selectedDate: propSelectedDate,
  selectedTradeId: propSelectedTradeId,
  entryType: propEntryType = 'empty',
  className
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { trades } = useTradeContext();

  // ===== STATE MANAGEMENT =====

  // Navigation and selection state
  const [selectedWeek, setSelectedWeek] = useState<WeekRange>(() => {
    const today = new Date();
    return getWeekRangeForDate(today);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(propSelectedDate || null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | undefined>(propSelectedTradeId);
  const [entryType, setEntryType] = useState<'daily-journal' | 'trade-note' | 'empty'>(propEntryType);

  // Data state
  const [dayMetrics, setDayMetrics] = useState<Record<string, DayMetrics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [contentConfig, setContentConfig] = useState<ContentAreaConfig>(
    DEFAULT_CONTENT_CONFIGS.empty
  );

  // ===== INITIALIZATION =====

  // Initialize from URL state or props
  useEffect(() => {
    const urlState = location.state as any;
    if (urlState) {
      if (urlState.selectedDate) {
        const date = new Date(urlState.selectedDate);
        setSelectedDate(date);
        setSelectedWeek(getWeekRangeForDate(date));
        setEntryType(urlState.entryType || 'empty');
      }
      if (urlState.selectedTradeId) {
        setSelectedTradeId(urlState.selectedTradeId);
        setEntryType('trade-note');
      }
    } else if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
      setSelectedWeek(getWeekRangeForDate(propSelectedDate));
    }
  }, [location.state, propSelectedDate, propSelectedTradeId, propEntryType]);

  // ===== DATA LOADING =====

  // Load day metrics for the selected week
  const loadWeekData = useCallback(async (week: WeekRange) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const metrics: Record<string, DayMetrics> = {};

      // Load metrics for each day of the week (Monday-Friday)
      for (let i = 0; i < 5; i++) {
        const date = new Date(week.startDate);
        date.setDate(week.startDate.getDate() + i);
        const dateIsoString = date.toISOString();
        const dateKey = dateIsoString.split('T')[0];

        if (!dateKey) continue;

        // Get trades for this date
        const dayTrades = trades.filter((trade: any) => trade.date === dateKey);
        const closedTrades = dayTrades.filter((trade: any) => trade.status === 'closed');

        // Calculate P&L and metrics
        const pnl = closedTrades.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0);
        const winners = closedTrades.filter((trade: any) => (trade.pnl || 0) > 0).length;
        const losers = closedTrades.filter((trade: any) => (trade.pnl || 0) < 0).length;
        const winRate = closedTrades.length > 0 ? (winners / closedTrades.length) * 100 : 0;

        // Check for journal entry
        const journalEntry = await journalDataService.getJournalEntry(user?.uid || '', dateKey);

        metrics[dateKey] = {
          date: dateKey,
          pnl,
          tradeCount: dayTrades.length,
          winRate,
          hasJournalEntry: !!journalEntry,
          hasTradeNotes: false, // This would be populated by the integration service
          completionPercentage: journalEntry?.completionPercentage || 0,
          totalVolume: 0,
          averageWin: 0,
          averageLoss: 0,
          maxDrawdown: 0,
          hasScreenshots: false,
          emotionalState: 'neutral',
          riskLevel: 'low'
        };
      }

      setDayMetrics(metrics);
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, trades]);

  // Load data when week changes
  useEffect(() => {
    loadWeekData(selectedWeek);
  }, [selectedWeek, loadWeekData]);

  // ===== EVENT HANDLERS =====

  // Handle date selection from calendar
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);

    // Determine entry type based on available content
    const dateKey = date.toISOString().split('T')[0];
    const metrics = dateKey ? dayMetrics[dateKey] : undefined;

    if (metrics?.hasJournalEntry) {
      setEntryType('daily-journal');
      setContentConfig(DEFAULT_CONTENT_CONFIGS.dailyJournal);
    } else {
      setEntryType('empty');
      setContentConfig(DEFAULT_CONTENT_CONFIGS.empty);
    }
  }, [dayMetrics]);

  // Handle week navigation
  const handleWeekChange = useCallback((direction: WeekNavigationDirection) => {
    const newDate = new Date(selectedWeek.startDate);

    switch (direction) {
      case 'previous':
        newDate.setDate(selectedWeek.startDate.getDate() - 7);
        break;
      case 'next':
        newDate.setDate(selectedWeek.startDate.getDate() + 7);
        break;
      case 'current':
        newDate.setTime(new Date().getTime());
        break;
    }

    const newWeek = getWeekRangeForDate(newDate);
    setSelectedWeek(newWeek);
    setSelectedDate(null); // Clear selection when changing weeks
    setEntryType('empty');
  }, [selectedWeek.startDate]);


  // Handle content area changes
  const handleContentChange = useCallback((newEntryType: 'daily-journal' | 'trade-note' | 'empty') => {
    setEntryType(newEntryType);
    setContentConfig(DEFAULT_CONTENT_CONFIGS[newEntryType as keyof typeof DEFAULT_CONTENT_CONFIGS] || DEFAULT_CONTENT_CONFIGS.empty);
  }, []);

  // ===== UTILITY FUNCTIONS =====

  // Get week range for a given date
  function getWeekRangeForDate(date: Date): WeekRange {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start

    startOfWeek.setDate(diff);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday

    const weekNumber = getWeekNumber(startOfWeek);
    const year = startOfWeek.getFullYear();

    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
      weekNumber,
      year,
      displayName: `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    };
  }

  // Get ISO week number
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // ===== RENDER HELPERS =====

  // Render header with navigation controls
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Journal
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleWeekChange('current')}
        >
          Go to Current Week
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/trades')}
        >
          View All Trades
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render main content - combined calendar and journal view
  const renderContent = () => {
    return (
      <div className="space-y-6">
        {/* Calendar and Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <WeekBasedCalendar
              selectedWeek={selectedWeek}
              selectedDate={selectedDate || undefined}
              dayMetrics={dayMetrics}
              onDateSelect={handleDateSelect}
              onWeekChange={handleWeekChange}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Weekly Summary */}
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                {(() => {
                  const weekTrades = Object.values(dayMetrics).reduce((sum, m) => sum + m.tradeCount, 0);
                  const weekPnL = Object.values(dayMetrics).reduce((sum, m) => sum + m.pnl, 0);
                  const journalEntries = Object.values(dayMetrics).filter(m => m.hasJournalEntry).length;
                  const progressPercentage = (journalEntries / 5) * 100;

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Trades</span>
                        <span className="font-medium">{weekTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Weekly P&L</span>
                        <span className={cn(
                          "font-medium",
                          weekPnL >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {weekPnL >= 0 ? '+' : ''}${weekPnL.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Journal Entries</span>
                        <span className="font-medium">{journalEntries}/5</span>
                      </div>
                      
                      {/* Weekly Journal Progress */}
                      <div className="pt-2 border-t mt-auto">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Weekly Journal Progress</span>
                          <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Journal Entry Section - Matches calendar width with sidebar for Daily Metrics */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Journal Area - matches calendar width */}
            <div className="lg:col-span-2">
              <JournalEntryEditor 
                selectedDate={selectedDate}
                userId={user?.uid || 'demo-user'} // Use actual user ID when available
              />
            </div>

            {/* Daily Metrics Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="space-y-3">
                      {(() => {
                        const dateKey = selectedDate.toISOString().split('T')[0];
                        const dayData = dateKey ? dayMetrics[dateKey] : undefined;
                        
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Trades</span>
                              <span className="font-medium">{dayData?.tradeCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">P&L</span>
                              <span className={cn(
                                "font-medium",
                                (dayData?.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {(dayData?.pnl || 0) >= 0 ? '+' : ''}${(dayData?.pnl || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Win Rate</span>
                              <span className="font-medium">{(dayData?.winRate || 0).toFixed(1)}%</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Select a day to view metrics
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER =====

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access your journal</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="container mx-auto px-4 py-6">
        {renderHeader()}
        {renderContent()}

        {isLoading && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading week data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyJournalRedesign;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTradeContext } from '../../../contexts/TradeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { FileText, Calendar, BarChart3, TrendingUp, Target, Clock, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

// Import types and services
import {
  WeekRange,
  DayMetrics,
} from '../../../types/dailyJournal';
import { journalDataService } from '../../../services/JournalDataService';

// Quill configuration for journal entries
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['blockquote', 'code-block'],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent', 'blockquote', 'code-block',
  'color', 'background', 'link'
];

interface DailyJournalRedesignProps {
  selectedDate?: Date;
  selectedTradeId?: string;
  entryType?: 'daily-journal' | 'trade-note' | 'empty';
  className?: string;
}

/**
 * DailyJournalRedesign Component - Designer Screenshot Recreation
 * 
 * Pixel-perfect recreation of the designer's screenshot featuring:
 * - Purple gradient header
 * - Week view with day cards
 * - Right sidebar with metrics
 * - Clean journal entry section
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
  const [selectedWeek, setSelectedWeek] = useState<WeekRange>(() => {
    const today = new Date();
    return getWeekRangeForDate(today);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(propSelectedDate || null);
  const [dayMetrics, setDayMetrics] = useState<Record<string, DayMetrics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ===== UTILITY FUNCTIONS =====
  function getWeekRangeForDate(date: Date): WeekRange {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);

    startOfWeek.setDate(diff);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4);

    const weekNumber = getWeekNumber(startOfWeek);
    const year = startOfWeek.getFullYear();

    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
      weekNumber,
      year,
      displayName: `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    };
  }

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // ===== DATA LOADING =====
  const loadWeekData = useCallback(async (week: WeekRange) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const metrics: Record<string, DayMetrics> = {};

      for (let i = 0; i < 5; i++) {
        const date = new Date(week.startDate);
        date.setDate(week.startDate.getDate() + i);
        const dateIsoString = date.toISOString();
        const dateKey = dateIsoString.split('T')[0];

        if (!dateKey) continue;

        const dayTrades = trades.filter((trade: any) => trade.date === dateKey);
        const closedTrades = dayTrades.filter((trade: any) => trade.status === 'closed');

        const pnl = closedTrades.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0);
        const winners = closedTrades.filter((trade: any) => (trade.pnl || 0) > 0).length;
        const losers = closedTrades.filter((trade: any) => (trade.pnl || 0) < 0).length;
        const winRate = closedTrades.length > 0 ? (winners / closedTrades.length) * 100 : 0;

        const journalEntry = await journalDataService.getJournalEntry(user?.uid || '', dateKey);

        metrics[dateKey] = {
          date: dateKey,
          pnl,
          tradeCount: dayTrades.length,
          winRate,
          hasJournalEntry: !!journalEntry,
          hasTradeNotes: false,
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

  useEffect(() => {
    loadWeekData(selectedWeek);
  }, [selectedWeek, loadWeekData]);

  // Load journal entry when date is selected
  useEffect(() => {
    const loadJournalEntry = async () => {
      if (!selectedDate || !user) {
        setJournalEntry('');
        return;
      }

      try {
        const dateKey = selectedDate.toISOString().split('T')[0];
        if (!dateKey) return;

        const entry = await journalDataService.getJournalEntry(user.uid, dateKey);
        if (entry && entry.sections.length > 0) {
          // Find the main text section (usually the first text section)
          const textSection = entry.sections.find(section => section.type === 'text');
          if (textSection && textSection.content) {
            setJournalEntry(textSection.content);
          } else {
            setJournalEntry('');
          }
        } else {
          setJournalEntry('');
        }
      } catch (error) {
        console.error('Error loading journal entry:', error);
        setJournalEntry('');
      }
    };

    loadJournalEntry();
  }, [selectedDate, user]);

  // ===== EVENT HANDLERS =====
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleWeekChange = useCallback((direction: 'previous' | 'next' | 'current') => {
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
    setSelectedDate(null);
  }, [selectedWeek.startDate]);

  const handleSaveEntry = useCallback(async () => {
    if (!selectedDate || !user || !journalEntry.trim()) return;

    setIsSaving(true);
    try {
      const dateKey = selectedDate.toISOString().split('T')[0];
      if (!dateKey) return;

      // Check if entry exists
      let existingEntry = await journalDataService.getJournalEntry(user.uid, dateKey);
      
      if (existingEntry) {
        // Update existing entry
        const textSection = existingEntry.sections.find(section => section.type === 'text');
        if (textSection) {
          // Update the existing text section
          textSection.content = journalEntry;
          textSection.updatedAt = new Date().toISOString();
          textSection.isCompleted = journalEntry.trim().length > 0;
          textSection.wordCount = journalEntry.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
        } else {
          // Add a new text section
          existingEntry.sections.push({
            id: `text_${Date.now()}`,
            type: 'text',
            title: 'Daily Reflection',
            content: journalEntry,
            order: existingEntry.sections.length + 1,
            isRequired: false,
            isCompleted: journalEntry.trim().length > 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: journalEntry.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
          });
        }

        await journalDataService.updateJournalEntry(user.uid, existingEntry.id, {
          sections: existingEntry.sections,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new entry
        await journalDataService.createJournalEntry(user.uid, dateKey);
        
        // Get the newly created entry and update it with our content
        const newEntry = await journalDataService.getJournalEntry(user.uid, dateKey);
        if (newEntry) {
          newEntry.sections = [{
            id: `text_${Date.now()}`,
            type: 'text',
            title: 'Daily Reflection',
            content: journalEntry,
            order: 1,
            isRequired: false,
            isCompleted: journalEntry.trim().length > 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: journalEntry.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
          }];

          await journalDataService.updateJournalEntry(user.uid, newEntry.id, {
            sections: newEntry.sections,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Reload week data to update the metrics
      await loadWeekData(selectedWeek);
      
      // Show success message (you can add a toast notification here)
      console.log('Journal entry saved successfully');
    } catch (error) {
      console.error('Error saving journal entry:', error);
      // Show error message (you can add a toast notification here)
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, user, journalEntry, loadWeekData, selectedWeek]);

  // ===== COMPUTED VALUES =====
  const weeklyMetrics = useMemo(() => {
    const totalTrades = Object.values(dayMetrics).reduce((sum, m) => sum + m.tradeCount, 0);
    const weeklyPnL = Object.values(dayMetrics).reduce((sum, m) => sum + m.pnl, 0);
    const journalEntries = Object.values(dayMetrics).filter(m => m.hasJournalEntry).length;
    const progressPercentage = (journalEntries / 5) * 100;

    return { totalTrades, weeklyPnL, journalEntries, progressPercentage };
  }, [dayMetrics]);

  const selectedDayMetrics = useMemo(() => {
    if (!selectedDate) return null;
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dateKey ? dayMetrics[dateKey] : null;
  }, [selectedDate, dayMetrics]);

  // ===== RENDER HELPERS =====
  const getDayStatus = (dayData: DayMetrics | undefined) => {
    if (!dayData || dayData.tradeCount === 0) return 'empty';
    if (dayData.hasJournalEntry) return 'complete';
    return 'in-progress';
  };

  const getDayCardClassName = (date: Date, dayData: DayMetrics | undefined) => {
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const status = getDayStatus(dayData);
    
    if (isSelected) return 'bg-purple-600 text-white border-purple-500';
    if (status === 'complete' && (dayData?.pnl || 0) > 0) return 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100';
    if (status === 'complete') return 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100';
    if (status === 'in-progress') return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
    return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'complete':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      case 'in-progress':
        return <div className="w-2 h-2 rounded-full bg-purple-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-slate-500"></div>;
    }
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trading Journal</h1>
          <p className="text-gray-600 mt-1">Track your progress, reflect on your trades</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white border-0"
            onClick={() => handleWeekChange('current')}
          >
            Go to Current Week
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white border-0"
            onClick={() => navigate('/trades')}
          >
            View All Trades
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-600 hover:bg-gray-100"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Week View */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Week View
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {selectedWeek.displayName}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((dayName, index) => {
                    const date = new Date(selectedWeek.startDate);
                    date.setDate(selectedWeek.startDate.getDate() + index);
                    const dateKey = date.toISOString().split('T')[0];
                    const dayData = dateKey ? dayMetrics[dateKey] : undefined;
                    const status = getDayStatus(dayData);

                    return (
                      <Card
                        key={dayName}
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:scale-105",
                          getDayCardClassName(date, dayData)
                        )}
                        onClick={() => handleDateSelect(date)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-xs font-medium mb-1">{dayName}</div>
                          <div className="text-2xl font-bold mb-2">{date.getDate()}</div>
                          <div className="text-xs mb-1">
                            {dayData?.tradeCount || 0} trades
                          </div>
                          <div className="text-sm font-semibold">
                            {dayData?.pnl ? `$${dayData.pnl > 0 ? '+' : ''}${dayData.pnl.toFixed(2)}` : '$0.00'}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Status Legend */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIndicator('complete')}
                    <span className="text-foreground">Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIndicator('in-progress')}
                    <span className="text-foreground">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIndicator('empty')}
                    <span className="text-foreground">Empty</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Journal Entry */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Journal Entry for {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a Date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={!selectedDate || isSaving || !journalEntry.trim()}
                    onClick={handleSaveEntry}
                  >
                    {isSaving ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
                <div className={cn(
                  "rich-text-editor",
                  !selectedDate && "opacity-50 pointer-events-none"
                )}>
                  <ReactQuill
                    theme="snow"
                    value={journalEntry}
                    onChange={setJournalEntry}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="What happened in your trading day? Share your thoughts, lessons learned, and reflections..."
                    readOnly={!selectedDate}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Weekly Summary */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {weeklyMetrics.totalTrades}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Trades</div>
                </div>

                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold mb-1",
                    weeklyMetrics.weeklyPnL >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ${weeklyMetrics.weeklyPnL >= 0 ? '+' : ''}{weeklyMetrics.weeklyPnL.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Weekly P&L</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground mb-1">
                    {weeklyMetrics.journalEntries}/5
                  </div>
                  <div className="text-sm text-muted-foreground">Journal Entries</div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Weekly Progress</span>
                    <span className="text-foreground font-medium">{weeklyMetrics.progressPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${weeklyMetrics.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Metrics */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayMetrics ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Trades</span>
                      <span className="text-foreground font-semibold text-lg">
                        {selectedDayMetrics.tradeCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">P&L</span>
                      <span className={cn(
                        "font-semibold text-lg",
                        selectedDayMetrics.pnl >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        ${selectedDayMetrics.pnl >= 0 ? '+' : ''}{selectedDayMetrics.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-sm">Select a day to view metrics</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
};

export default DailyJournalRedesign;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Calendar,
  FileText,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Circle,
  Edit3,
  BarChart3
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  WeekRange,
  DayMetrics,
  CalendarDay,
  WeekViewData,
  WeekNavigationDirection
} from '../../../types/dailyJournal';

interface WeekBasedCalendarProps {
  selectedWeek: WeekRange;
  selectedDate?: Date;
  dayMetrics: Record<string, DayMetrics>; // Indexed by YYYY-MM-DD
  onDateSelect: (date: Date) => void;
  onWeekChange: (direction: WeekNavigationDirection) => void;
  className?: string;
}

/**
 * WeekBasedCalendar Component
 *
 * Focused calendar widget optimized for week-view navigation with daily metrics overlay.
 * Displays Monday-Friday trading week with visual indicators for journal entries,
 * trade notes, and performance data. Integrates smooth animations and hover states.
 */
export const WeekBasedCalendar: React.FC<WeekBasedCalendarProps> = ({
  selectedWeek,
  selectedDate,
  dayMetrics,
  onDateSelect,
  onWeekChange,
  className
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

  // Generate week days (Monday-Friday)
  const weekDays = useMemo((): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const monday = new Date(selectedWeek.startDate);

    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      const dateKey = date.toISOString().split('T')[0];
      const metrics: DayMetrics = dateKey && dateKey in dayMetrics ? dayMetrics[dateKey]! : {
        date: dateKey || '',
        pnl: 0,
        tradeCount: 0,
        winRate: 0,
        hasJournalEntry: false,
        hasTradeNotes: false,
        completionPercentage: 0,
        totalVolume: 0,
        averageWin: 0,
        averageLoss: 0,
        maxDrawdown: 0,
        hasScreenshots: false,
        emotionalState: 'neutral',
        riskLevel: 'low'
      };

      // Determine entry type based on available content
      let entryType: 'journal' | 'trade-note' | 'both' | undefined;
      if (metrics.hasJournalEntry && metrics.hasTradeNotes) {
        entryType = 'both';
      } else if (metrics.hasTradeNotes) {
        entryType = 'trade-note';
      } else if (metrics.hasJournalEntry) {
        entryType = 'journal';
      }

      days.push({
        date,
        isCurrentWeek: true,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: selectedDate?.toDateString() === date.toDateString(),
        metrics,
        hasContent: metrics.hasJournalEntry || metrics.hasTradeNotes,
        entryType
      });
    }

    return days;
  }, [selectedWeek.startDate, dayMetrics, selectedDate]);

  // Calculate week summary
  const weekSummary = useMemo(() => {
    const totalPnL = weekDays.reduce((sum, day) => sum + day.metrics.pnl, 0);
    const totalTrades = weekDays.reduce((sum, day) => sum + day.metrics.tradeCount, 0);
    const completionRates = weekDays
      .filter(day => day.hasContent)
      .map(day => day.metrics.completionPercentage);
    const avgCompletionRate = completionRates.length > 0
      ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
      : 0;
    const hasAnyContent = weekDays.some(day => day.hasContent);

    return {
      totalPnL,
      totalTrades,
      avgCompletionRate,
      hasAnyContent,
      daysWithContent: weekDays.filter(day => day.hasContent).length
    };
  }, [weekDays]);

  // Handle navigation with animation
  const handleWeekNavigation = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationDirection(direction === 'next' ? 'left' : 'right');

    setTimeout(() => {
      onWeekChange(direction === 'next' ? 'next' : 'previous');

      setTimeout(() => {
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 200);
    }, 50);
  }, [isAnimating, onWeekChange]);

  // Handle date selection
  const handleDateClick = useCallback((date: Date) => {
    onDateSelect(date);
  }, [onDateSelect]);

  // Get day styling based on metrics and state
  const getDayClassName = useCallback((day: CalendarDay) => {
    const baseClasses = "h-24 p-2 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center justify-between relative overflow-hidden";

    let stateClasses = "";

    if (day.isSelected) {
      stateClasses = "bg-primary text-primary-foreground border-primary shadow-md scale-105";
    } else if (day.isToday) {
      stateClasses = "bg-accent text-accent-foreground border-accent-foreground/20 ring-2 ring-accent-foreground/50";
    } else if (day.hasContent) {
      stateClasses = "bg-background border-border hover:bg-accent hover:border-accent-foreground/50";
    } else {
      stateClasses = "bg-muted/50 border-border hover:bg-muted hover:border-muted-foreground/50";
    }

    // Performance-based coloring
    let performanceClasses = "";
    if (day.metrics.pnl > 0) {
      performanceClasses = day.isSelected || day.isToday
        ? "bg-opacity-90"
        : "bg-green-50 border-green-200 hover:bg-green-100";
    } else if (day.metrics.pnl < 0) {
      performanceClasses = day.isSelected || day.isToday
        ? "bg-opacity-90"
        : "bg-red-50 border-red-200 hover:bg-red-100";
    }

    return cn(baseClasses, stateClasses, performanceClasses);
  }, []);

  // Get content indicator
  const getContentIndicator = useCallback((day: CalendarDay) => {
    if (!day.hasContent) {
      return { icon: Circle, color: 'text-muted-foreground/40', title: 'No journal entry' };
    }

    if (day.entryType === 'both') {
      return { icon: CheckCircle, color: 'text-green-600', title: 'Full journal with trade notes' };
    }

    if (day.metrics.completionPercentage >= 80) {
      return { icon: CheckCircle, color: 'text-green-600', title: 'Journal complete' };
    }

    if (day.metrics.completionPercentage > 0) {
      return { icon: Edit3, color: 'text-yellow-600', title: `Journal ${day.metrics.completionPercentage}% complete` };
    }

    return { icon: FileText, color: 'text-blue-600', title: 'Journal started' };
  }, []);

  // Get day name abbreviation
  const getDayName = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }, []);

  // Animation classes
  const getAnimationClass = useCallback(() => {
    if (!isAnimating) return "transform transition-transform duration-300 ease-in-out";

    switch (animationDirection) {
      case 'left':
        return "transform transition-transform duration-300 ease-in-out -translate-x-full opacity-50";
      case 'right':
        return "transform transition-transform duration-300 ease-in-out translate-x-full opacity-50";
      default:
        return "transform transition-transform duration-300 ease-in-out";
    }
  }, [isAnimating, animationDirection]);

  return (
    <Card className={cn("w-full h-full flex flex-col", className)}>
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Week View
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedWeek.displayName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{weekSummary.totalTrades} trades</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{weekSummary.daysWithContent}/5 days</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekNavigation('prev')}
                className="h-8 w-8 p-0"
                disabled={isAnimating}
              >
                <TrendingUp className="h-4 w-4 rotate-270" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekNavigation('next')}
                className="h-8 w-8 p-0"
                disabled={isAnimating}
              >
                <TrendingDown className="h-4 w-4 rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Calendar Container with Animation */}
        <div className="overflow-hidden">
          <div className={getAnimationClass()}>
            <div className="grid grid-cols-5 gap-3">
              {weekDays.map((day, index) => {
                const contentIndicator = getContentIndicator(day);
                const hasScreenshots = day.metrics.hasScreenshots;
                const hasTradeNotes = day.metrics.hasTradeNotes;

                return (
                  <div
                    key={day.date.toISOString()}
                    className={getDayClassName(day)}
                    onClick={() => handleDateClick(day.date)}
                    style={{
                      transitionDelay: `${index * 50}ms` // Stagger animation for each day
                    }}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-muted-foreground">
                        {getDayName(day.date)}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasScreenshots && (
                          <ImageIcon className="h-3 w-3 text-blue-500" />
                        )}
                        {hasTradeNotes && (
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                        )}
                        <contentIndicator.icon
                          className={`h-3 w-3 ${contentIndicator.color}`}
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {day.date.getDate()}
                      </div>
                    </div>

                    {/* Metrics */}
                    {day.metrics.pnl !== 0 && (
                      <div className="text-center">
                        <div className={`text-xs font-medium ${day.metrics.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {day.metrics.pnl > 0 ? '+' : ''}${Math.abs(day.metrics.pnl).toFixed(0)}
                        </div>
                      </div>
                    )}

                    {/* Trade Count */}
                    {day.metrics.tradeCount > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {day.metrics.tradeCount}
                        </Badge>
                      </div>
                    )}

                    {/* Completion Indicator */}
                    {day.hasContent && day.metrics.completionPercentage > 0 && (
                      <div className="w-full bg-muted rounded-full h-1 mt-1">
                        <div
                          className={`h-1 rounded-full ${
                            day.metrics.completionPercentage >= 80 ? 'bg-green-500' :
                            day.metrics.completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${day.metrics.completionPercentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-auto">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-muted-foreground">Complete</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Edit3 className="w-3 h-3 text-yellow-600" />
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-blue-600" />
            <span className="text-muted-foreground">Started</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-muted-foreground">Empty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-blue-500" />
            <span className="text-muted-foreground">Screenshots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span className="text-muted-foreground">Trade Notes</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default WeekBasedCalendar;
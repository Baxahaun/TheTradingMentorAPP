import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../../ui/button';
import { WeekRange, WeekNavigationDirection } from '../../../types/dailyJournal';
import { cn } from '../../../lib/utils';

interface WeekNavigatorProps {
  currentWeek: WeekRange;
  onWeekChange: (startDate: Date, endDate: Date) => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
  isAnimating?: boolean;
}

/**
 * WeekNavigator Component
 * 
 * Provides week-based navigation with smooth animations and quick date selection.
 * Follows the design patterns from trading-calendar-animated.tsx with week-specific optimization.
 */
export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  currentWeek,
  onWeekChange,
  onDateSelect,
  selectedDate,
  className,
  isAnimating = false
}) => {
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [isInternalAnimating, setIsInternalAnimating] = useState(false);

  // Generate weekdays for current week
  const weekDays = useMemo(() => {
    const days = [];
    const current = new Date(currentWeek.startDate);
    
    // Generate Monday to Friday
    for (let i = 0; i < 5; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentWeek.startDate]);

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating || isInternalAnimating) return;

    setIsInternalAnimating(true);
    setAnimationDirection(direction === 'next' ? 'left' : 'right');

    // Calculate new week dates
    const newStartDate = new Date(currentWeek.startDate);
    const daysToAdd = direction === 'next' ? 7 : -7;
    newStartDate.setDate(newStartDate.getDate() + daysToAdd);
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + 4); // Friday

    // Staggered animation similar to trading-calendar-animated.tsx
    setTimeout(() => {
      onWeekChange(newStartDate, newEndDate);
      
      setTimeout(() => {
        setAnimationDirection(direction === 'next' ? 'right' : 'left');
        
        setTimeout(() => {
          setIsInternalAnimating(false);
          setAnimationDirection(null);
        }, 200);
      }, 100);
    }, 50);
  }, [currentWeek, onWeekChange, isAnimating, isInternalAnimating]);

  const goToCurrentWeek = useCallback(() => {
    if (isAnimating || isInternalAnimating) return;
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    
    // Calculate Monday of current week
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday should go to previous Monday
    monday.setDate(today.getDate() - daysFromMonday);
    
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    onWeekChange(monday, friday);
  }, [onWeekChange, isAnimating, isInternalAnimating]);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const isSelectedDate = useCallback((date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  }, [selectedDate]);

  // Animation classes similar to trading-calendar-animated.tsx
  const getWeekAnimationClass = () => {
    if (!isInternalAnimating) return "transform transition-transform duration-300 ease-in-out";
    
    switch (animationDirection) {
      case 'left':
        return "transform transition-transform duration-300 ease-in-out -translate-x-full opacity-75";
      case 'right':
        return "transform transition-transform duration-300 ease-in-out translate-x-full opacity-75";
      default:
        return "transform transition-transform duration-300 ease-in-out";
    }
  };

  const getHeaderAnimationClass = () => {
    if (!isInternalAnimating) return "transition-all duration-300 ease-in-out";
    return "transition-all duration-300 ease-in-out opacity-75 scale-95";
  };

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
            disabled={isAnimating || isInternalAnimating}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className={`text-lg font-semibold min-w-[200px] text-center ${getHeaderAnimationClass()}`}>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{currentWeek.displayName}</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
            disabled={isAnimating || isInternalAnimating}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentWeek}
          className="transition-all duration-200 hover:scale-105"
          disabled={isAnimating || isInternalAnimating}
        >
          This Week
        </Button>
      </div>

      {/* Week Days Navigation */}
      <div className="overflow-hidden">
        <div className={getWeekAnimationClass()}>
          <div className="grid grid-cols-5 gap-2">
            {weekDays.map((date, index) => {
              const isCurrentDay = isToday(date);
              const isSelected = isSelectedDate(date);
              
              return (
                <Button
                  key={`${currentWeek.year}-${currentWeek.weekNumber}-${index}`}
                  variant={isSelected ? "default" : isCurrentDay ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onDateSelect(date)}
                  className={cn(
                    "h-16 p-2 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105",
                    isCurrentDay && !isSelected && "border-2 border-primary/50",
                    "hover:shadow-md"
                  )}
                  style={{
                    transitionDelay: `${index * 15}ms` // Stagger animation for each day
                  }}
                  disabled={isAnimating || isInternalAnimating}
                >
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isCurrentDay && !isSelected && "text-primary",
                    isSelected && "text-primary-foreground"
                  )}>
                    {date.getDate()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Week Summary Info */}
      <div className="flex items-center justify-center text-sm text-muted-foreground">
        <span>Week {currentWeek.weekNumber}, {currentWeek.year}</span>
      </div>
    </div>
  );
};

export default WeekNavigator;
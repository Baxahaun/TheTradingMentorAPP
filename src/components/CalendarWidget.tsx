"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, FileText, CheckCircle, Circle, Edit3 } from "lucide-react"
import { Button } from "./ui/button"

import { Trade } from '../types/trade'
import { NavigationContext } from '../types/navigation'
import { JournalCalendarData } from '../types/journal'
import { journalDataService } from '../services/JournalDataService'
import { useAuth } from '../contexts/AuthContext'

interface CalendarWidgetProps {
  trades?: Trade[]
  onDateClick?: (date: string) => void
  onTradeClick?: (tradeId: string, navigationContext: NavigationContext) => void
  onJournalClick?: (date: string) => void
}

export default function CalendarWidget({ trades = [], onDateClick, onTradeClick, onJournalClick }: CalendarWidgetProps) {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [journalData, setJournalData] = React.useState<JournalCalendarData[]>([])
  const [journalStreak, setJournalStreak] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of month and calculate calendar start
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())

  // Load journal data for current month
  React.useEffect(() => {
    if (!user) return

    const loadJournalData = async () => {
      try {
        setLoading(true)
        const [calendarData, streak] = await Promise.all([
          journalDataService.getJournalCalendarData(user.uid, currentYear, currentMonth + 1),
          journalDataService.getJournalingStreak(user.uid)
        ])
        setJournalData(calendarData)
        setJournalStreak(streak)
      } catch (error) {
        console.error('Error loading journal data:', error)
        setJournalData([])
        setJournalStreak(0)
      } finally {
        setLoading(false)
      }
    }

    loadJournalData()
  }, [user, currentYear, currentMonth])

  // Generate calendar days
  const calendarDays = React.useMemo(() => {
    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [startDate])

  // Process trades data
  const tradesData = React.useMemo(() => {
    const data: Record<string, { pnl: number; count: number }> = {}
    
    trades.forEach(trade => {
      // Extract just the date part and create a consistent date string
      let dateKey: string;
      if (typeof trade.date === 'string') {
        // If it's already a string like '2024-12-08', extract the date part
        const datePart = trade.date.split('T')[0]; // Split on 'T' to get just the date part
        if (datePart) {
          const [year, month, day] = datePart.split('-');
          if (year && month && day) {
            dateKey = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toDateString();
          } else {
            dateKey = new Date(trade.date).toDateString();
          }
        } else {
          dateKey = new Date(trade.date).toDateString();
        }
      } else {
        dateKey = new Date(trade.date).toDateString();
      }
      
      if (!data[dateKey]) {
        data[dateKey] = { pnl: 0, count: 0 }
      }
      data[dateKey]!.pnl += trade.pnl || 0
      data[dateKey]!.count += 1
    })

    return data
  }, [trades])

  // Calculate monthly stats
  const monthlyStats = React.useMemo(() => {
    const currentMonthTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date)
      return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear
    })

    const totalPnl = currentMonthTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    const totalTrades = currentMonthTrades.length

    return { totalPnl, totalTrades }
  }, [trades, currentMonth, currentYear])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth
  }

  const getDayData = (date: Date) => {
    const dayData = tradesData[date.toDateString()] || { pnl: 0, count: 0 }
    return dayData
  }

  const getJournalData = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return journalData.find(j => j.date === dateString)
  }

  const getJournalIndicator = (journalEntry?: JournalCalendarData) => {
    if (!journalEntry || !journalEntry.hasEntry) {
      return { icon: Circle, color: 'text-gray-300', title: 'No journal entry' }
    }
    
    if (journalEntry.isComplete) {
      return { icon: CheckCircle, color: 'text-green-500', title: 'Journal complete' }
    }
    
    if (journalEntry.completionPercentage > 0) {
      return { icon: Edit3, color: 'text-yellow-500', title: `Journal ${journalEntry.completionPercentage}% complete` }
    }
    
    return { icon: FileText, color: 'text-blue-500', title: 'Journal started' }
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="w-full h-full p-4 flex flex-col">
      {/* Month Navigation and Summary */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {months[currentMonth]} {currentYear}
            </h2>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Journaling Streak */}
            {journalStreak > 0 && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Journal Streak</div>
                <div className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {journalStreak} days
                </div>
              </div>
            )}
            
            {/* Monthly Summary - Top Right */}
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Monthly P&L</div>
              <div className={`text-sm font-bold ${monthlyStats.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                {monthlyStats.totalPnl >= 0 ? "+" : ""}${monthlyStats.totalPnl.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total Trades</div>
              <div className="text-sm font-bold">{monthlyStats.totalTrades}</div>
            </div>
            
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-3 flex-shrink-0">
          {dayHeaders.map((day) => (
            <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid - Flexible height */}
        <div className="grid grid-cols-7 gap-1 flex-1 mb-6">
          {calendarDays.map((date, index) => {
            const dayData = getDayData(date)
            const journalEntry = getJournalData(date)
            const journalIndicator = getJournalIndicator(journalEntry)
            const hasActivity = dayData.count > 0
            const isProfitDay = dayData.pnl > 0
            const isLossDay = dayData.pnl < 0

            return (
              <div
                key={index}
                onClick={() => {
                  const dateString = date.toISOString().split('T')[0];
                  
                  // Prioritize journal navigation if journal entry exists
                  if (journalEntry?.hasEntry && onJournalClick) {
                    onJournalClick(dateString);
                    return;
                  }
                  
                  // Default date click handler
                  if (onDateClick) {
                    onDateClick(dateString);
                  }
                  
                  // If there are trades on this day and onTradeClick is provided, 
                  // we could also handle direct trade navigation here
                  if (hasActivity && onTradeClick && dayData.count === 1) {
                    // Find the single trade for this day
                    const dayTrades = trades.filter(trade => {
                      const tradeDate = new Date(trade.date);
                      return tradeDate.toDateString() === date.toDateString();
                    });
                    
                    if (dayTrades.length === 1 && dayTrades[0]) {
                      const navigationContext: NavigationContext = {
                        source: 'calendar',
                        sourceParams: { 
                          date: dateString,
                          viewMode: 'calendar'
                        },
                        breadcrumb: ['Dashboard', 'Calendar'],
                        timestamp: Date.now()
                      };
                      onTradeClick(dayTrades[0].id, navigationContext);
                    }
                  }
                }}
                className={`
                  h-16 p-1 border rounded-md flex flex-col items-center justify-between text-sm relative
                  ${isCurrentMonth(date) ? "bg-background" : "bg-muted/30 text-muted-foreground"}
                  ${isToday(date) ? "bg-primary text-primary-foreground font-semibold" : ""}
                  ${hasActivity && isProfitDay ? "bg-green-50 border-green-200" : ""}
                  ${hasActivity && isLossDay ? "bg-red-50 border-red-200" : ""}
                  ${journalEntry?.hasEntry ? "ring-1 ring-indigo-200" : ""}
                  cursor-pointer hover:bg-accent transition-colors overflow-hidden
                  ${hasActivity && dayData.count === 1 ? "hover:ring-2 hover:ring-blue-200" : ""}
                  ${journalEntry?.hasEntry ? "hover:ring-2 hover:ring-indigo-300" : ""}
                `}
                title={
                  journalEntry?.hasEntry 
                    ? `${journalIndicator.title} - Click to open journal`
                    : hasActivity && dayData.count === 1 
                      ? "Click to view trade details" 
                      : undefined
                }
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs ${isToday(date) ? "text-primary-foreground" : ""}`}>
                    {date.getDate()}
                  </span>
                  {/* Journal Indicator */}
                  <journalIndicator.icon 
                    className={`w-3 h-3 ${journalIndicator.color}`}
                  />
                </div>
                
                {/* Trade P&L */}
                {hasActivity && (
                  <div className="text-xs leading-none">
                    <div className={`font-medium ${isProfitDay ? "text-green-600" : "text-red-600"}`}>
                      ${dayData.pnl.toFixed(0)}
                    </div>
                  </div>
                )}
                
                {/* Journal completion indicator */}
                {journalEntry?.hasEntry && journalEntry.completionPercentage > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className={`h-1 rounded-full ${
                        journalEntry.isComplete ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${journalEntry.completionPercentage}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 text-sm flex-shrink-0">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-muted-foreground">Profit Day</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-muted-foreground">Loss Day</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-muted-foreground">Journal Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <Edit3 className="w-3 h-3 text-yellow-500" />
            <span className="text-muted-foreground">Journal In Progress</span>
          </div>
          <div className="flex items-center space-x-1">
            <Circle className="w-3 h-3 text-gray-300" />
            <span className="text-muted-foreground">No Journal</span>
          </div>
        </div>
    </div>
  )
}

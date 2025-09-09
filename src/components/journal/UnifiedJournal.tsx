import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTradeContext } from '../../contexts/TradeContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Save
} from 'lucide-react';
import { journalDataService } from '../../services/JournalDataService';
import { JournalEntry } from '../../types/journal';
import AnalyticsAndInsightsDashboard from './AnalyticsAndInsightsDashboard';

interface UnifiedJournalProps {
  initialDate?: string;
}

export default function UnifiedJournal({ initialDate }: UnifiedJournalProps) {
  const { user } = useAuth();
  const { trades } = useTradeContext();
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [journalContent, setJournalContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [dayTrades, setDayTrades] = useState<any[]>([]);

  // Load journal entry and trades for selected date
  useEffect(() => {
    if (!user) return;

    const loadDayData = async () => {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Load journal entry for the date
      try {
        const entry = await journalDataService.getJournalEntry(user.uid, dateString);
        setJournalEntry(entry);
        setJournalContent(entry?.sections.find(s => s.type === 'text')?.content || '');
      } catch (error) {
        console.error('Error loading journal entry:', error);
        setJournalEntry(null);
        setJournalContent('');
      }
      
      // Load trades for the date
      const tradesForDay = trades.filter(trade => trade.date === dateString);
      setDayTrades(tradesForDay);
    };

    loadDayData();
  }, [selectedDate, user, trades]);

  // Calculate P&L for the day
  const calculateDayPnL = () => {
    const closedTrades = dayTrades.filter(trade => trade.status === 'closed');
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winners = closedTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const losers = closedTrades.filter(trade => (trade.pnl || 0) < 0).length;
    const winRate = closedTrades.length > 0 ? (winners / closedTrades.length) * 100 : 0;
    
    return {
      totalPnL,
      totalTrades: dayTrades.length,
      closedTrades: closedTrades.length,
      winners,
      losers,
      winRate
    };
  };

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  // Save journal entry
  const saveJournalEntry = async () => {
    if (!user || !journalContent.trim()) return;

    setSaving(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      if (journalEntry) {
        // Update existing entry
        await journalDataService.updateJournalEntry(user.uid, journalEntry.id, {
          sections: [
            {
              id: 'main-content',
              type: 'text',
              title: 'Daily Journal',
              content: journalContent,
              order: 1,
              isRequired: true,
              isCompleted: journalContent.trim().length > 0,
              createdAt: now,
              updatedAt: now
            }
          ]
        });
      } else {
        // Create new entry
        await journalDataService.createJournalEntry(user.uid as string, dateString);
        // Reload to get the created entry
        const newEntry = await journalDataService.getJournalEntry(user.uid as string, dateString);
        if (newEntry) {
          await journalDataService.updateJournalEntry(user.uid as string, newEntry.id, {
            sections: [
              {
                id: 'main-content',
                type: 'text',
                title: 'Daily Journal',
                content: journalContent,
                order: 1,
                isRequired: true,
                isCompleted: journalContent.trim().length > 0,
                createdAt: now,
                updatedAt: now
              }
            ]
          });
        }
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setSaving(false);
    }
  };  const dayPnL = calculateDayPnL();
  const formatSelectedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Section - Date and P&L */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {formatSelectedDate}
                </h1>
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Today
            </button>
          </div>

          {/* P&L Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">P&L for Day</span>
              </div>
              <div className={`text-2xl font-bold ${
                dayPnL.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${dayPnL.totalPnL.toFixed(2)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Total Trades</div>
              <div className="text-xl font-semibold text-gray-900">
                {dayPnL.totalTrades}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-500">Winners</span>
              </div>
              <div className="text-xl font-semibold text-green-600">
                {dayPnL.winners}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-500">Losers</span>
              </div>
              <div className="text-xl font-semibold text-red-600">
                {dayPnL.losers}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Win Rate</div>
              <div className="text-xl font-semibold text-gray-900">
                {dayPnL.winRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Journal Entry Section */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Journal Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Main Journal Entry
              </h2>
              <div className="flex items-center space-x-3">
                {journalContent.trim() && (
                  <span className="text-sm text-gray-500">
                    {journalContent.trim().split(/\s+/).length} words
                  </span>
                )}
                <button
                  onClick={saveJournalEntry}
                  disabled={saving || !journalContent.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              (This is also where the template text is added once selected)
            </p>
          </div>

          {/* Journal Content Editor */}
          <div className="p-6">
            <textarea
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              placeholder="Write your journal entry here... You can use bullet points, numbered lists, simple tables, etc."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            
            {/* Formatting Help */}
            <div className="mt-4 text-sm text-gray-500">
              <p className="font-medium mb-2">Formatting tips:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div>• Use • for bullet points</div>
                <div>1. Use numbers for lists</div>
                <div>**Bold text** for emphasis</div>
              </div>
            </div>
          </div>

          {/* Trade References */}
          {dayTrades.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Trades for this day ({dayTrades.length})
              </h3>
              <div className="space-y-2">
                {dayTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{trade.currencyPair}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        trade.side === 'long' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.side.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {trade.timeIn} - {trade.timeOut || 'Open'}
                      </span>
                    </div>
                    <div className={`font-medium ${
                      (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${(trade.pnl || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Section (Scrollable) */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Analytics & Insights
            </h2>
          </div>
          
          {/* Analytics Dashboard */}
          <AnalyticsAndInsightsDashboard />
        </div>
      </div>
    </div>
  );
}

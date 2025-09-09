import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight  // Save journal entry
  const saveJournalEntry = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      const dateString = formatDateForDb(currentDate);
      const now = new Date().toISOString();
      
      if (journalEntry) {
        // Update existing entry
        await journalDataService.updateJournalEntry(user.uid, journalEntry.id, {Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTradeContext } from '../../contexts/TradeContext';
import { journalDataService } from '../../services/JournalDataService';
import { JournalEntry, JournalTemplate } from '../../types/journal';
import AnalyticsAndInsightsDashboard from './AnalyticsAndInsightsDashboard';

interface UnifiedJournalPageProps {
  selectedDate?: string;
}

export default function UnifiedJournalPage({ selectedDate }: UnifiedJournalPageProps) {
  const { user } = useAuth();
  const { trades } = useTradeContext();
  
  // Date management
  const [currentDate, setCurrentDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });
  
  // Journal state
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [journalContent, setJournalContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Templates
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);

  // Format date for display and database
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateForDb = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Calculate P&L for current date
  const calculateDayPnL = useCallback(() => {
    const dateString = formatDateForDb(currentDate);
    const dayTrades = trades.filter(trade => trade.date === dateString);
    
    const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalTrades = dayTrades.length;
    const winners = dayTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const losers = dayTrades.filter(trade => (trade.pnl || 0) < 0).length;
    const winRate = totalTrades > 0 ? (winners / totalTrades) * 100 : 0;

    return {
      totalPnL,
      totalTrades,
      winners,
      losers,
      winRate,
      trades: dayTrades
    };
  }, [trades, currentDate]);

  // Load journal entry for current date
  const loadJournalEntry = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const dateString = formatDateForDb(currentDate);
      const entry = await journalDataService.getJournalEntry(user.uid, dateString);
      
      setJournalEntry(entry);
      
      if (entry && entry.sections.length > 0) {
        // Find the main journal content section
        const mainSection = entry.sections.find(s => s.type === 'text' && s.title === 'Daily Journal');
        setJournalContent(mainSection?.content || '');
      } else {
        setJournalContent('');
      }
    } catch (error) {
      console.error('Error loading journal entry:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentDate]);

  // Save journal entry
  const saveJournalEntry = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const dateString = formatDateForDb(currentDate);
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
              createdAt: journalEntry.sections[0]?.createdAt || now,
              updatedAt: now
            }
          ],
          updatedAt: now,
          isComplete: journalContent.trim().length > 0,
          wordCount: journalContent.split(/\s+/).filter(word => word.length > 0).length
        });
      } else {
        // Create new entry
        const newEntry = await journalDataService.createJournalEntry(user.uid, dateString);
        if (newEntry) {
          await journalDataService.updateJournalEntry(user.uid, newEntry.id, {
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
            ],
            updatedAt: now,
            isComplete: journalContent.trim().length > 0,
            wordCount: journalContent.split(/\s+/).filter(word => word.length > 0).length
          });
          setJournalEntry(newEntry);
        }
      }
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!journalContent.trim()) return;
    
    const autoSaveTimer = setTimeout(() => {
      saveJournalEntry();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [journalContent]);

  // Load entry when date changes
  useEffect(() => {
    loadJournalEntry();
  }, [loadJournalEntry]);

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Template selection
  const applyTemplate = (template: JournalTemplate) => {
    // For now, just insert template structure as text
    // This can be enhanced later with proper template rendering
    const templateContent = template.sections
      .map(section => `## ${section.title}\n${section.prompt || ''}\n\n`)
      .join('');
    
    setJournalContent(templateContent);
    setShowTemplates(false);
  };

  const dayPnL = calculateDayPnL();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Journal</h1>
          <p className="text-gray-600">Document your daily trading journey and insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Date & P&L */}
          <div className="lg:col-span-1 space-y-6">
            {/* Date Navigation */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Date</h2>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center flex-1">
                  <div className="text-lg font-medium text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* P&L Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">P&L for Day</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    dayPnL.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {dayPnL.totalPnL >= 0 ? '+' : ''}${dayPnL.totalPnL.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Total P&L</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-900">{dayPnL.totalTrades}</div>
                  <div className="text-sm text-gray-500">Trades</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-medium text-green-600">{dayPnL.winners}W</div>
                  <div className="text-sm text-gray-500">Winners</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-medium text-red-600">{dayPnL.losers}L</div>
                  <div className="text-sm text-gray-500">Losers</div>
                </div>
                
                <div className="col-span-2 text-center">
                  <div className="text-lg font-medium text-gray-900">{dayPnL.winRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">Win Rate</div>
                </div>
              </div>

              {/* Trade References */}
              {dayPnL.trades.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Today's Trades</h3>
                  <div className="space-y-2">
                    {dayPnL.trades.slice(0, 3).map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{trade.symbol}</span>
                        <span className={`font-medium ${
                          (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {dayPnL.trades.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayPnL.trades.length - 3} more trades
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Journal Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Journal Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {formatDateForDisplay(currentDate)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Share your thoughts, analysis, and reflections
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Template Button */}
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Template className="w-4 h-4" />
                      <span>Templates</span>
                    </button>
                    
                    {/* Save Status */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Saving...</span>
                        </>
                      ) : lastSaved ? (
                        <>
                          <Save className="w-4 h-4 text-green-600" />
                          <span>Saved {lastSaved.toLocaleTimeString()}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Template Selection */}
                {showTemplates && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Choose a Template</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => applyTemplate({
                          id: 'pre-market',
                          name: 'Pre-Market Setup',
                          sections: [
                            { title: 'Market Bias', prompt: 'What is your overall market bias today?' },
                            { title: 'Key Levels', prompt: 'What are the important support/resistance levels?' },
                            { title: 'Risk Management', prompt: 'What is your risk limit for today?' }
                          ]
                        } as JournalTemplate)}
                        className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                      >
                        <div className="font-medium text-sm">Pre-Market Setup</div>
                        <div className="text-xs text-gray-500">Market bias, levels, risk</div>
                      </button>
                      
                      <button
                        onClick={() => applyTemplate({
                          id: 'trade-review',
                          name: 'Trade Review',
                          sections: [
                            { title: 'What Went Right', prompt: 'What did you execute well today?' },
                            { title: 'What Went Wrong', prompt: 'What mistakes did you make?' },
                            { title: 'Lessons Learned', prompt: 'What will you do differently?' }
                          ]
                        } as JournalTemplate)}
                        className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                      >
                        <div className="font-medium text-sm">Trade Review</div>
                        <div className="text-xs text-gray-500">Analysis and lessons</div>
                      </button>
                      
                      <button
                        onClick={() => applyTemplate({
                          id: 'emotional-check',
                          name: 'Emotional Check-in',
                          sections: [
                            { title: 'Pre-Market Feeling', prompt: 'How are you feeling before the market opens?' },
                            { title: 'During Trading', prompt: 'How did you handle emotions during trading?' },
                            { title: 'End of Day', prompt: 'How do you feel about today overall?' }
                          ]
                        } as JournalTemplate)}
                        className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                      >
                        <div className="font-medium text-sm">Emotional Check-in</div>
                        <div className="text-xs text-gray-500">Mindset and feelings</div>
                      </button>
                      
                      <button
                        onClick={() => setShowTemplates(false)}
                        className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-colors"
                      >
                        <div className="font-medium text-sm">Start Blank</div>
                        <div className="text-xs text-gray-500">Free form entry</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Journal Content Area */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <textarea
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="Start writing your journal entry for today...

What trades did you take?
How are you feeling about your performance?
What did you learn?
What will you do differently tomorrow?"
                    className="w-full min-h-[400px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    style={{ fontFamily: 'system-ui' }}
                  />
                )}

                {/* Word Count */}
                <div className="mt-2 text-right text-sm text-gray-500">
                  {journalContent.split(/\s+/).filter(word => word.length > 0).length} words
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="mt-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics & Insights</h2>
                <div className="h-96 overflow-y-auto">
                  <AnalyticsAndInsightsDashboard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

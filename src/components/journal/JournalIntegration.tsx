import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTradeContext } from '../../contexts/TradeContext';
import { 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Bell,
  HelpCircle
} from 'lucide-react';
import DailyJournalView from '../DailyJournalView';
import AnalyticsAndInsightsDashboard from './AnalyticsAndInsightsDashboard';
import TemplateManager from './TemplateManager';
import ExportInterface from './ExportInterface';
import BackupManager from './BackupManager';
import QuickAddModule from './QuickAddModule';
import { journalDataService } from '../../services/JournalDataService';
import { JournalEntry, JournalCalendarData } from '../../types/journal';

interface JournalIntegrationProps {
  selectedDate?: string;
  initialView?: 'calendar' | 'analytics' | 'templates' | 'settings';
}

export default function JournalIntegration({ selectedDate, initialView = 'calendar' }: JournalIntegrationProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trades } = useTradeContext();
  
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedJournalDate, setSelectedJournalDate] = useState<Date | null>(
    selectedDate ? new Date(selectedDate) : null
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [calendarData, setCalendarData] = useState<JournalCalendarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Load journal data
  useEffect(() => {
    if (!user) return;

    const loadJournalData = async () => {
      try {
        setLoading(true);
        const currentDate = new Date();
        const [entries, calendar] = await Promise.all([
          journalDataService.getJournalEntriesForMonth(
            user.uid, 
            currentDate.getFullYear(), 
            currentDate.getMonth() + 1
          ),
          journalDataService.getJournalCalendarData(
            user.uid, 
            currentDate.getFullYear(), 
            currentDate.getMonth() + 1
          )
        ]);
        
        setJournalEntries(entries);
        setCalendarData(calendar);
      } catch (error) {
        console.error('Error loading journal data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJournalData();
  }, [user]);

  const handleDateSelect = (date: Date) => {
    setSelectedJournalDate(date);
    setCurrentView('journal');
  };

  const handleCloseJournal = () => {
    setSelectedJournalDate(null);
    setCurrentView('calendar');
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setSelectedJournalDate(null);
  };

  const navigationItems = [
    { id: 'calendar', label: 'Journal Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'templates', label: 'Template Manager', icon: Settings },
    { id: 'export', label: 'Export & Backup', icon: Download },
  ];

  // If a specific journal date is selected, show the journal view
  if (selectedJournalDate) {
    return (
      <DailyJournalView 
        selectedDate={selectedJournalDate}
        onClose={handleCloseJournal}
        onDateChange={setSelectedJournalDate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trading Journal
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search journal entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Quick Add Button */}
              <button
                onClick={() => setShowQuickAdd(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Add</span>
              </button>

              {/* Help */}
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentView === item.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'calendar' && (
          <JournalCalendarView 
            trades={trades}
            journalEntries={journalEntries}
            calendarData={calendarData}
            onDateSelect={handleDateSelect}
            searchQuery={searchQuery}
            loading={loading}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsAndInsightsDashboard />
        )}

        {currentView === 'templates' && (
          <TemplateManager />
        )}

        {currentView === 'export' && (
          <div className="space-y-8">
            <ExportInterface />
            <BackupManager />
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModule 
          onClose={() => setShowQuickAdd(false)}
          onSave={(content) => {
            // Handle quick add save
            console.log('Quick add content:', content);
            setShowQuickAdd(false);
          }}
        />
      )}
    </div>
  );
}

// Journal Calendar View Component
interface JournalCalendarViewProps {
  trades: any[];
  journalEntries: JournalEntry[];
  calendarData: JournalCalendarData[];
  onDateSelect: (date: Date) => void;
  searchQuery: string;
  loading: boolean;
}

function JournalCalendarView({ 
  trades, 
  journalEntries, 
  calendarData, 
  onDateSelect, 
  searchQuery,
  loading 
}: JournalCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  // Filter entries based on search
  const filteredEntries = journalEntries.filter(entry => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      entry.sections.some(section => 
        section.content && 
        typeof section.content === 'string' && 
        section.content.toLowerCase().includes(searchLower)
      ) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded-lg ${
              viewMode === 'month' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded-lg ${
              viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Calendar or List View */}
      {viewMode === 'month' ? (
        <MonthCalendarView 
          currentDate={currentDate}
          trades={trades}
          calendarData={calendarData}
          onDateSelect={onDateSelect}
        />
      ) : (
        <JournalListView 
          entries={filteredEntries}
          onDateSelect={onDateSelect}
        />
      )}

      {/* Journal Statistics */}
      <JournalStatistics 
        entries={journalEntries}
        calendarData={calendarData}
      />
    </div>
  );
}

// Month Calendar View Component
function MonthCalendarView({ currentDate, trades, calendarData, onDateSelect }: any) {
  // Generate calendar days for the month
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const current = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const dateString = date.toISOString().split('T')[0];
          const journalData = calendarData.find(d => d.date === dateString);
          const dayTrades = trades.filter((t: any) => t.date === dateString);

          return (
            <div
              key={index}
              onClick={() => onDateSelect(date)}
              className={`
                bg-white p-2 h-24 cursor-pointer hover:bg-gray-50 transition-colors
                ${!isCurrentMonth ? 'text-gray-400' : ''}
                ${isToday ? 'bg-indigo-50 border-2 border-indigo-200' : ''}
                ${journalData?.hasEntry ? 'ring-1 ring-green-200' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${isToday ? 'font-bold text-indigo-600' : ''}`}>
                  {date.getDate()}
                </span>
                {journalData?.hasEntry && (
                  <div className={`w-2 h-2 rounded-full ${
                    journalData.isComplete ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                )}
              </div>
              
              {dayTrades.length > 0 && (
                <div className="text-xs text-gray-600">
                  {dayTrades.length} trade{dayTrades.length > 1 ? 's' : ''}
                </div>
              )}
              
              {journalData?.completionPercentage && journalData.completionPercentage > 0 && (
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${
                        journalData.isComplete ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${journalData.completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Journal List View Component
function JournalListView({ entries, onDateSelect }: any) {
  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No journal entries found</p>
        </div>
      ) : (
        entries.map((entry: JournalEntry) => (
          <div
            key={entry.id}
            onClick={() => onDateSelect(new Date(entry.date))}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {new Date(entry.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  entry.isComplete 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {entry.isComplete ? 'Complete' : `${Math.round(entry.completionPercentage)}% Complete`}
                </span>
                {entry.templateName && (
                  <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                    {entry.templateName}
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-gray-600 text-sm">
              {entry.sections.length} section{entry.sections.length > 1 ? 's' : ''} • 
              {entry.tradeReferences.length} trade reference{entry.tradeReferences.length !== 1 ? 's' : ''} • 
              {entry.tags.length} tag{entry.tags.length !== 1 ? 's' : ''}
            </div>
            
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entry.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{entry.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Journal Statistics Component
function JournalStatistics({ entries, calendarData }: any) {
  const totalEntries = entries.length;
  const completedEntries = entries.filter((e: JournalEntry) => e.isComplete).length;
  const averageCompletion = entries.length > 0 
    ? entries.reduce((sum: number, e: JournalEntry) => sum + e.completionPercentage, 0) / entries.length 
    : 0;
  const currentStreak = calendarData.filter((d: JournalCalendarData) => d.hasEntry).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-2xl font-bold text-gray-900">{totalEntries}</div>
        <div className="text-sm text-gray-500">Total Entries</div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-2xl font-bold text-green-600">{completedEntries}</div>
        <div className="text-sm text-gray-500">Completed Entries</div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-2xl font-bold text-indigo-600">{Math.round(averageCompletion)}%</div>
        <div className="text-sm text-gray-500">Average Completion</div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-2xl font-bold text-purple-600">{currentStreak}</div>
        <div className="text-sm text-gray-500">Current Streak</div>
      </div>
    </div>
  );
}
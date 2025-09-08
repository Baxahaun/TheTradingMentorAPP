import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useTradeContext } from '../contexts/TradeContext';
import { useAuth } from '../contexts/AuthContext';
import { Trade } from '../lib/firebaseService';
import { 
  ChevronLeft,
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  FileText,
  BarChart3,
  Target,
  Brain,
  Calendar,
  Clock,
  Save,
  Settings,
  Layout,
  Plus,
  CheckCircle,
  Circle,
  Loader2
} from 'lucide-react';
import TradeReviewModal from './TradeReviewModal';
import TemplateSelector from './journal/TemplateSelector';
import SectionEditor from './journal/SectionEditor';
import EmotionalTracker from './journal/EmotionalTracker';
import PerformanceMetrics from './journal/PerformanceMetrics';
import QuickAddButton from './journal/QuickAddButton';
import TradeReferencePanel from './journal/TradeReferencePanel';
import { journalDataService } from '../services/JournalDataService';
import { templateService } from '../services/TemplateService';
import { 
  JournalEntry, 
  JournalTemplate, 
  JournalSection,
  TemplateSection,
  EmotionalState,
  ProcessMetrics
} from '../types/journal';

// Get template section for a journal section
const getTemplateSectionForJournalSection = (
  journalSection: JournalSection, 
  templates: JournalTemplate[],
  entry: JournalEntry | null
): TemplateSection | undefined => {
  if (!entry?.templateId) return undefined;
  
  const template = templates.find(t => t.id === entry.templateId);
  if (!template) return undefined;
  
  return template.sections.find(ts => ts.id === journalSection.templateSectionId);
};

interface DailyJournalViewProps {
  selectedDate: Date;
  onClose: () => void;
  onDateChange?: (date: Date) => void;
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export default function DailyJournalView({ selectedDate, onClose, onDateChange }: DailyJournalViewProps) {
  const { trades } = useTradeContext();
  const { user } = useAuth();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  
  // Journal state
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Template selection state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<JournalTemplate[]>([]);
  
  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false
  });

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayTrades = trades.filter(trade => trade.date === dateKey);

  // Calculate session metrics
  const sessionMetrics = {
    totalTrades: dayTrades.length,
    winners: dayTrades.filter(t => t.result === 'WIN').length,
    losers: dayTrades.filter(t => t.result === 'LOSS').length,
    totalPnL: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    winRate: dayTrades.length > 0 
      ? (dayTrades.filter(t => t.result === 'WIN').length / dayTrades.length * 100).toFixed(1)
      : '0'
  };

  // Load journal entry and templates
  useEffect(() => {
    if (!user) return;
    
    const loadJournalData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load existing journal entry or create new one
        let entry = await journalDataService.getJournalEntry(user.uid, dateKey);
        
        if (!entry) {
          // Create new entry if none exists
          entry = await journalDataService.createJournalEntry(user.uid, dateKey);
        }

        setJournalEntry(entry);

        // Load available templates
        const [userTemplates, defaultTemplates] = await Promise.all([
          templateService.getUserTemplates(user.uid),
          templateService.getDefaultTemplates()
        ]);
        
        setAvailableTemplates([...defaultTemplates, ...userTemplates]);
      } catch (err) {
        console.error('Error loading journal data:', err);
        setError('Failed to load journal data');
      } finally {
        setLoading(false);
      }
    };

    loadJournalData();
  }, [user, dateKey]);

  // Auto-save functionality
  const saveJournalEntry = useCallback(async (entryToSave?: JournalEntry) => {
    if (!user || !journalEntry) return;

    const entry = entryToSave || journalEntry;
    
    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));
      
      await journalDataService.updateJournalEntry(user.uid, entry.id, {
        sections: entry.sections,
        emotionalState: entry.emotionalState,
        processMetrics: entry.processMetrics,
        tags: entry.tags,
        isComplete: entry.isComplete,
        tradeReferences: entry.tradeReferences,
        dailyPnL: sessionMetrics.totalPnL,
        tradeCount: sessionMetrics.totalTrades
      });

      setAutoSaveStatus({
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      });
    } catch (error) {
      console.error('Error saving journal entry:', error);
      setAutoSaveStatus(prev => ({ ...prev, isSaving: false }));
      setError('Failed to save journal entry');
    }
  }, [user, journalEntry, sessionMetrics]);

  // Auto-save timer
  useEffect(() => {
    if (!autoSaveStatus.hasUnsavedChanges || autoSaveStatus.isSaving) return;

    const timer = setTimeout(() => {
      saveJournalEntry();
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(timer);
  }, [autoSaveStatus.hasUnsavedChanges, autoSaveStatus.isSaving, saveJournalEntry]);

  // Template selection handlers
  const handleTemplateSelect = async (template: JournalTemplate) => {
    if (!user || !journalEntry) return;

    try {
      const templateSections = await templateService.applyTemplateToEntry(template.id);
      
      const updatedEntry: JournalEntry = {
        ...journalEntry,
        templateId: template.id,
        templateName: template.name,
        sections: templateSections,
        updatedAt: new Date().toISOString()
      };

      setJournalEntry(updatedEntry);
      setShowTemplateSelector(false);
      setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
    } catch (error) {
      console.error('Error applying template:', error);
      setError('Failed to apply template');
    }
  };

  // Section update handlers
  const updateSection = (sectionId: string, content: any) => {
    if (!journalEntry) return;

    const updatedSections = journalEntry.sections.map(section => 
      section.id === sectionId 
        ? { 
            ...section, 
            content, 
            updatedAt: new Date().toISOString(),
            isCompleted: Boolean(content && (
              typeof content === 'string' ? content.trim().length > 0 : 
              Array.isArray(content) ? content.length > 0 : 
              Object.keys(content).length > 0
            ))
          }
        : section
    );

    const updatedEntry: JournalEntry = {
      ...journalEntry,
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    };

    setJournalEntry(updatedEntry);
    setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
  };

  // Navigation handlers
  const navigateToDate = (newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const goToPreviousDay = () => {
    navigateToDate(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    navigateToDate(addDays(selectedDate, 1));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-gray-600 dark:text-gray-300">Loading journal...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Error Loading Journal</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show template selector if no template is selected and entry is empty
  if (showTemplateSelector) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Select Template
              </h1>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TemplateSelector
            userId={user!.uid}
            onTemplateSelect={handleTemplateSelect}
            onCancel={() => setShowTemplateSelector(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Daily Journal
              </h1>
              {journalEntry?.templateName && (
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full">
                  {journalEntry.templateName}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 px-3">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <button
                  onClick={goToNextDay}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Auto-save Status */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {autoSaveStatus.isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : autoSaveStatus.lastSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Saved {format(autoSaveStatus.lastSaved, 'HH:mm')}</span>
                  </>
                ) : autoSaveStatus.hasUnsavedChanges ? (
                  <>
                    <Circle className="w-4 h-4 text-yellow-500" />
                    <span>Unsaved changes</span>
                  </>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Change Template"
                >
                  <Layout className="w-5 h-5" />
                </button>
                <button
                  onClick={() => saveJournalEntry()}
                  disabled={autoSaveStatus.isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Quick Add Button */}
          <QuickAddButton 
            onQuickAdd={(content) => {
              // Add quick note to the first text section or create one
              if (journalEntry && journalEntry.sections.length > 0) {
                const textSection = journalEntry.sections.find(s => s.type === 'text');
                if (textSection) {
                  const existingContent = textSection.content || '';
                  const newContent = existingContent + (existingContent ? '\n\n' : '') + content;
                  updateSection(textSection.id, newContent);
                }
              }
            }}
          />

          {/* Trade Reference Panel */}
          {dayTrades.length > 0 && (
            <TradeReferencePanel 
              trades={dayTrades}
              onTradeSelect={(trade) => {
                // Add trade reference to journal
                if (journalEntry) {
                  const updatedReferences = [...journalEntry.tradeReferences, {
                    tradeId: trade.id,
                    insertedAt: new Date().toISOString(),
                    context: `Referenced from ${trade.symbol} trade`,
                    displayType: 'card' as const
                  }];
                  
                  const updatedEntry = {
                    ...journalEntry,
                    tradeReferences: updatedReferences
                  };
                  
                  setJournalEntry(updatedEntry);
                  setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
                }
              }}
            />
          )}

          {/* Emotional Tracker */}
          <EmotionalTracker 
            emotionalState={journalEntry?.emotionalState}
            onEmotionalStateChange={(newState) => {
              if (journalEntry) {
                const updatedEntry = {
                  ...journalEntry,
                  emotionalState: newState
                };
                setJournalEntry(updatedEntry);
                setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
              }
            }}
          />

          {/* Performance Metrics */}
          <PerformanceMetrics 
            processMetrics={journalEntry?.processMetrics}
            dailyPnL={sessionMetrics.totalPnL}
            trades={dayTrades}
            onProcessMetricsChange={(newMetrics) => {
              if (journalEntry) {
                const updatedEntry = {
                  ...journalEntry,
                  processMetrics: newMetrics
                };
                setJournalEntry(updatedEntry);
                setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
              }
            }}
          />

          {/* Journal Sections */}
          {journalEntry && journalEntry.sections.length > 0 ? (
            journalEntry.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  templateSection={getTemplateSectionForJournalSection(section, availableTemplates, journalEntry)}
                  trades={dayTrades}
                  onUpdate={(content) => updateSection(section.id, content)}
                  onSave={saveJournalEntry}
                  autoSaveInterval={30000}
                />
              ))
          ) : (
            /* Empty State */
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center">
              <div className="mb-4">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">
                  Start Your Daily Journal
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Choose a template to structure your journal entry, or start with a blank entry.
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Layout className="w-5 h-5" />
                  Choose Template
                </button>
                <button
                  onClick={() => handleTemplateSelect({ 
                    id: 'blank', 
                    name: 'Blank Entry', 
                    sections: [{
                      id: 'notes',
                      type: 'text' as const,
                      title: 'Daily Notes',
                      prompt: 'Write your thoughts about today\'s trading session',
                      isRequired: false,
                      order: 1,
                      config: {}
                    }]
                  } as JournalTemplate)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Start Blank
                </button>
              </div>
            </div>
          )}

          {/* Daily Performance Summary */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-3 text-indigo-500" />
              Daily Performance Summary
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Net P&L</p>
                <p className={`text-xl font-bold ${
                  sessionMetrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {sessionMetrics.totalPnL >= 0 ? '+' : ''}${sessionMetrics.totalPnL.toFixed(2)}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {sessionMetrics.winRate}%
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {sessionMetrics.totalTrades}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Completion</p>
                <p className="text-xl font-bold text-indigo-600">
                  {journalEntry ? Math.round(journalEntry.completionPercentage) : 0}%
                </p>
              </div>
            </div>

            {/* Trades List */}
            {dayTrades.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-3">Today's Trades</h3>
                <div className="grid gap-2">
                  {dayTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800 dark:text-white">{trade.symbol}</span>
                        <span className={`text-sm font-medium ${
                          trade.direction === 'LONG' ? 'text-blue-500' : 'text-purple-500'
                        }`}>
                          {trade.direction}
                        </span>
                        <span className="text-sm text-gray-500">{trade.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-semibold ${
                          (trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                        </span>
                        <button
                          onClick={() => setSelectedTrade(trade)}
                          className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Trade Review Modal */}
      {selectedTrade && (
        <TradeReviewModal
          trade={selectedTrade}
          isOpen={true}
          onClose={() => setSelectedTrade(null)}
        />
      )}
    </div>
  );
}

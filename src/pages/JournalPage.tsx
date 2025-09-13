import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useTradeContext } from '../contexts/TradeContext';
import { useAuth } from '../contexts/AuthContext';
import { Trade } from '../lib/firebaseService';
import {
  JournalEntry,
  JournalTemplate,
  JournalSection,
  TemplateSection,
  EmotionalState,
  ProcessMetrics
} from '../types/journal';
import { journalDataService } from '../services/JournalDataService';
import { templateService } from '../services/TemplateService';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { CalendarDays, Save } from 'lucide-react';

interface JournalPageProps {
  selectedDate?: Date;
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

const JournalPage: React.FC<JournalPageProps> = ({ selectedDate: initialDate }) => {
  const { trades } = useTradeContext();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  
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

  // New state for the redesigned interface
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [journalContent, setJournalContent] = useState("");

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayTrades = trades.filter(trade => trade.date === dateKey);
  
  // Get recent trades (last 10 trades)
  const recentTrades = trades
    .sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime())
    .slice(0, 10);
  
  const selectedTradeData = selectedTrade ? trades.find(trade => trade.id === selectedTrade) : null;

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

  const handleTemplateSelect = async (template: JournalTemplate) => {
    if (!user || !journalEntry) return;

    try {
      let templateSections;
      
      // Handle special case for blank template
      if (template.id === 'blank') {
        templateSections = [{
          id: 'notes',
          type: 'text' as const,
          title: 'Daily Notes',
          content: '',
          order: 1,
          isRequired: false,
          isCompleted: false,
          templateSectionId: 'notes',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      } else {
        templateSections = await templateService.applyTemplateToEntry(template.id);
      }
      
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


  const handleEmotionalStateChange = (newState: EmotionalState) => {
    if (journalEntry) {
      const updatedEntry = {
        ...journalEntry,
        emotionalState: newState
      };
      setJournalEntry(updatedEntry);
      setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
  };

  const handleProcessMetricsChange = (newMetrics: ProcessMetrics) => {
    if (journalEntry) {
      const updatedEntry = {
        ...journalEntry,
        processMetrics: newMetrics
      };
      setJournalEntry(updatedEntry);
      setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
  };

  const handleTradeSelect = (trade: Trade) => {
    // Handle trade selection (e.g., open a modal)
    console.log('Selected trade:', trade);
  };

  const handleJournalContentChange = (content: string) => {
    setJournalContent(content);
    setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
  };

  const handleSaveJournal = async () => {
    if (!user) return;
    
    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));
      
      // Save journal content logic here
      // This would integrate with your existing journal saving system
      
      setAutoSaveStatus({
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      });
    } catch (error) {
      console.error('Error saving journal:', error);
      setAutoSaveStatus(prev => ({ ...prev, isSaving: false }));
    }
  };

  const saveJournalEntry = useCallback(async () => {
    if (!user || !journalEntry) return;

    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));
      
      await journalDataService.updateJournalEntry(user.uid, journalEntry.id, {
        sections: journalEntry.sections,
        emotionalState: journalEntry.emotionalState,
        processMetrics: journalEntry.processMetrics,
        tags: journalEntry.tags,
        isComplete: journalEntry.isComplete,
        tradeReferences: journalEntry.tradeReferences,
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
  }, [user, journalEntry]);

  // Navigation handlers
  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  // Load journal entry and templates
  useEffect(() => {
    if (!user) return;
    
    const loadJournalData = async () => {
      try {
        setLoading(true);
        setError(null);

        let entry = await journalDataService.getJournalEntry(user.uid, dateKey);
        
        if (!entry) {
          entry = await journalDataService.createJournalEntry(user.uid, dateKey);
        }

        setJournalEntry(entry);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Date Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Daily Journal
              </h1>
            </div>

            <div className="flex items-center">
              {/* Date Navigation */}
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all duration-200"
                  title="Previous day"
                  aria-label="Previous day"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2 text-gray-700 px-4 py-2">
                  <CalendarDays className="w-4 h-4" />
                  <span className="font-medium text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <button
                  onClick={goToNextDay}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all duration-200"
                  title="Next day"
                  aria-label="Next day"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Trades List */}
        <div className="w-72 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Recent Trades</h3>
            <div className="text-xs text-gray-500">Click a trade to link it to your journal</div>
          </div>

          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className={`cursor-pointer p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    selectedTrade === trade.id
                      ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedTrade(trade.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 ${
                      selectedTrade === trade.id
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300 hover:border-gray-400"
                    }`}>
                      {selectedTrade === trade.id && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm text-gray-900 truncate">{trade.currencyPair}</div>
                        <Badge
                          variant={trade.side === "long" ? "default" : "secondary"}
                          className={`text-xs px-2 py-0.5 font-medium ${
                            trade.side === "long"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-600">
                        NET P&L:{" "}
                        <span className={`font-semibold ${(trade.pnl || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                          ${(trade.pnl || 0) > 0 ? "+" : ""}
                          {(trade.pnl || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">{format(new Date(trade.date), 'MMM dd')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Journal Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedTradeData ? (
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedTradeData.currencyPair} : {format(new Date(selectedTradeData.date), 'MMM dd, yyyy')}
                  </h2>
                  <div className="text-sm text-gray-500 mb-4">
                    Created: {format(new Date(selectedTradeData.timestamp || selectedTradeData.date), 'MMM dd, yyyy hh:mm a')} • 
                    Last updated: {format(new Date(selectedTradeData.timestamp || selectedTradeData.date), 'MMM dd, yyyy hh:mm a')}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    View Trade Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                    onClick={handleSaveJournal}
                    disabled={autoSaveStatus.isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Publish
                  </Button>
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="More options"
                    aria-label="More options"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>

               <div className="mb-6">
                 <div className="grid grid-cols-4 gap-8 text-sm">
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <div className="text-gray-500 mb-2 text-xs font-medium uppercase tracking-wide">Gross P&L</div>
                     <div className={`font-bold text-lg ${(selectedTradeData.pnl || 0) > 0 ? "text-green-600" : (selectedTradeData.pnl || 0) < 0 ? "text-red-600" : "text-gray-900"}`}>
                       ${(selectedTradeData.pnl || 0) > 0 ? "+" : ""}{(selectedTradeData.pnl || 0).toFixed(2)}
                     </div>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <div className="text-gray-500 mb-2 text-xs font-medium uppercase tracking-wide">Volume</div>
                     <div className="font-bold text-lg text-gray-900">{selectedTradeData.lotSize || 'N/A'}</div>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <div className="text-gray-500 mb-2 text-xs font-medium uppercase tracking-wide">Commissions</div>
                     <div className="font-bold text-lg text-gray-900">
                       ${(selectedTradeData.commission || 0).toFixed(2)}
                     </div>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <div className="text-gray-500 mb-2 text-xs font-medium uppercase tracking-wide">Strategy</div>
                     <div className="font-bold text-lg text-gray-900">{selectedTradeData.strategy || 'N/A'}</div>
                   </div>
                 </div>
               </div>

              <div className="text-sm text-gray-600">
                Recently used template: <span className="text-blue-600 cursor-pointer hover:text-blue-700 font-medium">+ Add Template</span>
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Daily Journal</h2>
                  <p className="text-gray-600">{format(selectedDate, 'MMMM dd, yyyy')}</p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  onClick={handleSaveJournal}
                  disabled={autoSaveStatus.isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save & Publish
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 p-6">
            <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm">
              <Textarea
                placeholder={
                  selectedTradeData
                    ? `Write your analysis and notes for ${selectedTradeData.currencyPair} trade...\n\nReflect on:\n• Entry and exit decisions\n• Market conditions\n• Emotions during the trade\n• Lessons learned\n• What you'd do differently`
                    : "Start writing your journal entry... \n\nYou can reflect on your trades, market analysis, emotions, lessons learned, or any insights from today's trading session.\n\nIf you've selected a trade from the left panel, you can reference it directly in your notes."
                }
                value={journalContent}
                onChange={(e) => handleJournalContentChange(e.target.value)}
                className="h-full resize-none bg-transparent border-0 text-gray-900 placeholder:text-gray-500 focus:ring-0 focus:outline-none p-6"
              />
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-6">
                <span className="font-medium">Words: {journalContent.split(" ").filter((word) => word.length > 0).length}</span>
                <span className="font-medium">Characters: {journalContent.length}</span>
                {selectedTrade && <span className="text-blue-600 font-medium">• Trade #{selectedTrade} referenced</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${autoSaveStatus.isSaving ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span className="font-medium">{autoSaveStatus.isSaving ? 'Saving...' : 'Auto-saved'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalPage;
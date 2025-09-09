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
import JournalHeader from '../components/journal/single-page/JournalHeader';
import JournalSidebar from '../components/journal/single-page/JournalSidebar';
import JournalContent from '../components/journal/single-page/JournalContent';
import TemplateSelector from '../components/journal/single-page/TemplateSelector';
import SimplifiedSidebar from '../components/journal/single-page/SimplifiedSidebar';

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

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayTrades = trades.filter(trade => trade.date === dateKey);

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <JournalHeader
        selectedDate={selectedDate}
        journalEntry={journalEntry}
        autoSaveStatus={autoSaveStatus}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onSave={saveJournalEntry}
        onChangeTemplate={() => setShowTemplateSelector(true)}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Main Content Area */}
        <div className="xl:col-span-2 order-1">
          <JournalContent
            journalEntry={journalEntry}
            availableTemplates={availableTemplates}
            dayTrades={dayTrades}
            onUpdateSection={updateSection}
            onSave={saveJournalEntry}
            onShowTemplateSelector={() => setShowTemplateSelector(true)}
            onTemplateSelect={handleTemplateSelect}
            onEmotionalStateChange={handleEmotionalStateChange}
            onProcessMetricsChange={handleProcessMetricsChange}
          />
        </div>

        {/* Right Column - Simplified Sidebar */}
        <div className="xl:col-span-1 order-2">
          <SimplifiedSidebar
            dayTrades={dayTrades}
            processMetrics={journalEntry?.processMetrics || {
              planAdherence: 3,
              riskManagement: 3,
              entryTiming: 3,
              exitTiming: 3,
              emotionalDiscipline: 3,
              overallDiscipline: 3,
              processScore: 60,
            }}
            onTradeSelect={handleTradeSelect}
            onUpdateProcessMetrics={handleProcessMetricsChange}
          />
        </div>
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        templates={availableTemplates}
        onSelect={handleTemplateSelect}
        onClose={() => setShowTemplateSelector(false)}
        isOpen={showTemplateSelector}
      />
    </div>
  );
};

export default JournalPage;
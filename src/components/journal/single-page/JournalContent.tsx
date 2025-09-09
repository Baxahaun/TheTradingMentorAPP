import React from 'react';
import { FileText, Layout, Plus, Heart, TrendingUp } from 'lucide-react';
import { JournalEntry, JournalTemplate, JournalSection, TemplateSection, EmotionalState, ProcessMetrics } from '../../../types/journal';
import SectionEditor from '../SectionEditor';
import { Trade } from '../../../lib/firebaseService';
import EmotionalTracker from '../EmotionalTracker';
import PerformanceMetrics from '../PerformanceMetrics';

// Helper function (can be moved to a utils file)
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

interface JournalContentProps {
  journalEntry: JournalEntry | null;
  availableTemplates: JournalTemplate[];
  dayTrades: Trade[];
  onUpdateSection: (sectionId: string, content: any) => void;
  onSave: () => Promise<void>;
  onShowTemplateSelector: () => void;
  onTemplateSelect: (template: JournalTemplate) => void;
  onEmotionalStateChange: (newState: EmotionalState) => void;
  onProcessMetricsChange: (newMetrics: ProcessMetrics) => void;
}

const JournalContent: React.FC<JournalContentProps> = ({
  journalEntry,
  availableTemplates,
  dayTrades,
  onUpdateSection,
  onSave,
  onShowTemplateSelector,
  onTemplateSelect,
  onEmotionalStateChange,
  onProcessMetricsChange,
}) => {
  const sessionMetrics = {
    totalPnL: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
  };

  const defaultEmotionalState: EmotionalState = {
    preMarket: { confidence: 3, anxiety: 3, focus: 3, energy: 3, mood: 'neutral', preparedness: 3, timestamp: new Date().toISOString() },
    duringTrading: { discipline: 3, patience: 3, emotionalControl: 3, decisionClarity: 3, stressManagement: 3 },
    postMarket: { satisfaction: 3, learningValue: 3, frustrationLevel: 3, accomplishment: 3, overallMood: 'neutral', timestamp: new Date().toISOString() },
    overallMood: 'neutral',
    stressLevel: 3,
    confidenceLevel: 3,
  };

  const defaultProcessMetrics: ProcessMetrics = {
    planAdherence: 3,
    riskManagement: 3,
    entryTiming: 3,
    exitTiming: 3,
    emotionalDiscipline: 3,
    overallDiscipline: 3,
    processScore: 60,
  };

  // Render journal sections
  const renderJournalSections = () => {
    if (!journalEntry || journalEntry.sections.length === 0) {
      return (
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
              onClick={onShowTemplateSelector}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Layout className="w-5 h-5" />
              Choose Template
            </button>
            <button
              onClick={() => onTemplateSelect({
                id: 'blank',
                userId: '',
                name: 'Blank Entry',
                description: 'Start with a blank journal entry',
                category: 'custom',
                sections: [{
                  id: 'notes',
                  type: 'text' as const,
                  title: 'Daily Notes',
                  prompt: 'Write your thoughts about today\'s trading session',
                  placeholder: 'Enter your daily notes here...',
                  isRequired: false,
                  order: 1,
                  config: {}
                }],
                isDefault: false,
                isPublic: false,
                isSystemTemplate: false,
                usageCount: 0,
                sharedWith: [],
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as JournalTemplate)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Start Blank
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {journalEntry.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              templateSection={getTemplateSectionForJournalSection(section, availableTemplates, journalEntry)}
              trades={dayTrades}
              onUpdate={(content) => onUpdateSection(section.id, content)}
              onSave={onSave}
              autoSaveInterval={30000}
            />
          ))}
      </div>
    );
  };

  // Render emotional tracker
  const renderEmotionalTracker = () => (
    <EmotionalTracker
      emotionalState={journalEntry?.emotionalState || defaultEmotionalState}
      onChange={onEmotionalStateChange}
      className="bg-transparent border-0 shadow-none p-0"
      readOnly={false}
    />
  );

  return (
    <main className="flex-1 overflow-hidden">
      <div className="h-full p-3 md:p-6 space-y-6">
        {/* Journal Sections */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Journal Entries</h2>
          </div>
          {renderJournalSections()}
        </section>

        {/* Emotional State */}
        {journalEntry && journalEntry.sections.length > 0 && (
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Emotional State</h2>
            </div>
            {renderEmotionalTracker()}
          </section>
        )}
      </div>
    </main>
  );
};

export default JournalContent;
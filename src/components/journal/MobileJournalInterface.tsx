/**
 * Mobile-Optimized Journal Interface
 * 
 * A touch-friendly interface specifically designed for mobile devices.
 * Provides an optimized experience for journal entry and review on smaller screens.
 * 
 * Features:
 * - Touch-optimized controls and gestures
 * - Swipe navigation between sections
 * - Collapsible sections for better space utilization
 * - Mobile-specific input methods
 * - Responsive design for various screen sizes
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  Mic,
  Camera,
  Calendar,
  TrendingUp,
  Heart,
  Target,
  ArrowLeft,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { JournalEntry, JournalSection, JournalSectionType } from '../../types/journal';
import { EmotionalTracker } from './EmotionalTracker';
import { ProcessScore } from './ProcessScore';
import { TradeReferencePanel } from './TradeReferencePanel';
import { ImageUpload } from './ImageUpload';

interface MobileJournalInterfaceProps {
  journalEntry: JournalEntry;
  onUpdate: (updates: Partial<JournalEntry>) => void;
  onSave: () => void;
  isLoading?: boolean;
  className?: string;
}

interface SectionState {
  [sectionId: string]: {
    isExpanded: boolean;
    isEditing: boolean;
  };
}

const SECTION_ICONS: Record<JournalSectionType, React.ComponentType<any>> = {
  text: Edit3,
  checklist: Target,
  rating: TrendingUp,
  emotion_tracker: Heart,
  trade_reference: TrendingUp,
  image_gallery: Camera,
  market_analysis: TrendingUp,
  lesson_learned: Target,
  goal_setting: Target,
  custom: Edit3
};

export const MobileJournalInterface: React.FC<MobileJournalInterfaceProps> = ({
  journalEntry,
  onUpdate,
  onSave,
  isLoading = false,
  className = ''
}) => {
  const [sectionStates, setSectionStates] = useState<SectionState>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize section states
  useEffect(() => {
    const initialStates: SectionState = {};
    journalEntry.sections.forEach(section => {
      initialStates[section.id] = {
        isExpanded: section.isRequired || !section.isCompleted,
        isEditing: false
      };
    });
    setSectionStates(initialStates);
  }, [journalEntry.sections]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [journalEntry]);

  const handleAutoSave = async () => {
    setIsAutoSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        isExpanded: !prev[sectionId]?.isExpanded
      }
    }));
  };

  const toggleSectionEditing = (sectionId: string) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        isEditing: !prev[sectionId]?.isEditing
      }
    }));
  };

  const updateSectionContent = (sectionId: string, content: any) => {
    const updatedSections = journalEntry.sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            content,
            updatedAt: new Date().toISOString(),
            isCompleted: !!content && content.toString().trim().length > 0
          }
        : section
    );

    onUpdate({ sections: updatedSections });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const getCompletionPercentage = () => {
    const completedSections = journalEntry.sections.filter(s => s.isCompleted).length;
    return Math.round((completedSections / journalEntry.sections.length) * 100);
  };

  const renderSectionContent = (section: JournalSection) => {
    const sectionState = sectionStates[section.id];
    if (!sectionState?.isExpanded) return null;

    switch (section.type) {
      case 'text':
        return (
          <MobileTextEditor
            content={section.content || ''}
            placeholder={`Write your ${section.title.toLowerCase()}...`}
            isEditing={sectionState.isEditing}
            onContentChange={(content) => updateSectionContent(section.id, content)}
            onEditToggle={() => toggleSectionEditing(section.id)}
          />
        );

      case 'checklist':
        return (
          <MobileChecklistEditor
            items={section.content || []}
            onItemsChange={(items) => updateSectionContent(section.id, items)}
          />
        );

      case 'emotion_tracker':
        return (
          <div className="px-2">
            <EmotionalTracker
              emotionalState={journalEntry.emotionalState}
              onEmotionalStateChange={(emotionalState) => onUpdate({ emotionalState })}
              phase={section.templateSectionId?.includes('pre') ? 'preMarket' : 'postMarket'}
            />
          </div>
        );

      case 'rating':
        return (
          <div className="px-2">
            <ProcessScore
              processMetrics={journalEntry.processMetrics}
              onProcessMetricsChange={(processMetrics) => onUpdate({ processMetrics })}
            />
          </div>
        );

      case 'trade_reference':
        return (
          <div className="px-2">
            <TradeReferencePanel
              tradeReferences={journalEntry.tradeReferences}
              onTradeReferencesChange={(tradeReferences) => onUpdate({ tradeReferences })}
              availableTrades={[]} // TODO: Pass actual trades
            />
          </div>
        );

      case 'image_gallery':
        return (
          <div className="px-2">
            <ImageUpload
              images={journalEntry.images}
              onImagesChange={(images) => onUpdate({ images })}
              maxImages={5}
            />
          </div>
        );

      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Section type "{section.type}" not yet implemented for mobile
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {new Date(journalEntry.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </h1>
              <p className="text-sm text-gray-500">
                {getCompletionPercentage()}% complete
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAutoSaving && (
              <div className="flex items-center space-x-1 text-blue-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs">Saving...</span>
              </div>
            )}
            
            <button
              onClick={() => setShowSectionMenu(!showSectionMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section Navigation Menu */}
      {showSectionMenu && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Jump to Section</span>
            <button
              onClick={() => setShowSectionMenu(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {journalEntry.sections.map((section) => {
              const Icon = SECTION_ICONS[section.type];
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    scrollToSection(section.id);
                    setShowSectionMenu(false);
                  }}
                  className={`flex items-center space-x-2 p-2 rounded-md text-left transition-colors ${
                    section.isCompleted
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-gray-50 border border-gray-200 text-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium truncate">{section.title}</span>
                  {section.isCompleted && (
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {journalEntry.sections.map((section, index) => {
          const sectionState = sectionStates[section.id];
          const Icon = SECTION_ICONS[section.type];
          
          return (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className="bg-white border-b border-gray-200 last:border-b-0"
            >
              {/* Section Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleSectionExpansion(section.id)}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{section.title}</h3>
                    {section.isRequired && (
                      <span className="text-xs text-red-500">Required</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {section.isCompleted && (
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  )}
                  {sectionState?.isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Section Content */}
              {renderSectionContent(section)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Mobile Text Editor Component
interface MobileTextEditorProps {
  content: string;
  placeholder: string;
  isEditing: boolean;
  onContentChange: (content: string) => void;
  onEditToggle: () => void;
}

const MobileTextEditor: React.FC<MobileTextEditorProps> = ({
  content,
  placeholder,
  isEditing,
  onContentChange,
  onEditToggle
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[120px]"
          rows={4}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-500">{content.length} characters</span>
          <button
            onClick={onEditToggle}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {content ? (
        <div
          className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap cursor-pointer"
          onClick={onEditToggle}
        >
          {content}
        </div>
      ) : (
        <div
          className="text-gray-500 italic cursor-pointer py-4"
          onClick={onEditToggle}
        >
          {placeholder}
        </div>
      )}
      <button
        onClick={onEditToggle}
        className="flex items-center space-x-1 mt-2 text-blue-500 text-sm font-medium"
      >
        <Edit3 className="w-4 h-4" />
        <span>Edit</span>
      </button>
    </div>
  );
};

// Mobile Checklist Editor Component
interface MobileChecklistEditorProps {
  items: Array<{ id: string; text: string; completed: boolean }>;
  onItemsChange: (items: Array<{ id: string; text: string; completed: boolean }>) => void;
}

const MobileChecklistEditor: React.FC<MobileChecklistEditorProps> = ({
  items = [],
  onItemsChange
}) => {
  const toggleItem = (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onItemsChange(updatedItems);
  };

  return (
    <div className="p-4 space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center space-x-3">
          <button
            onClick={() => toggleItem(item.id)}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
              item.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {item.completed && <span className="text-xs">✓</span>}
          </button>
          <span
            className={`flex-1 ${
              item.completed ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MobileJournalInterface;
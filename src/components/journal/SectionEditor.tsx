import React, { useState, useCallback } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Heart,
  Brain,
  Target,
  Clock,
  Plus,
  Trash2
} from 'lucide-react';
import { JournalSection, TemplateSection, TradeReference } from '../../types/journal';
import { Trade } from '../../types/trade';
import JournalEditor from './JournalEditor';
import TradeReferencePanel from './TradeReferencePanel';

interface SectionEditorProps {
  section: JournalSection;
  templateSection?: TemplateSection;
  trades?: Trade[];
  existingReferences?: TradeReference[];
  onUpdate: (content: any) => void;
  onUpdateReferences?: (references: TradeReference[]) => void;
  onSave?: () => Promise<void>;
  autoSaveInterval?: number;
  className?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  isCustom?: boolean;
}

interface RatingValue {
  [key: string]: number;
}

export default function SectionEditor({
  section,
  templateSection,
  trades = [],
  existingReferences = [],
  onUpdate,
  onUpdateReferences,
  onSave,
  autoSaveInterval = 30000,
  className = ''
}: SectionEditorProps) {
  const [showAddCustomItem, setShowAddCustomItem] = useState(false);
  const [customItemText, setCustomItemText] = useState('');

  // Get section icon based on type
  const getSectionIcon = () => {
    switch (section.type) {
      case 'text':
        return <FileText className="w-5 h-5" />;
      case 'checklist':
        return <CheckCircle className="w-5 h-5" />;
      case 'rating':
        return <Star className="w-5 h-5" />;
      case 'emotion_tracker':
        return <Heart className="w-5 h-5" />;
      case 'trade_reference':
        return <BarChart3 className="w-5 h-5" />;
      case 'image_gallery':
        return <ImageIcon className="w-5 h-5" />;
      case 'market_analysis':
        return <TrendingUp className="w-5 h-5" />;
      case 'lesson_learned':
        return <Brain className="w-5 h-5" />;
      case 'goal_setting':
        return <Target className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  // Render checklist section
  const renderChecklistSection = () => {
    const items: ChecklistItem[] = Array.isArray(section.content) ? section.content : [];
    const templateItems = templateSection?.config?.items || [];
    
    // Initialize with template items if content is empty
    const allItems = items.length === 0 
      ? templateItems.map((item, index) => ({
          id: item.id || `item-${index}`,
          text: item.text,
          checked: false,
          isCustom: false
        }))
      : items;

    const updateItems = (updatedItems: ChecklistItem[]) => {
      onUpdate(updatedItems);
    };

    const toggleItem = (itemId: string) => {
      const updatedItems = allItems.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      updateItems(updatedItems);
    };

    const addCustomItem = () => {
      if (!customItemText.trim()) return;
      
      const newItem: ChecklistItem = {
        id: `custom-${Date.now()}`,
        text: customItemText.trim(),
        checked: false,
        isCustom: true
      };
      
      updateItems([...allItems, newItem]);
      setCustomItemText('');
      setShowAddCustomItem(false);
    };

    const removeCustomItem = (itemId: string) => {
      const updatedItems = allItems.filter(item => item.id !== itemId);
      updateItems(updatedItems);
    };

    return (
      <div className="space-y-3">
        {templateSection?.prompt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {templateSection.prompt}
          </p>
        )}
        
        <div className="space-y-2">
          {allItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group">
              <button
                onClick={() => toggleItem(item.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
                  item.checked
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-500 hover:border-green-400'
                }`}
              >
                {item.checked && <CheckCircle className="w-5 h-5" />}
              </button>
              
              <span className={`flex-1 ${
                item.checked 
                  ? 'line-through text-gray-500 dark:text-gray-400' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {item.text}
              </span>
              
              {item.isCustom && (
                <button
                  onClick={() => removeCustomItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add custom item */}
        {templateSection?.config?.allowCustomItems && (
          <div className="mt-4">
            {showAddCustomItem ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customItemText}
                  onChange={(e) => setCustomItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomItem();
                    } else if (e.key === 'Escape') {
                      setShowAddCustomItem(false);
                      setCustomItemText('');
                    }
                  }}
                  placeholder="Add custom checklist item..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={addCustomItem}
                  disabled={!customItemText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddCustomItem(false);
                    setCustomItemText('');
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCustomItem(true)}
                className="flex items-center gap-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add custom item
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render rating section
  const renderRatingSection = () => {
    const ratings: RatingValue = typeof section.content === 'object' ? section.content : {};
    const metrics = templateSection?.config?.metrics || [
      { id: 'plan_adherence', name: 'Plan Adherence', description: 'How well did you stick to your trading plan?' },
      { id: 'risk_management', name: 'Risk Management', description: 'How disciplined were you with position sizing and stops?' },
      { id: 'entry_timing', name: 'Entry Timing', description: 'How well-timed were your trade entries?' },
      { id: 'exit_timing', name: 'Exit Timing', description: 'How well did you manage your trade exits?' },
      { id: 'emotional_control', name: 'Emotional Control', description: 'How well did you manage your emotions?' }
    ];
    const scale = templateSection?.config?.scale || 5;

    const updateRating = (metricId: string, value: number) => {
      const updatedRatings = { ...ratings, [metricId]: value };
      onUpdate(updatedRatings);
    };

    return (
      <div className="space-y-6">
        {templateSection?.prompt && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {templateSection.prompt}
          </p>
        )}
        
        {metrics.map((metric) => (
          <div key={metric.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">
                  {metric.name}
                </h4>
                {metric.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {metric.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: scale }, (_, i) => i + 1).map((value) => (
                  <button
                    key={value}
                    onClick={() => updateRating(metric.id, value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      (ratings[metric.id] || 0) >= value
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'border-gray-300 dark:border-gray-500 hover:border-indigo-400 text-gray-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Visual rating bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((ratings[metric.id] || 0) / scale) * 100}%` }}
              />
            </div>
          </div>
        ))}
        
        {/* Overall score */}
        {Object.keys(ratings).length > 0 && (
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-indigo-800 dark:text-indigo-200">
                Overall Score
              </span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {(Object.values(ratings).reduce((sum, val) => sum + val, 0) / Object.keys(ratings).length).toFixed(1)}/{scale}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render trade reference section
  const renderTradeReferenceSection = () => {
    if (!onUpdateReferences) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-yellow-700 dark:text-yellow-300">
            Trade reference functionality requires onUpdateReferences callback
          </p>
        </div>
      );
    }

    const handleAddReference = (tradeId: string, context: string, displayType: 'inline' | 'card' | 'preview') => {
      const newReference: TradeReference = {
        id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tradeId,
        insertedAt: new Date().toISOString(),
        context,
        displayType,
        sectionId: section.id,
        cachedTradeData: (() => {
          const trade = trades.find(t => t.id === tradeId);
          if (!trade) return undefined;
          return {
            symbol: trade.currencyPair,
            direction: trade.side,
            pnl: trade.pnl || 0,
            status: trade.status,
            timeIn: trade.timeIn,
            timeOut: trade.timeOut
          };
        })()
      };

      const updatedReferences = [...existingReferences, newReference];
      onUpdateReferences(updatedReferences);
    };

    const handleRemoveReference = (referenceId: string) => {
      const updatedReferences = existingReferences.filter(ref => ref.id !== referenceId);
      onUpdateReferences(updatedReferences);
    };

    return (
      <div className="space-y-4">
        {templateSection?.prompt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {templateSection.prompt}
          </p>
        )}
        
        <TradeReferencePanel
          trades={trades}
          existingReferences={existingReferences}
          onAddReference={handleAddReference}
          onRemoveReference={handleRemoveReference}
          sectionId={section.id}
          maxTrades={templateSection?.config?.maxTrades}
          filterCriteria={templateSection?.config?.filterCriteria}
        />
      </div>
    );
  };

  // Render section content based on type
  const renderSectionContent = () => {
    switch (section.type) {
      case 'text':
      case 'market_analysis':
      case 'lesson_learned':
      case 'goal_setting':
        return (
          <JournalEditor
            section={section}
            templateSection={templateSection}
            onUpdate={onUpdate}
            onSave={onSave}
            autoSaveInterval={autoSaveInterval}
          />
        );
      
      case 'checklist':
        return renderChecklistSection();
      
      case 'rating':
        return renderRatingSection();
      
      case 'trade_reference':
        return renderTradeReferenceSection();
      
      case 'emotion_tracker':
        return (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
            <Heart className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-yellow-700 dark:text-yellow-300">
              Emotional tracking component will be implemented in a future task
            </p>
          </div>
        );
      
      case 'image_gallery':
        return (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <ImageIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-700 dark:text-blue-300">
              Image gallery component will be implemented in a future task
            </p>
          </div>
        );
      
      default:
        return (
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
            <AlertTriangle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              Section type "{section.type}" not yet implemented
            </p>
          </div>
        );
    }
  };

  return (
    <section className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ${className}`}>
      {/* Section header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            section.isCompleted 
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {getSectionIcon()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {section.title}
            </h2>
            {templateSection?.prompt && section.type !== 'text' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {templateSection.prompt}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {section.isRequired && (
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded">
              Required
            </span>
          )}
          <div className={`p-2 rounded-full ${
            section.isCompleted 
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
              : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
          }`}>
            {section.isCompleted ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="p-6">
        {renderSectionContent()}
      </div>
    </section>
  );
}
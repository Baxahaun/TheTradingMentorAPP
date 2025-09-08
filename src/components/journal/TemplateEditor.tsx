/**
 * Template Editor Component
 * 
 * Drag-and-drop interface for creating and editing journal templates.
 * Supports all section types with configuration options.
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  CheckSquare,
  Star,
  Heart,
  Link,
  Image,
  Save,
  X,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  JournalTemplate,
  TemplateSection,
  TemplateCategory,
  JournalSectionType,
  TemplateSectionConfig,
  ChecklistItem,
  RatingMetric
} from '../../types/journal';

interface TemplateEditorProps {
  template?: JournalTemplate | null;
  onSave: (template: Partial<JournalTemplate>) => void;
  onCancel: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom' as TemplateCategory,
    tags: [] as string[],
    sections: [] as TemplateSection[]
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Initialize form data
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags || [],
        sections: template.sections || []
      });
    }
  }, [template]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Template name is required');
      return;
    }

    if (formData.sections.length === 0) {
      alert('Template must have at least one section');
      return;
    }

    onSave(formData);
  };

  const addSection = (type: JournalSectionType) => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: getSectionTypeLabel(type),
      prompt: getDefaultPrompt(type),
      placeholder: getDefaultPlaceholder(type),
      isRequired: false,
      order: formData.sections.length,
      config: getDefaultConfig(type)
    };

    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));

    setEditingSectionId(newSection.id);
  };

  const updateSection = (sectionId: string, updates: Partial<TemplateSection>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const deleteSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...formData.sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    
    // Update order values
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));

    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const sectionTypes: { type: JournalSectionType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      type: 'text',
      label: 'Text',
      icon: <Type className="w-4 h-4" />,
      description: 'Free-form text input for notes and reflections'
    },
    {
      type: 'checklist',
      label: 'Checklist',
      icon: <CheckSquare className="w-4 h-4" />,
      description: 'List of items to check off'
    },
    {
      type: 'rating',
      label: 'Rating',
      icon: <Star className="w-4 h-4" />,
      description: 'Rating scales for process metrics'
    },
    {
      type: 'emotion_tracker',
      label: 'Emotion Tracker',
      icon: <Heart className="w-4 h-4" />,
      description: 'Emotional state tracking and mood selection'
    },
    {
      type: 'trade_reference',
      label: 'Trade Reference',
      icon: <Link className="w-4 h-4" />,
      description: 'Reference and link to specific trades'
    },
    {
      type: 'image_gallery',
      label: 'Image Gallery',
      icon: <Image className="w-4 h-4" />,
      description: 'Upload and organize screenshots and charts'
    }
  ];

  const categories: { value: TemplateCategory; label: string }[] = [
    { value: 'pre-market', label: 'Pre-Market' },
    { value: 'post-market', label: 'Post-Market' },
    { value: 'full-day', label: 'Full Day' },
    { value: 'trade-review', label: 'Trade Review' },
    { value: 'emotional-check', label: 'Emotional Check' },
    { value: 'weekly-review', label: 'Weekly Review' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <p className="text-gray-600 mt-1">
            Design a custom template for your journal entries
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center px-3 py-2 text-sm border rounded-md ${
              previewMode
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          
          <button
            onClick={onCancel}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Template Info</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this template is for"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TemplateCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add tag"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section Types */}
          {!previewMode && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Add Sections</h3>
              
              <div className="space-y-2">
                {sectionTypes.map(sectionType => (
                  <button
                    key={sectionType.type}
                    onClick={() => addSection(sectionType.type)}
                    className="w-full flex items-start p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5 mr-3 text-gray-500">
                      {sectionType.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {sectionType.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {sectionType.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Template Sections */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Template Sections</h3>
              <span className="text-sm text-gray-600">
                {formData.sections.length} section{formData.sections.length !== 1 ? 's' : ''}
              </span>
            </div>

            {formData.sections.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Settings className="w-12 h-12 mx-auto" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h4>
                <p className="text-gray-600 mb-4">
                  Add sections from the panel on the left to build your template
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <SectionEditor
                      key={section.id}
                      section={section}
                      index={index}
                      isEditing={editingSectionId === section.id}
                      previewMode={previewMode}
                      onUpdate={(updates) => updateSection(section.id, updates)}
                      onDelete={() => deleteSection(section.id)}
                      onStartEdit={() => setEditingSectionId(section.id)}
                      onStopEdit={() => setEditingSectionId(null)}
                      onMove={moveSection}
                      draggedIndex={draggedIndex}
                      onDragStart={() => setDraggedIndex(index)}
                      onDragEnd={() => setDraggedIndex(null)}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Editor Component
interface SectionEditorProps {
  section: TemplateSection;
  index: number;
  isEditing: boolean;
  previewMode: boolean;
  onUpdate: (updates: Partial<TemplateSection>) => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  draggedIndex: number | null;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  index,
  isEditing,
  previewMode,
  onUpdate,
  onDelete,
  onStartEdit,
  onStopEdit,
  onMove,
  draggedIndex,
  onDragStart,
  onDragEnd
}) => {
  const [localConfig, setLocalConfig] = useState(section.config);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onMove(draggedIndex, index);
    }
    onDragEnd();
  };

  const updateConfig = (configUpdates: Partial<TemplateSectionConfig>) => {
    const newConfig = { ...localConfig, ...configUpdates };
    setLocalConfig(newConfig);
    onUpdate({ config: newConfig });
  };

  if (previewMode) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <SectionPreview section={section} />
      </div>
    );
  }

  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 ${
        draggedIndex === index ? 'opacity-50' : ''
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="cursor-move text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          
          <div>
            <h4 className="font-medium text-gray-900">{section.title}</h4>
            <p className="text-sm text-gray-600">{getSectionTypeLabel(section.type)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={section.isRequired}
              onChange={(e) => onUpdate({ isRequired: e.target.checked })}
              className="mr-2"
            />
            Required
          </label>
          
          <button
            onClick={isEditing ? onStopEdit : onStartEdit}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={section.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={section.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt/Instructions
            </label>
            <textarea
              value={section.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Instructions or question for this section"
            />
          </div>

          <SectionConfigEditor
            sectionType={section.type}
            config={localConfig}
            onUpdate={updateConfig}
          />
        </div>
      )}
    </div>
  );
};

// Section Configuration Editor
interface SectionConfigEditorProps {
  sectionType: JournalSectionType;
  config: TemplateSectionConfig;
  onUpdate: (config: Partial<TemplateSectionConfig>) => void;
}

const SectionConfigEditor: React.FC<SectionConfigEditorProps> = ({
  sectionType,
  config,
  onUpdate
}) => {
  switch (sectionType) {
    case 'text':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Words
            </label>
            <input
              type="number"
              value={config.minWords || ''}
              onChange={(e) => onUpdate({ minWords: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Words
            </label>
            <input
              type="number"
              value={config.maxWords || ''}
              onChange={(e) => onUpdate({ maxWords: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      );

    case 'checklist':
      return (
        <ChecklistConfigEditor
          items={config.items || []}
          onUpdate={(items) => onUpdate({ items })}
        />
      );

    case 'rating':
      return (
        <RatingConfigEditor
          metrics={config.metrics || []}
          scale={config.scale || 5}
          onUpdate={(updates) => onUpdate(updates)}
        />
      );

    case 'image_gallery':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Images
            </label>
            <input
              type="number"
              value={config.maxImages || ''}
              onChange={(e) => onUpdate({ maxImages: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={config.allowAnnotations || false}
                onChange={(e) => onUpdate({ allowAnnotations: e.target.checked })}
                className="mr-2"
              />
              Allow Annotations
            </label>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// Checklist Configuration Editor
interface ChecklistConfigEditorProps {
  items: ChecklistItem[];
  onUpdate: (items: ChecklistItem[]) => void;
}

const ChecklistConfigEditor: React.FC<ChecklistConfigEditorProps> = ({
  items,
  onUpdate
}) => {
  const addItem = () => {
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}`,
      text: '',
      isRequired: false
    };
    onUpdate([...items, newItem]);
  };

  const updateItem = (index: number, updates: Partial<ChecklistItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onUpdate(newItems);
  };

  const removeItem = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Checklist Items
        </label>
        <button
          onClick={addItem}
          className="flex items-center px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Item
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center space-x-2">
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(index, { text: e.target.value })}
              placeholder="Checklist item"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => removeItem(index)}
              className="p-2 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Rating Configuration Editor
interface RatingConfigEditorProps {
  metrics: RatingMetric[];
  scale: number;
  onUpdate: (updates: { metrics?: RatingMetric[]; scale?: number }) => void;
}

const RatingConfigEditor: React.FC<RatingConfigEditorProps> = ({
  metrics,
  scale,
  onUpdate
}) => {
  const addMetric = () => {
    const newMetric: RatingMetric = {
      id: `metric_${Date.now()}`,
      name: '',
      description: ''
    };
    onUpdate({ metrics: [...metrics, newMetric] });
  };

  const updateMetric = (index: number, updates: Partial<RatingMetric>) => {
    const newMetrics = [...metrics];
    newMetrics[index] = { ...newMetrics[index], ...updates };
    onUpdate({ metrics: newMetrics });
  };

  const removeMetric = (index: number) => {
    onUpdate({ metrics: metrics.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rating Scale (1 to {scale})
        </label>
        <select
          value={scale}
          onChange={(e) => onUpdate({ scale: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={3}>3-point scale</option>
          <option value={5}>5-point scale</option>
          <option value={10}>10-point scale</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Rating Metrics
          </label>
          <button
            onClick={addMetric}
            className="flex items-center px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Metric
          </button>
        </div>

        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={metric.id} className="border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={metric.name}
                  onChange={(e) => updateMetric(index, { name: e.target.value })}
                  placeholder="Metric name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-2"
                />
                <button
                  onClick={() => removeMetric(index)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={metric.description || ''}
                onChange={(e) => updateMetric(index, { description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Section Preview Component
interface SectionPreviewProps {
  section: TemplateSection;
}

const SectionPreview: React.FC<SectionPreviewProps> = ({ section }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{section.title}</h4>
        {section.isRequired && (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
            Required
          </span>
        )}
      </div>
      
      {section.prompt && (
        <p className="text-sm text-gray-600 mb-3">{section.prompt}</p>
      )}

      <div className="bg-gray-50 rounded-md p-3">
        <SectionTypePreview section={section} />
      </div>
    </div>
  );
};

// Section Type Preview Component
const SectionTypePreview: React.FC<{ section: TemplateSection }> = ({ section }) => {
  switch (section.type) {
    case 'text':
      return (
        <textarea
          placeholder={section.placeholder || 'Enter your thoughts...'}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          disabled
        />
      );

    case 'checklist':
      return (
        <div className="space-y-2">
          {(section.config.items || []).slice(0, 3).map((item: ChecklistItem, index: number) => (
            <label key={index} className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" disabled />
              {item.text}
            </label>
          ))}
          {(section.config.items?.length || 0) > 3 && (
            <p className="text-xs text-gray-500">
              +{(section.config.items?.length || 0) - 3} more items
            </p>
          )}
        </div>
      );

    case 'rating':
      return (
        <div className="space-y-3">
          {(section.config.metrics || []).slice(0, 2).map((metric: RatingMetric, index: number) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {metric.name}
              </label>
              <div className="flex space-x-2">
                {Array.from({ length: section.config.scale || 5 }, (_, i) => (
                  <button
                    key={i}
                    className="w-8 h-8 border border-gray-300 rounded text-sm"
                    disabled
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'emotion_tracker':
      return (
        <div className="text-sm text-gray-600">
          Emotional state tracking interface will appear here
        </div>
      );

    case 'trade_reference':
      return (
        <div className="text-sm text-gray-600">
          Trade selection and reference interface will appear here
        </div>
      );

    case 'image_gallery':
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Image upload area</p>
        </div>
      );

    default:
      return (
        <div className="text-sm text-gray-600">
          {getSectionTypeLabel(section.type)} section
        </div>
      );
  }
};

// Helper Functions
function getSectionTypeLabel(type: JournalSectionType): string {
  const labels = {
    text: 'Text',
    checklist: 'Checklist',
    rating: 'Rating',
    emotion_tracker: 'Emotion Tracker',
    trade_reference: 'Trade Reference',
    image_gallery: 'Image Gallery',
    market_analysis: 'Market Analysis',
    lesson_learned: 'Lesson Learned',
    goal_setting: 'Goal Setting',
    custom: 'Custom'
  };
  return labels[type] || 'Unknown';
}

function getDefaultPrompt(type: JournalSectionType): string {
  const prompts = {
    text: 'Share your thoughts and observations',
    checklist: 'Complete the following checklist',
    rating: 'Rate your performance on the following metrics',
    emotion_tracker: 'How are you feeling?',
    trade_reference: 'Select trades to reference in this section',
    image_gallery: 'Upload relevant screenshots or charts',
    market_analysis: 'Analyze the market conditions',
    lesson_learned: 'What did you learn today?',
    goal_setting: 'Set your goals and objectives',
    custom: 'Custom section prompt'
  };
  return prompts[type] || '';
}

function getDefaultPlaceholder(type: JournalSectionType): string {
  const placeholders = {
    text: 'Enter your thoughts here...',
    checklist: '',
    rating: '',
    emotion_tracker: '',
    trade_reference: '',
    image_gallery: '',
    market_analysis: 'Describe market conditions and your analysis...',
    lesson_learned: 'What insights did you gain today?',
    goal_setting: 'What do you want to achieve?',
    custom: 'Enter content here...'
  };
  return placeholders[type] || '';
}

function getDefaultConfig(type: JournalSectionType): TemplateSectionConfig {
  switch (type) {
    case 'text':
      return { allowRichText: true };
    case 'checklist':
      return { items: [], allowCustomItems: true };
    case 'rating':
      return { metrics: [], scale: 5 };
    case 'emotion_tracker':
      return { emotionPhase: 'preMarket' };
    case 'trade_reference':
      return { maxTrades: 10 };
    case 'image_gallery':
      return { maxImages: 5, allowAnnotations: true };
    default:
      return {};
  }
}
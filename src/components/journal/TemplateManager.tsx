/**
 * Template Manager Component
 * 
 * Main interface for managing journal templates including:
 * - Creating new templates
 * - Editing existing templates
 * - Viewing template library
 * - Import/export functionality
 * - Template usage analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Search,
  Filter,
  MoreVertical,
  Star,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { templateService } from '../../services/TemplateService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  JournalTemplate, 
  TemplateCategory,
  DEFAULT_JOURNAL_TEMPLATES 
} from '../../types/journal';
import { TemplateEditor } from './TemplateEditor';

interface TemplateManagerProps {
  onSelectTemplate?: (template: JournalTemplate) => void;
  selectedTemplateId?: string;
  mode?: 'selection' | 'management';
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  onSelectTemplate,
  selectedTemplateId,
  mode = 'management'
}) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<JournalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JournalTemplate | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, [user]);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [userTemplates, defaultTemplates] = await Promise.all([
        templateService.getUserTemplates(user.uid),
        templateService.getDefaultTemplates()
      ]);

      const allTemplates = [...defaultTemplates, ...userTemplates];
      setTemplates(allTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: JournalTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (template: JournalTemplate) => {
    if (!user || template.isSystemTemplate) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await templateService.deleteTemplate(user.uid, template.id);
      await loadTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: JournalTemplate) => {
    if (!user) return;

    try {
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        sharedWith: [],
        usageCount: 0
      };

      delete (duplicatedTemplate as any).id;
      delete (duplicatedTemplate as any).createdAt;
      delete (duplicatedTemplate as any).updatedAt;

      await templateService.createTemplate(user.uid, duplicatedTemplate);
      await loadTemplates();
    } catch (err) {
      console.error('Error duplicating template:', err);
      setError('Failed to duplicate template');
    }
  };

  const handleExportTemplate = async (template: JournalTemplate) => {
    try {
      const exportData = await templateService.exportTemplate(template.id);
      
      // Create and download file
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting template:', err);
      setError('Failed to export template');
    }
  };

  const handleImportTemplate = async (file: File) => {
    if (!user) return;

    try {
      const text = await file.text();
      await templateService.importTemplate(user.uid, text);
      await loadTemplates();
      setShowImportDialog(false);
    } catch (err) {
      console.error('Error importing template:', err);
      setError('Failed to import template');
    }
  };

  const handleSaveTemplate = async (templateData: Partial<JournalTemplate>) => {
    if (!user) return;

    try {
      if (editingTemplate) {
        // Update existing template
        await templateService.updateTemplate(user.uid, editingTemplate.id, templateData);
      } else {
        // Create new template
        await templateService.createTemplate(user.uid, {
          ...templateData,
          userId: user.uid,
          isDefault: false,
          isPublic: false,
          isSystemTemplate: false,
          sharedWith: [],
          tags: templateData.tags || []
        } as Omit<JournalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>);
      }

      await loadTemplates();
      setShowEditor(false);
      setEditingTemplate(null);
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
    }
  };

  const categories: { value: TemplateCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Templates' },
    { value: 'pre-market', label: 'Pre-Market' },
    { value: 'post-market', label: 'Post-Market' },
    { value: 'full-day', label: 'Full Day' },
    { value: 'trade-review', label: 'Trade Review' },
    { value: 'emotional-check', label: 'Emotional Check' },
    { value: 'custom', label: 'Custom' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  if (showEditor) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'selection' ? 'Select Template' : 'Template Manager'}
          </h2>
          <p className="text-gray-600 mt-1">
            {mode === 'selection' 
              ? 'Choose a template for your journal entry'
              : 'Create and manage your journal templates'
            }
          </p>
        </div>

        {mode === 'management' && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </button>
            <button
              onClick={handleCreateTemplate}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            mode={mode}
            onSelect={() => onSelectTemplate?.(template)}
            onEdit={() => handleEditTemplate(template)}
            onDelete={() => handleDeleteTemplate(template)}
            onDuplicate={() => handleDuplicateTemplate(template)}
            onExport={() => handleExportTemplate(template)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first template to get started'
            }
          </p>
          {mode === 'management' && (
            <button
              onClick={handleCreateTemplate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </button>
          )}
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog
          onImport={handleImportTemplate}
          onCancel={() => setShowImportDialog(false)}
        />
      )}
    </div>
  );
};

export default TemplateManager;

// Template Card Component
interface TemplateCardProps {
  template: JournalTemplate;
  isSelected: boolean;
  mode: 'selection' | 'management';
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  mode,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onExport
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getCategoryColor = (category: TemplateCategory) => {
    const colors = {
      'pre-market': 'bg-blue-100 text-blue-800',
      'post-market': 'bg-green-100 text-green-800',
      'full-day': 'bg-purple-100 text-purple-800',
      'trade-review': 'bg-orange-100 text-orange-800',
      'emotional-check': 'bg-pink-100 text-pink-800',
      'weekly-review': 'bg-indigo-100 text-indigo-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.custom;
  };

  return (
    <div
      className={`relative bg-white rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={mode === 'selection' ? onSelect : undefined}
    >
      {/* Template Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            {template.isSystemTemplate && (
              <Star className="w-4 h-4 text-yellow-500" />
            )}
            {template.isPublic && (
              <Users className="w-4 h-4 text-blue-500" />
            )}
          </div>
          
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}>
            {template.category.replace('-', ' ')}
          </span>
        </div>

        {mode === 'management' && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                  disabled={template.isSystemTemplate}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                {!template.isSystemTemplate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {template.description || 'No description provided'}
      </p>

      {/* Template Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{template.sections.length} sections</span>
          <div className="flex items-center">
            <BarChart3 className="w-3 h-3 mr-1" />
            <span>{template.usageCount} uses</span>
          </div>
        </div>
        
        {template.tags.length > 0 && (
          <div className="flex space-x-1">
            {template.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                {tag}
              </span>
            ))}
            {template.tags.length > 2 && (
              <span className="text-gray-400">+{template.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {mode === 'selection' && isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}
    </div>
  );
};

// Import Dialog Component
interface ImportDialogProps {
  onImport: (file: File) => void;
  onCancel: () => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({ onImport, onCancel }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      onImport(file);
    } else {
      alert('Please select a valid JSON file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Import Template</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Drag and drop a template JSON file here, or click to select
          </p>
          
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id="template-file-input"
          />
          
          <label
            htmlFor="template-file-input"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
          >
            Select File
          </label>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

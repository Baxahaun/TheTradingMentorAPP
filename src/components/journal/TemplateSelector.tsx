import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  FileText, 
  CheckSquare, 
  Star, 
  Heart, 
  BarChart3, 
  Image as ImageIcon,
  TrendingUp,
  Brain,
  Target,
  Clock,
  User,
  Globe,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { JournalTemplate, TemplateCategory } from '../../types/journal';
import { templateService } from '../../services/TemplateService';

interface TemplateSelectorProps {
  userId: string;
  onTemplateSelect: (template: JournalTemplate) => void;
  onCancel: () => void;
  selectedCategory?: TemplateCategory;
}

interface TemplateCardProps {
  template: JournalTemplate;
  onSelect: (template: JournalTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const getCategoryIcon = (category: TemplateCategory) => {
    switch (category) {
      case 'pre-market':
        return <Clock className="w-5 h-5" />;
      case 'post-market':
        return <TrendingUp className="w-5 h-5" />;
      case 'trade-review':
        return <BarChart3 className="w-5 h-5" />;
      case 'emotional-check':
        return <Heart className="w-5 h-5" />;
      case 'full-day':
        return <FileText className="w-5 h-5" />;
      case 'weekly-review':
        return <Brain className="w-5 h-5" />;
      default:
        return <Layout className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case 'pre-market':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'post-market':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'trade-review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'emotional-check':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'full-day':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'weekly-review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getSectionTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'checklist':
        return <CheckSquare className="w-4 h-4" />;
      case 'rating':
        return <Star className="w-4 h-4" />;
      case 'emotion_tracker':
        return <Heart className="w-4 h-4" />;
      case 'trade_reference':
        return <BarChart3 className="w-4 h-4" />;
      case 'image_gallery':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <Layout className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 hover:shadow-md group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
              {getCategoryIcon(template.category)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {template.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                  {template.category.replace('-', ' ')}
                </span>
                {template.isSystemTemplate ? (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Globe className="w-3 h-3" />
                    System
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <User className="w-3 h-3" />
                    Custom
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {template.usageCount > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {template.usageCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                uses
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* Sections Preview */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Sections ({template.sections.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {template.sections.slice(0, 4).map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
              >
                {getSectionTypeIcon(section.type)}
                <span className="truncate max-w-20">{section.title}</span>
              </div>
            ))}
            {template.sections.length > 4 && (
              <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-500">
                +{template.sections.length - 4} more
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onSelect(template)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors group-hover:bg-indigo-700"
        >
          <span>Use Template</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function TemplateSelector({
  userId,
  onTemplateSelect,
  onCancel,
  selectedCategory
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<JournalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>(
    selectedCategory || 'all'
  );

  const categories: { value: TemplateCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All Templates', icon: <Layout className="w-4 h-4" /> },
    { value: 'pre-market', label: 'Pre-Market', icon: <Clock className="w-4 h-4" /> },
    { value: 'post-market', label: 'Post-Market', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'trade-review', label: 'Trade Review', icon: <BarChart3 className="w-4 h-4" /> },
    { value: 'emotional-check', label: 'Emotional Check', icon: <Heart className="w-4 h-4" /> },
    { value: 'full-day', label: 'Full Day', icon: <FileText className="w-4 h-4" /> },
    { value: 'weekly-review', label: 'Weekly Review', icon: <Brain className="w-4 h-4" /> },
    { value: 'custom', label: 'Custom', icon: <Target className="w-4 h-4" /> }
  ];

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userTemplates, defaultTemplates] = await Promise.all([
          templateService.getUserTemplates(userId),
          templateService.getDefaultTemplates()
        ]);

        const allTemplates = [...defaultTemplates, ...userTemplates];
        setTemplates(allTemplates);
        setFilteredTemplates(allTemplates);
      } catch (err) {
        console.error('Error loading templates:', err);
        setError('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [userId]);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates;

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
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
  }, [templates, searchQuery, categoryFilter]);

  // Handle template selection
  const handleTemplateSelect = (template: JournalTemplate) => {
    onTemplateSelect(template);
  };

  // Create blank template
  const createBlankTemplate = (): JournalTemplate => ({
    id: 'blank',
    userId: 'system',
    name: 'Blank Entry',
    description: 'Start with a blank journal entry',
    category: 'custom',
    sections: [
      {
        id: 'notes',
        type: 'text',
        title: 'Daily Notes',
        prompt: 'Write your thoughts about today\'s trading session',
        isRequired: false,
        order: 1,
        config: { allowRichText: true }
      }
    ],
    isDefault: false,
    isPublic: false,
    isSystemTemplate: true,
    usageCount: 0,
    sharedWith: [],
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-gray-600 dark:text-gray-300">Loading templates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Templates
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose a Journal Template
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select a template to structure your daily journal entry, or start with a blank entry.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | 'all')}
            className="pl-10 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Start Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <button
          onClick={() => handleTemplateSelect(createBlankTemplate())}
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">Start Blank</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Begin with an empty journal</div>
          </div>
        </button>

        <button
          onClick={onCancel}
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-400 rotate-180" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">Go Back</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Return to journal view</div>
          </div>
        </button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleTemplateSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Templates Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No templates are available at the moment.'}
          </p>
          {(searchQuery || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
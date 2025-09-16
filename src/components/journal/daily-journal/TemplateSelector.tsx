import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import {
  FileText,
  Plus,
  Settings,
  CheckCircle,
  Circle,
  Search,
  Filter,
  Star,
  StarOff,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// Import types and services
import {
  JournalTemplate,
  TemplateCategory,
  TemplateSection,
  JournalSectionType,
  DEFAULT_JOURNAL_TEMPLATES
} from '../../../types/journal';
import { templateService } from '../../../services/TemplateService';

interface TemplateSelectorProps {
  selectedDate: Date;
  entryType: 'daily-journal' | 'trade-note';
  currentTemplateId?: string;
  onTemplateSelect: (templateId: string, template: JournalTemplate) => void;
  onTemplateCustomize: (customSections: TemplateSection[]) => void;
  className?: string;
}

/**
 * TemplateSelector Component
 *
 * Comprehensive template selection and customization interface for Daily Journal entries.
 * Allows users to choose from system and user templates, customize sections, and apply
 * templates to create structured journal entries.
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedDate,
  entryType,
  currentTemplateId,
  onTemplateSelect,
  onTemplateCustomize,
  className
}) => {
  const { user } = useAuth();

  // ===== STATE MANAGEMENT =====

  // Template data
  const [systemTemplates, setSystemTemplates] = useState<JournalTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<JournalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('full-day');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [selectedTemplateForCustomization, setSelectedTemplateForCustomization] = useState<JournalTemplate | null>(null);

  // Template creation state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom' as TemplateCategory
  });

  // Customization state
  const [customizedSections, setCustomizedSections] = useState<TemplateSection[]>([]);

  // ===== DATA LOADING =====

  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Load system templates (already available as DEFAULT_JOURNAL_TEMPLATES)
        setSystemTemplates(DEFAULT_JOURNAL_TEMPLATES.map(template => ({
          ...template,
          id: `system_${template.name.toLowerCase().replace(/\s+/g, '_')}`,
          userId: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as JournalTemplate)));

        // Load user templates
        const userTemplatesData = await templateService.getUserTemplates(user.uid);
        setUserTemplates(userTemplatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user]);

  // ===== FILTERED TEMPLATES =====

  // Combine and filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    const allTemplates = [...systemTemplates, ...userTemplates];

    return allTemplates.filter(template => {
      // Category filter
      if (selectedCategory !== 'full-day' && template.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return template.name.toLowerCase().includes(query) ||
               template.description.toLowerCase().includes(query) ||
               template.tags.some(tag => tag.toLowerCase().includes(query));
      }

      return true;
    });
  }, [systemTemplates, userTemplates, selectedCategory, searchQuery]);

  // ===== EVENT HANDLERS =====

  // Handle template selection
  const handleTemplateSelect = useCallback((template: JournalTemplate) => {
    onTemplateSelect(template.id, template);
  }, [onTemplateSelect]);

  // Handle template customization start
  const handleCustomizeTemplate = useCallback((template: JournalTemplate) => {
    setSelectedTemplateForCustomization(template);
    setCustomizedSections([...template.sections]);
    setShowCustomizeDialog(true);
  }, []);

  // Handle template creation
  const handleCreateTemplate = useCallback(async () => {
    if (!user || !newTemplate.name.trim()) return;

    try {
      const templateData = {
        ...newTemplate,
        sections: [
          {
            id: 'default-section',
            type: 'text' as JournalSectionType,
            title: 'Main Content',
            prompt: 'Write your journal entry here',
            isRequired: true,
            order: 1,
            config: {}
          }
        ],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        sharedWith: [],
        tags: []
      };

      const templateId = await templateService.createTemplate(user.uid, {
        ...templateData,
        userId: user.uid
      });
      const createdTemplate = await templateService.getTemplate(templateId);

      if (createdTemplate) {
        setUserTemplates(prev => [...prev, createdTemplate]);
        setNewTemplate({ name: '', description: '', category: 'custom' });
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  }, [user, newTemplate]);

  // Handle template deletion
  const handleDeleteTemplate = useCallback(async (template: JournalTemplate) => {
    if (!user || template.isSystemTemplate) return;

    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      await templateService.deleteTemplate(user.uid, template.id);
      setUserTemplates(prev => prev.filter(t => t.id !== template.id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }, [user]);

  // Handle section customization
  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<TemplateSection>) => {
    setCustomizedSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, ...updates }
          : section
      )
    );
  }, []);

  // Handle section addition
  const handleAddSection = useCallback(() => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      type: 'text',
      title: 'New Section',
      prompt: 'Enter your content here',
      isRequired: false,
      order: customizedSections.length + 1,
      config: {}
    };

    setCustomizedSections(prev => [...prev, newSection]);
  }, [customizedSections.length]);

  // Handle section removal
  const handleRemoveSection = useCallback((sectionId: string) => {
    setCustomizedSections(prev => prev.filter(section => section.id !== sectionId));
  }, []);

  // Apply customized template
  const handleApplyCustomization = useCallback(() => {
    onTemplateCustomize(customizedSections);
    setShowCustomizeDialog(false);
    setSelectedTemplateForCustomization(null);
    setCustomizedSections([]);
  }, [customizedSections, onTemplateCustomize]);

  // ===== RENDER HELPERS =====

  // Render template card
  const renderTemplateCard = useCallback((template: JournalTemplate) => {
    const isSelected = currentTemplateId === template.id;
    const isSystemTemplate = template.isSystemTemplate;

    return (
      <Card
        key={template.id}
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "ring-2 ring-primary border-primary",
          !isSelected && "hover:border-primary/50"
        )}
        onClick={() => handleTemplateSelect(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {template.name}
                {isSystemTemplate && (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {template.description}
              </p>
            </div>
            {isSelected && (
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Template stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{template.sections.length} sections</span>
              <span>{template.usageCount} uses</span>
            </div>

            {/* Section types preview */}
            <div className="flex flex-wrap gap-1">
              {template.sections.slice(0, 3).map((section, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                  {section.type.replace('_', ' ')}
                </Badge>
              ))}
              {template.sections.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  +{template.sections.length - 3}
                </Badge>
              )}
            </div>

            {/* Template actions */}
            <div className="flex items-center justify-end gap-1 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleCustomizeTemplate(template);
                }}
                title="Customize template"
              >
                <Settings className="h-3 w-3" />
              </Button>

              {!isSystemTemplate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template);
                  }}
                  title="Delete template"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [currentTemplateId, handleTemplateSelect, handleCustomizeTemplate, handleDeleteTemplate]);

  // Render section editor in customization dialog
  const renderSectionEditor = useCallback((section: TemplateSection, index: number) => (
    <Card key={section.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Section {index + 1}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveSection(section.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`section-title-${section.id}`}>Title</Label>
            <Input
              id={`section-title-${section.id}`}
              value={section.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSectionUpdate(section.id, { title: e.target.value })}
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor={`section-type-${section.id}`}>Type</Label>
            <Select
              value={section.type}
              onValueChange={(value: string) => handleSectionUpdate(section.id, { type: value as JournalSectionType })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="emotion_tracker">Emotion Tracker</SelectItem>
                <SelectItem value="trade_reference">Trade Reference</SelectItem>
                <SelectItem value="image_gallery">Image Gallery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor={`section-prompt-${section.id}`}>Prompt</Label>
          <Textarea
            id={`section-prompt-${section.id}`}
            value={section.prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleSectionUpdate(section.id, { prompt: e.target.value })}
            className="text-sm min-h-[60px]"
            placeholder="Enter instructions or questions for this section"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id={`section-required-${section.id}`}
            checked={section.isRequired}
            onCheckedChange={(checked: boolean) => handleSectionUpdate(section.id, { isRequired: checked })}
          />
          <Label htmlFor={`section-required-${section.id}`} className="text-sm">
            Required section
          </Label>
        </div>
      </CardContent>
    </Card>
  ), [handleSectionUpdate, handleRemoveSection]);

  // ===== MAIN RENDER =====

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to access templates</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Journal Templates</h3>
          <p className="text-sm text-muted-foreground">
            Choose a template to structure your {entryType.replace('-', ' ')} entry
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this template is for"
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(value: string) => setNewTemplate(prev => ({ ...prev, category: value as TemplateCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-market">Pre-Market</SelectItem>
                    <SelectItem value="post-market">Post-Market</SelectItem>
                    <SelectItem value="full-day">Full Day</SelectItem>
                    <SelectItem value="trade-review">Trade Review</SelectItem>
                    <SelectItem value="emotional-check">Emotional Check</SelectItem>
                    <SelectItem value="weekly-review">Weekly Review</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name.trim()}
                >
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as TemplateCategory)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full-day">All Categories</SelectItem>
            <SelectItem value="pre-market">Pre-Market</SelectItem>
            <SelectItem value="post-market">Post-Market</SelectItem>
            <SelectItem value="full-day">Full Day</SelectItem>
            <SelectItem value="trade-review">Trade Review</SelectItem>
            <SelectItem value="emotional-check">Emotional Check</SelectItem>
            <SelectItem value="weekly-review">Weekly Review</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(renderTemplateCard)}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Create your first custom template to get started"
              }
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template Customization Dialog */}
      <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Template</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Modify sections and settings for "{selectedTemplateForCustomization?.name}"
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {customizedSections.map(renderSectionEditor)}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleAddSection}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCustomizeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyCustomization}>
                  Apply Customization
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateSelector;
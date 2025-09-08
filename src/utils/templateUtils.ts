/**
 * Template Utilities for Daily Trading Journal
 * 
 * Utility functions for working with journal templates,
 * including validation, transformation, and helper functions.
 */

import { 
  JournalTemplate, 
  TemplateSection, 
  JournalSection,
  TemplateCategory,
  JournalSectionType,
  JOURNAL_ERROR_CODES 
} from '../types/journal';

/**
 * Validate a template structure
 */
export function validateTemplate(template: Partial<JournalTemplate>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (!template.sections || template.sections.length === 0) {
    errors.push('Template must have at least one section');
  }

  // Validate sections
  if (template.sections) {
    const sectionIds = new Set<string>();
    const sectionOrders = new Set<number>();

    template.sections.forEach((section, index) => {
      // Check for duplicate IDs
      if (sectionIds.has(section.id)) {
        errors.push(`Duplicate section ID: ${section.id}`);
      }
      sectionIds.add(section.id);

      // Check for duplicate orders
      if (sectionOrders.has(section.order)) {
        warnings.push(`Duplicate section order: ${section.order}`);
      }
      sectionOrders.add(section.order);

      // Validate section structure
      if (!section.title || section.title.trim().length === 0) {
        errors.push(`Section ${index + 1} is missing a title`);
      }

      if (!section.prompt || section.prompt.trim().length === 0) {
        warnings.push(`Section "${section.title}" is missing a prompt`);
      }

      // Validate section type-specific config
      const configValidation = validateSectionConfig(section.type, section.config);
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);
    });
  }

  // Template name length
  if (template.name && template.name.length > 100) {
    warnings.push('Template name is very long (over 100 characters)');
  }

  // Description length
  if (template.description && template.description.length > 500) {
    warnings.push('Template description is very long (over 500 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate section configuration based on section type
 */
export function validateSectionConfig(
  type: JournalSectionType, 
  config: any
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (type) {
    case 'text':
      if (config.minWords && config.maxWords && config.minWords > config.maxWords) {
        errors.push('Minimum word count cannot be greater than maximum word count');
      }
      break;

    case 'checklist':
      if (!config.items || !Array.isArray(config.items) || config.items.length === 0) {
        errors.push('Checklist sections must have at least one item');
      }
      break;

    case 'rating':
      if (!config.metrics || !Array.isArray(config.metrics) || config.metrics.length === 0) {
        errors.push('Rating sections must have at least one metric');
      }
      if (config.scale && (config.scale < 2 || config.scale > 10)) {
        warnings.push('Rating scale should be between 2 and 10');
      }
      break;

    case 'emotion_tracker':
      if (config.emotionPhase && !['preMarket', 'duringTrading', 'postMarket'].includes(config.emotionPhase)) {
        errors.push('Invalid emotion phase. Must be preMarket, duringTrading, or postMarket');
      }
      break;

    case 'trade_reference':
      if (config.maxTrades && config.maxTrades < 1) {
        errors.push('Maximum trades must be at least 1');
      }
      break;

    case 'image_gallery':
      if (config.maxImages && config.maxImages < 1) {
        errors.push('Maximum images must be at least 1');
      }
      break;
  }

  return { errors, warnings };
}

/**
 * Generate a unique section ID
 */
export function generateSectionId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sort template sections by order
 */
export function sortSectionsByOrder(sections: TemplateSection[]): TemplateSection[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

/**
 * Calculate template completion requirements
 */
export function calculateTemplateRequirements(template: JournalTemplate): {
  totalSections: number;
  requiredSections: number;
  optionalSections: number;
  estimatedTimeMinutes: number;
} {
  const totalSections = template.sections.length;
  const requiredSections = template.sections.filter(s => s.isRequired).length;
  const optionalSections = totalSections - requiredSections;

  // Estimate time based on section types
  let estimatedTimeMinutes = 0;
  template.sections.forEach(section => {
    switch (section.type) {
      case 'text':
        estimatedTimeMinutes += section.config.minWords ? Math.ceil(section.config.minWords / 50) : 2;
        break;
      case 'checklist':
        estimatedTimeMinutes += Math.ceil((section.config.items?.length || 5) * 0.5);
        break;
      case 'rating':
        estimatedTimeMinutes += Math.ceil((section.config.metrics?.length || 3) * 0.5);
        break;
      case 'emotion_tracker':
        estimatedTimeMinutes += 2;
        break;
      case 'trade_reference':
        estimatedTimeMinutes += 3;
        break;
      case 'image_gallery':
        estimatedTimeMinutes += 5;
        break;
      default:
        estimatedTimeMinutes += 2;
    }
  });

  return {
    totalSections,
    requiredSections,
    optionalSections,
    estimatedTimeMinutes: Math.max(estimatedTimeMinutes, 5) // Minimum 5 minutes
  };
}

/**
 * Convert template section to journal section
 */
export function templateSectionToJournalSection(
  templateSection: TemplateSection,
  sectionId?: string
): JournalSection {
  return {
    id: sectionId || generateSectionId(),
    type: templateSection.type,
    title: templateSection.title,
    content: getDefaultContentForSectionType(templateSection.type, templateSection.config),
    order: templateSection.order,
    isRequired: templateSection.isRequired,
    isCompleted: false,
    templateSectionId: templateSection.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wordCount: 0
  };
}

/**
 * Get default content for a section type
 */
export function getDefaultContentForSectionType(type: JournalSectionType, config: any): any {
  switch (type) {
    case 'text':
      return '';
    
    case 'checklist':
      return config.items?.map((item: any) => ({
        ...item,
        checked: false
      })) || [];
    
    case 'rating':
      return config.metrics?.reduce((acc: any, metric: any) => {
        acc[metric.id] = 0;
        return acc;
      }, {}) || {};
    
    case 'emotion_tracker':
      return {
        confidence: 0,
        anxiety: 0,
        focus: 0,
        energy: 0,
        mood: 'neutral',
        notes: ''
      };
    
    case 'trade_reference':
      return [];
    
    case 'image_gallery':
      return [];
    
    default:
      return null;
  }
}

/**
 * Check if a template is compatible with a specific category
 */
export function isTemplateCompatibleWithCategory(
  template: JournalTemplate, 
  targetCategory: TemplateCategory
): boolean {
  // System templates are always compatible
  if (template.isSystemTemplate) {
    return true;
  }

  // Custom templates are compatible with any category
  if (template.category === 'custom') {
    return true;
  }

  // Otherwise, categories must match
  return template.category === targetCategory;
}

/**
 * Get template usage statistics
 */
export function getTemplateUsageStats(templates: JournalTemplate[]): {
  totalTemplates: number;
  systemTemplates: number;
  userTemplates: number;
  mostUsedTemplate: JournalTemplate | null;
  averageUsageCount: number;
  categoryCounts: Record<TemplateCategory, number>;
} {
  const totalTemplates = templates.length;
  const systemTemplates = templates.filter(t => t.isSystemTemplate).length;
  const userTemplates = totalTemplates - systemTemplates;
  
  const mostUsedTemplate = templates.reduce((prev, current) => 
    (prev.usageCount > current.usageCount) ? prev : current, templates[0] || null
  );

  const averageUsageCount = templates.length > 0 
    ? templates.reduce((sum, t) => sum + t.usageCount, 0) / templates.length 
    : 0;

  const categoryCounts: Record<TemplateCategory, number> = {
    'pre-market': 0,
    'post-market': 0,
    'full-day': 0,
    'trade-review': 0,
    'emotional-check': 0,
    'weekly-review': 0,
    'custom': 0
  };

  templates.forEach(template => {
    categoryCounts[template.category]++;
  });

  return {
    totalTemplates,
    systemTemplates,
    userTemplates,
    mostUsedTemplate,
    averageUsageCount,
    categoryCounts
  };
}

/**
 * Create a template from an existing journal entry
 */
export function createTemplateFromJournalEntry(
  journalSections: JournalSection[],
  templateName: string,
  templateDescription: string,
  category: TemplateCategory = 'custom'
): Omit<JournalTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'usageCount'> {
  const templateSections: TemplateSection[] = journalSections.map(section => ({
    id: section.templateSectionId || generateSectionId(),
    type: section.type,
    title: section.title,
    prompt: `Enter your ${section.title.toLowerCase()}`,
    placeholder: getPlaceholderForSectionType(section.type),
    isRequired: section.isRequired,
    order: section.order,
    config: getConfigFromContent(section.type, section.content)
  }));

  return {
    name: templateName,
    description: templateDescription,
    category,
    sections: templateSections,
    isDefault: false,
    isPublic: false,
    isSystemTemplate: false,
    sharedWith: [],
    tags: []
  };
}

/**
 * Get placeholder text for section type
 */
function getPlaceholderForSectionType(type: JournalSectionType): string {
  switch (type) {
    case 'text':
      return 'Enter your thoughts here...';
    case 'checklist':
      return 'Complete the checklist items';
    case 'rating':
      return 'Rate each metric';
    case 'emotion_tracker':
      return 'Track your emotional state';
    case 'trade_reference':
      return 'Select trades to reference';
    case 'image_gallery':
      return 'Upload relevant images';
    default:
      return 'Enter content here...';
  }
}

/**
 * Extract configuration from journal section content
 */
function getConfigFromContent(type: JournalSectionType, content: any): any {
  switch (type) {
    case 'checklist':
      if (Array.isArray(content)) {
        return {
          items: content.map(item => ({
            id: item.id || generateSectionId(),
            text: item.text || 'Checklist item'
          }))
        };
      }
      return { items: [] };
    
    case 'rating':
      if (typeof content === 'object' && content !== null) {
        return {
          metrics: Object.keys(content).map(key => ({
            id: key,
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
          })),
          scale: 5
        };
      }
      return { metrics: [], scale: 5 };
    
    default:
      return {};
  }
}

/**
 * Merge two templates (useful for template inheritance)
 */
export function mergeTemplates(
  baseTemplate: JournalTemplate,
  overrideTemplate: Partial<JournalTemplate>
): JournalTemplate {
  const mergedSections = [...baseTemplate.sections];
  
  if (overrideTemplate.sections) {
    overrideTemplate.sections.forEach(overrideSection => {
      const existingIndex = mergedSections.findIndex(s => s.id === overrideSection.id);
      if (existingIndex >= 0) {
        mergedSections[existingIndex] = { ...mergedSections[existingIndex], ...overrideSection };
      } else {
        mergedSections.push(overrideSection);
      }
    });
  }

  return {
    ...baseTemplate,
    ...overrideTemplate,
    sections: sortSectionsByOrder(mergedSections),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Template search and filtering utilities
 */
export const templateFilters = {
  byCategory: (templates: JournalTemplate[], category: TemplateCategory) =>
    templates.filter(t => t.category === category),
  
  byUsage: (templates: JournalTemplate[], minUsage: number = 1) =>
    templates.filter(t => t.usageCount >= minUsage),
  
  byUser: (templates: JournalTemplate[], userId: string) =>
    templates.filter(t => t.userId === userId && !t.isSystemTemplate),
  
  systemOnly: (templates: JournalTemplate[]) =>
    templates.filter(t => t.isSystemTemplate),
  
  publicOnly: (templates: JournalTemplate[]) =>
    templates.filter(t => t.isPublic),
  
  byTags: (templates: JournalTemplate[], tags: string[]) =>
    templates.filter(t => tags.some(tag => t.tags.includes(tag))),
  
  search: (templates: JournalTemplate[], query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return templates.filter(t =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
};
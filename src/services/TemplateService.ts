/**
 * Template Service for Daily Trading Journal
 * 
 * This service manages journal templates including CRUD operations,
 * default template definitions, and template application logic.
 * Integrates with Firebase Firestore for persistence.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  JournalTemplate, 
  TemplateCategory,
  JournalEntry,
  JournalSection,
  DEFAULT_JOURNAL_TEMPLATES,
  JOURNAL_ERROR_CODES
} from '../types/journal';

export class TemplateService {
  private readonly COLLECTION_NAME = 'journalTemplates';

  /**
   * Create a new journal template
   */
  async createTemplate(
    userId: string, 
    templateData: Omit<JournalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
  ): Promise<string> {
    try {
      const template: Omit<JournalTemplate, 'id'> = {
        ...templateData,
        userId,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<JournalTemplate | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, templateId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: this.timestampToString(data.createdAt),
        updatedAt: this.timestampToString(data.updatedAt)
      } as JournalTemplate;
    } catch (error) {
      console.error('Error getting template:', error);
      throw new Error('Failed to get template');
    }
  }

  /**
   * Get all templates for a user
   */
  async getUserTemplates(userId: string): Promise<JournalTemplate[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const templates: JournalTemplate[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          ...data,
          createdAt: this.timestampToString(data.createdAt),
          updatedAt: this.timestampToString(data.updatedAt)
        } as JournalTemplate);
      });

      return templates;
    } catch (error) {
      console.error('Error getting user templates:', error);
      throw new Error('Failed to get user templates');
    }
  }

  /**
   * Get default system templates
   */
  async getDefaultTemplates(): Promise<JournalTemplate[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isSystemTemplate', '==', true),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const templates: JournalTemplate[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          ...data,
          createdAt: this.timestampToString(data.createdAt),
          updatedAt: this.timestampToString(data.updatedAt)
        } as JournalTemplate);
      });

      return templates;
    } catch (error) {
      console.error('Error getting default templates:', error);
      throw new Error('Failed to get default templates');
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(
    userId: string, 
    category: TemplateCategory
  ): Promise<JournalTemplate[]> {
    try {
      // Get both user templates and system templates for the category
      const userQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('category', '==', category),
        orderBy('name', 'asc')
      );

      const systemQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('isSystemTemplate', '==', true),
        where('category', '==', category),
        orderBy('name', 'asc')
      );

      const [userSnapshot, systemSnapshot] = await Promise.all([
        getDocs(userQuery),
        getDocs(systemQuery)
      ]);

      const templates: JournalTemplate[] = [];

      // Add system templates first
      systemSnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          ...data,
          createdAt: this.timestampToString(data.createdAt),
          updatedAt: this.timestampToString(data.updatedAt)
        } as JournalTemplate);
      });

      // Add user templates
      userSnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          ...data,
          createdAt: this.timestampToString(data.createdAt),
          updatedAt: this.timestampToString(data.updatedAt)
        } as JournalTemplate);
      });

      return templates;
    } catch (error) {
      console.error('Error getting templates by category:', error);
      throw new Error('Failed to get templates by category');
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    userId: string, 
    templateId: string, 
    updates: Partial<Omit<JournalTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      // First verify the template exists and belongs to the user
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(JOURNAL_ERROR_CODES.TEMPLATE_NOT_FOUND);
      }

      if (template.userId !== userId && !template.isSystemTemplate) {
        throw new Error(JOURNAL_ERROR_CODES.UNAUTHORIZED_ACCESS);
      }

      // System templates cannot be modified
      if (template.isSystemTemplate) {
        throw new Error('Cannot modify system templates');
      }

      const docRef = doc(db, this.COLLECTION_NAME, templateId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    try {
      // First verify the template exists and belongs to the user
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(JOURNAL_ERROR_CODES.TEMPLATE_NOT_FOUND);
      }

      // System templates cannot be deleted
      if (template.isSystemTemplate) {
        throw new Error('Cannot delete system templates');
      }

      if (template.userId !== userId) {
        throw new Error(JOURNAL_ERROR_CODES.UNAUTHORIZED_ACCESS);
      }

      const docRef = doc(db, this.COLLECTION_NAME, templateId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Apply a template to create journal entry sections
   */
  async applyTemplateToEntry(
    templateId: string, 
    existingEntry?: Partial<JournalEntry>
  ): Promise<JournalSection[]> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(JOURNAL_ERROR_CODES.TEMPLATE_NOT_FOUND);
      }

      // Increment usage count
      await this.incrementUsageCount(templateId);

      // Convert template sections to journal sections
      const journalSections: JournalSection[] = template.sections.map((templateSection) => ({
        id: this.generateSectionId(),
        type: templateSection.type,
        title: templateSection.title,
        content: this.getDefaultContentForSectionType(templateSection.type, templateSection.config),
        order: templateSection.order,
        isRequired: templateSection.isRequired,
        isCompleted: false,
        templateSectionId: templateSection.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: 0
      }));

      return journalSections;
    } catch (error) {
      console.error('Error applying template to entry:', error);
      throw error;
    }
  }

  /**
   * Initialize default system templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const templateData of DEFAULT_JOURNAL_TEMPLATES) {
        const template = {
          ...templateData,
          userId: 'system',
          usageCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = doc(collection(db, this.COLLECTION_NAME));
        batch.set(docRef, template);
      }

      await batch.commit();
      console.log('Default templates initialized successfully');
    } catch (error) {
      console.error('Error initializing default templates:', error);
      throw new Error('Failed to initialize default templates');
    }
  }

  /**
   * Export template configuration
   */
  async exportTemplate(templateId: string): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(JOURNAL_ERROR_CODES.TEMPLATE_NOT_FOUND);
      }

      // Remove system-specific fields for export
      const exportData = {
        name: template.name,
        description: template.description,
        category: template.category,
        sections: template.sections,
        tags: template.tags
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting template:', error);
      throw error;
    }
  }

  /**
   * Import template from configuration
   */
  async importTemplate(userId: string, templateData: string): Promise<string> {
    try {
      const parsedData = JSON.parse(templateData);
      
      // Validate required fields
      if (!parsedData.name || !parsedData.sections) {
        throw new Error('Invalid template data: missing required fields');
      }

      const template: Omit<JournalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
        userId,
        name: parsedData.name,
        description: parsedData.description || '',
        category: parsedData.category || 'custom',
        sections: parsedData.sections,
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        sharedWith: [],
        tags: parsedData.tags || []
      };

      return await this.createTemplate(userId, template);
    } catch (error) {
      console.error('Error importing template:', error);
      throw new Error('Failed to import template: Invalid format');
    }
  }

  /**
   * Search templates by name or description
   */
  async searchTemplates(userId: string, searchQuery: string): Promise<JournalTemplate[]> {
    try {
      // Get all user templates and system templates
      const [userTemplates, systemTemplates] = await Promise.all([
        this.getUserTemplates(userId),
        this.getDefaultTemplates()
      ]);

      const allTemplates = [...systemTemplates, ...userTemplates];
      const query = searchQuery.toLowerCase();

      // Filter templates based on search query
      return allTemplates.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    } catch (error) {
      console.error('Error searching templates:', error);
      throw new Error('Failed to search templates');
    }
  }

  // Private helper methods

  private async incrementUsageCount(templateId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, templateId);
      const template = await this.getTemplate(templateId);
      
      if (template) {
        await updateDoc(docRef, {
          usageCount: template.usageCount + 1,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      // Don't throw error for usage count increment failure
    }
  }

  private generateSectionId(): string {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultContentForSectionType(type: string, config: any): any {
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

  private timestampToString(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    return new Date().toISOString();
  }
}

// Export singleton instance
export const templateService = new TemplateService();
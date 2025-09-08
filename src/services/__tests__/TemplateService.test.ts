/**
 * Unit tests for TemplateService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from '../TemplateService';
import { JournalTemplate, TemplateCategory, DEFAULT_JOURNAL_TEMPLATES } from '../../types/journal';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 }))
}));

// Import mocked functions
import { 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';

const mockAddDoc = vi.mocked(addDoc);
const mockGetDoc = vi.mocked(getDoc);
const mockGetDocs = vi.mocked(getDocs);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockDeleteDoc = vi.mocked(deleteDoc);
const mockWriteBatch = vi.mocked(writeBatch);

describe('TemplateService', () => {
  let templateService: TemplateService;
  const mockUserId = 'test-user-123';
  const mockTemplateId = 'template-123';

  beforeEach(() => {
    templateService = new TemplateService();
    vi.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a new template successfully', async () => {
      const mockTemplateData = {
        name: 'Test Template',
        description: 'A test template',
        category: 'custom' as TemplateCategory,
        sections: [],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        sharedWith: [],
        tags: ['test']
      };

      mockAddDoc.mockResolvedValue({ id: mockTemplateId });

      const result = await templateService.createTemplate(mockUserId, mockTemplateData);

      expect(result).toBe(mockTemplateId);
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined, // collection reference is mocked as undefined
        expect.objectContaining({
          ...mockTemplateData,
          userId: mockUserId,
          usageCount: 0
        })
      );
    });

    it('should handle creation errors', async () => {
      const mockTemplateData = {
        name: 'Test Template',
        description: 'A test template',
        category: 'custom' as TemplateCategory,
        sections: [],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        sharedWith: [],
        tags: []
      };

      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(templateService.createTemplate(mockUserId, mockTemplateData))
        .rejects.toThrow('Failed to create template');
    });
  });

  describe('getTemplate', () => {
    it('should retrieve a template successfully', async () => {
      const mockTemplateData = {
        name: 'Test Template',
        userId: mockUserId,
        description: 'A test template',
        category: 'custom',
        sections: [],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        sharedWith: [],
        tags: [],
        usageCount: 5,
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-02') }
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockTemplateId,
        data: () => mockTemplateData
      });

      const result = await templateService.getTemplate(mockTemplateId);

      expect(result).toEqual({
        id: mockTemplateId,
        ...mockTemplateData,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      });
    });

    it('should return null for non-existent template', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await templateService.getTemplate('non-existent');

      expect(result).toBeNull();
    });

    it('should handle retrieval errors', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(templateService.getTemplate(mockTemplateId))
        .rejects.toThrow('Failed to get template');
    });
  });

  describe('getUserTemplates', () => {
    it('should retrieve user templates successfully', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Template 1',
          userId: mockUserId,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') }
        },
        {
          id: 'template-2',
          name: 'Template 2',
          userId: mockUserId,
          createdAt: { toDate: () => new Date('2024-01-02') },
          updatedAt: { toDate: () => new Date('2024-01-02') }
        }
      ];

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          mockTemplates.forEach((template) => {
            callback({
              id: template.id,
              data: () => template
            });
          });
        }
      });

      const result = await templateService.getUserTemplates(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('template-1');
      expect(result[1].id).toBe('template-2');
    });

    it('should handle empty results', async () => {
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          // No templates
        }
      });

      const result = await templateService.getUserTemplates(mockUserId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getDefaultTemplates', () => {
    it('should retrieve system templates successfully', async () => {
      const mockSystemTemplates = [
        {
          id: 'system-template-1',
          name: 'Pre-Market Checklist',
          isSystemTemplate: true,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') }
        }
      ];

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          mockSystemTemplates.forEach((template) => {
            callback({
              id: template.id,
              data: () => template
            });
          });
        }
      });

      const result = await templateService.getDefaultTemplates();

      expect(result).toHaveLength(1);
      expect(result[0].isSystemTemplate).toBe(true);
    });
  });

  describe('updateTemplate', () => {
    it('should update a user template successfully', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        userId: mockUserId,
        name: 'Original Template',
        isSystemTemplate: false
      };

      // Mock getTemplate call
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockTemplateId,
        data: () => mockTemplate
      });

      const updates = { name: 'Updated Template' };

      await templateService.updateTemplate(mockUserId, mockTemplateId, updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        undefined, // doc reference is mocked as undefined
        expect.objectContaining({
          ...updates
        })
      );
    });

    it('should prevent updating system templates', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        userId: 'system',
        name: 'System Template',
        isSystemTemplate: true
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockTemplateId,
        data: () => mockTemplate
      });

      const updates = { name: 'Updated Template' };

      await expect(templateService.updateTemplate(mockUserId, mockTemplateId, updates))
        .rejects.toThrow('Cannot modify system templates');
    });

    it('should prevent unauthorized updates', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        userId: 'other-user',
        name: 'Other User Template',
        isSystemTemplate: false
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockTemplateId,
        data: () => mockTemplate
      });

      const updates = { name: 'Updated Template' };

      await expect(templateService.updateTemplate(mockUserId, mockTemplateId, updates))
        .rejects.toThrow('UNAUTHORIZED_ACCESS');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a user template successfully', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        userId: mockUserId,
        name: 'User Template',
        isSystemTemplate: false
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockTemplateId,
        data: () => mockTemplate
      });

      await templateService.deleteTemplate(mockUserId, mockTemplateId);

      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should prevent deleting system templates', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        userId: 'system',
        name: 'System Template',
        isSystemTemplate: true
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockTemplateId,
        data: () => mockTemplate
      });

      await expect(templateService.deleteTemplate(mockUserId, mockTemplateId))
        .rejects.toThrow('Cannot delete system templates');
    });
  });

  describe('applyTemplateToEntry', () => {
    it('should apply template to create journal sections', async () => {
      const mockTemplate: JournalTemplate = {
        id: mockTemplateId,
        userId: mockUserId,
        name: 'Test Template',
        description: 'Test',
        category: 'custom',
        sections: [
          {
            id: 'section-1',
            type: 'text',
            title: 'Market Analysis',
            prompt: 'What is your market bias?',
            isRequired: true,
            order: 1,
            config: { minWords: 10 }
          },
          {
            id: 'section-2',
            type: 'checklist',
            title: 'Preparation',
            prompt: 'Complete your checklist',
            isRequired: false,
            order: 2,
            config: {
              items: [
                { id: 'item-1', text: 'Check news' },
                { id: 'item-2', text: 'Set risk limits' }
              ]
            }
          }
        ],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        usageCount: 0,
        sharedWith: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockTemplateId,
        data: () => mockTemplate
      });

      const result = await templateService.applyTemplateToEntry(mockTemplateId);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('text');
      expect(result[0].title).toBe('Market Analysis');
      expect(result[0].content).toBe('');
      expect(result[1].type).toBe('checklist');
      expect(result[1].content).toEqual([
        { id: 'item-1', text: 'Check news', checked: false },
        { id: 'item-2', text: 'Set risk limits', checked: false }
      ]);
    });

    it('should handle non-existent template', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(templateService.applyTemplateToEntry('non-existent'))
        .rejects.toThrow('TEMPLATE_NOT_FOUND');
    });
  });

  describe('exportTemplate', () => {
    it('should export template configuration', async () => {
      const mockTemplate: JournalTemplate = {
        id: mockTemplateId,
        userId: mockUserId,
        name: 'Export Template',
        description: 'Template for export',
        category: 'custom',
        sections: [],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        usageCount: 5,
        sharedWith: [],
        tags: ['export', 'test'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: mockTemplateId,
        data: () => mockTemplate
      });

      const result = await templateService.exportTemplate(mockTemplateId);
      const exportData = JSON.parse(result);

      expect(exportData.name).toBe('Export Template');
      expect(exportData.description).toBe('Template for export');
      expect(exportData.category).toBe('custom');
      expect(exportData.tags).toEqual(['export', 'test']);
      expect(exportData.sections).toEqual([]);
      
      // Should not include system-specific fields
      expect(exportData.id).toBeUndefined();
      expect(exportData.userId).toBeUndefined();
      expect(exportData.usageCount).toBeUndefined();
    });
  });

  describe('importTemplate', () => {
    it('should import template from valid JSON', async () => {
      const templateData = JSON.stringify({
        name: 'Imported Template',
        description: 'Template imported from JSON',
        category: 'custom',
        sections: [],
        tags: ['imported']
      });

      mockAddDoc.mockResolvedValue({ id: 'imported-template-id' });

      const result = await templateService.importTemplate(mockUserId, templateData);

      expect(result).toBe('imported-template-id');
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined, // collection reference is mocked as undefined
        expect.objectContaining({
          name: 'Imported Template',
          description: 'Template imported from JSON',
          category: 'custom',
          userId: mockUserId,
          isSystemTemplate: false
        })
      );
    });

    it('should handle invalid JSON', async () => {
      const invalidData = 'invalid json';

      await expect(templateService.importTemplate(mockUserId, invalidData))
        .rejects.toThrow('Failed to import template: Invalid format');
    });

    it('should handle missing required fields', async () => {
      const incompleteData = JSON.stringify({
        description: 'Missing name field'
      });

      await expect(templateService.importTemplate(mockUserId, incompleteData))
        .rejects.toThrow('Failed to import template: Invalid format');
    });
  });

  describe('searchTemplates', () => {
    it('should search templates by name and description', async () => {
      const mockUserTemplates = [
        {
          id: 'user-1',
          name: 'My Custom Template',
          description: 'A custom template for trading',
          tags: ['custom'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const mockSystemTemplates = [
        {
          id: 'system-1',
          name: 'Pre-Market Analysis',
          description: 'System template for pre-market preparation',
          tags: ['system', 'pre-market'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Mock getUserTemplates
      vi.spyOn(templateService, 'getUserTemplates').mockResolvedValue(mockUserTemplates as any);
      
      // Mock getDefaultTemplates
      vi.spyOn(templateService, 'getDefaultTemplates').mockResolvedValue(mockSystemTemplates as any);

      const result = await templateService.searchTemplates(mockUserId, 'custom');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Custom Template');
    });

    it('should search by tags', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Template 1',
          description: 'Description 1',
          tags: ['trading', 'analysis'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      vi.spyOn(templateService, 'getUserTemplates').mockResolvedValue(mockTemplates as any);
      vi.spyOn(templateService, 'getDefaultTemplates').mockResolvedValue([]);

      const result = await templateService.searchTemplates(mockUserId, 'analysis');

      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('analysis');
    });
  });

  describe('initializeDefaultTemplates', () => {
    it('should initialize default templates successfully', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      mockWriteBatch.mockReturnValue(mockBatch);

      await templateService.initializeDefaultTemplates();

      expect(mockBatch.set).toHaveBeenCalledTimes(DEFAULT_JOURNAL_TEMPLATES.length);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Batch error'))
      };

      mockWriteBatch.mockReturnValue(mockBatch);

      await expect(templateService.initializeDefaultTemplates())
        .rejects.toThrow('Failed to initialize default templates');
    });
  });
});
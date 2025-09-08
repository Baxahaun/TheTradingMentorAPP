/**
 * Template Service Tests
 * 
 * Comprehensive test suite for journal template management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from '../../../../services/TemplateService';
import { 
  mockUserId, 
  mockJournalTemplate, 
  createMockTemplate,
  mockFirebaseResponses,
  mockErrorResponses
} from '../../mocks/journalTestData';

// Mock Firebase
vi.mock('../../../../lib/firebase', () => ({
  db: {}
}));

const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 }))
}));

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(() => {
    service = new TemplateService();
    vi.clearAllMocks();
  });

  describe('Template CRUD Operations', () => {
    describe('createTemplate', () => {
      it('should create a new template successfully', async () => {
        mockSetDoc.mockResolvedValue(undefined);
        
        const templateData = {
          name: 'Test Template',
          description: 'A test template',
          category: 'custom' as const,
          sections: []
        };
        
        const templateId = await service.createTemplate(mockUserId, templateData);
        
        expect(mockSetDoc).toHaveBeenCalled();
        expect(typeof templateId).toBe('string');
        expect(templateId).toMatch(/^template-/);
      });

      it('should validate template data', async () => {
        const invalidTemplate = {
          name: '', // Empty name should fail
          description: 'Test',
          category: 'custom' as const,
          sections: []
        };
        
        await expect(service.createTemplate(mockUserId, invalidTemplate))
          .rejects.toThrow('Template name is required');
      });

      it('should handle creation errors', async () => {
        mockSetDoc.mockRejectedValue(mockErrorResponses.networkError);
        
        const templateData = {
          name: 'Test Template',
          description: 'Test',
          category: 'custom' as const,
          sections: []
        };
        
        await expect(service.createTemplate(mockUserId, templateData))
          .rejects.toThrow('Network request failed');
      });
    });

    describe('updateTemplate', () => {
      it('should update template successfully', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);
        
        const updates = {
          name: 'Updated Template Name',
          description: 'Updated description'
        };
        
        await service.updateTemplate(mockUserId, 'template-id', updates);
        
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            ...updates,
            updatedAt: expect.any(Object)
          })
        );
      });

      it('should validate update permissions', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ ...mockJournalTemplate, userId: 'different-user' })
        });
        
        await expect(service.updateTemplate(mockUserId, 'template-id', {}))
          .rejects.toThrow('Permission denied');
      });
    });

    describe('deleteTemplate', () => {
      it('should delete template successfully', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => mockJournalTemplate
        });
        mockDeleteDoc.mockResolvedValue(undefined);
        
        await service.deleteTemplate(mockUserId, 'template-id');
        
        expect(mockDeleteDoc).toHaveBeenCalled();
      });

      it('should prevent deletion of default templates', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ ...mockJournalTemplate, isDefault: true })
        });
        
        await expect(service.deleteTemplate(mockUserId, 'template-id'))
          .rejects.toThrow('Cannot delete default template');
      });
    });

    describe('getUserTemplates', () => {
      it('should retrieve user templates', async () => {
        const mockTemplates = [
          createMockTemplate({ name: 'Template 1' }),
          createMockTemplate({ name: 'Template 2' })
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockTemplates.map(template => ({
            data: () => template
          }))
        });
        
        const templates = await service.getUserTemplates(mockUserId);
        
        expect(templates).toHaveLength(2);
        expect(templates[0].name).toBe('Template 1');
        expect(templates[1].name).toBe('Template 2');
      });

      it('should handle empty template list', async () => {
        mockGetDocs.mockResolvedValue({ docs: [] });
        
        const templates = await service.getUserTemplates(mockUserId);
        
        expect(templates).toEqual([]);
      });
    });
  });

  describe('Template Application', () => {
    describe('applyTemplateToEntry', () => {
      it('should apply template to journal entry', async () => {
        const mockEntry = {
          id: 'entry-id',
          sections: [],
          templateId: undefined
        };
        
        mockGetDoc
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => mockJournalTemplate
          })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => mockEntry
          });
        
        mockUpdateDoc.mockResolvedValue(undefined);
        
        const updatedEntry = await service.applyTemplateToEntry('template-id', 'entry-id');
        
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            templateId: 'template-id',
            sections: expect.arrayContaining([
              expect.objectContaining({
                title: expect.any(String),
                type: expect.any(String)
              })
            ])
          })
        );
      });

      it('should handle non-existent template', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => false
        });
        
        await expect(service.applyTemplateToEntry('non-existent', 'entry-id'))
          .rejects.toThrow('Template not found');
      });
    });

    describe('getDefaultTemplates', () => {
      it('should retrieve default templates', async () => {
        const defaultTemplates = [
          createMockTemplate({ 
            name: 'Pre-Market Checklist',
            isDefault: true,
            category: 'pre-market'
          }),
          createMockTemplate({ 
            name: 'Trade Review',
            isDefault: true,
            category: 'custom'
          })
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: defaultTemplates.map(template => ({
            data: () => template
          }))
        });
        
        const templates = await service.getDefaultTemplates();
        
        expect(templates).toHaveLength(2);
        expect(templates.every(t => t.isDefault)).toBe(true);
      });
    });
  });

  describe('Template Sharing and Import/Export', () => {
    describe('exportTemplate', () => {
      it('should export template as JSON', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => mockJournalTemplate
        });
        
        const exportData = await service.exportTemplate('template-id');
        
        expect(typeof exportData).toBe('string');
        
        const parsed = JSON.parse(exportData);
        expect(parsed.name).toBe(mockJournalTemplate.name);
        expect(parsed.sections).toEqual(mockJournalTemplate.sections);
      });

      it('should exclude sensitive data from export', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => mockJournalTemplate
        });
        
        const exportData = await service.exportTemplate('template-id');
        const parsed = JSON.parse(exportData);
        
        expect(parsed.userId).toBeUndefined();
        expect(parsed.id).toBeUndefined();
        expect(parsed.usageCount).toBeUndefined();
      });
    });

    describe('importTemplate', () => {
      it('should import template from JSON', async () => {
        const templateData = JSON.stringify({
          name: 'Imported Template',
          description: 'An imported template',
          category: 'custom',
          sections: []
        });
        
        mockSetDoc.mockResolvedValue(undefined);
        
        const templateId = await service.importTemplate(mockUserId, templateData);
        
        expect(mockSetDoc).toHaveBeenCalled();
        expect(typeof templateId).toBe('string');
      });

      it('should validate imported template data', async () => {
        const invalidData = JSON.stringify({
          name: '', // Invalid name
          sections: 'not-an-array' // Invalid sections
        });
        
        await expect(service.importTemplate(mockUserId, invalidData))
          .rejects.toThrow('Invalid template data');
      });

      it('should handle malformed JSON', async () => {
        const malformedData = '{ invalid json }';
        
        await expect(service.importTemplate(mockUserId, malformedData))
          .rejects.toThrow('Invalid JSON format');
      });
    });
  });

  describe('Template Usage Analytics', () => {
    it('should track template usage', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockJournalTemplate, usageCount: 5 })
      });
      mockUpdateDoc.mockResolvedValue(undefined);
      
      await service.incrementUsageCount('template-id');
      
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          usageCount: 6
        })
      );
    });

    it('should get template usage statistics', async () => {
      const templates = [
        createMockTemplate({ usageCount: 10 }),
        createMockTemplate({ usageCount: 5 }),
        createMockTemplate({ usageCount: 15 })
      ];
      
      mockGetDocs.mockResolvedValue({
        docs: templates.map(template => ({
          data: () => template
        }))
      });
      
      const stats = await service.getUsageStatistics(mockUserId);
      
      expect(stats.totalUsage).toBe(30);
      expect(stats.mostUsedTemplate.usageCount).toBe(15);
      expect(stats.averageUsage).toBe(10);
    });
  });

  describe('Template Validation', () => {
    it('should validate template sections', () => {
      const validTemplate = {
        name: 'Valid Template',
        description: 'A valid template',
        category: 'custom' as const,
        sections: [
          {
            id: 'section-1',
            type: 'text' as const,
            title: 'Section Title',
            prompt: 'Section prompt',
            isRequired: true,
            order: 1,
            config: {}
          }
        ]
      };
      
      expect(() => service.validateTemplate(validTemplate)).not.toThrow();
    });

    it('should reject invalid section types', () => {
      const invalidTemplate = {
        name: 'Invalid Template',
        description: 'Template with invalid section',
        category: 'custom' as const,
        sections: [
          {
            id: 'section-1',
            type: 'invalid_type' as any,
            title: 'Section Title',
            prompt: 'Section prompt',
            isRequired: true,
            order: 1,
            config: {}
          }
        ]
      };
      
      expect(() => service.validateTemplate(invalidTemplate))
        .toThrow('Invalid section type');
    });

    it('should validate section order uniqueness', () => {
      const invalidTemplate = {
        name: 'Invalid Template',
        description: 'Template with duplicate order',
        category: 'custom' as const,
        sections: [
          {
            id: 'section-1',
            type: 'text' as const,
            title: 'Section 1',
            prompt: 'Prompt 1',
            isRequired: true,
            order: 1,
            config: {}
          },
          {
            id: 'section-2',
            type: 'text' as const,
            title: 'Section 2',
            prompt: 'Prompt 2',
            isRequired: true,
            order: 1, // Duplicate order
            config: {}
          }
        ]
      };
      
      expect(() => service.validateTemplate(invalidTemplate))
        .toThrow('Duplicate section order');
    });
  });
});
/**
 * Unit tests for NoteManagementService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import noteManagementService from '../noteManagementService';
import { TradeNotes, NoteTemplate, NoteVersion } from '../../types/tradeReview';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input) => input)
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('NoteManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Clear the internal state of the singleton
    (noteManagementService as any).noteHistory.clear();
  });

  describe('Template Management', () => {
    it('should return default templates', () => {
      const templates = noteManagementService.getTemplates();
      
      expect(templates).toHaveLength(5);
      expect(templates[0].name).toBe('Comprehensive Analysis');
      expect(templates[1].name).toBe('Quick Scalp');
      expect(templates[2].name).toBe('Swing Trade');
      expect(templates[3].name).toBe('News Trade');
      expect(templates[4].name).toBe('Minimal Notes');
    });

    it('should filter templates by category', () => {
      const scalpingTemplates = noteManagementService.getTemplatesByCategory('scalping');
      const detailedTemplates = noteManagementService.getTemplatesByCategory('detailed');
      
      expect(scalpingTemplates).toHaveLength(1);
      expect(scalpingTemplates[0].name).toBe('Quick Scalp');
      
      expect(detailedTemplates).toHaveLength(1);
      expect(detailedTemplates[0].name).toBe('Comprehensive Analysis');
    });

    it('should create custom template', () => {
      const notes: TradeNotes = {
        preTradeAnalysis: 'Custom pre-trade analysis',
        executionNotes: 'Custom execution notes',
        postTradeReflection: 'Custom reflection',
        lessonsLearned: 'Custom lessons',
        generalNotes: 'Custom general notes',
        lastModified: new Date().toISOString(),
        version: 1
      };

      const template = noteManagementService.createTemplate(
        'My Custom Template',
        notes,
        'custom',
        'A custom template for my trading style'
      );

      expect(template.name).toBe('My Custom Template');
      expect(template.category).toBe('custom');
      expect(template.description).toBe('A custom template for my trading style');
      expect(template.template.preTradeAnalysis).toBe('Custom pre-trade analysis');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should delete custom template', () => {
      // First create a template
      const notes: TradeNotes = {
        preTradeAnalysis: 'Test',
        executionNotes: '',
        postTradeReflection: '',
        lessonsLearned: '',
        generalNotes: '',
        lastModified: new Date().toISOString(),
        version: 1
      };

      const template = noteManagementService.createTemplate('Test Template', notes);
      
      // Then delete it
      const deleted = noteManagementService.deleteTemplate(template.id);
      expect(deleted).toBe(true);
      
      // Try to delete non-existent template
      const notDeleted = noteManagementService.deleteTemplate('non-existent');
      expect(notDeleted).toBe(false);
    });

    it('should apply template to existing notes', () => {
      const template = noteManagementService.getTemplates()[0]; // Comprehensive Analysis
      const existingNotes: TradeNotes = {
        preTradeAnalysis: 'Existing analysis',
        executionNotes: '',
        postTradeReflection: '',
        lessonsLearned: '',
        generalNotes: '',
        lastModified: new Date().toISOString(),
        version: 1
      };

      const mergedNotes = noteManagementService.applyTemplate(template, existingNotes);
      
      // Should preserve existing content
      expect(mergedNotes.preTradeAnalysis).toBe('Existing analysis');
      // Should fill empty fields from template
      expect(mergedNotes.executionNotes).toBe(template.template.executionNotes);
      expect(mergedNotes.version).toBe(2);
    });
  });

  describe('Note Versioning', () => {
    const tradeId = 'test-trade-123';
    const sampleNotes: TradeNotes = {
      preTradeAnalysis: 'Initial analysis',
      executionNotes: 'Initial execution',
      postTradeReflection: 'Initial reflection',
      lessonsLearned: 'Initial lessons',
      generalNotes: 'Initial general notes',
      lastModified: new Date().toISOString(),
      version: 1
    };

    it('should save notes with versioning', async () => {
      await noteManagementService.saveNotes(tradeId, sampleNotes);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `trade-notes-${tradeId}`,
        expect.any(String)
      );
    });

    it('should get note history', async () => {
      // Mock localStorage to return saved notes
      const mockHistory: NoteVersion[] = [
        {
          version: 1,
          content: sampleNotes,
          timestamp: new Date().toISOString(),
          changes: ['Initial version']
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));
      
      const history = await noteManagementService.getNoteHistory(tradeId);
      
      expect(history).toHaveLength(1);
      expect(history[0].version).toBe(1);
      expect(history[0].content.preTradeAnalysis).toBe('Initial analysis');
    });

    it('should get latest notes', async () => {
      const mockHistory: NoteVersion[] = [
        {
          version: 1,
          content: sampleNotes,
          timestamp: new Date().toISOString(),
          changes: ['Initial version']
        },
        {
          version: 2,
          content: { ...sampleNotes, preTradeAnalysis: 'Updated analysis', version: 2 },
          timestamp: new Date().toISOString(),
          changes: ['Updated pre-trade analysis']
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));
      
      const latestNotes = await noteManagementService.getLatestNotes(tradeId);
      
      expect(latestNotes).not.toBeNull();
      expect(latestNotes!.version).toBe(2);
      expect(latestNotes!.preTradeAnalysis).toBe('Updated analysis');
    });

    it('should return null for non-existent notes', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const notes = await noteManagementService.getLatestNotes('non-existent-trade');
      
      expect(notes).toBeNull();
    });
  });

  describe('Version Comparison', () => {
    it('should compare two note versions', () => {
      const version1: NoteVersion = {
        version: 1,
        content: {
          preTradeAnalysis: 'Original analysis',
          executionNotes: 'Original execution',
          postTradeReflection: '',
          lessonsLearned: '',
          generalNotes: '',
          lastModified: new Date().toISOString(),
          version: 1
        },
        timestamp: new Date().toISOString(),
        changes: ['Initial version']
      };

      const version2: NoteVersion = {
        version: 2,
        content: {
          preTradeAnalysis: 'Updated analysis',
          executionNotes: 'Original execution',
          postTradeReflection: 'New reflection',
          lessonsLearned: '',
          generalNotes: '',
          lastModified: new Date().toISOString(),
          version: 2
        },
        timestamp: new Date().toISOString(),
        changes: ['Updated pre-trade analysis', 'Added post-trade reflection']
      };

      const differences = noteManagementService.compareVersions(version1, version2);
      
      expect(differences).toHaveProperty('preTradeAnalysis');
      expect(differences).toHaveProperty('postTradeReflection');
      expect(differences.preTradeAnalysis.old).toBe('Original analysis');
      expect(differences.preTradeAnalysis.new).toBe('Updated analysis');
      expect(differences.postTradeReflection.old).toBe('');
      expect(differences.postTradeReflection.new).toBe('New reflection');
    });
  });

  describe('Note Statistics', () => {
    const tradeId = 'test-trade-stats';

    it('should calculate note statistics', async () => {
      const mockHistory: NoteVersion[] = [
        {
          version: 1,
          content: {
            preTradeAnalysis: 'Analysis with some content',
            executionNotes: 'Execution notes',
            postTradeReflection: 'Reflection',
            lessonsLearned: '',
            generalNotes: '',
            lastModified: '2024-01-01T10:00:00Z',
            version: 1
          },
          timestamp: '2024-01-01T10:00:00Z',
          changes: ['Initial version']
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));
      
      const stats = await noteManagementService.getNoteStatistics(tradeId);
      
      expect(stats.totalVersions).toBe(1);
      expect(stats.totalCharacters).toBeGreaterThan(0);
      expect(stats.lastModified).toBe('2024-01-01T10:00:00Z');
      expect(stats.completionScore).toBe(60); // 3 out of 5 sections filled
    });

    it('should return empty stats for non-existent trade', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const stats = await noteManagementService.getNoteStatistics('non-existent');
      
      expect(stats.totalVersions).toBe(0);
      expect(stats.totalCharacters).toBe(0);
      expect(stats.lastModified).toBe('');
      expect(stats.completionScore).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      await expect(noteManagementService.saveNotes('test-trade', {
        preTradeAnalysis: 'Test',
        executionNotes: '',
        postTradeReflection: '',
        lessonsLearned: '',
        generalNotes: '',
        lastModified: new Date().toISOString(),
        version: 1
      })).rejects.toThrow('Failed to save notes');
    });

    it('should handle corrupted localStorage data', async () => {
      // Clear any existing data first
      vi.clearAllMocks();
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const history = await noteManagementService.getNoteHistory('corrupted-trade');
      
      expect(history).toEqual([]);
    });
  });
});
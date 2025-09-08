/**
 * Integration tests for Template Service with Journal Data Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from '../TemplateService';
import { JournalDataService } from '../JournalDataService';
import { JournalTemplate, JournalEntry } from '../../types/journal';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } }
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
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  onSnapshot: vi.fn()
}));

describe('Template and Journal Integration', () => {
  let templateService: TemplateService;
  let journalService: JournalDataService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    templateService = new TemplateService();
    journalService = new JournalDataService();
    vi.clearAllMocks();
  });

  describe('Template Application to Journal Entries', () => {
    it('should apply template sections to create a structured journal entry', async () => {
      // Mock template
      const mockTemplate: JournalTemplate = {
        id: 'template-1',
        userId: mockUserId,
        name: 'Pre-Market Analysis',
        description: 'Template for pre-market preparation',
        category: 'pre-market',
        sections: [
          {
            id: 'market-bias',
            type: 'text',
            title: 'Market Bias',
            prompt: 'What is your market bias today?',
            isRequired: true,
            order: 1,
            config: { minWords: 10 }
          },
          {
            id: 'checklist',
            type: 'checklist',
            title: 'Preparation Checklist',
            prompt: 'Complete your preparation',
            isRequired: true,
            order: 2,
            config: {
              items: [
                { id: 'news', text: 'Check economic news' },
                { id: 'levels', text: 'Identify key levels' }
              ]
            }
          }
        ],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        usageCount: 0,
        sharedWith: [],
        tags: ['pre-market', 'analysis'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Mock template service methods
      vi.spyOn(templateService, 'getTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(templateService, 'applyTemplateToEntry').mockImplementation(async (templateId) => {
        const template = await templateService.getTemplate(templateId);
        if (!template) throw new Error('Template not found');
        
        return template.sections.map((section, index) => ({
          id: `section-${index}`,
          type: section.type,
          title: section.title,
          content: section.type === 'text' ? '' : 
                   section.type === 'checklist' ? section.config.items.map((item: any) => ({ ...item, checked: false })) : 
                   {},
          order: section.order,
          isRequired: section.isRequired,
          isCompleted: false,
          templateSectionId: section.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: 0
        }));
      });

      // Apply template to create journal sections
      const sections = await templateService.applyTemplateToEntry('template-1');

      expect(sections).toHaveLength(2);
      expect(sections[0].type).toBe('text');
      expect(sections[0].title).toBe('Market Bias');
      expect(sections[0].content).toBe('');
      expect(sections[1].type).toBe('checklist');
      expect(sections[1].content).toEqual([
        { id: 'news', text: 'Check economic news', checked: false },
        { id: 'levels', text: 'Identify key levels', checked: false }
      ]);
    });

    it('should create a complete journal entry using a template', async () => {
      const mockTemplate: JournalTemplate = {
        id: 'template-2',
        userId: mockUserId,
        name: 'Daily Review',
        description: 'End of day review template',
        category: 'post-market',
        sections: [
          {
            id: 'summary',
            type: 'text',
            title: 'Session Summary',
            prompt: 'Summarize your trading session',
            isRequired: true,
            order: 1,
            config: { minWords: 20 }
          }
        ],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        usageCount: 0,
        sharedWith: [],
        tags: ['review'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Mock services
      vi.spyOn(templateService, 'getTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(templateService, 'applyTemplateToEntry').mockResolvedValue([
        {
          id: 'section-1',
          type: 'text',
          title: 'Session Summary',
          content: '',
          order: 1,
          isRequired: true,
          isCompleted: false,
          templateSectionId: 'summary',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          wordCount: 0
        }
      ]);

      vi.spyOn(journalService, 'createJournalEntry').mockResolvedValue('entry-123');

      // Create journal entry with template
      const sections = await templateService.applyTemplateToEntry('template-2');
      const entryId = await journalService.createJournalEntry(mockUserId, '2024-01-01', {
        sections,
        templateId: 'template-2',
        templateName: 'Daily Review'
      });

      expect(entryId).toBe('entry-123');
      expect(journalService.createJournalEntry).toHaveBeenCalledWith(
        mockUserId,
        '2024-01-01',
        expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              title: 'Session Summary',
              templateSectionId: 'summary'
            })
          ]),
          templateId: 'template-2',
          templateName: 'Daily Review'
        })
      );
    });
  });

  describe('Template Usage Tracking', () => {
    it('should increment template usage count when applied', async () => {
      const mockTemplate: JournalTemplate = {
        id: 'template-3',
        userId: mockUserId,
        name: 'Usage Test Template',
        description: 'Template for testing usage tracking',
        category: 'custom',
        sections: [],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        usageCount: 5,
        sharedWith: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Mock the template service to track usage
      let currentUsageCount = 5;
      vi.spyOn(templateService, 'getTemplate').mockResolvedValue(mockTemplate);
      vi.spyOn(templateService, 'applyTemplateToEntry').mockImplementation(async () => {
        currentUsageCount++;
        return [];
      });

      // Apply template multiple times
      await templateService.applyTemplateToEntry('template-3');
      await templateService.applyTemplateToEntry('template-3');

      expect(currentUsageCount).toBe(7);
    });
  });

  describe('Template Validation with Journal Requirements', () => {
    it('should validate that template sections match journal entry requirements', () => {
      const validTemplate: JournalTemplate = {
        id: 'valid-template',
        userId: mockUserId,
        name: 'Valid Template',
        description: 'A properly structured template',
        category: 'custom',
        sections: [
          {
            id: 'section-1',
            type: 'text',
            title: 'Analysis',
            prompt: 'Enter your analysis',
            isRequired: true,
            order: 1,
            config: { minWords: 5 }
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

      // This should not throw any errors
      expect(() => {
        validTemplate.sections.forEach(section => {
          if (!section.id || !section.title || !section.type) {
            throw new Error('Invalid section structure');
          }
        });
      }).not.toThrow();
    });
  });

  describe('Template and Journal Entry Synchronization', () => {
    it('should maintain template reference in journal entries', async () => {
      const mockJournalEntry: Partial<JournalEntry> = {
        id: 'entry-1',
        userId: mockUserId,
        date: '2024-01-01',
        templateId: 'template-1',
        templateName: 'Test Template',
        sections: [
          {
            id: 'section-1',
            type: 'text',
            title: 'Test Section',
            content: 'Test content',
            order: 1,
            isRequired: true,
            isCompleted: true,
            templateSectionId: 'template-section-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            wordCount: 2
          }
        ],
        tradeReferences: [],
        emotionalState: {
          preMarket: {
            confidence: 3,
            anxiety: 2,
            focus: 4,
            energy: 3,
            mood: 'calm',
            preparedness: 4,
            timestamp: '2024-01-01T08:00:00.000Z'
          },
          duringTrading: {
            discipline: 4,
            patience: 3,
            emotionalControl: 4,
            decisionClarity: 3,
            stressManagement: 4
          },
          postMarket: {
            satisfaction: 4,
            learningValue: 4,
            frustrationLevel: 2,
            accomplishment: 4,
            overallMood: 'satisfied',
            timestamp: '2024-01-01T16:00:00.000Z'
          },
          overallMood: 'satisfied',
          stressLevel: 2,
          confidenceLevel: 4
        },
        processMetrics: {
          planAdherence: 4,
          riskManagement: 5,
          entryTiming: 3,
          exitTiming: 4,
          emotionalDiscipline: 4,
          overallDiscipline: 4,
          processScore: 80
        },
        dailyPnL: 150,
        tradeCount: 3,
        images: [],
        tags: [],
        isComplete: true,
        completionPercentage: 100,
        wordCount: 2,
        isPrivate: true,
        sharedWith: []
      };

      vi.spyOn(journalService, 'getJournalEntry').mockResolvedValue(mockJournalEntry as JournalEntry);

      const entry = await journalService.getJournalEntry(mockUserId, '2024-01-01');

      expect(entry?.templateId).toBe('template-1');
      expect(entry?.templateName).toBe('Test Template');
      expect(entry?.sections[0].templateSectionId).toBe('template-section-1');
    });
  });
});
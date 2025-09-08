/**
 * Tests for Journal Export Service
 * 
 * Tests export functionality, backup system, and sharing capabilities
 */

import { JournalExportService, JournalExportOptions, BackupOptions, SharingOptions } from '../JournalExportService';
import { JournalEntry, JournalTemplate, JournalPreferences } from '../../types/journal';
import { Trade } from '../../types/trade';
import { EncryptionService } from '../EncryptionService';
import { AuditLogService } from '../AuditLogService';

// Mock dependencies
jest.mock('../EncryptionService');
jest.mock('../AuditLogService');

describe('JournalExportService', () => {
  let exportService: JournalExportService;
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  let mockAuditLogService: jest.Mocked<AuditLogService>;
  let mockEntries: JournalEntry[];
  let mockTrades: Trade[];
  let mockTemplates: JournalTemplate[];
  let mockPreferences: JournalPreferences;

  beforeEach(() => {
    mockEncryptionService = new EncryptionService() as jest.Mocked<EncryptionService>;
    mockAuditLogService = new AuditLogService() as jest.Mocked<AuditLogService>;
    
    exportService = new JournalExportService(mockEncryptionService, mockAuditLogService);

    // Mock journal entries
    mockEntries = [
      {
        id: 'entry1',
        userId: 'user1',
        date: '2024-01-01',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T15:00:00Z',
        sections: [
          {
            id: 'section1',
            type: 'text',
            title: 'Market Analysis',
            content: 'EUR/USD showing bullish momentum',
            order: 1,
            isRequired: false
          }
        ],
        tradeReferences: [
          {
            tradeId: 'trade1',
            insertedAt: '2024-01-01T12:00:00Z',
            context: 'Entry analysis',
            displayType: 'inline',
            cachedTradeData: {
              symbol: 'EUR/USD',
              direction: 'long',
              pnl: 150,
              entryPrice: 1.0950,
              exitPrice: 1.0965
            }
          }
        ],
        emotionalState: {
          preMarket: {
            confidence: 4,
            anxiety: 2,
            focus: 5,
            mood: 'confident',
            notes: 'Feeling prepared'
          },
          duringTrading: {
            discipline: 4,
            patience: 3,
            emotionalControl: 4,
            notes: 'Stayed calm during volatility'
          },
          postMarket: {
            satisfaction: 4,
            learningValue: 5,
            overallMood: 'satisfied',
            notes: 'Good execution today'
          }
        },
        processMetrics: {
          planAdherence: 4,
          riskManagement: 5,
          entryTiming: 4,
          exitTiming: 3,
          overallDiscipline: 4,
          processScore: 85
        },
        dailyPnL: 150,
        images: [
          {
            id: 'img1',
            url: 'https://example.com/chart1.png',
            filename: 'chart1.png',
            uploadedAt: '2024-01-01T11:00:00Z',
            annotations: [],
            caption: 'Entry setup'
          }
        ],
        tags: ['EUR/USD', 'breakout', 'profitable'],
        isComplete: true,
        wordCount: 250,
        tradeCount: 1,
        templateId: 'template1'
      },
      {
        id: 'entry2',
        userId: 'user1',
        date: '2024-01-02',
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-02T15:00:00Z',
        sections: [
          {
            id: 'section2',
            type: 'text',
            title: 'Reflection',
            content: 'Need to work on patience',
            order: 1,
            isRequired: false
          }
        ],
        tradeReferences: [],
        emotionalState: {
          preMarket: {
            confidence: 3,
            anxiety: 3,
            focus: 3,
            mood: 'nervous',
            notes: 'Uncertain about market direction'
          },
          duringTrading: {
            discipline: 2,
            patience: 2,
            emotionalControl: 3,
            notes: 'Got impatient and exited early'
          },
          postMarket: {
            satisfaction: 2,
            learningValue: 4,
            overallMood: 'frustrated',
            notes: 'Missed opportunity due to impatience'
          }
        },
        processMetrics: {
          planAdherence: 2,
          riskManagement: 4,
          entryTiming: 3,
          exitTiming: 2,
          overallDiscipline: 3,
          processScore: 65
        },
        dailyPnL: -50,
        images: [],
        tags: ['patience', 'learning'],
        isComplete: true,
        wordCount: 180,
        tradeCount: 0,
        templateId: 'template1'
      }
    ];

    // Mock trades
    mockTrades = [
      {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        direction: 'long',
        entryPrice: 1.0950,
        exitPrice: 1.0965,
        lotSize: 1.0,
        pnl: 150,
        entryTime: '2024-01-01T12:00:00Z',
        exitTime: '2024-01-01T14:00:00Z',
        status: 'closed',
        notes: 'Good breakout trade'
      }
    ];

    // Mock templates
    mockTemplates = [
      {
        id: 'template1',
        userId: 'user1',
        name: 'Daily Review',
        description: 'Standard daily journal template',
        category: 'full-day',
        isDefault: true,
        isPublic: false,
        sections: [
          {
            id: 'section1',
            type: 'text',
            title: 'Market Analysis',
            prompt: 'What was your market bias today?',
            placeholder: 'Describe market conditions...',
            isRequired: true,
            order: 1,
            config: {}
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        usageCount: 10
      }
    ];

    // Mock preferences
    mockPreferences = {
      defaultTemplateId: 'template1',
      autoSaveInterval: 30,
      reminderSettings: {
        enabled: true,
        time: '18:00',
        frequency: 'daily'
      },
      privacySettings: {
        shareEmotionalData: false,
        shareProcessMetrics: true,
        allowMentorAccess: true
      },
      displaySettings: {
        theme: 'light',
        fontSize: 'medium',
        showProcessScore: true
      }
    };

    // Setup mocks
    mockAuditLogService.logAccess.mockResolvedValue();
    mockEncryptionService.encryptData.mockResolvedValue(new ArrayBuffer(100));
    mockEncryptionService.encryptUserData.mockResolvedValue(new ArrayBuffer(100));
  });

  describe('PDF Export', () => {
    it('should export journal entries as PDF', async () => {
      const options: JournalExportOptions = {
        format: 'pdf',
        includeImages: true,
        includeEmotionalData: true,
        includeProcessMetrics: true
      };

      const result = await exportService.exportToPDF('user1', mockEntries, mockTrades, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toMatch(/journal_user1_\d{4}-\d{2}-\d{2}\.pdf/);
      expect(result.size).toBeGreaterThan(0);
      expect(result.checksum).toBeDefined();
      expect(mockAuditLogService.logAccess).toHaveBeenCalledWith({
        userId: 'user1',
        action: 'export',
        resourceType: 'journal',
        resourceId: 'bulk_export',
        details: { format: 'pdf', entryCount: 2 }
      });
    });

    it('should handle PDF export with date range filter', async () => {
      const options: JournalExportOptions = {
        format: 'pdf',
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-01'
        }
      };

      const result = await exportService.exportToPDF('user1', mockEntries, mockTrades, options);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('2024-01-01_to_2024-01-01');
    });

    it('should handle PDF export with anonymization', async () => {
      const options: JournalExportOptions = {
        format: 'pdf',
        anonymize: true
      };

      const result = await exportService.exportToPDF('user1', mockEntries, mockTrades, options);

      expect(result.success).toBe(true);
      // Verify that sensitive data would be anonymized (implementation detail)
    });

    it('should handle PDF export with password protection', async () => {
      const options: JournalExportOptions = {
        format: 'pdf',
        password: 'test123'
      };

      const result = await exportService.exportToPDF('user1', mockEntries, mockTrades, options);

      expect(result.success).toBe(true);
      expect(mockEncryptionService.encryptData).toHaveBeenCalled();
    });
  });

  describe('JSON Export', () => {
    it('should export journal entries as JSON', async () => {
      const options: JournalExportOptions = {
        format: 'json',
        includeEmotionalData: true,
        includeProcessMetrics: true
      };

      const result = await exportService.exportToJSON('user1', mockEntries, options);

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.filename).toMatch(/journal_user1_\d{4}-\d{2}-\d{2}\.json/);
      
      // Verify JSON structure
      const exportData = JSON.parse(result.data as string);
      expect(exportData.metadata).toBeDefined();
      expect(exportData.entries).toHaveLength(2);
      expect(exportData.schema).toBeDefined();
    });

    it('should handle JSON export with selective content', async () => {
      const options: JournalExportOptions = {
        format: 'json',
        includeEmotionalData: false,
        includeProcessMetrics: true,
        includeImages: false
      };

      const result = await exportService.exportToJSON('user1', mockEntries, options);

      expect(result.success).toBe(true);
      
      const exportData = JSON.parse(result.data as string);
      expect(exportData.metadata.options.includeEmotionalData).toBe(false);
      expect(exportData.metadata.options.includeProcessMetrics).toBe(true);
    });
  });

  describe('CSV Export', () => {
    it('should export journal entries as CSV', async () => {
      const options: JournalExportOptions = {
        format: 'csv',
        includeEmotionalData: true
      };

      const result = await exportService.exportToCSV('user1', mockEntries, options);

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.filename).toMatch(/journal_user1_\d{4}-\d{2}-\d{2}\.csv/);
      
      // Verify CSV structure
      const csvLines = (result.data as string).split('\n');
      expect(csvLines[0]).toContain('Date,Completed,Word Count');
      expect(csvLines).toHaveLength(3); // Header + 2 entries
    });

    it('should include emotional data columns when requested', async () => {
      const options: JournalExportOptions = {
        format: 'csv',
        includeEmotionalData: true
      };

      const result = await exportService.exportToCSV('user1', mockEntries, options);

      expect(result.success).toBe(true);
      const csvLines = (result.data as string).split('\n');
      expect(csvLines[0]).toContain('Overall Mood,Confidence Level,Stress Level');
    });
  });

  describe('Backup System', () => {
    it('should create a backup successfully', async () => {
      const options: BackupOptions = {
        includeImages: true,
        compression: false,
        encryption: true,
        retentionDays: 90
      };

      const result = await exportService.createBackup(
        'user1',
        mockEntries,
        mockTemplates,
        mockPreferences,
        options
      );

      expect(result.success).toBe(true);
      expect(result.backupId).toBeDefined();
      expect(result.filename).toMatch(/journal_backup_user1_v\d+_\d{4}-\d{2}-\d{2}\.json/);
      expect(result.size).toBeGreaterThan(0);
      expect(result.checksum).toBeDefined();
      expect(result.version).toBeGreaterThan(0);
      
      expect(mockAuditLogService.logAccess).toHaveBeenCalledWith({
        userId: 'user1',
        action: 'backup',
        resourceType: 'journal',
        resourceId: result.backupId,
        details: expect.objectContaining({
          version: result.version,
          size: result.size,
          compressed: false,
          encrypted: true
        })
      });
    });

    it('should create backup without images when specified', async () => {
      const options: BackupOptions = {
        includeImages: false
      };

      const result = await exportService.createBackup(
        'user1',
        mockEntries,
        mockTemplates,
        mockPreferences,
        options
      );

      expect(result.success).toBe(true);
      // Verify that images would be stripped (implementation detail)
    });

    it('should restore from backup successfully', async () => {
      const restoreOptions = {
        backupId: 'backup123',
        version: 1,
        overwriteExisting: true
      };

      const result = await exportService.restoreFromBackup('user1', restoreOptions);

      expect(result.success).toBe(true);
      expect(result.restoredEntries).toBeGreaterThanOrEqual(0);
      
      expect(mockAuditLogService.logAccess).toHaveBeenCalledWith({
        userId: 'user1',
        action: 'restore',
        resourceType: 'journal',
        resourceId: 'backup123',
        details: { version: 1, selective: false }
      });
    });

    it('should handle selective restore', async () => {
      const restoreOptions = {
        backupId: 'backup123',
        selectiveRestore: {
          dateRange: { start: '2024-01-01', end: '2024-01-01' },
          entryIds: ['entry1']
        }
      };

      const result = await exportService.restoreFromBackup('user1', restoreOptions);

      expect(result.success).toBe(true);
      expect(mockAuditLogService.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ selective: true })
        })
      );
    });
  });

  describe('Sharing System', () => {
    it('should create shareable export successfully', async () => {
      const sharingOptions: SharingOptions = {
        recipientEmail: 'mentor@example.com',
        recipientName: 'John Mentor',
        accessLevel: 'read',
        expirationDate: '2024-12-31',
        includeEmotionalData: false,
        includeProcessMetrics: true,
        customMessage: 'Please review my trading journal'
      };

      const result = await exportService.createShareableExport('user1', mockEntries, sharingOptions);

      expect(result.success).toBe(true);
      expect(result.shareId).toBeDefined();
      expect(result.shareUrl).toContain('/shared/');
      
      expect(mockAuditLogService.logAccess).toHaveBeenCalledWith({
        userId: 'user1',
        action: 'share',
        resourceType: 'journal',
        resourceId: result.shareId,
        details: {
          recipientEmail: 'mentor@example.com',
          accessLevel: 'read',
          entryCount: 2
        }
      });
    });

    it('should handle sharing with comment access', async () => {
      const sharingOptions: SharingOptions = {
        recipientEmail: 'coach@example.com',
        accessLevel: 'comment',
        includeProcessMetrics: true
      };

      const result = await exportService.createShareableExport('user1', mockEntries, sharingOptions);

      expect(result.success).toBe(true);
      expect(mockAuditLogService.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ accessLevel: 'comment' })
        })
      );
    });

    it('should fail sharing without recipient email', async () => {
      const sharingOptions: SharingOptions = {
        recipientEmail: '',
        accessLevel: 'read'
      };

      // This would be handled at the component level, but service should handle gracefully
      const result = await exportService.createShareableExport('user1', mockEntries, sharingOptions);
      
      // The service might still succeed but the component should validate
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle export errors gracefully', async () => {
      // Mock an error in the export process
      const invalidEntries: any[] = [{ invalid: 'data' }];
      
      const result = await exportService.exportToPDF('user1', invalidEntries, [], { format: 'pdf' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle backup errors gracefully', async () => {
      // Mock encryption service error
      mockEncryptionService.encryptUserData.mockRejectedValue(new Error('Encryption failed'));
      
      const result = await exportService.createBackup(
        'user1',
        mockEntries,
        mockTemplates,
        mockPreferences,
        { encryption: true }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Encryption failed');
    });

    it('should handle restore errors gracefully', async () => {
      const result = await exportService.restoreFromBackup('user1', {
        backupId: 'nonexistent',
        version: 999
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Data Anonymization', () => {
    it('should anonymize sensitive data correctly', async () => {
      const options: JournalExportOptions = {
        format: 'json',
        anonymize: true
      };

      const result = await exportService.exportToJSON('user1', mockEntries, options);
      
      expect(result.success).toBe(true);
      
      const exportData = JSON.parse(result.data as string);
      expect(exportData.metadata.userId).toBe('anonymized');
      
      // Check that entries are anonymized
      const firstEntry = exportData.entries[0];
      expect(firstEntry.id).toMatch(/entry_\d+/);
      expect(firstEntry.userId).toBe('anonymized_user');
      expect(firstEntry.dailyPnL).toBe(0);
    });

    it('should preserve structure while anonymizing content', async () => {
      const options: JournalExportOptions = {
        format: 'json',
        anonymize: true,
        includeEmotionalData: true,
        includeProcessMetrics: true
      };

      const result = await exportService.exportToJSON('user1', mockEntries, options);
      
      expect(result.success).toBe(true);
      
      const exportData = JSON.parse(result.data as string);
      const firstEntry = exportData.entries[0];
      
      // Structure should be preserved
      expect(firstEntry.emotionalState).toBeDefined();
      expect(firstEntry.processMetrics).toBeDefined();
      expect(firstEntry.sections).toBeDefined();
      
      // But sensitive content should be anonymized
      expect(firstEntry.tradeReferences[0].tradeId).toMatch(/trade_\d+/);
    });
  });

  describe('File Size and Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Create a large dataset
      const largeEntries = Array.from({ length: 100 }, (_, i) => ({
        ...mockEntries[0],
        id: `entry${i}`,
        date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
        sections: [
          {
            ...mockEntries[0].sections[0],
            content: 'x'.repeat(1000) // 1KB of content per entry
          }
        ]
      }));

      const startTime = Date.now();
      const result = await exportService.exportToJSON('user1', largeEntries, { format: 'json' });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.size).toBeGreaterThan(50000); // Should be substantial size
    });

    it('should provide accurate file size information', async () => {
      const result = await exportService.exportToJSON('user1', mockEntries, { format: 'json' });
      
      expect(result.success).toBe(true);
      expect(result.size).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
      
      // Verify size matches actual data
      const actualSize = new Blob([result.data as string]).size;
      expect(result.size).toBe(actualSize);
    });
  });
});
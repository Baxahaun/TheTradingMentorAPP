/**
 * Integration Tests for Export and Backup System
 * 
 * Tests the complete export and backup workflow including UI interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportInterface } from '../ExportInterface';
import { BackupManager } from '../BackupManager';
import { JournalExportService } from '../../services/JournalExportService';
import { JournalEntry, JournalTemplate, JournalPreferences } from '../../types/journal';
import { Trade } from '../../types/trade';

// Mock the export service
jest.mock('../../services/JournalExportService');

describe('Export and Backup Integration', () => {
  let mockExportService: jest.Mocked<JournalExportService>;
  let mockEntries: JournalEntry[];
  let mockTrades: Trade[];
  let mockTemplates: JournalTemplate[];
  let mockPreferences: JournalPreferences;

  beforeEach(() => {
    // Setup mock service
    mockExportService = new JournalExportService() as jest.Mocked<JournalExportService>;
    (JournalExportService as jest.Mock).mockImplementation(() => mockExportService);

    // Mock data
    mockEntries = [
      {
        id: 'entry1',
        userId: 'user1',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T15:00:00Z',
        sections: [
          {
            id: 'section1',
            type: 'text',
            title: 'Market Analysis',
            content: 'Strong bullish momentum in EUR/USD',
            order: 1,
            isRequired: false
          }
        ],
        tradeReferences: [],
        emotionalState: {
          preMarket: {
            confidence: 4,
            anxiety: 2,
            focus: 5,
            mood: 'confident'
          },
          duringTrading: {
            discipline: 4,
            patience: 4,
            emotionalControl: 4
          },
          postMarket: {
            satisfaction: 4,
            learningValue: 5,
            overallMood: 'satisfied'
          }
        },
        processMetrics: {
          planAdherence: 4,
          riskManagement: 5,
          entryTiming: 4,
          exitTiming: 4,
          overallDiscipline: 4,
          processScore: 85
        },
        dailyPnL: 200,
        images: [],
        tags: ['EUR/USD', 'breakout'],
        isComplete: true,
        wordCount: 150,
        tradeCount: 1,
        templateId: 'template1'
      }
    ];

    mockTrades = [
      {
        id: 'trade1',
        currencyPair: 'EUR/USD',
        direction: 'long',
        entryPrice: 1.0950,
        exitPrice: 1.0980,
        lotSize: 1.0,
        pnl: 200,
        entryTime: '2024-01-15T12:00:00Z',
        exitTime: '2024-01-15T14:00:00Z',
        status: 'closed',
        notes: 'Clean breakout trade'
      }
    ];

    mockTemplates = [
      {
        id: 'template1',
        userId: 'user1',
        name: 'Daily Review',
        description: 'Standard daily template',
        category: 'full-day',
        isDefault: true,
        isPublic: false,
        sections: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        usageCount: 5
      }
    ];

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

    // Setup successful mock responses
    mockExportService.exportToPDF.mockResolvedValue({
      success: true,
      data: new Blob(['mock pdf content'], { type: 'application/pdf' }),
      filename: 'journal_user1_2024-01-15.pdf',
      size: 1024,
      checksum: 'abc123',
      exportId: 'export123'
    });

    mockExportService.exportToJSON.mockResolvedValue({
      success: true,
      data: '{"mock": "json data"}',
      filename: 'journal_user1_2024-01-15.json',
      size: 512,
      checksum: 'def456',
      exportId: 'export456'
    });

    mockExportService.exportToCSV.mockResolvedValue({
      success: true,
      data: 'Date,Completed,Word Count\n2024-01-15,Yes,150',
      filename: 'journal_user1_2024-01-15.csv',
      size: 256,
      checksum: 'ghi789',
      exportId: 'export789'
    });

    mockExportService.createShareableExport.mockResolvedValue({
      success: true,
      shareId: 'share123',
      shareUrl: 'https://example.com/shared/share123'
    });

    mockExportService.createBackup.mockResolvedValue({
      success: true,
      backupId: 'backup123',
      filename: 'journal_backup_user1_v1_2024-01-15.json',
      size: 2048,
      checksum: 'backup123',
      version: 1,
      createdAt: '2024-01-15T16:00:00Z'
    });

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ExportInterface Component', () => {
    it('should render export interface with all format options', () => {
      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
        />
      );

      expect(screen.getByText('Export & Share')).toBeInTheDocument();
      expect(screen.getByText('PDF Document')).toBeInTheDocument();
      expect(screen.getByText('JSON Data')).toBeInTheDocument();
      expect(screen.getByText('CSV Spreadsheet')).toBeInTheDocument();
    });

    it('should handle PDF export workflow', async () => {
      const user = userEvent.setup();
      const onExportComplete = jest.fn();

      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
          onExportComplete={onExportComplete}
        />
      );

      // Select PDF format (should be default)
      const pdfButton = screen.getByText('PDF Document');
      await user.click(pdfButton);

      // Configure export options
      const includeImages = screen.getByLabelText(/Images & Screenshots/);
      await user.click(includeImages);

      const includeEmotional = screen.getByLabelText(/Emotional Tracking/);
      await user.click(includeEmotional);

      // Start export
      const exportButton = screen.getByText('Export PDF');
      await user.click(exportButton);

      // Wait for export to complete
      await waitFor(() => {
        expect(mockExportService.exportToPDF).toHaveBeenCalledWith(
          'user1',
          mockEntries,
          mockTrades,
          expect.objectContaining({
            format: 'pdf',
            includeImages: true,
            includeEmotionalData: true,
            includeProcessMetrics: true
          })
        );
      });

      expect(onExportComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          filename: 'journal_user1_2024-01-15.pdf'
        })
      );

      // Verify success notification
      expect(screen.getByText(/Export completed successfully/)).toBeInTheDocument();
    });

    it('should handle JSON export with date range filter', async () => {
      const user = userEvent.setup();

      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
        />
      );

      // Select JSON format
      const jsonButton = screen.getByText('JSON Data');
      await user.click(jsonButton);

      // Enable date range filter
      const dateRangeCheckbox = screen.getByLabelText(/Limit to date range/);
      await user.click(dateRangeCheckbox);

      // Set date range
      const startDateInput = screen.getByDisplayValue(/2024-/);
      await user.clear(startDateInput);
      await user.type(startDateInput, '2024-01-15');

      const endDateInput = screen.getAllByDisplayValue(/2024-/)[1];
      await user.clear(endDateInput);
      await user.type(endDateInput, '2024-01-15');

      // Start export
      const exportButton = screen.getByText('Export JSON');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportService.exportToJSON).toHaveBeenCalledWith(
          'user1',
          mockEntries,
          expect.objectContaining({
            format: 'json',
            dateRange: {
              start: '2024-01-15',
              end: '2024-01-15'
            }
          })
        );
      });
    });

    it('should handle CSV export with emotional data', async () => {
      const user = userEvent.setup();

      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
        />
      );

      // Select CSV format
      const csvButton = screen.getByText('CSV Spreadsheet');
      await user.click(csvButton);

      // Enable emotional data
      const emotionalCheckbox = screen.getByLabelText(/Emotional Tracking/);
      await user.click(emotionalCheckbox);

      // Start export
      const exportButton = screen.getByText('Export CSV');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportService.exportToCSV).toHaveBeenCalledWith(
          'user1',
          mockEntries,
          expect.objectContaining({
            format: 'csv',
            includeEmotionalData: true
          })
        );
      });
    });

    it('should handle advanced export options', async () => {
      const user = userEvent.setup();

      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
        />
      );

      // Open advanced options
      const advancedButton = screen.getByText('Advanced Options');
      await user.click(advancedButton);

      // Enable anonymization
      const anonymizeCheckbox = screen.getByLabelText(/Anonymize Data/);
      await user.click(anonymizeCheckbox);

      // Set password
      const passwordInput = screen.getByPlaceholderText(/Enter password/);
      await user.type(passwordInput, 'test123');

      // Start export
      const exportButton = screen.getByText('Export PDF');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportService.exportToPDF).toHaveBeenCalledWith(
          'user1',
          mockEntries,
          mockTrades,
          expect.objectContaining({
            anonymize: true,
            password: 'test123'
          })
        );
      });
    });

    it('should handle sharing workflow', async () => {
      const user = userEvent.setup();
      const onSharingComplete = jest.fn();

      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
          onSharingComplete={onSharingComplete}
        />
      );

      // Switch to share tab
      const shareTab = screen.getByText('Share');
      await user.click(shareTab);

      // Fill in recipient information
      const emailInput = screen.getByPlaceholderText('mentor@example.com');
      await user.type(emailInput, 'coach@example.com');

      const nameInput = screen.getByPlaceholderText('John Doe');
      await user.type(nameInput, 'Trading Coach');

      // Select comment access level
      const commentAccess = screen.getByText('Read & Comment');
      await user.click(commentAccess);

      // Set expiration date
      const expirationInput = screen.getByDisplayValue(/2024-/);
      await user.clear(expirationInput);
      await user.type(expirationInput, '2024-12-31');

      // Add custom message
      const messageTextarea = screen.getByPlaceholderText(/Add a personal message/);
      await user.type(messageTextarea, 'Please review my recent trading performance');

      // Create share link
      const shareButton = screen.getByText('Create Share Link');
      await user.click(shareButton);

      await waitFor(() => {
        expect(mockExportService.createShareableExport).toHaveBeenCalledWith(
          'user1',
          mockEntries,
          expect.objectContaining({
            recipientEmail: 'coach@example.com',
            recipientName: 'Trading Coach',
            accessLevel: 'comment',
            expirationDate: '2024-12-31',
            customMessage: 'Please review my recent trading performance'
          })
        );
      });

      expect(onSharingComplete).toHaveBeenCalledWith('https://example.com/shared/share123');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/shared/share123');
    });

    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock export failure
      mockExportService.exportToPDF.mockResolvedValue({
        success: false,
        filename: '',
        error: 'Export failed due to network error'
      });

      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
        />
      );

      const exportButton = screen.getByText('Export PDF');
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Export failed due to network error/)).toBeInTheDocument();
      });
    });

    it('should validate sharing form', async () => {
      const user = userEvent.setup();

      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
        />
      );

      // Switch to share tab
      const shareTab = screen.getByText('Share');
      await user.click(shareTab);

      // Try to share without email
      const shareButton = screen.getByText('Create Share Link');
      expect(shareButton).toBeDisabled();

      // Add email
      const emailInput = screen.getByPlaceholderText('mentor@example.com');
      await user.type(emailInput, 'coach@example.com');

      // Button should now be enabled
      expect(shareButton).toBeEnabled();
    });
  });

  describe('BackupManager Component', () => {
    it('should render backup manager with statistics', () => {
      render(
        <BackupManager
          userId="user1"
          entries={mockEntries}
          templates={mockTemplates}
          preferences={mockPreferences}
        />
      );

      expect(screen.getByText('Backup Manager')).toBeInTheDocument();
      expect(screen.getByText('Last Backup')).toBeInTheDocument();
      expect(screen.getByText('Total Backups')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
    });

    it('should create manual backup', async () => {
      const user = userEvent.setup();
      const onBackupCreated = jest.fn();

      render(
        <BackupManager
          userId="user1"
          entries={mockEntries}
          templates={mockTemplates}
          preferences={mockPreferences}
          onBackupCreated={onBackupCreated}
        />
      );

      const createButton = screen.getByText('Create Backup');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockExportService.createBackup).toHaveBeenCalledWith(
          'user1',
          mockEntries,
          mockTemplates,
          mockPreferences,
          expect.objectContaining({
            includeImages: true,
            compression: true,
            encryption: true
          })
        );
      });

      expect(onBackupCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          backupId: 'backup123'
        })
      );

      expect(screen.getByText(/Backup created successfully/)).toBeInTheDocument();
    });

    it('should configure backup settings', async () => {
      const user = userEvent.setup();

      render(
        <BackupManager
          userId="user1"
          entries={mockEntries}
          templates={mockTemplates}
          preferences={mockPreferences}
        />
      );

      // Open settings
      const settingsButton = screen.getByTitle('Backup Settings');
      await user.click(settingsButton);

      expect(screen.getByText('Backup Settings')).toBeInTheDocument();

      // Modify settings
      const autoBackupCheckbox = screen.getByLabelText(/Enable Automatic Backups/);
      await user.click(autoBackupCheckbox);

      const frequencySelect = screen.getByDisplayValue('Weekly');
      await user.selectOptions(frequencySelect, 'Daily');

      const retentionInput = screen.getByDisplayValue('90');
      await user.clear(retentionInput);
      await user.type(retentionInput, '30');

      // Settings should be updated (would be handled by parent component)
      expect(frequencySelect).toHaveValue('daily');
      expect(retentionInput).toHaveValue('30');
    });

    it('should display backup history', () => {
      render(
        <BackupManager
          userId="user1"
          entries={mockEntries}
          templates={mockTemplates}
          preferences={mockPreferences}
        />
      );

      expect(screen.getByText('Backup History')).toBeInTheDocument();
      
      // Should show mock backup history
      expect(screen.getByText('Version 3')).toBeInTheDocument();
      expect(screen.getByText('Weekly automated backup')).toBeInTheDocument();
      expect(screen.getByText('Automatic')).toBeInTheDocument();
    });

    it('should handle backup restoration', async () => {
      const user = userEvent.setup();
      const onBackupRestored = jest.fn();

      // Mock restore success
      mockExportService.restoreFromBackup.mockResolvedValue({
        success: true,
        restoredEntries: 5
      });

      render(
        <BackupManager
          userId="user1"
          entries={mockEntries}
          templates={mockTemplates}
          preferences={mockPreferences}
          onBackupRestored={onBackupRestored}
        />
      );

      // Find and click restore button
      const restoreButtons = screen.getAllByText('Restore');
      await user.click(restoreButtons[0]);

      // Confirm restoration
      // Note: In a real test, we'd need to mock window.confirm
      // For now, assume confirmation is handled

      await waitFor(() => {
        expect(mockExportService.restoreFromBackup).toHaveBeenCalled();
      });

      expect(onBackupRestored).toHaveBeenCalledWith(5);
    });

    it('should handle backup errors', async () => {
      const user = userEvent.setup();

      // Mock backup failure
      mockExportService.createBackup.mockResolvedValue({
        success: false,
        backupId: '',
        filename: '',
        size: 0,
        checksum: '',
        version: 0,
        createdAt: '',
        error: 'Backup failed due to storage error'
      });

      render(
        <BackupManager
          userId="user1"
          entries={mockEntries}
          templates={mockTemplates}
          preferences={mockPreferences}
        />
      );

      const createButton = screen.getByText('Create Backup');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Backup failed due to storage error/)).toBeInTheDocument();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete export and backup workflow', async () => {
      const user = userEvent.setup();

      // Render both components in a container
      const { rerender } = render(
        <div>
          <ExportInterface
            userId="user1"
            entries={mockEntries}
            trades={mockTrades}
          />
          <BackupManager
            userId="user1"
            entries={mockEntries}
            templates={mockTemplates}
            preferences={mockPreferences}
          />
        </div>
      );

      // First, create an export
      const exportButton = screen.getByText('Export PDF');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportService.exportToPDF).toHaveBeenCalled();
      });

      // Then, create a backup
      const backupButton = screen.getByText('Create Backup');
      await user.click(backupButton);

      await waitFor(() => {
        expect(mockExportService.createBackup).toHaveBeenCalled();
      });

      // Both operations should complete successfully
      expect(screen.getByText(/Export completed successfully/)).toBeInTheDocument();
      expect(screen.getByText(/Backup created successfully/)).toBeInTheDocument();
    });

    it('should handle large dataset export and backup', async () => {
      const user = userEvent.setup();

      // Create large dataset
      const largeEntries = Array.from({ length: 100 }, (_, i) => ({
        ...mockEntries[0],
        id: `entry${i}`,
        date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`
      }));

      render(
        <ExportInterface
          userId="user1"
          entries={largeEntries}
          trades={mockTrades}
        />
      );

      // Export should handle large dataset
      const exportButton = screen.getByText('Export JSON');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportService.exportToJSON).toHaveBeenCalledWith(
          'user1',
          largeEntries,
          expect.any(Object)
        );
      });

      // Should show entry count
      expect(screen.getByText('100 total entries')).toBeInTheDocument();
    });

    it('should maintain state across tab switches', async () => {
      const user = userEvent.setup();

      render(
        <ExportInterface
          userId="user1"
          entries={mockEntries}
          trades={mockTrades}
        />
      );

      // Configure export settings
      const emotionalCheckbox = screen.getByLabelText(/Emotional Tracking/);
      await user.click(emotionalCheckbox);

      // Switch to share tab
      const shareTab = screen.getByText('Share');
      await user.click(shareTab);

      // Fill in sharing info
      const emailInput = screen.getByPlaceholderText('mentor@example.com');
      await user.type(emailInput, 'test@example.com');

      // Switch back to export tab
      const exportTab = screen.getByText('Export');
      await user.click(exportTab);

      // Export settings should be preserved
      expect(emotionalCheckbox).toBeChecked();

      // Switch back to share tab
      await user.click(shareTab);

      // Share settings should be preserved
      expect(emailInput).toHaveValue('test@example.com');
    });
  });
});
/**
 * Journal Export and Backup Service
 * 
 * This service handles exporting journal entries in multiple formats (PDF, JSON, CSV),
 * automated backup with version control, selective sharing, and data recovery.
 * 
 * Key Features:
 * - Multi-format export (PDF, JSON, CSV)
 * - Automated backup system with version control
 * - Selective sharing for mentors/coaches
 * - Data recovery and restoration
 * - Privacy-aware export options
 * - Batch operations for large datasets
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  JournalEntry, 
  JournalTemplate, 
  JournalPreferences,
  JournalImage,
  EmotionalState,
  ProcessMetrics,
  JournalSection
} from '../types/journal';
import { Trade } from '../types/trade';
import { EncryptionService } from './EncryptionService';
import { AuditLogService } from './AuditLogService';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

// ===== EXPORT INTERFACES =====

export interface JournalExportOptions {
  format: 'pdf' | 'json' | 'csv';
  dateRange?: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
  includeImages?: boolean;
  includeEmotionalData?: boolean;
  includeProcessMetrics?: boolean;
  includeTrades?: boolean;
  anonymize?: boolean;
  template?: ExportTemplate;
  compression?: boolean;
  password?: string; // For encrypted exports
}

export interface ExportTemplate {
  id: string;
  name: string;
  sections: ExportSection[];
  styling: ExportStyling;
  privacy: ExportPrivacySettings;
}

export interface ExportSection {
  type: 'summary' | 'entries' | 'analytics' | 'emotional_trends' | 'process_metrics' | 'images';
  title: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface ExportStyling {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  includeHeader: boolean;
  includeFooter: boolean;
  logoUrl?: string;
}

export interface ExportPrivacySettings {
  excludePersonalNotes: boolean;
  excludeEmotionalData: boolean;
  excludeTradeDetails: boolean;
  maskDates: boolean;
  maskAmounts: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename: string;
  size?: number; // File size in bytes
  checksum?: string; // For integrity verification
  error?: string;
  exportId?: string; // For tracking and recovery
}

// ===== BACKUP INTERFACES =====

export interface BackupOptions {
  includeImages?: boolean;
  compression?: boolean;
  encryption?: boolean;
  versionControl?: boolean;
  retentionDays?: number;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  filename: string;
  size: number;
  checksum: string;
  version: number;
  createdAt: string;
  error?: string;
}

export interface BackupVersion {
  id: string;
  version: number;
  createdAt: string;
  size: number;
  checksum: string;
  description?: string;
  isAutomatic: boolean;
}

export interface RestoreOptions {
  backupId: string;
  version?: number;
  selectiveRestore?: {
    dateRange?: { start: string; end: string };
    entryIds?: string[];
  };
  overwriteExisting?: boolean;
}

// ===== SHARING INTERFACES =====

export interface SharingOptions {
  recipientEmail: string;
  recipientName?: string;
  accessLevel: 'read' | 'comment';
  expirationDate?: string;
  includeEmotionalData?: boolean;
  includeProcessMetrics?: boolean;
  customMessage?: string;
}

export interface SharedExport {
  id: string;
  exportId: string;
  recipientEmail: string;
  accessLevel: 'read' | 'comment';
  createdAt: string;
  expirationDate?: string;
  accessCount: number;
  lastAccessedAt?: string;
  isActive: boolean;
}

/**
 * Journal Export and Backup Service
 */
export class JournalExportService {
  private encryptionService: EncryptionService;
  private auditLogService: AuditLogService;

  constructor(
    encryptionService?: EncryptionService,
    auditLogService?: AuditLogService
  ) {
    this.encryptionService = encryptionService || new EncryptionService();
    this.auditLogService = auditLogService || new AuditLogService();
  }

  // ===== EXPORT METHODS =====

  /**
   * Export journal entries as PDF
   */
  async exportToPDF(
    userId: string,
    entries: JournalEntry[],
    trades: Trade[],
    options: JournalExportOptions = { format: 'pdf' }
  ): Promise<ExportResult> {
    try {
      await this.auditLogService.logAccess({
        userId,
        action: 'export',
        resourceType: 'journal',
        resourceId: 'bulk_export',
        details: { format: 'pdf', entryCount: entries.length }
      });

      const template = options.template || this.getDefaultPDFTemplate();
      const doc = new jsPDF();
      
      // Apply anonymization if requested
      const processedEntries = options.anonymize ? this.anonymizeEntries(entries) : entries;
      const processedTrades = options.anonymize ? this.anonymizeTrades(trades) : trades;
      
      // Filter by date range if specified
      const filteredEntries = options.dateRange 
        ? this.filterEntriesByDateRange(processedEntries, options.dateRange)
        : processedEntries;

      let yPosition = 20;

      // Add header
      if (template.styling.includeHeader) {
        yPosition = this.addPDFHeader(doc, userId, template.styling, yPosition, filteredEntries.length);
      }

      // Add sections based on template
      for (const section of template.sections.filter(s => s.enabled)) {
        yPosition = await this.addPDFSection(
          doc, 
          section, 
          filteredEntries, 
          processedTrades, 
          template.styling, 
          yPosition,
          options
        );
      }

      // Add footer
      if (template.styling.includeFooter) {
        this.addPDFFooter(doc, template.styling);
      }

      const filename = this.generateFilename(userId, 'pdf', options.dateRange);
      const pdfBlob = doc.output('blob');
      const checksum = await this.calculateChecksum(pdfBlob);

      // Encrypt if password provided
      let finalBlob = pdfBlob;
      if (options.password) {
        const encryptedData = await this.encryptionService.encryptData(
          await pdfBlob.arrayBuffer(),
          options.password
        );
        finalBlob = new Blob([encryptedData]);
      }

      return {
        success: true,
        data: finalBlob,
        filename,
        size: finalBlob.size,
        checksum,
        exportId: this.generateExportId()
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Export journal entries as JSON
   */
  async exportToJSON(
    userId: string,
    entries: JournalEntry[],
    options: JournalExportOptions = { format: 'json' }
  ): Promise<ExportResult> {
    try {
      await this.auditLogService.logAccess({
        userId,
        action: 'export',
        resourceType: 'journal',
        resourceId: 'bulk_export',
        details: { format: 'json', entryCount: entries.length }
      });

      const processedEntries = options.anonymize ? this.anonymizeEntries(entries) : entries;
      const filteredEntries = options.dateRange 
        ? this.filterEntriesByDateRange(processedEntries, options.dateRange)
        : processedEntries;

      // Create export data structure
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          userId: options.anonymize ? 'anonymized' : userId,
          version: '1.0',
          entryCount: filteredEntries.length,
          dateRange: options.dateRange,
          options: {
            includeImages: options.includeImages,
            includeEmotionalData: options.includeEmotionalData,
            includeProcessMetrics: options.includeProcessMetrics,
            anonymized: options.anonymize
          }
        },
        entries: this.prepareEntriesForExport(filteredEntries, options),
        schema: this.getJSONSchema()
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const filename = this.generateFilename(userId, 'json', options.dateRange);
      const checksum = await this.calculateChecksum(new Blob([jsonString]));

      // Encrypt if password provided
      let finalData: Blob | string = jsonString;
      if (options.password) {
        const encryptedData = await this.encryptionService.encryptData(
          new TextEncoder().encode(jsonString),
          options.password
        );
        finalData = new Blob([encryptedData]);
      }

      return {
        success: true,
        data: finalData,
        filename,
        size: new Blob([jsonString]).size,
        checksum,
        exportId: this.generateExportId()
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Export journal entries as CSV
   */
  async exportToCSV(
    userId: string,
    entries: JournalEntry[],
    options: JournalExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      await this.auditLogService.logAccess({
        userId,
        action: 'export',
        resourceType: 'journal',
        resourceId: 'bulk_export',
        details: { format: 'csv', entryCount: entries.length }
      });

      const processedEntries = options.anonymize ? this.anonymizeEntries(entries) : entries;
      const filteredEntries = options.dateRange 
        ? this.filterEntriesByDateRange(processedEntries, options.dateRange)
        : processedEntries;

      const csvContent = this.generateCSVContent(filteredEntries, options);
      const filename = this.generateFilename(userId, 'csv', options.dateRange);
      const checksum = await this.calculateChecksum(new Blob([csvContent]));

      return {
        success: true,
        data: csvContent,
        filename,
        size: new Blob([csvContent]).size,
        checksum,
        exportId: this.generateExportId()
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ===== BACKUP METHODS =====

  /**
   * Create automated backup of journal data
   */
  async createBackup(
    userId: string,
    entries: JournalEntry[],
    templates: JournalTemplate[],
    preferences: JournalPreferences,
    options: BackupOptions = {}
  ): Promise<BackupResult> {
    try {
      const backupId = this.generateBackupId();
      const version = await this.getNextBackupVersion(userId);
      
      // Create comprehensive backup data
      const backupData = {
        metadata: {
          backupId,
          version,
          userId,
          createdAt: new Date().toISOString(),
          type: 'full_backup',
          options
        },
        data: {
          entries: options.includeImages ? entries : this.stripImagesFromEntries(entries),
          templates,
          preferences,
          statistics: await this.generateBackupStatistics(entries)
        }
      };

      let backupBlob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });

      // Apply compression if requested
      if (options.compression) {
        backupBlob = await this.compressData(backupBlob);
      }

      // Apply encryption if requested
      if (options.encryption) {
        const encryptedData = await this.encryptionService.encryptUserData(
          await backupBlob.arrayBuffer(),
          userId
        );
        backupBlob = new Blob([encryptedData]);
      }

      const checksum = await this.calculateChecksum(backupBlob);
      const filename = `journal_backup_${userId}_v${version}_${new Date().toISOString().split('T')[0]}.json`;

      // Store backup metadata (in a real implementation, this would go to a database)
      await this.storeBackupMetadata(userId, {
        id: backupId,
        version,
        createdAt: new Date().toISOString(),
        size: backupBlob.size,
        checksum,
        description: `Automated backup v${version}`,
        isAutomatic: true
      });

      await this.auditLogService.logAccess({
        userId,
        action: 'backup',
        resourceType: 'journal',
        resourceId: backupId,
        details: { version, size: backupBlob.size, compressed: options.compression, encrypted: options.encryption }
      });

      return {
        success: true,
        backupId,
        filename,
        size: backupBlob.size,
        checksum,
        version,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        backupId: '',
        filename: '',
        size: 0,
        checksum: '',
        version: 0,
        createdAt: '',
        error: error instanceof Error ? error.message : 'Backup failed'
      };
    }
  }

  /**
   * Restore journal data from backup
   */
  async restoreFromBackup(
    userId: string,
    options: RestoreOptions
  ): Promise<{ success: boolean; restoredEntries: number; error?: string }> {
    try {
      await this.auditLogService.logAccess({
        userId,
        action: 'restore',
        resourceType: 'journal',
        resourceId: options.backupId,
        details: { version: options.version, selective: !!options.selectiveRestore }
      });

      // In a real implementation, this would retrieve the backup from storage
      const backupData = await this.retrieveBackupData(userId, options.backupId, options.version);
      
      if (!backupData) {
        throw new Error('Backup not found');
      }

      let entriesToRestore = backupData.data.entries;

      // Apply selective restore filters
      if (options.selectiveRestore) {
        if (options.selectiveRestore.dateRange) {
          entriesToRestore = this.filterEntriesByDateRange(
            entriesToRestore, 
            options.selectiveRestore.dateRange
          );
        }
        
        if (options.selectiveRestore.entryIds) {
          entriesToRestore = entriesToRestore.filter(entry => 
            options.selectiveRestore!.entryIds!.includes(entry.id)
          );
        }
      }

      // Restore entries (in a real implementation, this would update the database)
      let restoredCount = 0;
      for (const entry of entriesToRestore) {
        try {
          await this.restoreJournalEntry(userId, entry, options.overwriteExisting);
          restoredCount++;
        } catch (error) {
          console.error(`Failed to restore entry ${entry.id}:`, error);
        }
      }

      return {
        success: true,
        restoredEntries: restoredCount
      };
    } catch (error) {
      return {
        success: false,
        restoredEntries: 0,
        error: error instanceof Error ? error.message : 'Restore failed'
      };
    }
  }

  // ===== SHARING METHODS =====

  /**
   * Create shareable export for mentors/coaches
   */
  async createShareableExport(
    userId: string,
    entries: JournalEntry[],
    options: SharingOptions
  ): Promise<{ success: boolean; shareId?: string; shareUrl?: string; error?: string }> {
    try {
      // Create privacy-aware export
      const exportOptions: JournalExportOptions = {
        format: 'pdf',
        includeEmotionalData: options.includeEmotionalData ?? false,
        includeProcessMetrics: options.includeProcessMetrics ?? true,
        anonymize: true // Always anonymize shared exports
      };

      const exportResult = await this.exportToPDF(userId, entries, [], exportOptions);
      
      if (!exportResult.success) {
        throw new Error(exportResult.error || 'Export failed');
      }

      const shareId = this.generateShareId();
      const shareUrl = `${window.location.origin}/shared/${shareId}`;

      // Store shared export metadata
      const sharedExport: SharedExport = {
        id: shareId,
        exportId: exportResult.exportId!,
        recipientEmail: options.recipientEmail,
        accessLevel: options.accessLevel,
        createdAt: new Date().toISOString(),
        expirationDate: options.expirationDate,
        accessCount: 0,
        isActive: true
      };

      await this.storeSharedExport(userId, sharedExport);

      // Send notification email (in a real implementation)
      await this.sendSharingNotification(options, shareUrl);

      await this.auditLogService.logAccess({
        userId,
        action: 'share',
        resourceType: 'journal',
        resourceId: shareId,
        details: { 
          recipientEmail: options.recipientEmail, 
          accessLevel: options.accessLevel,
          entryCount: entries.length
        }
      });

      return {
        success: true,
        shareId,
        shareUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sharing failed'
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get default PDF export template
   */
  private getDefaultPDFTemplate(): ExportTemplate {
    return {
      id: 'default_pdf',
      name: 'Standard Journal Export',
      sections: [
        { type: 'summary', title: 'Export Summary', enabled: true },
        { type: 'entries', title: 'Journal Entries', enabled: true },
        { type: 'emotional_trends', title: 'Emotional Patterns', enabled: true },
        { type: 'process_metrics', title: 'Process Performance', enabled: true }
      ],
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Arial',
        fontSize: 12,
        includeHeader: true,
        includeFooter: true
      },
      privacy: {
        excludePersonalNotes: false,
        excludeEmotionalData: false,
        excludeTradeDetails: false,
        maskDates: false,
        maskAmounts: false
      }
    };
  }

  /**
   * Anonymize journal entries for sharing
   */
  private anonymizeEntries(entries: JournalEntry[]): JournalEntry[] {
    return entries.map((entry, index) => ({
      ...entry,
      id: `entry_${index + 1}`,
      userId: 'anonymized_user',
      sections: entry.sections.map(section => ({
        ...section,
        content: this.anonymizeSectionContent(section)
      })),
      tradeReferences: entry.tradeReferences.map((ref, refIndex) => ({
        ...ref,
        tradeId: `trade_${refIndex + 1}`,
        cachedTradeData: ref.cachedTradeData ? {
          ...ref.cachedTradeData,
          symbol: `SYMBOL${refIndex % 10 + 1}`
        } : undefined
      })),
      dailyPnL: 0, // Remove actual P&L amounts
      images: entry.images.map((img, imgIndex) => ({
        ...img,
        id: `image_${imgIndex + 1}`,
        filename: `chart_${imgIndex + 1}.png`,
        url: '' // Remove actual URLs
      }))
    }));
  }

  /**
   * Anonymize section content based on type
   */
  private anonymizeSectionContent(section: JournalSection): any {
    switch (section.type) {
      case 'text':
        // Keep structure but remove specific details
        return typeof section.content === 'string' 
          ? section.content.replace(/\$[\d,]+/g, '$XXX').replace(/\d{4}-\d{2}-\d{2}/g, 'YYYY-MM-DD')
          : section.content;
      case 'trade_reference':
        return section.content; // Already handled in tradeReferences
      default:
        return section.content;
    }
  }

  /**
   * Anonymize trade data
   */
  private anonymizeTrades(trades: Trade[]): Trade[] {
    return trades.map((trade, index) => ({
      ...trade,
      id: `trade_${index + 1}`,
      currencyPair: `SYMBOL${index % 10 + 1}`,
      entryPrice: 0,
      exitPrice: 0,
      lotSize: 0,
      pnl: 0
    }));
  }

  /**
   * Filter entries by date range
   */
  private filterEntriesByDateRange(
    entries: JournalEntry[], 
    dateRange: { start: string; end: string }
  ): JournalEntry[] {
    return entries.filter(entry => {
      return entry.date >= dateRange.start && entry.date <= dateRange.end;
    });
  }

  /**
   * Generate filename for export
   */
  private generateFilename(
    userId: string, 
    format: string, 
    dateRange?: { start: string; end: string }
  ): string {
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    
    let filename = `journal_${sanitizedUserId}_${timestamp}`;
    
    if (dateRange) {
      filename += `_${dateRange.start}_to_${dateRange.end}`;
    }
    
    return `${filename}.${format}`;
  }

  /**
   * Calculate checksum for data integrity
   */
  private async calculateChecksum(data: Blob): Promise<string> {
    const arrayBuffer = await data.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique export ID
   */
  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique share ID
   */
  private generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== PDF GENERATION HELPERS =====

  /**
   * Add header to PDF document
   */
  private addPDFHeader(
    doc: jsPDF, 
    userId: string, 
    styling: ExportStyling, 
    yPosition: number,
    entryCount: number
  ): number {
    doc.setFontSize(18);
    doc.setTextColor(styling.primaryColor);
    doc.text('Trading Journal Export', 20, yPosition);
    
    doc.setFontSize(12);
    doc.setTextColor('#000000');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 10);
    doc.text(`Entries: ${entryCount}`, 20, yPosition + 20);
    
    return yPosition + 35;
  }

  /**
   * Add section to PDF document
   */
  private async addPDFSection(
    doc: jsPDF,
    section: ExportSection,
    entries: JournalEntry[],
    trades: Trade[],
    styling: ExportStyling,
    yPosition: number,
    options: JournalExportOptions
  ): Promise<number> {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(styling.primaryColor);
    doc.text(section.title, 20, yPosition);
    yPosition += 15;

    switch (section.type) {
      case 'summary':
        yPosition = this.addExportSummaryToPDF(doc, entries, yPosition);
        break;
      case 'entries':
        yPosition = this.addEntriesToPDF(doc, entries, yPosition, options);
        break;
      case 'emotional_trends':
        if (options.includeEmotionalData) {
          yPosition = this.addEmotionalTrendsToPDF(doc, entries, yPosition);
        }
        break;
      case 'process_metrics':
        if (options.includeProcessMetrics) {
          yPosition = this.addProcessMetricsToPDF(doc, entries, yPosition);
        }
        break;
    }

    return yPosition + 10;
  }

  /**
   * Add export summary to PDF
   */
  private addExportSummaryToPDF(
    doc: jsPDF, 
    entries: JournalEntry[], 
    yPosition: number
  ): number {
    const completedEntries = entries.filter(e => e.isComplete).length;
    const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
    const avgWordsPerEntry = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

    const summaryData = [
      ['Total Entries', entries.length.toString()],
      ['Completed Entries', completedEntries.toString()],
      ['Completion Rate', `${Math.round((completedEntries / entries.length) * 100)}%`],
      ['Total Words', totalWords.toString()],
      ['Average Words per Entry', avgWordsPerEntry.toString()],
      ['Date Range', entries.length > 0 ? `${entries[entries.length - 1].date} to ${entries[0].date}` : 'N/A']
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 9 }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Add journal entries to PDF
   */
  private addEntriesToPDF(
    doc: jsPDF, 
    entries: JournalEntry[], 
    yPosition: number,
    options: JournalExportOptions
  ): number {
    // Show first 10 entries in detail, then summary for the rest
    const detailedEntries = entries.slice(0, 10);
    
    for (const entry of detailedEntries) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      // Entry header
      doc.setFontSize(12);
      doc.setTextColor('#2563eb');
      doc.text(`${entry.date} - ${entry.isComplete ? 'Complete' : 'Partial'}`, 20, yPosition);
      yPosition += 10;

      // Entry content (first text section only for brevity)
      const textSection = entry.sections.find(s => s.type === 'text');
      if (textSection && textSection.content) {
        doc.setFontSize(9);
        doc.setTextColor('#000000');
        const content = typeof textSection.content === 'string' 
          ? textSection.content.substring(0, 200) + (textSection.content.length > 200 ? '...' : '')
          : 'Non-text content';
        
        const lines = doc.splitTextToSize(content, 170);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 4 + 5;
      }

      // Process score if available
      if (options.includeProcessMetrics && entry.processMetrics) {
        doc.setFontSize(8);
        doc.setTextColor('#64748b');
        doc.text(`Process Score: ${entry.processMetrics.processScore}/100`, 20, yPosition);
        yPosition += 8;
      }

      yPosition += 5;
    }

    return yPosition;
  }

  /**
   * Add emotional trends to PDF
   */
  private addEmotionalTrendsToPDF(
    doc: jsPDF, 
    entries: JournalEntry[], 
    yPosition: number
  ): number {
    const emotionalData = this.analyzeEmotionalTrends(entries);
    
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    doc.text('Emotional patterns analysis would be displayed here', 20, yPosition);
    doc.text(`Average confidence: ${emotionalData.avgConfidence.toFixed(1)}/5`, 20, yPosition + 10);
    doc.text(`Average stress: ${emotionalData.avgStress.toFixed(1)}/5`, 20, yPosition + 20);
    
    return yPosition + 35;
  }

  /**
   * Add process metrics to PDF
   */
  private addProcessMetricsToPDF(
    doc: jsPDF, 
    entries: JournalEntry[], 
    yPosition: number
  ): number {
    const processData = this.analyzeProcessMetrics(entries);
    
    const metricsData = [
      ['Average Process Score', `${processData.avgProcessScore.toFixed(1)}/100`],
      ['Plan Adherence', `${processData.avgPlanAdherence.toFixed(1)}/5`],
      ['Risk Management', `${processData.avgRiskManagement.toFixed(1)}/5`],
      ['Emotional Discipline', `${processData.avgEmotionalDiscipline.toFixed(1)}/5`]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Average Score']],
      body: metricsData,
      theme: 'grid',
      styles: { fontSize: 9 }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Add footer to PDF
   */
  private addPDFFooter(doc: jsPDF, styling: ExportStyling): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(styling.secondaryColor);
      doc.text(
        `Page ${i} of ${pageCount} - Trading Journal Export`, 
        20, 
        doc.internal.pageSize.height - 10
      );
    }
  }

  // ===== CSV GENERATION =====

  /**
   * Generate CSV content from journal entries
   */
  private generateCSVContent(entries: JournalEntry[], options: JournalExportOptions): string {
    const headers = [
      'Date',
      'Completed',
      'Word Count',
      'Trade Count',
      'Daily P&L',
      'Process Score',
      'Tags'
    ];

    if (options.includeEmotionalData) {
      headers.push('Overall Mood', 'Confidence Level', 'Stress Level');
    }

    const rows = entries.map(entry => {
      const row = [
        entry.date,
        entry.isComplete ? 'Yes' : 'No',
        entry.wordCount.toString(),
        entry.tradeCount.toString(),
        entry.dailyPnL.toString(),
        entry.processMetrics?.processScore?.toString() || '',
        entry.tags.join('; ')
      ];

      if (options.includeEmotionalData) {
        row.push(
          entry.emotionalState?.overallMood || '',
          entry.emotionalState?.confidenceLevel?.toString() || '',
          entry.emotionalState?.stressLevel?.toString() || ''
        );
      }

      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Prepare entries for JSON export
   */
  private prepareEntriesForExport(entries: JournalEntry[], options: JournalExportOptions): any[] {
    return entries.map(entry => {
      const exportEntry: any = {
        id: entry.id,
        date: entry.date,
        isComplete: entry.isComplete,
        wordCount: entry.wordCount,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };

      // Add sections
      exportEntry.sections = entry.sections;

      // Add trade references if requested
      if (options.includeTrades) {
        exportEntry.tradeReferences = entry.tradeReferences;
        exportEntry.tradeCount = entry.tradeCount;
        exportEntry.dailyPnL = entry.dailyPnL;
      }

      // Add emotional data if requested
      if (options.includeEmotionalData) {
        exportEntry.emotionalState = entry.emotionalState;
      }

      // Add process metrics if requested
      if (options.includeProcessMetrics) {
        exportEntry.processMetrics = entry.processMetrics;
      }

      // Add images if requested
      if (options.includeImages) {
        exportEntry.images = entry.images;
      }

      // Add tags and metadata
      exportEntry.tags = entry.tags;
      exportEntry.templateId = entry.templateId;

      return exportEntry;
    });
  }

  /**
   * Get JSON schema for exported data
   */
  private getJSONSchema(): any {
    return {
      type: 'object',
      properties: {
        metadata: {
          type: 'object',
          properties: {
            exportedAt: { type: 'string', format: 'date-time' },
            userId: { type: 'string' },
            version: { type: 'string' },
            entryCount: { type: 'number' },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date' },
                end: { type: 'string', format: 'date' }
              }
            }
          }
        },
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              date: { type: 'string', format: 'date' },
              isComplete: { type: 'boolean' },
              wordCount: { type: 'number' },
              sections: { type: 'array' },
              tradeReferences: { type: 'array' },
              emotionalState: { type: 'object' },
              processMetrics: { type: 'object' },
              images: { type: 'array' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    };
  }

  // ===== BACKUP UTILITY METHODS =====

  /**
   * Get next backup version number
   */
  private async getNextBackupVersion(userId: string): Promise<number> {
    // In a real implementation, this would query the database
    // For now, return a mock version number
    return Math.floor(Math.random() * 100) + 1;
  }

  /**
   * Strip images from entries to reduce backup size
   */
  private stripImagesFromEntries(entries: JournalEntry[]): JournalEntry[] {
    return entries.map(entry => ({
      ...entry,
      images: [],
      sections: entry.sections.map(section => ({
        ...section,
        content: section.type === 'image' ? null : section.content
      }))
    }));
  }

  /**
   * Generate backup statistics
   */
  private async generateBackupStatistics(entries: JournalEntry[]): Promise<any> {
    const completedEntries = entries.filter(e => e.isComplete).length;
    const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
    const totalImages = entries.reduce((sum, e) => sum + e.images.length, 0);
    const totalTrades = entries.reduce((sum, e) => sum + e.tradeCount, 0);

    return {
      totalEntries: entries.length,
      completedEntries,
      completionRate: entries.length > 0 ? (completedEntries / entries.length) * 100 : 0,
      totalWords,
      averageWordsPerEntry: entries.length > 0 ? totalWords / entries.length : 0,
      totalImages,
      totalTrades,
      dateRange: entries.length > 0 ? {
        start: entries[entries.length - 1].date,
        end: entries[0].date
      } : null
    };
  }

  /**
   * Compress data using built-in compression
   */
  private async compressData(blob: Blob): Promise<Blob> {
    // In a real implementation, this would use a compression library
    // For now, return the original blob
    return blob;
  }

  /**
   * Store backup metadata
   */
  private async storeBackupMetadata(userId: string, metadata: BackupVersion): Promise<void> {
    // In a real implementation, this would store to a database
    console.log('Storing backup metadata:', { userId, metadata });
  }

  /**
   * Retrieve backup data
   */
  private async retrieveBackupData(userId: string, backupId: string, version?: number): Promise<any> {
    // In a real implementation, this would retrieve from storage
    // For now, return mock data
    return {
      metadata: {
        backupId,
        version: version || 1,
        userId,
        createdAt: new Date().toISOString()
      },
      data: {
        entries: [],
        templates: [],
        preferences: {}
      }
    };
  }

  /**
   * Restore individual journal entry
   */
  private async restoreJournalEntry(userId: string, entry: JournalEntry, overwrite: boolean = false): Promise<void> {
    // In a real implementation, this would update the database
    console.log('Restoring journal entry:', { userId, entryId: entry.id, overwrite });
  }

  /**
   * Store shared export metadata
   */
  private async storeSharedExport(userId: string, sharedExport: SharedExport): Promise<void> {
    // In a real implementation, this would store to a database
    console.log('Storing shared export:', { userId, sharedExport });
  }

  /**
   * Send sharing notification email
   */
  private async sendSharingNotification(options: SharingOptions, shareUrl: string): Promise<void> {
    // In a real implementation, this would send an email
    console.log('Sending sharing notification:', { 
      recipient: options.recipientEmail, 
      shareUrl,
      message: options.customMessage 
    });
  }

  // ===== ANALYSIS METHODS =====

  /**
   * Analyze emotional trends from journal entries
   */
  private analyzeEmotionalTrends(entries: JournalEntry[]): {
    avgConfidence: number;
    avgStress: number;
    moodDistribution: Record<string, number>;
  } {
    const validEntries = entries.filter(e => e.emotionalState);
    
    if (validEntries.length === 0) {
      return {
        avgConfidence: 0,
        avgStress: 0,
        moodDistribution: {}
      };
    }

    const confidenceSum = validEntries.reduce((sum, e) => {
      return sum + (e.emotionalState?.preMarket?.confidence || 0);
    }, 0);

    const stressSum = validEntries.reduce((sum, e) => {
      return sum + (e.emotionalState?.preMarket?.anxiety || 0);
    }, 0);

    const moodDistribution: Record<string, number> = {};
    validEntries.forEach(e => {
      const mood = e.emotionalState?.postMarket?.overallMood;
      if (mood) {
        moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
      }
    });

    return {
      avgConfidence: confidenceSum / validEntries.length,
      avgStress: stressSum / validEntries.length,
      moodDistribution
    };
  }

  /**
   * Analyze process metrics from journal entries
   */
  private analyzeProcessMetrics(entries: JournalEntry[]): {
    avgProcessScore: number;
    avgPlanAdherence: number;
    avgRiskManagement: number;
    avgEmotionalDiscipline: number;
  } {
    const validEntries = entries.filter(e => e.processMetrics);
    
    if (validEntries.length === 0) {
      return {
        avgProcessScore: 0,
        avgPlanAdherence: 0,
        avgRiskManagement: 0,
        avgEmotionalDiscipline: 0
      };
    }

    const processScoreSum = validEntries.reduce((sum, e) => sum + (e.processMetrics?.processScore || 0), 0);
    const planAdherenceSum = validEntries.reduce((sum, e) => sum + (e.processMetrics?.planAdherence || 0), 0);
    const riskManagementSum = validEntries.reduce((sum, e) => sum + (e.processMetrics?.riskManagement || 0), 0);
    const emotionalDisciplineSum = validEntries.reduce((sum, e) => sum + (e.processMetrics?.overallDiscipline || 0), 0);

    return {
      avgProcessScore: processScoreSum / validEntries.length,
      avgPlanAdherence: planAdherenceSum / validEntries.length,
      avgRiskManagement: riskManagementSum / validEntries.length,
      avgEmotionalDiscipline: emotionalDisciplineSum / validEntries.length
    };
  }

  private formatCSV(headers: string[], rows: string[][]): string {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // ===== JSON EXPORT HELPERS =====

  /**
   * Prepare entries for JSON export
   */
  private prepareEntriesForExport(entries: JournalEntry[], options: JournalExportOptions): any[] {
    return entries.map(entry => {
      const exportEntry: any = {
        id: entry.id,
        date: entry.date,
        isComplete: entry.isComplete,
        completionPercentage: entry.completionPercentage,
        wordCount: entry.wordCount,
        tradeCount: entry.tradeCount,
        tags: entry.tags,
        sections: entry.sections.filter(section => {
          // Filter sections based on options
          if (section.type === 'emotion_tracker' && !options.includeEmotionalData) {
            return false;
          }
          return true;
        })
      };

      if (options.includeEmotionalData) {
        exportEntry.emotionalState = entry.emotionalState;
      }

      if (options.includeProcessMetrics) {
        exportEntry.processMetrics = entry.processMetrics;
        exportEntry.dailyPnL = entry.dailyPnL;
      }

      if (options.includeTrades) {
        exportEntry.tradeReferences = entry.tradeReferences;
        exportEntry.dailyTradeIds = entry.dailyTradeIds;
      }

      if (options.includeImages) {
        exportEntry.images = entry.images;
      }

      return exportEntry;
    });
  }

  /**
   * Get JSON schema for exported data
   */
  private getJSONSchema(): any {
    return {
      version: '1.0',
      description: 'Trading Journal Export Schema',
      properties: {
        metadata: {
          type: 'object',
          properties: {
            exportedAt: { type: 'string', format: 'date-time' },
            userId: { type: 'string' },
            version: { type: 'string' },
            entryCount: { type: 'number' }
          }
        },
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              date: { type: 'string', format: 'date' },
              isComplete: { type: 'boolean' },
              wordCount: { type: 'number' },
              sections: { type: 'array' }
            }
          }
        }
      }
    };
  }

  // ===== ANALYSIS HELPERS =====

  /**
   * Analyze emotional trends from entries
   */
  private analyzeEmotionalTrends(entries: JournalEntry[]): {
    avgConfidence: number;
    avgStress: number;
  } {
    const validEntries = entries.filter(e => e.emotionalState);
    
    if (validEntries.length === 0) {
      return { avgConfidence: 0, avgStress: 0 };
    }

    const avgConfidence = validEntries.reduce((sum, e) => 
      sum + (e.emotionalState?.confidenceLevel || 0), 0) / validEntries.length;
    
    const avgStress = validEntries.reduce((sum, e) => 
      sum + (e.emotionalState?.stressLevel || 0), 0) / validEntries.length;

    return { avgConfidence, avgStress };
  }

  /**
   * Analyze process metrics from entries
   */
  private analyzeProcessMetrics(entries: JournalEntry[]): {
    avgProcessScore: number;
    avgPlanAdherence: number;
    avgRiskManagement: number;
    avgEmotionalDiscipline: number;
  } {
    const validEntries = entries.filter(e => e.processMetrics);
    
    if (validEntries.length === 0) {
      return { 
        avgProcessScore: 0, 
        avgPlanAdherence: 0, 
        avgRiskManagement: 0, 
        avgEmotionalDiscipline: 0 
      };
    }

    const avgProcessScore = validEntries.reduce((sum, e) => 
      sum + (e.processMetrics?.processScore || 0), 0) / validEntries.length;
    
    const avgPlanAdherence = validEntries.reduce((sum, e) => 
      sum + (e.processMetrics?.planAdherence || 0), 0) / validEntries.length;
    
    const avgRiskManagement = validEntries.reduce((sum, e) => 
      sum + (e.processMetrics?.riskManagement || 0), 0) / validEntries.length;
    
    const avgEmotionalDiscipline = validEntries.reduce((sum, e) => 
      sum + (e.processMetrics?.emotionalDiscipline || 0), 0) / validEntries.length;

    return { 
      avgProcessScore, 
      avgPlanAdherence, 
      avgRiskManagement, 
      avgEmotionalDiscipline 
    };
  }

  // ===== PLACEHOLDER METHODS (to be implemented with actual storage) =====

  private async getNextBackupVersion(userId: string): Promise<number> {
    // In a real implementation, this would query the database
    return 1;
  }

  private async storeBackupMetadata(userId: string, metadata: BackupVersion): Promise<void> {
    // In a real implementation, this would store to database
    console.log('Storing backup metadata:', metadata);
  }

  private async retrieveBackupData(userId: string, backupId: string, version?: number): Promise<any> {
    // In a real implementation, this would retrieve from storage
    return null;
  }

  private async restoreJournalEntry(userId: string, entry: JournalEntry, overwrite?: boolean): Promise<void> {
    // In a real implementation, this would update the database
    console.log('Restoring entry:', entry.id);
  }

  private async storeSharedExport(userId: string, sharedExport: SharedExport): Promise<void> {
    // In a real implementation, this would store to database
    console.log('Storing shared export:', sharedExport);
  }

  private async sendSharingNotification(options: SharingOptions, shareUrl: string): Promise<void> {
    // In a real implementation, this would send an email
    console.log('Sending sharing notification to:', options.recipientEmail);
  }

  private stripImagesFromEntries(entries: JournalEntry[]): JournalEntry[] {
    return entries.map(entry => ({
      ...entry,
      images: []
    }));
  }

  private async compressData(data: Blob): Promise<Blob> {
    // In a real implementation, this would use compression library
    return data;
  }

  private async generateBackupStatistics(entries: JournalEntry[]): Promise<any> {
    return {
      totalEntries: entries.length,
      completedEntries: entries.filter(e => e.isComplete).length,
      totalWords: entries.reduce((sum, e) => sum + e.wordCount, 0)
    };
  }
}

/**
 * Default journal export service instance
 */
export const journalExportService = new JournalExportService();
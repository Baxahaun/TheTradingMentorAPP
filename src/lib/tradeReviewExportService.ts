import { EnhancedTrade, TradeReviewData, TradeNotes, TradeChart, PerformanceMetrics, ReviewWorkflow } from '../types/tradeReview';
import { Trade } from '../types/trade';

export type ExportFormat = 'pdf' | 'csv' | 'json';

export interface TradeReviewExportOptions {
  format: ExportFormat;
  includeNotes: boolean;
  includeCharts: boolean;
  includePerformanceMetrics: boolean;
  includeReviewWorkflow: boolean;
  includeBasicTradeData: boolean;
  customFields?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tagFilter?: string[];
  statusFilter?: ('open' | 'closed')[];
}

export interface ExportFieldConfig {
  id: string;
  label: string;
  category: 'basic' | 'review' | 'performance' | 'notes' | 'charts' | 'workflow';
  required: boolean;
  description: string;
}

export interface TradeReportData {
  trade: EnhancedTrade;
  performanceMetrics?: PerformanceMetrics;
  notes?: TradeNotes;
  charts?: TradeChart[];
  reviewWorkflow?: ReviewWorkflow;
  generatedAt: string;
  reportId: string;
}

export interface ShareableReport {
  id: string;
  reportData: TradeReportData;
  shareUrl: string;
  accessLevel: 'public' | 'protected' | 'private';
  password?: string;
  expiresAt?: string;
  createdAt: string;
  accessCount: number;
  maxAccess?: number;
}

/**
 * Enhanced Export Service for Trade Review System
 * Handles PDF, CSV, and JSON export with comprehensive trade review data
 */
export class TradeReviewExportService {
  
  /**
   * Export trade review data to specified format
   */
  static async exportTrade(
    trade: EnhancedTrade, 
    options: TradeReviewExportOptions
  ): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(trade, options);
      case 'csv':
        return this.exportToCSV([trade], options);
      case 'json':
        return this.exportToJSON([trade], options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export multiple trades to specified format
   */
  static async exportTrades(
    trades: EnhancedTrade[], 
    options: TradeReviewExportOptions
  ): Promise<Blob> {
    const filteredTrades = this.filterTrades(trades, options);
    
    switch (options.format) {
      case 'pdf':
        return this.exportMultipleTradesToPDF(filteredTrades, options);
      case 'csv':
        return this.exportToCSV(filteredTrades, options);
      case 'json':
        return this.exportToJSON(filteredTrades, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generate comprehensive trade report
   */
  static generateTradeReport(trade: EnhancedTrade): TradeReportData {
    return {
      trade,
      performanceMetrics: trade.reviewData?.performanceMetrics,
      notes: trade.reviewData?.notes,
      charts: trade.reviewData?.charts,
      reviewWorkflow: trade.reviewData?.reviewWorkflow,
      generatedAt: new Date().toISOString(),
      reportId: `report_${trade.id}_${Date.now()}`
    };
  }

  /**
   * Create shareable report with access controls
   */
  static async createShareableReport(
    trade: EnhancedTrade,
    accessLevel: ShareableReport['accessLevel'] = 'private',
    options?: {
      password?: string;
      expiresIn?: number; // hours
      maxAccess?: number;
    }
  ): Promise<ShareableReport> {
    const reportData = this.generateTradeReport(trade);
    const shareId = this.generateShareId();
    
    const shareableReport: ShareableReport = {
      id: shareId,
      reportData,
      shareUrl: `${window.location.origin}/shared-report/${shareId}`,
      accessLevel,
      password: options?.password,
      expiresAt: options?.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000).toISOString()
        : undefined,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      maxAccess: options?.maxAccess
    };

    // Store in localStorage for demo purposes
    // In production, this would be stored in a secure backend
    const existingReports = this.getStoredReports();
    existingReports[shareId] = shareableReport;
    localStorage.setItem('tradeReviewSharedReports', JSON.stringify(existingReports));

    return shareableReport;
  }

  /**
   * Get available export fields
   */
  static getAvailableFields(): ExportFieldConfig[] {
    return [
      // Basic trade data
      { id: 'id', label: 'Trade ID', category: 'basic', required: true, description: 'Unique trade identifier' },
      { id: 'currencyPair', label: 'Currency Pair', category: 'basic', required: true, description: 'Trading pair' },
      { id: 'date', label: 'Date', category: 'basic', required: true, description: 'Trade date' },
      { id: 'side', label: 'Side', category: 'basic', required: true, description: 'Long or short position' },
      { id: 'entryPrice', label: 'Entry Price', category: 'basic', required: true, description: 'Entry price' },
      { id: 'exitPrice', label: 'Exit Price', category: 'basic', required: false, description: 'Exit price' },
      { id: 'lotSize', label: 'Lot Size', category: 'basic', required: true, description: 'Position size' },
      { id: 'pnl', label: 'P&L', category: 'basic', required: false, description: 'Profit and loss' },
      { id: 'commission', label: 'Commission', category: 'basic', required: true, description: 'Trading fees' },
      { id: 'status', label: 'Status', category: 'basic', required: true, description: 'Trade status' },
      
      // Performance metrics
      { id: 'rMultiple', label: 'R-Multiple', category: 'performance', required: false, description: 'Risk-reward multiple' },
      { id: 'returnPercentage', label: 'Return %', category: 'performance', required: false, description: 'Return percentage' },
      { id: 'riskRewardRatio', label: 'Risk/Reward', category: 'performance', required: false, description: 'Risk to reward ratio' },
      { id: 'holdDuration', label: 'Hold Duration', category: 'performance', required: false, description: 'Time held' },
      { id: 'efficiency', label: 'Efficiency', category: 'performance', required: false, description: 'Trade efficiency score' },
      
      // Notes
      { id: 'preTradeAnalysis', label: 'Pre-Trade Analysis', category: 'notes', required: false, description: 'Analysis before trade' },
      { id: 'executionNotes', label: 'Execution Notes', category: 'notes', required: false, description: 'Trade execution notes' },
      { id: 'postTradeReflection', label: 'Post-Trade Reflection', category: 'notes', required: false, description: 'Post-trade analysis' },
      { id: 'lessonsLearned', label: 'Lessons Learned', category: 'notes', required: false, description: 'Key takeaways' },
      
      // Charts
      { id: 'chartCount', label: 'Chart Count', category: 'charts', required: false, description: 'Number of charts' },
      { id: 'chartTypes', label: 'Chart Types', category: 'charts', required: false, description: 'Types of charts uploaded' },
      
      // Review workflow
      { id: 'reviewProgress', label: 'Review Progress', category: 'workflow', required: false, description: 'Review completion percentage' },
      { id: 'reviewStages', label: 'Review Stages', category: 'workflow', required: false, description: 'Completed review stages' },
      { id: 'lastReviewedAt', label: 'Last Reviewed', category: 'workflow', required: false, description: 'Last review date' }
    ];
  }

  /**
   * Export to PDF format
   */
  private static async exportToPDF(
    trade: EnhancedTrade, 
    options: TradeReviewExportOptions
  ): Promise<Blob> {
    // For now, create a simple HTML-to-PDF conversion
    // In production, you'd use a library like jsPDF or Puppeteer
    const htmlContent = this.generatePDFHTML(trade, options);
    
    // Create a simple PDF-like blob (in reality, this would be actual PDF generation)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return blob;
  }

  /**
   * Export multiple trades to PDF
   */
  private static async exportMultipleTradesToPDF(
    trades: EnhancedTrade[], 
    options: TradeReviewExportOptions
  ): Promise<Blob> {
    const htmlContent = trades.map(trade => this.generatePDFHTML(trade, options)).join('\n<div style="page-break-before: always;"></div>\n');
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return blob;
  }

  /**
   * Generate HTML content for PDF
   */
  private static generatePDFHTML(trade: EnhancedTrade, options: TradeReviewExportOptions): string {
    const reportData = this.generateTradeReport(trade);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trade Report - ${trade.currencyPair} - ${trade.date}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .trade-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .metric { background: #f5f5f5; padding: 10px; border-radius: 5px; }
          .metric-label { font-weight: bold; color: #666; }
          .metric-value { font-size: 1.2em; color: #333; }
          .notes-section { background: #f9f9f9; padding: 15px; border-radius: 5px; }
          .chart-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
          .chart-item { background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center; }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Trade Review Report</h1>
          <p><strong>Trade ID:</strong> ${trade.id}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        ${options.includeBasicTradeData ? `
        <div class="section">
          <h2>Trade Summary</h2>
          <div class="trade-summary">
            <div class="metric">
              <div class="metric-label">Currency Pair</div>
              <div class="metric-value">${trade.currencyPair}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Date</div>
              <div class="metric-value">${trade.date}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Side</div>
              <div class="metric-value">${trade.side.toUpperCase()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Entry Price</div>
              <div class="metric-value">${trade.entryPrice}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Exit Price</div>
              <div class="metric-value">${trade.exitPrice || 'N/A'}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Lot Size</div>
              <div class="metric-value">${trade.lotSize}</div>
            </div>
            <div class="metric">
              <div class="metric-label">P&L</div>
              <div class="metric-value">${trade.pnl || 'N/A'}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Status</div>
              <div class="metric-value">${trade.status.toUpperCase()}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${options.includePerformanceMetrics && reportData.performanceMetrics ? `
        <div class="section">
          <h2>Performance Metrics</h2>
          <div class="trade-summary">
            <div class="metric">
              <div class="metric-label">R-Multiple</div>
              <div class="metric-value">${reportData.performanceMetrics.rMultiple.toFixed(2)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Return %</div>
              <div class="metric-value">${reportData.performanceMetrics.returnPercentage.toFixed(2)}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Risk/Reward</div>
              <div class="metric-value">${reportData.performanceMetrics.riskRewardRatio.toFixed(2)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Hold Duration</div>
              <div class="metric-value">${reportData.performanceMetrics.holdDuration} hours</div>
            </div>
            <div class="metric">
              <div class="metric-label">Efficiency</div>
              <div class="metric-value">${reportData.performanceMetrics.efficiency.toFixed(2)}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${options.includeNotes && reportData.notes ? `
        <div class="section">
          <h2>Trade Notes</h2>
          ${reportData.notes.preTradeAnalysis ? `
          <div class="notes-section">
            <h3>Pre-Trade Analysis</h3>
            <p>${reportData.notes.preTradeAnalysis}</p>
          </div>
          ` : ''}
          ${reportData.notes.executionNotes ? `
          <div class="notes-section">
            <h3>Execution Notes</h3>
            <p>${reportData.notes.executionNotes}</p>
          </div>
          ` : ''}
          ${reportData.notes.postTradeReflection ? `
          <div class="notes-section">
            <h3>Post-Trade Reflection</h3>
            <p>${reportData.notes.postTradeReflection}</p>
          </div>
          ` : ''}
          ${reportData.notes.lessonsLearned ? `
          <div class="notes-section">
            <h3>Lessons Learned</h3>
            <p>${reportData.notes.lessonsLearned}</p>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${options.includeCharts && reportData.charts && reportData.charts.length > 0 ? `
        <div class="section">
          <h2>Charts (${reportData.charts.length})</h2>
          <div class="chart-list">
            ${reportData.charts.map(chart => `
            <div class="chart-item">
              <strong>${chart.type.replace('_', ' ').toUpperCase()}</strong><br>
              <small>${chart.timeframe}</small><br>
              <small>Uploaded: ${new Date(chart.uploadedAt).toLocaleDateString()}</small>
              ${chart.description ? `<br><em>${chart.description}</em>` : ''}
            </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${options.includeReviewWorkflow && reportData.reviewWorkflow ? `
        <div class="section">
          <h2>Review Workflow</h2>
          <p><strong>Overall Progress:</strong> ${reportData.reviewWorkflow.overallProgress}%</p>
          <p><strong>Started:</strong> ${new Date(reportData.reviewWorkflow.startedAt).toLocaleString()}</p>
          ${reportData.reviewWorkflow.completedAt ? `<p><strong>Completed:</strong> ${new Date(reportData.reviewWorkflow.completedAt).toLocaleString()}</p>` : ''}
          
          <h3>Review Stages</h3>
          ${reportData.reviewWorkflow.stages.map(stage => `
          <div class="metric">
            <div class="metric-label">${stage.name} ${stage.completed ? '✓' : '○'}</div>
            <div class="metric-value">${stage.description}</div>
            ${stage.notes ? `<small>${stage.notes}</small>` : ''}
          </div>
          `).join('')}
        </div>
        ` : ''}
      </body>
      </html>
    `;
  }

  /**
   * Export to CSV format
   */
  private static exportToCSV(
    trades: EnhancedTrade[], 
    options: TradeReviewExportOptions
  ): Blob {
    const headers = this.buildCSVHeaders(options);
    const rows = trades.map(trade => this.tradeToCSVRow(trade, options));
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  /**
   * Export to JSON format
   */
  private static exportToJSON(
    trades: EnhancedTrade[], 
    options: TradeReviewExportOptions
  ): Blob {
    const exportData = {
      exportedAt: new Date().toISOString(),
      options,
      totalTrades: trades.length,
      trades: trades.map(trade => this.tradeToJSONObject(trade, options))
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    return new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  }

  /**
   * Build CSV headers based on options
   */
  private static buildCSVHeaders(options: TradeReviewExportOptions): string[] {
    const headers: string[] = [];
    
    if (options.includeBasicTradeData) {
      headers.push(
        'Trade ID', 'Currency Pair', 'Date', 'Time In', 'Time Out', 'Side',
        'Entry Price', 'Exit Price', 'Lot Size', 'P&L', 'Commission', 'Status'
      );
    }
    
    if (options.includePerformanceMetrics) {
      headers.push(
        'R-Multiple', 'Return %', 'Risk/Reward Ratio', 'Hold Duration', 'Efficiency'
      );
    }
    
    if (options.includeNotes) {
      headers.push(
        'Pre-Trade Analysis', 'Execution Notes', 'Post-Trade Reflection', 'Lessons Learned'
      );
    }
    
    if (options.includeCharts) {
      headers.push('Chart Count', 'Chart Types');
    }
    
    if (options.includeReviewWorkflow) {
      headers.push('Review Progress %', 'Review Completed', 'Last Reviewed');
    }
    
    return headers;
  }

  /**
   * Convert trade to CSV row
   */
  private static tradeToCSVRow(trade: EnhancedTrade, options: TradeReviewExportOptions): string[] {
    const row: string[] = [];
    
    if (options.includeBasicTradeData) {
      row.push(
        this.escapeCSV(trade.id),
        this.escapeCSV(trade.currencyPair),
        this.escapeCSV(trade.date),
        this.escapeCSV(trade.timeIn),
        this.escapeCSV(trade.timeOut || ''),
        this.escapeCSV(trade.side),
        trade.entryPrice.toString(),
        (trade.exitPrice || '').toString(),
        trade.lotSize.toString(),
        (trade.pnl || '').toString(),
        trade.commission.toString(),
        this.escapeCSV(trade.status)
      );
    }
    
    if (options.includePerformanceMetrics) {
      const metrics = trade.reviewData?.performanceMetrics;
      row.push(
        (metrics?.rMultiple || '').toString(),
        (metrics?.returnPercentage || '').toString(),
        (metrics?.riskRewardRatio || '').toString(),
        (metrics?.holdDuration || '').toString(),
        (metrics?.efficiency || '').toString()
      );
    }
    
    if (options.includeNotes) {
      const notes = trade.reviewData?.notes;
      row.push(
        this.escapeCSV(notes?.preTradeAnalysis || ''),
        this.escapeCSV(notes?.executionNotes || ''),
        this.escapeCSV(notes?.postTradeReflection || ''),
        this.escapeCSV(notes?.lessonsLearned || '')
      );
    }
    
    if (options.includeCharts) {
      const charts = trade.reviewData?.charts || [];
      row.push(
        charts.length.toString(),
        this.escapeCSV(charts.map(c => c.type).join('; '))
      );
    }
    
    if (options.includeReviewWorkflow) {
      const workflow = trade.reviewData?.reviewWorkflow;
      row.push(
        (workflow?.overallProgress || '').toString(),
        workflow?.completedAt ? 'Yes' : 'No',
        this.escapeCSV(trade.reviewData?.lastReviewedAt || '')
      );
    }
    
    return row;
  }

  /**
   * Convert trade to JSON object
   */
  private static tradeToJSONObject(trade: EnhancedTrade, options: TradeReviewExportOptions): any {
    const obj: any = {};
    
    if (options.includeBasicTradeData) {
      obj.basicData = {
        id: trade.id,
        currencyPair: trade.currencyPair,
        date: trade.date,
        timeIn: trade.timeIn,
        timeOut: trade.timeOut,
        side: trade.side,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        lotSize: trade.lotSize,
        pnl: trade.pnl,
        commission: trade.commission,
        status: trade.status
      };
    }
    
    if (options.includePerformanceMetrics && trade.reviewData?.performanceMetrics) {
      obj.performanceMetrics = trade.reviewData.performanceMetrics;
    }
    
    if (options.includeNotes && trade.reviewData?.notes) {
      obj.notes = trade.reviewData.notes;
    }
    
    if (options.includeCharts && trade.reviewData?.charts) {
      obj.charts = trade.reviewData.charts;
    }
    
    if (options.includeReviewWorkflow && trade.reviewData?.reviewWorkflow) {
      obj.reviewWorkflow = trade.reviewData.reviewWorkflow;
    }
    
    return obj;
  }

  /**
   * Filter trades based on options
   */
  private static filterTrades(trades: EnhancedTrade[], options: TradeReviewExportOptions): EnhancedTrade[] {
    let filtered = [...trades];
    
    // Date range filter
    if (options.dateRange) {
      const startDate = new Date(options.dateRange.start);
      const endDate = new Date(options.dateRange.end);
      
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= startDate && tradeDate <= endDate;
      });
    }
    
    // Tag filter
    if (options.tagFilter && options.tagFilter.length > 0) {
      filtered = filtered.filter(trade => 
        trade.tags && trade.tags.some(tag => options.tagFilter!.includes(tag))
      );
    }
    
    // Status filter
    if (options.statusFilter && options.statusFilter.length > 0) {
      filtered = filtered.filter(trade => 
        options.statusFilter!.includes(trade.status)
      );
    }
    
    return filtered;
  }

  /**
   * Escape CSV values
   */
  private static escapeCSV(value: string): string {
    if (typeof value !== 'string') {
      return '';
    }
    
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }

  /**
   * Generate unique share ID
   */
  private static generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stored shared reports
   */
  private static getStoredReports(): Record<string, ShareableReport> {
    const stored = localStorage.getItem('tradeReviewSharedReports');
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Download export file
   */
  static downloadExport(
    blob: Blob, 
    filename: string, 
    format: ExportFormat
  ): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const extension = format === 'pdf' ? 'html' : format; // PDF is HTML for now
    const defaultFilename = `trade-review-export-${new Date().toISOString().split('T')[0]}.${extension}`;
    link.download = filename || defaultFilename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get default export options
   */
  static getDefaultExportOptions(): TradeReviewExportOptions {
    return {
      format: 'pdf',
      includeNotes: true,
      includeCharts: true,
      includePerformanceMetrics: true,
      includeReviewWorkflow: true,
      includeBasicTradeData: true
    };
  }

  /**
   * Validate export options
   */
  static validateExportOptions(options: TradeReviewExportOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!['pdf', 'csv', 'json'].includes(options.format)) {
      errors.push('Invalid export format. Must be "pdf", "csv", or "json".');
    }
    
    if (options.dateRange) {
      const startDate = new Date(options.dateRange.start);
      const endDate = new Date(options.dateRange.end);
      
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date in date range.');
      }
      
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date in date range.');
      }
      
      if (startDate > endDate) {
        errors.push('Start date must be before end date.');
      }
    }
    
    const hasAnyInclude = options.includeBasicTradeData || 
                         options.includeNotes || 
                         options.includeCharts || 
                         options.includePerformanceMetrics || 
                         options.includeReviewWorkflow;
    
    if (!hasAnyInclude) {
      errors.push('At least one data category must be included in the export.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
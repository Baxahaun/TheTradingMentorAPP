import { Trade, TradeSetup, TradePattern, PartialClose, PositionEvent, SetupType, PatternType } from '../types/trade';

export interface ExportOptions {
  format: 'csv' | 'excel';
  includeSetupData: boolean;
  includePatternData: boolean;
  includePartialCloses: boolean;
  includePositionHistory: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  setupTypeFilter?: SetupType[];
  patternTypeFilter?: PatternType[];
  statusFilter?: ('open' | 'closed')[];
}

export interface ExportData {
  trades: Trade[];
  metadata: {
    exportDate: string;
    totalTrades: number;
    dateRange?: {
      start: string;
      end: string;
    };
    filters: {
      setupTypes?: SetupType[];
      patternTypes?: PatternType[];
      status?: ('open' | 'closed')[];
    };
  };
}

/**
 * Enhanced Export Service for Trade Data
 * Handles CSV and Excel export with support for setup classification,
 * pattern recognition, and partial close tracking data
 */
export class ExportService {
  
  /**
   * Export trades to CSV format with enhanced data fields
   */
  static exportToCSV(trades: Trade[], options: ExportOptions): string {
    const filteredTrades = this.filterTrades(trades, options);
    
    // Build CSV headers based on options
    const headers = this.buildCSVHeaders(options);
    
    // Convert trades to CSV rows
    const rows = filteredTrades.map(trade => this.tradeToCSVRow(trade, options));
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    return csvContent;
  }

  /**
   * Export trades to Excel-compatible CSV format
   */
  static exportToExcel(trades: Trade[], options: ExportOptions): string {
    // Excel CSV is similar to regular CSV but with some formatting differences
    const csvContent = this.exportToCSV(trades, options);
    
    // Add BOM for proper Excel UTF-8 handling
    return '\uFEFF' + csvContent;
  }

  /**
   * Download exported data as file
   */
  static downloadExport(trades: Trade[], options: ExportOptions, filename?: string): void {
    const content = options.format === 'excel' 
      ? this.exportToExcel(trades, options)
      : this.exportToCSV(trades, options);
    
    const blob = new Blob([content], { 
      type: options.format === 'excel' 
        ? 'application/vnd.ms-excel;charset=utf-8' 
        : 'text/csv;charset=utf-8' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const defaultFilename = `trades-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.download = filename || defaultFilename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Filter trades based on export options
   */
  private static filterTrades(trades: Trade[], options: ExportOptions): Trade[] {
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

    // Setup type filter
    if (options.setupTypeFilter && options.setupTypeFilter.length > 0) {
      filtered = filtered.filter(trade => 
        trade.setup && options.setupTypeFilter!.includes(trade.setup.type)
      );
    }

    // Pattern type filter
    if (options.patternTypeFilter && options.patternTypeFilter.length > 0) {
      filtered = filtered.filter(trade => 
        trade.patterns && trade.patterns.some(pattern => 
          options.patternTypeFilter!.includes(pattern.type)
        )
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
   * Build CSV headers based on export options
   */
  private static buildCSVHeaders(options: ExportOptions): string[] {
    const baseHeaders = [
      'Trade ID',
      'Account ID',
      'Currency Pair',
      'Date',
      'Time In',
      'Time Out',
      'Session',
      'Side',
      'Entry Price',
      'Exit Price',
      'Spread',
      'Lot Size',
      'Lot Type',
      'Units',
      'Stop Loss',
      'Take Profit',
      'Risk Amount',
      'R Multiple',
      'Leverage',
      'Margin Used',
      'Pips',
      'Pip Value',
      'PnL',
      'Commission',
      'Swap',
      'Account Currency',
      'Strategy',
      'Market Conditions',
      'Timeframe',
      'Confidence',
      'Emotions',
      'Notes',
      'Status'
    ];

    const enhancedHeaders: string[] = [];

    // Setup classification headers
    if (options.includeSetupData) {
      enhancedHeaders.push(
        'Setup Type',
        'Setup Sub Type',
        'Setup Quality',
        'Setup Market Condition',
        'Setup Timeframe',
        'Setup Confluence Factors',
        'Setup Notes',
        'Custom Setup Name'
      );
    }

    // Pattern recognition headers
    if (options.includePatternData) {
      enhancedHeaders.push(
        'Pattern Types',
        'Pattern Timeframes',
        'Pattern Qualities',
        'Pattern Confluence',
        'Pattern Descriptions'
      );
    }

    // Partial close tracking headers
    if (options.includePartialCloses) {
      enhancedHeaders.push(
        'Partial Closes Count',
        'Partial Close Details',
        'Total Realized PnL',
        'Position Management Score'
      );
    }

    // Position history headers
    if (options.includePositionHistory) {
      enhancedHeaders.push(
        'Position Events Count',
        'Position Timeline',
        'Average Entry Price',
        'Final Position Size'
      );
    }

    return [...baseHeaders, ...enhancedHeaders];
  }

  /**
   * Convert a trade to CSV row
   */
  private static tradeToCSVRow(trade: Trade, options: ExportOptions): string[] {
    const baseRow = [
      this.escapeCSV(trade.id),
      this.escapeCSV(trade.accountId),
      this.escapeCSV(trade.currencyPair),
      this.escapeCSV(trade.date),
      this.escapeCSV(trade.timeIn),
      this.escapeCSV(trade.timeOut || ''),
      this.escapeCSV(trade.session || ''),
      this.escapeCSV(trade.side),
      trade.entryPrice.toString(),
      (trade.exitPrice || '').toString(),
      (trade.spread || '').toString(),
      trade.lotSize.toString(),
      this.escapeCSV(trade.lotType),
      trade.units.toString(),
      (trade.stopLoss || '').toString(),
      (trade.takeProfit || '').toString(),
      (trade.riskAmount || '').toString(),
      (trade.rMultiple || '').toString(),
      (trade.leverage || '').toString(),
      (trade.marginUsed || '').toString(),
      (trade.pips || '').toString(),
      (trade.pipValue || '').toString(),
      (trade.pnl || '').toString(),
      trade.commission.toString(),
      (trade.swap || '').toString(),
      this.escapeCSV(trade.accountCurrency),
      this.escapeCSV(trade.strategy || ''),
      this.escapeCSV(trade.marketConditions || ''),
      this.escapeCSV(trade.timeframe || ''),
      (trade.confidence || '').toString(),
      this.escapeCSV(trade.emotions || ''),
      this.escapeCSV(trade.notes || ''),
      this.escapeCSV(trade.status)
    ];

    const enhancedRow: string[] = [];

    // Setup classification data
    if (options.includeSetupData) {
      const setup = trade.setup;
      enhancedRow.push(
        this.escapeCSV(setup?.type || ''),
        this.escapeCSV(setup?.subType || ''),
        (setup?.quality || '').toString(),
        this.escapeCSV(setup?.marketCondition || ''),
        this.escapeCSV(setup?.timeframe || ''),
        this.escapeCSV(setup?.confluence?.map(c => c.name).join('; ') || ''),
        this.escapeCSV(setup?.notes || ''),
        this.escapeCSV(setup?.customSetup?.name || '')
      );
    }

    // Pattern recognition data
    if (options.includePatternData) {
      const patterns = trade.patterns || [];
      enhancedRow.push(
        this.escapeCSV(patterns.map(p => p.type).join('; ')),
        this.escapeCSV(patterns.map(p => p.timeframe).join('; ')),
        this.escapeCSV(patterns.map(p => p.quality.toString()).join('; ')),
        this.escapeCSV(patterns.map(p => p.confluence ? 'Yes' : 'No').join('; ')),
        this.escapeCSV(patterns.map(p => p.description || '').join('; '))
      );
    }

    // Partial close tracking data
    if (options.includePartialCloses) {
      const partialCloses = trade.partialCloses || [];
      const totalRealized = partialCloses.reduce((sum, pc) => sum + pc.pnlRealized, 0);
      
      enhancedRow.push(
        partialCloses.length.toString(),
        this.escapeCSV(partialCloses.map(pc => 
          `${pc.timestamp}:${pc.lotSize}@${pc.price}(${pc.reason})`
        ).join('; ')),
        totalRealized.toString(),
        (trade.positionManagementScore || '').toString()
      );
    }

    // Position history data
    if (options.includePositionHistory) {
      const positionHistory = trade.positionHistory || [];
      const avgEntryPrice = positionHistory.length > 0 
        ? positionHistory[positionHistory.length - 1].averagePrice 
        : trade.entryPrice;
      const finalPositionSize = positionHistory.length > 0
        ? positionHistory[positionHistory.length - 1].totalPosition
        : trade.lotSize;

      enhancedRow.push(
        positionHistory.length.toString(),
        this.escapeCSV(positionHistory.map(pe => 
          `${pe.timestamp}:${pe.type}:${pe.lotSize}@${pe.price}`
        ).join('; ')),
        avgEntryPrice.toString(),
        finalPositionSize.toString()
      );
    }

    return [...baseRow, ...enhancedRow];
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private static escapeCSV(value: string): string {
    if (typeof value !== 'string') {
      return '';
    }
    
    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }

  /**
   * Get export metadata for the given trades and options
   */
  static getExportMetadata(trades: Trade[], options: ExportOptions): ExportData['metadata'] {
    const filteredTrades = this.filterTrades(trades, options);
    
    return {
      exportDate: new Date().toISOString(),
      totalTrades: filteredTrades.length,
      dateRange: options.dateRange,
      filters: {
        setupTypes: options.setupTypeFilter,
        patternTypes: options.patternTypeFilter,
        status: options.statusFilter
      }
    };
  }

  /**
   * Create default export options
   */
  static getDefaultExportOptions(): ExportOptions {
    return {
      format: 'csv',
      includeSetupData: true,
      includePatternData: true,
      includePartialCloses: true,
      includePositionHistory: true
    };
  }

  /**
   * Validate export options
   */
  static validateExportOptions(options: ExportOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!['csv', 'excel'].includes(options.format)) {
      errors.push('Invalid export format. Must be "csv" or "excel".');
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
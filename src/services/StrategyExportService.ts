import { ProfessionalStrategy, StrategyPerformance } from '../types/strategy';
import { Trade } from '../types/trade';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeCharts?: boolean;
  anonymize?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  template?: ReportTemplate;
}

export interface ReportTemplate {
  id: string;
  name: string;
  sections: ReportSection[];
  styling: ReportStyling;
}

export interface ReportSection {
  type: 'summary' | 'performance' | 'trades' | 'charts' | 'insights';
  title: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface ReportStyling {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  includeHeader: boolean;
  includeFooter: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename: string;
  error?: string;
}

export class StrategyExportService {
  private defaultTemplate: ReportTemplate = {
    id: 'default',
    name: 'Standard Strategy Report',
    sections: [
      { type: 'summary', title: 'Strategy Summary', enabled: true },
      { type: 'performance', title: 'Performance Metrics', enabled: true },
      { type: 'trades', title: 'Trade History', enabled: true },
      { type: 'charts', title: 'Performance Charts', enabled: true },
      { type: 'insights', title: 'AI Insights', enabled: false }
    ],
    styling: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'Arial',
      fontSize: 12,
      includeHeader: true,
      includeFooter: true
    }
  };

  /**
   * Export strategy performance report as PDF
   */
  async exportToPDF(
    strategy: ProfessionalStrategy,
    trades: Trade[],
    options: ExportOptions = { format: 'pdf' }
  ): Promise<ExportResult> {
    try {
      const template = options.template || this.defaultTemplate;
      const doc = new jsPDF();
      
      // Apply anonymization if requested
      const processedStrategy = options.anonymize ? this.anonymizeStrategy(strategy) : strategy;
      const processedTrades = options.anonymize ? this.anonymizeTrades(trades) : trades;
      
      // Filter trades by date range if specified
      const filteredTrades = options.dateRange 
        ? this.filterTradesByDateRange(processedTrades, options.dateRange)
        : processedTrades;

      let yPosition = 20;

      // Add header
      if (template.styling.includeHeader) {
        yPosition = this.addPDFHeader(doc, processedStrategy, template.styling, yPosition);
      }

      // Add sections based on template
      for (const section of template.sections.filter(s => s.enabled)) {
        yPosition = await this.addPDFSection(
          doc, 
          section, 
          processedStrategy, 
          filteredTrades, 
          template.styling, 
          yPosition
        );
      }

      // Add footer
      if (template.styling.includeFooter) {
        this.addPDFFooter(doc, template.styling);
      }

      const filename = this.generateFilename(processedStrategy, 'pdf');
      const pdfBlob = doc.output('blob');

      return {
        success: true,
        data: pdfBlob,
        filename
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
   * Export strategy data as CSV
   */
  async exportToCSV(
    strategy: ProfessionalStrategy,
    trades: Trade[],
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      const processedStrategy = options.anonymize ? this.anonymizeStrategy(strategy) : strategy;
      const processedTrades = options.anonymize ? this.anonymizeTrades(trades) : trades;
      
      const filteredTrades = options.dateRange 
        ? this.filterTradesByDateRange(processedTrades, options.dateRange)
        : processedTrades;

      const csvContent = this.generateCSVContent(processedStrategy, filteredTrades);
      const filename = this.generateFilename(processedStrategy, 'csv');

      return {
        success: true,
        data: csvContent,
        filename
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
   * Generate printable strategy summary
   */
  async generatePrintableSummary(
    strategy: ProfessionalStrategy,
    trades: Trade[],
    options: ExportOptions = { format: 'pdf' }
  ): Promise<ExportResult> {
    try {
      const summaryTemplate: ReportTemplate = {
        ...this.defaultTemplate,
        name: 'Printable Summary',
        sections: [
          { type: 'summary', title: 'Strategy Overview', enabled: true },
          { type: 'performance', title: 'Key Metrics', enabled: true }
        ]
      };

      return this.exportToPDF(strategy, trades, {
        ...options,
        template: summaryTemplate,
        includeCharts: false
      });
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create anonymized version of strategy for secure sharing
   */
  private anonymizeStrategy(strategy: ProfessionalStrategy): ProfessionalStrategy {
    return {
      ...strategy,
      id: 'anonymized-strategy',
      title: 'Strategy A',
      description: 'Anonymized strategy description',
      performance: this.anonymizePerformance(strategy.performance)
    };
  }

  /**
   * Anonymize performance data by removing absolute dollar amounts
   */
  private anonymizePerformance(performance: StrategyPerformance): StrategyPerformance {
    return {
      ...performance,
      // Keep ratios and percentages, remove absolute values
      averageWin: 0,
      averageLoss: 0,
      maxDrawdown: performance.maxDrawdown, // Keep as percentage
      monthlyReturns: performance.monthlyReturns.map(mr => ({
        ...mr,
        return: mr.return // Keep as percentage
      }))
    };
  }

  /**
   * Anonymize trade data
   */
  private anonymizeTrades(trades: Trade[]): Trade[] {
    return trades.map((trade, index) => ({
      ...trade,
      id: `trade-${index + 1}`,
      currencyPair: `SYMBOL${index % 10 + 1}`,
      // Remove absolute dollar amounts, keep percentages
      entryPrice: 0,
      exitPrice: 0,
      lotSize: 0,
      pnl: 0
    }));
  }

  /**
   * Filter trades by date range
   */
  private filterTradesByDateRange(
    trades: Trade[], 
    dateRange: { start: Date; end: Date }
  ): Trade[] {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= dateRange.start && tradeDate <= dateRange.end;
    });
  }

  /**
   * Add header to PDF document
   */
  private addPDFHeader(
    doc: jsPDF, 
    strategy: ProfessionalStrategy, 
    styling: ReportStyling, 
    yPosition: number
  ): number {
    doc.setFontSize(18);
    doc.setTextColor(styling.primaryColor);
    doc.text(`Strategy Report: ${strategy.title}`, 20, yPosition);
    
    doc.setFontSize(12);
    doc.setTextColor('#000000');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 10);
    
    return yPosition + 25;
  }

  /**
   * Add section to PDF document
   */
  private async addPDFSection(
    doc: jsPDF,
    section: ReportSection,
    strategy: ProfessionalStrategy,
    trades: Trade[],
    styling: ReportStyling,
    yPosition: number
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
        yPosition = this.addStrategySummaryToPDF(doc, strategy, yPosition);
        break;
      case 'performance':
        yPosition = this.addPerformanceMetricsToPDF(doc, strategy.performance, yPosition);
        break;
      case 'trades':
        yPosition = this.addTradesToPDF(doc, trades, yPosition);
        break;
      case 'charts':
        // Charts would require additional chart generation library
        doc.setFontSize(10);
        doc.text('Charts section - requires chart generation implementation', 20, yPosition);
        yPosition += 10;
        break;
      case 'insights':
        doc.setFontSize(10);
        doc.text('AI Insights section - requires insights data', 20, yPosition);
        yPosition += 10;
        break;
    }

    return yPosition + 10;
  }

  /**
   * Add strategy summary to PDF
   */
  private addStrategySummaryToPDF(
    doc: jsPDF, 
    strategy: ProfessionalStrategy, 
    yPosition: number
  ): number {
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    
    const summaryData = [
      ['Methodology', strategy.methodology],
      ['Primary Timeframe', strategy.primaryTimeframe],
      ['Asset Classes', strategy.assetClasses.join(', ')],
      ['Risk per Trade', `${strategy.riskManagement.maxRiskPerTrade}%`],
      ['Risk-Reward Ratio', `1:${strategy.riskManagement.riskRewardRatio}`],
      ['Position Sizing', strategy.riskManagement.positionSizingMethod.type]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Property', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 9 }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Add performance metrics to PDF
   */
  private addPerformanceMetricsToPDF(
    doc: jsPDF, 
    performance: StrategyPerformance, 
    yPosition: number
  ): number {
    const metricsData = [
      ['Total Trades', performance.totalTrades.toString()],
      ['Win Rate', `${(performance.winRate * 100).toFixed(1)}%`],
      ['Profit Factor', performance.profitFactor.toFixed(2)],
      ['Expectancy', performance.expectancy.toFixed(2)],
      ['Sharpe Ratio', performance.sharpeRatio?.toFixed(2) || 'N/A'],
      ['Max Drawdown', `${(performance.maxDrawdown * 100).toFixed(1)}%`],
      ['Statistical Significance', performance.statisticallySignificant ? 'Yes' : 'No']
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'grid',
      styles: { fontSize: 9 }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Add trades table to PDF
   */
  private addTradesToPDF(doc: jsPDF, trades: Trade[], yPosition: number): number {
    const tradesData = trades.slice(0, 20).map(trade => [
      new Date(trade.date).toLocaleDateString(),
      trade.currencyPair,
      trade.side,
      trade.lotSize.toString(),
      trade.entryPrice.toFixed(2),
      trade.exitPrice?.toFixed(2) || 'Open',
      trade.pnl?.toFixed(2) || 'N/A'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Date', 'Currency Pair', 'Side', 'Lot Size', 'Entry', 'Exit', 'P&L']],
      body: tradesData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Add footer to PDF
   */
  private addPDFFooter(doc: jsPDF, styling: ReportStyling): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(styling.secondaryColor);
      doc.text(
        `Page ${i} of ${pageCount}`, 
        doc.internal.pageSize.width - 30, 
        doc.internal.pageSize.height - 10
      );
    }
  }

  /**
   * Generate CSV content
   */
  private generateCSVContent(strategy: ProfessionalStrategy, trades: Trade[]): string {
    const headers = [
      'Date',
      'Currency Pair',
      'Side',
      'Lot Size',
      'Entry Price',
      'Exit Price',
      'P&L',
      'Strategy',
      'Methodology',
      'Timeframe'
    ];

    const rows = trades.map(trade => [
      new Date(trade.date).toISOString().split('T')[0],
      trade.currencyPair,
      trade.side,
      trade.lotSize.toString(),
      trade.entryPrice.toString(),
      trade.exitPrice?.toString() || '',
      trade.pnl?.toString() || '',
      strategy.title,
      strategy.methodology,
      strategy.primaryTimeframe
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Generate filename for export
   */
  private generateFilename(strategy: ProfessionalStrategy, format: string): string {
    const sanitizedTitle = strategy.title.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `strategy_${sanitizedTitle}_${timestamp}.${format}`;
  }

  /**
   * Get available report templates
   */
  getAvailableTemplates(): ReportTemplate[] {
    return [
      this.defaultTemplate,
      {
        id: 'summary',
        name: 'Executive Summary',
        sections: [
          { type: 'summary', title: 'Strategy Overview', enabled: true },
          { type: 'performance', title: 'Key Performance Indicators', enabled: true }
        ],
        styling: this.defaultTemplate.styling
      },
      {
        id: 'detailed',
        name: 'Detailed Analysis',
        sections: [
          { type: 'summary', title: 'Strategy Details', enabled: true },
          { type: 'performance', title: 'Performance Analysis', enabled: true },
          { type: 'trades', title: 'Complete Trade History', enabled: true },
          { type: 'charts', title: 'Performance Visualization', enabled: true },
          { type: 'insights', title: 'AI-Generated Insights', enabled: true }
        ],
        styling: this.defaultTemplate.styling
      }
    ];
  }

  /**
   * Create custom report template
   */
  createCustomTemplate(
    name: string,
    sections: ReportSection[],
    styling?: Partial<ReportStyling>
  ): ReportTemplate {
    return {
      id: `custom_${Date.now()}`,
      name,
      sections,
      styling: { ...this.defaultTemplate.styling, ...styling }
    };
  }
}
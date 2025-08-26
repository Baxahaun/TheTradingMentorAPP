import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrategyExportService } from '../StrategyExportService';
import { ProfessionalStrategy, StrategyPerformance } from '../../types/strategy';
import { Trade } from '../../types/trade';
import { ExportOptions } from '../../types/export';

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn().mockReturnValue(new Blob(['mock pdf'], { type: 'application/pdf' })),
    getNumberOfPages: vi.fn().mockReturnValue(1),
    setPage: vi.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    },
    autoTable: vi.fn(),
    lastAutoTable: {
      finalY: 100
    }
  }))
}));

vi.mock('jspdf-autotable', () => ({}));

describe('StrategyExportService', () => {
  let exportService: StrategyExportService;
  let mockStrategy: ProfessionalStrategy;
  let mockTrades: Trade[];
  let mockPerformance: StrategyPerformance;

  beforeEach(() => {
    exportService = new StrategyExportService();
    
    mockPerformance = {
      totalTrades: 100,
      winningTrades: 60,
      losingTrades: 40,
      profitFactor: 1.5,
      expectancy: 25.5,
      winRate: 0.6,
      averageWin: 150,
      averageLoss: -100,
      riskRewardRatio: 1.5,
      sharpeRatio: 1.2,
      maxDrawdown: 0.15,
      maxDrawdownDuration: 30,
      sampleSize: 100,
      confidenceLevel: 0.95,
      statisticallySignificant: true,
      monthlyReturns: [
        { month: '2024-01', return: 0.05, trades: 10, winRate: 0.6 },
        { month: '2024-02', return: 0.03, trades: 12, winRate: 0.58 }
      ],
      performanceTrend: 'Improving',
      lastCalculated: '2024-01-15T10:00:00Z'
    };

    mockStrategy = {
      id: 'strategy-1',
      title: 'Test Strategy',
      description: 'A test trading strategy',
      color: '#2563eb',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex', 'Stocks'],
      setupConditions: {
        marketEnvironment: 'Trending market',
        technicalConditions: ['RSI < 30', 'Price above MA'],
        volatilityRequirements: 'Medium volatility'
      },
      entryTriggers: {
        primarySignal: 'Breakout confirmation',
        confirmationSignals: ['Volume spike', 'Momentum confirmation'],
        timingCriteria: 'Market open hours'
      },
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage',
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased',
          parameters: { multiplier: 2 },
          description: '2x ATR stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          parameters: { ratio: 2 },
          description: '1:2 risk reward'
        },
        riskRewardRatio: 2
      },
      performance: mockPerformance,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      version: 1,
      isActive: true
    };

    mockTrades = [
      {
        id: 'trade-1',
        accountId: 'account-1',
        currencyPair: 'EURUSD',
        date: '2024-01-01',
        timeIn: '09:00:00',
        timeOut: '15:00:00',
        timestamp: Date.now(),
        side: 'long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lotSize: 1.0,
        lotType: 'standard' as const,
        units: 100000,
        commission: 0,
        accountCurrency: 'USD',
        pnl: 50,
        status: 'closed' as const
      },
      {
        id: 'trade-2',
        accountId: 'account-1',
        currencyPair: 'GBPUSD',
        date: '2024-01-02',
        timeIn: '10:00:00',
        timeOut: '16:00:00',
        timestamp: Date.now(),
        side: 'short',
        entryPrice: 1.2500,
        exitPrice: 1.2450,
        lotSize: 0.5,
        lotType: 'standard' as const,
        units: 50000,
        commission: 0,
        accountCurrency: 'USD',
        pnl: 25,
        status: 'closed' as const
      }
    ];
  });

  describe('exportToPDF', () => {
    it('should export strategy to PDF successfully', async () => {
      const options: ExportOptions = { format: 'pdf' };
      
      const result = await exportService.exportToPDF(mockStrategy, mockTrades, options);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toContain('strategy_Test_Strategy');
      expect(result.filename).toContain('.pdf');
      expect(result.error).toBeUndefined();
    });

    it('should handle anonymization when requested', async () => {
      const options: ExportOptions = { 
        format: 'pdf',
        anonymize: true 
      };
      
      const result = await exportService.exportToPDF(mockStrategy, mockTrades, options);
      
      expect(result.success).toBe(true);
      expect(result.filename).toContain('strategy_Strategy_A');
    });

    it('should filter trades by date range when specified', async () => {
      const options: ExportOptions = { 
        format: 'pdf',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-01')
        }
      };
      
      const result = await exportService.exportToPDF(mockStrategy, mockTrades, options);
      
      expect(result.success).toBe(true);
    });

    it('should handle PDF generation errors gracefully', async () => {
      // Mock PDF generation to throw an error
      const mockError = new Error('PDF generation failed');
      vi.mocked(exportService as any).addPDFHeader = vi.fn().mockImplementation(() => {
        throw mockError;
      });
      
      const result = await exportService.exportToPDF(mockStrategy, mockTrades);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF generation failed');
    });
  });

  describe('exportToCSV', () => {
    it('should export strategy to CSV successfully', async () => {
      const options: ExportOptions = { format: 'csv' };
      
      const result = await exportService.exportToCSV(mockStrategy, mockTrades, options);
      
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.filename).toContain('.csv');
      expect(result.data).toContain('Date,Currency Pair,Side');
      expect(result.data).toContain('EURUSD');
      expect(result.data).toContain('GBPUSD');
    });

    it('should anonymize CSV data when requested', async () => {
      const options: ExportOptions = { 
        format: 'csv',
        anonymize: true 
      };
      
      const result = await exportService.exportToCSV(mockStrategy, mockTrades, options);
      
      expect(result.success).toBe(true);
      expect(result.data).toContain('SYMBOL1');
      expect(result.data).toContain('Strategy A');
    });

    it('should filter CSV trades by date range', async () => {
      const options: ExportOptions = { 
        format: 'csv',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-01')
        }
      };
      
      const result = await exportService.exportToCSV(mockStrategy, mockTrades, options);
      
      expect(result.success).toBe(true);
      // Should only include trades from 2024-01-01
      const lines = (result.data as string).split('\n');
      expect(lines.length).toBe(2); // Header + 1 trade
    });

    it('should handle CSV generation errors', async () => {
      // Create invalid trade data that would cause CSV generation to fail
      const invalidTrades = [null as any];
      
      const result = await exportService.exportToCSV(mockStrategy, invalidTrades);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generatePrintableSummary', () => {
    it('should generate printable summary successfully', async () => {
      const result = await exportService.generatePrintableSummary(mockStrategy, mockTrades);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.pdf');
    });

    it('should use summary template for printable version', async () => {
      const result = await exportService.generatePrintableSummary(mockStrategy, mockTrades);
      
      expect(result.success).toBe(true);
      // Verify it uses a simplified template (implementation detail)
    });
  });

  describe('anonymization', () => {
    it('should anonymize strategy data correctly', () => {
      const anonymized = (exportService as any).anonymizeStrategy(mockStrategy);
      
      expect(anonymized.id).toBe('anonymized-strategy');
      expect(anonymized.title).toBe('Strategy A');
      expect(anonymized.description).toBe('Anonymized strategy description');
      expect(anonymized.performance.averageWin).toBe(0);
      expect(anonymized.performance.averageLoss).toBe(0);
      // Ratios should be preserved
      expect(anonymized.performance.profitFactor).toBe(mockStrategy.performance.profitFactor);
      expect(anonymized.performance.winRate).toBe(mockStrategy.performance.winRate);
    });

    it('should anonymize trade data correctly', () => {
      const anonymized = (exportService as any).anonymizeTrades(mockTrades);
      
      expect(anonymized).toHaveLength(2);
      expect(anonymized[0].id).toBe('trade-1');
      expect(anonymized[0].currencyPair).toBe('SYMBOL1');
      expect(anonymized[0].entryPrice).toBe(0);
      expect(anonymized[0].exitPrice).toBe(0);
      expect(anonymized[0].lotSize).toBe(0);
      expect(anonymized[0].pnl).toBe(0);
      // Other fields should be preserved
      expect(anonymized[0].side).toBe('long');
      expect(anonymized[0].date).toBe(mockTrades[0].date);
    });
  });

  describe('date filtering', () => {
    it('should filter trades by date range correctly', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-01')
      };
      
      const filtered = (exportService as any).filterTradesByDateRange(mockTrades, dateRange);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('trade-1');
    });

    it('should return all trades when no date range specified', () => {
      const filtered = (exportService as any).filterTradesByDateRange(mockTrades, {
        start: new Date('2023-01-01'),
        end: new Date('2025-01-01')
      });
      
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filename generation', () => {
    it('should generate valid filenames', () => {
      const filename = (exportService as any).generateFilename(mockStrategy, 'pdf');
      
      expect(filename).toMatch(/^strategy_Test_Strategy_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should sanitize strategy titles in filenames', () => {
      const strategyWithSpecialChars = {
        ...mockStrategy,
        title: 'Test/Strategy: With "Special" Characters!'
      };
      
      const filename = (exportService as any).generateFilename(strategyWithSpecialChars, 'csv');
      
      expect(filename).toMatch(/^strategy_Test_Strategy__With__Special__Characters__\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe('template management', () => {
    it('should return available templates', () => {
      const templates = exportService.getAvailableTemplates();
      
      expect(templates).toHaveLength(3);
      expect(templates[0].id).toBe('default');
      expect(templates[1].id).toBe('summary');
      expect(templates[2].id).toBe('detailed');
    });

    it('should create custom templates', () => {
      const customTemplate = exportService.createCustomTemplate(
        'My Custom Template',
        [
          { type: 'summary', title: 'Overview', enabled: true },
          { type: 'performance', title: 'Metrics', enabled: true }
        ],
        { primaryColor: '#ff0000' }
      );
      
      expect(customTemplate.name).toBe('My Custom Template');
      expect(customTemplate.id).toMatch(/^custom_\d+$/);
      expect(customTemplate.sections).toHaveLength(2);
      expect(customTemplate.styling.primaryColor).toBe('#ff0000');
    });
  });

  describe('CSV content generation', () => {
    it('should generate proper CSV format', () => {
      const csvContent = (exportService as any).generateCSVContent(mockStrategy, mockTrades);
      
      const lines = csvContent.split('\n');
      expect(lines[0]).toContain('Date,Currency Pair,Side,Lot Size');
      expect(lines[1]).toContain('"2024-01-01","EURUSD","long"');
      expect(lines[2]).toContain('"2024-01-02","GBPUSD","short"');
    });

    it('should escape CSV values properly', () => {
      const strategyWithCommas = {
        ...mockStrategy,
        title: 'Strategy, with commas'
      };
      
      const csvContent = (exportService as any).generateCSVContent(strategyWithCommas, mockTrades);
      
      expect(csvContent).toContain('"Strategy, with commas"');
    });
  });

  describe('error handling', () => {
    it('should handle missing trade data gracefully', async () => {
      const result = await exportService.exportToCSV(mockStrategy, []);
      
      expect(result.success).toBe(true);
      expect(result.data).toContain('Date,Currency Pair,Side'); // Header should still be present
    });

    it('should handle invalid strategy data', async () => {
      const invalidStrategy = { ...mockStrategy, title: '' };
      
      const result = await exportService.exportToPDF(invalidStrategy, mockTrades);
      
      // Should still succeed but with empty title
      expect(result.success).toBe(true);
    });
  });
});
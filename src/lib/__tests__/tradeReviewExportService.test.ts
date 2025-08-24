import { TradeReviewExportService, TradeReviewExportOptions } from '../tradeReviewExportService';
import { EnhancedTrade, TradeReviewData, TradeNotes, PerformanceMetrics, ReviewWorkflow, TradeChart } from '../../types/tradeReview';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock URL.createObjectURL and related functions
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
});

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn(),
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
});

describe('TradeReviewExportService', () => {
  let mockTrade: EnhancedTrade;
  let mockTradeReviewData: TradeReviewData;
  let mockPerformanceMetrics: PerformanceMetrics;
  let mockNotes: TradeNotes;
  let mockCharts: TradeChart[];
  let mockWorkflow: ReviewWorkflow;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPerformanceMetrics = {
      rMultiple: 2.5,
      returnPercentage: 5.2,
      riskRewardRatio: 2.1,
      holdDuration: 24.5,
      efficiency: 85.3,
      sharpeRatio: 1.8,
      maxDrawdown: 2.1
    };

    mockNotes = {
      preTradeAnalysis: 'Strong bullish setup with multiple confirmations',
      executionNotes: 'Entered at market open with good fill',
      postTradeReflection: 'Trade went as planned, good risk management',
      lessonsLearned: 'Patience paid off, stick to the plan',
      generalNotes: 'Overall satisfied with execution',
      lastModified: '2024-01-15T10:30:00Z',
      version: 1
    };

    mockCharts = [
      {
        id: 'chart1',
        url: 'https://example.com/chart1.png',
        type: 'entry',
        timeframe: '1H',
        uploadedAt: '2024-01-15T09:00:00Z',
        description: 'Entry setup chart'
      },
      {
        id: 'chart2',
        url: 'https://example.com/chart2.png',
        type: 'exit',
        timeframe: '1H',
        uploadedAt: '2024-01-15T15:00:00Z',
        description: 'Exit analysis chart'
      }
    ];

    mockWorkflow = {
      tradeId: 'trade123',
      stages: [
        {
          id: 'stage1',
          name: 'Data Verification',
          description: 'Verify all trade data is accurate',
          required: true,
          completed: true,
          completedAt: '2024-01-15T11:00:00Z'
        },
        {
          id: 'stage2',
          name: 'Analysis',
          description: 'Analyze trade performance and outcomes',
          required: true,
          completed: true,
          completedAt: '2024-01-15T12:00:00Z'
        }
      ],
      overallProgress: 100,
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T12:00:00Z'
    };

    mockTradeReviewData = {
      performanceMetrics: mockPerformanceMetrics,
      notes: mockNotes,
      charts: mockCharts,
      reviewWorkflow: mockWorkflow,
      lastReviewedAt: '2024-01-15T12:00:00Z',
      reviewCompletionScore: 95
    };

    mockTrade = {
      id: 'trade123',
      accountId: 'account1',
      currencyPair: 'EUR/USD',
      date: '2024-01-15',
      timeIn: '09:00:00',
      timeOut: '15:00:00',
      side: 'long',
      entryPrice: 1.0850,
      exitPrice: 1.0920,
      lotSize: 1.0,
      lotType: 'standard',
      units: 100000,
      pnl: 700,
      commission: 7,
      accountCurrency: 'USD',
      status: 'closed',
      tags: ['breakout', 'trend-following'],
      reviewData: mockTradeReviewData
    };
  });

  describe('exportTrade', () => {
    it('should export trade to PDF format', async () => {
      const options: TradeReviewExportOptions = {
        format: 'pdf',
        includeBasicTradeData: true,
        includeNotes: true,
        includeCharts: true,
        includePerformanceMetrics: true,
        includeReviewWorkflow: true
      };

      const result = await TradeReviewExportService.exportTrade(mockTrade, options);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/html');
    });

    it('should export trade to CSV format', async () => {
      const options: TradeReviewExportOptions = {
        format: 'csv',
        includeBasicTradeData: true,
        includeNotes: true,
        includeCharts: false,
        includePerformanceMetrics: true,
        includeReviewWorkflow: false
      };

      const result = await TradeReviewExportService.exportTrade(mockTrade, options);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv;charset=utf-8');
    });

    it('should export trade to JSON format', async () => {
      const options: TradeReviewExportOptions = {
        format: 'json',
        includeBasicTradeData: true,
        includeNotes: true,
        includeCharts: true,
        includePerformanceMetrics: true,
        includeReviewWorkflow: true
      };

      const result = await TradeReviewExportService.exportTrade(mockTrade, options);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/json;charset=utf-8');
    });

    it('should throw error for unsupported format', async () => {
      const options: TradeReviewExportOptions = {
        format: 'xml' as any,
        includeBasicTradeData: true,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: false,
        includeReviewWorkflow: false
      };

      await expect(TradeReviewExportService.exportTrade(mockTrade, options))
        .rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('exportTrades', () => {
    it('should export multiple trades to CSV', async () => {
      const trades = [mockTrade, { ...mockTrade, id: 'trade456', currencyPair: 'GBP/USD' }];
      const options: TradeReviewExportOptions = {
        format: 'csv',
        includeBasicTradeData: true,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: true,
        includeReviewWorkflow: false
      };

      const result = await TradeReviewExportService.exportTrades(trades, options);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv;charset=utf-8');
    });

    it('should filter trades by date range', async () => {
      const trades = [
        mockTrade,
        { ...mockTrade, id: 'trade456', date: '2024-01-10' },
        { ...mockTrade, id: 'trade789', date: '2024-01-20' }
      ];
      
      const options: TradeReviewExportOptions = {
        format: 'json',
        includeBasicTradeData: true,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: false,
        includeReviewWorkflow: false,
        dateRange: {
          start: '2024-01-12',
          end: '2024-01-18'
        }
      };

      const result = await TradeReviewExportService.exportTrades(trades, options);
      
      // Read the blob content to verify filtering
      const text = await result.text();
      const data = JSON.parse(text);
      
      expect(data.totalTrades).toBe(1);
      expect(data.trades[0].basicData.id).toBe('trade123');
    });

    it('should filter trades by tags', async () => {
      const trades = [
        mockTrade,
        { ...mockTrade, id: 'trade456', tags: ['scalping', 'momentum'] },
        { ...mockTrade, id: 'trade789', tags: ['breakout', 'reversal'] }
      ];
      
      const options: TradeReviewExportOptions = {
        format: 'json',
        includeBasicTradeData: true,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: false,
        includeReviewWorkflow: false,
        tagFilter: ['breakout']
      };

      const result = await TradeReviewExportService.exportTrades(trades, options);
      
      const text = await result.text();
      const data = JSON.parse(text);
      
      expect(data.totalTrades).toBe(2);
      expect(data.trades.every((t: any) => t.basicData.id === 'trade123' || t.basicData.id === 'trade789')).toBe(true);
    });
  });

  describe('generateTradeReport', () => {
    it('should generate comprehensive trade report', () => {
      const report = TradeReviewExportService.generateTradeReport(mockTrade);

      expect(report.trade).toBe(mockTrade);
      expect(report.performanceMetrics).toBe(mockPerformanceMetrics);
      expect(report.notes).toBe(mockNotes);
      expect(report.charts).toBe(mockCharts);
      expect(report.reviewWorkflow).toBe(mockWorkflow);
      expect(report.reportId).toMatch(/^report_trade123_\d+$/);
      expect(report.generatedAt).toBeDefined();
    });

    it('should handle trade without review data', () => {
      const tradeWithoutReview = { ...mockTrade, reviewData: undefined };
      const report = TradeReviewExportService.generateTradeReport(tradeWithoutReview);

      expect(report.trade).toBe(tradeWithoutReview);
      expect(report.performanceMetrics).toBeUndefined();
      expect(report.notes).toBeUndefined();
      expect(report.charts).toBeUndefined();
      expect(report.reviewWorkflow).toBeUndefined();
    });
  });

  describe('createShareableReport', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('{}');
    });

    it('should create public shareable report', async () => {
      const shareableReport = await TradeReviewExportService.createShareableReport(
        mockTrade,
        'public'
      );

      expect(shareableReport.accessLevel).toBe('public');
      expect(shareableReport.shareUrl).toMatch(/\/shared-report\/share_\d+_\w+$/);
      expect(shareableReport.password).toBeUndefined();
      expect(shareableReport.accessCount).toBe(0);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should create protected shareable report with password', async () => {
      const shareableReport = await TradeReviewExportService.createShareableReport(
        mockTrade,
        'protected',
        { password: 'secret123', expiresIn: 48, maxAccess: 5 }
      );

      expect(shareableReport.accessLevel).toBe('protected');
      expect(shareableReport.password).toBe('secret123');
      expect(shareableReport.maxAccess).toBe(5);
      expect(shareableReport.expiresAt).toBeDefined();
    });

    it('should create private shareable report', async () => {
      const shareableReport = await TradeReviewExportService.createShareableReport(
        mockTrade,
        'private'
      );

      expect(shareableReport.accessLevel).toBe('private');
      expect(shareableReport.password).toBeUndefined();
    });
  });

  describe('getAvailableFields', () => {
    it('should return all available export fields', () => {
      const fields = TradeReviewExportService.getAvailableFields();

      expect(fields).toHaveLength(21);
      expect(fields.some(f => f.id === 'id' && f.category === 'basic')).toBe(true);
      expect(fields.some(f => f.id === 'rMultiple' && f.category === 'performance')).toBe(true);
      expect(fields.some(f => f.id === 'preTradeAnalysis' && f.category === 'notes')).toBe(true);
      expect(fields.some(f => f.id === 'chartCount' && f.category === 'charts')).toBe(true);
      expect(fields.some(f => f.id === 'reviewProgress' && f.category === 'workflow')).toBe(true);
    });

    it('should have required fields marked correctly', () => {
      const fields = TradeReviewExportService.getAvailableFields();
      const requiredFields = fields.filter(f => f.required);

      expect(requiredFields.length).toBeGreaterThan(0);
      expect(requiredFields.every(f => f.category === 'basic')).toBe(true);
    });
  });

  describe('validateExportOptions', () => {
    it('should validate valid export options', () => {
      const options: TradeReviewExportOptions = {
        format: 'pdf',
        includeBasicTradeData: true,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: false,
        includeReviewWorkflow: false
      };

      const result = TradeReviewExportService.validateExportOptions(options);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid format', () => {
      const options: TradeReviewExportOptions = {
        format: 'xml' as any,
        includeBasicTradeData: true,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: false,
        includeReviewWorkflow: false
      };

      const result = TradeReviewExportService.validateExportOptions(options);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid export format. Must be "pdf", "csv", or "json".');
    });

    it('should reject options with no data categories', () => {
      const options: TradeReviewExportOptions = {
        format: 'pdf',
        includeBasicTradeData: false,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: false,
        includeReviewWorkflow: false
      };

      const result = TradeReviewExportService.validateExportOptions(options);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one data category must be included in the export.');
    });

    it('should validate date range', () => {
      const options: TradeReviewExportOptions = {
        format: 'csv',
        includeBasicTradeData: true,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: false,
        includeReviewWorkflow: false,
        dateRange: {
          start: '2024-01-15',
          end: '2024-01-10'
        }
      };

      const result = TradeReviewExportService.validateExportOptions(options);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be before end date.');
    });

    it('should reject invalid dates', () => {
      const options: TradeReviewExportOptions = {
        format: 'csv',
        includeBasicTradeData: true,
        includeNotes: false,
        includeCharts: false,
        includePerformanceMetrics: false,
        includeReviewWorkflow: false,
        dateRange: {
          start: 'invalid-date',
          end: '2024-01-15'
        }
      };

      const result = TradeReviewExportService.validateExportOptions(options);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid start date in date range.');
    });
  });

  describe('getDefaultExportOptions', () => {
    it('should return default export options', () => {
      const options = TradeReviewExportService.getDefaultExportOptions();

      expect(options.format).toBe('pdf');
      expect(options.includeBasicTradeData).toBe(true);
      expect(options.includeNotes).toBe(true);
      expect(options.includeCharts).toBe(true);
      expect(options.includePerformanceMetrics).toBe(true);
      expect(options.includeReviewWorkflow).toBe(true);
    });
  });

  describe('downloadExport', () => {
    it('should trigger download with correct filename and extension', () => {
      const mockBlob = new Blob(['test content'], { type: 'text/csv' });
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      
      (document.createElement as jest.Mock).mockReturnValue(mockLink);

      TradeReviewExportService.downloadExport(mockBlob, 'test-export', 'csv');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test-export');
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('should use default filename when none provided', () => {
      const mockBlob = new Blob(['test content'], { type: 'application/json' });
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      
      (document.createElement as jest.Mock).mockReturnValue(mockLink);

      TradeReviewExportService.downloadExport(mockBlob, '', 'json');

      expect(mockLink.download).toMatch(/^trade-review-export-\d{4}-\d{2}-\d{2}\.json$/);
    });
  });
});
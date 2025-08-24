import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavigationContextService } from '../navigationContextService';
import { TradeReviewService } from '../tradeReviewService';
import { NoteManagementService } from '../noteManagementService';
import { PerformanceAnalyticsService } from '../performanceAnalyticsService';
import { ChartUploadService } from '../chartUploadService';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('Comprehensive Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NavigationContextService', () => {
    let service: NavigationContextService;

    beforeEach(() => {
      service = new NavigationContextService();
    });

    it('should set and get navigation context', () => {
      const context = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now()
      };

      service.setContext(context);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'navigationContext',
        JSON.stringify(context)
      );

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(context));
      const retrieved = service.getContext();
      expect(retrieved).toEqual(context);
    });

    it('should generate appropriate back labels', () => {
      const calendarContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now()
      };

      const label = service.generateBackLabel(calendarContext);
      expect(label).toBe('Back to Calendar');

      const tradeListContext = {
        source: 'trade-list' as const,
        sourceParams: { page: 1 },
        breadcrumb: ['Dashboard', 'Trade List'],
        timestamp: Date.now()
      };

      const tradeListLabel = service.generateBackLabel(tradeListContext);
      expect(tradeListLabel).toBe('Back to Trade List');
    });

    it('should generate back URLs with parameters', () => {
      const context = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15', view: 'month' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now()
      };

      const url = service.getBackUrl(context);
      expect(url).toBe('/calendar?date=2024-01-15&view=month');
    });

    it('should handle expired context', () => {
      const expiredContext = {
        source: 'calendar' as const,
        sourceParams: { date: '2024-01-15' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now() - (60 * 60 * 1000) // 1 hour ago
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredContext));
      const retrieved = service.getContext();
      expect(retrieved).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('navigationContext');
    });

    it('should clear context', () => {
      service.clearContext();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('navigationContext');
    });
  });

  describe('TradeReviewService', () => {
    let service: TradeReviewService;

    beforeEach(() => {
      service = new TradeReviewService();
    });

    it('should initialize review workflow', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      expect(workflow.tradeId).toBe('test-trade-1');
      expect(workflow.stages).toHaveLength(4);
      expect(workflow.overallProgress).toBe(0);
      expect(workflow.startedAt).toBeDefined();
      expect(workflow.completedAt).toBeUndefined();
    });

    it('should update review stage', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      service.updateStage('test-trade-1', 'data-verification', true, 'Data looks good');
      
      const updated = service.getReviewProgress('test-trade-1');
      const stage = updated.stages.find(s => s.id === 'data-verification');
      
      expect(stage?.completed).toBe(true);
      expect(stage?.notes).toBe('Data looks good');
      expect(stage?.completedAt).toBeDefined();
      expect(updated.overallProgress).toBe(25); // 1 of 4 stages
    });

    it('should mark review as complete', () => {
      const workflow = service.initializeReview('test-trade-1');
      
      // Complete all stages
      workflow.stages.forEach(stage => {
        service.updateStage('test-trade-1', stage.id, true);
      });
      
      service.markReviewComplete('test-trade-1');
      
      const completed = service.getReviewProgress('test-trade-1');
      expect(completed.overallProgress).toBe(100);
      expect(completed.completedAt).toBeDefined();
    });

    it('should track incomplete reviews', () => {
      service.initializeReview('incomplete-1');
      service.initializeReview('incomplete-2');
      service.initializeReview('complete-1');
      
      // Complete one review
      const completeWorkflow = service.getReviewProgress('complete-1');
      completeWorkflow.stages.forEach(stage => {
        service.updateStage('complete-1', stage.id, true);
      });
      service.markReviewComplete('complete-1');
      
      const incomplete = service.getIncompleteReviews();
      expect(incomplete).toHaveLength(2);
      expect(incomplete.map(w => w.tradeId)).toEqual(['incomplete-1', 'incomplete-2']);
    });
  });

  describe('NoteManagementService', () => {
    let service: NoteManagementService;

    beforeEach(() => {
      service = new NoteManagementService();
    });

    it('should save notes with versioning', async () => {
      const notes = {
        preTradeAnalysis: 'Strong setup',
        executionNotes: 'Clean entry',
        postTradeReflection: 'Good execution',
        lessonsLearned: 'Trust the setup',
        generalNotes: 'Excellent trade',
        lastModified: new Date().toISOString(),
        version: 1
      };

      await service.saveNotes('test-trade-1', notes);
      
      // Should increment version on subsequent saves
      const updatedNotes = { ...notes, preTradeAnalysis: 'Updated analysis' };
      await service.saveNotes('test-trade-1', updatedNotes);
      
      const history = await service.getNoteHistory('test-trade-1');
      expect(history).toHaveLength(2);
      expect(history[1].version).toBe(2);
    });

    it('should track note changes', async () => {
      const originalNotes = {
        preTradeAnalysis: 'Original analysis',
        executionNotes: 'Original execution',
        postTradeReflection: '',
        lessonsLearned: '',
        generalNotes: '',
        lastModified: new Date().toISOString(),
        version: 1
      };

      await service.saveNotes('test-trade-1', originalNotes);

      const updatedNotes = {
        ...originalNotes,
        preTradeAnalysis: 'Updated analysis',
        postTradeReflection: 'Added reflection',
        version: 2
      };

      await service.saveNotes('test-trade-1', updatedNotes);

      const history = await service.getNoteHistory('test-trade-1');
      const latestVersion = history[history.length - 1];
      
      expect(latestVersion.changes).toContain('preTradeAnalysis');
      expect(latestVersion.changes).toContain('postTradeReflection');
    });

    it('should apply note templates', () => {
      const template = {
        id: 'breakout-template',
        name: 'Breakout Trade Template',
        category: 'strategy',
        template: {
          preTradeAnalysis: 'Breakout pattern identified at [level]',
          executionNotes: 'Entry at breakout confirmation',
          postTradeReflection: 'Evaluate breakout quality',
          lessonsLearned: 'Volume confirmation importance'
        },
        description: 'Template for breakout trades'
      };

      const existingNotes = {
        preTradeAnalysis: '',
        executionNotes: '',
        postTradeReflection: 'Existing reflection',
        lessonsLearned: '',
        generalNotes: 'General notes',
        lastModified: new Date().toISOString(),
        version: 1
      };

      const result = service.applyTemplate(template, existingNotes);
      
      expect(result.preTradeAnalysis).toBe('Breakout pattern identified at [level]');
      expect(result.executionNotes).toBe('Entry at breakout confirmation');
      expect(result.postTradeReflection).toBe('Existing reflection'); // Should preserve existing
      expect(result.generalNotes).toBe('General notes'); // Should preserve existing
    });

    it('should manage note templates', () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        category: 'test',
        template: {
          preTradeAnalysis: 'Test analysis'
        },
        description: 'Test template'
      };

      const notes = {
        preTradeAnalysis: 'Test analysis',
        executionNotes: '',
        postTradeReflection: '',
        lessonsLearned: '',
        generalNotes: '',
        lastModified: new Date().toISOString(),
        version: 1
      };

      const createdTemplate = service.createTemplate('Test Template', notes);
      
      expect(createdTemplate.name).toBe('Test Template');
      expect(createdTemplate.template.preTradeAnalysis).toBe('Test analysis');
      expect(createdTemplate.id).toBeDefined();

      const templates = service.getTemplates();
      expect(templates).toContainEqual(createdTemplate);
    });
  });

  describe('PerformanceAnalyticsService', () => {
    let service: PerformanceAnalyticsService;

    beforeEach(() => {
      service = new PerformanceAnalyticsService();
    });

    const mockTrade = {
      id: 'test-trade',
      symbol: 'AAPL',
      entryPrice: 150,
      exitPrice: 155,
      quantity: 100,
      entryDate: '2024-01-15',
      exitDate: '2024-01-16',
      type: 'long' as const,
      status: 'closed' as const,
      pnl: 500,
      tags: ['momentum'],
      notes: 'Test trade',
      commission: 2,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-16T15:30:00Z',
      riskAmount: 200
    };

    it('should calculate performance metrics', () => {
      const metrics = service.calculateMetrics(mockTrade);
      
      expect(metrics.rMultiple).toBe(2.5); // (500 / 200)
      expect(metrics.returnPercentage).toBeCloseTo(3.33, 2); // ((155-150)/150)*100
      expect(metrics.riskRewardRatio).toBe(2.5);
      expect(metrics.holdDuration).toBe(1); // 1 day
      expect(metrics.efficiency).toBeGreaterThan(0);
    });

    it('should find similar trades', () => {
      const allTrades = [
        mockTrade,
        { ...mockTrade, id: 'similar-1', symbol: 'AAPL', tags: ['momentum'] },
        { ...mockTrade, id: 'similar-2', symbol: 'GOOGL', tags: ['reversal'] },
        { ...mockTrade, id: 'similar-3', symbol: 'AAPL', tags: ['momentum', 'breakout'] }
      ];

      const similar = service.findSimilarTrades(mockTrade, allTrades);
      
      expect(similar).toHaveLength(2); // similar-1 and similar-3
      expect(similar.map(t => t.id)).toEqual(['similar-1', 'similar-3']);
    });

    it('should compare with similar trades', () => {
      const similarTrades = [
        { ...mockTrade, id: 'similar-1', pnl: 300 },
        { ...mockTrade, id: 'similar-2', pnl: 700 }
      ];

      const comparison = service.compareWithSimilar(mockTrade, similarTrades);
      
      expect(comparison.similarTrades).toEqual(similarTrades);
      expect(comparison.averagePerformance.rMultiple).toBe(2); // Average of 1.5 and 3.5
      expect(comparison.percentileRank).toBeGreaterThan(0);
      expect(comparison.outperformanceFactors).toBeDefined();
      expect(comparison.improvementSuggestions).toBeDefined();
    });

    it('should generate performance insights', () => {
      const comparison = {
        similarTrades: [{ ...mockTrade, id: 'similar-1', pnl: 300 }],
        averagePerformance: { rMultiple: 1.5, returnPercentage: 2, riskRewardRatio: 1.5, holdDuration: 2, efficiency: 0.7 },
        percentileRank: 75,
        outperformanceFactors: ['Better entry timing'],
        improvementSuggestions: ['Consider longer holds']
      };

      const insights = service.generateInsights(mockTrade, comparison);
      
      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(insight => insight.includes('performance'))).toBe(true);
    });

    it('should calculate benchmark performance', () => {
      const trades = [
        mockTrade,
        { ...mockTrade, id: 'trade-2', pnl: 300, riskAmount: 150 },
        { ...mockTrade, id: 'trade-3', pnl: -100, riskAmount: 100 }
      ];

      const benchmark = service.calculateBenchmarkPerformance(trades);
      
      expect(benchmark.rMultiple).toBeCloseTo(2.33, 2); // Average R-multiple
      expect(benchmark.returnPercentage).toBeDefined();
      expect(benchmark.efficiency).toBeDefined();
    });
  });

  describe('ChartUploadService', () => {
    let service: ChartUploadService;

    beforeEach(() => {
      service = new ChartUploadService();
      global.fetch = vi.fn();
    });

    it('should validate chart files', () => {
      const validFile = new File(['chart data'], 'chart.png', { type: 'image/png' });
      const invalidFile = new File(['not an image'], 'document.pdf', { type: 'application/pdf' });
      const oversizedFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.png', { type: 'image/png' });

      expect(service.validateFile(validFile)).toBe(true);
      expect(service.validateFile(invalidFile)).toBe(false);
      expect(service.validateFile(oversizedFile)).toBe(false);
    });

    it('should upload chart with metadata', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'chart-123',
          url: 'https://example.com/chart-123.png'
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const file = new File(['chart data'], 'chart.png', { type: 'image/png' });
      const metadata = {
        tradeId: 'test-trade-1',
        type: 'entry' as const,
        timeframe: '1h',
        description: 'Entry chart'
      };

      const result = await service.uploadChart(file, metadata);
      
      expect(result.id).toBe('chart-123');
      expect(result.url).toBe('https://example.com/chart-123.png');
      expect(result.type).toBe('entry');
      expect(result.timeframe).toBe('1h');
    });

    it('should handle upload errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const file = new File(['chart data'], 'chart.png', { type: 'image/png' });
      const metadata = {
        tradeId: 'test-trade-1',
        type: 'entry' as const,
        timeframe: '1h'
      };

      await expect(service.uploadChart(file, metadata)).rejects.toThrow('Upload failed: 500 Internal Server Error');
    });

    it('should delete charts', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await service.deleteChart('chart-123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/charts/chart-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should organize charts by type and timeframe', () => {
      const charts = [
        { id: '1', type: 'entry' as const, timeframe: '1h', url: '', uploadedAt: '' },
        { id: '2', type: 'exit' as const, timeframe: '1h', url: '', uploadedAt: '' },
        { id: '3', type: 'entry' as const, timeframe: '4h', url: '', uploadedAt: '' },
        { id: '4', type: 'analysis' as const, timeframe: '1h', url: '', uploadedAt: '' }
      ];

      const organized = service.organizeCharts(charts);
      
      expect(organized.entry).toHaveLength(2);
      expect(organized.exit).toHaveLength(1);
      expect(organized.analysis).toHaveLength(1);
      expect(organized.post_mortem).toHaveLength(0);
    });
  });
});
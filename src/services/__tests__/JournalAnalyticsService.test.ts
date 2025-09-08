import { JournalAnalyticsService } from '../JournalAnalyticsService';
import { JournalDataService } from '../JournalDataService';
import { JournalEntry, EmotionalState, ProcessMetrics } from '../../types/journal';

// Mock the JournalDataService
jest.mock('../JournalDataService');

describe('JournalAnalyticsService', () => {
  let analyticsService: JournalAnalyticsService;
  let mockJournalDataService: jest.Mocked<JournalDataService>;

  beforeEach(() => {
    analyticsService = new JournalAnalyticsService();
    mockJournalDataService = new JournalDataService() as jest.Mocked<JournalDataService>;
    (analyticsService as any).journalDataService = mockJournalDataService;
  });

  const createMockJournalEntry = (
    date: string,
    isComplete: boolean = true,
    emotionalState?: Partial<EmotionalState>,
    processMetrics?: Partial<ProcessMetrics>,
    dailyPnL: number = 0
  ): JournalEntry => ({
    id: `entry-${date}`,
    userId: 'test-user',
    date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [],
    tradeReferences: [],
    emotionalState: {
      preMarket: {
        confidence: 3,
        anxiety: 2,
        focus: 4,
        mood: 'calm',
        ...emotionalState?.preMarket
      },
      duringTrading: {
        discipline: 4,
        patience: 3,
        emotionalControl: 4,
        ...emotionalState?.duringTrading
      },
      postMarket: {
        satisfaction: 4,
        learningValue: 4,
        overallMood: 'satisfied',
        ...emotionalState?.postMarket
      }
    },
    processMetrics: {
      planAdherence: 4,
      riskManagement: 4,
      entryTiming: 3,
      exitTiming: 3,
      overallDiscipline: 3.5,
      processScore: 3.5,
      ...processMetrics
    },
    dailyPnL,
    images: [],
    tags: [],
    isComplete,
    wordCount: 100
  });

  describe('getAnalyticsData', () => {
    it('should return comprehensive analytics data', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true),
        createMockJournalEntry('2024-01-02', true),
        createMockJournalEntry('2024-01-03', true)
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result).toHaveProperty('consistencyMetrics');
      expect(result).toHaveProperty('emotionalPatterns');
      expect(result).toHaveProperty('processTrends');
      expect(result).toHaveProperty('personalizedInsights');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should handle empty journal entries', async () => {
      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue([]);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.consistencyMetrics.currentStreak).toBe(0);
      expect(result.consistencyMetrics.totalEntries).toBe(0);
      expect(result.emotionalPatterns).toHaveLength(0);
      expect(result.processTrends).toHaveLength(0);
    });
  });

  describe('calculateConsistencyMetrics', () => {
    it('should calculate current streak correctly', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayBefore = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const mockEntries = [
        createMockJournalEntry(dayBefore, true),
        createMockJournalEntry(yesterday, true),
        createMockJournalEntry(today, true)
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.consistencyMetrics.currentStreak).toBe(3);
      expect(result.consistencyMetrics.totalEntries).toBe(3);
    });

    it('should calculate completion rate correctly', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true),
        createMockJournalEntry('2024-01-02', true),
        createMockJournalEntry('2024-01-03', true)
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.consistencyMetrics.completionRate).toBeGreaterThan(0);
      expect(result.consistencyMetrics.completionRate).toBeLessThanOrEqual(100);
    });

    it('should identify streak history', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true),
        createMockJournalEntry('2024-01-02', true),
        createMockJournalEntry('2024-01-03', true),
        // Gap
        createMockJournalEntry('2024-01-05', true),
        createMockJournalEntry('2024-01-06', true)
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.consistencyMetrics.streakHistory.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeEmotionalPatterns', () => {
    it('should identify emotional patterns and correlations', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true, {
          preMarket: { mood: 'confident' },
          postMarket: { overallMood: 'satisfied' }
        }, { processScore: 4.5 }, 100),
        createMockJournalEntry('2024-01-02', true, {
          preMarket: { mood: 'confident' },
          postMarket: { overallMood: 'satisfied' }
        }, { processScore: 4.2 }, 80),
        createMockJournalEntry('2024-01-03', true, {
          preMarket: { mood: 'nervous' },
          postMarket: { overallMood: 'frustrated' }
        }, { processScore: 2.5 }, -50)
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.emotionalPatterns.length).toBeGreaterThan(0);
      
      const confidentPattern = result.emotionalPatterns.find(p => p.emotion === 'confident');
      expect(confidentPattern).toBeDefined();
      expect(confidentPattern?.frequency).toBe(2);
      expect(confidentPattern?.averageProcessScore).toBeGreaterThan(4);
    });

    it('should calculate correlation strength correctly', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true, {
          preMarket: { mood: 'confident' }
        }, { processScore: 5 }),
        createMockJournalEntry('2024-01-02', true, {
          preMarket: { mood: 'confident' }
        }, { processScore: 4.8 }),
        createMockJournalEntry('2024-01-03', true, {
          preMarket: { mood: 'nervous' }
        }, { processScore: 2 })
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      const patterns = result.emotionalPatterns;
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.correlationStrength >= 0 && p.correlationStrength <= 1)).toBe(true);
    });

    it('should generate appropriate recommendations', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true, {
          preMarket: { mood: 'confident' }
        }, { processScore: 4.5 })
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      const confidentPattern = result.emotionalPatterns.find(p => p.emotion === 'confident');
      expect(confidentPattern?.recommendations).toBeDefined();
      expect(confidentPattern?.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('calculateProcessTrends', () => {
    it('should calculate trends for all process metrics', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true, undefined, {
          planAdherence: 3,
          riskManagement: 3,
          entryTiming: 3,
          exitTiming: 3,
          overallDiscipline: 3,
          processScore: 3
        }),
        createMockJournalEntry('2024-01-02', true, undefined, {
          planAdherence: 4,
          riskManagement: 4,
          entryTiming: 4,
          exitTiming: 4,
          overallDiscipline: 4,
          processScore: 4
        })
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.processTrends.length).toBeGreaterThan(0);
      
      const planAdherenceTrend = result.processTrends.find(t => t.metric === 'planAdherence');
      expect(planAdherenceTrend).toBeDefined();
      expect(planAdherenceTrend?.trend).toBe('improving');
    });

    it('should detect declining trends', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true, undefined, {
          planAdherence: 4,
          processScore: 4
        }),
        createMockJournalEntry('2024-01-02', true, undefined, {
          planAdherence: 3,
          processScore: 3
        })
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      const planAdherenceTrend = result.processTrends.find(t => t.metric === 'planAdherence');
      expect(planAdherenceTrend?.trend).toBe('declining');
    });

    it('should calculate weekly and monthly averages', async () => {
      const mockEntries = Array.from({ length: 30 }, (_, i) => 
        createMockJournalEntry(
          new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          true,
          undefined,
          { processScore: 3.5 + Math.random() }
        )
      );

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      const processScoreTrend = result.processTrends.find(t => t.metric === 'processScore');
      expect(processScoreTrend?.weeklyAverage).toBeDefined();
      expect(processScoreTrend?.monthlyAverage).toBeDefined();
    });
  });

  describe('generatePersonalizedInsights', () => {
    it('should generate consistency insights for good streaks', async () => {
      const mockEntries = Array.from({ length: 10 }, (_, i) => 
        createMockJournalEntry(
          new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          true
        )
      );

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      const consistencyInsight = result.personalizedInsights.find(i => i.type === 'consistency');
      expect(consistencyInsight).toBeDefined();
      expect(consistencyInsight?.priority).toBe('high');
    });

    it('should generate emotional insights for strong patterns', async () => {
      const mockEntries = Array.from({ length: 5 }, (_, i) => 
        createMockJournalEntry(
          new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          true,
          { preMarket: { mood: 'confident' } },
          { processScore: 4.5 }
        )
      );

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      const emotionalInsight = result.personalizedInsights.find(i => i.type === 'emotional');
      expect(emotionalInsight).toBeDefined();
    });

    it('should generate process insights for improving trends', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true, undefined, { processScore: 3 }),
        createMockJournalEntry('2024-01-02', true, undefined, { processScore: 4 }),
        createMockJournalEntry('2024-01-03', true, undefined, { processScore: 4.5 })
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      const processInsight = result.personalizedInsights.find(i => i.type === 'process');
      expect(processInsight).toBeDefined();
    });

    it('should prioritize insights correctly', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true, undefined, { processScore: 2 }),
        createMockJournalEntry('2024-01-02', true, undefined, { processScore: 1.5 })
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      const highPriorityInsights = result.personalizedInsights.filter(i => i.priority === 'high');
      const mediumPriorityInsights = result.personalizedInsights.filter(i => i.priority === 'medium');
      const lowPriorityInsights = result.personalizedInsights.filter(i => i.priority === 'low');

      // High priority insights should come first
      expect(result.personalizedInsights[0]?.priority).toBe('high');
    });

    it('should include confidence scores', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true)
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      result.personalizedInsights.forEach(insight => {
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle entries with missing emotional data', async () => {
      const mockEntries = [
        {
          ...createMockJournalEntry('2024-01-01', true),
          emotionalState: undefined as any
        }
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.emotionalPatterns).toHaveLength(0);
    });

    it('should handle entries with missing process metrics', async () => {
      const mockEntries = [
        {
          ...createMockJournalEntry('2024-01-01', true),
          processMetrics: undefined as any
        }
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.processTrends).toHaveLength(0);
    });

    it('should handle single entry data', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true)
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const result = await analyticsService.getAnalyticsData('test-user');

      expect(result.consistencyMetrics.currentStreak).toBe(1);
      expect(result.consistencyMetrics.totalEntries).toBe(1);
    });

    it('should handle custom date ranges', async () => {
      const mockEntries = [
        createMockJournalEntry('2024-01-01', true),
        createMockJournalEntry('2024-01-02', true)
      ];

      mockJournalDataService.getJournalEntriesForDateRange.mockResolvedValue(mockEntries);

      const customRange = { start: '2024-01-01', end: '2024-01-02' };
      const result = await analyticsService.getAnalyticsData('test-user', customRange);

      expect(mockJournalDataService.getJournalEntriesForDateRange).toHaveBeenCalledWith(
        'test-user',
        '2024-01-01',
        '2024-01-02'
      );
    });
  });
});
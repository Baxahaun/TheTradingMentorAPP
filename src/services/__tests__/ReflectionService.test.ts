import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReflectionService } from '../ReflectionService';
import { ProcessMetrics, EmotionalState } from '../../types/journal';
import { Trade } from '../../types/trade';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ReflectionService', () => {
  let reflectionService: ReflectionService;
  const mockUserId = 'test-user-123';
  const mockDate = '2024-01-15';

  const mockProcessMetrics: ProcessMetrics = {
    planAdherence: 4,
    riskManagement: 3,
    entryTiming: 4,
    exitTiming: 3,
    overallDiscipline: 3.5,
    processScore: 75
  };

  const mockEmotionalState: EmotionalState = {
    preMarket: {
      confidence: 4,
      anxiety: 2,
      focus: 4,
      mood: 'confident'
    },
    duringTrading: {
      discipline: 3,
      patience: 4,
      emotionalControl: 3
    },
    postMarket: {
      satisfaction: 3,
      learningValue: 4,
      overallMood: 'satisfied'
    }
  };

  const mockTrades: Trade[] = [
    {
      id: 'trade-1',
      accountId: 'account-1',
      currencyPair: 'EUR/USD',
      date: '2024-01-15',
      timeIn: '09:30:00',
      timeOut: '10:15:00',
      timestamp: Date.now(),
      side: 'long',
      entryPrice: 1.0850,
      exitPrice: 1.0900,
      lotSize: 1,
      lotType: 'standard',
      units: 100000,
      pnl: 150,
      commission: 5,
      accountCurrency: 'USD',
      status: 'closed'
    },
    {
      id: 'trade-2',
      accountId: 'account-1',
      currencyPair: 'GBP/USD',
      date: '2024-01-15',
      timeIn: '11:00:00',
      timeOut: '11:30:00',
      timestamp: Date.now(),
      side: 'short',
      entryPrice: 1.2650,
      exitPrice: 1.2600,
      lotSize: 1,
      lotType: 'standard',
      units: 100000,
      pnl: -75,
      commission: 5,
      accountCurrency: 'USD',
      status: 'closed'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    reflectionService = ReflectionService.getInstance();
  });

  describe('generateReflectionSession', () => {
    it('should generate a reflection session with appropriate prompts for winning trades', async () => {
      const winningTrades = [
        { ...mockTrades[0], pnl: 200 },
        { ...mockTrades[1], pnl: 150 }
      ];

      const session = await reflectionService.generateReflectionSession(
        mockUserId,
        mockDate,
        winningTrades,
        mockProcessMetrics,
        mockEmotionalState
      );

      expect(session.userId).toBe(mockUserId);
      expect(session.date).toBe(mockDate);
      expect(session.completionStatus).toBe('not_started');
      expect(session.sessionContext.totalPnL).toBe(350);
      expect(session.sessionContext.tradeCount).toBe(2);
      expect(session.prompts.length).toBeGreaterThan(0);
      
      // Should include winning trades prompts
      const hasWinningPrompts = session.prompts.some(p => p.type === 'winning_trades');
      expect(hasWinningPrompts).toBe(true);
    });

    it('should generate appropriate prompts for losing trades', async () => {
      const losingTrades = [
        { ...mockTrades[0], pnl: -100 },
        { ...mockTrades[1], pnl: -150 }
      ];

      const session = await reflectionService.generateReflectionSession(
        mockUserId,
        mockDate,
        losingTrades,
        mockProcessMetrics,
        mockEmotionalState
      );

      expect(session.sessionContext.totalPnL).toBe(-250);
      
      // Should include losing trades prompts
      const hasLosingPrompts = session.prompts.some(p => p.type === 'losing_trades');
      expect(hasLosingPrompts).toBe(true);
    });

    it('should generate no-trades prompts when no trades are provided', async () => {
      const session = await reflectionService.generateReflectionSession(
        mockUserId,
        mockDate,
        [],
        mockProcessMetrics,
        mockEmotionalState
      );

      expect(session.sessionContext.tradeCount).toBe(0);
      
      // Should include no-trades prompts
      const hasNoTradesPrompts = session.prompts.some(p => p.type === 'no_trades');
      expect(hasNoTradesPrompts).toBe(true);
    });

    it('should limit prompts to maximum of 4', async () => {
      const session = await reflectionService.generateReflectionSession(
        mockUserId,
        mockDate,
        mockTrades,
        mockProcessMetrics,
        mockEmotionalState
      );

      expect(session.prompts.length).toBeLessThanOrEqual(4);
    });
  });

  describe('saveReflectionResponse', () => {
    it('should save a reflection response with generated tags and themes', async () => {
      const mockResponse = {
        userId: mockUserId,
        date: mockDate,
        promptId: 'test-prompt-1',
        question: 'What did you learn today?',
        answer: 'I learned the importance of patience and discipline in trading. Risk management was key to my success.'
      };

      localStorageMock.getItem.mockReturnValue('[]');

      const responseId = await reflectionService.saveReflectionResponse(mockResponse);

      expect(responseId).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `reflections-${mockUserId}`,
        expect.stringContaining(mockResponse.answer)
      );
    });

    it('should extract relevant tags from response text', async () => {
      const mockResponse = {
        userId: mockUserId,
        date: mockDate,
        promptId: 'test-prompt-1',
        question: 'What went wrong?',
        answer: 'I broke my risk management rules and let emotions control my trading decisions.'
      };

      localStorageMock.getItem.mockReturnValue('[]');

      await reflectionService.saveReflectionResponse(mockResponse);

      const savedCall = localStorageMock.setItem.mock.calls.find(call => 
        call[0] === `reflections-${mockUserId}`
      );
      
      expect(savedCall).toBeDefined();
      const savedData = JSON.parse(savedCall[1]);
      const savedResponse = savedData[0];
      
      expect(savedResponse.tags).toContain('risk-management');
      expect(savedResponse.tags).toContain('emotional-control');
    });

    it('should extract themes from response text', async () => {
      const mockResponse = {
        userId: mockUserId,
        date: mockDate,
        promptId: 'test-prompt-1',
        question: 'How was your timing today?',
        answer: 'My entry timing was good but I need to work on patience when waiting for setups.'
      };

      localStorageMock.getItem.mockReturnValue('[]');

      await reflectionService.saveReflectionResponse(mockResponse);

      const savedCall = localStorageMock.setItem.mock.calls.find(call => 
        call[0] === `reflections-${mockUserId}`
      );
      
      const savedData = JSON.parse(savedCall[1]);
      const savedResponse = savedData[0];
      
      expect(savedResponse.themes).toContain('timing');
      expect(savedResponse.themes).toContain('patience');
    });
  });

  describe('searchReflections', () => {
    beforeEach(() => {
      const mockReflections = [
        {
          id: 'response-1',
          userId: mockUserId,
          date: '2024-01-15',
          question: 'What did you learn?',
          answer: 'I learned about patience and risk management',
          tags: ['patience', 'risk-management'],
          themes: ['patience', 'discipline'],
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'response-2',
          userId: mockUserId,
          date: '2024-01-14',
          question: 'How was your emotional control?',
          answer: 'I struggled with emotional control during losses',
          tags: ['emotional-control'],
          themes: ['emotional-management'],
          createdAt: '2024-01-14T10:00:00Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockReflections));
    });

    it('should search by query text', async () => {
      const results = await reflectionService.searchReflections(mockUserId, {
        query: 'patience'
      });

      expect(results).toHaveLength(1);
      expect(results[0].answer).toContain('patience');
    });

    it('should filter by tags', async () => {
      const results = await reflectionService.searchReflections(mockUserId, {
        tags: ['emotional-control']
      });

      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('emotional-control');
    });

    it('should filter by themes', async () => {
      const results = await reflectionService.searchReflections(mockUserId, {
        themes: ['patience']
      });

      expect(results).toHaveLength(1);
      expect(results[0].themes).toContain('patience');
    });

    it('should filter by date range', async () => {
      const results = await reflectionService.searchReflections(mockUserId, {
        dateRange: {
          start: '2024-01-15',
          end: '2024-01-15'
        }
      });

      expect(results).toHaveLength(1);
      expect(results[0].date).toBe('2024-01-15');
    });

    it('should sort results by date descending by default', async () => {
      const results = await reflectionService.searchReflections(mockUserId, {});

      expect(results).toHaveLength(2);
      expect(new Date(results[0].date).getTime()).toBeGreaterThan(
        new Date(results[1].date).getTime()
      );
    });

    it('should sort results by date ascending when specified', async () => {
      const results = await reflectionService.searchReflections(mockUserId, {
        sortBy: 'date',
        sortOrder: 'asc'
      });

      expect(results).toHaveLength(2);
      expect(new Date(results[0].date).getTime()).toBeLessThan(
        new Date(results[1].date).getTime()
      );
    });
  });

  describe('getLearningPatterns', () => {
    it('should return stored learning patterns', async () => {
      const mockPatterns = [
        {
          id: 'pattern-1',
          userId: mockUserId,
          theme: 'patience',
          description: 'Recurring theme: patience',
          frequency: 3,
          firstOccurrence: '2024-01-10',
          lastOccurrence: '2024-01-15',
          relatedResponses: ['response-1', 'response-2'],
          category: 'strength',
          actionItems: [],
          isResolved: false
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPatterns));

      const patterns = await reflectionService.getLearningPatterns(mockUserId);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].theme).toBe('patience');
      expect(patterns[0].frequency).toBe(3);
    });

    it('should return empty array when no patterns exist', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const patterns = await reflectionService.getLearningPatterns(mockUserId);

      expect(patterns).toEqual([]);
    });
  });

  describe('getReflectionAnalytics', () => {
    beforeEach(() => {
      const mockReflections = [
        {
          id: 'response-1',
          date: '2024-01-15',
          answer: 'This is a test reflection about patience and discipline.',
          themes: ['patience', 'discipline']
        },
        {
          id: 'response-2',
          date: '2024-01-14',
          answer: 'Another reflection about emotional control.',
          themes: ['emotional-management']
        },
        {
          id: 'response-3',
          date: '2024-01-13',
          answer: 'Reflection about patience again.',
          themes: ['patience']
        }
      ];

      const mockPatterns = [
        {
          theme: 'patience',
          frequency: 2,
          category: 'strength',
          isResolved: false
        }
      ];

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(mockReflections)) // for reflections
        .mockReturnValueOnce(JSON.stringify(mockPatterns)); // for patterns
    });

    it('should calculate analytics correctly', async () => {
      const analytics = await reflectionService.getReflectionAnalytics(mockUserId);

      expect(analytics.totalReflections).toBe(3);
      expect(analytics.averageResponseLength).toBeGreaterThan(0);
      expect(analytics.mostCommonThemes).toHaveLength(2);
      expect(analytics.mostCommonThemes[0].theme).toBe('patience');
      expect(analytics.mostCommonThemes[0].count).toBe(2);
      expect(analytics.learningPatterns).toHaveLength(1);
    });

    it('should calculate consistency score based on recent activity', async () => {
      // Mock current date to be 2024-01-15
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15'));

      const analytics = await reflectionService.getReflectionAnalytics(mockUserId);

      expect(analytics.consistencyScore).toBeGreaterThan(0);
      expect(analytics.consistencyScore).toBeLessThanOrEqual(100);

      vi.useRealTimers();
    });

    it('should calculate reflection streak correctly', async () => {
      // Mock current date and create consecutive reflections
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15'));

      const consecutiveReflections = [
        { id: '1', date: '2024-01-15', answer: 'test', themes: [] },
        { id: '2', date: '2024-01-14', answer: 'test', themes: [] },
        { id: '3', date: '2024-01-13', answer: 'test', themes: [] }
      ];

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(consecutiveReflections))
        .mockReturnValueOnce('[]');

      const analytics = await reflectionService.getReflectionAnalytics(mockUserId);

      expect(analytics.reflectionStreak).toBe(3);

      vi.useRealTimers();
    });
  });

  describe('session management', () => {
    it('should update reflection session', async () => {
      const sessionId = 'test-session-123';
      const updates = {
        completionStatus: 'completed' as const,
        completedAt: '2024-01-15T12:00:00Z'
      };

      const existingSession = {
        id: sessionId,
        userId: mockUserId,
        date: mockDate,
        completionStatus: 'in_progress'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSession));

      await reflectionService.updateReflectionSession(sessionId, updates);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `reflection-session-${sessionId}`,
        expect.stringContaining('"completionStatus":"completed"')
      );
    });

    it('should retrieve reflection session', async () => {
      const sessionId = 'test-session-123';
      const mockSession = {
        id: sessionId,
        userId: mockUserId,
        date: mockDate,
        completionStatus: 'in_progress'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const session = await reflectionService.getReflectionSession(sessionId);

      expect(session).toEqual(mockSession);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        `reflection-session-${sessionId}`
      );
    });

    it('should return null for non-existent session', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const session = await reflectionService.getReflectionSession('non-existent');

      expect(session).toBeNull();
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { patternRecognitionService } from '../patternRecognitionService';
import { PatternType, PatternCategory, Trade, TradePattern, CustomPattern } from '../../types/trade';

// Mock Firebase functions
vi.mock('firebase/firestore');

describe('PatternRecognitionService', () => {
  const mockTradePattern: TradePattern = {
    id: 'pattern-1',
    type: PatternType.DOJI,
    timeframe: 'H1',
    quality: 4,
    confluence: true,
    description: 'Strong doji at resistance level'
  };

  const mockTrade: Trade = {
    id: 'test-trade-1',
    symbol: 'EURUSD',
    side: 'long',
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    lotSize: 1.0,
    pnl: 50,
    rMultiple: 1.5,
    status: 'closed',
    date: '2024-01-15',
    timeIn: '09:00',
    timeOut: '10:30',
    timeframe: 'H1',
    patterns: [mockTradePattern]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Predefined Pattern Management', () => {
    it('should return all predefined pattern types', () => {
      const patternTypes = patternRecognitionService.getPredefinedPatternTypes();
      
      expect(patternTypes).toContain(PatternType.DOJI);
      expect(patternTypes).toContain(PatternType.HAMMER);
      expect(patternTypes).toContain(PatternType.TRIANGLE);
      expect(patternTypes).toContain(PatternType.FLAG);
      expect(patternTypes.length).toBeGreaterThan(0);
    });

    it('should return pattern type description', () => {
      const description = patternRecognitionService.getPatternTypeDescription(PatternType.DOJI);
      
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('should return default description for unknown pattern type', () => {
      const description = patternRecognitionService.getPatternTypeDescription('unknown' as PatternType);
      
      expect(description).toBe('Custom pattern type');
    });

    it('should return pattern types by category', () => {
      const candlestickPatterns = patternRecognitionService.getPatternTypesByCategory(PatternCategory.CANDLESTICK);
      const chartPatterns = patternRecognitionService.getPatternTypesByCategory(PatternCategory.CHART_PATTERN);
      
      expect(Array.isArray(candlestickPatterns)).toBe(true);
      expect(Array.isArray(chartPatterns)).toBe(true);
      
      expect(candlestickPatterns).toContain(PatternType.DOJI);
      expect(candlestickPatterns).toContain(PatternType.HAMMER);
      expect(chartPatterns).toContain(PatternType.TRIANGLE);
      expect(chartPatterns).toContain(PatternType.FLAG);
    });

    it('should return all pattern categories', () => {
      const categories = patternRecognitionService.getPatternCategories();
      
      expect(categories).toContain(PatternCategory.CANDLESTICK);
      expect(categories).toContain(PatternCategory.CHART_PATTERN);
      expect(categories).toContain(PatternCategory.SUPPORT_RESISTANCE);
      expect(categories).toContain(PatternCategory.TREND_LINE);
      expect(categories).toContain(PatternCategory.FIBONACCI);
      expect(categories).toContain(PatternCategory.CUSTOM);
    });
  });

  describe('Pattern Validation', () => {
    it('should validate a correct trade pattern', () => {
      const result = patternRecognitionService.validateTradePattern(mockTradePattern);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidPattern: TradePattern = {
        id: '',
        type: undefined as any,
        timeframe: '',
        quality: 0,
        confluence: false
      };
      
      const result = patternRecognitionService.validateTradePattern(invalidPattern);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pattern ID is required');
      expect(result.errors).toContain('Pattern type is required');
      expect(result.errors).toContain('Timeframe is required');
      expect(result.errors).toContain('Pattern quality must be between 1 and 5');
    });

    it('should require custom pattern details for CUSTOM type', () => {
      const customPattern: TradePattern = {
        ...mockTradePattern,
        type: PatternType.CUSTOM,
        customPattern: undefined
      };
      
      const result = patternRecognitionService.validateTradePattern(customPattern);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Custom pattern details are required when pattern type is CUSTOM');
    });

    it('should provide warnings for non-standard timeframes', () => {
      const patternWithCustomTimeframe: TradePattern = {
        ...mockTradePattern,
        timeframe: 'M3'
      };
      
      const result = patternRecognitionService.validateTradePattern(patternWithCustomTimeframe);
      
      expect(result.warnings).toContain("Timeframe 'M3' is not a standard forex timeframe");
    });

    it('should provide warnings for low quality patterns', () => {
      const lowQualityPattern: TradePattern = {
        ...mockTradePattern,
        quality: 2
      };
      
      const result = patternRecognitionService.validateTradePattern(lowQualityPattern);
      
      expect(result.warnings).toContain('Low quality pattern - consider additional confirmation');
    });
  });

  describe('Pattern Performance Calculation', () => {
    const mockTrades: Trade[] = [
      {
        ...mockTrade,
        id: 'trade-1',
        pnl: 100,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI }]
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: -50,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI }]
      },
      {
        ...mockTrade,
        id: 'trade-3',
        pnl: 75,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI }]
      },
      {
        ...mockTrade,
        id: 'trade-4',
        pnl: 25,
        patterns: [{ ...mockTradePattern, type: PatternType.HAMMER }]
      }
    ];

    it('should calculate pattern performance analytics correctly', () => {
      const analytics = patternRecognitionService.calculatePatternPerformance(
        PatternType.DOJI, 
        mockTrades
      );
      
      expect(analytics.patternType).toBe(PatternType.DOJI);
      expect(analytics.totalTrades).toBe(3);
      expect(analytics.successRate).toBeCloseTo(66.67, 1); // 2 wins out of 3 trades
      expect(analytics.averageProfit).toBe(87.5); // (100 + 75) / 2
      expect(analytics.averageLoss).toBe(50); // 50 / 1
      expect(analytics.profitFactor).toBe(175/50); // 175 total wins / 50 total losses
    });

    it('should return zero analytics for pattern with no trades', () => {
      const analytics = patternRecognitionService.calculatePatternPerformance(
        PatternType.TRIANGLE, 
        mockTrades
      );
      
      expect(analytics.totalTrades).toBe(0);
      expect(analytics.successRate).toBe(0);
      expect(analytics.averageProfit).toBe(0);
      expect(analytics.averageLoss).toBe(0);
      expect(analytics.profitFactor).toBe(0);
    });

    it('should analyze timeframe performance', () => {
      const tradesWithTimeframes: Trade[] = [
        {
          ...mockTrade,
          pnl: 100,
          patterns: [{ ...mockTradePattern, type: PatternType.DOJI, timeframe: 'H1' }]
        },
        {
          ...mockTrade,
          id: 'trade-2',
          pnl: -50,
          patterns: [{ ...mockTradePattern, type: PatternType.DOJI, timeframe: 'H4' }]
        }
      ];
      
      const analytics = patternRecognitionService.calculatePatternPerformance(
        PatternType.DOJI, 
        tradesWithTimeframes
      );
      
      expect(analytics.timeframePerformance).toBeDefined();
      expect(analytics.timeframePerformance['H1']).toBe(100);
      expect(analytics.timeframePerformance['H4']).toBe(-50);
    });

    it('should analyze market condition correlation', () => {
      const tradesWithMarketConditions: Trade[] = [
        {
          ...mockTrade,
          pnl: 100,
          patterns: [{ ...mockTradePattern, type: PatternType.DOJI }],
          setup: { 
            id: 'setup-1', 
            type: 'TREND_CONTINUATION' as any, 
            timeframe: 'H1', 
            marketCondition: 'trending', 
            quality: 4, 
            confluence: [] 
          }
        },
        {
          ...mockTrade,
          id: 'trade-2',
          pnl: -50,
          patterns: [{ ...mockTradePattern, type: PatternType.DOJI }],
          setup: { 
            id: 'setup-2', 
            type: 'RANGE_BREAKOUT' as any, 
            timeframe: 'H1', 
            marketCondition: 'ranging', 
            quality: 3, 
            confluence: [] 
          }
        }
      ];
      
      const analytics = patternRecognitionService.calculatePatternPerformance(
        PatternType.DOJI, 
        tradesWithMarketConditions
      );
      
      expect(analytics.marketConditionCorrelation).toBeDefined();
      expect(analytics.marketConditionCorrelation['trending']).toBe(100);
      expect(analytics.marketConditionCorrelation['ranging']).toBe(0);
    });
  });

  describe('Pattern Confluence Calculation', () => {
    it('should calculate confluence score correctly', () => {
      const patterns: TradePattern[] = [
        { ...mockTradePattern, quality: 4, confluence: true },
        { ...mockTradePattern, id: 'pattern-2', quality: 3, confluence: false }
      ];
      
      const score = patternRecognitionService.calculatePatternConfluence(patterns);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return zero confluence for empty patterns', () => {
      const score = patternRecognitionService.calculatePatternConfluence([]);
      expect(score).toBe(0);
    });

    it('should give higher scores for high quality patterns', () => {
      const highQualityPatterns: TradePattern[] = [
        { ...mockTradePattern, quality: 5, confluence: true },
        { ...mockTradePattern, id: 'pattern-2', quality: 5, confluence: true }
      ];
      
      const lowQualityPatterns: TradePattern[] = [
        { ...mockTradePattern, quality: 1, confluence: false },
        { ...mockTradePattern, id: 'pattern-2', quality: 1, confluence: false }
      ];
      
      const highScore = patternRecognitionService.calculatePatternConfluence(highQualityPatterns);
      const lowScore = patternRecognitionService.calculatePatternConfluence(lowQualityPatterns);
      
      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should give bonus for category diversity', () => {
      const diversePatterns: TradePattern[] = [
        { ...mockTradePattern, type: PatternType.DOJI }, // Candlestick
        { ...mockTradePattern, id: 'pattern-2', type: PatternType.TRIANGLE } // Chart pattern
      ];
      
      const samePatterns: TradePattern[] = [
        { ...mockTradePattern, type: PatternType.DOJI }, // Candlestick
        { ...mockTradePattern, id: 'pattern-2', type: PatternType.HAMMER } // Candlestick
      ];
      
      const diverseScore = patternRecognitionService.calculatePatternConfluence(diversePatterns);
      const sameScore = patternRecognitionService.calculatePatternConfluence(samePatterns);
      
      expect(diverseScore).toBeGreaterThan(sameScore);
    });
  });

  describe('Pattern Category Mapping', () => {
    it('should correctly map pattern types to categories', () => {
      expect(patternRecognitionService.getPatternCategory(PatternType.DOJI)).toBe(PatternCategory.CANDLESTICK);
      expect(patternRecognitionService.getPatternCategory(PatternType.HAMMER)).toBe(PatternCategory.CANDLESTICK);
      expect(patternRecognitionService.getPatternCategory(PatternType.TRIANGLE)).toBe(PatternCategory.CHART_PATTERN);
      expect(patternRecognitionService.getPatternCategory(PatternType.FLAG)).toBe(PatternCategory.CHART_PATTERN);
      expect(patternRecognitionService.getPatternCategory(PatternType.HORIZONTAL_LEVEL)).toBe(PatternCategory.SUPPORT_RESISTANCE);
      expect(patternRecognitionService.getPatternCategory(PatternType.ASCENDING_TREND)).toBe(PatternCategory.TREND_LINE);
      expect(patternRecognitionService.getPatternCategory(PatternType.RETRACEMENT)).toBe(PatternCategory.FIBONACCI);
      expect(patternRecognitionService.getPatternCategory(PatternType.CUSTOM)).toBe(PatternCategory.CUSTOM);
    });
  });

  describe('Pattern Success Rate Tracking', () => {
    const mockTrades: Trade[] = [
      {
        ...mockTrade,
        pnl: 100,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI, timeframe: 'H1' }]
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: -50,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI, timeframe: 'H1' }]
      },
      {
        ...mockTrade,
        id: 'trade-3',
        pnl: 75,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI, timeframe: 'H4' }]
      }
    ];

    it('should calculate overall success rate', () => {
      const successRate = patternRecognitionService.calculatePatternSuccessRate(
        PatternType.DOJI, 
        mockTrades
      );
      
      expect(successRate).toBeCloseTo(66.67, 1); // 2 wins out of 3 trades
    });

    it('should calculate success rate for specific timeframe', () => {
      const h1SuccessRate = patternRecognitionService.calculatePatternSuccessRate(
        PatternType.DOJI, 
        mockTrades, 
        'H1'
      );
      
      const h4SuccessRate = patternRecognitionService.calculatePatternSuccessRate(
        PatternType.DOJI, 
        mockTrades, 
        'H4'
      );
      
      expect(h1SuccessRate).toBe(50); // 1 win out of 2 trades
      expect(h4SuccessRate).toBe(100); // 1 win out of 1 trade
    });

    it('should return zero for pattern with no trades', () => {
      const successRate = patternRecognitionService.calculatePatternSuccessRate(
        PatternType.TRIANGLE, 
        mockTrades
      );
      
      expect(successRate).toBe(0);
    });
  });

  describe('Pattern-Based Filtering and Search', () => {
    const mockTrades: Trade[] = [
      {
        ...mockTrade,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI }]
      },
      {
        ...mockTrade,
        id: 'trade-2',
        patterns: [{ ...mockTradePattern, type: PatternType.HAMMER }]
      },
      {
        ...mockTrade,
        id: 'trade-3',
        patterns: [{ ...mockTradePattern, type: PatternType.TRIANGLE }]
      }
    ];

    it('should filter trades by pattern type', () => {
      const dojiTrades = patternRecognitionService.filterTradesByPattern(mockTrades, PatternType.DOJI);
      
      expect(dojiTrades).toHaveLength(1);
      expect(dojiTrades[0].id).toBe('test-trade-1');
    });

    it('should filter trades by pattern category', () => {
      const candlestickTrades = patternRecognitionService.filterTradesByPatternCategory(
        mockTrades, 
        PatternCategory.CANDLESTICK
      );
      
      expect(candlestickTrades).toHaveLength(2); // DOJI and HAMMER
    });

    it('should filter trades by pattern quality', () => {
      const tradesWithQuality: Trade[] = [
        {
          ...mockTrade,
          patterns: [{ ...mockTradePattern, quality: 5 }]
        },
        {
          ...mockTrade,
          id: 'trade-2',
          patterns: [{ ...mockTradePattern, quality: 2 }]
        }
      ];
      
      const highQualityTrades = patternRecognitionService.filterTradesByPatternQuality(
        tradesWithQuality, 
        4
      );
      
      expect(highQualityTrades).toHaveLength(1);
    });

    it('should filter trades by pattern confluence', () => {
      const tradesWithConfluence: Trade[] = [
        {
          ...mockTrade,
          patterns: [{ ...mockTradePattern, confluence: true }]
        },
        {
          ...mockTrade,
          id: 'trade-2',
          patterns: [{ ...mockTradePattern, confluence: false }]
        }
      ];
      
      const confluenceTrades = patternRecognitionService.filterTradesByPatternConfluence(
        tradesWithConfluence, 
        true
      );
      
      expect(confluenceTrades).toHaveLength(1);
    });

    it('should search patterns by description', () => {
      const tradesWithDescriptions: Trade[] = [
        {
          ...mockTrade,
          patterns: [{ ...mockTradePattern, description: 'Strong doji at resistance' }]
        },
        {
          ...mockTrade,
          id: 'trade-2',
          patterns: [{ ...mockTradePattern, description: 'Weak hammer pattern' }]
        }
      ];
      
      const searchResults = patternRecognitionService.searchPatterns(tradesWithDescriptions, 'strong');
      
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].id).toBe('test-trade-1');
    });

    it('should get unique timeframes from patterns', () => {
      const tradesWithTimeframes: Trade[] = [
        {
          ...mockTrade,
          patterns: [{ ...mockTradePattern, timeframe: 'H1' }]
        },
        {
          ...mockTrade,
          id: 'trade-2',
          patterns: [{ ...mockTradePattern, timeframe: 'H4' }]
        },
        {
          ...mockTrade,
          id: 'trade-3',
          patterns: [{ ...mockTradePattern, timeframe: 'H1' }] // Duplicate
        }
      ];
      
      const timeframes = patternRecognitionService.getPatternTimeframes(tradesWithTimeframes);
      
      expect(timeframes).toEqual(['H1', 'H4']);
    });
  });

  describe('Market Condition Correlation Analysis', () => {
    const mockTrades: Trade[] = [
      {
        ...mockTrade,
        pnl: 100,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI }],
        setup: { 
          id: 'setup-1', 
          type: 'TREND_CONTINUATION' as any, 
          timeframe: 'H1', 
          marketCondition: 'trending', 
          quality: 4, 
          confluence: [] 
        }
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: -50,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI }],
        setup: { 
          id: 'setup-2', 
          type: 'RANGE_BREAKOUT' as any, 
          timeframe: 'H1', 
          marketCondition: 'ranging', 
          quality: 3, 
          confluence: [] 
        }
      }
    ];

    it('should analyze pattern market condition correlation', () => {
      const correlation = patternRecognitionService.analyzePatternMarketConditionCorrelation(mockTrades);
      
      expect(correlation).toBeDefined();
      expect(correlation['trending']).toBeDefined();
      expect(correlation['ranging']).toBeDefined();
      expect(correlation['trending'][PatternType.DOJI]).toBe(100);
      expect(correlation['ranging'][PatternType.DOJI]).toBe(0);
    });

    it('should get best patterns for market condition', () => {
      const bestPatterns = patternRecognitionService.getBestPatternsForMarketCondition(
        mockTrades, 
        'trending', 
        3
      );
      
      expect(Array.isArray(bestPatterns)).toBe(true);
      expect(bestPatterns.length).toBeLessThanOrEqual(3);
      
      if (bestPatterns.length > 0) {
        expect(bestPatterns[0]).toHaveProperty('patternType');
        expect(bestPatterns[0]).toHaveProperty('successRate');
        expect(bestPatterns[0]).toHaveProperty('totalTrades');
      }
    });

    it('should analyze pattern confluence with market conditions', () => {
      const analysis = patternRecognitionService.analyzePatternConfluenceWithMarketConditions(mockTrades);
      
      expect(analysis).toBeDefined();
      expect(analysis['trending']).toBeDefined();
      expect(analysis['ranging']).toBeDefined();
      expect(analysis['trending']).toHaveProperty('averageConfluence');
      expect(analysis['trending']).toHaveProperty('successRate');
    });
  });

  describe('Pattern Comparison and Analysis', () => {
    const mockTrades: Trade[] = [
      {
        ...mockTrade,
        pnl: 100,
        patterns: [{ ...mockTradePattern, type: PatternType.DOJI }]
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: 75,
        patterns: [{ ...mockTradePattern, type: PatternType.HAMMER }]
      }
    ];

    it('should compare performance between pattern types', () => {
      const comparison = patternRecognitionService.comparePatternPerformance(
        mockTrades, 
        [PatternType.DOJI, PatternType.HAMMER]
      );
      
      expect(comparison[PatternType.DOJI]).toBeDefined();
      expect(comparison[PatternType.HAMMER]).toBeDefined();
      expect(comparison[PatternType.DOJI].totalTrades).toBe(1);
      expect(comparison[PatternType.HAMMER].totalTrades).toBe(1);
    });

    it('should identify best performing patterns', () => {
      const bestPatterns = patternRecognitionService.getBestPerformingPatterns(mockTrades, 2);
      
      expect(Array.isArray(bestPatterns)).toBe(true);
      expect(bestPatterns.length).toBeLessThanOrEqual(2);
      
      if (bestPatterns.length > 1) {
        // Should be sorted by performance
        expect(bestPatterns[0].analytics.profitFactor).toBeGreaterThanOrEqual(
          bestPatterns[1].analytics.profitFactor
        );
      }
    });

    it('should provide pattern recommendations', () => {
      const recommendations = patternRecognitionService.getPatternRecommendations(
        mockTrades, 
        'trending'
      );
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(3);
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('patternType');
        expect(rec).toHaveProperty('confidence');
        expect(rec).toHaveProperty('reason');
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should suggest patterns based on market data', () => {
      const marketData = {
        condition: 'trending',
        timeframe: 'H1',
        volatility: 0.8
      };
      
      const suggestions = patternRecognitionService.suggestPatterns(marketData);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should include trending patterns
      expect(suggestions).toContain(PatternType.FLAG);
      expect(suggestions).toContain(PatternType.PENNANT);
      
      // Should include high volatility patterns
      expect(suggestions).toContain(PatternType.PIN_BAR);
      expect(suggestions).toContain(PatternType.ENGULFING);
    });
  });

  describe('Custom Pattern Management', () => {
    const mockCustomPattern: Omit<CustomPattern, 'id'> = {
      name: 'My Custom Pattern',
      description: 'A custom chart pattern',
      category: PatternCategory.CUSTOM,
      rules: ['Rule 1', 'Rule 2'],
      reliability: 75,
      timeframes: ['H1', 'H4'],
      marketConditions: ['trending', 'breakout'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should add custom pattern', async () => {
      const mockDocRef = { id: 'custom-pattern-1' };
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      
      const patternId = await patternRecognitionService.addCustomPattern('user-1', mockCustomPattern);
      
      expect(patternId).toBe('custom-pattern-1');
      expect(addDoc).toHaveBeenCalled();
    });

    it('should handle errors when adding custom pattern', async () => {
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockRejectedValue(new Error('Firebase error'));
      
      await expect(
        patternRecognitionService.addCustomPattern('user-1', mockCustomPattern)
      ).rejects.toThrow('Firebase error');
    });

    it('should get custom patterns for user', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'pattern-1',
            data: () => ({
              ...mockCustomPattern,
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() }
            })
          }
        ]
      };
      
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);
      
      const patterns = await patternRecognitionService.getCustomPatterns('user-1');
      
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns).toHaveLength(1);
      expect(patterns[0].id).toBe('pattern-1');
    });

    it('should update custom pattern', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      
      await patternRecognitionService.updateCustomPattern('user-1', 'pattern-1', {
        name: 'Updated Pattern Name'
      });
      
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should delete custom pattern', async () => {
      const { deleteDoc } = await import('firebase/firestore');
      vi.mocked(deleteDoc).mockResolvedValue(undefined);
      
      await patternRecognitionService.deleteCustomPattern('user-1', 'pattern-1');
      
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should get custom patterns by category', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'pattern-1',
            data: () => ({
              ...mockCustomPattern,
              category: PatternCategory.CUSTOM,
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() }
            })
          }
        ]
      };
      
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);
      
      const patterns = await patternRecognitionService.getCustomPatternsByCategory('user-1', PatternCategory.CUSTOM);
      
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns).toHaveLength(1);
      expect(patterns[0].category).toBe(PatternCategory.CUSTOM);
    });
  });
});
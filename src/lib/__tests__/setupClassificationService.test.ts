import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupClassificationService } from '../setupClassificationService';
import { SetupType, Trade, TradeSetup, CustomSetup, ConfluenceFactor } from '../../types/trade';

// Mock Firebase functions
vi.mock('firebase/firestore');

describe('SetupClassificationService', () => {
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
    riskAmount: 33.33,
    setup: {
      id: 'setup-1',
      type: SetupType.TREND_CONTINUATION,
      timeframe: 'H1',
      marketCondition: 'trending',
      quality: 4,
      confluence: [
        {
          id: 'conf-1',
          name: 'Multiple timeframe alignment',
          category: 'technical',
          weight: 4,
          description: 'All timeframes aligned'
        }
      ]
    }
  };

  const mockTradeSetup: TradeSetup = {
    id: 'setup-test',
    type: SetupType.PULLBACK_ENTRY,
    timeframe: 'H4',
    marketCondition: 'trending',
    quality: 3,
    confluence: [
      {
        id: 'conf-test',
        name: 'Fibonacci retracement',
        category: 'technical',
        weight: 3,
        description: '61.8% retracement level'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Predefined Setup Management', () => {
    it('should return all predefined setup types', () => {
      const setupTypes = setupClassificationService.getPredefinedSetupTypes();
      
      expect(setupTypes).toContain(SetupType.TREND_CONTINUATION);
      expect(setupTypes).toContain(SetupType.PULLBACK_ENTRY);
      expect(setupTypes).toContain(SetupType.BREAKOUT_CONTINUATION);
      expect(setupTypes).toContain(SetupType.SUPPORT_RESISTANCE_BOUNCE);
      expect(setupTypes.length).toBeGreaterThan(0);
    });

    it('should return setup type description', () => {
      const description = setupClassificationService.getSetupTypeDescription(SetupType.TREND_CONTINUATION);
      
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('should return default description for unknown setup type', () => {
      const description = setupClassificationService.getSetupTypeDescription('unknown' as SetupType);
      
      expect(description).toBe('Custom setup type');
    });

    it('should return all predefined confluence factors', () => {
      const factors = setupClassificationService.getPredefinedConfluenceFactors();
      
      expect(Array.isArray(factors)).toBe(true);
      expect(factors.length).toBeGreaterThan(0);
      
      factors.forEach(factor => {
        expect(factor).toHaveProperty('id');
        expect(factor).toHaveProperty('name');
        expect(factor).toHaveProperty('category');
        expect(factor).toHaveProperty('weight');
        expect(factor).toHaveProperty('description');
      });
    });

    it('should filter confluence factors by category', () => {
      const technicalFactors = setupClassificationService.getConfluenceFactorsByCategory('technical');
      const fundamentalFactors = setupClassificationService.getConfluenceFactorsByCategory('fundamental');
      
      expect(Array.isArray(technicalFactors)).toBe(true);
      expect(Array.isArray(fundamentalFactors)).toBe(true);
      
      technicalFactors.forEach(factor => {
        expect(factor.category).toBe('technical');
      });
      
      fundamentalFactors.forEach(factor => {
        expect(factor.category).toBe('fundamental');
      });
    });
  });

  describe('Setup Validation', () => {
    it('should validate a correct trade setup', () => {
      const result = setupClassificationService.validateTradeSetup(mockTradeSetup);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidSetup: TradeSetup = {
        id: '',
        type: undefined as any,
        timeframe: '',
        marketCondition: undefined as any,
        quality: 0,
        confluence: []
      };
      
      const result = setupClassificationService.validateTradeSetup(invalidSetup);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Setup ID is required');
      expect(result.errors).toContain('Setup type is required');
      expect(result.errors).toContain('Timeframe is required');
      expect(result.errors).toContain('Market condition is required');
      expect(result.errors).toContain('Setup quality must be between 1 and 5');
    });

    it('should validate confluence factors', () => {
      const setupWithInvalidConfluence: TradeSetup = {
        ...mockTradeSetup,
        confluence: [
          {
            id: '',
            name: '',
            category: undefined as any,
            weight: 0,
            description: ''
          }
        ]
      };
      
      const result = setupClassificationService.validateTradeSetup(setupWithInvalidConfluence);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Confluence factor 1: ID is required');
      expect(result.errors).toContain('Confluence factor 1: Name is required');
      expect(result.errors).toContain('Confluence factor 1: Category is required');
      expect(result.errors).toContain('Confluence factor 1: Weight must be between 1 and 5');
    });

    it('should provide warnings for setup optimization', () => {
      const setupWithManyFactors: TradeSetup = {
        ...mockTradeSetup,
        confluence: Array(10).fill(0).map((_, i) => ({
          id: `conf-${i}`,
          name: `Factor ${i}`,
          category: 'technical' as const,
          weight: 1,
          description: `Description ${i}`
        }))
      };
      
      const result = setupClassificationService.validateTradeSetup(setupWithManyFactors);
      
      expect(result.warnings).toContain('Consider limiting confluence factors to 8 or fewer for better analysis');
      expect(result.warnings).toContain('Low total confluence weight may indicate weak setup');
    });

    it('should require custom setup details for CUSTOM type', () => {
      const customSetup: TradeSetup = {
        ...mockTradeSetup,
        type: SetupType.CUSTOM,
        customSetup: undefined
      };
      
      const result = setupClassificationService.validateTradeSetup(customSetup);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Custom setup details are required when setup type is CUSTOM');
    });
  });

  describe('Setup Performance Calculation', () => {
    const mockTrades: Trade[] = [
      {
        ...mockTrade,
        id: 'trade-1',
        pnl: 100,
        rMultiple: 2.0,
        setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION }
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: -50,
        rMultiple: -1.0,
        setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION }
      },
      {
        ...mockTrade,
        id: 'trade-3',
        pnl: 75,
        rMultiple: 1.5,
        setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION }
      },
      {
        ...mockTrade,
        id: 'trade-4',
        pnl: 25,
        rMultiple: 0.5,
        setup: { ...mockTrade.setup!, type: SetupType.PULLBACK_ENTRY }
      }
    ];

    it('should calculate setup performance metrics correctly', () => {
      const metrics = setupClassificationService.calculateSetupPerformance(
        SetupType.TREND_CONTINUATION, 
        mockTrades
      );
      
      expect(metrics.totalTrades).toBe(3);
      expect(metrics.winRate).toBeCloseTo(66.67, 1); // 2 wins out of 3 trades
      expect(metrics.averageRMultiple).toBe(1.5); // (2.0 + (-1.0) + 1.5) / 3
      expect(metrics.profitFactor).toBe(175/50); // 175 total wins / 50 total losses
    });

    it('should return zero metrics for setup with no trades', () => {
      const metrics = setupClassificationService.calculateSetupPerformance(
        SetupType.RANGE_BREAKOUT, 
        mockTrades
      );
      
      expect(metrics.totalTrades).toBe(0);
      expect(metrics.winRate).toBe(0);
      expect(metrics.averageRMultiple).toBe(0);
      expect(metrics.profitFactor).toBe(0);
      expect(metrics.averageHoldTime).toBe(0);
    });

    it('should calculate hold time correctly', () => {
      const tradesWithTime: Trade[] = [
        {
          ...mockTrade,
          timeIn: '09:00',
          timeOut: '11:00', // 2 hours
          setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION }
        },
        {
          ...mockTrade,
          id: 'trade-2',
          timeIn: '10:00',
          timeOut: '14:00', // 4 hours
          setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION }
        }
      ];
      
      const metrics = setupClassificationService.calculateSetupPerformance(
        SetupType.TREND_CONTINUATION, 
        tradesWithTime
      );
      
      expect(metrics.averageHoldTime).toBe(3); // (2 + 4) / 2 = 3 hours
    });

    it('should identify best and worst performing timeframes', () => {
      const tradesWithTimeframes: Trade[] = [
        {
          ...mockTrade,
          pnl: 100,
          setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION, timeframe: 'H1' }
        },
        {
          ...mockTrade,
          id: 'trade-2',
          pnl: -50,
          setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION, timeframe: 'H4' }
        }
      ];
      
      const metrics = setupClassificationService.calculateSetupPerformance(
        SetupType.TREND_CONTINUATION, 
        tradesWithTimeframes
      );
      
      expect(metrics.bestPerformingTimeframe).toBe('H1');
      expect(metrics.worstPerformingTimeframe).toBe('H4');
    });
  });

  describe('Setup Analytics', () => {
    it('should calculate comprehensive setup analytics', () => {
      const mockTrades: Trade[] = [
        {
          ...mockTrade,
          pnl: 100,
          setup: { 
            ...mockTrade.setup!, 
            type: SetupType.TREND_CONTINUATION,
            marketCondition: 'trending',
            timeframe: 'H1'
          }
        },
        {
          ...mockTrade,
          id: 'trade-2',
          pnl: -50,
          setup: { 
            ...mockTrade.setup!, 
            type: SetupType.TREND_CONTINUATION,
            marketCondition: 'ranging',
            timeframe: 'H4'
          }
        }
      ];
      
      const analytics = setupClassificationService.calculateSetupAnalytics(
        SetupType.TREND_CONTINUATION, 
        mockTrades
      );
      
      expect(analytics.setupType).toBe(SetupType.TREND_CONTINUATION);
      expect(analytics.totalTrades).toBe(2);
      expect(analytics.winRate).toBe(50); // 1 win out of 2 trades
      expect(analytics.marketConditionPerformance).toBeDefined();
      expect(analytics.marketConditionPerformance.trending).toBeDefined();
      expect(analytics.marketConditionPerformance.ranging).toBeDefined();
    });
  });

  describe('Setup Comparison and Analysis', () => {
    const mockTrades: Trade[] = [
      {
        ...mockTrade,
        pnl: 100,
        setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION }
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: 75,
        setup: { ...mockTrade.setup!, type: SetupType.PULLBACK_ENTRY }
      },
      {
        ...mockTrade,
        id: 'trade-3',
        pnl: -25,
        setup: { ...mockTrade.setup!, type: SetupType.TREND_CONTINUATION }
      }
    ];

    it('should compare performance between setup types', () => {
      const comparison = setupClassificationService.compareSetupPerformance(
        mockTrades, 
        [SetupType.TREND_CONTINUATION, SetupType.PULLBACK_ENTRY]
      );
      
      expect(comparison[SetupType.TREND_CONTINUATION]).toBeDefined();
      expect(comparison[SetupType.PULLBACK_ENTRY]).toBeDefined();
      expect(comparison[SetupType.TREND_CONTINUATION].totalTrades).toBe(2);
      expect(comparison[SetupType.PULLBACK_ENTRY].totalTrades).toBe(1);
    });

    it('should identify best performing setups', () => {
      const bestSetups = setupClassificationService.getBestPerformingSetups(mockTrades, 2);
      
      expect(Array.isArray(bestSetups)).toBe(true);
      expect(bestSetups.length).toBeLessThanOrEqual(2);
      
      if (bestSetups.length > 1) {
        // Should be sorted by performance (profit factor, then win rate)
        expect(bestSetups[0].metrics.profitFactor).toBeGreaterThanOrEqual(
          bestSetups[1].metrics.profitFactor
        );
      }
    });

    it('should calculate confluence score correctly', () => {
      const confluenceFactors: ConfluenceFactor[] = [
        { id: '1', name: 'Factor 1', category: 'technical', weight: 4, description: 'Test' },
        { id: '2', name: 'Factor 2', category: 'fundamental', weight: 3, description: 'Test' }
      ];
      
      const score = setupClassificationService.calculateConfluenceScore(confluenceFactors);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return zero confluence score for empty factors', () => {
      const score = setupClassificationService.calculateConfluenceScore([]);
      expect(score).toBe(0);
    });

    it('should provide setup recommendations based on performance', () => {
      const recommendations = setupClassificationService.getSetupRecommendations(
        mockTrades, 
        'trending'
      );
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(3);
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('setupType');
        expect(rec).toHaveProperty('confidence');
        expect(rec).toHaveProperty('reason');
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Custom Setup Management', () => {
    const mockCustomSetup: Omit<CustomSetup, 'id'> = {
      name: 'My Custom Setup',
      description: 'A custom trading setup',
      category: 'trend_following',
      confluenceFactors: ['factor1', 'factor2'],
      rules: ['Rule 1', 'Rule 2'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should add custom setup', async () => {
      const mockDocRef = { id: 'custom-setup-1' };
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      
      const setupId = await setupClassificationService.addCustomSetup('user-1', mockCustomSetup);
      
      expect(setupId).toBe('custom-setup-1');
      expect(addDoc).toHaveBeenCalled();
    });

    it('should handle errors when adding custom setup', async () => {
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockRejectedValue(new Error('Firebase error'));
      
      await expect(
        setupClassificationService.addCustomSetup('user-1', mockCustomSetup)
      ).rejects.toThrow('Firebase error');
    });

    it('should get custom setups for user', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'setup-1',
            data: () => ({
              ...mockCustomSetup,
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() }
            })
          }
        ]
      };
      
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);
      
      const setups = await setupClassificationService.getCustomSetups('user-1');
      
      expect(Array.isArray(setups)).toBe(true);
      expect(setups).toHaveLength(1);
      expect(setups[0].id).toBe('setup-1');
    });

    it('should update custom setup', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      
      await setupClassificationService.updateCustomSetup('user-1', 'setup-1', {
        name: 'Updated Setup Name'
      });
      
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should delete custom setup', async () => {
      const { deleteDoc } = await import('firebase/firestore');
      vi.mocked(deleteDoc).mockResolvedValue(undefined);
      
      await setupClassificationService.deleteCustomSetup('user-1', 'setup-1');
      
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
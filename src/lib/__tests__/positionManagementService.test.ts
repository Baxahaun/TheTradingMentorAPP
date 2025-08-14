import { describe, it, expect, beforeEach, vi } from 'vitest';
import { positionManagementService } from '../positionManagementService';
import { Trade, PartialClose, PositionEvent } from '../../types/trade';

// Mock Firebase functions
vi.mock('firebase/firestore');

describe('PositionManagementService', () => {
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
    partialCloses: []
  };

  const mockPartialClose: Omit<PartialClose, 'id' | 'remainingLots'> = {
    timestamp: '2024-01-15 09:30',
    lotSize: 0.3,
    price: 1.1025,
    reason: 'profit_taking',
    pnlRealized: 7.5,
    notes: 'Taking partial profit at resistance'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Partial Close Tracking', () => {
    it('should add partial close to trade', () => {
      const partialClose = positionManagementService.addPartialClose(mockTrade, mockPartialClose);
      
      expect(partialClose).toHaveProperty('id');
      expect(partialClose.lotSize).toBe(0.3);
      expect(partialClose.price).toBe(1.1025);
      expect(partialClose.remainingLots).toBe(0.7); // 1.0 - 0.3
      expect(partialClose.reason).toBe('profit_taking');
    });

    it('should calculate remaining lots correctly with multiple partial closes', () => {
      const tradeWithPartials: Trade = {
        ...mockTrade,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.2,
            price: 1.1020,
            reason: 'risk_reduction',
            remainingLots: 0.8,
            pnlRealized: 4.0
          }
        ]
      };
      
      const partialClose = positionManagementService.addPartialClose(tradeWithPartials, mockPartialClose);
      
      expect(partialClose.remainingLots).toBe(0.5); // 1.0 - 0.2 - 0.3
    });

    it('should throw error when partial close exceeds remaining position', () => {
      const largePartialClose = {
        ...mockPartialClose,
        lotSize: 1.5 // Exceeds trade lot size of 1.0
      };
      
      expect(() => {
        positionManagementService.addPartialClose(mockTrade, largePartialClose);
      }).toThrow('Partial close lot size exceeds remaining position');
    });

    it('should throw error for invalid partial close data', () => {
      const invalidPartialClose = {
        ...mockPartialClose,
        lotSize: 0, // Invalid lot size
        price: -1.0 // Invalid price
      };
      
      expect(() => {
        positionManagementService.addPartialClose(mockTrade, invalidPartialClose);
      }).toThrow('Invalid partial close');
    });
  });

  describe('Remaining Position Calculation', () => {
    it('should calculate remaining position correctly', () => {
      const tradeWithPartials: Trade = {
        ...mockTrade,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.3,
            price: 1.1020,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: 6.0
          },
          {
            id: 'pc-2',
            timestamp: '2024-01-15T09:25:00Z',
            lotSize: 0.2,
            price: 1.1030,
            reason: 'risk_reduction',
            remainingLots: 0.5,
            pnlRealized: 6.0
          }
        ]
      };
      
      const summary = positionManagementService.calculateRemainingPosition(tradeWithPartials);
      
      expect(summary.totalLots).toBe(0.5); // 1.0 - 0.3 - 0.2
      expect(summary.realizedPnL).toBe(12.0); // 6.0 + 6.0
      expect(summary.averageEntryPrice).toBe(1.1000);
      expect(summary.riskAmount).toBe(33.33);
    });

    it('should calculate weighted average entry price with scaling entries', () => {
      const tradeWithScaling: Trade = {
        ...mockTrade,
        positionHistory: [
          {
            id: 'entry-1',
            timestamp: '2024-01-15T09:00:00Z',
            type: 'entry',
            lotSize: 0.5,
            price: 1.1000,
            totalPosition: 0.5,
            averagePrice: 1.1000
          },
          {
            id: 'entry-2',
            timestamp: '2024-01-15T09:05:00Z',
            type: 'entry',
            lotSize: 0.5,
            price: 1.0990,
            totalPosition: 1.0,
            averagePrice: 1.0995
          }
        ]
      };
      
      const summary = positionManagementService.calculateRemainingPosition(tradeWithScaling);
      
      expect(summary.averageEntryPrice).toBe(1.0995); // (0.5 * 1.1000 + 0.5 * 1.0990) / 1.0
    });

    it('should calculate current R-Multiple correctly', () => {
      const tradeWithPartials: Trade = {
        ...mockTrade,
        riskAmount: 50,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.5,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.5,
            pnlRealized: 12.5
          }
        ]
      };
      
      const summary = positionManagementService.calculateRemainingPosition(tradeWithPartials);
      
      expect(summary.currentRMultiple).toBe(0.25); // 12.5 realized / 50 risk
    });
  });

  describe('Position Timeline Generation', () => {
    it('should generate timeline with initial entry', () => {
      const timeline = positionManagementService.generatePositionTimeline(mockTrade);
      
      expect(timeline).toHaveLength(2); // Entry + Exit
      expect(timeline[0].type).toBe('entry');
      expect(timeline[0].lotSize).toBe(1.0);
      expect(timeline[0].price).toBe(1.1000);
      expect(timeline[0].totalPosition).toBe(1.0);
    });

    it('should include partial closes in timeline', () => {
      const tradeWithPartials: Trade = {
        ...mockTrade,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.3,
            price: 1.1020,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: 6.0
          }
        ]
      };
      
      const timeline = positionManagementService.generatePositionTimeline(tradeWithPartials);
      
      expect(timeline).toHaveLength(3); // Entry + Partial + Exit
      expect(timeline[1].type).toBe('partial_close');
      expect(timeline[1].lotSize).toBe(-0.3); // Negative for reduction
      expect(timeline[1].totalPosition).toBe(0.7);
    });

    it('should include position history events', () => {
      const tradeWithHistory: Trade = {
        ...mockTrade,
        positionHistory: [
          {
            id: 'stop-adj-1',
            timestamp: '2024-01-15T09:20:00Z',
            type: 'stop_adjustment',
            lotSize: 0,
            price: 1.0980,
            totalPosition: 1.0,
            averagePrice: 1.1000
          }
        ]
      };
      
      const timeline = positionManagementService.generatePositionTimeline(tradeWithHistory);
      
      expect(timeline.some(event => event.type === 'stop_adjustment')).toBe(true);
    });

    it('should sort timeline events by timestamp', () => {
      const tradeWithMultipleEvents: Trade = {
        ...mockTrade,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:25:00Z', // Later
            lotSize: 0.3,
            price: 1.1030,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: 9.0
          }
        ],
        positionHistory: [
          {
            id: 'stop-adj-1',
            timestamp: '2024-01-15T09:10:00Z', // Earlier
            type: 'stop_adjustment',
            lotSize: 0,
            price: 1.0980,
            totalPosition: 1.0,
            averagePrice: 1.1000
          }
        ]
      };
      
      const timeline = positionManagementService.generatePositionTimeline(tradeWithMultipleEvents);
      
      // Should be sorted: entry, stop adjustment, partial close, exit
      expect(timeline[0].type).toBe('entry');
      expect(timeline[1].type).toBe('stop_adjustment');
      expect(timeline[2].type).toBe('partial_close');
      expect(timeline[3].type).toBe('full_close');
    });
  });

  describe('Validation', () => {
    it('should validate correct partial close data', () => {
      const result = positionManagementService.validatePartialClose(mockPartialClose, mockTrade);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidPartialClose = {
        timestamp: '',
        lotSize: 0,
        price: 0,
        reason: undefined as any,
        pnlRealized: 0
      };
      
      const result = positionManagementService.validatePartialClose(invalidPartialClose, mockTrade);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Partial close timestamp is required');
      expect(result.errors).toContain('Partial close lot size must be greater than 0');
      expect(result.errors).toContain('Partial close price must be greater than 0');
      expect(result.errors).toContain('Partial close reason is required');
    });

    it('should validate lot size against remaining position', () => {
      const tradeWithPartials: Trade = {
        ...mockTrade,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.7,
            price: 1.1020,
            reason: 'profit_taking',
            remainingLots: 0.3,
            pnlRealized: 14.0
          }
        ]
      };
      
      const largePartialClose = {
        ...mockPartialClose,
        lotSize: 0.5 // Exceeds remaining 0.3
      };
      
      const result = positionManagementService.validatePartialClose(largePartialClose, tradeWithPartials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Partial close lot size (0.5) exceeds remaining position (0.3)');
    });

    it('should validate timestamp sequence', () => {
      const earlyPartialClose = {
        ...mockPartialClose,
        timestamp: '2024-01-15T08:30:00Z' // Before trade entry at 09:00
      };
      
      const result = positionManagementService.validatePartialClose(earlyPartialClose, mockTrade);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Partial close timestamp cannot be before trade entry time');
    });

    it('should provide warnings for optimization', () => {
      const fullSizePartialClose = {
        ...mockPartialClose,
        lotSize: 1.0 // Equal to full position
      };
      
      const result = positionManagementService.validatePartialClose(fullSizePartialClose, mockTrade);
      
      expect(result.warnings).toContain('Partial close size is equal to or greater than original position - consider using full close instead');
    });

    it('should warn about significant price differences', () => {
      const highPricePartialClose = {
        ...mockPartialClose,
        price: 1.2100 // 10% higher than entry price
      };
      
      const result = positionManagementService.validatePartialClose(highPricePartialClose, mockTrade);
      
      expect(result.warnings).toContain('Partial close price differs significantly from entry price - please verify');
    });
  });

  describe('Position Management Scoring', () => {
    it('should return zero score for trades without partial closes', () => {
      const score = positionManagementService.calculatePositionManagementScore(mockTrade);
      expect(score).toBe(0);
    });

    it('should return zero score for open trades', () => {
      const openTrade: Trade = {
        ...mockTrade,
        status: 'open',
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.3,
            price: 1.1020,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: 6.0
          }
        ]
      };
      
      const score = positionManagementService.calculatePositionManagementScore(openTrade);
      expect(score).toBe(0);
    });

    it('should calculate score for profitable partial closes', () => {
      const tradeWithProfitablePartials: Trade = {
        ...mockTrade,
        pnl: 50,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.5,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.5,
            pnlRealized: 25.0 // 50% of total profit
          }
        ]
      };
      
      const score = positionManagementService.calculatePositionManagementScore(tradeWithProfitablePartials);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher scores for risk reduction', () => {
      const tradeWithRiskReduction: Trade = {
        ...mockTrade,
        pnl: 50,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.3,
            price: 1.1020,
            reason: 'risk_reduction',
            remainingLots: 0.7,
            pnlRealized: 6.0
          }
        ]
      };
      
      const tradeWithoutRiskReduction: Trade = {
        ...mockTrade,
        pnl: 50,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:15:00Z',
            lotSize: 0.3,
            price: 1.1020,
            reason: 'manual',
            remainingLots: 0.7,
            pnlRealized: 6.0
          }
        ]
      };
      
      const scoreWithRiskReduction = positionManagementService.calculatePositionManagementScore(tradeWithRiskReduction);
      const scoreWithoutRiskReduction = positionManagementService.calculatePositionManagementScore(tradeWithoutRiskReduction);
      
      expect(scoreWithRiskReduction).toBeGreaterThan(scoreWithoutRiskReduction);
    });

    it('should consider timing efficiency in scoring', () => {
      const wellTimedTrade: Trade = {
        ...mockTrade,
        timeIn: '09:00',
        timeOut: '11:00', // 2 hours total
        pnl: 50,
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:45:00Z', // 75% through trade (good timing)
            lotSize: 0.5,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.5,
            pnlRealized: 25.0
          }
        ]
      };
      
      const score = positionManagementService.calculatePositionManagementScore(wellTimedTrade);
      
      expect(score).toBeGreaterThan(50); // Should get good timing bonus
    });
  });

  describe('Exit Efficiency Analysis', () => {
    const mockTradesWithPartials: Trade[] = [
      {
        ...mockTrade,
        id: 'trade-1',
        pnl: 100,
        timeIn: '09:00',
        timeOut: '11:00',
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:30:00Z',
            lotSize: 0.5,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.5,
            pnlRealized: 50.0
          }
        ]
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: -25,
        timeIn: '10:00',
        timeOut: '12:00',
        partialCloses: [
          {
            id: 'pc-2',
            timestamp: '2024-01-15T10:30:00Z',
            lotSize: 0.3,
            price: 1.0990,
            reason: 'risk_reduction',
            remainingLots: 0.7,
            pnlRealized: -3.0
          }
        ]
      }
    ];

    it('should calculate exit efficiency analytics', () => {
      const analytics = positionManagementService.calculateExitEfficiency(mockTradesWithPartials);
      
      expect(analytics.averageExitEfficiency).toBeGreaterThan(0);
      expect(analytics.partialCloseSuccess).toBeGreaterThanOrEqual(0);
      expect(analytics.partialCloseSuccess).toBeLessThanOrEqual(100);
      expect(analytics.positionHoldTime.average).toBeGreaterThan(0);
      expect(analytics.exitReasons).toBeDefined();
    });

    it('should return zero analytics for trades without partials', () => {
      const tradesWithoutPartials: Trade[] = [mockTrade];
      const analytics = positionManagementService.calculateExitEfficiency(tradesWithoutPartials);
      
      expect(analytics.averageExitEfficiency).toBe(0);
      expect(analytics.partialCloseSuccess).toBe(0);
      expect(analytics.positionHoldTime.average).toBe(0);
    });

    it('should calculate hold times by profitability', () => {
      const analytics = positionManagementService.calculateExitEfficiency(mockTradesWithPartials);
      
      expect(analytics.positionHoldTime.byProfitability.winning).toBeGreaterThan(0);
      expect(analytics.positionHoldTime.byProfitability.losing).toBeGreaterThan(0);
    });

    it('should analyze exit reasons frequency', () => {
      const analytics = positionManagementService.calculateExitEfficiency(mockTradesWithPartials);
      
      expect(analytics.exitReasons['profit_taking']).toBe(1);
      expect(analytics.exitReasons['risk_reduction']).toBe(1);
    });
  });

  describe('Exit Optimization Recommendations', () => {
    const mockTradesForRecommendations: Trade[] = [
      {
        ...mockTrade,
        id: 'trade-1',
        pnl: 100,
        timeIn: '09:00',
        timeOut: '11:00',
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:30:00Z',
            lotSize: 0.3,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: 30.0
          }
        ]
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: 75,
        timeIn: '10:00',
        timeOut: '12:00',
        partialCloses: [
          {
            id: 'pc-2',
            timestamp: '2024-01-15T10:45:00Z',
            lotSize: 0.4,
            price: 1.1030,
            reason: 'profit_taking',
            remainingLots: 0.6,
            pnlRealized: 40.0
          }
        ]
      }
    ];

    it('should generate exit optimization recommendations', () => {
      const recommendations = positionManagementService.generateExitOptimizationRecommendations(
        mockTradesForRecommendations
      );
      
      expect(recommendations.optimalPartialCloseLevel).toBeGreaterThan(0);
      expect(recommendations.optimalPartialCloseLevel).toBeLessThanOrEqual(1);
      expect(recommendations.recommendedHoldTime).toBeGreaterThan(0);
      expect(recommendations.suggestedExitStrategy).toBeDefined();
      expect(Array.isArray(recommendations.riskOptimizationTips)).toBe(true);
    });

    it('should provide appropriate exit strategy suggestions', () => {
      const recommendations = positionManagementService.generateExitOptimizationRecommendations(
        mockTradesForRecommendations
      );
      
      const validStrategies = [
        'Standard Exit',
        'Aggressive Partial Scaling',
        'Conservative Partial Scaling',
        'Focus on Full Position Exits'
      ];
      
      expect(validStrategies).toContain(recommendations.suggestedExitStrategy);
    });

    it('should provide risk optimization tips', () => {
      const recommendations = positionManagementService.generateExitOptimizationRecommendations(
        mockTradesForRecommendations
      );
      
      expect(recommendations.riskOptimizationTips.length).toBeGreaterThanOrEqual(0);
      
      recommendations.riskOptimizationTips.forEach(tip => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Scaling Entry Metrics', () => {
    it('should calculate metrics for single entry trade', () => {
      const metrics = positionManagementService.calculateScalingEntryMetrics(mockTrade);
      
      expect(metrics.totalEntries).toBe(1);
      expect(metrics.weightedAveragePrice).toBe(1.1000);
      expect(metrics.averageEntrySize).toBe(1.0);
      expect(metrics.entrySpread).toBe(0);
      expect(metrics.scalingEfficiency).toBe(0);
    });

    it('should calculate metrics for scaling entry trade', () => {
      const scalingTrade: Trade = {
        ...mockTrade,
        positionHistory: [
          {
            id: 'entry-1',
            timestamp: '2024-01-15T09:00:00Z',
            type: 'entry',
            lotSize: 0.5,
            price: 1.1000,
            totalPosition: 0.5,
            averagePrice: 1.1000
          },
          {
            id: 'entry-2',
            timestamp: '2024-01-15T09:05:00Z',
            type: 'entry',
            lotSize: 0.3,
            price: 1.0990,
            totalPosition: 0.8,
            averagePrice: 1.0996
          },
          {
            id: 'entry-3',
            timestamp: '2024-01-15T09:10:00Z',
            type: 'entry',
            lotSize: 0.2,
            price: 1.0985,
            totalPosition: 1.0,
            averagePrice: 1.0994
          }
        ]
      };
      
      const metrics = positionManagementService.calculateScalingEntryMetrics(scalingTrade);
      
      expect(metrics.totalEntries).toBe(3);
      expect(metrics.weightedAveragePrice).toBeCloseTo(1.0994, 4);
      expect(metrics.averageEntrySize).toBeCloseTo(0.333, 3);
      expect(metrics.entrySpread).toBe(0.0015); // 1.1000 - 1.0985
    });

    it('should calculate scaling efficiency for closed trades', () => {
      const scalingTrade: Trade = {
        ...mockTrade,
        pnl: 60, // Better than single entry would have been
        exitPrice: 1.1050,
        positionHistory: [
          {
            id: 'entry-1',
            timestamp: '2024-01-15T09:00:00Z',
            type: 'entry',
            lotSize: 0.5,
            price: 1.1000,
            totalPosition: 0.5,
            averagePrice: 1.1000
          },
          {
            id: 'entry-2',
            timestamp: '2024-01-15T09:05:00Z',
            type: 'entry',
            lotSize: 0.5,
            price: 1.0990,
            totalPosition: 1.0,
            averagePrice: 1.0995
          }
        ]
      };
      
      const metrics = positionManagementService.calculateScalingEntryMetrics(scalingTrade);
      
      expect(metrics.scalingEfficiency).toBeGreaterThan(100); // Better than single entry
    });
  });

  describe('Position Management Patterns Analysis', () => {
    const mockTradesForPatterns: Trade[] = [
      {
        ...mockTrade,
        id: 'trade-1',
        pnl: 100,
        timeIn: '09:00',
        timeOut: '11:00',
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:30:00Z',
            lotSize: 0.3,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: 30.0
          },
          {
            id: 'pc-2',
            timestamp: '2024-01-15T10:00:00Z',
            lotSize: 0.2,
            price: 1.1035,
            reason: 'profit_taking',
            remainingLots: 0.5,
            pnlRealized: 25.0
          }
        ]
      },
      {
        ...mockTrade,
        id: 'trade-2',
        pnl: 75,
        partialCloses: [
          {
            id: 'pc-3',
            timestamp: '2024-01-15T10:30:00Z',
            lotSize: 0.5,
            price: 1.1030,
            reason: 'risk_reduction',
            remainingLots: 0.5,
            pnlRealized: 40.0
          }
        ],
        positionHistory: [
          {
            id: 'entry-1',
            timestamp: '2024-01-15T10:00:00Z',
            type: 'entry',
            lotSize: 0.5,
            price: 1.1000,
            totalPosition: 0.5,
            averagePrice: 1.1000
          },
          {
            id: 'entry-2',
            timestamp: '2024-01-15T10:05:00Z',
            type: 'entry',
            lotSize: 0.5,
            price: 1.0995,
            totalPosition: 1.0,
            averagePrice: 1.0997
          }
        ]
      }
    ];

    it('should analyze position management patterns', () => {
      const patterns = positionManagementService.analyzePositionManagementPatterns(mockTradesForPatterns);
      
      expect(patterns.averagePartialsPerTrade).toBe(1.5); // (2 + 1) / 2
      expect(patterns.mostCommonPartialReason).toBe('profit_taking');
      expect(patterns.optimalPartialTiming).toBeGreaterThan(0);
      expect(patterns.optimalPartialTiming).toBeLessThanOrEqual(1);
      expect(patterns.partialSizeDistribution).toBeDefined();
      expect(patterns.scalingVsPartialPerformance).toBeDefined();
    });

    it('should analyze partial size distribution', () => {
      const patterns = positionManagementService.analyzePositionManagementPatterns(mockTradesForPatterns);
      
      expect(patterns.partialSizeDistribution['0-25%']).toBe(1); // 0.2 lot size
      expect(patterns.partialSizeDistribution['25-50%']).toBe(1); // 0.3 lot size
      expect(patterns.partialSizeDistribution['50-75%']).toBe(1); // 0.5 lot size
      expect(patterns.partialSizeDistribution['75-100%']).toBe(0);
    });

    it('should compare scaling vs partial performance', () => {
      const patterns = positionManagementService.analyzePositionManagementPatterns(mockTradesForPatterns);
      
      expect(patterns.scalingVsPartialPerformance.scalingTrades.count).toBe(1);
      expect(patterns.scalingVsPartialPerformance.partialTrades.count).toBe(2);
      expect(patterns.scalingVsPartialPerformance.bothTrades.count).toBe(1);
      
      expect(patterns.scalingVsPartialPerformance.scalingTrades.avgPnL).toBe(75);
      expect(patterns.scalingVsPartialPerformance.partialTrades.avgPnL).toBe(87.5);
      expect(patterns.scalingVsPartialPerformance.bothTrades.avgPnL).toBe(75);
    });
  });

  describe('Firebase Integration', () => {
    const mockPositionEvent: Omit<PositionEvent, 'id'> = {
      timestamp: '2024-01-15T09:30:00Z',
      type: 'partial_close',
      lotSize: -0.3,
      price: 1.1025,
      totalPosition: 0.7,
      averagePrice: 1.1000
    };

    it('should save position event to Firebase', async () => {
      const mockDocRef = { id: 'event-1' };
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      
      const eventId = await positionManagementService.savePositionEvent('user-1', 'trade-1', mockPositionEvent);
      
      expect(eventId).toBe('event-1');
      expect(addDoc).toHaveBeenCalled();
    });

    it('should get position events for a trade', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'event-1',
            data: () => ({
              ...mockPositionEvent,
              timestamp: { toDate: () => new Date() }
            })
          }
        ]
      };
      
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);
      
      const events = await positionManagementService.getPositionEvents('user-1', 'trade-1');
      
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('event-1');
    });

    it('should update position event', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      
      await positionManagementService.updatePositionEvent('user-1', 'event-1', {
        price: 1.1030
      });
      
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should delete position event', async () => {
      const { deleteDoc } = await import('firebase/firestore');
      vi.mocked(deleteDoc).mockResolvedValue(undefined);
      
      await positionManagementService.deletePositionEvent('user-1', 'event-1');
      
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should handle Firebase errors gracefully', async () => {
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockRejectedValue(new Error('Firebase error'));
      
      await expect(
        positionManagementService.savePositionEvent('user-1', 'trade-1', mockPositionEvent)
      ).rejects.toThrow('Firebase error');
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DisciplineTrackingService } from '../DisciplineTrackingService';
import { Trade } from '../../types/trade';
import { ProfessionalStrategy, StrategyDeviation } from '../../types/strategy';

describe('DisciplineTrackingService', () => {
  let service: DisciplineTrackingService;
  let mockTrade: Trade;
  let mockStrategy: ProfessionalStrategy;

  beforeEach(() => {
    service = DisciplineTrackingService.getInstance();
    
    mockTrade = {
      id: 'trade-1',
      symbol: 'EURUSD',
      entryPrice: 1.1000,
      exitPrice: 1.1050,
      quantity: 10000,
      side: 'long',
      entryTime: '2024-01-01T10:00:00Z',
      exitTime: '2024-01-01T11:00:00Z',
      pnl: 50,
      status: 'closed'
    } as Trade;

    mockStrategy = {
      id: 'strategy-1',
      title: 'Test Strategy',
      description: 'Test strategy for discipline tracking',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending',
        technicalConditions: ['RSI < 30'],
        volatilityRequirements: 'Medium'
      },
      entryTriggers: {
        primarySignal: 'Breakout',
        confirmationSignals: ['Volume spike'],
        timingCriteria: 'Market open'
      },
      riskManagement: {
        positionSizingMethod: { type: 'FixedPercentage', parameters: { percentage: 2 } },
        maxRiskPerTrade: 2,
        stopLossRule: { type: 'ATRBased', parameters: { multiplier: 2 }, description: '2x ATR' },
        takeProfitRule: { type: 'RiskRewardRatio', parameters: { ratio: 2 }, description: '2:1 RR' },
        riskRewardRatio: 2
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profitFactor: 0,
        expectancy: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        riskRewardRatio: 0,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        sampleSize: 0,
        confidenceLevel: 0,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Insufficient Data',
        lastCalculated: new Date().toISOString()
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      version: 1,
      isActive: true,
      color: '#3B82F6'
    };
  });

  describe('calculateTradeAdherence', () => {
    it('should return 100% for perfect adherence (no deviations)', () => {
      const adherence = service.calculateTradeAdherence(mockTrade, mockStrategy, []);
      expect(adherence).toBe(100);
    });

    it('should calculate adherence score with minor deviations', () => {
      const deviations: StrategyDeviation[] = [
        {
          type: 'EntryTiming',
          planned: '10:00',
          actual: '10:05',
          impact: 'Neutral',
          description: 'Entered 5 minutes late'
        }
      ];

      const adherence = service.calculateTradeAdherence(mockTrade, mockStrategy, deviations);
      expect(adherence).toBe(90); // 100 - 10 (EntryTiming penalty)
    });

    it('should calculate adherence score with major deviations', () => {
      const deviations: StrategyDeviation[] = [
        {
          type: 'PositionSize',
          planned: '2%',
          actual: '4%',
          impact: 'Negative',
          description: 'Position size doubled'
        },
        {
          type: 'StopLoss',
          planned: '1.0950',
          actual: '1.0900',
          impact: 'Negative',
          description: 'Stop loss moved further'
        }
      ];

      const adherence = service.calculateTradeAdherence(mockTrade, mockStrategy, deviations);
      // 100 - (20 * 1.5) - (25 * 1.5) = 100 - 30 - 37.5 = 32.5
      expect(adherence).toBe(32.5);
    });

    it('should not return negative adherence scores', () => {
      const deviations: StrategyDeviation[] = [
        {
          type: 'RiskManagement',
          planned: 'Follow rules',
          actual: 'Ignored all rules',
          impact: 'Negative',
          description: 'Complete rule violation'
        },
        {
          type: 'PositionSize',
          planned: '2%',
          actual: '10%',
          impact: 'Negative',
          description: 'Massive position size'
        },
        {
          type: 'StopLoss',
          planned: 'Use stop',
          actual: 'No stop',
          impact: 'Negative',
          description: 'No stop loss used'
        }
      ];

      const adherence = service.calculateTradeAdherence(mockTrade, mockStrategy, deviations);
      expect(adherence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updateDisciplineMetrics', () => {
    it('should initialize metrics for new user', async () => {
      const userId = 'new-user';
      const reinforcements = await service.updateDisciplineMetrics(
        userId,
        mockTrade,
        mockStrategy,
        100,
        []
      );

      const metrics = await service.getDisciplineMetrics(userId);
      expect(metrics.adherenceScore.overall).toBe(100);
      expect(metrics.streaks.adherentTrades.current).toBe(1);
      expect(metrics.totalPoints).toBeGreaterThan(0);
    });

    it('should update adherence scores correctly', async () => {
      const userId = 'test-user';
      
      // First trade with perfect adherence
      await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 100, []);
      let metrics = await service.getDisciplineMetrics(userId);
      expect(metrics.adherenceScore.overall).toBe(100);

      // Second trade with lower adherence
      await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 80, []);
      metrics = await service.getDisciplineMetrics(userId);
      
      // Should be weighted average: (100 * 0.9) + (80 * 0.1) = 98
      expect(metrics.adherenceScore.overall).toBe(98);
    });

    it('should update streaks correctly for adherent trades', async () => {
      const userId = 'streak-user';
      
      // Execute 3 adherent trades
      for (let i = 0; i < 3; i++) {
        await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 90, []);
      }

      const metrics = await service.getDisciplineMetrics(userId);
      expect(metrics.streaks.adherentTrades.current).toBe(3);
      expect(metrics.streaks.adherentTrades.longest).toBe(3);
    });

    it('should break streaks for non-adherent trades', async () => {
      const userId = 'break-streak-user';
      
      // Build up a streak
      for (let i = 0; i < 5; i++) {
        await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 90, []);
      }

      let metrics = await service.getDisciplineMetrics(userId);
      expect(metrics.streaks.adherentTrades.current).toBe(5);

      // Break the streak with poor adherence
      await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 60, []);
      
      metrics = await service.getDisciplineMetrics(userId);
      expect(metrics.streaks.adherentTrades.current).toBe(0);
      expect(metrics.streaks.adherentTrades.longest).toBe(5); // Longest should remain
      expect(metrics.streaks.adherentTrades.lastBroken).toBeTruthy();
    });

    it('should return reinforcements for streak milestones', async () => {
      const userId = 'milestone-user';
      
      // Execute trades to reach a milestone (5 trades)
      let reinforcements: any[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 95, []);
        reinforcements.push(...result);
      }

      // Should have a streak milestone reinforcement
      const streakReinforcement = reinforcements.find(r => r.type === 'streak_milestone');
      expect(streakReinforcement).toBeTruthy();
      expect(streakReinforcement.message).toContain('5 consecutive');
    });

    it('should award points based on adherence level', async () => {
      const userId = 'points-user';
      
      // Perfect adherence should award maximum points
      await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 95, []);
      let metrics = await service.getDisciplineMetrics(userId);
      const perfectPoints = metrics.totalPoints;

      // Reset for comparison
      const userId2 = 'points-user-2';
      await service.updateDisciplineMetrics(userId2, mockTrade, mockStrategy, 85, []);
      metrics = await service.getDisciplineMetrics(userId2);
      const goodPoints = metrics.totalPoints;

      expect(perfectPoints).toBeGreaterThan(goodPoints);
    });
  });

  describe('calculateStreakBonus', () => {
    it('should return correct bonus points for different streak lengths', () => {
      expect(service.calculateStreakBonus(3)).toBe(0);
      expect(service.calculateStreakBonus(7)).toBe(5);
      expect(service.calculateStreakBonus(15)).toBe(15);
      expect(service.calculateStreakBonus(25)).toBe(30);
      expect(service.calculateStreakBonus(75)).toBe(50);
    });
  });

  describe('getDisciplineMetrics', () => {
    it('should return initial metrics for new user', async () => {
      const userId = 'new-metrics-user';
      const metrics = await service.getDisciplineMetrics(userId);
      
      expect(metrics.adherenceScore.overall).toBe(100);
      expect(metrics.streaks.adherentTrades.current).toBe(0);
      expect(metrics.totalPoints).toBe(0);
      expect(metrics.level).toBe(1);
      expect(metrics.achievements).toEqual([]);
      expect(metrics.badges).toEqual([]);
    });

    it('should return existing metrics for returning user', async () => {
      const userId = 'existing-user';
      
      // Create some metrics
      await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 90, []);
      
      // Retrieve metrics
      const metrics = await service.getDisciplineMetrics(userId);
      // The score should be weighted average: (100 * 0.9) + (90 * 0.1) = 99
      expect(metrics.adherenceScore.overall).toBe(99);
      expect(metrics.streaks.adherentTrades.current).toBe(1);
    });
  });

  describe('getAvailableAchievements', () => {
    it('should return list of available achievements', () => {
      const achievements = service.getAvailableAchievements();
      expect(achievements).toBeInstanceOf(Array);
      expect(achievements.length).toBeGreaterThan(0);
      
      const achievement = achievements[0];
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('requirement');
    });
  });

  describe('getEarnedBadges', () => {
    it('should return empty array for user with no badges', async () => {
      const userId = 'no-badges-user';
      const badges = await service.getEarnedBadges(userId);
      expect(badges).toEqual([]);
    });
  });

  describe('level progression', () => {
    it('should calculate correct level based on points', async () => {
      const userId = 'level-user';
      
      // Simulate earning enough points for level 2 (100 points)
      for (let i = 0; i < 10; i++) {
        await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 95, []);
      }

      const metrics = await service.getDisciplineMetrics(userId);
      expect(metrics.level).toBeGreaterThan(1);
    });
  });

  describe('violation processing', () => {
    it('should deduct points for violations', async () => {
      const userId = 'violation-user';
      
      // First, get baseline points
      await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 100, []);
      let metrics = await service.getDisciplineMetrics(userId);
      const baselinePoints = metrics.totalPoints;

      // Now add violations
      const deviations: StrategyDeviation[] = [
        {
          type: 'PositionSize',
          planned: '2%',
          actual: '4%',
          impact: 'Negative',
          description: 'Doubled position size'
        }
      ];

      await service.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 70, deviations);
      metrics = await service.getDisciplineMetrics(userId);
      
      // Points should be less due to violations
      expect(metrics.totalPoints).toBeLessThan(baselinePoints);
    });
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisciplineTrackingService } from '../../services/DisciplineTrackingService';
import { Trade } from '../../types/trade';
import { ProfessionalStrategy, StrategyDeviation } from '../../types/strategy';

describe('Discipline Tracking Integration', () => {
  let disciplineService: DisciplineTrackingService;
  let mockTrade: Trade;
  let mockStrategy: ProfessionalStrategy;

  beforeEach(() => {
    disciplineService = DisciplineTrackingService.getInstance();
    
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

  describe('Trade Review to Discipline Tracking Workflow', () => {
    it('should update discipline metrics when a trade is reviewed with perfect adherence', async () => {
      const userId = 'test-user';
      
      // Simulate perfect adherence (no deviations)
      const adherenceScore = disciplineService.calculateTradeAdherence(mockTrade, mockStrategy, []);
      expect(adherenceScore).toBe(100);

      // Update discipline metrics
      const reinforcements = await disciplineService.updateDisciplineMetrics(
        userId,
        mockTrade,
        mockStrategy,
        adherenceScore,
        []
      );

      // Check that metrics were updated
      const metrics = await disciplineService.getDisciplineMetrics(userId);
      expect(metrics.adherenceScore.overall).toBe(100);
      expect(metrics.streaks.adherentTrades.current).toBe(1);
      expect(metrics.totalPoints).toBeGreaterThan(0);
    });

    it('should handle trade with deviations and update discipline accordingly', async () => {
      const userId = 'test-user-deviations';
      
      const deviations: StrategyDeviation[] = [
        {
          type: 'PositionSize',
          planned: '2%',
          actual: '3%',
          impact: 'Negative',
          description: 'Position size was larger than planned'
        }
      ];

      // Calculate adherence with deviations
      const adherenceScore = disciplineService.calculateTradeAdherence(mockTrade, mockStrategy, deviations);
      expect(adherenceScore).toBeLessThan(100);

      // Update discipline metrics
      const reinforcements = await disciplineService.updateDisciplineMetrics(
        userId,
        mockTrade,
        mockStrategy,
        adherenceScore,
        deviations
      );

      // Check that metrics reflect the deviation
      const metrics = await disciplineService.getDisciplineMetrics(userId);
      expect(metrics.adherenceScore.overall).toBeLessThan(100);
      
      // Points should be deducted for violations
      expect(metrics.totalPoints).toBeGreaterThanOrEqual(0);
    });

    it('should generate reinforcement notifications for streak milestones', async () => {
      const userId = 'test-user-streaks';
      
      // Execute multiple adherent trades to build a streak
      let reinforcements: any[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await disciplineService.updateDisciplineMetrics(
          userId,
          { ...mockTrade, id: `trade-${i}` },
          mockStrategy,
          95, // High adherence
          []
        );
        reinforcements.push(...result);
      }

      // Should have streak milestone reinforcement
      const streakReinforcement = reinforcements.find(r => r.type === 'streak_milestone');
      expect(streakReinforcement).toBeTruthy();
      expect(streakReinforcement.message).toContain('5 consecutive');

      // Check final metrics
      const metrics = await disciplineService.getDisciplineMetrics(userId);
      expect(metrics.streaks.adherentTrades.current).toBe(5);
      expect(metrics.streaks.adherentTrades.longest).toBe(5);
    });

    it('should break streaks when adherence drops below threshold', async () => {
      const userId = 'test-user-break-streak';
      
      // Build up a streak first
      for (let i = 0; i < 3; i++) {
        await disciplineService.updateDisciplineMetrics(
          userId,
          { ...mockTrade, id: `trade-${i}` },
          mockStrategy,
          90,
          []
        );
      }

      let metrics = await disciplineService.getDisciplineMetrics(userId);
      expect(metrics.streaks.adherentTrades.current).toBe(3);

      // Now break the streak with poor adherence
      await disciplineService.updateDisciplineMetrics(
        userId,
        { ...mockTrade, id: 'trade-break' },
        mockStrategy,
        60, // Below threshold
        []
      );

      metrics = await disciplineService.getDisciplineMetrics(userId);
      expect(metrics.streaks.adherentTrades.current).toBe(0);
      expect(metrics.streaks.adherentTrades.longest).toBe(3); // Should preserve longest
      expect(metrics.streaks.adherentTrades.lastBroken).toBeTruthy();
    });

    it('should calculate correct streak bonuses', () => {
      expect(disciplineService.calculateStreakBonus(3)).toBe(0);
      expect(disciplineService.calculateStreakBonus(7)).toBe(5);
      expect(disciplineService.calculateStreakBonus(15)).toBe(15);
      expect(disciplineService.calculateStreakBonus(25)).toBe(30);
      expect(disciplineService.calculateStreakBonus(75)).toBe(50);
    });

    it('should maintain strategy-specific adherence scores', async () => {
      const userId = 'test-user-multi-strategy';
      
      const strategy2 = { ...mockStrategy, id: 'strategy-2', title: 'Strategy 2' };
      
      // Execute trades for different strategies with different adherence
      await disciplineService.updateDisciplineMetrics(userId, mockTrade, mockStrategy, 90, []);
      await disciplineService.updateDisciplineMetrics(userId, mockTrade, strategy2, 80, []);

      const metrics = await disciplineService.getDisciplineMetrics(userId);
      
      // Should have separate scores for each strategy
      // The calculation is: (100 * 0.8) + (score * 0.2)
      expect(metrics.adherenceScore.byStrategy.get('strategy-1')).toBe(98); // (100 * 0.8) + (90 * 0.2) = 98
      expect(metrics.adherenceScore.byStrategy.get('strategy-2')).toBe(96); // (100 * 0.8) + (80 * 0.2) = 96
    });
  });

  describe('Achievement System Integration', () => {
    it('should provide available achievements', () => {
      const achievements = disciplineService.getAvailableAchievements();
      
      expect(achievements).toBeInstanceOf(Array);
      expect(achievements.length).toBeGreaterThan(0);
      
      const achievement = achievements[0];
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('requirement');
      expect(achievement).toHaveProperty('progress');
    });

    it('should track achievement progress', async () => {
      const userId = 'test-user-achievements';
      
      // Execute some trades to make progress
      for (let i = 0; i < 3; i++) {
        await disciplineService.updateDisciplineMetrics(
          userId,
          { ...mockTrade, id: `trade-${i}` },
          mockStrategy,
          95,
          []
        );
      }

      const metrics = await disciplineService.getDisciplineMetrics(userId);
      expect(metrics.totalPoints).toBeGreaterThan(0);
      expect(metrics.level).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid deviation types gracefully', () => {
      const invalidDeviations: StrategyDeviation[] = [
        {
          type: 'InvalidType' as any,
          planned: 'something',
          actual: 'something else',
          impact: 'Negative',
          description: 'Invalid deviation type'
        }
      ];

      // Should not throw an error
      const adherenceScore = disciplineService.calculateTradeAdherence(
        mockTrade,
        mockStrategy,
        invalidDeviations
      );

      expect(adherenceScore).toBeGreaterThanOrEqual(0);
      expect(adherenceScore).toBeLessThanOrEqual(100);
    });

    it('should handle empty or null data gracefully', async () => {
      const userId = 'test-user-empty';
      
      // Should not throw when getting metrics for new user
      const metrics = await disciplineService.getDisciplineMetrics(userId);
      expect(metrics).toBeTruthy();
      expect(metrics.adherenceScore.overall).toBe(100);
      expect(metrics.totalPoints).toBe(0);
      expect(metrics.level).toBe(1);
    });
  });
});
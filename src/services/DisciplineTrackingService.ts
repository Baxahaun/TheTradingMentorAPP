import { 
  DisciplineMetrics, 
  DisciplineScore, 
  StreakData, 
  Achievement, 
  Badge, 
  Milestone, 
  DisciplineViolation, 
  PositiveReinforcement,
  DisciplineAnalytics 
} from '../types/discipline';
import { Trade } from '../types/trade';
import { ProfessionalStrategy, StrategyDeviation } from '../types/strategy';

/**
 * Service for tracking and gamifying trading discipline
 */
export class DisciplineTrackingService {
  private static instance: DisciplineTrackingService;
  private disciplineData: Map<string, DisciplineMetrics> = new Map();
  private achievements: Achievement[] = [];
  private availableBadges: Badge[] = [];

  private constructor() {
    this.initializeAchievements();
    this.initializeBadges();
  }

  public static getInstance(): DisciplineTrackingService {
    if (!DisciplineTrackingService.instance) {
      DisciplineTrackingService.instance = new DisciplineTrackingService();
    }
    return DisciplineTrackingService.instance;
  }

  /**
   * Calculate adherence score for a trade based on strategy compliance
   */
  public calculateTradeAdherence(
    trade: Trade, 
    strategy: ProfessionalStrategy, 
    deviations: StrategyDeviation[]
  ): number {
    if (deviations.length === 0) {
      return 100; // Perfect adherence
    }

    let adherenceScore = 100;
    
    for (const deviation of deviations) {
      const penalty = this.calculateDeviationPenalty(deviation);
      adherenceScore -= penalty;
    }

    return Math.max(0, adherenceScore);
  }

  /**
   * Update discipline metrics when a trade is completed
   */
  public async updateDisciplineMetrics(
    userId: string,
    trade: Trade,
    strategy: ProfessionalStrategy,
    adherenceScore: number,
    deviations: StrategyDeviation[]
  ): Promise<PositiveReinforcement[]> {
    const metrics = await this.getDisciplineMetrics(userId);
    const reinforcements: PositiveReinforcement[] = [];

    // Update adherence scores
    this.updateAdherenceScores(metrics, strategy.id, adherenceScore);

    // Update streaks
    const streakRewards = this.updateStreaks(metrics, adherenceScore, trade);
    reinforcements.push(...streakRewards);

    // Process violations if any
    if (deviations.length > 0) {
      this.processViolations(metrics, trade, strategy, deviations);
    }

    // Check for achievements and milestones
    const achievementRewards = await this.checkAchievements(metrics, userId);
    reinforcements.push(...achievementRewards);

    // Update points and level
    const levelRewards = this.updatePointsAndLevel(metrics, adherenceScore);
    reinforcements.push(...levelRewards);

    // Save updated metrics
    this.disciplineData.set(userId, metrics);

    return reinforcements;
  }

  /**
   * Get current discipline metrics for a user
   */
  public async getDisciplineMetrics(userId: string): Promise<DisciplineMetrics> {
    if (!this.disciplineData.has(userId)) {
      this.disciplineData.set(userId, this.createInitialMetrics());
    }
    return this.disciplineData.get(userId)!;
  }

  /**
   * Get discipline analytics for insights
   */
  public async getDisciplineAnalytics(userId: string): Promise<DisciplineAnalytics> {
    const metrics = await this.getDisciplineMetrics(userId);
    
    return {
      adherenceTrend: this.calculateAdherenceTrend(metrics),
      violationPatterns: this.analyzeViolationPatterns(metrics),
      improvementAreas: this.identifyImprovementAreas(metrics)
    };
  }

  /**
   * Get available achievements for progress tracking
   */
  public getAvailableAchievements(): Achievement[] {
    return [...this.achievements];
  }

  /**
   * Get earned badges for a user
   */
  public async getEarnedBadges(userId: string): Promise<Badge[]> {
    const metrics = await this.getDisciplineMetrics(userId);
    return metrics.badges;
  }

  /**
   * Calculate streak bonus points
   */
  public calculateStreakBonus(streakLength: number): number {
    if (streakLength < 5) return 0;
    if (streakLength < 10) return 5;
    if (streakLength < 20) return 15;
    if (streakLength < 50) return 30;
    return 50;
  }

  private calculateDeviationPenalty(deviation: StrategyDeviation): number {
    const basePenalties = {
      'EntryTiming': 10,
      'PositionSize': 20,
      'StopLoss': 25,
      'TakeProfit': 15,
      'RiskManagement': 30
    };

    const impactMultipliers = {
      'Positive': 0.5,
      'Neutral': 1.0,
      'Negative': 1.5
    };

    const basePenalty = basePenalties[deviation.type] || 15;
    const multiplier = impactMultipliers[deviation.impact] || 1.0;

    return basePenalty * multiplier;
  }

  private updateAdherenceScores(
    metrics: DisciplineMetrics, 
    strategyId: string, 
    adherenceScore: number
  ): void {
    // Update overall adherence score (weighted average)
    const currentOverall = metrics.adherenceScore.overall;
    const newOverall = (currentOverall * 0.9) + (adherenceScore * 0.1);
    metrics.adherenceScore.overall = Math.round(newOverall);

    // Update strategy-specific score
    const currentStrategyScore = metrics.adherenceScore.byStrategy.get(strategyId) || 100;
    const newStrategyScore = (currentStrategyScore * 0.8) + (adherenceScore * 0.2);
    metrics.adherenceScore.byStrategy.set(strategyId, Math.round(newStrategyScore));

    metrics.adherenceScore.lastUpdated = new Date().toISOString();
  }

  private updateStreaks(
    metrics: DisciplineMetrics, 
    adherenceScore: number, 
    trade: Trade
  ): PositiveReinforcement[] {
    const reinforcements: PositiveReinforcement[] = [];
    const isAdherent = adherenceScore >= 80;
    const isProfitable = (trade.pnl || 0) > 0;

    // Update adherent trades streak
    if (isAdherent) {
      metrics.streaks.adherentTrades.current++;
      if (metrics.streaks.adherentTrades.current > metrics.streaks.adherentTrades.longest) {
        metrics.streaks.adherentTrades.longest = metrics.streaks.adherentTrades.current;
      }

      // Check for streak milestones
      if (this.isStreakMilestone(metrics.streaks.adherentTrades.current)) {
        reinforcements.push(this.createStreakReinforcement(
          'adherent_trades', 
          metrics.streaks.adherentTrades.current
        ));
      }
    } else {
      if (metrics.streaks.adherentTrades.current > 0) {
        metrics.streaks.adherentTrades.lastBroken = new Date().toISOString();
      }
      metrics.streaks.adherentTrades.current = 0;
    }

    // Update profitable adherent trades streak
    if (isAdherent && isProfitable) {
      metrics.streaks.profitableAdherentTrades.current++;
      if (metrics.streaks.profitableAdherentTrades.current > metrics.streaks.profitableAdherentTrades.longest) {
        metrics.streaks.profitableAdherentTrades.longest = metrics.streaks.profitableAdherentTrades.current;
      }
    } else if (!isAdherent || !isProfitable) {
      if (metrics.streaks.profitableAdherentTrades.current > 0) {
        metrics.streaks.profitableAdherentTrades.lastBroken = new Date().toISOString();
      }
      metrics.streaks.profitableAdherentTrades.current = 0;
    }

    return reinforcements;
  }

  private processViolations(
    metrics: DisciplineMetrics,
    trade: Trade,
    strategy: ProfessionalStrategy,
    deviations: StrategyDeviation[]
  ): void {
    for (const deviation of deviations) {
      const violation: DisciplineViolation = {
        id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tradeId: trade.id,
        strategyId: strategy.id,
        type: deviation.type.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase() as any,
        severity: this.calculateViolationSeverity(deviation),
        description: deviation.description,
        impact: {
          points: this.calculateDeviationPenalty(deviation),
          streakBroken: deviation.impact === 'Negative',
          adherenceScoreImpact: this.calculateDeviationPenalty(deviation)
        },
        occurredAt: new Date().toISOString()
      };

      // Deduct points for violations
      metrics.totalPoints = Math.max(0, metrics.totalPoints - violation.impact.points);
    }
  }

  private calculateViolationSeverity(deviation: StrategyDeviation): 'minor' | 'moderate' | 'major' {
    const penalty = this.calculateDeviationPenalty(deviation);
    if (penalty <= 10) return 'minor';
    if (penalty <= 20) return 'moderate';
    return 'major';
  }

  private async checkAchievements(
    metrics: DisciplineMetrics, 
    userId: string
  ): Promise<PositiveReinforcement[]> {
    const reinforcements: PositiveReinforcement[] = [];

    for (const achievement of this.achievements) {
      if (achievement.unlockedAt) continue; // Already unlocked

      const progress = this.calculateAchievementProgress(achievement, metrics);
      achievement.progress = progress;

      if (progress >= 100) {
        achievement.unlockedAt = new Date().toISOString();
        
        // Award badge if associated
        const badge = this.createAchievementBadge(achievement);
        if (badge) {
          metrics.badges.push(badge);
        }

        reinforcements.push({
          id: `achievement_${achievement.id}_${Date.now()}`,
          type: 'achievement_unlocked',
          title: 'Achievement Unlocked!',
          message: `You've earned "${achievement.name}": ${achievement.description}`,
          achievement,
          badge,
          showAt: new Date().toISOString(),
          acknowledged: false
        });

        // Award points
        metrics.totalPoints += 100;
      }
    }

    return reinforcements;
  }

  private calculateAchievementProgress(achievement: Achievement, metrics: DisciplineMetrics): number {
    switch (achievement.requirement.type) {
      case 'streak_length':
        const streak = metrics.streaks.adherentTrades.longest;
        return Math.min(100, (streak / achievement.requirement.value) * 100);
      
      case 'adherence_score':
        return Math.min(100, (metrics.adherenceScore.overall / achievement.requirement.value) * 100);
      
      case 'trade_count':
        // This would need to be calculated from actual trade data
        return 0; // Placeholder
      
      default:
        return 0;
    }
  }

  private updatePointsAndLevel(
    metrics: DisciplineMetrics, 
    adherenceScore: number
  ): PositiveReinforcement[] {
    const reinforcements: PositiveReinforcement[] = [];
    
    // Award points based on adherence
    let points = 0;
    if (adherenceScore >= 95) points = 10;
    else if (adherenceScore >= 90) points = 8;
    else if (adherenceScore >= 80) points = 5;
    else if (adherenceScore >= 70) points = 2;

    // Add streak bonus
    points += this.calculateStreakBonus(metrics.streaks.adherentTrades.current);

    metrics.totalPoints += points;

    // Check for level up
    const newLevel = this.calculateLevel(metrics.totalPoints);
    if (newLevel > metrics.level) {
      const oldLevel = metrics.level;
      metrics.level = newLevel;
      metrics.nextLevelPoints = this.getPointsForLevel(newLevel + 1);

      reinforcements.push({
        id: `level_up_${newLevel}_${Date.now()}`,
        type: 'level_up',
        title: 'Level Up!',
        message: `Congratulations! You've reached level ${newLevel}!`,
        points: points,
        showAt: new Date().toISOString(),
        acknowledged: false
      });
    }

    return reinforcements;
  }

  private calculateLevel(totalPoints: number): number {
    // Level progression: 100, 250, 500, 1000, 2000, 4000, etc.
    if (totalPoints < 100) return 1;
    if (totalPoints < 250) return 2;
    if (totalPoints < 500) return 3;
    if (totalPoints < 1000) return 4;
    if (totalPoints < 2000) return 5;
    if (totalPoints < 4000) return 6;
    if (totalPoints < 8000) return 7;
    if (totalPoints < 16000) return 8;
    if (totalPoints < 32000) return 9;
    return 10;
  }

  private getPointsForLevel(level: number): number {
    const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000];
    return thresholds[Math.min(level, thresholds.length - 1)];
  }

  private isStreakMilestone(streakLength: number): boolean {
    const milestones = [5, 10, 15, 20, 25, 30, 50, 75, 100];
    return milestones.includes(streakLength);
  }

  private createStreakReinforcement(
    type: 'adherent_trades' | 'profitable_adherent_trades', 
    streakLength: number
  ): PositiveReinforcement {
    return {
      id: `streak_${type}_${streakLength}_${Date.now()}`,
      type: 'streak_milestone',
      title: 'Streak Milestone!',
      message: `Amazing! You've maintained ${streakLength} consecutive ${type.replace('_', ' ')}!`,
      points: this.calculateStreakBonus(streakLength),
      showAt: new Date().toISOString(),
      acknowledged: false
    };
  }

  private createAchievementBadge(achievement: Achievement): Badge | undefined {
    const badgeTemplate = this.availableBadges.find(b => b.id === `badge_${achievement.id}`);
    if (!badgeTemplate) return undefined;

    return {
      ...badgeTemplate,
      earnedAt: new Date().toISOString()
    };
  }

  private createInitialMetrics(): DisciplineMetrics {
    return {
      adherenceScore: {
        overall: 100,
        byStrategy: new Map(),
        lastUpdated: new Date().toISOString()
      },
      streaks: {
        adherentTrades: { current: 0, longest: 0, lastBroken: null, type: 'adherent_trades' },
        profitableAdherentTrades: { current: 0, longest: 0, lastBroken: null, type: 'profitable_adherent_trades' },
        dailyDiscipline: { current: 0, longest: 0, lastBroken: null, type: 'daily_discipline' }
      },
      achievements: [],
      badges: [],
      milestones: this.createInitialMilestones(),
      totalPoints: 0,
      level: 1,
      nextLevelPoints: 100
    };
  }

  private createInitialMilestones(): Milestone[] {
    return [
      {
        id: 'first_adherent_trade',
        name: 'First Disciplined Trade',
        description: 'Execute your first trade with 100% strategy adherence',
        targetValue: 1,
        currentValue: 0,
        category: 'adherence'
      },
      {
        id: 'streak_10',
        name: 'Consistency Builder',
        description: 'Maintain a 10-trade adherence streak',
        targetValue: 10,
        currentValue: 0,
        category: 'streak'
      },
      {
        id: 'level_5',
        name: 'Discipline Master',
        description: 'Reach discipline level 5',
        targetValue: 5,
        currentValue: 1,
        category: 'performance'
      }
    ];
  }

  private initializeAchievements(): void {
    this.achievements = [
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Maintain 95%+ adherence score for 30 days',
        icon: '🎯',
        category: 'adherence',
        requirement: { type: 'adherence_score', value: 95, duration: 'monthly' },
        progress: 0
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Achieve a 50-trade adherence streak',
        icon: '🔥',
        category: 'streak',
        requirement: { type: 'streak_length', value: 50 },
        progress: 0
      },
      {
        id: 'disciplined_trader',
        name: 'Disciplined Trader',
        description: 'Complete 100 adherent trades',
        icon: '💪',
        category: 'milestone',
        requirement: { type: 'trade_count', value: 100 },
        progress: 0
      }
    ];
  }

  private initializeBadges(): void {
    this.availableBadges = [
      {
        id: 'badge_perfectionist',
        name: 'Perfectionist Badge',
        description: 'Awarded for maintaining exceptional discipline',
        icon: '🏆',
        rarity: 'epic',
        category: 'discipline',
        earnedAt: ''
      },
      {
        id: 'badge_streak_master',
        name: 'Streak Master Badge',
        description: 'Awarded for incredible consistency',
        icon: '🔥',
        rarity: 'legendary',
        category: 'consistency',
        earnedAt: ''
      }
    ];
  }

  private calculateAdherenceTrend(metrics: DisciplineMetrics): any[] {
    // This would calculate trend data from historical records
    // For now, return placeholder data
    return [];
  }

  private analyzeViolationPatterns(metrics: DisciplineMetrics): any[] {
    // This would analyze violation patterns from historical data
    // For now, return placeholder data
    return [];
  }

  private identifyImprovementAreas(metrics: DisciplineMetrics): any[] {
    // This would identify areas for improvement based on data
    // For now, return placeholder data
    return [];
  }
}
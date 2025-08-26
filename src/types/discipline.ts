/**
 * Types for the gamified discipline tracking system
 */

export interface DisciplineScore {
  overall: number; // 0-100 overall adherence score
  byStrategy: Map<string, number>; // Strategy-specific adherence scores
  lastUpdated: string;
}

export interface StreakData {
  current: number; // Current consecutive adherent trades
  longest: number; // Longest streak ever achieved
  lastBroken: string | null; // When the streak was last broken
  type: 'adherent_trades' | 'profitable_adherent_trades' | 'daily_discipline';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'adherence' | 'performance' | 'milestone';
  requirement: {
    type: 'streak_length' | 'adherence_score' | 'trade_count' | 'profit_factor';
    value: number;
    duration?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  unlockedAt?: string;
  progress: number; // 0-100 percentage towards achievement
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
  category: 'discipline' | 'performance' | 'consistency' | 'milestone';
}

export interface DisciplineMetrics {
  adherenceScore: DisciplineScore;
  streaks: {
    adherentTrades: StreakData;
    profitableAdherentTrades: StreakData;
    dailyDiscipline: StreakData;
  };
  achievements: Achievement[];
  badges: Badge[];
  milestones: Milestone[];
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  category: 'trades' | 'adherence' | 'performance' | 'streak';
  completedAt?: string;
  reward?: {
    points: number;
    badge?: Badge;
    achievement?: Achievement;
  };
}

export interface DisciplineViolation {
  id: string;
  tradeId: string;
  strategyId: string;
  type: 'position_size' | 'stop_loss' | 'take_profit' | 'entry_timing' | 'exit_timing';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  impact: {
    points: number; // Points deducted
    streakBroken: boolean;
    adherenceScoreImpact: number;
  };
  occurredAt: string;
}

export interface PositiveReinforcement {
  id: string;
  type: 'achievement_unlocked' | 'streak_milestone' | 'adherence_improvement' | 'level_up';
  title: string;
  message: string;
  points?: number;
  badge?: Badge;
  achievement?: Achievement;
  showAt: string;
  acknowledged: boolean;
}

export interface DisciplineAnalytics {
  adherenceTrend: {
    period: string;
    score: number;
    trades: number;
  }[];
  violationPatterns: {
    type: string;
    frequency: number;
    avgImpact: number;
  }[];
  improvementAreas: {
    category: string;
    currentScore: number;
    targetScore: number;
    suggestions: string[];
  }[];
}
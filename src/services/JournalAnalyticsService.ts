import { JournalEntry, EmotionalState, ProcessMetrics } from '../types/journal';
import { JournalDataService } from './JournalDataService';

export interface ConsistencyMetrics {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  completionRate: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  streakHistory: Array<{
    startDate: string;
    endDate: string;
    length: number;
  }>;
}

export interface EmotionalPattern {
  emotion: string;
  averageProcessScore: number;
  averagePnL: number;
  frequency: number;
  correlationStrength: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

export interface ProcessTrend {
  metric: keyof ProcessMetrics;
  currentValue: number;
  previousValue: number;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  weeklyAverage: number;
  monthlyAverage: number;
}

export interface PersonalizedInsight {
  id: string;
  type: 'consistency' | 'emotional' | 'process' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  dataPoints: any[];
  confidence: number;
  createdAt: string;
}

export interface AnalyticsData {
  consistencyMetrics: ConsistencyMetrics;
  emotionalPatterns: EmotionalPattern[];
  processTrends: ProcessTrend[];
  personalizedInsights: PersonalizedInsight[];
  lastUpdated: string;
}

export class JournalAnalyticsService {
  private journalDataService: JournalDataService;

  constructor() {
    this.journalDataService = new JournalDataService();
  }

  async getAnalyticsData(userId: string, dateRange?: { start: string; end: string }): Promise<AnalyticsData> {
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
    const startDate = dateRange?.start || this.getDateDaysAgo(90); // Default to 90 days

    const entries = await this.journalDataService.getJournalEntriesForDateRange(userId, startDate, endDate);

    const consistencyMetrics = this.calculateConsistencyMetrics(entries);
    const emotionalPatterns = this.analyzeEmotionalPatterns(entries);
    const processTrends = this.calculateProcessTrends(entries);
    const personalizedInsights = this.generatePersonalizedInsights(entries, consistencyMetrics, emotionalPatterns, processTrends);

    return {
      consistencyMetrics,
      emotionalPatterns,
      processTrends,
      personalizedInsights,
      lastUpdated: new Date().toISOString()
    };
  }

  private calculateConsistencyMetrics(entries: JournalEntry[]): ConsistencyMetrics {
    const sortedEntries = entries
      .filter(entry => entry.isComplete)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const streaks = this.calculateStreaks(sortedEntries);
    const currentStreak = this.getCurrentStreak(sortedEntries);
    const longestStreak = Math.max(...streaks.map(s => s.length), 0);

    const totalDaysInRange = this.getDaysBetween(
      sortedEntries[0]?.date || new Date().toISOString().split('T')[0],
      sortedEntries[sortedEntries.length - 1]?.date || new Date().toISOString().split('T')[0]
    );

    const completionRate = totalDaysInRange > 0 ? (sortedEntries.length / totalDaysInRange) * 100 : 0;

    return {
      currentStreak,
      longestStreak,
      totalEntries: sortedEntries.length,
      completionRate: Math.round(completionRate * 100) / 100,
      weeklyConsistency: this.calculateWeeklyConsistency(sortedEntries),
      monthlyConsistency: this.calculateMonthlyConsistency(sortedEntries),
      streakHistory: streaks
    };
  }

  private calculateStreaks(entries: JournalEntry[]): Array<{ startDate: string; endDate: string; length: number }> {
    if (entries.length === 0) return [];

    const streaks: Array<{ startDate: string; endDate: string; length: number }> = [];
    let currentStreakStart = entries[0].date;
    let currentStreakLength = 1;

    for (let i = 1; i < entries.length; i++) {
      const prevDate = new Date(entries[i - 1].date);
      const currentDate = new Date(entries[i].date);
      const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        currentStreakLength++;
      } else {
        if (currentStreakLength > 1) {
          streaks.push({
            startDate: currentStreakStart,
            endDate: entries[i - 1].date,
            length: currentStreakLength
          });
        }
        currentStreakStart = entries[i].date;
        currentStreakLength = 1;
      }
    }

    // Add the last streak if it's more than 1 day
    if (currentStreakLength > 1) {
      streaks.push({
        startDate: currentStreakStart,
        endDate: entries[entries.length - 1].date,
        length: currentStreakLength
      });
    }

    return streaks;
  }

  private getCurrentStreak(entries: JournalEntry[]): number {
    if (entries.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = this.getDateDaysAgo(1);

    // Check if there's an entry for today or yesterday
    const latestEntry = entries[entries.length - 1];
    if (latestEntry.date !== today && latestEntry.date !== yesterday) {
      return 0;
    }

    let streak = 1;
    let currentDate = new Date(latestEntry.date);

    for (let i = entries.length - 2; i >= 0; i--) {
      const prevDate = new Date(entries[i].date);
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - 1);

      if (prevDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        streak++;
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateWeeklyConsistency(entries: JournalEntry[]): number {
    const last7Days = this.getDateDaysAgo(7);
    const recentEntries = entries.filter(entry => entry.date >= last7Days);
    return Math.round((recentEntries.length / 7) * 100);
  }

  private calculateMonthlyConsistency(entries: JournalEntry[]): number {
    const last30Days = this.getDateDaysAgo(30);
    const recentEntries = entries.filter(entry => entry.date >= last30Days);
    return Math.round((recentEntries.length / 30) * 100);
  }

  private analyzeEmotionalPatterns(entries: JournalEntry[]): EmotionalPattern[] {
    const emotionalData = entries
      .filter(entry => entry.emotionalState)
      .map(entry => ({
        entry,
        emotions: this.extractEmotions(entry.emotionalState),
        processScore: entry.processMetrics?.processScore || 0,
        pnl: entry.dailyPnL || 0
      }));

    const emotionGroups = this.groupByEmotion(emotionalData);
    const patterns: EmotionalPattern[] = [];

    for (const [emotion, data] of Object.entries(emotionGroups)) {
      const avgProcessScore = data.reduce((sum, d) => sum + d.processScore, 0) / data.length;
      const avgPnL = data.reduce((sum, d) => sum + d.pnl, 0) / data.length;
      const frequency = data.length;

      // Calculate correlation between emotion and performance
      const correlation = this.calculateCorrelation(
        data.map(d => d.processScore),
        data.map(d => this.getEmotionIntensity(d.emotions, emotion))
      );

      const trend = this.calculateEmotionalTrend(data, emotion);

      patterns.push({
        emotion,
        averageProcessScore: Math.round(avgProcessScore * 100) / 100,
        averagePnL: Math.round(avgPnL * 100) / 100,
        frequency,
        correlationStrength: Math.abs(correlation),
        trend,
        recommendations: this.generateEmotionalRecommendations(emotion, correlation, trend)
      });
    }

    return patterns.sort((a, b) => b.correlationStrength - a.correlationStrength);
  }

  private extractEmotions(emotionalState: EmotionalState): string[] {
    const emotions: string[] = [];
    
    if (emotionalState.preMarket?.mood) {
      emotions.push(emotionalState.preMarket.mood);
    }
    
    if (emotionalState.postMarket?.overallMood) {
      emotions.push(emotionalState.postMarket.overallMood);
    }

    return emotions;
  }

  private groupByEmotion(data: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    data.forEach(item => {
      item.emotions.forEach((emotion: string) => {
        if (!groups[emotion]) {
          groups[emotion] = [];
        }
        groups[emotion].push(item);
      });
    });

    return groups;
  }

  private getEmotionIntensity(emotions: string[], targetEmotion: string): number {
    // Simple intensity mapping - could be enhanced with actual intensity ratings
    const intensityMap: Record<string, number> = {
      'excited': 5,
      'confident': 4,
      'calm': 3,
      'neutral': 2,
      'nervous': 4,
      'frustrated': 5,
      'satisfied': 4,
      'disappointed': 4
    };

    return emotions.includes(targetEmotion) ? (intensityMap[targetEmotion] || 3) : 0;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateEmotionalTrend(data: any[], emotion: string): 'improving' | 'declining' | 'stable' {
    if (data.length < 4) return 'stable';

    const recent = data.slice(-Math.ceil(data.length / 2));
    const earlier = data.slice(0, Math.floor(data.length / 2));

    const recentAvg = recent.reduce((sum, d) => sum + d.processScore, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, d) => sum + d.processScore, 0) / earlier.length;

    const difference = recentAvg - earlierAvg;
    
    if (difference > 0.2) return 'improving';
    if (difference < -0.2) return 'declining';
    return 'stable';
  }

  private generateEmotionalRecommendations(emotion: string, correlation: number, trend: 'improving' | 'declining' | 'stable'): string[] {
    const recommendations: string[] = [];

    if (correlation > 0.3) {
      if (emotion === 'confident' || emotion === 'calm') {
        recommendations.push(`Your ${emotion} state correlates with better performance. Try to cultivate this mindset before trading.`);
      } else {
        recommendations.push(`${emotion} emotions may be impacting your trading negatively. Consider mindfulness techniques.`);
      }
    }

    if (trend === 'declining') {
      recommendations.push(`Your performance when ${emotion} has been declining. Review recent trades for patterns.`);
    } else if (trend === 'improving') {
      recommendations.push(`Great progress managing ${emotion} states! Continue your current approach.`);
    }

    return recommendations;
  }

  private calculateProcessTrends(entries: JournalEntry[]): ProcessTrend[] {
    const metricsData = entries
      .filter(entry => entry.processMetrics)
      .map(entry => ({
        date: entry.date,
        metrics: entry.processMetrics!
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (metricsData.length < 2) return [];

    const trends: ProcessTrend[] = [];
    const metricKeys: (keyof ProcessMetrics)[] = ['planAdherence', 'riskManagement', 'entryTiming', 'exitTiming', 'overallDiscipline', 'processScore'];

    for (const metric of metricKeys) {
      const values = metricsData.map(d => d.metrics[metric] || 0);
      const recent = values.slice(-7); // Last 7 entries
      const previous = values.slice(-14, -7); // Previous 7 entries

      if (recent.length === 0) continue;

      const currentValue = recent[recent.length - 1];
      const previousValue = previous.length > 0 ? previous[previous.length - 1] : currentValue;
      
      const weeklyAverage = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const monthlyAverage = values.slice(-30).reduce((sum, val) => sum + val, 0) / Math.min(values.length, 30);

      const changePercentage = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (changePercentage > 5) trend = 'improving';
      else if (changePercentage < -5) trend = 'declining';

      trends.push({
        metric,
        currentValue: Math.round(currentValue * 100) / 100,
        previousValue: Math.round(previousValue * 100) / 100,
        trend,
        changePercentage: Math.round(changePercentage * 100) / 100,
        weeklyAverage: Math.round(weeklyAverage * 100) / 100,
        monthlyAverage: Math.round(monthlyAverage * 100) / 100
      });
    }

    return trends;
  }

  private generatePersonalizedInsights(
    entries: JournalEntry[],
    consistency: ConsistencyMetrics,
    emotions: EmotionalPattern[],
    trends: ProcessTrend[]
  ): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = [];

    // Consistency insights
    if (consistency.currentStreak >= 7) {
      insights.push({
        id: `consistency-streak-${Date.now()}`,
        type: 'consistency',
        priority: 'high',
        title: 'Excellent Journaling Streak!',
        description: `You've maintained a ${consistency.currentStreak}-day journaling streak.`,
        recommendation: 'Keep up the momentum! Consistent reflection is key to trading improvement.',
        dataPoints: [consistency.currentStreak, consistency.longestStreak],
        confidence: 0.95,
        createdAt: new Date().toISOString()
      });
    } else if (consistency.completionRate < 50) {
      insights.push({
        id: `consistency-low-${Date.now()}`,
        type: 'consistency',
        priority: 'high',
        title: 'Journaling Consistency Needs Attention',
        description: `Your completion rate is ${consistency.completionRate}%, which may limit learning opportunities.`,
        recommendation: 'Try setting a daily reminder or using templates to make journaling easier.',
        dataPoints: [consistency.completionRate, consistency.weeklyConsistency],
        confidence: 0.85,
        createdAt: new Date().toISOString()
      });
    }

    // Emotional insights
    const strongEmotionalPattern = emotions.find(e => e.correlationStrength > 0.4);
    if (strongEmotionalPattern) {
      insights.push({
        id: `emotional-pattern-${Date.now()}`,
        type: 'emotional',
        priority: 'medium',
        title: `Strong ${strongEmotionalPattern.emotion} Pattern Detected`,
        description: `Your ${strongEmotionalPattern.emotion} state shows a ${strongEmotionalPattern.correlationStrength.toFixed(2)} correlation with performance.`,
        recommendation: strongEmotionalPattern.recommendations[0] || 'Monitor this emotional state closely.',
        dataPoints: [strongEmotionalPattern.correlationStrength, strongEmotionalPattern.averageProcessScore],
        confidence: 0.8,
        createdAt: new Date().toISOString()
      });
    }

    // Process trends insights
    const improvingTrends = trends.filter(t => t.trend === 'improving');
    const decliningTrends = trends.filter(t => t.trend === 'declining');

    if (improvingTrends.length > 0) {
      insights.push({
        id: `process-improving-${Date.now()}`,
        type: 'process',
        priority: 'medium',
        title: 'Process Improvements Detected',
        description: `Your ${improvingTrends.map(t => t.metric).join(', ')} metrics are improving.`,
        recommendation: 'Continue your current approach and document what\'s working well.',
        dataPoints: improvingTrends.map(t => t.changePercentage),
        confidence: 0.75,
        createdAt: new Date().toISOString()
      });
    }

    if (decliningTrends.length > 0) {
      insights.push({
        id: `process-declining-${Date.now()}`,
        type: 'process',
        priority: 'high',
        title: 'Process Metrics Need Attention',
        description: `Your ${decliningTrends.map(t => t.metric).join(', ')} metrics are declining.`,
        recommendation: 'Review recent trades and identify what might be causing the decline.',
        dataPoints: decliningTrends.map(t => t.changePercentage),
        confidence: 0.8,
        createdAt: new Date().toISOString()
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}
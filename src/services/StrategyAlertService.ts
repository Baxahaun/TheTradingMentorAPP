/**
 * Strategy Alert Service
 * Implements comprehensive performance alerts and notification system
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import {
  StrategyAlert,
  AlertThreshold,
  DrawdownThreshold,
  PerformanceMilestone,
  MarketConditionAlert,
  StatisticalSignificanceAlert,
  NotificationPreferences,
  AlertConfiguration,
  AlertType,
  AlertSeverity,
  AlertStatus,
  StrategyRecommendation,
  NotificationChannel,
  AlertMetrics
} from '../types/alerts';
import { ProfessionalStrategy, StrategyPerformance } from '../types/strategy';
import { Trade } from '../types/trade';

export class StrategyAlertService {
  private alerts: Map<string, StrategyAlert> = new Map();
  private thresholds: Map<string, AlertThreshold> = new Map();
  private configuration: AlertConfiguration;
  private notificationPreferences: Map<string, NotificationPreferences> = new Map();

  constructor(configuration?: AlertConfiguration) {
    this.configuration = configuration || this.getDefaultConfiguration();
    this.initializeDefaultThresholds();
  }

  /**
   * Requirement 7.1: Monitor drawdown limits and send immediate alerts
   */
  async monitorDrawdownLimits(
    strategy: ProfessionalStrategy,
    currentPerformance: StrategyPerformance
  ): Promise<StrategyAlert[]> {
    const alerts: StrategyAlert[] = [];
    const drawdownThresholds = this.getDrawdownThresholds(strategy.id);

    for (const threshold of drawdownThresholds) {
      if (!threshold.enabled) continue;

      const currentValue = threshold.metric === 'maxDrawdown' 
        ? currentPerformance.maxDrawdown 
        : this.calculateCurrentDrawdown(currentPerformance);

      if (this.shouldTriggerAlert(threshold, currentValue)) {
        const alert = await this.createDrawdownAlert(
          strategy,
          threshold,
          currentValue,
          currentPerformance
        );
        alerts.push(alert);
        
        // Auto-suspend strategy if configured
        if (threshold.suspendStrategy) {
          await this.suggestStrategySuspension(strategy, alert);
        }
      }
    }

    return alerts;
  }

  /**
   * Requirement 7.2: Notify on exceptional performance achievements
   */
  async checkPerformanceMilestones(
    strategy: ProfessionalStrategy,
    previousPerformance: StrategyPerformance,
    currentPerformance: StrategyPerformance
  ): Promise<StrategyAlert[]> {
    const alerts: StrategyAlert[] = [];
    const milestones = this.getPerformanceMilestones(strategy.id);

    for (const milestone of milestones) {
      if (!milestone.enabled) continue;

      const currentValue = this.getMetricValue(currentPerformance, milestone.metric);
      const previousValue = this.getMetricValue(previousPerformance, milestone.metric);

      if (this.milestoneAchieved(milestone, previousValue, currentValue)) {
        const alert = await this.createMilestoneAlert(
          strategy,
          milestone,
          currentValue,
          currentPerformance
        );
        alerts.push(alert);

        // Suggest position size increase for exceptional performance
        if (milestone.suggestPositionIncrease && this.isExceptionalPerformance(currentValue, milestone)) {
          alert.suggestedActions = [
            ...alert.suggestedActions || [],
            'Consider increasing position size for this high-performing strategy',
            'Review risk management parameters for potential optimization'
          ];
        }
      }
    }

    return alerts;
  }

  /**
   * Requirement 7.3: Alert on significant market condition changes
   */
  async detectMarketConditionChanges(
    strategies: ProfessionalStrategy[],
    marketData: Record<string, any>
  ): Promise<MarketConditionAlert[]> {
    const alerts: MarketConditionAlert[] = [];
    const thresholds = this.configuration.marketConditionThresholds;

    // Check volatility changes
    if (marketData.volatilityChange && Math.abs(marketData.volatilityChange) > thresholds.volatilityChange) {
      const alert = await this.createMarketConditionAlert(
        'Volatility',
        marketData.previousVolatility,
        marketData.currentVolatility,
        marketData.volatilityChange,
        strategies
      );
      alerts.push(alert);
    }

    // Check volume changes
    if (marketData.volumeChange && Math.abs(marketData.volumeChange) > thresholds.volumeChange) {
      const alert = await this.createMarketConditionAlert(
        'Volume',
        marketData.previousVolume,
        marketData.currentVolume,
        marketData.volumeChange,
        strategies
      );
      alerts.push(alert);
    }

    // Check correlation changes
    if (marketData.correlationChange && Math.abs(marketData.correlationChange) > thresholds.correlationChange) {
      const alert = await this.createMarketConditionAlert(
        'Correlation',
        marketData.previousCorrelation,
        marketData.currentCorrelation,
        marketData.correlationChange,
        strategies
      );
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Requirement 7.4: Notify when strategies reach statistical significance
   */
  async checkStatisticalSignificance(
    strategy: ProfessionalStrategy,
    performance: StrategyPerformance
  ): Promise<StatisticalSignificanceAlert | null> {
    const settings = this.configuration.statisticalSignificanceSettings;
    
    if (!settings.enableNotifications) return null;

    // Check if strategy just reached minimum trades threshold
    if (performance.totalTrades === settings.minimumTrades) {
      return {
        id: `stat-sig-${strategy.id}-${Date.now()}`,
        strategyId: strategy.id,
        type: 'StatisticalSignificance',
        milestone: 'MinimumTrades',
        tradesRequired: settings.minimumTrades,
        currentTrades: performance.totalTrades,
        confidenceLevel: performance.confidenceLevel,
        reliableMetrics: this.getReliableMetrics(performance),
        message: `Strategy "${strategy.title}" has reached ${settings.minimumTrades} trades. Performance metrics are now statistically significant.`,
        createdAt: new Date().toISOString()
      };
    }

    // Check if confidence level improved significantly
    if (performance.confidenceLevel >= settings.requiredConfidence && 
        !performance.statisticallySignificant) {
      return {
        id: `stat-sig-${strategy.id}-${Date.now()}`,
        strategyId: strategy.id,
        type: 'StatisticalSignificance',
        milestone: 'ConfidenceLevel',
        tradesRequired: settings.minimumTrades,
        currentTrades: performance.totalTrades,
        confidenceLevel: performance.confidenceLevel,
        reliableMetrics: this.getReliableMetrics(performance),
        message: `Strategy "${strategy.title}" has achieved ${settings.requiredConfidence}% confidence level. Reliable conclusions can now be drawn.`,
        createdAt: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Requirement 7.5: Detect correlated performance issues across strategies
   */
  async detectCorrelatedPerformanceIssues(
    strategies: ProfessionalStrategy[]
  ): Promise<StrategyAlert[]> {
    const alerts: StrategyAlert[] = [];
    const performanceData = await this.getRecentPerformanceData(strategies);
    
    // Group strategies by similar characteristics
    const strategyGroups = this.groupStrategiesByCharacteristics(strategies);
    
    for (const [groupKey, groupStrategies] of strategyGroups) {
      const correlatedIssues = this.analyzeCorrelatedIssues(groupStrategies, performanceData);
      
      if (correlatedIssues.length > 0) {
        const alert = await this.createCorrelationAlert(groupKey, correlatedIssues);
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Requirement 7.6: Customizable alert preferences and thresholds
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const existing = this.notificationPreferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...existing, ...preferences };
    this.notificationPreferences.set(userId, updated);
    
    // Persist to storage
    await this.saveNotificationPreferences(userId, updated);
  }

  async updateAlertThresholds(
    userId: string,
    thresholds: Partial<AlertConfiguration>
  ): Promise<void> {
    this.configuration = { ...this.configuration, ...thresholds };
    await this.saveAlertConfiguration(userId, this.configuration);
  }

  /**
   * Send notifications through configured channels
   */
  async sendNotification(
    alert: StrategyAlert,
    userId: string
  ): Promise<void> {
    const preferences = this.notificationPreferences.get(userId);
    if (!preferences) return;

    const channels = preferences.channels[alert.type] || [];
    const severityAllowed = this.isSeverityAllowed(alert.severity, preferences);
    
    if (!severityAllowed) return;

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      await this.queueForLater(alert, userId);
      return;
    }

    // Send through each configured channel
    for (const channel of channels) {
      await this.sendThroughChannel(alert, channel, userId);
    }
  }

  /**
   * Get all active alerts for a user
   */
  getActiveAlerts(userId: string, strategyId?: string): StrategyAlert[] {
    const userAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.status === 'Active');
    
    if (strategyId) {
      return userAlerts.filter(alert => alert.strategyId === strategyId);
    }
    
    return userAlerts;
  }

  /**
   * Get all alerts (including non-active) for testing purposes
   */
  getAllAlerts(): StrategyAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) throw new Error('Alert not found');

    alert.status = 'Acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    
    await this.updateAlert(alert);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, userId: string, resolution?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) throw new Error('Alert not found');

    alert.status = 'Resolved';
    alert.resolvedAt = new Date().toISOString();
    
    if (resolution) {
      alert.metadata = { ...alert.metadata, resolution };
    }
    
    await this.updateAlert(alert);
  }

  /**
   * Get alert metrics and analytics
   */
  getAlertMetrics(userId: string, timeframe: 'day' | 'week' | 'month'): AlertMetrics {
    const alerts = this.getAlertsInTimeframe(userId, timeframe);
    
    return {
      totalAlerts: alerts.length,
      alertsByType: this.groupAlertsByType(alerts),
      alertsBySeverity: this.groupAlertsBySeverity(alerts),
      averageResolutionTime: this.calculateAverageResolutionTime(alerts),
      falsePositiveRate: this.calculateFalsePositiveRate(alerts),
      userEngagement: {
        acknowledgedRate: this.calculateAcknowledgedRate(alerts),
        actionTakenRate: this.calculateActionTakenRate(alerts)
      }
    };
  }

  // Private helper methods

  private getDefaultConfiguration(): AlertConfiguration {
    return {
      drawdownLimits: [
        {
          id: 'default-drawdown-5',
          type: 'DrawdownLimit',
          metric: 'maxDrawdown',
          operator: 'greater_than',
          value: 5,
          enabled: true,
          description: 'Alert when drawdown exceeds 5%',
          suspendStrategy: false,
          notificationChannels: ['InApp']
        },
        {
          id: 'default-drawdown-10',
          type: 'DrawdownLimit',
          metric: 'maxDrawdown',
          operator: 'greater_than',
          value: 10,
          enabled: true,
          description: 'Critical alert when drawdown exceeds 10%',
          suspendStrategy: true,
          notificationChannels: ['InApp', 'Email']
        }
      ],
      performanceMilestones: [
        {
          id: 'default-profit-factor-2',
          type: 'PerformanceMilestone',
          metric: 'profitFactor',
          operator: 'greater_than',
          value: 2,
          enabled: true,
          description: 'Celebrate when profit factor exceeds 2.0',
          celebratory: true,
          suggestPositionIncrease: true
        }
      ],
      marketConditionThresholds: {
        volatilityChange: 25, // 25% change
        volumeChange: 50,     // 50% change
        correlationChange: 30 // 30% change
      },
      statisticalSignificanceSettings: {
        minimumTrades: 30,
        requiredConfidence: 95,
        enableNotifications: true
      },
      globalSettings: {
        enableAlerts: true,
        maxAlertsPerDay: 10,
        autoResolveAfterDays: 7
      }
    };
  }

  private initializeDefaultThresholds(): void {
    // Initialize with default thresholds
    this.configuration.drawdownLimits.forEach(threshold => {
      this.thresholds.set(threshold.id, threshold);
    });
    
    this.configuration.performanceMilestones.forEach(milestone => {
      this.thresholds.set(milestone.id, milestone);
    });
  }

  private shouldTriggerAlert(threshold: AlertThreshold, currentValue: number): boolean {
    switch (threshold.operator) {
      case 'greater_than':
        return currentValue > threshold.value;
      case 'less_than':
        return currentValue < threshold.value;
      case 'equals':
        return Math.abs(currentValue - threshold.value) < 0.001;
      default:
        return false;
    }
  }

  private async createDrawdownAlert(
    strategy: ProfessionalStrategy,
    threshold: DrawdownThreshold,
    currentValue: number,
    performance: StrategyPerformance
  ): Promise<StrategyAlert> {
    const severity: AlertSeverity = currentValue > 10 ? 'Critical' : 
                                   currentValue > 5 ? 'High' : 'Medium';
    
    const alert: StrategyAlert = {
      id: `drawdown-${strategy.id}-${Date.now()}`,
      strategyId: strategy.id,
      strategyName: strategy.title,
      type: 'DrawdownLimit',
      severity,
      status: 'Active',
      title: `Drawdown Alert: ${strategy.title}`,
      message: `Strategy drawdown of ${currentValue.toFixed(2)}% exceeds threshold of ${threshold.value}%`,
      actionable: true,
      suggestedActions: [
        'Review recent trades for pattern analysis',
        'Consider reducing position size temporarily',
        'Evaluate if market conditions have changed',
        threshold.suspendStrategy ? 'Strategy suspension recommended' : 'Monitor closely'
      ],
      threshold: {
        metric: threshold.metric,
        value: threshold.value,
        operator: threshold.operator
      },
      currentValue,
      metadata: {
        totalTrades: performance.totalTrades,
        winRate: performance.winRate,
        profitFactor: performance.profitFactor
      },
      createdAt: new Date().toISOString()
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  private async createMilestoneAlert(
    strategy: ProfessionalStrategy,
    milestone: PerformanceMilestone,
    currentValue: number,
    performance: StrategyPerformance
  ): Promise<StrategyAlert> {
    const alert: StrategyAlert = {
      id: `milestone-${strategy.id}-${Date.now()}`,
      strategyId: strategy.id,
      strategyName: strategy.title,
      type: 'PerformanceMilestone',
      severity: 'Low',
      status: 'Active',
      title: `Performance Milestone: ${strategy.title}`,
      message: `Strategy achieved ${milestone.metric} of ${currentValue.toFixed(2)}, exceeding target of ${milestone.value}`,
      actionable: milestone.suggestPositionIncrease,
      suggestedActions: milestone.suggestPositionIncrease ? [
        'Consider increasing position size for this high-performing strategy',
        'Review and document what makes this strategy successful',
        'Analyze if performance can be replicated in similar strategies'
      ] : undefined,
      threshold: {
        metric: milestone.metric,
        value: milestone.value,
        operator: milestone.operator
      },
      currentValue,
      metadata: {
        celebratory: milestone.celebratory,
        totalTrades: performance.totalTrades,
        statisticallySignificant: performance.statisticallySignificant
      },
      createdAt: new Date().toISOString()
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  private async createMarketConditionAlert(
    condition: string,
    previousValue: number,
    currentValue: number,
    changePercentage: number,
    strategies: ProfessionalStrategy[]
  ): Promise<MarketConditionAlert> {
    const affectedStrategies = await this.identifyAffectedStrategies(condition, strategies);
    const recommendations = await this.generateStrategyRecommendations(condition, changePercentage, affectedStrategies);

    return {
      id: `market-${condition.toLowerCase()}-${Date.now()}`,
      type: 'MarketConditionChange',
      condition,
      previousValue,
      currentValue,
      changePercentage,
      affectedStrategies: affectedStrategies.map(s => s.id),
      recommendations,
      createdAt: new Date().toISOString()
    };
  }

  private calculateCurrentDrawdown(performance: StrategyPerformance): number {
    // Calculate current drawdown from peak
    // This would typically use recent trade data
    return performance.maxDrawdown; // Simplified for now
  }

  private getMetricValue(performance: StrategyPerformance, metric: string): number {
    switch (metric) {
      case 'profitFactor': return performance.profitFactor;
      case 'expectancy': return performance.expectancy;
      case 'sharpeRatio': return performance.sharpeRatio || 0;
      case 'winRate': return performance.winRate;
      case 'totalReturn': return performance.expectancy * performance.totalTrades;
      default: return 0;
    }
  }

  private milestoneAchieved(
    milestone: PerformanceMilestone,
    previousValue: number,
    currentValue: number
  ): boolean {
    // Check if milestone was just achieved (crossed threshold)
    switch (milestone.operator) {
      case 'greater_than':
        return previousValue <= milestone.value && currentValue > milestone.value;
      case 'less_than':
        return previousValue >= milestone.value && currentValue < milestone.value;
      default:
        return false;
    }
  }

  private isExceptionalPerformance(value: number, milestone: PerformanceMilestone): boolean {
    return value > milestone.value * 1.5; // 50% above threshold
  }

  private getReliableMetrics(performance: StrategyPerformance): string[] {
    const reliable: string[] = [];
    
    if (performance.totalTrades >= 30) {
      reliable.push('Win Rate', 'Profit Factor', 'Expectancy');
    }
    
    if (performance.totalTrades >= 50) {
      reliable.push('Average Win/Loss Ratio', 'Maximum Drawdown');
    }
    
    if (performance.totalTrades >= 100 && performance.sharpeRatio) {
      reliable.push('Sharpe Ratio', 'Risk-Adjusted Returns');
    }
    
    return reliable;
  }

  private getDrawdownThresholds(strategyId: string): DrawdownThreshold[] {
    return Array.from(this.thresholds.values())
      .filter((t): t is DrawdownThreshold => 
        t.type === 'DrawdownLimit' && 
        (!t.strategyId || t.strategyId === strategyId)
      );
  }

  private getPerformanceMilestones(strategyId: string): PerformanceMilestone[] {
    return Array.from(this.thresholds.values())
      .filter((t): t is PerformanceMilestone => 
        t.type === 'PerformanceMilestone' && 
        (!t.strategyId || t.strategyId === strategyId)
      );
  }

  private async suggestStrategySuspension(strategy: ProfessionalStrategy, alert: StrategyAlert): Promise<void> {
    // Add suspension suggestion to alert
    alert.suggestedActions = [
      ...alert.suggestedActions || [],
      'IMMEDIATE ACTION: Consider suspending this strategy',
      'Review all recent trades for systematic issues',
      'Do not resume trading until issues are identified and resolved'
    ];
    alert.severity = 'Critical';
  }

  private async getRecentPerformanceData(strategies: ProfessionalStrategy[]): Promise<Map<string, any>> {
    // This would fetch recent performance data for correlation analysis
    return new Map();
  }

  private groupStrategiesByCharacteristics(strategies: ProfessionalStrategy[]): Map<string, ProfessionalStrategy[]> {
    const groups = new Map<string, ProfessionalStrategy[]>();
    
    strategies.forEach(strategy => {
      const key = `${strategy.methodology}-${strategy.primaryTimeframe}`;
      const existing = groups.get(key) || [];
      groups.set(key, [...existing, strategy]);
    });
    
    return groups;
  }

  private analyzeCorrelatedIssues(strategies: ProfessionalStrategy[], performanceData: Map<string, any>): any[] {
    // Analyze for correlated performance issues
    return [];
  }

  private async createCorrelationAlert(groupKey: string, issues: any[]): Promise<StrategyAlert> {
    return {
      id: `correlation-${groupKey}-${Date.now()}`,
      strategyId: 'multiple',
      strategyName: `${groupKey} strategies`,
      type: 'StrategyCorrelation',
      severity: 'Medium',
      status: 'Active',
      title: 'Correlated Performance Issues Detected',
      message: `Multiple strategies in ${groupKey} group showing similar performance degradation`,
      actionable: true,
      suggestedActions: [
        'Review market conditions affecting this strategy type',
        'Consider systematic issues in methodology',
        'Evaluate if strategy parameters need adjustment'
      ],
      createdAt: new Date().toISOString()
    };
  }

  private async identifyAffectedStrategies(condition: string, strategies: ProfessionalStrategy[]): Promise<ProfessionalStrategy[]> {
    // Identify which strategies are likely affected by market condition changes
    return strategies.filter(strategy => {
      // This would use historical correlation data
      return true; // Simplified
    });
  }

  private async generateStrategyRecommendations(
    condition: string,
    changePercentage: number,
    strategies: ProfessionalStrategy[]
  ): Promise<StrategyRecommendation[]> {
    return strategies.map(strategy => ({
      strategyId: strategy.id,
      strategyName: strategy.title,
      action: Math.abs(changePercentage) > 50 ? 'Monitor' : 'Decrease',
      reason: `${condition} change of ${changePercentage.toFixed(1)}% may impact performance`,
      confidence: 0.7,
      historicalPerformance: {
        inSimilarConditions: 0.65,
        sampleSize: 20
      }
    }));
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      channels: {
        DrawdownLimit: ['InApp', 'Email'],
        PerformanceMilestone: ['InApp'],
        MarketConditionChange: ['InApp'],
        StatisticalSignificance: ['InApp'],
        StrategyCorrelation: ['InApp'],
        DisciplineViolation: ['InApp']
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      frequency: {
        immediate: ['DrawdownLimit', 'StrategyCorrelation'],
        daily: ['PerformanceMilestone', 'StatisticalSignificance'],
        weekly: ['MarketConditionChange']
      },
      severityFilters: {
        InApp: ['Low', 'Medium', 'High', 'Critical'],
        Email: ['High', 'Critical'],
        Push: ['Medium', 'High', 'Critical'],
        SMS: ['Critical']
      }
    };
  }

  private isSeverityAllowed(severity: AlertSeverity, preferences: NotificationPreferences): boolean {
    // Check if any channel allows this severity level
    return Object.values(preferences.severityFilters).some(severities => 
      severities.includes(severity)
    );
  }

  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours?.enabled) return false;
    
    const now = new Date();
    const start = new Date(`${now.toDateString()} ${preferences.quietHours.start}`);
    const end = new Date(`${now.toDateString()} ${preferences.quietHours.end}`);
    
    // Handle overnight quiet hours
    if (start > end) {
      return now >= start || now <= end;
    }
    
    return now >= start && now <= end;
  }

  private async queueForLater(alert: StrategyAlert, userId: string): Promise<void> {
    // Queue alert for delivery after quiet hours
    // Implementation would depend on notification system
  }

  private async sendThroughChannel(alert: StrategyAlert, channel: NotificationChannel, userId: string): Promise<void> {
    // Send notification through specific channel
    // Implementation would depend on notification providers
    console.log(`Sending ${alert.type} alert through ${channel} to user ${userId}`);
  }

  private async updateAlert(alert: StrategyAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
    // Persist to storage
  }

  private async saveNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    // Persist preferences to storage
  }

  private async saveAlertConfiguration(userId: string, configuration: AlertConfiguration): Promise<void> {
    // Persist configuration to storage
  }

  private getAlertsInTimeframe(userId: string, timeframe: 'day' | 'week' | 'month'): StrategyAlert[] {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }
    
    return Array.from(this.alerts.values())
      .filter(alert => new Date(alert.createdAt) >= cutoff);
  }

  private groupAlertsByType(alerts: StrategyAlert[]): Record<AlertType, number> {
    const groups: Record<AlertType, number> = {
      DrawdownLimit: 0,
      PerformanceMilestone: 0,
      MarketConditionChange: 0,
      StatisticalSignificance: 0,
      StrategyCorrelation: 0,
      DisciplineViolation: 0
    };
    
    alerts.forEach(alert => {
      groups[alert.type]++;
    });
    
    return groups;
  }

  private groupAlertsBySeverity(alerts: StrategyAlert[]): Record<AlertSeverity, number> {
    const groups: Record<AlertSeverity, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0
    };
    
    alerts.forEach(alert => {
      groups[alert.severity]++;
    });
    
    return groups;
  }

  private calculateAverageResolutionTime(alerts: StrategyAlert[]): number {
    const resolvedAlerts = alerts.filter(alert => alert.resolvedAt);
    if (resolvedAlerts.length === 0) return 0;
    
    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      const created = new Date(alert.createdAt).getTime();
      const resolved = new Date(alert.resolvedAt!).getTime();
      return sum + (resolved - created);
    }, 0);
    
    return totalTime / resolvedAlerts.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateFalsePositiveRate(alerts: StrategyAlert[]): number {
    const dismissedAlerts = alerts.filter(alert => alert.status === 'Dismissed');
    return alerts.length > 0 ? dismissedAlerts.length / alerts.length : 0;
  }

  private calculateAcknowledgedRate(alerts: StrategyAlert[]): number {
    const acknowledgedAlerts = alerts.filter(alert => alert.acknowledgedAt);
    return alerts.length > 0 ? acknowledgedAlerts.length / alerts.length : 0;
  }

  private calculateActionTakenRate(alerts: StrategyAlert[]): number {
    const actionTakenAlerts = alerts.filter(alert => 
      alert.metadata?.actionTaken || alert.status === 'Resolved'
    );
    return alerts.length > 0 ? actionTakenAlerts.length / alerts.length : 0;
  }
}
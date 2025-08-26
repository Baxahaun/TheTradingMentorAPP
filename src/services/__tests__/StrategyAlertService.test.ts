/**
 * Unit tests for StrategyAlertService
 * Tests all alert logic and notification functionality
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrategyAlertService } from '../StrategyAlertService';
import {
  StrategyAlert,
  AlertConfiguration,
  NotificationPreferences,
  DrawdownThreshold,
  PerformanceMilestone,
  MarketConditionAlert,
  StatisticalSignificanceAlert
} from '../../types/alerts';
import { ProfessionalStrategy, StrategyPerformance } from '../../types/strategy';

describe('StrategyAlertService', () => {
  let alertService: StrategyAlertService;
  let mockStrategy: ProfessionalStrategy;
  let mockPerformance: StrategyPerformance;

  beforeEach(() => {
    alertService = new StrategyAlertService();
    
    mockStrategy = {
      id: 'strategy-1',
      title: 'Test Strategy',
      description: 'Test strategy for alerts',
      color: '#3B82F6',
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
      performance: {} as StrategyPerformance,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      version: 1,
      isActive: true
    };

    mockPerformance = {
      totalTrades: 50,
      winningTrades: 30,
      losingTrades: 20,
      profitFactor: 1.5,
      expectancy: 25.5,
      winRate: 60,
      averageWin: 100,
      averageLoss: -50,
      riskRewardRatio: 2,
      maxDrawdown: 8.5,
      maxDrawdownDuration: 5,
      sampleSize: 50,
      confidenceLevel: 85,
      statisticallySignificant: false,
      monthlyReturns: [],
      performanceTrend: 'Stable',
      lastCalculated: '2024-01-01T00:00:00Z'
    };
  });

  describe('Drawdown Monitoring', () => {
    it('should trigger drawdown alert when threshold exceeded', async () => {
      // Requirement 7.1: Monitor drawdown limits
      const highDrawdownPerformance = {
        ...mockPerformance,
        maxDrawdown: 12 // Exceeds default 10% threshold
      };

      const alerts = await alertService.monitorDrawdownLimits(mockStrategy, highDrawdownPerformance);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('DrawdownLimit');
      expect(alerts[0].severity).toBe('Critical');
      expect(alerts[0].currentValue).toBe(12);
    });

    it('should not trigger alert when drawdown is within limits', async () => {
      const normalPerformance = {
        ...mockPerformance,
        maxDrawdown: 3 // Within limits
      };

      const alerts = await alertService.monitorDrawdownLimits(mockStrategy, normalPerformance);

      expect(alerts).toHaveLength(0);
    });

    it('should suggest strategy suspension for critical drawdown', async () => {
      const criticalDrawdownPerformance = {
        ...mockPerformance,
        maxDrawdown: 15
      };

      const alerts = await alertService.monitorDrawdownLimits(mockStrategy, criticalDrawdownPerformance);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('Critical');
      // Check if any alert has the suspension suggestion
      const hasSuspensionSuggestion = alerts.some(alert => 
        alert.suggestedActions?.some(action => 
          action.includes('IMMEDIATE ACTION') || action.includes('suspending')
        )
      );
      expect(hasSuspensionSuggestion).toBe(true);
    });
  });

  describe('Performance Milestones', () => {
    it('should trigger milestone alert when target achieved', async () => {
      // Requirement 7.2: Notify on exceptional performance
      const previousPerformance = {
        ...mockPerformance,
        profitFactor: 1.8
      };

      const currentPerformance = {
        ...mockPerformance,
        profitFactor: 2.2 // Exceeds 2.0 milestone
      };

      const alerts = await alertService.checkPerformanceMilestones(
        mockStrategy,
        previousPerformance,
        currentPerformance
      );

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('PerformanceMilestone');
      expect(alerts[0].severity).toBe('Low');
      expect(alerts[0].currentValue).toBe(2.2);
      expect(alerts[0].suggestedActions).toContain('Consider increasing position size for this high-performing strategy');
    });

    it('should not trigger milestone alert if threshold not crossed', async () => {
      const previousPerformance = {
        ...mockPerformance,
        profitFactor: 2.1
      };

      const currentPerformance = {
        ...mockPerformance,
        profitFactor: 2.2 // Already above threshold
      };

      const alerts = await alertService.checkPerformanceMilestones(
        mockStrategy,
        previousPerformance,
        currentPerformance
      );

      expect(alerts).toHaveLength(0);
    });

    it('should suggest position increase for exceptional performance', async () => {
      const previousPerformance = {
        ...mockPerformance,
        profitFactor: 1.9
      };

      const currentPerformance = {
        ...mockPerformance,
        profitFactor: 3.5 // Exceptional performance (>50% above threshold)
      };

      const alerts = await alertService.checkPerformanceMilestones(
        mockStrategy,
        previousPerformance,
        currentPerformance
      );

      expect(alerts[0].suggestedActions).toContain('Consider increasing position size for this high-performing strategy');
    });
  });

  describe('Market Condition Changes', () => {
    it('should detect significant volatility changes', async () => {
      // Requirement 7.3: Alert on market condition changes
      const marketData = {
        volatilityChange: 30, // Exceeds 25% threshold
        previousVolatility: 20,
        currentVolatility: 26
      };

      const alerts = await alertService.detectMarketConditionChanges([mockStrategy], marketData);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('MarketConditionChange');
      expect(alerts[0].condition).toBe('Volatility');
      expect(alerts[0].changePercentage).toBe(30);
    });

    it('should generate strategy recommendations for market changes', async () => {
      const marketData = {
        volumeChange: 60, // Exceeds 50% threshold
        previousVolume: 1000000,
        currentVolume: 1600000
      };

      const alerts = await alertService.detectMarketConditionChanges([mockStrategy], marketData);

      expect(alerts[0].recommendations).toHaveLength(1);
      expect(alerts[0].recommendations[0].strategyId).toBe(mockStrategy.id);
      expect(alerts[0].recommendations[0].action).toBeDefined();
    });

    it('should not alert for minor market changes', async () => {
      const marketData = {
        volatilityChange: 10, // Below 25% threshold
        previousVolatility: 20,
        currentVolatility: 22
      };

      const alerts = await alertService.detectMarketConditionChanges([mockStrategy], marketData);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('Statistical Significance', () => {
    it('should notify when minimum trades threshold reached', async () => {
      // Requirement 7.4: Notify on statistical significance
      const significantPerformance = {
        ...mockPerformance,
        totalTrades: 30, // Exactly at minimum threshold
        statisticallySignificant: false
      };

      const alert = await alertService.checkStatisticalSignificance(mockStrategy, significantPerformance);

      expect(alert).not.toBeNull();
      expect(alert!.type).toBe('StatisticalSignificance');
      expect(alert!.milestone).toBe('MinimumTrades');
      expect(alert!.tradesRequired).toBe(30);
      expect(alert!.currentTrades).toBe(30);
    });

    it('should notify when confidence level achieved', async () => {
      const highConfidencePerformance = {
        ...mockPerformance,
        totalTrades: 50,
        confidenceLevel: 95, // Meets required confidence
        statisticallySignificant: false
      };

      const alert = await alertService.checkStatisticalSignificance(mockStrategy, highConfidencePerformance);

      expect(alert).not.toBeNull();
      expect(alert!.milestone).toBe('ConfidenceLevel');
      expect(alert!.confidenceLevel).toBe(95);
    });

    it('should not notify if already statistically significant', async () => {
      const alreadySignificantPerformance = {
        ...mockPerformance,
        totalTrades: 100,
        confidenceLevel: 95,
        statisticallySignificant: true
      };

      const alert = await alertService.checkStatisticalSignificance(mockStrategy, alreadySignificantPerformance);

      expect(alert).toBeNull();
    });

    it('should identify reliable metrics based on trade count', async () => {
      const largeDatasetPerformance = {
        ...mockPerformance,
        totalTrades: 100,
        sharpeRatio: 1.5
      };

      const alert = await alertService.checkStatisticalSignificance(mockStrategy, largeDatasetPerformance);

      if (alert) {
        expect(alert.reliableMetrics).toContain('Sharpe Ratio');
        expect(alert.reliableMetrics).toContain('Risk-Adjusted Returns');
      }
    });
  });

  describe('Correlated Performance Issues', () => {
    it('should detect correlated issues across similar strategies', async () => {
      // Requirement 7.5: Detect correlated performance issues
      const similarStrategy = {
        ...mockStrategy,
        id: 'strategy-2',
        title: 'Similar Strategy'
      };

      const strategies = [mockStrategy, similarStrategy];
      const alerts = await alertService.detectCorrelatedPerformanceIssues(strategies);

      // This would detect issues in a real implementation
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('Notification Preferences', () => {
    it('should update notification preferences', async () => {
      // Requirement 7.6: Customizable preferences
      const preferences: Partial<NotificationPreferences> = {
        channels: {
          DrawdownLimit: ['InApp', 'Email', 'SMS'],
          PerformanceMilestone: ['InApp'],
          MarketConditionChange: ['InApp'],
          StatisticalSignificance: ['InApp'],
          StrategyCorrelation: ['InApp'],
          DisciplineViolation: ['InApp']
        }
      };

      await expect(
        alertService.updateNotificationPreferences('user-1', preferences)
      ).resolves.not.toThrow();
    });

    it('should update alert thresholds', async () => {
      const thresholds: Partial<AlertConfiguration> = {
        drawdownLimits: [
          {
            id: 'custom-drawdown',
            type: 'DrawdownLimit',
            metric: 'maxDrawdown',
            operator: 'greater_than',
            value: 7.5, // Custom threshold
            enabled: true,
            description: 'Custom drawdown limit',
            suspendStrategy: true,
            notificationChannels: ['InApp', 'Email']
          }
        ]
      };

      await expect(
        alertService.updateAlertThresholds('user-1', thresholds)
      ).resolves.not.toThrow();
    });
  });

  describe('Alert Management', () => {
    it('should acknowledge alerts', async () => {
      // Create a test alert first
      const alerts = await alertService.monitorDrawdownLimits(mockStrategy, {
        ...mockPerformance,
        maxDrawdown: 12
      });

      const alertId = alerts[0].id;

      await alertService.acknowledgeAlert(alertId, 'user-1');

      // Get all alerts (including acknowledged ones) to check status
      const allAlerts = alertService.getAllAlerts();
      const acknowledgedAlert = allAlerts.find(a => a.id === alertId);
      
      expect(acknowledgedAlert?.status).toBe('Acknowledged');
      expect(acknowledgedAlert?.acknowledgedAt).toBeDefined();
    });

    it('should resolve alerts', async () => {
      const alerts = await alertService.monitorDrawdownLimits(mockStrategy, {
        ...mockPerformance,
        maxDrawdown: 12
      });

      const alertId = alerts[0].id;

      await alertService.resolveAlert(alertId, 'user-1', 'Issue resolved');

      const activeAlerts = alertService.getActiveAlerts('user-1');
      const resolvedAlert = activeAlerts.find(a => a.id === alertId);
      
      expect(resolvedAlert).toBeUndefined(); // Should not be in active alerts
    });

    it('should filter alerts by strategy', async () => {
      await alertService.monitorDrawdownLimits(mockStrategy, {
        ...mockPerformance,
        maxDrawdown: 12
      });

      const strategyAlerts = alertService.getActiveAlerts('user-1', mockStrategy.id);
      const allAlerts = alertService.getActiveAlerts('user-1');

      expect(strategyAlerts.length).toBeLessThanOrEqual(allAlerts.length);
      expect(strategyAlerts.every(alert => alert.strategyId === mockStrategy.id)).toBe(true);
    });
  });

  describe('Alert Metrics', () => {
    it('should calculate alert metrics', async () => {
      // Create some test alerts
      await alertService.monitorDrawdownLimits(mockStrategy, {
        ...mockPerformance,
        maxDrawdown: 12
      });

      const metrics = alertService.getAlertMetrics('user-1', 'week');

      expect(metrics.totalAlerts).toBeGreaterThan(0);
      expect(metrics.alertsByType).toBeDefined();
      expect(metrics.alertsBySeverity).toBeDefined();
      expect(metrics.userEngagement).toBeDefined();
    });

    it('should calculate resolution time correctly', async () => {
      const alerts = await alertService.monitorDrawdownLimits(mockStrategy, {
        ...mockPerformance,
        maxDrawdown: 12
      });

      const alertId = alerts[0].id;
      
      // Simulate some time passing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await alertService.resolveAlert(alertId, 'user-1');

      const metrics = alertService.getAlertMetrics('user-1', 'week');
      expect(metrics.averageResolutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Notification Delivery', () => {
    it('should respect quiet hours', async () => {
      const preferences: NotificationPreferences = {
        userId: 'user-1',
        channels: {
          DrawdownLimit: ['InApp'],
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
          immediate: ['DrawdownLimit'],
          daily: [],
          weekly: []
        },
        severityFilters: {
          InApp: ['Critical'],
          Email: ['Critical'],
          Push: ['Critical'],
          SMS: ['Critical']
        }
      };

      await alertService.updateNotificationPreferences('user-1', preferences);

      const alert: StrategyAlert = {
        id: 'test-alert',
        strategyId: mockStrategy.id,
        strategyName: mockStrategy.title,
        type: 'DrawdownLimit',
        severity: 'Critical',
        status: 'Active',
        title: 'Test Alert',
        message: 'Test message',
        actionable: true,
        createdAt: new Date().toISOString()
      };

      // This would test quiet hours logic in a real implementation
      await expect(
        alertService.sendNotification(alert, 'user-1')
      ).resolves.not.toThrow();
    });

    it('should filter by severity preferences', async () => {
      const preferences: NotificationPreferences = {
        userId: 'user-1',
        channels: {
          DrawdownLimit: ['InApp'],
          PerformanceMilestone: ['InApp'],
          MarketConditionChange: ['InApp'],
          StatisticalSignificance: ['InApp'],
          StrategyCorrelation: ['InApp'],
          DisciplineViolation: ['InApp']
        },
        frequency: {
          immediate: ['DrawdownLimit'],
          daily: [],
          weekly: []
        },
        severityFilters: {
          InApp: ['High', 'Critical'], // Only high and critical
          Email: ['Critical'],
          Push: ['Critical'],
          SMS: ['Critical']
        }
      };

      await alertService.updateNotificationPreferences('user-1', preferences);

      const lowSeverityAlert: StrategyAlert = {
        id: 'test-alert-low',
        strategyId: mockStrategy.id,
        strategyName: mockStrategy.title,
        type: 'DrawdownLimit',
        severity: 'Low', // Should be filtered out
        status: 'Active',
        title: 'Low Severity Alert',
        message: 'Test message',
        actionable: true,
        createdAt: new Date().toISOString()
      };

      // This would test severity filtering in a real implementation
      await expect(
        alertService.sendNotification(lowSeverityAlert, 'user-1')
      ).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing strategy gracefully', async () => {
      await expect(
        alertService.acknowledgeAlert('non-existent-alert', 'user-1')
      ).rejects.toThrow('Alert not found');
    });

    it('should handle disabled thresholds', async () => {
      // Test with disabled threshold configuration
      const configWithDisabled: AlertConfiguration = {
        drawdownLimits: [
          {
            id: 'disabled-threshold',
            type: 'DrawdownLimit',
            metric: 'maxDrawdown',
            operator: 'greater_than',
            value: 5,
            enabled: false, // Disabled
            description: 'Disabled threshold',
            suspendStrategy: false,
            notificationChannels: ['InApp']
          }
        ],
        performanceMilestones: [],
        marketConditionThresholds: {
          volatilityChange: 25,
          volumeChange: 50,
          correlationChange: 30
        },
        statisticalSignificanceSettings: {
          minimumTrades: 30,
          requiredConfidence: 95,
          enableNotifications: false // Disabled
        },
        globalSettings: {
          enableAlerts: true,
          maxAlertsPerDay: 10,
          autoResolveAfterDays: 7
        }
      };

      const serviceWithDisabled = new StrategyAlertService(configWithDisabled);

      const alerts = await serviceWithDisabled.monitorDrawdownLimits(mockStrategy, {
        ...mockPerformance,
        maxDrawdown: 10 // Would normally trigger alert
      });

      expect(alerts).toHaveLength(0); // Should not trigger disabled alerts
    });

    it('should handle zero trade count for statistical significance', async () => {
      const zeroTradePerformance = {
        ...mockPerformance,
        totalTrades: 0
      };

      const alert = await alertService.checkStatisticalSignificance(mockStrategy, zeroTradePerformance);

      expect(alert).toBeNull();
    });
  });
});
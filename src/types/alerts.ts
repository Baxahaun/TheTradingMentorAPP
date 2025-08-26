/**
 * Types for the Strategy Performance Alerts and Notification System
 * Requirement 7: Strategy Performance Alerts and Notifications
 */

export type AlertType = 
  | 'DrawdownLimit'
  | 'PerformanceMilestone'
  | 'MarketConditionChange'
  | 'StatisticalSignificance'
  | 'StrategyCorrelation'
  | 'DisciplineViolation';

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved' | 'Dismissed';

export interface StrategyAlert {
  id: string;
  strategyId: string;
  strategyName: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  actionable: boolean;
  suggestedActions?: string[];
  threshold?: {
    metric: string;
    value: number;
    operator: 'greater_than' | 'less_than' | 'equals';
  };
  currentValue?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertThreshold {
  id: string;
  strategyId?: string; // undefined means global threshold
  type: AlertType;
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals';
  value: number;
  enabled: boolean;
  description: string;
}

export interface DrawdownThreshold extends AlertThreshold {
  type: 'DrawdownLimit';
  metric: 'maxDrawdown' | 'currentDrawdown';
  suspendStrategy: boolean;
  notificationChannels: NotificationChannel[];
}

export interface PerformanceMilestone extends AlertThreshold {
  type: 'PerformanceMilestone';
  metric: 'profitFactor' | 'expectancy' | 'sharpeRatio' | 'winRate' | 'totalReturn';
  celebratory: boolean;
  suggestPositionIncrease: boolean;
}

export interface MarketConditionAlert {
  id: string;
  type: 'MarketConditionChange';
  condition: string;
  previousValue: number;
  currentValue: number;
  changePercentage: number;
  affectedStrategies: string[];
  recommendations: StrategyRecommendation[];
  createdAt: string;
}

export interface StrategyRecommendation {
  strategyId: string;
  strategyName: string;
  action: 'Increase' | 'Decrease' | 'Suspend' | 'Activate' | 'Monitor';
  reason: string;
  confidence: number;
  historicalPerformance?: {
    inSimilarConditions: number;
    sampleSize: number;
  };
}

export interface StatisticalSignificanceAlert {
  id: string;
  strategyId: string;
  type: 'StatisticalSignificance';
  milestone: 'MinimumTrades' | 'ConfidenceLevel' | 'ReliableMetrics';
  tradesRequired: number;
  currentTrades: number;
  confidenceLevel: number;
  reliableMetrics: string[];
  message: string;
  createdAt: string;
}

export type NotificationChannel = 'InApp' | 'Email' | 'Push' | 'SMS';

export interface NotificationPreferences {
  userId: string;
  channels: {
    [K in AlertType]: NotificationChannel[];
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  frequency: {
    immediate: AlertType[];
    daily: AlertType[];
    weekly: AlertType[];
  };
  severityFilters: {
    [K in NotificationChannel]: AlertSeverity[];
  };
}

export interface AlertConfiguration {
  drawdownLimits: DrawdownThreshold[];
  performanceMilestones: PerformanceMilestone[];
  marketConditionThresholds: {
    volatilityChange: number;
    volumeChange: number;
    correlationChange: number;
  };
  statisticalSignificanceSettings: {
    minimumTrades: number;
    requiredConfidence: number;
    enableNotifications: boolean;
  };
  globalSettings: {
    enableAlerts: boolean;
    maxAlertsPerDay: number;
    autoResolveAfterDays: number;
  };
}

export interface AlertMetrics {
  totalAlerts: number;
  alertsByType: Record<AlertType, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
  averageResolutionTime: number;
  falsePositiveRate: number;
  userEngagement: {
    acknowledgedRate: number;
    actionTakenRate: number;
  };
}
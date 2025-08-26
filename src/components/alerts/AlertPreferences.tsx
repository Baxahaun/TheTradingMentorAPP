/**
 * Alert Preferences Component
 * Allows users to customize alert thresholds and notification preferences
 * Requirements: 7.6 - Customizable alert preferences and thresholds
 */

import React, { useState, useEffect } from 'react';
import { Save, Bell, Mail, Smartphone, MessageSquare, Clock, Volume2 } from 'lucide-react';
import {
  NotificationPreferences,
  AlertConfiguration,
  AlertType,
  NotificationChannel,
  AlertSeverity,
  DrawdownThreshold,
  PerformanceMilestone
} from '../../types/alerts';
import { StrategyAlertService } from '../../services/StrategyAlertService';

interface AlertPreferencesProps {
  userId: string;
  alertService: StrategyAlertService;
  onSave?: () => void;
}

export const AlertPreferences: React.FC<AlertPreferencesProps> = ({
  userId,
  alertService,
  onSave
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [configuration, setConfiguration] = useState<AlertConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'thresholds' | 'schedule'>('notifications');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // In a real implementation, these would be loaded from the service
      const defaultPrefs: NotificationPreferences = {
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

      const defaultConfig: AlertConfiguration = {
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
          volatilityChange: 25,
          volumeChange: 50,
          correlationChange: 30
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

      setPreferences(defaultPrefs);
      setConfiguration(defaultConfig);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences || !configuration) return;

    try {
      setSaving(true);
      await alertService.updateNotificationPreferences(userId, preferences);
      await alertService.updateAlertThresholds(userId, configuration);
      onSave?.();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateChannelPreference = (alertType: AlertType, channel: NotificationChannel, enabled: boolean) => {
    if (!preferences) return;

    const currentChannels = preferences.channels[alertType] || [];
    const updatedChannels = enabled
      ? [...currentChannels.filter(c => c !== channel), channel]
      : currentChannels.filter(c => c !== channel);

    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [alertType]: updatedChannels
      }
    });
  };

  const updateSeverityFilter = (channel: NotificationChannel, severity: AlertSeverity, enabled: boolean) => {
    if (!preferences) return;

    const currentSeverities = preferences.severityFilters[channel] || [];
    const updatedSeverities = enabled
      ? [...currentSeverities.filter(s => s !== severity), severity]
      : currentSeverities.filter(s => s !== severity);

    setPreferences({
      ...preferences,
      severityFilters: {
        ...preferences.severityFilters,
        [channel]: updatedSeverities
      }
    });
  };

  const updateDrawdownThreshold = (index: number, field: keyof DrawdownThreshold, value: any) => {
    if (!configuration) return;

    const updatedThresholds = [...configuration.drawdownLimits];
    updatedThresholds[index] = { ...updatedThresholds[index], [field]: value };

    setConfiguration({
      ...configuration,
      drawdownLimits: updatedThresholds
    });
  };

  const updatePerformanceMilestone = (index: number, field: keyof PerformanceMilestone, value: any) => {
    if (!configuration) return;

    const updatedMilestones = [...configuration.performanceMilestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };

    setConfiguration({
      ...configuration,
      performanceMilestones: updatedMilestones
    });
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'InApp': return <Bell className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Push': return <Smartphone className="w-4 h-4" />;
      case 'SMS': return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading || !preferences || !configuration) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Alert Preferences</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'thresholds', label: 'Thresholds', icon: Volume2 },
            { id: 'schedule', label: 'Schedule', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'notifications' && (
          <NotificationChannelsTab
            preferences={preferences}
            onChannelChange={updateChannelPreference}
            onSeverityChange={updateSeverityFilter}
            getChannelIcon={getChannelIcon}
          />
        )}

        {activeTab === 'thresholds' && (
          <ThresholdsTab
            configuration={configuration}
            onDrawdownChange={updateDrawdownThreshold}
            onMilestoneChange={updatePerformanceMilestone}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab
            preferences={preferences}
            onChange={setPreferences}
          />
        )}
      </div>
    </div>
  );
};

interface NotificationChannelsTabProps {
  preferences: NotificationPreferences;
  onChannelChange: (alertType: AlertType, channel: NotificationChannel, enabled: boolean) => void;
  onSeverityChange: (channel: NotificationChannel, severity: AlertSeverity, enabled: boolean) => void;
  getChannelIcon: (channel: NotificationChannel) => React.ReactNode;
}

const NotificationChannelsTab: React.FC<NotificationChannelsTabProps> = ({
  preferences,
  onChannelChange,
  onSeverityChange,
  getChannelIcon
}) => {
  const alertTypes: { type: AlertType; label: string; description: string }[] = [
    { type: 'DrawdownLimit', label: 'Drawdown Alerts', description: 'When strategy losses exceed limits' },
    { type: 'PerformanceMilestone', label: 'Performance Milestones', description: 'When strategies achieve targets' },
    { type: 'MarketConditionChange', label: 'Market Changes', description: 'When market conditions shift significantly' },
    { type: 'StatisticalSignificance', label: 'Statistical Updates', description: 'When strategies reach significance thresholds' },
    { type: 'StrategyCorrelation', label: 'Correlation Issues', description: 'When multiple strategies show correlated problems' },
    { type: 'DisciplineViolation', label: 'Discipline Violations', description: 'When trades deviate from strategy rules' }
  ];

  const channels: NotificationChannel[] = ['InApp', 'Email', 'Push', 'SMS'];
  const severities: AlertSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

  return (
    <div className="space-y-6">
      {/* Alert Type Channels */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Notification Channels by Alert Type</h4>
        <div className="space-y-4">
          {alertTypes.map(({ type, label, description }) => (
            <div key={type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h5 className="font-medium text-gray-900">{label}</h5>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
              <div className="flex space-x-4">
                {channels.map(channel => (
                  <label key={channel} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={preferences.channels[type]?.includes(channel) || false}
                      onChange={(e) => onChannelChange(type, channel, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-1">
                      {getChannelIcon(channel)}
                      <span className="text-sm text-gray-700">{channel}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Severity Filters */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Severity Filters by Channel</h4>
        <div className="grid grid-cols-2 gap-4">
          {channels.map(channel => (
            <div key={channel} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                {getChannelIcon(channel)}
                <h5 className="font-medium text-gray-900">{channel}</h5>
              </div>
              <div className="space-y-2">
                {severities.map(severity => (
                  <label key={severity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={preferences.severityFilters[channel]?.includes(severity) || false}
                      onChange={(e) => onSeverityChange(channel, severity, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm px-2 py-1 rounded ${
                      severity === 'Critical' ? 'bg-red-100 text-red-800' :
                      severity === 'High' ? 'bg-orange-100 text-orange-800' :
                      severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {severity}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ThresholdsTabProps {
  configuration: AlertConfiguration;
  onDrawdownChange: (index: number, field: keyof DrawdownThreshold, value: any) => void;
  onMilestoneChange: (index: number, field: keyof PerformanceMilestone, value: any) => void;
}

const ThresholdsTab: React.FC<ThresholdsTabProps> = ({
  configuration,
  onDrawdownChange,
  onMilestoneChange
}) => {
  return (
    <div className="space-y-6">
      {/* Drawdown Limits */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Drawdown Limits</h4>
        <div className="space-y-4">
          {configuration.drawdownLimits.map((threshold, index) => (
            <div key={threshold.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={threshold.value}
                    onChange={(e) => onDrawdownChange(index, 'value', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metric
                  </label>
                  <select
                    value={threshold.metric}
                    onChange={(e) => onDrawdownChange(index, 'metric', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="maxDrawdown">Max Drawdown</option>
                    <option value="currentDrawdown">Current Drawdown</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={threshold.enabled}
                      onChange={(e) => onDrawdownChange(index, 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enabled</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={threshold.suspendStrategy}
                      onChange={(e) => onDrawdownChange(index, 'suspendStrategy', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Auto-suspend</span>
                  </label>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={threshold.description}
                  onChange={(e) => onDrawdownChange(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Milestones */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Performance Milestones</h4>
        <div className="space-y-4">
          {configuration.performanceMilestones.map((milestone, index) => (
            <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={milestone.value}
                    onChange={(e) => onMilestoneChange(index, 'value', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metric
                  </label>
                  <select
                    value={milestone.metric}
                    onChange={(e) => onMilestoneChange(index, 'metric', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="profitFactor">Profit Factor</option>
                    <option value="expectancy">Expectancy</option>
                    <option value="sharpeRatio">Sharpe Ratio</option>
                    <option value="winRate">Win Rate</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={milestone.enabled}
                      onChange={(e) => onMilestoneChange(index, 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enabled</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={milestone.suggestPositionIncrease}
                      onChange={(e) => onMilestoneChange(index, 'suggestPositionIncrease', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Suggest increase</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ScheduleTabProps {
  preferences: NotificationPreferences;
  onChange: (preferences: NotificationPreferences) => void;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ preferences, onChange }) => {
  const updateQuietHours = (field: string, value: any) => {
    onChange({
      ...preferences,
      quietHours: {
        ...preferences.quietHours!,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Quiet Hours */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Quiet Hours</h4>
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={preferences.quietHours?.enabled || false}
              onChange={(e) => updateQuietHours('enabled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable quiet hours</span>
          </div>
          
          {preferences.quietHours?.enabled && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) => updateQuietHours('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) => updateQuietHours('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={preferences.quietHours.timezone}
                  onChange={(e) => updateQuietHours('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Frequency */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Notification Frequency</h4>
        <div className="text-sm text-gray-600 mb-4">
          Configure how often you receive different types of alerts
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Immediate</h5>
            <p className="text-xs text-gray-500 mb-3">Sent as soon as they occur</p>
            <div className="space-y-2">
              {Object.keys(preferences.channels).map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preferences.frequency.immediate.includes(type as AlertType)}
                    onChange={(e) => {
                      const immediate = e.target.checked
                        ? [...preferences.frequency.immediate, type as AlertType]
                        : preferences.frequency.immediate.filter(t => t !== type);
                      onChange({
                        ...preferences,
                        frequency: { ...preferences.frequency, immediate }
                      });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Daily Digest</h5>
            <p className="text-xs text-gray-500 mb-3">Sent once per day</p>
            <div className="space-y-2">
              {Object.keys(preferences.channels).map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preferences.frequency.daily.includes(type as AlertType)}
                    onChange={(e) => {
                      const daily = e.target.checked
                        ? [...preferences.frequency.daily, type as AlertType]
                        : preferences.frequency.daily.filter(t => t !== type);
                      onChange({
                        ...preferences,
                        frequency: { ...preferences.frequency, daily }
                      });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Weekly Summary</h5>
            <p className="text-xs text-gray-500 mb-3">Sent once per week</p>
            <div className="space-y-2">
              {Object.keys(preferences.channels).map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preferences.frequency.weekly.includes(type as AlertType)}
                    onChange={(e) => {
                      const weekly = e.target.checked
                        ? [...preferences.frequency.weekly, type as AlertType]
                        : preferences.frequency.weekly.filter(t => t !== type);
                      onChange({
                        ...preferences,
                        frequency: { ...preferences.frequency, weekly }
                      });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertPreferences;
/**
 * Alerts Panel Component
 * Displays strategy performance alerts and notifications
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingUp, Activity, Settings, X, Check } from 'lucide-react';
import { StrategyAlert, AlertSeverity, AlertType, AlertMetrics } from '../../types/alerts';
import { StrategyAlertService } from '../../services/StrategyAlertService';

interface AlertsPanelProps {
  userId: string;
  strategyId?: string;
  alertService: StrategyAlertService;
  onAlertAction?: (alertId: string, action: 'acknowledge' | 'resolve' | 'dismiss') => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  userId,
  strategyId,
  alertService,
  onAlertAction
}) => {
  const [alerts, setAlerts] = useState<StrategyAlert[]>([]);
  const [metrics, setMetrics] = useState<AlertMetrics | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'All'>('All');
  const [selectedType, setSelectedType] = useState<AlertType | 'All'>('All');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    loadMetrics();
  }, [userId, strategyId, selectedSeverity, selectedType]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const activeAlerts = alertService.getActiveAlerts(userId, strategyId);
      const filteredAlerts = filterAlerts(activeAlerts);
      setAlerts(filteredAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const alertMetrics = alertService.getAlertMetrics(userId, 'week');
      setMetrics(alertMetrics);
    } catch (error) {
      console.error('Failed to load alert metrics:', error);
    }
  };

  const filterAlerts = (allAlerts: StrategyAlert[]): StrategyAlert[] => {
    return allAlerts.filter(alert => {
      const severityMatch = selectedSeverity === 'All' || alert.severity === selectedSeverity;
      const typeMatch = selectedType === 'All' || alert.type === selectedType;
      return severityMatch && typeMatch;
    });
  };

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve' | 'dismiss') => {
    try {
      switch (action) {
        case 'acknowledge':
          await alertService.acknowledgeAlert(alertId, userId);
          break;
        case 'resolve':
          await alertService.resolveAlert(alertId, userId);
          break;
        case 'dismiss':
          await alertService.resolveAlert(alertId, userId, 'dismissed');
          break;
      }
      
      onAlertAction?.(alertId, action);
      await loadAlerts();
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error);
    }
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'DrawdownLimit': return <AlertTriangle className="w-4 h-4" />;
      case 'PerformanceMilestone': return <TrendingUp className="w-4 h-4" />;
      case 'MarketConditionChange': return <Activity className="w-4 h-4" />;
      case 'StatisticalSignificance': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Strategy Alerts
              {alerts.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  {alerts.length}
                </span>
              )}
            </h3>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex space-x-4">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as AlertSeverity | 'All')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as AlertType | 'All')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="All">All Types</option>
            <option value="DrawdownLimit">Drawdown</option>
            <option value="PerformanceMilestone">Milestones</option>
            <option value="MarketConditionChange">Market Changes</option>
            <option value="StatisticalSignificance">Statistical</option>
          </select>
        </div>
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalAlerts}</div>
              <div className="text-xs text-gray-500">Total Alerts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {(metrics.userEngagement.acknowledgedRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Acknowledged</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.averageResolutionTime.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500">Avg Resolution</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {(metrics.falsePositiveRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">False Positive</div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No active alerts</p>
            <p className="text-sm">Your strategies are performing within normal parameters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={handleAlertAction}
                getSeverityColor={getSeverityColor}
                getTypeIcon={getTypeIcon}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface AlertCardProps {
  alert: StrategyAlert;
  onAction: (alertId: string, action: 'acknowledge' | 'resolve' | 'dismiss') => void;
  getSeverityColor: (severity: AlertSeverity) => string;
  getTypeIcon: (type: AlertType) => React.ReactNode;
  formatTimeAgo: (dateString: string) => string;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAction,
  getSeverityColor,
  getTypeIcon,
  formatTimeAgo
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`p-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {getTypeIcon(alert.type)}
            <span className="text-sm font-medium text-gray-900">{alert.title}</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(alert.createdAt)}</span>
          </div>
          
          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
          
          {alert.threshold && alert.currentValue !== undefined && (
            <div className="text-xs text-gray-500 mb-2">
              Current: {alert.currentValue.toFixed(2)} | Threshold: {alert.threshold.value}
            </div>
          )}

          {showDetails && alert.suggestedActions && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Suggested Actions:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {alert.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {alert.suggestedActions && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          )}
          
          {alert.status === 'Active' && (
            <>
              <button
                onClick={() => onAction(alert.id, 'acknowledge')}
                className="p-1 text-gray-400 hover:text-green-600 rounded"
                title="Acknowledge"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAction(alert.id, 'resolve')}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="Resolve"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
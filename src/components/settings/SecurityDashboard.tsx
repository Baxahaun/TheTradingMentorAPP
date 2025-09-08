/**
 * Security Dashboard Component
 * Displays audit logs, security alerts, and access history
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Clock, 
  Activity,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import AuditLogService, { JournalAccessLog, SecurityAlert, AuditSummary } from '../../services/AuditLogService';
import { useAuth } from '../../contexts/AuthContext';

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [accessHistory, setAccessHistory] = useState<JournalAccessLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDays, setFilterDays] = useState(7);

  const auditService = AuditLogService.getInstance();

  useEffect(() => {
    if (user?.uid) {
      loadSecurityData();
    }
  }, [user, filterDays]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summary, history, alerts] = await Promise.all([
        auditService.generateAuditSummary(user!.uid),
        auditService.getUserAccessHistory(user!.uid, filterDays),
        auditService.getSecurityAlerts(user!.uid)
      ]);

      setAuditSummary(summary);
      setAccessHistory(history);
      setSecurityAlerts(alerts);
    } catch (err) {
      setError('Failed to load security data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'read':
        return <Eye className="h-4 w-4" />;
      case 'write':
        return <Activity className="h-4 w-4" />;
      case 'delete':
        return <XCircle className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Overview */}
      {auditSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Access Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditSummary.totalAccess}</div>
              <p className="text-xs text-muted-foreground">Last {filterDays} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditSummary.securityAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Active alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={getRiskLevelColor(auditSummary.riskAssessment.level)}>
                  {auditSummary.riskAssessment.level.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {auditSummary.riskAssessment.factors.length} risk factors
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activity" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Security Alerts
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(parseInt(e.target.value))}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSecurityData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Access History</CardTitle>
              <CardDescription>
                Detailed log of all access to your journal data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No access history found for the selected period
                </div>
              ) : (
                <div className="space-y-3">
                  {accessHistory.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${log.success ? 'bg-green-100' : 'bg-red-100'}`}>
                          {log.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="font-medium capitalize">{log.action}</span>
                            <span className="text-muted-foreground">
                              {log.resourceType.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                            {log.details?.fieldsModified && (
                              <span className="ml-2">
                                • Modified: {log.details.fieldsModified.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskLevelColor(log.riskLevel)}>
                          {log.riskLevel}
                        </Badge>
                        {log.sessionId && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.sessionId.slice(-8)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Active security alerts and suspicious activity notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium text-green-700">All Clear</h3>
                  <p className="text-muted-foreground">No active security alerts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityAlerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default'}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {alert.alertType.replace('_', ' ')}
                            </span>
                          </div>
                          <AlertDescription className="mb-2">
                            {alert.description}
                          </AlertDescription>
                          <div className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatTimestamp(alert.timestamp)}
                            {alert.relatedLogs.length > 0 && (
                              <span className="ml-3">
                                • {alert.relatedLogs.length} related events
                              </span>
                            )}
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button variant="outline" size="sm">
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Assessment */}
      {auditSummary && auditSummary.riskAssessment.factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
            <CardDescription>
              Factors contributing to your current security risk level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditSummary.riskAssessment.factors.map((factor, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{factor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityDashboard;
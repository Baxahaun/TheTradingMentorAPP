/**
 * Audit logging service for tracking journal access and modifications
 * Provides comprehensive logging for security and compliance
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface JournalAccessLog {
  id?: string;
  userId: string;
  action: 'read' | 'write' | 'delete' | 'export' | 'share' | 'template_create' | 'template_modify';
  resourceType: 'journal_entry' | 'template' | 'image' | 'settings';
  resourceId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  details?: {
    fieldsModified?: string[];
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    exportFormat?: string;
    shareRecipient?: string;
    errorMessage?: string;
  };
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SecurityAlert {
  id?: string;
  userId: string;
  alertType: 'suspicious_activity' | 'multiple_failed_access' | 'unusual_location' | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  relatedLogs: string[];
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AuditSummary {
  totalAccess: number;
  recentActivity: JournalAccessLog[];
  securityAlerts: SecurityAlert[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export class AuditLogService {
  private static instance: AuditLogService;
  private sessionId: string;
  private suspiciousActivityThreshold = 10; // Actions per minute
  private failedAccessThreshold = 5; // Failed attempts before alert

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Log journal access or modification
   */
  async logAccess(log: Omit<JournalAccessLog, 'timestamp' | 'sessionId'>): Promise<void> {
    try {
      const fullLog: JournalAccessLog = {
        ...log,
        timestamp: new Date(),
        sessionId: this.sessionId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      };

      // Store in Firestore
      await addDoc(collection(db, 'auditLogs'), {
        ...fullLog,
        timestamp: Timestamp.fromDate(fullLog.timestamp)
      });

      // Check for suspicious activity
      await this.checkSuspiciousActivity(fullLog);

    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Store locally as fallback
      this.storeLocalAuditLog(log);
    }
  }

  /**
   * Log journal entry read access
   */
  async logJournalRead(userId: string, entryId: string, success: boolean = true): Promise<void> {
    await this.logAccess({
      userId,
      action: 'read',
      resourceType: 'journal_entry',
      resourceId: entryId,
      success,
      riskLevel: 'low'
    });
  }

  /**
   * Log journal entry modification
   */
  async logJournalWrite(
    userId: string, 
    entryId: string, 
    fieldsModified: string[],
    success: boolean = true
  ): Promise<void> {
    await this.logAccess({
      userId,
      action: 'write',
      resourceType: 'journal_entry',
      resourceId: entryId,
      success,
      riskLevel: fieldsModified.includes('emotionalState') ? 'medium' : 'low',
      details: {
        fieldsModified
      }
    });
  }

  /**
   * Log journal entry deletion
   */
  async logJournalDelete(userId: string, entryId: string, success: boolean = true): Promise<void> {
    await this.logAccess({
      userId,
      action: 'delete',
      resourceType: 'journal_entry',
      resourceId: entryId,
      success,
      riskLevel: 'high'
    });
  }

  /**
   * Log data export
   */
  async logDataExport(
    userId: string, 
    resourceIds: string[], 
    format: string,
    success: boolean = true
  ): Promise<void> {
    await this.logAccess({
      userId,
      action: 'export',
      resourceType: 'journal_entry',
      resourceId: resourceIds.join(','),
      success,
      riskLevel: 'medium',
      details: {
        exportFormat: format
      }
    });
  }

  /**
   * Log sharing activity
   */
  async logDataShare(
    userId: string, 
    resourceId: string, 
    recipient: string,
    success: boolean = true
  ): Promise<void> {
    await this.logAccess({
      userId,
      action: 'share',
      resourceType: 'journal_entry',
      resourceId,
      success,
      riskLevel: 'high',
      details: {
        shareRecipient: recipient
      }
    });
  }

  /**
   * Get user's access history
   */
  async getUserAccessHistory(userId: string, days: number = 30): Promise<JournalAccessLog[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'auditLogs'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as JournalAccessLog[];

    } catch (error) {
      console.error('Failed to fetch access history:', error);
      return [];
    }
  }

  /**
   * Get security alerts for user
   */
  async getSecurityAlerts(userId: string): Promise<SecurityAlert[]> {
    try {
      const q = query(
        collection(db, 'securityAlerts'),
        where('userId', '==', userId),
        where('resolved', '==', false),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as SecurityAlert[];

    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
      return [];
    }
  }

  /**
   * Generate audit summary for user
   */
  async generateAuditSummary(userId: string): Promise<AuditSummary> {
    const [accessHistory, securityAlerts] = await Promise.all([
      this.getUserAccessHistory(userId, 7), // Last 7 days
      this.getSecurityAlerts(userId)
    ]);

    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Assess risk factors
    const highRiskActions = accessHistory.filter(log => log.riskLevel === 'high').length;
    const failedActions = accessHistory.filter(log => !log.success).length;
    const recentAlerts = securityAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical');

    if (highRiskActions > 5) {
      riskFactors.push('High number of high-risk actions');
      riskLevel = 'medium';
    }

    if (failedActions > 3) {
      riskFactors.push('Multiple failed access attempts');
      riskLevel = 'medium';
    }

    if (recentAlerts.length > 0) {
      riskFactors.push('Active security alerts');
      riskLevel = 'high';
    }

    return {
      totalAccess: accessHistory.length,
      recentActivity: accessHistory.slice(0, 10),
      securityAlerts,
      riskAssessment: {
        level: riskLevel,
        factors: riskFactors
      }
    };
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(log: JournalAccessLog): Promise<void> {
    try {
      // Check for rapid successive actions
      const recentLogs = await this.getRecentUserActivity(log.userId, 1); // Last 1 minute
      
      if (recentLogs.length > this.suspiciousActivityThreshold) {
        await this.createSecurityAlert({
          userId: log.userId,
          alertType: 'suspicious_activity',
          severity: 'medium',
          description: `Unusual activity detected: ${recentLogs.length} actions in 1 minute`,
          timestamp: new Date(),
          relatedLogs: recentLogs.map(l => l.id!).filter(Boolean),
          resolved: false
        });
      }

      // Check for multiple failed attempts
      const failedAttempts = recentLogs.filter(l => !l.success);
      if (failedAttempts.length >= this.failedAccessThreshold) {
        await this.createSecurityAlert({
          userId: log.userId,
          alertType: 'multiple_failed_access',
          severity: 'high',
          description: `Multiple failed access attempts: ${failedAttempts.length} failures`,
          timestamp: new Date(),
          relatedLogs: failedAttempts.map(l => l.id!).filter(Boolean),
          resolved: false
        });
      }

    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
    }
  }

  /**
   * Create security alert
   */
  private async createSecurityAlert(alert: Omit<SecurityAlert, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'securityAlerts'), {
        ...alert,
        timestamp: Timestamp.fromDate(alert.timestamp)
      });
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }

  /**
   * Get recent user activity for suspicious activity detection
   */
  private async getRecentUserActivity(userId: string, minutes: number): Promise<JournalAccessLog[]> {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutes);

    const q = query(
      collection(db, 'auditLogs'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(startTime)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as JournalAccessLog[];
  }

  /**
   * Store audit log locally as fallback
   */
  private storeLocalAuditLog(log: Omit<JournalAccessLog, 'timestamp' | 'sessionId'>): void {
    try {
      const localLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      localLogs.push({
        ...log,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      });
      
      // Keep only last 100 entries
      if (localLogs.length > 100) {
        localLogs.splice(0, localLogs.length - 100);
      }
      
      localStorage.setItem('auditLogs', JSON.stringify(localLogs));
    } catch (error) {
      console.error('Failed to store local audit log:', error);
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      // This would typically use a service to get the real IP
      // For now, return a placeholder
      return 'client-ip-hidden';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear session (for logout)
   */
  clearSession(): void {
    this.sessionId = this.generateSessionId();
  }
}

export default AuditLogService.getInstance();
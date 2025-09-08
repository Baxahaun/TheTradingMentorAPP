/**
 * Tests for AuditLogService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AuditLogService from '../AuditLogService';

// Mock Firebase
const mockAddDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockCollection = vi.fn();
const mockTimestamp = {
  fromDate: vi.fn((date) => ({ toDate: () => date })),
  now: vi.fn(() => ({ toDate: () => new Date() }))
};

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  addDoc: mockAddDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  getDocs: mockGetDocs,
  Timestamp: mockTimestamp
}));

vi.mock('../lib/firebase', () => ({
  db: {}
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-user-agent'
  },
  writable: true
});

describe('AuditLogService', () => {
  let auditService: AuditLogService;

  beforeEach(() => {
    auditService = AuditLogService.getInstance();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AuditLogService.getInstance();
      const instance2 = AuditLogService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('logAccess', () => {
    it('should log access successfully', async () => {
      mockAddDoc.mockResolvedValue({ id: 'log123' });

      const logData = {
        userId: 'user123',
        action: 'read' as const,
        resourceType: 'journal_entry' as const,
        resourceId: 'entry123',
        success: true,
        riskLevel: 'low' as const
      };

      await auditService.logAccess(logData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...logData,
          timestamp: expect.any(Object),
          sessionId: expect.any(String),
          userAgent: 'test-user-agent'
        })
      );
    });

    it('should store log locally on Firebase failure', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firebase error'));
      mockLocalStorage.getItem.mockReturnValue('[]');

      const logData = {
        userId: 'user123',
        action: 'read' as const,
        resourceType: 'journal_entry' as const,
        resourceId: 'entry123',
        success: true,
        riskLevel: 'low' as const
      };

      await auditService.logAccess(logData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auditLogs',
        expect.stringContaining('user123')
      );
    });
  });

  describe('logJournalRead', () => {
    it('should log journal read access', async () => {
      mockAddDoc.mockResolvedValue({ id: 'log123' });

      await auditService.logJournalRead('user123', 'entry123');

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          action: 'read',
          resourceType: 'journal_entry',
          resourceId: 'entry123',
          success: true,
          riskLevel: 'low'
        })
      );
    });
  });

  describe('logJournalWrite', () => {
    it('should log journal write with modified fields', async () => {
      mockAddDoc.mockResolvedValue({ id: 'log123' });

      await auditService.logJournalWrite(
        'user123',
        'entry123',
        ['preMarketNotes', 'emotionalState']
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          action: 'write',
          resourceType: 'journal_entry',
          resourceId: 'entry123',
          success: true,
          riskLevel: 'medium', // Should be medium because emotionalState is included
          details: {
            fieldsModified: ['preMarketNotes', 'emotionalState']
          }
        })
      );
    });

    it('should set low risk level for non-sensitive fields', async () => {
      mockAddDoc.mockResolvedValue({ id: 'log123' });

      await auditService.logJournalWrite(
        'user123',
        'entry123',
        ['publicField']
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          riskLevel: 'low'
        })
      );
    });
  });

  describe('logJournalDelete', () => {
    it('should log journal deletion with high risk level', async () => {
      mockAddDoc.mockResolvedValue({ id: 'log123' });

      await auditService.logJournalDelete('user123', 'entry123');

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          action: 'delete',
          resourceType: 'journal_entry',
          resourceId: 'entry123',
          success: true,
          riskLevel: 'high'
        })
      );
    });
  });

  describe('logDataExport', () => {
    it('should log data export with medium risk level', async () => {
      mockAddDoc.mockResolvedValue({ id: 'log123' });

      await auditService.logDataExport(
        'user123',
        ['entry1', 'entry2'],
        'json'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          action: 'export',
          resourceType: 'journal_entry',
          resourceId: 'entry1,entry2',
          success: true,
          riskLevel: 'medium',
          details: {
            exportFormat: 'json'
          }
        })
      );
    });
  });

  describe('logDataShare', () => {
    it('should log data sharing with high risk level', async () => {
      mockAddDoc.mockResolvedValue({ id: 'log123' });

      await auditService.logDataShare(
        'user123',
        'entry123',
        'mentor@example.com'
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          action: 'share',
          resourceType: 'journal_entry',
          resourceId: 'entry123',
          success: true,
          riskLevel: 'high',
          details: {
            shareRecipient: 'mentor@example.com'
          }
        })
      );
    });
  });

  describe('getUserAccessHistory', () => {
    it('should retrieve user access history', async () => {
      const mockDocs = [
        {
          id: 'log1',
          data: () => ({
            userId: 'user123',
            action: 'read',
            timestamp: mockTimestamp.fromDate(new Date())
          })
        }
      ];
      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const history = await auditService.getUserAccessHistory('user123', 7);

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        id: 'log1',
        userId: 'user123',
        action: 'read'
      });
    });

    it('should handle Firebase errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firebase error'));

      const history = await auditService.getUserAccessHistory('user123', 7);

      expect(history).toEqual([]);
    });
  });

  describe('getSecurityAlerts', () => {
    it('should retrieve security alerts', async () => {
      const mockDocs = [
        {
          id: 'alert1',
          data: () => ({
            userId: 'user123',
            alertType: 'suspicious_activity',
            timestamp: mockTimestamp.fromDate(new Date())
          })
        }
      ];
      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const alerts = await auditService.getSecurityAlerts('user123');

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        id: 'alert1',
        userId: 'user123',
        alertType: 'suspicious_activity'
      });
    });
  });

  describe('generateAuditSummary', () => {
    it('should generate comprehensive audit summary', async () => {
      // Mock access history
      const mockAccessDocs = [
        {
          id: 'log1',
          data: () => ({
            userId: 'user123',
            action: 'read',
            success: true,
            riskLevel: 'low',
            timestamp: mockTimestamp.fromDate(new Date())
          })
        },
        {
          id: 'log2',
          data: () => ({
            userId: 'user123',
            action: 'delete',
            success: true,
            riskLevel: 'high',
            timestamp: mockTimestamp.fromDate(new Date())
          })
        }
      ];

      // Mock security alerts
      const mockAlertDocs = [
        {
          id: 'alert1',
          data: () => ({
            userId: 'user123',
            alertType: 'suspicious_activity',
            severity: 'high',
            timestamp: mockTimestamp.fromDate(new Date())
          })
        }
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: mockAccessDocs })
        .mockResolvedValueOnce({ docs: mockAlertDocs });

      const summary = await auditService.generateAuditSummary('user123');

      expect(summary).toMatchObject({
        totalAccess: 2,
        recentActivity: expect.arrayContaining([
          expect.objectContaining({ action: 'read' }),
          expect.objectContaining({ action: 'delete' })
        ]),
        securityAlerts: expect.arrayContaining([
          expect.objectContaining({ alertType: 'suspicious_activity' })
        ]),
        riskAssessment: {
          level: 'high', // Should be high due to security alert
          factors: expect.arrayContaining([
            'Active security alerts'
          ])
        }
      });
    });

    it('should assess medium risk for multiple high-risk actions', async () => {
      const mockAccessDocs = Array.from({ length: 6 }, (_, i) => ({
        id: `log${i}`,
        data: () => ({
          userId: 'user123',
          action: 'delete',
          success: true,
          riskLevel: 'high',
          timestamp: mockTimestamp.fromDate(new Date())
        })
      }));

      mockGetDocs
        .mockResolvedValueOnce({ docs: mockAccessDocs })
        .mockResolvedValueOnce({ docs: [] });

      const summary = await auditService.generateAuditSummary('user123');

      expect(summary.riskAssessment.level).toBe('medium');
      expect(summary.riskAssessment.factors).toContain('High number of high-risk actions');
    });
  });

  describe('clearSession', () => {
    it('should generate new session ID', () => {
      const originalSessionId = auditService['sessionId'];
      
      auditService.clearSession();
      
      expect(auditService['sessionId']).not.toBe(originalSessionId);
      expect(auditService['sessionId']).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });
});
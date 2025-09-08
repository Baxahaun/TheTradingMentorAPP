/**
 * Tests for PrivacySettingsService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import PrivacySettingsService from '../PrivacySettingsService';

// Mock Firebase
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc
}));

vi.mock('../lib/firebase', () => ({
  db: {}
}));

// Mock AuditLogService
const mockAuditService = {
  logAccess: vi.fn(),
  logDataShare: vi.fn()
};

vi.mock('../AuditLogService', () => ({
  default: {
    getInstance: () => mockAuditService
  }
}));

describe('PrivacySettingsService', () => {
  let privacyService: PrivacySettingsService;

  beforeEach(() => {
    privacyService = PrivacySettingsService.getInstance();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = PrivacySettingsService.getInstance();
      const instance2 = PrivacySettingsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getPrivacySettings', () => {
    it('should return existing privacy settings', async () => {
      const mockSettings = {
        userId: 'user123',
        encryptionEnabled: true,
        allowDataSharing: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockSettings,
          createdAt: { toDate: () => mockSettings.createdAt },
          updatedAt: { toDate: () => mockSettings.updatedAt }
        })
      });

      const settings = await privacyService.getPrivacySettings('user123');

      expect(settings).toMatchObject({
        userId: 'user123',
        encryptionEnabled: true,
        allowDataSharing: false
      });
    });

    it('should return default settings for new user', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      const settings = await privacyService.getPrivacySettings('user123');

      expect(settings).toMatchObject({
        userId: 'user123',
        encryptionEnabled: true,
        encryptSensitiveFields: true,
        allowDataSharing: false,
        enableAuditLogging: true
      });
    });

    it('should handle Firebase errors gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firebase error'));

      const settings = await privacyService.getPrivacySettings('user123');

      expect(settings.userId).toBe('user123');
      expect(settings.encryptionEnabled).toBe(true);
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings successfully', async () => {
      const existingSettings = {
        userId: 'user123',
        encryptionEnabled: true,
        allowDataSharing: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...existingSettings,
          createdAt: { toDate: () => existingSettings.createdAt },
          updatedAt: { toDate: () => existingSettings.updatedAt }
        })
      });

      const updates = {
        allowDataSharing: true,
        encryptExports: false
      };

      await privacyService.updatePrivacySettings('user123', updates);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...existingSettings,
          ...updates,
          updatedAt: expect.any(Date)
        })
      );

      expect(mockAuditService.logAccess).toHaveBeenCalledWith({
        userId: 'user123',
        action: 'write',
        resourceType: 'settings',
        resourceId: 'privacy_settings',
        success: true,
        riskLevel: 'medium',
        details: {
          fieldsModified: ['allowDataSharing', 'encryptExports']
        }
      });
    });

    it('should log failed updates', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(
        privacyService.updatePrivacySettings('user123', { allowDataSharing: true })
      ).rejects.toThrow();

      expect(mockAuditService.logAccess).toHaveBeenCalledWith({
        userId: 'user123',
        action: 'write',
        resourceType: 'settings',
        resourceId: 'privacy_settings',
        success: false,
        riskLevel: 'medium',
        details: {
          errorMessage: 'Firebase error'
        }
      });
    });
  });

  describe('hasPermission', () => {
    it('should check export permission correctly', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          allowDataExport: true,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        })
      });

      const hasPermission = await privacyService.hasPermission('user123', 'export', 'journal_entry');
      expect(hasPermission).toBe(true);
    });

    it('should check sharing permission for templates', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          allowTemplateSharing: false,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        })
      });

      const hasPermission = await privacyService.hasPermission('user123', 'share', 'templates');
      expect(hasPermission).toBe(false);
    });

    it('should allow read/write/delete for own data', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        })
      });

      const readPermission = await privacyService.hasPermission('user123', 'read', 'journal_entry');
      const writePermission = await privacyService.hasPermission('user123', 'write', 'journal_entry');
      const deletePermission = await privacyService.hasPermission('user123', 'delete', 'journal_entry');

      expect(readPermission).toBe(true);
      expect(writePermission).toBe(true);
      expect(deletePermission).toBe(true);
    });
  });

  describe('createDataAccessRequest', () => {
    it('should create data access request successfully', async () => {
      const request = {
        userId: 'user123',
        requestType: 'export' as const,
        requestedBy: 'user123',
        reason: 'Personal backup',
        dataTypes: ['journal_entry']
      };

      const requestId = await privacyService.createDataAccessRequest(request);

      expect(requestId).toMatch(/^user123_\d+$/);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...request,
          requestedAt: expect.any(Date),
          status: 'pending'
        })
      );

      expect(mockAuditService.logAccess).toHaveBeenCalledWith({
        userId: 'user123',
        action: 'export',
        resourceType: 'journal_entry',
        resourceId: 'data_access_request',
        success: true,
        riskLevel: 'high',
        details: {
          requestType: 'export'
        }
      });
    });
  });

  describe('grantSharingPermission', () => {
    it('should grant sharing permission when allowed', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          allowDataSharing: true,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        })
      });

      const permission = {
        userId: 'user123',
        sharedWith: 'mentor123',
        sharedWithEmail: 'mentor@example.com',
        dataTypes: ['journal_entry'],
        permissions: ['read' as const]
      };

      const permissionId = await privacyService.grantSharingPermission(permission);

      expect(permissionId).toMatch(/^user123_\d+$/);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...permission,
          createdAt: expect.any(Date),
          isActive: true
        })
      );

      expect(mockAuditService.logDataShare).toHaveBeenCalledWith(
        'user123',
        'sharing_permission',
        'mentor@example.com',
        true
      );
    });

    it('should reject sharing when not allowed', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          allowDataSharing: false,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        })
      });

      const permission = {
        userId: 'user123',
        sharedWith: 'mentor123',
        sharedWithEmail: 'mentor@example.com',
        dataTypes: ['journal_entry'],
        permissions: ['read' as const]
      };

      await expect(
        privacyService.grantSharingPermission(permission)
      ).rejects.toThrow('Data sharing is not enabled in privacy settings');
    });
  });

  describe('revokeSharingPermission', () => {
    it('should revoke sharing permission successfully', async () => {
      await privacyService.revokeSharingPermission('user123', 'permission123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          revokedAt: expect.any(Date),
          isActive: false
        }
      );

      expect(mockAuditService.logAccess).toHaveBeenCalledWith({
        userId: 'user123',
        action: 'write',
        resourceType: 'settings',
        resourceId: 'permission123',
        success: true,
        riskLevel: 'medium'
      });
    });
  });

  describe('validatePrivacySettings', () => {
    it('should validate valid settings', () => {
      const settings = {
        sessionTimeout: 60,
        autoDeleteAfterDays: 90,
        mentorEmails: ['mentor@example.com']
      };

      const validation = privacyService.validatePrivacySettings(settings);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid session timeout', () => {
      const settings = {
        sessionTimeout: 2 // Too short
      };

      const validation = privacyService.validatePrivacySettings(settings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Session timeout must be between 5 and 480 minutes');
    });

    it('should reject short auto-delete period', () => {
      const settings = {
        autoDeleteAfterDays: 15 // Too short
      };

      const validation = privacyService.validatePrivacySettings(settings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Auto-delete period must be at least 30 days');
    });

    it('should reject too many mentor emails', () => {
      const settings = {
        mentorEmails: Array.from({ length: 6 }, (_, i) => `mentor${i}@example.com`)
      };

      const validation = privacyService.validatePrivacySettings(settings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Maximum 5 mentor emails allowed');
    });

    it('should reject invalid email formats', () => {
      const settings = {
        mentorEmails: ['invalid-email', 'mentor@example.com']
      };

      const validation = privacyService.validatePrivacySettings(settings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid email format: invalid-email');
    });
  });

  describe('exportUserData', () => {
    it('should export data when allowed', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          allowDataExport: true,
          exportFormats: ['json', 'pdf'],
          encryptExports: true,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        })
      });

      const result = await privacyService.exportUserData('user123', 'json', ['journal_entry']);

      expect(result.encrypted).toBe(true);
      expect(mockAuditService.logAccess).toHaveBeenCalled();
    });

    it('should reject export when not allowed', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          allowDataExport: false,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        })
      });

      await expect(
        privacyService.exportUserData('user123', 'json')
      ).rejects.toThrow('Data export is not enabled in privacy settings');
    });

    it('should reject unsupported export format', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          allowDataExport: true,
          exportFormats: ['json'],
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        })
      });

      await expect(
        privacyService.exportUserData('user123', 'pdf')
      ).rejects.toThrow('Export format pdf is not allowed');
    });
  });

  describe('deleteUserData', () => {
    it('should log data deletion request', async () => {
      await privacyService.deleteUserData('user123', ['journal_entry'], true);

      expect(mockAuditService.logAccess).toHaveBeenCalledWith({
        userId: 'user123',
        action: 'delete',
        resourceType: 'journal_entry',
        resourceId: 'bulk_delete',
        success: true,
        riskLevel: 'high',
        details: {
          fieldsModified: ['journal_entry']
        }
      });
    });
  });
});
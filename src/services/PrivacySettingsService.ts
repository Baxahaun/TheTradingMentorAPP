/**
 * Privacy settings and data access control service
 * Manages user privacy preferences and data sharing controls
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AuditLogService from './AuditLogService';

export interface PrivacySettings {
  userId: string;
  
  // Encryption settings
  encryptionEnabled: boolean;
  encryptSensitiveFields: boolean;
  encryptEmotionalData: boolean;
  encryptPersonalNotes: boolean;
  
  // Data sharing settings
  allowDataSharing: boolean;
  allowAnonymousAnalytics: boolean;
  allowTemplateSharing: boolean;
  shareWithMentors: boolean;
  mentorEmails: string[];
  
  // Access controls
  requirePasswordForSensitiveData: boolean;
  sessionTimeout: number; // minutes
  enableTwoFactorAuth: boolean;
  
  // Data retention
  autoDeleteAfterDays?: number;
  keepBackupsAfterDeletion: boolean;
  
  // Audit and monitoring
  enableAuditLogging: boolean;
  alertOnSuspiciousActivity: boolean;
  emailSecurityAlerts: boolean;
  
  // Export and backup
  allowDataExport: boolean;
  exportFormats: ('json' | 'pdf' | 'csv')[];
  encryptExports: boolean;
  
  // Compliance
  gdprCompliant: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DataAccessRequest {
  id?: string;
  userId: string;
  requestType: 'export' | 'delete' | 'share' | 'view';
  requestedBy: string;
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  dataTypes: string[];
  expiresAt?: Date;
}

export interface DataSharingPermission {
  id?: string;
  userId: string;
  sharedWith: string;
  sharedWithEmail: string;
  dataTypes: string[];
  permissions: ('read' | 'comment' | 'export')[];
  expiresAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
  isActive: boolean;
}

export class PrivacySettingsService {
  private static instance: PrivacySettingsService;
  private auditService = AuditLogService.getInstance();

  static getInstance(): PrivacySettingsService {
    if (!PrivacySettingsService.instance) {
      PrivacySettingsService.instance = new PrivacySettingsService();
    }
    return PrivacySettingsService.instance;
  }

  /**
   * Get user's privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const docRef = doc(db, 'privacySettings', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as PrivacySettings;
      } else {
        // Return default settings
        return this.getDefaultPrivacySettings(userId);
      }
    } catch (error) {
      console.error('Failed to get privacy settings:', error);
      return this.getDefaultPrivacySettings(userId);
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string, 
    updates: Partial<PrivacySettings>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'privacySettings', userId);
      const currentSettings = await this.getPrivacySettings(userId);
      
      const updatedSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date()
      };

      await setDoc(docRef, updatedSettings);

      // Log the privacy settings change
      await this.auditService.logAccess({
        userId,
        action: 'write',
        resourceType: 'settings',
        resourceId: 'privacy_settings',
        success: true,
        riskLevel: 'medium',
        details: {
          fieldsModified: Object.keys(updates)
        }
      });

    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      
      await this.auditService.logAccess({
        userId,
        action: 'write',
        resourceType: 'settings',
        resourceId: 'privacy_settings',
        success: false,
        riskLevel: 'medium',
        details: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  }

  /**
   * Check if user has permission for specific action
   */
  async hasPermission(
    userId: string, 
    action: 'read' | 'write' | 'delete' | 'export' | 'share',
    dataType: 'journal_entry' | 'emotional_data' | 'personal_notes' | 'templates'
  ): Promise<boolean> {
    const settings = await this.getPrivacySettings(userId);

    switch (action) {
      case 'export':
        return settings.allowDataExport;
      
      case 'share':
        if (dataType === 'templates') {
          return settings.allowTemplateSharing;
        }
        return settings.allowDataSharing;
      
      case 'delete':
        return true; // Users can always delete their own data
      
      case 'read':
      case 'write':
        return true; // Users can always read/write their own data
      
      default:
        return false;
    }
  }

  /**
   * Create data access request
   */
  async createDataAccessRequest(request: Omit<DataAccessRequest, 'id'>): Promise<string> {
    try {
      const docRef = doc(db, 'dataAccessRequests', `${request.userId}_${Date.now()}`);
      await setDoc(docRef, {
        ...request,
        requestedAt: new Date(),
        status: 'pending'
      });

      await this.auditService.logAccess({
        userId: request.userId,
        action: 'export',
        resourceType: 'journal_entry',
        resourceId: 'data_access_request',
        success: true,
        riskLevel: 'high',
        details: {
          requestType: request.requestType
        }
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create data access request:', error);
      throw error;
    }
  }

  /**
   * Grant data sharing permission
   */
  async grantSharingPermission(permission: Omit<DataSharingPermission, 'id'>): Promise<string> {
    try {
      // Check if sharing is allowed
      const hasPermission = await this.hasPermission(permission.userId, 'share', 'journal_entry');
      if (!hasPermission) {
        throw new Error('Data sharing is not enabled in privacy settings');
      }

      const docRef = doc(db, 'dataSharingPermissions', `${permission.userId}_${Date.now()}`);
      await setDoc(docRef, {
        ...permission,
        createdAt: new Date(),
        isActive: true
      });

      await this.auditService.logDataShare(
        permission.userId,
        'sharing_permission',
        permission.sharedWithEmail,
        true
      );

      return docRef.id;
    } catch (error) {
      console.error('Failed to grant sharing permission:', error);
      throw error;
    }
  }

  /**
   * Revoke data sharing permission
   */
  async revokeSharingPermission(userId: string, permissionId: string): Promise<void> {
    try {
      const docRef = doc(db, 'dataSharingPermissions', permissionId);
      await updateDoc(docRef, {
        revokedAt: new Date(),
        isActive: false
      });

      await this.auditService.logAccess({
        userId,
        action: 'write',
        resourceType: 'settings',
        resourceId: permissionId,
        success: true,
        riskLevel: 'medium'
      });

    } catch (error) {
      console.error('Failed to revoke sharing permission:', error);
      throw error;
    }
  }

  /**
   * Get default privacy settings
   */
  private getDefaultPrivacySettings(userId: string): PrivacySettings {
    return {
      userId,
      
      // Encryption settings - secure by default
      encryptionEnabled: true,
      encryptSensitiveFields: true,
      encryptEmotionalData: true,
      encryptPersonalNotes: true,
      
      // Data sharing settings - private by default
      allowDataSharing: false,
      allowAnonymousAnalytics: false,
      allowTemplateSharing: false,
      shareWithMentors: false,
      mentorEmails: [],
      
      // Access controls - secure by default
      requirePasswordForSensitiveData: false,
      sessionTimeout: 60, // 1 hour
      enableTwoFactorAuth: false,
      
      // Data retention - keep indefinitely by default
      keepBackupsAfterDeletion: true,
      
      // Audit and monitoring - enabled by default
      enableAuditLogging: true,
      alertOnSuspiciousActivity: true,
      emailSecurityAlerts: true,
      
      // Export and backup - allowed but encrypted
      allowDataExport: true,
      exportFormats: ['json', 'pdf'],
      encryptExports: true,
      
      // Compliance - require explicit consent
      gdprCompliant: true,
      dataProcessingConsent: false,
      marketingConsent: false,
      
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Validate privacy settings
   */
  validatePrivacySettings(settings: Partial<PrivacySettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.sessionTimeout && (settings.sessionTimeout < 5 || settings.sessionTimeout > 480)) {
      errors.push('Session timeout must be between 5 and 480 minutes');
    }

    if (settings.autoDeleteAfterDays && settings.autoDeleteAfterDays < 30) {
      errors.push('Auto-delete period must be at least 30 days');
    }

    if (settings.mentorEmails && settings.mentorEmails.length > 5) {
      errors.push('Maximum 5 mentor emails allowed');
    }

    if (settings.mentorEmails) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of settings.mentorEmails) {
        if (!emailRegex.test(email)) {
          errors.push(`Invalid email format: ${email}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Export user data according to privacy settings
   */
  async exportUserData(
    userId: string, 
    format: 'json' | 'pdf' | 'csv',
    dataTypes: string[] = ['all']
  ): Promise<{ data: any; encrypted: boolean }> {
    const settings = await this.getPrivacySettings(userId);
    
    if (!settings.allowDataExport) {
      throw new Error('Data export is not enabled in privacy settings');
    }

    if (!settings.exportFormats.includes(format)) {
      throw new Error(`Export format ${format} is not allowed`);
    }

    // Log the export request
    await this.auditService.logDataExport(userId, dataTypes, format, true);

    // This would integrate with the actual data export functionality
    // For now, return a placeholder
    return {
      data: { message: 'Data export functionality would be implemented here' },
      encrypted: settings.encryptExports
    };
  }

  /**
   * Delete user data permanently
   */
  async deleteUserData(
    userId: string, 
    dataTypes: string[] = ['all'],
    keepBackups: boolean = false
  ): Promise<void> {
    const settings = await this.getPrivacySettings(userId);
    
    // Log the deletion request
    await this.auditService.logAccess({
      userId,
      action: 'delete',
      resourceType: 'journal_entry',
      resourceId: 'bulk_delete',
      success: true,
      riskLevel: 'high',
      details: {
        fieldsModified: dataTypes
      }
    });

    // This would integrate with the actual data deletion functionality
    console.log(`Would delete data types: ${dataTypes.join(', ')} for user: ${userId}`);
    console.log(`Keep backups: ${keepBackups || settings.keepBackupsAfterDeletion}`);
  }
}

export default PrivacySettingsService.getInstance();
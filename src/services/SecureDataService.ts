/**
 * Secure data transmission and storage service
 * Handles encrypted communication and secure API calls
 */

import EncryptionService from './EncryptionService';
import AuditLogService from './AuditLogService';
import PrivacySettingsService from './PrivacySettingsService';

export interface SecureApiOptions {
  encrypt?: boolean;
  requireAuth?: boolean;
  auditLog?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

export interface SecureApiResponse<T> {
  data: T;
  success: boolean;
  encrypted: boolean;
  timestamp: Date;
  requestId: string;
}

export interface DataIntegrityCheck {
  hash: string;
  timestamp: Date;
  verified: boolean;
}

export class SecureDataService {
  private static instance: SecureDataService;
  private encryptionService = EncryptionService.getInstance();
  private auditService = AuditLogService.getInstance();
  private privacyService = PrivacySettingsService.getInstance();
  private requestIdCounter = 0;

  static getInstance(): SecureDataService {
    if (!SecureDataService.instance) {
      SecureDataService.instance = new SecureDataService();
    }
    return SecureDataService.instance;
  }

  /**
   * Make secure API call with encryption and audit logging
   */
  async secureApiCall<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any,
    options: SecureApiOptions = {}
  ): Promise<SecureApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    const defaultOptions: SecureApiOptions = {
      encrypt: true,
      requireAuth: true,
      auditLog: true,
      retryAttempts: 3,
      timeout: 30000
    };
    
    const finalOptions = { ...defaultOptions, ...options };

    try {
      // Prepare request payload
      let payload = data;
      let encrypted = false;

      if (finalOptions.encrypt && data && method !== 'GET') {
        const userId = this.getCurrentUserId();
        if (userId) {
          payload = await this.encryptionService.encryptJournalFields(data, userId);
          encrypted = true;
        }
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Timestamp': new Date().toISOString()
      };

      if (finalOptions.requireAuth) {
        const authToken = await this.getAuthToken();
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
      }

      // Add integrity hash for data verification
      if (payload) {
        const dataHash = await this.encryptionService.generateDataHash(JSON.stringify(payload));
        headers['X-Data-Hash'] = dataHash;
      }

      // Make the API call with retry logic
      const response = await this.makeRequestWithRetry(
        endpoint,
        {
          method,
          headers,
          body: payload ? JSON.stringify(payload) : undefined
        },
        finalOptions.retryAttempts!,
        finalOptions.timeout!
      );

      // Process response
      let responseData = await response.json();
      
      // Decrypt response if needed
      if (encrypted && responseData) {
        const userId = this.getCurrentUserId();
        if (userId) {
          responseData = await this.encryptionService.decryptJournalFields(responseData, userId);
        }
      }

      // Verify response integrity
      const responseHash = response.headers.get('X-Data-Hash');
      if (responseHash) {
        const isValid = await this.encryptionService.verifyDataIntegrity(
          JSON.stringify(responseData),
          responseHash
        );
        if (!isValid) {
          throw new Error('Response data integrity check failed');
        }
      }

      const result: SecureApiResponse<T> = {
        data: responseData,
        success: response.ok,
        encrypted,
        timestamp: new Date(),
        requestId
      };

      // Audit log successful request
      if (finalOptions.auditLog) {
        await this.logApiCall(endpoint, method, true, Date.now() - startTime, requestId);
      }

      return result;

    } catch (error) {
      // Audit log failed request
      if (finalOptions.auditLog) {
        await this.logApiCall(endpoint, method, false, Date.now() - startTime, requestId, error);
      }

      throw new Error(`Secure API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Securely store data with encryption and integrity checks
   */
  async secureStore(
    key: string,
    data: any,
    userId: string,
    options: { encrypt?: boolean; addIntegrityCheck?: boolean } = {}
  ): Promise<void> {
    try {
      let processedData = data;
      
      if (options.encrypt !== false) {
        // Check privacy settings
        const privacySettings = await this.privacyService.getPrivacySettings(userId);
        if (privacySettings.encryptionEnabled) {
          processedData = await this.encryptionService.encryptJournalFields(data, userId);
        }
      }

      // Add integrity check
      if (options.addIntegrityCheck !== false) {
        const hash = await this.encryptionService.generateDataHash(JSON.stringify(processedData));
        processedData._integrity = {
          hash,
          timestamp: new Date(),
          verified: true
        };
      }

      // Store in localStorage with additional metadata
      const storageData = {
        data: processedData,
        userId,
        timestamp: new Date().toISOString(),
        encrypted: options.encrypt !== false
      };

      localStorage.setItem(`secure_${key}`, JSON.stringify(storageData));

      // Log storage operation
      await this.auditService.logAccess({
        userId,
        action: 'write',
        resourceType: 'journal_entry',
        resourceId: key,
        success: true,
        riskLevel: 'low'
      });

    } catch (error) {
      console.error('Secure storage failed:', error);
      throw error;
    }
  }

  /**
   * Securely retrieve data with decryption and integrity verification
   */
  async secureRetrieve(key: string, userId: string): Promise<any> {
    try {
      const storedData = localStorage.getItem(`secure_${key}`);
      if (!storedData) {
        return null;
      }

      const parsedData = JSON.parse(storedData);
      
      // Verify user ownership
      if (parsedData.userId !== userId) {
        throw new Error('Access denied: Data belongs to different user');
      }

      let data = parsedData.data;

      // Verify integrity if present
      if (data._integrity) {
        const integrityCheck = data._integrity;
        const dataWithoutIntegrity = { ...data };
        delete dataWithoutIntegrity._integrity;
        
        const isValid = await this.encryptionService.verifyDataIntegrity(
          JSON.stringify(dataWithoutIntegrity),
          integrityCheck.hash
        );
        
        if (!isValid) {
          throw new Error('Data integrity check failed - data may be corrupted');
        }
        
        data = dataWithoutIntegrity;
      }

      // Decrypt if needed
      if (parsedData.encrypted) {
        data = await this.encryptionService.decryptJournalFields(data, userId);
      }

      // Log retrieval operation
      await this.auditService.logAccess({
        userId,
        action: 'read',
        resourceType: 'journal_entry',
        resourceId: key,
        success: true,
        riskLevel: 'low'
      });

      return data;

    } catch (error) {
      console.error('Secure retrieval failed:', error);
      
      // Log failed retrieval
      await this.auditService.logAccess({
        userId,
        action: 'read',
        resourceType: 'journal_entry',
        resourceId: key,
        success: false,
        riskLevel: 'medium'
      });
      
      throw error;
    }
  }

  /**
   * Securely delete data with audit trail
   */
  async secureDelete(key: string, userId: string): Promise<void> {
    try {
      // Verify data exists and belongs to user
      const data = await this.secureRetrieve(key, userId);
      if (!data) {
        throw new Error('Data not found or access denied');
      }

      // Remove from storage
      localStorage.removeItem(`secure_${key}`);

      // Log deletion
      await this.auditService.logAccess({
        userId,
        action: 'delete',
        resourceType: 'journal_entry',
        resourceId: key,
        success: true,
        riskLevel: 'high'
      });

    } catch (error) {
      console.error('Secure deletion failed:', error);
      
      // Log failed deletion
      await this.auditService.logAccess({
        userId,
        action: 'delete',
        resourceType: 'journal_entry',
        resourceId: key,
        success: false,
        riskLevel: 'high'
      });
      
      throw error;
    }
  }

  /**
   * Validate data transmission security
   */
  async validateTransmissionSecurity(endpoint: string): Promise<{
    isSecure: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check HTTPS
    if (!endpoint.startsWith('https://')) {
      issues.push('Endpoint does not use HTTPS');
      recommendations.push('Use HTTPS for all data transmission');
    }

    // Check for secure headers (would be implemented based on actual API)
    // This is a placeholder for actual security validation
    
    return {
      isSecure: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequestWithRetry(
    endpoint: string,
    options: RequestInit,
    maxRetries: number,
    timeout: number
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(endpoint, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok || attempt === maxRetries) {
          return response;
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retry
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Log API call for audit purposes
   */
  private async logApiCall(
    endpoint: string,
    method: string,
    success: boolean,
    duration: number,
    requestId: string,
    error?: any
  ): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    await this.auditService.logAccess({
      userId,
      action: method.toLowerCase() === 'get' ? 'read' : 'write',
      resourceType: 'journal_entry',
      resourceId: `api_${endpoint}`,
      success,
      riskLevel: success ? 'low' : 'medium',
      details: {
        endpoint,
        method,
        duration,
        requestId,
        errorMessage: error ? (error instanceof Error ? error.message : String(error)) : undefined
      }
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Get current user ID (placeholder - would integrate with auth system)
   */
  private getCurrentUserId(): string | null {
    // This would integrate with the actual authentication system
    return localStorage.getItem('currentUserId') || null;
  }

  /**
   * Get authentication token (placeholder - would integrate with auth system)
   */
  private async getAuthToken(): Promise<string | null> {
    // This would integrate with the actual authentication system
    return localStorage.getItem('authToken') || null;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all secure data (for logout)
   */
  async clearSecureData(userId: string): Promise<void> {
    try {
      // Clear encryption keys
      this.encryptionService.clearKeyCache();
      
      // Clear audit session
      this.auditService.clearSession();
      
      // Remove secure storage items
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('secure_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            if (parsedData.userId === userId) {
              localStorage.removeItem(key);
            }
          }
        }
      }

      // Log security clearance
      await this.auditService.logAccess({
        userId,
        action: 'delete',
        resourceType: 'settings',
        resourceId: 'security_clearance',
        success: true,
        riskLevel: 'medium'
      });

    } catch (error) {
      console.error('Failed to clear secure data:', error);
    }
  }
}

export default SecureDataService.getInstance();
/**
 * Client-side encryption service for sensitive journal content
 * Implements AES-GCM encryption with user-specific keys
 */

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  salt: string;
}

export interface DecryptionParams {
  encryptedData: string;
  iv: string;
  salt: string;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private keyCache = new Map<string, CryptoKey>();

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Generate a user-specific encryption key from password/userId
   */
  private async deriveKey(userId: string, password?: string): Promise<CryptoKey> {
    const cacheKey = `${userId}:${password || 'default'}`;
    
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    // Use userId as base, with optional password for additional security
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password || userId),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Generate salt from userId for consistency
    const salt = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId));

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.keyCache.set(cacheKey, key);
    return key;
  }

  /**
   * Encrypt sensitive content using AES-GCM
   */
  async encryptSensitiveContent(
    content: string, 
    userId: string, 
    password?: string
  ): Promise<EncryptionResult> {
    try {
      const key = await this.deriveKey(userId, password);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));

      const encodedContent = new TextEncoder().encode(content);
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedContent
      );

      return {
        encryptedData: this.arrayBufferToBase64(encryptedBuffer),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt)
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive content');
    }
  }

  /**
   * Decrypt sensitive content
   */
  async decryptSensitiveContent(
    params: DecryptionParams,
    userId: string,
    password?: string
  ): Promise<string> {
    try {
      const key = await this.deriveKey(userId, password);
      
      const encryptedData = this.base64ToArrayBuffer(params.encryptedData);
      const iv = this.base64ToArrayBuffer(params.iv);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt content - invalid key or corrupted data');
    }
  }

  /**
   * Encrypt journal entry fields that contain sensitive data
   */
  async encryptJournalFields(
    entry: any,
    userId: string,
    sensitiveFields: string[] = [
      'preMarketNotes',
      'tradingNotes', 
      'postMarketReflection',
      'lessonsLearned',
      'emotionalState',
      'personalNotes'
    ]
  ): Promise<any> {
    const encryptedEntry = { ...entry };

    for (const field of sensitiveFields) {
      if (entry[field] && typeof entry[field] === 'string') {
        const encrypted = await this.encryptSensitiveContent(entry[field], userId);
        encryptedEntry[field] = {
          encrypted: true,
          ...encrypted
        };
      } else if (entry[field] && typeof entry[field] === 'object') {
        // Handle nested objects like emotionalState
        const encrypted = await this.encryptSensitiveContent(
          JSON.stringify(entry[field]), 
          userId
        );
        encryptedEntry[field] = {
          encrypted: true,
          ...encrypted
        };
      }
    }

    return encryptedEntry;
  }

  /**
   * Decrypt journal entry fields
   */
  async decryptJournalFields(entry: any, userId: string): Promise<any> {
    const decryptedEntry = { ...entry };

    for (const [field, value] of Object.entries(entry)) {
      if (value && typeof value === 'object' && (value as any).encrypted) {
        try {
          const decryptedContent = await this.decryptSensitiveContent(
            value as DecryptionParams,
            userId
          );
          
          // Try to parse as JSON for objects, otherwise keep as string
          try {
            decryptedEntry[field] = JSON.parse(decryptedContent);
          } catch {
            decryptedEntry[field] = decryptedContent;
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep encrypted data if decryption fails
          decryptedEntry[field] = value;
        }
      }
    }

    return decryptedEntry;
  }

  /**
   * Clear encryption key cache (for logout/security)
   */
  clearKeyCache(): void {
    this.keyCache.clear();
  }

  /**
   * Utility methods for base64 conversion
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate secure hash for data integrity verification
   */
  async generateDataHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Verify data integrity
   */
  async verifyDataIntegrity(data: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.generateDataHash(data);
    return actualHash === expectedHash;
  }
}

export default EncryptionService.getInstance();
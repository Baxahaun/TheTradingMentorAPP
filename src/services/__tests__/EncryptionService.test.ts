/**
 * Tests for EncryptionService
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptionService } from '../EncryptionService';

// Mock crypto API for testing
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    deriveKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    digest: vi.fn()
  },
  getRandomValues: vi.fn()
};

// Mock global crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = EncryptionService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    encryptionService.clearKeyCache();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EncryptionService.getInstance();
      const instance2 = EncryptionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('encryptSensitiveContent', () => {
    it('should encrypt content successfully', async () => {
      // Mock crypto operations
      const mockKey = { type: 'secret' };
      const mockEncryptedData = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      const mockSalt = new Uint8Array(16);

      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);
      mockCrypto.getRandomValues
        .mockReturnValueOnce(mockIv)
        .mockReturnValueOnce(mockSalt);

      const result = await encryptionService.encryptSensitiveContent(
        'sensitive data',
        'user123'
      );

      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
    });

    it('should handle encryption errors', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto error'));

      await expect(
        encryptionService.encryptSensitiveContent('data', 'user123')
      ).rejects.toThrow('Failed to encrypt sensitive content');
    });
  });

  describe('decryptSensitiveContent', () => {
    it('should decrypt content successfully', async () => {
      const mockKey = { type: 'secret' };
      const mockDecryptedData = new TextEncoder().encode('decrypted data');

      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecryptedData.buffer);

      const params = {
        encryptedData: 'encrypted',
        iv: 'iv',
        salt: 'salt'
      };

      const result = await encryptionService.decryptSensitiveContent(
        params,
        'user123'
      );

      expect(result).toBe('decrypted data');
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
    });

    it('should handle decryption errors', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto error'));

      const params = {
        encryptedData: 'encrypted',
        iv: 'iv',
        salt: 'salt'
      };

      await expect(
        encryptionService.decryptSensitiveContent(params, 'user123')
      ).rejects.toThrow('Failed to decrypt content');
    });
  });

  describe('encryptJournalFields', () => {
    it('should encrypt sensitive fields in journal entry', async () => {
      const mockKey = { type: 'secret' };
      const mockEncryptedData = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      const mockSalt = new Uint8Array(16);

      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);
      mockCrypto.getRandomValues
        .mockReturnValue(mockIv)
        .mockReturnValue(mockSalt);

      const entry = {
        id: 'entry1',
        preMarketNotes: 'sensitive notes',
        emotionalState: { mood: 'confident' },
        publicField: 'not sensitive'
      };

      const result = await encryptionService.encryptJournalFields(entry, 'user123');

      expect(result.preMarketNotes).toHaveProperty('encrypted', true);
      expect(result.emotionalState).toHaveProperty('encrypted', true);
      expect(result.publicField).toBe('not sensitive');
      expect(result.id).toBe('entry1');
    });

    it('should handle entries with no sensitive fields', async () => {
      const entry = {
        id: 'entry1',
        publicField: 'not sensitive'
      };

      const result = await encryptionService.encryptJournalFields(entry, 'user123');

      expect(result).toEqual(entry);
    });
  });

  describe('decryptJournalFields', () => {
    it('should decrypt encrypted fields in journal entry', async () => {
      const mockKey = { type: 'secret' };
      const mockDecryptedData = new TextEncoder().encode('decrypted notes');

      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecryptedData.buffer);

      const entry = {
        id: 'entry1',
        preMarketNotes: {
          encrypted: true,
          encryptedData: 'encrypted',
          iv: 'iv',
          salt: 'salt'
        },
        publicField: 'not encrypted'
      };

      const result = await encryptionService.decryptJournalFields(entry, 'user123');

      expect(result.preMarketNotes).toBe('decrypted notes');
      expect(result.publicField).toBe('not encrypted');
      expect(result.id).toBe('entry1');
    });

    it('should handle decryption failures gracefully', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto error'));

      const entry = {
        preMarketNotes: {
          encrypted: true,
          encryptedData: 'encrypted',
          iv: 'iv',
          salt: 'salt'
        }
      };

      const result = await encryptionService.decryptJournalFields(entry, 'user123');

      // Should keep encrypted data if decryption fails
      expect(result.preMarketNotes).toEqual(entry.preMarketNotes);
    });
  });

  describe('generateDataHash', () => {
    it('should generate hash for data integrity', async () => {
      const mockHash = new ArrayBuffer(32);
      mockCrypto.subtle.digest.mockResolvedValue(mockHash);

      const result = await encryptionService.generateDataHash('test data');

      expect(typeof result).toBe('string');
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(ArrayBuffer));
    });
  });

  describe('verifyDataIntegrity', () => {
    it('should verify data integrity correctly', async () => {
      const mockHash = new ArrayBuffer(32);
      mockCrypto.subtle.digest.mockResolvedValue(mockHash);

      // Mock base64 conversion to return consistent values
      const originalArrayBufferToBase64 = encryptionService['arrayBufferToBase64'];
      encryptionService['arrayBufferToBase64'] = vi.fn().mockReturnValue('consistent-hash');

      const result = await encryptionService.verifyDataIntegrity('test data', 'consistent-hash');

      expect(result).toBe(true);
      
      // Restore original method
      encryptionService['arrayBufferToBase64'] = originalArrayBufferToBase64;
    });

    it('should detect data integrity violations', async () => {
      const mockHash = new ArrayBuffer(32);
      mockCrypto.subtle.digest.mockResolvedValue(mockHash);

      const originalArrayBufferToBase64 = encryptionService['arrayBufferToBase64'];
      encryptionService['arrayBufferToBase64'] = vi.fn().mockReturnValue('different-hash');

      const result = await encryptionService.verifyDataIntegrity('test data', 'expected-hash');

      expect(result).toBe(false);
      
      encryptionService['arrayBufferToBase64'] = originalArrayBufferToBase64;
    });
  });

  describe('clearKeyCache', () => {
    it('should clear the key cache', () => {
      // Add some keys to cache first
      encryptionService['keyCache'].set('test-key', {} as CryptoKey);
      expect(encryptionService['keyCache'].size).toBe(1);

      encryptionService.clearKeyCache();
      expect(encryptionService['keyCache'].size).toBe(0);
    });
  });
});
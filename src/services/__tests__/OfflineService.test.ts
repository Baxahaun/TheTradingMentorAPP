import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import OfflineService, { OfflineOperation, NetworkStatus } from '../OfflineService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('OfflineService', () => {
  let offlineService: OfflineService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset singleton instance
    (OfflineService as any).instance = undefined;
    offlineService = OfflineService.getInstance();
  });

  afterEach(() => {
    offlineService.clearOfflineData();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OfflineService.getInstance();
      const instance2 = OfflineService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Network Status Management', () => {
    it('should initialize with current online status', () => {
      const status = offlineService.getNetworkStatus();
      expect(status.isOnline).toBe(true);
      expect(status.lastOnlineTime).toBeGreaterThan(0);
    });

    it('should update network status when going offline', () => {
      const callback = vi.fn();
      offlineService.onNetworkStatusChange(callback);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: false
        })
      );
    });

    it('should update network status when coming online', () => {
      const callback = vi.fn();
      offlineService.onNetworkStatusChange(callback);

      // Simulate coming online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: true
        })
      );
    });

    it('should unsubscribe from network status changes', () => {
      const callback = vi.fn();
      const unsubscribe = offlineService.onNetworkStatusChange(callback);

      unsubscribe();

      // Simulate network change
      window.dispatchEvent(new Event('offline'));
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Local Storage Management', () => {
    it('should store offline data', async () => {
      const testData = { content: 'test journal entry' };
      
      await offlineService.storeOfflineData('test-key', testData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'journal_offline_data',
        expect.stringContaining('test-key')
      );
    });

    it('should retrieve offline data', async () => {
      const testData = {
        'test-key': {
          data: { content: 'test journal entry' },
          timestamp: Date.now(),
          version: 'v_123'
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      const result = await offlineService.getOfflineData('test-key');
      expect(result).toEqual(testData['test-key']);
    });

    it('should return null for non-existent offline data', async () => {
      localStorageMock.getItem.mockReturnValue('{}');

      const result = await offlineService.getOfflineData('non-existent');
      expect(result).toBeNull();
    });

    it('should remove offline data', async () => {
      const testData = {
        'test-key': { data: 'test' },
        'other-key': { data: 'other' }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      await offlineService.removeOfflineData('test-key');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'journal_offline_data',
        expect.not.stringContaining('test-key')
      );
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(offlineService.storeOfflineData('test', {})).rejects.toThrow('Local storage failed');
    });
  });

  describe('Sync Queue Management', () => {
    it('should queue operations for sync', async () => {
      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);

      expect(offlineService.getSyncQueueLength()).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'journal_sync_queue',
        expect.stringContaining('entry-1')
      );
    });

    it('should process sync queue when online', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);
      await offlineService.processSyncQueue();

      expect(mockFetch).toHaveBeenCalledWith('/api/journalEntry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' })
      });

      expect(offlineService.getSyncQueueLength()).toBe(0);
    });

    it('should retry failed operations with exponential backoff', async () => {
      const mockFetch = fetch as any;
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response);

      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);
      
      // First attempt should fail and increment retry count
      await offlineService.processSyncQueue();
      expect(offlineService.getSyncQueueLength()).toBe(1);

      // Second attempt should succeed
      await offlineService.processSyncQueue();
      expect(offlineService.getSyncQueueLength()).toBe(0);
    });

    it('should remove operations that exceed max retries', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);

      // Process multiple times to exceed retry limit
      for (let i = 0; i < 7; i++) {
        await offlineService.processSyncQueue();
      }

      expect(offlineService.getSyncQueueLength()).toBe(0);
    });

    it('should not process queue when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);
      await offlineService.processSyncQueue();

      expect(fetch).not.toHaveBeenCalled();
      expect(offlineService.getSyncQueueLength()).toBe(1);
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect conflicts during update operations', async () => {
      const mockFetch = fetch as any;
      
      // Mock conflict detection
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'entry-1',
            content: 'remote content',
            updatedAt: Date.now() + 1000 // Remote is newer
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response);

      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'update',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: {
          id: 'entry-1',
          content: 'local content',
          updatedAt: Date.now() - 1000 // Local is older
        },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);
      await offlineService.processSyncQueue();

      // Should make two calls: one for conflict detection, one for update
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Force Sync', () => {
    it('should force sync when online', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);
      await offlineService.forcSync();

      expect(mockFetch).toHaveBeenCalled();
      expect(offlineService.getSyncQueueLength()).toBe(0);
    });

    it('should not force sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);
      await offlineService.forcSync();

      expect(fetch).not.toHaveBeenCalled();
      expect(offlineService.getSyncQueueLength()).toBe(1);
    });
  });

  describe('Data Persistence', () => {
    it('should persist sync queue to localStorage', async () => {
      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'journal_sync_queue',
        expect.any(String)
      );
    });

    it('should load persisted data on initialization', () => {
      const queueData = JSON.stringify([{
        id: 'op_1',
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1',
        timestamp: Date.now(),
        retryCount: 0
      }]);

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'journal_sync_queue') return queueData;
        if (key === 'journal_network_status') return JSON.stringify({
          isOnline: false,
          lastOnlineTime: Date.now() - 1000
        });
        return null;
      });

      // Create new instance to test loading
      (OfflineService as any).instance = undefined;
      const newService = OfflineService.getInstance();

      expect(newService.getSyncQueueLength()).toBe(1);
    });
  });

  describe('Connection Quality Check', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should check connection quality periodically', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response);

      // Fast-forward time to trigger connection check
      vi.advanceTimersByTime(30000);

      expect(mockFetch).toHaveBeenCalledWith('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
    });

    it('should update status to offline on connection check failure', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockRejectedValue(new Error('Network error'));

      const callback = vi.fn();
      offlineService.onNetworkStatusChange(callback);

      // Fast-forward time to trigger connection check
      vi.advanceTimersByTime(30000);

      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async operations to complete

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: false
        })
      );
    });
  });

  describe('Clear Offline Data', () => {
    it('should clear all offline data and sync queue', async () => {
      const operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
        type: 'create',
        entityType: 'journalEntry',
        entityId: 'entry-1',
        data: { content: 'test' },
        userId: 'user-1'
      };

      await offlineService.queueOperation(operation);
      await offlineService.storeOfflineData('test-key', { data: 'test' });

      expect(offlineService.getSyncQueueLength()).toBe(1);

      await offlineService.clearOfflineData();

      expect(offlineService.getSyncQueueLength()).toBe(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('journal_sync_queue');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('journal_offline_data');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('journal_network_status');
    });
  });
});
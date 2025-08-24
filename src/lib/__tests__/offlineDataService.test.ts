import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineDataService } from '../offlineDataService';
import { Trade } from '../../types/trade';
import { TradeReviewData } from '../../types/tradeReview';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock errorHandlingService
vi.mock('../errorHandlingService', () => ({
  errorHandlingService: {
    isOnline: () => navigator.onLine,
    onNetworkChange: vi.fn((callback) => {
      const cleanup = () => {};
      return cleanup;
    }),
    handleError: vi.fn(),
    createError: vi.fn((type, message, details) => ({
      type,
      message,
      details,
      timestamp: Date.now()
    }))
  },
  TradeReviewErrorType: {
    STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
    OFFLINE_ERROR: 'OFFLINE_ERROR'
  }
}));

describe('OfflineDataService', () => {
  const mockTrade: Trade = {
    id: '123',
    symbol: 'AAPL',
    entryDate: '2024-01-01',
    entryPrice: 150,
    exitPrice: 160,
    quantity: 100,
    side: 'long',
    status: 'closed',
    pnl: 1000,
    tags: ['test'],
    notes: 'Test trade'
  };

  const mockReviewData: TradeReviewData = {
    notes: {
      preTradeAnalysis: 'Analysis',
      executionNotes: 'Execution',
      postTradeReflection: 'Reflection',
      lessonsLearned: 'Lessons',
      lastModified: '2024-01-01T00:00:00Z',
      version: 1
    },
    reviewWorkflow: {
      tradeId: '123',
      stages: [],
      overallProgress: 0,
      startedAt: '2024-01-01T00:00:00Z'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Storage Management', () => {
    it('should create empty storage when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const trade = offlineDataService.getTrade('123');
      expect(trade).toBeNull();
    });

    it('should load existing data from localStorage', () => {
      const storageData = {
        trades: { '123': mockTrade },
        reviewData: { '123': mockReviewData },
        pendingOperations: [],
        lastSync: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));
      
      const trade = offlineDataService.getTrade('123');
      expect(trade).toEqual(mockTrade);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const trade = offlineDataService.getTrade('123');
      expect(trade).toBeNull();
    });
  });

  describe('Trade Data Management', () => {
    it('should save trade data', () => {
      offlineDataService.saveTrade(mockTrade);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'trade_review_offline_data',
        expect.stringContaining('"123"')
      );
    });

    it('should retrieve saved trade data', () => {
      const storageData = {
        trades: { '123': mockTrade },
        reviewData: {},
        pendingOperations: [],
        lastSync: 0
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));
      
      const trade = offlineDataService.getTrade('123');
      expect(trade).toEqual(mockTrade);
    });

    it('should save review data', () => {
      offlineDataService.saveTradeReviewData('123', mockReviewData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'trade_review_offline_data',
        expect.stringContaining('"preTradeAnalysis":"Analysis"')
      );
    });

    it('should retrieve all trades', () => {
      const storageData = {
        trades: { 
          '123': mockTrade,
          '456': { ...mockTrade, id: '456', symbol: 'GOOGL' }
        },
        reviewData: {},
        pendingOperations: [],
        lastSync: 0
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));
      
      const trades = offlineDataService.getAllTrades();
      expect(trades).toHaveLength(2);
      expect(trades.find(t => t.id === '123')).toEqual(mockTrade);
    });
  });

  describe('Offline Operations', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
    });

    it('should add pending operations when offline', () => {
      // Mock empty storage first
      localStorageMock.getItem.mockReturnValue(null);
      
      offlineDataService.saveTrade(mockTrade);
      
      const operations = offlineDataService.getPendingOperations();
      expect(operations).toHaveLength(1);
      expect(operations[0]).toMatchObject({
        type: 'save_trade',
        tradeId: '123',
        data: mockTrade
      });
    });

    it('should not add pending operations when online', () => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      
      offlineDataService.saveTrade(mockTrade);
      
      const operations = offlineDataService.getPendingOperations();
      expect(operations).toHaveLength(0);
    });
  });

  describe('Storage Cleanup', () => {
    it('should cleanup old data when storage is full', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock storage quota exceeded error
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error('Storage quota exceeded');
        Object.defineProperty(error, 'code', { value: 22 });
        throw error;
      });
      
      // Create data with many trades
      const manyTrades: Record<string, Trade> = {};
      for (let i = 0; i < 100; i++) {
        manyTrades[i.toString()] = {
          ...mockTrade,
          id: i.toString(),
          entryDate: new Date(2024, 0, i + 1).toISOString()
        };
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        trades: manyTrades,
        reviewData: {},
        pendingOperations: [],
        lastSync: 0
      }));
      
      offlineDataService.saveTrade(mockTrade);
      
      // Should attempt cleanup
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2); // Original attempt + cleanup
      
      consoleSpy.mockRestore();
    });
  });

  describe('Synchronization', () => {
    it('should sync pending operations when online', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Add pending operations
      const storageData = {
        trades: {},
        reviewData: {},
        pendingOperations: [
          {
            id: 'op1',
            type: 'save_trade' as const,
            tradeId: '123',
            data: mockTrade,
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries: 3
          }
        ],
        lastSync: 0
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));
      
      await offlineDataService.syncPendingOperations();
      
      expect(consoleSpy).toHaveBeenCalledWith('Syncing trade:', '123');
      
      consoleSpy.mockRestore();
    });

    it('should handle sync failures with retry logic', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock operation that will fail
      const storageData = {
        trades: {},
        reviewData: {},
        pendingOperations: [
          {
            id: 'failing-op',
            type: 'save_trade' as const,
            tradeId: '123',
            data: mockTrade,
            timestamp: Date.now(),
            retryCount: 2, // Already tried twice
            maxRetries: 3
          }
        ],
        lastSync: 0
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));
      
      await offlineDataService.syncPendingOperations();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Utility Methods', () => {
    it('should provide storage info', () => {
      const storageData = {
        trades: { '123': mockTrade },
        reviewData: { '123': mockReviewData },
        pendingOperations: [
          {
            id: 'op1',
            type: 'save_trade' as const,
            tradeId: '123',
            data: mockTrade,
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries: 3
          }
        ],
        lastSync: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));
      
      const info = offlineDataService.getStorageInfo();
      
      expect(info.tradeCount).toBe(1);
      expect(info.pendingOperations).toBe(1);
      expect(info.totalSize).toBeGreaterThan(0);
      expect(info.lastSync).toBeInstanceOf(Date);
    });

    it('should check if data is available offline', () => {
      const storageData = {
        trades: { '123': mockTrade },
        reviewData: {},
        pendingOperations: [],
        lastSync: 0
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));
      
      expect(offlineDataService.isDataAvailableOffline('123')).toBe(true);
      expect(offlineDataService.isDataAvailableOffline('456')).toBe(false);
    });

    it('should clear offline data', () => {
      offlineDataService.clearOfflineData();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('trade_review_offline_data');
    });

    it('should export and import offline data', () => {
      const storageData = {
        trades: { '123': mockTrade },
        reviewData: {},
        pendingOperations: [],
        lastSync: 0
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storageData));
      
      const exported = offlineDataService.exportOfflineData();
      expect(typeof exported).toBe('string');
      
      offlineDataService.importOfflineData(exported);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle invalid import data', () => {
      expect(() => {
        offlineDataService.importOfflineData('invalid json');
      }).toThrow('Invalid offline data format');
    });
  });
});
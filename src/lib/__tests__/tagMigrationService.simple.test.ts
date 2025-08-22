import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tagMigrationService } from '../tagMigrationService';
import { Trade } from '../../types/trade';

// Mock dependencies
vi.mock('../tagPersistenceService', () => ({
  tagPersistenceService: {
    buildAndPersistTagIndex: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../firebaseService', () => ({
  tradeService: {
    updateTrade: vi.fn().mockResolvedValue(undefined),
    getTrades: vi.fn().mockResolvedValue([])
  }
}));

// Mock trade data for testing
const createMockTrade = (
  id: string, 
  tags?: string[], 
  pnl: number = 0, 
  status: 'open' | 'closed' = 'closed', 
  date: string = '2024-01-01'
): Trade => ({
  id,
  accountId: 'test-account',
  tags,
  currencyPair: 'EUR/USD',
  date,
  timeIn: '09:00',
  side: 'long',
  entryPrice: 1.1000,
  lotSize: 1,
  lotType: 'standard',
  units: 100000,
  commission: 0,
  accountCurrency: 'USD',
  status,
  pnl
});

describe('TagMigrationService - Basic Tests', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeMigrationNeeds', () => {
    it('should analyze trades with no tags', () => {
      const trades = [
        createMockTrade('1'), // No tags property
        createMockTrade('2', []), // Empty tags array
        createMockTrade('3', undefined) // Undefined tags
      ];

      const result = tagMigrationService.analyzeMigrationNeeds(trades);

      expect(result.totalTrades).toBe(3);
      expect(result.tradesNeedingMigration).toBe(3);
      expect(result.tradesWithInvalidTags).toBe(0);
      expect(result.tradesWithValidTags).toBe(0);
      expect(result.migrationRecommendations).toContain('3 trades need tag migration');
      expect(result.estimatedTime).toMatch(/seconds|minutes/);
    });

    it('should analyze trades with valid tags', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend']),
        createMockTrade('2', ['#scalp']),
        createMockTrade('3', ['#swing'])
      ];

      const result = tagMigrationService.analyzeMigrationNeeds(trades);

      expect(result.totalTrades).toBe(3);
      expect(result.tradesNeedingMigration).toBe(0);
      expect(result.tradesWithInvalidTags).toBe(0);
      expect(result.tradesWithValidTags).toBe(3);
      expect(result.migrationRecommendations).toContain('All trades are already properly tagged');
    });
  });

  describe('validateTradeTagStructure', () => {
    it('should validate trades with proper tag structure', () => {
      const trades = [
        createMockTrade('1', ['#breakout', '#trend']),
        createMockTrade('2', ['#scalp'])
      ];

      const result = tagMigrationService.validateTradeTagStructure(trades);

      expect(result.isValid).toBe(true);
      expect(result.totalTrades).toBe(2);
      expect(result.validTrades).toBe(2);
      expect(result.invalidTrades).toBe(0);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing tags field', () => {
      const trades = [
        { ...createMockTrade('1'), tags: undefined }
      ];

      const result = tagMigrationService.validateTradeTagStructure(trades);

      expect(result.isValid).toBe(false);
      expect(result.invalidTrades).toBe(1);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toBe('Missing tags field');
      expect(result.issues[0].severity).toBe('warning');
    });
  });

  describe('createMigrationBackup', () => {
    it('should create a backup of trade data', async () => {
      const trades = [
        createMockTrade('1', ['#test']),
        createMockTrade('2', ['#backup'])
      ];

      const backup = await tagMigrationService.createMigrationBackup(userId, trades);

      expect(backup.userId).toBe(userId);
      expect(backup.totalTrades).toBe(2);
      expect(backup.trades).toHaveLength(2);
      expect(backup.backupDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(backup.version).toBe('1.0');
      
      // Ensure it's a deep copy
      expect(backup.trades).not.toBe(trades);
      expect(backup.trades[0]).not.toBe(trades[0]);
    });
  });
});
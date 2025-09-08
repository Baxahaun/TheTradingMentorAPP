/**
 * Trade Reference Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createCachedTradeData,
  createTradeReference,
  updateTradeReferencesCache,
  validateTradeReference,
  getReferencesForSection,
  getAvailableTradesForSection,
  applyTradeFilterCriteria,
  searchTrades,
  sortTrades,
  getTradeReferenceStats
} from '../tradeReferenceUtils';
import { Trade } from '../../types/trade';
import { TradeReference } from '../../types/journal';

const mockTrade: Trade = {
  id: 'trade-1',
  accountId: 'account-1',
  currencyPair: 'EUR/USD',
  date: '2024-01-15',
  timeIn: '2024-01-15T09:30:00Z',
  timeOut: '2024-01-15T11:45:00Z',
  side: 'long',
  entryPrice: 1.0850,
  exitPrice: 1.0875,
  lotSize: 1.0,
  lotType: 'standard',
  units: 100000,
  pnl: 250,
  commission: 5,
  accountCurrency: 'USD',
  status: 'closed',
  strategy: 'Breakout Strategy',
  notes: 'Clean breakout above resistance'
};

const mockTrades: Trade[] = [
  mockTrade,
  {
    ...mockTrade,
    id: 'trade-2',
    currencyPair: 'GBP/USD',
    pnl: -150,
    status: 'open',
    strategy: 'Reversal Play',
    notes: 'Failed reversal attempt'
  }
];

const mockReference: TradeReference = {
  id: 'ref-1',
  tradeId: 'trade-1',
  insertedAt: '2024-01-15T12:00:00Z',
  context: 'Test reference',
  displayType: 'card',
  sectionId: 'section-1',
  cachedTradeData: {
    symbol: 'EUR/USD',
    direction: 'long',
    pnl: 250,
    status: 'closed',
    timeIn: '2024-01-15T09:30:00Z',
    timeOut: '2024-01-15T11:45:00Z'
  }
};

describe('tradeReferenceUtils', () => {
  describe('createCachedTradeData', () => {
    it('should create cached data correctly', () => {
      const cached = createCachedTradeData(mockTrade);
      
      expect(cached).toEqual({
        symbol: 'EUR/USD',
        direction: 'long',
        pnl: 250,
        status: 'closed',
        timeIn: '2024-01-15T09:30:00Z',
        timeOut: '2024-01-15T11:45:00Z'
      });
    });
  });

  describe('createTradeReference', () => {
    it('should create a trade reference with cached data', () => {
      const ref = createTradeReference('trade-1', 'Test context', 'card', 'section-1', mockTrades);
      
      expect(ref.tradeId).toBe('trade-1');
      expect(ref.context).toBe('Test context');
      expect(ref.displayType).toBe('card');
      expect(ref.sectionId).toBe('section-1');
      expect(ref.cachedTradeData).toBeDefined();
      expect(ref.cachedTradeData?.symbol).toBe('EUR/USD');
    });

    it('should handle missing trade gracefully', () => {
      const ref = createTradeReference('non-existent', 'Test context', 'card', 'section-1', mockTrades);
      
      expect(ref.cachedTradeData).toBeUndefined();
    });
  });

  describe('updateTradeReferencesCache', () => {
    it('should update cached data when trade changes', () => {
      const updatedTrade = { ...mockTrade, pnl: 300 };
      const references = [mockReference];
      
      const updated = updateTradeReferencesCache(references, [updatedTrade]);
      
      expect(updated[0].cachedTradeData?.pnl).toBe(300);
    });

    it('should preserve cache when trade not found', () => {
      const references = [mockReference];
      
      const updated = updateTradeReferencesCache(references, []);
      
      expect(updated[0].cachedTradeData).toEqual(mockReference.cachedTradeData);
    });
  });

  describe('validateTradeReference', () => {
    it('should return true for valid reference', () => {
      const isValid = validateTradeReference(mockReference, mockTrades);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid reference', () => {
      const invalidRef = { ...mockReference, tradeId: 'non-existent' };
      const isValid = validateTradeReference(invalidRef, mockTrades);
      expect(isValid).toBe(false);
    });
  });

  describe('getReferencesForSection', () => {
    it('should filter references by section', () => {
      const references = [
        mockReference,
        { ...mockReference, id: 'ref-2', sectionId: 'section-2' }
      ];
      
      const sectionRefs = getReferencesForSection(references, 'section-1');
      
      expect(sectionRefs).toHaveLength(1);
      expect(sectionRefs[0].id).toBe('ref-1');
    });
  });

  describe('getAvailableTradesForSection', () => {
    it('should exclude already referenced trades', () => {
      const available = getAvailableTradesForSection(mockTrades, [mockReference], 'section-1');
      
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('trade-2');
    });
  });

  describe('applyTradeFilterCriteria', () => {
    it('should filter by status', () => {
      const filtered = applyTradeFilterCriteria(mockTrades, { status: 'closed' });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('closed');
    });

    it('should filter by profitability', () => {
      const filtered = applyTradeFilterCriteria(mockTrades, { profitability: 'winning' });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].pnl).toBeGreaterThan(0);
    });

    it('should return all trades when no criteria', () => {
      const filtered = applyTradeFilterCriteria(mockTrades);
      
      expect(filtered).toHaveLength(2);
    });
  });

  describe('searchTrades', () => {
    it('should search by currency pair', () => {
      const results = searchTrades(mockTrades, 'EUR');
      
      expect(results).toHaveLength(1);
      expect(results[0].currencyPair).toBe('EUR/USD');
    });

    it('should search by strategy', () => {
      const results = searchTrades(mockTrades, 'Breakout');
      
      expect(results).toHaveLength(1);
      expect(results[0].strategy).toBe('Breakout Strategy');
    });

    it('should return all trades for empty query', () => {
      const results = searchTrades(mockTrades, '');
      
      expect(results).toHaveLength(2);
    });
  });

  describe('sortTrades', () => {
    it('should sort by P&L descending', () => {
      const sorted = sortTrades(mockTrades, 'pnl', 'desc');
      
      expect(sorted[0].pnl).toBe(250);
      expect(sorted[1].pnl).toBe(-150);
    });

    it('should sort by symbol ascending', () => {
      const sorted = sortTrades(mockTrades, 'symbol', 'asc');
      
      expect(sorted[0].currencyPair).toBe('EUR/USD');
      expect(sorted[1].currencyPair).toBe('GBP/USD');
    });
  });

  describe('getTradeReferenceStats', () => {
    it('should calculate stats correctly', () => {
      const references = [
        mockReference,
        { ...mockReference, id: 'ref-2', displayType: 'preview' }
      ];
      
      const stats = getTradeReferenceStats(references, 'section-1', 5);
      
      expect(stats.count).toBe(2);
      expect(stats.canAddMore).toBe(true);
      expect(stats.maxReached).toBe(false);
      expect(stats.displayTypes.card).toBe(1);
      expect(stats.displayTypes.preview).toBe(1);
    });

    it('should detect max reached', () => {
      const references = Array.from({ length: 5 }, (_, i) => ({
        ...mockReference,
        id: `ref-${i}`
      }));
      
      const stats = getTradeReferenceStats(references, 'section-1', 5);
      
      expect(stats.maxReached).toBe(true);
      expect(stats.canAddMore).toBe(false);
    });
  });
});
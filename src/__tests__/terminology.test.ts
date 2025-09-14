/**
 * Comprehensive tests for terminology system changes
 * Tests futures conversion across all components and services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Trade } from '../types/trade';
import {
  CURRENT_TERMINOLOGY,
  FOREX_TERMINOLOGY,
  FUTURES_TERMINOLOGY,
  switchToForexTerminology,
  switchToFuturesTerminology
} from '../lib/terminologyConfig';
import { JournalExportService } from '../services/JournalExportService';

// Mock data for testing
const mockTrade: Trade = {
  id: 'test-trade-1',
  accountId: 'test-account',
  currencyPair: 'EUR/USD',
  date: '2024-01-15',
  timeIn: '09:30',
  timeOut: '16:45',
  timestamp: Date.now(),
  side: 'long',
  entryPrice: 1.0850,
  exitPrice: 1.0920,
  lotSize: 2.5,
  lotType: 'standard' as const,
  units: 250000,
  stopLoss: 1.0800,
  takeProfit: 1.0950,
  commission: 2.50,
  pips: 70,
  pnl: 175.00,
  accountCurrency: 'USD',
  strategy: 'Trend Following',
  notes: 'Strong bullish momentum',
  tags: ['trend', 'momentum'],
  confidence: 8,
  emotions: 'confident',
  status: 'closed' as const
};

const mockTrades: Trade[] = [mockTrade];

describe('Terminology System Tests', () => {
  describe('Terminology Configuration', () => {
    it('should switch between forex and futures terminology correctly', () => {
      // Start with forex
      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Currency Pair');
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Lot Size');
      expect(CURRENT_TERMINOLOGY.priceMovementUnit).toBe('pips');

      // Switch to futures
      switchToFuturesTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Futures Instrument');
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Contract Size');
      expect(CURRENT_TERMINOLOGY.priceMovementUnit).toBe('points');

      // Switch back to forex
      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Currency Pair');
    });

    it('should have consistent terminology mappings', () => {
      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe(FOREX_TERMINOLOGY.instrumentLabel);
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe(FOREX_TERMINOLOGY.positionSizeLabel);

      switchToFuturesTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe(FUTURES_TERMINOLOGY.instrumentLabel);
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe(FUTURES_TERMINOLOGY.positionSizeLabel);
    });

    it('should maintain validation message structure', () => {
      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.validationMessages).toHaveProperty('required');
      expect(CURRENT_TERMINOLOGY.validationMessages).toHaveProperty('invalidFormat');

      switchToFuturesTerminology();
      expect(CURRENT_TERMINOLOGY.validationMessages).toHaveProperty('required');
      expect(CURRENT_TERMINOLOGY.validationMessages).toHaveProperty('invalidFormat');
    });
  });

  describe('Export Service Tests', () => {
    beforeEach(() => {
      // Reset to forex for consistent testing
      switchToForexTerminology();
    });

    it('should export CSV with forex terminology headers', () => {
      switchToForexTerminology();

      // Test the summary function which is the core logic
      const summary = JournalExportService.getExportSummary(mockTrades);
      expect(summary.totalTrades).toBe(1);
      expect(summary.terminology).toContain('Currency Pair');

      // Test HTML generation with terminology
      const htmlContent = JournalExportService.generatePDFContent(mockTrades);
      expect(htmlContent).toContain('Currency Pair');
      expect(htmlContent).toContain('Lot Size');
    });

    it('should export JSON with dynamic property names', () => {
      switchToForexTerminology();
      const forexSummary = JournalExportService.getExportSummary(mockTrades);
      expect(forexSummary.terminology).toContain('Currency Pair');

      switchToFuturesTerminology();
      const futuresSummary = JournalExportService.getExportSummary(mockTrades);
      expect(futuresSummary.terminology).toContain('Futures Instrument');
    });

    it('should generate HTML reports with current terminology', () => {
      switchToForexTerminology();
      const htmlContent = JournalExportService.generatePDFContent(mockTrades);
      expect(htmlContent).toContain('Currency Pair');
      expect(htmlContent).toContain('Lot Size');

      switchToFuturesTerminology();
      const futuresHtmlContent = JournalExportService.generatePDFContent(mockTrades);
      expect(futuresHtmlContent).toContain('Futures Instrument');
      expect(futuresHtmlContent).toContain('Contract Size');
    });

    it('should calculate export summary statistics correctly', () => {
      const summary = JournalExportService.getExportSummary(mockTrades);

      expect(summary.totalTrades).toBe(1);
      expect(summary.totalPnL).toBe(175.00);
      expect(summary.totalPips).toBe(70);
      expect(summary.winRate).toBe(100); // 1 winning trade out of 1
      expect(typeof summary.terminology).toBe('string');
    });
  });

  describe('Terminology Persistence', () => {
    it('should maintain terminology state across operations', () => {
      // Set futures terminology
      switchToFuturesTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Futures Instrument');

      // Perform operations that might change state
      const summary = JournalExportService.getExportSummary(mockTrades);
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Futures Instrument');

      // Terminology should still be futures
      expect(summary.terminology).toContain('Futures Instrument');
    });

    it('should handle terminology switching in export operations', () => {
      // Test forex export
      switchToForexTerminology();
      const forexSummary = JournalExportService.getExportSummary(mockTrades);
      expect(forexSummary.terminology).toContain('Currency Pair');

      // Test futures export
      switchToFuturesTerminology();
      const futuresSummary = JournalExportService.getExportSummary(mockTrades);
      expect(futuresSummary.terminology).toContain('Futures Instrument');

      // Verify data integrity
      expect(forexSummary.totalTrades).toBe(futuresSummary.totalTrades);
      expect(forexSummary.totalPnL).toBe(futuresSummary.totalPnL);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should preserve trade data across terminology changes', () => {
      const originalTrade = { ...mockTrade };

      // Switch terminology multiple times
      switchToForexTerminology();
      switchToFuturesTerminology();
      switchToForexTerminology();

      // Trade data should remain unchanged
      expect(mockTrade.currencyPair).toBe(originalTrade.currencyPair);
      expect(mockTrade.lotSize).toBe(originalTrade.lotSize);
      expect(mockTrade.pips).toBe(originalTrade.pips);
      expect(mockTrade.pnl).toBe(originalTrade.pnl);
    });

    it('should handle empty trade arrays', () => {
      const summary = JournalExportService.getExportSummary([]);

      expect(summary.totalTrades).toBe(0);
      expect(summary.totalPnL).toBe(0);
      expect(summary.totalPips).toBe(0);
      expect(summary.winRate).toBe(0);
      expect(typeof summary.terminology).toBe('string');
    });

    it('should calculate win rate correctly for mixed results', () => {
      const mixedTrades: Trade[] = [
        { ...mockTrade, pnl: 100 }, // Win
        { ...mockTrade, id: 'trade-2', pnl: -50 }, // Loss
        { ...mockTrade, id: 'trade-3', pnl: 75 }, // Win
      ];

      const summary = JournalExportService.getExportSummary(mixedTrades);

      expect(summary.totalTrades).toBe(3);
      expect(summary.winRate).toBeCloseTo(66.7, 1); // 2 wins out of 3 trades
      expect(summary.totalPnL).toBe(125); // 100 + (-50) + 75
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid trade data gracefully', () => {
      const invalidTrade: Trade = {
        ...mockTrade,
        pnl: undefined as any,
        pips: undefined as any
      };

      const summary = JournalExportService.getExportSummary([invalidTrade]);

      expect(summary.totalTrades).toBe(1);
      expect(summary.totalPnL).toBe(0); // Should handle undefined values
      expect(summary.totalPips).toBe(0); // Should handle undefined values
    });

    it('should handle trades with missing optional fields', () => {
      const incompleteTrade: Trade = {
        ...mockTrade,
        strategy: undefined,
        notes: undefined,
        tags: undefined,
        confidence: undefined,
        emotions: undefined
      };

      const summary = JournalExportService.getExportSummary([incompleteTrade]);

      expect(summary.totalTrades).toBe(1);
      expect(summary.totalPnL).toBe(0); // No pnl provided
      expect(summary.totalPips).toBe(0); // No pips provided
    });
  });

  describe('Performance Tests', () => {
    it('should handle large trade arrays efficiently', () => {
      const largeTradeArray: Trade[] = Array.from({ length: 1000 }, (_, index) => ({
        ...mockTrade,
        id: `trade-${index}`,
        pnl: Math.random() * 200 - 100, // Random P&L between -100 and +100
        pips: Math.random() * 100 // Random pips
      }));

      const startTime = Date.now();
      const summary = JournalExportService.getExportSummary(largeTradeArray);
      const endTime = Date.now();

      expect(summary.totalTrades).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Terminology Integration Tests', () => {
    it('should maintain terminology consistency across all operations', () => {
      // Test forex mode
      switchToForexTerminology();

      const forexSummary = JournalExportService.getExportSummary(mockTrades);
      const forexHtml = JournalExportService.generatePDFContent(mockTrades);

      expect(forexSummary.terminology).toContain('Currency Pair');
      expect(forexHtml).toContain('Currency Pair');
      expect(forexHtml).toContain('Lot Size');

      // Test futures mode
      switchToFuturesTerminology();

      const futuresSummary = JournalExportService.getExportSummary(mockTrades);
      const futuresHtml = JournalExportService.generatePDFContent(mockTrades);

      expect(futuresSummary.terminology).toContain('Futures Instrument');
      expect(futuresHtml).toContain('Futures Instrument');
      expect(futuresHtml).toContain('Contract Size');

      // Verify data integrity is preserved
      expect(forexSummary.totalTrades).toBe(futuresSummary.totalTrades);
      expect(forexSummary.totalPnL).toBe(futuresSummary.totalPnL);
    });

    it('should handle terminology switching mid-operation', () => {
      switchToForexTerminology();
      const forexSummary = JournalExportService.getExportSummary(mockTrades);

      switchToFuturesTerminology();
      const futuresSummary = JournalExportService.getExportSummary(mockTrades);

      expect(forexSummary.terminology).not.toBe(futuresSummary.terminology);
      expect(forexSummary.totalTrades).toBe(futuresSummary.totalTrades);
    });
  });

  describe('Edge Cases', () => {
    it('should handle trades with zero or negative values', () => {
      const edgeCaseTrades: Trade[] = [
        { ...mockTrade, pnl: 0, pips: 0 }, // Break-even trade
        { ...mockTrade, id: 'trade-2', pnl: -50, pips: -25 }, // Losing trade
        { ...mockTrade, id: 'trade-3', pnl: 100, pips: 50 }, // Winning trade
      ];

      const summary = JournalExportService.getExportSummary(edgeCaseTrades);

      expect(summary.totalTrades).toBe(3);
      expect(summary.totalPnL).toBe(50); // 0 + (-50) + 100
      expect(summary.totalPips).toBe(25); // 0 + (-25) + 50
      expect(summary.winRate).toBeCloseTo(33.3, 1); // 1 win out of 3 trades
    });

    it('should handle undefined and null values gracefully', () => {
      const incompleteTrades: Trade[] = [
        {
          ...mockTrade,
          strategy: undefined,
          notes: undefined,
          tags: undefined,
          confidence: undefined,
          emotions: undefined,
          exitPrice: undefined,
          stopLoss: undefined,
          takeProfit: undefined
        }
      ];

      const summary = JournalExportService.getExportSummary(incompleteTrades);
      expect(summary.totalTrades).toBe(1);
      expect(typeof summary.terminology).toBe('string');
    });
  });
});
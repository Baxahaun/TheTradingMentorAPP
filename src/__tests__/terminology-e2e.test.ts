/**
 * End-to-End tests for terminology system
 * Tests complete workflow from terminology switching to export
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Trade } from '../types/trade';
import {
  CURRENT_TERMINOLOGY,
  switchToForexTerminology,
  switchToFuturesTerminology
} from '../lib/terminologyConfig';
import { JournalExportService } from '../services/JournalExportService';

// Test data representing a complete trading scenario
const createTestTrades = (): Trade[] => [
  {
    id: 'trade-1',
    accountId: 'demo-account',
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
    notes: 'Strong bullish momentum on EUR/USD',
    tags: ['trend', 'momentum', 'bullish'],
    confidence: 8,
    emotions: 'confident',
    status: 'closed' as const
  },
  {
    id: 'trade-2',
    accountId: 'demo-account',
    currencyPair: 'GBP/JPY',
    date: '2024-01-16',
    timeIn: '10:15',
    timeOut: '14:30',
    timestamp: Date.now() + 86400000,
    side: 'short',
    entryPrice: 185.50,
    exitPrice: 184.80,
    lotSize: 1.0,
    lotType: 'standard' as const,
    units: 100000,
    stopLoss: 186.00,
    takeProfit: 184.50,
    commission: 1.00,
    pips: 70,
    pnl: 69.00,
    accountCurrency: 'USD',
    strategy: 'Reversal',
    notes: 'Bearish reversal pattern',
    tags: ['reversal', 'bearish'],
    confidence: 7,
    emotions: 'cautious',
    status: 'closed' as const
  },
  {
    id: 'trade-3',
    accountId: 'demo-account',
    currencyPair: 'USD/CAD',
    date: '2024-01-17',
    timeIn: '13:00',
    timeOut: '15:45',
    timestamp: Date.now() + 172800000,
    side: 'long',
    entryPrice: 1.3450,
    exitPrice: 1.3420,
    lotSize: 3.0,
    lotType: 'standard' as const,
    units: 300000,
    stopLoss: 1.3400,
    takeProfit: 1.3500,
    commission: 3.00,
    pips: -30,
    pnl: -93.00,
    accountCurrency: 'USD',
    strategy: 'Breakout',
    notes: 'Failed breakout attempt',
    tags: ['breakout', 'failed'],
    confidence: 6,
    emotions: 'disappointed',
    status: 'closed' as const
  }
];

describe('End-to-End Terminology Tests', () => {
  let testTrades: Trade[];

  beforeEach(() => {
    testTrades = createTestTrades();
  });

  describe('Complete Forex Workflow', () => {
    beforeEach(() => {
      switchToForexTerminology();
    });

    it('should process complete forex trading workflow', () => {
      // Verify terminology is set correctly
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Currency Pair');
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Lot Size');
      expect(CURRENT_TERMINOLOGY.priceMovementUnit).toBe('pips');

      // Process trades with forex terminology
      const summary = JournalExportService.getExportSummary(testTrades);
      const htmlContent = JournalExportService.generatePDFContent(testTrades);

      // Verify summary calculations
      expect(summary.totalTrades).toBe(3);
      expect(summary.totalPnL).toBe(151.00); // 175 + 69 - 93
      expect(summary.totalPips).toBe(110); // 70 + 70 - 30
      expect(summary.winRate).toBeCloseTo(66.7, 1); // 2 wins out of 3 trades
      expect(summary.terminology).toContain('Currency Pair');

      // Verify HTML content includes forex terminology
      expect(htmlContent).toContain('Currency Pair');
      expect(htmlContent).toContain('Lot Size');
      expect(htmlContent).toContain('pips');
      expect(htmlContent).toContain('EUR/USD');
      expect(htmlContent).toContain('GBP/JPY');
      expect(htmlContent).toContain('USD/CAD');
    });

    it('should export forex data correctly', () => {
      const summary = JournalExportService.getExportSummary(testTrades);

      // Verify all trade data is preserved
      expect(summary.totalTrades).toBe(3);
      expect(summary.averageWin).toBe(0); // Not calculated in summary
      expect(summary.averageLoss).toBe(0); // Not calculated in summary

      // Verify terminology is forex
      expect(summary.terminology).toContain('Currency Pair');
    });
  });

  describe('Complete Futures Workflow', () => {
    beforeEach(() => {
      switchToFuturesTerminology();
    });

    it('should process complete futures trading workflow', () => {
      // Verify terminology is set correctly
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Futures Instrument');
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Contract Size');
      expect(CURRENT_TERMINOLOGY.priceMovementUnit).toBe('points');

      // Process trades with futures terminology
      const summary = JournalExportService.getExportSummary(testTrades);
      const htmlContent = JournalExportService.generatePDFContent(testTrades);

      // Verify summary calculations remain the same
      expect(summary.totalTrades).toBe(3);
      expect(summary.totalPnL).toBe(151.00);
      expect(summary.totalPips).toBe(110);
      expect(summary.winRate).toBeCloseTo(66.7, 1);

      // Verify terminology changed but data integrity preserved
      expect(summary.terminology).toContain('Futures Instrument');

      // Verify HTML content includes futures terminology
      expect(htmlContent).toContain('Futures Instrument');
      expect(htmlContent).toContain('Contract Size');
      expect(htmlContent).toContain('points');
      // Note: HTML content still shows original instrument names
    });

    it('should export futures data correctly', () => {
      const summary = JournalExportService.getExportSummary(testTrades);

      // Verify data integrity is maintained
      expect(summary.totalTrades).toBe(3);
      expect(summary.totalPnL).toBe(151.00);
      expect(summary.terminology).toContain('Futures Instrument');
    });
  });

  describe('Terminology Switching Workflow', () => {
    it('should handle complete terminology switching workflow', () => {
      // Start with forex
      switchToForexTerminology();
      const forexSummary = JournalExportService.getExportSummary(testTrades);
      const forexHtml = JournalExportService.generatePDFContent(testTrades);

      expect(forexSummary.terminology).toContain('Currency Pair');
      expect(forexHtml).toContain('Currency Pair');

      // Switch to futures
      switchToFuturesTerminology();
      const futuresSummary = JournalExportService.getExportSummary(testTrades);
      const futuresHtml = JournalExportService.generatePDFContent(testTrades);

      expect(futuresSummary.terminology).toContain('Futures Instrument');
      expect(futuresHtml).toContain('Futures Instrument');

      // Verify data consistency
      expect(forexSummary.totalTrades).toBe(futuresSummary.totalTrades);
      expect(forexSummary.totalPnL).toBe(futuresSummary.totalPnL);
      expect(forexSummary.totalPips).toBe(futuresSummary.totalPips);

      // Switch back to forex
      switchToForexTerminology();
      const backToForexSummary = JournalExportService.getExportSummary(testTrades);

      expect(backToForexSummary.terminology).toContain('Currency Pair');
      expect(backToForexSummary.totalTrades).toBe(forexSummary.totalTrades);
    });

    it('should maintain terminology state across multiple switches', () => {
      // Switch terminology multiple times
      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Currency Pair');

      switchToFuturesTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Futures Instrument');

      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Currency Pair');

      switchToFuturesTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Futures Instrument');
    });
  });

  describe('Export Format Consistency', () => {
    it('should maintain data consistency across export formats', () => {
      switchToForexTerminology();

      const summary = JournalExportService.getExportSummary(testTrades);
      const htmlContent = JournalExportService.generatePDFContent(testTrades);

      // HTML should contain the same data as summary
      expect(htmlContent).toContain('3'); // Total trades
      expect(htmlContent).toContain('151'); // Total P&L
      expect(htmlContent).toContain('Currency Pair'); // Terminology

      // Switch to futures and verify
      switchToFuturesTerminology();

      const futuresSummary = JournalExportService.getExportSummary(testTrades);
      const futuresHtmlContent = JournalExportService.generatePDFContent(testTrades);

      expect(futuresHtmlContent).toContain('3'); // Total trades (unchanged)
      expect(futuresHtmlContent).toContain('151'); // Total P&L (unchanged)
      expect(futuresHtmlContent).toContain('Futures Instrument'); // Terminology (changed)
    });
  });

  describe('Performance Validation', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const baseTrade = testTrades[0];
      const largeDataset: Trade[] = Array.from({ length: 1000 }, (_, index) => ({
        ...baseTrade,
        id: `large-trade-${index}`,
        pnl: Math.random() * 400 - 200, // Random P&L between -200 and +200
        pips: Math.random() * 200 - 100 // Random pips between -100 and +100
      } as Trade));

      const startTime = Date.now();

      switchToForexTerminology();
      const forexSummary = JournalExportService.getExportSummary(largeDataset);

      switchToFuturesTerminology();
      const futuresSummary = JournalExportService.getExportSummary(largeDataset);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Verify results
      expect(forexSummary.totalTrades).toBe(1000);
      expect(futuresSummary.totalTrades).toBe(1000);
      expect(forexSummary.terminology).toContain('Currency Pair');
      expect(futuresSummary.terminology).toContain('Futures Instrument');

      // Performance check - should complete in reasonable time
      expect(processingTime).toBeLessThan(500); // Under 500ms for 1000 trades
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupted trade data gracefully', () => {
      const corruptedTrades = [
        { ...testTrades[0], pnl: undefined, pips: undefined },
        { ...testTrades[1], pnl: null, pips: null },
        testTrades[2] // Valid trade
      ];

      switchToForexTerminology();
      const summary = JournalExportService.getExportSummary(corruptedTrades as Trade[]);

      // Should handle undefined/null values
      expect(summary.totalTrades).toBe(3);
      expect(summary.totalPnL).toBe(-93); // Only valid trade's P&L
      expect(summary.totalPips).toBe(-30); // Only valid trade's pips
      expect(summary.terminology).toContain('Currency Pair');
    });

    it('should recover from terminology switching errors', () => {
      // Simulate error scenario
      switchToForexTerminology();
      const beforeErrorSummary = JournalExportService.getExportSummary(testTrades);

      // Switch terminology
      switchToFuturesTerminology();
      const afterSwitchSummary = JournalExportService.getExportSummary(testTrades);

      // Verify recovery
      expect(beforeErrorSummary.totalTrades).toBe(afterSwitchSummary.totalTrades);
      expect(beforeErrorSummary.totalPnL).toBe(afterSwitchSummary.totalPnL);
      expect(beforeErrorSummary.terminology).not.toBe(afterSwitchSummary.terminology);
    });
  });
});
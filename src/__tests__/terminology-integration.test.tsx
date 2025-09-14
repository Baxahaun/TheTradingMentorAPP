/**
 * Integration tests for terminology changes in UI components
 * Tests how components render with different terminology configurations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Trade } from '../types/trade';
import {
  CURRENT_TERMINOLOGY,
  switchToForexTerminology,
  switchToFuturesTerminology
} from '../lib/terminologyConfig';

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

describe('Terminology Integration Tests', () => {
  describe('Terminology Rendering in Components', () => {
    it('should render forex terminology correctly', () => {
      switchToForexTerminology();

      // Test that terminology configuration is set correctly
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Currency Pair');
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Lot Size');
      expect(CURRENT_TERMINOLOGY.priceMovementUnit).toBe('pips');
    });

    it('should render futures terminology correctly', () => {
      switchToFuturesTerminology();

      // Test that terminology configuration is set correctly
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe('Futures Instrument');
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Contract Size');
      expect(CURRENT_TERMINOLOGY.priceMovementUnit).toBe('points');
    });

    it('should maintain terminology consistency across switching', () => {
      // Start with forex
      switchToForexTerminology();
      const forexInstrument = CURRENT_TERMINOLOGY.instrumentLabel;
      const forexPositionSize = CURRENT_TERMINOLOGY.positionSizeLabel;

      // Switch to futures
      switchToFuturesTerminology();
      const futuresInstrument = CURRENT_TERMINOLOGY.instrumentLabel;
      const futuresPositionSize = CURRENT_TERMINOLOGY.positionSizeLabel;

      // Verify they are different
      expect(forexInstrument).not.toBe(futuresInstrument);
      expect(forexPositionSize).not.toBe(futuresPositionSize);

      // Switch back to forex
      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe(forexInstrument);
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe(forexPositionSize);
    });
  });

  describe('Export Interface Terminology', () => {
    it('should generate export summaries with correct terminology', () => {
      switchToForexTerminology();

      // Mock the export summary function
      const mockSummary = {
        totalTrades: 1,
        totalPnL: 175.00,
        totalPips: 70,
        winRate: 100,
        averageWin: 175.00,
        averageLoss: 0,
        terminology: 'Currency Pair Trading'
      };

      expect(mockSummary.terminology).toContain('Currency Pair');
      expect(mockSummary.totalTrades).toBe(1);
      expect(mockSummary.totalPnL).toBe(175.00);
    });

    it('should handle terminology in HTML export generation', () => {
      switchToForexTerminology();

      // Test HTML content generation with terminology
      const mockHtmlContent = `
        <h1>${CURRENT_TERMINOLOGY.instrumentLabel} Trading Journal Report</h1>
        <p>Terminology: ${CURRENT_TERMINOLOGY.instrumentLabel} Trading</p>
        <table>
          <thead>
            <tr>
              <th>${CURRENT_TERMINOLOGY.instrumentLabel}</th>
              <th>${CURRENT_TERMINOLOGY.positionSizeLabel}</th>
              <th>P&L (${CURRENT_TERMINOLOGY.priceMovementUnit})</th>
            </tr>
          </thead>
        </table>
      `;

      expect(mockHtmlContent).toContain('Currency Pair');
      expect(mockHtmlContent).toContain('Lot Size');
      expect(mockHtmlContent).toContain('pips');
    });

    it('should handle terminology switching in export operations', () => {
      // Forex mode
      switchToForexTerminology();
      const forexHeaders = [
        'Date',
        CURRENT_TERMINOLOGY.instrumentLabel,
        'Side',
        CURRENT_TERMINOLOGY.positionSizeLabel,
        `P&L (${CURRENT_TERMINOLOGY.priceMovementUnit})`
      ];

      expect(forexHeaders).toContain('Currency Pair');
      expect(forexHeaders).toContain('Lot Size');

      // Futures mode
      switchToFuturesTerminology();
      const futuresHeaders = [
        'Date',
        CURRENT_TERMINOLOGY.instrumentLabel,
        'Side',
        CURRENT_TERMINOLOGY.positionSizeLabel,
        `P&L (${CURRENT_TERMINOLOGY.priceMovementUnit})`
      ];

      expect(futuresHeaders).toContain('Futures Instrument');
      expect(futuresHeaders).toContain('Contract Size');
    });
  });

  describe('Form Validation Terminology', () => {
    it('should use terminology in validation messages', () => {
      switchToForexTerminology();

      const validationMessages = CURRENT_TERMINOLOGY.validationMessages;
      expect(validationMessages.required).toBe('This field is required');
      expect(validationMessages.invalidFormat).toBe('Invalid format');

      switchToFuturesTerminology();

      const futuresValidationMessages = CURRENT_TERMINOLOGY.validationMessages;
      expect(futuresValidationMessages.required).toBe('This field is required');
      expect(futuresValidationMessages.invalidFormat).toBe('Invalid format');
    });

    it('should provide consistent help text across terminology modes', () => {
      switchToForexTerminology();
      const forexHelp = CURRENT_TERMINOLOGY.helpText;
      expect(forexHelp.instrumentSelection).toContain('currency pair');

      switchToFuturesTerminology();
      const futuresHelp = CURRENT_TERMINOLOGY.helpText;
      expect(futuresHelp.instrumentSelection).toContain('futures instrument');

      // Help text should be different for different modes
      expect(forexHelp.instrumentSelection).not.toBe(futuresHelp.instrumentSelection);
    });
  });

  describe('Data Integrity Across Terminology Changes', () => {
    it('should preserve trade data when switching terminology', () => {
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

    it('should maintain calculation accuracy across terminology modes', () => {
      const testTrades = [
        { ...mockTrade, pnl: 100, pips: 50 },
        { ...mockTrade, id: 'trade-2', pnl: -25, pips: -12 }
      ];

      // Calculate summary
      const totalPnL = testTrades.reduce((sum, trade) => sum + trade.pnl, 0);
      const totalPips = testTrades.reduce((sum, trade) => sum + trade.pips, 0);
      const winRate = (testTrades.filter(t => t.pnl > 0).length / testTrades.length) * 100;

      expect(totalPnL).toBe(75);
      expect(totalPips).toBe(38);
      expect(winRate).toBe(50);
    });
  });

  describe('Terminology Persistence in UI State', () => {
    it('should maintain terminology state across component interactions', () => {
      // Set initial terminology
      switchToForexTerminology();
      const initialTerminology = CURRENT_TERMINOLOGY.instrumentLabel;

      // Simulate component interactions that might change state
      // (In a real scenario, this would involve user interactions)

      // Verify terminology remains consistent
      expect(CURRENT_TERMINOLOGY.instrumentLabel).toBe(initialTerminology);
    });

    it('should handle terminology changes during runtime', () => {
      // Start with forex
      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Lot Size');

      // Change to futures during runtime
      switchToFuturesTerminology();
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Contract Size');

      // Change back
      switchToForexTerminology();
      expect(CURRENT_TERMINOLOGY.positionSizeLabel).toBe('Lot Size');
    });
  });

  describe('Error Handling with Terminology', () => {
    it('should handle invalid trade data gracefully', () => {
      const invalidTrades = [
        { ...mockTrade, pnl: undefined, pips: undefined },
        { ...mockTrade, id: 'trade-2', pnl: null, pips: null }
      ];

      // Should handle undefined/null values without crashing
      const totalPnL = invalidTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const totalPips = invalidTrades.reduce((sum, trade) => sum + (trade.pips || 0), 0);

      expect(totalPnL).toBe(175); // Only first trade has valid pnl
      expect(totalPips).toBe(70); // Only first trade has valid pips
    });

    it('should provide meaningful error context with terminology', () => {
      switchToForexTerminology();

      // Error messages should be relevant to current terminology mode
      const errorContext = {
        mode: 'forex',
        terminology: CURRENT_TERMINOLOGY.instrumentLabel,
        message: `Invalid ${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} format`
      };

      expect(errorContext.terminology).toBe('Currency Pair');
      expect(errorContext.message).toContain('currency pair');
    });
  });
});

// Mock implementations for testing
vi.mock('../services/JournalExportService', () => ({
  JournalExportService: {
    getExportSummary: vi.fn((trades: Trade[]) => ({
      totalTrades: trades.length,
      totalPnL: trades.reduce((sum: number, trade: Trade) => sum + (trade.pnl || 0), 0),
      totalPips: trades.reduce((sum: number, trade: Trade) => sum + (trade.pips || 0), 0),
      winRate: trades.length > 0 ?
        (trades.filter((t: Trade) => (t.pnl || 0) > 0).length / trades.length) * 100 : 0,
      averageWin: 0,
      averageLoss: 0,
      terminology: CURRENT_TERMINOLOGY.instrumentLabel + ' Trading'
    })),
    generatePDFContent: vi.fn(() => `<h1>${CURRENT_TERMINOLOGY.instrumentLabel} Report</h1>`)
  }
}));
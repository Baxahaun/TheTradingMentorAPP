import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupClassificationService } from '../setupClassificationService';
import { patternRecognitionService } from '../patternRecognitionService';
import { positionManagementService } from '../positionManagementService';

// Mock Firebase functions
vi.mock('firebase/firestore');

describe('Enhanced Trade Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should integrate all services for complete trade analysis', () => {
    // Mock trade data with minimal required fields
    const mockTrade = {
      id: 'test-trade-1',
      currencyPair: 'EURUSD',
      side: 'long' as const,
      entryPrice: 1.1000,
      exitPrice: 1.1050,
      lotSize: 1.0,
      pnl: 50,
      status: 'closed' as const,
      date: '2024-01-15',
      timeIn: '09:00',
      timeOut: '10:30',
      accountId: 'test-account',
      lotType: 'standard' as const,
      units: 100000,
      commission: 0,
      accountCurrency: 'USD',
      partialCloses: [
        {
          id: 'pc-1',
          timestamp: '2024-01-15T09:30:00Z',
          lotSize: 0.3,
          price: 1.1025,
          reason: 'profit_taking' as any,
          remainingLots: 0.7,
          pnlRealized: 7.5
        }
      ]
    };

    // Test position management service
    const positionSummary = positionManagementService.calculateRemainingPosition(mockTrade);
    expect(positionSummary.totalLots).toBe(0.7);
    expect(positionSummary.realizedPnL).toBe(7.5);

    const positionScore = positionManagementService.calculatePositionManagementScore(mockTrade);
    expect(positionScore).toBeGreaterThanOrEqual(0);
    expect(positionScore).toBeLessThanOrEqual(100);

    // Test timeline generation
    const timeline = positionManagementService.generatePositionTimeline(mockTrade);
    expect(timeline.length).toBeGreaterThan(2); // Entry + partial + exit
    expect(timeline.some(event => event.type === 'entry')).toBe(true);
    expect(timeline.some(event => event.type === 'partial_close')).toBe(true);
  });

  it('should handle performance calculations across services', () => {
    const mockTrades = [
      {
        id: 'trade-1',
        currencyPair: 'EURUSD',
        side: 'long' as const,
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lotSize: 1.0,
        pnl: 50,
        status: 'closed' as const,
        date: '2024-01-15',
        accountId: 'test-account',
        lotType: 'standard' as const,
        units: 100000,
        commission: 0,
        accountCurrency: 'USD',
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:30:00Z',
            lotSize: 0.3,
            price: 1.1025,
            reason: 'profit_taking' as any,
            remainingLots: 0.7,
            pnlRealized: 15.0
          }
        ]
      }
    ];

    // Position management analytics
    const exitAnalytics = positionManagementService.calculateExitEfficiency(mockTrades);
    expect(exitAnalytics.averageExitEfficiency).toBeGreaterThan(0);
    expect(exitAnalytics.partialCloseSuccess).toBeGreaterThanOrEqual(0);
    expect(exitAnalytics.partialCloseSuccess).toBeLessThanOrEqual(100);
  });

  it('should handle error cases gracefully', () => {
    const invalidTrade = {
      id: 'invalid-trade',
      currencyPair: 'EURUSD',
      side: 'long' as const,
      entryPrice: 1.1000,
      lotSize: 1.0,
      status: 'closed' as const,
      date: '2024-01-15',
      accountId: 'test-account',
      lotType: 'standard' as const,
      units: 100000,
      commission: 0,
      accountCurrency: 'USD'
    };

    // Services should handle invalid/incomplete data gracefully
    expect(() => {
      positionManagementService.calculateRemainingPosition(invalidTrade);
    }).not.toThrow();

    expect(() => {
      positionManagementService.generatePositionTimeline(invalidTrade);
    }).not.toThrow();
  });

  it('should handle large datasets efficiently', () => {
    const largeTrades = Array(20).fill(0).map((_, i) => ({
      id: `trade-${i}`,
      currencyPair: 'EURUSD',
      side: 'long' as const,
      entryPrice: 1.1000,
      exitPrice: 1.1050,
      lotSize: 1.0,
      pnl: Math.random() * 100 - 50,
      status: 'closed' as const,
      date: '2024-01-15',
      accountId: 'test-account',
      lotType: 'standard' as const,
      units: 100000,
      commission: 0,
      accountCurrency: 'USD'
    }));

    const startTime = performance.now();

    // Test position management with large dataset
    const exitAnalytics = positionManagementService.calculateExitEfficiency(largeTrades);

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Verify results
    expect(exitAnalytics.averageExitEfficiency).toBe(0); // No partial closes in test data
    expect(exitAnalytics.partialCloseSuccess).toBe(0);

    // Performance should be reasonable
    expect(executionTime).toBeLessThan(100); // Less than 100ms for 20 trades
  });
});
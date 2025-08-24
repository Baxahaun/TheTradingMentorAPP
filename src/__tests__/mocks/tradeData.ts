/**
 * Mock Trade Data for Testing
 */

import { Trade } from '../../types/trade';

export const mockTrades: Trade[] = [
  {
    id: 'trade-1',
    accountId: 'account-1',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '10:30',
    timeOut: '14:45',
    timestamp: new Date('2024-01-15T10:30:00Z').getTime(),
    side: 'long',
    direction: 'long',
    entryPrice: 1.0850,
    exitPrice: 1.0920,
    lotSize: 1.0,
    lotType: 'standard' as const,
    units: 100000,
    status: 'closed',
    pnl: 700,
    commission: 5,
    swap: 0,
    notes: 'Strong bullish setup with clear support levels',
    tags: ['breakout', 'trend-following', 'high-probability'],
    strategy: 'Trend Following',
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    accountCurrency: 'USD',
    charts: [
      {
        id: 'chart-1',
        url: 'https://example.com/chart1.png',
        type: 'entry',
        timeframe: '1H',
        uploadedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'chart-2',
        url: 'https://example.com/chart2.png',
        type: 'exit',
        timeframe: '1H',
        uploadedAt: '2024-01-15T14:45:00Z',
      },
    ],
    reviewData: {
      notes: {
        preTradeAnalysis: 'Strong bullish momentum with breakout above resistance',
        executionNotes: 'Entry executed at planned level with good timing',
        postTradeReflection: 'Trade went as expected, good risk management',
        lessonsLearned: 'Patience in waiting for setup paid off',
        generalNotes: 'Excellent trade execution overall',
        lastModified: '2024-01-15T15:00:00Z',
        version: 1,
      },
      performanceMetrics: {
        rMultiple: 2.5,
        returnPercentage: 0.65,
        riskRewardRatio: 2.5,
        holdDuration: 255, // minutes
        efficiency: 0.85,
      },
      lastReviewedAt: '2024-01-15T15:00:00Z',
      reviewCompletionScore: 95,
    },
  },
  {
    id: 'trade-2',
    accountId: 'account-1',
    currencyPair: 'GBP/USD',
    date: '2024-01-16',
    timeIn: '08:15',
    timeOut: '16:30',
    timestamp: new Date('2024-01-16T08:15:00Z').getTime(),
    side: 'short',
    direction: 'short',
    entryPrice: 1.2650,
    exitPrice: 1.2580,
    lotSize: 0.5,
    lotType: 'standard' as const,
    units: 50000,
    status: 'closed',
    pnl: -350,
    commission: 3,
    swap: -2,
    notes: 'Failed breakout trade, stopped out',
    tags: ['failed-breakout', 'stop-loss', 'learning'],
    strategy: 'Breakout',
    stopLoss: 1.2700,
    takeProfit: 1.2550,
    accountCurrency: 'USD',
    charts: [
      {
        id: 'chart-3',
        url: 'https://example.com/chart3.png',
        type: 'analysis',
        timeframe: '4H',
        uploadedAt: '2024-01-16T08:00:00Z',
      },
    ],
    reviewData: {
      notes: {
        preTradeAnalysis: 'Breakout setup looked promising but failed',
        executionNotes: 'Entry was good, but market reversed quickly',
        postTradeReflection: 'Stop loss worked as intended',
        lessonsLearned: 'Need to be more selective with breakout trades',
        generalNotes: 'Good risk management despite loss',
        lastModified: '2024-01-16T17:00:00Z',
        version: 1,
      },
      performanceMetrics: {
        rMultiple: -1.0,
        returnPercentage: -0.55,
        riskRewardRatio: 2.0,
        holdDuration: 495, // minutes
        efficiency: 0.45,
      },
      lastReviewedAt: '2024-01-16T17:00:00Z',
      reviewCompletionScore: 88,
    },
  },
  {
    id: 'trade-3',
    accountId: 'account-1',
    currencyPair: 'USD/JPY',
    date: '2024-01-17',
    timeIn: '12:00',
    timeOut: undefined,
    timestamp: new Date('2024-01-17T12:00:00Z').getTime(),
    side: 'long',
    direction: 'long',
    entryPrice: 148.50,
    exitPrice: undefined,
    lotSize: 0.75,
    lotType: 'standard' as const,
    units: 75000,
    status: 'open',
    pnl: 225, // unrealized
    commission: 4,
    swap: 1,
    notes: 'Currently in profit, monitoring for exit',
    tags: ['trend-following', 'open-position', 'monitoring'],
    strategy: 'Trend Following',
    stopLoss: 147.00,
    takeProfit: 152.00,
    accountCurrency: 'USD',
    charts: [
      {
        id: 'chart-4',
        url: 'https://example.com/chart4.png',
        type: 'entry',
        timeframe: '1H',
        uploadedAt: '2024-01-17T12:00:00Z',
      },
    ],
    reviewData: {
      notes: {
        preTradeAnalysis: 'Strong uptrend continuation setup',
        executionNotes: 'Good entry at support level',
        postTradeReflection: '',
        lessonsLearned: '',
        generalNotes: 'Trade still active, monitoring closely',
        lastModified: '2024-01-17T12:30:00Z',
        version: 1,
      },
      performanceMetrics: {
        rMultiple: 0.5, // current unrealized
        returnPercentage: 0.30,
        riskRewardRatio: 3.0,
        holdDuration: 0, // still open
        efficiency: 0.75,
      },
      lastReviewedAt: '2024-01-17T12:30:00Z',
      reviewCompletionScore: 60, // incomplete as trade is still open
    },
  },
];

export const mockTradeWithLargeNotes: Trade = {
  ...mockTrades[0],
  id: 'trade-large-notes',
  notes: 'A'.repeat(10000), // 10KB of notes for performance testing
};

export const mockTradeWithManyTags: Trade = {
  ...mockTrades[0],
  id: 'trade-many-tags',
  tags: Array.from({ length: 50 }, (_, i) => `tag-${i}`),
};

export const mockTradeWithManyCharts: Trade = {
  ...mockTrades[0],
  id: 'trade-many-charts',
  charts: Array.from({ length: 20 }, (_, i) => ({
    id: `chart-${i}`,
    url: `https://example.com/chart-${i}.png`,
    type: 'analysis' as const,
    timeframe: '1H',
    uploadedAt: new Date().toISOString(),
  })),
};

export default mockTrades;
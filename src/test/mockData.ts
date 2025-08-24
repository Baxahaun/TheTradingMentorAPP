import { Trade } from '../types/trade';

export const mockTrade: Trade = {
  id: 'test-trade-1',
  currencyPair: 'EUR/USD',
  side: 'long',
  entryPrice: 1.1000,
  exitPrice: 1.1050,
  quantity: 100000,
  entryTime: '2024-01-15T10:00:00Z',
  exitTime: '2024-01-15T14:00:00Z',
  status: 'closed',
  pnl: 500,
  commission: 10,
  swap: 0,
  notes: 'Test trade notes',
  tags: ['breakout', 'trend-following'],
  strategy: 'Trend Following',
  riskReward: 2.5,
  stopLoss: 1.0950,
  takeProfit: 1.1100,
  maxDrawdown: 25,
  createdAt: '2024-01-15T09:30:00Z',
  updatedAt: '2024-01-15T14:30:00Z'
};
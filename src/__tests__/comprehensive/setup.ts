import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
}));

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock canvas for chart testing
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global test setup
beforeAll(() => {
  // Set up any global test state
});

afterAll(() => {
  // Clean up global test state
});

// Export test utilities
export const createMockStrategy = () => ({
  id: 'test-strategy-1',
  title: 'Test Strategy',
  description: 'A test strategy for unit testing',
  color: '#3B82F6',
  methodology: 'Technical' as const,
  primaryTimeframe: '1H',
  assetClasses: ['Forex'],
  setupConditions: {
    marketEnvironment: 'Trending market',
    technicalConditions: ['RSI oversold', 'Support level hold'],
    volatilityRequirements: 'Medium volatility',
  },
  entryTriggers: {
    primarySignal: 'Bullish engulfing candle',
    confirmationSignals: ['Volume spike', 'MACD crossover'],
    timingCriteria: 'Market open',
  },
  riskManagement: {
    positionSizingMethod: {
      type: 'FixedPercentage' as const,
      parameters: { percentage: 2 },
    },
    maxRiskPerTrade: 2,
    stopLossRule: {
      type: 'ATRBased' as const,
      parameters: { multiplier: 2 },
      description: '2x ATR stop loss',
    },
    takeProfitRule: {
      type: 'RiskRewardRatio' as const,
      parameters: { ratio: 2 },
      description: '1:2 risk reward ratio',
    },
    riskRewardRatio: 2,
  },
  performance: {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    profitFactor: 0,
    expectancy: 0,
    winRate: 0,
    averageWin: 0,
    averageLoss: 0,
    riskRewardRatio: 2,
    maxDrawdown: 0,
    maxDrawdownDuration: 0,
    sampleSize: 0,
    confidenceLevel: 0,
    statisticallySignificant: false,
    monthlyReturns: [],
    performanceTrend: 'Insufficient Data' as const,
    lastCalculated: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
  isActive: true,
});

export const createMockTrade = () => ({
  id: 'test-trade-1',
  symbol: 'EURUSD',
  type: 'buy' as const,
  entryPrice: 1.1000,
  exitPrice: 1.1100,
  quantity: 10000,
  entryTime: new Date().toISOString(),
  exitTime: new Date().toISOString(),
  pnl: 100,
  commission: 5,
  notes: 'Test trade',
  strategyId: 'test-strategy-1',
});

export const createMockPerformanceData = () => ({
  totalTrades: 50,
  winningTrades: 30,
  losingTrades: 20,
  profitFactor: 1.5,
  expectancy: 25,
  winRate: 60,
  averageWin: 150,
  averageLoss: 100,
  riskRewardRatio: 1.5,
  maxDrawdown: 500,
  maxDrawdownDuration: 7,
  sampleSize: 50,
  confidenceLevel: 95,
  statisticallySignificant: true,
  monthlyReturns: [
    { month: '2024-01', return: 250, trades: 10, winRate: 70 },
    { month: '2024-02', return: 180, trades: 12, winRate: 58 },
  ],
  performanceTrend: 'Improving' as const,
  lastCalculated: new Date().toISOString(),
});
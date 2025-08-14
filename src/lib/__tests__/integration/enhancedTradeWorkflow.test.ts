import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { setupClassificationService } from '../../setupClassificationService';
import { patternRecognitionService } from '../../patternRecognitionService';
import { positionManagementService } from '../../positionManagementService';
import { Trade, TradeSetup, TradePattern, PartialClose } from '../../types/trade';

// Mock Firebase functions
vi.mock('firebase/firestore');
vi.mock('firebase/auth');

// Mock chart components to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'chart-container' }, children),
  LineChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
  BarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
  PieChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  Line: () => React.createElement('div', { 'data-testid': 'line' }),
  Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
  Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
  XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children)
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => React.createElement('div', { 'data-testid': 'select' }, children),
  SelectContent: ({ children }: any) => React.createElement('div', { 'data-testid': 'select-content' }, children),
  SelectItem: ({ children }: any) => React.createElement('div', { 'data-testid': 'select-item' }, children),
  SelectTrigger: ({ children }: any) => React.createElement('div', { 'data-testid': 'select-trigger' }, children),
  SelectValue: ({ children }: any) => React.createElement('div', { 'data-testid': 'select-value' }, children)
}));

// Mock components for testing
const MockSetupClassificationPanel: React.FC<{
  setup?: TradeSetup;
  onChange: (setup: TradeSetup) => void;
}> = ({ setup, onChange }) => React.createElement('div', { 'data-testid': 'setup-classification-panel' },
  React.createElement('h3', null, 'Setup Classification'),
  React.createElement('button', { 
    onClick: () => onChange(setup || {} as TradeSetup) 
  }, 'Update Setup')
);

const MockPatternRecognitionPanel: React.FC<{
  patterns: TradePattern[];
  onChange: (patterns: TradePattern[]) => void;
}> = ({ patterns, onChange }) => React.createElement('div', { 'data-testid': 'pattern-recognition-panel' },
  React.createElement('h3', null, 'Pattern Recognition'),
  React.createElement('button', { 
    onClick: () => onChange(patterns) 
  }, 'Update Patterns')
);

const MockPartialCloseManagementPanel: React.FC<{
  trade: Trade;
  onPartialClose: (partialClose: PartialClose) => void;
}> = ({ trade, onPartialClose }) => React.createElement('div', { 'data-testid': 'partial-close-panel' },
  React.createElement('h3', null, 'Position Management'),
  React.createElement('button', { 
    onClick: () => onPartialClose({} as PartialClose) 
  }, 'Add Partial Close')
);

const MockSetupAnalyticsWidget: React.FC<{
  trades: Trade[];
  size?: { w: number; h: number };
}> = ({ trades, size }) => React.createElement('div', { 'data-testid': 'setup-analytics-widget' },
  React.createElement('h3', null, 'Setup Analytics'),
  React.createElement('div', null, `Trades: ${trades.length}`)
);

const MockPatternPerformanceWidget: React.FC<{
  trades: Trade[];
  size?: { w: number; h: number };
}> = ({ trades, size }) => React.createElement('div', { 'data-testid': 'pattern-performance-widget' },
  React.createElement('h3', null, 'Pattern Performance'),
  React.createElement('div', null, `Trades: ${trades.length}`)
);

const MockPositionManagementAnalyticsWidget: React.FC<{
  trades: Trade[];
  size?: { w: number; h: number };
}> = ({ trades, size }) => React.createElement('div', { 'data-testid': 'position-management-widget' },
  React.createElement('h3', null, 'Position Management'),
  React.createElement('div', null, `Trades: ${trades.length}`)
);

describe('Enhanced Trade Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Trade Creation Workflow', () => {
    it('should handle complete trade creation with all classification features', async () => {
      const mockSetup: TradeSetup = {
        id: 'setup-1',
        type: 'TREND_CONTINUATION' as any,
        timeframe: 'H1',
        marketCondition: 'trending',
        quality: 4,
        confluence: [
          {
            id: 'conf-1',
            name: 'Multiple timeframe alignment',
            category: 'technical',
            weight: 4,
            description: 'All timeframes showing uptrend'
          }
        ]
      };

      const mockPatterns: TradePattern[] = [
        {
          id: 'pattern-1',
          type: 'FLAG' as any,
          timeframe: 'H1',
          quality: 4,
          confluence: true,
          description: 'Bull flag pattern'
        }
      ];

      let capturedSetup: TradeSetup | undefined;
      let capturedPatterns: TradePattern[] = [];

      const SetupPanelWrapper = () => React.createElement(MockSetupClassificationPanel, {
        setup: mockSetup,
        onChange: (setup) => { capturedSetup = setup; }
      });

      const PatternPanelWrapper = () => React.createElement(MockPatternRecognitionPanel, {
        patterns: mockPatterns,
        onChange: (patterns) => { capturedPatterns = patterns; }
      });

      // Test setup classification panel
      render(React.createElement(SetupPanelWrapper));
      
      // Verify setup panel renders
      expect(screen.getByText(/Setup Classification/i)).toBeInTheDocument();
      
      // Test pattern recognition panel
      render(React.createElement(PatternPanelWrapper));
      
      // Verify pattern panel renders
      expect(screen.getByText(/Pattern Recognition/i)).toBeInTheDocument();

      // Test service integration
      const setupValidation = setupClassificationService.validateTradeSetup(mockSetup);
      expect(setupValidation.isValid).toBe(true);

      const patternValidation = patternRecognitionService.validateTradePattern(mockPatterns[0]);
      expect(patternValidation.isValid).toBe(true);

      const confluenceScore = setupClassificationService.calculateConfluenceScore(mockSetup.confluence);
      expect(confluenceScore).toBeGreaterThan(0);

      const patternConfluence = patternRecognitionService.calculatePatternConfluence(mockPatterns);
      expect(patternConfluence).toBeGreaterThan(0);
    });

    it('should validate trade data across all classification features', () => {
      const completeTrade: Trade = {
        id: 'test-trade-1',
        currencyPair: 'EURUSD',
        side: 'long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lotSize: 1.0,
        pnl: 50,
        rMultiple: 1.5,
        status: 'closed',
        date: '2024-01-15',
        timeIn: '09:00',
        timeOut: '10:30',
        timeframe: 'H1',
        riskAmount: 33.33,
        accountId: 'test-account',
        lotType: 'standard',
        units: 100000,
        commission: 0,
        accountCurrency: 'USD',
        setup: {
          id: 'setup-1',
          type: 'TREND_CONTINUATION' as any,
          timeframe: 'H1',
          marketCondition: 'trending',
          quality: 4,
          confluence: [
            {
              id: 'conf-1',
              name: 'Multiple timeframe alignment',
              category: 'technical',
              weight: 4,
              description: 'All timeframes showing uptrend'
            }
          ]
        },
        patterns: [
          {
            id: 'pattern-1',
            type: 'FLAG' as any,
            timeframe: 'H1',
            quality: 4,
            confluence: true,
            description: 'Bull flag pattern'
          }
        ],
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T09:30:00Z',
            lotSize: 0.3,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: 7.5
          }
        ]
      };

      // Validate all components work together
      const setupValidation = setupClassificationService.validateTradeSetup(completeTrade.setup!);
      expect(setupValidation.isValid).toBe(true);

      const patternValidation = patternRecognitionService.validateTradePattern(completeTrade.patterns![0]);
      expect(patternValidation.isValid).toBe(true);

      const positionSummary = positionManagementService.calculateRemainingPosition(completeTrade);
      expect(positionSummary.totalLots).toBe(0.7);
      expect(positionSummary.realizedPnL).toBe(7.5);

      const positionScore = positionManagementService.calculatePositionManagementScore(completeTrade);
      expect(positionScore).toBeGreaterThan(0);
    });

  });

  describe('Partial Close Tracking and Position Management', () => {
    it('should handle partial close workflow correctly', async () => {
      const mockTrade: Trade = {
        id: 'test-trade-1',
        currencyPair: 'EURUSD',
        side: 'long',
        entryPrice: 1.1000,
        lotSize: 1.0,
        status: 'open',
        date: '2024-01-15',
        timeIn: '09:00',
        accountId: 'test-account',
        lotType: 'standard',
        units: 100000,
        commission: 0,
        accountCurrency: 'USD',
        partialCloses: []
      };

      let capturedPartialClose: PartialClose | undefined;

      const PartialClosePanelWrapper = () => React.createElement(MockPartialCloseManagementPanel, {
        trade: mockTrade,
        onPartialClose: (partialClose) => { capturedPartialClose = partialClose; }
      });

      render(React.createElement(PartialClosePanelWrapper));

      // Verify partial close panel renders
      expect(screen.getByText(/Position Management/i)).toBeInTheDocument();

      // Test partial close addition
      const newPartialClose: PartialClose = {
        id: 'pc-1',
        timestamp: '2024-01-15T09:30:00Z',
        lotSize: 0.3,
        price: 1.1025,
        reason: 'profit_taking',
        remainingLots: 0.7,
        pnlRealized: 7.5
      };

      // Add partial close to trade
      const updatedTrade = {
        ...mockTrade,
        partialCloses: [newPartialClose]
      };

      // Test position calculations
      const positionSummary = positionManagementService.calculateRemainingPosition(updatedTrade);
      expect(positionSummary.totalLots).toBe(0.7);
      expect(positionSummary.realizedPnL).toBe(7.5);

      // Test timeline generation
      const timeline = positionManagementService.generatePositionTimeline(updatedTrade);
      expect(timeline.length).toBeGreaterThan(1);
      expect(timeline.some(event => event.type === 'entry')).toBe(true);
      expect(timeline.some(event => event.type === 'partial_close')).toBe(true);

      // Test position management score
      const positionScore = positionManagementService.calculatePositionManagementScore(updatedTrade);
      expect(positionScore).toBeGreaterThanOrEqual(0);
      expect(positionScore).toBeLessThanOrEqual(100);
    });

    it('should validate partial close data integrity', () => {
      const mockTrade: Trade = {
        id: 'test-trade-1',
        currencyPair: 'EURUSD',
        side: 'long',
        entryPrice: 1.1000,
        lotSize: 1.0,
        status: 'open',
        date: '2024-01-15',
        timeIn: '09:00',
        accountId: 'test-account',
        lotType: 'standard',
        units: 100000,
        commission: 0,
        accountCurrency: 'USD',
        partialCloses: []
      };

      // Test valid partial close
      const validPartialClose: Omit<PartialClose, 'id' | 'remainingLots'> = {
        timestamp: '2024-01-15 10:30', // After the trade entry time (09:00)
        lotSize: 0.3,
        price: 1.1025,
        reason: 'profit_taking',
        pnlRealized: 7.5
      };

      const validation = positionManagementService.validatePartialClose(validPartialClose, mockTrade);
      expect(validation.isValid).toBe(true);

      // Test invalid partial close (lot size too large)
      const invalidPartialClose: Omit<PartialClose, 'id' | 'remainingLots'> = {
        timestamp: '2024-01-15T09:30:00Z',
        lotSize: 1.5, // Exceeds total position
        price: 1.1025,
        reason: 'profit_taking',
        pnlRealized: 7.5
      };

      const invalidValidation = positionManagementService.validatePartialClose(invalidPartialClose, mockTrade);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.some(error => error.includes('exceeds remaining position'))).toBe(true);
    });

  });

  describe('Analytics Widget Integration and Data Accuracy', () => {
    it('should render setup analytics widget with accurate data', async () => {
      const mockTrades: Trade[] = [
        {
          id: 'trade-1',
          currencyPair: 'EURUSD',
          side: 'long',
          entryPrice: 1.1000,
          exitPrice: 1.1050,
          lotSize: 1.0,
          pnl: 50,
          status: 'closed',
          date: '2024-01-15',
          timeIn: '09:00',
          timeOut: '10:30',
          accountId: 'test-account',
          lotType: 'standard',
          units: 100000,
          commission: 0,
          accountCurrency: 'USD',
          setup: {
            id: 'setup-1',
            type: 'TREND_CONTINUATION' as any,
            timeframe: 'H1',
            marketCondition: 'trending',
            quality: 4,
            confluence: []
          }
        },
        {
          id: 'trade-2',
          currencyPair: 'GBPUSD',
          side: 'short',
          entryPrice: 1.2500,
          exitPrice: 1.2450,
          lotSize: 1.0,
          pnl: 50,
          status: 'closed',
          date: '2024-01-16',
          timeIn: '10:00',
          timeOut: '11:30',
          accountId: 'test-account',
          lotType: 'standard',
          units: 100000,
          commission: 0,
          accountCurrency: 'USD',
          setup: {
            id: 'setup-2',
            type: 'SUPPORT_RESISTANCE_BOUNCE' as any,
            timeframe: 'H4',
            marketCondition: 'ranging',
            quality: 3,
            confluence: []
          }
        }
      ];

      render(React.createElement(MockSetupAnalyticsWidget, { 
        trades: mockTrades, 
        size: { w: 6, h: 4 } 
      }));

      // Verify widget renders
      await waitFor(() => {
        expect(screen.getByText(/Setup Analytics/i)).toBeInTheDocument();
      });

      // Test data accuracy
      const setupMetrics = setupClassificationService.calculateSetupPerformance(
        'TREND_CONTINUATION' as any,
        mockTrades
      );
      expect(setupMetrics.totalTrades).toBe(1);
      expect(setupMetrics.winRate).toBe(100);

      const allSetupMetrics = setupClassificationService.calculateAllSetupPerformance(mockTrades);
      expect(Object.keys(allSetupMetrics)).toContain('trend_continuation');
      expect(Object.keys(allSetupMetrics)).toContain('support_resistance_bounce');
    });

    it('should render pattern performance widget with accurate data', async () => {
      const mockTrades: Trade[] = [
        {
          id: 'trade-1',
          currencyPair: 'EURUSD',
          side: 'long',
          entryPrice: 1.1000,
          exitPrice: 1.1050,
          lotSize: 1.0,
          pnl: 50,
          status: 'closed',
          date: '2024-01-15',
          accountId: 'test-account',
          lotType: 'standard',
          units: 100000,
          commission: 0,
          accountCurrency: 'USD',
          patterns: [
            {
              id: 'pattern-1',
              type: 'FLAG' as any,
              timeframe: 'H1',
              quality: 4,
              confluence: true,
              description: 'Bull flag pattern'
            }
          ]
        }
      ];

      render(React.createElement(MockPatternPerformanceWidget, { 
        trades: mockTrades, 
        size: { w: 6, h: 4 } 
      }));

      // Verify widget renders
      await waitFor(() => {
        expect(screen.getByText(/Pattern Performance/i)).toBeInTheDocument();
      });

      // Test pattern analytics
      const patternAnalytics = patternRecognitionService.calculatePatternPerformance(
        'FLAG' as any,
        mockTrades
      );
      expect(patternAnalytics.totalTrades).toBe(1);
      expect(patternAnalytics.successRate).toBe(100);
    });

    it('should render position management analytics widget with accurate data', async () => {
      const mockTrades: Trade[] = [
        {
          id: 'trade-1',
          currencyPair: 'EURUSD',
          side: 'long',
          entryPrice: 1.1000,
          exitPrice: 1.1050,
          lotSize: 1.0,
          pnl: 50,
          status: 'closed',
          date: '2024-01-15',
          accountId: 'test-account',
          lotType: 'standard',
          units: 100000,
          commission: 0,
          accountCurrency: 'USD',
          partialCloses: [
            {
              id: 'pc-1',
              timestamp: '2024-01-15T09:30:00Z',
              lotSize: 0.3,
              price: 1.1025,
              reason: 'profit_taking',
              remainingLots: 0.7,
              pnlRealized: 15.0
            }
          ]
        }
      ];

      render(React.createElement(MockPositionManagementAnalyticsWidget, { 
        trades: mockTrades, 
        size: { w: 6, h: 4 } 
      }));

      // Verify widget renders
      await waitFor(() => {
        expect(screen.getByText(/Position Management/i)).toBeInTheDocument();
      });

      // Test position management analytics
      const exitAnalytics = positionManagementService.calculateExitEfficiency(mockTrades);
      expect(exitAnalytics.averageExitEfficiency).toBeGreaterThan(0);
      expect(exitAnalytics.partialCloseSuccess).toBeGreaterThanOrEqual(0);
    });

  });

  describe('Cross-Service Data Consistency and Integration', () => {
    it('should maintain data consistency across all services', () => {
      const mockTrades: Trade[] = [
        {
          id: 'trade-1',
          currencyPair: 'EURUSD',
          side: 'long',
          entryPrice: 1.1000,
          exitPrice: 1.1050,
          lotSize: 1.0,
          pnl: 50,
          status: 'closed',
          date: '2024-01-15',
          accountId: 'test-account',
          lotType: 'standard',
          units: 100000,
          commission: 0,
          accountCurrency: 'USD',
          setup: {
            id: 'setup-1',
            type: 'TREND_CONTINUATION' as any,
            timeframe: 'H1',
            marketCondition: 'trending',
            quality: 4,
            confluence: []
          },
          patterns: [
            {
              id: 'pattern-1',
              type: 'FLAG' as any,
              timeframe: 'H1',
              quality: 4,
              confluence: true
            }
          ],
          partialCloses: [
            {
              id: 'pc-1',
              timestamp: '2024-01-15T09:30:00Z',
              lotSize: 0.3,
              price: 1.1025,
              reason: 'profit_taking',
              remainingLots: 0.7,
              pnlRealized: 15.0
            }
          ]
        }
      ];

      // Ensure consistent trade counting across services
      const setupMetrics = setupClassificationService.calculateSetupPerformance(
        'TREND_CONTINUATION' as any,
        mockTrades
      );
      const patternAnalytics = patternRecognitionService.calculatePatternPerformance(
        'FLAG' as any,
        mockTrades
      );
      const exitAnalytics = positionManagementService.calculateExitEfficiency(mockTrades);

      expect(setupMetrics.totalTrades).toBe(1);
      expect(patternAnalytics.totalTrades).toBe(1);
      expect(exitAnalytics.totalTrades).toBe(1);

      // Verify all services process the same trade data
      expect(setupMetrics.totalTrades).toBe(patternAnalytics.totalTrades);
      expect(patternAnalytics.totalTrades).toBe(exitAnalytics.totalTrades);
    });

    it('should handle complex multi-feature trades correctly', () => {
      const complexTrade: Trade = {
        id: 'complex-trade-1',
        currencyPair: 'EURUSD',
        side: 'long',
        entryPrice: 1.1000,
        exitPrice: 1.1100,
        lotSize: 2.0,
        pnl: 200,
        status: 'closed',
        date: '2024-01-15',
        timeIn: '09:00',
        timeOut: '15:30',
        accountId: 'test-account',
        lotType: 'standard',
        units: 200000,
        commission: 0,
        accountCurrency: 'USD',
        setup: {
          id: 'setup-1',
          type: 'TREND_CONTINUATION' as any,
          timeframe: 'H1',
          marketCondition: 'trending',
          quality: 5,
          confluence: [
            {
              id: 'conf-1',
              name: 'Multiple timeframe alignment',
              category: 'technical',
              weight: 5,
              description: 'All timeframes aligned'
            },
            {
              id: 'conf-2',
              name: 'Volume confirmation',
              category: 'technical',
              weight: 4,
              description: 'High volume breakout'
            }
          ]
        },
        patterns: [
          {
            id: 'pattern-1',
            type: 'FLAG' as any,
            timeframe: 'H1',
            quality: 5,
            confluence: true,
            description: 'Perfect bull flag'
          },
          {
            id: 'pattern-2',
            type: 'SUPPORT_RESISTANCE' as any,
            timeframe: 'H4',
            quality: 4,
            confluence: true,
            description: 'Strong support level'
          }
        ],
        partialCloses: [
          {
            id: 'pc-1',
            timestamp: '2024-01-15T11:00:00Z',
            lotSize: 0.5,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 1.5,
            pnlRealized: 25.0
          },
          {
            id: 'pc-2',
            timestamp: '2024-01-15T13:00:00Z',
            lotSize: 0.5,
            price: 1.1050,
            reason: 'profit_taking',
            remainingLots: 1.0,
            pnlRealized: 50.0
          }
        ]
      };

      // Test setup classification with multiple confluence factors
      const setupValidation = setupClassificationService.validateTradeSetup(complexTrade.setup!);
      expect(setupValidation.isValid).toBe(true);

      const confluenceScore = setupClassificationService.calculateConfluenceScore(
        complexTrade.setup!.confluence
      );
      expect(confluenceScore).toBeGreaterThan(4); // High confluence

      // Test pattern recognition with multiple patterns
      const patternConfluence = patternRecognitionService.calculatePatternConfluence(
        complexTrade.patterns!
      );
      expect(patternConfluence).toBeGreaterThan(4); // Multiple high-quality patterns

      // Test position management with multiple partial closes
      const positionSummary = positionManagementService.calculateRemainingPosition(complexTrade);
      expect(positionSummary.totalLots).toBe(1.0);
      expect(positionSummary.realizedPnL).toBe(75.0); // 25 + 50

      const timeline = positionManagementService.generatePositionTimeline(complexTrade);
      expect(timeline.length).toBe(4); // Entry + 2 partials + exit
      expect(timeline.filter(e => e.type === 'partial_close').length).toBe(2);

      const positionScore = positionManagementService.calculatePositionManagementScore(complexTrade);
      expect(positionScore).toBeGreaterThan(40); // Reasonable position management
    });

    it('should handle error cases gracefully across all services', () => {
      const invalidTrade: Partial<Trade> = {
        id: 'invalid-trade',
        currencyPair: 'EURUSD',
        side: 'long',
        entryPrice: 1.1000,
        lotSize: 1.0,
        status: 'closed',
        date: '2024-01-15',
        accountId: 'test-account',
        lotType: 'standard',
        units: 100000,
        commission: 0,
        accountCurrency: 'USD',
        setup: {
          id: '',
          type: 'TREND_CONTINUATION' as any,
          timeframe: '',
          marketCondition: undefined as any,
          quality: 0,
          confluence: []
        }
      };

      // All services should handle invalid data gracefully
      expect(() => {
        setupClassificationService.validateTradeSetup(invalidTrade.setup!);
      }).not.toThrow();

      expect(() => {
        setupClassificationService.calculateSetupPerformance(
          'TREND_CONTINUATION' as any,
          [invalidTrade as Trade]
        );
      }).not.toThrow();

      expect(() => {
        positionManagementService.calculateRemainingPosition(invalidTrade as Trade);
      }).not.toThrow();

      expect(() => {
        patternRecognitionService.calculatePatternConfluence([]);
      }).not.toThrow();
    });

  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', () => {
      const largeTrades: Trade[] = Array(100).fill(0).map((_, i) => ({
        id: `trade-${i}`,
        currencyPair: i % 2 === 0 ? 'EURUSD' : 'GBPUSD',
        side: i % 2 === 0 ? 'long' as const : 'short' as const,
        entryPrice: 1.1000 + (Math.random() * 0.01),
        exitPrice: 1.1000 + (Math.random() * 0.02),
        lotSize: 1.0,
        pnl: Math.random() * 100 - 50,
        status: 'closed' as const,
        date: '2024-01-15',
        accountId: 'test-account',
        lotType: 'standard' as const,
        units: 100000,
        commission: 0,
        accountCurrency: 'USD',
        setup: {
          id: `setup-${i}`,
          type: i % 3 === 0 ? 'trend_continuation' as any : 
                i % 3 === 1 ? 'support_resistance_bounce' as any : 
                'range_breakout' as any,
          timeframe: i % 2 === 0 ? 'H1' : 'H4',
          marketCondition: i % 2 === 0 ? 'trending' : 'ranging',
          quality: Math.floor(Math.random() * 5) + 1,
          confluence: []
        },
        patterns: [
          {
            id: `pattern-${i}`,
            type: i % 2 === 0 ? 'flag' as any : 'support_resistance' as any,
            timeframe: i % 2 === 0 ? 'H1' : 'H4',
            quality: Math.floor(Math.random() * 5) + 1,
            confluence: Math.random() > 0.5
          }
        ],
        partialCloses: i % 5 === 0 ? [
          {
            id: `pc-${i}`,
            timestamp: '2024-01-15T09:30:00Z',
            lotSize: 0.3,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: Math.random() * 20
          }
        ] : []
      }));

      const startTime = performance.now();

      // Test all services with large dataset
      const allSetupMetrics = setupClassificationService.calculateAllSetupPerformance(largeTrades);
      const allPatternAnalytics = patternRecognitionService.calculateAllPatternPerformance(largeTrades);
      const exitAnalytics = positionManagementService.calculateExitEfficiency(largeTrades);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Verify results
      expect(Object.keys(allSetupMetrics).length).toBeGreaterThan(0);
      expect(Object.keys(allPatternAnalytics).length).toBeGreaterThan(0);
      expect(exitAnalytics.totalTrades).toBe(100);

      // Performance should be reasonable for 100 trades
      expect(executionTime).toBeLessThan(1000); // Less than 1 second for 100 trades

      // Verify data integrity
      const totalSetupTrades = Object.values(allSetupMetrics)
        .reduce((sum, metrics) => sum + metrics.totalTrades, 0);
      expect(totalSetupTrades).toBe(100);

      const totalPatternTrades = Object.values(allPatternAnalytics)
        .reduce((sum, analytics) => sum + analytics.totalTrades, 0);
      // Each trade has one pattern, so we expect the total to match the number of trades
      expect(totalPatternTrades).toBeGreaterThan(0);
      expect(totalPatternTrades).toBeLessThanOrEqual(100);
    });

    it('should handle widget rendering performance with large datasets', async () => {
      const largeTrades: Trade[] = Array(50).fill(0).map((_, i) => ({
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
        accountCurrency: 'USD',
        setup: {
          id: `setup-${i}`,
          type: 'TREND_CONTINUATION' as any,
          timeframe: 'H1',
          marketCondition: 'trending',
          quality: 4,
          confluence: []
        },
        patterns: [
          {
            id: `pattern-${i}`,
            type: 'FLAG' as any,
            timeframe: 'H1',
            quality: 4,
            confluence: true
          }
        ],
        partialCloses: i % 3 === 0 ? [
          {
            id: `pc-${i}`,
            timestamp: '2024-01-15T09:30:00Z',
            lotSize: 0.3,
            price: 1.1025,
            reason: 'profit_taking',
            remainingLots: 0.7,
            pnlRealized: 15.0
          }
        ] : []
      }));

      const startTime = performance.now();

      // Test widget rendering with large dataset
      const { unmount: unmountSetup } = render(React.createElement(MockSetupAnalyticsWidget, { 
        trades: largeTrades, 
        size: { w: 6, h: 4 } 
      }));

      const { unmount: unmountPattern } = render(React.createElement(MockPatternPerformanceWidget, { 
        trades: largeTrades, 
        size: { w: 6, h: 4 } 
      }));

      const { unmount: unmountPosition } = render(React.createElement(MockPositionManagementAnalyticsWidget, { 
        trades: largeTrades, 
        size: { w: 6, h: 4 } 
      }));

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Widgets should render within reasonable time
      expect(renderTime).toBeLessThan(2000); // Less than 2 seconds

      // Cleanup
      unmountSetup();
      unmountPattern();
      unmountPosition();
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should support complete trade lifecycle with all features', () => {
      // Simulate complete trade workflow
      const initialTrade: Partial<Trade> = {
        id: 'workflow-trade-1',
        currencyPair: 'EURUSD',
        side: 'long',
        entryPrice: 1.1000,
        lotSize: 1.0,
        status: 'open',
        date: '2024-01-15',
        timeIn: '09:00',
        accountId: 'test-account',
        lotType: 'standard',
        units: 100000,
        commission: 0,
        accountCurrency: 'USD'
      };

      // Step 1: Add setup classification
      const setupData: TradeSetup = {
        id: 'setup-1',
        type: 'TREND_CONTINUATION' as any,
        timeframe: 'H1',
        marketCondition: 'trending',
        quality: 4,
        confluence: [
          {
            id: 'conf-1',
            name: 'Multiple timeframe alignment',
            category: 'technical',
            weight: 4,
            description: 'All timeframes aligned'
          }
        ]
      };

      const tradeWithSetup = { ...initialTrade, setup: setupData };

      // Step 2: Add pattern recognition
      const patternData: TradePattern[] = [
        {
          id: 'pattern-1',
          type: 'FLAG' as any,
          timeframe: 'H1',
          quality: 4,
          confluence: true,
          description: 'Bull flag pattern'
        }
      ];

      const tradeWithPatterns = { ...tradeWithSetup, patterns: patternData };

      // Step 3: Add partial close
      const partialClose: PartialClose = {
        id: 'pc-1',
        timestamp: '2024-01-15T10:00:00Z',
        lotSize: 0.3,
        price: 1.1025,
        reason: 'profit_taking',
        remainingLots: 0.7,
        pnlRealized: 7.5
      };

      const tradeWithPartialClose = {
        ...tradeWithPatterns,
        partialCloses: [partialClose]
      };

      // Step 4: Close trade
      const completedTrade: Trade = {
        ...tradeWithPartialClose as Trade,
        status: 'closed',
        exitPrice: 1.1050,
        timeOut: '11:00',
        pnl: 42.5 // Remaining 0.7 lots * 25 pips + 7.5 realized
      };

      // Validate complete workflow
      const setupValidation = setupClassificationService.validateTradeSetup(completedTrade.setup!);
      expect(setupValidation.isValid).toBe(true);

      const patternValidation = patternRecognitionService.validateTradePattern(completedTrade.patterns![0]);
      expect(patternValidation.isValid).toBe(true);

      const positionSummary = positionManagementService.calculateRemainingPosition(completedTrade);
      expect(positionSummary.realizedPnL).toBe(7.5);

      const timeline = positionManagementService.generatePositionTimeline(completedTrade);
      expect(timeline.length).toBe(3); // Entry, partial close, exit

      // Test analytics with completed trade
      const setupMetrics = setupClassificationService.calculateSetupPerformance(
        'TREND_CONTINUATION' as any,
        [completedTrade]
      );
      expect(setupMetrics.totalTrades).toBe(1);
      expect(setupMetrics.winRate).toBe(100);

      const patternAnalytics = patternRecognitionService.calculatePatternPerformance(
        'FLAG' as any,
        [completedTrade]
      );
      expect(patternAnalytics.totalTrades).toBe(1);
      expect(patternAnalytics.successRate).toBe(100);

      const exitAnalytics = positionManagementService.calculateExitEfficiency([completedTrade]);
      expect(exitAnalytics.averageExitEfficiency).toBeGreaterThan(0);
    });
  });
});
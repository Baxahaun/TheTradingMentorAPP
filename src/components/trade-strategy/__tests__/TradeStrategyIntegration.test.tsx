import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradeStrategyIntegration from '../TradeStrategyIntegration';
import { TradeWithStrategy } from '../../../types/trade';
import { ProfessionalStrategy } from '../../../types/strategy';
import { StrategyAttributionService } from '../../../services/StrategyAttributionService';
import { StrategyPerformanceService } from '../../../services/StrategyPerformanceService';

// Mock the services
vi.mock('../../../services/StrategyAttributionService');
vi.mock('../../../services/StrategyPerformanceService');

const mockTrade: TradeWithStrategy = {
  id: 'test-trade-1',
  accountId: 'test-account',
  currencyPair: 'EUR/USD',
  date: '2024-01-15',
  timeIn: '09:30',
  timestamp: Date.now(),
  side: 'long',
  entryPrice: 1.0950,
  exitPrice: 1.0980,
  lotSize: 1.0,
  lotType: 'standard',
  units: 100000,
  commission: 5.0,
  accountCurrency: 'USD',
  status: 'closed',
  pnl: 300,
  tags: ['breakout', 'trend-following']
};

const mockStrategy: ProfessionalStrategy = {
  id: 'strategy-1',
  title: 'Trend Following Strategy',
  description: 'A comprehensive trend following approach',
  color: '#3B82F6',
  methodology: 'Technical',
  primaryTimeframe: '1H',
  assetClasses: ['Forex'],
  setupConditions: {
    marketEnvironment: 'Trending market with clear direction',
    technicalConditions: ['Price above 20 EMA', 'RSI > 50'],
    volatilityRequirements: 'Medium to high volatility'
  },
  entryTriggers: {
    primarySignal: 'Breakout above resistance',
    confirmationSignals: ['Volume increase', 'Momentum confirmation'],
    timingCriteria: 'During active trading sessions'
  },
  riskManagement: {
    positionSizingMethod: {
      type: 'FixedPercentage',
      parameters: { percentage: 2 }
    },
    maxRiskPerTrade: 2,
    stopLossRule: {
      type: 'ATRBased',
      parameters: { atrMultiplier: 2, atrPeriod: 14 },
      description: '2x ATR stop loss'
    },
    takeProfitRule: {
      type: 'RiskRewardRatio',
      parameters: { ratio: 2 },
      description: '1:2 risk reward ratio'
    },
    riskRewardRatio: 2
  },
  performance: {
    totalTrades: 25,
    winningTrades: 15,
    losingTrades: 10,
    profitFactor: 1.8,
    expectancy: 45.5,
    winRate: 60,
    averageWin: 150,
    averageLoss: 75,
    riskRewardRatio: 2,
    maxDrawdown: 8.5,
    maxDrawdownDuration: 5,
    sampleSize: 25,
    confidenceLevel: 95,
    statisticallySignificant: false,
    monthlyReturns: [],
    performanceTrend: 'Improving',
    lastCalculated: '2024-01-15T10:00:00Z',
    calculationVersion: 1
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  version: 1,
  isActive: true
};

const mockStrategies = [mockStrategy];

describe('TradeStrategyIntegration', () => {
  const mockOnTradeChange = vi.fn();
  const mockOnNavigateToStrategy = vi.fn();
  const mockOnPerformanceUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock StrategyAttributionService
    const mockAttributionService = {
      suggestStrategy: vi.fn().mockReturnValue([
        {
          strategyId: 'strategy-1',
          strategyName: 'Trend Following Strategy',
          confidence: 85,
          matchingFactors: ['Currency Pair', 'Trade Direction', 'Market Conditions'],
          reasoning: 'This trade matches the trend following criteria with high confidence'
        }
      ]),
      calculateAdherenceScore: vi.fn().mockReturnValue(92),
      identifyDeviations: vi.fn().mockReturnValue([])
    };
    
    vi.mocked(StrategyAttributionService).mockImplementation(() => mockAttributionService as any);

    // Mock StrategyPerformanceService
    const mockPerformanceService = {
      updatePerformanceMetrics: vi.fn().mockResolvedValue(undefined)
    };
    
    vi.mocked(StrategyPerformanceService).mockImplementation(() => mockPerformanceService as any);
  });

  it('renders strategy assignment section', () => {
    render(
      <TradeStrategyIntegration
        trade={mockTrade}
        editedTrade={mockTrade}
        availableStrategies={mockStrategies}
        isEditing={true}
        onTradeChange={mockOnTradeChange}
      />
    );

    expect(screen.getByText('Strategy Assignment')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows strategy suggestions when no strategy is assigned', async () => {
    const tradeWithoutStrategy = { ...mockTrade, strategyId: undefined };
    
    render(
      <TradeStrategyIntegration
        trade={tradeWithoutStrategy}
        editedTrade={tradeWithoutStrategy}
        availableStrategies={mockStrategies}
        isEditing={true}
        onTradeChange={mockOnTradeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Suggested Strategies')).toBeInTheDocument();
      expect(screen.getByText('Trend Following Strategy')).toBeInTheDocument();
      expect(screen.getByText('85% match')).toBeInTheDocument();
    });
  });

  it('handles strategy assignment', async () => {
    render(
      <TradeStrategyIntegration
        trade={mockTrade}
        editedTrade={mockTrade}
        availableStrategies={mockStrategies}
        isEditing={true}
        onTradeChange={mockOnTradeChange}
        onPerformanceUpdate={mockOnPerformanceUpdate}
      />
    );

    // Click on strategy dropdown
    const dropdown = screen.getByRole('combobox');
    fireEvent.click(dropdown);

    // Select a strategy from dropdown
    const strategyOptions = screen.getAllByText('Trend Following Strategy');
    fireEvent.click(strategyOptions[1]); // Click the one in the dropdown

    await waitFor(() => {
      expect(mockOnTradeChange).toHaveBeenCalledWith('strategyId', 'strategy-1');
      expect(mockOnTradeChange).toHaveBeenCalledWith('strategyName', 'Trend Following Strategy');
      expect(mockOnTradeChange).toHaveBeenCalledWith('strategyVersion', 1);
    });
  });

  it('calculates and displays adherence score when strategy is assigned', async () => {
    const tradeWithStrategy = { 
      ...mockTrade, 
      strategyId: 'strategy-1',
      strategyName: 'Trend Following Strategy'
    };
    
    render(
      <TradeStrategyIntegration
        trade={tradeWithStrategy}
        editedTrade={tradeWithStrategy}
        availableStrategies={mockStrategies}
        isEditing={false}
        onTradeChange={mockOnTradeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Strategy Adherence')).toBeInTheDocument();
    });
  });

  it('shows performance impact for closed trades', () => {
    const closedTradeWithStrategy = { 
      ...mockTrade, 
      strategyId: 'strategy-1',
      strategyName: 'Trend Following Strategy',
      status: 'closed' as const,
      exitPrice: 1.0980,
      pnl: 300
    };
    
    render(
      <TradeStrategyIntegration
        trade={closedTradeWithStrategy}
        editedTrade={closedTradeWithStrategy}
        availableStrategies={mockStrategies}
        isEditing={false}
        onTradeChange={mockOnTradeChange}
      />
    );

    expect(screen.getByText('Performance Impact')).toBeInTheDocument();
    expect(screen.getByText('26')).toBeInTheDocument(); // totalTrades + 1
  });

  it('handles suggestion acceptance', async () => {
    const tradeWithoutStrategy = { ...mockTrade, strategyId: undefined };
    
    render(
      <TradeStrategyIntegration
        trade={tradeWithoutStrategy}
        editedTrade={tradeWithoutStrategy}
        availableStrategies={mockStrategies}
        isEditing={true}
        onTradeChange={mockOnTradeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Suggested Strategies')).toBeInTheDocument();
    });

    // Click "Use This" button on suggestion
    const useThisButton = screen.getByText('Use This');
    fireEvent.click(useThisButton);

    await waitFor(() => {
      expect(mockOnTradeChange).toHaveBeenCalledWith('strategyId', 'strategy-1');
    });
  });

  it('navigates to strategy when view strategy button is clicked', () => {
    const tradeWithStrategy = { 
      ...mockTrade, 
      strategyId: 'strategy-1',
      strategyName: 'Trend Following Strategy'
    };
    
    render(
      <TradeStrategyIntegration
        trade={tradeWithStrategy}
        editedTrade={tradeWithStrategy}
        availableStrategies={mockStrategies}
        isEditing={false}
        onTradeChange={mockOnTradeChange}
        onNavigateToStrategy={mockOnNavigateToStrategy}
      />
    );

    const viewStrategyButton = screen.getByText('View Strategy');
    fireEvent.click(viewStrategyButton);

    expect(mockOnNavigateToStrategy).toHaveBeenCalledWith('strategy-1');
  });

  it('handles strategy removal', async () => {
    const tradeWithStrategy = { 
      ...mockTrade, 
      strategyId: 'strategy-1',
      strategyName: 'Trend Following Strategy'
    };
    
    render(
      <TradeStrategyIntegration
        trade={tradeWithStrategy}
        editedTrade={tradeWithStrategy}
        availableStrategies={mockStrategies}
        isEditing={true}
        onTradeChange={mockOnTradeChange}
      />
    );

    // First assign a strategy by selecting it
    const dropdown = screen.getByRole('combobox');
    fireEvent.click(dropdown);
    
    const noStrategyOption = screen.getByText('No Strategy');
    fireEvent.click(noStrategyOption);

    await waitFor(() => {
      expect(mockOnTradeChange).toHaveBeenCalledWith('strategyId', undefined);
    });
  });

  it('shows adherence deviations when present', async () => {
    // Create a fresh mock for this test
    const mockAttributionService = {
      suggestStrategy: vi.fn().mockReturnValue([]),
      calculateAdherenceScore: vi.fn().mockReturnValue(75),
      identifyDeviations: vi.fn().mockReturnValue([
        {
          type: 'PositionSize',
          planned: 1.0,
          actual: 1.5,
          impact: 'Negative',
          description: 'Position size was 50% larger than planned'
        }
      ])
    };
    
    vi.mocked(StrategyAttributionService).mockImplementation(() => mockAttributionService as any);

    const tradeWithStrategy = { 
      ...mockTrade, 
      strategyId: 'strategy-1',
      strategyName: 'Trend Following Strategy'
    };
    
    render(
      <TradeStrategyIntegration
        trade={tradeWithStrategy}
        editedTrade={tradeWithStrategy}
        availableStrategies={mockStrategies}
        isEditing={false}
        onTradeChange={mockOnTradeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Strategy Deviations')).toBeInTheDocument();
      expect(screen.getByText('Position size was 50% larger than planned')).toBeInTheDocument();
    });
  });

  it('shows perfect adherence message when no deviations', async () => {
    // Create a fresh mock for this test
    const mockAttributionService = {
      suggestStrategy: vi.fn().mockReturnValue([]),
      calculateAdherenceScore: vi.fn().mockReturnValue(98),
      identifyDeviations: vi.fn().mockReturnValue([])
    };
    
    vi.mocked(StrategyAttributionService).mockImplementation(() => mockAttributionService as any);

    const tradeWithStrategy = { 
      ...mockTrade, 
      strategyId: 'strategy-1',
      strategyName: 'Trend Following Strategy'
    };
    
    render(
      <TradeStrategyIntegration
        trade={tradeWithStrategy}
        editedTrade={tradeWithStrategy}
        availableStrategies={mockStrategies}
        isEditing={false}
        onTradeChange={mockOnTradeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Excellent! This trade followed the strategy rules perfectly.')).toBeInTheDocument();
    });
  });
});
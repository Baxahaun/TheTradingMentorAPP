import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradeStrategyIntegration from '../trade-strategy/TradeStrategyIntegration';
import { TradeWithStrategy } from '../../types/trade';
import { ProfessionalStrategy } from '../../types/strategy';
import { StrategyAttributionService } from '../../services/StrategyAttributionService';
import { StrategyPerformanceService } from '../../services/StrategyPerformanceService';

// Mock the services
vi.mock('../../services/StrategyAttributionService');
vi.mock('../../services/StrategyPerformanceService');

describe('Trade Strategy Integration Workflow', () => {
  const mockOnTradeChange = vi.fn();
  const mockOnNavigateToStrategy = vi.fn();
  const mockOnPerformanceUpdate = vi.fn();

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

  it('integrates strategy assignment with trade review workflow', async () => {
    render(
      <TradeStrategyIntegration
        trade={mockTrade}
        editedTrade={mockTrade}
        availableStrategies={[mockStrategy]}
        isEditing={true}
        onTradeChange={mockOnTradeChange}
        onNavigateToStrategy={mockOnNavigateToStrategy}
        onPerformanceUpdate={mockOnPerformanceUpdate}
      />
    );

    // Verify strategy assignment section is rendered
    expect(screen.getByText('Strategy Assignment')).toBeInTheDocument();
    
    // Verify strategy suggestions are shown
    await waitFor(() => {
      expect(screen.getByText('Suggested Strategies')).toBeInTheDocument();
      expect(screen.getByText('85% match')).toBeInTheDocument();
    });

    // Accept a strategy suggestion
    const useThisButton = screen.getByText('Use This');
    fireEvent.click(useThisButton);

    // Verify strategy assignment callback was called
    await waitFor(() => {
      expect(mockOnTradeChange).toHaveBeenCalledWith('strategyId', 'strategy-1');
      expect(mockOnTradeChange).toHaveBeenCalledWith('strategyName', 'Trend Following Strategy');
    });
  });

  it('shows strategy suggestions for unassigned trades', async () => {
    const tradeWithoutStrategy = { ...mockTrade, strategyId: undefined };

    render(
      <TradeStrategyIntegration
        trade={tradeWithoutStrategy}
        editedTrade={tradeWithoutStrategy}
        availableStrategies={[mockStrategy]}
        isEditing={true}
        onTradeChange={mockOnTradeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Suggested Strategies')).toBeInTheDocument();
      expect(screen.getByText('85% match')).toBeInTheDocument();
    });
  });

  it('calculates adherence score for assigned strategies', async () => {
    const tradeWithStrategy = { 
      ...mockTrade, 
      strategyId: 'strategy-1',
      strategyName: 'Trend Following Strategy'
    };

    render(
      <TradeStrategyIntegration
        trade={tradeWithStrategy}
        editedTrade={tradeWithStrategy}
        availableStrategies={[mockStrategy]}
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
      pnl: 300
    };

    render(
      <TradeStrategyIntegration
        trade={closedTradeWithStrategy}
        editedTrade={closedTradeWithStrategy}
        availableStrategies={[mockStrategy]}
        isEditing={false}
        onTradeChange={mockOnTradeChange}
      />
    );

    expect(screen.getByText('Performance Impact')).toBeInTheDocument();
    expect(screen.getByText('26')).toBeInTheDocument(); // totalTrades + 1
  });
});
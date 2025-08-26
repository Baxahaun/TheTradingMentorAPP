import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BacktestingPanel } from '../BacktestingPanel';
import { ProfessionalStrategy, Trade } from '../../../types/strategy';

// Mock the BacktestingService
vi.mock('../../../services/BacktestingService', () => ({
  BacktestingService: vi.fn().mockImplementation(() => ({
    runBacktest: vi.fn().mockResolvedValue({
      strategyId: 'test-strategy-1',
      originalPerformance: {
        totalTrades: 3,
        winningTrades: 2,
        losingTrades: 1,
        profitFactor: 2.5,
        expectancy: 43.33,
        winRate: 66.67,
        averageWin: 75,
        averageLoss: 20,
        riskRewardRatio: 3.75,
        maxDrawdown: 20,
        maxDrawdownDuration: 0,
        sampleSize: 3,
        confidenceLevel: 60,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Stable',
        lastCalculated: new Date().toISOString()
      },
      backtestPerformance: {
        totalTrades: 3,
        winningTrades: 2,
        losingTrades: 1,
        profitFactor: 3.0,
        expectancy: 50.0,
        winRate: 66.67,
        averageWin: 80,
        averageLoss: 15,
        riskRewardRatio: 5.33,
        maxDrawdown: 15,
        maxDrawdownDuration: 0,
        sampleSize: 3,
        confidenceLevel: 60,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Improving',
        lastCalculated: new Date().toISOString()
      },
      trades: [],
      summary: {
        totalTrades: 3,
        tradesAffected: 2,
        performanceImprovement: 15.4,
        profitFactorChange: 0.5,
        expectancyChange: 6.67,
        winRateChange: 0,
        maxDrawdownChange: -5
      },
      metadata: {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-03T00:00:00Z',
        modifications: [],
        executionTime: 150,
        confidence: 60
      }
    }),
    compareStrategyVersions: vi.fn().mockResolvedValue({
      originalStrategy: {},
      modifiedStrategy: {},
      performanceComparison: {
        original: {},
        modified: {},
        improvement: 10.5
      },
      tradeByTradeAnalysis: [],
      recommendations: ['Consider implementing these changes']
    }),
    simulateRiskManagementChanges: vi.fn().mockResolvedValue({
      scenario: 'Risk Management Simulation',
      modifications: {},
      projectedPerformance: {},
      riskMetrics: {
        maxDrawdown: 100,
        volatility: 0.15,
        sharpeRatio: 1.8,
        sortinoRatio: 2.1
      },
      confidenceInterval: {
        lower: 30,
        upper: 70,
        confidence: 0.95
      }
    })
  }))
}));

// Mock the chart components
vi.mock('../BacktestResultsChart', () => ({
  BacktestResultsChart: ({ result }: any) => (
    <div data-testid="backtest-results-chart">
      Backtest Results: {result.summary.performanceImprovement}%
    </div>
  )
}));

vi.mock('../VersionComparisonChart', () => ({
  VersionComparisonChart: ({ result }: any) => (
    <div data-testid="version-comparison-chart">
      Version Comparison: {result.performanceComparison.improvement}%
    </div>
  )
}));

vi.mock('../SimulationResultsChart', () => ({
  SimulationResultsChart: ({ result }: any) => (
    <div data-testid="simulation-results-chart">
      Simulation Results: {result.riskMetrics.sharpeRatio}
    </div>
  )
}));

describe('BacktestingPanel', () => {
  let mockStrategy: ProfessionalStrategy;
  let mockTrades: Trade[];
  let mockOnStrategyUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnStrategyUpdate = vi.fn();
    
    mockStrategy = {
      id: 'test-strategy-1',
      title: 'Test Strategy',
      description: 'A test strategy',
      color: '#3B82F6',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending',
        technicalConditions: ['RSI < 30'],
        volatilityRequirements: 'Medium'
      },
      entryTriggers: {
        primarySignal: 'Break of resistance',
        confirmationSignals: ['Volume spike'],
        timingCriteria: 'Market open'
      },
      riskManagement: {
        positionSizingMethod: {
          type: 'FixedPercentage',
          parameters: { percentage: 2 }
        },
        maxRiskPerTrade: 2,
        stopLossRule: {
          type: 'ATRBased',
          parameters: { multiplier: 2 },
          description: '2x ATR stop loss'
        },
        takeProfitRule: {
          type: 'RiskRewardRatio',
          parameters: { ratio: 2 },
          description: '2:1 risk reward'
        },
        riskRewardRatio: 2
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
        riskRewardRatio: 0,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        sampleSize: 0,
        confidenceLevel: 0,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Insufficient Data',
        lastCalculated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isActive: true
    };

    mockTrades = [
      {
        id: 'trade-1',
        symbol: 'EURUSD',
        entryTime: '2024-01-01T10:00:00Z',
        exitTime: '2024-01-01T12:00:00Z',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        quantity: 10000,
        pnl: 50,
        side: 'long',
        status: 'closed'
      } as Trade,
      {
        id: 'trade-2',
        symbol: 'EURUSD',
        entryTime: '2024-01-02T10:00:00Z',
        exitTime: '2024-01-02T12:00:00Z',
        entryPrice: 1.1000,
        exitPrice: 1.0980,
        quantity: 10000,
        pnl: -20,
        side: 'long',
        status: 'closed'
      } as Trade,
      {
        id: 'trade-3',
        symbol: 'EURUSD',
        entryTime: '2024-01-03T10:00:00Z',
        exitTime: '2024-01-03T12:00:00Z',
        entryPrice: 1.1000,
        exitPrice: 1.1100,
        quantity: 10000,
        pnl: 100,
        side: 'long',
        status: 'closed'
      } as Trade
    ];
  });

  it('should render the backtesting panel', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    expect(screen.getByText('Strategy Backtesting & Simulation')).toBeInTheDocument();
    expect(screen.getByText('Backtest')).toBeInTheDocument();
    expect(screen.getByText('Version Compare')).toBeInTheDocument();
    expect(screen.getByText('Risk Simulation')).toBeInTheDocument();
  });

  it('should display historical trades count', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument(); // Historical trades count
  });

  it('should allow adding modifications', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    const addButton = screen.getByText('Add Modification');
    fireEvent.click(addButton);

    expect(screen.getByText('StopLoss')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('should run backtest when button is clicked', async () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByTestId('backtest-results-chart')).toBeInTheDocument();
    });

    expect(screen.getByText('Backtest Results: 15.4%')).toBeInTheDocument();
  });

  it('should disable backtest button when no trades available', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={[]}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    expect(runButton).toBeDisabled();
  });

  it('should show error when backtest fails', async () => {
    const mockService = vi.mocked(require('../../../services/BacktestingService').BacktestingService);
    mockService.mockImplementation(() => ({
      runBacktest: vi.fn().mockRejectedValue(new Error('Backtest failed')),
      compareStrategyVersions: vi.fn(),
      simulateRiskManagementChanges: vi.fn()
    }));

    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Backtest failed')).toBeInTheDocument();
    });
  });

  it('should switch to version comparison tab', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    const versionTab = screen.getByText('Version Compare');
    fireEvent.click(versionTab);

    expect(screen.getByText('Create Modified Version')).toBeInTheDocument();
    expect(screen.getByText('Compare Versions')).toBeInTheDocument();
  });

  it('should create modified strategy version', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    // Switch to version comparison tab
    const versionTab = screen.getByText('Version Compare');
    fireEvent.click(versionTab);

    // Tab should be selected
    expect(versionTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should run version comparison', async () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    // Switch to version comparison tab
    const versionTab = screen.getByText('Version Compare');
    fireEvent.click(versionTab);

    // Create modified version first
    const createButton = screen.getByText('Create Modified Version');
    fireEvent.click(createButton);

    // Run comparison
    const compareButton = screen.getByText('Compare Versions');
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(screen.getByTestId('version-comparison-chart')).toBeInTheDocument();
    });

    expect(screen.getByText('Version Comparison: 10.5%')).toBeInTheDocument();
  });

  it('should switch to risk simulation tab', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    const simulationTab = screen.getByText('Risk Simulation');
    fireEvent.click(simulationTab);

    // Tab should be selected
    expect(simulationTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should run Monte Carlo simulation', async () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    // Switch to simulation tab
    const simulationTab = screen.getByText('Risk Simulation');
    fireEvent.click(simulationTab);

    // Tab should be selected
    expect(simulationTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should update risk parameters', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    // Switch to simulation tab
    const simulationTab = screen.getByText('Risk Simulation');
    fireEvent.click(simulationTab);

    // Tab should be selected
    expect(simulationTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should show progress during backtest execution', async () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    fireEvent.click(runButton);

    // Should show progress text
    expect(screen.getByText('Running backtest...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('backtest-results-chart')).toBeInTheDocument();
    });
  });

  it('should remove modifications', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    // Add a modification
    const addButton = screen.getByText('Add Modification');
    fireEvent.click(addButton);

    // Remove the modification
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(screen.queryByText('StopLoss')).not.toBeInTheDocument();
  });

  it('should update modification fields', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    // Add a modification
    const addButton = screen.getByText('Add Modification');
    fireEvent.click(addButton);

    // Update field value
    const fieldInputs = screen.getAllByDisplayValue('multiplier');
    const fieldInput = fieldInputs[0];
    fireEvent.change(fieldInput, { target: { value: 'percentage' } });

    expect(fieldInput).toHaveValue('percentage');

    // Update new value
    const valueInputs = screen.getAllByDisplayValue('1.5');
    const valueInput = valueInputs[0];
    fireEvent.change(valueInput, { target: { value: '2.5' } });

    expect(valueInput).toHaveValue('2.5');

    // Update description
    const descInputs = screen.getAllByDisplayValue('Tighter stop loss');
    const descInput = descInputs[0];
    fireEvent.change(descInput, { target: { value: 'Custom stop loss' } });

    expect(descInput).toHaveValue('Custom stop loss');
  });

  it('should show warning when no modified version exists for comparison', () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    // Switch to version comparison tab
    const versionTab = screen.getByText('Version Compare');
    fireEvent.click(versionTab);

    // Tab should be selected
    expect(versionTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should disable buttons during execution', async () => {
    render(
      <BacktestingPanel
        strategy={mockStrategy}
        historicalTrades={mockTrades}
        onStrategyUpdate={mockOnStrategyUpdate}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    fireEvent.click(runButton);

    // Button should be disabled during execution
    expect(runButton).toBeDisabled();

    await waitFor(() => {
      expect(runButton).not.toBeDisabled();
    });
  });
});
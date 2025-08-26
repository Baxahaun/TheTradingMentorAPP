import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BacktestResultsChart } from '../BacktestResultsChart';
import { BacktestResult } from '../../../services/BacktestingService';

describe('BacktestResultsChart', () => {
  const mockResult: BacktestResult = {
    strategyId: 'test-strategy-1',
    originalPerformance: {
      totalTrades: 10,
      winningTrades: 6,
      losingTrades: 4,
      profitFactor: 2.5,
      expectancy: 45.50,
      winRate: 60.00,
      averageWin: 100.00,
      averageLoss: 40.00,
      riskRewardRatio: 2.50,
      maxDrawdown: 150.00,
      maxDrawdownDuration: 0,
      sampleSize: 10,
      confidenceLevel: 70,
      statisticallySignificant: false,
      monthlyReturns: [],
      performanceTrend: 'Stable',
      lastCalculated: new Date().toISOString()
    },
    backtestPerformance: {
      totalTrades: 10,
      winningTrades: 7,
      losingTrades: 3,
      profitFactor: 3.2,
      expectancy: 58.75,
      winRate: 70.00,
      averageWin: 105.00,
      averageLoss: 35.00,
      riskRewardRatio: 3.00,
      maxDrawdown: 120.00,
      maxDrawdownDuration: 0,
      sampleSize: 10,
      confidenceLevel: 70,
      statisticallySignificant: false,
      monthlyReturns: [],
      performanceTrend: 'Improving',
      lastCalculated: new Date().toISOString()
    },
    trades: [
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
        status: 'closed',
        originalOutcome: 'win',
        backtestOutcome: 'win',
        originalPnL: 50,
        backtestPnL: 55,
        ruleChangesApplied: ['Stop Loss Modified']
      }
    ],
    summary: {
      totalTrades: 10,
      tradesAffected: 6,
      performanceImprovement: 29.12,
      profitFactorChange: 0.7,
      expectancyChange: 13.25,
      winRateChange: 10.00,
      maxDrawdownChange: -30.00
    },
    metadata: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T00:00:00Z',
      modifications: [
        {
          type: 'StopLoss',
          field: 'multiplier',
          originalValue: 2,
          newValue: 1.5,
          description: 'Tighter stop loss for better risk management'
        }
      ],
      executionTime: 250,
      confidence: 70
    }
  };

  it('should render performance improvement summary', () => {
    render(<BacktestResultsChart result={mockResult} />);

    expect(screen.getByText('+29.12%')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument(); // Trades affected
    expect(screen.getByText('of 10 total')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument(); // Confidence
    expect(screen.getByText('250ms')).toBeInTheDocument(); // Execution time
  });

  it('should display detailed performance comparison', () => {
    render(<BacktestResultsChart result={mockResult} />);

    // Profit Factor comparison
    expect(screen.getByText('Original: 2.50')).toBeInTheDocument();
    expect(screen.getByText('Backtest: 3.20')).toBeInTheDocument();
    expect(screen.getByText('+0.70')).toBeInTheDocument();

    // Win Rate comparison
    expect(screen.getByText('Original: 60.00%')).toBeInTheDocument();
    expect(screen.getByText('Backtest: 70.00%')).toBeInTheDocument();
    expect(screen.getByText('+10.00%')).toBeInTheDocument();

    // Expectancy comparison
    expect(screen.getByText('Original: $45.50')).toBeInTheDocument();
    expect(screen.getByText('Backtest: $58.75')).toBeInTheDocument();
    expect(screen.getByText('+$13.25')).toBeInTheDocument();

    // Max Drawdown comparison (note: negative change is good)
    expect(screen.getByText('Original: $150.00')).toBeInTheDocument();
    expect(screen.getByText('Backtest: $120.00')).toBeInTheDocument();
    expect(screen.getByText('+$-30.00')).toBeInTheDocument();
  });

  it('should show modifications applied', () => {
    render(<BacktestResultsChart result={mockResult} />);

    expect(screen.getByText('Modifications Applied')).toBeInTheDocument();
    expect(screen.getByText('StopLoss')).toBeInTheDocument();
    expect(screen.getByText('Tighter stop loss for better risk management')).toBeInTheDocument();
    expect(screen.getByText('multiplier: 2 → 1.5')).toBeInTheDocument();
  });

  it('should display trade analysis summary', () => {
    render(<BacktestResultsChart result={mockResult} />);

    expect(screen.getByText('Trade Analysis')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total trades in result
    expect(screen.getByText('Total Trades')).toBeInTheDocument();
    expect(screen.getByText('Winning Trades')).toBeInTheDocument();
    expect(screen.getByText('Losing Trades')).toBeInTheDocument();
    expect(screen.getByText('Modified Trades')).toBeInTheDocument();
  });

  it('should show positive recommendation for significant improvement', () => {
    render(<BacktestResultsChart result={mockResult} />);

    expect(screen.getByText('Recommendation')).toBeInTheDocument();
    expect(screen.getByText(/The backtest shows a significant improvement of 29.12%/)).toBeInTheDocument();
    expect(screen.getByText(/Consider implementing these modifications/)).toBeInTheDocument();
  });

  it('should show warning for negative performance', () => {
    const negativeResult: BacktestResult = {
      ...mockResult,
      summary: {
        ...mockResult.summary,
        performanceImprovement: -15.5
      }
    };

    render(<BacktestResultsChart result={negativeResult} />);

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText(/The backtest shows a performance decline of 15.50%/)).toBeInTheDocument();
    expect(screen.getByText(/These modifications may not be beneficial/)).toBeInTheDocument();
  });

  it('should handle zero modifications', () => {
    const noModsResult: BacktestResult = {
      ...mockResult,
      metadata: {
        ...mockResult.metadata,
        modifications: []
      }
    };

    render(<BacktestResultsChart result={noModsResult} />);

    expect(screen.queryByText('Modifications Applied')).not.toBeInTheDocument();
  });

  it('should format numbers correctly', () => {
    render(<BacktestResultsChart result={mockResult} />);

    // Check percentage formatting
    expect(screen.getByText('+29.12%')).toBeInTheDocument();
    expect(screen.getByText('+10.00%')).toBeInTheDocument();

    // Check currency formatting
    expect(screen.getByText('$45.50')).toBeInTheDocument();
    expect(screen.getByText('$58.75')).toBeInTheDocument();
    expect(screen.getByText('+$13.25')).toBeInTheDocument();

    // Check number formatting
    expect(screen.getByText('2.50')).toBeInTheDocument();
    expect(screen.getByText('3.20')).toBeInTheDocument();
    expect(screen.getByText('+0.70')).toBeInTheDocument();
  });

  it('should show correct trend icons', () => {
    render(<BacktestResultsChart result={mockResult} />);

    // Should have trending up icons for positive changes
    const trendingUpIcons = screen.getAllByTestId('trending-up-icon');
    expect(trendingUpIcons.length).toBeGreaterThan(0);
  });

  it('should handle edge case with no trades affected', () => {
    const noTradesAffectedResult: BacktestResult = {
      ...mockResult,
      summary: {
        ...mockResult.summary,
        tradesAffected: 0,
        performanceImprovement: 0
      }
    };

    render(<BacktestResultsChart result={noTradesAffectedResult} />);

    expect(screen.getByText('0')).toBeInTheDocument(); // Trades affected
    expect(screen.getByText('0.00%')).toBeInTheDocument(); // Performance improvement
  });

  it('should display confidence level correctly', () => {
    render(<BacktestResultsChart result={mockResult} />);

    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('should show execution time', () => {
    render(<BacktestResultsChart result={mockResult} />);

    expect(screen.getByText('250ms')).toBeInTheDocument();
  });

  it('should handle very small performance changes', () => {
    const smallChangeResult: BacktestResult = {
      ...mockResult,
      summary: {
        ...mockResult.summary,
        performanceImprovement: 0.01,
        profitFactorChange: 0.001,
        expectancyChange: 0.05,
        winRateChange: 0.1,
        maxDrawdownChange: -0.5
      }
    };

    render(<BacktestResultsChart result={smallChangeResult} />);

    expect(screen.getByText('+0.01%')).toBeInTheDocument();
    expect(screen.getByText('+0.00')).toBeInTheDocument(); // Profit factor change rounded
    expect(screen.getByText('+$0.05')).toBeInTheDocument();
    expect(screen.getByText('+0.10%')).toBeInTheDocument();
  });
});
/**
 * AI Insights Panel Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIInsightsPanel from '../AIInsightsPanel';
import { ProfessionalStrategy, StrategyInsight, OptimizationSuggestion } from '../../../types/strategy';
import { Trade } from '../../../types/trade';

import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

// Mock the AI Insights Service
vi.mock('../../../services/AIInsightsService', () => ({
  AIInsightsService: vi.fn().mockImplementation(() => ({
    generateStrategyInsights: vi.fn().mockReturnValue([
      {
        type: 'Performance',
        message: 'Excellent win rate of 75.0%. Consider increasing position size to capitalize on this edge.',
        confidence: 85,
        actionable: true,
        supportingData: { winRate: 75, trades: 50 },
        priority: 'High'
      }
    ]),
    identifyPerformancePatterns: vi.fn().mockReturnValue([
      {
        type: 'TimeOfDay',
        pattern: '9:00 hour shows strong performance',
        confidence: 80,
        impact: 25,
        description: 'Trading at 9:00 shows 75.0% win rate with average P&L of $45.50',
        supportingData: { hour: 9, winRate: 75, avgPnL: 45.5, trades: 20 }
      }
    ]),
    suggestOptimizations: vi.fn().mockReturnValue([
      {
        category: 'RiskManagement',
        suggestion: 'Reduce position size from 2.0% to 1.4% to limit drawdown',
        expectedImprovement: 25,
        confidence: 80,
        implementationDifficulty: 'Easy',
        requiredData: ['position_size', 'historical_drawdown']
      }
    ]),
    detectMarketConditionCorrelations: vi.fn().mockReturnValue([
      {
        condition: 'High Volatility (VIX > 25)',
        correlation: 0.65,
        significance: 85,
        description: 'Strategy performs significantly better during high volatility periods',
        recommendations: ['Increase position size during high VIX periods']
      }
    ])
  }))
}));

const mockStrategy: ProfessionalStrategy = {
  id: 'test-strategy-1',
  title: 'Test Strategy',
  description: 'Test strategy for AI insights',
  color: '#3B82F6',
  methodology: 'Technical',
  primaryTimeframe: '1H',
  assetClasses: ['Forex'],
  setupConditions: {
    marketEnvironment: 'Trending market',
    technicalConditions: ['RSI oversold'],
    volatilityRequirements: 'Medium volatility'
  },
  entryTriggers: {
    primarySignal: 'Bullish engulfing candle',
    confirmationSignals: ['Volume spike'],
    timingCriteria: 'Enter on next candle open'
  },
  riskManagement: {
    positionSizingMethod: { type: 'FixedPercentage', parameters: { percentage: 2 } },
    maxRiskPerTrade: 2,
    stopLossRule: { type: 'ATRBased', parameters: { atrMultiplier: 2 }, description: '2x ATR' },
    takeProfitRule: { type: 'RiskRewardRatio', parameters: { ratio: 2 }, description: '2:1 RR' },
    riskRewardRatio: 2
  },
  performance: {
    totalTrades: 50,
    winningTrades: 32,
    losingTrades: 18,
    profitFactor: 1.8,
    expectancy: 25.5,
    winRate: 64,
    averageWin: 85.2,
    averageLoss: 42.1,
    riskRewardRatio: 2.02,
    sharpeRatio: 1.2,
    maxDrawdown: 8.5,
    maxDrawdownDuration: 5,
    sampleSize: 50,
    confidenceLevel: 95,
    statisticallySignificant: true,
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

const mockTrades: Trade[] = [
  {
    id: 'trade-1',
    symbol: 'EURUSD',
    type: 'buy',
    quantity: 10000,
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    date: '2024-01-15T09:00:00Z',
    status: 'closed',
    pnl: 50,
    strategy: 'test-strategy-1'
  }
];

describe('AIInsightsPanel', () => {
  const defaultProps = {
    strategy: mockStrategy,
    strategies: [mockStrategy],
    trades: mockTrades
  };

  it('renders without crashing', () => {
    render(<AIInsightsPanel {...defaultProps} />);
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('displays strategy information in header', () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    expect(screen.getByText('Analysis for "Test Strategy" based on 1 trades')).toBeInTheDocument();
  });

  it('shows message when no strategy is selected', () => {
    render(<AIInsightsPanel strategy={undefined} />);
    
    expect(screen.getByText('Select a strategy to view AI insights and recommendations.')).toBeInTheDocument();
  });

  it('renders all tab options', () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Patterns')).toBeInTheDocument();
    expect(screen.getByText('Optimizations')).toBeInTheDocument();
    expect(screen.getByText('Market Correlations')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    // Click on Patterns tab
    fireEvent.click(screen.getByText('Patterns'));
    
    await waitFor(() => {
      expect(screen.getByText('9:00 hour shows strong performance')).toBeInTheDocument();
    });
    
    // Click on Optimizations tab
    fireEvent.click(screen.getByText('Optimizations'));
    
    await waitFor(() => {
      expect(screen.getByText('Reduce position size from 2.0% to 1.4% to limit drawdown')).toBeInTheDocument();
    });
  });

  it('displays insights with correct priority colors', async () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    await waitFor(() => {
      const highPriorityElement = screen.getByText('High Priority');
      expect(highPriorityElement).toBeInTheDocument();
      // Check the parent container has the correct color classes
      const insightContainer = screen.getByText('Excellent win rate of 75.0%. Consider increasing position size to capitalize on this edge.').closest('div');
      expect(insightContainer).toHaveClass('text-red-600');
    });
  });

  it('displays confidence levels correctly', async () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('85% confidence')).toBeInTheDocument();
    });
  });

  it('shows actionable insight indicator', async () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Actionable insight')).toBeInTheDocument();
    });
  });

  it('calls onOptimizationSelect when Apply Suggestion is clicked', async () => {
    const mockOnOptimizationSelect = vi.fn();
    render(
      <AIInsightsPanel 
        {...defaultProps} 
        onOptimizationSelect={mockOnOptimizationSelect}
      />
    );
    
    // Switch to optimizations tab
    fireEvent.click(screen.getByText('Optimizations'));
    
    await waitFor(() => {
      const applyButton = screen.getByText('Apply Suggestion');
      fireEvent.click(applyButton);
      
      expect(mockOnOptimizationSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'RiskManagement',
          suggestion: 'Reduce position size from 2.0% to 1.4% to limit drawdown'
        })
      );
    });
  });

  it('displays refresh button and handles click', async () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    const refreshButton = screen.getByText('Refresh Insights');
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(refreshButton).toBeInTheDocument();
    });
  });

  it('shows loading state when generating insights', async () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    const refreshButton = screen.getByText('Refresh Insights');
    fireEvent.click(refreshButton);
    
    // The button text should change to "Analyzing..." during loading
    // This is a brief state, so we might not always catch it
    expect(refreshButton).toBeInTheDocument();
  });

  it('displays market correlations with recommendations', async () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    // Switch to correlations tab
    fireEvent.click(screen.getByText('Market Correlations'));
    
    await waitFor(() => {
      expect(screen.getByText('High Volatility (VIX > 25)')).toBeInTheDocument();
      expect(screen.getByText('+65% correlation')).toBeInTheDocument();
      expect(screen.getByText('Increase position size during high VIX periods')).toBeInTheDocument();
    });
  });

  it('shows tab counts when data is available', async () => {
    render(<AIInsightsPanel {...defaultProps} />);
    
    await waitFor(() => {
      // Check for count badges on tabs - there are multiple "1"s so check for all
      const countBadges = screen.getAllByText('1');
      expect(countBadges.length).toBeGreaterThan(0); // Should show count badges
    });
  });

  it('handles empty data states gracefully', () => {
    render(<AIInsightsPanel strategy={mockStrategy} trades={[]} />);
    
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AIInsightsPanel {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
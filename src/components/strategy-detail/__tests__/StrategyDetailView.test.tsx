/**
 * Unit tests for StrategyDetailView component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import StrategyDetailView from '../StrategyDetailView';
import { ProfessionalStrategy, TradeWithStrategy } from '../../../types/strategy';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the child components
vi.mock('../../strategy-dashboard/PerformanceAnalytics', () => {
  return function MockPerformanceAnalytics({ strategy }: { strategy: ProfessionalStrategy }) {
    return <div data-testid="performance-analytics">Performance Analytics for {strategy.title}</div>;
  };
});

vi.mock('../../strategy-dashboard/PerformanceChart', () => {
  return function MockPerformanceChart({ strategyId }: { strategyId: string }) {
    return <div data-testid="performance-chart">Performance Chart for {strategyId}</div>;
  };
});

vi.mock('../../ai-insights/AIInsightsPanel', () => {
  return function MockAIInsightsPanel({ strategy }: { strategy: ProfessionalStrategy }) {
    return <div data-testid="ai-insights-panel">AI Insights for {strategy.title}</div>;
  };
});

vi.mock('../TradeDistributionAnalysis', () => {
  return function MockTradeDistributionAnalysis({ trades }: { trades: TradeWithStrategy[] }) {
    return <div data-testid="trade-distribution-analysis">Trade Distribution ({trades.length} trades)</div>;
  };
});

vi.mock('../LinkedTradesView', () => {
  return function MockLinkedTradesView({ 
    trades, 
    strategyName, 
    onNavigateToTrade 
  }: { 
    trades: TradeWithStrategy[]; 
    strategyName: string;
    onNavigateToTrade: (id: string) => void;
  }) {
    return (
      <div data-testid="linked-trades-view">
        Linked Trades for {strategyName} ({trades.length} trades)
        <button onClick={() => onNavigateToTrade('test-trade-1')}>
          Navigate to Trade
        </button>
      </div>
    );
  };
});

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { activeTab: value, onTabChange: onValueChange })
      )}
    </div>
  ),
  TabsList: ({ children, activeTab, onTabChange }: any) => (
    <div data-testid="tabs-list">
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { activeTab, onTabChange })
      )}
    </div>
  ),
  TabsTrigger: ({ children, value, activeTab, onTabChange }: any) => (
    <button 
      onClick={() => onTabChange(value)}
      data-testid={`tab-${value}`}
      className={activeTab === value ? 'active' : ''}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, activeTab }: any) => 
    activeTab === value ? <div data-testid={`tab-content-${value}`}>{children}</div> : null
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span className={`badge ${variant}`}>{children}</span>
  )
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => (
    <div data-testid="progress" data-value={value}>Progress: {value}%</div>
  )
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div className="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />
}));

describe('StrategyDetailView', () => {
  const mockStrategy: ProfessionalStrategy = {
    id: 'strategy-1',
    title: 'Test Strategy',
    description: 'A test trading strategy',
    color: '#3B82F6',
    methodology: 'Technical',
    primaryTimeframe: '1H',
    assetClasses: ['Forex'],
    setupConditions: {
      marketEnvironment: 'Trending market',
      technicalConditions: ['RSI oversold', 'Price above MA'],
      volatilityRequirements: 'Medium volatility'
    },
    entryTriggers: {
      primarySignal: 'Breakout above resistance',
      confirmationSignals: ['Volume spike', 'Momentum confirmation'],
      timingCriteria: 'Enter on retest'
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
        description: '2:1 risk-reward ratio'
      },
      riskRewardRatio: 2
    },
    performance: {
      totalTrades: 50,
      winningTrades: 30,
      losingTrades: 20,
      profitFactor: 1.5,
      expectancy: 25.5,
      winRate: 60,
      averageWin: 100,
      averageLoss: 50,
      riskRewardRatio: 2,
      sharpeRatio: 1.2,
      maxDrawdown: 15,
      maxDrawdownDuration: 5,
      sampleSize: 50,
      confidenceLevel: 95,
      statisticallySignificant: true,
      monthlyReturns: [
        { month: '2024-01', return: 5.2, trades: 10, winRate: 60, profitFactor: 1.4 },
        { month: '2024-02', return: 3.8, trades: 12, winRate: 58, profitFactor: 1.3 }
      ],
      performanceTrend: 'Improving',
      lastCalculated: '2024-03-01T00:00:00Z',
      calculationVersion: 1
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    version: 1,
    isActive: true
  };

  const mockTrades: TradeWithStrategy[] = [
    {
      id: 'trade-1',
      currencyPair: 'EURUSD',
      side: 'BUY',
      timestamp: Date.now() - 86400000, // 1 day ago
      pnl: 150,
      strategyId: 'strategy-1',
      strategyName: 'Test Strategy',
      adherenceScore: 85,
      deviations: []
    },
    {
      id: 'trade-2',
      currencyPair: 'GBPUSD',
      side: 'SELL',
      timestamp: Date.now() - 172800000, // 2 days ago
      pnl: -75,
      strategyId: 'strategy-1',
      strategyName: 'Test Strategy',
      adherenceScore: 70,
      deviations: [
        {
          type: 'StopLoss',
          planned: 50,
          actual: 75,
          impact: 'Negative',
          description: 'Stop loss moved too far'
        }
      ]
    }
  ];

  const defaultProps = {
    strategy: mockStrategy,
    trades: mockTrades,
    onBack: vi.fn(),
    onEditStrategy: vi.fn(),
    onNavigateToTrade: vi.fn(),
    onExportData: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders strategy detail view with correct title and metadata', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    expect(screen.getByText('Test Strategy')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('1H')).toBeInTheDocument();
    expect(screen.getByText('Statistically Significant')).toBeInTheDocument();
  });

  it('displays strategy performance metrics correctly', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    expect(screen.getByText('50')).toBeInTheDocument(); // Total trades
    expect(screen.getByText('60.0%')).toBeInTheDocument(); // Win rate
    expect(screen.getByText('1.50')).toBeInTheDocument(); // Profit factor
    expect(screen.getByText('$25.50')).toBeInTheDocument(); // Expectancy
  });

  it('shows statistical significance warning for insufficient trades', () => {
    const strategyWithFewTrades = {
      ...mockStrategy,
      performance: {
        ...mockStrategy.performance,
        totalTrades: 15,
        statisticallySignificant: false
      }
    };

    render(<StrategyDetailView {...defaultProps} strategy={strategyWithFewTrades} />);
    
    expect(screen.getByText(/needs 15 more trades to reach statistical significance/)).toBeInTheDocument();
  });

  it('handles tab navigation correctly', async () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    // Check default tab is overview
    expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
    
    // Click performance tab
    fireEvent.click(screen.getByTestId('tab-performance'));
    await waitFor(() => {
      expect(screen.getByTestId('tab-content-performance')).toBeInTheDocument();
      expect(screen.getByTestId('performance-analytics')).toBeInTheDocument();
    });
    
    // Click trades tab
    fireEvent.click(screen.getByTestId('tab-trades'));
    await waitFor(() => {
      expect(screen.getByTestId('tab-content-trades')).toBeInTheDocument();
      expect(screen.getByTestId('trade-distribution-analysis')).toBeInTheDocument();
      expect(screen.getByTestId('linked-trades-view')).toBeInTheDocument();
    });
    
    // Click insights tab
    fireEvent.click(screen.getByTestId('tab-insights'));
    await waitFor(() => {
      expect(screen.getByTestId('tab-content-insights')).toBeInTheDocument();
      expect(screen.getByTestId('ai-insights-panel')).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Back'));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onEditStrategy when edit button is clicked', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(defaultProps.onEditStrategy).toHaveBeenCalledWith(mockStrategy);
  });

  it('calls onExportData when export button is clicked', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Export'));
    expect(defaultProps.onExportData).toHaveBeenCalledWith(mockStrategy);
  });

  it('calls onNavigateToTrade when trade navigation is triggered', async () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    // Navigate to trades tab
    fireEvent.click(screen.getByTestId('tab-trades'));
    
    await waitFor(() => {
      const navigateButton = screen.getByText('Navigate to Trade');
      fireEvent.click(navigateButton);
      expect(defaultProps.onNavigateToTrade).toHaveBeenCalledWith('test-trade-1');
    });
  });

  it('displays strategy configuration correctly', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('1H')).toBeInTheDocument();
    expect(screen.getByText('Forex')).toBeInTheDocument();
    expect(screen.getByText('2.0%')).toBeInTheDocument(); // Max risk per trade
    expect(screen.getByText('2:1')).toBeInTheDocument(); // Risk-reward ratio
    expect(screen.getByText('FixedPercentage')).toBeInTheDocument();
    expect(screen.getByText('ATRBased')).toBeInTheDocument();
  });

  it('displays setup conditions and entry triggers', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    expect(screen.getByText('Trending market')).toBeInTheDocument();
    expect(screen.getByText('RSI oversold')).toBeInTheDocument();
    expect(screen.getByText('Price above MA')).toBeInTheDocument();
    expect(screen.getByText('Breakout above resistance')).toBeInTheDocument();
    expect(screen.getByText('Volume spike')).toBeInTheDocument();
    expect(screen.getByText('Momentum confirmation')).toBeInTheDocument();
  });

  it('shows performance trend with correct icon', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    expect(screen.getByText('Improving')).toBeInTheDocument();
  });

  it('filters trades correctly for strategy', () => {
    const allTrades = [
      ...mockTrades,
      {
        id: 'trade-3',
        currencyPair: 'USDJPY',
        side: 'BUY',
        timestamp: Date.now(),
        pnl: 200,
        strategyId: 'different-strategy',
        strategyName: 'Different Strategy',
        adherenceScore: 90
      }
    ];

    render(<StrategyDetailView {...defaultProps} trades={allTrades} />);
    
    // Navigate to trades tab to see filtered trades
    fireEvent.click(screen.getByTestId('tab-trades'));
    
    // Should only show trades for this strategy (2 trades, not 3)
    expect(screen.getByText('Linked Trades for Test Strategy (2 trades)')).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      strategy: mockStrategy,
      trades: mockTrades,
      onBack: vi.fn()
    };

    render(<StrategyDetailView {...minimalProps} />);
    
    expect(screen.getByText('Test Strategy')).toBeInTheDocument();
    // Should not show edit/export buttons when handlers not provided
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('displays correct trade count in tabs', () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    expect(screen.getByText('Trades (2)')).toBeInTheDocument();
  });

  it('shows strategy metadata in settings tab', async () => {
    render(<StrategyDetailView {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('tab-settings'));
    
    await waitFor(() => {
      expect(screen.getByTestId('tab-content-settings')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument(); // Version
    });
  });
});

describe('StrategyDetailView Edge Cases', () => {
  const emptyStrategy: ProfessionalStrategy = {
    id: 'empty-strategy',
    title: 'Empty Strategy',
    description: '',
    color: '#3B82F6',
    methodology: 'Technical',
    primaryTimeframe: '1H',
    assetClasses: ['Forex'],
    setupConditions: {
      marketEnvironment: 'Any market',
      technicalConditions: [],
      volatilityRequirements: 'Any'
    },
    entryTriggers: {
      primarySignal: 'Manual entry',
      confirmationSignals: [],
      timingCriteria: 'Anytime'
    },
    riskManagement: {
      positionSizingMethod: {
        type: 'FixedPercentage',
        parameters: { percentage: 1 }
      },
      maxRiskPerTrade: 1,
      stopLossRule: {
        type: 'PercentageBased',
        parameters: { percentage: 2 },
        description: '2% stop loss'
      },
      takeProfitRule: {
        type: 'RiskRewardRatio',
        parameters: { ratio: 2 },
        description: '2:1 risk-reward ratio'
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
      confidenceLevel: 95,
      statisticallySignificant: false,
      monthlyReturns: [],
      performanceTrend: 'Insufficient Data',
      lastCalculated: '2024-03-01T00:00:00Z',
      calculationVersion: 1
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    version: 1,
    isActive: true
  };

  it('handles strategy with no trades', () => {
    render(
      <StrategyDetailView
        strategy={emptyStrategy}
        trades={[]}
        onBack={vi.fn()}
      />
    );
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Total trades
    expect(screen.getByText('Trades (0)')).toBeInTheDocument();
  });

  it('handles strategy with no monthly returns', () => {
    render(
      <StrategyDetailView
        strategy={emptyStrategy}
        trades={[]}
        onBack={vi.fn()}
      />
    );
    
    // Should not crash when no monthly returns data
    expect(screen.getByText('Empty Strategy')).toBeInTheDocument();
  });

  it('handles strategy with insufficient data trend', () => {
    render(
      <StrategyDetailView
        strategy={emptyStrategy}
        trades={[]}
        onBack={vi.fn()}
      />
    );
    
    expect(screen.getByText('Insufficient Data')).toBeInTheDocument();
  });
});

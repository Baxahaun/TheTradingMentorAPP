import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { createMockStrategy, createMockTrade } from '../setup';

// Mock Firebase and external services
vi.mock('firebase/app');
vi.mock('firebase/firestore');
vi.mock('@/services/StrategyPerformanceService');
vi.mock('@/services/StrategyAttributionService');
vi.mock('@/services/AIInsightsService');
vi.mock('@/services/BacktestingService');

describe('Complete Strategy Lifecycle - End-to-End Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  describe('Strategy Creation to Performance Analysis Lifecycle', () => {
    it('should complete full strategy lifecycle from creation to analysis', async () => {
      render(<App />);

      // Step 1: Navigate to strategy management
      await user.click(screen.getByText('Strategies'));
      expect(screen.getByText('Strategy Dashboard')).toBeInTheDocument();

      // Step 2: Create new strategy
      await user.click(screen.getByText('Create Strategy'));
      expect(screen.getByText('Professional Strategy Builder')).toBeInTheDocument();

      // Fill out strategy details
      await user.type(screen.getByLabelText('Strategy Title'), 'EUR/USD Momentum Strategy');
      await user.type(
        screen.getByLabelText('Description'),
        'A momentum-based strategy for EUR/USD trading during London session'
      );
      
      // Select methodology
      await user.selectOptions(screen.getByLabelText('Methodology'), 'Technical');
      await user.selectOptions(screen.getByLabelText('Primary Timeframe'), '1H');
      
      // Add asset classes
      await user.click(screen.getByText('Add Asset Class'));
      await user.selectOptions(screen.getByLabelText('Asset Class'), 'Forex');

      // Setup conditions
      await user.type(
        screen.getByLabelText('Market Environment'),
        'Trending market with clear directional bias'
      );
      
      await user.click(screen.getByText('Add Technical Condition'));
      await user.type(
        screen.getByLabelText('Technical Condition 1'),
        'RSI above 50 for bullish bias'
      );

      // Entry triggers
      await user.type(
        screen.getByLabelText('Primary Signal'),
        'Bullish engulfing candle at support level'
      );
      
      await user.click(screen.getByText('Add Confirmation Signal'));
      await user.type(
        screen.getByLabelText('Confirmation Signal 1'),
        'Volume spike above 20-period average'
      );

      // Risk management
      await user.selectOptions(screen.getByLabelText('Position Sizing Method'), 'FixedPercentage');
      await user.type(screen.getByLabelText('Risk Per Trade (%)'), '2');
      await user.type(screen.getByLabelText('Risk-Reward Ratio'), '1:2');

      // Save strategy
      await user.click(screen.getByText('Save Strategy'));

      await waitFor(() => {
        expect(screen.getByText('Strategy created successfully')).toBeInTheDocument();
      });

      // Step 3: Verify strategy appears in dashboard
      expect(screen.getByText('EUR/USD Momentum Strategy')).toBeInTheDocument();
      expect(screen.getByText('No trades yet')).toBeInTheDocument();

      // Step 4: Navigate to trade review and add trades
      await user.click(screen.getByText('Trade Review'));
      
      // Add first trade
      await user.click(screen.getByText('Add Trade'));
      await user.type(screen.getByLabelText('Symbol'), 'EURUSD');
      await user.selectOptions(screen.getByLabelText('Type'), 'buy');
      await user.type(screen.getByLabelText('Entry Price'), '1.1000');
      await user.type(screen.getByLabelText('Exit Price'), '1.1100');
      await user.type(screen.getByLabelText('Quantity'), '10000');
      await user.type(
        screen.getByLabelText('Notes'),
        'Perfect bullish engulfing at support with volume spike'
      );

      // Strategy should be auto-suggested
      await waitFor(() => {
        expect(screen.getByText('Suggested Strategy')).toBeInTheDocument();
        expect(screen.getByText('EUR/USD Momentum Strategy')).toBeInTheDocument();
        expect(screen.getByText('95% confidence')).toBeInTheDocument();
      });

      // Accept suggestion
      await user.click(screen.getByText('Accept Suggestion'));
      await user.click(screen.getByText('Save Trade'));

      await waitFor(() => {
        expect(screen.getByText('Trade saved and assigned to strategy')).toBeInTheDocument();
      });

      // Step 5: Add more trades to build performance history
      const trades = [
        { entry: '1.1050', exit: '1.1150', pnl: 100, notes: 'Good momentum follow-through' },
        { entry: '1.1020', exit: '1.0970', pnl: -50, notes: 'False breakout, stopped out' },
        { entry: '1.1080', exit: '1.1180', pnl: 100, notes: 'Strong trend continuation' },
        { entry: '1.1030', exit: '1.1130', pnl: 100, notes: 'Perfect setup execution' },
      ];

      for (const trade of trades) {
        await user.click(screen.getByText('Add Trade'));
        await user.type(screen.getByLabelText('Entry Price'), trade.entry);
        await user.type(screen.getByLabelText('Exit Price'), trade.exit);
        await user.type(screen.getByLabelText('Notes'), trade.notes);
        await user.click(screen.getByText('Accept Suggestion')); // Auto-suggested strategy
        await user.click(screen.getByText('Save Trade'));
        
        await waitFor(() => {
          expect(screen.getByText('Trade saved')).toBeInTheDocument();
        });
      }

      // Step 6: Return to strategy dashboard to see updated performance
      await user.click(screen.getByText('Strategies'));

      await waitFor(() => {
        expect(screen.getByText('5 trades')).toBeInTheDocument();
        expect(screen.getByText('80% win rate')).toBeInTheDocument();
        expect(screen.getByText('Profit Factor: 3.5')).toBeInTheDocument();
      });

      // Step 7: View detailed strategy analysis
      await user.click(screen.getByText('EUR/USD Momentum Strategy'));
      
      expect(screen.getByText('Strategy Performance Analysis')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Trade Distribution')).toBeInTheDocument();
      expect(screen.getByText('AI Insights')).toBeInTheDocument();

      // Step 8: Check AI insights
      await waitFor(() => {
        expect(screen.getByText('Pattern Analysis')).toBeInTheDocument();
        expect(screen.getByText('This strategy performs best during London session')).toBeInTheDocument();
      });

      // Step 9: Run backtest
      await user.click(screen.getByText('Run Backtest'));
      
      // Modify risk parameters for what-if analysis
      await user.type(screen.getByLabelText('Test Risk Per Trade (%)'), '1.5');
      await user.click(screen.getByText('Run Analysis'));

      await waitFor(() => {
        expect(screen.getByText('Backtest Results')).toBeInTheDocument();
        expect(screen.getByText('Lower risk would reduce returns by 25%')).toBeInTheDocument();
      });

      // Step 10: Export strategy report
      await user.click(screen.getByText('Export Report'));
      await user.selectOptions(screen.getByLabelText('Format'), 'PDF');
      await user.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Report generated successfully')).toBeInTheDocument();
      });
    });

    it('should handle strategy migration workflow', async () => {
      // Mock existing basic playbook
      const basicPlaybook = {
        id: 'old-playbook-1',
        title: 'Basic EUR/USD Strategy',
        description: 'Simple EUR/USD trading approach',
        marketConditions: 'Trending market',
        entryParameters: 'Bullish candle at support',
        exitParameters: '1:2 risk reward',
        timesUsed: 15,
        tradesWon: 9,
        tradesLost: 6,
        version: 0, // Old version
      };

      render(<App initialPlaybooks={[basicPlaybook]} />);

      // Should show migration banner
      expect(screen.getByText('Strategy Migration Available')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Professional Features')).toBeInTheDocument();

      // Start migration
      await user.click(screen.getByText('Start Migration'));
      
      expect(screen.getByText('Strategy Migration Wizard')).toBeInTheDocument();
      expect(screen.getByText('Preserving Your Data')).toBeInTheDocument();

      // Step 1: Data preservation confirmation
      expect(screen.getByText('Basic EUR/USD Strategy')).toBeInTheDocument();
      expect(screen.getByText('15 trades (9 wins, 6 losses)')).toBeInTheDocument();
      await user.click(screen.getByText('Continue'));

      // Step 2: Professional field completion
      expect(screen.getByText('Add Professional Structure')).toBeInTheDocument();
      
      // Methodology (auto-suggested based on existing data)
      expect(screen.getByDisplayValue('Technical')).toBeInTheDocument();
      
      // Setup conditions (pre-filled from marketConditions)
      expect(screen.getByDisplayValue('Trending market')).toBeInTheDocument();
      
      // Entry triggers (pre-filled from entryParameters)
      expect(screen.getByDisplayValue('Bullish candle at support')).toBeInTheDocument();

      // Complete missing fields
      await user.selectOptions(screen.getByLabelText('Primary Timeframe'), '1H');
      await user.selectOptions(screen.getByLabelText('Position Sizing Method'), 'FixedPercentage');
      await user.type(screen.getByLabelText('Risk Per Trade (%)'), '2');

      await user.click(screen.getByText('Complete Migration'));

      await waitFor(() => {
        expect(screen.getByText('Migration completed successfully')).toBeInTheDocument();
      });

      // Verify migrated strategy
      expect(screen.getByText('Basic EUR/USD Strategy')).toBeInTheDocument();
      expect(screen.getByText('15 trades')).toBeInTheDocument();
      expect(screen.getByText('Professional Features Enabled')).toBeInTheDocument();
    });
  });

  describe('Multi-Strategy Portfolio Management', () => {
    it('should manage multiple strategies and compare performance', async () => {
      const strategies = [
        {
          ...createMockStrategy(),
          id: 'strategy-1',
          title: 'EUR/USD Momentum',
          performance: { profitFactor: 1.8, winRate: 65, expectancy: 45 },
        },
        {
          ...createMockStrategy(),
          id: 'strategy-2',
          title: 'Gold Reversal',
          performance: { profitFactor: 1.2, winRate: 55, expectancy: 25 },
        },
        {
          ...createMockStrategy(),
          id: 'strategy-3',
          title: 'Oil Breakout',
          performance: { profitFactor: 2.1, winRate: 70, expectancy: 60 },
        },
      ];

      render(<App initialStrategies={strategies} />);

      await user.click(screen.getByText('Strategies'));

      // Should show all strategies ranked by performance
      const strategyCards = screen.getAllByTestId('strategy-card');
      expect(strategyCards[0]).toHaveTextContent('Oil Breakout'); // Best performer
      expect(strategyCards[1]).toHaveTextContent('EUR/USD Momentum');
      expect(strategyCards[2]).toHaveTextContent('Gold Reversal');

      // Select multiple strategies for comparison
      await user.click(screen.getAllByRole('checkbox')[0]); // Oil Breakout
      await user.click(screen.getAllByRole('checkbox')[1]); // EUR/USD Momentum

      expect(screen.getByText('Compare Selected (2)')).toBeInTheDocument();
      await user.click(screen.getByText('Compare Selected (2)'));

      // Should show comparison view
      expect(screen.getByText('Strategy Comparison')).toBeInTheDocument();
      expect(screen.getByText('Side-by-side Analysis')).toBeInTheDocument();
      
      // Performance metrics comparison
      expect(screen.getByText('Oil Breakout vs EUR/USD Momentum')).toBeInTheDocument();
      expect(screen.getByText('Profit Factor: 2.1 vs 1.8')).toBeInTheDocument();
      expect(screen.getByText('Win Rate: 70% vs 65%')).toBeInTheDocument();

      // Should show recommendations
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Focus more capital on Oil Breakout strategy')).toBeInTheDocument();
    });

    it('should handle strategy correlation analysis', async () => {
      render(<App />);

      await user.click(screen.getByText('Strategies'));
      await user.click(screen.getByText('Portfolio Analysis'));

      expect(screen.getByText('Strategy Correlation Matrix')).toBeInTheDocument();
      expect(screen.getByText('Risk Diversification Analysis')).toBeInTheDocument();

      // Should show correlation warnings
      expect(screen.getByText('High correlation detected')).toBeInTheDocument();
      expect(screen.getByText('EUR/USD and GBP/USD strategies are 85% correlated')).toBeInTheDocument();

      // Should provide diversification suggestions
      expect(screen.getByText('Consider adding commodity strategies')).toBeInTheDocument();
    });
  });

  describe('Advanced Analytics and Insights', () => {
    it('should provide comprehensive performance analytics', async () => {
      const strategyWithHistory = {
        ...createMockStrategy(),
        performance: {
          ...createMockStrategy().performance,
          monthlyReturns: [
            { month: '2024-01', return: 250, trades: 10, winRate: 70 },
            { month: '2024-02', return: 180, trades: 12, winRate: 58 },
            { month: '2024-03', return: 320, trades: 15, winRate: 73 },
          ],
        },
      };

      render(<App initialStrategies={[strategyWithHistory]} />);

      await user.click(screen.getByText('Strategies'));
      await user.click(screen.getByText(strategyWithHistory.title));

      // Performance charts
      expect(screen.getByText('Monthly Performance')).toBeInTheDocument();
      expect(screen.getByText('Equity Curve')).toBeInTheDocument();
      expect(screen.getByText('Drawdown Analysis')).toBeInTheDocument();

      // Statistical analysis
      expect(screen.getByText('Statistical Significance')).toBeInTheDocument();
      expect(screen.getByText('Confidence Level: 95%')).toBeInTheDocument();

      // Risk metrics
      expect(screen.getByText('Risk Metrics')).toBeInTheDocument();
      expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
      expect(screen.getByText('Maximum Drawdown')).toBeInTheDocument();

      // AI insights
      await user.click(screen.getByText('AI Insights'));
      
      expect(screen.getByText('Performance Patterns')).toBeInTheDocument();
      expect(screen.getByText('March shows strongest performance')).toBeInTheDocument();
      expect(screen.getByText('Win rate correlates with market volatility')).toBeInTheDocument();
    });

    it('should provide actionable optimization suggestions', async () => {
      render(<App />);

      await user.click(screen.getByText('Strategies'));
      await user.click(screen.getByText('EUR/USD Momentum'));
      await user.click(screen.getByText('Optimization'));

      expect(screen.getByText('Strategy Optimization')).toBeInTheDocument();
      
      // Should show specific suggestions
      expect(screen.getByText('Suggested Improvements')).toBeInTheDocument();
      expect(screen.getByText('Reduce position size during high volatility')).toBeInTheDocument();
      expect(screen.getByText('Avoid trading during news events')).toBeInTheDocument();

      // Should allow testing suggestions
      await user.click(screen.getByText('Test Suggestion 1'));
      
      expect(screen.getByText('Backtesting Optimization')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Improvement: +15% profit factor')).toBeInTheDocument();
      });

      // Should allow applying suggestions
      await user.click(screen.getByText('Apply Optimization'));
      
      expect(screen.getByText('Strategy updated with optimization')).toBeInTheDocument();
    });
  });

  describe('Error Recovery and Data Integrity', () => {
    it('should handle data corruption and recovery', async () => {
      // Simulate corrupted strategy data
      const corruptedStrategy = {
        id: 'corrupted-1',
        title: 'Corrupted Strategy',
        // Missing required fields
      };

      render(<App initialStrategies={[corruptedStrategy]} />);

      await user.click(screen.getByText('Strategies'));

      // Should detect and handle corruption
      expect(screen.getByText('Data Integrity Issue Detected')).toBeInTheDocument();
      expect(screen.getByText('Some strategy data appears corrupted')).toBeInTheDocument();

      await user.click(screen.getByText('Repair Data'));

      expect(screen.getByText('Data Repair Wizard')).toBeInTheDocument();
      expect(screen.getByText('Attempting to recover strategy data')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Data repair completed')).toBeInTheDocument();
      });
    });

    it('should handle network failures gracefully', async () => {
      // Mock network failure
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      render(<App />);

      await user.click(screen.getByText('Strategies'));

      // Should show offline mode
      expect(screen.getByText('Offline Mode')).toBeInTheDocument();
      expect(screen.getByText('Limited functionality available')).toBeInTheDocument();

      // Should still allow basic operations
      await user.click(screen.getByText('Create Strategy (Offline)'));
      
      expect(screen.getByText('Creating strategy offline')).toBeInTheDocument();
      expect(screen.getByText('Will sync when connection restored')).toBeInTheDocument();
    });
  });
});
/**
 * Complete User Workflows End-to-End Tests
 * 
 * Tests complete user scenarios from start to finish to ensure
 * the entire strategy management system works cohesively.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedPlaybooks } from '../../../components/EnhancedPlaybooks';
import { TradeStrategyIntegration } from '../../../components/trade-strategy/TradeStrategyIntegration';
import { StrategyMigrationWizard } from '../../../components/StrategyMigrationWizard';
import { StrategyDetailView } from '../../../components/strategy-detail/StrategyDetailView';
import { BacktestingPanel } from '../../../components/backtesting/BacktestingPanel';
import { AIInsightsPanel } from '../../../components/ai-insights/AIInsightsPanel';
import { DisciplineScorePanel } from '../../../components/discipline/DisciplineScorePanel';
import { AlertsPanel } from '../../../components/alerts/AlertsPanel';
import { ExportPanel } from '../../../components/export/ExportPanel';
import type { ProfessionalStrategy, Trade } from '../../../types/strategy';
import type { Playbook } from '../../../types/playbook';

// Mock data for testing
const mockPlaybook: Playbook = {
  id: 'playbook-1',
  title: 'Basic Trend Following',
  description: 'Simple trend following strategy',
  color: '#3B82F6',
  marketConditions: 'Trending markets',
  entryParameters: 'Price above 200 MA, RSI > 50',
  exitParameters: 'Price below 200 MA or 2% stop loss',
  timesUsed: 25,
  tradesWon: 15,
  tradesLost: 10,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const mockTrade: Trade = {
  id: 'trade-1',
  symbol: 'EURUSD',
  entryPrice: 1.1000,
  exitPrice: 1.1200,
  quantity: 10000,
  side: 'long',
  entryTime: '2024-01-10T10:00:00Z',
  exitTime: '2024-01-10T15:00:00Z',
  pnl: 200,
  commission: 5,
  notes: 'Good trend following trade'
};

const mockProfessionalStrategy: ProfessionalStrategy = {
  id: 'strategy-1',
  title: 'Professional Trend Following',
  description: 'Enhanced trend following with professional structure',
  color: '#3B82F6',
  methodology: 'Technical',
  primaryTimeframe: '1H',
  assetClasses: ['Forex'],
  setupConditions: {
    marketEnvironment: 'Trending market with clear direction',
    technicalConditions: ['Price above 200 MA', 'RSI > 50', 'Volume above average'],
    volatilityRequirements: 'Medium to high volatility'
  },
  entryTriggers: {
    primarySignal: 'Breakout above resistance',
    confirmationSignals: ['Volume spike', 'Momentum confirmation'],
    timingCriteria: 'London or New York session'
  },
  riskManagement: {
    positionSizingMethod: { type: 'FixedPercentage', parameters: { percentage: 2 } },
    maxRiskPerTrade: 2,
    stopLossRule: { type: 'ATRBased', parameters: { multiplier: 2 }, description: '2x ATR stop' },
    takeProfitRule: { type: 'RiskRewardRatio', parameters: { ratio: 2 }, description: '1:2 RR' },
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
    confidenceLevel: 85,
    statisticallySignificant: false,
    monthlyReturns: [
      { month: '2024-01', return: 5.2, trades: 8, winRate: 62.5 },
      { month: '2024-02', return: 3.8, trades: 9, winRate: 55.6 },
      { month: '2024-03', return: 7.1, trades: 8, winRate: 62.5 }
    ],
    performanceTrend: 'Improving',
    lastCalculated: '2024-03-15T12:00:00Z'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-03-15T12:00:00Z',
  version: 1,
  isActive: true
};

describe('Complete User Workflows E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset any global state or mocks
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Workflow 1: New User Strategy Creation', () => {
    it('should guide new user through complete strategy creation process', async () => {
      // Render the main strategy management interface
      render(<EnhancedPlaybooks />);

      // Step 1: User sees empty state and clicks to create first strategy
      expect(screen.getByText(/create your first strategy/i)).toBeInTheDocument();
      
      const createButton = screen.getByRole('button', { name: /create strategy/i });
      await user.click(createButton);

      // Step 2: Professional strategy builder opens
      await waitFor(() => {
        expect(screen.getByText(/professional strategy builder/i)).toBeInTheDocument();
      });

      // Step 3: User fills in basic information
      const titleInput = screen.getByLabelText(/strategy title/i);
      await user.type(titleInput, 'My First Professional Strategy');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'A comprehensive trend following strategy');

      // Step 4: User selects methodology
      const methodologySelect = screen.getByLabelText(/methodology/i);
      await user.selectOptions(methodologySelect, 'Technical');

      // Step 5: User defines setup conditions
      const marketEnvironmentInput = screen.getByLabelText(/market environment/i);
      await user.type(marketEnvironmentInput, 'Trending market with clear direction');

      // Step 6: User defines entry triggers
      const primarySignalInput = screen.getByLabelText(/primary signal/i);
      await user.type(primarySignalInput, 'Breakout above resistance');

      // Step 7: User configures risk management
      const positionSizeSelect = screen.getByLabelText(/position sizing method/i);
      await user.selectOptions(positionSizeSelect, 'FixedPercentage');

      const riskPerTradeInput = screen.getByLabelText(/max risk per trade/i);
      await user.clear(riskPerTradeInput);
      await user.type(riskPerTradeInput, '2');

      // Step 8: User saves the strategy
      const saveButton = screen.getByRole('button', { name: /save strategy/i });
      await user.click(saveButton);

      // Step 9: Verify strategy appears in dashboard
      await waitFor(() => {
        expect(screen.getByText('My First Professional Strategy')).toBeInTheDocument();
        expect(screen.getByText(/profit factor/i)).toBeInTheDocument();
        expect(screen.getByText(/expectancy/i)).toBeInTheDocument();
      });

      // Step 10: Verify performance metrics are initialized
      expect(screen.getByText(/0 trades/i)).toBeInTheDocument();
      expect(screen.getByText(/insufficient data/i)).toBeInTheDocument();
    });

    it('should validate required fields and show helpful error messages', async () => {
      render(<EnhancedPlaybooks />);

      const createButton = screen.getByRole('button', { name: /create strategy/i });
      await user.click(createButton);

      // Try to save without required fields
      const saveButton = screen.getByRole('button', { name: /save strategy/i });
      await user.click(saveButton);

      // Verify validation messages appear
      await waitFor(() => {
        expect(screen.getByText(/strategy title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/methodology must be selected/i)).toBeInTheDocument();
      });

      // Fill in title and verify error disappears
      const titleInput = screen.getByLabelText(/strategy title/i);
      await user.type(titleInput, 'Test Strategy');

      await waitFor(() => {
        expect(screen.queryByText(/strategy title is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Workflow 2: Playbook Migration to Professional Strategy', () => {
    it('should migrate existing playbook to professional strategy with data preservation', async () => {
      // Mock existing playbooks
      const mockPlaybooks = [mockPlaybook];
      
      render(<StrategyMigrationWizard playbooks={mockPlaybooks} />);

      // Step 1: User sees migration wizard with existing playbooks
      expect(screen.getByText(/migrate your playbooks/i)).toBeInTheDocument();
      expect(screen.getByText('Basic Trend Following')).toBeInTheDocument();

      // Step 2: User selects playbook to migrate
      const migrateButton = screen.getByRole('button', { name: /migrate this playbook/i });
      await user.click(migrateButton);

      // Step 3: Migration analysis shows preserved data
      await waitFor(() => {
        expect(screen.getByText(/migration analysis/i)).toBeInTheDocument();
        expect(screen.getByText(/25 trades will be preserved/i)).toBeInTheDocument();
        expect(screen.getByText(/15 wins, 10 losses/i)).toBeInTheDocument();
      });

      // Step 4: User completes professional fields
      const methodologySelect = screen.getByLabelText(/methodology/i);
      await user.selectOptions(methodologySelect, 'Technical');

      const primaryTimeframeInput = screen.getByLabelText(/primary timeframe/i);
      await user.type(primaryTimeframeInput, '1H');

      // Step 5: User confirms migration
      const confirmButton = screen.getByRole('button', { name: /confirm migration/i });
      await user.click(confirmButton);

      // Step 6: Verify successful migration
      await waitFor(() => {
        expect(screen.getByText(/migration completed successfully/i)).toBeInTheDocument();
        expect(screen.getByText(/professional trend following/i)).toBeInTheDocument();
      });

      // Step 7: Verify data preservation
      expect(screen.getByText(/25 trades/i)).toBeInTheDocument();
      expect(screen.getByText(/60% win rate/i)).toBeInTheDocument();
    });

    it('should handle migration rollback if user cancels', async () => {
      const mockPlaybooks = [mockPlaybook];
      
      render(<StrategyMigrationWizard playbooks={mockPlaybooks} />);

      const migrateButton = screen.getByRole('button', { name: /migrate this playbook/i });
      await user.click(migrateButton);

      // User decides to cancel migration
      const cancelButton = screen.getByRole('button', { name: /cancel migration/i });
      await user.click(cancelButton);

      // Verify rollback confirmation
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to cancel/i)).toBeInTheDocument();
      });

      const confirmCancelButton = screen.getByRole('button', { name: /yes, cancel/i });
      await user.click(confirmCancelButton);

      // Verify original playbook is preserved
      await waitFor(() => {
        expect(screen.getByText('Basic Trend Following')).toBeInTheDocument();
        expect(screen.queryByText(/professional trend following/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Workflow 3: Trade Assignment and Performance Updates', () => {
    it('should assign trade to strategy and update performance metrics in real-time', async () => {
      const mockStrategies = [mockProfessionalStrategy];
      const mockTrades = [mockTrade];

      render(
        <TradeStrategyIntegration 
          trade={mockTrade}
          availableStrategies={mockStrategies}
          onStrategyAssignment={vi.fn()}
          onPerformanceUpdate={vi.fn()}
        />
      );

      // Step 1: User sees trade details and strategy suggestions
      expect(screen.getByText('EURUSD')).toBeInTheDocument();
      expect(screen.getByText(/suggested strategies/i)).toBeInTheDocument();

      // Step 2: System suggests matching strategy
      expect(screen.getByText('Professional Trend Following')).toBeInTheDocument();
      expect(screen.getByText(/95% match/i)).toBeInTheDocument();

      // Step 3: User assigns trade to strategy
      const assignButton = screen.getByRole('button', { name: /assign to strategy/i });
      await user.click(assignButton);

      // Step 4: Verify assignment confirmation
      await waitFor(() => {
        expect(screen.getByText(/trade assigned successfully/i)).toBeInTheDocument();
      });

      // Step 5: Verify performance update indicator
      expect(screen.getByText(/performance updated/i)).toBeInTheDocument();
      expect(screen.getByText(/+$200 profit/i)).toBeInTheDocument();

      // Step 6: Verify adherence score calculation
      expect(screen.getByText(/adherence score: 92%/i)).toBeInTheDocument();
    });

    it('should handle manual strategy assignment when automatic suggestion is not suitable', async () => {
      const mockStrategies = [mockProfessionalStrategy];

      render(
        <TradeStrategyIntegration 
          trade={mockTrade}
          availableStrategies={mockStrategies}
          onStrategyAssignment={vi.fn()}
          onPerformanceUpdate={vi.fn()}
        />
      );

      // User chooses manual assignment
      const manualButton = screen.getByRole('button', { name: /manual assignment/i });
      await user.click(manualButton);

      // Strategy dropdown appears
      const strategySelect = screen.getByLabelText(/select strategy/i);
      await user.selectOptions(strategySelect, 'strategy-1');

      // User confirms assignment
      const confirmButton = screen.getByRole('button', { name: /confirm assignment/i });
      await user.click(confirmButton);

      // Verify successful assignment
      await waitFor(() => {
        expect(screen.getByText(/trade assigned successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 4: Strategy Analysis and Insights', () => {
    it('should display comprehensive strategy analytics and AI insights', async () => {
      render(<StrategyDetailView strategy={mockProfessionalStrategy} />);

      // Step 1: User sees strategy overview
      expect(screen.getByText('Professional Trend Following')).toBeInTheDocument();
      expect(screen.getByText(/profit factor: 1.8/i)).toBeInTheDocument();

      // Step 2: User navigates to performance analytics
      const analyticsTab = screen.getByRole('tab', { name: /performance analytics/i });
      await user.click(analyticsTab);

      // Step 3: Verify detailed metrics display
      await waitFor(() => {
        expect(screen.getByText(/expectancy: \$45.50/i)).toBeInTheDocument();
        expect(screen.getByText(/max drawdown: 8.5%/i)).toBeInTheDocument();
        expect(screen.getByText(/sharpe ratio/i)).toBeInTheDocument();
      });

      // Step 4: User views AI insights
      const insightsTab = screen.getByRole('tab', { name: /ai insights/i });
      await user.click(insightsTab);

      // Step 5: Verify AI insights are displayed
      await waitFor(() => {
        expect(screen.getByText(/performance patterns detected/i)).toBeInTheDocument();
        expect(screen.getByText(/optimization suggestions/i)).toBeInTheDocument();
      });

      // Step 6: User views linked trades
      const tradesTab = screen.getByRole('tab', { name: /linked trades/i });
      await user.click(tradesTab);

      // Step 7: Verify trade history integration
      await waitFor(() => {
        expect(screen.getByText(/25 trades/i)).toBeInTheDocument();
        expect(screen.getByText(/view in trade review/i)).toBeInTheDocument();
      });
    });

    it('should show statistical significance warnings for insufficient data', async () => {
      const strategyWithLowSample = {
        ...mockProfessionalStrategy,
        performance: {
          ...mockProfessionalStrategy.performance,
          totalTrades: 5,
          sampleSize: 5,
          statisticallySignificant: false
        }
      };

      render(<StrategyDetailView strategy={strategyWithLowSample} />);

      // Verify warning is displayed
      expect(screen.getByText(/insufficient data for reliable analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/need at least 30 trades/i)).toBeInTheDocument();
    });
  });

  describe('Workflow 5: Backtesting and Strategy Optimization', () => {
    it('should run backtest and compare strategy versions', async () => {
      render(<BacktestingPanel strategy={mockProfessionalStrategy} />);

      // Step 1: User initiates backtest
      const backtestButton = screen.getByRole('button', { name: /run backtest/i });
      await user.click(backtestButton);

      // Step 2: Backtest configuration
      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '2024-01-01');

      const endDateInput = screen.getByLabelText(/end date/i);
      await user.type(endDateInput, '2024-03-31');

      // Step 3: Start backtest
      const startButton = screen.getByRole('button', { name: /start backtest/i });
      await user.click(startButton);

      // Step 4: Verify backtest progress
      await waitFor(() => {
        expect(screen.getByText(/running backtest/i)).toBeInTheDocument();
      });

      // Step 5: Verify results display
      await waitFor(() => {
        expect(screen.getByText(/backtest completed/i)).toBeInTheDocument();
        expect(screen.getByText(/hypothetical performance/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 6: User modifies strategy parameters
      const modifyButton = screen.getByRole('button', { name: /modify parameters/i });
      await user.click(modifyButton);

      // Step 7: User changes risk-reward ratio
      const rrInput = screen.getByLabelText(/risk reward ratio/i);
      await user.clear(rrInput);
      await user.type(rrInput, '3');

      // Step 8: Run comparison backtest
      const compareButton = screen.getByRole('button', { name: /compare versions/i });
      await user.click(compareButton);

      // Step 9: Verify comparison results
      await waitFor(() => {
        expect(screen.getByText(/version comparison/i)).toBeInTheDocument();
        expect(screen.getByText(/original vs modified/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 6: Discipline Tracking and Gamification', () => {
    it('should track discipline scores and award achievements', async () => {
      render(<DisciplineScorePanel userId="user123" />);

      // Step 1: User sees current discipline metrics
      expect(screen.getByText(/discipline score/i)).toBeInTheDocument();
      expect(screen.getByText(/current streak/i)).toBeInTheDocument();

      // Step 2: User views achievement progress
      const achievementsTab = screen.getByRole('tab', { name: /achievements/i });
      await user.click(achievementsTab);

      // Step 3: Verify achievements display
      await waitFor(() => {
        expect(screen.getByText(/consistency master/i)).toBeInTheDocument();
        expect(screen.getByText(/risk manager/i)).toBeInTheDocument();
      });

      // Step 4: User views detailed adherence breakdown
      const detailsTab = screen.getByRole('tab', { name: /details/i });
      await user.click(detailsTab);

      // Step 5: Verify adherence metrics
      await waitFor(() => {
        expect(screen.getByText(/entry timing adherence/i)).toBeInTheDocument();
        expect(screen.getByText(/position size adherence/i)).toBeInTheDocument();
        expect(screen.getByText(/stop loss adherence/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 7: Alerts and Notifications', () => {
    it('should configure alerts and receive notifications', async () => {
      render(<AlertsPanel userId="user123" />);

      // Step 1: User configures performance alerts
      const configureButton = screen.getByRole('button', { name: /configure alerts/i });
      await user.click(configureButton);

      // Step 2: Set drawdown threshold
      const drawdownInput = screen.getByLabelText(/max drawdown threshold/i);
      await user.type(drawdownInput, '10');

      // Step 3: Set profit target alert
      const profitInput = screen.getByLabelText(/profit target/i);
      await user.type(profitInput, '1000');

      // Step 4: Save alert preferences
      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      // Step 5: Verify alerts are active
      await waitFor(() => {
        expect(screen.getByText(/alerts configured successfully/i)).toBeInTheDocument();
        expect(screen.getByText(/2 active alerts/i)).toBeInTheDocument();
      });

      // Step 6: View current alerts
      const alertsTab = screen.getByRole('tab', { name: /active alerts/i });
      await user.click(alertsTab);

      // Step 7: Verify alert list
      await waitFor(() => {
        expect(screen.getByText(/drawdown alert: 10%/i)).toBeInTheDocument();
        expect(screen.getByText(/profit target: \$1,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 8: Data Export and Reporting', () => {
    it('should export strategy data in multiple formats', async () => {
      render(<ExportPanel strategies={[mockProfessionalStrategy]} />);

      // Step 1: User selects export format
      const formatSelect = screen.getByLabelText(/export format/i);
      await user.selectOptions(formatSelect, 'PDF');

      // Step 2: User customizes report template
      const templateButton = screen.getByRole('button', { name: /customize template/i });
      await user.click(templateButton);

      // Step 3: Select report sections
      const performanceCheckbox = screen.getByLabelText(/include performance metrics/i);
      await user.click(performanceCheckbox);

      const tradesCheckbox = screen.getByLabelText(/include trade history/i);
      await user.click(tradesCheckbox);

      // Step 4: Generate export
      const exportButton = screen.getByRole('button', { name: /generate export/i });
      await user.click(exportButton);

      // Step 5: Verify export progress
      await waitFor(() => {
        expect(screen.getByText(/generating report/i)).toBeInTheDocument();
      });

      // Step 6: Verify download ready
      await waitFor(() => {
        expect(screen.getByText(/download ready/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
      });
    });

    it('should create secure share links for strategy performance', async () => {
      render(<ExportPanel strategies={[mockProfessionalStrategy]} />);

      // User creates secure share link
      const shareButton = screen.getByRole('button', { name: /create share link/i });
      await user.click(shareButton);

      // Configure sharing options
      const anonymizeCheckbox = screen.getByLabelText(/anonymize data/i);
      await user.click(anonymizeCheckbox);

      const expirationSelect = screen.getByLabelText(/link expiration/i);
      await user.selectOptions(expirationSelect, '7days');

      // Generate link
      const generateButton = screen.getByRole('button', { name: /generate link/i });
      await user.click(generateButton);

      // Verify link creation
      await waitFor(() => {
        expect(screen.getByText(/secure link created/i)).toBeInTheDocument();
        expect(screen.getByText(/expires in 7 days/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow 9: Error Handling and Recovery', () => {
    it('should handle network errors gracefully and provide recovery options', async () => {
      // Mock network error
      const mockError = new Error('Network error');
      
      render(<EnhancedPlaybooks />);

      // Simulate network error during strategy creation
      const createButton = screen.getByRole('button', { name: /create strategy/i });
      await user.click(createButton);

      // Fill in strategy details
      const titleInput = screen.getByLabelText(/strategy title/i);
      await user.type(titleInput, 'Test Strategy');

      // Mock save failure
      const saveButton = screen.getByRole('button', { name: /save strategy/i });
      await user.click(saveButton);

      // Verify error message and recovery options
      await waitFor(() => {
        expect(screen.getByText(/failed to save strategy/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
      });

      // User chooses to retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify retry attempt
      await waitFor(() => {
        expect(screen.getByText(/retrying save/i)).toBeInTheDocument();
      });
    });

    it('should preserve user data during unexpected errors', async () => {
      render(<EnhancedPlaybooks />);

      const createButton = screen.getByRole('button', { name: /create strategy/i });
      await user.click(createButton);

      // User fills in extensive strategy details
      const titleInput = screen.getByLabelText(/strategy title/i);
      await user.type(titleInput, 'Complex Strategy with Lots of Details');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'This is a very detailed strategy description that the user spent time writing...');

      // Simulate error that triggers auto-save
      // Verify draft is preserved
      expect(screen.getByText(/draft saved automatically/i)).toBeInTheDocument();

      // User can recover from draft
      const recoverButton = screen.getByRole('button', { name: /recover draft/i });
      expect(recoverButton).toBeInTheDocument();
    });
  });

  describe('Workflow 10: Performance Under Load', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeStrategyList = Array.from({ length: 100 }, (_, i) => ({
        ...mockProfessionalStrategy,
        id: `strategy-${i}`,
        title: `Strategy ${i}`
      }));

      render(<EnhancedPlaybooks strategies={largeStrategyList} />);

      // Verify virtualization works
      expect(screen.getByText('Strategy 0')).toBeInTheDocument();
      expect(screen.queryByText('Strategy 99')).not.toBeInTheDocument();

      // Test scrolling performance
      const strategyList = screen.getByRole('list');
      fireEvent.scroll(strategyList, { target: { scrollTop: 5000 } });

      // Verify lazy loading
      await waitFor(() => {
        expect(screen.getByText(/loading more strategies/i)).toBeInTheDocument();
      });
    });

    it('should maintain responsiveness during intensive calculations', async () => {
      const strategyWithManyTrades = {
        ...mockProfessionalStrategy,
        performance: {
          ...mockProfessionalStrategy.performance,
          totalTrades: 10000
        }
      };

      render(<StrategyDetailView strategy={strategyWithManyTrades} />);

      // Verify performance metrics load progressively
      expect(screen.getByText(/calculating advanced metrics/i)).toBeInTheDocument();

      // UI should remain responsive
      const tabButton = screen.getByRole('tab', { name: /performance analytics/i });
      await user.click(tabButton);

      // Verify tab switches immediately even during calculations
      expect(screen.getByRole('tabpanel', { name: /performance analytics/i })).toBeInTheDocument();
    });
  });
});

// Helper function to simulate realistic user interactions
const simulateRealisticTyping = async (user: any, element: HTMLElement, text: string) => {
  // Simulate realistic typing speed with occasional pauses
  for (let i = 0; i < text.length; i++) {
    await user.type(element, text[i]);
    if (Math.random() < 0.1) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    }
  }
};

// Helper function to simulate realistic user decision-making
const simulateUserThinking = async (minMs: number = 500, maxMs: number = 2000) => {
  const thinkingTime = minMs + Math.random() * (maxMs - minMs);
  await new Promise(resolve => setTimeout(resolve, thinkingTime));
};
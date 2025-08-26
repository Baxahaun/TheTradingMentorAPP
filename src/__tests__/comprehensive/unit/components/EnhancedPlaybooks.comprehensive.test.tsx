import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedPlaybooks } from '@/components/EnhancedPlaybooks';
import { createMockStrategy, createMockPerformanceData } from '../../setup';
import type { ProfessionalStrategy } from '@/types/strategy';

// Mock the services
vi.mock('@/services/StrategyPerformanceService');
vi.mock('@/services/StrategyAttributionService');
vi.mock('@/services/AIInsightsService');

const mockStrategies: ProfessionalStrategy[] = [
  {
    ...createMockStrategy(),
    id: 'strategy-1',
    title: 'EUR/USD Breakout',
    performance: {
      ...createMockPerformanceData(),
      profitFactor: 1.8,
      winRate: 65,
      expectancy: 45,
    },
  },
  {
    ...createMockStrategy(),
    id: 'strategy-2',
    title: 'Gold Momentum',
    performance: {
      ...createMockPerformanceData(),
      profitFactor: 1.2,
      winRate: 55,
      expectancy: 25,
    },
  },
];

describe('EnhancedPlaybooks - Comprehensive Component Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render dashboard view by default', () => {
      render(<EnhancedPlaybooks />);
      
      expect(screen.getByText('Strategy Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    });

    it('should display strategy cards with KPIs', () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      expect(screen.getByText('EUR/USD Breakout')).toBeInTheDocument();
      expect(screen.getByText('Gold Momentum')).toBeInTheDocument();
      
      // Check for KPI displays
      expect(screen.getByText('1.8')).toBeInTheDocument(); // Profit Factor
      expect(screen.getByText('65%')).toBeInTheDocument(); // Win Rate
    });

    it('should show statistical significance indicators', () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      expect(screen.getByText('Statistically Significant')).toBeInTheDocument();
    });

    it('should handle empty strategies list', () => {
      render(<EnhancedPlaybooks strategies={[]} />);
      
      expect(screen.getByText('No strategies found')).toBeInTheDocument();
      expect(screen.getByText('Create your first strategy')).toBeInTheDocument();
    });
  });

  describe('Navigation and View Switching', () => {
    it('should switch to builder view when create button is clicked', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      const createButton = screen.getByText('Create Strategy');
      await user.click(createButton);
      
      expect(screen.getByText('Professional Strategy Builder')).toBeInTheDocument();
      expect(screen.getByText('Methodology')).toBeInTheDocument();
    });

    it('should switch to detail view when strategy is selected', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      const strategyCard = screen.getByText('EUR/USD Breakout');
      await user.click(strategyCard);
      
      expect(screen.getByText('Strategy Details')).toBeInTheDocument();
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    });

    it('should show migration wizard when needed', async () => {
      const strategiesNeedingMigration = [
        {
          ...mockStrategies[0],
          version: 0, // Old version needing migration
        },
      ];
      
      render(<EnhancedPlaybooks strategies={strategiesNeedingMigration} />);
      
      expect(screen.getByText('Migration Required')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Professional')).toBeInTheDocument();
    });

    it('should handle back navigation correctly', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      // Go to builder
      await user.click(screen.getByText('Create Strategy'));
      expect(screen.getByText('Professional Strategy Builder')).toBeInTheDocument();
      
      // Go back
      await user.click(screen.getByText('Back to Dashboard'));
      expect(screen.getByText('Strategy Dashboard')).toBeInTheDocument();
    });
  });

  describe('Strategy Management', () => {
    it('should create new strategy successfully', async () => {
      const onStrategySave = vi.fn();
      render(<EnhancedPlaybooks strategies={mockStrategies} onStrategySave={onStrategySave} />);
      
      await user.click(screen.getByText('Create Strategy'));
      
      // Fill out strategy form
      await user.type(screen.getByLabelText('Strategy Title'), 'New Test Strategy');
      await user.type(screen.getByLabelText('Description'), 'Test description');
      await user.selectOptions(screen.getByLabelText('Methodology'), 'Technical');
      
      await user.click(screen.getByText('Save Strategy'));
      
      await waitFor(() => {
        expect(onStrategySave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Test Strategy',
            methodology: 'Technical',
          })
        );
      });
    });

    it('should edit existing strategy', async () => {
      const onStrategyUpdate = vi.fn();
      render(<EnhancedPlaybooks strategies={mockStrategies} onStrategyUpdate={onStrategyUpdate} />);
      
      // Click edit button on first strategy
      const editButton = screen.getAllByText('Edit')[0];
      await user.click(editButton);
      
      // Modify strategy
      const titleInput = screen.getByDisplayValue('EUR/USD Breakout');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated EUR/USD Strategy');
      
      await user.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(onStrategyUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Updated EUR/USD Strategy',
          })
        );
      });
    });

    it('should delete strategy with confirmation', async () => {
      const onStrategyDelete = vi.fn();
      render(<EnhancedPlaybooks strategies={mockStrategies} onStrategyDelete={onStrategyDelete} />);
      
      // Click delete button
      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);
      
      // Confirm deletion
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      await user.click(screen.getByText('Yes, Delete'));
      
      await waitFor(() => {
        expect(onStrategyDelete).toHaveBeenCalledWith('strategy-1');
      });
    });

    it('should cancel deletion when user declines', async () => {
      const onStrategyDelete = vi.fn();
      render(<EnhancedPlaybooks strategies={mockStrategies} onStrategyDelete={onStrategyDelete} />);
      
      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);
      
      await user.click(screen.getByText('Cancel'));
      
      expect(onStrategyDelete).not.toHaveBeenCalled();
      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });
  });

  describe('Performance Dashboard Features', () => {
    it('should sort strategies by different metrics', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      // Default sort should be by profit factor (highest first)
      const strategyCards = screen.getAllByTestId('strategy-card');
      expect(strategyCards[0]).toHaveTextContent('EUR/USD Breakout'); // Higher profit factor
      
      // Sort by win rate
      await user.click(screen.getByText('Sort by Win Rate'));
      
      await waitFor(() => {
        const updatedCards = screen.getAllByTestId('strategy-card');
        expect(updatedCards[0]).toHaveTextContent('EUR/USD Breakout'); // Higher win rate
      });
    });

    it('should filter strategies by performance criteria', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      // Apply filter for high-performing strategies
      await user.click(screen.getByText('Filters'));
      await user.click(screen.getByText('High Performers Only'));
      
      await waitFor(() => {
        expect(screen.getByText('EUR/USD Breakout')).toBeInTheDocument();
        expect(screen.queryByText('Gold Momentum')).not.toBeInTheDocument();
      });
    });

    it('should display performance trends correctly', () => {
      const strategiesWithTrends = mockStrategies.map(s => ({
        ...s,
        performance: {
          ...s.performance,
          performanceTrend: 'Improving' as const,
        },
      }));
      
      render(<EnhancedPlaybooks strategies={strategiesWithTrends} />);
      
      expect(screen.getAllByText('↗ Improving')).toHaveLength(2);
    });

    it('should show comparison panel when multiple strategies selected', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      // Select multiple strategies
      await user.click(screen.getAllByRole('checkbox')[0]);
      await user.click(screen.getAllByRole('checkbox')[1]);
      
      expect(screen.getByText('Compare Strategies')).toBeInTheDocument();
      expect(screen.getByText('Side-by-side Analysis')).toBeInTheDocument();
    });
  });

  describe('AI Insights Integration', () => {
    it('should display AI insights when available', () => {
      const strategiesWithInsights = mockStrategies.map(s => ({
        ...s,
        aiInsights: [
          {
            type: 'Performance' as const,
            message: 'This strategy performs 23% better on Tuesdays',
            confidence: 0.85,
            actionable: true,
            supportingData: {},
          },
        ],
      }));
      
      render(<EnhancedPlaybooks strategies={strategiesWithInsights} />);
      
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
      expect(screen.getByText('This strategy performs 23% better on Tuesdays')).toBeInTheDocument();
    });

    it('should show insight confidence levels', () => {
      const strategiesWithInsights = mockStrategies.map(s => ({
        ...s,
        aiInsights: [
          {
            type: 'Performance' as const,
            message: 'High confidence insight',
            confidence: 0.95,
            actionable: true,
            supportingData: {},
          },
        ],
      }));
      
      render(<EnhancedPlaybooks strategies={strategiesWithInsights} />);
      
      expect(screen.getByText('95% confidence')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
      expect(screen.getByText('☰')).toBeInTheDocument(); // Mobile menu button
    });

    it('should show desktop layout on larger screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when strategy loading fails', () => {
      const errorMessage = 'Failed to load strategies';
      render(<EnhancedPlaybooks error={errorMessage} />);
      
      expect(screen.getByText('Error loading strategies')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      const onRetry = vi.fn();
      render(<EnhancedPlaybooks error="Network error" onRetry={onRetry} />);
      
      await user.click(screen.getByText('Retry'));
      
      expect(onRetry).toHaveBeenCalled();
    });

    it('should handle strategy save errors gracefully', async () => {
      const onStrategySave = vi.fn().mockRejectedValue(new Error('Save failed'));
      render(<EnhancedPlaybooks strategies={mockStrategies} onStrategySave={onStrategySave} />);
      
      await user.click(screen.getByText('Create Strategy'));
      await user.type(screen.getByLabelText('Strategy Title'), 'Test Strategy');
      await user.click(screen.getByText('Save Strategy'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save strategy')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Strategy Management Dashboard');
      expect(screen.getByRole('button', { name: 'Create Strategy' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByText('Create Strategy')).toHaveFocus();
      
      await user.tab();
      expect(screen.getAllByTestId('strategy-card')[0]).toHaveFocus();
    });

    it('should announce screen reader updates', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      await user.click(screen.getByText('Create Strategy'));
      
      expect(screen.getByRole('status')).toHaveTextContent('Navigated to strategy builder');
    });
  });

  describe('Performance Optimization', () => {
    it('should virtualize large strategy lists', () => {
      const manyStrategies = Array.from({ length: 1000 }, (_, i) => ({
        ...createMockStrategy(),
        id: `strategy-${i}`,
        title: `Strategy ${i}`,
      }));
      
      render(<EnhancedPlaybooks strategies={manyStrategies} />);
      
      // Should only render visible items
      const visibleCards = screen.getAllByTestId('strategy-card');
      expect(visibleCards.length).toBeLessThan(50);
    });

    it('should lazy load strategy details', async () => {
      render(<EnhancedPlaybooks strategies={mockStrategies} />);
      
      const strategyCard = screen.getByText('EUR/USD Breakout');
      await user.click(strategyCard);
      
      // Should show loading state initially
      expect(screen.getByText('Loading strategy details...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });
    });

    it('should debounce search input', async () => {
      const onSearch = vi.fn();
      render(<EnhancedPlaybooks strategies={mockStrategies} onSearch={onSearch} />);
      
      const searchInput = screen.getByPlaceholderText('Search strategies...');
      
      await user.type(searchInput, 'EUR');
      
      // Should not call immediately
      expect(onSearch).not.toHaveBeenCalled();
      
      // Should call after debounce delay
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('EUR');
      }, { timeout: 1000 });
    });
  });
});
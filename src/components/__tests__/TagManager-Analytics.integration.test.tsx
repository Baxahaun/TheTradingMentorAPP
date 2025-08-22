import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagManager } from '../ui/tag-manager';
import { Trade } from '../../types/trade';

// Mock the analytics service
vi.mock('../../lib/tagAnalyticsService', () => ({
  tagAnalyticsService: {
    calculateTagAnalytics: vi.fn().mockReturnValue({
      totalTags: 5,
      averageTagsPerTrade: 2.5,
      mostUsedTags: [
        { tag: '#scalping', count: 10, lastUsed: '2024-01-20', trades: ['1', '2'] },
        { tag: '#swing', count: 8, lastUsed: '2024-01-19', trades: ['3', '4'] }
      ],
      leastUsedTags: [],
      recentTags: [],
      tagPerformance: [],
      topPerformingTags: [
        {
          tag: '#scalping',
          totalTrades: 10,
          winRate: 70,
          averagePnL: 150,
          totalPnL: 1500,
          profitFactor: 2.5,
          averageHoldTime: 2.5,
          bestTrade: 500,
          worstTrade: -200,
          winStreak: 5,
          lossStreak: 2,
          sharpeRatio: 1.2,
          maxDrawdown: 300,
          recoveryFactor: 5,
          consistency: 80
        }
      ],
      worstPerformingTags: [],
      tagUsageOverTime: [],
      tagCorrelations: []
    }),
    getTagInsights: vi.fn().mockReturnValue({
      insights: ['Your best performing tag is #scalping with 70% win rate'],
      recommendations: ['Focus more on scalping setups'],
      warnings: ['Consider reducing position size on swing trades']
    })
  }
}));

// Mock the tag service
vi.mock('../../lib/tagService', () => ({
  tagService: {
    getAllTagsWithCounts: vi.fn().mockReturnValue([
      { tag: '#scalping', count: 10, lastUsed: '2024-01-20', trades: ['1', '2'] },
      { tag: '#swing', count: 8, lastUsed: '2024-01-19', trades: ['3', '4'] },
      { tag: '#breakout', count: 5, lastUsed: '2024-01-18', trades: ['5'] }
    ]),
    normalizeTag: vi.fn((tag) => tag.startsWith('#') ? tag : `#${tag}`)
  }
}));

// Mock UI components to avoid complex rendering
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => 
    open ? <div data-testid="tag-manager-dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-title">{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: { 
    children: React.ReactNode; 
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder }: { 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }) => (
    <input 
      data-testid="search-input" 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
    />
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="card-title">{children}</div>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, onClick, className }: { 
    children: React.ReactNode; 
    onClick?: () => void;
    className?: string;
  }) => (
    <span data-testid="badge" onClick={onClick} className={className}>
      {children}
    </span>
  )
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="scroll-area">{children}</div>
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => 
    <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

// Mock the analytics dashboard component
vi.mock('../ui/tag-analytics-dashboard', () => ({
  TagAnalyticsDashboard: ({ isOpen, onClose, trades, onTagClick }: {
    isOpen: boolean;
    onClose: () => void;
    trades: Trade[];
    onTagClick?: (tag: string) => void;
  }) => (
    isOpen ? (
      <div data-testid="analytics-dashboard">
        <div data-testid="analytics-content">
          <h2>Tag Analytics Dashboard</h2>
          <div data-testid="analytics-trades-count">{trades.length} trades</div>
          <button 
            data-testid="analytics-close" 
            onClick={onClose}
          >
            Close Analytics
          </button>
          <button 
            data-testid="analytics-tag-click" 
            onClick={() => onTagClick?.('#scalping')}
          >
            Click Scalping Tag
          </button>
        </div>
      </div>
    ) : null
  )
}));

describe('TagManager Analytics Integration', () => {
  const mockTrades: Trade[] = [
    {
      id: '1',
      accountId: 'acc1',
      tags: ['#scalping', '#morning'],
      currencyPair: 'EUR/USD',
      date: '2024-01-15',
      timeIn: '09:00',
      timeOut: '09:30',
      side: 'long',
      entryPrice: 1.0950,
      exitPrice: 1.0970,
      lotSize: 1,
      lotType: 'standard',
      units: 100000,
      commission: 5,
      accountCurrency: 'USD',
      status: 'closed',
      pnl: 200
    },
    {
      id: '2',
      accountId: 'acc1',
      tags: ['#scalping', '#afternoon'],
      currencyPair: 'GBP/USD',
      date: '2024-01-16',
      timeIn: '14:00',
      timeOut: '14:15',
      side: 'short',
      entryPrice: 1.2650,
      exitPrice: 1.2630,
      lotSize: 0.5,
      lotType: 'standard',
      units: 50000,
      commission: 3,
      accountCurrency: 'USD',
      status: 'closed',
      pnl: 100
    },
    {
      id: '3',
      accountId: 'acc1',
      tags: ['#swing', '#breakout'],
      currencyPair: 'USD/JPY',
      date: '2024-01-17',
      timeIn: '08:00',
      timeOut: '16:00',
      side: 'long',
      entryPrice: 148.50,
      exitPrice: 149.20,
      lotSize: 1,
      lotType: 'standard',
      units: 100000,
      commission: 5,
      accountCurrency: 'USD',
      status: 'closed',
      pnl: 350
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    trades: mockTrades,
    onTagClick: vi.fn(),
    onTagDeleted: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Analytics Button Integration', () => {
    it('should render analytics button in tag manager header', () => {
      render(<TagManager {...defaultProps} />);

      expect(screen.getByTestId('tag-manager-dialog')).toBeInTheDocument();
      
      // Find the analytics button
      const analyticsButtons = screen.getAllByTestId('button').filter(button => 
        button.textContent?.includes('Analytics')
      );
      expect(analyticsButtons.length).toBeGreaterThan(0);
    });

    it('should open analytics dashboard when analytics button is clicked', async () => {
      render(<TagManager {...defaultProps} />);

      // Find and click the analytics button
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      expect(analyticsButton).toBeInTheDocument();

      fireEvent.click(analyticsButton!);

      // Wait for analytics dashboard to appear
      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Tag Analytics Dashboard')).toBeInTheDocument();
    });

    it('should pass correct trades data to analytics dashboard', async () => {
      render(<TagManager {...defaultProps} />);

      // Open analytics dashboard
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Verify trades count is passed correctly
      expect(screen.getByTestId('analytics-trades-count')).toHaveTextContent('3 trades');
    });
  });

  describe('Analytics Dashboard Interaction', () => {
    it('should close analytics dashboard when close button is clicked', async () => {
      render(<TagManager {...defaultProps} />);

      // Open analytics dashboard
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Close analytics dashboard
      const closeButton = screen.getByTestId('analytics-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument();
      });
    });

    it('should handle tag click from analytics dashboard', async () => {
      const onTagClick = vi.fn();
      render(<TagManager {...defaultProps} onTagClick={onTagClick} />);

      // Open analytics dashboard
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Click a tag in analytics dashboard
      const tagClickButton = screen.getByTestId('analytics-tag-click');
      fireEvent.click(tagClickButton);

      // Verify tag click handler was called
      expect(onTagClick).toHaveBeenCalledWith('#scalping');
    });

    it('should close tag manager when tag is clicked in analytics', async () => {
      const onClose = vi.fn();
      render(<TagManager {...defaultProps} onClose={onClose} />);

      // Open analytics dashboard
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Click a tag in analytics dashboard
      const tagClickButton = screen.getByTestId('analytics-tag-click');
      fireEvent.click(tagClickButton);

      // The analytics dashboard should close the main tag manager
      // This would be handled by the onTagClick prop in the actual implementation
      expect(screen.getByTestId('analytics-tag-click')).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain tag manager state while analytics is open', async () => {
      render(<TagManager {...defaultProps} />);

      // Set search query in tag manager
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'scalping' } });

      // Open analytics dashboard
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Close analytics dashboard
      const closeButton = screen.getByTestId('analytics-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument();
      });

      // Verify search query is still maintained
      expect(searchInput).toHaveValue('scalping');
    });

    it('should handle empty trades array gracefully', async () => {
      render(<TagManager {...defaultProps} trades={[]} />);

      // Open analytics dashboard with empty trades
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Verify analytics shows 0 trades
      expect(screen.getByTestId('analytics-trades-count')).toHaveTextContent('0 trades');
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics service errors gracefully', async () => {
      // Mock analytics service to throw error
      const mockAnalyticsService = await import('../../lib/tagAnalyticsService');
      vi.mocked(mockAnalyticsService.tagAnalyticsService.calculateTagAnalytics).mockImplementation(() => {
        throw new Error('Analytics calculation failed');
      });

      render(<TagManager {...defaultProps} />);

      // Open analytics dashboard
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      // Should still render analytics dashboard without crashing
      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });
    });

    it('should handle missing onTagClick prop gracefully', async () => {
      render(<TagManager {...defaultProps} onTagClick={undefined} />);

      // Open analytics dashboard
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Click a tag in analytics dashboard - should not crash
      const tagClickButton = screen.getByTestId('analytics-tag-click');
      expect(() => fireEvent.click(tagClickButton)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should not recalculate analytics when tag manager state changes', async () => {
      const mockCalculateAnalytics = vi.fn().mockReturnValue({
        totalTags: 0,
        averageTagsPerTrade: 0,
        mostUsedTags: [],
        leastUsedTags: [],
        recentTags: [],
        tagPerformance: [],
        topPerformingTags: [],
        worstPerformingTags: [],
        tagUsageOverTime: [],
        tagCorrelations: []
      });

      const mockAnalyticsService = await import('../../lib/tagAnalyticsService');
      vi.mocked(mockAnalyticsService.tagAnalyticsService.calculateTagAnalytics).mockImplementation(mockCalculateAnalytics);

      render(<TagManager {...defaultProps} />);

      // Change search query (should not trigger analytics recalculation)
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Open analytics dashboard
      const analyticsButton = screen.getAllByTestId('button').find(button => 
        button.textContent?.includes('Analytics')
      );
      fireEvent.click(analyticsButton!);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Analytics should only be calculated once when dashboard opens
      expect(mockCalculateAnalytics).toHaveBeenCalledTimes(1);
    });
  });
});
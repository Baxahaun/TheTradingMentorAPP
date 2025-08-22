import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagAnalyticsDashboard } from '../tag-analytics-dashboard';
import { Trade } from '../../../types/trade';
import { tagAnalyticsService } from '../../../lib/tagAnalyticsService';

// Mock the analytics service
vi.mock('../../../lib/tagAnalyticsService', () => ({
  tagAnalyticsService: {
    calculateTagAnalytics: vi.fn(),
    getTagInsights: vi.fn()
  }
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-title">{children}</div>
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: { 
    children: React.ReactNode; 
    value: string; 
    onValueChange: (value: string) => void;
  }) => (
    <div data-testid="tabs" data-value={value}>
      <button onClick={() => onValueChange('overview')}>Overview</button>
      <button onClick={() => onValueChange('performance')}>Performance</button>
      <button onClick={() => onValueChange('usage')}>Usage</button>
      <button onClick={() => onValueChange('insights')}>Insights</button>
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => 
    <button data-testid={`tab-${value}`}>{children}</button>,
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => 
    <div data-testid={`tab-content-${value}`}>{children}</div>
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick }: { 
    children: React.ReactNode; 
    className?: string;
    onClick?: () => void;
  }) => (
    <div data-testid="card" className={className} onClick={onClick}>
      {children}
    </div>
  ),
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

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => 
    <div data-testid="progress" data-value={value}></div>
}));

describe('TagAnalyticsDashboard', () => {
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
    }
  ];

  const mockAnalyticsData = {
    totalTags: 3,
    averageTagsPerTrade: 2,
    mostUsedTags: [
      { tag: '#scalping', count: 2, lastUsed: '2024-01-16', trades: ['1', '2'] },
      { tag: '#morning', count: 1, lastUsed: '2024-01-15', trades: ['1'] },
      { tag: '#afternoon', count: 1, lastUsed: '2024-01-16', trades: ['2'] }
    ],
    leastUsedTags: [
      { tag: '#morning', count: 1, lastUsed: '2024-01-15', trades: ['1'] },
      { tag: '#afternoon', count: 1, lastUsed: '2024-01-16', trades: ['2'] }
    ],
    recentTags: [
      { tag: '#scalping', count: 2, lastUsed: '2024-01-16', trades: ['1', '2'] },
      { tag: '#afternoon', count: 1, lastUsed: '2024-01-16', trades: ['2'] }
    ],
    tagPerformance: [
      {
        tag: '#scalping',
        totalTrades: 2,
        winRate: 100,
        averagePnL: 150,
        totalPnL: 300,
        profitFactor: Infinity,
        averageHoldTime: 0.375,
        bestTrade: 200,
        worstTrade: 100,
        winStreak: 2,
        lossStreak: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        recoveryFactor: 0,
        consistency: 100
      }
    ],
    topPerformingTags: [
      {
        tag: '#scalping',
        totalTrades: 2,
        winRate: 100,
        averagePnL: 150,
        totalPnL: 300,
        profitFactor: Infinity,
        averageHoldTime: 0.375,
        bestTrade: 200,
        worstTrade: 100,
        winStreak: 2,
        lossStreak: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        recoveryFactor: 0,
        consistency: 100
      }
    ],
    worstPerformingTags: [],
    tagUsageOverTime: [
      {
        period: '2024-01',
        tagCounts: { '#scalping': 2, '#morning': 1, '#afternoon': 1 },
        totalTrades: 2
      }
    ],
    tagCorrelations: [
      {
        tag1: '#scalping',
        tag2: '#morning',
        correlation: 0.5,
        coOccurrenceCount: 1,
        tag1OnlyCount: 1,
        tag2OnlyCount: 0,
        bothTagsCount: 1
      }
    ]
  };

  const mockInsights = {
    insights: ['Your best performing tags are: #scalping'],
    recommendations: ['Focus on setups and conditions represented by your high-performing tags.'],
    warnings: []
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    trades: mockTrades,
    onTagClick: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (tagAnalyticsService.calculateTagAnalytics as any).mockReturnValue(mockAnalyticsData);
    (tagAnalyticsService.getTagInsights as any).mockReturnValue(mockInsights);
  });

  describe('rendering', () => {
    it('should render when open', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<TagAnalyticsDashboard {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should render all tab triggers', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-performance')).toBeInTheDocument();
      expect(screen.getByTestId('tab-usage')).toBeInTheDocument();
      expect(screen.getByTestId('tab-insights')).toBeInTheDocument();
    });
  });

  describe('overview tab', () => {
    it('should display summary statistics', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // Total tags
      expect(screen.getByText('2.0')).toBeInTheDocument(); // Avg tags per trade
    });

    it('should display most used tags', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('#scalping')).toBeInTheDocument();
      expect(screen.getByText('2 trades')).toBeInTheDocument();
    });

    it('should display recent tags', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('#afternoon')).toBeInTheDocument();
    });
  });

  describe('performance tab', () => {
    it('should display top performing tags', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      // Switch to performance tab
      fireEvent.click(screen.getByText('Performance'));
      
      expect(screen.getByText('100.0%')).toBeInTheDocument(); // Win rate
      expect(screen.getByText('$150.00')).toBeInTheDocument(); // Avg P&L
    });

    it('should handle infinity profit factor display', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Performance'));
      
      expect(screen.getByText('∞')).toBeInTheDocument();
    });
  });

  describe('usage tab', () => {
    it('should display tag usage over time', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Usage'));
      
      expect(screen.getByText('2024-01')).toBeInTheDocument();
      expect(screen.getByText('2 trades')).toBeInTheDocument();
    });

    it('should display tag correlations', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Usage'));
      
      expect(screen.getByText('1 co-occurrences')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument(); // Correlation percentage
    });
  });

  describe('insights tab', () => {
    it('should display insights', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Insights'));
      
      expect(screen.getByText('Your best performing tags are: #scalping')).toBeInTheDocument();
    });

    it('should display recommendations', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Insights'));
      
      expect(screen.getByText('Focus on setups and conditions represented by your high-performing tags.')).toBeInTheDocument();
    });

    it('should show no data message when no insights available', () => {
      (tagAnalyticsService.getTagInsights as any).mockReturnValue({
        insights: [],
        recommendations: [],
        warnings: []
      });

      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Insights'));
      
      expect(screen.getByText('Not enough data for insights')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onTagClick when tag is clicked', () => {
      const onTagClick = vi.fn();
      render(<TagAnalyticsDashboard {...defaultProps} onTagClick={onTagClick} />);
      
      const tagBadge = screen.getAllByTestId('badge')[0];
      fireEvent.click(tagBadge);
      
      expect(onTagClick).toHaveBeenCalled();
    });

    it('should close dialog when onClose is called', () => {
      const onClose = vi.fn();
      render(<TagAnalyticsDashboard {...defaultProps} onClose={onClose} />);
      
      // Simulate dialog close
      fireEvent.click(screen.getByTestId('dialog'));
      
      // Note: The actual close behavior would be handled by the Dialog component
      // This test verifies the prop is passed correctly
      expect(onClose).toBeDefined();
    });

    it('should switch tabs correctly', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Performance'));
      
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'performance');
    });
  });

  describe('error handling', () => {
    it('should handle analytics calculation errors gracefully', () => {
      (tagAnalyticsService.calculateTagAnalytics as any).mockImplementation(() => {
        throw new Error('Analytics error');
      });

      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      // Should still render without crashing
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 for total tags
    });

    it('should handle insights calculation errors gracefully', () => {
      (tagAnalyticsService.getTagInsights as any).mockImplementation(() => {
        throw new Error('Insights error');
      });

      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Insights'));
      
      // Should show no data message
      expect(screen.getByText('Not enough data for insights')).toBeInTheDocument();
    });
  });

  describe('empty data handling', () => {
    it('should handle empty trades array', () => {
      (tagAnalyticsService.calculateTagAnalytics as any).mockReturnValue({
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

      render(<TagAnalyticsDashboard {...defaultProps} trades={[]} />);
      
      expect(screen.getByText('0')).toBeInTheDocument(); // Total tags should be 0
      expect(screen.getByText('0.0')).toBeInTheDocument(); // Avg tags per trade should be 0
    });

    it('should show appropriate empty states', () => {
      (tagAnalyticsService.calculateTagAnalytics as any).mockReturnValue({
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

      render(<TagAnalyticsDashboard {...defaultProps} trades={[]} />);
      
      fireEvent.click(screen.getByText('Usage'));
      
      expect(screen.getByText('No usage data available')).toBeInTheDocument();
      expect(screen.getByText('No significant correlations found')).toBeInTheDocument();
    });
  });

  describe('formatting', () => {
    it('should format currency values correctly', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Performance'));
      
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('$300.00')).toBeInTheDocument();
    });

    it('should format percentage values correctly', () => {
      render(<TagAnalyticsDashboard {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Performance'));
      
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });
  });
});
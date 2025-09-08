import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsAndInsightsDashboard } from '../AnalyticsAndInsightsDashboard';
import { JournalAnalyticsService } from '../../../services/JournalAnalyticsService';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the analytics service
jest.mock('../../../services/JournalAnalyticsService');
jest.mock('../../../contexts/AuthContext');

// Mock the child components
jest.mock('../ConsistencyAnalytics', () => ({
  ConsistencyAnalytics: ({ consistencyMetrics }: any) => (
    <div data-testid="consistency-analytics">
      Consistency Analytics - Streak: {consistencyMetrics.currentStreak}
    </div>
  )
}));

jest.mock('../EmotionalPatternAnalysis', () => ({
  EmotionalPatternAnalysis: ({ emotionalPatterns }: any) => (
    <div data-testid="emotional-pattern-analysis">
      Emotional Patterns: {emotionalPatterns.length}
    </div>
  )
}));

jest.mock('../ProcessScoreTrending', () => ({
  ProcessScoreTrending: ({ processTrends }: any) => (
    <div data-testid="process-score-trending">
      Process Trends: {processTrends.length}
    </div>
  )
}));

jest.mock('../PersonalizedInsights', () => ({
  PersonalizedInsights: ({ insights }: any) => (
    <div data-testid="personalized-insights">
      Insights: {insights.length}
    </div>
  )
}));

const mockAnalyticsData = {
  consistencyMetrics: {
    currentStreak: 7,
    longestStreak: 14,
    totalEntries: 25,
    completionRate: 85.5,
    weeklyConsistency: 90,
    monthlyConsistency: 80,
    streakHistory: [
      { startDate: '2024-01-01', endDate: '2024-01-07', length: 7 }
    ]
  },
  emotionalPatterns: [
    {
      emotion: 'confident',
      averageProcessScore: 4.2,
      averagePnL: 150,
      frequency: 10,
      correlationStrength: 0.65,
      trend: 'improving' as const,
      recommendations: ['Continue building confidence through preparation']
    },
    {
      emotion: 'nervous',
      averageProcessScore: 2.8,
      averagePnL: -50,
      frequency: 5,
      correlationStrength: 0.45,
      trend: 'stable' as const,
      recommendations: ['Practice mindfulness before trading']
    }
  ],
  processTrends: [
    {
      metric: 'planAdherence' as const,
      currentValue: 4.2,
      previousValue: 3.8,
      trend: 'improving' as const,
      changePercentage: 10.5,
      weeklyAverage: 4.1,
      monthlyAverage: 3.9
    },
    {
      metric: 'riskManagement' as const,
      currentValue: 3.5,
      previousValue: 4.0,
      trend: 'declining' as const,
      changePercentage: -12.5,
      weeklyAverage: 3.6,
      monthlyAverage: 3.8
    }
  ],
  personalizedInsights: [
    {
      id: 'insight-1',
      type: 'consistency' as const,
      priority: 'high' as const,
      title: 'Excellent Journaling Streak!',
      description: 'You have maintained a 7-day journaling streak.',
      recommendation: 'Keep up the momentum!',
      dataPoints: [7, 14],
      confidence: 0.95,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'insight-2',
      type: 'process' as const,
      priority: 'medium' as const,
      title: 'Risk Management Declining',
      description: 'Your risk management score has decreased recently.',
      recommendation: 'Review your position sizing rules.',
      dataPoints: [3.5, 4.0],
      confidence: 0.8,
      createdAt: '2024-01-15T10:00:00Z'
    }
  ],
  lastUpdated: '2024-01-15T10:00:00Z'
};

describe('AnalyticsAndInsightsDashboard', () => {
  const mockUser = { uid: 'test-user-id' };
  let mockAnalyticsService: jest.Mocked<JournalAnalyticsService>;

  beforeEach(() => {
    mockAnalyticsService = new JournalAnalyticsService() as jest.Mocked<JournalAnalyticsService>;
    mockAnalyticsService.getAnalyticsData.mockResolvedValue(mockAnalyticsData);
    (JournalAnalyticsService as jest.Mock).mockImplementation(() => mockAnalyticsService);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AnalyticsAndInsightsDashboard />);
    
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('loads and displays analytics data', async () => {
    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
    });

    // Check key metrics
    expect(screen.getByText('7 days')).toBeInTheDocument(); // Current streak
    expect(screen.getByText('85.5%')).toBeInTheDocument(); // Completion rate
    expect(screen.getByText('2')).toBeInTheDocument(); // Emotional patterns count
    expect(screen.getByText('2')).toBeInTheDocument(); // Active insights count
  });

  it('displays personalized insights', async () => {
    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('personalized-insights')).toBeInTheDocument();
    });

    expect(screen.getByText('Insights: 2')).toBeInTheDocument();
  });

  it('handles tab navigation', async () => {
    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
    });

    // Click on Consistency tab
    fireEvent.click(screen.getByText('Consistency'));
    expect(screen.getByTestId('consistency-analytics')).toBeInTheDocument();

    // Click on Emotions tab
    fireEvent.click(screen.getByText('Emotions'));
    expect(screen.getByTestId('emotional-pattern-analysis')).toBeInTheDocument();

    // Click on Process tab
    fireEvent.click(screen.getByText('Process'));
    expect(screen.getByTestId('process-score-trending')).toBeInTheDocument();
  });

  it('handles date range changes', async () => {
    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
    });

    const startDateInput = screen.getByDisplayValue(/2024-/);
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    await waitFor(() => {
      expect(mockAnalyticsService.getAnalyticsData).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({ start: '2024-01-01' })
      );
    });
  });

  it('handles refresh button click', async () => {
    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockAnalyticsService.getAnalyticsData).toHaveBeenCalledTimes(2);
    });
  });

  it('handles export functionality', async () => {
    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('displays error state when analytics loading fails', async () => {
    mockAnalyticsService.getAnalyticsData.mockRejectedValue(new Error('Failed to load'));

    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics data/)).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles no data state', async () => {
    mockAnalyticsService.getAnalyticsData.mockResolvedValue(null as any);

    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No analytics data available.')).toBeInTheDocument();
    });
  });

  it('does not load data when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(<AnalyticsAndInsightsDashboard />);

    expect(mockAnalyticsService.getAnalyticsData).not.toHaveBeenCalled();
  });

  it('displays overview tab content correctly', async () => {
    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
    });

    // Should show process trends summary
    expect(screen.getByText('Process Trends Summary')).toBeInTheDocument();
    expect(screen.getByText('Top Emotional Patterns')).toBeInTheDocument();
    
    // Should show some trend data
    expect(screen.getByText('Plan Adherence')).toBeInTheDocument();
    expect(screen.getByText('Risk Management')).toBeInTheDocument();
  });

  it('passes correct props to child components', async () => {
    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
    });

    // Navigate to consistency tab to check props
    fireEvent.click(screen.getByText('Consistency'));
    expect(screen.getByText('Consistency Analytics - Streak: 7')).toBeInTheDocument();

    // Navigate to emotions tab
    fireEvent.click(screen.getByText('Emotions'));
    expect(screen.getByText('Emotional Patterns: 2')).toBeInTheDocument();

    // Navigate to process tab
    fireEvent.click(screen.getByText('Process'));
    expect(screen.getByText('Process Trends: 2')).toBeInTheDocument();
  });

  it('updates last updated timestamp', async () => {
    render(<AnalyticsAndInsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });

    // Should show the formatted date
    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
  });

  it('handles custom className prop', () => {
    render(<AnalyticsAndInsightsDashboard className="custom-class" />);
    
    const container = screen.getByText('Loading analytics...').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });
});
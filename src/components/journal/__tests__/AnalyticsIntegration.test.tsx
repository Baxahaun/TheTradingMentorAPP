import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsAndInsightsDashboard } from '../AnalyticsAndInsightsDashboard';
import { ConsistencyAnalytics } from '../ConsistencyAnalytics';
import { EmotionalPatternAnalysis } from '../EmotionalPatternAnalysis';
import { ProcessScoreTrending } from '../ProcessScoreTrending';
import { PersonalizedInsights } from '../PersonalizedInsights';
import { JournalAnalyticsService } from '../../../services/JournalAnalyticsService';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the analytics service and auth
jest.mock('../../../services/JournalAnalyticsService');
jest.mock('../../../contexts/AuthContext');

describe('Analytics Integration Tests', () => {
  const mockUser = { uid: 'test-user-id' };
  let mockAnalyticsService: jest.Mocked<JournalAnalyticsService>;

  const mockAnalyticsData = {
    consistencyMetrics: {
      currentStreak: 14,
      longestStreak: 21,
      totalEntries: 45,
      completionRate: 92.3,
      weeklyConsistency: 95,
      monthlyConsistency: 88,
      streakHistory: [
        { startDate: '2024-01-01', endDate: '2024-01-14', length: 14 },
        { startDate: '2023-12-10', endDate: '2023-12-30', length: 21 }
      ]
    },
    emotionalPatterns: [
      {
        emotion: 'confident',
        averageProcessScore: 4.5,
        averagePnL: 200,
        frequency: 15,
        correlationStrength: 0.75,
        trend: 'improving' as const,
        recommendations: [
          'Your confident state correlates with better performance. Try to cultivate this mindset before trading.',
          'Great progress managing confident states! Continue your current approach.'
        ]
      },
      {
        emotion: 'nervous',
        averageProcessScore: 2.8,
        averagePnL: -75,
        frequency: 8,
        correlationStrength: 0.55,
        trend: 'declining' as const,
        recommendations: [
          'nervous emotions may be impacting your trading negatively. Consider mindfulness techniques.',
          'Your performance when nervous has been declining. Review recent trades for patterns.'
        ]
      }
    ],
    processTrends: [
      {
        metric: 'planAdherence' as const,
        currentValue: 4.3,
        previousValue: 3.9,
        trend: 'improving' as const,
        changePercentage: 10.3,
        weeklyAverage: 4.2,
        monthlyAverage: 4.0
      },
      {
        metric: 'riskManagement' as const,
        currentValue: 3.2,
        previousValue: 3.8,
        trend: 'declining' as const,
        changePercentage: -15.8,
        weeklyAverage: 3.4,
        monthlyAverage: 3.6
      },
      {
        metric: 'processScore' as const,
        currentValue: 3.8,
        previousValue: 3.7,
        trend: 'stable' as const,
        changePercentage: 2.7,
        weeklyAverage: 3.8,
        monthlyAverage: 3.7
      }
    ],
    personalizedInsights: [
      {
        id: 'insight-1',
        type: 'consistency' as const,
        priority: 'high' as const,
        title: 'Outstanding Journaling Streak!',
        description: 'You have maintained a 14-day journaling streak, showing excellent commitment.',
        recommendation: 'Keep up the momentum! Consistent reflection is key to trading improvement.',
        dataPoints: [14, 21, 92.3],
        confidence: 0.95,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'insight-2',
        type: 'emotional' as const,
        priority: 'medium' as const,
        title: 'Strong Confident Pattern Detected',
        description: 'Your confident state shows a 0.75 correlation with performance.',
        recommendation: 'Your confident state correlates with better performance. Try to cultivate this mindset before trading.',
        dataPoints: [0.75, 4.5, 200],
        confidence: 0.85,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'insight-3',
        type: 'process' as const,
        priority: 'high' as const,
        title: 'Risk Management Needs Attention',
        description: 'Your risk management metrics are declining and need immediate attention.',
        recommendation: 'Review your risk management rules immediately and consider reducing position sizes.',
        dataPoints: [-15.8, 3.2, 3.8],
        confidence: 0.88,
        createdAt: '2024-01-15T10:00:00Z'
      }
    ],
    lastUpdated: '2024-01-15T10:00:00Z'
  };

  beforeEach(() => {
    mockAnalyticsService = new JournalAnalyticsService() as jest.Mocked<JournalAnalyticsService>;
    mockAnalyticsService.getAnalyticsData.mockResolvedValue(mockAnalyticsData);
    (JournalAnalyticsService as jest.Mock).mockImplementation(() => mockAnalyticsService);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Analytics Workflow', () => {
    it('loads analytics data and displays all components correctly', async () => {
      render(<AnalyticsAndInsightsDashboard />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
      });

      // Verify key metrics are displayed
      expect(screen.getByText('14 days')).toBeInTheDocument(); // Current streak
      expect(screen.getByText('92.3%')).toBeInTheDocument(); // Completion rate
      expect(screen.getByText('2')).toBeInTheDocument(); // Emotional patterns
      expect(screen.getByText('3')).toBeInTheDocument(); // Active insights

      // Verify personalized insights are shown
      expect(screen.getByText('Outstanding Journaling Streak!')).toBeInTheDocument();
      expect(screen.getByText('Risk Management Needs Attention')).toBeInTheDocument();
    });

    it('navigates through all analytics tabs and displays correct content', async () => {
      render(<AnalyticsAndInsightsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
      });

      // Test Consistency tab
      fireEvent.click(screen.getByText('Consistency'));
      await waitFor(() => {
        expect(screen.getByText('Journaling Consistency')).toBeInTheDocument();
        expect(screen.getByText('14 Days')).toBeInTheDocument();
        expect(screen.getByText('Personal Best')).toBeInTheDocument();
      });

      // Test Emotions tab
      fireEvent.click(screen.getByText('Emotions'));
      await waitFor(() => {
        expect(screen.getByText('Emotional Pattern Analysis')).toBeInTheDocument();
        expect(screen.getByText('confident')).toBeInTheDocument();
        expect(screen.getByText('nervous')).toBeInTheDocument();
      });

      // Test Process tab
      fireEvent.click(screen.getByText('Process'));
      await waitFor(() => {
        expect(screen.getByText('Process Score Trending')).toBeInTheDocument();
        expect(screen.getByText('Plan Adherence')).toBeInTheDocument();
        expect(screen.getByText('Risk Management')).toBeInTheDocument();
      });
    });

    it('handles date range filtering across all components', async () => {
      render(<AnalyticsAndInsightsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
      });

      // Change date range
      const startDateInput = screen.getAllByDisplayValue(/2024-/)[0];
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

      const endDateInput = screen.getAllByDisplayValue(/2024-/)[1];
      fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

      await waitFor(() => {
        expect(mockAnalyticsService.getAnalyticsData).toHaveBeenCalledWith(
          'test-user-id',
          { start: '2024-01-01', end: '2024-01-31' }
        );
      });
    });
  });

  describe('Consistency Analytics Integration', () => {
    it('renders consistency analytics with correct data', () => {
      render(
        <ConsistencyAnalytics 
          consistencyMetrics={mockAnalyticsData.consistencyMetrics}
          dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
        />
      );

      expect(screen.getByText('14 Days')).toBeInTheDocument();
      expect(screen.getByText('Current Journaling Streak')).toBeInTheDocument();
      expect(screen.getByText('21 days')).toBeInTheDocument(); // Personal best
      expect(screen.getByText('45')).toBeInTheDocument(); // Total entries
      expect(screen.getByText('92.3%')).toBeInTheDocument(); // Completion rate
    });

    it('displays streak history correctly', () => {
      render(
        <ConsistencyAnalytics 
          consistencyMetrics={mockAnalyticsData.consistencyMetrics}
          dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
        />
      );

      expect(screen.getByText('Streak History')).toBeInTheDocument();
      expect(screen.getByText('21 days')).toBeInTheDocument();
      expect(screen.getByText('14 days')).toBeInTheDocument();
    });
  });

  describe('Emotional Pattern Analysis Integration', () => {
    it('renders emotional patterns with correct data', () => {
      render(
        <EmotionalPatternAnalysis 
          emotionalPatterns={mockAnalyticsData.emotionalPatterns}
          dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
        />
      );

      expect(screen.getByText('Emotional Pattern Analysis')).toBeInTheDocument();
      expect(screen.getByText('confident')).toBeInTheDocument();
      expect(screen.getByText('nervous')).toBeInTheDocument();
      expect(screen.getByText('15 occurrences')).toBeInTheDocument();
      expect(screen.getByText('8 occurrences')).toBeInTheDocument();
    });

    it('handles emotion selection and shows details', () => {
      render(
        <EmotionalPatternAnalysis 
          emotionalPatterns={mockAnalyticsData.emotionalPatterns}
          dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
        />
      );

      // Click on confident emotion
      fireEvent.click(screen.getByText('confident'));

      expect(screen.getByText('confident Analysis')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument(); // Process score
      expect(screen.getByText('$200')).toBeInTheDocument(); // Average P&L
    });

    it('displays correlation insights correctly', () => {
      render(
        <EmotionalPatternAnalysis 
          emotionalPatterns={mockAnalyticsData.emotionalPatterns}
          dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
        />
      );

      expect(screen.getByText('Strong')).toBeInTheDocument(); // Correlation strength for confident
      expect(screen.getByText('Moderate')).toBeInTheDocument(); // Correlation strength for nervous
    });
  });

  describe('Process Score Trending Integration', () => {
    it('renders process trends with correct data', () => {
      render(
        <ProcessScoreTrending 
          processTrends={mockAnalyticsData.processTrends}
          dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
        />
      );

      expect(screen.getByText('Process Score Trending')).toBeInTheDocument();
      expect(screen.getByText('Plan Adherence')).toBeInTheDocument();
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
      expect(screen.getByText('Process Score')).toBeInTheDocument();
    });

    it('shows trend indicators correctly', () => {
      render(
        <ProcessScoreTrending 
          processTrends={mockAnalyticsData.processTrends}
          dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
        />
      );

      expect(screen.getByText('+10.3%')).toBeInTheDocument(); // Improving plan adherence
      expect(screen.getByText('-15.8%')).toBeInTheDocument(); // Declining risk management
      expect(screen.getByText('+2.7%')).toBeInTheDocument(); // Stable process score
    });

    it('handles metric selection and shows recommendations', () => {
      render(
        <ProcessScoreTrending 
          processTrends={mockAnalyticsData.processTrends}
          dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
        />
      );

      // Click on risk management metric
      const riskManagementCard = screen.getByText('Risk Management').closest('div');
      if (riskManagementCard) {
        fireEvent.click(riskManagementCard);
      }

      expect(screen.getByText('Risk Management Analysis')).toBeInTheDocument();
      expect(screen.getByText('declining trend')).toBeInTheDocument();
    });
  });

  describe('Personalized Insights Integration', () => {
    it('renders insights with correct priorities', () => {
      render(<PersonalizedInsights insights={mockAnalyticsData.personalizedInsights} />);

      expect(screen.getByText('Personalized Insights')).toBeInTheDocument();
      expect(screen.getByText('Outstanding Journaling Streak!')).toBeInTheDocument();
      expect(screen.getByText('Risk Management Needs Attention')).toBeInTheDocument();
      expect(screen.getByText('Strong Confident Pattern Detected')).toBeInTheDocument();
    });

    it('handles insight expansion and shows details', () => {
      render(<PersonalizedInsights insights={mockAnalyticsData.personalizedInsights} />);

      // Click to expand first insight
      const viewDetailsButtons = screen.getAllByText('View Details');
      fireEvent.click(viewDetailsButtons[0]);

      expect(screen.getByText('Recommendation')).toBeInTheDocument();
      expect(screen.getByText('Supporting Data')).toBeInTheDocument();
      expect(screen.getByText('Keep up the momentum!')).toBeInTheDocument();
    });

    it('allows dismissing insights', () => {
      render(<PersonalizedInsights insights={mockAnalyticsData.personalizedInsights} />);

      const initialInsightCount = screen.getAllByText(/high|medium|low/).length;
      
      // Dismiss first insight
      const dismissButtons = screen.getAllByRole('button');
      const dismissButton = dismissButtons.find(button => 
        button.querySelector('svg') // Looking for X icon
      );
      
      if (dismissButton) {
        fireEvent.click(dismissButton);
      }

      // Should have one less insight visible
      expect(screen.queryByText('Outstanding Journaling Streak!')).not.toBeInTheDocument();
    });

    it('displays insight categories summary', () => {
      render(<PersonalizedInsights insights={mockAnalyticsData.personalizedInsights} />);

      expect(screen.getByText('Insight Categories')).toBeInTheDocument();
      expect(screen.getByText('consistency')).toBeInTheDocument();
      expect(screen.getByText('emotional')).toBeInTheDocument();
      expect(screen.getByText('process')).toBeInTheDocument();
    });

    it('shows recommended actions for high priority insights', () => {
      render(<PersonalizedInsights insights={mockAnalyticsData.personalizedInsights} />);

      expect(screen.getByText('Recommended Actions')).toBeInTheDocument();
      
      // Should show high priority insights in action items
      const highPriorityInsights = mockAnalyticsData.personalizedInsights.filter(i => i.priority === 'high');
      expect(highPriorityInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('handles analytics service errors gracefully', async () => {
      mockAnalyticsService.getAnalyticsData.mockRejectedValue(new Error('Service unavailable'));

      render(<AnalyticsAndInsightsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load analytics data/)).toBeInTheDocument();
      });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('handles empty data states', () => {
      const emptyData = {
        consistencyMetrics: {
          currentStreak: 0,
          longestStreak: 0,
          totalEntries: 0,
          completionRate: 0,
          weeklyConsistency: 0,
          monthlyConsistency: 0,
          streakHistory: []
        },
        emotionalPatterns: [],
        processTrends: [],
        personalizedInsights: [],
        lastUpdated: '2024-01-15T10:00:00Z'
      };

      render(<EmotionalPatternAnalysis emotionalPatterns={[]} dateRange={{ start: '2024-01-01', end: '2024-01-31' }} />);
      expect(screen.getByText('No Emotional Data')).toBeInTheDocument();

      render(<ProcessScoreTrending processTrends={[]} dateRange={{ start: '2024-01-01', end: '2024-01-31' }} />);
      expect(screen.getByText('No Process Data')).toBeInTheDocument();

      render(<PersonalizedInsights insights={[]} />);
      expect(screen.getByText('No Active Insights')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('does not reload data unnecessarily', async () => {
      const { rerender } = render(<AnalyticsAndInsightsDashboard />);

      await waitFor(() => {
        expect(mockAnalyticsService.getAnalyticsData).toHaveBeenCalledTimes(1);
      });

      // Rerender with same props should not trigger new data load
      rerender(<AnalyticsAndInsightsDashboard />);
      
      expect(mockAnalyticsService.getAnalyticsData).toHaveBeenCalledTimes(1);
    });

    it('handles large datasets efficiently', () => {
      const largeInsightsList = Array.from({ length: 50 }, (_, i) => ({
        id: `insight-${i}`,
        type: 'consistency' as const,
        priority: 'medium' as const,
        title: `Insight ${i}`,
        description: `Description ${i}`,
        recommendation: `Recommendation ${i}`,
        dataPoints: [i],
        confidence: 0.8,
        createdAt: '2024-01-15T10:00:00Z'
      }));

      render(<PersonalizedInsights insights={largeInsightsList} />);

      // Should render without performance issues
      expect(screen.getByText('Personalized Insights')).toBeInTheDocument();
      expect(screen.getByText('50 active')).toBeInTheDocument();
    });
  });
});
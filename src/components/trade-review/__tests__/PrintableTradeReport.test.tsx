import React from 'react';
import { render, screen } from '@testing-library/react';
import PrintableTradeReport from '../PrintableTradeReport';
import { EnhancedTrade } from '../../../types/tradeReview';

describe('PrintableTradeReport', () => {
  let mockTrade: EnhancedTrade;

  beforeEach(() => {
    mockTrade = {
      id: 'trade123',
      accountId: 'account1',
      currencyPair: 'EUR/USD',
      date: '2024-01-15',
      timeIn: '09:00:00',
      timeOut: '15:00:00',
      side: 'long',
      entryPrice: 1.0850,
      exitPrice: 1.0920,
      lotSize: 1.0,
      lotType: 'standard',
      units: 100000,
      pnl: 700,
      commission: 7,
      swap: -2.5,
      accountCurrency: 'USD',
      status: 'closed',
      tags: ['breakout', 'trend-following'],
      strategy: 'Breakout Strategy',
      marketConditions: 'Trending',
      timeframe: '1H',
      confidence: 8,
      emotions: 'Confident',
      notes: 'Good setup with clear signals',
      stopLoss: 1.0800,
      takeProfit: 1.0950,
      reviewData: {
        performanceMetrics: {
          rMultiple: 2.5,
          returnPercentage: 5.2,
          riskRewardRatio: 2.1,
          holdDuration: 24.5,
          efficiency: 85.3,
          sharpeRatio: 1.8,
          maxDrawdown: 2.1
        },
        notes: {
          preTradeAnalysis: 'Strong bullish setup with multiple confirmations including trend alignment and volume spike.',
          executionNotes: 'Entered at market open with good fill. Stop loss placed below recent swing low.',
          postTradeReflection: 'Trade went as planned. Price action respected key levels and target was hit.',
          lessonsLearned: 'Patience paid off. Waiting for proper setup confirmation was key to success.',
          generalNotes: 'Overall satisfied with execution and risk management.',
          lastModified: '2024-01-15T10:30:00Z',
          version: 1
        },
        charts: [
          {
            id: 'chart1',
            url: 'https://example.com/chart1.png',
            type: 'entry',
            timeframe: '1H',
            uploadedAt: '2024-01-15T09:00:00Z',
            description: 'Entry setup with breakout pattern',
            annotations: [
              {
                id: 'ann1',
                type: 'line',
                coordinates: { x1: 100, y1: 200, x2: 300, y2: 200 },
                style: { color: '#ff0000', thickness: 2 },
                timestamp: '2024-01-15T09:00:00Z'
              }
            ]
          },
          {
            id: 'chart2',
            url: 'https://example.com/chart2.png',
            type: 'exit',
            timeframe: '1H',
            uploadedAt: '2024-01-15T15:00:00Z',
            description: 'Exit at target level'
          }
        ],
        reviewWorkflow: {
          tradeId: 'trade123',
          stages: [
            {
              id: 'stage1',
              name: 'Data Verification',
              description: 'Verify all trade data is accurate and complete',
              required: true,
              completed: true,
              completedAt: '2024-01-15T11:00:00Z',
              notes: 'All data verified and accurate'
            },
            {
              id: 'stage2',
              name: 'Performance Analysis',
              description: 'Analyze trade performance and calculate metrics',
              required: true,
              completed: true,
              completedAt: '2024-01-15T12:00:00Z'
            },
            {
              id: 'stage3',
              name: 'Lessons Documentation',
              description: 'Document key lessons and insights',
              required: false,
              completed: false
            }
          ],
          overallProgress: 75,
          startedAt: '2024-01-15T10:00:00Z'
        },
        lastReviewedAt: '2024-01-15T12:00:00Z',
        reviewCompletionScore: 85
      }
    };
  });

  describe('Basic Rendering', () => {
    it('should render trade report with default title', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText('Trade Review Report')).toBeInTheDocument();
      expect(screen.getByText(/Trade ID: trade123/)).toBeInTheDocument();
      expect(screen.getByText(/Currency Pair: EUR\/USD/)).toBeInTheDocument();
      expect(screen.getByText(/Date: 1\/15\/2024/)).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      const customTitle = 'Custom Trade Analysis Report';
      render(<PrintableTradeReport trade={mockTrade} customTitle={customTitle} />);

      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    it('should display generation timestamp', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText(/Generated on/)).toBeInTheDocument();
    });
  });

  describe('Trade Summary Section', () => {
    it('should display basic trade information', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText('Trade Summary')).toBeInTheDocument();
      expect(screen.getByText('LONG')).toBeInTheDocument();
      expect(screen.getByText('1.085')).toBeInTheDocument();
      expect(screen.getByText('1.092')).toBeInTheDocument();
      expect(screen.getByText('1 standard')).toBeInTheDocument();
      expect(screen.getByText('$700.00')).toBeInTheDocument();
      expect(screen.getByText('CLOSED')).toBeInTheDocument();
    });

    it('should display timing information', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText('09:00:00')).toBeInTheDocument();
      expect(screen.getByText('15:00:00')).toBeInTheDocument();
    });

    it('should display risk management levels', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText('1.08')).toBeInTheDocument(); // Stop Loss
      expect(screen.getByText('1.095')).toBeInTheDocument(); // Take Profit
    });

    it('should display commission and swap', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText('$7.00')).toBeInTheDocument(); // Commission
      expect(screen.getByText('-$2.50')).toBeInTheDocument(); // Swap
    });

    it('should display tags when present', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText('breakout, trend-following')).toBeInTheDocument();
    });

    it('should handle missing exit price', () => {
      const openTrade = { ...mockTrade, exitPrice: undefined, status: 'open' as const };
      render(<PrintableTradeReport trade={openTrade} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
      expect(screen.getByText('OPEN')).toBeInTheDocument();
    });
  });

  describe('Performance Metrics Section', () => {
    it('should display performance metrics when included', () => {
      render(<PrintableTradeReport trade={mockTrade} includePerformanceMetrics={true} />);

      expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
      expect(screen.getByText('2.50R')).toBeInTheDocument();
      expect(screen.getByText('5.20%')).toBeInTheDocument();
      expect(screen.getByText('1:2.10')).toBeInTheDocument();
      expect(screen.getByText('1 days, 0.5 hours')).toBeInTheDocument();
      expect(screen.getByText('85.3/100')).toBeInTheDocument();
      expect(screen.getByText('1.80')).toBeInTheDocument(); // Sharpe Ratio
    });

    it('should not display performance metrics when excluded', () => {
      render(<PrintableTradeReport trade={mockTrade} includePerformanceMetrics={false} />);

      expect(screen.queryByText('Performance Analysis')).not.toBeInTheDocument();
    });

    it('should handle missing performance metrics', () => {
      const tradeWithoutMetrics = {
        ...mockTrade,
        reviewData: { ...mockTrade.reviewData, performanceMetrics: undefined }
      };
      render(<PrintableTradeReport trade={tradeWithoutMetrics} includePerformanceMetrics={true} />);

      expect(screen.queryByText('Performance Analysis')).not.toBeInTheDocument();
    });

    it('should format duration correctly for different time periods', () => {
      const tradeWithLongDuration = {
        ...mockTrade,
        reviewData: {
          ...mockTrade.reviewData,
          performanceMetrics: {
            ...mockTrade.reviewData!.performanceMetrics!,
            holdDuration: 72.3 // 3+ days
          }
        }
      };
      render(<PrintableTradeReport trade={tradeWithLongDuration} includePerformanceMetrics={true} />);

      expect(screen.getByText('3 days, 0.3 hours')).toBeInTheDocument();
    });
  });

  describe('Trade Notes Section', () => {
    it('should display all note categories when included', () => {
      render(<PrintableTradeReport trade={mockTrade} includeNotes={true} />);

      expect(screen.getByText('Trade Notes')).toBeInTheDocument();
      expect(screen.getByText('Pre-Trade Analysis')).toBeInTheDocument();
      expect(screen.getByText('Execution Notes')).toBeInTheDocument();
      expect(screen.getByText('Post-Trade Reflection')).toBeInTheDocument();
      expect(screen.getByText('Lessons Learned')).toBeInTheDocument();
      expect(screen.getByText('General Notes')).toBeInTheDocument();
    });

    it('should display note content', () => {
      render(<PrintableTradeReport trade={mockTrade} includeNotes={true} />);

      expect(screen.getByText(/Strong bullish setup with multiple confirmations/)).toBeInTheDocument();
      expect(screen.getByText(/Entered at market open with good fill/)).toBeInTheDocument();
      expect(screen.getByText(/Trade went as planned/)).toBeInTheDocument();
      expect(screen.getByText(/Patience paid off/)).toBeInTheDocument();
      expect(screen.getByText(/Overall satisfied with execution/)).toBeInTheDocument();
    });

    it('should not display notes when excluded', () => {
      render(<PrintableTradeReport trade={mockTrade} includeNotes={false} />);

      expect(screen.queryByText('Trade Notes')).not.toBeInTheDocument();
    });

    it('should handle missing notes', () => {
      const tradeWithoutNotes = {
        ...mockTrade,
        reviewData: { ...mockTrade.reviewData, notes: undefined }
      };
      render(<PrintableTradeReport trade={tradeWithoutNotes} includeNotes={true} />);

      expect(screen.queryByText('Trade Notes')).not.toBeInTheDocument();
    });

    it('should only show note categories that have content', () => {
      const tradeWithPartialNotes = {
        ...mockTrade,
        reviewData: {
          ...mockTrade.reviewData,
          notes: {
            preTradeAnalysis: 'Only pre-trade analysis',
            lastModified: '2024-01-15T10:30:00Z',
            version: 1
          }
        }
      };
      render(<PrintableTradeReport trade={tradeWithPartialNotes} includeNotes={true} />);

      expect(screen.getByText('Pre-Trade Analysis')).toBeInTheDocument();
      expect(screen.queryByText('Execution Notes')).not.toBeInTheDocument();
      expect(screen.queryByText('Post-Trade Reflection')).not.toBeInTheDocument();
    });
  });

  describe('Charts Section', () => {
    it('should display charts information when included', () => {
      render(<PrintableTradeReport trade={mockTrade} includeCharts={true} />);

      expect(screen.getByText('Charts (2)')).toBeInTheDocument();
      expect(screen.getByText('Chart 1: ENTRY')).toBeInTheDocument();
      expect(screen.getByText('Chart 2: EXIT')).toBeInTheDocument();
      expect(screen.getByText('Timeframe: 1H')).toBeInTheDocument();
      expect(screen.getByText('Entry setup with breakout pattern')).toBeInTheDocument();
      expect(screen.getByText('Annotations: 1')).toBeInTheDocument();
    });

    it('should not display charts when excluded', () => {
      render(<PrintableTradeReport trade={mockTrade} includeCharts={false} />);

      expect(screen.queryByText(/Charts \(\d+\)/)).not.toBeInTheDocument();
    });

    it('should handle missing charts', () => {
      const tradeWithoutCharts = {
        ...mockTrade,
        reviewData: { ...mockTrade.reviewData, charts: undefined }
      };
      render(<PrintableTradeReport trade={tradeWithoutCharts} includeCharts={true} />);

      expect(screen.queryByText(/Charts \(\d+\)/)).not.toBeInTheDocument();
    });

    it('should handle empty charts array', () => {
      const tradeWithEmptyCharts = {
        ...mockTrade,
        reviewData: { ...mockTrade.reviewData, charts: [] }
      };
      render(<PrintableTradeReport trade={tradeWithEmptyCharts} includeCharts={true} />);

      expect(screen.queryByText(/Charts \(\d+\)/)).not.toBeInTheDocument();
    });

    it('should display chart upload dates', () => {
      render(<PrintableTradeReport trade={mockTrade} includeCharts={true} />);

      expect(screen.getByText('Uploaded: 1/15/2024')).toBeInTheDocument();
    });
  });

  describe('Review Workflow Section', () => {
    it('should display workflow information when included', () => {
      render(<PrintableTradeReport trade={mockTrade} includeReviewWorkflow={true} />);

      expect(screen.getByText('Review Workflow')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument(); // Overall Progress
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('1/15/2024')).toBeInTheDocument(); // Started date
    });

    it('should display review stages', () => {
      render(<PrintableTradeReport trade={mockTrade} includeReviewWorkflow={true} />);

      expect(screen.getByText('Review Stages')).toBeInTheDocument();
      expect(screen.getByText('Data Verification ✓')).toBeInTheDocument();
      expect(screen.getByText('Performance Analysis ✓')).toBeInTheDocument();
      expect(screen.getByText('Lessons Documentation ○')).toBeInTheDocument();
    });

    it('should show completed status when workflow is complete', () => {
      const completedWorkflow = {
        ...mockTrade,
        reviewData: {
          ...mockTrade.reviewData,
          reviewWorkflow: {
            ...mockTrade.reviewData!.reviewWorkflow!,
            overallProgress: 100,
            completedAt: '2024-01-15T13:00:00Z'
          }
        }
      };
      render(<PrintableTradeReport trade={completedWorkflow} includeReviewWorkflow={true} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('1/15/2024')).toBeInTheDocument(); // Completed date
    });

    it('should not display workflow when excluded', () => {
      render(<PrintableTradeReport trade={mockTrade} includeReviewWorkflow={false} />);

      expect(screen.queryByText('Review Workflow')).not.toBeInTheDocument();
    });

    it('should handle missing workflow', () => {
      const tradeWithoutWorkflow = {
        ...mockTrade,
        reviewData: { ...mockTrade.reviewData, reviewWorkflow: undefined }
      };
      render(<PrintableTradeReport trade={tradeWithoutWorkflow} includeReviewWorkflow={true} />);

      expect(screen.queryByText('Review Workflow')).not.toBeInTheDocument();
    });

    it('should display stage notes when present', () => {
      render(<PrintableTradeReport trade={mockTrade} includeReviewWorkflow={true} />);

      expect(screen.getByText('All data verified and accurate')).toBeInTheDocument();
    });
  });

  describe('Strategy and Market Context Section', () => {
    it('should display strategy and market information', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText('Strategy & Market Context')).toBeInTheDocument();
      expect(screen.getByText('Breakout Strategy')).toBeInTheDocument();
      expect(screen.getByText('Trending')).toBeInTheDocument();
      expect(screen.getByText('1H')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument();
      expect(screen.getByText('Confident')).toBeInTheDocument();
      expect(screen.getByText('Good setup with clear signals')).toBeInTheDocument();
    });

    it('should not display section when no strategy data is present', () => {
      const tradeWithoutStrategy = {
        ...mockTrade,
        strategy: undefined,
        marketConditions: undefined,
        timeframe: undefined,
        confidence: undefined,
        emotions: undefined,
        notes: undefined
      };
      render(<PrintableTradeReport trade={tradeWithoutStrategy} />);

      expect(screen.queryByText('Strategy & Market Context')).not.toBeInTheDocument();
    });

    it('should display only available strategy fields', () => {
      const tradeWithPartialStrategy = {
        ...mockTrade,
        strategy: 'Test Strategy',
        marketConditions: undefined,
        timeframe: undefined,
        confidence: undefined,
        emotions: undefined,
        notes: undefined
      };
      render(<PrintableTradeReport trade={tradeWithPartialStrategy} />);

      expect(screen.getByText('Strategy & Market Context')).toBeInTheDocument();
      expect(screen.getByText('Test Strategy')).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('should display footer with generation info', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText(/Trade Review Report - Generated by Trade Review System/)).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency values correctly', () => {
      render(<PrintableTradeReport trade={mockTrade} />);

      expect(screen.getByText('$700.00')).toBeInTheDocument(); // P&L
      expect(screen.getByText('$7.00')).toBeInTheDocument(); // Commission
      expect(screen.getByText('-$2.50')).toBeInTheDocument(); // Swap
    });

    it('should handle different account currencies', () => {
      const eurTrade = { ...mockTrade, accountCurrency: 'EUR' };
      render(<PrintableTradeReport trade={eurTrade} />);

      // Note: The exact formatting depends on the browser's Intl implementation
      // We just check that the values are present
      expect(screen.getByText(/700/)).toBeInTheDocument();
      expect(screen.getByText(/7/)).toBeInTheDocument();
    });
  });
});
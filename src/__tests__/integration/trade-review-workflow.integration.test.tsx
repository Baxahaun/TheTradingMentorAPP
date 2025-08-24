import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { TradeReviewSystem } from '../../components/trade-review/TradeReviewSystem';
import { TradeContext } from '../../contexts/TradeContext';
import { Trade } from '../../types/trade';
import { NavigationContext } from '../../types/tradeReview';

// Mock services
vi.mock('../../lib/tradeReviewService');
vi.mock('../../lib/navigationContextService');
vi.mock('../../lib/performanceAnalyticsService');
vi.mock('../../lib/noteManagementService');
vi.mock('../../lib/chartUploadService');

const mockTrade: Trade = {
  id: 'integration-test-trade',
  symbol: 'TSLA',
  entryPrice: 200.00,
  exitPrice: 220.00,
  quantity: 50,
  entryDate: '2024-01-20',
  exitDate: '2024-01-22',
  type: 'long',
  status: 'closed',
  pnl: 1000,
  tags: ['momentum', 'breakout'],
  notes: 'Initial notes',
  commission: 5.00,
  createdAt: '2024-01-20T09:30:00Z',
  updatedAt: '2024-01-22T16:00:00Z'
};

const mockTradeContext = {
  trades: [mockTrade],
  addTrade: vi.fn(),
  updateTrade: vi.fn(),
  deleteTrade: vi.fn(),
  loading: false,
  error: null
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <TradeContext.Provider value={mockTradeContext}>
      {children}
    </TradeContext.Provider>
  </BrowserRouter>
);

describe('Trade Review Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Review Workflow', () => {
    it('should complete full trade review process', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TradeReviewSystem
            tradeId="integration-test-trade"
            initialMode="review"
          />
        </TestWrapper>
      );

      // Step 1: Verify trade data
      expect(screen.getByDisplayValue('TSLA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('200')).toBeInTheDocument();

      // Step 2: Add detailed notes
      const notesTab = screen.getByRole('tab', { name: /execution notes/i });
      await user.click(notesTab);

      const notesInput = screen.getByRole('textbox', { name: /execution notes/i });
      await user.clear(notesInput);
      await user.type(notesInput, 'Excellent breakout pattern with strong volume confirmation');

      // Step 3: Update tags
      const tagInput = screen.getByRole('combobox', { name: /tags/i });
      await user.click(tagInput);
      await user.type(tagInput, 'volume-confirmation');
      await user.keyboard('{Enter}');

      // Step 4: Upload chart
      const chartUpload = screen.getByLabelText(/upload chart/i);
      const file = new File(['chart data'], 'chart.png', { type: 'image/png' });
      await user.upload(chartUpload, file);

      // Step 5: Review performance metrics
      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);

      expect(screen.getByText(/r-multiple/i)).toBeInTheDocument();
      expect(screen.getByText(/return percentage/i)).toBeInTheDocument();

      // Step 6: Complete review workflow
      const reviewTab = screen.getByRole('tab', { name: /review workflow/i });
      await user.click(reviewTab);

      const completeStage1 = screen.getByRole('checkbox', { name: /data verification/i });
      await user.click(completeStage1);

      const completeStage2 = screen.getByRole('checkbox', { name: /analysis documentation/i });
      await user.click(completeStage2);

      const completeStage3 = screen.getByRole('checkbox', { name: /lessons learned/i });
      await user.click(completeStage3);

      // Step 7: Save and complete
      const saveButton = screen.getByRole('button', { name: /save review/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/review completed successfully/i)).toBeInTheDocument();
      });

      // Verify all data was saved
      expect(mockTradeContext.updateTrade).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'integration-test-trade',
          tags: expect.arrayContaining(['momentum', 'breakout', 'volume-confirmation'])
        })
      );
    });

    it('should handle incomplete review workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TradeReviewSystem
            tradeId="integration-test-trade"
            initialMode="review"
          />
        </TestWrapper>
      );

      // Try to complete review without finishing all stages
      const reviewTab = screen.getByRole('tab', { name: /review workflow/i });
      await user.click(reviewTab);

      const completeStage1 = screen.getByRole('checkbox', { name: /data verification/i });
      await user.click(completeStage1);

      // Skip other stages and try to save
      const saveButton = screen.getByRole('button', { name: /save review/i });
      await user.click(saveButton);

      // Should show warning about incomplete review
      expect(screen.getByText(/review is incomplete/i)).toBeInTheDocument();
      expect(screen.getByText(/2 stages remaining/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Context Preservation', () => {
    it('should preserve context when navigating from calendar', async () => {
      const user = userEvent.setup();
      const mockNavigationContext: NavigationContext = {
        source: 'calendar',
        sourceParams: { date: '2024-01-20' },
        breadcrumb: ['Dashboard', 'Calendar'],
        timestamp: Date.now()
      };

      const mockNavigateBack = vi.fn();

      render(
        <TestWrapper>
          <TradeReviewSystem
            tradeId="integration-test-trade"
            navigationContext={mockNavigationContext}
            onNavigateBack={mockNavigateBack}
          />
        </TestWrapper>
      );

      const backButton = screen.getByRole('button', { name: /back to calendar/i });
      await user.click(backButton);

      expect(mockNavigateBack).toHaveBeenCalledWith(mockNavigationContext);
    });

    it('should handle navigation between trades', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TradeReviewSystem
            tradeId="integration-test-trade"
          />
        </TestWrapper>
      );

      // Navigate to next trade
      const nextButton = screen.getByRole('button', { name: /next trade/i });
      await user.click(nextButton);

      // Should preserve review context
      expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();
    });
  });

  describe('Data Persistence', () => {
    it('should persist changes across mode switches', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TradeReviewSystem
            tradeId="integration-test-trade"
            initialMode="edit"
          />
        </TestWrapper>
      );

      // Make changes in edit mode
      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.clear(notesInput);
      await user.type(notesInput, 'Modified notes in edit mode');

      // Switch to view mode
      const viewButton = screen.getByRole('button', { name: /view/i });
      await user.click(viewButton);

      // Changes should be preserved
      expect(screen.getByText('Modified notes in edit mode')).toBeInTheDocument();

      // Switch back to edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Changes should still be there
      expect(screen.getByDisplayValue('Modified notes in edit mode')).toBeInTheDocument();
    });

    it('should handle auto-save conflicts', async () => {
      const user = userEvent.setup();
      
      // Mock concurrent modification
      const mockUpdateTrade = vi.fn().mockRejectedValueOnce(new Error('Conflict'));
      mockTradeContext.updateTrade = mockUpdateTrade;

      render(
        <TestWrapper>
          <TradeReviewSystem
            tradeId="integration-test-trade"
            initialMode="edit"
          />
        </TestWrapper>
      );

      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.type(notesInput, 'Conflicting change');

      // Wait for auto-save attempt
      await waitFor(() => {
        expect(screen.getByText(/save conflict detected/i)).toBeInTheDocument();
      });

      // Should offer resolution options
      expect(screen.getByRole('button', { name: /retry save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload trade/i })).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      const mockUpdateTrade = vi.fn().mockRejectedValueOnce(new Error('Network error'));
      mockTradeContext.updateTrade = mockUpdateTrade;

      render(
        <TestWrapper>
          <TradeReviewSystem
            tradeId="integration-test-trade"
            initialMode="edit"
          />
        </TestWrapper>
      );

      const notesInput = screen.getByRole('textbox', { name: /notes/i });
      await user.type(notesInput, 'Network test');

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Retry should work
      mockUpdateTrade.mockResolvedValueOnce(undefined);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large datasets efficiently', async () => {
      const largeTrade = {
        ...mockTrade,
        charts: Array.from({ length: 50 }, (_, i) => ({
          id: `chart-${i}`,
          url: `https://example.com/chart-${i}.png`,
          type: 'analysis' as const,
          timeframe: '1h',
          uploadedAt: new Date().toISOString()
        }))
      };

      const largeTradeContext = {
        ...mockTradeContext,
        trades: [largeTrade]
      };

      render(
        <BrowserRouter>
          <TradeContext.Provider value={largeTradeContext}>
            <TradeReviewSystem
              tradeId="integration-test-trade"
            />
          </TradeContext.Provider>
        </BrowserRouter>
      );

      // Should render without performance issues
      expect(screen.getByTestId('trade-review-system')).toBeInTheDocument();

      // Chart gallery should use virtualization
      const chartTab = screen.getByRole('tab', { name: /charts/i });
      await fireEvent.click(chartTab);

      expect(screen.getByTestId('virtualized-chart-gallery')).toBeInTheDocument();
    });
  });
});
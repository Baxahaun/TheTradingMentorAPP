/**
 * Critical User Journeys E2E Tests
 * 
 * End-to-end tests for the most important user workflows
 * in the Daily Trading Journal system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import App from '../../../App';
import { 
  mockUserId, 
  mockDate, 
  mockJournalEntry,
  createMockJournalEntry
} from '../mocks/journalTestData';

// Mock Firebase and all services
vi.mock('../../../lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {}
}));

vi.mock('../../../services/JournalDataService');
vi.mock('../../../services/TemplateService');
vi.mock('../../../services/ImageManagementService');
vi.mock('../../../services/TradeDataService');
vi.mock('../../../services/OfflineService');

// Mock browser APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
});

Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

const mockAuthContext = {
  user: { 
    uid: mockUserId, 
    email: 'trader@example.com',
    displayName: 'Test Trader'
  },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn()
};

describe('Critical User Journeys E2E Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup successful service responses
    const { journalDataService } = require('../../../services/JournalDataService');
    const { templateService } = require('../../../services/TemplateService');
    const { tradeDataService } = require('../../../services/TradeDataService');
    
    journalDataService.getJournalEntry.mockResolvedValue(null);
    journalDataService.createJournalEntry.mockResolvedValue(
      createMockJournalEntry({ date: mockDate })
    );
    journalDataService.updateJournalEntry.mockResolvedValue(undefined);
    journalDataService.subscribeToJournalEntry.mockReturnValue(() => {});
    journalDataService.getJournalEntriesForMonth.mockResolvedValue([]);
    
    templateService.getDefaultTemplates.mockResolvedValue([]);
    templateService.getUserTemplates.mockResolvedValue([]);
    
    tradeDataService.getTradesForDate.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Journey 1: First-Time User Complete Setup', () => {
    it('should guide new user through complete journal setup', async () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <App />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Should show welcome screen for new user
      await waitFor(() => {
        expect(screen.getByText(/welcome to your trading journal/i)).toBeInTheDocument();
      });

      // Start onboarding process
      const getStartedButton = screen.getByText(/get started/i);
      await user.click(getStartedButton);

      // Step 1: Choose default templates
      await waitFor(() => {
        expect(screen.getByText(/choose your journal templates/i)).toBeInTheDocument();
      });

      const preMarketTemplate = screen.getByTestId('template-pre-market');
      const tradeReviewTemplate = screen.getByTestId('template-trade-review');
      
      await user.click(preMarketTemplate);
      await user.click(tradeReviewTemplate);

      const continueButton = screen.getByText(/continue/i);
      await user.click(continueButton);

      // Step 2: Set up journaling preferences
      await waitFor(() => {
        expect(screen.getByText(/journaling preferences/i)).toBeInTheDocument();
      });

      const autoSaveToggle = screen.getByTestId('auto-save-toggle');
      await user.click(autoSaveToggle);

      const reminderTime = screen.getByTestId('reminder-time-input');
      await user.clear(reminderTime);
      await user.type(reminderTime, '18:00');

      const nextButton = screen.getByText(/next/i);
      await user.click(nextButton);

      // Step 3: Create first journal entry
      await waitFor(() => {
        expect(screen.getByText(/create your first journal entry/i)).toBeInTheDocument();
      });

      const createEntryButton = screen.getByText(/create today's entry/i);
      await user.click(createEntryButton);

      // Should navigate to journal view
      await waitFor(() => {
        expect(screen.getByTestId('daily-journal-view')).toBeInTheDocument();
      });

      // Should show guided tour
      expect(screen.getByTestId('guided-tour-overlay')).toBeInTheDocument();

      // Complete guided tour
      const tourNextButton = screen.getByTestId('tour-next-button');
      
      // Tour step 1: Editor
      await user.click(tourNextButton);
      expect(screen.getByText(/this is your journal editor/i)).toBeInTheDocument();

      // Tour step 2: Templates
      await user.click(tourNextButton);
      expect(screen.getByText(/use templates to structure/i)).toBeInTheDocument();

      // Tour step 3: Emotional tracking
      await user.click(tourNextButton);
      expect(screen.getByText(/track your emotional state/i)).toBeInTheDocument();

      // Finish tour
      const finishTourButton = screen.getByText(/finish tour/i);
      await user.click(finishTourButton);

      // Should complete onboarding
      await waitFor(() => {
        expect(screen.queryByTestId('guided-tour-overlay')).not.toBeInTheDocument();
      });

      // Verify setup completion
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'journal-onboarding-completed',
        'true'
      );
    });
  });

  describe('Journey 2: Daily Trading Journal Completion', () => {
    it('should complete full daily journal workflow from start to finish', async () => {
      const { journalDataService } = require('../../../services/JournalDataService');
      const { tradeDataService } = require('../../../services/TradeDataService');
      
      // Mock trades for the day
      const mockTrades = [
        {
          id: 'trade-1',
          symbol: 'EUR/USD',
          direction: 'long',
          entryPrice: 1.0850,
          exitPrice: 1.0885,
          pnl: 35.00,
          entryTime: '10:30:00',
          exitTime: '14:15:00',
          strategy: 'trend-following'
        },
        {
          id: 'trade-2',
          symbol: 'GBP/USD',
          direction: 'short',
          entryPrice: 1.2680,
          exitPrice: 1.2655,
          pnl: 25.00,
          entryTime: '11:45:00',
          exitTime: '13:20:00',
          strategy: 'breakout'
        }
      ];

      tradeDataService.getTradesForDate.mockResolvedValue(mockTrades);

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <App />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Navigate to today's journal
      await waitFor(() => {
        expect(screen.getByTestId('calendar-widget')).toBeInTheDocument();
      });

      const todayButton = screen.getByTestId(`calendar-date-${mockDate}`);
      await user.click(todayButton);

      // Should create and load journal entry
      await waitFor(() => {
        expect(journalDataService.createJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          mockDate
        );
        expect(screen.getByTestId('daily-journal-view')).toBeInTheDocument();
      });

      // Phase 1: Pre-Market Analysis
      const preMarketSection = screen.getByTestId('pre-market-section');
      expect(preMarketSection).toBeInTheDocument();

      const marketBiasInput = screen.getByPlaceholderText(/market bias/i);
      await user.type(marketBiasInput, 'Bullish on EUR/USD due to ECB dovish stance. Key level: 1.0850 support.');

      const keyLevelsInput = screen.getByPlaceholderText(/key levels/i);
      await user.type(keyLevelsInput, 'Support: 1.0850, 1.0820\nResistance: 1.0920, 1.0950');

      // Set pre-market emotional state
      const confidenceSlider = screen.getByTestId('pre-market-confidence');
      fireEvent.change(confidenceSlider, { target: { value: '4' } });

      const anxietySlider = screen.getByTestId('pre-market-anxiety');
      fireEvent.change(anxietySlider, { target: { value: '2' } });

      // Phase 2: Trading Execution (simulate during trading day)
      const duringTradingSection = screen.getByTestId('during-trading-section');
      
      // Add quick notes during trading
      const quickNoteButton = screen.getByTestId('quick-note-button');
      await user.click(quickNoteButton);

      const quickNoteInput = screen.getByPlaceholderText(/quick note/i);
      await user.type(quickNoteInput, 'EUR/USD broke above 1.0850, entering long position');

      const addNoteButton = screen.getByText(/add note/i);
      await user.click(addNoteButton);

      // Phase 3: Trade Analysis
      await waitFor(() => {
        expect(screen.getByTestId('trade-reference-panel')).toBeInTheDocument();
      });

      // Should display trades for the day
      expect(screen.getByText('EUR/USD (+$35.00)')).toBeInTheDocument();
      expect(screen.getByText('GBP/USD (+$25.00)')).toBeInTheDocument();

      // Analyze first trade
      const eurUsdTrade = screen.getByTestId('trade-card-trade-1');
      await user.click(eurUsdTrade);

      const analyzeButton = screen.getByText(/analyze trade/i);
      await user.click(analyzeButton);

      // Add trade analysis
      const tradeAnalysisInput = screen.getByPlaceholderText(/trade analysis/i);
      await user.type(tradeAnalysisInput, 'Perfect entry at support level. Held position through minor pullback. Exited at resistance as planned.');

      // Rate trade execution
      const executionRating = screen.getByTestId('execution-rating');
      fireEvent.change(executionRating, { target: { value: '4' } });

      const saveAnalysisButton = screen.getByText(/save analysis/i);
      await user.click(saveAnalysisButton);

      // Phase 4: Process Metrics Assessment
      const processMetricsSection = screen.getByTestId('process-metrics-section');

      const planAdherenceSlider = screen.getByTestId('plan-adherence-slider');
      fireEvent.change(planAdherenceSlider, { target: { value: '5' } });

      const riskManagementSlider = screen.getByTestId('risk-management-slider');
      fireEvent.change(riskManagementSlider, { target: { value: '4' } });

      const entryTimingSlider = screen.getByTestId('entry-timing-slider');
      fireEvent.change(entryTimingSlider, { target: { value: '4' } });

      const exitTimingSlider = screen.getByTestId('exit-timing-slider');
      fireEvent.change(exitTimingSlider, { target: { value: '5' } });

      // Phase 5: Post-Market Reflection
      const postMarketSection = screen.getByTestId('post-market-section');

      const whatWentWellInput = screen.getByPlaceholderText(/what went well/i);
      await user.type(whatWentWellInput, 'Excellent patience waiting for setup. Stuck to plan despite tempting early exit opportunities.');

      const whatToImproveInput = screen.getByPlaceholderText(/what to improve/i);
      await user.type(whatToImproveInput, 'Could have sized positions slightly larger given strong conviction level.');

      const lessonsLearnedInput = screen.getByPlaceholderText(/lessons learned/i);
      await user.type(lessonsLearnedInput, 'Support levels held perfectly. Market respected technical analysis today.');

      const tomorrowsPlanInput = screen.getByPlaceholderText(/tomorrow\'s plan/i);
      await user.type(tomorrowsPlanInput, 'Watch for continuation of EUR strength. GBP/USD showing weakness - potential short setup.');

      // Set post-market emotional state
      const satisfactionSlider = screen.getByTestId('post-market-satisfaction');
      fireEvent.change(satisfactionSlider, { target: { value: '5' } });

      const learningValueSlider = screen.getByTestId('post-market-learning');
      fireEvent.change(learningValueSlider, { target: { value: '4' } });

      // Phase 6: Final Review and Completion
      const reviewButton = screen.getByText(/review entry/i);
      await user.click(reviewButton);

      // Should show completion summary
      await waitFor(() => {
        expect(screen.getByTestId('completion-summary')).toBeInTheDocument();
      });

      // Verify completion metrics
      expect(screen.getByText(/daily p&l: \+\$60\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/process score: 90/i)).toBeInTheDocument();
      expect(screen.getByText(/completion: 100%/i)).toBeInTheDocument();

      // Mark as complete
      const markCompleteButton = screen.getByText(/mark as complete/i);
      await user.click(markCompleteButton);

      // Should save final entry
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          expect.any(String),
          expect.objectContaining({
            isComplete: true,
            completedAt: expect.any(String),
            dailyPnL: 60.00,
            processMetrics: expect.objectContaining({
              processScore: expect.any(Number)
            })
          })
        );
      });

      // Should show completion confirmation
      expect(screen.getByText(/journal entry completed/i)).toBeInTheDocument();
    });
  });

  describe('Journey 3: Multi-Day Journal Review and Analysis', () => {
    it('should complete weekly journal review workflow', async () => {
      const { journalDataService } = require('../../../services/JournalDataService');
      
      // Mock week of journal entries
      const weekEntries = Array.from({ length: 5 }, (_, i) => 
        createMockJournalEntry({
          date: `2024-01-${15 + i}`,
          isComplete: true,
          dailyPnL: (i + 1) * 20 - 50, // Mix of profits and losses
          processMetrics: {
            planAdherence: 3 + i % 3,
            riskManagement: 4,
            entryTiming: 3 + (i % 2),
            exitTiming: 4 - (i % 2),
            overallDiscipline: 4,
            processScore: 75 + (i * 5)
          }
        })
      );

      journalDataService.getJournalEntriesForDateRange.mockResolvedValue(weekEntries);

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <App />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Navigate to analytics view
      const analyticsButton = screen.getByTestId('analytics-nav-button');
      await user.click(analyticsButton);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      });

      // Select weekly review
      const weeklyReviewButton = screen.getByText(/weekly review/i);
      await user.click(weeklyReviewButton);

      // Should load week data
      await waitFor(() => {
        expect(journalDataService.getJournalEntriesForDateRange).toHaveBeenCalledWith(
          mockUserId,
          '2024-01-15',
          '2024-01-19'
        );
      });

      // Should display weekly summary
      expect(screen.getByText(/weekly p&l: \+\$50\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/average process score: 82\.5/i)).toBeInTheDocument();
      expect(screen.getByText(/completion rate: 100%/i)).toBeInTheDocument();

      // Review daily breakdown
      const dailyBreakdownSection = screen.getByTestId('daily-breakdown');
      expect(dailyBreakdownSection).toBeInTheDocument();

      // Should show each day's performance
      weekEntries.forEach((entry, i) => {
        expect(screen.getByText(`Jan ${15 + i}`)).toBeInTheDocument();
      });

      // Identify patterns
      const patternAnalysisButton = screen.getByText(/analyze patterns/i);
      await user.click(patternAnalysisButton);

      // Should show pattern insights
      await waitFor(() => {
        expect(screen.getByTestId('pattern-insights')).toBeInTheDocument();
      });

      expect(screen.getByText(/improving trend in process scores/i)).toBeInTheDocument();
      expect(screen.getByText(/consistent risk management/i)).toBeInTheDocument();

      // Create improvement plan
      const improvementPlanButton = screen.getByText(/create improvement plan/i);
      await user.click(improvementPlanButton);

      const improvementInput = screen.getByPlaceholderText(/improvement goals/i);
      await user.type(improvementInput, 'Focus on entry timing consistency. Target 90+ process score daily.');

      const savePlanButton = screen.getByText(/save plan/i);
      await user.click(savePlanButton);

      // Should save improvement plan
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          expect.any(String),
          expect.objectContaining({
            improvementPlan: expect.stringContaining('Focus on entry timing')
          })
        );
      });
    });
  });

  describe('Journey 4: Offline Usage and Sync Recovery', () => {
    it('should handle offline journaling and sync when back online', async () => {
      const { journalDataService } = require('../../../services/JournalDataService');
      const { offlineService } = require('../../../services/OfflineService');
      
      // Start online
      Object.defineProperty(navigator, 'onLine', { value: true });

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <App />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Navigate to journal
      const todayButton = screen.getByTestId(`calendar-date-${mockDate}`);
      await user.click(todayButton);

      await waitFor(() => {
        expect(screen.getByTestId('daily-journal-view')).toBeInTheDocument();
      });

      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      // Trigger offline event
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      });

      // Continue journaling offline
      const editor = screen.getByTestId('journal-editor-textarea');
      await user.type(editor, 'Writing journal entry while offline. This should be saved locally.');

      // Should save to local storage
      await waitFor(() => {
        expect(offlineService.queueOperation).toHaveBeenCalledWith(
          'updateJournalEntry',
          expect.objectContaining({
            content: expect.stringContaining('Writing journal entry while offline')
          })
        );
      });

      // Add more content
      await user.type(editor, ' Adding more content to test offline capabilities.');

      // Upload image while offline
      const imageUpload = screen.getByTestId('image-upload-input');
      const file = new File(['offline image'], 'offline-chart.png', { type: 'image/png' });
      
      await act(async () => {
        fireEvent.change(imageUpload, { target: { files: [file] } });
      });

      // Should queue image upload
      await waitFor(() => {
        expect(offlineService.queueOperation).toHaveBeenCalledWith(
          'uploadImage',
          expect.objectContaining({
            file: expect.any(File)
          })
        );
      });

      // Go back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      
      // Trigger online event
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      // Should show sync indicator
      await waitFor(() => {
        expect(screen.getByTestId('syncing-indicator')).toBeInTheDocument();
      });

      // Should process offline queue
      await waitFor(() => {
        expect(offlineService.processOfflineQueue).toHaveBeenCalled();
      });

      // Should sync all changes
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          expect.any(String),
          expect.objectContaining({
            content: expect.stringContaining('Adding more content to test offline capabilities')
          })
        );
      });

      // Should show sync complete
      await waitFor(() => {
        expect(screen.getByTestId('sync-complete-indicator')).toBeInTheDocument();
      });

      // Should remove offline indicator
      expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Journey 5: Error Recovery and Data Integrity', () => {
    it('should recover from various error scenarios while maintaining data integrity', async () => {
      const { journalDataService } = require('../../../services/JournalDataService');
      
      // Simulate intermittent service failures
      journalDataService.updateJournalEntry
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue(undefined);

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <App />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Navigate to journal
      const todayButton = screen.getByTestId(`calendar-date-${mockDate}`);
      await user.click(todayButton);

      await waitFor(() => {
        expect(screen.getByTestId('daily-journal-view')).toBeInTheDocument();
      });

      // Make changes that will initially fail
      const editor = screen.getByTestId('journal-editor-textarea');
      await user.type(editor, 'Critical journal content that must not be lost');

      // Should show first error
      await waitFor(() => {
        expect(screen.getByText(/save failed.*temporarily unavailable/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByTestId('retry-save-button')).toBeInTheDocument();

      // First retry should also fail
      const retryButton = screen.getByTestId('retry-save-button');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/save failed.*network timeout/i)).toBeInTheDocument();
      });

      // Second retry should succeed
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
      });

      // Verify data integrity - content should be preserved
      expect(journalDataService.updateJournalEntry).toHaveBeenLastCalledWith(
        mockUserId,
        expect.any(String),
        expect.objectContaining({
          content: expect.stringContaining('Critical journal content that must not be lost')
        })
      );

      // Verify retry count
      expect(journalDataService.updateJournalEntry).toHaveBeenCalledTimes(3);
    });
  });
});
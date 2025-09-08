/**
 * Daily Journal View Component Tests
 * 
 * Comprehensive test suite for the main journal interface component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DailyJournalView } from '../../../../components/journal/DailyJournalView';
import { AuthContext } from '../../../../contexts/AuthContext';
import { journalDataService } from '../../../../services/JournalDataService';
import { 
  mockUserId, 
  mockDate, 
  mockJournalEntry, 
  mockIncompleteJournalEntry,
  createMockJournalEntry
} from '../../mocks/journalTestData';

// Mock services
vi.mock('../../../../services/JournalDataService', () => ({
  journalDataService: {
    getJournalEntry: vi.fn(),
    createJournalEntry: vi.fn(),
    updateJournalEntry: vi.fn(),
    subscribeToJournalEntry: vi.fn()
  }
}));

vi.mock('../../../../services/TemplateService', () => ({
  templateService: {
    getUserTemplates: vi.fn(),
    getDefaultTemplates: vi.fn(),
    applyTemplateToEntry: vi.fn()
  }
}));

// Mock child components
vi.mock('../../../../components/journal/JournalEditor', () => ({
  JournalEditor: ({ onSave, content, onChange }: any) => (
    <div data-testid="journal-editor">
      <textarea
        data-testid="editor-content"
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <button onClick={() => onSave?.(content)}>Save</button>
    </div>
  )
}));

vi.mock('../../../../components/journal/TemplateSelector', () => ({
  TemplateSelector: ({ onSelect }: any) => (
    <div data-testid="template-selector">
      <button onClick={() => onSelect?.('template-1')}>Select Template</button>
    </div>
  )
}));

vi.mock('../../../../components/journal/EmotionalTracker', () => ({
  EmotionalTracker: ({ onUpdate }: any) => (
    <div data-testid="emotional-tracker">
      <button onClick={() => onUpdate?.({ confidence: 4 })}>Update Emotions</button>
    </div>
  )
}));

vi.mock('../../../../components/journal/ProcessScore', () => ({
  ProcessScore: ({ metrics, onUpdate }: any) => (
    <div data-testid="process-score">
      <span>Process Score: {metrics?.processScore || 0}</span>
      <button onClick={() => onUpdate?.({ processScore: 85 })}>Update Score</button>
    </div>
  )
}));

const mockAuthContext = {
  user: { uid: mockUserId },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn()
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
};

describe('DailyJournalView', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render journal view with all sections', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('journal-editor')).toBeInTheDocument();
        expect(screen.getByTestId('template-selector')).toBeInTheDocument();
        expect(screen.getByTestId('emotional-tracker')).toBeInTheDocument();
        expect(screen.getByTestId('process-score')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      (journalDataService.getJournalEntry as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockJournalEntry), 100))
      );
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle missing journal entry', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(null);
      (journalDataService.createJournalEntry as any).mockResolvedValue(
        createMockJournalEntry({ date: mockDate })
      );
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(journalDataService.createJournalEntry).toHaveBeenCalledWith(
          mockUserId, 
          mockDate
        );
      });
    });
  });

  describe('Journal Entry Management', () => {
    it('should load existing journal entry', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(journalDataService.getJournalEntry).toHaveBeenCalledWith(
          mockUserId, 
          mockDate
        );
      });

      expect(screen.getByTestId('editor-content')).toHaveValue(
        mockJournalEntry.preMarketNotes
      );
    });

    it('should create new journal entry when none exists', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(null);
      (journalDataService.createJournalEntry as any).mockResolvedValue(
        createMockJournalEntry({ date: mockDate })
      );
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(journalDataService.createJournalEntry).toHaveBeenCalledWith(
          mockUserId, 
          mockDate
        );
      });
    });

    it('should handle date changes', async () => {
      const newDate = '2024-01-16';
      const newEntry = createMockJournalEntry({ date: newDate });
      
      (journalDataService.getJournalEntry as any)
        .mockResolvedValueOnce(mockJournalEntry)
        .mockResolvedValueOnce(newEntry);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      const { rerender } = renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(journalDataService.getJournalEntry).toHaveBeenCalledWith(
          mockUserId, 
          mockDate
        );
      });

      rerender(
        <AuthContext.Provider value={mockAuthContext}>
          <DailyJournalView date={newDate} />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(journalDataService.getJournalEntry).toHaveBeenCalledWith(
          mockUserId, 
          newDate
        );
      });
    });
  });

  describe('Auto-save Functionality', () => {
    it('should auto-save content changes', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.updateJournalEntry as any).mockResolvedValue(undefined);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('editor-content');
      
      await act(async () => {
        await user.clear(editor);
        await user.type(editor, 'Updated journal content');
      });

      // Wait for auto-save debounce
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          mockJournalEntry.id,
          expect.objectContaining({
            preMarketNotes: 'Updated journal content'
          })
        );
      }, { timeout: 3000 });
    });

    it('should show save status indicator', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.updateJournalEntry as any).mockResolvedValue(undefined);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('editor-content');
      
      await act(async () => {
        await user.type(editor, 'New content');
      });

      expect(screen.getByText(/saving/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.updateJournalEntry as any).mockRejectedValue(
        new Error('Save failed')
      );
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('editor-content');
      
      await act(async () => {
        await user.type(editor, 'Content that will fail to save');
      });

      await waitFor(() => {
        expect(screen.getByText(/save failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template Integration', () => {
    it('should apply selected template', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('template-selector')).toBeInTheDocument();
      });

      const templateButton = screen.getByText('Select Template');
      await user.click(templateButton);

      // Template application should trigger update
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalled();
      });
    });
  });

  describe('Emotional Tracking Integration', () => {
    it('should update emotional state', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.updateJournalEntry as any).mockResolvedValue(undefined);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('emotional-tracker')).toBeInTheDocument();
      });

      const emotionButton = screen.getByText('Update Emotions');
      await user.click(emotionButton);

      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          mockJournalEntry.id,
          expect.objectContaining({
            emotionalState: expect.objectContaining({
              preMarket: expect.objectContaining({
                confidence: 4
              })
            })
          })
        );
      });
    });
  });

  describe('Process Metrics Integration', () => {
    it('should update process metrics', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.updateJournalEntry as any).mockResolvedValue(undefined);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('process-score')).toBeInTheDocument();
      });

      const scoreButton = screen.getByText('Update Score');
      await user.click(scoreButton);

      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          mockJournalEntry.id,
          expect.objectContaining({
            processMetrics: expect.objectContaining({
              processScore: 85
            })
          })
        );
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should set up real-time subscription', async () => {
      const unsubscribe = vi.fn();
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(unsubscribe);

      const { unmount } = renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(journalDataService.subscribeToJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          mockDate,
          expect.any(Function)
        );
      });

      unmount();
      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should handle real-time updates', async () => {
      let subscriptionCallback: Function;
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.subscribeToJournalEntry as any).mockImplementation(
        (userId, date, callback) => {
          subscriptionCallback = callback;
          return () => {};
        }
      );

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(journalDataService.subscribeToJournalEntry).toHaveBeenCalled();
      });

      // Simulate real-time update
      const updatedEntry = {
        ...mockJournalEntry,
        preMarketNotes: 'Updated via real-time'
      };

      act(() => {
        subscriptionCallback(updatedEntry);
      });

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toHaveValue(
          'Updated via real-time'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors', async () => {
      (journalDataService.getJournalEntry as any).mockRejectedValue(
        new Error('Failed to load journal')
      );

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      const unauthenticatedContext = {
        ...mockAuthContext,
        user: null
      };

      render(
        <AuthContext.Provider value={unauthenticatedContext}>
          <DailyJournalView date={mockDate} />
        </AuthContext.Provider>
      );

      expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
    });

    it('should handle network connectivity issues', async () => {
      (journalDataService.getJournalEntry as any).mockRejectedValue(
        new Error('Network error')
      );

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Daily Journal');
      });
    });

    it('should support keyboard navigation', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('editor-content');
      
      await user.tab();
      expect(editor).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should handle large journal entries efficiently', async () => {
      const largeEntry = createMockJournalEntry({
        preMarketNotes: 'A'.repeat(10000),
        tradingNotes: 'B'.repeat(15000),
        postMarketReflection: 'C'.repeat(8000)
      });

      (journalDataService.getJournalEntry as any).mockResolvedValue(largeEntry);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      const startTime = performance.now();
      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('should debounce auto-save properly', async () => {
      (journalDataService.getJournalEntry as any).mockResolvedValue(mockJournalEntry);
      (journalDataService.updateJournalEntry as any).mockResolvedValue(undefined);
      (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});

      renderWithAuth(<DailyJournalView date={mockDate} />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('editor-content');
      
      // Type multiple characters quickly
      await act(async () => {
        await user.type(editor, 'Quick typing test');
      });

      // Should only save once after debounce period
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });
    });
  });
});
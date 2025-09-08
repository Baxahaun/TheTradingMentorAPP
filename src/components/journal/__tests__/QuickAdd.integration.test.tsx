/**
 * Quick Add Integration Tests
 * 
 * End-to-end integration tests for the complete Quick Add workflow,
 * including mobile optimization and voice note functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthContext } from '../../../contexts/AuthContext';
import { journalDataService } from '../../../services/JournalDataService';
import QuickAddButton from '../QuickAddButton';
import QuickEntryOrganizer from '../QuickEntryOrganizer';
import MobileJournalInterface from '../MobileJournalInterface';
import { JournalEntry } from '../../../types/journal';

// Mock the journal data service
vi.mock('../../../services/JournalDataService', () => ({
  journalDataService: {
    getJournalEntry: vi.fn(),
    createJournalEntry: vi.fn(),
    updateJournalEntry: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock MediaRecorder and related APIs
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive',
  mimeType: 'audio/webm'
}));

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })
  }
});

global.URL.createObjectURL = vi.fn(() => 'mock-audio-url');
global.URL.revokeObjectURL = vi.fn();

// Test data
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockAuthContext = {
  user: mockUser,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn()
};

const mockJournalEntry: JournalEntry = {
  id: 'test-entry-1',
  userId: 'test-user-123',
  date: '2024-01-15',
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2024-01-15T08:00:00Z',
  sections: [
    {
      id: 'section-1',
      type: 'text',
      title: 'Market Analysis',
      content: 'Initial market analysis content',
      order: 0,
      isRequired: true,
      isCompleted: true,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z'
    }
  ],
  templateId: 'template-1',
  templateName: 'Daily Review',
  tradeReferences: [],
  dailyTradeIds: [],
  emotionalState: {
    preMarket: {
      confidence: 4,
      anxiety: 2,
      focus: 4,
      energy: 4,
      mood: 'confident',
      preparedness: 4,
      timestamp: '2024-01-15T08:00:00Z'
    },
    duringTrading: {
      discipline: 4,
      patience: 3,
      emotionalControl: 4,
      decisionClarity: 4,
      stressManagement: 4
    },
    postMarket: {
      satisfaction: 4,
      learningValue: 4,
      frustrationLevel: 2,
      accomplishment: 4,
      overallMood: 'satisfied',
      timestamp: '2024-01-15T18:00:00Z'
    },
    overallMood: 'confident',
    stressLevel: 2,
    confidenceLevel: 4
  },
  processMetrics: {
    planAdherence: 4,
    riskManagement: 5,
    entryTiming: 4,
    exitTiming: 4,
    emotionalDiscipline: 4,
    overallDiscipline: 4.2,
    processScore: 84
  },
  dailyPnL: 150.50,
  tradeCount: 3,
  images: [],
  tags: ['profitable', 'disciplined'],
  isComplete: true,
  completionPercentage: 85,
  wordCount: 250,
  isPrivate: true,
  sharedWith: []
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
};

describe('Quick Add Integration Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock successful journal operations
    vi.mocked(journalDataService.getJournalEntry).mockResolvedValue(mockJournalEntry);
    vi.mocked(journalDataService.createJournalEntry).mockResolvedValue(mockJournalEntry);
    vi.mocked(journalDataService.updateJournalEntry).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes full quick add workflow from button to journal integration', async () => {
    const user = userEvent.setup();
    
    // Render the quick add button
    renderWithAuth(<QuickAddButton />);
    
    // Step 1: Click the floating action button
    const quickAddButton = screen.getByRole('button', { name: /quick add note/i });
    await user.click(quickAddButton);
    
    // Step 2: Quick add modal should open
    expect(screen.getByText('Quick Add Note')).toBeInTheDocument();
    
    // Step 3: Fill in the note content
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'EUR/USD breaking above 1.0850 resistance. Strong bullish momentum. #forex #breakout');
    
    // Step 4: Select category
    const marketObservationButton = screen.getByText('Market Observation');
    await user.click(marketObservationButton);
    
    // Step 5: Set target date
    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-15');
    
    // Step 6: Save the note
    const saveButton = screen.getByText('Save Note');
    await user.click(saveButton);
    
    // Step 7: Verify journal service calls
    await waitFor(() => {
      expect(journalDataService.getJournalEntry).toHaveBeenCalledWith('test-user-123', '2024-01-15');
      expect(journalDataService.updateJournalEntry).toHaveBeenCalled();
    });
    
    // Step 8: Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Quick Add Note')).not.toBeInTheDocument();
    });
  });

  it('handles voice note recording and transcription workflow', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(<QuickAddButton />);
    
    // Open quick add modal
    const quickAddButton = screen.getByRole('button', { name: /quick add note/i });
    await user.click(quickAddButton);
    
    // Start voice recording
    const voiceButton = screen.getByText('Voice Note');
    await user.click(voiceButton);
    
    // Verify microphone access request
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true
    });
    
    // Simulate recording state
    expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    
    // Stop recording
    const stopButton = screen.getByText('Stop Recording');
    await user.click(stopButton);
    
    // Should show transcription in progress
    await waitFor(() => {
      expect(screen.getByText('Transcribing...')).toBeInTheDocument();
    });
    
    // After transcription completes, should show audio controls
    await waitFor(() => {
      const audioElement = screen.getByRole('application'); // audio element
      expect(audioElement).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('integrates quick notes into existing journal entries', async () => {
    const user = userEvent.setup();
    
    // Mock existing journal entry with Quick Notes section
    const existingEntry = {
      ...mockJournalEntry,
      sections: [
        ...mockJournalEntry.sections,
        {
          id: 'quick-notes-section',
          type: 'text' as const,
          title: 'Quick Notes',
          content: 'Previous quick note content',
          order: 1,
          isRequired: false,
          isCompleted: true,
          createdAt: '2024-01-15T08:00:00Z',
          updatedAt: '2024-01-15T08:00:00Z'
        }
      ]
    };
    
    vi.mocked(journalDataService.getJournalEntry).mockResolvedValue(existingEntry);
    
    renderWithAuth(<QuickAddButton />);
    
    // Add a quick note
    const quickAddButton = screen.getByRole('button', { name: /quick add note/i });
    await user.click(quickAddButton);
    
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'New market observation');
    
    const saveButton = screen.getByText('Save Note');
    await user.click(saveButton);
    
    // Verify the update includes both old and new content
    await waitFor(() => {
      expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
        'test-user-123',
        'test-entry-1',
        expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({
              title: 'Quick Notes',
              content: expect.stringContaining('Previous quick note content')
            })
          ])
        })
      );
    });
  });

  it('creates new journal entry when none exists for target date', async () => {
    const user = userEvent.setup();
    
    // Mock no existing journal entry
    vi.mocked(journalDataService.getJournalEntry).mockResolvedValue(null);
    
    renderWithAuth(<QuickAddButton />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add note/i });
    await user.click(quickAddButton);
    
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'First note of the day');
    
    // Set future date
    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-20');
    
    const saveButton = screen.getByText('Save Note');
    await user.click(saveButton);
    
    // Should create new journal entry
    await waitFor(() => {
      expect(journalDataService.createJournalEntry).toHaveBeenCalledWith('test-user-123', '2024-01-20');
    });
  });
});

describe('Mobile Interface Integration', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    });
  });

  it('provides seamless mobile journal editing experience', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    const mockOnSave = vi.fn();
    
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );
    
    // Test section expansion
    const sectionHeader = screen.getByText('Market Analysis');
    await user.click(sectionHeader);
    
    // Should show content
    expect(screen.getByText('Initial market analysis content')).toBeInTheDocument();
    
    // Test editing
    const editButton = screen.getByText('Edit');
    await user.click(editButton);
    
    // Should show textarea
    const textarea = screen.getByDisplayValue('Initial market analysis content');
    expect(textarea).toBeInTheDocument();
    
    // Edit content
    await user.clear(textarea);
    await user.type(textarea, 'Updated market analysis with new insights');
    
    // Save changes
    const doneButton = screen.getByText('Done');
    await user.click(doneButton);
    
    // Should call onUpdate with new content
    expect(mockOnUpdate).toHaveBeenCalledWith({
      sections: expect.arrayContaining([
        expect.objectContaining({
          content: 'Updated market analysis with new insights'
        })
      ])
    });
  });

  it('handles auto-save functionality on mobile', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    const mockOnSave = vi.fn();
    
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );
    
    // Make a change to trigger auto-save
    const sectionHeader = screen.getByText('Market Analysis');
    await user.click(sectionHeader);
    
    const editButton = screen.getByText('Edit');
    await user.click(editButton);
    
    const textarea = screen.getByDisplayValue('Initial market analysis content');
    await user.type(textarea, ' Additional content');
    
    // Auto-save should trigger after delay
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Should show auto-save indicator
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('provides touch-friendly navigation between sections', async () => {
    const user = userEvent.setup();
    
    const entryWithMultipleSections = {
      ...mockJournalEntry,
      sections: [
        mockJournalEntry.sections[0],
        {
          id: 'section-2',
          type: 'text' as const,
          title: 'Trade Review',
          content: 'Trade review content',
          order: 1,
          isRequired: true,
          isCompleted: false,
          createdAt: '2024-01-15T08:00:00Z',
          updatedAt: '2024-01-15T08:00:00Z'
        },
        {
          id: 'section-3',
          type: 'emotion_tracker' as const,
          title: 'Emotional State',
          content: {},
          order: 2,
          isRequired: false,
          isCompleted: false,
          createdAt: '2024-01-15T08:00:00Z',
          updatedAt: '2024-01-15T08:00:00Z'
        }
      ]
    };
    
    render(
      <MobileJournalInterface
        journalEntry={entryWithMultipleSections}
        onUpdate={vi.fn()}
        onSave={vi.fn()}
      />
    );
    
    // Open section menu
    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);
    
    // Should show all sections
    expect(screen.getByText('Jump to Section')).toBeInTheDocument();
    expect(screen.getByText('Market Analysis')).toBeInTheDocument();
    expect(screen.getByText('Trade Review')).toBeInTheDocument();
    expect(screen.getByText('Emotional State')).toBeInTheDocument();
    
    // Navigate to a section
    const tradeReviewButton = screen.getByText('Trade Review');
    await user.click(tradeReviewButton);
    
    // Menu should close
    expect(screen.queryByText('Jump to Section')).not.toBeInTheDocument();
  });
});

describe('Quick Entry Organization Integration', () => {
  beforeEach(() => {
    // Mock stored quick entries
    const mockQuickEntries = [
      {
        id: 'quick-1',
        content: 'EUR/USD bullish breakout #forex',
        category: 'market_observation',
        timestamp: '2024-01-15T10:30:00Z',
        isVoiceNote: false,
        tags: ['forex'],
        targetDate: '2024-01-15',
        isProcessed: false
      },
      {
        id: 'quick-2',
        content: 'Feeling confident about today\'s setup',
        category: 'emotional_note',
        timestamp: '2024-01-15T11:00:00Z',
        isVoiceNote: false,
        tags: [],
        targetDate: '2024-01-15',
        isProcessed: false
      }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockQuickEntries));
  });

  it('loads and displays pending quick entries', async () => {
    renderWithAuth(
      <QuickEntryOrganizer
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    
    // Should load entries from localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith('quick_entries_test-user-123');
    
    // Should display entries
    expect(screen.getByText('EUR/USD bullish breakout #forex')).toBeInTheDocument();
    expect(screen.getByText('Feeling confident about today\'s setup')).toBeInTheDocument();
  });

  it('processes selected entries into journal', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickEntryOrganizer
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    
    // Select entries
    const checkboxes = screen.getAllByRole('button', { name: /circle/i });
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    
    // Process selected entries
    const processButton = screen.getByText('Process');
    await user.click(processButton);
    
    // Should update journal entries
    await waitFor(() => {
      expect(journalDataService.updateJournalEntry).toHaveBeenCalled();
    });
    
    // Should update localStorage with processed status
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('filters entries by category and status', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickEntryOrganizer
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    
    // Filter by pending (default)
    expect(screen.getByDisplayValue('Pending')).toBeInTheDocument();
    expect(screen.getByText('EUR/USD bullish breakout #forex')).toBeInTheDocument();
    
    // Search for specific content
    const searchInput = screen.getByPlaceholderText('Search entries...');
    await user.type(searchInput, 'EUR/USD');
    
    // Should filter results
    expect(screen.getByText('EUR/USD bullish breakout #forex')).toBeInTheDocument();
    expect(screen.queryByText('Feeling confident about today\'s setup')).not.toBeInTheDocument();
  });
});

describe('Error Handling and Edge Cases', () => {
  it('handles network errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    vi.mocked(journalDataService.updateJournalEntry).mockRejectedValue(new Error('Network error'));
    
    renderWithAuth(<QuickAddButton />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add note/i });
    await user.click(quickAddButton);
    
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'Test note');
    
    const saveButton = screen.getByText('Save Note');
    await user.click(saveButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to save note/)).toBeInTheDocument();
    });
  });

  it('handles microphone permission denied', async () => {
    const user = userEvent.setup();
    
    // Mock permission denied
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      new Error('Permission denied')
    );
    
    renderWithAuth(<QuickAddButton />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add note/i });
    await user.click(quickAddButton);
    
    const voiceButton = screen.getByText('Voice Note');
    await user.click(voiceButton);
    
    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText('Voice Note')).toBeInTheDocument(); // Button should remain
    });
  });

  it('validates required fields before saving', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(<QuickAddButton />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add note/i });
    await user.click(quickAddButton);
    
    // Try to save without content
    const saveButton = screen.getByText('Save Note');
    expect(saveButton).toBeDisabled();
    
    // Add content
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'Some content');
    
    // Should enable save button
    expect(saveButton).not.toBeDisabled();
  });

  it('handles localStorage quota exceeded', async () => {
    const user = userEvent.setup();
    
    // Mock localStorage quota exceeded
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    
    renderWithAuth(<QuickAddButton />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add note/i });
    await user.click(quickAddButton);
    
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'Test note');
    
    const saveButton = screen.getByText('Save Note');
    await user.click(saveButton);
    
    // Should still attempt to save to journal service
    await waitFor(() => {
      expect(journalDataService.updateJournalEntry).toHaveBeenCalled();
    });
  });
});
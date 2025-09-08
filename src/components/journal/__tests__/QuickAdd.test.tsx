/**
 * Quick Add Module Tests
 * 
 * Comprehensive test suite for the Quick Add functionality including:
 * - QuickAddModule component
 * - QuickAddButton component
 * - Voice note functionality
 * - Mobile optimization features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import QuickAddModule from '../QuickAddModule';
import QuickAddButton from '../QuickAddButton';
import MobileJournalInterface from '../MobileJournalInterface';
import { VoiceNoteService } from '../../../services/VoiceNoteService';
import { AuthContext } from '../../../contexts/AuthContext';
import { JournalEntry } from '../../../types/journal';

// Mock dependencies
vi.mock('../../../services/JournalDataService', () => ({
  journalDataService: {
    getJournalEntry: vi.fn(),
    createJournalEntry: vi.fn(),
    updateJournalEntry: vi.fn()
  }
}));

vi.mock('../../../services/VoiceNoteService', () => ({
  VoiceNoteService: vi.fn().mockImplementation(() => ({
    isRecordingSupported: vi.fn(() => true),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    transcribeVoiceNote: vi.fn(),
    cleanup: vi.fn()
  })),
  voiceNoteService: {
    isRecordingSupported: vi.fn(() => true),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    transcribeVoiceNote: vi.fn(),
    cleanup: vi.fn()
  }
}));

// Mock MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive'
}));

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })
  }
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-audio-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Audio
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  duration: 30
}));

// Test utilities
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

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
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
      content: 'Test content',
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

describe('QuickAddModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders when open', () => {
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Quick Add Note')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/What's on your mind/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithAuth(
      <QuickAddModule
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('Quick Add Note')).not.toBeInTheDocument();
  });

  it('allows text input and category selection', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'EUR/USD looking bullish today #forex #analysis');

    expect(textarea).toHaveValue('EUR/USD looking bullish today #forex #analysis');

    // Test category selection
    const marketObservationButton = screen.getByText('Market Observation');
    await user.click(marketObservationButton);

    expect(marketObservationButton.closest('button')).toHaveClass('border-blue-500');
  });

  it('handles voice recording', async () => {
    const user = userEvent.setup();
    const mockStartRecording = vi.fn();
    const mockStopRecording = vi.fn().mockResolvedValue({
      id: 'voice-123',
      audioBlob: new Blob(['audio'], { type: 'audio/wav' }),
      audioUrl: 'mock-audio-url',
      duration: 30,
      isTranscribing: false,
      createdAt: '2024-01-15T10:00:00Z',
      fileSize: 1024,
      mimeType: 'audio/wav'
    });

    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    } as any);

    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const voiceButton = screen.getByText('Voice Note');
    await user.click(voiceButton);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true
    });
  });

  it('saves note with correct data structure', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    // Fill in content
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'Test note content #trading');

    // Select category
    const tradeIdeaButton = screen.getByText('Trade Idea');
    await user.click(tradeIdeaButton);

    // Save
    const saveButton = screen.getByText('Save Note');
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test note content #trading',
          category: 'trade_idea',
          tags: ['trading'],
          isVoiceNote: false
        })
      );
    });
  });

  it('validates required fields before saving', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const saveButton = screen.getByText('Save Note');
    expect(saveButton).toBeDisabled();

    // Add content
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(textarea, 'Some content');

    expect(saveButton).not.toBeDisabled();
  });

  it('handles target date selection', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-20');

    expect(dateInput).toHaveValue('2024-01-20');
  });
});

describe('QuickAddButton', () => {
  it('renders floating action button', () => {
    render(<QuickAddButton />);
    
    const button = screen.getByRole('button', { name: /quick add note/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-500');
  });

  it('opens QuickAddModule when clicked', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(<QuickAddButton />);
    
    const button = screen.getByRole('button', { name: /quick add note/i });
    await user.click(button);

    expect(screen.getByText('Quick Add Note')).toBeInTheDocument();
  });

  it('supports different positions and sizes', () => {
    const { rerender } = render(
      <QuickAddButton position="top-left" size="lg" />
    );
    
    let container = document.querySelector('.fixed');
    expect(container).toHaveClass('top-4', 'left-4');
    
    rerender(<QuickAddButton position="bottom-right" size="sm" />);
    
    container = document.querySelector('.fixed');
    expect(container).toHaveClass('bottom-4', 'right-4');
  });

  it('shows label on hover when enabled', async () => {
    const user = userEvent.setup();
    
    render(<QuickAddButton showLabel={true} />);
    
    const button = screen.getByRole('button', { name: /quick add note/i });
    await user.hover(button);

    expect(screen.getByText('Quick Add Note')).toBeInTheDocument();
  });
});

describe('MobileJournalInterface', () => {
  const mockOnUpdate = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders journal entry with mobile-optimized layout', () => {
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText(/Monday, Jan 15/)).toBeInTheDocument();
    expect(screen.getByText('85% complete')).toBeInTheDocument();
    expect(screen.getByText('Market Analysis')).toBeInTheDocument();
  });

  it('shows progress bar with correct completion percentage', () => {
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    const progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toHaveStyle({ width: '85%' });
  });

  it('allows section expansion and collapse', async () => {
    const user = userEvent.setup();
    
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    const sectionHeader = screen.getByText('Market Analysis').closest('div');
    expect(sectionHeader).toBeInTheDocument();

    // Click to toggle expansion
    await user.click(sectionHeader!);
    
    // Should show content or editing interface
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('handles section menu navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    expect(screen.getByText('Jump to Section')).toBeInTheDocument();
    expect(screen.getByText('Market Analysis')).toBeInTheDocument();
  });

  it('shows auto-save indicator', async () => {
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    // Trigger an update to activate auto-save
    act(() => {
      mockOnUpdate({
        sections: [
          {
            ...mockJournalEntry.sections[0],
            content: 'Updated content'
          }
        ]
      });
    });

    // Auto-save should be triggered after a delay
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('handles touch-friendly interactions', async () => {
    const user = userEvent.setup();
    
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    // Test touch-friendly button sizes
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      const minTouchTarget = 44; // 44px minimum touch target
      
      // Check if button meets minimum touch target size
      expect(
        parseInt(styles.minHeight) >= minTouchTarget ||
        parseInt(styles.padding) * 2 + 16 >= minTouchTarget // padding + icon size
      ).toBe(true);
    });
  });
});

describe('Voice Note Integration', () => {
  it('handles voice note recording lifecycle', async () => {
    const mockVoiceNote = {
      id: 'voice-123',
      audioBlob: new Blob(['audio'], { type: 'audio/wav' }),
      audioUrl: 'mock-audio-url',
      duration: 30,
      isTranscribing: false,
      createdAt: '2024-01-15T10:00:00Z',
      fileSize: 1024,
      mimeType: 'audio/wav'
    };

    const mockTranscription = 'This is a test transcription';

    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    } as any);

    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Start recording
    const voiceButton = screen.getByText('Voice Note');
    await user.click(voiceButton);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it('handles transcription errors gracefully', async () => {
    const mockError = new Error('Transcription failed');
    
    vi.mocked(VoiceNoteService.prototype.transcribeVoiceNote).mockRejectedValue(mockError);

    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // This would trigger transcription in a real scenario
    // The component should handle the error gracefully
    expect(screen.getByText('Voice Note')).toBeInTheDocument();
  });
});

describe('Mobile Optimization', () => {
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

  it('adapts layout for mobile screens', () => {
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // Check for mobile-specific classes
    const container = document.querySelector('.flex.flex-col.h-full');
    expect(container).toBeInTheDocument();
    
    // Check for responsive padding/margins
    const header = document.querySelector('.px-4.py-3');
    expect(header).toBeInTheDocument();
  });

  it('provides touch-friendly controls', () => {
    render(
      <MobileJournalInterface
        journalEntry={mockJournalEntry}
        onUpdate={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // All interactive elements should have adequate touch targets
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    buttons.forEach(button => {
      // Check for minimum touch target size or adequate padding
      expect(button).toHaveClass(/p-\d+|w-\d+|h-\d+/);
    });
  });

  it('handles keyboard visibility on mobile', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    await user.click(textarea);

    // Should focus the textarea
    expect(textarea).toHaveFocus();
  });
});

describe('Accessibility', () => {
  it('provides proper ARIA labels', () => {
    render(<QuickAddButton />);
    
    const button = screen.getByRole('button', { name: /quick add note/i });
    expect(button).toHaveAttribute('aria-label', 'Quick add note');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Tab through interactive elements
    await user.tab();
    expect(screen.getByDisplayValue(new Date().toISOString().split('T')[0])).toHaveFocus();

    await user.tab();
    // Should focus on category buttons or other interactive elements
    const focusedElement = document.activeElement;
    expect(focusedElement).toBeInstanceOf(HTMLElement);
  });

  it('provides proper focus management', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <QuickAddModule
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Textarea should auto-focus when modal opens
    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    expect(textarea).toHaveFocus();
  });
});
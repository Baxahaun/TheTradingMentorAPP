/**
 * Unit tests for EnhancedNotesEditor component
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Trade } from '../../types/trade';
import { TradeNotes } from '../../types/tradeReview';
import EnhancedNotesEditor from '../trade-review/EnhancedNotesEditor';
import noteManagementService from '../../lib/noteManagementService';

// Mock the note management service
vi.mock('../../lib/noteManagementService', () => ({
  default: {
    getLatestNotes: vi.fn(),
    getNoteHistory: vi.fn(),
    getNoteStatistics: vi.fn(),
    getTemplates: vi.fn(),
    saveNotes: vi.fn(),
    applyTemplate: vi.fn(),
  }
}));

// Mock toast
vi.mock('../ui/use-toast', () => ({
  toast: vi.fn(),
}));

const mockNoteManagementService = noteManagementService as any;

const mockTrade: Trade = {
  id: 'test-trade-123',
  accountId: 'test-account',
  currencyPair: 'EUR/USD',
  date: '2024-01-15',
  timeIn: '10:00',
  side: 'long',
  entryPrice: 1.0950,
  exitPrice: 1.0980,
  lotSize: 1,
  lotType: 'standard',
  units: 100000,
  commission: 7.50,
  accountCurrency: 'USD',
  status: 'closed',
  pnl: 300,
};

const mockNotes: TradeNotes = {
  preTradeAnalysis: 'Test pre-trade analysis',
  executionNotes: 'Test execution notes',
  postTradeReflection: 'Test reflection',
  lessonsLearned: 'Test lessons',
  generalNotes: 'Test general notes',
  lastModified: '2024-01-15T10:00:00Z',
  version: 1,
};

const mockTemplates = [
  {
    id: 'comprehensive-analysis',
    name: 'Comprehensive Analysis',
    category: 'detailed',
    description: 'Complete trade analysis template',
    template: {
      preTradeAnalysis: 'Template pre-trade analysis',
      executionNotes: 'Template execution notes',
      postTradeReflection: 'Template reflection',
      lessonsLearned: 'Template lessons',
    }
  },
  {
    id: 'quick-scalp',
    name: 'Quick Scalp',
    category: 'scalping',
    description: 'Template for quick scalping trades',
    template: {
      preTradeAnalysis: 'Quick setup analysis',
      executionNotes: 'Quick execution notes',
    }
  }
];

describe('EnhancedNotesEditor', () => {
  const mockOnNotesChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNoteManagementService.getLatestNotes.mockResolvedValue(mockNotes);
    mockNoteManagementService.getNoteHistory.mockResolvedValue([]);
    mockNoteManagementService.getNoteStatistics.mockResolvedValue({
      totalVersions: 1,
      totalCharacters: 100,
      lastModified: '2024-01-15T10:00:00Z',
      completionScore: 80,
    });
    mockNoteManagementService.getTemplates.mockReturnValue(mockTemplates);
    mockNoteManagementService.saveNotes.mockResolvedValue();
    mockNoteManagementService.applyTemplate.mockReturnValue(mockNotes);
  });

  describe('Rendering', () => {
    it('should render the component with all tabs', async () => {
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enhanced Trade Notes')).toBeInTheDocument();
      });

      // Check all tabs are present
      expect(screen.getByText('Pre-Trade Analysis')).toBeInTheDocument();
      expect(screen.getByText('Execution Notes')).toBeInTheDocument();
      expect(screen.getByText('Post-Trade Reflection')).toBeInTheDocument();
      expect(screen.getByText('Lessons Learned')).toBeInTheDocument();
      expect(screen.getByText('General Notes')).toBeInTheDocument();
    });

    it('should show completion score', async () => {
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('80% Complete')).toBeInTheDocument();
      });
    });

    it('should show templates and history buttons', async () => {
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Templates')).toBeInTheDocument();
        expect(screen.getByText(/History \(0\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Note Editing', () => {
    it('should allow editing notes when in edit mode', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={true}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test pre-trade analysis')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Test pre-trade analysis');
      await user.clear(textarea);
      await user.type(textarea, 'Updated pre-trade analysis');

      expect(mockOnNotesChange).toHaveBeenCalledWith(
        expect.objectContaining({
          preTradeAnalysis: 'Updated pre-trade analysis',
        })
      );
    });

    it('should show read-only view when not editing', async () => {
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test pre-trade analysis')).toBeInTheDocument();
      });

      // Should not have textarea in read-only mode
      expect(screen.queryByDisplayValue('Test pre-trade analysis')).not.toBeInTheDocument();
    });

    it('should show save button when editing', async () => {
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={true}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('should save notes when save button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={true}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockNoteManagementService.saveNotes).toHaveBeenCalledWith(
        mockTrade.id,
        expect.any(Object)
      );
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test pre-trade analysis')).toBeInTheDocument();
      });

      // Click on Execution Notes tab
      const executionTab = screen.getByText('Execution Notes');
      await user.click(executionTab);

      expect(screen.getByText('Test execution notes')).toBeInTheDocument();
    });

    it('should show status icons for each section', async () => {
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        // Should show completion status icons (CheckCircle2 for complete sections)
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(5);
      });
    });
  });

  describe('Templates', () => {
    it('should open templates dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={true}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Templates')).toBeInTheDocument();
      });

      const templatesButton = screen.getByText('Templates');
      await user.click(templatesButton);

      expect(screen.getByText('Note Templates')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive Analysis')).toBeInTheDocument();
      expect(screen.getByText('Quick Scalp')).toBeInTheDocument();
    });

    it('should apply template when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={true}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Templates')).toBeInTheDocument();
      });

      // Open templates dialog
      const templatesButton = screen.getByText('Templates');
      await user.click(templatesButton);

      // Click apply on first template
      const applyButtons = screen.getAllByText('Apply');
      await user.click(applyButtons[0]);

      expect(mockNoteManagementService.applyTemplate).toHaveBeenCalledWith(
        mockTemplates[0],
        expect.any(Object)
      );
    });
  });

  describe('History', () => {
    it('should open history dialog', async () => {
      const user = userEvent.setup();
      
      mockNoteManagementService.getNoteHistory.mockResolvedValue([
        {
          version: 1,
          content: mockNotes,
          timestamp: '2024-01-15T10:00:00Z',
          changes: ['Initial version']
        }
      ]);
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/History \(1\)/)).toBeInTheDocument();
      });

      const historyButton = screen.getByText(/History \(1\)/);
      await user.click(historyButton);

      expect(screen.getByText('Note History')).toBeInTheDocument();
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    it('should show character count for each section', async () => {
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/\d+ characters/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while loading', () => {
      mockNoteManagementService.getLatestNotes.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockNotes), 1000))
      );
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      expect(screen.getByText('Loading notes...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockNoteManagementService.saveNotes.mockRejectedValue(new Error('Save failed'));
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={true}
          onNotesChange={mockOnNotesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Should handle error without crashing
      await waitFor(() => {
        expect(mockNoteManagementService.saveNotes).toHaveBeenCalled();
      });
    });

    it('should handle loading errors gracefully', async () => {
      mockNoteManagementService.getLatestNotes.mockRejectedValue(new Error('Load failed'));
      
      render(
        <EnhancedNotesEditor
          trade={mockTrade}
          isEditing={false}
          onNotesChange={mockOnNotesChange}
        />
      );

      // Should not crash and should show default empty state
      await waitFor(() => {
        expect(screen.getByText('Enhanced Trade Notes')).toBeInTheDocument();
      });
    });
  });
});
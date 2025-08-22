import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditTradeModal from '../EditTradeModal';
import { useTradeContext } from '../../contexts/TradeContext';
import { Trade } from '../../types/trade';
import { tagService } from '../../lib/tagService';

// Mock the TradeContext
vi.mock('../../contexts/TradeContext', () => ({
  useTradeContext: vi.fn(),
}));

// Mock the toast hook
vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock the tag service
vi.mock('../../lib/tagService', () => ({
  tagService: {
    getTagSuggestions: vi.fn(),
    processTags: vi.fn(),
    validateTags: vi.fn(),
    validateTag: vi.fn(),
  },
}));

// Mock the useTagValidation hook
vi.mock('../../hooks/useTagValidation', () => ({
  useTagValidation: vi.fn(() => ({
    validationState: {
      isValid: true,
      errors: [],
      warnings: [],
      isValidating: false,
    },
    validateTags: vi.fn(() => ({
      isValid: true,
      errors: [],
      warnings: [],
    })),
    clearValidation: vi.fn(),
  })),
}));

// Mock the classification panels
vi.mock('../SetupClassificationPanel', () => ({
  SetupClassificationPanel: () => <div data-testid="setup-panel">Setup Panel</div>,
}));

vi.mock('../PatternRecognitionPanel', () => ({
  PatternRecognitionPanel: () => <div data-testid="pattern-panel">Pattern Panel</div>,
}));

vi.mock('../PartialCloseManagementPanel', () => ({
  PartialCloseManagementPanel: () => <div data-testid="partial-close-panel">Partial Close Panel</div>,
}));

// Mock TagInput component
vi.mock('../ui/tag-input', () => ({
  TagInput: ({ value, onChange, suggestions, placeholder, maxTags, className }: any) => (
    <div data-testid="tag-input" className={className}>
      <input
        data-testid="tag-input-field"
        value={value.join(', ')}
        onChange={(e) => onChange(e.target.value.split(', ').filter(Boolean))}
        placeholder={placeholder}
      />
      <div data-testid="tag-suggestions">
        {suggestions?.map((suggestion: string, index: number) => (
          <button
            key={index}
            data-testid={`suggestion-${suggestion}`}
            onClick={() => onChange([...value, suggestion])}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  ),
}));

const mockTrade: Trade = {
  id: '1',
  accountId: 'acc1',
  currencyPair: 'EUR/USD',
  date: '2024-01-15',
  timeIn: '09:30',
  side: 'long',
  entryPrice: 1.0950,
  exitPrice: 1.0980,
  lotSize: 1.0,
  lotType: 'standard',
  units: 100000,
  pips: 30,
  pnl: 300,
  commission: 5,
  accountCurrency: 'USD',
  tags: ['#breakout', '#morning', '#trending'],
  status: 'closed',
  notes: 'Good breakout trade',
};

const mockTrades: Trade[] = [
  mockTrade,
  {
    id: '2',
    accountId: 'acc1',
    currencyPair: 'GBP/JPY',
    date: '2024-01-16',
    timeIn: '14:15',
    side: 'short',
    entryPrice: 185.50,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    commission: 3,
    accountCurrency: 'USD',
    tags: ['#reversal', '#afternoon', '#news'],
    status: 'open',
  },
];

describe('EditTradeModal Tag Editing', () => {
  const mockUpdateTrade = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTradeContext as any).mockReturnValue({
      trades: mockTrades,
      updateTrade: mockUpdateTrade,
    });

    // Setup tag service mocks
    (tagService.getTagSuggestions as any).mockReturnValue(['#breakout', '#reversal', '#news']);
    (tagService.processTags as any).mockImplementation((tags: string[]) => 
      tags.map(tag => tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`)
    );
    (tagService.validateTags as any).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });
    (tagService.validateTag as any).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    // Mock toast is already set up in the module mock above
  });

  it('initializes with existing trade tags', () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const tagInput = screen.getByTestId('tag-input-field');
    expect(tagInput).toHaveValue('#breakout, #morning, #trending');
  });

  it('tracks tag changes when tags are modified', async () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const tagInput = screen.getByTestId('tag-input-field');
    
    // Add a new tag
    fireEvent.change(tagInput, { target: { value: '#breakout, #morning, #trending, #newTag' } });

    // Should show modification indicator
    await waitFor(() => {
      expect(screen.getByText('Modified')).toBeInTheDocument();
      expect(screen.getByText('Tag Changes:')).toBeInTheDocument();
      expect(screen.getByText('Added: #newtag')).toBeInTheDocument();
    });
  });

  it('shows tag change summary when tags are added and removed', async () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const tagInput = screen.getByTestId('tag-input-field');
    
    // Remove one tag and add another
    fireEvent.change(tagInput, { target: { value: '#breakout, #morning, #newTag' } });

    // Should show both added and removed tags
    await waitFor(() => {
      expect(screen.getByText('Tag Changes:')).toBeInTheDocument();
      expect(screen.getByText('Added: #newtag')).toBeInTheDocument();
      expect(screen.getByText('Removed: #trending')).toBeInTheDocument();
    });
  });

  it('validates tags before form submission', async () => {
    const mockValidateTagsWithError = vi.fn(() => ({
      isValid: false,
      errors: ['Invalid tag format'],
      warnings: [],
    }));

    const { useTagValidation } = await import('../../hooks/useTagValidation');
    (useTagValidation as any).mockReturnValue({
      validationState: {
        isValid: false,
        errors: ['Invalid tag format'],
        warnings: [],
        isValidating: false,
      },
      validateTags: mockValidateTagsWithError,
      clearValidation: vi.fn(),
    });

    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    // Should show validation error and not call updateTrade
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Tag Validation Error",
        description: "Invalid tag format",
        variant: "destructive",
      });
    });

    expect(mockUpdateTrade).not.toHaveBeenCalled();
  });

  it('processes tags correctly during form submission', async () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(tagService.processTags).toHaveBeenCalledWith(['#breakout', '#morning', '#trending']);
      expect(mockUpdateTrade).toHaveBeenCalledWith(
        mockTrade.id,
        expect.objectContaining({
          tags: ['#breakout', '#morning', '#trending']
        })
      );
    });
  });

  it('handles tag processing errors gracefully', async () => {
    (tagService.processTags as any).mockImplementation(() => {
      throw new Error('Tag processing failed');
    });

    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Tag Processing Error",
        description: "Tag processing failed",
        variant: "destructive",
      });
    });

    expect(mockUpdateTrade).not.toHaveBeenCalled();
  });

  it('retries trade update on failure', async () => {
    mockUpdateTrade
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);

    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    // Should retry and eventually succeed
    await waitFor(() => {
      expect(mockUpdateTrade).toHaveBeenCalledTimes(3);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Trade Updated Successfully! ✅",
        description: expect.stringContaining("EUR/USD trade updated successfully"),
      });
    }, { timeout: 10000 });
  });

  it('includes tag change information in success message', async () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const tagInput = screen.getByTestId('tag-input-field');
    
    // Add a new tag
    fireEvent.change(tagInput, { target: { value: '#breakout, #morning, #trending, #newTag' } });

    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Trade Updated Successfully! ✅",
        description: expect.stringContaining("1 tag added"),
      });
    });
  });

  it('loads tag suggestions from existing trades', () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(tagService.getTagSuggestions).toHaveBeenCalledWith(mockTrades, '', 20);
    
    // Should display suggestions
    expect(screen.getByTestId('suggestion-#breakout')).toBeInTheDocument();
    expect(screen.getByTestId('suggestion-#reversal')).toBeInTheDocument();
    expect(screen.getByTestId('suggestion-#news')).toBeInTheDocument();
  });

  it('clears tag changes when modal is closed', async () => {
    const mockOnClose = vi.fn();
    
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const tagInput = screen.getByTestId('tag-input-field');
    
    // Modify tags
    fireEvent.change(tagInput, { target: { value: '#breakout, #morning, #trending, #newTag' } });

    // Should show modification
    await waitFor(() => {
      expect(screen.getByText('Modified')).toBeInTheDocument();
    });

    // Close modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles trades with no existing tags', () => {
    const tradeWithoutTags = { ...mockTrade, tags: undefined };
    
    render(
      <EditTradeModal
        trade={tradeWithoutTags}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const tagInput = screen.getByTestId('tag-input-field');
    expect(tagInput).toHaveValue('');
    
    // Should not show modification indicator initially
    expect(screen.queryByText('Modified')).not.toBeInTheDocument();
  });

  it('displays validation errors in the UI', async () => {
    const { useTagValidation } = await import('../../hooks/useTagValidation');
    (useTagValidation as any).mockReturnValue({
      validationState: {
        isValid: false,
        errors: ['Tag is too long', 'Invalid characters'],
        warnings: ['Tag starts with number'],
        isValidating: false,
      },
      validateTags: vi.fn(),
      clearValidation: vi.fn(),
    });

    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should display validation errors
    expect(screen.getByText('Tag is too long')).toBeInTheDocument();
    expect(screen.getByText('Invalid characters')).toBeInTheDocument();
    
    // Should display warnings
    expect(screen.getByText('Tag starts with number')).toBeInTheDocument();
  });

  it('removes tags field when no tags are present after processing', async () => {
    const tradeWithoutTags = { ...mockTrade, tags: undefined };
    
    render(
      <EditTradeModal
        trade={tradeWithoutTags}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateTrade).toHaveBeenCalledWith(
        tradeWithoutTags.id,
        expect.not.objectContaining({
          tags: expect.anything()
        })
      );
    });
  });
});
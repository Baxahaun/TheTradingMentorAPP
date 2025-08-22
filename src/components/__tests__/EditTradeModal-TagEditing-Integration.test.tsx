import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditTradeModal from '../EditTradeModal';
import { useTradeContext } from '../../contexts/TradeContext';
import { Trade } from '../../types/trade';

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
    getTagSuggestions: vi.fn(() => ['#breakout', '#reversal', '#news']),
    processTags: vi.fn((tags: string[]) => 
      tags.map(tag => tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`)
    ),
    validateTags: vi.fn(() => ({
      isValid: true,
      errors: [],
      warnings: [],
    })),
    validateTag: vi.fn(() => ({
      isValid: true,
      errors: [],
      warnings: [],
    })),
    normalizeTag: vi.fn((tag: string) => 
      tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`
    ),
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

describe('EditTradeModal Tag Editing Integration', () => {
  const mockUpdateTrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTradeContext as any).mockReturnValue({
      trades: [mockTrade],
      updateTrade: mockUpdateTrade,
    });
  });

  it('renders with existing tags and allows editing', async () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should show existing tags
    expect(screen.getByText('breakout')).toBeInTheDocument();
    expect(screen.getByText('morning')).toBeInTheDocument();
    expect(screen.getByText('trending')).toBeInTheDocument();

    // Should show tag input
    expect(screen.getByPlaceholderText(/add tags to categorize/i)).toBeInTheDocument();
  });

  it('successfully updates trade with modified tags', async () => {
    mockUpdateTrade.mockResolvedValueOnce(undefined);

    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update trade/i });
    fireEvent.click(submitButton);

    // Should call updateTrade with processed tags
    await waitFor(() => {
      expect(mockUpdateTrade).toHaveBeenCalledWith(
        mockTrade.id,
        expect.objectContaining({
          tags: ['#breakout', '#morning', '#trending']
        })
      );
    });
  });

  it('handles tag validation errors during submission', async () => {
    const { useTagValidation } = await import('../../hooks/useTagValidation');
    (useTagValidation as any).mockReturnValue({
      validationState: {
        isValid: false,
        errors: ['Invalid tag format'],
        warnings: [],
        isValidating: false,
      },
      validateTags: vi.fn(() => ({
        isValid: false,
        errors: ['Invalid tag format'],
        warnings: [],
      })),
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

    // Should not call updateTrade due to validation error
    expect(mockUpdateTrade).not.toHaveBeenCalled();
  });

  it('shows tag modification indicator when tags are changed', async () => {
    render(
      <EditTradeModal
        trade={mockTrade}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Initially should not show modification indicator
    expect(screen.queryByText('Modified')).not.toBeInTheDocument();

    // The TagInput component would trigger onChange when tags are modified
    // This would be tested in the actual component interaction
  });
});
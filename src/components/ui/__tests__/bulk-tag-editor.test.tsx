import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkTagEditor, BulkTagOperation } from '../bulk-tag-editor';
import { Trade } from '../../../types/trade';

// Mock the tagService
vi.mock('../../../lib/tagService', () => ({
  tagService: {
    normalizeTag: (tag: string) => tag.toLowerCase().startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`,
  }
}));

const mockTrades: Trade[] = [
  {
    id: '1',
    accountId: 'acc1',
    currencyPair: 'EUR/USD',
    date: '2024-01-01',
    timeIn: '09:00',
    side: 'long',
    entryPrice: 1.1000,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    commission: 5,
    accountCurrency: 'USD',
    status: 'closed',
    tags: ['#scalping', '#morning']
  },
  {
    id: '2',
    accountId: 'acc1',
    currencyPair: 'GBP/USD',
    date: '2024-01-02',
    timeIn: '10:00',
    side: 'short',
    entryPrice: 1.2500,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    commission: 3,
    accountCurrency: 'USD',
    status: 'closed',
    tags: ['#scalping', '#breakout']
  },
  {
    id: '3',
    accountId: 'acc1',
    currencyPair: 'USD/JPY',
    date: '2024-01-03',
    timeIn: '11:00',
    side: 'long',
    entryPrice: 110.50,
    lotSize: 2,
    lotType: 'standard',
    units: 200000,
    commission: 7,
    accountCurrency: 'USD',
    status: 'open',
    tags: ['#swing', '#morning']
  }
];

describe('BulkTagEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    selectedTrades: mockTrades,
    isOpen: true,
    onClose: mockOnClose,
    onApply: mockOnApply
  };

  it('renders correctly when open', () => {
    render(<BulkTagEditor {...defaultProps} />);
    
    expect(screen.getByText('Bulk Tag Editor')).toBeInTheDocument();
    expect(screen.getByText('Selected Trades (3)')).toBeInTheDocument();
    expect(screen.getByText('EUR/USD, GBP/USD, USD/JPY')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<BulkTagEditor {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Bulk Tag Editor')).not.toBeInTheDocument();
  });

  it('displays current tags correctly', () => {
    render(<BulkTagEditor {...defaultProps} />);
    
    expect(screen.getByText('Current Tags')).toBeInTheDocument();
    expect(screen.getByText('scalping')).toBeInTheDocument();
    expect(screen.getByText('morning')).toBeInTheDocument();
    expect(screen.getByText('breakout')).toBeInTheDocument();
    expect(screen.getByText('swing')).toBeInTheDocument();
  });

  it('displays common tags correctly', () => {
    const tradesWithCommonTags: Trade[] = [
      { ...mockTrades[0], tags: ['#scalping', '#morning', '#common'] },
      { ...mockTrades[1], tags: ['#scalping', '#breakout', '#common'] },
      { ...mockTrades[2], tags: ['#swing', '#morning', '#common'] }
    ];

    render(<BulkTagEditor {...defaultProps} selectedTrades={tradesWithCommonTags} />);
    
    expect(screen.getByText('Common tags (in all selected trades):')).toBeInTheDocument();
    expect(screen.getAllByText('common')).toHaveLength(2); // Appears in both all tags and common tags sections
  });

  describe('Add Tags Operation', () => {
    it('allows adding tags', async () => {
      render(<BulkTagEditor {...defaultProps} />);
      
      // Add operation should be selected by default
      expect(screen.getByDisplayValue('add')).toBeChecked();
      
      // Check that the tag input is present
      expect(screen.getByPlaceholderText('Enter tags to add...')).toBeInTheDocument();
    });

    it('applies add tags operation', async () => {
      mockOnApply.mockResolvedValue(undefined);
      
      render(<BulkTagEditor {...defaultProps} />);
      
      // The apply button should be disabled initially (no tags added)
      expect(screen.getByText('Apply Changes')).toBeDisabled();
    });
  });

  describe('Remove Tags Operation', () => {
    it('allows selecting remove operation', async () => {
      render(<BulkTagEditor {...defaultProps} />);
      
      // Select remove operation
      fireEvent.click(screen.getByLabelText('Remove Tags'));
      
      expect(screen.getByDisplayValue('remove')).toBeChecked();
      expect(screen.getByText('Tags to Remove')).toBeInTheDocument();
    });
  });

  describe('Replace Tags Operation', () => {
    it('allows selecting replace operation', async () => {
      render(<BulkTagEditor {...defaultProps} />);
      
      // Select replace operation
      fireEvent.click(screen.getByLabelText('Replace All Tags'));
      
      expect(screen.getByDisplayValue('replace')).toBeChecked();
      expect(screen.getByText('Replacement Tags')).toBeInTheDocument();
    });
  });

  describe('Basic Functionality', () => {
    it('shows cancel button', async () => {
      render(<BulkTagEditor {...defaultProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty trade selection', () => {
      render(<BulkTagEditor {...defaultProps} selectedTrades={[]} />);
      
      expect(screen.getByText('Selected Trades (0)')).toBeInTheDocument();
    });

    it('disables apply button when no tags are specified', () => {
      render(<BulkTagEditor {...defaultProps} />);
      
      const applyButton = screen.getByText('Apply Changes');
      expect(applyButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<BulkTagEditor {...defaultProps} />);
      
      expect(screen.getByLabelText('Add Tags')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Tags')).toBeInTheDocument();
      expect(screen.getByLabelText('Replace All Tags')).toBeInTheDocument();
    });
  });
});
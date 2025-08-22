import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagManager } from '../tag-manager';
import { Trade } from '../../../types/trade';
import { tagService } from '../../../lib/tagService';

// Mock the tagService
vi.mock('../../../lib/tagService', () => ({
  tagService: {
    getAllTagsWithCounts: vi.fn(),
    normalizeTag: vi.fn(),
  }
}));

// Mock the toast hook
vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const mockTagService = tagService as any;

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
    pnl: 100,
    tags: ['#trading', '#scalp']
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
    pnl: -50,
    tags: ['#trading', '#swing']
  }
];

describe('TagManager', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    trades: mockTrades,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTagService.getAllTagsWithCounts.mockReturnValue([
      { tag: '#trading', count: 2, lastUsed: '2024-01-02', trades: ['1', '2'] },
      { tag: '#scalp', count: 1, lastUsed: '2024-01-01', trades: ['1'] },
      { tag: '#swing', count: 1, lastUsed: '2024-01-02', trades: ['2'] },
    ]);
    mockTagService.normalizeTag.mockImplementation((tag: string) => 
      tag.toLowerCase().startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`
    );
  });

  it('renders when open', () => {
    render(<TagManager {...defaultProps} />);
    
    expect(screen.getByText('Tag Manager')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TagManager {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Tag Manager')).not.toBeInTheDocument();
  });

  it('displays all tags with statistics', () => {
    render(<TagManager {...defaultProps} />);
    
    expect(screen.getByText('trading')).toBeInTheDocument();
    expect(screen.getByText('scalp')).toBeInTheDocument();
    expect(screen.getByText('swing')).toBeInTheDocument();
    
    expect(screen.getByText('2 trades')).toBeInTheDocument();
    expect(screen.getByText('1 trade')).toBeInTheDocument();
  });

  it('filters tags based on search query', async () => {
    const user = userEvent.setup();
    
    render(<TagManager {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search tags...');
    await user.type(searchInput, 'scal');
    
    expect(screen.getByText('scalp')).toBeInTheDocument();
    expect(screen.queryByText('trading')).not.toBeInTheDocument();
    expect(screen.queryByText('swing')).not.toBeInTheDocument();
  });

  it('calls onTagClick when tag is clicked', async () => {
    const user = userEvent.setup();
    const onTagClick = vi.fn();
    
    render(<TagManager {...defaultProps} onTagClick={onTagClick} />);
    
    await user.click(screen.getByText('trading'));
    
    expect(onTagClick).toHaveBeenCalledWith('#trading');
  });

  it('shows empty state when no tags available', () => {
    mockTagService.getAllTagsWithCounts.mockReturnValue([]);
    
    render(<TagManager {...defaultProps} />);
    
    expect(screen.getByText('No tags available')).toBeInTheDocument();
  });

  it('displays summary footer with counts', () => {
    render(<TagManager {...defaultProps} />);
    
    expect(screen.getByText('Showing 3 of 3 tags')).toBeInTheDocument();
    expect(screen.getByText('Total trades with tags: 2')).toBeInTheDocument();
  });
});
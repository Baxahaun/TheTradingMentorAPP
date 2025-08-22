import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagFilter } from '../tag-filter';
import { TagWithCount } from '../../../lib/tagService';

describe('TagFilter', () => {
  const mockTags: TagWithCount[] = [
    { tag: '#trading', count: 10, lastUsed: '2024-01-01', trades: ['1', '2'] },
    { tag: '#scalp', count: 5, lastUsed: '2024-01-02', trades: ['3'] },
    { tag: '#swing', count: 3, lastUsed: '2024-01-03', trades: ['4'] },
    { tag: '#breakout', count: 8, lastUsed: '2024-01-04', trades: ['5'] },
  ];

  const defaultProps = {
    availableTags: mockTags,
    selectedTags: [],
    onTagsChange: vi.fn(),
    filterMode: 'AND' as const,
    onFilterModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter button with tag count', () => {
    render(<TagFilter {...defaultProps} />);
    
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('shows selected tag count when tags are selected', () => {
    render(<TagFilter {...defaultProps} selectedTags={['#trading', '#scalp']} />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<TagFilter {...defaultProps} />);
    
    await user.click(screen.getByText('Tags'));
    
    expect(screen.getByText('Filter by Tags')).toBeInTheDocument();
  });

  it('displays all available tags', async () => {
    const user = userEvent.setup();
    
    render(<TagFilter {...defaultProps} />);
    
    await user.click(screen.getByText('Tags'));
    
    expect(screen.getByText('#trading')).toBeInTheDocument();
    expect(screen.getByText('#scalp')).toBeInTheDocument();
    expect(screen.getByText('#swing')).toBeInTheDocument();
    expect(screen.getByText('#breakout')).toBeInTheDocument();
  });

  it('toggles tag selection when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onTagsChange = vi.fn();
    
    render(<TagFilter {...defaultProps} onTagsChange={onTagsChange} />);
    
    await user.click(screen.getByText('Tags'));
    
    const tradingCheckbox = screen.getByRole('checkbox', { name: /trading/i });
    await user.click(tradingCheckbox);
    
    expect(onTagsChange).toHaveBeenCalledWith(['#trading']);
  });

  it('filters tags based on search query', async () => {
    const user = userEvent.setup();
    
    render(<TagFilter {...defaultProps} />);
    
    await user.click(screen.getByText('Tags'));
    
    const searchInput = screen.getByPlaceholderText('Search tags...');
    await user.type(searchInput, 'scal');
    
    expect(screen.getByText('#scalp')).toBeInTheDocument();
    expect(screen.queryByText('#trading')).not.toBeInTheDocument();
  });

  it('shows filter mode toggle when multiple tags are selected', async () => {
    const user = userEvent.setup();
    
    render(<TagFilter {...defaultProps} selectedTags={['#trading', '#scalp']} />);
    
    await user.click(screen.getByText('Tags'));
    
    expect(screen.getByText('Filter Mode')).toBeInTheDocument();
    expect(screen.getByText('AND (all tags)')).toBeInTheDocument();
    expect(screen.getByText('OR (any tag)')).toBeInTheDocument();
  });

  it('clears all tags when clear all is clicked', async () => {
    const user = userEvent.setup();
    const onTagsChange = vi.fn();
    
    render(<TagFilter {...defaultProps} selectedTags={['#trading', '#scalp']} onTagsChange={onTagsChange} />);
    
    await user.click(screen.getByText('Tags'));
    
    await user.click(screen.getByText('Clear all filters'));
    
    expect(onTagsChange).toHaveBeenCalledWith([]);
  });
});
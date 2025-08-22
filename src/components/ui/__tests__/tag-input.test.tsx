import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagInput } from '../tag-input';
import { tagService } from '../../../lib/tagService';

// Mock the tagService
vi.mock('../../../lib/tagService', () => ({
  tagService: {
    validateTag: vi.fn(),
    normalizeTag: vi.fn(),
  }
}));

const mockTagService = tagService as any;

describe('TagInput', () => {
  const defaultProps = {
    value: [],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTagService.validateTag.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    mockTagService.normalizeTag.mockImplementation((tag: string) => 
      tag.toLowerCase().startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`
    );
  });

  it('renders with placeholder text', () => {
    render(<TagInput {...defaultProps} placeholder="Add tags..." />);
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('displays existing tags', () => {
    render(<TagInput {...defaultProps} value={['#trading', '#scalp']} />);
    
    expect(screen.getByText('trading')).toBeInTheDocument();
    expect(screen.getByText('scalp')).toBeInTheDocument();
  });

  it('adds a tag when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<TagInput {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'newtag');
    await user.keyboard('{Enter}');
    
    expect(mockTagService.normalizeTag).toHaveBeenCalledWith('newtag');
    expect(onChange).toHaveBeenCalledWith(['#newtag']);
  });

  it('auto-formats tags with # prefix', async () => {
    const user = userEvent.setup();
    
    render(<TagInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'trading');
    
    expect(input).toHaveValue('#trading');
  });

  it('removes tag when X button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<TagInput {...defaultProps} value={['#trading', '#scalp']} onChange={onChange} />);
    
    const removeButtons = screen.getAllByLabelText(/Remove .* tag/);
    await user.click(removeButtons[0]);
    
    expect(onChange).toHaveBeenCalledWith(['#scalp']);
  });

  it('removes last tag when Backspace is pressed on empty input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<TagInput {...defaultProps} value={['#trading', '#scalp']} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{Backspace}');
    
    expect(onChange).toHaveBeenCalledWith(['#trading']);
  });

  it('shows suggestions when available', async () => {
    const user = userEvent.setup();
    const suggestions = ['#trading', '#scalping', '#swing'];
    
    render(<TagInput {...defaultProps} suggestions={suggestions} />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(screen.getByText('trading')).toBeInTheDocument();
    expect(screen.getByText('scalping')).toBeInTheDocument();
    expect(screen.getByText('swing')).toBeInTheDocument();
  });

  it('filters suggestions based on input', async () => {
    const user = userEvent.setup();
    const suggestions = ['#trading', '#scalping', '#swing'];
    
    render(<TagInput {...defaultProps} suggestions={suggestions} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'scal');
    
    expect(screen.getByText('scalping')).toBeInTheDocument();
    expect(screen.queryByText('trading')).not.toBeInTheDocument();
    expect(screen.queryByText('swing')).not.toBeInTheDocument();
  });

  it('prevents adding duplicate tags', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<TagInput {...defaultProps} value={['#trading']} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'trading');
    await user.keyboard('{Enter}');
    
    expect(screen.getByText('Tag already exists')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects maxTags limit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<TagInput {...defaultProps} value={['#tag1', '#tag2']} maxTags={2} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'tag3');
    await user.keyboard('{Enter}');
    
    expect(screen.getByText('Maximum 2 tags allowed')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<TagInput {...defaultProps} disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('calls onTagClick when tag is clicked', async () => {
    const user = userEvent.setup();
    const onTagClick = vi.fn();
    
    render(<TagInput {...defaultProps} value={['#trading']} onTagClick={onTagClick} />);
    
    const tag = screen.getByText('trading');
    await user.click(tag);
    
    expect(onTagClick).toHaveBeenCalledWith('#trading');
  });
});
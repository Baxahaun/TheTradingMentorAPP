import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TagDisplay } from '../tag-display';

describe('TagDisplay', () => {
  const defaultProps = {
    tags: ['#trading', '#scalp', '#swing'],
  };

  it('renders tags correctly', () => {
    render(<TagDisplay {...defaultProps} />);
    
    expect(screen.getByText('trading')).toBeInTheDocument();
    expect(screen.getByText('scalp')).toBeInTheDocument();
    expect(screen.getByText('swing')).toBeInTheDocument();
  });

  it('renders empty state with message', () => {
    render(<TagDisplay tags={[]} emptyMessage="No tags available" />);
    
    expect(screen.getByText('No tags available')).toBeInTheDocument();
  });

  it('returns null when empty and no message', () => {
    const { container } = render(<TagDisplay tags={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('filters out invalid tags', () => {
    render(<TagDisplay tags={['#valid', '', null as any, undefined as any, '#another']} />);
    
    expect(screen.getByText('valid')).toBeInTheDocument();
    expect(screen.getByText('another')).toBeInTheDocument();
  });

  it('calls onTagClick when tag is clicked and interactive', async () => {
    const user = userEvent.setup();
    const onTagClick = vi.fn();
    
    render(<TagDisplay {...defaultProps} interactive onTagClick={onTagClick} />);
    
    await user.click(screen.getByText('trading'));
    
    expect(onTagClick).toHaveBeenCalledWith('#trading');
  });

  it('displays limited number of tags with overflow', () => {
    render(<TagDisplay {...defaultProps} maxDisplay={2} />);
    
    expect(screen.getByText('trading')).toBeInTheDocument();
    expect(screen.getByText('scalp')).toBeInTheDocument();
    expect(screen.queryByText('swing')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('highlights specified tags', () => {
    render(<TagDisplay {...defaultProps} highlightedTags={['#trading']} />);
    
    const tradingTag = screen.getByText('trading').closest('.bg-yellow-100');
    expect(tradingTag).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<TagDisplay {...defaultProps} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
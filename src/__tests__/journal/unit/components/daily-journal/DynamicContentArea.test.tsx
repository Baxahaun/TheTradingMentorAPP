/**
 * DynamicContentArea Component Unit Tests  
 * Tests for dynamic layout switching functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicContentArea } from '../../../../../components/journal/daily-journal/DynamicContentArea';
import { ContentAreaConfig } from '../../../../../types/dailyJournal';

// Mock child components
jest.mock('../../../../../components/journal/daily-journal/TradeNotePanel', () => ({
  TradeNotePanel: ({ onContentChange }: any) => (
    <div data-testid="trade-note-panel">
      Trade Note Panel
      <button onClick={() => onContentChange('test content')}>
        Update Content
      </button>
    </div>
  )
}));

jest.mock('../../../../../components/journal/daily-journal/TemplateSelector', () => ({
  TemplateSelector: ({ onTemplateSelect }: any) => (
    <div data-testid="template-selector">
      Template Selector
      <button onClick={() => onTemplateSelect({ id: '1', name: 'Test Template' })}>
        Select Template
      </button>
    </div>
  )
}));

jest.mock('../../../../../components/journal/daily-journal/NewsEventsPanel', () => ({
  NewsEventsPanel: () => <div data-testid="news-events-panel">News Events Panel</div>
}));

const mockConfig: ContentAreaConfig = {
  type: 'daily-journal',
  showTradeData: false,
  showTemplateSelector: true,
  showNewsEvents: true,
  showScreenshotGallery: false,
  layoutMode: 'standard',
  animationDuration: 200
};

describe('DynamicContentArea', () => {
  const defaultProps = {
    selectedDate: new Date('2024-03-13'),
    entryType: 'daily-journal' as const,
    onContentChange: jest.fn(),
    onEntryTypeChange: jest.fn(),
    config: mockConfig
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with daily journal layout', () => {
    render(<DynamicContentArea {...defaultProps} />);
    
    expect(screen.getByTestId('dynamic-content-area')).toBeInTheDocument();
    expect(screen.getByText(/daily journal entry/i)).toBeInTheDocument();
  });

  it('should render with trade note layout when entryType is trade-note', () => {
    const props = { 
      ...defaultProps, 
      entryType: 'trade-note' as const,
      linkedTradeId: 'trade123',
      config: { ...mockConfig, type: 'trade-note', showTradeData: true }
    };
    
    render(<DynamicContentArea {...props} />);

    expect(screen.getByTestId('trade-note-panel')).toBeInTheDocument();
  });

  it('should render empty state when entryType is empty', () => {
    const props = { 
      ...defaultProps, 
      entryType: 'empty' as const,
      config: { ...mockConfig, type: 'empty' }
    };
    
    render(<DynamicContentArea {...props} />);

    expect(screen.getByText(/no entry selected/i)).toBeInTheDocument();
    expect(screen.getByText(/create new entry/i)).toBeInTheDocument();
  });

  it('should show template selector when configured', () => {
    render(<DynamicContentArea {...defaultProps} />);

    expect(screen.getByTestId('template-selector')).toBeInTheDocument();
  });

  it('should hide template selector when not configured', () => {
    const props = { 
      ...defaultProps, 
      config: { ...mockConfig, showTemplateSelector: false }
    };
    
    render(<DynamicContentArea {...props} />);

    expect(screen.queryByTestId('template-selector')).not.toBeInTheDocument();
  });

  it('should show news events panel when configured', () => {
    render(<DynamicContentArea {...defaultProps} />);

    expect(screen.getByTestId('news-events-panel')).toBeInTheDocument();
  });

  it('should handle entry type switching', () => {
    render(<DynamicContentArea {...defaultProps} />);

    const switchButton = screen.getByRole('button', { name: /switch to trade note/i });
    fireEvent.click(switchButton);
    
    expect(defaultProps.onEntryTypeChange).toHaveBeenCalledWith('trade-note');
  });

  it('should handle content changes from child components', () => {
    const props = { 
      ...defaultProps, 
      entryType: 'trade-note' as const,
      config: { ...mockConfig, type: 'trade-note', showTradeData: true }
    };
    
    render(<DynamicContentArea {...props} />);

    const updateButton = screen.getByText('Update Content');
    fireEvent.click(updateButton);
    
    expect(defaultProps.onContentChange).toHaveBeenCalledWith('test content');
  });

  it('should handle template selection', () => {
    render(<DynamicContentArea {...defaultProps} />);

    const selectButton = screen.getByText('Select Template');
    fireEvent.click(selectButton);
    
    // Should trigger content update with template
    expect(defaultProps.onContentChange).toHaveBeenCalled();
  });

  it('should animate layout transitions within 200ms', async () => {
    const { rerender } = render(<DynamicContentArea {...defaultProps} />);
    
    // Change entry type to trigger transition
    const newProps = { 
      ...defaultProps, 
      entryType: 'trade-note' as const,
      config: { ...mockConfig, type: 'trade-note' }
    };
    
    rerender(<DynamicContentArea {...newProps} />);

    // Advance timers by animation duration
    jest.advanceTimersByTime(200);
    
    await waitFor(() => {
      expect(screen.getByTestId('dynamic-content-area')).toHaveClass('transition-complete');
    }, { timeout: 250 });
  });

  it('should maintain content state during transitions', () => {
    const { rerender } = render(<DynamicContentArea {...defaultProps} />);
    
    // Simulate user input
    const textarea = screen.getByRole('textbox', { name: /journal content/i });
    fireEvent.change(textarea, { target: { value: 'Test content' } });
    
    // Change layout but keep entry type
    const newProps = { 
      ...defaultProps,
      config: { ...mockConfig, layoutMode: 'compact' }
    };
    
    rerender(<DynamicContentArea {...newProps} />);

    // Content should be preserved
    expect(textarea).toHaveValue('Test content');
  });

  it('should apply transition type correctly', () => {
    const props = { 
      ...defaultProps, 
      transitionType: 'fade' as const
    };
    
    render(<DynamicContentArea {...props} />);

    expect(screen.getByTestId('dynamic-content-area')).toHaveClass('transition-fade');
  });

  it('should handle layout mode changes', () => {
    const compactConfig: ContentAreaConfig = {
      ...mockConfig,
      layoutMode: 'compact'
    };
    
    render(<DynamicContentArea {...defaultProps} config={compactConfig} />);

    expect(screen.getByTestId('dynamic-content-area')).toHaveClass('layout-compact');
  });

  it('should display date information correctly', () => {
    render(<DynamicContentArea {...defaultProps} />);

    expect(screen.getByText(/march 13, 2024/i)).toBeInTheDocument();
  });

  it('should handle error states gracefully', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const props = { 
      ...defaultProps, 
      selectedDate: new Date('invalid')
    };
    
    render(<DynamicContentArea {...props} />);

    expect(screen.getByText(/error loading content/i)).toBeInTheDocument();
    
    consoleError.mockRestore();
  });

  it('should be accessible', () => {
    render(<DynamicContentArea {...defaultProps} />);

    const contentArea = screen.getByTestId('dynamic-content-area');
    expect(contentArea).toHaveAttribute('role', 'main');
    expect(contentArea).toHaveAttribute('aria-label');
  });
});

describe('DynamicContentArea Performance', () => {
  const defaultProps = {
    selectedDate: new Date('2024-03-13'),
    entryType: 'daily-journal' as const,
    onContentChange: jest.fn(),
    onEntryTypeChange: jest.fn(),
    config: mockConfig
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should complete transitions within 200ms requirement', async () => {
    const { rerender } = render(<DynamicContentArea {...defaultProps} />);
    
    const startTime = Date.now();
    
    // Trigger transition
    const newProps = { 
      ...defaultProps, 
      entryType: 'trade-note' as const,
      config: { ...mockConfig, type: 'trade-note' }
    };
    
    rerender(<DynamicContentArea {...newProps} />);

    jest.advanceTimersByTime(200);

    await waitFor(() => {
      const element = screen.getByTestId('dynamic-content-area');
      expect(element).toHaveClass('transition-complete');
    });
    
    // Verify transition completed within requirement
    expect(Date.now() - startTime).toBeLessThanOrEqual(200);
  });

  it('should not cause layout thrashing during transitions', () => {
    const { rerender } = render(<DynamicContentArea {...defaultProps} />);
    
    // Multiple rapid changes should not cause issues
    for (let i = 0; i < 5; i++) {
      const newProps = { 
        ...defaultProps, 
        entryType: i % 2 === 0 ? 'daily-journal' as const : 'trade-note' as const,
        config: { ...mockConfig, type: i % 2 === 0 ? 'daily-journal' : 'trade-note' }
      };
      
      rerender(<DynamicContentArea {...newProps} />);
      jest.advanceTimersByTime(50);
    }
    
    // Should still be responsive
    expect(screen.getByTestId('dynamic-content-area')).toBeInTheDocument();
  });
});
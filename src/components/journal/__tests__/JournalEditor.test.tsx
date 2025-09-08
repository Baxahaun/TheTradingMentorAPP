import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JournalEditor from '../JournalEditor';
import { JournalSection, TemplateSection } from '../../../types/journal';

// Mock the debounce utility
vi.mock('../../../utils/debounce', () => ({
  debounce: (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }
}));

describe('JournalEditor', () => {
  const mockSection: JournalSection = {
    id: 'test-section',
    type: 'text',
    title: 'Test Section',
    content: '',
    order: 1,
    isRequired: false,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockTemplateSection: TemplateSection = {
    id: 'test-template-section',
    type: 'text',
    title: 'Test Template Section',
    prompt: 'What are your thoughts?',
    placeholder: 'Start writing here...',
    isRequired: false,
    order: 1,
    config: {
      minWords: 10,
      allowRichText: true
    }
  };

  const mockOnUpdate = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the journal editor with title', () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('shows guided prompts when enabled', () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
        showGuidedPrompts={true}
      />
    );

    expect(screen.getByText('Writing Guidance')).toBeInTheDocument();
    expect(screen.getByText('What are your thoughts?')).toBeInTheDocument();
  });

  it('displays word count', () => {
    const sectionWithContent = {
      ...mockSection,
      content: 'This is a test content with several words'
    };

    render(
      <JournalEditor
        section={sectionWithContent}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    expect(screen.getAllByText(/8 words/)).toHaveLength(2); // One in header, one in footer
  });

  it('shows rich text toolbar when enabled', () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('Underline (Ctrl+U)')).toBeInTheDocument();
  });

  it('calls onUpdate when content changes', async () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    const editor = screen.getByRole('textbox');
    
    // Simulate content change by directly calling the input handler
    Object.defineProperty(editor, 'innerHTML', {
      value: 'New content',
      writable: true
    });
    
    fireEvent.input(editor);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('New content');
    });
  });

  it('shows save button when onSave is provided', () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByTitle('Save (Ctrl+S)')).toBeInTheDocument();
  });

  it('handles manual save', async () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByTitle('Save (Ctrl+S)');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('shows validation messages for word count requirements', () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText(/10 more needed/)).toBeInTheDocument();
  });

  it('toggles fullscreen mode', () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    const fullscreenButton = screen.getByTitle('Toggle Fullscreen');
    fireEvent.click(fullscreenButton);

    expect(screen.getByText('Test Section - Fullscreen Mode')).toBeInTheDocument();
  });

  it('toggles preview mode', () => {
    render(
      <JournalEditor
        section={mockSection}
        templateSection={mockTemplateSection}
        onUpdate={mockOnUpdate}
        onSave={mockOnSave}
      />
    );

    const previewButton = screen.getByTitle('Toggle Preview');
    fireEvent.click(previewButton);

    expect(screen.getByText('Preview Mode')).toBeInTheDocument();
  });
});
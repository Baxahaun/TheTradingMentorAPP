/**
 * Template Editor Component Tests
 * 
 * Tests for the TemplateEditor component including:
 * - Template creation and editing
 * - Section management (add, edit, delete, reorder)
 * - Configuration options for different section types
 * - Preview mode functionality
 * - Form validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateEditor } from '../TemplateEditor';
import { JournalTemplate, TemplateSection } from '../../../types/journal';

// Mock template for editing
const mockTemplate: JournalTemplate = {
  id: 'template-1',
  userId: 'user123',
  name: 'Test Template',
  description: 'A test template',
  category: 'custom',
  sections: [
    {
      id: 'section-1',
      type: 'text',
      title: 'Daily Notes',
      prompt: 'What happened today?',
      placeholder: 'Enter your notes...',
      isRequired: true,
      order: 0,
      config: { minWords: 10, maxWords: 500 }
    },
    {
      id: 'section-2',
      type: 'checklist',
      title: 'Tasks',
      prompt: 'Complete your daily tasks',
      isRequired: false,
      order: 1,
      config: {
        items: [
          { id: 'item-1', text: 'Review trades', isRequired: false },
          { id: 'item-2', text: 'Update journal', isRequired: true }
        ]
      }
    }
  ],
  isDefault: false,
  isPublic: false,
  isSystemTemplate: false,
  usageCount: 0,
  sharedWith: [],
  tags: ['daily', 'review'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

describe('TemplateEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Information', () => {
    it('should render empty form for new template', () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('Create Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Name input should be empty
      expect(screen.getByDisplayValue('custom')).toBeInTheDocument(); // Default category
    });

    it('should populate form with existing template data', () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('Edit Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A test template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('custom')).toBeInTheDocument();
    });

    it('should update template name', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByPlaceholderText('Template name');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'New Template Name');

      expect(screen.getByDisplayValue('New Template Name')).toBeInTheDocument();
    });

    it('should update template description', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const descriptionInput = screen.getByPlaceholderText('Describe what this template is for');
      await userEvent.type(descriptionInput, 'This is a new template description');

      expect(screen.getByDisplayValue('This is a new template description')).toBeInTheDocument();
    });

    it('should update template category', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const categorySelect = screen.getByDisplayValue('Custom');
      fireEvent.change(categorySelect, { target: { value: 'pre-market' } });

      expect(screen.getByDisplayValue('Pre-Market')).toBeInTheDocument();
    });
  });

  describe('Tag Management', () => {
    it('should add new tags', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const tagInput = screen.getByPlaceholderText('Add tag');
      await userEvent.type(tagInput, 'newtag');
      
      const addButton = screen.getByRole('button', { name: '' }); // Plus icon button
      fireEvent.click(addButton);

      expect(screen.getByText('newtag')).toBeInTheDocument();
      expect(tagInput).toHaveValue(''); // Input should be cleared
    });

    it('should add tag on Enter key press', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const tagInput = screen.getByPlaceholderText('Add tag');
      await userEvent.type(tagInput, 'entertag{enter}');

      expect(screen.getByText('entertag')).toBeInTheDocument();
    });

    it('should remove tags', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('daily')).toBeInTheDocument();
      
      // Find and click the X button for the 'daily' tag
      const dailyTag = screen.getByText('daily').closest('span');
      const removeButton = dailyTag?.querySelector('button');
      
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      expect(screen.queryByText('daily')).not.toBeInTheDocument();
    });

    it('should not add duplicate tags', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      const tagInput = screen.getByPlaceholderText('Add tag');
      await userEvent.type(tagInput, 'daily{enter}');

      // Should still only have one 'daily' tag
      const dailyTags = screen.getAllByText('daily');
      expect(dailyTags).toHaveLength(1);
    });
  });

  describe('Section Management', () => {
    it('should display existing sections', () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('Daily Notes')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('2 sections')).toBeInTheDocument();
    });

    it('should show empty state when no sections exist', () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByText('No sections yet')).toBeInTheDocument();
      expect(screen.getByText('Add sections from the panel on the left to build your template')).toBeInTheDocument();
    });

    it('should add new text section', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const textSectionButton = screen.getByText('Text').closest('button');
      if (textSectionButton) {
        fireEvent.click(textSectionButton);
      }

      await waitFor(() => {
        expect(screen.getByDisplayValue('Text')).toBeInTheDocument(); // Section title
      });
    });

    it('should add new checklist section', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const checklistSectionButton = screen.getByText('Checklist').closest('button');
      if (checklistSectionButton) {
        fireEvent.click(checklistSectionButton);
      }

      await waitFor(() => {
        expect(screen.getByDisplayValue('Checklist')).toBeInTheDocument();
      });
    });

    it('should delete section', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('Daily Notes')).toBeInTheDocument();

      // Find and click delete button for the first section
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-trash-2')
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Daily Notes')).not.toBeInTheDocument();
      });
    });

    it('should toggle section required status', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      const requiredCheckboxes = screen.getAllByLabelText('Required');
      const firstCheckbox = requiredCheckboxes[0] as HTMLInputElement;

      expect(firstCheckbox.checked).toBe(true); // First section is required

      fireEvent.click(firstCheckbox);
      expect(firstCheckbox.checked).toBe(false);
    });
  });

  describe('Section Editing', () => {
    it('should open section editor when settings button is clicked', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-settings')
      );

      if (settingsButton) {
        fireEvent.click(settingsButton);
      }

      await waitFor(() => {
        expect(screen.getByDisplayValue('Daily Notes')).toBeInTheDocument(); // Title input
        expect(screen.getByDisplayValue('What happened today?')).toBeInTheDocument(); // Prompt input
      });
    });

    it('should update section title', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // Open section editor
      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-settings')
      );

      if (settingsButton) {
        fireEvent.click(settingsButton);
      }

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Daily Notes');
        fireEvent.change(titleInput, { target: { value: 'Updated Notes' } });
        expect(screen.getByDisplayValue('Updated Notes')).toBeInTheDocument();
      });
    });

    it('should update section prompt', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // Open section editor
      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-settings')
      );

      if (settingsButton) {
        fireEvent.click(settingsButton);
      }

      await waitFor(() => {
        const promptInput = screen.getByDisplayValue('What happened today?');
        fireEvent.change(promptInput, { target: { value: 'Updated prompt' } });
        expect(screen.getByDisplayValue('Updated prompt')).toBeInTheDocument();
      });
    });
  });

  describe('Section Configuration', () => {
    it('should configure text section word limits', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // Open section editor for text section
      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-settings')
      );

      if (settingsButton) {
        fireEvent.click(settingsButton);
      }

      await waitFor(() => {
        const minWordsInput = screen.getByDisplayValue('10');
        const maxWordsInput = screen.getByDisplayValue('500');

        fireEvent.change(minWordsInput, { target: { value: '20' } });
        fireEvent.change(maxWordsInput, { target: { value: '1000' } });

        expect(screen.getByDisplayValue('20')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
      });
    });

    it('should manage checklist items', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // Open section editor for checklist section (second section)
      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons[settingsButtons.length - 2]; // Second to last settings button

      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Review trades')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Update journal')).toBeInTheDocument();
      });

      // Add new checklist item
      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);

      await waitFor(() => {
        const newItemInputs = screen.getAllByPlaceholderText('Checklist item');
        expect(newItemInputs).toHaveLength(3); // Original 2 + 1 new
      });
    });

    it('should remove checklist items', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // Open section editor for checklist section
      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons[settingsButtons.length - 2];

      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Review trades')).toBeInTheDocument();
      });

      // Remove first checklist item
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-trash-2')
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Review trades')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('Update journal')).toBeInTheDocument();
      });
    });
  });

  describe('Preview Mode', () => {
    it('should toggle preview mode', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument(); // Button text changes
        expect(screen.queryByText('Add Sections')).not.toBeInTheDocument(); // Section types panel hidden
      });

      // Toggle back to edit mode
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument();
        expect(screen.getByText('Add Sections')).toBeInTheDocument();
      });
    });

    it('should show section previews in preview mode', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Daily Notes')).toBeInTheDocument();
        expect(screen.getByText('What happened today?')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your thoughts...')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation and Saving', () => {
    it('should prevent saving template without name', async () => {
      // Mock alert
      const originalAlert = window.alert;
      window.alert = jest.fn();

      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      expect(window.alert).toHaveBeenCalledWith('Template name is required');
      expect(mockOnSave).not.toHaveBeenCalled();

      // Restore original alert
      window.alert = originalAlert;
    });

    it('should prevent saving template without sections', async () => {
      // Mock alert
      const originalAlert = window.alert;
      window.alert = jest.fn();

      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Add name but no sections
      const nameInput = screen.getByPlaceholderText('Template name');
      await userEvent.type(nameInput, 'Test Template');

      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      expect(window.alert).toHaveBeenCalledWith('Template must have at least one section');
      expect(mockOnSave).not.toHaveBeenCalled();

      // Restore original alert
      window.alert = originalAlert;
    });

    it('should save valid template', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Add name
      const nameInput = screen.getByPlaceholderText('Template name');
      await userEvent.type(nameInput, 'Valid Template');

      // Add description
      const descriptionInput = screen.getByPlaceholderText('Describe what this template is for');
      await userEvent.type(descriptionInput, 'A valid template description');

      // Add a section
      const textSectionButton = screen.getByText('Text').closest('button');
      if (textSectionButton) {
        fireEvent.click(textSectionButton);
      }

      await waitFor(() => {
        const saveButton = screen.getByText('Save Template');
        fireEvent.click(saveButton);

        expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Valid Template',
          description: 'A valid template description',
          sections: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              title: 'Text'
            })
          ])
        }));
      });
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Section Reordering', () => {
    it('should handle drag and drop reordering', async () => {
      render(
        <TemplateEditor 
          template={mockTemplate} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // This test would need to simulate drag and drop events
      // For now, we'll test that the drag handles are present
      const dragHandles = screen.getAllByRole('button');
      const dragHandle = dragHandles.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-grip-vertical')
      );

      expect(dragHandle).toBeInTheDocument();
    });
  });

  describe('Rating Section Configuration', () => {
    it('should configure rating section metrics', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Add rating section
      const ratingSectionButton = screen.getByText('Rating').closest('button');
      if (ratingSectionButton) {
        fireEvent.click(ratingSectionButton);
      }

      await waitFor(() => {
        // Open section editor
        const settingsButtons = screen.getAllByRole('button');
        const settingsButton = settingsButtons.find(button => 
          button.querySelector('svg')?.classList.contains('lucide-settings')
        );

        if (settingsButton) {
          fireEvent.click(settingsButton);
        }
      });

      await waitFor(() => {
        // Should show rating configuration options
        expect(screen.getByText('Rating Scale (1 to 5)')).toBeInTheDocument();
        expect(screen.getByText('Rating Metrics')).toBeInTheDocument();
      });
    });

    it('should add rating metrics', async () => {
      render(<TemplateEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Add rating section and open editor
      const ratingSectionButton = screen.getByText('Rating').closest('button');
      if (ratingSectionButton) {
        fireEvent.click(ratingSectionButton);
      }

      await waitFor(() => {
        const settingsButtons = screen.getAllByRole('button');
        const settingsButton = settingsButtons.find(button => 
          button.querySelector('svg')?.classList.contains('lucide-settings')
        );

        if (settingsButton) {
          fireEvent.click(settingsButton);
        }
      });

      await waitFor(() => {
        const addMetricButton = screen.getByText('Add Metric');
        fireEvent.click(addMetricButton);

        expect(screen.getByPlaceholderText('Metric name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
      });
    });
  });
});
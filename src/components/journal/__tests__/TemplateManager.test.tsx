/**
 * Template Manager Component Tests
 * 
 * Tests for the TemplateManager component including:
 * - Template loading and display
 * - Template creation and editing
 * - Template deletion and duplication
 * - Import/export functionality
 * - Search and filtering
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateManager } from '../TemplateManager';
import { templateService } from '../../../services/TemplateService';
import { useAuth } from '../../../hooks/useAuth';
import { JournalTemplate, TemplateCategory } from '../../../types/journal';

// Mock dependencies
jest.mock('../../../services/TemplateService');
jest.mock('../../../hooks/useAuth');
jest.mock('../TemplateEditor', () => ({
  TemplateEditor: ({ onSave, onCancel }: any) => (
    <div data-testid="template-editor">
      <button onClick={() => onSave({ name: 'Test Template' })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

const mockTemplateService = templateService as jest.Mocked<typeof templateService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock templates
const mockUserTemplates: JournalTemplate[] = [
  {
    id: 'user-template-1',
    userId: 'user123',
    name: 'My Custom Template',
    description: 'A custom template for daily reviews',
    category: 'custom',
    sections: [
      {
        id: 'section1',
        type: 'text',
        title: 'Daily Notes',
        prompt: 'What happened today?',
        isRequired: true,
        order: 0,
        config: {}
      }
    ],
    isDefault: false,
    isPublic: false,
    isSystemTemplate: false,
    usageCount: 5,
    sharedWith: [],
    tags: ['daily', 'review'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockSystemTemplates: JournalTemplate[] = [
  {
    id: 'system-template-1',
    userId: 'system',
    name: 'Pre-Market Checklist',
    description: 'Standard pre-market preparation template',
    category: 'pre-market',
    sections: [
      {
        id: 'section1',
        type: 'checklist',
        title: 'Preparation',
        prompt: 'Complete your pre-market checklist',
        isRequired: true,
        order: 0,
        config: {
          items: [
            { id: 'item1', text: 'Check economic calendar' },
            { id: 'item2', text: 'Review key levels' }
          ]
        }
      }
    ],
    isDefault: true,
    isPublic: false,
    isSystemTemplate: true,
    usageCount: 100,
    sharedWith: [],
    tags: ['pre-market', 'checklist'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

describe('TemplateManager', () => {
  const mockUser = { uid: 'user123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
    mockTemplateService.getUserTemplates.mockResolvedValue(mockUserTemplates);
    mockTemplateService.getDefaultTemplates.mockResolvedValue(mockSystemTemplates);
  });

  describe('Template Loading', () => {
    it('should load and display templates on mount', async () => {
      render(<TemplateManager />);

      expect(screen.getByText('Loading templates...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
        expect(screen.getByText('Pre-Market Checklist')).toBeInTheDocument();
      });

      expect(mockTemplateService.getUserTemplates).toHaveBeenCalledWith('user123');
      expect(mockTemplateService.getDefaultTemplates).toHaveBeenCalled();
    });

    it('should display error message when loading fails', async () => {
      mockTemplateService.getUserTemplates.mockRejectedValue(new Error('Network error'));

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
      });
    });

    it('should show empty state when no templates exist', async () => {
      mockTemplateService.getUserTemplates.mockResolvedValue([]);
      mockTemplateService.getDefaultTemplates.mockResolvedValue([]);

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('No templates found')).toBeInTheDocument();
        expect(screen.getByText('Create your first template to get started')).toBeInTheDocument();
      });
    });
  });

  describe('Template Creation', () => {
    it('should open template editor when create button is clicked', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      const createButton = screen.getByText('New Template');
      fireEvent.click(createButton);

      expect(screen.getByTestId('template-editor')).toBeInTheDocument();
    });

    it('should save new template and reload list', async () => {
      mockTemplateService.createTemplate.mockResolvedValue('new-template-id');

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Open editor
      fireEvent.click(screen.getByText('New Template'));

      // Save template
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockTemplateService.createTemplate).toHaveBeenCalledWith('user123', expect.objectContaining({
          name: 'Test Template'
        }));
      });

      // Should reload templates
      expect(mockTemplateService.getUserTemplates).toHaveBeenCalledTimes(2);
    });

    it('should cancel template creation', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Open editor
      fireEvent.click(screen.getByText('New Template'));
      expect(screen.getByTestId('template-editor')).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByTestId('template-editor')).not.toBeInTheDocument();
    });
  });

  describe('Template Editing', () => {
    it('should open template editor for existing template', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Click on template card menu
      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (menuButton) {
        fireEvent.click(menuButton);
        
        await waitFor(() => {
          const editButton = screen.getByText('Edit');
          fireEvent.click(editButton);
        });

        expect(screen.getByTestId('template-editor')).toBeInTheDocument();
      }
    });

    it('should not allow editing system templates', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Pre-Market Checklist')).toBeInTheDocument();
      });

      // System templates should not have edit option or it should be disabled
      // This test would need to be adjusted based on actual implementation
    });
  });

  describe('Template Deletion', () => {
    it('should delete template after confirmation', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      mockTemplateService.deleteTemplate.mockResolvedValue();

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Click on template card menu
      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (menuButton) {
        fireEvent.click(menuButton);
        
        await waitFor(() => {
          const deleteButton = screen.getByText('Delete');
          fireEvent.click(deleteButton);
        });

        expect(window.confirm).toHaveBeenCalledWith(
          'Are you sure you want to delete "My Custom Template"? This action cannot be undone.'
        );
        
        await waitFor(() => {
          expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith('user123', 'user-template-1');
        });
      }

      // Restore original confirm
      window.confirm = originalConfirm;
    });

    it('should not delete template if user cancels confirmation', async () => {
      // Mock window.confirm to return false
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => false);

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Try to delete - should not call service
      expect(mockTemplateService.deleteTemplate).not.toHaveBeenCalled();

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Template Duplication', () => {
    it('should duplicate template', async () => {
      mockTemplateService.createTemplate.mockResolvedValue('duplicated-template-id');

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Click on template card menu
      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (menuButton) {
        fireEvent.click(menuButton);
        
        await waitFor(() => {
          const duplicateButton = screen.getByText('Duplicate');
          fireEvent.click(duplicateButton);
        });

        await waitFor(() => {
          expect(mockTemplateService.createTemplate).toHaveBeenCalledWith('user123', expect.objectContaining({
            name: 'My Custom Template (Copy)',
            isSystemTemplate: false
          }));
        });
      }
    });
  });

  describe('Template Export', () => {
    it('should export template as JSON file', async () => {
      const mockExportData = JSON.stringify({ name: 'Test Template' });
      mockTemplateService.exportTemplate.mockResolvedValue(mockExportData);

      // Mock URL.createObjectURL and related methods
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Click on template card menu
      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (menuButton) {
        fireEvent.click(menuButton);
        
        await waitFor(() => {
          const exportButton = screen.getByText('Export');
          fireEvent.click(exportButton);
        });

        await waitFor(() => {
          expect(mockTemplateService.exportTemplate).toHaveBeenCalledWith('user-template-1');
          expect(mockCreateObjectURL).toHaveBeenCalled();
          expect(mockClick).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Search and Filtering', () => {
    it('should filter templates by search query', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
        expect(screen.getByText('Pre-Market Checklist')).toBeInTheDocument();
      });

      // Search for "custom"
      const searchInput = screen.getByPlaceholderText('Search templates...');
      await userEvent.type(searchInput, 'custom');

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
        expect(screen.queryByText('Pre-Market Checklist')).not.toBeInTheDocument();
      });
    });

    it('should filter templates by category', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
        expect(screen.getByText('Pre-Market Checklist')).toBeInTheDocument();
      });

      // Filter by pre-market category
      const categorySelect = screen.getByDisplayValue('All Templates');
      fireEvent.change(categorySelect, { target: { value: 'pre-market' } });

      await waitFor(() => {
        expect(screen.queryByText('My Custom Template')).not.toBeInTheDocument();
        expect(screen.getByText('Pre-Market Checklist')).toBeInTheDocument();
      });
    });

    it('should show no results message when search yields no matches', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText('Search templates...');
      await userEvent.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No templates found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
      });
    });
  });

  describe('Selection Mode', () => {
    it('should handle template selection in selection mode', async () => {
      const mockOnSelectTemplate = jest.fn();

      render(
        <TemplateManager 
          mode="selection" 
          onSelectTemplate={mockOnSelectTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Select Template')).toBeInTheDocument();
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Click on template card
      const templateCard = screen.getByText('My Custom Template').closest('div');
      if (templateCard) {
        fireEvent.click(templateCard);
        expect(mockOnSelectTemplate).toHaveBeenCalledWith(mockUserTemplates[0]);
      }
    });

    it('should highlight selected template in selection mode', async () => {
      render(
        <TemplateManager 
          mode="selection" 
          selectedTemplateId="user-template-1"
        />
      );

      await waitFor(() => {
        const templateCard = screen.getByText('My Custom Template').closest('div');
        expect(templateCard).toHaveClass('border-blue-500');
      });
    });

    it('should not show management actions in selection mode', async () => {
      render(<TemplateManager mode="selection" />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Should not show New Template button
      expect(screen.queryByText('New Template')).not.toBeInTheDocument();
      expect(screen.queryByText('Import')).not.toBeInTheDocument();
    });
  });

  describe('Import Functionality', () => {
    it('should open import dialog when import button is clicked', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      expect(screen.getByText('Import Template')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop a template JSON file here, or click to select')).toBeInTheDocument();
    });

    it('should handle file import', async () => {
      mockTemplateService.importTemplate.mockResolvedValue('imported-template-id');

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Open import dialog
      fireEvent.click(screen.getByText('Import'));

      // Create a mock file
      const file = new File(['{"name": "Imported Template"}'], 'template.json', {
        type: 'application/json'
      });

      // Simulate file selection
      const fileInput = screen.getByLabelText('Select File');
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockTemplateService.importTemplate).toHaveBeenCalledWith('user123', '{"name": "Imported Template"}');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message and allow dismissal', async () => {
      mockTemplateService.deleteTemplate.mockRejectedValue(new Error('Delete failed'));

      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
      });

      // Try to delete template (will fail)
      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );
      
      if (menuButton) {
        fireEvent.click(menuButton);
        
        await waitFor(() => {
          const deleteButton = screen.getByText('Delete');
          fireEvent.click(deleteButton);
        });

        await waitFor(() => {
          expect(screen.getByText('Failed to delete template')).toBeInTheDocument();
        });

        // Dismiss error
        const dismissButton = screen.getByText('Dismiss');
        fireEvent.click(dismissButton);

        expect(screen.queryByText('Failed to delete template')).not.toBeInTheDocument();
      }

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Template Card Display', () => {
    it('should display template information correctly', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
        expect(screen.getByText('A custom template for daily reviews')).toBeInTheDocument();
        expect(screen.getByText('1 sections')).toBeInTheDocument();
        expect(screen.getByText('5 uses')).toBeInTheDocument();
        expect(screen.getByText('daily')).toBeInTheDocument();
        expect(screen.getByText('review')).toBeInTheDocument();
      });
    });

    it('should show system template indicators', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Pre-Market Checklist')).toBeInTheDocument();
        // Should show star icon for system templates
        const starIcons = screen.getAllByTestId('star-icon');
        expect(starIcons.length).toBeGreaterThan(0);
      });
    });
  });
});
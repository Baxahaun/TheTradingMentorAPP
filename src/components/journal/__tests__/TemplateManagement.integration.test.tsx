/**
 * Template Management Integration Tests
 * 
 * End-to-end tests for the complete template management workflow including:
 * - Creating templates with the editor
 * - Managing templates in the manager
 * - Template service integration
 * - Real workflow scenarios
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateManager } from '../TemplateManager';
import { templateService } from '../../../services/TemplateService';
import { useAuth } from '../../../hooks/useAuth';
import { JournalTemplate } from '../../../types/journal';

// Mock dependencies
jest.mock('../../../services/TemplateService');
jest.mock('../../../hooks/useAuth');

const mockTemplateService = templateService as jest.Mocked<typeof templateService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Template Management Integration', () => {
  const mockUser = { uid: 'user123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
    mockTemplateService.getUserTemplates.mockResolvedValue([]);
    mockTemplateService.getDefaultTemplates.mockResolvedValue([]);
  });

  describe('Complete Template Creation Workflow', () => {
    it('should create a complete template from start to finish', async () => {
      mockTemplateService.createTemplate.mockResolvedValue('new-template-id');

      render(<TemplateManager />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('No templates found')).toBeInTheDocument();
      });

      // Start creating new template
      const createButton = screen.getByText('Create Template');
      fireEvent.click(createButton);

      // Should open template editor
      await waitFor(() => {
        expect(screen.getByText('Create Template')).toBeInTheDocument();
      });

      // Fill in basic template information
      const nameInput = screen.getByPlaceholderText('Template name');
      await userEvent.type(nameInput, 'My Daily Review');

      const descriptionInput = screen.getByPlaceholderText('Describe what this template is for');
      await userEvent.type(descriptionInput, 'A comprehensive daily trading review template');

      const categorySelect = screen.getByDisplayValue('Custom');
      fireEvent.change(categorySelect, { target: { value: 'post-market' } });

      // Add tags
      const tagInput = screen.getByPlaceholderText('Add tag');
      await userEvent.type(tagInput, 'daily{enter}');
      await userEvent.type(tagInput, 'review{enter}');

      // Add sections
      // 1. Add text section
      const textSectionButton = screen.getByText('Text').closest('button');
      if (textSectionButton) {
        fireEvent.click(textSectionButton);
      }

      await waitFor(() => {
        expect(screen.getByDisplayValue('Text')).toBeInTheDocument();
      });

      // Configure text section
      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-settings')
      );

      if (settingsButton) {
        fireEvent.click(settingsButton);
      }

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Text');
        fireEvent.change(titleInput, { target: { value: 'Daily Summary' } });

        const promptInput = screen.getByDisplayValue('Share your thoughts and observations');
        fireEvent.change(promptInput, { target: { value: 'Summarize your trading day' } });

        const minWordsInput = screen.getByLabelText('Min Words');
        fireEvent.change(minWordsInput, { target: { value: '50' } });
      });

      // 2. Add checklist section
      const checklistSectionButton = screen.getByText('Checklist').closest('button');
      if (checklistSectionButton) {
        fireEvent.click(checklistSectionButton);
      }

      await waitFor(() => {
        // Configure checklist section
        const allSettingsButtons = screen.getAllByRole('button');
        const checklistSettingsButton = allSettingsButtons[allSettingsButtons.length - 1];
        
        if (checklistSettingsButton.querySelector('svg')?.classList.contains('lucide-settings')) {
          fireEvent.click(checklistSettingsButton);
        }
      });

      await waitFor(() => {
        const checklistTitleInput = screen.getAllByDisplayValue('Checklist')[0];
        fireEvent.change(checklistTitleInput, { target: { value: 'End of Day Tasks' } });

        // Add checklist items
        const addItemButton = screen.getByText('Add Item');
        fireEvent.click(addItemButton);

        const itemInput = screen.getByPlaceholderText('Checklist item');
        fireEvent.change(itemInput, { target: { value: 'Review all trades' } });
      });

      // 3. Add rating section
      const ratingSectionButton = screen.getByText('Rating').closest('button');
      if (ratingSectionButton) {
        fireEvent.click(ratingSectionButton);
      }

      await waitFor(() => {
        // Configure rating section
        const allSettingsButtons = screen.getAllByRole('button');
        const ratingSettingsButton = allSettingsButtons[allSettingsButtons.length - 1];
        
        if (ratingSettingsButton.querySelector('svg')?.classList.contains('lucide-settings')) {
          fireEvent.click(ratingSettingsButton);
        }
      });

      await waitFor(() => {
        const ratingTitleInput = screen.getAllByDisplayValue('Rating')[0];
        fireEvent.change(ratingTitleInput, { target: { value: 'Performance Metrics' } });

        // Add rating metric
        const addMetricButton = screen.getByText('Add Metric');
        fireEvent.click(addMetricButton);

        const metricNameInput = screen.getByPlaceholderText('Metric name');
        fireEvent.change(metricNameInput, { target: { value: 'Discipline' } });

        const metricDescInput = screen.getByPlaceholderText('Description (optional)');
        fireEvent.change(metricDescInput, { target: { value: 'How well did you follow your plan?' } });
      });

      // Test preview mode
      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Daily Summary')).toBeInTheDocument();
        expect(screen.getByText('End of Day Tasks')).toBeInTheDocument();
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      });

      // Switch back to edit mode
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      // Save template
      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockTemplateService.createTemplate).toHaveBeenCalledWith('user123', expect.objectContaining({
          name: 'My Daily Review',
          description: 'A comprehensive daily trading review template',
          category: 'post-market',
          tags: ['daily', 'review'],
          sections: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              title: 'Daily Summary'
            }),
            expect.objectContaining({
              type: 'checklist',
              title: 'End of Day Tasks'
            }),
            expect.objectContaining({
              type: 'rating',
              title: 'Performance Metrics'
            })
          ])
        }));
      });
    });
  });

  describe('Template Editing Workflow', () => {
    const existingTemplate: JournalTemplate = {
      id: 'template-1',
      userId: 'user123',
      name: 'Existing Template',
      description: 'An existing template',
      category: 'custom',
      sections: [
        {
          id: 'section-1',
          type: 'text',
          title: 'Notes',
          prompt: 'Enter notes',
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
      tags: ['test'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    it('should edit existing template', async () => {
      mockTemplateService.getUserTemplates.mockResolvedValue([existingTemplate]);
      mockTemplateService.updateTemplate.mockResolvedValue();

      render(<TemplateManager />);

      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Existing Template')).toBeInTheDocument();
      });

      // Open template menu and click edit
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
      }

      // Should open editor with existing data
      await waitFor(() => {
        expect(screen.getByText('Edit Template')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Template')).toBeInTheDocument();
      });

      // Modify template
      const nameInput = screen.getByDisplayValue('Existing Template');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Template');

      // Add new section
      const checklistSectionButton = screen.getByText('Checklist').closest('button');
      if (checklistSectionButton) {
        fireEvent.click(checklistSectionButton);
      }

      // Save changes
      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockTemplateService.updateTemplate).toHaveBeenCalledWith(
          'user123',
          'template-1',
          expect.objectContaining({
            name: 'Updated Template'
          })
        );
      });
    });
  });

  describe('Template Import/Export Workflow', () => {
    it('should export and import template', async () => {
      const template: JournalTemplate = {
        id: 'template-1',
        userId: 'user123',
        name: 'Export Template',
        description: 'Template for export',
        category: 'custom',
        sections: [],
        isDefault: false,
        isPublic: false,
        isSystemTemplate: false,
        usageCount: 0,
        sharedWith: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockTemplateService.getUserTemplates.mockResolvedValue([template]);
      mockTemplateService.exportTemplate.mockResolvedValue(JSON.stringify({
        name: 'Export Template',
        description: 'Template for export',
        category: 'custom',
        sections: []
      }));
      mockTemplateService.importTemplate.mockResolvedValue('imported-template-id');

      // Mock URL.createObjectURL and related methods
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      const mockClick = jest.fn();

      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

      render(<TemplateManager />);

      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Export Template')).toBeInTheDocument();
      });

      // Export template
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
          expect(mockTemplateService.exportTemplate).toHaveBeenCalledWith('template-1');
          expect(mockCreateObjectURL).toHaveBeenCalled();
          expect(mockClick).toHaveBeenCalled();
        });
      }

      // Import template
      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import Template')).toBeInTheDocument();
      });

      // Simulate file selection
      const file = new File([JSON.stringify({
        name: 'Imported Template',
        description: 'An imported template',
        category: 'custom',
        sections: []
      })], 'template.json', { type: 'application/json' });

      const fileInput = screen.getByLabelText('Select File');
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockTemplateService.importTemplate).toHaveBeenCalledWith(
          'user123',
          expect.stringContaining('Imported Template')
        );
      });
    });
  });

  describe('Template Selection Workflow', () => {
    it('should select template in selection mode', async () => {
      const templates: JournalTemplate[] = [
        {
          id: 'template-1',
          userId: 'user123',
          name: 'Daily Review',
          description: 'Daily review template',
          category: 'post-market',
          sections: [],
          isDefault: false,
          isPublic: false,
          isSystemTemplate: false,
          usageCount: 0,
          sharedWith: [],
          tags: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'template-2',
          userId: 'system',
          name: 'Pre-Market Checklist',
          description: 'System template',
          category: 'pre-market',
          sections: [],
          isDefault: true,
          isPublic: false,
          isSystemTemplate: true,
          usageCount: 100,
          sharedWith: [],
          tags: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockTemplateService.getUserTemplates.mockResolvedValue([templates[0]]);
      mockTemplateService.getDefaultTemplates.mockResolvedValue([templates[1]]);

      const mockOnSelectTemplate = jest.fn();

      render(
        <TemplateManager 
          mode="selection" 
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplateId="template-1"
        />
      );

      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Select Template')).toBeInTheDocument();
        expect(screen.getByText('Daily Review')).toBeInTheDocument();
        expect(screen.getByText('Pre-Market Checklist')).toBeInTheDocument();
      });

      // Should show selected template highlighted
      const selectedTemplate = screen.getByText('Daily Review').closest('div');
      expect(selectedTemplate).toHaveClass('border-blue-500');

      // Select different template
      const preMarketTemplate = screen.getByText('Pre-Market Checklist').closest('div');
      if (preMarketTemplate) {
        fireEvent.click(preMarketTemplate);
        expect(mockOnSelectTemplate).toHaveBeenCalledWith(templates[1]);
      }
    });
  });

  describe('Search and Filter Integration', () => {
    it('should search and filter templates effectively', async () => {
      const templates: JournalTemplate[] = [
        {
          id: 'template-1',
          userId: 'user123',
          name: 'Daily Review',
          description: 'Daily trading review',
          category: 'post-market',
          sections: [],
          isDefault: false,
          isPublic: false,
          isSystemTemplate: false,
          usageCount: 0,
          sharedWith: [],
          tags: ['daily', 'review'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'template-2',
          userId: 'user123',
          name: 'Pre-Market Setup',
          description: 'Morning preparation',
          category: 'pre-market',
          sections: [],
          isDefault: false,
          isPublic: false,
          isSystemTemplate: false,
          usageCount: 0,
          sharedWith: [],
          tags: ['morning', 'preparation'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockTemplateService.getUserTemplates.mockResolvedValue(templates);

      render(<TemplateManager />);

      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Daily Review')).toBeInTheDocument();
        expect(screen.getByText('Pre-Market Setup')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText('Search templates...');
      await userEvent.type(searchInput, 'daily');

      await waitFor(() => {
        expect(screen.getByText('Daily Review')).toBeInTheDocument();
        expect(screen.queryByText('Pre-Market Setup')).not.toBeInTheDocument();
      });

      // Clear search
      await userEvent.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Daily Review')).toBeInTheDocument();
        expect(screen.getByText('Pre-Market Setup')).toBeInTheDocument();
      });

      // Test category filter
      const categorySelect = screen.getByDisplayValue('All Templates');
      fireEvent.change(categorySelect, { target: { value: 'pre-market' } });

      await waitFor(() => {
        expect(screen.queryByText('Daily Review')).not.toBeInTheDocument();
        expect(screen.getByText('Pre-Market Setup')).toBeInTheDocument();
      });

      // Combine search and filter
      await userEvent.type(searchInput, 'setup');

      await waitFor(() => {
        expect(screen.getByText('Pre-Market Setup')).toBeInTheDocument();
      });

      // Search for something that doesn't match the filter
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'daily');

      await waitFor(() => {
        expect(screen.getByText('No templates found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service errors gracefully', async () => {
      mockTemplateService.getUserTemplates.mockRejectedValue(new Error('Network error'));

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
      });

      // Should allow dismissing error
      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Failed to load templates')).not.toBeInTheDocument();
    });

    it('should handle template creation errors', async () => {
      mockTemplateService.createTemplate.mockRejectedValue(new Error('Creation failed'));

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Create Template')).toBeInTheDocument();
      });

      // Create template
      const createButton = screen.getByText('Create Template');
      fireEvent.click(createButton);

      // Fill minimal data and save
      const nameInput = screen.getByPlaceholderText('Template name');
      await userEvent.type(nameInput, 'Test Template');

      const textSectionButton = screen.getByText('Text').closest('button');
      if (textSectionButton) {
        fireEvent.click(textSectionButton);
      }

      await waitFor(() => {
        const saveButton = screen.getByText('Save Template');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to save template')).toBeInTheDocument();
      });
    });
  });
});
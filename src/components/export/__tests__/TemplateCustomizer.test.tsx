import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateCustomizer } from '../TemplateCustomizer';
import { ReportTemplate } from '../../../types/export';

// Mock the StrategyExportService
vi.mock('../../../services/StrategyExportService', () => ({
  StrategyExportService: vi.fn().mockImplementation(() => ({
    getAvailableTemplates: vi.fn().mockReturnValue([
      {
        id: 'default',
        name: 'Standard Report',
        sections: [
          { type: 'summary', title: 'Strategy Summary', enabled: true },
          { type: 'performance', title: 'Performance Metrics', enabled: true },
          { type: 'trades', title: 'Trade History', enabled: true },
          { type: 'charts', title: 'Performance Charts', enabled: false },
          { type: 'insights', title: 'AI Insights', enabled: false }
        ],
        styling: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          fontFamily: 'Arial',
          fontSize: 12,
          includeHeader: true,
          includeFooter: true
        }
      }
    ]),
    createCustomTemplate: vi.fn().mockImplementation((name, sections, styling) => ({
      id: `custom_${Date.now()}`,
      name,
      sections,
      styling: { 
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Arial',
        fontSize: 12,
        includeHeader: true,
        includeFooter: true,
        ...styling 
      }
    }))
  }))
}));

describe('TemplateCustomizer', () => {
  let mockOnOpenChange: ReturnType<typeof vi.fn>;
  let mockOnTemplateCreated: ReturnType<typeof vi.fn>;
  let mockBaseTemplate: ReportTemplate;

  beforeEach(() => {
    mockOnOpenChange = vi.fn();
    mockOnTemplateCreated = vi.fn();
    
    mockBaseTemplate = {
      id: 'base-template',
      name: 'Base Template',
      sections: [
        { type: 'summary', title: 'Overview', enabled: true },
        { type: 'performance', title: 'Metrics', enabled: true },
        { type: 'trades', title: 'Trades', enabled: false }
      ],
      styling: {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        fontFamily: 'Helvetica',
        fontSize: 14,
        includeHeader: false,
        includeFooter: true
      }
    };
  });

  it('renders template customizer with correct title', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    expect(screen.getByText('Customize Report Template')).toBeInTheDocument();
    expect(screen.getByText('Create a custom template for your strategy reports.')).toBeInTheDocument();
  });

  it('displays template name input field', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    expect(screen.getByLabelText('Template Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter template name')).toBeInTheDocument();
  });

  it('displays report sections configuration', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    expect(screen.getByText('Report Sections')).toBeInTheDocument();
    
    // Should show default sections
    expect(screen.getByDisplayValue('Strategy Summary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Trade History')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Performance Charts')).toBeInTheDocument();
    expect(screen.getByDisplayValue('AI Insights')).toBeInTheDocument();
  });

  it('displays styling options', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    expect(screen.getByText('Styling Options')).toBeInTheDocument();
    expect(screen.getByLabelText('Primary Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Secondary Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Font Family')).toBeInTheDocument();
    expect(screen.getByLabelText('Font Size')).toBeInTheDocument();
    expect(screen.getByLabelText('Include Header')).toBeInTheDocument();
    expect(screen.getByLabelText('Include Footer')).toBeInTheDocument();
  });

  it('loads base template data when provided', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
        baseTemplate={mockBaseTemplate}
      />
    );

    expect(screen.getByDisplayValue('Base Template')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Overview')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Metrics')).toBeInTheDocument();
  });

  it('allows template name to be changed', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const nameInput = screen.getByLabelText('Template Name');
    fireEvent.change(nameInput, { target: { value: 'My Custom Template' } });

    expect(nameInput).toHaveValue('My Custom Template');
  });

  it('allows sections to be toggled on/off', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstSectionCheckbox = checkboxes[0]; // First section checkbox

    // Toggle the checkbox
    fireEvent.click(firstSectionCheckbox);

    // The checkbox state should change
    expect(firstSectionCheckbox).not.toBeChecked();
  });

  it('allows section titles to be modified', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const titleInput = screen.getByDisplayValue('Strategy Summary');
    fireEvent.change(titleInput, { target: { value: 'Custom Summary Title' } });

    expect(titleInput).toHaveValue('Custom Summary Title');
  });

  it('disables section title input when section is disabled', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
        baseTemplate={mockBaseTemplate}
      />
    );

    // Find the disabled section (trades in mockBaseTemplate)
    const tradesInput = screen.getByDisplayValue('Trades');
    expect(tradesInput).toBeDisabled();
  });

  it('allows styling colors to be changed', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const primaryColorInput = screen.getByLabelText('Primary Color');
    fireEvent.change(primaryColorInput, { target: { value: '#ff0000' } });

    expect(primaryColorInput).toHaveValue('#ff0000');
  });

  it('allows font family selection', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const fontSelect = screen.getByDisplayValue('Arial');
    fireEvent.click(fontSelect);
    
    // Should show font options
    expect(screen.getByText('Helvetica')).toBeInTheDocument();
    expect(screen.getByText('Times New Roman')).toBeInTheDocument();
    expect(screen.getByText('Courier New')).toBeInTheDocument();
  });

  it('allows font size selection', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const fontSizeSelect = screen.getByDisplayValue('12pt');
    fireEvent.click(fontSizeSelect);
    
    // Should show font size options
    expect(screen.getByText('10pt')).toBeInTheDocument();
    expect(screen.getByText('14pt')).toBeInTheDocument();
    expect(screen.getByText('16pt')).toBeInTheDocument();
  });

  it('allows header and footer options to be toggled', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const headerCheckbox = screen.getByLabelText('Include Header');
    const footerCheckbox = screen.getByLabelText('Include Footer');

    fireEvent.click(headerCheckbox);
    fireEvent.click(footerCheckbox);

    expect(headerCheckbox).not.toBeChecked();
    expect(footerCheckbox).not.toBeChecked();
  });

  it('saves template when save button is clicked', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    // Enter template name
    const nameInput = screen.getByLabelText('Template Name');
    fireEvent.change(nameInput, { target: { value: 'Test Template' } });

    // Click save
    const saveButton = screen.getByText('Save Template');
    fireEvent.click(saveButton);

    expect(mockOnTemplateCreated).toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables save button when template name is empty', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const saveButton = screen.getByText('Save Template');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when template name is provided', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const nameInput = screen.getByLabelText('Template Name');
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    const saveButton = screen.getByText('Save Template');
    expect(saveButton).not.toBeDisabled();
  });

  it('closes dialog when cancel is clicked', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('creates template with correct structure when saved', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    // Set template name
    const nameInput = screen.getByLabelText('Template Name');
    fireEvent.change(nameInput, { target: { value: 'Custom Template' } });

    // Modify a section title
    const summaryInput = screen.getByDisplayValue('Strategy Summary');
    fireEvent.change(summaryInput, { target: { value: 'Modified Summary' } });

    // Change primary color
    const colorInput = screen.getByLabelText('Primary Color');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    // Save template
    const saveButton = screen.getByText('Save Template');
    fireEvent.click(saveButton);

    expect(mockOnTemplateCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Template',
        sections: expect.arrayContaining([
          expect.objectContaining({
            title: 'Modified Summary'
          })
        ]),
        styling: expect.objectContaining({
          primaryColor: '#ff0000'
        })
      })
    );
  });

  it('shows section types as labels', () => {
    render(
      <TemplateCustomizer
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateCreated={mockOnTemplateCreated}
      />
    );

    expect(screen.getByText('summary')).toBeInTheDocument();
    expect(screen.getByText('performance')).toBeInTheDocument();
    expect(screen.getByText('trades')).toBeInTheDocument();
    expect(screen.getByText('charts')).toBeInTheDocument();
    expect(screen.getByText('insights')).toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MethodologySelector } from '../MethodologySelector';
import { ProfessionalStrategy } from '@/types/strategy';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('MethodologySelector', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    data: {} as Partial<ProfessionalStrategy>,
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all basic information fields', () => {
    render(<MethodologySelector {...defaultProps} />);
    
    expect(screen.getByLabelText(/strategy title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/strategy color/i)).toBeInTheDocument();
  });

  it('renders all methodology options', () => {
    render(<MethodologySelector {...defaultProps} />);
    
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('Fundamental')).toBeInTheDocument();
    expect(screen.getByText('Quantitative')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
  });

  it('renders timeframe selector', () => {
    render(<MethodologySelector {...defaultProps} />);
    
    expect(screen.getByText(/primary timeframe/i)).toBeInTheDocument();
    expect(screen.getByText(/select primary timeframe/i)).toBeInTheDocument();
  });

  it('renders asset class options', () => {
    render(<MethodologySelector {...defaultProps} />);
    
    expect(screen.getByText(/asset classes/i)).toBeInTheDocument();
    expect(screen.getByText('Forex')).toBeInTheDocument();
    expect(screen.getByText('Indices')).toBeInTheDocument();
    expect(screen.getByText('Commodities')).toBeInTheDocument();
    expect(screen.getByText('Cryptocurrencies')).toBeInTheDocument();
  });

  it('updates title when input changes', async () => {
    const user = userEvent.setup();
    render(<MethodologySelector {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/strategy title/i);
    await user.type(titleInput, 'My Trading Strategy');
    
    expect(mockOnChange).toHaveBeenCalledWith({ title: 'My Trading Strategy' });
  });

  it('updates description when textarea changes', async () => {
    const user = userEvent.setup();
    render(<MethodologySelector {...defaultProps} />);
    
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'A comprehensive trading approach');
    
    expect(mockOnChange).toHaveBeenCalledWith({ description: 'A comprehensive trading approach' });
  });

  it('selects methodology when clicked', async () => {
    const user = userEvent.setup();
    render(<MethodologySelector {...defaultProps} />);
    
    const technicalOption = screen.getByText('Technical').closest('div');
    await user.click(technicalOption!);
    
    expect(mockOnChange).toHaveBeenCalledWith({ methodology: 'Technical' });
  });

  it('highlights selected methodology', () => {
    const dataWithMethodology = {
      ...defaultProps.data,
      methodology: 'Technical' as const
    };
    
    render(<MethodologySelector {...defaultProps} data={dataWithMethodology} />);
    
    const technicalOption = screen.getByText('Technical').closest('div');
    expect(technicalOption).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('shows methodology descriptions and examples', () => {
    render(<MethodologySelector {...defaultProps} />);
    
    expect(screen.getByText(/based on price action, chart patterns/i)).toBeInTheDocument();
    expect(screen.getByText(/moving averages/i)).toBeInTheDocument();
    expect(screen.getByText(/economic data, company financials/i)).toBeInTheDocument();
    expect(screen.getByText(/mathematical models and statistical/i)).toBeInTheDocument();
  });

  it('updates color when color button is clicked', async () => {
    const user = userEvent.setup();
    render(<MethodologySelector {...defaultProps} />);
    
    const colorButtons = screen.getAllByRole('button').filter(button => 
      button.style.backgroundColor
    );
    
    await user.click(colorButtons[1]); // Click second color option
    
    expect(mockOnChange).toHaveBeenCalledWith({ color: expect.any(String) });
  });

  it('highlights selected color', () => {
    const dataWithColor = {
      ...defaultProps.data,
      color: '#EF4444'
    };
    
    render(<MethodologySelector {...defaultProps} data={dataWithColor} />);
    
    const colorButtons = screen.getAllByRole('button').filter(button => 
      button.style.backgroundColor === 'rgb(239, 68, 68)' // #EF4444 in RGB
    );
    
    expect(colorButtons[0]).toHaveClass('border-gray-900');
  });

  it('toggles asset classes when clicked', async () => {
    const user = userEvent.setup();
    render(<MethodologySelector {...defaultProps} />);
    
    const forexButton = screen.getByText('Forex');
    await user.click(forexButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({ assetClasses: ['Forex'] });
  });

  it('removes asset class when clicked again', async () => {
    const user = userEvent.setup();
    const dataWithAssets = {
      ...defaultProps.data,
      assetClasses: ['Forex', 'Indices']
    };
    
    render(<MethodologySelector {...defaultProps} data={dataWithAssets} />);
    
    const forexButton = screen.getByText('Forex');
    await user.click(forexButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({ assetClasses: ['Indices'] });
  });

  it('highlights selected asset classes', () => {
    const dataWithAssets = {
      ...defaultProps.data,
      assetClasses: ['Forex', 'Indices']
    };
    
    render(<MethodologySelector {...defaultProps} data={dataWithAssets} />);
    
    const forexButton = screen.getByText('Forex');
    const indicesButton = screen.getByText('Indices');
    
    expect(forexButton).toHaveClass('border-blue-500', 'bg-blue-50');
    expect(indicesButton).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('shows strategy preview when data is complete', () => {
    const completeData = {
      title: 'Trend Following Strategy',
      methodology: 'Technical' as const,
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      color: '#3B82F6',
      description: 'A momentum-based approach'
    };
    
    render(<MethodologySelector {...defaultProps} data={completeData} />);
    
    expect(screen.getByText('Strategy Preview')).toBeInTheDocument();
    expect(screen.getByText('Trend Following Strategy')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('1H')).toBeInTheDocument();
    expect(screen.getByText('1 asset')).toBeInTheDocument();
    expect(screen.getByText('A momentum-based approach')).toBeInTheDocument();
  });

  it('shows validation errors when provided', () => {
    const validation = {
      isValid: false,
      errors: [
        { field: 'title', message: 'Title is required', code: 'required', severity: 'error' as const }
      ],
      warnings: []
    };
    
    render(<MethodologySelector {...defaultProps} validation={validation} />);
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('shows validation warnings when provided', () => {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [
        { field: 'description', message: 'Consider adding more details', code: 'suggestion', severity: 'warning' as const }
      ]
    };
    
    render(<MethodologySelector {...defaultProps} validation={validation} />);
    
    expect(screen.getByText('Consider adding more details')).toBeInTheDocument();
  });

  it('applies error styling to fields with errors', () => {
    const validation = {
      isValid: false,
      errors: [
        { field: 'title', message: 'Title is required', code: 'required', severity: 'error' as const }
      ],
      warnings: []
    };
    
    render(<MethodologySelector {...defaultProps} validation={validation} />);
    
    const titleInput = screen.getByLabelText(/strategy title/i);
    expect(titleInput).toHaveClass('border-red-500');
  });

  it('displays existing data correctly', () => {
    const existingData = {
      title: 'Existing Strategy',
      description: 'An existing trading strategy',
      methodology: 'Fundamental' as const,
      primaryTimeframe: '4H',
      assetClasses: ['Stocks', 'Bonds'],
      color: '#10B981'
    };
    
    render(<MethodologySelector {...defaultProps} data={existingData} />);
    
    expect(screen.getByDisplayValue('Existing Strategy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('An existing trading strategy')).toBeInTheDocument();
    
    const fundamentalOption = screen.getByText('Fundamental').closest('div');
    expect(fundamentalOption).toHaveClass('border-blue-500');
    
    const stocksButton = screen.getByText('Stocks');
    const bondsButton = screen.getByText('Bonds');
    expect(stocksButton).toHaveClass('border-blue-500');
    expect(bondsButton).toHaveClass('border-blue-500');
  });

  it('shows correct asset count in preview', () => {
    const dataWithMultipleAssets = {
      title: 'Multi-Asset Strategy',
      methodology: 'Hybrid' as const,
      assetClasses: ['Forex', 'Indices', 'Commodities']
    };
    
    render(<MethodologySelector {...defaultProps} data={dataWithMultipleAssets} />);
    
    expect(screen.getByText('3 assets')).toBeInTheDocument();
  });

  it('handles empty asset classes array', () => {
    const dataWithEmptyAssets = {
      title: 'Test Strategy',
      methodology: 'Technical' as const,
      assetClasses: []
    };
    
    render(<MethodologySelector {...defaultProps} data={dataWithEmptyAssets} />);
    
    // Should not show asset count in preview
    expect(screen.queryByText(/\d+ asset/)).not.toBeInTheDocument();
  });
});
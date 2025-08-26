import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SetupConditionsBuilder } from '../SetupConditionsBuilder';
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
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('SetupConditionsBuilder', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    data: {} as Partial<ProfessionalStrategy>,
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders market environment section', () => {
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    expect(screen.getByText(/market environment/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe when this strategy works best/i)).toBeInTheDocument();
  });

  it('renders technical conditions section', () => {
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    expect(screen.getByText(/technical conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/required technical setup/i)).toBeInTheDocument();
  });

  it('renders volatility requirements section', () => {
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    expect(screen.getByText(/volatility requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/preferred volatility environment/i)).toBeInTheDocument();
  });

  it('updates market environment when textarea changes', async () => {
    const user = userEvent.setup();
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/describe when this strategy works best/i);
    await user.type(textarea, 'Strong trending market');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: 'Strong trending market',
        technicalConditions: [],
        fundamentalConditions: [],
        volatilityRequirements: ''
      }
    });
  });

  it('selects predefined market environment', async () => {
    const user = userEvent.setup();
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const environmentButton = screen.getByText('Strong uptrend with momentum');
    await user.click(environmentButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: 'Strong uptrend with momentum',
        technicalConditions: [],
        fundamentalConditions: [],
        volatilityRequirements: ''
      }
    });
  });

  it('adds custom technical condition', async () => {
    const user = userEvent.setup();
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/add custom technical condition/i);
    await user.type(input, 'Custom RSI condition');
    
    const addButton = screen.getByRole('button', { name: '' }); // Plus icon button
    await user.click(addButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: ['Custom RSI condition'],
        fundamentalConditions: [],
        volatilityRequirements: ''
      }
    });
  });

  it('adds technical condition on Enter key press', async () => {
    const user = userEvent.setup();
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/add custom technical condition/i);
    await user.type(input, 'MACD bullish{enter}');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: ['MACD bullish'],
        fundamentalConditions: [],
        volatilityRequirements: ''
      }
    });
  });

  it('adds predefined technical condition', async () => {
    const user = userEvent.setup();
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const conditionButton = screen.getByText('Price above 20 EMA');
    await user.click(conditionButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: ['Price above 20 EMA'],
        fundamentalConditions: [],
        volatilityRequirements: ''
      }
    });
  });

  it('removes technical condition when X is clicked', async () => {
    const user = userEvent.setup();
    const dataWithConditions = {
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: ['RSI > 50', 'MACD bullish'],
        fundamentalConditions: [],
        volatilityRequirements: ''
      }
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={dataWithConditions} />);
    
    // Find the X button for the first condition
    const removeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') // X icon
    );
    
    await user.click(removeButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: ['MACD bullish'],
        fundamentalConditions: [],
        volatilityRequirements: ''
      }
    });
  });

  it('prevents adding duplicate technical conditions', async () => {
    const user = userEvent.setup();
    const dataWithConditions = {
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: ['RSI > 50'],
        fundamentalConditions: [],
        volatilityRequirements: ''
      }
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={dataWithConditions} />);
    
    const conditionButton = screen.getByText('RSI > 50');
    expect(conditionButton).toHaveClass('cursor-not-allowed');
    
    await user.click(conditionButton);
    
    // Should not add duplicate
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('shows fundamental conditions for Fundamental methodology', () => {
    const dataWithFundamental = {
      methodology: 'Fundamental' as const
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={dataWithFundamental} />);
    
    expect(screen.getByText(/fundamental conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/fundamental setup requirements/i)).toBeInTheDocument();
  });

  it('shows fundamental conditions for Hybrid methodology', () => {
    const dataWithHybrid = {
      methodology: 'Hybrid' as const
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={dataWithHybrid} />);
    
    expect(screen.getByText(/fundamental conditions/i)).toBeInTheDocument();
  });

  it('hides fundamental conditions for Technical methodology', () => {
    const dataWithTechnical = {
      methodology: 'Technical' as const
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={dataWithTechnical} />);
    
    expect(screen.queryByText(/fundamental conditions/i)).not.toBeInTheDocument();
  });

  it('adds and removes fundamental conditions', async () => {
    const user = userEvent.setup();
    const dataWithFundamental = {
      methodology: 'Fundamental' as const
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={dataWithFundamental} />);
    
    const conditionButton = screen.getByText('Positive earnings surprise');
    await user.click(conditionButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: [],
        fundamentalConditions: ['Positive earnings surprise'],
        volatilityRequirements: ''
      }
    });
  });

  it('selects volatility requirement', async () => {
    const user = userEvent.setup();
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const volatilityButton = screen.getByText('High volatility (VIX > 30)');
    await user.click(volatilityButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: [],
        fundamentalConditions: [],
        volatilityRequirements: 'High volatility (VIX > 30)'
      }
    });
  });

  it('allows custom volatility requirement', async () => {
    const user = userEvent.setup();
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const customInput = screen.getByPlaceholderText(/describe custom volatility requirements/i);
    await user.type(customInput, 'ATR above 50 pips');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: [],
        fundamentalConditions: [],
        volatilityRequirements: 'ATR above 50 pips'
      }
    });
  });

  it('highlights selected volatility requirement', () => {
    const dataWithVolatility = {
      setupConditions: {
        marketEnvironment: '',
        technicalConditions: [],
        fundamentalConditions: [],
        volatilityRequirements: 'High volatility (VIX > 30)'
      }
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={dataWithVolatility} />);
    
    const volatilityButton = screen.getByText('High volatility (VIX > 30)');
    expect(volatilityButton).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('shows setup summary when conditions are complete', () => {
    const completeData = {
      setupConditions: {
        marketEnvironment: 'Strong trending market',
        technicalConditions: ['RSI > 50', 'MACD bullish'],
        fundamentalConditions: ['Positive earnings'],
        volatilityRequirements: 'High volatility'
      }
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={completeData} />);
    
    expect(screen.getByText('Setup Summary')).toBeInTheDocument();
    expect(screen.getByText('Strong trending market')).toBeInTheDocument();
    expect(screen.getByText('RSI > 50')).toBeInTheDocument();
    expect(screen.getByText('MACD bullish')).toBeInTheDocument();
    expect(screen.getByText('Positive earnings')).toBeInTheDocument();
    expect(screen.getByText('High volatility')).toBeInTheDocument();
  });

  it('shows validation errors when provided', () => {
    const validation = {
      isValid: false,
      errors: [
        { field: 'marketEnvironment', message: 'Market environment is required', code: 'required', severity: 'error' as const }
      ],
      warnings: []
    };
    
    render(<SetupConditionsBuilder {...defaultProps} validation={validation} />);
    
    expect(screen.getByText('Market environment is required')).toBeInTheDocument();
  });

  it('applies error styling to fields with errors', () => {
    const validation = {
      isValid: false,
      errors: [
        { field: 'marketEnvironment', message: 'Market environment is required', code: 'required', severity: 'error' as const }
      ],
      warnings: []
    };
    
    render(<SetupConditionsBuilder {...defaultProps} validation={validation} />);
    
    const textarea = screen.getByPlaceholderText(/describe when this strategy works best/i);
    expect(textarea).toHaveClass('border-red-500');
  });

  it('displays existing setup conditions correctly', () => {
    const existingData = {
      setupConditions: {
        marketEnvironment: 'Existing market condition',
        technicalConditions: ['Existing condition 1', 'Existing condition 2'],
        fundamentalConditions: ['Existing fundamental'],
        volatilityRequirements: 'Existing volatility'
      }
    };
    
    render(<SetupConditionsBuilder {...defaultProps} data={existingData} />);
    
    expect(screen.getByDisplayValue('Existing market condition')).toBeInTheDocument();
    expect(screen.getByText('Existing condition 1')).toBeInTheDocument();
    expect(screen.getByText('Existing condition 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing volatility')).toBeInTheDocument();
  });

  it('clears input after adding custom condition', async () => {
    const user = userEvent.setup();
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/add custom technical condition/i);
    await user.type(input, 'Custom condition');
    
    const addButton = screen.getByRole('button', { name: '' });
    await user.click(addButton);
    
    expect(input).toHaveValue('');
  });

  it('disables add button when input is empty', () => {
    render(<SetupConditionsBuilder {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: '' });
    expect(addButton).toBeDisabled();
  });
});
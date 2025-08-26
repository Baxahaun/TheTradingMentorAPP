import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EntryTriggersBuilder } from '../EntryTriggersBuilder';
import { ProfessionalStrategy } from '@/types/strategy';

describe('EntryTriggersBuilder', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    data: {} as Partial<ProfessionalStrategy>,
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary entry signal section', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    expect(screen.getByText(/primary entry signal/i)).toBeInTheDocument();
    expect(screen.getByText(/main entry trigger/i)).toBeInTheDocument();
  });

  it('renders confirmation signals section', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    expect(screen.getByText(/confirmation signals/i)).toBeInTheDocument();
    expect(screen.getByText(/additional confirmation required/i)).toBeInTheDocument();
  });

  it('renders timing criteria section', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    expect(screen.getByText(/timing criteria/i)).toBeInTheDocument();
    expect(screen.getByText(/entry timing requirements/i)).toBeInTheDocument();
  });

  it('renders entry method section', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    expect(screen.getByText(/entry execution method/i)).toBeInTheDocument();
    expect(screen.getByText('Market Order')).toBeInTheDocument();
    expect(screen.getByText('Limit Order')).toBeInTheDocument();
    expect(screen.getByText('Stop Order')).toBeInTheDocument();
    expect(screen.getByText('Stop-Limit Order')).toBeInTheDocument();
  });

  it('updates primary signal when textarea changes', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/describe the main signal that triggers/i);
    await user.type(textarea, 'Breakout above resistance');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      entryTriggers: {
        primarySignal: 'Breakout above resistance',
        confirmationSignals: [],
        timingCriteria: ''
      }
    });
  });

  it('selects predefined primary signal', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const signalButton = screen.getByText('Breakout above resistance');
    await user.click(signalButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      entryTriggers: {
        primarySignal: 'Breakout above resistance',
        confirmationSignals: [],
        timingCriteria: ''
      }
    });
  });

  it('adds custom confirmation signal', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/add custom confirmation signal/i);
    await user.type(input, 'Custom volume confirmation');
    
    const addButton = screen.getByRole('button', { name: '' }); // Plus icon button
    await user.click(addButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      entryTriggers: {
        primarySignal: '',
        confirmationSignals: ['Custom volume confirmation'],
        timingCriteria: ''
      }
    });
  });

  it('adds confirmation signal on Enter key press', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/add custom confirmation signal/i);
    await user.type(input, 'RSI confirmation{enter}');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      entryTriggers: {
        primarySignal: '',
        confirmationSignals: ['RSI confirmation'],
        timingCriteria: ''
      }
    });
  });

  it('adds predefined confirmation signal', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const signalButton = screen.getByText('Volume confirmation');
    await user.click(signalButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      entryTriggers: {
        primarySignal: '',
        confirmationSignals: ['Volume confirmation'],
        timingCriteria: ''
      }
    });
  });

  it('removes confirmation signal when X is clicked', async () => {
    const user = userEvent.setup();
    const dataWithSignals = {
      entryTriggers: {
        primarySignal: '',
        confirmationSignals: ['Volume confirmation', 'Momentum confirmation'],
        timingCriteria: ''
      }
    };
    
    render(<EntryTriggersBuilder {...defaultProps} data={dataWithSignals} />);
    
    // Find the X button for the first confirmation signal
    const removeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') // X icon
    );
    
    await user.click(removeButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      entryTriggers: {
        primarySignal: '',
        confirmationSignals: ['Momentum confirmation'],
        timingCriteria: ''
      }
    });
  });

  it('prevents adding duplicate confirmation signals', async () => {
    const user = userEvent.setup();
    const dataWithSignals = {
      entryTriggers: {
        primarySignal: '',
        confirmationSignals: ['Volume confirmation'],
        timingCriteria: ''
      }
    };
    
    render(<EntryTriggersBuilder {...defaultProps} data={dataWithSignals} />);
    
    const signalButton = screen.getByText('Volume confirmation');
    expect(signalButton).toHaveClass('cursor-not-allowed');
    
    await user.click(signalButton);
    
    // Should not add duplicate
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('updates timing criteria when textarea changes', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/specify when to enter after signals/i);
    await user.type(textarea, 'Enter immediately on confirmation');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      entryTriggers: {
        primarySignal: '',
        confirmationSignals: [],
        timingCriteria: 'Enter immediately on confirmation'
      }
    });
  });

  it('selects predefined timing criteria', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const timingButton = screen.getByText('Wait for candle close');
    await user.click(timingButton);
    
    expect(mockOnChange).toHaveBeenCalledWith({
      entryTriggers: {
        primarySignal: '',
        confirmationSignals: [],
        timingCriteria: 'Wait for candle close'
      }
    });
  });

  it('selects entry method', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const marketOrderOption = screen.getByText('Market Order').closest('div');
    await user.click(marketOrderOption!);
    
    expect(mockOnChange).toHaveBeenCalledWith({ entryMethod: 'market' });
  });

  it('highlights selected entry method', () => {
    const dataWithMethod = {
      entryMethod: 'limit'
    };
    
    render(<EntryTriggersBuilder {...defaultProps} data={dataWithMethod} />);
    
    const limitOrderOption = screen.getByText('Limit Order').closest('div');
    expect(limitOrderOption).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('shows entry checklist with completion status', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    expect(screen.getByText('Entry Checklist')).toBeInTheDocument();
    expect(screen.getByText('Primary signal defined')).toBeInTheDocument();
    expect(screen.getByText(/confirmation signals added \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText('Timing criteria specified')).toBeInTheDocument();
  });

  it('updates checklist when fields are completed', () => {
    const completeData = {
      entryTriggers: {
        primarySignal: 'Breakout signal',
        confirmationSignals: ['Volume', 'Momentum'],
        timingCriteria: 'Immediate entry'
      }
    };
    
    render(<EntryTriggersBuilder {...defaultProps} data={completeData} />);
    
    expect(screen.getByText(/confirmation signals added \(2\)/i)).toBeInTheDocument();
  });

  it('shows entry summary when complete', () => {
    const completeData = {
      entryTriggers: {
        primarySignal: 'Breakout above resistance',
        confirmationSignals: ['Volume confirmation', 'Momentum confirmation'],
        timingCriteria: 'Wait for candle close'
      },
      entryMethod: 'market'
    };
    
    render(<EntryTriggersBuilder {...defaultProps} data={completeData} />);
    
    expect(screen.getByText('Entry Summary')).toBeInTheDocument();
    expect(screen.getByText('Breakout above resistance')).toBeInTheDocument();
    expect(screen.getByText('Volume confirmation')).toBeInTheDocument();
    expect(screen.getByText('Momentum confirmation')).toBeInTheDocument();
    expect(screen.getByText('Wait for candle close')).toBeInTheDocument();
    expect(screen.getByText('Market Order')).toBeInTheDocument();
  });

  it('shows validation errors when provided', () => {
    const validation = {
      isValid: false,
      errors: [
        { field: 'primarySignal', message: 'Primary signal is required', code: 'required', severity: 'error' as const }
      ],
      warnings: []
    };
    
    render(<EntryTriggersBuilder {...defaultProps} validation={validation} />);
    
    expect(screen.getByText('Primary signal is required')).toBeInTheDocument();
  });

  it('shows validation warnings when provided', () => {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [
        { field: 'confirmationSignals', message: 'Consider adding confirmation signals', code: 'suggestion', severity: 'warning' as const }
      ]
    };
    
    render(<EntryTriggersBuilder {...defaultProps} validation={validation} />);
    
    expect(screen.getByText('Consider adding confirmation signals')).toBeInTheDocument();
  });

  it('applies error styling to fields with errors', () => {
    const validation = {
      isValid: false,
      errors: [
        { field: 'primarySignal', message: 'Primary signal is required', code: 'required', severity: 'error' as const }
      ],
      warnings: []
    };
    
    render(<EntryTriggersBuilder {...defaultProps} validation={validation} />);
    
    const textarea = screen.getByPlaceholderText(/describe the main signal that triggers/i);
    expect(textarea).toHaveClass('border-red-500');
  });

  it('displays existing entry triggers correctly', () => {
    const existingData = {
      entryTriggers: {
        primarySignal: 'Existing primary signal',
        confirmationSignals: ['Existing confirmation 1', 'Existing confirmation 2'],
        timingCriteria: 'Existing timing criteria'
      },
      entryMethod: 'stop'
    };
    
    render(<EntryTriggersBuilder {...defaultProps} data={existingData} />);
    
    expect(screen.getByDisplayValue('Existing primary signal')).toBeInTheDocument();
    expect(screen.getByText('Existing confirmation 1')).toBeInTheDocument();
    expect(screen.getByText('Existing confirmation 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing timing criteria')).toBeInTheDocument();
    
    const stopOrderOption = screen.getByText('Stop Order').closest('div');
    expect(stopOrderOption).toHaveClass('border-blue-500');
  });

  it('clears input after adding custom confirmation signal', async () => {
    const user = userEvent.setup();
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/add custom confirmation signal/i);
    await user.type(input, 'Custom signal');
    
    const addButton = screen.getByRole('button', { name: '' });
    await user.click(addButton);
    
    expect(input).toHaveValue('');
  });

  it('disables add button when input is empty', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: '' });
    expect(addButton).toBeDisabled();
  });

  it('shows all common primary signals', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    expect(screen.getByText('Breakout above resistance')).toBeInTheDocument();
    expect(screen.getByText('Breakout below support')).toBeInTheDocument();
    expect(screen.getByText('Bullish candlestick pattern')).toBeInTheDocument();
    expect(screen.getByText('Moving average crossover')).toBeInTheDocument();
  });

  it('shows all common confirmation signals', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    expect(screen.getByText('Volume confirmation')).toBeInTheDocument();
    expect(screen.getByText('Momentum indicator alignment')).toBeInTheDocument();
    expect(screen.getByText('Multiple timeframe confirmation')).toBeInTheDocument();
    expect(screen.getByText('Price action confirmation')).toBeInTheDocument();
  });

  it('shows all timing criteria options', () => {
    render(<EntryTriggersBuilder {...defaultProps} />);
    
    expect(screen.getByText('Immediate on signal')).toBeInTheDocument();
    expect(screen.getByText('Wait for candle close')).toBeInTheDocument();
    expect(screen.getByText('Wait for retest')).toBeInTheDocument();
    expect(screen.getByText('Market open only')).toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ProfessionalStrategyBuilder } from '../ProfessionalStrategyBuilder';
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
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the validation service
vi.mock('@/services/StrategyValidationService', () => ({
  StrategyValidationService: vi.fn().mockImplementation(() => ({
    validateBasicInfo: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
    validateSetupConditions: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
    validateEntryTriggers: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
    validateRiskManagement: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
    validateStrategy: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
  }))
}));

// Mock the sub-components
jest.mock('../MethodologySelector', () => ({
  MethodologySelector: ({ data, onChange }: any) => (
    <div data-testid="methodology-selector">
      <input
        data-testid="title-input"
        value={data.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Strategy title"
      />
      <select
        data-testid="methodology-select"
        value={data.methodology || ''}
        onChange={(e) => onChange({ methodology: e.target.value })}
      >
        <option value="">Select methodology</option>
        <option value="Technical">Technical</option>
        <option value="Fundamental">Fundamental</option>
      </select>
    </div>
  )
}));

jest.mock('../SetupConditionsBuilder', () => ({
  SetupConditionsBuilder: ({ data, onChange }: any) => (
    <div data-testid="setup-conditions-builder">
      <textarea
        data-testid="market-environment-input"
        value={data.setupConditions?.marketEnvironment || ''}
        onChange={(e) => onChange({
          setupConditions: {
            ...data.setupConditions,
            marketEnvironment: e.target.value
          }
        })}
        placeholder="Market environment"
      />
    </div>
  )
}));

jest.mock('../EntryTriggersBuilder', () => ({
  EntryTriggersBuilder: ({ data, onChange }: any) => (
    <div data-testid="entry-triggers-builder">
      <textarea
        data-testid="primary-signal-input"
        value={data.entryTriggers?.primarySignal || ''}
        onChange={(e) => onChange({
          entryTriggers: {
            ...data.entryTriggers,
            primarySignal: e.target.value
          }
        })}
        placeholder="Primary signal"
      />
    </div>
  )
}));

jest.mock('../RiskManagementBuilder', () => ({
  RiskManagementBuilder: ({ data, onChange }: any) => (
    <div data-testid="risk-management-builder">
      <input
        data-testid="max-risk-input"
        type="number"
        value={data.riskManagement?.maxRiskPerTrade || ''}
        onChange={(e) => onChange({
          riskManagement: {
            ...data.riskManagement,
            maxRiskPerTrade: Number(e.target.value)
          }
        })}
        placeholder="Max risk per trade"
      />
    </div>
  )
}));

describe('ProfessionalStrategyBuilder', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    mode: 'create' as const,
    isOpen: true,
    onSave: mockOnSave,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the strategy builder dialog when open', () => {
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    expect(screen.getByText('Create Professional Strategy')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ProfessionalStrategyBuilder {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Create Professional Strategy')).not.toBeInTheDocument();
  });

  it('shows correct title for edit mode', () => {
    render(<ProfessionalStrategyBuilder {...defaultProps} mode="edit" />);
    
    expect(screen.getByText('Edit Strategy')).toBeInTheDocument();
  });

  it('shows correct title for migrate mode', () => {
    render(<ProfessionalStrategyBuilder {...defaultProps} mode="migrate" />);
    
    expect(screen.getByText('Migrate to Professional Strategy')).toBeInTheDocument();
  });

  it('displays progress indicator', () => {
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('0% complete')).toBeInTheDocument();
  });

  it('displays step indicators', () => {
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    // Should show 4 step indicators
    const stepButtons = screen.getAllByRole('button').filter(button => 
      button.textContent === '1' || 
      button.textContent === '2' || 
      button.textContent === '3' || 
      button.textContent === '4'
    );
    expect(stepButtons).toHaveLength(4);
  });

  it('starts with methodology selector step', () => {
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    expect(screen.getByTestId('methodology-selector')).toBeInTheDocument();
    expect(screen.getByText('Strategy Foundation')).toBeInTheDocument();
  });

  it('navigates between steps', async () => {
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    // Fill in required fields for step 1
    await user.type(screen.getByTestId('title-input'), 'Test Strategy');
    await user.selectOptions(screen.getByTestId('methodology-select'), 'Technical');
    
    // Click next button
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    // Should now be on step 2
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByTestId('setup-conditions-builder')).toBeInTheDocument();
  });

  it('prevents navigation to next step when current step is incomplete', async () => {
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('allows navigation to previous step', async () => {
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    // Fill in step 1 and go to step 2
    await user.type(screen.getByTestId('title-input'), 'Test Strategy');
    await user.selectOptions(screen.getByTestId('methodology-select'), 'Technical');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Now go back
    const previousButton = screen.getByRole('button', { name: /previous/i });
    await user.click(previousButton);
    
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    expect(screen.getByTestId('methodology-selector')).toBeInTheDocument();
  });

  it('disables previous button on first step', () => {
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    const previousButton = screen.getByRole('button', { name: /previous/i });
    expect(previousButton).toBeDisabled();
  });

  it('shows save button on final step', async () => {
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    // Navigate to final step by clicking step 4 directly
    const step4Button = screen.getAllByRole('button').find(button => button.textContent === '4');
    await user.click(step4Button!);
    
    expect(screen.getByRole('button', { name: /create strategy/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('updates form data when child components change', async () => {
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    const titleInput = screen.getByTestId('title-input');
    await user.type(titleInput, 'My Strategy');
    
    expect(titleInput).toHaveValue('My Strategy');
  });

  it('initializes with existing strategy data in edit mode', () => {
    const existingStrategy: Partial<ProfessionalStrategy> = {
      id: '1',
      title: 'Existing Strategy',
      methodology: 'Technical',
      primaryTimeframe: '1H'
    };
    
    render(
      <ProfessionalStrategyBuilder 
        {...defaultProps} 
        mode="edit" 
        strategy={existingStrategy as ProfessionalStrategy}
      />
    );
    
    expect(screen.getByDisplayValue('Existing Strategy')).toBeInTheDocument();
  });

  it('calculates progress correctly', async () => {
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    // Initially 0% complete
    expect(screen.getByText('0% complete')).toBeInTheDocument();
    
    // Fill in step 1 fields
    await user.type(screen.getByTestId('title-input'), 'Test Strategy');
    await user.selectOptions(screen.getByTestId('methodology-select'), 'Technical');
    
    // Progress should update (25% for 1 of 4 steps)
    await waitFor(() => {
      expect(screen.getByText('25% complete')).toBeInTheDocument();
    });
  });

  it('validates form data and shows errors', async () => {
    // Mock validation service to return errors
    const mockValidationService = await import('@/services/StrategyValidationService');
    vi.mocked(mockValidationService.StrategyValidationService).mockImplementation(() => ({
      validateBasicInfo: vi.fn().mockReturnValue({
        isValid: false,
        errors: [{ field: 'title', message: 'Title is required', code: 'required', severity: 'error' }],
        warnings: []
      }),
      validateSetupConditions: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
      validateEntryTriggers: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
      validateRiskManagement: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
      validateStrategy: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
    }));
    
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    // Try to type and trigger validation
    const titleInput = screen.getByTestId('title-input');
    await user.type(titleInput, 'a');
    await user.clear(titleInput);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('calls onSave with complete strategy data', async () => {
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    // Fill in all required fields across all steps
    await user.type(screen.getByTestId('title-input'), 'Complete Strategy');
    await user.selectOptions(screen.getByTestId('methodology-select'), 'Technical');
    
    // Go to step 2
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.type(screen.getByTestId('market-environment-input'), 'Trending market');
    
    // Go to step 3
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.type(screen.getByTestId('primary-signal-input'), 'Breakout signal');
    
    // Go to step 4
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.type(screen.getByTestId('max-risk-input'), '2');
    
    // Save the strategy
    const saveButton = screen.getByRole('button', { name: /create strategy/i });
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Complete Strategy',
        methodology: 'Technical',
        setupConditions: expect.objectContaining({
          marketEnvironment: 'Trending market'
        }),
        entryTriggers: expect.objectContaining({
          primarySignal: 'Breakout signal'
        }),
        riskManagement: expect.objectContaining({
          maxRiskPerTrade: 2
        })
      })
    );
  });

  it('shows validation warnings', async () => {
    // Mock validation service to return warnings
    const mockValidationService = await import('@/services/StrategyValidationService');
    vi.mocked(mockValidationService.StrategyValidationService).mockImplementation(() => ({
      validateBasicInfo: vi.fn().mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [{ field: 'description', message: 'Consider adding more details', code: 'suggestion', severity: 'warning' }]
      }),
      validateSetupConditions: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
      validateEntryTriggers: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
      validateRiskManagement: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
      validateStrategy: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
    }));
    
    const user = userEvent.setup();
    render(<ProfessionalStrategyBuilder {...defaultProps} />);
    
    await user.type(screen.getByTestId('title-input'), 'Test');
    
    await waitFor(() => {
      expect(screen.getByText('Consider adding more details')).toBeInTheDocument();
    });
  });
});
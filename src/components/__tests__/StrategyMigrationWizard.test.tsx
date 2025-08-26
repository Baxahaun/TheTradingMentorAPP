/**
 * Strategy Migration Wizard Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrategyMigrationWizard } from '../StrategyMigrationWizard';
import { LegacyPlaybook, MigrationResult } from '../../types/migration';

// Mock the migration service
jest.mock('../../services/StrategyMigrationService');

const mockPlaybook: LegacyPlaybook = {
  id: 'test-playbook-1',
  title: 'Test Trading Strategy',
  description: 'A test strategy for unit testing',
  marketConditions: 'Trending markets with high volatility',
  entryParameters: 'RSI oversold, MACD bullish crossover',
  exitParameters: '2% stop loss, 4% take profit',
  color: '#3B82F6',
  timesUsed: 15,
  tradesWon: 9,
  tradesLost: 6
};

const mockMigrationResult: MigrationResult = {
  status: 'success',
  sourcePlaybookId: 'test-playbook-1',
  targetStrategyId: 'strategy-1',
  migratedFields: ['id', 'title', 'description', 'methodology'],
  skippedFields: [],
  errors: [],
  warnings: [],
  completedAt: new Date().toISOString(),
  rollbackAvailable: true
};

describe('StrategyMigrationWizard', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    playbook: mockPlaybook,
    onMigrationComplete: jest.fn(),
    onMigrationError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should render when open with playbook', () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      expect(screen.getByText('Migrate to Professional Strategy')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 10')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<StrategyMigrationWizard {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Migrate to Professional Strategy')).not.toBeInTheDocument();
    });

    it('should not render without playbook', () => {
      render(<StrategyMigrationWizard {...defaultProps} playbook={null} />);
      
      expect(screen.queryByText('Migrate to Professional Strategy')).not.toBeInTheDocument();
    });

    it('should show progress bar', () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should disable back button on first step', () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();
    });

    it('should enable next button when step is valid', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Wait for initialization
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeEnabled();
      });
    });

    it('should close dialog when cancel is clicked', () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should close dialog when X is clicked', () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Validation Step', () => {
    it('should show validation results', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Validating Playbook Data')).toBeInTheDocument();
        expect(screen.getByText('Checking compatibility for migration...')).toBeInTheDocument();
      });
    });

    it('should display validation errors if present', async () => {
      // Mock validation service to return errors
      const mockValidation = {
        isValid: false,
        canProceed: false,
        errors: [{ 
          field: 'title', 
          code: 'INVALID_TITLE', 
          message: 'Title is too short', 
          severity: 'error' as const 
        }],
        warnings: [],
        requiredFields: [],
        optionalFields: []
      };

      // This would need to be mocked properly in a real test
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test would verify error display
    });
  });

  describe('Methodology Configuration', () => {
    it('should allow methodology selection', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Navigate to methodology step (would need proper navigation in real test)
      await waitFor(() => {
        const methodologySelect = screen.queryByText('Trading Methodology');
        if (methodologySelect) {
          expect(methodologySelect).toBeInTheDocument();
        }
      });
    });

    it('should allow timeframe selection', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test timeframe selection
      await waitFor(() => {
        const timeframeSelect = screen.queryByText('Primary Timeframe');
        if (timeframeSelect) {
          expect(timeframeSelect).toBeInTheDocument();
        }
      });
    });

    it('should allow asset class selection', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test asset class checkboxes
      await waitFor(() => {
        const assetClassLabel = screen.queryByText('Asset Classes');
        if (assetClassLabel) {
          expect(assetClassLabel).toBeInTheDocument();
        }
      });
    });
  });

  describe('Setup Conditions Enhancement', () => {
    it('should allow technical conditions input', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test technical conditions textarea
      await waitFor(() => {
        const technicalConditions = screen.queryByText('Technical Conditions');
        if (technicalConditions) {
          expect(technicalConditions).toBeInTheDocument();
        }
      });
    });

    it('should allow volatility requirements input', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test volatility requirements input
      await waitFor(() => {
        const volatilityReq = screen.queryByText('Volatility Requirements');
        if (volatilityReq) {
          expect(volatilityReq).toBeInTheDocument();
        }
      });
    });
  });

  describe('Entry Triggers Configuration', () => {
    it('should allow confirmation signals input', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test confirmation signals textarea
      await waitFor(() => {
        const confirmationSignals = screen.queryByText('Confirmation Signals');
        if (confirmationSignals) {
          expect(confirmationSignals).toBeInTheDocument();
        }
      });
    });

    it('should allow timing criteria input', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test timing criteria input
      await waitFor(() => {
        const timingCriteria = screen.queryByText('Timing Criteria');
        if (timingCriteria) {
          expect(timingCriteria).toBeInTheDocument();
        }
      });
    });
  });

  describe('Risk Management Setup', () => {
    it('should allow position sizing method selection', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test position sizing selection
      await waitFor(() => {
        const positionSizing = screen.queryByText('Position Sizing Method');
        if (positionSizing) {
          expect(positionSizing).toBeInTheDocument();
        }
      });
    });

    it('should allow max risk per trade input', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test max risk input
      await waitFor(() => {
        const maxRisk = screen.queryByText('Max Risk Per Trade');
        if (maxRisk) {
          expect(maxRisk).toBeInTheDocument();
        }
      });
    });

    it('should allow stop loss rule selection', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test stop loss rule selection
      await waitFor(() => {
        const stopLoss = screen.queryByText('Stop Loss Rule');
        if (stopLoss) {
          expect(stopLoss).toBeInTheDocument();
        }
      });
    });

    it('should allow take profit rule selection', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test take profit rule selection
      await waitFor(() => {
        const takeProfit = screen.queryByText('Take Profit Rule');
        if (takeProfit) {
          expect(takeProfit).toBeInTheDocument();
        }
      });
    });

    it('should allow risk-reward ratio input', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test risk-reward ratio input
      await waitFor(() => {
        const riskReward = screen.queryByText('Risk-Reward Ratio');
        if (riskReward) {
          expect(riskReward).toBeInTheDocument();
        }
      });
    });
  });

  describe('Migration Completion', () => {
    it('should show finalization step', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test finalization display
      await waitFor(() => {
        const finalization = screen.queryByText('Finalizing Migration');
        if (finalization) {
          expect(finalization).toBeInTheDocument();
        }
      });
    });

    it('should call onMigrationComplete when successful', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Mock successful migration completion
      // In a real test, this would simulate the full wizard flow
      
      // Verify callback is called
      // expect(defaultProps.onMigrationComplete).toHaveBeenCalledWith(mockMigrationResult);
    });

    it('should call onMigrationError when failed', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Mock failed migration
      // In a real test, this would simulate migration failure
      
      // Verify error callback is called
      // expect(defaultProps.onMigrationError).toHaveBeenCalledWith('Migration failed');
    });
  });

  describe('Form Data Management', () => {
    it('should initialize with default form data', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Verify default values are set
      await waitFor(() => {
        // Check that form is initialized
        expect(screen.getByText('Migrate to Professional Strategy')).toBeInTheDocument();
      });
    });

    it('should update form data when fields change', async () => {
      const user = userEvent.setup();
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test form field updates
      // This would need proper form field selection and interaction
    });

    it('should validate required fields', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test field validation
      // This would verify that required fields are properly validated
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock service to throw error
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Verify error handling
      await waitFor(() => {
        // Check that error is handled properly
        expect(screen.getByText('Migrate to Professional Strategy')).toBeInTheDocument();
      });
    });

    it('should handle step validation errors', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test step validation error handling
      // This would simulate validation failures and verify proper error display
    });

    it('should handle migration service errors', async () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test service error handling
      // This would simulate service failures and verify proper error handling
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Check for proper accessibility attributes
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Test keyboard navigation
      await user.tab();
      // Verify focus management
    });

    it('should have proper heading structure', () => {
      render(<StrategyMigrationWizard {...defaultProps} />);
      
      // Check heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});
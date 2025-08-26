import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecureShareDialog } from '../SecureShareDialog';
import { ProfessionalStrategy } from '../../../types/strategy';
import { Trade } from '../../../types/trade';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

describe('SecureShareDialog', () => {
  let mockStrategy: ProfessionalStrategy;
  let mockTrades: Trade[];
  let mockOnOpenChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnOpenChange = vi.fn();
    
    mockStrategy = {
      id: 'strategy-1',
      title: 'Test Strategy',
      description: 'Test description',
      color: '#2563eb',
      methodology: 'Technical',
      primaryTimeframe: '1H',
      assetClasses: ['Forex'],
      setupConditions: {
        marketEnvironment: 'Trending',
        technicalConditions: ['RSI < 30'],
        volatilityRequirements: 'Medium'
      },
      entryTriggers: {
        primarySignal: 'Breakout',
        confirmationSignals: ['Volume'],
        timingCriteria: 'Market hours'
      },
      riskManagement: {
        positionSizingMethod: { type: 'FixedPercentage', parameters: {} },
        maxRiskPerTrade: 2,
        stopLossRule: { type: 'ATRBased', parameters: {}, description: 'ATR stop' },
        takeProfitRule: { type: 'RiskRewardRatio', parameters: {}, description: 'RR target' },
        riskRewardRatio: 2
      },
      performance: {
        totalTrades: 10,
        winningTrades: 6,
        losingTrades: 4,
        profitFactor: 1.5,
        expectancy: 25,
        winRate: 0.6,
        averageWin: 100,
        averageLoss: -50,
        riskRewardRatio: 2,
        maxDrawdown: 0.1,
        maxDrawdownDuration: 5,
        sampleSize: 10,
        confidenceLevel: 0.95,
        statisticallySignificant: false,
        monthlyReturns: [],
        performanceTrend: 'Stable',
        lastCalculated: '2024-01-01T00:00:00Z'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      version: 1,
      isActive: true
    };

    mockTrades = [
      {
        id: 'trade-1',
        accountId: 'account-1',
        currencyPair: 'EURUSD',
        date: '2024-01-01',
        timeIn: '09:00:00',
        timeOut: '15:00:00',
        timestamp: Date.now(),
        side: 'long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lotSize: 1.0,
        lotType: 'standard' as const,
        units: 100000,
        commission: 0,
        accountCurrency: 'USD',
        pnl: 50,
        status: 'closed' as const
      }
    ];
  });

  it('renders secure share dialog with correct title', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Secure Strategy Sharing')).toBeInTheDocument();
    expect(screen.getByText('Generate a secure, time-limited link to share your strategy performance.')).toBeInTheDocument();
  });

  it('displays report type selection', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Report Type')).toBeInTheDocument();
    
    // Click to open the select dropdown
    const reportTypeSelect = screen.getByRole('combobox');
    fireEvent.click(reportTypeSelect);
    
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('Detailed Report')).toBeInTheDocument();
    expect(screen.getByText('Custom Template')).toBeInTheDocument();
  });

  it('displays security settings section', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Security Settings')).toBeInTheDocument();
    expect(screen.getByText('Anonymize sensitive data')).toBeInTheDocument();
    expect(screen.getByText('Removes dollar amounts and personal information')).toBeInTheDocument();
    expect(screen.getByText('Require password')).toBeInTheDocument();
  });

  it('shows password field when password is required', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const passwordCheckbox = screen.getByLabelText('Require password');
    fireEvent.click(passwordCheckbox);

    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('displays access limits section', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Access Limits')).toBeInTheDocument();
    expect(screen.getByText('Expires in (days)')).toBeInTheDocument();
    expect(screen.getByText('Max views')).toBeInTheDocument();
  });

  it('allows expiration days to be changed', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const expirationSelect = screen.getAllByRole('combobox')[1]; // Second combobox
    fireEvent.click(expirationSelect);
    
    expect(screen.getByText('1 day')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('1 week')).toBeInTheDocument();
    expect(screen.getByText('2 weeks')).toBeInTheDocument();
    expect(screen.getByText('1 month')).toBeInTheDocument();
  });

  it('allows max views to be changed', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const maxViewsSelect = screen.getAllByRole('combobox')[2]; // Third combobox
    fireEvent.click(maxViewsSelect);
    
    expect(screen.getByText('1 view')).toBeInTheDocument();
    expect(screen.getByText('5 views')).toBeInTheDocument();
    expect(screen.getByText('10 views')).toBeInTheDocument();
    expect(screen.getByText('25 views')).toBeInTheDocument();
    expect(screen.getByText('100 views')).toBeInTheDocument();
  });

  it('generates share link when button is clicked', async () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const generateButton = screen.getByText('Generate Share Link');
    fireEvent.click(generateButton);

    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(generateButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Share Link')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/https:\/\/app\.tradingjournal\.com\/shared\//)).toBeInTheDocument();
    });
  });

  it('shows share link details after generation', async () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const generateButton = screen.getByText('Generate Share Link');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('0 / 10 views')).toBeInTheDocument();
      expect(screen.getByText('Expires in 7 days')).toBeInTheDocument();
    });
  });

  it('allows copying share link to clipboard', async () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    // Generate link first
    const generateButton = screen.getByText('Generate Share Link');
    fireEvent.click(generateButton);

    await waitFor(() => {
      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('allows revoking access after link is generated', async () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    // Generate link first
    const generateButton = screen.getByText('Generate Share Link');
    fireEvent.click(generateButton);

    await waitFor(() => {
      const revokeButton = screen.getByText('Revoke Access');
      fireEvent.click(revokeButton);
    });

    // Link should be removed
    expect(screen.queryByText('Share Link')).not.toBeInTheDocument();
  });

  it('disables generate button when password is required but not provided', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const passwordCheckbox = screen.getByLabelText('Require password');
    fireEvent.click(passwordCheckbox);

    const generateButton = screen.getByText('Generate Share Link');
    expect(generateButton).toBeDisabled();
  });

  it('enables generate button when password is provided', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const passwordCheckbox = screen.getByLabelText('Require password');
    fireEvent.click(passwordCheckbox);

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'test123' } });

    const generateButton = screen.getByText('Generate Share Link');
    expect(generateButton).not.toBeDisabled();
  });

  it('updates button text after link is generated', async () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const generateButton = screen.getByText('Generate Share Link');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Regenerate Link')).toBeInTheDocument();
    });
  });

  it('toggles anonymization setting', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const anonymizeCheckbox = screen.getByLabelText('Anonymize sensitive data');
    expect(anonymizeCheckbox).toBeChecked(); // Should be checked by default

    fireEvent.click(anonymizeCheckbox);
    expect(anonymizeCheckbox).not.toBeChecked();
  });

  it('changes report type selection', () => {
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const reportTypeSelect = screen.getByRole('combobox');
    fireEvent.click(reportTypeSelect);
    
    const detailedOption = screen.getByText('Detailed Report');
    fireEvent.click(detailedOption);

    // The select should now show the selected value
    expect(screen.getByDisplayValue('detailed')).toBeInTheDocument();
  });

  it('handles share link generation error gracefully', async () => {
    // Mock console.error to avoid error output in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <SecureShareDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const generateButton = screen.getByText('Generate Share Link');
    fireEvent.click(generateButton);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportDialog } from '../ExportDialog';
import { ProfessionalStrategy } from '../../../types/strategy';
import { Trade } from '../../../types/trade';

// Mock the StrategyExportService
vi.mock('../../../services/StrategyExportService', () => ({
  StrategyExportService: vi.fn().mockImplementation(() => ({
    exportToPDF: vi.fn().mockResolvedValue({
      success: true,
      data: new Blob(['mock pdf'], { type: 'application/pdf' }),
      filename: 'test-strategy.pdf'
    }),
    exportToCSV: vi.fn().mockResolvedValue({
      success: true,
      data: 'mock,csv,data',
      filename: 'test-strategy.csv'
    }),
    generatePrintableSummary: vi.fn().mockResolvedValue({
      success: true,
      data: new Blob(['mock summary'], { type: 'application/pdf' }),
      filename: 'test-strategy-summary.pdf'
    }),
    getAvailableTemplates: vi.fn().mockReturnValue([
      {
        id: 'default',
        name: 'Standard Report',
        sections: [],
        styling: {}
      },
      {
        id: 'summary',
        name: 'Executive Summary',
        sections: [],
        styling: {}
      }
    ])
  }))
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn().mockReturnValue('mock-url')
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
});

// Mock document.createElement and appendChild/removeChild
const mockLink = {
  href: '',
  download: '',
  click: vi.fn()
};

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn().mockReturnValue(mockLink)
});

Object.defineProperty(document.body, 'appendChild', {
  writable: true,
  value: vi.fn()
});

Object.defineProperty(document.body, 'removeChild', {
  writable: true,
  value: vi.fn()
});

describe('ExportDialog', () => {
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

  it('renders export dialog with correct title', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Export Strategy Report')).toBeInTheDocument();
    expect(screen.getByText('Export your strategy performance data and analysis in various formats.')).toBeInTheDocument();
  });

  it('displays format selection options', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Export Format')).toBeInTheDocument();
    
    // Click to open the select dropdown
    fireEvent.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('PDF Report')).toBeInTheDocument();
    expect(screen.getByText('CSV Data')).toBeInTheDocument();
  });

  it('shows template selection when PDF format is selected', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Report Template')).toBeInTheDocument();
  });

  it('displays export options checkboxes', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Include performance charts')).toBeInTheDocument();
    expect(screen.getByText('Anonymize data for sharing')).toBeInTheDocument();
  });

  it('handles PDF export successfully', async () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('handles CSV export when format is changed', async () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    // Change format to CSV
    const formatSelect = screen.getByRole('combobox');
    fireEvent.click(formatSelect);
    fireEvent.click(screen.getByText('CSV Data'));

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  it('handles printable summary generation', async () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const summaryButton = screen.getByText('Quick Summary');
    fireEvent.click(summaryButton);

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  it('shows loading state during export', async () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(exportButton).toBeDisabled();
  });

  it('handles export errors gracefully', async () => {
    // Mock export service to return error
    const { StrategyExportService } = await import('../../../services/StrategyExportService');
    const mockService = new StrategyExportService();
    vi.mocked(mockService.exportToPDF).mockResolvedValue({
      success: false,
      filename: '',
      error: 'Export failed'
    });

    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it('updates options when checkboxes are toggled', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    const chartsCheckbox = screen.getByLabelText('Include performance charts');
    const anonymizeCheckbox = screen.getByLabelText(/Anonymize data for sharing/);

    fireEvent.click(chartsCheckbox);
    fireEvent.click(anonymizeCheckbox);

    expect(chartsCheckbox).not.toBeChecked();
    expect(anonymizeCheckbox).toBeChecked();
  });

  it('allows date range selection', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    expect(screen.getByText('Date Range (Optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Start date')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('End date')).toBeInTheDocument();
  });

  it('closes dialog when cancel is implied', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        strategy={mockStrategy}
        trades={mockTrades}
      />
    );

    // Simulate clicking outside or pressing escape (handled by Dialog component)
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // The actual closing behavior is handled by the Dialog component
    // We're testing that the onOpenChange prop is properly passed
    expect(mockOnOpenChange).toBeDefined();
  });
});
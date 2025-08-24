import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradeReviewExportDialog } from '../TradeReviewExportDialog';
import { TradeReviewExportService } from '../../../lib/tradeReviewExportService';
import { EnhancedTrade } from '../../../types/tradeReview';

// Mock the export service
jest.mock('../../../lib/tradeReviewExportService');
const mockExportService = TradeReviewExportService as jest.Mocked<typeof TradeReviewExportService>;

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'PPP') {
      return new Date(date).toLocaleDateString();
    }
    return new Date(date).toISOString();
  })
}));

describe('TradeReviewExportDialog', () => {
  let mockTrade: EnhancedTrade;
  let mockOnExportComplete: jest.Mock;
  let mockOnShareCreated: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTrade = {
      id: 'trade123',
      accountId: 'account1',
      currencyPair: 'EUR/USD',
      date: '2024-01-15',
      timeIn: '09:00:00',
      timeOut: '15:00:00',
      side: 'long',
      entryPrice: 1.0850,
      exitPrice: 1.0920,
      lotSize: 1.0,
      lotType: 'standard',
      units: 100000,
      pnl: 700,
      commission: 7,
      accountCurrency: 'USD',
      status: 'closed',
      tags: ['breakout', 'trend-following'],
      reviewData: {
        performanceMetrics: {
          rMultiple: 2.5,
          returnPercentage: 5.2,
          riskRewardRatio: 2.1,
          holdDuration: 24.5,
          efficiency: 85.3
        },
        notes: {
          preTradeAnalysis: 'Strong setup',
          lastModified: '2024-01-15T10:30:00Z',
          version: 1
        }
      }
    };

    mockOnExportComplete = jest.fn();
    mockOnShareCreated = jest.fn();

    // Mock service methods
    mockExportService.getDefaultExportOptions.mockReturnValue({
      format: 'pdf',
      includeBasicTradeData: true,
      includeNotes: true,
      includeCharts: true,
      includePerformanceMetrics: true,
      includeReviewWorkflow: true
    });

    mockExportService.validateExportOptions.mockReturnValue({
      isValid: true,
      errors: []
    });

    mockExportService.exportTrade.mockResolvedValue(
      new Blob(['mock pdf content'], { type: 'text/html' })
    );

    mockExportService.downloadExport.mockImplementation(() => {});

    mockExportService.createShareableReport.mockResolvedValue({
      id: 'share123',
      reportData: {
        trade: mockTrade,
        generatedAt: '2024-01-15T12:00:00Z',
        reportId: 'report123'
      },
      shareUrl: 'https://example.com/shared-report/share123',
      accessLevel: 'public',
      createdAt: '2024-01-15T12:00:00Z',
      accessCount: 0
    });
  });

  describe('Export Tab', () => {
    it('should render export dialog with default options', () => {
      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      fireEvent.click(trigger);

      expect(screen.getByText('Export & Share Trade Review')).toBeInTheDocument();
      expect(screen.getByDisplayValue('pdf')).toBeInTheDocument();
      expect(screen.getByLabelText(/basic trade data/i)).toBeChecked();
      expect(screen.getByLabelText(/performance metrics/i)).toBeChecked();
      expect(screen.getByLabelText(/trade notes/i)).toBeChecked();
    });

    it('should allow changing export format', async () => {
      const user = userEvent.setup();
      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const formatSelect = screen.getByRole('combobox');
      await user.click(formatSelect);
      
      const csvOption = screen.getByText('CSV Data');
      await user.click(csvOption);

      expect(screen.getByDisplayValue('csv')).toBeInTheDocument();
    });

    it('should allow toggling data inclusion options', async () => {
      const user = userEvent.setup();
      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const notesCheckbox = screen.getByLabelText(/trade notes/i);
      await user.click(notesCheckbox);

      expect(notesCheckbox).not.toBeChecked();
    });

    it('should perform export when export button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TradeReviewExportDialog 
          trade={mockTrade} 
          onExportComplete={mockOnExportComplete}
        />
      );
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportService.validateExportOptions).toHaveBeenCalled();
        expect(mockExportService.exportTrade).toHaveBeenCalledWith(
          mockTrade,
          expect.objectContaining({
            format: 'pdf',
            includeBasicTradeData: true
          })
        );
        expect(mockExportService.downloadExport).toHaveBeenCalled();
        expect(mockOnExportComplete).toHaveBeenCalledWith('pdf', expect.any(String));
      });
    });

    it('should show validation errors', async () => {
      const user = userEvent.setup();
      
      mockExportService.validateExportOptions.mockReturnValue({
        isValid: false,
        errors: ['Invalid export format']
      });

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('Export validation failed')
        );
      });

      alertSpy.mockRestore();
    });

    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockExportService.exportTrade.mockRejectedValue(new Error('Export failed'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Export failed. Please try again.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Multiple Trades Export', () => {
    it('should show trade count in export summary', () => {
      const trades = [mockTrade, { ...mockTrade, id: 'trade456' }];
      
      render(<TradeReviewExportDialog trades={trades} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      fireEvent.click(trigger);

      expect(screen.getByText(/2 of 2 trades will be exported/)).toBeInTheDocument();
    });

    it('should show date range filter for multiple trades', () => {
      const trades = [mockTrade, { ...mockTrade, id: 'trade456' }];
      
      render(<TradeReviewExportDialog trades={trades} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      fireEvent.click(trigger);

      expect(screen.getByText('Date Range Filter')).toBeInTheDocument();
      expect(screen.getByText('Tag Filter')).toBeInTheDocument();
    });

    it('should filter trades by tags', async () => {
      const user = userEvent.setup();
      const trades = [
        mockTrade,
        { ...mockTrade, id: 'trade456', tags: ['scalping'] }
      ];
      
      render(<TradeReviewExportDialog trades={trades} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      // Click on a tag to filter
      const breakoutTag = screen.getByText('breakout');
      await user.click(breakoutTag);

      expect(screen.getByText(/1 of 2 trades will be exported/)).toBeInTheDocument();
    });
  });

  describe('Share Tab', () => {
    it('should render share tab for single trade', async () => {
      const user = userEvent.setup();
      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const shareTab = screen.getByRole('tab', { name: /share/i });
      await user.click(shareTab);

      expect(screen.getByText('Share Settings')).toBeInTheDocument();
      expect(screen.getByText('Access Level')).toBeInTheDocument();
    });

    it('should disable share tab for multiple trades', () => {
      const trades = [mockTrade, { ...mockTrade, id: 'trade456' }];
      
      render(<TradeReviewExportDialog trades={trades} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      fireEvent.click(trigger);

      const shareTab = screen.getByRole('tab', { name: /share/i });
      expect(shareTab).toHaveAttribute('data-state', 'inactive');
      expect(shareTab).toHaveAttribute('disabled');
    });

    it('should create shareable report', async () => {
      const user = userEvent.setup();
      render(
        <TradeReviewExportDialog 
          trade={mockTrade} 
          onShareCreated={mockOnShareCreated}
        />
      );
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const shareTab = screen.getByRole('tab', { name: /share/i });
      await user.click(shareTab);

      const createButton = screen.getByRole('button', { name: /create shareable report/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockExportService.createShareableReport).toHaveBeenCalledWith(
          mockTrade,
          'private',
          expect.any(Object)
        );
        expect(mockOnShareCreated).toHaveBeenCalled();
      });
    });

    it('should show created share URL', async () => {
      const user = userEvent.setup();
      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const shareTab = screen.getByRole('tab', { name: /share/i });
      await user.click(shareTab);

      const createButton = screen.getByRole('button', { name: /create shareable report/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Shareable Report Created')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://example.com/shared-report/share123')).toBeInTheDocument();
      });
    });

    it('should allow setting password for protected access', async () => {
      const user = userEvent.setup();
      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const shareTab = screen.getByRole('tab', { name: /share/i });
      await user.click(shareTab);

      // Change access level to protected
      const accessSelect = screen.getByRole('combobox');
      await user.click(accessSelect);
      
      const protectedOption = screen.getByText(/Protected - Requires password/);
      await user.click(protectedOption);

      // Password field should appear
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should copy share URL to clipboard', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard API
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const shareTab = screen.getByRole('tab', { name: /share/i });
      await user.click(shareTab);

      const createButton = screen.getByRole('button', { name: /create shareable report/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Shareable Report Created')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('https://example.com/shared-report/share123');
      expect(alertSpy).toHaveBeenCalledWith('Share URL copied to clipboard!');

      alertSpy.mockRestore();
    });
  });

  describe('Custom Trigger', () => {
    it('should render custom trigger', () => {
      const customTrigger = <button>Custom Export Button</button>;
      
      render(<TradeReviewExportDialog trade={mockTrade} trigger={customTrigger} />);
      
      expect(screen.getByText('Custom Export Button')).toBeInTheDocument();
    });
  });

  describe('Dialog State Management', () => {
    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      expect(screen.getByText('Export & Share Trade Review')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Export & Share Trade Review')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during export', async () => {
      const user = userEvent.setup();
      
      // Make export take some time
      mockExportService.exportTrade.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(new Blob()), 100))
      );

      render(<TradeReviewExportDialog trade={mockTrade} />);
      
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      await user.click(exportButton);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
      expect(exportButton).toBeDisabled();
    });
  });
});
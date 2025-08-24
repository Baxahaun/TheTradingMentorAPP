import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradeReviewExportDialog } from '../TradeReviewExportDialog';
import SharedReportViewer from '../SharedReportViewer';
import { TradeReviewExportService } from '../../../lib/tradeReviewExportService';
import { EnhancedTrade } from '../../../types/tradeReview';

// Mock the export service
jest.mock('../../../lib/tradeReviewExportService');
const mockExportService = TradeReviewExportService as jest.Mocked<typeof TradeReviewExportService>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock window.alert
const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'PPP') {
      return new Date(date).toLocaleDateString();
    }
    return new Date(date).toISOString();
  })
}));

describe('Trade Review Export Integration', () => {
  let mockTrade: EnhancedTrade;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    
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
          preTradeAnalysis: 'Strong setup with multiple confirmations',
          executionNotes: 'Good execution at market open',
          postTradeReflection: 'Trade went as planned',
          lessonsLearned: 'Patience is key',
          generalNotes: 'Satisfied with outcome',
          lastModified: '2024-01-15T10:30:00Z',
          version: 1
        },
        charts: [
          {
            id: 'chart1',
            url: 'https://example.com/chart1.png',
            type: 'entry',
            timeframe: '1H',
            uploadedAt: '2024-01-15T09:00:00Z',
            description: 'Entry setup'
          }
        ],
        reviewWorkflow: {
          tradeId: 'trade123',
          stages: [
            {
              id: 'stage1',
              name: 'Data Verification',
              description: 'Verify trade data',
              required: true,
              completed: true,
              completedAt: '2024-01-15T11:00:00Z'
            }
          ],
          overallProgress: 100,
          startedAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-15T12:00:00Z'
        }
      }
    };

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
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  describe('Complete Export Workflow', () => {
    it('should complete full PDF export workflow', async () => {
      const user = userEvent.setup();
      const onExportComplete = jest.fn();

      render(
        <TradeReviewExportDialog 
          trade={mockTrade} 
          onExportComplete={onExportComplete}
        />
      );

      // Open dialog
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      // Verify default options are loaded
      expect(screen.getByDisplayValue('pdf')).toBeInTheDocument();
      expect(screen.getByLabelText(/basic trade data/i)).toBeChecked();

      // Customize filename
      const filenameInput = screen.getByLabelText(/filename/i);
      await user.clear(filenameInput);
      await user.type(filenameInput, 'my-trade-report');

      // Perform export
      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      await user.click(exportButton);

      // Verify export process
      await waitFor(() => {
        expect(mockExportService.validateExportOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'pdf',
            includeBasicTradeData: true,
            includeNotes: true,
            includeCharts: true,
            includePerformanceMetrics: true,
            includeReviewWorkflow: true
          })
        );

        expect(mockExportService.exportTrade).toHaveBeenCalledWith(
          mockTrade,
          expect.objectContaining({ format: 'pdf' })
        );

        expect(mockExportService.downloadExport).toHaveBeenCalledWith(
          expect.any(Blob),
          'my-trade-report',
          'pdf'
        );

        expect(onExportComplete).toHaveBeenCalledWith('pdf', 'my-trade-report');
      });
    });

    it('should complete CSV export with custom options', async () => {
      const user = userEvent.setup();

      render(<TradeReviewExportDialog trade={mockTrade} />);

      // Open dialog
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      // Change format to CSV
      const formatSelect = screen.getByRole('combobox');
      await user.click(formatSelect);
      const csvOption = screen.getByText('CSV Data');
      await user.click(csvOption);

      // Disable some options
      const chartsCheckbox = screen.getByLabelText(/chart information/i);
      await user.click(chartsCheckbox);

      const workflowCheckbox = screen.getByLabelText(/review workflow/i);
      await user.click(workflowCheckbox);

      // Export
      const exportButton = screen.getByRole('button', { name: /export csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportService.exportTrade).toHaveBeenCalledWith(
          mockTrade,
          expect.objectContaining({
            format: 'csv',
            includeCharts: false,
            includeReviewWorkflow: false
          })
        );
      });
    });

    it('should handle export validation errors', async () => {
      const user = userEvent.setup();

      mockExportService.validateExportOptions.mockReturnValue({
        isValid: false,
        errors: ['At least one data category must be included']
      });

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
    });

    it('should handle export service errors', async () => {
      const user = userEvent.setup();

      mockExportService.exportTrade.mockRejectedValue(new Error('Network error'));

      render(<TradeReviewExportDialog trade={mockTrade} />);

      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Export failed. Please try again.');
      });
    });
  });

  describe('Complete Share Workflow', () => {
    it('should create and display shareable report', async () => {
      const user = userEvent.setup();
      const onShareCreated = jest.fn();

      const mockShareableReport = {
        id: 'share123',
        reportData: {
          trade: mockTrade,
          generatedAt: '2024-01-15T12:00:00Z',
          reportId: 'report123'
        },
        shareUrl: 'https://example.com/shared-report/share123',
        accessLevel: 'public' as const,
        createdAt: '2024-01-15T12:00:00Z',
        accessCount: 0
      };

      mockExportService.createShareableReport.mockResolvedValue(mockShareableReport);

      render(
        <TradeReviewExportDialog 
          trade={mockTrade} 
          onShareCreated={onShareCreated}
        />
      );

      // Open dialog and switch to share tab
      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const shareTab = screen.getByRole('tab', { name: /share/i });
      await user.click(shareTab);

      // Create share
      const createButton = screen.getByRole('button', { name: /create shareable report/i });
      await user.click(createButton);

      // Verify share creation
      await waitFor(() => {
        expect(mockExportService.createShareableReport).toHaveBeenCalledWith(
          mockTrade,
          'private',
          expect.objectContaining({
            expiresIn: 24,
            maxAccess: 10
          })
        );

        expect(onShareCreated).toHaveBeenCalledWith(mockShareableReport);
      });

      // Verify share URL is displayed
      expect(screen.getByDisplayValue('https://example.com/shared-report/share123')).toBeInTheDocument();
    });

    it('should create protected share with password', async () => {
      const user = userEvent.setup();

      mockExportService.createShareableReport.mockResolvedValue({
        id: 'share123',
        reportData: { trade: mockTrade, generatedAt: '2024-01-15T12:00:00Z', reportId: 'report123' },
        shareUrl: 'https://example.com/shared-report/share123',
        accessLevel: 'protected',
        password: 'secret123',
        createdAt: '2024-01-15T12:00:00Z',
        accessCount: 0
      });

      render(<TradeReviewExportDialog trade={mockTrade} />);

      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const shareTab = screen.getByRole('tab', { name: /share/i });
      await user.click(shareTab);

      // Change to protected access
      const accessSelect = screen.getByRole('combobox');
      await user.click(accessSelect);
      const protectedOption = screen.getByText(/Protected - Requires password/);
      await user.click(protectedOption);

      // Set password
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'secret123');

      // Create share
      const createButton = screen.getByRole('button', { name: /create shareable report/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockExportService.createShareableReport).toHaveBeenCalledWith(
          mockTrade,
          'protected',
          expect.objectContaining({
            password: 'secret123'
          })
        );
      });
    });

    it('should copy share URL to clipboard', async () => {
      const user = userEvent.setup();

      mockExportService.createShareableReport.mockResolvedValue({
        id: 'share123',
        reportData: { trade: mockTrade, generatedAt: '2024-01-15T12:00:00Z', reportId: 'report123' },
        shareUrl: 'https://example.com/shared-report/share123',
        accessLevel: 'public',
        createdAt: '2024-01-15T12:00:00Z',
        accessCount: 0
      });

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

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/shared-report/share123'
      );
      expect(alertSpy).toHaveBeenCalledWith('Share URL copied to clipboard!');
    });
  });

  describe('Share Viewing Workflow', () => {
    it('should view public shared report', async () => {
      const mockReport = {
        id: 'share123',
        reportData: {
          trade: mockTrade,
          generatedAt: '2024-01-15T12:00:00Z',
          reportId: 'report123'
        },
        shareUrl: 'https://example.com/shared-report/share123',
        accessLevel: 'public' as const,
        createdAt: '2024-01-15T12:00:00Z',
        accessCount: 0,
        maxAccess: 10
      };

      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      const onAccessGranted = jest.fn();

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessGranted={onAccessGranted}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shared Trade Report')).toBeInTheDocument();
        expect(screen.getByText('EUR/USD - 2024-01-15')).toBeInTheDocument();
        expect(onAccessGranted).toHaveBeenCalledWith(
          expect.objectContaining({ accessLevel: 'public' })
        );
      });

      // Verify access count was incremented
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tradeReviewSharedReports',
        expect.stringContaining('"accessCount":1')
      );
    });

    it('should handle protected report access workflow', async () => {
      const user = userEvent.setup();

      const mockReport = {
        id: 'share123',
        reportData: {
          trade: mockTrade,
          generatedAt: '2024-01-15T12:00:00Z',
          reportId: 'report123'
        },
        shareUrl: 'https://example.com/shared-report/share123',
        accessLevel: 'protected' as const,
        password: 'secret123',
        createdAt: '2024-01-15T12:00:00Z',
        accessCount: 0
      };

      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      const onAccessGranted = jest.fn();

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessGranted={onAccessGranted}
        />
      );

      // Should show password prompt
      await waitFor(() => {
        expect(screen.getByText('Protected Report')).toBeInTheDocument();
      });

      // Enter correct password
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'secret123');

      const viewButton = screen.getByRole('button', { name: /view report/i });
      await user.click(viewButton);

      // Should grant access
      await waitFor(() => {
        expect(screen.getByText('Shared Trade Report')).toBeInTheDocument();
        expect(onAccessGranted).toHaveBeenCalled();
      });
    });

    it('should handle expired report', async () => {
      const mockReport = {
        id: 'share123',
        reportData: {
          trade: mockTrade,
          generatedAt: '2024-01-15T12:00:00Z',
          reportId: 'report123'
        },
        shareUrl: 'https://example.com/shared-report/share123',
        accessLevel: 'public' as const,
        expiresAt: '2024-01-01T00:00:00Z', // Past date
        createdAt: '2024-01-15T12:00:00Z',
        accessCount: 0
      };

      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      const onAccessDenied = jest.fn();

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessDenied={onAccessDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('This shared report has expired.')).toBeInTheDocument();
        expect(onAccessDenied).toHaveBeenCalledWith('Report expired');
      });
    });
  });

  describe('Multiple Trades Export', () => {
    it('should export multiple trades with filtering', async () => {
      const user = userEvent.setup();
      const trades = [
        mockTrade,
        { ...mockTrade, id: 'trade456', currencyPair: 'GBP/USD', tags: ['scalping'] },
        { ...mockTrade, id: 'trade789', currencyPair: 'USD/JPY', tags: ['breakout', 'reversal'] }
      ];

      mockExportService.exportTrades.mockResolvedValue(
        new Blob(['mock csv content'], { type: 'text/csv' })
      );

      render(<TradeReviewExportDialog trades={trades} />);

      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      // Change to CSV format
      const formatSelect = screen.getByRole('combobox');
      await user.click(formatSelect);
      const csvOption = screen.getByText('CSV Data');
      await user.click(csvOption);

      // Filter by tag
      const breakoutTag = screen.getByText('breakout');
      await user.click(breakoutTag);

      // Should show filtered count
      expect(screen.getByText(/2 of 3 trades will be exported/)).toBeInTheDocument();

      // Export
      const exportButton = screen.getByRole('button', { name: /export csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockExportService.exportTrades).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'trade123' }),
            expect.objectContaining({ id: 'trade789' })
          ]),
          expect.objectContaining({
            format: 'csv',
            tagFilter: ['breakout']
          })
        );
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary network errors', async () => {
      const user = userEvent.setup();

      // First call fails, second succeeds
      mockExportService.exportTrade
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Blob(['success'], { type: 'text/html' }));

      render(<TradeReviewExportDialog trade={mockTrade} />);

      const trigger = screen.getByRole('button', { name: /export & share/i });
      await user.click(trigger);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      
      // First attempt fails
      await user.click(exportButton);
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Export failed. Please try again.');
      });

      // Second attempt succeeds
      await user.click(exportButton);
      await waitFor(() => {
        expect(mockExportService.downloadExport).toHaveBeenCalled();
      });
    });
  });
});
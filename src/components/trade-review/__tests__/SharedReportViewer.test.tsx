import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SharedReportViewer from '../SharedReportViewer';
import { ShareableReport } from '../../../lib/tradeReviewExportService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.print
Object.defineProperty(window, 'print', {
  value: jest.fn(),
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('SharedReportViewer', () => {
  let mockReport: ShareableReport;
  let mockOnAccessGranted: jest.Mock;
  let mockOnAccessDenied: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReport = {
      id: 'share123',
      reportData: {
        trade: {
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
          tags: ['breakout', 'trend-following']
        },
        generatedAt: '2024-01-15T12:00:00Z',
        reportId: 'report123'
      },
      shareUrl: 'https://example.com/shared-report/share123',
      accessLevel: 'public',
      createdAt: '2024-01-15T12:00:00Z',
      accessCount: 5,
      maxAccess: 10
    };

    mockOnAccessGranted = jest.fn();
    mockOnAccessDenied = jest.fn();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      localStorageMock.getItem.mockReturnValue('{}');
      
      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessGranted={mockOnAccessGranted}
          onAccessDenied={mockOnAccessDenied}
        />
      );

      expect(screen.getByText('Loading shared report...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });
  });

  describe('Public Access', () => {
    it('should display public report immediately', async () => {
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessGranted={mockOnAccessGranted}
          onAccessDenied={mockOnAccessDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Shared Trade Report')).toBeInTheDocument();
        expect(screen.getByText('EUR/USD - 2024-01-15')).toBeInTheDocument();
        expect(mockOnAccessGranted).toHaveBeenCalledWith(expect.objectContaining({
          accessLevel: 'public'
        }));
      });
    });

    it('should show access level badge for public report', async () => {
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText('Public')).toBeInTheDocument();
      });
    });

    it('should show view count', async () => {
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText('5/10 views')).toBeInTheDocument();
      });
    });

    it('should increment access count when accessed', async () => {
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'tradeReviewSharedReports',
          expect.stringContaining('"accessCount":6')
        );
      });
    });
  });

  describe('Protected Access', () => {
    beforeEach(() => {
      mockReport.accessLevel = 'protected';
      mockReport.password = 'secret123';
    });

    it('should show password prompt for protected report', async () => {
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText('Protected Report')).toBeInTheDocument();
        expect(screen.getByText('This report is password protected')).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });

    it('should grant access with correct password', async () => {
      const user = userEvent.setup();
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessGranted={mockOnAccessGranted}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/password/i);
      const viewButton = screen.getByRole('button', { name: /view report/i });

      await user.type(passwordInput, 'secret123');
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Shared Trade Report')).toBeInTheDocument();
        expect(mockOnAccessGranted).toHaveBeenCalled();
      });
    });

    it('should show error with incorrect password', async () => {
      const user = userEvent.setup();
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/password/i);
      const viewButton = screen.getByRole('button', { name: /view report/i });

      await user.type(passwordInput, 'wrongpassword');
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Incorrect password. Please try again.')).toBeInTheDocument();
      });
    });

    it('should allow password submission with Enter key', async () => {
      const user = userEvent.setup();
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessGranted={mockOnAccessGranted}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'secret123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Shared Trade Report')).toBeInTheDocument();
        expect(mockOnAccessGranted).toHaveBeenCalled();
      });
    });
  });

  describe('Private Access', () => {
    beforeEach(() => {
      mockReport.accessLevel = 'private';
    });

    it('should deny access to private report', async () => {
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessDenied={mockOnAccessDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Private Report')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to view this report')).toBeInTheDocument();
        expect(mockOnAccessDenied).toHaveBeenCalledWith('Access limit reached');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when report not found', async () => {
      localStorageMock.getItem.mockReturnValue('{}');

      render(
        <SharedReportViewer 
          shareId="nonexistent" 
          onAccessDenied={mockOnAccessDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Shared report not found or has been removed.')).toBeInTheDocument();
        expect(mockOnAccessDenied).toHaveBeenCalledWith('Report not found');
      });
    });

    it('should show error when report has expired', async () => {
      const expiredReport = {
        ...mockReport,
        expiresAt: '2024-01-01T00:00:00Z' // Past date
      };
      const reports = { share123: expiredReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessDenied={mockOnAccessDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This shared report has expired.')).toBeInTheDocument();
        expect(mockOnAccessDenied).toHaveBeenCalledWith('Report expired');
      });
    });

    it('should show error when max access count reached', async () => {
      const maxedReport = {
        ...mockReport,
        accessCount: 10,
        maxAccess: 10
      };
      const reports = { share123: maxedReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessDenied={mockOnAccessDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This shared report has reached its maximum access limit.')).toBeInTheDocument();
        expect(mockOnAccessDenied).toHaveBeenCalledWith('Access limit reached');
      });
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(
        <SharedReportViewer 
          shareId="share123" 
          onAccessDenied={mockOnAccessDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load shared report. Please try again.')).toBeInTheDocument();
        expect(mockOnAccessDenied).toHaveBeenCalledWith('Load error');
      });
    });
  });

  describe('Expiration Display', () => {
    it('should show time remaining for expiring report', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // 2 hours from now
      
      const expiringReport = {
        ...mockReport,
        expiresAt: futureDate.toISOString()
      };
      const reports = { share123: expiringReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText(/remaining/)).toBeInTheDocument();
      });
    });

    it('should show days remaining for long-term expiration', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3); // 3 days from now
      
      const expiringReport = {
        ...mockReport,
        expiresAt: futureDate.toISOString()
      };
      const reports = { share123: expiringReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText(/3 days remaining/)).toBeInTheDocument();
      });
    });

    it('should handle unlimited access (no max access)', async () => {
      const unlimitedReport = {
        ...mockReport,
        maxAccess: undefined
      };
      const reports = { share123: unlimitedReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText('5/∞ views')).toBeInTheDocument();
      });
    });
  });

  describe('Print Functionality', () => {
    it('should trigger print when print button is clicked', async () => {
      const user = userEvent.setup();
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText('Shared Trade Report')).toBeInTheDocument();
      });

      const printButton = screen.getByRole('button', { name: /print/i });
      await user.click(printButton);

      expect(window.print).toHaveBeenCalled();
    });
  });

  describe('Footer Information', () => {
    it('should display share creation and access information', async () => {
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText(/This report was shared on/)).toBeInTheDocument();
        expect(screen.getByText(/has been viewed 5 times/)).toBeInTheDocument();
      });
    });

    it('should show expiration date in footer when present', async () => {
      const expiringReport = {
        ...mockReport,
        expiresAt: '2024-12-31T23:59:59Z'
      };
      const reports = { share123: expiringReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText(/Report expires on/)).toBeInTheDocument();
      });
    });

    it('should handle singular vs plural view count', async () => {
      const singleViewReport = {
        ...mockReport,
        accessCount: 1
      };
      const reports = { share123: singleViewReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        expect(screen.getByText(/has been viewed 1 time\./)).toBeInTheDocument();
      });
    });
  });

  describe('Report Content Integration', () => {
    it('should render the printable trade report component', async () => {
      const reports = { share123: mockReport };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reports));

      render(<SharedReportViewer shareId="share123" />);

      await waitFor(() => {
        // Check that the PrintableTradeReport content is rendered
        expect(screen.getByText('Trade Summary')).toBeInTheDocument();
        expect(screen.getByText('EUR/USD')).toBeInTheDocument();
        expect(screen.getByText('LONG')).toBeInTheDocument();
      });
    });
  });
});
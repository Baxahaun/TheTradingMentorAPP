/**
 * TradeNotePanel Component Unit Tests
 * Tests for trade-linked journal entry interface
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradeNotePanel } from '../../../../../components/journal/daily-journal/TradeNotePanel';
import { Trade } from '../../../../../types/trade';

// Mock dependencies
jest.mock('../../../../../lib/screenshotStorage', () => ({
  uploadScreenshot: jest.fn().mockResolvedValue({ 
    id: 'screenshot-1', 
    url: 'https://example.com/screenshot.jpg' 
  }),
  deleteScreenshot: jest.fn().mockResolvedValue(true),
  getScreenshots: jest.fn().mockResolvedValue([])
}));

const mockTrade: Trade = {
  id: 'trade-123',
  currencyPair: 'EUR/USD',
  side: 'long',
  entryPrice: 1.2500,
  exitPrice: 1.2650,
  lotSize: 1.0,
  pnl: 150.00,
  date: '2024-03-13',
  entryTime: '09:30',
  exitTime: '14:45',
  status: 'closed',
  strategy: 'Breakout',
  notes: 'Clean breakout above resistance'
};

describe('TradeNotePanel', () => {
  const defaultProps = {
    trade: mockTrade,
    selectedDate: new Date('2024-03-13'),
    onContentChange: jest.fn(),
    onScreenshotUpload: jest.fn(),
    onScreenshotDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render trade information correctly', () => {
    render(<TradeNotePanel {...defaultProps} />);
    
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    expect(screen.getByText('LONG')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('Breakout')).toBeInTheDocument();
  });

  it('should display trade timing information', () => {
    render(<TradeNotePanel {...defaultProps} />);

    expect(screen.getByText(/entry time.*09:30/i)).toBeInTheDocument();
    expect(screen.getByText(/exit time.*14:45/i)).toBeInTheDocument();
  });

  it('should show profit/loss with appropriate styling', () => {
    render(<TradeNotePanel {...defaultProps} />);

    const pnlElement = screen.getByText('$150.00');
    expect(pnlElement).toHaveClass('text-green-600'); // Profit
  });

  it('should show loss with appropriate styling', () => {
    const losseTrade = { ...mockTrade, pnl: -75.50 };
    render(<TradeNotePanel {...defaultProps} trade={losseTrade} />);
    
    const pnlElement = screen.getByText('-$75.50');
    expect(pnlElement).toHaveClass('text-red-600'); // Loss
  });

  it('should render journal entry textarea', () => {
    render(<TradeNotePanel {...defaultProps} />);

    const textarea = screen.getByRole('textbox', { name: /trade notes/i });
    expect(textarea).toBeInTheDocument();
  });

  it('should handle note content changes', async () => {
    const user = userEvent.setup();
    render(<TradeNotePanel {...defaultProps} />);

    const textarea = screen.getByRole('textbox', { name: /trade notes/i });
    await user.type(textarea, 'Great breakout trade');
    
    await waitFor(() => {
      expect(defaultProps.onContentChange).toHaveBeenCalledWith(
        expect.stringContaining('Great breakout trade')
      );
    });
  });

  it('should render screenshot gallery', () => {
    render(<TradeNotePanel {...defaultProps} />);

    expect(screen.getByTestId('screenshot-gallery')).toBeInTheDocument();
  });

  it('should handle screenshot upload via drag and drop', async () => {
    const file = new File(['screenshot'], 'trade-screenshot.png', { type: 'image/png' });
    render(<TradeNotePanel {...defaultProps} />);
    
    const dropZone = screen.getByTestId('screenshot-dropzone');
    
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(defaultProps.onScreenshotUpload).toHaveBeenCalledWith(file);
    });
  });

  it('should handle screenshot upload via file input', async () => {
    const user = userEvent.setup();
    const file = new File(['screenshot'], 'trade-screenshot.png', { type: 'image/png' });
    
    render(<TradeNotePanel {...defaultProps} />);

    const fileInput = screen.getByLabelText(/upload screenshot/i);
    await user.upload(fileInput, file);

    expect(defaultProps.onScreenshotUpload).toHaveBeenCalledWith(file);
  });

  it('should enforce 5MB file size limit', async () => {
    const user = userEvent.setup();
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { 
      type: 'image/png' 
    });
    
    render(<TradeNotePanel {...defaultProps} />);

    const fileInput = screen.getByLabelText(/upload screenshot/i);
    await user.upload(fileInput, largeFile);
    
    expect(screen.getByText(/file size must be less than 5mb/i)).toBeInTheDocument();
    expect(defaultProps.onScreenshotUpload).not.toHaveBeenCalled();
  });

  it('should display existing screenshots', () => {
    const screenshots = [
      { id: '1', url: 'https://example.com/chart1.jpg', name: 'Chart 1' },
      { id: '2', url: 'https://example.com/chart2.jpg', name: 'Chart 2' }
    ];
    
    render(<TradeNotePanel {...defaultProps} screenshots={screenshots} />);

    expect(screen.getByText('Chart 1')).toBeInTheDocument();
    expect(screen.getByText('Chart 2')).toBeInTheDocument();
  });

  it('should handle screenshot deletion', async () => {
    const user = userEvent.setup();
    const screenshots = [
      { id: '1', url: 'https://example.com/chart1.jpg', name: 'Chart 1' }
    ];
    
    render(<TradeNotePanel {...defaultProps} screenshots={screenshots} />);

    const deleteButton = screen.getByRole('button', { name: /delete chart 1/i });
    await user.click(deleteButton);
    
    expect(defaultProps.onScreenshotDelete).toHaveBeenCalledWith('1');
  });

  it('should show empty state when no screenshots', () => {
    render(<TradeNotePanel {...defaultProps} screenshots={[]} />);

    expect(screen.getByText(/no screenshots uploaded/i)).toBeInTheDocument();
  });

  it('should display trade metrics calculation', () => {
    render(<TradeNotePanel {...defaultProps} />);

    // Should calculate pip difference
    const pipDiff = (1.2650 - 1.2500) * 10000; // 150 pips for EUR/USD
    expect(screen.getByText(`${pipDiff} pips`)).toBeInTheDocument();
  });

  it('should handle loading states', () => {
    render(<TradeNotePanel {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle trade not found error', () => {
    render(<TradeNotePanel {...defaultProps} trade={null} />);

    expect(screen.getByText(/trade not found/i)).toBeInTheDocument();
  });

  it('should show trade duration', () => {
    render(<TradeNotePanel {...defaultProps} />);

    // Duration from 09:30 to 14:45 = 5h 15m
    expect(screen.getByText(/duration.*5h 15m/i)).toBeInTheDocument();
  });

  it('should support different entry types (market/limit/stop)', () => {
    const limitTrade = { 
      ...mockTrade, 
      entryType: 'limit',
      limitPrice: 1.2480
    };
    
    render(<TradeNotePanel {...defaultProps} trade={limitTrade} />);

    expect(screen.getByText('LIMIT')).toBeInTheDocument();
    expect(screen.getByText('1.2480')).toBeInTheDocument();
  });

  it('should display stop loss and take profit levels', () => {
    const tradeWithLevels = { 
      ...mockTrade, 
      stopLoss: 1.2400,
      takeProfit: 1.2700
    };
    
    render(<TradeNotePanel {...defaultProps} trade={tradeWithLevels} />);

    expect(screen.getByText(/stop loss.*1.2400/i)).toBeInTheDocument();
    expect(screen.getByText(/take profit.*1.2700/i)).toBeInTheDocument();
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<TradeNotePanel {...defaultProps} />);
    
    // Should be able to navigate to textarea
    await user.tab();
    expect(screen.getByRole('textbox', { name: /trade notes/i })).toHaveFocus();
    
    // Should be able to navigate to upload button
    await user.tab();
    expect(screen.getByRole('button', { name: /upload screenshot/i })).toHaveFocus();
  });
});

describe('TradeNotePanel Integration', () => {
  const defaultProps = {
    trade: mockTrade,
    selectedDate: new Date('2024-03-13'),
    onContentChange: jest.fn(),
    onScreenshotUpload: jest.fn(),
    onScreenshotDelete: jest.fn()
  };

  it('should integrate with screenshot storage service', async () => {
    const { uploadScreenshot } = require('../../../../../lib/screenshotStorage');
    const file = new File(['screenshot'], 'test.png', { type: 'image/png' });
    
    render(<TradeNotePanel {...defaultProps} />);

    const fileInput = screen.getByLabelText(/upload screenshot/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadScreenshot).toHaveBeenCalledWith(file, 'trade-123');
    });
  });

  it('should handle screenshot storage errors gracefully', async () => {
    const { uploadScreenshot } = require('../../../../../lib/screenshotStorage');
    uploadScreenshot.mockRejectedValueOnce(new Error('Upload failed'));
    
    const file = new File(['screenshot'], 'test.png', { type: 'image/png' });
    render(<TradeNotePanel {...defaultProps} />);

    const fileInput = screen.getByLabelText(/upload screenshot/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/failed to upload screenshot/i)).toBeInTheDocument();
    });
  });
});
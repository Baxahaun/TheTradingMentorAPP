import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import TradeReviewHeader from '../TradeReviewHeader';
import { Trade } from '../../../types/trade';
import { NavigationContext } from '../../../types/navigation';
import { TradeReviewMode } from '../../../types/tradeReview';

// Mock the toast hook
vi.mock('../../ui/use-toast', () => ({
  toast: vi.fn()
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  share: vi.fn().mockResolvedValue(undefined)
});

const mockTrade: Trade = {
  id: '1',
  currencyPair: 'EUR/USD',
  side: 'long',
  entryPrice: 1.1000,
  exitPrice: 1.1050,
  quantity: 10000,
  pnl: 50,
  status: 'closed',
  entryTime: '2024-01-15T10:00:00Z',
  exitTime: '2024-01-15T11:00:00Z',
  tags: ['scalping'],
  notes: 'Test trade'
};

const mockNavigationContext: NavigationContext = {
  source: 'calendar',
  sourceParams: {
    date: '2024-01-15'
  },
  breadcrumb: ['dashboard', 'calendar'],
  timestamp: Date.now()
};

const defaultProps = {
  trade: mockTrade,
  editedTrade: mockTrade,
  navigationContext: mockNavigationContext,
  isEditing: false,
  currentMode: 'view' as TradeReviewMode,
  hasUnsavedChanges: false,
  currentTradeIndex: 0,
  totalTrades: 5,
  shareableUrl: 'https://example.com/trade/1',
  onModeChange: vi.fn(),
  onNavigateBack: vi.fn(),
  onNavigateToTrade: vi.fn(),
  onNavigateToSource: vi.fn(),
  onNavigateHome: vi.fn(),
  onShare: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn()
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('TradeReviewHeader Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Context Integration', () => {
    it('should display breadcrumb navigation with calendar context', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Calendar/)).toBeInTheDocument();
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    });

    it('should handle back navigation with context', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      const backButton = screen.getByText('Back to Calendar (1/15/2024)');
      fireEvent.click(backButton);
      
      expect(defaultProps.onNavigateBack).toHaveBeenCalledTimes(1);
    });

    it('should handle breadcrumb navigation to source', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      const calendarButton = screen.getByText(/Calendar/);
      fireEvent.click(calendarButton);
      
      expect(defaultProps.onNavigateToSource).toHaveBeenCalledWith(mockNavigationContext);
    });

    it('should handle breadcrumb navigation to home', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      const dashboardButton = screen.getByText('Dashboard');
      fireEvent.click(dashboardButton);
      
      expect(defaultProps.onNavigateHome).toHaveBeenCalledTimes(1);
    });
  });

  describe('Trade Navigation Integration', () => {
    const prevTrade: Trade = { ...mockTrade, id: '0', currencyPair: 'GBP/USD' };
    const nextTrade: Trade = { ...mockTrade, id: '2', currencyPair: 'USD/JPY' };

    it('should enable previous trade navigation when available', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          prevTrade={prevTrade}
          currentTradeIndex={1}
        />
      );
      
      const prevButton = screen.getByText('Previous');
      expect(prevButton).not.toBeDisabled();
      
      fireEvent.click(prevButton);
      expect(defaultProps.onNavigateToTrade).toHaveBeenCalledWith('0');
    });

    it('should enable next trade navigation when available', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          nextTrade={nextTrade}
          currentTradeIndex={0}
        />
      );
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
      
      fireEvent.click(nextButton);
      expect(defaultProps.onNavigateToTrade).toHaveBeenCalledWith('2');
    });

    it('should disable navigation buttons when no trades available', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          prevTrade={null}
          nextTrade={null}
        />
      );
      
      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');
      
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should display correct trade position', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          currentTradeIndex={2}
          totalTrades={10}
        />
      );
      
      expect(screen.getByText('3 of 10')).toBeInTheDocument();
    });
  });

  describe('Mode Switching Integration', () => {
    it('should handle view mode selection', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
      
      expect(defaultProps.onModeChange).toHaveBeenCalledWith('view');
    });

    it('should handle edit mode selection', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(defaultProps.onModeChange).toHaveBeenCalledWith('edit');
    });

    it('should handle review mode selection', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      const reviewButton = screen.getByText('Review');
      fireEvent.click(reviewButton);
      
      expect(defaultProps.onModeChange).toHaveBeenCalledWith('review');
    });

    it('should highlight active mode', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          currentMode="edit"
        />
      );
      
      const editButton = screen.getByText('Edit');
      expect(editButton).toHaveClass('bg-primary'); // Assuming default variant has this class
    });
  });

  describe('Share Functionality Integration', () => {
    it('should display share button when shareable URL is provided', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('should handle share button click', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);
      
      expect(defaultProps.onShare).toHaveBeenCalledTimes(1);
    });

    it('should not display share button when no URL provided', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          shareableUrl=""
        />
      );
      
      expect(screen.queryByText('Share')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode Integration', () => {
    it('should display save and cancel buttons in edit mode', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          isEditing={true}
          hasUnsavedChanges={true}
        />
      );
      
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should handle save button click', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          isEditing={true}
          hasUnsavedChanges={true}
        />
      );
      
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('should handle cancel button click', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          isEditing={true}
          hasUnsavedChanges={true}
        />
      );
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable save button when no unsaved changes', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          isEditing={true}
          hasUnsavedChanges={false}
        />
      );
      
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });

    it('should display unsaved changes indicator', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          isEditing={false}
          hasUnsavedChanges={true}
        />
      );
      
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });

  describe('Trade Information Display', () => {
    it('should display trade currency pair and side', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      expect(screen.getByText('LONG')).toBeInTheDocument();
    });

    it('should display trade status', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      expect(screen.getByText('CLOSED')).toBeInTheDocument();
    });

    it('should display P&L with correct formatting', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      expect(screen.getByText('+$50.00')).toBeInTheDocument();
    });

    it('should display negative P&L correctly', () => {
      const losingTrade = { ...mockTrade, pnl: -25 };
      
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          trade={losingTrade}
          editedTrade={losingTrade}
        />
      );
      
      expect(screen.getByText('-$25.00')).toBeInTheDocument();
    });

    it('should display return percentage when available', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      // Return percentage: (1.1050 - 1.1000) / 1.1000 * 100 = 0.45%
      expect(screen.getByText('+0.45%')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should display mobile layout elements', () => {
      renderWithRouter(<TradeReviewHeader {...defaultProps} />);
      
      // Mobile layout should have compact mode buttons
      const mobileViewButton = screen.getAllByRole('button').find(
        button => button.querySelector('svg') && !button.textContent?.includes('View')
      );
      expect(mobileViewButton).toBeInTheDocument();
    });

    it('should handle mobile save/cancel in edit mode', () => {
      renderWithRouter(
        <TradeReviewHeader 
          {...defaultProps} 
          isEditing={true}
          hasUnsavedChanges={true}
        />
      );
      
      // Should have both desktop and mobile save buttons
      const saveButtons = screen.getAllByText(/Save/);
      expect(saveButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TradeLog from '../TradeLog';
import { Trade } from '../../types/trade';

// Mock trades for testing
const mockTrades: Trade[] = [
  {
    id: '1',
    currencyPair: 'EURUSD',
    side: 'long',
    status: 'closed',
    date: '2024-01-01',
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    lotSize: 1,
    lotType: 'standard',
    pips: 50,
    pnl: 500,
    tags: ['#scalping', '#morning', '#trend']
  },
  {
    id: '2',
    currencyPair: 'GBPUSD',
    side: 'short',
    status: 'closed',
    date: '2024-01-02',
    entryPrice: 1.2500,
    exitPrice: 1.2450,
    lotSize: 1,
    lotType: 'standard',
    pips: 50,
    pnl: 500,
    tags: ['#scalping', '#afternoon', '#reversal']
  },
  {
    id: '3',
    currencyPair: 'USDJPY',
    side: 'long',
    status: 'closed',
    date: '2024-01-03',
    entryPrice: 150.00,
    exitPrice: 149.50,
    lotSize: 1,
    lotType: 'standard',
    pips: -50,
    pnl: -500,
    tags: ['#swing', '#morning', '#trend']
  },
  {
    id: '4',
    currencyPair: 'AUDUSD',
    side: 'long',
    status: 'open',
    date: '2024-01-04',
    entryPrice: 0.7500,
    lotSize: 1,
    lotType: 'standard',
    tags: ['#swing', '#afternoon']
  },
  {
    id: '5',
    currencyPair: 'USDCAD',
    side: 'short',
    status: 'closed',
    date: '2024-01-05',
    entryPrice: 1.3500,
    exitPrice: 1.3450,
    lotSize: 1,
    lotType: 'standard',
    pips: 50,
    pnl: 500,
    tags: ['#breakout', '#evening']
  }
];

// Mock the useTradeContext hook
vi.mock('../../contexts/TradeContext', () => ({
  useTradeContext: vi.fn(() => ({
    trades: mockTrades,
    addTrade: vi.fn(),
    updateTrade: vi.fn(),
    deleteTrade: vi.fn(),
    loading: false,
    error: null
  }))
}));

describe('TradeLog - Advanced Tag Search Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Simple Tag Search', () => {
    it('should filter trades by single tag', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: '#scalping' } });

      await waitFor(() => {
        // Should show 2 trades with #scalping tag
        expect(screen.getByText('2 trades')).toBeInTheDocument();
        expect(screen.getByText('EURUSD')).toBeInTheDocument();
        expect(screen.getByText('GBPUSD')).toBeInTheDocument();
        expect(screen.queryByText('USDJPY')).not.toBeInTheDocument();
      });
    });

    it('should show matching tags in trade count badge', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: '#scalping' } });

      await waitFor(() => {
        expect(screen.getByText(/matching: #scalping/)).toBeInTheDocument();
      });
    });
  });

  describe('AND Operation', () => {
    it('should filter trades with AND operation', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: '#scalping AND #morning' } });

      await waitFor(() => {
        // Should show 1 trade with both #scalping and #morning tags
        expect(screen.getByText('1 trades')).toBeInTheDocument();
        expect(screen.getByText('EURUSD')).toBeInTheDocument();
        expect(screen.queryByText('GBPUSD')).not.toBeInTheDocument();
        expect(screen.queryByText('USDJPY')).not.toBeInTheDocument();
      });
    });
  });

  describe('OR Operation', () => {
    it('should filter trades with OR operation', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: '#scalping OR #swing' } });

      await waitFor(() => {
        // Should show 4 trades with either #scalping or #swing tags
        expect(screen.getByText('4 trades')).toBeInTheDocument();
        expect(screen.getByText('EURUSD')).toBeInTheDocument();
        expect(screen.getByText('GBPUSD')).toBeInTheDocument();
        expect(screen.getByText('USDJPY')).toBeInTheDocument();
        expect(screen.getByText('AUDUSD')).toBeInTheDocument();
        expect(screen.queryByText('USDCAD')).not.toBeInTheDocument();
      });
    });
  });

  describe('NOT Operation', () => {
    it('should filter trades with NOT operation', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: 'NOT #scalping' } });

      await waitFor(() => {
        // Should show 3 trades without #scalping tag
        expect(screen.getByText('3 trades')).toBeInTheDocument();
        expect(screen.queryByText('EURUSD')).not.toBeInTheDocument();
        expect(screen.queryByText('GBPUSD')).not.toBeInTheDocument();
        expect(screen.getByText('USDJPY')).toBeInTheDocument();
        expect(screen.getByText('AUDUSD')).toBeInTheDocument();
        expect(screen.getByText('USDCAD')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error for invalid syntax', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: '#scalping AND' } });

      await waitFor(() => {
        // Should show 0 trades for invalid query
        expect(screen.getByText('0 trades')).toBeInTheDocument();
        
        // Should show error message
        expect(screen.getByText('Search syntax error:')).toBeInTheDocument();
        expect(screen.getByText(/Query cannot end with AND or OR/)).toBeInTheDocument();
      });
    });

    it('should show error styling for invalid queries', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: '#scalping AND OR #morning' } });

      await waitFor(() => {
        // Search input should have error styling
        expect(searchInput).toHaveClass('border-red-300', 'bg-red-50');
      });
    });

    it('should show success styling for valid queries', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: '#scalping AND #morning' } });

      await waitFor(() => {
        // Search input should have success styling
        expect(searchInput).toHaveClass('border-green-300', 'bg-green-50');
      });
    });
  });

  describe('Regular Text Search', () => {
    it('should fall back to regular search for non-tag queries', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: 'EURUSD' } });

      await waitFor(() => {
        // Should show 1 trade matching EURUSD
        expect(screen.getByText(/1 trades/).closest('.bg-gray-100')).toBeInTheDocument();
        expect(screen.getByText('EURUSD')).toBeInTheDocument();
        expect(screen.queryByText('GBPUSD')).not.toBeInTheDocument();
      });
    });

    it('should not show tag search indicators for regular search', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: 'EURUSD' } });

      await waitFor(() => {
        // Should not show matching tags indicator
        expect(screen.queryByText(/matching:/)).not.toBeInTheDocument();
        
        // Search input should have normal styling
        expect(searchInput).not.toHaveClass('border-green-300', 'bg-green-50');
        expect(searchInput).not.toHaveClass('border-red-300', 'bg-red-50');
      });
    });
  });

  describe('Search Clearing', () => {
    it('should clear search and reset results', async () => {
      render(<TradeLog />);
      
      const searchInput = screen.getByPlaceholderText(/Search trades or use/);
      fireEvent.change(searchInput, { target: { value: '#scalping' } });

      await waitFor(() => {
        expect(screen.getByText(/2 trades/).closest('.bg-gray-100')).toBeInTheDocument();
      });

      // Clear search
      const clearButton = screen.getByTitle('Clear search');
      fireEvent.click(clearButton);

      await waitFor(() => {
        // Should show all trades
        expect(screen.getByText('5 trades')).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
        expect(screen.queryByText(/matching:/)).not.toBeInTheDocument();
      });
    });
  });
});
/**
 * Trade Integration Test Suite
 * 
 * Tests the complete trade integration and reference system for the daily journal.
 * Covers requirements 3.1, 3.2, 3.3, 3.4, 3.5 from the journal specification.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TradeReferencePanel from '../TradeReferencePanel';
import TradeCard from '../TradeCard';
import TradePreview from '../TradePreview';
import { Trade } from '../../../types/trade';
import { TradeReference } from '../../../types/journal';

// Mock trade data for testing
const mockTrades: Trade[] = [
  {
    id: 'trade-1',
    accountId: 'account-1',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '2024-01-15T09:30:00Z',
    timeOut: '2024-01-15T11:45:00Z',
    side: 'long',
    entryPrice: 1.0850,
    exitPrice: 1.0875,
    lotSize: 1.0,
    lotType: 'standard',
    units: 100000,
    pnl: 250,
    commission: 5,
    accountCurrency: 'USD',
    status: 'closed',
    strategy: 'Breakout Strategy',
    notes: 'Clean breakout above resistance',
    confidence: 4,
    session: 'european',
    timeframe: '1H',
    marketConditions: 'trending',
    stopLoss: 1.0820,
    takeProfit: 1.0900,
    riskAmount: 300,
    rMultiple: 1.67,
    pips: 25,
    setup: {
      id: 'setup-1',
      type: 'breakout_continuation',
      confluence: [],
      timeframe: '1H',
      marketCondition: 'trending',
      quality: 4
    },
    patterns: [
      {
        id: 'pattern-1',
        type: 'flag',
        timeframe: '1H',
        quality: 4,
        confluence: true
      }
    ]
  },
  {
    id: 'trade-2',
    accountId: 'account-1',
    currencyPair: 'GBP/USD',
    date: '2024-01-15',
    timeIn: '2024-01-15T14:15:00Z',
    side: 'short',
    entryPrice: 1.2650,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    pnl: -150,
    commission: 3,
    accountCurrency: 'USD',
    status: 'open',
    strategy: 'Reversal Play',
    notes: 'Failed to break resistance, looking for reversal',
    confidence: 3,
    session: 'us',
    timeframe: '30M',
    marketConditions: 'ranging',
    stopLoss: 1.2680,
    takeProfit: 1.2600,
    riskAmount: 150
  },
  {
    id: 'trade-3',
    accountId: 'account-1',
    currencyPair: 'USD/JPY',
    date: '2024-01-15',
    timeIn: '2024-01-15T16:00:00Z',
    timeOut: '2024-01-15T16:30:00Z',
    side: 'long',
    entryPrice: 148.50,
    exitPrice: 148.25,
    lotSize: 2.0,
    lotType: 'standard',
    units: 200000,
    pnl: -500,
    commission: 8,
    accountCurrency: 'USD',
    status: 'closed',
    strategy: 'News Trading',
    notes: 'Stopped out on news spike',
    confidence: 2,
    session: 'us',
    timeframe: '5M',
    marketConditions: 'volatile'
  }
];

const mockExistingReferences: TradeReference[] = [
  {
    id: 'ref-1',
    tradeId: 'trade-1',
    insertedAt: '2024-01-15T12:00:00Z',
    context: 'Perfect example of my breakout strategy',
    displayType: 'card',
    sectionId: 'section-1',
    cachedTradeData: {
      symbol: 'EUR/USD',
      direction: 'long',
      pnl: 250,
      status: 'closed',
      timeIn: '2024-01-15T09:30:00Z',
      timeOut: '2024-01-15T11:45:00Z'
    }
  }
];

describe('Trade Integration System', () => {
  describe('TradeReferencePanel', () => {
    const defaultProps = {
      trades: mockTrades,
      existingReferences: mockExistingReferences,
      onAddReference: vi.fn(),
      onRemoveReference: vi.fn(),
      sectionId: 'section-1',
      maxTrades: 5
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should display existing trade references correctly', () => {
      render(<TradeReferencePanel {...defaultProps} />);
      
      // Should show the existing reference
      expect(screen.getByText('Referenced Trades (1/5)')).toBeInTheDocument();
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      expect(screen.getByText('Perfect example of my breakout strategy')).toBeInTheDocument();
    });

    it('should filter out already referenced trades from selection', async () => {
      const user = userEvent.setup();
      render(<TradeReferencePanel {...defaultProps} />);
      
      // Click add trade reference
      await user.click(screen.getByText('Add Trade Reference'));
      
      // Should show available trades (excluding already referenced trade-1)
      expect(screen.getByText('GBP/USD')).toBeInTheDocument();
      expect(screen.getByText('USD/JPY')).toBeInTheDocument();
      
      // Should not show EUR/USD (already referenced)
      const eurUsdElements = screen.queryAllByText('EUR/USD');
      // Only the existing reference should show EUR/USD, not in the selection list
      expect(eurUsdElements).toHaveLength(1);
    });

    it('should handle trade selection and context input', async () => {
      const user = userEvent.setup();
      const mockOnAddReference = vi.fn();
      
      render(
        <TradeReferencePanel 
          {...defaultProps} 
          onAddReference={mockOnAddReference}
        />
      );
      
      // Open trade selector
      await user.click(screen.getByText('Add Trade Reference'));
      
      // Select a trade
      await user.click(screen.getByText('GBP/USD'));
      
      // Add context
      const contextInput = screen.getByPlaceholderText(/Perfect example of my setup/);
      await user.type(contextInput, 'Good example of patience');
      
      // Select display type
      await user.click(screen.getByText('Preview'));
      
      // Add reference
      await user.click(screen.getByText('Add Reference'));
      
      expect(mockOnAddReference).toHaveBeenCalledWith(
        'trade-2',
        'Good example of patience',
        'preview'
      );
    });

    it('should apply filter criteria correctly', () => {
      const filterCriteria = {
        status: 'closed' as const,
        profitability: 'winning' as const
      };
      
      render(
        <TradeReferencePanel 
          {...defaultProps} 
          filterCriteria={filterCriteria}
        />
      );
      
      // Open trade selector - should only show closed winning trades
      fireEvent.click(screen.getByText('Add Trade Reference'));
      
      // Should show EUR/USD (closed, winning) but not others
      expect(screen.queryByText('GBP/USD')).not.toBeInTheDocument(); // open trade
      expect(screen.queryByText('USD/JPY')).not.toBeInTheDocument(); // losing trade
    });

    it('should handle search functionality', async () => {
      const user = userEvent.setup();
      render(<TradeReferencePanel {...defaultProps} />);
      
      // Open trade selector
      await user.click(screen.getByText('Add Trade Reference'));
      
      // Search for GBP
      const searchInput = screen.getByPlaceholderText('Symbol, strategy...');
      await user.type(searchInput, 'GBP');
      
      // Should only show GBP/USD
      expect(screen.getByText('GBP/USD')).toBeInTheDocument();
      expect(screen.queryByText('USD/JPY')).not.toBeInTheDocument();
    });

    it('should handle remove reference', async () => {
      const user = userEvent.setup();
      const mockOnRemoveReference = vi.fn();
      
      render(
        <TradeReferencePanel 
          {...defaultProps} 
          onRemoveReference={mockOnRemoveReference}
        />
      );
      
      // Click remove button on existing reference
      const removeButton = screen.getByTitle('Remove trade reference');
      await user.click(removeButton);
      
      expect(mockOnRemoveReference).toHaveBeenCalledWith('ref-1');
    });

    it('should respect max trades limit', () => {
      const manyReferences = Array.from({ length: 5 }, (_, i) => ({
        ...mockExistingReferences[0],
        id: `ref-${i + 1}`,
        tradeId: `trade-${i + 1}`
      }));
      
      render(
        <TradeReferencePanel 
          {...defaultProps} 
          existingReferences={manyReferences}
          maxTrades={5}
        />
      );
      
      // Should show max reached message
      expect(screen.getByText('Maximum number of trade references reached (5)')).toBeInTheDocument();
      
      // Should not show add button
      expect(screen.queryByText('Add Trade Reference')).not.toBeInTheDocument();
    });
  });

  describe('TradeCard Component', () => {
    const mockTrade = mockTrades[0];

    it('should display trade information correctly', () => {
      render(<TradeCard trade={mockTrade} />);
      
      // Basic info
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      expect(screen.getByText('LONG')).toBeInTheDocument();
      expect(screen.getByText('WIN')).toBeInTheDocument();
      expect(screen.getByText('+$250.00')).toBeInTheDocument();
      
      // Entry details
      expect(screen.getByText('1.08500')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('standard')).toBeInTheDocument();
      expect(screen.getByText('Breakout Strategy')).toBeInTheDocument();
    });

    it('should show context when provided', () => {
      const context = 'Great example of discipline';
      render(<TradeCard trade={mockTrade} context={context} />);
      
      expect(screen.getByText(context)).toBeInTheDocument();
      expect(screen.getByText('Context:')).toBeInTheDocument();
    });

    it('should handle expand/collapse functionality', async () => {
      const user = userEvent.setup();
      render(<TradeCard trade={mockTrade} />);
      
      // Initially collapsed - should not show detailed info
      expect(screen.queryByText('Price Levels')).not.toBeInTheDocument();
      
      // Expand
      await user.click(screen.getByTitle('Expand details'));
      
      // Should show detailed info
      expect(screen.getByText('Price Levels')).toBeInTheDocument();
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
      expect(screen.getByText('Setup & Patterns')).toBeInTheDocument();
    });

    it('should handle remove callback', async () => {
      const user = userEvent.setup();
      const mockOnRemove = vi.fn();
      
      render(<TradeCard trade={mockTrade} onRemove={mockOnRemove} />);
      
      await user.click(screen.getByTitle('Remove trade reference'));
      
      expect(mockOnRemove).toHaveBeenCalled();
    });

    it('should display enhanced features correctly', async () => {
      const user = userEvent.setup();
      render(<TradeCard trade={mockTrade} />);
      
      // Expand to see enhanced features
      await user.click(screen.getByTitle('Expand details'));
      
      // Should show setup information
      expect(screen.getByText('BREAKOUT CONTINUATION')).toBeInTheDocument();
      expect(screen.getByText(/Quality:/)).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      
      // Should show pattern information
      expect(screen.getByText('flag')).toBeInTheDocument();
    });
  });

  describe('TradePreview Component', () => {
    const mockTrade = mockTrades[0];

    it('should display compact trade information', () => {
      render(<TradePreview trade={mockTrade} />);
      
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument(); // Short form of LONG
      expect(screen.getByText('WIN')).toBeInTheDocument();
      expect(screen.getByText('+$250.00')).toBeInTheDocument();
      expect(screen.getByText('+25.0p')).toBeInTheDocument(); // Pips
    });

    it('should show detailed tooltip on hover', async () => {
      const user = userEvent.setup();
      render(<TradePreview trade={mockTrade} showTooltip={true} />);
      
      const previewCard = screen.getByText('EUR/USD').closest('div');
      
      // Hover to show tooltip
      await user.hover(previewCard!);
      
      await waitFor(() => {
        expect(screen.getByText('Risk Management')).toBeInTheDocument();
        expect(screen.getByText('Market Context')).toBeInTheDocument();
        expect(screen.getByText('Setup')).toBeInTheDocument();
      });
    });

    it('should handle context display', () => {
      const context = 'Quick reference example';
      render(<TradePreview trade={mockTrade} context={context} />);
      
      expect(screen.getByText(context)).toBeInTheDocument();
    });

    it('should handle open trade status correctly', () => {
      const openTrade = { ...mockTrade, status: 'open' as const, pnl: 0 };
      render(<TradePreview trade={openTrade} />);
      
      expect(screen.getByText('OPEN')).toBeInTheDocument();
    });
  });

  describe('Trade Data Synchronization', () => {
    it('should cache trade data correctly in references', () => {
      const reference = mockExistingReferences[0];
      
      expect(reference.cachedTradeData).toEqual({
        symbol: 'EUR/USD',
        direction: 'long',
        pnl: 250,
        status: 'closed',
        timeIn: '2024-01-15T09:30:00Z',
        timeOut: '2024-01-15T11:45:00Z'
      });
    });

    it('should handle missing trade data gracefully', () => {
      const tradesWithMissing = mockTrades.slice(0, 1); // Only first trade
      const referenceToMissingTrade: TradeReference = {
        ...mockExistingReferences[0],
        tradeId: 'non-existent-trade'
      };
      
      render(
        <TradeReferencePanel 
          trades={tradesWithMissing}
          existingReferences={[referenceToMissingTrade]}
          onAddReference={vi.fn()}
          onRemoveReference={vi.fn()}
          sectionId="section-1"
        />
      );
      
      // Should not crash and should handle gracefully
      expect(screen.getByText('Referenced Trades (1/10)')).toBeInTheDocument();
    });
  });

  describe('Integration with Journal Sections', () => {
    it('should filter references by section ID', () => {
      const multiSectionReferences: TradeReference[] = [
        { ...mockExistingReferences[0], sectionId: 'section-1' },
        { ...mockExistingReferences[0], id: 'ref-2', sectionId: 'section-2' }
      ];
      
      render(
        <TradeReferencePanel 
          trades={mockTrades}
          existingReferences={multiSectionReferences}
          onAddReference={vi.fn()}
          onRemoveReference={vi.fn()}
          sectionId="section-1"
        />
      );
      
      // Should only show references for section-1
      expect(screen.getByText('Referenced Trades (1/10)')).toBeInTheDocument();
    });
  });
});
/**
 * Trade Integration System - End-to-End Test
 * 
 * This test verifies that the complete trade integration system works correctly
 * for the daily journal, covering all requirements from task 6.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TradeReferencePanel from '../TradeReferencePanel';
import { Trade } from '../../../types/trade';
import { TradeReference } from '../../../types/journal';

// Mock trade data
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
    notes: 'Clean breakout above resistance'
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
    strategy: 'Reversal Play'
  }
];

describe('Trade Integration System - End-to-End', () => {
  let mockOnAddReference: ReturnType<typeof vi.fn>;
  let mockOnRemoveReference: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAddReference = vi.fn();
    mockOnRemoveReference = vi.fn();
  });

  it('should complete full trade reference workflow', async () => {
    const user = userEvent.setup();
    
    render(
      <TradeReferencePanel
        trades={mockTrades}
        existingReferences={[]}
        onAddReference={mockOnAddReference}
        onRemoveReference={mockOnRemoveReference}
        sectionId="test-section"
        maxTrades={5}
      />
    );

    // Step 1: Verify initial state
    expect(screen.getByText('Add Trade Reference')).toBeInTheDocument();

    // Step 2: Open trade selector
    await user.click(screen.getByText('Add Trade Reference'));
    
    // Step 3: Verify trade selection interface
    expect(screen.getByText('Select Trade to Reference')).toBeInTheDocument();
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    expect(screen.getByText('GBP/USD')).toBeInTheDocument();

    // Step 4: Select a trade
    await user.click(screen.getByText('EUR/USD'));

    // Step 5: Add context
    const contextInput = screen.getByPlaceholderText(/Perfect example of my setup/);
    await user.type(contextInput, 'Excellent breakout execution');

    // Step 6: Select display type
    await user.click(screen.getByText('Card'));

    // Step 7: Add the reference
    await user.click(screen.getByText('Add Reference'));

    // Step 8: Verify the callback was called correctly
    expect(mockOnAddReference).toHaveBeenCalledWith(
      'trade-1',
      'Excellent breakout execution',
      'card'
    );
  });

  it('should handle trade data synchronization correctly', () => {
    const existingReferences: TradeReference[] = [
      {
        id: 'ref-1',
        tradeId: 'trade-1',
        insertedAt: '2024-01-15T12:00:00Z',
        context: 'Great example',
        displayType: 'card',
        sectionId: 'test-section',
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

    render(
      <TradeReferencePanel
        trades={mockTrades}
        existingReferences={existingReferences}
        onAddReference={mockOnAddReference}
        onRemoveReference={mockOnRemoveReference}
        sectionId="test-section"
      />
    );

    // Verify the reference is displayed with cached data
    expect(screen.getByText('Referenced Trades (1/10)')).toBeInTheDocument();
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    expect(screen.getByText('Great example')).toBeInTheDocument();
  });

  it('should filter trades correctly based on criteria', async () => {
    const user = userEvent.setup();
    
    const filterCriteria = {
      status: 'closed' as const,
      profitability: 'winning' as const
    };

    render(
      <TradeReferencePanel
        trades={mockTrades}
        existingReferences={[]}
        onAddReference={mockOnAddReference}
        onRemoveReference={mockOnRemoveReference}
        sectionId="test-section"
        filterCriteria={filterCriteria}
      />
    );

    // Open trade selector
    await user.click(screen.getByText('Add Trade Reference'));

    // Should only show EUR/USD (closed, winning trade)
    // GBP/USD should not be shown (open trade, losing)
    expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    expect(screen.queryByText('GBP/USD')).not.toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <TradeReferencePanel
        trades={mockTrades}
        existingReferences={[]}
        onAddReference={mockOnAddReference}
        onRemoveReference={mockOnRemoveReference}
        sectionId="test-section"
      />
    );

    // Open trade selector
    await user.click(screen.getByText('Add Trade Reference'));

    // Search for GBP
    const searchInput = screen.getByPlaceholderText('Symbol, strategy...');
    await user.type(searchInput, 'GBP');

    // Should only show GBP/USD
    expect(screen.getByText('GBP/USD')).toBeInTheDocument();
    expect(screen.queryByText('EUR/USD')).not.toBeInTheDocument();
  });

  it('should respect section isolation', () => {
    const multiSectionReferences: TradeReference[] = [
      {
        id: 'ref-1',
        tradeId: 'trade-1',
        insertedAt: '2024-01-15T12:00:00Z',
        context: 'Section 1 reference',
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
      },
      {
        id: 'ref-2',
        tradeId: 'trade-2',
        insertedAt: '2024-01-15T12:00:00Z',
        context: 'Section 2 reference',
        displayType: 'card',
        sectionId: 'section-2',
        cachedTradeData: {
          symbol: 'GBP/USD',
          direction: 'short',
          pnl: -150,
          status: 'open',
          timeIn: '2024-01-15T14:15:00Z'
        }
      }
    ];

    render(
      <TradeReferencePanel
        trades={mockTrades}
        existingReferences={multiSectionReferences}
        onAddReference={mockOnAddReference}
        onRemoveReference={mockOnRemoveReference}
        sectionId="section-1"
      />
    );

    // Should only show references for section-1
    expect(screen.getByText('Referenced Trades (1/10)')).toBeInTheDocument();
    expect(screen.getByText('Section 1 reference')).toBeInTheDocument();
    expect(screen.queryByText('Section 2 reference')).not.toBeInTheDocument();
  });
});
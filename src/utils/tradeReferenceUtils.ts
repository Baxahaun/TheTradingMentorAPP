/**
 * Trade Reference Utilities
 * 
 * Utility functions for managing trade references in journal entries,
 * including data synchronization and validation.
 */

import { Trade } from '../types/trade';
import { TradeReference } from '../types/journal';

/**
 * Creates cached trade data for a trade reference
 */
export function createCachedTradeData(trade: Trade): TradeReference['cachedTradeData'] {
  return {
    symbol: trade.currencyPair,
    direction: trade.side,
    pnl: trade.pnl || 0,
    status: trade.status,
    timeIn: trade.timeIn,
    timeOut: trade.timeOut
  };
}

/**
 * Creates a new trade reference with proper data caching
 */
export function createTradeReference(
  tradeId: string,
  context: string,
  displayType: 'inline' | 'card' | 'preview',
  sectionId: string,
  trades: Trade[]
): TradeReference {
  const trade = trades.find(t => t.id === tradeId);
  
  return {
    id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tradeId,
    insertedAt: new Date().toISOString(),
    context,
    displayType,
    sectionId,
    cachedTradeData: trade ? createCachedTradeData(trade) : undefined
  };
}

/**
 * Updates cached trade data for existing references when trade data changes
 */
export function updateTradeReferencesCache(
  references: TradeReference[],
  updatedTrades: Trade[]
): TradeReference[] {
  return references.map(ref => {
    const trade = updatedTrades.find(t => t.id === ref.tradeId);
    
    if (trade) {
      return {
        ...ref,
        cachedTradeData: createCachedTradeData(trade)
      };
    }
    
    // Keep existing cached data if trade is not found
    return ref;
  });
}

/**
 * Validates that a trade reference is still valid
 */
export function validateTradeReference(
  reference: TradeReference,
  availableTrades: Trade[]
): boolean {
  return availableTrades.some(trade => trade.id === reference.tradeId);
}

/**
 * Filters trade references by section ID
 */
export function getReferencesForSection(
  references: TradeReference[],
  sectionId: string
): TradeReference[] {
  return references.filter(ref => ref.sectionId === sectionId);
}

/**
 * Gets trades that are not already referenced in a section
 */
export function getAvailableTradesForSection(
  allTrades: Trade[],
  existingReferences: TradeReference[],
  sectionId: string
): Trade[] {
  const sectionReferences = getReferencesForSection(existingReferences, sectionId);
  const referencedTradeIds = new Set(sectionReferences.map(ref => ref.tradeId));
  
  return allTrades.filter(trade => !referencedTradeIds.has(trade.id));
}

/**
 * Applies filter criteria to trades for reference selection
 */
export function applyTradeFilterCriteria(
  trades: Trade[],
  criteria?: {
    status?: 'open' | 'closed' | 'both';
    profitability?: 'winning' | 'losing' | 'both';
    timeframe?: string;
    strategy?: string;
  }
): Trade[] {
  if (!criteria) return trades;

  return trades.filter(trade => {
    // Status filter
    if (criteria.status && criteria.status !== 'both') {
      if (trade.status !== criteria.status) return false;
    }

    // Profitability filter
    if (criteria.profitability && criteria.profitability !== 'both') {
      const isWinning = (trade.pnl || 0) > 0;
      if (criteria.profitability === 'winning' && !isWinning) return false;
      if (criteria.profitability === 'losing' && isWinning) return false;
    }

    // Timeframe filter
    if (criteria.timeframe && trade.timeframe !== criteria.timeframe) {
      return false;
    }

    // Strategy filter
    if (criteria.strategy && trade.strategy !== criteria.strategy) {
      return false;
    }

    return true;
  });
}

/**
 * Searches trades based on text query
 */
export function searchTrades(trades: Trade[], query: string): Trade[] {
  if (!query.trim()) return trades;

  const searchLower = query.toLowerCase();
  
  return trades.filter(trade => 
    trade.currencyPair.toLowerCase().includes(searchLower) ||
    trade.strategy?.toLowerCase().includes(searchLower) ||
    trade.notes?.toLowerCase().includes(searchLower) ||
    trade.marketConditions?.toLowerCase().includes(searchLower)
  );
}

/**
 * Sorts trades based on specified criteria
 */
export function sortTrades(
  trades: Trade[],
  sortBy: 'time' | 'pnl' | 'symbol',
  sortOrder: 'asc' | 'desc' = 'desc'
): Trade[] {
  const sorted = [...trades].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'time':
        comparison = new Date(a.timeIn).getTime() - new Date(b.timeIn).getTime();
        break;
      case 'pnl':
        comparison = (a.pnl || 0) - (b.pnl || 0);
        break;
      case 'symbol':
        comparison = a.currencyPair.localeCompare(b.currencyPair);
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Gets trade reference statistics for a section
 */
export function getTradeReferenceStats(
  references: TradeReference[],
  sectionId: string,
  maxTrades: number = 10
): {
  count: number;
  maxReached: boolean;
  canAddMore: boolean;
  displayTypes: Record<string, number>;
} {
  const sectionRefs = getReferencesForSection(references, sectionId);
  
  const displayTypes = sectionRefs.reduce((acc, ref) => {
    acc[ref.displayType] = (acc[ref.displayType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    count: sectionRefs.length,
    maxReached: sectionRefs.length >= maxTrades,
    canAddMore: sectionRefs.length < maxTrades,
    displayTypes
  };
}
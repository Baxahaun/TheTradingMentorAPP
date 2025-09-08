import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  DollarSign,
  Target,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Trade } from '../../types/trade';
import { TradeReference } from '../../types/journal';
import TradeCard from './TradeCard';
import TradePreview from './TradePreview';

interface TradeReferencePanelProps {
  trades: Trade[];
  existingReferences: TradeReference[];
  onAddReference: (tradeId: string, context: string, displayType: 'inline' | 'card' | 'preview') => void;
  onRemoveReference: (referenceId: string) => void;
  sectionId: string;
  maxTrades?: number;
  filterCriteria?: {
    status?: 'open' | 'closed' | 'both';
    profitability?: 'winning' | 'losing' | 'both';
    timeframe?: string;
    strategy?: string;
  };
}

interface TradeFilters {
  search: string;
  status: 'all' | 'open' | 'closed';
  profitability: 'all' | 'winning' | 'losing';
  sortBy: 'time' | 'pnl' | 'symbol';
  sortOrder: 'asc' | 'desc';
}

export default function TradeReferencePanel({
  trades,
  existingReferences,
  onAddReference,
  onRemoveReference,
  sectionId,
  maxTrades = 10,
  filterCriteria
}: TradeReferencePanelProps) {
  const [showTradeSelector, setShowTradeSelector] = useState(false);
  const [filters, setFilters] = useState<TradeFilters>({
    search: '',
    status: 'all',
    profitability: 'all',
    sortBy: 'time',
    sortOrder: 'desc'
  });
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [contextInput, setContextInput] = useState('');
  const [displayType, setDisplayType] = useState<'inline' | 'card' | 'preview'>('card');

  // Get references for this section
  const sectionReferences = existingReferences.filter(ref => ref.sectionId === sectionId);
  const referencedTradeIds = new Set(sectionReferences.map(ref => ref.tradeId));

  // Filter and sort available trades
  const filteredTrades = useMemo(() => {
    let filtered = trades.filter(trade => {
      // Exclude already referenced trades
      if (referencedTradeIds.has(trade.id)) return false;

      // Apply filter criteria from template config
      if (filterCriteria?.status && filterCriteria.status !== 'both') {
        if (trade.status !== filterCriteria.status) return false;
      }

      if (filterCriteria?.profitability && filterCriteria.profitability !== 'both') {
        const isWinning = (trade.pnl || 0) > 0;
        if (filterCriteria.profitability === 'winning' && !isWinning) return false;
        if (filterCriteria.profitability === 'losing' && isWinning) return false;
      }

      if (filterCriteria?.strategy && trade.strategy !== filterCriteria.strategy) {
        return false;
      }

      // Apply user filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!trade.currencyPair.toLowerCase().includes(searchLower) &&
            !trade.strategy?.toLowerCase().includes(searchLower) &&
            !trade.notes?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.status !== 'all' && trade.status !== filters.status) {
        return false;
      }

      if (filters.profitability !== 'all') {
        const isWinning = (trade.pnl || 0) > 0;
        if (filters.profitability === 'winning' && !isWinning) return false;
        if (filters.profitability === 'losing' && isWinning) return false;
      }

      return true;
    });

    // Sort trades
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
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

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [trades, referencedTradeIds, filters, filterCriteria]);

  const handleAddReference = () => {
    if (!selectedTradeId || !contextInput.trim()) return;

    onAddReference(selectedTradeId, contextInput.trim(), displayType);
    
    // Reset form
    setSelectedTradeId(null);
    setContextInput('');
    setShowTradeSelector(false);
  };

  const canAddMoreTrades = sectionReferences.length < maxTrades;

  return (
    <div className="space-y-4">
      {/* Existing References */}
      {sectionReferences.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Referenced Trades ({sectionReferences.length}/{maxTrades})
          </h4>
          {sectionReferences.map((reference) => {
            const trade = trades.find(t => t.id === reference.tradeId);
            if (!trade) return null;

            return (
              <div key={reference.id} className="relative">
                {reference.displayType === 'card' && (
                  <TradeCard 
                    trade={trade} 
                    context={reference.context}
                    onRemove={() => onRemoveReference(reference.id)}
                  />
                )}
                {reference.displayType === 'preview' && (
                  <TradePreview 
                    trade={trade} 
                    context={reference.context}
                    onRemove={() => onRemoveReference(reference.id)}
                  />
                )}
                {reference.displayType === 'inline' && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800 dark:text-white">
                        {trade.currencyPair}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        trade.side === 'long' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {trade.side.toUpperCase()}
                      </span>
                      <span className={`font-mono text-sm ${
                        (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                      </span>
                      {reference.context && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          - {reference.context}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveReference(reference.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Trade Button */}
      {canAddMoreTrades && (
        <div>
          {!showTradeSelector ? (
            <button
              onClick={() => setShowTradeSelector(true)}
              className="flex items-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Trade Reference
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              {/* Trade Selection Header */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800 dark:text-white">
                  Select Trade to Reference
                </h4>
                <button
                  onClick={() => setShowTradeSelector(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Symbol, strategy..."
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profitability
                  </label>
                  <select
                    value={filters.profitability}
                    onChange={(e) => setFilters(prev => ({ ...prev, profitability: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="winning">Winning</option>
                    <option value="losing">Losing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sort By
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="time-desc">Newest First</option>
                    <option value="time-asc">Oldest First</option>
                    <option value="pnl-desc">Highest P&L</option>
                    <option value="pnl-asc">Lowest P&L</option>
                    <option value="symbol-asc">Symbol A-Z</option>
                    <option value="symbol-desc">Symbol Z-A</option>
                  </select>
                </div>
              </div>

              {/* Trade List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredTrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {trades.length === 0 ? 'No trades available' : 'No trades match your filters'}
                  </div>
                ) : (
                  filteredTrades.map((trade) => (
                    <div
                      key={trade.id}
                      onClick={() => setSelectedTradeId(trade.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTradeId === trade.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {trade.currencyPair}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            trade.side === 'long' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {trade.side.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(trade.timeIn), 'HH:mm')}
                          </span>
                          {trade.status === 'open' && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                              OPEN
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm ${
                            (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                          </span>
                          {trade.strategy && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {trade.strategy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reference Configuration */}
              {selectedTradeId && (
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Context (Why are you referencing this trade?)
                    </label>
                    <input
                      type="text"
                      value={contextInput}
                      onChange={(e) => setContextInput(e.target.value)}
                      placeholder="e.g., Perfect example of my setup, Mistake to learn from..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Type
                    </label>
                    <div className="flex gap-2">
                      {(['inline', 'card', 'preview'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setDisplayType(type)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            displayType === type
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowTradeSelector(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddReference}
                      disabled={!contextInput.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                    >
                      Add Reference
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Max trades reached message */}
      {!canAddMoreTrades && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
          Maximum number of trade references reached ({maxTrades})
        </div>
      )}
    </div>
  );
}
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardWidget from './DashboardWidget';
import { AVAILABLE_WIDGETS } from '../config/dashboardConfig';
import EditTradeModal from './EditTradeModal';
import TradeDetailModal from './TradeDetailModal';
import { Filter, X, ChevronDown, Search, Edit, Trash2, TrendingUp, TrendingDown, ArrowUpDown, MoreHorizontal, Hash, CheckSquare, Square, Tags, Share2, Copy } from 'lucide-react';
import { useTradeContext } from '../contexts/TradeContext';
import { TagDisplay } from './ui/tag-display';
import { TagFilter } from './ui/tag-filter';
import { TagManager } from './ui/tag-manager';
import { BulkTagEditor, BulkTagOperation } from './ui/bulk-tag-editor';
import { tagService, TagFilter as TagFilterType } from '../lib/tagService';
import { tagSearchService, TagSearchResult } from '../lib/tagSearchService';
import { Trade } from '../types/trade';
import { cn } from '../lib/utils';
import { useTagFilterUrlState, createShareableUrl } from '../hooks/useUrlState';
import { NavigationContext } from '../types/navigation';

const TradeLog: React.FC = () => {
  const navigate = useNavigate();
  const { trades, deleteTrade, updateTrade } = useTradeContext();
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [viewingTradeId, setViewingTradeId] = useState<string | null>(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    symbol: '',
    side: 'all' as 'all' | 'long' | 'short',
    status: 'all' as 'all' | 'open' | 'closed',
    dateFrom: '',
    dateTo: '',
    minPnL: '',
    maxPnL: '',
  });
  
  // Tag filter states with URL synchronization
  const {
    selectedTags,
    setSelectedTags,
    filterMode: tagFilterMode,
    setFilterMode: setTagFilterMode
  } = useTagFilterUrlState();
  
  // Advanced search states
  const [searchResult, setSearchResult] = useState<TagSearchResult | null>(null);
  const [searchHighlights, setSearchHighlights] = useState<Map<string, string[]>>(new Map());
  
  // Tag manager state
  const [showTagManager, setShowTagManager] = useState(false);
  
  // Share state
  const [shareStatus, setShareStatus] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | null;
  }>({
    isVisible: false,
    message: '',
    type: null
  });
  
  // Multi-select and bulk operations states
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [showBulkTagEditor, setShowBulkTagEditor] = useState(false);
  const [bulkOperationStatus, setBulkOperationStatus] = useState<{
    isProcessing: boolean;
    message: string;
    type: 'success' | 'error' | null;
  }>({
    isProcessing: false,
    message: '',
    type: null
  });
  
  // Dropdown ref for click outside handling
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get available tags with counts
  const availableTags = useMemo(() => {
    try {
      return tagService.getAllTagsWithCounts(trades);
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }, [trades]);

  // Filter trades based on current filter settings
  const filteredTrades = useMemo(() => {
    let filtered = trades;

    // Handle search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      // Check if this is an advanced tag search
      if (tagSearchService.isTagSearch(query)) {
        const result = tagSearchService.executeSearch(trades, query);
        setSearchResult(result);
        
        if (result.isValid) {
          filtered = result.trades;
          
          // Set up highlighting
          const highlights = tagSearchService.getSearchHighlights(result.trades, result.matchingTags);
          const highlightMap = new Map<string, string[]>();
          highlights.forEach(highlight => {
            highlightMap.set(highlight.tradeId, highlight.matchingTags);
          });
          setSearchHighlights(highlightMap);
        } else {
          // Invalid search query, show no results
          filtered = [];
          setSearchHighlights(new Map());
        }
      } else {
        // Regular text search across all fields
        setSearchResult(null);
        setSearchHighlights(new Map());
        
        filtered = trades.filter(trade => {
          const searchableFields = [
            trade.currencyPair?.toLowerCase() || '',
            trade.side?.toLowerCase() || '',
            trade.status?.toLowerCase() || '',
            trade.date || '',
            trade.entryPrice?.toString() || '',
            trade.exitPrice?.toString() || '',
            trade.lotSize?.toString() || '',
            trade.lotType?.toLowerCase() || '',
            trade.pips?.toString() || '',
            trade.spread?.toString() || '',
            trade.session?.toLowerCase() || '',
            trade.pnl?.toString() || '',
            trade.commission?.toString() || '',
            trade.swap?.toString() || '',
            trade.notes?.toLowerCase() || '',
            trade.strategy?.toLowerCase() || '',
            trade.timeIn || '',
            trade.timeOut || '',
            trade.accountCurrency?.toLowerCase() || '',
            ...(trade.tags || []).map(tag => tag.toLowerCase()),
          ].join(' ');
          
          return searchableFields.includes(query);
        });
      }
    } else {
      // No search query
      setSearchResult(null);
      setSearchHighlights(new Map());
    }

    // Apply other filters to the search results
    filtered = filtered.filter(trade => {
      
      // Currency Pair filter
      if (filters.symbol && !trade.currencyPair?.toLowerCase().includes(filters.symbol.toLowerCase())) {
        return false;
      }
      
      // Side filter
      if (filters.side !== 'all' && trade.side !== filters.side) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && trade.status !== filters.status) {
        return false;
      }
      
      // Date range filter
      if (filters.dateFrom && trade.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && trade.date > filters.dateTo) {
        return false;
      }
      
      // P&L range filter (only for closed trades with P&L)
      if (trade.pnl !== undefined && trade.pnl !== null) {
        if (filters.minPnL && trade.pnl < parseFloat(filters.minPnL)) {
          return false;
        }
        if (filters.maxPnL && trade.pnl > parseFloat(filters.maxPnL)) {
          return false;
        }
      }
      
      return true;
    });

    // Apply tag filtering if tags are selected
    if (selectedTags.length > 0) {
      const tagFilter: TagFilterType = {
        includeTags: selectedTags,
        excludeTags: [],
        mode: tagFilterMode
      };
      filtered = tagService.filterTradesByTags(filtered, tagFilter);
    }

    return filtered;
  }, [trades, filters, searchQuery, selectedTags, tagFilterMode]);

  const handleDeleteTrade = (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      deleteTrade(tradeId);
    }
  };

  const handleEditTrade = (tradeId: string) => {
    setEditingTradeId(tradeId);
  };

  const handleViewTrade = (tradeId: string) => {
    // Create navigation context for trade list source
    // Map TradeLog filters to TradeListFilters format
    const mappedFilters = {
      status: filters.status !== 'all' ? filters.status as 'open' | 'closed' : undefined,
      currencyPairs: filters.symbol ? [filters.symbol] : undefined,
      dateRange: (filters.dateFrom && filters.dateTo) ? {
        start: filters.dateFrom,
        end: filters.dateTo
      } : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      searchText: searchQuery.trim() !== '' ? searchQuery : undefined
    };

    const navigationContext = {
      source: 'trade-list' as const,
      sourceParams: {
        page: 1, // Could be enhanced to track actual page
        filters: mappedFilters,
        searchQuery: searchQuery,
        selectedTags: selectedTags,
        tagFilterMode: tagFilterMode
      },
      breadcrumb: ['Dashboard', 'Trade List'],
      timestamp: Date.now()
    };
    
    // Set navigation context and navigate to trade review
    import('../lib/navigationContextService').then(({ default: navigationContextService }) => {
      navigationContextService.setContext(tradeId, navigationContext);
      // Navigate to trade review within the sidebar layout
      navigate(`/trade/${tradeId}`);
    });
  };

  // Multi-select handlers
  const handleSelectTrade = (tradeId: string) => {
    setSelectedTradeIds(prev => 
      prev.includes(tradeId) 
        ? prev.filter(id => id !== tradeId)
        : [...prev, tradeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTradeIds.length === filteredTrades.length) {
      setSelectedTradeIds([]);
    } else {
      setSelectedTradeIds(filteredTrades.map(trade => trade.id));
    }
  };

  const clearSelection = () => {
    setSelectedTradeIds([]);
  };

  // Get selected trades
  const selectedTrades = useMemo(() => {
    return trades.filter(trade => selectedTradeIds.includes(trade.id));
  }, [trades, selectedTradeIds]);

  // Share URL handler
  const handleShareFilters = async () => {
    try {
      const currentUrl = window.location.origin + window.location.pathname;
      const shareableUrl = createShareableUrl(currentUrl, selectedTags, tagFilterMode);
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareableUrl);
        setShareStatus({
          isVisible: true,
          message: 'Filter URL copied to clipboard!',
          type: 'success'
        });
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = shareableUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setShareStatus({
          isVisible: true,
          message: 'Filter URL copied to clipboard!',
          type: 'success'
        });
      }
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setShareStatus({
          isVisible: false,
          message: '',
          type: null
        });
      }, 3000);
      
    } catch (error) {
      console.error('Failed to copy URL:', error);
      setShareStatus({
        isVisible: true,
        message: 'Failed to copy URL. Please try again.',
        type: 'error'
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setShareStatus({
          isVisible: false,
          message: '',
          type: null
        });
      }, 5000);
    }
  };

  // Bulk tag operation handler
  const handleBulkTagOperation = async (operation: BulkTagOperation) => {
    setBulkOperationStatus({
      isProcessing: true,
      message: 'Processing bulk tag operation...',
      type: null
    });

    try {
      let successCount = 0;
      let errorCount = 0;

      // Process each trade
      for (const tradeId of operation.tradeIds) {
        try {
          const trade = trades.find(t => t.id === tradeId);
          if (!trade) continue;

          let updatedTags: string[];
          
          switch (operation.type) {
            case 'add':
              // Add new tags, avoiding duplicates
              const currentTags = trade.tags || [];
              const newTags = operation.tags.filter(tag => !currentTags.includes(tag));
              updatedTags = [...currentTags, ...newTags];
              break;
              
            case 'remove':
              // Remove specified tags
              updatedTags = (trade.tags || []).filter(tag => !operation.tags.includes(tag));
              break;
              
            case 'replace':
              // Replace all tags with new ones
              updatedTags = [...operation.tags];
              break;
              
            default:
              continue;
          }

          await updateTrade(tradeId, { tags: updatedTags });
          successCount++;
        } catch (error) {
          console.error(`Error updating trade ${tradeId}:`, error);
          errorCount++;
        }
      }

      // Show success/error message
      if (errorCount === 0) {
        setBulkOperationStatus({
          isProcessing: false,
          message: `Successfully updated ${successCount} trade(s)`,
          type: 'success'
        });
      } else {
        setBulkOperationStatus({
          isProcessing: false,
          message: `Updated ${successCount} trade(s), ${errorCount} failed`,
          type: 'error'
        });
      }

      // Clear selection after successful operation
      if (successCount > 0) {
        clearSelection();
      }

      // Clear status message after 3 seconds
      setTimeout(() => {
        setBulkOperationStatus({
          isProcessing: false,
          message: '',
          type: null
        });
      }, 3000);

    } catch (error) {
      console.error('Bulk tag operation failed:', error);
      setBulkOperationStatus({
        isProcessing: false,
        message: 'Bulk operation failed. Please try again.',
        type: 'error'
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setBulkOperationStatus({
          isProcessing: false,
          message: '',
          type: null
        });
      }, 5000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trades</h1>
          <p className="text-gray-600 mt-1">View and manage all your trading activity</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidget
          widget={AVAILABLE_WIDGETS.find(w => w.id === 'netPnl')!}
          trades={filteredTrades}
          position={0}
          onWidgetChange={() => {}}
          hideEdit={true}
        />
        <DashboardWidget
          widget={AVAILABLE_WIDGETS.find(w => w.id === 'profitFactor')!}
          trades={filteredTrades}
          position={1}
          onWidgetChange={() => {}}
          hideEdit={true}
        />
        <DashboardWidget
          widget={AVAILABLE_WIDGETS.find(w => w.id === 'winRate')!}
          trades={filteredTrades}
          position={2}
          onWidgetChange={() => {}}
          hideEdit={true}
        />
        <DashboardWidget
          widget={AVAILABLE_WIDGETS.find(w => w.id === 'avgWinLoss')!}
          trades={filteredTrades}
          position={3}
          onWidgetChange={() => {}}
          hideEdit={true}
        />
      </div>

      {/* Enhanced Search and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Enhanced Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search trades or use #tag AND #tag2..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 w-80 h-9 border rounded-md focus:ring-1 transition-all duration-200 text-sm",
                  searchResult?.isValid === false 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50" 
                    : searchResult?.isValid === true
                    ? "border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                )}
                title={tagSearchService.isTagSearch(searchQuery) ? "Advanced tag search: Use AND, OR, NOT operators" : "Search across all trade fields"}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  title="Clear search"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              
              {/* Search validation errors */}
              {searchResult?.isValid === false && searchResult.errors.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700 z-10">
                  <div className="font-medium mb-1">Search syntax error:</div>
                  {searchResult.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Trade Count Badge */}
            <div className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors px-2.5 py-1.5 rounded-md text-sm font-medium">
              {filteredTrades.length} trades
              {selectedTradeIds.length > 0 && (
                <span className="ml-2 text-blue-600">
                  ({selectedTradeIds.length} selected)
                </span>
              )}
              {searchResult?.isValid === true && searchResult.matchingTags.length > 0 && (
                <span className="ml-2 text-green-600">
                  (matching: {searchResult.matchingTags.join(', ')})
                </span>
              )}
            </div>

            {/* Bulk Operations - Compact inline version */}
            {selectedTradeIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 flex items-center space-x-3">
                <div className="text-xs font-medium text-blue-900">
                  {selectedTradeIds.length} selected
                </div>
                {bulkOperationStatus.message && (
                  <div className={`text-xs ${
                    bulkOperationStatus.type === 'success' ? 'text-green-700' : 
                    bulkOperationStatus.type === 'error' ? 'text-red-700' : 
                    'text-blue-700'
                  }`}>
                    {bulkOperationStatus.message}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowBulkTagEditor(true)}
                    disabled={bulkOperationStatus.isProcessing}
                    className="h-7 px-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200 rounded text-xs font-medium flex items-center"
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    Edit Tags
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={bulkOperationStatus.isProcessing}
                    className="h-7 px-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded text-xs font-medium text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Tag Filter */}
            <TagFilter
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              filterMode={tagFilterMode}
              onFilterModeChange={setTagFilterMode}
            />

            {/* Share Filter Button - only show when filters are active */}
            {selectedTags.length > 0 && (
              <div className="relative">
                <button
                  onClick={handleShareFilters}
                  className="h-9 px-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-md flex items-center text-sm font-medium text-gray-700"
                  title="Share current filter state"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                
                {/* Share status message */}
                {shareStatus.isVisible && (
                  <div className={`absolute top-full left-0 mt-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap z-10 ${
                    shareStatus.type === 'success' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-1">
                      <Copy className="h-3 w-3" />
                      <span>{shareStatus.message}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Filter Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 px-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-md flex items-center text-sm font-medium text-gray-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown
                  className={`h-4 w-4 ml-2 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Side</label>
                      <div className="flex space-x-2">
                        <span 
                          onClick={() => setFilters(prev => ({ ...prev, side: prev.side === 'long' ? 'all' : 'long' }))}
                          className={`px-2.5 py-1.5 border rounded-md cursor-pointer text-sm transition-colors ${
                            filters.side === 'long' 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'border-gray-200 hover:bg-green-50 hover:border-green-200'
                          }`}
                        >
                          LONG
                        </span>
                        <span 
                          onClick={() => setFilters(prev => ({ ...prev, side: prev.side === 'short' ? 'all' : 'short' }))}
                          className={`px-2.5 py-1.5 border rounded-md cursor-pointer text-sm transition-colors ${
                            filters.side === 'short' 
                              ? 'bg-red-50 border-red-200 text-red-800' 
                              : 'border-gray-200 hover:bg-red-50 hover:border-red-200'
                          }`}
                        >
                          SHORT
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="flex space-x-2">
                        <span 
                          onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'closed' ? 'all' : 'closed' }))}
                          className={`px-2.5 py-1.5 border rounded-md cursor-pointer text-sm transition-colors ${
                            filters.status === 'closed' 
                              ? 'bg-blue-50 border-blue-200 text-blue-800' 
                              : 'border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                          }`}
                        >
                          CLOSED
                        </span>
                        <span 
                          onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'open' ? 'all' : 'open' }))}
                          className={`px-2.5 py-1.5 border rounded-md cursor-pointer text-sm transition-colors ${
                            filters.status === 'open' 
                              ? 'bg-orange-50 border-orange-200 text-orange-800' 
                              : 'border-gray-200 hover:bg-orange-50 hover:border-orange-200'
                          }`}
                        >
                          OPEN
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Manage Tags</label>
                      <button
                        onClick={() => {
                          setShowTagManager(true);
                          setShowFilters(false);
                        }}
                        className="w-full h-9 px-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-md flex items-center text-sm font-medium text-gray-700"
                      >
                        <Hash className="h-4 w-4 mr-2" />
                        Manage Tags
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Trades Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* Enhanced Table Header */}
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors"
                    title={selectedTradeIds.length === filteredTrades.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedTradeIds.length === filteredTrades.length && filteredTrades.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : selectedTradeIds.length > 0 ? (
                      <div className="w-4 h-4 bg-blue-600 rounded border-2 border-blue-600 flex items-center justify-center">
                        <div className="w-2 h-1 bg-white rounded-sm"></div>
                      </div>
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-900 transition-colors">
                    <span>Currency Pair</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-900 transition-colors">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Side
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Entry
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Exit
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-1 cursor-pointer hover:text-gray-900 transition-colors">
                    <span>Pips</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-1 cursor-pointer hover:text-gray-900 transition-colors">
                    <span>P&L</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Enhanced Table Body */}
            <tbody className="divide-y divide-gray-100">
              {filteredTrades.map((trade) => (
                <tr
                  key={trade.id}
                  className={`group transition-all duration-200 hover:shadow-sm cursor-pointer ${
                    selectedTradeIds.includes(trade.id)
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50'
                  }`}
                  onClick={() => handleViewTrade(trade.id)}
                >
                  {/* Checkbox */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTrade(trade.id);
                      }}
                      className="flex items-center justify-center w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {selectedTradeIds.includes(trade.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  {/* Currency Pair */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                      {trade.currencyPair}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                      {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                    </div>
                  </td>

                  {/* Side */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                        trade.side === "long"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {trade.side?.toUpperCase()}
                    </span>
                  </td>

                  {/* Entry */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-gray-900 group-hover:text-blue-900 transition-colors">
                      {trade.entryPrice?.toFixed(5)}
                    </div>
                  </td>

                  {/* Exit */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-gray-900 group-hover:text-blue-900 transition-colors">
                      {trade.exitPrice?.toFixed(5) || '-'}
                    </div>
                  </td>

                  {/* Pips */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-semibold flex items-center justify-end space-x-1 ${
                        (trade.pips || 0) > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {(trade.pips || 0) > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>
                        {(trade.pips || 0) > 0 ? "+" : ""}
                        {(trade.pips || 0).toFixed(1)}
                      </span>
                    </div>
                  </td>

                  {/* P&L */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-bold ${(trade.pnl || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                      {(trade.pnl || 0) > 0 ? "+" : ""}${(trade.pnl || 0).toFixed(2)}
                    </div>
                  </td>

                  {/* Tags */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TagDisplay 
                      tags={trade.tags || []} 
                      variant="compact"
                      maxDisplay={3}
                      interactive={true}
                      highlightedTags={searchHighlights.get(trade.id) || []}
                      onTagClick={(tag) => {
                        // Add tag to selected tags for filtering
                        const normalizedTag = tagService.normalizeTag(tag);
                        if (!selectedTags.includes(normalizedTag)) {
                          setSelectedTags([...selectedTags, normalizedTag]);
                        }
                      }}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTrade(trade.id);
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors rounded-md flex items-center justify-center"
                        title="Edit trade"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrade(trade.id);
                        }}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors rounded-md flex items-center justify-center"
                        title="Delete trade"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-600 transition-colors rounded-md flex items-center justify-center"
                        title="More options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Empty State */}
        {filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Edit Trade Modal */}
      {editingTradeId && (
        <EditTradeModal
          trade={trades.find(t => t.id === editingTradeId) || null}
          isOpen={!!editingTradeId}
          onClose={() => setEditingTradeId(null)}
        />
      )}

      {/* Trade Detail Modal */}
      {viewingTradeId && (
        <TradeDetailModal
          trade={trades.find(t => t.id === viewingTradeId) || null}
          isOpen={!!viewingTradeId}
          onClose={() => setViewingTradeId(null)}
        />
      )}

      {/* Tag Manager Modal */}
      <TagManager
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
        trades={trades}
        onTagClick={(tag) => {
          // Add the clicked tag to the filter
          if (!selectedTags.includes(tag)) {
            setSelectedTags([...selectedTags, tag]);
          }
        }}
        onTagDeleted={(tag) => {
          // Remove the deleted tag from current filters
          setSelectedTags(prev => prev.filter(t => t !== tag));
          // Here you would also need to update all trades to remove the tag
          // This would typically be handled by the TradeContext
          console.log('Tag deleted:', tag);
        }}
      />

      {/* Bulk Tag Editor Modal */}
      <BulkTagEditor
        selectedTrades={selectedTrades}
        isOpen={showBulkTagEditor}
        onClose={() => setShowBulkTagEditor(false)}
        onApply={handleBulkTagOperation}
      />
    </div>
  );
};

export default TradeLog;

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardWidget from './DashboardWidget';
import { AVAILABLE_WIDGETS } from '../config/dashboardConfig';
import EditTradeModal from './EditTradeModal';
import { Upload, Filter, X, ChevronDown, Search, Columns3, Edit, Trash2, TrendingUp, TrendingDown, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useTradeContext } from '../contexts/TradeContext';
import { Trade } from '../types/trade';

const TradeLog: React.FC = () => {
  const navigate = useNavigate();
  const { trades, deleteTrade } = useTradeContext();
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  
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
  
  // Filter trades based on current filter settings
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Universal search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
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
        ].join(' ');
        
        if (!searchableFields.includes(query)) {
          return false;
        }
      }
      
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
  }, [trades, filters, searchQuery]);

  const handleDeleteTrade = (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      deleteTrade(tradeId);
    }
  };

  const handleEditTrade = (tradeId: string) => {
    setEditingTradeId(tradeId);
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
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 h-9 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Trade Count Badge */}
            <div className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors px-2.5 py-1.5 rounded-md text-sm font-medium">
              {filteredTrades.length} trades
            </div>
          </div>

          <div className="flex items-center space-x-3">
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
                  className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 hover:shadow-sm"
                >
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

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditTrade(trade.id)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors rounded-md flex items-center justify-center"
                        title="Edit trade"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrade(trade.id)}
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
          tradeId={editingTradeId}
          onClose={() => setEditingTradeId(null)}
        />
      )}
    </div>
  );
};

export default TradeLog;

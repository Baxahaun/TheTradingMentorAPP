/**
 * Linked Trades View Component
 * 
 * Displays trades associated with a strategy with navigation to detailed trade reviews.
 * Provides filtering, sorting, and quick analysis capabilities.
 */

import React, { useState, useMemo } from 'react';
import { 
  ExternalLink, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  BarChart3,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradeWithStrategy } from '@/types/strategy';

interface LinkedTradesViewProps {
  trades: TradeWithStrategy[];
  strategyName: string;
  onNavigateToTrade: (tradeId: string) => void;
  onViewTradeDetails?: (trade: TradeWithStrategy) => void;
  className?: string;
}

type SortField = 'timestamp' | 'pnl' | 'adherenceScore' | 'currencyPair';
type SortDirection = 'asc' | 'desc';
type TradeFilter = 'all' | 'winning' | 'losing' | 'open' | 'high-adherence' | 'low-adherence';

const LinkedTradesView: React.FC<LinkedTradesViewProps> = ({
  trades,
  strategyName,
  onNavigateToTrade,
  onViewTradeDetails,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<TradeFilter>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Filter and sort trades
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = [...trades];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.currencyPair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.side.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trade.notes && trade.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply outcome filter
    switch (filter) {
      case 'winning':
        filtered = filtered.filter(trade => trade.pnl && trade.pnl > 0);
        break;
      case 'losing':
        filtered = filtered.filter(trade => trade.pnl && trade.pnl <= 0);
        break;
      case 'open':
        filtered = filtered.filter(trade => trade.pnl === undefined);
        break;
      case 'high-adherence':
        filtered = filtered.filter(trade => trade.adherenceScore && trade.adherenceScore >= 80);
        break;
      case 'low-adherence':
        filtered = filtered.filter(trade => trade.adherenceScore && trade.adherenceScore < 60);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'pnl':
          aValue = a.pnl || 0;
          bValue = b.pnl || 0;
          break;
        case 'adherenceScore':
          aValue = a.adherenceScore || 0;
          bValue = b.adherenceScore || 0;
          break;
        case 'currencyPair':
          aValue = a.currencyPair;
          bValue = b.currencyPair;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [trades, searchTerm, filter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTrades.length / pageSize);
  const paginatedTrades = filteredAndSortedTrades.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Summary statistics
  const summary = useMemo(() => {
    const winningTrades = filteredAndSortedTrades.filter(t => t.pnl && t.pnl > 0);
    const losingTrades = filteredAndSortedTrades.filter(t => t.pnl && t.pnl <= 0);
    const totalPnL = filteredAndSortedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgPnL = filteredAndSortedTrades.length > 0 ? totalPnL / filteredAndSortedTrades.length : 0;
    const winRate = filteredAndSortedTrades.length > 0 ? (winningTrades.length / filteredAndSortedTrades.length) * 100 : 0;
    
    const tradesWithAdherence = filteredAndSortedTrades.filter(t => t.adherenceScore !== undefined);
    const avgAdherence = tradesWithAdherence.length > 0 
      ? tradesWithAdherence.reduce((sum, t) => sum + t.adherenceScore!, 0) / tradesWithAdherence.length 
      : 0;

    return {
      total: filteredAndSortedTrades.length,
      winning: winningTrades.length,
      losing: losingTrades.length,
      totalPnL,
      avgPnL,
      winRate,
      avgAdherence
    };
  }, [filteredAndSortedTrades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPnLColor = (pnl?: number) => {
    if (pnl === undefined) return 'text-gray-500';
    return pnl > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getAdherenceColor = (score?: number) => {
    if (score === undefined) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Trades for "{strategyName}"
            </div>
            <Badge variant="outline" className="text-sm">
              {summary.total} trades
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{summary.total}</div>
              <div className="text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-green-600">{summary.winning}</div>
              <div className="text-gray-600">Winning</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-red-600">{summary.losing}</div>
              <div className="text-gray-600">Losing</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold text-lg ${summary.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(summary.winRate)}
              </div>
              <div className="text-gray-600">Win Rate</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold text-lg ${getPnLColor(summary.totalPnL)}`}>
                {formatCurrency(summary.totalPnL)}
              </div>
              <div className="text-gray-600">Total P&L</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold text-lg ${getAdherenceColor(summary.avgAdherence)}`}>
                {formatPercentage(summary.avgAdherence)}
              </div>
              <div className="text-gray-600">Avg Adherence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search trades by currency pair, side, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filter} onValueChange={(value) => setFilter(value as TradeFilter)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter trades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="winning">Winning Trades</SelectItem>
                <SelectItem value="losing">Losing Trades</SelectItem>
                <SelectItem value="open">Open Trades</SelectItem>
                <SelectItem value="high-adherence">High Adherence (≥80%)</SelectItem>
                <SelectItem value="low-adherence">Low Adherence (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Trade History</span>
            <div className="text-sm font-normal text-gray-500">
              Showing {paginatedTrades.length} of {filteredAndSortedTrades.length} trades
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No trades found matching the current filters.
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b text-sm font-medium text-gray-600">
                <div 
                  className="col-span-3 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('timestamp')}
                >
                  Date & Time
                  {getSortIcon('timestamp')}
                </div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('currencyPair')}
                >
                  Pair
                  {getSortIcon('currencyPair')}
                </div>
                <div className="col-span-1">Side</div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('pnl')}
                >
                  P&L
                  {getSortIcon('pnl')}
                </div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('adherenceScore')}
                >
                  Adherence
                  {getSortIcon('adherenceScore')}
                </div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Table Rows */}
              <div className="space-y-2 mt-3">
                {paginatedTrades.map(trade => (
                  <div
                    key={trade.id}
                    className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(trade.timestamp)}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="font-medium">{trade.currencyPair}</span>
                    </div>
                    
                    <div className="col-span-1">
                      <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                        {trade.side}
                      </Badge>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        {trade.pnl !== undefined ? (
                          <>
                            {trade.pnl > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`font-medium ${getPnLColor(trade.pnl)}`}>
                              {formatCurrency(trade.pnl)}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm">Open</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      {trade.adherenceScore !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${getAdherenceColor(trade.adherenceScore)}`}>
                            {formatPercentage(trade.adherenceScore)}
                          </span>
                          {trade.deviations && trade.deviations.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {trade.deviations.length} deviations
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Not scored</span>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        {onViewTradeDetails && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewTradeDetails(trade)}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Quick View
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigateToTrade(trade.id)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedTradesView;
import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Target, 
  AlertCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap
} from 'lucide-react';
import { Trade } from '../../types/trade';
import { CURRENT_TERMINOLOGY } from '../../lib/terminologyConfig';

interface TradeCardProps {
  trade: Trade;
  context?: string;
  onRemove?: () => void;
  onViewDetails?: () => void;
  showFullDetails?: boolean;
}

export default function TradeCard({ 
  trade, 
  context, 
  onRemove, 
  onViewDetails,
  showFullDetails = false 
}: TradeCardProps) {
  const [isExpanded, setIsExpanded] = useState(showFullDetails);
  
  const isWinning = (trade.pnl || 0) > 0;
  const isOpen = trade.status === 'open';
  
  // Calculate additional metrics
  const riskReward = trade.rMultiple || 
    (trade.takeProfit && trade.stopLoss && trade.entryPrice 
      ? Math.abs(trade.takeProfit - trade.entryPrice) / Math.abs(trade.entryPrice - trade.stopLoss)
      : null);

  const pips = trade.pips || 
    (trade.exitPrice && trade.entryPrice 
      ? Math.abs(trade.exitPrice - trade.entryPrice) * 10000 // Simplified pip calculation
      : null);

  const duration = trade.timeOut && trade.timeIn 
    ? Math.round((new Date(trade.timeOut).getTime() - new Date(trade.timeIn).getTime()) / (1000 * 60))
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Currency Pair */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {trade.currencyPair}
            </h3>
            
            {/* Direction Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
              trade.side === 'long' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            }`}>
              {trade.side === 'long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trade.side.toUpperCase()}
            </span>

            {/* Status Badge */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              isOpen 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : isWinning
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isOpen ? 'OPEN' : isWinning ? 'WIN' : 'LOSS'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* P&L */}
            <span className={`text-lg font-bold ${
              isWinning ? 'text-green-600' : 'text-red-600'
            }`}>
              {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="View full trade details"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {onRemove && (
                <button
                  onClick={onRemove}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove trade reference"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Context */}
        {context && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-200">
            <strong>Context:</strong> {context}
          </div>
        )}
      </div>

      {/* Basic Info - Always Visible */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Entry Time</span>
            </div>
            <div className="font-medium text-gray-800 dark:text-white">
              {format(new Date(trade.timeIn), 'HH:mm')}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Entry Price</span>
            </div>
            <div className="font-mono text-sm font-medium text-gray-800 dark:text-white">
              {trade.entryPrice.toFixed(5)}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Lot Size</span>
            </div>
            <div className="font-medium text-gray-800 dark:text-white">
              {trade.lotSize} {trade.lotType}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">Strategy</span>
            </div>
            <div className="font-medium text-gray-800 dark:text-white text-sm">
              {trade.strategy || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
          <div className="space-y-4">
            {/* Price Levels */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Levels</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trade.exitPrice && (
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Exit Price</div>
                    <div className="font-mono text-sm font-medium">{trade.exitPrice.toFixed(5)}</div>
                  </div>
                )}
                
                {trade.stopLoss && (
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Stop Loss</div>
                    <div className="font-mono text-sm font-medium text-red-600">{trade.stopLoss.toFixed(5)}</div>
                  </div>
                )}
                
                {trade.takeProfit && (
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Take Profit</div>
                    <div className="font-mono text-sm font-medium text-green-600">{trade.takeProfit.toFixed(5)}</div>
                  </div>
                )}

                {pips && (
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">{CURRENT_TERMINOLOGY.priceMovementLabel}</div>
                    <div className={`font-medium ${isWinning ? 'text-green-600' : 'text-red-600'}`}>
                      {pips > 0 ? '+' : ''}{pips.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Management */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Management</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trade.riskAmount && (
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Risk Amount</div>
                    <div className="font-medium text-red-600">${trade.riskAmount.toFixed(2)}</div>
                  </div>
                )}

                {riskReward && (
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Risk:Reward</div>
                    <div className="font-medium text-gray-800 dark:text-white">1:{riskReward.toFixed(2)}</div>
                  </div>
                )}

                {duration && (
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                    <div className="font-medium text-gray-800 dark:text-white">
                      {duration < 60 ? `${duration}m` : `${Math.round(duration / 60)}h ${duration % 60}m`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Market Conditions */}
            {(trade.session || trade.marketConditions || trade.timeframe) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Market Conditions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {trade.session && (
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Session</div>
                      <div className="font-medium text-gray-800 dark:text-white capitalize">{trade.session}</div>
                    </div>
                  )}

                  {trade.timeframe && (
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Timeframe</div>
                      <div className="font-medium text-gray-800 dark:text-white">{trade.timeframe}</div>
                    </div>
                  )}

                  {trade.marketConditions && (
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Market</div>
                      <div className="font-medium text-gray-800 dark:text-white">{trade.marketConditions}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Features */}
            {(trade.setup || (trade.patterns && trade.patterns.length > 0)) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Setup & Patterns</h4>
                <div className="space-y-2">
                  {trade.setup && (
                    <div className="p-2 bg-white dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          {trade.setup.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                          Quality: {trade.setup.quality}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {trade.patterns && trade.patterns.length > 0 && (
                    <div className="p-2 bg-white dark:bg-gray-800 rounded">
                      <div className="flex flex-wrap gap-1">
                        {trade.patterns.map((pattern, index) => (
                          <span 
                            key={index}
                            className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded"
                          >
                            {pattern.type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {trade.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
                <div className="p-3 bg-white dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
                  {trade.notes}
                </div>
              </div>
            )}

            {/* Emotions */}
            {trade.emotions && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emotions</h4>
                <div className="p-3 bg-white dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
                  {trade.emotions}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
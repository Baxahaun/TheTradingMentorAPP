import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Target, 
  X,
  ExternalLink,
  Info,
  BarChart3
} from 'lucide-react';
import { Trade } from '../../types/trade';

interface TradePreviewProps {
  trade: Trade;
  context?: string;
  onRemove?: () => void;
  onViewDetails?: () => void;
  showTooltip?: boolean;
}

export default function TradePreview({ 
  trade, 
  context, 
  onRemove, 
  onViewDetails,
  showTooltip = true 
}: TradePreviewProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const isWinning = (trade.pnl || 0) > 0;
  const isOpen = trade.status === 'open';
  
  // Calculate pips (simplified)
  const pips = trade.pips || 
    (trade.exitPrice && trade.entryPrice 
      ? Math.abs(trade.exitPrice - trade.entryPrice) * 10000
      : null);

  return (
    <div className="relative">
      {/* Main Preview Card */}
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => showTooltip && setShowDetails(false)}
      >
        <div className="flex items-center justify-between">
          {/* Left Side - Trade Info */}
          <div className="flex items-center gap-3">
            {/* Currency Pair & Direction */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-white">
                {trade.currencyPair}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                trade.side === 'long' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              }`}>
                {trade.side === 'long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trade.side.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Status */}
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              isOpen 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : isWinning
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isOpen ? 'OPEN' : isWinning ? 'WIN' : 'LOSS'}
            </span>

            {/* Time */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              {format(new Date(trade.timeIn), 'HH:mm')}
            </div>
          </div>

          {/* Right Side - P&L & Actions */}
          <div className="flex items-center gap-3">
            {/* P&L */}
            <span className={`font-bold ${
              isWinning ? 'text-green-600' : 'text-red-600'
            }`}>
              {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
            </span>

            {/* Pips (if available) */}
            {pips && (
              <span className={`text-xs font-medium ${
                isWinning ? 'text-green-600' : 'text-red-600'
              }`}>
                {pips > 0 ? '+' : ''}{pips.toFixed(1)}p
              </span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="View full trade details"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove trade reference"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Context */}
        {context && (
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            {context}
          </div>
        )}
      </div>

      {/* Detailed Tooltip */}
      {showDetails && showTooltip && (
        <div className="absolute z-50 top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                {trade.currencyPair}
              </h4>
              <span className={`text-xs px-2 py-1 rounded ${
                trade.side === 'long' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              }`}>
                {trade.side.toUpperCase()}
              </span>
            </div>
            <span className={`font-bold ${
              isWinning ? 'text-green-600' : 'text-red-600'
            }`}>
              {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-xs text-gray-500 dark:text-gray-400">Entry</div>
              <div className="font-mono text-sm font-medium">{trade.entryPrice.toFixed(5)}</div>
            </div>

            {trade.exitPrice && (
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Exit</div>
                <div className="font-mono text-sm font-medium">{trade.exitPrice.toFixed(5)}</div>
              </div>
            )}

            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-xs text-gray-500 dark:text-gray-400">Lot Size</div>
              <div className="text-sm font-medium">{trade.lotSize} {trade.lotType}</div>
            </div>

            {trade.strategy && (
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Strategy</div>
                <div className="text-sm font-medium truncate">{trade.strategy}</div>
              </div>
            )}
          </div>

          {/* Risk Management */}
          {(trade.stopLoss || trade.takeProfit || trade.riskAmount) && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Management</h5>
              <div className="grid grid-cols-2 gap-2">
                {trade.stopLoss && (
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <div className="text-xs text-red-600 dark:text-red-400">Stop Loss</div>
                    <div className="font-mono text-xs font-medium">{trade.stopLoss.toFixed(5)}</div>
                  </div>
                )}

                {trade.takeProfit && (
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-xs text-green-600 dark:text-green-400">Take Profit</div>
                    <div className="font-mono text-xs font-medium">{trade.takeProfit.toFixed(5)}</div>
                  </div>
                )}

                {trade.riskAmount && (
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded col-span-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Risk Amount</div>
                    <div className="text-sm font-medium text-red-600">${trade.riskAmount.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Market Context */}
          {(trade.session || trade.timeframe || trade.marketConditions) && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Market Context</h5>
              <div className="flex flex-wrap gap-1">
                {trade.session && (
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {trade.session}
                  </span>
                )}
                {trade.timeframe && (
                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                    {trade.timeframe}
                  </span>
                )}
                {trade.marketConditions && (
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                    {trade.marketConditions}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Features */}
          {trade.setup && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Setup</h5>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-800 dark:text-indigo-200">
                    {trade.setup.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">
                    Quality: {trade.setup.quality}/5
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timing */}
          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-2">
            <div className="flex justify-between">
              <span>Entry: {format(new Date(trade.timeIn), 'MMM d, HH:mm')}</span>
              {trade.timeOut && (
                <span>Exit: {format(new Date(trade.timeOut), 'MMM d, HH:mm')}</span>
              )}
            </div>
          </div>

          {/* Notes Preview */}
          {trade.notes && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes:</div>
              <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                {trade.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
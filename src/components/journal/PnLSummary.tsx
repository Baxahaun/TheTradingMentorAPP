import React from 'react';
import { ProcessMetrics } from '../../types/journal';
import { Trade } from '../../types/trade';

interface PnLSummaryProps {
  dailyPnL: number;
  processMetrics: ProcessMetrics;
  trades: Trade[];
  accountCurrency?: string;
  className?: string;
}

export const PnLSummary: React.FC<PnLSummaryProps> = ({
  dailyPnL,
  processMetrics,
  trades,
  accountCurrency = 'USD',
  className = ''
}) => {
  const isPositive = dailyPnL > 0;
  const isNegative = dailyPnL < 0;
  const isBreakeven = dailyPnL === 0;

  const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0).length;
  const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0).length;
  const breakEvenTrades = trades.filter(trade => (trade.pnl || 0) === 0).length;

  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  const getProcessMessage = (): { message: string; type: 'success' | 'warning' | 'info' | 'error' } => {
    const processScore = processMetrics.processScore;
    const overallDiscipline = processMetrics.overallDiscipline;

    // Excellent process day
    if (processScore >= 80 && overallDiscipline >= 4) {
      if (isPositive) {
        return {
          message: "Excellent! You followed your process perfectly and were rewarded. This is how consistent profitability is built.",
          type: 'success'
        };
      } else if (isNegative) {
        return {
          message: "Great process execution! Even with a loss, you followed your plan perfectly. These are the 'good losses' that build long-term success.",
          type: 'success'
        };
      } else {
        return {
          message: "Perfect process execution with breakeven results. Your discipline will pay off in the long run.",
          type: 'success'
        };
      }
    }

    // Good process day
    if (processScore >= 60 && overallDiscipline >= 3) {
      if (isPositive) {
        return {
          message: "Good process with positive results. Focus on the areas where you can improve your execution for even better consistency.",
          type: 'info'
        };
      } else if (isNegative) {
        return {
          message: "Solid process execution despite the loss. Review what you did well and minor areas for improvement.",
          type: 'info'
        };
      } else {
        return {
          message: "Good process discipline with neutral results. Keep refining your execution.",
          type: 'info'
        };
      }
    }

    // Fair process day
    if (processScore >= 40 && overallDiscipline >= 2) {
      if (isPositive) {
        return {
          message: "You made money, but your process needs work. Don't let profits mask execution issues - focus on discipline.",
          type: 'warning'
        };
      } else if (isNegative) {
        return {
          message: "Process breakdowns led to losses. Focus on the specific areas where you deviated from your plan.",
          type: 'warning'
        };
      } else {
        return {
          message: "Mixed process execution with neutral results. Identify specific areas for improvement.",
          type: 'warning'
        };
      }
    }

    // Poor process day
    if (isPositive) {
      return {
        message: "WARNING: You made money despite poor process execution. This is dangerous - profits from bad habits won't last.",
        type: 'error'
      };
    } else if (isNegative) {
      return {
        message: "Poor process execution resulted in losses. This is a learning opportunity - focus on rebuilding your discipline.",
        type: 'error'
      };
    } else {
      return {
        message: "Poor process execution with breakeven results. You got lucky - focus on improving your discipline.",
        type: 'error'
      };
    }
  };

  const processMessage = getProcessMessage();

  const formatCurrency = (amount: number): string => {
    const symbol = accountCurrency === 'USD' ? '$' : accountCurrency + ' ';
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
  };

  const getPnLColor = (): string => {
    if (isPositive) return 'text-green-600';
    if (isNegative) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMessageStyles = (type: string): string => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Daily P&L Summary</h3>
        <p className="text-sm text-gray-600">Process matters more than outcomes</p>
      </div>

      {/* P&L Display */}
      <div className="p-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getPnLColor()}`}>
            {isPositive && '+'}
            {formatCurrency(dailyPnL)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {trades.length} trade{trades.length !== 1 ? 's' : ''} executed
          </div>
        </div>

        {/* Trade Breakdown */}
        {trades.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-green-600">{winningTrades}</div>
              <div className="text-xs text-green-600">Winners</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-red-600">{losingTrades}</div>
              <div className="text-xs text-red-600">Losers</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-600">{breakEvenTrades}</div>
              <div className="text-xs text-gray-600">Breakeven</div>
            </div>
          </div>
        )}

        {/* Win Rate */}
        {trades.length > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">Win Rate</div>
            <div className="text-xl font-semibold text-gray-900">{winRate.toFixed(1)}%</div>
          </div>
        )}
      </div>

      {/* Process vs Outcome Message */}
      <div className="p-4 border-t">
        <div className={`rounded-lg border p-4 ${getMessageStyles(processMessage.type)}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {processMessage.type === 'success' && (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {processMessage.type === 'info' && (
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              {processMessage.type === 'warning' && (
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {processMessage.type === 'error' && (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Process vs Outcome Analysis</p>
              <p className="text-sm mt-1">{processMessage.message}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Comparison */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Process Score</div>
            <div className={`text-lg font-semibold ${
              processMetrics.processScore >= 80 ? 'text-green-600' :
              processMetrics.processScore >= 60 ? 'text-yellow-600' :
              processMetrics.processScore >= 40 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {processMetrics.processScore}/100
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">P&L Impact</div>
            <div className={`text-lg font-semibold ${getPnLColor()}`}>
              {isPositive ? 'Positive' : isNegative ? 'Negative' : 'Neutral'}
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500 text-center">
          Remember: Consistent process execution leads to long-term profitability
        </div>
      </div>
    </div>
  );
};

export default PnLSummary;
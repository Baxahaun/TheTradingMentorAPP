import React from 'react';
import { Trade } from '../../../lib/firebaseService';
import { ProcessMetrics } from '../../../types/journal';
import { generateProcessInsights } from '../../../utils/processMetricsUtils';

interface SimplifiedSidebarProps {
  dayTrades: Trade[];
  processMetrics: ProcessMetrics;
  onTradeSelect?: (trade: Trade) => void;
  onUpdateProcessMetrics?: (metrics: ProcessMetrics) => void;
}

const SimplifiedSidebar: React.FC<SimplifiedSidebarProps> = ({
  dayTrades,
  processMetrics,
  onTradeSelect,
  onUpdateProcessMetrics
}) => {
  const dailyPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winRate = dayTrades.length > 0
    ? ((dayTrades.filter(t => (t.pnl || 0) > 0).length / dayTrades.length) * 100)
    : 0;
  const insights = generateProcessInsights(processMetrics, dayTrades);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Today's Trades */}
      {dayTrades.length > 0 && (
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-3">Today's Trades</h3>
          <div className="space-y-2">
            {dayTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 dark:text-white">{trade.currencyPair}</span>
                  <span className={`text-sm font-medium ${
                    trade.side === 'long' ? 'text-blue-500' : 'text-purple-500'
                  }`}>
                    {trade.side}
                  </span>
                  <span className="text-sm text-gray-500">{trade.lotSize}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-semibold ${
                    (trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                  </span>
                  {onTradeSelect && (
                    <button
                      onClick={() => onTradeSelect(trade)}
                      className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Daily P&L:</span>
              <span className={`font-mono font-bold ${
                dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Session Overview & Performance Metrics Combined */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-4">Session Overview</h3>
        
        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Trades:</span>
            <span className="font-semibold text-gray-800 dark:text-white">{dayTrades.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate:</span>
            <span className="font-semibold text-gray-800 dark:text-white">
              {dayTrades.length > 0 ? `${winRate.toFixed(0)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Process Score:</span>
            <span className="font-semibold text-gray-800 dark:text-white">
              {processMetrics.processScore}/100
            </span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Performance Breakdown</h4>
          
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Process Score</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{processMetrics.processScore}/100</p>
                </div>
                <div className="text-lg">⚡</div>
              </div>
            </div>
            
            <div className={`rounded-lg p-3 ${
              dailyPnL > 0 ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20' :
              dailyPnL < 0 ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20' :
              'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium ${
                    dailyPnL > 0 ? 'text-green-600 dark:text-green-400' :
                    dailyPnL < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Daily P&L
                  </p>
                  <p className={`text-lg font-bold ${
                    dailyPnL > 0 ? 'text-green-900 dark:text-green-100' :
                    dailyPnL < 0 ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {dailyPnL > 0 ? '+' : ''}${Math.abs(dailyPnL).toFixed(2)}
                  </p>
                </div>
                <div className="text-lg">💰</div>
              </div>
            </div>
          </div>

          {/* Process Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Plan Adherence</span>
              <div className="flex items-center gap-2">
                <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full" 
                    style={{ width: `${(processMetrics.planAdherence / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-800 dark:text-white w-6">
                  {processMetrics.planAdherence}/5
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Risk Management</span>
              <div className="flex items-center gap-2">
                <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full" 
                    style={{ width: `${(processMetrics.riskManagement / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-800 dark:text-white w-6">
                  {processMetrics.riskManagement}/5
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Emotional Discipline</span>
              <div className="flex items-center gap-2">
                <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full" 
                    style={{ width: `${(processMetrics.emotionalDiscipline / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-800 dark:text-white w-6">
                  {processMetrics.emotionalDiscipline}/5
                </span>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          {insights.keyInsight && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3">
              <div className="flex items-start">
                <div className="text-sm">💡</div>
                <div className="ml-2">
                  <h5 className="text-xs font-medium text-blue-900 dark:text-blue-100">Key Insight</h5>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">{insights.keyInsight}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SimplifiedSidebar;
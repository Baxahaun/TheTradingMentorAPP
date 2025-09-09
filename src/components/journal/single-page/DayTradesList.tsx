import React from 'react';
import { Trade } from '../../../lib/firebaseService';
import { FileText } from 'lucide-react';

interface DayTradesListProps {
  trades: Trade[];
  onTradeSelect: (trade: Trade) => void;
}

const DayTradesList: React.FC<DayTradesListProps> = ({ trades, onTradeSelect }) => {
  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-3">Today's Trades</h3>
      <div className="grid gap-2">
        {trades.map((trade) => (
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
              <button
                onClick={() => onTradeSelect(trade)}
                className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DayTradesList;
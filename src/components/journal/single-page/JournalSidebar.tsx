import React from 'react';
import { Trade } from '../../../lib/firebaseService';
import { JournalEntry } from '../../../types/journal';
import DayTradesList from './DayTradesList';

interface JournalSidebarProps {
  journalEntry: JournalEntry | null;
  dayTrades: Trade[];
  onTradeSelect: (trade: Trade) => void;
}

const JournalSidebar: React.FC<JournalSidebarProps> = ({
  journalEntry,
  dayTrades,
  onTradeSelect,
}) => {
  return (
    <aside className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
      <div className="space-y-8">
        {dayTrades.length > 0 && (
          <DayTradesList
            trades={dayTrades}
            onTradeSelect={onTradeSelect}
          />
        )}
        {/* Note: EmotionalTracker and PerformanceMetrics moved to main layout */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          <p>Additional sidebar content can be added here</p>
        </div>
      </div>
    </aside>
  );
};

export default JournalSidebar;
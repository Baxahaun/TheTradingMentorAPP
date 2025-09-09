import React, { useState } from 'react';
import { FileText, Heart, TrendingUp, BarChart3, Eye, Edit3 } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface TabbedInterfaceProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  showReviewMode?: boolean;
  isReviewMode?: boolean;
  onToggleReviewMode?: () => void;
}

const TabbedInterface: React.FC<TabbedInterfaceProps> = ({
  tabs,
  defaultTab,
  className = '',
  showReviewMode = false,
  isReviewMode = false,
  onToggleReviewMode
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md ${className}`}>
      {/* Tab Headers */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 pt-6">
          <nav className="flex space-x-4 md:space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Review Mode Toggle */}
          {showReviewMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:inline">Review Mode</span>
              <button
                onClick={onToggleReviewMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isReviewMode
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {isReviewMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isReviewMode ? 'View' : 'Edit'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-3 md:p-6">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {activeTabContent}
        </div>
      </div>
    </div>
  );
};

export default TabbedInterface;
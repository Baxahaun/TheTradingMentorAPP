import React, { useState } from 'react';
import { Trade } from '../../types/trade';
import { EnhancedTagInput } from '../ui/EnhancedTagInput';
import { useTagSuggestions } from '../../hooks/useTagSuggestions';

// Example trades for demonstration
const exampleTrades: Trade[] = [
  {
    id: '1',
    accountId: 'acc1',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '09:00',
    side: 'long',
    entryPrice: 1.0950,
    exitPrice: 1.0980,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    commission: 5,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 300,
    session: 'european',
    strategy: 'breakout',
    tags: ['#breakout', '#major-pair', '#bullish', '#european-session']
  },
  {
    id: '2',
    accountId: 'acc1',
    currencyPair: 'GBP/USD',
    date: '2024-01-16',
    timeIn: '14:00',
    side: 'short',
    entryPrice: 1.2650,
    exitPrice: 1.2620,
    lotSize: 0.5,
    lotType: 'standard',
    units: 50000,
    commission: 3,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 150,
    session: 'us',
    strategy: 'scalping',
    tags: ['#scalping', '#major-pair', '#bearish', '#us-session']
  },
  {
    id: '3',
    accountId: 'acc1',
    currencyPair: 'USD/JPY',
    date: '2024-01-17',
    timeIn: '02:00',
    side: 'long',
    entryPrice: 148.50,
    exitPrice: 148.20,
    lotSize: 1,
    lotType: 'standard',
    units: 100000,
    commission: 5,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: -200,
    session: 'asian',
    strategy: 'swing',
    tags: ['#swing-trade', '#major-pair', '#bullish', '#asian-session']
  }
];

/**
 * Example component demonstrating the enhanced tag suggestions system
 */
export const TagSuggestionsExample: React.FC = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentTrade, setCurrentTrade] = useState<Partial<Trade>>({
    currencyPair: 'EUR/USD',
    session: 'european',
    strategy: 'breakout',
    side: 'long'
  });

  // Use the tag suggestions hook
  const {
    suggestions,
    loading,
    error,
    getSuggestions,
    clearSuggestions,
    getRecentTags,
    getContextualTags
  } = useTagSuggestions(exampleTrades, {
    limit: 10,
    debounceMs: 300,
    includeContextual: true,
    includePerformance: true
  });

  const recentTags = getRecentTags();
  const contextualTags = getContextualTags(currentTrade);

  const handleTradeChange = (field: keyof Trade, value: any) => {
    setCurrentTrade(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Enhanced Tag Suggestions Demo
        </h1>

        {/* Current Trade Context */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Current Trade Context
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency Pair
              </label>
              <select
                value={currentTrade.currencyPair || ''}
                onChange={(e) => handleTradeChange('currencyPair', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EUR/USD">EUR/USD</option>
                <option value="GBP/USD">GBP/USD</option>
                <option value="USD/JPY">USD/JPY</option>
                <option value="USD/ZAR">USD/ZAR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session
              </label>
              <select
                value={currentTrade.session || ''}
                onChange={(e) => handleTradeChange('session', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asian">Asian</option>
                <option value="european">European</option>
                <option value="us">US</option>
                <option value="overlap">Overlap</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strategy
              </label>
              <select
                value={currentTrade.strategy || ''}
                onChange={(e) => handleTradeChange('strategy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="breakout">Breakout</option>
                <option value="scalping">Scalping</option>
                <option value="swing">Swing</option>
                <option value="reversal">Reversal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side
              </label>
              <select
                value={currentTrade.side || ''}
                onChange={(e) => handleTradeChange('side', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Tag Input */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Enhanced Tag Input
          </h2>
          <EnhancedTagInput
            value={selectedTags}
            onChange={setSelectedTags}
            trades={exampleTrades}
            currentTrade={currentTrade}
            placeholder="Start typing to see intelligent suggestions..."
            showContextualSuggestions={true}
            showPerformanceIndicators={true}
            className="w-full"
          />
        </div>

        {/* Suggestions Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recent Tags */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Recent Tags
            </h3>
            <div className="space-y-2">
              {recentTags.slice(0, 5).map((tag, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-600">{tag.tag}</span>
                  <span className="text-gray-500">
                    {tag.frequency} uses
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual Suggestions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Contextual Suggestions
            </h3>
            <div className="space-y-2">
              {contextualTags.slice(0, 5).map((tag, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-green-600">{tag.tag}</span>
                  <span className="text-gray-500 text-xs">
                    {tag.reason.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Suggestions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Current Suggestions
              {loading && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
            </h3>
            {error && (
              <div className="text-red-600 text-sm mb-2">
                Error: {error}
              </div>
            )}
            <div className="space-y-2">
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-purple-600">{suggestion.tag}</span>
                  <div className="text-right">
                    <div className="text-gray-500 text-xs">
                      {suggestion.reason.replace('_', ' ')}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Score: {Math.round(suggestion.score)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Selected Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-md font-semibold text-blue-800 mb-2">
            How to Test the Enhanced Suggestions
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Change the trade context above to see different contextual suggestions</li>
            <li>• Start typing in the tag input to see intelligent autocomplete</li>
            <li>• Try typing "break", "scal", or "major" to see matching suggestions</li>
            <li>• Notice how suggestions are ranked by relevance and frequency</li>
            <li>• Performance indicators show which tags have better trading results</li>
            <li>• Recent tags are prioritized based on usage recency</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TagSuggestionsExample;
import React, { useState, useEffect } from 'react';
import { Trade, TradeSetup, TradePattern, SetupType, PatternType } from '../types/trade';
import { EnhancedDataMigrationService } from '../lib/enhancedDataMigration';
import { useTradeContext } from '../contexts/TradeContext';
import { useAuth } from '../contexts/AuthContext';

interface RetroactiveClassificationProps {
  onClose: () => void;
}

interface ClassificationSuggestion {
  setup: string | null;
  patterns: string[];
  confidence: number;
}

export const RetroactiveClassificationInterface: React.FC<RetroactiveClassificationProps> = ({ onClose }) => {
  const { trades, updateTrade } = useTradeContext();
  const { user } = useAuth();
  const [unclassifiedTrades, setUnclassifiedTrades] = useState<Trade[]>([]);
  const [suggestions, setSuggestions] = useState<{ [tradeId: string]: ClassificationSuggestion }>({});
  const [currentTradeIndex, setCurrentTradeIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationStats, setMigrationStats] = useState<any>(null);

  useEffect(() => {
    if (trades.length > 0) {
      const classificationData = EnhancedDataMigrationService.createRetroactiveClassificationData(trades);
      setUnclassifiedTrades(classificationData.unclassifiedTrades);
      setSuggestions(classificationData.suggestedClassifications);
      setMigrationStats(classificationData.migrationStats);
    }
  }, [trades]);

  const currentTrade = unclassifiedTrades[currentTradeIndex];

  const handleApplyClassification = async (tradeId: string, classification: { setup?: TradeSetup; patterns?: TradePattern[] }) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      await updateTrade(tradeId, classification);
      
      // Remove from unclassified list
      setUnclassifiedTrades(prev => prev.filter(t => t.id !== tradeId));
      
      // Move to next trade or close if done
      if (currentTradeIndex >= unclassifiedTrades.length - 1) {
        if (unclassifiedTrades.length === 1) {
          onClose();
        } else {
          setCurrentTradeIndex(0);
        }
      }
    } catch (error) {
      console.error('Error applying classification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipTrade = () => {
    if (currentTradeIndex < unclassifiedTrades.length - 1) {
      setCurrentTradeIndex(prev => prev + 1);
    } else {
      setCurrentTradeIndex(0);
    }
  };

  const handleApplySuggestion = () => {
    if (!currentTrade) return;

    const suggestion = suggestions[currentTrade.id];
    if (!suggestion) return;

    const classification: { setup?: TradeSetup; patterns?: TradePattern[] } = {};

    if (suggestion.setup) {
      classification.setup = {
        id: `setup_${currentTrade.id}`,
        type: suggestion.setup as SetupType,
        confluence: [],
        timeframe: currentTrade.timeframe || '1H',
        marketCondition: 'trending',
        quality: Math.ceil(suggestion.confidence * 5) as 1 | 2 | 3 | 4 | 5,
        notes: 'Auto-classified from historical data'
      };
    }

    if (suggestion.patterns.length > 0) {
      classification.patterns = suggestion.patterns.map((patternType, index) => ({
        id: `pattern_${currentTrade.id}_${index}`,
        type: patternType as PatternType,
        timeframe: currentTrade.timeframe || '1H',
        quality: Math.ceil(suggestion.confidence * 5) as 1 | 2 | 3 | 4 | 5,
        confluence: suggestion.confidence > 0.5,
        description: 'Auto-classified from historical data'
      }));
    }

    handleApplyClassification(currentTrade.id, classification);
  };

  if (!migrationStats || unclassifiedTrades.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Retroactive Classification</h2>
          {migrationStats ? (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg font-semibold mb-2">All trades are classified!</p>
              <p className="text-gray-600 mb-4">
                {migrationStats.classified} out of {migrationStats.total} trades have been classified with enhanced features.
              </p>
              <button
                onClick={onClose}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading classification data...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Retroactive Trade Classification</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {currentTradeIndex + 1} of {unclassifiedTrades.length}</span>
            <span>{migrationStats.classified} already classified</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentTradeIndex + 1) / unclassifiedTrades.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {currentTrade && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trade Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Trade Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Pair:</strong> {currentTrade.currencyPair}</div>
                <div><strong>Date:</strong> {currentTrade.date}</div>
                <div><strong>Side:</strong> {currentTrade.side}</div>
                <div><strong>Entry:</strong> {currentTrade.entryPrice}</div>
                <div><strong>Exit:</strong> {currentTrade.exitPrice || 'Open'}</div>
                <div><strong>P&L:</strong> {currentTrade.pnl ? `$${currentTrade.pnl.toFixed(2)}` : 'N/A'}</div>
                {currentTrade.strategy && <div><strong>Strategy:</strong> {currentTrade.strategy}</div>}
                {currentTrade.marketConditions && <div><strong>Market:</strong> {currentTrade.marketConditions}</div>}
                {currentTrade.timeframe && <div><strong>Timeframe:</strong> {currentTrade.timeframe}</div>}
                {currentTrade.notes && (
                  <div>
                    <strong>Notes:</strong>
                    <p className="mt-1 text-gray-600 text-xs">{currentTrade.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Classification Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Classification Options</h3>
              
              {/* Suggested Classification */}
              {suggestions[currentTrade.id] && suggestions[currentTrade.id].confidence > 0.3 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Suggested Classification 
                    <span className="text-sm font-normal">
                      (Confidence: {Math.round(suggestions[currentTrade.id].confidence * 100)}%)
                    </span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    {suggestions[currentTrade.id].setup && (
                      <div><strong>Setup:</strong> {suggestions[currentTrade.id].setup.replace(/_/g, ' ')}</div>
                    )}
                    {suggestions[currentTrade.id].patterns.length > 0 && (
                      <div><strong>Patterns:</strong> {suggestions[currentTrade.id].patterns.join(', ')}</div>
                    )}
                  </div>
                  <button
                    onClick={handleApplySuggestion}
                    disabled={isProcessing}
                    className="mt-3 bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isProcessing ? 'Applying...' : 'Apply Suggestion'}
                  </button>
                </div>
              )}

              {/* Manual Classification */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Manual Classification</h4>
                <p className="text-sm text-gray-600 mb-3">
                  You can manually classify this trade by opening it in the trade editor.
                </p>
                <button
                  onClick={() => {
                    // This would open the trade in edit mode
                    // For now, we'll just skip to the next trade
                    handleSkipTrade();
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                >
                  Open in Editor
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSkipTrade}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Skip This Trade
                </button>
                <button
                  onClick={() => handleApplyClassification(currentTrade.id, {})}
                  disabled={isProcessing}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Mark as Reviewed'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-lg">{migrationStats.total}</div>
              <div className="text-gray-600">Total Trades</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-green-600">{migrationStats.classified}</div>
              <div className="text-gray-600">Classified</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-orange-600">{migrationStats.unclassified}</div>
              <div className="text-gray-600">Remaining</div>
            </div>
            <div>
              <div className="font-semibold text-lg text-blue-600">
                {Math.round((migrationStats.classified / migrationStats.total) * 100)}%
              </div>
              <div className="text-gray-600">Complete</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
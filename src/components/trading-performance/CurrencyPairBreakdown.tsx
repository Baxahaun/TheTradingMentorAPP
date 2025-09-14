import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Plus, Minus } from 'lucide-react';
import { formatChartValue } from '../../utils/performanceChartUtils';
import { CurrencyPairMetrics } from '../../types/tradingPerformance';
import { CURRENT_TERMINOLOGY } from '../../lib/terminologyConfig';

/**
 * Instrument Breakdown Component
 *
 * Displays top and worst performing instruments with key metrics
 * and click-to-filter functionality for trading analysis.
 */
interface ExtendedCurrencyPairBreakdownProps {
  data: CurrencyPairMetrics[];
  size?: { w: number; h: number };
  onPairClick?: (pair: string) => void;
}

const CurrencyPairBreakdown: React.FC<ExtendedCurrencyPairBreakdownProps> = ({
  data,
  size = { w: 12, h: 6 },
  onPairClick
}) => {
  // Process and filter currency pair data
  const { bestPairs, worstPairs } = useMemo(() => {
    if (!data || data.length === 0) {
      return { bestPairs: [], worstPairs: [] };
    }

    // Sort by P&L to get best and worst performers
    const sortedByPnL = [...data].sort((a, b) => b.totalPnL - a.totalPnL);

    // Take top 3 and bottom 3 (or fewer if data is limited)
    const maxPairs = Math.min(3, Math.floor(sortedByPnL.length / 2));
    const bestPairs = sortedByPnL.slice(0, maxPairs > data.length ? data.length : maxPairs);
    const worstPairs = sortedByPnL.slice(-maxPairs);

    return { bestPairs, worstPairs };
  }, [data]);

  // Responsive grid classes based on size
  const getGridClasses = () => {
    const totalWidth = size?.w || 4;
    const totalHeight = size?.h || 4;

    if (totalWidth >= 8) {
      return 'grid grid-cols-2 gap-4';
    } else if (totalWidth >= 4) {
      return 'grid grid-cols-1 gap-4';
    } else {
      return 'space-y-3';
    }
  };

  // Handle pair click for filtering
  const handlePairClick = (pair: string) => {
    if (onPairClick) {
      onPairClick(pair);
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {CURRENT_TERMINOLOGY.instrumentLabel} Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} data available</p>
            <p className="text-xs text-gray-500 mt-1">Complete some trades to see analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PairCard: React.FC<{
    pair: CurrencyPairMetrics;
    isBest: boolean;
    index: number;
  }> = ({ pair, isBest, index }) => (
    <div
      key={pair.currencyPair}
      className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-all duration-200 cursor-pointer hover:border-gray-200"
      onClick={() => handlePairClick(pair.currencyPair)}
    >
      {/* Pair Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">
            {pair.currencyPair}
          </span>
          <Badge
            variant={isBest ? "default" : "destructive"}
            className="px-1.5 py-0.5 text-xs flex items-center gap-1"
          >
            {isBest ? (
              <Plus className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {index + 1}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {pair.totalPnL >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600" />
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">P&L</span>
          <span className={`text-sm font-semibold ${pair.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatChartValue(pair.totalPnL, 'currency')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Win Rate</span>
          <span className={`text-sm font-medium ${
            pair.winRate >= 70 ? 'text-green-600' :
            pair.winRate >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {pair.winRate.toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Trades</span>
          <span className="text-sm font-medium text-gray-700">
            {pair.totalTrades}
          </span>
        </div>
        {pair.averagePip && pair.averagePip !== 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Avg Pip</span>
            <span className={`text-sm font-medium ${pair.averagePip >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pair.averagePip > 0 ? '+' : ''}{pair.averagePip.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Profit Factor indicator */}
      {pair.profitFactor && pair.profitFactor !== 1 && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                pair.profitFactor >= 1.5 ? 'bg-green-500' :
                pair.profitFactor >= 1.0 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min((pair.profitFactor / 3) * 100, 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>P.F.</span>
            <span>{pair.profitFactor.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            {CURRENT_TERMINOLOGY.instrumentLabel} Analysis
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Top & worst performing pairs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {data.length} pairs
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className={getGridClasses()}>
          {/* Best Performing Pairs */}
          {bestPairs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-900">Best Performing</h3>
              </div>
              <div className="space-y-2">
                {bestPairs.map((pair, index) => (
                  <PairCard
                    key={pair.currencyPair}
                    pair={pair}
                    isBest={true}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Worst Performing Pairs */}
          {worstPairs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <h3 className="text-sm font-semibold text-gray-900">Worst Performing</h3>
              </div>
              <div className="space-y-2">
                {worstPairs.map((pair, index) => (
                  <PairCard
                    key={pair.currencyPair}
                    pair={pair}
                    isBest={false}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {(bestPairs.length > 0 || worstPairs.length > 0) && (
          <div className="pt-2 border-t border-gray-50">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="text-green-600 font-medium">
                  {bestPairs.length > 0 &&
                    formatChartValue(bestPairs.reduce((sum, pair) => sum + pair.totalPnL, 0), 'currency')
                  }
                </span>
                <span className="ml-1">total profit</span>
              </div>
              <div>
                <span className="text-red-600 font-medium">
                  {worstPairs.length > 0 &&
                    formatChartValue(Math.abs(worstPairs.reduce((sum, pair) => sum + pair.totalPnL, 0)), 'currency')
                  }
                </span>
                <span className="ml-1">total loss</span>
              </div>
            </div>
          </div>
        )}

        {/* Click hint */}
        {onPairClick && data.length > 1 && (
          <div className="text-center text-xs text-gray-400">
            Click on any currency pair to filter dashboard
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrencyPairBreakdown;
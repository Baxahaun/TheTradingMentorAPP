/**
 * Example component showing how to use the TradeChart with markers
 */

import React from 'react';
import TradeChart from '../charts/TradeChart';
import { Trade } from '../../types/trade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const TradeChartExample: React.FC = () => {
  // Example trade data
  const exampleTrade: Trade = {
    id: 'example-trade-1',
    accountId: 'demo-account',
    currencyPair: 'EUR/USD',
    date: '2024-01-15',
    timeIn: '09:30',
    timeOut: '14:45',
    timestamp: new Date('2024-01-15T09:30:00Z').getTime(),
    side: 'long',
    entryPrice: 1.0850,
    exitPrice: 1.0920,
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    lotSize: 1.0,
    lotType: 'standard',
    units: 100000,
    pips: 70,
    pipValue: 10,
    pnl: 700,
    commission: 7,
    accountCurrency: 'USD',
    strategy: 'Trend Following',
    status: 'closed',
    confidence: 8,
    notes: 'Strong bullish momentum after ECB announcement',
    rMultiple: 1.4,
    leverage: 50,
    marginUsed: 2170,
    session: 'european',
    timeframe: '1H',
    marketConditions: 'Trending up after news',
    emotions: 'Confident, patient'
  };

  const openTrade: Trade = {
    ...exampleTrade,
    id: 'example-trade-2',
    exitPrice: undefined,
    timeOut: undefined,
    pips: undefined,
    pnl: undefined,
    status: 'open',
    currencyPair: 'GBP/USD',
    side: 'short',
    entryPrice: 1.2650,
    stopLoss: 1.2700,
    takeProfit: 1.2550,
    notes: 'Bearish reversal pattern at resistance level'
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Trading Chart Examples
        </h1>
        <p className="text-gray-600">
          Interactive charts showing trade entry and exit points with markers
        </p>
      </div>

      {/* Closed Trade Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Closed Trade - EUR/USD Long
            <span className="text-sm font-normal text-green-600">
              +70 pips (+$700)
            </span>
          </CardTitle>
          <CardDescription>
            Example of a completed trade with entry, exit, stop loss, and take profit markers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradeChart
            trade={exampleTrade}
            height={400}
            preferredChart="lightweight"
          />
        </CardContent>
      </Card>

      {/* Open Trade Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Open Trade - GBP/USD Short
            <span className="text-sm font-normal text-blue-600">
              Currently Open
            </span>
          </CardTitle>
          <CardDescription>
            Example of an active trade showing entry point and risk management levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradeChart
            trade={openTrade}
            height={400}
            preferredChart="lightweight"
          />
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Features</CardTitle>
          <CardDescription>
            Key features of the trading chart component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Visual Markers</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Entry points with directional arrows</li>
                <li>• Exit points with profit/loss indication</li>
                <li>• Stop loss and take profit levels</li>
                <li>• Price lines for key levels</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Interactive Controls</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multiple chart types (TradingView, Lightweight)</li>
                <li>• Timeframe selection</li>
                <li>• Show/hide markers toggle</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Trade Information</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time P&L calculation</li>
                <li>• Pip count and value</li>
                <li>• Risk-reward ratio</li>
                <li>• Trade duration</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Performance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Optimized rendering</li>
                <li>• Fallback chart options</li>
                <li>• Mobile responsive</li>
                <li>• Fast loading</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
          <CardDescription>
            How to integrate the chart component in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-800 overflow-x-auto">
{`import TradeChart from './components/charts/TradeChart';
import { Trade } from './types/trade';

// Your trade data
const trade: Trade = {
  // ... trade properties
};

// Use the component
<TradeChart
  trade={trade}
  height={500}
  preferredChart="lightweight"
/>`}
            </pre>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">Pro Tips:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use "lightweight" chart for better performance with many trades</li>
              <li>• Use "tradingview" chart for advanced analysis features</li>
              <li>• The component automatically falls back to lightweight charts if TradingView is unavailable</li>
              <li>• Markers are automatically generated from trade data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeChartExample;
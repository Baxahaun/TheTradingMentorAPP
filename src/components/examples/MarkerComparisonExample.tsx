/**
 * Visual comparison between embedded and overlay markers
 */

import React, { useState } from 'react';
import TradingViewChartWithMarkers from '../charts/TradingViewChartWithMarkers';
import TradingViewChart from '../trade-review/TradingViewChart';
import { Trade } from '../../types/trade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CheckCircle, AlertCircle, Zap, Target } from 'lucide-react';

const MarkerComparisonExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('embedded');

  const exampleTrade: Trade = {
    id: 'comparison-trade',
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
    notes: 'Demonstrating embedded vs overlay markers'
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Marker Implementation Comparison
        </h1>
        <p className="text-gray-600">
          Embedded vs Overlay approaches for displaying trade markers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="embedded" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Embedded Markers</span>
          </TabsTrigger>
          <TabsTrigger value="overlay" className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Overlay Markers</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="embedded" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Lightweight Charts - Embedded Markers</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Recommended
                </Badge>
              </CardTitle>
              <CardDescription>
                Markers are embedded directly into the chart series using lightweight-charts library
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradingViewChartWithMarkers
                trade={exampleTrade}
                height={400}
                showControls={true}
              />
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-700 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Advantages
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Native Integration:</strong> Markers are part of the chart</li>
                    <li>• <strong>Perfect Alignment:</strong> Precise positioning with price data</li>
                    <li>• <strong>Zoom & Pan:</strong> Markers move with chart navigation</li>
                    <li>• <strong>Performance:</strong> Hardware-accelerated rendering</li>
                    <li>• <strong>Offline Support:</strong> Works without internet</li>
                    <li>• <strong>Customizable:</strong> Full control over appearance</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Technical Details
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Uses <code>candlestickSeries.setMarkers()</code></li>
                    <li>• Price lines via <code>createPriceLine()</code></li>
                    <li>• Markers have time and price coordinates</li>
                    <li>• Supports shapes: arrows, circles, squares</li>
                    <li>• Custom colors and text labels</li>
                    <li>• Responsive to chart interactions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overlay" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span>TradingView Widget - Overlay Markers</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Limited
                </Badge>
              </CardTitle>
              <CardDescription>
                Markers are overlaid on top of TradingView widget (when API allows)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradingViewChart
                trade={exampleTrade}
                className="rounded-lg"
              />
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-700 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Limitations
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>API Restrictions:</strong> Limited marker capabilities</li>
                    <li>• <strong>Overlay Only:</strong> Markers float on top of chart</li>
                    <li>• <strong>Alignment Issues:</strong> May not align perfectly</li>
                    <li>• <strong>Internet Required:</strong> Widget needs connection</li>
                    <li>• <strong>Version Dependent:</strong> Different APIs across versions</li>
                    <li>• <strong>Limited Control:</strong> Restricted customization</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-700 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    When to Use
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Need real-time market data</li>
                    <li>• Professional trading platform</li>
                    <li>• Advanced charting tools required</li>
                    <li>• TradingView branding acceptable</li>
                    <li>• Internet connection guaranteed</li>
                    <li>• Markers are secondary feature</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Code</CardTitle>
          <CardDescription>
            How markers are implemented in each approach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="embedded-code" className="w-full">
            <TabsList>
              <TabsTrigger value="embedded-code">Embedded (Lightweight)</TabsTrigger>
              <TabsTrigger value="overlay-code">Overlay (TradingView)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="embedded-code">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Embedded Markers Implementation</h4>
                <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Create chart and series
const chart = createChart(container, options);
const candlestickSeries = chart.addCandlestickSeries();

// Set price data
candlestickSeries.setData(priceData);

// EMBEDDED: Add markers directly to series
const markers = [
  {
    time: entryTimestamp,
    position: 'belowBar',
    color: '#10b981',
    shape: 'arrowUp',
    text: 'Entry: 1.0850'
  }
];
candlestickSeries.setMarkers(markers);

// EMBEDDED: Add price lines
candlestickSeries.createPriceLine({
  price: 1.0800,
  color: '#ef4444',
  lineStyle: 2, // Dashed
  title: 'Stop Loss'
});`}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="overlay-code">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Overlay Markers Implementation</h4>
                <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Create TradingView widget
const widget = new TradingView.widget({
  container_id: 'chart-container',
  symbol: 'FX:EURUSD',
  // ... other options
});

// Wait for chart to be ready
widget.onChartReady(() => {
  const chart = widget.chart();
  
  // OVERLAY: Try to add markers (limited API)
  if (chart.getAllSeries) {
    const mainSeries = chart.getAllSeries()[0];
    if (mainSeries.setMarkers) {
      mainSeries.setMarkers(markers); // May not work
    }
  }
  
  // OVERLAY: Try to add shapes (limited)
  if (chart.createShape) {
    chart.createShape(
      { time: timestamp, price: entryPrice },
      { shape: 'arrow_up', color: '#10b981' }
    );
  }
});`}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            <strong>Use Embedded Markers (Lightweight Charts)</strong> for the best user experience:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800">Precise</h4>
              <p className="text-sm text-green-600">Perfect alignment with price data</p>
            </div>
            <div className="text-center">
              <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800">Fast</h4>
              <p className="text-sm text-green-600">Hardware-accelerated rendering</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800">Reliable</h4>
              <p className="text-sm text-green-600">Works offline, consistent API</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkerComparisonExample;
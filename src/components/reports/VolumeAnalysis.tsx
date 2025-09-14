import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeContext } from '@/contexts/TradeContext';
import { calculateVolumeMetrics, VolumeAnalysisData } from '@/utils/reportUtils';

export const VolumeAnalysis: React.FC = () => {
  const { trades } = useTradeContext();

  // Filter for closed trades only and calculate volume metrics
  const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.pnl !== undefined);
  const volumeData = calculateVolumeMetrics(closedTrades);

  // Create histogram data for lot size distribution
  const createHistogramData = () => {
    if (closedTrades.length === 0) return [];

    const lotSizes = closedTrades
      .map(trade => trade.lotSize || 0)
      .filter(size => size > 0);

    if (lotSizes.length === 0) return [];

    // Create bins for histogram
    const minSize = Math.min(...lotSizes);
    const maxSize = Math.max(...lotSizes);
    const binCount = Math.min(10, Math.ceil(Math.sqrt(lotSizes.length))); // Sturges' rule approximation
    const binWidth = (maxSize - minSize) / binCount;

    const bins: Array<{ range: string; count: number; min: number; max: number }> = [];

    for (let i = 0; i < binCount; i++) {
      const binMin = minSize + (i * binWidth);
      const binMax = i === binCount - 1 ? maxSize : minSize + ((i + 1) * binWidth);
      const count = lotSizes.filter(size => size >= binMin && size < binMax).length;

      if (count > 0) {
        bins.push({
          range: `${binMin.toFixed(2)}-${binMax.toFixed(2)}`,
          count,
          min: binMin,
          max: binMax
        });
      }
    }

    return bins;
  };

  const histogramData = createHistogramData();

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  // Custom tooltip for the histogram
  const HistogramTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">Lot Size: {label}</p>
          <p className="text-blue-600">
            Trades: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  if (closedTrades.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No volume data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(volumeData.averageLotSize)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Average Lot Size</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(volumeData.maxLotSize)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Maximum Lot Size</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(volumeData.totalVolume)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Volume</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {volumeData.totalTrades}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Trades</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volume Distribution Histogram */}
      <Card>
        <CardHeader>
          <CardTitle>Lot Size Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {histogramData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="range"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip content={<HistogramTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No lot size data available for histogram</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Volume Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Volume Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Position Sizing Consistency</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lot Size Range</span>
                  <span className="text-sm font-medium">
                    {formatNumber(volumeData.minLotSize)} - {formatNumber(volumeData.maxLotSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Standard Deviation</span>
                  <span className="text-sm font-medium">
                    {(() => {
                      const lotSizes = closedTrades
                        .map(trade => trade.lotSize || 0)
                        .filter(size => size > 0);

                      if (lotSizes.length <= 1) return '0.00';

                      const mean = lotSizes.reduce((sum, size) => sum + size, 0) / lotSizes.length;
                      const variance = lotSizes.reduce((sum, size) => sum + Math.pow(size - mean, 2), 0) / lotSizes.length;
                      return Math.sqrt(variance).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Trading Volume Trends</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trades with Lot Size</span>
                  <span className="text-sm font-medium">
                    {closedTrades.filter(trade => (trade.lotSize || 0) > 0).length} / {closedTrades.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Volume per Trade</span>
                  <span className="text-sm font-medium">
                    {volumeData.totalTrades > 0 ? formatNumber(volumeData.totalVolume / volumeData.totalTrades) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
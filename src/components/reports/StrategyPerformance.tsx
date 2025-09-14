import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeContext } from '@/contexts/TradeContext';
import { calculateStrategyPerformance, StrategyPerformanceData } from '@/utils/reportUtils';
import { CURRENT_TERMINOLOGY } from '@/lib/terminologyConfig';

export const StrategyPerformance: React.FC = () => {
  const { trades } = useTradeContext();

  // Filter for closed trades only
  const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.pnl !== undefined);
  const performanceData = calculateStrategyPerformance(closedTrades);

  // Prepare data for the bar chart
  const chartData = performanceData.map(item => ({
    strategy: item.strategy.length > 15 ? item.strategy.substring(0, 15) + '...' : item.strategy,
    pnl: item.totalPnL,
    fullStrategyName: item.strategy
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.fullStrategyName}</p>
          <p className="text-blue-600">
            {CURRENT_TERMINOLOGY.profitLossLabel}: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (performanceData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No strategy data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{CURRENT_TERMINOLOGY.profitLossLabel} by Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="strategy"
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="pnl"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strategy</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                  <TableHead className="text-right">Avg R-Multiple</TableHead>
                  <TableHead className="text-right">Total Trades</TableHead>
                  <TableHead className="text-right">Total {CURRENT_TERMINOLOGY.profitLossLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((item: StrategyPerformanceData) => (
                  <TableRow key={item.strategy}>
                    <TableCell className="font-medium">{item.strategy}</TableCell>
                    <TableCell className="text-right">{formatPercentage(item.winRate)}</TableCell>
                    <TableCell className="text-right">{item.averageRMultiple.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.totalTrades}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.totalPnL)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
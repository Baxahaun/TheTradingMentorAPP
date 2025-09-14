import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeContext } from '@/contexts/TradeContext';
import { analyzeTradingTimes, TimeAnalysisData } from '@/utils/reportUtils';

export const TimeAnalysis: React.FC = () => {
  const { trades } = useTradeContext();
  const [viewMode, setViewMode] = useState<'session' | 'hour'>('session');

  // Filter for closed trades only
  const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.pnl !== undefined);
  const timeData = analyzeTradingTimes(closedTrades);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Prepare data for session view
  const sessionChartData = timeData.map(item => ({
    session: item.session,
    pnl: item.totalPnL,
    winRate: item.winRate,
    trades: item.totalTrades
  }));

  // Prepare data for hourly view (simplified - would need trade time data)
  const hourlyChartData = [
    { hour: '00:00', pnl: 0, trades: 0 },
    { hour: '04:00', pnl: 0, trades: 0 },
    { hour: '08:00', pnl: 0, trades: 0 },
    { hour: '12:00', pnl: 0, trades: 0 },
    { hour: '16:00', pnl: 0, trades: 0 },
    { hour: '20:00', pnl: 0, trades: 0 }
  ];

  // Custom tooltip for the chart
  const SessionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label} Session</p>
          <p className="text-blue-600">
            P&L: {formatCurrency(data.pnl)}
          </p>
          <p className="text-green-600">
            Win Rate: {formatPercentage(data.winRate)}
          </p>
          <p className="text-gray-600">
            Trades: {data.trades}
          </p>
        </div>
      );
    }
    return null;
  };

  const HourTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            P&L: {formatCurrency(data.pnl)}
          </p>
          <p className="text-gray-600">
            Trades: {data.trades}
          </p>
        </div>
      );
    }
    return null;
  };

  if (timeData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No time-based trading data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance by Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'session' | 'hour')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="session">By Session</TabsTrigger>
              <TabsTrigger value="hour">By Hour</TabsTrigger>
            </TabsList>

            <TabsContent value="session" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance by Trading Session</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="session" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip content={<SessionTooltip />} />
                      <Bar
                        dataKey="pnl"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Session Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {timeData.slice(0, 3).map((item: TimeAnalysisData) => (
                    <div key={item.session} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <h4 className="font-medium text-gray-900">{item.session}</h4>
                        <p className={`text-2xl font-bold mt-2 ${
                          item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(item.totalPnL)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatPercentage(item.winRate)} win rate
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.totalTrades} trades
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hour" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance by Hour of Day</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip content={<HourTooltip />} />
                      <Bar
                        dataKey="pnl"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-center text-gray-500 mt-4">
                  <p>Hourly data will be available once more trades with time information are recorded.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
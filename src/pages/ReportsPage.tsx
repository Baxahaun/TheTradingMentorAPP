import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, Filter } from 'lucide-react';
import { useTradeContext } from '@/contexts/TradeContext';
import ReportWidget from '@/components/reports/ReportWidget';
import { getAllReportIds } from '@/config/reports';
import { filterTradesByDateRange } from '@/utils/reportUtils';

const ReportsPage: React.FC = () => {
  const { trades } = useTradeContext();
  const [dateRange, setDateRangeState] = useState<{ from?: Date; to?: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date()
  });

  // Filter trades based on date range
  const filteredTrades = useMemo(() => {
    return filterTradesByDateRange(trades, dateRange.from, dateRange.to);
  }, [trades, dateRange]);

  const hasTrades = trades && trades.length > 0;
  const hasFilteredTrades = filteredTrades && filteredTrades.length > 0;

  if (!hasTrades) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trading Performance Reports</h1>
          <p className="text-gray-600 mt-1">Deep analysis of your trading performance</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              No Trading Data Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Complete some trades to unlock powerful analytics. You'll get detailed insights into your win rates,
              profit factors, risk metrics, and performance trends to help optimize your trading strategy.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preset date ranges
  const applyDateRange = (days: number) => {
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setDateRangeState({ from, to });
  };

  const clearDateRange = () => {
    setDateRangeState({ from: undefined, to: undefined });
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function to check if a date range is active
  const isDateRangeActive = (days: number) => {
    if (!dateRange.from) return false;
    const expectedFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return dateRange.from.getTime() === expectedFrom.getTime();
  };

  return (
    <div className="space-y-6">
      {/* Header with title and date filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trading Performance Reports</h1>
          <p className="text-gray-600 mt-1">Get deep insights into your trading performance</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex gap-1">
            <Button
              variant={isDateRangeActive(7) ? "default" : "outline"}
              size="sm"
              onClick={() => applyDateRange(7)}
              className="transition-all duration-200"
            >
              7D
            </Button>
            <Button
              variant={isDateRangeActive(30) ? "default" : "outline"}
              size="sm"
              onClick={() => applyDateRange(30)}
              className="transition-all duration-200"
            >
              30D
            </Button>
            <Button
              variant={isDateRangeActive(90) ? "default" : "outline"}
              size="sm"
              onClick={() => applyDateRange(90)}
              className="transition-all duration-200"
            >
              90D
            </Button>
            <Button
              variant={!dateRange.from && !dateRange.to ? "default" : "outline"}
              size="sm"
              onClick={clearDateRange}
              className="transition-all duration-200"
            >
              All
            </Button>
          </div>
        </div>
      </div>

      {/* Current date range display */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="font-medium">
            {dateRange.from && dateRange.to
              ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
              : 'All time'
            }
          </span>
        </div>
        {hasFilteredTrades && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-600">
              {filteredTrades.length} trades analyzed
            </span>
          </div>
        )}
      </div>

      {/* Report Widgets Grid */}
      {hasFilteredTrades ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {getAllReportIds().map((reportId) => (
            <ReportWidget key={reportId} reportId={reportId} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data for Selected Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              No trades found for the selected date range. Try adjusting the date filter to see your performance data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
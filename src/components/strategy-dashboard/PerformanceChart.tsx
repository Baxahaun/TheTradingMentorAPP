/**
 * Performance Chart - Optimized chart component for strategy performance visualization
 */

import React, { useMemo } from 'react';
import { MonthlyReturn } from '../../types/strategy';
import { performanceMonitor } from '../../services/PerformanceMonitoringService';

interface PerformanceChartProps {
  monthlyReturns: MonthlyReturn[];
  strategyId: string;
  height?: number;
}

export function PerformanceChart({ 
  monthlyReturns, 
  strategyId, 
  height = 300 
}: PerformanceChartProps) {
  // Memoize chart data processing
  const chartData = useMemo(() => {
    return performanceMonitor.measureExecutionTime(
      `chart-data-processing-${strategyId}`,
      () => {
        if (monthlyReturns.length === 0) return null;

        // Calculate cumulative returns
        let cumulativeReturn = 0;
        const processedData = monthlyReturns.map((monthData, index) => {
          cumulativeReturn += monthData.return;
          return {
            month: monthData.month,
            monthlyReturn: monthData.return,
            cumulativeReturn,
            winRate: monthData.winRate,
            trades: monthData.trades,
            profitFactor: monthData.profitFactor || 0
          };
        });

        // Calculate chart dimensions and scales
        const maxReturn = Math.max(...processedData.map(d => d.cumulativeReturn));
        const minReturn = Math.min(...processedData.map(d => d.cumulativeReturn));
        const range = maxReturn - minReturn;
        const padding = range * 0.1;

        return {
          data: processedData,
          maxReturn: maxReturn + padding,
          minReturn: minReturn - padding,
          range: range + (padding * 2)
        };
      },
      'calculation'
    );
  }, [monthlyReturns, strategyId]);

  // Memoize SVG path generation
  const chartPath = useMemo(() => {
    if (!chartData) return '';

    const { data, maxReturn, minReturn, range } = chartData;
    const width = 800;
    const chartHeight = height - 60; // Account for margins

    return data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = chartHeight - ((point.cumulativeReturn - minReturn) / range) * chartHeight;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }, [chartData, height]);

  if (!chartData) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <span className="text-gray-500">No performance data available</span>
      </div>
    );
  }

  const { data, maxReturn, minReturn } = chartData;

  return (
    <div className="performance-chart bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
      
      <div className="relative">
        <svg 
          width="100%" 
          height={height}
          viewBox={`0 0 800 ${height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="80" height="30" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 30" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="800" height={height - 60} fill="url(#grid)" />
          
          {/* Zero line */}
          <line 
            x1="0" 
            y1={height - 60 - ((-minReturn) / (maxReturn - minReturn)) * (height - 60)}
            x2="800" 
            y2={height - 60 - ((-minReturn) / (maxReturn - minReturn)) * (height - 60)}
            stroke="#666" 
            strokeWidth="1" 
            strokeDasharray="5,5"
          />
          
          {/* Performance line */}
          <path
            d={chartPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 800;
            const y = (height - 60) - ((point.cumulativeReturn - minReturn) / (maxReturn - minReturn)) * (height - 60);
            
            return (
              <g key={point.month}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={point.monthlyReturn >= 0 ? "#10b981" : "#ef4444"}
                  className="hover:r-6 transition-all cursor-pointer"
                />
                
                {/* Tooltip on hover */}
                <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <rect
                    x={x - 60}
                    y={y - 80}
                    width="120"
                    height="70"
                    fill="rgba(0,0,0,0.8)"
                    rx="4"
                  />
                  <text x={x} y={y - 55} textAnchor="middle" fill="white" fontSize="12">
                    {point.month}
                  </text>
                  <text x={x} y={y - 40} textAnchor="middle" fill="white" fontSize="10">
                    Monthly: {point.monthlyReturn.toFixed(2)}
                  </text>
                  <text x={x} y={y - 28} textAnchor="middle" fill="white" fontSize="10">
                    Cumulative: {point.cumulativeReturn.toFixed(2)}
                  </text>
                  <text x={x} y={y - 16} textAnchor="middle" fill="white" fontSize="10">
                    {point.trades} trades ({point.winRate.toFixed(1)}% WR)
                  </text>
                </g>
              </g>
            );
          })}
          
          {/* Y-axis labels */}
          <g>
            <text x="-10" y="15" textAnchor="end" fontSize="12" fill="#666">
              {maxReturn.toFixed(0)}
            </text>
            <text x="-10" y={height - 45} textAnchor="end" fontSize="12" fill="#666">
              {minReturn.toFixed(0)}
            </text>
          </g>
          
          {/* X-axis labels */}
          <g>
            {data.length > 0 && (
              <>
                <text x="0" y={height - 10} textAnchor="start" fontSize="12" fill="#666">
                  {data[0].month}
                </text>
                <text x="800" y={height - 10} textAnchor="end" fontSize="12" fill="#666">
                  {data[data.length - 1].month}
                </text>
              </>
            )}
          </g>
        </svg>
      </div>
      
      {/* Performance Summary */}
      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Total Return:</span>
          <span className={`ml-2 font-semibold ${
            data[data.length - 1].cumulativeReturn >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {data[data.length - 1].cumulativeReturn.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Best Month:</span>
          <span className="ml-2 font-semibold text-green-600">
            {Math.max(...data.map(d => d.monthlyReturn)).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Worst Month:</span>
          <span className="ml-2 font-semibold text-red-600">
            {Math.min(...data.map(d => d.monthlyReturn)).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Avg Monthly:</span>
          <span className="ml-2 font-semibold">
            {(data.reduce((sum, d) => sum + d.monthlyReturn, 0) / data.length).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PerformanceChart;
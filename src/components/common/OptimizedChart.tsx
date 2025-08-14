import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsCache } from '../../lib/cacheService';

// Chart data interfaces
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
  type?: 'line' | 'bar' | 'area';
}

// Chart configuration
interface ChartConfig {
  enableAnimation: boolean;
  animationDuration: number;
  enableTooltip: boolean;
  enableLegend: boolean;
  enableGrid: boolean;
  responsive: boolean;
  throttleResize: number;
}

// Default chart configuration
const DEFAULT_CHART_CONFIG: ChartConfig = {
  enableAnimation: true,
  animationDuration: 300,
  enableTooltip: true,
  enableLegend: true,
  enableGrid: true,
  responsive: true,
  throttleResize: 100,
};

// Performance optimization hook
const useChartOptimization = (
  data: ChartDataPoint[],
  config: ChartConfig,
  dependencies: any[] = []
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(config.enableAnimation);
  const chartRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  // Intersection observer for visibility
  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && config.enableAnimation) {
          setShouldAnimate(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [config.enableAnimation]);

  // Throttled resize handling
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = setTimeout(() => {
        // Force chart re-render on resize
        setIsVisible(false);
        setTimeout(() => setIsVisible(true), 10);
      }, config.throttleResize);
    };

    if (config.responsive) {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
      };
    }
  }, [config.responsive, config.throttleResize]);

  // Memoize processed data
  const processedData = useMemo(() => {
    if (!isVisible) return [];
    
    // Cache key for processed data
    const cacheKey = `chart_data_${JSON.stringify(data).substring(0, 50)}_${dependencies.join('_')}`;
    
    return analyticsCache.getOrCompute(
      cacheKey,
      () => {
        // Data processing logic here
        return data.map(point => ({
          ...point,
          // Add any data transformations
        }));
      },
      ['chart_data']
    );
  }, [data, isVisible, dependencies]);

  return {
    chartRef,
    isVisible,
    shouldAnimate,
    processedData,
  };
};

// Optimized Line Chart
interface OptimizedLineChartProps {
  data: ChartDataPoint[];
  series: ChartSeries[];
  width?: number;
  height?: number;
  config?: Partial<ChartConfig>;
  className?: string;
  onDataPointClick?: (data: ChartDataPoint, index: number) => void;
}

export const OptimizedLineChart: React.FC<OptimizedLineChartProps> = ({
  data,
  series,
  width,
  height = 300,
  config = {},
  className = '',
  onDataPointClick,
}) => {
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...config };
  const { chartRef, isVisible, shouldAnimate, processedData } = useChartOptimization(
    data,
    chartConfig,
    [series]
  );

  const handleClick = useCallback((data: any, index: number) => {
    onDataPointClick?.(data, index);
  }, [onDataPointClick]);

  if (!isVisible) {
    return (
      <div 
        ref={chartRef} 
        className={`${className} animate-pulse bg-gray-200 rounded`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div ref={chartRef} className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData} onClick={handleClick}>
          {chartConfig.enableGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          )}
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          {chartConfig.enableTooltip && (
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          )}
          {chartConfig.enableLegend && <Legend />}
          {series.map((s, index) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              stroke={s.color}
              name={s.name}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={shouldAnimate ? chartConfig.animationDuration : 0}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Optimized Bar Chart
interface OptimizedBarChartProps {
  data: ChartDataPoint[];
  series: ChartSeries[];
  width?: number;
  height?: number;
  config?: Partial<ChartConfig>;
  className?: string;
  onBarClick?: (data: ChartDataPoint, index: number) => void;
}

export const OptimizedBarChart: React.FC<OptimizedBarChartProps> = ({
  data,
  series,
  width,
  height = 300,
  config = {},
  className = '',
  onBarClick,
}) => {
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...config };
  const { chartRef, isVisible, shouldAnimate, processedData } = useChartOptimization(
    data,
    chartConfig,
    [series]
  );

  const handleClick = useCallback((data: any, index: number) => {
    onBarClick?.(data, index);
  }, [onBarClick]);

  if (!isVisible) {
    return (
      <div 
        ref={chartRef} 
        className={`${className} animate-pulse bg-gray-200 rounded`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div ref={chartRef} className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData} onClick={handleClick}>
          {chartConfig.enableGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          )}
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          {chartConfig.enableTooltip && (
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          )}
          {chartConfig.enableLegend && <Legend />}
          {series.map((s, index) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              fill={s.color}
              name={s.name}
              animationDuration={shouldAnimate ? chartConfig.animationDuration : 0}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Optimized Pie Chart
interface OptimizedPieChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  config?: Partial<ChartConfig>;
  className?: string;
  colors?: string[];
  onSliceClick?: (data: ChartDataPoint, index: number) => void;
}

export const OptimizedPieChart: React.FC<OptimizedPieChartProps> = ({
  data,
  width,
  height = 300,
  config = {},
  className = '',
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'],
  onSliceClick,
}) => {
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...config };
  const { chartRef, isVisible, shouldAnimate, processedData } = useChartOptimization(
    data,
    chartConfig
  );

  const handleClick = useCallback((data: any, index: number) => {
    onSliceClick?.(data, index);
  }, [onSliceClick]);

  if (!isVisible) {
    return (
      <div 
        ref={chartRef} 
        className={`${className} animate-pulse bg-gray-200 rounded-full`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div ref={chartRef} className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            outerRadius={Math.min(width || 300, height) * 0.35}
            fill="#8884d8"
            dataKey="value"
            animationDuration={shouldAnimate ? chartConfig.animationDuration : 0}
            onClick={handleClick}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          {chartConfig.enableTooltip && (
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          )}
          {chartConfig.enableLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Chart performance wrapper
export const withChartOptimization = <P extends object>(
  ChartComponent: React.ComponentType<P>
) => {
  return React.memo(
    React.forwardRef<any, P & { optimizationKey?: string }>((props, ref) => {
      const { optimizationKey, ...chartProps } = props;
      
      return (
        <ChartComponent 
          {...(chartProps as P)} 
          ref={ref}
        />
      );
    })
  );
};
import React, { useRef, useEffect } from 'react';
import { useScreenReader } from '../../hooks/useAccessibility';

interface DataPoint {
  label: string;
  value: number;
  description?: string;
}

interface AccessibleChartProps {
  data: DataPoint[];
  title: string;
  type: 'line' | 'bar' | 'pie';
  className?: string;
  children: React.ReactNode; // The actual chart component
}

/**
 * Wrapper component that adds accessibility features to charts
 */
export function AccessibleChart({ 
  data, 
  title, 
  type, 
  className = '', 
  children 
}: AccessibleChartProps) {
  const { announce } = useScreenReader();
  const chartRef = useRef<HTMLDivElement>(null);

  // Generate accessible description
  const generateDescription = () => {
    const totalPoints = data.length;
    const minValue = Math.min(...data.map(d => d.value));
    const maxValue = Math.max(...data.map(d => d.value));
    const avgValue = data.reduce((sum, d) => sum + d.value, 0) / totalPoints;

    return `${type} chart titled "${title}" with ${totalPoints} data points. ` +
           `Values range from ${minValue.toFixed(2)} to ${maxValue.toFixed(2)}, ` +
           `with an average of ${avgValue.toFixed(2)}.`;
  };

  // Generate data table for screen readers
  const generateDataTable = () => (
    <table className="sr-only" aria-label={`Data for ${title}`}>
      <caption>{title} - Data Table</caption>
      <thead>
        <tr>
          <th scope="col">Label</th>
          <th scope="col">Value</th>
          {data.some(d => d.description) && <th scope="col">Description</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((point, index) => (
          <tr key={index}>
            <td>{point.label}</td>
            <td>{point.value}</td>
            {point.description && <td>{point.description}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!chartRef.current?.contains(event.target as Node)) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          announce(generateDescription());
          break;
        case 'i':
        case 'I':
          event.preventDefault();
          const summary = `Chart summary: ${generateDescription()}`;
          announce(summary, 'assertive');
          break;
        case 'd':
        case 'D':
          event.preventDefault();
          const details = data.map(point => 
            `${point.label}: ${point.value}${point.description ? ` - ${point.description}` : ''}`
          ).join('. ');
          announce(`Detailed data: ${details}`, 'assertive');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data, title, announce]);

  return (
    <div 
      ref={chartRef}
      className={`accessible-chart ${className}`}
      role="img"
      aria-label={generateDescription()}
      tabIndex={0}
    >
      {/* Visual chart */}
      <div aria-hidden="true">
        {children}
      </div>

      {/* Screen reader accessible data table */}
      {generateDataTable()}

      {/* Instructions for screen reader users */}
      <div className="sr-only">
        <p>
          Chart navigation instructions: Press Enter or Space to hear chart summary. 
          Press 'i' for detailed information. Press 'd' for data values.
        </p>
      </div>
    </div>
  );
}

/**
 * Accessible performance indicator component
 */
interface AccessiblePerformanceIndicatorProps {
  label: string;
  value: number;
  previousValue?: number;
  format?: 'percentage' | 'currency' | 'number';
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function AccessiblePerformanceIndicator({
  label,
  value,
  previousValue,
  format = 'number',
  trend,
  className = ''
}: AccessiblePerformanceIndicatorProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendDescription = () => {
    if (!previousValue || !trend) return '';
    
    const change = value - previousValue;
    const changePercent = ((change / previousValue) * 100).toFixed(1);
    
    switch (trend) {
      case 'up':
        return `increased by ${Math.abs(change).toLocaleString()} (${changePercent}%)`;
      case 'down':
        return `decreased by ${Math.abs(change).toLocaleString()} (${changePercent}%)`;
      default:
        return 'remained stable';
    }
  };

  const ariaLabel = `${label}: ${formatValue(value)}${
    previousValue ? `. ${getTrendDescription()} from previous value of ${formatValue(previousValue)}` : ''
  }`;

  return (
    <div 
      className={`performance-indicator ${className}`}
      role="status"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className="indicator-label" id={`label-${label.replace(/\s+/g, '-')}`}>
        {label}
      </div>
      <div 
        className="indicator-value"
        aria-describedby={`label-${label.replace(/\s+/g, '-')}`}
      >
        {formatValue(value)}
        {trend && (
          <span 
            className={`trend-indicator trend-${trend}`}
            aria-label={getTrendDescription()}
          >
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}
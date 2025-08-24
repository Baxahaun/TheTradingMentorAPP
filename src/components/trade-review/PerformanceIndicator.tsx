/**
 * Performance Indicator Component
 * Reusable component for displaying performance metrics with visual indicators
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceIndicatorProps {
  label: string;
  value: number;
  format?: 'number' | 'percentage' | 'currency' | 'ratio' | 'duration';
  thresholds?: {
    excellent: number;
    good: number;
    poor?: number;
  };
  showTrend?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  label,
  value,
  format = 'number',
  thresholds,
  showTrend = false,
  showProgress = false,
  size = 'md',
  className = ''
}) => {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
      case 'currency':
        return `$${val.toFixed(2)}`;
      case 'ratio':
        return `1:${val.toFixed(1)}`;
      case 'duration':
        if (val < 1) return `${Math.round(val * 60)}m`;
        if (val < 24) return `${Math.round(val)}h`;
        const days = Math.floor(val / 24);
        const hours = Math.round(val % 24);
        return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
      default:
        return val.toFixed(2);
    }
  };

  const getPerformanceLevel = (): 'excellent' | 'good' | 'poor' | 'neutral' => {
    if (!thresholds) return 'neutral';
    
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (thresholds.poor !== undefined && value <= thresholds.poor) return 'poor';
    return 'neutral';
  };

  const getColorClasses = (level: string) => {
    switch (level) {
      case 'excellent':
        return {
          text: 'text-green-600',
          badge: 'bg-green-100 text-green-800',
          progress: 'bg-green-500'
        };
      case 'good':
        return {
          text: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
          progress: 'bg-yellow-500'
        };
      case 'poor':
        return {
          text: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
          progress: 'bg-red-500'
        };
      default:
        return {
          text: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800',
          progress: 'bg-gray-500'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-3',
          value: 'text-lg',
          label: 'text-xs'
        };
      case 'lg':
        return {
          container: 'p-6',
          value: 'text-3xl',
          label: 'text-base'
        };
      default:
        return {
          container: 'p-4',
          value: 'text-2xl',
          label: 'text-sm'
        };
    }
  };

  const performanceLevel = getPerformanceLevel();
  const colors = getColorClasses(performanceLevel);
  const sizes = getSizeClasses();

  const getTrendIcon = () => {
    if (!showTrend) return null;
    
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getProgressValue = (): number => {
    if (!showProgress || !thresholds) return 0;
    
    // Calculate progress as percentage towards excellent threshold
    const maxValue = thresholds.excellent * 1.2; // 20% above excellent for full bar
    return Math.min(100, Math.max(0, (value / maxValue) * 100));
  };

  const getBadgeText = (): string => {
    switch (performanceLevel) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'poor':
        return 'Poor';
      default:
        return 'Average';
    }
  };

  return (
    <div className={`text-center border rounded-lg ${sizes.container} ${className}`}>
      {/* Label with trend icon */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {getTrendIcon()}
        <span className={`font-medium text-gray-600 ${sizes.label}`}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div className={`font-bold ${colors.text} ${sizes.value}`}>
        {formatValue(value)}
      </div>

      {/* Performance badge */}
      {thresholds && (
        <div className="mt-2">
          <Badge className={colors.badge}>
            {getBadgeText()}
          </Badge>
        </div>
      )}

      {/* Progress bar */}
      {showProgress && thresholds && (
        <div className="mt-3">
          <Progress 
            value={getProgressValue()} 
            className="h-2"
          />
          <div className="text-xs text-gray-500 mt-1">
            Target: {formatValue(thresholds.excellent)}
          </div>
        </div>
      )}
    </div>
  );
};
/**
 * Performance Analytics - Heavy analytics component with lazy loading
 */

import React, { useMemo } from 'react';
import { ProfessionalStrategy } from '../../types/strategy';
import { performanceMonitor } from '../../services/PerformanceMonitoringService';

interface PerformanceAnalyticsProps {
  strategy: ProfessionalStrategy;
}

export function PerformanceAnalytics({ strategy }: PerformanceAnalyticsProps) {
  // Memoize expensive analytics calculations
  const analytics = useMemo(() => {
    return performanceMonitor.measureExecutionTime(
      `analytics-calculation-${strategy.id}`,
      () => {
        const { performance } = strategy;
        
        // Calculate advanced metrics
        const calmarRatio = performance.maxDrawdown > 0 
          ? (performance.expectancy * 252) / performance.maxDrawdown 
          : 0;
        
        const recoveryFactor = performance.maxDrawdown > 0
          ? (performance.expectancy * performance.totalTrades) / performance.maxDrawdown
          : 0;
        
        const profitabilityIndex = performance.winRate / 100 * performance.averageWin / 
          ((1 - performance.winRate / 100) * performance.averageLoss || 1);
        
        // Risk analysis
        const riskLevel = performance.maxDrawdown > 20 ? 'High' :
                         performance.maxDrawdown > 10 ? 'Medium' : 'Low';
        
        // Consistency analysis
        const monthlyReturns = performance.monthlyReturns.map(m => m.return);
        const positiveMonths = monthlyReturns.filter(r => r > 0).length;
        const consistency = monthlyReturns.length > 0 ? 
          (positiveMonths / monthlyReturns.length) * 100 : 0;
        
        // Volatility calculation
        const avgReturn = monthlyReturns.reduce((sum, r) => sum + r, 0) / monthlyReturns.length;
        const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / 
          (monthlyReturns.length - 1);
        const volatility = Math.sqrt(variance);
        
        return {
          calmarRatio,
          recoveryFactor,
          profitabilityIndex,
          riskLevel,
          consistency,
          volatility,
          avgReturn
        };
      },
      'calculation'
    );
  }, [strategy]);

  const { performance } = strategy;

  return (
    <div className="performance-analytics bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Advanced Analytics</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Risk-Adjusted Returns */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Risk-Adjusted Returns</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sharpe Ratio:</span>
              <span className={`font-medium ${
                (performance.sharpeRatio || 0) > 1 ? 'text-green-600' : 
                (performance.sharpeRatio || 0) > 0.5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {performance.sharpeRatio?.toFixed(3) || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Calmar Ratio:</span>
              <span className={`font-medium ${
                analytics.calmarRatio > 1 ? 'text-green-600' : 
                analytics.calmarRatio > 0.5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analytics.calmarRatio.toFixed(3)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Recovery Factor:</span>
              <span className={`font-medium ${
                analytics.recoveryFactor > 2 ? 'text-green-600' : 
                analytics.recoveryFactor > 1 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analytics.recoveryFactor.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Risk Analysis</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Max Drawdown:</span>
              <span className={`font-medium ${
                performance.maxDrawdown < 10 ? 'text-green-600' : 
                performance.maxDrawdown < 20 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {performance.maxDrawdown.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Risk Level:</span>
              <span className={`font-medium ${
                analytics.riskLevel === 'Low' ? 'text-green-600' : 
                analytics.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analytics.riskLevel}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Volatility:</span>
              <span className="font-medium text-gray-700">
                {analytics.volatility.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Consistency Metrics */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Consistency</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Positive Months:</span>
              <span className={`font-medium ${
                analytics.consistency > 60 ? 'text-green-600' : 
                analytics.consistency > 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analytics.consistency.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Profitability Index:</span>
              <span className={`font-medium ${
                analytics.profitabilityIndex > 1.5 ? 'text-green-600' : 
                analytics.profitabilityIndex > 1 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analytics.profitabilityIndex.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Monthly Return:</span>
              <span className={`font-medium ${
                analytics.avgReturn > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.avgReturn.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Breakdown Chart */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-700 mb-3">Monthly Performance Distribution</h4>
        <div className="h-32 bg-gray-50 rounded-lg flex items-end justify-center space-x-1 p-2">
          {performance.monthlyReturns.slice(-12).map((month, index) => {
            const height = Math.abs(month.return) / Math.max(...performance.monthlyReturns.map(m => Math.abs(m.return))) * 100;
            return (
              <div
                key={month.month}
                className={`w-6 rounded-t ${month.return >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${month.month}: ${month.return.toFixed(2)}`}
              />
            );
          })}
        </div>
        <div className="text-xs text-gray-500 text-center mt-1">
          Last 12 months performance
        </div>
      </div>

      {/* Statistical Significance Indicator */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Statistical Significance</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              performance.statisticallySignificant ? 'bg-green-500' : 'bg-orange-500'
            }`} />
            <span className="text-sm text-gray-600">
              {performance.totalTrades} trades
              {!performance.statisticallySignificant && 
                ` (need ${30 - performance.totalTrades} more for significance)`
              }
            </span>
          </div>
        </div>
        
        {performance.statisticallySignificant && (
          <div className="mt-2 text-xs text-green-600">
            ✓ Results are statistically significant with {performance.confidenceLevel}% confidence
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformanceAnalytics;
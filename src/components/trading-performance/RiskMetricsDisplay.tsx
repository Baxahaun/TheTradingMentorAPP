import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, TrendingDown, Activity, BarChart3, DollarSign, Target } from 'lucide-react';
import { formatChartValue } from '../../utils/performanceChartUtils';
import { RiskMetrics } from '../../types/tradingPerformance';
import { RISK_WARNING_THRESHOLDS } from '../../types/tradingPerformance';

/**
 * Risk Metrics Display Component
 *
 * Displays comprehensive risk assessment with visual indicators and warnings
 * for the trading performance widget dashboard.
 */
interface ExtendedRiskMetricsDisplayProps {
  riskMetrics: RiskMetrics;
  size?: { w: number; h: number };
  showDetails?: boolean;
}

const RiskMetricsDisplay: React.FC<ExtendedRiskMetricsDisplayProps> = ({
  riskMetrics,
  size = { w: 8, h: 4 },
  showDetails = true
}) => {
  // Get risk color based on thresholds
  const getRiskColor = (value: number, thresholds: typeof RISK_WARNING_THRESHOLDS.volatility): string => {
    if (value >= (thresholds.critical || 30)) return 'text-red-600 bg-red-50';
    if (value >= (thresholds.high || 20)) return 'text-orange-600 bg-orange-50';
    if (value >= (thresholds.medium || 10)) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  // Get risk variant for badges
  const getRiskVariant = (value: number, thresholds: typeof RISK_WARNING_THRESHOLDS.volatility) => {
    if (value >= (thresholds.critical || 30)) return 'destructive' as const;
    if (value >= (thresholds.high || 20)) return 'outline' as const;
    if (value >= (thresholds.medium || 10)) return 'secondary' as const;
    return 'default' as const;
  };

  // Calculate risk score color
  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Get sharpness risk (Sharpe Ratio)
  const getSharpeRisk = (sharpe?: number) => {
    if (!sharpe) return { text: 'N/A', color: 'text-gray-500 bg-gray-50', variant: 'secondary' as const };
    if (sharpe >= 2.0) return { text: 'Excellent', color: 'text-green-600 bg-green-50', variant: 'default' as const };
    if (sharpe >= 1.5) return { text: 'Good', color: 'text-blue-600 bg-blue-50', variant: 'default' as const };
    if (sharpe >= 0.5) return { text: 'Fair', color: 'text-yellow-600 bg-yellow-50', variant: 'secondary' as const };
    return { text: 'Poor', color: 'text-red-600 bg-red-50', variant: 'destructive' as const };
  };

  // Responsive grid classes
  const getGridClasses = () => {
    const totalWidth = size?.w || 8;
    const totalHeight = size?.h || 4;

    if (totalWidth >= 8 && totalHeight >= 4) {
      return 'grid grid-cols-2 lg:grid-cols-3 gap-4';
    } else if (totalWidth >= 4) {
      return 'grid grid-cols-2 gap-3';
    } else {
      return 'grid grid-cols-1 gap-3';
    }
  };

  const sharpeRisk = getSharpeRisk(riskMetrics.sharpeRatio);

  // Risk warning component
  const RiskWarningItem: React.FC<{ warning: any }> = ({ warning }) => {
    const getWarningLevel = (level: string) => {
      switch (level) {
        case 'critical': return { icon: AlertTriangle, color: 'text-red-600 bg-red-50', variant: 'destructive' as const };
        case 'high': return { icon: AlertTriangle, color: 'text-orange-600 bg-orange-50', variant: 'destructive' as const };
        case 'medium': return { icon: Activity, color: 'text-yellow-600 bg-yellow-50', variant: 'secondary' as const };
        default: return { icon: Target, color: 'text-blue-600 bg-blue-50', variant: 'default' as const };
      }
    };

    const { icon: WarningIcon, color, variant } = getWarningLevel(warning.level);

    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${color.replace('bg-', 'border-l-4 border-l-').replace('text-', 'border-')} ${color.split(' ')[1]}`}>
        <WarningIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{warning.message}</p>
          {(warning.value !== undefined || warning.threshold !== undefined) && (
            <p className="text-xs text-muted-foreground mt-1">
              {warning.value !== undefined && `Current: ${warning.value.toFixed ? warning.value.toFixed(2) : warning.value}`}
              {warning.value !== undefined && warning.threshold !== undefined && ' | '}
              {warning.threshold !== undefined && `Threshold: ${warning.threshold}`}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Risk Assessment
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Risk metrics and warnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={riskMetrics.riskScore >= 60 ? 'default' : 'destructive'}
            className="text-xs"
          >
            Score: {riskMetrics.riskScore}/100
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Core Risk Metrics */}
        <div className={getGridClasses()}>
          {/* Maximum Drawdown */}
          <div className="bg-white rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-gray-900">Max Drawdown</span>
              </div>
              <Badge
                variant={getRiskVariant(riskMetrics.maxDrawdownPercentage, RISK_WARNING_THRESHOLDS.maxDrawdown)}
                className="text-xs"
              >
                {riskMetrics.maxDrawdownPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className={`text-lg font-bold ${getRiskColor(riskMetrics.maxDrawdownPercentage, RISK_WARNING_THRESHOLDS.maxDrawdown).split(' ')[0]}`}>
              {formatChartValue(riskMetrics.maxDrawdown, 'currency')}
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  riskMetrics.maxDrawdownPercentage >= 20 ? 'bg-red-500' :
                  riskMetrics.maxDrawdownPercentage >= 10 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(riskMetrics.maxDrawdownPercentage * 2, 100)}%` }}
              />
            </div>
          </div>

          {/* Volatility */}
          {riskMetrics.volatility !== undefined && (
            <div className="bg-white rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">Volatility</span>
                </div>
                <Badge
                  variant={getRiskVariant(riskMetrics.volatility * 100, RISK_WARNING_THRESHOLDS.volatility)}
                  className="text-xs"
                >
                  {typeof riskMetrics.volatility === 'number' ? (riskMetrics.volatility * 100).toFixed(1) : '0.0'}%
                </Badge>
              </div>
              <div className={`text-lg font-bold ${getRiskColor(riskMetrics.volatility * 100, RISK_WARNING_THRESHOLDS.volatility).split(' ')[0]}`}>
                {(riskMetrics.volatility * 100).toFixed(1)}%
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    riskMetrics.volatility * 100 >= 20 ? 'bg-red-500' :
                    riskMetrics.volatility * 100 >= 10 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(riskMetrics.volatility * 200, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Sharpe Ratio */}
          {riskMetrics.sharpeRatio !== undefined && (
            <div className="bg-white rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">Sharpe Ratio</span>
                </div>
                <Badge variant={sharpeRisk.variant} className="text-xs">
                  {sharpeRisk.text}
                </Badge>
              </div>
              <div className={`text-lg font-bold ${sharpeRisk.color.split(' ')[0]}`}>
                {riskMetrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    riskMetrics.sharpeRatio >= 2.0 ? 'bg-green-500' :
                    riskMetrics.sharpeRatio >= 1.0 ? 'bg-blue-500' :
                    riskMetrics.sharpeRatio >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(riskMetrics.sharpeRatio * 25, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Risk Score */}
          <div className="bg-white rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-900">Risk Score</span>
              </div>
              <Badge
                variant={riskMetrics.riskScore >= 60 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {riskMetrics.riskScore >= 60 ? 'Low' : riskMetrics.riskScore >= 40 ? 'Medium' : 'High'} Risk
              </Badge>
            </div>
            <div className={`text-lg font-bold ${getRiskScoreColor(riskMetrics.riskScore).split(' ')[0]}`}>
              {riskMetrics.riskScore}/100
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  riskMetrics.riskScore >= 80 ? 'bg-green-500' :
                  riskMetrics.riskScore >= 60 ? 'bg-blue-500' :
                  riskMetrics.riskScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${riskMetrics.riskScore}%` }}
              />
            </div>
          </div>

          {/* Average Risk per Trade */}
          {riskMetrics.averageRiskPerTrade !== undefined && (
            <div className="bg-white rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium text-gray-900">Risk per Trade</span>
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatChartValue(riskMetrics.averageRiskPerTrade, 'currency')}
              </div>
              <p className="text-xs text-muted-foreground">Average risk exposure</p>
            </div>
          )}

          {/* Value at Risk */}
          {riskMetrics.valueAtRisk !== undefined && (
            <div className="bg-white rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-900">VaR (95%)</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Historical
                </Badge>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatChartValue(riskMetrics.valueAtRisk, 'currency')}
              </div>
              <p className="text-xs text-muted-foreground">Potential loss at 95% confidence</p>
            </div>
          )}
        </div>

        {/* Risk Warnings */}
        {Array.isArray(riskMetrics.riskWarnings) && riskMetrics.riskWarnings.length > 0 && showDetails && (
          <div className="space-y-3">
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h4 className="text-sm font-semibold text-gray-900">Risk Alerts</h4>
                <Badge variant="destructive" className="text-xs">
                  {riskMetrics.riskWarnings.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {riskMetrics.riskWarnings.map((warning, index) => (
                  <RiskWarningItem key={`${warning.id}-${index}`} warning={warning} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Risk Summary */}
        <div className="border-t pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <span className="text-muted-foreground">Overall Risk:</span>
              <div className="font-semibold mt-1">
                {riskMetrics.riskScore >= 80 ? 'Low Risk' :
                 riskMetrics.riskScore >= 60 ? 'Moderate Risk' :
                 riskMetrics.riskScore >= 40 ? 'High Risk' : 'Critical Risk'}
              </div>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground">Risk/Reward:</span>
              <div className="font-semibold mt-1">
                1:{Math.max(1, Math.round(riskMetrics.averageRiskReward))}
              </div>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground">Safe Zone:</span>
              <div className={`font-semibold mt-1 ${
                riskMetrics.maxDrawdownPercentage <= 10 ? 'text-green-600' : 'text-red-600'
              }`}>
                {riskMetrics.maxDrawdownPercentage <= 5 ? 'Safe' : riskMetrics.maxDrawdownPercentage <= 10 ? 'Caution' : 'Review'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMetricsDisplay;
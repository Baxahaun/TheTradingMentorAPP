import React from 'react';
import { Trade } from '../../../types/trade';
import { TradeReviewMode } from '../../../types/tradeReview';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  BarChart3,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TradePerformancePanelProps {
  trade: Trade;
  editedTrade: Trade;
  isEditing: boolean;
  currentMode: TradeReviewMode;
  onTradeChange: (field: keyof Trade, value: any) => void;
}

const TradePerformancePanel: React.FC<TradePerformancePanelProps> = ({
  trade,
  editedTrade,
  isEditing,
  currentMode,
  onTradeChange
}) => {
  const isProfitable = (editedTrade.pnl || 0) >= 0;
  const rMultiple = editedTrade.rMultiple || 
    (editedTrade.riskAmount && editedTrade.pnl ? editedTrade.pnl / editedTrade.riskAmount : undefined);

  // Calculate return percentage
  const getReturnPercentage = () => {
    if (!editedTrade.exitPrice || !editedTrade.entryPrice) return null;
    return ((editedTrade.exitPrice - editedTrade.entryPrice) / editedTrade.entryPrice) * 100;
  };

  // Calculate risk-reward ratio
  const getRiskRewardRatio = () => {
    if (!editedTrade.takeProfit || !editedTrade.stopLoss || !editedTrade.entryPrice) return null;
    
    const reward = Math.abs(editedTrade.takeProfit - editedTrade.entryPrice);
    const risk = Math.abs(editedTrade.entryPrice - editedTrade.stopLoss);
    
    return risk > 0 ? reward / risk : null;
  };

  // Calculate hold duration (simplified)
  const getHoldDuration = () => {
    if (!editedTrade.timeOut || !editedTrade.timeIn) return 'Open';
    // This is a simplified calculation - in a real implementation, 
    // you'd calculate the actual duration between timeIn and timeOut
    return 'Active';
  };

  // Get performance grade
  const getPerformanceGrade = () => {
    if (!rMultiple) return null;
    
    if (rMultiple >= 2) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (rMultiple >= 1) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rMultiple >= 0) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (rMultiple >= -0.5) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const returnPercentage = getReturnPercentage();
  const riskRewardRatio = getRiskRewardRatio();
  const holdDuration = getHoldDuration();
  const performanceGrade = getPerformanceGrade();

  return (
    <div className="space-y-6">
      
      {/* Performance Overview - Full Width on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Summary - Left Column */}
        <div className="lg:col-span-1 space-y-6">
        
        {/* Main Performance Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main P&L */}
            <div className="text-center bg-white p-4 rounded-lg border">
              <div className={`text-3xl font-bold mb-1 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                {editedTrade.pnl !== undefined ? `${isProfitable ? '+' : ''}$${Math.abs(editedTrade.pnl).toFixed(2)}` : 'N/A'}
              </div>
              <div className="text-sm text-gray-500 font-medium">Net Profit/Loss</div>
            </div>
            
            {/* Performance Grade */}
            {performanceGrade && (
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${performanceGrade.bg} ${performanceGrade.color} mb-2`}>
                  {performanceGrade.grade}
                </div>
                <div className="text-sm text-gray-600">Performance Grade</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Risk Amount</span>
              <span className="font-bold text-gray-900">
                {editedTrade.riskAmount ? `$${editedTrade.riskAmount.toFixed(2)}` : 'Not set'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Risk/Reward</span>
              <span className="font-bold text-gray-900">
                {riskRewardRatio ? `1:${riskRewardRatio.toFixed(2)}` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-600">Position Size</span>
              <span className="font-bold text-gray-900">
                {editedTrade.lotSize ? `${editedTrade.lotSize} lots` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Detailed Metrics - Right Columns */}
        <div className="lg:col-span-2 space-y-6">
        
        {/* Key Performance Metrics */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Key Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              
              {/* R-Multiple */}
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className={`text-2xl font-bold mb-1 ${rMultiple && rMultiple >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {rMultiple ? `${rMultiple.toFixed(2)}R` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 font-medium">Risk Multiple</div>
                <div className="mt-2">
                  {rMultiple && rMultiple >= 1 ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  ) : rMultiple && rMultiple >= 0 ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                  )}
                </div>
              </div>

              {/* Return Percentage */}
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className={`text-2xl font-bold mb-1 ${returnPercentage && returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {returnPercentage ? `${returnPercentage > 0 ? '+' : ''}${returnPercentage.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 font-medium">Return %</div>
                <div className="mt-2">
                  {returnPercentage && returnPercentage >= 2 ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  ) : returnPercentage && returnPercentage >= 0 ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                  )}
                </div>
              </div>

              {/* Pips */}
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className={`text-2xl font-bold mb-1 ${(editedTrade.pips || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {editedTrade.pips !== undefined ? `${editedTrade.pips > 0 ? '+' : ''}${editedTrade.pips}` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 font-medium">Pips</div>
                <div className="mt-2">
                  {editedTrade.pips && editedTrade.pips >= 10 ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  ) : editedTrade.pips && editedTrade.pips >= 0 ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                  )}
                </div>
              </div>

              {/* Hold Duration */}
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold mb-1 text-gray-900">
                  {holdDuration}
                </div>
                <div className="text-xs text-gray-500 font-medium">Duration</div>
                <div className="mt-2">
                  <Clock className="w-4 h-4 text-blue-500 mx-auto" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Execution Analysis */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Target className="w-5 h-5 text-purple-600" />
              Execution Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Entry Analysis */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">Entry Execution</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Entry Price</span>
                    <span className="font-bold text-gray-900">
                      {editedTrade.entryPrice?.toFixed(5) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Stop Loss</span>
                    <span className="font-bold text-red-600">
                      {editedTrade.stopLoss ? editedTrade.stopLoss.toFixed(5) : 'Not set'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Take Profit</span>
                    <span className="font-bold text-green-600">
                      {editedTrade.takeProfit ? editedTrade.takeProfit.toFixed(5) : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exit Analysis */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">Exit Analysis</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Exit Price</span>
                    <span className="font-bold text-gray-900">
                      {editedTrade.exitPrice ? editedTrade.exitPrice.toFixed(5) : 'Open'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Exit Type</span>
                    <Badge variant="outline">
                      {editedTrade.status === 'closed' ? 'Manual/Auto' : 'Open'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Commission</span>
                    <span className="font-bold text-gray-900">
                      ${(editedTrade.commission || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Award className="w-5 h-5 text-yellow-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              
              {/* Strengths */}
              <div>
                <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {isProfitable && <li>• Trade was profitable</li>}
                  {rMultiple && rMultiple >= 1 && <li>• Achieved positive risk-reward ratio</li>}
                  {editedTrade.stopLoss && <li>• Proper risk management with stop loss</li>}
                  {editedTrade.takeProfit && <li>• Clear profit target defined</li>}
                  {editedTrade.confidence && editedTrade.confidence >= 4 && <li>• High confidence in trade setup</li>}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div>
                <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {!isProfitable && <li>• Trade resulted in a loss</li>}
                  {rMultiple && rMultiple < 1 && <li>• Risk-reward ratio could be improved</li>}
                  {!editedTrade.stopLoss && <li>• Consider setting stop loss for risk management</li>}
                  {!editedTrade.takeProfit && <li>• Define clear profit targets</li>}
                  {!editedTrade.strategy && <li>• Document trading strategy for analysis</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default TradePerformancePanel;
import React from 'react';
import { Trade } from '../../../types/trade';
import { TradeReviewMode } from '../../../types/tradeReview';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { 
  DollarSign, 
  Clock, 
  Shield, 
  Activity,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';

interface TradeDataPanelProps {
  trade: Trade;
  editedTrade: Trade;
  isEditing: boolean;
  currentMode: TradeReviewMode;
  onTradeChange: (field: keyof Trade, value: any) => void;
}

const TradeDataPanel: React.FC<TradeDataPanelProps> = ({
  trade,
  editedTrade,
  isEditing,
  currentMode,
  onTradeChange
}) => {
  const handleInputChange = (field: keyof Trade, value: string | number | Date | undefined) => {
    onTradeChange(field, value);
  };

  const isProfitable = (editedTrade.pnl || 0) >= 0;
  const rMultiple = editedTrade.rMultiple || 
    (editedTrade.riskAmount && editedTrade.pnl ? editedTrade.pnl / editedTrade.riskAmount : undefined);

  // Calculate return percentage
  const getReturnPercentage = () => {
    if (!editedTrade.exitPrice || !editedTrade.entryPrice) return null;
    return ((editedTrade.exitPrice - editedTrade.entryPrice) / editedTrade.entryPrice) * 100;
  };

  const returnPercentage = getReturnPercentage();

  return (
    <div className="space-y-6">
      {/* Performance Overview - Full Width on Mobile */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main P&L */}
          <div className="text-center bg-white p-4 rounded-lg border">
            <div className={`text-2xl sm:text-3xl font-bold mb-1 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
              {editedTrade.pnl !== undefined ? `${isProfitable ? '+' : ''}${Math.abs(editedTrade.pnl).toFixed(2)}` : 'N/A'}
            </div>
            <div className="text-sm text-gray-500 font-medium">Net Profit/Loss</div>
          </div>
          
          {/* Key Metrics Grid - Responsive */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {rMultiple ? `${rMultiple.toFixed(2)}R` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 font-medium">Risk Multiple</div>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {returnPercentage ? `${returnPercentage.toFixed(2)}%` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 font-medium">Return %</div>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {editedTrade.status === 'closed' ? 'Closed' : 'Open'}
              </div>
              <div className="text-xs text-gray-500 font-medium">Status</div>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {editedTrade.confidence ? `${editedTrade.confidence}/5` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 font-medium">Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Execution Details - Responsive Grid */}
      <div className="space-y-6">
        
        {/* Basic Trade Information */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Activity className="w-5 h-5 text-blue-600" />
              Trade Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Currency Pair */}
              <div>
                <Label htmlFor="currencyPair" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Currency Pair
                </Label>
                {isEditing ? (
                  <Input
                    id="currencyPair"
                    value={editedTrade.currencyPair}
                    onChange={(e) => handleInputChange('currencyPair', e.target.value)}
                    placeholder="e.g., EUR/USD"
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">{editedTrade.currencyPair}</span>
                  </div>
                )}
              </div>

              {/* Trade Direction */}
              <div>
                <Label htmlFor="side" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Direction
                </Label>
                {isEditing ? (
                  <Select
                    value={editedTrade.side}
                    onValueChange={(value: 'long' | 'short') => handleInputChange('side', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="w-4 h-4 text-green-600" />
                          Long
                        </div>
                      </SelectItem>
                      <SelectItem value="short">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="w-4 h-4 text-red-600" />
                          Short
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <div className="flex items-center gap-2">
                      {editedTrade.side === 'long' ? (
                        <ArrowUpCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-gray-900 font-medium capitalize">{editedTrade.side}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lot Size */}
              <div>
                <Label htmlFor="lotSize" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Lot Size
                </Label>
                {isEditing ? (
                  <Input
                    id="lotSize"
                    type="number"
                    step="0.01"
                    value={editedTrade.lotSize || ''}
                    onChange={(e) => handleInputChange('lotSize', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 1.5"
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">{editedTrade.lotSize || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Execution Details */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
              Execution Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Entry Price */}
              <div>
                <Label htmlFor="entryPrice" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Entry Price
                </Label>
                {isEditing ? (
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.00001"
                    value={editedTrade.entryPrice}
                    onChange={(e) => handleInputChange('entryPrice', parseFloat(e.target.value) || 0)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">{editedTrade.entryPrice?.toFixed(5) || 'N/A'}</span>
                  </div>
                )}
              </div>

              {/* Exit Price */}
              <div>
                <Label htmlFor="exitPrice" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Exit Price
                </Label>
                {isEditing ? (
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.00001"
                    value={editedTrade.exitPrice || ''}
                    onChange={(e) => handleInputChange('exitPrice', parseFloat(e.target.value) || undefined)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">
                      {editedTrade.exitPrice ? editedTrade.exitPrice.toFixed(5) : 'Open'}
                    </span>
                  </div>
                )}
              </div>

              {/* Pips */}
              <div>
                <Label htmlFor="pips" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Pips
                </Label>
                {isEditing ? (
                  <Input
                    id="pips"
                    type="number"
                    step="0.1"
                    value={editedTrade.pips || ''}
                    onChange={(e) => handleInputChange('pips', parseFloat(e.target.value) || undefined)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className={`font-medium ${(editedTrade.pips || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {editedTrade.pips !== undefined ? `${editedTrade.pips > 0 ? '+' : ''}${editedTrade.pips}` : 'N/A'}
                    </span>
                  </div>
                )}
              </div>

              {/* Commission */}
              <div>
                <Label htmlFor="commission" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Commission
                </Label>
                {isEditing ? (
                  <Input
                    id="commission"
                    type="number"
                    step="0.01"
                    value={editedTrade.commission || ''}
                    onChange={(e) => handleInputChange('commission', parseFloat(e.target.value) || 0)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">${(editedTrade.commission || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* P&L */}
              <div>
                <Label htmlFor="pnl" className="text-sm font-semibold text-gray-700 mb-2 block">
                  P&L
                </Label>
                {isEditing ? (
                  <Input
                    id="pnl"
                    type="number"
                    step="0.01"
                    value={editedTrade.pnl || ''}
                    onChange={(e) => handleInputChange('pnl', parseFloat(e.target.value) || undefined)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className={`font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                      {editedTrade.pnl !== undefined ? `${isProfitable ? '+' : ''}${editedTrade.pnl.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Shield className="w-5 h-5 text-red-600" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Stop Loss */}
              <div>
                <Label htmlFor="stopLoss" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Stop Loss
                </Label>
                {isEditing ? (
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.00001"
                    value={editedTrade.stopLoss || ''}
                    onChange={(e) => handleInputChange('stopLoss', parseFloat(e.target.value) || undefined)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-red-600 font-medium">
                      {editedTrade.stopLoss ? editedTrade.stopLoss.toFixed(5) : 'Not set'}
                    </span>
                  </div>
                )}
              </div>

              {/* Take Profit */}
              <div>
                <Label htmlFor="takeProfit" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Take Profit
                </Label>
                {isEditing ? (
                  <Input
                    id="takeProfit"
                    type="number"
                    step="0.00001"
                    value={editedTrade.takeProfit || ''}
                    onChange={(e) => handleInputChange('takeProfit', parseFloat(e.target.value) || undefined)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-green-600 font-medium">
                      {editedTrade.takeProfit ? editedTrade.takeProfit.toFixed(5) : 'Not set'}
                    </span>
                  </div>
                )}
              </div>

              {/* Risk Amount */}
              <div>
                <Label htmlFor="riskAmount" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Risk Amount
                </Label>
                {isEditing ? (
                  <Input
                    id="riskAmount"
                    type="number"
                    step="0.01"
                    value={editedTrade.riskAmount || ''}
                    onChange={(e) => handleInputChange('riskAmount', parseFloat(e.target.value) || undefined)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">
                      {editedTrade.riskAmount ? `$${editedTrade.riskAmount.toFixed(2)}` : 'Not set'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing Information */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              Timing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Date */}
              <div>
                <Label htmlFor="date" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Date
                </Label>
                {isEditing ? (
                  <Input
                    id="date"
                    type="date"
                    value={editedTrade.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">
                      {new Date(editedTrade.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Entry Time */}
              <div>
                <Label htmlFor="timeIn" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Entry Time
                </Label>
                {isEditing ? (
                  <Input
                    id="timeIn"
                    type="time"
                    value={editedTrade.timeIn}
                    onChange={(e) => handleInputChange('timeIn', e.target.value)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">{editedTrade.timeIn}</span>
                  </div>
                )}
              </div>

              {/* Exit Time */}
              <div>
                <Label htmlFor="timeOut" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Exit Time
                </Label>
                {isEditing ? (
                  <Input
                    id="timeOut"
                    type="time"
                    value={editedTrade.timeOut || ''}
                    onChange={(e) => handleInputChange('timeOut', e.target.value || undefined)}
                    className="h-10"
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">{editedTrade.timeOut || 'Open'}</span>
                  </div>
                )}
              </div>

              {/* Timeframe */}
              <div>
                <Label htmlFor="timeframe" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Timeframe
                </Label>
                {isEditing ? (
                  <Select
                    value={editedTrade.timeframe || ''}
                    onValueChange={(value) => handleInputChange('timeframe', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select TF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1m</SelectItem>
                      <SelectItem value="5m">5m</SelectItem>
                      <SelectItem value="15m">15m</SelectItem>
                      <SelectItem value="30m">30m</SelectItem>
                      <SelectItem value="1h">1h</SelectItem>
                      <SelectItem value="4h">4h</SelectItem>
                      <SelectItem value="1d">1d</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md border min-h-[40px] flex items-center">
                    <span className="text-gray-900 font-medium">{editedTrade.timeframe || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradeDataPanel;
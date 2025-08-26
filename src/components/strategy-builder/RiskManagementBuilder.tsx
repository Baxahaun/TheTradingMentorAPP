import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Shield, DollarSign, TrendingDown, TrendingUp, AlertTriangle, Info } from 'lucide-react';

import { 
  ProfessionalStrategy, 
  PositionSizingMethod, 
  StopLossRule, 
  TakeProfitRule,
  ValidationResult,
  POSITION_SIZING_TYPES,
  STOP_LOSS_TYPES,
  TAKE_PROFIT_TYPES
} from '@/types/strategy';

interface RiskManagementBuilderProps {
  data: Partial<ProfessionalStrategy>;
  onChange: (updates: Partial<ProfessionalStrategy>) => void;
  validation?: ValidationResult;
  isValidating?: boolean;
}

export const RiskManagementBuilder: React.FC<RiskManagementBuilderProps> = ({
  data,
  onChange,
  validation,
  isValidating
}) => {
  const riskManagement = data.riskManagement || {
    positionSizingMethod: {
      type: 'FixedPercentage',
      parameters: { percentage: 2 }
    },
    maxRiskPerTrade: 2,
    stopLossRule: {
      type: 'PercentageBased',
      parameters: { percentage: 2 },
      description: '2% stop loss'
    },
    takeProfitRule: {
      type: 'RiskRewardRatio',
      parameters: { ratio: 2 },
      description: '2:1 risk-reward ratio'
    },
    riskRewardRatio: 2
  };

  const handleRiskManagementUpdate = (updates: Partial<typeof riskManagement>) => {
    const newRiskManagement = { ...riskManagement, ...updates };
    onChange({ riskManagement: newRiskManagement });
  };

  const handlePositionSizingChange = (type: PositionSizingMethod['type']) => {
    const defaultParameters = {
      FixedPercentage: { percentage: 2 },
      FixedDollar: { dollarAmount: 1000 },
      VolatilityBased: { atrMultiplier: 1, atrPeriod: 14 },
      KellyFormula: { winRate: 60, avgWin: 100, avgLoss: 50 }
    };

    handleRiskManagementUpdate({
      positionSizingMethod: {
        type,
        parameters: defaultParameters[type]
      }
    });
  };

  const handleStopLossChange = (type: StopLossRule['type']) => {
    const defaultParameters = {
      ATRBased: { atrMultiplier: 2, atrPeriod: 14 },
      PercentageBased: { percentage: 2 },
      StructureBased: { structureType: 'support_resistance', buffer: 5 },
      VolatilityBased: { volatilityMultiplier: 1.5, volatilityPeriod: 20 }
    };

    const descriptions = {
      ATRBased: '2x ATR stop loss',
      PercentageBased: '2% stop loss',
      StructureBased: 'Structure-based stop loss',
      VolatilityBased: 'Volatility-based stop loss'
    };

    handleRiskManagementUpdate({
      stopLossRule: {
        type,
        parameters: defaultParameters[type],
        description: descriptions[type]
      }
    });
  };

  const handleTakeProfitChange = (type: TakeProfitRule['type']) => {
    const defaultParameters = {
      RiskRewardRatio: { ratio: 2 },
      StructureBased: { structureType: 'resistance_support' },
      TrailingStop: { trailDistance: 20, trailType: 'fixed' },
      PartialTargets: { 
        targets: [
          { percentage: 50, ratio: 1.5 },
          { percentage: 50, ratio: 3 }
        ]
      }
    };

    const descriptions = {
      RiskRewardRatio: '2:1 risk-reward ratio',
      StructureBased: 'Structure-based profit target',
      TrailingStop: 'Trailing stop profit management',
      PartialTargets: 'Partial profit targets'
    };

    handleRiskManagementUpdate({
      takeProfitRule: {
        type,
        parameters: defaultParameters[type],
        description: descriptions[type]
      }
    });
  };

  const getFieldError = (field: string) => {
    return validation?.errors?.find(error => error.field === field);
  };

  const getFieldWarning = (field: string) => {
    return validation?.warnings?.find(warning => warning.field === field);
  };

  const calculatePositionSize = () => {
    const accountSize = 10000; // Example account size
    const { positionSizingMethod, maxRiskPerTrade } = riskManagement;
    
    switch (positionSizingMethod.type) {
      case 'FixedPercentage':
        return (accountSize * (positionSizingMethod.parameters.percentage || 2)) / 100;
      case 'FixedDollar':
        return positionSizingMethod.parameters.dollarAmount || 1000;
      case 'VolatilityBased':
        return (accountSize * maxRiskPerTrade / 100) / ((positionSizingMethod.parameters.atrMultiplier || 1) * 50); // Assuming 50 pip ATR
      case 'KellyFormula':
        const { winRate = 60, avgWin = 100, avgLoss = 50 } = positionSizingMethod.parameters;
        const kellyPercent = ((winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss) / avgWin;
        return Math.max(0, Math.min(25, kellyPercent * 100)); // Cap at 25%
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Position Sizing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Position Sizing Method *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {POSITION_SIZING_TYPES.map((type) => {
              const isSelected = riskManagement.positionSizingMethod.type === type;
              const descriptions = {
                FixedPercentage: 'Risk a fixed percentage of account on each trade',
                FixedDollar: 'Risk a fixed dollar amount on each trade',
                VolatilityBased: 'Adjust position size based on market volatility (ATR)',
                KellyFormula: 'Optimize position size using Kelly Criterion'
              };

              return (
                <div
                  key={type}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePositionSizingChange(type)}
                >
                  <h4 className={`font-medium mb-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-gray-600">{descriptions[type]}</p>
                </div>
              );
            })}
          </div>

          {/* Position Sizing Parameters */}
          {riskManagement.positionSizingMethod.type === 'FixedPercentage' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label>Risk Percentage per Trade</Label>
              <div className="space-y-2">
                <Slider
                  value={[riskManagement.positionSizingMethod.parameters.percentage || 2]}
                  onValueChange={([value]) => {
                    const newMethod = { ...riskManagement.positionSizingMethod };
                    newMethod.parameters.percentage = value;
                    handleRiskManagementUpdate({ positionSizingMethod: newMethod });
                  }}
                  max={10}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>0.1%</span>
                  <span className="font-medium">
                    {riskManagement.positionSizingMethod.parameters.percentage || 2}%
                  </span>
                  <span>10%</span>
                </div>
              </div>
            </div>
          )}

          {riskManagement.positionSizingMethod.type === 'FixedDollar' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="dollarAmount">Dollar Amount per Trade</Label>
              <Input
                id="dollarAmount"
                type="number"
                value={riskManagement.positionSizingMethod.parameters.dollarAmount || 1000}
                onChange={(e) => {
                  const newMethod = { ...riskManagement.positionSizingMethod };
                  newMethod.parameters.dollarAmount = Number(e.target.value);
                  handleRiskManagementUpdate({ positionSizingMethod: newMethod });
                }}
                placeholder="1000"
              />
            </div>
          )}

          {riskManagement.positionSizingMethod.type === 'VolatilityBased' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="atrMultiplier">ATR Multiplier</Label>
                  <Input
                    id="atrMultiplier"
                    type="number"
                    step="0.1"
                    value={riskManagement.positionSizingMethod.parameters.atrMultiplier || 1}
                    onChange={(e) => {
                      const newMethod = { ...riskManagement.positionSizingMethod };
                      newMethod.parameters.atrMultiplier = Number(e.target.value);
                      handleRiskManagementUpdate({ positionSizingMethod: newMethod });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="atrPeriod">ATR Period</Label>
                  <Input
                    id="atrPeriod"
                    type="number"
                    value={riskManagement.positionSizingMethod.parameters.atrPeriod || 14}
                    onChange={(e) => {
                      const newMethod = { ...riskManagement.positionSizingMethod };
                      newMethod.parameters.atrPeriod = Number(e.target.value);
                      handleRiskManagementUpdate({ positionSizingMethod: newMethod });
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Position Size Preview */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Position Size Preview</span>
            </div>
            <p className="text-sm text-blue-800">
              With a $10,000 account: <span className="font-medium">${calculatePositionSize().toFixed(2)}</span> position size
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Maximum Risk Per Trade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Maximum Risk Per Trade *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Maximum Risk Percentage</Label>
            <div className="space-y-2">
              <Slider
                value={[riskManagement.maxRiskPerTrade]}
                onValueChange={([value]) => handleRiskManagementUpdate({ maxRiskPerTrade: value })}
                max={10}
                min={0.1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>0.1%</span>
                <span className="font-medium">{riskManagement.maxRiskPerTrade}%</span>
                <span>10%</span>
              </div>
            </div>
            
            {riskManagement.maxRiskPerTrade > 5 && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  High risk per trade. Consider reducing to 2-3% for better risk management.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stop Loss Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <TrendingDown className="w-5 h-5 mr-2" />
            Stop Loss Rules *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STOP_LOSS_TYPES.map((type) => {
              const isSelected = riskManagement.stopLossRule.type === type;
              const descriptions = {
                ATRBased: 'Set stop loss based on Average True Range',
                PercentageBased: 'Set stop loss as percentage from entry',
                StructureBased: 'Set stop loss based on support/resistance levels',
                VolatilityBased: 'Adjust stop loss based on market volatility'
              };

              return (
                <div
                  key={type}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStopLossChange(type)}
                >
                  <h4 className={`font-medium mb-2 ${isSelected ? 'text-red-900' : 'text-gray-900'}`}>
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-gray-600">{descriptions[type]}</p>
                </div>
              );
            })}
          </div>

          {/* Stop Loss Parameters */}
          {riskManagement.stopLossRule.type === 'PercentageBased' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="stopLossPercentage">Stop Loss Percentage</Label>
              <Input
                id="stopLossPercentage"
                type="number"
                step="0.1"
                value={riskManagement.stopLossRule.parameters.percentage || 2}
                onChange={(e) => {
                  const newRule = { ...riskManagement.stopLossRule };
                  newRule.parameters.percentage = Number(e.target.value);
                  newRule.description = `${e.target.value}% stop loss`;
                  handleRiskManagementUpdate({ stopLossRule: newRule });
                }}
              />
            </div>
          )}

          {riskManagement.stopLossRule.type === 'ATRBased' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stopAtrMultiplier">ATR Multiplier</Label>
                  <Input
                    id="stopAtrMultiplier"
                    type="number"
                    step="0.1"
                    value={riskManagement.stopLossRule.parameters.atrMultiplier || 2}
                    onChange={(e) => {
                      const newRule = { ...riskManagement.stopLossRule };
                      newRule.parameters.atrMultiplier = Number(e.target.value);
                      newRule.description = `${e.target.value}x ATR stop loss`;
                      handleRiskManagementUpdate({ stopLossRule: newRule });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="stopAtrPeriod">ATR Period</Label>
                  <Input
                    id="stopAtrPeriod"
                    type="number"
                    value={riskManagement.stopLossRule.parameters.atrPeriod || 14}
                    onChange={(e) => {
                      const newRule = { ...riskManagement.stopLossRule };
                      newRule.parameters.atrPeriod = Number(e.target.value);
                      handleRiskManagementUpdate({ stopLossRule: newRule });
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="stopLossDescription">Stop Loss Description</Label>
            <Input
              id="stopLossDescription"
              value={riskManagement.stopLossRule.description}
              onChange={(e) => {
                const newRule = { ...riskManagement.stopLossRule };
                newRule.description = e.target.value;
                handleRiskManagementUpdate({ stopLossRule: newRule });
              }}
              placeholder="Describe your stop loss approach"
            />
          </div>
        </CardContent>
      </Card>

      {/* Take Profit Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Take Profit Rules *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TAKE_PROFIT_TYPES.map((type) => {
              const isSelected = riskManagement.takeProfitRule.type === type;
              const descriptions = {
                RiskRewardRatio: 'Set profit target based on risk-reward ratio',
                StructureBased: 'Target resistance/support levels',
                TrailingStop: 'Use trailing stop to capture trends',
                PartialTargets: 'Take profits at multiple levels'
              };

              return (
                <div
                  key={type}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTakeProfitChange(type)}
                >
                  <h4 className={`font-medium mb-2 ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-gray-600">{descriptions[type]}</p>
                </div>
              );
            })}
          </div>

          {/* Take Profit Parameters */}
          {riskManagement.takeProfitRule.type === 'RiskRewardRatio' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label>Risk-Reward Ratio</Label>
              <div className="space-y-2">
                <Slider
                  value={[riskManagement.takeProfitRule.parameters.ratio || 2]}
                  onValueChange={([value]) => {
                    const newRule = { ...riskManagement.takeProfitRule };
                    newRule.parameters.ratio = value;
                    newRule.description = `${value}:1 risk-reward ratio`;
                    handleRiskManagementUpdate({ 
                      takeProfitRule: newRule,
                      riskRewardRatio: value 
                    });
                  }}
                  max={10}
                  min={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>1:1</span>
                  <span className="font-medium">
                    {(riskManagement.takeProfitRule.parameters.ratio || 2).toFixed(1)}:1
                  </span>
                  <span>10:1</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="takeProfitDescription">Take Profit Description</Label>
            <Input
              id="takeProfitDescription"
              value={riskManagement.takeProfitRule.description}
              onChange={(e) => {
                const newRule = { ...riskManagement.takeProfitRule };
                newRule.description = e.target.value;
                handleRiskManagementUpdate({ takeProfitRule: newRule });
              }}
              placeholder="Describe your profit-taking approach"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk Management Summary */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-base text-purple-900">Risk Management Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="font-medium text-purple-900">Position Sizing:</span>
                <p className="text-purple-800">
                  {riskManagement.positionSizingMethod.type.replace(/([A-Z])/g, ' $1').trim()}
                  {riskManagement.positionSizingMethod.type === 'FixedPercentage' && 
                    ` (${riskManagement.positionSizingMethod.parameters.percentage}%)`}
                </p>
              </div>
              <div>
                <span className="font-medium text-purple-900">Max Risk:</span>
                <p className="text-purple-800">{riskManagement.maxRiskPerTrade}% per trade</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="font-medium text-purple-900">Stop Loss:</span>
                <p className="text-purple-800">{riskManagement.stopLossRule.description}</p>
              </div>
              <div>
                <span className="font-medium text-purple-900">Take Profit:</span>
                <p className="text-purple-800">{riskManagement.takeProfitRule.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
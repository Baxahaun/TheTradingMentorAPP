import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, TrendingUp, BarChart3, Activity, AlertCircle } from 'lucide-react';

import { ProfessionalStrategy, ValidationResult } from '@/types/strategy';

interface SetupConditionsBuilderProps {
  data: Partial<ProfessionalStrategy>;
  onChange: (updates: Partial<ProfessionalStrategy>) => void;
  validation?: ValidationResult;
  isValidating?: boolean;
}

const commonTechnicalConditions = [
  'Price above 20 EMA',
  'Price below 20 EMA',
  'RSI > 50',
  'RSI < 50',
  'MACD bullish crossover',
  'MACD bearish crossover',
  'Volume above average',
  'Breaking resistance',
  'Breaking support',
  'Bullish engulfing pattern',
  'Bearish engulfing pattern',
  'Higher highs and higher lows',
  'Lower highs and lower lows',
  'Consolidation breakout',
  'Trend line break'
];

const commonFundamentalConditions = [
  'Positive earnings surprise',
  'Strong GDP growth',
  'Rising interest rates',
  'Falling interest rates',
  'High market volatility',
  'Low market volatility',
  'Sector rotation',
  'Economic data release',
  'Central bank announcement',
  'Geopolitical events',
  'Commodity price changes',
  'Currency strength/weakness'
];

const volatilityLevels = [
  'Low volatility (VIX < 20)',
  'Medium volatility (VIX 20-30)',
  'High volatility (VIX > 30)',
  'Any volatility level'
];

const marketEnvironments = [
  'Strong uptrend with momentum',
  'Weak uptrend with consolidation',
  'Strong downtrend with momentum',
  'Weak downtrend with consolidation',
  'Sideways/ranging market',
  'High volatility breakout environment',
  'Low volatility consolidation',
  'Post-news reaction environment',
  'Session overlap periods',
  'End of session/day environment'
];

export const SetupConditionsBuilder: React.FC<SetupConditionsBuilderProps> = ({
  data,
  onChange,
  validation,
  isValidating
}) => {
  const [newTechnicalCondition, setNewTechnicalCondition] = useState('');
  const [newFundamentalCondition, setNewFundamentalCondition] = useState('');

  const setupConditions = data.setupConditions || {
    marketEnvironment: '',
    technicalConditions: [],
    fundamentalConditions: [],
    volatilityRequirements: ''
  };

  const handleSetupConditionsUpdate = (updates: Partial<typeof setupConditions>) => {
    const newSetupConditions = { ...setupConditions, ...updates };
    onChange({ setupConditions: newSetupConditions });
  };

  const addTechnicalCondition = (condition: string) => {
    if (condition && !setupConditions.technicalConditions?.includes(condition)) {
      const newConditions = [...(setupConditions.technicalConditions || []), condition];
      handleSetupConditionsUpdate({ technicalConditions: newConditions });
      setNewTechnicalCondition('');
    }
  };

  const removeTechnicalCondition = (index: number) => {
    const newConditions = setupConditions.technicalConditions?.filter((_, i) => i !== index) || [];
    handleSetupConditionsUpdate({ technicalConditions: newConditions });
  };

  const addFundamentalCondition = (condition: string) => {
    if (condition && !setupConditions.fundamentalConditions?.includes(condition)) {
      const newConditions = [...(setupConditions.fundamentalConditions || []), condition];
      handleSetupConditionsUpdate({ fundamentalConditions: newConditions });
      setNewFundamentalCondition('');
    }
  };

  const removeFundamentalCondition = (index: number) => {
    const newConditions = setupConditions.fundamentalConditions?.filter((_, i) => i !== index) || [];
    handleSetupConditionsUpdate({ fundamentalConditions: newConditions });
  };

  const getFieldError = (field: string) => {
    return validation?.errors?.find(error => error.field === field);
  };

  const getFieldWarning = (field: string) => {
    return validation?.warnings?.find(warning => warning.field === field);
  };

  return (
    <div className="space-y-6">
      {/* Market Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Market Environment *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="marketEnvironment">Describe the ideal market conditions</Label>
            <Textarea
              id="marketEnvironment"
              value={setupConditions.marketEnvironment}
              onChange={(e) => handleSetupConditionsUpdate({ marketEnvironment: e.target.value })}
              placeholder="Describe when this strategy works best (trending, ranging, volatile, etc.)"
              rows={3}
              className={getFieldError('marketEnvironment') ? 'border-red-500' : ''}
            />
            {getFieldError('marketEnvironment') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('marketEnvironment')?.message}</p>
            )}
          </div>

          <div>
            <Label>Common Market Environments</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {marketEnvironments.map((environment) => (
                <button
                  key={environment}
                  type="button"
                  onClick={() => handleSetupConditionsUpdate({ marketEnvironment: environment })}
                  className="p-2 text-sm text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {environment}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Technical Conditions *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Required Technical Setup</Label>
            <p className="text-sm text-gray-600 mb-3">
              Define the technical conditions that must be present before considering an entry
            </p>
            
            {/* Current technical conditions */}
            {setupConditions.technicalConditions && setupConditions.technicalConditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {setupConditions.technicalConditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center">
                    {condition}
                    <button
                      onClick={() => removeTechnicalCondition(index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add custom technical condition */}
            <div className="flex space-x-2 mb-3">
              <Input
                value={newTechnicalCondition}
                onChange={(e) => setNewTechnicalCondition(e.target.value)}
                placeholder="Add custom technical condition"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTechnicalCondition(newTechnicalCondition);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTechnicalCondition(newTechnicalCondition)}
                disabled={!newTechnicalCondition}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Common technical conditions */}
            <div>
              <Label className="text-sm">Common Technical Conditions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {commonTechnicalConditions.map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => addTechnicalCondition(condition)}
                    disabled={setupConditions.technicalConditions?.includes(condition)}
                    className={`p-2 text-sm text-left border rounded-lg transition-colors ${
                      setupConditions.technicalConditions?.includes(condition)
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            {getFieldError('technicalConditions') && (
              <p className="text-sm text-red-600 mt-2">{getFieldError('technicalConditions')?.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fundamental Conditions (Optional) */}
      {(data.methodology === 'Fundamental' || data.methodology === 'Hybrid') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Fundamental Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fundamental Setup Requirements</Label>
              <p className="text-sm text-gray-600 mb-3">
                Define fundamental conditions that support your technical analysis
              </p>
              
              {/* Current fundamental conditions */}
              {setupConditions.fundamentalConditions && setupConditions.fundamentalConditions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {setupConditions.fundamentalConditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center">
                      {condition}
                      <button
                        onClick={() => removeFundamentalCondition(index)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add custom fundamental condition */}
              <div className="flex space-x-2 mb-3">
                <Input
                  value={newFundamentalCondition}
                  onChange={(e) => setNewFundamentalCondition(e.target.value)}
                  placeholder="Add custom fundamental condition"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFundamentalCondition(newFundamentalCondition);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addFundamentalCondition(newFundamentalCondition)}
                  disabled={!newFundamentalCondition}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Common fundamental conditions */}
              <div>
                <Label className="text-sm">Common Fundamental Conditions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {commonFundamentalConditions.map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => addFundamentalCondition(condition)}
                      disabled={setupConditions.fundamentalConditions?.includes(condition)}
                      className={`p-2 text-sm text-left border rounded-lg transition-colors ${
                        setupConditions.fundamentalConditions?.includes(condition)
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volatility Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Volatility Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Preferred Volatility Environment</Label>
            <p className="text-sm text-gray-600 mb-3">
              Specify the volatility conditions that work best for this strategy
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {volatilityLevels.map((level) => {
                const isSelected = setupConditions.volatilityRequirements === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSetupConditionsUpdate({ volatilityRequirements: level })}
                    className={`p-3 text-sm text-left border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>

            {/* Custom volatility requirement */}
            <div className="mt-3">
              <Input
                value={setupConditions.volatilityRequirements || ''}
                onChange={(e) => handleSetupConditionsUpdate({ volatilityRequirements: e.target.value })}
                placeholder="Or describe custom volatility requirements"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Summary */}
      {setupConditions.marketEnvironment && setupConditions.technicalConditions?.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">Setup Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-blue-900">Market Environment:</span>
                <p className="text-blue-800 mt-1">{setupConditions.marketEnvironment}</p>
              </div>
              
              <div>
                <span className="font-medium text-blue-900">Technical Conditions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {setupConditions.technicalConditions.map((condition, index) => (
                    <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>

              {setupConditions.fundamentalConditions && setupConditions.fundamentalConditions.length > 0 && (
                <div>
                  <span className="font-medium text-blue-900">Fundamental Conditions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {setupConditions.fundamentalConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {setupConditions.volatilityRequirements && (
                <div>
                  <span className="font-medium text-blue-900">Volatility:</span>
                  <p className="text-blue-800 mt-1">{setupConditions.volatilityRequirements}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
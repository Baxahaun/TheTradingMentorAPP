import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Calculator, Layers } from 'lucide-react';

import { ProfessionalStrategy, METHODOLOGY_TYPES, ValidationResult } from '@/types/strategy';

interface MethodologySelectorProps {
  data: Partial<ProfessionalStrategy>;
  onChange: (updates: Partial<ProfessionalStrategy>) => void;
  validation?: ValidationResult;
  isValidating?: boolean;
}

const methodologyInfo = {
  Technical: {
    icon: TrendingUp,
    description: 'Based on price action, chart patterns, and technical indicators',
    examples: ['Moving averages', 'Support/resistance', 'Candlestick patterns', 'RSI/MACD'],
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  Fundamental: {
    icon: BarChart3,
    description: 'Based on economic data, company financials, and market fundamentals',
    examples: ['Economic indicators', 'Earnings reports', 'Interest rates', 'Market sentiment'],
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  Quantitative: {
    icon: Calculator,
    description: 'Based on mathematical models and statistical analysis',
    examples: ['Statistical arbitrage', 'Mean reversion models', 'Machine learning', 'Algorithmic signals'],
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  Hybrid: {
    icon: Layers,
    description: 'Combines multiple methodologies for comprehensive analysis',
    examples: ['Technical + Fundamental', 'Quant + Technical', 'Multi-timeframe analysis'],
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
};

const timeframeOptions = [
  { value: '1M', label: '1 Minute' },
  { value: '5M', label: '5 Minutes' },
  { value: '15M', label: '15 Minutes' },
  { value: '30M', label: '30 Minutes' },
  { value: '1H', label: '1 Hour' },
  { value: '4H', label: '4 Hours' },
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
  { value: '1MO', label: '1 Month' }
];

const assetClassOptions = [
  'Forex',
  'Indices',
  'Commodities',
  'Cryptocurrencies',
  'Stocks',
  'Bonds',
  'Options',
  'Futures'
];

const colorOptions = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export const MethodologySelector: React.FC<MethodologySelectorProps> = ({
  data,
  onChange,
  validation,
  isValidating
}) => {
  const handleInputChange = (field: keyof ProfessionalStrategy, value: any) => {
    onChange({ [field]: value });
  };

  const handleAssetClassToggle = (assetClass: string) => {
    const currentClasses = data.assetClasses || [];
    const newClasses = currentClasses.includes(assetClass)
      ? currentClasses.filter(c => c !== assetClass)
      : [...currentClasses, assetClass];
    
    handleInputChange('assetClasses', newClasses);
  };

  const getFieldError = (field: string) => {
    return validation?.errors?.find(error => error.field === field);
  };

  const getFieldWarning = (field: string) => {
    return validation?.warnings?.find(warning => warning.field === field);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Strategy Title *</Label>
            <Input
              id="title"
              value={data.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a descriptive strategy name"
              className={getFieldError('title') ? 'border-red-500' : ''}
            />
            {getFieldError('title') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('title')?.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={data.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your strategy's purpose and approach"
              rows={3}
              className={getFieldError('description') ? 'border-red-500' : ''}
            />
            {getFieldError('description') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('description')?.message}</p>
            )}
          </div>

          <div>
            <Label>Strategy Color</Label>
            <div className="flex space-x-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    data.color === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleInputChange('color', color)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trading Methodology *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {METHODOLOGY_TYPES.map((methodology) => {
              const info = methodologyInfo[methodology];
              const Icon = info.icon;
              const isSelected = data.methodology === methodology;

              return (
                <div
                  key={methodology}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('methodology', methodology)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <h3 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {methodology}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {info.examples.slice(0, 2).map((example) => (
                      <Badge key={example} variant="outline" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                    {info.examples.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{info.examples.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {getFieldError('methodology') && (
            <p className="text-sm text-red-600 mt-2">{getFieldError('methodology')?.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Timeframe and Asset Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Primary Timeframe *</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={data.primaryTimeframe || ''} 
              onValueChange={(value) => handleInputChange('primaryTimeframe', value)}
            >
              <SelectTrigger className={getFieldError('primaryTimeframe') ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select primary timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError('primaryTimeframe') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('primaryTimeframe')?.message}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              The main timeframe you'll use for analysis and entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset Classes *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {assetClassOptions.map((assetClass) => {
                const isSelected = data.assetClasses?.includes(assetClass);
                return (
                  <button
                    key={assetClass}
                    type="button"
                    onClick={() => handleAssetClassToggle(assetClass)}
                    className={`p-2 text-sm border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {assetClass}
                  </button>
                );
              })}
            </div>
            {getFieldError('assetClasses') && (
              <p className="text-sm text-red-600 mt-2">{getFieldError('assetClasses')?.message}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Select all asset classes this strategy applies to
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Preview */}
      {data.title && data.methodology && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-base">Strategy Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: data.color }}
              >
                {React.createElement(methodologyInfo[data.methodology!].icon, {
                  className: "w-6 h-6 text-white"
                })}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{data.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">{data.methodology}</Badge>
                  {data.primaryTimeframe && (
                    <Badge variant="outline">{data.primaryTimeframe}</Badge>
                  )}
                  {data.assetClasses && data.assetClasses.length > 0 && (
                    <Badge variant="outline">
                      {data.assetClasses.length} asset{data.assetClasses.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {data.description && (
              <p className="text-sm text-gray-600 mt-3">{data.description}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

import { ProfessionalStrategy, ValidationResult } from '@/types/strategy';

interface EntryTriggersBuilderProps {
  data: Partial<ProfessionalStrategy>;
  onChange: (updates: Partial<ProfessionalStrategy>) => void;
  validation?: ValidationResult;
  isValidating?: boolean;
}

const commonPrimarySignals = [
  'Breakout above resistance',
  'Breakout below support',
  'Bullish candlestick pattern',
  'Bearish candlestick pattern',
  'Moving average crossover',
  'RSI oversold bounce',
  'RSI overbought rejection',
  'MACD signal line cross',
  'Volume spike confirmation',
  'Trend line break',
  'Flag/pennant breakout',
  'Double top/bottom pattern',
  'Head and shoulders pattern',
  'Fibonacci retracement level',
  'Support/resistance retest'
];

const commonConfirmationSignals = [
  'Volume confirmation',
  'Momentum indicator alignment',
  'Multiple timeframe confirmation',
  'Price action confirmation',
  'Candlestick pattern confirmation',
  'Moving average support/resistance',
  'RSI divergence',
  'MACD histogram confirmation',
  'Bollinger Band squeeze release',
  'ATR expansion',
  'Market structure confirmation',
  'Sector/correlation confirmation',
  'News/fundamental catalyst',
  'Time-based confirmation',
  'Risk-reward ratio met'
];

const timingCriteriaOptions = [
  'Immediate on signal',
  'Wait for candle close',
  'Wait for retest',
  'Market open only',
  'Session overlap periods',
  'Avoid news times',
  'End of session entries',
  'Specific time windows',
  'After pullback completion',
  'On momentum confirmation'
];

const entryMethodOptions = [
  { value: 'market', label: 'Market Order', description: 'Enter immediately at market price' },
  { value: 'limit', label: 'Limit Order', description: 'Enter at specific price level' },
  { value: 'stop', label: 'Stop Order', description: 'Enter on breakout/breakdown' },
  { value: 'stop_limit', label: 'Stop-Limit Order', description: 'Combination of stop and limit' }
];

export const EntryTriggersBuilder: React.FC<EntryTriggersBuilderProps> = ({
  data,
  onChange,
  validation,
  isValidating
}) => {
  const [newConfirmationSignal, setNewConfirmationSignal] = useState('');

  const entryTriggers = data.entryTriggers || {
    primarySignal: '',
    confirmationSignals: [],
    timingCriteria: ''
  };

  const handleEntryTriggersUpdate = (updates: Partial<typeof entryTriggers>) => {
    const newEntryTriggers = { ...entryTriggers, ...updates };
    onChange({ entryTriggers: newEntryTriggers });
  };

  const addConfirmationSignal = (signal: string) => {
    if (signal && !entryTriggers.confirmationSignals?.includes(signal)) {
      const newSignals = [...(entryTriggers.confirmationSignals || []), signal];
      handleEntryTriggersUpdate({ confirmationSignals: newSignals });
      setNewConfirmationSignal('');
    }
  };

  const removeConfirmationSignal = (index: number) => {
    const newSignals = entryTriggers.confirmationSignals?.filter((_, i) => i !== index) || [];
    handleEntryTriggersUpdate({ confirmationSignals: newSignals });
  };

  const getFieldError = (field: string) => {
    return validation?.errors?.find(error => error.field === field);
  };

  const getFieldWarning = (field: string) => {
    return validation?.warnings?.find(warning => warning.field === field);
  };

  return (
    <div className="space-y-6">
      {/* Primary Entry Signal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Primary Entry Signal *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primarySignal">Main Entry Trigger</Label>
            <Textarea
              id="primarySignal"
              value={entryTriggers.primarySignal}
              onChange={(e) => handleEntryTriggersUpdate({ primarySignal: e.target.value })}
              placeholder="Describe the main signal that triggers your entry (e.g., 'Breakout above daily resistance with volume confirmation')"
              rows={3}
              className={getFieldError('primarySignal') ? 'border-red-500' : ''}
            />
            {getFieldError('primarySignal') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('primarySignal')?.message}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              This should be the most important signal that initiates your trade entry
            </p>
          </div>

          <div>
            <Label>Common Primary Signals</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {commonPrimarySignals.map((signal) => (
                <button
                  key={signal}
                  type="button"
                  onClick={() => handleEntryTriggersUpdate({ primarySignal: signal })}
                  className="p-2 text-sm text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {signal}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Confirmation Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Additional Confirmation Required</Label>
            <p className="text-sm text-gray-600 mb-3">
              Add signals that must confirm your primary entry signal before taking the trade
            </p>
            
            {/* Current confirmation signals */}
            {entryTriggers.confirmationSignals && entryTriggers.confirmationSignals.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {entryTriggers.confirmationSignals.map((signal, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center">
                    {signal}
                    <button
                      onClick={() => removeConfirmationSignal(index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add custom confirmation signal */}
            <div className="flex space-x-2 mb-3">
              <Input
                value={newConfirmationSignal}
                onChange={(e) => setNewConfirmationSignal(e.target.value)}
                placeholder="Add custom confirmation signal"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addConfirmationSignal(newConfirmationSignal);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addConfirmationSignal(newConfirmationSignal)}
                disabled={!newConfirmationSignal}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Common confirmation signals */}
            <div>
              <Label className="text-sm">Common Confirmation Signals</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {commonConfirmationSignals.map((signal) => (
                  <button
                    key={signal}
                    type="button"
                    onClick={() => addConfirmationSignal(signal)}
                    disabled={entryTriggers.confirmationSignals?.includes(signal)}
                    className={`p-2 text-sm text-left border rounded-lg transition-colors ${
                      entryTriggers.confirmationSignals?.includes(signal)
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {signal}
                  </button>
                ))}
              </div>
            </div>

            {getFieldWarning('confirmationSignals') && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">{getFieldWarning('confirmationSignals')?.message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timing Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Timing Criteria *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timingCriteria">Entry Timing Requirements</Label>
            <Textarea
              id="timingCriteria"
              value={entryTriggers.timingCriteria}
              onChange={(e) => handleEntryTriggersUpdate({ timingCriteria: e.target.value })}
              placeholder="Specify when to enter after signals are confirmed (e.g., 'Enter immediately on signal confirmation' or 'Wait for candle close above resistance')"
              rows={2}
              className={getFieldError('timingCriteria') ? 'border-red-500' : ''}
            />
            {getFieldError('timingCriteria') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('timingCriteria')?.message}</p>
            )}
          </div>

          <div>
            <Label>Common Timing Approaches</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {timingCriteriaOptions.map((criteria) => (
                <button
                  key={criteria}
                  type="button"
                  onClick={() => handleEntryTriggersUpdate({ timingCriteria: criteria })}
                  className="p-2 text-sm text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {criteria}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entry Execution Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entryMethodOptions.map((method) => {
              const isSelected = data.entryMethod === method.value;
              return (
                <div
                  key={method.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onChange({ entryMethod: method.value })}
                >
                  <h4 className={`font-medium mb-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {method.label}
                  </h4>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Entry Checklist */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-base text-green-900">Entry Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                entryTriggers.primarySignal ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}>
                {entryTriggers.primarySignal && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className={entryTriggers.primarySignal ? 'text-green-800' : 'text-gray-600'}>
                Primary signal defined
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                entryTriggers.confirmationSignals && entryTriggers.confirmationSignals.length > 0 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-300'
              }`}>
                {entryTriggers.confirmationSignals && entryTriggers.confirmationSignals.length > 0 && 
                  <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className={
                entryTriggers.confirmationSignals && entryTriggers.confirmationSignals.length > 0 
                  ? 'text-green-800' 
                  : 'text-gray-600'
              }>
                Confirmation signals added ({entryTriggers.confirmationSignals?.length || 0})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                entryTriggers.timingCriteria ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}>
                {entryTriggers.timingCriteria && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className={entryTriggers.timingCriteria ? 'text-green-800' : 'text-gray-600'}>
                Timing criteria specified
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Summary */}
      {entryTriggers.primarySignal && entryTriggers.timingCriteria && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">Entry Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-blue-900">Primary Signal:</span>
                <p className="text-blue-800 mt-1">{entryTriggers.primarySignal}</p>
              </div>
              
              {entryTriggers.confirmationSignals && entryTriggers.confirmationSignals.length > 0 && (
                <div>
                  <span className="font-medium text-blue-900">Confirmation Required:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entryTriggers.confirmationSignals.map((signal, index) => (
                      <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-medium text-blue-900">Timing:</span>
                <p className="text-blue-800 mt-1">{entryTriggers.timingCriteria}</p>
              </div>

              {data.entryMethod && (
                <div>
                  <span className="font-medium text-blue-900">Execution Method:</span>
                  <p className="text-blue-800 mt-1">
                    {entryMethodOptions.find(m => m.value === data.entryMethod)?.label}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, TrendingUp, TrendingDown, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import {
  Trade,
  PartialClose,
  PositionEvent,
  PositionSummary,
} from '../types/trade';
import { positionManagementService } from '../lib/positionManagementService';

interface PartialCloseManagementPanelProps {
  trade: Trade;
  onPartialClose: (partialClose: PartialClose) => void;
  onUpdateTrade?: (updates: Partial<Trade>) => void;
  className?: string;
}

const PARTIAL_CLOSE_REASONS = [
  { value: 'profit_taking', label: 'Profit Taking', icon: TrendingUp, color: 'text-green-600' },
  { value: 'risk_reduction', label: 'Risk Reduction', icon: AlertTriangle, color: 'text-yellow-600' },
  { value: 'trailing_stop', label: 'Trailing Stop', icon: TrendingDown, color: 'text-blue-600' },
  { value: 'manual', label: 'Manual Exit', icon: Clock, color: 'text-gray-600' },
  { value: 'other', label: 'Other', icon: DollarSign, color: 'text-purple-600' },
] as const;

export const PartialCloseManagementPanel: React.FC<PartialCloseManagementPanelProps> = ({
  trade,
  onPartialClose,
  onUpdateTrade,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddPartialClose, setShowAddPartialClose] = useState(false);
  const [partialCloseForm, setPartialCloseForm] = useState({
    lotSize: '',
    price: '',
    reason: 'profit_taking' as const,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Calculate position summary
  const positionSummary: PositionSummary = positionManagementService.calculateRemainingPosition(trade);
  
  // Generate position timeline
  const positionTimeline: PositionEvent[] = positionManagementService.generatePositionTimeline(trade);
  
  // Calculate position management score
  const managementScore = positionManagementService.calculatePositionManagementScore(trade);

  // Reset form when dialog closes
  useEffect(() => {
    if (!showAddPartialClose) {
      setPartialCloseForm({
        lotSize: '',
        price: '',
        reason: 'profit_taking',
        notes: '',
      });
      setFormErrors([]);
    }
  }, [showAddPartialClose]);

  // Validate partial close form
  const validatePartialCloseForm = (): boolean => {
    const errors: string[] = [];

    if (!partialCloseForm.lotSize || parseFloat(partialCloseForm.lotSize) <= 0) {
      errors.push('Lot size must be greater than 0');
    }

    if (!partialCloseForm.price || parseFloat(partialCloseForm.price) <= 0) {
      errors.push('Price must be greater than 0');
    }

    const lotSize = parseFloat(partialCloseForm.lotSize);
    if (lotSize && lotSize > positionSummary.totalLots) {
      errors.push(`Lot size cannot exceed remaining position (${positionSummary.totalLots})`);
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  // Handle partial close submission
  const handleSubmitPartialClose = () => {
    if (!validatePartialCloseForm()) {
      return;
    }

    const lotSize = parseFloat(partialCloseForm.lotSize);
    const price = parseFloat(partialCloseForm.price);

    // Calculate P&L for this partial close
    const priceDifference = trade.side === 'long' ? price - trade.entryPrice : trade.entryPrice - price;
    const pnlRealized = priceDifference * lotSize * (trade.pipValue || 10); // Simplified calculation

    try {
      const partialClose = positionManagementService.addPartialClose(trade, {
        timestamp: new Date().toISOString(),
        lotSize,
        price,
        reason: partialCloseForm.reason,
        pnlRealized,
        notes: partialCloseForm.notes || undefined,
      });

      onPartialClose(partialClose);
      setShowAddPartialClose(false);
    } catch (error) {
      setFormErrors([error instanceof Error ? error.message : 'Failed to add partial close']);
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: trade.accountCurrency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get timeline event icon
  const getTimelineEventIcon = (event: PositionEvent) => {
    switch (event.type) {
      case 'entry':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'partial_close':
        return <TrendingDown className="w-3 h-3 text-blue-600" />;
      case 'full_close':
        return <X className="w-3 h-3 text-red-600" />;
      default:
        return <Clock className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <h3 className="font-medium text-gray-900">Position Management</h3>
          {trade.partialCloses && trade.partialCloses.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {trade.partialCloses.length} partial{trade.partialCloses.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {managementScore > 0 && (
            <Badge 
              variant={managementScore >= 70 ? 'default' : managementScore >= 40 ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {managementScore}% efficiency
            </Badge>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Position Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Current Position</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <Label className="text-xs text-gray-600">Remaining Lots</Label>
                <div className="font-medium">{positionSummary.totalLots.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Avg Entry</Label>
                <div className="font-medium">{positionSummary.averageEntryPrice.toFixed(5)}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Realized P&L</Label>
                <div className={`font-medium ${positionSummary.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(positionSummary.realizedPnL)}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Current R</Label>
                <div className={`font-medium ${positionSummary.currentRMultiple >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {positionSummary.currentRMultiple.toFixed(2)}R
                </div>
              </div>
            </div>
          </div>

          {/* Add Partial Close Button */}
          {trade.status === 'open' && positionSummary.totalLots > 0 && (
            <div className="flex justify-between items-center">
              <Label>Partial Closes</Label>
              <Dialog open={showAddPartialClose} onOpenChange={setShowAddPartialClose}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Partial Close
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Partial Close</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {formErrors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1">
                            {formErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="partialLotSize">Lot Size *</Label>
                        <Input
                          id="partialLotSize"
                          type="number"
                          step="0.01"
                          max={positionSummary.totalLots}
                          value={partialCloseForm.lotSize}
                          onChange={(e) => setPartialCloseForm(prev => ({ ...prev, lotSize: e.target.value }))}
                          placeholder="0.10"
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Max: {positionSummary.totalLots.toFixed(2)} lots
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="partialPrice">Exit Price *</Label>
                        <Input
                          id="partialPrice"
                          type="number"
                          step="0.00001"
                          value={partialCloseForm.price}
                          onChange={(e) => setPartialCloseForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="1.05420"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="partialReason">Reason *</Label>
                      <select
                        id="partialReason"
                        value={partialCloseForm.reason}
                        onChange={(e) => setPartialCloseForm(prev => ({ ...prev, reason: e.target.value as any }))}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        {PARTIAL_CLOSE_REASONS.map(reason => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="partialNotes">Notes</Label>
                      <Textarea
                        id="partialNotes"
                        value={partialCloseForm.notes}
                        onChange={(e) => setPartialCloseForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about this partial close..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddPartialClose(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmitPartialClose}
                      >
                        Add Partial Close
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Partial Closes List */}
          {trade.partialCloses && trade.partialCloses.length > 0 && (
            <div className="space-y-2">
              {trade.partialCloses.map((partialClose, index) => {
                const reasonConfig = PARTIAL_CLOSE_REASONS.find(r => r.value === partialClose.reason);
                const ReasonIcon = reasonConfig?.icon || Clock;
                
                return (
                  <div
                    key={partialClose.id}
                    className="border border-gray-200 rounded-lg p-3 bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <ReasonIcon className={`w-4 h-4 ${reasonConfig?.color || 'text-gray-600'}`} />
                          <span className="font-medium text-sm">
                            Partial Close #{index + 1}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {partialClose.lotSize.toFixed(2)} lots
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <Label className="text-xs text-gray-600">Price</Label>
                            <div className="font-medium">{partialClose.price.toFixed(5)}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">P&L</Label>
                            <div className={`font-medium ${partialClose.pnlRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(partialClose.pnlRealized)}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Remaining</Label>
                            <div className="font-medium">{partialClose.remainingLots.toFixed(2)} lots</div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Time</Label>
                            <div className="font-medium text-xs">
                              {new Date(partialClose.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {partialClose.notes && (
                          <p className="text-xs text-gray-600 mt-2">{partialClose.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Position Timeline */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">Position Timeline</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {positionTimeline.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
                >
                  <div className="flex-shrink-0">
                    {getTimelineEventIcon(event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">
                          {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-gray-600 ml-2">
                          {Math.abs(event.lotSize).toFixed(2)} lots @ {event.price.toFixed(5)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      Position: {event.totalPosition.toFixed(2)} lots
                      {event.averagePrice > 0 && (
                        <span className="ml-2">
                          Avg: {event.averagePrice.toFixed(5)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Position Management Score */}
          {managementScore > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  Position Management Score: {managementScore}%
                </span>
              </div>
              <p className="text-xs text-orange-700 mt-1">
                {managementScore >= 80 
                  ? 'Excellent position management - optimal exit strategy'
                  : managementScore >= 60
                  ? 'Good position management - effective partial closes'
                  : managementScore >= 40
                  ? 'Average position management - room for improvement'
                  : 'Poor position management - consider reviewing exit strategy'
                }
              </p>
              <div className="mt-2 text-xs text-orange-600">
                Realized P&L: {formatCurrency(positionSummary.realizedPnL)} | 
                Remaining: {positionSummary.totalLots.toFixed(2)} lots |
                Current R: {positionSummary.currentRMultiple.toFixed(2)}R
              </div>
            </div>
          )}

          {/* Risk Metrics Update */}
          {positionSummary.totalLots !== trade.lotSize && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Position size has changed due to partial closes. 
                Current risk exposure: {formatCurrency(positionSummary.riskAmount)} 
                ({formatPercentage((positionSummary.totalLots / trade.lotSize - 1) * 100)} from original)
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
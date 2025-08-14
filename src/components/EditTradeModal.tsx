import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTradeContext } from '../contexts/TradeContext';
import { Trade, TradeSetup, TradePattern, PartialClose } from '../types/trade';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SetupClassificationPanel } from './SetupClassificationPanel';
import { PatternRecognitionPanel } from './PatternRecognitionPanel';
import { PartialCloseManagementPanel } from './PartialCloseManagementPanel';
import { toast } from '../hooks/use-toast';

interface EditTradeModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditTradeModal: React.FC<EditTradeModalProps> = ({
  trade,
  isOpen,
  onClose,
}) => {
  const { updateTrade } = useTradeContext();
  const [formData, setFormData] = useState<Partial<Trade>>({});
  
  // Enhanced features state
  const [tradeSetup, setTradeSetup] = useState<TradeSetup | undefined>(undefined);
  const [tradePatterns, setTradePatterns] = useState<TradePattern[]>([]);
  const [showEnhancedFeatures, setShowEnhancedFeatures] = useState(false);
  const [showPositionManagement, setShowPositionManagement] = useState(false);

  useEffect(() => {
    if (trade) {
      setFormData({ ...trade });
      setTradeSetup(trade.setup);
      setTradePatterns(trade.patterns || []);
      // Show enhanced features if they exist
      setShowEnhancedFeatures(!!(trade.setup || (trade.patterns && trade.patterns.length > 0)));
      // Show position management for open trades or trades with partial closes
      setShowPositionManagement(trade.status === 'open' || !!(trade.partialCloses && trade.partialCloses.length > 0));
    }
  }, [trade]);

  if (!trade) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    try {
      const updatedTrade = {
        ...trade,
        ...formData,
        entryPrice: Number(formData.entryPrice),
        exitPrice: formData.exitPrice ? Number(formData.exitPrice) : undefined,
        lotSize: Number(formData.lotSize || formData.quantity), // Support both field names
        stopLoss: formData.stopLoss ? Number(formData.stopLoss) : undefined,
        takeProfit: formData.takeProfit ? Number(formData.takeProfit) : undefined,
        commission: formData.commission ? Number(formData.commission) : undefined,
        confidence: formData.confidence ? Number(formData.confidence) : undefined,
        // Enhanced features
        setup: tradeSetup,
        patterns: tradePatterns.length > 0 ? tradePatterns : undefined,
      };

      // Remove undefined values for Firebase
      const cleanedTrade = Object.fromEntries(
        Object.entries(updatedTrade).filter(([_, value]) => value !== undefined)
      );

      // Calculate P&L if both prices exist
      if (cleanedTrade.entryPrice && cleanedTrade.exitPrice && cleanedTrade.lotSize) {
        const priceChange = cleanedTrade.side === 'long' 
          ? cleanedTrade.exitPrice - cleanedTrade.entryPrice
          : cleanedTrade.entryPrice - cleanedTrade.exitPrice;
        cleanedTrade.pnl = priceChange * cleanedTrade.lotSize - (cleanedTrade.commission || 0);
      }

      console.log('Updating trade with:', cleanedTrade);
      await updateTrade(cleanedTrade.id, cleanedTrade);
      
      // Create success message with enhanced features info
      let description = `${cleanedTrade.currencyPair || cleanedTrade.symbol} trade updated successfully`;
      
      if (cleanedTrade.setup || (cleanedTrade.patterns && cleanedTrade.patterns.length > 0)) {
        const features = [];
        if (cleanedTrade.setup) features.push('setup classification');
        if (cleanedTrade.patterns && cleanedTrade.patterns.length > 0) features.push(`${cleanedTrade.patterns.length} pattern${cleanedTrade.patterns.length !== 1 ? 's' : ''}`);
        description += ` with ${features.join(' and ')}`;
      }
      
      toast({
        title: "Trade Updated Successfully! ✅",
        description,
      });
      
      console.log('Trade updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update trade:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle partial close addition
  const handlePartialClose = (partialClose: PartialClose) => {
    const updatedPartialCloses = [...(trade?.partialCloses || []), partialClose];
    const updatedTrade = {
      ...trade,
      partialCloses: updatedPartialCloses,
    };
    
    // Update the trade immediately
    updateTrade(trade!.id, updatedTrade);
    
    toast({
      title: "Partial Close Added",
      description: `${partialClose.lotSize} lots closed at ${partialClose.price}`,
    });
  };

  const handleChange = (field: string, value: string | number | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Trade: {trade.currencyPair || trade.symbol}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currencyPair">Currency Pair</Label>
              <Input
                id="currencyPair"
                value={formData.currencyPair || formData.symbol || ''}
                onChange={(e) => handleChange('currencyPair', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="side">Side</Label>
              <Select value={formData.side} onValueChange={(value) => handleChange('side', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="timeIn">Time In</Label>
              <Input
                id="timeIn"
                type="time"
                value={formData.timeIn || ''}
                onChange={(e) => handleChange('timeIn', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="timeOut">Time Out</Label>
              <Input
                id="timeOut"
                type="time"
                value={formData.timeOut || ''}
                onChange={(e) => handleChange('timeOut', e.target.value)}
              />
            </div>
          </div>

          {/* Prices and Quantity */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.01"
                value={formData.entryPrice || ''}
                onChange={(e) => handleChange('entryPrice', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.01"
                value={formData.exitPrice || ''}
                onChange={(e) => handleChange('exitPrice', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lotSize">Lot Size</Label>
              <Input
                id="lotSize"
                type="number"
                step="0.01"
                value={formData.lotSize || formData.quantity || ''}
                onChange={(e) => handleChange('lotSize', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Risk Management */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.01"
                value={formData.stopLoss || ''}
                onChange={(e) => handleChange('stopLoss', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="takeProfit">Take Profit</Label>
              <Input
                id="takeProfit"
                type="number"
                step="0.01"
                value={formData.takeProfit || ''}
                onChange={(e) => handleChange('takeProfit', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="commission">Commission</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                value={formData.commission || ''}
                onChange={(e) => handleChange('commission', e.target.value)}
              />
            </div>
          </div>

          {/* Strategy and Notes */}
          <div>
            <Label htmlFor="strategy">Strategy</Label>
            <Input
              id="strategy"
              value={formData.strategy || ''}
              onChange={(e) => handleChange('strategy', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Psychology */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="confidence">Confidence (1-10)</Label>
              <Input
                id="confidence"
                type="number"
                min="1"
                max="10"
                value={formData.confidence || ''}
                onChange={(e) => handleChange('confidence', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emotions">Emotions</Label>
              <Input
                id="emotions"
                value={formData.emotions || ''}
                onChange={(e) => handleChange('emotions', e.target.value)}
              />
            </div>
          </div>

          {/* Enhanced Classification Features */}
          <div className="space-y-4 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowEnhancedFeatures(!showEnhancedFeatures)}
              className="flex items-center text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
            >
              {showEnhancedFeatures ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              Enhanced Trade Classification
              {(tradeSetup || tradePatterns.length > 0) && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>
            
            {showEnhancedFeatures && (
              <div className="space-y-4">
                {/* Setup Classification Panel */}
                <SetupClassificationPanel
                  setup={tradeSetup}
                  onChange={setTradeSetup}
                  className="bg-gray-50"
                />

                {/* Pattern Recognition Panel */}
                <PatternRecognitionPanel
                  patterns={tradePatterns}
                  onChange={setTradePatterns}
                  className="bg-gray-50"
                />
              </div>
            )}
          </div>

          {/* Position Management - Only show for open trades or trades with partial closes */}
          {(trade?.status === 'open' || (trade?.partialCloses && trade.partialCloses.length > 0)) && (
            <div className="space-y-4 border-t pt-4">
              <button
                type="button"
                onClick={() => setShowPositionManagement(!showPositionManagement)}
                className="flex items-center text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors"
              >
                {showPositionManagement ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                Position Management
                {trade?.partialCloses && trade.partialCloses.length > 0 && (
                  <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {trade.partialCloses.length} partial{trade.partialCloses.length !== 1 ? 's' : ''}
                  </span>
                )}
              </button>
              
              {showPositionManagement && trade && (
                <PartialCloseManagementPanel
                  trade={trade}
                  onPartialClose={handlePartialClose}
                  className="bg-gray-50"
                />
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Trade
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTradeModal;
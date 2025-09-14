import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
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
import { TagInput } from './ui/tag-input';
import { tagService } from '../lib/tagService';
import { useTagValidation } from '../hooks/useTagValidation';
import { toast } from '../hooks/use-toast';
import { CURRENT_TERMINOLOGY } from '../lib/terminologyConfig';

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
  const { updateTrade, trades } = useTradeContext();
  const [formData, setFormData] = useState<Partial<Trade>>({});
  
  // Enhanced features state
  const [tradeSetup, setTradeSetup] = useState<TradeSetup | undefined>(undefined);
  const [tradePatterns, setTradePatterns] = useState<TradePattern[]>([]);
  const [showEnhancedFeatures, setShowEnhancedFeatures] = useState(false);
  const [showPositionManagement, setShowPositionManagement] = useState(false);
  
  // Tags state with change tracking
  const [tags, setTags] = useState<string[]>([]);
  const [originalTags, setOriginalTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagChanges, setTagChanges] = useState<{
    added: string[];
    removed: string[];
    modified: boolean;
  }>({ added: [], removed: [], modified: false });
  
  // Tag validation
  const { validationState, validateTags, clearValidation } = useTagValidation({
    validateOnChange: true,
    showWarnings: true,
    maxTags: 10
  });
  
  // Track if tags have been modified for persistence
  const tagsModifiedRef = useRef(false);

  useEffect(() => {
    if (trade) {
      setFormData({ ...trade });
      setTradeSetup(trade.setup);
      setTradePatterns(trade.patterns || []);
      
      // Initialize tags with change tracking
      const tradeTags = trade.tags || [];
      setTags(tradeTags);
      setOriginalTags([...tradeTags]);
      setTagChanges({ added: [], removed: [], modified: false });
      tagsModifiedRef.current = false;
      clearValidation();
      
      // Show enhanced features if they exist
      setShowEnhancedFeatures(!!(trade.setup || (trade.patterns && trade.patterns.length > 0)));
      // Show position management for open trades or trades with partial closes
      setShowPositionManagement(trade.status === 'open' || !!(trade.partialCloses && trade.partialCloses.length > 0));
    }
  }, [trade, clearValidation]);

  // Load tag suggestions
  useEffect(() => {
    if (trades && trades.length > 0) {
      const suggestions = tagService.getTagSuggestions(trades, '', 20);
      setTagSuggestions(suggestions);
    }
  }, [trades]);

  // Track tag changes for modification history
  const handleTagsChange = useCallback((newTags: string[]) => {
    setTags(newTags);
    tagsModifiedRef.current = true;
    
    // Calculate changes
    const added = newTags.filter(tag => !originalTags.includes(tag));
    const removed = originalTags.filter(tag => !newTags.includes(tag));
    const modified = added.length > 0 || removed.length > 0;
    
    setTagChanges({ added, removed, modified });
    
    // Validate tags on change
    validateTags(newTags);
  }, [originalTags, validateTags]);

  // Reset tag changes when modal closes
  const handleClose = useCallback(() => {
    setTagChanges({ added: [], removed: [], modified: false });
    tagsModifiedRef.current = false;
    clearValidation();
    onClose();
  }, [onClose, clearValidation]);

  if (!trade) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    // Validate tags before submission
    const tagValidation = validateTags(tags);
    if (!tagValidation.isValid) {
      toast({
        title: `Tag Validation Error`,
        description: tagValidation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Process and validate tags with enhanced error handling
      let processedTags: string[] = [];
      if (tags.length > 0) {
        try {
          processedTags = tagService.processTags(tags);
          
          // Additional validation for processed tags
          const finalValidation = tagService.validateTags(processedTags);
          if (!finalValidation.isValid) {
            throw new Error(`Tag validation failed: ${finalValidation.errors.map(e => e.message).join(', ')}`);
          }
        } catch (tagError) {
          console.error('Tag processing error:', tagError);
          toast({
            title: "Tag Processing Error",
            description: tagError instanceof Error ? tagError.message : "Failed to process tags",
            variant: "destructive",
          });
          return;
        }
      }
      
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
        // Tags with proper handling
        tags: processedTags.length > 0 ? processedTags : undefined,
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
      
      // Attempt to update trade with retry logic for tag persistence
      let updateAttempts = 0;
      const maxAttempts = 3;
      
      while (updateAttempts < maxAttempts) {
        try {
          await updateTrade(cleanedTrade.id, cleanedTrade);
          break; // Success, exit retry loop
        } catch (updateError) {
          updateAttempts++;
          console.error(`Update attempt ${updateAttempts} failed:`, updateError);
          
          if (updateAttempts >= maxAttempts) {
            throw updateError; // Re-throw after max attempts
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, updateAttempts) * 1000));
        }
      }
      
      // Create success message with tag changes info
      let description = `${cleanedTrade.currencyPair || cleanedTrade.symbol} trade updated successfully`;
      
      // Add information about tag changes
      if (tagChanges.modified) {
        const changeInfo = [];
        if (tagChanges.added.length > 0) {
          changeInfo.push(`${tagChanges.added.length} tag${tagChanges.added.length !== 1 ? 's' : ''} added`);
        }
        if (tagChanges.removed.length > 0) {
          changeInfo.push(`${tagChanges.removed.length} tag${tagChanges.removed.length !== 1 ? 's' : ''} removed`);
        }
        if (changeInfo.length > 0) {
          description += ` (${changeInfo.join(', ')})`;
        }
      }
      
      if (cleanedTrade.setup || (cleanedTrade.patterns && cleanedTrade.patterns.length > 0)) {
        const features = [];
        if (cleanedTrade.setup) features.push('setup classification');
        if (cleanedTrade.patterns && cleanedTrade.patterns.length > 0) features.push(`${cleanedTrade.patterns.length} pattern${cleanedTrade.patterns.length !== 1 ? 's' : ''}`);
        description += ` with ${features.join(' and ')}`;
      }
      
      toast({
        title: `${CURRENT_TERMINOLOGY.instrumentLabel} Trade Updated Successfully! ✅`,
        description,
      });
      
      console.log('Trade updated successfully');
      handleClose();
    } catch (error) {
      console.error('Failed to update trade:', error);
      
      // Provide specific error messages for tag-related failures
      let errorMessage = "Failed to update trade. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('tag')) {
          errorMessage = `Tag error: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Trade Update Error",
        description: errorMessage,
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
      title: "Partial Position Close Added",
      description: `${partialClose.lotSize} ${CURRENT_TERMINOLOGY.positionSizeLabel.toLowerCase()} closed at ${partialClose.price}`,
    });
  };

  const handleChange = (field: string, value: string | number | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Trade: {trade.currencyPair || trade.symbol}</span>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currencyPair">{CURRENT_TERMINOLOGY.instrumentLabel}</Label>
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
              <Label htmlFor="lotSize">{CURRENT_TERMINOLOGY.positionSizeLabel}</Label>
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

          {/* Tags with validation and change tracking */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tags">Tags</Label>
              {tagChanges.modified && (
                <div className="flex items-center text-xs text-blue-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Modified
                </div>
              )}
            </div>
            
            <TagInput
              value={tags}
              onChange={handleTagsChange}
              suggestions={tagSuggestions}
              placeholder="Add tags to categorize this trade... (e.g., #breakout, #news, #confident)"
              maxTags={10}
              className="mt-1"
            />
            
            {/* Validation feedback */}
            {validationState.errors.length > 0 && (
              <div className="mt-1 text-xs text-red-600 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                <div>
                  {validationState.errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}
            
            {validationState.warnings.length > 0 && (
              <div className="mt-1 text-xs text-yellow-600 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                <div>
                  {validationState.warnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tag change summary */}
            {tagChanges.modified && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <div className="font-medium mb-1">Tag Changes:</div>
                {tagChanges.added.length > 0 && (
                  <div className="text-green-600">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Added: {tagChanges.added.join(', ')}
                  </div>
                )}
                {tagChanges.removed.length > 0 && (
                  <div className="text-red-600">
                    <X className="w-3 h-3 inline mr-1" />
                    Removed: {tagChanges.removed.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Use tags to categorize your trades for better organization and analysis
            </p>
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
            <Button type="button" variant="outline" onClick={handleClose}>
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
import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Trade } from '../../types/trade';
import { TagInput } from './tag-input';
import { TagDisplay } from './tag-display';
import { tagService } from '../../lib/tagService';

interface BulkTagEditorProps {
  selectedTrades: Trade[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (operation: BulkTagOperation) => Promise<void>;
}

export interface BulkTagOperation {
  type: 'add' | 'remove' | 'replace';
  tags: string[];
  tradeIds: string[];
}

export const BulkTagEditor: React.FC<BulkTagEditorProps> = ({
  selectedTrades,
  isOpen,
  onClose,
  onApply
}) => {
  const [operationType, setOperationType] = useState<'add' | 'remove' | 'replace'>('add');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [replacementTags, setReplacementTags] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get all unique tags from selected trades
  const existingTags = useMemo(() => {
    const allTags = new Set<string>();
    selectedTrades.forEach(trade => {
      trade.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [selectedTrades]);

  // Get common tags (tags present in all selected trades)
  const commonTags = useMemo(() => {
    if (selectedTrades.length === 0) return [];
    
    const firstTradeTags = new Set(selectedTrades[0].tags || []);
    return Array.from(firstTradeTags).filter(tag =>
      selectedTrades.every(trade => trade.tags?.includes(tag))
    );
  }, [selectedTrades]);

  // Get available tags for autocomplete
  const availableTags = useMemo(() => {
    // This would typically come from a global tag service
    // For now, we'll use the existing tags from selected trades
    return existingTags;
  }, [existingTags]);

  const handleConfirm = () => {
    setShowConfirmation(true);
  };

  const handleApply = async () => {
    if (selectedTrades.length === 0) return;

    setIsProcessing(true);
    setShowConfirmation(false);

    try {
      let tags: string[];
      switch (operationType) {
        case 'add':
          tags = tagsToAdd;
          break;
        case 'remove':
          tags = tagsToRemove;
          break;
        case 'replace':
          tags = replacementTags;
          break;
        default:
          tags = [];
      }

      const operation: BulkTagOperation = {
        type: operationType,
        tags,
        tradeIds: selectedTrades.map(trade => trade.id)
      };

      await onApply(operation);
      
      // Reset form
      setTagsToAdd([]);
      setTagsToRemove([]);
      setReplacementTags([]);
      onClose();
    } catch (error) {
      console.error('Error applying bulk tag operation:', error);
      // Error handling would be done by parent component
    } finally {
      setIsProcessing(false);
    }
  };

  const getOperationSummary = () => {
    const tradeCount = selectedTrades.length;
    switch (operationType) {
      case 'add':
        return `Add ${tagsToAdd.length} tag(s) to ${tradeCount} trade(s)`;
      case 'remove':
        return `Remove ${tagsToRemove.length} tag(s) from ${tradeCount} trade(s)`;
      case 'replace':
        return `Replace all tags with ${replacementTags.length} tag(s) on ${tradeCount} trade(s)`;
      default:
        return '';
    }
  };

  const getCurrentTags = () => {
    switch (operationType) {
      case 'add':
        return tagsToAdd;
      case 'remove':
        return tagsToRemove;
      case 'replace':
        return replacementTags;
      default:
        return [];
    }
  };

  const setCurrentTags = (tags: string[]) => {
    switch (operationType) {
      case 'add':
        setTagsToAdd(tags);
        break;
      case 'remove':
        setTagsToRemove(tags);
        break;
      case 'replace':
        setReplacementTags(tags);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Tag Editor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Selected Trades Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Selected Trades ({selectedTrades.length})
            </h3>
            <div className="text-sm text-blue-700">
              {selectedTrades.slice(0, 3).map(trade => trade.currencyPair).join(', ')}
              {selectedTrades.length > 3 && ` and ${selectedTrades.length - 3} more`}
            </div>
          </div>

          {/* Current Tags Overview */}
          {existingTags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Current Tags</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 mb-1 block">All tags in selection:</span>
                  <TagDisplay tags={existingTags} variant="compact" />
                </div>
                {commonTags.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 mb-1 block">Common tags (in all selected trades):</span>
                    <TagDisplay tags={commonTags} variant="compact" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Operation Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Operation</h3>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="operation"
                  value="add"
                  checked={operationType === 'add'}
                  onChange={(e) => setOperationType(e.target.value as 'add')}
                  className="mr-2"
                  disabled={isProcessing}
                />
                <Plus className="h-4 w-4 mr-1 text-green-600" />
                Add Tags
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="operation"
                  value="remove"
                  checked={operationType === 'remove'}
                  onChange={(e) => setOperationType(e.target.value as 'remove')}
                  className="mr-2"
                  disabled={isProcessing}
                />
                <Minus className="h-4 w-4 mr-1 text-red-600" />
                Remove Tags
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="operation"
                  value="replace"
                  checked={operationType === 'replace'}
                  onChange={(e) => setOperationType(e.target.value as 'replace')}
                  className="mr-2"
                  disabled={isProcessing}
                />
                <Check className="h-4 w-4 mr-1 text-blue-600" />
                Replace All Tags
              </label>
            </div>
          </div>

          {/* Tag Input */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {operationType === 'add' && 'Tags to Add'}
              {operationType === 'remove' && 'Tags to Remove'}
              {operationType === 'replace' && 'Replacement Tags'}
            </h3>
            
            {operationType === 'remove' && existingTags.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-2 block">Click to select tags to remove:</span>
                <div className="flex flex-wrap gap-2">
                  {existingTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const normalizedTag = tagService.normalizeTag(tag);
                        if (tagsToRemove.includes(normalizedTag)) {
                          setTagsToRemove(tagsToRemove.filter(t => t !== normalizedTag));
                        } else {
                          setTagsToRemove([...tagsToRemove, normalizedTag]);
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        tagsToRemove.includes(tagService.normalizeTag(tag))
                          ? 'bg-red-100 border-red-300 text-red-800'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-200'
                      }`}
                      disabled={isProcessing}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <TagInput
              value={getCurrentTags()}
              onChange={setCurrentTags}
              placeholder={
                operationType === 'add' ? 'Enter tags to add...' :
                operationType === 'remove' ? 'Enter tags to remove...' :
                'Enter replacement tags...'
              }
              suggestions={availableTags}
              disabled={isProcessing}
            />
          </div>

          {/* Operation Summary */}
          {getCurrentTags().length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Operation Summary</h4>
              <p className="text-sm text-gray-700">{getOperationSummary()}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={getCurrentTags().length === 0 || isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Apply Changes'
            )}
          </button>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-6 w-6 text-amber-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Confirm Bulk Operation</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  {getOperationSummary()}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  This action cannot be undone. Are you sure you want to continue?
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
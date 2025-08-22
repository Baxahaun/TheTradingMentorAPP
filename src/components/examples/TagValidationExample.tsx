import React, { useState } from 'react';
import { useTagValidation, useTagOperations } from '../../hooks/useTagValidation';
import { tagService } from '../../lib/tagService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';

/**
 * Example component demonstrating comprehensive tag validation and error handling
 * Shows real-time validation, sanitization, and user-friendly error messages
 */
export function TagValidationExample() {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [operationResult, setOperationResult] = useState<string | null>(null);

  const {
    validationState,
    validateTag,
    validateTags,
    sanitizeTag,
    clearValidation,
    getValidationConstants
  } = useTagValidation({
    validateOnChange: true,
    showWarnings: true
  });

  const {
    isLoading,
    lastError,
    executeTagOperation,
    clearError
  } = useTagOperations();

  const constants = getValidationConstants();

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    if (value.trim()) {
      validateTag(value);
    } else {
      clearValidation();
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    const sanitizeResult = sanitizeTag(tagInput);
    if (!sanitizeResult.success) {
      return;
    }

    const newTags = [...tags, sanitizeResult.value];
    const validation = validateTags(newTags);
    
    if (validation.isValid) {
      setTags(newTags);
      setTagInput('');
      clearValidation();
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    validateTags(newTags);
  };

  const handleBulkTagOperation = async () => {
    await executeTagOperation(
      async () => {
        // Simulate a bulk tag operation
        const result = await tagService.bulkUpdateTags([
          {
            tradeId: 'trade-1',
            action: 'add',
            tags: tags,
            existingTags: []
          }
        ]);
        return result;
      },
      (result) => {
        setOperationResult(`Successfully updated ${result.length} trades`);
      },
      (error) => {
        setOperationResult(`Operation failed: ${error}`);
      }
    );
  };

  const handleTestNetworkError = async () => {
    await executeTagOperation(
      async () => {
        // Simulate a network error
        throw new Error('Network connection failed');
      },
      () => {},
      () => {}
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Tag Validation & Error Handling Demo</h2>
        <p className="text-gray-600 mb-6">
          This component demonstrates comprehensive tag validation, sanitization, and error handling
          with user-friendly feedback and retry mechanisms.
        </p>
      </div>

      {/* Validation Constants */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Validation Rules</h3>
        <ul className="text-sm space-y-1">
          <li>• Maximum {constants.MAX_TAG_LENGTH} characters per tag</li>
          <li>• Maximum {constants.MAX_TAGS_PER_TRADE} tags total</li>
          <li>• Only letters, numbers, and underscores allowed</li>
          <li>• Tags should start with # (auto-added if missing)</li>
          <li>• Reserved words: {constants.RESERVED_WORDS.join(', ')}</li>
        </ul>
      </div>

      {/* Tag Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Add Tag</label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => handleTagInputChange(e.target.value)}
            placeholder="Enter a tag (e.g., breakout, trend)"
            className={validationState.errors.length > 0 ? 'border-red-500' : ''}
          />
          <Button 
            onClick={handleAddTag}
            disabled={!tagInput.trim() || !validationState.isValid || tags.length >= constants.MAX_TAGS_PER_TRADE}
          >
            Add
          </Button>
        </div>

        {/* Real-time Validation Feedback */}
        {validationState.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationState.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validationState.warnings.length > 0 && (
          <Alert>
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationState.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Current Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Current Tags ({tags.length}/{constants.MAX_TAGS_PER_TRADE})
        </label>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-lg">
          {tags.length === 0 ? (
            <span className="text-gray-400 text-sm">No tags added yet</span>
          ) : (
            tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer">
                {tag}
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Operation Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={handleBulkTagOperation}
          disabled={tags.length === 0 || isLoading}
        >
          {isLoading ? 'Processing...' : 'Test Bulk Operation'}
        </Button>
        <Button 
          variant="outline"
          onClick={handleTestNetworkError}
          disabled={isLoading}
        >
          Test Network Error
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            setTags([]);
            setTagInput('');
            clearValidation();
            clearError();
            setOperationResult(null);
          }}
        >
          Clear All
        </Button>
      </div>

      {/* Operation Results */}
      {lastError && (
        <Alert variant="destructive">
          <AlertDescription>
            {lastError}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearError}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {operationResult && !lastError && (
        <Alert>
          <AlertDescription>
            {operationResult}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setOperationResult(null)}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Sanitization Demo */}
      <div className="space-y-2">
        <h3 className="font-semibold">Tag Sanitization Examples</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            'BREAKOUT',
            'trend-analysis',
            'scalp!@#',
            '123start',
            'very_long_tag_name_that_exceeds_limits'
          ].map((example) => {
            const sanitized = sanitizeTag(example);
            return (
              <div key={example} className="p-2 bg-gray-50 rounded">
                <div><strong>Input:</strong> {example}</div>
                <div><strong>Output:</strong> {sanitized.success ? sanitized.value : 'Invalid'}</div>
                {sanitized.errors.length > 0 && (
                  <div className="text-red-600 text-xs mt-1">
                    {sanitized.errors.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
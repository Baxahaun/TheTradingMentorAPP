import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trade } from '../../types/trade';
import { useTagSuggestions, UseTagSuggestionsOptions } from '../../hooks/useTagSuggestions';
import { TagSuggestion } from '../../lib/tagSuggestionsService';

export interface EnhancedTagInputProps {
  /** Current tags */
  value: string[];
  /** Callback when tags change */
  onChange: (tags: string[]) => void;
  /** All trades for context */
  trades: Trade[];
  /** Current trade being tagged (for contextual suggestions) */
  currentTrade?: Partial<Trade>;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** CSS class name */
  className?: string;
  /** Tag suggestions options */
  suggestionsOptions?: UseTagSuggestionsOptions;
  /** Whether to show contextual suggestions */
  showContextualSuggestions?: boolean;
  /** Whether to show performance indicators */
  showPerformanceIndicators?: boolean;
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (suggestion: TagSuggestion) => void;
}

interface TagInputState {
  inputValue: string;
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  focusedTagIndex: number;
}

/**
 * Enhanced tag input component with intelligent autocomplete and suggestions
 */
export const EnhancedTagInput: React.FC<EnhancedTagInputProps> = ({
  value = [],
  onChange,
  trades,
  currentTrade,
  placeholder = "Add tags (e.g., #breakout, #scalping)...",
  maxTags = 20,
  disabled = false,
  className = "",
  suggestionsOptions = {},
  showContextualSuggestions = true,
  showPerformanceIndicators = true,
  onSuggestionSelect
}) => {
  const [state, setState] = useState<TagInputState>({
    inputValue: '',
    showSuggestions: false,
    selectedSuggestionIndex: -1,
    focusedTagIndex: -1
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the tag suggestions hook
  const {
    suggestions,
    loading,
    error,
    getSuggestions,
    clearSuggestions,
    getRecentTags,
    getContextualTags
  } = useTagSuggestions(trades, {
    limit: 10,
    debounceMs: 200,
    minInputLength: 0,
    ...suggestionsOptions
  });

  // Get contextual suggestions when component mounts or current trade changes
  const contextualSuggestions = showContextualSuggestions && currentTrade 
    ? getContextualTags(currentTrade) 
    : [];

  // Get recent tags for empty input
  const recentSuggestions = getRecentTags();

  // Determine which suggestions to show
  const displaySuggestions = state.inputValue.trim() 
    ? suggestions 
    : [...contextualSuggestions.slice(0, 3), ...recentSuggestions.slice(0, 7)];

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setState(prev => ({
      ...prev,
      inputValue: newValue,
      showSuggestions: true,
      selectedSuggestionIndex: -1
    }));

    // Get suggestions for the new input
    getSuggestions(newValue, currentTrade);
  }, [getSuggestions, currentTrade]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setState(prev => ({ ...prev, showSuggestions: true }));
    if (!state.inputValue.trim()) {
      getSuggestions('', currentTrade);
    }
  }, [getSuggestions, currentTrade, state.inputValue]);

  // Handle input blur
  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Don't hide suggestions if clicking on a suggestion
    if (suggestionsRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setTimeout(() => {
      setState(prev => ({ ...prev, showSuggestions: false }));
    }, 150);
  }, []);

  // Add a tag
  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
    
    if (!normalizedTag.trim() || normalizedTag === '#') return;
    if (value.includes(normalizedTag)) return;
    if (value.length >= maxTags) return;

    const newTags = [...value, normalizedTag];
    onChange(newTags);
    
    setState(prev => ({
      ...prev,
      inputValue: '',
      showSuggestions: false,
      selectedSuggestionIndex: -1
    }));

    // Clear suggestions and refocus input
    clearSuggestions();
    inputRef.current?.focus();
  }, [value, onChange, maxTags, clearSuggestions]);

  // Remove a tag
  const removeTag = useCallback((index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  }, [value, onChange]);

  // Handle key down events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;
    const { inputValue, selectedSuggestionIndex, showSuggestions } = state;

    switch (key) {
      case 'Enter':
        e.preventDefault();
        if (showSuggestions && selectedSuggestionIndex >= 0 && displaySuggestions[selectedSuggestionIndex]) {
          const suggestion = displaySuggestions[selectedSuggestionIndex];
          addTag(suggestion.tag);
          onSuggestionSelect?.(suggestion);
        } else if (inputValue.trim()) {
          addTag(inputValue.trim());
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (showSuggestions && displaySuggestions.length > 0) {
          setState(prev => ({
            ...prev,
            selectedSuggestionIndex: Math.min(
              prev.selectedSuggestionIndex + 1,
              displaySuggestions.length - 1
            )
          }));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (showSuggestions && displaySuggestions.length > 0) {
          setState(prev => ({
            ...prev,
            selectedSuggestionIndex: Math.max(prev.selectedSuggestionIndex - 1, -1)
          }));
        }
        break;

      case 'Escape':
        setState(prev => ({
          ...prev,
          showSuggestions: false,
          selectedSuggestionIndex: -1
        }));
        break;

      case 'Backspace':
        if (!inputValue && value.length > 0) {
          removeTag(value.length - 1);
        }
        break;

      case 'Tab':
        if (showSuggestions && selectedSuggestionIndex >= 0 && displaySuggestions[selectedSuggestionIndex]) {
          e.preventDefault();
          const suggestion = displaySuggestions[selectedSuggestionIndex];
          addTag(suggestion.tag);
          onSuggestionSelect?.(suggestion);
        }
        break;
    }
  }, [state, displaySuggestions, addTag, removeTag, value, onSuggestionSelect]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: TagSuggestion) => {
    addTag(suggestion.tag);
    onSuggestionSelect?.(suggestion);
  }, [addTag, onSuggestionSelect]);

  // Handle tag click (for removal)
  const handleTagClick = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    removeTag(index);
  }, [removeTag]);

  // Get suggestion reason display text
  const getSuggestionReasonText = (reason: string): string => {
    const reasonMap: { [key: string]: string } = {
      'recent_usage': 'Recently used',
      'high_frequency': 'Frequently used',
      'contextual_match': 'Contextual',
      'pattern_match': 'Pattern match',
      'session_match': 'Session match',
      'currency_pair_match': 'Currency match',
      'strategy_match': 'Strategy match',
      'performance_based': 'High performance',
      'exact_match': 'Exact match',
      'partial_match': 'Partial match'
    };
    return reasonMap[reason] || reason;
  };

  // Get performance indicator color
  const getPerformanceColor = (suggestion: TagSuggestion): string => {
    if (suggestion.reason === 'performance_based' && suggestion.context) {
      const winRateMatch = suggestion.context.match(/Win Rate: ([\d.]+)%/);
      if (winRateMatch) {
        const winRate = parseFloat(winRateMatch[1]);
        if (winRate >= 70) return 'text-green-600';
        if (winRate >= 50) return 'text-yellow-600';
        return 'text-red-600';
      }
    }
    return 'text-gray-600';
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (state.selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[state.selectedSuggestionIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [state.selectedSuggestionIndex]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Tags and Input Container */}
      <div className={`
        flex flex-wrap items-center gap-2 p-3 border rounded-lg bg-white
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-text'}
        ${error ? 'border-red-300' : 'border-gray-300'}
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
      `}>
        {/* Existing Tags */}
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => handleTagClick(index, e)}
                className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={state.inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled || value.length >= maxTags}
          className="flex-1 min-w-0 border-none outline-none bg-transparent placeholder-gray-400 disabled:cursor-not-allowed"
        />

        {/* Loading Indicator */}
        {loading && (
          <div className="text-gray-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tag Count */}
      {maxTags && (
        <div className="mt-1 text-xs text-gray-500">
          {value.length}/{maxTags} tags
        </div>
      )}

      {/* Suggestions Dropdown */}
      {state.showSuggestions && displaySuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {displaySuggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.tag}-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0
                ${index === state.selectedSuggestionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
                ${value.includes(suggestion.tag) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{suggestion.tag}</span>
                  {suggestion.frequency && (
                    <span className="text-xs text-gray-500">
                      ({suggestion.frequency} uses)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {showPerformanceIndicators && suggestion.reason === 'performance_based' && (
                    <span className={`text-xs ${getPerformanceColor(suggestion)}`}>
                      ★
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {getSuggestionReasonText(suggestion.reason)}
                  </span>
                </div>
              </div>
              {suggestion.context && (
                <div className="text-xs text-gray-500 mt-1">
                  {suggestion.context}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedTagInput;
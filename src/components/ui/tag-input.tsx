import * as React from "react";
import { X, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { tagService } from "@/lib/tagService";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
  disabled?: boolean;
  className?: string;
  onTagClick?: (tag: string) => void;
  showSuggestions?: boolean;
}

export const TagInput = React.forwardRef<HTMLDivElement, TagInputProps>(
  (
    {
      value = [],
      onChange,
      placeholder = "Add tags...",
      maxTags = 20,
      suggestions = [],
      disabled = false,
      className,
      onTagClick,
      showSuggestions = true,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState("");
    const [isInputFocused, setIsInputFocused] = React.useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = React.useState(-1);
    const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
    const [validationWarnings, setValidationWarnings] = React.useState<string[]>([]);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const suggestionsRef = React.useRef<HTMLDivElement>(null);

    // Filter suggestions based on current input and exclude already selected tags
    const filteredSuggestions = React.useMemo(() => {
      if (!showSuggestions || !inputValue.trim()) {
        return suggestions
          .filter(suggestion => !value.includes(suggestion))
          .slice(0, 10);
      }

      const searchTerm = inputValue.toLowerCase().trim();
      const normalizedSearchTerm = searchTerm.startsWith('#') ? searchTerm.slice(1) : searchTerm;

      return suggestions
        .filter(suggestion => {
          const normalizedSuggestion = suggestion.toLowerCase();
          const suggestionContent = normalizedSuggestion.startsWith('#') 
            ? normalizedSuggestion.slice(1) 
            : normalizedSuggestion;
          
          return suggestionContent.includes(normalizedSearchTerm) && 
                 !value.includes(suggestion);
        })
        .slice(0, 10);
    }, [inputValue, suggestions, value, showSuggestions]);

    // Validate input as user types
    React.useEffect(() => {
      if (inputValue.trim()) {
        const validation = tagService.validateTag(inputValue.trim());
        setValidationErrors(validation.errors);
        setValidationWarnings(validation.warnings);
      } else {
        setValidationErrors([]);
        setValidationWarnings([]);
      }
    }, [inputValue]);

    // Reset suggestion selection when filtered suggestions change
    React.useEffect(() => {
      setSelectedSuggestionIndex(-1);
    }, [filteredSuggestions]);

    const addTag = React.useCallback((tagToAdd: string) => {
      if (!tagToAdd.trim() || disabled) return;

      const normalizedTag = tagService.normalizeTag(tagToAdd.trim());
      
      // Validate the tag
      const validation = tagService.validateTag(normalizedTag);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Check if tag already exists
      if (value.includes(normalizedTag)) {
        setValidationErrors(["Tag already exists"]);
        return;
      }

      // Check max tags limit
      if (value.length >= maxTags) {
        setValidationErrors([`Maximum ${maxTags} tags allowed`]);
        return;
      }

      // Add the tag
      const newTags = [...value, normalizedTag];
      onChange(newTags);
      setInputValue("");
      setValidationErrors([]);
      setValidationWarnings([]);
      setSelectedSuggestionIndex(-1);
    }, [value, onChange, disabled, maxTags]);

    const removeTag = React.useCallback((tagToRemove: string) => {
      if (disabled) return;
      const newTags = value.filter(tag => tag !== tagToRemove);
      onChange(newTags);
    }, [value, onChange, disabled]);

    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      // Auto-format with # if user types without it
      if (newValue && !newValue.startsWith('#') && !newValue.includes(' ')) {
        newValue = `#${newValue}`;
      }
      
      setInputValue(newValue);
    }, []);

    const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
            addTag(filteredSuggestions[selectedSuggestionIndex]);
          } else if (inputValue.trim()) {
            addTag(inputValue.trim());
          }
          break;

        case 'Backspace':
          if (!inputValue && value.length > 0) {
            removeTag(value[value.length - 1]);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (filteredSuggestions.length > 0) {
            setSelectedSuggestionIndex(prev => 
              prev < filteredSuggestions.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (filteredSuggestions.length > 0) {
            setSelectedSuggestionIndex(prev => 
              prev > 0 ? prev - 1 : filteredSuggestions.length - 1
            );
          }
          break;

        case 'Escape':
          setIsInputFocused(false);
          setSelectedSuggestionIndex(-1);
          inputRef.current?.blur();
          break;

        case 'Tab':
          if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
            e.preventDefault();
            addTag(filteredSuggestions[selectedSuggestionIndex]);
          }
          break;
      }
    }, [inputValue, value, selectedSuggestionIndex, filteredSuggestions, addTag, removeTag]);

    const handleSuggestionClick = React.useCallback((suggestion: string) => {
      addTag(suggestion);
      inputRef.current?.focus();
    }, [addTag]);

    const handleTagClick = React.useCallback((tag: string) => {
      if (onTagClick) {
        onTagClick(tag);
      }
    }, [onTagClick]);

    const handleContainerClick = React.useCallback(() => {
      inputRef.current?.focus();
    }, []);

    // Handle clicks outside to close suggestions
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsInputFocused(false);
          setSelectedSuggestionIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showSuggestionsDropdown = isInputFocused && filteredSuggestions.length > 0 && showSuggestions;
    const hasErrors = validationErrors.length > 0;
    const hasWarnings = validationWarnings.length > 0;

    return (
      <div ref={containerRef} className={cn("relative", className)} {...props}>
        <div
          ref={ref}
          className={cn(
            "flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            hasErrors && "border-destructive focus-within:ring-destructive",
            hasWarnings && !hasErrors && "border-yellow-500 focus-within:ring-yellow-500",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={handleContainerClick}
        >
          {/* Render existing tags */}
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs",
                onTagClick && "cursor-pointer hover:bg-secondary/80",
                disabled && "cursor-not-allowed"
              )}
              onClick={() => handleTagClick(tag)}
            >
              <Hash className="h-3 w-3" />
              {tag.startsWith('#') ? tag.slice(1) : tag}
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}

          {/* Input field */}
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsInputFocused(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ minWidth: '120px' }}
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestionsDropdown && (
          <div
            ref={suggestionsRef}
            className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  index === selectedSuggestionIndex && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedSuggestionIndex(index)}
              >
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span>{suggestion.startsWith('#') ? suggestion.slice(1) : suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Validation messages */}
        {(hasErrors || hasWarnings) && (
          <div className="mt-1 space-y-1">
            {validationErrors.map((error, index) => (
              <p key={`error-${index}`} className="text-xs text-destructive">
                {error}
              </p>
            ))}
            {validationWarnings.map((warning, index) => (
              <p key={`warning-${index}`} className="text-xs text-yellow-600">
                {warning}
              </p>
            ))}
          </div>
        )}

        {/* Helper text */}
        {!hasErrors && !hasWarnings && isInputFocused && (
          <p className="mt-1 text-xs text-muted-foreground">
            Type to add tags. Press Enter to add, Backspace to remove last tag.
            {maxTags && ` (${value.length}/${maxTags})`}
          </p>
        )}
      </div>
    );
  }
);

TagInput.displayName = "TagInput";
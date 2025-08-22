import React, { useState, useMemo } from 'react';
import { X, Search, Hash, ChevronDown } from 'lucide-react';
import { TagWithCount, TagFilter as TagFilterType } from '../../lib/tagService';

interface TagFilterProps {
  availableTags: TagWithCount[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  filterMode: 'AND' | 'OR';
  onFilterModeChange: (mode: 'AND' | 'OR') => void;
  className?: string;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTags,
  onTagsChange,
  filterMode,
  onFilterModeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter available tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableTags;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return availableTags.filter(tag => 
      tag.tag.toLowerCase().includes(query)
    );
  }, [availableTags, searchQuery]);

  // Sort tags by usage count (most used first)
  const sortedTags = useMemo(() => {
    return [...filteredTags].sort((a, b) => b.count - a.count);
  }, [filteredTags]);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const hasActiveFilters = selectedTags.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3 border rounded-md flex items-center text-sm font-medium transition-all duration-200 ${
          hasActiveFilters
            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        <Hash className="h-4 w-4 mr-2" />
        Tags
        {hasActiveFilters && (
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
            {selectedTags.length}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Filter by Tags</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filter Mode Toggle */}
            {selectedTags.length > 1 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Filter Mode
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onFilterModeChange('AND')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filterMode === 'AND'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    AND (all tags)
                  </button>
                  <button
                    onClick={() => onFilterModeChange('OR')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filterMode === 'OR'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    OR (any tag)
                  </button>
                </div>
              </div>
            )}

            {/* Clear All Button */}
            {hasActiveFilters && (
              <div className="mb-4">
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Tags List */}
            <div className="max-h-64 overflow-y-auto">
              {sortedTags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">
                    {searchQuery ? 'No tags match your search' : 'No tags available'}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedTags.map((tagData) => (
                    <label
                      key={tagData.tag}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tagData.tag)}
                          onChange={() => handleTagToggle(tagData.tag)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {tagData.tag}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {tagData.count}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
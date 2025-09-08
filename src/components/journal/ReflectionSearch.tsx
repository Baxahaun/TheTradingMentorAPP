import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Tag, 
  MessageSquare,
  Clock,
  X,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { format } from 'date-fns';
import { ReflectionResponse, ReflectionSearchQuery } from '../../types/reflection';
import { reflectionService } from '../../services/ReflectionService';

interface ReflectionSearchProps {
  userId: string;
  onResultClick?: (response: ReflectionResponse) => void;
}

export const ReflectionSearch: React.FC<ReflectionSearchProps> = ({
  userId,
  onResultClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'theme'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [results, setResults] = useState<ReflectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Available tags and themes (would be fetched from service in real implementation)
  const availableTags = [
    'discipline', 'patience', 'risk-management', 'entry-timing', 'exit-timing',
    'market-analysis', 'emotional-control', 'overtrading', 'revenge-trading',
    'profit-taking', 'loss-cutting', 'trend-following', 'counter-trend'
  ];

  const availableThemes = [
    'patience', 'discipline', 'emotional-management', 'risk-management', 'timing'
  ];

  useEffect(() => {
    performSearch();
  }, [searchQuery, selectedTags, selectedThemes, dateRange, sortBy, sortOrder]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const query: ReflectionSearchQuery = {
        query: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        themes: selectedThemes.length > 0 ? selectedThemes : undefined,
        dateRange: dateRange.start && dateRange.end ? {
          start: format(dateRange.start, 'yyyy-MM-dd'),
          end: format(dateRange.end, 'yyyy-MM-dd')
        } : undefined,
        sortBy,
        sortOrder
      };

      const searchResults = await reflectionService.searchReflections(userId, query);
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching reflections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const addTheme = (theme: string) => {
    if (!selectedThemes.includes(theme)) {
      setSelectedThemes([...selectedThemes, theme]);
    }
  };

  const removeTheme = (theme: string) => {
    setSelectedThemes(selectedThemes.filter(t => t !== theme));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedThemes([]);
    setDateRange({});
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedThemes.length > 0 || dateRange.start || dateRange.end;

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Reflections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your reflections..."
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {[
                    selectedTags.length,
                    selectedThemes.length,
                    dateRange.start ? 1 : 0
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="theme">Theme</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Tags Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="default" className="cursor-pointer">
                      {tag}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {availableTags.filter(tag => !selectedTags.includes(tag)).map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => addTag(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Themes Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Themes</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedThemes.map(theme => (
                    <Badge key={theme} variant="default" className="cursor-pointer">
                      {theme}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => removeTheme(theme)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {availableThemes.filter(theme => !selectedThemes.includes(theme)).map(theme => (
                    <Badge 
                      key={theme} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => addTheme(theme)}
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {dateRange.start ? format(dateRange.start, 'MMM dd') : 'Start Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.start}
                        onSelect={(date) => setDateRange({ ...dateRange, start: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {dateRange.end ? format(dateRange.end, 'MMM dd') : 'End Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.end}
                        onSelect={(date) => setDateRange({ ...dateRange, end: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Search Results
            </span>
            <Badge variant="outline">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onResultClick?.(result)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(result.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {result.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <h3 className="font-medium text-gray-900 mb-2">
                    {highlightSearchTerm(result.question, searchQuery)}
                  </h3>

                  <p className="text-sm text-gray-700 mb-2">
                    {highlightSearchTerm(
                      result.answer.length > 200 
                        ? result.answer.substring(0, 200) + '...' 
                        : result.answer,
                      searchQuery
                    )}
                  </p>

                  {result.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {result.themes.map(theme => (
                        <Badge key={theme} variant="secondary" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
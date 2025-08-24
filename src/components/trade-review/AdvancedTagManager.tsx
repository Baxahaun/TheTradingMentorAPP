import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Hash, 
  Trash2, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Activity,
  Plus,
  Edit3,
  Star,
  Target,
  Zap,
  Users,
  Award,
  Settings,
  Palette,
  Eye,
  EyeOff,
  MoreHorizontal,
  ArrowUpDown,
  X
} from 'lucide-react';
import { Trade } from '../../types/trade';
import { tagService, TagWithCount, TagPerformance } from '../../lib/tagService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { TagAnalyticsDashboard } from '../ui/tag-analytics-dashboard';

// Tag category definitions with colors
export interface TagCategory {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  keywords: string[];
}

export const DEFAULT_TAG_CATEGORIES: TagCategory[] = [
  {
    id: 'strategy',
    name: 'Strategy',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    description: 'Trading strategies and setups',
    keywords: ['scalp', 'swing', 'breakout', 'reversal', 'trend', 'momentum', 'mean_reversion']
  },
  {
    id: 'market_condition',
    name: 'Market Condition',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    description: 'Market environment and conditions',
    keywords: ['trending', 'ranging', 'volatile', 'quiet', 'news', 'session', 'overlap']
  },
  {
    id: 'emotion',
    name: 'Emotion',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    description: 'Emotional state and psychology',
    keywords: ['confident', 'fearful', 'greedy', 'patient', 'impulsive', 'calm', 'stressed']
  },
  {
    id: 'outcome',
    name: 'Outcome',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    description: 'Trade results and outcomes',
    keywords: ['winner', 'loser', 'breakeven', 'stopped', 'target', 'partial', 'runner']
  },
  {
    id: 'setup',
    name: 'Setup',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    description: 'Technical setups and patterns',
    keywords: ['support', 'resistance', 'flag', 'triangle', 'channel', 'fibonacci', 'ma']
  },
  {
    id: 'timeframe',
    name: 'Timeframe',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
    description: 'Trading timeframes',
    keywords: ['1m', '5m', '15m', '1h', '4h', '1d', 'intraday', 'swing']
  },
  {
    id: 'currency',
    name: 'Currency',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    description: 'Currency pairs and assets',
    keywords: ['eur', 'usd', 'gbp', 'jpy', 'aud', 'cad', 'chf', 'nzd', 'major', 'minor', 'exotic']
  },
  {
    id: 'other',
    name: 'Other',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    description: 'Miscellaneous tags',
    keywords: []
  }
];

interface AdvancedTagStats extends TagWithCount {
  category: TagCategory;
  performance: TagPerformance;
  isStarred: boolean;
  isHidden: boolean;
  lastModified: string;
}

interface BulkOperation {
  type: 'delete' | 'categorize' | 'star' | 'hide' | 'merge';
  selectedTags: string[];
  targetCategory?: string;
  mergeTarget?: string;
}

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  onTagsChange?: (tags: string[]) => void;
  onTagClick?: (tag: string) => void;
  onTagDeleted?: (tag: string) => void;
  onBulkOperation?: (operation: BulkOperation) => void;
  showPerformanceMetrics?: boolean;
  allowBulkOperations?: boolean;
  maxDisplayTags?: number;
}

export const AdvancedTagManager: React.FC<TagManagerProps> = ({
  isOpen,
  onClose,
  trades,
  onTagsChange,
  onTagClick,
  onTagDeleted,
  onBulkOperation,
  showPerformanceMetrics = true,
  allowBulkOperations = true,
  maxDisplayTags = 50
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'usage' | 'alphabetical' | 'performance' | 'recent' | 'category'>('usage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHiddenTags, setShowHiddenTags] = useState(false);
  const [bulkOperationMode, setBulkOperationMode] = useState(false);
  const [starredTags, setStarredTags] = useState<Set<string>>(new Set());
  const [hiddenTags, setHiddenTags] = useState<Set<string>>(new Set());
  const [customCategories, setCustomCategories] = useState<TagCategory[]>([]);
  const [activeTab, setActiveTab] = useState('manage');

  // Load saved preferences
  useEffect(() => {
    try {
      const savedStarred = localStorage.getItem('starredTags');
      const savedHidden = localStorage.getItem('hiddenTags');
      const savedCategories = localStorage.getItem('customTagCategories');
      
      if (savedStarred) {
        setStarredTags(new Set(JSON.parse(savedStarred)));
      }
      if (savedHidden) {
        setHiddenTags(new Set(JSON.parse(savedHidden)));
      }
      if (savedCategories) {
        setCustomCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error('Error loading tag preferences:', error);
    }
  }, []);

  // Save preferences
  const savePreferences = useCallback(() => {
    try {
      localStorage.setItem('starredTags', JSON.stringify([...starredTags]));
      localStorage.setItem('hiddenTags', JSON.stringify([...hiddenTags]));
      localStorage.setItem('customTagCategories', JSON.stringify(customCategories));
    } catch (error) {
      console.error('Error saving tag preferences:', error);
    }
  }, [starredTags, hiddenTags, customCategories]);

  useEffect(() => {
    savePreferences();
  }, [savePreferences]);

  // Get all categories (default + custom)
  const allCategories = useMemo(() => {
    return [...DEFAULT_TAG_CATEGORIES, ...customCategories];
  }, [customCategories]);

  // Categorize tags based on keywords and patterns
  const categorizeTag = useCallback((tag: string): TagCategory => {
    const tagLower = tag.toLowerCase().replace('#', '');
    
    // Check custom categories first
    for (const category of customCategories) {
      if (category.keywords.some(keyword => tagLower.includes(keyword))) {
        return category;
      }
    }
    
    // Check default categories
    for (const category of DEFAULT_TAG_CATEGORIES) {
      if (category.keywords.some(keyword => tagLower.includes(keyword))) {
        return category;
      }
    }
    
    // Default to 'other' category
    return DEFAULT_TAG_CATEGORIES.find(cat => cat.id === 'other') || DEFAULT_TAG_CATEGORIES[0];
  }, [customCategories]);

  // Calculate comprehensive tag statistics
  const tagStats = useMemo((): AdvancedTagStats[] => {
    try {
      const allTags = tagService.getAllTagsWithCounts(trades);
      
      return allTags.map(tagData => {
        const tagTrades = trades.filter(trade => 
          trade.tags?.some(t => tagService.normalizeTag(t) === tagData.tag)
        );
        
        const performance = tagService.calculateTagPerformance(tagData.tag, tagTrades);
        const category = categorizeTag(tagData.tag);
        
        return {
          ...tagData,
          category,
          performance,
          isStarred: starredTags.has(tagData.tag),
          isHidden: hiddenTags.has(tagData.tag),
          lastModified: tagData.lastUsed
        };
      });
    } catch (error) {
      console.error('Error calculating tag statistics:', error);
      return [];
    }
  }, [trades, categorizeTag, starredTags, hiddenTags]);

  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    let filtered = tagStats;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(tag => 
        tag.tag.toLowerCase().includes(query) ||
        tag.category.name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'starred') {
        filtered = filtered.filter(tag => tag.isStarred);
      } else if (selectedCategory === 'hidden') {
        filtered = filtered.filter(tag => tag.isHidden);
      } else {
        filtered = filtered.filter(tag => tag.category.id === selectedCategory);
      }
    }

    // Apply hidden filter
    if (!showHiddenTags) {
      filtered = filtered.filter(tag => !tag.isHidden);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'usage':
          comparison = b.count - a.count;
          break;
        case 'alphabetical':
          comparison = a.tag.localeCompare(b.tag);
          break;
        case 'performance':
          comparison = b.performance.winRate - a.performance.winRate;
          break;
        case 'recent':
          comparison = new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
          break;
        case 'category':
          comparison = a.category.name.localeCompare(b.category.name);
          if (comparison === 0) {
            comparison = b.count - a.count; // Secondary sort by usage
          }
          break;
        default:
          comparison = b.count - a.count;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    // Limit results
    return sorted.slice(0, maxDisplayTags);
  }, [tagStats, searchQuery, selectedCategory, showHiddenTags, sortBy, sortOrder, maxDisplayTags]);

  // Handle tag selection for bulk operations
  const handleTagSelection = useCallback((tag: string, selected: boolean) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(tag);
      } else {
        newSet.delete(tag);
      }
      return newSet;
    });
  }, []);

  // Handle select all/none
  const handleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedTags(new Set(filteredAndSortedTags.map(tag => tag.tag)));
    } else {
      setSelectedTags(new Set());
    }
  }, [filteredAndSortedTags]);

  // Handle star/unstar tag
  const handleStarTag = useCallback((tag: string) => {
    setStarredTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  }, []);

  // Handle hide/show tag
  const handleHideTag = useCallback((tag: string) => {
    setHiddenTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  }, []);

  // Handle bulk operations
  const handleBulkOperation = useCallback((operation: BulkOperation) => {
    if (onBulkOperation) {
      onBulkOperation(operation);
    }
    
    // Handle local operations
    switch (operation.type) {
      case 'star':
        operation.selectedTags.forEach(tag => {
          setStarredTags(prev => new Set([...prev, tag]));
        });
        break;
      case 'hide':
        operation.selectedTags.forEach(tag => {
          setHiddenTags(prev => new Set([...prev, tag]));
        });
        break;
    }
    
    setSelectedTags(new Set());
    setBulkOperationMode(false);
    
    toast({
      title: "Bulk operation completed",
      description: `Applied ${operation.type} to ${operation.selectedTags.length} tags.`,
    });
  }, [onBulkOperation]);

  // Handle tag deletion
  const handleDeleteTag = useCallback(async (tag: string) => {
    try {
      if (onTagDeleted) {
        onTagDeleted(tag);
      }
      
      // Remove from local state
      setStarredTags(prev => {
        const newSet = new Set(prev);
        newSet.delete(tag);
        return newSet;
      });
      setHiddenTags(prev => {
        const newSet = new Set(prev);
        newSet.delete(tag);
        return newSet;
      });
      
      toast({
        title: "Tag deleted",
        description: `Tag "${tag}" has been removed from all trades.`,
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      });
    }
  }, [onTagDeleted]);

  // Handle tag click
  const handleTagClick = useCallback((tag: string) => {
    if (bulkOperationMode) {
      handleTagSelection(tag, !selectedTags.has(tag));
    } else if (onTagClick) {
      onTagClick(tag);
      onClose();
    }
  }, [bulkOperationMode, selectedTags, onTagClick, onClose, handleTagSelection]);

  // Get performance indicator
  const getPerformanceIndicator = useCallback((performance: TagPerformance) => {
    if (performance.totalTrades < 3) {
      return { icon: AlertTriangle, color: 'text-gray-500', label: 'Insufficient data' };
    }
    
    if (performance.winRate >= 70 && performance.averagePnL > 0) {
      return { icon: TrendingUp, color: 'text-green-600', label: 'Excellent' };
    } else if (performance.winRate >= 60 && performance.averagePnL > 0) {
      return { icon: CheckCircle, color: 'text-blue-600', label: 'Good' };
    } else if (performance.winRate >= 50) {
      return { icon: Activity, color: 'text-yellow-600', label: 'Average' };
    } else {
      return { icon: TrendingDown, color: 'text-red-600', label: 'Poor' };
    }
  }, []);

  // Format currency values
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  // Render tag card
  const renderTagCard = useCallback((tagStat: AdvancedTagStats) => {
    const performance = getPerformanceIndicator(tagStat.performance);
    const PerformanceIcon = performance.icon;
    
    return (
      <Card 
        key={tagStat.tag} 
        className={cn(
          "hover:shadow-md transition-all duration-200 cursor-pointer",
          selectedTags.has(tagStat.tag) && "ring-2 ring-blue-500",
          tagStat.isHidden && "opacity-60"
        )}
        onClick={() => handleTagClick(tagStat.tag)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {bulkOperationMode && (
                <Checkbox
                  checked={selectedTags.has(tagStat.tag)}
                  onChange={(checked) => handleTagSelection(tagStat.tag, checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              
              <Badge 
                className={cn(
                  "font-mono text-xs",
                  tagStat.category.color,
                  tagStat.category.bgColor,
                  tagStat.category.borderColor
                )}
              >
                <Hash className="h-3 w-3 mr-1" />
                {tagStat.tag.replace('#', '')}
              </Badge>
              
              {tagStat.isStarred && (
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
              )}
              
              {tagStat.isHidden && (
                <EyeOff className="h-3 w-3 text-gray-400" />
              )}
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStarTag(tagStat.tag);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Star className={cn(
                        "h-3 w-3",
                        tagStat.isStarred ? "text-yellow-500 fill-current" : "text-gray-400"
                      )} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {tagStat.isStarred ? 'Unstar' : 'Star'} tag
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-6 p-0"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleHideTag(tagStat.tag)}
                    >
                      {tagStat.isHidden ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                      {tagStat.isHidden ? 'Show' : 'Hide'} tag
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete tag
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{tagStat.tag}"? 
                            This will remove it from all {tagStat.count} associated trades.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTag(tagStat.tag)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Tag
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Category and usage info */}
          <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
            <span className="capitalize">{tagStat.category.name}</span>
            <span>{tagStat.count} trade{tagStat.count !== 1 ? 's' : ''}</span>
          </div>

          {/* Performance metrics */}
          {showPerformanceMetrics && tagStat.performance.totalTrades >= 3 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <PerformanceIcon className={cn("h-3 w-3", performance.color)} />
                <span className={performance.color}>{performance.label}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{tagStat.performance.winRate.toFixed(1)}% WR</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg P&L:</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  "font-medium",
                  tagStat.performance.averagePnL > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(tagStat.performance.averagePnL)}
                </span>
              </div>
            </div>
          )}

          {/* Last used */}
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            Last used: {formatDate(tagStat.lastUsed)}
          </div>
        </CardContent>
      </Card>
    );
  }, [
    selectedTags, 
    bulkOperationMode, 
    showPerformanceMetrics, 
    handleTagClick, 
    handleTagSelection, 
    handleStarTag, 
    handleHideTag, 
    handleDeleteTag,
    getPerformanceIndicator,
    formatCurrency,
    formatDate
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Advanced Tag Manager
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Analytics
              </Button>
              {allowBulkOperations && (
                <Button
                  variant={bulkOperationMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkOperationMode(!bulkOperationMode)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {bulkOperationMode ? 'Exit Bulk' : 'Bulk Edit'}
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manage">Manage Tags</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="manage" className="h-full flex flex-col">
              {/* Controls */}
              <div className="space-y-4 pb-4">
                {/* Search and filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tags or categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="starred">Starred</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                        <Separator />
                        {allCategories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usage">Usage</SelectItem>
                        <SelectItem value="alphabetical">A-Z</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Bulk operations bar */}
                {bulkOperationMode && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedTags.size === filteredAndSortedTags.length && filteredAndSortedTags.length > 0}
                          onChange={(checked) => handleSelectAll(checked)}
                        />
                        <Label className="text-sm">
                          {selectedTags.size > 0 
                            ? `${selectedTags.size} selected`
                            : 'Select all'
                          }
                        </Label>
                      </div>
                      
                      {selectedTags.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkOperation({
                              type: 'star',
                              selectedTags: [...selectedTags]
                            })}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Star
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkOperation({
                              type: 'hide',
                              selectedTags: [...selectedTags]
                            })}
                          >
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Selected Tags</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {selectedTags.size} selected tags? 
                                  This will remove them from all associated trades and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleBulkOperation({
                                    type: 'delete',
                                    selectedTags: [...selectedTags]
                                  })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Tags
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBulkOperationMode(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Options */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showHidden"
                      checked={showHiddenTags}
                      onChange={setShowHiddenTags}
                    />
                    <Label htmlFor="showHidden">Show hidden tags</Label>
                  </div>
                  
                  <div className="text-muted-foreground">
                    Showing {filteredAndSortedTags.length} of {tagStats.length} tags
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tag Grid */}
              <ScrollArea className="flex-1 min-h-0">
                {filteredAndSortedTags.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Hash className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {searchQuery ? 'No tags found' : 'No tags available'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {searchQuery 
                        ? 'Try adjusting your search query or filters.'
                        : 'Start adding tags to your trades to see them here.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                    {filteredAndSortedTags.map(renderTagCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="categories" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Tag Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allCategories.map(category => {
                          const categoryTags = tagStats.filter(tag => tag.category.id === category.id);
                          return (
                            <Card key={category.id} className="border-2" style={{ borderColor: category.borderColor.replace('border-', '') }}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={cn(category.color, category.bgColor)}>
                                    {category.name}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {categoryTags.length} tags
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {category.description}
                                </p>
                                {categoryTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {categoryTags.slice(0, 5).map(tag => (
                                      <Badge 
                                        key={tag.tag}
                                        variant="outline" 
                                        className="text-xs cursor-pointer hover:bg-secondary/80"
                                        onClick={() => handleTagClick(tag.tag)}
                                      >
                                        {tag.tag.replace('#', '')}
                                      </Badge>
                                    ))}
                                    {categoryTags.length > 5 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{categoryTags.length - 5} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="performance" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-1">
                  {/* Top performers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-600" />
                        Top Performing Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tagStats
                          .filter(tag => tag.performance.totalTrades >= 3)
                          .sort((a, b) => b.performance.winRate - a.performance.winRate)
                          .slice(0, 6)
                          .map(renderTagCard)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Needs improvement */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-600" />
                        Needs Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tagStats
                          .filter(tag => tag.performance.totalTrades >= 3 && tag.performance.winRate < 50)
                          .sort((a, b) => a.performance.winRate - b.performance.winRate)
                          .slice(0, 4)
                          .map(renderTagCard)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        {/* Tag Analytics Dashboard */}
        <TagAnalyticsDashboard
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          trades={trades}
          onTagClick={onTagClick}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedTagManager;
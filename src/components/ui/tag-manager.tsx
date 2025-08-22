import React, { useState, useMemo } from 'react';
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
  Activity
} from 'lucide-react';
import { TagWithCount, tagService } from '../../lib/tagService';
import { Trade } from '../../types/trade';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { TagAnalyticsDashboard } from './tag-analytics-dashboard';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  onTagClick?: (tag: string) => void;
  onTagDeleted?: (tag: string) => void;
}

interface TagStats {
  tag: string;
  count: number;
  lastUsed: string;
  winRate: number;
  avgPnL: number;
  profitFactor: number;
  trades: string[];
}

export const TagManager: React.FC<TagManagerProps> = ({
  isOpen,
  onClose,
  trades,
  onTagClick,
  onTagDeleted
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'usage' | 'alphabetical' | 'performance' | 'recent'>('usage');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Calculate comprehensive tag statistics
  const tagStats = useMemo((): TagStats[] => {
    try {
      const allTags = tagService.getAllTagsWithCounts(trades);
    
    return allTags.map(tagData => {
      const tagTrades = trades.filter(trade => 
        trade.tags?.some(t => tagService.normalizeTag(t) === tagData.tag)
      );
      
      const closedTrades = tagTrades.filter(trade => trade.status === 'closed');
      const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
      
      const winRate = closedTrades.length > 0 
        ? (winningTrades.length / closedTrades.length) * 100 
        : 0;
      
      const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const avgPnL = closedTrades.length > 0 ? totalPnL / closedTrades.length : 0;
      
      const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const totalLosses = Math.abs(
        closedTrades.filter(trade => (trade.pnl || 0) < 0)
          .reduce((sum, trade) => sum + (trade.pnl || 0), 0)
      );
      const profitFactor = totalLosses === 0 
        ? (totalWins > 0 ? Infinity : 0) 
        : totalWins / totalLosses;

      return {
        tag: tagData.tag,
        count: tagData.count,
        lastUsed: tagData.lastUsed,
        winRate,
        avgPnL,
        profitFactor,
        trades: tagData.trades
      };
    });
    } catch (error) {
      console.error('Error calculating tag statistics:', error);
      return [];
    }
  }, [trades]);

  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    let filtered = tagStats;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(tag => 
        tag.tag.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.count - a.count;
        case 'alphabetical':
          return a.tag.localeCompare(b.tag);
        case 'performance':
          return b.winRate - a.winRate;
        case 'recent':
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        default:
          return b.count - a.count;
      }
    });

    return sorted;
  }, [tagStats, searchQuery, sortBy]);

  // Handle tag deletion
  const handleDeleteTag = async (tag: string) => {
    try {
      setDeletingTag(tag);
      
      // This would typically involve updating all trades that have this tag
      // For now, we'll just notify the parent component
      if (onTagDeleted) {
        onTagDeleted(tag);
      }
      
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
    } finally {
      setDeletingTag(null);
    }
  };

  // Handle tag click for filtering
  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
      onClose(); // Close the manager after selecting a tag
    }
  };

  // Format tag display text
  const formatTagText = (tag: string) => {
    return tag.startsWith('#') ? tag.slice(1) : tag;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Get performance indicator
  const getPerformanceIndicator = (winRate: number, avgPnL: number) => {
    if (winRate >= 60 && avgPnL > 0) {
      return { icon: TrendingUp, color: 'text-green-600', label: 'Strong' };
    } else if (winRate >= 50 && avgPnL >= 0) {
      return { icon: CheckCircle, color: 'text-blue-600', label: 'Good' };
    } else if (winRate < 40 || avgPnL < 0) {
      return { icon: TrendingDown, color: 'text-red-600', label: 'Poor' };
    } else {
      return { icon: AlertTriangle, color: 'text-yellow-600', label: 'Mixed' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Tag Manager
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(true)}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Analytics
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 py-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search tags"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'usage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('usage')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Usage
            </Button>
            <Button
              variant={sortBy === 'performance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('performance')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Performance
            </Button>
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('recent')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Recent
            </Button>
            <Button
              variant={sortBy === 'alphabetical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('alphabetical')}
            >
              A-Z
            </Button>
          </div>
        </div>

        <Separator />

        {/* Tag List */}
        <ScrollArea className="flex-1 min-h-0">
          {filteredAndSortedTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Hash className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchQuery ? 'No tags found' : 'No tags available'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchQuery 
                  ? 'Try adjusting your search query to find tags.'
                  : 'Start adding tags to your trades to see them here.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {filteredAndSortedTags.map((tagStat) => {
                const performance = getPerformanceIndicator(tagStat.winRate, tagStat.avgPnL);
                const PerformanceIcon = performance.icon;
                
                return (
                  <Card key={tagStat.tag} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Tag Badge */}
                          <Badge 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-secondary/80 transition-colors"
                            onClick={() => handleTagClick(tagStat.tag)}
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {formatTagText(tagStat.tag)}
                          </Badge>

                          {/* Usage Count */}
                          <div className="text-sm text-muted-foreground">
                            {tagStat.count} trade{tagStat.count !== 1 ? 's' : ''}
                          </div>

                          {/* Performance Indicator */}
                          <div className={cn("flex items-center gap-1 text-sm", performance.color)}>
                            <PerformanceIcon className="h-4 w-4" />
                            <span>{performance.label}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="text-right">
                            <div className="font-medium">
                              {tagStat.winRate.toFixed(1)}% WR
                            </div>
                            <div className="text-xs">
                              {formatCurrency(tagStat.avgPnL)} avg
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-medium">
                              {tagStat.profitFactor === Infinity ? '∞' : tagStat.profitFactor.toFixed(2)} PF
                            </div>
                            <div className="text-xs">
                              {formatDate(tagStat.lastUsed)}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                disabled={deletingTag === tagStat.tag}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the tag "{tagStat.tag}"? 
                                  This will remove it from all {tagStat.count} associated trade{tagStat.count !== 1 ? 's' : ''}.
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Tag Analytics Dashboard */}
        <TagAnalyticsDashboard
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          trades={trades}
          onTagClick={onTagClick}
        />

        {/* Summary Footer */}
        {filteredAndSortedTags.length > 0 && (
          <>
            <Separator />
            <div className="flex justify-between items-center py-2 text-sm text-muted-foreground">
              <span>
                Showing {filteredAndSortedTags.length} of {tagStats.length} tags
              </span>
              <span>
                Total trades with tags: {trades.filter(t => t.tags && t.tags.length > 0).length}
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
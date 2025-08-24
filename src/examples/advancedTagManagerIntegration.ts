/**
 * Advanced Tag Manager Integration Example
 * 
 * This example demonstrates how to integrate the AdvancedTagManager component
 * with the existing trade review system and shows various usage patterns.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Trade } from '../types/trade';
import { AdvancedTagManager, DEFAULT_TAG_CATEGORIES } from '../components/trade-review/AdvancedTagManager';
import { bulkTagOperationsService, BulkTagOperation } from '../lib/bulkTagOperationsService';
import { tagService } from '../lib/tagService';
import { tagAnalyticsService } from '../lib/tagAnalyticsService';
import { toast } from '../hooks/use-toast';

// Example component that integrates AdvancedTagManager
export const TradeReviewWithAdvancedTags: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tagAnalytics, setTagAnalytics] = useState<any>(null);

  // Load trades (in real app, this would come from your data source)
  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    // Example trades with comprehensive tagging
    const exampleTrades: Trade[] = [
      {
        id: '1',
        accountId: 'main-account',
        currencyPair: 'EUR/USD',
        date: '2024-01-15',
        timeIn: '09:30',
        timeOut: '10:15',
        side: 'long',
        entryPrice: 1.0950,
        exitPrice: 1.0980,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 300,
        tags: [
          '#breakout', '#trend-following', '#major-pair', 
          '#european-session', '#high-confidence', '#news-driven'
        ],
        strategy: 'Breakout Strategy',
        session: 'european',
        confidence: 8,
        emotions: 'confident'
      },
      {
        id: '2',
        accountId: 'main-account',
        currencyPair: 'GBP/USD',
        date: '2024-01-16',
        timeIn: '14:00',
        timeOut: '14:45',
        side: 'short',
        entryPrice: 1.2650,
        exitPrice: 1.2620,
        lotSize: 0.5,
        lotType: 'standard',
        units: 50000,
        commission: 3,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 150,
        tags: [
          '#reversal', '#scalping', '#major-pair', 
          '#us-session', '#quick-profit', '#technical-analysis'
        ],
        strategy: 'Scalping',
        session: 'us',
        confidence: 7,
        emotions: 'focused'
      },
      {
        id: '3',
        accountId: 'main-account',
        currencyPair: 'USD/JPY',
        date: '2024-01-17',
        timeIn: '08:00',
        side: 'long',
        entryPrice: 148.50,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 4,
        accountCurrency: 'USD',
        status: 'open',
        tags: [
          '#trend-following', '#asian-session', '#major-pair',
          '#carry-trade', '#low-volatility', '#patient-entry'
        ],
        strategy: 'Trend Following',
        session: 'asian',
        confidence: 6,
        emotions: 'patient'
      }
    ];

    setTrades(exampleTrades);
    
    // Calculate initial analytics
    const analytics = tagAnalyticsService.calculateTagAnalytics(exampleTrades);
    setTagAnalytics(analytics);
  };

  // Handle tag click from the tag manager
  const handleTagClick = useCallback((tag: string) => {
    // Filter trades by the clicked tag
    const filteredTrades = trades.filter(trade => 
      trade.tags?.some(t => tagService.normalizeTag(t) === tagService.normalizeTag(tag))
    );

    toast({
      title: "Tag Filter Applied",
      description: `Showing ${filteredTrades.length} trades with tag "${tag}"`,
    });

    // In a real app, you would update your trade list view here
    console.log('Filtered trades:', filteredTrades);
  }, [trades]);

  // Handle individual tag deletion
  const handleTagDeleted = useCallback(async (tag: string) => {
    try {
      // Use bulk operations service for consistent handling
      const operation: BulkTagOperation = {
        type: 'delete',
        selectedTags: [tag],
        options: {
          createBackup: true,
          validateBeforeApply: true
        }
      };

      const result = await bulkTagOperationsService.executeBulkOperation(operation, trades);

      if (result.success) {
        // Update trades state
        setTrades([...trades]); // Trigger re-render
        
        // Recalculate analytics
        const updatedAnalytics = tagAnalyticsService.calculateTagAnalytics(trades);
        setTagAnalytics(updatedAnalytics);

        toast({
          title: "Tag Deleted",
          description: `Tag "${tag}" removed from ${result.affectedTrades} trades`,
        });
      } else {
        toast({
          title: "Delete Failed",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    }
  }, [trades]);

  // Handle bulk operations
  const handleBulkOperation = useCallback(async (operation: BulkTagOperation) => {
    try {
      // Validate operation first
      const validation = bulkTagOperationsService.validateOperation(operation, trades);
      
      if (!validation.isValid) {
        toast({
          title: "Validation Failed",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast({
          title: "Warning",
          description: validation.warnings.join(', '),
          variant: "default",
        });
      }

      // Execute the operation
      const result = await bulkTagOperationsService.executeBulkOperation(operation, trades);

      if (result.success) {
        // Update trades state
        setTrades([...trades]); // Trigger re-render
        
        // Recalculate analytics
        const updatedAnalytics = tagAnalyticsService.calculateTagAnalytics(trades);
        setTagAnalytics(updatedAnalytics);

        toast({
          title: "Bulk Operation Completed",
          description: `${operation.type} applied to ${result.affectedTrades} trades`,
        });
      } else {
        toast({
          title: "Operation Failed",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error executing bulk operation:', error);
      toast({
        title: "Error",
        description: "Failed to execute bulk operation",
        variant: "destructive",
      });
    }
  }, [trades]);

  // Handle adding tags to a specific trade
  const handleAddTagsToTrade = useCallback((tradeId: string, newTags: string[]) => {
    setTrades(prevTrades => 
      prevTrades.map(trade => {
        if (trade.id === tradeId) {
          const existingTags = trade.tags || [];
          const processedTags = tagService.processTags([...existingTags, ...newTags]);
          return { ...trade, tags: processedTags };
        }
        return trade;
      })
    );

    toast({
      title: "Tags Added",
      description: `Added ${newTags.length} tags to trade`,
    });
  }, []);

  // Get intelligent tag suggestions for a trade
  const getTagSuggestionsForTrade = useCallback((trade: Trade) => {
    return tagService.getIntelligentTagSuggestions(
      trades,
      '', // Empty input to get contextual suggestions
      trade,
      10
    );
  }, [trades]);

  // Example of using tag analytics for insights
  const generateTagInsights = useCallback(() => {
    if (!tagAnalytics) return;

    const insights = tagAnalyticsService.getTagInsights(trades);
    
    console.log('Tag Insights:', {
      totalTags: tagAnalytics.totalTags,
      averageTagsPerTrade: tagAnalytics.averageTagsPerTrade,
      topPerformingTags: tagAnalytics.topPerformingTags.slice(0, 5),
      insights: insights.insights,
      recommendations: insights.recommendations,
      warnings: insights.warnings
    });

    return insights;
  }, [tagAnalytics, trades]);

  // Example of tag performance comparison
  const compareTagPerformance = useCallback((tags: string[]) => {
    const comparison = tagAnalyticsService.compareTagPerformance(tags, trades);
    
    console.log('Tag Performance Comparison:', comparison);
    
    return comparison;
  }, [trades]);

  // Example of finding correlated tags
  const findTagCorrelations = useCallback(() => {
    if (!tagAnalytics) return [];

    const strongCorrelations = tagAnalytics.tagCorrelations.filter(
      (corr: any) => Math.abs(corr.correlation) > 0.5 && corr.bothTagsCount >= 2
    );

    console.log('Strong Tag Correlations:', strongCorrelations);
    
    return strongCorrelations;
  }, [tagAnalytics]);

  // Example of tag usage trends
  const analyzeTagUsageTrends = useCallback(() => {
    if (!tagAnalytics) return;

    const trends = tagAnalytics.tagUsageOverTime;
    
    // Find trending tags (increasing usage)
    const trendingTags = new Map<string, number>();
    
    if (trends.length >= 2) {
      const recent = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      
      Object.entries(recent.tagCounts).forEach(([tag, count]) => {
        const previousCount = previous.tagCounts[tag] || 0;
        const growth = count - previousCount;
        if (growth > 0) {
          trendingTags.set(tag, growth);
        }
      });
    }

    console.log('Trending Tags:', Array.from(trendingTags.entries()));
    
    return trendingTags;
  }, [tagAnalytics]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Trade Review with Advanced Tags</h1>
        <div className="space-x-2">
          <button
            onClick={() => setIsTagManagerOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Tags
          </button>
          <button
            onClick={generateTagInsights}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Generate Insights
          </button>
        </div>
      </div>

      {/* Trade List with Tag Information */}
      <div className="grid gap-4">
        {trades.map(trade => (
          <div key={trade.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{trade.currencyPair}</h3>
                <p className="text-sm text-gray-600">
                  {trade.side} • {trade.date} • {trade.status}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  (trade.pnl || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trade.pnl ? `$${trade.pnl}` : 'Open'}
                </p>
              </div>
            </div>
            
            {/* Tags Display */}
            <div className="flex flex-wrap gap-1 mb-2">
              {trade.tags?.map(tag => {
                // Find category for color coding
                const category = DEFAULT_TAG_CATEGORIES.find(cat =>
                  cat.keywords.some(keyword => 
                    tag.toLowerCase().includes(keyword)
                  )
                ) || DEFAULT_TAG_CATEGORIES.find(cat => cat.id === 'other');

                return (
                  <span
                    key={tag}
                    className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${
                      category?.bgColor || 'bg-gray-100'
                    } ${category?.color || 'text-gray-700'}`}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag.replace('#', '')}
                  </span>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setSelectedTrade(trade)}
                className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                Edit Tags
              </button>
              <button
                onClick={() => {
                  const suggestions = getTagSuggestionsForTrade(trade);
                  console.log('Suggestions for trade:', suggestions);
                }}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Get Suggestions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tag Analytics Summary */}
      {tagAnalytics && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Tag Analytics Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {tagAnalytics.totalTags}
              </p>
              <p className="text-sm text-gray-600">Total Tags</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {tagAnalytics.averageTagsPerTrade.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Avg Tags/Trade</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {tagAnalytics.topPerformingTags[0]?.winRate.toFixed(1) || 0}%
              </p>
              <p className="text-sm text-gray-600">Best Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {tagAnalytics.tagCorrelations.length}
              </p>
              <p className="text-sm text-gray-600">Correlations</p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Tag Manager */}
      <AdvancedTagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        trades={trades}
        onTagClick={handleTagClick}
        onTagDeleted={handleTagDeleted}
        onBulkOperation={handleBulkOperation}
        showPerformanceMetrics={true}
        allowBulkOperations={true}
        maxDisplayTags={100}
      />

      {/* Example Usage Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <button
          onClick={() => compareTagPerformance(['#breakout', '#reversal', '#trend-following'])}
          className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
        >
          Compare Tag Performance
        </button>
        <button
          onClick={findTagCorrelations}
          className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
        >
          Find Tag Correlations
        </button>
        <button
          onClick={analyzeTagUsageTrends}
          className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
        >
          Analyze Usage Trends
        </button>
        <button
          onClick={() => {
            const history = bulkTagOperationsService.getOperationHistory();
            console.log('Operation History:', history);
          }}
          className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          View Operation History
        </button>
      </div>
    </div>
  );
};

// Example of custom tag validation rules
export const setupCustomTagValidation = () => {
  // Add custom validation for strategy tags
  bulkTagOperationsService.addValidationRule({
    id: 'strategy_tag_validation',
    name: 'Strategy Tag Validation',
    description: 'Ensures strategy tags follow naming conventions',
    validator: (tag: string) => {
      const strategyKeywords = ['scalp', 'swing', 'breakout', 'reversal', 'trend'];
      const hasStrategyKeyword = strategyKeywords.some(keyword => 
        tag.toLowerCase().includes(keyword)
      );
      
      if (tag.toLowerCase().includes('strategy') && !hasStrategyKeyword) {
        return {
          isValid: false,
          message: 'Strategy tags should include a specific strategy type',
          suggestedAction: 'Add keywords like scalp, swing, breakout, etc.'
        };
      }
      
      return { isValid: true, message: 'Valid strategy tag' };
    },
    severity: 'warning'
  });

  // Add validation for currency pair tags
  bulkTagOperationsService.addValidationRule({
    id: 'currency_pair_validation',
    name: 'Currency Pair Validation',
    description: 'Validates currency pair tag formats',
    validator: (tag: string) => {
      const currencyPairPattern = /^#[A-Z]{3}\/[A-Z]{3}$/;
      const isCurrencyPairFormat = tag.includes('/') && tag.length === 8;
      
      if (isCurrencyPairFormat && !currencyPairPattern.test(tag)) {
        return {
          isValid: false,
          message: 'Currency pair tags should be in format #XXX/XXX',
          suggestedAction: 'Use uppercase letters and forward slash'
        };
      }
      
      return { isValid: true, message: 'Valid currency pair tag' };
    },
    severity: 'error'
  });
};

// Example of tag merge rules for cleanup
export const createTagMergeRules = () => {
  return [
    {
      sourceTags: ['#scalp', '#scalping', '#quick-trade'],
      targetTag: '#scalping',
      strategy: 'replace' as const
    },
    {
      sourceTags: ['#swing', '#swing-trade', '#multi-day'],
      targetTag: '#swing-trading',
      strategy: 'replace' as const
    },
    {
      sourceTags: ['#breakout', '#break-out', '#momentum'],
      targetTag: '#breakout-strategy',
      strategy: 'replace' as const
    }
  ];
};

// Example of performance-based tag recommendations
export const getPerformanceBasedRecommendations = (trades: Trade[]) => {
  const analytics = tagAnalyticsService.calculateTagAnalytics(trades);
  const recommendations = [];

  // Recommend high-performing tags
  const highPerformers = analytics.topPerformingTags
    .filter(tag => tag.winRate > 70 && tag.totalTrades >= 5)
    .slice(0, 3);

  if (highPerformers.length > 0) {
    recommendations.push({
      type: 'focus',
      message: `Focus on these high-performing tags: ${highPerformers.map(t => t.tag).join(', ')}`,
      tags: highPerformers.map(t => t.tag)
    });
  }

  // Warn about poor performers
  const poorPerformers = analytics.worstPerformingTags
    .filter(tag => tag.winRate < 40 && tag.totalTrades >= 5)
    .slice(0, 3);

  if (poorPerformers.length > 0) {
    recommendations.push({
      type: 'avoid',
      message: `Consider avoiding these poor-performing tags: ${poorPerformers.map(t => t.tag).join(', ')}`,
      tags: poorPerformers.map(t => t.tag)
    });
  }

  // Suggest tag consolidation
  const similarTags = analytics.tagCorrelations
    .filter(corr => corr.correlation > 0.8 && corr.bothTagsCount >= 3)
    .slice(0, 2);

  if (similarTags.length > 0) {
    recommendations.push({
      type: 'consolidate',
      message: 'Consider merging highly correlated tags',
      correlations: similarTags
    });
  }

  return recommendations;
};

export default TradeReviewWithAdvancedTags;
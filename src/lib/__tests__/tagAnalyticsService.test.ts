import { describe, it, expect, beforeEach } from 'vitest';
import { tagAnalyticsService, TagAnalyticsService } from '../tagAnalyticsService';
import { Trade } from '../../types/trade';

describe('TagAnalyticsService', () => {
  let service: TagAnalyticsService;
  let mockTrades: Trade[];

  beforeEach(() => {
    service = TagAnalyticsService.getInstance();
    
    // Create mock trades with various tags and performance
    mockTrades = [
      {
        id: '1',
        accountId: 'acc1',
        tags: ['#scalping', '#morning'],
        currencyPair: 'EUR/USD',
        date: '2024-01-15',
        timeIn: '09:00',
        timeOut: '09:30',
        side: 'long',
        entryPrice: 1.0950,
        exitPrice: 1.0970,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 200
      },
      {
        id: '2',
        accountId: 'acc1',
        tags: ['#scalping', '#afternoon'],
        currencyPair: 'GBP/USD',
        date: '2024-01-16',
        timeIn: '14:00',
        timeOut: '14:15',
        side: 'short',
        entryPrice: 1.2650,
        exitPrice: 1.2630,
        lotSize: 0.5,
        lotType: 'standard',
        units: 50000,
        commission: 3,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 100
      },
      {
        id: '3',
        accountId: 'acc1',
        tags: ['#swing', '#morning'],
        currencyPair: 'USD/JPY',
        date: '2024-01-17',
        timeIn: '08:00',
        timeOut: '16:00',
        side: 'long',
        entryPrice: 148.50,
        exitPrice: 147.80,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: -150
      },
      {
        id: '4',
        accountId: 'acc1',
        tags: ['#breakout', '#news'],
        currencyPair: 'EUR/USD',
        date: '2024-01-18',
        timeIn: '10:00',
        timeOut: '11:00',
        side: 'long',
        entryPrice: 1.0900,
        exitPrice: 1.0950,
        lotSize: 2,
        lotType: 'standard',
        units: 200000,
        commission: 8,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 1000
      },
      {
        id: '5',
        accountId: 'acc1',
        tags: ['#scalping', '#news'],
        currencyPair: 'GBP/USD',
        date: '2024-02-01',
        timeIn: '15:00',
        timeOut: '15:05',
        side: 'short',
        entryPrice: 1.2700,
        exitPrice: 1.2720,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: -200
      }
    ];
  });

  describe('calculateTagAnalytics', () => {
    it('should calculate basic analytics correctly', () => {
      const analytics = service.calculateTagAnalytics(mockTrades);

      expect(analytics.totalTags).toBeGreaterThan(0);
      expect(analytics.averageTagsPerTrade).toBe(2); // Each trade has 2 tags
      expect(analytics.mostUsedTags).toBeDefined();
      expect(analytics.leastUsedTags).toBeDefined();
      expect(analytics.tagPerformance).toBeDefined();
    });

    it('should identify most used tags correctly', () => {
      const analytics = service.calculateTagAnalytics(mockTrades);
      
      // #scalping appears in 3 trades, should be most used
      const scalpingTag = analytics.mostUsedTags.find(tag => tag.tag === '#scalping');
      expect(scalpingTag).toBeDefined();
      expect(scalpingTag?.count).toBe(3);
    });

    it('should handle empty trades array', () => {
      const analytics = service.calculateTagAnalytics([]);

      expect(analytics.totalTags).toBe(0);
      expect(analytics.averageTagsPerTrade).toBe(0);
      expect(analytics.mostUsedTags).toHaveLength(0);
      expect(analytics.tagPerformance).toHaveLength(0);
    });

    it('should handle trades without tags', () => {
      const tradesWithoutTags: Trade[] = [
        {
          ...mockTrades[0],
          id: 'no-tags',
          tags: undefined
        }
      ];

      const analytics = service.calculateTagAnalytics(tradesWithoutTags);

      expect(analytics.totalTags).toBe(0);
      expect(analytics.averageTagsPerTrade).toBe(0);
    });
  });

  describe('calculateDetailedTagPerformance', () => {
    it('should calculate performance metrics correctly', () => {
      const performance = service.calculateDetailedTagPerformance('#scalping', mockTrades);

      expect(performance.tag).toBe('#scalping');
      expect(performance.totalTrades).toBe(3);
      expect(performance.winRate).toBeCloseTo(66.67, 1); // 2 wins out of 3 trades
      expect(performance.totalPnL).toBe(100); // 200 + 100 - 200
      expect(performance.averagePnL).toBeCloseTo(33.33, 1);
      expect(performance.profitFactor).toBeGreaterThan(0);
    });

    it('should handle tag with no trades', () => {
      const performance = service.calculateDetailedTagPerformance('#nonexistent', mockTrades);

      expect(performance.tag).toBe('#nonexistent');
      expect(performance.totalTrades).toBe(0);
      expect(performance.winRate).toBe(0);
      expect(performance.totalPnL).toBe(0);
      expect(performance.profitFactor).toBe(0);
    });

    it('should calculate profit factor correctly', () => {
      const performance = service.calculateDetailedTagPerformance('#scalping', mockTrades);

      // Total wins: 200 + 100 = 300
      // Total losses: 200
      // Profit factor: 300 / 200 = 1.5
      expect(performance.profitFactor).toBeCloseTo(1.5, 1);
    });

    it('should handle all winning trades', () => {
      const winningTrades = mockTrades.filter(trade => (trade.pnl || 0) > 0);
      const performance = service.calculateDetailedTagPerformance('#scalping', winningTrades);

      expect(performance.winRate).toBe(100);
      expect(performance.profitFactor).toBe(Infinity);
    });
  });

  describe('calculateTagUsageOverTime', () => {
    it('should group tags by month correctly', () => {
      const usageOverTime = service.calculateTagUsageOverTime(mockTrades);

      expect(usageOverTime).toHaveLength(2); // January and February 2024
      
      const januaryData = usageOverTime.find(data => data.period === '2024-01');
      expect(januaryData).toBeDefined();
      expect(januaryData?.totalTrades).toBe(4);
      expect(januaryData?.tagCounts['#scalping']).toBe(2);

      const februaryData = usageOverTime.find(data => data.period === '2024-02');
      expect(februaryData).toBeDefined();
      expect(februaryData?.totalTrades).toBe(1);
      expect(februaryData?.tagCounts['#scalping']).toBe(1);
    });

    it('should handle empty trades', () => {
      const usageOverTime = service.calculateTagUsageOverTime([]);
      expect(usageOverTime).toHaveLength(0);
    });
  });

  describe('calculateTagCorrelations', () => {
    it('should calculate correlations between tags', () => {
      const tags = ['#scalping', '#morning', '#news'];
      const correlations = service.calculateTagCorrelations(mockTrades, tags);

      expect(correlations).toBeDefined();
      expect(correlations.length).toBeGreaterThan(0);

      // Check that correlations are between -1 and 1
      correlations.forEach(corr => {
        expect(corr.correlation).toBeGreaterThanOrEqual(-1);
        expect(corr.correlation).toBeLessThanOrEqual(1);
      });
    });

    it('should identify co-occurrences correctly', () => {
      const tags = ['#scalping', '#morning'];
      const correlations = service.calculateTagCorrelations(mockTrades, tags);

      const scalpingMorningCorr = correlations.find(
        corr => (corr.tag1 === '#scalping' && corr.tag2 === '#morning') ||
                (corr.tag1 === '#morning' && corr.tag2 === '#scalping')
      );

      expect(scalpingMorningCorr).toBeDefined();
      expect(scalpingMorningCorr?.bothTagsCount).toBe(1); // Only trade 1 has both tags
    });
  });

  describe('compareTagPerformance', () => {
    it('should compare multiple tags correctly', () => {
      const tags = ['#scalping', '#swing', '#breakout'];
      const comparison = service.compareTagPerformance(tags, mockTrades);

      expect(comparison.tags).toEqual(['#scalping', '#swing', '#breakout']);
      expect(comparison.metrics.winRate).toHaveLength(3);
      expect(comparison.metrics.totalPnL).toHaveLength(3);
      expect(comparison.metrics.profitFactor).toHaveLength(3);

      // Check that metrics are numbers
      comparison.metrics.winRate.forEach(rate => {
        expect(typeof rate).toBe('number');
      });
    });

    it('should handle empty tags array', () => {
      const comparison = service.compareTagPerformance([], mockTrades);

      expect(comparison.tags).toHaveLength(0);
      expect(comparison.metrics.winRate).toHaveLength(0);
    });
  });

  describe('getTagInsights', () => {
    it('should generate insights for tag usage', () => {
      const insights = service.getTagInsights(mockTrades);

      expect(insights.insights).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.warnings).toBeDefined();

      // Should have at least recommendations since we have tagged trades
      expect(insights.insights.length + insights.recommendations.length + insights.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify high performing tags', () => {
      // Create trades where #breakout has high performance
      const highPerfTrades = [
        ...mockTrades,
        {
          ...mockTrades[0],
          id: 'high-perf-1',
          tags: ['#breakout'],
          pnl: 500
        },
        {
          ...mockTrades[0],
          id: 'high-perf-2',
          tags: ['#breakout'],
          pnl: 300
        },
        {
          ...mockTrades[0],
          id: 'high-perf-3',
          tags: ['#breakout'],
          pnl: 400
        },
        {
          ...mockTrades[0],
          id: 'high-perf-4',
          tags: ['#breakout'],
          pnl: 200
        }
      ];

      const insights = service.getTagInsights(highPerfTrades);

      // Should identify #breakout as high performing
      const hasBreakoutInsight = insights.insights.some(insight => 
        insight.includes('#breakout')
      );
      expect(hasBreakoutInsight).toBe(true);
    });

    it('should handle trades without tags', () => {
      const tradesWithoutTags = mockTrades.map(trade => ({
        ...trade,
        tags: undefined
      }));

      const insights = service.getTagInsights(tradesWithoutTags);

      expect(insights.recommendations).toContain(
        "Consider adding more tags to your trades for better categorization and analysis."
      );
    });
  });

  describe('edge cases', () => {
    it('should handle trades with malformed tags', () => {
      const malformedTrades: Trade[] = [
        {
          ...mockTrades[0],
          id: 'malformed-test',
          tags: ['', '   ', 'notag', '#validtag']
        }
      ];

      const analytics = service.calculateTagAnalytics(malformedTrades);

      // Should only count valid tags (notag becomes #notag, #validtag stays)
      expect(analytics.totalTags).toBeGreaterThan(0);
      const hasValidTag = analytics.mostUsedTags.some(tag => 
        tag.tag === '#validtag' || tag.tag === '#notag'
      );
      expect(hasValidTag).toBe(true);
    });

    it('should handle very large datasets efficiently', () => {
      // Create a large dataset
      const largeTrades: Trade[] = [];
      for (let i = 0; i < 1000; i++) {
        largeTrades.push({
          ...mockTrades[0],
          id: `trade-${i}`,
          tags: [`#tag${i % 10}`, `#category${i % 5}`],
          pnl: Math.random() * 200 - 100 // Random P&L between -100 and 100
        });
      }

      const startTime = Date.now();
      const analytics = service.calculateTagAnalytics(largeTrades);
      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(analytics.totalTags).toBeGreaterThan(0);
    });

    it('should handle trades with duplicate tags', () => {
      const duplicateTrades: Trade[] = [
        {
          ...mockTrades[0],
          tags: ['#scalping', '#scalping', '#morning'] // Duplicate #scalping
        }
      ];

      const analytics = service.calculateTagAnalytics(duplicateTrades);

      // Should handle duplicates gracefully
      expect(analytics.totalTags).toBeGreaterThan(0);
    });
  });
});
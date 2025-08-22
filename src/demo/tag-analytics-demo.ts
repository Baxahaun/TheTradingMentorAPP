/**
 * Demo script to showcase tag analytics functionality
 * This demonstrates the core features implemented in task 9
 */

import { Trade } from '../types/trade';
import { tagAnalyticsService } from '../lib/tagAnalyticsService';

// Sample trades with various tags and performance
const sampleTrades: Trade[] = [
  {
    id: '1',
    accountId: 'demo-account',
    tags: ['#scalping', '#morning', '#eur-usd'],
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
    accountId: 'demo-account',
    tags: ['#scalping', '#afternoon', '#gbp-usd'],
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
    accountId: 'demo-account',
    tags: ['#swing', '#morning', '#usd-jpy'],
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
    accountId: 'demo-account',
    tags: ['#breakout', '#news', '#eur-usd'],
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
    accountId: 'demo-account',
    tags: ['#scalping', '#news', '#volatile'],
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
  },
  {
    id: '6',
    accountId: 'demo-account',
    tags: ['#breakout', '#morning', '#trending'],
    currencyPair: 'EUR/USD',
    date: '2024-02-02',
    timeIn: '09:30',
    timeOut: '10:30',
    side: 'long',
    entryPrice: 1.0920,
    exitPrice: 1.0980,
    lotSize: 1.5,
    lotType: 'standard',
    units: 150000,
    commission: 6,
    accountCurrency: 'USD',
    status: 'closed',
    pnl: 900
  }
];

/**
 * Demonstrate tag analytics functionality
 */
export function demonstrateTagAnalytics() {
  console.log('=== Tag Analytics Demo ===\n');

  // 1. Calculate comprehensive analytics
  console.log('1. Comprehensive Tag Analytics:');
  const analytics = tagAnalyticsService.calculateTagAnalytics(sampleTrades);
  
  console.log(`   Total Tags: ${analytics.totalTags}`);
  console.log(`   Average Tags per Trade: ${analytics.averageTagsPerTrade.toFixed(2)}`);
  console.log(`   Most Used Tags: ${analytics.mostUsedTags.slice(0, 3).map(t => `${t.tag} (${t.count})`).join(', ')}`);
  console.log(`   Top Performing Tags: ${analytics.topPerformingTags.slice(0, 3).map(t => `${t.tag} (${t.winRate.toFixed(1)}% WR)`).join(', ')}`);
  console.log('');

  // 2. Detailed performance for specific tag
  console.log('2. Detailed Performance Analysis for #scalping:');
  const scalpingPerf = tagAnalyticsService.calculateDetailedTagPerformance('#scalping', sampleTrades);
  
  console.log(`   Total Trades: ${scalpingPerf.totalTrades}`);
  console.log(`   Win Rate: ${scalpingPerf.winRate.toFixed(1)}%`);
  console.log(`   Average P&L: $${scalpingPerf.averagePnL.toFixed(2)}`);
  console.log(`   Total P&L: $${scalpingPerf.totalPnL.toFixed(2)}`);
  console.log(`   Profit Factor: ${scalpingPerf.profitFactor === Infinity ? '∞' : scalpingPerf.profitFactor.toFixed(2)}`);
  console.log(`   Best Trade: $${scalpingPerf.bestTrade.toFixed(2)}`);
  console.log(`   Worst Trade: $${scalpingPerf.worstTrade.toFixed(2)}`);
  console.log(`   Win Streak: ${scalpingPerf.winStreak}`);
  console.log(`   Loss Streak: ${scalpingPerf.lossStreak}`);
  console.log(`   Sharpe Ratio: ${scalpingPerf.sharpeRatio.toFixed(2)}`);
  console.log(`   Max Drawdown: $${scalpingPerf.maxDrawdown.toFixed(2)}`);
  console.log(`   Consistency: ${scalpingPerf.consistency.toFixed(1)}%`);
  console.log('');

  // 3. Tag usage over time
  console.log('3. Tag Usage Over Time:');
  const usageOverTime = tagAnalyticsService.calculateTagUsageOverTime(sampleTrades);
  usageOverTime.forEach(period => {
    console.log(`   ${period.period}: ${period.totalTrades} trades`);
    const topTags = Object.entries(period.tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag, count]) => `${tag}(${count})`)
      .join(', ');
    console.log(`     Top tags: ${topTags}`);
  });
  console.log('');

  // 4. Tag correlations
  console.log('4. Tag Correlations:');
  const allTags = ['#scalping', '#breakout', '#morning', '#news'];
  const correlations = tagAnalyticsService.calculateTagCorrelations(sampleTrades, allTags);
  
  correlations
    .filter(corr => Math.abs(corr.correlation) > 0.3)
    .slice(0, 5)
    .forEach(corr => {
      console.log(`   ${corr.tag1} + ${corr.tag2}: ${(corr.correlation * 100).toFixed(0)}% correlation (${corr.bothTagsCount} co-occurrences)`);
    });
  console.log('');

  // 5. Tag comparison
  console.log('5. Tag Performance Comparison:');
  const comparisonTags = ['#scalping', '#breakout', '#swing'];
  const comparison = tagAnalyticsService.compareTagPerformance(comparisonTags, sampleTrades);
  
  comparison.tags.forEach((tag, index) => {
    console.log(`   ${tag}:`);
    console.log(`     Win Rate: ${comparison.metrics.winRate[index].toFixed(1)}%`);
    console.log(`     Avg P&L: $${comparison.metrics.averagePnL[index].toFixed(2)}`);
    console.log(`     Total P&L: $${comparison.metrics.totalPnL[index].toFixed(2)}`);
    console.log(`     Profit Factor: ${comparison.metrics.profitFactor[index] === Infinity ? '∞' : comparison.metrics.profitFactor[index].toFixed(2)}`);
    console.log(`     Total Trades: ${comparison.metrics.totalTrades[index]}`);
  });
  console.log('');

  // 6. Insights and recommendations
  console.log('6. AI-Generated Insights:');
  const insights = tagAnalyticsService.getTagInsights(sampleTrades);
  
  if (insights.insights.length > 0) {
    console.log('   Key Insights:');
    insights.insights.forEach(insight => console.log(`     • ${insight}`));
  }
  
  if (insights.recommendations.length > 0) {
    console.log('   Recommendations:');
    insights.recommendations.forEach(rec => console.log(`     • ${rec}`));
  }
  
  if (insights.warnings.length > 0) {
    console.log('   Warnings:');
    insights.warnings.forEach(warning => console.log(`     • ${warning}`));
  }

  console.log('\n=== Demo Complete ===');
}

// Export for use in other files
export { sampleTrades };

// Run demo if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  demonstrateTagAnalytics();
}
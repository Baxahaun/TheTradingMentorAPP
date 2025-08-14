import { Trade, SetupType, PatternType, TradeSetup, TradePattern, PartialClose } from '../types/trade';

export interface SetupPerformanceReport {
  setupType: SetupType;
  setupName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  avgRMultiple: number;
  avgHoldingTime: number;
  bestTimeframe: string;
  worstTimeframe: string;
  marketConditionPerformance: {
    trending: { trades: number; winRate: number; avgPnL: number };
    ranging: { trades: number; winRate: number; avgPnL: number };
    breakout: { trades: number; winRate: number; avgPnL: number };
    reversal: { trades: number; winRate: number; avgPnL: number };
  };
}

export interface PatternPerformanceReport {
  patternType: PatternType;
  patternName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  successRate: number;
  totalPnL: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  timeframePerformance: { [timeframe: string]: { trades: number; winRate: number; avgPnL: number } };
  qualityAnalysis: {
    quality1: { trades: number; winRate: number };
    quality2: { trades: number; winRate: number };
    quality3: { trades: number; winRate: number };
    quality4: { trades: number; winRate: number };
    quality5: { trades: number; winRate: number };
  };
  confluenceImpact: {
    withConfluence: { trades: number; winRate: number; avgPnL: number };
    withoutConfluence: { trades: number; winRate: number; avgPnL: number };
  };
}

export interface PositionManagementReport {
  totalTradesWithPartialCloses: number;
  avgPartialClosesPerTrade: number;
  partialCloseSuccessRate: number;
  totalRealizedFromPartials: number;
  avgPositionManagementScore: number;
  exitReasonAnalysis: {
    profit_taking: { count: number; avgPnL: number };
    risk_reduction: { count: number; avgPnL: number };
    trailing_stop: { count: number; avgPnL: number };
    manual: { count: number; avgPnL: number };
    other: { count: number; avgPnL: number };
  };
  positionSizingEfficiency: {
    avgInitialPosition: number;
    avgFinalPosition: number;
    avgHoldTimeBySize: { [size: string]: number };
  };
  comparisonWithFullPositions: {
    partiallyManagedTrades: { count: number; avgPnL: number; winRate: number };
    fullPositionTrades: { count: number; avgPnL: number; winRate: number };
    improvementFromManagement: number; // Percentage improvement
  };
}

export interface EnhancedReportSummary {
  setupAnalysis: SetupPerformanceReport[];
  patternAnalysis: PatternPerformanceReport[];
  positionManagementAnalysis: PositionManagementReport;
  combinedInsights: {
    bestSetupPatternCombination: {
      setup: SetupType;
      pattern: PatternType;
      trades: number;
      winRate: number;
      avgPnL: number;
    };
    worstSetupPatternCombination: {
      setup: SetupType;
      pattern: PatternType;
      trades: number;
      winRate: number;
      avgPnL: number;
    };
    setupWithBestPositionManagement: {
      setup: SetupType;
      avgManagementScore: number;
      improvementFromManagement: number;
    };
  };
}

/**
 * Enhanced Reports Service for Advanced Trade Analytics
 * Provides comprehensive analysis of setup classification, pattern recognition,
 * and position management performance
 */
export class EnhancedReportsService {
  
  /**
   * Generate comprehensive setup performance analysis
   */
  static generateSetupPerformanceReport(trades: Trade[]): SetupPerformanceReport[] {
    const tradesWithSetup = trades.filter(trade => 
      trade.setup && trade.status === 'closed' && trade.pnl !== undefined
    );

    const setupGroups = this.groupTradesBySetup(tradesWithSetup);
    
    return Object.entries(setupGroups).map(([setupType, setupTrades]) => {
      const winningTrades = setupTrades.filter(trade => trade.pnl! > 0);
      const losingTrades = setupTrades.filter(trade => trade.pnl! <= 0);
      
      const totalPnL = setupTrades.reduce((sum, trade) => sum + trade.pnl!, 0);
      const grossWins = winningTrades.reduce((sum, trade) => sum + trade.pnl!, 0);
      const grossLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl!, 0));
      
      const avgWin = winningTrades.length > 0 ? grossWins / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? grossLosses / losingTrades.length : 0;
      const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0;
      
      // Calculate average R-multiple
      const rMultiples = setupTrades
        .filter(trade => trade.rMultiple !== undefined)
        .map(trade => trade.rMultiple!);
      const avgRMultiple = rMultiples.length > 0 
        ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length 
        : 0;

      // Calculate average holding time
      const avgHoldingTime = this.calculateAverageHoldingTime(setupTrades);

      // Analyze timeframe performance
      const timeframePerformance = this.analyzeTimeframePerformance(setupTrades);
      const bestTimeframe = Object.entries(timeframePerformance)
        .sort(([,a], [,b]) => b.winRate - a.winRate)[0]?.[0] || 'N/A';
      const worstTimeframe = Object.entries(timeframePerformance)
        .sort(([,a], [,b]) => a.winRate - b.winRate)[0]?.[0] || 'N/A';

      // Analyze market condition performance
      const marketConditionPerformance = this.analyzeMarketConditionPerformance(setupTrades);

      return {
        setupType: setupType as SetupType,
        setupName: this.getSetupDisplayName(setupType as SetupType),
        totalTrades: setupTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: setupTrades.length > 0 ? (winningTrades.length / setupTrades.length) * 100 : 0,
        totalPnL,
        avgWin,
        avgLoss,
        profitFactor,
        avgRMultiple,
        avgHoldingTime,
        bestTimeframe,
        worstTimeframe,
        marketConditionPerformance
      };
    }).sort((a, b) => b.profitFactor - a.profitFactor);
  }

  /**
   * Generate comprehensive pattern performance analysis
   */
  static generatePatternPerformanceReport(trades: Trade[]): PatternPerformanceReport[] {
    const tradesWithPatterns = trades.filter(trade => 
      trade.patterns && trade.patterns.length > 0 && trade.status === 'closed' && trade.pnl !== undefined
    );

    const patternGroups = this.groupTradesByPattern(tradesWithPatterns);
    
    return Object.entries(patternGroups).map(([patternType, patternTrades]) => {
      const winningTrades = patternTrades.filter(trade => trade.pnl! > 0);
      const losingTrades = patternTrades.filter(trade => trade.pnl! <= 0);
      
      const totalPnL = patternTrades.reduce((sum, trade) => sum + trade.pnl!, 0);
      const grossWins = winningTrades.reduce((sum, trade) => sum + trade.pnl!, 0);
      const grossLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl!, 0));
      
      const avgProfit = winningTrades.length > 0 ? grossWins / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? grossLosses / losingTrades.length : 0;
      const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0;

      // Analyze timeframe performance
      const timeframePerformance = this.analyzeTimeframePerformance(patternTrades);

      // Analyze quality impact
      const qualityAnalysis = this.analyzePatternQualityImpact(patternTrades);

      // Analyze confluence impact
      const confluenceImpact = this.analyzePatternConfluenceImpact(patternTrades);

      return {
        patternType: patternType as PatternType,
        patternName: this.getPatternDisplayName(patternType as PatternType),
        totalTrades: patternTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        successRate: patternTrades.length > 0 ? (winningTrades.length / patternTrades.length) * 100 : 0,
        totalPnL,
        avgProfit,
        avgLoss,
        profitFactor,
        timeframePerformance,
        qualityAnalysis,
        confluenceImpact
      };
    }).sort((a, b) => b.profitFactor - a.profitFactor);
  }

  /**
   * Generate position management performance analysis
   */
  static generatePositionManagementReport(trades: Trade[]): PositionManagementReport {
    const tradesWithPartialCloses = trades.filter(trade => 
      trade.partialCloses && trade.partialCloses.length > 0 && trade.status === 'closed'
    );

    const tradesWithoutPartialCloses = trades.filter(trade => 
      (!trade.partialCloses || trade.partialCloses.length === 0) && trade.status === 'closed' && trade.pnl !== undefined
    );

    // Calculate basic metrics
    const totalPartialCloses = tradesWithPartialCloses.reduce(
      (sum, trade) => sum + (trade.partialCloses?.length || 0), 0
    );
    const avgPartialClosesPerTrade = tradesWithPartialCloses.length > 0 
      ? totalPartialCloses / tradesWithPartialCloses.length 
      : 0;

    // Calculate success rate (trades with partials that were profitable)
    const successfulPartialTrades = tradesWithPartialCloses.filter(trade => trade.pnl! > 0);
    const partialCloseSuccessRate = tradesWithPartialCloses.length > 0 
      ? (successfulPartialTrades.length / tradesWithPartialCloses.length) * 100 
      : 0;

    // Calculate total realized from partials
    const totalRealizedFromPartials = tradesWithPartialCloses.reduce((sum, trade) => {
      return sum + (trade.partialCloses?.reduce((pSum, pc) => pSum + pc.pnlRealized, 0) || 0);
    }, 0);

    // Calculate average position management score
    const scoresWithManagement = tradesWithPartialCloses
      .filter(trade => trade.positionManagementScore !== undefined)
      .map(trade => trade.positionManagementScore!);
    const avgPositionManagementScore = scoresWithManagement.length > 0
      ? scoresWithManagement.reduce((sum, score) => sum + score, 0) / scoresWithManagement.length
      : 0;

    // Analyze exit reasons
    const exitReasonAnalysis = this.analyzeExitReasons(tradesWithPartialCloses);

    // Analyze position sizing efficiency
    const positionSizingEfficiency = this.analyzePositionSizingEfficiency(tradesWithPartialCloses);

    // Compare with full position trades
    const comparisonWithFullPositions = this.comparePartialVsFullPositions(
      tradesWithPartialCloses, 
      tradesWithoutPartialCloses
    );

    return {
      totalTradesWithPartialCloses: tradesWithPartialCloses.length,
      avgPartialClosesPerTrade,
      partialCloseSuccessRate,
      totalRealizedFromPartials,
      avgPositionManagementScore,
      exitReasonAnalysis,
      positionSizingEfficiency,
      comparisonWithFullPositions
    };
  }

  /**
   * Generate comprehensive enhanced report summary
   */
  static generateEnhancedReportSummary(trades: Trade[]): EnhancedReportSummary {
    const setupAnalysis = this.generateSetupPerformanceReport(trades);
    const patternAnalysis = this.generatePatternPerformanceReport(trades);
    const positionManagementAnalysis = this.generatePositionManagementReport(trades);

    // Find best and worst setup-pattern combinations
    const combinedInsights = this.analyzeCombinedInsights(trades);

    return {
      setupAnalysis,
      patternAnalysis,
      positionManagementAnalysis,
      combinedInsights
    };
  }

  // Helper methods
  private static groupTradesBySetup(trades: Trade[]): { [key: string]: Trade[] } {
    return trades.reduce((groups, trade) => {
      const setupType = trade.setup!.type;
      if (!groups[setupType]) {
        groups[setupType] = [];
      }
      groups[setupType].push(trade);
      return groups;
    }, {} as { [key: string]: Trade[] });
  }

  private static groupTradesByPattern(trades: Trade[]): { [key: string]: Trade[] } {
    const groups: { [key: string]: Trade[] } = {};
    
    trades.forEach(trade => {
      trade.patterns!.forEach(pattern => {
        if (!groups[pattern.type]) {
          groups[pattern.type] = [];
        }
        groups[pattern.type].push(trade);
      });
    });
    
    return groups;
  }

  private static calculateAverageHoldingTime(trades: Trade[]): number {
    const tradesWithDuration = trades.filter(trade => 
      trade.timeIn && trade.timeOut && trade.date
    );
    
    if (tradesWithDuration.length === 0) return 0;
    
    const totalHours = tradesWithDuration.reduce((sum, trade) => {
      const entryTime = new Date(`${trade.date} ${trade.timeIn}`);
      const exitTime = new Date(`${trade.date} ${trade.timeOut}`);
      const durationHours = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
      return sum + Math.max(0, durationHours);
    }, 0);
    
    return totalHours / tradesWithDuration.length;
  }

  private static analyzeTimeframePerformance(trades: Trade[]): { [timeframe: string]: { trades: number; winRate: number; avgPnL: number } } {
    const timeframeGroups = trades.reduce((groups, trade) => {
      const timeframe = trade.timeframe || 'Unknown';
      if (!groups[timeframe]) {
        groups[timeframe] = [];
      }
      groups[timeframe].push(trade);
      return groups;
    }, {} as { [key: string]: Trade[] });

    return Object.entries(timeframeGroups).reduce((result, [timeframe, tfTrades]) => {
      const winningTrades = tfTrades.filter(trade => trade.pnl! > 0);
      const avgPnL = tfTrades.reduce((sum, trade) => sum + trade.pnl!, 0) / tfTrades.length;
      
      result[timeframe] = {
        trades: tfTrades.length,
        winRate: (winningTrades.length / tfTrades.length) * 100,
        avgPnL
      };
      return result;
    }, {} as { [timeframe: string]: { trades: number; winRate: number; avgPnL: number } });
  }

  private static analyzeMarketConditionPerformance(trades: Trade[]): SetupPerformanceReport['marketConditionPerformance'] {
    const conditions = ['trending', 'ranging', 'breakout', 'reversal'] as const;
    
    return conditions.reduce((result, condition) => {
      const conditionTrades = trades.filter(trade => trade.setup?.marketCondition === condition);
      const winningTrades = conditionTrades.filter(trade => trade.pnl! > 0);
      const avgPnL = conditionTrades.length > 0 
        ? conditionTrades.reduce((sum, trade) => sum + trade.pnl!, 0) / conditionTrades.length 
        : 0;
      
      result[condition] = {
        trades: conditionTrades.length,
        winRate: conditionTrades.length > 0 ? (winningTrades.length / conditionTrades.length) * 100 : 0,
        avgPnL
      };
      return result;
    }, {} as SetupPerformanceReport['marketConditionPerformance']);
  }

  private static analyzePatternQualityImpact(trades: Trade[]): PatternPerformanceReport['qualityAnalysis'] {
    const qualities = [1, 2, 3, 4, 5] as const;
    
    return qualities.reduce((result, quality) => {
      const qualityTrades = trades.filter(trade => 
        trade.patterns!.some(pattern => pattern.quality === quality)
      );
      const winningTrades = qualityTrades.filter(trade => trade.pnl! > 0);
      
      result[`quality${quality}` as keyof PatternPerformanceReport['qualityAnalysis']] = {
        trades: qualityTrades.length,
        winRate: qualityTrades.length > 0 ? (winningTrades.length / qualityTrades.length) * 100 : 0
      };
      return result;
    }, {} as PatternPerformanceReport['qualityAnalysis']);
  }

  private static analyzePatternConfluenceImpact(trades: Trade[]): PatternPerformanceReport['confluenceImpact'] {
    const withConfluence = trades.filter(trade => 
      trade.patterns!.some(pattern => pattern.confluence)
    );
    const withoutConfluence = trades.filter(trade => 
      trade.patterns!.every(pattern => !pattern.confluence)
    );

    const analyzeGroup = (groupTrades: Trade[]) => {
      const winningTrades = groupTrades.filter(trade => trade.pnl! > 0);
      const avgPnL = groupTrades.length > 0 
        ? groupTrades.reduce((sum, trade) => sum + trade.pnl!, 0) / groupTrades.length 
        : 0;
      
      return {
        trades: groupTrades.length,
        winRate: groupTrades.length > 0 ? (winningTrades.length / groupTrades.length) * 100 : 0,
        avgPnL
      };
    };

    return {
      withConfluence: analyzeGroup(withConfluence),
      withoutConfluence: analyzeGroup(withoutConfluence)
    };
  }

  private static analyzeExitReasons(trades: Trade[]): PositionManagementReport['exitReasonAnalysis'] {
    const reasons = ['profit_taking', 'risk_reduction', 'trailing_stop', 'manual', 'other'] as const;
    
    return reasons.reduce((result, reason) => {
      const reasonPartials = trades.flatMap(trade => 
        (trade.partialCloses || []).filter(pc => pc.reason === reason)
      );
      
      const avgPnL = reasonPartials.length > 0 
        ? reasonPartials.reduce((sum, pc) => sum + pc.pnlRealized, 0) / reasonPartials.length 
        : 0;
      
      result[reason] = {
        count: reasonPartials.length,
        avgPnL
      };
      return result;
    }, {} as PositionManagementReport['exitReasonAnalysis']);
  }

  private static analyzePositionSizingEfficiency(trades: Trade[]): PositionManagementReport['positionSizingEfficiency'] {
    const avgInitialPosition = trades.length > 0 
      ? trades.reduce((sum, trade) => sum + trade.lotSize, 0) / trades.length 
      : 0;

    const avgFinalPosition = trades.length > 0 
      ? trades.reduce((sum, trade) => {
          const finalSize = trade.partialCloses && trade.partialCloses.length > 0
            ? trade.partialCloses[trade.partialCloses.length - 1].remainingLots
            : trade.lotSize;
          return sum + finalSize;
        }, 0) / trades.length 
      : 0;

    // Simplified hold time by size analysis
    const avgHoldTimeBySize = {
      'small': this.calculateAverageHoldingTime(trades.filter(t => t.lotSize <= 0.1)),
      'medium': this.calculateAverageHoldingTime(trades.filter(t => t.lotSize > 0.1 && t.lotSize <= 1.0)),
      'large': this.calculateAverageHoldingTime(trades.filter(t => t.lotSize > 1.0))
    };

    return {
      avgInitialPosition,
      avgFinalPosition,
      avgHoldTimeBySize
    };
  }

  private static comparePartialVsFullPositions(partialTrades: Trade[], fullTrades: Trade[]): PositionManagementReport['comparisonWithFullPositions'] {
    const analyzeGroup = (groupTrades: Trade[]) => {
      const winningTrades = groupTrades.filter(trade => trade.pnl! > 0);
      const avgPnL = groupTrades.length > 0 
        ? groupTrades.reduce((sum, trade) => sum + trade.pnl!, 0) / groupTrades.length 
        : 0;
      
      return {
        count: groupTrades.length,
        avgPnL,
        winRate: groupTrades.length > 0 ? (winningTrades.length / groupTrades.length) * 100 : 0
      };
    };

    const partiallyManagedTrades = analyzeGroup(partialTrades);
    const fullPositionTrades = analyzeGroup(fullTrades);
    
    const improvementFromManagement = fullPositionTrades.avgPnL !== 0 
      ? ((partiallyManagedTrades.avgPnL - fullPositionTrades.avgPnL) / Math.abs(fullPositionTrades.avgPnL)) * 100
      : 0;

    return {
      partiallyManagedTrades,
      fullPositionTrades,
      improvementFromManagement
    };
  }

  private static analyzeCombinedInsights(trades: Trade[]): EnhancedReportSummary['combinedInsights'] {
    // Find trades with both setup and pattern data
    const combinedTrades = trades.filter(trade => 
      trade.setup && trade.patterns && trade.patterns.length > 0 && 
      trade.status === 'closed' && trade.pnl !== undefined
    );

    // Group by setup-pattern combinations
    const combinations: { [key: string]: Trade[] } = {};
    
    combinedTrades.forEach(trade => {
      trade.patterns!.forEach(pattern => {
        const key = `${trade.setup!.type}-${pattern.type}`;
        if (!combinations[key]) {
          combinations[key] = [];
        }
        combinations[key].push(trade);
      });
    });

    // Find best and worst combinations
    const combinationStats = Object.entries(combinations).map(([key, combTrades]) => {
      const [setupType, patternType] = key.split('-');
      const winningTrades = combTrades.filter(trade => trade.pnl! > 0);
      const avgPnL = combTrades.reduce((sum, trade) => sum + trade.pnl!, 0) / combTrades.length;
      
      return {
        setup: setupType as SetupType,
        pattern: patternType as PatternType,
        trades: combTrades.length,
        winRate: (winningTrades.length / combTrades.length) * 100,
        avgPnL
      };
    }).filter(stat => stat.trades >= 3); // Only consider combinations with at least 3 trades

    const bestCombination = combinationStats.sort((a, b) => b.avgPnL - a.avgPnL)[0] || {
      setup: SetupType.CUSTOM,
      pattern: PatternType.CUSTOM,
      trades: 0,
      winRate: 0,
      avgPnL: 0
    };

    const worstCombination = combinationStats.sort((a, b) => a.avgPnL - b.avgPnL)[0] || {
      setup: SetupType.CUSTOM,
      pattern: PatternType.CUSTOM,
      trades: 0,
      winRate: 0,
      avgPnL: 0
    };

    // Find setup with best position management
    const setupManagementStats = this.groupTradesBySetup(
      trades.filter(trade => trade.setup && trade.positionManagementScore !== undefined)
    );

    const setupWithBestManagement = Object.entries(setupManagementStats)
      .map(([setupType, setupTrades]) => {
        const avgScore = setupTrades.reduce((sum, trade) => sum + (trade.positionManagementScore || 0), 0) / setupTrades.length;
        const managedTrades = setupTrades.filter(trade => trade.partialCloses && trade.partialCloses.length > 0);
        const unmanagedTrades = setupTrades.filter(trade => !trade.partialCloses || trade.partialCloses.length === 0);
        
        const managedAvgPnL = managedTrades.length > 0 
          ? managedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / managedTrades.length 
          : 0;
        const unmanagedAvgPnL = unmanagedTrades.length > 0 
          ? unmanagedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / unmanagedTrades.length 
          : 0;
        
        const improvement = unmanagedAvgPnL !== 0 
          ? ((managedAvgPnL - unmanagedAvgPnL) / Math.abs(unmanagedAvgPnL)) * 100 
          : 0;

        return {
          setup: setupType as SetupType,
          avgManagementScore: avgScore,
          improvementFromManagement: improvement
        };
      })
      .sort((a, b) => b.improvementFromManagement - a.improvementFromManagement)[0] || {
        setup: SetupType.CUSTOM,
        avgManagementScore: 0,
        improvementFromManagement: 0
      };

    return {
      bestSetupPatternCombination: bestCombination,
      worstSetupPatternCombination: worstCombination,
      setupWithBestPositionManagement: setupWithBestManagement
    };
  }

  private static getSetupDisplayName(setupType: SetupType): string {
    const names: { [key in SetupType]: string } = {
      [SetupType.TREND_CONTINUATION]: 'Trend Continuation',
      [SetupType.PULLBACK_ENTRY]: 'Pullback Entry',
      [SetupType.BREAKOUT_CONTINUATION]: 'Breakout Continuation',
      [SetupType.SUPPORT_RESISTANCE_BOUNCE]: 'Support/Resistance Bounce',
      [SetupType.DOUBLE_TOP_BOTTOM]: 'Double Top/Bottom',
      [SetupType.HEAD_SHOULDERS]: 'Head & Shoulders',
      [SetupType.RANGE_BREAKOUT]: 'Range Breakout',
      [SetupType.TRIANGLE_BREAKOUT]: 'Triangle Breakout',
      [SetupType.FLAG_PENNANT_BREAKOUT]: 'Flag/Pennant Breakout',
      [SetupType.NEWS_REACTION]: 'News Reaction',
      [SetupType.ECONOMIC_DATA]: 'Economic Data',
      [SetupType.CENTRAL_BANK]: 'Central Bank',
      [SetupType.CUSTOM]: 'Custom'
    };
    return names[setupType] || setupType;
  }

  private static getPatternDisplayName(patternType: PatternType): string {
    const names: { [key in PatternType]: string } = {
      [PatternType.DOJI]: 'Doji',
      [PatternType.HAMMER]: 'Hammer',
      [PatternType.ENGULFING]: 'Engulfing',
      [PatternType.PIN_BAR]: 'Pin Bar',
      [PatternType.INSIDE_BAR]: 'Inside Bar',
      [PatternType.TRIANGLE]: 'Triangle',
      [PatternType.FLAG]: 'Flag',
      [PatternType.PENNANT]: 'Pennant',
      [PatternType.WEDGE]: 'Wedge',
      [PatternType.RECTANGLE]: 'Rectangle',
      [PatternType.HORIZONTAL_LEVEL]: 'Horizontal Level',
      [PatternType.DYNAMIC_LEVEL]: 'Dynamic Level',
      [PatternType.PSYCHOLOGICAL_LEVEL]: 'Psychological Level',
      [PatternType.ASCENDING_TREND]: 'Ascending Trend',
      [PatternType.DESCENDING_TREND]: 'Descending Trend',
      [PatternType.CHANNEL_LINES]: 'Channel Lines',
      [PatternType.RETRACEMENT]: 'Fibonacci Retracement',
      [PatternType.EXTENSION]: 'Fibonacci Extension',
      [PatternType.CLUSTER]: 'Fibonacci Cluster',
      [PatternType.CUSTOM]: 'Custom'
    };
    return names[patternType] || patternType;
  }
}
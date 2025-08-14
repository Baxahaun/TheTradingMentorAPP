import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  TradePattern,
  CustomPattern,
  PatternAnalytics,
  PatternType,
  PatternCategory,
  Trade,
  ValidationResult,
  PATTERN_TYPE_DESCRIPTIONS,
} from '../types/trade';

// Collection names
const CUSTOM_PATTERNS_COLLECTION = 'customPatterns';

// User-specific collection paths
const getUserCustomPatternsCollection = (userId: string) => 
  collection(db, 'users', userId, CUSTOM_PATTERNS_COLLECTION);

// Convert Firestore document to CustomPattern object
const convertFirestoreToCustomPattern = (doc: DocumentData): CustomPattern => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  } as CustomPattern;
};

// Convert CustomPattern object to Firestore document
const convertCustomPatternToFirestore = (pattern: Omit<CustomPattern, 'id'>) => {
  const cleanedPattern = Object.entries(pattern).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  return {
    ...cleanedPattern,
    createdAt: cleanedPattern.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

// Pattern Recognition Service
export const patternRecognitionService = {
  // ===== PREDEFINED PATTERN MANAGEMENT =====
  
  // Get all predefined pattern types
  getPredefinedPatternTypes(): PatternType[] {
    return Object.values(PatternType);
  },

  // Get pattern type description
  getPatternTypeDescription(patternType: PatternType): string {
    return PATTERN_TYPE_DESCRIPTIONS[patternType] || 'Custom pattern type';
  },

  // Get pattern types by category
  getPatternTypesByCategory(category: PatternCategory): PatternType[] {
    const categoryPatterns: { [key in PatternCategory]: PatternType[] } = {
      [PatternCategory.CANDLESTICK]: [
        PatternType.DOJI,
        PatternType.HAMMER,
        PatternType.ENGULFING,
        PatternType.PIN_BAR,
        PatternType.INSIDE_BAR,
      ],
      [PatternCategory.CHART_PATTERN]: [
        PatternType.TRIANGLE,
        PatternType.FLAG,
        PatternType.PENNANT,
        PatternType.WEDGE,
        PatternType.RECTANGLE,
      ],
      [PatternCategory.SUPPORT_RESISTANCE]: [
        PatternType.HORIZONTAL_LEVEL,
        PatternType.DYNAMIC_LEVEL,
        PatternType.PSYCHOLOGICAL_LEVEL,
      ],
      [PatternCategory.TREND_LINE]: [
        PatternType.ASCENDING_TREND,
        PatternType.DESCENDING_TREND,
        PatternType.CHANNEL_LINES,
      ],
      [PatternCategory.FIBONACCI]: [
        PatternType.RETRACEMENT,
        PatternType.EXTENSION,
        PatternType.CLUSTER,
      ],
      [PatternCategory.CUSTOM]: [
        PatternType.CUSTOM,
      ],
    };

    return categoryPatterns[category] || [];
  },

  // Get all pattern categories
  getPatternCategories(): PatternCategory[] {
    return Object.values(PatternCategory);
  },

  // ===== PATTERN VALIDATION =====

  // Validate trade pattern data
  validateTradePattern(pattern: TradePattern): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!pattern.id || pattern.id.trim() === '') {
      errors.push('Pattern ID is required');
    }

    if (!pattern.type) {
      errors.push('Pattern type is required');
    }

    if (!pattern.timeframe || pattern.timeframe.trim() === '') {
      errors.push('Timeframe is required');
    }

    if (pattern.quality < 1 || pattern.quality > 5) {
      errors.push('Pattern quality must be between 1 and 5');
    }

    // Custom pattern validation
    if (pattern.type === PatternType.CUSTOM && !pattern.customPattern) {
      errors.push('Custom pattern details are required when pattern type is CUSTOM');
    }

    // Timeframe format validation
    const validTimeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'];
    if (!validTimeframes.includes(pattern.timeframe)) {
      warnings.push(`Timeframe '${pattern.timeframe}' is not a standard forex timeframe`);
    }

    // Quality warnings
    if (pattern.quality <= 2) {
      warnings.push('Low quality pattern - consider additional confirmation');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  // ===== PATTERN PERFORMANCE CALCULATION =====

  // Calculate pattern performance analytics
  calculatePatternPerformance(patternType: PatternType, trades: Trade[]): PatternAnalytics {
    const patternTrades = trades.filter(trade => 
      trade.patterns?.some(p => p.type === patternType) && trade.status === 'closed'
    );

    if (patternTrades.length === 0) {
      return {
        patternType,
        totalTrades: 0,
        successRate: 0,
        averageProfit: 0,
        averageLoss: 0,
        profitFactor: 0,
        timeframePerformance: {},
        marketConditionCorrelation: {},
      };
    }

    // Basic performance calculations
    const wins = patternTrades.filter(trade => (trade.pnl || 0) > 0);
    const losses = patternTrades.filter(trade => (trade.pnl || 0) < 0);
    
    const successRate = (wins.length / patternTrades.length) * 100;
    const averageProfit = wins.length > 0 
      ? wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / wins.length 
      : 0;
    const averageLoss = losses.length > 0 
      ? Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losses.length)
      : 0;
    
    const totalWins = wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    const profitFactor = totalLosses === 0 ? (totalWins > 0 ? Infinity : 0) : totalWins / totalLosses;

    // Timeframe performance analysis
    const timeframePerformance = patternTrades.reduce((acc, trade) => {
      const pattern = trade.patterns?.find(p => p.type === patternType);
      const timeframe = pattern?.timeframe || trade.timeframe || 'Unknown';
      
      if (!acc[timeframe]) {
        acc[timeframe] = 0;
      }
      acc[timeframe] += trade.pnl || 0;
      return acc;
    }, {} as Record<string, number>);

    // Market condition correlation analysis
    const marketConditionCorrelation = patternTrades.reduce((acc, trade) => {
      const marketCondition = trade.setup?.marketCondition || trade.marketConditions || 'Unknown';
      
      if (!acc[marketCondition]) {
        acc[marketCondition] = 0;
      }
      
      // Calculate success rate for this market condition
      const conditionTrades = patternTrades.filter(t => 
        (t.setup?.marketCondition || t.marketConditions) === marketCondition
      );
      const conditionWins = conditionTrades.filter(t => (t.pnl || 0) > 0);
      acc[marketCondition] = conditionTrades.length > 0 
        ? (conditionWins.length / conditionTrades.length) * 100 
        : 0;
      
      return acc;
    }, {} as Record<string, number>);

    return {
      patternType,
      totalTrades: patternTrades.length,
      successRate,
      averageProfit,
      averageLoss,
      profitFactor,
      timeframePerformance,
      marketConditionCorrelation,
    };
  },

  // Calculate pattern confluence score
  calculatePatternConfluence(patterns: TradePattern[]): number {
    if (!patterns || patterns.length === 0) {
      return 0;
    }

    // Base confluence from number of patterns
    let confluenceScore = Math.min(patterns.length * 20, 60); // Max 60 from quantity

    // Quality bonus
    const averageQuality = patterns.reduce((sum, p) => sum + p.quality, 0) / patterns.length;
    confluenceScore += (averageQuality - 3) * 10; // -20 to +20 based on quality

    // Confluence flag bonus
    const confluencePatterns = patterns.filter(p => p.confluence);
    if (confluencePatterns.length > 0) {
      confluenceScore += (confluencePatterns.length / patterns.length) * 20;
    }

    // Category diversity bonus
    const categories = new Set(patterns.map(p => this.getPatternCategory(p.type)));
    if (categories.size > 1) {
      confluenceScore += (categories.size - 1) * 5; // Bonus for multiple categories
    }

    return Math.min(Math.max(confluenceScore, 0), 100);
  },

  // Get pattern category for a pattern type
  getPatternCategory(patternType: PatternType): PatternCategory {
    const categoryMap: { [key in PatternType]: PatternCategory } = {
      [PatternType.DOJI]: PatternCategory.CANDLESTICK,
      [PatternType.HAMMER]: PatternCategory.CANDLESTICK,
      [PatternType.ENGULFING]: PatternCategory.CANDLESTICK,
      [PatternType.PIN_BAR]: PatternCategory.CANDLESTICK,
      [PatternType.INSIDE_BAR]: PatternCategory.CANDLESTICK,
      [PatternType.TRIANGLE]: PatternCategory.CHART_PATTERN,
      [PatternType.FLAG]: PatternCategory.CHART_PATTERN,
      [PatternType.PENNANT]: PatternCategory.CHART_PATTERN,
      [PatternType.WEDGE]: PatternCategory.CHART_PATTERN,
      [PatternType.RECTANGLE]: PatternCategory.CHART_PATTERN,
      [PatternType.HORIZONTAL_LEVEL]: PatternCategory.SUPPORT_RESISTANCE,
      [PatternType.DYNAMIC_LEVEL]: PatternCategory.SUPPORT_RESISTANCE,
      [PatternType.PSYCHOLOGICAL_LEVEL]: PatternCategory.SUPPORT_RESISTANCE,
      [PatternType.ASCENDING_TREND]: PatternCategory.TREND_LINE,
      [PatternType.DESCENDING_TREND]: PatternCategory.TREND_LINE,
      [PatternType.CHANNEL_LINES]: PatternCategory.TREND_LINE,
      [PatternType.RETRACEMENT]: PatternCategory.FIBONACCI,
      [PatternType.EXTENSION]: PatternCategory.FIBONACCI,
      [PatternType.CLUSTER]: PatternCategory.FIBONACCI,
      [PatternType.CUSTOM]: PatternCategory.CUSTOM,
    };

    return categoryMap[patternType];
  },

  // Calculate success rate tracking for patterns
  calculatePatternSuccessRate(patternType: PatternType, trades: Trade[], timeframe?: string): number {
    let filteredTrades = trades.filter(trade => 
      trade.patterns?.some(p => p.type === patternType) && trade.status === 'closed'
    );

    if (timeframe) {
      filteredTrades = filteredTrades.filter(trade => 
        trade.patterns?.some(p => p.type === patternType && p.timeframe === timeframe)
      );
    }

    if (filteredTrades.length === 0) {
      return 0;
    }

    const wins = filteredTrades.filter(trade => (trade.pnl || 0) > 0);
    return (wins.length / filteredTrades.length) * 100;
  }, 
 // ===== CUSTOM PATTERN MANAGEMENT =====

  // Add a new custom pattern
  async addCustomPattern(userId: string, pattern: Omit<CustomPattern, 'id'>): Promise<string> {
    try {
      console.log('Adding custom pattern for user:', userId);
      const patternsCollection = getUserCustomPatternsCollection(userId);
      const patternData = convertCustomPatternToFirestore(pattern);
      const docRef = await addDoc(patternsCollection, patternData);
      console.log('Successfully added custom pattern with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding custom pattern:', error);
      throw error;
    }
  },

  // Get all custom patterns for a user
  async getCustomPatterns(userId: string): Promise<CustomPattern[]> {
    try {
      const patternsCollection = getUserCustomPatternsCollection(userId);
      const q = query(patternsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreToCustomPattern);
    } catch (error) {
      console.error('Error getting custom patterns:', error);
      throw error;
    }
  },

  // Update a custom pattern
  async updateCustomPattern(userId: string, patternId: string, updates: Partial<CustomPattern>): Promise<void> {
    try {
      const patternDoc = doc(getUserCustomPatternsCollection(userId), patternId);
      await updateDoc(patternDoc, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating custom pattern:', error);
      throw error;
    }
  },

  // Delete a custom pattern
  async deleteCustomPattern(userId: string, patternId: string): Promise<void> {
    try {
      const patternDoc = doc(getUserCustomPatternsCollection(userId), patternId);
      await deleteDoc(patternDoc);
    } catch (error) {
      console.error('Error deleting custom pattern:', error);
      throw error;
    }
  },

  // Subscribe to real-time custom pattern updates
  subscribeToCustomPatterns(userId: string, callback: (patterns: CustomPattern[]) => void): () => void {
    const patternsCollection = getUserCustomPatternsCollection(userId);
    const q = query(patternsCollection, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
      const patterns = querySnapshot.docs.map(convertFirestoreToCustomPattern);
      callback(patterns);
    }, (error) => {
      console.error('Error in custom patterns subscription:', error);
    });
  },

  // Get custom patterns by category
  async getCustomPatternsByCategory(userId: string, category: PatternCategory): Promise<CustomPattern[]> {
    try {
      const patternsCollection = getUserCustomPatternsCollection(userId);
      const q = query(
        patternsCollection, 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreToCustomPattern);
    } catch (error) {
      console.error('Error getting custom patterns by category:', error);
      throw error;
    }
  },

  // ===== PATTERN-BASED FILTERING AND SEARCH =====

  // Filter trades by pattern type
  filterTradesByPattern(trades: Trade[], patternType: PatternType): Trade[] {
    return trades.filter(trade => 
      trade.patterns?.some(pattern => pattern.type === patternType)
    );
  },

  // Filter trades by pattern category
  filterTradesByPatternCategory(trades: Trade[], category: PatternCategory): Trade[] {
    return trades.filter(trade => 
      trade.patterns?.some(pattern => this.getPatternCategory(pattern.type) === category)
    );
  },

  // Filter trades by pattern quality
  filterTradesByPatternQuality(trades: Trade[], minQuality: number, maxQuality: number = 5): Trade[] {
    return trades.filter(trade => 
      trade.patterns?.some(pattern => 
        pattern.quality >= minQuality && pattern.quality <= maxQuality
      )
    );
  },

  // Filter trades by pattern confluence
  filterTradesByPatternConfluence(trades: Trade[], hasConfluence: boolean): Trade[] {
    return trades.filter(trade => 
      trade.patterns?.some(pattern => pattern.confluence === hasConfluence)
    );
  },

  // Search patterns by description or notes
  searchPatterns(trades: Trade[], searchTerm: string): Trade[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return trades.filter(trade => 
      trade.patterns?.some(pattern => 
        pattern.description?.toLowerCase().includes(lowerSearchTerm) ||
        pattern.customPattern?.name.toLowerCase().includes(lowerSearchTerm) ||
        pattern.customPattern?.description.toLowerCase().includes(lowerSearchTerm)
      )
    );
  },

  // Get unique timeframes from patterns
  getPatternTimeframes(trades: Trade[]): string[] {
    const timeframes = new Set<string>();
    trades.forEach(trade => {
      trade.patterns?.forEach(pattern => {
        if (pattern.timeframe) {
          timeframes.add(pattern.timeframe);
        }
      });
    });
    return Array.from(timeframes).sort();
  },

  // ===== MARKET CONDITION CORRELATION ANALYSIS =====

  // Analyze pattern performance by market condition
  analyzePatternMarketConditionCorrelation(trades: Trade[]): Record<string, Record<PatternType, number>> {
    const correlation: Record<string, Record<PatternType, number>> = {};

    trades.forEach(trade => {
      if (trade.status !== 'closed' || !trade.patterns || trade.patterns.length === 0) {
        return;
      }

      const marketCondition = trade.setup?.marketCondition || trade.marketConditions || 'Unknown';
      
      if (!correlation[marketCondition]) {
        correlation[marketCondition] = {} as Record<PatternType, number>;
      }

      trade.patterns.forEach(pattern => {
        if (!correlation[marketCondition][pattern.type]) {
          correlation[marketCondition][pattern.type] = 0;
        }
        
        // Add to success rate calculation
        if ((trade.pnl || 0) > 0) {
          correlation[marketCondition][pattern.type] += 1;
        }
      });
    });

    // Convert counts to success rates
    Object.keys(correlation).forEach(condition => {
      Object.keys(correlation[condition]).forEach(patternType => {
        const pattern = patternType as PatternType;
        const conditionTrades = trades.filter(trade => 
          (trade.setup?.marketCondition || trade.marketConditions) === condition &&
          trade.patterns?.some(p => p.type === pattern) &&
          trade.status === 'closed'
        );
        
        if (conditionTrades.length > 0) {
          const wins = conditionTrades.filter(trade => (trade.pnl || 0) > 0);
          correlation[condition][pattern] = (wins.length / conditionTrades.length) * 100;
        } else {
          correlation[condition][pattern] = 0;
        }
      });
    });

    return correlation;
  },

  // Get best performing patterns for specific market condition
  getBestPatternsForMarketCondition(
    trades: Trade[], 
    marketCondition: string, 
    limit: number = 5
  ): Array<{ patternType: PatternType; successRate: number; totalTrades: number }> {
    const patternPerformance: Array<{ patternType: PatternType; successRate: number; totalTrades: number }> = [];

    Object.values(PatternType).forEach(patternType => {
      const conditionTrades = trades.filter(trade => 
        (trade.setup?.marketCondition || trade.marketConditions) === marketCondition &&
        trade.patterns?.some(p => p.type === patternType) &&
        trade.status === 'closed'
      );

      if (conditionTrades.length >= 3) { // Minimum sample size
        const wins = conditionTrades.filter(trade => (trade.pnl || 0) > 0);
        const successRate = (wins.length / conditionTrades.length) * 100;
        
        patternPerformance.push({
          patternType,
          successRate,
          totalTrades: conditionTrades.length,
        });
      }
    });

    return patternPerformance
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  },

  // Analyze pattern confluence with market conditions
  analyzePatternConfluenceWithMarketConditions(trades: Trade[]): Record<string, { averageConfluence: number; successRate: number }> {
    const analysis: Record<string, { totalConfluence: number; totalTrades: number; wins: number }> = {};

    trades.forEach(trade => {
      if (trade.status !== 'closed' || !trade.patterns || trade.patterns.length === 0) {
        return;
      }

      const marketCondition = trade.setup?.marketCondition || trade.marketConditions || 'Unknown';
      const confluence = this.calculatePatternConfluence(trade.patterns);
      
      if (!analysis[marketCondition]) {
        analysis[marketCondition] = { totalConfluence: 0, totalTrades: 0, wins: 0 };
      }

      analysis[marketCondition].totalConfluence += confluence;
      analysis[marketCondition].totalTrades += 1;
      
      if ((trade.pnl || 0) > 0) {
        analysis[marketCondition].wins += 1;
      }
    });

    // Convert to final analysis format
    const result: Record<string, { averageConfluence: number; successRate: number }> = {};
    Object.keys(analysis).forEach(condition => {
      const data = analysis[condition];
      result[condition] = {
        averageConfluence: data.totalTrades > 0 ? data.totalConfluence / data.totalTrades : 0,
        successRate: data.totalTrades > 0 ? (data.wins / data.totalTrades) * 100 : 0,
      };
    });

    return result;
  },

  // ===== PATTERN COMPARISON AND ANALYSIS =====

  // Compare performance between different pattern types
  comparePatternPerformance(trades: Trade[], patternTypes: PatternType[]): Record<PatternType, PatternAnalytics> {
    return patternTypes.reduce((acc, patternType) => {
      acc[patternType] = this.calculatePatternPerformance(patternType, trades);
      return acc;
    }, {} as Record<PatternType, PatternAnalytics>);
  },

  // Get best performing patterns
  getBestPerformingPatterns(trades: Trade[], limit: number = 5): Array<{ patternType: PatternType; analytics: PatternAnalytics }> {
    const allPatternTypes = this.getPredefinedPatternTypes();
    const performanceData = allPatternTypes.map(patternType => ({
      patternType,
      analytics: this.calculatePatternPerformance(patternType, trades),
    }));

    return performanceData
      .filter(data => data.analytics.totalTrades > 0)
      .sort((a, b) => {
        // Sort by profit factor first, then by success rate
        if (b.analytics.profitFactor !== a.analytics.profitFactor) {
          return b.analytics.profitFactor - a.analytics.profitFactor;
        }
        return b.analytics.successRate - a.analytics.successRate;
      })
      .slice(0, limit);
  },

  // Get pattern recommendations based on historical performance
  getPatternRecommendations(
    trades: Trade[], 
    marketCondition: string,
    timeframe?: string
  ): Array<{
    patternType: PatternType;
    confidence: number;
    reason: string;
  }> {
    const recommendations: Array<{
      patternType: PatternType;
      confidence: number;
      reason: string;
    }> = [];

    const allPatternTypes = this.getPredefinedPatternTypes();
    
    allPatternTypes.forEach(patternType => {
      let filteredTrades = trades.filter(trade => 
        trade.patterns?.some(p => p.type === patternType) &&
        (trade.setup?.marketCondition || trade.marketConditions) === marketCondition &&
        trade.status === 'closed'
      );

      if (timeframe) {
        filteredTrades = filteredTrades.filter(trade => 
          trade.patterns?.some(p => p.type === patternType && p.timeframe === timeframe)
        );
      }

      if (filteredTrades.length >= 5) { // Minimum sample size
        const analytics = this.calculatePatternPerformance(patternType, filteredTrades);
        
        if (analytics.successRate >= 60 && analytics.profitFactor >= 1.5) {
          const confidence = Math.min(
            (analytics.successRate / 100) * 0.6 + 
            (Math.min(analytics.profitFactor, 3) / 3) * 0.4,
            1
          ) * 100;

          recommendations.push({
            patternType,
            confidence,
            reason: `${analytics.successRate.toFixed(1)}% success rate, ${analytics.profitFactor.toFixed(2)} profit factor in ${marketCondition} markets${timeframe ? ` on ${timeframe}` : ''}`,
          });
        }
      }
    });

    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 recommendations
  },

  // Suggest patterns based on current market data (placeholder for future enhancement)
  suggestPatterns(marketData: { condition: string; timeframe: string; volatility: number }): PatternType[] {
    const suggestions: PatternType[] = [];

    // Basic pattern suggestions based on market condition
    switch (marketData.condition) {
      case 'trending':
        suggestions.push(
          PatternType.FLAG,
          PatternType.PENNANT,
          PatternType.ASCENDING_TREND,
          PatternType.DESCENDING_TREND
        );
        break;
      case 'ranging':
        suggestions.push(
          PatternType.RECTANGLE,
          PatternType.HORIZONTAL_LEVEL,
          PatternType.INSIDE_BAR
        );
        break;
      case 'breakout':
        suggestions.push(
          PatternType.TRIANGLE,
          PatternType.WEDGE,
          PatternType.PIN_BAR
        );
        break;
      case 'reversal':
        suggestions.push(
          PatternType.DOJI,
          PatternType.HAMMER,
          PatternType.ENGULFING
        );
        break;
    }

    // Add volatility-based suggestions
    if (marketData.volatility > 0.7) {
      suggestions.push(PatternType.PIN_BAR, PatternType.ENGULFING);
    } else if (marketData.volatility < 0.3) {
      suggestions.push(PatternType.INSIDE_BAR, PatternType.RECTANGLE);
    }

    return Array.from(new Set(suggestions)); // Remove duplicates
  },

  // Calculate performance for all pattern types
  calculateAllPatternPerformance(trades: Trade[]): Record<string, PatternAnalytics> {
    const allPatternTypes = this.getPredefinedPatternTypes();
    const result: Record<string, PatternAnalytics> = {};
    
    allPatternTypes.forEach(patternType => {
      result[patternType] = this.calculatePatternPerformance(patternType, trades);
    });
    
    return result;
  },
};
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
  TradeSetup,
  CustomSetup,
  SetupMetrics,
  SetupAnalytics,
  SetupType,
  ConfluenceFactor,
  Trade,
  ValidationResult,
  PREDEFINED_CONFLUENCE_FACTORS,
  SETUP_TYPE_DESCRIPTIONS,
} from '../types/trade';

// Collection names
const CUSTOM_SETUPS_COLLECTION = 'customSetups';

// User-specific collection paths
const getUserCustomSetupsCollection = (userId: string) => 
  collection(db, 'users', userId, CUSTOM_SETUPS_COLLECTION);

// Convert Firestore document to CustomSetup object
const convertFirestoreToCustomSetup = (doc: DocumentData): CustomSetup => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  } as CustomSetup;
};

// Convert CustomSetup object to Firestore document
const convertCustomSetupToFirestore = (setup: Omit<CustomSetup, 'id'>) => {
  const cleanedSetup = Object.entries(setup).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  return {
    ...cleanedSetup,
    createdAt: cleanedSetup.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

// Setup Classification Service
export const setupClassificationService = {
  // ===== PREDEFINED SETUP MANAGEMENT =====
  
  // Get all predefined setup types
  getPredefinedSetupTypes(): SetupType[] {
    return Object.values(SetupType);
  },

  // Get setup type description
  getSetupTypeDescription(setupType: SetupType): string {
    return SETUP_TYPE_DESCRIPTIONS[setupType] || 'Custom setup type';
  },

  // Get all predefined confluence factors
  getPredefinedConfluenceFactors(): ConfluenceFactor[] {
    return PREDEFINED_CONFLUENCE_FACTORS;
  },

  // Get confluence factors by category
  getConfluenceFactorsByCategory(category: 'technical' | 'fundamental' | 'sentiment' | 'timing'): ConfluenceFactor[] {
    return PREDEFINED_CONFLUENCE_FACTORS.filter(factor => factor.category === category);
  },

  // ===== SETUP VALIDATION =====

  // Validate trade setup data
  validateTradeSetup(setup: TradeSetup): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!setup.id || setup.id.trim() === '') {
      errors.push('Setup ID is required');
    }

    if (!setup.type) {
      errors.push('Setup type is required');
    }

    if (!setup.timeframe || setup.timeframe.trim() === '') {
      errors.push('Timeframe is required');
    }

    if (!setup.marketCondition) {
      errors.push('Market condition is required');
    }

    if (setup.quality < 1 || setup.quality > 5) {
      errors.push('Setup quality must be between 1 and 5');
    }

    // Confluence factors validation
    if (setup.confluence && setup.confluence.length > 0) {
      setup.confluence.forEach((factor, index) => {
        if (!factor.id || factor.id.trim() === '') {
          errors.push(`Confluence factor ${index + 1}: ID is required`);
        }
        if (!factor.name || factor.name.trim() === '') {
          errors.push(`Confluence factor ${index + 1}: Name is required`);
        }
        if (!factor.category) {
          errors.push(`Confluence factor ${index + 1}: Category is required`);
        }
        if (factor.weight < 1 || factor.weight > 5) {
          errors.push(`Confluence factor ${index + 1}: Weight must be between 1 and 5`);
        }
      });

      // Warning for too many confluence factors
      if (setup.confluence.length > 8) {
        warnings.push('Consider limiting confluence factors to 8 or fewer for better analysis');
      }

      // Warning for low total confluence weight
      const totalWeight = setup.confluence.reduce((sum, factor) => sum + factor.weight, 0);
      if (totalWeight < 10) {
        warnings.push('Low total confluence weight may indicate weak setup');
      }
    } else {
      warnings.push('No confluence factors specified - consider adding factors for better analysis');
    }

    // Custom setup validation
    if (setup.type === SetupType.CUSTOM && !setup.customSetup) {
      errors.push('Custom setup details are required when setup type is CUSTOM');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  // ===== SETUP PERFORMANCE CALCULATION =====

  // Calculate setup performance metrics
  calculateSetupPerformance(setupType: SetupType, trades: Trade[]): SetupMetrics {
    const setupTrades = trades.filter(trade => 
      trade.setup?.type === setupType && trade.status === 'closed'
    );

    if (setupTrades.length === 0) {
      return {
        winRate: 0,
        averageRMultiple: 0,
        profitFactor: 0,
        totalTrades: 0,
        averageHoldTime: 0,
        bestPerformingTimeframe: '',
        worstPerformingTimeframe: '',
      };
    }

    // Basic performance calculations
    const wins = setupTrades.filter(trade => (trade.pnl || 0) > 0);
    const losses = setupTrades.filter(trade => (trade.pnl || 0) < 0);
    
    const winRate = (wins.length / setupTrades.length) * 100;
    const totalWins = wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    const profitFactor = totalLosses === 0 ? (totalWins > 0 ? Infinity : 0) : totalWins / totalLosses;

    // R-Multiple calculation
    const rMultiples = setupTrades
      .filter(trade => trade.rMultiple !== undefined)
      .map(trade => trade.rMultiple!);
    const averageRMultiple = rMultiples.length > 0 
      ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length 
      : 0;

    // Hold time calculation (in hours)
    const holdTimes = setupTrades
      .filter(trade => trade.timeIn && trade.timeOut)
      .map(trade => {
        const entryTime = new Date(`${trade.date} ${trade.timeIn}`).getTime();
        const exitTime = new Date(`${trade.date} ${trade.timeOut}`).getTime();
        return (exitTime - entryTime) / (1000 * 60 * 60); // Convert to hours
      });
    const averageHoldTime = holdTimes.length > 0 
      ? holdTimes.reduce((sum, time) => sum + time, 0) / holdTimes.length 
      : 0;

    // Timeframe performance analysis
    const timeframePerformance = setupTrades.reduce((acc, trade) => {
      const timeframe = trade.setup?.timeframe || trade.timeframe || 'Unknown';
      if (!acc[timeframe]) {
        acc[timeframe] = { wins: 0, total: 0, pnl: 0 };
      }
      acc[timeframe].total++;
      if ((trade.pnl || 0) > 0) {
        acc[timeframe].wins++;
      }
      acc[timeframe].pnl += trade.pnl || 0;
      return acc;
    }, {} as Record<string, { wins: number; total: number; pnl: number }>);

    let bestTimeframe = '';
    let worstTimeframe = '';
    let bestWinRate = -1;
    let worstWinRate = 101;

    Object.entries(timeframePerformance).forEach(([timeframe, stats]) => {
      const winRate = (stats.wins / stats.total) * 100;
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestTimeframe = timeframe;
      }
      if (winRate < worstWinRate) {
        worstWinRate = winRate;
        worstTimeframe = timeframe;
      }
    });

    return {
      winRate,
      averageRMultiple,
      profitFactor,
      totalTrades: setupTrades.length,
      averageHoldTime,
      bestPerformingTimeframe: bestTimeframe,
      worstPerformingTimeframe: worstTimeframe,
    };
  },

  // Calculate comprehensive setup analytics
  calculateSetupAnalytics(setupType: SetupType, trades: Trade[]): SetupAnalytics {
    const setupTrades = trades.filter(trade => 
      trade.setup?.type === setupType && trade.status === 'closed'
    );

    const baseMetrics = this.calculateSetupPerformance(setupType, trades);

    // Market condition performance breakdown
    const marketConditions = ['trending', 'ranging', 'breakout', 'reversal'] as const;
    const marketConditionPerformance = marketConditions.reduce((acc, condition) => {
      const conditionTrades = setupTrades.filter(trade => 
        trade.setup?.marketCondition === condition
      );
      acc[condition] = this.calculateSetupPerformance(setupType, conditionTrades);
      return acc;
    }, {} as SetupAnalytics['marketConditionPerformance']);

    // Hold time analysis
    const holdTimes = setupTrades
      .filter(trade => trade.timeIn && trade.timeOut)
      .map(trade => {
        const entryTime = new Date(`${trade.date} ${trade.timeIn}`).getTime();
        const exitTime = new Date(`${trade.date} ${trade.timeOut}`).getTime();
        return (exitTime - entryTime) / (1000 * 60 * 60);
      });
    const averageHoldTime = holdTimes.length > 0 
      ? holdTimes.reduce((sum, time) => sum + time, 0) / holdTimes.length 
      : 0;

    // Best and worst performing timeframes
    const timeframeStats = setupTrades.reduce((acc, trade) => {
      const timeframe = trade.setup?.timeframe || trade.timeframe || 'Unknown';
      if (!acc[timeframe]) {
        acc[timeframe] = { wins: 0, total: 0, pnl: 0 };
      }
      acc[timeframe].total++;
      if ((trade.pnl || 0) > 0) {
        acc[timeframe].wins++;
      }
      acc[timeframe].pnl += trade.pnl || 0;
      return acc;
    }, {} as Record<string, { wins: number; total: number; pnl: number }>);

    let bestTimeframe = '';
    let worstTimeframe = '';
    let bestPnL = -Infinity;
    let worstPnL = Infinity;

    Object.entries(timeframeStats).forEach(([timeframe, stats]) => {
      if (stats.pnl > bestPnL) {
        bestPnL = stats.pnl;
        bestTimeframe = timeframe;
      }
      if (stats.pnl < worstPnL) {
        worstPnL = stats.pnl;
        worstTimeframe = timeframe;
      }
    });

    return {
      setupType,
      totalTrades: setupTrades.length,
      winRate: baseMetrics.winRate,
      averageRMultiple: baseMetrics.averageRMultiple,
      profitFactor: baseMetrics.profitFactor,
      averageHoldTime,
      bestTimeframe,
      worstTimeframe,
      marketConditionPerformance,
    };
  },

  // ===== CUSTOM SETUP MANAGEMENT =====

  // Add a new custom setup
  async addCustomSetup(userId: string, setup: Omit<CustomSetup, 'id'>): Promise<string> {
    try {
      console.log('Adding custom setup for user:', userId);
      const setupsCollection = getUserCustomSetupsCollection(userId);
      const setupData = convertCustomSetupToFirestore(setup);
      const docRef = await addDoc(setupsCollection, setupData);
      console.log('Successfully added custom setup with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding custom setup:', error);
      throw error;
    }
  },

  // Get all custom setups for a user
  async getCustomSetups(userId: string): Promise<CustomSetup[]> {
    try {
      const setupsCollection = getUserCustomSetupsCollection(userId);
      const q = query(setupsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreToCustomSetup);
    } catch (error) {
      console.error('Error getting custom setups:', error);
      throw error;
    }
  },

  // Update a custom setup
  async updateCustomSetup(userId: string, setupId: string, updates: Partial<CustomSetup>): Promise<void> {
    try {
      const setupDoc = doc(getUserCustomSetupsCollection(userId), setupId);
      await updateDoc(setupDoc, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating custom setup:', error);
      throw error;
    }
  },

  // Delete a custom setup
  async deleteCustomSetup(userId: string, setupId: string): Promise<void> {
    try {
      const setupDoc = doc(getUserCustomSetupsCollection(userId), setupId);
      await deleteDoc(setupDoc);
    } catch (error) {
      console.error('Error deleting custom setup:', error);
      throw error;
    }
  },

  // Subscribe to real-time custom setup updates
  subscribeToCustomSetups(userId: string, callback: (setups: CustomSetup[]) => void): () => void {
    const setupsCollection = getUserCustomSetupsCollection(userId);
    const q = query(setupsCollection, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
      const setups = querySnapshot.docs.map(convertFirestoreToCustomSetup);
      callback(setups);
    }, (error) => {
      console.error('Error in custom setups subscription:', error);
    });
  },

  // Get custom setups by category
  async getCustomSetupsByCategory(userId: string, category: string): Promise<CustomSetup[]> {
    try {
      const setupsCollection = getUserCustomSetupsCollection(userId);
      const q = query(
        setupsCollection, 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreToCustomSetup);
    } catch (error) {
      console.error('Error getting custom setups by category:', error);
      throw error;
    }
  },

  // ===== SETUP COMPARISON AND ANALYSIS =====

  // Compare performance between different setup types
  compareSetupPerformance(trades: Trade[], setupTypes: SetupType[]): Record<SetupType, SetupMetrics> {
    return setupTypes.reduce((acc, setupType) => {
      acc[setupType] = this.calculateSetupPerformance(setupType, trades);
      return acc;
    }, {} as Record<SetupType, SetupMetrics>);
  },

  // Get best performing setups
  getBestPerformingSetups(trades: Trade[], limit: number = 5): Array<{ setupType: SetupType; metrics: SetupMetrics }> {
    const allSetupTypes = this.getPredefinedSetupTypes();
    const performanceData = allSetupTypes.map(setupType => ({
      setupType,
      metrics: this.calculateSetupPerformance(setupType, trades),
    }));

    return performanceData
      .filter(data => data.metrics.totalTrades > 0)
      .sort((a, b) => {
        // Sort by profit factor first, then by win rate
        if (b.metrics.profitFactor !== a.metrics.profitFactor) {
          return b.metrics.profitFactor - a.metrics.profitFactor;
        }
        return b.metrics.winRate - a.metrics.winRate;
      })
      .slice(0, limit);
  },

  // Calculate confluence score for a setup
  calculateConfluenceScore(confluenceFactors: ConfluenceFactor[]): number {
    if (!confluenceFactors || confluenceFactors.length === 0) {
      return 0;
    }

    const totalWeight = confluenceFactors.reduce((sum, factor) => sum + factor.weight, 0);
    const maxPossibleWeight = confluenceFactors.length * 5; // Max weight per factor is 5
    
    return (totalWeight / maxPossibleWeight) * 100;
  },

  // Calculate performance for all setup types
  calculateAllSetupPerformance(trades: Trade[]): Record<string, SetupMetrics> {
    const allSetupTypes = this.getPredefinedSetupTypes();
    const result: Record<string, SetupMetrics> = {};
    
    allSetupTypes.forEach(setupType => {
      result[setupType] = this.calculateSetupPerformance(setupType, trades);
    });
    
    return result;
  },

  // Get setup recommendations based on historical performance
  getSetupRecommendations(trades: Trade[], marketCondition: 'trending' | 'ranging' | 'breakout' | 'reversal'): Array<{
    setupType: SetupType;
    confidence: number;
    reason: string;
  }> {
    const recommendations: Array<{
      setupType: SetupType;
      confidence: number;
      reason: string;
    }> = [];

    const allSetupTypes = this.getPredefinedSetupTypes();
    
    allSetupTypes.forEach(setupType => {
      const setupTrades = trades.filter(trade => 
        trade.setup?.type === setupType && 
        trade.setup?.marketCondition === marketCondition &&
        trade.status === 'closed'
      );

      if (setupTrades.length >= 5) { // Minimum sample size
        const metrics = this.calculateSetupPerformance(setupType, setupTrades);
        
        if (metrics.winRate >= 60 && metrics.profitFactor >= 1.5) {
          const confidence = Math.min(
            (metrics.winRate / 100) * 0.6 + 
            (Math.min(metrics.profitFactor, 3) / 3) * 0.4,
            1
          ) * 100;

          recommendations.push({
            setupType,
            confidence,
            reason: `${metrics.winRate.toFixed(1)}% win rate, ${metrics.profitFactor.toFixed(2)} profit factor in ${marketCondition} markets`,
          });
        }
      }
    });

    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 recommendations
  },
};
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
  Trade,
  PartialClose,
  PositionEvent,
  PositionSummary,
  ExitAnalytics,
  PositionRecommendations,
  ValidationResult,
} from '../types/trade';

// Collection names
const POSITION_EVENTS_COLLECTION = 'positionEvents';

// User-specific collection paths
const getUserPositionEventsCollection = (userId: string) => 
  collection(db, 'users', userId, POSITION_EVENTS_COLLECTION);

// Convert Firestore document to PositionEvent object
const convertFirestoreToPositionEvent = (doc: DocumentData): PositionEvent => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp,
  } as PositionEvent;
};

// Convert PositionEvent object to Firestore document
const convertPositionEventToFirestore = (event: Omit<PositionEvent, 'id'>) => {
  const cleanedEvent = Object.entries(event).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  return {
    ...cleanedEvent,
    timestamp: cleanedEvent.timestamp ? new Date(cleanedEvent.timestamp as string) : Timestamp.now(),
  };
};

// Position Management Service
export const positionManagementService = {
  // ===== PARTIAL CLOSE TRACKING =====

  // Add a partial close to a trade
  addPartialClose(trade: Trade, partialClose: Omit<PartialClose, 'id' | 'remainingLots'>): PartialClose {
    // Validate partial close
    const validation = this.validatePartialClose(partialClose, trade);
    if (!validation.isValid) {
      throw new Error(`Invalid partial close: ${validation.errors.join(', ')}`);
    }

    // Calculate remaining lots
    const currentPartialCloses = trade.partialCloses || [];
    const totalClosedLots = currentPartialCloses.reduce((sum, pc) => sum + pc.lotSize, 0);
    const remainingLots = trade.lotSize - totalClosedLots - partialClose.lotSize;

    if (remainingLots < 0) {
      throw new Error('Partial close lot size exceeds remaining position');
    }

    // Create the partial close record
    const newPartialClose: PartialClose = {
      id: `pc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...partialClose,
      remainingLots,
    };

    return newPartialClose;
  },

  // Calculate remaining position after partial closes
  calculateRemainingPosition(trade: Trade): PositionSummary {
    const partialCloses = trade.partialCloses || [];
    const totalClosedLots = partialCloses.reduce((sum, pc) => sum + pc.lotSize, 0);
    const remainingLots = trade.lotSize - totalClosedLots;

    // Calculate realized P&L from partial closes
    const realizedPnL = partialCloses.reduce((sum, pc) => sum + pc.pnlRealized, 0);

    // Calculate unrealized P&L for remaining position
    let unrealizedPnL = 0;
    if (remainingLots > 0 && trade.status === 'open') {
      // For open trades, we'd need current market price to calculate unrealized P&L
      // For now, we'll set it to 0 as we don't have real-time price data
      unrealizedPnL = 0;
    }

    // Calculate weighted average entry price
    let averageEntryPrice = trade.entryPrice;
    if (trade.positionHistory && trade.positionHistory.length > 0) {
      const entries = trade.positionHistory.filter(event => event.type === 'entry');
      if (entries.length > 1) {
        const totalValue = entries.reduce((sum, entry) => sum + (entry.price * entry.lotSize), 0);
        const totalLots = entries.reduce((sum, entry) => sum + entry.lotSize, 0);
        averageEntryPrice = totalValue / totalLots;
      }
    }

    // Calculate current R-Multiple
    let currentRMultiple = 0;
    if (trade.riskAmount && trade.riskAmount > 0) {
      const totalPnL = realizedPnL + unrealizedPnL;
      currentRMultiple = totalPnL / trade.riskAmount;
    }

    return {
      totalLots: remainingLots,
      averageEntryPrice,
      unrealizedPnL,
      realizedPnL,
      riskAmount: trade.riskAmount || 0,
      currentRMultiple,
    };
  },

  // Generate position timeline from trade data
  generatePositionTimeline(trade: Trade): PositionEvent[] {
    const timeline: PositionEvent[] = [];

    // Add initial entry
    timeline.push({
      id: `entry_${trade.id}`,
      timestamp: `${trade.date} ${trade.timeIn}`,
      type: 'entry',
      lotSize: trade.lotSize,
      price: trade.entryPrice,
      totalPosition: trade.lotSize,
      averagePrice: trade.entryPrice,
    });

    // Add partial closes
    if (trade.partialCloses && trade.partialCloses.length > 0) {
      let runningPosition = trade.lotSize;
      let totalValue = trade.entryPrice * trade.lotSize;

      trade.partialCloses.forEach(pc => {
        runningPosition -= pc.lotSize;
        totalValue -= pc.price * pc.lotSize;

        timeline.push({
          id: `partial_${pc.id}`,
          timestamp: pc.timestamp,
          type: 'partial_close',
          lotSize: -pc.lotSize, // Negative to indicate reduction
          price: pc.price,
          totalPosition: runningPosition,
          averagePrice: runningPosition > 0 ? totalValue / runningPosition : 0,
        });
      });
    }

    // Add full close if trade is closed
    if (trade.status === 'closed' && trade.exitPrice && trade.timeOut) {
      const remainingPosition = this.calculateRemainingPosition(trade);
      
      timeline.push({
        id: `exit_${trade.id}`,
        timestamp: `${trade.date} ${trade.timeOut}`,
        type: 'full_close',
        lotSize: -remainingPosition.totalLots,
        price: trade.exitPrice,
        totalPosition: 0,
        averagePrice: 0,
      });
    }

    // Add any additional position history events
    if (trade.positionHistory && trade.positionHistory.length > 0) {
      trade.positionHistory.forEach(event => {
        // Only add if not already in timeline
        if (!timeline.find(e => e.id === event.id)) {
          timeline.push(event);
        }
      });
    }

    // Sort by timestamp
    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  // ===== VALIDATION =====

  // Validate partial close data
  validatePartialClose(partialClose: Omit<PartialClose, 'id' | 'remainingLots'>, trade: Trade): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!partialClose.timestamp || partialClose.timestamp.trim() === '') {
      errors.push('Partial close timestamp is required');
    }

    if (!partialClose.lotSize || partialClose.lotSize <= 0) {
      errors.push('Partial close lot size must be greater than 0');
    }

    if (!partialClose.price || partialClose.price <= 0) {
      errors.push('Partial close price must be greater than 0');
    }

    if (!partialClose.reason) {
      errors.push('Partial close reason is required');
    }

    // Business logic validation
    if (partialClose.lotSize && trade.lotSize) {
      const currentPartialCloses = trade.partialCloses || [];
      const totalClosedLots = currentPartialCloses.reduce((sum, pc) => sum + pc.lotSize, 0);
      const remainingLots = trade.lotSize - totalClosedLots;

      if (partialClose.lotSize > remainingLots) {
        errors.push(`Partial close lot size (${partialClose.lotSize}) exceeds remaining position (${remainingLots})`);
      }

      if (partialClose.lotSize >= trade.lotSize) {
        warnings.push('Partial close size is equal to or greater than original position - consider using full close instead');
      }
    }

    // Timestamp validation
    if (partialClose.timestamp && trade.date && trade.timeIn) {
      const entryTime = new Date(`${trade.date} ${trade.timeIn}`).getTime();
      const closeTime = new Date(partialClose.timestamp).getTime();

      if (closeTime < entryTime) {
        errors.push('Partial close timestamp cannot be before trade entry time');
      }

      if (trade.timeOut) {
        const exitTime = new Date(`${trade.date} ${trade.timeOut}`).getTime();
        if (closeTime > exitTime) {
          errors.push('Partial close timestamp cannot be after trade exit time');
        }
      }
    }

    // Price validation
    if (partialClose.price && trade.entryPrice) {
      const priceDifference = Math.abs(partialClose.price - trade.entryPrice) / trade.entryPrice;
      if (priceDifference > 0.1) { // 10% difference
        warnings.push('Partial close price differs significantly from entry price - please verify');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  // ===== POSITION MANAGEMENT SCORING =====

  // Calculate position management score (0-100)
  calculatePositionManagementScore(trade: Trade): number {
    if (trade.status !== 'closed' || !trade.partialCloses || trade.partialCloses.length === 0) {
      return 0; // No partial closes to score
    }

    let score = 0;
    const factors = [];

    // Factor 1: Profit optimization (40% weight)
    const totalPnL = trade.pnl || 0;
    const realizedFromPartials = trade.partialCloses.reduce((sum, pc) => sum + pc.pnlRealized, 0);
    const partialContribution = totalPnL !== 0 ? (realizedFromPartials / totalPnL) : 0;
    
    if (partialContribution > 0) {
      factors.push({ weight: 0.4, score: Math.min(partialContribution * 100, 100) });
    } else {
      factors.push({ weight: 0.4, score: 0 });
    }

    // Factor 2: Risk management (30% weight)
    const hasRiskReduction = trade.partialCloses.some(pc => pc.reason === 'risk_reduction');
    const riskScore = hasRiskReduction ? 80 : 40;
    factors.push({ weight: 0.3, score: riskScore });

    // Factor 3: Timing efficiency (20% weight)
    const timeline = this.generatePositionTimeline(trade);
    const entryTime = new Date(timeline[0].timestamp).getTime();
    const exitTime = trade.timeOut ? new Date(`${trade.date} ${trade.timeOut}`).getTime() : Date.now();
    const totalDuration = exitTime - entryTime;

    let timingScore = 50; // Base score
    if (totalDuration > 0) {
      const partialTimes = trade.partialCloses.map(pc => new Date(pc.timestamp).getTime());
      const averagePartialTime = partialTimes.reduce((sum, time) => sum + time, 0) / partialTimes.length;
      const partialTiming = (averagePartialTime - entryTime) / totalDuration;
      
      // Optimal timing is around 60-80% of trade duration
      if (partialTiming >= 0.6 && partialTiming <= 0.8) {
        timingScore = 90;
      } else if (partialTiming >= 0.4 && partialTiming <= 0.9) {
        timingScore = 70;
      }
    }
    factors.push({ weight: 0.2, score: timingScore });

    // Factor 4: Position sizing strategy (10% weight)
    const avgPartialSize = trade.partialCloses.reduce((sum, pc) => sum + pc.lotSize, 0) / trade.partialCloses.length;
    const optimalPartialSize = trade.lotSize * 0.3; // 30% is often considered optimal
    const sizingEfficiency = 1 - Math.abs(avgPartialSize - optimalPartialSize) / optimalPartialSize;
    factors.push({ weight: 0.1, score: Math.max(sizingEfficiency * 100, 0) });

    // Calculate weighted score
    score = factors.reduce((sum, factor) => sum + (factor.weight * factor.score), 0);

    return Math.round(Math.max(0, Math.min(100, score)));
  },

  // ===== FIREBASE INTEGRATION =====

  // Save position event to Firebase
  async savePositionEvent(userId: string, tradeId: string, event: Omit<PositionEvent, 'id'>): Promise<string> {
    try {
      const eventsCollection = getUserPositionEventsCollection(userId);
      const eventData = convertPositionEventToFirestore({
        ...event,
        tradeId, // Add tradeId for querying
      } as any);
      const docRef = await addDoc(eventsCollection, eventData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving position event:', error);
      throw error;
    }
  },

  // Get position events for a trade
  async getPositionEvents(userId: string, tradeId: string): Promise<PositionEvent[]> {
    try {
      const eventsCollection = getUserPositionEventsCollection(userId);
      const q = query(
        eventsCollection,
        where('tradeId', '==', tradeId),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreToPositionEvent);
    } catch (error) {
      console.error('Error getting position events:', error);
      throw error;
    }
  },

  // Update position event
  async updatePositionEvent(userId: string, eventId: string, updates: Partial<PositionEvent>): Promise<void> {
    try {
      const eventDoc = doc(getUserPositionEventsCollection(userId), eventId);
      const updateData = { ...updates };
      if (updateData.timestamp) {
        updateData.timestamp = new Date(updateData.timestamp) as any;
      }
      await updateDoc(eventDoc, updateData);
    } catch (error) {
      console.error('Error updating position event:', error);
      throw error;
    }
  },

  // Delete position event
  async deletePositionEvent(userId: string, eventId: string): Promise<void> {
    try {
      const eventDoc = doc(getUserPositionEventsCollection(userId), eventId);
      await deleteDoc(eventDoc);
    } catch (error) {
      console.error('Error deleting position event:', error);
      throw error;
    }
  },

  // Subscribe to real-time position events for a trade
  subscribeToPositionEvents(userId: string, tradeId: string, callback: (events: PositionEvent[]) => void): () => void {
    const eventsCollection = getUserPositionEventsCollection(userId);
    const q = query(
      eventsCollection,
      where('tradeId', '==', tradeId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
      const events = querySnapshot.docs.map(convertFirestoreToPositionEvent);
      callback(events);
    }, (error) => {
      console.error('Error in position events subscription:', error);
    });
  },

  // ===== ADVANCED POSITION MANAGEMENT ANALYTICS =====

  // Calculate exit efficiency analysis
  calculateExitEfficiency(trades: Trade[]): ExitAnalytics {
    const tradesWithPartials = trades.filter(trade => 
      trade.status === 'closed' && 
      trade.partialCloses && 
      trade.partialCloses.length > 0
    );

    if (tradesWithPartials.length === 0) {
      return {
        averageExitEfficiency: 0,
        partialCloseSuccess: 0,
        totalTrades: trades.length,
        positionHoldTime: {
          average: 0,
          byProfitability: { winning: 0, losing: 0 },
        },
        exitReasons: {},
      };
    }

    // Calculate exit efficiency scores
    const efficiencyScores = tradesWithPartials.map(trade => {
      return this.calculatePositionManagementScore(trade);
    });
    const averageExitEfficiency = efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;

    // Calculate partial close success rate
    const successfulPartials = tradesWithPartials.filter(trade => {
      const partialPnL = trade.partialCloses!.reduce((sum, pc) => sum + pc.pnlRealized, 0);
      return partialPnL > 0;
    });
    const partialCloseSuccess = (successfulPartials.length / tradesWithPartials.length) * 100;

    // Calculate hold times
    const holdTimes = tradesWithPartials
      .filter(trade => trade.timeIn && trade.timeOut)
      .map(trade => {
        const entryTime = new Date(`${trade.date} ${trade.timeIn}`).getTime();
        const exitTime = new Date(`${trade.date} ${trade.timeOut}`).getTime();
        const holdTime = (exitTime - entryTime) / (1000 * 60 * 60); // Hours
        const isWinning = (trade.pnl || 0) > 0;
        return { holdTime, isWinning };
      });

    const averageHoldTime = holdTimes.length > 0 
      ? holdTimes.reduce((sum, ht) => sum + ht.holdTime, 0) / holdTimes.length 
      : 0;

    const winningTrades = holdTimes.filter(ht => ht.isWinning);
    const losingTrades = holdTimes.filter(ht => !ht.isWinning);

    const averageWinningHoldTime = winningTrades.length > 0
      ? winningTrades.reduce((sum, ht) => sum + ht.holdTime, 0) / winningTrades.length
      : 0;

    const averageLosingHoldTime = losingTrades.length > 0
      ? losingTrades.reduce((sum, ht) => sum + ht.holdTime, 0) / losingTrades.length
      : 0;

    // Analyze exit reasons
    const exitReasons: { [key: string]: number } = {};
    tradesWithPartials.forEach(trade => {
      trade.partialCloses!.forEach(pc => {
        exitReasons[pc.reason] = (exitReasons[pc.reason] || 0) + 1;
      });
    });

    return {
      averageExitEfficiency,
      partialCloseSuccess,
      totalTrades: trades.length,
      positionHoldTime: {
        average: averageHoldTime,
        byProfitability: {
          winning: averageWinningHoldTime,
          losing: averageLosingHoldTime,
        },
      },
      exitReasons,
    };
  },

  // Generate exit optimization recommendations
  generateExitOptimizationRecommendations(trades: Trade[]): PositionRecommendations {
    const analytics = this.calculateExitEfficiency(trades);
    const tradesWithPartials = trades.filter(trade => 
      trade.status === 'closed' && 
      trade.partialCloses && 
      trade.partialCloses.length > 0
    );

    // Analyze optimal partial close levels
    const partialCloseAnalysis = tradesWithPartials.map(trade => {
      const totalPnL = trade.pnl || 0;
      const partialPnL = trade.partialCloses!.reduce((sum, pc) => sum + pc.pnlRealized, 0);
      const partialContribution = totalPnL !== 0 ? partialPnL / totalPnL : 0;
      
      // Calculate average partial close level as percentage of total position
      const avgPartialSize = trade.partialCloses!.reduce((sum, pc) => sum + pc.lotSize, 0) / trade.partialCloses!.length;
      const partialLevel = avgPartialSize / trade.lotSize;
      
      return { partialLevel, partialContribution, totalPnL };
    });

    // Find optimal partial close level
    const profitablePartials = partialCloseAnalysis.filter(analysis => analysis.totalPnL > 0);
    const optimalPartialCloseLevel = profitablePartials.length > 0
      ? profitablePartials.reduce((sum, analysis) => sum + analysis.partialLevel, 0) / profitablePartials.length
      : 0.3; // Default to 30%

    // Analyze optimal hold times
    const recommendedHoldTime = analytics.positionHoldTime.byProfitability.winning > 0
      ? analytics.positionHoldTime.byProfitability.winning
      : analytics.positionHoldTime.average;

    // Generate exit strategy recommendation
    let suggestedExitStrategy = 'Standard Exit';
    if (analytics.partialCloseSuccess > 70) {
      suggestedExitStrategy = 'Aggressive Partial Scaling';
    } else if (analytics.partialCloseSuccess > 50) {
      suggestedExitStrategy = 'Conservative Partial Scaling';
    } else if (analytics.averageExitEfficiency < 40) {
      suggestedExitStrategy = 'Focus on Full Position Exits';
    }

    // Generate risk optimization tips
    const riskOptimizationTips: string[] = [];
    
    if (analytics.averageExitEfficiency < 50) {
      riskOptimizationTips.push('Consider improving exit timing - current efficiency is below average');
    }
    
    if (analytics.partialCloseSuccess < 60) {
      riskOptimizationTips.push('Review partial close criteria - success rate could be improved');
    }
    
    if (analytics.positionHoldTime.byProfitability.losing > analytics.positionHoldTime.byProfitability.winning) {
      riskOptimizationTips.push('Consider cutting losing trades faster - they are held longer than winners');
    }
    
    const mostCommonExitReason = Object.entries(analytics.exitReasons)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (mostCommonExitReason && mostCommonExitReason[0] === 'manual') {
      riskOptimizationTips.push('High frequency of manual exits - consider developing more systematic exit rules');
    }
    
    if (optimalPartialCloseLevel > 0.5) {
      riskOptimizationTips.push('Consider smaller partial close sizes to maintain more position for trend continuation');
    }

    return {
      optimalPartialCloseLevel: Math.round(optimalPartialCloseLevel * 100) / 100,
      recommendedHoldTime: Math.round(recommendedHoldTime * 100) / 100,
      suggestedExitStrategy,
      riskOptimizationTips,
    };
  },

  // Track scaling entries with weighted average price calculation
  calculateScalingEntryMetrics(trade: Trade): {
    totalEntries: number;
    weightedAveragePrice: number;
    averageEntrySize: number;
    entrySpread: number;
    scalingEfficiency: number;
  } {
    const timeline = this.generatePositionTimeline(trade);
    const entries = timeline.filter(event => event.type === 'entry');

    if (entries.length <= 1) {
      return {
        totalEntries: entries.length,
        weightedAveragePrice: trade.entryPrice,
        averageEntrySize: trade.lotSize,
        entrySpread: 0,
        scalingEfficiency: 0,
      };
    }

    // Calculate weighted average price
    const totalValue = entries.reduce((sum, entry) => sum + (entry.price * entry.lotSize), 0);
    const totalLots = entries.reduce((sum, entry) => sum + entry.lotSize, 0);
    const weightedAveragePrice = totalValue / totalLots;

    // Calculate average entry size
    const averageEntrySize = totalLots / entries.length;

    // Calculate entry spread (difference between highest and lowest entry)
    const prices = entries.map(entry => entry.price);
    const entrySpread = Math.max(...prices) - Math.min(...prices);

    // Calculate scaling efficiency
    let scalingEfficiency = 0;
    if (trade.status === 'closed' && trade.pnl !== undefined) {
      // Compare actual P&L with what would have been achieved with single entry
      const singleEntryPnL = this.calculateHypotheticalPnL(
        trade.entryPrice,
        trade.exitPrice || 0,
        trade.lotSize,
        trade.side
      );
      
      const actualPnL = trade.pnl;
      scalingEfficiency = singleEntryPnL !== 0 ? (actualPnL / singleEntryPnL) * 100 : 0;
    }

    return {
      totalEntries: entries.length,
      weightedAveragePrice,
      averageEntrySize,
      entrySpread,
      scalingEfficiency,
    };
  },

  // Helper method to calculate hypothetical P&L
  calculateHypotheticalPnL(entryPrice: number, exitPrice: number, lotSize: number, side: 'long' | 'short'): number {
    const priceDifference = side === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice;
    // Simplified P&L calculation - in real implementation would need pip value calculation
    return priceDifference * lotSize * 10; // Approximate pip value multiplier
  },

  // Analyze position management patterns across all trades
  analyzePositionManagementPatterns(trades: Trade[]): {
    averagePartialsPerTrade: number;
    mostCommonPartialReason: string;
    optimalPartialTiming: number; // As percentage of trade duration
    partialSizeDistribution: { [range: string]: number };
    scalingVsPartialPerformance: {
      scalingTrades: { count: number; avgPnL: number; avgScore: number };
      partialTrades: { count: number; avgPnL: number; avgScore: number };
      bothTrades: { count: number; avgPnL: number; avgScore: number };
    };
  } {
    const tradesWithPartials = trades.filter(trade => 
      trade.partialCloses && trade.partialCloses.length > 0
    );

    const tradesWithScaling = trades.filter(trade => {
      const timeline = this.generatePositionTimeline(trade);
      const entries = timeline.filter(event => event.type === 'entry');
      return entries.length > 1;
    });

    const tradesWithBoth = trades.filter(trade => {
      const hasPartials = trade.partialCloses && trade.partialCloses.length > 0;
      const timeline = this.generatePositionTimeline(trade);
      const entries = timeline.filter(event => event.type === 'entry');
      const hasScaling = entries.length > 1;
      return hasPartials && hasScaling;
    });

    // Calculate average partials per trade
    const totalPartials = tradesWithPartials.reduce((sum, trade) => sum + (trade.partialCloses?.length || 0), 0);
    const averagePartialsPerTrade = tradesWithPartials.length > 0 ? totalPartials / tradesWithPartials.length : 0;

    // Find most common partial reason
    const reasonCounts: { [reason: string]: number } = {};
    tradesWithPartials.forEach(trade => {
      trade.partialCloses!.forEach(pc => {
        reasonCounts[pc.reason] = (reasonCounts[pc.reason] || 0) + 1;
      });
    });
    const mostCommonPartialReason = Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'profit_taking';

    // Calculate optimal partial timing
    const timingAnalysis = tradesWithPartials
      .filter(trade => trade.timeIn && trade.timeOut)
      .map(trade => {
        const entryTime = new Date(`${trade.date} ${trade.timeIn}`).getTime();
        const exitTime = new Date(`${trade.date} ${trade.timeOut}`).getTime();
        const totalDuration = exitTime - entryTime;
        
        if (totalDuration <= 0) return null;
        
        const partialTimings = trade.partialCloses!.map(pc => {
          const partialTime = new Date(pc.timestamp).getTime();
          return (partialTime - entryTime) / totalDuration;
        });
        
        const avgTiming = partialTimings.reduce((sum, timing) => sum + timing, 0) / partialTimings.length;
        const tradePnL = trade.pnl || 0;
        
        return { avgTiming, tradePnL };
      })
      .filter(analysis => analysis !== null) as { avgTiming: number; tradePnL: number }[];

    const profitableTimings = timingAnalysis.filter(analysis => analysis.tradePnL > 0);
    const optimalPartialTiming = profitableTimings.length > 0
      ? profitableTimings.reduce((sum, analysis) => sum + analysis.avgTiming, 0) / profitableTimings.length
      : 0.6; // Default to 60%

    // Analyze partial size distribution
    const partialSizeDistribution: { [range: string]: number } = {
      '0-25%': 0,
      '25-50%': 0,
      '50-75%': 0,
      '75-100%': 0,
    };

    tradesWithPartials.forEach(trade => {
      trade.partialCloses!.forEach(pc => {
        const percentage = (pc.lotSize / trade.lotSize) * 100;
        if (percentage <= 25) partialSizeDistribution['0-25%']++;
        else if (percentage <= 50) partialSizeDistribution['25-50%']++;
        else if (percentage <= 75) partialSizeDistribution['50-75%']++;
        else partialSizeDistribution['75-100%']++;
      });
    });

    // Compare scaling vs partial performance
    const calculateGroupStats = (groupTrades: Trade[]) => {
      const closedTrades = groupTrades.filter(trade => trade.status === 'closed');
      const avgPnL = closedTrades.length > 0
        ? closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / closedTrades.length
        : 0;
      const avgScore = closedTrades.length > 0
        ? closedTrades.reduce((sum, trade) => sum + this.calculatePositionManagementScore(trade), 0) / closedTrades.length
        : 0;
      return { count: closedTrades.length, avgPnL, avgScore };
    };

    return {
      averagePartialsPerTrade,
      mostCommonPartialReason,
      optimalPartialTiming: Math.round(optimalPartialTiming * 100) / 100,
      partialSizeDistribution,
      scalingVsPartialPerformance: {
        scalingTrades: calculateGroupStats(tradesWithScaling),
        partialTrades: calculateGroupStats(tradesWithPartials),
        bothTrades: calculateGroupStats(tradesWithBoth),
      },
    };
  },
};
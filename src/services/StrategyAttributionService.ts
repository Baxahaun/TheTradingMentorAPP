/**
 * Strategy Attribution Service
 * 
 * This service handles the integration between trades and strategies, including:
 * - Automatic strategy suggestion for trades
 * - Trade-to-strategy assignment with validation
 * - Strategy adherence scoring and deviation tracking
 * - Cleanup workflows for unassigned trades
 * 
 * Key Features:
 * - Intelligent strategy matching based on trade characteristics
 * - Rule compliance measurement and deviation tracking
 * - Automated trade attribution workflows
 * - Performance impact analysis of strategy deviations
 */

import { 
  ProfessionalStrategy, 
  StrategySuggestion, 
  StrategyDeviation,
  TradeWithStrategy 
} from '../types/strategy';
import { Trade } from '../types/trade';

/**
 * Configuration for strategy attribution algorithms
 */
export interface AttributionConfig {
  // Matching algorithm weights
  matchingWeights: {
    currencyPair: number;
    timeframe: number;
    marketConditions: number;
    entryTriggers: number;
    riskManagement: number;
  };
  
  // Confidence thresholds
  confidenceThresholds: {
    autoAssign: number; // Auto-assign if confidence >= this value
    suggest: number; // Suggest if confidence >= this value
    minimum: number; // Don't suggest if confidence < this value
  };
  
  // Adherence scoring weights
  adherenceWeights: {
    entryTiming: number;
    positionSize: number;
    stopLoss: number;
    takeProfit: number;
    riskManagement: number;
  };
  
  // Deviation tolerance thresholds
  deviationThresholds: {
    positionSize: number; // Percentage deviation allowed
    stopLoss: number; // Percentage deviation allowed
    takeProfit: number; // Percentage deviation allowed
    entryTiming: number; // Minutes deviation allowed
  };
}

/**
 * Default configuration for strategy attribution
 */
const DEFAULT_CONFIG: AttributionConfig = {
  matchingWeights: {
    currencyPair: 0.25,
    timeframe: 0.20,
    marketConditions: 0.20,
    entryTriggers: 0.20,
    riskManagement: 0.15
  },
  confidenceThresholds: {
    autoAssign: 85,
    suggest: 60,
    minimum: 30
  },
  adherenceWeights: {
    entryTiming: 0.15,
    positionSize: 0.25,
    stopLoss: 0.25,
    takeProfit: 0.20,
    riskManagement: 0.15
  },
  deviationThresholds: {
    positionSize: 10, // 10% deviation allowed
    stopLoss: 5, // 5% deviation allowed
    takeProfit: 10, // 10% deviation allowed
    entryTiming: 30 // 30 minutes deviation allowed
  }
};

/**
 * Strategy matching result interface
 */
interface StrategyMatch {
  strategy: ProfessionalStrategy;
  confidence: number;
  matchingFactors: {
    currencyPair: number;
    timeframe: number;
    marketConditions: number;
    entryTriggers: number;
    riskManagement: number;
  };
  reasoning: string[];
}

/**
 * Adherence analysis result interface
 */
interface AdherenceAnalysis {
  overallScore: number;
  componentScores: {
    entryTiming: number;
    positionSize: number;
    stopLoss: number;
    takeProfit: number;
    riskManagement: number;
  };
  deviations: StrategyDeviation[];
  recommendations: string[];
}

/**
 * Core strategy attribution service
 */
export class StrategyAttributionService {
  private config: AttributionConfig;

  constructor(config?: Partial<AttributionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Suggest strategies for a trade based on trade characteristics
   * 
   * @param trade - Trade to find strategy matches for
   * @param strategies - Available strategies to match against
   * @returns Array of strategy suggestions ranked by confidence
   */
  suggestStrategy(
    trade: Trade,
    strategies: ProfessionalStrategy[]
  ): StrategySuggestion[] {
    if (!this.isValidTradeForAttribution(trade)) {
      throw new Error(`Trade ${trade.id} is missing required data for strategy attribution`);
    }

    if (!strategies || strategies.length === 0) {
      return [];
    }

    // Filter active strategies
    const activeStrategies = strategies.filter(strategy => strategy.isActive);
    
    // Calculate matches for each strategy
    const matches: StrategyMatch[] = activeStrategies.map(strategy => 
      this.calculateStrategyMatch(trade, strategy)
    );

    // Filter by minimum confidence and sort by confidence
    const validMatches = matches
      .filter(match => match.confidence >= this.config.confidenceThresholds.minimum)
      .sort((a, b) => b.confidence - a.confidence);

    // Convert to suggestion format
    return validMatches.map(match => ({
      strategyId: match.strategy.id,
      strategyName: match.strategy.title,
      confidence: Math.round(match.confidence * 100) / 100,
      matchingFactors: this.formatMatchingFactors(match.matchingFactors),
      reasoning: this.generateReasoningText(match)
    }));
  }

  /**
   * Assign a trade to a strategy with validation
   * 
   * @param tradeId - ID of the trade to assign
   * @param strategyId - ID of the strategy to assign to
   * @param trade - Trade object (for validation)
   * @param strategy - Strategy object (for validation)
   * @returns Promise resolving to updated TradeWithStrategy
   */
  async assignTradeToStrategy(
    tradeId: string,
    strategyId: string,
    trade: Trade,
    strategy: ProfessionalStrategy
  ): Promise<TradeWithStrategy> {
    // Validate inputs
    if (!tradeId || !strategyId) {
      throw new Error('Trade ID and Strategy ID are required for assignment');
    }

    if (!this.isValidTradeForAttribution(trade)) {
      throw new Error(`Trade ${tradeId} is missing required data for strategy assignment`);
    }

    if (!strategy.isActive) {
      throw new Error(`Cannot assign trade to inactive strategy: ${strategy.title}`);
    }

    // Calculate adherence score and identify deviations
    const adherenceAnalysis = this.calculateAdherenceScore(trade, strategy);

    // Create enhanced trade object
    const tradeWithStrategy: TradeWithStrategy = {
      ...trade,
      strategyId: strategy.id,
      strategyName: strategy.title,
      adherenceScore: adherenceAnalysis.overallScore,
      deviations: adherenceAnalysis.deviations,
      strategyVersion: strategy.version
    };

    // Log assignment for audit trail
    console.log(`Trade ${tradeId} assigned to strategy ${strategy.title} with adherence score: ${adherenceAnalysis.overallScore}`);

    return tradeWithStrategy;
  }

  /**
   * Calculate adherence score measuring how well a trade followed strategy rules
   * 
   * @param trade - Trade to analyze
   * @param strategy - Strategy rules to compare against
   * @returns Adherence score (0-100) and detailed analysis
   */
  calculateAdherenceScore(
    trade: Trade,
    strategy: ProfessionalStrategy
  ): AdherenceAnalysis {
    if (!this.isValidTradeForAttribution(trade)) {
      throw new Error(`Trade ${trade.id} is missing required data for adherence calculation`);
    }

    // Calculate component scores
    const componentScores = {
      entryTiming: this.calculateEntryTimingScore(trade, strategy),
      positionSize: this.calculatePositionSizeScore(trade, strategy),
      stopLoss: this.calculateStopLossScore(trade, strategy),
      takeProfit: this.calculateTakeProfitScore(trade, strategy),
      riskManagement: this.calculateRiskManagementScore(trade, strategy)
    };

    // Calculate weighted overall score
    const overallScore = 
      componentScores.entryTiming * this.config.adherenceWeights.entryTiming +
      componentScores.positionSize * this.config.adherenceWeights.positionSize +
      componentScores.stopLoss * this.config.adherenceWeights.stopLoss +
      componentScores.takeProfit * this.config.adherenceWeights.takeProfit +
      componentScores.riskManagement * this.config.adherenceWeights.riskManagement;

    // Identify deviations
    const deviations = this.identifyDeviations(trade, strategy, componentScores);

    // Generate recommendations
    const recommendations = this.generateAdherenceRecommendations(componentScores, deviations);

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      componentScores,
      deviations,
      recommendations
    };
  }

  /**
   * Identify specific deviations from strategy rules
   * 
   * @param trade - Trade to analyze
   * @param strategy - Strategy rules to compare against
   * @returns Array of identified deviations
   */
  identifyDeviations(
    trade: Trade,
    strategy: ProfessionalStrategy,
    componentScores?: any
  ): StrategyDeviation[] {
    const deviations: StrategyDeviation[] = [];

    // Position size deviations
    const positionSizeDeviation = this.checkPositionSizeDeviation(trade, strategy);
    if (positionSizeDeviation) {
      deviations.push(positionSizeDeviation);
    }

    // Stop loss deviations
    const stopLossDeviation = this.checkStopLossDeviation(trade, strategy);
    if (stopLossDeviation) {
      deviations.push(stopLossDeviation);
    }

    // Take profit deviations
    const takeProfitDeviation = this.checkTakeProfitDeviation(trade, strategy);
    if (takeProfitDeviation) {
      deviations.push(takeProfitDeviation);
    }

    // Entry timing deviations
    const entryTimingDeviation = this.checkEntryTimingDeviation(trade, strategy);
    if (entryTimingDeviation) {
      deviations.push(entryTimingDeviation);
    }

    // Risk management deviations
    const riskManagementDeviation = this.checkRiskManagementDeviation(trade, strategy);
    if (riskManagementDeviation) {
      deviations.push(riskManagementDeviation);
    }

    return deviations;
  }

  /**
   * Get trades that haven't been assigned to any strategy
   * 
   * @param trades - Array of all trades
   * @returns Array of unassigned trades
   */
  getUnassignedTrades(trades: Trade[]): Trade[] {
    return trades.filter(trade => 
      trade.status === 'closed' && 
      (!trade.strategy || trade.strategy.trim() === '')
    );
  }

  /**
   * Batch assign multiple trades to strategies using automatic matching
   * 
   * @param trades - Trades to assign
   * @param strategies - Available strategies
   * @param autoAssignThreshold - Confidence threshold for auto-assignment
   * @returns Results of batch assignment
   */
  async batchAutoAssign(
    trades: Trade[],
    strategies: ProfessionalStrategy[],
    autoAssignThreshold: number = this.config.confidenceThresholds.autoAssign
  ): Promise<{
    assigned: TradeWithStrategy[];
    unassigned: Trade[];
    suggestions: Array<{ trade: Trade; suggestions: StrategySuggestion[] }>;
  }> {
    const assigned: TradeWithStrategy[] = [];
    const unassigned: Trade[] = [];
    const suggestions: Array<{ trade: Trade; suggestions: StrategySuggestion[] }> = [];

    for (const trade of trades) {
      try {
        const strategySuggestions = this.suggestStrategy(trade, strategies);
        
        if (strategySuggestions.length === 0) {
          unassigned.push(trade);
          continue;
        }

        const bestMatch = strategySuggestions[0];
        
        if (bestMatch.confidence >= autoAssignThreshold) {
          // Auto-assign to best match
          const strategy = strategies.find(s => s.id === bestMatch.strategyId);
          if (strategy) {
            const assignedTrade = await this.assignTradeToStrategy(
              trade.id,
              strategy.id,
              trade,
              strategy
            );
            assigned.push(assignedTrade);
          } else {
            unassigned.push(trade);
          }
        } else {
          // Add to suggestions for manual review
          suggestions.push({
            trade,
            suggestions: strategySuggestions
          });
        }
      } catch (error) {
        console.error(`Error processing trade ${trade.id} for batch assignment:`, error);
        unassigned.push(trade);
      }
    }

    return { assigned, unassigned, suggestions };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Validate if a trade has required data for attribution
   */
  private isValidTradeForAttribution(trade: Trade): boolean {
    return !!(
      trade.id &&
      trade.currencyPair &&
      trade.date &&
      trade.entryPrice &&
      trade.side &&
      trade.status === 'closed'
    );
  }

  /**
   * Calculate how well a trade matches a strategy
   */
  private calculateStrategyMatch(
    trade: Trade,
    strategy: ProfessionalStrategy
  ): StrategyMatch {
    const matchingFactors = {
      currencyPair: this.calculateCurrencyPairMatch(trade, strategy),
      timeframe: this.calculateTimeframeMatch(trade, strategy),
      marketConditions: this.calculateMarketConditionsMatch(trade, strategy),
      entryTriggers: this.calculateEntryTriggersMatch(trade, strategy),
      riskManagement: this.calculateRiskManagementMatch(trade, strategy)
    };

    // Calculate weighted confidence score
    const confidence = 
      matchingFactors.currencyPair * this.config.matchingWeights.currencyPair +
      matchingFactors.timeframe * this.config.matchingWeights.timeframe +
      matchingFactors.marketConditions * this.config.matchingWeights.marketConditions +
      matchingFactors.entryTriggers * this.config.matchingWeights.entryTriggers +
      matchingFactors.riskManagement * this.config.matchingWeights.riskManagement;

    const reasoning = this.generateMatchingReasoning(trade, strategy, matchingFactors);

    return {
      strategy,
      confidence: confidence * 100, // Convert to percentage
      matchingFactors,
      reasoning
    };
  }

  /**
   * Calculate currency pair matching score
   */
  private calculateCurrencyPairMatch(trade: Trade, strategy: ProfessionalStrategy): number {
    if (!strategy.assetClasses || strategy.assetClasses.length === 0) {
      return 0.5; // Neutral score if no asset classes defined
    }

    // Check if trade's currency pair matches strategy's asset classes
    const tradePair = trade.currencyPair.toUpperCase();
    
    // Simple matching - in real implementation, would have more sophisticated logic
    const hasForexAssetClass = strategy.assetClasses.some(ac => 
      ac.toLowerCase().includes('forex') || ac.toLowerCase().includes('currency')
    );
    
    if (hasForexAssetClass) {
      return 1.0; // Perfect match for forex trades
    }

    return 0.3; // Low match if asset classes don't align
  }

  /**
   * Calculate timeframe matching score
   */
  private calculateTimeframeMatch(trade: Trade, strategy: ProfessionalStrategy): number {
    if (!trade.timeframe || !strategy.primaryTimeframe) {
      return 0.5; // Neutral score if timeframe not specified
    }

    const tradeTimeframe = trade.timeframe.toLowerCase();
    const strategyTimeframe = strategy.primaryTimeframe.toLowerCase();

    if (tradeTimeframe === strategyTimeframe) {
      return 1.0; // Perfect match
    }

    // Check for compatible timeframes (e.g., 1H and 4H are somewhat compatible)
    const timeframeCompatibility = this.getTimeframeCompatibility(tradeTimeframe, strategyTimeframe);
    return timeframeCompatibility;
  }

  /**
   * Calculate market conditions matching score
   */
  private calculateMarketConditionsMatch(trade: Trade, strategy: ProfessionalStrategy): number {
    if (!trade.marketConditions || !strategy.setupConditions?.marketEnvironment) {
      return 0.5; // Neutral score if conditions not specified
    }

    const tradeConditions = trade.marketConditions.toLowerCase();
    const strategyConditions = strategy.setupConditions.marketEnvironment.toLowerCase();

    // Simple text matching - in real implementation, would use NLP or predefined mappings
    const commonWords = this.findCommonWords(tradeConditions, strategyConditions);
    const matchScore = commonWords.length > 0 ? Math.min(1.0, commonWords.length * 0.3) : 0.2;

    return matchScore;
  }

  /**
   * Calculate entry triggers matching score
   */
  private calculateEntryTriggersMatch(trade: Trade, strategy: ProfessionalStrategy): number {
    // This would analyze trade notes, setup type, patterns, etc.
    // For now, return a neutral score
    return 0.6;
  }

  /**
   * Calculate risk management matching score
   */
  private calculateRiskManagementMatch(trade: Trade, strategy: ProfessionalStrategy): number {
    let score = 0;
    let factors = 0;

    // Check stop loss alignment
    if (trade.stopLoss && strategy.riskManagement?.stopLossRule) {
      score += this.calculateStopLossAlignment(trade, strategy);
      factors++;
    }

    // Check take profit alignment
    if (trade.takeProfit && strategy.riskManagement?.takeProfitRule) {
      score += this.calculateTakeProfitAlignment(trade, strategy);
      factors++;
    }

    // Check position sizing alignment
    if (trade.riskAmount && strategy.riskManagement?.maxRiskPerTrade) {
      score += this.calculatePositionSizingAlignment(trade, strategy);
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Calculate component adherence scores
   */
  private calculateEntryTimingScore(trade: Trade, strategy: ProfessionalStrategy): number {
    // Analyze if entry timing aligns with strategy triggers
    // For now, return a base score
    return 85;
  }

  private calculatePositionSizeScore(trade: Trade, strategy: ProfessionalStrategy): number {
    if (!trade.riskAmount || !strategy.riskManagement?.maxRiskPerTrade) {
      return 50; // Neutral score if data missing
    }

    // Calculate expected risk based on strategy rules
    const maxRiskPerTrade = strategy.riskManagement.maxRiskPerTrade;
    const actualRiskPercentage = (trade.riskAmount / 10000) * 100; // Assuming $10k account
    
    const deviation = Math.abs(actualRiskPercentage - maxRiskPerTrade) / maxRiskPerTrade * 100;
    
    if (deviation <= this.config.deviationThresholds.positionSize) {
      return 100 - (deviation / this.config.deviationThresholds.positionSize) * 20;
    }
    
    return Math.max(0, 80 - deviation);
  }

  private calculateStopLossScore(trade: Trade, strategy: ProfessionalStrategy): number {
    if (!trade.stopLoss || !strategy.riskManagement?.stopLossRule) {
      return 50; // Neutral score if data missing
    }

    // Calculate expected stop loss based on strategy rules
    const expectedStopLoss = this.calculateExpectedStopLoss(trade, strategy);
    if (!expectedStopLoss) {
      return 50;
    }

    const deviation = Math.abs(trade.stopLoss - expectedStopLoss) / trade.entryPrice * 100;
    
    if (deviation <= this.config.deviationThresholds.stopLoss) {
      return 100 - (deviation / this.config.deviationThresholds.stopLoss) * 20;
    }
    
    return Math.max(0, 80 - deviation * 2);
  }

  private calculateTakeProfitScore(trade: Trade, strategy: ProfessionalStrategy): number {
    if (!trade.takeProfit || !strategy.riskManagement?.takeProfitRule) {
      return 50; // Neutral score if data missing
    }

    // Calculate expected take profit based on strategy rules
    const expectedTakeProfit = this.calculateExpectedTakeProfit(trade, strategy);
    if (!expectedTakeProfit) {
      return 50;
    }

    const deviation = Math.abs(trade.takeProfit - expectedTakeProfit) / trade.entryPrice * 100;
    
    if (deviation <= this.config.deviationThresholds.takeProfit) {
      return 100 - (deviation / this.config.deviationThresholds.takeProfit) * 20;
    }
    
    return Math.max(0, 80 - deviation);
  }

  private calculateRiskManagementScore(trade: Trade, strategy: ProfessionalStrategy): number {
    // Overall risk management adherence
    let score = 0;
    let factors = 0;

    // Check risk-reward ratio
    if (trade.rMultiple && strategy.riskManagement?.riskRewardRatio) {
      const expectedRR = strategy.riskManagement.riskRewardRatio;
      const actualRR = Math.abs(trade.rMultiple);
      const rrScore = actualRR >= expectedRR ? 100 : (actualRR / expectedRR) * 100;
      score += rrScore;
      factors++;
    }

    // Check leverage usage
    if (trade.leverage && strategy.riskManagement?.maxRiskPerTrade) {
      // Simplified leverage check
      const leverageScore = trade.leverage <= 50 ? 100 : Math.max(0, 100 - (trade.leverage - 50));
      score += leverageScore;
      factors++;
    }

    return factors > 0 ? score / factors : 70;
  }

  /**
   * Check for specific deviation types
   */
  private checkPositionSizeDeviation(trade: Trade, strategy: ProfessionalStrategy): StrategyDeviation | null {
    if (!trade.riskAmount || !strategy.riskManagement?.maxRiskPerTrade) {
      return null;
    }

    const maxRiskPerTrade = strategy.riskManagement.maxRiskPerTrade;
    const actualRiskPercentage = (trade.riskAmount / 10000) * 100; // Assuming $10k account
    
    const deviation = Math.abs(actualRiskPercentage - maxRiskPerTrade) / maxRiskPerTrade * 100;
    
    if (deviation > this.config.deviationThresholds.positionSize) {
      return {
        type: 'PositionSize',
        planned: `${maxRiskPerTrade}%`,
        actual: `${actualRiskPercentage.toFixed(2)}%`,
        impact: actualRiskPercentage > maxRiskPerTrade ? 'Negative' : 'Neutral',
        description: `Position size deviated by ${deviation.toFixed(1)}% from strategy rules`
      };
    }

    return null;
  }

  private checkStopLossDeviation(trade: Trade, strategy: ProfessionalStrategy): StrategyDeviation | null {
    if (!trade.stopLoss || !strategy.riskManagement?.stopLossRule) {
      return null;
    }

    const expectedStopLoss = this.calculateExpectedStopLoss(trade, strategy);
    if (!expectedStopLoss) {
      return null;
    }

    const deviation = Math.abs(trade.stopLoss - expectedStopLoss) / trade.entryPrice * 100;
    
    if (deviation > this.config.deviationThresholds.stopLoss) {
      const impact = this.determineStopLossDeviationImpact(trade, expectedStopLoss);
      
      return {
        type: 'StopLoss',
        planned: expectedStopLoss.toFixed(5),
        actual: trade.stopLoss.toFixed(5),
        impact,
        description: `Stop loss deviated by ${deviation.toFixed(2)}% from strategy calculation`
      };
    }

    return null;
  }

  private checkTakeProfitDeviation(trade: Trade, strategy: ProfessionalStrategy): StrategyDeviation | null {
    if (!trade.takeProfit || !strategy.riskManagement?.takeProfitRule) {
      return null;
    }

    const expectedTakeProfit = this.calculateExpectedTakeProfit(trade, strategy);
    if (!expectedTakeProfit) {
      return null;
    }

    const deviation = Math.abs(trade.takeProfit - expectedTakeProfit) / trade.entryPrice * 100;
    
    if (deviation > this.config.deviationThresholds.takeProfit) {
      const impact = this.determineTakeProfitDeviationImpact(trade, expectedTakeProfit);
      
      return {
        type: 'TakeProfit',
        planned: expectedTakeProfit.toFixed(5),
        actual: trade.takeProfit.toFixed(5),
        impact,
        description: `Take profit deviated by ${deviation.toFixed(2)}% from strategy calculation`
      };
    }

    return null;
  }

  private checkEntryTimingDeviation(trade: Trade, strategy: ProfessionalStrategy): StrategyDeviation | null {
    // This would check if entry timing aligns with strategy triggers
    // For now, return null (no deviation detected)
    return null;
  }

  private checkRiskManagementDeviation(trade: Trade, strategy: ProfessionalStrategy): StrategyDeviation | null {
    // Check overall risk management compliance
    if (trade.rMultiple && strategy.riskManagement?.riskRewardRatio) {
      const expectedRR = strategy.riskManagement.riskRewardRatio;
      const actualRR = Math.abs(trade.rMultiple);
      
      if (actualRR < expectedRR * 0.8) { // 20% tolerance
        return {
          type: 'RiskManagement',
          planned: `${expectedRR}:1 R:R`,
          actual: `${actualRR.toFixed(2)}:1 R:R`,
          impact: 'Negative',
          description: `Risk-reward ratio below strategy minimum (${expectedRR}:1)`
        };
      }
    }

    return null;
  }

  /**
   * Helper methods for calculations
   */
  private getTimeframeCompatibility(tf1: string, tf2: string): number {
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1m'];
    const index1 = timeframes.indexOf(tf1);
    const index2 = timeframes.indexOf(tf2);
    
    if (index1 === -1 || index2 === -1) {
      return 0.5;
    }
    
    const distance = Math.abs(index1 - index2);
    return Math.max(0.2, 1 - (distance * 0.2));
  }

  private findCommonWords(text1: string, text2: string): string[] {
    const words1 = text1.split(/\s+/).map(w => w.toLowerCase());
    const words2 = text2.split(/\s+/).map(w => w.toLowerCase());
    
    return words1.filter(word => 
      word.length > 3 && words2.includes(word)
    );
  }

  private calculateStopLossAlignment(trade: Trade, strategy: ProfessionalStrategy): number {
    // Simplified alignment calculation
    return 0.8;
  }

  private calculateTakeProfitAlignment(trade: Trade, strategy: ProfessionalStrategy): number {
    // Simplified alignment calculation
    return 0.7;
  }

  private calculatePositionSizingAlignment(trade: Trade, strategy: ProfessionalStrategy): number {
    // Simplified alignment calculation
    return 0.9;
  }

  private calculateExpectedStopLoss(trade: Trade, strategy: ProfessionalStrategy): number | null {
    const stopLossRule = strategy.riskManagement?.stopLossRule;
    if (!stopLossRule) {
      return null;
    }

    // Simplified calculation based on stop loss type
    switch (stopLossRule.type) {
      case 'PercentageBased':
        const percentage = stopLossRule.parameters.percentage || 2;
        return trade.side === 'long' 
          ? trade.entryPrice * (1 - percentage / 100)
          : trade.entryPrice * (1 + percentage / 100);
      
      case 'ATRBased':
        // Would need ATR data - simplified for now
        const atrMultiplier = stopLossRule.parameters.atrMultiplier || 2;
        const estimatedATR = trade.entryPrice * 0.01; // 1% as estimated ATR
        return trade.side === 'long'
          ? trade.entryPrice - (estimatedATR * atrMultiplier)
          : trade.entryPrice + (estimatedATR * atrMultiplier);
      
      default:
        return null;
    }
  }

  private calculateExpectedTakeProfit(trade: Trade, strategy: ProfessionalStrategy): number | null {
    const takeProfitRule = strategy.riskManagement?.takeProfitRule;
    const stopLoss = trade.stopLoss;
    
    if (!takeProfitRule || !stopLoss) {
      return null;
    }

    // Simplified calculation based on take profit type
    switch (takeProfitRule.type) {
      case 'RiskRewardRatio':
        const ratio = takeProfitRule.parameters.ratio || strategy.riskManagement?.riskRewardRatio || 2;
        const risk = Math.abs(trade.entryPrice - stopLoss);
        return trade.side === 'long'
          ? trade.entryPrice + (risk * ratio)
          : trade.entryPrice - (risk * ratio);
      
      default:
        return null;
    }
  }

  private determineStopLossDeviationImpact(trade: Trade, expectedStopLoss: number): 'Positive' | 'Negative' | 'Neutral' {
    if (!trade.stopLoss || !trade.exitPrice) {
      return 'Neutral';
    }

    // Determine if the deviation helped or hurt the trade outcome
    const actualRisk = Math.abs(trade.entryPrice - trade.stopLoss);
    const expectedRisk = Math.abs(trade.entryPrice - expectedStopLoss);
    
    if (trade.pnl && trade.pnl > 0) {
      // Winning trade - tighter stop might have been better
      return actualRisk < expectedRisk ? 'Positive' : 'Neutral';
    } else {
      // Losing trade - wider stop might have helped
      return actualRisk > expectedRisk ? 'Positive' : 'Negative';
    }
  }

  private determineTakeProfitDeviationImpact(trade: Trade, expectedTakeProfit: number): 'Positive' | 'Negative' | 'Neutral' {
    if (!trade.takeProfit || !trade.exitPrice) {
      return 'Neutral';
    }

    // Determine if the deviation helped or hurt the trade outcome
    const actualTarget = Math.abs(trade.takeProfit - trade.entryPrice);
    const expectedTarget = Math.abs(expectedTakeProfit - trade.entryPrice);
    
    if (trade.pnl && trade.pnl > 0) {
      // Winning trade - higher target might have been better
      return actualTarget > expectedTarget ? 'Positive' : 'Neutral';
    } else {
      // Losing trade - lower target might have helped
      return actualTarget < expectedTarget ? 'Positive' : 'Negative';
    }
  }

  private formatMatchingFactors(factors: any): string[] {
    const formatted: string[] = [];
    
    Object.entries(factors).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0.6) {
        const percentage = Math.round(value * 100);
        formatted.push(`${key}: ${percentage}%`);
      }
    });
    
    return formatted;
  }

  private generateMatchingReasoning(
    trade: Trade,
    strategy: ProfessionalStrategy,
    factors: any
  ): string[] {
    const reasoning: string[] = [];
    
    if (factors.currencyPair > 0.8) {
      reasoning.push(`Currency pair ${trade.currencyPair} matches strategy asset classes`);
    }
    
    if (factors.timeframe > 0.8) {
      reasoning.push(`Timeframe ${trade.timeframe} aligns with strategy timeframe ${strategy.primaryTimeframe}`);
    }
    
    if (factors.marketConditions > 0.6) {
      reasoning.push('Market conditions match strategy requirements');
    }
    
    if (factors.riskManagement > 0.7) {
      reasoning.push('Risk management parameters align with strategy rules');
    }
    
    return reasoning;
  }

  private generateReasoningText(match: StrategyMatch): string {
    const reasons = match.reasoning;
    if (reasons.length === 0) {
      return 'No specific matching factors identified';
    }
    return reasons.join('; ');
  }

  private generateAdherenceRecommendations(
    componentScores: any,
    deviations: StrategyDeviation[]
  ): string[] {
    const recommendations: string[] = [];

    // Position size recommendations
    if (componentScores.positionSize < 80) {
      recommendations.push('Consider reviewing position sizing methodology to better align with strategy rules');
    }

    // Stop loss recommendations
    if (componentScores.stopLoss < 80) {
      recommendations.push('Review stop loss placement to ensure consistency with strategy parameters');
    }

    // Take profit recommendations
    if (componentScores.takeProfit < 80) {
      recommendations.push('Consider adjusting take profit targets to match strategy expectations');
    }

    // Risk management recommendations
    if (componentScores.riskManagement < 70) {
      recommendations.push('Focus on improving overall risk management discipline');
    }

    // Deviation-specific recommendations
    deviations.forEach(deviation => {
      switch (deviation.type) {
        case 'PositionSize':
          if (deviation.impact === 'Negative') {
            recommendations.push('Reduce position size to stay within strategy risk limits');
          }
          break;
        case 'StopLoss':
          recommendations.push('Use strategy-calculated stop loss levels for better consistency');
          break;
        case 'TakeProfit':
          recommendations.push('Align take profit targets with strategy risk-reward ratios');
          break;
        case 'RiskManagement':
          recommendations.push('Improve adherence to strategy risk management rules');
          break;
      }
    });

    return recommendations.length > 0 ? recommendations : ['Trade execution aligns well with strategy parameters'];
  }
}

/**
 * Factory function to create a StrategyAttributionService instance
 */
export function createStrategyAttributionService(
  config?: Partial<AttributionConfig>
): StrategyAttributionService {
  return new StrategyAttributionService(config);
}

/**
 * Utility function to validate attribution inputs
 */
export function validateAttributionInputs(
  trade: Trade,
  strategies: ProfessionalStrategy[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!trade.id) {
    errors.push('Trade ID is required');
  }
  
  if (!trade.currencyPair) {
    errors.push('Currency pair is required');
  }
  
  if (!trade.entryPrice) {
    errors.push('Entry price is required');
  }
  
  if (!trade.side) {
    errors.push('Trade side (long/short) is required');
  }
  
  if (trade.status !== 'closed') {
    errors.push('Only closed trades can be attributed to strategies');
  }
  
  if (!Array.isArray(strategies)) {
    errors.push('Strategies must be an array');
  } else if (strategies.length === 0) {
    errors.push('At least one strategy is required for attribution');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
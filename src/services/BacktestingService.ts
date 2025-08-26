import { ProfessionalStrategy, StrategyPerformance, Trade } from '../types/strategy';

export interface BacktestResult {
  strategyId: string;
  originalPerformance: StrategyPerformance;
  backtestPerformance: StrategyPerformance;
  trades: BacktestedTrade[];
  summary: BacktestSummary;
  metadata: BacktestMetadata;
}

export interface BacktestedTrade extends Trade {
  originalOutcome: 'win' | 'loss';
  backtestOutcome: 'win' | 'loss';
  originalPnL: number;
  backtestPnL: number;
  ruleChangesApplied: string[];
}

export interface BacktestSummary {
  totalTrades: number;
  tradesAffected: number;
  performanceImprovement: number; // percentage
  profitFactorChange: number;
  expectancyChange: number;
  winRateChange: number;
  maxDrawdownChange: number;
}

export interface BacktestMetadata {
  startDate: string;
  endDate: string;
  modifications: StrategyModification[];
  executionTime: number;
  confidence: number;
}

export interface StrategyModification {
  type: 'StopLoss' | 'TakeProfit' | 'PositionSize' | 'Entry' | 'Exit' | 'RiskManagement';
  field: string;
  originalValue: any;
  newValue: any;
  description: string;
}

export interface VersionComparison {
  originalStrategy: ProfessionalStrategy;
  modifiedStrategy: ProfessionalStrategy;
  performanceComparison: {
    original: StrategyPerformance;
    modified: StrategyPerformance;
    improvement: number;
  };
  tradeByTradeAnalysis: TradeComparison[];
  recommendations: string[];
}

export interface TradeComparison {
  tradeId: string;
  originalOutcome: number;
  modifiedOutcome: number;
  difference: number;
  reasonForChange: string;
}

export interface SimulationResult {
  scenario: string;
  modifications: Partial<any>;
  projectedPerformance: StrategyPerformance;
  riskMetrics: {
    maxDrawdown: number;
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
}

export class BacktestingService {
  /**
   * Run a backtest on historical strategy data with optional modifications
   */
  async runBacktest(
    strategy: ProfessionalStrategy,
    historicalTrades: Trade[],
    modifications?: StrategyModification[]
  ): Promise<BacktestResult> {
    const startTime = Date.now();
    
    // Filter trades that belong to this strategy
    const strategyTrades = historicalTrades.filter(trade => 
      (trade as any).strategyId === strategy.id
    );

    if (strategyTrades.length === 0) {
      throw new Error('No historical trades found for this strategy');
    }

    // Apply modifications to create a modified strategy
    const modifiedStrategy = modifications 
      ? this.applyModifications(strategy, modifications)
      : strategy;

    // Run backtest simulation
    const backtestTrades = await this.simulateTradesWithModifications(
      strategyTrades,
      strategy,
      modifiedStrategy
    );

    // Calculate original and backtest performance
    const originalPerformance = this.calculatePerformanceFromTrades(strategyTrades);
    const backtestPerformance = this.calculatePerformanceFromBacktestTrades(backtestTrades);

    // Generate summary
    const summary = this.generateBacktestSummary(
      originalPerformance,
      backtestPerformance,
      backtestTrades
    );

    const executionTime = Date.now() - startTime;

    return {
      strategyId: strategy.id,
      originalPerformance,
      backtestPerformance,
      trades: backtestTrades,
      summary,
      metadata: {
        startDate: strategyTrades[0]?.entryTime || new Date().toISOString(),
        endDate: strategyTrades[strategyTrades.length - 1]?.exitTime || new Date().toISOString(),
        modifications: modifications || [],
        executionTime,
        confidence: this.calculateConfidence(strategyTrades.length)
      }
    };
  }

  /**
   * Compare two versions of a strategy using historical data
   */
  async compareStrategyVersions(
    originalStrategy: ProfessionalStrategy,
    modifiedStrategy: ProfessionalStrategy,
    trades: Trade[]
  ): Promise<VersionComparison> {
    // Get trades for both strategies
    const originalTrades = trades.filter(trade => 
      (trade as any).strategyId === originalStrategy.id
    );

    // Run backtest with modified strategy rules
    const modifiedTrades = await this.simulateTradesWithModifications(
      originalTrades,
      originalStrategy,
      modifiedStrategy
    );

    // Calculate performance for both versions
    const originalPerformance = this.calculatePerformanceFromTrades(originalTrades);
    const modifiedPerformance = this.calculatePerformanceFromBacktestTrades(modifiedTrades);

    // Generate trade-by-trade comparison
    const tradeByTradeAnalysis = this.generateTradeComparison(
      originalTrades,
      modifiedTrades
    );

    // Calculate improvement percentage
    const improvement = this.calculateImprovementPercentage(
      originalPerformance,
      modifiedPerformance
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      originalPerformance,
      modifiedPerformance,
      tradeByTradeAnalysis
    );

    return {
      originalStrategy,
      modifiedStrategy,
      performanceComparison: {
        original: originalPerformance,
        modified: modifiedPerformance,
        improvement
      },
      tradeByTradeAnalysis,
      recommendations
    };
  }

  /**
   * Simulate changes to risk management parameters
   */
  async simulateRiskManagementChanges(
    strategy: ProfessionalStrategy,
    newRiskParams: Partial<any>
  ): Promise<SimulationResult> {
    // Create modified strategy with new risk parameters
    const modifiedStrategy = {
      ...strategy,
      riskManagement: {
        ...strategy.riskManagement,
        ...newRiskParams
      }
    };

    // Get historical trades for this strategy
    const historicalTrades = await this.getHistoricalTrades(strategy.id);

    // Run Monte Carlo simulation with new risk parameters
    const simulations = await this.runMonteCarloSimulation(
      modifiedStrategy,
      historicalTrades,
      1000 // number of simulations
    );

    // Calculate projected performance metrics
    const projectedPerformance = this.calculateProjectedPerformance(simulations);

    // Calculate risk metrics
    const riskMetrics = this.calculateRiskMetrics(simulations);

    // Calculate confidence intervals
    const confidenceInterval = this.calculateConfidenceInterval(simulations, 0.95);

    return {
      scenario: `Risk Management Simulation: ${Object.keys(newRiskParams).join(', ')}`,
      modifications: newRiskParams,
      projectedPerformance,
      riskMetrics,
      confidenceInterval
    };
  }

  /**
   * Apply modifications to a strategy
   */
  private applyModifications(
    strategy: ProfessionalStrategy,
    modifications: StrategyModification[]
  ): ProfessionalStrategy {
    let modifiedStrategy = { ...strategy };

    modifications.forEach(mod => {
      switch (mod.type) {
        case 'StopLoss':
          modifiedStrategy.riskManagement.stopLossRule = {
            ...modifiedStrategy.riskManagement.stopLossRule,
            [mod.field]: mod.newValue
          };
          break;
        case 'TakeProfit':
          modifiedStrategy.riskManagement.takeProfitRule = {
            ...modifiedStrategy.riskManagement.takeProfitRule,
            [mod.field]: mod.newValue
          };
          break;
        case 'PositionSize':
          modifiedStrategy.riskManagement.positionSizingMethod = {
            ...modifiedStrategy.riskManagement.positionSizingMethod,
            [mod.field]: mod.newValue
          };
          break;
        case 'RiskManagement':
          (modifiedStrategy.riskManagement as any)[mod.field] = mod.newValue;
          break;
      }
    });

    return modifiedStrategy;
  }

  /**
   * Simulate trades with modified strategy rules
   */
  private async simulateTradesWithModifications(
    originalTrades: Trade[],
    originalStrategy: ProfessionalStrategy,
    modifiedStrategy: ProfessionalStrategy
  ): Promise<BacktestedTrade[]> {
    return originalTrades.map(trade => {
      const backtestTrade: BacktestedTrade = {
        ...trade,
        originalOutcome: trade.pnl > 0 ? 'win' : 'loss',
        backtestOutcome: trade.pnl > 0 ? 'win' : 'loss',
        originalPnL: trade.pnl,
        backtestPnL: trade.pnl,
        ruleChangesApplied: []
      };

      // Apply modified stop loss rules
      if (this.hasStopLossChanges(originalStrategy, modifiedStrategy)) {
        const newPnL = this.applyStopLossModification(trade, modifiedStrategy);
        backtestTrade.backtestPnL = newPnL;
        backtestTrade.backtestOutcome = newPnL > 0 ? 'win' : 'loss';
        backtestTrade.ruleChangesApplied.push('Stop Loss Modified');
      }

      // Apply modified take profit rules
      if (this.hasTakeProfitChanges(originalStrategy, modifiedStrategy)) {
        const newPnL = this.applyTakeProfitModification(trade, modifiedStrategy);
        backtestTrade.backtestPnL = newPnL;
        backtestTrade.backtestOutcome = newPnL > 0 ? 'win' : 'loss';
        backtestTrade.ruleChangesApplied.push('Take Profit Modified');
      }

      // Apply modified position sizing
      if (this.hasPositionSizeChanges(originalStrategy, modifiedStrategy)) {
        const sizeMultiplier = this.calculatePositionSizeMultiplier(
          originalStrategy,
          modifiedStrategy
        );
        backtestTrade.backtestPnL = backtestTrade.backtestPnL * sizeMultiplier;
        backtestTrade.ruleChangesApplied.push('Position Size Modified');
      }

      return backtestTrade;
    });
  }

  /**
   * Check if stop loss rules have changed
   */
  private hasStopLossChanges(
    original: ProfessionalStrategy,
    modified: ProfessionalStrategy
  ): boolean {
    return JSON.stringify(original.riskManagement.stopLossRule) !== 
           JSON.stringify(modified.riskManagement.stopLossRule);
  }

  /**
   * Check if take profit rules have changed
   */
  private hasTakeProfitChanges(
    original: ProfessionalStrategy,
    modified: ProfessionalStrategy
  ): boolean {
    return JSON.stringify(original.riskManagement.takeProfitRule) !== 
           JSON.stringify(modified.riskManagement.takeProfitRule);
  }

  /**
   * Check if position sizing has changed
   */
  private hasPositionSizeChanges(
    original: ProfessionalStrategy,
    modified: ProfessionalStrategy
  ): boolean {
    return JSON.stringify(original.riskManagement.positionSizingMethod) !== 
           JSON.stringify(modified.riskManagement.positionSizingMethod);
  }

  /**
   * Apply stop loss modification to a trade
   */
  private applyStopLossModification(
    trade: Trade,
    modifiedStrategy: ProfessionalStrategy
  ): number {
    const stopLossRule = modifiedStrategy.riskManagement.stopLossRule;
    
    // Simulate different stop loss outcomes based on rule type
    switch (stopLossRule.type) {
      case 'ATRBased':
        // Tighter stop = more losses but smaller losses
        const atrMultiplier = stopLossRule.parameters.multiplier || 2;
        return trade.pnl < 0 ? trade.pnl * (atrMultiplier / 2) : trade.pnl;
      
      case 'PercentageBased':
        // Fixed percentage stop loss
        const stopPercent = stopLossRule.parameters.percentage || 2;
        const maxLoss = -(trade.entryPrice * trade.quantity * stopPercent / 100);
        return trade.pnl < 0 ? Math.max(trade.pnl, maxLoss) : trade.pnl;
      
      default:
        return trade.pnl;
    }
  }

  /**
   * Apply take profit modification to a trade
   */
  private applyTakeProfitModification(
    trade: Trade,
    modifiedStrategy: ProfessionalStrategy
  ): number {
    const takeProfitRule = modifiedStrategy.riskManagement.takeProfitRule;
    
    switch (takeProfitRule.type) {
      case 'RiskRewardRatio':
        const rrRatio = takeProfitRule.parameters.ratio || 2;
        const riskAmount = Math.abs(trade.pnl < 0 ? trade.pnl : trade.entryPrice * 0.02);
        const maxProfit = riskAmount * rrRatio;
        return trade.pnl > 0 ? Math.min(trade.pnl, maxProfit) : trade.pnl;
      
      default:
        return trade.pnl;
    }
  }

  /**
   * Calculate position size multiplier
   */
  private calculatePositionSizeMultiplier(
    original: ProfessionalStrategy,
    modified: ProfessionalStrategy
  ): number {
    const originalMethod = original.riskManagement.positionSizingMethod;
    const modifiedMethod = modified.riskManagement.positionSizingMethod;
    
    if (originalMethod.type === 'FixedPercentage' && modifiedMethod.type === 'FixedPercentage') {
      const originalPercent = originalMethod.parameters.percentage || 2;
      const modifiedPercent = modifiedMethod.parameters.percentage || 2;
      return modifiedPercent / originalPercent;
    }
    
    return 1; // No change if we can't calculate
  }

  /**
   * Calculate performance from regular trades
   */
  private calculatePerformanceFromTrades(trades: Trade[]): StrategyPerformance {
    if (trades.length === 0) {
      return this.getEmptyPerformance();
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    const winRate = (winningTrades.length / trades.length) * 100;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const expectancy = (winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      profitFactor,
      expectancy,
      winRate,
      averageWin,
      averageLoss,
      riskRewardRatio: averageLoss > 0 ? averageWin / averageLoss : 0,
      maxDrawdown: this.calculateMaxDrawdown(trades),
      maxDrawdownDuration: 0,
      sampleSize: trades.length,
      confidenceLevel: this.calculateConfidence(trades.length),
      statisticallySignificant: trades.length >= 30,
      monthlyReturns: [],
      performanceTrend: 'Stable',
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Calculate performance from backtest trades
   */
  private calculatePerformanceFromBacktestTrades(trades: BacktestedTrade[]): StrategyPerformance {
    const backtestTrades = trades.map(t => ({
      ...t,
      pnl: t.backtestPnL
    }));
    
    return this.calculatePerformanceFromTrades(backtestTrades);
  }

  /**
   * Generate backtest summary
   */
  private generateBacktestSummary(
    original: StrategyPerformance,
    backtest: StrategyPerformance,
    trades: BacktestedTrade[]
  ): BacktestSummary {
    const tradesAffected = trades.filter(t => 
      t.originalPnL !== t.backtestPnL || t.ruleChangesApplied.length > 0
    ).length;

    const performanceImprovement = original.expectancy !== 0 
      ? ((backtest.expectancy - original.expectancy) / Math.abs(original.expectancy)) * 100
      : 0;

    return {
      totalTrades: trades.length,
      tradesAffected,
      performanceImprovement,
      profitFactorChange: backtest.profitFactor - original.profitFactor,
      expectancyChange: backtest.expectancy - original.expectancy,
      winRateChange: backtest.winRate - original.winRate,
      maxDrawdownChange: backtest.maxDrawdown - original.maxDrawdown
    };
  }

  /**
   * Calculate maximum drawdown from trades
   */
  private calculateMaxDrawdown(trades: Trade[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;

    trades.forEach(trade => {
      runningTotal += trade.pnl;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  }

  /**
   * Calculate confidence level based on sample size
   */
  private calculateConfidence(sampleSize: number): number {
    if (sampleSize >= 100) return 95;
    if (sampleSize >= 50) return 90;
    if (sampleSize >= 30) return 80;
    if (sampleSize >= 20) return 70;
    return 60;
  }

  /**
   * Get empty performance object
   */
  private getEmptyPerformance(): StrategyPerformance {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      profitFactor: 0,
      expectancy: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      riskRewardRatio: 0,
      maxDrawdown: 0,
      maxDrawdownDuration: 0,
      sampleSize: 0,
      confidenceLevel: 0,
      statisticallySignificant: false,
      monthlyReturns: [],
      performanceTrend: 'Insufficient Data',
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Generate trade comparison analysis
   */
  private generateTradeComparison(
    originalTrades: Trade[],
    modifiedTrades: BacktestedTrade[]
  ): TradeComparison[] {
    return originalTrades.map((original, index) => {
      const modified = modifiedTrades[index];
      return {
        tradeId: original.id,
        originalOutcome: original.pnl,
        modifiedOutcome: modified.backtestPnL,
        difference: modified.backtestPnL - original.pnl,
        reasonForChange: modified.ruleChangesApplied.join(', ') || 'No changes'
      };
    });
  }

  /**
   * Calculate improvement percentage
   */
  private calculateImprovementPercentage(
    original: StrategyPerformance,
    modified: StrategyPerformance
  ): number {
    if (original.expectancy === 0) return 0;
    return ((modified.expectancy - original.expectancy) / Math.abs(original.expectancy)) * 100;
  }

  /**
   * Generate recommendations based on comparison
   */
  private generateRecommendations(
    original: StrategyPerformance,
    modified: StrategyPerformance,
    tradeAnalysis: TradeComparison[]
  ): string[] {
    const recommendations: string[] = [];

    if (modified.profitFactor > original.profitFactor) {
      recommendations.push('The modified strategy shows improved profit factor - consider implementing these changes');
    }

    if (modified.maxDrawdown < original.maxDrawdown) {
      recommendations.push('Risk management improvements reduce maximum drawdown');
    }

    if (modified.winRate > original.winRate) {
      recommendations.push('Modified rules improve win rate consistency');
    }

    const significantImprovements = tradeAnalysis.filter(t => t.difference > 0).length;
    if (significantImprovements > tradeAnalysis.length * 0.6) {
      recommendations.push('Majority of trades show improvement - strong candidate for implementation');
    }

    if (recommendations.length === 0) {
      recommendations.push('Current strategy parameters appear optimal for historical data');
    }

    return recommendations;
  }

  /**
   * Get historical trades for a strategy (placeholder - would integrate with actual data service)
   */
  private async getHistoricalTrades(strategyId: string): Promise<Trade[]> {
    // This would integrate with the actual trade data service
    // For now, return empty array
    return [];
  }

  /**
   * Run Monte Carlo simulation
   */
  private async runMonteCarloSimulation(
    strategy: ProfessionalStrategy,
    historicalTrades: Trade[],
    iterations: number
  ): Promise<StrategyPerformance[]> {
    const simulations: StrategyPerformance[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Randomly sample trades with replacement
      const sampledTrades = this.bootstrapSample(historicalTrades);
      const performance = this.calculatePerformanceFromTrades(sampledTrades);
      simulations.push(performance);
    }
    
    return simulations;
  }

  /**
   * Bootstrap sample from historical trades
   */
  private bootstrapSample(trades: Trade[]): Trade[] {
    const sample: Trade[] = [];
    for (let i = 0; i < trades.length; i++) {
      const randomIndex = Math.floor(Math.random() * trades.length);
      sample.push(trades[randomIndex]);
    }
    return sample;
  }

  /**
   * Calculate projected performance from simulations
   */
  private calculateProjectedPerformance(simulations: StrategyPerformance[]): StrategyPerformance {
    const avgExpectancy = simulations.reduce((sum, s) => sum + s.expectancy, 0) / simulations.length;
    const avgWinRate = simulations.reduce((sum, s) => sum + s.winRate, 0) / simulations.length;
    const avgProfitFactor = simulations.reduce((sum, s) => sum + s.profitFactor, 0) / simulations.length;
    
    return {
      ...this.getEmptyPerformance(),
      expectancy: avgExpectancy,
      winRate: avgWinRate,
      profitFactor: avgProfitFactor,
      totalTrades: simulations[0]?.totalTrades || 0
    };
  }

  /**
   * Calculate risk metrics from simulations
   */
  private calculateRiskMetrics(simulations: StrategyPerformance[]): {
    maxDrawdown: number;
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
  } {
    const expectancies = simulations.map(s => s.expectancy);
    const drawdowns = simulations.map(s => s.maxDrawdown);
    
    const avgExpectancy = expectancies.reduce((sum, e) => sum + e, 0) / expectancies.length;
    const volatility = Math.sqrt(
      expectancies.reduce((sum, e) => sum + Math.pow(e - avgExpectancy, 2), 0) / expectancies.length
    );
    
    return {
      maxDrawdown: Math.max(...drawdowns),
      volatility,
      sharpeRatio: volatility > 0 ? avgExpectancy / volatility : 0,
      sortinoRatio: this.calculateSortinoRatio(expectancies)
    };
  }

  /**
   * Calculate Sortino ratio
   */
  private calculateSortinoRatio(returns: number[]): number {
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const negativeReturns = returns.filter(r => r < 0);
    
    if (negativeReturns.length === 0) return avgReturn > 0 ? 999 : 0;
    
    const downwardDeviation = Math.sqrt(
      negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
    );
    
    return downwardDeviation > 0 ? avgReturn / downwardDeviation : 0;
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    simulations: StrategyPerformance[],
    confidence: number
  ): { lower: number; upper: number; confidence: number } {
    const expectancies = simulations.map(s => s.expectancy).sort((a, b) => a - b);
    const alpha = 1 - confidence;
    const lowerIndex = Math.floor(expectancies.length * alpha / 2);
    const upperIndex = Math.floor(expectancies.length * (1 - alpha / 2));
    
    return {
      lower: expectancies[lowerIndex] || 0,
      upper: expectancies[upperIndex] || 0,
      confidence
    };
  }
}
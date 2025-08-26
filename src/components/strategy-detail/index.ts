/**
 * Strategy Detail Components
 * 
 * Comprehensive strategy analytics dashboard components for detailed
 * strategy analysis, performance visualization, and trade management.
 */

export { default as StrategyDetailView } from './StrategyDetailView';
export { default as TradeDistributionAnalysis } from './TradeDistributionAnalysis';
export { default as LinkedTradesView } from './LinkedTradesView';

// Re-export types for convenience
export type {
  ProfessionalStrategy,
  StrategyPerformance,
  TradeWithStrategy,
  StrategyInsight,
  PerformancePattern,
  OptimizationSuggestion,
  MarketCorrelation
} from '../../types/strategy';
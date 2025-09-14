import { Trade } from '@/types/trade';

// Interface for strategy performance data
export interface StrategyPerformanceData {
  strategy: string;
  totalPnL: number;
  winRate: number;
  averageRMultiple: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}

// Interface for time analysis data
export interface TimeAnalysisData {
  session: string;
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  averagePnL: number;
}

// Interface for volume analysis data
export interface VolumeAnalysisData {
  averageLotSize: number;
  maxLotSize: number;
  minLotSize: number;
  totalVolume: number;
  totalTrades: number;
}

/**
 * Calculate performance metrics grouped by strategy
 */
export const calculateStrategyPerformance = (trades: Trade[]): StrategyPerformanceData[] => {
  // Group trades by strategy
  const strategyGroups = new Map<string, Trade[]>();

  trades.forEach(trade => {
    const strategy = trade.strategy || 'Unknown';
    if (!strategyGroups.has(strategy)) {
      strategyGroups.set(strategy, []);
    }
    strategyGroups.get(strategy)!.push(trade);
  });

  // Calculate metrics for each strategy
  return Array.from(strategyGroups.entries()).map(([strategy, strategyTrades]) => {
    const winningTrades = strategyTrades.filter(trade => trade.pnl && trade.pnl > 0);
    const losingTrades = strategyTrades.filter(trade => trade.pnl && trade.pnl < 0);

    const totalPnL = strategyTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winRate = strategyTrades.length > 0 ? (winningTrades.length / strategyTrades.length) * 100 : 0;

    // Calculate average R-multiple (simplified - would need risk amount per trade)
    const averageRMultiple = winRate > 0 ? totalPnL / Math.abs(totalPnL) : 0;

    return {
      strategy,
      totalPnL,
      winRate,
      averageRMultiple,
      totalTrades: strategyTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length
    };
  }).sort((a, b) => b.totalPnL - a.totalPnL); // Sort by total P&L descending
};

/**
 * Analyze trading performance by time/session
 */
export const analyzeTradingTimes = (trades: Trade[]): TimeAnalysisData[] => {
  // Group trades by session
  const sessionGroups = new Map<string, Trade[]>();

  trades.forEach(trade => {
    const session = trade.session || 'unknown';
    if (!sessionGroups.has(session)) {
      sessionGroups.set(session, []);
    }
    sessionGroups.get(session)!.push(trade);
  });

  // Calculate metrics for each session
  return Array.from(sessionGroups.entries()).map(([session, sessionTrades]) => {
    const winningTrades = sessionTrades.filter(trade => trade.pnl && trade.pnl > 0);

    const totalPnL = sessionTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winRate = sessionTrades.length > 0 ? (winningTrades.length / sessionTrades.length) * 100 : 0;
    const averagePnL = sessionTrades.length > 0 ? totalPnL / sessionTrades.length : 0;

    return {
      session: session.charAt(0).toUpperCase() + session.slice(1), // Capitalize first letter
      totalPnL,
      winRate,
      totalTrades: sessionTrades.length,
      averagePnL
    };
  }).sort((a, b) => b.totalPnL - a.totalPnL); // Sort by total P&L descending
};

/**
 * Calculate volume and sizing metrics
 */
export const calculateVolumeMetrics = (trades: Trade[]): VolumeAnalysisData => {
  if (trades.length === 0) {
    return {
      averageLotSize: 0,
      maxLotSize: 0,
      minLotSize: 0,
      totalVolume: 0,
      totalTrades: 0
    };
  }

  const lotSizes = trades
    .map(trade => trade.lotSize || 0)
    .filter(size => size > 0);

  const averageLotSize = lotSizes.length > 0
    ? lotSizes.reduce((sum, size) => sum + size, 0) / lotSizes.length
    : 0;

  const maxLotSize = lotSizes.length > 0 ? Math.max(...lotSizes) : 0;
  const minLotSize = lotSizes.length > 0 ? Math.min(...lotSizes) : 0;
  const totalVolume = lotSizes.reduce((sum, size) => sum + size, 0);

  return {
    averageLotSize,
    maxLotSize,
    minLotSize,
    totalVolume,
    totalTrades: trades.length
  };
};

/**
 * Filter trades by date range
 */
export const filterTradesByDateRange = (trades: Trade[], startDate?: Date, endDate?: Date): Trade[] => {
  if (!startDate && !endDate) return trades;

  return trades.filter(trade => {
    const tradeDate = new Date(trade.date);
    const isAfterStart = !startDate || tradeDate >= startDate;
    const isBeforeEnd = !endDate || tradeDate <= endDate;
    return isAfterStart && isBeforeEnd;
  });
};
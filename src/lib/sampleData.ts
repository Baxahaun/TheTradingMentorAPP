import { Trade } from '../types/trade';
import { tradeService } from './firebaseService';
import { CURRENT_TERMINOLOGY } from './terminologyConfig';

/**
 * Sample Futures Trades for Demo/Testing
 * Realistic futures trading scenarios with variety of outcomes and strategies
 * Uses major futures contracts like ES, NQ, CL, GC, SI
 */
export const sampleFuturesTrades: Omit<Trade, 'id'>[] = [
  {
    accountId: 'demo-account',
    currencyPair: 'ES', // E-mini S&P 500
    date: '2024-12-08',
    timeIn: '08:30:00',
    timeOut: '10:15:00',
    timestamp: Date.now(),
    session: 'us',
    side: 'long',
    entryPrice: 4567.25,
    exitPrice: 4583.50,
    spread: 0.25,
    lotSize: 2,
    lotType: 'standard',
    units: 2,
    pips: 16.25,
    pipValue: 12.50,
    pnl: 325.00,
    commission: 2.50,
    swap: 0,
    stopLoss: 4550.00,
    takeProfit: 4600.00,
    leverage: 1,
    marginUsed: 11417.00,
    accountCurrency: 'USD',
    strategy: 'Breakout',
    marketConditions: 'Bullish trend continuation',
    timeframe: '1H',
    confidence: 8,
    emotions: 'Confident',
    notes: 'Clean breakout above resistance with good volume. Followed trend perfectly.',
    status: 'closed',
    riskAmount: 340.00,
    rMultiple: 0.96
  },
  {
    accountId: 'demo-account',
    currencyPair: 'NQ', // E-mini Nasdaq-100
    date: '2024-12-08',
    timeIn: '13:45:00',
    timeOut: '14:20:00',
    timestamp: Date.now() + 86400000,
    session: 'us',
    side: 'short',
    entryPrice: 17850.25,
    exitPrice: 17775.50,
    spread: 0.50,
    lotSize: 1,
    lotType: 'standard',
    units: 1,
    pips: 74.75,
    pipValue: 20.00,
    pnl: 1495.00,
    commission: 2.00,
    swap: 0,
    stopLoss: 17900.00,
    takeProfit: 17750.00,
    leverage: 1,
    marginUsed: 17850.00,
    accountCurrency: 'USD',
    strategy: 'Reversal',
    marketConditions: 'Overbought conditions',
    timeframe: '15M',
    confidence: 7,
    emotions: 'Cautious',
    notes: 'RSI divergence signaled reversal. Quick scalp trade on tech sell-off.',
    status: 'closed',
    riskAmount: 500.00,
    rMultiple: 3.0
  },
  {
    accountId: 'demo-account',
    currencyPair: 'CL', // WTI Crude Oil
    date: '2024-12-07',
    timeIn: '22:10:00',
    timeOut: '23:55:00',
    timestamp: Date.now() + 172800000,
    session: 'us',
    side: 'long',
    entryPrice: 78.45,
    exitPrice: 77.75,
    spread: 0.02,
    lotSize: 5,
    lotType: 'standard',
    units: 5,
    pips: -70.0,
    pipValue: 10.00,
    pnl: -350.00,
    commission: 5.00,
    swap: 0,
    stopLoss: 77.50,
    takeProfit: 80.00,
    leverage: 1,
    marginUsed: 1961.00,
    accountCurrency: 'USD',
    strategy: 'Support Bounce',
    marketConditions: 'Ranging market',
    timeframe: '4H',
    confidence: 6,
    emotions: 'Frustrated',
    notes: 'Support level failed to hold. Should have waited for clearer confirmation.',
    status: 'closed',
    riskAmount: 735.00,
    rMultiple: -0.48
  },
  {
    accountId: 'demo-account',
    currencyPair: 'GC', // Gold Futures
    date: '2024-12-07',
    timeIn: '15:30:00',
    timeOut: '16:45:00',
    timestamp: Date.now() + 259200000,
    session: 'us',
    side: 'short',
    entryPrice: 2650.50,
    exitPrice: 2640.00,
    spread: 0.10,
    lotSize: 2,
    lotType: 'standard',
    units: 2,
    pips: 1050.0,
    pipValue: 10.00,
    pnl: 2100.00,
    commission: 8.00,
    swap: 0,
    stopLoss: 2660.00,
    takeProfit: 2640.00,
    leverage: 1,
    marginUsed: 13250.00,
    accountCurrency: 'USD',
    strategy: 'News Trading',
    marketConditions: 'USD weakness after data',
    timeframe: '5M',
    confidence: 9,
    emotions: 'Excited',
    notes: 'Perfect news trade! Weak US employment data triggered massive USD sell-off.',
    status: 'closed',
    riskAmount: 2100.00,
    rMultiple: 1.0
  },
  {
    accountId: 'demo-account',
    currencyPair: 'SI', // Silver Futures
    date: '2024-12-06',
    timeIn: '11:20:00',
    timeOut: '12:10:00',
    timestamp: Date.now() + 345600000,
    session: 'us',
    side: 'long',
    entryPrice: 29.85,
    exitPrice: 30.15,
    spread: 0.005,
    lotSize: 10,
    lotType: 'standard',
    units: 10,
    pips: 30.0,
    pipValue: 25.00,
    pnl: 750.00,
    commission: 4.00,
    swap: 0,
    stopLoss: 29.50,
    takeProfit: 30.25,
    leverage: 1,
    marginUsed: 7450.00,
    accountCurrency: 'USD',
    strategy: 'Channel Trading',
    marketConditions: 'Consolidation',
    timeframe: '1H',
    confidence: 7,
    emotions: 'Patient',
    notes: 'Nice bounce from channel bottom. Textbook technical analysis trade.',
    status: 'closed',
    riskAmount: 1750.00,
    rMultiple: 0.43
  }
];

/**
 * Add sample futures trades to a user's account
 * Useful for demo purposes and testing futures trading scenarios
 */
export async function addSampleTrades(userId: string): Promise<void> {
  try {
    console.log(`Adding sample ${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} trades for user:`, userId);

    for (const trade of sampleFuturesTrades) {
      await tradeService.addTrade(userId, {
        ...trade,
        notes: `${trade.notes} [SAMPLE ${CURRENT_TERMINOLOGY.instrumentLabel} DATA - Can be deleted]`
      });
    }

    console.log(`Successfully added ${sampleFuturesTrades.length} sample ${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} trades`);
  } catch (error) {
    console.error('Error adding sample trades:', error);
    throw error;
  }
}

/**
 * Remove all sample trades from a user's account
 * Identifies trades by the [SAMPLE DATA] marker in notes
 */
export async function removeSampleTrades(userId: string): Promise<number> {
  try {
    console.log(`Removing sample ${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} trades for user:`, userId);

    // Get all trades
    const allTrades = await tradeService.getTrades(userId);

    // Find sample trades (marked with [SAMPLE DATA])
    const sampleTrades = allTrades.filter(trade =>
      trade.notes?.includes(`[SAMPLE ${CURRENT_TERMINOLOGY.instrumentLabel} DATA - Can be deleted]`)
    );

    // Delete each sample trade
    for (const trade of sampleTrades) {
      await tradeService.deleteTrade(userId, trade.id);
    }

    console.log(`Successfully removed ${sampleTrades.length} sample ${CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()} trades`);
    return sampleTrades.length;
  } catch (error) {
    console.error('Error removing sample trades:', error);
    throw error;
  }
}

/**
 * Check if user has sample trades
 */
export async function hasSampleTrades(userId: string): Promise<boolean> {
  try {
    const allTrades = await tradeService.getTrades(userId);
    return allTrades.some(trade =>
      trade.notes?.includes(`[SAMPLE ${CURRENT_TERMINOLOGY.instrumentLabel} DATA - Can be deleted]`)
    );
  } catch (error) {
    console.error('Error checking for sample trades:', error);
    return false;
  }
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trade, TradingAccount, AccountStats } from '../types/trade';
import { tradeService } from '../lib/firebaseService';
import { accountService } from '../lib/accountService';
import { DataMigrationService } from '../lib/dataMigration';
import { EnhancedDataMigrationService } from '../lib/enhancedDataMigration';
import { widgetDataService } from '../lib/widgetDataService';
import navigationContextService from '../lib/navigationContextService';
import { NavigationContext } from '../types/navigation';
import { useAuth } from './AuthContext';

interface TradeContextType {
  // Trade management
  trades: Trade[];
  loading: boolean;
  addTrade: (trade: Trade) => Promise<void>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  getTradesByDate: (date: string) => Trade[];
  
  // Account management (NEW)
  accounts: TradingAccount[];
  currentAccount: TradingAccount | null;
  accountsLoading: boolean;
  addAccount: (account: Omit<TradingAccount, 'id'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<TradingAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  setActiveAccount: (accountId: string) => Promise<void>;
  
  // Analytics (updated for account support)
  getTotalPnL: (accountId?: string) => number;
  getWinRate: (accountId?: string) => number;
  getProfitFactor: (accountId?: string) => number;
  getAccountStats: (accountId: string) => AccountStats;
  getCurrentAccountTrades: () => Trade[];
  
  // Enhanced features migration (NEW)
  migrationStatus: {
    isEnhancedMigrationCompleted: boolean;
    migrationInProgress: boolean;
  };
  runEnhancedMigration: () => Promise<void>;
  getUnclassifiedTrades: () => Trade[];
  
  // Navigation and routing (NEW)
  getTradeById: (id: string) => Trade | undefined;
  getTradeSequence: (tradeId: string) => {
    current: Trade | null;
    previous: Trade | null;
    next: Trade | null;
    index: number;
    total: number;
  };
  validateTradeAccess: (tradeId: string) => boolean;
  setTradeNavigationContext: (tradeId: string, context: NavigationContext) => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const useTradeContext = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTradeContext must be used within a TradeProvider');
  }
  return context;
};

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Account management state (NEW)
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<TradingAccount | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);
  
  // Enhanced features migration state (NEW)
  const [migrationStatus, setMigrationStatus] = useState({
    isEnhancedMigrationCompleted: false,
    migrationInProgress: false
  });
  
  const { user } = useAuth();

  // Load accounts from Firebase when user changes
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setCurrentAccount(null);
      setAccountsLoading(false);
      return;
    }

    setAccountsLoading(true);
    
    // Subscribe to real-time account updates
    const unsubscribe = accountService.subscribeToAccounts(user.uid, (updatedAccounts) => {
      setAccounts(updatedAccounts);
      
      // Set current account to the active one, or first one if none active
      const activeAccount = updatedAccounts.find(acc => acc.isActive) || updatedAccounts[0] || null;
      setCurrentAccount(activeAccount);
      
      setAccountsLoading(false);
      
      // Create default account if no accounts exist
      if (updatedAccounts.length === 0) {
        accountService.createDefaultAccount(user.uid).catch(console.error);
      }
    });

    return unsubscribe;
  }, [user]);

  // Load trades from Firebase when user changes
  useEffect(() => {
    if (!user) {
      setTrades([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = tradeService.subscribeToTrades(user.uid, (updatedTrades) => {
      setTrades(updatedTrades);
      setLoading(false);
      
      // Trigger widget data refresh when trades are updated
      widgetDataService.onTradeDataChange();
    });

    return unsubscribe;
  }, [user]);

  // Migrate existing localStorage data to Firebase (one-time operation)
  useEffect(() => {
    const migrateLocalStorageData = async () => {
      if (!user) return;

      // Use the enhanced migration service
      try {
        const result = await DataMigrationService.migrateToFirebase(user.uid);
        if (result.success) {
          console.log('Migration completed:', result.migrated);
        } else {
          console.warn('Migration completed with errors:', result.errors);
        }
      } catch (error) {
        console.error('Error during migration:', error);
      }
    };

    migrateLocalStorageData();
  }, [user]);

  // Check enhanced features migration status
  useEffect(() => {
    if (!user) {
      setMigrationStatus({
        isEnhancedMigrationCompleted: false,
        migrationInProgress: false
      });
      return;
    }

    const isCompleted = EnhancedDataMigrationService.isEnhancedMigrationCompleted();
    setMigrationStatus(prev => ({
      ...prev,
      isEnhancedMigrationCompleted: isCompleted
    }));
  }, [user]);

  const addTrade = async (trade: Trade) => {
    if (!user) {
      throw new Error('User must be authenticated to add trades');
    }

    try {
      const { id, ...tradeData } = trade;
      
      // Ensure enhanced features fields are properly initialized
      const enhancedTradeData = {
        ...tradeData,
        // Initialize enhanced features as undefined for backward compatibility
        setup: tradeData.setup || undefined,
        patterns: tradeData.patterns || undefined,
        partialCloses: tradeData.partialCloses || undefined,
        positionHistory: tradeData.positionHistory || undefined,
        setupPerformance: tradeData.setupPerformance || undefined,
        patternConfluence: tradeData.patternConfluence || undefined,
        positionManagementScore: tradeData.positionManagementScore || undefined,
      };
      
      await tradeService.addTrade(user.uid, enhancedTradeData);
      // The real-time subscription will update the trades state
    } catch (error) {
      console.error('Error adding trade:', error);
      throw error;
    }
  };

  const updateTrade = async (id: string, updatedTrade: Partial<Trade>) => {
    if (!user) {
      throw new Error('User must be authenticated to update trades');
    }

    try {
      // Ensure enhanced features are properly handled in updates
      const enhancedUpdate = {
        ...updatedTrade,
        // Preserve existing enhanced features if not being updated
        ...(updatedTrade.setup !== undefined && { setup: updatedTrade.setup }),
        ...(updatedTrade.patterns !== undefined && { patterns: updatedTrade.patterns }),
        ...(updatedTrade.partialCloses !== undefined && { partialCloses: updatedTrade.partialCloses }),
        ...(updatedTrade.positionHistory !== undefined && { positionHistory: updatedTrade.positionHistory }),
        ...(updatedTrade.setupPerformance !== undefined && { setupPerformance: updatedTrade.setupPerformance }),
        ...(updatedTrade.patternConfluence !== undefined && { patternConfluence: updatedTrade.patternConfluence }),
        ...(updatedTrade.positionManagementScore !== undefined && { positionManagementScore: updatedTrade.positionManagementScore }),
      };
      
      await tradeService.updateTrade(user.uid, id, enhancedUpdate);
      // The real-time subscription will update the trades state
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  };

  const deleteTrade = async (id: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete trades');
    }

    try {
      await tradeService.deleteTrade(user.uid, id);
      // The real-time subscription will update the trades state
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  };

  // Account management functions (NEW)
  const addAccount = async (account: Omit<TradingAccount, 'id'>) => {
    if (!user) {
      throw new Error('User must be authenticated to add accounts');
    }

    try {
      await accountService.addAccount(user.uid, account);
      // The real-time subscription will update the accounts state
    } catch (error) {
      console.error('Error adding account:', error);
      throw error;
    }
  };

  const updateAccount = async (id: string, updatedAccount: Partial<TradingAccount>) => {
    if (!user) {
      throw new Error('User must be authenticated to update accounts');
    }

    try {
      await accountService.updateAccount(user.uid, id, updatedAccount);
      // The real-time subscription will update the accounts state
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete accounts');
    }

    try {
      await accountService.deleteAccount(user.uid, id);
      // The real-time subscription will update the accounts state
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const setActiveAccount = async (accountId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to set active account');
    }

    try {
      await accountService.setActiveAccount(user.uid, accountId);
      // The real-time subscription will update the accounts state
    } catch (error) {
      console.error('Error setting active account:', error);
      throw error;
    }
  };

  // Updated analytics functions to support account filtering
  const getTradesByDate = (date: string) => {
    return trades.filter(trade => trade.date === date);
  };

  const getTotalPnL = (accountId?: string) => {
    const filteredTrades = accountId 
      ? trades.filter(trade => trade.accountId === accountId)
      : trades;
    return filteredTrades.reduce((total, trade) => total + (trade.pnl || 0), 0);
  };

  const getWinRate = (accountId?: string) => {
    const filteredTrades = accountId 
      ? trades.filter(trade => trade.accountId === accountId)
      : trades;
    const closedTrades = filteredTrades.filter(trade => trade.status === 'closed');
    if (closedTrades.length === 0) return 0;
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    return (winningTrades.length / closedTrades.length) * 100;
  };

  const getProfitFactor = (accountId?: string) => {
    const filteredTrades = accountId 
      ? trades.filter(trade => trade.accountId === accountId)
      : trades;
    const closedTrades = filteredTrades.filter(trade => trade.status === 'closed');
    const wins = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losses = closedTrades.filter(trade => (trade.pnl || 0) < 0);
    
    const totalWins = wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    return totalLosses === 0 ? 0 : totalWins / totalLosses;
  };

  const getAccountStats = (accountId: string): AccountStats => {
    return accountService.calculateAccountStats(accountId, trades);
  };

  const getCurrentAccountTrades = (): Trade[] => {
    if (!currentAccount) return [];
    return trades.filter(trade => trade.accountId === currentAccount.id);
  };

  // Enhanced features migration functions (NEW)
  const runEnhancedMigration = async () => {
    if (!user || migrationStatus.migrationInProgress) return;

    setMigrationStatus(prev => ({ ...prev, migrationInProgress: true }));

    try {
      const result = await EnhancedDataMigrationService.migrateExistingTrades(user.uid);
      
      if (result.success) {
        console.log('Enhanced features migration completed:', result);
        setMigrationStatus({
          isEnhancedMigrationCompleted: true,
          migrationInProgress: false
        });
      } else {
        console.warn('Enhanced features migration completed with errors:', result.errors);
        setMigrationStatus(prev => ({ ...prev, migrationInProgress: false }));
      }
    } catch (error) {
      console.error('Enhanced features migration failed:', error);
      setMigrationStatus(prev => ({ ...prev, migrationInProgress: false }));
    }
  };

  const getUnclassifiedTrades = (): Trade[] => {
    return trades.filter(trade => 
      !trade.setup && 
      (!trade.patterns || trade.patterns.length === 0) && 
      (!trade.partialCloses || trade.partialCloses.length === 0) &&
      (!trade.positionHistory || trade.positionHistory.length === 0)
    );
  };

  // Navigation and routing functions (NEW)
  const getTradeById = (id: string): Trade | undefined => {
    return trades.find(trade => trade.id === id);
  };

  const getTradeSequence = (tradeId: string) => {
    const currentIndex = trades.findIndex(trade => trade.id === tradeId);
    const current = currentIndex >= 0 ? trades[currentIndex] : null;
    const previous = currentIndex > 0 ? trades[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < trades.length - 1 ? trades[currentIndex + 1] : null;

    return {
      current,
      previous,
      next,
      index: currentIndex,
      total: trades.length
    };
  };

  const validateTradeAccess = (tradeId: string): boolean => {
    if (!user) return false;
    const trade = getTradeById(tradeId);
    return Boolean(trade);
  };

  const setTradeNavigationContext = (tradeId: string, context: NavigationContext): void => {
    if (validateTradeAccess(tradeId)) {
      navigationContextService.setContext(tradeId, context);
    }
  };

  return (
    <TradeContext.Provider value={{
      // Trade management
      trades,
      loading,
      addTrade,
      updateTrade,
      deleteTrade,
      getTradesByDate,
      
      // Account management
      accounts,
      currentAccount,
      accountsLoading,
      addAccount,
      updateAccount,
      deleteAccount,
      setActiveAccount,
      
      // Analytics
      getTotalPnL,
      getWinRate,
      getProfitFactor,
      getAccountStats,
      getCurrentAccountTrades,
      
      // Enhanced features migration
      migrationStatus,
      runEnhancedMigration,
      getUnclassifiedTrades,
      
      // Navigation and routing
      getTradeById,
      getTradeSequence,
      validateTradeAccess,
      setTradeNavigationContext,
    }}>
      {children}
    </TradeContext.Provider>
  );
};

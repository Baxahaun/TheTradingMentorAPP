import { Trade } from '../types/trade';
import { TradeReviewData } from '../types/tradeReview';
import { errorHandlingService, TradeReviewErrorType } from './errorHandlingService';

export interface OfflineOperation {
  id: string;
  type: 'save_trade' | 'save_notes' | 'upload_chart' | 'update_workflow';
  tradeId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineStorageData {
  trades: Record<string, Trade>;
  reviewData: Record<string, TradeReviewData>;
  pendingOperations: OfflineOperation[];
  lastSync: number;
}

class OfflineDataService {
  private static instance: OfflineDataService;
  private readonly STORAGE_KEY = 'trade_review_offline_data';
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB
  private syncInProgress = false;

  private constructor() {
    this.initializeOfflineMode();
  }

  static getInstance(): OfflineDataService {
    if (!OfflineDataService.instance) {
      OfflineDataService.instance = new OfflineDataService();
    }
    return OfflineDataService.instance;
  }

  private initializeOfflineMode(): void {
    // Listen for network changes
    errorHandlingService.onNetworkChange((online) => {
      if (online && !this.syncInProgress) {
        this.syncPendingOperations();
      }
    });

    // Periodic sync when online
    setInterval(() => {
      if (errorHandlingService.isOnline() && !this.syncInProgress) {
        this.syncPendingOperations();
      }
    }, 30000); // Every 30 seconds
  }

  // Storage management
  private getOfflineData(): OfflineStorageData {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return this.createEmptyStorage();
      }
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to load offline data:', error);
      return this.createEmptyStorage();
    }
  }

  private saveOfflineData(data: OfflineStorageData): void {
    try {
      const serialized = JSON.stringify(data);
      
      // Check storage size
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        this.cleanupOldData(data);
        return;
      }

      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Storage quota exceeded
        errorHandlingService.handleError(
          errorHandlingService.createError(
            TradeReviewErrorType.STORAGE_QUOTA_EXCEEDED,
            'Local storage is full. Some data may not be saved offline.',
            error
          )
        );
        this.cleanupOldData(data);
      } else {
        console.error('Failed to save offline data:', error);
      }
    }
  }

  private createEmptyStorage(): OfflineStorageData {
    return {
      trades: {},
      reviewData: {},
      pendingOperations: [],
      lastSync: 0
    };
  }

  private cleanupOldData(data: OfflineStorageData): void {
    // Remove oldest trades and review data
    const tradeIds = Object.keys(data.trades);
    const sortedByDate = tradeIds.sort((a, b) => {
      const tradeA = data.trades[a];
      const tradeB = data.trades[b];
      return new Date(tradeA.entryDate).getTime() - new Date(tradeB.entryDate).getTime();
    });

    // Keep only the most recent 50 trades
    const toKeep = sortedByDate.slice(-50);
    const newTrades: Record<string, Trade> = {};
    const newReviewData: Record<string, TradeReviewData> = {};

    toKeep.forEach(id => {
      newTrades[id] = data.trades[id];
      if (data.reviewData[id]) {
        newReviewData[id] = data.reviewData[id];
      }
    });

    // Remove old pending operations (older than 7 days)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentOperations = data.pendingOperations.filter(
      op => op.timestamp > weekAgo
    );

    const cleanedData: OfflineStorageData = {
      trades: newTrades,
      reviewData: newReviewData,
      pendingOperations: recentOperations,
      lastSync: data.lastSync
    };

    this.saveOfflineData(cleanedData);
  }

  // Trade data management
  saveTrade(trade: Trade): void {
    const data = this.getOfflineData();
    data.trades[trade.id] = trade;
    
    if (!errorHandlingService.isOnline()) {
      this.addPendingOperation({
        id: `save_trade_${trade.id}_${Date.now()}`,
        type: 'save_trade',
        tradeId: trade.id,
        data: trade,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }

    this.saveOfflineData(data);
  }

  saveTradeReviewData(tradeId: string, reviewData: TradeReviewData): void {
    const data = this.getOfflineData();
    data.reviewData[tradeId] = reviewData;
    
    if (!errorHandlingService.isOnline()) {
      this.addPendingOperation({
        id: `save_review_${tradeId}_${Date.now()}`,
        type: 'save_notes',
        tradeId,
        data: reviewData,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }

    this.saveOfflineData(data);
  }

  getTrade(tradeId: string): Trade | null {
    const data = this.getOfflineData();
    return data.trades[tradeId] || null;
  }

  getTradeReviewData(tradeId: string): TradeReviewData | null {
    const data = this.getOfflineData();
    return data.reviewData[tradeId] || null;
  }

  getAllTrades(): Trade[] {
    const data = this.getOfflineData();
    return Object.values(data.trades);
  }

  // Pending operations management
  private addPendingOperation(operation: OfflineOperation): void {
    const data = this.getOfflineData();
    data.pendingOperations.push(operation);
    this.saveOfflineData(data);
  }

  getPendingOperations(): OfflineOperation[] {
    const data = this.getOfflineData();
    return data.pendingOperations;
  }

  private removePendingOperation(operationId: string): void {
    const data = this.getOfflineData();
    data.pendingOperations = data.pendingOperations.filter(
      op => op.id !== operationId
    );
    this.saveOfflineData(data);
  }

  // Synchronization
  async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress || !errorHandlingService.isOnline()) {
      return;
    }

    this.syncInProgress = true;
    const operations = this.getPendingOperations();

    try {
      for (const operation of operations) {
        try {
          await this.executeOperation(operation);
          this.removePendingOperation(operation.id);
        } catch (error) {
          operation.retryCount++;
          
          if (operation.retryCount >= operation.maxRetries) {
            // Max retries reached, remove operation and log error
            this.removePendingOperation(operation.id);
            errorHandlingService.handleError(
              errorHandlingService.createError(
                TradeReviewErrorType.OFFLINE_ERROR,
                `Failed to sync operation after ${operation.maxRetries} attempts`,
                { operation, error }
              )
            );
          } else {
            // Update retry count
            const data = this.getOfflineData();
            const opIndex = data.pendingOperations.findIndex(op => op.id === operation.id);
            if (opIndex >= 0) {
              data.pendingOperations[opIndex] = operation;
              this.saveOfflineData(data);
            }
          }
        }
      }

      // Update last sync time
      const data = this.getOfflineData();
      data.lastSync = Date.now();
      this.saveOfflineData(data);

    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    // This would integrate with your actual API services
    switch (operation.type) {
      case 'save_trade':
        // await tradeService.saveTrade(operation.data);
        console.log('Syncing trade:', operation.tradeId);
        break;
      
      case 'save_notes':
        // await noteService.saveNotes(operation.tradeId, operation.data);
        console.log('Syncing notes for trade:', operation.tradeId);
        break;
      
      case 'upload_chart':
        // await chartService.uploadChart(operation.tradeId, operation.data);
        console.log('Syncing chart for trade:', operation.tradeId);
        break;
      
      case 'update_workflow':
        // await workflowService.updateWorkflow(operation.tradeId, operation.data);
        console.log('Syncing workflow for trade:', operation.tradeId);
        break;
      
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Utility methods
  getStorageInfo(): {
    totalSize: number;
    tradeCount: number;
    pendingOperations: number;
    lastSync: Date | null;
  } {
    const data = this.getOfflineData();
    const serialized = JSON.stringify(data);
    
    return {
      totalSize: serialized.length,
      tradeCount: Object.keys(data.trades).length,
      pendingOperations: data.pendingOperations.length,
      lastSync: data.lastSync ? new Date(data.lastSync) : null
    };
  }

  clearOfflineData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  isDataAvailableOffline(tradeId: string): boolean {
    const data = this.getOfflineData();
    return !!data.trades[tradeId];
  }

  // Export/Import for backup
  exportOfflineData(): string {
    const data = this.getOfflineData();
    return JSON.stringify(data, null, 2);
  }

  importOfflineData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData) as OfflineStorageData;
      this.saveOfflineData(data);
    } catch (error) {
      throw new Error('Invalid offline data format');
    }
  }
}

export const offlineDataService = OfflineDataService.getInstance();
import { Trade } from '../types/trade';
import { CacheInvalidation } from './cacheService';

// Update event types
export enum UpdateEventType {
  TRADE_ADDED = 'trade_added',
  TRADE_UPDATED = 'trade_updated',
  TRADE_DELETED = 'trade_deleted',
  TRADES_BULK_UPDATE = 'trades_bulk_update',
  SETUP_UPDATED = 'setup_updated',
  PATTERN_UPDATED = 'pattern_updated',
  PARTIAL_CLOSE_ADDED = 'partial_close_added',
}

// Update event interface
export interface UpdateEvent {
  type: UpdateEventType;
  tradeId?: string;
  setupType?: string;
  patternType?: string;
  timestamp: number;
  data?: any;
}

// Debounce configuration
interface DebounceConfig {
  delay: number;
  maxWait: number;
  leading: boolean;
  trailing: boolean;
}

// Default debounce configurations for different update types
const DEBOUNCE_CONFIGS: Record<UpdateEventType, DebounceConfig> = {
  [UpdateEventType.TRADE_ADDED]: {
    delay: 300,
    maxWait: 1000,
    leading: false,
    trailing: true,
  },
  [UpdateEventType.TRADE_UPDATED]: {
    delay: 500,
    maxWait: 2000,
    leading: false,
    trailing: true,
  },
  [UpdateEventType.TRADE_DELETED]: {
    delay: 200,
    maxWait: 500,
    leading: false,
    trailing: true,
  },
  [UpdateEventType.TRADES_BULK_UPDATE]: {
    delay: 1000,
    maxWait: 3000,
    leading: false,
    trailing: true,
  },
  [UpdateEventType.SETUP_UPDATED]: {
    delay: 400,
    maxWait: 1500,
    leading: false,
    trailing: true,
  },
  [UpdateEventType.PATTERN_UPDATED]: {
    delay: 400,
    maxWait: 1500,
    leading: false,
    trailing: true,
  },
  [UpdateEventType.PARTIAL_CLOSE_ADDED]: {
    delay: 300,
    maxWait: 1000,
    leading: false,
    trailing: true,
  },
};

// Update handler function type
export type UpdateHandler = (events: UpdateEvent[]) => void | Promise<void>;

// Debounced update manager
class DebouncedUpdateManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private maxWaitTimers: Map<string, NodeJS.Timeout> = new Map();
  private pendingEvents: Map<string, UpdateEvent[]> = new Map();
  private handlers: Map<UpdateEventType, UpdateHandler[]> = new Map();

  // Register an update handler
  onUpdate(eventType: UpdateEventType, handler: UpdateHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // Emit an update event
  emit(event: UpdateEvent): void {
    const config = DEBOUNCE_CONFIGS[event.type];
    const key = this.getEventKey(event);

    // Add event to pending events
    if (!this.pendingEvents.has(key)) {
      this.pendingEvents.set(key, []);
    }
    this.pendingEvents.get(key)!.push(event);

    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set up debounced execution
    const timer = setTimeout(() => {
      this.executeHandlers(event.type, key);
    }, config.delay);

    this.timers.set(key, timer);

    // Set up max wait timer if not already set
    if (!this.maxWaitTimers.has(key)) {
      const maxWaitTimer = setTimeout(() => {
        this.executeHandlers(event.type, key);
      }, config.maxWait);

      this.maxWaitTimers.set(key, maxWaitTimer);
    }
  }

  // Execute handlers for pending events
  private async executeHandlers(eventType: UpdateEventType, key: string): Promise<void> {
    const events = this.pendingEvents.get(key) || [];
    if (events.length === 0) return;

    // Clear timers and pending events
    this.clearTimers(key);
    this.pendingEvents.delete(key);

    // Execute handlers
    const handlers = this.handlers.get(eventType) || [];
    await Promise.all(
      handlers.map(handler => {
        try {
          return handler(events);
        } catch (error) {
          console.error(`Error in update handler for ${eventType}:`, error);
        }
      })
    );
  }

  // Generate event key for grouping
  private getEventKey(event: UpdateEvent): string {
    switch (event.type) {
      case UpdateEventType.TRADE_ADDED:
      case UpdateEventType.TRADE_UPDATED:
      case UpdateEventType.TRADE_DELETED:
      case UpdateEventType.PARTIAL_CLOSE_ADDED:
        return `${event.type}_${event.tradeId || 'unknown'}`;
      case UpdateEventType.SETUP_UPDATED:
        return `${event.type}_${event.setupType || 'unknown'}`;
      case UpdateEventType.PATTERN_UPDATED:
        return `${event.type}_${event.patternType || 'unknown'}`;
      case UpdateEventType.TRADES_BULK_UPDATE:
        return event.type;
      default:
        return `${event.type}_${Date.now()}`;
    }
  }

  // Clear timers for a key
  private clearTimers(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }

    const maxWaitTimer = this.maxWaitTimers.get(key);
    if (maxWaitTimer) {
      clearTimeout(maxWaitTimer);
      this.maxWaitTimers.delete(key);
    }
  }

  // Clear all timers and pending events
  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.maxWaitTimers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.maxWaitTimers.clear();
    this.pendingEvents.clear();
  }

  // Get statistics
  getStats(): {
    pendingEvents: number;
    activeTimers: number;
    registeredHandlers: number;
  } {
    const totalPendingEvents = Array.from(this.pendingEvents.values())
      .reduce((sum, events) => sum + events.length, 0);
    
    const totalHandlers = Array.from(this.handlers.values())
      .reduce((sum, handlers) => sum + handlers.length, 0);

    return {
      pendingEvents: totalPendingEvents,
      activeTimers: this.timers.size,
      registeredHandlers: totalHandlers,
    };
  }
}

// Global debounced update manager
export const debouncedUpdateManager = new DebouncedUpdateManager();

// Debounced Update Service
export class DebouncedUpdateService {
  private updateManager: DebouncedUpdateManager;

  constructor(updateManager: DebouncedUpdateManager = debouncedUpdateManager) {
    this.updateManager = updateManager;
    this.setupDefaultHandlers();
  }

  // Setup default cache invalidation handlers
  private setupDefaultHandlers(): void {
    // Trade update handlers
    this.updateManager.onUpdate(UpdateEventType.TRADE_ADDED, (events) => {
      events.forEach(event => {
        if (event.tradeId) {
          CacheInvalidation.onTradeUpdate(event.tradeId);
        }
      });
      CacheInvalidation.onTradesUpdate();
    });

    this.updateManager.onUpdate(UpdateEventType.TRADE_UPDATED, (events) => {
      events.forEach(event => {
        if (event.tradeId) {
          CacheInvalidation.onTradeUpdate(event.tradeId);
        }
      });
      CacheInvalidation.onTradesUpdate();
    });

    this.updateManager.onUpdate(UpdateEventType.TRADE_DELETED, (events) => {
      events.forEach(event => {
        if (event.tradeId) {
          CacheInvalidation.onTradeUpdate(event.tradeId);
        }
      });
      CacheInvalidation.onTradesUpdate();
    });

    this.updateManager.onUpdate(UpdateEventType.TRADES_BULK_UPDATE, () => {
      CacheInvalidation.onTradesUpdate();
    });

    // Setup update handlers
    this.updateManager.onUpdate(UpdateEventType.SETUP_UPDATED, (events) => {
      events.forEach(event => {
        if (event.setupType) {
          CacheInvalidation.onSetupUpdate(event.setupType);
        }
      });
    });

    // Pattern update handlers
    this.updateManager.onUpdate(UpdateEventType.PATTERN_UPDATED, (events) => {
      events.forEach(event => {
        if (event.patternType) {
          CacheInvalidation.onPatternUpdate(event.patternType);
        }
      });
    });

    // Partial close handlers
    this.updateManager.onUpdate(UpdateEventType.PARTIAL_CLOSE_ADDED, (events) => {
      events.forEach(event => {
        if (event.tradeId) {
          CacheInvalidation.onTradeUpdate(event.tradeId);
        }
      });
      CacheInvalidation.onTradesUpdate();
    });
  }

  // Emit trade added event
  emitTradeAdded(trade: Trade): void {
    this.updateManager.emit({
      type: UpdateEventType.TRADE_ADDED,
      tradeId: trade.id,
      timestamp: Date.now(),
      data: trade,
    });
  }

  // Emit trade updated event
  emitTradeUpdated(trade: Trade): void {
    this.updateManager.emit({
      type: UpdateEventType.TRADE_UPDATED,
      tradeId: trade.id,
      timestamp: Date.now(),
      data: trade,
    });
  }

  // Emit trade deleted event
  emitTradeDeleted(tradeId: string): void {
    this.updateManager.emit({
      type: UpdateEventType.TRADE_DELETED,
      tradeId,
      timestamp: Date.now(),
    });
  }

  // Emit bulk trades update event
  emitTradesBulkUpdate(trades: Trade[]): void {
    this.updateManager.emit({
      type: UpdateEventType.TRADES_BULK_UPDATE,
      timestamp: Date.now(),
      data: trades,
    });
  }

  // Emit setup updated event
  emitSetupUpdated(setupType: string): void {
    this.updateManager.emit({
      type: UpdateEventType.SETUP_UPDATED,
      setupType,
      timestamp: Date.now(),
    });
  }

  // Emit pattern updated event
  emitPatternUpdated(patternType: string): void {
    this.updateManager.emit({
      type: UpdateEventType.PATTERN_UPDATED,
      patternType,
      timestamp: Date.now(),
    });
  }

  // Emit partial close added event
  emitPartialCloseAdded(tradeId: string, partialClose: any): void {
    this.updateManager.emit({
      type: UpdateEventType.PARTIAL_CLOSE_ADDED,
      tradeId,
      timestamp: Date.now(),
      data: partialClose,
    });
  }

  // Register custom update handler
  onUpdate(eventType: UpdateEventType, handler: UpdateHandler): () => void {
    return this.updateManager.onUpdate(eventType, handler);
  }

  // Clear all pending updates
  clear(): void {
    this.updateManager.clear();
  }

  // Get service statistics
  getStats(): ReturnType<DebouncedUpdateManager['getStats']> {
    return this.updateManager.getStats();
  }
}

// Global debounced update service
export const debouncedUpdateService = new DebouncedUpdateService();